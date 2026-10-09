"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  PieChart,
  Target,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
// local fallback for downloadReport if the shared module is not available
// Creates and triggers a JSON download in-browser
const downloadReport = (title: string, payload: any, opts?: { format?: string }) => {
  try {
    const data =
      opts?.format === "json"
        ? JSON.stringify({ title, payload, meta: { generatedAt: new Date().toISOString() } }, null, 2)
        : String(payload)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const ext = opts?.format === "json" ? "json" : "txt"
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    // noop - avoid breaking the UI if download fails
    // eslint-disable-next-line no-console
    console.error("downloadReport failed", e)
  }
}
import { cn } from "@/lib/utils"

interface PortfolioAnalysisProps {
  selectedMetric: string | null
  onMetricSelect: (metric: string | null) => void
}

const portfolioMetrics = [
  {
    id: "total-value",
    title: "Total Portfolio Value",
    value: "$12,450,000",
    change: "+8.2%",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    id: "ytd-return",
    title: "Year-to-Date Return",
    value: "14.7%",
    change: "+2.1%",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    id: "active-deals",
    title: "Active Mandates",
    value: "23",
    change: "+3",
    changeType: "positive",
    icon: Target,
  },
  {
    id: "avg-irr",
    title: "Average IRR",
    value: "18.3%",
    change: "-1.2%",
    changeType: "negative",
    icon: BarChart3,
  },
]

const assetAllocation = [
  { name: "Real Estate", value: 45, amount: "$5,602,500", color: "bg-blue-500" },
  { name: "Private Equity", value: 30, amount: "$3,735,000", color: "bg-purple-500" },
  { name: "Debt Investments", value: 15, amount: "$1,867,500", color: "bg-emerald-500" },
  { name: "Alternative Assets", value: 10, amount: "$1,245,000", color: "bg-orange-500" },
]

const recentDeals = [
  {
    id: "deal-001",
    name: "Sunset Plaza Apartments",
    type: "Real Estate",
    investment: "$2,500,000",
    currentValue: "$2,750,000",
    return: "+10.0%",
    status: "Active",
    date: "2024-01-15",
  },
  {
    id: "deal-002",
    name: "TechStart Series B",
    type: "Private Equity",
    investment: "$1,200,000",
    currentValue: "$1,440,000",
    return: "+20.0%",
    status: "Active",
    date: "2024-01-10",
  },
  {
    id: "deal-003",
    name: "Manufacturing Corp Debt",
    type: "Debt Investment",
    investment: "$800,000",
    currentValue: "$840,000",
    return: "+5.0%",
    status: "Active",
    date: "2024-01-05",
  },
  {
    id: "deal-004",
    name: "Healthcare Fund LP",
    type: "Private Equity",
    investment: "$1,500,000",
    currentValue: "$1,350,000",
    return: "-10.0%",
    status: "Watch",
    date: "2023-12-20",
  },
]

const performanceHighlights = [
  {
    id: "net-irr",
    label: "Net IRR",
    value: "18.3%",
    context: "+120 bps versus underwriting model",
  },
  {
    id: "yield",
    label: "Distribution Yield",
    value: "6.4%",
    context: "Net cash yield across the stack",
  },
  {
    id: "volatility",
    label: "Portfolio Volatility",
    value: "7.4%",
    context: "-180 bps drawdown improvement YoY",
  },
  {
    id: "drawdown",
    label: "Max Drawdown",
    value: "-5.8%",
    context: "Shallowest pullback since FY20",
  },
]

const alphaDrivers = [
  {
    id: "leasing",
    title: "Sunbelt Leasing Momentum",
    impact: "+2.3% return lift",
    narrative: "Renewals running 8.4% ahead of pro forma with resilient occupancy.",
  },
  {
    id: "growth",
    title: "Tech Growth Buyouts",
    impact: "+1.9% value accretion",
    narrative: "Follow-ons in TechStart Series B pacing 220 bps ahead of plan.",
  },
  {
    id: "credit",
    title: "Floating Rate Credit",
    impact: "+80 bps cash yield",
    narrative: "Hedged book capturing SOFR beta through laddered senior notes.",
  },
]

