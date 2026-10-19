"use client"

import { useMemo, useState } from "react"
import { Check, Pencil, Plus } from "lucide-react"
import { ModuleShell, SearchInput, StatusBadge, selectTriggerClass } from "@/components/ci/shared"
import { DECISIONS, DECISION_STATUSES, type Decision, type DecisionStatus } from "@/lib/capital-intelligence/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const EMPTY: Decision = { id: "", decision: "", owner: "", date: "", scope: "", status: "Pending" }

export default function DecisionsPage() {
  const [rows, setRows] = useState<Decision[]>(DECISIONS)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [draft, setDraft] = useState<Decision | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q || [r.decision, r.owner, r.scope].some((v) => v.toLowerCase().includes(q))),
    )
  }, [rows, query, filter])

  const save = () => {
    if (!draft || !draft.decision.trim()) return
    setRows((prev) =>
      draft.id
        ? prev.map((r) => (r.id === draft.id ? draft : r))
        : [...prev, { ...draft, id: `d${Date.now()}` }],
    )
    setDraft(null)
  }

  const markComplete = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Complete" } : r)))

  return (
    <ModuleShell
      title="Decisions Log"
      description="Track the decisions that gate the beta. Changes are kept in this session only."
      actions={
        <Button onClick={() => setDraft(EMPTY)}>
          <Plus className="size-4" aria-hidden /> Add decision
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search decisions" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className={`${selectTriggerClass} sm:w-48`} aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DECISION_STATUSES.map((s) => (
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
              {["Decision", "Owner", "Date", "Scope", "Status", ""].map((h) => (
                <TableHead key={h} className="text-slate-400">
                  {h || <span className="sr-only">Actions</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id} className="border-slate-800 hover:bg-slate-800/40">
                <TableCell className="min-w-56 font-medium text-white">{r.decision}</TableCell>
                <TableCell className="text-slate-300">{r.owner}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-300">{r.date}</TableCell>
                <TableCell className="text-slate-300">{r.scope}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDraft(r)} aria-label={`Edit ${r.decision}`}>
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  {r.status !== "Complete" && (
                    <Button variant="ghost" size="sm" onClick={() => markComplete(r.id)} aria-label={`Mark ${r.decision} complete`}>
                      <Check className="size-4" aria-hidden />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                  No decisions match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="border-slate-700 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit decision" : "Add decision"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="decision">Decision</Label>
                <Input id="decision" value={draft.decision} onChange={(e) => setDraft({ ...draft, decision: e.target.value })} className="border-slate-700 bg-slate-950" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input id="owner" value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Input id="scope" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} className="border-slate-700 bg-slate-950" />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as DecisionStatus })}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECISION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!draft?.decision.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
