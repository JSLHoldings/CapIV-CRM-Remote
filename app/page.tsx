"use client"

import { Card, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { VerificationGate } from "@/components/verification-gate"
import { useRouter } from "next/navigation"
import { Building2, Shield, Layers3, Briefcase } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Home() {
  const router = useRouter()

  const quickStats = [
    { label: "Active Mandates", value: "12", insight: "+3 vs last month", icon: Briefcase, accent: "bg-blue-500/10 text-blue-200" },
    { label: "Capital Ready", value: "$48M", insight: "Verified allocations", icon: Building2, accent: "bg-emerald-500/10 text-emerald-200" },
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
      title: "CapIV IQ",
      subtitle: "Compliance Fabric",
      description: "Govern NDAs, Persona AML, and underwriting diagnostics from one command lane.",
      href: "/capiv-iq",
      icon: Shield,
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
  ]

  const quickActions = [
    { label: "Open CapIV Core", href: "/core" },
    { label: "Open CapIV IQ", href: "/capiv-iq" },
    { label: "Jump to CapIV™ Access", href: "/access" },
  ]

  const handleNavigate = (href: string) => {
    router.push(href)
  }

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

              <Card className="bg-slate-800 border-slate-700 p-6">
                <CardTitle className="text-white mb-4">Quick Actions</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                </div>
              </Card>
            </div>
         </DashboardShell>
        </VerificationGate>
      </ProtectedRoute>
    </>
  )
}
