"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  User, Bell, Shield, CreditCard, FolderOpen,
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff,
  Camera, Building2, Phone, Mail, Briefcase, FileText, Lock
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { DocumentVault } from "@/components/document-vault"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  email: string | null
  name: string | null
  role: string
  account_type: string | null
  phone: string | null
  bio: string | null
  company: string | null
  job_title: string | null
  avatar_url: string | null
  is_verified: boolean
  nda_signed: boolean
  nda_signed_at: string | null
  tos_signed: boolean
  tos_signed_at: string | null
  notification_preferences: Record<string, boolean>
  created_at: string
}

interface Toast {
  id: number
  type: "success" | "error"
  message: string
}

// ── Toast helper ───────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const show = useCallback((type: "success" | "error", message: string) => {
    const id = ++counter.current
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  return { toasts, show }
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all
            ${t.type === "success"
              ? "bg-emerald-950 border-emerald-700 text-emerald-200"
              : "bg-red-950 border-red-700 text-red-200"}`}
        >
          {t.type === "success"
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ── Notification row ───────────────────────────────────────────────────────────

function NotifRow({
  label, description, checked, onChange
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const { toasts, show } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Profile tab
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [bio, setBio] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingAvatar, setSavingAvatar] = useState(false)

  // Security tab
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Notifications tab
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    deal_updates: true,
    new_matches: true,
    compliance_alerts: true,
    weekly_digest: true,
    security_alerts: true,
    marketing: false,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      setLoadingProfile(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error || !data) {
        setLoadingProfile(false)
        return
      }

      const p = data as Profile
      setProfile(p)
      const parts = (p.name || "").split(" ")
      setFirstName(parts[0] || "")
      setLastName(parts.slice(1).join(" ") || "")
      setPhone(p.phone || "")
      setCompany(p.company || "")
      setJobTitle(p.job_title || "")
      setBio(p.bio || "")
      setAvatarPreview(p.avatar_url || null)
      if (p.notification_preferences) setNotifPrefs(p.notification_preferences)
      setLoadingProfile(false)
    })()
  }, [user?.id])

  // ── Save profile ─────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!user?.id) return
    setSavingProfile(true)
    const name = [firstName, lastName].filter(Boolean).join(" ")
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone, company, job_title: jobTitle, bio, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    setSavingProfile(false)
    if (error) {
      show("error", "Failed to save profile. Please try again.")
    } else {
      show("success", "Profile updated successfully.")
      setProfile(p => p ? { ...p, name, phone, company, job_title: jobTitle, bio } : p)
      void logActivity({ action: "Updated profile information", category: "profile" })
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (file.size > 1_048_576) { show("error", "Avatar must be under 1 MB."); return }

    setSavingAvatar(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: dataUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      setSavingAvatar(false)
      if (error) {
        show("error", "Failed to upload avatar.")
      } else {
        setAvatarPreview(dataUrl)
        show("success", "Avatar updated.")
      }
    }
    reader.readAsDataURL(file)
  }

  // ── Change password ───────────────────────────────────────────────────────────

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) { show("error", "Please fill in all password fields."); return }
    if (newPassword !== confirmPassword) { show("error", "New passwords do not match."); return }
    if (newPassword.length < 8) { show("error", "Password must be at least 8 characters."); return }

    setSavingPassword(true)
    // Supabase doesn't require re-auth for password updates on the same session
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      show("error", error.message || "Failed to update password.")
    } else {
      show("success", "Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      void logActivity({ action: "Changed account password", category: "security" })
    }
  }

  // ── Save notifications ────────────────────────────────────────────────────────

  const saveNotifications = async () => {
    if (!user?.id) return
    setSavingNotifs(true)
    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: notifPrefs, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    setSavingNotifs(false)
    if (error) {
      show("error", "Failed to save notification preferences.")
    } else {
      show("success", "Notification preferences saved.")
    }
  }

  const initials = [firstName?.charAt(0), lastName?.charAt(0)].filter(Boolean).join("").toUpperCase() || "U"

  if (loadingProfile) {
    return (
      <ProtectedRoute>
        <DashboardShell>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </DashboardShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="min-h-full px-8 py-10 space-y-10">

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-500/15 p-4">
              <User className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Account Settings</h1>
              <p className="text-slate-400">
                {profile?.name || user?.email} &middot; {profile?.account_type || "Investor"}
                {profile?.is_verified && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="max-w-5xl">
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <User className="w-3.5 h-3.5 mr-1.5" />Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <Lock className="w-3.5 h-3.5 mr-1.5" />Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <Bell className="w-3.5 h-3.5 mr-1.5" />Alerts
                </TabsTrigger>
                <TabsTrigger value="billing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />Billing
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />Documents
                </TabsTrigger>
              </TabsList>

              {/* ── PROFILE ── */}
              <TabsContent value="profile" className="space-y-6">

                {/* Avatar card */}
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-2 border-slate-700">
                          <AvatarImage src={avatarPreview || undefined} />
                          <AvatarFallback className="text-2xl bg-blue-600/40 text-blue-200 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {savingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-semibold text-lg">{[firstName, lastName].filter(Boolean).join(" ") || "—"}</p>
                        <p className="text-slate-400 text-sm">{profile?.email || user?.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs capitalize">
                            {profile?.account_type || "investor"}
                          </Badge>
                          {profile?.is_verified && (
                            <Badge className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-200 hover:bg-slate-800"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={savingAvatar}
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-slate-500">JPG, PNG, GIF or WebP &middot; 1 MB max</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fields card */}
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Personal Information</CardTitle>
                    <CardDescription className="text-slate-400">Your name, contact details, and role.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />Email
                        </Label>
                        <Input
                          value={profile?.email || user?.email || ""}
                          disabled
                          className="bg-slate-950 border-slate-700 text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-600">Email cannot be changed here.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />Phone
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="company" className="text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />Company
                        </Label>
                        <Input
                          id="company"
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          placeholder="Your company"
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="jobTitle" className="text-slate-300 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />Job Title
                        </Label>
                        <Input
                          id="jobTitle"
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          placeholder="Your title"
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="A short bio about yourself..."
                        rows={3}
                        className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account status */}
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Account Type", value: profile?.account_type || "—", icon: <User className="w-4 h-4 text-blue-400" /> },
                      { label: "KYC Status", value: profile?.is_verified ? "Verified" : "Pending", icon: <CheckCircle2 className={`w-4 h-4 ${profile?.is_verified ? "text-emerald-400" : "text-amber-400"}`} /> },
                      { label: "NDA Signed", value: profile?.nda_signed ? new Date(profile.nda_signed_at!).toLocaleDateString() : "Not signed", icon: <FileText className={`w-4 h-4 ${profile?.nda_signed ? "text-emerald-400" : "text-slate-500"}`} /> },
                      { label: "Member Since", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", icon: <Building2 className="w-4 h-4 text-slate-400" /> },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                        </div>
                        <p className="text-sm font-medium text-white capitalize">{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── SECURITY ── */}
              <TabsContent value="security" className="space-y-6">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5 text-blue-300" />Change Password
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Choose a strong password of at least 8 characters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="bg-slate-950 border-slate-700 text-white pr-10 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="bg-slate-950 border-slate-700 text-white pr-10 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {[8, 12, 16].map(len => (
                            <div
                              key={len}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                newPassword.length >= len ? "bg-emerald-500" : "bg-slate-700"
                              }`}
                            />
                          ))}
                          <p className="text-xs text-slate-500 ml-2">
                            {newPassword.length < 8 ? "Too short" : newPassword.length < 12 ? "Fair" : newPassword.length < 16 ? "Good" : "Strong"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`bg-slate-950 border-slate-700 text-white focus:border-blue-500 ${
                          confirmPassword && confirmPassword !== newPassword ? "border-red-500/60" : ""
                        }`}
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-400">Passwords do not match.</p>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={changePassword}
                        disabled={savingPassword}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl"
                      >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Update Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Two-Factor Authentication</CardTitle>
                    <CardDescription className="text-slate-400">
                      Add a second layer of protection to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Authenticator App (TOTP)</p>
                        <p className="text-xs text-slate-500 mt-0.5">Use an app like Google Authenticator or 1Password.</p>
                      </div>
                      <Badge className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs">Not Enabled</Badge>
                    </div>
                    <Separator className="bg-slate-800 my-3" />
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                      onClick={() => show("error", "2FA setup is coming soon.")}
                    >
                      <Shield className="w-4 h-4 mr-2" />Enable 2FA
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Active Sessions</CardTitle>
                    <CardDescription className="text-slate-400">Devices currently signed in to your account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Current Session</p>
                        <p className="text-xs text-slate-500 mt-0.5">Browser &middot; Active now</p>
                      </div>
                      <Badge className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── NOTIFICATIONS ── */}
              <TabsContent value="notifications">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Bell className="w-5 h-5 text-blue-300" />Notification Preferences
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Choose what you want to hear about. Changes take effect immediately after saving.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-slate-800">
                      <NotifRow
                        label="Deal Updates"
                        description="Status changes, term sheets, and closing milestones on active deals."
                        checked={notifPrefs.deal_updates ?? true}
                        onChange={v => setNotifPrefs(p => ({ ...p, deal_updates: v }))}
                      />
                      <NotifRow
                        label="New Matches"
                        description="When the matchmaking engine finds a new compatible sponsor or investor."
                        checked={notifPrefs.new_matches ?? true}
                        onChange={v => setNotifPrefs(p => ({ ...p, new_matches: v }))}
                      />
                      <NotifRow
                        label="Compliance Alerts"
                        description="Document expiry, missing KYC documents, and EQ rule violations."
                        checked={notifPrefs.compliance_alerts ?? true}
                        onChange={v => setNotifPrefs(p => ({ ...p, compliance_alerts: v }))}
                      />
                      <NotifRow
                        label="Weekly Digest"
                        description="A summary of portfolio activity, open diligence items, and upcoming tasks."
                        checked={notifPrefs.weekly_digest ?? true}
                        onChange={v => setNotifPrefs(p => ({ ...p, weekly_digest: v }))}
                      />
                      <NotifRow
                        label="Security Alerts"
                        description="Sign-ins from new devices and password changes."
                        checked={notifPrefs.security_alerts ?? true}
                        onChange={v => setNotifPrefs(p => ({ ...p, security_alerts: v }))}
                      />
                      <NotifRow
                        label="Marketing & Product Updates"
                        description="New features, platform announcements, and newsletters."
                        checked={notifPrefs.marketing ?? false}
                        onChange={v => setNotifPrefs(p => ({ ...p, marketing: v }))}
                      />
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={saveNotifications}
                        disabled={savingNotifs}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl"
                      >
                        {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── BILLING ── */}
              <TabsContent value="billing">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="w-5 h-5 text-blue-300" />Billing
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage your subscription and payment methods.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400 uppercase tracking-wide text-xs">Current Plan</p>
                        <p className="text-white font-semibold text-lg mt-1">JSL Tech™ Professional</p>
                        <p className="text-slate-400 text-sm">Full access to IQ, EQ, Deals, and Portfolio tools.</p>
                      </div>
                      <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30">Active</Badge>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Payment Method</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-7 rounded bg-slate-700 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-200">Visa ending in 4242</p>
                            <p className="text-xs text-slate-500">Expires 12/26</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800"
                          onClick={() => show("error", "Billing management coming soon.")}>
                          Update
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Next Invoice</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-200">Due {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                        <p className="text-white font-semibold">$299.00</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        onClick={() => show("error", "Billing portal coming soon.")}>
                        Manage Billing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── DOCUMENTS ── */}
              <TabsContent value="documents">
                <DocumentVault />
              </TabsContent>

            </Tabs>
          </div>
        </div>

        <ToastStack toasts={toasts} />
      </DashboardShell>
    </ProtectedRoute>
  )
}
