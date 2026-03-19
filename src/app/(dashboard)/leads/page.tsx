'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Target, Globe, Mail, Phone, MoreHorizontal,
  Trash2, Building2, MapPin, ArrowRightLeft, Filter,
  Star
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { PhoneInput } from '@/components/ui/phone-input'

type Lead = {
  id: string
  companyName: string
  siret?: string | null
  city?: string | null
  postalCode?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  hasWebsite?: boolean | null
  websiteScore?: number | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected'
  priority: number
  decisionMaker?: string | null
  source?: string | null
  convertedToCompanyId?: string | null
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  rejected: 'Rejeté',
}

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  contacted: { bg: 'rgba(126, 229, 170, 0.15)', text: '#7ee5aa' },
  qualified: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  converted: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'rgba(94, 94, 122, 0.2)', text: '#9898b8' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
}

function priorityKey(p: number): string {
  return p >= 70 ? 'high' : p >= 40 ? 'medium' : 'low'
}

export default function LeadsPage() {
  const [leadsList, setLeadsList] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showConvert, setShowConvert] = useState<string | null>(null)
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    city: '',
    decisionMaker: '',
    decisionMakerEmail: '',
    priority: 'medium',
    notes: '',
    source: '',
  })
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)

  const fetchLeads = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeadsList(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()
  }, [search, statusFilter, priorityFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hasWebsite: !!form.website,
      }),
    })
    
    if (res.ok) {
      toast.success('Lead créé')
      setShowCreate(false)
      setForm({
        companyName: '',
        email: '',
        phone: '',
        website: '',
        city: '',
        decisionMaker: '',
        decisionMakerEmail: '',
        priority: 'medium',
        notes: '',
        source: '',
      })
      fetchLeads()
    } else {
      toast.error('Erreur lors de la création')
    }
    setSaving(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    
    if (res.ok) {
      toast.success('Statut mis à jour')
      fetchLeads()
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handlePriorityChange = async (id: string, priority: string) => {
    const res = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, priority }),
    })
    
    if (res.ok) {
      toast.success('Priorité mise à jour')
      fetchLeads()
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleConvert = async (lead: Lead) => {
    setConverting(true)
    
    try {
      const res = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success('Lead converti en société')
        setShowConvert(null)
        fetchLeads()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Erreur lors de la conversion')
      }
    } catch (error) {
      toast.error('Erreur lors de la conversion')
    }
    
    setConverting(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le lead "${name}" ?`)) return
    
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Lead supprimé')
      fetchLeads()
    } else {
      toast.error('Erreur lors de la suppression')
    }
  }

  const activeFiltersCount = (statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Prospection"
        subtitle={`${leadsList.length} lead(s)`}
        action={{ label: 'Nouveau lead', onClick: () => setShowCreate(true) }}
      />

      <div className="flex-1 p-3 sm:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5e5e7a' }} />
            <input
              type="text"
              placeholder="Rechercher un lead..."
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
          
          <div className="flex gap-2">
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger style={{ width: 140, height: 36, background: '#0d0d14', border: '1px solid #252538' }}>
                <Filter size={14} style={{ color: '#5e5e7a', marginRight: 8 }} />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="contacted">Contacté</SelectItem>
                <SelectItem value="qualified">Qualifié</SelectItem>
                <SelectItem value="converted">Converti</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter || 'all'} onValueChange={(v) => setPriorityFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger style={{ width: 140, height: 36, background: '#0d0d14', border: '1px solid #252538' }}>
                <Star size={14} style={{ color: '#5e5e7a', marginRight: 8 }} />
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setStatusFilter(undefined); setPriorityFilter(undefined) }}
                style={{
                  height: 36, padding: '0 12px',
                  borderRadius: 8, border: '1px solid #252538',
                  background: 'transparent', color: '#9898b8',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-2">
          {loading ? (
            <div className="text-center py-10 text-[#475569] text-sm">Chargement...</div>
          ) : leadsList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Target size={32} style={{ color: '#2d3148' }} />
              <p style={{ color: '#475569', fontSize: 14 }}>
                Aucun lead. <button onClick={() => setShowCreate(true)} style={{ color: '#6366f1', textDecoration: 'underline' }}>Créer le premier</button>
              </p>
            </div>
          ) : (
            leadsList.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ 
                  background: '#13131e', border: '1px solid #252538', 
                  borderRadius: 10, padding: '14px 16px' 
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: statusColors[lead.status].bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Building2 size={16} style={{ color: statusColors[lead.status].text }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#f1f5f9] text-sm truncate">{lead.companyName}</p>
                      {lead.city && (
                        <p style={{ fontSize: 12, color: '#64748b' }} className="flex items-center gap-1">
                          <MapPin size={10} /> {lead.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-[#1e1e30] text-[#5e5e7a] hover:text-[#9898b8] transition-colors flex-shrink-0">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setShowConvert(lead.id)}>
                        <ArrowRightLeft size={14} /> Convertir en client
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(lead.id, lead.companyName)} destructive>
                        <Trash2 size={14} /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                    background: statusColors[lead.status].bg, color: statusColors[lead.status].text,
                  }}>
                    {statusLabels[lead.status]}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                    background: priorityColors[priorityKey(lead.priority)].bg, color: priorityColors[priorityKey(lead.priority)].text,
                  }}>
                    {priorityLabels[priorityKey(lead.priority)]}
                  </span>
                </div>

                {(lead.email || lead.phone) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {lead.email && (
                      <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <Mail size={11} />{lead.email}
                      </span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <Phone size={11} />{lead.phone}
                      </span>
                    )}
                  </div>
                )}
                
                {lead.website && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Globe size={11} style={{ color: '#64748b' }} />
                    <a 
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}
                      className="truncate"
                    >
                      {lead.website}
                    </a>
                  </div>
                )}

                <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
                  {formatDate(lead.createdAt)}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ 
          background: '#13131e', border: '1px solid #252538', 
          borderRadius: 8, overflow: 'hidden' 
        }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                <TableHead>Entreprise</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Site web</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty>
                  <span style={{ color: '#475569' }}>Chargement...</span>
                </TableEmpty>
              ) : leadsList.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <Target size={32} style={{ color: '#2d3148' }} />
                    <p>Aucun lead. <button onClick={() => setShowCreate(true)} style={{ color: '#6366f1', textDecoration: 'underline' }}>Créer le premier</button></p>
                  </div>
                </TableEmpty>
              ) : (
                leadsList.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row-hover"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: statusColors[lead.status].bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Building2 size={14} style={{ color: statusColors[lead.status].text }} />
                        </div>
                        <div>
                          <span className="font-medium text-[#f1f5f9]">
                            {lead.companyName}
                          </span>
                          {lead.decisionMaker && (
                            <p style={{ fontSize: 11, color: '#64748b' }}>
                              {lead.decisionMaker}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.city ? (
                        <span style={{ fontSize: 13, color: '#9898b8' }} className="flex items-center gap-1">
                          <MapPin size={12} /> {lead.city} {lead.postalCode && `(${lead.postalCode})`}
                        </span>
                      ) : (
                        <span style={{ color: '#5e5e7a' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.phone ? (
                        <span style={{ fontSize: 13, color: '#9898b8' }} className="flex items-center gap-1">
                          <Phone size={12} /> {lead.phone}
                        </span>
                      ) : (
                        <span style={{ color: '#5e5e7a' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.website ? (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Globe size={12} /> {lead.website.replace(/^https?:\/\//, '').slice(0, 25)}
                          {lead.website.replace(/^https?:\/\//, '').length > 25 && '...'}
                        </a>
                      ) : (
                        <span style={{ color: '#5e5e7a' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={lead.status} 
                        onValueChange={(v) => handleStatusChange(lead.id, v)}
                      >
                        <SelectTrigger style={{ 
                          width: 120, height: 28, 
                          background: statusColors[lead.status].bg,
                          border: 'none', fontSize: 12,
                          color: statusColors[lead.status].text,
                        }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nouveau</SelectItem>
                          <SelectItem value="contacted">Contacté</SelectItem>
                          <SelectItem value="qualified">Qualifié</SelectItem>
                          <SelectItem value="converted">Converti</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={priorityKey(lead.priority)}
                        onValueChange={(v) => handlePriorityChange(lead.id, v)}
                      >
                        <SelectTrigger style={{
                          width: 100, height: 28,
                          background: priorityColors[priorityKey(lead.priority)].bg,
                          border: 'none', fontSize: 12,
                          color: priorityColors[priorityKey(lead.priority)].text,
                        }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Basse</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-[#1e1e30] text-[#5e5e7a] hover:text-[#9898b8] transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {lead.status !== 'converted' && (
                            <DropdownMenuItem onClick={() => setShowConvert(lead.id)}>
                              <ArrowRightLeft size={14} /> Convertir en client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(lead.id, lead.companyName)} destructive>
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
        <DialogContent title="Nouveau lead" description="Ajoutez un nouveau prospect à votre CRM">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Nom de l'entreprise *"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="ACME SAS"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Site web"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://acme.fr"
              />
              <Input
                label="Ville"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Paris"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Décideur"
                value={form.decisionMaker}
                onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })}
                placeholder="Jean Dupont"
              />
              <Input
                label="Email du décideur"
                type="email"
                value={form.decisionMakerEmail}
                onChange={(e) => setForm({ ...form, decisionMakerEmail: e.target.value })}
                placeholder="jean@acme.fr"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 12, color: '#9898b8', marginBottom: 6, display: 'block' }}>
                  Priorité
                </label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger style={{ height: 36, background: '#0d0d14', border: '1px solid #252538' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="LinkedIn, salon, recommandation..."
              />
            </div>
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes sur ce lead..."
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={saving}>Créer le lead</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={!!showConvert} onOpenChange={() => setShowConvert(null)}>
        <DialogContent title="Convertir en client" description="Ce lead sera converti en société client">
          {showConvert && (
            <div className="space-y-4">
              <p style={{ fontSize: 14, color: '#9898b8' }}>
                Voulez-vous convertir <strong style={{ color: '#f0f0ff' }}>
                  {leadsList.find(l => l.id === showConvert)?.companyName}
                </strong> en société cliente ?
              </p>
              <div style={{ 
                background: 'rgba(126, 229, 170, 0.1)', 
                border: '1px solid rgba(126, 229, 170, 0.3)',
                borderRadius: 8, padding: 12,
              }}>
                <p style={{ fontSize: 13, color: '#7ee5aa', margin: 0 }}>
                  Cette action va :
                </p>
                <ul style={{ fontSize: 13, color: '#9898b8', margin: '8px 0 0 16px', padding: 0 }}>
                  <li>Créer une nouvelle société</li>
                  <li>Marquer le lead comme "converti"</li>
                  <li>Créer une adresse si la ville est renseignée</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Annuler</Button>
                </DialogClose>
                <Button 
                  onClick={() => {
                    const lead = leadsList.find(l => l.id === showConvert)
                    if (lead) handleConvert(lead)
                  }}
                  loading={converting}
                >
                  Convertir en client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
