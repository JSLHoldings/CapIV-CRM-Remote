"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Shield, CreditCard, FolderOpen } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { DocumentVault } from "@/components/document-vault"

export default function AccountPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="min-h-full px-8 py-10 space-y-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-500/15 p-4">
              <User className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Account Settings</h1>
              <p className="text-slate-300">Manage your CapIV™ profile, security, and notifications.</p>
            </div>
          </div>

          <div className="max-w-5xl">
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  Billing
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border border-slate-700">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="text-lg bg-blue-600/40 text-blue-200">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          Change Photo
                        </Button>
                        <p className="text-sm text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="firstName" className="text-slate-300">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          defaultValue={user?.name?.split(" ")[0] || ""}
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-slate-300">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          defaultValue={user?.name?.split(" ")[1] || ""}
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-slate-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email || ""}
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-slate-300">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          defaultValue="+1 (555) 123-4567"
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company" className="text-slate-300">
                          Company
                        </Label>
                        <Input
                          id="company"
                          defaultValue="JSL Holdings"
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role" className="text-slate-300">
                          Role
                        </Label>
                        <Input
                          id="role"
                          defaultValue="Investment Manager"
                          className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl">
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5 text-blue-300" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-slate-300">
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-slate-300">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-slate-300">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl">
                        Update Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-100">Two-factor authentication</p>
                        <p className="text-sm text-slate-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Badge className="bg-amber-400/20 text-amber-200 border border-amber-400/40">
                        Not Enabled
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Enable 2FA
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Bell className="w-5 h-5 text-blue-300" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">Notification settings coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing">
                <Card className="bg-slate-900/80 border border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="w-5 h-5 text-blue-300" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">Billing settings coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <DocumentVault />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  )
}
