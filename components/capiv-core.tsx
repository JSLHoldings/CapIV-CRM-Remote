"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Layers3,
  Rss,
  Shield,
  Lock,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { CapIVEQWorkspace } from "@/components/capiv-eq"

type CoreSection = "overview" | "eq"

interface CapIVCoreProps {
  selectedInvestor?: string | null
  onInvestorSelect?: (investor: string | null) => void
  onDealSelect?: (deal: string | null) => void
  defaultTab?: CoreSection
}

const sectionNav: { id: CoreSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "eq", label: "CapIV EQ" },
]

const featureCards = [
  {
    icon: Users,
    title: "Partner Network",
    subtitle: "Connect Intelligently",
    description: "Discover and collaborate with vetted partners, investors, and dealmakers. Now part of CapIV Access.",
    href: "/access?tab=matchmaking",
    isReady: true,
  },
  {
    icon: Building2,
    title: "Deal Flow",
    subtitle: "See What's Moving",
    description: "Access live opportunities curated through CapIV's intelligence filters. Now part of CapIV Access.",
    href: "/access?tab=deals",
    isReady: true,
  },
  {
    icon: DollarSign,
    title: "Capital Access",
    subtitle: "Unlock Growth Capital",
    description: "Explore private credit, equity, and co-investment pathways.",
    href: "/access",
    isReady: true,
  },
  {
    icon: BarChart3,
    title: "CapIV EQ",
    subtitle: "Model & Measure",
    description: "Run investment calculators and monitor live portfolio KPIs.",
    section: "eq" as CoreSection,
    isReady: true,
  },
  {
    icon: Layers3,
    title: "SPV / Fund Desk",
    subtitle: "Structure with Precision",
    description: "Create or join SPVs, manage terms, and track returns with transparency via the Underwriting Lab.",
    href: "/capiv-iq?tab=underwriting",
    isReady: true,
  },
  {
    icon: Rss,
    title: "Intelligence Feed",
    subtitle: "Stay Ahead.",
    description: "Get insights, market data, and verified investor intelligence.",
    href: "/",
    isReady: false,
  },
  {
    icon: Lock,
    title: "Vault Cards",
    subtitle: "Access. Privilege. Power.",
    description: "Manage your CapIV™ Vault privileges and member-level benefits.",
    href: "/account",
    isReady: false,
  },
  {
    icon: Shield,
    title: "CapIV IQ",
    subtitle: "Diligence + Underwriting",
    description: "Govern NDAs, Persona compliance, and underwriting diagnostics together.",
    href: "/capiv-iq",
    isReady: true,
  },
  {
    icon: HelpCircle,
    title: "Support & Concierge",
    subtitle: "Human + AI Assistance",
    description: "Get strategic help from the CapIV™ Concierge Team.",
    href: "/account",
    isReady: false,
  },
]

export function CapIVCore({ defaultTab = "overview" }: CapIVCoreProps) {
  const router = useRouter()
  const { user } = useAuth()
  const sectionRefs = useRef<Record<CoreSection, HTMLDivElement | null>>({
    overview: null,
    eq: null,
  })

  const firstName = user?.name?.split(" ")[0] || "User"

  const scrollToSection = (section: CoreSection) => {
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (defaultTab && defaultTab !== "overview") {
      scrollToSection(defaultTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTab])

  const handleCardClick = (card: (typeof featureCards)[number]) => {
    if (!card.isReady) {
      return
    }
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
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
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

      <div className="max-w-7xl mx-auto p-8 space-y-16">
        {/* Overview */}
        <div
          id="overview"
          ref={(el) => {
            sectionRefs.current.overview = el
          }}
          className="space-y-10 scroll-mt-24"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome, {firstName}</h1>
            <p className="text-xl text-white mb-2">This is CapIV™ Core — your private asset hub.</p>
            <p className="text-lg text-white italic">Where intelligent deals start happening.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, index) => (
              <Card
                key={index}
                className={`p-6 rounded-lg transition-colors ${
                  card.isReady
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-750 cursor-pointer"
                    : "bg-slate-700 border-slate-600 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => handleCardClick(card)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <card.icon className={`w-8 h-8 ${card.isReady ? "text-blue-400" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-lg font-bold ${card.isReady ? "text-white" : "text-gray-400"}`}>
                        {card.title}
                      </h3>
                      {!card.isReady && (
                        <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">Coming Soon</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium mb-3 ${card.isReady ? "text-blue-400" : "text-gray-500"}`}>
                      {card.subtitle}
                    </p>
                    <p className={`text-sm leading-relaxed ${card.isReady ? "text-gray-300" : "text-gray-500"}`}>
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CapIV EQ */}
        <div
          id="eq"
          ref={(el) => {
            sectionRefs.current.eq = el
          }}
          className="-mx-8 border-t border-slate-800 pt-10 scroll-mt-24"
        >
          <CapIVEQWorkspace />
        </div>
      </div>
    </div>
  )
}
