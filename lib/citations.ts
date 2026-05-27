// ─── Citation Utilities ───────────────────────────────────────────────────────
// Build Citation objects from retrieved DocumentChunks and format them for
// display in markdown responses.

import type { Citation, DocumentChunk } from '@/types'

// ── Builders ─────────────────────────────────────────────────────────────────

/**
 * Derive a Citation from each DocumentChunk.
 * The excerpt is taken as the first 200 characters of the chunk text so that
 * the caller can display a meaningful snippet without truncating mid-word.
 */
export function buildCitationList(chunks: DocumentChunk[]): Citation[] {
  // De-duplicate: if the same source+page+section appears multiple times,
  // keep only the first (highest-scored) occurrence.
  const seen = new Set<string>()
  const citations: Citation[] = []

  for (const chunk of chunks) {
    const { sourceId, fileName, pageNumber, sectionHeading } = chunk.metadata
    const key = `${sourceId}::${pageNumber ?? ''}::${sectionHeading ?? ''}`

    if (seen.has(key)) continue
    seen.add(key)

    // Extract an excerpt: up to 200 chars, breaking at a word boundary
    const raw = chunk.text.trim()
    let excerpt = raw.slice(0, 200)
    if (raw.length > 200) {
      // Walk back to the last space to avoid cutting mid-word
      const lastSpace = excerpt.lastIndexOf(' ')
      if (lastSpace > 100) excerpt = excerpt.slice(0, lastSpace)
      excerpt += '…'
    }

    citations.push({
      sourceId,
      fileName,
      ...(pageNumber !== undefined ? { pageNumber } : {}),
      ...(sectionHeading ? { sectionHeading } : {}),
      excerpt,
    })
  }

  return citations
}

// ── Formatters ────────────────────────────────────────────────────────────────

/**
 * Render a citation list as a markdown-formatted reference section.
 * Each citation is numbered and includes the file name, optional page /
 * section, and an excerpt.
 */
export function formatCitationsMarkdown(citations: Citation[]): string {
  if (citations.length === 0) {
    return '_No citations available._'
  }

  const lines: string[] = ['## References\n']

  citations.forEach((c, i) => {
    const num = i + 1
    const meta: string[] = [c.fileName]
    if (c.pageNumber !== undefined) meta.push(`p. ${c.pageNumber}`)
    if (c.sectionHeading) meta.push(`§ ${c.sectionHeading}`)

    lines.push(`**[${num}]** ${meta.join(' — ')}`)
    lines.push(`> ${c.excerpt}`)
    lines.push('')
  })

  return lines.join('\n')
}