const riskSignals = [
  {
    id: "rates",
    label: "Interest Rate Sensitivity",
    status: "Moderate",
    trend: "Improving",
    detail: "DV01 reduced 12% q/q after layering in two new swaps.",
  },
  {
    id: "tenants",
    label: "Tenant Concentration",
    status: "Watch",
    trend: "Stable",
    detail: "Top-3 tenants drive 31% NOI; renewals in negotiation window.",
  },
  {
    id: "liquidity",
    label: "Liquidity Coverage",
    status: "Strong",
    trend: "Improving",
    detail: "18 months runway when combining cash and undrawn revolver.",
  },
]

const riskStatusStyles: Record<
  string,
  {
    badge: string
  }
> = {
  Strong: {
    badge: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
  },
  Moderate: {
    badge: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
  },
  Watch: {
    badge: "bg-orange-500/10 text-orange-200 border border-orange-500/30",
  },
}

const scenarioPlans = [
  {
    id: "base",
    name: "Base Case",
    irr: "17.0%",
    moic: "1.8x",
    commentary: "Steady rate glide path with 5% blended NOI growth.",
  },
  {
    id: "bull",
    name: "Upside Case",
    irr: "21.4%",
    moic: "2.2x",
    commentary: "Logistics vacancy tightens, exit multiples expand 50 bps.",
  },
  {
    id: "bear",
    name: "Downside Case",
    irr: "12.6%",
    moic: "1.5x",
    commentary: "Cap rates widen 75 bps and exits slip by two quarters.",
  },
]

const liquidityEvents = [
  {
    id: "dist-001",
    type: "Distribution",
    amount: "$1.4M",
    date: "2024-03-15",
    status: "Committed",
  },
  {
    id: "call-001",
    type: "Capital Call",
    amount: "$950K",
    date: "2024-04-01",
    status: "Planned",
  },
]

const pipelineMandates = [
  {
    id: "pipeline-001",
    name: "Logistics JV Expansion",
    stage: "IC Approved",
    allocation: "$3.2M",
    eta: "Q2 2024",
  },
  {
    id: "pipeline-002",
    name: "Healthcare Operator Rollup",
    stage: "Diligence",
    allocation: "$2.5M",
    eta: "Q3 2024",
  },
  {
    id: "pipeline-003",
    name: "Credit Opportunities Fund II",
    stage: "Screening",
    allocation: "$1.8M",
    eta: "Q4 2024",
  },
]

const pipelineStageStyles: Record<
  string,
  {
    badge: string
  }
> = {
  "IC Approved": {
    badge: "bg-blue-500/10 text-blue-200 border border-blue-500/30",
  },
  Diligence: {
    badge: "bg-purple-500/10 text-purple-200 border border-purple-500/30",
  },
  Screening: {
    badge: "bg-slate-700/60 text-slate-200 border border-slate-600",
  },
}

const timeRangeLabels: Record<string, string> = {
  "1M": "Trailing 1 month",
  "3M": "Trailing 3 months",
  "6M": "Half-year view",
  "1Y": "Trailing 12 months",
  All: "Full lifecycle overview",
}

const capitalHighlights = [
  {
    id: "deployment",
    label: "Deployment Pace",
    value: "$4.8M deployed",
    context: "Across 5 mandates year to date",
  },
  {
    id: "distributions",
    label: "Investor Distributions",
    value: "$3.1M returned",
    context: "Average hold period: 27 months",
  },
  {
    id: "dry-powder",
    label: "Dry Powder",
    value: "$6.6M",
    context: "Committed but undrawn capital",
  },
]

