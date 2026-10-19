"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PublicRoute } from "@/components/public-route"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [secretKey, setSecretKey] = useState("")
  const { login, adminLogin, isLoading } = useAuth()
  const router = useRouter()

  const switchMode = (admin: boolean) => {
    setIsAdminMode(admin)
    setSecretKey("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || (isAdminMode && !secretKey)) {
      setError("Please fill in all fields")
      return
    }

    if (isAdminMode) {
      const success = await adminLogin(email, password, secretKey)
      if (success) {
        router.push("/admin")
      } else {
        setError("Invalid admin credentials")
      }
      return
    }

    const success = await login(email, password, rememberMe)
    if (success) {
      router.push("/")
    } else {
      setError("Invalid email or password")
    }
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">JSL Tech™ Access</p>
            <h1 className="text-3xl font-semibold text-white">Sign in to Command</h1>
            <p className="text-slate-400">Secure entry to your private markets workspace.</p>
          </div>

          <Card className="bg-slate-900/80 border border-slate-800 shadow-xl shadow-blue-500/5">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="tablist"
                aria-label="Sign in type"
                className="grid grid-cols-2 gap-1 rounded-lg bg-slate-950 border border-slate-800 p-1 mb-5"
              >
                {[
                  { label: "User", admin: false },
                  { label: "Admin", admin: true },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={isAdminMode === tab.admin}
                    onClick={() => switchMode(tab.admin)}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                      isAdminMode === tab.admin
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@jsltech.com"
                    disabled={isLoading}
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>

                {isAdminMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="secretKey" className="text-slate-300">
                      Secret Key
                    </Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter admin secret key"
                      autoComplete="off"
                      disabled={isLoading}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-slate-300">
                      Remember me for 30 days
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : isAdminMode ? "Sign In as Admin" : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-300 hover:text-blue-200 font-medium">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicRoute>
  )
}
