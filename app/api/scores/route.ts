import { sql, type SQL } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { ALL_CHALLENGES } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { minScoreMs } from '@/lib/antiCheat'
import { db } from '@/lib/db'
import { istanbulDay, shiftDay, tournamentFor, tournamentKey, tournamentWeek } from '@/lib/extras'
import { nameKey, verifyPlayer } from '@/lib/players'
import { LIMITS, hit, ipKey, tooMany } from '@/lib/rateLimit'
import { challengeScoreKey, currentKeys, dailyScoreKey, scoreKey, fullScoreKey, TOUR_KEYS } from '@/lib/scoreKey'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
/** mücadele haritaları: `mucadele-<id>` → tabloda `mucadele:<id>` */
const CHALLENGE_IDS = new Set(ALL_CHALLENGES.map((c) => `mucadele-${c.id}`))
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
/**
 * Sıralamalar kısa süre uçta önbelleklenir: aynı tabloya art arda bakan herkes veritabanına gitmez, eskiyen yanıt
 * arka planda tazelenir. Kendi skorunu yeni yazan oyuncu tabloyu `r` parametresiyle (ayrı anahtar) taze okur.
 */
const fresh = { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=120' }

/** Günlük tabloya yalnız dün, bugün ve yarın (saat dilimi payı) yazılır */
const dayOk = (day: string) => {
  const today = istanbulDay(new Date())
  return DAY_RE.test(day) && [shiftDay(today, -1), today, shiftDay(today, 1)].includes(day)
}

/** Turnuvaya bu hafta ve (pazartesi sabahı payı) dünün haftası yazılır */
const weekOk = (week: string) => {
  const today = istanbulDay(new Date())
  return [tournamentWeek(today), tournamentWeek(shiftDay(today, -1))].includes(week)
}

/** Sütun eklenmeden önceki satırlar: en az düşüş ve en çok hatıra, en iyi süreli koşununki sayılır */
const MIN_DEATHS = sql`coalesce(s.min_deaths, s.deaths)`
const MAX_ITEMS = sql`coalesce(s.max_items, s.items)`

/** Bir şehrin (ya da günün) sıralaması: ilk `limit` satır + istenen oyuncunun satırı, sırasıyla */
async function board(key: string, order: SQL, me: string, limit: number, scope: SQL = sql`true`) {
  const r = await db().execute(sql`
    with t as (
      select p.name, p.name_key, s.time_ms as "timeMs", s.deaths, s.items, ${MIN_DEATHS}::int as "minDeaths",
             ${MAX_ITEMS}::int as "maxItems", s.plays,
             row_number() over (order by ${order})::int as rank, count(*) over ()::int as total
      from seksek_scores s join seksek_players p on p.id = s.player_id
      where s.level = ${key} and ${scope})
    select name, "timeMs", deaths, items, "minDeaths", "maxItems", plays, rank, total, name_key = ${me} as me
    from t where rank <= ${limit} or name_key = ${me} order by rank`)
  return r.rows
}

/**
 * GET ?level=<şehir>&sort=time|deaths|items        → şehrin ilk 10'u (en iyi süre · en az düşüş · en çok hatıra)
 * GET ?level=genel&sort=cities|items|deaths         → oyuncu başına toplamlar (yalnız şehirlerin bugünkü haritaları)
 * GET ?level=koleksiyon                             → hesaba kayıtlı defterden: hatıra + gizli pul + nazar boncuğu
 * GET ?level=gunluk&day=2026-11-14                  → Günlük Meydan Okuma (düşük skor önde)
 * GET ?level=mucadele-<id>                         → mücadele haritası (en iyi süre)
 * GET ?level=turnuva&week=2026-H46                 → Haftalık Turnuva: üç mücadelenin hepsini bitirenler, toplam süre
 * Hepsinde &names=a,b,c: yalnız bu oyuncular (arkadaşlar) ve &me
 * Hepsinde &me=<ad>: oyuncu ilk sıralarda değilse kendi satırı sonda gelir. Yanıt: { scores, total }
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const level = q.get('level') ?? ''
  const sort = q.get('sort') ?? ''
  const me = nameKey((q.get('me') ?? '').slice(0, 32))
  // arkadaş süzgeci: verilen adlar ve oyuncunun kendisi (adlar zaten herkese açık; yanıt önbelleklenebilir)
  const names = (q.get('names') ?? '').split(',').map((n) => nameKey(n.trim().slice(0, 32))).filter(Boolean).slice(0, 50)
  const scope = names.length ? sql`p.name_key in ${[...names, me || names[0]]}` : sql`true`
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
          where s.level in ${currentKeys()} and ${scope}
          group by p.id, p.name, p.name_key),
        t as (select *, row_number() over (order by ${order})::int as rank, count(*) over ()::int as total from agg)
        select name, cities, "timeMs", deaths, items, plays, rank, total, name_key = ${me} as me
        from t where rank <= 20 or name_key = ${me} order by rank`)
      return out(r.rows)
    }
    if (level === 'koleksiyon') {
      const ids = [...LEVEL_IDS]
      // bozuk tipli bir kayıt (nesne yerine metin, null) sorguyu herkes için düşürmesin
      const obj = (k: string) => sql`case when jsonb_typeof(v.data->${k}) = 'object' then v.data->${k} else '{}'::jsonb end`
      const r = await db().execute(sql`
        with c as (
          select p.name, p.name_key,
            (select count(*) from jsonb_each(${obj('best')}) b,
                    jsonb_array_elements(case when jsonb_typeof(b.value->'items') = 'array' then b.value->'items' else '[]'::jsonb end) i
              where b.key in ${ids} and i = 'true'::jsonb)::int as keeps,
            (select count(*) from jsonb_each(${obj('stamps')}) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as stamps,
            (select count(*) from jsonb_each(${obj('charms')}) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as charms,
            (select count(*) from jsonb_each(${obj('bosses')}) x where x.key in ${ids} and x.value = 'true'::jsonb)::int as bosses
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
      return out(await board(dailyScoreKey(day), sql`s.time_ms asc, s.deaths asc, s.created_at asc`, me, 20, scope))
    }
    if (level === 'turnuva') {
      const week = q.get('week') ?? tournamentWeek(istanbulDay(new Date()))
      if (!/^\d{4}-H\d{2}$/.test(week)) return bad('Geçersiz hafta')
      const keys = tournamentFor(week).map((id) => tournamentKey(week, id))
      const r = await db().execute(sql`
        with agg as (
          select p.name, p.name_key, sum(s.time_ms)::int as "timeMs", sum(s.deaths)::int as deaths, count(*)::int as n
          from seksek_scores s join seksek_players p on p.id = s.player_id
          where s.level in ${keys} and ${scope}
          group by p.id, p.name, p.name_key),
        t as (select *, row_number() over (order by "timeMs" asc, deaths asc, name_key asc)::int as rank, count(*) over ()::int as total
              from agg where n = ${keys.length})
        select name, "timeMs", deaths, rank, total, name_key = ${me} as me
        from t where rank <= 20 or name_key = ${me} order by rank`)
      return out(r.rows)
    }
    // speedrun: %100 şehir koşusu (city=) ve tam turlar
    if (level === 'yuzde') {
      const city = q.get('city') ?? ''
      if (!LEVEL_IDS.has(city)) return bad('Geçersiz bölüm')
      return out(await board(fullScoreKey(city), sql`s.time_ms asc, s.deaths asc, s.created_at asc`, me, 10, scope))
    }
    if ((TOUR_KEYS as readonly string[]).includes(level)) return out(await board(level, sql`s.time_ms asc, s.deaths asc, s.created_at asc`, me, 20, scope))
    if (CHALLENGE_IDS.has(level)) return out(await board(challengeScoreKey(level), sql`s.time_ms asc, s.deaths asc, s.created_at asc`, me, 10, scope))
    if (!LEVEL_IDS.has(level)) return bad('Geçersiz bölüm')
    const order =
      sort === 'deaths'
        ? sql`${MIN_DEATHS} asc, s.time_ms asc, s.created_at asc`
        : sort === 'items'
          ? sql`${MAX_ITEMS} desc, s.time_ms asc, s.created_at asc`
          : sql`s.time_ms asc, s.deaths asc, s.created_at asc`
    return out(await board(scoreKey(level), order, me, 10, scope))
  } catch {
    return bad('Skorlar şu an alınamıyor', 503)
  }
}

/** turnuvada oyuncunun toplamı ve sırası (üçü de bitmediyse null) */
async function weekRank(week: string, playerId: string) {
  const keys = tournamentFor(week).map((id) => tournamentKey(week, id))
  const r = await db().execute(sql`
    with agg as (select player_id, sum(time_ms)::int as total, count(*)::int as n from seksek_scores where level in ${keys} group by player_id),
    t as (select player_id, total, row_number() over (order by total asc)::int as rank from agg where n = ${keys.length})
    select total, rank from t where player_id = ${playerId}`)
  return (r.rows[0] as { total: number; rank: number } | undefined) ?? null
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
  } else if (level === 'turnuva') {
    const week = typeof b.week === 'string' ? b.week : ''
    const id = typeof b.challenge === 'string' ? b.challenge : ''
    if (!weekOk(week)) return 'Bu haftanın turnuvası kapandı'
    if (!tournamentFor(week).includes(id)) return 'Bu mücadele bu haftanın turnuvasında yok'
    key = tournamentKey(week, id)
  } else if (level === 'yuzde') {
    const city = typeof b.city === 'string' ? b.city : ''
    if (!LEVEL_IDS.has(city)) return 'Geçersiz bölüm'
    key = fullScoreKey(city)
  } else if ((TOUR_KEYS as readonly string[]).includes(level)) key = level
  else if (LEVEL_IDS.has(level)) key = scoreKey(level)
  else if (CHALLENGE_IDS.has(level)) key = challengeScoreKey(level)
  else return 'Geçersiz bölüm'
  // tam tur otuz şehir sürer: üst sınır 12 saat
  const maxMs = (TOUR_KEYS as readonly string[]).includes(key) ? 12 * 3_600_000 : 3 * 3_600_000
  if (!Number.isInteger(timeMs) || timeMs < (key.startsWith('mucadele:') || key.startsWith('turnuva:') ? 3000 : 5000) || timeMs > maxMs) return 'Geçersiz süre'
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 9999) return 'Geçersiz düşüş sayısı'
  if (!Number.isInteger(items) || items < 0 || items > 3) return 'Geçersiz hatıra sayısı'
  return { key, timeMs, deaths, items }
}

