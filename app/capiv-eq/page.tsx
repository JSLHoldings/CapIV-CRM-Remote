"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVEQWorkspace } from "@/components/capiv-eq"

export default function CapIVEQPage() {
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    return value === "portfolio" ? "portfolio" : "calculator"
  }, [searchParams])

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVEQWorkspace defaultTab={tab} />
      </DashboardShell>
    </ProtectedRoute>
  )
}
