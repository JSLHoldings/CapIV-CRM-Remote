"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Users, TrendingUp, Target, MapPin, Search, ArrowRight, ArrowLeftRight, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, Shield, ShieldCheck, ShieldAlert, FileText, Gauge,
  Sparkles, Bot, Wand2, MessagesSquare,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
import {
  type Band, type Track, type CandidateState, type Direction, type DirectionResult,
  type TriVector, type RecommendedAction, type DecisionPacket, type EvaluationInput,
  BAND_LABEL, BAND_BADGE, BAND_ORDER, TRACK_LABEL, normalizeLegacyTrack,
  DIRECTION_LABEL, REASON_CODES, reasonFamilyOf, reasonDescription,
  REASON_FAMILY_LABEL, REASON_FAMILY_BADGE, type ReasonFamily,
  CANDIDATE_STATE_LABEL, CANDIDATE_STATE_BADGE, CANDIDATE_TRANSITIONS, canTransition,
  RECOMMENDED_ACTION_LABEL, evaluateReference, buildDecisionPacket,
  MATCHING_LOGIC_VERSION,
} from "@/lib/matching-logic"

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
  track: Track
  triVector: TriVector
  directions: DirectionResult[]
  reciprocalPass: boolean
  candidateState: CandidateState
  recommendedAction: RecommendedAction
  reasonCodes: string[]
  decisionPacket: DecisionPacket | null
  evaluationId: string
  decisionLog: Array<{ action: string; at: string; by: string }>
  dateMatched: string
}

// Friendly labels for state-transition action buttons.
const TRANSITION_LABEL: Record<CandidateState, string> = {
  RETRIEVED: "Reset to Retrieved",
  PRELIMINARY: "Move to Preliminary",
  REVIEW_REQUIRED: "Send to Review",
  QUALIFIED: "Qualify",
  INTRO_REQUESTED: "Request Introduction",
  INTRO_AUTHORIZED: "Authorize Introduction",
  INTRODUCED: "Mark Introduced",
  CLOSED: "Close Pair",
  HOLD: "Hold",
  BLOCK: "Block",
  DECLINED: "Decline",
  INACTIVE: "Mark Inactive",
  EXPIRED: "Mark Expired",
}

// Positive / primary transitions get the accent treatment.
const POSITIVE_TRANSITIONS: CandidateState[] = [
  "QUALIFIED", "INTRO_REQUESTED", "INTRO_AUTHORIZED", "INTRODUCED", "CLOSED",
]
const NEGATIVE_TRANSITIONS: CandidateState[] = ["DECLINED", "BLOCK", "INACTIVE", "EXPIRED"]

// Map a v1.1 candidate state back to the legacy status column so anything
// reading `matches.status` stays coherent.
function legacyStatusFor(state: CandidateState): string {
  if (["INTRO_AUTHORIZED", "INTRODUCED", "CLOSED"].includes(state)) return "Accepted"
  if (["DECLINED", "BLOCK", "EXPIRED", "INACTIVE"].includes(state)) return "Declined"
  if (["QUALIFIED", "INTRO_REQUESTED", "REVIEW_REQUIRED", "HOLD"].includes(state)) return "Reviewing"
  return "Pending"
}

// A candidate row plus optional evidence signals. When the signals are omitted
// (e.g. a match created from the "Run new match" action) we fall back to strong
// defaults so a well-formed record evaluates cleanly.
interface Candidate {
  deal_name: string; deal_type: string; location: string; deal_size: string
  investor_name: string; investor_type: string
  evidenceCompleteness?: number
  recordFreshDays?: number
  dealStageComplete?: boolean
  transactionPurpose?: string
}

