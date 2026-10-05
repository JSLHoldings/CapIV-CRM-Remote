"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, User, X } from "lucide-react"
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

const AUTHORITY_DOC_LABEL = "Proof of Authority to Act"
const DOCUMENT_TYPES = [
  "Government-Issued ID",
  "Proof of Address",
  "Organization Formation Document",
  AUTHORITY_DOC_LABEL,
  "Accreditation / Qualification Evidence",
  "Other Supporting Material",
]

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
  photo_pathname?: string | null
}

interface IanEvidence {
  id: string
  claim: string
  file_url: string | null
  evidence_state: string
  superseded_by: string | null
  created_at: string
}

export default function IanProfilePage() {
  const [profile, setProfile] = useState<IanProfile>({ participation_roles: [], interests: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [unsubmitting, setUnsubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<IanEvidence[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [docLabel, setDocLabel] = useState("")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const needsAuthorityDoc = profile.acts_personally === false
  const hasAuthorityDoc = documents.some((d) => !d.superseded_by && d.claim === AUTHORITY_DOC_LABEL)

  const loadDocuments = useCallback(() => {
    setDocsLoading(true)
    fetch("/api/ian/evidence")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.evidence ?? [])
        setDocsLoading(false)
      })
      .catch(() => setDocsLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/ian/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    loadDocuments()
  }, [loadDocuments])

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

  const unsubmit = async () => {
    setUnsubmitting(true)
    setError(null)
    const res = await fetch("/api/ian/profile/unsubmit", { method: "POST" })
    const data = await res.json()
    setUnsubmitting(false)
    if (!res.ok) {
      setError(data.error ?? "Could not unsubmit.")
      return
    }
    setProfile((prev) => ({ ...prev, profile_review_status: data.reviewEvent.to_status }))
    setMessage("Your application has been pulled back. Edit the fields below and resubmit when ready.")
  }

  const uploadFile = async (file: File, kind: "photo" | "document") => {
    const body = new FormData()
    body.set("file", file)
    body.set("kind", kind)
    const res = await fetch("/api/ian/upload", { method: "POST", body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Upload failed.")
    return data.pathname as string
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setPhotoUploading(true)
    try {
      const pathname = await uploadFile(file, "photo")
      const res = await fetch("/api/ian/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_pathname: pathname }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save photo.")
      setProfile(data.profile)
      setMessage("Photo updated.")
      setTimeout(() => setMessage(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.")
    } finally {
      setPhotoUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  const removePhoto = async () => {
    setPhotoUploading(true)
    setError(null)
    try {
      const res = await fetch("/api/ian/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_pathname: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to remove photo.")
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo.")
    } finally {
      setPhotoUploading(false)
    }
  }

  // Uploading a document never deletes an existing one — if `supersedes` is
  // set, the prior evidence row is marked superseded but stays in the
  // record. Every version remains visible and downloadable below.
  const uploadDocument = async (supersedesId?: string) => {
    if (!docFile) return
    setDocError(null)
    setDocUploading(true)
    try {
      const pathname = await uploadFile(docFile, "document")
      const res = await fetch("/api/ian/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: docLabel.trim() || docFile.name,
          fileUrl: pathname,
          supersedesEvidenceId: supersedesId ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save document.")
      setDocLabel("")
      setDocFile(null)
      if (docInputRef.current) docInputRef.current.value = ""
      loadDocuments()
    } catch (err) {
      setDocError(err instanceof Error ? err.message : "Failed to upload document.")
    } finally {
      setDocUploading(false)
    }
  }

  const activeDocuments = documents.filter((d) => !d.superseded_by)
  const photoUrl = profile.photo_pathname
    ? `/api/ian/file?pathname=${encodeURIComponent(profile.photo_pathname)}`
    : null

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
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 space-y-2">
                <p>
                  Your profile is under review and locked for editing. It reopens automatically if a reviewer
                  requests clarification. Check{" "}
                  <Link href="/ian/status" className="underline">
                    your status
                  </Link>{" "}
                  for updates.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/20 pt-2">
                  <p>Need to fix something? You can pull your application back before a reviewer picks it up.</p>
                  <Button
                    onClick={unsubmit}
                    disabled={unsubmitting}
                    size="sm"
                    variant="outline"
                    className="border-amber-400/40 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                  >
                    {unsubmitting ? "Unsubmitting…" : "Unsubmit to edit"}
                  </Button>
                </div>
              </div>
            )}

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Profile photo</p>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-950">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private blob, served through our own route
                    <img src={photoUrl || "/placeholder.svg"} alt="Your profile photo" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-slate-600" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="sr-only"
                    id="photo-upload"
                    disabled={isLocked || photoUploading}
                  />
                  <Label htmlFor="photo-upload">
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      disabled={isLocked || photoUploading}
                      className="border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
                    >
                      <span>
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {photoUploading ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
                      </span>
                    </Button>
                  </Label>
                  {photoUrl && !isLocked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removePhoto}
                      disabled={photoUploading}
                      className="text-slate-400 hover:text-red-400"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500">JPEG, PNG, or WEBP. Up to 10MB. Stored privately — only you and IAN reviewers can view it.</p>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-white">Identity & role</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">
                    Display name <span className="text-red-400">*</span>
                  </Label>
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
              <p className="text-sm font-semibold text-white">
                Participation roles <span className="text-red-400">*</span>
              </p>
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

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div>
                <p className="text-sm font-semibold text-white">Essential documents</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per the IAN framework, joining the network never requires a passport, bank statement, or
                  detailed financial record. Only upload what a reviewer has specifically asked for or what is
                  flagged as required below. Replacing a document never deletes the old copy — it stays on file,
                  marked superseded.
                </p>
              </div>

              {needsAuthorityDoc && !hasAuthorityDoc && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <span className="text-red-400">*</span> Because you indicated you act on behalf of an
                  organization, reviewers require proof of your authority to represent it (e.g. a signed mandate or
                  authorization letter) before your profile can be admitted.
                </div>
              )}

              {docsLoading ? (
                <p className="text-xs text-slate-500">Loading documents…</p>
              ) : activeDocuments.length > 0 ? (
                <ul className="space-y-2">
                  {activeDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-200">{doc.claim}</p>
                          <p className="text-xs text-slate-500 capitalize">{doc.evidence_state.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      {doc.file_url && (
                        <a
                          href={`/api/ian/file?pathname=${encodeURIComponent(doc.file_url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs text-blue-400 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No documents uploaded yet.</p>
              )}

              {!isLocked && (
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Document type</Label>
                    <div className="flex flex-wrap gap-2">
                      {DOCUMENT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDocLabel(type)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                            docLabel === type
                              ? "border-blue-500 bg-blue-500/20 text-blue-200"
                              : "border-slate-700 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {type === AUTHORITY_DOC_LABEL && <span className="text-red-400 mr-0.5">*</span>}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={docLabel}
                      onChange={(e) => setDocLabel(e.target.value)}
                      placeholder="What is this document? (e.g. Proof of accreditation)"
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                      id="document-upload"
                    />
                    <Label htmlFor="document-upload" className="sm:hidden">
                      <Button asChild type="button" variant="outline" className="w-full border-slate-700 text-slate-200 cursor-pointer">
                        <span>{docFile ? docFile.name : "Choose file"}</span>
                      </Button>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="document-upload" className="hidden sm:block">
                      <Button asChild type="button" variant="outline" className="border-slate-700 text-slate-200 cursor-pointer">
                        <span>
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          {docFile ? docFile.name : "Choose file"}
                        </span>
                      </Button>
                    </Label>
                    <Button
                      type="button"
                      onClick={() => uploadDocument()}
                      disabled={!docFile || docUploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {docUploading ? "Uploading…" : "Add document"}
                    </Button>
                    {docFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDocFile(null)
                          if (docInputRef.current) docInputRef.current.value = ""
                        }}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {docError && <p className="text-sm text-red-400">{docError}</p>}
                  <p className="text-xs text-slate-500">PDF, DOC, DOCX, JPEG, PNG, or WEBP. Up to 10MB.</p>
                </div>
              )}
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
