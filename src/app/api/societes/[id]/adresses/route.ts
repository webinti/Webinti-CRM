import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addresses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping', 'other']).default('billing'),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().default(''),
  country: z.string().default('France'),
  addressId: z.string().uuid().optional(), // for updating existing
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const rows = await db.select().from(addresses).where(eq(addresses.companyId, id))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = addressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { addressId, ...data } = parsed.data

  if (addressId) {
    // Update existing address
    const [updated] = await db
      .update(addresses)
      .set(data)
      .where(eq(addresses.id, addressId))
      .returning()
    return NextResponse.json(updated)
  }

  const [address] = await db.insert(addresses).values({ ...data, companyId: id }).returning()
  return NextResponse.json(address, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const url = new URL(req.url)
  const addressId = url.searchParams.get('addressId')
  if (!addressId) return NextResponse.json({ error: 'addressId requis' }, { status: 400 })

  await db.delete(addresses).where(eq(addresses.id, addressId))
  return NextResponse.json({ ok: true })
}
