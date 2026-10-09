import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getIanAdminClient } from "@/lib/ian/status"
import { ADMIN_SESSION_COOKIE, isValidAdminCookie } from "@/lib/admin-session"
import { FEATURE_ROUTES, GRANTABLE_CAPABILITIES, type IanCapability } from "@/lib/ian/capabilities"

export type CapabilityMap = Partial<Record<IanCapability, boolean>>

/**
 * Resolves what the signed-in user may use, read from the cookie session.
 * Default deny: a participant gets a capability only when the latest
 * `capability_grant` ledger event for it is "granted". Admins who signed in
 * through the admin sign-in see everything.
 */
export async function getCurrentCapabilities(): Promise<{ authenticated: boolean; isAdmin: boolean; capabilities: CapabilityMap }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authenticated: false, isAdmin: false, capabilities: {} }

  const cookieStore = await cookies()
  const isAdmin =
    user.user_metadata?.role === "admin" &&
    isValidAdminCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, user.id)

  const capabilities: CapabilityMap = {}

  if (isAdmin) {
    for (const cap of GRANTABLE_CAPABILITIES) capabilities[cap] = true
    return { authenticated: true, isAdmin, capabilities }
  }

  const admin = getIanAdminClient()
  const { data: profile } = await admin.from("ian_profiles").select("id").eq("account_id", user.id).maybeSingle()
  if (!profile) return { authenticated: true, isAdmin, capabilities }

  const { data: events } = await admin
    .from("ian_status_events")
    .select("capability_key, to_status")
    .eq("profile_id", profile.id)
    .eq("status_field", "capability_grant")
    .order("created_at", { ascending: false })

  const seen = new Set<string>()
  for (const event of events ?? []) {
    if (!event.capability_key || seen.has(event.capability_key)) continue
    seen.add(event.capability_key)
    capabilities[event.capability_key as IanCapability] = event.to_status === "granted"
  }

  return { authenticated: true, isAdmin, capabilities }
}

export async function hasFeatureAccess(capability: IanCapability): Promise<boolean> {
  const { capabilities } = await getCurrentCapabilities()
  return capabilities[capability] === true
}

/** Server-component guard: unauthenticated -> login, not granted -> profile. */
export async function requireFeature(capability: IanCapability) {
  const { authenticated, capabilities } = await getCurrentCapabilities()
  if (!authenticated) redirect("/login")
  if (capabilities[capability] !== true) {
    const label = FEATURE_ROUTES.find((f) => f.capability === capability)?.label ?? "this feature"
    redirect(`/ian/profile?locked=${encodeURIComponent(label)}`)
  }
}
