/**
 * Shared ingest logic used by /api/ingest, /api/review, and /api/contract-review.
 * Extracted here so Next.js route files do not import from each other.
 */

import { store } from '@/lib/store'
import { parseFile } from '@/lib/file-parsers'
import { chunkText } from '@/lib/chunking'
import { validateIngestRequest } from '@/lib/validation'
import type { IngestResponse, SourcePool } from '@/types'

export async function runIngest(
  body: unknown,
  forcedPool?: SourcePool
): Promise<IngestResponse> {
  // 1. Validate request
  let ingestRequest
  try {
    ingestRequest = validateIngestRequest(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    throw Object.assign(new Error(message), { statusCode: 400 })
  }

  const pool = forcedPool ?? ingestRequest.pool
  const { fileName, fileType, content, linkUrl } = ingestRequest

  // 2. Generate a unique sourceId
  const sourceId = crypto.randomUUID()

  // 3. Add source to store with status 'parsing'
  store.addSource({
    id: sourceId,
    name: fileName,
    type: fileType,
    pool,
    uploadedAt: new Date().toISOString(),
    chunkCount: 0,
    status: 'parsing',
    ...(linkUrl ? { linkUrl } : {}),
  })

  let chunkCount = 0

  try {
    // 4. Parse file content
    const parsed = await parseFile(content, fileName, fileType)

    // 5. Chunk the parsed text
    const chunks = chunkText(parsed.text, sourceId, fileName, fileType, pool)
    chunkCount = chunks.length

    // 6. Add chunks to store
    store.addChunks(chunks)

    // 7. Update source status to 'indexed' with chunkCount
    store.updateSource(sourceId, { status: 'indexed', chunkCount })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Parsing failed'
    store.updateSource(sourceId, { status: 'failed', errorMessage })

    return {
      sourceId,
      chunkCount: 0,
      status: 'failed',
      errorMessage,
    }
  }

  return {
    sourceId,
    chunkCount,
    status: 'indexed',
  }
}
