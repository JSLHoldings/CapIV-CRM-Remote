"use client"

import { useState, useRef, useCallback } from "react"
import {
  ShieldCheck,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Loader2,
  ClipboardList,
  Building2,
  User,
  Landmark,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// ─── Types ──────────────────────────────────────────────────────────────────

type DocStatus = "pending" | "under_review" | "approved" | "rejected" | "expired"

type DocCategory =
  | "entity_formation"
  | "government_id"
  | "accreditation"
  | "aml_kyc"
  | "tax"
  | "operating_agreement"
  | "financial_statement"
  | "other"

interface ComplianceDocument {
  id: string
  name: string
  category: DocCategory
  fileSize: number
  mimeType: string
  uploadedAt: string
  status: DocStatus
  reviewer?: string
  reviewNote?: string
  reviewedAt?: string
  expiresAt?: string
}

interface ComplianceRequirement {
  id: string
  label: string
  category: DocCategory
  required: boolean
  description: string
  icon: React.ReactNode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: "req-1",
    label: "Entity Formation Document",
    category: "entity_formation",
    required: true,
    description: "Articles of Incorporation, Certificate of Formation, or equivalent.",
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: "req-2",
    label: "Government-Issued ID",
    category: "government_id",
    required: true,
    description: "Passport or driver's license for all principals.",
    icon: <User className="w-4 h-4" />,
  },
  {
    id: "req-3",
    label: "Accreditation Letter",
    category: "accreditation",
    required: true,
    description: "CPA or attorney letter confirming accredited investor status.",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    id: "req-4",
    label: "AML / KYC Documentation",
    category: "aml_kyc",
    required: true,
    description: "Anti-money laundering and know-your-customer compliance records.",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: "req-5",
    label: "Tax Documentation (W-9 / W-8)",
    category: "tax",
    required: true,
    description: "IRS tax form for domestic (W-9) or foreign (W-8BEN/W-8BEN-E) entities.",
    icon: <Landmark className="w-4 h-4" />,
  },
  {
    id: "req-6",
    label: "Operating Agreement",
    category: "operating_agreement",
    required: false,
    description: "LLC or LP operating/partnership agreement, if applicable.",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "req-7",
    label: "Financial Statement",
    category: "financial_statement",
    required: false,
    description: "Most recent audited or reviewed financial statement.",
    icon: <FileText className="w-4 h-4" />,
  },
]

