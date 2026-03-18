import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quotes, invoices, depositInvoices, companies, contacts } from '@/lib/db/schema'
import { count, sum, eq, gte, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    [quotesStats],
    [invoicesStats],
    [depositStats],
    [companiesCount],
    [contactsCount],
    recentQuotes,
    recentInvoices,
  ] = await Promise.all([
    db.select({
      total: count(),
      draft: count(eq(quotes.status, 'draft') as any),
      sent: count(eq(quotes.status, 'sent') as any),
      accepted: count(eq(quotes.status, 'accepted') as any),
    }).from(quotes),

    db.select({
      total: count(),
      totalAmount: sum(invoices.total),
      paid: count(eq(invoices.status, 'paid') as any),
      pending: count(eq(invoices.status, 'sent') as any),
      overdue: count(eq(invoices.status, 'overdue') as any),
      paidAmount: sum(eq(invoices.status, 'paid') ? invoices.total : null as any),
    }).from(invoices),

    db.select({
      total: count(),
      paidAmount: sum(depositInvoices.amount),
    }).from(depositInvoices).where(eq(depositInvoices.status, 'paid')),

    db.select({ count: count() }).from(companies),
    db.select({ count: count() }).from(contacts),

    db.select().from(quotes).orderBy(quotes.createdAt).limit(5),
    db.select().from(invoices).orderBy(invoices.createdAt).limit(5),
  ])

  return NextResponse.json({
    quotes: quotesStats,
    invoices: invoicesStats,
    deposits: depositStats,
    companies: companiesCount.count,
    contacts: contactsCount.count,
    recentQuotes,
    recentInvoices,
  })
}
