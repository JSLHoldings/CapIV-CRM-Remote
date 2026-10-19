import { jsPDF } from "jspdf"
import type { IntakeReport } from "@/lib/deal-text-parser"

const MARGIN = 48
const PAGE_WIDTH = 612 // US Letter, points

function wrapAndDraw(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

/** Render an IntakeReport as a downloadable PDF and trigger a browser download. */
export function downloadIntakeReportPdf(report: IntakeReport, dealName: string, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" })
  const contentWidth = PAGE_WIDTH - MARGIN * 2
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > 792 - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(20, 20, 20)
  doc.text("Deal Intake Report", MARGIN, y)
  y += 22

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(`Document: ${filename}`, MARGIN, y)
  y += 14
  doc.text(`Deal: ${dealName || "Untitled Deal"}`, MARGIN, y)
  y += 14
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, y)
  y += 24

  // Score summary
  const scoreColor: Record<IntakeReport["scoreLabel"], [number, number, number]> = {
    high: [16, 130, 90],
    medium: [180, 130, 20],
    low: [190, 50, 60],
  }
  const [r, g, b] = scoreColor[report.scoreLabel]
  doc.setFillColor(r, g, b)
  doc.roundedRect(MARGIN, y, 130, 34, 4, 4, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text(`${report.score}%`, MARGIN + 12, y + 23)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`${report.scoreLabel.toUpperCase()} CONFIDENCE`, MARGIN + 48, y + 15)
  const foundCount = report.fields.filter((f) => f.status === "found").length
  doc.text(`${foundCount}/${report.fields.length} fields matched`, MARGIN + 48, y + 27)
  y += 50

  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.text(
    `Extracted ${report.documentStats.words.toLocaleString()} words (${report.documentStats.characters.toLocaleString()} characters) of document text.`,
    MARGIN,
    y,
  )
  y += 24

  // Section: why the score is X%
  ensureSpace(30)
  doc.setTextColor(20, 20, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(`Why the score is ${report.score}%`, MARGIN, y)
  y += 16

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  for (const reason of report.scoreReasons) {
    ensureSpace(24)
    doc.setTextColor(140, 140, 140)
    doc.text("•", MARGIN, y)
    doc.setTextColor(60, 60, 60)
    y = wrapAndDraw(doc, reason, MARGIN + 12, y, contentWidth - 12, 13)
    y += 4
  }
  y += 12

  // Section: how to improve
  ensureSpace(30)
  doc.setTextColor(20, 20, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("How to improve this score", MARGIN, y)
  y += 18

  const impactColor: Record<"high" | "medium" | "low", [number, number, number]> = {
    high: [190, 50, 60],
    medium: [180, 130, 20],
    low: [90, 90, 90],
  }
  report.improvements.forEach((action, i) => {
    ensureSpace(46)
    const [ir, ig, ib] = impactColor[action.impact]
    doc.setFillColor(ir, ig, ib)
    doc.circle(MARGIN + 4, y - 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(20, 20, 20)
    doc.text(`${i + 1}. ${action.title}`, MARGIN + 14, y)
    y += 13
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.setTextColor(90, 90, 90)
    y = wrapAndDraw(doc, action.detail, MARGIN + 14, y, contentWidth - 14, 12.5)
    y += 10
  })
  y += 8

  // Section: field-by-field breakdown
  ensureSpace(30)
  doc.setTextColor(20, 20, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Field-by-field breakdown", MARGIN, y)
  y += 18

  const statusColor: Record<"found" | "missing" | "uncertain", [number, number, number]> = {
    found: [16, 130, 90],
    uncertain: [180, 130, 20],
    missing: [190, 50, 60],
  }
  const statusLabel: Record<"found" | "missing" | "uncertain", string> = {
    found: "FOUND",
    uncertain: "LOW CONFIDENCE",
    missing: "NOT FOUND",
  }

  for (const field of report.fields) {
    ensureSpace(30)
    const [fr, fg, fb] = statusColor[field.status]
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9.5)
    doc.setTextColor(fr, fg, fb)
    doc.text(`[${statusLabel[field.status]}]`, MARGIN, y)
    doc.setTextColor(20, 20, 20)
    doc.text(field.label, MARGIN + 90, y)
    y += 12
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    y = wrapAndDraw(doc, field.reason, MARGIN + 12, y, contentWidth - 12, 11.5)
    y += 8
  }

  const safeName = (dealName || "deal").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "deal"
  doc.save(`intake-report-${safeName}.pdf`)
}
