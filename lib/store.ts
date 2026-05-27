// ─── Global In-Memory Store with Disk Persistence ─────────────────────────────
// Singleton pattern using a global variable to survive Next.js hot reloads.
// All document chunks and source metadata are held in Maps keyed by ID.
// Data is persisted to disk so it survives server restarts.

import fs from 'fs'
import path from 'path'
import type { DocumentChunk, LoadedSource, SourcePool } from '@/types'

// ── Persistence ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data')
const PERSIST_PATH = path.join(DATA_DIR, 'doc-store.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null

function saveToDisk(s: Store) {
  // Debounce: coalesce rapid saves (e.g. during bulk ingest) into one write
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    try {
      ensureDataDir()
      const data = {
        chunks: Array.from(s.chunks.entries()),
        sources: Array.from(s.sources.entries()),
      }
      fs.writeFileSync(PERSIST_PATH, JSON.stringify(data), 'utf-8')
    } catch (err) {
      console.error('[store] Failed to persist to disk:', err)
    }
  }, 2000) // write at most once every 2 seconds
}

function loadFromDisk(): Store {
  try {
    if (fs.existsSync(PERSIST_PATH)) {
      const raw = fs.readFileSync(PERSIST_PATH, 'utf-8')
      const data = JSON.parse(raw)
      const loaded: Store = {
        chunks: new Map(data.chunks as [string, DocumentChunk][]),
        sources: new Map(data.sources as [string, LoadedSource][]),
      }
      console.log(
        `[store] Loaded from disk: ${loaded.sources.size} sources, ${loaded.chunks.size} chunks`
      )
      return loaded
    }
  } catch (err) {
    console.error('[store] Failed to load from disk, starting fresh:', err)
  }
  return {
    chunks: new Map<string, DocumentChunk>(),
    sources: new Map<string, LoadedSource>(),
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

interface Store {
  chunks: Map<string, DocumentChunk>   // chunkId  -> chunk
  sources: Map<string, LoadedSource>   // sourceId -> source metadata
}

declare global {
  // eslint-disable-next-line no-var
  var __docStore: Store | undefined
}

function getStore(): Store {
  if (!global.__docStore) {
    global.__docStore = loadFromDisk()
  }
  return global.__docStore
}

// ── Public API ────────────────────────────────────────────────────────────────

export const store = {
  // ── Chunks ──────────────────────────────────────────────────────────────────

  addChunks(chunks: DocumentChunk[]): void {
    const s = getStore()
    for (const chunk of chunks) {
      s.chunks.set(chunk.id, chunk)
    }
    saveToDisk(s)
  },

  getChunksByPool(pool: SourcePool): DocumentChunk[] {
    const s = getStore()
    const result: DocumentChunk[] = []
    for (const chunk of s.chunks.values()) {
      if (chunk.metadata.pool === pool) {
        result.push(chunk)
      }
    }
    return result
  },

  getChunksBySource(sourceId: string): DocumentChunk[] {
    const s = getStore()
    const result: DocumentChunk[] = []
    for (const chunk of s.chunks.values()) {
      if (chunk.metadata.sourceId === sourceId) {
        result.push(chunk)
      }
    }
    return result
  },

  removeChunksBySource(sourceId: string): void {
    const s = getStore()
    for (const [id, chunk] of s.chunks.entries()) {
      if (chunk.metadata.sourceId === sourceId) {
        s.chunks.delete(id)
      }
    }
  },

  // ── Sources ─────────────────────────────────────────────────────────────────

  addSource(source: LoadedSource): void {
    const s = getStore()
    s.sources.set(source.id, source)
    saveToDisk(s)
  },

  updateSource(sourceId: string, updates: Partial<LoadedSource>): void {
    const s = getStore()
    const existing = s.sources.get(sourceId)
    if (!existing) {
      throw new Error(`Source not found: ${sourceId}`)
    }
    s.sources.set(sourceId, { ...existing, ...updates })
    saveToDisk(s)
  },

  getSourcesByPool(pool: SourcePool): LoadedSource[] {
    const s = getStore()
    const result: LoadedSource[] = []
    for (const source of s.sources.values()) {
      if (source.pool === pool) {
        result.push(source)
      }
    }
    return result.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  },

  getAllSources(): LoadedSource[] {
    const s = getStore()
    return Array.from(s.sources.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  },

  removeSource(sourceId: string): void {
    const s = getStore()
    s.sources.delete(sourceId)
    store.removeChunksBySource(sourceId)
    saveToDisk(s)
  },

  // ── Diagnostics ─────────────────────────────────────────────────────────────

  stats(): { chunkCount: number; sourceCount: number } {
    const s = getStore()
    return {
      chunkCount: s.chunks.size,
      sourceCount: s.sources.size,
    }
  },
}
