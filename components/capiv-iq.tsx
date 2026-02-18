"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, LineChart, Users } from "lucide-react"
import { DueDiligence } from "@/components/due-diligence"
import { Underwriting } from "@/components/underwriting"
import { Matchmaking } from "@/components/matchmaking"

type IQTab = "due-diligence" | "underwriting" | "matchmaking"

interface CapIVIQWorkspaceProps {
  defaultTab?: IQTab
}

export function CapIVIQWorkspace({ defaultTab = "due-diligence" }: CapIVIQWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<IQTab>(defaultTab)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  return (
    <div className="min-h-full px-8 py-10 space-y-8">
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

      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as IQTab)} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <TabsTrigger
            value="due-diligence"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Diligence Hub
          </TabsTrigger>
          <TabsTrigger
            value="underwriting"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Underwriting Lab
          </TabsTrigger>
          <TabsTrigger
            value="matchmaking"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Matchmaking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="due-diligence" className="space-y-6">
          <DueDiligence selectedDocument={selectedDocument} onDocumentSelect={setSelectedDocument} />
        </TabsContent>
        <TabsContent value="underwriting" className="space-y-6">
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
        </TabsContent>
        <TabsContent value="matchmaking" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
