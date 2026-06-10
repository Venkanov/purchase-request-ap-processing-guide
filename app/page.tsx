'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QueryPanel } from '@/components/query-panel'
import { ResponsePanel } from '@/components/response-panel'
import { SourceManager } from '@/components/source-manager'
import type { QueryResponse, LoadedSource } from '@/types'

const POLL_INTERVAL_MS = 5000

function hasTransientSource(sources: LoadedSource[]): boolean {
  return sources.some((s) => s.status === 'parsing' || s.status === 'uploading')
}

export default function Home() {
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<LoadedSource[]>([])

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch sources from API ────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources')
      if (!res.ok) return
      const data = await res.json()
      // SourceListResponse: { guidance: [], review: [], contract: [] }
      const all: LoadedSource[] = [
        ...(data.guidance ?? []),
        ...(data.review ?? []),
        ...(data.contract ?? []),
      ]
      setSources(all)
    } catch {
      // Silently ignore network errors during polling
    }
  }, [])

  // ── Polling logic ─────────────────────────────────────────────────────────
  const schedulePoll = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    pollTimerRef.current = setTimeout(async () => {
      await fetchSources()
    }, POLL_INTERVAL_MS)
  }, [fetchSources])

  // Poll continuously — faster when sources are mid-upload, slower otherwise
  useEffect(() => {
    const interval = hasTransientSource(sources) ? POLL_INTERVAL_MS : 10000
    pollTimerRef.current = setTimeout(async () => {
      await fetchSources()
    }, interval)
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [sources, fetchSources])

  // Initial fetch on mount
  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  // ── Derived state ─────────────────────────────────────────────────────────
  const guidanceSources = sources.filter((s) => s.pool === 'guidance')
  const reviewSources   = sources.filter((s) => s.pool === 'review')
  const contractSources = sources.filter((s) => s.pool === 'contract')

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleResponse = useCallback((res: QueryResponse) => {
    setResponse(res)
  }, [])

  const handleLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const handleSourcesChange = useCallback(() => {
    fetchSources()
  }, [fetchSources])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col" style={{ height: '100dvh' }}>

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b bg-white"
        style={{ borderColor: 'rgb(226 232 240)' }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))',
              color: 'white',
            }}
          >
            A
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-900">
            Purchase Request & AP Processing Guide
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" />
            <path d="M12 6a1 1 0 0 0-1 1v5.586L8.707 10.29a1 1 0 0 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L13 12.586V7a1 1 0 0 0-1-1z" />
          </svg>
          <span className="hidden sm:inline">Powered by Claude</span>
        </div>
      </header>

      {/* ── Main two-column layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className="shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r bg-white"
          style={{ borderColor: 'rgb(226 232 240)' }}
        >
          {/* Sidebar inner — constrain width on desktop */}
          <div
            className="flex flex-col h-full overflow-hidden"
            style={{ width: '360px', maxWidth: '100vw' }}
          >
            {/* Sidebar header */}
            <div
              className="shrink-0 px-4 py-3 border-b"
              style={{ borderColor: 'rgb(226 232 240)' }}
            >
              <h1 className="text-sm font-semibold leading-tight text-slate-900">
                Purchase Request & AP Processing Guide
              </h1>
              <p className="text-xs mt-0.5 text-slate-500">
                FluidStack internal guide for Zip & NetSuite
              </p>
            </div>

            {/* Source Manager — takes remaining sidebar height */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <SourceManager
                sources={sources}
                onSourcesChange={handleSourcesChange}
              />
            </div>
          </div>
        </aside>

        {/* ── Right Main Area ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50">
          {/* Query Panel — fixed height section */}
          <section
            className="shrink-0 border-b overflow-y-auto bg-white"
            style={{
              borderColor: 'rgb(226 232 240)',
              maxHeight: '52vh',
            }}
          >
            <div className="p-4 lg:p-6">
              <QueryPanel
                onResponse={handleResponse}
                onLoading={handleLoading}
                guidanceSources={guidanceSources}
                reviewSources={reviewSources}
                contractSources={contractSources}
              />
            </div>
          </section>

          {/* Response Panel — takes remaining height, scrolls independently */}
          <section className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 lg:p-6 h-full">
              <ResponsePanel response={response} isLoading={isLoading} />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
