"use client"

import { useVerification } from "@/contexts/verification-context"
import { NDASigningComponent } from "@/components/nda-signing"
import { CompanyInformationSurvey } from "@/components/company-survey"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function VerificationFlow() {
  const { currentStep, isVerified } = useVerification()

  // Show completion message
  if (isVerified && currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Verification Complete!</h2>
            <p className="text-muted-foreground">Your account has been verified. Redirecting to the application...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show NDA signing step
  if (currentStep === "nda") {
    return <NDASigningComponent />
  }

  // Show KYC verification step
  // Show company survey step
  if (currentStep === "survey") {
    return <CompanyInformationSurvey />
  }

  return null
}
