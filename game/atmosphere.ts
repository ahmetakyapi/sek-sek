/**
 * Atmosfer: "el boyaması, sıcak, sinematik" ışık katmanı (25 Kasım 2026, kullanıcı isteği).
 *
 * Dünyanın üstüne, yazıların altına üç şey biner:
 *  1. Işık haritası: düşük çözünürlükte (dünya tamponu boyunda) güneş parlaması, süzülen huzmeler, ufuk ışıltısı;
 *     ana tuvale yumuşak büyütmeyle ve `screen` karışımıyla tek kez basılır (kare başına tek tam ekran karışım).
 *  2. Renk tonu: şehrin ışık renginde `soft-light` dolgu + gölge renginde vinyet (köşeler ve alt kenar ağırlaşır).
 *  3. Süzülen şeyler: yaprak, taç yaprağı, kar, toz zerresi, ateş böceği; üç derinlikte, ekran çözünürlüğünde,
 *     önceden çizilmiş küçük imgelerle (kare başına yol çizimi yok). En öndekiler büyük ve bulanıktır (alan derinliği).
 *  4. Ön plan siluetleri: alt kenarda koyu, bulanık otlar ve eğrelti; kameradan hızlı kayar, oynanış alanına girmez.
 *
 * Her şey saate bağlıdır (kare hızından bağımsız); rastgelelik yalnız kurulurken, tohumlu.
 */
import { rng, type CityStyle } from './art'
import type { CityKey } from './types'

type Ctx = CanvasRenderingContext2D
type Kind = 'leaf' | 'petal' | 'snow' | 'mote' | 'firefly'

export interface Mood {
  /** ana ışığın rengi (güneş, ufuk ışıltısı, renk tonu) */
  key: [number, number, number]
  /** gölge rengi (vinyet, ön plan) */
  shade: [number, number, number]
  /** güneşin ekrandaki yeri (oran); güneşsiz şehirde gökten yayılan ışık */
  sun: { x: number; y: number } | null
  /** ışığın gücü 0..1 */
  power: number
  /** süzülenlerin türü (yağmur ve fırtına kendi çizimini korur, burada ek olarak toz) */
  drift: Kind[]
}

