import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const nullish = z.string().nullish().transform(v => v ?? undefined)
const settingsSchema = z.object({
  companyName: nullish,
  ownerName: nullish,
  email: z.string().email().optional().or(z.literal('')).or(z.null()).transform(v => v ?? ''),
  phone: nullish,
  address: nullish,
  siret: nullish,
  iban: nullish,
  bic: nullish,
  bankName: nullish,
  quotePrefix: nullish,
  invoicePrefix: nullish,
  depositPrefix: nullish,
  legalMention: nullish,
  paymentTermsDays: z.union([z.number(), z.string()]).transform(v => Number(v)).optional(),
  logoUrl: nullish,
}).passthrough()

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [row] = await db.select().from(settings).where(eq(settings.id, 'default'))

  if (!row) {
    // Init default settings
    const [created] = await db.insert(settings).values({ id: 'default' }).returning()
    return NextResponse.json(created)
  }

  return NextResponse.json(row)
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })

  const [existing] = await db.select().from(settings).where(eq(settings.id, 'default'))

  if (!existing) {
    const [created] = await db.insert(settings).values({ id: 'default', ...parsed.data }).returning()
    return NextResponse.json(created)
  }

  const [updated] = await db
    .update(settings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(settings.id, 'default'))
    .returning()

  return NextResponse.json(updated)
}
