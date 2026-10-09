import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient, getLatestEvent, insertStatusEvent } from "@/lib/ian/status"
import { GRANTABLE_CAPABILITIES, type IanCapability } from "@/lib/ian/capabilities"

// Body: { capability: IanCapability, action: "grant" | "revoke", rationale: string }
// Grants/revokes only ever append a status event — access is evaluated
// live from the latest event, so a revoke takes effect immediately and a
// grant can always be re-issued later without losing the earlier history.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const body = await req.json()
  const capability = body.capability as IanCapability
  const action = body.action as "grant" | "revoke"
  const rationale = body.rationale as string | undefined

  if (!GRANTABLE_CAPABILITIES.includes(capability)) {
    return NextResponse.json({ error: "This capability does not support per-profile grants." }, { status: 400 })
  }
  if (action !== "grant" && action !== "revoke") {
    return NextResponse.json({ error: "action must be grant or revoke" }, { status: 400 })
  }
  if (!rationale || rationale.trim().length === 0) {
    return NextResponse.json({ error: "A rationale is required." }, { status: 422 })
  }

  const admin = getIanAdminClient()
  const current = await getLatestEvent(admin, id, "capability_grant", capability)

  const event = await insertStatusEvent(admin, {
    profileId: id,
    statusField: "capability_grant",
    capabilityKey: capability,
    fromStatus: current?.to_status ?? null,
    toStatus: action === "grant" ? "granted" : "revoked",
    actorId: auth.userId,
    rationale,
  })

  return NextResponse.json({ success: true, event })
}
