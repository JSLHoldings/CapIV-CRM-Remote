"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useVerification } from "@/contexts/verification-context"
import { VerificationFlow } from "@/components/verification-flow"

interface VerificationGateProps {
  children: React.ReactNode
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { isVerified } = useVerification()
  const [bypassVerification, setBypassVerification] = useState(false)

  useEffect(() => {
    const bypass = localStorage.getItem("bypass_verification") === "true"
    setBypassVerification(bypass)
    if (bypass) {
      console.log("[v0] Verification bypass is active - skipping verification flow")
    }
  }, [])

  // If bypass is enabled or user is verified, show the app content
  if (bypassVerification || isVerified) {
    return <>{children}</>
  }

  // If not verified and bypass is disabled, show the verification flow
  return <VerificationFlow />
}
