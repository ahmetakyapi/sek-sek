import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { NAME_ERR, PASS_ERR, cleanName, clearSessionCookie, closeSession, cookieSession, hashPassword, nameKey, nameTaken, openSession, setSessionCookie, validName, validPassword, verifyPlayer } from '@/lib/players'
import { LIMITS, hit, ipKey, playerKey, tooMany } from '@/lib/rateLimit'
import { crossSite, crossSiteError } from '@/lib/sameOrigin'
import { players } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
type Body = Record<string, unknown> | null

/** GET ?name=  → kullanıcı adı boşta mı (I/ı/İ/i ve büyük/küçük harf farkı da çakışma sayılır) */
export async function GET(req: NextRequest) {
  const name = cleanName(req.nextUrl.searchParams.get('name'))
  if (!validName(name)) return NextResponse.json({ available: false, reason: NAME_ERR })
  try {
    return NextResponse.json({ available: !(await nameTaken(name)) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return bad('Şu an kontrol edilemiyor', 503)
  }
}

/** POST {name, password} → üye ol: { id, name, token } */
export async function POST(req: NextRequest) {
  if (crossSite(req)) return crossSiteError()
  const body = (await req.json().catch(() => null)) as Body
  const name = cleanName(body?.name)
  const password = body?.password
  if (!validName(name)) return bad(NAME_ERR)
  if (!validPassword(password)) return bad(PASS_ERR)
  const wait = await hit(LIMITS.signup, ipKey(req))
  if (wait) return tooMany(wait, 'Bu bağlantıdan çok fazla hesap açıldı, biraz sonra tekrar dene')
  try {
    if (await nameTaken(name)) return bad('Bu kullanıcı adı alınmış, başka bir ad dene', 409)
    const passwordHash = await hashPassword(password)
    const row = (await db().insert(players).values({ name, nameKey: nameKey(name), passwordHash }).returning({ id: players.id }))[0]
    const token = await openSession(row.id)
    return setSessionCookie(NextResponse.json({ id: row.id, name, token }), row.id, token)
  } catch {
    return bad('Hesap açılamadı, birazdan tekrar dene', 503)
  }
}

/** PATCH {id, token, name} → kullanıcı adını değiştir (oyuncu başına saatte 10) */
export async function PATCH(req: NextRequest) {
  if (crossSite(req)) return crossSiteError()
  const body = (await req.json().catch(() => null)) as Body
  const name = cleanName(body?.name)
  if (!validName(name)) return bad(NAME_ERR)
  try {
    const me = await verifyPlayer(body?.id, body?.token)
    if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
    const wait = await hit(LIMITS.rename, playerKey(me.id))
    if (wait) return tooMany(wait, 'Adını çok sık değiştirdin, biraz sonra tekrar dene')
    if (await nameTaken(name, me.id)) return bad('Bu kullanıcı adı alınmış, başka bir ad dene', 409)
    await db().update(players).set({ name, nameKey: nameKey(name) }).where(eq(players.id, me.id))
    return NextResponse.json({ id: me.id, name })
  } catch {
    return bad('Ad değiştirilemedi', 503)
  }
}

/** DELETE {id, token} → bu cihazın oturumunu kapat (çerez de silinir) */
export async function DELETE(req: NextRequest) {
  if (crossSite(req)) return crossSiteError()
  const body = (await req.json().catch(() => null)) as Body
  const c = cookieSession(req)
  try {
    await closeSession(body?.id ?? c?.id, body?.token ?? c?.token)
  } catch {
    /* oturum zaten yoksa da çıkış sayılır */
  }
  return clearSessionCookie(NextResponse.json({ ok: true }))
}
