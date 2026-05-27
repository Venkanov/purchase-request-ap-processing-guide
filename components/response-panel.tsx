'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen,
  AlertTriangle,
  Loader2,
  FileSearch,
  MessageSquareDashed,
  ExternalLink,
  ClipboardList,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReviewCommentsTable } from '@/components/review-comments-table'
import { RiskFlagsTable } from '@/components/risk-flags-table'
import { cn } from '@/lib/utils'
import type { QueryResponse, QueryMode, OutputFormat, ObligationRow } from '@/types'

interface ResponsePanelProps {
  response: QueryResponse | null
  isLoading: boolean
}

const MODE_LABELS: Record<QueryMode, string> = {
  specific: 'Specific Question',
  scenario: 'Scenario Analysis',
  review: 'File Review',
  contract: 'Contract Review',
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  detailed: 'Detailed Analysis',
  tldr: 'TL;DR',
  onepager: 'One Pager',
  memo: 'Formal Memo',
}

function ObligationsMatrix({ rows }: { rows: ObligationRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {['Party', 'Obligation', 'Owed To', 'Trigger / Date', 'Dependencies'].map((col) => (
              <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={row.id} className={cn('align-top hover:bg-slate-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
              <td className="px-4 py-3 text-xs font-medium text-slate-900 whitespace-nowrap">{row.party}</td>
              <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px]">{row.obligation}</td>
              <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{row.owedTo}</td>
              <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{row.triggerOrDate}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{row.dependencies ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="text-sm text-slate-500">Analyzing with Claude…</span>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="h-px w-full rounded bg-slate-100" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white">
        <MessageSquareDashed className="h-7 w-7 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">No results yet</p>
        <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
          Submit a query in the left panel to see a structured accounting analysis here.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {['ASC 606', 'ASC 842', 'Revenue Recognition', 'Lease Accounting'].map((tag) => (
          <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-500">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ResponsePanel({ response, isLoading }: ResponsePanelProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
        <EmptyState />
      </div>
    )
  }

  if (response.error) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-red-200 bg-white">
        <div className="flex items-start gap-3 rounded-xl p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600">Analysis Error</p>
            <p className="mt-1 text-sm text-slate-500">{response.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <FileSearch className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-900">
            {MODE_LABELS[response.mode]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {FORMAT_LABELS[response.format]}
          </Badge>
          <span className="text-xs text-slate-500">
            {new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">

          {/* Main markdown response */}
          <div className="prose-response">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-3 mt-6 text-lg font-bold text-slate-900 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 mt-5 text-base font-semibold text-slate-800 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700 first:mt-0">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="mb-1.5 mt-3 text-sm font-medium text-slate-700">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-slate-700 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 space-y-1 pl-5 last:mb-0">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 space-y-1 pl-5 last:mb-0 list-decimal">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-slate-700 leading-relaxed list-disc marker:text-slate-400">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-900">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-500">{children}</em>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  if (isBlock) {
                    return (
                      <code className="block w-full overflow-x-auto rounded-md bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 leading-relaxed">
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-mono text-slate-700">
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="mb-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 last:mb-0">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-3 border-l-2 border-blue-400 pl-4 text-sm italic text-slate-500 last:mb-0">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200 last:mb-0">
                    <table className="w-full text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="border-b border-slate-200 bg-slate-50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-slate-100">{children}</tbody>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2.5 text-xs text-slate-700">{children}</td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-blue-600 underline underline-offset-2 hover:text-blue-500"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ),
                hr: () => <Separator className="my-4 bg-slate-200" />,
              }}
            >
              {response.markdown}
            </ReactMarkdown>
          </div>

          {/* Missing Data Items callout */}
          {response.missingDataItems && response.missingDataItems.length > 0 && (
            <>
              <Separator className="bg-slate-200" />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">Additional Data Needed</span>
                </div>
                <p className="mb-2 text-xs text-amber-600">
                  The following information would strengthen this analysis:
                </p>
                <ul className="space-y-1">
                  {response.missingDataItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <span className="mt-0.5 shrink-0 text-amber-500">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Citations */}
          {response.citations && response.citations.length > 0 && (
            <>
              <Separator className="bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Sources &amp; Citations
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                    {response.citations.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {response.citations.map((citation, i) => (
                    <div
                      key={`${citation.sourceId}-${i}`}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-600/30 text-xs font-semibold text-blue-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-slate-700">{citation.fileName}</span>
                          {citation.pageNumber != null && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                              p.{citation.pageNumber}
                            </span>
                          )}
                          {citation.sectionHeading && (
                            <span className="text-xs text-slate-500 italic">§ {citation.sectionHeading}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed border-l-2 border-slate-300 pl-2 italic">
                          &ldquo;{citation.excerpt}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Review Comments Table */}
          {response.reviewComments && response.reviewComments.length > 0 && (
            <>
              <Separator className="bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Review Comments</span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                    {response.reviewComments.length}
                  </span>
                </div>
                <ReviewCommentsTable comments={response.reviewComments} />
              </div>
            </>
          )}

          {/* Risk Flags Table */}
          {response.riskFlags && response.riskFlags.length > 0 && (
            <>
              <Separator className="bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Risk Flags</span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                    {response.riskFlags.length}
                  </span>
                </div>
                <RiskFlagsTable flags={response.riskFlags} />
              </div>
            </>
          )}

          {/* Obligations Matrix */}
          {response.obligationsMatrix && response.obligationsMatrix.length > 0 && (
            <>
              <Separator className="bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Obligations Matrix</span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                    {response.obligationsMatrix.length} rows
                  </span>
                </div>
                <ObligationsMatrix rows={response.obligationsMatrix} />
              </div>
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}
