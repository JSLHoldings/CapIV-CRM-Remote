"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { ModuleShell, Note, Panel } from "@/components/ci/shared"
import { PILOT_METRICS } from "@/lib/capital-intelligence/data"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

function CaseCounter({ label, range, max, value, onChange }: { label: string; range: string; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          <p className="text-xs text-slate-400">Target: {range} cases</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Decrease ${label} count`}>
            <Minus className="size-4" aria-hidden />
          </Button>
          <span className="w-8 text-center text-2xl font-semibold text-white" aria-live="polite">
            {value}
          </span>
          <Button variant="outline" size="icon" onClick={() => onChange(value + 1)} aria-label={`Increase ${label} count`}>
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      <Progress value={Math.min(100, (value / max) * 100)} className="mt-4" aria-label={`${label} progress`} />
    </Panel>
  )
}

export default function PilotMetricsPage() {
  const [historical, setHistorical] = useState(0)
  const [live, setLive] = useState(0)

  return (
    <ModuleShell
      title="Pilot Metrics"
      description="Five measures for the affiliated beta. Values stay blank until a baseline is recorded."
    >
      <Note>Report denominators and follow-up periods. Affiliated usage is tracked separately from external paid usage.</Note>

      <div className="grid gap-4 sm:grid-cols-2">
        <CaseCounter label="Historical cases" range="5-10" max={10} value={historical} onChange={setHistorical} />
        <CaseCounter label="Live cases" range="10-20" max={20} value={live} onChange={setLive} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PILOT_METRICS.map((m) => (
          <Panel key={m.id}>
            <h3 className="text-sm font-semibold text-white">{m.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{m.detail}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-200">&mdash;</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div>
                <dt>Denominator</dt>
                <dd className="text-slate-300">n = {historical + live} cases</dd>
              </div>
              <div>
                <dt>Follow-up period</dt>
                <dd className="text-slate-300">Not set</dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>
    </ModuleShell>
  )
}
