'use client'

import React, { useState } from 'react'
import { Link, Plus, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { FileUploadZone } from '@/components/file-upload-zone'
import { SourceList } from '@/components/source-list'
import type { LoadedSource } from '@/types'

interface SourceManagerProps {
  sources: LoadedSource[]
  onSourcesChange: () => void
}

const GUIDANCE_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
}

export function SourceManager({ sources, onSourcesChange }: SourceManagerProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const guidanceSources = sources.filter((s) => s.pool === 'guidance')

  const handleFilesUploaded = () => {
    onSourcesChange()
  }

  const handleAddLink = async () => {
    const url = linkUrl.trim()
    if (!url) return

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setLinkError('Please enter a valid URL')
      return
    }

    setLinkError(null)
    setIsAddingLink(true)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pool: 'guidance',
          fileName: url,
          fileType: 'link',
          content: '',
          linkUrl: url,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? `HTTP ${res.status}`)
      }

      setLinkUrl('')
      onSourcesChange()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to add link')
    } finally {
      setIsAddingLink(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLink()
    }
  }

  const handleDelete = async (sourceId: string) => {
    try {
      await fetch(`/api/sources?id=${encodeURIComponent(sourceId)}`, {
        method: 'DELETE',
      })
      onSourcesChange()
    } catch {
      // Silently fail — the list will refresh on next load
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/20 border border-blue-600/30">
          <BookOpen className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Guidance Sources</h2>
          <p className="text-xs text-slate-500">ASC 606, ASC 842, and related standards</p>
        </div>
      </div>

      <Separator className="bg-slate-200" />

      {/* File upload */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Upload Documents
        </p>
        <FileUploadZone
          pool="guidance"
          accept={GUIDANCE_ACCEPT}
          multiple
          label="Upload Guidance Documents"
          description="PDF, DOCX, or TXT · ASC standards, memos, whitepapers"
          onFilesUploaded={handleFilesUploaded}
        />
      </div>

      {/* Add link */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Add Link
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <Input
              type="url"
              placeholder="https://asc.fasb.org/..."
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value)
                if (linkError) setLinkError(null)
              }}
              onKeyDown={handleKeyDown}
              className="pl-8 text-xs"
              disabled={isAddingLink}
            />
          </div>
          <Button
            size="sm"
            onClick={handleAddLink}
            disabled={isAddingLink || !linkUrl.trim()}
            className="shrink-0"
          >
            {isAddingLink ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </Button>
        </div>
        {linkError && (
          <p className="text-xs text-red-500">{linkError}</p>
        )}
      </div>

      <Separator className="bg-slate-200" />

      {/* Source list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Loaded Sources
          </p>
          <span className="text-xs text-slate-500">
            {guidanceSources.length} document{guidanceSources.length !== 1 ? 's' : ''}
          </span>
        </div>
        <SourceList sources={guidanceSources} onDelete={handleDelete} />
      </div>
    </div>
  )
}
