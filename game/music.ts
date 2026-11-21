import type { CityKey } from './types'

/**
 * Besteli müzik: notalar burada veri olarak durur, sesi audio.ts çalar. DOM'suz, testlenebilir.
 *
 * - Jenerik (menüler): Re minörde, B kısmında Hicaz renkli tema. Giriş (bir kez) → A piyano söyler → B ney girer,
 *   fırça davul → A ney, kanun uzun notalara cevap verir → B herkes, kanun tremolosu; sonra A'ya döner.
 * - Oyun (şehir başına): şehrin makamında, adından tohumlanmış sabit bir beste. Giriş (bir kez) → A (piyano ezgisi) →
 *   A' (ney, motif bir derece yukarıdan sekvensle gelişir) → B (karşıtlık: uzun ney perdeleri, kanun arpeji, güçlü
 *   üstünde pedal bas) → A'' (ney sorar, kanun cevaplar) → nefes (ince doku) → A'ya döner. Cümleler sekiz ölçüdür:
 *   ilk yarı güçlüde asılı kalır, ikinci yarı makamın karar akoruyla durakta biter. Akorlar en yakın çevrimle yürür,
 *   kararda dörtlü geciktirme üçlüye çözülür. Tempo şehrin usulünden (70-84 BPM), bas ve kanun usulün vurgularına basar.
 *   Defter'deki Müzik Kutusu bunları dinletir.
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
  /** ney süslemesi: notaya bu perdeden girer (alttansa kayarak, üsttense çarpma) */
  from?: number
  /** kanun: tek çekiş yerine tremolo (nota boyunca sık tekrar, kabarıp söner) */
  trem?: boolean
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
  /** döngünün döndüğü adım: giriş yalnız ilk seferde çalar */
  loop: number
  /** yankı gecikmesi (sn): noktalı sekizlik, tempoya bağlı */
  echo: number
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
  // Karadeniz horonu 7/8, Hüseyni (Giresun)
  giresun: { root: 62, steps: [0,  2,  3,  5,  7,  9,  10,  12], meter: [2,  2,  3], tempo: 0.13 },
  // Hicaz, Tokat türküsü ağırlığı (Tokat)
  tokat: { root: 60, steps: [0,  1,  4,  5,  7,  8,  10,  12], meter: [3,  2,  2], tempo: 0.17 },
  // Kürdi, Ege zeybeği 9/8 (Denizli)
  denizli: { root: 57, steps: [0,  1,  3,  5,  7,  8,  10,  12], meter: [2,  2,  2,  3], tempo: 0.2 },
  // Hüseyni, Karadeniz madenci türküsü 9/8 ağırlığı (Zonguldak)
  zonguldak: { root: 50, steps: [0,  2,  3,  5,  7,  9,  10,  12], meter: [3,  2,  2,  2], tempo: 0.15 },
  // Hicaz, Akdeniz kıyısı ve Yörük havası 9/8 (Mersin)
  mersin: { root: 59, steps: [0,  1,  4,  5,  7,  8,  10,  12], meter: [2,  2,  2,  3], tempo: 0.17 },
  // Uşşak, Safranbolu çarşısının sakin ezgisi, 8/8 (Karabük)
  karabuk: { root: 52, steps: [0,  2,  3,  5,  7,  8,  10,  12], meter: [2,  2,  2,  2], tempo: 0.16 },
  // Hüzzam'a yakın, Ege zeybeği 9/8 (Aydın)
  aydin: { root: 52, steps: [0,  1,  3,  4,  7,  8,  10,  12], meter: [2,  2,  2,  3], tempo: 0.18 },
  // Hüseyni, dağ havası 9/8 (Ağrı)
  agri: { root: 57, steps: [0,  2,  3,  5,  7,  9,  10,  12], meter: [2,  2,  2,  3], tempo: 0.15 },
}

// ── ortak araçlar ─────────────────────────────────────────────────────────

/** tohumdan küçük rastgele üreteç: aynı tohum, aynı beste (insan eli de buradan: her döngüde aynı) */
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

