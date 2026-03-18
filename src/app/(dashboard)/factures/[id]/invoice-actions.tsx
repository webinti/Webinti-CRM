'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Send, CheckCircle, XCircle, Trash2, CreditCard, Copy } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  invoiceId: string
  currentStatus: string
  stripePaymentLinkUrl?: string | null
}

export function InvoiceActions({ invoiceId, currentStatus, stripePaymentLinkUrl }: InvoiceActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string, extra?: object) => {
    setLoading(true)
    const updates: any = { status, ...extra }
    if (status === 'sent') updates.sentAt = new Date().toISOString()
    if (status === 'paid') updates.paidAt = new Date().toISOString()

    const res = await fetch(`/api/factures/${invoiceId}`, {
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
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette facture ?')) return
    await fetch(`/api/factures/${invoiceId}`, { method: 'DELETE' })
    toast.success('Facture supprimée')
    router.push('/factures')
  }

  const copyLink = () => {
    if (stripePaymentLinkUrl) {
      navigator.clipboard.writeText(stripePaymentLinkUrl)
      toast.success('Lien copié')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <MoreHorizontal size={14} />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Statut</DropdownMenuLabel>
        {currentStatus !== 'sent' && (
          <DropdownMenuItem onClick={() => updateStatus('sent')}>
            <Send size={14} /> Marquer comme envoyée
          </DropdownMenuItem>
        )}
        {currentStatus !== 'paid' && (
          <DropdownMenuItem onClick={() => updateStatus('paid')}>
            <CheckCircle size={14} /> Marquer comme payée
          </DropdownMenuItem>
        )}
        {currentStatus !== 'overdue' && (
          <DropdownMenuItem onClick={() => updateStatus('overdue')}>
            <XCircle size={14} /> Marquer en retard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Paiement</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push(`/acomptes/nouveau?invoiceId=${invoiceId}`)}>
          <CreditCard size={14} /> Créer un acompte (30%)
        </DropdownMenuItem>
        {stripePaymentLinkUrl && (
          <DropdownMenuItem onClick={copyLink}>
            <Copy size={14} /> Copier le lien Stripe
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={handleDelete}>
          <Trash2 size={14} /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
