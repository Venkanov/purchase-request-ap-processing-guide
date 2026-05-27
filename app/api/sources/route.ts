import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import type { SourceListResponse } from '@/types'

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── GET /api/sources ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const response: SourceListResponse = {
      guidance: store.getSourcesByPool('guidance'),
      review: store.getSourcesByPool('review'),
      contract: store.getSourcesByPool('contract'),
    }

    return NextResponse.json(response, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[/api/sources] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    )
  }
}
