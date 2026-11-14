import { sql, type SQL } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { istanbulDay, shiftDay } from '@/lib/extras'
import { nameKey, verifyPlayer } from '@/lib/players'
import { currentKeys, dailyScoreKey, scoreKey } from '@/lib/scoreKey'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
const fresh = { 'Cache-Control': 'no-store' }

/** Günlük tabloya yalnız dün, bugün ve yarın (saat dilimi payı) yazılır */
const dayOk = (day: string) => {
  const today = istanbulDay(new Date())
  return DAY_RE.test(day) && [shiftDay(today, -1), today, shiftDay(today, 1)].includes(day)
}

/** Sütun eklenmeden önceki satırlar: en az düşüş ve en çok hatıra, en iyi süreli koşununki sayılır */
const MIN_DEATHS = sql`coalesce(s.min_deaths, s.deaths)`
const MAX_ITEMS = sql`coalesce(s.max_items, s.items)`

/** Bir şehrin (ya da günün) sıralaması: ilk `limit` satır + istenen oyuncunun satırı, sırasıyla */
async function board(key: string, order: SQL, me: string, limit: number) {
  const r = await db().execute(sql`
    with t as (
      select p.name, p.name_key, s.time_ms as "timeMs", s.deaths, s.items, ${MIN_DEATHS}::int as "minDeaths",
             ${MAX_ITEMS}::int as "maxItems", s.plays,
             row_number() over (order by ${order})::int as rank, count(*) over ()::int as total
      from seksek_scores s join seksek_players p on p.id = s.player_id
      where s.level = ${key})
    select name, "timeMs", deaths, items, "minDeaths", "maxItems", plays, rank, total, name_key = ${me} as me
    from t where rank <= ${limit} or name_key = ${me} order by rank`)
  return r.rows
}

/**
 * GET ?level=<şehir>&sort=time|deaths|items        → şehrin ilk 10'u (en iyi süre · en az düşüş · en çok hatıra)
 * GET ?level=genel&sort=cities|items|deaths         → oyuncu başına toplamlar (yalnız şehirlerin bugünkü haritaları)
 * GET ?level=koleksiyon                             → hesaba kayıtlı defterden: hatıra + gizli pul + nazar boncuğu
 * GET ?level=gunluk&day=2026-11-14                  → Günlük Meydan Okuma (düşük skor önde)
 * Hepsinde &me=<ad>: oyuncu ilk sıralarda değilse kendi satırı sonda gelir. Yanıt: { scores, total }
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const level = q.get('level') ?? ''
  const sort = q.get('sort') ?? ''
  const me = nameKey((q.get('me') ?? '').slice(0, 32))
  const out = (rows: Record<string, unknown>[]) => NextResponse.json({ scores: rows, total: Number(rows[0]?.total ?? 0) }, { headers: fresh })
  try {
    if (level === 'genel') {
      const order =
        sort === 'items'
          ? sql`items desc, cities desc, "timeMs" asc`
          : sort === 'deaths'
            ? sql`cities desc, deaths asc, "timeMs" asc`
            : sql`cities desc, "timeMs" asc`
      const r = await db().execute(sql`
        with agg as (
          select p.name, p.name_key, count(*)::int as cities, sum(s.time_ms)::int as "timeMs",
                 sum(${MIN_DEATHS})::int as deaths, sum(${MAX_ITEMS})::int as items, sum(s.plays)::int as plays
          from seksek_scores s join seksek_players p on p.id = s.player_id
          where s.level in ${currentKeys()}
          group by p.id, p.name, p.name_key),
        t as (select *, row_number() over (order by ${order})::int as rank, count(*) over ()::int as total from agg)
        select name, cities, "timeMs", deaths, items, plays, rank, total, name_key = ${me} as me
        from t where rank <= 20 or name_key = ${me} order by rank`)
      return out(r.rows)
    }
    if (level === 'koleksiyon') {
      const ids = [...LEVEL_IDS]
      const r = await db().execute(sql`
        with c as (
          select p.name, p.name_key,
            (select count(*) from jsonb_each(coalesce(v.data->'best', '{}'::jsonb)) b, jsonb_array_elements(coalesce(b.value->'items', '[]'::jsonb)) i
              where b.key in ${ids} and i = 'true'::jsonb)::int as keeps,
            (select count(*) from jsonb_each(coalesce(v.data->'stamps', '{}'::jsonb)) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as stamps,
            (select count(*) from jsonb_each(coalesce(v.data->'charms', '{}'::jsonb)) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as charms,
            (select count(*) from jsonb_each(coalesce(v.data->'bosses', '{}'::jsonb)) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as bosses
          from seksek_saves v join seksek_players p on p.id = v.player_id),
        t as (select *, keeps + stamps + charms as total_found,
                row_number() over (order by keeps + stamps + charms desc, bosses desc, name_key asc)::int as rank, count(*) over ()::int as total
              from c where keeps + stamps + charms + bosses > 0)
        select name, keeps, stamps, charms, bosses, total_found as found, rank, total, name_key = ${me} as me
        from t where rank <= 20 or name_key = ${me} order by rank`)
      return out(r.rows)
    }
    if (level === 'gunluk') {
      const day = q.get('day') ?? istanbulDay(new Date())
      if (!DAY_RE.test(day)) return bad('Geçersiz gün')
      return out(await board(dailyScoreKey(day), sql`s.time_ms asc, s.deaths asc, s.created_at asc`, me, 20))
    }
    if (!LEVEL_IDS.has(level)) return bad('Geçersiz bölüm')
    const order =
      sort === 'deaths'
        ? sql`${MIN_DEATHS} asc, s.time_ms asc, s.created_at asc`
        : sort === 'items'
          ? sql`${MAX_ITEMS} desc, s.time_ms asc, s.created_at asc`
          : sql`s.time_ms asc, s.deaths asc, s.created_at asc`
    return out(await board(scoreKey(level), order, me, 10))
  } catch {
    return bad('Skorlar şu an alınamıyor', 503)
  }
}

interface Run {
  key: string
  timeMs: number
  deaths: number
  items: number
}

/** Koşu satırını doğrular; günlük tabloda süre yerine cezalı skor gelir */
function parseRun(b: Record<string, unknown>): Run | string {
  const level = typeof b.level === 'string' ? b.level : ''
  const timeMs = Number(b.timeMs)
  const deaths = Number(b.deaths)
  const items = Number(b.items)
  let key: string
  if (level === 'gunluk') {
    const day = typeof b.day === 'string' ? b.day : ''
    if (!dayOk(day)) return 'Bu günün meydan okuması kapandı'
    key = dailyScoreKey(day)
  } else if (LEVEL_IDS.has(level)) key = scoreKey(level)
  else return 'Geçersiz bölüm'
  if (!Number.isInteger(timeMs) || timeMs < 5000 || timeMs > 3 * 3_600_000) return 'Geçersiz süre'
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 9999) return 'Geçersiz düşüş sayısı'
  if (!Number.isInteger(items) || items < 0 || items > 3) return 'Geçersiz hatıra sayısı'
  return { key, timeMs, deaths, items }
}

