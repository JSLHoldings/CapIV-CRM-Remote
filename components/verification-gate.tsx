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

  useEffect(() => {
    const bypass = localStorage.getItem("bypass_verification") === "true"
    setBypassVerification(bypass)
    if (bypass) {
      console.log("[v0] Verification bypass is active - skipping verification flow")
    }
  }, [])

  // While we load the user's verification status from the database, show a
  // loader instead of flashing the verification flow to already-verified users.
  if (isLoading && !bypassVerification) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="sr-only">Loading your account…</span>
      </div>
    )
  }

  // If bypass is enabled or user is verified, show the app content
  if (bypassVerification || isVerified) {
    return <>{children}</>
  }

  // If not verified and bypass is disabled, show the verification flow
  return <VerificationFlow />
}
