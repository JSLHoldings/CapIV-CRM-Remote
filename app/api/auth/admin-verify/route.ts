import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { timingSafeEqual } from "crypto"

// Defaults to the requested key; set ADMIN_SIGNIN_KEY in project Vars to override.
const ADMIN_SIGNIN_KEY = process.env.ADMIN_SIGNIN_KEY || "poop"

function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const key = typeof body.key === "string" ? body.key : ""

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.user_metadata?.role !== "admin" || !keysMatch(key, ADMIN_SIGNIN_KEY)) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
