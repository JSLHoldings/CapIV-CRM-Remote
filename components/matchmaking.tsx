"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, TrendingUp, Target, MapPin, Search, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Match {
  id: string
  dealName: string
  dealType: string
  location: string
  dealSize: string
  investorName: string
  investorType: string
  matchScore: number
  status: "Pending" | "Accepted" | "Reviewing" | "Declined"
  matchReasons: string[]
  dateMatched: string
}

export function Matchmaking() {
  const router = useRouter()
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const sampleMatches: Match[] = [
      {
        id: "1",
        dealName: "Downtown Mixed-Use Development",
        dealType: "Mixed-Use",
        location: "Los Angeles, CA",
        dealSize: "$45M",
        investorName: "Pacific Growth Fund",
        investorType: "Investor / Family Office",
        matchScore: 92,
        status: "Pending",
        matchReasons: [
          "Geographic focus: California",
          "Asset type preference: Mixed-Use",
          "Investment size range: $40M-$60M",
          "Risk profile: Value-Add",
        ],
        dateMatched: "2025-01-15",
      },
      {
        id: "2",
        dealName: "Industrial Logistics Portfolio",
        dealType: "Industrial",
        location: "Phoenix, AZ",
        dealSize: "$120M",
        investorName: "Institutional Capital Partners",
        investorType: "Capital Partner (Debt)",
        matchScore: 88,
        status: "Reviewing",
        matchReasons: [
          "Asset type: Industrial preferred",
          "Check size: $100M-$150M",
          "Geographic coverage: Southwest US",
          "LTV requirements: 65% max",
        ],
        dateMatched: "2025-01-14",
      },
      {
        id: "3",
        dealName: "Luxury Multifamily Complex",
        dealType: "Multifamily",
        location: "Austin, TX",
        dealSize: "$85M",
        investorName: "Metropolitan Investment Group",
        investorType: "Investor / Family Office",
        matchScore: 85,
        status: "Accepted",
        matchReasons: [
          "Target markets: Texas growth cities",
          "Multifamily focus",
          "Investment range: $75M-$100M",
          "Hold period: 4-6 years",
        ],
        dateMatched: "2025-01-12",
      },
      {
        id: "4",
        dealName: "Office Building Acquisition",
        dealType: "Office",
        location: "Denver, CO",
        dealSize: "$65M",
        investorName: "Core Real Estate Fund",
        investorType: "Investor / Family Office",
        matchScore: 78,
        status: "Pending",
        matchReasons: [
          "Core investment strategy",
          "Office sector allocation",
          "Mountain West region",
          "Stable cash flow preference",
        ],
        dateMatched: "2025-01-10",
      },
      {
        id: "5",
        dealName: "Student Housing Development",
        dealType: "Student Housing",
        location: "Chapel Hill, NC",
        dealSize: "$52M",
        investorName: "Education Realty Partners",
        investorType: "Asset Holder / Developer",
        matchScore: 95,
        status: "Accepted",
        matchReasons: [
          "Specialized in student housing",
          "Southeast US focus",
          "Development expertise",
          "University partnerships",
        ],
        dateMatched: "2025-01-08",
      },
    ]
    setMatches(sampleMatches)
    setFilteredMatches(sampleMatches)
  }, [])

  useEffect(() => {
    let filtered = matches.filter((match) => {
      const matchesSearch =
        match.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || match.status === filterStatus

      return matchesSearch && matchesStatus
    })

    // Sort by match score descending
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

  const handleRunNewMatch = () => {
    const now = new Date().toISOString().split("T")[0]
    const newMatch: Match = {
      id: `${Date.now()}`,
      dealName: "Riverfront Office Reposition",
      dealType: "Office",
      location: "Nashville, TN",
      dealSize: "$58M",
      investorName: "Signal Ridge Capital",
      investorType: "Capital Partner (Equity)",
      matchScore: 84,
      status: "Pending",
      matchReasons: [
        "Behavioral integrity alignment confirmed",
        "Continuity forecast supports 5-year hold",
        "Macro exposure aligned with Sunbelt growth",
        "Liquidity fragility within mandate thresholds",
      ],
      dateMatched: now,
    }
    setMatches((prev) => [newMatch, ...prev])
    setFilterStatus("all")
    toast({
      title: "New match generated",
      description: `${newMatch.investorName} matched to ${newMatch.dealName}.`,
    })
  }

  const handleExportMatches = () => {
    const header = ["Deal Name", "Deal Type", "Location", "Deal Size", "Investor", "Investor Type", "Score", "Status", "Date"]
    const rows = matches.map((match) =>
      [
        match.dealName,
        match.dealType,
        match.location,
        match.dealSize,
        match.investorName,
        match.investorType,
        `${match.matchScore}%`,
        match.status,
        match.dateMatched,
      ].join(",")
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
    toast({
      title: "Matches exported",
      description: "CSV export downloaded.",
    })
  }

  const handleMatchDecision = (matchId: string, status: Match["status"]) => {
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, status } : match)))
    setSelectedMatch((prev) => (prev && prev.id === matchId ? { ...prev, status } : prev))
    toast({
      title: status === "Accepted" ? "Match approved" : "Match declined",
      description: status === "Accepted"
        ? "Connection authorized and queued for outreach."
        : "Match removed from active routing.",
    })
    if (status === "Accepted") {
      router.push("/deals")
    }
  }

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
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={handleRunNewMatch}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMatches.map((match) => (
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
                  onClick={() => handleMatchDecision(selectedMatch.id, "Declined")}
                >
                  Decline Match
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => handleMatchDecision(selectedMatch.id, "Accepted")}
                >
                  Approve & Connect
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
