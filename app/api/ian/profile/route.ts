import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"
import { assertReleaseGate } from "@/lib/ian/capabilities"

// GET: read the caller's own draft profile (creates an empty one if absent).
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("ian_profiles")
    .select("*")
    .eq("account_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: profile ?? null })
}

// POST: upsert the caller's draft profile. Always allowed while draft —
// becomes read-only again only via /submit, and re-opens only on an admin
// "request clarification" decision.
export async function POST(req: NextRequest) {
  try {
    assertReleaseGate("create_update_own_profile")
  } catch {
    return NextResponse.json({ error: "This capability is not available in the current beta." }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const allowedFields = [
    "name_display",
    "organization",
    "title",
    "country",
    "state",
    "participation_roles",
    "interests",
    "intent",
    "acts_personally",
    "org_website",
    "source",
    "referral_context",
    "terms_version",
    "privacy_version",
    "publication_opt_in",
    "photo_pathname",
  ] as const

  const patch: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) patch[field] = body[field]
  }

  const admin = getIanAdminClient()

  // Find existing profile, respecting ownership.
  const { data: existing } = await admin
    .from("ian_profiles")
    .select("id, profile_review_status")
    .eq("account_id", user.id)
    .maybeSingle()

  if (existing) {
    if (existing.profile_review_status === "submitted") {
      return NextResponse.json(
        { error: "Profile is under review and cannot be edited until a reviewer requests changes." },
        { status: 409 },
      )
    }
    const { data, error } = await admin
      .from("ian_profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  }

  const { data, error } = await admin
    .from("ian_profiles")
    .insert({ account_id: user.id, ...patch })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
