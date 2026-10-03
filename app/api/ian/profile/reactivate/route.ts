import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient, getLatestEvent, insertStatusEvent } from "@/lib/ian/status"

// Self-service reversal: a participant can undo their OWN withdrawal
// without reviewer involvement. Every other reversal is reviewer/admin-only.
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()

  const { data: profile, error: profileError } = await admin
    .from("ian_profiles")
    .select("id, participation_status")
    .eq("account_id", user.id)
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: "No profile found." }, { status: 404 })

  const current = await getLatestEvent(admin, profile.id, "participation")
  if (!current || current.to_status !== "withdrawn") {
    return NextResponse.json({ error: "Only a withdrawn profile can be reactivated." }, { status: 409 })
  }

  const event = await insertStatusEvent(admin, {
    profileId: profile.id,
    statusField: "participation",
    fromStatus: current.to_status,
    toStatus: "pending",
    actorId: user.id,
    rationale: "Participant self-reactivated after withdrawal",
    reversesEventId: current.id,
  })

  return NextResponse.json({ success: true, event })
}
