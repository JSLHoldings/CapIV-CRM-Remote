"use client"

import { useMemo, useState } from "react"
import { ModuleShell, Note, SearchInput, StatusBadge, selectTriggerClass } from "@/components/ci/shared"
import { COMPLIANCE_ROWS } from "@/lib/capital-intelligence/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function CompliancePage() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const statuses = useMemo(() => Array.from(new Set(COMPLIANCE_ROWS.map((r) => r.status))), [])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return COMPLIANCE_ROWS.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q || [r.country, r.activity, r.owner, r.trigger].some((v) => v.toLowerCase().includes(q))),
    )
  }, [query, filter])

  return (
    <ModuleShell
      title="Country and Activity Compliance Register"
      description="Permission status for each country and activity, with the trigger that forces a re-review."
    >
      <Note>Do not infer permission for other countries from a Philippines decision.</Note>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search register" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className={`${selectTriggerClass} sm:w-64`} aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
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
              {["Country", "Activity", "Owner", "Effective Date", "Supporting Advice", "Review Trigger", "Status"].map((h) => (
                <TableHead key={h} className="text-slate-400">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id} className="border-slate-800 hover:bg-slate-800/40">
                <TableCell className="min-w-40 font-medium text-white">{r.country}</TableCell>
                <TableCell className="min-w-48 text-slate-300">{r.activity}</TableCell>
                <TableCell className="text-slate-300">{r.owner}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-300">{r.effectiveDate}</TableCell>
                <TableCell className="text-slate-300">{r.advice}</TableCell>
                <TableCell className="min-w-48 text-slate-300">{r.trigger}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                  No entries match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ModuleShell>
  )
}