const pc = (n: number) => ((n % 12) + 12) % 12

/** bas çok pese inmesin (küçük hoparlörde duyulmaz) */
const lift = (n: number) => (n < 36 ? n + 12 : n)

/**
 * Ses yürütme: akorun tonlarını bir önceki akora en yakın kapalı çevrimle dizer (her ses en kısa yolu yürür;
 * piyano sıçramaz, akorlar birbirine akar). İlk akor orta bölgeye oturur.
 */
export function voiceLead(prev: number[] | null, tones: number[], lo = 52, hi = 76): number[] {
  const pcs = [...new Set(tones.map(pc))]
  let best: number[] = []
  let bestScore = Infinity
  for (let r = 0; r < pcs.length; r++)
    for (let oct = 0; oct < 2; oct++) {
      let n = lo + pc(pcs[r] - lo) + 12 * oct
      const v = [n]
      for (let k = 1; k < pcs.length; k++) {
        n += 1 + pc(pcs[(r + k) % pcs.length] - n - 1)
        v.push(n)
      }
      if (v[v.length - 1] > hi) continue
      const near = (a: number[], b: number[]) => a.reduce((s, x) => s + Math.min(...b.map((y) => Math.abs(x - y))), 0)
      const score = prev ? near(v, prev) + near(prev, v) : Math.abs((v[0] + v[v.length - 1]) / 2 - 63)
      if (score < bestScore) {
        bestScore = score
        best = v
      }
    }
  return best
}

/** cümlenin dinamiği: ortasına doğru kabarır, kararda geri çekilir (ölçü başına çarpan) */
const ARC = [0.92, 0.96, 0.99, 1, 1.03, 1.05, 1, 0.93]

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
// ölçü başına akor: bas kökü ve köksüz yedili/dokuzlu renk (Rhodes'ta sıcak, açık)
const CHORD: Record<string, { root: number; tones: number[] }> = {
  Dm: { root: 50, tones: [53, 57, 60, 64] }, // Rem9: Fa La Do Mi
  Bb: { root: 46, tones: [50, 53, 57, 60] }, // Si♭maj9
  C: { root: 48, tones: [52, 55, 58, 62] }, // Do9
  F: { root: 41, tones: [57, 60, 64, 67] }, // Famaj9
  Gm: { root: 43, tones: [50, 53, 57, 58] }, // Solm9
  A: { root: 45, tones: [49, 52, 55, 58] }, // La7♭9: Hicaz rengi
}
const TITLE_CHORDS_A = ['Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Dm']
const TITLE_CHORDS_B = ['F', 'C', 'Dm', 'Bb', 'Gm', 'C', 'A', 'A']
const TITLE_INTRO = ['Dm', 'Bb', 'Gm', 'A']

/** bas yürüyüşü: bir sonraki köke yarım ya da tam sesle yaklaşan, şimdiki akorun içinde kalan geçiş notası */
function approach(next: number, chordPcs: Set<number>) {
  for (const n of [next - 1, next + 2, next - 2, next + 1]) if (chordPcs.has(pc(n))) return n
  return next
}

