import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { depositInvoices, companies, settings } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateDocumentNumber } from '@/lib/utils'

const depositSchema = z.object({
  quoteId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  percentage: z.number().min(1).max(100).default(30),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rows = await db
    .select({
      deposit: depositInvoices,
      company: { id: companies.id, name: companies.name },
    })
    .from(depositInvoices)
    .leftJoin(companies, eq(depositInvoices.companyId, companies.id))
    .orderBy(desc(depositInvoices.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = depositSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const [appSettings] = await db.select().from(settings).where(eq(settings.id, 'default'))
  const prefix = appSettings?.depositPrefix ?? 'ACP'
  const counter = appSettings?.depositCounter ?? 1
  const number = generateDocumentNumber(prefix, counter)

  const [deposit] = await db.insert(depositInvoices).values({
    ...parsed.data,
    number,
    percentage: parsed.data.percentage.toFixed(2),
    amount: parsed.data.amount.toFixed(2),
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
  }).returning()

  if (appSettings) {
    await db.update(settings)
      .set({ depositCounter: counter + 1 })
      .where(eq(settings.id, 'default'))
  }

  return NextResponse.json(deposit, { status: 201 })
}
