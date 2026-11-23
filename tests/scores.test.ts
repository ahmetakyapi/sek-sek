import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NextRequest } from 'next/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CHALLENGES } from '../game/challenges'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { BOSS_FLOOR_MS, minScoreMs, minTimeMs } from '../lib/antiCheat'
import { dailyBoss, dailyRun, istanbulDay, shiftDay, tournamentFor, tournamentWeek } from '../lib/extras'
import { runPoints } from '../lib/points'
import { parseShare } from '../lib/share'

/**
 * Skor tablosu gerçek SQL ile (bellekte Postgres: PGlite): göçler sırayla uygulanır, sonra API uçları çağrılır.
 * Aynı oyuncu aynı şehri yeniden bitirince her ölçüt (süre, düşüş, hatıra) ayrı ayrı tazelenir; sıralama filtreleri
 * gerçekten başka sıra verir; eski sürümle yazılmış skorlar haritası değişmeyen şehirde yeni anahtara taşınır.
 */
const pg = new PGlite()
vi.mock('@/lib/db', () => ({ db: () => drizzle(pg) }))

const { GET, POST } = await import('../app/api/scores/route')
const ghostApi = await import('../app/api/ghosts/route')
const loginApi = await import('../app/api/players/login/route')
const playersApi = await import('../app/api/players/route')
const meApi = await import('../app/api/players/me/route')
const saveApi = await import('../app/api/players/save/route')

const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const P = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Ayşe', token: 'a'.repeat(40) },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Bora', token: 'b'.repeat(40) },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Cemre', token: 'c'.repeat(40) },
]

const migrations = readdirSync(join(__dirname, '../drizzle'))
  .filter((f) => f.endsWith('.sql'))
  .sort()
async function migrate(files: string[]) {
  for (const f of files) {
    const text = readFileSync(join(__dirname, '../drizzle', f), 'utf8')
    for (const stmt of text.split(';').map((s) => s.trim()).filter(Boolean)) await pg.query(stmt)
  }
}

