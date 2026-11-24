import type { CityKey } from './types'

/**
 * Besteli müzik: notalar burada veri olarak durur, sesi audio.ts çalar. DOM'suz, testlenebilir.
 *
 * - Jenerik (menüler): Re minörde, B kısmında Hicaz renkli tema. Giriş (bir kez) → A piyano söyler → B ney girer,
 *   fırça davul → A ney, kanun uzun notalara cevap verir → B herkes, kanun tremolosu; sonra A'ya döner.
 * - Oyun (şehir başına): şehrin makamında, adından tohumlanmış sabit bir beste. Giriş (bir kez) → A (piyano ezgisi) →
 *   A' (ney, motif bir derece yukarıdan sekvensle gelişir) → B (karşıtlık: uzun ney perdeleri, kanun arpeji, güçlü
 *   üstünde pedal bas) → A'' (ney sorar, kanun cevaplar) → nefes (ince doku) → C (köprü, arpej) → A4 (motif başka
 *   ritimle, karşı ezgi) → B' → nefes → A'ya döner (64 ölçülük döngü, ~3 dk). Cümleler sekiz ölçüdür:
 *   ilk yarı güçlüde asılı kalır, ikinci yarı makamın karar akoruyla durakta biter. Akorlar en yakın çevrimle yürür,
 *   kararda dörtlü geciktirme üçlüye çözülür. Tempo şehrin usulünden (70-84 BPM), bas ve kanun usulün vurgularına basar.
 *   Defter'deki Müzik Kutusu bunları dinletir.
 */

