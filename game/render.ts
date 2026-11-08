import { CITY, ITEM_ART, LAYER_H, LAYER_W, buildLayers, disc, enemyArt, rect, rng, sprite, type Ctx, type Layers } from './art'
import { CHARACTERS, frameRows, type CharacterDef, type Pose } from './characters'
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
    this.ghosts = []
    this.initAmbient()
    const p = world.player
    this.camX = p.x - this.viewW / 2
    this.camY = p.y - this.viewH / 2
    this.clampCam(world)
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
          rect(c, x, y, T, 4, s.plank)
          rect(c, x, y, T, 1, lighten(s.plank))
          rect(c, x, y + 4, T, 1, 'rgba(0,0,0,0.35)')
          if (tx % 2 === 0) rect(c, x + 7, y + 5, 2, 4, 'rgba(0,0,0,0.25)')
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
      case 'walljump':
        this.burst(p.x + p.w / 2, p.y + p.h, 5, 'rgba(240,230,210,0.8)', 30, 1)
        break
      case 'land':
        this.burst(p.x + p.w / 2, p.y + p.h, 4, 'rgba(240,230,210,0.7)', 25, 1)
        break
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
        break
      case 'checkpoint':
        this.burst(p.x + p.w / 2, p.y, 14, s.accent, 70, 1)
        break
      case 'spring':
        this.burst(p.x + p.w / 2, p.y + p.h, 8, '#ffd36a', 50, 1)
        break
      case 'stomp':
        this.shake = Math.max(this.shake, 2)
        this.burst(e.x, e.y, 12, '#f4f0e6', 70, 1)
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

    // gökyüzü
    const g = b.createLinearGradient(0, 0, 0, this.viewH)
    g.addColorStop(0, s.sky[0])
    g.addColorStop(0.6, s.sky[1])
    g.addColorStop(1, s.sky[2])
    b.fillStyle = g
    b.fillRect(0, 0, this.viewW, this.viewH)

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
      if (this.city === 'istanbul') this.drawBosphorus(b, layerY(0.13) + LAYER_H - 70, cx)
      drawLayer(this.layers.mid, 0.25, 0.18)
      drawLayer(this.layers.near, 0.45, 0.32)
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
    this.drawPlayer(b, w, dt)
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
      sprite(b, bob ? ['............', ...art.rows.slice(0, -1).filter((_, k) => k !== 6), art.rows[art.rows.length - 1]] : art.rows, art.pal, n.x + 2, n.y + T - art.rows.length, faceLeft)
      // konuşma balonu
      const near = w.nearNpc === i
      const by = n.y + T - art.rows.length - 9 - (near ? 0 : Math.round(Math.sin(this.t * 3 + i)))
      rect(b, n.x + 3, by, 10, 7, near ? '#ffd36a' : '#f4ead8')
      rect(b, n.x + 6, by + 7, 2, 2, near ? '#ffd36a' : '#f4ead8')
      for (let d = 0; d < 3; d++) rect(b, n.x + 5 + d * 2, by + 3, 1, 1, '#2a2236')
    })
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

  /** Şehrin kendine özgü küçük nesnesi: bölümü her yerde o şehre bağlar. */
  private drawLandmarkProp(b: Ctx, x: number, bot: number) {
    switch (this.city) {
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
        const shakeX = st ? Math.round((Math.random() - 0.5) * 2) : 0
        const x = tx * T + shakeX
        const y = ty * T
        rect(b, x, y, T, 10, s.tileLight)
        rect(b, x, y, T, 2, s.tileTop)
        rect(b, x, y + 10, T, 2, s.tileDark)
        rect(b, x + 5, y + 2, 1, 4, s.tileDark)
        rect(b, x + 6, y + 5, 3, 1, s.tileDark)
        rect(b, x + 11, y + 4, 1, 5, s.tileDark)
      }
  }

  private drawWater(b: Ctx, w: World, cx: number, cy: number) {
    const s = CITY[this.city]
    const x0 = Math.floor(cx / T)
    const x1 = Math.ceil((cx + this.viewW) / T)
    for (let ty = 0; ty < w.rows; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (w.tile(tx, ty) !== WATER) continue
        const surface = w.tile(tx, ty - 1) !== WATER
        const x = tx * T
        const y = ty * T
        rect(b, x, y + (surface ? 6 : 0), T, T - (surface ? 6 : 0), s.water[ty % 2 ? 1 : 0])
        if (surface) {
          for (let i = 0; i < 16; i++) {
            const h = Math.round(Math.sin(this.t * 3 + (x + i) * 0.35) * 1.2)
            rect(b, x + i, y + 6 + h, 1, 2, s.water[2])
          }
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
      rect(b, pl.x, pl.y, pl.w, 6, s.plank)
      rect(b, pl.x, pl.y, pl.w, 1, lighten(s.plank))
      rect(b, pl.x, pl.y + 5, pl.w, 1, 'rgba(0,0,0,0.4)')
      for (let i = 4; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 2, 1, 2, 'rgba(0,0,0,0.25)')
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
      sprite(b, art.rows, art.pal, c.x, c.y + bob)
      if (Math.sin(this.t * 5 + c.index * 2) > 0.92) rect(b, c.x + 8, c.y + bob - 1, 1, 1, '#ffffff')
    }
    // bayraklar
    for (const cp of w.checkpoints) {
      const x = cp.x
      const bot = cp.y + cp.h
      rect(b, x + 3, bot - 28, 2, 28, '#c8c4cc')
      rect(b, x + 1, bot - 2, 6, 2, '#5a5468')
      if (cp.active) {
        const wv = Math.sin(this.t * 6) > 0 ? 1 : 0
        rect(b, x + 5, bot - 28, 10, 7, '#e30a17')
        rect(b, x + 15, bot - 27 + wv, 1, 5, '#e30a17')
        disc(b, x + 9, bot - 25, 2, '#ffffff')
        disc(b, x + 10, bot - 25, 1, '#e30a17')
        rect(b, x + 12, bot - 25, 1, 1, '#ffffff')
      } else {
        rect(b, x + 5, bot - 14, 9, 6, '#6f7a86')
        rect(b, x + 14, bot - 13, 1, 4, '#6f7a86')
      }
    }
    // çıkış kapısı
    this.drawExit(b, w)
    // düşmanlar
    for (const e of w.enemies) {
      if (!e.alive) continue
      const art = enemyArt(e.kind, this.city)
      const speed = e.kind === 'fly' || e.kind === 'bat' ? 8 : e.state === 'charge' ? 14 : 6
      const f = Math.abs(Math.floor(e.phase * speed)) % art.frames.length
      const rows = art.frames[f]
      const shake = e.state === 'windup' ? Math.round(Math.sin(this.t * 60)) : 0
      const squash = e.kind === 'hopper' && e.state === 'windup' ? 2 : 0
      const sx = e.x + shake
      const sy = e.y + squash + (e.state === 'stun' ? 1 : 0)
      const flip = e.dir > 0
      // gölge
      if (e.kind !== 'fly' && e.kind !== 'bat') rect(b, e.x + 1, e.y + e.h - 1, e.w - 2, 1, 'rgba(0,0,0,0.3)')
      // tehlike dış hattı: arka plandan ayrışsın
      const outline: Record<string, string> = {}
      const pulse = Math.sin(this.t * 5 + e.ox * 0.1) > 0.2
      for (const k of Object.keys(art.pal)) outline[k] = e.kind === 'spiky' ? '#ff4a3a' : pulse ? '#e8283a' : '#5a0f1a'
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) sprite(b, rows, outline, sx + ox, sy + oy, flip)
      sprite(b, rows, art.pal, sx, sy, flip)
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

  private drawPlayer(b: Ctx, w: World, dt: number) {
    const p = w.player
    const ch = this.character
    // atılma izi: karakterin beyaz silueti
    if (p.dashTime > 0 && !p.dead) this.ghosts.push({ x: p.x, y: p.y, life: 0.22, flip: p.facing < 0 })
    const ghostPal: Record<string, string> = {}
    for (const k of Object.keys(ch.pal)) ghostPal[k] = '#f4ead8'
    for (const g of this.ghosts) {
      g.life -= dt
      if (g.life <= 0) continue
      b.globalAlpha = g.life * 2.5
      sprite(b, frameRows(ch, 'jump', 0), ghostPal, g.x + p.w / 2 - 8, g.y + p.h - 20, g.flip)
    }
    b.globalAlpha = 1
    this.ghosts = this.ghosts.filter((g) => g.life > 0)
    if (p.dead) return

    let pose: Pose = 'idle'
    let bob = 0
    if (!p.grounded) {
      if (p.wallDir !== 0 && p.vy > 0) pose = 'wall'
      else pose = p.vy < 0 ? 'jump' : 'fall'
    } else if (Math.abs(p.vx) > 8) {
      const f = Math.floor(p.runTime * 12) % 4
      pose = (['runA', 'runB', 'runC', 'runD'] as const)[f]
      bob = f % 2
    } else bob = Math.sin(this.t * 2.5) > 0.6 ? 1 : 0
    if (p.landTimer > 0) bob = 1
    const blink = this.t % 3.4 < 0.12

    const pal = p.canDash ? ch.pal : { ...ch.pal, r: '#7f8ca8', R: '#5a6680' }
    const flip = p.facing < 0
    const moving = Math.abs(p.vx) > 40 || !p.grounded
    const wave = Math.floor(this.t * (moving ? 12 : 4)) % 3

    // karakter önce küçük bir tuvale çizilir: koyu dış hat + gövde, sonra esnetilerek sahneye konur
    const pc = this.playerCanvas()
    const c = pc.getContext('2d')!
    c.clearRect(0, 0, pc.width, pc.height)
    const ox = 6
    const oy = 4
    const drawBody = (palette: Record<string, string>, dx: number, dy: number) => {
      if (ch.tail) {
        const rows = ch.tail.frames[moving ? wave : Math.floor(this.t * 2) % 2]
        sprite(c, rows, palette, (flip ? ox + 13 : ox - 1) + dx, oy + ch.tail.y + bob + dy, flip)
      }
      const neck = oy + 10 + bob + dy
      const back = (flip ? ox + 12 : ox + 1) + dx
      const dir = flip ? 1 : -1
      rect(c, back + dir, neck, 2, 1, palette.r)
      rect(c, back + dir * 2, neck + 1 + (wave === 1 ? 1 : 0), 2, 1, palette.R)
      if (moving) rect(c, back + dir * 3, neck + 1 - (wave === 2 ? 1 : 0), 2, 1, palette.r)
      sprite(c, frameRows(ch, pose, bob, blink), palette, ox + dx, oy + dy, flip)
    }
    const ink: Record<string, string> = {}
    for (const k of Object.keys(pal)) ink[k] = '#120f1a'
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) drawBody(ink, dx, dy)
    drawBody(pal, 0, 0)

    // esneme: zıplarken incelip uzar, konarken basılır (hacim korunur, abartısız)
    let kx = 1
    let ky = 1
    if (p.landTimer > 0) {
      const a = p.landTimer / 0.12
      kx = 1 + 0.18 * a
      ky = 1 - 0.14 * a
    } else if (!p.grounded && p.vy < -150) {
      kx = 0.9
      ky = 1.1
    } else if (p.dashTime > 0) {
      kx = Math.abs(p.dashDir[0]) > 0.5 ? 1.15 : 0.88
      ky = Math.abs(p.dashDir[0]) > 0.5 ? 0.88 : 1.15
    }
    const footX = p.x + p.w / 2
    const footY = p.y + p.h
    const dw = Math.round(pc.width * kx)
    const dh = Math.round(pc.height * ky)
    b.imageSmoothingEnabled = false
    b.drawImage(pc, Math.round(footX - dw / 2), Math.round(footY - (oy + 20) * ky), dw, dh)

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

  private pc: HTMLCanvasElement | null = null
  private dustTimer = 0
  private petTimer = 0
  private playerCanvas() {
    if (!this.pc) {
      this.pc = document.createElement('canvas')
      this.pc.width = 28
      this.pc.height = 28
    }
    return this.pc
  }

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
  }

  /** Dünya koordinatındaki etiketler net görünsün diye ana tuvalde çizilir */
  private drawLabels(w: World, cx: number, cy: number) {
    const c = this.ctx
    const sc = this.scale
    const e = w.exit
    const next = NEXT_CITY[w.level.city]
    const ex = (e.x + T / 2 - cx) * sc
    const ey = (e.y + e.h - 46 - cy) * sc
    if (ex > -200 && ex < this.canvas.width + 200) {
      const label = next ? `${next} →` : 'SON DURAK'
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
  ordu: 'SİVAS',
  sivas: 'ARDAHAN',
  ardahan: 'BAYBURT',
  bayburt: null,
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + 40)
  const g = Math.min(255, ((n >> 8) & 255) + 40)
  const b = Math.min(255, (n & 255) + 40)
  return `rgb(${r},${g},${b})`
}
