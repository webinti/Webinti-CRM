'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type Company = { id: string; name: string }
type Contact = { id: string; firstName: string; lastName: string; companyId?: string | null; isPrimary: boolean; role?: string | null }
type LineItem = { id: string; description: string; quantity: number; unitPrice: number; unit: string }

export default function ModifierDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    companyId: '', contactId: '',
    currency: 'EUR' as 'EUR' | 'USD',
    subject: '', validUntil: '', notes: '', internalNotes: '',
  })
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, unit: 'forfait' },
  ])

  useEffect(() => {
    Promise.all([
      fetch(`/api/devis/${id}`).then(r => r.json()),
      fetch('/api/societes').then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
    ]).then(([quote, cos, cts]) => {
      setCompanies(cos)
      setContacts(cts.map((row: any) => row.contact ?? row))
      setForm({
        companyId: quote.companyId ?? '',
        contactId: quote.contactId ?? '',
        currency: quote.currency ?? 'EUR',
        subject: quote.subject ?? '',
        validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : '',
        notes: quote.notes ?? '',
        internalNotes: quote.internalNotes ?? '',
      })
      if (quote.items?.length) {
        setItems(quote.items.map((item: any, i: number) => ({
          id: item.id ?? String(i),
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          unit: item.unit ?? 'forfait',
        })))
      }
      setLoading(false)
    })
  }, [id])

  const filteredContacts = form.companyId
    ? contacts.filter(c => c.companyId === form.companyId)
    : contacts

  const handleCompanyChange = (companyId: string) => {
    const companyContacts = contacts.filter(c => c.companyId === companyId)
    const primary = companyContacts.find(c => c.isPrimary)
      ?? companyContacts.find(c => c.role === 'general')
      ?? companyContacts[0]
    setForm(f => ({ ...f, companyId, contactId: primary?.id ?? '' }))
  }

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, unit: 'forfait' }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)) }
  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/devis/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        companyId: form.companyId || null,
        contactId: form.contactId || null,
        validUntil: form.validUntil || null,
        items: items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          unit: i.unit,
        })),
      }),
    })
    if (res.ok) {
      toast.success('Devis mis à jour')
      router.push(`/devis/${id}`)
    } else {
      toast.error('Erreur lors de la mise à jour')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Modifier le devis" subtitle="Chargement..." />
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 12, background: '#13131e', border: '1px solid #252538' }} className="animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Modifier le devis" subtitle="Édition" />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
          <Link href={`/devis/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
            <ArrowLeft size={14} /> Retour au devis
          </Link>

          {/* Client */}
          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Société</label>
                <Select value={form.companyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</label>
                <Select value={form.contactId} onValueChange={v => setForm({ ...form, contactId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {filteredContacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Devise</label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v as 'EUR' | 'USD' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="USD">USD — Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Détails */}
          <Card>
            <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Objet du devis" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Création site web vitrine" />
              <Input label="Valide jusqu'au" type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
              <Textarea label="Notes (visibles sur le devis)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="sm:col-span-2" />
              <Textarea label="Notes internes" value={form.internalNotes} onChange={e => setForm({ ...form, internalNotes: e.target.value })} rows={2} className="sm:col-span-2" />
            </CardContent>
          </Card>

          {/* Lignes */}
          <Card>
            <CardHeader>
              <CardTitle>Prestations</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus size={13} /> Ajouter une ligne
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-[1fr_80px_120px_90px_40px] gap-2 px-1">
                {['Description', 'Qté', 'Prix HT', 'Unité', ''].map(h => (
                  <span key={h} className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">{h}</span>
                ))}
              </div>
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-[1fr_80px_120px_90px_40px] gap-2 items-start">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Développement..." required
                      style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }}
                      className="placeholder:text-[#5e5e7a]" />
                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.5"
                      style={{ height: 36, padding: '0 8px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', textAlign: 'center', width: '100%' }} />
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" step="0.01"
                      style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                    <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      style={{ height: 36, padding: '0 8px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }}>
                      <option value="forfait">Forfait</option>
                      <option value="heure">Heure</option>
                      <option value="jour">Jour</option>
                      <option value="mois">Mois</option>
                      <option value="unité">Unité</option>
                    </select>
                    <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1}
                      style={{ height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#5e5e7a', flexShrink: 0 }}
                      className="hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-30">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid #252538' }}>
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Sous-total HT</span>
                    <span className="text-[#f1f5f9] font-medium">{formatCurrency(subtotal, form.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>TVA (auto-entrepreneur)</span><span>N/A</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: '1px solid #252538' }}>
                    <span className="text-[#f1f5f9]">Total</span>
                    <span className="gradient-text">{formatCurrency(subtotal, form.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" loading={saving}><Save size={14} /> Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
