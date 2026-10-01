"use client"

import { useState } from "react"
import { CapIVAccess } from "@/components/capiv-access"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"

export default function AccessPage() {
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVAccess selectedDeal={selectedDeal} onDealSelect={setSelectedDeal} />
      </DashboardShell>
    </ProtectedRoute>
  )
}
