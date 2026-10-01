"use client"

import { useAuth } from "@/hooks/use-auth"
import { Deals } from "@/components/deals"
import { Matchmaking } from "@/components/matchmaking"

interface CapIVAccessProps {
  selectedDeal?: string | null
  onDealSelect?: (deal: string | null) => void
}

export function CapIVAccess(_props: CapIVAccessProps) {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] || "User"

  return (
    <div className="flex-1 bg-slate-900 text-white overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {firstName}</h1>
          <p className="text-lg text-slate-300">
            CapIV™ Access — your gateway to verified deal flow and capital matchmaking.
          </p>
        </div>

        <Deals />

        <div className="border-t border-slate-800 pt-10">
          <Matchmaking />
        </div>
      </div>
    </div>
  )
}
