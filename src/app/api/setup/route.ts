import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { count } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const [{ count: userCount }] = await db.select({ count: count() }).from(users)
  return NextResponse.json({ needsSetup: userCount === 0 })
}

export async function POST(req: NextRequest) {
  // Only allow if no users exist
  const [{ count: userCount }] = await db.select({ count: count() }).from(users)
  if (userCount > 0) {
    return NextResponse.json({ error: 'Setup déjà effectué' }, { status: 403 })
  }

  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  // Use better-auth to create the user properly
  const response = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: req.headers,
  })

  return NextResponse.json({ ok: true })
}
