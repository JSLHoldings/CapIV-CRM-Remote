"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  /** When true, only users with the admin role may view the route; others are redirected home. */
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, fallback, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
    } else if (requireAdmin && !isAdmin) {
      router.push("/")
    }
  }, [user, isLoading, router, requireAdmin, isAdmin])

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

  if (requireAdmin && !isAdmin) {
    return null // Will redirect home
  }

  return <>{children}</>
}
