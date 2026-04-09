"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useVerification } from "@/contexts/verification-context"
import { PersonaKYC } from "@/components/persona-kyc"
import { AIDueDiligence } from "@/components/ai-due-diligence"
import {
  FileText,
  Download,
  Eye,
  Lock,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface DueDiligenceProps {
  selectedDocument: string | null
  onDocumentSelect: (document: string | null) => void
}

const documents = [
  {
    id: "nda-001",
    name: "Non-Disclosure Agreement",
    type: "NDA",
    status: "signed",
    uploadedDate: "2024-01-15",
    expiryDate: "2024-07-15",
    size: "2.4 MB",
    icon: Lock
  },
  {
    id: "ppm-001", 
    name: "Private Placement Memorandum",
    type: "PPM",
    status: "review",
    uploadedDate: "2024-01-20",
    expiryDate: "2024-12-31",
    size: "15.2 MB",
    icon: FileText
  },
  {
    id: "kyc-001",
    name: "Know Your Customer Documentation",
    type: "KYC",
    status: "approved",
    uploadedDate: "2024-01-10",
    expiryDate: "2025-01-10",
    size: "8.7 MB",
    icon: CheckCircle
  },
  {
    id: "aml-001",
    name: "Anti-Money Laundering Report",
    type: "AML",
    status: "pending",
    uploadedDate: "2024-01-25",
    expiryDate: "2024-07-25",
    size: "3.1 MB",
    icon: AlertTriangle
  },
  {
    id: "audit-001",
    name: "Financial Audit Report 2023",
    type: "Audit",
    status: "approved",
    uploadedDate: "2024-01-05",
    expiryDate: "2024-12-31",
    size: "22.8 MB",
    icon: FileText
  },
]

const statusStyles: Record<
  string,
  {
    badge: string
  }
> = {
  signed: {
    badge: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  approved: {
    badge: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  review: {
    badge: "border border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  pending: {
    badge: "border border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  expired: {
    badge: "border border-red-500/30 bg-red-500/10 text-red-200",
  },
}

export function DueDiligence({ selectedDocument, onDocumentSelect }: DueDiligenceProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { kycCompleted, kycInquiryId } = useVerification()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [showKycDialog, setShowKycDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<(typeof documents)[number] | null>(null)
  
  const firstName = user?.name?.split(' ')[0] || 'User'
  const kycStatusBadge = kycCompleted
    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border border-amber-500/30 bg-amber-500/10 text-amber-200"
  const kycStatusLabel = kycCompleted ? "Verified" : "Verification Required"

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || doc.type === filterType
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const buildDocumentPreview = (doc: (typeof documents)[number]) => {
    return [
      `Document: ${doc.name}`,
      `Type: ${doc.type}`,
      `Status: ${doc.status}`,
      `Uploaded: ${doc.uploadedDate}`,
      `Expires: ${doc.expiryDate}`,
      `Size: ${doc.size}`,
      "",
      "CapIV IQ Diligence Note:",
      "Document pulled for verification and audit traceability.",
    ].join("\n")
  }

  const handlePullDocument = (doc: (typeof documents)[number]) => {
    const content = buildDocumentPreview(doc)
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${doc.name.replace(/\s+/g, "_").toLowerCase()}_capiv_pull.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast({
      title: "Document pulled",
      description: `${doc.name} is ready for review.`,
    })
  }

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600/30 via-slate-800 to-slate-900 border border-blue-500/20 p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Diligence Hub</h1>
              <p className="text-lg text-slate-200">
                Welcome, {firstName}. Monitor NDAs, PPMs, compliance workflows, and data room readiness across every deal.
              </p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => setShowVerificationDialog(true)}
            >
              Fill &amp; Verify Deal
            </Button>
          </div>
        </div>

        {/* Persona KYC */}
        <Card className="bg-slate-900/70 border border-blue-500/30 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Persona AML</span>
              </div>
              <h2 className="text-2xl font-semibold text-white">KYC &amp; AML Verification</h2>
              <p className="text-sm text-slate-300">
                Run regulated Persona checks for principals, sponsors, and capital partners to keep diligence audit-ready.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <span>256-bit encrypted capture with exportable audit logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <span>Bank-level AML watchlist screening via Persona workflows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <span>Link verification results to each deal room automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5" />
                  <span>Accelerate counterparty reviews with shared status signals.</span>
                </li>
              </ul>
            </div>
            <div className="w-full max-w-sm space-y-4">
              <Badge className={`${kycStatusBadge} w-full justify-center py-2 text-sm font-semibold`}>{kycStatusLabel}</Badge>
              {kycInquiryId && (
                <p className="text-xs text-slate-400">
                  Last inquiry ID:&nbsp;
                  <span className="font-mono text-slate-200">{kycInquiryId}</span>
                </p>
              )}
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setShowKycDialog(true)}>
                Launch Persona Verification
              </Button>
              <p className="text-xs text-slate-400">
                Persona verifications sync across CapIV™ Access, deal rooms, and audit exports.
              </p>
            </div>
          </div>
        </Card>

        {/* AI Due Diligence */}
        <AIDueDiligence />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FileText className="w-6 h-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-300">Total Documents</p>
                <p className="text-3xl font-semibold text-white">{documents.length}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-300">Ready to Share</p>
                <p className="text-3xl font-semibold text-white">
                  {documents.filter((d) => d.status === "approved" || d.status === "signed").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-2.5 bg-amber-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-amber-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-300">In Review</p>
                <p className="text-3xl font-semibold text-white">
                  {documents.filter((d) => d.status === "review").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-300">Action Items</p>
                <p className="text-3xl font-semibold text-white">
                  {documents.filter((d) => d.status === "pending").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <Input
              placeholder="Search documents, data rooms, or counterparties..."
              className="pl-12 bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="px-3 py-3 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="NDA">NDA</option>
              <option value="PPM">PPM</option>
              <option value="KYC">KYC</option>
              <option value="AML">AML</option>
              <option value="Audit">Audit</option>
            </select>
            <select
              className="px-3 py-3 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="signed">Signed</option>
              <option value="review">Review</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const statusStyle = statusStyles[doc.status] ?? statusStyles.pending

            return (
              <Card
                key={doc.id}
                className={`bg-slate-800 border-slate-700 p-6 transition-all hover:-translate-y-1 hover:bg-slate-750/90 hover:border-blue-500/40 cursor-pointer ${
                  selectedDocument === doc.id ? "border-2 border-blue-500/50 shadow-lg shadow-blue-500/20" : ""
                }`}
                onClick={() => onDocumentSelect(doc.id)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-xl bg-slate-700/70">
                    <doc.icon className="w-6 h-6 text-blue-300" />
                  </div>
                  <Badge className={`${statusStyle.badge} uppercase tracking-wide`}>
                    <div className="flex items-center gap-2">
                      <span>{doc.status}</span>
                    </div>
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{doc.name}</h3>
                <p className="text-sm text-slate-300 mb-4">Type: {doc.type}</p>

                <div className="space-y-2 text-sm text-slate-300/90">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uploaded</span>
                    <span>{doc.uploadedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expires</span>
                    <span>{doc.expiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size</span>
                    <span>{doc.size}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    size="sm"
                    className="flex-1 bg-slate-800/80 border border-slate-600 text-slate-200 hover:bg-blue-600/90 hover:border-blue-400 hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation()
                      setPreviewDocument(doc)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 hover:border-blue-400"
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePullDocument(doc)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Pull
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {selectedDocument && (
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-400/80">Active Selection</p>
                <h3 className="text-2xl font-semibold text-white">
                  {documents.find((doc) => doc.id === selectedDocument)?.name}
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/80">
                  Open Data Room
                </Button>
                <Button className="border border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800 hover:border-blue-400/70">
                  Assign Task
                </Button>
                <Button className="border border-blue-500/50 bg-blue-600/10 text-blue-200 hover:bg-blue-600/20">
                  Share Secure Link
                </Button>
              </div>
            </div>
          </Card>
        )}

        {filteredDocuments.length === 0 && (
          <Card className="bg-slate-900/40 border-slate-700 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No documents match your filters</h3>
            <p className="text-slate-400">Adjust your search or status filters to surface additional files.</p>
          </Card>
        )}
      </div>

      <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Persona KYC / AML Verification</DialogTitle>
            <DialogDescription className="text-slate-400">
              Launch the embedded Persona workflow to capture identity documents, liveness, and AML attestations.
            </DialogDescription>
          </DialogHeader>
          <PersonaKYC compact />
        </DialogContent>
      </Dialog>

      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Deal Verification Packet</DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill out and verify the deal you are creating or diligencing before it enters the capital stack.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-300">
            <p>Each submission should include:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-200">
              <li>Compliance Officer contact details overseeing the submission.</li>
              <li>Proof of real estate existence (title, appraisal, broker opinion, or verified imagery).</li>
              <li>Supporting documents to verify financials, entitlements, and counterparties.</li>
            </ul>
            <p className="text-slate-400">
              Upload documents into the CapIV™ Member Profile digital file so the diligence team can reference them
              instantly.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
                <Link href="/capiv-iq?tab=underwriting">Open Underwriting Lab</Link>
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => setShowVerificationDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the metadata and pull the file for distribution.
            </DialogDescription>
          </DialogHeader>
          {previewDocument && (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <p className="text-base font-semibold text-white">{previewDocument.name}</p>
                <p>Type: {previewDocument.type}</p>
                <p>Status: {previewDocument.status}</p>
                <p>Uploaded: {previewDocument.uploadedDate}</p>
                <p>Expires: {previewDocument.expiryDate}</p>
                <p>Size: {previewDocument.size}</p>
              </div>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => handlePullDocument(previewDocument)}
              >
                <Download className="w-4 h-4 mr-2" />
                Pull Document
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
