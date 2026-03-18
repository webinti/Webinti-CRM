import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoices, invoiceItems, companies, contacts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  subject: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  sentAt: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  stripePaymentLinkId: z.string().optional().nullable(),
  stripePaymentLinkUrl: z.string().optional().nullable(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const [items, company, contact] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder),
    invoice.companyId ? db.select().from(companies).where(eq(companies.id, invoice.companyId)) : Promise.resolve([]),
    invoice.contactId ? db.select().from(contacts).where(eq(contacts.id, invoice.contactId)) : Promise.resolve([]),
  ])

  return NextResponse.json({ ...invoice, items, company: company[0] ?? null, contact: contact[0] ?? null })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const updateData: any = { ...parsed.data, updatedAt: new Date() }
  if (parsed.data.dueDate) updateData.dueDate = new Date(parsed.data.dueDate)
  if (parsed.data.sentAt) updateData.sentAt = new Date(parsed.data.sentAt)
  if (parsed.data.paidAt) updateData.paidAt = new Date(parsed.data.paidAt)

  const [updated] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  await db.delete(invoices).where(eq(invoices.id, id))
  return NextResponse.json({ ok: true })
}
