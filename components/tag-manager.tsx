"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TAG_PRESETS, normalizeTag } from "@/lib/tags"
import { Tag as TagIcon, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Read-only strip of tags (used on cards) ──────────────────────────────────
export function TagBadges({
  tags, className,
}: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.map((t) => (
        <Badge key={t} className="text-[10px] bg-slate-700/50 text-slate-200 border border-slate-600">
          <TagIcon className="h-2.5 w-2.5 mr-1" />
          {t}
        </Badge>
      ))}
    </div>
  )
}

interface TagManagerProps {
  tags: string[]
  onChange: (tags: string[]) => void
  className?: string
}

// ── Free-form tag editor with presets ────────────────────────────────────────
export function TagManager({ tags, onChange, className }: TagManagerProps) {
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const add = (raw: string) => {
    const t = normalizeTag(raw)
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return
    onChange([...tags, t])
    setTagInput("")
  }
  const remove = (t: string) => onChange(tags.filter((x) => x !== t))

  const availablePresets = TAG_PRESETS.filter((p) => !tags.some((t) => t.toLowerCase() === p.toLowerCase()))

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <TagBadges tags={tags} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px] border-slate-600 text-slate-300 hover:border-blue-400 hover:text-white"
          >
            <TagIcon className="h-3 w-3 mr-1" />
            Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 bg-slate-900 border border-slate-700 text-slate-100 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Tags</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-slate-700/60 border border-slate-600 px-2 py-0.5 text-[10px] text-slate-200">
                  {t}
                  <button type="button" onClick={() => remove(t)} className="ml-1 text-slate-400 hover:text-white" aria-label={`Remove tag ${t}`}>
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
                  add(tagInput)
                }
              }}
              placeholder="Add a tag…"
              className="h-7 text-xs bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white" onClick={() => add(tagInput)} disabled={!normalizeTag(tagInput)}>
              Add
            </Button>
          </div>
          {availablePresets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {availablePresets.slice(0, 10).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => add(p)}
                  className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:border-blue-400 hover:text-white transition-colors"
                >
                  <Plus className="h-2.5 w-2.5 mr-1" />
                  {p}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
