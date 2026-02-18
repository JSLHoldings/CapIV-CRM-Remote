import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SessionWarning } from "@/components/session-warning"
import { VerificationProvider } from "@/contexts/verification-context"

export const metadata: Metadata = {
  title: "JSL CRM",
  description: "Real Estate Investment CRM",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-slate-950 text-slate-100`}>
        <AuthProvider>
          <VerificationProvider>
            {children}
            <SessionWarning />
          </VerificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
