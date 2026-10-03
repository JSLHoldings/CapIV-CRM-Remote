import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Service-role client — bypasses RLS so admins can read all activity rows.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(req: NextRequest) {
  // Verify the caller is an authenticated admin via their JWT.
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Validate the user token and check admin role.
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  )

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = user.user_metadata?.role as string | undefined
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  // Parse query params
  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get("page") ?? "0", 10)
  const pageSize = parseInt(sp.get("pageSize") ?? "20", 10)
  const category = sp.get("category") ?? "all"
  const userId = sp.get("userId") ?? ""
  const search = sp.get("search") ?? ""

  const supabase = getAdminClient()

  let query = supabase
    .from("user_activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1)

  if (category !== "all") query = query.eq("category", category)
  if (userId) query = query.eq("user_id", userId)
  if (search) {
    query = query.or(
      `action.ilike.%${search}%,user_email.ilike.%${search}%,user_name.ilike.%${search}%`,
    )
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}
