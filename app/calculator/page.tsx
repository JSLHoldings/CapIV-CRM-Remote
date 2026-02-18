"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVEQWorkspace } from "@/components/capiv-eq"

export default function CalculatorPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVEQWorkspace defaultTab="calculator" />
      </DashboardShell>
    </ProtectedRoute>
  )
}
