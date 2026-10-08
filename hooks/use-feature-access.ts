"use client"

import useSWR from "swr"
import type { IanCapability } from "@/lib/ian/capabilities"

type CapabilityResponse = { capabilities: Partial<Record<IanCapability, boolean>>; isAdmin: boolean }

const fetcher = async (url: string): Promise<CapabilityResponse> => {
  const res = await fetch(url)
  if (!res.ok) return { capabilities: {}, isAdmin: false }
  return res.json()
}

/** Capabilities the current user has been granted by an IAN admin. */
export function useFeatureAccess() {
  const { data, isLoading } = useSWR("/api/ian/me/capabilities", fetcher, { revalidateOnFocus: true })
  return {
    isLoading,
    can: (capability: IanCapability) => data?.capabilities?.[capability] === true,
  }
}
