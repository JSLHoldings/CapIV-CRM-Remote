"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
import { useAuth } from "@/hooks/use-auth"
import { SignaturePad } from "@/components/signature-pad"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Upload,
  Trash2,
  Download,
  PenLine,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  X,
  Eye,
  Loader2,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type DocCategory =
  | "entity_formation"
  | "government_id"
  | "accreditation"
  | "aml_kyc"
  | "tax_forms"
  | "operating_agreement"
  | "financial_statement"
  | "nda"
  | "terms_of_service"
  | "other"

interface StoredDocument {
  id: string
  category: DocCategory
  file_name: string
  mime_type: string
  file_size: number
  created_at: string
  signed_at?: string | null
  signer_name?: string | null
  signature_image?: string | null
}

interface FormSigningRecord {
  id: string
  form_type: "nda" | "terms_of_service"
  signer_name: string
  signature_image: string
  signed_at: string
  status: "signed"
}

const CATEGORY_LABELS: Record<DocCategory, string> = {
  entity_formation: "Entity Formation",
  government_id: "Government ID",
  accreditation: "Accreditation Letter",
  aml_kyc: "AML / KYC",
  tax_forms: "Tax Forms (W-9 / W-8)",
  operating_agreement: "Operating Agreement",
  financial_statement: "Financial Statement",
  nda: "NDA",
  terms_of_service: "Terms of Service",
  other: "Other",
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusBadge(doc: StoredDocument) {
  if (doc.signed_at) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Signed
      </Badge>
    )
  }
  if (doc.category === "nda" || doc.category === "terms_of_service") {
    return (
      <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs">
        <Clock className="w-3 h-3 mr-1" />
        Awaiting Signature
      </Badge>
    )
  }
  return (
    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
      <FileCheck className="w-3 h-3 mr-1" />
      Uploaded
    </Badge>
  )
}

// ─── NDA / ToS placeholder text ──────────────────────────────────────────────

const FORM_CONTENT: Record<"nda" | "terms_of_service", { title: string; body: string }> = {
  nda: {
    title: "Non-Disclosure Agreement",
    body: `MUTUAL NON-DISCLOSURE AGREEMENT

This Agreement is entered into as of the date of electronic signature by and between JSL Capital Management ("JSL") and the undersigned party ("Recipient").

1. CONFIDENTIAL INFORMATION
"Confidential Information" means any and all information disclosed by either party relating to: (a) business operations and strategies; (b) financial information, including investment opportunities and deal structures; (c) investor information and relationships; (d) proprietary methodologies; (e) market analyses; and (f) any information marked as confidential.

2. OBLIGATIONS
Recipient agrees to: (a) maintain confidentiality of all Confidential Information; (b) use it solely for evaluating potential business relationships with JSL; (c) not disclose it to any third party; (d) protect it with at least the same care as its own confidential information.

3. EXCLUSIONS
Excludes information that: (a) is publicly available through no breach hereof; (b) was rightfully in Recipient's possession prior to disclosure; (c) is received from a third party without breach; (d) is independently developed without use of Confidential Information.

4. TERM
This Agreement remains in effect for five (5) years from the date of signature. Confidentiality obligations survive termination.

5. GOVERNING LAW
This Agreement is governed by the laws of the State of Delaware.

— PLACEHOLDER — Final NDA language to be provided by JSL legal counsel before launch.`,
  },
  terms_of_service: {
    title: "Terms of Service",
    body: `CAPIV™ PLATFORM TERMS OF SERVICE

Effective upon electronic signature.

1. ACCEPTANCE
By signing below, you agree to be bound by these Terms of Service governing your use of the CapIV™ platform operated by JSL Capital Management.

2. PLATFORM USE
The CapIV™ platform is provided for qualified investors and capital market participants. Use is restricted to lawful purposes in accordance with applicable securities laws.

3. NO INVESTMENT ADVICE
Nothing on the platform constitutes investment advice, a solicitation, or an offer to buy or sell securities. All decisions are made independently by the user.

4. CONFIDENTIALITY
All deal materials, financial models, and counterparty information accessed through the platform are confidential and subject to the separately executed NDA.

5. INTELLECTUAL PROPERTY
All platform content, workflows, algorithms, and proprietary methodologies are the exclusive property of JSL Capital Management.

6. LIMITATION OF LIABILITY
JSL Capital Management's aggregate liability shall not exceed the fees paid by the user in the preceding twelve (12) months.

7. GOVERNING LAW
These Terms are governed by the laws of the State of Delaware.

— PLACEHOLDER — Final Terms of Service language to be provided by JSL legal counsel before launch.`,
  },
}

