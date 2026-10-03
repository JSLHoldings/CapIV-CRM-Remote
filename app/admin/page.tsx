import { Badge } from "@/components/ui/badge"
import { AdminDebugPanel } from "@/components/admin-debug-panel"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { ShieldCheck, Zap, Layers } from "lucide-react"

export default function AdminDashboard() {
  const callouts = [
    {
      icon: ShieldCheck,
      title: "Safe Sandbox",
      description: "All toggles persist locally only. Clear data to snap the workspace back to baseline.",
    },
    {
      icon: Zap,
      title: "Rapid Iteration",
      description: "Mock login, skip verification, and deep-link anywhere in one flow to test journeys quickly.",
    },
    {
      icon: Layers,
      title: "Full Stack View",
      description: "Inspect auth, verification metadata, and OM submissions in a single command surface.",
    },
  ]

  return (
    <ProtectedRoute requireAdmin>
      <DashboardShell>
        <div className="px-8 py-10">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-red-400/70 mb-2">Restricted</p>
                <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
                <p className="text-slate-300">
                  Debug and test the CRM without API keys or verification in the unified dark workspace.
                </p>
              </div>
              <Badge className="text-sm tracking-[0.2em] bg-red-500/30 text-red-200 border border-red-500/40 px-4 py-2">
                DEBUG MODE
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {callouts.map((callout) => {
                const Icon = callout.icon
                return (
                  <div
                    key={callout.title}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-start gap-3"
                  >
                    <div className="rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                      <Icon className="w-4 h-4 text-red-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{callout.title}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{callout.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <AdminDebugPanel />
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
