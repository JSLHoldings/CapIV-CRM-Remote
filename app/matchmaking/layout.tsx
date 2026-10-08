import type { ReactNode } from "react"
import { requireFeature } from "@/lib/ian/feature-access"

export default async function Layout({ children }: { children: ReactNode }) {
  await requireFeature("automated_matching")
  return children
}
