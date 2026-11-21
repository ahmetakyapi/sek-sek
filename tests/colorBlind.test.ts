import { describe, expect, it } from 'vitest'
import { CB_MODES, MODE_KINDS, cb, cbFor, cbc, deltaE } from '@/game/colorBlind'

/** Renk körü paleti: eşlenen kritik çiftler, ilgili körlük simülasyonunda (Machado 2009) ayırt edilebilir kalmalı. */
const MIN = 30 // CIE76 ΔE: 20 üstü rahat ayrılır; payı bol tut

const pairs: Record<'kirmizi-yesil' | 'mavi-sari', [string, string, string][]> = {
  'kirmizi-yesil': [
    ['#e5484d', '#3fb950', 'tehlike ↔ güvenli'],
    ['#e5484d', '#3a5a2a', 'tehlike ↔ çimen'],
    ['#e8794a', '#4aa8e0', 'A bloğu ↔ B bloğu'],
    ['#ff5a4a', '#ffd36a', 'süre azalıyor ↔ bol'],
  ],
  'mavi-sari': [
    ['#e8794a', '#4aa8e0', 'A bloğu ↔ B bloğu'],
    ['#e5484d', '#8fe8ff', 'tehlike ↔ yüzülen su'],
    ['#e5484d', '#3a5a2a', 'tehlike ↔ çimen'],
  ],
}

describe('renk körü paleti', () => {
  it('kapalıyken renk değişmez ve cbc kipten okur', () => {
    expect(cbFor('#e5484d', 'yok')).toBe('#e5484d')
    cb.mode = 'yok'
    expect(cbc('#e8794a')).toBe('#e8794a')
    cb.mode = 'kirmizi-yesil'
    expect(cbc('#e8794a')).not.toBe('#e8794a')
    expect(cbc('#123456')).toBe('#123456')
    cb.mode = 'yok'
  })

  for (const mode of ['kirmizi-yesil', 'mavi-sari'] as const)
    for (const [a, b, ad] of pairs[mode])
      for (const kind of MODE_KINDS[mode])
        it(`${mode} / ${kind}: ${ad} ayırt edilir (ΔE ≥ ${MIN})`, () => {
          expect(deltaE(cbFor(a, mode), cbFor(b, mode), kind)).toBeGreaterThanOrEqual(MIN)
        })

  it('palet gereklidir: kırmızı ↔ yeşil döteranopide eski renklerle ayrılmıyordu', () => {
    expect(deltaE('#e5484d', '#3fb950', 'deutan')).toBeLessThan(15)
    expect(deltaE(cbFor('#e5484d', 'kirmizi-yesil'), cbFor('#3fb950', 'kirmizi-yesil'), 'deutan')).toBeGreaterThan(30)
  })

  it('her kipin eşlemesi geçerli #rrggbb', () => {
    for (const m of CB_MODES) for (const h of ['#e5484d', '#e8794a', '#4aa8e0', '#spikeLight', '#spikeDark']) expect(cbFor(h, m)).toMatch(/^#([0-9a-f]{6}|spike(Light|Dark))$/)
  })

  it('tehlike ile iki blok aynı renge inmez (kırmızı-yeşil)', () => {
    const d = cbFor('#e5484d', 'kirmizi-yesil')
    expect(cbFor('#e8794a', 'kirmizi-yesil')).not.toBe(d)
    expect(cbFor('#4aa8e0', 'kirmizi-yesil')).not.toBe(d)
  })
})
