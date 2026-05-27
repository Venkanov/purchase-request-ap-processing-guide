'use client'

import React from 'react'
import { FileText, File, Trash2, AlertCircle, Loader2, CheckCircle2, Link } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LoadedSource, DocumentType } from '@/types'

interface SourceListProps {
  sources: LoadedSource[]
  onDelete?: (sourceId: string) => void
}

function DocIcon({ type, className }: { type: DocumentType; className?: string }) {
  if (type === 'link') return <Link className={cn('h-4 w-4', className)} />
  if (type === 'pdf' || type === 'txt') return <FileText className={cn('h-4 w-4', className)} />
  return <File className={cn('h-4 w-4', className)} />
}

function StatusBadge({ status, errorMessage }: { status: LoadedSource['status']; errorMessage?: string }) {
  if (status === 'indexed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Indexed
      </span>
    )
  }
  if (status === 'parsing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        Parsing
      </span>
    )
  }
  if (status === 'uploading') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        Uploading
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700 cursor-help"
        title={errorMessage ?? 'Processing failed'}
      >
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    )
  }
  return null
}

export function SourceList({ sources, onDelete }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
        <File className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">No sources loaded</p>
        <p className="mt-1 text-xs text-slate-500">Upload documents to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {sources.map((source) => (
        <div
          key={source.id}
          className="group flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          {/* Icon */}
          <DocIcon
            type={source.type}
            className="shrink-0 text-slate-500 group-hover:text-slate-700"
          />

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700" title={source.name}>
              {source.name}
            </p>
            <p className="text-xs text-slate-500">
              {source.status === 'indexed'
                ? `${source.chunkCount} chunk${source.chunkCount !== 1 ? 's' : ''}`
                : source.type.toUpperCase()}
            </p>
          </div>

          {/* Status badge */}
          <StatusBadge status={source.status} errorMessage={source.errorMessage} />

          {/* Delete button */}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              onClick={() => onDelete(source.id)}
              aria-label={`Remove ${source.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
