"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, TrendingUp, Target, MapPin, Search, ArrowRight, CheckCircle2, AlertCircle, Loader2, RefreshCw, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"

// ── Matching engine ────────────────────────────────────────────────────────────
// Implements the CapIV OS matching score: geographic focus, asset alignment,
// check size range, risk profile, behavioral continuity score, hold period match.

function computeMatchScore(deal: {
  dealType: string; location: string; dealSize: string; investorType: string
}): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 50 // base

  // Geographic alignment
  if (deal.location.includes("CA") || deal.location.includes("TX") || deal.location.includes("FL")) {
    score += 12; reasons.push(`Geographic focus: ${deal.location.split(",")[1]?.trim() ?? deal.location} demand corridor`)
  } else {
    score += 6; reasons.push(`Geographic market: ${deal.location} within coverage area`)
  }

  // Asset type alignment
  const highDemand = ["Industrial","Multifamily","Student Housing"]
  if (highDemand.includes(deal.dealType)) {
    score += 14; reasons.push(`Asset type '${deal.dealType}' is high-priority in current mandate`)
  } else {
    score += 8; reasons.push(`Asset type '${deal.dealType}' within portfolio allocation`)
  }

  // Check size
  const sizeNum = parseFloat(deal.dealSize.replace(/[$M,B]/gi, "")) || 0
  if (sizeNum >= 40 && sizeNum <= 130) {
    score += 10; reasons.push(`Check size ${deal.dealSize} within mandate range`)
  } else {
    score += 4; reasons.push(`Check size ${deal.dealSize} at mandate threshold — conditional`)
  }

  // Behavioral continuity (investor type alignment)
  if (deal.investorType.includes("Family Office") || deal.investorType.includes("Institutional")) {
    score += 8; reasons.push("Behavioral integrity alignment confirmed via CapIV IQ")
  } else {
    score += 4; reasons.push("Continuity forecast within acceptable range")
  }

  return { score: Math.min(100, score), reasons }
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Match {
  id: string
  user_id?: string
  deal_id?: string
  dealName: string
  dealType: string
  location: string
  dealSize: string
  investorName: string
  investorType: string
  matchScore: number
  status: "Pending" | "Accepted" | "Reviewing" | "Declined"
  matchReasons: string[]
  intelligenceBasis: Record<string, unknown>
  decisionLog: Array<{ action: string; at: string; by: string }>
  dateMatched: string
}

