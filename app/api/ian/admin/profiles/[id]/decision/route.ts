import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient, getLatestEvent, insertStatusEvent } from "@/lib/ian/status"

type Decision = "admit" | "waitlist" | "decline" | "request_clarification" | "withdraw_on_behalf"

const PARTICIPATION_TARGET: Record<Decision, string | null> = {
  admit: "admitted",
  waitlist: "waitlisted",
  decline: "declined",
  withdraw_on_behalf: "withdrawn",
  request_clarification: null, // participation status untouched; only review status changes
}

const REVIEW_TARGET: Record<Decision, string> = {
  admit: "reviewed",
  waitlist: "reviewed",
  decline: "reviewed",
  withdraw_on_behalf: "reviewed",
  request_clarification: "clarification_requested",
}

// Body: { decision: Decision, rationale: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const body = await req.json()
  const decision = body.decision as Decision
  const rationale = body.rationale as string | undefined

  if (!REVIEW_TARGET[decision]) {
    return NextResponse.json({ error: "Unknown decision" }, { status: 400 })
  }
  if (!rationale || typeof rationale !== "string" || rationale.trim().length === 0) {
    return NextResponse.json({ error: "A rationale is required for every decision." }, { status: 422 })
  }

  const admin = getIanAdminClient()

  const { data: profile, error: profileError } = await admin.from("ian_profiles").select("id").eq("id", id).single()
  if (profileError || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const currentReview = await getLatestEvent(admin, id, "profile_review")
  const reviewEvent = await insertStatusEvent(admin, {
    profileId: id,
    statusField: "profile_review",
    fromStatus: currentReview?.to_status ?? null,
    toStatus: REVIEW_TARGET[decision],
    actorId: auth.userId,
    rationale,
  })

  let participationEvent = null
  const participationTarget = PARTICIPATION_TARGET[decision]
  if (participationTarget) {
    const currentParticipation = await getLatestEvent(admin, id, "participation")
    participationEvent = await insertStatusEvent(admin, {
      profileId: id,
      statusField: "participation",
      fromStatus: currentParticipation?.to_status ?? null,
      toStatus: participationTarget,
      actorId: auth.userId,
      rationale,
    })
  }

  // Task bookkeeping: clarification reopens-as-waiting; every other decision closes the task.
  const { data: openTask } = await admin
    .from("ian_review_tasks")
    .select("id")
    .eq("profile_id", id)
    .in("status", ["open", "waiting_on_participant"])
    .maybeSingle()

  if (openTask) {
    if (decision === "request_clarification") {
      await admin.from("ian_review_tasks").update({ status: "waiting_on_participant" }).eq("id", openTask.id)
    } else {
      await admin
        .from("ian_review_tasks")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", openTask.id)
    }
  }

  return NextResponse.json({ success: true, reviewEvent, participationEvent })
}
