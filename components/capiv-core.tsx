"use client"

import { useAuth } from "@/hooks/use-auth"
import { CapIVEQWorkspace } from "@/components/capiv-eq"

interface CapIVCoreProps {
  selectedInvestor?: string | null
  onInvestorSelect?: (investor: string | null) => void
  onDealSelect?: (deal: string | null) => void
}

export function CapIVCore(_props: CapIVCoreProps) {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] || "User"

  return (
    <div className="flex-1 bg-slate-900 text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {firstName}</h1>
          <p className="text-lg text-slate-300">
            CapIV™ Core — your private asset hub for modeling, calculators, and live portfolio KPIs.
          </p>
        </div>

        <CapIVEQWorkspace />
      </div>
    </div>
  )
}
