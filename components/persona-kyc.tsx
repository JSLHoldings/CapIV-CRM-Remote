"use client"

import { useEffect, useRef, useState } from "react"
import { useVerification } from "@/contexts/verification-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, CheckCircle2, AlertCircle } from "lucide-react"

declare global {
  interface Window {
    Persona?: {
      Client: new (config: PersonaConfig) => PersonaClient
    }
  }
}

interface PersonaConfig {
  templateId: string
  environmentId: string
  referenceId?: string
  onReady?: () => void
  onComplete?: (data: { inquiryId: string; status: string; fields: Record<string, unknown> }) => void
  onCancel?: (data: { inquiryId: string; sessionToken: string }) => void
  onError?: (error: Error) => void
}

interface PersonaClient {
  open: () => void
  destroy: () => void
}

interface PersonaKYCProps {
  compact?: boolean
}

export function PersonaKYC({ compact = false }: PersonaKYCProps) {
  const { completeKYC } = useVerification()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<PersonaClient | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const templateId = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID
  const environmentId = process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID
  const isPersonaConfigured = templateId && environmentId
  const isBypassEnabled = typeof window !== "undefined" && localStorage.getItem("bypass_verification") === "true"
  const containerClasses = compact
    ? "flex w-full items-center justify-center"
    : "flex min-h-screen items-center justify-center bg-background p-4"
  const cardClasses = `w-full ${compact ? "" : "max-w-2xl"}`
  const embedHeightClass = `${compact ? "min-h-[450px]" : "min-h-[650px]"} w-full`

  useEffect(() => {
    if (!isPersonaConfigured || isBypassEnabled) {
      setIsLoading(false)
      return
    }

    // Load Persona SDK script
    const script = document.createElement("script")
    script.src = "https://cdn.withpersona.com/dist/persona-v4.9.0.js"
    script.async = true
    script.onload = () => {
      setIsLoading(false)
    }
    script.onerror = () => {
      setError("Failed to load Persona SDK. Please refresh the page and try again.")
      setIsLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      if (clientRef.current) {
        clientRef.current.destroy()
      }
      document.body.removeChild(script)
    }
  }, [isPersonaConfigured, isBypassEnabled])

  const skipKYCDebug = () => {
    console.log("[v0] Skipping KYC verification (debug mode)")
    completeKYC(`debug-inquiry-${Date.now()}`)
  }

  const startVerification = () => {
    if (!window.Persona) {
      setError("Persona SDK not loaded. Please refresh the page.")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const client = new window.Persona.Client({
        templateId: templateId!,
        environmentId: environmentId!,
        referenceId: user?.id || `user-${Date.now()}`,
        onReady: () => {
          console.log("[v0] Persona client ready")
        },
        onComplete: ({ inquiryId, status }) => {
          console.log("[v0] Persona verification complete", { inquiryId, status })
          completeKYC(inquiryId)
          setIsVerifying(false)
        },
        onCancel: ({ inquiryId }) => {
          console.log("[v0] Persona verification cancelled", { inquiryId })
          setIsVerifying(false)
          setError("Verification was cancelled. Please complete the verification to continue.")
        },
        onError: (error) => {
          console.error("[v0] Persona error:", error)
          setIsVerifying(false)
          setError("An error occurred during verification. Please try again.")
        },
      })

      clientRef.current = client
      client.open()
    } catch (err) {
      console.error("[v0] Error starting Persona:", err)
      setError("Failed to start verification. Please try again.")
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <Card className={cardClasses}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading verification system...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPersonaConfigured || isBypassEnabled) {
    return (
      <div className={containerClasses}>
        <Card className={cardClasses}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">KYC/AML Verification</CardTitle>
            <CardDescription className="text-base">
              {isBypassEnabled ? "Debug mode is enabled - you can skip verification" : "Persona is not configured"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isPersonaConfigured && (
              <div className="space-y-4 rounded-lg border border-warning/50 bg-warning/10 p-6">
                <h3 className="font-semibold text-foreground">Configuration Required</h3>
                <p className="text-sm text-muted-foreground">
                  Persona KYC/AML verification is not configured. To enable identity verification, please add the
                  following environment variables:
                </p>
                <ul className="space-y-2 text-sm font-mono text-muted-foreground">
                  <li className="rounded bg-background p-2">NEXT_PUBLIC_PERSONA_TEMPLATE_ID</li>
                  <li className="rounded bg-background p-2">NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  See <code className="rounded bg-background px-1 py-0.5">docs/PERSONA_SETUP.md</code> for setup
                  instructions.
                </p>
              </div>
            )}

            {isBypassEnabled && (
              <div className="space-y-4 rounded-lg border border-info/50 bg-info/10 p-6">
                <h3 className="font-semibold text-foreground">Debug Mode Active</h3>
                <p className="text-sm text-muted-foreground">
                  Verification bypass is enabled. You can skip the KYC verification step for testing purposes.
                </p>
              </div>
            )}

            <Button onClick={skipKYCDebug} className="w-full" size="lg" variant="secondary">
              Skip KYC Verification (Debug)
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              This option is only available in development mode or when verification bypass is enabled.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <Card className={cardClasses}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Identity Verification</CardTitle>
          <CardDescription className="text-base">Complete KYC/AML verification to access the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-6">
            <h3 className="font-semibold text-foreground">What you'll need:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>A valid government-issued photo ID (passport, driver's license, or national ID)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>A device with a camera for identity verification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>5-10 minutes to complete the verification process</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-6">
            <h3 className="font-semibold text-foreground">Privacy & Security</h3>
            <p className="text-sm text-muted-foreground">
              Your personal information is encrypted and securely processed by Persona, our trusted identity
              verification partner. We comply with all applicable data protection regulations including GDPR and CCPA.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div ref={containerRef} className={embedHeightClass} />

          <Button onClick={startVerification} disabled={isVerifying || isLoading} className="w-full" size="lg">
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Start Verification"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to share your identity information with Persona for verification purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
