"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  RISK_CATALOG, RISK_SEVERITY_CLASS, getRiskFlag, riskBadgeClass, sortRiskFlags,
} from "@/lib/risk-flags"
import { AlertTriangle, ShieldCheck, ShieldAlert, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Read-only strip of detected risk flags (used on cards) ───────────────────
export function RiskFlagBadges({
  flags, className, emptyHint,
}: { flags: string[]; className?: string; emptyHint?: string }) {
  if (flags.length === 0) {
    return emptyHint ? (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-emerald-300/80", className)}>
        <ShieldCheck className="h-3 w-3" />
        {emptyHint}
      </span>
    ) : null
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {sortRiskFlags(flags).map((id) => {
        const def = getRiskFlag(id)
        return (
          <Badge key={id} className={cn("text-[10px] font-medium", riskBadgeClass(id))} title={def?.description}>
            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
            {def?.label ?? id}
          </Badge>
        )
      })}
    </div>
  )
}

interface RiskFlagManagerProps {
  /** Currently applied risk-flag ids. */
  flags: string[]
  /** Risk flags the decision engine detected (may already be applied). */
  detected?: string[]
  onChange: (flags: string[]) => void
  className?: string
}

// ── Risk manager: shows engine-detected risk + manual override toggles ───────
export function RiskFlagManager({ flags, detected = [], onChange, className }: RiskFlagManagerProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    onChange(flags.includes(id) ? flags.filter((f) => f !== id) : sortRiskFlags([...flags, id]))
  }

  const undetectedButApplied = flags.length
  const suggestions = detected.filter((d) => !flags.includes(d))

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <RiskFlagBadges flags={flags} emptyHint="No risk detected" />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-6 px-2 text-[11px] hover:text-white",
              undetectedButApplied > 0
                ? "border-rose-500/50 text-rose-300 hover:border-rose-400"
                : "border-slate-600 text-slate-300 hover:border-amber-400",
            )}
          >
            <ShieldAlert className="h-3 w-3 mr-1" />
            Risk{undetectedButApplied > 0 ? ` (${undetectedButApplied})` : ""}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 bg-slate-900 border border-slate-700 text-slate-100 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Engine-detected risks not yet applied */}
          {suggestions.length > 0 && (
            <>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-amber-200">Detected by engine</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((id) => {
                    const def = getRiskFlag(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(id)}
                        className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] transition-opacity hover:opacity-80", riskBadgeClass(id))}
                      >
                        <Plus className="h-2.5 w-2.5 mr-1" />
                        {def?.label ?? id}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Separator className="bg-slate-800" />
            </>
          )}

          {/* Full risk catalog — manual raise/clear (override) */}
          <div className="p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Risk flags</p>
            <div className="space-y-1">
              {RISK_CATALOG.map((f) => {
                const active = flags.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      active ? "bg-slate-800" : "hover:bg-slate-800/60",
                    )}
                    title={f.description}
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", RISK_SEVERITY_CLASS[f.severity])} />
                    <span className="flex-1 text-xs text-slate-200">{f.label}</span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-500">{f.severity}</span>
                    {active && <Check className="h-3.5 w-3.5 text-rose-400 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
