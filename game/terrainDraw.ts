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
import { CRUMBLE, EMPTY, FAKE, ICE, ONEWAY, SOLID, SPIKE_DOWN, SPIKE_UP, TURRET, WET, type World } from './sim'
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

type Material = 'brick' | 'ashlar' | 'cyclop' | 'strata' | 'earth' | 'rock'
type Cap = 'stone' | 'grass' | 'snow'

const LOOK: Record<CityKey, { mat: Material; cap: Cap }> = {
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
  bayburt: { mat: 'rock', cap: 'snow' },
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

/** dışbükey köşelerin yenmişliği (dünya pikseli): kütle, örtü ve dış hat aynı yarıçapı kullanır */
const NIB = 2
/** derinlik gölgesinin küçük tuvali: karo başına bir piksel, büyütülerek basılır (yumuşak geçiş) */
let SCRATCH: HTMLCanvasElement | null = null

/** örgü ölçüleri: taş boyu, derz payı, sıra dalgası (boyu wl, yüksekliği jy), yan derzin yatması (lean), köşe yarıçapı, bölünme ve kırık köşe sıklığı */
const MASON = {
  brick: { bw: 16, bh: 8, wj: 0.14, wl: 13, jy: 0.3, lean: 0.3, r: 0.8, gap: 0.6, half: true, split: 0.1, chip: 0.1, tone: [0.2, 0.38, 0.5, 0.68, 0.8, 0.92] },
  ashlar: { bw: 30, bh: 16, wj: 0.42, wl: 13, jy: 0.4, lean: 0.45, r: 1.2, gap: 0.7, half: false, split: 0.2, chip: 0.14, tone: [0.38, 0.6, 0.68, 0.84, 0.9, 0.95] },
  cyclop: { bw: 21, bh: 15, wj: 0.5, wl: 13, jy: 2.4, lean: 3, r: 2.8, gap: 0.85, half: false, split: 0.14, chip: 0.2, tone: [0.24, 0.44, 0.54, 0.72, 0.82, 0.91] },
  rock: { bw: 34, bh: 23, wj: 0.5, wl: 40, jy: 1.5, lean: 5, r: 1.5, gap: 0.45, half: false, split: 0.22, chip: 0.25, tone: [0.34, 0.54, 0.62, 0.82, 0.9, 0.95] },
}

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

  constructor(
    private readonly w: World,
    private readonly city: CityKey,
    /** bir dünya pikseli kaç ekran pikseli */
    private readonly scale: number,
  ) {
    this.rows = w.rows + BELOW
    const base = (tx: number, ty: number) => {
      const t = w.tile(tx, ty)
      return t === SOLID || t === TURRET || t === ICE || t === WET
    }
    // haritanın altında her sütun son satırı gibi sürer: katı sütun taş olarak iner, çukur ve su açık kalır
    this.solid = (tx, ty) => base(tx, Math.min(ty, w.rows - 1))
    const st = CITY[city]
    const dk = hex(st.tileDark)
    this.deep = [Math.round(dk[0] * 0.35 + 21 * 0.65), Math.round(dk[1] * 0.35 + 12 * 0.65), Math.round(dk[2] * 0.35 + 32 * 0.65)]
    this.tones = [
      st.tile,
      mix(st.tile, st.tileLight, 0.35),
      mix(st.tile, st.tileLight, 0.7),
      mix(st.tile, st.tileDark, 0.3),
      mix(st.tile, st.tileDark, 0.55),
      mix(st.tile, st.tileLight, 0.2, '#c08a5c', 0.12),
      mix(st.tile, st.tileDark, 0.15, '#5c7ea0', 0.13),
    ]
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
        if (reach.has(k) || block(w.tile(x, y))) continue
        reach.add(k)
        st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
      }
    }
    flood(Math.floor((w.player.x + 6) / T), Math.floor((w.player.y + 6) / T))
    if (w.arrival) flood(Math.floor(w.arrival.x / T), Math.floor(w.arrival.y / T))
    for (let ty = 0; ty < w.rows; ty++)
      for (let tx = 0; tx < cols; tx++) {
        if (w.tile(tx, ty) !== FAKE) continue
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
            if (seen.has(k) || reach.has(k) || block(w.tile(x, y))) continue
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
        if (w.tile(tx, y) !== EMPTY || this.cave.has(y * w.cols + tx)) return false
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

  /** dışbükey köşe mi (dx, dy: köşenin baktığı yön): yalnız düz taşta; buz, ıslak taş ve tünel ağzı köşeli kalır */
  private nib(tx: number, ty: number, dx: number, dy: number): boolean {
    const w = this.w
    if (ty <= 0 || tx <= 0 || tx >= w.cols - 1 || w.tile(tx, ty) !== SOLID) return false
    if (this.solid(tx + dx, ty) || this.solid(tx, ty + dy)) return false
    return !this.cave.has(ty * w.cols + tx + dx) && !this.cave.has((ty + dy) * w.cols + tx)
  }

  /** karonun derinlik gölgesi (0..1): yüzeye değen karoda sıfır, içeri girdikçe koyulaşır; hafif, konuma bağlı dalgalanır */
  private dark(tx: number, ty: number): number {
    const x = Math.min(Math.max(tx, 0), this.w.cols - 1)
    const y = Math.min(Math.max(ty, 0), this.rows - 1)
    const d = this.depth[y * this.w.cols + x] / 5
    if (d <= 1) return 0
    return Math.min(0.56, (d - 1) * 0.12 + hash(tx >> 1, ty >> 1, 91) * 0.05)
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
    let any = false
    for (let j = 0; j < m; j++)
      for (let i = 0; i < n; i++) {
        const a = this.dark(tx0 + i, r0 + j)
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
    const look = LOOK[this.city]
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
        if (solid(tx, ty) && w.tile(tx, ty) !== ICE) {
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
      // derz: taşların arasından görünen koyu harç
      c.fillStyle = mix(s.tileDark, '#1c1226', 0.28)
      c.fillRect(tx0 * T, r0 * T, (tx1 - tx0 + 1) * T, (r1 - r0) * T)
      // malzeme yalnız hücrenin kendi şeridine (ve dış hat payına) çizilir: konumdan türediği için komşu hücreyle birebir oturur
      const mx0 = (tx0 + 1) * T - MARGIN - 1
      const mx1 = tx1 * T + MARGIN + 1
      const my0 = ty0 * T - MARGIN - 1
      const my1 = (ty1 + 1) * T + MARGIN + 1
      if (look.mat === 'strata' || look.mat === 'earth') this.strata(c, look.mat, mx0, mx1, my0, my1)
      else this.masonry(c, look.mat, mx0, mx1, my0, my1)

      // yüzeyin yaşanmışlığı: örtünün altından sarkan yosun, kök, akıntı izi, liken, çatlağa dolmuş kar
      const patch = new Path2D()
      const fleck = new Path2D()
      const line = new Path2D()
      for (let ty = r0; ty < r1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || solid(tx, ty - 1) || ty === 0 || w.tile(tx, ty) !== SOLID) continue
          this.dress(look.cap, look.mat, tx, ty, patch, fleck, line)
        }
      if (look.cap === 'grass') {
        c.fillStyle = mix(mix(s.tileTop, '#3f7a3a', 0.4), s.tileDark, 0.3)
        c.globalAlpha = 0.6
        c.fill(patch)
        c.globalAlpha = 0.55
        c.strokeStyle = mix(s.tileDark, '#20120c', 0.45)
        c.lineWidth = 0.6
        c.stroke(line)
      } else if (look.cap === 'stone') {
        c.strokeStyle = 'rgba(22,12,34,0.13)'
        c.lineWidth = 1.1
        c.stroke(line)
        c.fillStyle = mix(s.tileLight, '#dadcb4', 0.5)
        c.globalAlpha = 0.42
        c.fill(fleck)
      } else {
        c.strokeStyle = '#f4f9ff'
        c.globalAlpha = 0.6
        c.lineWidth = 0.9
        c.stroke(line)
      }
      c.globalAlpha = 1

      this.shade(c, tx0, tx1, r0, r1)

      // ışık sol üstten, tek kademe: sola bakan açık yüzler aydınlanır, sağa bakanlar ve çıkıntı altları gölgelenir
      const lit = new Path2D()
      const dim = new Path2D()
      const hatch = new Path2D()
      for (let ty = r0; ty < r1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || w.tile(tx, ty) === ICE) continue
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
            // alt yüzde çapraz tarama
            for (let k = 0; k < 5; k++) {
              const hx = x + k * 3.4 + hash(tx, ty, k) * 1.2
              hatch.moveTo(hx, y + T - 0.6)
              hatch.lineTo(hx + 2.6, y + T - 4 - hash(tx, ty, k + 9) * 2)
            }
          }
        }
      c.fillStyle = 'rgba(255,238,205,0.2)'
      c.fill(lit)
      c.fillStyle = 'rgba(22,12,34,0.27)'
      c.fill(dim)
      c.strokeStyle = 'rgba(22,12,34,0.36)'
      c.lineWidth = 0.6
      c.stroke(hatch)
    }
    c.restore()

    // ── ıslak taş: aynı örgü, üstünde su parıltısı (kaygan olduğu okunmalı)
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (w.tile(tx, ty) !== WET) continue
        const x = tx * T
        const y = ty * T
        c.fillStyle = 'rgba(90,150,200,0.26)'
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
        if (w.tile(tx, ty) !== ICE) continue
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
        const open = tx <= tx1 && solid(tx, ty) && !solid(tx, ty - 1) && w.tile(tx, ty - 1) !== CRUMBLE && ty > 0
        // buz ve ıslak taş kendi örtüsünü taşır: koşu malzeme değişince bölünür
        const t = open ? (w.tile(tx, ty) === ICE ? ICE : w.tile(tx, ty) === WET ? WET : SOLID) : EMPTY
        if (run >= 0 && t !== kind) {
          this.cap(c, look.cap, kind, run, tx - 1, ty, this.nib(run, ty, -1, -1) ? NIB : 0, this.nib(tx - 1, ty, 1, -1) ? NIB : 0)
          run = -1
        }
        if (open && run < 0) {
          run = tx
          kind = t
        }
      }
    }

    // ── 4. mürekkep dış hat: kenar koşuları tek fırça darbesiyle; dışbükey köşeler yenmiş köşeyi izler
    c.strokeStyle = INK
    c.lineWidth = 1.25
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

    // ── 5. tahta iskele, diken, ok tuzağı yüzü
    for (let ty = r0; ty < r1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        if (t === ONEWAY) this.plank(c, x, y, w.tile(tx - 1, ty) !== ONEWAY, w.tile(tx + 1, ty) !== ONEWAY, s.plank, tx)
        else if (t === SPIKE_UP || t === SPIKE_DOWN) this.spikes(c, x, y, t === SPIKE_UP, s.spike, tx)
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
  private masonry(c: Ctx, mat: Exclude<Material, 'strata' | 'earth'>, x0: number, x1: number, y0: number, y1: number) {
    const P = MASON[mat]
    const fills = this.tones.map(() => new Path2D())
    const lit = new Path2D()
    const dim = new Path2D()
    const mark = new Path2D()
    const glint = new Path2D()
    const facet = new Path2D()
    const hollow = new Path2D()
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
      c.fillStyle = this.tones[t]
      c.fill(fills[t])
    }
    c.fillStyle = 'rgba(255,240,212,0.085)'
    c.fill(facet)
    c.fillStyle = 'rgba(26,14,36,0.3)'
    c.fill(hollow)
    c.lineWidth = 0.7
    c.strokeStyle = 'rgba(255,238,205,0.26)'
    c.stroke(lit)
    c.strokeStyle = 'rgba(26,14,36,0.32)'
    c.stroke(dim)
    c.lineWidth = 0.5
    c.strokeStyle = 'rgba(26,14,36,0.4)'
    c.stroke(mark)
    c.strokeStyle = 'rgba(255,238,205,0.22)'
    c.stroke(glint)
  }

  /**
   * Katmanlı zemin (tüf, traverten, toprak): kalınlığı ve tonu sıradan sıraya değişen dalgalı tabakalar; aralarında koyu
   * dikiş ve altında ince ışık çizgisi. Tüfte tabaka boyunca uzanan oyuklar, toprakta gömülü çakıllar.
   */
  private strata(c: Ctx, mat: 'strata' | 'earth', x0: number, x1: number, y0: number, y1: number) {
    const s = CITY[this.city]
    const band = mat === 'strata' ? 10 : 13
    const STEP = 6
    const xa = Math.floor(x0 / STEP) * STEP
    const xb = Math.ceil(x1 / STEP) * STEP
    const lineY = (k: number, x: number) =>
      k * band + (hash(k, 3, 25) - 0.5) * band * 0.5 + Math.sin(x * 0.045 + k * 1.7) * 2.2 + Math.sin(x * 0.13 + k) * 0.9 + (lnoise(x / 9, k, 26) - 0.5) * 1.3
    const tones = [s.tile, mix(s.tile, s.tileLight, 0.5), mix(s.tile, s.tileDark, 0.38), mix(s.tile, s.tileLight, 0.22), mix(s.tile, s.tileDark, 0.18)]
    const seam = new Path2D()
    const glow = new Path2D()
    const bed = new Path2D()
    for (let k = Math.floor(y0 / band) - 2; (k - 1) * band < y1; k++) {
      c.fillStyle = tones[Math.floor(hash(k, 5, 27) * tones.length)]
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
    c.lineWidth = 0.6
    c.strokeStyle = 'rgba(30,16,36,0.34)'
    c.stroke(seam)
    c.strokeStyle = 'rgba(255,240,212,0.17)'
    c.stroke(glow)
    c.lineWidth = 0.5
    c.strokeStyle = 'rgba(30,16,36,0.14)'
    c.stroke(bed)

    // tüfte oyuklar (üstü gölgeli, alt dudağı ışıklı), toprakta çakıllar (üstü ışıklı, mürekkep hatlı)
    const body = new Path2D()
    const rim = new Path2D()
    const spark = new Path2D()
    for (let gx = Math.floor(x0 / 14) - 1; gx * 14 < x1; gx++)
      for (let gy = Math.floor(y0 / 14) - 1; gy * 14 < y1; gy++) {
        const r = hash(gx, gy, 21)
        if (r > (mat === 'strata' ? 0.2 : 0.26)) continue
        const px = gx * 14 + hash(gx, gy, 22) * 11
        const py = gy * 14 + hash(gx, gy, 23) * 11
        const big = hash(gx, gy, 24)
        if (mat === 'strata') {
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
    if (mat === 'strata') {
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
  private cap(c: Ctx, cap: Cap, kind: number, a: number, b: number, ty: number, ra: number, rb: number) {
    const s = CITY[this.city]
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
    // temas gölgesi: örtünün biçimi, biraz aşağıda (tek kademe)
    c.fillStyle = cap === 'snow' ? 'rgba(52,70,112,0.32)' : 'rgba(22,12,34,0.3)'
    outline(cap === 'stone' ? 1.5 : 1.9)
    c.fill()
    c.fillStyle = color
    outline(0)
    c.fill()
    // örtünün gölgede kalan alt yüzü ve ince alt hattı
    c.strokeStyle = cap === 'snow' ? 'rgba(150,178,214,0.75)' : mix(color, s.tileDark, cap === 'grass' ? 0.42 : 0.4)
    c.lineWidth = cap === 'snow' ? 1.2 : 0.95
    c.beginPath()
    c.moveTo(xs[xs.length - 1], y + ys[ys.length - 1] - 0.55)
    under(c, -0.55)
    c.stroke()
    c.strokeStyle = cap === 'snow' ? 'rgba(96,122,168,0.55)' : 'rgba(26,14,36,0.5)'
    c.lineWidth = 0.5
    c.beginPath()
    c.moveTo(xs[xs.length - 1], y + ys[ys.length - 1])
    under(c, 0)
    c.stroke()
    if (cap === 'stone') {
      // kapak taşlarının derzi: koyu çizgi, sağında ince ışık
      const joint = new Path2D()
      const shine = new Path2D()
      for (let k = Math.floor(x0 / 11); k * 11 < x1; k++) {
        if (hash(k, ty, 45) < 0.22) continue
        const jx = k * 11 + hash(k, ty, 46) * 6
        if (jx < x0 + 2.5 || jx > x1 - 2.5) continue
        joint.moveTo(jx, y + 0.7)
        joint.lineTo(jx + (hash(k, ty, 47) - 0.5) * 0.8, y + 2.9)
        shine.moveTo(jx + 0.6, y + 1.1)
        shine.lineTo(jx + 0.6, y + 2.3)
      }
      c.strokeStyle = 'rgba(26,14,36,0.42)'
      c.lineWidth = 0.55
      c.stroke(joint)
      c.strokeStyle = 'rgba(255,248,230,0.4)'
      c.lineWidth = 0.45
      c.stroke(shine)
    }
    // yürünen kenar: parlak çizgi
    c.strokeStyle = cap === 'snow' ? '#ffffff' : cap === 'grass' ? mix(color, '#f4ffb8', 0.5) : mix(color, '#ffffff', 0.55)
    c.lineWidth = 0.8
    c.beginPath()
    wline(c, x0 + 0.8 + ra * 0.5, y + 1, x1 - 0.8 - rb * 0.5, y + 1, 0.2, 43)
    c.stroke()
    if (kind === WET) {
      // ıslak taş: örtünün üstünde su tabakası ve parıltılar (kaygan olduğu okunmalı)
      c.fillStyle = 'rgba(150,210,250,0.62)'
      c.fillRect(x0, y + 0.5, x1 - x0, 2.1)
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
    if (cap === 'grass') {
      // çimen: düzensiz boyda, alçak, kıvrık tutamlar (yana yatar), yeşile çalar. Dik, sivri ve açık renkli
      // çizgiler uzaktan diken gibi okunuyordu: tehlikeyle karışmasın. Tek tük minik çiçek.
      const blades = new Path2D()
      for (let k = Math.floor(x0 / 5.5); k * 5.5 < x1; k++) {
        const r = hash(k, ty, 44)
        const x = k * 5.5 + hash(k, ty, 50) * 3
        if (x < x0 + 2.5 || x > x1 - 2.5) continue
        if (r >= 0.42) {
          const hgt = 1 + (r - 0.42) * 3.2
          const n = r > 0.8 ? 3 : 2
          for (let m = 0; m < n; m++) {
            const dx = (m - (n - 1) / 2) * 0.9
            const lean = dx * 2.1 + (hash(k, ty, 51 + m) - 0.5) * 1.2
            blades.moveTo(x + dx, y + 0.8)
            blades.quadraticCurveTo(x + dx + lean * 0.3, y - hgt * 0.7, x + dx + lean, y - hgt * (m === 1 && n === 3 ? 1 : 0.78))
          }
        } else if (r < 0.06) {
          const hue = ['#fff3dc', '#ffd866', '#f4a8bc'][Math.floor(hash(k, ty, 54) * 3)]
          c.strokeStyle = mix(color, '#1e3a1a', 0.5)
          c.lineWidth = 0.5
          c.beginPath()
          c.moveTo(x, y + 0.6)
          c.lineTo(x + 0.3, y - 1.5)
          c.stroke()
          c.fillStyle = hue
          c.strokeStyle = INK
          c.lineWidth = 0.35
          c.beginPath()
          c.arc(x + 0.3, y - 2, 0.85, 0, Math.PI * 2)
          c.fill()
          c.stroke()
        }
      }
      c.strokeStyle = mix(mix(color, '#3f7a3a', 0.55), '#1e3a1a', 0.25)
      c.lineWidth = 0.7
      c.globalAlpha = 0.85
      c.stroke(blades)
      c.globalAlpha = 1
    }
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
    }
  }
}

/** parça tuvalinin kenar payı (dünya pikseli): dış hat ve çimen taşsın */
const MARGIN = 4
