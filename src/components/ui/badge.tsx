'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  status?: string
}

const variantClasses = {
  default: 'text-[#9898b8] border-[#252538] bg-[#1a1a28]',
  primary: 'text-[#7ee5aa] border-[#7ee5aa]/30 bg-[rgba(126,229,170,0.12)]',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  muted: 'text-[#5e5e7a] border-[#252538] bg-[#1a1a28]',
}

export function Badge({ className, variant = 'default', status, children, ...props }: BadgeProps) {
  const statusClass = status ? `badge-${status}` : ''
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusClass || variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
