'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Target, Menu } from 'lucide-react'
import { useMobileNav } from './mobile-nav-context'
import { motion } from 'framer-motion'

const tabs = [
  { label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sociétés', href: '/societes', icon: Building2 },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Prospection', href: '/leads', icon: Target },
]

export function BottomNav() {
  const pathname = usePathname()
  const { toggle } = useMobileNav()

  return (
    <nav
      className="flex lg:!hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(13,13,20,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #252538',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0 8px', textDecoration: 'none', gap: 4, position: 'relative',
              color: isActive ? '#7ee5aa' : '#5e5e7a',
              transition: 'color 0.15s',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, margin: '0 auto',
                  width: 28, height: 2, borderRadius: 1,
                  background: 'linear-gradient(90deg, #7ee5aa, #6366f1)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, lineHeight: 1 }}>{label}</span>
          </Link>
        )
      })}

      {/* Menu — opens drawer */}
      <button
        onClick={toggle}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer',
          gap: 4, color: '#5e5e7a', fontFamily: 'inherit', transition: 'color 0.15s',
        }}
      >
        <Menu size={20} strokeWidth={1.8} />
        <span style={{ fontSize: 10, fontWeight: 400, lineHeight: 1 }}>Menu</span>
      </button>
    </nav>
  )
}
