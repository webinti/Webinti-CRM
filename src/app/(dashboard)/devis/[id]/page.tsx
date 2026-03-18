import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { quotes, quoteItems, companies, contacts, settings, addresses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDateLong, QUOTE_STATUS_LABELS } from '@/lib/utils'
import { Building2, User, Calendar, ArrowLeft, FileText } from 'lucide-react'
import { QuoteActions } from './quote-actions'

async function getQuote(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id))
  if (!quote) return null

  const [items, appSettings] = await Promise.all([
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder),
    db.select().from(settings).where(eq(settings.id, 'default')),
  ])

  const company = quote.companyId
    ? (await db.select().from(companies).where(eq(companies.id, quote.companyId)))[0]
    : null
  const contact = quote.contactId
    ? (await db.select().from(contacts).where(eq(contacts.id, quote.contactId)))[0]
    : null
  const billingAddress = company
    ? (await db.select().from(addresses).where(and(eq(addresses.companyId, company.id), eq(addresses.type, 'billing'))))[0] ?? null
    : null

  return { quote, items, company, contact, billingAddress, settings: appSettings[0] }
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getQuote(id)
  if (!data) notFound()

  const { quote, items, company, contact, billingAddress, settings: appSettings } = data
  const legalMention = appSettings?.legalMention ?? 'TVA non applicable, art. 293 B du CGI'

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={quote.number} subtitle="Devis" />

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Link href="/devis" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
              <ArrowLeft size={14} /> Retour
            </Link>
            <div className="flex items-center gap-3">
              <Badge status={quote.status}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
              <QuoteActions
                quoteId={quote.id}
                currentStatus={quote.status}
                defaultEmail={contact?.email ?? company?.email ?? ''}
                defaultName={contact ? `${contact.firstName} ${contact.lastName}` : company?.name ?? ''}
              />
            </div>
          </div>

          {/* Document */}
          <Card>
            <CardContent className="p-8">
              {/* Header document */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                      <span className="text-white font-black text-xs">W</span>
                    </div>
                    <span className="font-bold text-[#f1f5f9]">Webinti</span>
                  </div>
                  {appSettings?.ownerName && <p className="text-sm text-[#94a3b8]">{appSettings.ownerName}</p>}
                  {appSettings?.address && <p className="text-sm text-[#64748b]">{appSettings.address}</p>}
                  {appSettings?.email && <p className="text-sm text-[#64748b]">{appSettings.email}</p>}
                  {appSettings?.siret && <p className="text-xs text-[#475569]">SIRET: {appSettings.siret}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black gradient-text">{quote.number}</h2>
                  <p className="text-sm text-[#64748b] mt-1">Émis le {formatDateLong(quote.createdAt)}</p>
                  {quote.validUntil && (
                    <p className="text-sm text-[#64748b]">Valide jusqu'au {formatDateLong(quote.validUntil)}</p>
                  )}
                </div>
              </div>

              {/* Client */}
              {(company || contact) && (
                <div style={{ marginBottom: 32, padding: 16, borderRadius: 8, background: '#1a1a28', border: '1px solid #252538' }}>
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-3">Destinataire</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      {company && <p className="font-semibold text-[#f1f5f9]">{company.name}</p>}
                      {company?.siret && <p className="text-xs text-[#475569] font-mono mt-0.5">SIRET : {company.siret}</p>}
                      {company?.vatNumber && <p className="text-xs text-[#475569] font-mono">TVA : {company.vatNumber}</p>}
                      {contact && <p className="text-sm text-[#94a3b8] mt-1">{contact.firstName} {contact.lastName}{contact.jobTitle ? ` — ${contact.jobTitle}` : ''}</p>}
                    </div>
                    <div>
                      {billingAddress && (
                        <div className="text-sm text-[#64748b]">
                          <p>{billingAddress.street}</p>
                          <p>{billingAddress.postalCode} {billingAddress.city}</p>
                          <p>{billingAddress.country}</p>
                        </div>
                      )}
                      {company?.email && <p className="text-sm text-[#64748b] mt-1">{company.email}</p>}
                      {company?.phone && <p className="text-sm text-[#64748b]">{company.phone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {quote.subject && (
                <div className="mb-6">
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">Objet</p>
                  <p className="text-[#f1f5f9] font-medium">{quote.subject}</p>
                </div>
              )}

              {/* Items table */}
              <div style={{ border: '1px solid #252538', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #252538', background: '#1a1a28' }}>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Description</th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider w-20">Qté</th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider w-24">Unité</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider w-28">Prix HT</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider w-28">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id} style={i < items.length - 1 ? { borderBottom: '1px solid #1e1e30' } : {}}>
                        <td className="px-4 py-3 text-[#f1f5f9]">{item.description}</td>
                        <td className="px-3 py-3 text-center text-[#94a3b8]">{item.quantity}</td>
                        <td className="px-3 py-3 text-center text-[#64748b] text-xs">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-[#94a3b8]">{formatCurrency(item.unitPrice, quote.currency as 'EUR' | 'USD')}</td>
                        <td className="px-4 py-3 text-right font-medium text-[#f1f5f9]">{formatCurrency(item.total, quote.currency as 'EUR' | 'USD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Sous-total HT</span>
                    <span className="text-[#f1f5f9]">{formatCurrency(quote.subtotal, quote.currency as 'EUR' | 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>TVA</span>
                    <span>N/A</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid #252538' }}>
                    <span className="text-[#f1f5f9]">Total</span>
                    <span className="gradient-text">{formatCurrency(quote.total, quote.currency as 'EUR' | 'USD')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div style={{ padding: 16, borderRadius: 8, background: '#1a1a28', border: '1px solid #1e1e30' }}>
                  <p style={{ fontSize: 13, color: '#9898b8', whiteSpace: 'pre-wrap' }}>{quote.notes}</p>
                </div>
              )}

              {/* Legal */}
              <p className="text-xs text-[#5e5e7a] mt-6 pt-4 text-center" style={{ borderTop: '1px solid #1e1e30' }}>
                {legalMention}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
