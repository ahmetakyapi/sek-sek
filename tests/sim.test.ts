import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { emptyInput, type LevelDef } from '../game/types'

const mk = (map: string[], extra: Partial<LevelDef> = {}): World =>
  new World({ ...LEVELS[0], map, ...extra })

const run = (w: World, secs: number, patch: Partial<ReturnType<typeof emptyInput>> = {}) => {
  for (let i = 0; i < secs * 120; i++) w.step(1 / 120, { ...emptyInput(), ...patch, jumpPressed: i === 0 && !!patch.jumpPressed })
}

describe('bölüm verisi', () => {
  it.each(LEVELS.map((l) => [l.name, l]))('%s: başlangıç, çıkış, 3 hatıra, 3 bilgi', (_n, l) => {
    const w = new World(l)
    expect(l.map.length).toBe(24)
    expect(w.exit.w).toBeGreaterThan(0)
    expect(w.pickups).toHaveLength(3)
    expect(l.facts).toHaveLength(3)
    expect(w.signs.length).toBeLessThanOrEqual(l.hints.length)
  })

  it('il plakaları doğru', () => {
    expect(LEVELS.map((l) => [l.name, l.plate])).toEqual([
      ['İstanbul', 34],
      ['İzmir', 35],
      ['Ankara', 6],
      ['Mardin', 47],
      ['Malatya', 44],
      ['Çorum', 19],
      ['Sivas', 58],
      ['Bayburt', 69],
    ])
  })
})

describe('fizik', () => {
  const flat = ['          ', '          ', '          ', ' P        ', '##########']

  it('yere oturur ve yürür', () => {
    const w = mk(flat)
    run(w, 0.3)
    expect(w.player.grounded).toBe(true)
    const x0 = w.player.x
    run(w, 0.5, { right: true })
    expect(w.player.x).toBeGreaterThan(x0 + 30)
  })

  it('zıplar ve yaklaşık 3 kare yükselir', () => {
    const w = mk(['          ', '          ', '          ', '          ', '          ', ' P        ', '##########'])
    run(w, 0.2)
    const y0 = w.player.y
    let minY = y0
    w.step(1 / 120, { ...emptyInput(), jump: true, jumpPressed: true })
    for (let i = 0; i < 80; i++) {
      w.step(1 / 120, { ...emptyInput(), jump: true })
      minY = Math.min(minY, w.player.y)
    }
    expect(y0 - minY).toBeGreaterThan(44)
    expect(y0 - minY).toBeLessThan(56)
  })

  it('dikene düşünce ölür, bayraktan doğar', () => {
    const w = mk(['          ', ' P  F     ', '####### ^#', '##########'])
    run(w, 0.2)
    run(w, 0.5, { right: true })
    expect(w.checkpointIndex).toBe(0)
    run(w, 2, { right: true })
    expect(w.deaths).toBeGreaterThan(0)
    run(w, 1)
    expect(w.player.dead).toBe(false)
    expect(Math.abs(w.player.x - w.spawn.x)).toBeLessThan(40)
  })

  it('atılma havada bir kez, yerde yenilenir', () => {
    const w = mk(flat)
    run(w, 0.2)
    w.step(1 / 120, { ...emptyInput(), dashPressed: true, right: true })
    expect(w.player.canDash).toBe(false)
    run(w, 0.6)
    expect(w.player.canDash).toBe(true)
  })

  it('hatıra toplanınca olay üretir', () => {
    const w = mk([' P C      ', '##########'])
    run(w, 0.6, { right: true })
    expect(w.pickups[0].taken).toBe(true)
  })

  it('çıkışa dokununca bölüm biter', () => {
    const w = mk(['          ', ' P  E     ', '##########'])
    run(w, 1, { right: true })
    expect(w.complete).toBe(true)
  })
})
