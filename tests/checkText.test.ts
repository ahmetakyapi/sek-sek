import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import type { LevelDef } from '../game/types'
import { MECHS, live, textProblems } from '../scripts/check-text'

/** küçük sahte bölüm: istenen satır 19'a yazılır */
const lv = (row: string, over: Partial<LevelDef> = {}): LevelDef =>
  ({
    ...LEVELS[0],
    id: 'deneme',
    map: [...Array.from({ length: 19 }, () => ' '.repeat(row.length)), row, '#'.repeat(row.length)],
    hints: [],
    npcs: [],
    intro: 'Sakin bir yol.',
    note: 'Not.',
    quips: [],
    wind: undefined,
    ...over,
  }) as LevelDef

describe('check-text: metin ve harita uyumu', () => {
  it('sayılar: tabela ve kişi metni haritayla aynı sayıda', () => {
    const p = textProblems(lv('  ?   n  ', { hints: [] }), { features: '' })
    expect(p.join('\n')).toMatch(/tabela: haritada 1 \?, metinde 0/)
    expect(p.join('\n')).toMatch(/kişi: haritada 1 n, metinde 0/)
  })

  it('rüzgâr diyen tabela rüzgârsız bölümde uyarır, rüzgârlıda susar', () => {
    const row = '  ?        '
    const hints = ['Rüzgâr karşından eser, atlayış kısalır.']
    expect(textProblems(lv(row, { hints }), { features: '' })).toHaveLength(1)
    expect(textProblems(lv(row, { hints, wind: -120 }), { features: '' })).toEqual([])
  })

  it('tabelanın mekaniği o parçada aranır: uzaktaki karo sayılmaz', () => {
    const far = '  ?' + ' '.repeat(80) + '?' + ' '.repeat(40) + 'A'
    const near = '  ?   A' + ' '.repeat(76) + '?' + ' '.repeat(41)
    const hints = ['Gelgit: su yükselince yüz.', 'Devam et.']
    expect(textProblems(lv(far, { hints }), { features: '' }).some((x) => x.includes('gelgit'))).toBe(true)
    expect(textProblems(lv(near, { hints }), { features: '' })).toEqual([])
  })

  it('boss tabelası (arenadan önceki son tabela) atlanır; kişi sözleri yalnız --hepsi ile', () => {
    const row = '  ?     Q   '
    expect(textProblems(lv(row, { hints: ['Tokmağı düşünce üstüne bas!'] }), { features: '' })).toEqual([])
    const npc = lv('  n      ', { npcs: [{ name: 'Deneme', look: 'amca', text: 'Tepede rüzgâr eser.' }] })
    expect(textProblems(npc, { features: '' })).toEqual([])
    expect(textProblems(npc, { features: '', all: true })).toHaveLength(1)
  })

  it('Türkçe sözcük sınırı: "yayla" yay sayılmaz, "yayıyla" sayılır; "termal otel" termal değildir', () => {
    const yay = MECHS.find((m) => m.name === 'yay')!
    expect(yay.re.test('yaylaya çık')).toBe(false)
    expect(yay.re.test('kasa yayıyla uzan')).toBe(true)
    const lift = MECHS.find((m) => m.name === 'yükselen hava')!
    expect(lift.re.test('termal otel: döner kapı')).toBe(false)
    expect(lift.re.test('termalin tepesinde asılı kal')).toBe(true)
  })

  it('oyunda olmayan mekaniğin kuralı çalışmaz (karosu sim.ts\'te yoksa)', () => {
    expect(live({ name: 'yok', re: /x/, chars: '\u0001' })).toBe(false)
    expect(live(MECHS.find((m) => m.name === 'gelgit')!)).toBe(true)
  })
})
