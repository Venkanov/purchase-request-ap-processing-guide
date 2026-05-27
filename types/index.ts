// ─── Query Modes ─────────────────────────────────────────────────────────────
export type QueryMode = 'specific' | 'scenario' | 'review' | 'contract'

// ─── Output Formats ───────────────────────────────────────────────────────────
export type OutputFormat = 'detailed' | 'tldr' | 'onepager' | 'memo'

// ─── Source Pools ─────────────────────────────────────────────────────────────
export type SourcePool = 'guidance' | 'review' | 'contract'

// ─── Document Types ───────────────────────────────────────────────────────────
export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'link'

// ─── Chunk / Source Metadata ─────────────────────────────────────────────────
export interface ChunkMetadata {
  sourceId: string
  fileName: string
  pageNumber?: number
  sectionHeading?: string
  documentType: DocumentType
  pool: SourcePool
  chunkIndex: number
  uploadedAt: string
}

export interface DocumentChunk {
  id: string
  text: string
  metadata: ChunkMetadata
}

// ─── Loaded Source Record ─────────────────────────────────────────────────────
export interface LoadedSource {
  id: string
  name: string
  type: DocumentType
  pool: SourcePool
  uploadedAt: string
  chunkCount: number
  status: 'uploading' | 'parsing' | 'indexed' | 'failed'
  errorMessage?: string
  /** For contract pool only — full parsed text held in browser memory, never stored server-side */
  parsedText?: string
}

// ─── Citation ────────────────────────────────────────────────────────────────
export interface Citation {
  sourceId: string
  fileName: string
  pageNumber?: number
  sectionHeading?: string
  excerpt: string
}

// ─── Review Comment Types ────────────────────────────────────────────────────
export type CommentType =
  | 'Missing Citation'
  | 'Unsupported Conclusion'
  | 'Missing Fact'
  | 'Incomplete Guidance'
  | 'Inconsistent with Source'
  | 'Ambiguous Wording'
  | 'Alternative View Not Considered'
  | 'Drafting Improvement'

export interface ReviewComment {
  id: string
  sectionPage: string
  commentType: CommentType
  issue: string
  recommendedRevision: string
  supportingGuidanceReference: string
}

// ─── Risk Flag Types ──────────────────────────────────────────────────────────
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface RiskFlag {
  id: string
  riskLevel: RiskLevel
  issue: string
  recommendedAction: string
}

// ─── Obligations Matrix Row ──────────────────────────────────────────────────
export interface ObligationRow {
  id: string
  party: string
  obligation: string
  owedTo: string
  triggerOrDate: string
  dependencies?: string
}

// ─── Claude Model ─────────────────────────────────────────────────────────────
export type ClaudeModel =
  | 'claude-opus-4-7'    // Latest — most capable
  | 'claude-opus-4-6'    // Most thorough — slower
  | 'claude-sonnet-4-6'  // Faster — still highly capable

// ─── Query Request ────────────────────────────────────────────────────────────
export interface QueryRequest {
  mode: QueryMode
  format: OutputFormat
  query: string
  model?: ClaudeModel          // Optional — defaults to claude-opus-4-6
  reviewFileIds?: string[]     // IDs of uploaded review docs (review mode)
  contractText?: string        // Full contract text (contract mode — never stored server-side)
  contractContext?: string     // Optional user context for contract review
}

// ─── Contract Parse Response ──────────────────────────────────────────────────
export interface ContractParseResponse {
  id: string
  fileName: string
  text: string
  pageCount?: number
}

// ─── Query Response ───────────────────────────────────────────────────────────
export interface QueryResponse {
  id: string
  mode: QueryMode
  format: OutputFormat
  markdown: string
  citations: Citation[]
  reviewComments?: ReviewComment[]
  riskFlags?: RiskFlag[]
  obligationsMatrix?: ObligationRow[]
  missingDataItems?: string[]
  timestamp: string
  error?: string
}

// ─── Ingest Request ───────────────────────────────────────────────────────────
export interface IngestRequest {
  pool: SourcePool
  fileName: string
  fileType: DocumentType
  content: string          // base64 encoded file content OR plain text for links
  linkUrl?: string
}

export interface IngestResponse {
  sourceId: string
  chunkCount: number
  status: 'indexed' | 'failed'
  errorMessage?: string
}

// ─── Source List Response ─────────────────────────────────────────────────────
export interface SourceListResponse {
  guidance: LoadedSource[]
  review: LoadedSource[]
  contract: LoadedSource[]
}

// ─── Contract Review Sections ─────────────────────────────────────────────────
export interface ContractSummary {
  parties: string
  contractValue?: string
  keyDates?: string
  term?: string
  renewalLanguage?: string
  governingLaw?: string
}

export interface KeyCommercialTerms {
  payment?: string
  termination?: string
  liability?: string
  confidentiality?: string
  renewal?: string
  warranties?: string
  indemnities?: string
}

// ─── Formatted Memo Fields ────────────────────────────────────────────────────
export interface MemoFields {
  to: string
  from: string
  date: string
  subject: string
}
