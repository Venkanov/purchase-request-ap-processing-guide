import { NextResponse } from 'next/server'
import { retrieveChunks, formatChunksForPrompt } from '@/lib/retrieval'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { executeQuery, DEFAULT_MODEL } from '@/lib/llm'
import { parseReviewComments, parseRiskFlags, parseObligationsMatrix, parseMissingDataItems } from '@/lib/response-parser'
import { buildCitationList } from '@/lib/citations'
import { validateQueryRequest } from '@/lib/validation'
import { store } from '@/lib/store'
import type { QueryMode, SourcePool, QueryResponse, DocumentChunk } from '@/types'

// ─── Pool Selection ───────────────────────────────────────────────────────────

function getPoolsForMode(mode: QueryMode): SourcePool[] {
  switch (mode) {
    case 'specific':
      return ['guidance']
    case 'scenario':
      return ['guidance']
    case 'review':
      return ['guidance', 'review']
    case 'contract':
      return ['guidance', 'contract']
    default:
      return ['guidance']
  }
}

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// ─── POST /api/query ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      )
    }

    let queryRequest
    try {
      queryRequest = validateQueryRequest(body)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid request'
      return NextResponse.json(
        { error: message },
        { status: 400, headers: corsHeaders }
      )
    }

    const { mode, format, query, model = DEFAULT_MODEL, contractContext, contractText, reviewFileIds } = queryRequest

    // 2. Retrieve chunks
    let chunks: DocumentChunk[]

    if (mode === 'contract') {
      // Contract text is sent inline — retrieve only guidance context
      chunks = retrieveChunks(
        'contract revenue recognition lease accounting performance obligation transaction price',
        ['guidance'],
        { limit: 20, maxPerSource: 4 }
      )
    } else if (mode === 'review' && reviewFileIds && reviewFileIds.length > 0) {
      // For review mode: include all review-file chunks in full
      const reviewChunks = reviewFileIds
        .flatMap((id) => store.getChunksBySource(id))
        .sort((a, b) => (a.metadata.pageNumber ?? 0) - (b.metadata.pageNumber ?? 0))
      const reviewDocText = reviewChunks.map((c) => c.text).join('\n\n')
      const combinedQuery = reviewDocText + '\n\n' + query
      chunks = retrieveChunks(combinedQuery, ['guidance'], { limit: 20, maxPerSource: 4 })
      Object.assign(queryRequest, { query: reviewDocText + (query ? '\n\n---\n\n' + query : '') })
    } else {
      const pools = getPoolsForMode(mode)
      chunks = retrieveChunks(query, pools, { limit: 24, maxPerSource: 5 })
    }

    // 3. Build prompts
    const context = formatChunksForPrompt(chunks)
    const systemPrompt = buildSystemPrompt(mode, format)
    const userPrompt = buildUserPrompt(mode, format, queryRequest.query, context, contractContext, contractText)

    // 5. Execute LLM query
    const markdown = await executeQuery(systemPrompt, userPrompt, undefined, model)

    // 6. Parse structured data from the response based on mode
    let reviewComments
    let riskFlags
    let obligationsMatrix
    let missingDataItems

    if (mode === 'review') {
      reviewComments = parseReviewComments(markdown)
      riskFlags = parseRiskFlags(markdown)
      missingDataItems = parseMissingDataItems(markdown)
    }

    if (mode === 'contract') {
      obligationsMatrix = parseObligationsMatrix(markdown)
      riskFlags = parseRiskFlags(markdown)
      missingDataItems = parseMissingDataItems(markdown)
    }

    // 7. Build citation list
    const citations = buildCitationList(chunks)

    // 8. Return QueryResponse
    const response: QueryResponse = {
      id: crypto.randomUUID(),
      mode,
      format,
      markdown,
      citations,
      ...(reviewComments !== undefined && { reviewComments }),
      ...(riskFlags !== undefined && { riskFlags }),
      ...(obligationsMatrix !== undefined && { obligationsMatrix }),
      ...(missingDataItems !== undefined && { missingDataItems }),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('[/api/query] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    )
  }
}