function titleSong(): Song {
  // ~76 BPM sekizlik ızgara, tek sekizlikler hafif geç (swing). Giriş bir kez çalar, döngü A'dan döner.
  const ev: NoteEvent[] = []
  const rand = rng('jenerik')
  const BAR = 8
  const human = () => 0.9 + rand() * 0.2
  let prevV: number[] | null = null
  let bar = 0
  const comp = (name: string, at0: number, style: 'arp' | 'soft' | 'full', next: string | null, vol: number) => {
    const ch = CHORD[name]
    const v = voiceLead(prevV, ch.tones, 50, 74)
    prevV = v
    if (style === 'arp') {
      // girişte kırık akor: aşağıdan yukarı, tepede dönüp iner
      ;[0, 1, 2, 3, 2, 1, 2, 3].forEach((k, i) => ev.push({ at: at0 + i, dur: 3, inst: 'keys', midi: [v[k]], vol: (i ? 0.05 : 0.065) * vol * human() }))
    } else if (style === 'soft') {
      ev.push({ at: at0, dur: 6, inst: 'keys', midi: v, vol: 0.08 * vol * human() })
      ev.push({ at: at0 + 6, dur: 2, inst: 'keys', midi: v.slice(2), vol: 0.045 * vol * human() })
    } else {
      ev.push({ at: at0, dur: 4, inst: 'keys', midi: v, vol: 0.095 * vol * human() })
      ev.push({ at: at0 + 3, dur: 2, inst: 'keys', midi: v.slice(1), vol: 0.05 * vol * human() })
      ev.push({ at: at0 + 5, dur: 3, inst: 'keys', midi: v.slice(1), vol: 0.06 * vol * human() })
    }
    ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: 0.024 * vol })
    // bas: kök, beşli, sonra bir sonraki köke yürüyen geçiş notası
    const root = lift(ch.root)
    ev.push({ at: at0, dur: 3, inst: 'sub', midi: [root], vol: 0.13 * vol })
    if (style !== 'arp') {
      ev.push({ at: at0 + 4, dur: 2, inst: 'sub', midi: [lift(root + 7)], vol: 0.085 * vol })
      if (next) {
        const pcs = new Set([ch.root, ...ch.tones].map(pc))
        ev.push({ at: at0 + 6, dur: 2, inst: 'sub', midi: [lift(approach(CHORD[next].root, pcs))], vol: 0.075 * vol })
      }
    } else ev.push({ at: at0 + 4, dur: 4, inst: 'sub', midi: [root], vol: 0.07 * vol })
  }
  const drums = (at0: number, fill: boolean, vol: number) => {
    ev.push({ at: at0, dur: 1, inst: 'kick', midi: [], vol: 0.2 * vol })
    ev.push({ at: at0 + 5, dur: 1, inst: 'kick', midi: [], vol: 0.12 * vol })
    ev.push({ at: at0 + 2, dur: 1, inst: 'rim', midi: [], vol: 0.07 * vol })
    ev.push({ at: at0 + 6, dur: 1, inst: 'rim', midi: [], vol: (fill ? 0.06 : 0.07) * vol })
    if (fill) ev.push({ at: at0 + 7, dur: 1, inst: 'rim', midi: [], vol: 0.05 * vol })
    for (let k = 0; k < (fill ? 6 : BAR); k++) ev.push({ at: at0 + k, dur: 1, inst: 'hat', midi: [], vol: (k % 2 ? 0.017 : 0.028) * vol * human() })
  }

  // giriş: kırık akorlar, dem kabarır; kanun temanın başını uzaktan anar
  TITLE_INTRO.forEach((name, i) => {
    comp(name, i * BAR, 'arp', TITLE_INTRO[i + 1] ?? 'Dm', 0.8 + i * 0.07)
  })
  ;[[81, 2], [86, 2], [84, 1], [81, 1], [79, 2]].reduce((s, [n, d]) => {
    ev.push({ at: 2 * BAR + s, dur: d, inst: 'kanun', midi: [n], vol: 0.03 })
    return s + d
  }, 0)
  ev.push({ at: 3 * BAR + 1, dur: 6, inst: 'kanun', midi: [81], vol: 0.022, trem: true })
  bar = TITLE_INTRO.length
  const loop = bar * BAR

  const plan: { mel: Bar[]; ch: string[]; lead: 'keys' | 'ney'; drums: boolean; answer: boolean; arp: boolean }[] = [
    { mel: TITLE_A, ch: TITLE_CHORDS_A, lead: 'keys', drums: false, answer: false, arp: false },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, lead: 'ney', drums: true, answer: false, arp: true },
    { mel: TITLE_A, ch: TITLE_CHORDS_A, lead: 'ney', drums: true, answer: true, arp: false },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, lead: 'ney', drums: true, answer: true, arp: true },
  ]
  plan.forEach((sec, si) => {
    const nextSec = plan[(si + 1) % plan.length]
    sec.mel.forEach((m, i) => {
      const at0 = (bar + i) * BAR
      const arc = ARC[i]
      const next = sec.ch[i + 1] ?? nextSec.ch[0]
      comp(sec.ch[i], at0, sec.lead === 'keys' ? 'soft' : 'full', next, arc)
      if (sec.drums) drums(at0, i === sec.mel.length - 1, arc * (si === 1 && i < 2 ? 0.7 : 1))
      // ezgi: cümle başında ve uzun notada ney alttan kayarak girer
      let s = at0
      let prev: number | null = null
      for (const [n, d] of m) {
        if (n !== null) {
          if (sec.lead === 'keys') ev.push({ at: s, dur: d, inst: 'keys', midi: [n + 12], vol: 0.075 * arc * human() })
          else {
            const from = prev === null || d >= 3 ? n - ([5, 10, 1].includes(n % 12) ? 1 : 2) : undefined
            ev.push({ at: s, dur: d, inst: 'ney', midi: [n], vol: 0.085 * arc * human(), from })
          }
          // kanun uzun notalara bir oktav yukarıdan, iki sekizlik sonra cevap verir; cümle sonunda tremolo
          if (sec.answer && d >= 3 && s + 2 < at0 + BAR) {
            const last = i === sec.mel.length - 1 || i === 3
            ev.push({ at: s + 2, dur: last ? d - 2 : 1, inst: 'kanun', midi: [n + 12], vol: last ? 0.022 : 0.035, trem: last })
          }
        }
        prev = n
        s += d
      }
      // B'de kanun alttan arpejle sarar (akorun tonları, sekizlikler)
      if (sec.arp && i % 2 === 0) {
        const v = voiceLead(null, CHORD[sec.ch[i]].tones, 62, 86)
        ;[0, 1, 2, 3].forEach((k, j) => ev.push({ at: at0 + j, dur: 1, inst: 'kanun', midi: [v[k]], vol: 0.018 + j * 0.003 }))
      }
    })
    bar += sec.mel.length
  })
  const step = 60 / 76 / 2
  return song('title', step, bar * BAR, ev, [], 0.16, loop, step * 1.5)
}

