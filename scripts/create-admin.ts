/**
 * Script pour créer le compte admin initial
 * Usage: npx tsx scripts/create-admin.ts
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, accounts, settings } from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as crypto from 'crypto'

// Charger les env vars
import 'dotenv/config'

const DATABASE_URL = process.env.DATABASE_URL!
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema: { users, accounts, settings } })

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex')
}

async function main() {
  const EMAIL = 'admin@webinti.com'
  const PASSWORD = 'webinti2025'
  const NAME = 'Admin Webinti'

  console.log('🚀 Création du compte admin...')

  // Vérifier si l'utilisateur existe déjà
  const existing = await db.select().from(users).where(eq(users.email, EMAIL))
  if (existing.length > 0) {
    console.log('✅ Compte admin déjà existant:', EMAIL)
  } else {
    const userId = crypto.randomUUID()
    const hashedPassword = await hashPassword(PASSWORD)

    await db.insert(users).values({
      id: userId,
      name: NAME,
      email: EMAIL,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('✅ Compte admin créé:')
    console.log('   Email:', EMAIL)
    console.log('   Mot de passe:', PASSWORD)
    console.log('   ⚠️  Changez le mot de passe après la première connexion!')
  }

  // Initialiser les settings par défaut
  const existingSettings = await db.select().from(settings).where(eq(settings.id, 'default'))
  if (existingSettings.length === 0) {
    await db.insert(settings).values({
      id: 'default',
      companyName: 'Webinti',
      ownerName: NAME,
      email: EMAIL,
      legalMention: 'TVA non applicable, art. 293 B du CGI',
      paymentTermsDays: 30,
      quotePrefix: 'DEV',
      invoicePrefix: 'FAC',
      depositPrefix: 'ACP',
      quoteCounter: 1,
      invoiceCounter: 1,
      depositCounter: 1,
      updatedAt: new Date(),
    })
    console.log('✅ Paramètres initialisés')
  }

  console.log('\n🎉 Tout est prêt! Lancez: npm run dev')
  process.exit(0)
}

main().catch(console.error)
