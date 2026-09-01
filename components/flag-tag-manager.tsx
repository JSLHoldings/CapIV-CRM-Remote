"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  FLAG_CATALOG, FLAG_SEVERITY_CLASS, TAG_PRESETS,
  flagBadgeClass, getFlag, normalizeTag, sortFlags,
} from "@/lib/flags-tags"
import { Flag, Tag as TagIcon, X, Plus, Sparkles, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlagTagValue {
  flags: string[]
  tags: string[]
}

interface FlagTagManagerProps extends FlagTagValue {
  /** Flag ids the engine suggests that are not yet applied. */
  suggestions?: string[]
  onChange: (next: FlagTagValue) => void
  className?: string
}

// ── Read-only chip strip: renders applied flags + tags (used on cards) ───────
export function FlagTagChips({
  flags, tags, className, emptyHint,
}: { flags: string[]; tags: string[]; className?: string; emptyHint?: string }) {
  if (flags.length === 0 && tags.length === 0) {
    return emptyHint ? <span className={cn("text-xs text-slate-500", className)}>{emptyHint}</span> : null
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {sortFlags(flags).map((id) => {
        const def = getFlag(id)
        return (
          <Badge key={id} className={cn("text-[10px] font-medium", flagBadgeClass(id))}>
            <Flag className="h-2.5 w-2.5 mr-1" />
            {def?.label ?? id}
          </Badge>
        )
      })}
      {tags.map((t) => (
        <Badge key={t} className="text-[10px] bg-slate-700/50 text-slate-200 border border-slate-600">
          <TagIcon className="h-2.5 w-2.5 mr-1" />
          {t}
        </Badge>
      ))}
    </div>
  )
}

// ── Full editor: popover with curated flags + free-form tags ─────────────────
export function FlagTagManager({ flags, tags, suggestions = [], onChange, className }: FlagTagManagerProps) {
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const toggleFlag = (id: string) => {
    onChange({
      flags: flags.includes(id) ? flags.filter((f) => f !== id) : sortFlags([...flags, id]),
      tags,
    })
  }

  const addTag = (raw: string) => {
    const t = normalizeTag(raw)
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return
    onChange({ flags, tags: [...tags, t] })
    setTagInput("")
  }

  const removeTag = (t: string) => onChange({ flags, tags: tags.filter((x) => x !== t) })

  const openSuggestions = suggestions.filter((s) => !flags.includes(s))
  const availablePresets = TAG_PRESETS.filter((p) => !tags.some((t) => t.toLowerCase() === p.toLowerCase()))

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <FlagTagChips flags={flags} tags={tags} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px] border-slate-600 text-slate-300 hover:border-blue-400 hover:text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Flag / Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 bg-slate-900 border border-slate-700 text-slate-100 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Auto-suggested flags */}
          {openSuggestions.length > 0 && (
            <>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-200">Suggested</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {openSuggestions.map((id) => {
                    const def = getFlag(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFlag(id)}
                        className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] transition-opacity hover:opacity-80", flagBadgeClass(id))}
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

          {/* Curated flag toggles */}
          <div className="p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Flags</p>
            <div className="space-y-1">
              {FLAG_CATALOG.map((f) => {
                const active = flags.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFlag(f.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      active ? "bg-slate-800" : "hover:bg-slate-800/60",
                    )}
                    title={f.description}
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", FLAG_SEVERITY_CLASS[f.severity])} />
                    <span className="flex-1 text-xs text-slate-200">{f.label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Free-form tags */}
          <div className="p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Tags</p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full bg-slate-700/60 border border-slate-600 px-2 py-0.5 text-[10px] text-slate-200">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="ml-1 text-slate-400 hover:text-white" aria-label={`Remove tag ${t}`}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                placeholder="Add a tag…"
                className="h-7 text-xs bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white" onClick={() => addTag(tagInput)} disabled={!normalizeTag(tagInput)}>
                Add
              </Button>
            </div>
            {availablePresets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availablePresets.slice(0, 8).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addTag(p)}
                    className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-blue-400 hover:text-white transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
