"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CapIVCore } from "@/components/capiv-core"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"

export default function CorePage() {
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    return value === "eq" ? "eq" : "overview"
  }, [searchParams])

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVCore
          selectedInvestor={selectedInvestor}
          onInvestorSelect={setSelectedInvestor}
          onDealSelect={setSelectedDeal}
          defaultTab={tab}
        />
      </DashboardShell>
    </ProtectedRoute>
  )
}
