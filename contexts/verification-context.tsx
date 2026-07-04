"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"

export interface DocumentUpload {
  name: string
  type: string
  size: number
  preview: string
  uploadedAt: string
}

export interface CompanyInfo {
  // Common fields
  companyName: string
  entityType: string
  registrationNumber: string
  taxId: string
  incorporationDate: string
  jurisdiction: string
  businessAddress: string
  city: string
  state: string
  zipCode: string
  country: string
  phoneNumber: string
  website: string
  primaryContactName: string
  primaryContactTitle: string
  primaryContactEmail: string
  primaryContactPhone: string
  businessDescription: string

  // Realtor/Broker specific
  brokerageName?: string
  licenseNumber?: string
  licenseJurisdiction?: string
  assetIntakeLink?: string

  // Asset Holder/Developer specific
  principals?: string
  trackRecord?: string
  projectBudget?: string
  projectTimeline?: string
  permits?: string

  // Investor/Family Office specific
  accreditationStatus?: string
  aum?: string
  checkSizeMin?: string
  checkSizeMax?: string
  investmentMandate?: string
  esgRequirements?: string

  // Capital Partner specific
  capitalAvailability?: string
  productTypes?: string[]
  pricingBands?: string
  maxLTV?: string
  maxLTC?: string
  turnaroundTime?: string

  // Service Provider specific
  coverageAreas?: string[]
  credentials?: string
  insuranceCoverage?: string
  independenceStatement?: string

  // Common investment fields
  dealInvestmentFocus: string[]
  investmentStrategy: string
  typicalDealSize: string
  geographicFocus: string[]
  preferredAssetClasses: string[]
  investmentHorizon: string
  fundingSource: string
  regulatoryLicenses: string
  complianceOfficer: string
  complianceOfficerEmail: string
  initialKycNotes: string
  digitalFileRepositoryNotes: string
  initialKycConfirmed: boolean
  digitalFileUploadReady: boolean
  kycDocumentUploads: DocumentUpload[]
  electronicSignature: string
}

interface VerificationContextType {
  isVerified: boolean
  currentStep: "nda" | "survey" | "complete"
  ndaSigned: boolean
  kycCompleted: boolean
  kycInquiryId: string | null
  companyInfo: CompanyInfo | null
  isLoading: boolean
  signNDA: (signature: string) => void
  completeKYC: (inquiryId: string) => void
  submitCompanyInfo: (info: CompanyInfo) => void
  resetVerification: () => void
}

export const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

// Verification progress is stored in the `profiles` table so it persists
// across devices and sessions. These are the columns we read/write.
interface VerificationRow {
  is_verified: boolean | null
  verification_step: string | null
  nda_signed: boolean | null
  kyc_completed: boolean | null
  kyc_inquiry_id: string | null
  company_info: CompanyInfo | null
}

export function VerificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [isVerified, setIsVerified] = useState(false)
  const [currentStep, setCurrentStep] = useState<"nda" | "survey" | "complete">("nda")
  const [ndaSigned, setNdaSigned] = useState(false)
  const [kycCompleted, setKycCompleted] = useState(false)
  const [kycInquiryId, setKycInquiryId] = useState<string | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load verification state from the database whenever the user changes.
  useEffect(() => {
    let active = true

    if (!user) {
      // Clear state when the user logs out.
      setIsVerified(false)
      setCurrentStep("nda")
      setNdaSigned(false)
      setKycCompleted(false)
      setKycInquiryId(null)
      setCompanyInfo(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    supabase
      .from("profiles")
      .select("is_verified, verification_step, nda_signed, kyc_completed, kyc_inquiry_id, company_info")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }: { data: VerificationRow | null; error: { message: string } | null }) => {
        if (!active) return
        if (error) {
          console.error("Failed to load verification state:", error.message)
        }
        if (data) {
          setIsVerified(data.is_verified ?? false)
          const step = data.verification_step
          setCurrentStep(step === "survey" || step === "complete" ? step : "nda")
          setNdaSigned(data.nda_signed ?? false)
          setKycCompleted(data.kyc_completed ?? false)
          setKycInquiryId(data.kyc_inquiry_id ?? null)
          setCompanyInfo(data.company_info ?? null)
        }
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, supabase])

  // Persist a partial update to the user's profile row.
  const persist = useCallback(
    async (updates: Partial<VerificationRow>) => {
      if (!user) return
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)
      if (error) {
        console.error("Failed to persist verification state:", error.message)
      }
    },
    [user, supabase],
  )

  const signNDA = useCallback(
    (_signature: string) => {
      setNdaSigned(true)
      setCurrentStep("survey")
      void persist({ nda_signed: true, verification_step: "survey" })
    },
    [persist],
  )

  const completeKYC = useCallback(
    (inquiryId: string) => {
      setKycCompleted(true)
      setKycInquiryId(inquiryId)
      setCurrentStep("survey")
      void persist({ kyc_completed: true, kyc_inquiry_id: inquiryId, verification_step: "survey" })
    },
    [persist],
  )

  const submitCompanyInfo = useCallback(
    (info: CompanyInfo) => {
      setCompanyInfo(info)
      setCurrentStep("complete")
      setIsVerified(true)
      void persist({ company_info: info, verification_step: "complete", is_verified: true })
    },
    [persist],
  )

  const resetVerification = useCallback(() => {
    setIsVerified(false)
    setCurrentStep("nda")
    setNdaSigned(false)
    setKycCompleted(false)
    setKycInquiryId(null)
    setCompanyInfo(null)
    void persist({
      is_verified: false,
      verification_step: "nda",
      nda_signed: false,
      kyc_completed: false,
      kyc_inquiry_id: null,
      company_info: null,
    })
  }, [persist])

  return (
    <VerificationContext.Provider
      value={{
        isVerified,
        currentStep,
        ndaSigned,
        kycCompleted,
        kycInquiryId,
        companyInfo,
        isLoading,
        signNDA,
        completeKYC,
        submitCompanyInfo,
        resetVerification,
      }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (!context) {
    throw new Error("useVerification must be used within a VerificationProvider")
  }
  return context
}
