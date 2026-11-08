import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { NAME_ERR, NAME_RE, PASS_ERR, cleanName, closeSession, findByName, hashPassword, nameKey, openSession, validPassword, verifyPlayer } from '@/lib/players'
import { players } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
type Body = Record<string, unknown> | null

/** GET ?name=  → kullanıcı adı boşta mı */
export async function GET(req: NextRequest) {
  const name = cleanName(req.nextUrl.searchParams.get('name'))
  if (!NAME_RE.test(name)) return NextResponse.json({ available: false, reason: NAME_ERR })
  try {
    return NextResponse.json({ available: !(await findByName(name)) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return bad('Şu an kontrol edilemiyor', 503)
  }
}

/** POST {name, password} → üye ol: { id, name, token } */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body
  const name = cleanName(body?.name)
  const password = body?.password
  if (!NAME_RE.test(name)) return bad(NAME_ERR)
  if (!validPassword(password)) return bad(PASS_ERR)
  try {
    if (await findByName(name)) return bad('Bu kullanıcı adı alınmış, başka bir ad dene', 409)
    const passwordHash = await hashPassword(password)
    const row = (await db().insert(players).values({ name, nameKey: nameKey(name), passwordHash }).returning({ id: players.id }))[0]
    return NextResponse.json({ id: row.id, name, token: await openSession(row.id) })
  } catch {
    return bad('Hesap açılamadı, birazdan tekrar dene', 503)
  }
}

/** PATCH {id, token, name} → kullanıcı adını değiştir */
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body
  const name = cleanName(body?.name)
  if (!NAME_RE.test(name)) return bad(NAME_ERR)
  try {
    const me = await verifyPlayer(body?.id, body?.token)
    if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
    const other = await findByName(name)
    if (other && other.id !== me.id) return bad('Bu kullanıcı adı alınmış, başka bir ad dene', 409)
    await db().update(players).set({ name, nameKey: nameKey(name) }).where(eq(players.id, me.id))
    return NextResponse.json({ id: me.id, name })
  } catch {
    return bad('Ad değiştirilemedi', 503)
  }
}

/** DELETE {id, token} → bu cihazın oturumunu kapat */
export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body
  try {
    await closeSession(body?.id, body?.token)
  } catch {
    /* oturum zaten yoksa da çıkış sayılır */
  }
  return NextResponse.json({ ok: true })
}
