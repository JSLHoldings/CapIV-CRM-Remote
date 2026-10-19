// IAN Beta Framework — capability release gate (Section 6).
//
// Two independent controls must both pass before any IAN capability may be
// used:
//   1. The release gate below — a hardcoded, build-time switch for the beta.
//   2. A per-profile grant/revoke recorded in `ian_status_events`
//      (status_field = 'capability_grant'), for capabilities that support
//      individual grants. Checked by `assertCapability`.
//
// This gate is scoped to `/api/ian/*` routes only. It does not touch or
// weaken the existing NDA/KYC verification gate used by deals, matchmaking,
// and underwriting.

export type IanCapability =
  | "create_update_own_profile"
  | "respond_to_clarification"
  | "express_future_interest"
  | "browse_people_or_opportunities"
  | "submit_formal_deals"
  | "diligence_and_underwriting"
  | "automated_matching"
  | "transaction_agreements"

// Beta release gate. Default deny — only capabilities explicitly marked
// `true` are reachable at all, regardless of any per-user grant.
export const IAN_RELEASE_GATE: Record<IanCapability, boolean> = {
  create_update_own_profile: true,
  respond_to_clarification: true,
  express_future_interest: true,
  // Reachable only through an explicit admin grant (default deny per profile).
  browse_people_or_opportunities: true,
  submit_formal_deals: true,
  diligence_and_underwriting: true,
  automated_matching: true,
  transaction_agreements: false,
}

// Which app area each grantable capability unlocks.
export const FEATURE_ROUTES: { capability: IanCapability; label: string; prefixes: string[] }[] = [
  { capability: "browse_people_or_opportunities", label: "JSL Tech Access", prefixes: ["/access"] },
  { capability: "submit_formal_deals", label: "Deal Source", prefixes: ["/deals"] },
  {
    capability: "diligence_and_underwriting",
    label: "JSL Tech IQ",
    prefixes: ["/capiv-iq", "/underwriting", "/due-diligence", "/calculator", "/portfolio-analysis"],
  },
  { capability: "automated_matching", label: "Matchmaking", prefixes: ["/matchmaking"] },
]

// Capabilities that can additionally be granted/revoked per-profile by an
// admin (via ian_status_events). A capability not listed here is governed
// by the release gate alone.
export const GRANTABLE_CAPABILITIES: IanCapability[] = [
  "browse_people_or_opportunities",
  "submit_formal_deals",
  "diligence_and_underwriting",
  "automated_matching",
  "transaction_agreements",
]

export class IanCapabilityDeniedError extends Error {
  constructor(public capability: IanCapability, public reason: "release_gate" | "no_grant") {
    super(`IAN capability denied: ${capability} (${reason})`)
  }
}

/**
 * Enforces the release gate for a capability. Throws IanCapabilityDeniedError
 * if the beta has not enabled this capability at all. Call this first, in
 * every /api/ian/* route, before any other authorization check.
 */
export function assertReleaseGate(capability: IanCapability) {
  if (!IAN_RELEASE_GATE[capability]) {
    throw new IanCapabilityDeniedError(capability, "release_gate")
  }
}

/**
 * Full capability check: release gate, then (for grantable capabilities)
 * the latest per-profile grant/revoke event. `getLatestGrantStatus` is
 * injected to avoid a hard dependency on the service-role client here.
 */
export async function assertCapability(
  capability: IanCapability,
  profileId: string,
  getLatestGrantStatus: (profileId: string, capability: IanCapability) => Promise<string | null>,
) {
  assertReleaseGate(capability)

  if (GRANTABLE_CAPABILITIES.includes(capability)) {
    const status = await getLatestGrantStatus(profileId, capability)
    if (status !== "granted") {
      throw new IanCapabilityDeniedError(capability, "no_grant")
    }
  }
}
