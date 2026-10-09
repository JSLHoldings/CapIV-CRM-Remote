"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { logActivity } from "@/lib/activity"
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
  adminLogin: (email: string, password: string, secretKey: string) => Promise<boolean>
  signup: (
    email: string,
    password: string,
    name: string,
    accountType: AccountType,
  ) => Promise<{ success: boolean; error?: string }>
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

  const requestIdRef = useRef(0)
  const suppressAuthEventsRef = useRef(false)

  // Admin-role accounts only keep the admin role when they signed in through
  // the admin sign-in (secret key) flow; otherwise they are treated as users.
  const applySession = useCallback(async (session: Session | null) => {
    const requestId = ++requestIdRef.current
    let mapped = mapSessionToUser(session)
    if (mapped?.role === "admin" && session) {
      let active = false
      try {
        const res = await fetch("/api/auth/admin-verify", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        active = (await res.json()).active === true
      } catch {
        active = false
      }
      if (!active) mapped = { ...mapped, role: "user" }
    }
    if (requestId !== requestIdRef.current) return
    setUser(mapped)
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session)
      if (!mounted) return
      setIsLoading(false)
    })

    // Keep auth state in sync (login, logout, token refresh, tab focus).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || suppressAuthEventsRef.current) return
      void applySession(session).then(() => {
        if (mounted) setIsLoading(false)
      })
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
    await applySession(data.session)
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
    // Signing in is NOT a sign-up: never trigger the onboarding flow on login.
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("capiv_just_signed_up")
    }
    await applySession(data.session)
    void logActivity({
      action: "User signed in",
      category: "auth",
      metadata: { email },
    })
    return true
  }

  const adminLogin = async (email: string, password: string, secretKey: string): Promise<boolean> => {
    setIsLoading(true)
    // Hold back auth events until the secret key is verified so the account is
    // never briefly exposed without (or with) the admin role.
    suppressAuthEventsRef.current = true
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      suppressAuthEventsRef.current = false
      setIsLoading(false)
      return false
    }

    let verified = false
    try {
      const res = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ key: secretKey }),
      })
      verified = res.ok
    } catch {
      verified = false
    }

    if (!verified) {
      await supabase.auth.signOut()
      suppressAuthEventsRef.current = false
      setIsLoading(false)
      return false
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("capiv_just_signed_up")
    }
    await applySession(data.session)
    suppressAuthEventsRef.current = false
    setIsLoading(false)
    void logActivity({
      action: "Admin signed in",
      category: "auth",
      metadata: { email },
    })
    return true
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    accountType: AccountType,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    // Create the account server-side via the Admin API (auto-confirmed, no
    // email sent). This avoids Supabase's built-in email rate limit.
    let res: Response
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, accountType }),
      })
    } catch {
      setIsLoading(false)
      return { success: false, error: "Network error. Please try again." }
    }

    if (!res.ok) {
      setIsLoading(false)
      const payload = await res.json().catch(() => ({}))
      return { success: false, error: payload.error || "Failed to create account. Please try again." }
    }

    // Mark that this is a brand-new account so the onboarding/verification flow
    // is shown once, right after sign-up (never on subsequent sign-ins).
    if (typeof window !== "undefined") {
      sessionStorage.setItem("capiv_just_signed_up", "true")
    }

    // Sign in immediately to establish a session.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (error || !data.session) {
      console.error("[v0] Post-signup sign-in failed:", error?.message)
      return { success: false, error: "Account created, but sign-in failed. Please sign in manually." }
    }

    applySession(data.session)
    void logActivity({
      action: "New account created",
      category: "auth",
      metadata: { email, accountType },
    })
    return { success: true }
  }

  const logout = () => {
    // Log before clearing state so user_id is still available.
    void logActivity({ action: "User signed out", category: "auth" })
    void fetch("/api/auth/admin-verify", { method: "DELETE" }).catch(() => {})
    supabase.auth.signOut()
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("capiv_just_signed_up")
    }
    setUser(null)
    setSessionExpiry(null)
    setIsSessionExpired(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        adminLogin,
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
