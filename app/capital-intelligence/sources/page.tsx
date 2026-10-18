"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, PauseCircle } from "lucide-react"
import { ModuleShell, SearchInput, StatusBadge, selectTriggerClass } from "@/components/ci/shared"
import { SOURCES } from "@/lib/capital-intelligence/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SourcesPage() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOURCES.filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (!q || [s.id, s.version, s.owner, s.supersededFiles, s.recipients].some((v) => v.toLowerCase().includes(q))),
    )
  }, [query, filter])

  return (
    <ModuleShell
      title="Source Register and Issues"
      description="Which documents are authoritative, who owns them, and who may receive them."
    >
      <div role="status" className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <PauseCircle className="size-5 shrink-0" aria-hidden />
        App deployment remains paused under the current IAN decision.
      </div>

      <section className="rounded-xl border border-red-500/50 bg-red-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-300" aria-hidden />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-300">Critical</p>
            <h2 className="text-lg font-semibold text-white">Document-control conflict</h2>
            <p className="mt-1 text-sm text-slate-200">
              The founder CIS v2.0 retires legacy authority, but the CEO/CTO audit still permits legacy-derived engineering.
            </p>
            <p className="mt-3 text-sm text-slate-200">
              <span className="font-medium text-white">Required action:</span> Founder and CTO reconcile the source register before
              interface freeze.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search sources" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className={`${selectTriggerClass} sm:w-48`} aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["Adopted", "Under review", "Superseded", "Conflict"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              {["Source ID", "Version", "Owner", "Adoption Date", "Superseded Files", "Permitted Recipients", "Status"].map((h) => (
                <TableHead key={h} className="text-slate-400">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((s) => (
              <TableRow key={s.id} className="border-slate-800 hover:bg-slate-800/40">
                <TableCell className="min-w-48 font-medium text-white">{s.id}</TableCell>
                <TableCell className="text-slate-300">{s.version}</TableCell>
                <TableCell className="text-slate-300">{s.owner}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-300">{s.adoptionDate}</TableCell>
                <TableCell className="text-slate-300">{s.supersededFiles}</TableCell>
                <TableCell className="text-slate-300">{s.recipients}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                  No sources match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ModuleShell>
  )
}
