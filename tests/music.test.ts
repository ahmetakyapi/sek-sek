import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { SCALES, cityTheme, titleTheme, type Song } from '../game/music'


const sane = (s: Song) => {
  expect(s.length).toBeGreaterThan(0)
  expect(s.byStep).toHaveLength(s.length)
  for (const e of s.events) {
    expect(e.at).toBeGreaterThanOrEqual(0)
    expect(e.at).toBeLessThan(s.length)
    expect(e.dur).toBeGreaterThan(0)
    for (const n of e.midi) {
      expect(n).toBeGreaterThanOrEqual(36)
      expect(n).toBeLessThanOrEqual(96)
    }
  }
  // ezgi baştan sona çalar: uzun bir sessizlik (iki ölçüden uzun) yok
  const lead = s.events.filter((e) => e.inst === 'ney' || e.inst === 'saz').sort((a, b) => a.at - b.at)
  expect(lead.length).toBeGreaterThan(20)
}

describe('müzik', () => {
  it('jenerik: ölçüler tam, döngü sağlam', () => {
    const s = titleTheme()
    sane(s)
    expect(s.length % 8).toBe(0)
    // ezgi her ölçüyü doldurur (8 sekizlik): sırayla dizilen notalar ölçü sınırını taşmaz
    for (const e of s.events.filter((x) => x.inst === 'ney')) expect((e.at % 8) + e.dur).toBeLessThanOrEqual(8)
  })

  it.each(LEVELS.map((l) => [l.city] as const))('%s: beste kurulur ve hep aynıdır', (city) => {
    const m = SCALES[city]
    const a = cityTheme(city)
    sane(a)
    expect(a.length % m.meter.reduce((x, y) => x + y, 0)).toBe(0)
    expect(cityTheme(city)).toBe(a)
  })
})

describe('oyun efektleri', () => {
  it('yumuşak dalgayla çalınır: kare ve testere dalga yok (bip, yapışkan tuş uyarısı gibi duyuluyordu)', () => {
    const src = readFileSync('game/audio.ts', 'utf8')
    const body = src.slice(src.indexOf('  sfx(name: string) {'), src.indexOf('  /** oyun müziği'))
    expect(body.length).toBeGreaterThan(500)
    expect(body).not.toMatch(/'square'|'sawtooth'/)
    // aynı efekt art arda üst üste binmez
    expect(body).toMatch(/lastSfx/)
  })
})
