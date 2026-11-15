import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { PHYS, World, restore, snapshot } from '../game/sim'
import { T, emptyInput, type Input } from '../game/types'

/** İkinci defterin mekanikleri: halat (L), teleferik halatı (R), derin su (W). */
const mk = (map: string[]) => new World({ ...LEVELS[0], map, wind: 0 })
const step = (w: World, secs: number, inp: Partial<Input> = {}, press = false) => {
  for (let i = 0; i < Math.round(secs * 120); i++) w.step(1 / 120, { ...emptyInput(), ...inp, jumpPressed: press && i === 0 })
}

describe('halat', () => {
  const map = ['          ', '    L     ', '    L     ', '    L     ', '    L     ', ' P  L     ', '##########']
  it('havadayken değince tutunulur, yukarı tırmanılır, zıplayınca bırakılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    expect(w.player.hang).toBe(1)
    // halatın ortasına çekildi
    expect(w.player.x + w.player.w / 2).toBeCloseTo(4 * T + T / 2, 0)
    const y0 = w.player.y
    step(w, 0.4, { up: true })
    expect(w.player.y).toBeLessThan(y0 - 20)
    // halatın tepesinden yukarı çıkılmaz
    step(w, 2, { up: true })
    expect(w.player.y).toBeGreaterThanOrEqual(T - 4)
    step(w, 0.05, { jump: true }, true)
    expect(w.player.hang).toBe(0)
    expect(w.player.vy).toBeLessThan(0)
    // halatın üstüne ya da yanına zıplayarak çıkılabilir
  })

  it('tutunmadan zıplayıp yeniden yakalayarak da tırmanılır (çözücü "yukarı" basmaz)', () => {
    const tall = ['          ', ...Array.from({ length: 12 }, () => '    L     '), ' P  L     ', '##########']
    const w = mk(tall)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    const y0 = w.player.y
    for (let k = 0; k < 4; k++) step(w, 0.32, { jump: true }, true)
    expect(w.player.hang).toBe(1)
    expect(w.player.y).toBeLessThan(y0 - 16)
  })

  it('aşağı inerken halat biterse bırakır; dash halattan atılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    step(w, 2, { down: true })
    expect(w.player.hang).toBe(0)
    const w2 = mk(map)
    step(w2, 0.5)
    step(w2, 0.75, { right: true, jump: true }, true)
    w2.step(1 / 120, { ...emptyInput(), right: true, dashPressed: true })
    expect(w2.player.hang).toBe(0)
    expect(w2.player.dashTime).toBeGreaterThan(0)
  })

  it('anlık görüntüyle geri yüklenir (çözücü)', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.75, { right: true, jump: true }, true)
    const s = snapshot(w)
    step(w, 1, { down: true })
    restore(w, s)
    expect(w.player.hang).toBe(1)
  })
})

describe('teleferik halatı', () => {
  const map = ['            ', '            ', '  RRRRRRRR  ', '            ', '            ', ' P          ', '############']
  it('altından zıplayınca asılınır, elle ilerlenir, zıplayınca bırakılır', () => {
    const w = mk(map)
    step(w, 0.5)
    step(w, 0.5, { right: true, jump: true }, true)
    expect(w.player.hang).toBe(2)
    const x0 = w.player.x
    step(w, 1, { right: true })
    expect(w.player.x).toBeGreaterThan(x0 + PHYS.cableMove * 0.8)
    expect(w.player.hang).toBe(2)
    // halatın bittiği yerde durur
    step(w, 3, { right: true })
    expect(w.player.x + w.player.w / 2).toBeLessThan(10 * T)
    step(w, 0.05, { jump: true }, true)
    expect(w.player.hang).toBe(0)
    step(w, 1)
    expect(w.player.grounded).toBe(true)
  })
})

describe('derin su', () => {
  const map = ['            ', ' P          ', '###WWWWW####', '###WWWWW####', '###WWWWW####', '############']
  it('suya giren boğulmaz, yavaş batar, kulaçla yükselir ve karşı kıyıya çıkar', () => {
    const w = mk(map)
    step(w, 0.3)
    step(w, 0.6, { right: true })
    step(w, 0.5)
    expect(w.player.dead).toBe(false)
    expect(w.player.swim).toBe(true)
    expect(w.player.vy).toBeLessThanOrEqual(PHYS.swimSink)
    const y = w.player.y
    step(w, 0.1, { jump: true }, true)
    expect(w.player.y).toBeLessThan(y)
    // kulaç kulaç sağa yüz, kıyıya çık
    for (let k = 0; k < 20 && !(w.player.grounded && !w.player.swim && w.player.x > 8 * T); k++) step(w, 0.25, { right: true, jump: true }, true)
    expect(w.player.dead).toBe(false)
    expect(w.player.x).toBeGreaterThan(8 * T)
    expect(w.player.swim).toBe(false)
    expect(w.deaths).toBe(0)
  })

  it('öldüren su (~) öldürmeye devam eder', () => {
    const w = mk(['            ', ' P          ', '###~~~~~####', '############'])
    step(w, 0.3)
    step(w, 1, { right: true })
    expect(w.deaths + (w.player.dead ? 1 : 0)).toBeGreaterThan(0)
  })
})
