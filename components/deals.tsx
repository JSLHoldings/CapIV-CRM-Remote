"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight, Plus, MapPin, DollarSign, Calendar, Building, TrendingUp,
  Users, Heart, Bookmark, Eye, BarChart3, CheckCircle2, XCircle,
  AlertCircle, Loader2, RefreshCw, FileText, Clock, Shield, Upload
} from "lucide-react"
import { SearchFilters, type FilterOptions } from "@/components/search-filters"
import { DealUploadDialog, type ExtractedDealFields } from "@/components/deal-upload-dialog"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
import { FlagTagManager } from "@/components/flag-tag-manager"
import { suggestFlagsForDeal, FLAG_CATALOG, flagBadgeClass, getFlag } from "@/lib/flags-tags"

// ── Types ──────────────────────────────────────────────────────────────────────

interface OSPipelineStage {
  stage: string
  status: "pass" | "fail" | "warn"
  note: string
}

interface OSPipelineResult {
  outcome: "clear" | "flagged" | "blocked"
  stages: OSPipelineStage[]
  runAt: string
}

interface Deal {
  id: string
  user_id?: string
  title: string
  location: string
  assetType: string
  dealSize: string
  status: "Active" | "Pending" | "Closed" | "Under Review"
  sponsor: string
  targetReturn: string
  holdPeriod: string
  description: string
  dateAdded: string
  investmentType: "Equity" | "Debt" | "Hybrid"
  riskProfile: "Core" | "Core-Plus" | "Value-Add" | "Opportunistic"
  views: number
  likes: number
  isLiked?: boolean
  isBookmarked?: boolean
  progress: number
  investors: number
  minimumInvestment: string
  currentRaise: string
  maxRaise: string
  keyMetrics: { capRate: string; noi: string; occupancy: string; yearBuilt: string }
  timeline: Array<{ date: string; milestone: string; status: "completed" | "pending" | "upcoming" }>
  osPipelineResult?: OSPipelineResult
  flags: string[]
  tags: string[]
}

// ── OS Execution Pipeline ──────────────────────────────────────────────────────
// Implements the 7-stage JSL Tech OS pipeline: Identity → Permissions → Intelligence
// → Compliance → Execution → Distribution → Audit Log

function runOSPipeline(deal: Omit<Deal, "id">): OSPipelineResult {
  const stages: OSPipelineStage[] = []

  // 1. Identity Layer — sponsor name present and non-empty
  const identityPass = deal.sponsor.trim().length > 0
  stages.push({
    stage: "Identity",
    status: identityPass ? "pass" : "fail",
    note: identityPass ? "Sponsor identity confirmed" : "Sponsor name missing — identity check failed",
  })

  // 2. Permissions Layer — investment type permitted
  const permittedTypes = ["Equity", "Debt", "Hybrid"]
  const permissionsPass = permittedTypes.includes(deal.investmentType)
  stages.push({
    stage: "Permissions",
    status: permissionsPass ? "pass" : "fail",
    note: permissionsPass
      ? `Investment type '${deal.investmentType}' is within permitted mandate`
      : `Investment type '${deal.investmentType}' not in permitted set`,
  })

  // 3. Intelligence — risk profiling
  const highRisk = deal.riskProfile === "Opportunistic"
  stages.push({
    stage: "Intelligence",
    status: highRisk ? "warn" : "pass",
    note: highRisk
      ? "Opportunistic risk profile detected — elevated IQ scrutiny required"
      : `Risk profile '${deal.riskProfile}' within standard IQ thresholds`,
  })

  // 4. Compliance — deal size parseable and > $0
  const sizeNum = parseFloat(deal.dealSize.replace(/[$M,B]/gi, "")) || 0
  const compliancePass = sizeNum > 0
  stages.push({
    stage: "Compliance",
    status: compliancePass ? "pass" : "fail",
    note: compliancePass
      ? `Deal size ${deal.dealSize} cleared compliance threshold`
      : "Deal size could not be validated — compliance check failed",
  })

  // 5. Execution — target return populated
  const execPass = deal.targetReturn.trim().length > 0
  stages.push({
    stage: "Execution",
    status: execPass ? "pass" : "warn",
    note: execPass ? `Target return ${deal.targetReturn} logged` : "Target return not specified — execution parameters incomplete",
  })

  // 6. Distribution — hold period set
  const distPass = deal.holdPeriod.trim().length > 0
  stages.push({
    stage: "Distribution",
    status: distPass ? "pass" : "warn",
    note: distPass ? `Hold period ${deal.holdPeriod} confirmed` : "Hold period not set — distribution timeline unclear",
  })

  // 7. Audit Log — always generated
  stages.push({
    stage: "Audit Log",
    status: "pass",
    note: `Pipeline executed at ${new Date().toISOString()} — all stages recorded`,
  })

  const failures = stages.filter((s) => s.status === "fail").length
  const warnings = stages.filter((s) => s.status === "warn").length
  const outcome: OSPipelineResult["outcome"] =
    failures > 0 ? "blocked" : warnings > 0 ? "flagged" : "clear"

  return { outcome, stages, runAt: new Date().toISOString() }
}

