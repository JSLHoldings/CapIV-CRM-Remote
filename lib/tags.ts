// ─────────────────────────────────────────────────────────────────────────────
// Tag system — free-form labeling ONLY.
//
// Tags are a separate system from risk flags (see lib/risk-flags.ts). They carry
// no risk semantics and never feed the decision engine — they are user-defined
// workflow/organization labels with one-click presets.
// ─────────────────────────────────────────────────────────────────────────────

// Workflow presets first (these used to be mis-modeled as flags), then routing.
export const TAG_PRESETS: string[] = [
  "Priority",
  "Hot Lead",
  "Watchlist",
  "Verified",
  "Warm Intro",
  "Off-Market",
  "Repeat Sponsor",
  "Strategic",
  "Time-Sensitive",
  "Follow Up",
  "West Coast",
  "East Coast",
  "Midwest",
  "Sun Belt",
  "Q1 Target",
  "Q2 Target",
]

/** Normalize a free-form tag: trim, collapse whitespace, cap length. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 32)
}

/** Add a tag to a list (case-insensitive dedupe). Returns the same ref if no-op. */
export function addTag(tags: string[], raw: string): string[] {
  const t = normalizeTag(raw)
  if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return tags
  return [...tags, t]
}