function hex(h: string): [number, number, number] {
  const m = h.match(/^#?([0-9a-f]{6})$/i)
  if (!m) {
    const n = h.match(/\d+(\.\d+)?/g)
    return n ? [Number(n[0]), Number(n[1]), Number(n[2])] : [255, 230, 190]
  }
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]
const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`

/** Şehrin paletinden ışık: altın saat sıcaklığı, gölgede mor-kahve; kar ve yağmurda serin ve kısık. */
export function moodOf(s: CityStyle): Mood {
  const golden: [number, number, number] = [255, 196, 120]
  const horizon = hex(s.sky[2])
  const top = hex(s.sky[0])
  const sunCol = s.sun ? hex(s.sun.color) : horizon
  const cold = s.weather === 'snow' || s.weather === 'storm'
  const wet = s.weather === 'rain'
  const key = cold ? mix(sunCol, [230, 236, 255], 0.5) : wet ? mix(horizon, golden, 0.25) : mix(sunCol, golden, 0.55)
  const shade = mix(top, [40, 22, 48], 0.6)
  const drift: Kind[] =
    s.weather === 'snow' || s.weather === 'storm'
      ? ['snow', 'mote']
      : s.weather === 'petals'
        ? ['petal', 'mote']
        : s.weather === 'leaves'
          ? ['leaf', 'mote']
          : s.weather === 'rain'
            ? ['mote']
            : s.weather === 'gulls'
              ? ['mote', 'leaf']
              : ['mote', 'mote', 'leaf']
  return {
    key,
    shade,
    sun: s.sun ? { x: s.sun.x, y: 0.12 + s.sun.y * 0.3 } : null,
    power: cold ? 0.55 : wet ? 0.35 : 1,
    drift,
  }
}

interface Mite {
  kind: Kind
  /** derinlik 0 uzak, 1 orta, 2 ön (büyük, bulanık) */
  z: number
  x: number
  y: number
  phase: number
  speed: number
  spin: number
  hue: number
}

/** Süzülenlerin hızı ve sallanışı (ekran CSS pikseli / sn); test edilebilir saf hesap */
export function driftAt(kind: Kind, t: number, m: { phase: number; speed: number }): { dx: number; dy: number } {
  const p = m.phase + t
  switch (kind) {
    case 'leaf':
      return { dx: 18 * m.speed + Math.sin(p * 1.1) * 14, dy: 14 * m.speed + Math.cos(p * 1.7) * 6 }
    case 'petal':
      return { dx: 14 * m.speed + Math.sin(p * 1.6) * 10, dy: 10 * m.speed + Math.cos(p * 1.2) * 5 }
    case 'snow':
      return { dx: Math.sin(p * 0.9) * 9, dy: 16 * m.speed }
    case 'firefly':
      return { dx: Math.sin(p * 0.7) * 10, dy: Math.cos(p * 0.9) * 8 }
    default:
      return { dx: 4 * m.speed + Math.sin(p * 0.5) * 3, dy: -2 * m.speed + Math.cos(p * 0.6) * 3 }
  }
}

const LEAF_COLORS = ['#e8742a', '#d8452a', '#f0a830', '#b8582a', '#e8c040']
const PETAL_COLORS = ['#ffe0ea', '#ffc8d8', '#fff4f4', '#ffd2a8']

export class Atmosphere {
  private city: CityKey
  private lightCv: HTMLCanvasElement
  private l: Ctx
  private mites: Mite[] = []
  private sprites = new Map<string, HTMLCanvasElement>()
  private fores = new Map<string, HTMLCanvasElement>()

  readonly mood: Mood

  constructor(city: CityKey, style: CityStyle) {
    this.city = city
    this.mood = moodOf(style)
    this.lightCv = document.createElement('canvas')
    this.l = this.lightCv.getContext('2d')!
    const r = rng(city.length * 977 + city.charCodeAt(0) * 31)
    for (let i = 0; i < 46; i++) {
      const z = i < 22 ? 0 : i < 40 ? 1 : 2
      this.mites.push({
        kind: this.mood.drift[Math.floor(r() * this.mood.drift.length)],
        z,
        x: r(),
        y: r(),
        phase: r() * 20,
        speed: 0.6 + r() * 0.8,
        spin: (r() - 0.5) * 3,
        hue: Math.floor(r() * 5),
      })
    }
  }

  /** küçük önceden çizilmiş imge: yumuşak ışık zerresi, yaprak, taç yaprağı, kar tanesi */
  private sprite(kind: Kind, hue: number, size: number, blur: number): HTMLCanvasElement {
    const key = `${kind}:${hue}:${size}:${blur}`
    let cv = this.sprites.get(key)
    if (cv) return cv
    const pad = Math.ceil(blur * 2) + 2
    const S = size * 2 + pad * 2
    cv = document.createElement('canvas')
    cv.width = cv.height = S
    const c = cv.getContext('2d')!
    if (blur > 0) c.filter = `blur(${blur}px)`
    c.translate(S / 2, S / 2)
    if (kind === 'mote' || kind === 'firefly') {
      const col = kind === 'firefly' ? [255, 236, 140] : this.mood.key
      const g = c.createRadialGradient(0, 0, 0, 0, 0, size)
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.95)`)
      g.addColorStop(0.35, `rgba(${col[0]},${col[1]},${col[2]},0.45)`)
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`)
      c.fillStyle = g
      c.beginPath()
      c.arc(0, 0, size, 0, Math.PI * 2)
      c.fill()
    } else if (kind === 'snow') {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, size)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.6, 'rgba(240,246,255,0.7)')
      g.addColorStop(1, 'rgba(240,246,255,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(0, 0, size, 0, Math.PI * 2)
      c.fill()
    } else {
      // yaprak / taç yaprağı: iki tonlu, ortası damarlı, sol üstten ışık
      const base = kind === 'leaf' ? LEAF_COLORS[hue % LEAF_COLORS.length] : PETAL_COLORS[hue % PETAL_COLORS.length]
      c.fillStyle = base
      c.beginPath()
      c.moveTo(-size, 0)
      c.quadraticCurveTo(-size * 0.2, -size * (kind === 'leaf' ? 0.62 : 0.8), size, 0)
      c.quadraticCurveTo(-size * 0.2, size * (kind === 'leaf' ? 0.62 : 0.8), -size, 0)
      c.fill()
      c.fillStyle = 'rgba(255,255,255,0.28)'
      c.beginPath()
      c.moveTo(-size * 0.8, -size * 0.05)
      c.quadraticCurveTo(-size * 0.1, -size * 0.5, size * 0.8, -size * 0.05)
      c.quadraticCurveTo(0, -size * 0.12, -size * 0.8, -size * 0.05)
      c.fill()
      if (kind === 'leaf') {
        c.strokeStyle = 'rgba(80,30,10,0.45)'
        c.lineWidth = Math.max(1, size * 0.08)
        c.beginPath()
        c.moveTo(-size * 0.9, 0)
        c.lineTo(size * 0.85, 0)
        c.stroke()
      }
    }
    this.sprites.set(key, cv)
    return cv
  }

  /** ön plan: koyu, bulanık otlar ve eğrelti şeridi (bir kez çizilir; ekran boyu değişince yeniden) */
  private foreground(W: number, H: number): HTMLCanvasElement {
    const key = `${W}x${H}`
    const hit = this.fores.get(key)
    if (hit) return hit
    const h = Math.round(H * 0.16)
    const w = Math.round(W * 1.5)
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const c = cv.getContext('2d')!
    c.filter = `blur(${Math.max(1, Math.round(H / 300))}px)`
    const r = rng(this.city.length * 131 + 7)
    const sh = this.mood.shade
    const dark = rgba(mix(sh, [16, 10, 8], 0.88), 1)
    const mid = rgba(mix(mix(sh, [16, 10, 8], 0.7), this.mood.key, 0.14), 1)
    // kümeler arasında boşluk: alt kenar boydan boya kapanmaz
    let x = r() * w * 0.2
    while (x < w) {
      const cw = w * (0.05 + r() * 0.07)
      const tall = h * (0.45 + r() * 0.5)
      // eğrelti yaprakları: kavisli sap, iki yanında küçülen yaprakçıklar
      for (let k = 0; k < 7; k++) {
        const bx = x + r() * cw
        const len = tall * (0.55 + r() * 0.5)
        const dir = r() < 0.5 ? -1 : 1
        const bend = (0.5 + r() * 0.7) * dir
        c.fillStyle = k % 3 === 0 ? mid : dark
        c.strokeStyle = c.fillStyle
        c.lineWidth = Math.max(1.5, h * 0.015)
        const at = (u: number) => [bx + Math.sin(u * 1.2) * len * 0.5 * bend, h + 2 - Math.sin(u * 1.35) * len] as const
        c.beginPath()
        for (let u = 0; u <= 1.0001; u += 0.1) {
          const [px, py] = at(u)
          if (u === 0) c.moveTo(px, py)
          else c.lineTo(px, py)
        }
        c.stroke()
        for (let u = 0.12; u < 1; u += 0.075) {
          const [px, py] = at(u)
          const [qx, qy] = at(u + 0.02)
          const ang = Math.atan2(qy - py, qx - px)
          const leaf = len * 0.22 * (1 - u * 0.7)
          for (const side of [-1, 1]) {
            c.save()
            c.translate(px, py)
            c.rotate(ang + side * 1.1)
            c.beginPath()
            c.ellipse(leaf * 0.55, 0, leaf * 0.62, leaf * 0.26, 0, 0, Math.PI * 2)
            c.fill()
            c.restore()
          }
        }
      }
      // dibinde sık ot: ince, sivri yapraklar ve yuvarlak çalı gövdesi (sap aralarını kapatır)
      c.fillStyle = dark
      for (let k = 0; k < 26; k++) {
        const bx = x - cw * 0.1 + r() * cw * 1.2
        const bh = tall * (0.25 + r() * 0.45)
        const lean = (r() - 0.5) * bh * 0.8
        const bw = Math.max(2, h * 0.025)
        c.beginPath()
        c.moveTo(bx - bw, h + 2)
        c.quadraticCurveTo(bx + lean * 0.4, h - bh * 0.55, bx + lean, h - bh)
        c.quadraticCurveTo(bx + lean * 0.4 + bw * 0.5, h - bh * 0.5, bx + bw, h + 2)
        c.fill()
      }
      c.beginPath()
      c.ellipse(x + cw / 2, h + 2, cw * 0.6, tall * 0.28, 0, Math.PI, 0)
      c.fill()
      x += cw + w * (0.12 + r() * 0.22)
    }
    this.fores.set(key, cv)
    return cv
  }

  /**
   * Işık, renk tonu ve vinyet düşük çözünürlüklü tek bir örtüde (dünya tamponu boyunda) birleşir (`light`), sonra
   * `overlay` ile tek seferde basılır. Ayrı ayrı `screen`, `soft-light`, `multiply` ve vinyet geçişleri tam
   * çözünürlükte kare başına ~30 ms tutuyordu (verify-perf, yazılımla çizen tarayıcı).
   */
  light(vw: number, vh: number, t: number, night: number, lamps: number[]) {
    const m = this.mood
    const L = this.lightCv
    if (L.width !== vw || L.height !== vh) {
      L.width = vw
      L.height = vh
    }
    const l = this.l
    l.globalCompositeOperation = 'source-over'
    l.clearRect(0, 0, vw, vh)
    const p = m.power * (1 - night * 0.7)
    const sx = (m.sun?.x ?? 0.5) * vw
    const sy = (m.sun?.y ?? -0.1) * vh
    // gölge: vinyet (köşeler) ve alt kenar ağırlığı, gölge renginde
    const vg = l.createRadialGradient(vw / 2, vh * 0.45, vh * 0.35, vw / 2, vh * 0.45, Math.max(vw, vh) * 0.78)
    vg.addColorStop(0, rgba(m.shade, 0))
    vg.addColorStop(1, rgba(m.shade, 0.38))
    l.fillStyle = vg
    l.fillRect(0, 0, vw, vh)
    const bot = l.createLinearGradient(0, vh * 0.55, 0, vh)
    bot.addColorStop(0, rgba(m.shade, 0))
    bot.addColorStop(1, rgba(m.shade, 0.3))
    l.fillStyle = bot
    l.fillRect(0, vh * 0.55, vw, vh * 0.45)
    // ışık: güneş parlaması, huzmeler, ufuk ışıltısı, fenerler (gölgenin üstüne biner)
    const R = vw * (m.sun ? 0.55 : 0.8)
    const g = l.createRadialGradient(sx, sy, 0, sx, sy, R)
    g.addColorStop(0, rgba(m.key, 0.22 * p))
    g.addColorStop(0.25, rgba(m.key, 0.07 * p))
    g.addColorStop(1, rgba(m.key, 0))
    l.fillStyle = g
    l.fillRect(0, 0, vw, vh)
    // genel ılık ton: ekranın üstü ışık renginde hafifçe ısınır
    const warm = l.createLinearGradient(0, 0, 0, vh * 0.6)
    warm.addColorStop(0, rgba(m.key, 0.05 * (0.5 + 0.5 * p)))
    warm.addColorStop(1, rgba(m.key, 0))
    l.fillStyle = warm
    l.fillRect(0, 0, vw, vh * 0.6)
    if (m.sun) {
      for (let i = 0; i < 6; i++) {
        const a = -0.75 + i * 0.3 + Math.sin(t * 0.11 + i * 1.7) * 0.04
        const wdt = 0.045 + (i % 3) * 0.02
        const len = vh * 1.6
        const breath = 0.5 + 0.5 * Math.sin(t * 0.23 + i * 2.1)
        const ex = sx + Math.sin(a) * len
        const ey = sy + Math.cos(a) * len
        const lg = l.createLinearGradient(sx, sy, ex, ey)
        lg.addColorStop(0, rgba(m.key, (0.05 + 0.04 * breath) * p))
        lg.addColorStop(0.55, rgba(m.key, 0.02 * breath * p))
        lg.addColorStop(1, rgba(m.key, 0))
        l.fillStyle = lg
        l.beginPath()
        l.moveTo(sx, sy)
        l.lineTo(sx + Math.sin(a - wdt) * len, sy + Math.cos(a - wdt) * len)
        l.lineTo(sx + Math.sin(a + wdt) * len, sy + Math.cos(a + wdt) * len)
        l.closePath()
        l.fill()
      }
    }
    // fenerler: sıcak, yumuşak hale (videodaki fener ışığı gibi); gece ve gölgeli şehirde daha belirgin
    const lampA = 0.32 + night * 0.3 + (1 - m.power) * 0.2
    for (let i = 0; i < lamps.length; i += 2) {
      const lx = lamps[i]
      const ly = lamps[i + 1]
      const flick = 0.92 + 0.08 * Math.sin(t * 7.3 + i * 1.7) * Math.sin(t * 3.1 + i)
      const lg = l.createRadialGradient(lx, ly, 0, lx, ly, 34)
      lg.addColorStop(0, `rgba(255,200,110,${(lampA * flick).toFixed(3)})`)
      lg.addColorStop(0.3, `rgba(255,170,80,${(lampA * 0.35 * flick).toFixed(3)})`)
      lg.addColorStop(1, 'rgba(255,150,60,0)')
      l.fillStyle = lg
      l.fillRect(lx - 34, ly - 34, 68, 68)
    }

    this.lightPower = p
  }

  private lightPower = 1

  /**
   * Işık örtüsünü hedefe basar: temel kademede dünya tamponuna (aynı boy, ek ölçek yok), zengin kademede ana tuvale
   * yumuşak büyütülerek ve önce tam çözünürlükte ılık yumuşak ışık (`soft-light`) tonuyla.
   */
  overlay(c: Ctx, W: number, H: number) {
    const L = this.lightCv
    c.save()
    if (W !== L.width) {
      c.globalCompositeOperation = 'soft-light'
      c.fillStyle = rgba(this.mood.key, 0.12 * (0.6 + 0.4 * this.lightPower))
      c.fillRect(0, 0, W, H)
      c.globalCompositeOperation = 'source-over'
      c.imageSmoothingEnabled = true
      c.imageSmoothingQuality = 'low'
    }
    c.drawImage(L, 0, 0, L.width, L.height, 0, 0, W, H)
    c.restore()
  }

  /**
   * Ön plan otları düşük çözünürlüklü tampona (temel kademe): zaten bulanık olduklarından büyütme fark edilmez, kare
   * başına tam çözünürlükte geniş bir şerit basılmaz. camX dünya pikseli.
   */
  foreLow(f: Ctx, vw: number, vh: number, camX: number) {
    const fg = this.foreground(vw, vh)
    let fx = -((camX * 1.35) % fg.width)
    if (fx > 0) fx -= fg.width
    f.imageSmoothingEnabled = true
    for (; fx < vw; fx += fg.width) f.drawImage(fg, fx, vh - fg.height)
    f.imageSmoothingEnabled = false
  }

  /**
   * Önde süzülenler (ana tuval, cihaz pikseli; temel kademede yalnız orta derinlik); zengin kademede (`rich`) ek olarak en uzak ve en yakın katman, ışık zerrelerinin
   * parlayan (`lighter`) karışımı ve tam çözünürlükte ön plan otları.
   */
  front(c: Ctx, W: number, H: number, t: number, camX: number, camY: number, scale: number, dpr: number, night: number, rich: boolean) {
    // süzülenler: üç derinlik; ekranın etrafında sarılır, kamerayla derinliğine göre kayar
    const css = dpr
    const par = [0.25, 0.55, 1.3]
    const sizes = [3, 5, 11]
    const blurs = [0, 1, 4]
    const alphas = [0.55, 0.8, 0.55]
    for (const mt of this.mites) {
      if ((mt.kind === 'firefly' && night < 0.3) || (!rich && mt.z !== 1)) continue
      const d = driftAt(mt.kind, t, mt)
      const span = W + 80 * css
      const spanY = H + 80 * css
      const ox = mt.x * span + t * d.dx * css - camX * scale * par[mt.z] * 0.35
      const oy = mt.y * spanY + t * (mt.kind === 'mote' ? 0 : 1) * d.dy * css - camY * scale * par[mt.z] * 0.25
      const px = (((ox % span) + span) % span) - 40 * css
      let py = (((oy % spanY) + spanY) % spanY) - 40 * css
      if (mt.kind === 'mote') py += Math.sin(t * 0.6 + mt.phase) * 10 * css
      const size = Math.round(sizes[mt.z] * css * (mt.kind === 'mote' ? 1.4 : 1))
      const img = this.sprite(mt.kind, mt.hue, size, Math.round(blurs[mt.z] * css))
      const twinkle = mt.kind === 'mote' ? 0.55 + 0.45 * Math.sin(t * 1.3 + mt.phase * 3) : 1
      c.globalAlpha = alphas[mt.z] * twinkle
      if (mt.kind === 'leaf' || mt.kind === 'petal') {
        // takla atarken incelir (yaprak döner); dönüş matrisi doğrudan kurulur (save/restore yok)
        const ang = t * mt.spin + mt.phase
        const flip = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + Math.abs(mt.spin) * 0.4) + mt.phase))
        const co = Math.cos(ang)
        const si = Math.sin(ang)
        c.setTransform(co, si, -si * flip, co * flip, px, py)
        c.drawImage(img, -img.width / 2, -img.height / 2)
        c.setTransform(1, 0, 0, 1, 0, 0)
      } else {
        if (rich && mt.kind === 'mote') c.globalCompositeOperation = 'lighter'
        c.drawImage(img, px - img.width / 2, py - img.height / 2)
        c.globalCompositeOperation = 'source-over'
      }
    }
    c.globalAlpha = 1

    // ön plan siluetleri: kameradan hızlı kayar (alan derinliği)
    if (!rich) return
    const fg = this.foreground(W, H)
    let fx = -((camX * scale * 1.35) % fg.width)
    if (fx > 0) fx -= fg.width
    const fy = H - fg.height
    for (; fx < W; fx += fg.width) c.drawImage(fg, Math.round(fx), fy)
  }
}

/**
 * Arka plan katmanına boya hacmi verir (katman başına bir kez, şehir yüklenirken): güneşe bakan üst kenarlar ışık
 * renginde yanar (kenar ışığı), şekiller yukarıda ılık, aşağıda gölge renginde koyulaşır, yüzeye ince fırça
 * dokusu düşer. `depth` 0 uzak (soluk, pus) … 1 yakın (koyu, doygun).
 */
export function paintLayer(cv: HTMLCanvasElement, mood: Mood, depth: number, seed: number) {
  const c = cv.getContext('2d')!
  const W = cv.width
  const H = cv.height
  const img = c.getImageData(0, 0, W, H)
  const d = img.data
  const [kr, kg, kb] = mood.key
  const [sr, sg, sb] = mood.shade
  const rim = 0.5 - depth * 0.15
  const r = rng(seed)
  // fırça dokusu: 3x2'lik lekeler (yatay fırça darbesi gibi), tohumlu
  const grain = new Float32Array(Math.ceil(W / 3) * Math.ceil(H / 2))
  for (let i = 0; i < grain.length; i++) grain[i] = (r() - 0.5) * (0.07 + depth * 0.03)
  const gw = Math.ceil(W / 3)
  // her sütunda şeklin tepesini bul: gölgelenme şeklin kendi boyuna göre (tepede ışık, dipte gölge)
  for (let x = 0; x < W; x++) {
    let top = -1
    for (let y = 0; y < H; y++) {
      const k = (y * W + x) * 4
      if (d[k + 3] === 0) {
        top = -1
        continue
      }
      if (top < 0) top = y
      const from = y - top
      let R = d[k]
      let G = d[k + 1]
      let B = d[k + 2]
      // kenar ışığı: üstteki iki piksel
      if (from < 2) {
        const a = from === 0 ? rim : rim * 0.45
        R += (kr - R) * a
        G += (kg - G) * a
        B += (kb - B) * a
      }
      // dikey hacim: tepeden 40 piksel boyunca ılık, ötesi gölgeye doğru
      const v = Math.min(1, from / 60)
      const warm = (1 - v) * 0.12
      const cool = v * (0.18 + depth * 0.12)
      R += (kr - R) * warm + (sr - R) * cool
      G += (kg - G) * warm + (sg - G) * cool
      B += (kb - B) * warm + (sb - B) * cool
      // doygunluk: boya pigmenti gibi canlı (uzak plan daha az)
      const L = R * 0.3 + G * 0.59 + B * 0.11
      const sat = 1.45 + depth * 0.15
      // kontrast: orta tondan uzaklaşır (pus hissi kalkar, renkler net)
      const con = 1.1 + depth * 0.06
      R = 128 + (L + (R - L) * sat - 128) * con
      G = 128 + (L + (G - L) * sat - 128) * con
      B = 128 + (L + (B - L) * sat - 128) * con
      const n = 1 + grain[Math.floor(y / 2) * gw + Math.floor(x / 3)]
      d[k] = Math.max(0, Math.min(255, R * n))
      d[k + 1] = Math.max(0, Math.min(255, G * n))
      d[k + 2] = Math.max(0, Math.min(255, B * n))
    }
  }
  c.putImageData(img, 0, 0)
}

/**
 * Boyalı bulutlar: yuvarlak öbeklerin birleşimi, tepesi ışık renginde yanar, altı gökyüzünün gölgeli rengine döner.
 * Şehir başına birkaç imge bir kez çizilir (dünya tamponu çözünürlüğünde; tampon yumuşak büyütülür), sonra çok yavaş
 * süzülür ve kameradan çok az kayar.
 */
export class Clouds {
  private sprites: HTMLCanvasElement[] = []
  private place: { x: number; y: number; s: number; v: number }[] = []

  constructor(city: CityKey, style: CityStyle, mood: Mood) {
    const r = rng(city.charCodeAt(1) * 401 + city.length * 17)
    const grey = style.weather === 'rain' || style.weather === 'storm' || style.weather === 'snow'
    const top = mix(hex(style.sky[1]), [255, 255, 255], grey ? 0.25 : 0.55)
    const lit = mix(top, mood.key, grey ? 0.15 : 0.45)
    const under = mix(hex(style.sky[0]), mood.shade, grey ? 0.25 : 0.35)
    const n = grey ? 5 : 4
    for (let i = 0; i < n; i++) {
      const w = 70 + Math.floor(r() * 90)
      const h = Math.round(w * (0.32 + r() * 0.12))
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const c = cv.getContext('2d')!
      const puffs: [number, number, number][] = []
      const k = 5 + Math.floor(r() * 4)
      for (let j = 0; j < k; j++) {
        const u = (j + 0.5) / k
        const rad = h * (0.22 + Math.sin(u * Math.PI) * 0.26 + r() * 0.08)
        puffs.push([w * (0.12 + u * 0.76), h - rad * 0.9 - h * 0.08, rad])
      }
      // gövde: dikey geçiş (ışık → gölge), öbeklerin birleşimine kırpılır
      c.beginPath()
      for (const [x, y, rad] of puffs) {
        c.moveTo(x + rad, y)
        c.arc(x, y, rad, 0, Math.PI * 2)
      }
      c.rect(w * 0.12, h * 0.55, w * 0.76, h * 0.37)
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, rgba(lit, 0.95))
      g.addColorStop(0.55, rgba(mix(lit, under, 0.45), 0.9))
      g.addColorStop(1, rgba(under, 0.75))
      c.fillStyle = g
      c.fill()
      // öbeklerin tepesinde ışık
      for (const [x, y, rad] of puffs) {
        c.fillStyle = rgba(mix(lit, [255, 255, 255], 0.35), 0.5)
        c.beginPath()
        c.ellipse(x - rad * 0.2, y - rad * 0.35, rad * 0.55, rad * 0.4, 0, 0, Math.PI * 2)
        c.fill()
      }
      this.sprites.push(cv)
      this.place.push({ x: r(), y: 0.08 + r() * 0.32, s: i, v: 1.2 + r() * 2 })
    }
  }

  draw(b: CanvasRenderingContext2D, vw: number, vh: number, t: number, cx: number) {
    // kesirli konum, yumuşak örnekleme: bulut yavaş süzülürken piksel piksel zıplamasın
    b.imageSmoothingEnabled = true
    const span = vw + 200
    for (const p of this.place) {
      const cv = this.sprites[p.s]
      const x = ((((p.x * span + t * p.v - cx * 0.04) % span) + span) % span) - 160
      b.drawImage(cv, x, p.y * vh)
    }
    b.imageSmoothingEnabled = false
  }
}
