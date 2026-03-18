import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { invoices, companies } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { formatCurrency, formatDate, INVOICE_STATUS_LABELS } from '@/lib/utils'
import { Receipt } from 'lucide-react'
import { NewInvoiceButton } from './new-invoice-button'

async function getInvoices() {
  const rows = await db
    .select({
      invoice: invoices,
      company: { id: companies.id, name: companies.name },
    })
    .from(invoices)
    .leftJoin(companies, eq(invoices.companyId, companies.id))
    .orderBy(desc(invoices.createdAt))

  return rows
}

export default async function FacturesPage() {
  await auth.api.getSession({ headers: await headers() })
  const rows = await getInvoices()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Factures" subtitle={`${rows.length} facture(s)`} />

      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex justify-end">
          <NewInvoiceButton />
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-2">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Receipt size={32} className="text-[#2d3148]" />
              <p className="text-[#475569] text-sm">Aucune facture</p>
            </div>
          ) : (
            rows.map(({ invoice, company }) => (
              <Link
                key={invoice.id}
                href={`/factures/${invoice.id}`}
                style={{ display: 'block', padding: '14px 16px', borderRadius: 10, background: '#13131e', border: '1px solid #252538', textDecoration: 'none' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold text-[#f1f5f9] text-sm">{invoice.number}</span>
                  <Badge status={invoice.status}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
                </div>
                {company?.name && <p className="text-sm text-[#6366f1] mb-1">{company.name}</p>}
                {invoice.subject && <p className="text-xs text-[#94a3b8] truncate mb-2">{invoice.subject}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#f1f5f9]">{formatCurrency(invoice.total, invoice.currency as 'EUR' | 'USD')}</span>
                  <span className="text-xs text-[#64748b]">
                    {invoice.dueDate ? `Échéance ${formatDate(invoice.dueDate)}` : formatDate(invoice.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #252538' }}>
                <TableHead>Numéro</TableHead>
                <TableHead>Société</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <Receipt size={32} className="text-[#2d3148]" />
                    <p className="text-[#475569]">Aucune facture</p>
                  </div>
                </TableEmpty>
              ) : (
                rows.map(({ invoice, company }) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link href={`/factures/${invoice.id}`} className="font-mono font-semibold text-[#f1f5f9] hover:text-[#818cf8] transition-colors">
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {company?.name ? (
                        <Link href={`/societes/${company.id}`} className="text-[#6366f1] hover:text-[#818cf8] transition-colors text-sm">
                          {company.name}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-[#94a3b8] max-w-[180px] truncate">
                      {invoice.subject ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge status={invoice.status}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-[#f1f5f9]">
                      {formatCurrency(invoice.total, invoice.currency as 'EUR' | 'USD')}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate ? (
                        <span className={new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-400' : 'text-[#94a3b8]'}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
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
