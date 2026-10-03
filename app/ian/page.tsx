"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const roles = [
  { title: "Investors", description: "Explore participation ahead of formal deal access." },
  { title: "Founders & Sponsors", description: "Build a verified profile before raising within the network." },
  { title: "Advisors & Strategic Partners", description: "Register interest and context for future collaboration." },
]

export default function IanLandingPage() {
  const router = useRouter()
  const [referral, setReferral] = useState("")

  const handleStart = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ian_source", "ian_landing")
      if (referral.trim()) sessionStorage.setItem("ian_referral_context", referral.trim())
    }
    router.push("/signup?source=ian")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">JSL Tech</span>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-blue-400/80">Beta Program</p>
          <h1 className="text-4xl font-semibold text-white">The IAN Network</h1>
          <p className="text-slate-300 leading-relaxed">
            IAN is an early-access participant network for people exploring future involvement with JSL Tech —
            investors, founders, sponsors, advisors, and strategic partners. Creating a profile does not submit a
            deal, grant access to opportunities, or make any commitment. A reviewer looks at every submission before
            anything else happens.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((role) => (
            <div key={role.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-sm font-semibold text-white">{role.title}</p>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">How it works</p>
            <ol className="mt-3 space-y-2 text-sm text-slate-400 list-decimal list-inside">
              <li>Create an account and complete your IAN profile.</li>
              <li>Submit the profile for review — a reviewer is notified immediately.</li>
              <li>Track your status and respond to any clarification requests.</li>
              <li>If admitted, your account status updates in place — no re-registration needed.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral" className="text-xs text-slate-400">
              Referred by (optional)
            </Label>
            <Input
              id="referral"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="Name or organization"
              className="bg-slate-950 border-slate-700 text-slate-100"
            />
          </div>

          <Button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
            Create your IAN profile
          </Button>
          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-300 hover:text-blue-200">
              Sign in
            </Link>{" "}
            and go to{" "}
            <Link href="/ian/profile" className="text-blue-300 hover:text-blue-200">
              My IAN Profile
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
