// JSL Tech Canonical Deal Schema v1.0
// Data contract derived from CAPIV-DATA-DEAL-001 (Deal Schema Architecture v1.0).
// A single universal "deal envelope": identity/governance, core profile, capital
// request, parties, economics, and the R0-R6 lifecycle state machine.

// ── Controlled vocabularies (versioned taxonomy) ────────────────────────────

export const TAXONOMY_VERSION = "capiv-deal-taxonomy-v1.0"
export const SCHEMA_ID = "CAPIV-DEAL-CANONICAL"

// 4. Deal taxonomy — one primary extension per deal
export const DEAL_TYPES = [
  { value: "RE_DIRECT", label: "Direct Real Estate / JV", short: "RE Direct" },
  { value: "PRIVATE_CREDIT", label: "Private Credit / Debt", short: "Private Credit" },
  { value: "FUND_GP_LP", label: "Fund / GP-LP", short: "Fund" },
  { value: "OPCO_EQUITY", label: "Operating Company Equity", short: "OpCo Equity" },
  { value: "M_AND_A", label: "Company / Asset Acquisition", short: "M&A" },
  { value: "SPV_COINVEST", label: "SPV / Co-Investment", short: "SPV" },
  { value: "PORTFOLIO_ASSET", label: "Portfolio / Multi-Asset", short: "Portfolio" },
  { value: "DIGITAL_INTERFACE", label: "Digital / Tokenized Interface", short: "Digital" },
] as const
export type DealTypePrimary = (typeof DEAL_TYPES)[number]["value"]

// 6.1 source_channel
export const SOURCE_CHANNELS = [
  { value: "direct", label: "Direct" },
  { value: "broker", label: "Broker" },
  { value: "partner", label: "Partner" },
  { value: "event", label: "Event" },
  { value: "internal", label: "Internal" },
  { value: "import", label: "Import" },
  { value: "api", label: "API" },
] as const
export type SourceChannel = (typeof SOURCE_CHANNELS)[number]["value"]

// 6.1 data_classification
export const DATA_CLASSIFICATIONS = [
  { value: "internal", label: "Internal" },
  { value: "restricted", label: "Restricted" },
  { value: "highly_restricted", label: "Highly Restricted" },
] as const
export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number]["value"]

// 6.2 transaction_purpose
export const TRANSACTION_PURPOSES = [
  { value: "acquisition", label: "Acquisition" },
  { value: "development", label: "Development" },
  { value: "recap", label: "Recapitalization" },
  { value: "refinance", label: "Refinance" },
  { value: "growth", label: "Growth" },
  { value: "buyout", label: "Buyout" },
  { value: "liquidity", label: "Liquidity" },
  { value: "fundraise", label: "Fundraise" },
  { value: "other", label: "Other" },
] as const
export type TransactionPurpose = (typeof TRANSACTION_PURPOSES)[number]["value"]

// 6.2 deal_stage
export const DEAL_STAGES = [
  { value: "concept", label: "Concept" },
  { value: "sourcing", label: "Sourcing" },
  { value: "LOI", label: "LOI" },
  { value: "under_contract", label: "Under Contract" },
  { value: "diligence", label: "Diligence" },
  { value: "financing", label: "Financing" },
  { value: "closing", label: "Closing" },
  { value: "operating", label: "Operating" },
  { value: "exit", label: "Exit" },
] as const
export type DealStage = (typeof DEAL_STAGES)[number]["value"]

// 6.5 request_type
export const REQUEST_TYPES = [
  { value: "equity", label: "Equity" },
  { value: "debt", label: "Debt" },
  { value: "preferred", label: "Preferred" },
  { value: "mezzanine", label: "Mezzanine" },
  { value: "JV", label: "Joint Venture" },
  { value: "LP", label: "LP Interest" },
  { value: "GP", label: "GP Interest" },
  { value: "co-invest", label: "Co-Investment" },
  { value: "hybrid", label: "Hybrid" },
  { value: "other", label: "Other" },
] as const
export type RequestType = (typeof REQUEST_TYPES)[number]["value"]

// 6.3 role_code (primary party)
export const PARTY_ROLES = [
  { value: "sponsor", label: "Sponsor" },
  { value: "issuer", label: "Issuer" },
  { value: "borrower", label: "Borrower" },
  { value: "seller", label: "Seller" },
  { value: "GP", label: "General Partner" },
  { value: "manager", label: "Manager" },
  { value: "broker", label: "Broker" },
  { value: "adviser", label: "Adviser" },
  { value: "lender", label: "Lender" },
  { value: "buyer", label: "Buyer" },
] as const
export type PartyRole = (typeof PARTY_ROLES)[number]["value"]

