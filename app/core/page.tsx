"use client"

import { useState } from "react"
import { CapIVCore } from "@/components/capiv-core"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"

export default function CorePage() {
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVCore
          selectedInvestor={selectedInvestor}
          onInvestorSelect={setSelectedInvestor}
          onDealSelect={setSelectedDeal}
        />
      </DashboardShell>
    </ProtectedRoute>
  )
}
