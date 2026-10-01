import type { AccountType } from "@/contexts/auth-context"

/**
 * The main application is restricted to CapIV Core, CapIV IQ, and CapIV
 * Access, plus the simplified dashboard landing page. Every other route
 * redirects back to the dashboard. This applies to every signed-in user.
 */
export const IAN_ACCOUNT_TYPE: AccountType = "ian"

export const ALLOWED_PATHS = ["/", "/core", "/access", "/capiv-iq"] as const

export function isIanUser(user: { accountType?: AccountType } | null | undefined): boolean {
  return user?.accountType === IAN_ACCOUNT_TYPE
}

export function isPathAllowed(pathname: string): boolean {
  return ALLOWED_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)))
}

export function getDefaultPath(): string {
  return "/"
}
