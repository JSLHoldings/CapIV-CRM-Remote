"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Search, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface UnderwritingDeal {
  id: string
  dealName: string
  sponsor: string
  dealSize: string
  assetType: string
  location: string
  status: "Auto-Match" | "Review" | "Declined" | "Approved"
  overallScore: number
  scoringBreakdown: {
    category: string
    weight: number
    score: number
    weightedScore: number
  }[]
  riskFactors: string[]
  strengths: string[]
  dateSubmitted: string
  reviewer?: string
}

export function Underwriting() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [deals, setDeals] = useState<UnderwritingDeal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<UnderwritingDeal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<UnderwritingDeal | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [consumedDeepLinkId, setConsumedDeepLinkId] = useState<string | null>(null)

  const approvedStorageKey = "capiv-approved-deals"

  useEffect(() => {
    const sampleDeals: UnderwritingDeal[] = [
      {
        id: "1",
        dealName: "Downtown Mixed-Use Development",
        sponsor: "Urban Axis Capital",
        dealSize: "$45M",
        assetType: "Mixed-Use",
        location: "Los Angeles, CA",
        status: "Auto-Match",
        overallScore: 87,
        scoringBreakdown: [
          { category: "Experience/Track Record", weight: 25, score: 90, weightedScore: 22.5 },
          { category: "KYC/SOF Verification", weight: 20, score: 95, weightedScore: 19.0 },
          { category: "Documentation Quality", weight: 15, score: 85, weightedScore: 12.75 },
          { category: "Financial Feasibility", weight: 20, score: 80, weightedScore: 16.0 },
          { category: "Compliance Risk", weight: 20, score: 85, weightedScore: 17.0 },
        ],
        riskFactors: ["Construction timeline extends 18 months", "Requires zoning variance approval"],
        strengths: [
          "Sponsor has 15+ years experience",
          "Prime downtown location",
          "Pre-leased 40% of retail space",
          "Strong market fundamentals",
        ],
        dateSubmitted: "2025-01-15",
        reviewer: "Sarah Johnson",
      },
      {
        id: "2",
        dealName: "Industrial Logistics Portfolio",
        sponsor: "Pacific Real Estate Partners",
        dealSize: "$120M",
        assetType: "Industrial",
        location: "Phoenix, AZ",
        status: "Review",
        overallScore: 76,
        scoringBreakdown: [
          { category: "Regulatory/License Status", weight: 25, score: 85, weightedScore: 21.25 },
          { category: "Capital Availability", weight: 25, score: 70, weightedScore: 17.5 },
          { category: "KYC/AML Verification", weight: 25, score: 80, weightedScore: 20.0 },
          { category: "Mandate Clarity", weight: 15, score: 65, weightedScore: 9.75 },
          { category: "Compliance Check", weight: 10, score: 75, weightedScore: 7.5 },
        ],
        riskFactors: [
          "Limited operating history (3 years)",
          "Concentration risk - single tenant 45%",
          "Market vacancy rate trending up",
        ],
        strengths: ["Investment grade tenant base", "Long-term triple net leases", "Strategic logistics locations"],
        dateSubmitted: "2025-01-14",
      },
      {
        id: "3",
        dealName: "Luxury Multifamily Complex",
        sponsor: "Metropolitan Investment Group",
        dealSize: "$85M",
        assetType: "Multifamily",
        location: "Austin, TX",
        status: "Approved",
        overallScore: 92,
        scoringBreakdown: [
          { category: "Accreditation/Professional Status", weight: 20, score: 95, weightedScore: 19.0 },
          { category: "KYC/SOF Verification", weight: 25, score: 90, weightedScore: 22.5 },
          { category: "Track Record", weight: 20, score: 95, weightedScore: 19.0 },
          { category: "Reliability/Performance", weight: 15, score: 90, weightedScore: 13.5 },
          { category: "Compliance Status", weight: 20, score: 90, weightedScore: 18.0 },
        ],
        riskFactors: ["High-end market segment sensitivity"],
        strengths: [
          "Sponsor track record: 20+ years",
          "High-growth Austin submarket",
          "Value-add opportunities identified",
          "Strong demographic trends",
          "Experienced property management",
        ],
        dateSubmitted: "2025-01-12",
        reviewer: "Michael Chen",
      },
      {
        id: "4",
        dealName: "Retail Strip Center Renovation",
        sponsor: "Sunshine Properties",
        dealSize: "$28M",
        assetType: "Retail",
        location: "Miami, FL",
        status: "Declined",
        overallScore: 58,
        scoringBreakdown: [
          { category: "Experience/Track Record", weight: 25, score: 55, weightedScore: 13.75 },
          { category: "KYC/SOF Verification", weight: 20, score: 70, weightedScore: 14.0 },
          { category: "Documentation Quality", weight: 15, score: 50, weightedScore: 7.5 },
          { category: "Financial Feasibility", weight: 20, score: 55, weightedScore: 11.0 },
          { category: "Compliance Risk", weight: 20, score: 60, weightedScore: 12.0 },
        ],
        riskFactors: [
          "Declining retail sector fundamentals",
          "High vacancy rate (35%)",
          "Limited sponsor experience in retail",
          "Insufficient renovation budget",
          "Weak market demographics",
        ],
        strengths: ["Below-market acquisition price"],
        dateSubmitted: "2025-01-10",
        reviewer: "Sarah Johnson",
      },
    ]
    setDeals(sampleDeals)
    setFilteredDeals(sampleDeals)
  }, [])

  useEffect(() => {
    let filtered = deals.filter((deal) => {
      const matchesSearch =
        deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sponsor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "auto-match" && deal.status === "Auto-Match") ||
        (activeTab === "review" && deal.status === "Review") ||
        (activeTab === "approved" && deal.status === "Approved") ||
        (activeTab === "declined" && deal.status === "Declined")

      return matchesSearch && matchesTab
    })

    // Sort by score descending
    filtered = filtered.sort((a, b) => b.overallScore - a.overallScore)

    setFilteredDeals(filtered)
  }, [deals, searchTerm, activeTab])

  const deepLinkDealId = searchParams?.get("deal") ?? null

  useEffect(() => {
    if (!deepLinkDealId || deals.length === 0) {
      return
    }
    if (consumedDeepLinkId === deepLinkDealId) {
      return
    }
    const match = deals.find((deal) => deal.id === deepLinkDealId)
    if (match) {
      setSelectedDeal(match)
      setConsumedDeepLinkId(deepLinkDealId)
    }
  }, [deepLinkDealId, deals, consumedDeepLinkId])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-300"
    if (score >= 60) return "text-amber-300"
    return "text-rose-400"
  }

  const getStatusColor = (status: UnderwritingDeal["status"]) => {
    switch (status) {
      case "Auto-Match":
        return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      case "Review":
        return "border border-amber-500/30 bg-amber-500/10 text-amber-200"
      case "Approved":
        return "border border-blue-500/30 bg-blue-500/10 text-blue-200"
      case "Declined":
        return "border border-rose-500/30 bg-rose-500/10 text-rose-200"
      default:
        return "border border-slate-700 bg-slate-800 text-slate-300"
    }
  }

  const getStatusIcon = (status: UnderwritingDeal["status"]) => {
    switch (status) {
      case "Auto-Match":
        return <CheckCircle2 className="h-4 w-4" />
      case "Review":
        return <AlertTriangle className="h-4 w-4" />
      case "Approved":
        return <CheckCircle2 className="h-4 w-4" />
      case "Declined":
        return <XCircle className="h-4 w-4" />
    }
  }

  const stats = {
    total: deals.length,
    autoMatch: deals.filter((d) => d.status === "Auto-Match").length,
    review: deals.filter((d) => d.status === "Review").length,
    approved: deals.filter((d) => d.status === "Approved").length,
    declined: deals.filter((d) => d.status === "Declined").length,
  }

  const syncApprovedStorage = (deal: UnderwritingDeal, status: UnderwritingDeal["status"]) => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(approvedStorageKey)
    const parsed = stored ? (JSON.parse(stored) as Array<Record<string, string>>) : []
    if (status === "Approved") {
      const exists = parsed.some((item) => item.id === deal.id)
      if (!exists) {
        parsed.unshift({
          id: deal.id,
          name: deal.dealName,
          sponsor: deal.sponsor,
          size: deal.dealSize,
          location: deal.location,
          score: `${deal.overallScore}`,
          status: deal.status,
          date: new Date().toISOString(),
        })
      }
    } else {
      const next = parsed.filter((item) => item.id !== deal.id)
      window.localStorage.setItem(approvedStorageKey, JSON.stringify(next))
      return
    }
    window.localStorage.setItem(approvedStorageKey, JSON.stringify(parsed))
  }

  const handleDecision = (dealId: string, status: UnderwritingDeal["status"]) => {
    setDeals((prev) => {
      const next = prev.map((deal) => (deal.id === dealId ? { ...deal, status } : deal))
      const updated = next.find((deal) => deal.id === dealId)
      if (updated) {
        syncApprovedStorage(updated, status)
      }
      return next
    })
    setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, status } : prev))
    toast({
      title: `Deal ${status === "Approved" ? "approved" : "declined"}`,
      description: status === "Approved"
        ? "Approval logged and routed to the dashboard."
        : "Decision recorded and removed from approvals.",
    })
  }

  const buildUnderwritingReport = (deal: UnderwritingDeal) => {
    const lines = [
      "CapIV IQ Underwriting Report",
      `Deal: ${deal.dealName}`,
      `Sponsor: ${deal.sponsor}`,
      `Location: ${deal.location}`,
      `Asset Type: ${deal.assetType}`,
      `Deal Size: ${deal.dealSize}`,
      `Status: ${deal.status}`,
      `Overall Score: ${deal.overallScore}`,
      "",
      "Scoring Breakdown:",
      ...deal.scoringBreakdown.map(
        (item) => `- ${item.category}: Score ${item.score} (Weight ${item.weight}%, Weighted ${item.weightedScore.toFixed(1)})`
      ),
      "",
      "Risk Factors:",
      ...deal.riskFactors.map((risk) => `- ${risk}`),
      "",
      "Strengths:",
      ...deal.strengths.map((strength) => `- ${strength}`),
      "",
      `Reviewer: ${deal.reviewer ?? "CapIV IQ"}`,
      `Generated: ${new Date().toISOString()}`,
    ]
    return lines.join("\n")
  }

  const handleDownloadReport = (deal: UnderwritingDeal) => {
    const report = buildUnderwritingReport(deal)
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${deal.dealName.replace(/\s+/g, "_").toLowerCase()}_underwriting_report.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast({
      title: "Report downloaded",
      description: `Underwriting report generated for ${deal.dealName}.`,
    })
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Hero */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/20 via-slate-900 to-slate-950 p-6 shadow-inner shadow-blue-500/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-blue-200/80 mb-2">Underwriting Hub</p>
            <h1 className="text-2xl font-semibold text-white">Underwriting &amp; Risk Assessment</h1>
            <p className="text-slate-300 mt-2 max-w-3xl">
              AI-calibrated scoring from Deal Source, Diligence Hub, and CapIV Access so every mandate enters the stack
              with verifiable risk grading.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
              <Link href="/deals">Review Deal Source</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-500/60 text-slate-200 hover:border-blue-400">
              <Link href="/capiv-eq?tab=portfolio">Download Insights</Link>
            </Button>
            <Button
              className="bg-emerald-500/90 hover:bg-emerald-400 text-white"
              onClick={() => router.push("/deals")}
            >
              <FileText className="h-4 w-4 mr-2" />
              New Submission
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Deals</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Auto-Match (≥80)</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.autoMatch}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Review (60-79)</p>
                <p className="text-2xl font-bold text-amber-300 mt-1">{stats.review}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Approved</p>
                <p className="text-2xl font-bold text-blue-300 mt-1">{stats.approved}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Declined</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{stats.declined}</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-2xl bg-slate-900/80 border border-slate-800 p-1">
            {[
              { value: "all", label: "All Deals" },
              { value: "auto-match", label: "Auto-Match" },
              { value: "review", label: "Review" },
              { value: "approved", label: "Approved" },
              { value: "declined", label: "Declined" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            placeholder="Search by deal name, sponsor, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <Card
            key={deal.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => setSelectedDeal(deal)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{deal.dealName}</h3>
                      <p className="text-sm text-slate-400">{deal.sponsor}</p>
                    </div>
                    <Badge className={getStatusColor(deal.status)}>
                      {getStatusIcon(deal.status)}
                      <span className="ml-1">{deal.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-slate-400">Asset Type</p>
                      <p className="font-medium text-white">{deal.assetType}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Location</p>
                      <p className="font-medium text-white">{deal.location}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Deal Size</p>
                      <p className="font-medium text-white">{deal.dealSize}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Submitted</p>
                      <p className="font-medium text-white">{new Date(deal.dateSubmitted).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Overall Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(deal.overallScore)}`}>
                        {deal.overallScore}/100
                      </span>
                    </div>
                    <Progress value={deal.overallScore} className="h-2 bg-slate-800" />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deal Details Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-950 text-slate-100 border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Underwriting Analysis</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDeal.dealName}</h3>
                  <p className="text-sm text-slate-400">{selectedDeal.sponsor}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedDeal.overallScore)}`}>
                    {selectedDeal.overallScore}
                  </div>
                  <p className="text-xs text-slate-500">Overall Score</p>
                  <Badge className={`${getStatusColor(selectedDeal.status)} mt-2`}>{selectedDeal.status}</Badge>
                </div>
              </div>

              {/* Scoring Breakdown */}
              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base text-white">Scoring Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDeal.scoringBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span className="text-white">{item.category}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400">Weight: {item.weight}%</span>
                          <span className="font-semibold text-white">Score: {item.score}</span>
                          <span className={`font-bold ${getScoreColor(item.score)}`}>
                            {item.weightedScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Progress value={item.score} className="h-2 bg-slate-800" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Factors and Strengths */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedDeal.riskFactors.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-200">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-300" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedDeal.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-200">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <div className="text-sm text-slate-400">
                  {selectedDeal.reviewer && `Reviewed by ${selectedDeal.reviewer}`}
                </div>
                <div className="flex gap-2">
                  {selectedDeal.status === "Review" && (
                    <>
                      <Button
                        variant="outline"
                        className="text-rose-400 border-rose-400/30 bg-transparent"
                        onClick={() => handleDecision(selectedDeal.id, "Declined")}
                      >
                        Decline
                      </Button>
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-400 text-white"
                        onClick={() => handleDecision(selectedDeal.id, "Approved")}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-200"
                    onClick={() => handleDownloadReport(selectedDeal)}
                  >
                    Download Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
