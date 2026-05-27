import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { runIngest } from '@/lib/ingest-handler'

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── POST /api/ingest ─────────────────────────────────────────────────────────

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

    const response = await runIngest(body)
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

    console.error('[/api/ingest] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// ─── DELETE /api/ingest?sourceId=<id> ────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sourceId = searchParams.get('sourceId')

    if (!sourceId || sourceId.trim() === '') {
      return NextResponse.json(
        { error: 'Missing required query parameter: sourceId' },
        { status: 400, headers: corsHeaders }
      )
    }

    store.removeSource(sourceId)

    return NextResponse.json(
      { success: true, sourceId },
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('[/api/ingest] DELETE error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    )
  }
}
