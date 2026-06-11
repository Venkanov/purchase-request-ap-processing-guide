'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ZIP_GUIDES, type Guide, type Section } from '@/lib/zip-guide-data'

// ─── Google Doc URLs ──────────────────────────────────────────────────────────
const DOC_URLS: Record<string, string> = {
  'po-request':    'https://docs.google.com/document/d/1jBhCci9ZOzc6QHIDBttw6Z6cRcmAYftzFumvMSpv6Uc/edit',
  'ap-processing': 'https://docs.google.com/document/d/1_OkJa5dSTtwtv5kGjLjlrCm_XPHy63kKS4RvSkyGXrw/edit',
}

// ─── PO Guide section-tab groupings ──────────────────────────────────────────
const PO_TABS = [
  {
    id: 'toc',
    label: 'Contents',
    sectionIds: [] as string[],
    isTOC: true,
  },
  {
    id: 'quick-reference',
    label: 'Quick Reference',
    sectionIds: [] as string[],
    isQuickRef: true,
  },
  {
    id: 'initiating',
    label: 'Initiating a Purchase Request',
    sectionIds: ['initiating'],
  },
  {
    id: 'questionnaire',
    label: 'Purchase Request Questionnaire',
    sectionIds: [
      'questionnaire', 'general-information',
      'q1-requester', 'q2-location', 'q3-subsidiary', 'q4-category',
      'q5-detailed-category', 'q6-product-name', 'q7-vendor', 'q8-department',
      'q9-line-items', 'q10-total-cost', 'q11-passthrough', 'q12-layman',
      'q13-business-value', 'q14-business-critical', 'q15-16-dates',
      'q17-payment-frequency', 'q18-payment-terms', 'q19-payment-method',
      'q20-delivery-date', 'q21-shipping', 'q22-ship-to', 'q23-special-instructions',
    ],
  },
  {
    id: 'it-security',
    label: 'IT & Security Information',
    sectionIds: ['it-security', 'nda'],
  },
  {
    id: 'documents',
    label: 'Documents',
    sectionIds: ['documents'],
  },
]

// ─── AP Guide section-tab groupings ──────────────────────────────────────────
const AP_TABS = [
  { id: 'toc',                label: 'Contents',                       sectionIds: [] as string[],              isTOC: true },
  { id: 'quick-reference',    label: 'Quick Reference',                sectionIds: [] as string[],              isQuickRef: true },
  { id: 'accessing-zip',      label: 'Accessing Zip',                  sectionIds: ['accessing-zip'] },
  { id: 'ap-overview',        label: 'AP Invoice Processing Overview', sectionIds: ['ap-overview', 'ap-overview-step1', 'ap-overview-step2', 'ap-overview-step3'] },
  { id: 'vendor-payment',     label: 'Vendor & Payment Verification',  sectionIds: ['vendor-verification', 'payment-method-verification', 'adding-new-payment-method'] },
  { id: 'po-matching',        label: 'PO Matching',                    sectionIds: ['po-matching', 'po-matching-non-po', 'po-matching-po-based'] },
  { id: 'invoice-detail',     label: 'Invoice Detail Review',          sectionIds: ['invoice-detail-review', 'invoice-detail-po', 'invoice-detail-non-po'] },
  { id: 'line-items',         label: 'Line Items & Accounting Review',  sectionIds: ['line-items', 'line-items-example1', 'line-items-example2', 'line-items-example3'] },
  { id: 'totals-create-bill', label: 'Invoice Totals & Create Bill',   sectionIds: ['invoice-totals', 'create-bill'] },
  { id: 'appendix',           label: 'Appendix',                       sectionIds: ['appendix-intro', 'appendix'] },
]

