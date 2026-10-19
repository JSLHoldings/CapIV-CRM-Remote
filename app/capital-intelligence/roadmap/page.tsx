"use client"

import { useMemo, useState } from "react"
import { ModuleShell, Note, Panel, ScopeGuardrails, SearchInput, StatusBadge, selectTriggerClass } from "@/components/ci/shared"
import { PHASES, PHASE_STATUSES, type PhaseStatus } from "@/lib/capital-intelligence/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RoadmapPage() {
  const [statuses, setStatuses] = useState<Record<string, PhaseStatus>>(
    () => Object.fromEntries(PHASES.map((p) => [p.id, p.status])),
  )
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<string>("all")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PHASES.filter((p) => {
      const matchesQuery = !q || [p.title, p.owner, p.exit, p.window].some((v) => v.toLowerCase().includes(q))
      const matchesFilter = filter === "all" || statuses[p.id] === filter
      return matchesQuery && matchesFilter
    })
  }, [query, filter, statuses])

  return (
    <ModuleShell
      title="Roadmap and Timeline"
      description="Phased plan for the Capital Intelligence MVP V2, with an owner and exit condition for each phase."
    >
      <Note>Planning ranges, not a delivery commitment. Dates assume project start Oct 19, 2026.</Note>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search phases" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className={`${selectTriggerClass} sm:w-48`} aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PHASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ol className="relative space-y-4 border-l border-slate-700 pl-6">
        {visible.map((phase) => (
          <li key={phase.id} className="relative">
            <span className="absolute -left-[31px] top-6 size-3 rounded-full border-2 border-slate-950 bg-blue-400" aria-hidden />
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-blue-300/80">
                    {phase.window} <span className="text-slate-500">&middot;</span> {phase.ends}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{phase.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={statuses[phase.id]} />
                  <Select value={statuses[phase.id]} onValueChange={(v) => setStatuses((s) => ({ ...s, [phase.id]: v as PhaseStatus }))}>
                    <SelectTrigger className={`${selectTriggerClass} h-8 w-36`} aria-label={`Update status for ${phase.window}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-[180px_1fr]">
                <div>
                  <dt className="text-slate-500">Owner</dt>
                  <dd className="text-slate-200">{phase.owner}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Exit condition</dt>
                  <dd className="text-slate-200">{phase.exit}</dd>
                </div>
              </dl>
            </Panel>
          </li>
        ))}
        {visible.length === 0 && <li className="text-sm text-slate-400">No phases match your filters.</li>}
      </ol>

      <ScopeGuardrails />
    </ModuleShell>
  )
}
