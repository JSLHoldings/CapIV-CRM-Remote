import { createClient } from "@/lib/supabase/client"

/**
 * Fetch helper for /api/ian/admin/* routes — attaches the current user's
 * Supabase access token as a Bearer header, matching the pattern used by
 * components/admin-activity-log.tsx for the rest of the admin surface.
 */
export async function ianAdminFetch(path: string, init: RequestInit = {}) {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  return fetch(path, { ...init, headers })
}
