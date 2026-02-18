"use client"

import { Card, CardContent } from "@/components/ui/card"

export function Account() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Account</h1>
      </div>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground">
        <CardContent className="p-8 flex items-center space-x-4">
          <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center">
            <span className="text-secondary font-semibold">JS</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">JSL User</h2>
            <p className="text-secondary-foreground/80">Real Estate Consultant</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-48 bg-muted">
          <CardContent className="p-6 flex items-center justify-center h-full">
            <p className="text-muted-foreground">Account Settings</p>
          </CardContent>
        </Card>

        <Card className="h-48 bg-muted">
          <CardContent className="p-6 flex items-center justify-center h-full">
            <p className="text-muted-foreground">Profile Information</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
