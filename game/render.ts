import { CITY, ITEM_ART, LAYER_H, LAYER_W, buildLayers, disc, enemyArt, rect, rng, sprite, type Ctx, type Layers } from './art'
import { CHARACTERS, type CharacterDef } from './characters'
import { POSES, drawHero, gait, type Pose } from './heroDraw'
import { GHOST_HZ, type GhostRun } from './ghost'
import { NPC_ART } from './npcs'
import { BLOCK_A, BLOCK_B, CRUMBLE, DOOR, EMPTY, FAKE, ICE, ONEWAY, SOLID, SPIKE_DOWN, SPIKE_UP, TURRET, WATER, hammerState, type World } from './sim'
import { T, type CityKey, type GameEvent } from './types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  grav: number
}

interface Ghost {
  x: number
  y: number
  life: number
  flip: boolean
}

interface Ambient {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  size: number
}

const GROUND_Y = 20 * T

/** bayraktaki beş köşeli yıldız (5x5) */
const STAR = ['..#..', '..#..', '#####', '.###.', '.#.#.']

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: Ctx
  private buf: HTMLCanvasElement
  private b: Ctx
  private tilesLayer: HTMLCanvasElement | null = null
  private layers: Layers | null = null
  private city: CityKey = 'istanbul'
  private particles: Particle[] = []
  private ghosts: Ghost[] = []
  private ambient: Ambient[] = []
  private shake = 0
  private flash = 0
  scale = 4
  viewW = 320
  viewH = 180
  camX = 0
  camY = 0
  private t = 0
  character: CharacterDef = CHARACTERS.uktun
  /** en iyi koşunun hayaleti (yoksa null) */
  ghostRun: GhostRun | null = null
  /** sahnedeki yazıların dili */
  lang: 'tr' | 'en' = 'tr'
  /** yüzen kısa yazılar: kombo, duvar zinciri, +1 */
  private pops: Pop[] = []
  private stompChain = 0
  private wallChain = 0
  /** havadaki en yüksek düşüş hızı: sert inişte toz ve sarsıntı */
  private airVy = 0
  private idleT = 0
  /** bu karede çizilecek karakterler (hayalet, atılma izi, oyuncu): dünya tamponundan sonra ana tuvalde */
  private heroes: HeroDraw[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.buf = document.createElement('canvas')
    this.b = this.buf.getContext('2d')!
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const devW = Math.round(cssW * dpr)
    const devH = Math.round(cssH * dpr)
    this.canvas.width = devW
    this.canvas.height = devH
    const portrait = cssH > cssW
    // dikeyde ~13 tile genişlik, yatayda ~15 tile yükseklik
    const target = portrait ? Math.min(devW / (13 * T), devH / (20 * T)) : Math.min(devW / (20 * T), devH / (13 * T))
    // yatayda en yakın tam sayı: karakter masaüstünde de okunur kalsın
    this.scale = Math.max(1, portrait ? Math.floor(target) : Math.round(target))
    this.viewW = Math.ceil(devW / this.scale)
    this.viewH = Math.ceil(devH / this.scale)
    this.buf.width = this.viewW
    this.buf.height = this.viewH
  }

  setLevel(world: World) {
    this.city = world.level.city
    this.layers = buildLayers(this.city)
    this.tilesLayer = this.buildTiles(world)
    this.particles = []
    this.pops = []
    this.stompChain = 0
    this.wallChain = 0
    this.raised.clear()
    this.ghosts = []
    this.initAmbient()
    const p = world.player
    this.camX = p.x - this.viewW / 2
    this.camY = p.y - this.viewH / 2
    this.clampCam(world)
  }

  /** bayrak göndere çekildiği an (index → t) */
  private raised = new Map<number, number>()

  private skyCache: { key: string; cv: HTMLCanvasElement } | null = null

  private skyCanvas(sky: [string, string, string]) {
    const key = `${this.viewW}x${this.viewH}:${sky.join()}`
    if (this.skyCache?.key === key) return this.skyCache.cv
    const cv = document.createElement('canvas')
    cv.width = this.viewW
    cv.height = this.viewH
    const c = cv.getContext('2d')!
    const N = 12
    const at = (t: number) => (t < 0.6 ? mixHex(sky[0], sky[1], t / 0.6) : mixHex(sky[1], sky[2], (t - 0.6) / 0.4))
    const bands = Array.from({ length: N }, (_, i) => at(i / (N - 1)).match(/\d+/g)!.map(Number))
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    const img = c.createImageData(cv.width, cv.height)
    const d = img.data
    for (let y = 0; y < cv.height; y++) {
      const f = (y / Math.max(1, cv.height - 1)) * (N - 1)
      const i = Math.min(N - 2, Math.floor(f))
      const fr = f - i
      for (let x = 0; x < cv.width; x++) {
        const col = fr > (B4[y % 4][x % 4] + 0.5) / 16 ? bands[i + 1] : bands[i]
        const k = (y * cv.width + x) * 4
        d[k] = col[0]
        d[k + 1] = col[1]
        d[k + 2] = col[2]
        d[k + 3] = 255
      }
    }
    c.putImageData(img, 0, 0)
    this.skyCache = { key, cv }
    return cv
  }

  /* ── Statik tile katmanı ──────────────────────────────────── */
  private buildTiles(w: World): HTMLCanvasElement {
    const cv = document.createElement('canvas')
    cv.width = w.cols * T
    cv.height = w.rows * T
    const c = cv.getContext('2d')!
    const s = CITY[w.level.city]
    const r = rng(w.cols * 31 + w.rows)
    const solidish = (tx: number, ty: number) => {
      const t = w.tile(tx, ty)
      return t === SOLID || t === TURRET || t === ICE || t === FAKE
    }
    for (let ty = 0; ty < w.rows; ty++) {
      for (let tx = 0; tx < w.cols; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        const open = ty > 0 && !solidish(tx, ty - 1) && w.tile(tx, ty - 1) !== CRUMBLE
        if (t === SOLID || t === TURRET || t === FAKE) this.solidTile(c, x, y, ty, open, !solidish(tx - 1, ty), !solidish(tx + 1, ty), r)
        if (t === FAKE) {
          // dikkatli bakan görür: ince bir çatlak
          rect(c, x + 6, y + 4, 1, 3, 'rgba(0,0,0,0.25)')
          rect(c, x + 7, y + 7, 1, 2, 'rgba(0,0,0,0.25)')
        }
        if (t === TURRET) {
          rect(c, x + 2, y + 2, 12, 12, s.tileDark)
          rect(c, x + 3, y + 3, 10, 10, s.tile)
          rect(c, x + 3, y + 6, 10, 3, '#1a1420')
          // Hitit motifi
          rect(c, x + 6, y + 11, 4, 1, s.tileLight)
          rect(c, x + 7, y + 10, 2, 3, s.tileLight)
        }
        if (t === ICE) {
          rect(c, x, y, T, T, '#9fd6ee')
          rect(c, x, y + 10, T, 6, '#7cc0e0')
          rect(c, x + 2 + (tx % 3) * 3, y + 3, 5, 1, '#e6f8ff')
          rect(c, x + 8, y + 6, 4, 1, '#d2f0fc')
          if (open) rect(c, x, y, T, 2, '#f4fcff')
          rect(c, x, y + 15, T, 1, '#5aa0c4')
        }
        if (t === ONEWAY) {
          // tahta: üstte ışık, derz, çivi başları, altta gölge; uçlarda dirsek
          const left = w.tile(tx - 1, ty) !== ONEWAY
          const right = w.tile(tx + 1, ty) !== ONEWAY
          rect(c, x, y, T, 5, s.plank)
          rect(c, x, y, T, 1, lighten(s.plank))
          rect(c, x, y + 4, T, 1, 'rgba(0,0,0,0.4)')
          rect(c, x, y + 5, T, 2, 'rgba(0,0,0,0.18)')
          rect(c, x + (tx % 2 ? 9 : 4), y + 1, 1, 3, 'rgba(0,0,0,0.3)')
          rect(c, x + 2, y + 2, 1, 1, 'rgba(255,240,210,0.55)')
          rect(c, x + 13, y + 2, 1, 1, 'rgba(255,240,210,0.55)')
          if (left) {
            rect(c, x, y, 1, 5, 'rgba(0,0,0,0.35)')
            for (let k = 0; k < 4; k++) rect(c, x + 1, y + 5 + k, 4 - k, 1, s.plank)
          }
          if (right) {
            rect(c, x + T - 1, y, 1, 5, 'rgba(0,0,0,0.4)')
            for (let k = 0; k < 4; k++) rect(c, x + T - 5 + k, y + 5 + k, 4 - k, 1, s.plank)
          }
        }
        if (t === SPIKE_UP) {
          for (let i = 0; i < 2; i++) {
            const sx = x + i * 8
            for (let k = 0; k < 7; k++) rect(c, sx + 4 - Math.ceil(k / 2), y + 9 + k, Math.ceil(k / 2) * 2 || 1, 1, k < 2 ? s.spike[0] : s.spike[1])
            rect(c, sx + 3, y + 10, 1, 4, s.spike[0])
          }
        }
        if (t === SPIKE_DOWN) {
          for (let i = 0; i < 2; i++) {
            const sx = x + i * 8
            for (let k = 0; k < 7; k++) rect(c, sx + 4 - Math.ceil((6 - k) / 2), y + k, Math.ceil((6 - k) / 2) * 2 || 1, 1, k > 4 ? s.spike[0] : s.spike[1])
          }
        }
      }
    }
    // kabartma: her taş bloğunun üst ve sol kenarı ışık, alt ve sağ kenarı gölge alır
    {
      const dark = s.tileDark
      const dr = parseInt(dark.slice(1, 3), 16)
      const dg = parseInt(dark.slice(3, 5), 16)
      const db = parseInt(dark.slice(5, 7), 16)
      const img = c.getImageData(0, 0, cv.width, cv.height)
      const d = img.data
      const W2 = cv.width
      const isMortar = (i: number) => d[i] === dr && d[i + 1] === dg && d[i + 2] === db && d[i + 3] === 255
      const out = new Uint8ClampedArray(d)
      for (let y = 1; y < cv.height - 1; y++) {
        const ty = Math.floor(y / T)
        for (let x = 1; x < W2 - 1; x++) {
          if (!solidish(Math.floor(x / T), ty)) continue
          const i = (y * W2 + x) * 4
          if (d[i + 3] !== 255 || isMortar(i)) continue
          let k = 0
          if (isMortar(i - W2 * 4)) k += 0.16
          if (isMortar(i - 4)) k += 0.08
          if (isMortar(i + W2 * 4)) k -= 0.2
          if (isMortar(i + 4)) k -= 0.1
          if (!k) continue
          // ton kaydırma: ışık sıcağa, gölge mor-maviye
          const to = k > 0 ? [255, 240, 205] : [42, 26, 60]
          const a = Math.abs(k)
          out[i] = d[i] + (to[0] - d[i]) * a
          out[i + 1] = d[i + 1] + (to[1] - d[i + 1]) * a
          out[i + 2] = d[i + 2] + (to[2] - d[i + 2]) * a
        }
      }
      img.data.set(out)
      c.putImageData(img, 0, 0)
    }
    // derinlik: yüzeyden aşağı indikçe taş yumuşakça kararır (4 piksellik bantlarla)
    for (let tx = 0; tx < w.cols; tx++) {
      let depth = 0
      for (let ty = 0; ty < w.rows; ty++) {
        if (!solidish(tx, ty)) {
          // çıkıntının altına temas gölgesi
          if (depth > 0 && ty < w.rows) for (let k = 0; k < 3; k++) rect(c, tx * T, ty * T + k, T, 1, `rgba(10,6,20,${0.22 - k * 0.07})`)
          depth = 0
          continue
        }
        for (let band = 0; band < 4; band++) {
          const a = Math.min(0.46, (depth + band / 4) * 0.08)
          if (a > 0) rect(c, tx * T, ty * T + band * 4, T, 4, `rgba(14,9,26,${a.toFixed(3)})`)
        }
        depth++
      }
    }
    // okunurluk ve doku: açık kenarlara koyu kontur + arka plana gölge; şehre göre çatlak, çakıl, yosun
    const green = this.city === 'ordu' || this.city === 'trabzon' || this.city === 'kocaeli'
    for (let ty = 0; ty < w.rows; ty++)
      for (let tx = 0; tx < w.cols; tx++) {
        const t = w.tile(tx, ty)
        if (t !== SOLID && t !== TURRET && t !== FAKE) continue
        const x = tx * T
        const y = ty * T
        const up = ty > 0 && !solidish(tx, ty - 1) && w.tile(tx, ty - 1) === 0
        const L = tx > 0 && w.tile(tx - 1, ty) === 0
        const R = tx < w.cols - 1 && w.tile(tx + 1, ty) === 0
        if (up) rect(c, x, y - 1, T, 1, 'rgba(18,10,30,0.42)')
        if (L) {
          rect(c, x, y, 1, T, 'rgba(18,10,30,0.4)')
          for (let k = 1; k <= 3; k++) rect(c, x - k, y, 1, T, `rgba(14,8,26,${(0.16 - k * 0.04).toFixed(2)})`)
        }
        if (R) {
          rect(c, x + T - 1, y, 1, T, 'rgba(18,10,30,0.5)')
          for (let k = 0; k < 3; k++) rect(c, x + T + k, y, 1, T, `rgba(14,8,26,${(0.18 - k * 0.05).toFixed(2)})`)
        }
        const roll = r()
        if (roll < 0.1) {
          // ince çatlak: iki üç piksel, kırık çizgi
          const cx2 = x + 3 + Math.floor(r() * 9)
          const cy2 = y + 4 + Math.floor(r() * 7)
          rect(c, cx2, cy2, 1, 2, 'rgba(10,6,20,0.35)')
          rect(c, cx2 + 1, cy2 + 2, 1, 2, 'rgba(10,6,20,0.3)')
          rect(c, cx2 + 1, cy2, 1, 1, 'rgba(255,240,210,0.18)')
        } else if (roll < 0.18) {
          // çakıl: ışıklı üst, gölgeli alt
          const px2 = x + 2 + Math.floor(r() * 11)
          const py2 = y + 3 + Math.floor(r() * 10)
          rect(c, px2, py2, 2, 1, 'rgba(255,240,210,0.22)')
          rect(c, px2, py2 + 1, 2, 1, 'rgba(10,6,20,0.25)')
        }
        if (green && up && r() < 0.55) {
          // yosun: üst kenardan sarkan yeşil uçlar
          for (let k = 0; k < 3; k++) {
            const mx = x + Math.floor(r() * 15)
            rect(c, mx, y + 1, 1, 1 + Math.floor(r() * 3), k % 2 ? '#4a8a3a' : '#3a6e30')
          }
        }
      }
    return cv
  }

  private solidTile(c: Ctx, x: number, y: number, ty: number, open: boolean, openL: boolean, openR: boolean, r: () => number) {
    const s = CITY[this.city]
    rect(c, x, y, T, T, s.tile)
    switch (this.city) {
      case 'istanbul': {
        // tuğla örgü
        const off = ty % 2 ? 4 : 0
        for (let by = 0; by < 16; by += 4) {
          rect(c, x, y + by + 3, T, 1, s.tileDark)
          const o = (by / 4) % 2 ? off : 4 - off
          for (let bx = o; bx < 16; bx += 8) rect(c, x + bx, y + by, 1, 3, s.tileDark)
        }
        if (r() > 0.85) rect(c, x + 2 + Math.floor(r() * 8), y + 5, 4, 2, s.tileLight)
        if (open) {
          rect(c, x, y, T, 4, s.tileTop)
          rect(c, x, y + 4, T, 1, s.tileDark)
          for (let i = 0; i < 16; i += 4) rect(c, x + i, y + 1, 1, 2, s.tileLight)
        }
        break
      }
      case 'kocaeli': {
        // fabrika tuğlası: koyu kırmızı, ince derz
        const off = ty % 2 ? 4 : 0
        for (let by = 0; by < 16; by += 4) {
          rect(c, x, y + by + 3, T, 1, s.tileDark)
          const o = (by / 4) % 2 ? off : 4 - off
          for (let bx = o; bx < 16; bx += 8) rect(c, x + bx, y + by, 1, 3, s.tileDark)
        }
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          rect(c, x, y + 3, T, 1, s.tileDark)
        }
        break
      }
      case 'adana': {
        // Taşköprü'nün kesme taşı
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 5 : 11), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 12 : 3), y + 8, 1, 8, s.tileDark)
        rect(c, x + 1, y + 1, 5, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          rect(c, x, y + 3, T, 1, s.tileDark)
        }
        break
      }
      case 'izmir': {
        // Kordon taşı: iri dikdörtgen kaplama
        rect(c, x, y + 8, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 6 : 12), y, 1, 8, s.tileDark)
        rect(c, x + (ty % 2 ? 13 : 4), y + 9, 1, 7, s.tileDark)
        rect(c, x + 1, y + 1, 4, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          rect(c, x, y + 3, T, 1, s.tileDark)
        }
        break
      }
      case 'ankara': {
        // andezit: kırmızımsı gri bloklar
        rect(c, x, y + 5, T, 1, s.tileDark)
        rect(c, x, y + 11, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 3 : 9), y, 1, 5, s.tileDark)
        rect(c, x + (ty % 2 ? 11 : 5), y + 6, 1, 5, s.tileDark)
        rect(c, x + (ty % 2 ? 7 : 13), y + 12, 1, 4, s.tileDark)
        if (r() > 0.7) rect(c, x + 2 + Math.floor(r() * 10), y + 7, 2, 2, s.tileLight)
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          for (let i = 0; i < 16; i += 3) if (r() > 0.6) rect(c, x + i, y - 1, 1, 1, '#b8a058')
        }
        break
      }
      case 'mardin': {
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 4 : 11), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 12 : 3), y + 8, 1, 8, s.tileDark)
        rect(c, x + 1, y + 1, 6, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 4, s.tileTop)
          // oyma bordür
          for (let i = 0; i < 16; i += 4) {
            rect(c, x + i + 1, y + 1, 2, 1, s.tileDark)
            rect(c, x + i, y + 2, 1, 1, s.tileDark)
            rect(c, x + i + 3, y + 2, 1, 1, s.tileDark)
          }
          rect(c, x, y + 4, T, 1, s.tileDark)
        }
        break
      }
      case 'malatya':
      case 'ordu': {
        for (let i = 0; i < 3; i++) rect(c, x + Math.floor(r() * 14), y + Math.floor(r() * 14), 2, 1, i ? s.tileDark : s.tileLight)
        if (open) {
          rect(c, x, y, T, 4, s.tileTop)
          rect(c, x, y + 4, T, 1, '#4a8a30')
          for (let i = 0; i < 16; i += 3) rect(c, x + i, y - 1 - Math.floor(r() * 2), 1, 2, s.tileTop)
          if (r() > 0.8) rect(c, x + 6, y - 1, 2, 2, '#f39a2e')
        }
        break
      }
      case 'corum': {
        // poligonal kiklop taş örgüsü
        const a = 3 + Math.floor(r() * 9)
        const bb = 3 + Math.floor(r() * 9)
        for (let i = 0; i < 16; i++) rect(c, x + i, y + Math.round(a + ((bb - a) * i) / 15), 1, 1, s.tileDark)
        rect(c, x + 5 + Math.floor(r() * 6), y, 1, Math.min(a, bb), s.tileDark)
        rect(c, x + 3 + Math.floor(r() * 9), y + Math.max(a, bb) + 1, 1, 16, s.tileDark)
        rect(c, x + 2, y + 2, 3, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          for (let i = 0; i < 16; i += 2) rect(c, x + i, y - 1 - Math.floor(r() * 3), 1, 2, '#b8a058')
        }
        break
      }
      case 'trabzon': {
        // yağmurdan ıslak koyu taş, üstünde yosun ve çimen
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 6 : 13), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 13 : 4), y + 8, 1, 8, s.tileDark)
        rect(c, x + 1, y + 1, 5, 1, s.tileLight)
        if (r() > 0.7) rect(c, x + 3 + Math.floor(r() * 8), y + 9, 3, 2, '#4e6a52')
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          rect(c, x, y + 3, T, 1, '#3e6a32')
          for (let i = 0; i < 16; i += 2) rect(c, x + i, y - 1 - Math.floor(r() * 2), 1, 2, '#7ab85a')
        }
        break
      }
      case 'konya': {
        // Selçuklu kesme taşı; açık yüzde turkuaz çini şerit
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x, y + 15, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 7 : 15), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 15 : 7), y + 8, 1, 7, s.tileDark)
        rect(c, x + 1, y + 1, 5, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 4, '#2f9a94')
          rect(c, x, y + 4, T, 1, '#1e6a66')
          for (let i = 1; i < 16; i += 4) {
            rect(c, x + i, y + 1, 2, 2, '#f4ead8')
            rect(c, x + i + 1, y + 1, 1, 1, '#2a6ab8')
          }
        }
        break
      }
      case 'nevsehir': {
        // yumuşak tüf: yuvarlak oyuklar, dalgalı katmanlar
        for (let i = 0; i < 16; i++) rect(c, x + i, y + 9 + Math.round(Math.sin((x + i) / 5) * 1.5), 1, 1, s.tileDark)
        if (r() > 0.7) {
          disc(c, x + 5 + Math.floor(r() * 6), y + 5, 2, s.tileDark)
        }
        rect(c, x + 2, y + 2, 4, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          for (let i = 0; i < 16; i += 2) rect(c, x + i, y + 3, 1, 1 + Math.floor(r() * 2), s.tileTop)
        }
        break
      }
      case 'gaziantep': {
        // havara taşı: krem, geniş derz; üstte bakır kenar
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 4 : 12), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 11 : 3), y + 8, 1, 8, s.tileDark)
        rect(c, x + 1, y + 1, 6, 1, s.tileLight)
        if (r() > 0.85) rect(c, x + 8, y + 10, 3, 2, '#a8805a')
        if (open) {
          rect(c, x, y, T, 3, s.tileTop)
          rect(c, x, y + 3, T, 1, '#b8682e')
        }
        break
      }
      case 'sivas':
      case 'ardahan':
      case 'bayburt': {
        rect(c, x, y + 7, T, 1, s.tileDark)
        rect(c, x, y + 15, T, 1, s.tileDark)
        rect(c, x + (ty % 2 ? 5 : 12), y, 1, 7, s.tileDark)
        rect(c, x + (ty % 2 ? 12 : 4), y + 8, 1, 7, s.tileDark)
        rect(c, x + 1, y + 1, 4, 1, s.tileLight)
        if (open) {
          rect(c, x, y, T, 4, s.tileTop)
          rect(c, x, y + 4, T, 1, '#c3cfe0')
          for (let i = 0; i < 16; i += 3) if (r() > 0.5) rect(c, x + i, y + 4, 2, 1 + Math.floor(r() * 3), s.tileTop)
        }
        break
      }
    }
    if (openL) rect(c, x, y, 1, T, 'rgba(0,0,0,0.25)')
    if (openR) rect(c, x + T - 1, y, 1, T, 'rgba(0,0,0,0.3)')
  }

  /* ── Olaylar → efekt ──────────────────────────────────────── */
  handle(e: GameEvent, w: World) {
    const p = w.player
    const s = CITY[this.city]
    switch (e.type) {
      case 'jump':
        this.burst(p.x + p.w / 2, p.y + p.h, 5, 'rgba(240,230,210,0.8)', 30, 1)
        break
      case 'walljump':
        this.burst(p.x + p.w / 2, p.y + p.h, 5, 'rgba(240,230,210,0.8)', 30, 1)
        this.wallChain++
        if (this.wallChain >= 3) this.pop(p.x + p.w / 2, p.y - 6, this.wallChain === 3 ? (this.lang === 'en' ? 'Wall Master!' : 'Duvar Ustası!') : `×${this.wallChain}`, '#7ad8ff')
        break
      case 'land': {
        const hard = this.airVy > 260
        this.burst(p.x + p.w / 2, p.y + p.h, hard ? 10 : 4, 'rgba(240,230,210,0.7)', hard ? 45 : 25, 1)
        if (hard) this.shake = Math.max(this.shake, 1.2)
        this.airVy = 0
        this.stompChain = 0
        this.wallChain = 0
        break
      }
      case 'dash':
        this.flash = 0.06
        this.shake = Math.max(this.shake, 1.5)
        break
      case 'death':
        this.shake = 6
        this.burst(e.x, e.y, 22, '#d6403a', 120, 2)
        this.burst(e.x, e.y, 12, s.accent, 90, 2)
        break
      case 'collect':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#ffd36a', 90, 1)
        this.pop(p.x + p.w / 2, p.y - 6, '+1', '#ffd36a')
        break
      case 'checkpoint': {
        this.raised.set(e.index, this.t)
        const cp = w.checkpoints.find((c) => c.index === e.index)
        // bayrak göndere çekilirken direğin tepesinden kırmızı-beyaz konfeti
        if (cp) {
          this.burst(cp.x + 4, cp.y + cp.h - 28, 16, '#e30a17', 80, 1)
          this.burst(cp.x + 4, cp.y + cp.h - 28, 10, '#ffffff', 70, 1)
        }
        this.burst(p.x + p.w / 2, p.y, 8, s.accent, 60, 1)
        break
      }
      case 'spring':
        this.burst(p.x + p.w / 2, p.y + p.h, 8, '#ffd36a', 50, 1)
        break
      case 'stomp': {
        this.shake = Math.max(this.shake, 2)
        this.burst(e.x, e.y, 12, '#f4f0e6', 70, 1)
        // yere değmeden art arda ezdikçe yazı büyür
        this.stompChain++
        const words = this.lang === 'en' ? ['Hop!', 'Double!', 'Triple!'] : ['Hop!', 'Çifte!', 'Üçleme!']
        const n = this.stompChain
        this.pop(e.x, e.y - 8, n <= 3 ? words[n - 1] : `${this.lang === 'en' ? 'Legend' : 'Efsane'} ×${n}`, n >= 3 ? '#ffd36a' : '#f4f0e6', n >= 2)
        break
      }
      case 'respawn':
        this.stompChain = 0
        this.wallChain = 0
        break
      case 'crumble':
        break
      case 'crystal':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 16, '#7ad8ff', 90, 1)
        this.flash = 0.05
        break
      case 'key':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 20, '#f2c14e', 100, 2)
        this.shake = Math.max(this.shake, 2)
        break
      case 'stamp':
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 30, '#f4ead8', 120, 2)
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 16, s.accent, 90, 2)
        this.flash = 0.1
        break
      case 'switch':
        this.shake = Math.max(this.shake, 1.5)
        break
      case 'pet':
        for (let i = 0; i < 6; i++) this.particles.push({ x: e.x - 4 + Math.random() * 8, y: e.y - 2, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 25, life: 1.1, max: 1.1, color: i % 2 ? '#ff6a8a' : '#ffb0c0', size: 2, grav: -8 })
        this.petTimer = 0.5
        break
      default:
        break
    }
  }

  private pop(x: number, y: number, text: string, color: string, big = false) {
    this.pops.push({ x, y, text, color, life: 0.9, big })
    if (this.pops.length > 6) this.pops.shift()
  }

  private burst(x: number, y: number, n: number, color: string, speed: number, size: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = speed * (0.3 + Math.random() * 0.7)
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, color, size, grav: 260 })
    }
  }

  private initAmbient() {
    this.ambient = []
    const n = 70
    for (let i = 0; i < n; i++) this.ambient.push({ x: Math.random() * 600, y: Math.random() * 400, vx: 0, vy: 0, phase: Math.random() * 10, size: Math.random() < 0.3 ? 2 : 1 })
  }

  /* ── Kamera ───────────────────────────────────────────────── */
  private clampCam(w: World) {
    const lw = w.cols * T
    const lh = w.rows * T
    this.camX = Math.max(0, Math.min(lw - this.viewW, this.camX))
    const [lo, hi] = this.camYRange(lh)
    this.camY = Math.max(lo, Math.min(hi, this.camY))
  }

  /** Dikey ekranda bölümün altı ekranın ~%66'sında kalır: alt kısım dokunmatik kontrollere ayrılır. */
  private camYRange(lh: number): [number, number] {
    const portrait = this.viewH > this.viewW * 1.25
    const hi = portrait ? lh - this.viewH * 0.66 : lh - this.viewH
    const lo = Math.min(0, lh - this.viewH, hi)
    return [lo, Math.max(lo, hi)]
  }

  /* ── Çizim ────────────────────────────────────────────────── */
  render(w: World, dt: number) {
    this.t += dt
    const p = w.player
    const b = this.b
    const s = CITY[this.city]

    // kamera
    const lookX = p.facing * 28 + p.vx * 0.15
    const tx = p.x + p.w / 2 - this.viewW / 2 + lookX
    const ty = p.y + p.h / 2 - this.viewH * 0.55
    const k = 1 - Math.pow(0.0015, dt)
    this.camX += (tx - this.camX) * k
    this.camY += (ty - this.camY) * k * 0.8
    this.clampCam(w)
    this.shake = Math.max(0, this.shake - dt * 18)
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0
    const cx = Math.round(this.camX + sx)
    const cy = Math.round(this.camY + sy)

    // gökyüzü: 12 bant, sınırlarda 4x4 Bayer geçişi (el işi gradyan)
    b.drawImage(this.skyCanvas(s.sky), 0, 0)
    // güneşli şehirlerde süzülen ışık huzmeleri
    if (s.sun) {
      const sunX = this.viewW * s.sun.x
      b.save()
      for (let i = 0; i < 5; i++) {
        const a = -0.9 + i * 0.42 + Math.sin(this.t * 0.15 + i) * 0.05
        const len = this.viewH * 1.4
        b.fillStyle = `rgba(255,232,190,${0.035 + (i % 2) * 0.015})`
        b.beginPath()
        b.moveTo(sunX, 20)
        b.lineTo(sunX + Math.sin(a - 0.05) * len, 20 + Math.cos(a - 0.05) * len)
        b.lineTo(sunX + Math.sin(a + 0.05) * len, 20 + Math.cos(a + 0.05) * len)
        b.closePath()
        b.fill()
      }
      b.restore()
    }

    const lh = w.rows * T
    // katmanların tabanı bölümün zemin çizgisine (satır 20) oturur, dikeyde parallax
    const camRef = this.camYRange(lh)[1]
    const layerY = (f: number) => Math.round(GROUND_Y - camRef - (cy - camRef) * f) - LAYER_H + 22
    if (s.sun) {
      const sunX = this.viewW * s.sun.x
      const sunY = layerY(0.05) + LAYER_H * 0.2 + s.sun.y * 60
      const r = Math.round(s.sun.r * 0.6)
      disc(b, sunX, sunY, r + 7, s.sun.glow)
      disc(b, sunX, sunY, r + 3, s.sun.glow)
      disc(b, sunX, sunY, r, s.sun.color)
      if (this.city === 'bayburt') disc(b, sunX + 3, sunY - 2, r - 1, s.sky[0])
    }

    // parallax katmanlar
    if (this.layers) {
      const drawLayer = (cv: HTMLCanvasElement, f: number, fy: number) => {
        const y = layerY(fy)
        let x = -Math.round((cx * f) % LAYER_W)
        if (x > 0) x -= LAYER_W
        for (; x < this.viewW; x += LAYER_W) b.drawImage(cv, x, y)
        if (y + LAYER_H < this.viewH) {
          b.fillStyle = cv === this.layers!.near ? s.near : cv === this.layers!.mid ? s.mid : s.far
          b.fillRect(0, y + LAYER_H, this.viewW, this.viewH - y - LAYER_H)
        }
      }
      drawLayer(this.layers.far, 0.12, 0.08)
      // hava perspektifi: uzak katman gökyüzünün rengine yaslanır
      b.fillStyle = hexA(s.sky[2], 0.22)
      b.fillRect(0, 0, this.viewW, this.viewH)
      if (this.city === 'istanbul') this.drawBosphorus(b, layerY(0.13) + LAYER_H - 70, cx)
      drawLayer(this.layers.mid, 0.25, 0.18)
      b.fillStyle = hexA(s.sky[2], 0.16)
      b.fillRect(0, 0, this.viewW, this.viewH)
      drawLayer(this.layers.near, 0.45, 0.32)
      // yakın katman da hafifçe geri çekilir: oyuncunun bastığı zemin öne çıksın
      b.fillStyle = hexA(s.sky[2], 0.12)
      b.fillRect(0, 0, this.viewW, this.viewH)
    }

    this.drawAmbient(b, dt, cx, cy, w)

    // dünya
    b.save()
    b.translate(-cx, -cy)
    this.drawDecor(b, w, cx, cy)
    if (this.tilesLayer) {
      const sx0 = Math.max(0, cx)
      const sy0 = Math.max(0, cy)
      const sw = Math.min(this.viewW, this.tilesLayer.width - sx0)
      const sh = Math.min(this.viewH, this.tilesLayer.height - sy0)
      if (sw > 0 && sh > 0) b.drawImage(this.tilesLayer, sx0, sy0, sw, sh, sx0, sy0, sw, sh)
    }
    this.drawUnderground(b, w, cx, cy)
    this.drawDynamicTiles(b, w, cx, cy)
    this.drawCrumbles(b, w, cx, cy)
    this.drawWater(b, w, cx, cy)
    this.drawEntities(b, w)
    this.drawGhostRun(w)
    this.drawPlayer(w, dt)
    this.drawParticles(b, dt)
    b.restore()

    // fırtına / rüzgâr çizgileri önde
    if (this.city === 'bayburt' || w.level.wind) this.drawWind(b, w)

    if (this.flash > 0) {
      this.flash -= dt
      b.fillStyle = 'rgba(255,255,255,0.12)'
      b.fillRect(0, 0, this.viewW, this.viewH)
    }

    // vinyet: ekran oranına göre elips; dikey ekranda üstü karartıp bulanık göstermesin
    b.save()
    const vw = this.viewW
    const vh = this.viewH
    b.translate(vw / 2, vh / 2)
    b.scale(1, vh / vw)
    const vg = b.createRadialGradient(0, 0, vw * 0.42, 0, 0, vw * 0.78)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(10,6,20,0.28)')
    b.fillStyle = vg
    b.fillRect(-vw / 2, -vw / 2, vw, vw)
    b.restore()

    // büyüt
    const c = this.ctx
    c.imageSmoothingEnabled = false
    c.drawImage(this.buf, 0, 0, this.viewW, this.viewH, 0, 0, this.viewW * this.scale, this.viewH * this.scale)

    this.drawHeroes(cx, cy)
    this.drawLabels(w, cx, cy)
  }

  private drawBosphorus(b: Ctx, y: number, cx: number) {
    const s = CITY.istanbul
    rect(b, 0, y, this.viewW, this.viewH, s.water[1])
    for (let i = 0; i < 40; i++) {
      const wx = ((i * 53 - cx * 0.2 + Math.sin(this.t * 0.8 + i) * 6) % this.viewW + this.viewW) % this.viewW
      rect(b, wx, y + 4 + ((i * 7) % 40), 6 + (i % 4) * 3, 1, 'rgba(255,200,150,0.35)')
    }
    // vapur
    const fx = ((this.t * 9 - cx * 0.2) % (this.viewW + 200) + this.viewW + 200) % (this.viewW + 200) - 100
    const fy = y + 14
    rect(b, fx, fy, 34, 5, '#f4efe6')
    rect(b, fx + 2, fy + 5, 30, 2, '#2a2236')
    rect(b, fx + 6, fy - 5, 20, 5, '#f4efe6')
    for (let i = 0; i < 4; i++) rect(b, fx + 8 + i * 4, fy - 4, 2, 2, '#4a6a8a')
    rect(b, fx + 14, fy - 11, 3, 6, '#2a2236')
    rect(b, fx + 14, fy - 11, 3, 2, '#e8794a')
  }

  private drawAmbient(b: Ctx, dt: number, cx: number, cy: number, w: World) {
    const s = CITY[this.city]
    const W = this.viewW
    const Hh = this.viewH
    const wind = w.windNow
    if (this.city === 'mardin') {
      // damların üstünde dönen güvercin sürüsü
      const ox = W * 0.62 - cx * 0.05
      for (let i = 0; i < 9; i++) {
        const a = this.t * 0.6 + i * 0.7
        const gx = ox + Math.cos(a) * (40 + (i % 3) * 8)
        const gy = 46 + Math.sin(a) * 14 + (i % 2) * 4
        const up = Math.sin(this.t * 10 + i) > 0
        rect(b, gx - 2, gy - (up ? 1 : 0), 2, 1, '#4a3a4a')
        rect(b, gx, gy, 1, 1, '#4a3a4a')
        rect(b, gx + 1, gy - (up ? 1 : 0), 2, 1, '#4a3a4a')
      }
    }
    if (this.city === 'corum') {
      // ovanın üstünde süzülen kartal
      const a = this.t * 0.25
      const ex = W * 0.4 + Math.cos(a) * 90 - (cx * 0.05) % 40
      const ey = 40 + Math.sin(a * 2) * 10
      rect(b, ex - 7, ey, 6, 1, '#3a2a24')
      rect(b, ex + 2, ey, 6, 1, '#3a2a24')
      rect(b, ex - 1, ey - 1, 3, 2, '#3a2a24')
      rect(b, ex - 8, ey + 1, 2, 1, '#3a2a24')
      rect(b, ex + 7, ey + 1, 2, 1, '#3a2a24')
    }
    if (s.weather === 'gulls') {
      for (let i = 0; i < 5; i++) {
        const gx = ((i * 137 + this.t * (12 + i * 3) - cx * 0.3) % (W + 40) + W + 40) % (W + 40) - 20
        const gy = 30 + ((i * 41) % 60) + Math.sin(this.t * 1.5 + i) * 4
        const flap = Math.sin(this.t * 8 + i) > 0
        rect(b, gx, gy, 2, 1, '#f4f0e6')
        rect(b, gx + 3, gy, 2, 1, '#f4f0e6')
        rect(b, gx + 2, gy + 1, 1, 1, '#f4f0e6')
        if (flap) {
          rect(b, gx - 1, gy - 1, 1, 1, '#f4f0e6')
          rect(b, gx + 5, gy - 1, 1, 1, '#f4f0e6')
        }
      }
      return
    }
    for (const a of this.ambient) {
      a.phase += dt
      let color = 'rgba(255,255,255,0.8)'
      switch (s.weather) {
        case 'snow':
          a.vx = Math.sin(a.phase * 1.3) * 8
          a.vy = 14 + a.size * 6
          break
        case 'storm':
          a.vx = -90 - a.size * 40 + wind * 0.2
          a.vy = 30 + a.size * 10
          break
        case 'dust':
          a.vx = 6 + Math.sin(a.phase) * 4
          a.vy = Math.sin(a.phase * 0.7) * 3
          color = 'rgba(255,230,180,0.5)'
          break
        case 'petals':
          a.vx = 10 + Math.sin(a.phase * 2) * 10
          a.vy = 8 + Math.cos(a.phase * 1.5) * 4
          color = a.size > 1 ? 'rgba(255,240,245,0.9)' : 'rgba(255,190,120,0.9)'
          break
        case 'rain':
          a.vx = -30
          a.vy = 180 + a.size * 40
          color = 'rgba(190,215,235,0.55)'
          break
        case 'leaves':
          a.vx = 12 + Math.sin(a.phase * 2) * 8
          a.vy = 6 + Math.cos(a.phase) * 4
          color = 'rgba(220,170,80,0.7)'
          break
      }
      a.x += a.vx * dt
      a.y += a.vy * dt
      const px = (((a.x - cx * 0.6) % W) + W) % W
      const py = (((a.y - cy * 0.6) % Hh) + Hh) % Hh
      if (s.weather === 'rain') rect(b, px, py, 1, 4 + a.size * 2, color)
      else rect(b, px, py, a.size, a.size, color)
    }
    if (s.weather === 'storm') {
      // ikinci, daha yoğun kar katmanı
      for (let i = 0; i < 90; i++) {
        const px = ((((i * 97 - this.t * (160 + (i % 5) * 30)) % W) + W) % W)
        const py = (((i * 61 + this.t * (40 + (i % 3) * 12)) % Hh) + Hh) % Hh
        rect(b, px, py, i % 7 === 0 ? 2 : 1, 1, 'rgba(235,240,255,0.7)')
      }
    }
  }

  private drawWind(b: Ctx, w: World) {
    const strength = Math.abs(w.windNow) / 210
    b.fillStyle = `rgba(230,236,255,${0.12 + strength * 0.2})`
    for (let i = 0; i < 14; i++) {
      const len = 10 + (i % 4) * 8
      const x = ((((i * 131 - this.t * (220 + i * 10)) % (this.viewW + 60)) + this.viewW + 60) % (this.viewW + 60)) - 30
      const y = (i * 53) % this.viewH
      b.fillRect(Math.round(x), y, Math.round(len * (0.4 + strength)), 1)
    }
  }

  private drawDecor(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    for (const d of w.decor) {
      const x = d.tx * T
      const y = d.ty * T
      if (x < cx - 48 || x > cx + this.viewW + 48 || y < cy - 48 || y > cy + this.viewH + 48) continue
      const bot = y + T
      switch (d.ch) {
        case 'l': {
          // fener
          rect(b, x + 7, bot - 30, 2, 30, '#2a2236')
          rect(b, x + 4, bot - 34, 8, 6, '#2a2236')
          rect(b, x + 5, bot - 33, 6, 4, '#ffd27a')
          disc(b, x + 8, bot - 31, 12, 'rgba(255,210,120,0.10)')
          disc(b, x + 8, bot - 31, 7, 'rgba(255,210,120,0.12)')
          break
        }
        case 't': {
          if (this.city === 'izmir' || this.city === 'adana') {
            for (let i = 0; i < 26; i++) rect(b, x + 7 + Math.round(Math.sin(i / 9) * 2), bot - i, 2, 1, '#6a4a30')
            for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 0.6], [1, 0.6], [-0.3, -0.7], [0.3, -0.7]] as const)
              for (let k = 0; k < 10; k++) rect(b, x + 8 + dx * k, bot - 26 + dy * k + (k * k) / 22, 2, 1, '#3f7a3a')
          } else if (this.city === 'sivas' || this.city === 'bayburt' || this.city === 'ardahan') {
            for (let i = 0; i < 26; i++) {
              const hw = Math.floor((i / 26) * 9)
              rect(b, x + 8 - hw, bot - 30 + i, hw * 2 + 1, 1, '#2f4a3e')
              if (i % 6 === 2) rect(b, x + 8 - hw, bot - 30 + i, hw * 2 + 1, 1, '#e8f0fa')
            }
            rect(b, x + 7, bot - 4, 3, 4, '#3b2a1e')
          } else {
            rect(b, x + 6, bot - 14, 4, 14, '#5a3c26')
            disc(b, x + 8, bot - 22, 10, this.city === 'malatya' ? '#4f8a45' : '#4a6a3a')
            disc(b, x + 5, bot - 24, 5, this.city === 'malatya' ? '#5fa050' : '#567a44')
            if (this.city === 'malatya') for (let i = 0; i < 9; i++) rect(b, x + 1 + ((i * 5) % 14), bot - 30 + ((i * 7) % 14), 2, 2, i % 3 ? '#f39a2e' : '#ffc65a')
          }
          break
        }
        case 'k': {
          this.drawAnimal(b, x, bot - (this.petTimer > 0.2 ? 2 : 0))
          const pl = w.player
          const near = Math.abs(pl.x + pl.w / 2 - (x + 8)) < 22 && Math.abs(pl.y + pl.h - bot) < 6
          if (near && pl.grounded && Math.abs(pl.vx) < 5 && !pl.dead && Math.random() < 0.05)
            this.particles.push({ x: x + 6 + Math.random() * 6, y: bot - 12, vx: (Math.random() - 0.5) * 10, vy: -28, life: 1, max: 1, color: '#ff6a8a', size: 2, grav: -10 })
          break
        }
        case 'z':
          this.drawLandmarkProp(b, x, bot)
          break
        case 'q':
          this.drawCityProp(b, x, bot)
          break
        case 'w': {
          rect(b, x + 4, bot - 12, 8, 10, s.tileDark)
          disc(b, x + 8, bot - 12, 4, s.tileDark, true)
          rect(b, x + 5, bot - 11, 6, 8, '#3a2a3a')
          rect(b, x + 7, bot - 14, 2, 11, s.tileDark)
          break
        }
        case 'a': {
          rect(b, x - 6, bot - 22, 28, 22, s.tileDark)
          rect(b, x - 4, bot - 20, 24, 20, s.tile)
          rect(b, x + 1, bot - 12, 14, 12, '#3a2a28')
          disc(b, x + 8, bot - 12, 7, '#3a2a28', true)
          rect(b, x - 4, bot - 21, 24, 2, s.tileLight)
          break
        }
        case 'o': {
          rect(b, x + 1, bot - 10, 14, 10, '#8a5a35')
          rect(b, x + 1, bot - 10, 14, 1, '#b07a48')
          rect(b, x + 1, bot - 5, 14, 1, '#6b4428')
          for (let i = 0; i < 6; i++) disc(b, x + 3 + i * 2, bot - 11, 1, i % 2 ? '#f39a2e' : '#ffb84a')
          break
        }
        case 's':
          this.drawStall(b, x, bot)
          break
        case 'm': {
          // kayısı serme: damda/yerde kurutulan kayısılar
          rect(b, x, bot - 2, T, 2, '#c9a46a')
          for (let i = 0; i < 7; i++) {
            rect(b, x + 1 + i * 2, bot - 3 - (i % 2), 2, 2, i % 3 ? '#e8832a' : '#f4a640')
          }
          break
        }
        case 'b': {
          // direkte Türk bayrağı
          rect(b, x + 3, bot - 34, 1, 34, '#d8d8d8')
          const wave = Math.round(Math.sin(this.t * 4) * 1)
          rect(b, x + 4, bot - 34 + wave * 0, 16, 10, '#e30a17')
          rect(b, x + 20, bot - 33 + wave, 1, 9, '#e30a17')
          disc(b, x + 9, bot - 29, 3, '#ffffff')
          disc(b, x + 10, bot - 29, 2, '#e30a17')
          rect(b, x + 13, bot - 30, 1, 3, '#ffffff')
          rect(b, x + 12, bot - 29, 3, 1, '#ffffff')
          break
        }
        default:
          break
      }
    }
    // tabelalar
    for (const sg of w.signs) {
      const x = sg.x
      const bot = sg.y + T
      rect(b, x + 7, bot - 10, 2, 10, '#5a3c26')
      rect(b, x + 1, bot - 16, 14, 9, '#8a5a35')
      rect(b, x + 2, bot - 15, 12, 7, '#c79a62')
      rect(b, x + 7, bot - 14, 2, 3, '#3a2a1e')
      rect(b, x + 7, bot - 10, 2, 1, '#3a2a1e')
      if (w.nearSign === sg.index) rect(b, x + 1, bot - 17, 14, 1, '#ffd36a')
    }
    // şehir insanları
    w.npcs.forEach((n, i) => {
      const look = w.level.npcs[i]?.look ?? 'amca'
      const art = NPC_ART[look]
      const bob = Math.sin(this.t * 2 + i) > 0.7 ? 1 : 0
      const faceLeft = w.player.x < n.x
      drawShaded(b, bob ? ['............', ...art.rows.slice(0, -1).filter((_, k) => k !== 6), art.rows[art.rows.length - 1]] : art.rows, art.pal, n.x + 2, n.y + T - art.rows.length, faceLeft, '#1a1420')
      // konuşma balonu
      const near = w.nearNpc === i
      const by = n.y + T - art.rows.length - 9 - (near ? 0 : Math.round(Math.sin(this.t * 3 + i)))
      rect(b, n.x + 3, by, 10, 7, near ? '#ffd36a' : '#f4ead8')
      rect(b, n.x + 6, by + 7, 2, 2, near ? '#ffd36a' : '#f4ead8')
      for (let d = 0; d < 3; d++) rect(b, n.x + 5 + d * 2, by + 3, 1, 1, '#2a2236')
    })
  }

  /** Horon ve koçari halkası: kol kola oyuncular, eller yukarıda kenetli; oyuncu ellerin üstüne basar */
  private drawHoron(b: Ctx, pl: { x: number; y: number; w: number; max: number; dance?: 'horon' | 'kocari' }) {
    const kocari = pl.dance === 'kocari'
    const lift = pl.max - pl.y
    const n = Math.max(2, Math.round(pl.w / 11))
    const step = pl.w / n
    const shimmy = kocari ? 0 : Math.round(Math.sin(this.t * 40) * 0.6)
    const skin = '#e0a880'
    for (let i = 0; i < n; i++) {
      const dx = Math.round(pl.x + i * step + step / 2 - 4 + (i % 2 ? shimmy : -shimmy))
      const top = pl.y + 5
      // kollar: omuzdan kenetli ellere
      rect(b, dx, top + 1, 1, 6, kocari ? '#f4ead8' : '#1d1a22')
      rect(b, dx + 8, top + 1, 1, 6, kocari ? '#f4ead8' : '#1d1a22')
      rect(b, dx, pl.y + 2, 1, 2, skin)
      rect(b, dx + 8, pl.y + 2, 1, 2, skin)
      // baş: horoncuda siyah kolay, koçaride renkli puşi
      rect(b, dx + 2, top + 1, 5, 5, skin)
      if (kocari) {
        rect(b, dx + 1, top, 7, 2, i % 2 ? '#d6403a' : '#3f8f5a')
        rect(b, dx + 2, top + 2, 5, 1, '#f2c14e')
      } else rect(b, dx + 2, top, 5, 2, '#1a1418')
      rect(b, dx + 3, top + 3, 1, 1, '#1d1a22')
      rect(b, dx + 5, top + 3, 1, 1, '#1d1a22')
      // gövde
      if (kocari) {
        rect(b, dx + 1, top + 6, 7, 11, '#f4ead8')
        rect(b, dx + 2, top + 6, 5, 9, '#a8302a')
        rect(b, dx + 4, top + 7, 1, 7, '#f2c14e')
        rect(b, dx + 1, top + 14, 7, 2, '#3a2a24')
      } else {
        rect(b, dx + 1, top + 6, 7, 11, '#1d1a22')
        rect(b, dx + 3, top + 8, 3, 1, '#c8d0dc')
        rect(b, dx + 3, top + 10, 3, 1, '#c8d0dc')
        rect(b, dx + 1, top + 14, 7, 1, '#c8a050')
      }
      // bacaklar: horonda kesik kesik titrer, koçaride yere ağır vurur
      const up = lift > 6
      const l1 = kocari ? (up ? 3 : 0) : up ? 2 : 0
      const l2 = kocari ? 0 : up ? 0 : 2
      rect(b, dx + 2, top + 17, 2, 8 - l1, '#2a2a36')
      rect(b, dx + 5, top + 17, 2, 8 - l2, '#2a2a36')
      rect(b, dx + 1, top + 25 - l1, 3, 1, '#0d0b10')
      rect(b, dx + 5, top + 25 - l2, 3, 1, '#0d0b10')
    }
    // kenetli eller: ince halka, düğüm yerlerinde ten rengi
    rect(b, pl.x, pl.y, pl.w, 2, kocari ? '#f4ead8' : '#2a2430')
    for (let i = 0; i <= n; i++) rect(b, Math.round(pl.x + i * step - 1), pl.y, 3, 2, skin)
    // yere vuruşta toz
    if (lift < 1 && kocari && Math.random() < 0.3) this.particles.push({ x: pl.x + Math.random() * pl.w, y: pl.max + 30, vx: (Math.random() - 0.5) * 30, vy: -20, life: 0.3, max: 0.3, color: 'rgba(200,190,170,0.7)', size: 1, grav: 60 })
    rect(b, pl.x + 2 + lift / 4, pl.max + 30, pl.w - 4 - lift / 2, 1, 'rgba(0,0,0,0.35)')
  }

  /** Kapadokya balonu: sepet platform, üstünde renkli zarf; yükselirken alev yanar */
  private drawBalloon(b: Ctx, pl: { x: number; y: number; w: number; dy: number }) {
    const cx = pl.x + pl.w / 2
    const top = pl.y - 46
    const cols = ['#e8604a', '#f2c14e', '#3fa8c8', '#f4ead8']
    for (let yy = 0; yy < 30; yy++) {
      const t = yy / 30
      const hw = Math.round(Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62 + 0.25) * 16)
      for (let xx = -hw; xx <= hw; xx++) {
        const band = Math.floor(((xx + hw) / (hw * 2 + 1)) * 5)
        rect(b, cx + xx, top + yy, 1, 1, cols[band % cols.length])
      }
      rect(b, cx - hw, top + yy, 1, 1, 'rgba(0,0,0,0.25)')
      rect(b, cx + hw, top + yy, 1, 1, 'rgba(0,0,0,0.35)')
    }
    rect(b, cx - 6, top + 30, 12, 2, '#a84a2a')
    // ipler
    for (const dx of [-6, 5]) for (let yy = top + 32; yy < pl.y; yy += 2) rect(b, cx + dx + (dx < 0 ? (yy - top - 32) / 6 : -(yy - top - 32) / 6), yy, 1, 1, '#5a3c26')
    // sepet
    rect(b, pl.x + 2, pl.y, pl.w - 4, 7, '#8a5a35')
    rect(b, pl.x + 2, pl.y, pl.w - 4, 1, '#b07a48')
    for (let i = pl.x + 4; i < pl.x + pl.w - 3; i += 3) rect(b, i, pl.y + 2, 1, 4, '#6b4428')
    if (pl.dy < -0.05) {
      rect(b, cx - 1, top + 32, 3, 3, '#ffd36a')
      rect(b, cx, top + 31, 1, 2, '#ffffff')
    }
  }

  /** Şehrin tezgâhı: simit arabası, mırra, kayısı, leblebi kazanı, Sivas halısı, saman ve kopuz */
  private drawStall(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'trabzon': {
        // hamsi tezgâhı: tepside sıra sıra gümüş balık, limon
        rect(b, x - 4, bot - 9, 26, 9, '#6a4a32')
        rect(b, x - 6, bot - 12, 30, 3, '#3a6a8a')
        for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < 7; i++) {
          const fx = x - 4 + i * 4 + r2 * 2
          const fy = bot - 15 - r2 * 3
          rect(b, fx, fy, 3, 1, '#c8d4e0')
          rect(b, fx + 3, fy, 1, 1, '#7a8a9a')
        }
        disc(b, x + 22, bot - 15, 2, '#f2d34a')
        rect(b, x - 6, bot - 24, 30, 2, '#d6403a')
        rect(b, x - 6, bot - 22, 1, 10, '#6a4a32')
        rect(b, x + 23, bot - 22, 1, 10, '#6a4a32')
        break
      }
      case 'konya': {
        // etli ekmek fırını: taş fırın, uzun kürek, ekmek
        rect(b, x - 4, bot - 18, 24, 18, '#8a6a4a')
        disc(b, x + 8, bot - 18, 12, '#8a6a4a', true)
        rect(b, x + 3, bot - 12, 10, 8, '#2a1a14')
        disc(b, x + 8, bot - 12, 5, '#2a1a14', true)
        rect(b, x + 4, bot - 8, 8, 2, '#f28c28')
        rect(b, x + 5, bot - 9, 6, 1, '#ffd36a')
        rect(b, x + 14, bot - 6, 18, 1, '#a07a58')
        rect(b, x + 26, bot - 8, 10, 3, '#e0a860')
        rect(b, x + 27, bot - 8, 8, 1, '#c86a3a')
        break
      }
      case 'nevsehir': {
        // Avanos çömlekçisi: çark ve testiler
        rect(b, x - 2, bot - 6, 14, 6, '#6a4a3a')
        disc(b, x + 5, bot - 8, 5, '#3a2a24')
        rect(b, x + 2, bot - 16, 6, 8, '#c8603a')
        rect(b, x + 3, bot - 18, 4, 2, '#a84a2a')
        for (let i = 0; i < 3; i++) {
          rect(b, x + 14 + i * 6, bot - 9, 5, 9, '#c8603a')
          rect(b, x + 15 + i * 6, bot - 11, 3, 2, '#a84a2a')
          rect(b, x + 14 + i * 6, bot - 6, 5, 1, '#f0c890')
        }
        break
      }
      case 'gaziantep': {
        // baklava tepsisi ve fıstık çuvalı
        rect(b, x - 4, bot - 10, 24, 10, '#5a3c26')
        rect(b, x - 4, bot - 10, 24, 1, '#7a5638')
        disc(b, x + 8, bot - 13, 11, '#b8682e', true)
        for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) rect(b, x - 1 + i * 2 + j, bot - 15 + j * 2, 2, 2, (i + j) % 2 ? '#eab24a' : '#86c040')
        rect(b, x + 22, bot - 12, 10, 12, '#c8a878')
        rect(b, x + 23, bot - 14, 8, 3, '#86c040')
        rect(b, x + 22, bot - 12, 10, 1, '#a88858')
        break
      }
      case 'istanbul': {
        rect(b, x - 6, bot - 14, 26, 10, '#c8302a')
        rect(b, x - 6, bot - 14, 26, 2, '#e8564a')
        rect(b, x - 4, bot - 26, 22, 12, 'rgba(220,240,255,0.35)')
        rect(b, x - 4, bot - 26, 22, 1, '#e8e8e8')
        rect(b, x - 4, bot - 26, 1, 12, '#e8e8e8')
        rect(b, x + 17, bot - 26, 1, 12, '#e8e8e8')
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
          disc(b, x - 1 + i * 5, bot - 22 + j * 5, 2, '#b8692e')
          rect(b, x - 1 + i * 5, bot - 22 + j * 5, 1, 1, '#f6e7c0')
        }
        disc(b, x - 2, bot - 3, 3, '#2a2236')
        disc(b, x + 16, bot - 3, 3, '#2a2236')
        rect(b, x + 20, bot - 18, 6, 1, '#5a3c26')
        break
      }
      case 'kocaeli': {
        // pişmaniye tezgâhı: pembe kutular
        rect(b, x - 4, bot - 10, 26, 10, '#7a5a40')
        rect(b, x - 4, bot - 10, 26, 1, '#a07a58')
        for (let i = 0; i < 4; i++) {
          rect(b, x - 2 + i * 6, bot - 16, 5, 6, '#e88aa0')
          rect(b, x - 1 + i * 6, bot - 15, 3, 3, '#fbf6ec')
        }
        for (let i = 0; i < 3; i++) {
          rect(b, x + 1 + i * 6, bot - 21, 5, 5, '#d8708a')
          rect(b, x + 2 + i * 6, bot - 20, 3, 2, '#fbf6ec')
        }
        rect(b, x - 6, bot - 28, 30, 3, '#e86a8a')
        for (let i = 0; i < 30; i += 6) rect(b, x - 6 + i, bot - 25, 3, 2, '#fbf6ec')
        break
      }
      case 'ordu': {
        // fındık çuvalları ve harman
        rect(b, x - 8, bot - 2, 34, 2, '#7a8a9a')
        for (let i = 0; i < 14; i++) rect(b, x - 6 + i * 2, bot - 4 - (i % 2), 2, 2, i % 3 ? '#a8682c' : '#7a4418')
        for (const sx of [x + 14, x + 20]) {
          rect(b, sx, bot - 12, 6, 10, '#c8b48a')
          rect(b, sx + 1, bot - 13, 4, 1, '#a8682c')
        }
        break
      }
      case 'adana': {
        // kebap mangalı ve şalgam şişeleri
        const fl = Math.floor(this.t * 8) % 2
        rect(b, x - 2, bot - 10, 22, 4, '#3a3440')
        rect(b, x, bot - 6, 2, 6, '#2a2430')
        rect(b, x + 16, bot - 6, 2, 6, '#2a2430')
        for (let i = 0; i < 5; i++) rect(b, x + i * 4, bot - 11 - fl, 3, 1, i % 2 ? '#f28c28' : '#ffd36a')
        for (let i = 0; i < 3; i++) {
          rect(b, x - 1, bot - 14 - i * 2, 22, 1, '#9aa3b5')
          rect(b, x + 3 + i * 2, bot - 15 - i * 2, 10, 2, '#8a3a24')
        }
        for (let k = 0; k < 4; k++) rect(b, x + 6 + k * 2, bot - 20 - k * 3 - fl, 2, 2, 'rgba(230,230,230,0.45)')
        for (let i = 0; i < 2; i++) {
          rect(b, x + 24 + i * 4, bot - 10, 3, 10, '#6a1a3a')
          rect(b, x + 25 + i * 4, bot - 12, 1, 2, '#6a1a3a')
        }
        break
      }
      case 'ardahan': {
        // odun yığını ve semaver
        for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) {
          disc(b, x + i * 6 + r * 3, bot - 3 - r * 5, 3, '#6a4a30')
          rect(b, x + i * 6 + r * 3, bot - 3 - r * 5, 1, 1, '#c8a070')
        }
        rect(b, x - 2, bot - 18, 26, 2, '#f6faff')
        rect(b, x + 26, bot - 14, 8, 14, '#c88a3a')
        rect(b, x + 27, bot - 18, 6, 4, '#a86a24')
        rect(b, x + 29, bot - 21, 2, 3, '#a86a24')
        rect(b, x + 34, bot - 8, 3, 1, '#a86a24')
        break
      }
      case 'izmir': {
        // boyoz tezgâhı: tepsiler, yumurtalar, çay
        rect(b, x - 4, bot - 12, 24, 3, '#8a6a4a')
        rect(b, x - 2, bot - 9, 2, 9, '#5a3c26')
        rect(b, x + 16, bot - 9, 2, 9, '#5a3c26')
        rect(b, x - 3, bot - 15, 22, 3, '#c8c4cc')
        for (let i = 0; i < 6; i++) disc(b, x + i * 3, bot - 16, 1, '#e0a040')
        for (let i = 0; i < 3; i++) rect(b, x + 1 + i * 3, bot - 19, 2, 3, '#f4efe6')
        rect(b, x + 13, bot - 20, 3, 4, 'rgba(200,60,40,0.9)')
        rect(b, x + 13, bot - 20, 3, 1, '#f4efe6')
        break
      }
      case 'ankara': {
        // Kale kuruyemişçisi: çuvallar
        const cols = ['#c87a3a', '#e0b050', '#8a4a2a', '#d8c8a0']
        for (let i = 0; i < 4; i++) {
          const sx = x - 6 + i * 8
          rect(b, sx, bot - 10, 7, 10, '#b8a078')
          rect(b, sx, bot - 11, 7, 2, cols[i])
          rect(b, sx + 1, bot - 12, 5, 1, cols[i])
        }
        rect(b, x - 7, bot - 24, 34, 2, '#c8302a')
        for (let i = 0; i < 34; i += 6) rect(b, x - 7 + i, bot - 22, 3, 2, '#f4efe6')
        break
      }
      case 'mardin': {
        rect(b, x - 6, bot - 2, 28, 2, '#a83a2a')
        for (let i = 0; i < 28; i += 4) rect(b, x - 6 + i, bot - 2, 2, 1, '#f2c14e')
        rect(b, x - 2, bot - 9, 20, 2, '#7a4a24')
        rect(b, x, bot - 7, 2, 5, '#5a3c26')
        rect(b, x + 14, bot - 7, 2, 5, '#5a3c26')
        // cezve ve mırra fincanları
        rect(b, x + 2, bot - 14, 5, 5, '#c87a3a')
        rect(b, x + 7, bot - 13, 3, 1, '#c87a3a')
        rect(b, x + 11, bot - 11, 2, 2, '#f4efe6')
        rect(b, x + 14, bot - 11, 2, 2, '#f4efe6')
        // buhar
        const t = Math.floor(this.t * 3) % 3
        rect(b, x + 4, bot - 17 - t, 1, 2, 'rgba(255,255,255,0.5)')
        // telkari vitrin
        rect(b, x - 8, bot - 26, 10, 14, '#5a3c26')
        rect(b, x - 7, bot - 25, 8, 12, '#2a2236')
        for (let i = 0; i < 3; i++) rect(b, x - 5 + (i % 2) * 3, bot - 23 + i * 4, 2, 2, '#e6ebf2')
        break
      }
      case 'malatya': {
        rect(b, x - 6, bot - 24, 30, 3, '#d9741a')
        for (let i = 0; i < 30; i += 6) rect(b, x - 6 + i, bot - 21, 3, 2, '#f4efe6')
        rect(b, x - 5, bot - 21, 2, 21, '#7a4a24')
        rect(b, x + 21, bot - 21, 2, 21, '#7a4a24')
        for (let k = 0; k < 3; k++) {
          const cx = x - 2 + k * 8
          rect(b, cx, bot - 8, 7, 8, '#a86a38')
          rect(b, cx, bot - 8, 7, 1, '#d29a5a')
          for (let i = 0; i < 4; i++) disc(b, cx + 1 + i * 2, bot - 9, 1, i % 2 ? '#f39a2e' : '#ffb84a')
        }
        for (let i = 0; i < 5; i++) disc(b, x + 1 + i * 4, bot - 13, 1, '#e8832a')
        break
      }
      case 'corum': {
        // leblebi kazanı + çuvallar
        const fl = Math.floor(this.t * 8) % 2
        rect(b, x, bot - 4, 14, 4, '#3a2a22')
        rect(b, x + 3, bot - 7 - fl, 2, 3 + fl, '#f28c28')
        rect(b, x + 8, bot - 6 + fl, 2, 2 + fl, '#ffd36a')
        rect(b, x - 1, bot - 12, 16, 5, '#b87333')
        rect(b, x - 2, bot - 13, 18, 1, '#d8955a')
        for (let i = 0; i < 6; i++) rect(b, x + 1 + i * 2, bot - 14, 1, 1, '#f2e2b4')
        for (const sx of [x + 17, x + 23]) {
          rect(b, sx, bot - 10, 6, 10, '#c9b27a')
          rect(b, sx + 1, bot - 11, 4, 1, '#a88a52')
          rect(b, sx + 1, bot - 12, 4, 1, '#f2e2b4')
        }
        break
      }
      case 'sivas': {
        // Sivas halısı askıda
        rect(b, x - 4, bot - 28, 24, 1, '#5a3c26')
        rect(b, x - 4, bot - 28, 1, 28, '#5a3c26')
        rect(b, x + 19, bot - 28, 1, 28, '#5a3c26')
        rect(b, x - 1, bot - 26, 18, 18, '#8a1e2a')
        rect(b, x + 1, bot - 24, 14, 14, '#1d3f6a')
        rect(b, x + 3, bot - 22, 10, 10, '#c9a24a')
        rect(b, x + 6, bot - 19, 4, 4, '#8a1e2a')
        for (let i = 0; i < 18; i += 2) rect(b, x - 1 + i, bot - 8, 1, 2, '#e8dcc0')
        rect(b, x - 1, bot - 26, 18, 1, '#f4f8ff')
        break
      }
      case 'bayburt': {
        rect(b, x - 4, bot - 10, 14, 10, '#c9a24a')
        rect(b, x - 4, bot - 10, 14, 1, '#e8c86a')
        rect(b, x - 4, bot - 6, 14, 1, '#a8822a')
        rect(b, x - 4, bot - 11, 14, 2, '#e6edf7')
        rect(b, x + 12, bot - 12, 14, 2, '#7a5a40')
        rect(b, x + 12, bot - 7, 14, 2, '#7a5a40')
        for (let i = 0; i < 3; i++) rect(b, x + 12 + i * 6, bot - 14, 2, 14, '#5e4634')
        break
      }
    }
  }

  /** Şehrin ikinci simge nesnesi: tramvay, telkari vitrini, güneş kursu, çay ocağı */
  private drawCityProp(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'istanbul': {
        // nostaljik tramvay: kırmızı-krem gövde, pantograf, raylar
        rect(b, x - 16, bot - 1, 48, 1, '#5a5a66')
        rect(b, x - 14, bot - 20, 44, 16, '#c8302a')
        rect(b, x - 14, bot - 20, 44, 2, '#e8564a')
        rect(b, x - 14, bot - 10, 44, 3, '#f4ead8')
        for (let i = 0; i < 5; i++) rect(b, x - 11 + i * 8, bot - 17, 6, 5, '#cfe4f0')
        rect(b, x - 14, bot - 4, 44, 2, '#3a2a2a')
        for (const wx of [x - 8, x + 20]) disc(b, wx, bot - 2, 2, '#2a2222')
        rect(b, x + 6, bot - 26, 1, 6, '#3a3a40')
        rect(b, x + 2, bot - 26, 9, 1, '#3a3a40')
        rect(b, x + 1, bot - 18, 4, 2, '#f2c14e')
        break
      }
      case 'mardin': {
        // telkari vitrini: ahşap raf, ışıkta parlayan gümüş işler
        rect(b, x - 2, bot - 22, 20, 22, '#6a4a32')
        rect(b, x, bot - 20, 16, 18, '#2a2028')
        const glint = Math.floor(this.t * 3) % 4
        for (let i = 0; i < 4; i++) {
          const gx = x + 2 + (i % 2) * 8
          const gy = bot - 18 + Math.floor(i / 2) * 8
          disc(b, gx + 2, gy + 2, 2, '#c8d0dc')
          rect(b, gx + 2, gy + 2, 1, 1, i === glint ? '#ffffff' : '#8a96a8')
        }
        rect(b, x - 2, bot - 23, 20, 1, '#8a6a4a')
        break
      }
      case 'corum': {
        // Hitit güneş kursu: taş kaide üstünde tunç halka ve geyik
        rect(b, x + 3, bot - 6, 10, 6, '#9a8a6a')
        rect(b, x + 7, bot - 10, 2, 4, '#7a5a2a')
        for (let a = 0; a < 20; a++) {
          const ang = Math.PI + (a / 19) * Math.PI
          rect(b, x + 8 + Math.round(Math.cos(ang) * 7), bot - 14 + Math.round(Math.sin(ang) * 7), 1, 1, '#c8862e')
        }
        rect(b, x + 6, bot - 16, 4, 3, '#a86a24')
        rect(b, x + 5, bot - 19, 1, 3, '#a86a24')
        rect(b, x + 10, bot - 19, 1, 3, '#a86a24')
        for (const dx of [1, 8, 15]) rect(b, x + dx, bot - 14 - (dx === 8 ? 7 : 3), 1, 1, '#f2c14e')
        break
      }
      case 'trabzon': {
        // çay ocağı: semaver, ince belli bardak
        rect(b, x + 3, bot - 4, 10, 4, '#5e4634')
        rect(b, x + 5, bot - 16, 6, 12, '#c8a050')
        rect(b, x + 6, bot - 19, 4, 3, '#a87a30')
        rect(b, x + 11, bot - 10, 3, 1, '#a87a30')
        rect(b, x + 15, bot - 8, 2, 4, 'rgba(220,240,255,0.7)')
        rect(b, x + 15, bot - 7, 2, 2, '#a8301e')
        if (Math.sin(this.t * 2) > 0) rect(b, x + 7, bot - 22, 1, 2, 'rgba(255,255,255,0.5)')
        break
      }
      default:
        this.drawLandmarkProp(b, x, bot)
    }
  }

  /** Şehrin kendine özgü küçük nesnesi: bölümü her yerde o şehre bağlar. */
  private drawLandmarkProp(b: Ctx, x: number, bot: number) {
    switch (this.city) {
      case 'trabzon': {
        // tabure üstünde kemençe ve yayı
        rect(b, x + 2, bot - 6, 12, 2, '#5e4634')
        rect(b, x + 3, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 11, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 6, bot - 20, 4, 14, '#8a4a24')
        rect(b, x + 7, bot - 23, 2, 3, '#5a2e14')
        rect(b, x + 6, bot - 14, 4, 1, '#f0c890')
        rect(b, x + 7, bot - 19, 1, 9, '#e8dcc0')
        const sway = Math.round(Math.sin(this.t * 6) * 2)
        rect(b, x + 1 + sway, bot - 16, 14, 1, '#d8c8a0')
        break
      }
      case 'konya': {
        // dönen semazen: tennure açılır kapanır
        const k = Math.sin(this.t * 6)
        const skirt = 5 + Math.round(Math.abs(k) * 3)
        rect(b, x + 7, bot - 22, 3, 6, '#c8a070')
        rect(b, x + 7, bot - 16, 3, 3, '#f0d0b0')
        rect(b, x + 6, bot - 13, 5, 5, '#f4f0e8')
        rect(b, x + 8 - skirt, bot - 8, skirt * 2 + 1, 8, '#f4f0e8')
        rect(b, x + 8 - skirt, bot - 1, skirt * 2 + 1, 1, '#d8d0c4')
        rect(b, x + 2, bot - 14 - Math.round(k), 4, 1, '#f4f0e8')
        rect(b, x + 11, bot - 14 + Math.round(k), 4, 1, '#f4f0e8')
        break
      }
      case 'nevsehir': {
        // güvercinlik: kaya duvarına oyulmuş boyalı delikler
        rect(b, x, bot - 20, 16, 20, '#c89a7a')
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
          rect(b, x + 2 + i * 5, bot - 17 + j * 8, 3, 4, '#3a2420')
          rect(b, x + 1 + i * 5, bot - 18 + j * 8, 5, 1, j ? '#e8604a' : '#f4ead8')
        }
        rect(b, x + 6, bot - 22 + Math.round(Math.sin(this.t * 4)), 3, 2, '#c8ccd8')
        break
      }
      case 'gaziantep': {
        // bakır kazan ve cezve
        disc(b, x + 7, bot - 6, 6, '#c8682e')
        rect(b, x + 1, bot - 6, 13, 6, '#c8682e')
        rect(b, x + 1, bot - 12, 13, 1, '#e8904a')
        rect(b, x + 3, bot - 10, 3, 5, '#f0a868')
        rect(b, x + 14, bot - 7, 4, 1, '#8a4a20')
        break
      }
      case 'istanbul': {
        // çay masası: ince belli bardaklar
        rect(b, x + 1, bot - 9, 14, 2, '#8a5a3a')
        rect(b, x + 7, bot - 7, 2, 7, '#5a3c26')
        for (const cx of [x + 3, x + 10]) {
          rect(b, cx, bot - 14, 3, 5, 'rgba(230,240,255,0.6)')
          rect(b, cx, bot - 12, 3, 3, '#b8381e')
          rect(b, cx - 1, bot - 10, 5, 1, '#e8e2d8')
        }
        break
      }
      case 'kocaeli':
        for (let i = 0; i < 3; i++) {
          disc(b, x + 4 + i * 5, bot - 4, 4, '#f2ece0')
          disc(b, x + 4 + i * 5, bot - 4, 1, '#a8a090')
        }
        disc(b, x + 7, bot - 11, 4, '#e8e0d0')
        disc(b, x + 7, bot - 11, 1, '#a8a090')
        break
      case 'izmir':
        // Kordon bankı
        rect(b, x - 2, bot - 8, 20, 2, '#8a5a3a')
        rect(b, x - 2, bot - 12, 20, 2, '#8a5a3a')
        rect(b, x, bot - 6, 2, 6, '#3a3440')
        rect(b, x + 14, bot - 6, 2, 6, '#3a3440')
        break
      case 'ankara':
        // taş çeşme
        rect(b, x, bot - 18, 16, 18, '#a6887e')
        rect(b, x + 3, bot - 15, 10, 9, '#5c4844')
        disc(b, x + 8, bot - 15, 5, '#5c4844', true)
        rect(b, x + 7, bot - 9, 2, 3, '#9aa3b5')
        rect(b, x + 7, bot - 6 + (Math.floor(this.t * 6) % 2), 1, 3, '#8ad0f0')
        rect(b, x - 1, bot - 19, 18, 2, '#c2b0a6')
        break
      case 'adana':
        // pamuk balyası yığını
        for (const [dx, dy] of [[0, 0], [9, 0], [4, 7]] as const) {
          rect(b, x + dx, bot - 7 - dy, 9, 7, '#f4f2ec')
          rect(b, x + dx, bot - 5 - dy, 9, 1, '#c8b48a')
          rect(b, x + dx + 3, bot - 7 - dy, 1, 7, '#c8b48a')
        }
        break
      case 'mardin':
        // asılı kilim
        rect(b, x, bot - 26, 16, 1, '#5a3c26')
        rect(b, x + 1, bot - 25, 14, 20, '#a8302a')
        rect(b, x + 3, bot - 23, 10, 16, '#e0a23a')
        rect(b, x + 6, bot - 19, 4, 8, '#2a3a6a')
        for (let i = 1; i < 15; i += 2) rect(b, x + i, bot - 5, 1, 2, '#e8dcc0')
        break
      case 'malatya':
        for (let i = 0; i < 3; i++) {
          rect(b, x + i * 5, bot - 6, 4, 6, '#a86a38')
          disc(b, x + 2 + i * 5, bot - 7, 1, '#f39a2e')
        }
        break
      case 'corum':
        // Hitit stelinde güneş kursu
        rect(b, x + 3, bot - 22, 10, 22, '#8a7a5a')
        rect(b, x + 2, bot - 2, 12, 2, '#6e6250')
        disc(b, x + 8, bot - 15, 4, '#b8a058')
        disc(b, x + 8, bot - 15, 2, '#8a7a5a')
        for (let i = 0; i < 4; i++) rect(b, x + 5 + i * 2, bot - 8, 1, 4, '#6e6250')
        break
      case 'ordu':
        for (const dx of [0, 7]) {
          rect(b, x + dx, bot - 10, 7, 10, '#c8b48a')
          rect(b, x + dx + 1, bot - 11, 5, 1, '#a8682c')
          rect(b, x + dx + 2, bot - 12, 3, 1, '#7a4418')
        }
        break
      case 'sivas':
        // Divriği taş işlemesi pano
        rect(b, x, bot - 20, 16, 20, '#9a9fb0')
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) disc(b, x + 3 + i * 3.5, bot - 16 + j * 4, 1, '#555a6a')
        rect(b, x - 1, bot - 21, 18, 2, '#f4f8ff')
        break
      case 'ardahan':
        // kardan adam
        disc(b, x + 8, bot - 5, 5, '#f6faff')
        disc(b, x + 8, bot - 13, 4, '#f6faff')
        rect(b, x + 7, bot - 14, 1, 1, '#1d1a22')
        rect(b, x + 9, bot - 14, 1, 1, '#1d1a22')
        rect(b, x + 10, bot - 13, 3, 1, '#f28c28')
        rect(b, x + 4, bot - 10, 9, 2, '#d6403a')
        rect(b, x + 5, bot - 20, 7, 3, '#2a2420')
        break
      case 'bayburt':
        // tabure üstünde kopuz
        rect(b, x + 2, bot - 6, 12, 2, '#5e4634')
        rect(b, x + 3, bot - 4, 2, 4, '#5e4634')
        rect(b, x + 11, bot - 4, 2, 4, '#5e4634')
        disc(b, x + 6, bot - 10, 4, '#a8693a')
        rect(b, x + 9, bot - 18, 2, 8, '#7a4a24')
        break
    }
  }

  private drawAnimal(b: Ctx, x: number, bot: number) {
    const tail = Math.sin(this.t * 3) > 0 ? 1 : 0
    switch (CITY[this.city].animal) {
      case 'partridge': {
        // keklik: kafeste değil, özgür; kırmızı gaga, çizgili yan
        const peck = Math.sin(this.t * 2) > 0.8 ? 1 : 0
        sprite(b, ['..gg......', '.gegr.....', '.ggg......', 'gwwgggg...', '.gkgkgggg.', '..gggggg..', '...o..o...'], { g: '#a8a090', w: '#f4ead8', k: '#3a2a20', e: '#1d1a22', r: '#e0303a', o: '#e06a3a' }, x + 3, bot - 7 + peck)
        break
      }
      case 'cat':
        sprite(b, ['.o.o......', '.ooo......', '.oeo.....' + (tail ? 'o' : '.'), '.oooo...o' + (tail ? '.' : 'o'), '..ooooooo.', '..ooOooOo.', '..o.o..o..'], { o: '#e0903a', O: '#b06a24', e: '#2a2a2a' }, x + 2, bot - 7)
        break
      case 'cow':
        sprite(b, ['kk..........', 'kwk.........', 'wwwwkwwwkww.', '.wwkkwwwkkww' + (tail ? 'k' : '.'), '..wwwwwwwwww', '..wkw...wkw.', '..k.k...k.k.'], { w: '#f4efe6', k: '#2a2420' }, x, bot - 7)
        break
      case 'flamingo':
        sprite(b, ['..pp...', '.pppk..', '..p....', '..p....', '.ppp...', 'ppppp..', '.pppp..', '...l...', '...l...', '...l...', '..ll...'], { p: '#f29aa8', k: '#2a2220', l: '#d8707a' }, x + 4, bot - 11, tail > 0)
        break
      case 'angora':
        sprite(b, ['.w.w......', '.www......', '.bwg.....' + (tail ? 'w' : '.'), '.wwww...w' + (tail ? '.' : 'w'), '..wwwwwww.', '..wwWwwWw.', '..w.w..w..'], { w: '#f8f6f0', W: '#dcd8d0', b: '#4a8ad8', g: '#e0b040' }, x + 2, bot - 7)
        break
      case 'kangal':
        sprite(b, ['kk.........', 'kek........', 'kkwwwwwww..', '.wwwwwwwww' + (tail ? 'w' : '.'), '..wwwwwwww.', '..w.w..w.w.', '..w.w..w.w.'], { w: '#d9c49a', k: '#2a2420', e: '#f2d34a' }, x + 1, bot - 7)
        break
      case 'lion':
        rect(b, x + 1, bot - 14, 14, 14, '#7a6a50')
        sprite(b, ['..mmmm....', '.mmffmm...', '.mfefff...', '.mffffm...', '..mmmmmff.', '...ffffff.', '...f.f.ff.'], { m: '#5e5038', f: '#a8956e', e: '#2a2420' }, x + 3, bot - 12)
        break
      case 'horse':
        sprite(b, ['kk..........', 'kkk.........', '.kkkkkkkkk..', '..kkkkkkkkkk', '..kkkkkkkk.k', '..k.k...k.k.', '..k.k...k.k.'], { k: '#4a3426' }, x, bot - 7)
        break
    }
  }

  /** Bölümün altında kalan alan: zemin sürer, su sürer, boşluk karanlıktır. */
  private drawUnderground(b: Ctx, w: World, cx: number, cy: number) {
    const lh = w.rows * T
    if (cy + this.viewH <= lh) return
    const s = CITY[this.city]
    const h = cy + this.viewH - lh
    const x0 = Math.max(0, Math.floor(cx / T))
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T))
    for (let tx = x0; tx <= x1; tx++) {
      const t = w.tile(tx, w.rows - 1)
      const color = t === WATER ? s.water[1] : t === EMPTY || t === SPIKE_UP ? '#0b0910' : s.tileDark
      rect(b, tx * T, lh, T, h, color)
      if (color === s.tileDark) for (let y = lh + 6; y < lh + h; y += 11) rect(b, tx * T + ((tx * 7 + y) % 12), y, 3, 1, s.tile)
    }
    // derinleştikçe kararan örtü
    const g = b.createLinearGradient(0, lh, 0, lh + h)
    g.addColorStop(0, 'rgba(10,8,16,0)')
    g.addColorStop(1, 'rgba(10,8,16,0.75)')
    b.fillStyle = g
    b.fillRect(cx, lh, this.viewW, h)
  }

  private drawDynamicTiles(b: Ctx, w: World, cx: number, cy: number) {
    const x0 = Math.max(0, Math.floor(cx / T))
    const x1 = Math.min(w.cols - 1, Math.ceil((cx + this.viewW) / T))
    const y0 = Math.max(0, Math.floor(cy / T))
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T))
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        if (t === DOOR) {
          if (w.hasKey) {
            b.globalAlpha = 0.15
            rect(b, x + 2, y, 12, T, '#c88a3a')
            b.globalAlpha = 1
          } else {
            rect(b, x + 1, y, 14, T, '#7a4a24')
            rect(b, x + 2, y, 2, T, '#9a6a3a')
            rect(b, x + 7, y, 2, T, '#9a6a3a')
            rect(b, x + 12, y, 2, T, '#9a6a3a')
            rect(b, x + 1, y + 6, 14, 2, '#3a3440')
            if (w.tile(tx, ty - 1) !== DOOR) {
              rect(b, x + 5, y + 9, 6, 5, '#f2c14e')
              rect(b, x + 7, y + 10, 2, 3, '#120f1a')
            }
          }
        }
        if (t === BLOCK_A || t === BLOCK_B) {
          const solid = t === BLOCK_A ? !w.switchOn : w.switchOn
          const col = t === BLOCK_A ? '#e8794a' : '#4aa8e0'
          if (solid) {
            rect(b, x, y, T, T, col)
            rect(b, x + 1, y + 1, T - 2, T - 2, t === BLOCK_A ? '#c8582a' : '#2a7ab0')
            rect(b, x + 3, y + 3, T - 6, T - 6, col)
            rect(b, x + 1, y + 1, T - 2, 1, 'rgba(255,255,255,0.35)')
          } else {
            for (let i = 0; i < T; i += 4) {
              rect(b, x + i, y, 2, 1, col)
              rect(b, x + i, y + T - 1, 2, 1, col)
              rect(b, x, y + i, 1, 2, col)
              rect(b, x + T - 1, y + i, 1, 2, col)
            }
          }
        }
      }
  }

  private drawCrumbles(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    const x0 = Math.floor(cx / T)
    const x1 = Math.ceil((cx + this.viewW) / T)
    const y0 = Math.max(0, Math.floor(cy / T))
    const y1 = Math.min(w.rows - 1, Math.ceil((cy + this.viewH) / T))
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (w.tile(tx, ty) !== CRUMBLE) continue
        const st = w.crumbles.get(ty * w.cols + tx)
        if (st?.broken) {
          if (st.respawn < 0.5) {
            b.globalAlpha = 0.3
            rect(b, tx * T, ty * T, T, T, s.tileLight)
            b.globalAlpha = 1
          }
          continue
        }
        // kırılmaya ne kadar kaldı: titreme artar, çatlak büyür, taş hafifçe çöker, toz dökülür
        const k = st ? Math.min(1, st.t / 0.42) : 0
        const shakeX = st ? Math.round((Math.random() - 0.5) * (1 + k * 2)) : 0
        const sink = Math.round(k * 2)
        const x = tx * T + shakeX
        const y = ty * T + sink
        rect(b, x, y, T, 14 - sink, s.tileLight)
        rect(b, x, y, T, 2, s.tileTop)
        rect(b, x, y + 12 - sink, T, 2, s.tileDark)
        rect(b, x + 1, y + 2, 4, 1, 'rgba(255,240,210,0.35)')
        rect(b, x + 5, y + 2, 1, 4, s.tileDark)
        rect(b, x + 6, y + 5, 3, 1, s.tileDark)
        rect(b, x + 11, y + 4, 1, 5, s.tileDark)
        if (k > 0.3) {
          rect(b, x + 2, y + 6, 1, 5, s.tileDark)
          rect(b, x + 8, y + 7, 1, 4, s.tileDark)
          rect(b, x + 3, y + 9, 4, 1, s.tileDark)
        }
        if (k > 0.65) {
          rect(b, x + 7, y, 1, 12, s.tileDark)
          rect(b, x + 12, y + 8, 3, 1, s.tileDark)
        }
        if (st && Math.random() < 0.25 + k * 0.4) this.particles.push({ x: tx * T + Math.random() * T, y: ty * T + 13, vx: (Math.random() - 0.5) * 10, vy: 10, life: 0.5, max: 0.5, color: s.tileLight, size: 1, grav: 200 })
      }
  }

  private drawWater(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    const x0 = Math.floor(cx / T)
    const x1 = Math.ceil((cx + this.viewW) / T)
    for (let tx = x0; tx <= x1; tx++) {
      let depth = 0
      for (let ty = 0; ty < w.rows; ty++) {
        if (w.tile(tx, ty) !== WATER) {
          depth = 0
          continue
        }
        const surface = depth === 0
        const x = tx * T
        const y = ty * T
        rect(b, x, y + (surface ? 6 : 0), T, T - (surface ? 6 : 0), s.water[ty % 2 ? 1 : 0])
        // derinlik: aşağı indikçe koyulaşır
        const dk = Math.min(0.42, depth * 0.11)
        if (dk > 0) rect(b, x, y, T, T, `rgba(8,14,36,${dk.toFixed(2)})`)
        else rect(b, x, y + 12, T, 4, 'rgba(8,14,36,0.06)')
        if (surface) {
          for (let i = 0; i < 16; i++) {
            const h = Math.round(Math.sin(this.t * 3 + (x + i) * 0.35) * 1.2)
            rect(b, x + i, y + 6 + h, 1, 2, s.water[2])
            // dalga tepesinde köpük
            if (h < 0) rect(b, x + i, y + 6 + h, 1, 1, 'rgba(240,250,255,0.75)')
          }
          // kayan pırıltılar
          for (let g = 0; g < 2; g++) {
            const gx = Math.floor((this.t * (14 + g * 6) + tx * 37 + g * 9) % 16)
            if ((Math.floor(this.t * 2 + tx + g) & 3) !== 0) rect(b, x + gx, y + 9 + g * 3, 2, 1, 'rgba(255,255,255,0.55)')
          }
          // kıyıya vuran köpük
          const shoreL = w.tile(tx - 1, ty) !== WATER && w.tile(tx - 1, ty) !== 0
          const shoreR = w.tile(tx + 1, ty) !== WATER && w.tile(tx + 1, ty) !== 0
          const surf = Math.round((Math.sin(this.t * 2.2 + tx) + 1) * 1.5)
          if (shoreL) rect(b, x, y + 5, 2 + surf, 2, 'rgba(240,250,255,0.7)')
          if (shoreR) rect(b, x + T - 2 - surf, y + 5, 2 + surf, 2, 'rgba(240,250,255,0.7)')
        } else if (((tx * 7 + ty * 3 + Math.floor(this.t * 1.5)) % 5) === 0) {
          // derinde ışık oyunu
          const lx = Math.floor((this.t * 6 + tx * 11) % 14)
          rect(b, x + lx, y + 4, 3, 1, 'rgba(200,235,255,0.08)')
          rect(b, x + lx + 2, y + 5, 3, 1, 'rgba(200,235,255,0.06)')
        }
        depth++
      }
    }
    void cy
  }

  private drawEntities(b: Ctx, w: World) {
    const s = CITY[this.city]
    // platformlar
    for (const pl of w.platforms) {
      if (pl.axis === 'b') {
        this.drawBalloon(b, pl)
        continue
      }
      if (pl.axis === 'h') {
        this.drawHoron(b, pl)
        continue
      }
      if (pl.axis === 'o') {
        // sema halkası: merkeze ince ip, turkuaz dönen tepsi
        const cx = Math.round(pl.cx!)
        const cy = Math.round(pl.cy!)
        disc(b, cx, cy, 2, '#f2c14e')
        const n = 8
        for (let k = 1; k < n; k++) rect(b, cx + ((pl.x + pl.w / 2 - cx) * k) / n, cy + ((pl.y + 3 - cy) * k) / n, 1, 1, 'rgba(244,234,216,0.55)')
        rect(b, pl.x, pl.y, pl.w, 5, '#2f9a94')
        rect(b, pl.x, pl.y, pl.w, 1, '#7ad8cc')
        rect(b, pl.x, pl.y + 4, pl.w, 1, '#1e6a66')
        for (let i = 2; i < pl.w; i += 5) rect(b, pl.x + i, pl.y + 2, 2, 1, '#f4ead8')
        continue
      }
      rect(b, pl.x - 1, pl.y + 1, pl.w + 2, 6, 'rgba(18,12,26,0.55)')
      rect(b, pl.x, pl.y, pl.w, 6, s.plank)
      rect(b, pl.x, pl.y, pl.w, 1, lighten(s.plank))
      rect(b, pl.x, pl.y + 5, pl.w, 1, 'rgba(0,0,0,0.45)')
      rect(b, pl.x, pl.y + 6, pl.w, 2, 'rgba(0,0,0,0.18)')
      for (let i = 8; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 1, 1, 4, 'rgba(0,0,0,0.3)')
      for (let i = 3; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 2, 1, 1, 'rgba(255,240,210,0.55)')
      if (this.city === 'ordu') {
        // teleferik kabini: askı ve kırmızı gövde
        rect(b, pl.x + pl.w / 2 - 1, pl.y - 30, 2, 30, '#2a3a30')
        rect(b, pl.x - 30, pl.y - 31, pl.w + 60, 1, '#2a3a30')
        rect(b, pl.x + 4, pl.y + 6, pl.w - 8, 10, '#d6403a')
        rect(b, pl.x + 7, pl.y + 8, pl.w - 14, 4, '#cfe8f0')
      }
      if (this.city === 'istanbul') {
        // iskele dubaları
        rect(b, pl.x + 2, pl.y + 6, 6, 3, '#e8794a')
        rect(b, pl.x + pl.w - 8, pl.y + 6, 6, 3, '#e8794a')
      }
    }
    // bakırcı tokmakları
    for (const h of w.hammers) {
      const st = hammerState(h, w.clock)
      const shake = st.phase === 1 ? Math.round(Math.sin(this.t * 70)) : 0
      const hx = h.x + shake
      // sap: tavana kadar
      let topY = h.top - T
      while (topY > 0 && !w.isSolid(Math.floor((h.x + 8) / T), Math.floor(topY / T))) topY -= T
      rect(b, hx + 7, topY + T, 2, st.y - topY - T + 2, '#5a3c26')
      rect(b, hx + 6, topY + T, 4, 2, '#3a2a1e')
      // baş: bakır, alt yüzü parlak
      rect(b, hx, st.y + 2, T, T - 2, '#b8682e')
      rect(b, hx, st.y + 2, T, 2, '#e8904a')
      rect(b, hx, st.y + T - 2, T, 2, '#7a3a14')
      rect(b, hx + 2, st.y + 5, 3, 6, '#f0b070')
      if (st.phase === 1) {
        // uyarı: yerde gölge ve kıvılcım
        rect(b, h.x + 1, h.bottom + T - 1, T - 2, 1, 'rgba(255,80,60,0.6)')
      }
      if (st.phase === 3 && Math.random() < 0.3) this.particles.push({ x: h.x + Math.random() * T, y: h.bottom + T - 1, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 40, life: 0.3, max: 0.3, color: '#ffd36a', size: 1, grav: 300 })
    }
    // yaylar (Malatya'da kayısı kasası)
    for (const sp of w.springs) {
      const sq = sp.squash > 0 ? 3 : 0
      if (this.city === 'malatya') {
        rect(b, sp.x, sp.y + sq, sp.w, sp.h - sq, '#a86a38')
        rect(b, sp.x, sp.y + sq, sp.w, 1, '#d29a5a')
        rect(b, sp.x, sp.y + 4 + sq / 2, sp.w, 1, '#7a4a24')
        for (let i = 0; i < 6; i++) disc(b, sp.x + 2 + i * 2, sp.y - 1 + sq, 1, i % 2 ? '#f39a2e' : '#ffb84a')
      } else {
        rect(b, sp.x + 2, sp.y + 5, sp.w - 4, 3, '#4a4458')
        for (let i = 0; i < 3; i++) rect(b, sp.x + 4, sp.y + 2 + i * 1 + sq / 2, sp.w - 8, 1, '#9aa3b5')
        rect(b, sp.x, sp.y + sq, sp.w, 2, s.accent)
      }
    }
    // hatıralar
    for (const c of w.pickups) {
      if (c.taken) continue
      const bob = Math.round(Math.sin(this.t * 3 + c.index) * 2)
      disc(b, c.x + 5, c.y + 5 + bob, 8, 'rgba(255,220,120,0.15)')
      const art = ITEM_ART[this.city]
      drawShaded(b, art.rows, art.pal, c.x, c.y + bob, false, '#2a1a10')
      if (Math.sin(this.t * 5 + c.index * 2) > 0.92) rect(b, c.x + 8, c.y + bob - 1, 1, 1, '#ffffff')
    }
    // bayraklar
    for (const cp of w.checkpoints) this.drawFlag(b, cp)
    // çıkış kapısı
    this.drawExit(b, w)
    // düşmanlar
    for (const e of w.enemies) {
      if (!e.alive) continue
      const art = enemyArt(e.kind, this.city)
      const speed = e.kind === 'fly' || e.kind === 'bat' ? 8 : e.state === 'charge' ? 14 : 6
      // saksağan: tünekte kanatlar kapalı, uyarı ve dalışta hızlı çırpar
      const f = e.kind === 'magpie' ? (e.state === 'idle' || e.state === 'stun' ? 0 : 1 + (Math.floor(this.t * 14) % 2)) : Math.abs(Math.floor(e.phase * speed)) % art.frames.length
      const rows = art.frames[f]
      const shake = e.state === 'windup' ? Math.round(Math.sin(this.t * 60)) : 0
      const squash = e.kind === 'hopper' && e.state === 'windup' ? 2 : 0
      const sx = e.x + shake
      const sy = e.y + squash + (e.state === 'stun' ? 1 : 0)
      const flip = e.dir > 0
      // gölge
      if (e.kind !== 'fly' && e.kind !== 'bat' && e.kind !== 'magpie') rect(b, e.x + 1, e.y + e.h - 1, e.w - 2, 1, 'rgba(0,0,0,0.3)')
      // tehlike dış hattı: arka plandan ayrışsın
      const outline: Record<string, string> = {}
      const pulse = Math.sin(this.t * 5 + e.ox * 0.1) > 0.2
      for (const k of Object.keys(art.pal)) outline[k] = e.kind === 'spiky' ? '#ff4a3a' : pulse ? '#e8283a' : '#5a0f1a'
      drawShaded(b, rows, art.pal, sx, sy, flip, outline[Object.keys(outline)[0]])
      // uyarı: hücumdan önce ünlem
      if (e.state === 'windup') {
        const ex = e.x + e.w / 2 - 1
        rect(b, ex - 2, e.y - 13, 6, 10, '#120f1a')
        rect(b, ex, e.y - 12, 2, 5, '#ff4a3a')
        rect(b, ex, e.y - 6, 2, 2, '#ff4a3a')
      }
      if (e.state === 'stun') for (let k = 0; k < 3; k++) rect(b, e.x + e.w / 2 + Math.cos(this.t * 6 + k * 2.1) * 6, e.y - 4 + Math.sin(this.t * 6 + k * 2.1) * 2, 2, 2, '#ffd36a')
    }
    // atılma kristalleri
    for (const c of w.crystals) {
      const cx = c.x + 5
      const cy = c.y + 5 + Math.round(Math.sin(this.t * 3 + c.x) * 1.5)
      if (!c.active) {
        b.globalAlpha = 0.3
        rect(b, cx - 1, cy - 4, 2, 8, '#7ad8ff')
        b.globalAlpha = 1
        continue
      }
      disc(b, cx, cy, 8, 'rgba(122,216,255,0.18)')
      for (let k = 0; k < 6; k++) rect(b, cx - k * 0.7, cy - 6 + k, 1 + k * 1.4, 1, k < 2 ? '#e8faff' : '#7ad8ff')
      for (let k = 0; k < 6; k++) rect(b, cx - (5 - k) * 0.7, cy + k, 1 + (5 - k) * 1.4, 1, k > 3 ? '#2a7ab0' : '#4aa8e0')
      if (Math.sin(this.t * 4 + c.x) > 0.8) rect(b, cx - 3, cy - 3, 1, 1, '#ffffff')
    }
    // anahtar
    if (w.keyBox && !w.hasKey) {
      const k = w.keyBox
      const ky = k.y + Math.round(Math.sin(this.t * 3) * 2)
      disc(b, k.x + 5, ky + 5, 9, 'rgba(255,210,100,0.2)')
      disc(b, k.x + 3, ky + 4, 3, '#f2c14e')
      disc(b, k.x + 3, ky + 4, 1, '#120f1a')
      rect(b, k.x + 5, ky + 3, 6, 2, '#f2c14e')
      rect(b, k.x + 8, ky + 5, 1, 2, '#f2c14e')
      rect(b, k.x + 10, ky + 5, 1, 3, '#f2c14e')
    }
    // gizli pul
    if (w.stampBox && !w.stampTaken) {
      const st = w.stampBox
      const sy2 = st.y + Math.round(Math.sin(this.t * 2) * 1.5)
      disc(b, st.x + 6, sy2 + 6, 11, 'rgba(255,240,200,0.18)')
      rect(b, st.x, sy2, 12, 12, '#f4ead8')
      for (let i = 0; i < 12; i += 2) {
        rect(b, st.x + i, sy2 - 1, 1, 1, '#f4ead8')
        rect(b, st.x + i, sy2 + 12, 1, 1, '#f4ead8')
      }
      rect(b, st.x + 2, sy2 + 2, 8, 6, CITY[this.city].accent)
      rect(b, st.x + 3, sy2 + 9, 6, 1, '#3a2a1e')
    }
    // basınç plakaları
    for (const pl of w.plates) {
      rect(b, pl.x, pl.y + (pl.pressed ? 2 : 0), pl.w, pl.pressed ? 2 : 4, w.switchOn ? '#4aa8e0' : '#e8794a')
      rect(b, pl.x - 1, pl.y + 3, pl.w + 2, 1, '#2a2438')
    }
    // ok tuzağı yükleniyor: atıştan hemen önce yarık kızarır
    for (const tr of w.turrets) {
      if (tr.timer < 0.5) {
        const a = 1 - tr.timer / 0.5
        b.globalAlpha = 0.4 + a * 0.6
        rect(b, tr.tx * T + 3, tr.ty * T + 6, 10, 3, '#ff4a3a')
        disc(b, tr.tx * T + (tr.dir > 0 ? 15 : 1), tr.ty * T + 7, 2 + Math.round(a * 2), 'rgba(255,90,60,0.5)')
        b.globalAlpha = 1
      }
    }
    // oklar
    for (const pr of w.projectiles) {
      rect(b, pr.x, pr.y + 1, 6, 1, '#d8c8a0')
      rect(b, pr.vx > 0 ? pr.x + 5 : pr.x, pr.y, 1, 3, '#9aa3b5')
      rect(b, pr.vx > 0 ? pr.x : pr.x + 5, pr.y, 1, 3, '#c8553d')
    }
  }

  /** Bayrak: taş kaide, gölgeli direk, altın topuz. Dokunulunca bez göndere çekilir ve sütun sütun dalgalanır. */
  private drawFlag(b: Ctx, cp: { x: number; y: number; h: number; index: number; active: boolean }) {
    const x = cp.x
    const bot = cp.y + cp.h
    const top = bot - 37
    if (cp.active) {
      const glow = 0.1 + Math.sin(this.t * 2.4 + cp.index) * 0.04
      disc(b, x + 4, bot - 2, 11, `rgba(255,190,110,${glow.toFixed(3)})`)
    }
    // kaide
    rect(b, x, bot - 3, 9, 3, '#5a5068')
    rect(b, x, bot - 3, 9, 1, '#8a7f96')
    rect(b, x + 1, bot, 8, 1, 'rgba(0,0,0,0.3)')
    // direk: ışıklı sol, gölgeli sağ
    rect(b, x + 3, top, 1, 34, '#ece6da')
    rect(b, x + 4, top, 1, 34, '#9a94a2')
    disc(b, x + 4, top - 1, 1.8, '#f2c14e')
    rect(b, x + 3, top - 2, 1, 1, '#fff1c0')
    if (!cp.active) {
      // direğe sarılı, solgun bez
      for (let j = 0; j < 12; j++) rect(b, x + 5, top + 2 + j, 2, 1, j % 3 === 0 ? '#6a2a30' : '#8a3a42')
      rect(b, x + 5, top + 14, 1, 2, '#6a2a30')
      return
    }
    // göndere çekiliş: 0,6 sn'de aşağıdan yukarı (yumuşak duruş)
    const since = this.raised.has(cp.index) ? this.t - this.raised.get(cp.index)! : 9
    const k = Math.min(1, since / 0.6)
    const lift = Math.round((1 - (1 - k) * (1 - k)) * 20)
    const y0 = top + 1 + (20 - lift)
    const W = 17
    const H = 11
    for (let i = 0; i < W; i++) {
      // dalga direkte sıfır, uca doğru büyür; eğim ışığı belirler
      const amp = (i / W) * 2
      const ph = this.t * 6 - i * 0.55
      const off = Math.round(Math.sin(ph) * amp)
      const slope = Math.cos(ph)
      const red = slope > 0.45 ? '#ff3b3b' : slope < -0.45 ? '#b0060f' : '#e30a17'
      for (let j = 0; j < H; j++) {
        // ay: büyük beyaz daireden kaydırılmış kırmızı daire çıkar; yıldız: küçük artı
        const cx = i + 0.5
        const cy = j + 0.5
        // TS 2994 oranları küçültülmüş: ay dış çember 0,5H, iç 0,4H; yıldız ayın açık tarafında
        const inMoon = Math.hypot(cx - 6, cy - 5.5) <= 3.6 && Math.hypot(cx - 7, cy - 5.5) > 2.9
        const inStar = STAR[j - 3]?.[i - 9] === '#'
        let col = inMoon || inStar ? '#ffffff' : red
        if (j === H - 1 && !inMoon && !inStar) col = '#9a0510'
        rect(b, x + 5 + i, y0 + j + off, 1, 1, col)
      }
    }
    // pırıltı
    if (k === 1 && Math.sin(this.t * 3.1 + cp.index * 1.7) > 0.97) rect(b, x + 4, top - 3, 1, 1, '#ffffff')
  }

  private drawExit(b: Ctx, w: World) {
    const s = CITY[this.city]
    const e = w.exit
    const cx = e.x + T / 2
    const bot = e.y + e.h
    const glow = 0.25 + Math.sin(this.t * 3) * 0.1
    disc(b, cx, bot - 16, 22, `rgba(255,220,140,${glow * 0.5})`)
    rect(b, cx - 14, bot - 38, 28, 38, s.tileDark)
    rect(b, cx - 12, bot - 36, 24, 36, s.tile)
    rect(b, cx - 8, bot - 24, 16, 24, '#ffe2a0')
    disc(b, cx, bot - 24, 8, '#ffe2a0', true)
    rect(b, cx - 6, bot - 22, 12, 22, '#fff4d0')
    disc(b, cx, bot - 22, 6, '#fff4d0', true)
    rect(b, cx - 12, bot - 38, 24, 2, s.tileLight)
    if (this.city === 'corum') {
      // Aslanlı Kapı aslanları
      for (const side of [-1, 1]) {
        const lx = cx + side * 13 - (side < 0 ? 4 : 0)
        rect(b, lx, bot - 12, 4, 12, '#8a7a5a')
        rect(b, lx - (side < 0 ? 1 : -1), bot - 14, 4, 4, '#a8956e')
      }
    }
    if (this.city === 'sivas') for (let i = 0; i < 6; i++) rect(b, cx - 11 + i * 4, bot - 34, 2, 2, s.tileLight)
  }

  /** En iyi koşunun soluk mavi hayaleti: zamanlayıcıyla aynı anda, aynı yerden geçer. */
  private drawGhostRun(w: World) {
    const g = this.ghostRun
    if (!g || !w.started) return
    const n = g.data.length / 3
    const f = w.time * GHOST_HZ
    const i = Math.floor(f)
    if (i >= n - 1) return
    const k = f - i
    const x = g.data[i * 3] + (g.data[i * 3 + 3] - g.data[i * 3]) * k
    const y = g.data[i * 3 + 1] + (g.data[i * 3 + 4] - g.data[i * 3 + 1]) * k
    // oyuncuyla üst üste binince silikleşir, göz yormasın
    const near = Math.hypot(x - w.player.x, y - w.player.y)
    const alpha = near < 10 ? 0.15 : 0.46
    const code = g.data[i * 3 + 2]
    const pose = code & 7
    const run = gait((w.time * 15) / 8 % 1)
    const body: Pose = pose === 4 ? POSES.dash : pose === 2 ? POSES.jump : pose === 3 ? POSES.fall : pose === 1 ? run : POSES.idle
    this.heroes.push({ look: g.hero === 'memo' ? 'memo' : 'uktun', pose: body, x: x + 6, y: y + 14, flip: code >= 8, alpha, ghost: true, moving: pose === 1, sx: 1, sy: 1 })
  }

  /** Karakterler büyütülmüş ana tuvalde, ekran çözünürlüğünde: oyun dünyası piksel, karakter elle çizilmiş */
  private drawHeroes(cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    for (const h of this.heroes) {
      c.save()
      c.globalAlpha = h.alpha
      if (h.ghost) c.filter = 'saturate(0.35) brightness(1.25)'
      drawHero(c, h.look, h.pose, (h.x - cx) * sc, (h.y - cy) * sc, HERO_SIZE * sc, h.flip, this.t, { moving: h.moving, sx: h.sx, sy: h.sy, scarf: h.scarf, scarfS: h.scarfS })
      c.restore()
    }
    this.heroes = []
  }

  private drawPlayer(w: World, dt: number) {
    const p = w.player
    const look = this.character.id
    // atılma izi: karakterin soluk kopyaları
    if (p.dashTime > 0 && !p.dead) this.ghosts.push({ x: p.x, y: p.y, life: 0.22, flip: p.facing < 0 })
    for (const g of this.ghosts) {
      g.life -= dt
      if (g.life > 0) this.heroes.push({ look, pose: POSES.dash, x: g.x + p.w / 2, y: g.y + p.h, flip: g.flip, alpha: g.life * 2, ghost: true, moving: true, sx: 1, sy: 1 })
    }
    this.ghosts = this.ghosts.filter((g) => g.life > 0)
    if (p.dead) return

    // uzun bekleyince el sallar; sert iniş için düşüş hızı izlenir
    const still = p.grounded && Math.abs(p.vx) < 5 && p.dashTime <= 0
    this.idleT = still ? this.idleT + dt : 0
    if (!p.grounded) this.airVy = Math.max(this.airVy, p.vy)

    // poz: koşu, koşu süresinden sürekli hesaplanır (kare atlamadan akar)
    let pose: Pose
    if (p.dashTime > 0) pose = POSES.dash
    else if (!p.grounded) pose = p.wallDir !== 0 && p.vy > 0 ? POSES.wall : p.vy < -70 ? POSES.jump : p.vy < 70 ? POSES.apex : POSES.fall
    else if (p.landTimer > 0.05) pose = POSES.land
    else if (Math.abs(p.vx) > 8) pose = gait(((p.runTime * 15) / 8) % 1)
    else if (this.idleT > 5 && (this.idleT - 5) % 7 < 1.6) {
      const wv = Math.sin(this.idleT * 13) * 22
      pose = { ...POSES.wave, arms: [POSES.wave.arms[0], [POSES.wave.arms[1][0], POSES.wave.arms[1][1] + wv]] }
    } else {
      // nefes: dizler hafifçe esner, gövde iner kalkar
      const br = 2 + 5 * (0.5 + 0.5 * Math.sin(this.t * 2.6))
      pose = { ...POSES.idle, legs: [[POSES.idle.legs[0][0], br], [POSES.idle.legs[1][0], br]] }
    }
    pose = { ...pose, blink: this.t % 3.4 < 0.12 }

    // esneme: zıplarken incelip uzar, konarken basılır (hacim korunur, abartısız)
    let kx = 1
    let ky = 1
    if (p.landTimer > 0) {
      const a = p.landTimer / 0.12
      kx = 1 + 0.18 * a
      ky = 1 - 0.14 * a
    } else if (!p.grounded && p.vy < -150) {
      kx = 0.92
      ky = 1.08
    } else if (p.dashTime > 0) {
      kx = Math.abs(p.dashDir[0]) > 0.5 ? 1.12 : 0.9
      ky = Math.abs(p.dashDir[0]) > 0.5 ? 0.9 : 1.12
    }
    const footX = p.x + p.w / 2
    const footY = p.y + p.h
    const moving = Math.abs(p.vx) > 40 || !p.grounded
    // atılma hakkı bitince atkı soluklaşır: ne zaman yeniden atılabileceğin görünür
    const spent = !p.canDash
    this.heroes.push({ look, pose, x: footX, y: footY, flip: p.facing < 0, alpha: 1, ghost: false, moving, sx: kx, sy: ky, scarf: spent ? '#7f8ca8' : undefined, scarfS: spent ? '#5a6680' : undefined })

    this.petTimer = Math.max(0, this.petTimer - dt)
    // koşu tozu ve duvar kayma kıvılcımı
    this.dustTimer -= dt
    if (this.dustTimer <= 0) {
      if (p.grounded && Math.abs(p.vx) > 60) {
        this.particles.push({ x: footX - p.facing * 5, y: footY - 1, vx: -p.facing * 20, vy: -18, life: 0.35, max: 0.35, color: 'rgba(230,220,200,0.7)', size: 1, grav: 40 })
        this.dustTimer = 0.09
      } else if (!p.grounded && p.wallDir !== 0 && p.vy > 20) {
        this.particles.push({ x: p.wallDir > 0 ? p.x + p.w : p.x, y: p.y + 4, vx: -p.wallDir * 15, vy: 10, life: 0.3, max: 0.3, color: 'rgba(255,240,200,0.8)', size: 1, grav: 60 })
        this.dustTimer = 0.06
      }
    }
  }

  private dustTimer = 0
  private petTimer = 0
  private drawParticles(b: Ctx, dt: number) {
    for (const pt of this.particles) {
      pt.life -= dt
      pt.vy += pt.grav * dt
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      if (pt.life <= 0) continue
      b.globalAlpha = Math.min(1, pt.life / 0.4)
      rect(b, pt.x, pt.y, pt.size, pt.size, pt.color)
    }
    b.globalAlpha = 1
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const pp of this.pops) pp.life -= dt
    this.pops = this.pops.filter((p) => p.life > 0)
  }

  private popFamily: string | null = null
  /** sayfanın piksel başlık fontu (next/font değişkeni); bulunamazsa eş aralıklı */
  private popFont() {
    if (this.popFamily === null) {
      const v = typeof document !== 'undefined' ? getComputedStyle(document.body).getPropertyValue('--font-pixel').trim() : ''
      this.popFamily = v ? `${v}, ui-monospace, monospace` : 'ui-monospace, monospace'
    }
    return this.popFamily
  }

  /** Kombo ve +1 yazıları: büyüyerek belirir, süzülerek kaybolur; ana tuvalde net çizilir */
  private drawPops(c: Ctx, cx: number, cy: number, sc: number) {
    if (!this.pops.length) return
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.lineJoin = 'round'
    for (const pp of this.pops) {
      const age = 0.9 - pp.life
      const grow = Math.min(1, age / 0.12)
      const size = Math.round(sc * (pp.big ? 6 : 4.5) * (0.6 + 0.4 * grow + (age < 0.18 ? 0.15 * Math.sin((age / 0.18) * Math.PI) : 0)))
      const x = (pp.x - cx) * sc
      const y = (pp.y - cy - age * 16) * sc
      c.globalAlpha = Math.min(1, pp.life / 0.3)
      c.font = `700 ${size}px ${this.popFont()}`
      c.lineWidth = Math.max(2, sc * 1.1)
      c.strokeStyle = '#120f1a'
      c.strokeText(pp.text, x, y)
      c.fillStyle = pp.color
      c.fillText(pp.text, x, y)
    }
    c.globalAlpha = 1
  }

  /** Dünya koordinatındaki etiketler net görünsün diye ana tuvalde çizilir */
  private drawLabels(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const e = w.exit
    const next = NEXT_CITY[w.level.city]
    const ex = (e.x + T / 2 - cx) * sc
    const ey = (e.y + e.h - 46 - cy) * sc
    this.drawPops(c, cx, cy, sc)
    if (ex > -200 && ex < this.canvas.width + 200) {
      const label = next ? `${next} →` : this.lang === 'en' ? 'LAST STOP' : 'SON DURAK'
      c.font = `700 ${Math.round(sc * 5)}px ui-monospace, monospace`
      const tw = c.measureText(label).width
      const pad = sc * 3
      c.fillStyle = '#1d4f91'
      c.fillRect(ex - tw / 2 - pad, ey - sc * 6, tw + pad * 2, sc * 9)
      c.strokeStyle = '#f4f4f4'
      c.lineWidth = Math.max(1, sc * 0.6)
      c.strokeRect(ex - tw / 2 - pad + sc, ey - sc * 5, tw + pad * 2 - sc * 2, sc * 7)
      c.fillStyle = '#ffffff'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(label, ex, ey - sc * 1.5)
    }
  }
}

