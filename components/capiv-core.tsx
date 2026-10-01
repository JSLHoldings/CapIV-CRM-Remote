"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { PortfolioAnalysis } from "@/components/portfolio-analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CapIVCoreProps {
  selectedInvestor?: string | null
  onInvestorSelect?: (investor: string | null) => void
  onDealSelect?: (deal: string | null) => void
}

function QuickEQCalculator() {
  const [expanded, setExpanded] = useState(false)
  const [initialInvestment, setInitialInvestment] = useState("")
  const [finalValue, setFinalValue] = useState("")
  const [timePeriod, setTimePeriod] = useState("")

  const result = useMemo(() => {
    const capital = Number.parseFloat(initialInvestment) || 0
    const final = Number.parseFloat(finalValue) || 0
    const time = Number.parseFloat(timePeriod) || 0

    if (!capital || !final || !time || time <= 0) return null

    const netProfit = final - capital
    const roi = (netProfit / capital) * 100
    const annualized = (Math.pow(final / capital, 1 / time) - 1) * 100
    const moic = final / capital

    return {
      roi: roi.toFixed(1),
      annualized: annualized.toFixed(1),
      moic: moic.toFixed(2),
    }
  }, [initialInvestment, finalValue, timePeriod])

  return (
    <Card className="bg-slate-900/80 border border-slate-800">
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Calculator className="w-4 h-4 text-emerald-300" />
            CapIV™ EQ — Quick ROI Check
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="quick-eq-capital" className="text-xs text-slate-400">
                Initial Equity
              </Label>
              <Input
                id="quick-eq-capital"
                type="number"
                placeholder="2500000"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                className="mt-1 h-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="quick-eq-final" className="text-xs text-slate-400">
                Exit Value
              </Label>
              <Input
                id="quick-eq-final"
                type="number"
                placeholder="3200000"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                className="mt-1 h-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="quick-eq-years" className="text-xs text-slate-400">
                Years
              </Label>
              <Input
                id="quick-eq-years"
                type="number"
                placeholder="5"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="mt-1 h-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          {result ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3">
                <p className="text-xs text-slate-400">Total ROI</p>
                <p className="text-lg font-semibold text-emerald-200">{result.roi}%</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 py-3">
                <p className="text-xs text-slate-400">Annualized</p>
                <p className="text-lg font-semibold text-purple-200">{result.annualized}%</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 py-3">
                <p className="text-xs text-slate-400">MOIC</p>
                <p className="text-lg font-semibold text-blue-200">{result.moic}x</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Enter values for a fast ROI read. Full modeling lives in CapIV™ EQ.</p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => window.open("/capiv-eq", "_self")}
          >
            Open full CapIV™ EQ workspace
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

export function CapIVCore(_props: CapIVCoreProps) {
  const { user } = useAuth()
  const firstName = user?.name?.split(" ")[0] || "User"

  return (
    <div className="flex-1 bg-slate-900 text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome, {firstName}</h1>
        <p className="text-lg text-slate-300 mb-4">
          CapIV™ Core — your live data hub for holdings, allocations, and portfolio performance.
        </p>
      </div>

      <PortfolioAnalysis selectedMetric={null} onMetricSelect={() => {}} />

      <div className="max-w-7xl mx-auto px-8 pb-10">
        <QuickEQCalculator />
      </div>
    </div>
  )
}
