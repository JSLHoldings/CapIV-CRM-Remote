"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Profile {
  id: string
  name_display: string | null
  organization: string | null
  title: string | null
  country: string | null
  state: string | null
  participation_roles: string[]
  interests: Record<string, string>
  intent: string | null
  account_status: string
  profile_review_status: string
  participation_status: string
}

interface StatusEvent {
  id: string
  status_field: string
  capability_key: string | null
  from_status: string | null
  to_status: string
  actor_id: string | null
  rationale: string | null
  reverses_event_id: string | null
  created_at: string
}

interface IqPacket {
  id: string
  model: string
  is_fallback: boolean
  output: Record<string, unknown>
  created_at: string
}

const DECISIONS = [
  { value: "admit", label: "Admit" },
  { value: "waitlist", label: "Waitlist" },
  { value: "decline", label: "Decline" },
  { value: "request_clarification", label: "Request clarification" },
]

const GRANTABLE = [
  { value: "browse_people_or_opportunities", label: "Browse people / opportunities" },
  { value: "submit_formal_deals", label: "Submit formal deals" },
  { value: "diligence_and_underwriting", label: "Diligence & underwriting" },
  { value: "automated_matching", label: "Automated matching" },
  { value: "transaction_agreements", label: "Transaction agreements" },
]

