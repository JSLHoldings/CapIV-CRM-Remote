"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IanFooter } from "@/components/ian-footer"

interface IanProfile {
  id: string
  profile_review_status: string
  participation_status: string
  account_status: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-800 text-slate-300 border-slate-700",
  submitted: "bg-blue-500/20 text-blue-200 border-blue-500/40",
  clarification_requested: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  admitted: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  waitlisted: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  declined: "bg-red-500/20 text-red-200 border-red-500/40",
  pending: "bg-slate-800 text-slate-300 border-slate-700",
  withdrawn: "bg-red-500/20 text-red-200 border-red-500/40",
  active: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
}

function StatusBadge({ value }: { value: string }) {
  return (
    <Badge className={`capitalize border ${STATUS_COLORS[value] ?? "bg-slate-800 text-slate-300 border-slate-700"}`}>
      {value.replace(/_/g, " ")}
    </Badge>
  )
}

export default function IanStatusPage() {
  const [profile, setProfile] = useState<IanProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/ian/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const reactivate = async () => {
    setBusy(true)
    setMessage(null)
    const res = await fetch("/api/ian/profile/reactivate", { method: "POST" })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setMessage(data.error ?? "Could not reactivate.")
      return
    }
    setProfile((prev) => (prev ? { ...prev, participation_status: "pending" } : prev))
    setMessage("Your participation has been reactivated.")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading status…</div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="px-6 py-10 mx-auto max-w-2xl text-center space-y-4">
            <p className="text-slate-300">You haven&apos;t started an IAN profile yet.</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
              <Link href="/ian/profile">Create your profile</Link>
            </Button>
          </div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="px-6 py-10">
          <div className="mx-auto max-w-2xl space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-400/80">IAN Network</p>
              <h1 className="text-2xl font-semibold text-white mt-1">Your status</h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <p className="text-xs text-slate-500">Account</p>
                <StatusBadge value={profile.account_status} />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <p className="text-xs text-slate-500">Profile review</p>
                <StatusBadge value={profile.profile_review_status} />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <p className="text-xs text-slate-500">Participation</p>
                <StatusBadge value={profile.participation_status} />
              </div>
            </div>

            {profile.profile_review_status === "submitted" && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200 flex flex-wrap items-center justify-between gap-3">
                <p>Need to fix something? You can pull your application back before a reviewer picks it up.</p>
                <Button asChild size="sm" variant="outline" className="border-blue-400/40 text-blue-100 hover:bg-blue-500/20 bg-transparent">
                  <Link href="/ian/profile">Go to profile to unsubmit</Link>
                </Button>
              </div>
            )}

            {profile.profile_review_status === "clarification_requested" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                A reviewer has requested changes to your profile. Your profile is unlocked for editing — update it and
                resubmit.{" "}
                <Link href="/ian/profile" className="underline">
                  Go to profile
                </Link>
              </div>
            )}

            {profile.participation_status === "withdrawn" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <p className="text-sm text-slate-300">You have withdrawn from IAN participation.</p>
                <Button
                  onClick={reactivate}
                  disabled={busy}
                  variant="outline"
                  className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  {busy ? "Reactivating…" : "Reactivate my participation"}
                </Button>
              </div>
            )}

            {message && <p className="text-sm text-emerald-400">{message}</p>}

            <div className="flex gap-3">
              <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <Link href="/ian/profile">Edit profile</Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                <Link href="/ian/future-interest">Future interest</Link>
              </Button>
            </div>
          </div>
        </div>
        <IanFooter />
      </DashboardShell>
    </ProtectedRoute>
  )
}
