import test from "node:test"
import assert from "node:assert/strict"
import {
  checkAccess,
  resolveIANProfile,
  SAMPLE_ELIGIBLE_PROFILE,
  SAMPLE_SUBJECT,
  type IANProfile,
  type IANResolver,
} from "../lib/ian-access.ts"
import { ACTIONS, authorize, canAccessCase } from "../lib/workspace-authz.ts"
import { normalizeCaseRecord, toClientView } from "../lib/case-record.ts"

const resolveTo =
  (profile: IANProfile): IANResolver =>
  async () => ({ ok: true, profile })

test("resolver unavailable denies access", async () => {
  assert.deepEqual(await resolveIANProfile(SAMPLE_SUBJECT), { ok: false, reason: "unavailable" })
  assert.deepEqual(await checkAccess(SAMPLE_SUBJECT), { allowed: false, reason: "unavailable" })
})

test("draft, suspended and no-consent profiles are denied", async () => {
  const cases: [Partial<IANProfile>, string][] = [
    [{ profileStatus: "draft" }, "profile_not_submitted"],
    [{ accountStatus: "suspended" }, "account_suspended"],
    [{ assessmentConsent: false }, "consent_missing"],
  ]
  for (const [override, reason] of cases) {
    const decision = await checkAccess(
      SAMPLE_SUBJECT,
      undefined,
      resolveTo({ ...SAMPLE_ELIGIBLE_PROFILE, ...override }),
    )
    assert.deepEqual(decision, { allowed: false, reason })
  }
})

test("active, submitted, consented profile is allowed", async () => {
  const decision = await checkAccess(SAMPLE_SUBJECT, undefined, resolveTo(SAMPLE_ELIGIBLE_PROFILE))
  assert.deepEqual(decision, { allowed: true })
})

test("pending admission and unpaid membership do not block eligibility", async () => {
  const withExtras = {
    ...SAMPLE_ELIGIBLE_PROFILE,
    networkAdmission: "pending",
    paidMembership: false,
  } as IANProfile
  assert.deepEqual(await checkAccess(SAMPLE_SUBJECT, undefined, resolveTo(withExtras)), { allowed: true })
})

test("browser-supplied profile ID, email, consent and paid flags are ignored", async () => {
  const forged = {
    coreProfileId: "forged",
    email: "attacker@example.com",
    assessmentConsent: true,
    accountStatus: "active",
    paid: true,
  }
  const denied = await checkAccess(
    SAMPLE_SUBJECT,
    forged,
    resolveTo({ ...SAMPLE_ELIGIBLE_PROFILE, assessmentConsent: false }),
  )
  assert.deepEqual(denied, { allowed: false, reason: "consent_missing" })

  const allowed = await checkAccess(
    SAMPLE_SUBJECT,
    { accountStatus: "suspended", assessmentConsent: false },
    resolveTo(SAMPLE_ELIGIBLE_PROFILE),
  )
  assert.deepEqual(allowed, { allowed: true })

  assert.deepEqual(await checkAccess(null, forged, resolveTo(SAMPLE_ELIGIBLE_PROFILE)), {
    allowed: false,
    reason: "unauthenticated",
  })
})

test("client and prospect requests to consultant routes return 403", () => {
  for (const role of ["client", "prospect"] as const) {
    for (const action of ACTIONS) {
      const result = authorize(role, action, {
        consultantId: "c1",
        assignedConsultantIds: ["c1"],
      })
      assert.equal(result.status, 403, `${role} / ${action}`)
    }
  }
})

test("consultant cannot open an unassigned case", () => {
  assert.equal(canAccessCase("consultant", "c1", { assignedConsultantIds: ["c2"] }).allowed, false)
  assert.equal(canAccessCase("consultant", "c1", { assignedConsultantIds: ["c1"] }).allowed, true)
})

test("internal notes and evidence decisions do not appear in client-facing output", () => {
  const record = normalizeCaseRecord({
    id: "case-1",
    ownerRole: "client",
    summary: "Public summary",
    internalNotes: ["secret-note"],
    evidenceDecisions: [{ evidenceId: "e1", decision: "secret-decision" }],
  })
  const serialized = JSON.stringify(toClientView(record))
  assert.ok(!serialized.includes("secret-note"))
  assert.ok(!serialized.includes("secret-decision"))
  assert.ok(!serialized.includes("internalNotes"))
  assert.ok(!serialized.includes("evidenceDecisions"))
})

test("existing founder records are flagged as test records", () => {
  const founder = normalizeCaseRecord({
    id: "f1",
    ownerRole: "founder",
    summary: "",
    internalNotes: [],
    evidenceDecisions: [],
  })
  assert.equal(founder.isTestRecord, true)
  assert.equal(founder.coreProfileId, undefined)
})
