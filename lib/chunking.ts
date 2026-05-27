// ─── Text Chunking ────────────────────────────────────────────────────────────
// Splits a document's text into overlapping character-level chunks and
// attaches ChunkMetadata to each one.  A lightweight section-heading detector
// is used to annotate each chunk with the most recent heading it falls under.

import { v4 as uuidv4 } from 'uuid'
import type { DocumentChunk, DocumentType, SourcePool } from '@/types'

export interface ChunkOptions {
  /** Maximum characters per chunk.  Default: 1500 */
  chunkSize?: number
  /** Overlap in characters between consecutive chunks.  Default: 200 */
  overlap?: number
}

// ── Heading detection ────────────────────────────────────────────────────────

/**
 * Returns true when the line looks like a section heading:
 *   - Short (≤ 80 chars) and ends with a colon, OR
 *   - Entirely upper-case (and at least 3 chars long)
 */
function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  // "Short line ending with colon" heuristic
  if (trimmed.length <= 80 && trimmed.endsWith(':')) return true

  // ALL-CAPS heuristic (ignore single-character "lines" that may be noise)
  if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Walk the text line-by-line and build a list of { charOffset, heading } pairs
 * so that any character position can be associated with the most recent heading.
 */
function extractHeadingOffsets(text: string): Array<{ offset: number; heading: string }> {
  const result: Array<{ offset: number; heading: string }> = []
  let offset = 0
  for (const line of text.split('\n')) {
    if (isHeading(line)) {
      result.push({ offset, heading: line.trim().replace(/:$/, '') })
    }
    offset += line.length + 1 // +1 for the '\n'
  }
  return result
}

function headingAtOffset(
  headingOffsets: Array<{ offset: number; heading: string }>,
  charOffset: number
): string | undefined {
  let current: string | undefined
  for (const entry of headingOffsets) {
    if (entry.offset <= charOffset) {
      current = entry.heading
    } else {
      break
    }
  }
  return current
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Chunk `text` into overlapping segments and return an array of DocumentChunk
 * objects ready to be stored in the in-memory store.
 *
 * @param text       The full extracted text of the document.
 * @param sourceId   UUID of the parent LoadedSource.
 * @param fileName   Original file name.
 * @param fileType   Document type string ('pdf' | 'docx' | …).
 * @param pool       Source pool the document belongs to.
 * @param options    Optional chunking parameters.
 */
export function chunkText(
  text: string,
  sourceId: string,
  fileName: string,
  fileType: string,
  pool: string,
  options?: ChunkOptions
): DocumentChunk[] {
  const chunkSize = options?.chunkSize ?? 1500
  const overlap = options?.overlap ?? 200
  const uploadedAt = new Date().toISOString()

  // Normalise whitespace but preserve paragraph breaks
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!normalised.trim()) return []

  const headingOffsets = extractHeadingOffsets(normalised)
  const chunks: DocumentChunk[] = []

  let start = 0
  let chunkIndex = 0

  while (start < normalised.length) {
    const end = Math.min(start + chunkSize, normalised.length)
    const chunkText = normalised.slice(start, end).trim()

    if (chunkText.length > 0) {
      const sectionHeading = headingAtOffset(headingOffsets, start)

      chunks.push({
        id: uuidv4(),
        text: chunkText,
        metadata: {
          sourceId,
          fileName,
          documentType: fileType as DocumentType,
          pool: pool as SourcePool,
          chunkIndex,
          uploadedAt,
          ...(sectionHeading ? { sectionHeading } : {}),
        },
      })

      chunkIndex++
    }

    // Advance by chunkSize minus overlap; stop if we have reached the end
    if (end >= normalised.length) break
    start = end - overlap
  }

  return chunks
}
