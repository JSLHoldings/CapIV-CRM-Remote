"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useVerification } from "@/contexts/verification-context"
import { VerificationFlow } from "@/components/verification-flow"
import { Loader2 } from "lucide-react"

interface VerificationGateProps {
  children: React.ReactNode
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { isVerified, isLoading } = useVerification()
  const [bypassVerification, setBypassVerification] = useState(false)
  const [justSignedUp, setJustSignedUp] = useState(false)
  const [flagsLoaded, setFlagsLoaded] = useState(false)

  useEffect(() => {
    // Admin/testing bypass.
    const bypass = localStorage.getItem("bypass_verification") === "true"
    setBypassVerification(bypass)
    if (bypass) {
      console.log("[v0] Verification bypass is active - skipping verification flow")
    }

    // Onboarding (NDA / KYC / e-signature) is only shown right after a fresh
    // sign-up. On a normal sign-in this flag is absent, so users go straight
    // to the dashboard.
    setJustSignedUp(sessionStorage.getItem("capiv_just_signed_up") === "true")
    setFlagsLoaded(true)
  }, [])

  // Once the user finishes onboarding, drop the one-time sign-up flag so it
  // never lingers into a future session.
  useEffect(() => {
    if (isVerified && typeof window !== "undefined") {
      sessionStorage.removeItem("capiv_just_signed_up")
      setJustSignedUp(false)
    }
  }, [isVerified])

  // Wait for both the DB status and the local flags before deciding, so we
  // never flash the verification flow to a returning, verified user.
  if ((isLoading || !flagsLoaded) && !bypassVerification) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="sr-only">Loading your account…</span>
      </div>
    )
  }

  // Show onboarding ONLY for a brand-new account that just signed up and has
  // not completed verification yet. Everyone else (returning sign-ins, verified
  // users, or bypass) goes straight to the dashboard.
  if (!bypassVerification && !isVerified && justSignedUp) {
    return <VerificationFlow />
  }

  return <>{children}</>
}
