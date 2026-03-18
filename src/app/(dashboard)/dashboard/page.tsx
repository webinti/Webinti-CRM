import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quotes, invoices, depositInvoices, companies, contacts } from '@/lib/db/schema'
import { count, sum, eq, desc } from 'drizzle-orm'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@/lib/utils'
import {
  Building2, Users, FileText, Receipt,
  TrendingUp, Wallet, Clock, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const [
    [companiesCount],
    [contactsCount],
    [quotesCount],
    [invoicesStats],
    recentQuotes,
    recentInvoices,
  ] = await Promise.all([
    db.select({ count: count() }).from(companies),
    db.select({ count: count() }).from(contacts),
    db.select({ count: count() }).from(quotes),
    db.select({
      total: count(),
      totalAmount: sum(invoices.total),
    }).from(invoices),
    db.select({
      id: quotes.id,
      number: quotes.number,
      status: quotes.status,
      total: quotes.total,
      createdAt: quotes.createdAt,
    }).from(quotes).orderBy(desc(quotes.createdAt)).limit(5),
    db.select({
      id: invoices.id,
      number: invoices.number,
      status: invoices.status,
      total: invoices.total,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    }).from(invoices).orderBy(desc(invoices.createdAt)).limit(5),
  ])

  return {
    companies: companiesCount.count,
    contacts: contactsCount.count,
    quotes: quotesCount.count,
    invoicesTotal: invoicesStats.totalAmount ?? '0',
    invoicesCount: invoicesStats.total,
    recentQuotes,
    recentInvoices,
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const data = await getDashboardData()

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Tableau de bord" subtitle={`${greeting}, ${firstName} 👋`} />

      <div className="flex-1 p-3 sm:p-6 space-y-6 animate-fade-in-up">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Sociétés"
            value={data.companies}
            icon={<Building2 size={18} />}
          />
          <StatCard
            title="Contacts"
            value={data.contacts}
            icon={<Users size={18} />}
          />
          <StatCard
            title="Devis"
            value={data.quotes}
            icon={<FileText size={18} />}
          />
          <StatCard
            title="CA Facturé"
            value={formatCurrency(data.invoicesTotal)}
            subtitle={`${data.invoicesCount} facture(s)`}
            icon={<TrendingUp size={18} />}
          />
        </div>

        {/* Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Devis récents */}
          <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #252538' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={14} style={{ color: '#7ee5aa' }} />
                <h2 style={{ fontSize: 13, fontWeight: 600, color: '#ededed', margin: 0 }}>Derniers devis</h2>
              </div>
              <Link href="/devis" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>
                Voir tout →
              </Link>
            </div>

            <div>
              {data.recentQuotes.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: '#52525b' }}>
                  Aucun devis pour l'instant
                </div>
              ) : (
                data.recentQuotes.map((q) => (
                  <Link
                    key={q.id}
                    href={`/devis/${q.id}`}
                    className="table-row-hover"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1e1e30', textDecoration: 'none' }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#f0f0ff', margin: 0 }}>{q.number}</p>
                      <p style={{ fontSize: 11, color: '#5e5e7a', marginTop: 2 }}>{formatDate(q.createdAt)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff' }}>
                        {formatCurrency(q.total)}
                      </span>
                      <Badge status={q.status}>
                        {QUOTE_STATUS_LABELS[q.status]}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Factures récentes */}
          <div style={{ background: '#13131e', border: '1px solid #252538', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #252538' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={14} style={{ color: '#7ee5aa' }} />
                <h2 style={{ fontSize: 13, fontWeight: 600, color: '#ededed', margin: 0 }}>Dernières factures</h2>
              </div>
              <Link href="/factures" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>
                Voir tout →
              </Link>
            </div>

            <div>
              {data.recentInvoices.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: '#52525b' }}>
                  Aucune facture pour l'instant
                </div>
              ) : (
                data.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/factures/${inv.id}`}
                    className="table-row-hover"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1e1e30', textDecoration: 'none' }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#f0f0ff', margin: 0 }}>{inv.number}</p>
                      <p style={{ fontSize: 11, color: '#5e5e7a', marginTop: 2 }}>
                        {inv.dueDate ? `Échéance : ${formatDate(inv.dueDate)}` : formatDate(inv.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff' }}>
                        {formatCurrency(inv.total)}
                      </span>
                      <Badge status={inv.status}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
