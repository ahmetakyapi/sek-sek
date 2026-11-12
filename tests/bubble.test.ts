/** Konuşma baloncuğu karakterin üstüne hiçbir durumda binmez (yukarıda yer olmasa da, ekran dar olsa da). */
import { describe, expect, it } from 'vitest'
import { placeBubble } from '../game/render'

describe('konuşma baloncuğu', () => {
  it('karakterin kutusuyla hiç çakışmaz', () => {
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    for (let i = 0; i < 5000; i++) {
      const W = 360 + rnd() * 2600
      const H = 320 + rnd() * 1600
      const u = W > 1200 ? 2 : 1
      const bw = Math.min(W - 24 * u, (180 + rnd() * 160) * u)
      const bh = (50 + rnd() * 70) * u
      const hx = rnd() * (W - 40 * u)
      // karakter ekranın herhangi bir yüksekliğinde (HUD'ın hemen altı dahil)
      const hy = 64 * u + rnd() * (H - 64 * u - 70 * u)
      const hero = { x0: hx, x1: hx + 30 * u, y0: hy, y1: hy + 64 * u }
      const tipX = hx + rnd() * 60 * u - 15 * u
      const tipY = hy - rnd() * 10 * u
      const [bx, by] = placeBubble({ tipX, tipY, bw, bh, tail: 8 * u, W, H, top: 64 * u, edge: 12 * u, gap: 8 * u }, hero)
      const overlap = bx < hero.x1 && bx + bw > hero.x0 && by < hero.y1 && by + bh > hero.y0
      // ekran baloncuğu karakterin ne yanına ne üstüne ne altına sığdırmıyorsa (pratikte olmaz) atlanır
      const fits = H - 12 * u - 64 * u >= bh + 64 * u + 8 * u
      if (fits) expect(overlap, JSON.stringify({ W, H, hero, bx, by, bw, bh })).toBe(false)
    }
  })

  it('yukarıda yer varsa konuşanın üstünde açılır', () => {
    const hero = { x0: 500, x1: 530, y0: 400, y1: 464 }
    const [, by] = placeBubble({ tipX: 520, tipY: 396, bw: 300, bh: 90, tail: 8, W: 1280, H: 720, top: 64, edge: 12, gap: 8 }, hero)
    expect(by + 90).toBeLessThanOrEqual(400)
  })
})
