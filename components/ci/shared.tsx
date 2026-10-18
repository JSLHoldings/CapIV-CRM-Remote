"use client"

import type { ReactNode } from "react"
import { Info, Search } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ModuleShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <ProtectedRoute requireAdmin>
      <DashboardShell>
        <div className="px-4 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-blue-300/70">Capital Intelligence</p>
                <h1 className="text-balance text-3xl font-semibold text-white">{title}</h1>
                <p className="mt-1 max-w-2xl text-pretty text-slate-300">{description}</p>
              </div>
              {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
            </header>
            {children}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}

const TONES: Record<string, string> = {
  "Not started": "bg-slate-500/20 text-slate-200 border-slate-500/40",
  "In progress": "bg-blue-500/20 text-blue-200 border-blue-500/40",
  Blocked: "bg-red-500/20 text-red-200 border-red-500/40",
  Done: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  Pending: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  "In review": "bg-blue-500/20 text-blue-200 border-blue-500/40",
  Complete: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  Adopted: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  "Under review": "bg-amber-500/20 text-amber-200 border-amber-500/40",
  Superseded: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  Conflict: "bg-red-500/20 text-red-200 border-red-500/40",
  Untested: "bg-slate-500/20 text-slate-200 border-slate-500/40",
  Supported: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  "Not supported": "bg-red-500/20 text-red-200 border-red-500/40",
  Unknown: "bg-slate-500/20 text-slate-200 border-slate-500/40",
  No: "bg-red-500/20 text-red-200 border-red-500/40",
  Maybe: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  Yes: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  "Pending local counsel review": "bg-amber-500/20 text-amber-200 border-amber-500/40",
  "Candidate corridor, not cleared": "bg-amber-500/20 text-amber-200 border-amber-500/40",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap border", TONES[status] ?? TONES["Not started"])}>
      {status}
    </Badge>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="border-slate-700 bg-slate-900 pl-9 text-slate-100 placeholder:text-slate-500"
      />
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-300" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-xl border border-slate-800 bg-slate-900/60 p-5", className)}>{children}</section>
}

export function ScopeGuardrails() {
  const items = ["Forecasts", "Live international introductions", "Fund formation", "Custody", "Payment rails", "Tokenization"]
  return (
    <Panel>
      <h2 className="text-sm font-semibold text-white">Out of scope for V2 beta (separately gated)</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export const selectTriggerClass = "border-slate-700 bg-slate-900 text-slate-100"
