"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface PublicRouteProps {
  children: React.ReactNode
  redirectIfAuthenticated?: boolean
  redirectTo?: string
}

export function PublicRoute({ children, redirectIfAuthenticated = true, redirectTo = "/" }: PublicRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && redirectIfAuthenticated) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectIfAuthenticated, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500 mx-auto"></div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Loading</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
