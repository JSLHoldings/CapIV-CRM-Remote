"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/components/ui/use-toast"
import { Search, Plus, TrendingUp, DollarSign, Calendar, MapPin, Download } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"

interface Deal {
  id: number
  name: string
  location: string
  type: string
  status: "Active" | "Due Diligence" | "Closed" | "Watch"
  investment: string
  irr: string
  timeline: string
  sponsor: string
  description: string
}

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
    name: "Harbor View Apartments",
    location: "Austin, TX",
    type: "Multifamily",
    status: "Active",
    investment: "$15M",
    irr: "14.2%",
    timeline: "Q2 2025",
    sponsor: "Harbor Partners",
    description:
      "198-unit Class B+ value-add opportunity with strong leasing velocity and 320 bps upside through renovation program.",
  },
  {
    id: 2,
    name: "Downtown Office Complex",
    location: "Dallas, TX",
    type: "Office",
    status: "Due Diligence",
    investment: "$32M",
    irr: "12.8%",
    timeline: "Q3 2025",
    sponsor: "Sterling Capital",
    description:
      "Two-tower CBD office reposition. Anchored leases in negotiation with corporate tenants; T-12 occupancy at 84%.",
  },
  {
    id: 3,
    name: "Retail Shopping Center",
    location: "Houston, TX",
    type: "Retail",
    status: "Closed",
    investment: "$8.5M",
    irr: "16.1%",
    timeline: "Q1 2025",
    sponsor: "Oakwood Holdings",
    description:
      "Stabilized grocery-anchored retail strip with 12-pad expansion potential and signed LOIs for two national tenants.",
  },
]

