import { and, eq, sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { GHOST_HZ } from '@/game/ghost'
import { LEVELS } from '@/game/levels'
import { ghostProblem } from '@/lib/antiCheat'
import { db } from '@/lib/db'
import { cityVersion } from '@/lib/mapVersion'
import { cookieSession, findByName, verifyPlayer } from '@/lib/players'
import { ghosts } from '@/lib/schema'
import { scoreKey } from '@/lib/scoreKey'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
/** en çok bu kadar sayı (örnek başına üç): ~22 dakikalık koşu */
const MAX_NUMS = 60_000
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/**
 * GET ?level=<şehir>&name=<oyuncu> → o oyuncunun bu şehirdeki hayaleti: { name, hero, timeMs, data }.
 * Yalnız şehrin bugünkü haritasında koşulmuş hayalet döner (harita değiştiyse 404). Kısa süre uçta önbelleklenir.
 */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level') ?? ''
  const name = (req.nextUrl.searchParams.get('name') ?? '').slice(0, 32)
  if (!LEVEL_IDS.has(level) || !name) return bad('Geçersiz istek')
  try {
    const p = await findByName(name)
    if (!p) return bad('Yolcu bulunamadı', 404)
    const row = (await db().select().from(ghosts).where(and(eq(ghosts.playerId, p.id), eq(ghosts.level, level))).limit(1))[0]
    if (!row || row.v !== cityVersion(level)) return bad('Bu şehirde hayalet yok', 404)
    return NextResponse.json({ name: p.name, hero: row.hero, timeMs: row.timeMs, data: row.data }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } })
  } catch {
    return bad('Hayalet şu an alınamıyor', 503)
  }
}

/**
 * POST {level, timeMs, hero, data} → oyuncunun bu şehirdeki hayaleti (yalnız daha iyiyse yazılır). Süre, skor
 * tablosundaki en iyi süresiyle aynı olmalı ve örnek sayısı süreyle uyuşmalı: tabloda olmayan koşu hayalet olmaz.
 * Fiziğe sığmayan hayalet (lib/antiCheat.ts ghostProblem) 422 ile reddedilir. Hayaletsiz skor yine geçerlidir.
 */
export async function POST(req: NextRequest) {
  const text = await req.text()
  if (text.length > MAX_NUMS * 7) return bad('Hayalet çok büyük', 413)
  let b: Record<string, unknown>
  try {
    b = JSON.parse(text) as Record<string, unknown>
  } catch {
    return bad('Geçersiz istek')
  }
  const level = typeof b.level === 'string' ? b.level : ''
  const timeMs = Number(b.timeMs)
  const hero = b.hero === 'memo' ? 'memo' : 'uktun'
  const data = b.data
  if (!LEVEL_IDS.has(level) || !Number.isInteger(timeMs) || timeMs < 5000) return bad('Geçersiz istek')
  if (!Array.isArray(data) || data.length > MAX_NUMS || data.length % 3 !== 0 || !data.every((n) => Number.isInteger(n) && Math.abs(n) < 100_000)) return bad('Geçersiz hayalet')
  // örnek sayısı süreyle uyuşmalı (saniyede GHOST_HZ örnek, bir saniye pay)
  if (Math.abs(data.length / 3 - (timeMs / 1000) * GHOST_HZ) > GHOST_HZ + 2) return bad('Hayalet süreyle uyuşmuyor')
  try {
    const c = cookieSession(req)
    const me = c ? await verifyPlayer(c.id, c.token) : await verifyPlayer(b.playerId, b.token)
    if (!me) return bad('Oturum doğrulanamadı', 401)
    const d = db()
    const best = (await d.execute(sql`select time_ms as "timeMs", deaths from seksek_scores where level = ${scoreKey(level)} and player_id = ${me.id} limit 1`)).rows[0] as { timeMs: number; deaths: number } | undefined
    if (!best || Math.abs(best.timeMs - timeMs) > 50) return bad('Bu süre tabloda yok', 409)
    // hayalet fiziğe sığmalı: örnekler arası hız, ışınlanmalar (yalnız doğuş yerine, düşüş sayısı kadar), başlangıç ve çıkış
    const problem = ghostProblem(LEVELS.find((l) => l.id === level)!, data as number[], best.deaths)
    if (problem) return bad(problem, 422)
    const v = cityVersion(level)
    await d.execute(sql`
      insert into seksek_ghosts (player_id, level, v, time_ms, hero, data, updated_at)
      values (${me.id}, ${level}, ${v}, ${timeMs}, ${hero}, ${JSON.stringify(data)}::jsonb, now())
      on conflict (player_id, level) do update set v = excluded.v, time_ms = excluded.time_ms, hero = excluded.hero, data = excluded.data, updated_at = now()
      where seksek_ghosts.v <> excluded.v or excluded.time_ms < seksek_ghosts.time_ms`)
    return NextResponse.json({ ok: true })
  } catch {
    return bad('Hayalet kaydedilemedi', 503)
  }
}
