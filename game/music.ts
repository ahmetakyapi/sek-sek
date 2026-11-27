import type { CityKey } from './types'

/**
 * Besteli müzik: notalar burada veri olarak durur, sesi audio.ts çalar. DOM'suz, testlenebilir.
 *
 * Oyunun her yerinde (menü, şehir, boss, Co-op, Yarış, Müzik Kutusu) tek beste çalar: jenerik. Re minör, B'de ve
 * kadansta Hicaz rengi (La7♭9), ~64 BPM sekizlik ızgara, hafif sallantı. "Düşük kortizol" (25 Kasım 2026, kullanıcı
 * isteği): davul yok; uzun soluklu dem (yaylı yatak) her ölçüyü sarar, müzik kutusu çanı (`bell`) akorun tepesinden
 * seyrek notalar serper, piyano keçeli piyano gibi yumuşak. Form: giriş (bir kez) → A (piyano söyler) → A′ (ney,
 * kanun uzun notalara cevap verir, ney üstten çarpar) → B (ney, kanun arpeji) → A″ (ney
 * sorar, kanun oktav yukarıdan cevaplar) → nefes → C (köprü: piyano, ikinci yarıda ney) → A4 (motif başka ritimle, doruk
 * yukarıda, kanun üçlü aşağıdan karşı ezgi) → B′ (karara inen yeni son) → nefes (motifin başı yavaşça anılır) → A'ya
 * döner. 64 ölçülük döngü (~3,4 dk); döngünün ikinci turunda ezgiyi A'da ve nefeste kanun, köprüde ney alır (`pass`):
 * aynı tur ~6,7 dk'da bir döner. Akorlar en yakın çevrimle yürür (`voiceLead`), kararda dörtlü geciktirme üçlüye
 * çözülür. Boss katmanı audio.ts'te, bestenin ölçü köklerine (`roots`) basar.
 */

export type Inst = 'ney' | 'kanun' | 'keys' | 'pad' | 'bell' | 'sub' | 'kick' | 'rim' | 'hat' | 'tom'

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
  /** bir ölçünün adım sayısı */
  bar: number
  /** ölçü başına bas kökü (MIDI): boss katmanı bestenin armonisine basar */
  roots: number[]
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
}

