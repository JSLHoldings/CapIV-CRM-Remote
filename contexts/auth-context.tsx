"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

export type AccountType =
  | "realtor-broker"
  | "asset-holder"
  | "investor-family-office"
  | "capital-partner"
  | "service-provider"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  accountType?: AccountType
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  signup: (email: string, password: string, name: string, accountType: AccountType) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  sessionExpiry: Date | null
  refreshSession: () => Promise<boolean>
  isSessionExpired: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Build our app-level User object from a Supabase session's user + metadata.
function mapSessionToUser(session: Session | null): User | null {
  if (!session?.user) return null
  const supaUser = session.user
  const metadata = supaUser.user_metadata ?? {}
  return {
    id: supaUser.id,
    email: supaUser.email ?? "",
    name: (metadata.name as string) || supaUser.email?.split("@")[0] || "",
    role: (metadata.role as "admin" | "user") || "user",
    accountType: (metadata.account_type as AccountType) || undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const applySession = useCallback((session: Session | null) => {
    setUser(mapSessionToUser(session))
    if (session?.expires_at) {
      setSessionExpiry(new Date(session.expires_at * 1000))
      setIsSessionExpired(false)
    } else {
      setSessionExpiry(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Load the current session on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      applySession(session)
      setIsLoading(false)
    })

    // Keep auth state in sync (login, logout, token refresh, tab focus).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      applySession(session)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, applySession])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session) {
      console.error("Failed to refresh session:", error?.message)
      return false
    }
    applySession(data.session)
    return true
  }, [supabase, applySession])

  const login = async (email: string, password: string, _rememberMe = false): Promise<boolean> => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (error || !data.session) {
      console.error("Login failed:", error?.message)
      return false
    }
    applySession(data.session)
    return true
  }

  const signup = async (email: string, password: string, name: string, accountType: AccountType): Promise<boolean> => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined),
        data: {
          name,
          account_type: accountType,
          role: "user",
        },
      },
    })
    setIsLoading(false)

    if (error) {
      console.error("Signup failed:", error.message)
      return false
    }

    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) {
      applySession(data.session)
    }
    return true
  }

  const logout = () => {
    supabase.auth.signOut()
    setUser(null)
    setSessionExpiry(null)
    setIsSessionExpired(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        sessionExpiry,
        refreshSession,
        isSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
