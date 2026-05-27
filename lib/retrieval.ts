// ─── Keyword-Based Retrieval (TF-IDF style) ───────────────────────────────────
// Scores every chunk in the requested pools against a query by calculating
// term-frequency of query tokens within the chunk text, then returns the
// top-K chunks sorted by score descending.

import { store } from '@/lib/store'
import type { DocumentChunk, SourcePool } from '@/types'

// ── Tokenisation ─────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'that', 'this',
  'it', 'its', 'as', 'if', 'into', 'than', 'then', 'not', 'no', 'so',
])

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Score a single chunk against a list of query tokens.
 * Score = sum of normalised term-frequency for each query token found in chunk.
 * Longer chunks are penalised slightly by normalising by token count.
 */
function scoreChunk(chunk: DocumentChunk, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0

  const chunkTokens = tokenise(chunk.text)
  if (chunkTokens.length === 0) return 0

  // Build a frequency map for the chunk
  const freq = new Map<string, number>()
  for (const t of chunkTokens) {
    freq.set(t, (freq.get(t) ?? 0) + 1)
  }

  let score = 0
  for (const qt of queryTokens) {
    const tf = (freq.get(qt) ?? 0) / chunkTokens.length
    score += tf
  }

  // Bonus for exact multi-word phrase match (case-insensitive)
  const queryPhrase = queryTokens.join(' ')
  if (chunk.text.toLowerCase().includes(queryPhrase)) {
    score += 0.5
  }

  // Boost chunks whose section heading contains query tokens
  if (chunk.metadata.sectionHeading) {
    const headingTokens = tokenise(chunk.metadata.sectionHeading)
    for (const qt of queryTokens) {
      if (headingTokens.includes(qt)) {
        score += 0.1
      }
    }
  }

  return score
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface RetrievalOptions {
  /** Maximum number of chunks to return.  Default: 24 */
  limit?: number
  /** Minimum score threshold (chunks below this are excluded).  Default: 0 */
  minScore?: number
  /**
   * Maximum chunks allowed from any single source document.
   * Prevents one guide from dominating the context.  Default: 5
   */
  maxPerSource?: number
}

/**
 * Retrieve the most relevant chunks from the given pools for a query string.
 *
 * Uses a diversified round-robin strategy:
 *  1. Score every candidate chunk.
 *  2. Group top-scored chunks by source document.
 *  3. Round-robin across sources so each guide gets a fair share of slots.
 *
 * This prevents a single guide from monopolising all context slots.
 */
export function retrieveChunks(
  query: string,
  pools: SourcePool[],
  options?: RetrievalOptions
): DocumentChunk[] {
  const limit = options?.limit ?? 24
  const minScore = options?.minScore ?? 0
  const maxPerSource = options?.maxPerSource ?? 5

  const queryTokens = tokenise(query)

  // Collect all chunks from the requested pools
  const candidates: DocumentChunk[] = []
  for (const pool of pools) {
    candidates.push(...store.getChunksByPool(pool))
  }

  if (candidates.length === 0) return []

  // Score every chunk and drop zero/below-threshold scores
  const scored = candidates
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .filter(({ score }) => score > minScore)
    .sort((a, b) => b.score - a.score)

  // Group by source document (sourceId), keeping per-source order by score
  const bySource = new Map<string, typeof scored>()
  for (const item of scored) {
    const sid = item.chunk.metadata.sourceId
    if (!bySource.has(sid)) bySource.set(sid, [])
    const bucket = bySource.get(sid)!
    if (bucket.length < maxPerSource) bucket.push(item)
  }

  // Round-robin across sources: each pass takes the next-best chunk from
  // every source until we reach `limit` total chunks.
  const sources = Array.from(bySource.values())
  const result: DocumentChunk[] = []
  let pass = 0

  while (result.length < limit) {
    let added = false
    for (const bucket of sources) {
      if (result.length >= limit) break
      if (pass < bucket.length) {
        result.push(bucket[pass].chunk)
        added = true
      }
    }
    if (!added) break // all buckets exhausted
    pass++
  }

  return result
}

/**
 * Format a list of retrieved chunks into a prompt-injection string that
 * includes metadata (source, page, section) before each excerpt.
 */
export function formatChunksForPrompt(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) {
    return '[No relevant source material was found in the loaded documents.]'
  }

  return chunks
    .map((chunk, i) => {
      const { fileName, pageNumber, sectionHeading, pool } = chunk.metadata
      const parts: string[] = [`[${i + 1}] Source: ${fileName} (pool: ${pool})`]
      if (pageNumber !== undefined) parts.push(`Page: ${pageNumber}`)
      if (sectionHeading) parts.push(`Section: ${sectionHeading}`)
      parts.push('')
      parts.push(chunk.text)
      return parts.join('\n')
    })
    .join('\n\n---\n\n')
}
