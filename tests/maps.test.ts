import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NextRequest } from 'next/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { isRude, titleProblem, type CommunityMap } from '../lib/communityMaps'
import { SAMPLE_MAP, decodeMap, encodeMap } from '../lib/customLevel'

/**
 * Topluluk Haritaları gerçek SQL ile (bellekte Postgres: PGlite). Önce tablo yokken galeri sessizce boş döner ve yayın
 * 503 verir; göç uygulanınca yayın doğrulaması, beğeni aç/kapa, oynanma sayacı ve üç sıralama sınanır.
 */
const pg = new PGlite()
vi.mock('@/lib/db', () => ({ db: () => drizzle(pg) }))

const { GET, POST } = await import('../app/api/maps/route')
const one = await import('../app/api/maps/[id]/route')

const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const P = [
  { id: '00000000-0000-4000-8000-000000000011', name: 'Defne', token: 'd'.repeat(40) },
  { id: '00000000-0000-4000-8000-000000000012', name: 'Emir', token: 'e'.repeat(40) },
  { id: '00000000-0000-4000-8000-000000000013', name: 'Füsun', token: 'f'.repeat(40) },
]
type Who = (typeof P)[number]

const migrations = readdirSync(join(__dirname, '../drizzle'))
  .filter((f) => f.endsWith('.sql'))
  .sort()
async function migrate(files: string[]) {
  for (const f of files) {
    const text = readFileSync(join(__dirname, '../drizzle', f), 'utf8')
    for (const stmt of text.split(';').map((s) => s.trim()).filter(Boolean)) await pg.query(stmt)
  }
}

const cookie = (p?: Who): Record<string, string> => (p ? { cookie: `seksek_oturum=${p.id}.${p.token}` } : {})

/** Örnek haritanın n. çeşidi: çıkışı bir sütun kaydırılmış, böylece her biri ayrı kod */
const variant = (n: number) => {
  const map = SAMPLE_MAP.map((r) => r.replace('E', ' '))
  map[19] = map[19].slice(0, 44 + n) + 'E' + map[19].slice(45 + n)
  return encodeMap(map, n % 2 ? 'van' : 'izmir')
}

/** ayrı kodlu çok harita (çıkış sütunu ve şehir birlikte değişir) */
const fresh = (n: number) => {
  const map = SAMPLE_MAP.map((r) => r.replace('E', ' '))
  const col = 44 + (n % 10)
  map[19] = map[19].slice(0, col) + 'E' + map[19].slice(col + 1)
  return encodeMap(map, (['bursa', 'konya', 'sivas', 'mardin', 'kars', 'edirne', 'rize'] as const)[Math.floor(n / 10) % 7])
}

