import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { timingSafeEqual } from "crypto"
import { clearAdminSessionCookie, hasAdminSession, setAdminSessionCookie } from "@/lib/admin-session"

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

  const res = NextResponse.json({ ok: true })
  setAdminSessionCookie(res, user.id)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  clearAdminSessionCookie(res)
  return res
}

// Reports whether this browser holds a valid admin sign-in session for the
// bearer token's user.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ active: false })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
  const active = !!user && user.user_metadata?.role === "admin" && hasAdminSession(req, user.id)
  return NextResponse.json({ active })
}
