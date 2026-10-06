import Link from "next/link"
import { IanFooter } from "@/components/ian-footer"

export default function IanTermsPage() {
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
        <h1 className="text-3xl font-semibold text-white">Terms &amp; Conditions of Participation</h1>
        <p className="text-sm text-slate-400">Beta Program — JSL Tech Intelligence &amp; Access Network (IAN)</p>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Participation in the IAN beta program is voluntary and does not constitute an offer, solicitation, or
            commitment of any kind by JSL Tech or any affiliated entity. Creating or submitting an IAN profile does
            not grant access to deals, investment opportunities, or capital, and does not obligate you to take any
            further action.
          </p>
          <p>
            All profile submissions are reviewed by JSL Tech personnel prior to any status change. JSL Tech reserves
            the right to admit, waitlist, decline, or request additional information for any submission at its sole
            discretion, and to update, suspend, or discontinue the IAN beta program at any time without notice.
          </p>
          <p>
            Participants are responsible for the accuracy of the information they submit. Supporting materials
            uploaded to a profile are used solely for the purpose of reviewing that profile and are handled in
            accordance with the IAN Privacy Policy.
          </p>
          <p>
            These Terms &amp; Conditions are specific to the IAN beta program and are separate from any Terms of
            Service applicable to the broader CapIV platform. This page will be updated as the beta program evolves.
          </p>
        </div>
      </main>

      <IanFooter />
    </div>
  )
}
