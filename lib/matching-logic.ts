// ─────────────────────────────────────────────────────────────────────────────
// JSL Tech OS — Matching Logic v1.1 (implementation-safe contracts)
//
// This module is the "Implementation Layer" described in the JSL Capital
// Intelligence System Matching Logic v1.1 spec (§3.14). It contains ONLY
// schemas, DTOs, state machines, reason-code families, controlled bands and a
// deterministic reference scorer. It intentionally does NOT contain the
// founder-only factor map, hidden weights, exact thresholds or policy
// precedence — those belong to the Private IP Vault and never ship to the
// browser (R-11 IP isolation).
//
// Key v1.1 concepts implemented here:
//  - Tri-vector output: Match Fit / Information Confidence / Execution Readiness (R-06, §3.9)
//  - Reciprocal evaluation: A→B and B→A independently, with the reciprocity invariant (R-05, §3.7)
//  - Controlled reason-code families (§3.18)
//  - Candidate state model (§3.17) and hold/review states (§3.10)
//  - Equity / Credit track specialization (R-14, §3.8)
//  - Presentation-safe decision packet (R-19, §3.12)
// ─────────────────────────────────────────────────────────────────────────────

import { detectMatchRiskFlags as detectRiskFromSignals } from "./risk-flags"

export const MATCHING_LOGIC_VERSION = "v1.1"
export const PRIVATE_CORE_VERSION = "pc-2026.02" // opaque reference only
export const POLICY_VERSION = "policy-2026.02"

// ── Controlled bands (approved for display; raw scores stay private) ──────────
// §3.9: "Approved bands may be shown. Hidden weights/thresholds stay in the
// private core." We expose bands, never reconstructable contribution vectors.
export type Band = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT"

export const BAND_ORDER: Record<Band, number> = {
  HIGH: 3,
  MODERATE: 2,
  LOW: 1,
  INSUFFICIENT: 0,
}

export const BAND_LABEL: Record<Band, string> = {
  HIGH: "High",
  MODERATE: "Moderate",
  LOW: "Low",
  INSUFFICIENT: "Insufficient",
}

export const BAND_BADGE: Record<Band, string> = {
  HIGH: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  MODERATE: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  LOW: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  INSUFFICIENT: "bg-slate-700/40 text-slate-300 border border-slate-600/40",
}

// ── Tracks (R-14, §3.8): legacy Equifi/Credifi → canonical tracks ─────────────
export type Track = "EQ_EQUITY_TRACK" | "EQ_CREDIT_TRACK"

export const TRACK_LABEL: Record<Track, string> = {
  EQ_EQUITY_TRACK: "Equity Track",
  EQ_CREDIT_TRACK: "Credit Track",
}

// §4.6 legacy identifier migration mapping (import mapping only).
export function normalizeLegacyTrack(value: string | null | undefined): Track {
  const v = (value ?? "").toString().trim().toUpperCase()
  if (v === "CREDIFI" || v === "CREDIT" || v === "EQ_CREDIT_TRACK" || v.includes("DEBT")) {
    return "EQ_CREDIT_TRACK"
  }
  return "EQ_EQUITY_TRACK"
}

// ── Tri-vector (R-06, §3.9) ───────────────────────────────────────────────────
export interface TriVector {
  matchFit: Band // reciprocal mandate & transaction compatibility
  informationConfidence: Band // strength of evidence supporting the facts used
  executionReadiness: Band // preparedness for the next governed step
}

// ── Reciprocal direction results (R-05, §3.7) ─────────────────────────────────
export type Direction = "A_TO_B" | "B_TO_A"

export const DIRECTION_LABEL: Record<Direction, string> = {
  A_TO_B: "Opportunity → Capital Provider",
  B_TO_A: "Capital Provider → Opportunity",
}

export interface DirectionResult {
  direction: Direction
  band: Band
  passedGate: boolean
  reasonCodes: string[]
}

// ── Controlled reason-code families (§3.18) ───────────────────────────────────
export type ReasonFamily =
  | "DATA"
  | "EVID"
  | "AUTH"
  | "CONSENT"
  | "FIT"
  | "READY"
  | "POLICY"
  | "SEC"
  | "OUTCOME"

export interface ReasonCode {
  code: string
  family: ReasonFamily
  description: string
}

