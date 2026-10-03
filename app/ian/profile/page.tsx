"use client"

import { useEffect, useState, useCallback } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const PARTICIPATION_ROLES = [
  { value: "investor", label: "Investor" },
  { value: "founder", label: "Founder" },
  { value: "sponsor", label: "Sponsor" },
  { value: "advisor", label: "Advisor" },
  { value: "strategic-partner", label: "Strategic Partner" },
  { value: "exploring", label: "Still Exploring" },
]

const TERMS_VERSION = "v1.0-beta"
const PRIVACY_VERSION = "v1.0-beta"

interface IanProfile {
  id?: string
  name_display?: string | null
  organization?: string | null
  title?: string | null
  country?: string | null
  state?: string | null
  participation_roles?: string[]
  interests?: { sectors?: string; markets?: string; geo?: string }
  intent?: string | null
  acts_personally?: boolean | null
  org_website?: string | null
  publication_opt_in?: boolean
  profile_review_status?: string
}

export default function IanProfilePage() {
  const [profile, setProfile] = useState<IanProfile>({ participation_roles: [], interests: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/ian/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const isLocked = profile.profile_review_status === "submitted"

  const toggleRole = (value: string) => {
    setProfile((prev) => {
      const roles = prev.participation_roles ?? []
      return {
        ...prev,
        participation_roles: roles.includes(value) ? roles.filter((r) => r !== value) : [...roles, value],
      }
    })
  }

  const saveDraft = useCallback(async () => {
    setSaving(true)
    setError(null)
    const sourceContext = typeof window !== "undefined" ? sessionStorage.getItem("ian_source") : null
    const referralContext = typeof window !== "undefined" ? sessionStorage.getItem("ian_referral_context") : null

    const res = await fetch("/api/ian/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        source: profile.id ? undefined : sourceContext ?? "direct",
        referral_context: profile.id ? undefined : referralContext ?? null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to save draft.")
      return
    }
    setProfile(data.profile)
    setMessage("Draft saved.")
    setTimeout(() => setMessage(null), 2500)
  }, [profile])

  const submitForReview = async () => {
    setSubmitting(true)
    setError(null)
    await saveDraft()
    const res = await fetch("/api/ian/profile/submit", { method: "POST" })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to submit profile.")
      return
    }
    setProfile((prev) => ({ ...prev, profile_review_status: "submitted" }))
    setMessage("Profile submitted for review.")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">Loading profile…</div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="px-6 py-10">
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-blue-400/80">IAN Network</p>
                <h1 className="text-2xl font-semibold text-white mt-1">My IAN Profile</h1>
              </div>
              {profile.profile_review_status && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700 capitalize">
                  {profile.profile_review_status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            {isLocked && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Your profile is under review and locked for editing. It reopens automatically if a reviewer requests
                clarification. Check{" "}
                <Link href="/ian/status" className="underline">
                  your status
                </Link>{" "}
                for updates.
              </div>
            )}

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Identity & role</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Display name</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.name_display ?? ""}
                    onChange={(e) => setProfile({ ...profile, name_display: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Title</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.title ?? ""}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Organization</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.organization ?? ""}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Organization website</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.org_website ?? ""}
                    onChange={(e) => setProfile({ ...profile, org_website: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Country</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.country ?? ""}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">State / Region</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.state ?? ""}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="acts_personally"
                  disabled={isLocked}
                  checked={!!profile.acts_personally}
                  onCheckedChange={(checked) => setProfile({ ...profile, acts_personally: checked === true })}
                />
                <Label htmlFor="acts_personally" className="text-sm text-slate-300">
                  I act in my personal capacity (not solely on behalf of an organization)
                </Label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Participation roles</p>
              <p className="text-xs text-slate-500">Select every role that describes your interest in IAN.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PARTICIPATION_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 cursor-pointer"
                  >
                    <Checkbox
                      disabled={isLocked}
                      checked={(profile.participation_roles ?? []).includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <span className="text-sm text-slate-200">{role.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Interests</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Sectors</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.interests?.sectors ?? ""}
                    onChange={(e) => setProfile({ ...profile, interests: { ...profile.interests, sectors: e.target.value } })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                    placeholder="e.g. multifamily, industrial"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Markets</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.interests?.markets ?? ""}
                    onChange={(e) => setProfile({ ...profile, interests: { ...profile.interests, markets: e.target.value } })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                    placeholder="e.g. Sunbelt"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Geography</Label>
                  <Input
                    disabled={isLocked}
                    value={profile.interests?.geo ?? ""}
                    onChange={(e) => setProfile({ ...profile, interests: { ...profile.interests, geo: e.target.value } })}
                    className="bg-slate-950 border-slate-700 text-slate-100"
                    placeholder="e.g. US Southeast"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Intent — what brings you to IAN?</Label>
                <Textarea
                  disabled={isLocked}
                  value={profile.intent ?? ""}
                  onChange={(e) => setProfile({ ...profile, intent: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-slate-100 min-h-24"
                />
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Consent</p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="publication_opt_in"
                  disabled={isLocked}
                  checked={!!profile.publication_opt_in}
                  onCheckedChange={(checked) => setProfile({ ...profile, publication_opt_in: checked === true })}
                />
                <Label htmlFor="publication_opt_in" className="text-sm text-slate-300">
                  I would like to be listed in a future participant directory (feature not yet enabled)
                </Label>
              </div>
              <p className="text-xs text-slate-500">
                By submitting, you agree to Terms of Participation {TERMS_VERSION} and the Privacy Notice{" "}
                {PRIVACY_VERSION}. This is not an offer, solicitation, or commitment of any kind.
              </p>
            </section>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}

            {!isLocked && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving || submitting}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  {saving ? "Saving…" : "Save draft"}
                </Button>
                <Button onClick={submitForReview} disabled={saving || submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                  {submitting ? "Submitting…" : "Submit for review"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
