import type { CityKey } from './types'

/**
 * Besteli müzik: notalar burada veri olarak durur, sesi audio.ts çalar. DOM'suz, testlenebilir.
 *
 * - Jenerik (menüler): Re minörde, B kısmında Hicaz renkli, ney ve sazla 32 ölçülük tema.
 * - Oyun (şehir başına): şehrin makamı (dizi), usulü (aksak ölçü grupları) ve hızıyla, şehrin adından
 *   tohumlanmış sabit bir beste. Her açılışta aynı ezgi çalar; rastgele yürüyüş değil, akılda kalan bir tema.
 */

export type Inst = 'ney' | 'saz' | 'arp' | 'bass' | 'pad' | 'dum' | 'tek' | 'ka'

export interface NoteEvent {
  /** başladığı adım */
  at: number
  /** süre (adım) */
  dur: number
  inst: Inst
  /** MIDI notaları (davulda boş) */
  midi: number[]
  vol: number
}

export interface Song {
  id: string
  /** bir adımın süresi (sn) */
  step: number
  /** döngünün adım sayısı */
  length: number
  events: NoteEvent[]
  /** adım başına o adımda başlayan notalar (çalarken arama yapılmasın) */
  byStep: NoteEvent[][]
}

interface Makam {
  root: number
  steps: number[]
  meter: number[]
  tempo: number
}

/** şehrin makamı: kök (MIDI), dizi (yarım ses adımları), usul (aksak gruplar), adım süresi (sn) */
export const SCALES: Record<CityKey, Makam> = {
  // Hicaz (Re)
  istanbul: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 2, 2], tempo: 0.22 },
  // Nihavend'e yakın
  konya: { root: 57, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [3, 3, 2], tempo: 0.24 },
  nevsehir: { root: 59, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.18 },
  gaziantep: { root: 60, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.15 },
  trabzon: { root: 62, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.11 },
  // Hüseyni, ağır zeybek (Çanakkale)
  canakkale: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.21 },
  // Karadeniz kıyısı, 7/8 (Sinop)
  sinop: { root: 60, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.14 },
  // Uşşak, uzun hava ağırlığı (Diyarbakır)
  diyarbakir: { root: 57, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.21 },
  // Hicaz, Trakya 9/8'i (Edirne)
  edirne: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.15 },
  // Rast, ağırbaşlı (Bursa)
  bursa: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11, 12], meter: [2, 2, 2, 2], tempo: 0.2 },
  // Hüseyni, Teke zeybeği 9/8 (Antalya)
  antalya: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 3, 2, 2], tempo: 0.14 },
  // Hicaz, sıra gecesi (Şanlıurfa)
  sanliurfa: { root: 59, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.19 },
  // Uşşak, göl kıyısı (Van)
  van: { root: 57, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.2 },
  // Hüseyni, bar havası 5/8 (Erzurum)
  erzurum: { root: 59, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 3], tempo: 0.16 },
  kocaeli: { root: 60, steps: [0, 2, 3, 5, 7, 8, 11, 12], meter: [2, 2, 2, 2], tempo: 0.2 },
  // Rast, zeybek usulü 9/8
  izmir: { root: 60, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.19 },
  // Kürdi, Ankara havası
  ankara: { root: 62, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.16 },
  // Hicaz, Çukurova türküsü havası
  adana: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.17 },
  // Hicaz (La)
  mardin: { root: 57, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.2 },
  // Uşşak'a yakın (Re)
  malatya: { root: 62, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.15 },
  // Rast'a yakın (Sol)
  corum: { root: 55, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [2, 2, 2, 2], tempo: 0.21 },
  // Karadeniz horonu, 7/8
  ordu: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 3], tempo: 0.13 },
  // Hüseyni'ye yakın (La)
  sivas: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.16 },
  // Kafkas havası, Uşşak'a yakın
  ardahan: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.15 },
  // Saba'ya yakın (Re)
  bayburt: { root: 50, steps: [0, 2, 3, 4, 7, 8, 10, 12], meter: [3, 2, 2], tempo: 0.19 },
}

// ── jenerik ───────────────────────────────────────────────────────────────

