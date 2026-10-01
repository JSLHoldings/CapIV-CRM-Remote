"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { isIanUser } from "@/lib/access-control"

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [debugMode, setDebugMode] = useState(false)
  const isIan = isIanUser(user)

  useEffect(() => {
    const checkDebugMode = () => {
      const isDebug = localStorage.getItem("debug_mode") === "true"
      setDebugMode(isDebug)
    }

    checkDebugMode()
    // Check periodically in case it changes
    const interval = setInterval(checkDebugMode, 1000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", href: "/" },
    { id: "core", label: "CapIV Core", href: "/core" },
    { id: "capiv-iq", label: "CapIV IQ", href: "/capiv-iq" },
    { id: "access", label: "CapIV Access", href: "/access" },
  ]

  const visibleMenuItems = menuItems

  return (
    <div className="w-64 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-[0.3em] text-blue-200 uppercase">CapIV</h1>
          {debugMode && (
            <Badge variant="destructive" className="text-xs bg-red-600/80 text-white border-none">
              DEBUG
            </Badge>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500 uppercase tracking-[0.25em]">Command Suite</p>
        {isIan && (
          <Badge className="mt-3 bg-amber-500/10 text-amber-200 border border-amber-500/30 text-[10px] tracking-[0.2em] uppercase">
            IAN Restricted Layer
          </Badge>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.id} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-5 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-9 w-9 border border-slate-700">
            <AvatarFallback className="bg-blue-600/40 text-blue-200 text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          size="sm"
          className="w-full justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-700"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
