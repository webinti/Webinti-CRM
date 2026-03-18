'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function NewInvoiceButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push('/factures/nouvelle')}>
      <Plus size={14} />
      Nouvelle facture
    </Button>
  )
}
