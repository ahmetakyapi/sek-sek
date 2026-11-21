import { SOLVER_TIME } from '../game/medals'
import { describe, expect, it } from 'vitest'
import { CHALLENGES, challengeLevel } from '../game/challenges'
import { record } from '../game/ghost'
import { LEVELS } from '../game/levels'
import { World, restore, snapshot } from '../game/sim'
import { mirrorLevel } from '../game/mirror'
import { ghostProblem, minScoreMs, minTimeMs } from '../lib/antiCheat'
import { dailyRun } from '../lib/extras'
import { holdPlates, runMacro, solve } from '../scripts/solver'

/**
 * Hile önlemenin alt sınırı gerçek oyuncuyu asla reddetmemeli: her şehrin çözücü süresi (verify-levels çözücüsü,
 * düşmansız ve boss'suz, çıkışa en kısa aramayla) sınırın rahatça üstünde. Çözücü kusursuz koşmaz; bir speedrun'cı
 * ondan hızlı olabilir, bu yüzden sınır fiziğe dayanır (dash hızıyla kesintisiz koşu × 0,6) ve burada payı ölçülür.
 */
/** çözücünün çıkışa vardığı süre (sn): `npx tsx` ile solve(level, { exitOnly: true, trace: true }) yolunu oynatarak */
const SOLVER = SOLVER_TIME

describe('hile önleme: alt süre sınırı', () => {
  it('her şehrin çözücü süresi alt sınırın en az iki katı', () => {
    for (const l of LEVELS) {
      expect(SOLVER[l.id], l.id).toBeGreaterThan(0)
      expect(minTimeMs(l), l.id).toBeGreaterThan(5000)
      expect(minTimeMs(l) * 2, l.id).toBeLessThan(SOLVER[l.id] * 1000)
    }
  })

  it('mücadele ve turnuva kesitleri: çözücünün en hızlı süresi (par) sınırın üstünde', () => {
    for (const c of CHALLENGES) {
      const floor = minTimeMs(challengeLevel(c))
      expect(floor, c.id).toBeGreaterThan(0)
      expect(floor * 1.5, c.id).toBeLessThan(c.par * 1000)
      expect(minScoreMs(`mucadele:${c.id}`)).toBe(floor)
      expect(minScoreMs(`turnuva:2026-H46:${c.id}`)).toBe(floor)
    }
  })

  it('anahtardan sınır: şehir, günlük (o günün şehri), bilinmeyen anahtar', () => {
    const ist = LEVELS.find((l) => l.id === 'istanbul')!
    expect(minScoreMs('istanbul@s')).toBe(minTimeMs(ist))
    const day = '2026-11-15'
    expect(minScoreMs(`gunluk:${day}`)).toBe(minTimeMs(LEVELS.find((l) => l.id === dailyRun(day, LEVELS).levelId)!))
    expect(minScoreMs('yok@s')).toBe(0)
    expect(minScoreMs('mucadele:yok')).toBe(0)
  })

  it('Ayna Yolu aynı mesafeyi ister', () => {
    for (const l of LEVELS.slice(0, 5)) expect(Math.abs(minTimeMs(mirrorLevel(l)) - minTimeMs(l)), l.id).toBeLessThan(200)
  })
})

describe('hile önleme: hayalet', () => {
  // çözücünün gerçek fizikle koştuğu yol, oyundaki gibi kaydedilir
  const c = CHALLENGES.find((x) => x.id === 'corum-leblebi-2')!
  const level = challengeLevel(c)
  const real = (() => {
    const r = solve(level, { exitOnly: true, budget: 12000, trace: true })
    const w = new World(level)
    w.enemies.length = 0
    w.turrets.length = 0
    w.boss = null
    const rec: number[] = []
    for (const m of r.path) {
      restore(w, snapshot(w))
      holdPlates(w)
      runMacro(w, m, () => {
        w.events.length = 0
        if (w.started && !w.complete) record(rec, w)
      })
    }
    expect(w.complete).toBe(true)
    return rec
  })()

  it('gerçek koşunun hayaleti geçer', () => {
    expect(ghostProblem(level, real, 0)).toBeNull()
  })

  it('hızlandırılmış, ışınlanan ya da yarım kalan hayalet reddedilir', () => {
    // dört örnekten birini tutmak: aynı yol dörtte bir sürede (yürüyüş 400 px/sn, dash hızının üstünde)
    const fast = real.filter((_, i) => Math.floor(i / 3) % 4 === 0)
    expect(ghostProblem(level, fast, 0)).toMatch(/hızlı/)
    // ortada doğuş yeri olmayan bir yere sıçrama
    const jump = [...real]
    const mid = Math.floor(jump.length / 6) * 3
    for (let i = mid; i < jump.length; i += 3) jump[i] += 200
    expect(ghostProblem(level, jump, 5)).toMatch(/hızlı/)
    // çıkışa varmadan biten
    expect(ghostProblem(level, real.slice(0, Math.floor(real.length / 6) * 3), 0)).toMatch(/çıkış/)
    // başka yerden başlayan
    const moved = [...real]
    for (let i = 0; i < moved.length; i += 3) moved[i] += 600
    expect(ghostProblem(level, moved, 0)).toMatch(/başlangıç/)
    expect(ghostProblem(level, [1, 2, 3], 0)).toMatch(/kısa/)
  })

  it('ölüp bayrakta doğmak ışınlanma sayılır ama düşüş sayısını geçemez', () => {
    // koşunun ortasında başlangıca dönüp yeniden koşmak (başlangıç bir doğuş yeri)
    const half = real.slice(0, Math.floor(real.length / 6) * 3)
    const twice = [...half, ...real]
    expect(ghostProblem(level, twice, 1)).toBeNull()
    expect(ghostProblem(level, twice, 0)).toMatch(/düşüş/)
  })
})
