'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Mail, Phone, MoreHorizontal, Trash2, Eye, Edit2, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type Contact = {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  role?: string | null
  jobTitle?: string | null
  isPrimary: boolean
  companyId?: string | null
  createdAt: string
}

type Company = { id: string; name: string }

const ROLE_LABELS: Record<string, string> = {
  billing: 'Facturation',
  technical: 'Technique',
  commercial: 'Commercial',
  general: 'Général',
  other: 'Autre',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'general', jobTitle: '', companyId: '', notes: '', isPrimary: false,
  })
  const [saving, setSaving] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', role: 'general', companyId: '', notes: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/contacts').then(r => r.json()),
      fetch('/api/societes').then(r => r.json()),
    ]).then(([cts, cos]) => {
      setContacts(cts.map((row: any) => row.contact ?? row))
      setCompanies(cos)
      setLoading(false)
    })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, companyId: form.companyId || null }),
    })
    if (res.ok) {
      toast.success('Contact créé')
      setShowCreate(false)
      const updated = await fetch('/api/contacts').then(r => r.json())
      setContacts(updated.map((row: any) => row.contact ?? row))
    } else {
      toast.error('Erreur lors de la création')
    }
    setSaving(false)
  }

  const openEdit = (contact: Contact) => {
    setEditContact(contact)
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      jobTitle: contact.jobTitle ?? '',
      role: contact.role ?? 'general',
      companyId: contact.companyId ?? '',
      notes: '',
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContact) return
    setSaving(true)
    const res = await fetch(`/api/contacts/${editContact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, companyId: editForm.companyId || null }),
    })
    if (res.ok) {
      toast.success('Contact mis à jour')
      setEditContact(null)
      const updated = await fetch('/api/contacts').then(r => r.json())
      setContacts(updated.map((row: any) => row.contact ?? row))
    } else {
      toast.error('Erreur lors de la modification')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    toast.success('Contact supprimé')
    setContacts(c => c.filter(x => x.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Contacts"
        subtitle={`${contacts.length} contact(s)`}
        action={{ label: 'Nouveau contact', onClick: () => setShowCreate(true) }}
      />

      <div className="flex-1 p-6">
        <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                <TableHead>Contact</TableHead>
                <TableHead>Société</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Ajouté le</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty><span className="text-[#475569]">Chargement...</span></TableEmpty>
              ) : contacts.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <Users size={32} className="text-[#2d3148]" />
                    <p>Aucun contact. <button onClick={() => setShowCreate(true)} className="text-[#6366f1] hover:underline">Créer le premier</button></p>
                  </div>
                </TableEmpty>
              ) : (
                contacts.map((contact, i) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row-hover"
                  >
                    <TableCell>
                      <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 group">
                        <Avatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                        <div>
                          <p className="font-medium text-[#f1f5f9] group-hover:text-[#818cf8] transition-colors">{contact.firstName} {contact.lastName}</p>
                          {contact.jobTitle && <p className="text-xs text-[#64748b]">{contact.jobTitle}</p>}
                        </div>
                        {contact.isPrimary && <Badge variant="primary" className="text-[10px]">Principal</Badge>}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {contact.companyId ? (
                        <Link href={`/societes/${contact.companyId}`} className="text-[#6366f1] hover:text-[#818cf8] text-sm transition-colors">
                          {companies.find(c => c.id === contact.companyId)?.name ?? '—'}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {contact.role ? (
                        <Badge variant="muted">{ROLE_LABELS[contact.role] ?? contact.role}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {contact.email && <span className="text-xs text-[#64748b] flex items-center gap-1"><Mail size={10} />{contact.email}</span>}
                        {contact.phone && <span className="text-xs text-[#64748b] flex items-center gap-1"><Phone size={10} />{contact.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(contact.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-[#1e1e30] text-[#5e5e7a] hover:text-[#9898b8] transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/contacts/${contact.id}`} className="flex items-center gap-2">
                              <Eye size={14} /> Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(contact)}>
                            <Edit2 size={14} /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => handleDelete(contact.id, `${contact.firstName} ${contact.lastName}`)}>
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

      {/* Edit Dialog */}
      <Dialog open={!!editContact} onOpenChange={v => !v && setEditContact(null)}>
        <DialogContent title="Modifier le contact">
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom *" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
              <Input label="Nom *" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              <PhoneInput label="Téléphone" value={editForm.phone} onChange={v => setEditForm({ ...editForm, phone: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Poste" value={editForm.jobTitle} onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9898b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rôle</label>
                <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
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
              <Select value={editForm.companyId} onValueChange={v => setEditForm({ ...editForm, companyId: v })}>
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent title="Nouveau contact">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Jean" required />
              <Input label="Nom *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@acme.fr" />
              <PhoneInput label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Poste" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder="Directeur financier" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Rôle</label>
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
              <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Société</label>
              <Select value={form.companyId} onValueChange={v => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une société" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={saving}>Créer le contact</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
