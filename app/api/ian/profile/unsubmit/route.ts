import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient, getLatestEvent, reverseEvent } from "@/lib/ian/status"

// Lets a participant pull their application back out of the review queue so
// they can correct fields before a reviewer has acted on it. Implemented as
// a ledger reversal, exactly like every other status change — fully
// auditable, and the unsubmit itself can be reversed from the admin side.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()

  const { data: profile, error: profileError } = await admin
    .from("ian_profiles")
    .select("id")
    .eq("account_id", user.id)
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: "No profile found." }, { status: 404 })

  const currentReview = await getLatestEvent(admin, profile.id, "profile_review")
  if (!currentReview || currentReview.to_status !== "submitted") {
    return NextResponse.json(
      {
        error:
          "You can only unsubmit while your application is waiting to be reviewed. Once a reviewer has responded, edit your profile and resubmit instead.",
      },
      { status: 409 },
    )
  }

  const reviewEvent = await reverseEvent(
    admin,
    currentReview.id,
    user.id,
    "Participant unsubmitted application to edit before review",
  )

  // Close the open review task — resubmitting will reopen or recreate it.
  const { data: openTask } = await admin
    .from("ian_review_tasks")
    .select("id")
    .eq("profile_id", profile.id)
    .in("status", ["open", "waiting_on_participant"])
    .maybeSingle()

  if (openTask) {
    await admin
      .from("ian_review_tasks")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", openTask.id)
  }

  return NextResponse.json({ success: true, reviewEvent })
}
