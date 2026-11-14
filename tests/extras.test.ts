import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { SCARVES, completes, dailyChallenge, dailyRun, ruleFits, ruleLimit, dailyScore, dayKey, duelFirst, duelResult, istanbulDay, liveStreak, markDaily, meets, mergeDaily, shiftDay, weekKey, weeklyChallenge, type DuelRounds } from '../lib/extras'
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

describe('Günlük Meydan Okuma', () => {
  it('herkes için aynı gün aynı şehir ve kural; art arda iki gün aynı şehir gelmez', () => {
    let prev = ''
    for (let i = 0; i < 120; i++) {
      const day = shiftDay('2026-11-01', i)
      const a = dailyRun(day, LEVELS)
      expect(dailyRun(day, LEVELS)).toEqual(a)
      expect(a.levelId).not.toBe(prev)
      prev = a.levelId
    }
  })
  it('skor süreye cezaları ekler', () => {
    expect(dailyScore('ceza', 60000, 2, 0)).toBe(60000 + 16000)
    expect(dailyScore('hatira', 60000, 1, 1)).toBe(60000 + 3000 + 40000)
    expect(dailyScore('hiz', 60000, 0, 3)).toBe(60000)
  })
  it('seri dün oynandıysa artar, gün atlanınca sıfırdan başlar', () => {
    let m = markDaily(null, '2026-11-10', 90000)
    m = markDaily(m, '2026-11-10', 80000)
    expect(m).toEqual({ day: '2026-11-10', bestMs: 80000, streak: 1 })
    m = markDaily(m, '2026-11-11', 99000)
    expect(m.streak).toBe(2)
    expect(liveStreak(m, '2026-11-12')).toBe(2)
    expect(liveStreak(m, '2026-11-13')).toBe(0)
    expect(markDaily(m, '2026-11-13', 1).streak).toBe(1)
    expect(mergeDaily(m, { day: '2026-11-11', bestMs: 50000, streak: 1 })).toEqual({ day: '2026-11-11', bestMs: 50000, streak: 2 })
    // buluttan çekmeden oynanan gün seriyi sıfırlamaz
    expect(mergeDaily({ day: '2026-11-12', bestMs: 1, streak: 1 }, { day: '2026-11-11', bestMs: 2, streak: 6 })?.streak).toBe(7)
  })
  it('İstanbul saatiyle gün döner', () => {
    expect(istanbulDay(new Date('2026-11-14T21:30:00Z'))).toBe('2026-11-15')
  })
})

describe('Düello', () => {
  const r = (score: number) => ({ timeMs: score, deaths: 0, score })
  it('tek turda düşük skor kazanır', () => {
    expect(duelResult([[r(5), r(6)]], 1)).toEqual({ over: true, winner: 0 })
    expect(duelResult([[r(5), null]], 1).over).toBe(false)
  })
  it('üç turluda iki tur alan kazanır, beraberlik fazladan tur açar', () => {
    expect(duelResult([[r(9), r(6)], [r(5), r(6)]], 3).over).toBe(false)
    expect(duelResult([[r(9), r(6)], [r(5), r(6)], [r(9), r(8)]], 3)).toEqual({ over: true, winner: 1 })
    const ties: DuelRounds = [[r(5), r(5)], [r(5), r(5)], [r(5), r(5)], [r(5), r(5)], [r(4), r(5)]]
    expect(duelResult(ties, 3)).toEqual({ over: true, winner: 0 })
    expect(duelResult(ties.slice(0, 4).concat([[r(5), r(5)]]), 3)).toEqual({ over: true, winner: -1 })
    expect(duelFirst(0)).toBe(0)
    expect(duelFirst(1)).toBe(1)
  })
})

describe('kurallar', () => {
  it('Dash’siz yalnız kanıtlı şehirlerde çıkar; günün kuralı şehre uyar', () => {
    for (let i = 0; i < 200; i++) {
      const r = dailyRun(shiftDay('2026-11-01', i), LEVELS)
      expect(ruleFits(r.rule, LEVELS.find((l) => l.id === r.levelId)!)).toBe(true)
    }
    expect(ruleFits('dashsiz', LEVELS.find((l) => l.id === 'istanbul')!)).toBe(false)
    expect(ruleFits('dashsiz', LEVELS.find((l) => l.id === 'edirne')!)).toBe(true)
  })
  it('Zamana Karşı sınırı bronz süredir; Tek Can ve Bayraksız skora ceza eklemez', () => {
    const l = LEVELS[0]
    expect(ruleLimit('zaman', l)).toBe(l.medals[2])
    expect(ruleLimit('ceza', l)).toBeNull()
    expect(dailyScore('tekcan', 50000, 0, 0)).toBe(50000)
    expect(dailyScore('bayraksiz', 50000, 4, 1)).toBe(50000)
  })
})
