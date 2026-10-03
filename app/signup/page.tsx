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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type AccountType =
  | "realtor-broker"
  | "asset-holder"
  | "investor-family-office"
  | "capital-partner"
  | "service-provider"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState<AccountType | "">("")
  const [error, setError] = useState("")
  const { signup, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !email || !password || !confirmPassword || !accountType) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    const result = await signup(email, password, name, accountType as AccountType)
    if (result.success) {
      // Account is auto-confirmed and signed in — go straight into the app,
      // where the one-time onboarding/verification flow is shown.
      router.push("/")
    } else {
      setError(result.error || "Failed to create account. Please try again.")
    }
  }

  const accountOptions: Array<{ id: AccountType; title: string; description: string }> = [
    {
      id: "realtor-broker",
      title: "Realtor / Broker",
      description: "Licensed professionals submitting assets and listings.",
    },
    {
      id: "asset-holder",
      title: "Asset Holder / Developer / Sponsor",
      description: "Owners and sponsors raising capital for active deals.",
    },
    {
      id: "investor-family-office",
      title: "Investor / Family Office / LP",
      description: "Accredited investors evaluating curated opportunities.",
    },
    {
      id: "capital-partner",
      title: "Capital Partner (Debt / Private Credit)",
      description: "Lenders and credit partners offering structured solutions.",
    },
    {
      id: "service-provider",
      title: "Service Provider",
      description: "Diligence partners across legal, valuation, and compliance.",
    },
  ]

  return (
    <PublicRoute>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">JSL Tech™ Access</p>
            <h1 className="text-3xl font-semibold text-white">Create Your JSL Tech Command Account</h1>
            <p className="text-slate-400">
              Select the profile that best represents how you operate inside the JSL Tech ecosystem.
            </p>
          </div>

          <Card className="bg-slate-900/80 border border-slate-800 shadow-xl shadow-blue-500/5">
            <CardHeader>
              <CardTitle className="text-white">Create Account</CardTitle>
              <CardDescription className="text-slate-400">
                Sign up to get started with the unified JSL Tech CRM workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-200">Select Account Type</Label>
                  <RadioGroup
                    value={accountType}
                    onValueChange={(value) => setAccountType(value as AccountType)}
                    className="space-y-3"
                  >
                    {accountOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:border-blue-500/40"
                      >
                        <RadioGroupItem value={option.id} id={option.id} className="mt-1 text-blue-500" />
                        <div className="flex-1">
                          <Label htmlFor={option.id} className="font-medium text-white cursor-pointer">
                            {option.title}
                          </Label>
                          <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jordan Alexander"
                      disabled={isLoading}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    />
                  </div>
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
                    <Label htmlFor="password" className="text-slate-300">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      disabled={isLoading}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      disabled={isLoading}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicRoute>
  )
}