const publish = async (p: Who | undefined, body: Record<string, unknown>) => {
  const r = await POST(new NextRequest('http://x/api/maps', { method: 'POST', headers: cookie(p), body: JSON.stringify(body) }))
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
let ipSeq = 0
const act = async (p: Who | undefined, id: number, action: string, ip = `10.0.0.${++ipSeq}`) => {
  const r = await one.POST(new NextRequest(`http://x/api/maps/${id}`, { method: 'POST', headers: { ...cookie(p), 'x-forwarded-for': ip }, body: JSON.stringify({ action }) }), { params: Promise.resolve({ id: String(id) }) })
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}

const put = async (p: Who | undefined, id: number, body: Record<string, unknown>, headers: Record<string, string> = {}) => {
  const r = await one.PUT(new NextRequest(`http://x/api/maps/${id}`, { method: 'PUT', headers: { ...cookie(p), ...headers }, body: JSON.stringify(body) }), { params: Promise.resolve({ id: String(id) }) })
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
const del = async (p: Who | undefined, id: number) => {
  const r = await one.DELETE(new NextRequest(`http://x/api/maps/${id}`, { method: 'DELETE', headers: cookie(p) }), { params: Promise.resolve({ id: String(id) }) })
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
const list = async (q: string, p?: Who) => {
  const r = await GET(new NextRequest(`http://x/api/maps?${q}`, { headers: cookie(p) }))
  return (await r.json()) as { maps: CommunityMap[]; hasMore: boolean; page: number }
}

beforeAll(async () => {
  await migrate(migrations.filter((f) => f < '0009'))
  for (const p of P) {
    await pg.query(`insert into seksek_players (id, name, name_key, password_hash) values ($1, $2, $3, 'x')`, [p.id, p.name, p.name.toLocaleLowerCase('tr')])
    await pg.query(`insert into seksek_sessions (player_id, token_hash) values ($1, $2)`, [p.id, sha(p.token)])
  }
})

describe('başlık süzgeci', () => {
  it('kaba sözü yakalar, masum sözcüğe dokunmaz', () => {
    for (const bad of ['Siktir Git', 'o r o s p u', 'Oroossspu Yolu', 'amk ne zor', 'y4rr4k', 'Göt Yolu', 'fuck this']) expect(isRude(bad), bad).toBe(true)
    for (const ok of ['Götür Beni Van’a', 'Haritamın Adı', 'Sikke Avı', 'Amasya Elması', 'Kocaman Bir Yol', 'Ananas Adası', 'Piçetta']) expect(isRude(ok), ok).toBe(false)
  })

  it('uzunluk ve karakter sınırı', () => {
    expect(titleProblem('Yo')).toMatch(/3–40/)
    expect(titleProblem('x'.repeat(41))).toMatch(/3–40/)
    expect(titleProblem('Kule <script>')).toMatch(/harf/)
    expect(titleProblem('  Van   Kedisi  ')).toBeNull()
  })
})

describe('topluluk haritaları', () => {
  it('tablo yokken galeri boş, yayın 503', async () => {
    expect(await list('sort=yeni')).toMatchObject({ maps: [], hasMore: false })
    expect((await publish(P[0], { code: variant(0), title: 'Erken Kuş', solved: true })).status).toBe(503)
    expect((await act(P[0], 1, 'play')).status).toBe(503)
    await migrate(migrations.filter((f) => f >= '0009'))
    // göç idempotent
    await migrate(migrations.filter((f) => f >= '0009'))
  })

  it('yayın: giriş, kod, çözücü bayrağı ve başlık denetlenir; aynı harita iki kez yayınlanmaz', async () => {
    const code = variant(0)
    expect((await publish(undefined, { code, title: 'İlk Yol', solved: true })).status).toBe(401)
    expect((await publish({ ...P[0], token: 'z'.repeat(40) }, { code, title: 'İlk Yol', solved: true })).status).toBe(401)
    expect((await publish(P[0], { code: 'bozuk!!', title: 'İlk Yol', solved: true })).status).toBe(400)
    expect((await publish(P[0], { code: code.slice(0, -3), title: 'İlk Yol', solved: true })).status).toBe(400)
    expect((await publish(P[0], { code, title: 'İlk Yol' })).j.error).toMatch(/çözücü/)
    expect((await publish(P[0], { code, title: 'İY', solved: true })).status).toBe(400)
    expect((await publish(P[0], { code, title: 'Siktir Yolu', solved: true })).status).toBe(400)
    const ok = await publish(P[0], { code, title: '  İlk   Yol ', solved: true })
    expect(ok.status).toBe(200)
    expect(ok.j.code).toBe(code)
    const dup = await publish(P[1], { code, title: 'Kopya Yol', solved: true })
    expect(dup).toMatchObject({ status: 409, j: { id: ok.j.id } })
    const row = (await list('sort=yeni')).maps[0]
    expect(row).toMatchObject({ title: 'İlk Yol', author: 'Defne', city: 'izmir', plays: 0, likes: 0, liked: false })
    expect(decodeMap(row.code)).toMatchObject({ city: 'izmir' })
  })

  it('oyuncu başına günde en çok 10 harita; dünkü yayınlar sayılmaz', async () => {
    await pg.query(`update seksek_maps set created_at = now() - interval '2 days'`)
    for (let n = 1; n <= 10; n++) expect((await publish(P[0], { code: variant(n), title: `Yol ${n}`, solved: true })).status).toBe(200)
    const over = await publish(P[0], { code: variant(11), title: 'Yol 11', solved: true })
    expect(over.status).toBe(429)
    // başka oyuncu etkilenmez
    expect((await publish(P[1], { code: variant(11), title: 'Emir’in Yolu', solved: true })).status).toBe(200)
  })

  it('beğeni aç/kapa: kişi başına bir, sayaç tutarlı; giriş ister', async () => {
    const id = (await list('sort=yeni')).maps[0].id
    expect((await act(undefined, id, 'like')).status).toBe(401)
    expect((await act(P[0], id, 'like')).j).toEqual({ liked: true, likes: 1 })
    expect((await act(P[1], id, 'like')).j).toEqual({ liked: true, likes: 2 })
    expect((await act(P[0], id, 'like')).j).toEqual({ liked: false, likes: 1 })
    expect((await act(P[0], id, 'like')).j).toEqual({ liked: true, likes: 2 })
    const mine = (await list('sort=yeni', P[0])).maps.find((m) => m.id === id)!
    expect(mine).toMatchObject({ liked: true, likes: 2 })
    expect((await list('sort=yeni', P[2])).maps.find((m) => m.id === id)).toMatchObject({ liked: false })
    expect((await act(P[0], 99999, 'like')).status).toBe(404)
    expect((await act(P[0], id, 'sil')).status).toBe(400)
    const n = await pg.query<{ n: number }>(`select count(*)::int as n from seksek_map_likes where map_id = $1`, [id])
    expect(n.rows[0].n).toBe(2)
  })

  it('oynanma sayacı girişsiz artar', async () => {
    const id = (await list('sort=yeni')).maps[1].id
    expect((await act(undefined, id, 'play')).j).toEqual({ plays: 1 })
    expect((await act(P[2], id, 'play')).j).toEqual({ plays: 2 })
    // aynı bağlantıdan aynı harita saatte bir kez sayılır
    expect((await act(undefined, id, 'play', '10.9.9.9')).j).toEqual({ plays: 3 })
    expect((await act(undefined, id, 'play', '10.9.9.9')).j).toEqual({ plays: null })
    expect((await act(undefined, 99999, 'play')).status).toBe(404)
  })

  it('sıralamalar başka sıra verir, sayfalama sürer', async () => {
    const all = (await list('sort=yeni')).maps
    const liked = all[0].id // iki beğeni
    const played = all[1].id // iki oynanma
    const yeni = await list('sort=yeni')
    expect(yeni.maps).toHaveLength(12)
    expect(yeni.hasMore).toBe(false)
    expect(yeni.maps.at(-1)!.title).toBe('İlk Yol')
    expect((await list('sort=begeni')).maps[0].id).toBe(liked)
    expect((await list('sort=oynanan')).maps[0].id).toBe(played)
    await publish(P[2], { code: variant(12), title: 'On Üçüncü Yol', solved: true })
    const p0 = await list('sort=yeni&page=0')
    const p1 = await list('sort=yeni&page=1')
    expect(p0).toMatchObject({ hasMore: true, page: 0 })
    expect(p1.maps.map((m) => m.title)).toEqual(['İlk Yol'])
    // bilinmeyen sıralama yeniye düşer
    expect((await list('sort=xyz')).maps[0].title).toBe('On Üçüncü Yol')
  })
})

describe('yayındaki haritayı güncelleme', () => {
  const evil = { origin: 'https://kotu.example', 'sec-fetch-site': 'cross-site' }
  let id = 0
  let before: CommunityMap

  it('sahibi aynı bağlantıyla günceller; sayaçlar ve yayın tarihi korunur', async () => {
    const p = await publish(P[2], { code: fresh(300), title: 'Güncellenecek Yol', solved: true })
    expect(p.status).toBe(200)
    id = p.j.id as number
    await act(P[0], id, 'like')
    await act(undefined, id, 'play')
    before = (await list('sort=yeni', P[2])).maps.find((m) => m.id === id)!
    expect(before).toMatchObject({ likes: 1, plays: 1, updatedAt: null, mine: true })
    const nextCode = fresh(301)
    const r = await put(P[2], id, { code: nextCode, title: '  Güncel   Yol ', solved: true })
    expect(r).toMatchObject({ status: 200, j: { id, code: nextCode } })
    const after = (await list('sort=yeni', P[2])).maps.find((m) => m.id === id)!
    expect(after).toMatchObject({ title: 'Güncel Yol', code: nextCode, likes: 1, plays: 1, createdAt: before.createdAt })
    expect(after.updatedAt).not.toBeNull()
    // aynı kodla yeniden gönderince de (yalnız başlık değişir) sorun yok
    expect((await put(P[2], id, { code: nextCode, title: 'Yeni Ad', solved: true })).status).toBe(200)
    expect((await list('sort=yeni', P[0])).maps.find((m) => m.id === id)).toMatchObject({ mine: false, liked: true })
  })

  it('başkası güncelleyemez ve silemez; oturumsuz 401; olmayan harita 404', async () => {
    expect((await put(P[1], id, { code: fresh(302), title: 'Ele Geçirme', solved: true })).status).toBe(403)
    expect((await put(undefined, id, { code: fresh(302), title: 'Ele Geçirme', solved: true })).status).toBe(401)
    expect((await put(P[2], 99999, { code: fresh(302), title: 'Hayalet Yol', solved: true })).status).toBe(404)
    expect((await del(P[1], id)).status).toBe(403)
    expect((await del(undefined, id)).status).toBe(401)
    const row = (await list('sort=yeni')).maps.find((m) => m.id === id)!
    expect(row.title).toBe('Yeni Ad')
  })

  it('yayındakiyle aynı şartlar: çözücü, başlık, kod; başka haritanın kodu 409', async () => {
    const code = fresh(303)
    expect((await put(P[2], id, { code, title: 'Çözülmemiş', solved: false })).j.error).toMatch(/çözücü/)
    expect((await put(P[2], id, { code, title: 'Yo', solved: true })).status).toBe(400)
    expect((await put(P[2], id, { code: 'bozuk!!', title: 'Bozuk Kod', solved: true })).status).toBe(400)
    const other = (await list('sort=yeni')).maps.find((m) => m.id !== id)!
    expect((await put(P[2], id, { code: other.code, title: 'Kopya Yol', solved: true })).status).toBe(409)
  })

  it('arama ve Haritalarım süzgeci', async () => {
    const found = await list(`sort=yeni&q=${encodeURIComponent('yeni ad')}`)
    expect(found.maps.map((m) => m.id)).toEqual([id])
    expect((await list('sort=yeni&q=%25')).maps).toHaveLength(0)
    const mine = await list('sort=yeni&mine=1', P[2])
    expect(mine.maps.length).toBeGreaterThan(0)
    expect(mine.maps.every((m) => m.mine)).toBe(true)
    expect((await list('sort=yeni&mine=1')).maps).toHaveLength(0)
  })

  it('sahibi siler, beğeniler birlikte gider', async () => {
    expect((await del(P[2], id)).j).toEqual({ ok: true })
    expect((await list('sort=yeni')).maps.some((m) => m.id === id)).toBe(false)
    expect((await pg.query<{ n: number }>(`select count(*)::int as n from seksek_map_likes where map_id = $1`, [id])).rows[0].n).toBe(0)
    expect((await del(P[2], id)).status).toBe(404)
  })

  it('başka siteden güncelleme ve silme 403', async () => {
    const mine = (await list('sort=yeni&mine=1', P[2])).maps[0]
    expect((await put(P[2], mine.id, { code: fresh(304), title: 'Sahte Yol', solved: true }, evil)).status).toBe(403)
    const r = await one.DELETE(new NextRequest(`http://x/api/maps/${mine.id}`, { method: 'DELETE', headers: { ...cookie(P[2]), ...evil } }), { params: Promise.resolve({ id: String(mine.id) }) })
    expect(r.status).toBe(403)
  })

  it('güncelleme oyuncu başına saatte 60 ile sınırlı', async () => {
    const mine = (await list('sort=yeni&mine=1', P[2])).maps[0]
    let last = 200
    let retry: string | null = null
    for (let i = 0; i < 62 && last !== 429; i++) {
      const r = await one.PUT(new NextRequest(`http://x/api/maps/${mine.id}`, { method: 'PUT', headers: cookie(P[2]), body: JSON.stringify({ code: mine.code, title: `Tekrar ${i}`, solved: true }) }), { params: Promise.resolve({ id: String(mine.id) }) })
      last = r.status
      retry = r.headers.get('retry-after')
    }
    expect(last).toBe(429)
    expect(Number(retry)).toBeGreaterThan(0)
  })
})

describe('güvenlik', () => {
  /** ayrı kodlu çok harita: çıkış sütunu ve şehir birlikte değişir */
  const many = (n: number) => {
    const map = SAMPLE_MAP.map((r) => r.replace('E', ' '))
    const col = 44 + (n % 10)
    map[19] = map[19].slice(0, col) + 'E' + map[19].slice(col + 1)
    return encodeMap(map, (['bursa', 'konya', 'sivas', 'mardin', 'kars'] as const)[Math.floor(n / 10) % 5])
  }
  const evil = { origin: 'https://kotu.example', 'sec-fetch-site': 'cross-site' }

  it('başka siteden yayın ve beğeni 403', async () => {
    const pub = await POST(new NextRequest('http://x/api/maps', { method: 'POST', headers: { ...cookie(P[0]), ...evil }, body: JSON.stringify({ code: many(0), title: 'Sahte Yol', solved: true }) }))
    expect(pub.status).toBe(403)
    const id = (await list('sort=yeni')).maps[0].id
    const like = await one.POST(new NextRequest(`http://x/api/maps/${id}`, { method: 'POST', headers: { ...cookie(P[0]), ...evil }, body: JSON.stringify({ action: 'like' }) }), { params: Promise.resolve({ id: String(id) }) })
    expect(like.status).toBe(403)
  })

  it('beğeni oyuncu başına saatte 300 ile sınırlı', async () => {
    const id = (await list('sort=yeni')).maps[0].id
    let last = 200
    for (let i = 0; i < 301 && last !== 429; i++) last = (await act(P[1], id, 'like')).status
    expect(last).toBe(429)
  })

  it('yayın: IP başına saatte 30 (çok hesapla yağdırma)', async () => {
    // günlük sınır (oyuncu başına 10) vurmasın diye sayaç sıfırdan: yayınlar dünde kalsın
    await pg.query(`update seksek_maps set created_at = now() - interval '2 days'`)
    const statuses: number[] = []
    let retry: string | null = null
    for (let i = 0; i < 31; i++) {
      if (i % 9 === 8) await pg.query(`update seksek_maps set created_at = now() - interval '2 days'`)
      const r = await POST(new NextRequest('http://x/api/maps', { method: 'POST', headers: { ...cookie(P[i % 3]), 'x-forwarded-for': '10.44.44.44' }, body: JSON.stringify({ code: many(i + 1), title: `Yağmur ${i}`, solved: true }) }))
      statuses.push(r.status)
      retry = r.headers.get('retry-after')
    }
    expect(statuses.slice(0, 30).every((x) => x === 200)).toBe(true)
    expect(statuses[30]).toBe(429)
    expect(Number(retry)).toBeGreaterThan(0)
  })
})
