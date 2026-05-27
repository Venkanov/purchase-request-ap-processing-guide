'use client'

import React from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiskFlag, RiskLevel } from '@/types'

interface RiskFlagsTableProps {
  flags: RiskFlag[]
}

type RiskColorConfig = {
  badge: string
  row: string
  icon: string
  dot: string
}

const RISK_COLORS: Record<RiskLevel, RiskColorConfig> = {
  HIGH:   {
    badge: 'bg-red-50 text-red-700 border-red-200',
    row:   'hover:bg-red-50/50',
    icon:  'text-red-500',
    dot:   'bg-red-500',
  },
  MEDIUM: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    row:   'hover:bg-amber-50/50',
    icon:  'text-amber-500',
    dot:   'bg-amber-500',
  },
  LOW:    {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    row:   'hover:bg-emerald-50/50',
    icon:  'text-emerald-500',
    dot:   'bg-emerald-500',
  },
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const colors = RISK_COLORS[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        colors.badge
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {level}
    </span>
  )
}

export function RiskFlagsTable({ flags }: RiskFlagsTableProps) {
  if (flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
        <ShieldCheck className="mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm text-slate-500">No risk flags identified</p>
        <p className="mt-1 text-xs text-slate-500">The contract analysis did not surface material risks</p>
      </div>
    )
  }

  // Sort: HIGH → MEDIUM → LOW
  const ORDER: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const sorted = [...flags].sort((a, b) => ORDER[a.riskLevel] - ORDER[b.riskLevel])

  const highCount   = flags.filter((f) => f.riskLevel === 'HIGH').length
  const mediumCount = flags.filter((f) => f.riskLevel === 'MEDIUM').length
  const lowCount    = flags.filter((f) => f.riskLevel === 'LOW').length

  return (
    <div className="w-full space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-4 w-4 text-slate-500" />
        <div className="flex gap-2">
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
              {mediumCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {lowCount} Low
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[580px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">
                Risk Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Issue
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Recommended Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((flag, i) => {
              const colors = RISK_COLORS[flag.riskLevel]
              return (
                <tr
                  key={flag.id}
                  className={cn(
                    'align-top transition-colors',
                    colors.row,
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  )}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RiskLevelBadge level={flag.riskLevel} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[280px]">
                    <p className="leading-relaxed">{flag.issue}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[280px]">
                    <p className="leading-relaxed">{flag.recommendedAction}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
          <p className="text-xs text-slate-500">
            {flags.length} risk flag{flags.length !== 1 ? 's' : ''} identified
          </p>
        </div>
      </div>
    </div>
  )
}
