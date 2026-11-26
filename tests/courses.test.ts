import { describe, expect, it } from 'vitest'
import { ALL_CHALLENGES, LEGEND_UNLOCK, MASTER_COURSES, challengeLevel, courseOpen, goldOf } from '../game/challenges'
import { LEVELS } from '../game/levels'
import { minTimeMs } from '../lib/antiCheat'

describe('Usta ve Efsane Parkurları', () => {
  it('kimlikler tekil, haritalar düzgün', () => {
    const ids = ALL_CHALLENGES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of MASTER_COURSES) {
      expect(LEVELS.some((l) => l.id === c.level), c.id).toBe(true)
      expect(c.map, c.id).toBeDefined()
      const map = c.map!
      expect(map.length, c.id).toBe(24)
      expect(new Set(map.map((r) => r.length)).size, c.id).toBe(1)
      const all = map.join('')
      expect(all.split('P').length - 1, c.id).toBe(1)
      expect(all.includes('E'), c.id).toBe(true)
      // parkurda toplanan, konuşan ya da final işareti yok
      expect(/[C$!n?@&QG]/.test(all), c.id).toBe(false)
      expect(c.id.startsWith(c.tier === 'efsane' ? 'efsane-' : 'usta-'), c.id).toBe(true)
      expect(c.par).toBeGreaterThan(5)
      expect(goldOf(c)).toBe(c.gold ?? Math.ceil(c.par * 0.85))
    }
  })

  it('altın süre hile önleme alt sınırının en az 1,3 katı (dürüst altın koşusu reddedilmez)', () => {
    for (const c of ALL_CHALLENGES) expect(goldOf(c) * 1000, c.id).toBeGreaterThanOrEqual(minTimeMs(challengeLevel(c)) * 1.3)
  })

  it('Efsane Parkuru şehir + üç Usta Parkuruyla açılır', () => {
    const usta = MASTER_COURSES.filter((c) => !c.tier)
    const legend = MASTER_COURSES.find((c) => c.tier === 'efsane')
    if (!legend) return
    const cities = new Set(MASTER_COURSES.map((c) => c.level))
    expect(courseOpen(usta[0], cities, {})).toBe(true)
    expect(courseOpen(usta[0], new Set(), {})).toBe(false)
    expect(courseOpen(legend, cities, {})).toBe(false)
    const best = Object.fromEntries(usta.slice(0, LEGEND_UNLOCK).map((c) => [c.id, 20000]))
    expect(courseOpen(legend, cities, best)).toBe(true)
    expect(courseOpen(legend, new Set(), best)).toBe(false)
  })
})
