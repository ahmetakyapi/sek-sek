import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { cityMatches } from '../lib/cityFilter'

const ist = LEVELS[0]
const base = { query: '', filter: 'all' as const, unlocked: 5, player: true }

describe('Şehirler süzgeci', () => {
  it('arama: ad Türkçe harf farkı olmadan, plaka baştan', () => {
    const izmir = LEVELS.find((l) => l.id === 'izmir')!
    const i = LEVELS.indexOf(izmir)
    expect(cityMatches(izmir, i, { ...base, query: 'IZMIR' })).toBe(true)
    expect(cityMatches(izmir, i, { ...base, query: '35' })).toBe(true)
    expect(cityMatches(izmir, i, { ...base, query: 'ankara' })).toBe(false)
  })
  it('eksik hatıra, altın yok, lider değilim; süzgeçte kilitli şehir görünmez', () => {
    const full = { timeMs: 1000, deaths: 0, items: [true, true, true] }
    const slow = { timeMs: 10_000_000, deaths: 0, items: [true, false, true] }
    expect(cityMatches(ist, 0, { ...base, filter: 'missing', best: full })).toBe(false)
    expect(cityMatches(ist, 0, { ...base, filter: 'missing', best: slow })).toBe(true)
    expect(cityMatches(ist, 0, { ...base, filter: 'missing' })).toBe(true)
    expect(cityMatches(ist, 0, { ...base, filter: 'nogold', best: full })).toBe(false)
    expect(cityMatches(ist, 0, { ...base, filter: 'nogold', best: slow })).toBe(true)
    // Oynanmadı: rekoru olmayan açık şehir
    expect(cityMatches(ist, 0, { ...base, filter: 'new', best: undefined })).toBe(true)
    expect(cityMatches(ist, 0, { ...base, filter: 'new', best: { timeMs: 60000, deaths: 0, items: [true, true, true] } })).toBe(false)
    expect(cityMatches(LEVELS[9], 9, { ...base, filter: 'missing' })).toBe(false)
    expect(cityMatches(LEVELS[9], 9, base)).toBe(true)
  })
})
