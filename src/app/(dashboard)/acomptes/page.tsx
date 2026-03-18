import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { depositInvoices, companies } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/table'
import { formatCurrency, formatDate, INVOICE_STATUS_LABELS } from '@/lib/utils'
import { Wallet } from 'lucide-react'
import { NewDepositButton } from './new-deposit-button'

async function getDeposits() {
  return db
    .select({ deposit: depositInvoices, company: { id: companies.id, name: companies.name } })
    .from(depositInvoices)
    .leftJoin(companies, eq(depositInvoices.companyId, companies.id))
    .orderBy(desc(depositInvoices.createdAt))
}

export default async function AcomptesPage() {
  await auth.api.getSession({ headers: await headers() })
  const rows = await getDeposits()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Factures d'acompte" subtitle={`${rows.length} acompte(s)`} />

      <div className="flex-1 p-3 sm:p-6 space-y-4">
        <div className="flex justify-end">
          <NewDepositButton />
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-2">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Wallet size={32} className="text-[#2d3148]" />
              <p className="text-[#475569] text-sm">Aucune facture d'acompte</p>
            </div>
          ) : (
            rows.map(({ deposit, company }) => (
              <div
                key={deposit.id}
                style={{ padding: '14px 16px', borderRadius: 10, background: '#13131e', border: '1px solid #252538' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold text-[#f1f5f9] text-sm">{deposit.number}</span>
                  <Badge status={deposit.status}>{INVOICE_STATUS_LABELS[deposit.status]}</Badge>
                </div>
                {company?.name && (
                  <Link href={`/societes/${company.id}`} className="text-sm text-[#6366f1] block mb-2">
                    {company.name}
                  </Link>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#f1f5f9]">
                    {formatCurrency(deposit.amount, deposit.currency as 'EUR' | 'USD')}
                    <span className="text-xs text-[#64748b] ml-1">({deposit.percentage}%)</span>
                  </span>
                  <span className="text-xs text-[#64748b]">
                    {deposit.dueDate ? formatDate(deposit.dueDate) : formatDate(deposit.createdAt)}
                  </span>
                </div>
              </div>
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
                <TableHead>Statut</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty>
                  <div className="flex flex-col items-center gap-2">
                    <Wallet size={32} className="text-[#2d3148]" />
                    <p className="text-[#475569]">Aucune facture d'acompte</p>
                  </div>
                </TableEmpty>
              ) : (
                rows.map(({ deposit, company }) => (
                  <TableRow key={deposit.id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-[#f1f5f9]">{deposit.number}</span>
                    </TableCell>
                    <TableCell>
                      {company?.name ? (
                        <Link href={`/societes/${company.id}`} className="text-[#6366f1] hover:text-[#818cf8] transition-colors text-sm">
                          {company.name}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge status={deposit.status}>{INVOICE_STATUS_LABELS[deposit.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-[#94a3b8]">{deposit.percentage}%</TableCell>
                    <TableCell className="font-semibold text-[#f1f5f9]">
                      {formatCurrency(deposit.amount, deposit.currency as 'EUR' | 'USD')}
                    </TableCell>
                    <TableCell>
                      {deposit.dueDate ? formatDate(deposit.dueDate) : '—'}
                    </TableCell>
                    <TableCell>{formatDate(deposit.createdAt)}</TableCell>
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