// The controlled catalog. Codes are stable, presentation-safe identifiers.
export const REASON_CODES: Record<string, ReasonCode> = {
  // DATA — data correction / completeness
  MISSING_REQUIRED: { code: "MISSING_REQUIRED", family: "DATA", description: "A required field is missing." },
  INVALID_TYPE: { code: "INVALID_TYPE", family: "DATA", description: "A field value has an invalid type or format." },
  INCONSISTENT_FIELD: { code: "INCONSISTENT_FIELD", family: "DATA", description: "Field values are internally inconsistent." },
  // EVID — confidence / evidence request
  UNSUPPORTED_ASSERTION: { code: "UNSUPPORTED_ASSERTION", family: "EVID", description: "An assertion lacks supporting evidence." },
  STALE_EVIDENCE: { code: "STALE_EVIDENCE", family: "EVID", description: "Supporting evidence is past its freshness window." },
  CONFLICTING_SOURCE: { code: "CONFLICTING_SOURCE", family: "EVID", description: "Sources conflict and require resolution." },
  AUTHORITY_LOW: { code: "AUTHORITY_LOW", family: "EVID", description: "Source authority is low for the claim relied upon." },
  // AUTH — access ingress / egress
  SUBMIT_AUTH_UNKNOWN: { code: "SUBMIT_AUTH_UNKNOWN", family: "AUTH", description: "Submitter authority could not be established." },
  DISTRIBUTE_AUTH_MISSING: { code: "DISTRIBUTE_AUTH_MISSING", family: "AUTH", description: "Authority to distribute has not been granted." },
  ROLE_SCOPE_FAIL: { code: "ROLE_SCOPE_FAIL", family: "AUTH", description: "Action is outside the actor's role scope." },
  // CONSENT — visibility / use restriction
  PURPOSE_NOT_GRANTED: { code: "PURPOSE_NOT_GRANTED", family: "CONSENT", description: "Consent for this purpose has not been granted." },
  CONSENT_EXPIRED: { code: "CONSENT_EXPIRED", family: "CONSENT", description: "Consent for this use has expired." },
  CONFIDENTIALITY_REQUIRED: { code: "CONFIDENTIALITY_REQUIRED", family: "CONSENT", description: "A confidentiality/NDA step is required first." },
  // FIT — reciprocal compatibility
  STRUCTURE_MISMATCH: { code: "STRUCTURE_MISMATCH", family: "FIT", description: "Instrument/structure is incompatible." },
  SIZE_OUT_OF_RANGE: { code: "SIZE_OUT_OF_RANGE", family: "FIT", description: "Check size / capital need is out of mandate range." },
  GEO_EXCLUSION: { code: "GEO_EXCLUSION", family: "FIT", description: "Geography is excluded by mandate." },
  TERM_MISMATCH: { code: "TERM_MISMATCH", family: "FIT", description: "Term / hold expectations do not align." },
  RISK_MISMATCH: { code: "RISK_MISMATCH", family: "FIT", description: "Risk / strategy profiles do not align." },
  // READY — execution readiness
  CAPITAL_INACTIVE: { code: "CAPITAL_INACTIVE", family: "READY", description: "Capital / mandate is not currently active." },
  DEAL_INCOMPLETE: { code: "DEAL_INCOMPLETE", family: "READY", description: "The opportunity record is incomplete." },
  TIMELINE_UNCONFIRMED: { code: "TIMELINE_UNCONFIRMED", family: "READY", description: "Timing / close date is unconfirmed." },
  DD_PACKAGE_MISSING: { code: "DD_PACKAGE_MISSING", family: "READY", description: "Required diligence package is missing." },
  // POLICY — validated gate state
  JURISDICTION_REVIEW: { code: "JURISDICTION_REVIEW", family: "POLICY", description: "Jurisdiction requires named human review." },
  PROHIBITED_PATH: { code: "PROHIBITED_PATH", family: "POLICY", description: "An approved policy prohibits this path." },
  MANUAL_APPROVAL_REQUIRED: { code: "MANUAL_APPROVAL_REQUIRED", family: "POLICY", description: "Manual approval is required to proceed." },
  // SEC — security response
  CROSS_TENANT_ATTEMPT: { code: "CROSS_TENANT_ATTEMPT", family: "SEC", description: "A cross-tenant access attempt was detected." },
  MALICIOUS_FILE: { code: "MALICIOUS_FILE", family: "SEC", description: "A submitted file failed security screening." },
  IMPERSONATION_SIGNAL: { code: "IMPERSONATION_SIGNAL", family: "SEC", description: "An impersonation signal was detected." },
  ACCESS_REVOKED: { code: "ACCESS_REVOKED", family: "SEC", description: "Access has been revoked." },
  // OUTCOME — learning / reporting
  DECLINED_BY_PROVIDER: { code: "DECLINED_BY_PROVIDER", family: "OUTCOME", description: "Declined by the capital provider." },
  DECLINED_BY_SPONSOR: { code: "DECLINED_BY_SPONSOR", family: "OUTCOME", description: "Declined by the sponsor." },
  NO_RESPONSE: { code: "NO_RESPONSE", family: "OUTCOME", description: "No response within the window." },
  WITHDRAWN: { code: "WITHDRAWN", family: "OUTCOME", description: "Withdrawn by a party." },
  OUTCOME_EXPIRED: { code: "OUTCOME_EXPIRED", family: "OUTCOME", description: "Closed because the window expired." },
  OUTCOME_CLOSED: { code: "OUTCOME_CLOSED", family: "OUTCOME", description: "Pair closed." },
}

