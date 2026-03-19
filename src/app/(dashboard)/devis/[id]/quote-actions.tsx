'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Send, CheckCircle, XCircle, Trash2, Receipt, Wallet, Mail, Edit2, Eye } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface QuoteActionsProps {
  quoteId: string
  currentStatus: string
  defaultEmail?: string
  defaultName?: string
}

export function QuoteActions({ quoteId, currentStatus, defaultEmail = '', defaultName = '' }: QuoteActionsProps) {
  const router = useRouter()
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewSending, setPreviewSending] = useState(false)
  const [sendForm, setSendForm] = useState({ email: defaultEmail, name: defaultName })

  const updateStatus = async (status: string) => {
    const updates: any = { status }
    if (status === 'sent') updates.sentAt = new Date().toISOString()
    if (status === 'accepted') updates.signedAt = new Date().toISOString()

    const res = await fetch(`/api/devis/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (res.ok) {
      toast.success('Statut mis à jour')
      router.refresh()
    } else {
      toast.error('Erreur')
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendForm.email) return
    setSending(true)
    const res = await fetch(`/api/devis/${quoteId}/envoyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: sendForm.email, recipientName: sendForm.name }),
    })
    if (res.ok) {
      toast.success('Devis envoyé par email')
      setShowSendDialog(false)
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? "Erreur lors de l'envoi")
    }
    setSending(false)
  }

  const handleSendPreview = async () => {
    setPreviewSending(true)
    const res = await fetch(`/api/devis/${quoteId}/envoyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        recipientEmail: 'agence.webinti@gmail.com', 
        recipientName: 'Tim - Webinti',
        isPreview: true 
      }),
    })
    if (res.ok) {
      toast.success('Aperçu envoyé à agence.webinti@gmail.com')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? "Erreur lors de l'envoi")
    }
    setPreviewSending(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce devis ?')) return
    const res = await fetch(`/api/devis/${quoteId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Devis supprimé')
      router.push('/devis')
    } else {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Modifier */}
        <button
          onClick={() => router.push(`/devis/${quoteId}/modifier`)}
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

        {/* Envoyer par email — bouton principal */}
        <button
          onClick={() => setShowSendDialog(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 14px', borderRadius: 6,
            border: 'none', background: 'linear-gradient(135deg, #7ee5aa, #6366f1)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Mail size={13} /> Envoyer par email
        </button>

        {/* Autres actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <MoreHorizontal size={14} />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Aperçu</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleSendPreview} disabled={previewSending}>
              <Eye size={14} /> {previewSending ? 'Envoi...' : "M'envoyer l'aperçu"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Statut</DropdownMenuLabel>
            {currentStatus !== 'sent' && (
              <DropdownMenuItem onClick={() => updateStatus('sent')}>
                <Send size={14} /> Marquer comme envoyé
              </DropdownMenuItem>
            )}
            {currentStatus !== 'accepted' && (
              <DropdownMenuItem onClick={() => updateStatus('accepted')}>
                <CheckCircle size={14} /> Marquer comme accepté
              </DropdownMenuItem>
            )}
            {currentStatus !== 'refused' && (
              <DropdownMenuItem onClick={() => updateStatus('refused')}>
                <XCircle size={14} /> Marquer comme refusé
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Convertir</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/factures/nouvelle?quoteId=${quoteId}`)}>
              <Receipt size={14} /> Créer une facture
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/acomptes/nouveau?quoteId=${quoteId}`)}>
              <Wallet size={14} /> Créer un acompte (30%)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent title="Envoyer le devis par email">
          <form onSubmit={handleSendEmail} className="space-y-4">
            <p style={{ fontSize: 13, color: '#9898b8', margin: 0 }}>
              Le devis sera envoyé au destinataire et marqué comme <strong style={{ color: '#f0f0ff' }}>Envoyé</strong>.
            </p>
            <Input
              label="Email du destinataire *"
              type="email"
              value={sendForm.email}
              onChange={e => setSendForm({ ...sendForm, email: e.target.value })}
              placeholder="client@exemple.fr"
              required
            />
            <Input
              label="Nom du destinataire"
              value={sendForm.name}
              onChange={e => setSendForm({ ...sendForm, name: e.target.value })}
              placeholder="Jean Dupont"
            />
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
              <Button type="submit" loading={sending}>
                <Mail size={13} /> Envoyer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
