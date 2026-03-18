'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, FileText,
  Receipt, Settings, LogOut, ChevronRight,
  TrendingUp, Wallet, Menu, X
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'

const navigation = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sociétés', href: '/societes', icon: Building2 },
  { label: 'Contacts', href: '/contacts', icon: Users },
  {
    label: 'Facturation',
    icon: TrendingUp,
    children: [
      { label: 'Devis', href: '/devis', icon: FileText },
      { label: 'Factures', href: '/factures', icon: Receipt },
      { label: 'Acomptes', href: '/acomptes', icon: Wallet },
    ],
  },
  { label: 'Paramètres', href: '/parametres', icon: Settings },
]

type NavItemType = { label: string; href: string; icon: React.ElementType }

function NavItem({ item, pathname, onNavigate }: { item: NavItemType; pathname: string; onNavigate?: () => void }) {
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  const Icon = item.icon
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 6,
        fontSize: 13, fontWeight: 500, textDecoration: 'none',
        marginBottom: 1,
        color: isActive ? '#f0f0ff' : hovered ? '#9898b8' : '#5e5e7a',
        background: isActive ? '#1e1e30' : hovered ? '#16162a' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={14} style={{ color: isActive ? '#7ee5aa' : 'currentColor', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7ee5aa' }} />
      )}
    </Link>
  )
}

function NavGroup({ item, pathname, onNavigate }: { item: typeof navigation[number]; pathname: string; onNavigate?: () => void }) {
  const isGroupActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href))
  const [open, setOpen] = useState(!!isGroupActive)
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon

  return (
    <div style={{ marginBottom: 1 }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', borderRadius: 6,
          background: hovered ? '#16162a' : 'transparent',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          color: isGroupActive ? '#9898b8' : hovered ? '#9898b8' : '#5e5e7a',
          fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
        }}
      >
        <Icon size={14} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
        <ChevronRight size={12} style={{
          transition: 'transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'none',
          color: '#52525b',
        }} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              overflow: 'hidden', marginLeft: 12, paddingLeft: 8,
              borderLeft: '1px solid #252538', marginTop: 1,
            }}
          >
            {item.children?.map((child) => (
              <NavItem key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavButton({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 6,
        background: danger && hovered ? 'rgba(239,68,68,0.08)' : hovered ? '#16162a' : 'transparent',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        color: danger && hovered ? '#f87171' : hovered ? '#9898b8' : '#5e5e7a',
        fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter()
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 16px',
        borderBottom: '1px solid #1e1e30',
      }}>
        <Image
          src="/logo-webinti2026.png"
          alt="Webinti"
          width={32}
          height={32}
          style={{ borderRadius: 6, flexShrink: 0, objectFit: 'contain' }}
        />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff', lineHeight: 1 }}>Webinti</p>
          <p style={{ fontSize: 10, color: '#5e5e7a', marginTop: 2, lineHeight: 1 }}>CRM</p>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {navigation.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
          ) : (
            <NavItem key={item.href} item={item as NavItemType} pathname={pathname} onNavigate={onNavigate} />
          )
        )}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid #1e1e30' }}>
        <NavButton icon={<LogOut size={14} />} label="Déconnexion" danger onClick={async () => {
          await signOut()
          router.push('/login')
        }} />
      </div>
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 60,
          width: 36, height: 36, borderRadius: 8,
          border: '1px solid #252538',
          background: '#0f0f18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#9898b8',
        }}
      >
        <Menu size={18} />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 45,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          position: 'fixed', left: 0, top: 0,
          width: 240, height: '100vh',
          background: '#0f0f18',
          borderRight: '1px solid #252538',
          zIndex: 40, flexDirection: 'column',
        }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            className="md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed', left: 0, top: 0,
              width: 280, height: '100vh',
              background: '#0f0f18',
              borderRight: '1px solid #252538',
              zIndex: 50, display: 'flex', flexDirection: 'column',
            }}
          >
            <button
              onClick={close}
              style={{
                position: 'absolute', top: 14, right: 12,
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid #252538',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#5e5e7a',
              }}
            >
              <X size={14} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={close} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
