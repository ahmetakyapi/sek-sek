import { describe, expect, it } from 'vitest'
import { World } from '@/game/sim'
import { ROWS, customLevel, decodeMap, encodeMap, validateMap } from '@/lib/customLevel'
import { KEEP, STAMPS, TEMPLATES, cut, fillRect, floodFill, mirrorRect, mirrorRows, placePattern } from '@/lib/editorKit'
import { solve } from '../scripts/solver'

/** 80 sütun düz zemin (üst yüzey 20. satır), başlangıç solda, çıkış sağda */
const ground = () => {
  const m = Array.from({ length: ROWS }, (_, y) => (y >= 20 ? '#' : ' ').repeat(80))
  return m.map((r, y) => (y === 19 ? ' P' + r.slice(2, 77) + 'E  ' : r))
}

describe('başlangıç şablonları', () => {
  for (const tpl of TEMPLATES)
    it(`${tpl.name}: geçerli, kodlanır ve çözücüyle biter`, () => {
      const map = tpl.make()
      expect(validateMap(map)).toBeNull()
      expect(decodeMap(encodeMap(map, 'istanbul'))).toMatchObject({ map, city: 'istanbul' })
      expect(solve(customLevel(map, 'istanbul'), { exitOnly: true, budget: 20000 }).won).toBe(true)
    })
})

describe('hazır parçalar', () => {
  it('yalnız izinli simgeler ve imleç parçanın içinde', () => {
    for (const s of STAMPS) {
      expect(s.ax).toBeLessThan(s.rows[0].length)
      expect(s.ay).toBeLessThan(s.rows.length)
      expect(new Set(s.rows.map((r) => r.length)).size).toBe(1)
      const probe = placePattern(ground(), s, 30, 19).map((r) => r.replace(/[PE]/g, ' '))
      expect(probe.join('')).not.toContain(KEEP)
    }
  })

  for (const s of STAMPS)
    it(`${s.name}: düz zemine konunca harita geçerli ve çözücüyle biter`, () => {
      const map = placePattern(ground(), s, 30, 19)
      expect(validateMap(map)).toBeNull()
      const level = customLevel(map, 'kayseri')
      expect(() => new World(level)).not.toThrow()
      expect(solve(level, { exitOnly: true, budget: 30000 }).won).toBe(true)
    })

  it('duvar haritanın tepesine dek örülür, tekil simgenin eskisi kalkar', () => {
    const door = STAMPS.find((s) => s.id === 'keyDoor')!
    const map = placePattern(ground(), door, 30, 19)
    for (let y = 0; y < 15; y++) expect(map[y][39]).toBe('#')
    const twice = placePattern(map, door, 50, 19)
    expect(twice.join('').split('K').length - 1).toBe(1)
  })
})

describe('araçlar', () => {
  it('kova aynı karolu bölgeyi doldurur, sınırda durur', () => {
    const m = ground()
    const out = floodFill(m, 10, 22, '~')
    expect(out.slice(20).every((r) => /^~+$/.test(r))).toBe(true)
    expect(out[19]).toBe(m[19])
    expect(floodFill(m, 10, 22, '#')).toBe(m)
  })

  it('dikdörtgen, kesit ve ayna', () => {
    const m = fillRect(ground(), { x0: 12, y0: 18, x1: 10, y1: 17 }, '=')
    expect(m[17].slice(10, 13)).toBe('===')
    expect(m[18].slice(9, 14)).toBe(' === ')
    expect(cut(m, { x0: 10, y0: 17, x1: 12, y1: 18 })).toEqual(['===', '==='])
    expect(mirrorRows(['>#  <'])).toEqual(['>  #<'])
    const r = { x0: 0, y0: 19, x1: 79, y1: 19 }
    const flipped = mirrorRect(ground(), r)
    expect(flipped[19][78]).toBe('P')
    expect(flipped[19][2]).toBe('E')
    expect(mirrorRect(flipped, r)).toEqual(ground())
  })
})