export const REASON_FAMILY_LABEL: Record<ReasonFamily, string> = {
  DATA: "Data",
  EVID: "Evidence",
  AUTH: "Authority",
  CONSENT: "Consent",
  FIT: "Compatibility",
  READY: "Readiness",
  POLICY: "Policy",
  SEC: "Security",
  OUTCOME: "Outcome",
}

export const REASON_FAMILY_BADGE: Record<ReasonFamily, string> = {
  DATA: "bg-slate-700/40 text-slate-200 border border-slate-600/40",
  EVID: "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30",
  AUTH: "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30",
  CONSENT: "bg-purple-500/15 text-purple-200 border border-purple-500/30",
  FIT: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  READY: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  POLICY: "bg-orange-500/15 text-orange-200 border border-orange-500/30",
  SEC: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
  OUTCOME: "bg-slate-600/40 text-slate-200 border border-slate-500/40",
}

export function reasonFamilyOf(code: string): ReasonFamily {
  return REASON_CODES[code]?.family ?? "DATA"
}

export function reasonDescription(code: string): string {
  return REASON_CODES[code]?.description ?? code
}

// ── Candidate / introduction state model (§3.17, §3.10) ───────────────────────
export type CandidateState =
  | "RETRIEVED"
  | "PRELIMINARY"
  | "REVIEW_REQUIRED"
  | "QUALIFIED"
  | "INTRO_REQUESTED"
  | "INTRO_AUTHORIZED"
  | "INTRODUCED"
  | "CLOSED"
  | "HOLD"
  | "BLOCK"
  | "DECLINED"
  | "INACTIVE"
  | "EXPIRED"

export const CANDIDATE_STATE_LABEL: Record<CandidateState, string> = {
  RETRIEVED: "Retrieved",
  PRELIMINARY: "Preliminary",
  REVIEW_REQUIRED: "Review Required",
  QUALIFIED: "Qualified",
  INTRO_REQUESTED: "Introduction Requested",
  INTRO_AUTHORIZED: "Introduction Authorized",
  INTRODUCED: "Introduced",
  CLOSED: "Closed",
  HOLD: "Hold",
  BLOCK: "Blocked",
  DECLINED: "Declined",
  INACTIVE: "Inactive",
  EXPIRED: "Expired",
}

export const CANDIDATE_STATE_BADGE: Record<CandidateState, string> = {
  RETRIEVED: "bg-slate-700/40 text-slate-300 border border-slate-600/40",
  PRELIMINARY: "bg-sky-500/15 text-sky-200 border border-sky-500/30",
  REVIEW_REQUIRED: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  QUALIFIED: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  INTRO_REQUESTED: "bg-violet-500/15 text-violet-200 border border-violet-500/30",
  INTRO_AUTHORIZED: "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30",
  INTRODUCED: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  CLOSED: "bg-slate-600/40 text-slate-200 border border-slate-500/40",
  HOLD: "bg-orange-500/15 text-orange-200 border border-orange-500/30",
  BLOCK: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
  DECLINED: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
  INACTIVE: "bg-slate-700/40 text-slate-400 border border-slate-600/40",
  EXPIRED: "bg-slate-700/40 text-slate-400 border border-slate-600/40",
}

