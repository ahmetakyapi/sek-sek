import { and, asc, eq, sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { verifyPlayer } from '@/lib/players'
import { players, scores } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** GET ?level=<şehir>  → şehrin ilk 10'u;  ?level=genel → bitirilen şehir sayısı, sonra toplam süre */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level') ?? ''
  try {
    if (level === 'genel') {
      const rows = await db().execute(sql`
        select coalesce(p.name, s.name) as name, count(*)::int as cities, sum(s.time_ms)::int as "timeMs",
               sum(s.deaths)::int as deaths, sum(s.items)::int as items
        from memleket_scores s left join memleket_players p on p.id = s.player_id
        where s.player_id is not null
        group by s.player_id, p.name, s.name
        order by count(*) desc, sum(s.time_ms) asc
        limit 20`)
      return NextResponse.json({ scores: rows.rows }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (!LEVEL_IDS.has(level)) return bad('Geçersiz bölüm')
    const rows = await db()
      .select({ name: sql<string>`coalesce(${players.name}, ${scores.name})`, timeMs: scores.timeMs, deaths: scores.deaths, items: scores.items })
      .from(scores)
      .leftJoin(players, eq(players.id, scores.playerId))
      .where(eq(scores.level, level))
      .orderBy(asc(scores.timeMs), asc(scores.deaths), asc(scores.createdAt))
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
    if (!me) return bad('Yolcu doğrulanamadı', 401)
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