/**
 * Oyuncunun o tablodaki satırı: en iyi süre (ve o koşunun düşüş, hatırası), bütün koşulardaki en az düşüş ve en çok
 * hatıra ayrı ayrı tutulur; her bitiriş oynama sayısını artırır. Tek sorguda, yarışsız (ON CONFLICT).
 */
async function upsert(playerId: string, name: string, r: Run, played: number) {
  await db().execute(sql`
    insert into seksek_scores as s (level, name, player_id, time_ms, deaths, items, min_deaths, max_items, plays)
    values (${r.key}, ${name}, ${playerId}, ${r.timeMs}, ${r.deaths}, ${r.items}, ${r.deaths}, ${r.items}, 1)
    on conflict (level, player_id) do update set
      deaths = case when excluded.time_ms < s.time_ms then excluded.deaths else s.deaths end,
      items = case when excluded.time_ms < s.time_ms then excluded.items else s.items end,
      created_at = case when excluded.time_ms < s.time_ms then now() else s.created_at end,
      time_ms = least(s.time_ms, excluded.time_ms),
      min_deaths = least(${MIN_DEATHS}, excluded.deaths),
      max_items = greatest(${MAX_ITEMS}, excluded.items),
      plays = s.plays + ${played},
      name = excluded.name`)
}

/**
 * POST {level, playerId, token, timeMs, deaths, items, day?} → bir bitiriş yazılır; yanıt hangi rekorların
 *   tazelendiğini ve süre sıralamasını söyler.
 * POST {playerId, token, batch: [{level, timeMs, deaths, items}]} → cihazdaki rekorlar tabloya aktarılır (girişte bir
 *   kez; tabloda olmayan ya da daha iyi olanlar yazılır, oynama sayısı artmaz).
 */
export async function POST(req: NextRequest) {
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  try {
    if (Array.isArray(b.batch)) {
      const runs = b.batch.slice(0, LEVELS.length).map((x) => (x && typeof x === 'object' ? parseRun(x as Record<string, unknown>) : 'x'))
      const ok = runs.filter((r): r is Run => typeof r !== 'string' && !r.key.startsWith('gunluk:'))
      const me = await verifyPlayer(b.playerId, b.token)
      if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
      for (const r of ok) await upsert(me.id, me.name, r, 0)
      return NextResponse.json({ ok: true, synced: ok.length })
    }
    const run = parseRun(b)
    if (typeof run === 'string') return bad(run)
    const me = await verifyPlayer(b.playerId, b.token)
    if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
    const d = db()
    const prev = (
      await d.execute(sql`select time_ms as "timeMs", coalesce(min_deaths, deaths) as "minDeaths", coalesce(max_items, items) as "maxItems"
                          from seksek_scores where level = ${run.key} and player_id = ${me.id} limit 1`)
    ).rows[0] as { timeMs: number; minDeaths: number; maxItems: number } | undefined
    await upsert(me.id, me.name, run, 1)
    const better = {
      time: !prev || run.timeMs < prev.timeMs,
      deaths: !prev || run.deaths < prev.minDeaths,
      items: !prev || run.items > prev.maxItems,
    }
    const best = better.time ? run.timeMs : prev!.timeMs
    const rank = await d.execute(sql`select count(*)::int + 1 as rank, (select count(*)::int from seksek_scores where level = ${run.key}) as total
                                     from seksek_scores where level = ${run.key} and time_ms < ${best}`)
    const row = rank.rows[0] as { rank: number; total: number }
    return NextResponse.json({ ok: true, first: !prev, improved: better.time, better, bestMs: best, rank: row.rank, total: row.total })
  } catch {
    return bad('Skor kaydedilemedi', 503)
  }
}
