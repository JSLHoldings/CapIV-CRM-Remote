import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient, reverseEvent } from "@/lib/ian/status"

// Generic "Reverse" button for any ian_status_events row. Body: { eventId, rationale }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const body = await req.json()
  const { eventId, rationale } = body

  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 })

  const admin = getIanAdminClient()

  const { data: target } = await admin.from("ian_status_events").select("profile_id").eq("id", eventId).single()
  if (!target || target.profile_id !== id) {
    return NextResponse.json({ error: "Event does not belong to this profile" }, { status: 400 })
  }

  try {
    const event = await reverseEvent(admin, eventId, auth.userId, rationale ?? null)

    // Keep review task bookkeeping consistent when reversing a decision.
    if (event.status_field === "profile_review") {
      const { data: openOrClosedTask } = await admin
        .from("ian_review_tasks")
        .select("id, status")
        .eq("profile_id", id)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (openOrClosedTask?.status === "closed" && event.to_status === "submitted") {
        await admin.from("ian_review_tasks").update({ status: "open", closed_at: null }).eq("id", openOrClosedTask.id)
      }
    }

    return NextResponse.json({ success: true, event })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Reversal failed" }, { status: 400 })
  }
}
