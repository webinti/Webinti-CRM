import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: 'EUR' | 'USD' = 'EUR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string | null, pattern = 'dd/MM/yyyy') {
  if (!date) return '—'
  return format(new Date(date), pattern, { locale: fr })
}

export function formatDateLong(date: Date | string | null) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

export function generateDocumentNumber(prefix: string, counter: number, year?: number) {
  const y = year ?? new Date().getFullYear()
  return `${prefix}-${y}-${String(counter).padStart(4, '0')}`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
  expired: 'Expiré',
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  sent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  accepted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  refused: 'bg-red-500/20 text-red-300 border-red-500/30',
  expired: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  sent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}
