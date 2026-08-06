import { generateText, Output } from 'ai'
import { put, get } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

// Schema for the structured deal fields we want to extract
const dealExtractionSchema = z.object({
  title: z.string().describe('Name or title of the deal / project'),
  sponsor: z.string().describe('Sponsor, developer, or fund manager name'),
  location: z.string().describe('City and state of the property or project, e.g. "Austin, TX"'),
  assetType: z.enum([
    'Multifamily', 'Industrial', 'Office', 'Retail', 'Mixed-Use',
    'Student Housing', 'Hotel', 'Self-Storage', 'Medical', 'Other'
  ]).describe('Primary asset class or property type'),
  // CapIV canonical taxonomy fields
  dealTypePrimary: z.enum([
    'RE_DIRECT', 'PRIVATE_CREDIT', 'FUND_GP_LP', 'OPCO_EQUITY', 'M_AND_A', 'SPV_COINVEST', 'PORTFOLIO_ASSET', 'DIGITAL_INTERFACE'
  ]).describe('CapIV primary deal type. RE_DIRECT=direct real estate equity/JV; PRIVATE_CREDIT=debt/loan; FUND_GP_LP=fund or GP-LP interest; OPCO_EQUITY=operating company equity; M_AND_A=company/asset acquisition; SPV_COINVEST=single-asset SPV or co-invest; PORTFOLIO_ASSET=grouped/multi-asset; DIGITAL_INTERFACE=tokenized. Default to RE_DIRECT for a single real estate asset.'),
  transactionPurpose: z.enum([
    'acquisition', 'development', 'recap', 'refinance', 'growth', 'buyout', 'liquidity', 'fundraise', 'other'
  ]).describe('Primary transaction purpose'),
  requestType: z.enum([
    'equity', 'debt', 'preferred', 'mezzanine', 'JV', 'LP', 'GP', 'co-invest', 'hybrid', 'other'
  ]).describe('Type of capital requested'),
  useOfProceeds: z.string().describe('How the capital will be used, e.g. "Acquisition + $4M renovation capex", otherwise "—"'),
  dealSize: z.string().describe('Total deal size or raise amount, e.g. "$45M"'),
  investmentType: z.enum(['Equity', 'Debt', 'Hybrid']).describe('Type of capital: Equity, Debt, or Hybrid'),
  riskProfile: z.enum(['Core', 'Core-Plus', 'Value-Add', 'Opportunistic']).describe('Investment risk profile'),
  targetReturn: z.string().describe('Projected return, IRR, or equity multiple, e.g. "18-22% IRR" or "2.1x EM"'),
  targetMoic: z.string().describe('Target equity multiple / MOIC, e.g. "2.1x", otherwise "—"'),
  holdPeriod: z.string().describe('Projected hold period, e.g. "5-7 years"'),
  minimumInvestment: z.string().describe('Minimum investor check size, e.g. "$250,000"'),
  maxRaise: z.string().describe('Maximum capital raise amount, e.g. "$45M"'),
  description: z.string().describe('2-4 sentence executive summary of the deal — opportunity, strategy, and key highlights'),
  capRate: z.string().describe('Going-in cap rate if available, e.g. "5.5%", otherwise "—"'),
  noi: z.string().describe('Net Operating Income if available, e.g. "$2.5M", otherwise "—"'),
  occupancy: z.string().describe('Current or projected occupancy rate, e.g. "94%", otherwise "—"'),
  yearBuilt: z.string().describe('Year the property was built or expected completion year, otherwise "—"'),
  documentType: z.enum(['Executive Summary', 'Offering Memorandum', 'Term Sheet', 'Investment Deck', 'Other']).describe('Type of document uploaded'),
  confidence: z.number().min(0).max(100).describe('Confidence score 0-100 for the quality of extraction based on document completeness'),
  missingFields: z.array(z.string()).describe('List of fields that could not be found in the document'),
})

export type DealExtractionResult = z.infer<typeof dealExtractionSchema>

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, DOCX, PNG, or JPG.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    // Step 1: Upload file to Vercel Blob
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const pathname = `deals/uploads/${timestamp}-${sanitizedName}`

    const blob = await put(pathname, file, { access: 'private' })

    // Step 2: Fetch back from Blob and convert to base64 for AI
    const blobResult = await get(blob.pathname, { access: 'private' })

    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: 'File could not be read after upload.' }, { status: 500 })
    }

    const chunks: Uint8Array[] = []
    const reader = blobResult.stream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }

    const buffer = Buffer.concat(chunks)
    const base64Data = buffer.toString('base64')
    const mediaType = file.type || 'application/pdf'

    // Step 3: Extract deal fields with AI
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({ schema: dealExtractionSchema }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert real estate investment analyst. Extract structured deal information from this document.

This is likely an Executive Summary, Offering Memorandum (OM), Term Sheet, or Investment Deck for a real estate or private equity deal.

Extract EVERY field you can find. For fields you cannot find, use "—" for strings or make your best inference from context. Be precise with monetary amounts (include the dollar sign and M/B suffix). For risk profile, classify based on the strategy described: stabilized/core assets = Core or Core-Plus, repositioning/renovation = Value-Add, ground-up or distressed = Opportunistic.

Document filename: ${file.name}`,
            },
            {
              type: 'file',
              data: base64Data,
              mediaType: mediaType,
              filename: file.name,
            },
          ],
        },
      ],
    })

    return NextResponse.json({
      extraction: output,
      blobPathname: blob.pathname,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      extractedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[deals/extract] Error:', error)
    return NextResponse.json(
      { error: 'Extraction failed. Please check your document and try again.' },
      { status: 500 }
    )
  }
}