/** şehrin makamı: kök (MIDI), dizi (yarım ses adımları), yalnız efektler kullanır: bayrak arpeji, hatıra çanı şehrin dizisinde çalar */
export const SCALES: Record<CityKey, Makam> = {
  // Hicaz (Re)
  istanbul: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Nihavend'e yakın
  konya: { root: 57, steps: [0, 2, 4, 5, 7, 9, 10, 12] },
  nevsehir: { root: 59, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  gaziantep: { root: 60, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  trabzon: { root: 62, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Hüseyni, ağır zeybek (Çanakkale)
  canakkale: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Karadeniz kıyısı, 7/8 (Sinop)
  sinop: { root: 60, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Uşşak, uzun hava ağırlığı (Diyarbakır)
  diyarbakir: { root: 57, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Hicaz, Trakya 9/8'i (Edirne)
  edirne: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Rast, ağırbaşlı (Bursa)
  bursa: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  // Hüseyni, Teke zeybeği 9/8 (Antalya)
  antalya: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hicaz, sıra gecesi (Şanlıurfa)
  sanliurfa: { root: 59, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Uşşak, göl kıyısı (Van)
  van: { root: 57, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Hüseyni, Orta Anadolu oyun havası 9/8 (Kayseri)
  kayseri: { root: 60, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hicaz, Antakya ağırlığı (Hatay)
  hatay: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Rast, şen bir öğrenci şehri (Eskişehir)
  eskisehir: { root: 60, steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  // Hüseyni, bar havası 5/8 (Erzurum)
  erzurum: { root: 59, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  kocaeli: { root: 60, steps: [0, 2, 3, 5, 7, 8, 11, 12] },
  // Rast, zeybek usulü 9/8
  izmir: { root: 60, steps: [0, 2, 4, 5, 7, 9, 10, 12] },
  // Kürdi, Ankara havası
  ankara: { root: 62, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Hicaz, Çukurova türküsü havası
  adana: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Hicaz (La)
  mardin: { root: 57, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Uşşak'a yakın (Re)
  malatya: { root: 62, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Rast'a yakın (Sol)
  corum: { root: 55, steps: [0, 2, 4, 5, 7, 9, 10, 12] },
  // Karadeniz horonu, 7/8
  ordu: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hüseyni'ye yakın (La)
  sivas: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Kafkas havası, Uşşak'a yakın
  ardahan: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Hüseyni, Yeşilırmak kıyısında ağır bir türkü (Amasya)
  amasya: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Rast'a yakın, Ege zeybeği 9/8 (Muğla)
  mugla: { root: 62, steps: [0, 2, 4, 5, 7, 9, 10, 12] },
  // Saba'ya yakın (Re)
  bayburt: { root: 50, steps: [0, 2, 3, 4, 7, 8, 10, 12] },
  // Karadeniz, kemençe ve tulum 7/8 (Rize)
  rize: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Karadeniz yaylası 7/8 (Artvin)
  artvin: { root: 60, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Kafkas havası, Uşşak’a yakın (Kars)
  kars: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Uşşak, uzun hava ağırlığı (Bitlis)
  bitlis: { root: 59, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Karadeniz horonu 7/8, Hüseyni (Giresun)
  giresun: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hicaz, Tokat türküsü ağırlığı (Tokat)
  tokat: { root: 60, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Kürdi, Ege zeybeği 9/8 (Denizli)
  denizli: { root: 57, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Hüseyni, Karadeniz madenci türküsü 9/8 ağırlığı (Zonguldak)
  zonguldak: { root: 50, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hicaz, Akdeniz kıyısı ve Yörük havası 9/8 (Mersin)
  mersin: { root: 59, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
  // Uşşak, Safranbolu çarşısının sakin ezgisi, 8/8 (Karabük)
  karabuk: { root: 52, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Hüzzam'a yakın, Ege zeybeği 9/8 (Aydın)
  aydin: { root: 52, steps: [0, 1, 3, 4, 7, 8, 10, 12] },
  // Hüseyni, dağ havası 9/8 (Ağrı)
  agri: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Uşşak, ağır zeybek 9/8 (Balıkesir)
  balikesir: { root: 55, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Hüseyni, Bingöl dağ havası 10/8
  bingol: { root: 52, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Kürdi, Adıyaman halayı (Adıyaman)
  adiyaman: { root: 55, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Uşşak, Kastamonu türküsü (Kastamonu)
  kastamonu: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  // Hüzzam, Afyon zeybeği 9/8
  afyon: { root: 53, steps: [0, 1, 4, 5, 7, 8, 11, 12] },
  // Kürdi, Harput havası 7/8 (Elazığ)
  elazig: { root: 50, steps: [0, 1, 3, 5, 7, 8, 10, 12] },
  // Hüseyni (Sol), Kütahya türküsü ağırlığı, çini atölyesinin sakin ezgisi
  kutahya: { root: 55, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  // Hüseyni, Karadeniz kıyısının kemençeli horonu 7/8 (Samsun)
  samsun: { root: 58, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
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
// A4: aynı motif başka nefesle (vuruştan sonra girer, senkoplu), üçüncü cümle doruğa (La5) çıkar, Hicaz inişiyle karar
const TITLE_A4: Bar[] = [
  [[R, 1], [69, 1], [74, 3], [72, 1], [69, 2]],
  [[70, 1], [69, 1], [65, 2], [67, 1], [69, 3]],
  [[72, 2], [76, 1], [74, 1], [72, 3], [70, 1]],
  [[69, 5], [R, 1], [69, 1], [72, 1]],
  [[77, 2], [81, 2], [79, 1], [77, 1], [76, 1], [77, 1]],
  [[74, 3], [70, 1], [67, 2], [69, 1], [70, 1]],
  [[73, 2], [76, 2], [74, 1], [73, 1], [70, 1], [69, 1]],
  [[65, 1], [64, 1], [62, 6]],
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
// B′: aynı yükseliş, sonu La'da asılı kalmaz: Hicaz rengiyle (Fa, Do#) Re'ye iner, nefese karar vererek girer
const TITLE_B2: Bar[] = [...TITLE_B.slice(0, 6), [[76, 2], [77, 1], [76, 1], [73, 2], [69, 1], [73, 1]], [[74, 6], [R, 2]]]
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
const CHORD: Record<string, { root: number; tones: number[]; sus?: number[] }> = {
  // Rem9: Fa La Do Mi; kararda Fa yerine Sol gelir (dörtlü geciktirme), ölçü ortasında Fa'ya çözülür
  Dm: { root: 50, tones: [53, 57, 60, 64], sus: [55, 57, 60, 64] },
  Bb: { root: 46, tones: [50, 53, 57, 60] }, // Si♭maj9
  C: { root: 48, tones: [52, 55, 58, 62] }, // Do9
  F: { root: 41, tones: [57, 60, 64, 67] }, // Famaj9
  Gm: { root: 43, tones: [50, 53, 57, 58] }, // Solm9
  A: { root: 45, tones: [49, 52, 55, 58] }, // La7♭9: Hicaz rengi
}
const CHORDS_A = ['Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Dm']
const CHORDS_A4 = ['Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'A', 'Dm']
const CHORDS_B = ['F', 'C', 'Dm', 'Bb', 'Gm', 'C', 'A', 'A']
const CHORDS_B2 = ['F', 'C', 'Dm', 'Bb', 'Gm', 'C', 'A', 'Dm']
const CHORDS_C = ['Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A', 'A']
const INTRO = ['Dm', 'Bb', 'Gm', 'A']
// nefes: ezgisiz dört ölçü (kırık akor, dem); ilki C'ye, ikincisi başa döner
const BREATH_1 = ['Dm', 'Gm', 'Bb', 'A']
const BREATH_2 = ['Bb', 'Gm', 'F', 'A']
/** Re minörün perdeleri (ney üstten çarparken komşu perdeyi buradan seçer) */
const D_MINOR = new Set([2, 4, 5, 7, 9, 10, 0])

/** bas yürüyüşü: bir sonraki köke yarım ya da tam sesle yaklaşan, şimdiki akorun içinde kalan geçiş notası */
function approach(next: number, chordPcs: Set<number>) {
  for (const n of [next - 1, next + 2, next - 2, next + 1]) if (chordPcs.has(pc(n))) return n
  return next
}

type Kind = 'A' | 'A2' | 'B' | 'A3' | 'nefes' | 'C' | 'A4' | 'B2' | 'nefes2'
interface Section {
  k: Kind
  mel: Bar[]
  ch: string[]
  /** bölümün genel gücü: seyrek bölümler kısık */
  dyn: number
}

/** ezginin notaları bölüm başından adımla; `fresh`: ölçünün ilk notası ya da sustan sonra (ney alttan kayarak girer) */
interface Note {
  at: number
  dur: number
  n: number
  bar: number
  fresh: boolean
}
const flat = (mel: Bar[], BAR: number): Note[] =>
  mel.flatMap((m, bar) => {
    const out: Note[] = []
    let s = bar * BAR
    let prev: number | null = null
    for (const [n, dur] of m) {
      if (n !== null) out.push({ at: s, dur, n, bar, fresh: prev === null })
      prev = n
      s += dur
    }
    return out
  })

function titleSong(): Song {
  // ~76 BPM sekizlik ızgara, tek sekizlikler hafif geç (swing). Giriş bir kez çalar, döngü A'dan döner.
  const ev: NoteEvent[] = []
  const roots: number[] = []
  const rand = rng('jenerik')
  const BAR = 8
  const human = () => 0.9 + rand() * 0.2
  let prevV: number[] | null = null
  let bar = 0
  /** ölçünün eşliği: piyano akoru (en yakın çevrim), dem, bas (kök, beşli, bir sonraki köke geçiş notası) */
  const comp = (name: string, at0: number, style: 'arp' | 'soft' | 'full', next: string | null, vol: number, sus = false) => {
    const ch = CHORD[name]
    const v = voiceLead(prevV, ch.tones, 50, 74)
    const vs = sus && ch.sus ? voiceLead(v, ch.sus, 50, 74) : v
    prevV = v
    roots.push(lift(ch.root))
    if (style === 'arp') {
      // kırık akor: aşağıdan yukarı, tepede dönüp iner
      ;[0, 1, 2, 3, 2, 1, 2, 3].forEach((k, i) => ev.push({ at: at0 + i, dur: 3, inst: 'keys', midi: [v[k]], vol: (i ? 0.05 : 0.065) * vol * human() }))
    } else if (vs !== v) {
      // karar: dörtlü geciktirme ölçü ortasında üçlüye çözülür
      ev.push({ at: at0, dur: 4, inst: 'keys', midi: vs, vol: (style === 'soft' ? 0.08 : 0.095) * vol * human() })
      ev.push({ at: at0 + 4, dur: 4, inst: 'keys', midi: v, vol: (style === 'soft' ? 0.06 : 0.07) * vol * human() })
    } else if (style === 'soft') {
      ev.push({ at: at0, dur: 6, inst: 'keys', midi: v, vol: 0.08 * vol * human() })
      ev.push({ at: at0 + 6, dur: 2, inst: 'keys', midi: v.slice(2), vol: 0.045 * vol * human() })
    } else {
      ev.push({ at: at0, dur: 4, inst: 'keys', midi: v, vol: 0.095 * vol * human() })
      ev.push({ at: at0 + 3, dur: 2, inst: 'keys', midi: v.slice(1), vol: 0.05 * vol * human() })
      ev.push({ at: at0 + 5, dur: 3, inst: 'keys', midi: v.slice(1), vol: 0.06 * vol * human() })
    }
    ev.push({ at: at0, dur: BAR, inst: 'pad', midi: [v[0], v[2], v[3] ?? v[1]], vol: 0.034 * vol })
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
  /** ney: ölçü başında ve uzun notada alttan kayarak girer; `grace` ile bazı uzun notalara üstten çarpar (tohumdan, hep aynı) */
  const ney = (ns: Note[], at0: number, vol: number, arc: (b: number) => number, grace = false, pass?: 0 | 1) => {
    for (const x of ns) {
      let from = x.fresh || x.dur >= 3 ? x.n - ([5, 10, 1].includes(pc(x.n)) ? 1 : 2) : undefined
      if (grace && !x.fresh && x.dur >= 3 && rand() < 0.6) from = [1, 2].map((k) => x.n + k).find((u) => D_MINOR.has(pc(u)))
      ev.push({ at: at0 + x.at, dur: x.dur, inst: 'ney', midi: [x.n], vol: vol * arc(x.bar) * human(), from, pass })
    }
  }
  /** kanun uzun notalara bir oktav yukarıdan, iki sekizlik sonra cevap verir; cümle sonunda tremolo */
  const answer = (ns: Note[], at0: number, bars: number) => {
    for (const x of ns) {
      if (x.dur < 3 || (x.at % BAR) + 2 >= BAR) continue
      const last = x.bar === bars - 1 || x.bar === 3
      ev.push({ at: at0 + x.at + 2, dur: last ? x.dur - 2 : 1, inst: 'kanun', midi: [x.n + 12], vol: last ? 0.022 : 0.035, trem: last })
    }
  }
  /** kanun alttan akorun tonlarını sekizliklerle açar */
  const arp = (name: string, at0: number) => {
    const v = voiceLead(null, CHORD[name].tones, 62, 86)
    ;[0, 1, 2, 3].forEach((k, j) => ev.push({ at: at0 + j, dur: 1, inst: 'kanun', midi: [v[k]], vol: 0.018 + j * 0.003 }))
  }
  /** cümlenin son notasına kanun tremolosu (karar çınlar) */
  const ring = (ns: Note[], at0: number, vol = 0.022) => {
    const f = ns[ns.length - 1]
    ev.push({ at: at0 + f.at + 2, dur: Math.max(2, f.dur - 2), inst: 'kanun', midi: [f.n + 12], vol, trem: true })
  }

  /** müzik kutusu çanı: akorun tonlarından, tohumla seçilmiş (her döngüde aynı), yüksek ve uzun çınlayan */
  const bells = (name: string, at0: number, breath: boolean, i: number, vol: number) => {
    const v = voiceLead(null, CHORD[name].tones, 74, 93)
    if (breath) {
      ev.push({ at: at0 + 1, dur: 6, inst: 'bell', midi: [v[v.length - 1]], vol: 0.04 * vol })
      ev.push({ at: at0 + 5, dur: 3, inst: 'bell', midi: [v[1 + (i % 2)]], vol: 0.03 * vol })
    } else if (i % 2 === 1 || rand() < 0.4) ev.push({ at: at0 + 4 + (i % 2) * 2, dur: 4 - (i % 2) * 2, inst: 'bell', midi: [v[(i * 3) % v.length]], vol: 0.03 * vol * human() })
  }

  // giriş: kırık akorlar, dem kabarır; kanun temanın başını uzaktan anar
  INTRO.forEach((name, i) => comp(name, i * BAR, 'arp', INTRO[i + 1] ?? 'Dm', 0.8 + i * 0.07))
  ;[[81, 2], [86, 2], [84, 1], [81, 1], [79, 2]].reduce((s, [n, d]) => {
    ev.push({ at: 2 * BAR + s, dur: d, inst: 'kanun', midi: [n], vol: 0.03 })
    return s + d
  }, 0)
  ev.push({ at: 3 * BAR + 1, dur: 6, inst: 'kanun', midi: [81], vol: 0.022, trem: true })
  bar = INTRO.length
  const loop = bar * BAR

  const plan: Section[] = [
    { k: 'A', mel: TITLE_A, ch: CHORDS_A, dyn: 0.9 },
    { k: 'A2', mel: TITLE_A, ch: CHORDS_A, dyn: 1 },
    { k: 'B', mel: TITLE_B, ch: CHORDS_B, dyn: 0.97 },
    { k: 'A3', mel: TITLE_A, ch: CHORDS_A, dyn: 1 },
    { k: 'nefes', mel: [], ch: BREATH_1, dyn: 0.75 },
    { k: 'C', mel: TITLE_C, ch: CHORDS_C, dyn: 0.85 },
    { k: 'A4', mel: TITLE_A4, ch: CHORDS_A4, dyn: 1.02 },
    { k: 'B2', mel: TITLE_B2, ch: CHORDS_B2, dyn: 0.97 },
    { k: 'nefes2', mel: [], ch: BREATH_2, dyn: 0.7 },
  ]
  plan.forEach((sec, si) => {
    const nextSec = plan[(si + 1) % plan.length]
    const bars = sec.ch.length
    const breath = sec.mel.length === 0
    const at = bar * BAR
    const arcOf = (b: number) => (bars === 8 ? ARC[b] : 1) * sec.dyn
    for (let i = 0; i < bars; i++) {
      const at0 = at + i * BAR
      const next = sec.ch[i + 1] ?? nextSec.ch[0]
      const lastBar = i === bars - 1
      const style = breath ? 'arp' : sec.k === 'A' || sec.k === 'C' ? 'soft' : 'full'
      comp(sec.ch[i], at0, style, next, breath ? 0.8 * sec.dyn : arcOf(i), lastBar && sec.ch[i] === 'Dm')
      // müzik kutusu: akorun tepesinden iki oktav yukarıda seyrek çan; ezgili bölümde ölçünün ikinci yarısında tek nota,
      // nefeste iki nota (ezgi yokken çan söyler)
      bells(sec.ch[i], at0, breath, i, arcOf(i))
      if (sec.k === 'B' && i % 2 === 0) arp(sec.ch[i], at0)
      if (sec.k === 'B2' && i % 2 === 1 && !lastBar) arp(sec.ch[i], at0)
      // nefes: kanun son ölçüde başın ilk notasını uzaktan anar
      if (breath && lastBar) ev.push({ at: at0 + 1, dur: 6, inst: 'kanun', midi: [sec.k === 'nefes' ? 81 : 74], vol: 0.02, trem: true })
    }
    const ns = flat(sec.mel, BAR)
    switch (sec.k) {
      case 'A':
        // ilk turda piyano söyler; döngünün ikinci turunda ezgiyi kanun alır (uzun notada tremolo), piyano uzun notaları
        // yumuşakça ikiler
        for (const x of ns) {
          const a = arcOf(x.bar)
          ev.push({ at: at + x.at, dur: x.dur, inst: 'keys', midi: [x.n + 12], vol: 0.075 * a * human(), pass: 0 })
          ev.push({ at: at + x.at, dur: x.dur, inst: 'kanun', midi: [x.n + 12], vol: (x.dur >= 4 ? 0.04 : 0.058) * a * human(), trem: x.dur >= 4, pass: 1 })
          if (x.dur >= 3) ev.push({ at: at + x.at, dur: x.dur, inst: 'keys', midi: [x.n], vol: 0.034 * a * human(), pass: 1 })
        }
        break
      case 'A2':
        // ney girer, uzun notalara üstten çarpar; kanun cevap verir
        ney(ns, at, 0.085, arcOf, true)
        answer(ns, at, bars)
        break
      case 'B':
        ney(ns, at, 0.085, arcOf)
        break
      case 'A3':
        // soru-cevap: ney sorar (1. ve 3. cümle), kanun bir oktav yukarıdan cevaplar (2. cümle), karar yine neyde
        ney(
          ns.filter((x) => x.bar < 2 || x.bar >= 4),
          at,
          0.088,
          arcOf,
        )
        for (const x of ns.filter((y) => y.bar === 2 || y.bar === 3)) ev.push({ at: at + x.at, dur: x.dur, inst: 'kanun', midi: [x.n + 12], vol: (x.dur >= 4 ? 0.038 : 0.055) * human(), trem: x.dur >= 4 })
        ring(ns, at)
        break
      case 'C':
        // köprü: ilk turda piyano söyler, ikinci yarıda ney alttan katılır; ikinci turda ney baştan söyler, piyano ikiler.
        // Kanun uzun notalara cevap verir, tek ölçülerde arpejle sarar
        for (const x of ns) {
          const a = arcOf(x.bar)
          ev.push({ at: at + x.at, dur: x.dur, inst: 'keys', midi: [x.n + 12], vol: 0.072 * a * human(), pass: 0 })
          if (x.dur >= 3) ev.push({ at: at + x.at, dur: x.dur, inst: 'keys', midi: [x.n + 12], vol: 0.04 * a * human(), pass: 1 })
        }
        ney(
          ns.filter((x) => x.bar >= 4),
          at,
          0.062,
          arcOf,
          false,
          0,
        )
        ney(ns, at, 0.08, arcOf, true, 1)
        answer(ns, at, bars)
        for (let i = 0; i < bars; i += 2) arp(sec.ch[i], at + i * BAR)
        break
      case 'A4':
        // dördüncü anlatım: ney başka ritimle söyler, piyano uzun notaları oktav yukarıdan ikiler, kanun üçlü aşağıdan
        // bir sekizlik gecikmeli karşı ezgi çalar
        ney(ns, at, 0.088, arcOf, true)
        for (const x of ns.filter((y) => y.dur >= 3)) {
          ev.push({ at: at + x.at, dur: x.dur, inst: 'keys', midi: [x.n + 12], vol: 0.038 * arcOf(x.bar) * human() })
          if ((x.at % BAR) + 1 < BAR) {
            const third = [3, 4].map((k) => x.n - k).find((u) => D_MINOR.has(pc(u))) ?? x.n - 3
            ev.push({ at: at + x.at + 1, dur: 1, inst: 'kanun', midi: [third + 12], vol: 0.026 * human() })
          }
        }
        ring(ns, at)
        break
      case 'B2':
        // B′: ney uzun perdeleri tutar, kanun uzun notanın ortasında oktav yukarıdan tek çekişle ikiler; karar çınlar
        ney(ns, at, 0.08, arcOf, true)
        for (const x of ns.filter((y) => y.dur >= 3 && (y.at % BAR) + 2 < BAR)) ev.push({ at: at + x.at + 2, dur: 1, inst: 'kanun', midi: [x.n + 12], vol: 0.03 * human() })
        ring(ns, at, 0.024)
        break
      case 'nefes2':
        // motifin başı iki kat yavaş anılır (dinlenirken ezgi akılda kalsın): ilk turda piyano, ikinci turda kanun
        flat([TITLE_A[0]], BAR)
          .slice(0, 4)
          .reduce((s, x) => {
            const e = { at: at + BAR + s, dur: x.dur * 2 }
            ev.push({ ...e, inst: 'keys', midi: [x.n + 12], vol: 0.042 * human(), pass: 0 })
            ev.push({ ...e, inst: 'kanun', midi: [x.n + 12], vol: (e.dur >= 4 ? 0.03 : 0.04) * human(), trem: e.dur >= 4, pass: 1 })
            return s + e.dur
          }, 0)
        break
    }
    bar += bars
  })
  const step = 60 / 64 / 2
  return song('title', step, bar * BAR, ev, BAR, roots, 0.06, loop, step * 1.5)
}

function song(id: string, step: number, length: number, events: NoteEvent[], bar: number, roots: number[], swing: number, loop: number, echo: number): Song {
  const byStep: NoteEvent[][] = Array.from({ length }, () => [])
  for (const e of events) byStep[e.at].push(e)
  return { id, step, length, events, byStep, bar, roots, swing, loop, echo }
}

let titleCache: Song | null = null

/** oyunun tek bestesi: menüde, şehirde, boss'ta ve Müzik Kutusu'nda aynı jenerik */
export function titleTheme(): Song {
  return (titleCache ??= titleSong())
}
