"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { ModuleShell, Note, Panel, SearchInput, StatusBadge, selectTriggerClass } from "@/components/ci/shared"
import {
  HYPOTHESES,
  HYPOTHESIS_STATUSES,
  INTERVIEWS,
  INTERVIEW_GROUPS,
  WTP_OPTIONS,
  type HypothesisStatus,
  type Interview,
  type InterviewGroup,
  type WillingnessToPay,
} from "@/lib/capital-intelligence/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const EMPTY: Interview = { id: "", name: "", organization: "", group: "Opportunity-side", date: "", findings: "", wtp: "Unknown" }

export default function DiscoveryPage() {
  const [log, setLog] = useState<Interview[]>(INTERVIEWS)
  const [query, setQuery] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [draft, setDraft] = useState<Interview | null>(null)
  const [hypotheses, setHypotheses] = useState<Record<string, { status: HypothesisStatus; notes: string }>>(
    () => Object.fromEntries(HYPOTHESES.map((h) => [h.id, { status: "Untested" as HypothesisStatus, notes: "" }])),
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return log.filter(
      (i) =>
        (groupFilter === "all" || i.group === groupFilter) &&
        (!q || [i.name, i.organization, i.findings].some((v) => v.toLowerCase().includes(q))),
    )
  }, [log, query, groupFilter])

  const save = () => {
    if (!draft || !draft.name.trim()) return
    setLog((prev) => [...prev, { ...draft, id: `i${Date.now()}` }])
    setDraft(null)
  }

  return (
    <ModuleShell
      title="Market Discovery Tracker"
      description="Interview progress, findings and the hypotheses they test. Entries marked sample can be deleted."
      actions={
        <Button onClick={() => setDraft(EMPTY)}>
          <Plus className="size-4" aria-hidden /> Log interview
        </Button>
      }
    >
      <Note>Learning targets, not a representative sample. No market-share claims.</Note>

      <div className="grid gap-4 md:grid-cols-3">
        {INTERVIEW_GROUPS.map((g) => {
          const count = log.filter((i) => i.group === g.name).length
          return (
            <Panel key={g.name}>
              <h2 className="text-sm font-semibold text-white">{g.name}</h2>
              <p className="mt-1 text-2xl font-semibold text-white">
                {count} <span className="text-sm font-normal text-slate-400">of {g.target}</span>
              </p>
              <Progress value={Math.min(100, (count / g.max) * 100)} className="mt-3" aria-label={`${g.name} interview progress`} />
            </Panel>
          )
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Interview log</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search interviews" />
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className={`${selectTriggerClass} sm:w-64`} aria-label="Filter by group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {INTERVIEW_GROUPS.map((g) => (
                <SelectItem key={g.name} value={g.name}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                {["Name", "Organization", "Group", "Date", "Key findings", "Willingness to pay", ""].map((h) => (
                  <TableHead key={h} className="text-slate-400">
                    {h || <span className="sr-only">Actions</span>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((i) => (
                <TableRow key={i.id} className="border-slate-800 hover:bg-slate-800/40">
                  <TableCell className="font-medium text-white">{i.name}</TableCell>
                  <TableCell className="min-w-44 text-slate-300">{i.organization}</TableCell>
                  <TableCell className="text-slate-300">{i.group}</TableCell>
                  <TableCell className="whitespace-nowrap text-slate-300">{i.date}</TableCell>
                  <TableCell className="min-w-64 text-slate-300">{i.findings}</TableCell>
                  <TableCell>
                    <StatusBadge status={i.wtp} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setLog((p) => p.filter((x) => x.id !== i.id))} aria-label={`Delete ${i.name}`}>
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                    No interviews match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Hypotheses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {HYPOTHESES.map((h) => (
            <Panel key={h.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">{h.text}</h3>
                <Select
                  value={hypotheses[h.id].status}
                  onValueChange={(v) => setHypotheses((s) => ({ ...s, [h.id]: { ...s[h.id], status: v as HypothesisStatus } }))}
                >
                  <SelectTrigger className={`${selectTriggerClass} h-8 w-40`} aria-label={`Status for ${h.text}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HYPOTHESIS_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={hypotheses[h.id].notes}
                onChange={(e) => setHypotheses((s) => ({ ...s, [h.id]: { ...s[h.id], notes: e.target.value } }))}
                placeholder="Evidence notes"
                aria-label={`Evidence notes for ${h.text}`}
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </Panel>
          ))}
        </div>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="border-slate-700 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Log interview</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="iname">Name</Label>
                  <Input id="iname" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="iorg">Organization</Label>
                  <Input id="iorg" value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Group</Label>
                  <Select value={draft.group} onValueChange={(v) => setDraft({ ...draft, group: v as InterviewGroup })}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_GROUPS.map((g) => (
                        <SelectItem key={g.name} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="idate">Date</Label>
                  <Input id="idate" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ifind">Key findings</Label>
                <Textarea id="ifind" value={draft.findings} onChange={(e) => setDraft({ ...draft, findings: e.target.value })} className="border-slate-700 bg-slate-950" />
              </div>
              <div className="grid gap-2">
                <Label>Willingness to pay</Label>
                <Select value={draft.wtp} onValueChange={(v) => setDraft({ ...draft, wtp: v as WillingnessToPay })}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WTP_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!draft?.name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
