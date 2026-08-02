import { generateText, Output } from 'ai'
import { get } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const analysisSchema = z.object({
  extractedData: z.object({
    documentType: z.string().nullable().describe('Type of document (PPM, NDA, Contract, Financial Statement, etc.)'),
    parties: z.array(z.string()).describe('Names of parties involved in the document'),
    effectiveDate: z.string().nullable().describe('Effective date or signing date'),
    expirationDate: z.string().nullable().describe('Expiration or termination date if applicable'),
    totalValue: z.string().nullable().describe('Total monetary value if applicable'),
    keyTerms: z.array(z.string()).describe('Key terms, conditions, or provisions'),
    propertyAddress: z.string().nullable().describe('Property address if real estate related'),
    investmentAmount: z.string().nullable().describe('Investment or capital amount if applicable'),
  }),
  riskAssessment: z.object({
    score: z.number().min(0).max(100).describe('Overall risk score from 0 (low risk) to 100 (high risk)'),
    level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('Risk level category'),
    factors: z.array(z.object({
      name: z.string().describe('Name of risk factor'),
      severity: z.enum(['low', 'medium', 'high']).describe('Severity of this factor'),
      description: z.string().describe('Brief explanation of the risk'),
    })).describe('Individual risk factors identified'),
  }),
  complianceChecks: z.array(z.object({
    item: z.string().describe('Compliance item being checked'),
    status: z.enum(['pass', 'fail', 'warning', 'not_applicable']).describe('Status of this compliance check'),
    notes: z.string().nullable().describe('Additional notes or explanation'),
  })).describe('List of compliance checks performed'),
  summary: z.string().describe('Executive summary of the document in 2-3 sentences'),
})

export async function POST(request: NextRequest) {
  try {
    const { pathname, filename, fileType } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
    }

    // Fetch the file from Vercel Blob
    const result = await get(pathname, { access: 'private' })
    
    if (!result) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Convert stream to buffer then to base64
    if (!result.stream) {
      return NextResponse.json({ error: 'File stream unavailable' }, { status: 500 })
    }
    const chunks: Uint8Array[] = []
    const reader = result.stream.getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    
    const buffer = Buffer.concat(chunks)
    const base64Data = buffer.toString('base64')
    
    // Determine media type
    const mediaType = fileType || result.blob.contentType || 'application/pdf'

    // Process with AI
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: analysisSchema,
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert due diligence analyst for real estate and private equity investments. Analyze this document and extract the following:

1. **Document Extraction**: Identify the document type, parties involved, key dates, monetary values, and important terms.

2. **Risk Assessment**: Evaluate the risk level (0-100 score) considering:
   - Legal and regulatory compliance risks
   - Financial risks (leverage, liquidity, market exposure)
   - Counterparty risks
   - Documentation completeness
   - Red flags or unusual provisions

3. **Compliance Checks**: Verify the presence and adequacy of:
   - KYC/AML documentation or attestations
   - Beneficial ownership declarations
   - Accredited investor certifications
   - Required disclosures (SEC, state, etc.)
   - Insurance and liability provisions
   - Escrow and fund handling provisions

4. **Executive Summary**: Provide a concise 2-3 sentence summary of the document's purpose and key findings.

Document filename: ${filename || 'Unknown'}`,
            },
            {
              type: 'file',
              data: base64Data,
              mediaType: mediaType,
              filename: filename || 'document',
            },
          ],
        },
      ],
    })

    return NextResponse.json({
      analysis: output,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
