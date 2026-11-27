/**
 * Elle çizilmiş görünümlü zemin ve duvarlar: ekran çözünürlüğünde, vektör çizgilerle.
 *
 * Katı karolar tek kütle gibi boyanır: şehrin malzemesine göre taş örgüsü (tuğla, kesme taş,
 * kiklop, tüf katmanı, toprak, kar altı kaya), titrek mürekkep dış hat, üstte şehrin örtüsü
 * (taş silme, çimen, kar), derine indikçe koyulaşan gölge ve çıkıntı altlarına tarama.
 * Tahta iskeleler, dikenler ve buz da aynı dille çizilir.
 *
 * Dünya parça parça (CHUNK karo genişliğinde) önbelleğe çizilir; yalnız görünen parçalar bellekte
 * durur. Her karonun rastgeleliği konumundan türetilir: parça sınırlarında doku kesilmez.
 */
import { CITY } from './art'
import { cb, cbSpike } from './colorBlind'
import { BLOCK_A, BLOCK_B, CRUMBLE, EMPTY, FAKE, FROST, ICE, ONEWAY, SOLID, SPIKE_DOWN, SPIKE_UP, SWIM, TURRET, WATER, WET, type World } from './sim'
import { T, type CityKey } from './types'

type Ctx = CanvasRenderingContext2D
const INK = '#241824'
const CHUNK = 8
/** parça bu kadar satırlık hücrelere bölünür; her hücre kendi küçük tuvali (açması ucuz, çizimi ~1-3 ms) */
const BAND = 2
/** her karede ileriki hücreleri hazırlamaya ayrılan süre (ms): 240 Hz'de bile kare bütçesinin altında */
const WARM_MS = 1.5
/** görünenin iki yanında hazır tutulan parça, altında ve üstünde hazır tutulan hücre sırası */
const AHEAD = 2
const VAHEAD = 2
/** haritanın altına sürdürülen satır: dikey ekranda kamera haritanın altını da gösterir, zemin orada düz bir banda dönmesin */
const BELOW = 16

type Material = 'brick' | 'ashlar' | 'cyclop' | 'strata' | 'earth' | 'rock' | 'coal' | 'quadratum'
/** merlon: taş silmenin altında mazgallı burç dişleri; cini: taş silmenin altında çini şerit (yürünen yüz düz kalır, salt görünüş) */
type Cap = 'stone' | 'grass' | 'snow' | 'merlon' | 'cini'
/** zeminin renkleri (şehir paletinin zemin alanları; bölgesel görünüş kendi paletini taşır) */
type Pal = { tile: string; tileLight: string; tileDark: string; tileTop: string }
type Look = { mat: Material; cap: Cap }

const LOOK: Record<CityKey, Look> = {
  istanbul: { mat: 'brick', cap: 'stone' },
  kocaeli: { mat: 'brick', cap: 'grass' },
  canakkale: { mat: 'ashlar', cap: 'stone' },
  edirne: { mat: 'ashlar', cap: 'grass' },
  bursa: { mat: 'cyclop', cap: 'grass' },
  antalya: { mat: 'strata', cap: 'stone' },
  sanliurfa: { mat: 'ashlar', cap: 'stone' },
  van: { mat: 'rock', cap: 'stone' },
  erzurum: { mat: 'rock', cap: 'snow' },
  kayseri: { mat: 'cyclop', cap: 'stone' },
  hatay: { mat: 'ashlar', cap: 'stone' },
  eskisehir: { mat: 'brick', cap: 'grass' },
  sinop: { mat: 'cyclop', cap: 'grass' },
  diyarbakir: { mat: 'ashlar', cap: 'stone' },
  izmir: { mat: 'ashlar', cap: 'stone' },
  ankara: { mat: 'ashlar', cap: 'stone' },
  konya: { mat: 'ashlar', cap: 'stone' },
  nevsehir: { mat: 'strata', cap: 'stone' },
  adana: { mat: 'ashlar', cap: 'stone' },
  gaziantep: { mat: 'ashlar', cap: 'stone' },
  mardin: { mat: 'ashlar', cap: 'stone' },
  malatya: { mat: 'earth', cap: 'grass' },
  corum: { mat: 'cyclop', cap: 'stone' },
  ordu: { mat: 'earth', cap: 'grass' },
  trabzon: { mat: 'cyclop', cap: 'grass' },
  sivas: { mat: 'rock', cap: 'snow' },
  ardahan: { mat: 'rock', cap: 'snow' },
  amasya: { mat: 'rock', cap: 'stone' },
  mugla: { mat: 'ashlar', cap: 'stone' },
  rize: { mat: 'rock', cap: 'grass' },
  artvin: { mat: 'rock', cap: 'grass' },
  kars: { mat: 'ashlar', cap: 'snow' },
  bitlis: { mat: 'ashlar', cap: 'stone' },
  agri: { mat: 'rock', cap: 'snow' },
  giresun: { mat: 'cyclop', cap: 'grass' },
  tokat: { mat: 'brick', cap: 'stone' },
  // Pamukkale: katman katman traverten, üstü bembeyaz kabuk
  denizli: { mat: 'strata', cap: 'snow' },
  // Kara Elmas: koyu şeyl tabakaları arasında parıltılı kömür damarları, üstü Karadeniz yamacının çimeni
  zonguldak: { mat: 'coal', cap: 'grass' },
  // Akdeniz kıyısı: güneşte sararmış kumtaşı katmanları, üstü taş silme
  mersin: { mat: 'strata', cap: 'stone' },
  // Demir çelik şehri: koyu tuğla örgü, üstü Küre ormanının çimeni
  karabuk: { mat: 'brick', cap: 'grass' },
  // Efes: iri kesme mermer bloklar, üstü taş silme
  aydin: { mat: 'ashlar', cap: 'stone' },
  balikesir: { mat: 'rock', cap: 'grass' },
  elazig: { mat: 'ashlar', cap: 'snow' },
  afyon: { mat: 'rock', cap: 'stone' },
  bingol: { mat: 'rock', cap: 'grass' },
  // Nemrut ve Perre: güneşte ısınmış katman katman kireçtaşı, üstü Fırat vadisinin kuru çimeni
  adiyaman: { mat: 'strata', cap: 'grass' },
  // Kastamonu Kalesi: iri, düzensiz kale taşı örgüsü, üstü Ilgaz ormanının çimeni
  kastamonu: { mat: 'cyclop', cap: 'grass' },
  bayburt: { mat: 'rock', cap: 'snow' },
  // Kütahya: bal beji kesme taş, taş silmenin altında firuze-kobalt çini şerit (lale benekli)
  kutahya: { mat: 'ashlar', cap: 'cini' },
  // Samsun limanı: ıslak, serin gri kesme liman taşı, üstü taş silme
  samsun: { mat: 'ashlar', cap: 'stone' },
}

/**
 * Bölgesel ikinci görünüş: meydan kapısının (@) ardı (meydan yolu + boss arenası; yalnız arenadan oluşan bölümde
 * bütün harita) şehrin başka bir yapısıdır. Fizik değişmez, yalnız malzeme, örtü ve renk.
 */
const LOOK2: Partial<Record<CityKey, Look & { pal: Pal }>> = {
  // Mamure Kalesi (Anamur): iri, düzgün kesilmiş bal sarısı-gri kesme taş, sıra sıra; üstü mazgallı burç
  mersin: { mat: 'quadratum', cap: 'merlon', pal: { tile: '#bba57e', tileLight: '#e0cfa4', tileDark: '#5e5646', tileTop: '#d9c79c' } },
}

