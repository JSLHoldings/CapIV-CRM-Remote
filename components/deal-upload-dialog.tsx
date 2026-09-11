"use client"

import { useCallback, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  Upload, FileText, FileImage, CheckCircle2, AlertCircle,
  Loader2, X, Pencil, ArrowRight, Sparkles, RefreshCw,
  ClipboardList, ChevronDown, HelpCircle, Circle,
} from "lucide-react"
import { DEAL_TYPES, TRANSACTION_PURPOSES, REQUEST_TYPES } from "@/lib/deal-schema"
import type { IntakeReport } from "@/lib/deal-text-parser"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ExtractedDealFields {
  title: string
  sponsor: string
  location: string
  assetType: string
  dealTypePrimary:
    | "RE_DIRECT" | "PRIVATE_CREDIT" | "FUND_GP_LP" | "OPCO_EQUITY"
    | "M_AND_A" | "SPV_COINVEST" | "PORTFOLIO_ASSET" | "DIGITAL_INTERFACE"
  transactionPurpose:
    | "acquisition" | "development" | "recap" | "refinance" | "growth"
    | "buyout" | "liquidity" | "fundraise" | "other"
  requestType:
    | "equity" | "debt" | "preferred" | "mezzanine" | "JV" | "LP" | "GP"
    | "co-invest" | "hybrid" | "other"
  useOfProceeds: string
  dealSize: string
  investmentType: "Equity" | "Debt" | "Hybrid"
  riskProfile: "Core" | "Core-Plus" | "Value-Add" | "Opportunistic"
  targetReturn: string
  targetMoic: string
  holdPeriod: string
  minimumInvestment: string
  maxRaise: string
  description: string
  capRate: string
  noi: string
  occupancy: string
  yearBuilt: string
  documentType: string
  confidence: number
  missingFields: string[]
  intakeReport: IntakeReport
}

interface DealUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPopulateForm: (fields: ExtractedDealFields) => void
}

// ── Step types ──────────────────────────────────────────────────────────────
type Step = "upload" | "extracting" | "review" | "done"

const ACCEPTED_TYPES = ".pdf,.docx,.png,.jpg,.jpeg"
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-400" />
  return <FileText className="h-5 w-5 text-blue-400" />
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence — most fields extracted",
  medium: "Medium confidence — some fields may need review",
  low: "Low confidence — please verify all fields carefully",
}
function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high"
  if (score >= 45) return "medium"
  return "low"
}
function confidenceColor(score: number) {
  const level = confidenceLevel(score)
  if (level === "high") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
  if (level === "medium") return "text-amber-300 border-amber-500/30 bg-amber-500/10"
  return "text-rose-300 border-rose-500/30 bg-rose-500/10"
}

function fieldStatusIcon(status: "found" | "missing" | "uncertain") {
  if (status === "found") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
  if (status === "uncertain") return <HelpCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
  return <Circle className="h-3.5 w-3.5 text-rose-400/80 flex-shrink-0 mt-0.5" />
}

function fieldStatusLabel(status: "found" | "missing" | "uncertain") {
  if (status === "found") return "text-emerald-300"
  if (status === "uncertain") return "text-amber-300"
  return "text-rose-300"
}

