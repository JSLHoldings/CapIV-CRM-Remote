"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { getIanDefaultPath, isIanUser, isPathAllowedForIan } from "@/lib/access-control"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const restrictedToIan = isIanUser(user) && !isPathAllowedForIan(pathname)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (restrictedToIan) {
      router.push(getIanDefaultPath())
    }
  }, [user, isLoading, restrictedToIan, router])

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Authenticating</p>
          </div>
        </div>
      )
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (restrictedToIan) {
    return null // Will redirect to the IAN layer's default page
  }

  return <>{children}</>
}
