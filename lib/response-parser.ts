// ─── Response Parser ──────────────────────────────────────────────────────────
// Extract structured data (review comments, risk flags, obligations matrix,
// missing data items) from Claude's markdown response text.
// JSON blocks embedded by the prompt builders are located via regex and parsed.

import { v4 as uuidv4 } from 'uuid'
import type {
  CommentType,
  ObligationRow,
  ReviewComment,
  RiskFlag,
  RiskLevel,
} from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Find all ```json … ``` fenced blocks in the markdown and return their
 * parsed contents as an array (one entry per block).
 */
function extractJsonBlocks(markdown: string): unknown[] {
  const results: unknown[] = []
  // Match fenced code blocks labelled "json" (case-insensitive, optional whitespace)
  const pattern = /```json\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(markdown)) !== null) {
    const raw = match[1].trim()
    try {
      const parsed = JSON.parse(raw)
      results.push(parsed)
    } catch {
      // Skip malformed blocks silently — the LLM may occasionally produce bad JSON
      console.warn('[response-parser] Failed to parse JSON block:', raw.slice(0, 120))
    }
  }

  return results
}

/** Return true if value is a non-null object (not an array). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]
  return typeof v === 'string' ? v.trim() : ''
}

// ── Review Comments ───────────────────────────────────────────────────────────

const VALID_COMMENT_TYPES: CommentType[] = [
  'Missing Citation',
  'Unsupported Conclusion',
  'Missing Fact',
  'Incomplete Guidance',
  'Inconsistent with Source',
  'Ambiguous Wording',
  'Alternative View Not Considered',
  'Drafting Improvement',
]

function isValidCommentType(value: string): value is CommentType {
  return VALID_COMMENT_TYPES.includes(value as CommentType)
}

/**
 * Parse ReviewComment objects from a markdown response.
 * Looks for the first JSON block that contains an array of comment-shaped objects.
 */
export function parseReviewComments(markdown: string): ReviewComment[] {
  const blocks = extractJsonBlocks(markdown)

  for (const block of blocks) {
    if (!Array.isArray(block)) continue

    const comments: ReviewComment[] = []
    for (const item of block) {
      if (!isObject(item)) continue
      const commentType = getString(item, 'commentType')
      if (!isValidCommentType(commentType)) continue

      comments.push({
        id: uuidv4(),
        sectionPage: getString(item, 'sectionPage'),
        commentType,
        issue: getString(item, 'issue'),
        recommendedRevision: getString(item, 'recommendedRevision'),
        supportingGuidanceReference: getString(item, 'supportingGuidanceReference'),
      })
    }

    if (comments.length > 0) return comments
  }

  return []
}

// ── Risk Flags ────────────────────────────────────────────────────────────────

const VALID_RISK_LEVELS: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW']

function isValidRiskLevel(value: string): value is RiskLevel {
  return VALID_RISK_LEVELS.includes(value as RiskLevel)
}

/**
 * Parse RiskFlag objects from a markdown response.
 * Looks for JSON blocks that contain an array of risk-flag-shaped objects.
 */
export function parseRiskFlags(markdown: string): RiskFlag[] {
  const blocks = extractJsonBlocks(markdown)

  for (const block of blocks) {
    if (!Array.isArray(block)) continue

    const flags: RiskFlag[] = []
    for (const item of block) {
      if (!isObject(item)) continue
      const riskLevel = getString(item, 'riskLevel').toUpperCase()
      if (!isValidRiskLevel(riskLevel)) continue

      flags.push({
        id: uuidv4(),
        riskLevel,
        issue: getString(item, 'issue'),
        recommendedAction: getString(item, 'recommendedAction'),
      })
    }

    if (flags.length > 0) return flags
  }

  return []
}

// ── Obligations Matrix ────────────────────────────────────────────────────────

/**
 * Parse ObligationRow objects from a markdown response.
 * Looks for JSON blocks that contain an array of obligation-shaped objects.
 */
export function parseObligationsMatrix(markdown: string): ObligationRow[] {
  const blocks = extractJsonBlocks(markdown)

  // Obligations blocks typically come after risk flags, so scan all blocks
  for (const block of blocks) {
    if (!Array.isArray(block)) continue

    const rows: ObligationRow[] = []
    for (const item of block) {
      if (!isObject(item)) continue

      // Must have at minimum "party" and "obligation" to be an obligation row
      const party = getString(item, 'party')
      const obligation = getString(item, 'obligation')
      if (!party || !obligation) continue

      rows.push({
        id: uuidv4(),
        party,
        obligation,
        owedTo: getString(item, 'owedTo'),
        triggerOrDate: getString(item, 'triggerOrDate'),
        ...(item['dependencies'] ? { dependencies: getString(item, 'dependencies') } : {}),
      })
    }

    if (rows.length > 0) return rows
  }

  return []
}

// ── Missing Data Items ────────────────────────────────────────────────────────

/**
 * Extract a list of missing-data items from a markdown response.
 * Looks for a section headed "Missing" (e.g. "Missing Facts", "Outstanding Questions",
 * "Missing Data Items") and collects the bullet/numbered items beneath it.
 */
export function parseMissingDataItems(markdown: string): string[] {
  const items: string[] = []

  // Locate a section that describes missing information
  const sectionPattern =
    /#{1,3}\s*(?:missing\s+(?:data\s+items?|facts?|information)|outstanding\s+(?:questions?|items?)|open\s+items?|e\.\s*outstanding[^#\n]*)/gi

  const sectionMatch = sectionPattern.exec(markdown)
  if (!sectionMatch) return items

  // Grab text from that section until the next heading or end of string
  const afterSection = markdown.slice(sectionMatch.index + sectionMatch[0].length)
  const nextHeadingMatch = /\n#{1,3}\s/.exec(afterSection)
  const sectionBody = nextHeadingMatch
    ? afterSection.slice(0, nextHeadingMatch.index)
    : afterSection

  // Split by lines and collect bullet / numbered list items
  for (const line of sectionBody.split('\n')) {
    const cleaned = line.replace(/^[\s]*[-*•\d.]+\s*/, '').trim()
    if (cleaned.length > 5) {
      items.push(cleaned)
    }
  }

  // Deduplicate and return non-empty items only
  return [...new Set(items.filter((i) => i.length > 0))]
}
