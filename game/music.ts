import type { CityKey } from './types'

/**
 * Besteli müzik: notalar burada veri olarak durur, sesi audio.ts çalar. DOM'suz, testlenebilir.
 *
 * - Jenerik (menüler): Re minörde, B kısmında Hicaz renkli, ney ve sazla 32 ölçülük tema.
 * - Oyun (şehir başına): şehrin makamı (dizi), usulü (aksak ölçü grupları) ve hızıyla, şehrin adından
 *   tohumlanmış sabit bir beste. Her açılışta aynı ezgi çalar; rastgele yürüyüş değil, akılda kalan bir tema.
 */

export type Inst = 'ney' | 'kanun' | 'keys' | 'pad' | 'sub' | 'kick' | 'rim' | 'hat'

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
  /** vuruşun grupları (adım): boss dövüşünde ek vuruşlar buna göre düşer; jenerikte boş */
  pulse: number[]
  /** tek adımların gecikmesi (adımın oranı): lo-fi sallantısı */
  swing: number
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
  // Hüseyni, Orta Anadolu oyun havası 9/8 (Kayseri)
  kayseri: { root: 60, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.18 },
  // Hicaz, Antakya ağırlığı (Hatay)
  hatay: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.17 },
  // Rast, şen bir öğrenci şehri (Eskişehir)
  eskisehir: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11, 12], meter: [2, 2, 2, 2], tempo: 0.17 },
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
  // Hüseyni, Yeşilırmak kıyısında ağır bir türkü (Amasya)
  amasya: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 2, 2], tempo: 0.18 },
  // Rast'a yakın, Ege zeybeği 9/8 (Muğla)
  mugla: { root: 62, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.2 },
  // Saba'ya yakın (Re)
  bayburt: { root: 50, steps: [0, 2, 3, 4, 7, 8, 10, 12], meter: [3, 2, 2], tempo: 0.19 },
  // Karadeniz, kemençe ve tulum 7/8 (Rize)
  rize: { root: 62, steps: [0,  2,  3,  5,  7,  9,  10,  12], meter: [2,  2,  3], tempo: 0.12 },
  // Karadeniz yaylası 7/8 (Artvin)
  artvin: { root: 60, steps: [0,  2,  3,  5,  7,  8,  10,  12], meter: [2,  2,  3], tempo: 0.13 },
  // Kafkas havası, Uşşak’a yakın (Kars)
  kars: { root: 57, steps: [0,  2,  3,  5,  7,  8,  10,  12], meter: [3,  3,  2], tempo: 0.14 },
  // Uşşak, uzun hava ağırlığı (Bitlis)
  bitlis: { root: 59, steps: [0,  1,  3,  5,  7,  8,  10,  12], meter: [3,  3,  2], tempo: 0.19 },
  // Hüseyni, dağ havası 9/8 (Ağrı)
  agri: { root: 57, steps: [0,  2,  3,  5,  7,  9,  10,  12], meter: [2,  2,  2,  3], tempo: 0.15 },
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
  // sakin jenerik: aynı ezgi ve akorlar, lo-fi düzenleme. Sekizlik ızgara, ~76 BPM, tek sekizlikler hafif geç (swing).
  // A: elektrik piyano ve ney, davulsuz · B: fırça davul ve alt bas girer · A: kanun ezgiye tizden cevap verir · B: hepsi
  const ev: NoteEvent[] = []
  const BAR = 8
  const plan: { mel: Bar[]; ch: string[]; drums: boolean; answer: boolean }[] = [
    { mel: TITLE_A, ch: TITLE_CHORDS_A, drums: false, answer: false },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, drums: true, answer: false },
    { mel: TITLE_A, ch: TITLE_CHORDS_A, drums: true, answer: true },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, drums: true, answer: true },
  ]
  let bar = 0
  for (const sec of plan) {
    sec.mel.forEach((m, i) => {
      const at0 = (bar + i) * BAR
      let s = at0
      for (const [n, d] of m) {
        if (n !== null) {
          ev.push({ at: s, dur: d, inst: 'ney', midi: [n], vol: 0.085 })
          // kanun uzun notalara bir oktav yukarıdan, iki sekizlik sonra cevap verir
          if (sec.answer && d >= 3 && s + 2 < at0 + BAR) ev.push({ at: s + 2, dur: 1, inst: 'kanun', midi: [n + 12], vol: 0.035 })
        }
        s += d
      }
      const ch = CHORD[sec.ch[i]]
      // elektrik piyano: akor ölçü başında ve dördüncü sekizlikte yumuşakça (yedili renk: köke dokuzlu eklenir)
      const voicing = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 26]
      ev.push({ at: at0, dur: 4, inst: 'keys', midi: voicing, vol: 0.1 })
      ev.push({ at: at0 + 5, dur: 3, inst: 'keys', midi: voicing.slice(1), vol: 0.065 })
      ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [ch[0] + 12, ch[2] + 12], vol: 0.025 })
      ev.push({ at: at0, dur: 3, inst: 'sub', midi: [lift(ch[0] - 12)], vol: 0.13 })
      ev.push({ at: at0 + 4, dur: 3, inst: 'sub', midi: [lift(ch[2] - 12)], vol: 0.09 })
      if (sec.drums) {
        ev.push({ at: at0, dur: 1, inst: 'kick', midi: [], vol: 0.2 })
        ev.push({ at: at0 + 5, dur: 1, inst: 'kick', midi: [], vol: 0.12 })
        ev.push({ at: at0 + 2, dur: 1, inst: 'rim', midi: [], vol: 0.07 })
        ev.push({ at: at0 + 6, dur: 1, inst: 'rim', midi: [], vol: 0.07 })
        for (let k = 0; k < BAR; k++) ev.push({ at: at0 + k, dur: 1, inst: 'hat', midi: [], vol: k % 2 ? 0.018 : 0.03 })
      }
    })
    bar += sec.mel.length
  }
  return song('title', 60 / 76 / 2, bar * BAR, ev, [], 0.16)
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

