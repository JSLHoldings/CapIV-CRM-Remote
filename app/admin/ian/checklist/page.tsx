"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface TodoItem {
  id: string
  code: string
  owner: string
  description: string
  completion_condition: string
  status: "open" | "done"
  sort_order: number
}

export default function IanChecklistPage() {
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const supabase = createClient()

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = await getToken()
    if (!token) {
      setError("No active session.")
      setLoading(false)
      return
    }
    const res = await fetch("/api/ian/admin/todo", { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to load checklist.")
      return
    }
    setItems(data.items ?? [])
  }, [getToken])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (item: TodoItem) => {
    setBusyId(item.id)
    const token = await getToken()
    const nextStatus = item.status === "done" ? "open" : "done"
    await fetch("/api/ian/admin/todo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    })
    setBusyId(null)
    load()
  }

  const doneCount = items.filter((i) => i.status === "done").length

  return (
    <ProtectedRoute requireAdmin>
      <DashboardShell>
        <div className="px-8 py-10">
          <div className="mx-auto max-w-3xl space-y-8">
            <div>
              <Link href="/admin/ian" className="text-xs text-slate-500 hover:text-slate-300">
                ← Back to queue
              </Link>
              <div className="flex items-center justify-between mt-1">
                <h1 className="text-2xl font-semibold text-white">Launch checklist</h1>
                <Badge className="bg-slate-800 text-slate-300 border border-slate-700">
                  {doneCount}/{items.length} complete
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Open business decisions and setup steps from Section 11 of the IAN Beta Framework. Toggling is fully
                reversible and logged to the status ledger.
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                      item.status === "done" ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 bg-slate-900/60"
                    }`}
                  >
                    <Checkbox
                      checked={item.status === "done"}
                      disabled={busyId === item.id}
                      onCheckedChange={() => toggle(item)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            item.status === "done" ? "text-emerald-200 line-through" : "text-white"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Owner: {item.owner}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Done when: {item.completion_condition}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
