// ─── Input Validation ─────────────────────────────────────────────────────────
// Runtime validators for API route request bodies.  All validators throw
// descriptive Error objects on failure so that API routes can catch them and
// return 400 responses with meaningful messages.

import type {
  ClaudeModel,
  DocumentType,
  IngestRequest,
  OutputFormat,
  QueryMode,
  QueryRequest,
  SourcePool,
} from '@/types'

// ── Allowed value sets ────────────────────────────────────────────────────────

const QUERY_MODES: QueryMode[] = ['specific', 'scenario', 'review', 'contract']
const OUTPUT_FORMATS: OutputFormat[] = ['detailed', 'tldr', 'onepager', 'memo']
const CLAUDE_MODELS: ClaudeModel[] = ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
const SOURCE_POOLS: SourcePool[] = ['guidance', 'review', 'contract']
const DOCUMENT_TYPES: DocumentType[] = ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'link']

// ── Shared utilities ──────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(
  obj: Record<string, unknown>,
  field: string,
  label?: string
): string {
  const v = obj[field]
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`"${label ?? field}" is required and must be a non-empty string.`)
  }
  return v.trim()
}

function requireOneOf<T extends string>(
  obj: Record<string, unknown>,
  field: string,
  allowed: T[],
  label?: string
): T {
  const v = requireString(obj, field, label)
  if (!allowed.includes(v as T)) {
    throw new Error(
      `"${label ?? field}" must be one of: ${allowed.join(', ')}. Received: "${v}".`
    )
  }
  return v as T
}

function optionalStringArray(
  obj: Record<string, unknown>,
  field: string
): string[] | undefined {
  const v = obj[field]
  if (v === undefined || v === null) return undefined
  if (!Array.isArray(v)) {
    throw new Error(`"${field}" must be an array of strings if provided.`)
  }
  if (!v.every((item) => typeof item === 'string')) {
    throw new Error(`All items in "${field}" must be strings.`)
  }
  return v as string[]
}

// ── QueryRequest validator ────────────────────────────────────────────────────

/**
 * Validate and coerce an unknown request body into a QueryRequest.
 * Throws a descriptive Error if any required field is missing or invalid.
 */
export function validateQueryRequest(body: unknown): QueryRequest {
  if (!isObject(body)) {
    throw new Error('Request body must be a JSON object.')
  }

  const mode = requireOneOf(body, 'mode', QUERY_MODES)
  const format = requireOneOf(body, 'format', OUTPUT_FORMATS)
  const query = requireString(body, 'query')

  // model is optional — validate only if provided
  let model: ClaudeModel | undefined
  if (body['model'] !== undefined && body['model'] !== null) {
    model = requireOneOf(body, 'model', CLAUDE_MODELS, 'model') as ClaudeModel
  }

  const reviewFileIds = optionalStringArray(body, 'reviewFileIds')

  const contractText =
    typeof body['contractText'] === 'string' && body['contractText'].trim()
      ? body['contractText']
      : undefined

  const contractContext =
    typeof body['contractContext'] === 'string' ? body['contractContext'] : undefined

  // Mode-specific requirements
  if (mode === 'review' && (!reviewFileIds || reviewFileIds.length === 0)) {
    throw new Error(
      '"reviewFileIds" must be provided and non-empty when mode is "review".'
    )
  }

  if (mode === 'contract' && !contractText) {
    throw new Error(
      '"contractText" must be provided and non-empty when mode is "contract".'
    )
  }

  return {
    mode,
    format,
    query,
    ...(model !== undefined ? { model } : {}),
    ...(reviewFileIds !== undefined ? { reviewFileIds } : {}),
    ...(contractText !== undefined ? { contractText } : {}),
    ...(contractContext !== undefined ? { contractContext } : {}),
  }
}

// ── IngestRequest validator ───────────────────────────────────────────────────

/**
 * Validate and coerce an unknown request body into an IngestRequest.
 * Throws a descriptive Error if any required field is missing or invalid.
 */
export function validateIngestRequest(body: unknown): IngestRequest {
  if (!isObject(body)) {
    throw new Error('Request body must be a JSON object.')
  }

  const pool = requireOneOf(body, 'pool', SOURCE_POOLS)
  const fileName = requireString(body, 'fileName')
  const fileType = requireOneOf(body, 'fileType', DOCUMENT_TYPES)
  const content = requireString(body, 'content')

  // linkUrl is optional but must be a string if provided
  let linkUrl: string | undefined
  if (body['linkUrl'] !== undefined && body['linkUrl'] !== null) {
    if (typeof body['linkUrl'] !== 'string') {
      throw new Error('"linkUrl" must be a string if provided.')
    }
    linkUrl = body['linkUrl'].trim() || undefined
  }

  // If fileType is 'link', linkUrl should be present
  if (fileType === 'link' && !linkUrl) {
    throw new Error('"linkUrl" is required when "fileType" is "link".')
  }

  return {
    pool,
    fileName,
    fileType,
    content,
    ...(linkUrl ? { linkUrl } : {}),
  }
}
