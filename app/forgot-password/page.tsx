"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PublicRoute } from "@/components/public-route"
import { CheckCircle, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setIsLoading(false)

    if (sbError) {
      setError(sbError.message)
      return
    }

    setSent(true)
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">CapIV™ Access</p>
            <h1 className="text-3xl font-semibold text-white">Reset Password</h1>
            <p className="text-slate-400">
              {sent
                ? "Check your inbox for the reset link."
                : "Enter your account email and we'll send you a secure reset link."}
            </p>
          </div>

          <Card className="bg-slate-900/80 border border-slate-800 shadow-xl shadow-blue-500/5">
            {sent ? (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">Email sent</CardTitle>
                  <CardDescription className="text-slate-400">
                    We sent a password reset link to{" "}
                    <span className="text-slate-200 font-medium">{email}</span>.
                    The link expires in 1 hour.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500 text-center">
                    Didn&apos;t receive it? Check your spam folder or{" "}
                    <button
                      onClick={() => setSent(false)}
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    >
                      try again
                    </button>
                    .
                  </p>
                  <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                    <Link href="/login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Link>
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Forgot your password?</CardTitle>
                      <CardDescription className="text-slate-400">
                        We&apos;ll send a secure reset link to your email.
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

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@capiv.com"
                        disabled={isLoading}
                        autoComplete="email"
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending link..." : "Send reset link"}
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                      <Link href="/login" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Sign In
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </PublicRoute>
  )
}
