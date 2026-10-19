import type { ReactNode } from "react"
import { requireFeature } from "@/lib/ian/feature-access"

export default async function Layout({ children }: { children: ReactNode }) {
  await requireFeature("submit_formal_deals")
  return children
}
