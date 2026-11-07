import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { NAME_RE, cleanName, hashToken, nameKey, newToken, verifyPlayer } from '@/lib/players'
import { players } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
const NAME_ERR = 'Ad 2–16 karakter olmalı (harf, rakam, boşluk, - _ .)'

async function taken(name: string) {
  return (await db().select({ id: players.id }).from(players).where(eq(players.nameKey, nameKey(name))).limit(1))[0]
}

/** GET ?name=  → ad boşta mı */
export async function GET(req: NextRequest) {
  const name = cleanName(req.nextUrl.searchParams.get('name'))
  if (!NAME_RE.test(name)) return NextResponse.json({ available: false, reason: NAME_ERR })
  try {
    return NextResponse.json({ available: !(await taken(name)) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return bad('Şu an kontrol edilemiyor', 503)
  }
}

/** POST {name} → yeni yolcu: { id, name, token } */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const name = cleanName(body?.name)
  if (!NAME_RE.test(name)) return bad(NAME_ERR)
  try {
    if (await taken(name)) return bad('Bu ad alınmış, başka bir ad dene', 409)
    const token = newToken()
    const row = (await db().insert(players).values({ name, nameKey: nameKey(name), tokenHash: hashToken(token) }).returning({ id: players.id }))[0]
    return NextResponse.json({ id: row.id, name, token })
  } catch {
    return bad('Ad kaydedilemedi, birazdan tekrar dene', 503)
  }
}

/** PATCH {id, token, name} → adı değiştir */
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const name = cleanName(body?.name)
  if (!NAME_RE.test(name)) return bad(NAME_ERR)
  try {
    const me = await verifyPlayer(body?.id, body?.token)
    if (!me) return bad('Yolcu doğrulanamadı', 401)
    const other = await taken(name)
    if (other && other.id !== me.id) return bad('Bu ad alınmış, başka bir ad dene', 409)
    await db().update(players).set({ name, nameKey: nameKey(name) }).where(eq(players.id, me.id))
    return NextResponse.json({ id: me.id, name })
  } catch {
    return bad('Ad değiştirilemedi', 503)
  }
}