const generatePreAnalysis = (deal: Deal): DealAnalysis => {
  const mapping: Record<Deal["status"], { score: string; riskBand: string }> = {
    Active: { score: "82 / 100", riskBand: "Moderate-Low" },
    "Due Diligence": { score: "78 / 100", riskBand: "Moderate" },
    Closed: { score: "88 / 100", riskBand: "Low" },
    Watch: { score: "71 / 100", riskBand: "Elevated" },
  }

  const defaults = mapping[deal.status]
  return {
    score: defaults.score,
    riskBand: defaults.riskBand,
    liquidityWindow: deal.timeline,
    aiSummary: `AI signal suggests ${deal.type.toLowerCase()} exposure with ${deal.irr} target IRR remains ${
      deal.status === "Watch" ? "sensitive to market shifts" : "within mandate tolerances"
    }.`,
    underwritingSync: `/capiv-iq?tab=underwriting&deal=${deal.id}`,
    stressNotes:
      deal.status === "Watch"
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
  const title = sanitize(deal.name || "CapIV Opportunity")
  const subtitleParts = [deal.location, deal.type, deal.status].filter(Boolean)
  const subtitle = sanitize(subtitleParts.join(" • ") || "Live opportunity inside CapIV Command")

  const snapshotLines = [
    `Sponsor: ${deal.sponsor || "TBD"}`,
    `Property Type: ${deal.type || "Unspecified"}`,
    `Status: ${deal.status}`,
    `Capital Request: ${deal.investment || "Pending"}`,
    `Target IRR: ${deal.irr || "In diligence"}`,
    `Liquidity Window: ${deal.timeline || "Call to confirm"}`,
  ]

  const propertyHighlights = [
    `Primary Market: ${deal.location || "To be announced"}`,
    `Mandate Alignment: ${analysis?.riskBand || "CapIV reviewing"}`,
    `Score: ${analysis?.score || "Awaiting full underwriting"}`,
    `Watch Notes: ${analysis?.stressNotes || "No elevated risks logged."}`,
  ]

  const overviewLines = wrapText(
    deal.description ||
      "Sponsor has not provided a full narrative yet. CapIV diligence will populate this section as documents are received.",
  )

  const aiSummaryLines = analysis?.aiSummary
    ? wrapText(analysis.aiSummary)
    : wrapText(
        "AI signals will populate once the underwriting lab confirms comparables and updated rent rolls. Until then, leverage CapIV Access for sponsor Q&A to accelerate readiness.",
      )

  const diligenceActions = [
    `Underwriting Link: ${analysis?.underwritingSync || `/capiv-iq?tab=underwriting&deal=${deal.id}`}`,
    "Persona AML + NDA: Required prior to data room unlocks.",
    "Data Room Readiness: CapIV Diligence Hub tracks NDAs, PPMS, and compliance packets unified with CapIV IQ.",
  ]

  const capitalSignals = [
    "Capital Stack Notes: Confirm leverage assumptions and co-invest windows.",
    "Scenario Planning: Stress-test DSCR, lease-up thresholds, and exit sensitivities inside CapIV EQ.",
    "Next Milestone: Schedule sponsor sync for updated financial model delivery.",
  ]

  const disclaimerLines = wrapText(
    "Generated automatically by CapIV Command. This report is informational only and not an offer to sell securities. Contact the sponsor or CapIV team for authenticated data rooms, NDAs, and regulatory disclosures.",
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
(${escapePdfText(`CapIV Score ${analysis?.score || "Pending"} • ${analysis?.riskBand || "Risk review in progress"}`)}) Tj
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
    `Underwriting Contact: ${deal.sponsor || "CapIV Sponsor Team"}`,
    "Data Room Status: NDA pending finalization in CapIV IQ.",
    "Comparable Set: Pulled from CapIV Access AI signals (see underwriting hub).",
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
  const createEmptyDeal = (): Omit<Deal, "id"> => ({
    name: "",
    location: "",
    type: "",
    status: "Active",
    investment: "",
    irr: "",
    timeline: "",
    sponsor: "",
    description: "",
  })
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDeal, setNewDeal] = useState<Omit<Deal, "id">>(createEmptyDeal())
  const [interestedDeals, setInterestedDeals] = useState<number[]>([])

  const filteredDeals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return deals
    }
    return deals.filter((deal) => {
      const haystack = `${deal.name} ${deal.location} ${deal.type} ${deal.status} ${deal.sponsor}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [deals, searchTerm])
  const selectedDealAnalysis = selectedDeal ? generatePreAnalysis(selectedDeal) : null

  const getStatusBadgeClass = (status: Deal["status"]) => {
    if (status === "Active") {
      return "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30"
    }
    if (status === "Closed") {
      return "bg-slate-800 text-slate-300 border border-slate-700"
    }
    if (status === "Watch") {
      return "bg-orange-500/15 text-orange-200 border border-orange-500/30"
    }
    return "bg-amber-500/15 text-amber-200 border border-amber-500/30"
  }

  const updateNewDeal = <K extends keyof Omit<Deal, "id">>(field: K, value: Omit<Deal, "id">[K]) => {
    setNewDeal((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const dealToAdd: Deal = {
      ...newDeal,
      id: Date.now(),
    }
    setDeals((prev) => [...prev, dealToAdd])
    toast({
      title: "Deal added",
      description: `${dealToAdd.name} is now visible in Live Opportunities.`,
    })
    setIsAddDialogOpen(false)
    setNewDeal(createEmptyDeal())
  }

  const handleAddDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewDeal(createEmptyDeal())
    }
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
                Monitor actionable deal flow, diligence timelines, and sponsor performance — all in the unified CapIV™
                dark workspace.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-slate-900 border border-slate-800 text-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Deal</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Capture the headline details and add the opportunity to the live pipeline.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddDeal}>
                  <div className="space-y-2">
                    <Label htmlFor="deal-name">Deal name</Label>
                    <Input
                      id="deal-name"
                      required
                      placeholder="e.g. Lakeside Industrial Portfolio"
                      value={newDeal.name}
                      onChange={(event) => updateNewDeal("name", event.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-location">Location</Label>
                      <Input
                        id="deal-location"
                        required
                        placeholder="City, State"
                        value={newDeal.location}
                        onChange={(event) => updateNewDeal("location", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-type">Asset type</Label>
                      <Input
                        id="deal-type"
                        required
                        placeholder="Multifamily, Industrial..."
                        value={newDeal.type}
                        onChange={(event) => updateNewDeal("type", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-status">Status</Label>
                      <select
                        id="deal-status"
                        value={newDeal.status}
                        onChange={(event) => updateNewDeal("status", event.target.value as Deal["status"])}
                        className="w-full rounded-md border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="Active">Active</option>
                        <option value="Due Diligence">Due Diligence</option>
                        <option value="Closed">Closed</option>
                        <option value="Watch">Watch</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-sponsor">Sponsor</Label>
                      <Input
                        id="deal-sponsor"
                        required
                        placeholder="Sponsor name"
                        value={newDeal.sponsor}
                        onChange={(event) => updateNewDeal("sponsor", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal-investment">Investment</Label>
                      <Input
                        id="deal-investment"
                        placeholder="$10M"
                        value={newDeal.investment}
                        onChange={(event) => updateNewDeal("investment", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-irr">Target IRR</Label>
                      <Input
                        id="deal-irr"
                        placeholder="14%"
                        value={newDeal.irr}
                        onChange={(event) => updateNewDeal("irr", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal-timeline">Timeline</Label>
                      <Input
                        id="deal-timeline"
                        placeholder="Q4 2025"
                        value={newDeal.timeline}
                        onChange={(event) => updateNewDeal("timeline", event.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deal-description">Investment brief</Label>
                    <Textarea
                      id="deal-description"
                      placeholder="Key thesis, business plan, and any current diligence notes..."
                      value={newDeal.description}
                      onChange={(event) => updateNewDeal("description", event.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100"
                      rows={4}
                    />
                  </div>
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
                      <div>
                        <CardTitle className="text-xl text-white">{deal.name}</CardTitle>
                        <div className="mt-2 flex items-center text-sm text-slate-400">
                          <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                          <span>{deal.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusBadgeClass(deal.status)}>{deal.status}</Badge>
                        {isInterested && (
                          <Badge className="bg-blue-500/10 text-blue-200 border border-blue-500/40 text-[11px]">
                            Interested
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 uppercase tracking-[0.2em] text-xs mb-1">Investment</p>
                        <p className="text-lg font-semibold text-slate-100 flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-blue-300" />
                          {deal.investment}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-[0.2em] text-xs mb-1">Target IRR</p>
                        <p className="text-lg font-semibold text-slate-100 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-purple-300" />
                          {deal.irr}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-sm text-slate-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sponsor</span>
                        <span className="font-medium text-slate-100">{deal.sponsor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timeline</span>
                        <span className="flex items-center font-medium text-slate-100">
                          <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                          {deal.timeline}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{deal.description}</p>
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
                    <DialogTitle className="text-2xl text-white">{selectedDeal?.name}</DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm">
                      {selectedDeal?.location} · {selectedDeal?.type}
                    </DialogDescription>
                  </div>
                  {selectedDeal && (
                    <div className="flex flex-wrap gap-3">
                      <Badge className={getStatusBadgeClass(selectedDeal.status)}>{selectedDeal.status}</Badge>
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
                  <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedDeal.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <div className="space-y-1">
                          <span>Investment</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">
                            {selectedDeal.investment}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span>Target IRR</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.irr}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Timeline</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.timeline}</p>
                        </div>
                        <div className="space-y-1">
                          <span>Sponsor</span>
                          <p className="text-base normal-case tracking-normal text-slate-100">{selectedDeal.sponsor}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 space-y-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sponsor Notes</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedDeal.sponsor} reports active engagement with lenders and key tenants to preserve yield
                        targets. Relationship capital remains strong across the regional brokerage community.
                      </p>
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
