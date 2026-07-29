"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LogIn,
  LogOut,
  UserPlus,
  FileText,
  Settings,
  Shield,
  RefreshCw,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"

interface ActivityRow {
  id: string
  user_id: string
  user_email: string | null
  user_name: string | null
  action: string
  category: string
  metadata: Record<string, unknown> | null
  created_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  profile: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  documents: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  deals: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  compliance: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  verification: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  navigation: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  admin: "bg-red-500/15 text-red-300 border-red-500/30",
  general: "bg-slate-700/40 text-slate-300 border-slate-600/30",
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  auth: <LogIn className="w-3.5 h-3.5" />,
  profile: <Settings className="w-3.5 h-3.5" />,
  documents: <FileText className="w-3.5 h-3.5" />,
  deals: <Activity className="w-3.5 h-3.5" />,
  compliance: <Shield className="w-3.5 h-3.5" />,
  verification: <Shield className="w-3.5 h-3.5" />,
  admin: <UserPlus className="w-3.5 h-3.5" />,
  general: <Activity className="w-3.5 h-3.5" />,
}

function formatTs(ts: string) {
  const d = new Date(ts)
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  }
}

const PAGE_SIZE = 20

export function AdminActivityLog() {
  const [logs, setLogs] = useState<ActivityRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("")
  const [users, setUsers] = useState<{ id: string; email: string; name: string }[]>([])
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")

    // Get the current session token to pass to the admin API route.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIsLoading(false)
      setFetchError("No active session.")
      return
    }

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      category: categoryFilter,
      userId: userFilter,
      search,
    })

    const res = await fetch(`/api/admin/activity?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setIsLoading(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setFetchError(body.error ?? `Request failed (${res.status})`)
      return
    }

    const body = await res.json()
    setLogs(body.data ?? [])
    setTotal(body.total ?? 0)
    setLastRefreshed(new Date())

    // Build unique-user list from whatever the API returned.
    setUsers((prev) => {
      const seen = new Set(prev.map((u) => u.id))
      const next = [...prev]
      for (const row of (body.data ?? []) as ActivityRow[]) {
        if (!seen.has(row.user_id)) {
          seen.add(row.user_id)
          next.push({ id: row.user_id, email: row.user_email ?? "", name: row.user_name ?? "" })
        }
      }
      return next
    })
  }, [page, categoryFilter, userFilter, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(0)
  }, [search, categoryFilter, userFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const exportCSV = () => {
    const headers = ["Timestamp", "User", "Email", "Action", "Category", "Metadata"]
    const rows = logs.map((l) => [
      new Date(l.created_at).toISOString(),
      l.user_name ?? "",
      l.user_email ?? "",
      l.action,
      l.category,
      l.metadata ? JSON.stringify(l.metadata) : "",
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `capiv-activity-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: total.toLocaleString() },
          { label: "Unique Users", value: users.length.toLocaleString() },
          {
            label: "Auth Events",
            value: logs.filter((l) => l.category === "auth").length.toLocaleString(),
          },
          {
            label: "Last Refreshed",
            value: lastRefreshed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 space-y-0.5"
          >
            <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className="text-lg font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                User Activity Log
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-0.5">
                Every tracked action stored in the database with timestamp.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportCSV}
                className="border-slate-700 text-slate-300 hover:text-white text-xs h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLogs}
                disabled={isLoading}
                className="border-slate-700 text-slate-300 hover:text-white text-xs h-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + filter row */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input
                placeholder="Search action, email or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 text-sm h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-slate-950 border-slate-800 text-slate-300 text-sm h-9">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All categories</SelectItem>
                {Object.keys(CATEGORY_COLORS).map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48 bg-slate-950 border-slate-800 text-slate-300 text-sm h-9">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {fetchError && (
            <Alert variant="destructive">
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}

          {/* Log table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No activity found.</p>
              <p className="text-xs mt-1">Activity is recorded as users interact with the platform.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-44">
                      Timestamp
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                      Action
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-48">
                      Metadata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => {
                    const { date, time } = formatTs(log.created_at)
                    const catColor = CATEGORY_COLORS[log.category] ?? CATEGORY_COLORS.general
                    const catIcon = CATEGORY_ICONS[log.category] ?? CATEGORY_ICONS.general
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-slate-200 text-xs font-mono">{time}</p>
                          <p className="text-slate-500 text-xs">{date}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-200 text-sm font-medium leading-none">
                            {log.user_name || "—"}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">{log.user_email || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-100 text-sm">{log.action}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-xs border font-normal flex items-center gap-1 w-fit ${catColor}`}
                          >
                            {catIcon}
                            {log.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-[12rem]">
                          {log.metadata ? (
                            <p className="text-slate-400 text-xs font-mono truncate" title={JSON.stringify(log.metadata)}>
                              {JSON.stringify(log.metadata)}
                            </p>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-slate-700 text-slate-400 h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-400 tabular-nums">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-slate-700 text-slate-400 h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
