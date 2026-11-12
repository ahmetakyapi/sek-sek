import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { SCARVES, completes, dailyChallenge, dayKey, meets, weekKey, weeklyChallenge } from '../lib/extras'
import { bossLevel } from '../game/levels'
import { defaultSave, nextUnplayed, resumeFor } from '../lib/storage'

describe('günün şehri ve haftanın görevi', () => {
  it('aynı gün aynı görev, açılmamış şehir çıkmaz', () => {
    for (let i = 0; i < 400; i++) {
      const d = new Date(2026, 0, 1 + i)
      const unlocked = i % LEVELS.length
      const a = dailyChallenge(d, LEVELS, unlocked)
      expect(a).toEqual(dailyChallenge(new Date(d.getTime() + 3600_000), LEVELS, unlocked))
      expect(LEVELS.findIndex((l) => l.id === a.levelId)).toBeLessThanOrEqual(unlocked)
      const w = weeklyChallenge(d, LEVELS, unlocked)
      expect(LEVELS.findIndex((l) => l.id === w.levelId)).toBeLessThanOrEqual(unlocked)
      expect(w.kinds).toHaveLength(2)
    }
  })

  it('dash atmadan bitir yalnız Kolay şehirde, sıfır düşüş yalnız Zor olmayan şehirde istenir', () => {
    for (let i = 0; i < 800; i++) {
      const ch = dailyChallenge(new Date(2026, 0, 1 + i), LEVELS, LEVELS.length - 1)
      const l = LEVELS.find((x) => x.id === ch.levelId)!
      if (ch.kinds.includes('noDash')) expect(l.difficulty).toBe('Kolay')
      if (ch.kinds.includes('noFall')) expect(['Kolay', 'Orta']).toContain(l.difficulty)
    }
  })

  it('hafta pazartesi başlar, yıl sonunda bölünmez', () => {
    expect(weekKey(new Date(2026, 10, 9))).toBe(weekKey(new Date(2026, 10, 15)))
    expect(weekKey(new Date(2026, 10, 15))).not.toBe(weekKey(new Date(2026, 10, 16)))
    expect(weekKey(new Date(2026, 11, 31))).toBe(weekKey(new Date(2027, 0, 1)))
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('görev koşulları ve Rahat Mod', () => {
    const l = LEVELS[0]
    const run = { timeMs: l.medals[0] * 1000, deaths: 0, dashes: 0, items: [true, true, true], relaxed: false }
    for (const k of ['noFall', 'fewFalls', 'noDash', 'silver', 'gold', 'collector'] as const) expect(meets(k, l, run)).toBe(true)
    expect(meets('gold', l, { ...run, timeMs: run.timeMs + 1 })).toBe(false)
    expect(meets('collector', l, { ...run, items: [true, false, true] })).toBe(false)
    const ch = { key: 'x', levelId: l.id, kinds: ['noFall' as const] }
    expect(completes(ch, l, run)).toBe(true)
    expect(completes(ch, l, { ...run, relaxed: true })).toBe(false)
    expect(completes(ch, LEVELS[1], run)).toBe(false)
  })

  it('atkılar: ilki açık, sonuncusu bütün nazarları ister', () => {
    expect(SCARVES[0].need).toBe(0)
    expect(SCARVES[SCARVES.length - 1].need).toBe(LEVELS.length)
    expect(new Set(SCARVES.map((s) => s.id)).size).toBe(SCARVES.length)
  })
})

describe('boss koşusu', () => {
  it('her şehrin arena bölümü: başlangıç, bayrak, boss, kapı ve çıkış var; tabela yok', () => {
    for (const l of LEVELS) {
      const b = bossLevel(l)
      const w = new World(b)
      expect(w.boss, l.id).toBeTruthy()
      expect(w.checkpoints.length, l.id).toBe(1)
      expect(b.map.join('').includes('?'), l.id).toBe(false)
      expect(w.exit.x, l.id).toBeGreaterThan(w.boss!.x)
    }
  })
})

describe('oynanmamış şehre yönlendirme', () => {
  const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { timeMs: 1000, deaths: 0, items: [true, true, true] }]))
  const all = LEVELS.map((l) => l.id)
  it('sona varmış ama araya giren şehirleri oynamamış oyuncu ilk oynanmamışa gider', () => {
    const s = { ...defaultSave(), unlocked: LEVELS.length - 1, best: done(all.filter((id) => !['eskisehir', 'kayseri', 'hatay'].includes(id))) }
    expect(LEVELS[resumeFor(s)].id).toBe('eskisehir')
    // son şehirden sonra sıradaki de oynanmamış ilk şehir
    expect(LEVELS[nextUnplayed(s, LEVELS.length - 1)!].id).toBe('eskisehir')
  })
  it('hepsi bitmişse devam son şehirde kalır, sıradaki yoktur', () => {
    const s = { ...defaultSave(), unlocked: LEVELS.length - 1, best: done(all) }
    expect(resumeFor(s)).toBe(LEVELS.length - 1)
    expect(nextUnplayed(s, LEVELS.length - 1)).toBeNull()
  })
  it('yolun ortasındaki oyuncu kaldığı şehirden devam eder', () => {
    const s = { ...defaultSave(), unlocked: 3, best: done(all.slice(0, 3)) }
    expect(resumeFor(s)).toBe(3)
  })
})
