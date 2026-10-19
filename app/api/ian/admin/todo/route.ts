import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient } from "@/lib/ian/status"

export async function GET(req: NextRequest) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const admin = getIanAdminClient()
  const { data, error } = await admin.from("ian_todo_items").select("*").order("sort_order", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// Body: { id, status: "open" | "done" }
// Toggling is reversible — it just flips the status column and logs the
// change to ian_status_events (status_field='todo_item') for history.
export async function PATCH(req: NextRequest) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const body = await req.json()
  const { id, status } = body
  if (!id || (status !== "open" && status !== "done")) {
    return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 })
  }

  const admin = getIanAdminClient()
  const { data: updated, error } = await admin
    .from("ian_todo_items")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from("ian_status_events").insert({
    profile_id: null,
    status_field: "todo_item",
    capability_key: updated.code,
    from_status: status === "done" ? "open" : "done",
    to_status: status,
    actor_id: auth.userId,
    rationale: `Checklist item ${updated.code} marked ${status}`,
  })

  return NextResponse.json({ item: updated })
}
