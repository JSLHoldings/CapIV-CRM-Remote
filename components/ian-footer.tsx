import Link from "next/link"

export function IanFooter() {
  return (
    <footer className="border-t border-slate-800 px-6 py-6 text-center">
      <p className="text-xs text-slate-500">
        IAN is a privately managed JSL Tech platform. Terms &amp; Conditions apply.
      </p>
      <p className="mt-1 text-xs">
        <Link href="/ian/legal/terms" className="text-blue-300 hover:text-blue-200 underline">
          Terms &amp; Conditions
        </Link>
        <span className="text-slate-600"> | </span>
        <Link href="/ian/legal/privacy" className="text-blue-300 hover:text-blue-200 underline">
          Privacy Policy
        </Link>
        <span className="text-slate-600"> | </span>
        <Link href="/ian/legal/disclosure" className="text-blue-300 hover:text-blue-200 underline">
          Review &amp; Approval Disclosure
        </Link>
      </p>
    </footer>
  )
}
