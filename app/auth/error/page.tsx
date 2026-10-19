import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">JSL Tech™ Access</p>
          <h1 className="text-3xl font-semibold text-white">Authentication Error</h1>
        </div>

        <Card className="bg-slate-900/80 border border-slate-800 shadow-xl shadow-blue-500/5">
          <CardHeader>
            <CardTitle className="text-white">Something went wrong</CardTitle>
            <CardDescription className="text-slate-400">
              We couldn&apos;t verify your authentication link. It may have expired or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
