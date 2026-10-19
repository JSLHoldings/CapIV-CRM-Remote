"use client"

import { FormEvent, useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { logActivity } from "@/lib/activity"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Search, Plus, TrendingUp, DollarSign, Calendar, MapPin, Download, Upload, Sparkles,
  Layers, ShieldCheck, Hash, Target, Gauge,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { DealUploadDialog, type ExtractedDealFields } from "@/components/deal-upload-dialog"
import { RiskFlagManager } from "@/components/risk-flags"
import { TagManager } from "@/components/tag-manager"
import { detectDealRiskFlags, RISK_CATALOG, riskBadgeClass, getRiskFlag } from "@/lib/risk-flags"
import {
  type Deal,
  DEAL_TYPES, SOURCE_CHANNELS, DATA_CLASSIFICATIONS, TRANSACTION_PURPOSES,
  DEAL_STAGES, REQUEST_TYPES, PARTY_ROLES, LIFECYCLE_STATES,
  dealTypeLabel, dealTypeShort, sourceChannelLabel, dataClassificationLabel,
  transactionPurposeLabel, dealStageLabel, requestTypeLabel, partyRoleLabel,
  lifecycleLabel, lifecycleBadge, classificationBadge,
  generateReferenceCode, evaluateCompletion, TAXONOMY_VERSION,
  type LifecycleState,
} from "@/lib/deal-schema"

interface DealAnalysis {
  score: string
  riskBand: string
  liquidityWindow: string
  aiSummary: string
  underwritingSync: string
  stressNotes: string
}

const initialDeals: Deal[] = [
  {
    id: 1,
    referenceCode: "CAPIV-DL-2026-000481",
    dealTypePrimary: "RE_DIRECT",
    sourceChannel: "broker",
    dataClassification: "restricted",
    taxonomyVersion: TAXONOMY_VERSION,
    name: "Harbor View Apartments",
    summary:
      "198-unit Class B+ value-add opportunity with strong leasing velocity and 320 bps upside through renovation program.",
    transactionPurpose: "acquisition",
    dealStage: "under_contract",
    lifecycleState: "MATCH_READY",
    assetClass: "Multifamily",
    geography: "Austin, TX",
    requestType: "JV",
    capitalNeedTotal: "$15M",
    capitalNeedMinimum: "$250,000",
    currency: "USD",
    useOfProceeds: "Acquisition + $3.2M interior renovation program",
    targetCloseDate: "Q2 2026",
    sponsor: "Harbor Partners",
    sponsorRole: "sponsor",
    targetIrr: "14.2%",
    targetMoic: "1.9x",
    flags: [],
    tags: ["Priority", "Hot Lead", "Sun Belt", "Value-Add", "Q2 Target"],
  },
  {
    id: 2,
    referenceCode: "CAPIV-DL-2026-000482",
    dealTypePrimary: "RE_DIRECT",
    sourceChannel: "direct",
    dataClassification: "restricted",
    taxonomyVersion: TAXONOMY_VERSION,
    name: "Downtown Office Complex",
    summary:
      "Two-tower CBD office reposition. Anchored leases in negotiation with corporate tenants; T-12 occupancy at 84%.",
    transactionPurpose: "recap",
    dealStage: "diligence",
    lifecycleState: "VERIFICATION_IN_REVIEW",
    assetClass: "Office",
    geography: "Dallas, TX",
    requestType: "equity",
    capitalNeedTotal: "$32M",
    capitalNeedMinimum: "$500,000",
    currency: "USD",
    useOfProceeds: "Recapitalization + TI/LC reserve",
    targetCloseDate: "Q3 2026",
    sponsor: "Sterling Capital",
    sponsorRole: "sponsor",
    targetIrr: "12.8%",
    targetMoic: "1.7x",
    flags: ["needs_review"],
    tags: ["Watchlist", "CBD Office", "Reposition"],
  },
  {
    id: 3,
    referenceCode: "CAPIV-DL-2026-000483",
    dealTypePrimary: "RE_DIRECT",
    sourceChannel: "partner",
    dataClassification: "internal",
    taxonomyVersion: TAXONOMY_VERSION,
    name: "Retail Shopping Center",
    summary:
      "Stabilized grocery-anchored retail strip with 12-pad expansion potential and signed LOIs for two national tenants.",
    transactionPurpose: "acquisition",
    dealStage: "closing",
    lifecycleState: "EXECUTION_HANDOFF",
    assetClass: "Retail",
    geography: "Houston, TX",
    requestType: "equity",
    capitalNeedTotal: "$8.5M",
    capitalNeedMinimum: "$100,000",
    currency: "USD",
    useOfProceeds: "Acquisition + pad development",
    targetCloseDate: "Q1 2026",
    sponsor: "Oakwood Holdings",
    sponsorRole: "sponsor",
    targetIrr: "16.1%",
    targetMoic: "2.1x",
    flags: [],
    tags: ["Verified", "Grocery-Anchored", "Stabilized"],
  },
]

const generatePreAnalysis = (deal: Deal): DealAnalysis => {
  const phase = LIFECYCLE_STATES.includes(deal.lifecycleState) ? deal.lifecycleState : "DRAFT"
  const mapping: Partial<Record<LifecycleState, { score: string; riskBand: string }>> = {
    VERIFIED: { score: "88 / 100", riskBand: "Low" },
    EXECUTION_HANDOFF: { score: "90 / 100", riskBand: "Low" },
    INTRODUCTION_APPROVED: { score: "86 / 100", riskBand: "Moderate-Low" },
    INTRODUCTION_ELIGIBLE: { score: "84 / 100", riskBand: "Moderate-Low" },
    MATCH_READY: { score: "82 / 100", riskBand: "Moderate-Low" },
    VERIFICATION_IN_REVIEW: { score: "78 / 100", riskBand: "Moderate" },
    DILIGENCE: { score: "77 / 100", riskBand: "Moderate" },
    PROVISIONALLY_MATCHABLE: { score: "74 / 100", riskBand: "Elevated" },
  }
  const defaults = mapping[phase] ?? { score: "71 / 100", riskBand: "Elevated" }
  const elevated = defaults.riskBand === "Elevated"

  return {
    score: defaults.score,
    riskBand: defaults.riskBand,
    liquidityWindow: deal.targetCloseDate,
    aiSummary: `AI signal suggests ${deal.assetClass.toLowerCase()} exposure with ${deal.targetIrr || "an undisclosed"} target IRR remains ${
      elevated ? "sensitive to market shifts" : "within mandate tolerances"
    }.`,
    underwritingSync: `/capiv-iq?tab=underwriting&deal=${deal.id}`,
    stressNotes: elevated
      ? "Recommend enhanced lease verification and collateral audit prior to commitment."
      : "Scenario tests fall within target covenants; proceed to underwriting when ready.",
  }
}

const escapePdfText = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, " ")