// Allowed transitions per the §3.17 state machine. Used to enforce that a UI
// action cannot jump states arbitrarily (transition enforcement, R-13).
export const CANDIDATE_TRANSITIONS: Record<CandidateState, CandidateState[]> = {
  RETRIEVED: ["PRELIMINARY", "INACTIVE", "BLOCK"],
  PRELIMINARY: ["REVIEW_REQUIRED", "QUALIFIED", "HOLD", "BLOCK", "EXPIRED"],
  REVIEW_REQUIRED: ["QUALIFIED", "DECLINED", "HOLD", "BLOCK"],
  QUALIFIED: ["INTRO_REQUESTED", "EXPIRED", "DECLINED", "HOLD"],
  INTRO_REQUESTED: ["INTRO_AUTHORIZED", "HOLD", "DECLINED"],
  INTRO_AUTHORIZED: ["INTRODUCED", "HOLD"],
  INTRODUCED: ["CLOSED"],
  CLOSED: [],
  HOLD: ["PRELIMINARY", "REVIEW_REQUIRED", "DECLINED"],
  BLOCK: ["REVIEW_REQUIRED"],
  DECLINED: [],
  INACTIVE: ["RETRIEVED"],
  EXPIRED: ["RETRIEVED"],
}

export function canTransition(from: CandidateState, to: CandidateState): boolean {
  return CANDIDATE_TRANSITIONS[from]?.includes(to) ?? false
}

// Terminal / non-actionable states are never surfaced for external action.
export function isExternallySurfaceable(state: CandidateState): boolean {
  return state === "QUALIFIED" || state === "INTRO_REQUESTED" || state === "INTRO_AUTHORIZED"
}

// ── EQ recommendation (R-19 / §3.11) ──────────────────────────────────────────
export type RecommendedAction =
  | "REVIEW"
  | "REQUEST_INFORMATION"
  | "HOLD"
  | "DECLINE"
  | "PREPARE_INTRODUCTION"

export const RECOMMENDED_ACTION_LABEL: Record<RecommendedAction, string> = {
  REVIEW: "Route to named reviewer",
  REQUEST_INFORMATION: "Request additional evidence",
  HOLD: "Hold for remediation",
  DECLINE: "Decline candidate pair",
  PREPARE_INTRODUCTION: "Prepare approved introduction",
}

// ── The presentation-safe evaluation input & result DTOs (§3.15) ──────────────
export interface EvaluationInput {
  opportunityName: string
  track: Track
  // Opportunity (A) facts
  assetClass: string
  geography: string
  capitalNeed: string // e.g. "$45M"
  transactionPurpose: string
  targetIrr?: string
  targetMoic?: string
  holdOrTerm?: string
  // Provider (B) facts
  providerName: string
  providerType: string
  // Evidence / readiness signals
  evidenceCompleteness?: number // 0..1 fraction of required evidence present
  recordFreshDays?: number // age of the most material record in days
  dealStageComplete?: boolean
}

export interface EvaluationResult {
  evaluationId: string
  triVector: TriVector
  directions: [DirectionResult, DirectionResult] // [A_TO_B, B_TO_A]
  reciprocalPass: boolean // both directional gates passed (reciprocity invariant)
  candidateState: CandidateState
  recommendedAction: RecommendedAction
  reasonCodes: string[]
  limitations: string[]
  privateCoreVersion: string
  policyVersion: string
  matchingLogicVersion: string
  scoredAt: string
}

// ── Deterministic reference scorer (implementation-safe) ──────────────────────
// NOTE: This is a transparent placeholder for the private core. It produces
// bands (not raw scores) and controlled reason codes so the UI can be built and
// tested (R-10 deterministic replay). In production the private core would
// replace `evaluateReference` behind the same DTO boundary.

function parseMoney(value: string | undefined): number {
  if (!value) return 0
  const n = parseFloat(value.replace(/[$,\s]/gi, ""))
  if (Number.isNaN(n)) return 0
  if (/b/i.test(value)) return n * 1000
  return n // treat as $M
}

function bandFromScore(score: number): Band {
  if (score >= 80) return "HIGH"
  if (score >= 60) return "MODERATE"
  if (score >= 40) return "LOW"
  return "INSUFFICIENT"
}

const HIGH_DEMAND_ASSETS = ["Industrial", "Multifamily", "Student Housing"]
const PRIORITY_GEO_TOKENS = ["CA", "TX", "FL", "AZ", "GA", "NC", "TN"]