// her istek ayrı IP'den: hız sınırı (IP başına saatte 60 skor) yalnız kendi testinde sınansın
let ipSeq = 0
const nextIp = () => `10.0.${(++ipSeq >> 8) & 255}.${ipSeq & 255}`
const post = async (body: Record<string, unknown>, ip = nextIp()) => {
  const r = await POST(new NextRequest('http://x/api/scores', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': ip } }))
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
const run = (p: (typeof P)[number], level: string, timeMs: number, deaths: number, items: number, extra = {}) => post({ level, playerId: p.id, token: p.token, timeMs, deaths, items, ...extra })
/** Başlangıçtan çıkışa düz çizgide, fizik hızının altında yürüyen hayalet (n örnek); `edit` örnekleri bozar */
function walk(levelId: string, n: number, edit?: (data: number[]) => void) {
  const w = new World(LEVELS.find((l) => l.id === levelId)!)
  const a = { x: w.player.x, y: w.player.y }
  const b = { x: w.exit.x, y: w.exit.y + 8 }
  const data = Array.from({ length: n }, (_, k) => [Math.round(a.x + ((b.x - a.x) * k) / (n - 1)), Math.round(a.y + ((b.y - a.y) * k) / (n - 1)), 1]).flat()
  edit?.(data)
  return data
}
const ALL_MINI = (day: string) => minScoreMs(`gunluk-m:${day}`)
const get = async (q: string) => {
  const r = await GET(new NextRequest(`http://x/api/scores?${q}`))
  return (await r.json()) as { scores: Record<string, unknown>[]; total: number }
}

beforeAll(async () => {
  await migrate(migrations.filter((f) => f < '0005'))
  for (const p of P) {
    await pg.query(`insert into seksek_players (id, name, name_key, password_hash) values ($1, $2, $3, 'x')`, [p.id, p.name, p.name.toLocaleLowerCase('tr')])
    await pg.query(`insert into seksek_sessions (player_id, token_hash) values ($1, $2)`, [p.id, sha(p.token)])
  }
  // eski genel sürümle yazılmış satırlar: İzmir'de iki sürümde de koşu, Kayseri'de yalnız 8
  await pg.query(`insert into seksek_scores (level, name, player_id, time_ms, deaths, items) values
    ('izmir@7', 'Ayşe', $1, 90000, 1, 3), ('izmir@8', 'Ayşe', $1, 95000, 0, 2), ('kayseri@8', 'Ayşe', $1, 120000, 4, 1), ('izmir@6', 'Bora', $2, 50000, 0, 3)`, [P[0].id, P[1].id])
  // arada şehrin özet anahtarıyla (0005 sonrası, 0006 öncesi yayında kalan sürüm) yazılmış bir skor da olsun
  await migrate(migrations.filter((f) => f === '0005_seksek_city_versions.sql'))
  await pg.query(`insert into seksek_scores (level, name, player_id, time_ms, deaths, items, min_deaths, max_items, plays) values ('bursa@abc123', 'Bora', $1, 61000, 2, 2, 2, 2, 1)`, [P[1].id])
  await migrate(migrations.filter((f) => f >= '0006'))
  await migrate(migrations.filter((f) => f >= '0005'))
})

describe('skor tablosu', () => {
  it('eski sürümlerin skorları kalıcı anahtara taşınır, en iyiler birleşir; sıralama güncellemede silinmez', async () => {
    expect((await get('level=bursa')).scores[0]).toMatchObject({ name: 'Bora', timeMs: 61000 })
    const izmir = await get('level=izmir')
    expect(izmir.scores).toHaveLength(1)
    expect(izmir.scores[0]).toMatchObject({ name: 'Ayşe', timeMs: 90000, minDeaths: 0, maxItems: 3, plays: 2 })
    const kayseri = await get('level=kayseri')
    expect(kayseri.scores[0]).toMatchObject({ timeMs: 120000 })
    // sürüm 6'nın skoru taşınmaz (fizik değişti)
    expect(izmir.scores.some((r) => r.name === 'Bora')).toBe(false)
    const rows = await pg.query<{ n: number }>(`select count(*)::int as n from seksek_scores where level = $1`, ['izmir@s'])
    expect(rows.rows[0].n).toBe(1)
  })

  it('aynı şehri yeniden bitirince her ölçüt ayrı ayrı tazelenir', async () => {
    let r = await run(P[1], 'ankara', 80000, 5, 1)
    expect(r.j).toMatchObject({ first: true, improved: true, rank: 1 })
    // daha yavaş ama düşüşsüz ve üç hatıralı koşu: süre kalır, düşüş ve hatıra tazelenir
    r = await run(P[1], 'ankara', 99000, 0, 3)
    expect(r.j).toMatchObject({ first: false, improved: false, better: { time: false, deaths: true, items: true }, bestMs: 80000 })
    // daha hızlı koşu: süre ve o koşunun düşüşü yazılır, en az düşüş 0 kalır
    r = await run(P[1], 'ankara', 70000, 2, 2)
    expect(r.j).toMatchObject({ improved: true, better: { time: true, deaths: false, items: false } })
    const row = (await get('level=ankara')).scores[0]
    expect(row).toMatchObject({ timeMs: 70000, deaths: 2, items: 2, minDeaths: 0, maxItems: 3, plays: 3 })
  })

  it('filtreler gerçekten başka sıra verir; oyuncunun kendi satırı ilk sıralarda değilse de gelir', async () => {
    await run(P[0], 'ankara', 60000, 6, 1)
    await run(P[2], 'ankara', 90000, 1, 3)
    const names = async (sort: string) => (await get(`level=ankara&sort=${sort}`)).scores.map((r) => r.name)
    expect(await names('time')).toEqual(['Ayşe', 'Bora', 'Cemre'])
    expect(await names('deaths')).toEqual(['Bora', 'Cemre', 'Ayşe'])
    expect(await names('items')).toEqual(['Bora', 'Cemre', 'Ayşe'])
    for (let i = 0; i < 12; i++) {
      const id = `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`
      await pg.query(`insert into seksek_players (id, name, name_key, password_hash) values ($1, $2, $2, 'x')`, [id, `hızlı${i}`])
      await pg.query(`insert into seksek_scores (level, name, player_id, time_ms, deaths, items) values ($1, 'x', $2, $3, 0, 3)`, ['ankara@s', id, 10000 + i])
    }
    const b = await get('level=ankara&me=CEMRE')
    expect(b.scores).toHaveLength(11)
    expect(b.scores.at(-1)).toMatchObject({ name: 'Cemre', rank: 15, me: true })
    expect(b.total).toBe(15)
  })

  it('genel sıralama şehirleri sayar ve sıralamaya göre değişir', async () => {
    await run(P[2], 'izmir', 200000, 9, 3)
    const g = await get('level=genel')
    const ayse = g.scores.find((r) => r.name === 'Ayşe')!
    expect(ayse).toMatchObject({ cities: 3 })
    const byItems = (await get('level=genel&sort=items')).scores.map((r) => r.name)
    expect(byItems[0]).toBe('Cemre')
  })

  it('koleksiyon sıralaması hesaba kayıtlı defterden sayılır', async () => {
    const data = { best: { izmir: { items: [true, true, false] }, nope: { items: [true] } }, stamps: { izmir: true }, charms: { izmir: true, ankara: true }, bosses: { izmir: true } }
    await pg.query(`insert into seksek_saves (player_id, data) values ($1, $2)`, [P[2].id, JSON.stringify(data)])
    const k = await get('level=koleksiyon')
    expect(k.scores[0]).toMatchObject({ name: 'Cemre', keeps: 2, stamps: 1, charms: 2, bosses: 1, found: 5 })
    // bozuk tipli tek bir kayıt sorguyu herkes için düşürmez
    await pg.query(`insert into seksek_saves (player_id, data) values ($1, $2), ($3, $4)`, [P[0].id, JSON.stringify({ best: { izmir: { items: 5 } }, stamps: 'x', charms: null }), P[1].id, JSON.stringify({ best: null, bosses: [1] })])
    expect((await get('level=koleksiyon')).scores[0]).toMatchObject({ name: 'Cemre', found: 5 })
  })

  it('yolcu araması ve sayfalama: ad parçası eşleşenleri getirir, kendi satırı eşleşmese de gelir; lim büyür, 100 aşılmaz; satırda kılık', async () => {
    const f = await get('level=ankara&q=hızlı1')
    expect(f.scores.map((r) => r.name)).toEqual(['hızlı1', 'hızlı10', 'hızlı11'])
    // % ve _ özel karakter değil, düz harf sayılır
    expect((await get('level=ankara&q=%25')).scores).toHaveLength(0)
    const withMe = await get('level=ankara&q=hızlı11&me=CEMRE')
    expect(withMe.scores.map((r) => r.name)).toEqual(['hızlı11', 'Cemre'])
    expect((await get('level=ankara')).scores).toHaveLength(10)
    expect((await get('level=ankara&lim=14')).scores).toHaveLength(14)
    expect((await get('level=ankara&lim=100000')).scores.length).toBeLessThanOrEqual(100)
    expect((await get('level=ankara&lim=abc')).scores).toHaveLength(10)
    // koleksiyon kaydı olan oyuncunun satırında yolcu (portre) bilgisi gelir
    await pg.query(`update seksek_saves set data = data || '{"character":"memo"}'::jsonb where player_id = $1`, [P[2].id])
    expect((await get('level=ankara&q=cemre')).scores[0]).toMatchObject({ name: 'Cemre', hero: 'memo' })
    expect((await get('level=genel&q=cemre')).scores[0]).toMatchObject({ name: 'Cemre', hero: 'memo' })
    expect((await get('level=koleksiyon&q=cemre')).scores[0]).toMatchObject({ hero: 'memo' })
  })

  it('günlük tabloya yalnız açık günler yazılır, cezalı skor önde düşük olan', async () => {
    const today = istanbulDay(new Date())
    expect((await run(P[0], 'gunluk', 90000, 0, 3, { day: shiftDay(today, -5) })).status).toBe(400)
    expect((await run(P[0], 'gunluk', 90000, 0, 3, { day: today })).status).toBe(200)
    expect((await run(P[1], 'gunluk', 80000, 0, 3, { day: today })).status).toBe(200)
    const d = await get(`level=gunluk&day=${today}`)
    expect(d.scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
  })

  it('Günün Mücadelesi ve Günün Boss\'u: yalnız açık günler, düşük süre önde, günlük ve genel tabloya karışmaz', async () => {
    const today = istanbulDay(new Date())
    const mini = ALL_MINI(today)
    expect((await run(P[0], 'gunluk-m', 30000, 0, 0, { day: shiftDay(today, -5) })).status).toBe(400)
    expect((await run(P[0], 'gunluk-m', mini + 5000, 0, 0, { day: today })).status).toBe(200)
    expect((await run(P[1], 'gunluk-m', mini + 4000, 1, 0, { day: today })).status).toBe(200)
    expect((await get(`level=gunluk-m&day=${today}`)).scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    // boss: altında fiziksel alt sınır, üstünde kabul
    expect((await run(P[2], 'gunluk-b', BOSS_FLOOR_MS - 1, 0, 0, { day: today })).status).toBe(422)
    expect((await run(P[2], 'gunluk-b', 40000, 2, 0, { day: today })).status).toBe(200)
    expect((await get(`level=gunluk-b&day=${today}`)).scores).toHaveLength(1)
    expect((await get(`level=gunluk&day=${today}`)).scores.some((r) => r.name === 'Cemre')).toBe(false)
    expect((await get('level=gunluk-b&day=2026-13-99')).total).toBe(0)
    expect(dailyBoss(today, LEVELS)).toBeGreaterThanOrEqual(0)
  })

  it('kural tablosu: şehir + kural başına, bilinmeyen kural ve prototip anahtarı reddedilir', async () => {
    const floor = minTimeMs(LEVELS.find((l) => l.id === 'istanbul')!)
    expect((await run(P[0], 'kural', floor + 9000, 1, 3, { city: 'istanbul', rule: 'tekcan' })).status).toBe(200)
    expect((await run(P[1], 'kural', floor + 4000, 0, 3, { city: 'istanbul', rule: 'tekcan' })).status).toBe(200)
    expect((await run(P[1], 'kural', floor + 4000, 0, 3, { city: 'istanbul', rule: 'zaman' })).status).toBe(200)
    expect((await get('level=kural&city=istanbul&rule=tekcan')).scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    expect((await get('level=kural&city=istanbul&rule=zaman')).scores).toHaveLength(1)
    for (const rule of ['yok', '__proto__', 'constructor', 'toString']) {
      expect((await run(P[0], 'kural', floor + 9000, 0, 3, { city: 'istanbul', rule })).status).toBe(400)
      expect((await GET(new NextRequest(`http://x/api/scores?level=kural&city=istanbul&rule=${rule}`))).status).toBe(400)
    }
    expect((await run(P[0], 'kural', floor - 1, 0, 3, { city: 'istanbul', rule: 'tekcan' })).status).toBe(422)
    expect((await run(P[0], 'kural', 90000, 0, 3, { city: 'yok', rule: 'tekcan' })).status).toBe(400)
  })

  it('Boss Rush: çeşit ve boss sayısı başına ayrı tablo; boss başına alt sınır', async () => {
    expect((await run(P[0], 'bossrush', 100000, 3, 0, { variant: 'duz', bosses: 5 })).status).toBe(200)
    expect((await run(P[1], 'bossrush', 90000, 1, 0, { variant: 'duz', bosses: 5 })).status).toBe(200)
    expect((await run(P[1], 'bossrush', 50000, 1, 0, { variant: 'duz', bosses: 3 })).status).toBe(200)
    expect((await get('level=bossrush&variant=duz&n=5')).scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    expect((await get('level=bossrush&variant=duz&n=3')).scores).toHaveLength(1)
    expect((await get('level=bossrush&variant=kabus&n=5')).scores).toHaveLength(0)
    expect((await run(P[0], 'bossrush', BOSS_FLOOR_MS * 5 - 1, 0, 0, { variant: 'duz', bosses: 5 })).status).toBe(422)
    for (const [variant, bosses] of [['yok', 5], ['duz', 0], ['duz', 999], ['duz', 1.5], ['__proto__', 2]] as const) expect((await run(P[0], 'bossrush', 100000, 0, 0, { variant, bosses })).status).toBe(400)
    // toplu aktarım yeni tabloları yazmaz
    const b = await post({ playerId: P[2].id, token: P[2].token, batch: [{ level: 'bossrush', variant: 'duz', bosses: 2, timeMs: 100000, deaths: 0, items: 0 }, { level: 'gunluk-b', day: istanbulDay(new Date()), timeMs: 40000, deaths: 0, items: 0 }] })
    expect(b.j).toMatchObject({ synced: 0 })
  })

  it('cihazdaki rekorlar girişte tabloya aktarılır, oynama sayısı artmaz', async () => {
    const r = await post({ playerId: P[2].id, token: P[2].token, batch: [{ level: 'konya', timeMs: 77000, deaths: 1, items: 2 }, { level: 'yok', timeMs: 1 }] })
    expect(r.j).toMatchObject({ synced: 1 })
    await post({ playerId: P[2].id, token: P[2].token, batch: [{ level: 'konya', timeMs: 75000, deaths: 3, items: 3 }] })
    expect((await get('level=konya')).scores[0]).toMatchObject({ timeMs: 75000, minDeaths: 1, maxItems: 3, plays: 1 })
    expect((await post({ playerId: P[2].id, token: 'yanlış', batch: [] })).status).toBe(401)
  })

  it('hayalet: yalnız tablodaki en iyi süreyle yüklenir, daha kötüsü üstüne yazmaz, adla indirilir', async () => {
    const send = (timeMs: number, n = Math.round((timeMs / 1000) * 15), edit?: (data: number[]) => void) =>
      ghostApi.POST(new NextRequest('http://x/api/ghosts', { method: 'POST', body: JSON.stringify({ level: 'konya', timeMs, hero: 'memo', data: walk('konya', n, edit), playerId: P[2].id, token: P[2].token }) }))
    // Cemre'nin konya rekoru 75000 (önceki test)
    expect((await send(80000)).status).toBe(409)
    expect((await send(75000, 10)).status).toBe(400)
    // fiziğe sığmayan hayalet: yolun ortasında doğuş yeri olmayan bir yere ışınlanma, ya da çıkışta bitmeyen koşu
    const teleport = await send(75000, undefined, (d) => { d[600 * 3] += 400 })
    expect(teleport.status).toBe(422)
    expect(((await teleport.json()) as { error: string }).error).toMatch(/fizikten hızlı/)
    const stop = (d: number[]) => {
      const at = d.length - 300 * 3
      for (let i = at; i < d.length; i += 3) [d[i], d[i + 1]] = [d[at - 3], d[at - 2]]
    }
    expect((await send(75000, undefined, stop)).status).toBe(422)
    expect((await send(75000)).status).toBe(200)
    const r = await ghostApi.GET(new NextRequest('http://x/api/ghosts?level=konya&name=cemre'))
    const j = (await r.json()) as { name: string; hero: string; timeMs: number; data: number[] }
    expect(j).toMatchObject({ name: 'Cemre', hero: 'memo', timeMs: 75000 })
    expect(j.data.length).toBe(75 * 15 * 3)
    expect((await ghostApi.GET(new NextRequest('http://x/api/ghosts?level=izmir&name=cemre'))).status).toBe(404)
  })

  it('mücadele haritası kendi tablosunda; genel sıralamaya ve toplu aktarıma girmez', async () => {
    expect((await run(P[0], 'mucadele-corum-leblebi-2', 9000, 1, 0)).status).toBe(200)
    expect((await run(P[1], 'mucadele-corum-leblebi-2', 8000, 0, 0)).status).toBe(200)
    expect((await run(P[1], 'mucadele-yok', 8000, 0, 0)).status).toBe(400)
    expect((await get('level=mucadele-corum-leblebi-2')).scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    const r = await post({ playerId: P[0].id, token: P[0].token, batch: [{ level: 'mucadele-corum-leblebi-2', timeMs: 4000, deaths: 0, items: 0 }] })
    expect(r.j).toMatchObject({ synced: 0 })
    expect((await get('level=genel')).scores.find((x) => x.name === 'Bora')).toMatchObject({ cities: 2 })
  })

  it('speedrun: %100 şehir koşusu ve tam turlar kendi tablolarında; genel sıralamaya ve toplu aktarıma girmez', async () => {
    const genel = async () => (await get('level=genel')).scores.find((x) => x.name === 'Bora')
    const before = await genel()
    expect((await run(P[0], 'yuzde', 140000, 2, 3, { city: 'izmir' })).status).toBe(200)
    expect((await run(P[1], 'yuzde', 120000, 0, 3, { city: 'izmir' })).status).toBe(200)
    expect((await run(P[1], 'yuzde', 120000, 0, 3, { city: 'yok' })).status).toBe(400)
    // fiziksel en kısa yoldan hızlı %100 koşusu reddedilir
    expect((await run(P[1], 'yuzde', 6000, 0, 3, { city: 'izmir' })).status).toBe(422)
    expect((await get('level=yuzde&city=izmir')).scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    // tam tur: otuz şehir, 3 saati aşabilir; otuz şehrin en kısa toplamından hızlısı reddedilir
    expect((await run(P[0], 'tur', 4 * 3_600_000, 12, 0)).status).toBe(200)
    expect((await run(P[1], 'tur', 30000, 0, 0)).status).toBe(422)
    expect((await run(P[1], 'aynatur', 13 * 3_600_000, 0, 0)).status).toBe(400)
    expect((await get('level=tur')).scores.map((r) => r.name)).toEqual(['Ayşe'])
    const r = await post({ playerId: P[0].id, token: P[0].token, batch: [{ level: 'tur', timeMs: 4 * 3_600_000, deaths: 0, items: 0 }] })
    expect(r.j).toMatchObject({ synced: 0 })
    expect(await genel()).toEqual(before)
  })

  it('turnuva: yalnız bu haftanın üç mücadelesi yazılır, üçünü bitirenler toplamla sıralanır', async () => {
    const week = tournamentWeek(istanbulDay(new Date()))
    const ids = tournamentFor(week)
    const go = (p: (typeof P)[number], id: string, timeMs: number, w = week) => post({ level: 'turnuva', week: w, challenge: id, playerId: p.id, token: p.token, timeMs, deaths: 0, items: 0 })
    expect((await go(P[0], ids[0], 9000, '2020-H01')).status).toBe(400)
    const other = CHALLENGES.find((c) => !ids.includes(c.id))!.id
    expect((await go(P[0], other, 9000)).status).toBe(400)
    for (const [i, id] of ids.entries()) await go(P[0], id, 30000 + i)
    await go(P[1], ids[0], 25000)
    await go(P[1], ids[1], 25000)
    const last = await go(P[1], ids[2], 25000)
    expect(last.j).toMatchObject({ week: { total: 75000, rank: 1 } })
    await go(P[2], ids[0], 20000) // tek mücadele: sıralamaya girmez
    const b = await get(`level=turnuva&week=${week}`)
    expect(b.scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
    expect(b.scores[1]).toMatchObject({ timeMs: 90003 })
    // arkadaş süzgeci: yalnız verilen adlar ve oyuncunun kendisi
    expect((await get(`level=turnuva&week=${week}&names=ayşe&me=Cemre`)).scores.map((r) => r.name)).toEqual(['Ayşe'])
    expect((await get('level=ankara&names=bora,cemre')).scores.map((r) => r.name)).toEqual(['Bora', 'Cemre'])
  })
})

describe('hile önleme ve hız sınırı', () => {
  it('haritanın fiziksel en kısa süresinden hızlı koşu 422 ile reddedilir; toplu aktarımda sessizce atlanır', async () => {
    const floor = minTimeMs(LEVELS.find((l) => l.id === 'sivas')!)
    expect(floor).toBeGreaterThan(5000)
    const r = await run(P[0], 'sivas', floor - 1, 0, 3)
    expect(r.status).toBe(422)
    expect(r.j.error).toMatch(/hızlı/)
    expect((await run(P[0], 'sivas', floor + 1, 0, 3)).status).toBe(200)
    const b = await post({ playerId: P[1].id, token: P[1].token, batch: [{ level: 'sivas', timeMs: floor - 1, deaths: 0, items: 3 }, { level: 'van', timeMs: 200000, deaths: 0, items: 3 }] })
    expect(b.j).toMatchObject({ synced: 1 })
    // günlük: o günün şehrinin sınırı (skor süre + ceza, süreden kısa olamaz)
    const today = istanbulDay(new Date())
    const dayFloor = minTimeMs(LEVELS.find((l) => l.id === dailyRun(today, LEVELS).levelId)!)
    expect((await run(P[2], 'gunluk', dayFloor - 1, 0, 3, { day: today })).status).toBe(dayFloor - 1 < 5000 ? 400 : 422)
  })

  it('skor: girişsiz istek IP başına saatte 120, sonra 429 ve Retry-After', async () => {
    for (let i = 0; i < 120; i++) expect((await post({ level: 'yok' }, '9.9.9.9')).status).toBe(400)
    const r = await POST(new NextRequest('http://x/api/scores', { method: 'POST', body: '{}', headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } }))
    expect(r.status).toBe(429)
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(Number(r.headers.get('retry-after'))).toBeLessThanOrEqual(3600)
    // başka IP etkilenmez; düz IP tabloda saklanmaz
    expect((await post({ level: 'yok' }, '9.9.9.8')).status).toBe(400)
    const keys = (await pg.query<{ key: string }>('select key from seksek_rate')).rows.map((x) => x.key)
    expect(keys.some((k) => k.includes('9.9.9'))).toBe(false)
  })

  it('skor: aynı evden (aynı IP) oynayan iki yolcu birbirinin hakkını yemez; sınır doğrulanmış kimliğe sayılır', async () => {
    const H = [
      { id: '00000000-0000-4000-8000-000000000091', name: 'Ev Bir', token: '1'.repeat(40) },
      { id: '00000000-0000-4000-8000-000000000092', name: 'Ev İki', token: '2'.repeat(40) },
    ]
    for (const p of H) {
      await pg.query(`insert into seksek_players (id, name, name_key, password_hash) values ($1, $2, $3, 'x')`, [p.id, p.name, p.name.toLocaleLowerCase('tr')])
      await pg.query(`insert into seksek_sessions (player_id, token_hash) values ($1, $2)`, [p.id, sha(p.token)])
    }
    const as = (p: (typeof H)[number], ip: string) => post({ level: 'yok', playerId: p.id, token: p.token }, ip)
    // birinci yolcu kendi hakkını bitirir
    for (let i = 0; i < 120; i++) expect((await as(H[0], '5.5.5.5')).status).toBe(400)
    expect((await as(H[0], '5.5.5.5')).status).toBe(429)
    // aynı IP'deki ikinci yolcu gönderebilir
    expect((await as(H[1], '5.5.5.5')).status).toBe(400)
    // başkasının kimliğini (oturumsuz) yazmak onun hakkını tüketmez: istek gönderenin IP'sine sayılır
    for (let i = 0; i < 120; i++) await post({ level: 'yok', playerId: H[1].id, token: 'yanlış' }, '5.5.6.6')
    expect((await post({ level: 'yok', playerId: H[1].id }, '5.5.6.6')).status).toBe(429)
    expect((await as(H[1], '5.5.7.7')).status).toBe(400)
    // kimlik değiştirerek de sınır aşılamaz
    expect((await post({ level: 'yok', playerId: '00000000-0000-4000-8000-0000000000ff' }, '5.5.6.6')).status).toBe(429)
  })

  it('giriş: IP başına ve ad başına 15 dakikada 10 deneme', async () => {
    const login = (name: string, ip: string) => loginApi.POST(new NextRequest('http://x/api/players/login', { method: 'POST', body: JSON.stringify({ name, password: 'yanlış-şifre' }), headers: { 'x-forwarded-for': ip } }))
    for (let i = 0; i < 10; i++) expect((await login(`kimse${i}`, '7.7.7.7')).status).toBe(401)
    expect((await login('kimse-son', '7.7.7.7')).status).toBe(429)
    // aynı ada farklı IP'lerden deneme de sayılır
    for (let i = 0; i < 10; i++) expect((await login('Hedef', `8.8.8.${i}`)).status).toBe(401)
    const r = await login('HEDEF', '8.8.9.9')
    expect(r.status).toBe(429)
    expect(r.headers.get('retry-after')).toBeTruthy()
  })

  it('kayıt: IP başına saatte 5 hesap', async () => {
    const signup = (name: string) => playersApi.POST(new NextRequest('http://x/api/players', { method: 'POST', body: JSON.stringify({ name, password: 'gizli123' }), headers: { 'x-forwarded-for': '6.6.6.6' } }))
    for (let i = 0; i < 5; i++) expect((await signup(`yeni${i}`)).status).toBe(200)
    expect((await signup('yeni5')).status).toBe(429)
  })

  it('sayaç tablosu yoksa (göç uygulanmamış) istek sessizce geçer', async () => {
    await pg.query('alter table seksek_rate rename to seksek_rate_x')
    try {
      for (let i = 0; i < 3; i++) expect((await post({ level: 'yok' }, '9.9.9.9')).status).toBe(400)
    } finally {
      await pg.query('alter table seksek_rate_x rename to seksek_rate')
    }
  })
})

describe('güvenlik', () => {
  const H = { id: '00000000-0000-4000-8000-0000000000a1', name: 'Irmak', token: '9'.repeat(40) }
  beforeAll(async () => {
    await pg.query(`insert into seksek_players (id, name, name_key, password_hash) values ($1, $2, $3, 'x')`, [H.id, H.name, H.name.toLocaleLowerCase('tr')])
    await pg.query(`insert into seksek_sessions (player_id, token_hash) values ($1, $2)`, [H.id, sha(H.token)])
  })
  const evil = { origin: 'https://kotu.example', 'sec-fetch-site': 'cross-site' }

  it('başka siteden gelen yazma isteği 403: giriş, çerez kurma, skor, hayalet, kayıt, ad, çıkış', async () => {
    const req = (url: string, method: string, body: unknown, headers: Record<string, string> = evil) =>
      new NextRequest(`http://x${url}`, { method, body: JSON.stringify(body), headers: { 'x-forwarded-for': nextIp(), ...headers } })
    const auth = { id: H.id, token: H.token }
    const calls = [
      () => loginApi.POST(req('/api/players/login', 'POST', { name: 'Irmak', password: 'gizli123' })),
      () => meApi.POST(req('/api/players/me', 'POST', auth)),
      () => playersApi.POST(req('/api/players', 'POST', { name: 'Yeni Biri', password: 'gizli123' })),
      () => playersApi.PATCH(req('/api/players', 'PATCH', { ...auth, name: 'Irmak Su' })),
      () => playersApi.DELETE(req('/api/players', 'DELETE', auth)),
      () => POST(req('/api/scores', 'POST', { level: 'konya', playerId: H.id, token: H.token, timeMs: 200000, deaths: 0, items: 0 })),
      () => ghostApi.POST(req('/api/ghosts', 'POST', { level: 'konya', timeMs: 200000, data: [] })),
      () => saveApi.PUT(req('/api/players/save', 'PUT', { data: {} }, { ...evil, cookie: `seksek_oturum=${H.id}.${H.token}` })),
    ]
    for (const c of calls) expect((await c()).status).toBe(403)
    // yalnız Origin (Sec-Fetch-Site'sız eski tarayıcı) ya da "null" köken de reddedilir
    expect((await meApi.POST(req('/api/players/me', 'POST', auth, { origin: 'https://kotu.example' }))).status).toBe(403)
    expect((await meApi.POST(req('/api/players/me', 'POST', auth, { origin: 'null' }))).status).toBe(403)
    // kendi kökeninden gelen istek geçer
    const ok = await meApi.POST(req('/api/players/me', 'POST', auth, { origin: 'http://x', host: 'x', 'sec-fetch-site': 'same-origin' }))
    expect(ok.status).toBe(200)
    // oturum hâlâ açık (başka siteden çıkış yaptırılamadı)
    expect((await meApi.GET(new NextRequest('http://x/api/players/me', { headers: { cookie: `seksek_oturum=${H.id}.${H.token}` } }))).status).toBe(200)
  })

  it('ad taklidi: başka alfabeden benzer harf, tam genişlik ve I/ı farkıyla aynı ad alınamaz', async () => {
    const signup = (name: string) => playersApi.POST(new NextRequest('http://x/api/players', { method: 'POST', body: JSON.stringify({ name, password: 'gizli123' }), headers: { 'x-forwarded-for': nextIp() } }))
    const avail = async (name: string) => ((await (await playersApi.GET(new NextRequest(`http://x/api/players?name=${encodeURIComponent(name)}`))).json()) as { available: boolean }).available
    // Kiril А, Yunan Α, tam genişlikli Ａ, sıfır genişlikli boşluk: hepsi 400
    for (const n of ['Аyşe', 'Αyşe', 'Ａyşe', 'Ay\u200bşe', '...']) {
      expect((await signup(n)).status, n).toBe(400)
      expect(await avail(n), n).toBe(false)
    }
    // "Irmak" (anahtarı "ırmak") varken "irmak", "İRMAK" de alınmış sayılır
    for (const n of ['irmak', 'IRMAK', 'İrmak']) {
      expect(await avail(n), n).toBe(false)
      expect((await signup(n)).status, n).toBe(409)
    }
    // ayrık yazılmış Türkçe harf bileşik biçime çevrilir; Türkçe harfli ad geçer
    const r = await signup('Ays\u0327e Gu\u0308l')
    expect(r.status).toBe(200)
    expect(((await r.json()) as { name: string }).name).toBe('Ayşe Gül')
    // kendi adının büyük/küçük harfini değiştirmek serbest
    const me = await playersApi.PATCH(new NextRequest('http://x/api/players', { method: 'PATCH', body: JSON.stringify({ id: H.id, token: H.token, name: 'IRMAK' }) }))
    expect(me.status).toBe(200)
  })

  it('ad değiştirme oyuncu başına saatte 10', async () => {
    const rename = (name: string) => playersApi.PATCH(new NextRequest('http://x/api/players', { method: 'PATCH', body: JSON.stringify({ id: H.id, token: H.token, name }) }))
    let last = 200
    for (let i = 0; i < 11; i++) last = (await rename(`Irmak ${i}`)).status
    expect(last).toBe(429)
  })

  it('giriş: olmayan ad ile yanlış şifre aynı yanıtı verir', async () => {
    const login = (name: string) => loginApi.POST(new NextRequest('http://x/api/players/login', { method: 'POST', body: JSON.stringify({ name, password: 'yanlış-şifre' }), headers: { 'x-forwarded-for': nextIp() } }))
    const a = await login('hiç-olmayan-ad')
    const b = await login('Ayşe')
    expect(a.status).toBe(401)
    expect(b.status).toBe(401)
    expect(await a.json()).toEqual(await b.json())
  })

  it('skor kartı bağlantısı: ad süzülür, kaba söz karta çıkmaz', () => {
    const q = { s: 'konya', t: '90000', d: '1', i: '2', c: 'memo' }
    expect(parseShare({ ...q, n: 'Ayşe<script>' })!.name).toBe('Ayşescript')
    expect(parseShare({ ...q, n: 'siktir' })!.name).toBe('')
    expect(parseShare({ ...q, n: 'Defne' })!.name).toBe('Defne')
  })

  it('bulut kaydı: __proto__ anahtarı nesne zincirini kirletemez', async () => {
    const body = `{"data":{"best":{"__proto__":{"polluted":1}},"__proto__":{"polluted":1},"stamps":{"__proto__":{"polluted":1}}}}`
    const r = await saveApi.PUT(new NextRequest('http://x/api/players/save', { method: 'PUT', body, headers: { cookie: `seksek_oturum=${H.id}.${H.token}` } }))
    expect(r.status).toBe(200)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    const g = (await (await saveApi.GET(new NextRequest('http://x/api/players/save', { headers: { cookie: `seksek_oturum=${H.id}.${H.token}` } }))).json()) as { data: Record<string, unknown> }
    expect(JSON.stringify(g.data)).not.toContain('polluted')
  })
})

describe('puan (en sonda: öteki testlerin şehir sayılarına dokunmaz)', () => {
  it('puan: sunucu hesaplar, en yüksek puan kalır; hatıra ve temiz koşu puanı yükseltir', async () => {
    const gold = LEVELS.find((l) => l.id === 'mardin')!.medals[0]
    const fast = runPoints(gold, 70000, 3, 0).total
    const full = runPoints(gold, 90000, 0, 3).total
    expect(full).toBeGreaterThan(fast)
    let r = await run(P[0], 'mardin', 70000, 3, 0)
    expect(r.j).toMatchObject({ better: { points: true } })
    r = await run(P[1], 'mardin', 90000, 0, 3)
    // daha yavaş koşu süre sırasında arkada, puan sırasında önde
    const names = async (sort: string) => (await get(`level=mardin&sort=${sort}`)).scores.map((x) => [x.name, x.points])
    expect(await names('time')).toEqual([['Ayşe', fast], ['Bora', full]])
    expect(await names('points')).toEqual([['Bora', full], ['Ayşe', fast]])
    // Ayşe hızlı ama hatırasız yeniden koşar: puanı düşük koşu kaydı ezmez
    r = await run(P[0], 'mardin', 65000, 9, 0)
    expect(r.j).toMatchObject({ better: { time: true, points: false } })
    expect((await get('level=mardin&sort=points')).scores.find((x) => x.name === 'Ayşe')!.points).toBe(Math.max(fast, runPoints(gold, 65000, 9, 0).total))
    // sütun gelmeden yazılmış satır: en iyi koşudan SQL'de hesaplanır, JS ile aynı
    const eski = (await get('level=kayseri&sort=points')).scores[0]
    expect(eski.points).toBe(runPoints(LEVELS.find((l) => l.id === 'kayseri')!.medals[0], 120000, 4, 1).total)
    // genel: şehir puanlarının toplamı
    const genel = (await get('level=genel&sort=points')).scores
    expect(genel.every((x) => typeof x.points === 'number')).toBe(true)
    expect(genel.map((x) => x.points)).toEqual([...genel.map((x) => x.points as number)].sort((a, b) => b - a))
  })

  it('liste özeti: her şehrin lideri, yolcu sayısı ve oyuncunun sırası tek istekte', async () => {
    const r = await GET(new NextRequest('http://x/api/scores?level=ozet&kind=sehir&me=Bora'))
    const rows = ((await r.json()) as { rows: Record<string, unknown>[] }).rows
    const mardin = rows.find((x) => x.id === 'mardin')!
    expect(mardin).toMatchObject({ total: 2, leader: 'Ayşe', leaderMs: 65000, myRank: 2, myMs: 90000 })
    const m = await GET(new NextRequest('http://x/api/scores?level=ozet&kind=mucadele'))
    expect(((await m.json()) as { rows: unknown[] }).rows.every((x) => !String((x as { id: string }).id).includes(':'))).toBe(true)
  })
})