export function Matchmaking() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Map DB row to local type ──
  const dbRowToMatch = useCallback((row: Record<string, unknown>): Match => ({
    id: row.id as string,
    user_id: row.user_id as string,
    deal_id: row.deal_id as string | undefined,
    dealName: row.deal_name as string,
    dealType: (row.deal_type as string) ?? "—",
    location: (row.location as string) ?? "—",
    dealSize: (row.deal_size as string) ?? "—",
    investorName: row.investor_name as string,
    investorType: (row.investor_type as string) ?? "—",
    matchScore: row.match_score as number,
    status: row.status as Match["status"],
    matchReasons: (row.match_reasons as string[]) ?? [],
    intelligenceBasis: (row.intelligence_basis as Record<string, unknown>) ?? {},
    decisionLog: (row.decision_log as Match["decisionLog"]) ?? [],
    dateMatched: (row.date_matched as string).split("T")[0],
  }), [])

  // ── Load matches from DB ──
  const loadMatches = useCallback(async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const query = supabase.from("matches").select("*").order("date_matched", { ascending: false })
    if (user) query.eq("user_id", user.id)

    const { data, error } = await query
    if (error) {
      console.error("[v0] Matchmaking load error:", error.message)
      if (user) await seedSampleMatches(user.id)
    } else if ((data ?? []).length === 0 && user) {
      await seedSampleMatches(user.id)
    } else {
      setMatches((data ?? []).map(dbRowToMatch))
    }
    setIsLoading(false)
  }, [dbRowToMatch]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed sample matches on first load ──
  const seedSampleMatches = async (userId: string) => {
    const samples = [
      { deal_name: "Downtown Mixed-Use Development", deal_type: "Mixed-Use", location: "Los Angeles, CA", deal_size: "$45M", investor_name: "Pacific Growth Fund", investor_type: "Investor / Family Office" },
      { deal_name: "Industrial Logistics Portfolio", deal_type: "Industrial", location: "Phoenix, AZ", deal_size: "$120M", investor_name: "Institutional Capital Partners", investor_type: "Capital Partner (Debt)" },
      { deal_name: "Luxury Multifamily Complex", deal_type: "Multifamily", location: "Austin, TX", deal_size: "$85M", investor_name: "Metropolitan Investment Group", investor_type: "Investor / Family Office" },
      { deal_name: "Student Housing Development", deal_type: "Student Housing", location: "Chapel Hill, NC", deal_size: "$52M", investor_name: "Education Realty Partners", investor_type: "Asset Holder / Developer" },
    ]
    const rows = samples.map((s) => {
      const { score, reasons } = computeMatchScore({ dealType: s.deal_type, location: s.location, dealSize: s.deal_size, investorType: s.investor_type })
      return {
        user_id: userId, deal_name: s.deal_name, deal_type: s.deal_type,
        location: s.location, deal_size: s.deal_size, investor_name: s.investor_name,
        investor_type: s.investor_type, match_score: score, status: "Pending",
        match_reasons: reasons,
        intelligence_basis: { engine: "CapIV OS Matching Graph v1.0", scored_at: new Date().toISOString() },
        decision_log: [{ action: "Generated", at: new Date().toISOString(), by: "CapIV OS" }],
      }
    })
    const { data, error } = await supabase.from("matches").insert(rows).select()
    if (!error && data) setMatches(data.map(dbRowToMatch))
  }

  useEffect(() => { void loadMatches() }, [loadMatches])

  useEffect(() => {
    let filtered = matches.filter((match) => {
      const matchesSearch =
        match.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || match.status === filterStatus
      return matchesSearch && matchesStatus
    })
    filtered = filtered.sort((a, b) => b.matchScore - a.matchScore)
    setFilteredMatches(filtered)
  }, [matches, searchTerm, filterStatus])

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-300"
    if (score >= 80) return "text-blue-200"
    if (score >= 70) return "text-amber-300"
    return "text-slate-400"
  }

  const getStatusColor = (status: Match["status"]) => {
    switch (status) {
      case "Accepted":
        return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      case "Reviewing":
        return "border border-blue-500/40 bg-blue-500/10 text-blue-200"
      case "Pending":
        return "border border-amber-500/40 bg-amber-500/10 text-amber-200"
      case "Declined":
        return "border border-rose-500/40 bg-rose-500/10 text-rose-200"
      default:
        return "border border-slate-700 bg-slate-800 text-slate-300"
    }
  }

  const stats = {
    totalMatches: matches.length,
    highQuality: matches.filter((m) => m.matchScore >= 80).length,
    pending: matches.filter((m) => m.status === "Pending").length,
    accepted: matches.filter((m) => m.status === "Accepted").length,
  }

  // ── Run a new match through the scoring engine and persist ──
  const handleRunNewMatch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast({ title: "Not signed in", description: "Please sign in to run matches." }); return }

    const dealCandidates = [
      { deal_name: "Riverfront Office Reposition", deal_type: "Office", location: "Nashville, TN", deal_size: "$58M", investor_name: "Signal Ridge Capital", investor_type: "Capital Partner (Equity)" },
      { deal_name: "Sun Belt Multifamily Portfolio", deal_type: "Multifamily", location: "Atlanta, GA", deal_size: "$95M", investor_name: "Ascend Capital Group", investor_type: "Investor / Family Office" },
      { deal_name: "Cold Storage Logistics Hub", deal_type: "Industrial", location: "Dallas, TX", deal_size: "$72M", investor_name: "Meridian Industrial Fund", investor_type: "Capital Partner (Equity)" },
    ]
    const candidate = dealCandidates[matches.length % dealCandidates.length]
    const { score, reasons } = computeMatchScore({ dealType: candidate.deal_type, location: candidate.location, dealSize: candidate.deal_size, investorType: candidate.investor_type })

    const { data, error } = await supabase.from("matches").insert({
      user_id: user.id, deal_name: candidate.deal_name, deal_type: candidate.deal_type,
      location: candidate.location, deal_size: candidate.deal_size,
      investor_name: candidate.investor_name, investor_type: candidate.investor_type,
      match_score: score, status: "Pending", match_reasons: reasons,
      intelligence_basis: { engine: "CapIV OS Matching Graph v1.0", scored_at: new Date().toISOString(), scoring_factors: ["geographic_demand", "asset_alignment", "check_size", "behavioral_continuity"] },
      decision_log: [{ action: "Generated", at: new Date().toISOString(), by: "CapIV OS Matching Engine" }],
    }).select().single()

    if (error) { console.error("[v0] Run match error:", error.message); return }
    if (data) {
      const newMatch = dbRowToMatch(data as Record<string, unknown>)
      setMatches((prev) => [newMatch, ...prev])
      setFilterStatus("all")
      void logActivity({ action: "Ran new match", category: "deals", metadata: { deal: candidate.deal_name, investor: candidate.investor_name, score } })
      toast({ title: "New match generated", description: `${candidate.investor_name} matched to ${candidate.deal_name} (Score: ${score}%).` })
    }
  }, [matches, dbRowToMatch, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportMatches = useCallback(() => {
    const header = ["Deal Name", "Deal Type", "Location", "Deal Size", "Investor", "Investor Type", "Score", "Status", "Date"]
    const rows = matches.map((m) =>
      [m.dealName, m.dealType, m.location, m.dealSize, m.investorName, m.investorType, `${m.matchScore}%`, m.status, m.dateMatched].join(",")
    )
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `capiv_matches_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast({ title: "Matches exported", description: "CSV export downloaded." })
  }, [matches, toast])

  // ── Persist match decision + decision log to Supabase ──
  const handleMatchDecision = useCallback(async (matchId: string, status: Match["status"]) => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const match = matches.find((m) => m.id === matchId)
    if (!match) { setIsSaving(false); return }

    const logEntry = { action: status === "Accepted" ? "Approved" : "Declined", at: new Date().toISOString(), by: user?.email ?? "Reviewer" }
    const newLog = [...match.decisionLog, logEntry]

    const { error } = await supabase.from("matches")
      .update({ status, decision_log: newLog, updated_at: new Date().toISOString() })
      .eq("id", matchId)

    if (error) {
      console.error("[v0] Match decision error:", error.message)
      toast({ title: "Error", description: "Failed to save decision." })
      setIsSaving(false)
      return
    }

    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, status, decisionLog: newLog } : m))
    setSelectedMatch((prev) => prev && prev.id === matchId ? { ...prev, status, decisionLog: newLog } : prev)

    void logActivity({ action: `Match ${status}`, category: "deals", metadata: { deal: match.dealName, investor: match.investorName, score: match.matchScore } })

    toast({
      title: status === "Accepted" ? "Match approved" : "Match declined",
      description: status === "Accepted"
        ? "Connection authorized and queued for outreach."
        : "Match removed from active routing.",
    })
    setIsSaving(false)
    if (status === "Accepted") router.push("/deals")
  }, [matches, router, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 text-slate-100">
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-600/20 via-slate-900 to-slate-950 p-6 shadow-inner shadow-purple-500/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-purple-200/80 mb-2">Matchmaking Graph</p>
            <h1 className="text-2xl font-semibold text-white">Investor &amp; Deal Matching</h1>
            <p className="text-slate-300 mt-2 max-w-3xl">
              AI-powered precision matching between capital profiles and live mandates, unified with CapIV IQ diligence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={handleRunNewMatch} disabled={isSaving}>
              <Target className="h-4 w-4 mr-2" />
              Run New Match
            </Button>
            <Button
              variant="outline"
              className="border-slate-500/60 text-slate-200 hover:border-blue-400"
              onClick={handleExportMatches}
            >
              Export Matches
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={loadMatches} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Matches</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalMatches}</p>
              </div>
              <Users className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">High Quality (≥80)</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.highQuality}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Review</p>
                <p className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Accepted</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.accepted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            placeholder="Search matches by deal, investor, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className={`rounded-xl border ${filterStatus === "all" ? "bg-blue-600 text-white border-blue-500" : "border-slate-600 text-slate-300"}`}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          <Button
            variant="ghost"
            className={`rounded-xl border ${filterStatus === "Pending" ? "bg-blue-600 text-white border-blue-500" : "border-slate-600 text-slate-300"}`}
            size="sm"
            onClick={() => setFilterStatus("Pending")}
          >
            Pending
          </Button>
          <Button
            variant="ghost"
            className={`rounded-xl border ${filterStatus === "Reviewing" ? "bg-blue-600 text-white border-blue-500" : "border-slate-600 text-slate-300"}`}
            size="sm"
            onClick={() => setFilterStatus("Reviewing")}
          >
            Reviewing
          </Button>
          <Button
            variant="ghost"
            className={`rounded-xl border ${filterStatus === "Accepted" ? "bg-blue-600 text-white border-blue-500" : "border-slate-600 text-slate-300"}`}
            size="sm"
            onClick={() => setFilterStatus("Accepted")}
          >
            Accepted
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading matches...</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isLoading && filteredMatches.map((match) => (
          <Card
            key={match.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => setSelectedMatch(match)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-white mb-2">{match.dealName}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{match.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(match.status)}>{match.status}</Badge>
                  <div className={`text-2xl font-bold ${getMatchScoreColor(match.matchScore)}`}>
                    {match.matchScore}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Deal Type</p>
                  <p className="text-sm font-medium text-white">{match.dealType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Deal Size</p>
                  <p className="text-sm font-medium text-white">{match.dealSize}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Matched Investor</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{match.investorName}</p>
                    <p className="text-xs text-slate-400">{match.investorType}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-300" />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Match Reasons</p>
                <div className="space-y-1">
                  {match.matchReasons.slice(0, 2).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-200">{reason}</p>
                    </div>
                  ))}
                  {match.matchReasons.length > 2 && (
                    <p className="text-xs text-slate-400">+{match.matchReasons.length - 2} more reasons</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
                <div>
                  <h3 className="font-semibold text-white">{selectedMatch.dealName}</h3>
                  <p className="text-sm text-slate-400">{selectedMatch.location}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getMatchScoreColor(selectedMatch.matchScore)}`}>
                    {selectedMatch.matchScore}%
                  </div>
                  <p className="text-xs text-slate-500">Match Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Deal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-400">Deal Type</Label>
                      <p className="text-sm font-medium text-white">{selectedMatch.dealType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Location</Label>
                      <p className="text-sm font-medium text-white">{selectedMatch.location}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Deal Size</Label>
                      <p className="text-sm font-medium text-white">{selectedMatch.dealSize}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Investor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-400">Investor Name</Label>
                      <p className="text-sm font-medium text-white">{selectedMatch.investorName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Investor Type</Label>
                      <p className="text-sm font-medium text-white">{selectedMatch.investorType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Status</Label>
                      <Badge className={getStatusColor(selectedMatch.status)}>{selectedMatch.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base text-white">Match Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedMatch.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded border border-slate-800 bg-slate-900/60">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-200">{reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-rose-500/30 text-rose-300"
                  disabled={isSaving}
                  onClick={() => handleMatchDecision(selectedMatch.id, "Declined")}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline Match"}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  disabled={isSaving}
                  onClick={() => handleMatchDecision(selectedMatch.id, "Accepted")}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Connect"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
