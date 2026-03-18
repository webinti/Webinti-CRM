'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: 'FR', flag: '🇫🇷', name: 'France',       dial: '+33' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique',     dial: '+32' },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse',       dial: '+41' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourg',   dial: '+352' },
  { code: 'MC', flag: '🇲🇨', name: 'Monaco',       dial: '+377' },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne',      dial: '+34' },
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne',    dial: '+49' },
  { code: 'IT', flag: '🇮🇹', name: 'Italie',       dial: '+39' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal',     dial: '+351' },
  { code: 'NL', flag: '🇳🇱', name: 'Pays-Bas',     dial: '+31' },
  { code: 'GB', flag: '🇬🇧', name: 'Royaume-Uni',  dial: '+44' },
  { code: 'US', flag: '🇺🇸', name: 'États-Unis',   dial: '+1' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',       dial: '+1' },
  { code: 'MA', flag: '🇲🇦', name: 'Maroc',        dial: '+212' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algérie',      dial: '+213' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisie',      dial: '+216' },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',      dial: '+221' },
  { code: 'AE', flag: '🇦🇪', name: 'Émirats',      dial: '+971' },
]

function parsePhone(value: string) {
  if (!value) return { country: COUNTRIES[0], local: '' }
  const match = COUNTRIES.find(c => value.startsWith(c.dial))
  if (match) return { country: match, local: value.slice(match.dial.length).trimStart() }
  return { country: COUNTRIES[0], local: value }
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
}

export function PhoneInput({ value, onChange, label, placeholder = '6 12 34 56 78', required }: PhoneInputProps) {
  const { country: initCountry, local: initLocal } = parsePhone(value)
  const [country, setCountry] = useState(initCountry)
  const [local, setLocal] = useState(initLocal)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sync if parent value changes externally
  useEffect(() => {
    const { country: c, local: l } = parsePhone(value)
    setCountry(c)
    setLocal(l)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setCountry(c)
    setOpen(false)
    onChange(local ? `${c.dial} ${local}` : '')
  }

  const handleLocalChange = (v: string) => {
    setLocal(v)
    onChange(v ? `${country.dial} ${v}` : '')
  }

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex', height: 38, borderRadius: 8,
          border: `1px solid ${focused || open ? '#6366f1' : '#252538'}`,
          background: '#0d0d14', overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0 8px 0 10px', borderRight: '1px solid #252538',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#9898b8', fontSize: 13, flexShrink: 0, fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{country.flag}</span>
          <span style={{ fontSize: 12, color: '#5e5e7a' }}>{country.dial}</span>
          <ChevronDown size={11} style={{ color: '#5e5e7a', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={local}
          onChange={e => handleLocalChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          style={{
            flex: 1, height: '100%', padding: '0 12px',
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: '#f0f0ff', fontFamily: 'inherit',
          }}
          className="placeholder:text-[#5e5e7a]"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, marginTop: label ? 62 : 42,
          background: '#13131e', border: '1px solid #252538',
          borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          maxHeight: 260, overflowY: 'auto', width: 220,
        }}>
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              type="button"
              onMouseDown={() => handleCountrySelect(c)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', border: 'none', borderBottom: '1px solid #1e1e30',
                background: c.code === country.code ? '#1a1a28' : 'transparent',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a28' }}
              onMouseLeave={e => { e.currentTarget.style.background = c.code === country.code ? '#1a1a28' : 'transparent' }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
              <span style={{ fontSize: 13, color: '#f0f0ff', flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 12, color: '#5e5e7a' }}>{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
