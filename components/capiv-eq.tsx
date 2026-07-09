"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, AlertCircle, Settings, Lock, LogOut, Shield } from "lucide-react"

type EQTab = "governance" | "rules" | "decisions" | "overrides"

interface GovernanceRule {
  id: string
  name: string
  category: "source" | "asset" | "jurisdiction" | "risk"
  condition: string
  action: "allow" | "reject" | "conditional"
  priority: number
}

interface CapitalDecision {
  id: string
  capital: string
  source: string
  assetClass: string
  jurisdiction: string
  riskLevel: string
  status: "approved" | "rejected" | "conditional"
  reason: string
  timestamp: string
}

interface Override {
  id: string
  decision: string
  authority: string
  reason: string
  approvedBy: string
  timestamp: string
}

const mockRules: GovernanceRule[] = [
  {
    id: "rule-1",
    name: "Accredited Investor Only",
    category: "source",
    condition: "Source must be accredited investor",
    action: "conditional",
    priority: 1,
  },
  {
    id: "rule-2",
    name: "No High-Risk Assets in Core Portfolio",
    category: "asset",
    condition: "Asset class must not exceed 30% risk rating",
    action: "reject",
    priority: 2,
  },
  {
    id: "rule-3",
    name: "US Jurisdictions Only",
    category: "jurisdiction",
    condition: "Capital deployment limited to US jurisdictions",
    action: "allow",
    priority: 1,
  },
]

const mockDecisions: CapitalDecision[] = [
  {
    id: "dec-1",
    capital: "$2.5M",
    source: "Institutional Fund A",
    assetClass: "Real Estate",
    jurisdiction: "California",
    riskLevel: "Medium",
    status: "approved",
    reason: "Meets all governance criteria. Accredited source, domestic jurisdiction, acceptable risk profile.",
    timestamp: "2 days ago",
  },
  {
    id: "dec-2",
    capital: "$850K",
    source: "Individual Investor B",
    assetClass: "Private Equity",
    jurisdiction: "Delaware",
    riskLevel: "High",
    status: "conditional",
    reason: "High-risk asset class. Conditional approval pending risk mitigation documentation.",
    timestamp: "1 day ago",
  },
]

const mockOverrides: Override[] = [
  {
    id: "ovr-1",
    decision: "dec-2",
    authority: "Chief Risk Officer",
    reason: "Additional documentation provided. Risk mitigated.",
    approvedBy: "Sarah Chen",
    timestamp: "1 day ago",
  },
]

export function CapIVEQWorkspace({ defaultTab = "governance" }: { defaultTab?: EQTab }) {
  const [activeTab, setActiveTab] = useState<EQTab>(defaultTab)
  const [ruleInputs, setRuleInputs] = useState({
    name: "",
    category: "source" as GovernanceRule["category"],
    condition: "",
    action: "allow" as GovernanceRule["action"],
  })

  return (
    <div className="min-h-full px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-500/20 p-4">
            <Shield className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-200/70">CapIV™ EQ</p>
            <h1 className="text-3xl font-semibold text-white mt-1">Capital Governance Plane</h1>
            <p className="text-slate-300 mt-1">
              Define rules, classify capital sources, enforce constraints, and make intelligent governance decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as EQTab)} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <TabsTrigger
            value="governance"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Governance Rules
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Rule Editor
          </TabsTrigger>
          <TabsTrigger
            value="decisions"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Decisions Log
          </TabsTrigger>
          <TabsTrigger
            value="overrides"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
          >
            Overrides
          </TabsTrigger>
        </TabsList>

        {/* Governance Rules Tab */}
        <TabsContent value="governance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {mockRules.map((rule) => (
              <Card key={rule.id} className="bg-slate-900/80 border border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Lock className="w-5 h-5 text-blue-300" />
                      {rule.name}
                    </CardTitle>
                  </div>
                  <Badge
                    className={
                      rule.action === "allow"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : rule.action === "reject"
                          ? "bg-red-500/20 text-red-200"
                          : "bg-amber-500/20 text-amber-200"
                    }
                  >
                    {rule.action === "allow" ? "Allow" : rule.action === "reject" ? "Reject" : "Conditional"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-slate-400">Category</p>
                      <p className="font-semibold text-white capitalize">{rule.category}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Priority</p>
                      <p className="font-semibold text-white">Level {rule.priority}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Condition</p>
                    <p className="text-slate-200">{rule.condition}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rule Editor Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-blue-300" />
                Create Governance Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule-name" className="text-slate-300">
                  Rule Name
                </Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., Minimum Investment Threshold"
                  value={ruleInputs.name}
                  onChange={(e) => setRuleInputs((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule-category" className="text-slate-300">
                    Category
                  </Label>
                  <Select value={ruleInputs.category} onValueChange={(v) => setRuleInputs((prev) => ({ ...prev, category: v as GovernanceRule["category"] }))}>
                    <SelectTrigger className="mt-2 bg-slate-950 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source">Capital Source</SelectItem>
                      <SelectItem value="asset">Asset Class</SelectItem>
                      <SelectItem value="jurisdiction">Jurisdiction</SelectItem>
                      <SelectItem value="risk">Risk Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rule-action" className="text-slate-300">
                    Action
                  </Label>
                  <Select value={ruleInputs.action} onValueChange={(v) => setRuleInputs((prev) => ({ ...prev, action: v as GovernanceRule["action"] }))}>
                    <SelectTrigger className="mt-2 bg-slate-950 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="rule-condition" className="text-slate-300">
                  Rule Condition
                </Label>
                <textarea
                  id="rule-condition"
                  placeholder="Define the specific condition or constraint..."
                  value={ruleInputs.condition}
                  onChange={(e) => setRuleInputs((prev) => ({ ...prev, condition: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-24"
                />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Save Governance Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decisions Log Tab */}
        <TabsContent value="decisions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {mockDecisions.map((decision) => (
              <Card key={decision.id} className="bg-slate-900/80 border border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    {decision.status === "approved" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {decision.status === "rejected" && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    {decision.status === "conditional" && (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <CardTitle className="text-white">{decision.source}</CardTitle>
                      <p className="text-sm text-slate-400">{decision.capital} • {decision.timestamp}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      decision.status === "approved"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : decision.status === "rejected"
                          ? "bg-red-500/20 text-red-200"
                          : "bg-amber-500/20 text-amber-200"
                    }
                  >
                    {decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-slate-400">Asset Class</p>
                      <p className="font-semibold text-white">{decision.assetClass}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Jurisdiction</p>
                      <p className="font-semibold text-white">{decision.jurisdiction}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Risk Level</p>
                      <p className="font-semibold text-white">{decision.riskLevel}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">ID</p>
                      <p className="font-semibold text-white text-xs">{decision.id}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                    <p className="text-sm text-slate-300">{decision.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overrides Tab */}
        <TabsContent value="overrides" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {mockOverrides.map((override) => (
              <Card key={override.id} className="bg-slate-900/80 border border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <LogOut className="w-5 h-5 text-purple-300" />
                      Override Authority: {override.authority}
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">Decision {override.decision} • {override.timestamp}</p>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-200">Approved</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-slate-400">Approved By</p>
                      <p className="font-semibold text-white">{override.approvedBy}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Override Reason</p>
                    <p className="text-slate-200">{override.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Note */}
      <Card className="bg-blue-500/10 border border-blue-500/30">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-200">
            <strong>CapIV EQ</strong> is the governance plane. It classifies capital sources, applies eligibility rules,
            enforces constraints, allows rejection or conditional approval, logs decisions, and provides override
            authority. Capital decisions are logged and auditable.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
