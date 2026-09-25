import { generateText, Output } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const analysisSchema = z.object({
  narrativeSummary: z
    .string()
    .describe("2-4 sentence underwriting narrative summarizing the deal's investment case and overall risk posture"),
  keyRisks: z
    .array(
      z.object({
        risk: z.string().describe("Short name of the risk"),
        severity: z.enum(["low", "medium", "high"]).describe("Severity of the risk"),
        rationale: z.string().describe("Why this is a risk for this specific deal"),
      }),
    )
    .describe("Key underwriting risks not already captured in the deterministic scoring breakdown"),
  recommendations: z
    .array(z.string())
    .describe("Concrete next steps or conditions the underwriting team should require before approval"),
  confidence: z.enum(["Low", "Medium", "High"]).describe("Confidence in the underwriting recommendation given available data"),
  recommendedAction: z
    .enum(["Approve", "Approve with conditions", "Request more information", "Decline"])
    .describe("The AI's recommended underwriting decision"),
})

export async function POST(request: NextRequest) {
  try {
    const { deal } = await request.json()

    if (!deal || typeof deal !== "object") {
      return NextResponse.json({ error: "Missing deal data" }, { status: 400 })
    }

    const {
      dealName,
      sponsor,
      dealSize,
      assetType,
      location,
      overallScore,
      scoringBreakdown = [],
      riskFactors = [],
      strengths = [],
    } = deal

    const { output } = await generateText({
      model: "google/gemini-2.5-pro",
      output: Output.object({ schema: analysisSchema }),
      messages: [
        {
          role: "user",
          content: `You are a senior underwriter for a private capital investment platform. Review this deal's underwriting profile and produce an independent AI assessment.

Deal: ${dealName}
Sponsor: ${sponsor}
Asset Type: ${assetType}
Location: ${location}
Deal Size: ${dealSize}
Deterministic Overall Score: ${overallScore}/100

Scoring Breakdown:
${scoringBreakdown
  .map((item: { category: string; weight: number; score: number }) => `- ${item.category}: ${item.score}/100 (weight ${item.weight}%)`)
  .join("\n")}

Existing Risk Factors:
${riskFactors.length > 0 ? riskFactors.map((r: string) => `- ${r}`).join("\n") : "- None flagged"}

Existing Strengths:
${strengths.length > 0 ? strengths.map((s: string) => `- ${s}`).join("\n") : "- None flagged"}

Provide a narrative summary, any additional key risks beyond what's already listed, concrete recommendations/conditions, your confidence level, and a recommended underwriting action.`,
        },
      ],
    })

    return NextResponse.json({
      analysis: output,
      model: "gemini",
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Underwriting AI analysis error:", error)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
