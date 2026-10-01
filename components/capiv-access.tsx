"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Users,
  UserPlus,
  RefreshCw,
  FileText,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { Deals } from "@/components/deals"
import { Matchmaking } from "@/components/matchmaking"

type AccessTab = "overview" | "deals" | "matchmaking"

interface CapIVAccessProps {
  selectedDeal: string | null
  onDealSelect: (deal: string | null) => void
  defaultTab?: AccessTab
}

const featureCards = [
  {
    icon: Building2,
    title: "Deal Marketplace",
    subtitle: "Discover Opportunities",
    description: "Browse verified deals curated by region, asset class, and structure. Discover opportunities that match your capital strategy.",
    tab: "deals" as AccessTab,
  },
  {
    icon: Users,
    title: "Investor Network",
    subtitle: "Collaborate with Confidence",
    description: "Engage with verified investors, funds, and family offices.",
    tab: "matchmaking" as AccessTab,
  },
  {
    icon: RefreshCw,
    title: "Matchmaking Engine",
    subtitle: "Precision Pairing",
    description: "AI-powered matching of deals and capital profiles for intelligent outcomes.",
    tab: "matchmaking" as AccessTab,
  },
  {
    icon: FileText,
    title: "CapIV IQ",
    subtitle: "Transparency Meets Control",
    description: "Access NDAs, Persona verifications, and underwriting diagnostics together.",
    href: "/capiv-iq",
  },
  {
    icon: UserPlus,
    title: "Partner Invitations",
    subtitle: "Expand Your Network",
    description: "Invite co-investors, JV partners, or advisors to your trusted network.",
    tab: "matchmaking" as AccessTab,
  },
  {
    icon: BarChart3,
    title: "CapIV EQ",
    subtitle: "Scale What's Winning",
    description: "View analytics and run calculators without leaving the command plane.",
    href: "/core?tab=eq",
  },
]

export function CapIVAccess({ selectedDeal, onDealSelect, defaultTab = "overview" }: CapIVAccessProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AccessTab>(defaultTab)

  // Extract first name from user's name
  const firstName = user?.name?.split(" ")[0] || "User"

  const handleCardClick = (card: (typeof featureCards)[number]) => {
    if (card.tab) {
      setActiveTab(card.tab)
      return
    }
    if (card.href) {
      router.push(card.href)
    }
  }

  return (
    <div className="flex-1 bg-slate-900 text-white p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome, {firstName}</h1>
          <p className="text-xl text-white mb-2">
            This is CapIV™ Access — your gateway to verified opportunities and intelligent deal flow.
          </p>
          <p className="text-lg text-white italic">Where relationships, credibility and capital connect.</p>
        </div>

        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as AccessTab)} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Deal Marketplace
            </TabsTrigger>
            <TabsTrigger
              value="matchmaking"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              Matchmaking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-12">
            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((card, index) => (
                <Card
                  key={index}
                  className="bg-slate-800 border-slate-700 p-6 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <card.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                      <p className="text-blue-400 text-sm font-medium mb-3">{card.subtitle}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                onClick={() => setActiveTab("deals")}
              >
                Submit a Deal
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                onClick={() => setActiveTab("matchmaking")}
              >
                Request Capital Match
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                onClick={() => setActiveTab("matchmaking")}
              >
                Invite a Partner
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                onClick={() => router.push("/capiv-iq")}
              >
                Open CapIV IQ
              </Button>
              <Button
                variant="outline"
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                onClick={() => router.push("/core?tab=eq")}
              >
                View CapIV EQ
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                CapIV™ Access — Empowering You. Building Intelligent Wealth.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="deals" className="-mx-8">
            <Deals />
          </TabsContent>

          <TabsContent value="matchmaking" className="-mx-8">
            <Matchmaking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
