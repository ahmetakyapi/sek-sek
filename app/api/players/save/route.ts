import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { cookieSession, verifyPlayer } from '@/lib/players'
import { saves } from '@/lib/schema'
import { cloudPart, mergeSaves, normalizeSave, type Save } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/** bulut kaydı en çok bu kadar (bayt): 25 şehrin süreleri, pul, nazar ve rozetleri birkaç KB tutar */
const MAX = 32_000

/** Oturum: çerezden, yoksa başlıktan (x-seksek-oyuncu: <id>.<anahtar>) */
async function who(req: NextRequest) {
  const c = cookieSession(req) ?? (() => {
    const [id, token] = (req.headers.get('x-seksek-oyuncu') ?? '').split('.')
    return id && token ? { id, token } : null
  })()
  return c ? verifyPlayer(c.id, c.token) : null
}

/** GET → { data, updatedAt } ya da { data: null } */
export async function GET(req: NextRequest) {
  try {
    const me = await who(req)
    if (!me) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    const row = (await db().select().from(saves).where(eq(saves.playerId, me.id)).limit(1))[0]
    return NextResponse.json({ data: row?.data ?? null, updatedAt: row?.updatedAt ?? null }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Kayıt okunamadı' }, { status: 503 })
  }
}

/** PUT { data } → hesabın ilerlemesini yazar (istemci önce birleştirir, sonra gönderir) */
export async function PUT(req: NextRequest) {
  const text = await req.text()
  if (text.length > MAX) return NextResponse.json({ error: 'Kayıt çok büyük' }, { status: 413 })
  const body = (() => {
    try {
      return JSON.parse(text) as { data?: unknown }
    } catch {
      return null
    }
  })()
  if (!body || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) return NextResponse.json({ error: 'Geçersiz kayıt' }, { status: 400 })
  try {
    const me = await who(req)
    if (!me) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    // sunucu da birleştirir: eski kaydı taşıyan bir cihaz (açık kalmış sekme, başka telefon) buluttaki ilerlemeyi geri alamaz
    const row = (await db().select().from(saves).where(eq(saves.playerId, me.id)).limit(1))[0]
    const incoming = normalizeSave({ ...(body.data as Partial<Save>), accountVersion: 2 })
    const data = row ? cloudPart(mergeSaves(incoming, normalizeSave({ ...(row.data as Partial<Save>), accountVersion: 2 }))) : body.data
    const now = new Date()
    await db()
      .insert(saves)
      .values({ playerId: me.id, data, updatedAt: now })
      .onConflictDoUpdate({ target: saves.playerId, set: { data, updatedAt: now } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Kayıt yazılamadı' }, { status: 503 })
  }
}
