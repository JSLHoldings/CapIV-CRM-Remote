import Link from "next/link"
import { IanFooter } from "@/components/ian-footer"

export default function IanDisclosurePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">JSL Tech IAN</span>
          <Link href="/ian" className="text-sm text-slate-400 hover:text-white">
            Back to IAN
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 flex-1 space-y-6">
        <h1 className="text-3xl font-semibold text-white">Review &amp; Approval Disclosure</h1>
        <p className="text-sm text-slate-400">Beta Program — JSL Tech Intelligence &amp; Access Network (IAN)</p>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Every IAN profile submission is reviewed by a JSL Tech reviewer before any admission, waitlist, or
            decline decision is made. No profile is automatically approved or rejected.
          </p>
          <p>
            As part of the review process, JSL Tech may use an AI-assisted tool to help summarize a submitted
            profile for the reviewer. This tool is advisory only — it does not make or finalize any decision about
            your participation status. A human reviewer always makes the final determination, and the AI-generated
            summary never bypasses human review.
          </p>
          <p>
            Reviewers may request additional information or supporting documents before completing their review.
            You will be notified of any status change, and most decisions can be revisited or reversed as new
            information becomes available.
          </p>
        </div>
      </main>

      <IanFooter />
    </div>
  )
}
