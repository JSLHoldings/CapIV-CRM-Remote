"use client"

import { useState, useCallback, useRef } from "react"
import {
  Brain,
  Upload,
  FileCheck,
  AlertCircle,
  Shield,
  FileText,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

interface UploadedDocument {
  id: string
  pathname: string
  filename: string
  size: number
  type: string
  uploadedAt: string
  status: "pending" | "analyzing" | "analyzed" | "error"
  analysis?: DocumentAnalysis
  error?: string
}

interface DocumentAnalysis {
  extractedData: {
    documentType: string | null
    parties: string[]
    effectiveDate: string | null
    expirationDate: string | null
    totalValue: string | null
    keyTerms: string[]
    propertyAddress: string | null
    investmentAmount: string | null
  }
  riskAssessment: {
    score: number
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    factors: Array<{
      name: string
      severity: "low" | "medium" | "high"
      description: string
    }>
  }
  complianceChecks: Array<{
    item: string
    status: "pass" | "fail" | "warning" | "not_applicable"
    notes: string | null
  }>
  summary: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getRiskColor(level: string): string {
  switch (level) {
    case "LOW":
      return "text-emerald-400"
    case "MEDIUM":
      return "text-amber-400"
    case "HIGH":
      return "text-orange-400"
    case "CRITICAL":
      return "text-red-400"
    default:
      return "text-slate-400"
  }
}

function getRiskBgColor(level: string): string {
  switch (level) {
    case "LOW":
      return "bg-emerald-500"
    case "MEDIUM":
      return "bg-amber-500"
    case "HIGH":
      return "bg-orange-500"
    case "CRITICAL":
      return "bg-red-500"
    default:
      return "bg-slate-500"
  }
}

function getComplianceIcon(status: string) {
  switch (status) {
    case "pass":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />
    case "fail":
      return <XCircle className="w-4 h-4 text-red-400" />
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />
    default:
      return <div className="w-4 h-4 rounded-full bg-slate-600" />
  }
}

export function AIDueDiligence() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const uploadFile = async (file: File): Promise<UploadedDocument | null> => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/due-diligence/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      return {
        id: crypto.randomUUID(),
        pathname: data.pathname,
        filename: data.filename,
        size: data.size,
        type: data.type,
        uploadedAt: data.uploadedAt,
        status: "pending",
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
      return null
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true)
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const doc = await uploadFile(file)
      if (doc) {
        setDocuments((prev) => [...prev, doc])
        toast({
          title: "Document uploaded",
          description: `${doc.filename} is ready for analysis`,
        })
      }
    }

    setUploading(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const analyzeDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "analyzing" } : d))
    )

    try {
      const response = await fetch("/api/due-diligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: doc.pathname,
          filename: doc.filename,
          fileType: doc.type,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Analysis failed")
      }

      const data = await response.json()
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "analyzed", analysis: data.analysis }
            : d
        )
      )
      setExpandedDoc(docId)
      toast({
        title: "Analysis complete",
        description: `${doc.filename} has been analyzed`,
      })
    } catch (error) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Analysis failed",
              }
            : d
        )
      )
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    if (expandedDoc === docId) setExpandedDoc(null)
    toast({
      title: "Document removed",
      description: "The document has been removed from the list",
    })
  }

  return (
    <Card className="bg-slate-900/70 border border-blue-500/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-blue-300">
            <Brain className="w-4 h-4" />
            <span>CapIV AI</span>
          </div>
          <h2 className="text-2xl font-semibold text-white">
            AI-Powered Diligence
          </h2>
          <p className="text-sm text-slate-300">
            Upload documents for automated extraction, risk scoring, compliance
            checks, and executive summaries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>256-bit encrypted storage</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
          isDragOver
            ? "border-blue-400 bg-blue-500/10"
            : "border-slate-600 hover:border-blue-500/50 hover:bg-slate-800/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-slate-200 font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-400" />
              <div>
                <p className="text-slate-200 font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  PDF, DOCX, PNG, JPG up to 25MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`bg-slate-800 border rounded-xl p-4 transition-all ${
                  expandedDoc === doc.id
                    ? "border-blue-500/50 col-span-full"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-slate-700/70 shrink-0">
                      <FileText className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(doc.size)} •{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.status === "pending" && (
                      <Badge className="border border-slate-600 bg-slate-700/50 text-slate-300">
                        Pending
                      </Badge>
                    )}
                    {doc.status === "analyzing" && (
                      <Badge className="border border-blue-500/30 bg-blue-500/10 text-blue-300">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Analyzing
                      </Badge>
                    )}
                    {doc.status === "analyzed" && doc.analysis && (
                      <Badge
                        className={`border ${
                          doc.analysis.riskAssessment.level === "LOW"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : doc.analysis.riskAssessment.level === "MEDIUM"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : doc.analysis.riskAssessment.level === "HIGH"
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                      >
                        Risk: {doc.analysis.riskAssessment.score}
                      </Badge>
                    )}
                    {doc.status === "error" && (
                      <Badge className="border border-red-500/30 bg-red-500/10 text-red-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  {doc.status === "pending" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={() => analyzeDocument(doc.id)}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </Button>
                  )}
                  {doc.status === "analyzing" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-slate-700 text-slate-300"
                      disabled
                    >
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </Button>
                  )}
                  {doc.status === "analyzed" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
                        onClick={() =>
                          setExpandedDoc(expandedDoc === doc.id ? null : doc.id)
                        }
                      >
                        {expandedDoc === doc.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Report
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            View Report
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
                        onClick={() => analyzeDocument(doc.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {doc.status === "error" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={() => analyzeDocument(doc.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Analysis
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Expanded Analysis Panel */}
                {expandedDoc === doc.id && doc.analysis && (
                  <div className="mt-6 pt-6 border-t border-slate-700 space-y-6">
                    {/* Risk Score */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                          Risk Assessment
                        </h4>
                        <span
                          className={`text-lg font-bold ${getRiskColor(
                            doc.analysis.riskAssessment.level
                          )}`}
                        >
                          {doc.analysis.riskAssessment.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress
                            value={doc.analysis.riskAssessment.score}
                            className="h-3 bg-slate-700"
                          />
                        </div>
                        <span className="text-2xl font-bold text-white w-16 text-right">
                          {doc.analysis.riskAssessment.score}
                          <span className="text-sm text-slate-400">/100</span>
                        </span>
                      </div>
                      {doc.analysis.riskAssessment.factors.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {doc.analysis.riskAssessment.factors.map(
                            (factor, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 ${
                                    factor.severity === "high"
                                      ? "bg-red-400"
                                      : factor.severity === "medium"
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                  }`}
                                />
                                <div>
                                  <span className="text-slate-200 font-medium">
                                    {factor.name}:
                                  </span>{" "}
                                  <span className="text-slate-400">
                                    {factor.description}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Extracted Data */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Extracted Data
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doc.analysis.extractedData.documentType && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Document Type
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.documentType}
                            </p>
                          </div>
                        )}
                        {doc.analysis.extractedData.parties.length > 0 && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Parties
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.parties.join(", ")}
                            </p>
                          </div>
                        )}
                        {doc.analysis.extractedData.effectiveDate && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Effective Date
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.effectiveDate}
                            </p>
                          </div>
                        )}
                        {doc.analysis.extractedData.totalValue && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Total Value
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.totalValue}
                            </p>
                          </div>
                        )}
                        {doc.analysis.extractedData.propertyAddress && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Property Address
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.propertyAddress}
                            </p>
                          </div>
                        )}
                        {doc.analysis.extractedData.investmentAmount && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 uppercase">
                              Investment Amount
                            </p>
                            <p className="text-sm text-white mt-1">
                              {doc.analysis.extractedData.investmentAmount}
                            </p>
                          </div>
                        )}
                      </div>
                      {doc.analysis.extractedData.keyTerms.length > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 uppercase mb-2">
                            Key Terms
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {doc.analysis.extractedData.keyTerms.map(
                              (term, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-slate-600/50 text-slate-200 border-slate-500/50"
                                >
                                  {term}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compliance Checks */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Compliance Checks
                      </h4>
                      <div className="space-y-2">
                        {doc.analysis.complianceChecks.map((check, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3"
                          >
                            {getComplianceIcon(check.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{check.item}</p>
                              {check.notes && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {check.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                        Executive Summary
                      </h4>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {doc.analysis.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="text-center py-8">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            No documents uploaded yet. Drop files above to get started.
          </p>
        </div>
      )}
    </Card>
  )
}