export type Inst = 'ney' | 'kanun' | 'keys' | 'pad' | 'sub' | 'kick' | 'rim' | 'hat' | 'tom'

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
  /** döngünün yalnız çift (0) ya da tek (1) turunda çalar: ikinci turda ezgi başka çalgıda gelir, tekrar duygusu azalır */
  pass?: 0 | 1
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
  // Uşşak, ağır zeybek 9/8 (Balıkesir)
  balikesir: { root: 55, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.19 },
  // Hüseyni, Bingöl dağ havası 10/8
  bingol: { root: 52, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [3, 2, 2, 3], tempo: 0.17 },
  // Hüzzam, Afyon zeybeği 9/8
  afyon: { root: 53, steps: [0, 1, 4, 5, 7, 8, 11, 12], meter: [2, 2, 2, 3], tempo: 0.18 },
  // Kürdi, Harput havası 7/8 (Elazığ)
  elazig: { root: 50, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.17 },
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
// C (köprü): A ve B'den ayrı bir kemer: yukarıdan başlar, basamak basamak iner, A7'de (Hicaz rengi) durur
const TITLE_C: Bar[] = [
  [[77, 3], [74, 1], [72, 2], [70, 2]],
  [[69, 2], [72, 2], [77, 3], [76, 1]],
  [[76, 3], [74, 1], [72, 2], [67, 2]],
  [[74, 2], [72, 1], [69, 1], [65, 2], [69, 2]],
  [[74, 4], [77, 2], [79, 2]],
  [[79, 2], [77, 2], [74, 2], [70, 1], [74, 1]],
  [[73, 3], [76, 1], [77, 2], [73, 2]],
  [[76, 2], [73, 2], [69, 4]],
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
const TITLE_CHORDS_C = ['Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A', 'A']
const TITLE_INTRO = ['Dm', 'Bb', 'Gm', 'A']
// nefes: ezgisiz dört ölçü (kırık akor, dem); ilki C'ye, ikincisi başa döner
const TITLE_BREATH_1 = ['Dm', 'Gm', 'Bb', 'A']
const TITLE_BREATH_2 = ['Bb', 'Gm', 'F', 'A']

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
  const drums = (at0: number, i: number, fill: boolean, vol: number) => {
    ev.push({ at: at0, dur: 1, inst: 'kick', midi: [], vol: 0.2 * vol * human() })
    ev.push({ at: at0 + 5, dur: 1, inst: 'kick', midi: [], vol: 0.12 * vol * human() })
    ev.push({ at: at0 + 2, dur: 1, inst: 'rim', midi: [], vol: 0.07 * vol * human() })
    ev.push({ at: at0 + 6, dur: 1, inst: 'rim', midi: [], vol: (fill ? 0.06 : 0.07) * vol })
    // hayalet vuruşlar ve dört ölçüde bir küçük kıpırtı: aynı ölçü art arda aynı çalmaz
    if (i % 2) ev.push({ at: at0 + 3, dur: 1, inst: 'rim', midi: [], vol: 0.022 * vol })
    if (i % 4 === 3 && !fill) ev.push({ at: at0 + 7, dur: 1, inst: 'kick', midi: [], vol: 0.07 * vol })
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

  // form: A B A B · nefes · C A' B' · nefes (64 ölçü, ~3 dk): bölüm sırası ve ezgi rengi değişir, yorgunluk azalır.
  // dyn: bölümün genel gücü (seyrek bölümler kısık), lead: ezgiyi kim söyler (both: piyano üstte, ney altta)
  const plan: { mel: Bar[]; ch: string[]; lead: 'keys' | 'ney' | 'both'; drums: boolean; answer: boolean; arp: boolean; dyn: number }[] = [
    { mel: TITLE_A, ch: TITLE_CHORDS_A, lead: 'keys', drums: false, answer: false, arp: false, dyn: 0.9 },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, lead: 'ney', drums: true, answer: false, arp: true, dyn: 1 },
    { mel: TITLE_A, ch: TITLE_CHORDS_A, lead: 'ney', drums: true, answer: true, arp: false, dyn: 1 },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, lead: 'ney', drums: true, answer: true, arp: true, dyn: 1 },
    { mel: [], ch: TITLE_BREATH_1, lead: 'keys', drums: false, answer: false, arp: false, dyn: 0.75 },
    { mel: TITLE_C, ch: TITLE_CHORDS_C, lead: 'keys', drums: false, answer: true, arp: true, dyn: 0.85 },
    { mel: TITLE_A, ch: TITLE_CHORDS_A, lead: 'both', drums: true, answer: true, arp: false, dyn: 0.95 },
    { mel: TITLE_B, ch: TITLE_CHORDS_B, lead: 'ney', drums: true, answer: true, arp: true, dyn: 1 },
    { mel: [], ch: TITLE_BREATH_2, lead: 'keys', drums: false, answer: false, arp: false, dyn: 0.7 },
  ]
  plan.forEach((sec, si) => {
    const nextSec = plan[(si + 1) % plan.length]
    const bars = sec.ch.length
    const breath = sec.mel.length === 0
    for (let i = 0; i < bars; i++) {
      const m = sec.mel[i]
      const at0 = (bar + i) * BAR
      const arc = (bars === 8 ? ARC[i] : 1) * sec.dyn
      const next = sec.ch[i + 1] ?? nextSec.ch[0]
      comp(sec.ch[i], at0, breath ? 'arp' : sec.lead === 'keys' ? 'soft' : 'full', next, breath ? 0.8 * sec.dyn : arc)
      if (sec.drums) drums(at0, i, i === bars - 1, arc * (si === 1 && i < 2 ? 0.7 : 1))
      if (breath) {
        // nefes: kanun son ölçüde başın ilk notasını uzaktan anar
        if (i === bars - 1) ev.push({ at: at0 + 1, dur: 6, inst: 'kanun', midi: [si === 4 ? 81 : 74], vol: 0.02, trem: true })
        continue
      }
      // ezgi: cümle başında ve uzun notada ney alttan kayarak girer
      let s = at0
      let prev: number | null = null
      for (const [n, d] of m) {
        if (n !== null) {
          if (sec.lead !== 'ney') ev.push({ at: s, dur: d, inst: 'keys', midi: [n + 12], vol: (sec.lead === 'both' ? 0.062 : 0.075) * arc * human() })
          if (sec.lead !== 'keys') {
            const from = prev === null || d >= 3 ? n - ([5, 10, 1].includes(n % 12) ? 1 : 2) : undefined
            ev.push({ at: s, dur: d, inst: 'ney', midi: [n], vol: (sec.lead === 'both' ? 0.07 : 0.085) * arc * human(), from })
          }
          // kanun uzun notalara bir oktav yukarıdan, iki sekizlik sonra cevap verir; cümle sonunda tremolo
          if (sec.answer && d >= 3 && s + 2 < at0 + BAR) {
            const last = i === bars - 1 || i === 3
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
    }
    bar += bars
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
 * Uzun form (68 ölçü: 4 giriş + 64 döngü): A · A' · B · A'' · nefes · C (köprü: yukarıdan inen yeni kemer, arpej) · A4 (motif
 * başka ritimle, üçüncü cümle iki derece yukarıda, kanun üçlü aşağıdan eşlik eder) · B' (uzun hava başka ritimle, kanun
 * oktav yukarıdan ikiler) · nefes (motifin başı uzatılarak anılır). Bölümlerin gücü (`DYN`) değişir: seyrek bölümler kısık.
 */
const DYN: Record<string, number> = { giris: 1, A: 0.92, A2: 1, B: 1, A3: 1, nefes: 0.8, C: 0.88, A4: 1.02, B2: 0.97, nefes2: 0.7 }

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
  // köprü: ana akorlardan uzakta (altıncı, dördüncü derece) başlar, güçlüde asılı biter ve A'ya çözülür
  const PC = pick([[5, 3, 2, 4, 5, 3, guclu, guclu], [3, 5, 2, 4, 3, 5, pre, guclu], [4, 2, 5, 3, 4, 2, guclu, guclu]])
  type Kind = 'giris' | 'A' | 'A2' | 'B' | 'A3' | 'nefes' | 'C' | 'A4' | 'B2' | 'nefes2'
  const sections: { k: Kind; prog: number[] }[] = [
    { k: 'giris', prog: [0, A1[1], 0, guclu] },
    { k: 'A', prog: PA },
    { k: 'A2', prog: PA },
    { k: 'B', prog: PB },
    { k: 'A3', prog: PA },
    { k: 'nefes', prog: [0, A1[1], pre, 0] },
    { k: 'C', prog: PC },
    { k: 'A4', prog: PA },
    { k: 'B2', prog: PB },
    { k: 'nefes2', prog: [A1[1], 3, pre, 0] },
  ]
  // usulün vurguları on altılık ölçüye yayılır (ör. 2+2+3 → 0, 5, 9): bas ve kanun aksak bir salınımla basar
  const total = m.meter.reduce((a, b) => a + b, 0)
  const accents: number[] = []
  m.meter.reduce((a, g) => (accents.push(Math.round((a / total) * BAR)), a + g), 0)
  /** aksak usul (2+2+3, 3+3+2 …): davul usulün vurgularına basar; düz usulde lo-fi ritmi */
  const aksak = m.meter.some((g) => g !== m.meter[0])

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
  // köprü ve dördüncü anlatım başka ritimle gelir: aynı motif, başka nefes
  const rest = RHYTHMS.filter((r) => r !== r1 && r !== r2)
  const rc = pick(rest)
  const rv = pick(rest.filter((r) => r !== rc))
  const s1 = MO + pick([0, 2, 4])
  const hang = MO + guclu
  const c1 = cell(s1, snap(hang, A1[1]), r1, A1.slice(0, 2), pick([1, 2]))
  const c2 = cell(hang + pick([1, 2]), hang, r2, A1.slice(2, 4), 1)
  const c4 = cell(hang + 1, MO, CADENCE, A2.slice(2, 4), pick([0, 1]))
  // A': motif üçüncü hücrede bir derece yukarıdan döner (sekvens), güçlü vuruşları yine akora oturur
  const develop = (by: number, src = c1) => src.map((n, i) => ({ ...n, d: i === src.length - 1 || n.at % 8 === 0 ? snap(n.d + by, A2[n.at < BAR ? 0 : 1]) : n.d + by }))
  const c3 = develop(0)
  const c3seq = develop(1)
  const lineA = [...c1, ...shift(c2, 0, 2 * BAR), ...shift(c3, 0, 4 * BAR), ...shift(c4, 0, 6 * BAR)]
  const lineA2 = [...c1, ...shift(c2, 0, 2 * BAR), ...shift(c3seq, 0, 4 * BAR), ...shift(c4, 0, 6 * BAR)]
  // A4: motif başka ritimle ve bir derece yüksekten başlar, üçüncü cümle iki derece yukarıda (doruk), karar aynı
  const cv1 = cell(s1 + 1, snap(hang + 1, A1[1]), rv, A1.slice(0, 2), 1)
  const cv3 = develop(2, cv1)
  const lineA4 = [...cv1, ...shift(c2, 0, 2 * BAR), ...shift(cv3, 0, 4 * BAR), ...shift(c4, 0, 6 * BAR)]
  // B: uzun hava; her iki ölçüde bir derece inen sekvens, sonunda güçlüde asılı kalır
  const longLine = (rl: number[], top: number) =>
    [0, 1, 2, 3].flatMap((k) => {
      const st = top - k
      const en = k === 3 ? hang : st - 1
      return shift(cell(st, en, rl, PB.slice(2 * k, 2 * k + 2), 1), 0, 2 * k * BAR)
    })
  const rl = pick(LONG)
  const lineB = longLine(rl, hang + 2)
  const lineB2 = longLine(pick(LONG.filter((r) => r !== rl)), hang + 3)
  // C: yukarıdan basamak basamak iner, her hücre bir öncekinden bir derece alçaktan başlar (kemer)
  const lineC = [0, 1, 2, 3].flatMap((k) => {
    const st = hang + 3 - k
    const en = k === 3 ? hang : st - 1
    return shift(cell(st, en, rc, PC.slice(2 * k, 2 * k + 2), 1), 0, 2 * k * BAR)
  })
  const midiOf = (d: number) => deg(m, d)
  /** piyano ezgiyi bir oktav yukarıdan çalar; çok tizse yerinde bırakılır */
  const keysOf = (d: number) => (midiOf(d) + 12 > 88 ? midiOf(d) : midiOf(d) + 12)
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
  /** geçiş notaları: bölümün ilk notasından önceki boşlukta, ona basamakla yaklaşan iki kısık piyano notası */
  const pickup = (ns: Note[], at0: number, vol: number) => {
    const f = ns[0]
    if (f.at < 3) return
    ;[2, 1].forEach((back) => ev.push({ at: at0 + f.at - back, dur: 1, inst: 'keys', midi: [keysOf(f.d - back)], vol: vol * (back === 2 ? 0.8 : 1) * human() }))
  }
  /** uzun notalara üçlü aşağıdan ve gecikmeli eşlik eden karşı ezgi (kanun, tek çekiş) */
  const counter = (ns: Note[], at0: number, vol: number) => {
    for (const n of ns) if (n.dur >= 6 && n.at % BAR < 12) ev.push({ at: at0 + n.at + 3, dur: 1, inst: 'kanun', midi: [kanunOf(n.d - 2)], vol: vol * human() })
  }
  /** uzun notanın ortasında kanun oktav yukarıdan tek çekişle ikiler */
  const hold = (ns: Note[], at0: number, vol: number) => {
    for (const n of ns) if (n.dur >= 8) ev.push({ at: at0 + n.at + 3, dur: 1, inst: 'kanun', midi: [kanunOf(n.d)], vol: vol * human() })
  }
  /**
   * soru-cevap: ezgi nefes alırken (en az dört adımlık sus) kanun son iki perdeyi oktav yukarıdan, üstten dolanarak yankılar;
   * cevap susa sığar, ezginin bir sonraki notasına basmaz
   */
  const answer = (ns: Note[], at0: number, vol: number) => {
    ns.forEach((n, j) => {
      const end = n.at + n.dur
      const gap = (ns[j + 1]?.at ?? 8 * BAR) - end
      if (gap < 4 || j === 0 || end >= 8 * BAR - 2) return
      ;[ns[j - 1].d + 1, n.d + 1, n.d].forEach((d, k) =>
        ev.push({ at: at0 + end + 1 + k, dur: k === 2 ? Math.min(3, gap - 3) : 1, inst: 'kanun', midi: [kanunOf(d)], vol: vol * (k === 2 ? 1 : 0.8) * human() }),
      )
    })
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
    const nextSec = sections[si + 1] ?? sections[1]
    const drums = sec.k === 'A2' || sec.k === 'B' || sec.k === 'A3' || sec.k === 'A4' || sec.k === 'B2'
    const isB = sec.k === 'B' || sec.k === 'B2'
    const dyn = DYN[sec.k]
    sec.prog.forEach((c, i) => {
      const at0 = (bar + i) * BAR
      const arc = (sec.prog.length === 8 ? ARC[i] : 1) * dyn
      const next = sec.prog[i + 1] ?? nextSec.prog[0]
      const lastBar = i === sec.prog.length - 1
      // kararda dörtlü geciktirme: akor üçlüsü yerine dörtlüyle gelir, ölçü ortasında çözülür
      const sus = (sec.k !== 'giris' && i === 7 && c === 0) || (isB && i === 7)
      const v = voiceLead(prevV, chordTones(c))
      const vs = sus ? voiceLead(v, chordTones(c, true)) : v
      prevV = v
      const key = (at: number, dur: number, midi: number[], vol: number) => ev.push({ at: at0 + at, dur, inst: 'keys', midi, vol: vol * arc * human() })
      switch (sec.k) {
        case 'giris': {
          // kırık akor, dem yavaşça kabarır, bas durakta pedal
          ;[0, 1, 2, 3, 2, 1, 2, 3].forEach((k, j) => key(j * 2, 4, [v[k]], j ? 0.05 : 0.068))
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: 0.015 + i * 0.006 })
          ev.push({ at: at0, dur: BAR, inst: 'sub', midi: [bassOf(lastBar ? c : 0)], vol: 0.055 + i * 0.01 })
          break
        }
        case 'nefes':
        case 'nefes2': {
          // nefes: ince doku. Piyano tek uzun akor, bas pedal; ikinci nefeste kırık akor yalnız ortada, davul yok
          key(0, 16, vs, sec.k === 'nefes' ? 0.085 : 0.07)
          if (sus) key(8, 8, v, 0.06)
          if (sec.k === 'nefes' && i % 2 === 1) key(10, 6, [v[3] + 12 > 88 ? v[3] : v[3] + 12], 0.045)
          if (sec.k === 'nefes2' && i >= 1) [0, 1, 2, 3].forEach((k, j) => key(4 + j * 2, 4, [v[k]], 0.032 - j * 0.004))
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: sec.k === 'nefes' ? 0.03 : 0.026 })
          ev.push({ at: at0, dur: 14, inst: 'sub', midi: [bassOf(c)], vol: sec.k === 'nefes' ? 0.1 : 0.075 })
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
        case 'C': {
          // köprü: piyano akoru bir kez basar, ardından kırık akor (arpej) usulün sekizliklerinde akar; bas ve dem hafif
          key(0, 10, vs, 0.06)
          const kv = voiceLead(null, chordTones(c), 58, 82)
          ;[0, 1, 2, 3, 2, 1].forEach((k, j) => key(4 + j * 2, 4, [kv[k]], 0.034 + (j % 3 === 0 ? 0.006 : 0)))
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2], v[3]], vol: 0.034 })
          ev.push({ at: at0, dur: 10, inst: 'sub', midi: [bassOf(c)], vol: 0.09 * arc })
          ev.push({ at: at0 + 12, dur: 3, inst: 'sub', midi: [bassOf(c)], vol: 0.06 * arc })
          break
        }
        case 'B':
        case 'B2': {
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
          // A', A'' ve A4: tam doku; akor başta, "ve"de iç sesler; bas kök, beşli ve bir sonraki köke geçiş notası
          // akor başta, "ve"de iç sesler; dört ölçüde bir piyano senkoplu basar (aynı vuruş her ölçüde tekrarlanmaz)
          key(0, 7, vs, 0.1)
          if (i % 4 === 3 && !sus) {
            key(6, 2, v.slice(1), 0.045)
            key(10, 6, v.slice(1), 0.06)
          } else key(7, 6, (sus ? v : vs).slice(1), 0.065)
          ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2]], vol: sec.k === 'A3' || sec.k === 'A4' ? 0.036 : 0.03 })
          const root = bassOf(c)
          ev.push({ at: at0, dur: 6, inst: 'sub', midi: [root], vol: 0.16 * arc })
          // tek ölçülerde bas oktav yukarı sekip bas davulla buluşur (yürüyen, kıpır bir bas)
          if (i % 2 === 1 && !aksak) ev.push({ at: at0 + 7, dur: 2, inst: 'sub', midi: [root + 12 > 60 ? root : root + 12], vol: 0.06 * arc })
          ev.push({ at: at0 + 10, dur: 3, inst: 'sub', midi: [bassOf(c + 4)], vol: 0.1 * arc })
          if (next !== c) ev.push({ at: at0 + 14, dur: 2, inst: 'sub', midi: [bassOf(next + (next > c ? -1 : 1))], vol: 0.08 * arc })
        }
      }
      // A'nın ve köprünün son ölçüsünde kenar vuruşu davulun girişini haber verir
      if ((sec.k === 'A' || sec.k === 'C') && lastBar) for (const [a, vol] of [[13, 0.03], [14, 0.045], [15, 0.06]]) ev.push({ at: at0 + a, dur: 1, inst: 'rim', midi: [], vol })
      if (drums) {
        // fırça davul. Düz usulde (2+2+2+2) lo-fi "bir … ve-üç", aksak usulde bas davul usulün vurgularına basar (şehrin
        // usulü duyulur). A'larda kenar vuruşu ikide ve dörtte, B'de yarım tempo (yalnız üçte): bölümler ayrışır. Tek
        // ölçülerde hayalet vuruşlar, dört ölçüde bir küçük dolgu, bölüm sonunda kabaran dolgu bir sonraki bölümü haber verir.
        const fill = lastBar && !nextSec.k.startsWith('nefes')
        const odd = i % 2 === 1
        const kicks = isB ? accents : aksak ? [0, ...accents.slice(1).filter((a) => a >= 6)] : odd ? [0, 7, 10] : [0, 10]
        kicks.forEach((a, j) => ev.push({ at: at0 + a, dur: 1, inst: 'kick', midi: [], vol: (j ? (a === 7 && !aksak ? 0.09 : 0.14) : 0.24) * arc * human() }))
        const rim = (a: number, vol: number) => ev.push({ at: at0 + a, dur: 1, inst: 'rim', midi: [], vol: vol * human() })
        if (isB) {
          rim(8, 0.095 * arc)
          if (odd) rim(14, 0.022)
        } else {
          rim(4, 0.085 * arc)
          rim(12, 0.085 * arc)
          // hayalet vuruşlar: fırçanın deriye hafifçe değişi
          if (odd) rim(7, 0.024)
          else if (sec.k !== 'A2') rim(10, 0.018)
        }
        if (fill) [[12, 0.03], [13, 0.045], [14, 0.062], [15, 0.078]].forEach(([a, vol]) => rim(a, vol))
        else if (i % 4 === 3) rim(15, 0.04)
        // zil: sekizlikler vuruşta güçlü, arada hafif; B ve A4'te on altılıklar (sallantı), A''de vuruş öncesi kıpırtı
        const sixteenth = isB || sec.k === 'A4'
        for (let k = 0; k < (fill ? 12 : BAR); k++) {
          const off = k % 2 === 1
          if (off && !sixteenth && !(sec.k === 'A3' && (k === 7 || k === 15))) continue
          const v = k % 4 === 0 ? 0.03 : k % 4 === 2 ? 0.02 : 0.011
          // A'nın ilk ölçülerinde zil yavaşça girer
          const enter = sec.k === 'A2' && i < 2 ? 0.55 + i * 0.25 : 1
          ev.push({ at: at0 + k, dur: 1, inst: 'hat', midi: [], vol: v * enter * human() })
        }
      }
    })
    const at = bar * BAR
    if (sec.k === 'A') {
      // ilk turda piyano söyler; döngünün ikinci turunda ezgiyi kanun alır (uzun notada tremolo), piyano yumuşakça ikiler
      for (const n of lineA) {
        const a = ARC[Math.floor(n.at / BAR)] * dyn
        ev.push({ at: at + n.at, dur: n.dur, inst: 'keys', midi: [keysOf(n.d)], vol: 0.06 * a * human(), pass: 0 })
        ev.push({ at: at + n.at, dur: n.dur, inst: 'kanun', midi: [midiOf(n.d + 7) > 88 ? midiOf(n.d) : midiOf(n.d + 7)], vol: (n.dur >= 8 ? 0.04 : 0.06) * a * human(), trem: n.dur >= 8, pass: 1 })
        if (n.dur >= 6) ev.push({ at: at + n.at, dur: n.dur, inst: 'keys', midi: [midiOf(n.d)], vol: 0.032 * a * human(), pass: 1 })
      }
    } else if (sec.k === 'A2') {
      ney(lineA2, at, 0.088)
      answer(lineA2, at, 0.034)
    } else if (sec.k === 'B') {
      ney(lineB, at, 0.08)
      pickup(lineB, at, 0.03)
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
    } else if (sec.k === 'C') {
      // köprü: piyano söyler (bir oktav yukarıda, yumuşak), ikinci yarıda ney alttan katılır, kanun uzun notaları ikiler
      for (const n of lineC) ev.push({ at: at + n.at, dur: n.dur, inst: 'keys', midi: [keysOf(n.d)], vol: 0.058 * ARC[Math.floor(n.at / BAR)] * dyn * human() })
      ney(lineC.filter((n) => n.at >= 4 * BAR), at, 0.07)
      hold(lineC, at, 0.028)
      pickup(lineC, at, 0.028)
    } else if (sec.k === 'A4') {
      // dördüncü anlatım: ney başka ritimle söyler, piyano oktav yukarıdan yumuşakça ikiler, kanun üçlü aşağıdan karşı ezgi
      ney(lineA4, at, 0.09)
      answer(lineA4, at, 0.03)
      for (const n of lineA4) if (n.dur >= 4) ev.push({ at: at + n.at, dur: n.dur, inst: 'keys', midi: [keysOf(n.d)], vol: 0.04 * ARC[Math.floor(n.at / BAR)] * human() })
      counter(lineA4, at, 0.026)
      pickup(lineA4, at, 0.03)
      const fin = c4[c4.length - 1]
      ev.push({ at: at + 6 * BAR + fin.at + 4, dur: fin.dur - 4, inst: 'kanun', midi: [kanunOf(fin.d)], vol: 0.022, trem: true })
    } else if (sec.k === 'B2') {
      ney(lineB2, at, 0.078)
      hold(lineB2, at, 0.034)
      pickup(lineB2, at, 0.03)
      const fin = lineB2[lineB2.length - 1]
      ev.push({ at: at + fin.at + 2, dur: Math.max(2, fin.dur - 2), inst: 'kanun', midi: [kanunOf(fin.d)], vol: 0.024, trem: true })
    } else if (sec.k === 'nefes2') {
      // motifin başı uzatılarak (iki katı yavaş) anılır: dinlenirken ezgi akılda kalsın
      // (ikinci turda kanun anar)
      for (const n of c1.slice(0, 4)) {
        const e = { at: at + 2 * BAR + Math.round(n.at * 1.5), dur: Math.min(12, n.dur * 2) }
        ev.push({ ...e, inst: 'keys', midi: [keysOf(n.d)], vol: 0.04 * human(), pass: 0 })
        ev.push({ ...e, inst: 'kanun', midi: [kanunOf(n.d)], vol: 0.034 * human(), trem: e.dur >= 8, pass: 1 })
      }
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
