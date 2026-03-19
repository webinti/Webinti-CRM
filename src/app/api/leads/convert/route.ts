import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { leads, companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId))
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.convertedToCompanyId) {
      return NextResponse.json({ error: 'Lead already converted' }, { status: 400 })
    }

    const [company] = await db.insert(companies).values({
      name: lead.companyName,
      siret: lead.siret,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      notes: lead.notes,
      addressStreet: lead.address || '',
      addressCity: lead.city || '',
      addressPostalCode: lead.postalCode || '',
      addressCountry: 'France',
    }).returning()

    await db.update(leads)
      .set({
        status: 'converted',
        convertedToCompanyId: company.id,
        convertedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))

    return NextResponse.json({ success: true, company })
  } catch (error) {
    console.error('Error converting lead:', error)
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 })
  }
}