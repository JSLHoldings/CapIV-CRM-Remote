"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "./protected-route"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const { user, isLoading } = useAuth()

  // If authentication is not required, render children directly
  if (!requireAuth) {
    return <>{children}</>
  }

  // If authentication is required, use ProtectedRoute
  return <ProtectedRoute>{children}</ProtectedRoute>
}
