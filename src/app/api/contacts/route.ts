import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, companies } from '@/lib/db/schema'
import { eq, desc, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const contactSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['billing', 'technical', 'commercial', 'general', 'other']).optional(),
  jobTitle: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const companyId = req.nextUrl.searchParams.get('companyId')
  const search = req.nextUrl.searchParams.get('search') ?? ''

  let query = db.select({
    contact: contacts,
    company: { id: companies.id, name: companies.name },
  })
  .from(contacts)
  .leftJoin(companies, eq(contacts.companyId, companies.id))
  .orderBy(desc(contacts.createdAt)) as any

  if (companyId) {
    query = query.where(eq(contacts.companyId, companyId))
  }

  const rows = await query
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const [contact] = await db.insert(contacts).values(parsed.data).returning()
  return NextResponse.json(contact, { status: 201 })
}
