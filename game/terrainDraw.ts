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
import { CRUMBLE, FAKE, ICE, ONEWAY, SOLID, SPIKE_DOWN, SPIKE_UP, TURRET, type World } from './sim'
import { T, type CityKey } from './types'

type Ctx = CanvasRenderingContext2D
const INK = '#241824'
const CHUNK = 8
const KEEP = 12

type Material = 'brick' | 'ashlar' | 'cyclop' | 'strata' | 'earth' | 'rock'
type Cap = 'stone' | 'grass' | 'snow'

const LOOK: Record<CityKey, { mat: Material; cap: Cap }> = {
  istanbul: { mat: 'brick', cap: 'stone' },
  kocaeli: { mat: 'brick', cap: 'grass' },
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
function mix(a: string, b: string, t: number): string {
  const x = hex(a)
  const y = hex(b)
  return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)},${Math.round(x[1] + (y[1] - x[1]) * t)},${Math.round(x[2] + (y[2] - x[2]) * t)})`
}

/** titrek çizgi: uçlar sabit, arası konuma bağlı küçük sapmalarla eğrilir */
function wobble(c: Ctx, x0: number, y0: number, x1: number, y1: number, amp: number, seed: number) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.max(1, Math.round(len / 9))
  const nx = -(y1 - y0) / (len || 1)
  const ny = (x1 - x0) / (len || 1)
  c.moveTo(x0, y0)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const tm = (i - 0.5) / n
    const o = (hash(Math.round(x0 + (x1 - x0) * tm), Math.round(y0 + (y1 - y0) * tm), seed) - 0.5) * 2 * amp
    c.quadraticCurveTo(x0 + (x1 - x0) * tm + nx * o, y0 + (y1 - y0) * tm + ny * o, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
  }
}

export class TerrainHD {
  private chunks = new Map<number, HTMLCanvasElement>()
  private order: number[] = []
  private readonly solid: (tx: number, ty: number) => boolean

  constructor(
    private readonly w: World,
    private readonly city: CityKey,
    /** bir dünya pikseli kaç ekran pikseli */
    private readonly scale: number,
  ) {
    this.solid = (tx, ty) => {
      const t = w.tile(tx, ty)
      return t === SOLID || t === TURRET || t === ICE || t === FAKE
    }
  }

  /** Görünen parçaları ana tuvale basar. camX/camY dünya pikseli (kesirli olabilir). */
  draw(c: Ctx, camX: number, camY: number, devW: number) {
    const sc = this.scale
    const first = Math.floor(camX / (CHUNK * T))
    const last = Math.floor((camX + devW / sc) / (CHUNK * T))
    for (let i = first; i <= last; i++) {
      if (i < 0 || i * CHUNK >= this.w.cols) continue
      const cv = this.chunk(i)
      c.drawImage(cv, Math.round((i * CHUNK * T - MARGIN - camX) * sc), Math.round((-MARGIN - camY) * sc))
    }
    // yürünen yöndeki komşuyu boş karede hazırla: yeni parça görünürken takılma olmasın
    for (const i of [last + 1, first - 1]) {
      if (i >= 0 && i * CHUNK < this.w.cols && !this.chunks.has(i)) {
        this.chunk(i)
        break
      }
    }
  }

  private chunk(i: number): HTMLCanvasElement {
    const hit = this.chunks.get(i)
    if (hit) {
      const k = this.order.indexOf(i)
      if (k >= 0) this.order.splice(k, 1)
      this.order.push(i)
      return hit
    }
    const cv = document.createElement('canvas')
    cv.width = Math.ceil((CHUNK * T + MARGIN * 2) * this.scale)
    cv.height = Math.ceil((this.w.rows * T + MARGIN * 2) * this.scale)
    const c = cv.getContext('2d')!
    c.scale(this.scale, this.scale)
    c.translate(MARGIN - i * CHUNK * T, MARGIN)
    this.paint(c, i * CHUNK - 1, i * CHUNK + CHUNK)
    this.chunks.set(i, cv)
    this.order.push(i)
    while (this.order.length > KEEP) this.chunks.delete(this.order.shift()!)
    return cv
  }

  /** tx0..tx1 (uçlar dahil) sütunlarını çizer; komşu birer sütun taşma payıdır */
  private paint(c: Ctx, tx0: number, tx1: number) {
    const w = this.w
    const s = CITY[this.city]
    const look = LOOK[this.city]
    const rows = w.rows
    const solid = this.solid
    c.lineCap = 'round'
    c.lineJoin = 'round'

    // ── 1. kütle + malzeme (katı bölgeye kırpılır)
    c.save()
    c.beginPath()
    let any = false
    for (let ty = 0; ty < rows; ty++)
      for (let tx = tx0; tx <= tx1; tx++)
        if (solid(tx, ty) && w.tile(tx, ty) !== ICE) {
          c.rect(tx * T - 0.05, ty * T - 0.05, T + 0.1, T + 0.1)
          any = true
        }
    if (any) {
      c.clip()
      c.fillStyle = mix(s.tileDark, s.tile, 0.35)
      c.fillRect(tx0 * T, 0, (tx1 - tx0 + 1) * T, rows * T)
      this.material(c, look.mat, tx0 * T, (tx1 + 1) * T, rows * T)
      // derinlik: yüzeyden aşağı indikçe yumuşakça kararır
      for (let tx = tx0; tx <= tx1; tx++) {
        let depth = 0
        for (let ty = 0; ty < rows; ty++) {
          if (!solid(tx, ty)) {
            depth = 0
            continue
          }
          const a0 = Math.min(0.5, depth * 0.085)
          const a1 = Math.min(0.5, (depth + 1) * 0.085)
          const g = c.createLinearGradient(0, ty * T, 0, ty * T + T)
          g.addColorStop(0, `rgba(22,12,34,${a0.toFixed(3)})`)
          g.addColorStop(1, `rgba(22,12,34,${a1.toFixed(3)})`)
          c.fillStyle = g
          c.fillRect(tx * T, ty * T, T, T)
          depth++
        }
      }
      // ışık sol üstten: sola bakan açık yüzler aydınlanır, sağa bakanlar gölgelenir
      for (let ty = 0; ty < rows; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          if (!solid(tx, ty) || w.tile(tx, ty) === ICE) continue
          if (!solid(tx - 1, ty)) {
            const g = c.createLinearGradient(tx * T, 0, tx * T + 5, 0)
            g.addColorStop(0, 'rgba(255,236,200,0.2)')
            g.addColorStop(1, 'rgba(255,236,200,0)')
            c.fillStyle = g
            c.fillRect(tx * T, ty * T, 5, T)
          }
          if (!solid(tx + 1, ty)) {
            const g = c.createLinearGradient(tx * T + T - 6, 0, tx * T + T, 0)
            g.addColorStop(0, 'rgba(22,12,34,0)')
            g.addColorStop(1, 'rgba(22,12,34,0.3)')
            c.fillStyle = g
            c.fillRect(tx * T + T - 6, ty * T, 6, T)
          }
          // çıkıntının alt yüzü: çapraz tarama
          if (!solid(tx, ty + 1) && ty < rows - 1) {
            c.strokeStyle = 'rgba(22,12,34,0.38)'
            c.lineWidth = 0.6
            c.beginPath()
            for (let k = 0; k < 5; k++) {
              const hx = tx * T + k * 3.4 + hash(tx, ty, k) * 1.2
              c.moveTo(hx, ty * T + T - 0.6)
              c.lineTo(hx + 2.6, ty * T + T - 4 - hash(tx, ty, k + 9) * 2)
            }
            c.stroke()
          }
        }
    }
    c.restore()

    // ── 2. buz: ayrı malzeme, mavi mürekkep
    for (let ty = 0; ty < rows; ty++)
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
          wobble(c, x + 3, y + 13, x + 11, y + 6, 1.2, 5)
          c.stroke()
        }
      }

    // ── 3. üst örtü: açık üst yüzlerin koşusu boyunca
    for (let ty = 0; ty < rows; ty++) {
      let run = -1
      for (let tx = tx0; tx <= tx1 + 1; tx++) {
        const open = tx <= tx1 && solid(tx, ty) && !solid(tx, ty - 1) && w.tile(tx, ty - 1) !== CRUMBLE && ty > 0
        if (open && run < 0) run = tx
        if (!open && run >= 0) {
          this.cap(c, look.cap, w.tile(run, ty) === ICE, run, tx - 1, ty, s.tileTop)
          run = -1
        }
      }
    }

    // ── 4. mürekkep dış hat: kenar koşuları tek fırça darbesiyle
    c.strokeStyle = INK
    c.lineWidth = 1.25
    c.beginPath()
    for (let ty = 0; ty <= rows; ty++) {
      for (const side of [0, 1]) {
        // side 0: üst kenar (katının üstü boş), side 1: alt kenar
        let run = -1
        for (let tx = tx0; tx <= tx1 + 1; tx++) {
          const edge = tx <= tx1 && (side === 0 ? solid(tx, ty) && !solid(tx, ty - 1) : solid(tx, ty - 1) && !solid(tx, ty)) && ty > 0 && ty < rows
          if (edge && run < 0) run = tx
          if (!edge && run >= 0) {
            wobble(c, run * T - 0.4, ty * T, tx * T + 0.4, ty * T, 0.45, 11 + side)
            run = -1
          }
        }
      }
    }
    for (let tx = tx0; tx <= tx1 + 1; tx++) {
      for (const side of [0, 1]) {
        let run = -1
        for (let ty = 0; ty <= rows; ty++) {
          const edge = ty < rows && (side === 0 ? solid(tx, ty) && !solid(tx - 1, ty) : solid(tx - 1, ty) && !solid(tx, ty)) && tx > 0 && tx < w.cols
          if (edge && run < 0) run = ty
          if (!edge && run >= 0) {
            wobble(c, tx * T, run * T - 0.4, tx * T, ty * T + 0.4, 0.45, 13 + side)
            run = -1
          }
        }
      }
    }
    c.stroke()

    // ── 5. tahta iskele, diken, sahte duvar çatlağı, ok tuzağı yüzü
    for (let ty = 0; ty < rows; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        if (t === ONEWAY) this.plank(c, x, y, w.tile(tx - 1, ty) !== ONEWAY, w.tile(tx + 1, ty) !== ONEWAY, s.plank, tx)
        else if (t === SPIKE_UP || t === SPIKE_DOWN) this.spikes(c, x, y, t === SPIKE_UP, s.spike, tx)
        else if (t === FAKE) {
          // dikkatli bakan görür: ince bir çatlak
          c.strokeStyle = 'rgba(22,12,34,0.42)'
          c.lineWidth = 0.6
          c.beginPath()
          wobble(c, x + 6, y + 3, x + 8.5, y + 10, 1, 3)
          c.stroke()
        } else if (t === TURRET) {
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

  /** Taş örgüsü: sarsak dörtgenler (tuğla, kesme taş, kiklop, kaya) ya da dalgalı katmanlar (tüf, toprak). */
  private material(c: Ctx, mat: Material, x0: number, x1: number, h: number) {
    const s = CITY[this.city]
    if (mat === 'strata' || mat === 'earth') {
      const band = mat === 'strata' ? 11 : 14
      for (let y = -band; y < h + band; y += band) {
        const row = Math.round(y / band)
        const tone = [s.tile, mix(s.tile, s.tileLight, 0.55), mix(s.tile, s.tileDark, 0.4)][((row % 3) + 3) % 3]
        c.fillStyle = tone
        c.beginPath()
        c.moveTo(x0 - 2, y + band + 2)
        for (let x = x0 - 2; x <= x1 + 6; x += 6) c.lineTo(x, y + Math.sin(x * 0.045 + row * 1.7) * 2.2 + Math.sin(x * 0.13 + row) * 0.9)
        c.lineTo(x1 + 6, y + band + 2)
        c.closePath()
        c.fill()
        c.strokeStyle = 'rgba(30,16,36,0.3)'
        c.lineWidth = 0.55
        c.beginPath()
        for (let x = x0 - 2; x <= x1 + 6; x += 6) {
          const yy = y + Math.sin(x * 0.045 + row * 1.7) * 2.2 + Math.sin(x * 0.13 + row) * 0.9
          if (x === x0 - 2) c.moveTo(x, yy)
          else c.lineTo(x, yy)
        }
        c.stroke()
      }
      // tüfte oyuklar, toprakta çakıllar
      for (let gx = Math.floor(x0 / 13); gx * 13 < x1; gx++)
        for (let gy = 0; gy * 13 < h; gy++) {
          const r = hash(gx, gy, 21)
          if (r > 0.34) continue
          const px = gx * 13 + hash(gx, gy, 22) * 10
          const py = gy * 13 + hash(gx, gy, 23) * 10
          const rad = 0.9 + hash(gx, gy, 24) * (mat === 'strata' ? 1.8 : 1.2)
          c.fillStyle = mat === 'strata' ? 'rgba(40,22,40,0.34)' : mix(s.tileLight, '#ffffff', 0.12)
          c.beginPath()
          c.ellipse(px, py, rad * 1.25, rad, 0, 0, Math.PI * 2)
          c.fill()
          c.strokeStyle = 'rgba(30,16,36,0.4)'
          c.lineWidth = 0.45
          c.stroke()
        }
      return
    }
    // tuğla ve kesme taş şaşırtmalı dizilir; kiklop ve kaya sarsak bir ızgaradır (köşeler komşularla ortak)
    const P = {
      brick: { bw: 16, bh: 8, jit: 0.35, gap: 0.7, stagger: true },
      ashlar: { bw: 32, bh: 16, jit: 0.5, gap: 0.8, stagger: true },
      cyclop: { bw: 22, bh: 16, jit: 5, gap: 0.9, stagger: false },
      rock: { bw: 30, bh: 20, jit: 7, gap: 0.7, stagger: false },
    }[mat]
    const corner = (i: number, j: number, row = j): [number, number] => {
      const off = P.stagger && row % 2 ? P.bw / 2 : 0
      return [i * P.bw + off + (hash(i, j, 31 + (row === j ? 0 : 7)) - 0.5) * P.jit, j * P.bh + (hash(i, j, 32) - 0.5) * P.jit * 0.8]
    }
    const tones = [s.tile, mix(s.tile, s.tileLight, 0.5), mix(s.tile, s.tileDark, 0.35), mix(s.tile, s.tileLight, 0.25)]
    for (let j = -1; j * P.bh < h + P.bh; j++)
      for (let i = Math.floor(x0 / P.bw) - 1; i * P.bw < x1 + P.bw; i++) {
        const a = corner(i, j)
        const b = corner(i + 1, j)
        // alt köşeler: aynı sütun hizasında, bir alt sıranın yüksekliğinde
        const d = corner(i, j + 1, j)
        const e = corner(i + 1, j + 1, j)
        const g = P.gap
        c.fillStyle = tones[Math.floor(hash(i, j, 33) * tones.length)]
        c.beginPath()
        c.moveTo(a[0] + g, a[1] + g)
        c.lineTo(b[0] - g, b[1] + g)
        c.lineTo(e[0] - g, e[1] - g)
        c.lineTo(d[0] + g, d[1] - g)
        c.closePath()
        c.fill()
        // taşın ışık kenarı (üst + sol) ve gölge kenarı (alt + sağ)
        c.lineWidth = 0.7
        c.strokeStyle = 'rgba(255,238,205,0.22)'
        c.beginPath()
        c.moveTo(d[0] + g + 0.4, d[1] - g - 0.8)
        c.lineTo(a[0] + g + 0.4, a[1] + g + 0.4)
        c.lineTo(b[0] - g - 0.8, b[1] + g + 0.4)
        c.stroke()
        c.strokeStyle = 'rgba(26,14,36,0.3)'
        c.beginPath()
        c.moveTo(b[0] - g - 0.3, b[1] + g + 0.8)
        c.lineTo(e[0] - g - 0.3, e[1] - g - 0.3)
        c.lineTo(d[0] + g + 0.8, d[1] - g - 0.3)
        c.stroke()
        // yüzeyde keski izi ya da çatlak
        const r = hash(i, j, 34)
        if (r < 0.22) {
          c.strokeStyle = 'rgba(26,14,36,0.3)'
          c.lineWidth = 0.5
          c.beginPath()
          const px = a[0] + P.bw * (0.25 + hash(i, j, 35) * 0.4)
          const py = a[1] + P.bh * (0.3 + hash(i, j, 36) * 0.3)
          c.moveTo(px, py)
          c.lineTo(px + 2.4, py + 1.6)
          c.lineTo(px + 1.8, py + 3.6)
          c.stroke()
        } else if (r > 0.86 && P.bh > 10) {
          c.strokeStyle = 'rgba(255,238,205,0.2)'
          c.lineWidth = 0.5
          c.beginPath()
          for (let k = 0; k < 3; k++) {
            const px = a[0] + P.bw * 0.2 + k * 3
            c.moveTo(px, a[1] + P.bh * 0.35)
            c.lineTo(px + 2, a[1] + P.bh * 0.6)
          }
          c.stroke()
        }
      }
  }

  /** Üst örtü: taş silme, çimen ya da kar; alt kenarı dalgalı, üstünde titrek ışık çizgisi. */
  private cap(c: Ctx, cap: Cap, ice: boolean, a: number, b: number, ty: number, color: string) {
    const x0 = a * T
    const x1 = (b + 1) * T
    const y = ty * T
    if (ice) {
      c.strokeStyle = 'rgba(255,255,255,0.9)'
      c.lineWidth = 1.1
      c.beginPath()
      wobble(c, x0 + 0.5, y + 0.9, x1 - 0.5, y + 0.9, 0.25, 41)
      c.stroke()
      return
    }
    const depth = cap === 'stone' ? 2.6 : cap === 'grass' ? 3.6 : 4.4
    const top = cap === 'snow' ? '#f6fbff' : color
    c.fillStyle = top
    c.beginPath()
    c.moveTo(x0, y)
    c.lineTo(x1, y)
    for (let x = x1; x >= x0; x -= 2.5) {
      const k = cap === 'stone' ? 0.35 : cap === 'grass' ? 1.3 : 1.7
      c.lineTo(x, y + depth + (hash(Math.round(x), ty, 42) - 0.5) * 2 * k + (cap === 'snow' ? Math.sin(x * 0.5) * 0.8 : 0))
    }
    c.closePath()
    c.fill()
    // örtünün alt gölgesi
    c.strokeStyle = cap === 'snow' ? 'rgba(120,150,190,0.5)' : 'rgba(26,14,36,0.3)'
    c.lineWidth = 0.6
    c.beginPath()
    for (let x = x0; x <= x1; x += 2.5) {
      const k = cap === 'stone' ? 0.35 : cap === 'grass' ? 1.3 : 1.7
      const yy = y + depth + (hash(Math.round(x), ty, 42) - 0.5) * 2 * k + (cap === 'snow' ? Math.sin(x * 0.5) * 0.8 : 0) + 0.3
      if (x === x0) c.moveTo(x, yy)
      else c.lineTo(x, yy)
    }
    c.stroke()
    // üst ışık çizgisi
    c.strokeStyle = cap === 'snow' ? '#ffffff' : 'rgba(255,244,214,0.5)'
    c.lineWidth = 0.7
    c.beginPath()
    wobble(c, x0 + 1, y + 1, x1 - 1, y + 1, 0.2, 43)
    c.stroke()
    if (cap === 'grass') {
      // çimen tutamları: üst kenardan yukarı kısa fırça darbeleri
      c.strokeStyle = mix(top, '#1e3a1a', 0.35)
      c.lineWidth = 0.8
      c.beginPath()
      for (let x = x0 + 1.5; x < x1 - 1; x += 3.2) {
        const r = hash(Math.round(x * 3), ty, 44)
        if (r < 0.3) continue
        const hgt = 1.4 + r * 2.4
        c.moveTo(x, y + 0.6)
        c.quadraticCurveTo(x + (r - 0.6) * 1.6, y - hgt * 0.6, x + (r - 0.5) * 3, y - hgt)
      }
      c.stroke()
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
    c.strokeStyle = INK
    c.lineWidth = 1
    c.beginPath()
    wobble(c, x - 0.2, y + 0.4, x + T + 0.2, y + 0.4, 0.25, 51)
    wobble(c, x - 0.2, y + 5.5, x + T + 0.2, y + 5.5, 0.25, 52)
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
