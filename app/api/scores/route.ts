import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { verifyPlayer } from '@/lib/players'
import { players, scores } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/**
 * GET ?level=<şehir>&sort=time|deaths|items → şehrin ilk 10'u
 * GET ?level=genel&sort=cities|deaths|items  → oyuncu başına toplamlar (önce bitirilen şehir sayısı)
 */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level') ?? ''
  const sort = req.nextUrl.searchParams.get('sort') ?? ''
  try {
    if (level === 'genel') {
      const order =
        sort === 'deaths'
          ? sql`count(*) desc, sum(s.deaths) asc, sum(s.time_ms) asc`
          : sort === 'items'
            ? sql`sum(s.items) desc, sum(s.time_ms) asc`
            : sql`count(*) desc, sum(s.time_ms) asc`
      const rows = await db().execute(sql`
        select p.name as name, count(*)::int as cities, sum(s.time_ms)::int as "timeMs",
               sum(s.deaths)::int as deaths, sum(s.items)::int as items
        from memleket_scores s join memleket_players p on p.id = s.player_id
        group by p.id, p.name
        order by ${order}
        limit 20`)
      return NextResponse.json({ scores: rows.rows }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (!LEVEL_IDS.has(level)) return bad('Geçersiz bölüm')
    const order =
      sort === 'deaths'
        ? [asc(scores.deaths), asc(scores.timeMs)]
        : sort === 'items'
          ? [desc(scores.items), asc(scores.timeMs)]
          : [asc(scores.timeMs), asc(scores.deaths), asc(scores.createdAt)]
    const rows = await db()
      .select({ name: players.name, timeMs: scores.timeMs, deaths: scores.deaths, items: scores.items })
      .from(scores)
      .innerJoin(players, eq(players.id, scores.playerId))
      .where(eq(scores.level, level))
      .orderBy(...order)
      .limit(10)
    return NextResponse.json({ scores: rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return bad('Skorlar şu an alınamıyor', 503)
  }
}

/** POST {level, playerId, token, timeMs, deaths, items} → oyuncunun o şehirdeki en iyisi tutulur */
export async function POST(req: NextRequest) {
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const level = typeof b.level === 'string' ? b.level : ''
  const timeMs = Number(b.timeMs)
  const deaths = Number(b.deaths)
  const items = Number(b.items)
  if (!LEVEL_IDS.has(level)) return bad('Geçersiz bölüm')
  if (!Number.isInteger(timeMs) || timeMs < 5000 || timeMs > 3_600_000) return bad('Geçersiz süre')
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 9999) return bad('Geçersiz düşüş sayısı')
  if (!Number.isInteger(items) || items < 0 || items > 3) return bad('Geçersiz hatıra sayısı')
  try {
    const me = await verifyPlayer(b.playerId, b.token)
    if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
    const d = db()
    const prev = (await d.select({ id: scores.id, timeMs: scores.timeMs }).from(scores).where(and(eq(scores.level, level), eq(scores.playerId, me.id))).limit(1))[0]
    let improved = true
    if (!prev) await d.insert(scores).values({ level, name: me.name, playerId: me.id, timeMs, deaths, items })
    else if (timeMs < prev.timeMs) await d.update(scores).set({ timeMs, deaths, items, name: me.name, createdAt: new Date() }).where(eq(scores.id, prev.id))
    else improved = false
    const best = improved ? timeMs : prev!.timeMs
    const rank = await d.execute(sql`select count(*)::int + 1 as rank from memleket_scores where level = ${level} and time_ms < ${best}`)
    return NextResponse.json({ ok: true, improved, rank: (rank.rows[0] as { rank: number }).rank })
  } catch {
    return bad('Skor kaydedilemedi', 503)
  }
}
