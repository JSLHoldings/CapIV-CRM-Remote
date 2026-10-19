import { createClient } from "@/lib/supabase/client"

export type ActivityCategory =
  | "auth"
  | "profile"
  | "documents"
  | "deals"
  | "compliance"
  | "verification"
  | "navigation"
  | "admin"
  | "security"
  | "general"

export interface ActivityPayload {
  action: string
  category?: ActivityCategory
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget activity logger. Call this anywhere in client components.
 * Silently fails so it never blocks the user's action.
 */
export async function logActivity(payload: ActivityPayload): Promise<void> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Pull name from user_metadata so it shows nicely in the admin panel.
    const userName =
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Unknown"

    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: userName,
      action: payload.action,
      category: payload.category ?? "general",
      metadata: payload.metadata ?? null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    })
  } catch {
    // Silently swallow — activity logging must never block the UI.
  }
}
