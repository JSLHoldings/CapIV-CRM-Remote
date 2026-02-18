"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVIQWorkspace } from "@/components/capiv-iq"

export default function UnderwritingPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVIQWorkspace defaultTab="underwriting" />
      </DashboardShell>
    </ProtectedRoute>
  )
}
