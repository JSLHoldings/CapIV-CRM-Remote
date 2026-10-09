// ─────────────────────────────────────────────────────────────────────────────
// Risk Flag system — RISK DETECTION ONLY.
//
// Flags are distinct from tags. A flag is a detected risk/compliance signal that
// feeds the decision-making system (JSL Tech v1.1 matching engine + Deal Source
// lifecycle). Flags are auto-detected from system signals; a reviewer may also
// raise or clear one manually as an override.
//
// Tags (see lib/tags.ts) are a separate, free-form labeling system and must NOT
// be mixed into this module.
// ─────────────────────────────────────────────────────────────────────────────

export type RiskSeverity = "critical" | "warning" | "info"

// Stable ids persisted in the `flags` jsonb column.
export const RISK = {
  BLOCKED: "blocked",
  COMPLIANCE_REVIEW: "compliance_review",
  RECIPROCITY_FAIL: "reciprocity_fail",
  DATA_GAP: "data_gap",
  STALE: "stale",
  READINESS_GAP: "readiness_gap",
  NEEDS_REVIEW: "needs_review",
} as const

export type RiskFlagId = (typeof RISK)[keyof typeof RISK]

export interface RiskFlagDef {
  id: RiskFlagId
  label: string
  description: string
  severity: RiskSeverity
}

// Risk-only catalog. No workflow/positive labels (those live in the tag system).
export const RISK_CATALOG: RiskFlagDef[] = [
  { id: RISK.BLOCKED, label: "Blocked", severity: "critical", description: "Hard-stop — cannot advance as-is." },
  { id: RISK.COMPLIANCE_REVIEW, label: "Compliance Review", severity: "critical", description: "Policy, security, consent, or authority concern to clear." },
  { id: RISK.RECIPROCITY_FAIL, label: "Reciprocity Fail", severity: "critical", description: "One or both directional gates failed to pass." },
  { id: RISK.DATA_GAP, label: "Data Gap", severity: "warning", description: "Missing or thin supporting evidence." },
  { id: RISK.STALE, label: "Stale", severity: "warning", description: "Underlying record or evidence is out of date." },
  { id: RISK.READINESS_GAP, label: "Readiness Gap", severity: "warning", description: "Not prepared for the next governed step." },
  { id: RISK.NEEDS_REVIEW, label: "Needs Review", severity: "warning", description: "Requires a human review pass." },
]

const RISK_BY_ID: Record<string, RiskFlagDef> = Object.fromEntries(RISK_CATALOG.map((f) => [f.id, f]))

export function getRiskFlag(id: string): RiskFlagDef | undefined {
  return RISK_BY_ID[id]
}

export const RISK_SEVERITY_CLASS: Record<RiskSeverity, string> = {
  critical: "bg-rose-500/15 text-rose-300 border border-rose-500/40",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-500/40",
  info: "bg-sky-500/15 text-sky-300 border border-sky-500/40",
}

export function riskBadgeClass(id: string): string {
  const def = RISK_BY_ID[id]
  return def ? RISK_SEVERITY_CLASS[def.severity] : "bg-slate-700/40 text-slate-300 border border-slate-600"
}

const SEVERITY_RANK: Record<RiskSeverity, number> = { critical: 0, warning: 1, info: 2 }

/** Sort risk flags most-severe first. */
export function sortRiskFlags(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ra = RISK_BY_ID[a] ? SEVERITY_RANK[RISK_BY_ID[a].severity] : 99
    const rb = RISK_BY_ID[b] ? SEVERITY_RANK[RISK_BY_ID[b].severity] : 99
    return ra - rb
  })
}

/** Highest severity present, or null when there is no risk. Drives decisioning. */
export function highestRiskSeverity(ids: string[]): RiskSeverity | null {
  let best: RiskSeverity | null = null
  for (const id of ids) {
    const s = RISK_BY_ID[id]?.severity
    if (!s) continue
    if (best === null || SEVERITY_RANK[s] < SEVERITY_RANK[best]) best = s
  }
  return best
}

// ── Detection ────────────────────────────────────────────────────────────────

/** Signals from a v1.1 match evaluation used to detect risk. */
export interface MatchRiskSignal {
  candidateState?: string
  reasonCodes?: string[]
  reciprocalPass?: boolean
  matchFit?: string
  informationConfidence?: string
  executionReadiness?: string
}

/**
 * Detect risk flags for a match from its decision signals. This is the risk
 * layer of the decision-making system — it reads the tri-vector, reciprocity
 * and controlled reason codes and returns the risks that apply.
 */
export function detectMatchRiskFlags(sig: MatchRiskSignal): string[] {
  const out = new Set<string>()
  const codes = (sig.reasonCodes ?? []).map((c) => c.toUpperCase())
  const hasFamily = (prefix: string) => codes.some((c) => c.startsWith(prefix))

  // Candidate state → risk.
  if (sig.candidateState === "BLOCK") out.add(RISK.BLOCKED)
  if (sig.candidateState === "REVIEW_REQUIRED" || sig.candidateState === "HOLD") out.add(RISK.NEEDS_REVIEW)

  // Reciprocity invariant failure is a critical risk.
  if (sig.reciprocalPass === false) out.add(RISK.RECIPROCITY_FAIL)

  // Reason-code families → risk.
  if (hasFamily("DATA") || hasFamily("EVID")) out.add(RISK.DATA_GAP)
  if (codes.some((c) => /STALE/.test(c))) out.add(RISK.STALE)
  if (hasFamily("POLICY") || hasFamily("SEC") || hasFamily("AUTH") || hasFamily("CONSENT")) out.add(RISK.COMPLIANCE_REVIEW)

  // Tri-vector bands → risk.
  if (sig.informationConfidence === "INSUFFICIENT" || sig.informationConfidence === "LOW") out.add(RISK.DATA_GAP)
  if (sig.executionReadiness === "INSUFFICIENT") out.add(RISK.READINESS_GAP)

  return sortRiskFlags([...out])
}

/** Signals from a Deal Source record used to detect risk. */
export interface DealRiskSignal {
  lifecycleState?: string
  dataClassification?: string
  osOutcome?: "clear" | "flagged" | "blocked"
  status?: string
}

/** Detect risk flags for a canonical deal record. */
export function detectDealRiskFlags(sig: DealRiskSignal): string[] {
  const out = new Set<string>()

  if (sig.osOutcome === "blocked") {
    out.add(RISK.BLOCKED)
    out.add(RISK.COMPLIANCE_REVIEW)
  }
  if (sig.osOutcome === "flagged") out.add(RISK.NEEDS_REVIEW)
  if (sig.dataClassification === "highly_restricted") out.add(RISK.COMPLIANCE_REVIEW)

  const s = sig.lifecycleState
  if (s === "INCOMPLETE") out.add(RISK.DATA_GAP)
  if (s === "VERIFICATION_IN_REVIEW" || s === "DILIGENCE") out.add(RISK.NEEDS_REVIEW)
  if (s === "EXPIRED") out.add(RISK.STALE)
  if (sig.status === "Under Review") out.add(RISK.NEEDS_REVIEW)

  return sortRiskFlags([...out])
}

/** Merge existing risk flags with newly detected ones (dedup, severity-sorted). */
export function mergeRiskFlags(existing: string[], detected: string[]): string[] {
  return sortRiskFlags([...new Set([...existing, ...detected])])
}
