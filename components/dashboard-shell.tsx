"use client"

import { type ReactNode, useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Menu, X } from "lucide-react"

interface DashboardShellProps {
  children: ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Desktop rail */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile drawer + backdrop */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <Sidebar
            className="absolute inset-y-0 left-0 shadow-2xl shadow-black/50 animate-in slide-in-from-left duration-200"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200 hover:bg-slate-800"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">JSL Tech</h1>
          <span className="w-10" aria-hidden />
        </header>

        <div className={cn("flex-1 overflow-y-auto bg-slate-900/60", className)}>{children}</div>
      </div>
    </div>
  )
}
