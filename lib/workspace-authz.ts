export const ROLES = ["founder", "consultant", "client", "prospect"] as const
export type Role = (typeof ROLES)[number]

export const ACTIONS = [
  "open_workspace",
  "read_internal_notes",
  "run_evidence_actions",
  "export_consultant_files",
  "open_assigned_case",
  "open_unassigned_case",
] as const
export type Action = (typeof ACTIONS)[number]

export const ACTION_LABELS: Record<Action, string> = {
  open_workspace: "Open workspace",
  read_internal_notes: "Read internal notes",
  run_evidence_actions: "Run evidence actions",
  export_consultant_files: "Export consultant files",
  open_assigned_case: "Open assigned case",
  open_unassigned_case: "Open unassigned case",
}

export type AuthzContext = {
  consultantId?: string
  assignedConsultantIds?: string[]
}

export type AuthzResult = { allowed: true; status: 200 } | { allowed: false; status: 403 }

const ALLOW: AuthzResult = { allowed: true, status: 200 }
const DENY: AuthzResult = { allowed: false, status: 403 }

// Server-side check. Roles must come from a verified session, never from the browser.
// Founder preview is a separate, labeled exception: it opens everything but never
// creates an IAN account or Core record.
export function authorize(role: Role, action: Action, ctx: AuthzContext = {}): AuthzResult {
  if (role === "founder") return ALLOW
  if (role !== "consultant") return DENY

  if (action === "open_assigned_case" || action === "open_unassigned_case") {
    const assigned =
      !!ctx.consultantId && (ctx.assignedConsultantIds ?? []).includes(ctx.consultantId)
    return assigned ? ALLOW : DENY
  }
  return ALLOW
}

export function canAccessCase(
  role: Role,
  consultantId: string | undefined,
  record: { assignedConsultantIds: string[] },
): AuthzResult {
  return authorize(role, "open_assigned_case", {
    consultantId,
    assignedConsultantIds: record.assignedConsultantIds,
  })
}

// Every cell is produced by calling authorize(); nothing is typed in by hand.
export function buildRoleMatrix() {
  const consultantId = "sample-consultant"
  return ROLES.map((role) => ({
    role,
    cells: ACTIONS.map((action) => {
      const ctx: AuthzContext =
        action === "open_assigned_case"
          ? { consultantId, assignedConsultantIds: [consultantId] }
          : action === "open_unassigned_case"
            ? { consultantId, assignedConsultantIds: ["another-consultant"] }
            : { consultantId }
      return { action, result: authorize(role, action, ctx) }
    }),
  }))
}
