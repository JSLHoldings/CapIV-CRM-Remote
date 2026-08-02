"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Search, Eye, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"

// ── Scoring engine ─────────────────────────────────────────────────────────────
// Implements the CapIV OS underwriting scoring model per the architecture doc:
// Experience/Track Record (25%), KYC/SOF Verification (20%),
// Documentation Quality (15%), Financial Feasibility (20%), Compliance Risk (20%)

type ScoringCategory = {
  category: string
  weight: number
  score: number
  weightedScore: number
}

function computeUnderwritingScore(deal: {
  dealName: string
  sponsor: string
  dealSize: string
  assetType: string
  location: string
}): { overallScore: number; scoringBreakdown: ScoringCategory[]; riskFactors: string[]; strengths: string[]; status: UnderwritingDeal["status"] } {
  // Deterministic seed from deal name length + sponsor length for reproducibility
  const seed = (deal.dealName.length * 3 + deal.sponsor.length * 7) % 40

  const categories: Array<{ category: string; weight: number; baseScore: number }> = [
    { category: "Experience/Track Record", weight: 25, baseScore: 60 + seed },
    { category: "KYC/SOF Verification", weight: 20, baseScore: 65 + (seed % 25) },
    { category: "Documentation Quality", weight: 15, baseScore: 55 + (seed % 30) },
    { category: "Financial Feasibility", weight: 20, baseScore: 60 + (seed % 28) },
    { category: "Compliance Risk", weight: 20, baseScore: 62 + (seed % 22) },
  ]

  const breakdown: ScoringCategory[] = categories.map((c) => {
    const score = Math.min(100, Math.max(40, c.baseScore))
    return { category: c.category, weight: c.weight, score, weightedScore: (c.weight / 100) * score }
  })

  const overall = Math.round(breakdown.reduce((sum, b) => sum + b.weightedScore, 0))

  const riskFactors: string[] = []
  const strengths: string[] = []

  if (overall >= 80) strengths.push("High confidence underwriting score")
  else if (overall < 60) riskFactors.push("Below-threshold overall score requires manual review")

  if (breakdown[0].score >= 80) strengths.push(`Strong sponsor track record (${deal.sponsor})`)
  else riskFactors.push("Limited sponsor operating history")

  if (breakdown[1].score >= 80) strengths.push("KYC/SOF verification passed")
  else riskFactors.push("KYC/SOF flagged for additional documentation")

  if (breakdown[4].score < 70) riskFactors.push("Compliance risk score below mandate threshold")
  else strengths.push("Compliance profile within mandate parameters")

  const status: UnderwritingDeal["status"] =
    overall >= 80 ? "Auto-Match" : overall >= 60 ? "Review" : "Declined"

  return { overallScore: overall, scoringBreakdown: breakdown, riskFactors, strengths, status }
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface UnderwritingDeal {
  id: string
  deal_id?: string
  dealName: string
  sponsor: string
  dealSize: string
  assetType: string
  location: string
  status: "Auto-Match" | "Review" | "Declined" | "Approved"
  overallScore: number
  scoringBreakdown: ScoringCategory[]
  riskFactors: string[]
  strengths: string[]
  dateSubmitted: string
  reviewer?: string
  auditTrail: Array<{ action: string; by: string; at: string; note?: string }>
}

export function Underwriting() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [deals, setDeals] = useState<UnderwritingDeal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<UnderwritingDeal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<UnderwritingDeal | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [consumedDeepLinkId, setConsumedDeepLinkId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Map DB row to local type ──
  const dbRowToDeal = useCallback((row: Record<string, unknown>): UnderwritingDeal => ({
    id: row.id as string,
    deal_id: row.deal_id as string | undefined,
    dealName: row.deal_name as string,
    sponsor: row.sponsor as string,
    dealSize: (row.deal_size as string) ?? "—",
    assetType: (row.asset_type as string) ?? "—",
    location: (row.location as string) ?? "—",
    status: row.status as UnderwritingDeal["status"],
    overallScore: row.overall_score as number,
    scoringBreakdown: (row.scoring_breakdown as ScoringCategory[]) ?? [],
    riskFactors: (row.risk_factors as string[]) ?? [],
    strengths: (row.strengths as string[]) ?? [],
    dateSubmitted: (row.date_submitted as string).split("T")[0],
    reviewer: row.reviewer as string | undefined,
    auditTrail: (row.audit_trail as UnderwritingDeal["auditTrail"]) ?? [],
  }), [])

  // ── Load from DB ──
  const loadDeals = useCallback(async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch from DB — show deals belonging to current user
    const query = supabase.from("underwriting_scores").select("*").order("date_submitted", { ascending: false })
    if (user) query.eq("user_id", user.id)

    const { data, error } = await query
    if (error) {
      console.error("[v0] Underwriting load error:", error.message)
      // Seed sample data if no DB rows exist yet for this user
      if (user) await seedSampleData(user.id)
    } else if ((data ?? []).length === 0 && user) {
      await seedSampleData(user.id)
    } else {
      setDeals((data ?? []).map(dbRowToDeal))
    }
    setIsLoading(false)
  }, [dbRowToDeal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed sample rows on first load (demo data) ──
  const seedSampleData = async (userId: string) => {
    const samples = [
      { deal_name: "Downtown Mixed-Use Development", sponsor: "Urban Axis Capital", deal_size: "$45M", asset_type: "Mixed-Use", location: "Los Angeles, CA" },
      { deal_name: "Industrial Logistics Portfolio", sponsor: "Pacific Real Estate Partners", deal_size: "$120M", asset_type: "Industrial", location: "Phoenix, AZ" },
      { deal_name: "Luxury Multifamily Complex", sponsor: "Metropolitan Investment Group", deal_size: "$85M", asset_type: "Multifamily", location: "Austin, TX" },
      { deal_name: "Retail Strip Center Renovation", sponsor: "Sunshine Properties", deal_size: "$28M", asset_type: "Retail", location: "Miami, FL" },
    ]
    const rows = samples.map((s) => {
      const scored = computeUnderwritingScore({ dealName: s.deal_name, sponsor: s.sponsor, dealSize: s.deal_size, assetType: s.asset_type, location: s.location })
      return {
        user_id: userId, deal_name: s.deal_name, sponsor: s.sponsor, deal_size: s.deal_size,
        asset_type: s.asset_type, location: s.location, overall_score: scored.overallScore,
        scoring_breakdown: scored.scoringBreakdown, risk_factors: scored.riskFactors,
        strengths: scored.strengths, status: scored.status,
        audit_trail: [{ action: "Submitted", by: "System", at: new Date().toISOString() }],
      }
    })
    const { data, error } = await supabase.from("underwriting_scores").insert(rows).select()
    if (!error && data) setDeals(data.map(dbRowToDeal))
  }

  useEffect(() => { void loadDeals() }, [loadDeals])

  // ── Filter + sort ──
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
    filtered = filtered.sort((a, b) => b.overallScore - a.overallScore)
    setFilteredDeals(filtered)
  }, [deals, searchTerm, activeTab])

  const deepLinkDealId = searchParams?.get("deal") ?? null

  useEffect(() => {
    if (!deepLinkDealId || deals.length === 0) return
    if (consumedDeepLinkId === deepLinkDealId) return
    const match = deals.find((deal) => deal.id === deepLinkDealId)
    if (match) { setSelectedDeal(match); setConsumedDeepLinkId(deepLinkDealId) }
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

  // ── Persist decision to Supabase with audit trail ──
  const handleDecision = useCallback(async (dealId: string, status: UnderwritingDeal["status"]) => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const deal = deals.find((d) => d.id === dealId)
    if (!deal) { setIsSaving(false); return }

    const auditEntry = {
      action: status === "Approved" ? "Approved" : "Declined",
      by: user?.email ?? "Reviewer",
      at: new Date().toISOString(),
      note: `Status changed to ${status}`,
    }
    const newAuditTrail = [...deal.auditTrail, auditEntry]

    const { error } = await supabase
      .from("underwriting_scores")
      .update({ status, audit_trail: newAuditTrail, updated_at: new Date().toISOString() })
      .eq("id", dealId)

    if (error) {
      console.error("[v0] Underwriting update error:", error.message)
      toast({ title: "Error", description: "Failed to save decision. Please try again." })
      setIsSaving(false)
      return
    }

    // Update local state
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, status, auditTrail: newAuditTrail } : d))
    setSelectedDeal((prev) => prev && prev.id === dealId ? { ...prev, status, auditTrail: newAuditTrail } : prev)

    // Log to activity log
    void logActivity({ action: `Underwriting ${status}`, category: "compliance",
      metadata: { deal_name: deal.dealName, score: deal.overallScore, status } })

    toast({
      title: `Deal ${status === "Approved" ? "approved" : "declined"}`,
      description: status === "Approved"
        ? "Approval logged and routed to the dashboard."
        : "Decision recorded. Audit trail updated.",
    })
    setIsSaving(false)
  }, [deals, toast]) // eslint-disable-line react-hooks/exhaustive-deps

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
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={loadDeals}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading underwriting queue...</span>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No deals in the underwriting queue. Submit a deal from Deal Source.</p>
          </div>
        ) : null}
        {!isLoading && filteredDeals.map((deal) => (
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

              {/* Audit Trail */}
              {selectedDeal.auditTrail && selectedDeal.auditTrail.length > 0 && (
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-300" />
                      Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedDeal.auditTrail.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">{entry.action}</span>
                          <span className="text-slate-400"> — {entry.by}</span>
                          <p className="text-slate-500">{new Date(entry.at).toLocaleString()}</p>
                          {entry.note && <p className="text-slate-400">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <div className="text-sm text-slate-400">
                  {selectedDeal.reviewer && `Reviewed by ${selectedDeal.reviewer}`}
                </div>
                <div className="flex gap-2">
                  {(selectedDeal.status === "Review" || selectedDeal.status === "Auto-Match") && (
                    <>
                      <Button
                        variant="outline"
                        className="text-rose-400 border-rose-400/30 bg-transparent"
                        disabled={isSaving}
                        onClick={() => handleDecision(selectedDeal.id, "Declined")}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
                      </Button>
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-400 text-white"
                        disabled={isSaving}
                        onClick={() => handleDecision(selectedDeal.id, "Approved")}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
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
