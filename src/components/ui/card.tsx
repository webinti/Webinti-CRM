'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Supabase-style: bg légèrement élevé, bordure grise subtile, pas de blanc
const cardBase: React.CSSProperties = {
  background: '#13131e',
  border: '1px solid #252538',
  borderRadius: 8,
  transition: 'border-color 0.2s',
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ className, glow, style, ...props }: CardProps) {
  return (
    <div
      style={{ ...cardBase, ...style }}
      className={className}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between px-5 py-4', className)}
      style={{ borderBottom: '1px solid #252538' }}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 style={{ color: '#f0f0ff' }} className={cn('text-sm font-semibold flex items-center gap-2', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p style={{ color: '#5e5e7a' }} className={cn('text-xs mt-0.5', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ borderTop: '1px solid #252538' }}
      className={cn('flex items-center gap-3 p-4', className)}
      {...props}
    />
  )
}

// ── Stat Card ─────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      style={{
        background: '#13131e',
        border: `1px solid ${hovered ? '#33334e' : '#252538'}`,
        borderRadius: 8,
        padding: 20,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p style={{ color: '#5e5e7a', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {title}
          </p>
          <p style={{ color: '#f0f0ff', fontSize: 24, fontWeight: 700, marginTop: 6, lineHeight: 1 }} className="truncate">
            {value}
          </p>
          {subtitle && <p style={{ color: '#5e5e7a', fontSize: 11, marginTop: 6 }}>{subtitle}</p>}
          {trend && (
            <p style={{ fontSize: 11, marginTop: 8, fontWeight: 500, color: trend.value >= 0 ? '#4ade80' : '#f87171' }}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(126,229,170,0.1)',
            border: '1px solid rgba(126,229,170,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7ee5aa', flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
