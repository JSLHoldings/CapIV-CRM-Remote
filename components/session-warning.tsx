"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock } from "lucide-react"

export function SessionWarning() {
  const { sessionExpiry, refreshSession, logout, user } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!user || !sessionExpiry) return

    const checkWarning = () => {
      const now = new Date()
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime()
      const fiveMinutes = 5 * 60 * 1000

      if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
        setShowWarning(true)
        setTimeLeft(Math.floor(timeUntilExpiry / 1000))
      } else {
        setShowWarning(false)
      }
    }

    const interval = setInterval(checkWarning, 1000)
    return () => clearInterval(interval)
  }, [user, sessionExpiry])

  const handleExtendSession = async () => {
    const success = await refreshSession()
    if (success) {
      setShowWarning(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Session Expiring Soon
          </CardTitle>
          <CardDescription>Your session will expire in {formatTime(timeLeft)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>Would you like to extend your session?</span>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleExtendSession} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Extend Session
            </Button>
            <Button onClick={logout} variant="outline" className="flex-1 bg-transparent">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
