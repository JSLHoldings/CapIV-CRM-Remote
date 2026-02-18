"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"

interface DashboardShellProps {
  children: ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className={cn("flex-1 overflow-y-auto bg-slate-900/60", className)}>{children}</div>
    </div>
  )
}
