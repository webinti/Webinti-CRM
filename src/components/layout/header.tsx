'use client'

import { Bell, Plus, Menu } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useState } from 'react'
import { useMobileNav } from './mobile-nav-context'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void; icon?: React.ReactNode }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? 'Admin'
  const [btnHover, setBtnHover] = useState(false)
  const { toggle } = useMobileNav()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, padding: '0 16px',
      borderBottom: '1px solid #1e1e30',
      background: 'rgba(13,13,20,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      gap: 10,
    }}>
      {/* Left — burger on mobile + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden"
          onClick={toggle}
          style={{
            flexShrink: 0,
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid #252538',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9898b8',
          }}
        >
          <Menu size={17} />
        </button>

        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0ff', lineHeight: 1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 12, color: '#5e5e7a', marginTop: 2, lineHeight: 1 }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {action && (
          <button
            onClick={action.onClick}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', borderRadius: 6,
              background: btnHover ? '#4f46e5' : '#6366f1',
              border: 'none', color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {action.icon ?? <Plus size={12} />}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        )}

        <button style={{
          width: 32, height: 32, borderRadius: 6,
          border: '1px solid #252538',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5e5e7a',
        }}>
          <Bell size={14} />
        </button>

        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(126,229,170,0.12)',
          border: '1px solid rgba(126,229,170,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#7ee5aa',
          userSelect: 'none', flexShrink: 0,
        }}>
          {getInitials(userName)}
        </div>
      </div>
    </header>
  )
}