/** Biçimi doğru ama fiziğe sığmayan koşu (haritanın en kısa süresinden hızlı): 422 ile reddedilir (lib/antiCheat.ts) */
const tooFast = (r: Run) => r.timeMs < minScoreMs(r.key)

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
 * Haritanın fiziksel en kısa süresinden hızlı koşu 422 (lib/antiCheat.ts); oyuncu başına saatte 120, IP başına 600 istek; aşınca 429.
 */
export async function POST(req: NextRequest) {
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
  // sınır oyuncu başına (aynı evdeki yolcular ortak IP'yi paylaşır, birinin koşuları ötekinin skorunu düşürmesin)
  const who = typeof b.playerId === 'number' || typeof b.playerId === 'string' ? `p:${b.playerId}` : ipKey(req)
  const wait = (await hit(LIMITS.score, who)) || (await hit(LIMITS.scoreIp, ipKey(req)))
  if (wait) return tooMany(wait, 'Çok sık skor gönderildi, biraz sonra tekrar dene')
  try {
    if (Array.isArray(b.batch)) {
      const runs = b.batch.slice(0, LEVELS.length).map((x) => (x && typeof x === 'object' ? parseRun(x as Record<string, unknown>) : 'x'))
      // toplu aktarımda fiziğe sığmayan rekor sessizce atlanır: öteki şehirler yine yazılsın
      const ok = runs.filter((r): r is Run => typeof r !== 'string' && !r.key.startsWith('gunluk:') && !r.key.startsWith('mucadele:') && !r.key.startsWith('turnuva:') && !r.key.startsWith('yuzde:') && !(TOUR_KEYS as readonly string[]).includes(r.key) && !tooFast(r))
      const me = await verifyPlayer(b.playerId, b.token)
      if (!me) return bad('Oturum doğrulanamadı, yeniden giriş yap', 401)
      for (const r of ok) await upsert(me.id, me.name, r, 0)
      return NextResponse.json({ ok: true, synced: ok.length })
    }
    const run = parseRun(b)
    if (typeof run === 'string') return bad(run)
    if (tooFast(run)) return bad('Bu süre haritanın en kısa yolundan bile hızlı', 422)
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
    return NextResponse.json({ ok: true, first: !prev, improved: better.time, better, bestMs: best, rank: row.rank, total: row.total, ...(run.key.startsWith('turnuva:') ? { week: await weekRank(run.key.split(':')[1], me.id) } : {}) })
  } catch {
    return bad('Skor kaydedilemedi', 503)
  }
}
