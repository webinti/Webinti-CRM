'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function NewDepositButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push('/acomptes/nouveau')}>
      <Plus size={14} />
      Nouvel acompte
    </Button>
  )
}
