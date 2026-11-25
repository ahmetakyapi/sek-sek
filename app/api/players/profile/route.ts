import { NextResponse, type NextRequest } from 'next/server'
import { loadProfile } from '@/lib/profileServer'
import { LIMITS, hit, ipKey, tooMany } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/**
 * GET ?name=<yolcu> → { profile } (salt okunur): `/oyuncu/<ad>` sayfasının gösterdiği veri, oyun içi yolcu ayrıntısı
 * (Skor Tablosu) için. Yazma yok; yalnız herkese açık sayfadaki bilgiler döner. IP başına saatte sınırlı.
 */
export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get('name') ?? '').trim()
  if (!name || name.length > 32) return NextResponse.json({ error: 'Geçersiz yolcu adı' }, { status: 400 })
  const wait = await hit(LIMITS.profile, ipKey(req))
  if (wait) return tooMany(wait, 'Çok fazla profil açıldı, biraz sonra tekrar dene')
  try {
    const profile = await loadProfile(name)
    if (!profile) return NextResponse.json({ error: 'Bu adla bir yolcu yok' }, { status: 404 })
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'public, max-age=20, s-maxage=30' } })
  } catch {
    return NextResponse.json({ error: 'Profil şu an alınamadı' }, { status: 503 })
  }
}