// ─── Document Row ─────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  onDelete,
  onSign,
  onPreview,
}: {
  doc: StoredDocument
  onDelete: (id: string) => void
  onSign: (doc: StoredDocument) => void
  onPreview: (doc: StoredDocument) => void
}) {
  const needsSignature =
    (doc.category === "nda" || doc.category === "terms_of_service") && !doc.signed_at

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
        <FileText className="w-5 h-5 text-blue-300" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{doc.file_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{CATEGORY_LABELS[doc.category]}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">{formatBytes(doc.file_size)}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">
            {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
        {doc.signed_at && doc.signer_name && (
          <p className="text-xs text-emerald-400 mt-0.5">
            Signed by {doc.signer_name} on {new Date(doc.signed_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {statusBadge(doc)}
        {needsSignature && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSign(doc)}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 h-8 text-xs"
          >
            <PenLine className="w-3.5 h-3.5 mr-1" />
            Sign
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onPreview(doc)}
          className="text-slate-400 hover:text-slate-200 h-8 w-8"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(doc.id)}
          className="text-slate-500 hover:text-red-400 h-8 w-8"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onUpload }: { onUpload: (files: File[], category: DocCategory) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [category, setCategory] = useState<DocCategory>("other")
  const [staged, setStaged] = useState<File[]>([])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) setStaged((prev) => [...prev, ...files])
  }

  const handleConfirm = () => {
    if (!staged.length) return
    onUpload(staged, category)
    setStaged([])
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-sm">Document Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {(Object.entries(CATEGORY_LABELS) as [DocCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-slate-200 focus:bg-slate-700">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/40"
        }`}
      >
        <Upload className="w-8 h-8 text-slate-500" />
        <p className="text-sm text-slate-400">
          Drag &amp; drop files here, or <span className="text-blue-400 underline">browse</span>
        </p>
        <p className="text-xs text-slate-600">PDF, DOC, DOCX, JPG, PNG — max 10 MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) setStaged((prev) => [...prev, ...files])
            e.target.value = ""
          }}
        />
      </div>

      {staged.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{staged.length} file(s) staged for upload:</p>
          {staged.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 truncate max-w-xs">{f.name}</span>
                <span className="text-xs text-slate-500">({formatBytes(f.size)})</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setStaged((prev) => prev.filter((_, idx) => idx !== i)) }}
                className="h-6 w-6 text-slate-500 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-500 text-white w-full rounded-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload {staged.length} File{staged.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Form Signing Panel ───────────────────────────────────────────────────────

function FormSigningPanel({
  formType,
  existingRecord,
  onSigned,
}: {
  formType: "nda" | "terms_of_service"
  existingRecord: FormSigningRecord | null
  onSigned: (record: FormSigningRecord) => void
}) {
  const [signerName, setSignerName] = useState("")
  const [signatureImage, setSignatureImage] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const form = FORM_CONTENT[formType]

  const handleSign = async () => {
    setError("")
    if (!signerName.trim()) { setError("Please enter your full legal name."); return }
    if (!signatureImage) { setError("Please draw your signature."); return }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    const record: FormSigningRecord = {
      id: crypto.randomUUID(),
      form_type: formType,
      signer_name: signerName.trim(),
      signature_image: signatureImage,
      signed_at: new Date().toISOString(),
      status: "signed",
    }
    onSigned(record)
    setSaving(false)
  }

  if (existingRecord) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Signed</p>
            <p className="text-xs text-emerald-400/70">
              By {existingRecord.signer_name} on{" "}
              {new Date(existingRecord.signed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">Signature on file</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingRecord.signature_image}
            alt="Signature"
            className="max-h-16 rounded border border-slate-700 bg-white p-1"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Placeholder notice */}
      <div className="rounded-lg border border-amber-400/30 bg-amber-400/8 p-3">
        <p className="text-xs text-amber-400/80">
          Placeholder document — final legal language to be provided by JSL counsel before launch.
        </p>
      </div>

      {/* Document body */}
      <ScrollArea className="h-56 rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
          {form.body}
        </pre>
      </ScrollArea>

      {/* Signature capture */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-sm">Full Legal Name *</Label>
          <Input
            placeholder="Type your full legal name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-sm">Draw Signature *</Label>
          <div className="rounded-xl border border-slate-700 bg-white overflow-hidden">
            <SignaturePad onChange={setSignatureImage} />
          </div>
          <p className="text-xs text-slate-600">
            Draw your signature above. By signing, you agree this is a legally binding electronic signature.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSign}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenLine className="w-4 h-4 mr-2" />}
        Sign {form.title}
      </Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentVault() {
  const { user } = useAuth()
  const supabase = createClient()

  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [signingRecords, setSigningRecords] = useState<Record<string, FormSigningRecord>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null)
  const [signDoc, setSignDoc] = useState<StoredDocument | null>(null)
  const [filterCategory, setFilterCategory] = useState<DocCategory | "all">("all")

  // Load documents from Supabase
  const loadDocuments = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from("documents")
      .select("id, category, file_name, mime_type, file_size, created_at, signed_at, signer_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDocuments(data as StoredDocument[])
    }
    setLoading(false)
  }, [user?.id, supabase])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // Load signing records from profiles
  const loadSigningRecords = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from("profiles")
      .select("nda_signature, nda_signature_name, nda_signed_at")
      .eq("id", user.id)
      .single()

    if (data?.nda_signed_at && data.nda_signature_name) {
      setSigningRecords({
        nda: {
          id: "nda-profile",
          form_type: "nda",
          signer_name: data.nda_signature_name,
          signature_image: data.nda_signature || "",
          signed_at: data.nda_signed_at,
          status: "signed",
        },
      })
    }
  }, [user?.id, supabase])

  useEffect(() => { loadSigningRecords() }, [loadSigningRecords])

  // Upload files
  const handleUpload = async (files: File[], category: DocCategory) => {
    if (!user?.id || !files.length) return
    setUploading(true)

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue // 10 MB limit

      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      await supabase.from("documents").insert({
        user_id: user.id,
        category,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        file_data: fileData,
      })

      void logActivity({
        action: "Uploaded a document",
        category: "documents",
        metadata: { file_name: file.name, doc_category: category },
      })
    }

    await loadDocuments()
    setUploading(false)
  }

  // Delete document
  const handleDelete = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  // Sign an uploaded NDA/ToS doc
  const handleSignDoc = async (signerName: string, signatureImage: string) => {
    if (!signDoc || !user?.id) return
    await supabase
      .from("documents")
      .update({ signed_at: new Date().toISOString(), signer_name: signerName, signature_image: signatureImage })
      .eq("id", signDoc.id)
    void logActivity({
      action: "Signed a document",
      category: "documents",
      metadata: { file_name: signDoc.file_name, signer_name: signerName },
    })
    setSignDoc(null)
    await loadDocuments()
  }

  // Save form signing record
  const handleFormSigned = async (record: FormSigningRecord) => {
    if (!user?.id) return
    if (record.form_type === "nda") {
      await supabase.from("profiles").update({
        nda_signed: true,
        nda_signature: record.signature_image,
        nda_signature_name: record.signer_name,
        nda_signed_at: record.signed_at,
      }).eq("id", user.id)
    }
    // Store terms_of_service in localStorage since there's no dedicated column yet
    if (record.form_type === "terms_of_service") {
      localStorage.setItem(`tos_signed_${user.id}`, JSON.stringify(record))
    }
    setSigningRecords((prev) => ({ ...prev, [record.form_type]: record }))
  }

  // Load ToS from localStorage
  useEffect(() => {
    if (!user?.id) return
    const raw = localStorage.getItem(`tos_signed_${user.id}`)
    if (raw) {
      try {
        const record = JSON.parse(raw) as FormSigningRecord
        setSigningRecords((prev) => ({ ...prev, terms_of_service: record }))
      } catch { /* ignore */ }
    }
  }, [user?.id])

  const filtered = filterCategory === "all"
    ? documents
    : documents.filter((d) => d.category === filterCategory)

  const ndaSigned = !!signingRecords["nda"]
  const tosSigned = !!signingRecords["terms_of_service"]

  // ─── Sign document modal state ───
  const [modalSignerName, setModalSignerName] = useState("")
  const [modalSignatureImage, setModalSignatureImage] = useState("")
  const [modalError, setModalError] = useState("")
  const [modalSaving, setModalSaving] = useState(false)

  const handleModalSign = async () => {
    setModalError("")
    if (!modalSignerName.trim()) { setModalError("Please enter your full legal name."); return }
    if (!modalSignatureImage) { setModalError("Please draw your signature."); return }
    setModalSaving(true)
    await handleSignDoc(modalSignerName, modalSignatureImage)
    setModalSaving(false)
    setModalSignerName("")
    setModalSignatureImage("")
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: documents.length, icon: FileText, color: "blue" },
          { label: "Signed Documents", value: documents.filter((d) => d.signed_at).length, icon: CheckCircle2, color: "emerald" },
          { label: "NDA Status", value: ndaSigned ? "Signed" : "Pending", icon: PenLine, color: ndaSigned ? "emerald" : "amber" },
          { label: "ToS Status", value: tosSigned ? "Signed" : "Pending", icon: FileCheck, color: tosSigned ? "emerald" : "amber" },
        ].map((card) => (
          <Card key={card.label} className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</span>
                <card.icon className={`w-4 h-4 text-${card.color}-400`} />
              </div>
              <p className={`text-xl font-semibold text-${card.color}-300`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <TabsTrigger
            value="documents"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Document Vault
          </TabsTrigger>
          <TabsTrigger
            value="nda"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            <PenLine className="w-3.5 h-3.5 mr-1.5" />
            NDA
            {ndaSigned && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 text-emerald-400" />}
          </TabsTrigger>
          <TabsTrigger
            value="tos"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            <FileCheck className="w-3.5 h-3.5 mr-1.5" />
            Terms of Service
            {tosSigned && <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 text-emerald-400" />}
          </TabsTrigger>
        </TabsList>

        {/* ── Documents ── */}
        <TabsContent value="documents" className="mt-6 space-y-6">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Upload Documents</CardTitle>
              <CardDescription className="text-slate-400">
                Upload compliance documents, entity filings, tax forms, IDs, and more. All files are stored securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploading ? (
                <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <UploadZone onUpload={handleUpload} />
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg">Your Documents</CardTitle>
                  <CardDescription className="text-slate-400">
                    {documents.length} document{documents.length !== 1 ? "s" : ""} on file
                  </CardDescription>
                </div>
                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as DocCategory | "all")}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-200 text-sm">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-200 focus:bg-slate-700">All Categories</SelectItem>
                    {(Object.entries(CATEGORY_LABELS) as [DocCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-slate-200 focus:bg-slate-700">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading documents...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <FileText className="w-10 h-10 text-slate-700" />
                  <p className="text-sm text-slate-500">No documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDelete}
                      onSign={setSignDoc}
                      onPreview={setPreviewDoc}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NDA ── */}
        <TabsContent value="nda" className="mt-6">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PenLine className="w-5 h-5 text-blue-300" />
                Non-Disclosure Agreement
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review and sign the JSL Capital Management NDA. This signature is stored to your account permanently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormSigningPanel
                formType="nda"
                existingRecord={signingRecords["nda"] || null}
                onSigned={handleFormSigned}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Terms of Service ── */}
        <TabsContent value="tos" className="mt-6">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-300" />
                Terms of Service
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review and sign the CapIV™ platform Terms of Service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormSigningPanel
                formType="terms_of_service"
                existingRecord={signingRecords["terms_of_service"] || null}
                onSigned={handleFormSigned}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Sign Document Modal ── */}
      <Dialog open={!!signDoc} onOpenChange={(o) => { if (!o) { setSignDoc(null); setModalSignerName(""); setModalSignatureImage(""); setModalError("") } }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <PenLine className="w-5 h-5 text-blue-300" />
              Sign Document
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {signDoc?.file_name} — add your electronic signature to this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Full Legal Name *</Label>
              <Input
                placeholder="Type your full legal name"
                value={modalSignerName}
                onChange={(e) => setModalSignerName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Draw Signature *</Label>
              <div className="rounded-xl border border-slate-700 bg-white overflow-hidden">
                <SignaturePad onChange={setModalSignatureImage} />
              </div>
            </div>
            {modalError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{modalError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSignDoc(null)} className="text-slate-400 hover:text-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleModalSign}
              disabled={modalSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {modalSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenLine className="w-4 h-4 mr-2" />}
              Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview Modal ── */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => { if (!o) setPreviewDoc(null) }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-300" />
              {previewDoc?.file_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {previewDoc && CATEGORY_LABELS[previewDoc.category]} · {previewDoc && formatBytes(previewDoc.file_size)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 text-center py-6">
              Document preview is available after download.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewDoc(null)} className="text-slate-400">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