// 5. Lifecycle state machine
export const LIFECYCLE_STATES = [
  "DRAFT",
  "RECEIVED",
  "INCOMPLETE",
  "PROVISIONALLY_MATCHABLE",
  "MATCH_READY",
  "VERIFICATION_IN_REVIEW",
  "VERIFIED",
  "INTRODUCTION_ELIGIBLE",
  "INTRODUCTION_APPROVED",
  "DILIGENCE",
  "EXECUTION_HANDOFF",
  "CLOSED",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
  "ARCHIVED",
] as const
export type LifecycleState = (typeof LIFECYCLE_STATES)[number]

type LifecycleMeta = {
  label: string
  phase: "draft" | "intake" | "assessing" | "verifying" | "verified" | "introduction" | "diligence" | "execution" | "terminal"
  badge: string
}

export const LIFECYCLE_META: Record<LifecycleState, LifecycleMeta> = {
  DRAFT: { label: "Draft", phase: "draft", badge: "bg-slate-800 text-slate-300 border border-slate-700" },
  RECEIVED: { label: "Received", phase: "intake", badge: "bg-blue-500/15 text-blue-200 border border-blue-500/30" },
  INCOMPLETE: { label: "Incomplete", phase: "draft", badge: "bg-slate-700/40 text-slate-300 border border-slate-600" },
  PROVISIONALLY_MATCHABLE: { label: "Provisionally Matchable", phase: "assessing", badge: "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30" },
  MATCH_READY: { label: "Match-Ready", phase: "assessing", badge: "bg-purple-500/15 text-purple-200 border border-purple-500/30" },
  VERIFICATION_IN_REVIEW: { label: "Verification In Review", phase: "verifying", badge: "bg-amber-500/15 text-amber-200 border border-amber-500/30" },
  VERIFIED: { label: "Verified", phase: "verified", badge: "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30" },
  INTRODUCTION_ELIGIBLE: { label: "Introduction Eligible", phase: "introduction", badge: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" },
  INTRODUCTION_APPROVED: { label: "Introduction Approved", phase: "introduction", badge: "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40" },
  DILIGENCE: { label: "Diligence", phase: "diligence", badge: "bg-amber-500/15 text-amber-200 border border-amber-500/30" },
  EXECUTION_HANDOFF: { label: "Execution Handoff", phase: "execution", badge: "bg-teal-500/20 text-teal-100 border border-teal-500/40" },
  CLOSED: { label: "Closed", phase: "terminal", badge: "bg-slate-800 text-slate-300 border border-slate-700" },
  DECLINED: { label: "Declined", phase: "terminal", badge: "bg-red-500/15 text-red-200 border border-red-500/30" },
  WITHDRAWN: { label: "Withdrawn", phase: "terminal", badge: "bg-slate-800 text-slate-400 border border-slate-700" },
  EXPIRED: { label: "Expired", phase: "terminal", badge: "bg-slate-800 text-slate-400 border border-slate-700" },
  ARCHIVED: { label: "Archived", phase: "terminal", badge: "bg-slate-800 text-slate-400 border border-slate-700" },
}

// ── Canonical deal record (universal envelope) ──────────────────────────────

export interface Deal {
  id: number
  // 6.1 identity & governance
  referenceCode: string
  dealTypePrimary: DealTypePrimary
  sourceChannel: SourceChannel
  dataClassification: DataClassification
  taxonomyVersion: string
  // 6.2 core profile
  name: string
  summary: string
  transactionPurpose: TransactionPurpose
  dealStage: DealStage
  lifecycleState: LifecycleState
  assetClass: string
  geography: string
  // 6.5 capital request
  requestType: RequestType
  capitalNeedTotal: string
  capitalNeedMinimum: string
  currency: string
  useOfProceeds: string
  // 6.7 timeline
  targetCloseDate: string
  // 6.3 lead party
  sponsor: string
  sponsorRole: PartyRole
  // 6.6 economics / returns
  targetIrr: string
  targetMoic: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const label = <T extends readonly { value: string; label: string }[]>(
  list: T,
  value: string,
): string => list.find((item) => item.value === value)?.label ?? value

export const dealTypeLabel = (v: string) => label(DEAL_TYPES, v)
export const dealTypeShort = (v: string) => DEAL_TYPES.find((d) => d.value === v)?.short ?? v
export const sourceChannelLabel = (v: string) => label(SOURCE_CHANNELS, v)
export const dataClassificationLabel = (v: string) => label(DATA_CLASSIFICATIONS, v)
export const transactionPurposeLabel = (v: string) => label(TRANSACTION_PURPOSES, v)
export const dealStageLabel = (v: string) => label(DEAL_STAGES, v)
export const requestTypeLabel = (v: string) => label(REQUEST_TYPES, v)
export const partyRoleLabel = (v: string) => label(PARTY_ROLES, v)
export const lifecycleLabel = (v: LifecycleState) => LIFECYCLE_META[v]?.label ?? v
export const lifecycleBadge = (v: LifecycleState) => LIFECYCLE_META[v]?.badge ?? "bg-slate-800 text-slate-300 border border-slate-700"

export const classificationBadge = (v: DataClassification) => {
  if (v === "highly_restricted") return "bg-red-500/15 text-red-200 border border-red-500/30"
  if (v === "restricted") return "bg-amber-500/15 text-amber-200 border border-amber-500/30"
  return "bg-slate-800 text-slate-300 border border-slate-700"
}

// Human-safe reference code, e.g. CAPIV-DL-2026-000481
export const generateReferenceCode = () => {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 900000) + 100000)
  return `CAPIV-DL-${year}-${seq}`
}

