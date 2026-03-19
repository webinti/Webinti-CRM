import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { verifyAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const departement = params.get('departement')
  const codePostal = params.get('code_postal')
  const codeNaf = params.get('code_naf')
  const nafPrefix = params.get('naf_prefix')
  const q = params.get('q')
  const page = Math.max(1, parseInt(params.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') || '25')))
  const offset = (page - 1) * perPage

  const conditions: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (departement) {
    conditions.push(`departement = $${paramIndex++}`)
    values.push(departement)
  }

  if (codePostal) {
    conditions.push(`code_postal = $${paramIndex++}`)
    values.push(codePostal)
  }

  if (codeNaf) {
    conditions.push(`code_naf = $${paramIndex++}`)
    values.push(codeNaf)
  }

  if (nafPrefix) {
    conditions.push(`code_naf LIKE $${paramIndex++}`)
    values.push(`${nafPrefix}%`)
  }

  if (q) {
    conditions.push(`(raison_sociale ILIKE $${paramIndex} OR enseigne ILIKE $${paramIndex})`)
    values.push(`%${q}%`)
    paramIndex++
  }

  if (conditions.length === 0) {
    return NextResponse.json(
      { error: 'Au moins un filtre requis : departement, code_postal, code_naf, naf_prefix, q' },
      { status: 400 }
    )
  }

  const whereClause = conditions.join(' AND ')

  const countResult = await db.execute(
    sql.raw(`SELECT COUNT(*) as total FROM sirene_etablissements WHERE ${whereClause}`)
  )
  const total = parseInt((countResult[0] as { total: string }).total)

  const dataResult = await db.execute(
    sql.raw(
      `SELECT siret, siren, raison_sociale, enseigne, adresse, code_postal, ville, departement, code_naf, date_creation, tranche_effectifs
       FROM sirene_etablissements
       WHERE ${whereClause}
       ORDER BY raison_sociale ASC
       LIMIT ${perPage} OFFSET ${offset}`
    )
  )

  return NextResponse.json({
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
    results: dataResult,
  })
}
