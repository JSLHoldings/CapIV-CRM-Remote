import { NextResponse } from "next/server"
import { getCurrentCapabilities } from "@/lib/ian/feature-access"

export async function GET() {
  try {
    const { capabilities, isAdmin } = await getCurrentCapabilities()
    return NextResponse.json({ capabilities, isAdmin }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Failed to resolve capabilities:", error)
    return NextResponse.json({ capabilities: {}, isAdmin: false }, { status: 500 })
  }
}