// ── şehir besteleri ───────────────────────────────────────────────────────

/** derece (0 = durak) → MIDI; yedi derece bir oktav */
const deg = (m: Makam, d: number) => m.root + m.steps[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)

/** iki ölçülük ezgi ritimleri (on altılık; eksi = sus): her biri nefesle başlar ya da biter */
const RHYTHMS = [
  [-4, 4, 2, 2, 6, 2, 8, -4],
  [-2, 2, 4, 4, 4, 8, -8],
  [-4, 6, 2, 4, 4, 10, -2],
  [-6, 2, 4, 2, 2, 12, -4],
  [-4, 3, 3, 2, 4, 4, 8, -4],
]
/** karar ritmi: karar öncesi akorda inen adımlar, son nota ikinci ölçünün başında durakta uzun */
const CADENCE = [-2, 2, 4, 2, 2, 4, 12, -4]
/** B'nin uzun hava ritimleri: ney perdeleri tutar */
const LONG = [
  [-4, 8, 4, 12, -4],
  [-2, 6, 8, 12, -4],
  [-4, 12, 4, 8, -4],
]

interface Note {
  at: number
  dur: number
  /** ezgi derecesi (durak 0) */
  d: number
}

/**
 * Şehir müziği. 4/4, on altılık ızgara, swing. Form ve armoni dosyanın başında; ezgi dizinin derecelerinde kurulur:
 * iki ölçülük hücreler bir başlangıçtan hedefe kemer çizerek yürür, güçlü vuruşta ve uzun notada akor tonuna oturur.
 * Cümle: motif (soru) → cevap güçlüde asılı → motif → karar durakta. A'' ney ile kanun arasında soru-cevaptır.
 */
