import type { AccountType } from "@/contexts/auth-context"

/**
 * IAN is a restricted access layer. Users on this layer can only reach
 * CapIV Core and CapIV Access — every other route redirects them back.
 */
export const IAN_ACCOUNT_TYPE: AccountType = "ian"

export const IAN_ALLOWED_PATHS = ["/core", "/access"] as const

export function isIanUser(user: { accountType?: AccountType } | null | undefined): boolean {
  return user?.accountType === IAN_ACCOUNT_TYPE
}

export function isPathAllowedForIan(pathname: string): boolean {
  return IAN_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function getIanDefaultPath(): string {
  return IAN_ALLOWED_PATHS[0]
}