const sanitize = (value: string) =>
  value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim()

const wrapText = (value: string, maxLength = 88) => {
  const clean = sanitize(value || "")
  if (!clean) return []
  const words = clean.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const tentative = `${current}${word} `
    if (tentative.trim().length > maxLength && current) {
      lines.push(current.trim())
      current = `${word} `
    } else {
      current = tentative
    }
  }
  if (current.trim()) {
    lines.push(current.trim())
  }
  return lines
}

const buildDealPdf = (deal: Deal, analysis?: DealAnalysis) => {
  const title = sanitize(deal.name || "JSL Tech Opportunity")
  const subtitleParts = [deal.referenceCode, deal.geography, deal.assetClass, lifecycleLabel(deal.lifecycleState)].filter(Boolean)
  const subtitle = sanitize(subtitleParts.join(" • ") || "Live opportunity inside JSL Tech Command")

  const snapshotLines = [
    `Sponsor: ${deal.sponsor || "TBD"} (${partyRoleLabel(deal.sponsorRole)})`,
    `Deal Type: ${dealTypeLabel(deal.dealTypePrimary)}`,
    `Asset Class: ${deal.assetClass || "Unspecified"}`,
    `Lifecycle State: ${lifecycleLabel(deal.lifecycleState)}`,
    `Capital Request: ${deal.capitalNeedTotal || "Pending"} ${deal.currency} (${requestTypeLabel(deal.requestType)})`,
    `Target IRR / MOIC: ${deal.targetIrr || "In diligence"} / ${deal.targetMoic || "—"}`,
    `Target Close: ${deal.targetCloseDate || "Call to confirm"}`,
  ]

  const propertyHighlights = [
    `Primary Market: ${deal.geography || "To be announced"}`,
    `Transaction Purpose: ${transactionPurposeLabel(deal.transactionPurpose)}`,
    `Deal Stage: ${dealStageLabel(deal.dealStage)}`,
    `Mandate Alignment: ${analysis?.riskBand || "JSL Tech reviewing"}`,
    `Score: ${analysis?.score || "Awaiting full underwriting"}`,
  ]

  const overviewLines = wrapText(
    deal.summary ||
      "Sponsor has not provided a full narrative yet. JSL Tech diligence will populate this section as documents are received.",
  )

  const aiSummaryLines = analysis?.aiSummary
    ? wrapText(analysis.aiSummary)
    : wrapText(
        "AI signals will populate once the underwriting lab confirms comparables and updated rent rolls. Until then, leverage JSL Tech Access for sponsor Q&A to accelerate readiness.",
      )

  const diligenceActions = [
    `Underwriting Link: ${analysis?.underwritingSync || `/capiv-iq?tab=underwriting&deal=${deal.id}`}`,
    "Persona AML + NDA: Required prior to data room unlocks.",
    "Data Room Readiness: JSL Tech Diligence Hub tracks NDAs, PPMS, and compliance packets unified with JSL Tech IQ.",
  ]

  const capitalSignals = [
    "Capital Stack Notes: Confirm leverage assumptions and co-invest windows.",
    "Scenario Planning: Stress-test DSCR, lease-up thresholds, and exit sensitivities inside JSL Tech EQ.",
    "Next Milestone: Schedule sponsor sync for updated financial model delivery.",
  ]

  const disclaimerLines = wrapText(
    "Generated automatically by JSL Tech Command. This report is informational only and not an offer to sell securities. Contact the sponsor or JSL Tech team for authenticated data rooms, NDAs, and regulatory disclosures.",
  )

  const shapes = [
    `q
0.08 0.17 0.34 rg
0 720 612 120 re
f
Q`,
    `q
0.96 0.97 0.99 rg
40 500 532 2 re
f
Q`,
  ]

  const textBlocks: string[] = []
  const leftMargin = 60
  let cursorY = 700
  const headerTopY = 768
  const primaryText = "0.16 0.2 0.32"
  const secondaryText = "0.33 0.37 0.48"

  const addLine = (text: string, options?: { font?: "F1" | "F2"; size?: number; color?: string; gap?: number }) => {
    const font = options?.font ?? "F1"
    const size = options?.size ?? 11
    const color = options?.color ?? primaryText
    const gap = options?.gap ?? (font === "F2" ? 26 : 18)
    const safeText = escapePdfText(text)
    textBlocks.push(`BT
/${font} ${size} Tf
${color} rg
${leftMargin} ${cursorY.toFixed(2)} Td
(${safeText}) Tj
ET`)
    cursorY -= gap
  }

  const addHeading = (text: string, color = "0.28 0.45 0.75") => {
    addLine(text, { font: "F2", size: 13, color })
  }

  const addParagraph = (lines: string[], color = primaryText) => {
    lines.forEach((line) => addLine(line, { color, size: 10 }))
    cursorY -= 8
  }

  const titleLines = wrapText(title, 46).slice(0, 2)
  const subtitleLines = wrapText(subtitle, 72).slice(0, 2)

  titleLines.forEach((line, index) => {
    textBlocks.push(`BT
/F2 22 Tf
1 1 1 rg
${leftMargin} ${(headerTopY - index * 24).toFixed(2)} Td
(${escapePdfText(line)}) Tj
ET`)
  })

  subtitleLines.forEach((line, index) => {
    textBlocks.push(`BT
/F1 12 Tf
0.87 0.92 1 rg
${leftMargin} ${(headerTopY - 52 - index * 16).toFixed(2)} Td
(${escapePdfText(line)}) Tj
ET`)
  })

  if (analysis?.score || analysis?.riskBand) {
    textBlocks.push(`BT
/F1 11 Tf
0.75 0.86 1 rg
${leftMargin} ${(headerTopY - 84).toFixed(2)} Td
(${escapePdfText(`JSL Tech Score ${analysis?.score || "Pending"} • ${analysis?.riskBand || "Risk review in progress"}`)}) Tj
ET`)
  }

  cursorY = 640

  addHeading("Deal Snapshot")
  addParagraph(snapshotLines.map((line) => `- ${line}`))

  addHeading("Property Overview")
  addParagraph(overviewLines, secondaryText)

  addHeading("Strategic Highlights", "0.31 0.54 0.42")
  addParagraph(propertyHighlights.map((line) => `- ${line}`))
  addHeading("Operational Snapshot", "0.3 0.33 0.6")
  addParagraph([
    `Occupancy Signal: ${analysis?.riskBand ? `${analysis.riskBand} mandate fit` : "Pending sponsor docs"}`,
    `Underwriting Contact: ${deal.sponsor || "JSL Tech Sponsor Team"}`,
    "Data Room Status: NDA pending finalization in JSL Tech IQ.",
    "Comparable Set: Pulled from JSL Tech Access AI signals (see underwriting hub).",
  ])

  addHeading("AI Summary", "0.54 0.45 0.19")
  addParagraph(aiSummaryLines, primaryText)

  addHeading("Diligence Actions", "0.24 0.42 0.66")
  addParagraph(diligenceActions)

  addHeading("Capital Signals", "0.5 0.36 0.78")
  addParagraph(capitalSignals)

  addHeading("Disclaimers", "0.58 0.32 0.32")
  addParagraph(disclaimerLines, secondaryText)

  const content = `
${shapes.join("\n")}
${textBlocks.join("\n")}
`

  const objects = [
    `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`,
    `2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
`,
    `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
`,
    `4 0 obj
<< /Length ${content.length} >>
stream
${content}
endstream
endobj
`,
    `5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`,
    `6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += object
  })

  const xrefOffset = pdf.length
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`
  }

  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`

  return pdf
}

export default function DealsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  // client_id -> persistence metadata for deals backed by the sourced_deals table.
  const persistedRef = useRef<Map<number, { rowId: string; owned: boolean }>>(new Map())
  const createEmptyDeal = (): Omit<Deal, "id"> => ({
    referenceCode: generateReferenceCode(),
    dealTypePrimary: "RE_DIRECT",
    sourceChannel: "direct",
    dataClassification: "internal",
    taxonomyVersion: TAXONOMY_VERSION,
    name: "",
    summary: "",
    transactionPurpose: "acquisition",
    dealStage: "sourcing",
    lifecycleState: "DRAFT",
    assetClass: "",
    geography: "",
    requestType: "equity",
    capitalNeedTotal: "",
    capitalNeedMinimum: "",
    currency: "USD",
    useOfProceeds: "",
    targetCloseDate: "",
    sponsor: "",
    sponsorRole: "sponsor",
    targetIrr: "",
    targetMoic: "",
  })
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [prefilledFromUpload, setPrefilledFromUpload] = useState(false)
  const [newDeal, setNewDeal] = useState<Omit<Deal, "id">>(createEmptyDeal())
  const [interestedDeals, setInterestedDeals] = useState<number[]>([])
  const [flagFilter, setFlagFilter] = useState<string[]>([])

  // Load persisted deals (incl. AI-imported ones) and merge with the display seed.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("sourced_deals")
        .select("id, client_id, user_id, data")
        .order("created_at", { ascending: true })
      if (error) {
        console.error("[v0] load sourced deals error:", error.message)
        return
      }
      if (cancelled || !data) return
      const loaded: Deal[] = []
      for (const row of data) {
        persistedRef.current.set(row.client_id as number, {
          rowId: row.id as string,
          owned: row.user_id === user.id,
        })
        loaded.push(row.data as Deal)
      }
      setDeals([...initialDeals, ...loaded])
    })()
    return () => {
      cancelled = true
    }
  }, [user, supabase])

  // Update flags/tags for a deal; persist to the DB when the deal is owned.
  const handleUpdateFlagsTags = async (dealId: number, next: { flags: string[]; tags: string[] }) => {
    const current = deals.find((d) => d.id === dealId)
    const updatedDeal = current ? { ...current, ...next } : undefined
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...next } : d)))
    setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, ...next } : prev))

    const meta = persistedRef.current.get(dealId)
    if (user && meta?.owned && updatedDeal) {
      const { error } = await supabase
        .from("sourced_deals")
        .update({ data: updatedDeal, updated_at: new Date().toISOString() })
        .eq("id", meta.rowId)
      if (error) console.error("[v0] update deal flags/tags error:", error.message)
    }
  }

  const filteredDeals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return deals.filter((deal) => {
      const matchesSearch =
        !term ||
        `${deal.name} ${deal.referenceCode} ${deal.geography} ${deal.assetClass} ${dealTypeLabel(deal.dealTypePrimary)} ${lifecycleLabel(deal.lifecycleState)} ${deal.sponsor}`
          .toLowerCase()
          .includes(term)
      const matchesFlags = flagFilter.length === 0 || flagFilter.every((f) => (deal.flags ?? []).includes(f))
      return matchesSearch && matchesFlags
    })
  }, [deals, searchTerm, flagFilter])
  const selectedDealAnalysis = selectedDeal ? generatePreAnalysis(selectedDeal) : null

  const updateNewDeal = <K extends keyof Omit<Deal, "id">>(field: K, value: Omit<Deal, "id">[K]) => {
    setNewDeal((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddDeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const clientId = Date.now()
    const dealToAdd: Deal = {
      ...newDeal,
      id: clientId,
    }
    setDeals((prev) => [...prev, dealToAdd])
    setIsAddDialogOpen(false)
    setNewDeal(createEmptyDeal())
    setPrefilledFromUpload(false)

    if (user) {
      const { data, error } = await supabase
        .from("sourced_deals")
        .insert({
          user_id: user.id,
          client_id: clientId,
          name: dealToAdd.name,
          reference_code: dealToAdd.referenceCode,
          data: dealToAdd,
        })
        .select("id")
        .single()
      if (error || !data) {
        console.error("[v0] persist deal error:", error?.message)
        toast({
          title: "Saved for this session only",
          description: "We couldn't save this deal to the server. It will disappear on reload.",
          variant: "destructive",
        })
        return
      }
      persistedRef.current.set(clientId, { rowId: data.id as string, owned: true })
      void logActivity({
        action: "Created sourced deal",
        category: "deals",
        metadata: { deal_id: clientId, name: dealToAdd.name, reference_code: dealToAdd.referenceCode },
      })
    }

    toast({
      title: "Deal added",
      description: `${dealToAdd.name} is now saved and visible in Live Opportunities.`,
    })
  }

  const handleAddDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewDeal(createEmptyDeal())
      setPrefilledFromUpload(false)
    }
  }

  // Map AI-extracted document fields onto the canonical Deal envelope, then open the Add Deal form
  const handlePopulateFromUpload = (fields: ExtractedDealFields) => {
    const clean = (value: string) => (value && value !== "—" ? value : "")
    setNewDeal({
      referenceCode: generateReferenceCode(),
      dealTypePrimary: fields.dealTypePrimary,
      sourceChannel: "import",
      dataClassification: "restricted",
      taxonomyVersion: TAXONOMY_VERSION,
      name: clean(fields.title),
      summary: clean(fields.description),
      transactionPurpose: fields.transactionPurpose,
      dealStage: "sourcing",
      lifecycleState: "RECEIVED",
      assetClass: clean(fields.assetType),
      geography: clean(fields.location),
      requestType: fields.requestType,
      capitalNeedTotal: clean(fields.dealSize) || clean(fields.maxRaise),
      capitalNeedMinimum: clean(fields.minimumInvestment),
      currency: "USD",
      useOfProceeds: clean(fields.useOfProceeds),
      targetCloseDate: clean(fields.holdPeriod),
      sponsor: clean(fields.sponsor),
      sponsorRole: "sponsor",
      targetIrr: clean(fields.targetReturn),
      targetMoic: clean(fields.targetMoic),
    })
    setPrefilledFromUpload(true)
    setIsUploadOpen(false)
    setIsAddDialogOpen(true)
    toast({
      title: "Deal details extracted",
      description: `Fields from ${fields.documentType.toLowerCase()} pre-filled. Review and save.`,
    })
  }

  const handleDownloadDeal = (deal: Deal, analysis?: DealAnalysis) => {
    const pdfString = buildDealPdf(deal, analysis)
    const blob = new Blob([pdfString], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${deal.name.replace(/\s+/g, "_").toLowerCase()}_deal_summary.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExpressInterest = (deal: Deal) => {
    setInterestedDeals((prev) => {
      const alreadyInterested = prev.includes(deal.id)
      if (alreadyInterested) {
        toast({
          title: "Interest withdrawn",
          description: `You removed ${deal.name} from your interest list.`,
        })
        return prev.filter((id) => id !== deal.id)
      }

      toast({
        title: "Interest submitted",
        description: `We'll notify the sponsor of your intent on ${deal.name}.`,
      })
      return [...prev, deal.id]
    })
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="min-h-full px-8 py-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70 mb-2">Deal Intelligence</p>
              <h1 className="text-4xl font-semibold text-white">Live Opportunities</h1>
              <p className="text-slate-300 mt-3 max-w-xl">
                Monitor actionable deal flow, diligence timelines, and sponsor performance — all in the unified JSL Tech™
                dark workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(true)}
                className="border-slate-700 bg-slate-900/60 text-slate-200 hover:border-blue-500/50 hover:text-white px-6 py-3 rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import from Document
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto bg-slate-900 border border-slate-800 text-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    Add New Deal
                    {prefilledFromUpload && (
                      <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/40 text-[11px] font-normal">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Pre-filled from document
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {prefilledFromUpload
                      ? "Review the AI-extracted details below, edit anything, then save to the live pipeline."
                      : "Capture the canonical deal envelope and add the opportunity to the live pipeline."}
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleAddDeal}>
                  {/* Identity & Governance */}
                  <section className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70">Identity &amp; Governance</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reference code</Label>
                        <Input
                          value={newDeal.referenceCode}
                          onChange={(e) => updateNewDeal("referenceCode", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary deal type</Label>
                        <Select value={newDeal.dealTypePrimary} onValueChange={(v) => updateNewDeal("dealTypePrimary", v as Deal["dealTypePrimary"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {DEAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Source channel</Label>
                        <Select value={newDeal.sourceChannel} onValueChange={(v) => updateNewDeal("sourceChannel", v as Deal["sourceChannel"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {SOURCE_CHANNELS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data classification</Label>
                        <Select value={newDeal.dataClassification} onValueChange={(v) => updateNewDeal("dataClassification", v as Deal["dataClassification"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {DATA_CLASSIFICATIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {/* Core Profile */}
                  <section className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70">Core Profile</p>
                    <div className="space-y-2">
                      <Label htmlFor="deal-name">Display name</Label>
                      <Input
                        id="deal-name"
                        required
                        placeholder="e.g. Lakeside Industrial Portfolio"
                        value={newDeal.name}
                        onChange={(e) => updateNewDeal("name", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deal-geo">Geography</Label>
                        <Input
                          id="deal-geo"
                          required
                          placeholder="City, State"
                          value={newDeal.geography}
                          onChange={(e) => updateNewDeal("geography", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deal-asset">Asset class</Label>
                        <Input
                          id="deal-asset"
                          required
                          placeholder="Multifamily, Industrial..."
                          value={newDeal.assetClass}
                          onChange={(e) => updateNewDeal("assetClass", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Transaction purpose</Label>
                        <Select value={newDeal.transactionPurpose} onValueChange={(v) => updateNewDeal("transactionPurpose", v as Deal["transactionPurpose"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {TRANSACTION_PURPOSES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Deal stage</Label>
                        <Select value={newDeal.dealStage} onValueChange={(v) => updateNewDeal("dealStage", v as Deal["dealStage"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {DEAL_STAGES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Lifecycle state</Label>
                        <Select value={newDeal.lifecycleState} onValueChange={(v) => updateNewDeal("lifecycleState", v as Deal["lifecycleState"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                            {LIFECYCLE_STATES.map((s) => <SelectItem key={s} value={s}>{lifecycleLabel(s)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {/* Parties */}
                  <section className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70">Lead Party</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deal-sponsor">Sponsor / party</Label>
                        <Input
                          id="deal-sponsor"
                          required
                          placeholder="Party name"
                          value={newDeal.sponsor}
                          onChange={(e) => updateNewDeal("sponsor", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newDeal.sponsorRole} onValueChange={(v) => updateNewDeal("sponsorRole", v as Deal["sponsorRole"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {PARTY_ROLES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {/* Capital Request */}
                  <section className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70">Capital Request</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Request type</Label>
                        <Select value={newDeal.requestType} onValueChange={(v) => updateNewDeal("requestType", v as Deal["requestType"])}>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                            {REQUEST_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Capital need</Label>
                        <Input placeholder="$10M" value={newDeal.capitalNeedTotal}
                          onChange={(e) => updateNewDeal("capitalNeedTotal", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Min. tranche</Label>
                        <Input placeholder="$250K" value={newDeal.capitalNeedMinimum}
                          onChange={(e) => updateNewDeal("capitalNeedMinimum", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Input placeholder="USD" value={newDeal.currency}
                          onChange={(e) => updateNewDeal("currency", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Use of proceeds</Label>
                      <Input placeholder="Acquisition + renovation capex" value={newDeal.useOfProceeds}
                        onChange={(e) => updateNewDeal("useOfProceeds", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100" />
                    </div>
                  </section>

                  {/* Economics & Timeline */}
                  <section className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70">Economics &amp; Timeline</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Target IRR</Label>
                        <Input placeholder="14%" value={newDeal.targetIrr}
                          onChange={(e) => updateNewDeal("targetIrr", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Target MOIC</Label>
                        <Input placeholder="2.0x" value={newDeal.targetMoic}
                          onChange={(e) => updateNewDeal("targetMoic", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Target close date</Label>
                        <Input placeholder="Q4 2026" value={newDeal.targetCloseDate}
                          onChange={(e) => updateNewDeal("targetCloseDate", e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-summary">Summary</Label>
                      <Textarea
                        id="deal-summary"
                        placeholder="Neutral description; thesis, business plan, and current diligence notes..."
                        value={newDeal.summary}
                        onChange={(e) => updateNewDeal("summary", e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                        rows={4}
                      />
                    </div>
                  </section>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-300 hover:text-white hover:bg-slate-800"
                      onClick={() => handleAddDialogChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                      Save Deal
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          <DealUploadDialog
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onPopulateForm={handlePopulateFromUpload}
          />

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-lg shadow-blue-500/5">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search deals, sponsors, or markets..."
                className="pl-12 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-500">
              {filteredDeals.length} opportunities
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">Filter by risk:</span>
              {RISK_CATALOG.map((f) => {
                const active = flagFilter.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFlagFilter((prev) => (active ? prev.filter((x) => x !== f.id) : [...prev, f.id]))}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] transition-all ${
                      active ? riskBadgeClass(f.id) : "border border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {getRiskFlag(f.id)?.label}
                  </button>
                )
              })}
              {flagFilter.length > 0 && (
                <button type="button" onClick={() => setFlagFilter([])} className="text-[11px] text-slate-400 underline hover:text-white">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => {
              const isInterested = interestedDeals.includes(deal.id)
              return (
                <Card
                  key={deal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDeal(deal)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedDeal(deal)
                    }
                  }}
                  className="bg-slate-900/80 border border-slate-800 transition-all hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                            <Hash className="w-3 h-3 mr-1" />
                            {deal.referenceCode}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl text-white truncate">{deal.name}</CardTitle>
                        <div className="mt-2 flex items-center text-sm text-slate-400">
                          <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                          <span>{deal.geography}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={lifecycleBadge(deal.lifecycleState)}>{lifecycleLabel(deal.lifecycleState)}</Badge>
                        {isInterested && (
                          <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/40 text-[11px]">
                            Interested
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30 text-[10px]">
                        <Layers className="w-3 h-3 mr-1" />
                        {dealTypeShort(deal.dealTypePrimary)}
                      </Badge>
                      <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {deal.assetClass}
                      </Badge>
                      <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {requestTypeLabel(deal.requestType)}
                      </Badge>
                      <Badge className={`${classificationBadge(deal.dataClassification)} text-[10px]`}>
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {dataClassificationLabel(deal.dataClassification)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400 uppercase tracking-[0.18em] text-[10px] mb-1">Capital</p>
                        <p className="text-base font-semibold text-slate-100 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-blue-300" />
                          {deal.capitalNeedTotal || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-[0.18em] text-[10px] mb-1">Target IRR</p>
                        <p className="text-base font-semibold text-slate-100 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-purple-300" />
                          {deal.targetIrr || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-[0.18em] text-[10px] mb-1">MOIC</p>
                        <p className="text-base font-semibold text-slate-100 flex items-center">
                          <Target className="w-4 h-4 mr-1 text-emerald-300" />
                          {deal.targetMoic || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-sm text-slate-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sponsor</span>
                        <span className="font-medium text-slate-100">{deal.sponsor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Stage</span>
                        <span className="font-medium text-slate-100">{dealStageLabel(deal.dealStage)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target close</span>
                        <span className="flex items-center font-medium text-slate-100">
                          <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                          {deal.targetCloseDate || "—"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{deal.summary}</p>
                    </div>

                    {/* Completion gate progress */}
                    {(() => {
                      const completion = evaluateCompletion(deal)
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            <span>Completion · gate {completion.highestGate}</span>
                            <span>{completion.percent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-500/70" style={{ width: `${completion.percent}%` }} />
                          </div>
                        </div>
                      )
                    })()}

                    {/* Risk flags (detection) and tags are separate systems —
                        editing isolated from the card's open-detail click. */}
                    <div onClick={(event) => event.stopPropagation()} className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 w-10 shrink-0">Risk</span>
                        <RiskFlagManager
                          flags={deal.flags ?? []}
                          detected={detectDealRiskFlags({
                            lifecycleState: deal.lifecycleState,
                            dataClassification: deal.dataClassification,
                          })}
                          onChange={(flags) => handleUpdateFlagsTags(deal.id, { flags, tags: deal.tags ?? [] })}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 w-10 shrink-0">Tags</span>
                        <TagManager
                          tags={deal.tags ?? []}
                          onChange={(tags) => handleUpdateFlagsTags(deal.id, { flags: deal.flags ?? [], tags })}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isInterested ? "default" : "outline"}
                        className={isInterested ? "bg-blue-600 text-white" : "border-slate-600 text-slate-200"}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleExpressInterest(deal)
                        }}
                      >
                        {isInterested ? "Interest Confirmed" : "Express Interest"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredDeals.length === 0 && (
            <Card className="border border-slate-800 bg-slate-900/80">
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-lg font-semibold text-white">No opportunities match your filters yet.</p>
                <p className="text-sm text-slate-400">
                  Adjust the search criteria or add a new mandate to keep the pipeline populated.
                </p>
              </CardContent>
            </Card>
          )}

          <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
            <DialogContent className="w-[95vw] max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 text-slate-200 p-8 overflow-hidden">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    {selectedDeal && (
                      <p className="text-xs font-mono text-slate-500 mb-1">{selectedDeal.referenceCode}</p>
                    )}
                    <DialogTitle className="text-2xl text-white">{selectedDeal?.name}</DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm">
                      {selectedDeal?.geography} · {selectedDeal?.assetClass} · {selectedDeal && dealTypeLabel(selectedDeal.dealTypePrimary)}
                    </DialogDescription>
                  </div>
                  {selectedDeal && (
                    <div className="flex flex-wrap gap-3">
                      <Badge className={lifecycleBadge(selectedDeal.lifecycleState)}>{lifecycleLabel(selectedDeal.lifecycleState)}</Badge>
                      <Button
                        variant="outline"
                        className="border-slate-700 text-slate-200 hover:bg-slate-800"
                        onClick={() => handleDownloadDeal(selectedDeal, selectedDealAnalysis ?? undefined)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>
              {selectedDeal && (
                <div className="h-[calc(85vh-140px)] overflow-y-auto space-y-6 pr-1">
                  {/* Classification chips */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/30 text-xs">
                      <Layers className="w-3 h-3 mr-1" />
                      {dealTypeLabel(selectedDeal.dealTypePrimary)}
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      {transactionPurposeLabel(selectedDeal.transactionPurpose)}
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Stage · {dealStageLabel(selectedDeal.dealStage)}
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      {requestTypeLabel(selectedDeal.requestType)}
                    </Badge>
                    <Badge className={`${classificationBadge(selectedDeal.dataClassification)} text-xs`}>
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {dataClassificationLabel(selectedDeal.dataClassification)}
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-400 border border-slate-700 text-xs">
                      via {sourceChannelLabel(selectedDeal.sourceChannel)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedDeal.summary}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <div className="space-y-1">
                          <span>Capital Need</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">
                            {selectedDeal.capitalNeedTotal || "—"} {selectedDeal.currency}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span>Min. Tranche</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.capitalNeedMinimum || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Target IRR</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.targetIrr || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Target MOIC</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.targetMoic || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Target Close</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.targetCloseDate || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Lead Party</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">
                            {selectedDeal.sponsor} <span className="text-slate-500 text-xs">({partyRoleLabel(selectedDeal.sponsorRole)})</span>
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-1">Use of Proceeds</p>
                        <p className="text-sm text-slate-300">{selectedDeal.useOfProceeds || "Not yet specified."}</p>
                      </div>
                    </div>

                    {/* Lifecycle completion gates */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-400" />
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completion Gates</p>
                      </div>
                      {(() => {
                        const completion = evaluateCompletion(selectedDeal)
                        return (
                          <>
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-semibold text-white">{completion.percent}%</span>
                              <span className="text-xs text-slate-400">Highest gate · {completion.highestGate}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-blue-500/70" style={{ width: `${completion.percent}%` }} />
                            </div>
                            <ul className="space-y-2 text-sm">
                              {completion.missingByGate.map((g) => {
                                const passed = g.missing.length === 0
                                return (
                                  <li key={g.gate} className="flex items-start gap-2">
                                    <span className={`mt-0.5 inline-flex h-4 w-8 shrink-0 items-center justify-center rounded text-[10px] font-mono ${passed ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-400"}`}>
                                      {g.gate}
                                    </span>
                                    <span className={passed ? "text-slate-300" : "text-slate-400"}>
                                      {g.name}
                                      {!passed && (
                                        <span className="block text-xs text-slate-500">Missing: {g.missing.join(", ")}</span>
                                      )}
                                    </span>
                                  </li>
                                )
                              })}
                            </ul>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Due Diligence Focus</p>
                        <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">Current sprint</span>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-300">
                        <li>• Lease audit and T-12 financial verification</li>
                        <li>• Capex scope validation with third-party GC</li>
                        <li>• Debt sizing with two relationship lenders</li>
                        <li>• Market comp refresh and exit cap back-testing</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Execution Plan</p>
                        <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">Next 12 months</span>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-300">
                        <li>• Stabilize occupancy above 93% with refreshed leasing packages</li>
                        <li>• Implement smart building upgrades to reduce OpEx ~8%</li>
                        <li>• Sequence phased distributions once DSCR exceeds 1.7x</li>
                        <li>• Prepare refinance dossier for mid-cycle optionality</li>
                      </ul>
                    </div>
                  </div>

                  {selectedDealAnalysis && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">AI Pre-Underwriting</p>
                          <p className="text-xs text-slate-500 uppercase tracking-[0.18em]">Investment pre-analysis</p>
                        </div>
                        <Badge className="bg-purple-500/10 text-purple-200 border border-purple-500/30">Beta</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 uppercase tracking-[0.2em] text-xs mb-1">Score</p>
                          <p className="text-lg font-semibold text-white">{selectedDealAnalysis.score}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-[0.2em] text-xs mb-1">Risk Band</p>
                          <p className="text-lg font-semibold text-white">{selectedDealAnalysis.riskBand}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-[0.2em] text-xs mb-1">Liquidity Window</p>
                          <p className="text-lg font-semibold text-white">{selectedDealAnalysis.liquidityWindow}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedDealAnalysis.aiSummary}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">Stress Test Notes</p>
                      <p className="text-sm text-slate-300">{selectedDealAnalysis.stressNotes}</p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          className="bg-blue-600 hover:bg-blue-500 text-white"
                          onClick={() => router.push(selectedDealAnalysis.underwritingSync)}
                        >
                          Open in Underwriting Hub
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-700 text-slate-200 hover:bg-slate-800"
                          onClick={() => handleDownloadDeal(selectedDeal, selectedDealAnalysis)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Pre-Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