// Direction A→B: can this provider satisfy the opportunity requirements?
function evaluateAtoB(input: EvaluationInput): DirectionResult {
  const reasons: string[] = []
  let score = 55
  const size = parseMoney(input.capitalNeed)

  if (size >= 20 && size <= 150) {
    score += 15
  } else if (size > 0) {
    score += 4
    reasons.push("SIZE_OUT_OF_RANGE")
  } else {
    reasons.push("MISSING_REQUIRED")
  }

  if (HIGH_DEMAND_ASSETS.includes(input.assetClass)) {
    score += 12
  } else if (input.assetClass) {
    score += 6
  } else {
    reasons.push("MISSING_REQUIRED")
  }

  const geoToken = input.geography.split(",").pop()?.trim() ?? ""
  if (PRIORITY_GEO_TOKENS.some((t) => geoToken.includes(t))) {
    score += 10
  } else if (input.geography) {
    score += 4
  } else {
    reasons.push("GEO_EXCLUSION")
  }

  const band = bandFromScore(score)
  const passedGate = band !== "INSUFFICIENT" && !reasons.includes("GEO_EXCLUSION")
  if (!passedGate && reasons.length === 0) reasons.push("STRUCTURE_MISMATCH")
  return { direction: "A_TO_B", band, passedGate, reasonCodes: reasons }
}

// Direction B→A: does this opportunity fit the provider mandate and economics?
function evaluateBtoA(input: EvaluationInput): DirectionResult {
  const reasons: string[] = []
  let score = 55

  const institutional = /family office|institutional|capital partner/i.test(input.providerType)
  if (institutional) {
    score += 14
  } else if (input.providerType) {
    score += 6
  } else {
    reasons.push("MISSING_REQUIRED")
  }

  if (input.track === "EQ_EQUITY_TRACK") {
    if (input.targetIrr || input.targetMoic) score += 12
    else {
      score += 3
      reasons.push("TERM_MISMATCH")
    }
  } else {
    // Credit track relies on term / structure signals
    if (input.holdOrTerm) score += 12
    else {
      score += 3
      reasons.push("TERM_MISMATCH")
    }
  }

  if (input.transactionPurpose) score += 8
  else reasons.push("RISK_MISMATCH")

  const band = bandFromScore(score)
  const passedGate = band !== "INSUFFICIENT"
  return { direction: "B_TO_A", band, passedGate, reasonCodes: reasons }
}

function evaluateInformationConfidence(input: EvaluationInput): { band: Band; reasons: string[] } {
  const reasons: string[] = []
  const completeness = input.evidenceCompleteness ?? 0.6
  const freshDays = input.recordFreshDays ?? 30
  let score = Math.round(completeness * 100)

  if (freshDays > 180) {
    score -= 35
    reasons.push("STALE_EVIDENCE")
  } else if (freshDays > 90) {
    score -= 15
  }
  if (completeness < 0.5) reasons.push("UNSUPPORTED_ASSERTION")

  return { band: bandFromScore(Math.max(0, score)), reasons }
}

function evaluateExecutionReadiness(input: EvaluationInput): { band: Band; reasons: string[] } {
  const reasons: string[] = []
  let score = 50
  if (input.dealStageComplete) score += 30
  else reasons.push("DEAL_INCOMPLETE")
  if (input.holdOrTerm) score += 10
  if ((input.recordFreshDays ?? 30) <= 60) score += 10
  else reasons.push("TIMELINE_UNCONFIRMED")
  return { band: bandFromScore(score), reasons }
}

/**
 * Deterministic reference evaluation. Same pinned input → same result (R-10).
 * Returns tri-vector bands, both reciprocal directions, a candidate state,
 * an EQ recommendation and controlled reason codes.
 */