export default function IanCaseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [iqPackets, setIqPackets] = useState<IqPacket[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [decision, setDecision] = useState("admit")
  const [rationale, setRationale] = useState("")
  const [busy, setBusy] = useState(false)

  const [grantCapability, setGrantCapability] = useState(GRANTABLE[0].value)
  const [grantRationale, setGrantRationale] = useState("")

  const [iqBusy, setIqBusy] = useState(false)

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
    const res = await fetch(`/api/ian/admin/profiles/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to load profile.")
      return
    }
    setProfile(data.profile)
    setEvents(data.events ?? [])
    setIqPackets(data.iqPackets ?? [])
    setEvidence(data.evidence ?? [])
  }, [id, getToken])

  useEffect(() => {
    load()
  }, [load])

  const capabilityStatus = (capability: string) => {
    const relevant = events.filter((e) => e.status_field === "capability_grant" && e.capability_key === capability)
    return relevant[0]?.to_status ?? "not_granted"
  }

  const submitDecision = async () => {
    if (!rationale.trim()) {
      setMessage("A rationale is required.")
      return
    }
    setBusy(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch(`/api/ian/admin/profiles/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ decision, rationale: rationale.trim() }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMessage(data.error ?? "Decision failed.")
      return
    }
    setRationale("")
    setMessage("Decision recorded.")
    load()
  }

  const submitGrant = async (action: "grant" | "revoke") => {
    if (!grantRationale.trim()) {
      setMessage("A rationale is required for grant/revoke.")
      return
    }
    setBusy(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch(`/api/ian/admin/profiles/${id}/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ capability: grantCapability, action, rationale: grantRationale.trim() }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMessage(data.error ?? "Grant action failed.")
      return
    }
    setGrantRationale("")
    setMessage(`Capability ${action === "grant" ? "granted" : "revoked"}.`)
    load()
  }

  const reverse = async (eventId: string) => {
    const eventRationale = window.prompt("Reason for reversing this event (optional):") ?? ""
    setBusy(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch(`/api/ian/admin/profiles/${id}/reverse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId, rationale: eventRationale || null }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMessage(data.error ?? "Reversal failed.")
      return
    }
    setMessage("Event reversed.")
    load()
  }

  const generateIqPacket = async () => {
    setIqBusy(true)
    setMessage(null)
    const token = await getToken()
    const res = await fetch(`/api/ian/admin/profiles/${id}/iq-packet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setIqBusy(false)
    if (data.fallback) {
      setMessage(data.error ?? "IQ packet generation failed — manual review required.")
    } else if (!res.ok) {
      setMessage(data.error ?? "IQ packet generation failed.")
    } else {
      setMessage("IQ packet generated.")
    }
    load()
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardShell>
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading case…</div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  if (error || !profile) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardShell>
          <div className="px-8 py-10 text-center text-sm text-red-400">{error ?? "Profile not found."}</div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  const latestPacket = iqPackets[0]

  return (
    <ProtectedRoute requireAdmin>
      <DashboardShell>
        <div className="px-8 py-10">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/admin/ian" className="text-xs text-slate-500 hover:text-slate-300">
                  ← Back to queue
                </Link>
                <h1 className="text-2xl font-semibold text-white mt-1">{profile.name_display ?? "Unnamed profile"}</h1>
                <p className="text-sm text-slate-400">{profile.organization}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  {profile.profile_review_status.replace(/_/g, " ")}
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30 capitalize">
                  {profile.participation_status.replace(/_/g, " ")}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/admin/ian/${id}/print`, "_blank", "noopener,noreferrer")}
                >
                  Export PDF
                </Button>
              </div>
            </div>

            {message && <p className="text-sm text-blue-300">{message}</p>}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <p className="text-sm font-semibold text-white">Profile snapshot</p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Title</dt>
                    <dd className="text-slate-200">{profile.title ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Location</dt>
                    <dd className="text-slate-200">
                      {[profile.state, profile.country].filter(Boolean).join(", ") || "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Roles</dt>
                    <dd className="text-slate-200">{(profile.participation_roles ?? []).join(", ") || "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Intent</dt>
                    <dd className="text-slate-200 leading-relaxed">{profile.intent ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">IQ review packet (advisory)</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateIqPacket}
                    disabled={iqBusy}
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    {iqBusy ? "Generating…" : "Generate"}
                  </Button>
                </div>
                {!latestPacket ? (
                  <p className="text-xs text-slate-500">No packet generated yet.</p>
                ) : latestPacket.is_fallback ? (
                  <p className="text-xs text-amber-300">
                    Generation failed — manual review required. {(latestPacket.output as any)?.reason}
                  </p>
                ) : (
                  <div className="text-xs text-slate-300 space-y-2">
                    <p className="leading-relaxed">{(latestPacket.output as any).profileSummary}</p>
                    <p className="text-slate-500">
                      Suggested route:{" "}
                      <span className="text-slate-200">{(latestPacket.output as any).proposedRoute}</span>
                    </p>
                    <p className="text-amber-300/80 italic">{(latestPacket.output as any).confidenceCaveat}</p>
                  </div>
                )}
              </section>
            </div>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Decision</p>
              <div className="flex flex-wrap gap-3 items-start">
                <Select value={decision} onValueChange={setDecision}>
                  <SelectTrigger className="w-56 bg-slate-950 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {DECISIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Rationale (required)"
                  className="flex-1 min-w-56 bg-slate-950 border-slate-700 text-slate-100 min-h-10"
                />
                <Button onClick={submitDecision} disabled={busy} className="bg-blue-600 hover:bg-blue-500 text-white">
                  Apply
                </Button>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Capability grants</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {GRANTABLE.map((cap) => (
                  <div
                    key={cap.value}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <span className="text-sm text-slate-200">{cap.label}</span>
                    <Badge
                      className={`capitalize border ${
                        capabilityStatus(cap.value) === "granted"
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {capabilityStatus(cap.value).replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-start pt-2">
                <Select value={grantCapability} onValueChange={setGrantCapability}>
                  <SelectTrigger className="w-64 bg-slate-950 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {GRANTABLE.map((cap) => (
                      <SelectItem key={cap.value} value={cap.value}>
                        {cap.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={grantRationale}
                  onChange={(e) => setGrantRationale(e.target.value)}
                  placeholder="Rationale (required)"
                  className="flex-1 min-w-56 bg-slate-950 border-slate-700 text-slate-100 min-h-10"
                />
                <Button
                  onClick={() => submitGrant("grant")}
                  disabled={busy}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Grant
                </Button>
                <Button
                  onClick={() => submitGrant("revoke")}
                  disabled={busy}
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                >
                  Revoke
                </Button>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Status history (every action is reversible)</p>
              {events.length === 0 ? (
                <p className="text-xs text-slate-500">No status events yet.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => {
                    const isReversed = events.some((e) => e.reverses_event_id === event.id)
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200">
                            <span className="text-slate-500">{event.status_field.replace(/_/g, " ")}</span>
                            {event.capability_key ? ` (${event.capability_key})` : ""}: {event.from_status ?? "—"} →{" "}
                            {event.to_status}
                          </p>
                          {event.rationale && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{event.rationale}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-0.5">
                            {new Date(event.created_at).toLocaleString()}
                            {event.reverses_event_id ? " · reversal" : ""}
                            {isReversed ? " · reversed" : ""}
                          </p>
                        </div>
                        {!isReversed && !event.reverses_event_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reverse(event.id)}
                            disabled={busy}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
                          >
                            Reverse
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {evidence.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <p className="text-sm font-semibold text-white">Evidence</p>
                <div className="space-y-2">
                  {evidence.map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                      <p className="text-sm text-slate-200">{item.claim}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {item.evidence_state.replace(/_/g, " ")} {item.source ? `· ${item.source}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
