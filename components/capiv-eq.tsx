"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator as CalculatorIcon, BarChart3, DollarSign, TrendingUp, Percent, LineChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PortfolioAnalysis } from "@/components/portfolio-analysis"

type EQTab = "calculator" | "portfolio"

interface CapIVEQWorkspaceProps {
  defaultTab?: EQTab
}

export function CapIVEQWorkspace({ defaultTab = "calculator" }: CapIVEQWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EQTab>(defaultTab)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const [roiInputs, setRoiInputs] = useState({
    initialInvestment: "",
    finalValue: "",
    timePeriod: "",
    annualContribution: "",
    annualCashFlow: "",
  })
  const [irrInputs, setIrrInputs] = useState({
    initialInvestment: "",
    cashFlows: "",
    timeYears: "",
  })
  const [capRateInputs, setCapRateInputs] = useState({
    noi: "",
    purchasePrice: "",
    debtService: "",
    exitCapRate: "",
  })

  const roiResults = useMemo(() => {
    const capital = Number.parseFloat(roiInputs.initialInvestment) || 0
    const time = Number.parseFloat(roiInputs.timePeriod) || 0
    const final = Number.parseFloat(roiInputs.finalValue) || 0
    const contribution = Number.parseFloat(roiInputs.annualContribution) || 0
    const annualCashFlow = Number.parseFloat(roiInputs.annualCashFlow) || 0

    if (!capital || !time || !final || time <= 0) {
      return null
    }

    const totalContributions = contribution * Math.max(time - 1, 0)
    const totalInvested = capital + totalContributions
    const distributed = final + annualCashFlow * time
    const netProfit = distributed - totalInvested
    const totalReturn = totalInvested ? (netProfit / totalInvested) * 100 : 0
    const annualizedReturn = totalInvested ? (Math.pow(distributed / totalInvested, 1 / time) - 1) * 100 : 0
    const moic = totalInvested ? distributed / totalInvested : 0
    const cashOnCash = totalInvested ? (annualCashFlow / totalInvested) * 100 : 0
    const paybackYears = annualCashFlow > 0 ? totalInvested / annualCashFlow : null

    return {
      amount: Number.isFinite(final) ? Math.round(final) : 0,
      roi: Number.isFinite(totalReturn) ? Number.parseFloat(totalReturn.toFixed(1)) : 0,
      annual: Number.isFinite(annualizedReturn) ? Number.parseFloat(annualizedReturn.toFixed(1)) : 0,
      totalInvested,
      distributed,
      netProfit,
      moic,
      cashOnCash,
      paybackYears,
      annualCashFlow,
      time,
    }
  }, [roiInputs])

  const scenarioRows = useMemo(() => {
    if (!roiResults) return []
    const baseExit = Number.parseFloat(roiInputs.finalValue) || 0
    const adjustments = [
      { label: "Downside", delta: -0.1 },
      { label: "Base", delta: 0 },
      { label: "Upside", delta: 0.15 },
    ]
    return adjustments.map((scenario) => {
      const adjustedExit = baseExit * (1 + scenario.delta)
      const distributed =
        adjustedExit + (roiResults.annualCashFlow || 0) * (roiResults.time || 0)
      const roi =
        roiResults.totalInvested && roiResults.totalInvested > 0
          ? (((distributed - roiResults.totalInvested) / roiResults.totalInvested) * 100).toFixed(1)
          : "0.0"
      const moic =
        roiResults.totalInvested && roiResults.totalInvested > 0
          ? (distributed / roiResults.totalInvested).toFixed(2)
          : "0.00"
      return {
        ...scenario,
        exitValue: adjustedExit,
        roi,
        moic,
      }
    })
  }, [roiResults, roiInputs.finalValue])

  const capRateResults = useMemo(() => {
    const noi = Number.parseFloat(capRateInputs.noi) || 0
    const purchasePrice = Number.parseFloat(capRateInputs.purchasePrice) || 0
    const debtService = Number.parseFloat(capRateInputs.debtService) || 0
    const exitCapRate = Number.parseFloat(capRateInputs.exitCapRate) || 0

    if (!noi && !purchasePrice && !debtService && !exitCapRate) return null

    const capRate = purchasePrice ? (noi / purchasePrice) * 100 : null
    const dscr = debtService ? noi / debtService : null
    const impliedValue = exitCapRate ? (noi / (exitCapRate / 100)) : null

    return {
      capRate,
      dscr,
      impliedValue,
      noi,
    }
  }, [capRateInputs])

  return (
    <div className="min-h-full px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-500/20 p-4">
            <CalculatorIcon className="w-7 h-7 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">CapIV™ EQ</p>
            <h1 className="text-3xl font-semibold text-white mt-1">Capital Efficiency Studio</h1>
            <p className="text-slate-300 mt-1">
              Run investment models, surface portfolio KPIs, and unlock reporting from one workspace.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as EQTab)} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-2 rounded-2xl bg-slate-900/80 border border-slate-800">
          <TabsTrigger
            value="calculator"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
          >
            Investment Calculator
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
          >
            Portfolio Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 text-emerald-300" />
                  ROI Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eq-capital" className="text-slate-300">
                    Initial Equity
                  </Label>
                  <Input
                    id="eq-capital"
                    type="number"
                    placeholder="2500000"
                    value={roiInputs.initialInvestment}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, initialInvestment: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="eq-contribution" className="text-slate-300">
                    Annual Contributions
                  </Label>
                  <Input
                    id="eq-contribution"
                    type="number"
                    placeholder="250000"
                    value={roiInputs.annualContribution}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, annualContribution: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="eq-cash-flow" className="text-slate-300">
                    Annual Cash Flow
                  </Label>
                  <Input
                    id="eq-cash-flow"
                    type="number"
                    placeholder="180000"
                    value={roiInputs.annualCashFlow}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, annualCashFlow: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="eq-final" className="text-slate-300">
                    Exit / Terminal Value
                  </Label>
                  <Input
                    id="eq-final"
                    type="number"
                    placeholder="3200000"
                    value={roiInputs.finalValue}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, finalValue: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="eq-time" className="text-slate-300">
                    Time Horizon (Years)
                  </Label>
                  <Input
                    id="eq-time"
                    type="number"
                    placeholder="5"
                    value={roiInputs.timePeriod}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, timePeriod: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roiResults ? (
                  <>
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-600/10 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 uppercase tracking-[0.2em]">Projected Value</span>
                        <span className="text-3xl font-semibold text-blue-200">
                          ${roiResults.amount.toLocaleString("en-US")}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 uppercase tracking-[0.2em]">Total ROI</span>
                        <span className="text-3xl font-semibold text-emerald-200">{roiResults.roi}%</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 uppercase tracking-[0.2em]">Annualized ROI</span>
                        <span className="text-3xl font-semibold text-purple-200">{roiResults.annual}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-10 text-center text-slate-500">
                    <CalculatorIcon className="w-12 h-12 mx-auto mb-4 opacity-60" />
                    <p>Enter values to see modeled outcomes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {roiResults && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <LineChart className="w-5 h-5 text-blue-300" />
                    Detailed Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-slate-300 text-sm">
                  <div>
                    <p className="text-slate-400">Total Invested</p>
                    <p className="text-lg font-semibold text-white">
                      ${roiResults.totalInvested.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cash Distributed</p>
                    <p className="text-lg font-semibold text-white">
                      ${roiResults.distributed.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Net Profit</p>
                    <p className="text-lg font-semibold text-emerald-300">
                      ${roiResults.netProfit.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">MOIC</p>
                    <p className="text-lg font-semibold text-white">{roiResults.moic.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cash-on-Cash</p>
                    <p className="text-lg font-semibold text-white">{roiResults.cashOnCash.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Payback Period</p>
                    <p className="text-lg font-semibold text-white">
                      {roiResults.paybackYears ? `${roiResults.paybackYears.toFixed(1)} yrs` : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Percent className="w-5 h-5 text-purple-300" />
                    Scenario Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  {scenarioRows.length ? (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {scenarioRows.map((scenario) => (
                        <div
                          key={scenario.label}
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2"
                        >
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{scenario.label}</p>
                          <p className="text-lg font-semibold text-white">
                            ${scenario.exitValue.toLocaleString("en-US")}
                          </p>
                          <p className="text-xs text-slate-400">Exit Value</p>
                          <p className="text-sm font-semibold text-emerald-200">{scenario.roi}% ROI</p>
                          <p className="text-xs text-slate-400">{scenario.moic}x MOIC</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center">Enter ROI assumptions to unlock scenario analysis.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">IRR &amp; Cap Rate Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>
                Advanced IRR, cash flow laddering, and cap-rate scenarios are unlocking soon. Use CapIV™ EQ to record
                assumptions so AI-generated underwriting packets stay synced with your models.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Initial Investment"
                  value={irrInputs.initialInvestment}
                  onChange={(e) => setIrrInputs((prev) => ({ ...prev, initialInvestment: e.target.value }))}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
                <Input
                  placeholder="Cash Flows (comma separated)"
                  value={irrInputs.cashFlows}
                  onChange={(e) => setIrrInputs((prev) => ({ ...prev, cashFlows: e.target.value }))}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
                <Input
                  placeholder="Years"
                  value={irrInputs.timeYears}
                  onChange={(e) => setIrrInputs((prev) => ({ ...prev, timeYears: e.target.value }))}
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>
              <p className="text-sm text-slate-500">
                Stay tuned for downloadable underwriting models and data exports inside CapIV™ EQ.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Cap Rate &amp; Debt Coverage Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300" htmlFor="eq-noi">
                    Net Operating Income
                  </Label>
                  <Input
                    id="eq-noi"
                    type="number"
                    placeholder="650000"
                    value={capRateInputs.noi}
                    onChange={(e) => setCapRateInputs((prev) => ({ ...prev, noi: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300" htmlFor="eq-price">
                    Purchase Price / Value
                  </Label>
                  <Input
                    id="eq-price"
                    type="number"
                    placeholder="9500000"
                    value={capRateInputs.purchasePrice}
                    onChange={(e) => setCapRateInputs((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300" htmlFor="eq-debt">
                    Annual Debt Service
                  </Label>
                  <Input
                    id="eq-debt"
                    type="number"
                    placeholder="520000"
                    value={capRateInputs.debtService}
                    onChange={(e) => setCapRateInputs((prev) => ({ ...prev, debtService: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300" htmlFor="eq-exit-cap">
                    Exit Cap Rate (%)
                  </Label>
                  <Input
                    id="eq-exit-cap"
                    type="number"
                    placeholder="5.75"
                    value={capRateInputs.exitCapRate}
                    onChange={(e) => setCapRateInputs((prev) => ({ ...prev, exitCapRate: e.target.value }))}
                    className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-emerald-300" />
                  Cap Rate Outputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                {capRateResults ? (
                  <>
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-600/10 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Cap Rate</p>
                      <p className="text-3xl font-semibold text-white">
                        {capRateResults.capRate !== null && capRateResults.capRate !== undefined
                          ? `${capRateResults.capRate.toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">DSCR</p>
                      <p className="text-3xl font-semibold text-white">
                        {capRateResults.dscr !== null && capRateResults.dscr !== undefined
                          ? capRateResults.dscr.toFixed(2)
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Implied Value @ Exit Cap</p>
                      <p className="text-2xl font-semibold text-white">
                        {capRateResults.impliedValue
                          ? `$${Math.round(capRateResults.impliedValue).toLocaleString("en-US")}`
                          : "Enter cap rate"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Align DSCR thresholds with lending partners and compare implied exit values with CapIV Core comps.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-center">
                    Provide NOI, pricing, and leverage assumptions to see cap rate metrics.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">Portfolio Signal</p>
                <p className="text-base text-slate-200">KPIs, allocations, and download-ready investor reporting.</p>
              </div>
            </div>
          </div>
          <PortfolioAnalysis selectedMetric={selectedMetric} onMetricSelect={setSelectedMetric} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
