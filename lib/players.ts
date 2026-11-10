import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { NextRequest, NextResponse } from 'next/server'
import { players, sessions } from '@/lib/schema'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u
export const NAME_ERR = 'Kullanıcı adı 2–16 karakter olmalı (harf, rakam, boşluk, - _ .)'
export const PASS_ERR = 'Şifre en az 6, en çok 64 karakter olmalı'
export const validPassword = (p: unknown): p is string => typeof p === 'string' && p.length >= 6 && p.length <= 64

export const cleanName = (n: unknown) => (typeof n === 'string' ? n.trim().replace(/\s+/g, ' ') : '')
/** Büyük/küçük harf ve Türkçe İ/ı farkı gözetmeyen anahtar: "Ahmet" ile "AHMET" aynı ad */
export const nameKey = (n: string) => n.toLocaleLowerCase('tr')

const sha = (t: string) => createHash('sha256').update(t).digest('hex')

/** Saklama biçimi: scrypt$<tuz>$<özet> */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const key = await scryptAsync(pw, salt, 32)
  return ['scrypt', salt.toString('hex'), key.toString('hex')].join('$')
}

export async function checkPassword(pw: string, stored: string) {
  const [kind, salt, hash] = stored.split('$')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const key = await scryptAsync(pw, Buffer.from(salt, 'hex'), 32)
  const want = Buffer.from(hash, 'hex')
  return key.length === want.length && timingSafeEqual(key, want)
}

/** Yeni oturum anahtarı: veritabanında yalnız özeti durur. */
export async function openSession(playerId: string) {
  const token = randomBytes(24).toString('hex')
  await db().insert(sessions).values({ playerId, tokenHash: sha(token) })
  return token
}

export async function closeSession(id: unknown, token: unknown) {
  if (typeof id !== 'string' || typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || token.length > 100) return
  await db()
    .delete(sessions)
    .where(and(eq(sessions.playerId, id), eq(sessions.tokenHash, sha(token))))
}

/** Oyuncu kimliği ve oturum anahtarı eşleşiyor mu? */
export async function verifyPlayer(id: unknown, token: unknown) {
  if (typeof id !== 'string' || typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || token.length > 100) return null
  const row = (
    await db()
      .select({ id: players.id, name: players.name })
      .from(sessions)
      .innerJoin(players, eq(players.id, sessions.playerId))
      .where(and(eq(sessions.playerId, id), eq(sessions.tokenHash, sha(token))))
      .limit(1)
  )[0]
  return row ?? null
}

/**
 * Oturum çerezi: sunucu koyar (HttpOnly, Secure, SameSite=Lax), bir yıldan uzun yaşar ve her açılışta tazelenir.
 * Yerel depo silinse bile (Safari'nin 7 gün kuralı, temizlik) oyuncu yeniden giriş yapmadan tanınır.
 * Değer: <oyuncu kimliği>.<oturum anahtarı>; veritabanında anahtarın yalnız özeti durur.
 */
export const SESSION_COOKIE = 'seksek_oturum'
const COOKIE_AGE = 400 * 24 * 3600

export function setSessionCookie(res: NextResponse, id: string, token: string) {
  res.cookies.set(SESSION_COOKIE, `${id}.${token}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: COOKIE_AGE })
  return res
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}

/** Çerezdeki oturum: { id, token } ya da null (doğrulamaz; verifyPlayer ile sınanır) */
export function cookieSession(req: NextRequest) {
  const v = req.cookies.get(SESSION_COOKIE)?.value ?? ''
  const [id, token] = v.split('.')
  return id && token ? { id, token } : null
}

export async function findByName(name: string) {
  return (await db().select().from(players).where(eq(players.nameKey, nameKey(name))).limit(1))[0] ?? null
}
