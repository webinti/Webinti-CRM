import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { contacts, companies, quotes, invoices } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@/lib/utils'
import { Mail, Phone, Briefcase, Building2, FileText, Receipt } from 'lucide-react'
import { ContactActions } from './contact-actions'
import { CopyField } from '@/components/ui/copy-field'

const ROLE_LABELS: Record<string, string> = {
  billing: 'Facturation',
  technical: 'Technique',
  commercial: 'Commercial',
  general: 'Général',
  other: 'Autre',
}

async function getContact(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id))
  if (!contact) return null

  const [company, contactQuotes, contactInvoices] = await Promise.all([
    contact.companyId
      ? db.select().from(companies).where(eq(companies.id, contact.companyId)).then(r => r[0] ?? null)
      : Promise.resolve(null),
    db.select().from(quotes).where(eq(quotes.contactId, id)).orderBy(desc(quotes.createdAt)).limit(5),
    db.select().from(invoices).where(eq(invoices.contactId, id)).orderBy(desc(invoices.createdAt)).limit(5),
  ])

  return { contact, company, quotes: contactQuotes, invoices: contactInvoices }
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getContact(id)
  if (!data) notFound()

  const { contact, company, quotes: qts, invoices: invs } = data

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={`${contact.firstName} ${contact.lastName}`} subtitle="Fiche contact" />

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/contacts" style={{ fontSize: 13, color: '#5e5e7a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Tous les contacts
          </Link>
          <ContactActions contact={contact} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={`${contact.firstName} ${contact.lastName}`} size="lg" />
                  <div>
                    <h2 className="font-semibold text-[#f1f5f9]">{contact.firstName} {contact.lastName}</h2>
                    {contact.jobTitle && (
                      <p className="text-xs text-[#64748b] mt-0.5">{contact.jobTitle}</p>
                    )}
                    {contact.isPrimary && (
                      <Badge variant="primary" className="mt-1 text-[10px] px-1.5 py-0">Principal</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {contact.email && (
                    <CopyField
                      href={`mailto:${contact.email}`}
                      icon={<Mail size={14} />}
                      value={contact.email}
                    />
                  )}
                  {contact.phone && (
                    <CopyField
                      href={`tel:${contact.phone}`}
                      icon={<Phone size={14} />}
                      value={contact.phone}
                    />
                  )}
                  {contact.role && (
                    <div className="flex items-center gap-2.5">
                      <Briefcase size={14} style={{ color: '#5e5e7a' }} />
                      <Badge variant="muted">{ROLE_LABELS[contact.role] ?? contact.role}</Badge>
                    </div>
                  )}
                </div>

                {company && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e1e30' }}>
                    <p className="text-xs text-[#64748b] mb-2 uppercase tracking-wider font-medium">Société</p>
                    <Link href={`/societes/${company.id}`} className="flex items-center gap-2.5 text-sm text-[#94a3b8] hover:text-[#818cf8] transition-colors group">
                      <Building2 size={14} className="text-[#5e5e7a] group-hover:text-[#7ee5aa]" />
                      {company.name}
                    </Link>
                  </div>
                )}

                {contact.notes && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e1e30' }}>
                    <p className="text-xs text-[#64748b] mb-1 uppercase tracking-wider font-medium">Notes</p>
                    <p className="text-sm text-[#94a3b8] whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}

                <p className="text-xs text-[#5e5e7a] mt-4 pt-4" style={{ borderTop: '1px solid #1e1e30' }}>
                  Créé le {formatDate(contact.createdAt)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Devis, Factures */}
          <div className="lg:col-span-2 space-y-4">
            {/* Devis récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText size={14} style={{ color: '#7ee5aa' }} />
                  Devis récents
                </CardTitle>
                <Link href={`/devis?contact=${contact.id}`} className="text-xs text-[#6366f1] hover:text-[#818cf8]">
                  Voir tout →
                </Link>
              </CardHeader>
              <CardContent>
                {qts.length === 0 ? (
                  <p className="text-sm text-[#475569]">Aucun devis</p>
                ) : (
                  <div className="space-y-2">
                    {qts.map((q) => (
                      <Link key={q.id} href={`/devis/${q.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1a28] transition-colors group">
                        <div>
                          <p className="text-sm font-medium text-[#f1f5f9] group-hover:text-[#818cf8]">{q.number}</p>
                          <p className="text-xs text-[#64748b]">{formatDate(q.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{formatCurrency(q.total)}</span>
                          <Badge status={q.status}>{QUOTE_STATUS_LABELS[q.status]}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Factures récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Receipt size={14} style={{ color: '#7ee5aa' }} />
                  Factures récentes
                </CardTitle>
                <Link href={`/factures?contact=${contact.id}`} className="text-xs text-[#6366f1] hover:text-[#818cf8]">
                  Voir tout →
                </Link>
              </CardHeader>
              <CardContent>
                {invs.length === 0 ? (
                  <p className="text-sm text-[#475569]">Aucune facture</p>
                ) : (
                  <div className="space-y-2">
                    {invs.map((inv) => (
                      <Link key={inv.id} href={`/factures/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1a28] transition-colors group">
                        <div>
                          <p className="text-sm font-medium text-[#f1f5f9] group-hover:text-[#818cf8]">{inv.number}</p>
                          <p className="text-xs text-[#64748b]">{formatDate(inv.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{formatCurrency(inv.total)}</span>
                          <Badge status={inv.status}>{INVOICE_STATUS_LABELS[inv.status]}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
