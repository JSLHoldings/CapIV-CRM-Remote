// ─────────────────────────────────────────────────────────────────────────────
// Shared flagging & tagging system for Deal Source and Matchmaking.
//
//  • Flags  — a curated, fixed vocabulary with severity colors. Some flags can be
//             auto-suggested from existing JSL Tech v1.1 signals (candidate state,
//             reason codes, tri-vector bands, OS pipeline outcome). Users toggle
//             any flag on or off manually.
//  • Tags   — free-form user labels, with one-click preset suggestions.
// ─────────────────────────────────────────────────────────────────────────────

export type FlagSeverity = "critical" | "warning" | "info" | "positive"

export interface FlagDef {
  id: string
  label: string
  description: string
  severity: FlagSeverity
  /** Whether the engine may auto-suggest this flag from system signals. */
  auto: boolean
}

// Curated flag catalog. Ids are what we persist in the `flags` jsonb column.
export const FLAG_CATALOG: FlagDef[] = [
  { id: "priority", label: "Priority", severity: "positive", auto: true, description: "High-conviction record to action first." },
  { id: "hot_lead", label: "Hot Lead", severity: "positive", auto: false, description: "Strong live interest — move quickly." },
  { id: "verified", label: "Verified", severity: "positive", auto: false, description: "Key facts independently confirmed." },
  { id: "watchlist", label: "Watchlist", severity: "info", auto: false, description: "Monitoring; no action required yet." },
  { id: "needs_review", label: "Needs Review", severity: "warning", auto: true, description: "Requires a human review pass." },
  { id: "data_gap", label: "Data Gap", severity: "warning", auto: true, description: "Missing or thin supporting evidence." },
  { id: "stale", label: "Stale", severity: "warning", auto: true, description: "Underlying record is out of date." },
  { id: "compliance_review", label: "Compliance Review", severity: "critical", auto: true, description: "Policy or security concern to clear." },
  { id: "blocked", label: "Blocked", severity: "critical", auto: true, description: "Hard-stop — cannot advance as-is." },
]

const FLAG_BY_ID: Record<string, FlagDef> = Object.fromEntries(FLAG_CATALOG.map((f) => [f.id, f]))

export function getFlag(id: string): FlagDef | undefined {
  return FLAG_BY_ID[id]
}

// Tailwind badge classes per severity. Kept here so flag rendering is identical
// everywhere the system is used.
export const FLAG_SEVERITY_CLASS: Record<FlagSeverity, string> = {
  critical: "bg-rose-500/15 text-rose-300 border border-rose-500/40",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-500/40",
  info: "bg-sky-500/15 text-sky-300 border border-sky-500/40",
  positive: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40",
}

export function flagBadgeClass(id: string): string {
  const def = FLAG_BY_ID[id]
  return def ? FLAG_SEVERITY_CLASS[def.severity] : "bg-slate-700/40 text-slate-300 border border-slate-600"
}

// Order flags so the most urgent surface first on a card.
const SEVERITY_RANK: Record<FlagSeverity, number> = { critical: 0, warning: 1, positive: 2, info: 3 }

export function sortFlags(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ra = FLAG_BY_ID[a] ? SEVERITY_RANK[FLAG_BY_ID[a].severity] : 99
    const rb = FLAG_BY_ID[b] ? SEVERITY_RANK[FLAG_BY_ID[b].severity] : 99
    return ra - rb
  })
}

// ── Tag presets ──────────────────────────────────────────────────────────────
export const TAG_PRESETS: string[] = [
  "West Coast", "East Coast", "Midwest", "Sun Belt",
  "Warm Intro", "Off-Market", "Repeat Sponsor", "Strategic",
  "Time-Sensitive", "Follow Up", "Q1 Target", "Q2 Target",
]

/** Normalize a free-form tag: trim, collapse whitespace, cap length. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 32)
}

// ── Auto-suggestion from system signals ──────────────────────────────────────

export interface MatchSignal {
  candidateState?: string
  reasonCodes?: string[]
  reciprocalPass?: boolean
  bands?: { matchFit?: string; informationConfidence?: string; executionReadiness?: string }
}

/** Suggest curated flags for a match from its v1.1 evaluation signals. */
export function suggestFlagsForMatch(sig: MatchSignal): string[] {
  const out = new Set<string>()
  const codes = sig.reasonCodes ?? []
  const has = (prefix: string) => codes.some((c) => c.toUpperCase().startsWith(prefix))

  if (sig.candidateState === "BLOCK") out.add("blocked")
  if (sig.candidateState === "REVIEW_REQUIRED") out.add("needs_review")
  if (sig.candidateState === "HOLD") out.add("needs_review")

  // Reason-code families → flags.
  if (has("DATA") || has("EVID")) out.add("data_gap")
  if (codes.some((c) => /STALE/i.test(c))) out.add("stale")
  if (has("POLICY") || has("SEC") || has("AUTH") || has("CONSENT")) out.add("compliance_review")

  // Tri-vector: an INSUFFICIENT information band is a data gap.
  if (sig.bands?.informationConfidence === "INSUFFICIENT") out.add("data_gap")

  // High-conviction: reciprocal pass + all bands HIGH.
  const bands = sig.bands
  if (
    sig.reciprocalPass &&
    bands?.matchFit === "HIGH" &&
    bands?.informationConfidence === "HIGH" &&
    bands?.executionReadiness === "HIGH"
  ) {
    out.add("priority")
  }

  return sortFlags([...out])
}

export interface DealSignal {
  osOutcome?: "clear" | "flagged" | "blocked"
  status?: string
}

/** Suggest curated flags for a deal from its OS pipeline outcome and status. */
export function suggestFlagsForDeal(sig: DealSignal): string[] {
  const out = new Set<string>()
  if (sig.osOutcome === "blocked") {
    out.add("blocked")
    out.add("compliance_review")
  }
  if (sig.osOutcome === "flagged") out.add("needs_review")
  if (sig.status === "Under Review") out.add("needs_review")
  return sortFlags([...out])
}

/** Merge existing flags with newly suggested ones (no duplicates, severity-sorted). */
export function mergeFlags(existing: string[], suggested: string[]): string[] {
  return sortFlags([...new Set([...existing, ...suggested])])
}

export interface DealRecordSignal {
  lifecycleState?: string
  dataClassification?: string
}

/**
 * Suggest curated flags for a canonical deal record (Deal Source) from its
 * lifecycle state machine position and data classification.
 */
export function suggestFlagsForDealRecord(sig: DealRecordSignal): string[] {
  const out = new Set<string>()
  const s = sig.lifecycleState

  if (sig.dataClassification === "highly_restricted") out.add("compliance_review")
  if (s === "INCOMPLETE") out.add("data_gap")
  if (s === "VERIFICATION_IN_REVIEW" || s === "DILIGENCE") out.add("needs_review")
  if (s === "VERIFIED" || s === "INTRODUCTION_APPROVED" || s === "EXECUTION_HANDOFF") out.add("verified")
  if (s === "MATCH_READY" || s === "INTRODUCTION_ELIGIBLE") out.add("priority")
  if (s === "EXPIRED") out.add("stale")

  return sortFlags([...out])
}
