import { extractText, getDocumentProxy } from "unpdf"
import mammoth from "mammoth"

// Structured deal fields — identical shape to what the AI path produced, so the
// upload dialog and form population code need no changes.
export interface DealExtractionResult {
  title: string
  sponsor: string
  location: string
  assetType:
    | "Multifamily" | "Industrial" | "Office" | "Retail" | "Mixed-Use"
    | "Student Housing" | "Hotel" | "Self-Storage" | "Medical" | "Other"
  dealTypePrimary:
    | "RE_DIRECT" | "PRIVATE_CREDIT" | "FUND_GP_LP" | "OPCO_EQUITY"
    | "M_AND_A" | "SPV_COINVEST" | "PORTFOLIO_ASSET" | "DIGITAL_INTERFACE"
  transactionPurpose:
    | "acquisition" | "development" | "recap" | "refinance" | "growth"
    | "buyout" | "liquidity" | "fundraise" | "other"
  requestType:
    | "equity" | "debt" | "preferred" | "mezzanine" | "JV" | "LP" | "GP"
    | "co-invest" | "hybrid" | "other"
  useOfProceeds: string
  dealSize: string
  investmentType: "Equity" | "Debt" | "Hybrid"
  riskProfile: "Core" | "Core-Plus" | "Value-Add" | "Opportunistic"
  targetReturn: string
  targetMoic: string
  holdPeriod: string
  minimumInvestment: string
  maxRaise: string
  description: string
  capRate: string
  noi: string
  occupancy: string
  yearBuilt: string
  documentType: "Executive Summary" | "Offering Memorandum" | "Term Sheet" | "Investment Deck" | "Other"
  confidence: number
  missingFields: string[]
  intakeReport: IntakeReport
}

// ── Intake report ────────────────────────────────────────────────────────────
// Explains *why* a field is missing/uncertain and *why* the overall score
// landed where it did, so a reviewer knows what to check rather than just
// that something is wrong.

export interface FieldDiagnostic {
  field: string
  label: string
  status: "found" | "missing" | "uncertain"
  reason: string
}

export interface IntakeReport {
  score: number
  scoreLabel: "high" | "medium" | "low"
  scoreReasons: string[]
  fields: FieldDiagnostic[]
  documentStats: { characters: number; words: number; pages: string }
}

const EMPTY = "—"

// ── Text extraction ──────────────────────────────────────────────────────────

/** Pull raw text from a PDF or DOCX buffer. Images return "" (no OCR). */
export async function extractTextFromFile(
  buffer: Buffer,
  mediaType: string,
  filename: string,
): Promise<string> {
  const isPdf = mediaType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")
  const isDocx =
    mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.toLowerCase().endsWith(".docx")

  if (isPdf) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    return Array.isArray(text) ? (text as string[]).join("\n") : String(text ?? "")
  }
  if (isDocx) {
    const { value } = await mammoth.extractRawText({ buffer })
    return value ?? ""
  }
  // Images (PNG/JPG) — no text layer to parse without OCR.
  return ""
}

// ── Heuristic helpers ─────────────────────────────────────────────────────────

// The suffix uses a negative lookahead so the "M" in "$10,369,800 Maturity"
// is not mistaken for a "million" suffix.
const MONEY = /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:billion|bn|million|mm|m|thousand|k)(?![a-zA-Z]))?/i

/** Normalize a matched money string, e.g. "$ 45 million" -> "$45M". */
function normalizeMoney(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim()
  const m = cleaned.match(/\$\s?([\d,]+(?:\.\d+)?)(?:\s?(billion|bn|million|mm|m|thousand|k)(?![a-zA-Z]))?/i)
  if (!m) return cleaned
  const num = m[1]
  const suffix = (m[2] || "").toLowerCase()
  let unit = ""
  if (suffix === "billion" || suffix === "bn") unit = "B"
  else if (suffix === "million" || suffix === "mm" || suffix === "m") unit = "M"
  else if (suffix === "thousand" || suffix === "k") unit = "K"
  return `$${num}${unit}`
}

