import Link from "next/link"
import { ArrowRight, Briefcase, Calculator, Compass, FileSearch, Network, ShieldCheck, UserCheck } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: UserCheck,
    title: "1. Build your profile",
    description: "Share your expertise, interests and goals, and sign the beta NDA and terms of participation.",
    href: "/ian/profile",
    cta: "Create My Profile",
  },
  {
    icon: ShieldCheck,
    title: "2. Get reviewed and approved",
    description: "The IAN team reviews your profile and approves the capabilities that fit what you are looking for.",
    href: "/ian/status",
    cta: "Check My Status",
  },
  {
    icon: Compass,
    title: "3. Start connecting",
    description: "As each capability is approved, the matching tools unlock in your sidebar automatically.",
    href: "/ian/future-interest",
    cta: "Share Future Interests",
  },
]

const unlocks = [
  {
    icon: Network,
    title: "JSL Tech Access",
    tagline: "Capital and opportunity discovery",
    description:
      "Browse verified capital partners and opportunities, and request introductions that match your thesis.",
    href: "/access",
    cta: "Explore Access",
    perks: ["Browse people and opportunities", "Warm introductions", "Capital stack visibility"],
  },
  {
    icon: FileSearch,
    title: "JSL Tech IQ",
    tagline: "Diligence and underwriting",
    description:
      "AI-assisted underwriting, due diligence and scenario tools to pressure-test a deal before you commit.",
    href: "/capiv-iq",
    cta: "Explore IQ",
    perks: ["Underwriting analysis", "Due diligence workspace", "ROI and portfolio calculators"],
  },
]

const alsoAvailable = [
  { icon: Briefcase, title: "Deal Source", description: "Submit formal deals for review." },
  { icon: Calculator, title: "Matchmaking", description: "Automated pairing with aligned partners." },
]

export function DashboardUnlockSections() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="unlock-steps-heading" className="space-y-4">
        <h2 id="unlock-steps-heading" className="text-2xl font-semibold text-white">
          How to unlock the full network
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card key={step.title} className="bg-slate-800 border-slate-700 p-6 flex flex-col">
              <div className="p-3 rounded-xl bg-slate-700/70 w-fit mb-5">
                <step.icon className="h-6 w-6 text-blue-300" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg text-white mb-2">{step.title}</CardTitle>
              <p className="text-sm leading-relaxed text-slate-300 mb-5 flex-1">{step.description}</p>
              <Link
                href={step.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
              >
                {step.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="unlock-features-heading" className="space-y-4">
        <h2 id="unlock-features-heading" className="text-2xl font-semibold text-white">
          What approval unlocks
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {unlocks.map((item) => (
            <Card
              key={item.title}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/40 transition-colors"
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <item.icon className="h-7 w-7 text-blue-300" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-blue-300">{item.tagline}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-300 mb-5">{item.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {item.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-semibold w-fit">
                  <Link href={item.href}>
                    {item.cta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {alsoAvailable.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/60 px-5 py-4"
            >
              <item.icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
