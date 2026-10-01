"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Deals } from "@/components/deals"

export default function DealsPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Deals />
      </DashboardShell>
    </ProtectedRoute>
  )
}
