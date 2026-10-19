import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient, insertStatusEvent } from "@/lib/ian/status"
import { assertReleaseGate } from "@/lib/ian/capabilities"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ items: [] })

  const { data, error } = await admin
    .from("ian_future_interest")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// Body: { action: "create", areaOfInterest, note } | { action: "withdraw" | "reactivate", id }
export async function POST(req: NextRequest) {
  try {
    assertReleaseGate("express_future_interest")
  } catch {
    return NextResponse.json({ error: "This capability is not available in the current beta." }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "Create your profile before expressing interest." }, { status: 404 })

  const body = await req.json()

  if (body.action === "create") {
    if (!body.areaOfInterest || typeof body.areaOfInterest !== "string") {
      return NextResponse.json({ error: "areaOfInterest is required" }, { status: 400 })
    }
    const { data, error } = await admin
      .from("ian_future_interest")
      .insert({ profile_id: profile.id, area_of_interest: body.areaOfInterest, note: body.note ?? null })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await insertStatusEvent(admin, {
      profileId: profile.id,
      statusField: "future_interest",
      fromStatus: null,
      toStatus: "active",
      actorId: user.id,
      rationale: `Expressed future interest: ${body.areaOfInterest}`,
    })

    return NextResponse.json({ item: data })
  }

  if (body.action === "withdraw" || body.action === "reactivate") {
    const nextStatus = body.action === "withdraw" ? "withdrawn" : "active"
    const { data: item, error: fetchError } = await admin
      .from("ian_future_interest")
      .select("*")
      .eq("id", body.id)
      .eq("profile_id", profile.id)
      .single()
    if (fetchError || !item) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: updated, error } = await admin
      .from("ian_future_interest")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ item: updated })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