export function evaluateReference(input: EvaluationInput, evaluationId: string): EvaluationResult {
  const aToB = evaluateAtoB(input)
  const bToA = evaluateBtoA(input)
  const conf = evaluateInformationConfidence(input)
  const ready = evaluateExecutionReadiness(input)

  // Reciprocity invariant (§3.7): both gates must pass. A strong A→B cannot
  // compensate for a failed B→A.
  const reciprocalPass = aToB.passedGate && bToA.passedGate

  // Match Fit is bounded by the WEAKER of the two directions.
  const matchFit: Band =
    BAND_ORDER[aToB.band] <= BAND_ORDER[bToA.band] ? aToB.band : bToA.band

  const triVector: TriVector = {
    matchFit: reciprocalPass ? matchFit : "LOW",
    informationConfidence: conf.band,
    executionReadiness: ready.band,
  }

  const reasonCodes = Array.from(
    new Set([...aToB.reasonCodes, ...bToA.reasonCodes, ...conf.reasons, ...ready.reasons]),
  )

  // Derive candidate state + recommendation deterministically from the vectors.
  let candidateState: CandidateState = "PRELIMINARY"
  let recommendedAction: RecommendedAction = "REVIEW"

  if (!reciprocalPass) {
    candidateState = "REVIEW_REQUIRED"
    recommendedAction = "REVIEW"
  } else if (triVector.informationConfidence === "INSUFFICIENT" || triVector.informationConfidence === "LOW") {
    candidateState = "HOLD"
    recommendedAction = "REQUEST_INFORMATION"
  } else if (triVector.executionReadiness === "INSUFFICIENT") {
    candidateState = "HOLD"
    recommendedAction = "HOLD"
  } else if (
    BAND_ORDER[triVector.matchFit] >= BAND_ORDER.MODERATE &&
    BAND_ORDER[triVector.informationConfidence] >= BAND_ORDER.MODERATE &&
    BAND_ORDER[triVector.executionReadiness] >= BAND_ORDER.MODERATE
  ) {
    candidateState = "QUALIFIED"
    recommendedAction = "PREPARE_INTRODUCTION"
  } else {
    candidateState = "REVIEW_REQUIRED"
    recommendedAction = "REVIEW"
  }

  const limitations: string[] = []
  if ((input.evidenceCompleteness ?? 0.6) < 1) {
    limitations.push("Evaluation ran on partial evidence; confidence band reflects known gaps.")
  }
  limitations.push("Bands are policy-approved outputs; underlying weights and thresholds are held in the private core.")

  return {
    evaluationId,
    triVector,
    directions: [aToB, bToA],
    reciprocalPass,
    candidateState,
    recommendedAction,
    reasonCodes,
    limitations,
    privateCoreVersion: PRIVATE_CORE_VERSION,
    policyVersion: POLICY_VERSION,
    matchingLogicVersion: MATCHING_LOGIC_VERSION,
    scoredAt: new Date().toISOString(),
  }
}

// ── Presentation-safe Decision Packet (R-19, §3.12) ───────────────────────────
export interface DecisionPacket {
  packetId: string
  version: string
  snapshotId: string
  opportunityName: string
  providerName: string
  track: Track
  directionSummary: { direction: Direction; label: string; band: Band; passedGate: boolean }[]
  triVector: TriVector
  reciprocalPass: boolean
  gateResults: { label: string; result: "PASS" | "HOLD" | "REVIEW" | "BLOCK" }[]
  reasonCodes: string[]
  riskFlags: string[] // detected risk-flag ids (risk layer of the decision)
  recommendation: RecommendedAction
  limitations: string[]
  candidateState: CandidateState
  versions: { policy: string; privateCore: string; matchingLogic: string }
  generatedAt: string
}

/**
 * Risk layer of the decision-making system: derive the detected risk flags from
 * a completed evaluation. Kept here so risk detection is part of the engine
 * output, not a UI afterthought.
 */
export function detectMatchRiskFlags(result: EvaluationResult): string[] {
  return detectRiskFromSignals({
    candidateState: result.candidateState,
    reasonCodes: result.reasonCodes,
    reciprocalPass: result.reciprocalPass,
    matchFit: result.triVector.matchFit,
    informationConfidence: result.triVector.informationConfidence,
    executionReadiness: result.triVector.executionReadiness,
  })
}

export function buildDecisionPacket(params: {
  opportunityName: string
  providerName: string
  track: Track
  snapshotId: string
  result: EvaluationResult
}): DecisionPacket {
  const { result } = params
  const gateResults = result.directions.map((d) => ({
    label: DIRECTION_LABEL[d.direction],
    result: (d.passedGate ? "PASS" : "REVIEW") as "PASS" | "HOLD" | "REVIEW" | "BLOCK",
  }))

  return {
    packetId: `PKT-${params.snapshotId}`,
    version: MATCHING_LOGIC_VERSION,
    snapshotId: params.snapshotId,
    opportunityName: params.opportunityName,
    providerName: params.providerName,
    track: params.track,
    directionSummary: result.directions.map((d) => ({
      direction: d.direction,
      label: DIRECTION_LABEL[d.direction],
      band: d.band,
      passedGate: d.passedGate,
    })),
    triVector: result.triVector,
    reciprocalPass: result.reciprocalPass,
    gateResults,
    reasonCodes: result.reasonCodes,
    riskFlags: detectMatchRiskFlags(result),
    recommendation: result.recommendedAction,
    limitations: result.limitations,
    candidateState: result.candidateState,
    versions: {
      policy: result.policyVersion,
      privateCore: result.privateCoreVersion,
      matchingLogic: result.matchingLogicVersion,
    },
    generatedAt: result.scoredAt,
  }
}