function citySong(city: CityKey, m: Makam): Song {
  const rand = rng(city)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const human = () => 0.9 + rand() * 0.2
  const BAR = 16
  const ev: NoteEvent[] = []
  // makamın iskeleti: çeşnisi (ikinci derece yarım ses mi), güçlüsü ve karar öncesi akoru
  const phryg = m.steps[1] === 1
  const guclu = phryg && m.steps[2] === 3 ? 3 : m.steps[3] === 4 ? 2 : 4
  // Hicaz ve Uşşak ailesi ikinci dereceden inerek karar verir; yedenli dizi beşliden, ötekiler yedinciden
  const pre = phryg ? 1 : m.steps[6] === 11 ? 4 : 6
  const A1 = pick([[0, 5, 3, guclu], [0, 3, 5, guclu], [0, 2, 3, guclu], [0, 5, 2, guclu]])
  const A2 = pick([[0, 3, pre, 0], [0, 5, pre, 0], [0, 2, pre, 0]])
  const PA = [...A1, ...A2]
  const PB = pick([[5, 3, 4, 0, 5, 3, guclu, guclu], [3, 4, 5, 0, 3, 4, guclu, guclu], [2, 5, 3, 0, 2, 5, guclu, guclu]])
  const sections: { k: 'giris' | 'A' | 'A2' | 'B' | 'A3' | 'nefes'; prog: number[] }[] = [
    { k: 'giris', prog: [0, A1[1], 0, guclu] },
    { k: 'A', prog: PA },
    { k: 'A2', prog: PA },
    { k: 'B', prog: PB },
    { k: 'A3', prog: PA },
    { k: 'nefes', prog: [0, A1[1], pre, 0] },
  ]
  // usulün vurguları on altılık ölçüye yayılır (ör. 2+2+3 → 0, 5, 9): bas ve kanun aksak bir salınımla basar
  const total = m.meter.reduce((a, b) => a + b, 0)
  const accents: number[] = []
  m.meter.reduce((a, g) => (accents.push(Math.round((a / total) * BAR)), a + g), 0)

  // ── ezgi ──
  const MO = m.root < 56 ? 14 : 7
  const tonesOf = (c: number) => [c, c + 2, c + 4].map((x) => ((x % 7) + 7) % 7)
  const snap = (x: number, c: number) => {
    for (const o of [0, -1, 1, -2, 2]) if (tonesOf(c).includes((((x + o) % 7) + 7) % 7)) return x + o
    return x
  }
  const cell = (start: number, end: number, rhythm: number[], chords: number[], arch: number): Note[] => {
    const count = rhythm.filter((r) => r > 0).length
    const out: Note[] = []
    let pos = 0
    let k = 0
    let prev = start
    for (const r of rhythm) {
      if (r < 0) {
        pos -= r
        continue
      }
      const f = count > 1 ? k / (count - 1) : 0
      let d = Math.round(start + (end - start) * f + arch * Math.sin(Math.PI * f))
      const last = k === count - 1
      const strong = pos % 8 === 0 || r >= 6 || last
      // zayıf vuruşta aynı perde art arda gelmez: komşu perdeye uğrar (ezgi kıpırdar)
      if (!strong && k > 0 && d === prev) d += k % 2 ? 1 : -1
      if (strong) d = snap(d, chords[pos < BAR ? 0 : 1])
      if (!last && Math.abs(d - prev) > 4) d = prev + Math.sign(d - prev) * 3
      out.push({ at: pos, dur: r, d })
      prev = d
      pos += r
      k++
    }
    // aynı perde iki kez üst üste gelmez: öndeki üst komşuya çıkar (son notaya üstten çözülen bir geciktirme)
    for (let j = out.length - 2; j >= 0; j--) if (out[j].d === out[j + 1].d) out[j] = { ...out[j], d: out[j].d + 1 }
    return out
  }
  const shift = (ns: Note[], by: number, at: number) => ns.map((n) => ({ ...n, at: n.at + at, d: n.d + by }))
  const r1 = pick(RHYTHMS)
  const r2 = pick(RHYTHMS.filter((r) => r !== r1))
  const s1 = MO + pick([0, 2, 4])
  const hang = MO + guclu
  const c1 = cell(s1, snap(hang, A1[1]), r1, A1.slice(0, 2), pick([1, 2]))
  const c2 = cell(hang + pick([1, 2]), hang, r2, A1.slice(2, 4), 1)
  const c4 = cell(hang + 1, MO, CADENCE, A2.slice(2, 4), pick([0, 1]))
  // A': motif üçüncü hücrede bir derece yukarıdan döner (sekvens), güçlü vuruşları yine akora oturur
  const develop = (by: number) => c1.map((n, i) => ({ ...n, d: i === c1.length - 1 || n.at % 8 === 0 ? snap(n.d + by, A2[n.at < BAR ? 0 : 1]) : n.d + by }))
  const c3 = develop(0)
  const c3seq = develop(1)
  const lineA = [...c1, ...shift(c2, 0, 2 * BAR), ...shift(c3, 0, 4 * BAR), ...shift(c4, 0, 6 * BAR)]
  const lineA2 = [...c1, ...shift(c2, 0, 2 * BAR), ...shift(c3seq, 0, 4 * BAR), ...shift(c4, 0, 6 * BAR)]
  // B: uzun hava; her iki ölçüde bir derece inen sekvens, sonunda güçlüde asılı kalır
  const rl = pick(LONG)
  const topB = hang + 2
  const lineB = [0, 1, 2, 3].flatMap((k) => {
    const st = topB - k
    const en = k === 3 ? hang : st - 1
    return shift(cell(st, en, rl, PB.slice(2 * k, 2 * k + 2), 1), 0, 2 * k * BAR)
  })
  const midiOf = (d: number) => deg(m, d)
  const kanunOf = (d: number) => {
    let n = deg(m, d + 7)
    while (n > 88) n -= 12
    return n
  }
  // süsleme: hücre başı alttan kayar, uzun notaya kimi zaman üstten çarpılır (tohumdan, hep aynı)
  const ney = (ns: Note[], at0: number, vol: number) => {
    let prevEnd = -99
    for (const n of ns) {
      const fresh = n.at - prevEnd > 1
      const from = fresh ? midiOf(n.d - 1) : n.dur >= 6 && rand() < 0.5 ? midiOf(n.d + 1) : undefined
      ev.push({ at: at0 + n.at, dur: n.dur, inst: 'ney', midi: [midiOf(n.d)], vol: vol * ARC[Math.floor(n.at / BAR)] * human(), from })
      prevEnd = n.at + n.dur
    }
  }

  // ── doku ──
  let prevV: number[] | null = null
  const chordTones = (c: number, sus = false) => [deg(m, c), deg(m, c + (sus ? 3 : 2)), deg(m, c + 4), deg(m, c + 6)]
  const bassOf = (c: number) => {
    const n = deg(m, ((c % 7) + 7) % 7)
    return lift(n - 12 * (n >= 48 ? 2 : 1))
  }
  let bar = 0
  let loop = 0
  sections.forEach((sec, si) => {
    const nextSec = sections[(si + 1) % sections.length]
    const drums = sec.k === 'A2' || sec.k === 'B' || sec.k === 'A3'
    sec.prog.forEach((c, i) => {
      const at0 = (bar + i) * BAR
      const arc = sec.prog.length === 8 ? ARC[i] : 1
      const next = sec.prog[i + 1] ?? nextSec.prog[0]
      const lastBar = i === sec.prog.length - 1
      // kararda dörtlü geciktirme: akor üçlüsü yerine dörtlüyle gelir, ölçü ortasında çözülür
      const sus = (sec.k !== 'giris' && i === 7 && c === 0) || (sec.k === 'B' && i === 7)
      const v = voiceLead(prevV, chordTones(c))
      const vs = sus ? voiceLead(v, chordTones(c, true)) : v
      prevV = v
      const key = (at: number, dur: number, midi: number[], vol: number) => ev.push({ at: at0 + at, dur, inst: 'keys', midi, vol: vol * arc * human() })
      switch (sec.k) {
        case 'giris': {
          // kırık akor, dem yavaşça kabarır, bas durakta pedal
          ;[0, 1, 2, 3, 2, 1, 2, 3].forEach((k, j) => key(j * 2, 4, [v[k]], j ? 0.05 : 0.068))
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: 0.015 + i * 0.006 })
          ev.push({ at: at0, dur: BAR, inst: 'sub', midi: [bassOf(lastBar ? c : 0)], vol: 0.07 + i * 0.012 })
          break
        }
        case 'nefes': {
          key(0, 16, vs, 0.085)
          if (sus) key(8, 8, v, 0.06)
          if (i % 2 === 1) key(10, 6, [v[3] + 12 > 88 ? v[3] : v[3] + 12], 0.045)
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: 0.03 })
          ev.push({ at: at0, dur: 14, inst: 'sub', midi: [bassOf(c)], vol: 0.1 })
          break
        }
        case 'A': {
          // piyano yalnız: uzun, yumuşak akorlar; ezgi de piyanoda
          key(0, 12, vs, 0.085)
          key(8, 8, sus ? v : v.slice(2), sus ? 0.06 : 0.045)
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: 0.03 })
          ev.push({ at: at0, dur: 8, inst: 'sub', midi: [bassOf(c)], vol: 0.11 * arc })
          ev.push({ at: at0 + 8, dur: 6, inst: 'sub', midi: [bassOf(c)], vol: 0.07 * arc })
          break
        }
        case 'B': {
          // karşıtlık: 3+3+2 vuruşlu akorlar, ikinci yarıda bas güçlüde pedal (gerilim, A'ya dönüşte çözülür)
          key(0, 6, vs, 0.085)
          key(6, 5, (sus ? v : vs).slice(1), 0.06)
          key(12, 4, v.slice(2), 0.05)
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2], v[3]], vol: 0.032 })
          if (i < 4) accents.forEach((a, j) => ev.push({ at: at0 + a, dur: j ? 3 : 5, inst: 'sub', midi: [bassOf(c)], vol: (j ? 0.1 : 0.16) * arc }))
          else {
            ev.push({ at: at0, dur: 12, inst: 'sub', midi: [bassOf(guclu)], vol: 0.14 * arc })
            ev.push({ at: at0 + 12, dur: 3, inst: 'sub', midi: [bassOf(guclu)], vol: 0.08 })
          }
          // kanun akorun tonlarını usulün vurgularıyla açar (yukarı çıkar, tepede döner)
          const kv = voiceLead(null, chordTones(c), 64, 88)
          for (let j = 0; j < 8; j++) {
            const idx = [0, 1, 2, 3, 2, 1, 2, 3][j]
            const strong = accents.includes(j * 2)
            ev.push({ at: at0 + j * 2, dur: 2, inst: 'kanun', midi: [kv[idx]], vol: (strong ? 0.032 : 0.022) * arc })
          }
          break
        }
        default: {
          // A' ve A'': tam doku; akor başta, "ve"de iç sesler; bas kök, beşli ve bir sonraki köke geçiş notası
          key(0, 7, vs, 0.1)
          key(7, 6, (sus ? v : vs).slice(1), 0.065)
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: sec.k === 'A3' ? 0.036 : 0.03 })
          const root = bassOf(c)
          ev.push({ at: at0, dur: 6, inst: 'sub', midi: [root], vol: 0.16 * arc })
          ev.push({ at: at0 + 10, dur: 3, inst: 'sub', midi: [bassOf(c + 4)], vol: 0.1 * arc })
          if (next !== c) ev.push({ at: at0 + 14, dur: 2, inst: 'sub', midi: [bassOf(next + (next > c ? -1 : 1))], vol: 0.08 * arc })
        }
      }
      // A'nın son ölçüsünde kenar vuruşu davulun girişini haber verir
      if (sec.k === 'A' && lastBar) for (const [a, vol] of [[13, 0.03], [14, 0.045], [15, 0.06]]) ev.push({ at: at0 + a, dur: 1, inst: 'rim', midi: [], vol })
      if (drums) {
        // fırça davul: bölüm sonunda küçük bir dolgu bir sonraki bölümü haber verir; B'de bas davul usule basar
        const fill = lastBar && nextSec.k !== 'nefes'
        const kicks = sec.k === 'B' ? accents : [0, 10]
        kicks.forEach((a, j) => ev.push({ at: at0 + a, dur: 1, inst: 'kick', midi: [], vol: (j ? 0.15 : 0.24) * arc }))
        ev.push({ at: at0 + 4, dur: 1, inst: 'rim', midi: [], vol: 0.085 * arc })
        ev.push({ at: at0 + 12, dur: 1, inst: 'rim', midi: [], vol: 0.085 * arc })
        if (sec.k === 'A3' && i % 2) ev.push({ at: at0 + 7, dur: 1, inst: 'rim', midi: [], vol: 0.03 })
        if (fill) {
          ev.push({ at: at0 + 14, dur: 1, inst: 'rim', midi: [], vol: 0.055 })
          ev.push({ at: at0 + 15, dur: 1, inst: 'rim', midi: [], vol: 0.07 })
        }
        for (let k = 0; k < (fill ? 12 : BAR); k++) {
          if (k % 2 && sec.k !== 'B') continue
          const v = k % 4 === 0 ? 0.03 : k % 2 === 0 ? 0.02 : 0.011
          // A'nın ilk ölçülerinde zil yavaşça girer
          const enter = sec.k === 'A2' && i < 2 ? 0.55 + i * 0.25 : 1
          ev.push({ at: at0 + k, dur: 1, inst: 'hat', midi: [], vol: v * enter * human() })
        }
      }
    })
    const at = bar * BAR
    if (sec.k === 'A') {
      for (const n of lineA) ev.push({ at: at + n.at, dur: n.dur, inst: 'keys', midi: [midiOf(n.d) + 12 > 88 ? midiOf(n.d) : midiOf(n.d) + 12], vol: 0.06 * ARC[Math.floor(n.at / BAR)] * human() })
    } else if (sec.k === 'A2') ney(lineA2, at, 0.088)
    else if (sec.k === 'B') {
      ney(lineB, at, 0.08)
      const fin = lineB[lineB.length - 1]
      ev.push({ at: at + fin.at + 2, dur: Math.max(2, fin.dur - 2), inst: 'kanun', midi: [kanunOf(fin.d)], vol: 0.024, trem: true })
    } else if (sec.k === 'A3') {
      // soru-cevap: ney sorar (1. ve 3. hücre), kanun bir oktav yukarıdan cevaplar (2. hücre), karar yine neyde
      ney(c1, at, 0.09)
      for (const n of c2) ev.push({ at: at + 2 * BAR + n.at, dur: n.dur, inst: 'kanun', midi: [kanunOf(n.d)], vol: 0.055 * human() })
      ney(shift(c3seq, 0, 4 * BAR), at, 0.09)
      ney(shift(c4, 0, 6 * BAR), at, 0.088)
      const fin = c4[c4.length - 1]
      ev.push({ at: at + 6 * BAR + fin.at + 4, dur: fin.dur - 4, inst: 'kanun', midi: [kanunOf(fin.d)], vol: 0.022, trem: true })
    }
    bar += sec.prog.length
    if (sec.k === 'giris') loop = bar * BAR
  })
  // tempo usulden: oyun havaları (sık usul) biraz canlı, ağır havalar dingin; hepsi rahat bir aralıkta
  const bpm = Math.round(Math.min(84, Math.max(70, 96 - m.tempo * 110)))
  const step = 60 / bpm / 4
  return song(city, step, bar * BAR, ev, [4, 4, 4, 4], 0.22, loop, step * 3)
}

function song(id: string, step: number, length: number, events: NoteEvent[], pulse: number[], swing: number, loop: number, echo: number): Song {
  const byStep: NoteEvent[][] = Array.from({ length }, () => [])
  for (const e of events) byStep[e.at].push(e)
  return { id, step, length, events, byStep, pulse, swing, loop, echo }
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
