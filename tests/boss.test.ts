import { describe, expect, it } from 'vitest'
import { BOSSES, makeBoss, touchBoss, updateBoss, type BossHost } from '../game/boss'
import { LEVELS } from '../game/levels'
import { fightBoss } from '../scripts/bossbot'

describe('patron kuralları', () => {
  const host = (x: number, y: number): BossHost => ({ player: { x, y, w: 12, h: 14, vy: 0, dead: false, dashTime: 0 }, projectiles: [], events: [] })

  it('uyur; oyuncu meydana girince uyanır, işaret vermeden saldırmaz', () => {
    const b = makeBoss(BOSSES.kocaeli, 300, 320, 100, 400)
    const far = host(-200, 306)
    for (let i = 0; i < 240; i++) updateBoss(b, far, 1 / 120)
    expect(b.state).toBe('sleep')
    const h = host(120, 306)
    updateBoss(b, h, 1 / 120)
    expect(b.state).toBe('intro')
    const seen: string[] = []
    for (let i = 0; i < 120 * 6 && b.state !== 'tired'; i++) {
      updateBoss(b, h, 1 / 120)
      if (seen[seen.length - 1] !== b.state) seen.push(b.state)
    }
    expect(seen.indexOf('warn')).toBeGreaterThanOrEqual(0)
    expect(seen.indexOf('warn')).toBeLessThan(seen.indexOf('attack'))
    expect(b.state).toBe('tired')
  })

  it('saldırırken dokunmak yakar; yorgunken yandan zararsız, üstüne basış can götürür', () => {
    const b = makeBoss(BOSSES.kocaeli, 300, 320, 100, 400)
    b.state = 'attack'
    expect(touchBoss(b, host(b.x + 4, b.y + 6))).toBe('kill')
    b.state = 'tired'
    expect(touchBoss(b, host(b.x + 4, b.y + 6))).toBeNull()
    const h = host(b.x + 4, b.y - 10)
    h.player.vy = 120
    expect(touchBoss(b, h)).toBe('hit')
    expect(b.hp).toBe(BOSSES.kocaeli.hp - 1)
    expect(b.state).toBe('hurt')
  })

  it('her şehrin patronu tanımlı: en az 3 can, her can için bir hareket sırası', () => {
    for (const l of LEVELS) {
      const d = BOSSES[l.city]
      expect(d.hp).toBeGreaterThanOrEqual(3)
      expect(d.moves.length).toBeGreaterThan(0)
      expect(d.taunt.length).toBeGreaterThan(20)
      expect(d.tauntEn.length).toBeGreaterThan(20)
    }
  })
})

describe('patronlar yenilebilir (bot gerçek fizikle dövüşür)', () => {
  it.each(LEVELS.map((l) => [l.name, l]))('%s: bot da zayıf oyuncu botu da yener', (_n, l) => {
    const r = fightBoss(l)
    expect(r.won, `kalan can ${r.hpLeft}`).toBe(true)
    expect(r.deaths).toBeLessThanOrEqual(2)
    const weak = fightBoss(l, { weak: true })
    expect(weak.won, `zayıf oyuncu: kalan can ${weak.hpLeft}`).toBe(true)
  }, 60_000)
})