const GUIDE_TABS: Record<string, typeof PO_TABS> = {
  'po-request':    PO_TABS,
  'ap-processing': AP_TABS,
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function GuideMarkdown({ content, onNavigate }: { content: string; onNavigate?: (tabId: string) => void }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h2 className="text-base font-semibold text-slate-900 mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-5 mb-2 px-3 py-2 rounded-md"
            style={{ color: 'rgb(67 56 202)', backgroundColor: 'rgb(238 242 255)', borderLeft: '4px solid rgb(99 102 241)' }}>
            {children}
          </h3>
        ),
        p:  ({ children }) => <p className="text-sm text-slate-700 leading-relaxed mb-3">{children}</p>,
        hr: () => <hr className="my-6 border-t-2" style={{ borderColor: 'rgb(226 232 240)' }} />,
        ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => {
          // Render [A]–[AF] annotation labels in red (single or double letter codes)
          if (typeof children === 'string' && /^\[[A-Z]{1,2}\]$/.test(children)) {
            const label = children.slice(1, -1) // strip brackets
            return (
              <strong style={{ color: 'rgb(239 68 68)', fontWeight: 700 }}>{label}</strong>
            )
          }
          return <strong className="font-semibold text-slate-900">{children}</strong>
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 pl-3 py-1 my-3 text-sm text-slate-600 italic rounded-r"
            style={{ borderColor: 'rgb(99 102 241)', backgroundColor: 'rgb(238 242 255)' }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ backgroundColor: 'rgb(241 245 249)' }}>{children}</thead>,
        th: ({ children }) => (
          <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-3 py-2 border"
            style={{ borderColor: 'rgb(226 232 240)' }}>{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-slate-700 border align-top"
            style={{ borderColor: 'rgb(226 232 240)' }}>{children}</td>
        ),
        code: ({ children }) => (
          <code className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: 'rgb(241 245 249)', color: 'rgb(99 102 241)' }}>{children}</code>
        ),
        a: ({ href, children }) => {
          // Internal tab navigation links: [Label](tab:tab-id)
          if (href?.startsWith('tab:')) {
            const tabId = href.slice(4)
            if (onNavigate) {
              return (
                <button
                  onClick={() => onNavigate(tabId)}
                  className="inline-flex items-center gap-1 font-medium rounded px-1.5 py-0.5 text-sm transition-colors"
                  style={{ color: 'rgb(99 102 241)', backgroundColor: 'rgb(238 242 255)' }}
                >
                  {children}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 opacity-70">
                    <path fillRule="evenodd" d="M4.22 3.22a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 0 1-1.06-1.06L6.94 6.5 4.22 3.78a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              )
            }
            // No navigation context — render as plain styled text (no broken link)
            return <span className="font-medium" style={{ color: 'rgb(99 102 241)' }}>{children}</span>
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800">{children}</a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({ section, onNavigate }: { section: Section; onNavigate?: (tabId: string) => void }) {
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string; guidance?: React.ReactNode } | null>(null)

  const levelClass =
    section.level === 1 ? 'text-base font-bold text-slate-900' :
    section.level === 2 ? 'text-sm font-semibold text-slate-800' :
                          'text-sm font-bold text-indigo-700'

  const borderStyle = section.level === 3
    ? { borderColor: 'rgb(199 210 254)', borderLeftWidth: '4px', borderLeftColor: 'rgb(99 102 241)' }
    : { borderColor: 'rgb(226 232 240)' }

  return (
    <div id={`section-${section.id}`} className="rounded-lg border bg-white p-5 scroll-mt-4" style={borderStyle}>
      {section.title && !section.hideTitle && <h2 className={`mb-3 ${levelClass}`}>{section.title}</h2>}
      {(() => {
        const imgs = section.images ?? []
        let imgIdx = 0

        // Strip special tokens from text so it can be rendered as clean guidance in the lightbox
        const stripTokens = (text: string) =>
          text.replace(/\[IMAGE(?:-PAIR)?\]|\[DIVIDER(?::[^\]]+)?\]|\[EXAMPLE:[^\]]+\]|\[SPLIT\]|\[SPLIT-DIVIDER\]|\[\/SPLIT\]|\[SCOPE\]|\[\/SCOPE\]/g, '').trim()

        // Default guidance = the section's full text content (used for images not inside a [SPLIT] block)
        const defaultGuidance = (
          <div>
            <GuideMarkdown content={stripTokens(section.content)} onNavigate={onNavigate} />
            {section.contentAfter && (
              <GuideMarkdown content={stripTokens(section.contentAfter)} onNavigate={onNavigate} />
            )}
          </div>
        )

        const renderImg = (img: typeof imgs[0], key: number | string, guidance?: React.ReactNode) => {
          const sizeClass = img.size === 'small' ? 'max-w-[220px]' : img.size === 'medium' ? 'max-w-sm' : 'w-full'
          const src = `/zip-guide-images/${img.file}`
          return (
            <figure key={key} className={`rounded-lg overflow-hidden border group ${img.size === 'small' ? 'inline-block my-2' : 'my-4'}`} style={{ borderColor: 'rgb(226 232 240)' }}>
              <button
                type="button"
                className="block w-full text-left relative cursor-zoom-in"
                onClick={() => setLightbox({ src, caption: img.caption, guidance: guidance ?? defaultGuidance })}
                title="Click to enlarge"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={img.caption ?? ''} className={`${sizeClass} h-auto block`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/60 rounded-full px-2 py-1 text-xs font-medium">⤢ Enlarge</span>
                </div>
              </button>
              {img.caption && (
                <figcaption className="px-3 py-2 text-xs text-slate-500 border-t"
                  style={{ borderColor: 'rgb(226 232 240)', backgroundColor: 'rgb(248 250 252)' }}>
                  {img.caption}
                </figcaption>
              )}
            </figure>
          )
        }

        // Split on all special tokens, keeping delimiters
        const tokens = section.content.split(/(\[IMAGE(?:-PAIR)?\]|\[DIVIDER(?::[^\]]+)?\]|\[EXAMPLE:[^\]]+\]|\[SPLIT\]|\[SPLIT-DIVIDER\]|\[\/SPLIT\]|\[SCOPE\]|\[\/SCOPE\])/)

        // Pre-process: group structured blocks
        type RawToken = string
        type SplitBlock = { type: 'SPLIT'; left: string[]; right: string[]; key: string }
        type ScopeBlock = { type: 'SCOPE'; tokens: string[]; key: string }
        type ProcessedToken = RawToken | SplitBlock | ScopeBlock
        const processed: ProcessedToken[] = []
        let ti = 0
        while (ti < tokens.length) {
          if (tokens[ti] === '[SPLIT]') {
            const divIdx = tokens.indexOf('[SPLIT-DIVIDER]', ti)
            const endIdx = tokens.indexOf('[/SPLIT]', ti)
            if (divIdx !== -1 && endIdx !== -1 && divIdx < endIdx) {
              processed.push({ type: 'SPLIT', left: tokens.slice(ti + 1, divIdx), right: tokens.slice(divIdx + 1, endIdx), key: `split-${ti}` })
              ti = endIdx + 1
            } else { processed.push(tokens[ti]); ti++ }
          } else if (tokens[ti] === '[SCOPE]') {
            const endIdx = tokens.indexOf('[/SCOPE]', ti)
            if (endIdx !== -1) {
              processed.push({ type: 'SCOPE', tokens: tokens.slice(ti + 1, endIdx), key: `scope-${ti}` })
              ti = endIdx + 1
            } else { processed.push(tokens[ti]); ti++ }
          } else if (tokens[ti] === '[SPLIT-DIVIDER]' || tokens[ti] === '[/SPLIT]' || tokens[ti] === '[/SCOPE]') {
            ti++ // skip orphaned markers
          } else { processed.push(tokens[ti]); ti++ }
        }

        const renderToken = (token: string, i: number | string, guidance?: React.ReactNode): React.ReactNode => {
          if (token === '[IMAGE]') {
            if (imgIdx >= imgs.length) return null
            return renderImg(imgs[imgIdx++], `img-${i}`, guidance)
          }
          if (token === '[IMAGE-PAIR]') {
            const img1 = imgIdx < imgs.length ? imgs[imgIdx++] : null
            const img2 = imgIdx < imgs.length ? imgs[imgIdx++] : null
            if (!img1) return null
            return (
              <div key={`pair-${i}`} className="grid grid-cols-2 gap-3 my-4">
                {renderImg(img1, `pair-${i}-a`, guidance)}
                {img2 && renderImg(img2, `pair-${i}-b`, guidance)}
              </div>
            )
          }
          if (token.startsWith('[DIVIDER')) {
            const match = token.match(/^\[DIVIDER:(.+)\]$/)
            const label = match ? match[1] : null
            return (
              <div key={`divider-${i}`} className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t-2" style={{ borderColor: 'rgb(217 119 6)' }} />
                </div>
                {label && (
                  <div className="relative flex justify-center">
                    <span className="px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full"
                      style={{ backgroundColor: 'rgb(255 251 235)', color: 'rgb(180 83 9)', border: '2px solid rgb(217 119 6)' }}>
                      {label}
                    </span>
                  </div>
                )}
              </div>
            )
          }
          if (token.startsWith('[EXAMPLE:')) {
            const parts = token.slice(1, -1).split(':')
            const num = parts[1]
            const label = parts.slice(2).join(':')
            const schemes: Record<string, { bg: string; border: string; text: string; numBg: string; numText: string }> = {
              '1': { bg: 'rgb(239 246 255)', border: 'rgb(59 130 246)', text: 'rgb(29 78 216)', numBg: 'rgb(59 130 246)', numText: 'white' },
              '2': { bg: 'rgb(240 253 250)', border: 'rgb(20 184 166)', text: 'rgb(15 118 110)', numBg: 'rgb(20 184 166)', numText: 'white' },
              '3': { bg: 'rgb(255 247 237)', border: 'rgb(249 115 22)', text: 'rgb(194 65 12)', numBg: 'rgb(249 115 22)', numText: 'white' },
            }
            const s = schemes[num] ?? schemes['1']
            return (
              <div key={`example-${i}`} className="mt-8 mb-4 rounded-lg p-4 flex items-start gap-3"
                style={{ backgroundColor: s.bg, border: `2px solid ${s.border}` }}>
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: s.numBg, color: s.numText }}>
                  {num}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: s.text }}>Example {num}</div>
                  <div className="text-sm font-bold" style={{ color: s.text }}>{label}</div>
                </div>
              </div>
            )
          }
          return token?.trim() ? <div key={`text-${i}`} className="mt-2"><GuideMarkdown content={token} onNavigate={onNavigate} /></div> : null
        }

        return (
          <>
            {processed.map((item, i) => {
              if (typeof item !== 'string' && item.type === 'SCOPE') {
                // SCOPE: render content inline (no layout change) but scope lightbox guidance to this block only
                const textOnly = item.tokens.filter((t: string) => !t.startsWith('[IMAGE'))
                const scopeText = textOnly.join('\n')
                const scopeGuidance = (
                  <div>
                    <GuideMarkdown content={stripTokens(scopeText)} onNavigate={onNavigate} />
                  </div>
                )
                return (
                  <React.Fragment key={item.key}>
                    {item.tokens.map((t: string, j: number) => renderToken(t, `${item.key}-s${j}`, scopeGuidance))}
                  </React.Fragment>
                )
              }
              if (typeof item !== 'string' && item.type === 'SPLIT') {
                // Render right (guidance) nodes first so we can pass them as context to left images
                const rightNodes = item.right.map((t, j) => renderToken(t, `${item.key}-r${j}`))
                const guidancePanel = <div className="space-y-0">{rightNodes}</div>
                // Render left (image) nodes — each image gets the guidance for the lightbox
                const leftNodes = item.left.map((t, j) => renderToken(t, `${item.key}-l${j}`, guidancePanel))
                return (
                  <div key={item.key} className="my-4 rounded-lg overflow-hidden border -mx-4" style={{ borderColor: 'rgb(226 232 240)' }}>
                    {/* Column headers — 3/2 ratio so images get more space */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr' }}>
                      <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide border-b border-r" style={{ backgroundColor: 'rgb(241 245 249)', color: 'rgb(71 85 105)', borderColor: 'rgb(226 232 240)' }}>
                        From Invoice · Invoice Detail View
                      </div>
                      <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide border-b" style={{ backgroundColor: 'rgb(241 245 249)', color: 'rgb(71 85 105)', borderColor: 'rgb(226 232 240)' }}>
                        Guidance
                      </div>
                    </div>
                    {/* Content columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', borderColor: 'rgb(226 232 240)' }} className="divide-x">
                      <div className="p-4 space-y-4 bg-slate-50">{leftNodes}</div>
                      <div className="p-4 overflow-y-auto" style={{ maxHeight: '700px' }}>{rightNodes}</div>
                    </div>
                  </div>
                )
              }
              return renderToken(item as string, i)
            })}
            {/* any remaining images not consumed by markers */}
            {imgs.slice(imgIdx).length > 0 && (
              <div className="mt-4 space-y-4">
                {imgs.slice(imgIdx).map((img, i) => renderImg(img, `rem-${i}`))}
              </div>
            )}
          </>
        )
      })()}
      {section.contentAfter && <div className="mt-6 pt-2 border-t" style={{ borderColor: 'rgb(241 245 249)' }}><GuideMarkdown content={section.contentAfter} onNavigate={onNavigate} /></div>}

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxWidth: '96vw', maxHeight: '94vh', backgroundColor: 'rgb(15 23 42)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgb(15 23 42)' }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgb(148 163 184)' }}>
                {lightbox.guidance ? 'From Invoice · Invoice Detail View' : 'Screenshot'}
              </span>
              {lightbox.guidance && (
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgb(148 163 184)', marginLeft: 'auto', marginRight: '2.5rem' }}>
                  Guidance
                </span>
              )}
              <button
                className="absolute top-2 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                onClick={() => setLightbox(null)}
              >✕</button>
            </div>

            {/* Body — image + optional guidance side by side */}
            <div className={`flex min-h-0 flex-1 ${lightbox.guidance ? 'divide-x' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {/* Image pane */}
              <div className={`flex flex-col min-h-0 ${lightbox.guidance ? 'w-[62%]' : 'w-full'}`} style={{ backgroundColor: 'rgb(15 23 42)' }}>
                <div className="flex-1 overflow-auto flex items-start justify-center p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightbox.src}
                    alt={lightbox.caption ?? ''}
                    className="w-full h-auto object-contain rounded"
                    style={{ display: 'block' }}
                  />
                </div>
                {lightbox.caption && (
                  <div className="px-4 py-2 text-xs shrink-0 border-t" style={{ color: 'rgb(148 163 184)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgb(15 23 42)' }}>
                    {lightbox.caption}
                  </div>
                )}
              </div>

              {/* Guidance pane — only shown when guidance is available */}
              {lightbox.guidance && (
                <div className="w-[38%] overflow-y-auto p-5 bg-white" style={{ maxHeight: '100%' }}>
                  {lightbox.guidance}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick Reference tab content ─────────────────────────────────────────────

function TOCTab({ guide, onNavigate }: { guide: Guide; onNavigate: (tabId: string, sectionId?: string) => void }) {
  const tabs = GUIDE_TABS[guide.id] ?? []
  // Skip TOC and Quick Reference tabs themselves
  const contentTabs = tabs.filter(t => !('isTOC' in t && t.isTOC) && !('isQuickRef' in t && t.isQuickRef))
  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: 'rgb(226 232 240)' }}>
      <div className="px-5 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'rgb(226 232 240)', backgroundColor: 'rgb(248 250 252)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500">
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-semibold text-slate-900">Table of Contents</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgb(241 245 249)' }}>
        {contentTabs.map((tab, idx) => {
          const sections = guide.sections.filter(s =>
            (tab.sectionIds as string[]).includes(s.id)
          )
          return (
            <div key={tab.id} className="px-5 py-4">
              {/* Tab row */}
              <button
                onClick={() => onNavigate(tab.id)}
                className="w-full text-left flex items-center gap-3 group"
              >
                <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'rgb(238 242 255)', color: 'rgb(99 102 241)' }}>
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex-1">
                  {tab.label}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                  className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity"
                  style={{ color: 'rgb(99 102 241)' }}>
                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Section links under each tab — only for named sections */}
              {sections.filter(s => s.title && s.title !== tab.label).length > 1 && (
                <div className="mt-2 ml-10 space-y-1">
                  {sections.filter(s => s.title && s.title !== tab.label).map(s => (
                    <button
                      key={s.id}
                      onClick={() => onNavigate(tab.id, s.id)}
                      className="block text-left text-xs text-slate-500 hover:text-indigo-600 hover:underline transition-colors"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuickRefTab({ guide, onNavigate }: { guide: Guide; onNavigate: (tabId: string, sectionId?: string) => void }) {
  const docUrl = DOC_URLS[guide.id]
  return (
    <div className="space-y-4">
      {/* Link to source doc */}
      {docUrl && (
        <div className="rounded-lg border bg-white p-4 flex items-center justify-between"
          style={{ borderColor: 'rgb(226 232 240)' }}>
          <div>
            <p className="text-sm font-semibold text-slate-900">View Full Guide Document</p>
            <p className="text-xs text-slate-500 mt-0.5">Opens the original Google Doc in a new tab</p>
          </div>
          <a href={docUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
            style={{
              color: 'rgb(99 102 241)',
              borderColor: 'rgb(199 210 254)',
              backgroundColor: 'rgb(238 242 255)',
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
            </svg>
            Open in Google Docs
          </a>
        </div>
      )}

      {/* Quick reference table */}
      <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: 'rgb(226 232 240)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: 'rgb(226 232 240)', backgroundColor: 'rgb(248 250 252)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500">
            <path fillRule="evenodd" d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 15.25a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 10a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1V10Z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-slate-900">Quick Reference</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'rgb(241 245 249)' }}>
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 border-b"
                  style={{ borderColor: 'rgb(226 232 240)', width: '42%' }}>Task</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 border-b"
                  style={{ borderColor: 'rgb(226 232 240)' }}>Where to Go</th>
              </tr>
            </thead>
            <tbody>
              {guide.quickReference.map((row, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgb(241 245 249)' }}>
                  <td className="px-4 py-2.5 font-medium text-slate-800 align-top">{row.task}</td>
                  <td className="px-4 py-2.5 align-top">
                    {row.tabLink ? (
                      <button
                        onClick={() => onNavigate(row.tabLink!, row.sectionLink)}
                        className="text-left text-indigo-600 hover:text-indigo-800 hover:underline text-sm transition-colors flex items-center gap-1"
                      >
                        {row.whereTo}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 shrink-0 opacity-60">
                          <path fillRule="evenodd" d="M4.22 3.22a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 0 1-1.06-1.06L6.94 6.5 4.22 3.78a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-sm text-slate-600">{row.whereTo}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Guide view (tabs + content) ─────────────────────────────────────────────

function GuideView({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const tabs = GUIDE_TABS[guide.id] ?? []
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const handleTabChange = useCallback((tabId: string, sectionId?: string) => {
    setSearchQuery('')
    setActiveTab(tabId)
    if (contentRef.current) contentRef.current.scrollTop = 0
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(`section-${sectionId}`)
        if (el && contentRef.current) {
          const containerRect = contentRef.current.getBoundingClientRect()
          const elRect = el.getBoundingClientRect()
          const top = contentRef.current.scrollTop + (elRect.top - containerRect.top) - 16
          contentRef.current.scrollTo({ top, behavior: 'smooth' })
        }
      }, 120)
    }
  }, [])

  const searchResults = searchQuery.trim().length > 1
    ? (() => {
        const q = searchQuery.trim()
        const regex = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        return guide.sections.filter((s) =>
          regex.test(s.title) || regex.test(s.content) || regex.test(s.contentAfter ?? '')
        )
      })()
    : null

  const currentTab = tabs.find((t) => t.id === activeTab)
  const sections = guide.sections.filter((s) =>
    (currentTab?.sectionIds as string[] | undefined)?.includes(s.id)
  )

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>

      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b bg-white"
        style={{ borderColor: 'rgb(226 232 240)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Home
        </button>
        <span className="text-slate-300">|</span>
        <div
          className="flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))', color: 'white' }}>
          Z
        </div>
        <span className="font-semibold text-sm text-slate-900">{guide.title}</span>
        <span className="text-xs px-1.5 py-0.5 rounded font-medium hidden sm:inline"
          style={{ backgroundColor: 'rgb(238 242 255)', color: 'rgb(99 102 241)' }}>
          {guide.subtitle}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgb(148 163 184)' }}>
              <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search guide…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-md border outline-none w-52"
              style={{ borderColor: 'rgb(203 213 225)', color: 'rgb(15 23 42)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="shrink-0 flex items-center gap-0 border-b bg-white px-4 overflow-x-auto"
        style={{ borderColor: 'rgb(226 232 240)' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className="shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              color: activeTab === tab.id ? 'rgb(99 102 241)' : 'rgb(100 116 139)',
              borderBottom: activeTab === tab.id ? '2px solid rgb(99 102 241)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {searchResults !== null ? (
            <>
              <p className="text-xs text-slate-500 font-medium px-1">
                {searchResults.length === 0
                  ? `No results for "${searchQuery}"`
                  : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
              </p>
              {searchResults.map((s) => <SectionBlock key={s.id} section={s} onNavigate={handleTabChange} />)}
            </>
          ) : 'isTOC' in (currentTab ?? {}) && (currentTab as {isTOC?: boolean}).isTOC ? (
            <TOCTab guide={guide} onNavigate={handleTabChange} />
          ) : currentTab?.isQuickRef ? (
            <QuickRefTab guide={guide} onNavigate={handleTabChange} />
          ) : (
            sections.map((s) => <SectionBlock key={s.id} section={s} onNavigate={handleTabChange} />)
          )}
          <div className="h-8" />
        </div>
      </div>
    </div>
  )
}

// ─── Landing / Home page ──────────────────────────────────────────────────────

function HomePage({ onSelect }: { onSelect: (guideId: string) => void }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'rgb(248 250 252)' }}>

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b bg-white"
        style={{ borderColor: 'rgb(226 232 240)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))', color: 'white' }}>
            Z
          </div>
          <span className="font-semibold text-sm text-slate-900">ZIP Employee Guides</span>
          <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: 'rgb(238 242 255)', color: 'rgb(99 102 241)' }}>
            FluidStack Procurement
          </span>
        </div>
        <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          ← Accounting Portal
        </a>
      </header>

      {/* Cover image + two guide links */}
      <div className="flex flex-col items-center px-4 pt-10 pb-10">

        {/* Cover image */}
        <div className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-sm mb-10"
          style={{ borderColor: 'rgb(226 232 240)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/zip-guide-images/po-01-2e9971fd.png"
            alt="ZIP Procurement × FluidStack"
            className="w-full h-auto block"
          />
        </div>

        {/* Two guide links */}
        <div className="w-full max-w-lg flex flex-col gap-3">
          <button onClick={() => onSelect('po-request')}
            className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 hover:shadow-md transition-all group text-left"
            style={{ borderColor: 'rgb(226 232 240)' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))', color: 'white' }}>
              PO
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                ZIP PO Request Guide
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Employee Reference Guide</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
              className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>

          <button onClick={() => onSelect('ap-processing')}
            className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 hover:shadow-md transition-all group text-left"
            style={{ borderColor: 'rgb(226 232 240)' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, rgb(99 102 241), rgb(139 92 246))', color: 'white' }}>
              AP
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                ZIP AP Processing Guide
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Employee Reference Guide</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
              className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function ZipGuidesPage() {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null)
  const activeGuide = activeGuideId ? ZIP_GUIDES.find((g) => g.id === activeGuideId) : null

  if (activeGuide) {
    return <GuideView guide={activeGuide} onBack={() => setActiveGuideId(null)} />
  }
  return <HomePage onSelect={setActiveGuideId} />
}
