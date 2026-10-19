import Link from "next/link"
import {
  ArrowUpRight,
  BookOpenCheck,
  ClipboardCheck,
  Compass,
  Gauge,
  Layers,
  ListChecks,
  Route,
  Scale,
  Users,
} from "lucide-react"

const groups = [
  {
    title: "IAN Review",
    items: [
      {
        href: "/admin/ian",
        label: "IAN Review Queue",
        description: "Review applicants, approve capabilities and reverse decisions.",
        icon: Users,
      },
      {
        href: "/admin/ian/checklist",
        label: "Owner Checklist",
        description: "Track the Founder and CTO approval items.",
        icon: ListChecks,
      },
      {
        href: "/readiness",
        label: "Readiness Report",
        description: "Access policy, role matrix and test results.",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "Capital Intelligence",
    items: [
      {
        href: "/capital-intelligence/roadmap",
        label: "Roadmap",
        description: "Planned Capital Intelligence features and phases.",
        icon: Route,
      },
      {
        href: "/capital-intelligence/decisions",
        label: "Decisions Log",
        description: "Product and compliance decisions on record.",
        icon: Scale,
      },
    ],
  },
  {
    title: "Hidden Workspaces",
    items: [
      {
        href: "/core",
        label: "JSL Tech Core",
        description: "Hidden from participants, visible to admins.",
        icon: Layers,
      },
      {
        href: "/capiv-eq",
        label: "JSL Tech EQ",
        description: "Hidden from participants, visible to admins.",
        icon: Gauge,
      },
    ],
  },
  {
    title: "Participant Views",
    items: [
      {
        href: "/access",
        label: "JSL Tech Access",
        description: "See the Access page as participants do.",
        icon: Compass,
      },
      {
        href: "/ian/profile",
        label: "My IAN Profile",
        description: "Preview the profile and status flow.",
        icon: BookOpenCheck,
      },
    ],
  },
]

export function AdminFeatureLinks() {
  return (
    <section aria-labelledby="admin-tools-heading" className="space-y-6">
      <div>
        <h2 id="admin-tools-heading" className="text-xl font-semibold text-white">
          Admin Tools
        </h2>
        <p className="text-sm text-slate-400">Every admin-only feature in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-4">{group.title}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 transition-colors hover:border-blue-500/40 hover:bg-slate-900"
                    >
                      <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                        <Icon className="h-4 w-4 text-blue-300" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 text-slate-600 transition-colors group-hover:text-blue-300"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
