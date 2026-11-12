/**
 * Performans (kalıcı kural): tuval her ekranda piksel bütçesini aşmaz. Tam ekran yoğunluğunda çizmek Retina, 4K ve
 * DPR 3 telefonlarda kare kaçırtıyordu. Kare kaçırmanın tarayıcıdaki kanıtı scripts/verify-perf.cjs.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PIXEL_BUDGET, backingDpr } from '../game/render'

const SCREENS: [string, number, number, number][] = [
  ['MacBook Retina', 1512, 860, 2],
  ['MacBook Pro 16"', 1728, 1117, 2],
  ['4K masaüstü (150%)', 2560, 1440, 1.5],
  ['4K masaüstü (100%)', 3840, 2160, 1],
  ['1080p masaüstü', 1920, 1080, 1],
  ['iPhone dikey', 390, 844, 3],
  ['iPhone yatay', 844, 390, 3],
  ['Android tablet', 1280, 800, 2],
]

describe('tuval piksel bütçesi', () => {
  it.each(SCREENS)('%s: kare başına bütçe kadar ya da altında piksel', (_n, w, h, dpr) => {
    const d = backingDpr(w, h, dpr)
    expect(d).toBeGreaterThanOrEqual(1)
    expect(d).toBeLessThanOrEqual(dpr)
    // DPR 1'e inmiş büyük ekran (4K %100) zaten ekranın kendi pikseli: daha azı bulanıklaşır
    if (d > 1) expect(Math.round(w * d) * Math.round(h * d)).toBeLessThanOrEqual(PIXEL_BUDGET * 1.01)
  })

  it('oyun tuvali boyutunu backingDpr ile kurar, ekran yoğunluğunu doğrudan kullanmaz', () => {
    const src = readFileSync('game/render.ts', 'utf8')
    expect(src).toMatch(/const dpr = backingDpr\(cssW, cssH, deviceDpr\)/)
    expect(src).not.toMatch(/canvas\.width = Math\.round\(cssW \* deviceDpr\)/)
  })
})
