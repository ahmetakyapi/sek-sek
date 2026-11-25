/**
 * Herkese açık yolcu profili (sunucu): skor tablosundaki şehir satırları (süre, sıra, oynanma) + hesaba kayıtlı defter
 * (yolcu, kombin, atkı, pul, nazar, boss, başarım, vitrin) + Haftalık Turnuva kürsüleri. `/oyuncu/<ad>` sayfası ve
 * oyun içi yolcu ayrıntısının ucu (`GET /api/players/profile`) aynı işlevi kullanır.
 */
import { and, eq, inArray, sql } from 'drizzle-orm'
import { medalFor } from '@/components/medal'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { emptyStats, istanbulDay, tournamentWeek, travelerTitle } from '@/lib/extras'
import { findByName } from '@/lib/players'
import { profileFromSave, showcase, type ProfileCity, type ProfileData } from '@/lib/profile'
import { currentKeys, scoreCity } from '@/lib/scoreKey'
import { saves, scores } from '@/lib/schema'
import { defaultSave, normalizeSave, type Save } from '@/lib/storage'

/** Bozuk yüzde kodlaması ("%E0") sayfayı 500'e düşürmesin; ad en çok 32 karakter okunur */
export const adOf = (ad: string) => {
  try {
    return decodeURIComponent(ad).slice(0, 32)
  } catch {
    return ad.slice(0, 32)
  }
}

/** Yolcunun profili; böyle bir yolcu yoksa null. Ad çözülmüş hâlde gelir (en çok 32 karakter). */
export async function loadProfile(name: string): Promise<ProfileData | null> {
  const player = await findByName(name).catch(() => null)
  if (!player) return null
  const rows = await db()
    .select({
      level: scores.level,
      timeMs: scores.timeMs,
      deaths: sql<number>`coalesce(${scores.minDeaths}, ${scores.deaths})`,
      items: sql<number>`coalesce(${scores.maxItems}, ${scores.items})`,
      plays: scores.plays,
      createdAt: scores.createdAt,
      rank: sql<number>`(select count(*)::int + 1 from seksek_scores o where o.level = ${scores.level} and o.time_ms < ${scores.timeMs})`,
    })
    .from(scores)
    .where(and(eq(scores.playerId, player.id), inArray(scores.level, currentKeys())))
  // hesaba kayıtlı defter: yolcu, kombin, atkı, pul, nazar, boss, başarım, vitrin (yoksa yalnız skorlardan çıkarılır)
  const raw = await db()
    .select({ data: saves.data })
    .from(saves)
    .where(eq(saves.playerId, player.id))
    .limit(1)
    .then((r) => r[0]?.data as Partial<Save> | undefined)
    .catch(() => undefined)
  let save: Save = defaultSave()
  try {
    if (raw && typeof raw === 'object') save = normalizeSave(raw)
  } catch {
    save = defaultSave()
  }
  // Haftalık Turnuva kürsüleri: kapanmış haftalarda üçü de bitirenler arasında ilk üç (kalıcı rozet)
  const week = tournamentWeek(istanbulDay(new Date()))
  const podium = await db()
    .execute(
      sql`with w as (select split_part(level, ':', 2) as week, player_id, sum(time_ms) as total, count(*) as n
                     from seksek_scores where level like 'turnuva:%' group by 1, 2),
          r as (select week, player_id, row_number() over (partition by week order by total asc)::int as rank from w where n = 3 and week < ${week})
          select rank, count(*)::int as n from r where player_id = ${player.id} and rank <= 3 group by rank`,
    )
    .then((r) => Object.fromEntries((r.rows as { rank: number; n: number }[]).map((x) => [x.rank, x.n])) as Record<number, number>)
    .catch(() => ({}) as Record<number, number>)

  const base = profileFromSave(save, istanbulDay(new Date()), { name: player.name, since: player.createdAt.toISOString() })
  // şehir satırları herkese açık skor tablosundan (süre, sıra, oynanma); toplananlar kayıttan
  const cities: Record<string, ProfileCity> = {}
  for (const r of rows) {
    const l = LEVELS.find((x) => x.id === scoreCity(r.level))
    if (!l) continue
    const flags = base.cities[l.id]
    cities[l.id] = {
      id: l.id,
      timeMs: r.timeMs,
      deaths: Number(r.deaths),
      items: Math.max(Number(r.items), flags?.items ?? 0),
      plays: r.plays,
      rank: Number(r.rank),
      medal: medalFor(l, r.timeMs),
      full: !!flags?.full,
      stamp: !!flags?.stamp,
      charm: !!flags?.charm,
      boss: !!flags?.boss,
    }
  }
  const list = Object.values(cities)
  const totals = { ...base.totals, keeps: Math.max(base.totals.keeps, list.reduce((a, c) => a + c.items, 0)), golds: list.filter((c) => c.medal === 'altin').length }
  const stats = save.stats ?? emptyStats()
  const title = travelerTitle({ cities: list.length, totalCities: LEVELS.length, golds: totals.golds, keeps: totals.keeps, charms: totals.charms, bosses: totals.bosses, streak: base.streak, stats })
  const recent = [...rows]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .flatMap((r) => (LEVELS.some((l) => l.id === scoreCity(r.level)) ? [{ id: scoreCity(r.level), timeMs: r.timeMs, at: r.createdAt.toISOString() }] : []))
  return { ...base, cities, totals, title, podium, recent, pins: showcase(base.earned, save.pins) }
}
