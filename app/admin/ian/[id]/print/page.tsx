"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
  acts_personally: boolean | null
  account_status: string
  profile_review_status: string
  participation_status: string
  created_at?: string
}

interface StatusEvent {
  id: string
  status_field: string
  capability_key: string | null
  from_status: string | null
  to_status: string
  rationale: string | null
  created_at: string
}

interface Evidence {
  id: string
  claim: string
  evidence_state: string
  file_url: string | null
  superseded_by: string | null
  created_at: string
}

export default function IanPrintPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
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
    setEvidence(data.evidence ?? [])
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!loading && profile) {
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [loading, profile])

  if (loading) return <p style={{ padding: 32, fontFamily: "sans-serif" }}>Loading profile...</p>
  if (error || !profile)
    return (
      <p style={{ padding: 32, fontFamily: "sans-serif", color: "#b91c1c" }}>{error ?? "Profile not found."}</p>
    )

  const latestDecision = events.find((e) => e.status_field === "profile_review")
  const activeEvidence = evidence.filter((e) => !e.superseded_by)
  const grants = events.filter((e) => e.status_field === "capability_grant")
  const grantedKeys = Array.from(new Set(grants.map((g) => g.capability_key))).filter(Boolean)

  return (
    <div style={{ fontFamily: "Georgia, serif", color: "#111", maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <style>{`
        @media print {
          @page { margin: 0.75in; }
          button { display: none; }
        }
        h1, h2 { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td, th { text-align: left; padding: 4px 8px; vertical-align: top; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
        th { width: 180px; color: #555; font-family: Arial, sans-serif; font-weight: 600; }
        section { margin-bottom: 24px; }
      `}</style>

      <button
        onClick={() => window.print()}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Print / Save as PDF
      </button>

      <h1 style={{ fontSize: 22, marginBottom: 0 }}>IAN Profile Overview</h1>
      <p style={{ color: "#666", marginTop: 4, fontSize: 13 }}>Generated {new Date().toLocaleString()}</p>

      <section>
        <h2 style={{ fontSize: 15, borderBottom: "2px solid #111", paddingBottom: 4 }}>Identity</h2>
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <td>{profile.name_display || "—"}</td>
            </tr>
            <tr>
              <th>Organization</th>
              <td>{profile.organization || "—"}</td>
            </tr>
            <tr>
              <th>Title</th>
              <td>{profile.title || "—"}</td>
            </tr>
            <tr>
              <th>Location</th>
              <td>{[profile.state, profile.country].filter(Boolean).join(", ") || "—"}</td>
            </tr>
            <tr>
              <th>Acting personally</th>
              <td>{profile.acts_personally === null ? "—" : profile.acts_personally ? "Yes" : "No, on behalf of an organization"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 15, borderBottom: "2px solid #111", paddingBottom: 4 }}>Participation</h2>
        <table>
          <tbody>
            <tr>
              <th>Roles</th>
              <td>{(profile.participation_roles ?? []).join(", ") || "—"}</td>
            </tr>
            <tr>
              <th>Intent</th>
              <td>{profile.intent || "—"}</td>
            </tr>
            <tr>
              <th>Sectors / Markets / Geo</th>
              <td>
                {[profile.interests?.sectors, profile.interests?.markets, profile.interests?.geo]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 15, borderBottom: "2px solid #111", paddingBottom: 4 }}>Current Status</h2>
        <table>
          <tbody>
            <tr>
              <th>Account status</th>
              <td>{profile.account_status}</td>
            </tr>
            <tr>
              <th>Profile review</th>
              <td>{profile.profile_review_status}</td>
            </tr>
            <tr>
              <th>Participation</th>
              <td>{profile.participation_status}</td>
            </tr>
            <tr>
              <th>Last reviewer rationale</th>
              <td>{latestDecision?.rationale || "—"}</td>
            </tr>
            <tr>
              <th>Granted capabilities</th>
              <td>{grantedKeys.length ? grantedKeys.join(", ") : "None"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: 15, borderBottom: "2px solid #111", paddingBottom: 4 }}>Submitted Documents</h2>
        {activeEvidence.length === 0 ? (
          <p style={{ fontSize: 13, color: "#666" }}>No documents submitted.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Evidence state</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {activeEvidence.map((e) => (
                <tr key={e.id}>
                  <td>{e.claim}</td>
                  <td>{e.evidence_state.replace(/_/g, " ")}</td>
                  <td>{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p style={{ fontSize: 11, color: "#999", marginTop: 32 }}>
        Internal review document. Not for external distribution. Profile ID: {profile.id}
      </p>
    </div>
  )
}
