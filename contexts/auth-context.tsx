"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

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

const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
const SESSION_WARNING_TIME = 5 * 60 * 1000 // 5 minutes before expiry
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  const validateSession = useCallback(() => {
    const now = new Date()
    if (sessionExpiry && now > sessionExpiry) {
      setIsSessionExpired(true)
      logout()
      return false
    }
    return true
  }, [sessionExpiry])

  const updateActivity = useCallback(() => {
    setLastActivity(new Date())
  }, [])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      // Simulate API call to refresh session
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newExpiry = new Date(Date.now() + SESSION_DURATION)
      setSessionExpiry(newExpiry)
      localStorage.setItem("auth-session-expiry", newExpiry.toISOString())
      setIsSessionExpired(false)

      return true
    } catch (error) {
      console.error("Failed to refresh session:", error)
      return false
    }
  }, [user])

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem("auth-user")
    const savedExpiry = localStorage.getItem("auth-session-expiry")

    if (savedUser && savedExpiry) {
      const expiryDate = new Date(savedExpiry)
      const now = new Date()

      if (now < expiryDate) {
        setUser(JSON.parse(savedUser))
        setSessionExpiry(expiryDate)
      } else {
        // Session expired, clean up
        localStorage.removeItem("auth-user")
        localStorage.removeItem("auth-session-expiry")
        setIsSessionExpired(true)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!user || !sessionExpiry) return

    const checkSession = () => {
      const now = new Date()
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime()

      // Check for inactivity
      const timeSinceActivity = now.getTime() - lastActivity.getTime()
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        logout()
        return
      }

      // Warn about upcoming expiry
      if (timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0) {
        // Could show a warning toast here
        console.log("[v0] Session expiring soon")
      }

      // Check if session expired
      if (timeUntilExpiry <= 0) {
        setIsSessionExpired(true)
        logout()
      }
    }

    const interval = setInterval(checkSession, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [user, sessionExpiry, lastActivity])

  useEffect(() => {
    if (!user) return

    const handleActivity = () => updateActivity()

    // Listen for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user, updateActivity])

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email && password.length >= 6) {
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        role: "user",
      }

      const sessionDuration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION
      const expiry = new Date(Date.now() + sessionDuration)

      setUser(mockUser)
      setSessionExpiry(expiry)
      setIsSessionExpired(false)
      setLastActivity(new Date())

      localStorage.setItem("auth-user", JSON.stringify(mockUser))
      localStorage.setItem("auth-session-expiry", expiry.toISOString())

      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const signup = async (email: string, password: string, name: string, accountType: AccountType): Promise<boolean> => {
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email && password.length >= 6 && name && accountType) {
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: "user",
        accountType,
      }

      const expiry = new Date(Date.now() + SESSION_DURATION)

      setUser(mockUser)
      setSessionExpiry(expiry)
      setIsSessionExpired(false)
      setLastActivity(new Date())

      localStorage.setItem("auth-user", JSON.stringify(mockUser))
      localStorage.setItem("auth-session-expiry", expiry.toISOString())

      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    setSessionExpiry(null)
    setIsSessionExpired(false)
    localStorage.removeItem("auth-user")
    localStorage.removeItem("auth-session-expiry")
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
