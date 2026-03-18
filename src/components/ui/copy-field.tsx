'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyFieldProps {
  href: string
  icon: React.ReactNode
  value: string
  label?: string
  target?: string
  rel?: string
  suffix?: React.ReactNode
}

export function CopyField({ href, icon, value, label, target, rel, suffix }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2.5 group">
      <a
        href={href}
        target={target}
        rel={rel}
        style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8', textDecoration: 'none', flex: 1, minWidth: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
      >
        <span style={{ color: '#5e5e7a', flexShrink: 0 }}>{icon}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label ?? value}</span>
        {suffix}
      </a>
      <button
        onClick={handleCopy}
        title="Copier"
        style={{
          flexShrink: 0,
          padding: '3px 5px',
          borderRadius: 5,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: copied ? '#7ee5aa' : '#3a3a52',
          transition: 'color 0.15s, background 0.15s',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#9898b8'; e.currentTarget.style.background = '#1a1a28' }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#3a3a52'; e.currentTarget.style.background = 'transparent' }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}
