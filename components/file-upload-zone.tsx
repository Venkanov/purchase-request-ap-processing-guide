'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, X, CheckCircle, AlertCircle, Loader2, CloudUpload, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LoadedSource, SourcePool, DocumentType } from '@/types'

interface FileUploadZoneProps {
  pool: SourcePool
  accept?: Record<string, string[]>
  multiple?: boolean
  onFilesUploaded?: (sources: LoadedSource[]) => void
  label?: string
  description?: string
}

interface PendingFile {
  file: File
  id: string
  status: 'uploading' | 'parsing' | 'indexed' | 'failed'
  errorMessage?: string
}

function getEndpoint(pool: SourcePool): string {
  if (pool === 'contract') return '/api/contract-review'
  return '/api/ingest'
}

function inferDocumentType(file: File): DocumentType {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'xlsx') return 'xlsx'
  if (ext === 'pptx') return 'pptx'
  return 'txt'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function FileUploadZone({
  pool,
  accept,
  multiple = true,
  onFilesUploaded,
  label = 'Upload Files',
  description = 'Drag and drop or click to browse',
}: FileUploadZoneProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  // Upload files immediately — called directly from onDrop with the raw File objects
  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    const newEntries: PendingFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'uploading',
    }))

    // Add to list immediately so progress is visible
    setPendingFiles((prev) => (multiple ? [...prev, ...newEntries] : newEntries))

    const endpoint = getEndpoint(pool)
    const uploadedSources: LoadedSource[] = []

    for (const pf of newEntries) {
      try {
        const content = await fileToBase64(pf.file)
        const fileType = inferDocumentType(pf.file)

        // Switch to "parsing" while server processes
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: 'parsing' } : f))
        )

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pool, fileName: pf.file.name, fileType, content }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error ?? `HTTP ${res.status}`)
        }

        const data = await res.json()

        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: 'indexed' } : f))
        )

        uploadedSources.push({
          // Contract parse endpoint returns { id, fileName, text, pageCount }
          // Ingest endpoint returns { sourceId, chunkCount, status }
          id: data.id ?? data.sourceId ?? pf.id,
          name: pf.file.name,
          type: fileType,
          pool,
          uploadedAt: new Date().toISOString(),
          chunkCount: data.chunkCount ?? 0,
          status: 'indexed',
          // Carry parsed text in memory for contract files (never stored server-side)
          ...(data.text != null ? { parsedText: data.text as string } : {}),
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pf.id ? { ...f, status: 'failed', errorMessage } : f))
        )
      }
    }

    if (uploadedSources.length > 0) {
      onFilesUploaded?.(uploadedSources)
    }
  }, [pool, multiple, onFilesUploaded])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFiles(acceptedFiles)
    }
  }, [uploadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  })

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const isUploading = pendingFiles.some(
    (f) => f.status === 'uploading' || f.status === 'parsing'
  )
  const allDone =
    pendingFiles.length > 0 &&
    pendingFiles.every((f) => f.status === 'indexed' || f.status === 'failed')

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-400 bg-blue-50 scale-[1.01]'
            : isUploading
              ? 'border-blue-200 bg-blue-50/40'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'flex flex-col items-center gap-2 transition-colors',
          isDragActive ? 'text-blue-600' : 'text-slate-500'
        )}>
          {isDragActive ? (
            <CloudUpload className="h-8 w-8 text-blue-500" />
          ) : isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <div>
            <p className={cn(
              'text-sm font-medium',
              isDragActive ? 'text-blue-600' : 'text-slate-700'
            )}>
              {isDragActive ? 'Drop files here' : isUploading ? 'Uploading…' : label}
            </p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {/* File list */}
      {pendingFiles.length > 0 && (
        <div className="space-y-1.5">
          {pendingFiles.map((pf) => (
            <div
              key={pf.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="flex-1 truncate text-xs text-slate-700">{pf.file.name}</span>
              <span className="shrink-0">
                {pf.status === 'uploading' && (
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading
                  </span>
                )}
                {pf.status === 'parsing' && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Parsing
                  </span>
                )}
                {pf.status === 'indexed' && (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                )}
                {pf.status === 'failed' && (
                  <span
                    className="flex items-center gap-1 text-xs text-red-600"
                    title={pf.errorMessage}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Failed
                  </span>
                )}
              </span>
              {pf.status === 'failed' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(pf.id) }}
                  className="shrink-0 rounded p-0.5 text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Clear button — only after all done */}
      {allDone && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-500 hover:text-slate-700"
          onClick={() => setPendingFiles([])}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
