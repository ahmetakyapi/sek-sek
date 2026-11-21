import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_MS, cachedCityScores, cityScoresUrl, clearCityScores, gapToLeader, loadCityScores, parseCityScores, visibleRows } from '@/lib/cityScores'

const row = (rank: number, extra: Record<string, unknown> = {}) => ({ name: `Y${rank}`, rank, total: 25, me: false, hero: 'memo', timeMs: 50000 + rank * 1000, deaths: 1, items: 3, minDeaths: 0, maxItems: 3, plays: 2, ...extra })
const ok = (scores: unknown[]) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ scores, total: 25 }) } as Response)

describe('şehir skor paneli', () => {
  beforeEach(() => clearCityScores())

  it('adres: şehir, oyuncu ve tazeleme', () => {
    expect(cityScoresUrl('sinop', '')).toBe('/api/scores?level=sinop')
    expect(cityScoresUrl('sinop', 'Deniz', 3)).toBe('/api/scores?level=sinop&me=Deniz&r=3')
  })

  it('bozuk satırları düşürür, sayıları sınırlar, sıraya dizer', () => {
    const out = parseCityScores({ scores: [row(3), null, { name: 5 }, row(1, { items: 99, hero: 'x' }), { ...row(2), timeMs: 'a' }], total: 25 })
    expect(out.rows.map((r) => r.rank)).toEqual([1, 3])
    expect(out.rows[0].items).toBe(3)
    expect(out.rows[0].hero).toBeNull()
    expect(out.total).toBe(25)
    expect(parseCityScores(undefined)).toEqual({ rows: [], total: 0 })
  })

  it('ilk onu ve kendi satırını gösterir; liderle farkı bulur', () => {
    const rows = parseCityScores({ scores: [...Array.from({ length: 10 }, (_, i) => row(i + 1)), row(14, { me: true })] }).rows
    expect(visibleRows(rows, 5).map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 14])
    expect(gapToLeader(rows, rows[0])).toBeNull()
    expect(gapToLeader(rows, rows[3])).toBe(3000)
  })

  it('aynı anda gelen iki isteği birleştirir, önbellekten verir, Tekrar Dene atlar', async () => {
    const f = vi.fn(() => ok([row(1)]))
    const [a, b] = await Promise.all([loadCityScores('sinop', '', undefined, 0, f as never), loadCityScores('sinop', '', undefined, 0, f as never)])
    expect(f).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
    await loadCityScores('sinop', '', undefined, 0, f as never)
    expect(f).toHaveBeenCalledTimes(1)
    expect(cachedCityScores('sinop', '')).not.toBeNull()
    expect(cachedCityScores('sinop', '', Date.now() + CACHE_MS + 1)).toBeNull()
    await loadCityScores('sinop', '', undefined, 1, f as never)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('iptal yalnız çağıranı bırakır; hata önbelleğe girmez', async () => {
    const ac = new AbortController()
    const f = vi.fn(() => ok([row(1)]))
    const p = loadCityScores('bursa', '', ac.signal, 0, f as never)
    ac.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    await new Promise((r) => setTimeout(r, 0))
    expect(cachedCityScores('bursa', '')).not.toBeNull()
    const bad = vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response))
    await expect(loadCityScores('van', '', undefined, 0, bad as never)).rejects.toThrow('HTTP 500')
    expect(cachedCityScores('van', '')).toBeNull()
  })
})
