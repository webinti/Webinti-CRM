'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function NewQuoteButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push('/devis/nouveau')}>
      <Plus size={14} />
      Nouveau devis
    </Button>
  )
}
