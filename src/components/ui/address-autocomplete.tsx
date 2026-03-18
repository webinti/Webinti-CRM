'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

export interface AddressResult {
  label: string
  street: string
  city: string
  postalCode: string
  country: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: AddressResult) => void
  placeholder?: string
  label?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '12 rue de la Paix, Paris',
  label,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`
      )
      const json = await res.json()
      const results: AddressResult[] = (json.features ?? []).map((f: any) => ({
        label: f.properties.label,
        street: f.properties.name ?? '',
        city: f.properties.city ?? '',
        postalCode: f.properties.postcode ?? '',
        country: 'France',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }))
      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (v: string) => {
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  const handleSelect = (addr: AddressResult) => {
    onChange(addr.label)
    onSelect(addr)
    setOpen(false)
    setSuggestions([])
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <MapPin size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: focused ? '#7ee5aa' : '#5e5e7a', pointerEvents: 'none', transition: 'color 0.15s',
        }} />
        {loading && (
          <Loader2 size={13} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#5e5e7a', animation: 'spin 1s linear infinite',
          }} />
        )}
        <input
          type="text"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true) }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%', height: 38,
            padding: '0 36px',
            borderRadius: 8,
            border: `1px solid ${focused ? '#7ee5aa' : '#252538'}`,
            background: '#0d0d14',
            fontSize: 13, color: '#f0f0ff',
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          className="placeholder:text-[#5e5e7a]"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: label ? 'calc(100% + 2px)' : 'calc(100% + 2px)',
          left: 0, right: 0, zIndex: 50,
          background: '#13131e',
          border: '1px solid #252538',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          marginTop: label ? 0 : 4,
        }}>
          {suggestions.map((s, i) => (
            <SuggestionItem key={i} address={s} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionItem({ address, onSelect }: { address: AddressResult; onSelect: (a: AddressResult) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onMouseDown={() => onSelect(address)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', border: 'none', borderBottom: '1px solid #1e1e30',
        background: hovered ? '#1a1a28' : 'transparent',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        transition: 'background 0.1s',
      }}
    >
      <MapPin size={13} style={{ color: '#7ee5aa', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#f0f0ff', margin: 0, lineHeight: 1.3 }}>{address.street}</p>
        <p style={{ fontSize: 11, color: '#5e5e7a', margin: '2px 0 0', lineHeight: 1 }}>
          {address.postalCode} {address.city}
        </p>
      </div>
    </button>
  )
}
