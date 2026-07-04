"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVIQWorkspace } from "@/components/capiv-iq"

function CapIVIQContent() {
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    if (value === "underwriting") return "underwriting"
    if (value === "matchmaking") return "matchmaking"
    return "due-diligence"
  }, [searchParams])

  return <CapIVIQWorkspace defaultTab={tab} />
}

export default function CapIVIQPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Suspense fallback={null}>
          <CapIVIQContent />
        </Suspense>
      </DashboardShell>
    </ProtectedRoute>
  )
}
