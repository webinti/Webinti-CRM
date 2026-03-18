'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
type Contact = { id: string; firstName: string; lastName: string; companyId?: string | null }
type LineItem = { id: string; description: string; quantity: number; unitPrice: number; unit: string }

export default function NouvelleFacturePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    companyId: '', contactId: '', quoteId: quoteId ?? '',
    currency: 'EUR' as 'EUR' | 'USD', subject: '',
    dueDate: '', notes: '', internalNotes: '',
  })

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, unit: 'forfait' },
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/societes').then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
    ]).then(([cos, cts]) => {
      setCompanies(cos)
      setContacts(cts.map((row: any) => row.contact ?? row))
    })

    // Pre-fill from quote
    if (quoteId) {
      fetch(`/api/devis/${quoteId}`).then(r => r.json()).then(q => {
        setForm(f => ({
          ...f,
          companyId: q.companyId ?? '',
          contactId: q.contactId ?? '',
          subject: q.subject ?? '',
          notes: q.notes ?? '',
        }))
        setItems(q.items?.map((i: any, idx: number) => ({
          id: String(idx + 1),
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          unit: i.unit ?? 'forfait',
        })) ?? [{ id: '1', description: '', quantity: 1, unitPrice: 0, unit: 'forfait' }])
      })
    }
  }, [quoteId])

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, unit: 'forfait' }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)) }
  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        companyId: form.companyId || null,
        contactId: form.contactId || null,
        quoteId: form.quoteId || null,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, unit: i.unit })),
      }),
    })

    if (res.ok) {
      const inv = await res.json()
      toast.success('Facture créée')
      router.push(`/factures/${inv.id}`)
    } else {
      toast.error('Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Nouvelle facture" subtitle={quoteId ? 'Depuis un devis' : 'Créer une facture'} />

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5">
          <Link href="/factures" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
            <ArrowLeft size={14} /> Retour
          </Link>

          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Société</label>
                <Select value={form.companyId} onValueChange={v => setForm({ ...form, companyId: v, contactId: '' })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Contact</label>
                <Select value={form.contactId} onValueChange={v => setForm({ ...form, contactId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {contacts.filter(c => !form.companyId || c.companyId === form.companyId).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Devise</label>
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

          <Card>
            <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Objet" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Développement application" />
              <Input label="Date d'échéance" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              <Textarea label="Notes (visibles)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="TVA non applicable, art. 293 B du CGI" rows={3} className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prestations</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus size={13} /> Ajouter
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
                  <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-[1fr_80px_120px_90px_40px] gap-2 items-start">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Prestation..." required style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }} className="placeholder:text-[#5e5e7a]" />
                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.5" style={{ height: 36, padding: '0 8px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', textAlign: 'center', width: '100%' }} />
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" step="0.01" style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                    <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ height: 36, padding: '0 8px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }}>
                      <option value="forfait">Forfait</option>
                      <option value="heure">Heure</option>
                      <option value="jour">Jour</option>
                      <option value="mois">Mois</option>
                      <option value="unité">Unité</option>
                    </select>
                    <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} style={{ height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#5e5e7a', flexShrink: 0 }} className="hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-30">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid #252538' }}>
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#64748b]">Sous-total HT</span><span className="text-[#f1f5f9]">{formatCurrency(subtotal, form.currency)}</span></div>
                  <div className="flex justify-between text-xs text-[#475569]"><span>TVA</span><span>N/A</span></div>
                  <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid #252538' }}><span className="text-[#f0f0ff]">Total</span><span className="gradient-text">{formatCurrency(subtotal, form.currency)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" loading={saving}><Save size={14} />Créer la facture</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
