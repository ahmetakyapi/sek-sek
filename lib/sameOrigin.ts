/**
 * CSRF önlemi: veri değiştiren her API ucu (POST, PUT, PATCH, DELETE) başka bir siteden gelen isteği reddeder.
 * Oturum çerezi SameSite=Lax olsa da başka sitedeki bir form, en üst düzeyde gezinmeyle giriş ucuna (ya da
 * /api/players/me'ye) saldırganın hesabını yollayıp kurbanın tarayıcısına saldırganın çerezini kurdurabilirdi; kurbanın
 * ilerlemesi de o hesabın bulutuna akardı. Tarayıcı bu isteklere `Origin` ve `Sec-Fetch-Site` koyar: ikisinden biri
 * başka siteyi gösterirse 403. Başlık hiç yoksa (curl, eski tarayıcı) geçer: çerezli tarayıcı isteği her zaman taşır.
 */
import { NextResponse, type NextRequest } from 'next/server'

export function crossSite(req: NextRequest): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return true
  const origin = req.headers.get('origin')
  if (!origin) return false
  let host: string
  try {
    host = new URL(origin).host
  } catch {
    // "null" (korumalı iframe, gizli yönlendirme) ya da bozuk değer
    return true
  }
  const want = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || req.headers.get('host') || req.nextUrl.host
  return host.toLowerCase() !== want.toLowerCase()
}

export const crossSiteError = () => NextResponse.json({ error: 'Bu istek başka bir siteden geldi' }, { status: 403 })
