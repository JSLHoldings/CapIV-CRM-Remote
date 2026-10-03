import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient, insertStatusEvent, getLatestEvent } from "@/lib/ian/status"

// Snapshots the current profile as a new version and idempotently opens
// exactly one review task. Resubmitting while a task is already open just
// adds a new version snapshot — it never creates a duplicate task.
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()

  const { data: profile, error: profileError } = await admin
    .from("ian_profiles")
    .select("*")
    .eq("account_id", user.id)
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: "No profile draft found. Save your profile first." }, { status: 404 })

  if (!profile.name_display || profile.participation_roles?.length === 0) {
    return NextResponse.json(
      { error: "Your profile is missing required fields (name and at least one participation role)." },
      { status: 422 },
    )
  }

  const { count } = await admin
    .from("ian_profile_versions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id)

  const nextVersion = (count ?? 0) + 1

  const { error: versionError } = await admin.from("ian_profile_versions").insert({
    profile_id: profile.id,
    version_number: nextVersion,
    snapshot: profile,
  })
  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 500 })

  const currentReview = await getLatestEvent(admin, profile.id, "profile_review")
  await insertStatusEvent(admin, {
    profileId: profile.id,
    statusField: "profile_review",
    fromStatus: currentReview?.to_status ?? null,
    toStatus: "submitted",
    actorId: user.id,
    rationale: `Participant submitted profile version ${nextVersion}`,
  })

  const currentParticipation = await getLatestEvent(admin, profile.id, "participation")
  if (!currentParticipation) {
    await insertStatusEvent(admin, {
      profileId: profile.id,
      statusField: "participation",
      fromStatus: null,
      toStatus: "pending",
      actorId: user.id,
      rationale: "Initial submission",
    })
  }

  // Idempotent: only insert a task row if no open/waiting task exists yet.
  const { data: existingTask } = await admin
    .from("ian_review_tasks")
    .select("id")
    .eq("profile_id", profile.id)
    .in("status", ["open", "waiting_on_participant"])
    .maybeSingle()

  if (!existingTask) {
    const { error: taskError } = await admin.from("ian_review_tasks").insert({ profile_id: profile.id })
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })
  } else {
    // Resubmission after a clarification request reopens review automatically.
    await admin.from("ian_review_tasks").update({ status: "open" }).eq("id", existingTask.id)
  }

  return NextResponse.json({ success: true, versionNumber: nextVersion })
}
