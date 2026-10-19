import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Service-role client — bypasses RLS. Used only by /api/ian/* server routes,
// never exposed to the browser.
export function getIanAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export type StatusField =
  | "account"
  | "profile_review"
  | "participation"
  | "capability_grant"
  | "future_interest"
  | "todo_item"

export interface StatusEvent {
  id: string
  profile_id: string
  status_field: StatusField
  capability_key: string | null
  from_status: string | null
  to_status: string
  actor_id: string | null
  rationale: string | null
  evidence_ref_ids: string[]
  reverses_event_id: string | null
  created_at: string
}

/**
 * Appends a new status event. This is the ONLY way any IAN status field
 * should change — never UPDATE ian_profiles.*_status or any other status
 * column directly. Every call here is itself reversible via reverseEvent().
 */
export async function insertStatusEvent(
  supabase: SupabaseClient,
  params: {
    profileId: string
    statusField: StatusField
    toStatus: string
    capabilityKey?: string | null
    fromStatus?: string | null
    actorId?: string | null
    rationale?: string | null
    evidenceRefIds?: string[]
    reversesEventId?: string | null
  },
): Promise<StatusEvent> {
  const { data, error } = await supabase
    .from("ian_status_events")
    .insert({
      profile_id: params.profileId,
      status_field: params.statusField,
      capability_key: params.capabilityKey ?? null,
      from_status: params.fromStatus ?? null,
      to_status: params.toStatus,
      actor_id: params.actorId ?? null,
      rationale: params.rationale ?? null,
      evidence_ref_ids: params.evidenceRefIds ?? [],
      reverses_event_id: params.reversesEventId ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to record status event: ${error.message}`)

  if (["account", "profile_review", "participation"].includes(params.statusField)) {
    await recomputeProfileCache(supabase, params.profileId)
  }

  return data as StatusEvent
}

/**
 * Returns the latest event for a given (profile, field[, capability]) —
 * i.e. the current state of that field. Null if no event has ever fired.
 */
export async function getLatestEvent(
  supabase: SupabaseClient,
  profileId: string,
  statusField: StatusField,
  capabilityKey?: string | null,
): Promise<StatusEvent | null> {
  let query = supabase
    .from("ian_status_events")
    .select("*")
    .eq("profile_id", profileId)
    .eq("status_field", statusField)
    .order("created_at", { ascending: false })
    .limit(1)

  query = capabilityKey ? query.eq("capability_key", capabilityKey) : query.is("capability_key", null)

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(`Failed to read status: ${error.message}`)
  return (data as StatusEvent) ?? null
}

/** Convenience used by the capability gate: latest grant status for a capability. */
export async function getLatestGrantStatusFor(
  supabase: SupabaseClient,
  profileId: string,
  capabilityKey: string,
): Promise<string | null> {
  const event = await getLatestEvent(supabase, profileId, "capability_grant", capabilityKey)
  return event?.to_status ?? null
}

/**
 * Recomputes the denormalized read-cache columns on ian_profiles from the
 * latest ledger events. Safe to call anytime; never the other way around.
 */
export async function recomputeProfileCache(supabase: SupabaseClient, profileId: string) {
  const [account, profileReview, participation] = await Promise.all([
    getLatestEvent(supabase, profileId, "account"),
    getLatestEvent(supabase, profileId, "profile_review"),
    getLatestEvent(supabase, profileId, "participation"),
  ])

  const patch: Record<string, string> = {}
  if (account) patch.account_status = account.to_status
  if (profileReview) patch.profile_review_status = profileReview.to_status
  if (participation) patch.participation_status = participation.to_status

  if (Object.keys(patch).length === 0) return
  patch.updated_at = new Date().toISOString()

  const { error } = await supabase.from("ian_profiles").update(patch).eq("id", profileId)
  if (error) throw new Error(`Failed to recompute profile cache: ${error.message}`)
}

/**
 * Generic reversal: finds the event being undone, computes the state that
 * existed immediately before it fired for that same (field, capability) key,
 * and appends a brand-new event that restores it. Nothing is deleted or
 * edited — the full timeline, including the reversal itself, stays visible.
 *
 * If the target event was itself a reversal of an earlier event, the prior
 * state is just `from_status` on the target event (what it overwrote).
 */
export async function reverseEvent(
  supabase: SupabaseClient,
  eventId: string,
  actorId: string | null,
  rationale: string | null,
): Promise<StatusEvent> {
  const { data: target, error } = await supabase
    .from("ian_status_events")
    .select("*")
    .eq("id", eventId)
    .single()

  if (error || !target) throw new Error("Status event not found")

  const priorStatus = (target as StatusEvent).from_status
  if (priorStatus === null) {
    throw new Error("Cannot reverse the initial event for this field — there is no prior state to restore")
  }

  return insertStatusEvent(supabase, {
    profileId: (target as StatusEvent).profile_id,
    statusField: (target as StatusEvent).status_field,
    capabilityKey: (target as StatusEvent).capability_key,
    fromStatus: (target as StatusEvent).to_status,
    toStatus: priorStatus,
    actorId,
    rationale: rationale ?? `Reversal of event ${eventId}`,
    reversesEventId: eventId,
  })
}
