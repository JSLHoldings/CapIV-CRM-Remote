"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: string
  status: string
  opened_at: string
  closed_at: string | null
  ian_profiles: {
    id: string
    name_display: string | null
    organization: string | null
    profile_review_status: string
    participation_status: string
  }
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "waiting_on_participant", label: "Waiting on participant" },
  { value: "closed", label: "Closed" },
]

export default function IanAdminQueuePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<{ counts: Record<string, number>; avgTimeToReviewHours: number | null } | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState("open")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError("No active session.")
      setLoading(false)
      return
    }
    const res = await fetch(`/api/ian/admin/queue?status=${statusFilter}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to load queue.")
      return
    }
    setTasks(data.tasks ?? [])
    setMetrics(data.metrics ?? null)
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return (
    <ProtectedRoute requireAdmin>
      <DashboardShell>
        <div className="px-8 py-10">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-blue-400/70 mb-2">IAN Review</p>
                <h1 className="text-2xl font-semibold text-white">Review queue</h1>
              </div>
              <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <Link href="/admin/ian/checklist">Launch checklist</Link>
              </Button>
            </div>

            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Open", value: metrics.counts.open },
                  { label: "Waiting on participant", value: metrics.counts.waiting_on_participant },
                  { label: "Closed", value: metrics.counts.closed },
                  {
                    label: "Avg. time to review",
                    value:
                      metrics.avgTimeToReviewHours != null ? `${metrics.avgTimeToReviewHours.toFixed(1)}h` : "—",
                  },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="text-lg font-semibold text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-56 bg-slate-950 border-slate-800 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                Refresh
              </Button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No tasks in this queue.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/admin/ian/${task.ian_profiles.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {task.ian_profiles.name_display ?? "Unnamed profile"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{task.ian_profiles.organization ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30 capitalize">
                          {task.ian_profiles.profile_review_status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Opened {new Date(task.opened_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