/** Find the first money value appearing within `window` chars of any keyword. */
function moneyNear(text: string, keywords: string[], window = 80): string {
  const lower = text.toLowerCase()
  for (const kw of keywords) {
    let from = 0
    while (true) {
      const idx = lower.indexOf(kw, from)
      if (idx === -1) break
      const slice = text.slice(idx, idx + kw.length + window)
      const m = slice.match(MONEY)
      if (m) return normalizeMoney(m[0])
      from = idx + kw.length
    }
  }
  return EMPTY
}

/** Return the first regex capture group (or full match) found, else EMPTY. */
function firstMatch(text: string, re: RegExp, group = 0): string {
  const m = text.match(re)
  if (!m) return EMPTY
  return (m[group] ?? m[0]).trim()
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

// ── Field extractors ──────────────────────────────────────────────────────────

function detectAssetType(t: string): DealExtractionResult["assetType"] {
  if (includesAny(t, ["assisted living", "skilled nursing", "memory care", "nursing facility"])) return "Medical"
  if (includesAny(t, ["senior housing", "senior living", "independent living", "seniors housing", "active adult"])) return "Multifamily"
  if (includesAny(t, ["multifamily", "apartment", "multi-family", "residential rental"])) return "Multifamily"
  if (includesAny(t, ["industrial", "warehouse", "logistics", "distribution center"])) return "Industrial"
  if (includesAny(t, ["student housing"])) return "Student Housing"
  if (includesAny(t, ["self-storage", "self storage", "storage facility"])) return "Self-Storage"
  if (includesAny(t, ["medical", "healthcare", "life science", "medical office"])) return "Medical"
  if (includesAny(t, ["hotel", "hospitality", "resort", "lodging"])) return "Hotel"
  if (includesAny(t, ["mixed-use", "mixed use"])) return "Mixed-Use"
  if (includesAny(t, ["office", "class a office", "office building"])) return "Office"
  if (includesAny(t, ["retail", "shopping center", "grocery-anchored", "strip mall"])) return "Retail"
  return "Other"
}

function detectRisk(t: string): DealExtractionResult["riskProfile"] {
  if (includesAny(t, ["opportunistic", "ground-up", "ground up", "distressed", "development play"])) return "Opportunistic"
  if (includesAny(t, ["value-add", "value add", "reposition", "renovation", "renovate", "lease-up"])) return "Value-Add"
  if (includesAny(t, ["core-plus", "core plus"])) return "Core-Plus"
  if (includesAny(t, ["core", "stabilized", "cash-flowing", "trophy"])) return "Core"
  return "Value-Add"
}

function detectInvestmentType(t: string): DealExtractionResult["investmentType"] {
  const debt = includesAny(t, ["senior loan", "mezzanine", "private credit", "debt fund", "bridge loan", "preferred equity"])
  const equity = includesAny(t, ["common equity", "jv equity", "lp equity", "equity investment", "gp co-invest"])
  if (debt && equity) return "Hybrid"
  if (debt) return "Debt"
  return "Equity"
}

function detectRequestType(t: string): DealExtractionResult["requestType"] {
  if (includesAny(t, ["mezzanine"])) return "mezzanine"
  if (includesAny(t, ["preferred equity", "preferred return"])) return "preferred"
  if (includesAny(t, ["senior loan", "private credit", "debt", "loan"])) return "debt"
  if (includesAny(t, ["co-invest", "co invest"])) return "co-invest"
  if (includesAny(t, ["joint venture", " jv "])) return "JV"
  if (includesAny(t, ["lp interest", "limited partner"])) return "LP"
  if (includesAny(t, ["gp stake", "general partner"])) return "GP"
  if (includesAny(t, ["equity"])) return "equity"
  return "equity"
}

function detectTransactionPurpose(t: string): DealExtractionResult["transactionPurpose"] {
  if (includesAny(t, ["ground-up", "ground up", "development", "construction", "develop"])) return "development"
  if (includesAny(t, ["recapitalization", "recap"])) return "recap"
  if (includesAny(t, ["refinance", "refinancing"])) return "refinance"
  if (includesAny(t, ["buyout", "buy-out"])) return "buyout"
  if (includesAny(t, ["liquidity", "exit"])) return "liquidity"
  if (includesAny(t, ["fund raise", "fundraise", "blind pool", "commingled fund"])) return "fundraise"
  if (includesAny(t, ["growth capital", "expansion"])) return "growth"
  if (includesAny(t, ["acquisition", "acquire", "purchase"])) return "acquisition"
  return "acquisition"
}

function detectDealType(t: string): DealExtractionResult["dealTypePrimary"] {
  if (includesAny(t, ["private credit", "senior loan", "mezzanine", "debt fund", "bridge loan"])) return "PRIVATE_CREDIT"
  if (includesAny(t, ["gp-lp", "gp/lp", "fund interest", "lp interest", "commingled fund", "blind pool"])) return "FUND_GP_LP"
  if (includesAny(t, ["operating company", "opco", "platform company"])) return "OPCO_EQUITY"
  if (includesAny(t, ["merger", "acquisition of", "m&a", "buyout of"])) return "M_AND_A"
  if (includesAny(t, ["spv", "single-asset", "co-invest", "co invest"])) return "SPV_COINVEST"
  if (includesAny(t, ["portfolio", "multi-asset", "multiple properties"])) return "PORTFOLIO_ASSET"
  if (includesAny(t, ["tokenized", "digital interface"])) return "DIGITAL_INTERFACE"
  return "RE_DIRECT"
}

function detectDocumentType(t: string, filename: string): DealExtractionResult["documentType"] {
  const f = filename.toLowerCase()
  const combined = `${f} ${t}`
  if (includesAny(combined, ["offering memorandum", "offering memo", " om ", "confidential offering"])) return "Offering Memorandum"
  if (includesAny(combined, ["term sheet", "summary of terms"])) return "Term Sheet"
  if (includesAny(combined, ["investor deck", "pitch deck", "presentation", "investment deck"])) return "Investment Deck"
  if (includesAny(combined, ["executive summary", "investment summary"])) return "Executive Summary"
  return "Other"
}

/** Best-effort project/deal title: labeled field, entity name, headline, then filename. */
function detectTitle(text: string, filename: string): string {
  const labeled = text.match(/(?:project|property|deal|investment|re|subject)\s*(?:name)?\s*[:\-]\s*([A-Z][^\n]{3,60})/i)
  if (labeled) return labeled[1].trim().replace(/\s{2,}/g, " ")

  // Named entity like "Streamside, LLC" — capture the distinctive name, drop the suffix.
  const entity = text.match(/\b([A-Z][A-Za-z0-9'&]+(?:\s+[A-Z][A-Za-z0-9'&]+){0,2}),?\s+(?:LLC|L\.L\.C\.|LP|L\.P\.)\b/)
  if (entity && !/^(the|a|an)$/i.test(entity[1])) return entity[1].trim().replace(/\s{2,}/g, " ")

  const propertyName = text.match(/\b([A-Z][A-Za-z0-9'&.\- ]{2,40}?(?:Apartments|Residences|Tower|Towers|Plaza|Center|Centre|Commons|Crossing|Landing|Estates|Village|Portfolio|Business Park|Industrial Park|Housing))\b/)
  if (propertyName) return propertyName[1].trim().replace(/\s{2,}/g, " ")

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 15)) {
    if (/\.(com|net|org|io)\b/i.test(line)) continue // skip letterhead / domains
    if (line.split(/\s[–—-]\s/).length >= 3) continue // skip city-list headers
    if (line.length >= 6 && line.length <= 60 && /^[A-Z]/.test(line) && !/[.]{2,}/.test(line)) {
      const words = line.split(/\s+/)
      const capish = words.filter((w) => /^[A-Z0-9]/.test(w)).length
      if (words.length >= 2 && capish / words.length >= 0.5) return line
    }
  }
  return cleanFilename(filename)
}

function cleanFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(q[1-4]\s?\d{2,4}|\d{4})\b/gi, "")
    .replace(/\b(final|draft|copy|v\d+|deck|memo|om|letter)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() || "Untitled Deal"
}