type Bar = [number | null, number][]
const R = null
// sekizlik birimlerle ölçüler (her ölçü 8): [MIDI ya da sus, süre]
const TITLE_A: Bar[] = [
  [[69, 2], [74, 2], [72, 1], [69, 1], [67, 1], [69, 1]],
  [[65, 3], [67, 1], [69, 2], [70, 2]],
  [[72, 3], [70, 1], [69, 2], [67, 2]],
  [[69, 6], [R, 2]],
  [[69, 2], [74, 2], [76, 1], [77, 1], [76, 1], [74, 1]],
  [[74, 3], [72, 1], [70, 2], [69, 1], [67, 1]],
  [[69, 2], [73, 2], [70, 1], [69, 1], [67, 1], [65, 1]],
  [[64, 1], [65, 1], [62, 6]],
]
const TITLE_B: Bar[] = [
  [[77, 2], [76, 1], [74, 1], [72, 2], [69, 2]],
  [[67, 2], [72, 2], [76, 3], [74, 1]],
  [[77, 3], [76, 1], [74, 2], [69, 2]],
  [[70, 2], [74, 2], [77, 2], [76, 1], [74, 1]],
  [[74, 2], [79, 3], [77, 1], [76, 1], [74, 1]],
  [[76, 2], [72, 2], [67, 2], [72, 1], [74, 1]],
  [[76, 3], [74, 1], [73, 2], [70, 1], [73, 1]],
  [[69, 6], [R, 2]],
]
// ölçü başına akor (kök + üçlü + beşli, MIDI)
const CHORD: Record<string, number[]> = {
  Dm: [50, 53, 57],
  Bb: [46, 50, 53],
  C: [48, 52, 55],
  F: [41, 45, 48],
  Gm: [43, 46, 50],
  A: [45, 49, 52],
}
const TITLE_CHORDS_A = ['Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Dm']
const TITLE_CHORDS_B = ['F', 'C', 'Dm', 'Bb', 'Gm', 'C', 'A', 'A']

function titleSong(): Song {
  const ev: NoteEvent[] = []
  const BAR = 8
  // A (sakin giriş) · B · A (davullu) · B (saz eşlikli)
  const plan: { mel: Bar[]; ch: string[]; drums: boolean; arp: boolean }[] = [
    { mel: TITLE_A, ch: TITLE_CHORDS_A, drums: false, arp: false },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, drums: true, arp: false },
    { mel: TITLE_A, ch: TITLE_CHORDS_A, drums: true, arp: true },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, drums: true, arp: true },
  ]
  let bar = 0
  for (const sec of plan) {
    sec.mel.forEach((m, i) => {
      const at0 = (bar + i) * BAR
      let s = at0
      for (const [n, d] of m) {
        if (n !== null) ev.push({ at: s, dur: d, inst: 'ney', midi: [n], vol: 0.13 })
        s += d
      }
      const ch = CHORD[sec.ch[i]]
      ev.push({ at: at0, dur: BAR, inst: 'pad', midi: ch.map((c) => c + 12), vol: 0.05 })
      ev.push({ at: at0, dur: 3, inst: 'bass', midi: [lift(ch[0] - 12)], vol: 0.16 })
      ev.push({ at: at0 + 4, dur: 3, inst: 'bass', midi: [lift(ch[2] - 12)], vol: 0.12 })
      if (sec.arp) {
        const up = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24]
        ;[0, 1, 2, 3, 2, 1, 2, 3].forEach((k, j) => ev.push({ at: at0 + j, dur: 1, inst: 'arp', midi: [up[k]], vol: 0.045 }))
      }
      if (sec.drums) {
        ev.push({ at: at0, dur: 1, inst: 'dum', midi: [], vol: 0.3 })
        ev.push({ at: at0 + 3, dur: 1, inst: 'ka', midi: [], vol: 0.06 })
        ev.push({ at: at0 + 4, dur: 1, inst: 'tek', midi: [], vol: 0.12 })
        ev.push({ at: at0 + 6, dur: 1, inst: 'dum', midi: [], vol: 0.18 })
        ev.push({ at: at0 + 7, dur: 1, inst: 'ka', midi: [], vol: 0.05 })
      }
    })
    bar += sec.mel.length
  }
  return song('title', 60 / 92 / 2, bar * BAR, ev)
}

// ── şehir besteleri ───────────────────────────────────────────────────────

/** şehrin adından tohumlanan küçük rastgele üreteç: aynı şehir, aynı ezgi */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** dizinin derecesi → MIDI (7 derece bir oktav) */
/** bas çok pese inmesin (küçük hoparlörde duyulmaz) */
const lift = (n: number) => (n < 36 ? n + 12 : n)

const deg = (m: Makam, d: number) => m.root + m.steps[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)

