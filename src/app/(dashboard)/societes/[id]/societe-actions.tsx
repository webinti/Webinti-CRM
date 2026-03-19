'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { AddressAutocomplete, type AddressResult } from '@/components/ui/address-autocomplete'
import { PhoneInput } from '@/components/ui/phone-input'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  siret?: string | null
  notes?: string | null
}

export function SocieteActions({ company }: { company: Company }) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [addressData, setAddressData] = useState<AddressResult | null>(null)
  const [form, setForm] = useState({
    name: company.name,
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    siret: company.siret ?? '',
    notes: company.notes ?? '',
  })

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/societes/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        addressStreet: addressData?.street,
        addressCity: addressData?.city,
        addressPostalCode: addressData?.postalCode,
        addressCountry: addressData?.country ?? 'France',
      }),
    })
    if (res.ok) {
      toast.success('Société mise à jour')
      setShowEdit(false)
      setAddressData(null)
      setAddressInput('')
      router.refresh()
    } else {
      toast.error('Erreur lors de la modification')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${company.name}" ? Cette action est irréversible.`)) return
    const res = await fetch(`/api/societes/${company.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Société supprimée')
      router.push('/societes')
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
        <DialogContent title="Modifier la société">
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              label="Nom de la société *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <PhoneInput
                label="Téléphone"
                value={form.phone}
                onChange={v => setForm({ ...form, phone: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Site web"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
              <Input
                label="SIRET"
                value={form.siret}
                onChange={e => setForm({ ...form, siret: e.target.value })}
                placeholder="12345678901234"
              />
            </div>
            <AddressAutocomplete
              label="Ajouter / modifier une adresse"
              value={addressInput}
              onChange={setAddressInput}
              onSelect={addr => setAddressData(addr)}
              placeholder="Rechercher une adresse..."
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
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
