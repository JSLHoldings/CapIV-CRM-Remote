import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient } from "@/lib/ian/status"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const { id } = await params
  const admin = getIanAdminClient()

  const [{ data: profile, error: profileError }, { data: versions }, { data: evidence }, { data: events }, { data: iqPackets }, { data: tasks }] =
    await Promise.all([
      admin.from("ian_profiles").select("*").eq("id", id).single(),
      admin.from("ian_profile_versions").select("*").eq("profile_id", id).order("version_number", { ascending: false }),
      admin.from("ian_evidence").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
      admin.from("ian_status_events").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
      admin.from("ian_iq_packets").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
      admin.from("ian_review_tasks").select("*").eq("profile_id", id).order("opened_at", { ascending: false }),
    ])

  if (profileError || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  return NextResponse.json({
    profile,
    versions: versions ?? [],
    evidence: evidence ?? [],
    events: events ?? [],
    iqPackets: iqPackets ?? [],
    tasks: tasks ?? [],
  })
}
