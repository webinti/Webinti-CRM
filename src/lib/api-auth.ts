import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function verifyAuth(request: NextRequest) {
  const apiToken = process.env.API_TOKEN
  if (apiToken) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${apiToken}`) {
      return { isApi: true, user: null }
    }
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return null
  }

  return { isApi: false, user: session.user }
}
