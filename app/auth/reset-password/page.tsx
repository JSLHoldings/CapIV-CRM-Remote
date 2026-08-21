"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Lock, Eye, EyeOff } from "lucide-react"

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" }
  if (pw.length < 8) return { label: "Too short", color: "bg-red-500", width: "25%" }
  const has = (re: RegExp) => re.test(pw)
  const score = [has(/[A-Z]/), has(/[a-z]/), has(/[0-9]/), has(/[^A-Za-z0-9]/)].filter(Boolean).length
  if (score <= 2) return { label: "Weak", color: "bg-amber-500", width: "50%" }
  if (score === 3) return { label: "Good", color: "bg-blue-500", width: "75%" }
  return { label: "Strong", color: "bg-emerald-500", width: "100%" }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Supabase sends the user back with a code/token in the URL.
  // The PKCE flow exchanges it for a session automatically when we call getSession().
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setError("This reset link is invalid or has expired. Please request a new one.")
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const strength = getStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const { error: sbError } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (sbError) {
      setError(sbError.message)
      return
    }

    void logActivity({ action: "Password reset successfully", category: "auth" })
    setDone(true)
    setTimeout(() => router.push("/"), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">JSL Tech™ Access</p>
          <h1 className="text-3xl font-semibold text-white">Set New Password</h1>
          <p className="text-slate-400">Choose a strong password for your account.</p>
        </div>

        <Card className="bg-slate-900/80 border border-slate-800 shadow-xl shadow-blue-500/5">
          {done ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <CardTitle className="text-white">Password updated</CardTitle>
                <CardDescription className="text-slate-400">
                  Your password has been changed successfully. Redirecting you to the dashboard&hellip;
                </CardDescription>
              </CardHeader>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">New Password</CardTitle>
                    <CardDescription className="text-slate-400">
                      Enter and confirm your new password below.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!sessionReady && !error && (
                    <p className="text-sm text-slate-400 text-center py-2 animate-pulse">
                      Verifying reset link&hellip;
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading || !sessionReady}
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-slate-300">
                      Confirm new password
                    </Label>
                    <Input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading || !sessionReady}
                      className={`bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 ${
                        confirm.length > 0 && confirm !== password ? "border-red-500/60" : ""
                      }`}
                    />
                    {confirm.length > 0 && confirm !== password && (
                      <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                    disabled={isLoading || !sessionReady}
                  >
                    {isLoading ? "Updating password..." : "Update password"}
                  </Button>

                  <p className="text-center text-sm text-slate-500">
                    Remember it?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
