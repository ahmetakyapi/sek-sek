import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NextRequest } from 'next/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { istanbulDay, shiftDay } from '../lib/extras'

/**
 * Skor tablosu gerçek SQL ile (bellekte Postgres: PGlite): göçler sırayla uygulanır, sonra API uçları çağrılır.
 * Aynı oyuncu aynı şehri yeniden bitirince her ölçüt (süre, düşüş, hatıra) ayrı ayrı tazelenir; sıralama filtreleri
 * gerçekten başka sıra verir; eski sürümle yazılmış skorlar haritası değişmeyen şehirde yeni anahtara taşınır.
 */
const pg = new PGlite()
vi.mock('@/lib/db', () => ({ db: () => drizzle(pg) }))

const { GET, POST } = await import('../app/api/scores/route')

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

const post = async (body: Record<string, unknown>) => {
  const r = await POST(new NextRequest('http://x/api/scores', { method: 'POST', body: JSON.stringify(body) }))
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
const run = (p: (typeof P)[number], level: string, timeMs: number, deaths: number, items: number, extra = {}) => post({ level, playerId: p.id, token: p.token, timeMs, deaths, items, ...extra })
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

  it('günlük tabloya yalnız açık günler yazılır, cezalı skor önde düşük olan', async () => {
    const today = istanbulDay(new Date())
    expect((await run(P[0], 'gunluk', 90000, 0, 3, { day: shiftDay(today, -5) })).status).toBe(400)
    expect((await run(P[0], 'gunluk', 90000, 0, 3, { day: today })).status).toBe(200)
    expect((await run(P[1], 'gunluk', 80000, 0, 3, { day: today })).status).toBe(200)
    const d = await get(`level=gunluk&day=${today}`)
    expect(d.scores.map((r) => r.name)).toEqual(['Bora', 'Ayşe'])
  })

  it('cihazdaki rekorlar girişte tabloya aktarılır, oynama sayısı artmaz', async () => {
    const r = await post({ playerId: P[2].id, token: P[2].token, batch: [{ level: 'konya', timeMs: 77000, deaths: 1, items: 2 }, { level: 'yok', timeMs: 1 }] })
    expect(r.j).toMatchObject({ synced: 1 })
    await post({ playerId: P[2].id, token: P[2].token, batch: [{ level: 'konya', timeMs: 75000, deaths: 3, items: 3 }] })
    expect((await get('level=konya')).scores[0]).toMatchObject({ timeMs: 75000, minDeaths: 1, maxItems: 3, plays: 1 })
    expect((await post({ playerId: P[2].id, token: 'yanlış', batch: [] })).status).toBe(401)
  })
})
