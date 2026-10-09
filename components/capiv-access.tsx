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
  Lock
} from "lucide-react"
import { useFeatureAccess } from "@/hooks/use-feature-access"
import { FEATURE_ROUTES } from "@/lib/ian/capabilities"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface CapIVAccessProps {
  selectedDeal: string | null
  onDealSelect: (deal: string | null) => void
}

const featureCards = [
  {
    icon: Building2,
    title: "Deal Marketplace",
    subtitle: "Discover Opportunities",
    description: "Browse verified deals curated by region, asset class, and structure. Discover opportunities that match your capital strategy.",
    href: "/deals"
  },
  {
    icon: Users,
    title: "Investor Network",
    subtitle: "Collaborate with Confidence",
    description: "Engage with verified investors, funds, and family offices.",
    href: "/matchmaking"
  },
  {
    icon: RefreshCw,
    title: "Matchmaking Engine",
    subtitle: "Precision Pairing",
    description: "AI-powered matching of deals and capital profiles for intelligent outcomes.",
    href: "/matchmaking"
  },
  {
    icon: FileText,
    title: "JSL Tech IQ",
    subtitle: "Transparency Meets Control",
    description: "Access NDAs, Persona verifications, and underwriting diagnostics together.",
    href: "/capiv-iq"
  },
  {
    icon: UserPlus,
    title: "Partner Invitations",
    subtitle: "Expand Your Network",
    description: "Invite co-investors, JV partners, or advisors to your trusted network.",
    href: "/matchmaking"
  },
  {
    icon: BarChart3,
    title: "JSL Tech EQ",
    subtitle: "Scale What's Winning",
    description: "View analytics and run calculators without leaving the command plane.",
    href: "/capiv-eq"
  }
]

const actionButtons = [
  { text: "Submit a Deal", href: "/deals" },
  { text: "Request Capital Match", href: "/matchmaking" },
  { text: "Invite a Partner", href: "/matchmaking" },
  { text: "Open JSL Tech IQ", href: "/capiv-iq" },
  { text: "View JSL Tech EQ", href: "/capiv-eq" }
]

export function CapIVAccess({ selectedDeal, onDealSelect }: CapIVAccessProps) {
  const router = useRouter()
  const { can, isAdmin, isLoading } = useFeatureAccess()

  // Default deny: unavailable while loading, and for routes no grant unlocks.
  const isAvailable = (href: string) => {
    if (isLoading) return false
    if (isAdmin) return true
    const feature = FEATURE_ROUTES.find((f) => f.prefixes.some((p) => href === p || href.startsWith(`${p}/`)))
    return feature ? can(feature.capability) : false
  }

  const handleCardClick = (href: string) => {
    router.push(href)
  }

  const handleButtonClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex-1 bg-slate-900 text-white p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featureCards.map((card, index) => {
            const available = isAvailable(card.href)
            return (
            <Card 
              key={index}
              aria-disabled={!available}
              className={
                available
                  ? "bg-slate-800 border-slate-700 p-6 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer"
                  : "bg-slate-800 border-slate-700 p-6 rounded-lg opacity-40 grayscale pointer-events-none select-none"
              }
              onClick={available ? () => handleCardClick(card.href) : undefined}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <card.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    {card.title}
                    {!available && (
                      <>
                        <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        <span className="sr-only">Locked. Not yet approved for your account.</span>
                      </>
                    )}
                  </h3>
                  <p className="text-blue-400 text-sm font-medium mb-3">
                    {card.subtitle}
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-12">
          {actionButtons.map((button, index) => (
            <Button 
              key={index}
              variant="outline" 
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
              disabled={!isAvailable(button.href)}
              onClick={() => handleButtonClick(button.href)}
            >
              {button.text}
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            JSL Tech™ Access — Empowering You. Building Intelligent Wealth.
          </p>
        </div>
      </div>
    </div>
  )
}
