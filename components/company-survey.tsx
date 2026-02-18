"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVerification, type CompanyInfo } from "@/contexts/verification-context"
import { Building2, ChevronRight, ChevronLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function CompanyInformationSurvey() {
  const { submitCompanyInfo } = useVerification()
  const [currentPage, setCurrentPage] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CompanyInfo>({
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
  })
  const focusGroups = [
    {
      category: "Real Estate",
      options: ["Land", "Commercial", "Hotel", "Mixed-Use", "Portfolio", "Masterplan — SFR", "Masterplan — Housing"],
    },
    {
      category: "Capital",
      options: ["Equity", "Debt", "GP/LP", "JV"],
    },
    {
      category: "Financing",
      options: ["Lending", "Brokering"],
    },
    {
      category: "Asset Holders",
      options: ["Sellers", "Owners", "Developers"],
    },
    {
      category: "Realtors / Brokers / Agencies",
      options: ["Full-Service Representation"],
    },
  ]

  const totalPages = 4
  const progress = (currentPage / totalPages) * 100

  const updateField = (field: keyof CompanyInfo, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const toggleArrayField = (field: keyof CompanyInfo, value: string) => {
    const currentArray = formData[field] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value]
    updateField(field, newArray)
  }

  const validatePage = (page: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (page === 1) {
      if (!formData.companyName.trim()) newErrors.companyName = "Company name is required"
      if (!formData.entityType) newErrors.entityType = "Entity type is required"
      if (!formData.jurisdiction.trim()) newErrors.jurisdiction = "Jurisdiction is required"
      if (!formData.businessAddress.trim()) newErrors.businessAddress = "Business address is required"
      if (!formData.city.trim()) newErrors.city = "City is required"
      if (!formData.country.trim()) newErrors.country = "Country is required"
    } else if (page === 2) {
      if (!formData.primaryContactName.trim()) newErrors.primaryContactName = "Contact name is required"
      if (!formData.primaryContactEmail.trim()) newErrors.primaryContactEmail = "Contact email is required"
      if (!formData.primaryContactPhone.trim()) newErrors.primaryContactPhone = "Contact phone is required"
    } else if (page === 3) {
      if (!formData.businessDescription.trim()) newErrors.businessDescription = "Business description is required"
      if (formData.dealInvestmentFocus.length === 0)
        newErrors.dealInvestmentFocus = "Select at least one deal or investment focus"
      if (!formData.investmentStrategy.trim()) newErrors.investmentStrategy = "Investment strategy is required"
    } else if (page === 4) {
      if (!formData.complianceOfficer.trim()) newErrors.complianceOfficer = "Compliance officer is required"
      if (!formData.complianceOfficerEmail.trim())
        newErrors.complianceOfficerEmail = "Compliance officer email is required"
      if (!formData.initialKycConfirmed) newErrors.initialKycConfirmed = "Initial KYC confirmation is required"
      if (!formData.digitalFileUploadReady)
        newErrors.digitalFileUploadReady = "Digital file upload confirmation is required"
      if (!formData.electronicSignature.trim())
        newErrors.electronicSignature = "Electronic signature is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validatePage(currentPage)) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }
  }

  const handleBack = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validatePage(currentPage)) {
      submitCompanyInfo(formData)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Company Information</CardTitle>
          <CardDescription className="text-base">
            Please provide your company details to complete verification
          </CardDescription>
          <div className="pt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentPage} of {totalPages}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Page 1: Company Details */}
            {currentPage === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="Enter company name"
                    />
                    {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entityType">Entity Type *</Label>
                    <Select value={formData.entityType} onValueChange={(value) => updateField("entityType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                        <SelectItem value="fund">Fund</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.entityType && <p className="text-sm text-destructive">{errors.entityType}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => updateField("registrationNumber", e.target.value)}
                      placeholder="Enter registration number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => updateField("taxId", e.target.value)}
                      placeholder="Enter tax ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incorporationDate">Incorporation Date</Label>
                    <Input
                      id="incorporationDate"
                      type="date"
                      value={formData.incorporationDate}
                      onChange={(e) => updateField("incorporationDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                    <Input
                      id="jurisdiction"
                      value={formData.jurisdiction}
                      onChange={(e) => updateField("jurisdiction", e.target.value)}
                      placeholder="e.g., Delaware, USA"
                    />
                    {errors.jurisdiction && <p className="text-sm text-destructive">{errors.jurisdiction}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => updateField("businessAddress", e.target.value)}
                    placeholder="Street address"
                  />
                  {errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="City"
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => updateField("zipCode", e.target.value)}
                      placeholder="ZIP code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      placeholder="Country"
                    />
                    {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => updateField("phoneNumber", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            )}

            {/* Page 2: Contact Information */}
            {currentPage === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Primary Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactName">Full Name *</Label>
                    <Input
                      id="primaryContactName"
                      value={formData.primaryContactName}
                      onChange={(e) => updateField("primaryContactName", e.target.value)}
                      placeholder="Enter full name"
                    />
                    {errors.primaryContactName && (
                      <p className="text-sm text-destructive">{errors.primaryContactName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryContactTitle">Title / Position</Label>
                    <Input
                      id="primaryContactTitle"
                      value={formData.primaryContactTitle}
                      onChange={(e) => updateField("primaryContactTitle", e.target.value)}
                      placeholder="e.g., Managing Partner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactEmail">Email Address *</Label>
                    <Input
                      id="primaryContactEmail"
                      type="email"
                      value={formData.primaryContactEmail}
                      onChange={(e) => updateField("primaryContactEmail", e.target.value)}
                      placeholder="email@company.com"
                    />
                    {errors.primaryContactEmail && (
                      <p className="text-sm text-destructive">{errors.primaryContactEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryContactPhone">Phone Number *</Label>
                    <Input
                      id="primaryContactPhone"
                      value={formData.primaryContactPhone}
                      onChange={(e) => updateField("primaryContactPhone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                    {errors.primaryContactPhone && (
                      <p className="text-sm text-destructive">{errors.primaryContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Investment Profile */}
            {currentPage === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Investment Profile</h3>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => updateField("businessDescription", e.target.value)}
                    placeholder="Describe your business and investment activities"
                    rows={4}
                  />
                  {errors.businessDescription && (
                    <p className="text-sm text-destructive">{errors.businessDescription}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Deal & Investment Focus *</Label>
                  <p className="text-sm text-muted-foreground">
                    Select all verticals and structures that align to your mandate.
                  </p>
                  <div className="space-y-4">
                    {focusGroups.map((group) => {
                      const optionList = group.options.length > 0 ? group.options : [group.category]
                      return (
                        <div key={group.category} className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{group.category}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {optionList.map((option) => {
                              const value =
                                option === group.category ? group.category : `${group.category} — ${option}`
                              return (
                                <div key={value} className="flex items-center space-x-2 rounded-lg border border-slate-200/20 px-3 py-2">
                                  <Checkbox
                                    id={`focus-${value}`}
                                    checked={formData.dealInvestmentFocus.includes(value)}
                                    onCheckedChange={() => toggleArrayField("dealInvestmentFocus", value)}
                                  />
                                  <Label htmlFor={`focus-${value}`} className="cursor-pointer text-sm">
                                    {option === group.category ? group.category : option}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {errors.dealInvestmentFocus && (
                    <p className="text-sm text-destructive">{errors.dealInvestmentFocus}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentStrategy">Deal / Investment Strategy *</Label>
                  <Textarea
                    id="investmentStrategy"
                    value={formData.investmentStrategy}
                    onChange={(e) => updateField("investmentStrategy", e.target.value)}
                    placeholder="Describe your investment strategy and approach"
                    rows={3}
                  />
                  {errors.investmentStrategy && <p className="text-sm text-destructive">{errors.investmentStrategy}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="typicalDealSize">Typical Deal Size</Label>
                    <Select
                      value={formData.typicalDealSize}
                      onValueChange={(value) => updateField("typicalDealSize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deal size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1M">Less than $1M</SelectItem>
                        <SelectItem value="1M-5M">$1M - $5M</SelectItem>
                        <SelectItem value="5M-10M">$5M - $10M</SelectItem>
                        <SelectItem value="10M-25M">$10M - $25M</SelectItem>
                        <SelectItem value="25M-50M">$25M - $50M</SelectItem>
                        <SelectItem value=">50M">Over $50M</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentHorizon">Investment Timeline</Label>
                    <Select
                      value={formData.investmentHorizon}
                      onValueChange={(value) => updateField("investmentHorizon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1year">Less than 1 year</SelectItem>
                        <SelectItem value="1-3years">1-3 years</SelectItem>
                        <SelectItem value="3-5years">3-5 years</SelectItem>
                        <SelectItem value="5-10years">5-10 years</SelectItem>
                        <SelectItem value=">10years">Over 10 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Geographic Focus</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "United States",
                      "Canada",
                      "Dubai / UAE / Middle East",
                      "Africa",
                      "Latin America / South America",
                      "Philippines / Asia",
                    ].map((region) => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={`geo-${region}`}
                          checked={formData.geographicFocus.includes(region)}
                          onCheckedChange={() => toggleArrayField("geographicFocus", region)}
                        />
                        <Label htmlFor={`geo-${region}`} className="cursor-pointer">
                          {region}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Asset Classes</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Multifamily", "Office", "Retail", "Industrial", "Mixed-Use", "Land", "Masterplan", "Housing"].map(
                      (asset) => (
                        <div key={asset} className="flex items-center space-x-2">
                          <Checkbox
                            id={`asset-${asset}`}
                            checked={formData.preferredAssetClasses.includes(asset)}
                            onCheckedChange={() => toggleArrayField("preferredAssetClasses", asset)}
                          />
                          <Label htmlFor={`asset-${asset}`} className="cursor-pointer">
                            {asset}
                          </Label>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page 4: Compliance */}
            {currentPage === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admission & Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Provide the information required for CapIV™ admission so our team can verify the legitimacy of your
                  application before activating access.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complianceOfficer">Compliance Officer Name *</Label>
                    <Input
                      id="complianceOfficer"
                      value={formData.complianceOfficer}
                      onChange={(e) => updateField("complianceOfficer", e.target.value)}
                      placeholder="Enter name"
                    />
                    {errors.complianceOfficer && <p className="text-sm text-destructive">{errors.complianceOfficer}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complianceOfficerEmail">Compliance Officer Email *</Label>
                    <Input
                      id="complianceOfficerEmail"
                      type="email"
                      value={formData.complianceOfficerEmail}
                      onChange={(e) => updateField("complianceOfficerEmail", e.target.value)}
                      placeholder="compliance@company.com"
                    />
                    {errors.complianceOfficerEmail && (
                      <p className="text-sm text-destructive">{errors.complianceOfficerEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialKycNotes">Initial KYC Package</Label>
                    <Textarea
                      id="initialKycNotes"
                      value={formData.initialKycNotes}
                      onChange={(e) => updateField("initialKycNotes", e.target.value)}
                      placeholder="List the government IDs, business registrations, or licenses you are providing."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="digitalFileRepositoryNotes">CapIV Member Profile Uploads</Label>
                    <Textarea
                      id="digitalFileRepositoryNotes"
                      value={formData.digitalFileRepositoryNotes}
                      onChange={(e) => updateField("digitalFileRepositoryNotes", e.target.value)}
                      placeholder="Reference the secure folder or note where uploads are stored in your CapIV Member Profile."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regulatoryLicenses">Regulatory Licenses / Registrations</Label>
                  <Textarea
                    id="regulatoryLicenses"
                    value={formData.regulatoryLicenses}
                    onChange={(e) => updateField("regulatoryLicenses", e.target.value)}
                    placeholder="List any relevant licenses, registrations, or regulatory approvals"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingSource">Source of Funds</Label>
                  <Textarea
                    id="fundingSource"
                    value={formData.fundingSource}
                    onChange={(e) => updateField("fundingSource", e.target.value)}
                    placeholder="Describe the source of investment capital"
                    rows={3}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Verification Checklist *</Label>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="initialKycConfirmed"
                        checked={formData.initialKycConfirmed}
                        onCheckedChange={(checked) => updateField("initialKycConfirmed", checked as boolean)}
                        className="border-amber-400 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-50 transition-colors"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="initialKycConfirmed" className="cursor-pointer font-medium">
                          Initial KYC Documentation Provided
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Government or legal ID plus business registration/license have been supplied for review.
                        </p>
                      </div>
                    </div>
                    {errors.initialKycConfirmed && (
                      <p className="text-sm text-destructive">{errors.initialKycConfirmed}</p>
                    )}

                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="digitalFileUploadReady"
                        checked={formData.digitalFileUploadReady}
                        onCheckedChange={(checked) => updateField("digitalFileUploadReady", checked as boolean)}
                        className="border-amber-400 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-50 transition-colors"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="digitalFileUploadReady" className="cursor-pointer font-medium">
                          Documents Loaded to CapIV™ Member Profile
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Copies of supporting documents have been uploaded to the secure digital file for future audits.
                        </p>
                      </div>
                    </div>
                    {errors.digitalFileUploadReady && (
                      <p className="text-sm text-destructive">{errors.digitalFileUploadReady}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="electronicSignature">Electronic Signature *</Label>
                  <Input
                    id="electronicSignature"
                    value={formData.electronicSignature}
                    onChange={(e) => updateField("electronicSignature", e.target.value)}
                    placeholder="Type your full legal name"
                  />
                  <p className="text-xs text-muted-foreground">
                    By signing this, you fully acknowledge this agreement. We do not spam and all information is kept
                    confidential.
                  </p>
                  {errors.electronicSignature && (
                    <p className="text-sm text-destructive">{errors.electronicSignature}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentPage < totalPages ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Submit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
