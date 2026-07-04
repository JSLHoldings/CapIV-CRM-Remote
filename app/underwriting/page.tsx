"use client"

import { Suspense } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVIQWorkspace } from "@/components/capiv-iq"

export default function UnderwritingPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Suspense fallback={null}>
          <CapIVIQWorkspace defaultTab="underwriting" />
        </Suspense>
      </DashboardShell>
    </ProtectedRoute>
  )
}
