"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useVerification } from "@/contexts/verification-context"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react"

export function AdminDebugPanel() {
  const { user, login, logout } = useAuth()
  const verification = useVerification()
  const router = useRouter()
  const [debugMode, setDebugMode] = useState(false)
  const [bypassVerification, setBypassVerification] = useState(false)
  const [mockUser, setMockUser] = useState({
    email: "admin@capiv.com",
    name: "Admin User",
    accountType: "investor" as const,
  })
  const [omSubmissions, setOmSubmissions] = useState<any[]>([])
  const [localStorageDump, setLocalStorageDump] = useState("{}")

  // Load debug settings from localStorage
  useEffect(() => {
    const savedDebugMode = localStorage.getItem("debug_mode") === "true"
    const savedBypass = localStorage.getItem("bypass_verification") === "true"
    setDebugMode(savedDebugMode)
    setBypassVerification(savedBypass)
  }, [])

  // Load offering memorandum submissions
  useEffect(() => {
    const submissions = JSON.parse(localStorage.getItem("om-submissions") || "[]")
    setOmSubmissions(submissions)
  }, [])

  const handleToggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled)
    localStorage.setItem("debug_mode", enabled.toString())
    if (enabled) {
      console.log("[v0] Debug mode enabled")
    }
  }

  const handleToggleBypassVerification = (enabled: boolean) => {
    setBypassVerification(enabled)
    localStorage.setItem("bypass_verification", enabled.toString())
    if (enabled) {
      console.log("[v0] Verification bypass enabled")
    }
  }

  useEffect(() => {
    const snapshot = Object.keys(localStorage).reduce((acc, key) => {
      acc[key] = localStorage.getItem(key)
      return acc
    }, {} as Record<string, string | null>)
    setLocalStorageDump(JSON.stringify(snapshot, null, 2))
  }, [
    debugMode,
    bypassVerification,
    user,
    verification.currentStep,
    verification.isVerified,
    omSubmissions,
  ])

  const handleUpdateOMStatus = (submissionId: string, newStatus: string) => {
    const updatedSubmissions = omSubmissions.map((sub) => (sub.id === submissionId ? { ...sub, status: newStatus } : sub))
    setOmSubmissions(updatedSubmissions)
    localStorage.setItem("om-submissions", JSON.stringify(updatedSubmissions))
  }

  const handleMockLogin = () => {
    login(mockUser.email, "password", mockUser.accountType)
    console.log("[v0] Mock user logged in:", mockUser)
  }

  const handleCompleteVerification = () => {
    // Mock complete all verification steps
    const mockData = {
      ndaSigned: true,
      ndaSignature: "Admin Debug",
      ndaDate: new Date().toISOString(),
      kycCompleted: true,
      kycInquiryId: "debug-inquiry-" + Date.now(),
      companyInfo: {
        companyName: "Debug Company",
        industry: "Real Estate",
        companySize: "11-50",
        website: "https://debug.com",
        address: "123 Debug St",
        city: "Debug City",
        state: "CA",
        zipCode: "90210",
        country: "USA",
        contactName: mockUser.name,
        contactTitle: "CEO",
        contactEmail: mockUser.email,
        contactPhone: "+1234567890",
        assetClasses: ["Multifamily", "Office"],
        investmentSizeMin: "1000000",
        investmentSizeMax: "10000000",
        geographicFocus: ["California", "Texas"],
        investmentStage: ["Development", "Stabilized"],
        riskProfile: "Moderate",
        investmentHorizon: "5-7 years",
        accreditedInvestor: true,
        regulatoryCompliance: true,
        amlCompliance: true,
      },
    }

    verification.completeNDA(mockData.ndaSignature)
    verification.completeKYC(mockData.kycInquiryId)
    verification.completeCompanyInfo(mockData.companyInfo)
    console.log("[v0] Verification completed with mock data")
  }

  const handleResetVerification = () => {
    verification.resetVerification()
    console.log("[v0] Verification reset")
  }

  const handleClearAllData = () => {
    localStorage.clear()
    window.location.reload()
  }

  const verificationSummary = verification.isVerified
    ? "Fully Verified"
    : verification.currentStep
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) || "Not Started"

  const summaryCards = [
    {
      title: "Debug Mode",
      value: debugMode ? "Enabled" : "Disabled",
      description: debugMode ? "Developer tooling unlocked" : "Standard session policies",
      badgeClass: debugMode ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30" : "bg-slate-800 text-slate-300",
    },
    {
      title: "Verification",
      value: verificationSummary,
      description: verification.isVerified
        ? "All gates cleared"
        : `${verification.ndaSigned ? "NDA ✓" : "NDA pending"} · ${verification.kycCompleted ? "KYC ✓" : "KYC pending"}`,
      badgeClass: verification.isVerified
        ? "bg-blue-500/10 text-blue-200 border border-blue-500/30"
        : "bg-amber-500/10 text-amber-200 border border-amber-500/30",
    },
    {
      title: "Active Session",
      value: user ? user.name ?? "Authenticated" : "No user",
      description: user?.email ?? "Run Mock Login to hydrate session",
      badgeClass: user ? "bg-cyan-500/10 text-cyan-200 border border-cyan-500/30" : "bg-slate-800 text-slate-300",
    },
    {
      title: "OM Queue",
      value: omSubmissions.length.toString(),
      description: omSubmissions.length ? "Awaiting review" : "Queue is clear",
      badgeClass: omSubmissions.length
        ? "bg-purple-500/10 text-purple-200 border border-purple-500/30"
        : "bg-slate-800 text-slate-300",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{card.title}</p>
              <span className={`px-2 py-0.5 text-xs rounded-full ${card.badgeClass}`}>{card.value}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="controls" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-1">
          <TabsTrigger value="controls" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Controls
          </TabsTrigger>
          <TabsTrigger value="state" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            System State
          </TabsTrigger>
          <TabsTrigger value="user" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            User Data
          </TabsTrigger>
          <TabsTrigger value="verification" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Verification
          </TabsTrigger>
          <TabsTrigger value="om-review" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            OM Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Debug Controls</CardTitle>
            <CardDescription>Toggle debug features and bypass requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <p className="text-sm text-muted-foreground">Enable console logging and debug features</p>
              </div>
              <Switch id="debug-mode" checked={debugMode} onCheckedChange={handleToggleDebugMode} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bypass-verification">Bypass Verification</Label>
                <p className="text-sm text-muted-foreground">Skip NDA, KYC, and company survey requirements</p>
              </div>
              <Switch
                id="bypass-verification"
                checked={bypassVerification}
                onCheckedChange={handleToggleBypassVerification}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleMockLogin} variant="outline">
                  Mock Login
                </Button>
                <Button onClick={handleCompleteVerification} variant="outline">
                  Complete Verification
                </Button>
                <Button onClick={handleResetVerification} variant="outline">
                  Reset Verification
                </Button>
                <Button onClick={handleClearAllData} variant="destructive">
                  Clear All Data
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Navigate to CRM</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable bypass verification and mock login first, then navigate to any CRM page
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button onClick={() => router.push("/")} variant="secondary" size="sm">
                  Dashboard
                </Button>
                <Button onClick={() => router.push("/core")} variant="secondary" size="sm">
                  CapIV Core
                </Button>
                <Button onClick={() => router.push("/access")} variant="secondary" size="sm">
                  CapIV Access
                </Button>
                <Button onClick={() => router.push("/deals")} variant="secondary" size="sm">
                  All Deals
                </Button>
                <Button onClick={() => router.push("/capiv-iq")} variant="secondary" size="sm">
                  CapIV IQ
                </Button>
                <Button onClick={() => router.push("/capiv-eq")} variant="secondary" size="sm">
                  CapIV EQ
                </Button>
                <Button onClick={() => router.push("/account")} variant="secondary" size="sm">
                  Account
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Mock User Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mock-email">Email</Label>
                  <Input
                    id="mock-email"
                    value={mockUser.email}
                    onChange={(e) => setMockUser({ ...mockUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mock-name">Name</Label>
                  <Input
                    id="mock-name"
                    value={mockUser.name}
                    onChange={(e) => setMockUser({ ...mockUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mock-account-type">Account Type</Label>
                  <Select
                    value={mockUser.accountType}
                    onValueChange={(value: any) => setMockUser({ ...mockUser, accountType: value })}
                  >
                    <SelectTrigger id="mock-account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtor">Realtor / Broker</SelectItem>
                      <SelectItem value="asset-holder">Asset Holder / Developer</SelectItem>
                      <SelectItem value="investor">Investor / Family Office</SelectItem>
                      <SelectItem value="capital-partner">Capital Partner</SelectItem>
                      <SelectItem value="service-provider">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

        <TabsContent value="state" className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>System State</CardTitle>
            <CardDescription>Current application state and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Debug Mode</Label>
                <Badge variant={debugMode ? "default" : "secondary"} className="ml-2">
                  {debugMode ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-semibold">Verification Bypass</Label>
                <Badge variant={bypassVerification ? "destructive" : "secondary"} className="ml-2">
                  {bypassVerification ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-semibold">Environment Variables</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Persona Template ID:</span>
                    <Badge variant="outline">{process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID || "Not Set"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Persona Environment ID:</span>
                    <Badge variant="outline">{process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID || "Not Set"}</Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">LocalStorage Data</Label>
                <Textarea className="mt-2 font-mono text-xs" rows={10} readOnly value={localStorageDump} />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Data</CardTitle>
              <CardDescription>Current authenticated user information</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Authentication Status</Label>
                    <Badge variant="default" className="ml-2">
                      Authenticated
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">User Data</Label>
                    <Textarea
                      className="mt-2 font-mono text-xs"
                      rows={8}
                      readOnly
                      value={JSON.stringify(user, null, 2)}
                    />
                  </div>
                  <Button onClick={logout} variant="outline">
                    Logout Current User
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No user currently authenticated</p>
                  <Button onClick={handleMockLogin}>Login with Mock User</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Current verification progress and data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Current Step</Label>
                  <Badge variant="default" className="ml-2">
                    {verification.currentStep}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Verification Progress</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">NDA Signed:</span>
                      <Badge variant={verification.ndaSigned ? "default" : "secondary"}>
                        {verification.ndaSigned ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">KYC Completed:</span>
                      <Badge variant={verification.kycCompleted ? "default" : "secondary"}>
                        {verification.kycCompleted ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Company Info:</span>
                      <Badge variant={verification.companyInfo ? "default" : "secondary"}>
                        {verification.companyInfo ? "Complete" : "Incomplete"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fully Verified:</span>
                      <Badge variant={verification.isVerified ? "default" : "secondary"}>
                        {verification.isVerified ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Verification Data</Label>
                  <Textarea
                    className="mt-2 font-mono text-xs"
                    rows={12}
                    readOnly
                    value={JSON.stringify(
                      {
                        currentStep: verification.currentStep,
                        ndaSigned: verification.ndaSigned,
                        ndaSignature: verification.ndaSignature,
                        ndaDate: verification.ndaDate,
                        kycCompleted: verification.kycCompleted,
                        kycInquiryId: verification.kycInquiryId,
                        companyInfo: verification.companyInfo,
                        isVerified: verification.isVerified,
                      },
                      null,
                      2,
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="om-review" className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Offering Memorandum Submissions</CardTitle>
            <CardDescription>Review and manage submitted offering memorandums</CardDescription>
          </CardHeader>
          <CardContent>
            {omSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600">Offering memorandum submissions will appear here for review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {omSubmissions.map((submission) => (
                  <Card key={submission.id} className="border border-slate-200/60 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{submission.dealTitle}</h4>
                          <p className="text-sm text-gray-600">Submitted by {submission.companyName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()} ·{" "}
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            submission.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : submission.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Contact</p>
                          <p className="font-medium">{submission.contactName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium">{submission.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Investment Amount</p>
                          <p className="font-medium">{submission.investmentAmount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Experience</p>
                          <p className="font-medium capitalize">{submission.investmentExperience}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Accredited Investor</p>
                          <Badge variant={submission.accreditedInvestor ? "default" : "secondary"}>
                            {submission.accreditedInvestor ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-500">Risk Profile</p>
                          <Badge variant="outline" className="capitalize">
                            {submission.riskProfile || "Not provided"}
                          </Badge>
                        </div>
                      </div>

                      {submission.additionalNotes && (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                          <p className="font-medium mb-1">Additional Notes</p>
                          <p>{submission.additionalNotes}</p>
                        </div>
                      )}

                      {submission.fileUpload && (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {submission.fileUpload.name || "File attached"}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateOMStatus(submission.id, "approved")}
                          disabled={submission.status === "approved"}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateOMStatus(submission.id, "rejected")}
                          disabled={submission.status === "rejected"}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateOMStatus(submission.id, "pending")}
                          disabled={submission.status === "pending"}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Reset to Pending
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
