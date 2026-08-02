"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
  Play,
  FileText,
  Clock,
  ArrowRightLeft,
  Lock,
  Unlock,
  ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleAction = "allow" | "reject" | "conditional"
type RuleCategory = "source" | "asset" | "jurisdiction" | "risk"
type DecisionStatus = "approved" | "rejected" | "conditional" | "pending"

interface GovernanceRule {
  id: string
  name: string
  category: RuleCategory
  condition: string
  action: RuleAction
  priority: number
  active: boolean
  createdAt: string
}

interface CapitalRequest {
  sourceType: string
  sourceClassification: string
  amount: string
  assetClass: string
  jurisdiction: string
  riskRating: string
  sponsorName: string
  notes: string
}

interface DecisionResult {
  id: string
  request: CapitalRequest
  status: DecisionStatus
  triggeredRules: { ruleId: string; ruleName: string; action: RuleAction }[]
  reasoning: string
  timestamp: string
  overridden: boolean
  overrideReason?: string
  overrideAuthority?: string
  overrideBy?: string
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────

const INITIAL_RULES: GovernanceRule[] = [
  {
    id: "rule-001",
    name: "Accredited Investor Requirement",
    category: "source",
    condition: "Capital source must be an accredited investor or qualified institutional buyer",
    action: "conditional",
    priority: 1,
    active: true,
    createdAt: "2025-01-10",
  },
  {
    id: "rule-002",
    name: "High-Risk Asset Block",
    category: "asset",
    condition: "Asset risk rating above 8 is not eligible for deployment",
    action: "reject",
    priority: 1,
    active: true,
    createdAt: "2025-01-10",
  },
  {
    id: "rule-003",
    name: "Domestic Jurisdiction Only",
    category: "jurisdiction",
    condition: "Capital deployment is restricted to US-based jurisdictions",
    action: "reject",
    priority: 2,
    active: true,
    createdAt: "2025-01-12",
  },
  {
    id: "rule-004",
    name: "Minimum Commitment Threshold",
    category: "source",
    condition: "Individual investor capital must be at least $250,000 per commitment",
    action: "reject",
    priority: 2,
    active: true,
    createdAt: "2025-01-14",
  },
  {
    id: "rule-005",
    name: "Private Equity Risk Constraint",
    category: "risk",
    condition: "Private equity investments require risk documentation and sign-off",
    action: "conditional",
    priority: 3,
    active: true,
    createdAt: "2025-01-15",
  },
]

const INITIAL_DECISIONS: DecisionResult[] = [
  {
    id: "dec-001",
    request: {
      sourceType: "Institutional",
      sourceClassification: "Qualified Institutional Buyer",
      amount: "$5,000,000",
      assetClass: "Real Estate",
      jurisdiction: "California, USA",
      riskRating: "4",
      sponsorName: "Meridian Capital Group",
      notes: "Commercial real estate fund. LP structure. Delaware registered.",
    },
    status: "approved",
    triggeredRules: [
      { ruleId: "rule-001", ruleName: "Accredited Investor Requirement", action: "conditional" },
    ],
    reasoning:
      "Source is a Qualified Institutional Buyer — satisfies accredited requirement. Asset class and jurisdiction are compliant. Risk rating within threshold. Conditional rule resolved: QIB documentation on file.",
    timestamp: "2025-07-01T14:22:00Z",
    overridden: false,
  },
  {
    id: "dec-002",
    request: {
      sourceType: "Individual",
      sourceClassification: "High Net Worth Individual",
      amount: "$850,000",
      assetClass: "Private Equity",
      jurisdiction: "Delaware, USA",
      riskRating: "7",
      sponsorName: "James Whitmore",
      notes: "First-time LP. Requesting access to PE fund with complex structure.",
    },
    status: "conditional",
    triggeredRules: [
      { ruleId: "rule-001", ruleName: "Accredited Investor Requirement", action: "conditional" },
      { ruleId: "rule-005", ruleName: "Private Equity Risk Constraint", action: "conditional" },
    ],
    reasoning:
      "Two conditional rules triggered. Accredited status not yet verified. PE risk documentation has not been submitted. Approval withheld pending: (1) accreditation verification, (2) PE risk sign-off.",
    timestamp: "2025-07-02T09:15:00Z",
    overridden: false,
  },
  {
    id: "dec-003",
    request: {
      sourceType: "Foreign Entity",
      sourceClassification: "Foreign Private Issuer",
      amount: "$3,200,000",
      assetClass: "Real Estate",
      jurisdiction: "United Kingdom",
      riskRating: "5",
      sponsorName: "Argent Partners Ltd",
      notes: "UK-based entity seeking to deploy into US real estate.",
    },
    status: "rejected",
    triggeredRules: [
      { ruleId: "rule-003", ruleName: "Domestic Jurisdiction Only", action: "reject" },
    ],
    reasoning:
      "Hard rejection triggered by Domestic Jurisdiction Only rule. Capital source registered in the United Kingdom — outside permitted deployment jurisdictions. No override applicable without CRO authorization.",
    timestamp: "2025-07-03T16:44:00Z",
    overridden: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runDecisionEngine(
  request: CapitalRequest,
  rules: GovernanceRule[],
): Pick<DecisionResult, "status" | "triggeredRules" | "reasoning"> {
  const activeRules = rules.filter((r) => r.active).sort((a, b) => a.priority - b.priority)
  const triggered: DecisionResult["triggeredRules"] = []
  const reasons: string[] = []

  const amountNum = parseFloat(request.amount.replace(/[^0-9.]/g, "")) || 0
  const riskNum = parseFloat(request.riskRating) || 0
  const isUSJurisdiction =
    request.jurisdiction.toLowerCase().includes("usa") ||
    request.jurisdiction.toLowerCase().includes("united states") ||
    request.jurisdiction.toLowerCase().includes(", us")
  const isAccredited =
    request.sourceClassification.toLowerCase().includes("accredited") ||
    request.sourceClassification.toLowerCase().includes("qualified") ||
    request.sourceClassification.toLowerCase().includes("institutional")
  const isPE = request.assetClass.toLowerCase().includes("private equity")

  for (const rule of activeRules) {
    let fires = false

    if (rule.id === "rule-001" && !isAccredited) fires = true
    if (rule.id === "rule-002" && riskNum > 8) fires = true
    if (rule.id === "rule-003" && !isUSJurisdiction) fires = true
    if (rule.id === "rule-004" && request.sourceType === "Individual" && amountNum < 250000) fires = true
    if (rule.id === "rule-005" && isPE) fires = true

    // Generic rule: check if any key field appears in condition text
    if (!fires && rule.category === "source" && request.sourceType.toLowerCase().includes("foreign")) {
      if (rule.action === "reject") fires = true
    }

    if (fires) {
      triggered.push({ ruleId: rule.id, ruleName: rule.name, action: rule.action })
      if (rule.action === "reject") {
        reasons.push(`Rule "${rule.name}" triggered a hard rejection: ${rule.condition}.`)
      } else if (rule.action === "conditional") {
        reasons.push(`Rule "${rule.name}" requires conditional review: ${rule.condition}.`)
      }
    }
  }

  const hasReject = triggered.some((t) => t.action === "reject")
  const hasConditional = triggered.some((t) => t.action === "conditional")

  let status: DecisionStatus
  if (hasReject) {
    status = "rejected"
  } else if (hasConditional) {
    status = "conditional"
  } else {
    status = "approved"
  }

  const reasoning =
    reasons.length > 0
      ? reasons.join(" ") +
        (status === "approved"
          ? ""
          : status === "conditional"
            ? " All conditions must be resolved before final approval."
            : " Capital request cannot proceed.")
      : "No active governance rules were triggered. Capital request meets all current eligibility criteria."

  return { status, triggeredRules: triggered, reasoning }
}

function statusBadge(status: DecisionStatus) {
  const map: Record<DecisionStatus, string> = {
    approved: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 border border-red-500/30",
    conditional: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    pending: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  }
  return map[status]
}

function statusIcon(status: DecisionStatus) {
  if (status === "approved") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-400" />
  if (status === "conditional") return <AlertCircle className="w-4 h-4 text-amber-400" />
  return <Clock className="w-4 h-4 text-slate-400" />
}

function actionBadge(action: RuleAction) {
  const map: Record<RuleAction, string> = {
    allow: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    reject: "bg-red-500/15 text-red-300 border border-red-500/30",
    conditional: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  }
  return map[action]
}

function categoryColor(cat: RuleCategory) {
  const map: Record<RuleCategory, string> = {
    source: "text-blue-300",
    asset: "text-purple-300",
    jurisdiction: "text-cyan-300",
    risk: "text-orange-300",
  }
  return map[cat]
}

function fmtTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ts
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type EQTab = "classify" | "rules" | "decisions" | "overrides"

export function CapIVEQWorkspace({ defaultTab = "classify" }: { defaultTab?: EQTab }) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<EQTab>(defaultTab)
  const [rules, setRules] = useState<GovernanceRule[]>(INITIAL_RULES)
  const [decisions, setDecisions] = useState<DecisionResult[]>(INITIAL_DECISIONS)
  const [isSavingDecision, setIsSavingDecision] = useState(false)
  const [isSavingOverride, setIsSavingOverride] = useState(false)

  // ── Classify / Decision Engine state ──────────────────────────────────────
  const [request, setRequest] = useState<CapitalRequest>({
    sourceType: "",
    sourceClassification: "",
    amount: "",
    assetClass: "",
    jurisdiction: "",
    riskRating: "",
    sponsorName: "",
    notes: "",
  })
  const [pendingResult, setPendingResult] = useState<Omit<DecisionResult, "id" | "timestamp" | "overridden"> | null>(null)
  const [classifyError, setClassifyError] = useState("")

  // ── Rule Editor state ──────────────────────────────────────────────────────
  const [ruleForm, setRuleForm] = useState({
    name: "",
    category: "source" as RuleCategory,
    condition: "",
    action: "conditional" as RuleAction,
  })
  const [ruleSaved, setRuleSaved] = useState(false)

  // ── Override state ─────────────────────────────────────────────────────────
  const [overrideForm, setOverrideForm] = useState<{
    decisionId: string
    authority: string
    reason: string
    approvedBy: string
  }>({ decisionId: "", authority: "", reason: "", approvedBy: "" })
  const [overrideError, setOverrideError] = useState("")

  // ── Stats ──────────────────────────────────────────────────────────────────
  const approved = decisions.filter((d) => d.status === "approved").length
  const rejected = decisions.filter((d) => d.status === "rejected").length
  const conditional = decisions.filter((d) => d.status === "conditional").length
  const overridden = decisions.filter((d) => d.overridden).length

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRunDecision = useCallback(() => {
    setClassifyError("")
    const missing = (["sourceType", "sourceClassification", "amount", "assetClass", "jurisdiction", "riskRating", "sponsorName"] as const)
      .filter((k) => !request[k].trim())
    if (missing.length) {
      setClassifyError("Please fill in all required fields before running the decision engine.")
      return
    }
    const result = runDecisionEngine(request, rules)
    setPendingResult({ request: { ...request }, ...result })
  }, [request, rules])

  // ── Commit decision: persist to intelligence_signals then update local state ──
  const handleCommitDecision = useCallback(async () => {
    if (!pendingResult) return
    setIsSavingDecision(true)

    const { data: { user } } = await supabase.auth.getUser()
    const newDecision: DecisionResult = {
      id: `dec-${String(decisions.length + 1).padStart(3, "0")}`,
      ...pendingResult,
      timestamp: new Date().toISOString(),
      overridden: false,
    }

    if (user) {
      const { error } = await supabase.from("intelligence_signals").insert({
        user_id: user.id,
        signal_type: "capital_action",
        sponsor_name: pendingResult.request.sponsorName,
        source_type: pendingResult.request.sourceType,
        source_classification: pendingResult.request.sourceClassification,
        amount: pendingResult.request.amount,
        asset_class: pendingResult.request.assetClass,
        jurisdiction: pendingResult.request.jurisdiction,
        risk_rating: pendingResult.request.riskRating,
        decision_status: pendingResult.status,
        triggered_rules: pendingResult.triggeredRules,
        reasoning: pendingResult.reasoning,
        overridden: false,
        downstream_updates: { notes: pendingResult.request.notes },
      })
      if (error) console.error("[v0] Intelligence signal persist error:", error.message)
      else void logActivity({ action: `Capital decision: ${pendingResult.status}`, category: "compliance",
        metadata: { sponsor: pendingResult.request.sponsorName, status: pendingResult.status } })
    }

    setDecisions((prev) => [newDecision, ...prev])
    setPendingResult(null)
    setRequest({ sourceType: "", sourceClassification: "", amount: "", assetClass: "", jurisdiction: "", riskRating: "", sponsorName: "", notes: "" })
    setActiveTab("decisions")
    setIsSavingDecision(false)
  }, [pendingResult, decisions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveRule = useCallback(() => {
    if (!ruleForm.name.trim() || !ruleForm.condition.trim()) return
    const newRule: GovernanceRule = {
      id: `rule-${String(rules.length + 1).padStart(3, "0")}`,
      ...ruleForm,
      priority: rules.length + 1,
      active: true,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setRules((prev) => [...prev, newRule])
    setRuleForm({ name: "", category: "source", condition: "", action: "conditional" })
    setRuleSaved(true)
    setTimeout(() => setRuleSaved(false), 2500)
  }, [ruleForm, rules.length])

  const handleToggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
  }, [])

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // ── Override: update intelligence_signals row + local state ──
  const handleOverride = useCallback(async () => {
    setOverrideError("")
    if (!overrideForm.decisionId || !overrideForm.reason.trim() || !overrideForm.authority.trim() || !overrideForm.approvedBy.trim()) {
      setOverrideError("All fields are required to submit an override.")
      return
    }
    setIsSavingOverride(true)

    const { data: { user } } = await supabase.auth.getUser()
    // Find the matched decision to look up its sponsor/signal
    const targetDecision = decisions.find((d) => d.id === overrideForm.decisionId)

    if (user && targetDecision) {
      // Try to update the DB row if it was persisted (matching on sponsor + status)
      const { error } = await supabase.from("intelligence_signals")
        .update({
          decision_status: "approved",
          overridden: true,
          override_reason: overrideForm.reason,
          override_authority: overrideForm.authority,
          override_by: overrideForm.approvedBy,
        })
        .eq("user_id", user.id)
        .eq("sponsor_name", targetDecision.request.sponsorName)
        .eq("decision_status", targetDecision.status)
      if (error) console.error("[v0] Override persist error:", error.message)
      else void logActivity({ action: "Override applied", category: "compliance",
        metadata: { decision_id: overrideForm.decisionId, authority: overrideForm.authority, approved_by: overrideForm.approvedBy } })
    }

    setDecisions((prev) =>
      prev.map((d) =>
        d.id === overrideForm.decisionId
          ? { ...d, status: "approved" as DecisionStatus, overridden: true,
              overrideReason: overrideForm.reason, overrideAuthority: overrideForm.authority, overrideBy: overrideForm.approvedBy }
          : d,
      ),
    )
    setOverrideForm({ decisionId: "", authority: "", reason: "", approvedBy: "" })
    setIsSavingOverride(false)
  }, [overrideForm, decisions]) // eslint-disable-line react-hooks/exhaustive-deps

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blue-300/70 mb-1">CapIV™ EQ</p>
          <h1 className="text-2xl font-semibold text-white">Capital Governance Engine</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Classify capital sources, apply eligibility rules, enforce constraints, log decisions, and exercise override authority.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>{rules.filter((r) => r.active).length} active rules</span>
          <span className="text-slate-700">·</span>
          <span>{decisions.length} decisions logged</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Approved" value={approved} sub="Total approved decisions" accent="text-emerald-300" />
        <StatCard label="Rejected" value={rejected} sub="Hard rule rejections" accent="text-red-300" />
        <StatCard label="Conditional" value={conditional} sub="Pending conditions" accent="text-amber-300" />
        <StatCard label="Overrides" value={overridden} sub="CRO / authority overrides" accent="text-purple-300" />
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EQTab)} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-xl bg-slate-900/80 border border-slate-800 p-1">
          {(
            [
              { value: "classify", label: "Classify Capital" },
              { value: "rules", label: "Rule Engine" },
              { value: "decisions", label: "Decision Log" },
              { value: "overrides", label: "Overrides" },
            ] as const
          ).map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="text-xs rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Classify Capital ─────────────────────────────────────────────── */}
        <TabsContent value="classify" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input form */}
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-300" />
                  Capital Source Classification
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Enter the details of the capital request. The engine will evaluate it against all active governance rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Sponsor Name *</Label>
                    <Input
                      placeholder="e.g., Meridian Capital"
                      value={request.sponsorName}
                      onChange={(e) => setRequest((p) => ({ ...p, sponsorName: e.target.value }))}
                      className="bg-slate-950 border-slate-700 text-white text-sm h-9 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Commitment Amount *</Label>
                    <Input
                      placeholder="e.g., $2,500,000"
                      value={request.amount}
                      onChange={(e) => setRequest((p) => ({ ...p, amount: e.target.value }))}
                      className="bg-slate-950 border-slate-700 text-white text-sm h-9 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Source Type *</Label>
                    <Select value={request.sourceType} onValueChange={(v) => setRequest((p) => ({ ...p, sourceType: v }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Institutional">Institutional</SelectItem>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Foreign Entity">Foreign Entity</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Fund of Funds">Fund of Funds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Classification *</Label>
                    <Select value={request.sourceClassification} onValueChange={(v) => setRequest((p) => ({ ...p, sourceClassification: v }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Qualified Institutional Buyer">Qualified Institutional Buyer</SelectItem>
                        <SelectItem value="Accredited Investor">Accredited Investor</SelectItem>
                        <SelectItem value="High Net Worth Individual">High Net Worth Individual</SelectItem>
                        <SelectItem value="Non-Accredited Individual">Non-Accredited Individual</SelectItem>
                        <SelectItem value="Foreign Private Issuer">Foreign Private Issuer</SelectItem>
                        <SelectItem value="Registered Investment Advisor">Registered Investment Advisor</SelectItem>
                        <SelectItem value="Pension Fund">Pension Fund</SelectItem>
                        <SelectItem value="Endowment">Endowment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Asset Class *</Label>
                    <Select value={request.assetClass} onValueChange={(v) => setRequest((p) => ({ ...p, assetClass: v }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Private Equity">Private Equity</SelectItem>
                        <SelectItem value="Private Credit">Private Credit</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                        <SelectItem value="Hedge Fund">Hedge Fund</SelectItem>
                        <SelectItem value="Fixed Income">Fixed Income</SelectItem>
                        <SelectItem value="Mixed / Multi-Asset">Mixed / Multi-Asset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Risk Rating (1–10) *</Label>
                    <Select value={request.riskRating} onValueChange={(v) => setRequest((p) => ({ ...p, riskRating: v }))}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} — {n <= 3 ? "Low" : n <= 6 ? "Medium" : n <= 8 ? "High" : "Extreme"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Jurisdiction *</Label>
                  <Input
                    placeholder="e.g., Delaware, USA"
                    value={request.jurisdiction}
                    onChange={(e) => setRequest((p) => ({ ...p, jurisdiction: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm h-9 placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Notes / Context</Label>
                  <Textarea
                    placeholder="Additional context for this capital request..."
                    value={request.notes}
                    onChange={(e) => setRequest((p) => ({ ...p, notes: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm placeholder:text-slate-600 min-h-[72px] resize-none"
                  />
                </div>

                {classifyError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {classifyError}
                  </p>
                )}

                <Button
                  onClick={handleRunDecision}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm h-9 gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Governance Decision
                </Button>
              </CardContent>
            </Card>

            {/* Result panel */}
            <div className="space-y-4">
              {!pendingResult ? (
                <div className="h-full rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-10 text-center gap-3">
                  <Shield className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-600">
                    Fill in the capital request form and run the governance engine to see the decision.
                  </p>
                </div>
              ) : (
                <Card
                  className={`border ${
                    pendingResult.status === "approved"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : pendingResult.status === "rejected"
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon(pendingResult.status)}
                        <CardTitle className="text-white text-base capitalize">
                          {pendingResult.status === "approved"
                            ? "Capital Approved"
                            : pendingResult.status === "rejected"
                              ? "Capital Rejected"
                              : "Conditional Approval"}
                        </CardTitle>
                      </div>
                      <Badge className={statusBadge(pendingResult.status)}>
                        {pendingResult.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Request summary */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {[
                        ["Sponsor", pendingResult.request.sponsorName],
                        ["Amount", pendingResult.request.amount],
                        ["Source", pendingResult.request.sourceType],
                        ["Classification", pendingResult.request.sourceClassification],
                        ["Asset Class", pendingResult.request.assetClass],
                        ["Jurisdiction", pendingResult.request.jurisdiction],
                        ["Risk Rating", `${pendingResult.request.riskRating} / 10`],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-slate-500">{label}</p>
                          <p className="text-slate-200 font-medium">{val}</p>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-slate-800" />

                    {/* Triggered rules */}
                    {pendingResult.triggeredRules.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Rules Triggered</p>
                        {pendingResult.triggeredRules.map((t) => (
                          <div key={t.ruleId} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
                            <span className="text-xs text-slate-300">{t.ruleName}</span>
                            <Badge className={`text-xs ${actionBadge(t.action)}`}>{t.action}</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reasoning */}
                    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Decision Reasoning</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{pendingResult.reasoning}</p>
                    </div>

                    <Button
                      onClick={handleCommitDecision}
                      disabled={isSavingDecision}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm h-9 gap-2"
                    >
                      {isSavingDecision
                        ? <><span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving to Supabase...</>
                        : <><FileText className="w-3.5 h-3.5" />Log Decision to Record</>}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Active rules summary */}
              <Card className="bg-slate-900/80 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Active Governance Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rules.filter((r) => r.active).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChevronRight className={`w-3 h-3 ${categoryColor(rule.category)}`} />
                        <span className="text-xs text-slate-300">{rule.name}</span>
                      </div>
                      <Badge className={`text-xs ${actionBadge(rule.action)}`}>{rule.action}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Rule Engine ──────────────────────────────────────────────────── */}
        <TabsContent value="rules" className="space-y-6">
          {/* New rule form */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-300" />
                Add Governance Rule
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Define the condition and enforcement action. Rules are evaluated in priority order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 space-y-1.5">
                  <Label className="text-xs text-slate-400">Rule Name</Label>
                  <Input
                    placeholder="e.g., Min. Commitment $250k"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm h-9 placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Select value={ruleForm.category} onValueChange={(v) => setRuleForm((p) => ({ ...p, category: v as RuleCategory }))}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source">Capital Source</SelectItem>
                      <SelectItem value="asset">Asset Class</SelectItem>
                      <SelectItem value="jurisdiction">Jurisdiction</SelectItem>
                      <SelectItem value="risk">Risk Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Enforcement Action</Label>
                  <Select value={ruleForm.action} onValueChange={(v) => setRuleForm((p) => ({ ...p, action: v as RuleAction }))}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                      <SelectItem value="reject">Reject (Hard Block)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Rule Condition</Label>
                <Textarea
                  placeholder="Describe the eligibility condition in plain language..."
                  value={ruleForm.condition}
                  onChange={(e) => setRuleForm((p) => ({ ...p, condition: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-white text-sm placeholder:text-slate-600 min-h-[72px] resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveRule}
                  disabled={!ruleForm.name.trim() || !ruleForm.condition.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm h-9 gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </Button>
                {ruleSaved && <span className="text-xs text-emerald-400">Rule saved and active.</span>}
              </div>
            </CardContent>
          </Card>

          {/* Rules list */}
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-xl border px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 ${
                  rule.active ? "bg-slate-900/80 border-slate-800" : "bg-slate-950/40 border-slate-800/50 opacity-50"
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{rule.name}</span>
                    <Badge className={`text-xs ${actionBadge(rule.action)}`}>{rule.action}</Badge>
                    <span className={`text-xs uppercase tracking-wider font-medium ${categoryColor(rule.category)}`}>
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rule.condition}</p>
                  <p className="text-xs text-slate-600">Added {rule.createdAt} · Priority {rule.priority}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                    className="h-8 px-3 text-xs text-slate-400 hover:text-white"
                  >
                    {rule.active ? (
                      <><Lock className="w-3 h-3 mr-1" /> Active</>
                    ) : (
                      <><Unlock className="w-3 h-3 mr-1" /> Inactive</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Decision Log ─────────────────────────────────────────────────── */}
        <TabsContent value="decisions" className="space-y-4">
          {decisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <FileText className="w-8 h-8 text-slate-700" />
              <p className="text-sm text-slate-600">No decisions logged yet. Run the governance engine to record a decision.</p>
            </div>
          ) : (
            decisions.map((dec) => (
              <Card
                key={dec.id}
                className={`border ${
                  dec.status === "approved"
                    ? "bg-slate-900/80 border-slate-800"
                    : dec.status === "rejected"
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(dec.status)}
                      <div>
                        <p className="text-sm font-medium text-white">{dec.request.sponsorName}</p>
                        <p className="text-xs text-slate-500">{dec.id} · {fmtTimestamp(dec.timestamp)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dec.overridden && (
                        <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs">
                          Overridden
                        </Badge>
                      )}
                      <Badge className={statusBadge(dec.status)}>
                        {dec.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      ["Amount", dec.request.amount],
                      ["Asset Class", dec.request.assetClass],
                      ["Jurisdiction", dec.request.jurisdiction],
                      ["Risk Rating", `${dec.request.riskRating} / 10`],
                      ["Source Type", dec.request.sourceType],
                      ["Classification", dec.request.sourceClassification],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-slate-500">{label}</p>
                        <p className="text-slate-200 font-medium">{val}</p>
                      </div>
                    ))}
                  </div>

                  {dec.triggeredRules.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dec.triggeredRules.map((t) => (
                        <div key={t.ruleId} className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1">
                          <span className="text-xs text-slate-300">{t.ruleName}</span>
                          <Badge className={`text-xs py-0 ${actionBadge(t.action)}`}>{t.action}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Reasoning</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{dec.reasoning}</p>
                  </div>

                  {dec.overridden && (
                    <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                      <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Override Record</p>
                      <p className="text-xs text-slate-300">
                        <strong>{dec.overrideAuthority}</strong> ({dec.overrideBy}): {dec.overrideReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Overrides ────────────────────────────────────────────────────── */}
        <TabsContent value="overrides" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Override form */}
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-purple-300" />
                  Submit Override Authorization
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Overrides must include authority, full reasoning, and approver name. All overrides are permanently logged.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Decision to Override</Label>
                  <Select
                    value={overrideForm.decisionId}
                    onValueChange={(v) => setOverrideForm((p) => ({ ...p, decisionId: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                      <SelectValue placeholder="Select a rejected or conditional decision" />
                    </SelectTrigger>
                    <SelectContent>
                      {decisions
                        .filter((d) => d.status !== "approved" || d.overridden)
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.id} — {d.request.sponsorName} ({d.status})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Override Authority</Label>
                  <Select
                    value={overrideForm.authority}
                    onValueChange={(v) => setOverrideForm((p) => ({ ...p, authority: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm h-9">
                      <SelectValue placeholder="Select authority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chief Risk Officer">Chief Risk Officer</SelectItem>
                      <SelectItem value="Chief Investment Officer">Chief Investment Officer</SelectItem>
                      <SelectItem value="Managing Partner">Managing Partner</SelectItem>
                      <SelectItem value="Investment Committee">Investment Committee</SelectItem>
                      <SelectItem value="Compliance Officer">Compliance Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Approved By (Full Name)</Label>
                  <Input
                    placeholder="e.g., Sarah Chen"
                    value={overrideForm.approvedBy}
                    onChange={(e) => setOverrideForm((p) => ({ ...p, approvedBy: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm h-9 placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Override Reason / Justification</Label>
                  <Textarea
                    placeholder="Provide full justification for this override..."
                    value={overrideForm.reason}
                    onChange={(e) => setOverrideForm((p) => ({ ...p, reason: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm placeholder:text-slate-600 min-h-[88px] resize-none"
                  />
                </div>

                {overrideError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {overrideError}
                  </p>
                )}

                <Button
                  onClick={handleOverride}
                  disabled={isSavingOverride}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm h-9 gap-2"
                >
                  {isSavingOverride
                    ? <><span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving Override...</>
                    : <><CheckCircle2 className="w-3.5 h-3.5" />Authorize Override</>}
                </Button>
              </CardContent>
            </Card>

            {/* Override log */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Override Audit Trail</p>
              {decisions.filter((d) => d.overridden).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-xl border border-dashed border-slate-800 text-center">
                  <Lock className="w-6 h-6 text-slate-700" />
                  <p className="text-xs text-slate-600">No overrides have been issued.</p>
                </div>
              ) : (
                decisions
                  .filter((d) => d.overridden)
                  .map((d) => (
                    <Card key={d.id} className="bg-slate-900/80 border-slate-800">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{d.request.sponsorName}</p>
                            <p className="text-xs text-slate-500">{d.id} · {fmtTimestamp(d.timestamp)}</p>
                          </div>
                          <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs">
                            Override
                          </Badge>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">Authority</p>
                            <p className="text-slate-200">{d.overrideAuthority}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Approved By</p>
                            <p className="text-slate-200">{d.overrideBy}</p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                          <p className="text-xs text-slate-300 leading-relaxed">{d.overrideReason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
