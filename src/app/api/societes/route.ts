import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, addresses } from '@/lib/db/schema'
import { ilike, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(1),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string(),
    country: z.string().default('France'),
  }).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('search') ?? ''

  const rows = await db
    .select()
    .from(companies)
    .where(search ? ilike(companies.name, `%${search}%`) : undefined)
    .orderBy(desc(companies.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { address, ...companyData } = body
  const parsed = companySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const [company] = await db.insert(companies).values(companyData).returning()

  if (address?.street && address?.city) {
    await db.insert(addresses).values({
      companyId: company.id,
      type: 'billing',
      street: address.street,
      city: address.city,
      postalCode: address.postalCode ?? '',
      country: address.country ?? 'France',
    })
  }

  return NextResponse.json(company, { status: 201 })
}
