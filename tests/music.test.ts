import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SCALES, titleTheme, voiceLead, type NoteEvent } from '../game/music'
import { MENU_BED, bedOf } from '../game/ambience'
import { CITY } from '../game/art'

const BAR = 8
const s = titleTheme()
/** döngünün bir turunda çalan olaylar (tura bağlı olaylardan yalnız o turunkiler) */
const turn = (p: 0 | 1) => s.events.filter((e) => e.pass === undefined || e.pass === p)
const leadOf = (es: NoteEvent[]) => es.filter((e) => e.inst === 'ney' || e.inst === 'kanun' || e.inst === 'keys')
/** Re minör + Hicaz rengi (Do#, La7♭9'un Si♭'i zaten dizide) */
const D_HICAZ = new Set([2, 4, 5, 7, 9, 10, 0, 1])

describe('müzik: jenerik (oyunun tek bestesi)', () => {
  it('ölçüler tam, olaylar sağlam, hep aynı beste', () => {
    expect(titleTheme()).toBe(s)
    expect(s.length % BAR).toBe(0)
    expect(s.bar).toBe(BAR)
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
    // ezgi her ölçüyü doldurur (8 sekizlik): sırayla dizilen notalar ölçü sınırını taşmaz
    for (const e of s.events.filter((x) => x.inst === 'ney')) expect((e.at % BAR) + e.dur).toBeLessThanOrEqual(BAR)
    // Hicaz karakteri: ezgi ve armoni Re minörde, Do# (La7♭9) renk verir
    for (const e of leadOf(s.events)) for (const n of e.midi) expect(D_HICAZ.has(n % 12)).toBe(true)
    expect(s.events.some((e) => e.inst === 'ney' && e.midi[0] % 12 === 1)).toBe(true)
    // hiçbir olay patlatmaz: en güçlü nota payı bellidir (karışım audio.ts'te dengelenir)
    expect(Math.max(...s.events.map((e) => e.vol))).toBeLessThanOrEqual(0.3)
  })

  it('form: giriş bir kez, 64 ölçülük döngü (~4 dk), tempo sakin', () => {
    expect(s.loop).toBe(4 * BAR)
    expect(s.length).toBe((4 + 64) * BAR)
    const bpm = 60 / s.step / 2
    // düşük kortizol (25 Kasım 2026): ~64 BPM
    expect(bpm).toBeGreaterThanOrEqual(58)
    expect(bpm).toBeLessThanOrEqual(70)
    const loopSec = (s.length - s.loop) * s.step
    expect(loopSec).toBeGreaterThan(200)
    // ölçü başına bir bas kökü: boss katmanı bestenin armonisine basar
    expect(s.roots).toHaveLength(s.length / BAR)
    for (const r of s.roots) expect(r).toBeGreaterThanOrEqual(36)
  })

  it('tekrar yorgunluğu yok: ezgili ölçüler çoğunlukla farklı, motif başka ritimle de gelir, seyrek bölümler var', () => {
    const first = s.loop / BAR
    const bars = s.length / BAR - first
    // ezginin ölçü imzası: kim çalıyor + perde + yer
    const sig = (es: NoteEvent[], b: number) =>
      leadOf(es)
        .filter((e) => e.at >= b * BAR && e.at < (b + 1) * BAR && e.midi.length === 1 && e.dur >= 1 && e.inst !== 'keys')
        .map((e) => `${e.inst}${e.at - b * BAR}:${e.midi[0]}${e.from ?? ''}`)
        .sort()
        .join(',')
    const sigs = Array.from({ length: bars }, (_, i) => sig(turn(0), first + i))
    const melodic = sigs.filter(Boolean)
    expect(new Set(melodic).size / melodic.length).toBeGreaterThan(0.6)
    // A (ölçü 4-11) ile A4 (ölçü 52-59) aynı ezgiyi aynı ritimle çalmaz
    const ney = (b: number) => s.events.filter((e) => e.inst === 'ney' && e.at >= b * BAR && e.at < (b + 1) * BAR).map((e) => `${e.at % BAR}:${e.midi[0]}`).join(',')
    expect([12, 13].map(ney).join('|')).not.toBe([52, 53].map(ney).join('|'))
    // nefes: ezgisiz en az 8 ölçü ve gücü medyanın %75'inin altında kalan en az 8 ölçü
    const neyless = Array.from({ length: bars }, (_, i) => ney(first + i)).filter((x) => !x).length
    expect(neyless).toBeGreaterThanOrEqual(8)
    const energy = Array.from({ length: bars }, (_, i) =>
      turn(0).filter((e) => e.at >= (first + i) * BAR && e.at < (first + i + 1) * BAR).reduce((t, e) => t + e.vol * (e.inst === 'hat' ? 0.3 : 1), 0),
    )
    const med = [...energy].sort((x, y) => x - y)[Math.floor(energy.length / 2)]
    expect(energy.filter((x) => x < med * 0.75).length).toBeGreaterThanOrEqual(8)
  })

  it('döngünün ikinci turunda ezgiyi kanun alır', () => {
    const marked = s.events.filter((e) => e.pass !== undefined)
    // tura bağlı olaylar yalnız döngüde (giriş bir kez çalar)
    expect(marked.every((e) => e.at >= s.loop)).toBe(true)
    const inst = (p: 0 | 1) => new Set(marked.filter((e) => e.pass === p).map((e) => e.inst))
    expect(inst(1).has('kanun')).toBe(true)
    expect(inst(0).has('kanun')).toBe(false)
    // A'nın (ölçü 4) ilk notası: ilk turda piyanoda, ikinci turda kanunda
    const a0 = (p: 0 | 1) => marked.filter((e) => e.pass === p && e.at === s.loop).map((e) => e.inst)
    expect(a0(0)).toContain('keys')
    expect(a0(1)).toContain('kanun')
    // iki tur toplamında ezgi rengi farklı: turların ezgi olayları aynı değil
    const lead = (p: 0 | 1) => leadOf(turn(p)).map((e) => `${e.at}${e.inst}`).join()
    expect(lead(0)).not.toBe(lead(1))
  })

  it('süsleme ve kadans: ney alttan kayar, üstten çarpar; kanun tremolo; kararda dörtlü geciktirme', () => {
    const ney = s.events.filter((e) => e.inst === 'ney')
    expect(ney.some((e) => e.from !== undefined && e.from < e.midi[0])).toBe(true)
    expect(ney.some((e) => e.from !== undefined && e.from > e.midi[0])).toBe(true)
    expect(s.events.filter((e) => e.inst === 'kanun' && e.trem).length).toBeGreaterThan(4)
    // A'nın son ölçüsü (ölçü 11): akor Sol ile başlar (Rem'in dörtlüsü), ölçü ortasında Fa'ya çözülür
    const at = 11 * BAR
    const chords = s.events.filter((e) => e.inst === 'keys' && e.midi.length === 4 && e.at >= at && e.at < at + BAR).sort((x, y) => x.at - y.at)
    expect(chords[0].midi.some((n) => n % 12 === 7)).toBe(true)
    expect(chords.at(-1)!.midi.some((n) => n % 12 === 5)).toBe(true)
    // ezgi A'nın sonunda durakta (Re) biter
    const last = s.events.filter((e) => e.inst === 'keys' && e.midi.length === 1 && e.pass === 0 && e.at < 12 * BAR).sort((x, y) => x.at - y.at).at(-1)!
    expect(last.midi[0] % 12).toBe(2)
  })

  it('ses yürütme: piyano akorları bir sonrakine az yürür', () => {
    const chords = s.events.filter((e) => e.inst === 'keys' && e.midi.length === 4 && e.at % BAR === 0).sort((x, y) => x.at - y.at)
    let move = 0
    for (let i = 1; i < chords.length; i++) move += chords[i].midi.reduce((t, n, k) => t + Math.abs(n - chords[i - 1].midi[k]), 0) / 4
    expect(move / (chords.length - 1)).toBeLessThanOrEqual(3)
    // Do maj7 → Fa maj7: ortak tonlar (Do, Mi) yerinde kalır, öteki sesler bir adım yürür
    const c = voiceLead(null, [60, 64, 67, 71])
    const f = voiceLead(c, [65, 69, 72, 76])
    expect(f.reduce((t, n, i) => t + Math.abs(n - c[i]), 0)).toBeLessThanOrEqual(4)
    expect(f.map((n) => n % 12).sort((x, y) => x - y)).toEqual([0, 4, 5, 9])
  })

  it('ses düğümü bütçesi: bir turda ölçü başına en çok 30 olay (uzun oyunda WebAudio şişmesin)', () => {
    for (const p of [0, 1] as const) expect(turn(p).length / (s.length / BAR)).toBeLessThanOrEqual(30)
  })

  it('efektlerin makamı: her şehrin dizisi sekiz perdeli, kökü orta bölgede', () => {
    for (const m of Object.values(SCALES)) {
      expect(m.steps).toHaveLength(8)
      expect(m.root).toBeGreaterThanOrEqual(48)
      expect(m.root).toBeLessThanOrEqual(64)
    }
  })
})

