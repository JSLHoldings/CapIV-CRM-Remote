import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mirrors the admin check in app/api/admin/activity/route.ts so the IAN
// admin surface uses the exact same authorization pattern as the rest of
// the app's admin API.
export async function requireIanAdmin(
  req: NextRequest,
): Promise<{ userId: string } | NextResponse> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""))

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = user.user_metadata?.role as string | undefined
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  return { userId: user.id }
}

export function isAuthFailure(result: unknown): result is NextResponse {
  return result instanceof NextResponse
}
