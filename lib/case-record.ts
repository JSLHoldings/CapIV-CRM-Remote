// IDENTITY LINKAGE RULE: never link or merge a case to an IAN/Core identity by
// email. coreProfileId may only be set from a verified association, and is never
// populated automatically.

export type CaseRecord = {
  id: string
  ownerRole: "founder" | "consultant" | "client" | "prospect"
  assignedConsultantIds: string[]
  coreProfileId?: string
  isTestRecord: boolean
  summary: string
  internalNotes: string[]
  evidenceDecisions: { evidenceId: string; decision: string }[]
}

export type ClientCaseView = Pick<CaseRecord, "id" | "summary">

export function normalizeCaseRecord(
  input: Omit<CaseRecord, "isTestRecord" | "assignedConsultantIds"> &
    Partial<Pick<CaseRecord, "isTestRecord" | "assignedConsultantIds">>,
): CaseRecord {
  return {
    ...input,
    assignedConsultantIds: input.assignedConsultantIds ?? [],
    isTestRecord: input.isTestRecord ?? input.ownerRole === "founder",
  }
}

// Allow-list projection: internal notes and evidence decisions can never leak into
// client- or prospect-facing responses, summaries, print views, or downloads.
export function toClientView(record: CaseRecord): ClientCaseView {
  return { id: record.id, summary: record.summary }
}
