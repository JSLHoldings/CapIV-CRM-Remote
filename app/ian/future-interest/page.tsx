"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { IanFooter } from "@/components/ian-footer"

interface FutureInterestItem {
  id: string
  area_of_interest: string
  note: string | null
  status: "active" | "withdrawn"
  created_at: string
}

export default function FutureInterestPage() {
  const [items, setItems] = useState<FutureInterestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [area, setArea] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    fetch("/api/ian/future-interest")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!area.trim()) {
      setError("Area of interest is required.")
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch("/api/ian/future-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", areaOfInterest: area.trim(), note: note.trim() || null }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to save.")
      return
    }
    setArea("")
    setNote("")
    load()
  }

  const toggle = async (id: string, action: "withdraw" | "reactivate") => {
    setBusyId(id)
    await fetch("/api/ian/future-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    })
    setBusyId(null)
    load()
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="px-6 py-10">
          <div className="mx-auto max-w-2xl space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-400/80">IAN Network</p>
              <h1 className="text-2xl font-semibold text-white mt-1">Future interest</h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Register intent in a future opportunity area. This is not a formal deal submission and creates no
                commitment on either side — formal deal intake is not yet enabled in this beta.
              </p>
            </div>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Area of interest</Label>
                <Input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Industrial acquisitions, Southeast US"
                  className="bg-slate-950 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-slate-100 min-h-20"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={create} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                {submitting ? "Saving…" : "Add future interest"}
              </Button>
            </section>

            <section className="space-y-3">
              <p className="text-sm font-semibold text-white">Your entries</p>
              {loading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-slate-500">No future interest entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.area_of_interest}</p>
                        {item.note && <p className="text-xs text-slate-400 mt-1">{item.note}</p>}
                        <Badge
                          className={`mt-2 border ${
                            item.status === "active"
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => toggle(item.id, item.status === "active" ? "withdraw" : "reactivate")}
                        className="border-slate-700 text-slate-200 hover:bg-slate-800 shrink-0"
                      >
                        {item.status === "active" ? "Withdraw" : "Reactivate"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        <IanFooter />
      </DashboardShell>
    </ProtectedRoute>
  )
}