// ── Fake extraction progress messages ─────────────────────────────────────────
const PROGRESS_STEPS = [
  { pct: 10, msg: "Uploading document..." },
  { pct: 30, msg: "Reading document text..." },
  { pct: 55, msg: "Extracting deal fields..." },
  { pct: 75, msg: "Identifying sponsor & location..." },
  { pct: 90, msg: "Structuring financial data..." },
  { pct: 100, msg: "Extraction complete" },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function DealUploadDialog({ open, onOpenChange, onPopulateForm }: DealUploadDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [progressMsg, setProgressMsg] = useState("")
  const [extracted, setExtracted] = useState<ExtractedDealFields | null>(null)
  const [editedFields, setEditedFields] = useState<ExtractedDealFields | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Reset on close ──
  const handleClose = useCallback(() => {
    setStep("upload")
    setSelectedFile(null)
    setProgressPct(0)
    setProgressMsg("")
    setExtracted(null)
    setEditedFields(null)
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  // ── File validation ──
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type)) return "Please upload a PDF, DOCX, PNG, or JPG file."
    if (file.size > 25 * 1024 * 1024) return "File must be under 25MB."
    return null
  }

  // ── Start extraction ──
  const runExtraction = useCallback(async (file: File) => {
    setStep("extracting")
    setError(null)
    setProgressPct(0)

    // Animate progress while waiting for API
    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < PROGRESS_STEPS.length - 1) {
        setProgressPct(PROGRESS_STEPS[stepIdx].pct)
        setProgressMsg(PROGRESS_STEPS[stepIdx].msg)
        stepIdx++
      }
    }, 600)

    try {
      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/deals/extract", { method: "POST", body: fd })
      clearInterval(interval)

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Extraction failed." }))
        throw new Error(body.error ?? "Extraction failed.")
      }

      const data = await res.json()
      const fields: ExtractedDealFields = data.extraction

      setProgressPct(100)
      setProgressMsg("Extraction complete")
      await new Promise((r) => setTimeout(r, 500))

      setExtracted(fields)
      setEditedFields({ ...fields })
      setStep("review")
    } catch (err) {
      clearInterval(interval)
      const msg = err instanceof Error ? err.message : "Extraction failed. Please try again."
      setError(msg)
      setStep("upload")
      toast({ title: "Extraction failed", description: msg })
    }
  }, [toast])

  // ── Drag & drop ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); return }
    setSelectedFile(file)
    setError(null)
    void runExtraction(file)
  }, [runExtraction])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); return }
    setSelectedFile(file)
    setError(null)
    void runExtraction(file)
  }, [runExtraction])

  // ── Edit helpers ──
  const updateField = (key: keyof ExtractedDealFields, value: string) => {
    setEditedFields((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  // ── Populate form and close ──
  const handlePopulate = useCallback(() => {
    if (!editedFields) return
    onPopulateForm(editedFields)
    setStep("done")
    toast({
      title: "Deal fields populated",
      description: "Review and adjust the form, then submit to run the OS pipeline.",
    })
    setTimeout(handleClose, 800)
  }, [editedFields, onPopulateForm, handleClose, toast])

  // ── Retry ──
  const handleRetry = useCallback(() => {
    if (selectedFile) void runExtraction(selectedFile)
  }, [selectedFile, runExtraction])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            Import Deal from Document
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            Upload an Executive Summary, Offering Memorandum, Term Sheet, or Investment Deck.
            We&apos;ll read the document and pre-populate the deal form for you to review.
          </p>
        </DialogHeader>

        {/* ── Step: Upload ──────────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-5 pt-2">
            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-colors cursor-pointer
                ${isDragging
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-slate-700 hover:border-slate-600 bg-slate-900/40"
                }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="Upload document"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />
              <div className={`p-4 rounded-full ${isDragging ? "bg-blue-500/20" : "bg-slate-800"}`}>
                <Upload className={`h-8 w-8 ${isDragging ? "text-blue-400" : "text-slate-400"}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-200">
                  Drop your document here, or{" "}
                  <span className="text-blue-400 underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX, PNG, JPG — up to 25MB</p>
              </div>
            </div>

            {/* Document type legend */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "Executive Summary", desc: "1-3 page deal overview" },
                { type: "Offering Memorandum", desc: "Full OM with financials" },
                { type: "Term Sheet", desc: "Capital structure terms" },
                { type: "Investment Deck", desc: "Pitch deck or presentation" },
              ].map(({ type, desc }) => (
                <div key={type} className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
                  <FileText className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-white">{type}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Extracting ─────────────────────────────────────────────── */}
        {step === "extracting" && (
          <div className="space-y-6 py-6">
            {/* File info */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
                </div>
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{progressMsg}</span>
                <span className="text-slate-400">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2 bg-slate-800" />
            </div>

            {/* AI processing steps */}
            <div className="space-y-2">
              {[
                "Parsing document structure",
                "Identifying sponsor and deal information",
                "Extracting financial metrics",
                "Classifying asset type and risk profile",
                "Generating deal description",
              ].map((label, i) => {
                const done = progressPct >= (i + 1) * 18
                const active = !done && progressPct >= i * 18
                return (
                  <div key={label} className="flex items-center gap-2.5 text-xs">
                    {done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      : active
                        ? <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin flex-shrink-0" />
                        : <div className="h-3.5 w-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                    }
                    <span className={done ? "text-slate-300" : active ? "text-white" : "text-slate-600"}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step: Review ────────────���────────────────────────────────────── */}
        {step === "review" && editedFields && extracted && (
          <div className="space-y-5 pt-2">
            {/* Header info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {selectedFile && (
                  <>
                    {getFileIcon(selectedFile.type)}
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[240px]">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{extracted.documentType}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs border ${confidenceColor(extracted.confidence)}`}>
                  {extracted.confidence}% confidence
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-white h-7 px-2"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Re-extract
                </Button>
              </div>
            </div>

            {/* Confidence message */}
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${confidenceColor(extracted.confidence)}`}>
              {confidenceLevel(extracted.confidence) === "high"
                ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              }
              <span>{CONFIDENCE_LABELS[confidenceLevel(extracted.confidence)]}</span>
            </div>

            {/* Intake report — why fields are missing or the score is low */}
            <IntakeReportPanel report={extracted.intakeReport} />

            {/* Editable fields */}
            <div className="space-y-1 text-xs text-slate-400 flex items-center gap-1.5">
              <Pencil className="h-3 w-3" />
              <span>Review and edit any field before populating the deal form.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-slate-300 text-xs">Deal Title</Label>
                <Input value={editedFields.title} onChange={(e) => updateField("title", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Sponsor */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Sponsor</Label>
                <Input value={editedFields.sponsor} onChange={(e) => updateField("sponsor", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Location</Label>
                <Input value={editedFields.location} onChange={(e) => updateField("location", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Deal Size */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Deal Size</Label>
                <Input value={editedFields.dealSize} onChange={(e) => updateField("dealSize", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Asset Type */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Asset Type</Label>
                <Select value={editedFields.assetType} onValueChange={(v) => updateField("assetType", v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Multifamily","Industrial","Office","Retail","Mixed-Use","Student Housing","Hotel","Self-Storage","Medical","Other"].map((t) => (
                      <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Investment Type */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Investment Type</Label>
                <Select value={editedFields.investmentType} onValueChange={(v) => updateField("investmentType", v as "Equity"|"Debt"|"Hybrid")}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Equity","Debt","Hybrid"].map((t) => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Profile */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Risk Profile</Label>
                <Select value={editedFields.riskProfile} onValueChange={(v) => updateField("riskProfile", v as "Core"|"Core-Plus"|"Value-Add"|"Opportunistic")}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {["Core","Core-Plus","Value-Add","Opportunistic"].map((t) => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Return */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Target Return</Label>
                <Input value={editedFields.targetReturn} onChange={(e) => updateField("targetReturn", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Hold Period */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Hold Period</Label>
                <Input value={editedFields.holdPeriod} onChange={(e) => updateField("holdPeriod", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Min Investment */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Min. Investment</Label>
                <Input value={editedFields.minimumInvestment} onChange={(e) => updateField("minimumInvestment", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Max Raise */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Max Raise</Label>
                <Input value={editedFields.maxRaise} onChange={(e) => updateField("maxRaise", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1.5">
                <Label className="text-slate-300 text-xs">Description (auto-extracted)</Label>
                <Textarea value={editedFields.description} onChange={(e) => updateField("description", e.target.value)}
                  rows={3} className="bg-slate-900 border-slate-700 text-white text-sm resize-none" />
              </div>

              {/* JSL Tech Canonical Classification */}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">JSL Tech Classification</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Primary Deal Type</Label>
                    <Select value={editedFields.dealTypePrimary} onValueChange={(v) => updateField("dealTypePrimary", v as ExtractedDealFields["dealTypePrimary"])}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {DEAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Transaction Purpose</Label>
                    <Select value={editedFields.transactionPurpose} onValueChange={(v) => updateField("transactionPurpose", v as ExtractedDealFields["transactionPurpose"])}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {TRANSACTION_PURPOSES.map((t) => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Request Type</Label>
                    <Select value={editedFields.requestType} onValueChange={(v) => updateField("requestType", v as ExtractedDealFields["requestType"])}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {REQUEST_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Target MOIC</Label>
                    <Input value={editedFields.targetMoic} onChange={(e) => updateField("targetMoic", e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-slate-400 text-xs">Use of Proceeds</Label>
                    <Input value={editedFields.useOfProceeds} onChange={(e) => updateField("useOfProceeds", e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white text-sm h-9" />
                  </div>
                </div>
              </div>

              {/* Key Metrics row */}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Key Metrics</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "capRate", label: "Cap Rate" },
                    { key: "noi", label: "NOI" },
                    { key: "occupancy", label: "Occupancy" },
                    { key: "yearBuilt", label: "Year Built" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-slate-400 text-xs">{label}</Label>
                      <Input
                        value={(editedFields as unknown as Record<string, string>)[key] ?? "—"}
                        onChange={(e) => updateField(key as keyof ExtractedDealFields, e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={handleClose}>
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                onClick={handlePopulate}
              >
                Populate Deal Form
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Done ───────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="p-4 rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Deal form populated</p>
            <p className="text-sm text-slate-400 text-center">
              All extracted fields have been filled in. Review the form and submit to run the OS pipeline.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Intake Report ────────────────────────────────────────────────────────────
// Explains *why* the score landed where it did and *why* specific fields are
// missing/uncertain, so a reviewer knows exactly what to check in the source
// document rather than just that something is incomplete.

function IntakeReportPanel({ report }: { report: IntakeReport }) {
  const [expanded, setExpanded] = useState(false)
  const flagged = report.fields.filter((f) => f.status !== "found")
  const foundCount = report.fields.length - flagged.length

  if (flagged.length === 0) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
        <ClipboardList className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200/90">
          <p className="font-medium text-emerald-300">Intake report: all fields matched</p>
          <p className="text-emerald-200/70 mt-0.5">{report.scoreReasons[0]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left"
      >
        <div className="flex items-start gap-2.5">
          <ClipboardList className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-white">
              Intake report — why the score is {report.score}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {foundCount} of {report.fields.length} fields matched · {flagged.length} need review
            </p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-4">
          {/* Score-level reasons */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Why the score is {report.score}%</p>
            <ul className="space-y-1.5">
              {report.scoreReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-500 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 pt-0.5">
              Extracted {report.documentStats.words.toLocaleString()} words ({report.documentStats.characters.toLocaleString()} characters) of document text.
            </p>
          </div>

          {/* Per-field diagnostics */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Field-by-field reasons</p>
            <ul className="space-y-2">
              {flagged.map((f) => (
                <li key={f.field} className="flex items-start gap-2">
                  {fieldStatusIcon(f.status)}
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${fieldStatusLabel(f.status)}`}>
                      {f.label} — {f.status === "uncertain" ? "low confidence" : "not found"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
