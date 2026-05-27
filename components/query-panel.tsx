'use client'

import React, { useState } from 'react'
import {
  HelpCircle,
  BarChart2,
  FileSearch,
  FilePenLine,
  Send,
  Loader2,
  Tag,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { OutputFormatSelector } from '@/components/output-format-selector'
import { FileUploadZone } from '@/components/file-upload-zone'
import { SourceList } from '@/components/source-list'
import { cn } from '@/lib/utils'
import type { QueryMode, OutputFormat, ClaudeModel, LoadedSource, QueryResponse } from '@/types'

interface QueryPanelProps {
  onResponse: (response: QueryResponse) => void
  onLoading: (loading: boolean) => void
  guidanceSources: LoadedSource[]
  reviewSources?: LoadedSource[]
  contractSources?: LoadedSource[]
}

function mergeUnique(server: LoadedSource[], local: LoadedSource[]): LoadedSource[] {
  const serverIds = new Set(server.map((s) => s.id))
  return [...server, ...local.filter((s) => !serverIds.has(s.id))]
}

const REVIEW_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
}

const CONTRACT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const AUTO_ANALYSIS_CHIPS = [
  'Contract Summary',
  'Key Commercial Terms',
  'Risk Flags',
  'Missing Standard Clauses',
  'Revenue Recognition',
  'Obligations Matrix',
  'Recommended Actions',
]

interface ToastState {
  open: boolean
  title: string
  description: string
  variant: 'default' | 'destructive'
}

