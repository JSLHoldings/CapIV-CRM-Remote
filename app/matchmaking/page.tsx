"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Matchmaking } from "@/components/matchmaking"
import { DashboardShell } from "@/components/dashboard-shell"

export default function MatchmakingPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <Matchmaking />
      </DashboardShell>
    </ProtectedRoute>
  )
}
