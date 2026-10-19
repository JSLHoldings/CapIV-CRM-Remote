import { NextRequest, NextResponse } from "next/server"
import { requireIanAdmin, isAuthFailure } from "@/lib/ian/admin-auth"
import { getIanAdminClient } from "@/lib/ian/status"

export async function GET(req: NextRequest) {
  const auth = await requireIanAdmin(req)
  if (isAuthFailure(auth)) return auth

  const admin = getIanAdminClient()
  const sp = req.nextUrl.searchParams
  const statusFilter = sp.get("status") ?? "all"

  let query = admin
    .from("ian_review_tasks")
    .select("*, ian_profiles(*)")
    .order("opened_at", { ascending: true })

  if (statusFilter !== "all") query = query.eq("status", statusFilter)

  const { data: tasks, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: allTasks } = await admin.from("ian_review_tasks").select("status, opened_at, closed_at")

  const counts = {
    open: allTasks?.filter((t) => t.status === "open").length ?? 0,
    waiting_on_participant: allTasks?.filter((t) => t.status === "waiting_on_participant").length ?? 0,
    closed: allTasks?.filter((t) => t.status === "closed").length ?? 0,
  }

  const closedWithDuration = (allTasks ?? []).filter((t) => t.closed_at)
  const avgTimeToReviewHours =
    closedWithDuration.length > 0
      ? closedWithDuration.reduce((sum, t) => {
          const ms = new Date(t.closed_at!).getTime() - new Date(t.opened_at).getTime()
          return sum + ms / 3_600_000
        }, 0) / closedWithDuration.length
      : null

  return NextResponse.json({
    tasks: tasks ?? [],
    metrics: { counts, avgTimeToReviewHours },
  })
}
