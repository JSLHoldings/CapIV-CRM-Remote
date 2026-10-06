import Link from "next/link"
import { IanFooter } from "@/components/ian-footer"

export default function IanPrivacyPage() {
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
        <h1 className="text-3xl font-semibold text-white">IAN Privacy Policy</h1>
        <p className="text-sm text-slate-400">Beta Program — JSL Tech Intelligence &amp; Access Network (IAN)</p>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            JSL Tech collects the information you provide in your IAN profile — including your name, organization,
            role, interests, and any supporting documents or photos you upload — solely to evaluate your
            participation in the IAN beta program.
          </p>
          <p>
            Profile data and uploaded materials are stored securely and are accessible only to you and to authorized
            JSL Tech reviewers. Information is not published, shared with other participants, or made public unless
            you explicitly opt in to directory publication, a feature currently disabled during the beta phase.
          </p>
          <p>
            Every change to your profile status is recorded in an auditable history, and most actions you or a
            reviewer take can be reversed. You may request a copy of your data, withdraw your profile, or ask
            questions about how your information is used at any time.
          </p>
          <p>
            This policy is specific to the IAN beta program and is separate from the privacy policy applicable to
            the broader CapIV platform. It will be updated as the beta program evolves.
          </p>
        </div>
      </main>

      <IanFooter />
    </div>
  )
}
