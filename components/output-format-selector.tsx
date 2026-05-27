'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { OutputFormat } from '@/types'

interface OutputFormatSelectorProps {
  selected: OutputFormat
  onChange: (format: OutputFormat) => void
  disabled?: boolean
}

interface FormatOption {
  value: OutputFormat
  label: string
  shortLabel: string
  description: string
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'detailed',
    label: 'Detailed Analysis',
    shortLabel: 'Detailed',
    description: 'Full A–E structured analysis with paragraph-level citations',
  },
  {
    value: 'tldr',
    label: 'TL;DR',
    shortLabel: 'TL;DR',
    description: 'Max 200-word executive-friendly summary',
  },
  {
    value: 'onepager',
    label: 'One Pager',
    shortLabel: 'One Pager',
    description: '400–500 word condensed analysis with key conclusions',
  },
  {
    value: 'memo',
    label: 'Formal Memo',
    shortLabel: 'Memo',
    description: 'Formal memorandum with sections and professional disclaimer',
  },
]

export function OutputFormatSelector({
  selected,
  onChange,
  disabled = false,
}: OutputFormatSelectorProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Output Format
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FORMAT_OPTIONS.map((option) => {
          const isActive = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              aria-pressed={isActive}
              className={cn(
                'group relative flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isActive
                  ? 'border-blue-600 bg-blue-600 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              )}
            >
              {/* Active indicator */}
              <div className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-semibold tracking-tight',
                    isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    isActive
                      ? 'bg-white shadow-sm'
                      : 'bg-slate-200'
                  )}
                />
              </div>
              <p
                className={cn(
                  'text-xs leading-snug',
                  isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-600'
                )}
              >
                {option.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
