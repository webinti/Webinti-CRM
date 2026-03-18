import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, accounts } from '../src/lib/db/schema'

import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  await db.delete(accounts)
  await db.delete(users)
  console.log('✅ Utilisateurs et comptes supprimés')
  process.exit(0)
}
main().catch(console.error)
