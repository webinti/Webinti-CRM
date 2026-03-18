import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { invoices, invoiceItems, companies, contacts, settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDateLong, INVOICE_STATUS_LABELS } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { InvoiceActions } from './invoice-actions'

async function getInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) return null

  const [items, appSettings] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder),
    db.select().from(settings).where(eq(settings.id, 'default')),
  ])

  const company = invoice.companyId
    ? (await db.select().from(companies).where(eq(companies.id, invoice.companyId)))[0]
    : null
  const contact = invoice.contactId
    ? (await db.select().from(contacts).where(eq(contacts.id, invoice.contactId)))[0]
    : null

  return { invoice, items, company, contact, settings: appSettings[0] }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getInvoice(id)
  if (!data) notFound()

  const { invoice, items, company, contact, settings: appSettings } = data
  const legalMention = appSettings?.legalMention ?? 'TVA non applicable, art. 293 B du CGI'

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={invoice.number} subtitle="Facture" />

      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <Link href="/factures" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors">
              <ArrowLeft size={14} /> Retour
            </Link>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Badge status={invoice.status}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
              <InvoiceActions
                invoiceId={invoice.id}
                currentStatus={invoice.status}
                stripePaymentLinkUrl={invoice.stripePaymentLinkUrl}
              />
            </div>
          </div>

          {/* Payment link banner */}
          {invoice.stripePaymentLinkUrl && invoice.status !== 'paid' && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20">
              <div>
                <p className="text-sm font-medium text-[#818cf8]">Lien de paiement Stripe actif</p>
                <p className="text-xs text-[#6366f1] mt-0.5 truncate">{invoice.stripePaymentLinkUrl}</p>
              </div>
              <a href={invoice.stripePaymentLinkUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#6366f1] hover:text-[#818cf8] border border-[#6366f1]/30 rounded-lg px-3 py-1.5 hover:bg-[#6366f1]/10 transition-colors">
                Ouvrir →
              </a>
            </div>
          )}

          {invoice.paidAt && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm text-emerald-400 font-medium">
                Payée le {formatDateLong(invoice.paidAt)}
              </p>
            </div>
          )}

          {/* Document */}
          <Card>
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
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
                <div className="sm:text-right">
                  <h2 className="text-2xl font-black gradient-text">{invoice.number}</h2>
                  <p className="text-sm text-[#64748b] mt-1">Émise le {formatDateLong(invoice.createdAt)}</p>
                  {invoice.dueDate && (
                    <p className={`text-sm mt-0.5 ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-400' : 'text-[#64748b]'}`}>
                      Échéance: {formatDateLong(invoice.dueDate)}
                    </p>
                  )}
                </div>
              </div>

              {(company || contact) && (
                <div style={{ marginBottom: 32, padding: 16, borderRadius: 8, background: '#1a1a28', border: '1px solid #252538' }}>
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">Facturer à</p>
                  {company && <p className="font-semibold text-[#f1f5f9]">{company.name}</p>}
                  {contact && <p className="text-sm text-[#94a3b8]">{contact.firstName} {contact.lastName}</p>}
                  {company?.email && <p className="text-sm text-[#64748b]">{company.email}</p>}
                </div>
              )}

              {invoice.subject && (
                <div className="mb-6">
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">Objet</p>
                  <p className="text-[#f1f5f9] font-medium">{invoice.subject}</p>
                </div>
              )}

              <div style={{ border: '1px solid #252538', borderRadius: 8, overflow: 'hidden', overflowX: 'auto', marginBottom: 24 }}>
                <table className="w-full text-sm" style={{ minWidth: 480 }}>
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
                        <td className="px-4 py-3 text-right text-[#94a3b8]">{formatCurrency(item.unitPrice, invoice.currency as 'EUR' | 'USD')}</td>
                        <td className="px-4 py-3 text-right font-medium text-[#f1f5f9]">{formatCurrency(item.total, invoice.currency as 'EUR' | 'USD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#64748b]">Sous-total HT</span><span className="text-[#f1f5f9]">{formatCurrency(invoice.subtotal, invoice.currency as 'EUR' | 'USD')}</span></div>
                  <div className="flex justify-between text-xs text-[#475569]"><span>TVA</span><span>N/A</span></div>
                  <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid #252538' }}><span className="text-[#f0f0ff]">Total</span><span className="gradient-text">{formatCurrency(invoice.total, invoice.currency as 'EUR' | 'USD')}</span></div>
                </div>
              </div>

              {/* RIB */}
              {(appSettings?.iban || appSettings?.bankName) && (
                <div style={{ padding: 16, borderRadius: 8, background: '#1a1a28', border: '1px solid #1e1e30', marginBottom: 16 }}>
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">Coordonnées bancaires</p>
                  {appSettings.bankName && <p className="text-sm text-[#94a3b8]">Banque: {appSettings.bankName}</p>}
                  {appSettings.iban && <p className="text-sm font-mono text-[#94a3b8]">IBAN: {appSettings.iban}</p>}
                  {appSettings.bic && <p className="text-sm font-mono text-[#94a3b8]">BIC: {appSettings.bic}</p>}
                </div>
              )}

              {invoice.notes && (
                <div style={{ padding: 16, borderRadius: 8, background: '#1a1a28', border: '1px solid #1e1e30' }}>
                  <p style={{ fontSize: 13, color: '#9898b8', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
                </div>
              )}

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
