"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

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
  signNDA: (signature: string) => void
  completeKYC: (inquiryId: string) => void
  submitCompanyInfo: (info: CompanyInfo) => void
  resetVerification: () => void
}

export const VerificationContext = createContext<VerificationContextType | undefined>(undefined)

const initialCompanyInfo: CompanyInfo = {
  companyName: "",
  entityType: "",
  registrationNumber: "",
  taxId: "",
  incorporationDate: "",
  jurisdiction: "",
  businessAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phoneNumber: "",
  website: "",
  primaryContactName: "",
  primaryContactTitle: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  businessDescription: "",
  dealInvestmentFocus: [],
  investmentStrategy: "",
  typicalDealSize: "",
  geographicFocus: [],
  preferredAssetClasses: [],
  investmentHorizon: "",
  fundingSource: "",
  regulatoryLicenses: "",
  complianceOfficer: "",
  complianceOfficerEmail: "",
  initialKycNotes: "",
  digitalFileRepositoryNotes: "",
  initialKycConfirmed: false,
  digitalFileUploadReady: false,
  kycDocumentUploads: [],
  electronicSignature: "",
}

export function VerificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isVerified, setIsVerified] = useState(false)
  const [currentStep, setCurrentStep] = useState<"nda" | "survey" | "complete">("nda")
  const [ndaSigned, setNdaSigned] = useState(false)
  const [kycCompleted, setKycCompleted] = useState(false)
  const [kycInquiryId, setKycInquiryId] = useState<string | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    if (user) {
      const storageKey = `verification-${user.id}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setIsVerified(data.isVerified || false)
        const savedStep = data.currentStep
        if (savedStep === "kyc") {
          setCurrentStep("survey")
        } else if (savedStep === "nda" || savedStep === "survey" || savedStep === "complete") {
          setCurrentStep(savedStep)
        } else {
          setCurrentStep("nda")
        }
        setNdaSigned(data.ndaSigned || false)
        setKycCompleted(data.kycCompleted || false)
        setKycInquiryId(data.kycInquiryId || null)
        setCompanyInfo(data.companyInfo || null)
      }
    } else {
      // Reset verification state when user logs out
      setIsVerified(false)
      setCurrentStep("nda")
      setNdaSigned(false)
      setKycCompleted(false)
      setKycInquiryId(null)
      setCompanyInfo(null)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const storageKey = `verification-${user.id}`
      const data = {
        isVerified,
        currentStep,
        ndaSigned,
        kycCompleted,
        kycInquiryId,
        companyInfo,
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    }
  }, [user, isVerified, currentStep, ndaSigned, kycCompleted, kycInquiryId, companyInfo])

  const signNDA = (signature: string) => {
    setNdaSigned(true)
    setCurrentStep("survey")
  }

  const completeKYC = (inquiryId: string) => {
    setKycCompleted(true)
    setKycInquiryId(inquiryId)
    setCurrentStep("survey")
  }

  const submitCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info)
    setCurrentStep("complete")
    setIsVerified(true)
  }

  const resetVerification = () => {
    setIsVerified(false)
    setCurrentStep("nda")
    setNdaSigned(false)
    setKycCompleted(false)
    setKycInquiryId(null)
    setCompanyInfo(null)
    if (user) {
      const storageKey = `verification-${user.id}`
      localStorage.removeItem(storageKey)
    }
  }

  return (
    <VerificationContext.Provider
      value={{
        isVerified,
        currentStep,
        ndaSigned,
        kycCompleted,
        kycInquiryId,
        companyInfo,
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
