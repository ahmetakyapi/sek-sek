import { NextResponse, type NextRequest } from 'next/server'
import { checkPassword, cleanName, findByName, openSession } from '@/lib/players'

export const dynamic = 'force-dynamic'

const WRONG = 'Kullanıcı adı ya da şifre yanlış'

/** POST {name, password} → giriş: { id, name, token } (bu cihaz için yeni oturum) */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const name = cleanName(body?.name)
  const password = body?.password
  if (!name || typeof password !== 'string' || password.length > 64) return NextResponse.json({ error: WRONG }, { status: 401 })
  try {
    const row = await findByName(name)
    if (!row || !(await checkPassword(password, row.passwordHash))) return NextResponse.json({ error: WRONG }, { status: 401 })
    return NextResponse.json({ id: row.id, name: row.name, token: await openSession(row.id) })
  } catch {
    return NextResponse.json({ error: 'Giriş yapılamadı, birazdan tekrar dene' }, { status: 503 })
  }
}
