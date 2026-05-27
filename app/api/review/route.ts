import { NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest-handler'

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── POST /api/review ─────────────────────────────────────────────────────────
//
// Identical to /api/ingest but forces pool = 'review'.
// Accepts the same JSON body shape as IngestRequest.

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

    const response = await runIngest(body, 'review')
    const httpStatus = response.status === 'indexed' ? 200 : 422

    return NextResponse.json(response, { status: httpStatus, headers: corsHeaders })
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 400) {
      const message = err instanceof Error ? err.message : 'Invalid request'
      return NextResponse.json(
        { error: message },
        { status: 400, headers: corsHeaders }
      )
    }

    console.error('[/api/review] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    )
  }
}