// Words that signal the end of a sponsor name in a tabular investor report.
const SPONSOR_STOP = /\s+(Fully|Asset|Balance|Location|Current|Units|Rate|Acquired|Purchase|Total|Fixed|Interest|Term|Maturity|Loan|Investment|Class|Report|Data|Summary|Fund|Sofr).*$/i

function detectSponsor(text: string): string {
  // Corporate entity next to a label (handles "...Sponsor: Acme Capital LLC").
  const labeledEntity = text.match(/(?:sponsor|sponsored by|general partner|gp|manager|managed by|issuer|presented by|prepared by)\s*[:\-]?\s*([A-Z][A-Za-z0-9'&.,\- ]{2,50}?(?:LLC|L\.L\.C\.|LP|L\.P\.|Inc\.?|Capital|Partners|Group|Management|Advisors|Realty|Real Estate|Properties|Holdings|Ventures|Development))\b/)
  if (labeledEntity) return labeledEntity[1].trim().replace(/[,.]$/, "").replace(/\s{2,}/g, " ")

  // Tabular "Sponsor <Title Case Name>" with no corporate suffix — stop at next label.
  const tabular = text.match(/\bsponsor\b\s*[:\-]?\s*([A-Z][A-Za-z&.'-]+(?:\s+[A-Z][A-Za-z&.'-]+){0,4})/)
  if (tabular) {
    const name = tabular[1].replace(SPONSOR_STOP, "").trim().replace(/\s{2,}/g, " ")
    if (name.length >= 3 && !/^(is|the|a|an)$/i.test(name)) return name
  }

  const entity = text.match(/\b([A-Z][A-Za-z0-9'&.\- ]{2,40}?(?:Capital|Partners|Group|Management|Advisors|Realty|Real Estate|Properties|Holdings|Ventures|Development)(?:\s+(?:LLC|LP|Inc\.?))?)\b/)
  if (entity) return entity[1].trim().replace(/\s{2,}/g, " ")
  return EMPTY
}

function detectLocation(text: string): string {
  const stateAbbr = /\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+){0,2}),\s?(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|D\.?C\.?)\b/g
  const counts = new Map<string, number>()
  let m: RegExpExecArray | null
  while ((m = stateAbbr.exec(text)) !== null) {
    const loc = `${m[1].trim()}, ${m[2].replace(/\./g, "")}`
    counts.set(loc, (counts.get(loc) ?? 0) + 1)
  }
  if (counts.size) {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    // Drop a leading label word that bled into the city capture ("Location Nampa, ID").
    return top.replace(/^(Location|Property|Address|Market|City|Region|Located|Situated|Submarket)\s+/i, "")
  }
  return EMPTY
}

function detectDescription(text: string): string {
  // Drop a leading letterhead (city list + domain) that often precedes the body.
  const body = text.replace(/^[\s\S]{0,220}?\.(?:com|net|org|io)\b\s*/i, "")
  const paras = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 100 && /[a-z]/.test(p) && (p.match(/[.!?]/g)?.length ?? 0) >= 1)
  const chosen = paras[0]
  if (!chosen) return EMPTY
  const sentences = chosen.match(/[^.!?]+[.!?]+/g) ?? [chosen]
  const summary = sentences.slice(0, 4).join(" ").trim()
  return summary.length > 500 ? summary.slice(0, 497).trimEnd() + "…" : summary
}

// ── Main parser ─────────────────────────────────────────────────────────────

/** Parse structured deal fields from raw document text using heuristics only. */
export function parseDealFromText(rawText: string, filename: string): DealExtractionResult {
  const text = rawText.replace(/\u00a0/g, " ")
  const lower = text.toLowerCase()

  const dealSize = moneyNear(lower, ["total capitalization", "total project cost", "deal size", "total raise", "offering size", "transaction size", "purchase price", "total investment"])
  const maxRaise = moneyNear(lower, ["equity raise", "total raise", "maximum raise", "capital raise", "seeking", "raising", "offering amount", "target raise"])
  const minimumInvestment = moneyNear(lower, ["minimum investment", "minimum commitment", "min. investment", "minimum subscription", "minimum check"])
  const noi = moneyNear(lower, ["net operating income", "noi", "stabilized noi", "in-place noi"])

  const targetReturn = firstMatch(
    text,
    /(\d{1,2}(?:\.\d+)?\s?%?\s?(?:[-–—]|to)\s?\d{1,2}(?:\.\d+)?\s?%|\d{1,2}(?:\.\d+)?\s?%)\s*(?:net\s+)?(?:target\s+|projected\s+)?irr/i,
    1,
  )
  const irrAlt = targetReturn === EMPTY
    ? firstMatch(text, /irr[^%\d]{0,15}(\d{1,2}(?:\.\d+)?\s?%(?:\s?(?:[-–—]|to)\s?\d{1,2}(?:\.\d+)?\s?%)?)/i, 1)
    : targetReturn

  const targetMoic = firstMatch(
    text,
    /(\d(?:\.\d+)?)\s?x\b(?=[^.]{0,40}(?:equity multiple|moic|multiple|em\b))|(?:equity multiple|moic|multiple)[^.\dx]{0,20}(\d(?:\.\d+)?)\s?x/i,
  )
  const moicClean = targetMoic === EMPTY ? EMPTY : (targetMoic.match(/(\d(?:\.\d+)?)\s?x/i)?.[0].replace(/\s+/g, "") ?? EMPTY)

  const holdPeriod = firstMatch(
    text,
    /(\d{1,2}(?:\s?(?:[-–—]|to)\s?\d{1,2})?)\s?(?:year|yr)s?\s*(?:hold|holding period|term|investment period)|(?:hold(?:ing)?\s+period|term)[^.\d]{0,15}(\d{1,2}(?:\s?(?:[-–—]|to)\s?\d{1,2})?)\s?(?:year|yr)s?/i,
  )
  const holdClean = holdPeriod === EMPTY
    ? EMPTY
    : (holdPeriod.match(/\d{1,2}(?:\s?(?:[-–—]|to)\s?\d{1,2})?\s?(?:year|yr)s?/i)?.[0].replace(/\s+/g, " ") ?? holdPeriod)

  const capRate = firstMatch(
    text,
    /(\d{1,2}(?:\.\d+)?)\s?%\s*(?:going-in\s+)?cap(?:\s?rate)?|cap\s?rate[^.\d]{0,15}(\d{1,2}(?:\.\d+)?)\s?%/i,
  )
  const capClean = capRate === EMPTY ? EMPTY : (capRate.match(/\d{1,2}(?:\.\d+)?\s?%/)?.[0].replace(/\s+/g, "") ?? capRate)

  const occupancy = firstMatch(
    text,
    /(\d{1,3}(?:\.\d+)?)\s?%\s*(?:occupied|occupancy|leased)|(?:occupancy|occupied|leased)[^.\d]{0,15}(\d{1,3}(?:\.\d+)?)\s?%/i,
  )
  const occClean = occupancy === EMPTY ? EMPTY : (occupancy.match(/\d{1,3}(?:\.\d+)?\s?%/)?.[0].replace(/\s+/g, "") ?? occupancy)

  const yearBuilt = firstMatch(
    text,
    /(?:built|constructed|vintage|year built|delivered|completed|completion)\D{0,15}((?:19|20)\d{2})/i,
    1,
  )

  const useOfProceeds = (() => {
    const m = text.match(/use of proceeds\s*[:\-]?\s*([^\n]{10,160})/i)
    if (m) return m[1].trim().replace(/\s{2,}/g, " ")
    return EMPTY
  })()

  const titleVal = detectTitle(text, filename)
  const sponsorVal = detectSponsor(text).replace(/^(sponsor|sponsored by|general partner|gp|manager|managed by|issuer|presented by|prepared by)\s+/i, "")
  const usedFilenameTitle = titleVal === cleanFilename(filename)

  const result: DealExtractionResult = {
    title: titleVal,
    sponsor: sponsorVal,
    location: detectLocation(text),
    assetType: detectAssetType(lower),
    dealTypePrimary: detectDealType(lower),
    transactionPurpose: detectTransactionPurpose(lower),
    requestType: detectRequestType(lower),
    useOfProceeds,
    dealSize,
    investmentType: detectInvestmentType(lower),
    riskProfile: detectRisk(lower),
    targetReturn: irrAlt,
    targetMoic: moicClean,
    holdPeriod: holdClean,
    minimumInvestment,
    maxRaise,
    description: detectDescription(text),
    capRate: capClean,
    noi,
    occupancy: occClean,
    yearBuilt,
    documentType: detectDocumentType(lower, filename),
    confidence: 0,
    missingFields: [],
    intakeReport: { score: 0, scoreLabel: "low", scoreReasons: [], fields: [], documentStats: { characters: 0, words: 0, pages: "—" } },
  }

  // ── Per-field diagnostics: why a field is missing or only weakly recovered ──
  // Each reason names the specific pattern/keyword set the parser looked for,
  // so a reviewer knows what to check in the source document.
  const REASONS: Record<string, string> = {
    title:
      "No labeled \"Project/Deal Name\" field, no distinctively-named entity (e.g. \"X, LLC\"), and no property-style headline (e.g. \"X Apartments\", \"X Plaza\") appeared in the first part of the document.",
    sponsor:
      "No \"Sponsor:\" / \"General Partner:\" / \"Issuer:\" label was found, and no nearby company name ending in a recognized suffix (LLC, LP, Capital, Partners, Group, Realty, Holdings) could be matched.",
    location:
      "No \"City, ST\" pattern (e.g. \"Austin, TX\") was found anywhere in the document text.",
    dealSize:
      "No dollar amount appeared within ~80 characters of size-related keywords (\"total capitalization\", \"purchase price\", \"total raise\", \"transaction size\", \"total investment\").",
    maxRaise:
      "No dollar amount appeared near raise-related keywords (\"equity raise\", \"maximum raise\", \"capital raise\", \"offering amount\", \"target raise\").",
    minimumInvestment:
      "No dollar amount appeared near \"minimum investment\", \"minimum commitment\", or \"minimum subscription\".",
    targetReturn:
      "No percentage value was found adjacent to \"IRR\" (e.g. \"18% IRR\" or \"IRR of 15–20%\").",
    targetMoic:
      "No \"#.#x\" multiple was found near \"equity multiple\", \"MOIC\", or \"multiple\".",
    holdPeriod:
      "No \"# year(s)\" phrase was found near \"hold\", \"holding period\", \"term\", or \"investment period\".",
    capRate:
      "No percentage value was found near \"cap rate\" or \"going-in cap\".",
    noi:
      "No dollar amount was found near \"net operating income\" or \"NOI\".",
    occupancy:
      "No percentage value was found near \"occupancy\", \"occupied\", or \"leased\".",
    yearBuilt:
      "No 4-digit year was found near \"built\", \"constructed\", \"vintage\", \"delivered\", or \"completed\".",
    useOfProceeds:
      "No \"Use of Proceeds:\" labeled field was found in the document text.",
    description:
      "No paragraph of at least 100 characters with normal sentence punctuation was found to summarize — the document may be mostly tables, bullet fragments, or a cover page.",
  }

  const scored: Array<[keyof DealExtractionResult, string]> = [
    ["title", "Title"],
    ["sponsor", "Sponsor"],
    ["location", "Location"],
    ["dealSize", "Deal Size"],
    ["maxRaise", "Max Raise"],
    ["minimumInvestment", "Minimum Investment"],
    ["targetReturn", "Target Return"],
    ["targetMoic", "Target MOIC"],
    ["holdPeriod", "Hold Period"],
    ["capRate", "Cap Rate"],
    ["noi", "NOI"],
    ["occupancy", "Occupancy"],
    ["yearBuilt", "Year Built"],
    ["useOfProceeds", "Use of Proceeds"],
    ["description", "Description"],
  ]

  const fieldDiagnostics: FieldDiagnostic[] = []
  const missing: string[] = []
  let found = 0
  for (const [key, fieldLabel] of scored) {
    const val = result[key]
    const isMissingTitle = key === "title" && val === "Untitled Deal"
    const isMissing = val === EMPTY || val === "" || isMissingTitle
    const isWeakTitle = key === "title" && usedFilenameTitle && !isMissingTitle

    if (isMissing) {
      missing.push(fieldLabel)
      fieldDiagnostics.push({ field: key, label: fieldLabel, status: "missing", reason: REASONS[key] ?? "This field could not be located in the document text." })
    } else {
      found++
      if (isWeakTitle) {
        fieldDiagnostics.push({
          field: key,
          label: fieldLabel,
          status: "uncertain",
          reason: "No title-like text was found in the document body, so the deal name was derived from the filename instead.",
        })
      } else {
        fieldDiagnostics.push({ field: key, label: fieldLabel, status: "found", reason: "Matched in document text." })
      }
    }
  }

  result.missingFields = missing
  result.confidence = rawText.trim().length === 0 ? 0 : Math.round((found / scored.length) * 100)

  // ── Score-level reasons: category rollups explaining the overall number ──
  const identityMissing = ["Title", "Sponsor", "Location"].filter((l) => missing.includes(l))
  const financialsMissing = ["Deal Size", "Max Raise", "Minimum Investment", "NOI", "Cap Rate"].filter((l) => missing.includes(l))
  const termsMissing = ["Target Return", "Target MOIC", "Hold Period"].filter((l) => missing.includes(l))

  const scoreReasons: string[] = []
  const words = rawText.trim().split(/\s+/).filter(Boolean)
  if (rawText.trim().length === 0) {
    scoreReasons.push("No text could be extracted from this file at all — it is likely a scanned image or a document with no embedded text layer.")
  } else if (words.length < 120) {
    scoreReasons.push(`Only ${words.length} words of text were extracted — a short document limits how many fields have enough surrounding context to match.`)
  }
  if (identityMissing.length > 0) {
    scoreReasons.push(`Deal identity fields (${identityMissing.join(", ")}) are missing — the document may lack a cover page or use non-standard labels for these.`)
  }
  if (financialsMissing.length >= 3) {
    scoreReasons.push(`Most financial metrics (${financialsMissing.join(", ")}) were not found — this document may not include a detailed financials or capitalization section.`)
  } else if (financialsMissing.length > 0) {
    scoreReasons.push(`Some financial metrics (${financialsMissing.join(", ")}) were not found near their usual keywords.`)
  }
  if (termsMissing.length >= 2) {
    scoreReasons.push(`Return/term fields (${termsMissing.join(", ")}) are missing — the document may not state target IRR, MOIC, or hold period explicitly.`)
  }
  if (missing.length === 0) {
    scoreReasons.push("All tracked fields were matched in the document text.")
  } else if (scoreReasons.length === 0) {
    scoreReasons.push(`${missing.length} of ${scored.length} fields (${missing.join(", ")}) had no matching text nearby.`)
  }

  const scoreLabel: IntakeReport["scoreLabel"] = result.confidence >= 75 ? "high" : result.confidence >= 45 ? "medium" : "low"

  result.intakeReport = {
    score: result.confidence,
    scoreLabel,
    scoreReasons,
    fields: fieldDiagnostics,
    documentStats: { characters: rawText.length, words: words.length, pages: EMPTY },
  }

  return result
}
