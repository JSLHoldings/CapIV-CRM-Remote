export type PhaseStatus = "Not started" | "In progress" | "Blocked" | "Done"
export const PHASE_STATUSES: PhaseStatus[] = ["Not started", "In progress", "Blocked", "Done"]

export const PHASES: { id: string; window: string; ends: string; title: string; owner: string; exit: string; status: PhaseStatus }[] = [
  {
    id: "p1",
    window: "Weeks 1-2",
    ends: "Ends Nov 1, 2026",
    title: "Reconcile authorities, choose one case type, define contracts and tests",
    owner: "Founder / CTO",
    exit: "Source register reconciled, one case type selected, contracts and test plan signed off.",
    status: "In progress",
  },
  {
    id: "p2",
    window: "Weeks 3-8",
    ends: "Ends Dec 13, 2026",
    title: "Build the evidence-to-review workflow",
    owner: "Engineering",
    exit: "An approved, versioned evidence dossier moves from Layer 1 to Layer 2 review end to end.",
    status: "Not started",
  },
  {
    id: "p3",
    window: "Weeks 9-12",
    ends: "Ends Jan 10, 2027",
    title: "Security and workflow QA, recovery and rollback",
    owner: "Engineering + QA",
    exit: "Release gate checklist passes, including backup restoration and rollback.",
    status: "Not started",
  },
  {
    id: "p4",
    window: "Weeks 13-18",
    ends: "Ends Feb 21, 2027",
    title: "Affiliated JSL Premier beta",
    owner: "JSL Premier operations",
    exit: "5-10 historical and 10-20 live cases reviewed with metrics reported separately for affiliated use.",
    status: "Not started",
  },
  {
    id: "p5",
    window: "Months 5-9",
    ends: "Planning range",
    title: "One independent operator and one corridor pilot",
    owner: "Programme lead",
    exit: "One independent operator live and one corridor cleared by local counsel.",
    status: "Not started",
  },
  {
    id: "p6",
    window: "Months 9-18+",
    ends: "Planning range",
    title: "More licensees and validated predictive experiments",
    owner: "Founder",
    exit: "Additional licensees onboarded and experiments validated against captured outcomes.",
    status: "Not started",
  },
]

export type DecisionStatus = "Pending" | "In review" | "Complete"
export const DECISION_STATUSES: DecisionStatus[] = ["Pending", "In review", "Complete"]

export interface Decision {
  id: string
  decision: string
  owner: string
  date: string
  scope: string
  status: DecisionStatus
}

export const DECISIONS: Decision[] = [
  { id: "d1", decision: "Adopt CIS Layer 2 placement", owner: "Founder / CTO", date: "2026-10-23", scope: "Architecture", status: "Pending" },
  { id: "d2", decision: "Resolve conflicting source authority", owner: "Founder / CTO", date: "2026-10-26", scope: "Governance", status: "Pending" },
  { id: "d3", decision: "Select first Philippine customer segment", owner: "Founder", date: "2026-10-28", scope: "Market", status: "Pending" },
  { id: "d4", decision: "Agree minimum beta activity", owner: "Programme lead", date: "2026-10-30", scope: "Pilot", status: "Pending" },
  { id: "d5", decision: "Assign engineering review capacity", owner: "CTO", date: "2026-10-30", scope: "Engineering", status: "Pending" },
  { id: "d6", decision: "Approve outcome capture and data-use boundaries", owner: "Founder / Counsel", date: "2026-11-01", scope: "Data", status: "Pending" },
]

export type SourceStatus = "Adopted" | "Under review" | "Superseded" | "Conflict"

export interface Source {
  id: string
  version: string
  owner: string
  adoptionDate: string
  supersededFiles: string
  recipients: string
  status: SourceStatus
}

export const SOURCES: Source[] = [
  {
    id: "SRC-001 Founder CIS",
    version: "v2.0",
    owner: "Founder",
    adoptionDate: "2026-10-12",
    supersededFiles: "Legacy authority set",
    recipients: "Founder, CTO",
    status: "Conflict",
  },
  {
    id: "SRC-002 CEO/CTO audit",
    version: "Audit rev. 1",
    owner: "CEO / CTO",
    adoptionDate: "2026-10-14",
    supersededFiles: "None recorded",
    recipients: "Founder, CTO, Engineering",
    status: "Conflict",
  },
  {
    id: "SRC-003 SignalGate Layer 1",
    version: "Draft 0.3",
    owner: "CTO",
    adoptionDate: "Pending",
    supersededFiles: "None recorded",
    recipients: "Engineering",
    status: "Under review",
  },
  {
    id: "SRC-004 IAN decision record",
    version: "v1.0",
    owner: "Founder",
    adoptionDate: "2026-10-05",
    supersededFiles: "None recorded",
    recipients: "Founder, CTO, Programme lead",
    status: "Adopted",
  },
]

