"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { VerificationGate } from "@/components/verification-gate"
import { useRouter } from "next/navigation"
import { Users, Building2, Shield, BarChart3, Layers3, RefreshCw, Briefcase } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Home() {
  const router = useRouter()
  const [capitalAmount, setCapitalAmount] = useState("")
  const [timePeriod, setTimePeriod] = useState("")
  const [annualRate, setAnnualRate] = useState("")
  const [results, setResults] = useState({ amount: 0, roi: 0 })
  const [approvedDeals, setApprovedDeals] = useState<Array<Record<string, string>>>([])
  const approvedStorageKey = "capiv-approved-deals"

  const quickStats = [
    { label: "Active Mandates", value: "12", insight: "+3 vs last month", icon: Briefcase, accent: "bg-blue-500/10 text-blue-200" },
    { label: "Capital Ready", value: "$48M", insight: "Verified allocations", icon: Building2, accent: "bg-emerald-500/10 text-emerald-200" },
    { label: "Investor Matches", value: "28", insight: "Warm introductions live", icon: Users, accent: "bg-purple-500/10 text-purple-200" },
    { label: "Data Rooms", value: "9", insight: "Awaiting final sign-off", icon: Shield, accent: "bg-orange-500/10 text-orange-200" },
  ]

  const productModules = [
    {
      title: "CapIV™ Core",
      subtitle: "Deal Intelligence Hub",
      description: "Orchestrate mandates, track partner velocity, and activate AI curation.",
      href: "/core",
      icon: Layers3,
      status: "Live",
    },
    {
      title: "Capital Access",
      subtitle: "Capital Stack Visibility",
      description: "Unlock structured capital, co-investment lanes, and credit opportunities.",
      href: "/access",
      icon: Building2,
      status: "Live",
    },
    {
      title: "CapIV IQ",
      subtitle: "Compliance Fabric",
      description: "Govern NDAs, Persona AML, and underwriting diagnostics from one command lane.",
      href: "/capiv-iq",
      icon: Shield,
      status: "Live",
    },
    {
      title: "Matchmaking",
      subtitle: "Precision Pairing",
      description: "AI-driven introductions between capital profiles and verified opportunities.",
      href: "/matchmaking",
      icon: RefreshCw,
      status: "Live",
    },
    {
      title: "Deal Marketplace",
      subtitle: "Curated Opportunities",
      description: "Discover vetted transactions filtered by structure, geography, and thesis.",
      href: "/deals",
      icon: Briefcase,
      status: "Live",
    },
    {
      title: "CapIV EQ",
      subtitle: "Performance Lens",
      description: "Monitor portfolio KPIs and run ROI/IRR calculators inside the same workspace.",
      href: "/capiv-eq",
      icon: BarChart3,
      status: "Beta",
    },
  ]

  const workflow = [
    { title: "Horizon JV NDA", detail: "Awaiting counterparty signature", meta: "Due in 2 days" },
    { title: "Data Room Audit", detail: "Capstone Logistics — compliance review", meta: "In progress" },
    { title: "Investor Sync", detail: "Schedule follow-up with Meridian Family Office", meta: "Next action: schedule" },
  ]

  const quickActions = [
    { label: "Submit New Deal", href: "/deals" },
    { label: "Invite a Capital Partner", href: "/matchmaking" },
    { label: "Open CapIV IQ", href: "/capiv-iq" },
    { label: "Jump to CapIV™ Access", href: "/access" },
  ]

  const calculateROI = () => {
    const capital = Number.parseFloat(capitalAmount) || 0
    const time = Number.parseFloat(timePeriod) || 0
    const rate = Number.parseFloat(annualRate) || 0

    const finalAmount = capital * Math.pow(1 + rate / 100, time)
    const roiPercentage = capital === 0 ? 0 : ((finalAmount - capital) / capital) * 100

    setResults({
      amount: Number.isFinite(finalAmount) ? Math.round(finalAmount) : 0,
      roi: Number.isFinite(roiPercentage) ? Number.parseFloat(roiPercentage.toFixed(1)) : 0,
    })
  }

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(approvedStorageKey)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as Array<Record<string, string>>
      setApprovedDeals(parsed)
    } catch (error) {
      console.error("Failed to parse approved deals", error)
    }
  }, [])

  return (<>
    <ProtectedRoute>
      <VerificationGate>
        <DashboardShell>
          <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
              <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/40 via-slate-900 to-slate-900 p-10 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80 mb-4">CapIV™ Command</p>
                <h1 className="text-4xl font-bold text-white mb-2">Activate Your Intelligent Private Markets Stack</h1>
                <p className="text-lg text-slate-200 max-w-2xl">
                  Review live mandates, navigate data rooms, and deploy capital across Core, Access, and CapIV IQ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {quickStats.map((stat) => (
                  <Card key={stat.label} className="bg-slate-800 border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <span className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm ${stat.accent}`}>
                        <stat.icon className="mr-2 h-4 w-4" />
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-3xl font-semibold text-white mb-2">{stat.value}</div>
                    <p className="text-sm text-slate-400">{stat.insight}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {productModules.map((module) => (
                  <Card
                    key={module.title}
                    className="bg-slate-800 border-slate-700 p-6 transition-all hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-750 cursor-pointer"
                    onClick={() => handleNavigate(module.href)}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl bg-slate-700/70">
                        <module.icon className="h-6 w-6 text-blue-300" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{module.status}</span>
                    </div>
                    <CardTitle className="text-xl text-white mb-1">{module.title}</CardTitle>
                    <p className="text-sm text-blue-300 font-medium mb-3">{module.subtitle}</p>
                    <p className="text-sm leading-relaxed text-slate-300">{module.description}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Active Workflows</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {workflow.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-slate-700 bg-slate-800/60 px-5 py-4 hover:border-blue-500/40 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-slate-300">{item.detail}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-2">{item.meta}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        className="w-full justify-between border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                        onClick={() => handleNavigate(action.href)}
                      >
                        {action.label}
                        <span className="text-sm text-slate-400">↗</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Approved Mandates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvedDeals.length === 0 ? (
                    <p className="text-sm text-slate-400">No approved deals yet. Approvals from Underwriting appear here.</p>
                  ) : (
                    approvedDeals.slice(0, 6).map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-2xl border border-slate-700 bg-slate-800/60 px-5 py-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{deal.name}</h3>
                          <span className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Approved</span>
                        </div>
                        <p className="text-sm text-slate-300">{deal.sponsor}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 uppercase tracking-[0.18em]">
                          <span>{deal.location}</span>
                          <span>{deal.size}</span>
                          <span>Score {deal.score}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6" id="roi-calculator">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">ROI & IRR Scenario Builder</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capital" className="text-slate-300">
                          Capital Amount
                        </Label>
                        <Input
                          id="capital"
                          type="number"
                          value={capitalAmount}
                          onChange={(e) => setCapitalAmount(e.target.value)}
                          placeholder="2500000"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-slate-300">
                          Time Horizon (Years)
                        </Label>
                        <Input
                          id="time"
                          type="number"
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value)}
                          placeholder="5"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate" className="text-slate-300">
                          Annual Rate (%)
                        </Label>
                        <Input
                          id="rate"
                          type="number"
                          value={annualRate}
                          onChange={(e) => setAnnualRate(e.target.value)}
                          placeholder="12"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={calculateROI}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                    >
                      Run Scenario
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Projected Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-semibold text-white">
                        ${results.amount.toLocaleString("en-US")}
                      </p>
                      <p className="text-sm text-slate-400 mt-2">Assuming reinvested annual compounding</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Annual ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-semibold text-white">{results.roi}%</p>
                      <p className="text-sm text-slate-400 mt-2">Use Access + Portfolio Analytics to stress test</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
         </DashboardShell>
        </VerificationGate>
      </ProtectedRoute>
    </>
  )
}
