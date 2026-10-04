import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"
import { assertReleaseGate } from "@/lib/ian/capabilities"

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<string, string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp"],
  document: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100)
}

// POST: upload a profile photo or supporting document to private Blob
// storage, scoped under the caller's own profile id. Returns a pathname —
// never a public blob URL — which must be served back through
// /api/ian/file after an ownership/admin check.
export async function POST(req: NextRequest) {
  try {
    assertReleaseGate("create_update_own_profile")
  } catch {
    return NextResponse.json({ error: "This capability is not available in the current beta." }, { status: 403 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: "Create your profile before uploading files." }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  const kind = formData.get("kind")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }
  if (kind !== "photo" && kind !== "document") {
    return NextResponse.json({ error: "kind must be 'photo' or 'document'." }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10MB limit." }, { status: 400 })
  }
  if (!ALLOWED_TYPES[kind].includes(file.type)) {
    return NextResponse.json(
      { error: kind === "photo" ? "Photo must be JPEG, PNG, or WEBP." : "Document must be PDF, DOC, DOCX, JPEG, PNG, or WEBP." },
      { status: 400 },
    )
  }

  const pathname = `ian/${profile.id}/${kind}/${Date.now()}-${sanitizeFilename(file.name)}`

  try {
    const blob = await put(pathname, file, { access: "private" })
    return NextResponse.json({ pathname: blob.pathname, contentType: file.type, filename: file.name })
  } catch (err) {
    console.error("[v0] IAN upload failed:", err)
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 })
  }
}
