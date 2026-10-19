import { get } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"

// GET: stream a private IAN blob back to the browser after verifying the
// caller either owns the profile the file is scoped under (pathname is
// `ian/{profileId}/...`) or is an IAN admin. Blob URLs are never exposed
// to the client directly.
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get("pathname")
  if (!pathname || !pathname.startsWith("ian/")) {
    return NextResponse.json({ error: "Missing or invalid pathname." }, { status: 400 })
  }

  const profileId = pathname.split("/")[1]
  const admin = getIanAdminClient()

  let authorized = false

  if (req.headers.get("authorization")) {
    const result = await requireIanAdmin(req)
    authorized = !isAuthFailure(result)
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await admin.from("ian_profiles").select("account_id").eq("id", profileId).maybeSingle()
      authorized = profile?.account_id === user.id
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: req.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (err) {
    console.error("[v0] IAN file fetch failed:", err)
    return NextResponse.json({ error: "Failed to load file." }, { status: 500 })
  }
}
