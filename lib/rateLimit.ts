/**
 * Hız sınırı (sabit pencere), sunucusuz ortamda bellek yetmediği için veritabanında: `seksek_rate` (göç 0008).
 * Anahtar işlem + özet + pencere numarasıdır; IP ve kullanıcı adı sha256 ile özetlenir, düz hâli saklanmaz.
 * Tablo yoksa (göç uygulanmamış) ya da veritabanı yanıt vermezse istek sessizce geçer: sınır oyunu kilitlememeli.
 */
import { createHash } from 'node:crypto'
import { lt, sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from './db'
import { rate } from './schema'

export interface Limit {
  /** işlemin adı: anahtarın başı */
  action: string
  /** pencerede en çok bu kadar istek */
  max: number
  /** pencere (sn) */
  windowSec: number
}

export const LIMITS = {
  loginIp: { action: 'giris-ip', max: 10, windowSec: 15 * 60 },
  loginName: { action: 'giris-ad', max: 10, windowSec: 15 * 60 },
  signup: { action: 'kayit', max: 5, windowSec: 60 * 60 },
  // skor oyuncu başına sayılır (aynı evden oynayanlar birbirinin hakkını yemesin); IP'ye yalnız geniş bir taban
  score: { action: 'skor', max: 120, windowSec: 60 * 60 },
  scoreIp: { action: 'skor-ip', max: 600, windowSec: 60 * 60 },
  mapPlay: { action: 'harita-oyna', max: 1, windowSec: 60 * 60 },
  // oturumlu yazma uçları: oyuncu başına geniş bir tavan (oyunu kısıtlamaz, betikle şişirmeyi ve sunucuyu yormayı keser)
  rename: { action: 'ad', max: 10, windowSec: 60 * 60 },
  ghost: { action: 'hayalet', max: 120, windowSec: 60 * 60 },
  save: { action: 'kayit-yaz', max: 1200, windowSec: 60 * 60 },
  mapLike: { action: 'begeni', max: 300, windowSec: 60 * 60 },
  // yayın: oyuncu başına günlük sınırın (DAILY_LIMIT) önünde IP başına bir taban (çok hesapla yağdırma)
  mapPublishIp: { action: 'harita-yayin-ip', max: 30, windowSec: 60 * 60 },
} satisfies Record<string, Limit>

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32)

/** isteğin IP'si (Vercel x-forwarded-for'un ilk adresini koyar), özetlenmiş */
export function ipKey(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim() || 'yok'
  return digest(`ip:${ip}`)
}

/** doğrulanmış oyuncu kimliği, özetlenmiş (istemcinin yolladığı kimlik değil: başkasının hakkı tüketilemesin) */
export const playerKey = (playerId: string) => digest(`oyuncu:${playerId}`)

/** kullanıcı adı (büyük/küçük harf duyarsız), özetlenmiş */
export const nameRateKey = (nameKey: string) => digest(`ad:${nameKey}`)

/** Süresi geçen satırlar: her yüz istekte bir silinir (Math.random, sunucuda kare yok) */
const SWEEP = 0.01

/**
 * Bir isteği sayar. Sınır aşıldıysa kaç saniye sonra yeniden denenebileceğini, yoksa null döner.
 * `now` testler içindir.
 */
export async function hit(limit: Limit, subject: string, now = Date.now()): Promise<number | null> {
  const win = Math.floor(now / 1000 / limit.windowSec)
  const ends = (win + 1) * limit.windowSec * 1000
  try {
    const d = db()
    const row = (
      await d
        .insert(rate)
        .values({ key: `${limit.action}:${subject}:${win}`, count: 1, expiresAt: new Date(ends) })
        .onConflictDoUpdate({ target: rate.key, set: { count: sql`${rate.count} + 1` } })
        .returning({ count: rate.count })
    )[0]
    if (Math.random() < SWEEP) await d.delete(rate).where(lt(rate.expiresAt, new Date(now)))
    return row && row.count > limit.max ? Math.max(1, Math.ceil((ends - now) / 1000)) : null
  } catch {
    return null
  }
}

/** 429 yanıtı: Retry-After başlığıyla */
export const tooMany = (retryAfter: number, error = 'Çok fazla deneme, biraz sonra tekrar dene') =>
  NextResponse.json({ error, retryAfter }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
