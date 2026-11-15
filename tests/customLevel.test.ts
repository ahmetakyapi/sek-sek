import { describe, expect, it } from 'vitest'
import { LEVELS } from '@/game/levels'
import { World } from '@/game/sim'
import { CITY_CODES, MAX_W, ROWS, SAMPLE_MAP, SYMBOLS, customLevel, customMedals, decodeMap, encodeMap, validateMap } from '@/lib/customLevel'
import { solve } from '../scripts/solver'

const blank = (w: number) => {
  const m = Array.from({ length: ROWS }, () => ' '.repeat(w))
  return m.map((r, y) => (y >= 20 ? '#'.repeat(w) : y === 19 ? ' P' + ' '.repeat(w - 4) + 'E ' : r))
}

describe('özel harita kodu', () => {
  it('örnek harita gidiş-dönüş', () => {
    const code = encodeMap(SAMPLE_MAP, 'kayseri')
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeMap(code)).toEqual({ map: SAMPLE_MAP, city: 'kayseri' })
  })

  it('her şehir ve her simge, uzun koşular dahil gidiş-dönüş', () => {
    const syms = SYMBOLS.filter((s) => s !== 'P' && s !== 'E' && s !== 'C')
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    for (const city of CITY_CODES) {
      const w = 40 + Math.floor(rnd() * (MAX_W - 40 + 1))
      const map = blank(w).map((r, y) =>
        y < 19 ? Array.from(r, () => (rnd() < 0.6 ? ' ' : syms[Math.floor(rnd() * syms.length)])).join('') : r,
      )
      const out = decodeMap(encodeMap(map, city))
      expect(out).toEqual({ map, city })
    }
    const wide = blank(MAX_W)
    const code = encodeMap(wide, 'bayburt')
    expect(code.length).toBeLessThan(60)
    expect(decodeMap(code)).toEqual({ map: wide, city: 'bayburt' })
  })

  it('şehir sırası bütün bölümleri kapsar', () => {
    expect(new Set(CITY_CODES)).toEqual(new Set(LEVELS.map((l) => l.city)))
  })

  it('bozuk ve geçersiz kodları reddeder', () => {
    const code = encodeMap(SAMPLE_MAP, 'istanbul')
    expect(decodeMap('')).toHaveProperty('error')
    expect(decodeMap('!!!')).toHaveProperty('error')
    expect(decodeMap(code.slice(0, -3))).toHaveProperty('error')
    const flipped = code.slice(0, 10) + (code[10] === 'A' ? 'B' : 'A') + code.slice(11)
    expect(decodeMap(flipped)).toHaveProperty('error')
    expect(decodeMap('AgAAPKEH1gdYB20')).toHaveProperty('error')
  })

  it('doğrulama: boyut, yasak karakter, P/E sayısı, hatıra sınırı', () => {
    expect(validateMap(SAMPLE_MAP)).toBeNull()
    expect(validateMap(SAMPLE_MAP.slice(1))).not.toBeNull()
    expect(validateMap(blank(39))).not.toBeNull()
    expect(validateMap(blank(321))).not.toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 0 ? 'Q' + r.slice(1) : r)))).not.toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r) => r.replace('P', ' ')))).toBe('Başlangıç (P) eksik.')
    expect(validateMap(SAMPLE_MAP.map((r) => r.replace('E', ' ')))).toBe('Çıkış (E) eksik.')
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 5 ? 'PP' + r.slice(2) : r)))).not.toBeNull()
    expect(validateMap(SAMPLE_MAP.map((r, y) => (y === 5 ? 'CCC' + r.slice(3) : r)))).not.toBeNull()
    expect(() => encodeMap(SAMPLE_MAP.map((r) => r.replace('E', ' ')), 'istanbul')).toThrow()
  })
})

describe('customLevel', () => {
  it('şehrin görünümü ve metinleri, özel ad ve madalya', () => {
    const l = customLevel(SAMPLE_MAP, 'mardin')
    const base = LEVELS.find((x) => x.city === 'mardin')!
    expect(l).toMatchObject({ id: 'ozel', city: 'mardin', name: 'Özel Harita', plate: base.plate, item: base.item, hints: [], npcs: [], finaleAt: undefined, wind: undefined })
    expect(l.facts).toBe(base.facts)
    expect(l.medals).toEqual(customMedals(60))
    expect(l.medals[0]).toBeLessThan(l.medals[1])
    expect(l.medals[1]).toBeLessThan(l.medals[2])
  })

  it('örnek harita oyunda kurulur ve çözücüyle bitirilir', () => {
    const l = customLevel(SAMPLE_MAP, 'istanbul')
    const w = new World(l)
    expect(w.pickups.length).toBe(1)
    expect(w.checkpoints.length).toBe(1)
    expect(solve(l, { exitOnly: true, budget: 4000 }).won).toBe(true)
  })
})
