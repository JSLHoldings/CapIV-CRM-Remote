"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { getDefaultPath, isPathAllowed } from "@/lib/access-control"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isRestrictedRoute = !isPathAllowed(pathname)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (isRestrictedRoute) {
      router.push(getDefaultPath())
    }
  }, [user, isLoading, isRestrictedRoute, router])

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

  if (isRestrictedRoute) {
    return null // Will redirect to the dashboard
  }

  return <>{children}</>
}
