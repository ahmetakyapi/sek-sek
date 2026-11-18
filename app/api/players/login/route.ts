import { NextResponse, type NextRequest } from 'next/server'
import { checkPasswordOrDummy, cleanName, findByName, nameKey, openSession, setSessionCookie } from '@/lib/players'
import { LIMITS, hit, ipKey, nameRateKey, tooMany } from '@/lib/rateLimit'
import { crossSite, crossSiteError } from '@/lib/sameOrigin'

export const dynamic = 'force-dynamic'

const WRONG = 'Kullanıcı adı ya da şifre yanlış'

/** POST {name, password} → giriş: { id, name, token } (bu cihaz için yeni oturum) */
export async function POST(req: NextRequest) {
  // başka siteden giriş (login CSRF): kurbanın tarayıcısına saldırganın oturumu kurulmasın
  if (crossSite(req)) return crossSiteError()
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const name = cleanName(body?.name)
  const password = body?.password
  if (!name || name.length > 32 || typeof password !== 'string' || password.length > 64) return NextResponse.json({ error: WRONG }, { status: 401 })
  // şifre deneme sınırı: IP başına ve ad başına (başka IP'lerden aynı hesaba saldırı da sayılır)
  const wait = Math.max((await hit(LIMITS.loginIp, ipKey(req))) ?? 0, (await hit(LIMITS.loginName, nameRateKey(nameKey(name)))) ?? 0)
  if (wait) return tooMany(wait)
  try {
    const row = await findByName(name)
    // ad yoksa da scrypt çalışır: yanıt süresi adın kayıtlı olup olmadığını söylemez
    if (!(await checkPasswordOrDummy(password, row?.passwordHash)) || !row) return NextResponse.json({ error: WRONG }, { status: 401 })
    const token = await openSession(row.id)
    return setSessionCookie(NextResponse.json({ id: row.id, name: row.name, token }), row.id, token)
  } catch {
    return NextResponse.json({ error: 'Giriş yapılamadı, birazdan tekrar dene' }, { status: 503 })
  }
}
