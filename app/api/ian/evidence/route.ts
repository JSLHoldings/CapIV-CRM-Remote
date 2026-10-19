import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"

// GET: list the caller's own evidence (including superseded rows, for a
// full audit trail of corrections).
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ evidence: [] })

  const { data, error } = await admin
    .from("ian_evidence")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data ?? [] })
}

// POST: append a new evidence row. Corrections never edit an existing row —
// they insert a new one and point `supersedes` at the old row's id.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { claim, source, note, fileUrl, supersedesEvidenceId } = body

  if (!claim || typeof claim !== "string") {
    return NextResponse.json({ error: "claim is required" }, { status: 400 })
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "No profile found." }, { status: 404 })

  const { data: inserted, error } = await admin
    .from("ian_evidence")
    .insert({
      profile_id: profile.id,
      claim,
      source: source ?? null,
      note: note ?? null,
      file_url: fileUrl ?? null,
      evidence_state: "self_reported",
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (supersedesEvidenceId) {
    await admin.from("ian_evidence").update({ superseded_by: inserted.id }).eq("id", supersedesEvidenceId).eq("profile_id", profile.id)
  }

  return NextResponse.json({ evidence: inserted })
}
