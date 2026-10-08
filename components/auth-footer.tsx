"use client"

import { usePathname } from "next/navigation"
import { IanFooter } from "@/components/ian-footer"

const FOOTER_PATHS = ["/login", "/signup", "/forgot-password", "/auth"]

export function AuthFooter() {
  const pathname = usePathname()
  const show = FOOTER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return show ? <IanFooter /> : null
}
