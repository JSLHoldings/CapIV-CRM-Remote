"use client"

import { useState } from "react"
import { ModuleShell, Panel, ScopeGuardrails } from "@/components/ci/shared"
import { RELEASE_GATE_ITEMS } from "@/lib/capital-intelligence/data"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ReleaseGatePage() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const total = RELEASE_GATE_ITEMS.length
  const ready = checked.size === total

  const toggle = (item: string, value: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (value) next.add(item)
      else next.delete(item)
      return next
    })

  return (
    <ModuleShell
      title="Release Gate Checklist"
      description="Every item must pass before the beta is released. Progress is kept in this session only."
      actions={
        <Button variant="outline" onClick={() => setChecked(new Set())} disabled={checked.size === 0}>
          Reset
        </Button>
      }
    >
      <Panel className={cn("flex flex-col gap-4", ready ? "border-emerald-500/50" : "border-red-500/40")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn("size-3 rounded-full", ready ? "bg-emerald-400" : "bg-red-500")} aria-hidden />
            <p className="text-lg font-semibold text-white" role="status">
              {ready ? "Beta ready" : "Not beta ready"}
            </p>
          </div>
          <p className="text-sm text-slate-300">
            {checked.size} of {total} complete
          </p>
        </div>
        <Progress value={(checked.size / total) * 100} aria-label="Release gate progress" />
      </Panel>

      <Panel>
        <ul className="divide-y divide-slate-800">
          {RELEASE_GATE_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 py-3">
              <Checkbox id={item} checked={checked.has(item)} onCheckedChange={(v) => toggle(item, v === true)} />
              <label htmlFor={item} className={cn("flex-1 cursor-pointer text-sm", checked.has(item) ? "text-slate-500 line-through" : "text-slate-100")}>
                {item}
              </label>
            </li>
          ))}
        </ul>
      </Panel>

      <ScopeGuardrails />
    </ModuleShell>
  )
}
