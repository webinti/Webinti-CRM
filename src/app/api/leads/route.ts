import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads } from '@/lib/db/schema'
import { eq, desc, asc, like, or, and, gte, lt } from 'drizzle-orm'
import { verifyAuth } from '@/lib/api-auth'

const PRIORITY_MAP: Record<string, number> = { high: 70, medium: 40, low: 0 }
const PRIORITY_REVERSE: Record<string, [number, number]> = {
  high: [70, 101],
  medium: [40, 70],
  low: [0, 40],
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  try {
    const sortColumn = sortBy === 'companyName' ? leads.companyName :
                       sortBy === 'priority' ? leads.priority :
                       sortBy === 'status' ? leads.status :
                       leads.createdAt

    const conditions = []

    if (search) {
      conditions.push(or(
        like(leads.companyName, `%${search}%`),
        like(leads.city, `%${search}%`),
        like(leads.email, `%${search}%`),
        like(leads.phone, `%${search}%`)
      ))
    }

    if (status) {
      conditions.push(eq(leads.status, status as any))
    }

    if (priority && PRIORITY_REVERSE[priority]) {
      const [min, max] = PRIORITY_REVERSE[priority]
      conditions.push(and(gte(leads.priority, min), lt(leads.priority, max)))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const results = await db.select().from(leads)
      .where(where)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const priority = typeof body.priority === 'string'
      ? ((PRIORITY_MAP[body.priority]) ?? (parseInt(body.priority) || 50))
      : (body.priority || 50)

    // websiteIssues : accepte string JSON ou array
    let websiteIssues: string[] | null = null
    if (body.websiteIssues) {
      if (Array.isArray(body.websiteIssues)) {
        websiteIssues = body.websiteIssues
      } else if (typeof body.websiteIssues === 'string') {
        try {
          const parsed = JSON.parse(body.websiteIssues)
          websiteIssues = Array.isArray(parsed) ? parsed : [body.websiteIssues]
        } catch {
          websiteIssues = [body.websiteIssues]
        }
      }
    }

    // hasWebsite : accepte string "true"/"false" ou boolean
    const hasWebsite = typeof body.hasWebsite === 'string'
      ? body.hasWebsite === 'true'
      : Boolean(body.hasWebsite)

    // websiteScore : accepte string ou number
    const websiteScore = body.websiteScore != null
      ? parseInt(String(body.websiteScore)) || null
      : null

    // Dédoublonnage par SIREN : update si déjà existant
    const siren = body.siren || null
    if (siren) {
      const [existing] = await db.select({ id: leads.id }).from(leads)
        .where(eq(leads.siren, siren)).limit(1)

      if (existing) {
        const [updated] = await db.update(leads).set({
          websiteScore,
          websiteIssues,
          hasWebsite,
          priority,
          updatedAt: new Date(),
        }).where(eq(leads.id, existing.id)).returning()

        return NextResponse.json(updated, { status: 200 })
      }
    }

    const [lead] = await db.insert(leads).values({
      siren,
      siret: body.siret || null,
      companyName: body.companyName,
      legalForm: body.legalForm || null,
      nafCode: body.nafCode || null,
      nafLabel: body.nafLabel || null,
      address: body.address || null,
      postalCode: body.postalCode || null,
      city: body.city || null,
      department: body.department || null,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      hasWebsite,
      websiteScore,
      websiteIssues,
      websiteScreenshot: body.websiteScreenshot || null,
      decisionMaker: body.decisionMaker || null,
      decisionMakerEmail: body.decisionMakerEmail || null,
      decisionMakerLinkedin: body.decisionMakerLinkedin || null,
      status: body.status || 'new',
      priority,
      notes: body.notes || null,
      source: body.source || (auth.isApi ? 'api_gouv' : 'manual'),
      sourceDetails: body.sourceDetails || null,
    }).returning()

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur lors de la création du lead', details: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID du lead requis' }, { status: 400 })
    }

    if (typeof updates.priority === 'string') {
      updates.priority = PRIORITY_MAP[updates.priority] ?? 50
    }

    const updateData: any = { ...updates, updatedAt: new Date() }

    if (updates.status === 'contacted' && !updates.contactedAt) {
      updateData.contactedAt = new Date()
    }

    const [lead] = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning()

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du lead' }, { status: 500 })
  }
}
