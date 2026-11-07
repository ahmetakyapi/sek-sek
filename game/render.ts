import { CITY, ITEM_ART, LAYER_H, LAYER_W, PLAYER_PAL, buildLayers, disc, enemyArt, playerFrame, rect, rng, sprite, type Ctx, type Layers } from './art'
import { CRUMBLE, EMPTY, ICE, ONEWAY, SOLID, SPIKE_DOWN, SPIKE_UP, TURRET, WATER, type World } from './sim'
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
  private dpr = 1
  private t = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.buf = document.createElement('canvas')
    this.b = this.buf.getContext('2d')!
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr
    const devW = Math.round(cssW * dpr)
    const devH = Math.round(cssH * dpr)
    this.canvas.width = devW
    this.canvas.height = devH
    const portrait = cssH > cssW
    // dikeyde ~13 tile genişlik, yatayda ~15 tile yükseklik
    const target = portrait ? Math.min(devW / (13 * T), devH / (20 * T)) : Math.min(devW / (22 * T), devH / (15 * T))
    this.scale = Math.max(1, Math.floor(target))
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
      return t === SOLID || t === TURRET || t === ICE
    }
    for (let ty = 0; ty < w.rows; ty++) {
      for (let tx = 0; tx < w.cols; tx++) {
        const t = w.tile(tx, ty)
        const x = tx * T
        const y = ty * T
        const open = ty > 0 && !solidish(tx, ty - 1) && w.tile(tx, ty - 1) !== CRUMBLE
        if (t === SOLID || t === TURRET) this.solidTile(c, x, y, tx, ty, open, !solidish(tx - 1, ty), !solidish(tx + 1, ty), r)
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

  private solidTile(c: Ctx, x: number, y: number, tx: number, ty: number, open: boolean, openL: boolean, openR: boolean, r: () => number) {
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
      case 'malatya': {
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
      case 'sivas':
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

    // vinyet
    const vg = b.createRadialGradient(this.viewW / 2, this.viewH / 2, Math.min(this.viewW, this.viewH) * 0.35, this.viewW / 2, this.viewH / 2, Math.max(this.viewW, this.viewH) * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(10,6,20,0.45)')
    b.fillStyle = vg
    b.fillRect(0, 0, this.viewW, this.viewH)

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
      rect(b, px, py, a.size, a.size, color)
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
          if (this.city === 'sivas' || this.city === 'bayburt') {
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
        case 'k':
          this.drawAnimal(b, x, bot)
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
  }

  private drawAnimal(b: Ctx, x: number, bot: number) {
    const tail = Math.sin(this.t * 3) > 0 ? 1 : 0
    switch (CITY[this.city].animal) {
      case 'cat':
        sprite(b, ['.o.o......', '.ooo......', '.oeo.....' + (tail ? 'o' : '.'), '.oooo...o' + (tail ? '.' : 'o'), '..ooooooo.', '..ooOooOo.', '..o.o..o..'], { o: '#e0903a', O: '#b06a24', e: '#2a2a2a' }, x + 2, bot - 7)
        break
      case 'donkey':
        sprite(b, ['g...........', 'gg..........', 'ggg.........', '.ggggggggg..', '..gggggggggg', '..wggggggg.g', '..g.g...g.g.', '..g.g...g.g.'], { g: '#7d7480', w: '#d8d0d4' }, x, bot - 8)
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
      rect(b, pl.x, pl.y, pl.w, 6, s.plank)
      rect(b, pl.x, pl.y, pl.w, 1, lighten(s.plank))
      rect(b, pl.x, pl.y + 5, pl.w, 1, 'rgba(0,0,0,0.4)')
      for (let i = 4; i < pl.w; i += 8) rect(b, pl.x + i, pl.y + 2, 1, 2, 'rgba(0,0,0,0.25)')
      if (this.city === 'istanbul') {
        // iskele dubaları
        rect(b, pl.x + 2, pl.y + 6, 6, 3, '#e8794a')
        rect(b, pl.x + pl.w - 8, pl.y + 6, 6, 3, '#e8794a')
      }
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
      const f = Math.abs(Math.floor(e.phase * (e.kind === "fly" ? 8 : 6))) % art.frames.length
      sprite(b, art.frames[f], art.pal, e.x, e.y - (e.kind === 'ground' ? 0 : 0), e.dir > 0)
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
    // atılma izi
    if (p.dashTime > 0 && !p.dead) this.ghosts.push({ x: p.x, y: p.y, life: 0.22, flip: p.facing < 0 })
    for (const g of this.ghosts) {
      g.life -= dt
      if (g.life <= 0) continue
      b.globalAlpha = g.life * 2.5
      sprite(b, playerFrame('jump'), { ...PLAYER_PAL, j: '#f4ead8', J: '#f4ead8', k: '#f4ead8', K: '#f4ead8', p: '#f4ead8', b: '#f4ead8', h: '#f4ead8', s: '#f4ead8', r: '#f4ead8', e: '#f4ead8' }, g.x - 1, g.y - 2, g.flip)
    }
    b.globalAlpha = 1
    this.ghosts = this.ghosts.filter((g) => g.life > 0)
    if (p.dead) return

    let state: Parameters<typeof playerFrame>[0] = 'idle'
    let bob = 0
    if (!p.grounded) {
      if (p.wallDir !== 0 && p.vy > 0) state = 'wall'
      else state = p.vy < 0 ? 'jump' : 'fall'
    } else if (Math.abs(p.vx) > 8) {
      const f = Math.floor(p.runTime * 12) % 4
      state = (['runA', 'runB', 'runC', 'runB'] as const)[f]
      bob = f % 2
    } else bob = Math.sin(this.t * 2.5) > 0.6 ? 1 : 0
    if (p.landTimer > 0) bob = 1

    const pal = p.canDash ? PLAYER_PAL : { ...PLAYER_PAL, r: '#7f8ca8' }
    const flip = p.facing < 0
    const sx = p.x - 1
    const sy = p.y + p.h - 16
    // atkı ucu
    const wave = Math.sin(this.t * 10) > 0 ? 1 : 0
    const tailX = flip ? sx + 9 : sx + 1
    const dir = flip ? 1 : -1
    rect(b, tailX + dir * 1, sy + 5 + bob, 2, 1, pal.r)
    rect(b, tailX + dir * 2, sy + 6 + bob + wave, 2, 1, pal.r)
    if (Math.abs(p.vx) > 40 || !p.grounded) rect(b, tailX + dir * 3, sy + 6 + bob - wave, 1, 1, pal.r)
    sprite(b, playerFrame(state, bob), pal, sx, sy, flip)
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
  istanbul: 'MARDİN',
  mardin: 'MALATYA',
  malatya: 'ÇORUM',
  corum: 'SİVAS',
  sivas: 'BAYBURT',
  bayburt: null,
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + 40)
  const g = Math.min(255, ((n >> 8) & 255) + 40)
  const b = Math.min(255, (n & 255) + 40)
  return `rgb(${r},${g},${b})`
}