// Build the presentation-safe evaluation input from a candidate row.
function toEvaluationInput(c: Candidate): { input: EvaluationInput; track: Track } {
  const track = normalizeLegacyTrack(/debt|credit/i.test(c.investor_type) ? "CREDIT" : "EQUITY")
  const input: EvaluationInput = {
    opportunityName: c.deal_name,
    track,
    assetClass: c.deal_type,
    geography: c.location,
    capitalNeed: c.deal_size,
    transactionPurpose: c.transactionPurpose ?? "acquisition",
    targetIrr: track === "EQ_EQUITY_TRACK" ? "16%" : undefined,
    holdOrTerm: track === "EQ_CREDIT_TRACK" ? "5yr" : "5-7yr",
    providerName: c.investor_name,
    providerType: c.investor_type,
    evidenceCompleteness: c.evidenceCompleteness ?? 0.8,
    recordFreshDays: c.recordFreshDays ?? 20,
    dealStageComplete: c.dealStageComplete ?? true,
  }
  return { input, track }
}

export function Matchmaking() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [filterState, setFilterState] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // Guards against the initial load/seed running twice (React strict mode
  // double-invokes effects), which would otherwise duplicate the seed rows.
  const didLoadRef = useRef(false)

  // ── Map DB row to local type ──
  const dbRowToMatch = useCallback((row: Record<string, unknown>): Match => {
    const directions = [
      row.direction_a_to_b as DirectionResult | null,
      row.direction_b_to_a as DirectionResult | null,
    ].filter(Boolean) as DirectionResult[]
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      deal_id: row.deal_id as string | undefined,
      dealName: row.deal_name as string,
      dealType: (row.deal_type as string) ?? "—",
      location: (row.location as string) ?? "—",
      dealSize: (row.deal_size as string) ?? "—",
      investorName: row.investor_name as string,
      investorType: (row.investor_type as string) ?? "—",
      track: normalizeLegacyTrack(row.track as string),
      triVector: {
        matchFit: (row.match_fit_band as Band) ?? "INSUFFICIENT",
        informationConfidence: (row.info_confidence_band as Band) ?? "INSUFFICIENT",
        executionReadiness: (row.exec_readiness_band as Band) ?? "INSUFFICIENT",
      },
      directions,
      reciprocalPass: Boolean(row.reciprocity_ok),
      candidateState: (row.candidate_state as CandidateState) ?? "RETRIEVED",
      recommendedAction:
        (row.decision_packet as DecisionPacket | null)?.recommendation ?? "REVIEW",
      reasonCodes: (row.reason_codes as string[]) ?? [],
      decisionPacket: (row.decision_packet as DecisionPacket | null) ?? null,
      evaluationId: (row.evaluation_id as string) ?? "",
      decisionLog: (row.decision_log as Match["decisionLog"]) ?? [],
      dateMatched: (row.date_matched as string)?.split("T")[0] ?? "",
    }
  }, [])

  // Build an insert row from a candidate, running the v1.1 reference engine.
  const buildMatchRow = useCallback(
    (userId: string, c: Candidate) => {
      const { input, track } = toEvaluationInput(c)
      const evaluationId = `EV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const result = evaluateReference(input, evaluationId)
      const snapshotId = evaluationId
      const packet = buildDecisionPacket({
        opportunityName: c.deal_name,
        providerName: c.investor_name,
        track,
        snapshotId,
        result,
      })
      const [aToB, bToA] = result.directions
      return {
        user_id: userId,
        deal_name: c.deal_name,
        deal_type: c.deal_type,
        location: c.location,
        deal_size: c.deal_size,
        investor_name: c.investor_name,
        investor_type: c.investor_type,
        // legacy columns kept in sync
        match_score: null,
        status: legacyStatusFor(result.candidateState),
        match_reasons: result.reasonCodes.map((code) => reasonDescription(code)),
        intelligence_basis: {
          engine: `JSL Tech Matching Logic ${MATCHING_LOGIC_VERSION}`,
          scored_at: result.scoredAt,
          policy_version: result.policyVersion,
          private_core_version: result.privateCoreVersion,
        },
        decision_log: [{ action: "Evaluated", at: result.scoredAt, by: `JSL Tech Matching ${MATCHING_LOGIC_VERSION}` }],
        // v1.1 columns
        track,
        match_fit_band: result.triVector.matchFit,
        info_confidence_band: result.triVector.informationConfidence,
        exec_readiness_band: result.triVector.executionReadiness,
        direction_a_to_b: aToB,
        direction_b_to_a: bToA,
        reciprocity_ok: result.reciprocalPass,
        candidate_state: result.candidateState,
        reason_codes: result.reasonCodes,
        decision_packet: packet,
        evaluation_id: evaluationId,
        logic_version: MATCHING_LOGIC_VERSION,
      }
    },
    [],
  )

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
    // The samples deliberately span the v1.1 outcome range so the tri-vector,
    // reason-code families and candidate-state model are all exercised:
    //  1) complete + fresh + in-mandate  -> QUALIFIED, no reason codes
    //  2) stale + thin evidence          -> HOLD (EVID: STALE_EVIDENCE / UNSUPPORTED_ASSERTION)
    //  3) incomplete deal + old record   -> HOLD (READY: DEAL_INCOMPLETE / TIMELINE_UNCONFIRMED)
    //  4) out-of-range size + excluded geo -> REVIEW_REQUIRED, reciprocity fails (FIT)
    const samples: Candidate[] = [
      { deal_name: "Industrial Logistics Portfolio", deal_type: "Industrial", location: "Phoenix, AZ", deal_size: "$120M", investor_name: "Institutional Capital Partners", investor_type: "Capital Partner (Debt)", evidenceCompleteness: 0.9, recordFreshDays: 12, dealStageComplete: true },
      { deal_name: "Downtown Mixed-Use Development", deal_type: "Mixed-Use", location: "Los Angeles, CA", deal_size: "$45M", investor_name: "Pacific Growth Fund", investor_type: "Investor / Family Office", evidenceCompleteness: 0.4, recordFreshDays: 210, dealStageComplete: true },
      { deal_name: "Luxury Multifamily Complex", deal_type: "Multifamily", location: "Austin, TX", deal_size: "$85M", investor_name: "Metropolitan Investment Group", investor_type: "Investor / Family Office", evidenceCompleteness: 0.75, recordFreshDays: 120, dealStageComplete: false },
      { deal_name: "Rural Land Assemblage", deal_type: "Land", location: "Bozeman, MT", deal_size: "$8M", investor_name: "Education Realty Partners", investor_type: "Asset Holder / Developer", evidenceCompleteness: 0.7, recordFreshDays: 30, dealStageComplete: true },
    ]
    // Re-check right before inserting so a concurrent load cannot double-seed.
    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
    if ((count ?? 0) > 0) {
      const { data: existing } = await supabase.from("matches").select("*").eq("user_id", userId)
      if (existing) setMatches(existing.map(dbRowToMatch))
      return
    }
    const rows = samples.map((s) => buildMatchRow(userId, s))
    const { data, error } = await supabase.from("matches").insert(rows).select()
    if (!error && data) setMatches(data.map(dbRowToMatch))
    else if (error) console.error("[v0] Seed error:", error.message)
  }

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    void loadMatches()
  }, [loadMatches])

  useEffect(() => {
    let filtered = matches.filter((match) => {
      const matchesSearch =
        match.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState =
        filterState === "all" ||
        (filterState === "qualified" && ["QUALIFIED", "INTRO_REQUESTED", "INTRO_AUTHORIZED", "INTRODUCED"].includes(match.candidateState)) ||
        (filterState === "review" && ["PRELIMINARY", "REVIEW_REQUIRED", "RETRIEVED"].includes(match.candidateState)) ||
        (filterState === "hold" && match.candidateState === "HOLD") ||
        (filterState === "declined" && ["DECLINED", "BLOCK", "EXPIRED", "INACTIVE"].includes(match.candidateState))
      return matchesSearch && matchesState
    })
    // Sort by reciprocal pass, then match-fit band strength.
    filtered = filtered.sort((a, b) => {
      if (a.reciprocalPass !== b.reciprocalPass) return a.reciprocalPass ? -1 : 1
      return BAND_ORDER[b.triVector.matchFit] - BAND_ORDER[a.triVector.matchFit]
    })
    setFilteredMatches(filtered)
  }, [matches, searchTerm, filterState])

  const stats = {
    totalMatches: matches.length,
    qualified: matches.filter((m) => ["QUALIFIED", "INTRO_REQUESTED", "INTRO_AUTHORIZED", "INTRODUCED"].includes(m.candidateState)).length,
    review: matches.filter((m) => ["PRELIMINARY", "REVIEW_REQUIRED", "RETRIEVED"].includes(m.candidateState)).length,
    hold: matches.filter((m) => m.candidateState === "HOLD").length,
  }

  // ── Run a new match through the v1.1 engine and persist ──
  const handleRunNewMatch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast({ title: "Not signed in", description: "Please sign in to run matches." }); return }

    const dealCandidates = [
      { deal_name: "Riverfront Office Reposition", deal_type: "Office", location: "Nashville, TN", deal_size: "$58M", investor_name: "Signal Ridge Capital", investor_type: "Capital Partner (Equity)" },
      { deal_name: "Sun Belt Multifamily Portfolio", deal_type: "Multifamily", location: "Atlanta, GA", deal_size: "$95M", investor_name: "Ascend Capital Group", investor_type: "Investor / Family Office" },
      { deal_name: "Cold Storage Logistics Hub", deal_type: "Industrial", location: "Dallas, TX", deal_size: "$72M", investor_name: "Meridian Industrial Fund", investor_type: "Capital Partner (Debt)" },
    ]
    const candidate = dealCandidates[matches.length % dealCandidates.length]
    const row = buildMatchRow(user.id, candidate)

    const { data, error } = await supabase.from("matches").insert(row).select().single()
    if (error) { console.error("[v0] Run match error:", error.message); toast({ title: "Error", description: "Failed to run match." }); return }
    if (data) {
      const newMatch = dbRowToMatch(data as Record<string, unknown>)
      setMatches((prev) => [newMatch, ...prev])
      setFilterState("all")
      void logActivity({
        action: "Ran new match",
        category: "deals",
        metadata: { deal: candidate.deal_name, investor: candidate.investor_name, state: newMatch.candidateState, reciprocalPass: newMatch.reciprocalPass },
      })
      toast({
        title: "New pair evaluated",
        description: `${candidate.investor_name} × ${candidate.deal_name} → ${CANDIDATE_STATE_LABEL[newMatch.candidateState]}.`,
      })
    }
  }, [matches, dbRowToMatch, buildMatchRow, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportMatches = useCallback(() => {
    const header = ["Deal", "Type", "Location", "Size", "Investor", "Track", "Match Fit", "Info Confidence", "Exec Readiness", "Reciprocal", "State", "Date"]
    const rows = matches.map((m) =>
      [
        m.dealName, m.dealType, m.location, m.dealSize, m.investorName, TRACK_LABEL[m.track],
        BAND_LABEL[m.triVector.matchFit], BAND_LABEL[m.triVector.informationConfidence], BAND_LABEL[m.triVector.executionReadiness],
        m.reciprocalPass ? "PASS" : "FAIL", CANDIDATE_STATE_LABEL[m.candidateState], m.dateMatched,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `jsl-tech_matches_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast({ title: "Matches exported", description: "CSV export downloaded." })
  }, [matches, toast])

  // ── Persist a governed state transition (§3.17 transition enforcement) ──
  const handleTransition = useCallback(async (matchId: string, target: CandidateState) => {
    const match = matches.find((m) => m.id === matchId)
    if (!match) return
    if (!canTransition(match.candidateState, target)) {
      toast({ title: "Transition blocked", description: `Cannot move from ${CANDIDATE_STATE_LABEL[match.candidateState]} to ${CANDIDATE_STATE_LABEL[target]}.` })
      return
    }
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const logEntry = { action: `${CANDIDATE_STATE_LABEL[match.candidateState]} → ${CANDIDATE_STATE_LABEL[target]}`, at: new Date().toISOString(), by: user?.email ?? "Reviewer" }
    const newLog = [...match.decisionLog, logEntry]

    const { error } = await supabase.from("matches")
      .update({ candidate_state: target, status: legacyStatusFor(target), decision_log: newLog, updated_at: new Date().toISOString() })
      .eq("id", matchId)

    if (error) {
      console.error("[v0] Transition error:", error.message)
      toast({ title: "Error", description: "Failed to save decision." })
      setIsSaving(false)
      return
    }

    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, candidateState: target, decisionLog: newLog } : m))
    setSelectedMatch((prev) => prev && prev.id === matchId ? { ...prev, candidateState: target, decisionLog: newLog } : prev)

    void logActivity({
      action: `Match → ${CANDIDATE_STATE_LABEL[target]}`,
      category: "deals",
      metadata: { deal: match.dealName, investor: match.investorName, from: match.candidateState, to: target },
    })

    toast({ title: "Decision recorded", description: `Pair moved to ${CANDIDATE_STATE_LABEL[target]}.` })
    setIsSaving(false)
    if (target === "INTRODUCED") router.push("/deals")
  }, [matches, router, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  // Group reason codes by family for display.
  const groupReasons = (codes: string[]): Record<ReasonFamily, string[]> => {
    const out = {} as Record<ReasonFamily, string[]>
    for (const code of codes) {
      const fam = reasonFamilyOf(code)
      if (!out[fam]) out[fam] = []
      out[fam].push(code)
    }
    return out
  }

  return (
    <div className="space-y-6 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-600/20 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-inner shadow-purple-500/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-xs uppercase tracking-[0.35em] text-purple-200/80">Matching Intelligence</p>
              <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">{MATCHING_LOGIC_VERSION}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white text-balance">Reciprocal Capital Matching</h1>
            <p className="text-slate-300 mt-2 max-w-3xl text-sm sm:text-base text-pretty">
              Each pair is evaluated in both directions and scored on three independent dimensions —
              Match Fit, Information Confidence, and Execution Readiness — governed by JSL Tech EQ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white" onClick={handleRunNewMatch} disabled={isSaving}>
              <Target className="h-4 w-4 mr-2" />
              Evaluate New Pair
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none border-slate-500/60 text-slate-200 hover:border-blue-400" onClick={handleExportMatches}>
              Export
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none border-slate-600 text-slate-300" onClick={loadMatches} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Evaluated Pairs" value={stats.totalMatches} icon={<Users className="h-8 w-8 text-blue-300" />} valueClass="text-white" />
        <StatCard label="Qualified" value={stats.qualified} icon={<CheckCircle2 className="h-8 w-8 text-emerald-300" />} valueClass="text-emerald-300" />
        <StatCard label="Needs Review" value={stats.review} icon={<AlertCircle className="h-8 w-8 text-amber-300" />} valueClass="text-amber-300" />
        <StatCard label="On Hold" value={stats.hold} icon={<Shield className="h-8 w-8 text-orange-300" />} valueClass="text-orange-300" />
      </div>

      <AiFrameworkSection />

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input
            placeholder="Search by deal, investor, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "qualified", label: "Qualified" },
            { id: "review", label: "Review" },
            { id: "hold", label: "Hold" },
            { id: "declined", label: "Declined" },
          ].map((f) => (
            <Button
              key={f.id}
              variant="ghost"
              size="sm"
              className={`rounded-xl border ${filterState === f.id ? "bg-blue-600 text-white border-blue-500" : "border-slate-600 text-slate-300"}`}
              onClick={() => setFilterState(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading matches...</span>
        </div>
      )}

      {!isLoading && filteredMatches.length === 0 && (
        <div className="text-center py-16 text-slate-400">No matches found for the current filter.</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isLoading && filteredMatches.map((match) => (
          <Card
            key={match.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => setSelectedMatch(match)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-white mb-2 truncate">{match.dealName}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{match.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={CANDIDATE_STATE_BADGE[match.candidateState]}>{CANDIDATE_STATE_LABEL[match.candidateState]}</Badge>
                  <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">{TRACK_LABEL[match.track]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tri-vector */}
              <div className="grid grid-cols-3 gap-2">
                <TriCell label="Match Fit" band={match.triVector.matchFit} />
                <TriCell label="Info Conf." band={match.triVector.informationConfidence} />
                <TriCell label="Exec Ready" band={match.triVector.executionReadiness} />
              </div>

              {/* Reciprocity */}
              <div className="flex items-center gap-2 text-xs">
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                {match.reciprocalPass ? (
                  <span className="text-emerald-300 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Reciprocal gate passed (both directions)</span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Reciprocity not satisfied</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">Capital Provider</p>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{match.investorName}</p>
                    <p className="text-xs text-slate-400 truncate">{match.investorType}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-300 shrink-0" />
                </div>
              </div>

              {match.reasonCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {match.reasonCodes.slice(0, 3).map((code) => (
                    <Badge key={code} className={`${REASON_FAMILY_BADGE[reasonFamilyOf(code)]} text-[10px]`}>{code}</Badge>
                  ))}
                  {match.reasonCodes.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">+{match.reasonCodes.length - 3}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              Decision Packet
              <Badge className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">{MATCHING_LOGIC_VERSION}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              {/* Header summary */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80 gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{selectedMatch.dealName}</h3>
                  <p className="text-sm text-slate-400 truncate">{selectedMatch.investorName} · {selectedMatch.location}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={CANDIDATE_STATE_BADGE[selectedMatch.candidateState]}>{CANDIDATE_STATE_LABEL[selectedMatch.candidateState]}</Badge>
                  <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">{TRACK_LABEL[selectedMatch.track]}</Badge>
                </div>
              </div>

              {/* Tri-vector */}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2"><Gauge className="h-3.5 w-3.5" /> Tri-Vector Assessment</p>
                <div className="grid grid-cols-3 gap-3">
                  <TriCell label="Match Fit" band={selectedMatch.triVector.matchFit} large />
                  <TriCell label="Information Confidence" band={selectedMatch.triVector.informationConfidence} large />
                  <TriCell label="Execution Readiness" band={selectedMatch.triVector.executionReadiness} large />
                </div>
              </div>

              {/* Reciprocal directions */}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2"><ArrowLeftRight className="h-3.5 w-3.5" /> Reciprocal Evaluation</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMatch.directions.map((d) => (
                    <div key={d.direction} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{DIRECTION_LABEL[d.direction]}</span>
                        {d.passedGate
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          : <AlertCircle className="h-4 w-4 text-amber-300" />}
                      </div>
                      <Badge className={BAND_BADGE[d.band]}>{BAND_LABEL[d.band]}</Badge>
                      <p className={`text-xs ${d.passedGate ? "text-emerald-300" : "text-amber-300"}`}>
                        {d.passedGate ? "Directional gate passed" : "Directional gate not passed"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className={`mt-2 text-xs flex items-center gap-1.5 ${selectedMatch.reciprocalPass ? "text-emerald-300" : "text-amber-300"}`}>
                  {selectedMatch.reciprocalPass ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  Reciprocity invariant: {selectedMatch.reciprocalPass ? "satisfied — both directions pass" : "not satisfied — a strong side cannot compensate for a weak side"}
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80 mb-1">EQ Recommended Action</p>
                <p className="text-sm font-medium text-white">{RECOMMENDED_ACTION_LABEL[selectedMatch.recommendedAction]}</p>
              </div>

              {/* Reason codes grouped by family */}
              {selectedMatch.reasonCodes.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Reason Codes</p>
                  <div className="space-y-2">
                    {Object.entries(groupReasons(selectedMatch.reasonCodes)).map(([fam, codes]) => (
                      <div key={fam} className="flex items-start gap-2">
                        <Badge className={`${REASON_FAMILY_BADGE[fam as ReasonFamily]} text-[10px] shrink-0`}>{REASON_FAMILY_LABEL[fam as ReasonFamily]}</Badge>
                        <div className="space-y-1">
                          {codes.map((code) => (
                            <p key={code} className="text-xs text-slate-300"><span className="font-mono text-slate-400">{code}</span> — {reasonDescription(code)}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {selectedMatch.decisionPacket?.limitations?.length ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Limitations</p>
                  <ul className="space-y-1">
                    {selectedMatch.decisionPacket.limitations.map((l, i) => (
                      <li key={i} className="text-xs text-slate-400">• {l}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Decision log */}
              {selectedMatch.decisionLog.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Decision Log</p>
                  <div className="space-y-1.5">
                    {selectedMatch.decisionLog.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-xs border border-slate-800 rounded px-3 py-1.5 bg-slate-900/60">
                        <span className="text-slate-200">{entry.action}</span>
                        <span className="text-slate-500">{entry.by} · {new Date(entry.at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governed state transition actions */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Governed Actions</p>
                <div className="flex flex-wrap justify-end gap-2">
                  {CANDIDATE_TRANSITIONS[selectedMatch.candidateState].length === 0 && (
                    <p className="text-xs text-slate-500">This pair is in a terminal state; no further actions.</p>
                  )}
                  {CANDIDATE_TRANSITIONS[selectedMatch.candidateState].map((target) => {
                    const negative = NEGATIVE_TRANSITIONS.includes(target)
                    const positive = POSITIVE_TRANSITIONS.includes(target)
                    return (
                      <Button
                        key={target}
                        variant={positive ? "default" : "outline"}
                        size="sm"
                        disabled={isSaving}
                        className={
                          positive
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : negative
                            ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                            : "border-slate-600 text-slate-200"
                        }
                        onClick={() => handleTransition(selectedMatch.id, target)}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : TRANSITION_LABEL[target]}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── AI framework (forward-looking preview, not yet wired to a model) ─────────
// Placeholder surface reserved for an upcoming AI copilot layered on top of the
// deterministic v1.1 engine. Intentionally inert — the input and action are
// disabled until the framework is connected.
function AiFrameworkSection() {
  const capabilities = [
    {
      icon: <MessagesSquare className="h-5 w-5 text-blue-300" />,
      title: "Natural-language matching",
      body: "Describe an ideal counterparty in plain English and let the copilot draft candidate criteria.",
    },
    {
      icon: <Wand2 className="h-5 w-5 text-purple-300" />,
      title: "Automated evidence synthesis",
      body: "Summarize dossiers and reconcile claims into a first-pass Information Confidence read.",
    },
    {
      icon: <Bot className="h-5 w-5 text-emerald-300" />,
      title: "Explainable recommendations",
      body: "Every suggestion cites the tri-vector bands and reason codes behind it — never a black box.",
    },
  ]

  return (
    <section
      aria-label="AI matching framework preview"
      className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-slate-900 to-slate-950 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
              <Sparkles className="h-5 w-5 text-blue-300" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">AI Matching Framework</h2>
              <p className="text-xs text-slate-400">Copilot layer on top of the deterministic v1.1 engine</p>
            </div>
          </div>
          <Badge className="bg-blue-500/15 text-blue-200 border border-blue-500/30 text-[10px] uppercase tracking-[0.2em]">
            Preview · Coming soon
          </Badge>
        </div>

        {/* Inert prompt surface reserved for the future model integration */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            disabled
            aria-label="AI matching prompt (coming soon)"
            placeholder="Describe your ideal capital partner or opportunity in plain language…"
            className="flex-1 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500"
          />
          <Button disabled className="bg-blue-600/60 text-white sm:w-auto w-full" title="Available in an upcoming release">
            <Sparkles className="h-4 w-4 mr-2" />
            Ask JSL Tech AI
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                {c.icon}
                <p className="text-sm font-medium text-white text-pretty">{c.title}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Small presentational helpers ─────────────────────────────────────────────

function StatCard({ label, value, icon, valueClass }: { label: string; value: number; icon: React.ReactNode; valueClass: string }) {
  return (
    <Card className="bg-slate-900/80 border border-slate-800">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-400 truncate">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
          </div>
          <span className="shrink-0">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TriCell({ label, band, large }: { label: string; band: Band; large?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
      <p className={`text-slate-400 ${large ? "text-xs" : "text-[10px]"} mb-1.5 leading-tight`}>{label}</p>
      <Badge className={`${BAND_BADGE[band]} ${large ? "text-xs" : "text-[10px]"}`}>{BAND_LABEL[band]}</Badge>
    </div>
  )
}
