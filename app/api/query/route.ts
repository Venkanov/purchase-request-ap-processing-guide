import { retrieveChunks, formatChunksForPrompt } from '@/lib/retrieval'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { executeQueryStream, DEFAULT_MODEL } from '@/lib/llm'
import { parseReviewComments, parseRiskFlags, parseObligationsMatrix, parseMissingDataItems } from '@/lib/response-parser'
import { buildCitationList } from '@/lib/citations'
import { validateQueryRequest } from '@/lib/validation'
import { store } from '@/lib/store'
import type { QueryMode, SourcePool, DocumentChunk } from '@/types'

// Extend Vercel function timeout to 5 minutes
export const maxDuration = 300

// ─── Pool Selection ───────────────────────────────────────────────────────────

function getPoolsForMode(mode: QueryMode): SourcePool[] {
  switch (mode) {
    case 'specific':  return ['guidance']
    case 'scenario':  return ['guidance']
    case 'review':    return ['guidance', 'review']
    case 'contract':  return ['guidance', 'contract']
    default:          return ['guidance']
  }
}

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

// ─── POST /api/query — SSE streaming ─────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Parse and validate
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON in request body' }, { status: 400, headers: corsHeaders })
  }

  let queryRequest
  try {
    queryRequest = validateQueryRequest(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    return Response.json({ error: message }, { status: 400, headers: corsHeaders })
  }

  const { mode, format, query, model = DEFAULT_MODEL, contractContext, contractText, reviewFileIds } = queryRequest

  // 2. Retrieve chunks
  let chunks: DocumentChunk[]

  if (mode === 'contract') {
    chunks = retrieveChunks(
      'contract revenue recognition lease accounting performance obligation transaction price',
      ['guidance'],
      { limit: 20, maxPerSource: 4 }
    )
  } else if (mode === 'review' && reviewFileIds && reviewFileIds.length > 0) {
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

  // 4. Stream SSE response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        let fullText = ''

        await executeQueryStream(
          systemPrompt,
          userPrompt,
          (delta) => {
            fullText += delta
            send({ type: 'delta', text: delta })
          },
          undefined,
          model
        )

        // Parse structured data from completed markdown
        let reviewComments
        let riskFlags
        let obligationsMatrix
        let missingDataItems

        if (mode === 'review') {
          reviewComments = parseReviewComments(fullText)
          riskFlags = parseRiskFlags(fullText)
          missingDataItems = parseMissingDataItems(fullText)
        }

        if (mode === 'contract') {
          obligationsMatrix = parseObligationsMatrix(fullText)
          riskFlags = parseRiskFlags(fullText)
          missingDataItems = parseMissingDataItems(fullText)
        }

        const citations = buildCitationList(chunks)

        send({
          type: 'done',
          id: crypto.randomUUID(),
          citations,
          ...(reviewComments !== undefined && { reviewComments }),
          ...(riskFlags !== undefined && { riskFlags }),
          ...(obligationsMatrix !== undefined && { obligationsMatrix }),
          ...(missingDataItems !== undefined && { missingDataItems }),
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error('[/api/query] Stream error:', err)
        send({ type: 'error', message: err instanceof Error ? err.message : 'Internal server error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders,
    },
  })
}
