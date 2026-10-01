"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, LineChart, Users } from "lucide-react"
import { DueDiligence } from "@/components/due-diligence"
import { Underwriting } from "@/components/underwriting"
import { Matchmaking } from "@/components/matchmaking"

type IQSection = "due-diligence" | "underwriting" | "matchmaking"

interface CapIVIQWorkspaceProps {
  defaultTab?: IQSection
}

const sectionNav: { id: IQSection; label: string }[] = [
  { id: "due-diligence", label: "Diligence Hub" },
  { id: "underwriting", label: "Underwriting Lab" },
  { id: "matchmaking", label: "Matchmaking" },
]

export function CapIVIQWorkspace({ defaultTab = "due-diligence" }: CapIVIQWorkspaceProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const sectionRefs = useRef<Record<IQSection, HTMLDivElement | null>>({
    "due-diligence": null,
    underwriting: null,
    matchmaking: null,
  })

  const scrollToSection = (section: IQSection) => {
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (defaultTab && defaultTab !== "due-diligence") {
      scrollToSection(defaultTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTab])

  return (
    <div className="min-h-full">
      {/* Sticky section nav */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-8 py-4">
        <div className="flex flex-wrap gap-2">
          {sectionNav.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="outline"
              className="rounded-full border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-500"
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-8 py-10 space-y-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-500/20 p-4">
              <Shield className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">CapIV™ IQ</p>
              <h1 className="text-3xl font-semibold text-white mt-1">Intelligence &amp; Diligence Command</h1>
              <p className="text-slate-300 mt-1">
                Govern diligence workflows, Persona verifications, and underwriting diagnostics from a single pane.
              </p>
            </div>
          </div>
        </div>

        <div
          id="due-diligence"
          ref={(el) => {
            sectionRefs.current["due-diligence"] = el
          }}
          className="-mx-8 scroll-mt-24 space-y-6"
        >
          <DueDiligence selectedDocument={selectedDocument} onDocumentSelect={setSelectedDocument} />
        </div>

        <div
          id="underwriting"
          ref={(el) => {
            sectionRefs.current.underwriting = el
          }}
          className="border-t border-slate-800 pt-10 scroll-mt-24 space-y-6"
        >
          <div className="rounded-3xl bg-gradient-to-r from-blue-600/20 via-slate-900 to-slate-900 border border-blue-500/20 p-6">
            <div className="flex items-center gap-3">
              <LineChart className="w-5 h-5 text-blue-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200/70">Deal Intelligence</p>
                <p className="text-base text-slate-200">
                  Scoring, mandate readiness, and counterparty risk weighting in one view.
                </p>
              </div>
            </div>
          </div>
          <Underwriting />
        </div>

        <div
          id="matchmaking"
          ref={(el) => {
            sectionRefs.current.matchmaking = el
          }}
          className="border-t border-slate-800 pt-10 scroll-mt-24 space-y-6"
        >
          <div className="rounded-3xl bg-gradient-to-r from-purple-500/15 via-slate-900 to-slate-900 border border-purple-500/30 p-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-200" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-purple-200/80">Relationship Graph</p>
                <p className="text-base text-slate-200">
                  Orchestrate investor + sponsor introductions alongside diligence decisions.
                </p>
              </div>
            </div>
          </div>
          <Matchmaking />
        </div>
      </div>
    </div>
  )
}
