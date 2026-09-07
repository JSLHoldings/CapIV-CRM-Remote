import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { extractTextFromFile, parseDealFromText, type DealExtractionResult } from '@/lib/deal-text-parser'

export type { DealExtractionResult }

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

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

    const buffer = Buffer.from(await file.arrayBuffer())
    const mediaType = file.type || 'application/pdf'

    // Retain the source document in Blob for record-keeping (best-effort).
    let blobPathname = ''
    try {
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const blob = await put(`deals/uploads/${timestamp}-${sanitizedName}`, buffer, {
        access: 'private',
        contentType: mediaType,
      })
      blobPathname = blob.pathname
    } catch (blobError) {
      console.error('[deals/extract] Blob upload skipped:', blobError)
    }

    // Free, self-contained extraction: pull text, then parse fields with heuristics.
    const text = await extractTextFromFile(buffer, mediaType, file.name)

    if (!text.trim()) {
      const isImage = mediaType.startsWith('image/')
      return NextResponse.json(
        {
          error: isImage
            ? 'This is an image with no readable text layer, so fields cannot be auto-filled. Use "Add Deal" to enter the details manually — the deal will still be saved.'
            : 'No readable text was found in this document. Use "Add Deal" to enter the details manually — the deal will still be saved.',
        },
        { status: 422 }
      )
    }

    const extraction = parseDealFromText(text, file.name)

    return NextResponse.json({
      extraction,
      blobPathname,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      extractedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[deals/extract] Error:', error)
    const raw = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Extraction failed: ${raw || 'Please check your document and try again.'}` },
      { status: 500 }
    )
  }
}
