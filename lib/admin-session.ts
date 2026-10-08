import { createHmac, timingSafeEqual } from "crypto"
import type { NextRequest, NextResponse } from "next/server"

export const ADMIN_SESSION_COOKIE = "jsl_admin_session"
const MAX_AGE_SECONDS = 60 * 60 * 8

function sign(userId: string): string {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  return createHmac("sha256", secret).update(`admin-session:${userId}`).digest("hex")
}

export function setAdminSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(ADMIN_SESSION_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0,
  })
}

// True only when the request carries a cookie issued by the admin sign-in
// flow (secret key verified) for this exact user.
export function hasAdminSession(req: NextRequest, userId: string): boolean {
  const value = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!value) return false
  const [id, sig] = value.split(".")
  if (id !== userId || !sig) return false
  const expected = Buffer.from(sign(userId))
  const provided = Buffer.from(sig)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}
