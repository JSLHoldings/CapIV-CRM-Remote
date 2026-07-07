"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useVerification } from "@/contexts/verification-context"
import { SignaturePad } from "@/components/signature-pad"
import { FileText, Shield } from "lucide-react"

export function NDASigningComponent() {
  const { signNDA } = useVerification()
  const [signatureName, setSignatureName] = useState("")
  const [signatureImage, setSignatureImage] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreed) {
      setError("You must agree to the terms of the NDA")
      return
    }

    if (!signatureName.trim()) {
      setError("Please type your full legal name")
      return
    }

    if (!signatureImage) {
      setError("Please draw your signature in the box above")
      return
    }

    signNDA(signatureName, signatureImage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Non-Disclosure Agreement</CardTitle>
          <CardDescription className="text-base">
            Please review and sign the NDA to access the JSL CRM platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder notice: legal copy below is placeholder text pending final review. */}
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Placeholder agreement text. The final NDA language will be provided by JSL legal before launch.
            </p>
          </div>

          {/* NDA Content */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Agreement Terms</h3>
            </div>
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">MUTUAL NON-DISCLOSURE AGREEMENT</p>

                <p>
                  This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of the date of electronic
                  signature below by and between JSL Capital Management ("JSL") and the undersigned party ("Recipient").
                </p>

                <p className="font-semibold text-foreground">1. Definition of Confidential Information</p>
                <p>
                  "Confidential Information" means any and all information disclosed by either party to the other,
                  whether orally, in writing, or in any other form, that relates to: (a) business operations,
                  strategies, and plans; (b) financial information, including investment opportunities, deal structures,
                  and returns; (c) investor information and relationships; (d) proprietary methodologies and processes;
                  (e) market analyses and research; and (f) any other information marked as confidential or that would
                  reasonably be considered confidential.
                </p>

                <p className="font-semibold text-foreground">2. Obligations</p>
                <p>
                  The Recipient agrees to: (a) maintain the confidentiality of all Confidential Information; (b) use
                  Confidential Information solely for the purpose of evaluating potential business relationships with
                  JSL; (c) not disclose Confidential Information to any third party without prior written consent; (d)
                  protect Confidential Information with the same degree of care used to protect its own confidential
                  information, but in no event less than reasonable care.
                </p>

                <p className="font-semibold text-foreground">3. Exclusions</p>
                <p>
                  Confidential Information does not include information that: (a) is or becomes publicly available
                  through no breach of this Agreement; (b) was rightfully in Recipient's possession prior to disclosure;
                  (c) is rightfully received from a third party without breach of confidentiality obligations; (d) is
                  independently developed by Recipient without use of Confidential Information.
                </p>

                <p className="font-semibold text-foreground">4. Term and Termination</p>
                <p>
                  This Agreement shall remain in effect for a period of five (5) years from the date of signature. The
                  obligations of confidentiality shall survive termination of this Agreement.
                </p>

                <p className="font-semibold text-foreground">5. Return of Materials</p>
                <p>
                  Upon request or termination of discussions, Recipient shall promptly return or destroy all
                  Confidential Information and certify such destruction in writing.
                </p>

                <p className="font-semibold text-foreground">6. No License</p>
                <p>
                  Nothing in this Agreement grants any license or right to Confidential Information except as expressly
                  stated herein.
                </p>

                <p className="font-semibold text-foreground">7. Governing Law</p>
                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of the State of
                  Delaware, without regard to its conflict of law provisions.
                </p>

                <p className="font-semibold text-foreground">8. Entire Agreement</p>
                <p>
                  This Agreement constitutes the entire agreement between the parties concerning the subject matter
                  hereof and supersedes all prior agreements and understandings, whether written or oral.
                </p>
              </div>
            </ScrollArea>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-background">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
            <div className="space-y-1">
              <Label
                htmlFor="agree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and agree to the terms of this Non-Disclosure Agreement
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you acknowledge that you understand and accept the confidentiality obligations
                outlined above.
              </p>
            </div>
          </div>

          {/* Signature Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signatureName">Full Legal Name *</Label>
              <Input
                id="signatureName"
                placeholder="Type your full legal name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Draw Your Signature *</Label>
              <SignaturePad onChange={setSignatureImage} />
              <p className="text-xs text-muted-foreground">
                Draw your signature above and type your legal name to provide a legally binding electronic signature.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                disabled={!agreed || !signature.trim()}
              >
                Sign and Continue
              </Button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