describe('oyun efektleri', () => {
  it('yumuşak dalgayla çalınır: kare ve testere dalga yok (bip, yapışkan tuş uyarısı gibi duyuluyordu)', () => {
    const src = readFileSync('game/audio.ts', 'utf8')
    const body = src.slice(src.indexOf('  sfx(name: string) {'), src.indexOf('  /* ── Müzik ──'))
    expect(body.length).toBeGreaterThan(500)
    expect(body).not.toMatch(/'square'|'sawtooth'/)
    // aynı efekt art arda üst üste binmez
    expect(body).toMatch(/lastSfx/)
    expect(body).toMatch(/< 0\.06/)
  })

  it('ses motoru: hiçbir çalgıda kare ya da testere dalga yok; ana çıkışta sınırlayıcı ve yüksek geçiren var', () => {
    const src = readFileSync('game/audio.ts', 'utf8')
    expect(src).not.toMatch(/\.type = '(square|sawtooth)'/)
    expect(src).toMatch(/createDynamicsCompressor/)
    expect(src).toMatch(/type = 'highpass'/)
    // müzik efektin altında: efekt payı müzikten yüksek tanımlı
    const sfxTrim = Number(/SFX_TRIM = ([\d.]+)/.exec(src)![1])
    expect(sfxTrim).toBeGreaterThan(1)
  })

  it('düşük kortizol: bestede davul yok, dem her ölçüde, müzik kutusu çanı seyrek ve yüksekte', () => {
    expect(s.events.some((e) => ['kick', 'rim', 'hat', 'tom'].includes(e.inst))).toBe(false)
    const bars = s.length / BAR
    const padBars = new Set(s.events.filter((e) => e.inst === 'pad').map((e) => Math.floor(e.at / BAR)))
    expect(padBars.size).toBe(bars)
    const bells = s.events.filter((e) => e.inst === 'bell')
    expect(bells.length).toBeGreaterThan(bars * 0.4)
    expect(bells.length).toBeLessThan(bars * 2.5)
    for (const e of bells) expect(e.midi[0]).toBeGreaterThanOrEqual(74)
    expect(s.swing).toBeLessThanOrEqual(0.08)
  })
})

describe('doğa sesi yatağı', () => {
  it('her şehrin havası bir yatak verir; karda ve fırtınada kuş, yağmursuz yerde yağmur yok', () => {
    for (const c of Object.values(CITY)) {
      const b = bedOf(c.weather)
      for (const v of Object.values(b)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
      if (c.weather === 'snow' || c.weather === 'storm') expect(b.birds).toBe(0)
      if (c.weather !== 'rain') expect(b.rain).toBe(0)
    }
    expect(MENU_BED.birds).toBeGreaterThan(0)
  })
})
