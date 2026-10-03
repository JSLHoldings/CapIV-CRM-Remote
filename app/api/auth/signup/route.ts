import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Server-side signup using the Supabase Admin API.
 *
 * We create the user with `email_confirm: true` so no confirmation email is
 * sent. This avoids Supabase's built-in email rate limit
 * (`over_email_send_rate_limit`) entirely and makes the account immediately
 * usable — the client signs in right after to establish a session.
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server is not configured for signups." }, { status: 500 })
  }

  let body: { email?: string; password?: string; name?: string; accountType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const { password, name, accountType } = body

  if (!email || !password || !name || !accountType) {
    return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      account_type: accountType,
      role: "user",
    },
  })

  if (error) {
    // Supabase returns a 422 when the email already exists.
    const alreadyExists =
      error.status === 422 ||
      /already|exists|registered/i.test(error.message)
    if (alreadyExists) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      )
    }
    console.error("[v0] Admin signup failed:", error.message)
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ userId: data.user?.id }, { status: 201 })
}