export type InterviewGroup = "Opportunity-side" | "Provider or adviser" | "Potential enterprise operator"
export const INTERVIEW_GROUPS: { name: InterviewGroup; target: string; max: number }[] = [
  { name: "Opportunity-side", target: "10-15", max: 15 },
  { name: "Provider or adviser", target: "5-8", max: 8 },
  { name: "Potential enterprise operator", target: "2-3", max: 3 },
]

export type WillingnessToPay = "Unknown" | "No" | "Maybe" | "Yes"
export const WTP_OPTIONS: WillingnessToPay[] = ["Unknown", "No", "Maybe", "Yes"]

export interface Interview {
  id: string
  name: string
  organization: string
  group: InterviewGroup
  date: string
  findings: string
  wtp: WillingnessToPay
}

export const INTERVIEWS: Interview[] = [
  {
    id: "i1",
    name: "Sample contact A",
    organization: "Sample manufacturing company, Cebu",
    group: "Opportunity-side",
    date: "2026-10-20",
    findings: "Sample: capital requirements differ by counterparty and are rarely written down.",
    wtp: "Maybe",
  },
  {
    id: "i2",
    name: "Sample contact B",
    organization: "Sample advisory firm, Makati",
    group: "Provider or adviser",
    date: "2026-10-21",
    findings: "Sample: spends significant time rebuilding context between handoffs.",
    wtp: "Unknown",
  },
  {
    id: "i3",
    name: "Sample contact C",
    organization: "Sample real-estate developer, Manila",
    group: "Opportunity-side",
    date: "2026-10-22",
    findings: "Sample: evidence packages are assembled differently for every funder.",
    wtp: "Yes",
  },
]

export type HypothesisStatus = "Untested" | "Supported" | "Not supported"
export const HYPOTHESIS_STATUSES: HypothesisStatus[] = ["Untested", "Supported", "Not supported"]

export const HYPOTHESES: { id: string; text: string }[] = [
  { id: "h1", text: "Information is fragmented" },
  { id: "h2", text: "Counterparty requirements are unclear" },
  { id: "h3", text: "Cross-border handoffs lose context" },
  { id: "h4", text: "Organizations will pay for the workflow" },
]

export const COMPLIANCE_ROWS = [
  {
    id: "c1",
    country: "Philippines",
    activity: "Evidence preparation and capital-resource alignment",
    owner: "Local counsel / Founder",
    effectiveDate: "Not set",
    advice: "None on file",
    trigger: "Before beta start; on any rule change",
    status: "Pending local counsel review",
  },
  {
    id: "c2",
    country: "Philippines to United States",
    activity: "Cross-border introductions (corridor)",
    owner: "Local counsel / US counsel",
    effectiveDate: "Not set",
    advice: "None on file",
    trigger: "Before any live introduction",
    status: "Candidate corridor, not cleared",
  },
]

export const RELEASE_GATE_ITEMS = [
  "Consultant-only access test",
  "Cross-client and cross-tenant isolation test",
  "Stale or changed evidence test",
  "Revoked permissions test",
  "Conflicting evidence test",
  "Unsupported jurisdiction test",
  "Blocked unauthorized release test",
  "Save/load and output generation",
  "Audit history",
  "Backup restoration and rollback",
  "Named incident owner",
  "Named support owner",
]

export const PILOT_METRICS = [
  { id: "m1", title: "Review effort", detail: "Reviewer time per case and rework cycles." },
  { id: "m2", title: "Evidence quality", detail: "Completeness and conflict rate across dossiers." },
  { id: "m3", title: "Workflow reliability", detail: "Successful save/load, output generation and rollback runs." },
  { id: "m4", title: "Client progress", detail: "Next steps completed after review." },
  { id: "m5", title: "Commercial transfer", detail: "Willingness to pay and paid usage, with affiliated and external tracked separately." },
]
