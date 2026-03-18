'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
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

export default function NouvelAcomptePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  const invoiceId = searchParams.get('invoiceId')

  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [baseAmount, setBaseAmount] = useState(0)

  const [form, setForm] = useState({
    companyId: '', contactId: '',
    quoteId: quoteId ?? '', invoiceId: invoiceId ?? '',
    currency: 'EUR' as 'EUR' | 'USD',
    percentage: 30, customAmount: 0,
    dueDate: '', notes: '',
  })

  const amount = baseAmount > 0 ? (baseAmount * form.percentage) / 100 : form.customAmount

  useEffect(() => {
    Promise.all([
      fetch('/api/societes').then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
    ]).then(([cos, cts]) => {
      setCompanies(cos)
      setContacts(cts.map((row: any) => row.contact ?? row))
    })

    if (quoteId) {
      fetch(`/api/devis/${quoteId}`).then(r => r.json()).then(q => {
        setForm(f => ({ ...f, companyId: q.companyId ?? '', contactId: q.contactId ?? '' }))
        setBaseAmount(parseFloat(q.total))
      })
    }
    if (invoiceId) {
      fetch(`/api/factures/${invoiceId}`).then(r => r.json()).then(inv => {
        setForm(f => ({ ...f, companyId: inv.companyId ?? '', contactId: inv.contactId ?? '' }))
        setBaseAmount(parseFloat(inv.total))
      })
    }
  }, [quoteId, invoiceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/acomptes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: form.companyId || null,
        contactId: form.contactId || null,
        quoteId: form.quoteId || null,
        invoiceId: form.invoiceId || null,
        currency: form.currency,
        percentage: form.percentage,
        amount: amount,
        dueDate: form.dueDate || undefined,
        notes: form.notes,
      }),
    })

    if (res.ok) {
      toast.success('Acompte créé')
      router.push('/acomptes')
    } else {
      toast.error('Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Nouvel acompte" subtitle="Facture d'acompte à 30%" />

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
          <Link href="/acomptes" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
            <ArrowLeft size={14} /> Retour
          </Link>

          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Société</label>
                <Select value={form.companyId} onValueChange={v => setForm({ ...form, companyId: v })}>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Montant</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {baseAmount > 0 && (
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-xs text-[#6366f1] mb-1">Montant de référence</p>
                  <p className="text-lg font-bold text-[#f1f5f9]">{formatCurrency(baseAmount, form.currency)}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Pourcentage (%)</label>
                  <input
                    type="number"
                    value={form.percentage}
                    onChange={e => setForm({ ...form, percentage: parseFloat(e.target.value) || 30 })}
                    min="1" max="100" step="5"
                    style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: '100%' }}
                  />
                </div>
                {baseAmount === 0 && (
                  <Input
                    label="Montant (€)"
                    type="number"
                    value={form.customAmount}
                    onChange={e => setForm({ ...form, customAmount: parseFloat(e.target.value) || 0 })}
                    min="0" step="0.01"
                  />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, border: '1px solid #252538', background: '#1a1a28' }}>
                <span className="text-sm text-[#64748b]">Montant de l'acompte</span>
                <span className="text-xl font-bold gradient-text">{formatCurrency(amount, form.currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date d'échéance" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Devise</label>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v as 'EUR' | 'USD' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="TVA non applicable, art. 293 B du CGI" rows={3} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" loading={saving}><Save size={14} />Créer l'acompte</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
