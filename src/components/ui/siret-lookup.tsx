'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle } from 'lucide-react'

export interface SiretResult {
  name: string
  siret: string
  siren: string
  legalForm: string
  address: {
    street: string
    postalCode: string
    city: string
    country: string
  } | null
}

interface SiretLookupProps {
  onResult: (result: SiretResult) => void
  label?: string
}

export function SiretLookup({ onResult, label = 'Rechercher par SIRET / Nom' }: SiretLookupProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SiretResult[]>([])
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState(false)

  const search = async (q: string) => {
    if (q.length < 3) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=6&limite_matching_etablissements=1`
      )
      const json = await res.json()
      const items: SiretResult[] = (json.results ?? []).map((r: any) => {
        const etab = r.siege ?? r.matching_etablissements?.[0]
        return {
          name: r.nom_complet ?? r.nom_raison_sociale ?? '',
          siret: etab?.siret ?? '',
          siren: r.siren ?? '',
          legalForm: r.nature_juridique ? legalFormLabel(r.nature_juridique) : '',
          address: etab ? {
            street: [etab.numero_voie, etab.type_voie, etab.libelle_voie].filter(Boolean).join(' '),
            postalCode: etab.code_postal ?? '',
            city: etab.libelle_commune ?? '',
            country: 'France',
          } : null,
        }
      })
      setResults(items)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (r: SiretResult) => {
    setQuery(r.name)
    setResults([])
    setSelected(true)
    onResult(r)
  }

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? '#7ee5aa' : '#5e5e7a', pointerEvents: 'none' }} />
        {loading && <Loader2 size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#5e5e7a', animation: 'spin 1s linear infinite' }} />}
        {selected && !loading && <CheckCircle size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#7ee5aa' }} />}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(false); search(e.target.value) }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTimeout(() => setResults([]), 150) }}
          placeholder="ACME SAS, 12345678901234..."
          style={{
            width: '100%', height: 38, padding: '0 36px',
            borderRadius: 8, border: `1px solid ${focused ? '#7ee5aa' : '#252538'}`,
            background: '#0d0d14', fontSize: 13, color: '#f0f0ff',
            outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          className="placeholder:text-[#5e5e7a]"
        />
      </div>

      {results.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 50,
          background: '#13131e', border: '1px solid #252538', borderRadius: 8,
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(r)}
              style={{
                width: '100%', display: 'block', padding: '10px 14px',
                background: 'transparent',
                border: 'none', borderBottom: '1px solid #1e1e30',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a28' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <p style={{ margin: 0, fontSize: 13, color: '#f0f0ff', fontWeight: 600 }}>{r.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5e5e7a' }}>
                {r.legalForm && <span style={{ color: '#7ee5aa', marginRight: 8 }}>{r.legalForm}</span>}
                {r.siret && `SIRET ${r.siret}`}
                {r.address && ` · ${r.address.postalCode} ${r.address.city}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function legalFormLabel(code: string): string {
  const map: Record<string, string> = {
    '5710': 'SAS', '5720': 'SASU', '5499': 'SARL', '5498': 'EURL',
    '5308': 'SARL', '1000': 'EI', '6540': 'SA', '9220': 'Association',
    '5485': 'SELA', '5410': 'SA', '5306': 'SNC', '5202': 'SCI',
  }
  return map[code] ?? ''
}
