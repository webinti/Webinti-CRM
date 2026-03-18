import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quotes, quoteItems, companies, contacts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'refused', 'expired']).optional(),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  currency: z.enum(['EUR', 'USD']).optional(),
  subject: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  sentAt: z.string().optional().nullable(),
  signedAt: z.string().optional().nullable(),
  signatureData: z.string().optional().nullable(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    unit: z.string().default('forfait'),
  })).optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id))
  if (!quote) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const [items, company, contact] = await Promise.all([
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder),
    quote.companyId ? db.select().from(companies).where(eq(companies.id, quote.companyId)) : Promise.resolve([]),
    quote.contactId ? db.select().from(contacts).where(eq(contacts.id, quote.contactId)) : Promise.resolve([]),
  ])

  return NextResponse.json({
    ...quote,
    items,
    company: company[0] ?? null,
    contact: contact[0] ?? null,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })

  const { items, ...quoteFields } = parsed.data

  const updateData: any = { ...quoteFields, updatedAt: new Date() }
  if (quoteFields.validUntil) updateData.validUntil = new Date(quoteFields.validUntil)
  else if (quoteFields.validUntil === null) updateData.validUntil = null
  if (quoteFields.sentAt) updateData.sentAt = new Date(quoteFields.sentAt)
  if (quoteFields.signedAt) updateData.signedAt = new Date(quoteFields.signedAt)

  // If items provided, replace them all and recalculate totals
  if (items && items.length > 0) {
    const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)
    updateData.subtotal = subtotal.toFixed(2)
    updateData.total = subtotal.toFixed(2)

    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id))
    await db.insert(quoteItems).values(
      items.map((item, i) => ({
        quoteId: id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toFixed(2),
        total: (item.quantity * item.unitPrice).toFixed(2),
        unit: item.unit,
        sortOrder: i,
      }))
    )
  }

  const [updated] = await db.update(quotes).set(updateData).where(eq(quotes.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  await db.delete(quotes).where(eq(quotes.id, id))
  return NextResponse.json({ ok: true })
}