// 5. Completion gates R0-R6 — stage-based requiredness.
export const GATES = [
  { id: "R0", name: "Create", outcome: "Draft can exist" },
  { id: "R1", name: "Submit", outcome: "Enter Received" },
  { id: "R2", name: "Assess", outcome: "Enter Provisional" },
  { id: "R3", name: "Match", outcome: "Enter Match-Ready" },
  { id: "R4", name: "Verify", outcome: "Enter Verified" },
  { id: "R5", name: "Introduce", outcome: "Introduction Eligible" },
] as const

const R0_FIELDS: (keyof Deal)[] = ["referenceCode", "sourceChannel", "dataClassification", "dealTypePrimary", "name"]
const R1_FIELDS: (keyof Deal)[] = [
  "summary", "transactionPurpose", "dealStage", "capitalNeedTotal", "currency",
  "targetCloseDate", "geography", "assetClass", "requestType", "sponsor", "sponsorRole",
]
const R2_FIELDS: (keyof Deal)[] = ["useOfProceeds", "capitalNeedMinimum", "targetIrr"]

const GATE_FIELD_LABELS: Partial<Record<keyof Deal, string>> = {
  referenceCode: "Reference code", sourceChannel: "Source channel", dataClassification: "Data classification",
  dealTypePrimary: "Primary deal type", name: "Display name", summary: "Summary",
  transactionPurpose: "Transaction purpose", dealStage: "Deal stage", capitalNeedTotal: "Capital need",
  currency: "Currency", targetCloseDate: "Target close date", geography: "Geography",
  assetClass: "Asset class", requestType: "Request type", sponsor: "Sponsor", sponsorRole: "Sponsor role",
  useOfProceeds: "Use of proceeds", capitalNeedMinimum: "Minimum tranche", targetIrr: "Target IRR",
}

const filled = (deal: Deal, field: keyof Deal) => String(deal[field] ?? "").trim().length > 0

export type CompletionResult = {
  highestGate: string
  percent: number
  missingByGate: { gate: string; name: string; missing: string[] }[]
}

// Evaluate which R-gate the record satisfies based on populated canonical fields.
export const evaluateCompletion = (deal: Deal): CompletionResult => {
  const groups: { gate: string; name: string; fields: (keyof Deal)[] }[] = [
    { gate: "R0", name: "Create", fields: R0_FIELDS },
    { gate: "R1", name: "Submit", fields: R1_FIELDS },
    { gate: "R2", name: "Assess", fields: R2_FIELDS },
  ]

  const missingByGate = groups.map((g) => ({
    gate: g.gate,
    name: g.name,
    missing: g.fields.filter((f) => !filled(deal, f)).map((f) => GATE_FIELD_LABELS[f] ?? String(f)),
  }))

  let highestGate = "—"
  for (const g of missingByGate) {
    if (g.missing.length === 0) highestGate = g.gate
    else break
  }

  const total = R0_FIELDS.length + R1_FIELDS.length + R2_FIELDS.length
  const complete = [...R0_FIELDS, ...R1_FIELDS, ...R2_FIELDS].filter((f) => filled(deal, f)).length
  const percent = Math.round((complete / total) * 100)

  return { highestGate, percent, missingByGate }
}