/** bir ölçünün ezgisi: [derece | sus, süre] dizisi; güçlü vuruşta nota, aralarda tutulan ya da kısa notalar */
function phraseBar(m: Makam, rand: () => number, start: number, end: number | null, busy: number): [number | null, number][] {
  const beats = m.meter.reduce((a, b) => a + b, 0)
  const strong = new Set<number>()
  let acc = 0
  for (const g of m.meter) {
    strong.add(acc)
    acc += g
  }
  const out: [number | null, number][] = []
  let d = start
  let pos = 0
  while (pos < beats) {
    // son grupta varış notası tutulur
    const lastGroup = end !== null && pos >= beats - m.meter[m.meter.length - 1]
    if (lastGroup) {
      out.push([end, beats - pos])
      break
    }
    let len = 1
    if (strong.has(pos) && rand() > busy) {
      // güçlü vuruşta uzun nota: grubun sonuna dek
      let g = 0
      let a = 0
      for (const x of m.meter) {
        if (a === pos) g = x
        a += x
      }
      len = Math.max(1, Math.min(g, beats - pos))
    }
    out.push([d, len])
    pos += len
    // ezgi adım adım yürür, ara sıra üçlü sıçrar; dizinin içinde kalır
    const r = rand()
    d += r < 0.38 ? -1 : r < 0.76 ? 1 : r < 0.88 ? 2 : -2
    d = Math.max(-1, Math.min(9, d))
  }
  return out
}

function citySong(city: CityKey, m: Makam): Song {
  const rand = rng(city)
  const beats = m.meter.reduce((a, b) => a + b, 0)
  // aksak usullerde ölçü kısa: daha uzun bir cümle için ölçü sayısı artar
  const busy = m.tempo < 0.16 ? 0.55 : 0.4
  // dört ölçülük cümleler: A (yarım karar, beşliye) · A' (karar, tonik) · B (tiz bölge) · A'
  const mkPhrase = (starts: number[], ends: (number | null)[]) => starts.map((s, i) => phraseBar(m, rand, s, ends[i], busy))
  const A = mkPhrase([0, 2, 4, 3], [null, null, null, 4])
  const A2 = [...A.slice(0, 3), phraseBar(m, rand, 2, 0, busy)]
  const B = mkPhrase([4, 6, 5, 3], [null, null, null, 4])
  const form = [A, A2, B, A2]
  // ölçü başına dem (drone) derecesi: tonik, dördüncü, beşinci
  const roots = [0, 0, 3, 4, 0, 0, 3, 0, 4, 3, 4, 4, 0, 0, 3, 0]

  const ev: NoteEvent[] = []
  const bars = form.length * 4
  for (let pass = 0; pass < 2; pass++) {
    form.forEach((ph, pi) =>
      ph.forEach((bar, bi) => {
        const b = pass * bars + pi * 4 + bi
        const at0 = b * beats
        let s = at0
        for (const [d, len] of bar) {
          if (d !== null) {
            // ikinci geçişte B cümlesini ney söyler, saz bir oktav aşağıdan eşlik eder
            if (pass === 1 && pi === 2) {
              ev.push({ at: s, dur: len, inst: 'ney', midi: [deg(m, d)], vol: 0.11 })
              if (len > 1) ev.push({ at: s, dur: len, inst: 'saz', midi: [deg(m, d) - 12], vol: 0.06 })
            } else ev.push({ at: s, dur: len, inst: 'saz', midi: [deg(m, d)], vol: 0.11 })
          }
          s += len
        }
        const r = roots[(pi * 4 + bi) % roots.length]
        const root = deg(m, r) - 12
        ev.push({ at: at0, dur: beats, inst: 'pad', midi: [root, root + 7], vol: 0.035 })
        // bas usulün güçlü vuruşlarında: düm kök, diğer gruplar beşli
        let a = 0
        m.meter.forEach((g, gi) => {
          ev.push({ at: at0 + a, dur: Math.max(1, g - 1), inst: 'bass', midi: [lift(gi === 0 ? root - 12 : root - 5)], vol: gi === 0 ? 0.15 : 0.1 })
          // darbuka: ilk grup düm, ötekiler tek, grup içi boşluklarda hafif ka
          ev.push({ at: at0 + a, dur: 1, inst: gi === 0 ? 'dum' : 'tek', midi: [], vol: gi === 0 ? 0.28 : 0.11 })
          for (let k = 1; k < g; k++) if (pass === 1 || k === g - 1) ev.push({ at: at0 + a + k, dur: 1, inst: 'ka', midi: [], vol: 0.045 })
          a += g
        })
      }),
    )
  }
  return song(city, m.tempo, bars * 2 * beats, ev)
}

function song(id: string, step: number, length: number, events: NoteEvent[]): Song {
  const byStep: NoteEvent[][] = Array.from({ length }, () => [])
  for (const e of events) byStep[e.at].push(e)
  return { id, step, length, events, byStep }
}

let titleCache: Song | null = null
const cityCache = new Map<CityKey, Song>()

export function titleTheme(): Song {
  return (titleCache ??= titleSong())
}

export function cityTheme(city: CityKey): Song {
  let s = cityCache.get(city)
  if (!s) {
    s = citySong(city, SCALES[city])
    cityCache.set(city, s)
  }
  return s
}