/** konumdan türeyen 0..1 sayı: aynı yer hep aynı değeri verir */
function hash(a: number, b: number, k = 0): number {
  let h = (a * 374761393 + b * 668265263 + k * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function hex(c: string): [number, number, number] {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
}
/**
 * a'dan b'ye t kadar; istenirse sonuç c'ye doğru u kadar daha çekilir (hafif sıcak ya da soğuk ton).
 * Sonuç yine #rrggbb'dir: iç içe karıştırılabilir.
 */
function mix(a: string, b: string, t: number, c?: string, u = 0): string {
  const x = hex(a)
  const y = hex(b)
  const z = c ? hex(c) : null
  let out = '#'
  for (let k = 0; k < 3; k++) {
    const v = x[k] + (y[k] - x[k]) * t
    out += Math.round(z ? v + (z[k] - v) * u : v).toString(16).padStart(2, '0')
  }
  return out
}

/** kafes noktalarındaki özetler arasında doğrusal geçiş (0..1): x boyunca yumuşak, konuma bağlı dalga */
function lnoise(x: number, row: number, seed: number): number {
  const i = Math.floor(x)
  const a = hash(i, row, seed)
  return a + (hash(i + 1, row, seed) - a) * (x - i)
}

type Pen = Ctx | Path2D
/** titrek çizginin düğüm aralığı (dünya pikseli) */
const KNOT = 7

/** lnoise'ın yumuşak (smoothstep) hâli: örtülerin alt kenarı gibi yuvarlak dalgalar için */
function snoise(x: number, row: number, seed: number): number {
  const i = Math.floor(x)
  const f = x - i
  const a = hash(i, row, seed)
  return a + (hash(i + 1, row, seed) - a) * f * f * (3 - 2 * f)
}

/**
 * Titrek çizgi (yatay ya da dikey): sapma çizginin uçlarından değil dünyadaki yerinden türer; düğümler mutlak
 * kafes noktalarındadır ve eğri düğüm ortalarından geçer. Aynı kenar hangi hücreden çizilirse çizilsin aynı eğridir;
 * kesilerek çizilen ucun yalnız ilk bir buçuk düğümü (hücrenin kırpma payının dışında) farklı olabilir.
 * cont: kalemi kaldırmadan sürer (lineTo ile başlar).
 */
function wline(p: Pen, x0: number, y0: number, x1: number, y1: number, amp: number, seed: number, cont = false) {
  const horiz = y0 === y1
  const key = Math.round((horiz ? y0 : x0) * 4)
  const from = horiz ? x0 : y0
  const to = horiz ? x1 : y1
  const dir = to >= from ? 1 : -1
  const at = (v: number, o: number): [number, number] => (horiz ? [v, y0 + o] : [x0 + o, v])
  const node = (k: number) => at(k * KNOT, (lnoise(k, key, seed) - 0.5) * 2 * amp)
  const a = at(from, 0)
  if (cont) p.lineTo(a[0], a[1])
  else p.moveTo(a[0], a[1])
  const end = at(to, 0)
  let k = dir > 0 ? Math.floor(from / KNOT) + 1 : Math.ceil(from / KNOT) - 1
  const inside = (n: number) => (dir > 0 ? n * KNOT < to : n * KNOT > to)
  if (!inside(k)) {
    p.lineTo(end[0], end[1])
    return
  }
  for (; inside(k + dir); k += dir) {
    const n = node(k)
    const m = node(k + dir)
    p.quadraticCurveTo(n[0], n[1], (n[0] + m[0]) / 2, (n[1] + m[1]) / 2)
  }
  const n = node(k)
  p.quadraticCurveTo(n[0], n[1], end[0], end[1])
}

/** köşeleri yuvarlanmış dörtgen (a sol üst, b sağ üst, e sağ alt, d sol alt); her köşenin yarıçapı ayrı */
function quad(p: Path2D, ax: number, ay: number, bx: number, by: number, ex: number, ey: number, dx: number, dy: number, ra: number, rb: number, re: number, rd: number) {
  p.moveTo((ax + bx) / 2, (ay + by) / 2)
  p.arcTo(bx, by, ex, ey, rb)
  p.arcTo(ex, ey, dx, dy, re)
  p.arcTo(dx, dy, ax, ay, rd)
  p.arcTo(ax, ay, bx, by, ra)
  p.closePath()
}

/** taş tonları: açık, koyu, bir sıcak, bir soğuk */
function toneSet(p: Pal): string[] {
  return [
    p.tile,
    mix(p.tile, p.tileLight, 0.35),
    mix(p.tile, p.tileLight, 0.7),
    mix(p.tile, p.tileDark, 0.3),
    mix(p.tile, p.tileDark, 0.55),
    mix(p.tile, p.tileLight, 0.2, '#c08a5c', 0.12),
    mix(p.tile, p.tileDark, 0.15, '#5c7ea0', 0.13),
  ]
}

/** dışbükey köşelerin yenmişliği (dünya pikseli): kütle, örtü ve dış hat aynı yarıçapı kullanır */
const NIB = 2
/** derinlik gölgesinin küçük tuvali: karo başına bir piksel, büyütülerek basılır (yumuşak geçiş) */
let SCRATCH: HTMLCanvasElement | null = null

/** örgü ölçüleri: taş boyu, derz payı, sıra dalgası (boyu wl, yüksekliği jy), yan derzin yatması (lean), köşe yarıçapı, bölünme ve kırık köşe sıklığı */
const MASON = {
  brick: { bw: 16, bh: 8, wj: 0.14, wl: 13, jy: 0.3, lean: 0.3, r: 0.8, gap: 0.6, half: true, split: 0.1, chip: 0.1, tone: [0.2, 0.38, 0.5, 0.68, 0.8, 0.92] },
  ashlar: { bw: 30, bh: 16, wj: 0.42, wl: 13, jy: 0.4, lean: 0.45, r: 1.2, gap: 0.7, half: false, split: 0.2, chip: 0.14, tone: [0.38, 0.6, 0.68, 0.84, 0.9, 0.95] },
  cyclop: { bw: 21, bh: 15, wj: 0.5, wl: 13, jy: 2.4, lean: 3, r: 2.8, gap: 0.85, half: false, split: 0.14, chip: 0.2, tone: [0.24, 0.44, 0.54, 0.72, 0.82, 0.91] },
  // kale taşı (opus quadratum): sıra yüksekliği tam bir karo, yarım taş kaydırmalı, düz derz
  quadratum: { bw: 30, bh: 16, wj: 0.08, wl: 40, jy: 0.12, lean: 0.12, r: 1, gap: 0.75, half: true, split: 0.07, chip: 0.08, tone: [0.3, 0.52, 0.64, 0.82, 0.9, 0.95] },
  rock: { bw: 34, bh: 23, wj: 0.5, wl: 40, jy: 1.5, lean: 5, r: 1.5, gap: 0.45, half: false, split: 0.22, chip: 0.25, tone: [0.34, 0.54, 0.62, 0.82, 0.9, 0.95] },
}

/** önbelleğe giren karo: donan su (Z) saate bağlıdır, önbelleğe girmez (buzu ve suyu render her karede çizer) */
const tileOf = (w: World, tx: number, ty: number) => (w.raw(tx, ty) === FROST ? EMPTY : w.tile(tx, ty))

export class TerrainHD {
  /** hücre önbelleği (anahtar: parça * 64 + bant; null: boş gök, çizilecek bir şey yok). Map sırası en son kullanılanı sona alır. */
  private cells = new Map<number, HTMLCanvasElement | null>()
  private keep = 120
  /** görünür olduğu karede hazır olmayan bant sayısı (doğrulama için: koşu ve dash sırasında artmamalı) */
  syncBands = 0
  private readonly solid: (tx: number, ty: number) => boolean
  /** çizilen satır sayısı: harita + altına sürdürülen pay */
  private readonly rows: number
  /** gizli köşenin mağarası: sahte duvarın (artık görünür tünel ağzı) ardında kalan küçük cep; gök yerine kaya içi çizilir */
  private readonly cave = new Set<number>()
  /** her karonun en yakın açıklığa uzaklığı (5 = bir karo; açıklıkta 0): derinlik gölgesi bundan türer */
  private readonly depth: Uint8Array
  /** derinlik gölgesinin rengi (şehrin koyu taşına çalan mürekkep) ve taş tonları (açık, koyu, bir sıcak, bir soğuk) */
  private readonly deep: [number, number, number]
  private readonly tones: string[]
  /** bölgesel görünüş (LOOK2) ve kapladığı sütunlar [za, zb); yoksa null */
  private readonly zone: { look: Look; pal: Pal; tones: string[]; za: number; zb: number } | null = null
  /** gelgit ve su kıyısındaki taş (yalnız bölgede): su hizasında yosunlu koyu sıra; değer suyun yönü (1 sol, 2 sağ, 4 üst) */
  private readonly moss = new Map<number, number>()

  constructor(
    private readonly w: World,
    private readonly city: CityKey,
    /** bir dünya pikseli kaç ekran pikseli */
    private readonly scale: number,
    /** Görünmez Dikenler (zor mod): dikenler önbelleğe çizilmez */
    private readonly hideSpikes = false,
  ) {
    this.rows = w.rows + BELOW
    const base = (tx: number, ty: number) => {
      const t = tileOf(w, tx, ty)
      return t === SOLID || t === TURRET || t === ICE || t === WET
    }
    // haritanın altında her sütun son satırı gibi sürer: katı sütun taş olarak iner, çukur ve su açık kalır
    this.solid = (tx, ty) => base(tx, Math.min(ty, w.rows - 1))
    const st = CITY[city]
    const dk = hex(st.tileDark)
    // derinlik serin ve koyu: şehrin koyu taşı lacivert-mor gölgeye çalar (boyalı sahnelerdeki gibi dip sakin, ışık üstte)
    this.deep = [Math.round(dk[0] * 0.3 + 16 * 0.7), Math.round(dk[1] * 0.3 + 14 * 0.7), Math.round(dk[2] * 0.3 + 30 * 0.7)]
    this.tones = toneSet(st)
    const z2 = LOOK2[city]
    if (z2) {
      const span = w.warp
        ? w.level.mirror
          ? [0, Math.floor(w.warp.x / T)]
          : [Math.floor(w.warp.x / T) + 1, w.cols]
        : w.boss
          ? [0, w.cols]
          : null
      if (span) {
        this.zone = { look: z2, pal: z2.pal, tones: toneSet(z2.pal), za: span[0], zb: span[1] }
        const wet = (x: number, y: number) => w.isTide(x, y) || w.raw(x, y) === WATER || w.raw(x, y) === SWIM
        for (let ty = 0; ty < w.rows; ty++)
          for (let tx = span[0]; tx < span[1]; tx++) {
            if (!base(tx, ty)) continue
            // su kapısının (renkli blok) altı da havuz tabanıdır
            const gate = w.raw(tx, ty - 1) === BLOCK_A || w.raw(tx, ty - 1) === BLOCK_B
            const m = (wet(tx - 1, ty) ? 1 : 0) | (wet(tx + 1, ty) ? 2 : 0) | (wet(tx, ty - 1) || (gate && (wet(tx - 1, ty - 1) || wet(tx + 1, ty - 1))) ? 4 : 0)
            if (m) this.moss.set(ty * w.cols + tx, m)
          }
      }
    }
    // uzaklık alanı: iki geçişli (5-7) yaklaşık Öklid; haritanın yanları ve tepesi açıklık sayılmaz
    const n = w.cols
    const depth = new Uint8Array(n * this.rows)
    for (let ty = 0; ty < this.rows; ty++) for (let tx = 0; tx < n; tx++) depth[ty * n + tx] = this.solid(tx, ty) ? 250 : 0
    const relax = (i: number, x: number, y: number, dx: number, dy: number, cost: number) => {
      const xx = x + dx
      const yy = y + dy
      if (xx < 0 || xx >= n || yy < 0 || yy >= this.rows) return
      const v = depth[yy * n + xx] + cost
      if (v < depth[i]) depth[i] = v
    }
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < n; x++) {
        const i = y * n + x
        if (!depth[i]) continue
        relax(i, x, y, -1, 0, 5)
        relax(i, x, y, 0, -1, 5)
        relax(i, x, y, -1, -1, 7)
        relax(i, x, y, 1, -1, 7)
      }
    for (let y = this.rows - 1; y >= 0; y--)
      for (let x = n - 1; x >= 0; x--) {
        const i = y * n + x
        if (!depth[i]) continue
        relax(i, x, y, 1, 0, 5)
        relax(i, x, y, 0, 1, 5)
        relax(i, x, y, 1, 1, 7)
        relax(i, x, y, -1, 1, 7)
      }
    this.depth = depth
    // Sahte duvar (%) bir tünel ya da mağara ağzıdır: içi karanlık, kenarı mürekkepli, oyuncu görür ve girer.
    // Ardındaki cep, başlangıçtan (ya da meydan kapısının varışından) sahte duvarı aşmadan varılamayan küçük boşluktur.
    const cols = w.cols
    const block = (t: number) => t === SOLID || t === TURRET || t === ICE || t === WET || t === FAKE
    const reach = new Set<number>()
    const flood = (sx: number, sy: number) => {
      const st = [[sx, sy]]
      while (st.length) {
        const [x, y] = st.pop()!
        if (x < 0 || x >= cols || y < 0 || y >= w.rows) continue
        const k = y * cols + x
        if (reach.has(k) || block(tileOf(w, x, y))) continue
        reach.add(k)
        st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
      }
    }
    flood(Math.floor((w.player.x + 6) / T), Math.floor((w.player.y + 6) / T))
    if (w.arrival) flood(Math.floor(w.arrival.x / T), Math.floor(w.arrival.y / T))
    for (let ty = 0; ty < w.rows; ty++)
      for (let tx = 0; tx < cols; tx++) {
        if (tileOf(w, tx, ty) !== FAKE) continue
        this.cave.add(ty * cols + tx)
        // ağzın ardındaki cep (büyük açık alanlar mağara sayılmaz)
        for (const [nx, ny] of [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]]) {
          const pocket: number[] = []
          const st = [[nx, ny]]
          const seen = new Set<number>()
          while (st.length && pocket.length <= 40) {
            const [x, y] = st.pop()!
            if (x < 0 || x >= cols || y < 0 || y >= w.rows) continue
            const k = y * cols + x
            if (seen.has(k) || reach.has(k) || block(tileOf(w, x, y))) continue
            seen.add(k)
            pocket.push(k)
            st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
          }
          if (pocket.length <= 40) for (const k of pocket) this.cave.add(k)
        }
      }
  }

  /**
   * Görünen hücreleri ana tuvale basar. camX/camY dünya pikseli (kesirli olabilir), devW/devH ekran pikseli.
   * Zemin çizimi pahalıdır (yüksek çözünürlükte bir parça 15-20 ms): kare içinde tek seferde yapılırsa 120 Hz'de iki
   * kare kaçar ve hızlı kaymada (dash) kasma olur. Bu yüzden dünya küçük hücrelere bölünür (CHUNK karo × BAND satır)
   * ve görünenin çevresindeki hücreler her karede küçük bir süre bütçesiyle (WARM_MS) önceden çizilir; görünür
   * olduklarında hazırdırlar. Yalnız ışınlanmada (bölüm başı, kapı, yeniden doğuş) eksik hücre bir kerelik tamamlanır.
   * Kanıt: scripts/verify-frames.cjs (koşu ve dash boyunca hazır olmayan hücre sayısı 0 olmalı).
   */
  draw(c: Ctx, camX: number, camY: number, devW: number, devH: number) {
    const sc = this.scale
    const span = CHUNK * T
    const first = Math.floor(camX / span)
    const last = Math.floor((camX + devW / sc) / span)
    const b0 = Math.max(0, Math.floor(camY / (BAND * T)))
    const b1 = Math.min(this.bandCount - 1, Math.floor((camY + devH / sc) / (BAND * T)))
    this.keep = (last - first + 3 + AHEAD * 2) * (b1 - b0 + 3 + VAHEAD * 2)
    for (let i = first; i <= last; i++) {
      if (!this.valid(i)) continue
      for (let bb = b0; bb <= b1; bb++) {
        const cv = this.cell(i, bb, true)
        if (cv) c.drawImage(cv, Math.round((i * span - MARGIN - camX) * sc), Math.round((this.top(bb) - camY) * sc))
      }
    }
    if (camY < 0) for (let i = first; i <= last; i++) if (this.valid(i)) this.drawAbove(c, i, camX, camY)
    // önce görünen parçaların altı ve üstü, sonra yakından uzağa iki yandaki parçalar: bütçe bitene dek
    const start = performance.now()
    const lo = Math.max(0, b0 - VAHEAD)
    const hi = Math.min(this.bandCount - 1, b1 + VAHEAD)
    const warm = (i: number, from: number, to: number) => {
      if (!this.valid(i)) return true
      for (let bb = from; bb <= to; bb++) {
        if (this.cells.has(i * 64 + bb)) continue
        if (performance.now() - start > WARM_MS) return false
        this.cell(i, bb, false)
      }
      return true
    }
    for (let i = first; i <= last; i++) if (!warm(i, lo, b0 - 1) || !warm(i, b1 + 1, hi)) return
    for (let d = 1; d <= AHEAD; d++) for (const i of [last + d, first - d]) if (!warm(i, lo, hi)) return
  }

  /**
   * Bölüm Düzenleyici: her düzenlemede zemin baştan çizilmesin diye eski önbellekten, değişen karolara uzak hücreler devralınır.
   * changed(tx0, tx1, ty0, ty1): bu karo aralığında değişen karo var mı. Derinlik gölgesi ve üst örtü birkaç karo öteye
   * uzandığı için hücrenin çevresinde PAD karoluk pay bırakılır; harita altına sürdürülen pay son satırla birlikte değişir.
   */
  adopt(old: TerrainHD, changed: (tx0: number, tx1: number, ty0: number, ty1: number) => boolean) {
    if (old.scale !== this.scale || old.city !== this.city || old.w.cols !== this.w.cols) return
    const PAD = 6
    const last = this.w.rows - 1
    for (const [key, cv] of old.cells) {
      const i = Math.floor(key / 64)
      const b = key % 64
      const ty0 = Math.min(last, b * BAND - PAD)
      const ty1 = Math.min(last, (b + 1) * BAND + PAD)
      if (!changed(i * CHUNK - PAD, i * CHUNK + CHUNK + PAD, ty0, ty1)) this.cells.set(key, cv)
    }
  }

  /** İlk çizim öncesi: görünen bölge ve çevresi hazırlanır (bölüm açılırken bir kez) */
  prime(camX: number, camY: number, devW: number, devH: number) {
    const span = CHUNK * T
    const b0 = Math.max(0, Math.floor(camY / (BAND * T)) - VAHEAD)
    const b1 = Math.min(this.bandCount - 1, Math.floor((camY + devH / this.scale) / (BAND * T)) + VAHEAD)
    for (let i = Math.floor(camX / span) - AHEAD; i <= Math.floor((camX + devW / this.scale) / span) + AHEAD; i++)
      if (this.valid(i)) for (let bb = b0; bb <= b1; bb++) this.cell(i, bb, false)
  }

  private get bandCount() {
    return Math.ceil(this.rows / BAND)
  }

  private valid(i: number) {
    return i >= 0 && i * CHUNK < this.w.cols
  }

  /**
   * Haritanın tepesinin üstü: tepeye dayanan duvar (ilk üç satırı katı sütun) ekranın üstüne dek sürer. Kesik bitseydi
   * "üstünden aşılır" gibi görünürdü; oysa sim onu göğe kadar katı sayar. Bant 0'da bu sütunların üst kenarı çizilmez,
   * dokusu kesintisizdir: 1-2. satırlarının görüntüsü yukarıya iki karoluk adımlarla yeniden basılır (yeni çizim yok).
   */
  private drawAbove(c: Ctx, i: number, camX: number, camY: number) {
    const w = this.w
    const pillar = (tx: number) => tx >= 0 && tx < w.cols && [0, 1, 2].every((ty) => tileOf(w, tx, ty) === SOLID)
    const x0 = i * CHUNK
    let tx = x0
    while (tx < x0 + CHUNK) {
      if (!pillar(tx)) {
        tx++
        continue
      }
      let end = tx
      while (end + 1 < x0 + CHUNK && pillar(end + 1)) end++
      const cv = this.cell(i, 0, true)
      if (cv) {
        const sc = this.scale
        // yanlarda dış hat payı (komşu sütun da sütunsa ek yeri olmasın diye pay yok)
        const padL = pillar(tx - 1) ? 0 : 3
        const padR = pillar(end + 1) ? 0 : 3
        const wx = tx * T - padL
        const ww = (end + 1 - tx) * T + padL + padR
        const sx = (wx - (i * CHUNK * T - MARGIN)) * sc
        const sy = (T - this.top(0)) * sc
        for (let y = -2 * T; y + 2 * T > camY; y -= 2 * T)
          c.drawImage(cv, sx, sy, ww * sc, 2 * T * sc, Math.round((wx - camX) * sc), Math.round((y - camY) * sc), Math.round(ww * sc), Math.round(2 * T * sc))
      }
      tx = end + 1
    }
  }

  /** hücrenin üst ve alt kenarı (dünya pikseli); ilk ve son hücre dış hat payını da taşır */
  private top(b: number) {
    return b === 0 ? -MARGIN : b * BAND * T
  }

  private bottom(b: number) {
    return b === this.bandCount - 1 ? this.rows * T + MARGIN : (b + 1) * BAND * T
  }

  /** hücreyi verir; yoksa çizer. sync: görünür olduğu karede çizilmek zorunda kaldı (sayılır) */
  private cell(i: number, b: number, sync: boolean): HTMLCanvasElement | null {
    const key = i * 64 + b
    if (this.cells.has(key)) {
      const hit = this.cells.get(key)!
      this.cells.delete(key)
      this.cells.set(key, hit)
      return hit
    }
    const cv = this.paintCell(i, b)
    if (sync && cv) this.syncBands++
    this.cells.set(key, cv)
    while (this.cells.size > this.keep) this.cells.delete(this.cells.keys().next().value!)
    return cv
  }

  /** hücrenin çevresinde (taşma payı dahil) çizilecek bir şey var mı: boş gök hücresi tuval açmaz */
  private blank(i: number, b: number) {
    const w = this.w
    const ty0 = Math.max(0, b * BAND - 2)
    const ty1 = Math.min(this.rows - 1, (b + 1) * BAND + 1)
    for (let tx = i * CHUNK - 1; tx <= i * CHUNK + CHUNK; tx++)
      for (let ty = ty0; ty <= ty1; ty++) {
        const y = Math.min(ty, w.rows - 1)
        if (tileOf(w, tx, y) !== EMPTY || this.cave.has(y * w.cols + tx)) return false
      }
    return true
  }

  private paintCell(i: number, b: number): HTMLCanvasElement | null {
    if (this.blank(i, b)) return null
    const top = this.top(b)
    const bot = this.bottom(b)
    const cv = document.createElement('canvas')
    cv.width = Math.ceil((CHUNK * T + MARGIN * 2) * this.scale)
    cv.height = Math.round((bot - top) * this.scale)
    const c = cv.getContext('2d')!
    c.scale(this.scale, this.scale)
    c.translate(MARGIN - i * CHUNK * T, -top)
    // hücre tam kendi şeridine kırpılır: komşu hücrelerle aynı çizim üst üste binmez, ek yeri görünmez
    c.beginPath()
    c.rect(i * CHUNK * T - MARGIN, top, CHUNK * T + MARGIN * 2, bot - top)
    c.clip()
    const ty0 = b * BAND
    this.paint(c, i * CHUNK - 1, i * CHUNK + CHUNK, ty0, Math.min(this.rows, ty0 + BAND) - 1)
    return cv
  }

  /** sütun bölgesel görünüşün (LOOK2) içinde mi */
  private inZone(tx: number): boolean {
    const z = this.zone
    return !!z && tx >= z.za && tx < z.zb
  }

  /** üstü su (gelgit havuzunun tabanı) olan bölge karosu */
  private seabed(tx: number, ty: number): boolean {
    return ((this.moss.get(ty * this.w.cols + tx) ?? 0) & 4) !== 0
  }

  private lookAt(inside: boolean): Look {
    return inside && this.zone ? this.zone.look : LOOK[this.city]
  }

  private palAt(tx: number): Pal {
    return this.inZone(tx) ? this.zone!.pal : CITY[this.city]
  }

  /** x0..x1 (dünya pikseli) aralığının bölgelere göre parçaları: [baş, son, görünüş, palet, taş tonları] */
  private spans(x0: number, x1: number): [number, number, Look, Pal, string[]][] {
    const base: [Look, Pal, string[]] = [LOOK[this.city], CITY[this.city], this.tones]
    const z = this.zone
    if (!z) return [[x0, x1, ...base]]
    const za = z.za * T
    const zb = z.zb * T
    const out: [number, number, Look, Pal, string[]][] = []
    if (x0 < za) out.push([x0, Math.min(x1, za), ...base])
    if (x1 > za && x0 < zb) out.push([Math.max(x0, za), Math.min(x1, zb), z.look, z.pal, z.tones])
    if (x1 > zb) out.push([Math.max(x0, zb), x1, ...base])
    return out
  }

  /**
   * Su hizasındaki yosun: gelgit ve su kıyısındaki taşın sudan yana koyu yeşile döner, sınırı yer yer sarkan
   * dalgalı bir çizgi (deniz çekilince kalan iz). Yollar toplanır, tek seferde boyanır.
   */
  private algae(c: Ctx, tx0: number, tx1: number, r0: number, r1: number) {
    const cols = this.w.cols
    const film = new Path2D()
    const edge = new Path2D()
    const tuft = new Path2D()
    for (let ty = r0; ty < Math.min(r1, this.w.rows); ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const m = this.moss.get(ty * cols + tx)
        if (!m) continue
        const x = tx * T
        const y = ty * T
        // en üstteki yosunlu karo: yosun su hizasının biraz altından başlar
        const top = (m & 4) === 0 && !this.moss.has((ty - 1) * cols + tx)
        const y0 = top ? y + 3 + hash(tx, ty, 61) * 3 : y
        if (m & 4) {
          // havuz tabanı: üst yüzde ince bir yosun bandı
          film.rect(x, y, T, 6)
          for (let k = 0; k < 3; k++) {
            const px = x + 2 + k * 5 + hash(tx, ty, 62 + k) * 2
            tuft.moveTo(px, y + 1)
            tuft.quadraticCurveTo(px + 0.8, y + 3, px + 0.3, y + 5 + hash(tx, ty, 65 + k) * 3)
          }
        }
        for (const [bit, side] of [[1, 0], [2, 1]] as const) {
          if (!(m & bit)) continue
          // sudan yana 9 piksellik koyu şerit, içe doğru sivrilen dişlerle
          const ex = side ? x + T : x
          const dir = side ? -1 : 1
          const reach = 6 + hash(tx, ty, 66 + side) * 3
          film.moveTo(ex, y0)
          film.lineTo(ex + dir * (reach - 2), y0)
          for (let k = 1; k <= 3; k++) {
            const yy = y0 + ((y + T - y0) * k) / 3
            const ym = yy - (y + T - y0) / 6
            film.quadraticCurveTo(ex + dir * (reach + 1 + hash(tx, ty * 7 + k, 67 + side) * 2.5), ym, ex + dir * (reach - 2), yy)
          }
          film.lineTo(ex, y + T)
          film.closePath()
          if (top) {
            edge.moveTo(ex, y0)
            edge.lineTo(ex + dir * (reach - 2), y0)
            // sarkan tutam
            const px = ex + dir * (2 + hash(tx, ty, 68 + side) * 3)
            tuft.moveTo(px, y0)
            tuft.quadraticCurveTo(px + dir, y0 - 2.5, px + dir * 0.4, y0 - 4)
          }
        }
      }
    c.fillStyle = 'rgba(38,70,52,0.55)'
    c.fill(film)
    c.strokeStyle = 'rgba(108,150,92,0.75)'
    c.lineWidth = 0.7
    c.stroke(edge)
    c.strokeStyle = 'rgba(30,58,40,0.8)'
    c.lineWidth = 0.6
    c.stroke(tuft)
  }

  /** dışbükey köşe mi (dx, dy: köşenin baktığı yön): yalnız düz taşta; buz, ıslak taş ve tünel ağzı köşeli kalır */
  private nib(tx: number, ty: number, dx: number, dy: number): boolean {
    const w = this.w
    if (ty <= 0 || tx <= 0 || tx >= w.cols - 1 || tileOf(w, tx, ty) !== SOLID) return false
    if (this.solid(tx + dx, ty) || this.solid(tx, ty + dy)) return false
    return !this.cave.has(ty * w.cols + tx + dx) && !this.cave.has((ty + dy) * w.cols + tx)
  }

  /** karonun derinlik gölgesi (0..1): yüzeye değen karoda sıfır, içeri girdikçe koyulaşır; hafif, konuma bağlı dalgalanır */
  private dark(tx: number, ty: number): number {
    const x = Math.min(Math.max(tx, 0), this.w.cols - 1)
    const y = Math.min(Math.max(ty, 0), this.rows - 1)
    const d = this.depth[y * this.w.cols + x] / 5
    if (d <= 1) return 0
    return Math.max(0, Math.min(0.78, (d - 1.2) * 0.155 + hash(tx >> 1, ty >> 1, 91) * 0.05))
  }

  /**
   * Derinlik: yüzeyden (her yönde en yakın açıklıktan) uzaklaştıkça kütle koyulaşır ve sakinleşir; göz oynanan kenarda kalır.
   * Karo başına bir piksellik küçük tuval büyütülerek basılır: geçiş yumuşaktır, kare ya da sütun izi kalmaz, maliyeti tek drawImage.
   */
  private shade(c: Ctx, tx0: number, tx1: number, r0: number, r1: number) {
    const n = tx1 - tx0 + 1
    const m = r1 - r0
    const img = new ImageData(n, m)
    const [r, g, b] = this.deep
    // komşularla yumuşatılır (3×3, ortası ağır): basamak ve çıkıntı dibinde karo karo kesik gölge kalmaz
    const W = n + 2
    const raw = new Float32Array(W * (m + 2))
    for (let j = -1; j <= m; j++) for (let i = -1; i <= n; i++) raw[(j + 1) * W + i + 1] = this.dark(tx0 + i, r0 + j)
    let any = false
    for (let j = 0; j < m; j++)
      for (let i = 0; i < n; i++) {
        const o0 = (j + 1) * W + i + 1
        const a = (raw[o0] * 4 + raw[o0 - 1] + raw[o0 + 1] + raw[o0 - W] + raw[o0 + W]) / (raw[o0] > 0 ? 8 : 16)
        const o = (j * n + i) * 4
        img.data[o] = r
        img.data[o + 1] = g
        img.data[o + 2] = b
        img.data[o + 3] = Math.round(a * 255)
        if (a > 0) any = true
      }
    if (!any) return
    SCRATCH ??= document.createElement('canvas')
    if (SCRATCH.width !== n || SCRATCH.height !== m) {
      SCRATCH.width = n
      SCRATCH.height = m
    }
    SCRATCH.getContext('2d')!.putImageData(img, 0, 0)
    c.imageSmoothingEnabled = true
    c.drawImage(SCRATCH, tx0 * T, r0 * T, n * T, m * T)
  }

  /**
   * tx0..tx1 sütunlarını ty0..ty1 bandında çizer (uçlar dahil); komşu birer sütun ve birer satır taşma payıdır.
   * Çizim tamamen dünyadaki konumdan türer (hash, mutlak kafes): bant bant çizilen parça, tek seferde çizilenle aynıdır.
   */
  private paint(c: Ctx, tx0: number, tx1: number, ty0: number, ty1: number) {
    const w = this.w
    const s = CITY[this.city]
    const rows = this.rows
    const solid = this.solid
    const r0 = Math.max(0, ty0 - 1)
    const r1 = Math.min(rows, ty1 + 2)
    c.lineCap = 'round'
    c.lineJoin = 'round'

    // ── 0. gizli köşelerin mağarası ve tünel ağzı: kaya içi karanlık, derine doğru koyulaşır
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!this.cave.has(ty * w.cols + tx)) continue
        const x = tx * T
        const y = ty * T
        c.fillStyle = mix(s.tileDark, '#120f1a', 0.62)
        c.fillRect(x - 0.05, y - 0.05, T + 0.1, T + 0.1)
        // arka duvarın taş örgüsü, çok soluk
        c.strokeStyle = 'rgba(255,236,200,0.06)'
        c.lineWidth = 0.6
        c.beginPath()
        c.moveTo(x, y + 8 + (tx % 2) * 2)
        c.lineTo(x + T, y + 8 + (tx % 2) * 2)
        c.moveTo(x + 5 + hash(tx, ty, 41) * 6, y)
        c.lineTo(x + 5 + hash(tx, ty, 41) * 6, y + 8)
        c.stroke()
      }

    // ── 1. kütle + malzeme (katı bölgeye kırpılır; dışbükey köşeler hafif yenmiş)
    c.save()
    c.beginPath()
    let any = false
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++)
        if (solid(tx, ty) && tileOf(w, tx, ty) !== ICE) {
          const tl = this.nib(tx, ty, -1, -1) ? NIB : 0
          const tr = this.nib(tx, ty, 1, -1) ? NIB : 0
          const br = this.nib(tx, ty, 1, 1) ? NIB : 0
          const bl = this.nib(tx, ty, -1, 1) ? NIB : 0
          if (tl || tr || br || bl) c.roundRect(tx * T - 0.05, ty * T - 0.05, T + 0.1, T + 0.1, [tl, tr, br, bl])
          else c.rect(tx * T - 0.05, ty * T - 0.05, T + 0.1, T + 0.1)
          any = true
        }
    if (any) {
      c.clip()
      // malzeme yalnız hücrenin kendi şeridine (ve dış hat payına) çizilir: konumdan türediği için komşu hücreyle birebir oturur
      const mx0 = (tx0 + 1) * T - MARGIN - 1
      const mx1 = tx1 * T + MARGIN + 1
      const my0 = ty0 * T - MARGIN - 1
      const my1 = (ty1 + 1) * T + MARGIN + 1
      // bölge sınırı hücreden geçiyorsa iki yanı ayrı ayrı (kendi şeridine kırpılarak) çizilir
      for (const [ax, bx, lk, pal, tones] of this.spans(mx0, mx1)) {
        const cut = ax > mx0 || bx < mx1
        if (cut) {
          c.save()
          c.beginPath()
          c.rect(ax, my0, bx - ax, my1 - my0)
          c.clip()
        }
        // derz: taşların arasından görünen koyu harç
        c.fillStyle = mix(pal.tileDark, '#2a1814', 0.3)
        c.fillRect(Math.max(ax, tx0 * T), r0 * T, Math.min(bx, (tx1 + 1) * T) - Math.max(ax, tx0 * T), (r1 - r0) * T)
        if (lk.mat === 'strata' || lk.mat === 'earth' || lk.mat === 'coal') this.strata(c, lk.mat, ax, bx, my0, my1)
        else this.masonry(c, lk.mat, ax, bx, my0, my1, tones)
        if (cut) c.restore()
      }
      // bölge sınırı: yapı kayaya yaslanır, aralarında koyu derz ve yapının ışık alan kenarı
      if (this.zone)
        for (const zx of [this.zone.za, this.zone.zb]) {
          const x = zx * T
          if (zx <= 0 || zx >= w.cols || x < mx0 || x > mx1) continue
          c.strokeStyle = 'rgba(26,14,36,0.5)'
          c.lineWidth = 1
          c.beginPath()
          wline(c, x, my0, x, my1, 0.4, 17)
          c.stroke()
          c.strokeStyle = 'rgba(255,240,212,0.3)'
          c.lineWidth = 0.7
          c.beginPath()
          const lx = zx === this.zone.za ? x + 1.1 : x - 1.1
          wline(c, lx, my0, lx, my1, 0.3, 18)
          c.stroke()
        }

      // yüzeyin yaşanmışlığı: örtünün altından sarkan yosun, kök, akıntı izi, liken, çatlağa dolmuş kar
      for (const inside of this.zone ? [false, true] : [false]) {
      const lk = this.lookAt(inside)
      const cap = lk.cap === 'merlon' || lk.cap === 'cini' ? 'stone' : lk.cap
      const patch = new Path2D()
      const fleck = new Path2D()
      const line = new Path2D()
      for (let ty = r0; ty < r1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || solid(tx, ty - 1) || ty === 0 || tileOf(w, tx, ty) !== SOLID || this.inZone(tx) !== inside) continue
          this.dress(cap, lk.mat, tx, ty, patch, fleck, line)
        }
      if (cap === 'grass') {
        c.fillStyle = mix(mix(s.tileTop, '#3f7a3a', 0.4), s.tileDark, 0.3)
        c.globalAlpha = 0.6
        c.fill(patch)
        c.globalAlpha = 0.55
        c.strokeStyle = mix(s.tileDark, '#20120c', 0.45)
        c.lineWidth = 0.6
        c.stroke(line)
      } else if (cap === 'stone') {
        c.strokeStyle = 'rgba(22,12,34,0.13)'
        c.lineWidth = 1.1
        c.stroke(line)
        c.fillStyle = mix(s.tileLight, '#dadcb4', 0.5)
        c.globalAlpha = 0.42
        c.fill(fleck)
      } else {
        c.strokeStyle = '#eef4ff'
        c.globalAlpha = 0.34
        c.lineWidth = 1.4
        c.stroke(line)
      }
      c.globalAlpha = 1
      }

      this.shade(c, tx0, tx1, r0, r1)
      if (this.moss.size) this.algae(c, tx0, tx1, r0, r1)

      // ışık sol üstten, tek kademe: sola bakan açık yüzler aydınlanır, sağa bakanlar ve çıkıntı altları gölgelenir
      const lit = new Path2D()
      const dim = new Path2D()
      const hatch = new Path2D()
      for (let ty = r0; ty < r1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || tileOf(w, tx, ty) === ICE) continue
          const x = tx * T
          const y = ty * T
          if (!solid(tx - 1, ty)) {
            lit.moveTo(x, y)
            lit.lineTo(x, y + T)
            wline(lit, x + 2.3, y + T, x + 2.3, y, 0.5, 14, true)
            lit.closePath()
          }
          if (!solid(tx + 1, ty)) {
            dim.moveTo(x + T, y)
            dim.lineTo(x + T, y + T)
            wline(dim, x + T - 2.9, y + T, x + T - 2.9, y, 0.6, 15, true)
            dim.closePath()
          }
          if (!solid(tx, ty + 1) && ty < rows - 1) {
            dim.moveTo(x, y + T)
            dim.lineTo(x + T, y + T)
            wline(dim, x + T, y + T - 3.2, x, y + T - 3.2, 0.6, 16, true)
            dim.closePath()
            // çıkıntının altı: ikinci, daha geniş ve soluk gölge (yumuşak geçiş)
            hatch.moveTo(x, y + T)
            hatch.lineTo(x + T, y + T)
            wline(hatch, x + T, y + T - 6.5, x, y + T - 6.5, 0.8, 19, true)
            hatch.closePath()
          }
        }
      c.fillStyle = 'rgba(255,226,182,0.2)'
      c.fill(lit)
      c.fillStyle = 'rgba(26,26,58,0.26)'
      c.fill(dim)
      c.fillStyle = 'rgba(26,26,58,0.09)'
      c.fill(hatch)
    }
    c.restore()

    // ── ıslak taş: aynı örgü, üstünde su parıltısı (kaygan olduğu okunmalı)
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tileOf(w, tx, ty) !== WET) continue
        const x = tx * T
        const y = ty * T
        c.fillStyle = 'rgba(60,150,190,0.34)'
        c.fillRect(x, y, T, T)
        if (!solid(tx, ty - 1)) {
          // damla (üstteki su tabakasını örtü çizer)
          c.fillStyle = 'rgba(170,220,255,0.7)'
          c.beginPath()
          c.ellipse(x + 4 + hash(tx, ty, 72) * 8, y + 5 + hash(tx, ty, 73) * 6, 0.7, 1.1, 0, 0, Math.PI * 2)
          c.fill()
        }
      }

    // ── 2. buz: ayrı malzeme, mavi mürekkep
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tileOf(w, tx, ty) !== ICE) continue
        const x = tx * T
        const y = ty * T
        const g = c.createLinearGradient(0, y, 0, y + T)
        g.addColorStop(0, '#c8ecfa')
        g.addColorStop(1, '#7fc0e2')
        c.fillStyle = g
        c.fillRect(x - 0.05, y - 0.05, T + 0.1, T + 0.1)
        c.strokeStyle = 'rgba(255,255,255,0.8)'
        c.lineWidth = 0.9
        c.beginPath()
        const o = hash(tx, ty) * 6
        c.moveTo(x + 2 + o, y + 4)
        c.lineTo(x + 6 + o, y + 2.4)
        c.moveTo(x + 8 - o * 0.5, y + 11)
        c.lineTo(x + 12 - o * 0.5, y + 8.6)
        c.stroke()
        if (hash(tx, ty, 3) < 0.4) {
          c.strokeStyle = 'rgba(60,120,160,0.45)'
          c.lineWidth = 0.5
          c.beginPath()
          c.moveTo(x + 3, y + 13)
          c.lineTo(x + 6.2 + hash(tx, ty, 5) * 1.6, y + 10.4)
          c.lineTo(x + 7.6, y + 8.2 + hash(tx, ty, 6) * 1.4)
          c.lineTo(x + 11, y + 6)
          c.stroke()
        }
      }

    // ── 3. üst örtü: açık üst yüzlerin koşusu boyunca
    for (let ty = r0; ty < r1; ty++) {
      let run = -1
      let kind = SOLID
      for (let tx = tx0; tx <= tx1 + 1; tx++) {
        const open = tx <= tx1 && solid(tx, ty) && !solid(tx, ty - 1) && tileOf(w, tx, ty - 1) !== CRUMBLE && ty > 0
        // buz ve ıslak taş kendi örtüsünü taşır: koşu malzeme (ya da bölge) değişince bölünür
        const t = open ? (tileOf(w, tx, ty) === ICE ? ICE : tileOf(w, tx, ty) === WET ? WET : SOLID) : EMPTY
        if (run >= 0 && (t !== kind || this.inZone(tx) !== this.inZone(run) || this.seabed(tx, ty) !== this.seabed(run, ty))) {
          const lk = this.lookAt(this.inZone(run))
          // su altında kalan taban burç değildir: yosun tutmuş düz silme
          const bed = this.seabed(run, ty)
          const pal = this.palAt(run)
          const cap = bed ? 'stone' : lk.cap
          this.cap(c, cap, kind, run, tx - 1, ty, this.nib(run, ty, -1, -1) ? NIB : 0, this.nib(tx - 1, ty, 1, -1) ? NIB : 0, bed ? { ...pal, tileTop: mix(pal.tileTop, '#4e7a58', 0.55) } : pal)
          run = -1
        }
        if (open && run < 0) {
          run = tx
          kind = t
        }
      }
    }

    // ── 4. dış hat: ince, sıcak koyu fırça (siyah mürekkep değil); kenar koşuları tek darbeyle, dışbükey köşeler yenmiş köşeyi izler
    c.strokeStyle = mix(s.tileDark, '#24120c', 0.55)
    c.globalAlpha = 0.85
    c.lineWidth = 0.85
    c.beginPath()
    for (let ty = r0; ty <= r1; ty++) {
      for (const side of [0, 1]) {
        // side 0: üst kenar (katının üstü boş), side 1: alt kenar (katı karo bir üst satırda)
        const row = ty - side
        const dy = side ? 1 : -1
        let run = -1
        for (let tx = tx0; tx <= tx1 + 1; tx++) {
          const edge = tx <= tx1 && (side === 0 ? solid(tx, ty) && !solid(tx, ty - 1) : solid(tx, ty - 1) && !solid(tx, ty)) && ty > 0 && ty < rows
          if (edge && run < 0) run = tx
          if (!edge && run >= 0) {
            const a = this.nib(run, row, -1, dy) ? NIB : 0
            const b = this.nib(tx - 1, row, 1, dy) ? NIB : 0
            const xa = run * T
            const xb = tx * T
            const y = ty * T
            if (a) {
              c.moveTo(xa, y - dy * a)
              c.quadraticCurveTo(xa, y, xa + a, y)
            }
            wline(c, a ? xa + a : xa - 0.4, y, b ? xb - b : xb + 0.4, y, 0.45, 11 + side, a > 0)
            if (b) c.quadraticCurveTo(xb, y, xb, y - dy * b)
            run = -1
          }
        }
      }
    }
    const v0 = r0 * T - 4
    const v1 = r1 * T + 4
    for (let tx = tx0; tx <= tx1 + 1; tx++) {
      for (const side of [0, 1]) {
        // side 0: sol yüz (katı karo bu sütunda), side 1: sağ yüz (katı karo soldaki sütunda)
        const col = tx - side
        const dx = side ? 1 : -1
        let run = -1
        for (let ty = 0; ty <= rows; ty++) {
          const edge = ty < rows && (side === 0 ? solid(tx, ty) && !solid(tx - 1, ty) : solid(tx - 1, ty) && !solid(tx, ty)) && tx > 0 && tx < w.cols
          if (edge && run < 0) run = ty
          if (!edge && run >= 0) {
            // koşu bütün sütun boyunca bulunur (uçları bandan bağımsız), yalnız banda değeni çizilir
            if (ty >= r0 && run < r1) {
              const ya = run * T + (this.nib(col, run, dx, -1) ? NIB : -0.4)
              const yb = ty * T - (this.nib(col, ty - 1, dx, 1) ? NIB : -0.4)
              wline(c, tx * T, Math.max(ya, v0), tx * T, Math.min(yb, v1), 0.45, 13 + side)
            }
            run = -1
          }
        }
      }
    }
    c.stroke()
    c.globalAlpha = 1

    // ── 5. tahta iskele, diken, ok tuzağı yüzü
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = tileOf(w, tx, ty)
        const x = tx * T
        const y = ty * T
        if (t === ONEWAY) this.plank(c, x, y, tileOf(w, tx - 1, ty) !== ONEWAY, tileOf(w, tx + 1, ty) !== ONEWAY, s.plank, tx)
        else if ((t === SPIKE_UP || t === SPIKE_DOWN) && !this.hideSpikes) this.spikes(c, x, y, t === SPIKE_UP, cbSpike(s.spike), tx)
        else if (t === TURRET) {
          c.fillStyle = s.tileDark
          c.strokeStyle = INK
          c.lineWidth = 1
          c.beginPath()
          c.roundRect(x + 2, y + 2, 12, 12, 2)
          c.fill()
          c.stroke()
          c.fillStyle = '#150f1c'
          c.beginPath()
          c.roundRect(x + 4, y + 6, 8, 4, 1.5)
          c.fill()
          c.strokeStyle = s.tileLight
          c.lineWidth = 0.8
          c.beginPath()
          c.moveTo(x + 6, y + 12)
          c.lineTo(x + 10, y + 12)
          c.stroke()
        }
      }
  }

  /**
   * Yürünen karonun yaşanmışlığı (kütlenin içine, örtünün altına): çimenli şehirde sarkan yosun ve toprakta kök,
   * taş örtüde yağmurun akıntı izi ve liken, karlı şehirde çatlağa dolmuş kar. Yollar toplanır, çağıran tek seferde boyar.
   */
  private dress(cap: Cap, mat: Material, tx: number, ty: number, patch: Path2D, fleck: Path2D, line: Path2D) {
    const x = tx * T
    const y = ty * T
    const r = hash(tx, ty, 81)
    const q = hash(tx, ty, 82)
    if (cap === 'grass') {
      if (r < 0.5) {
        const xa = x + q * 9
        const xb = xa + 5 + hash(tx, ty, 83) * 8
        const hang = 3.5 + hash(tx, ty, 84) * 5
        const mid = xa + (xb - xa) * (0.35 + hash(tx, ty, 85) * 0.3)
        patch.moveTo(xa - 1, y + 2)
        patch.lineTo(xb + 1, y + 2)
        patch.quadraticCurveTo(xb + 0.4, y + 2 + hang * 0.75, mid + 1.2, y + 2 + hang * 0.6)
        patch.quadraticCurveTo(mid, y + 2 + hang * 1.25, mid - 1.4, y + 2 + hang * 0.7)
        patch.quadraticCurveTo(xa - 0.4, y + 2 + hang * 0.9, xa - 1, y + 2)
      }
      if (mat === 'earth' && q < 0.45) {
        const rx = x + 2 + r * 12
        const len = 6 + hash(tx, ty, 86) * 6
        const sw = (hash(tx, ty, 87) - 0.5) * 5
        line.moveTo(rx, y + 3)
        line.quadraticCurveTo(rx + sw, y + 3 + len * 0.5, rx + sw * 0.4, y + 3 + len)
        line.moveTo(rx + sw * 0.5, y + 3 + len * 0.45)
        line.lineTo(rx + sw * 0.5 + (sw > 0 ? 2.2 : -2.2), y + 3 + len * 0.75)
      }
    } else if (cap === 'stone') {
      if (r < 0.2) {
        const sx = x + 2 + q * 12
        const len = 3 + hash(tx, ty, 84) * 5
        line.moveTo(sx, y + 4)
        line.quadraticCurveTo(sx + (hash(tx, ty, 83) - 0.5) * 1.6, y + 4 + len * 0.5, sx + (hash(tx, ty, 83) - 0.5), y + 4 + len)
      }
      if (hash(tx, ty, 85) < 0.16) {
        const lx = x + 3 + hash(tx, ty, 86) * 10
        const ly = y + 7 + hash(tx, ty, 87) * 6
        for (let k = 0; k < 4; k++) {
          const ex = lx + (hash(tx, ty, 88 + k) - 0.5) * 5.5
          const ey = ly + (hash(tx, ty, 92 + k) - 0.5) * 3.6
          const rad = 0.4 + hash(tx, ty, 96 + k) * 0.6
          fleck.moveTo(ex + rad * 1.3, ey)
          fleck.ellipse(ex, ey, rad * 1.3, rad, 0, 0, Math.PI * 2)
        }
      }
    } else if (r < 0.55) {
      const sx = x + 1 + q * 9
      const sy = y + 7.5 + hash(tx, ty, 83) * 4
      line.moveTo(sx, sy)
      line.lineTo(sx + 2.5 + hash(tx, ty, 84) * 3, sy + (hash(tx, ty, 85) - 0.5))
      if (r < 0.25) {
        line.moveTo(sx + 5, sy + 2.6)
        line.lineTo(sx + 6.8, sy + 2.4)
      }
    }
  }

  /**
   * Taş örgüsü (tuğla, kesme taş, kiklop, kaya). Her sıranın derzleri kendi konumundan kayar: taş boyları çeşitlenir,
   * sıra çizgisi hafif dalgalanır, bazı taşlar ikiye bölünür, bazılarının köşesi kırıktır. Taş tonu konumdan seçilir
   * (yedi ton: açık, koyu, bir sıcak, bir soğuk). Aynı tondaki taşlar tek yolda toplanıp tek seferde boyanır.
   */
  private masonry(c: Ctx, mat: Exclude<Material, 'strata' | 'earth' | 'coal'>, x0: number, x1: number, y0: number, y1: number, tones: string[]) {
    const P = MASON[mat]
    const fills = tones.map(() => new Path2D())
    const lit = new Path2D()
    const dim = new Path2D()
    const mark = new Path2D()
    const glint = new Path2D()
    const facet = new Path2D()
    const hollow = new Path2D()
    const dabL = new Path2D()
    const dabD = new Path2D()
    const g = P.gap
    // sıra çizgisi: x boyunca yumuşak dalga (alt sıranın üstü ile üst sıranın altı aynı eğriyi izler)
    const lineY = (j: number, x: number) => j * P.bh + (lnoise(x / P.wl, j, 37) - 0.5) * 2 * P.jy
    const off = (j: number) => (P.half ? (j & 1) * P.bw * 0.5 + (hash(j, 7, 30) - 0.5) * P.bw * 0.12 : hash(j, 7, 30) * P.bw)
    const top = (i: number, j: number) => i * P.bw + off(j) + (hash(i, j, 31) - 0.5) * P.bw * P.wj
    const bot = (i: number, j: number) => top(i, j) + (hash(i, j, 39) - 0.5) * 2 * P.lean

    const stone = (ax: number, ay: number, bx: number, by: number, ex: number, ey: number, dx: number, dy: number, k1: number, k2: number) => {
      const pick = hash(k1, k2, 33)
      let tone = 0
      while (tone < P.tone.length && pick > P.tone[tone]) tone++
      // kırık köşe: bir köşe öbürlerinden çok daha yuvarlak
      const chip = hash(k1, k2, 46)
      const worn = chip < P.chip ? Math.floor((chip / P.chip) * 4) : -1
      const wd = bx - ax
      const hg = dy - ay
      if (wd < 1.5 || hg < 1.5) return
      // yarıçap taşa sığmalı (dar taşta arcTo ilmek atar)
      const fit = (Math.min(wd, hg, ex - dx) - 0.4) / 2
      const rr = (n: number) => Math.max(0.2, Math.min(worn === n ? P.r * 3.2 : P.r, worn === n ? fit * 1.5 : fit))
      quad(fills[tone], ax, ay, bx, by, ex, ey, dx, dy, rr(0), rr(1), rr(2), rr(3))
      // taşın ışık kenarı (sol + üst) ve gölge kenarı (sağ + alt)
      lit.moveTo(dx + 0.45, dy - rr(3) - 0.2)
      lit.arcTo(ax + 0.45, ay + 0.45, bx - rr(1), by + 0.45, rr(0))
      lit.lineTo(bx - rr(1) - 0.2, by + 0.45)
      dim.moveTo(bx - 0.4, by + rr(1) + 0.2)
      dim.arcTo(ex - 0.4, ey - 0.4, dx + rr(3), dy - 0.4, rr(2))
      dim.lineTo(dx + rr(3) + 0.2, dy - 0.4)
      if (wd < 5 || hg < 4) return
      const lerp = (u: number, v: number, t: number) => u + (v - u) * t
      // fırça izi: taşın yönünde iki kısa, kıvrık darbe (ışıkta açık, gölgede koyu)
      for (let k = 0; k < (wd < 20 ? 1 : 2); k++) {
        if (wd < 20 && hash(k1, k2, 59) < 0.5) break
        const u = 0.18 + hash(k1, k2, 60 + k) * 0.55
        const v = k ? 0.62 + hash(k1, k2, 62) * 0.22 : 0.2 + hash(k1, k2, 63) * 0.2
        const px = lerp(ax, bx, u)
        const py = lerp(ay, dy, v)
        const len = wd * (0.25 + hash(k1, k2, 64 + k) * 0.25)
        const p = k ? dabD : dabL
        p.moveTo(px, py)
        p.quadraticCurveTo(px + len * 0.5, py - 0.9 + hash(k1, k2, 66 + k) * 1.8, px + len, py + (hash(k1, k2, 68 + k) - 0.5) * 1.2)
      }
      // yüzey: çatlak, oyuk, keski izi; kayada kırılma düzlemi
      const d = hash(k1, k2, 34)
      if (d < 0.1) {
        const px = ax + wd * (0.2 + hash(k1, k2, 35) * 0.6)
        const sw = (hash(k1, k2, 36) - 0.5) * 4
        mark.moveTo(px, ay + 0.6)
        mark.lineTo(px + sw * 0.5, ay + hg * 0.28)
        mark.lineTo(px + sw * 0.2, ay + hg * 0.5)
        mark.lineTo(px + sw, ay + hg * (0.7 + hash(k1, k2, 38) * 0.25))
        if (hg > 10) {
          mark.moveTo(px + sw * 0.2, ay + hg * 0.5)
          mark.lineTo(px + sw * 0.2 - Math.sign(sw || 1) * 2.4, ay + hg * 0.62)
        }
      } else if (d < 0.18) {
        for (let k = 0; k < 3; k++) {
          const px = ax + wd * (0.15 + hash(k1, k2, 50 + k) * 0.7)
          const py = ay + hg * (0.25 + hash(k1, k2, 53 + k) * 0.5)
          const rad = 0.35 + hash(k1, k2, 56 + k) * 0.45
          hollow.moveTo(px + rad * 1.4, py)
          hollow.ellipse(px, py, rad * 1.4, rad, 0, 0, Math.PI * 2)
        }
      } else if (d > 0.92 && hg > 10) {
        const px = ax + wd * (0.15 + hash(k1, k2, 35) * 0.4)
        for (let k = 0; k < 3; k++) {
          glint.moveTo(px + k * 2.8, ay + hg * 0.34)
          glint.lineTo(px + k * 2.8 + 1.8, ay + hg * 0.6)
        }
      }
      const f = hash(k1, k2, 47)
      if (mat === 'rock' || f < 0.3) {
        // sol üstten ışık alan düzlem
        const cut = 0.45 + f * 0.4
        facet.moveTo(ax + 1, ay + 1)
        facet.lineTo(ax + wd * cut, ay + 1 + (by - ay) * cut)
        facet.lineTo(ax + wd * cut * 0.55, ay + hg * (0.35 + f * 0.3))
        facet.lineTo(dx + 1 + (ax - dx) * 0.45, ay + hg * 0.55)
        facet.closePath()
      }
    }

    for (let j = Math.floor((y0 - P.jy) / P.bh) - 1; j * P.bh - P.jy < y1; j++) {
      const o = off(j)
      for (let i = Math.floor((x0 - o) / P.bw) - 1; i * P.bw + o - P.bw < x1; i++) {
        const xa = top(i, j)
        const xb = top(i + 1, j)
        const xd = bot(i, j)
        const xe = bot(i + 1, j)
        const ya = lineY(j, xa) + g
        const yb = lineY(j, xb) + g
        const ye = lineY(j + 1, xe) - g
        const yd = lineY(j + 1, xd) - g
        const sp = hash(i, j, 45)
        if (sp < P.split && mat === 'ashlar') {
          // iki ince sıra
          const m = 0.42 + hash(i, j, 48) * 0.16
          const ym = ya + (yd - ya) * m
          const yn = yb + (ye - yb) * m
          stone(xa + g, ya, xb - g, yb, xb - g, yn - g, xa + g, ym - g, i * 2, j)
          stone(xa + g, ym + g, xb - g, yn + g, xe - g, ye, xd + g, yd, i * 2 + 1, j)
        } else if (sp < P.split && xb - xa > P.bw * 0.8) {
          // yan yana iki küçük taş
          const m = 0.36 + hash(i, j, 48) * 0.28
          const xm = xa + (xb - xa) * m
          const xn = xd + (xe - xd) * m + (hash(i, j, 49) - 0.5) * P.lean
          const ym = lineY(j, xm) + g
          const yn = lineY(j + 1, xn) - g
          stone(xa + g, ya, xm - g, ym, xn - g, yn, xd + g, yd, i * 2, j)
          stone(xm + g, ym, xb - g, yb, xe - g, ye, xn + g, yn, i * 2 + 1, j)
        } else stone(xa + g, ya, xb - g, yb, xe - g, ye, xd + g, yd, i * 2, j)
      }
    }
    for (let t = 0; t < fills.length; t++) {
      c.fillStyle = tones[t]
      c.fill(fills[t])
    }
    // boyalı hacim: her sıranın üstü ılık ışıkta, altı serin gölgede (sıra başına tek geçiş; taş taş yol çizmekten çok ucuz)
    for (let j = Math.floor(y0 / P.bh) - 1; j * P.bh < y1; j++) {
      const ry = j * P.bh
      const grad = c.createLinearGradient(0, ry, 0, ry + P.bh)
      grad.addColorStop(0, 'rgba(255,224,176,0.16)')
      grad.addColorStop(0.3, 'rgba(255,224,176,0.05)')
      grad.addColorStop(0.55, 'rgba(255,224,176,0)')
      grad.addColorStop(0.75, 'rgba(34,36,74,0.05)')
      grad.addColorStop(1, 'rgba(34,36,74,0.2)')
      c.fillStyle = grad
      c.fillRect(x0, ry, x1 - x0, P.bh)
    }
    c.fillStyle = 'rgba(255,236,200,0.05)'
    c.fill(facet)
    c.lineWidth = 2.4
    c.strokeStyle = 'rgba(255,232,190,0.07)'
    c.stroke(dabL)
    c.strokeStyle = 'rgba(30,22,40,0.08)'
    c.stroke(dabD)
    c.fillStyle = 'rgba(36,20,22,0.3)'
    c.fill(hollow)
    c.lineWidth = 0.8
    c.strokeStyle = 'rgba(255,232,192,0.24)'
    c.stroke(lit)
    c.strokeStyle = 'rgba(30,26,56,0.3)'
    c.stroke(dim)
    c.lineWidth = 0.5
    c.strokeStyle = 'rgba(36,20,26,0.34)'
    c.stroke(mark)
    c.strokeStyle = 'rgba(255,238,205,0.22)'
    c.stroke(glint)
  }

  /**
   * Katmanlı zemin (tüf, traverten, toprak): kalınlığı ve tonu sıradan sıraya değişen dalgalı tabakalar; aralarında koyu
   * dikiş ve altında ince ışık çizgisi. Tüfte tabaka boyunca uzanan oyuklar, toprakta gömülü çakıllar; kömürde şeyl
   * tabakalarının arasında kapkara damarlar ve damarın içinde ışığı yakalayan küçük elmas yüzleri.
   */
  private strata(c: Ctx, mat: 'strata' | 'earth' | 'coal', x0: number, x1: number, y0: number, y1: number) {
    const s = CITY[this.city]
    const band = mat === 'earth' ? 13 : mat === 'coal' ? 9 : 10
    const STEP = 6
    const xa = Math.floor(x0 / STEP) * STEP
    const xb = Math.ceil(x1 / STEP) * STEP
    const lineY = (k: number, x: number) =>
      k * band + (hash(k, 3, 25) - 0.5) * band * 0.5 + Math.sin(x * 0.045 + k * 1.7) * 2.2 + Math.sin(x * 0.13 + k) * 0.9 + (lnoise(x / 9, k, 26) - 0.5) * 1.3
    const tones = [s.tile, mix(s.tile, s.tileLight, 0.5), mix(s.tile, s.tileDark, 0.38), mix(s.tile, s.tileLight, 0.22), mix(s.tile, s.tileDark, 0.18)]
    const seam = new Path2D()
    const glow = new Path2D()
    const bed = new Path2D()
    const seams: number[] = []
    for (let k = Math.floor(y0 / band) - 2; (k - 1) * band < y1; k++) {
      const seamBand = mat === 'coal' && hash(k, 5, 31) < 0.34
      if (seamBand) seams.push(k)
      c.fillStyle = seamBand ? mix(s.tileDark, '#0e0e12', 0.55) : tones[Math.floor(hash(k, 5, 27) * tones.length)]
      c.beginPath()
      c.moveTo(xa, y1 + 8)
      for (let x = xa; x <= xb; x += STEP) {
        const y = lineY(k, x)
        c.lineTo(x, y)
        if (x === xa) {
          seam.moveTo(x, y)
          glow.moveTo(x, y + 0.75)
        } else {
          seam.lineTo(x, y)
          glow.lineTo(x, y + 0.75)
        }
        // tabakanın içinde yer yer ince yatak çizgisi
        const cell = Math.floor(x / 30)
        if (hash(cell, k, 28) < 0.45 && x % 30 !== 0 && Math.floor((x - STEP) / 30) === cell) {
          const f = 0.4 + hash(cell, k, 29) * 0.3
          bed.moveTo(x - STEP, lineY(k, x - STEP) * (1 - f) + lineY(k + 1, x - STEP) * f)
          bed.lineTo(x, y * (1 - f) + lineY(k + 1, x) * f)
        }
      }
      c.lineTo(xb, y1 + 8)
      c.closePath()
      c.fill()
    }
    // tabakanın hacmi: altı (bir alttakinin üstüne bindiği yer) serin gölgede, üstü ılık ışıkta; iki soluk, geniş darbe
    c.save()
    c.translate(0, -1.6)
    c.lineWidth = 3.2
    c.strokeStyle = 'rgba(34,28,58,0.12)'
    c.stroke(seam)
    c.restore()
    c.save()
    c.translate(0, 1.8)
    c.lineWidth = 2.6
    c.strokeStyle = 'rgba(255,226,180,0.1)'
    c.stroke(seam)
    c.restore()
    c.lineWidth = 0.6
    c.strokeStyle = 'rgba(40,22,26,0.3)'
    c.stroke(seam)
    c.strokeStyle = 'rgba(255,240,212,0.17)'
    c.stroke(glow)
    c.lineWidth = 0.5
    c.strokeStyle = 'rgba(40,22,26,0.12)'
    c.stroke(bed)
    // fırça izi: tabaka boyunca uzanan kısa, geniş, soluk darbeler (açık ve koyu)
    const dabL = new Path2D()
    const dabD = new Path2D()
    for (let gx = Math.floor(x0 / 11) - 1; gx * 11 < x1; gx++)
      for (let gy = Math.floor(y0 / 5) - 1; gy * 5 < y1; gy++) {
        const h = hash(gx, gy, 14)
        if (h > 0.26) continue
        const px = gx * 11 + hash(gx, gy, 15) * 8
        const py = gy * 5 + hash(gx, gy, 16) * 3
        const len = 5 + hash(gx, gy, 17) * 9
        const p = h < 0.12 ? dabL : dabD
        p.moveTo(px, py)
        p.quadraticCurveTo(px + len * 0.5, py + (hash(gx, gy, 18) - 0.5) * 1.6, px + len, py + Math.sin((px + len) * 0.045) * 0.8)
      }
    c.lineWidth = 2
    c.strokeStyle = 'rgba(255,232,190,0.08)'
    c.stroke(dabL)
    c.strokeStyle = 'rgba(40,24,30,0.08)'
    c.stroke(dabD)

    // kömür damarı: kırık yüzler (açık kurşuni eşkenar dörtgen) ve tek tük beyaz parıltı
    if (seams.length) {
      const facet = new Path2D()
      const glint = new Path2D()
      for (const k of seams)
        for (let gx = Math.floor(xa / 9); gx * 9 < xb; gx++) {
          if (hash(gx, k, 32) > 0.42) continue
          const px = gx * 9 + hash(gx, k, 33) * 6
          const top = lineY(k, px)
          const py = top + (lineY(k + 1, px) - top) * (0.3 + hash(gx, k, 34) * 0.4)
          const r = 0.9 + hash(gx, k, 35) * 1.1
          facet.moveTo(px, py - r)
          facet.lineTo(px + r * 0.9, py)
          facet.lineTo(px, py + r * 0.7)
          facet.lineTo(px - r * 0.9, py)
          facet.closePath()
          if (hash(gx, k, 36) < 0.35) {
            glint.moveTo(px - r * 0.4, py - r * 0.2)
            glint.lineTo(px + r * 0.1, py - r * 0.55)
          }
        }
      c.fillStyle = mix(s.tileLight, '#9aa4c0', 0.45)
      c.fill(facet)
      c.strokeStyle = 'rgba(14,12,18,0.55)'
      c.lineWidth = 0.4
      c.stroke(facet)
      c.strokeStyle = 'rgba(255,255,255,0.85)'
      c.lineWidth = 0.55
      c.stroke(glint)
    }

    // tüfte oyuklar (üstü gölgeli, alt dudağı ışıklı), toprakta çakıllar (üstü ışıklı, mürekkep hatlı)
    const body = new Path2D()
    const rim = new Path2D()
    const spark = new Path2D()
    for (let gx = Math.floor(x0 / 14) - 1; gx * 14 < x1; gx++)
      for (let gy = Math.floor(y0 / 14) - 1; gy * 14 < y1; gy++) {
        const r = hash(gx, gy, 21)
        if (r > (mat === 'earth' ? 0.26 : mat === 'coal' ? 0.1 : 0.2)) continue
        const px = gx * 14 + hash(gx, gy, 22) * 11
        const py = gy * 14 + hash(gx, gy, 23) * 11
        const big = hash(gx, gy, 24)
        if (mat !== 'earth') {
          const rx = 1.5 + big * 2.6
          const ry = 0.7 + big * 0.9
          body.moveTo(px + rx, py)
          body.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2)
          rim.moveTo(px - rx * 0.8, py + ry * 0.75)
          rim.quadraticCurveTo(px, py + ry * 1.7, px + rx * 0.85, py + ry * 0.7)
        } else {
          const rx = 1 + big * 1.7
          const ry = rx * (0.62 + hash(gx, gy, 20) * 0.2)
          body.moveTo(px + rx, py)
          body.ellipse(px, py, rx, ry, (hash(gx, gy, 19) - 0.5) * 0.8, 0, Math.PI * 2)
          spark.moveTo(px - rx * 0.5, py - ry * 0.35)
          spark.lineTo(px + rx * 0.1, py - ry * 0.5)
        }
      }
    if (mat !== 'earth') {
      c.fillStyle = 'rgba(40,22,40,0.36)'
      c.fill(body)
      c.strokeStyle = 'rgba(255,240,212,0.3)'
      c.lineWidth = 0.55
      c.stroke(rim)
    } else {
      c.fillStyle = mix(s.tileLight, '#ffffff', 0.1)
      c.fill(body)
      c.strokeStyle = 'rgba(30,16,36,0.5)'
      c.lineWidth = 0.5
      c.stroke(body)
      c.strokeStyle = 'rgba(255,250,235,0.55)'
      c.stroke(spark)
    }
  }

  /**
   * Üst örtü: taş silme (derzli kapak taşları), çimen (sarkan yumuşak saçak, tutamlar, tek tük çiçek) ya da kar (yumuşak
   * loblarla sarkan örtü). Altında tek kademe temas gölgesi, üstünde yürünen kenarı okutan parlak çizgi. Alt kenar dünyadaki
   * konumdan türer (mutlak kafes): koşu hangi hücrede kesilirse kesilsin aynıdır. ra, rb: uçlardaki yenmiş köşe yarıçapı.
   */
  private cap(c: Ctx, cap: Cap, kind: number, a: number, b: number, ty: number, ra: number, rb: number, s: Pal) {
    const x0 = a * T
    const x1 = (b + 1) * T
    const y = ty * T
    if (kind === ICE) {
      c.strokeStyle = 'rgba(255,255,255,0.9)'
      c.lineWidth = 1.1
      c.beginPath()
      wline(c, x0 + 0.5, y + 0.9, x1 - 0.5, y + 0.9, 0.25, 41)
      c.stroke()
      return
    }
    if (cap === 'merlon') {
      this.merlons(c, x0, x1, y, s)
      cap = 'stone'
    }
    if (cap === 'cini') {
      this.cini(c, x0, x1, y)
      cap = 'stone'
    }
    const color = cap === 'snow' ? '#eef5fc' : s.tileTop
    // örtünün kalınlığı (x'e göre): taşta düz; çimende yuvarlak öbekler, yer yer sarkan tutam; karda yumuşak, iri sarkmalar
    const thick = (x: number): number => {
      if (cap === 'stone') return 3 + (lnoise(x / 5, ty, 42) - 0.5) * 0.5
      if (cap === 'snow') return 3.1 + snoise(x / 6.5, ty, 42) * 2.6 + snoise(x / 2.7, ty, 48) * 0.9
      const u = x / 5.6 + hash(ty, 9, 40)
      const k = Math.floor(u)
      const f = u - k
      return 1.9 + Math.sqrt(4 * f * (1 - f)) * (1.3 + hash(k, ty, 42) * 1.9 + (hash(k, ty, 48) < 0.16 ? 1.7 : 0)) + snoise(x / 9, ty, 49) * 0.8
    }
    const STEP = 0.95
    const xs: number[] = [x0]
    for (let k = Math.floor(x0 / STEP) + 1; k * STEP < x1; k++) xs.push(k * STEP)
    xs.push(x1)
    const ys = xs.map(thick)
    /** alt kenar, sağdan sola: örneklerin ortalarından geçen yumuşak eğri */
    const under = (p: Pen, dy: number) => {
      const n = xs.length - 1
      p.lineTo(xs[n], y + ys[n] + dy)
      for (let i = n - 1; i > 0; i--) p.quadraticCurveTo(xs[i], y + ys[i] + dy, (xs[i] + xs[i - 1]) / 2, y + (ys[i] + ys[i - 1]) / 2 + dy)
      p.lineTo(xs[0], y + ys[0] + dy)
    }
    const outline = (dy: number) => {
      c.beginPath()
      c.moveTo(x0 + ra, y)
      c.lineTo(x1 - rb, y)
      if (rb) c.quadraticCurveTo(x1, y, x1, y + rb)
      under(c, dy)
      if (ra) {
        c.lineTo(x0, y + ra)
        c.quadraticCurveTo(x0, y, x0 + ra, y)
      }
      c.closePath()
    }
    // güneş alan üst sıra: örtünün altında, yüzeyden bir karo derine sönen ılık ışık
    const sun = c.createLinearGradient(0, y, 0, y + T)
    sun.addColorStop(0, cap === 'snow' ? 'rgba(220,236,255,0.16)' : 'rgba(255,214,160,0.2)')
    sun.addColorStop(1, 'rgba(255,214,160,0)')
    c.fillStyle = sun
    c.fillRect(x0 + ra * 0.5, y, x1 - x0 - (ra + rb) * 0.5, T)
    // temas gölgesi: örtünün biçimi, aşağıda iki soluk kat (yumuşak ortam gölgesi)
    const shadowTint = cap === 'snow' ? '52,70,112' : '30,20,34'
    c.fillStyle = `rgba(${shadowTint},0.14)`
    outline(cap === 'stone' ? 2.6 : 3.2)
    c.fill()
    c.fillStyle = `rgba(${shadowTint},0.2)`
    outline(cap === 'stone' ? 1.2 : 1.5)
    c.fill()
    const body = cap === 'grass' ? mix(color, '#2e5a2c', 0.24) : color
    c.fillStyle = body
    outline(0)
    c.fill()
    // örtünün gölgede kalan alt yüzü: serin, yumuşak (siyah hat yok)
    c.strokeStyle = cap === 'snow' ? 'rgba(140,168,210,0.8)' : mix(body, s.tileDark, cap === 'grass' ? 0.45 : 0.38, '#2a3a6a', 0.12)
    c.lineWidth = cap === 'snow' ? 1.5 : 1.3
    c.beginPath()
    c.moveTo(xs[xs.length - 1], y + ys[ys.length - 1] - 0.7)
    under(c, -0.7)
    c.stroke()
    // üst yüz ılık ışıkta: yürünen kenarın hemen altında açık bant
    c.fillStyle = cap === 'snow' ? 'rgba(255,255,255,0.9)' : mix(body, '#fff2c4', cap === 'grass' ? 0.32 : 0.4)
    c.globalAlpha = 0.75
    c.beginPath()
    c.moveTo(x0 + ra, y)
    c.lineTo(x1 - rb, y)
    wline(c, x1 - rb - 0.4, y + 1.5, x0 + ra + 0.4, y + 1.5, 0.35, 45, true)
    c.closePath()
    c.fill()
    c.globalAlpha = 1
    if (cap === 'stone') {
      // kapak taşlarının derzi: yumuşak koyu çizgi, sağında ince ışık
      const joint = new Path2D()
      const shine = new Path2D()
      for (let k = Math.floor(x0 / 11); k * 11 < x1; k++) {
        if (hash(k, ty, 45) < 0.22) continue
        const jx = k * 11 + hash(k, ty, 46) * 6
        if (jx < x0 + 2.5 || jx > x1 - 2.5) continue
        joint.moveTo(jx, y + 0.9)
        joint.lineTo(jx + (hash(k, ty, 47) - 0.5) * 0.8, y + 2.9)
        shine.moveTo(jx + 0.6, y + 1.1)
        shine.lineTo(jx + 0.6, y + 2.3)
      }
      c.strokeStyle = 'rgba(40,24,28,0.3)'
      c.lineWidth = 0.6
      c.stroke(joint)
      c.strokeStyle = 'rgba(255,248,230,0.35)'
      c.lineWidth = 0.45
      c.stroke(shine)
    }
    // yürünen kenar: ince, ılık parıltı (basılacak yer her zaman okunur)
    c.strokeStyle = cap === 'snow' ? '#ffffff' : cap === 'grass' ? mix(color, '#f6ffc0', 0.55) : mix(color, '#fff6e0', 0.6)
    c.lineWidth = 0.7
    c.beginPath()
    wline(c, x0 + 0.8 + ra * 0.5, y + 0.6, x1 - 0.8 - rb * 0.5, y + 0.6, 0.2, 43)
    c.stroke()
    if (kind === WET) {
      // ıslak taş: örtünün üstünde su tabakası ve parıltılar (kaygan olduğu okunmalı)
      // koyu turkuaz su tabakası, altında ince koyu kenar: beyaz travertende (Denizli) ve açık taşta da seçilsin
      c.fillStyle = 'rgba(40,150,190,0.78)'
      c.fillRect(x0, y + 0.5, x1 - x0, 2.4)
      c.fillStyle = 'rgba(20,80,110,0.45)'
      c.fillRect(x0, y + 2.9, x1 - x0, 0.6)
      c.strokeStyle = 'rgba(255,255,255,0.85)'
      c.lineWidth = 0.7
      c.beginPath()
      for (let tx = a; tx <= b; tx++) {
        const o = hash(tx, ty, 71) * 7
        c.moveTo(tx * T + 1.5 + o, y + 1.3)
        c.lineTo(tx * T + 6.5 + o, y + 1.3)
      }
      c.stroke()
      return
    }
    // küçük ayrıntı: çakıl, yosun lekesi, kuru yaprak (yüzeye oturur, toplanan bir şeyle karışmayacak kadar küçük ve soluk)
    const pebble = new Path2D()
    const pebbleLit = new Path2D()
    const moss = new Path2D()
    const leafs: Path2D[] = [new Path2D(), new Path2D(), new Path2D()]
    for (let tx = a; tx <= b; tx++) {
      const x = tx * T
      const r = hash(tx, ty, 74)
      const px = x + 2.5 + hash(tx, ty, 75) * 11
      if (cap === 'stone' && r < 0.22) {
        const rx = 0.9 + hash(tx, ty, 76) * 1.1
        const ry = rx * 0.62
        pebble.moveTo(px + rx, y + 2.6)
        pebble.ellipse(px, y + 2.6, rx, ry, 0, 0, Math.PI * 2)
        pebbleLit.moveTo(px - rx * 0.1, y + 2.6 - ry * 0.35)
        pebbleLit.ellipse(px - rx * 0.35, y + 2.6 - ry * 0.35, rx * 0.4, ry * 0.32, 0, 0, Math.PI * 2)
      } else if (cap === 'stone' && r < 0.36) {
        const rx = 1.6 + hash(tx, ty, 76) * 2
        moss.moveTo(px + rx, y + 2.2)
        moss.ellipse(px, y + 2.2, rx, 0.9, 0, 0, Math.PI * 2)
      } else if (cap === 'grass' && r < 0.14) {
        const ang = (hash(tx, ty, 77) - 0.5) * 1.6
        const l = leafs[Math.floor(hash(tx, ty, 78) * 3)]
        l.moveTo(px + Math.cos(ang) * 1.5, y + 1 + Math.sin(ang) * 1.5)
        l.ellipse(px, y + 1, 1.5, 0.7, ang, 0, Math.PI * 2)
      }
    }
    c.fillStyle = mix(s.tileDark, s.tile, 0.45)
    c.fill(pebble)
    c.fillStyle = 'rgba(255,240,214,0.5)'
    c.fill(pebbleLit)
    c.fillStyle = 'rgba(92,120,56,0.42)'
    c.fill(moss)
    const LEAF = ['#c9732e', '#a8502a', '#d8a63c']
    for (let k = 0; k < 3; k++) {
      c.fillStyle = LEAF[k]
      c.fill(leafs[k])
    }
    if (cap === 'grass') {
      // çimen: kenardan sarkan tutamlar (koyu, sivrilen), üstte alçak, yana yatık yaprak öbekleri (dipte koyu, uçta ışık).
      // Dik, sivri ve açık renkli çizgiler uzaktan diken gibi okunuyordu: tutamlar yana yatar, kısa kalır, yeşile çalar.
      const hang = new Path2D()
      for (let k = Math.floor(x0 / 3.2); k * 3.2 < x1; k++) {
        const h = hash(k, ty, 55)
        if (h > 0.6) continue
        const x = k * 3.2 + hash(k, ty, 56) * 1.6
        if (x < x0 + 1.2 || x > x1 - 1.2) continue
        const base = y + thick(x) - 0.8
        const len = 1.6 + h * 5.4
        const lean = (hash(k, ty, 57) - 0.5) * 1.6
        hang.moveTo(x - 1.1, base)
        hang.quadraticCurveTo(x - 0.4 + lean * 0.3, base + len * 0.6, x + lean, base + len)
        hang.quadraticCurveTo(x + 0.5 + lean * 0.3, base + len * 0.5, x + 1.1, base)
        hang.closePath()
      }
      c.fillStyle = mix(body, s.tileDark, 0.32, '#22401e', 0.2)
      c.fill(hang)
      const dark = new Path2D()
      const light = new Path2D()
      for (let k = Math.floor(x0 / 4); k * 4 < x1; k++) {
        const r = hash(k, ty, 44)
        const x = k * 4 + hash(k, ty, 50) * 2.4
        if (x < x0 + 2 || x > x1 - 2) continue
        if (r >= 0.3) {
          const hgt = 1.4 + (r - 0.3) * 3.6
          const n = r > 0.75 ? 4 : 3
          for (let m = 0; m < n; m++) {
            const dx = (m - (n - 1) / 2) * 0.95
            const lean = dx * 2 + (hash(k, ty, 51 + m) - 0.5) * 1.4
            const tip = hgt * (m === 1 ? 1 : 0.62 + hash(k, ty, 60 + m) * 0.25)
            const p = m === 1 || m === 3 ? light : dark
            p.moveTo(x + dx - 0.6, y + 1.2)
            p.quadraticCurveTo(x + dx + lean * 0.25, y - tip * 0.6, x + dx + lean, y - tip)
            p.quadraticCurveTo(x + dx + lean * 0.35 + 0.4, y - tip * 0.4, x + dx + 0.6, y + 1.2)
            p.closePath()
          }
        } else if (r < 0.05) {
          const hue = ['#fff3dc', '#ffd866', '#f4a8bc'][Math.floor(hash(k, ty, 54) * 3)]
          c.strokeStyle = mix(color, '#1e3a1a', 0.5)
          c.lineWidth = 0.5
          c.beginPath()
          c.moveTo(x, y + 0.6)
          c.lineTo(x + 0.3, y - 1.5)
          c.stroke()
          c.fillStyle = hue
          c.beginPath()
          c.arc(x + 0.3, y - 2, 0.85, 0, Math.PI * 2)
          c.fill()
          c.fillStyle = 'rgba(120,70,40,0.6)'
          c.beginPath()
          c.arc(x + 0.3, y - 2, 0.3, 0, Math.PI * 2)
          c.fill()
        }
      }
      c.fillStyle = mix(body, '#1e3a1a', 0.3)
      c.fill(dark)
      c.fillStyle = mix(body, '#e8f4a0', 0.3)
      c.fill(light)
    } else if (cap === 'snow') {
      // kar: ışıkta tek tük parıltı
      const glit = new Path2D()
      for (let k = Math.floor(x0 / 6); k * 6 < x1; k++) {
        if (hash(k, ty, 58) > 0.3) continue
        const gx = k * 6 + hash(k, ty, 59) * 4
        if (gx < x0 + 1 || gx > x1 - 1) continue
        glit.moveTo(gx + 0.45, y + 2.2)
        glit.arc(gx, y + 2.2, 0.45, 0, Math.PI * 2)
      }
      c.fillStyle = 'rgba(255,255,255,0.95)'
      c.fill(glit)
    }
  }

  /**
   * Burç dişleri: taş silmenin hemen altında, mutlak kafese oturan sıra; dişler (açık, sol kenarı ışıklı) ve aralarındaki
   * mazgallar (koyu oyuk, içinde sağ yanı ışık alan tek kademe). Yürünen yüz düzdür: çizim örtünün altında kalır.
   */
  /**
   * Kütahya çinisi: taş silmenin hemen altında kare çini şeridi. Beyaz sır zemin, kobalt ve firuze sırayla, ortada kırmızı
   * lale beneği; sol üst köşede sır parıltısı. Kareler mutlak kafeste: koşu hangi hücrede kesilirse kesilsin aynı.
   */
  private cini(c: Ctx, x0: number, x1: number, y: number) {
    const P = 6
    const top = y + 3.2
    const h = 5.6
    const a = x0 + 1.5
    const b = x1 - 1.5
    if (b - a < 3) return
    c.fillStyle = '#f2ede0'
    c.fillRect(a, top, b - a, h)
    const cob = new Path2D()
    const tur = new Path2D()
    const dot = new Path2D()
    const glint = new Path2D()
    for (let k = Math.floor(a / P); k * P < b; k++) {
      const ka = Math.max(a, k * P + 0.7)
      const kb = Math.min(b, k * P + P - 0.7)
      if (kb - ka < 1.2) continue
      ;(k % 2 ? cob : tur).rect(ka, top + 0.7, kb - ka, h - 1.4)
      const cx = k * P + P / 2
      if (cx > a + 1 && cx < b - 1) {
        dot.ellipse(cx, top + h / 2, 1, 1.25, 0, 0, Math.PI * 2)
        glint.rect(ka + 0.4, top + 1, 1, 0.7)
      }
    }
    c.fillStyle = '#2f6fb4'
    c.fill(cob)
    c.fillStyle = '#3aa6b4'
    c.fill(tur)
    c.fillStyle = '#d4462e'
    c.fill(dot)
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.fill(glint)
    // şeridin altında ince koyu derz: taşa oturmuş dursun
    c.strokeStyle = 'rgba(40,26,30,0.35)'
    c.lineWidth = 0.6
    c.beginPath()
    c.moveTo(a, top + h + 0.3)
    c.lineTo(b, top + h + 0.3)
    c.stroke()
  }

  private merlons(c: Ctx, x0: number, x1: number, y: number, s: Pal) {
    const P = 16
    const hole = new Path2D()
    const face = new Path2D()
    const lit = new Path2D()
    const sill = new Path2D()
    const top = y + 3
    const bot = y + 11
    for (let k = Math.floor(x0 / P) - 1; k * P < x1; k++) {
      const ma = k * P + 3
      const ha = ma + 9
      const hb = ma + P
      // diş
      const fa = Math.max(ma, x0)
      const fb = Math.min(ha, x1)
      if (fb - fa > 1.5) {
        face.rect(fa, top, fb - fa, bot - top)
        if (fa === ma) {
          lit.moveTo(fa + 0.5, top)
          lit.lineTo(fa + 0.5, bot - 0.5)
        }
      }
      // mazgal: yalnız koşunun içinde tam kalanı
      if (ha < x0 + 1.5 || hb > x1 - 1.5) continue
      hole.roundRect(ha + 0.3, top, hb - ha - 0.6, bot - top - 0.4, [0, 0, 1.2, 1.2])
      sill.moveTo(ha + 1, bot - 1)
      sill.lineTo(hb - 1, bot - 1)
      sill.moveTo(hb - 1, top + 1)
      sill.lineTo(hb - 1, bot - 1.2)
    }
    c.fillStyle = mix(s.tile, s.tileLight, 0.45)
    c.fill(face)
    c.strokeStyle = 'rgba(255,244,214,0.5)'
    c.lineWidth = 0.6
    c.stroke(lit)
    c.fillStyle = mix(s.tileDark, '#1c1226', 0.35)
    c.fill(hole)
    c.strokeStyle = 'rgba(26,14,36,0.55)'
    c.lineWidth = 0.55
    c.stroke(hole)
    c.strokeStyle = mix(s.tile, s.tileDark, 0.25)
    c.lineWidth = 0.6
    c.stroke(sill)
    // diş sırasının altında ince silme çizgisi
    c.strokeStyle = 'rgba(26,14,36,0.35)'
    c.lineWidth = 0.6
    c.beginPath()
    wline(c, x0 + 0.5, bot + 0.3, x1 - 0.5, bot + 0.3, 0.2, 44)
    c.stroke()
  }

  private plank(c: Ctx, x: number, y: number, left: boolean, right: boolean, color: string, tx: number) {
    const dark = mix(color, '#1a0e14', 0.45)
    // dirsekler
    c.fillStyle = dark
    c.strokeStyle = INK
    c.lineWidth = 0.9
    if (left) {
      c.beginPath()
      c.moveTo(x + 1, y + 5)
      c.lineTo(x + 6, y + 5)
      c.lineTo(x + 1.6, y + 10)
      c.closePath()
      c.fill()
      c.stroke()
    }
    if (right) {
      c.beginPath()
      c.moveTo(x + T - 1, y + 5)
      c.lineTo(x + T - 6, y + 5)
      c.lineTo(x + T - 1.6, y + 10)
      c.closePath()
      c.fill()
      c.stroke()
    }
    c.fillStyle = color
    c.fillRect(x - 0.05, y + 0.4, T + 0.1, 5)
    c.fillStyle = mix(color, '#fff0d0', 0.35)
    c.fillRect(x - 0.05, y + 0.4, T + 0.1, 1.2)
    c.fillStyle = dark
    c.fillRect(x - 0.05, y + 4.4, T + 0.1, 1)
    // ahşabın damarı
    c.strokeStyle = 'rgba(26,14,20,0.22)'
    c.lineWidth = 0.45
    c.beginPath()
    wline(c, x, y + 2.9, x + T, y + 2.9, 0.5, 53)
    c.stroke()
    c.strokeStyle = INK
    c.lineWidth = 1
    c.beginPath()
    wline(c, x - 0.2, y + 0.4, x + T + 0.2, y + 0.4, 0.25, 51)
    wline(c, x - 0.2, y + 5.5, x + T + 0.2, y + 5.5, 0.25, 52)
    if (left) {
      c.moveTo(x + 0.4, y + 0.4)
      c.lineTo(x + 0.4, y + 5.5)
    }
    if (right) {
      c.moveTo(x + T - 0.4, y + 0.4)
      c.lineTo(x + T - 0.4, y + 5.5)
    }
    c.stroke()
    // tahta derzi ve çivi
    c.strokeStyle = 'rgba(26,14,20,0.5)'
    c.lineWidth = 0.6
    c.beginPath()
    const jx = x + (tx % 2 ? 10 : 5)
    c.moveTo(jx, y + 1)
    c.lineTo(jx + 0.3, y + 5)
    c.stroke()
    c.fillStyle = 'rgba(255,240,210,0.7)'
    c.beginPath()
    c.arc(x + 2.6, y + 2.8, 0.55, 0, Math.PI * 2)
    c.arc(x + 13.2, y + 2.8, 0.55, 0, Math.PI * 2)
    c.fill()
  }

  private spikes(c: Ctx, x: number, y: number, up: boolean, col: [string, string], tx: number) {
    c.lineWidth = 0.9
    for (let i = 0; i < 2; i++) {
      const sx = x + i * 8
      const lean = (hash(tx, i, 61) - 0.5) * 1.4
      c.beginPath()
      if (up) {
        c.moveTo(sx + 0.6, y + T)
        c.lineTo(sx + 4 + lean, y + 8.4)
        c.lineTo(sx + 7.4, y + T)
      } else {
        c.moveTo(sx + 0.6, y)
        c.lineTo(sx + 4 + lean, y + 7.6)
        c.lineTo(sx + 7.4, y)
      }
      c.closePath()
      c.fillStyle = col[1]
      c.fill()
      c.strokeStyle = INK
      c.stroke()
      // ışıklı yüz
      c.beginPath()
      if (up) {
        c.moveTo(sx + 1.6, y + T - 0.5)
        c.lineTo(sx + 4 + lean, y + 9.6)
        c.lineTo(sx + 3.6, y + T - 0.5)
      } else {
        c.moveTo(sx + 1.6, y + 0.5)
        c.lineTo(sx + 4 + lean, y + 6.4)
        c.lineTo(sx + 3.6, y + 0.5)
      }
      c.closePath()
      c.fillStyle = col[0]
      c.fill()
      // renk körü: her dikenin ucuna açık nokta (renkten bağımsız ikinci işaret)
      if (cb.mode !== 'yok') {
        c.beginPath()
        c.arc(sx + 4 + lean, up ? y + 9.4 : y + 6.6, 0.9, 0, Math.PI * 2)
        c.fillStyle = '#fff8e0'
        c.fill()
      }
    }
  }
}

/** parça tuvalinin kenar payı (dünya pikseli): dış hat ve çimen taşsın */
const MARGIN = 4
