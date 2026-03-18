import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quotes, quoteItems, companies, contacts, settings } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateDocumentNumber } from '@/lib/utils'

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  unit: z.string().default('forfait'),
  productId: z.string().uuid().optional().nullable(),
})

const quoteSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  subject: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rows = await db
    .select({
      quote: quotes,
      company: { id: companies.id, name: companies.name },
    })
    .from(quotes)
    .leftJoin(companies, eq(quotes.companyId, companies.id))
    .orderBy(desc(quotes.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = quoteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Get settings for numbering
  const [appSettings] = await db.select().from(settings).where(eq(settings.id, 'default'))
  const prefix = appSettings?.quotePrefix ?? 'DEV'
  const counter = appSettings?.quoteCounter ?? 1
  const number = generateDocumentNumber(prefix, counter)

  // Compute totals
  const items = parsed.data.items
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const total = subtotal

  const { items: itemsData, ...quoteData } = parsed.data

  const [quote] = await db.insert(quotes).values({
    ...quoteData,
    number,
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
    validUntil: quoteData.validUntil ? new Date(quoteData.validUntil) : null,
  }).returning()

  // Insert items
  await db.insert(quoteItems).values(
    itemsData.map((item, idx) => ({
      quoteId: quote.id,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPrice: item.unitPrice.toFixed(2),
      unit: item.unit,
      total: (item.quantity * item.unitPrice).toFixed(2),
      sortOrder: idx,
      productId: item.productId,
    }))
  )

  // Increment counter
  if (appSettings) {
    await db.update(settings)
      .set({ quoteCounter: counter + 1 })
      .where(eq(settings.id, 'default'))
  }

  return NextResponse.json(quote, { status: 201 })
}
