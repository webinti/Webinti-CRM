'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Plus, Search, MoreHorizontal, Trash2, Edit3, Activity, CheckCircle2, Clock, AlertCircle, Power } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type Agent = {
  id: string
  name: string
  role: string
  description?: string | null
  avatar?: string | null
  status: 'active' | 'idle' | 'offline' | 'error'
  capabilities: string[]
  totalTasks: number
  successfulTasks: number
  lastSeenAt?: string | null
  createdAt: string
}

type Activity = {
  id: string
  agentId: string
  agentName: string
  type: string
  title: string
  description?: string | null
  entityType?: string | null
  entityId?: string | null
  status: string
  duration?: number | null
  createdAt: string
}

const AGENT_ROLES = [
  { id: 'scraper', name: 'Scraper', icon: '🔍', description: 'Recherche et extraction de données' },
  { id: 'analyst', name: 'Analyste', icon: '📊', description: 'Analyse et qualification des leads' },
  { id: 'writer', name: 'Rédacteur', icon: '✍️', description: 'Rédaction de emails et contenus' },
  { id: 'developer', name: 'Développeur', icon: '💻', description: 'Développement et intégration' },
  { id: 'support', name: 'Support', icon: '🎧', description: 'Support client et assistance' },
]

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<Agent | null>(null)
  const [form, setForm] = useState({ name: '', role: '', description: '', capabilities: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'agents' | 'activity'>('agents')

  const fetchAgents = async () => {
    const res = await fetch('/api/agents')
    const data = await res.json()
    setAgents(data)
    setLoading(false)
  }

  const fetchActivities = async () => {
    const res = await fetch('/api/activities')
    const data = await res.json()
    setActivities(data)
  }

  useEffect(() => {
    fetchAgents()
    fetchActivities()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capabilities: form.capabilities.split(',').map(c => c.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      toast.success('Agent créé')
      setShowCreate(false)
      setForm({ name: '', role: '', description: '', capabilities: '' })
      fetchAgents()
    } else {
      toast.error('Erreur lors de la création')
    }
    setSaving(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showEdit) return
    setSaving(true)
    const res = await fetch(`/api/agents/${showEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capabilities: form.capabilities.split(',').map(c => c.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      toast.success('Agent mis à jour')
      setShowEdit(null)
      fetchAgents()
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'agent "${name}" ?`)) return
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    toast.success('Agent supprimé')
    fetchAgents()
  }

  const openEdit = (agent: Agent) => {
    setShowEdit(agent)
    setForm({
      name: agent.name,
      role: agent.role,
      description: agent.description || '',
      capabilities: agent.capabilities?.join(', ') || '',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={14} style={{ color: '#7ee5aa' }} />
      case 'idle': return <Clock size={14} style={{ color: '#fbbf24' }} />
      case 'error': return <AlertCircle size={14} style={{ color: '#f87171' }} />
      default: return <Power size={14} style={{ color: '#5e5e7a' }} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'idle': return 'Inactif'
      case 'error': return 'Erreur'
      default: return 'Hors ligne'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'code_change': return '💻'
      case 'deploy': return '🚀'
      case 'bug_fix': return '🐛'
      case 'feature_add': return '✨'
      case 'data_update': return '📊'
      case 'config_change': return '⚙️'
      default: return '📝'
    }
  }

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Agents IA"
        subtitle={`${agents.length} agent(s) · ${activities.length} activité(s)`}
        action={{ label: 'Nouvel agent', onClick: () => setShowCreate(true) }}
      />

      {/* Tabs */}
      <div className="px-3 sm:px-6 -mb-4">
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #252538' }}>
          <button
            onClick={() => setActiveTab('agents')}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'agents' ? '#f0f0ff' : '#5e5e7a',
              borderBottom: activeTab === 'agents' ? '2px solid #7ee5aa' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={14} /> Agents
            </span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'activity' ? '#f0f0ff' : '#5e5e7a',
              borderBottom: activeTab === 'activity' ? '2px solid #7ee5aa' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} /> Activité
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6 space-y-4">
        {activeTab === 'agents' ? (
          <>
            {/* Search */}
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5e5e7a' }} />
              <input
                type="text"
                placeholder="Rechercher un agent..."
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

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-10 text-[#475569] text-sm">Chargement...</div>
              ) : filteredAgents.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-2 py-10">
                  <Bot size={48} className="text-[#2d3148]" />
                  <p className="text-[#475569] text-sm">Aucun agent. <button onClick={() => setShowCreate(true)} className="text-[#6366f1] hover:underline">Créer le premier</button></p>
                </div>
              ) : (
                filteredAgents.map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ 
                      background: '#13131e', 
                      border: '1px solid #252538', 
                      borderRadius: 12, 
                      padding: 20,
                      position: 'relative'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: 'linear-gradient(135deg, #6366f1, #7ee5aa)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24
                        }}>
                          {AGENT_ROLES.find(r => r.id === agent.role)?.icon || '🤖'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f0f0ff', margin: 0 }}>{agent.name}</h3>
                          <p style={{ fontSize: 12, color: '#5e5e7a', margin: '2px 0 0' }}>
                            {AGENT_ROLES.find(r => r.id === agent.role)?.name || agent.role}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-[#1e1e30] text-[#5e5e7a] hover:text-[#9898b8] transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEdit(agent)}>
                            <Edit3 size={14} /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => handleDelete(agent.id, agent.name)}>
                            <Trash2 size={14} /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p style={{ fontSize: 13, color: '#9898b8', marginBottom: 12, minHeight: 36 }}>
                      {agent.description || AGENT_ROLES.find(r => r.id === agent.role)?.description || 'Agent IA'}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      {getStatusIcon(agent.status)}
                      <span style={{ fontSize: 12, color: '#9898b8' }}>{getStatusLabel(agent.status)}</span>
                    </div>

                    {agent.capabilities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {agent.capabilities.slice(0, 3).map((cap, idx) => (
                          <span key={idx} style={{ 
                            fontSize: 10, padding: '3px 8px', borderRadius: 4, 
                            background: '#1a1a28', color: '#9898b8', border: '1px solid #252538'
                          }}>
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 12, borderTop: '1px solid #252538', marginTop: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 60, height: 6, background: '#1a1a28', borderRadius: 3, overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${agent.totalTasks > 0 ? (agent.successfulTasks / agent.totalTasks) * 100 : 0}%`,
                            height: '100%',
                            background: '#7ee5aa',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{agent.successfulTasks}/{agent.totalTasks}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#5e5e7a' }}>
                        {agent.lastSeenAt ? formatDate(agent.lastSeenAt) : 'Jamais'}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Activity Tab */
          <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                  <TableHead>Activité</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableEmpty>
                    <div className="flex flex-col items-center gap-2">
                      <Activity size={32} className="text-[#2d3148]" />
                      <p className="text-[#475569]">Aucune activité enregistrée</p>
                    </div>
                  </TableEmpty>
                ) : (
                  activities.map((activity, i) => (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="table-row-hover"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 16 }}>{getActivityIcon(activity.type)}</span>
                          <div>
                            <span className="font-medium text-[#f1f5f9] text-sm">{activity.title}</span>
                            {activity.description && (
                              <p className="text-xs text-[#64748b]">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[#9898b8]">{activity.agentName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[#64748b]">
                          {activity.entityType ? `${activity.entityType} #${activity.entityId?.slice(0, 6)}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'success' ? 'success' : activity.status === 'failed' ? 'danger' : 'muted'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[#64748b]">{formatDate(activity.createdAt)}</span>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent title="Créer un agent IA">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Nom de l'agent *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Scraper Pro"
              required
            />
            <div className="space-y-2">
              <label className="text-sm text-[#9898b8]">Rôle *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                required
                style={{
                  width: '100%', height: 36, padding: '0 12px',
                  borderRadius: 8, border: '1px solid #252538', background: '#0d0d14',
                  fontSize: 13, color: '#f0f0ff', outline: 'none'
                }}
              >
                <option value="">Choisir un rôle</option>
                {AGENT_ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.icon} {role.name}</option>
                ))}
              </select>
            </div>
            <Textarea
              label="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ce que fait cet agent..."
              rows={3}
            />
            <Input
              label="Capacités (séparées par des virgules)"
              value={form.capabilities}
              onChange={e => setForm({ ...form, capabilities: e.target.value })}
              placeholder="scraping, analyse, rédaction..."
            />
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={saving}>Créer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent title="Modifier l'agent">
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              label="Nom de l'agent *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="space-y-2">
              <label className="text-sm text-[#9898b8]">Rôle *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                required
                style={{
                  width: '100%', height: 36, padding: '0 12px',
                  borderRadius: 8, border: '1px solid #252538', background: '#0d0d14',
                  fontSize: 13, color: '#f0f0ff', outline: 'none'
                }}
              >
                <option value="">Choisir un rôle</option>
                {AGENT_ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.icon} {role.name}</option>
                ))}
              </select>
            </div>
            <Textarea
              label="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <Input
              label="Capacités (séparées par des virgules)"
              value={form.capabilities}
              onChange={e => setForm({ ...form, capabilities: e.target.value })}
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
    </div>
  )
}