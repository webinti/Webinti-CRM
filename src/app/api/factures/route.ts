import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoices, invoiceItems, quotes, quoteItems, companies, settings } from '@/lib/db/schema'
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

const invoiceSchema = z.object({
  quoteId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  subject: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rows = await db
    .select({
      invoice: invoices,
      company: { id: companies.id, name: companies.name },
    })
    .from(invoices)
    .leftJoin(companies, eq(invoices.companyId, companies.id))
    .orderBy(desc(invoices.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = invoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [appSettings] = await db.select().from(settings).where(eq(settings.id, 'default'))
  const prefix = appSettings?.invoicePrefix ?? 'FAC'
  const counter = appSettings?.invoiceCounter ?? 1
  const number = generateDocumentNumber(prefix, counter)

  const { items: itemsData, ...invoiceData } = parsed.data
  const subtotal = itemsData.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const [invoice] = await db.insert(invoices).values({
    ...invoiceData,
    number,
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2),
    dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
  }).returning()

  await db.insert(invoiceItems).values(
    itemsData.map((item, idx) => ({
      invoiceId: invoice.id,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPrice: item.unitPrice.toFixed(2),
      unit: item.unit,
      total: (item.quantity * item.unitPrice).toFixed(2),
      sortOrder: idx,
      productId: item.productId,
    }))
  )

  if (appSettings) {
    await db.update(settings)
      .set({ invoiceCounter: counter + 1 })
      .where(eq(settings.id, 'default'))
  }

  return NextResponse.json(invoice, { status: 201 })
}
