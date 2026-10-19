// IAN integration is paused. Nothing here calls a real IAN service, and the
// resolver stays a stub that reports "unavailable" until the beta contract exists.

export type IANProfile = {
  subject: string
  coreProfileId: string
  profileStatus: "draft" | "submitted"
  accountStatus: "active" | "suspended"
  assessmentConsent: boolean
}

export type IANFailureReason =
  | "unavailable"
  | "unauthenticated"
  | "profile_not_found"
  | "subject_mismatch"

export type IANResolveResult =
  | { ok: true; profile: IANProfile }
  | { ok: false; reason: IANFailureReason }

export type IANDenyReason =
  | IANFailureReason
  | "profile_not_submitted"
  | "account_suspended"
  | "consent_missing"

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: IANDenyReason }

// TODO: the real value must come from the IAN owner. Unset until the beta contract exists.
export const PROFILE_MAX_AGE_SECONDS: number | null = null

export type IANResolver = (verifiedSubject: string) => Promise<IANResolveResult>

export const resolveIANProfile: IANResolver = async () => ({
  ok: false,
  reason: "unavailable",
})

// Eligibility is exactly: active account + submitted profile + assessment consent.
// It deliberately does not depend on network admission or paid membership.
export function evaluateEligibility(profile: IANProfile): AccessDecision {
  if (profile.accountStatus !== "active") return { allowed: false, reason: "account_suspended" }
  if (profile.profileStatus !== "submitted") return { allowed: false, reason: "profile_not_submitted" }
  if (profile.assessmentConsent !== true) return { allowed: false, reason: "consent_missing" }
  return { allowed: true }
}

// verifiedSubject must come from a server-verified session. `untrustedInput` is
// whatever the browser sent; it is accepted only so callers can pass it through,
// and is never read (profile ID, email, consent, paid flags are all ignored).
export async function checkAccess(
  verifiedSubject: string | null,
  untrustedInput?: unknown,
  resolver: IANResolver = resolveIANProfile,
): Promise<AccessDecision> {
  void untrustedInput
  if (!verifiedSubject) return { allowed: false, reason: "unauthenticated" }

  let result: IANResolveResult
  try {
    result = await resolver(verifiedSubject)
  } catch {
    return { allowed: false, reason: "unavailable" }
  }

  if (!result.ok) return { allowed: false, reason: result.reason }
  if (result.profile.subject !== verifiedSubject) return { allowed: false, reason: "subject_mismatch" }
  return evaluateEligibility(result.profile)
}

const SUBJECT = "sample-subject"

const eligibleProfile: IANProfile = {
  subject: SUBJECT,
  coreProfileId: "sample-core-1",
  profileStatus: "submitted",
  accountStatus: "active",
  assessmentConsent: true,
}

export type PolicySample = {
  label: string
  note?: string
  resolver: IANResolver
}

const resolveTo = (profile: IANProfile): IANResolver => async () => ({ ok: true, profile })

// Sample inputs for the readiness page. Pending admission and unpaid membership are
// not fields on IANProfile, so those samples use the same eligible profile.
export const POLICY_SAMPLES: PolicySample[] = [
  { label: "Eligible user", resolver: resolveTo(eligibleProfile) },
  { label: "Draft profile", resolver: resolveTo({ ...eligibleProfile, profileStatus: "draft" }) },
  { label: "Suspended account", resolver: resolveTo({ ...eligibleProfile, accountStatus: "suspended" }) },
  { label: "Consent withdrawn", resolver: resolveTo({ ...eligibleProfile, assessmentConsent: false }) },
  { label: "Resolver unavailable", note: "Live stub", resolver: resolveIANProfile },
  { label: "Wrong subject", resolver: resolveTo({ ...eligibleProfile, subject: "someone-else" }) },
  {
    label: "Pending network admission",
    note: "Not an eligibility input",
    resolver: resolveTo(eligibleProfile),
  },
  {
    label: "Unpaid membership",
    note: "Not an eligibility input",
    resolver: resolveTo(eligibleProfile),
  },
]

export async function runPolicySamples() {
  return Promise.all(
    POLICY_SAMPLES.map(async (sample) => ({
      label: sample.label,
      note: sample.note,
      decision: await checkAccess(SUBJECT, undefined, sample.resolver),
    })),
  )
}

export const SAMPLE_SUBJECT = SUBJECT
export const SAMPLE_ELIGIBLE_PROFILE = eligibleProfile