export function PortfolioAnalysis({ selectedMetric, onMetricSelect }: PortfolioAnalysisProps) {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState("1Y")
  const { toast } = useToast()

  const firstName = user?.name?.split(" ")[0] ?? "Member"

  const handleExport = () => {
    const exportPayload = {
      timeRange,
      metrics: portfolioMetrics,
      allocation: assetAllocation,
      recentDeals,
      generatedBy: firstName,
    }

    downloadReport("Portfolio Analysis", exportPayload, { format: "json" })
    toast({
      title: "Portfolio export ready",
      description: "A JSON snapshot has been downloaded for your records.",
    })
  }

  const getReturnVisual = (value: string) => {
    const isPositive = value.trim().startsWith("+")
    return {
      icon: isPositive ? (
        <ArrowUpRight className="w-4 h-4 text-emerald-300" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-red-300" />
      ),
      className: isPositive ? "text-emerald-200" : "text-red-200",
    }
  }

  return (
    <div className="min-h-full px-8 py-10 space-y-10">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-500/15 p-4 border border-blue-500/30">
            <BarChart3 className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">Portfolio Analysis</h1>
            <p className="text-slate-300">
              Welcome, {firstName}. Track your allocations, performance, and live mandates across the JSL Tech™ stack.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/70 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="All">All Time</option>
          </select>
          <Button
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Snapshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {portfolioMetrics.map((metric) => {
          const MetricIcon = metric.icon
          const isSelected = selectedMetric === metric.id
          return (
            <Card
              key={metric.id}
              className={cn(
                "bg-slate-900/80 border border-slate-800 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-blue-500/40 cursor-pointer",
                isSelected && "border-blue-500/60 shadow-lg shadow-blue-500/10"
              )}
              onClick={() => onMetricSelect(isSelected ? null : metric.id)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
                  <MetricIcon className="w-6 h-6 text-blue-300" />
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {metric.changeType === "positive" ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                  )}
                  <span
                    className={cn(
                      metric.changeType === "positive" ? "text-emerald-200" : "text-red-200",
                      "tracking-wide"
                    )}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-2">{metric.title}</p>
              <p className="text-2xl font-semibold text-white">{metric.value}</p>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-2xl border border-slate-800 bg-slate-900/80">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="allocation"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Asset Allocation
          </TabsTrigger>
          <TabsTrigger
            value="deals"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Recent Deals
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
            <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Portfolio Performance</CardTitle>
                  <p className="text-slate-400 text-sm">Rolling analytics for the selected time range</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Detail
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {timeRangeLabels[timeRange] ?? "Selected window"} overview
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {performanceHighlights.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                      <p className="text-xl font-semibold text-white">{item.value}</p>
                      <p className="text-xs text-slate-400">{item.context}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Alpha Drivers</span>
                      <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/30">
                        Attribution
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {alphaDrivers.map((driver) => (
                        <div key={driver.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{driver.title}</p>
                            <Badge className="bg-slate-800 text-emerald-200 border border-emerald-500/30">
                              {driver.impact}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{driver.narrative}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Capital Rotation</span>
                      <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30">Activity</Badge>
                    </div>
                    <div className="space-y-4">
                      {capitalHighlights.map((highlight) => (
                        <div key={highlight.id}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{highlight.label}</p>
                          <p className="text-sm font-semibold text-white mt-1">{highlight.value}</p>
                          <p className="text-xs text-slate-400">{highlight.context}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-400 leading-relaxed">
                      <p>
                        Deployment pacing aligns with target sleeve weights while distributions continue to fund new
                        mandates without tapping credit lines.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <div className="flex items-start justify-between">
                  <span className="text-slate-400">Best Performing Asset</span>
                  <div className="text-right">
                    <p className="font-semibold text-white">TechStart Series B</p>
                    <p className="text-emerald-300 text-xs font-semibold">+20.0%</p>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400">Largest Position</span>
                  <div className="text-right">
                    <p className="font-semibold text-white">Real Estate</p>
                    <p className="text-xs text-slate-500">45% allocation</p>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400">Risk Score</span>
                  <div className="text-right">
                    <p className="font-semibold text-white">Medium</p>
                    <p className="text-xs text-slate-500">Balanced portfolio</p>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400">Diversification</span>
                  <div className="text-right">
                    <p className="font-semibold text-white">Solid</p>
                    <p className="text-xs text-slate-500">4 asset classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-4 h-4 text-orange-300" />
                  Risk Monitor
                </CardTitle>
                <Badge className="bg-slate-800 text-slate-300 border border-slate-700">Updated daily</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{signal.label}</p>
                      <Badge
                        className={cn(
                          "bg-slate-800 text-slate-200 border border-slate-700",
                          riskStatusStyles[signal.status]?.badge
                        )}
                      >
                        {signal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{signal.detail}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.18em]">{signal.trend} trend</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="w-4 h-4 text-blue-300" />
                  Scenario Analysis
                </CardTitle>
                <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30">Monte Carlo</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {scenarioPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{plan.name}</p>
                      <Badge className="bg-slate-800 text-slate-200 border border-slate-700">IRR {plan.irr}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>MOIC {plan.moic}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Horizon 5 yrs</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{plan.commentary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-purple-300" />
                  Liquidity & Pipeline
                </CardTitle>
                <Badge className="bg-purple-500/10 text-purple-200 border border-purple-500/30">Forward view</Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Near-term activity</p>
                  {liquidityEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{event.type}</p>
                        <p className="text-xs text-slate-500">{event.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{event.amount}</p>
                        <Badge className="bg-slate-800 text-slate-200 border border-slate-700">{event.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mandate pipeline</p>
                  {pipelineMandates.map((mandate) => (
                    <div
                      key={mandate.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{mandate.name}</p>
                        <Badge
                          className={cn(
                            "bg-slate-800 text-slate-200 border border-slate-700",
                            pipelineStageStyles[mandate.stage]?.badge
                          )}
                        >
                          {mandate.stage}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-[0.18em]">
                        <span>{mandate.allocation}</span>
                        <span>{mandate.eta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allocation">
          <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
              <p className="text-slate-400 text-sm">Composition across every asset class</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
              <div className="h-80 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
                <div className="text-center text-slate-500 space-y-2">
                  <PieChart className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm uppercase tracking-[0.3em]">Visualization Placeholder</p>
                  <p className="text-xs text-slate-600">Interactive chart coming soon</p>
                </div>
              </div>

              <div className="space-y-5">
                {assetAllocation.map((asset) => (
                  <div key={asset.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${asset.color}`}></div>
                        <span className="text-sm font-medium text-white">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{asset.amount}</p>
                        <p className="text-xs text-slate-500">{asset.value}% allocation</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${asset.color}`} style={{ width: `${asset.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Deals</CardTitle>
                <p className="text-slate-400 text-sm">Live positions and performance snapshots</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                View All Deals
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDeals.map((deal) => {
                const { icon, className } = getReturnVisual(deal.return)
                return (
                  <div
                    key={deal.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition-colors hover:border-blue-500/40 cursor-pointer"
                    onClick={() => onMetricSelect(deal.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{deal.name}</h4>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500 mt-2">
                          <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30">{deal.type}</Badge>
                          <span>{deal.date}</span>
                        </div>
                      </div>
                      <Badge className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1">
                        {deal.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm text-slate-300">
                      <div>
                        <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Investment</p>
                        <p className="font-medium text-white">{deal.investment}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Current Value</p>
                        <p className="font-medium text-white">{deal.currentValue}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Return</p>
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className={cn("font-medium", className)}>{deal.return}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Recorded</p>
                        <p className="font-medium text-white">{deal.date}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
              <p className="text-slate-400 text-sm">Advanced analytics rolling out soon</p>
            </CardHeader>
            <CardContent>
              <div className="h-80 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
                <div className="text-center text-slate-500 space-y-2">
                  <TrendingUp className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm uppercase tracking-[0.3em]">Analytics Placeholder</p>
                  <p className="text-xs text-slate-600">IRR projections and scenario analysis coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Exports</p>
          <p className="text-lg font-semibold text-white">Download portfolio snapshot</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
      </div>
    </div>
  )
}
