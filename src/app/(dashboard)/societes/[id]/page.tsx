import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { companies, contacts, addresses, quotes, invoices } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@/lib/utils'
import { Building2, Mail, Phone, Globe, MapPin, User, FileText, Receipt, ExternalLink } from 'lucide-react'
import { SocieteActions } from './societe-actions'
import { CopyField } from '@/components/ui/copy-field'

async function getCompany(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [company] = await db.select().from(companies).where(eq(companies.id, id))
  if (!company) return null

  const [companyContacts, companyAddresses, companyQuotes, companyInvoices] = await Promise.all([
    db.select().from(contacts).where(eq(contacts.companyId, id)),
    db.select().from(addresses).where(eq(addresses.companyId, id)),
    db.select().from(quotes).where(eq(quotes.companyId, id)).orderBy(desc(quotes.createdAt)).limit(5),
    db.select().from(invoices).where(eq(invoices.companyId, id)).orderBy(desc(invoices.createdAt)).limit(5),
  ])

  return { company, contacts: companyContacts, addresses: companyAddresses, quotes: companyQuotes, invoices: companyInvoices }
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCompany(id)
  if (!data) notFound()

  const { company, contacts: cts, addresses: addrs, quotes: qts, invoices: invs } = data

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={company.name} subtitle="Fiche société" />

      <div className="flex-1 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/societes" style={{ fontSize: 13, color: '#5e5e7a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Toutes les sociétés
          </Link>
          <SocieteActions company={company} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Main info */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={company.name} size="lg" />
                  <div>
                    <h2 className="font-semibold text-[#f1f5f9]">{company.name}</h2>
                    {company.siret && (
                      <p className="text-xs text-[#64748b] font-mono mt-0.5">SIRET: {company.siret}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {company.email && (
                    <CopyField
                      href={`mailto:${company.email}`}
                      icon={<Mail size={14} />}
                      value={company.email}
                    />
                  )}
                  {company.phone && (
                    <CopyField
                      href={`tel:${company.phone}`}
                      icon={<Phone size={14} />}
                      value={company.phone}
                    />
                  )}
                  {company.website && (
                    <CopyField
                      href={company.website}
                      icon={<Globe size={14} />}
                      value={company.website}
                      label={company.website.replace(/^https?:\/\//, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      suffix={<ExternalLink size={11} style={{ flexShrink: 0, marginLeft: 'auto' }} />}
                    />
                  )}
                </div>

                {company.notes && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e1e30' }}>
                    <p className="text-xs text-[#64748b] mb-1 uppercase tracking-wider font-medium">Notes</p>
                    <p className="text-sm text-[#94a3b8] whitespace-pre-wrap">{company.notes}</p>
                  </div>
                )}

                <p className="text-xs text-[#5e5e7a] mt-4 pt-4" style={{ borderTop: '1px solid #1e1e30' }}>
                  Créée le {formatDate(company.createdAt)}
                </p>
              </CardContent>
            </Card>

            {/* Adresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin size={14} style={{ color: '#7ee5aa' }} />
                  Adresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addrs.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#5e5e7a' }}>Aucune adresse enregistrée</p>
                ) : (
                  <div className="space-y-3">
                    {addrs.map((addr) => {
                      const mapsQuery = encodeURIComponent(`${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.country}`)
                      return (
                        <div key={addr.id} style={{ fontSize: 13 }}>
                          <p style={{ fontSize: 10, color: '#5e5e7a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            {addr.type === 'billing' ? 'Facturation' : addr.type === 'shipping' ? 'Livraison' : 'Autre'}
                          </p>
                          <p style={{ color: '#9898b8' }}>{addr.street}</p>
                          <p style={{ color: '#9898b8' }}>{addr.postalCode} {addr.city}</p>
                          <p style={{ color: '#5e5e7a' }}>{addr.country}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: '#7ee5aa', textDecoration: 'none' }}
                          >
                            <MapPin size={11} /> Voir sur Google Maps →
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Contacts, Devis, Factures */}
          <div className="lg:col-span-2 space-y-4">
            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User size={14} style={{ color: '#7ee5aa' }} />
                  Contacts ({cts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cts.length === 0 ? (
                  <p className="text-sm text-[#475569]">Aucun contact</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cts.map((c) => (
                      <Link key={c.id} href={`/contacts/${c.id}`} className="contact-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, background: '#1a1a28', border: '1px solid #252538', textDecoration: 'none' }}>
                        <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#f1f5f9]">{c.firstName} {c.lastName}</p>
                          {c.jobTitle && <p className="text-xs text-[#64748b]">{c.jobTitle}</p>}
                          {c.email && <p className="text-xs text-[#64748b] truncate">{c.email}</p>}
                          {c.isPrimary && <Badge variant="primary" className="mt-1 text-[10px] px-1.5 py-0">Principal</Badge>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Devis récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText size={14} style={{ color: '#7ee5aa' }} />
                  Devis récents
                </CardTitle>
                <Link href={`/devis?company=${company.id}`} className="text-xs text-[#6366f1] hover:text-[#818cf8]">
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
                <Link href={`/factures?company=${company.id}`} className="text-xs text-[#6366f1] hover:text-[#818cf8]">
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
