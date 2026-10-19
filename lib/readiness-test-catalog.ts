export const TEST_CATALOG = [
  { name: "resolver unavailable denies access", checks: "The stub resolver yields a denial, never access." },
  { name: "draft, suspended and no-consent profiles are denied", checks: "Each ineligible profile state returns allowed: false with its reason." },
  { name: "active, submitted, consented profile is allowed", checks: "The only eligible state returns allowed: true." },
  { name: "pending admission and unpaid membership do not block eligibility", checks: "Extra membership fields on a profile do not change the decision." },
  { name: "browser-supplied profile ID, email, consent and paid flags are ignored", checks: "Untrusted input cannot grant or revoke access." },
  { name: "client and prospect requests to consultant routes return 403", checks: "authorize() returns status 403 for both roles on every action." },
  { name: "consultant cannot open an unassigned case", checks: "canAccessCase() denies a consultant not in assignedConsultantIds." },
  { name: "internal notes and evidence decisions do not appear in client-facing output", checks: "toClientView() output contains neither field." },
  { name: "existing founder records are flagged as test records", checks: "normalizeCaseRecord() sets isTestRecord for founder-owned records." },
] as const

export type TestName = (typeof TEST_CATALOG)[number]["name"]
