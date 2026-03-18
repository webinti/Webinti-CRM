'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Building2, Globe, Mail, Phone, MoreHorizontal, Trash2, Eye } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AddressAutocomplete, type AddressResult } from '@/components/ui/address-autocomplete'
import { PhoneInput } from '@/components/ui/phone-input'
import { SiretLookup, type SiretResult } from '@/components/ui/siret-lookup'

type Company = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  siret?: string | null
  createdAt: string
}

export default function SocietesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', siret: '', notes: '' })
  const [addressInput, setAddressInput] = useState('')
  const [addressData, setAddressData] = useState<AddressResult | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchCompanies = async () => {
    const res = await fetch(`/api/societes${search ? `?search=${search}` : ''}`)
    const data = await res.json()
    setCompanies(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCompanies()
  }, [search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/societes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        address: addressData ? {
          street: addressData.street,
          city: addressData.city,
          postalCode: addressData.postalCode,
          country: addressData.country,
        } : undefined,
      }),
    })
    if (res.ok) {
      toast.success('Société créée')
      setShowCreate(false)
      setForm({ name: '', email: '', phone: '', website: '', siret: '', notes: '' })
      setAddressInput('')
      setAddressData(null)
      fetchCompanies()
    } else {
      toast.error('Erreur lors de la création')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await fetch(`/api/societes/${id}`, { method: 'DELETE' })
    toast.success('Société supprimée')
    fetchCompanies()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Sociétés"
        subtitle={`${companies.length} société(s)`}
        action={{ label: 'Nouvelle société', onClick: () => setShowCreate(true) }}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5e5e7a' }} />
          <input
            type="text"
            placeholder="Rechercher une société..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: 36, paddingLeft: 36, paddingRight: 16,
              borderRadius: 8, border: '1px solid #252538', background: '#0d0d14',
              fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit',
            }}
            className="placeholder:text-[#5e5e7a] focus:border-[#6366f1] transition-colors"
          />
        </div>

        {/* Table */}
        <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                <TableHead>Société</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>SIRET</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty>
                  <span className="text-[#475569]">Chargement...</span>
                </TableEmpty>
              ) : companies.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <Building2 size={32} className="text-[#2d3148]" />
                    <p>Aucune société. <button onClick={() => setShowCreate(true)} className="text-[#6366f1] hover:underline">Créer la première</button></p>
                  </div>
                </TableEmpty>
              ) : (
                companies.map((company, i) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row-hover"
                  >
                    <TableCell>
                      <Link href={`/societes/${company.id}`} className="flex items-center gap-3 group">
                        <Avatar name={company.name} size="sm" />
                        <span className="font-medium text-[#f1f5f9] group-hover:text-[#818cf8] transition-colors">
                          {company.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {company.email && (
                          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                            <Mail size={11} />
                            {company.email}
                          </span>
                        )}
                        {company.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                            <Phone size={11} />
                            {company.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-[#64748b]">{company.siret ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {formatDate(company.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-[#1e1e30] text-[#5e5e7a] hover:text-[#9898b8] transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/societes/${company.id}`} className="flex items-center gap-2">
                              <Eye size={14} /> Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => handleDelete(company.id, company.name)}>
                            <Trash2 size={14} /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent title="Nouvelle société" description="Ajoutez une nouvelle société à votre CRM">
          <form onSubmit={handleCreate} className="space-y-4">
            <SiretLookup
              label="Rechercher par SIRET ou nom (INSEE)"
              onResult={(r: SiretResult) => {
                setForm(f => ({ ...f, name: r.name, siret: r.siret }))
                if (r.address) {
                  const label = `${r.address.street}, ${r.address.postalCode} ${r.address.city}`
                  setAddressInput(label)
                  setAddressData({ label, ...r.address, lat: 0, lng: 0 })
                }
              }}
            />
            <Input
              label="Nom de la société *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ACME SAS"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@acme.fr"
              />
              <PhoneInput
                label="Téléphone"
                value={form.phone}
                onChange={v => setForm({ ...form, phone: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Site web"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://acme.fr"
              />
              <Input
                label="SIRET"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="12345678901234"
              />
            </div>
            <AddressAutocomplete
              label="Adresse"
              value={addressInput}
              onChange={setAddressInput}
              onSelect={addr => setAddressData(addr)}
              placeholder="8 rue de la Paix, 75001 Paris"
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes internes..."
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={saving}>Créer la société</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
