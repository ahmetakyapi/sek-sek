import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { SCALES, cityTheme, titleTheme, voiceLead, type Song } from '../game/music'

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
  const lead = s.events.filter((e) => e.inst === 'ney' || e.inst === 'kanun' || e.inst === 'keys').sort((a, b) => a.at - b.at)
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
    // rahatlatıcı arka plan müziği: 4/4, on altılık ızgara; armoni şehrin makamının içinde
    expect(a.length % 16).toBe(0)
    const pcs = new Set(m.steps.map((x) => (m.root + x) % 12))
    for (const e of a.events) if (e.inst === 'keys' || e.inst === 'ney' || e.inst === 'kanun') for (const n of e.midi) expect(pcs.has(n % 12)).toBe(true)
    expect(cityTheme(city)).toBe(a)
    // boss katmanı dört vuruşa göre vurur
    expect(a.pulse).toEqual([4, 4, 4, 4])
    // tel çalgılar (bağlama, kanun) ve ney birlikte: düzenleme katmanlı
    expect(a.events.some((e) => e.inst === 'kanun')).toBe(true)
    // form: giriş bir kez, döngü ölçü başından döner; tempo rahat aralıkta (70-84 BPM)
    expect(a.loop).toBeGreaterThan(0)
    expect(a.loop % 16).toBe(0)
    expect(a.loop).toBeLessThan(a.length / 4)
    const bpm = 60 / a.step / 4
    expect(bpm).toBeGreaterThanOrEqual(70)
    expect(bpm).toBeLessThanOrEqual(84)
    // A' cümlesi durakta biter (giriş 4 + A 8 + A' 8 ölçü): neyin son notası makamın kökü
    const neyA2 = a.events.filter((e) => e.inst === 'ney' && e.at < 20 * 16).sort((x, y) => x.at - y.at)
    expect(neyA2.at(-1)!.midi[0] % 12).toBe(m.root % 12)
    // süsleme: ney kayarak/çarparak girer, kanun tremolo yapar
    expect(a.events.some((e) => e.inst === 'ney' && e.from !== undefined)).toBe(true)
    expect(a.events.some((e) => e.inst === 'kanun' && e.trem)).toBe(true)
    // ses yürütme: piyano akorları bir sonrakine az yürür (ortalama ses başına en çok 3 yarım ses)
    const chords = a.events.filter((e) => e.inst === 'keys' && e.midi.length === 4 && e.at % 16 === 0).sort((x, y) => x.at - y.at)
    let move = 0
    for (let i = 1; i < chords.length; i++) move += chords[i].midi.reduce((s, n, k) => s + Math.abs(n - chords[i - 1].midi[k]), 0) / 4
    expect(move / (chords.length - 1)).toBeLessThanOrEqual(3)
    // ses düğümü bütçesi: ölçü başına en çok 30 olay (uzun oyunda WebAudio şişmesin)
    expect(a.events.length / (a.length / 16)).toBeLessThanOrEqual(30)
  })

  it('jenerik: giriş bir kez çalar, tema A-B-A-B döner, en yakın çevrimle akar', () => {
    const s = titleTheme()
    expect(s.loop).toBe(4 * 8)
    expect(s.length).toBe(36 * 8)
    expect(s.events.filter((e) => e.inst === 'kanun' && e.trem).length).toBeGreaterThan(0)
    expect(s.events.length / (s.length / 8)).toBeLessThanOrEqual(30)
  })

  it('ses yürütme: akor tonları önceki akora en yakın çevrimle dizilir', () => {
    // Do maj7 → Fa maj7: ortak tonlar (Do, Mi) yerinde kalır, öteki sesler bir adım yürür
    const c = voiceLead(null, [60, 64, 67, 71])
    const f = voiceLead(c, [65, 69, 72, 76])
    expect(f.reduce((s, n, i) => s + Math.abs(n - c[i]), 0)).toBeLessThanOrEqual(4)
    expect(f.map((n) => n % 12).sort((x, y) => x - y)).toEqual([0, 4, 5, 9])
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