// ── DB helpers ─────────────────────────────────────────────────────────────────

function dbRowToDeal(row: Record<string, unknown>): Deal {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    location: row.location as string,
    assetType: row.asset_type as string,
    dealSize: row.deal_size as string,
    status: row.status as Deal["status"],
    sponsor: row.sponsor as string,
    targetReturn: (row.target_return as string) ?? "",
    holdPeriod: (row.hold_period as string) ?? "",
    description: (row.description as string) ?? "",
    dateAdded: (row.date_added as string).split("T")[0],
    investmentType: (row.investment_type as Deal["investmentType"]) ?? "Equity",
    riskProfile: (row.risk_profile as Deal["riskProfile"]) ?? "Value-Add",
    views: (row.views as number) ?? 0,
    likes: (row.likes as number) ?? 0,
    progress: (row.progress as number) ?? 0,
    investors: (row.investors as number) ?? 0,
    minimumInvestment: (row.minimum_investment as string) ?? "$0",
    currentRaise: (row.current_raise as string) ?? "$0",
    maxRaise: (row.max_raise as string) ?? "$0",
    keyMetrics: (row.key_metrics as Deal["keyMetrics"]) ?? { capRate: "—", noi: "—", occupancy: "—", yearBuilt: "—" },
    timeline: (row.timeline as Deal["timeline"]) ?? [],
    osPipelineResult: row.os_pipeline_result as OSPipelineResult | undefined,
    flags: (row.flags as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Deals() {
  const supabase = createClient()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pipelineResult, setPipelineResult] = useState<OSPipelineResult | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    status: [], assetType: [], location: [],
    riskProfile: [], investmentSize: { min: "", max: "" }, role: [],
  })
  const [sortBy, setSortBy] = useState("date")
  const [flagFilter, setFlagFilter] = useState<string[]>([])

  // New deal form state
  const [form, setForm] = useState({
    title: "", sponsor: "", location: "", assetType: "Multifamily",
    dealSize: "", investmentType: "Equity" as Deal["investmentType"],
    riskProfile: "Value-Add" as Deal["riskProfile"], targetReturn: "",
    holdPeriod: "", description: "", minimumInvestment: "", maxRaise: "",
  })

  // ── Load from Supabase ──
  const loadDeals = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("date_added", { ascending: false })

    if (error) {
      console.error("[v0] Deals load error:", error.message)
    } else {
      const mapped = (data ?? []).map(dbRowToDeal)
      setDeals(mapped)
      setFilteredDeals(mapped)
    }
    setIsLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadDeals() }, [loadDeals])

  // ── Filter + Sort ──
  useEffect(() => {
    let filtered = deals.filter((deal) => {
      const matchesSearch =
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sponsor.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filters.status?.length || filters.status.includes(deal.status)
      const matchesAssetType = !filters.assetType?.length || filters.assetType.includes(deal.assetType)
      const matchesLocation =
        !filters.location?.length ||
        filters.location.some((loc) => deal.location.toLowerCase().includes(loc.toLowerCase()))
      const matchesRisk = !filters.riskProfile?.length || filters.riskProfile.includes(deal.riskProfile)
      const dealSizeNum = parseFloat(deal.dealSize.replace(/[$M,B]/gi, "")) || 0
      const minSize = filters.investmentSize?.min ? parseFloat(filters.investmentSize.min) : 0
      const maxSize = filters.investmentSize?.max ? parseFloat(filters.investmentSize.max) : Infinity
      const matchesSize = dealSizeNum >= minSize && dealSizeNum <= maxSize
      const matchesFlags = flagFilter.length === 0 || flagFilter.every((f) => deal.flags.includes(f))
      return matchesSearch && matchesStatus && matchesAssetType && matchesLocation && matchesRisk && matchesSize && matchesFlags
    })
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.title.localeCompare(b.title)
        case "name-desc": return b.title.localeCompare(a.title)
        case "size": return parseFloat(b.dealSize.replace(/[$M,B]/gi, "")) - parseFloat(a.dealSize.replace(/[$M,B]/gi, ""))
        case "return": return parseFloat(b.targetReturn.split("-")[0]) - parseFloat(a.targetReturn.split("-")[0])
        default: return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      }
    })
    setFilteredDeals(filtered)
  }, [deals, searchTerm, filters, sortBy, flagFilter])

  // ── Increment view count ──
  const handleViewDeal = useCallback(async (deal: Deal) => {
    setSelectedDeal(deal)
    const newViews = deal.views + 1
    setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, views: newViews } : d))
    await supabase.from("deals").update({ views: newViews }).eq("id", deal.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Like ──
  const handleLikeDeal = useCallback(async (dealId: string) => {
    setDeals((prev) => prev.map((d) => {
      if (d.id !== dealId) return d
      const liked = !d.isLiked
      supabase.from("deals").update({ likes: liked ? d.likes + 1 : d.likes - 1 }).eq("id", dealId)
      return { ...d, isLiked: liked, likes: liked ? d.likes + 1 : d.likes - 1 }
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clear all search filters ──
  const handleClearFilters = useCallback(() => {
    setSearchTerm("")
    setFilters({ status: [], assetType: [], location: [], riskProfile: [], investmentSize: { min: "", max: "" }, role: [] })
    setSortBy("date")
  }, [])

  // ── Bookmark (local only) ──
  const handleBookmarkDeal = useCallback((dealId: string) => {
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, isBookmarked: !d.isBookmarked } : d))
  }, [])

  // ── Populate form from AI-extracted fields then open Add Deal dialog ──
  const handlePopulateFromUpload = useCallback((fields: ExtractedDealFields) => {
    setForm({
      title: fields.title,
      sponsor: fields.sponsor,
      location: fields.location,
      assetType: fields.assetType === "Other" ? "Multifamily" : fields.assetType,
      dealSize: fields.dealSize,
      investmentType: fields.investmentType,
      riskProfile: fields.riskProfile,
      targetReturn: fields.targetReturn === "—" ? "" : fields.targetReturn,
      holdPeriod: fields.holdPeriod === "—" ? "" : fields.holdPeriod,
      description: fields.description,
      minimumInvestment: fields.minimumInvestment === "—" ? "" : fields.minimumInvestment,
      maxRaise: fields.maxRaise === "—" ? "" : fields.maxRaise,
    })
    setPipelineResult(null)
    setIsAddDialogOpen(true)
  }, [])

  // ── Submit new deal: run OS pipeline then persist ──
  const handleAddDeal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.sponsor || !form.location || !form.dealSize) return
    setIsSaving(true)

    const draftDeal: Omit<Deal, "id"> = {
      ...form, views: 0, likes: 0, progress: 0, investors: 0, currentRaise: "$0",
      keyMetrics: { capRate: "—", noi: "—", occupancy: "—", yearBuilt: "—" }, timeline: [],
      status: "Active", dateAdded: new Date().toISOString().split("T")[0], flags: [], tags: [],
    }
    const pipeline = runOSPipeline(draftDeal)
    setPipelineResult(pipeline)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return }

    const { data, error } = await supabase.from("deals").insert({
      user_id: user.id,
      title: form.title,
      sponsor: form.sponsor,
      location: form.location,
      asset_type: form.assetType,
      deal_size: form.dealSize,
      investment_type: form.investmentType,
      risk_profile: form.riskProfile,
      target_return: form.targetReturn,
      hold_period: form.holdPeriod,
      description: form.description,
      minimum_investment: form.minimumInvestment,
      max_raise: form.maxRaise,
      status: pipeline.outcome === "blocked" ? "Under Review" : "Active",
      os_pipeline_result: pipeline,
      // Seed auto-suggested flags from the OS pipeline outcome.
      flags: suggestFlagsForDeal({ osOutcome: pipeline.outcome, status: pipeline.outcome === "blocked" ? "Under Review" : "Active" }),
      tags: [],
    }).select().single()

    setIsSaving(false)
    if (error) { console.error("[v0] Deal insert error:", error.message); return }
    if (data) {
      const newDeal = dbRowToDeal(data)
      setDeals((prev) => [newDeal, ...prev])
      void logActivity({ action: "Submitted new deal", category: "deals",
        metadata: { deal_title: form.title, pipeline_outcome: pipeline.outcome } })
    }
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist flags/tags for a deal ──
  const handleUpdateFlagsTags = useCallback(
    async (dealId: string, next: { flags: string[]; tags: string[] }) => {
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...next } : d)))
      setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, ...next } : prev))
      const { error } = await supabase.from("deals").update({ flags: next.flags, tags: next.tags }).eq("id", dealId)
      if (error) console.error("[v0] Flags/tags update error:", error.message)
      else void logActivity({ action: "Updated deal flags/tags", category: "deals", metadata: { deal_id: dealId, flags: next.flags, tags: next.tags } })
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ── Color helpers ──
  const getStatusColor = (status: Deal["status"]) => {
    switch (status) {
      case "Active": return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
      case "Pending": return "bg-amber-500/10 text-amber-300 border border-amber-500/30"
      case "Under Review": return "bg-blue-500/10 text-blue-300 border border-blue-500/30"
      case "Closed": return "bg-slate-700 text-slate-400"
      default: return "bg-slate-700 text-slate-400"
    }
  }
  const getRiskColor = (risk: Deal["riskProfile"]) => {
    switch (risk) {
      case "Core": return "bg-blue-500/10 text-blue-300"
      case "Core-Plus": return "bg-emerald-500/10 text-emerald-300"
      case "Value-Add": return "bg-amber-500/10 text-amber-300"
      case "Opportunistic": return "bg-rose-500/10 text-rose-300"
      default: return "bg-slate-700 text-slate-400"
    }
  }
  const getPipelineColor = (outcome: OSPipelineResult["outcome"]) => {
    switch (outcome) {
      case "clear": return "text-emerald-300"
      case "flagged": return "text-amber-300"
      case "blocked": return "text-rose-400"
    }
  }
  const getStageIcon = (status: OSPipelineStage["status"]) => {
    if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
    if (status === "warn") return <AlertCircle className="h-4 w-4 text-amber-300 flex-shrink-0" />
    return <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-blue-400/70 mb-1">Deal Source</p>
          <h1 className="text-2xl font-semibold text-white">Investment Opportunities</h1>
          <p className="text-slate-400 text-sm mt-1">
            All deals pass through the JSL Tech OS execution pipeline before activation.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" onClick={loadDeals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-200 hover:border-blue-500/60 hover:text-blue-300"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import from Document
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => { setPipelineResult(null); setIsAddDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Deals", value: deals.length, icon: BarChart3, color: "text-blue-300" },
          { label: "Active", value: deals.filter((d) => d.status === "Active").length, icon: TrendingUp, color: "text-emerald-300" },
          { label: "Under Review", value: deals.filter((d) => d.status === "Under Review").length, icon: AlertCircle, color: "text-amber-300" },
          { label: "Pipeline Blocked", value: deals.filter((d) => d.osPipelineResult?.outcome === "blocked").length, icon: Shield, color: "text-rose-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-slate-900/80 border border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <Icon className={`h-7 w-7 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredDeals.length}
        onClearFilters={handleClearFilters}
      />

      {/* Flag filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 mr-1">Filter by flag:</span>
        {FLAG_CATALOG.map((f) => {
          const active = flagFilter.includes(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFlagFilter((prev) => (active ? prev.filter((x) => x !== f.id) : [...prev, f.id]))}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] transition-all ${
                active ? flagBadgeClass(f.id) : "border border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {getFlag(f.id)?.label}
            </button>
          )
        })}
        {flagFilter.length > 0 && (
          <button type="button" onClick={() => setFlagFilter([])} className="text-[11px] text-slate-400 underline hover:text-white">
            Clear
          </button>
        )}
      </div>

      {/* Deal Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading deals...</span>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No deals found. Add your first deal to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <Card
              key={deal.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
              onClick={() => handleViewDeal(deal)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-white leading-tight">{deal.title}</CardTitle>
                  <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />{deal.location}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OS Pipeline badge */}
                {deal.osPipelineResult && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${getPipelineColor(deal.osPipelineResult.outcome)}`}>
                    <Shield className="h-3 w-3" />
                    OS Pipeline: {deal.osPipelineResult.outcome.charAt(0).toUpperCase() + deal.osPipelineResult.outcome.slice(1)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-400">Sponsor</p><p className="text-white font-medium truncate">{deal.sponsor}</p></div>
                  <div><p className="text-slate-400">Deal Size</p><p className="text-white font-medium">{deal.dealSize}</p></div>
                  <div><p className="text-slate-400">Target Return</p><p className="text-emerald-300 font-medium">{deal.targetReturn || "—"}</p></div>
                  <div><p className="text-slate-400">Asset Type</p><p className="text-white font-medium">{deal.assetType}</p></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge className={getRiskColor(deal.riskProfile)}>{deal.riskProfile}</Badge>
                  <Badge className="bg-slate-800 text-slate-300">{deal.investmentType}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Raise Progress</span>
                    <span>{deal.progress}%</span>
                  </div>
                  <Progress value={deal.progress} className="h-1.5 bg-slate-800" />
                </div>
                {/* Flags & tags — editing is isolated from the card's open-detail click */}
                <div onClick={(e) => e.stopPropagation()} className="pt-1 border-t border-slate-800">
                  <FlagTagManager
                    flags={deal.flags}
                    tags={deal.tags}
                    suggestions={suggestFlagsForDeal({ osOutcome: deal.osPipelineResult?.outcome, status: deal.status })}
                    onChange={(next) => handleUpdateFlagsTags(deal.id, next)}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleLikeDeal(deal.id) }}>
                      <Heart className={`h-3.5 w-3.5 ${deal.isLiked ? "fill-rose-400 text-rose-400" : ""}`} />{deal.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleBookmarkDeal(deal.id) }}>
                      <Bookmark className={`h-3.5 w-3.5 ${deal.isBookmarked ? "fill-blue-400 text-blue-400" : ""}`} />
                    </button>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{deal.views}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{deal.investors}</span>
                  </div>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{deal.dateAdded}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white">Deal Detail</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-6">
              <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDeal.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{selectedDeal.sponsor} · {selectedDeal.location}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(selectedDeal.status)}>{selectedDeal.status}</Badge>
                  <span className="text-xl font-bold text-emerald-300">{selectedDeal.dealSize}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Target Return", value: selectedDeal.targetReturn || "—", icon: TrendingUp },
                  { label: "Hold Period", value: selectedDeal.holdPeriod || "—", icon: Clock },
                  { label: "Min. Investment", value: selectedDeal.minimumInvestment || "—", icon: DollarSign },
                  { label: "Investors", value: String(selectedDeal.investors), icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="bg-slate-900/50 border border-slate-800">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-3.5 w-3.5 text-blue-300" />
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedDeal.description && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{selectedDeal.description}</p>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(selectedDeal.keyMetrics).map(([key, val]) => (
                  <Card key={key} className="bg-slate-900/50 border border-slate-800">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-white">{val}</p>
                      <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* OS Pipeline Result */}
              {selectedDeal.osPipelineResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-slate-400">OS Execution Pipeline</p>
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${getPipelineColor(selectedDeal.osPipelineResult.outcome)}`}>
                      <Shield className="h-4 w-4" />
                      {selectedDeal.osPipelineResult.outcome.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedDeal.osPipelineResult.stages.map((stage) => (
                      <div key={stage.stage} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        {getStageIcon(stage.status)}
                        <div>
                          <p className="text-xs font-semibold text-white">{stage.stage}</p>
                          <p className="text-xs text-slate-400">{stage.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedDeal.timeline.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Timeline</p>
                  <div className="space-y-2">
                    {selectedDeal.timeline.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          t.status === "completed" ? "bg-emerald-400" :
                          t.status === "pending" ? "bg-amber-400" : "bg-slate-600"}`} />
                        <p className="text-xs text-slate-300">{t.date}</p>
                        <p className="text-xs text-white">{t.milestone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import from Document Dialog */}
      <DealUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onPopulateForm={handlePopulateFromUpload}
      />

      {/* Add Deal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              Add New Deal
              {form.title && (
                <span className="inline-flex items-center gap-1 text-xs font-normal bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full px-2 py-0.5">
                  <Upload className="h-3 w-3" />
                  Pre-populated from document
                </span>
              )}
            </DialogTitle>
            <p className="text-sm text-slate-400">Deal will be run through the JSL Tech OS execution pipeline on submission.</p>
          </DialogHeader>
          <form onSubmit={handleAddDeal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-slate-300">Deal Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Downtown Mixed-Use Development"
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Sponsor *</Label>
                <Input value={form.sponsor} onChange={(e) => setForm((f) => ({ ...f, sponsor: e.target.value }))}
                  placeholder="Sponsor name" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Location *</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Los Angeles, CA" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Deal Size *</Label>
                <Input value={form.dealSize} onChange={(e) => setForm((f) => ({ ...f, dealSize: e.target.value }))}
                  placeholder="e.g. $45M" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Asset Type</Label>
                <Select value={form.assetType} onValueChange={(v) => setForm((f) => ({ ...f, assetType: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Multifamily","Industrial","Office","Retail","Mixed-Use","Student Housing","Hotel","Self-Storage","Medical"].map((t) => (
                      <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Investment Type</Label>
                <Select value={form.investmentType} onValueChange={(v) => setForm((f) => ({ ...f, investmentType: v as Deal["investmentType"] }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Equity","Debt","Hybrid"].map((t) => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Risk Profile</Label>
                <Select value={form.riskProfile} onValueChange={(v) => setForm((f) => ({ ...f, riskProfile: v as Deal["riskProfile"] }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Core","Core-Plus","Value-Add","Opportunistic"].map((t) => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Target Return</Label>
                <Input value={form.targetReturn} onChange={(e) => setForm((f) => ({ ...f, targetReturn: e.target.value }))}
                  placeholder="e.g. 15-20%" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Hold Period</Label>
                <Input value={form.holdPeriod} onChange={(e) => setForm((f) => ({ ...f, holdPeriod: e.target.value }))}
                  placeholder="e.g. 5-7 years" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Min. Investment</Label>
                <Input value={form.minimumInvestment} onChange={(e) => setForm((f) => ({ ...f, minimumInvestment: e.target.value }))}
                  placeholder="e.g. $100,000" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Max Raise</Label>
                <Input value={form.maxRaise} onChange={(e) => setForm((f) => ({ ...f, maxRaise: e.target.value }))}
                  placeholder="e.g. $45M" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Deal summary..." rows={3}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 resize-none" />
              </div>
            </div>

            {/* Pipeline preview (shown after first submit attempt or re-submission) */}
            {pipelineResult && (
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-2">
                <p className={`text-sm font-bold flex items-center gap-2 ${getPipelineColor(pipelineResult.outcome)}`}>
                  <Shield className="h-4 w-4" />
                  Pipeline Result: {pipelineResult.outcome.toUpperCase()}
                </p>
                {pipelineResult.stages.map((s) => (
                  <div key={s.stage} className="flex items-start gap-2">
                    {getStageIcon(s.status)}
                    <p className="text-xs text-slate-300"><span className="font-medium text-white">{s.stage}:</span> {s.note}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="border-slate-700 text-slate-300"
                onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Pipeline...</> : "Submit Deal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
