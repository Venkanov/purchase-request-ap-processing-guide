import { NextResponse } from 'next/server'
import { parseFile } from '@/lib/file-parsers'
import type { DocumentType, ContractParseResponse } from '@/types'

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── POST /api/contract-review ────────────────────────────────────────────────
//
// Parses the uploaded contract file and returns its text directly.
// Contract files are NEVER stored or indexed — they are held in the browser
// and sent inline with each query request.

export async function POST(req: Request) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { fileName, fileType, content } = body as Record<string, unknown>

    if (typeof fileName !== 'string' || !fileName.trim()) {
      return NextResponse.json({ error: '"fileName" is required.' }, { status: 400, headers: corsHeaders })
    }
    if (typeof fileType !== 'string' || !['pdf', 'docx', 'txt'].includes(fileType)) {
      return NextResponse.json({ error: '"fileType" must be pdf, docx, or txt.' }, { status: 400, headers: corsHeaders })
    }
    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: '"content" is required.' }, { status: 400, headers: corsHeaders })
    }

    // Parse the file — do NOT store anything
    const parsed = await parseFile(content, fileName, fileType as DocumentType)

    if (!parsed.text || parsed.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any text from the uploaded file. Please check the file is not scanned/image-only.' },
        { status: 422, headers: corsHeaders }
      )
    }

    const response: ContractParseResponse = {
      id: crypto.randomUUID(),
      fileName: fileName.trim(),
      text: parsed.text,
      pageCount: parsed.pageCount,
    }

    return NextResponse.json(response, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[/api/contract-review] Parse error:', err)
    const message = err instanceof Error ? err.message : 'Failed to parse contract file'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
