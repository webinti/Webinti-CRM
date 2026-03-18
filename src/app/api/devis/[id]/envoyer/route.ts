import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'
import { quotes, quoteItems, companies, contacts, settings, addresses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { formatCurrency, formatDateLong } from '@/lib/utils'

function getLogoBase64(): string {
  try {
    const logoPath = join(process.cwd(), 'public', 'logo-webinti2026.png')
    const buffer = readFileSync(logoPath)
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch {
    return ''
  }
}

function buildEmailHtml(params: {
  quote: any
  items: any[]
  company: any
  contact: any
  billingAddress: any
  appSettings: any
  recipientName: string
  logoBase64: string
}) {
  const { quote, items, company, contact, billingAddress, appSettings, recipientName, logoBase64 } = params
  const senderName = appSettings?.companyName ?? 'Webinti'
  const senderEmail = appSettings?.email ?? ''
  const legalMention = appSettings?.legalMention ?? 'TVA non applicable, art. 293 B du CGI'

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${senderName}" width="36" height="36" style="border-radius:8px;object-fit:contain;display:block;margin-bottom:10px;" />`
    : `<div style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#7ee5aa,#6366f1);margin-bottom:10px;"><span style="color:#fff;font-weight:900;font-size:14px;">W</span></div>`

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e30;color:#e2e8f0;font-size:14px;">${item.description}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e30;color:#94a3b8;font-size:14px;text-align:center;">${parseFloat(item.quantity)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e30;color:#94a3b8;font-size:14px;text-align:right;">${formatCurrency(item.unitPrice, quote.currency)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1e1e30;color:#f1f5f9;font-size:14px;text-align:right;font-weight:600;">${formatCurrency(item.total, quote.currency)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#13131e;border-radius:12px;border:1px solid #252538;overflow:hidden;">

    <!-- Gradient top bar -->
    <div style="height:3px;background:linear-gradient(90deg,#7ee5aa,#6366f1);"></div>

    <!-- Header -->
    <div style="padding:32px 40px 24px;border-bottom:1px solid #252538;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top">
            ${logoHtml}
            <p style="margin:0;font-size:15px;font-weight:700;color:#f0f0ff;">${senderName}</p>
            ${appSettings?.ownerName ? `<p style="margin:4px 0 0;font-size:13px;color:#9898b8;">${appSettings.ownerName}</p>` : ''}
            ${senderEmail ? `<p style="margin:2px 0 0;font-size:12px;color:#5e5e7a;">${senderEmail}</p>` : ''}
          </td>
          <td valign="top" align="right">
            <p style="margin:0;font-size:24px;font-weight:900;color:#7ee5aa;">${quote.number}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Émis le ${formatDateLong(quote.createdAt)}</p>
            ${quote.validUntil ? `<p style="margin:3px 0 0;font-size:12px;color:#64748b;">Valide jusqu'au ${formatDateLong(quote.validUntil)}</p>` : ''}
          </td>
        </tr>
      </table>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 40px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#9898b8;">Bonjour ${recipientName},</p>
      <p style="margin:0;font-size:14px;color:#9898b8;">Veuillez trouver ci-dessous votre devis${quote.subject ? ` concernant <strong style="color:#f0f0ff;">${quote.subject}</strong>` : ''}.</p>
    </div>

    <!-- Client box -->
    <div style="margin:24px 40px 0;padding:16px;background:#1a1a28;border-radius:8px;border:1px solid #252538;">
      <p style="margin:0 0 10px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.08em;">Destinataire</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr valign="top">
          <td width="50%">
            ${company ? `<p style="margin:0;font-size:15px;font-weight:600;color:#f1f5f9;">${company.name}</p>` : ''}
            ${company?.siret ? `<p style="margin:3px 0 0;font-size:11px;color:#475569;font-family:monospace;">SIRET : ${company.siret}</p>` : ''}
            ${company?.vatNumber ? `<p style="margin:2px 0 0;font-size:11px;color:#475569;font-family:monospace;">TVA : ${company.vatNumber}</p>` : ''}
            ${contact ? `<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${contact.firstName} ${contact.lastName}${contact.jobTitle ? ` — ${contact.jobTitle}` : ''}</p>` : ''}
          </td>
          <td width="50%" style="padding-left:16px;">
            ${billingAddress ? `
              <p style="margin:0;font-size:13px;color:#64748b;">${billingAddress.street}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${billingAddress.postalCode} ${billingAddress.city}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${billingAddress.country}</p>
            ` : ''}
            ${company?.email ? `<p style="margin:6px 0 0;font-size:12px;color:#5e5e7a;">${company.email}</p>` : ''}
            ${company?.phone ? `<p style="margin:2px 0 0;font-size:12px;color:#5e5e7a;">${company.phone}</p>` : ''}
          </td>
        </tr>
      </table>
    </div>

    <!-- Items table -->
    <div style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #252538;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#1a1a28;">
            <th style="padding:10px 16px;text-align:left;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;border-bottom:1px solid #252538;">Description</th>
            <th style="padding:10px 16px;text-align:center;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;border-bottom:1px solid #252538;width:60px;">Qté</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;border-bottom:1px solid #252538;width:110px;">Prix HT</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;border-bottom:1px solid #252538;width:110px;">Total HT</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:20px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td></td>
          <td width="240" style="padding-bottom:6px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#64748b;padding:5px 0;">Sous-total HT</td>
                <td style="font-size:13px;color:#f1f5f9;text-align:right;padding:5px 0;">${formatCurrency(quote.subtotal, quote.currency)}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#475569;padding:5px 0;">TVA</td>
                <td style="font-size:12px;color:#475569;text-align:right;padding:5px 0;">N/A</td>
              </tr>
            </table>
            <!-- Total row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #252538;margin-top:8px;">
              <tr>
                <td style="font-size:16px;font-weight:700;color:#f1f5f9;padding:12px 0 6px;">Total</td>
                <td style="font-size:16px;font-weight:700;color:#7ee5aa;text-align:right;padding:12px 0 6px;">${formatCurrency(quote.total, quote.currency)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    ${quote.notes ? `
    <!-- Notes -->
    <div style="margin:20px 40px 0;padding:14px 16px;background:#1a1a28;border-radius:8px;border:1px solid #1e1e30;">
      <p style="margin:0;font-size:13px;color:#9898b8;white-space:pre-wrap;">${quote.notes}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:28px 40px;margin-top:28px;border-top:1px solid #1e1e30;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;color:#5e5e7a;">Pour toute question, n'hésitez pas à nous contacter.</p>
      ${senderEmail ? `<a href="mailto:${senderEmail}" style="font-size:13px;color:#7ee5aa;text-decoration:none;font-weight:500;">${senderEmail}</a>` : ''}
      <p style="margin:20px 0 0;font-size:11px;color:#3a3a52;">${legalMention}</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const { recipientEmail, recipientName } = await req.json()

  if (!recipientEmail) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  if (!process.env.BREVO_API_KEY) return NextResponse.json({ error: 'BREVO_API_KEY manquante' }, { status: 500 })
  if (!process.env.BREVO_SENDER_EMAIL) return NextResponse.json({ error: 'BREVO_SENDER_EMAIL manquante' }, { status: 500 })

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id))
  if (!quote) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const [items, appSettingsRows] = await Promise.all([
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder),
    db.select().from(settings).where(eq(settings.id, 'default')),
  ])

  const company = quote.companyId
    ? (await db.select().from(companies).where(eq(companies.id, quote.companyId)))[0] ?? null
    : null
  const contact = quote.contactId
    ? (await db.select().from(contacts).where(eq(contacts.id, quote.contactId)))[0] ?? null
    : null
  const billingAddress = company
    ? (await db.select().from(addresses).where(and(eq(addresses.companyId, company.id), eq(addresses.type, 'billing'))))[0] ?? null
    : null

  const appSettings = appSettingsRows[0] ?? null
  const senderName = appSettings?.companyName ?? 'Webinti'
  const logoBase64 = getLogoBase64()

  const html = buildEmailHtml({
    quote, items, company, contact, billingAddress, appSettings, logoBase64,
    recipientName: recipientName || (contact ? `${contact.firstName} ${contact.lastName}` : company?.name ?? ''),
  })

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
      subject: `Devis ${quote.number}${quote.subject ? ` — ${quote.subject}` : ''}`,
      htmlContent: html,
    }),
  })

  if (!brevoRes.ok) {
    const err = await brevoRes.json().catch(() => ({}))
    console.error('Brevo error:', err)
    return NextResponse.json({ error: "Échec de l'envoi", details: err }, { status: 500 })
  }

  await db.update(quotes)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(quotes.id, id))

  return NextResponse.json({ ok: true })
}
