"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CapIVAccess } from "@/components/capiv-access"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"

export default function AccessPage() {
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    return value === "deals" || value === "matchmaking" ? value : "overview"
  }, [searchParams])

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVAccess selectedDeal={selectedDeal} onDealSelect={setSelectedDeal} defaultTab={tab} />
      </DashboardShell>
    </ProtectedRoute>
  )
}
