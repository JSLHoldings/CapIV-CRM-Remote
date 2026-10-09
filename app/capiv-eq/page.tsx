"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { CapIVEQWorkspace } from "@/components/capiv-eq"

function CapIVEQContent() {
  const searchParams = useSearchParams()
  const tab = useMemo(() => {
    const value = searchParams?.get("tab")
    return value === "portfolio" ? "portfolio" : "calculator"
  }, [searchParams])

  return <CapIVEQWorkspace defaultTab={tab} />
}

export default function CapIVEQPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Suspense fallback={null}>
          <CapIVEQContent />
        </Suspense>
      </DashboardShell>
    </ProtectedRoute>
  )
}
