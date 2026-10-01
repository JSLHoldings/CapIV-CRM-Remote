"use client"

import { useState } from "react"
import { DueDiligence } from "@/components/due-diligence"
import { Underwriting } from "@/components/underwriting"
import { Matchmaking } from "@/components/matchmaking"

export function CapIVIQWorkspace() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">CapIV™ IQ</h1>
          <p className="text-lg text-slate-300">
            Diligence, Persona verifications, underwriting diagnostics, and matchmaking in a single pane.
          </p>
        </div>

        <DueDiligence selectedDocument={selectedDocument} onDocumentSelect={setSelectedDocument} />

        <div className="border-t border-slate-800 pt-10">
          <Underwriting />
        </div>

        <div className="border-t border-slate-800 pt-10">
          <Matchmaking />
        </div>
      </div>
    </div>
  )
}
