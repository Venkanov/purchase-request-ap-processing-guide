'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewComment, CommentType } from '@/types'

interface ReviewCommentsTableProps {
  comments: ReviewComment[]
}

type ColorConfig = {
  bg: string
  text: string
  border: string
}

const COMMENT_TYPE_COLORS: Record<CommentType, ColorConfig> = {
  'Missing Citation':             { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
  'Unsupported Conclusion':       { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'    },
  'Missing Fact':                 { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'  },
  'Incomplete Guidance':          { bg: 'bg-yellow-50',   text: 'text-yellow-700',  border: 'border-yellow-200' },
  'Inconsistent with Source':     { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'    },
  'Ambiguous Wording':            { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'   },
  'Alternative View Not Considered': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Drafting Improvement':         { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200'  },
}

function CommentTypeBadge({ type }: { type: CommentType }) {
  const colors = COMMENT_TYPE_COLORS[type]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {type}
    </span>
  )
}

export function ReviewCommentsTable({ comments }: ReviewCommentsTableProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm text-slate-500">No review comments</p>
        <p className="mt-1 text-xs text-slate-500">The document passed review without flagged issues</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
              Section / Page
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
              Comment Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Issue
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Recommended Revision
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
              Supporting Reference
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {comments.map((comment, i) => (
            <tr
              key={comment.id}
              className={cn(
                'align-top transition-colors hover:bg-slate-50',
                i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              )}
            >
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                {comment.sectionPage}
              </td>
              <td className="px-4 py-3">
                <CommentTypeBadge type={comment.commentType} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-700 max-w-[240px]">
                <p className="leading-relaxed">{comment.issue}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-700 max-w-[240px]">
                <p className="leading-relaxed">{comment.recommendedRevision}</p>
              </td>
              <td className="px-4 py-3 text-xs text-blue-600 max-w-[180px]">
                <p className="leading-relaxed">{comment.supportingGuidanceReference}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-xs text-slate-500">
          {comments.length} comment{comments.length !== 1 ? 's' : ''} identified
        </p>
      </div>
    </div>
  )
}
