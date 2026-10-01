"use client"

import { useEffect, useRef } from "react"
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
import { useAuth } from "@/hooks/use-auth"
import { Deals } from "@/components/deals"
import { Matchmaking } from "@/components/matchmaking"

type AccessSection = "overview" | "deals" | "matchmaking"

interface CapIVAccessProps {
  selectedDeal: string | null
  onDealSelect: (deal: string | null) => void
  defaultTab?: AccessSection
}

const sectionNav: { id: AccessSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "deals", label: "Deal Marketplace" },
  { id: "matchmaking", label: "Matchmaking" },
]

const featureCards = [
  {
    icon: Building2,
    title: "Deal Marketplace",
    subtitle: "Discover Opportunities",
    description: "Browse verified deals curated by region, asset class, and structure. Discover opportunities that match your capital strategy.",
    section: "deals" as AccessSection,
  },
  {
    icon: Users,
    title: "Investor Network",
    subtitle: "Collaborate with Confidence",
    description: "Engage with verified investors, funds, and family offices.",
    section: "matchmaking" as AccessSection,
  },
  {
    icon: RefreshCw,
    title: "Matchmaking Engine",
    subtitle: "Precision Pairing",
    description: "AI-powered matching of deals and capital profiles for intelligent outcomes.",
    section: "matchmaking" as AccessSection,
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
    section: "matchmaking" as AccessSection,
  },
  {
    icon: BarChart3,
    title: "CapIV EQ",
    subtitle: "Scale What's Winning",
    description: "View analytics and run calculators without leaving the command plane.",
    href: "/core?tab=eq",
  },
]

export function CapIVAccess({ defaultTab = "overview" }: CapIVAccessProps) {
  const router = useRouter()
  const { user } = useAuth()
  const sectionRefs = useRef<Record<AccessSection, HTMLDivElement | null>>({
    overview: null,
    deals: null,
    matchmaking: null,
  })

  const firstName = user?.name?.split(" ")[0] || "User"

  const scrollToSection = (section: AccessSection) => {
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (defaultTab && defaultTab !== "overview") {
      scrollToSection(defaultTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTab])

  const handleCardClick = (card: (typeof featureCards)[number]) => {
    if (card.section) {
      scrollToSection(card.section)
      return
    }
    if (card.href) {
      router.push(card.href)
    }
  }

  return (
    <div className="flex-1 bg-slate-900 text-white overflow-y-auto">
      {/* Sticky section nav */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
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

      <div className="max-w-6xl mx-auto p-8 space-y-16">
        {/* Overview */}
        <div
          id="overview"
          ref={(el) => {
            sectionRefs.current.overview = el
          }}
          className="space-y-12 scroll-mt-24"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome, {firstName}</h1>
            <p className="text-xl text-white mb-2">
              This is CapIV™ Access — your gateway to verified opportunities and intelligent deal flow.
            </p>
            <p className="text-lg text-white italic">Where relationships, credibility and capital connect.</p>
          </div>

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

          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              onClick={() => scrollToSection("deals")}
            >
              Submit a Deal
            </Button>
            <Button
              variant="outline"
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              onClick={() => scrollToSection("matchmaking")}
            >
              Request Capital Match
            </Button>
            <Button
              variant="outline"
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              onClick={() => scrollToSection("matchmaking")}
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
        </div>

        {/* Deal Marketplace */}
        <div
          id="deals"
          ref={(el) => {
            sectionRefs.current.deals = el
          }}
          className="-mx-8 border-t border-slate-800 pt-10 scroll-mt-24"
        >
          <Deals />
        </div>

        {/* Matchmaking */}
        <div
          id="matchmaking"
          ref={(el) => {
            sectionRefs.current.matchmaking = el
          }}
          className="-mx-8 border-t border-slate-800 pt-10 scroll-mt-24"
        >
          <Matchmaking />
        </div>

        <div className="text-center pb-6">
          <p className="text-sm text-gray-400">CapIV™ Access — Empowering You. Building Intelligent Wealth.</p>
        </div>
      </div>
    </div>
  )
}
