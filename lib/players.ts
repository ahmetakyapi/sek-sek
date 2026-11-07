import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { players } from '@/lib/schema'

export const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u

export const cleanName = (n: unknown) => (typeof n === 'string' ? n.trim().replace(/\s+/g, ' ') : '')
/** Büyük/küçük harf ve Türkçe İ/ı farkı gözetmeyen anahtar: "Ahmet" ile "AHMET" aynı ad */
export const nameKey = (n: string) => n.toLocaleLowerCase('tr')

export const newToken = () => randomBytes(24).toString('hex')
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')

/** Oyuncu kimliği ve gizli anahtarı eşleşiyor mu? */
export async function verifyPlayer(id: unknown, token: unknown) {
  if (typeof id !== 'string' || typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || token.length > 100) return null
  const row = (await db().select().from(players).where(eq(players.id, id)).limit(1))[0]
  if (!row) return null
  const a = Buffer.from(row.tokenHash, 'hex')
  const b = Buffer.from(hashToken(token), 'hex')
  return a.length === b.length && timingSafeEqual(a, b) ? row : null
}