const CATEGORY_LABELS: Record<DocCategory, string> = {
  entity_formation: "Entity Formation",
  government_id: "Government ID",
  accreditation: "Accreditation",
  aml_kyc: "AML / KYC",
  tax: "Tax Documentation",
  operating_agreement: "Operating Agreement",
  financial_statement: "Financial Statement",
  other: "Other",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusConfig(status: DocStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      }
    case "rejected":
      return {
        label: "Rejected",
        icon: <XCircle className="w-3.5 h-3.5" />,
        className: "border-red-500/30 bg-red-500/10 text-red-300",
      }
    case "under_review":
      return {
        label: "Under Review",
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
        className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      }
    case "expired":
      return {
        label: "Expired",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      }
    default:
      return {
        label: "Pending Review",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
      }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComplianceScore({ documents, requirements }: { documents: ComplianceDocument[]; requirements: ComplianceRequirement[] }) {
  const required = requirements.filter((r) => r.required)
  const satisfied = required.filter((r) =>
    documents.some((d) => d.category === r.category && d.status === "approved")
  )
  const score = required.length === 0 ? 0 : Math.round((satisfied.length / required.length) * 100)

  const scoreColor =
    score === 100 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"
  const barColor =
    score === 100 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"

  return (
    <Card className="bg-slate-900/70 border border-slate-700/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-slate-400">Compliance Score</p>
          <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{score}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {satisfied.length} of {required.length} required documents approved
        </p>
      </CardContent>
    </Card>
  )
}

function RequirementChecklist({
  documents,
  requirements,
  onCategorySelect,
}: {
  documents: ComplianceDocument[]
  requirements: ComplianceRequirement[]
  onCategorySelect: (cat: DocCategory) => void
}) {
  return (
    <Card className="bg-slate-900/70 border border-slate-700/60">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm text-slate-200 uppercase tracking-widest font-medium">
          Required Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-2">
        {requirements.map((req) => {
          const uploaded = documents.filter((d) => d.category === req.category)
          const approved = uploaded.some((d) => d.status === "approved")
          const inReview = uploaded.some((d) => d.status === "under_review" || d.status === "pending")

          return (
            <button
              key={req.id}
              onClick={() => onCategorySelect(req.category)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-800/70 transition-colors text-left group"
            >
              <div
                className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border ${
                  approved
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : inReview
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                    : "border-slate-600 bg-slate-800 text-slate-500"
                }`}
              >
                {approved ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : inReview ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${approved ? "text-slate-200" : "text-slate-300"}`}>
                  {req.label}
                </p>
                <p className="text-xs text-slate-500 truncate">{req.description}</p>
              </div>
              {req.required && !approved && (
                <span className="text-xs text-red-400/70 shrink-0">Required</span>
              )}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function DocumentCard({
  doc,
  onDelete,
  onMarkReviewed,
}: {
  doc: ComplianceDocument
  onDelete: (id: string) => void
  onMarkReviewed: (id: string, status: DocStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = statusConfig(doc.status)

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{doc.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {CATEGORY_LABELS[doc.category]} · {formatFileSize(doc.fileSize)} ·{" "}
            {new Date(doc.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={`shrink-0 flex items-center gap-1 border text-xs font-normal ${cfg.className}`}>
          {cfg.icon}
          {cfg.label}
        </Badge>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {doc.status === "pending" && (
          <>
            <Button
              size="sm"
              className="flex-1 bg-emerald-700/70 hover:bg-emerald-600/80 text-white border-0 text-xs"
              onClick={() => onMarkReviewed(doc.id, "approved")}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-700/40 hover:bg-red-600/50 text-red-200 border-0 text-xs"
              onClick={() => onMarkReviewed(doc.id, "rejected")}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 bg-slate-800/50 text-slate-300 text-xs"
              onClick={() => onMarkReviewed(doc.id, "under_review")}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Send for Review
            </Button>
          </>
        )}
        {doc.status === "under_review" && (
          <>
            <Button
              size="sm"
              className="flex-1 bg-emerald-700/70 hover:bg-emerald-600/80 text-white border-0 text-xs"
              onClick={() => onMarkReviewed(doc.id, "approved")}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-700/40 hover:bg-red-600/50 text-red-200 border-0 text-xs"
              onClick={() => onMarkReviewed(doc.id, "rejected")}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
          </>
        )}
        {(doc.status === "approved" || doc.status === "rejected") && (
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 bg-slate-800/50 text-slate-300 text-xs"
            onClick={() => onMarkReviewed(doc.id, "pending")}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Status
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 bg-slate-800/50 text-slate-300 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-500/30 bg-red-500/10 text-red-300 text-xs hover:bg-red-500/20"
          onClick={() => onDelete(doc.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700/60 space-y-2 text-xs text-slate-400">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="uppercase tracking-widest text-slate-500 text-[10px]">Category</p>
              <p className="text-slate-200 mt-0.5">{CATEGORY_LABELS[doc.category]}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-slate-500 text-[10px]">Uploaded</p>
              <p className="text-slate-200 mt-0.5">{new Date(doc.uploadedAt).toLocaleString()}</p>
            </div>
            {doc.reviewedAt && (
              <div>
                <p className="uppercase tracking-widest text-slate-500 text-[10px]">Reviewed</p>
                <p className="text-slate-200 mt-0.5">{new Date(doc.reviewedAt).toLocaleString()}</p>
              </div>
            )}
            {doc.reviewer && (
              <div>
                <p className="uppercase tracking-widest text-slate-500 text-[10px]">Reviewed By</p>
                <p className="text-slate-200 mt-0.5">{doc.reviewer}</p>
              </div>
            )}
          </div>
          {doc.reviewNote && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 mt-2">
              <p className="uppercase tracking-widest text-slate-500 text-[10px] mb-1">Review Note</p>
              <p className="text-slate-300">{doc.reviewNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComplianceHub() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | "all">("all")
  const [uploadCategory, setUploadCategory] = useState<DocCategory>("entity_formation")
  const [filterStatus, setFilterStatus] = useState<DocStatus | "all">("all")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true)
      const arr = Array.from(files)
      const newDocs: ComplianceDocument[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        category: uploadCategory,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      }))
      // Simulate a brief upload delay
      await new Promise((r) => setTimeout(r, 800))
      setDocuments((prev) => [...prev, ...newDocs])
      setUploading(false)
    },
    [uploadCategory],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = ""
    }
  }

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const handleMarkReviewed = (id: string, status: DocStatus) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              reviewedAt: new Date().toISOString(),
              reviewer: "Compliance Officer",
              reviewNote:
                status === "approved"
                  ? "Document verified and meets all requirements."
                  : status === "rejected"
                  ? "Document does not meet compliance requirements. Please resubmit."
                  : "Document submitted for internal compliance review.",
            }
          : d,
      ),
    )
  }

  const filteredDocs = documents.filter((d) => {
    const catMatch = selectedCategory === "all" || d.category === selectedCategory
    const statusMatch = filterStatus === "all" || d.status === filterStatus
    return catMatch && statusMatch
  })

  const pendingCount = documents.filter((d) => d.status === "pending").length
  const approvedCount = documents.filter((d) => d.status === "approved").length
  const rejectedCount = documents.filter((d) => d.status === "rejected").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Compliance Hub</h2>
            <p className="text-sm text-slate-400">Upload, track, and review all required compliance documentation.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Documents stored securely</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Review", value: pendingCount, color: "text-slate-300" },
          { label: "Approved", value: approvedCount, color: "text-emerald-400" },
          { label: "Rejected", value: rejectedCount, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-900/70 border border-slate-700/60">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold tabular-nums mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar: score + checklist */}
        <div className="lg:col-span-1 space-y-4">
          <ComplianceScore documents={documents} requirements={REQUIREMENTS} />
          <RequirementChecklist
            documents={documents}
            requirements={REQUIREMENTS}
            onCategorySelect={(cat) => setSelectedCategory(cat)}
          />
        </div>

        {/* Right: upload + document list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload zone */}
          <Card className="bg-slate-900/70 border border-slate-700/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">Document Category</p>
                  <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocCategory)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {(Object.entries(CATEGORY_LABELS) as [DocCategory, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-slate-200 focus:bg-slate-800 focus:text-white">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-5">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : "Browse Files"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.xlsx,.xls"
                    onChange={handleFileInput}
                  />
                </div>
              </div>

              {/* Drag-and-drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center ${
                  isDragOver
                    ? "border-blue-400/70 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/40"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-sm text-slate-300">Uploading files...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <p className="text-sm text-slate-300 font-medium">Drop files here</p>
                    <p className="text-xs text-slate-500">PDF, DOCX, PNG, JPG, XLSX — up to 25 MB each</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filter bar */}
          {documents.length > 0 && (
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as DocCategory | "all")}>
                <SelectTrigger className="w-52 bg-slate-900/70 border-slate-700 text-slate-300 text-sm">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-slate-200 focus:bg-slate-800">All Categories</SelectItem>
                  {(Object.entries(CATEGORY_LABELS) as [DocCategory, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-slate-200 focus:bg-slate-800">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as DocStatus | "all")}>
                <SelectTrigger className="w-44 bg-slate-900/70 border-slate-700 text-slate-300 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-slate-200 focus:bg-slate-800">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-slate-200 focus:bg-slate-800">Pending</SelectItem>
                  <SelectItem value="under_review" className="text-slate-200 focus:bg-slate-800">Under Review</SelectItem>
                  <SelectItem value="approved" className="text-slate-200 focus:bg-slate-800">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-slate-200 focus:bg-slate-800">Rejected</SelectItem>
                  <SelectItem value="expired" className="text-slate-200 focus:bg-slate-800">Expired</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-500 ml-auto">{filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Document cards */}
          {filteredDocs.length > 0 ? (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={handleDelete}
                  onMarkReviewed={handleMarkReviewed}
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No documents uploaded yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Select a category and upload your first compliance document above.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
              <p className="text-slate-400 text-sm">No documents match the selected filters.</p>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Compliance notes */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Compliance Notes</p>
        <ul className="space-y-1.5 text-xs text-slate-400">
          <li className="flex items-start gap-2"><span className="text-slate-600 mt-0.5">—</span> All documents are reviewed internally before capital decisions are made.</li>
          <li className="flex items-start gap-2"><span className="text-slate-600 mt-0.5">—</span> Required documents must be approved before an account can be fully cleared for capital deployment.</li>
          <li className="flex items-start gap-2"><span className="text-slate-600 mt-0.5">—</span> Rejected documents must be resubmitted with corrections noted in the review.</li>
          <li className="flex items-start gap-2"><span className="text-slate-600 mt-0.5">—</span> All submissions are logged with timestamps for audit trail purposes.</li>
        </ul>
      </div>
    </div>
  )
}