/** karakterin dünya pikseli cinsinden boyu (çarpışma kutusu 12x14; kafa kutunun üstüne taşar) */
const HERO_SIZE = 29

interface HeroDraw {
  look: 'uktun' | 'memo'
  pose: Pose
  /** ayak tabanı orta noktası (dünya) */
  x: number
  y: number
  flip: boolean
  alpha: number
  ghost: boolean
  moving: boolean
  sx: number
  sy: number
  scarf?: string
  scarfS?: string
}

interface Pop {
  x: number
  y: number
  text: string
  color: string
  life: number
  big: boolean
}

const NEXT_CITY: Record<CityKey, string | null> = {
  istanbul: 'KOCAELİ',
  kocaeli: 'İZMİR',
  izmir: 'ANKARA',
  ankara: 'KONYA',
  konya: 'NEVŞEHİR',
  nevsehir: 'ADANA',
  adana: 'GAZİANTEP',
  gaziantep: 'MARDİN',
  mardin: 'MALATYA',
  malatya: 'ÇORUM',
  corum: 'ORDU',
  ordu: 'TRABZON',
  trabzon: 'SİVAS',
  sivas: 'ARDAHAN',
  ardahan: 'BAYBURT',
  bayburt: null,
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/* ── Ortak sprite dili: üstte ışık, altta gölge, yumuşak dış hat ─────────── */
const shadeCache = new Map<string, HTMLCanvasElement>()

function mixHex(hex: string, to: string, t: number) {
  if (hex[0] !== '#' || hex.length !== 7) return hex
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const ch = (sh: number) => Math.round(((a >> sh) & 255) + ((((b >> sh) & 255) - ((a >> sh) & 255)) * t))
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

/** Sprite'ı bir kez gölgeleyip önbelleğe alır: üstü açık pikseller ışık, altı açık pikseller gölge alır, çevresine dış hat çekilir. */
function shadedSprite(rows: string[], pal: Record<string, string>, outline: string | null) {
  const key = `${rows.join('|')}#${JSON.stringify(pal)}#${outline}`
  let cv = shadeCache.get(key)
  if (cv) return cv
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const on = (x: number, y: number) => y >= 0 && y < h && x >= 0 && x < (rows[y]?.length ?? 0) && rows[y][x] !== '.' && !!pal[rows[y][x]]
  cv = document.createElement('canvas')
  cv.width = w + 2
  cv.height = h + 2
  const c = cv.getContext('2d')!
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) {
        let col = pal[rows[y][x]]
        if (!on(x, y - 1)) col = mixHex(col, '#fff4dc', 0.24)
        else if (!on(x, y + 1) || !on(x + 1, y + 1)) col = mixHex(col, '#120c18', 0.26)
        c.fillStyle = col
        c.fillRect(x + 1, y + 1, 1, 1)
      } else if (outline && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) {
        c.fillStyle = outline
        c.fillRect(x + 1, y + 1, 1, 1)
      }
    }
  if (shadeCache.size > 600) shadeCache.clear()
  shadeCache.set(key, cv)
  return cv
}

function drawShaded(b: Ctx, rows: string[], pal: Record<string, string>, x: number, y: number, flip = false, outline: string | null = null) {
  const cv = shadedSprite(rows, pal, outline)
  const dx = Math.round(x) - 1
  const dy = Math.round(y) - 1
  if (!flip) return b.drawImage(cv, dx, dy)
  b.save()
  b.translate(dx + cv.width, dy)
  b.scale(-1, 1)
  b.drawImage(cv, 0, 0)
  b.restore()
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + 40)
  const g = Math.min(255, ((n >> 8) & 255) + 40)
  const b = Math.min(255, (n & 255) + 40)
  return `rgb(${r},${g},${b})`
}
