import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { quotes, companies } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from '@/lib/utils'
import { FileText, Plus } from 'lucide-react'
import { NewQuoteButton } from './new-quote-button'

async function getQuotes() {
  const rows = await db
    .select({
      quote: quotes,
      company: { id: companies.id, name: companies.name },
    })
    .from(quotes)
    .leftJoin(companies, eq(quotes.companyId, companies.id))
    .orderBy(desc(quotes.createdAt))

  return rows
}

export default async function DevisPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const rows = await getQuotes()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Devis" subtitle={`${rows.length} devis`} />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'draft', 'sent', 'accepted', 'refused', 'expired'] as const).map((status) => (
              <span key={status} />
            ))}
          </div>
          <NewQuoteButton />
        </div>

        <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                <TableHead>Numéro</TableHead>
                <TableHead>Société</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Validité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="text-[#2d3148]" />
                    <p className="text-[#475569]">Aucun devis</p>
                  </div>
                </TableEmpty>
              ) : (
                rows.map(({ quote, company }) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link href={`/devis/${quote.id}`} className="font-mono font-semibold text-[#f1f5f9] hover:text-[#818cf8] transition-colors">
                        {quote.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {company?.name ? (
                        <Link href={`/societes/${company.id}`} className="text-[#6366f1] hover:text-[#818cf8] transition-colors text-sm">
                          {company.name}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-[#94a3b8] max-w-[200px] truncate">
                      {quote.subject ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge status={quote.status}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-[#f1f5f9]">
                      {formatCurrency(quote.total, quote.currency as 'EUR' | 'USD')}
                    </TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell>
                      {quote.validUntil ? (
                        <span className={new Date(quote.validUntil) < new Date() ? 'text-red-400' : 'text-[#94a3b8]'}>
                          {formatDate(quote.validUntil)}
                        </span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