export function QueryPanel({
  onResponse,
  onLoading,
  guidanceSources,
  reviewSources: serverReviewSources = [],
  contractSources: serverContractSources = [],
}: QueryPanelProps) {
  const [activeTab, setActiveTab] = useState<QueryMode>('specific')
  const [format, setFormat] = useState<OutputFormat>('detailed')
  const [model, setModel] = useState<ClaudeModel>('claude-opus-4-7')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Per-tab query text
  const [specificQuery, setSpecificQuery] = useState('')
  const [scenarioQuery, setScenarioQuery] = useState('')
  const [reviewQuery, setReviewQuery] = useState('')
  const [contractContext, setContractContext] = useState('')

  // Uploaded files per tab (tracks files uploaded in this session)
  const [reviewSources, setReviewSources] = useState<LoadedSource[]>([])
  const [contractSources, setContractSources] = useState<LoadedSource[]>([])

  // Merged views: server-polled sources + locally-uploaded ones (deduped by id)
  const allReviewSources   = mergeUnique(serverReviewSources, reviewSources)
  const allContractSources = mergeUnique(serverContractSources, contractSources)

  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
  })

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setToast({ open: true, title, description, variant })
  }

  const handleReviewFilesUploaded = (sources: LoadedSource[]) => {
    setReviewSources((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const newSources = sources.filter((s) => !existingIds.has(s.id))
      return [...prev, ...newSources]
    })
  }

  const handleContractFilesUploaded = (sources: LoadedSource[]) => {
    setContractSources((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const newSources = sources.filter((s) => !existingIds.has(s.id))
      return [...prev, ...newSources]
    })
  }

  const handleDeleteReviewSource = (id: string) => {
    setReviewSources((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDeleteContractSource = (id: string) => {
    setContractSources((prev) => prev.filter((s) => s.id !== id))
  }

  const validate = (): string | null => {
    if (activeTab === 'specific') {
      if (!specificQuery.trim()) return 'Please enter a question before submitting.'
    } else if (activeTab === 'scenario') {
      if (!scenarioQuery.trim()) return 'Please describe your fact pattern before submitting.'
    } else if (activeTab === 'review') {
      if (allReviewSources.filter((s) => s.status === 'indexed').length === 0 && !reviewQuery.trim()) {
        return 'Please upload at least one indexed document or enter review instructions.'
      }
    } else if (activeTab === 'contract') {
      const hasContractText = allContractSources.some(
        (s) => s.status === 'indexed' && s.parsedText && s.parsedText.trim()
      )
      if (!hasContractText) {
        return 'Please upload at least one contract document before submitting.'
      }
    }
    return null
  }

  const buildQuery = (): string => {
    if (activeTab === 'specific') return specificQuery.trim()
    if (activeTab === 'scenario') return scenarioQuery.trim()
    if (activeTab === 'review') return reviewQuery.trim() || 'Please review this document for ASC 606 and ASC 842 compliance.'
    if (activeTab === 'contract') return contractContext.trim() || 'Please analyze this contract for revenue recognition and lease accounting implications.'
    return ''
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      showToast('Validation Error', validationError, 'destructive')
      return
    }

    setIsSubmitting(true)
    onLoading(true)

    try {
      const payload = {
        mode: activeTab,
        format,
        model,
        query: buildQuery(),
        reviewFileIds: activeTab === 'review'
          ? allReviewSources.filter((s) => s.status === 'indexed').map((s) => s.id)
          : undefined,
        contractText: activeTab === 'contract'
          ? allContractSources
              .filter((s) => s.status === 'indexed' && s.parsedText)
              .map((s) => s.parsedText!)
              .join('\n\n---\n\n')
          : undefined,
        contractContext: activeTab === 'contract' ? contractContext.trim() : undefined,
      }

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? `HTTP ${res.status}: ${res.statusText}`)
      }

      const data: QueryResponse = await res.json()
      onResponse(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      showToast('Query Failed', message, 'destructive')
      // Surface the error in the response panel too
      onResponse({
        id: `error-${Date.now()}`,
        mode: activeTab,
        format,
        markdown: '',
        citations: [],
        timestamp: new Date().toISOString(),
        error: message,
      })
    } finally {
      setIsSubmitting(false)
      onLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSubmit = !isSubmitting && guidanceSources.filter((s) => s.status === 'indexed').length > 0

  return (
    <ToastProvider>
      <div className="flex h-full flex-col gap-4">
        {/* Mode tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as QueryMode)}
          className="flex flex-1 flex-col gap-4 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-4 h-auto bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="specific" className="flex items-center gap-1.5 py-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Specific</span>
              <span className="sm:hidden">Q&amp;A</span>
            </TabsTrigger>
            <TabsTrigger value="scenario" className="flex items-center gap-1.5 py-2 text-xs">
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scenario</span>
              <span className="sm:hidden">Facts</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1.5 py-2 text-xs">
              <FileSearch className="h-3.5 w-3.5" />
              <span>Review</span>
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-1.5 py-2 text-xs">
              <FilePenLine className="h-3.5 w-3.5" />
              <span>Contract</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Specific Question ── */}
          <TabsContent value="specific" className="flex flex-col gap-3 mt-0 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Accounting Question
              </label>
              <Textarea
                placeholder="Ask a specific accounting question…&#10;e.g. How should a SaaS company account for implementation fees under ASC 606?"
                value={specificQuery}
                onChange={(e) => setSpecificQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[140px] resize-none text-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500">Tip: ⌘ + Enter to submit</p>
            </div>
          </TabsContent>

          {/* ── Scenario Analysis ── */}
          <TabsContent value="scenario" className="flex flex-col gap-3 mt-0 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Fact Pattern
              </label>
              <Textarea
                placeholder="Describe your fact pattern…&#10;e.g. Company A enters into a 5-year SaaS agreement with Customer B. The contract includes a perpetual license, annual maintenance, and a one-time implementation service. Total contract value is $500K…"
                value={scenarioQuery}
                onChange={(e) => setScenarioQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[160px] resize-none text-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500">
                Include entity, transaction type, contract structure, and any relevant facts.
              </p>
            </div>
          </TabsContent>

          {/* ── File Review ── */}
          <TabsContent value="review" className="flex flex-col gap-3 mt-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Documents to Review
              </label>
              <FileUploadZone
                pool="review"
                accept={REVIEW_ACCEPT}
                multiple
                label="Upload Documents for Review"
                description="Memos, whitepapers, draft positions, or working papers"
                onFilesUploaded={handleReviewFilesUploaded}
              />
            </div>
            {allReviewSources.length > 0 && (
              <SourceList sources={allReviewSources} onDelete={handleDeleteReviewSource} />
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Review Instructions (optional)
              </label>
              <Textarea
                placeholder="Add specific review instructions…&#10;e.g. Focus on Step 5 of ASC 606 and evaluate completeness of SSP analysis."
                value={reviewQuery}
                onChange={(e) => setReviewQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none text-sm"
                disabled={isSubmitting}
              />
            </div>
          </TabsContent>

          {/* ── Contract Review ── */}
          <TabsContent value="contract" className="flex flex-col gap-3 mt-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Contract Documents
              </label>
              <FileUploadZone
                pool="contract"
                accept={CONTRACT_ACCEPT}
                multiple
                label="Upload Contract PDFs"
                description="Customer agreements, vendor contracts, lease agreements"
                onFilesUploaded={handleContractFilesUploaded}
              />
            </div>
            {allContractSources.length > 0 && (
              <SourceList sources={allContractSources} onDelete={handleDeleteContractSource} />
            )}

            {/* Auto-analysis chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Auto-Analysis Sections
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AUTO_ANALYSIS_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Additional Context (optional)
              </label>
              <Textarea
                placeholder="Add review instructions (optional)…&#10;e.g. Pay special attention to variable consideration and constraint provisions."
                value={contractContext}
                onChange={(e) => setContractContext(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none text-sm"
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Contract files are analyzed separately and isolated from research queries.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom section — always visible */}
        <div className="shrink-0 space-y-3">
          <Separator className="bg-slate-200" />

          <OutputFormatSelector
            selected={format}
            onChange={setFormat}
            disabled={isSubmitting}
          />

          {/* Model selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Model</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'claude-opus-4-7',   label: 'Opus 4.7',   sub: 'Latest' },
                  { value: 'claude-opus-4-6',   label: 'Opus 4.6',   sub: 'Most thorough' },
                  { value: 'claude-sonnet-4-6',  label: 'Sonnet 4.6', sub: 'Faster' },
                ] as { value: ClaudeModel; label: string; sub: string }[]
              ).map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModel(value)}
                  className={cn(
                    'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors',
                    model === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    isSubmitting && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  <span className={cn('text-xs', model === value ? 'text-blue-500' : 'text-slate-400')}>
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Guidance sources warning */}
          {guidanceSources.filter((s) => s.status === 'indexed').length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">
                No indexed guidance sources. Upload ASC 606 / ASC 842 documents in the left panel first.
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Query
              </>
            )}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Powered by Claude · Results are for research purposes only
          </p>
        </div>
      </div>

      {/* Toast notifications */}
      <Toast
        open={toast.open}
        onOpenChange={(open) => setToast((prev) => ({ ...prev, open }))}
        variant={toast.variant}
        duration={5000}
      >
        <div className="grid gap-1">
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}
