import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"

// Records (or re-records) the participant's electronic signature for the
// IAN Beta NDA or Terms of Service disclosure. Signing again simply
// overwrites the name/image/timestamp — the profile row itself is not a
// ledger, so this is not tracked as a reversible event; the underlying
// documents never change, only who most recently attested to them.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const kind = body.kind as "nda" | "tos"
  const signatureName = typeof body.signatureName === "string" ? body.signatureName.trim() : ""
  const signatureImage = typeof body.signatureImage === "string" ? body.signatureImage : ""

  if (kind !== "nda" && kind !== "tos") {
    return NextResponse.json({ error: "Invalid signature kind." }, { status: 400 })
  }
  if (!signatureName || !signatureImage) {
    return NextResponse.json({ error: "A typed name and drawn signature are both required." }, { status: 422 })
  }

  const admin = getIanAdminClient()
  const { data: existing } = await admin
    .from("ian_profiles")
    .select("id, profile_review_status")
    .eq("account_id", user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: "Save your profile draft before signing." }, { status: 404 })
  }
  if (existing.profile_review_status === "submitted") {
    return NextResponse.json({ error: "Your profile is locked while under review." }, { status: 409 })
  }

  const patch =
    kind === "nda"
      ? {
          nda_signed_at: new Date().toISOString(),
          nda_signature_name: signatureName,
          nda_signature_image: signatureImage,
        }
      : {
          tos_signed_at: new Date().toISOString(),
          tos_signature_name: signatureName,
          tos_signature_image: signatureImage,
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