/** şehre göre dört akorluk döngü (dizinin dereceleri): hepsi tonikte başlar, çözülerek döner */
const PROGRESSIONS = [
  [0, 5, 3, 4],
  [0, 3, 5, 4],
  [0, 5, 2, 4],
  [0, 4, 5, 3],
]

/**
 * Şehir müziği: rahatlatıcı arka plan müziği (lo-fi). 4/4, on altılık ızgara, ~78 BPM, tek on altılıklar hafif geç.
 * Armoni şehrin makamından: dizinin derecelerinden kurulan yedili akorlar, elektrik piyanoda yumuşak vuruşlarla;
 * altında sıcak alt bas ve fırça davul. Ezgi seyrektir (çoğu akor tonu, uzun notalar): A bölümünde yalnız piyano,
 * B'de davul ve bas girer, C'de ney söyler, D'de kanun cevap verir, sonra başa döner. Aynı şehir, hep aynı beste.
 */
function citySong(city: CityKey, m: Makam): Song {
  const rand = rng(city)
  const prog = PROGRESSIONS[Math.floor(rand() * PROGRESSIONS.length)]
  const BAR = 16
  const ev: NoteEvent[] = []
  // akor: derece, üçlü, beşli, yedili (dizinin içinde); piyanoda orta bölgede, kökü bir oktav aşağıda basta
  const chord = (d: number) => [deg(m, d), deg(m, d + 2), deg(m, d + 4), deg(m, d + 6)].map((n) => n + (n < 57 ? 12 : 0))
  // ezgi: her akorda seyrek bir motif (iki-üç nota), çoğu akor tonu; şehirden tohumlanır
  const motif = (d: number) => {
    const shape = [0, 2, 4, 6, 7].map((k) => d + k)
    const pick = () => shape[Math.floor(rand() * shape.length)]
    return [pick(), pick(), pick()]
  }
  const motifs = prog.map((d) => motif(d))
  const sections: { drums: boolean; bass: boolean; lead: 'ney' | 'kanun' | null }[] = [
    { drums: false, bass: false, lead: null },
    { drums: true, bass: true, lead: null },
    { drums: true, bass: true, lead: 'ney' },
    { drums: true, bass: true, lead: 'kanun' },
  ]
  let bar = 0
  for (const sec of sections) {
    for (let rep = 0; rep < 2; rep++)
      prog.forEach((d, ci) => {
        const at0 = bar * BAR
        const c = chord(d)
        // piyano: ölçü başında tam akor, "ve"de (7. on altılık) yumuşak tekrar, sonda kısa bir dokunuş
        ev.push({ at: at0, dur: 7, inst: 'keys', midi: c, vol: 0.12 })
        ev.push({ at: at0 + 7, dur: 6, inst: 'keys', midi: c.slice(1), vol: 0.075 })
        if (rep === 1 && ci === prog.length - 1) ev.push({ at: at0 + 14, dur: 2, inst: 'keys', midi: [c[3] + 12], vol: 0.06 })
        ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [c[0], c[2]], vol: 0.035 })
        // bas: girişte yalnız ölçü başında ve kısık, sonra tam
        const root = lift(deg(m, d) - 12 * (deg(m, d) >= 48 ? 2 : 1))
        ev.push({ at: at0, dur: 6, inst: 'sub', midi: [root], vol: sec.bass ? 0.17 : 0.1 })
        if (sec.bass) ev.push({ at: at0 + 10, dur: 4, inst: 'sub', midi: [root + 7], vol: 0.11 })
        if (sec.drums) {
          ev.push({ at: at0, dur: 1, inst: 'kick', midi: [], vol: 0.26 })
          ev.push({ at: at0 + 10, dur: 1, inst: 'kick', midi: [], vol: 0.18 })
          ev.push({ at: at0 + 4, dur: 1, inst: 'rim', midi: [], vol: 0.09 })
          ev.push({ at: at0 + 12, dur: 1, inst: 'rim', midi: [], vol: 0.09 })
          for (let k = 0; k < BAR; k += 2) ev.push({ at: at0 + k, dur: 1, inst: 'hat', midi: [], vol: k % 4 ? 0.02 : 0.032 })
        }
        if (sec.lead) {
          // motif ölçünün ortasından başlar (cümleye nefes payı); ikinci tekrarda bir derece kayar
          const mo = motifs[ci]
          const lens = [3, 3, 6]
          let s = at0 + 4
          mo.forEach((x, k) => {
            const n = deg(m, x + (rep ? 1 : 0)) + (sec.lead === 'kanun' ? 12 : 0)
            const midi = n > 88 ? n - 12 : n
            ev.push({ at: s, dur: lens[k], inst: sec.lead!, midi: [midi], vol: sec.lead === 'ney' ? 0.09 : 0.055 })
            s += lens[k]
          })
        }
        bar++
      })
  }
  return song(city, 60 / 78 / 4, bar * BAR, ev, [4, 4, 4, 4], 0.22)
}

function song(id: string, step: number, length: number, events: NoteEvent[], pulse: number[], swing = 0): Song {
  const byStep: NoteEvent[][] = Array.from({ length }, () => [])
  for (const e of events) byStep[e.at].push(e)
  return { id, step, length, events, byStep, pulse, swing }
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
