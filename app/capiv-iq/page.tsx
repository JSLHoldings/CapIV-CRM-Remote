"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVIQWorkspace } from "@/components/capiv-iq"

export default function CapIVIQPage() {
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    if (value === "underwriting") return "underwriting"
    if (value === "matchmaking") return "matchmaking"
    return "due-diligence"
  }, [searchParams])

  return (
    <ProtectedRoute>
      <DashboardShell>
        <CapIVIQWorkspace defaultTab={tab} />
      </DashboardShell>
    </ProtectedRoute>
  )
}
