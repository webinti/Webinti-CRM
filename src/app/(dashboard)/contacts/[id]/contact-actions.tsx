'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  role?: string | null
  jobTitle?: string | null
  companyId?: string | null
  notes?: string | null
  isPrimary: boolean
}

type Company = { id: string; name: string }

export function ContactActions({ contact }: { contact: Contact }) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    jobTitle: contact.jobTitle ?? '',
    role: contact.role ?? 'general',
    companyId: contact.companyId ?? '',
    notes: contact.notes ?? '',
  })

  useEffect(() => {
    fetch('/api/societes').then(r => r.json()).then(setCompanies)
  }, [])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, companyId: form.companyId || null }),
    })
    if (res.ok) {
      toast.success('Contact mis à jour')
      setShowEdit(false)
      router.refresh()
    } else {
      toast.error('Erreur lors de la modification')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${contact.firstName} ${contact.lastName}" ? Cette action est irréversible.`)) return
    const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Contact supprimé')
      router.push('/contacts')
    } else {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowEdit(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 12px', borderRadius: 6,
            border: '1px solid #252538', background: 'transparent',
            color: '#9898b8', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#f0f0ff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9898b8' }}
        >
          <Edit2 size={12} /> Modifier
        </button>
        <button
          onClick={handleDelete}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 12px', borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.2)', background: 'transparent',
            color: '#f87171', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={12} /> Supprimer
        </button>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent title="Modifier le contact">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Nom *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <PhoneInput label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Poste" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rôle</label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Société</label>
              <Select value={form.companyId} onValueChange={v => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une société" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={saving}>Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
