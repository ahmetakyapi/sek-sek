import { NextResponse, type NextRequest } from 'next/server'
import { cookieSession, setSessionCookie, verifyPlayer } from '@/lib/players'

export const dynamic = 'force-dynamic'

/**
 * GET → çerezdeki oturumun sahibi: { id, name, token } ya da { player: null }.
 * Yerel deposu silinmiş tarayıcı bununla girişini geri alır; çerez her çağrıda bir yıl daha uzar.
 */
export async function GET(req: NextRequest) {
  const c = cookieSession(req)
  if (!c) return NextResponse.json({ player: null }, { headers: { 'Cache-Control': 'no-store' } })
  try {
    const me = await verifyPlayer(c.id, c.token)
    if (!me) return NextResponse.json({ player: null }, { headers: { 'Cache-Control': 'no-store' } })
    const res = NextResponse.json({ player: { id: me.id, name: me.name, token: c.token } }, { headers: { 'Cache-Control': 'no-store' } })
    return setSessionCookie(res, me.id, c.token)
  } catch {
    return NextResponse.json({ error: 'Şu an doğrulanamıyor' }, { status: 503 })
  }
}

/**
 * POST { id, token } → yerel depoda oturumu olan (çerezden önceki) tarayıcıya çerezi kurar.
 * Anahtar doğrulanmadan çerez konmaz.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: unknown; token?: unknown } | null
  try {
    const me = await verifyPlayer(body?.id, body?.token)
    if (!me) return NextResponse.json({ player: null }, { status: 401 })
    return setSessionCookie(NextResponse.json({ player: { id: me.id, name: me.name } }), me.id, body!.token as string)
  } catch {
    return NextResponse.json({ error: 'Şu an doğrulanamıyor' }, { status: 503 })
  }
}
