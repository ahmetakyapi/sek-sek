/**
 * Şehir boss'larının çizimi: oyuncu karakterleriyle aynı dil (mürekkep dış hat, düz renk, tek kademe gölge).
 * Birim dünya pikseli; (0, 0) gövdenin taban ortası, y yukarı eksi. Her boss sağa bakar, sola dönünce aynalanır.
 * Ruh hâli bütün boss'larda aynı okunur (ortak komedi katmanı):
 *   işaret   titreme + çatık kaş + sıkılmış diş + öfke damarı + burundan buhar
 *   saldırı  çatık kaş + bağıran ağız
 *   yorgun   sarmal göz + yıldız + sarkan dil + ter damlaları + yalpalama
 *   vurulmuş ezilip yaylanma + "güm" çizgileri + şaşkın ağız
 *   yenilmiş çarpı göz + sallanan beyaz bayrak
 *   uyku     kapalı göz + burun balonu + Zzz
 */
import type { Boss } from './boss'
import { INK, blob, setInkWidth, stroke } from './heroDraw'
import type { CityKey } from './types'

type Ctx = CanvasRenderingContext2D
type Mood = 'calm' | 'angry' | 'warn' | 'dizzy' | 'sleep' | 'hurt' | 'down'

const BODY_INK = 1.15
const FINE_INK = 0.7
const CREAM = '#f4ead8'
const GOB = '#4a1420'
const TONGUE = '#ff8fa0'

const mad = (m: Mood) => m === 'angry' || m === 'warn'
const beat = (m: Mood) => m === 'dizzy' || m === 'hurt' || m === 'down'

const shade = (color: string, dx = 1.4, dy = -1.1) => ({ color, dx, dy })

function ell(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, sh?: string, rot = 0) {
  blob(c, () => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2), fill, sh ? shade(sh) : undefined)
}

function poly(c: Ctx, pts: number[], fill: string, sh?: string) {
  blob(
    c,
    () => {
      c.moveTo(pts[0], pts[1])
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    },
    fill,
    sh ? shade(sh) : undefined,
  )
}

/** ince ayrıntı (ağız, damla, küçük eşya) dış hattı inceltilerek çizilir */
function fine(draw: () => void) {
  setInkWidth(FINE_INK)
  draw()
  setInkWidth(BODY_INK)
}

/** dış hatsız leke: yanak, ışık, benek */
function dab(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  c.fillStyle = fill
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fill()
}

const BLUSH = 'rgba(240,110,110,0.5)'

/** Göz: ruh hâline göre bebek, kaş ve kapak. r: yarıçap; line: kapalı göz çizgisinin rengi (koyu zeminde açık). */
function eye(c: Ctx, x: number, y: number, r: number, mood: Mood, t: number, line = INK) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  if (mood === 'sleep' || mood === 'hurt' || mood === 'down') {
    c.strokeStyle = line
    c.lineWidth = Math.max(0.9, r * 0.42)
    c.beginPath()
    if (mood === 'sleep') {
      c.moveTo(x - r, y)
      c.quadraticCurveTo(x, y + r * 0.9, x + r, y)
    } else if (mood === 'hurt') {
      c.moveTo(x - r, y - r * 0.7)
      c.lineTo(x + r * 0.6, y)
      c.lineTo(x - r, y + r * 0.7)
    } else {
      c.moveTo(x - r * 0.8, y - r * 0.8)
      c.lineTo(x + r * 0.8, y + r * 0.8)
      c.moveTo(x + r * 0.8, y - r * 0.8)
      c.lineTo(x - r * 0.8, y + r * 0.8)
    }
    c.stroke()
    return
  }
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fillStyle = '#ffffff'
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.8
  c.stroke()
  if (mood === 'dizzy') {
    // sarmal
    c.beginPath()
    for (let a = 0; a < Math.PI * 4; a += 0.4) {
      const rr = (a / (Math.PI * 4)) * r * 0.85
      const px = x + Math.cos(a + t * 6) * rr
      const py = y + Math.sin(a + t * 6) * rr
      if (a === 0) c.moveTo(px, py)
      else c.lineTo(px, py)
    }
    c.lineWidth = 0.6
    c.stroke()
    return
  }
  const glare = mood === 'warn'
  c.beginPath()
  c.arc(x + r * 0.3, y + r * (glare ? 0.2 : 0.1), r * (glare ? 0.4 : 0.5), 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.beginPath()
  c.arc(x + r * 0.05, y - r * 0.25, r * 0.2, 0, Math.PI * 2)
  c.fillStyle = '#ffffff'
  c.fill()
  if (mad(mood)) {
    // çatık kaş: işarette daha kalın, daha eğik ve seğirir
    const tw = glare ? Math.sin(t * 34) * r * 0.1 : 0
    c.strokeStyle = INK
    c.lineWidth = Math.max(1.1, r * 0.34) * (glare ? 1.45 : 1)
    c.beginPath()
    c.moveTo(x - r * 1.25, y - r * (glare ? 1.75 : 1.5) + tw)
    c.lineTo(x + r * 1.15, y - r * (glare ? 0.5 : 0.7) - tw)
    c.stroke()
  }
}

/** Ağız: bütün boss'larda aynı dil. w: yarı genişlik; line: çizgi ağzın rengi. */
function mouth(c: Ctx, x: number, y: number, w: number, mood: Mood, t: number, line = INK) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  if (mood === 'calm' || mood === 'down') {
    c.strokeStyle = line
    c.lineWidth = Math.max(0.8, w * 0.36)
    c.beginPath()
    if (mood === 'calm') {
      c.moveTo(x - w, y - w * 0.2)
      c.quadraticCurveTo(x, y + w * 0.9, x + w, y - w * 0.2)
    } else {
      c.moveTo(x - w, y)
      c.lineTo(x - w * 0.5, y - w * 0.4)
      c.lineTo(x, y + w * 0.2)
      c.lineTo(x + w * 0.5, y - w * 0.4)
      c.lineTo(x + w, y)
    }
    c.stroke()
    return
  }
  fine(() => {
    if (mood === 'warn') {
      // sıkılmış dişler
      blob(c, () => c.roundRect(x - w, y - w * 0.5, w * 2, w, w * 0.3), '#fffaf0')
      c.strokeStyle = INK
      c.lineWidth = 0.45
      c.beginPath()
      c.moveTo(x - w, y)
      c.lineTo(x + w, y)
      for (const k of [-0.4, 0.4]) {
        c.moveTo(x + w * k, y - w * 0.5)
        c.lineTo(x + w * k, y + w * 0.5)
      }
      c.stroke()
    } else if (mood === 'angry') {
      // bağıran ağız: üstte diş, dipte dil
      ell(c, x, y + w * 0.1, w, w * 0.8, GOB)
      dab(c, x + w * 0.1, y + w * 0.5, w * 0.55, w * 0.28, TONGUE)
      c.fillStyle = '#fffaf0'
      c.fillRect(x - w * 0.5, y - w * 0.6, w, w * 0.28)
    } else if (mood === 'dizzy') {
      // soluk soluğa: dil dışarıda
      const p = Math.sin(t * 11) * w * 0.14
      ell(c, x, y, w * 0.8, w * 0.5 + p, GOB)
      blob(
        c,
        () => {
          c.moveTo(x - w * 0.4, y)
          c.lineTo(x - w * 0.3, y + w * 1.1 + p)
          c.quadraticCurveTo(x + w * 0.1, y + w * 1.75 + p, x + w * 0.5, y + w * 1.1 + p)
          c.lineTo(x + w * 0.4, y)
        },
        TONGUE,
      )
      stroke(c, [x + w * 0.05, y + w * 0.35, x + w * 0.1, y + w * 1.15 + p], 0.35, '#d85a78', false)
    } else if (mood === 'hurt') {
      ell(c, x, y, w * 0.5, w * 0.7, GOB)
    } else {
      ell(c, x, y, w * 0.32, w * 0.32 + Math.sin(t * 1.8) * w * 0.08, GOB)
    }
  })
}

/** yorgunken alından sıçrayan ter damlaları; dir: hangi yana */
function sweat(c: Ctx, x: number, y: number, t: number, dir: number) {
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.5 + i / 3) % 1
    const px = x + dir * (1 + k * (4 + i * 1.5))
    const py = y - k * 5 + k * k * 8 - i * 0.6
    c.save()
    c.translate(px, py)
    c.rotate(dir * (0.9 - k * 1.4))
    c.globalAlpha *= 1 - k * k
    c.beginPath()
    c.moveTo(0, -1.9)
    c.quadraticCurveTo(1.4, 0.3, 0, 1.1)
    c.quadraticCurveTo(-1.4, 0.3, 0, -1.9)
    c.fillStyle = '#9adcf8'
    c.strokeStyle = INK
    c.lineWidth = 0.5
    c.stroke()
    c.fill()
    c.restore()
  }
}

/** işaret verirken şakakta atan öfke damarı */
function vein(c: Ctx, x: number, y: number, t: number) {
  const s = 1 + Math.sin(t * 16) * 0.18
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  c.lineCap = 'round'
  for (const [col, lw] of [[INK, 1.7], ['#f0392c', 0.95]] as const) {
    c.strokeStyle = col
    c.lineWidth = lw
    c.beginPath()
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        c.moveTo(sx * 0.7, sy * 2.6)
        c.quadraticCurveTo(sx * 0.7, sy * 0.7, sx * 2.6, sy * 0.7)
      }
    c.stroke()
  }
  c.restore()
}

/** burundan fışkıran buhar */
function steam(c: Ctx, x: number, y: number, t: number, dir: number) {
  for (let i = 0; i < 2; i++) {
    const k = (t * 2.6 + i * 0.5) % 1
    c.save()
    c.globalAlpha *= 1 - k
    c.beginPath()
    c.arc(x + dir * (0.6 + k * 5.5), y - k * 2.2, 0.9 + k * 1.5, 0, Math.PI * 2)
    c.fillStyle = '#ffffff'
    c.strokeStyle = INK
    c.lineWidth = 0.45
    c.stroke()
    c.fill()
    c.restore()
  }
}

/** uyurken şişip sönen burun balonu */
function bubble(c: Ctx, x: number, y: number, t: number, dir: number) {
  const r = 1.5 + (0.5 + 0.5 * Math.sin(t * 1.8)) * 2
  c.beginPath()
  c.arc(x + dir * r, y, r, 0, Math.PI * 2)
  c.fillStyle = 'rgba(180,228,250,0.75)'
  c.strokeStyle = INK
  c.lineWidth = 0.5
  c.fill()
  c.stroke()
  dab(c, x + dir * r - r * 0.35, y - r * 0.35, r * 0.22, r * 0.22, '#ffffff')
}

/**
 * Yüze bağlı ortak işaretler. (hx, hy): şakak (ter, damar); (nx, ny): burun (buhar, balon);
 * nx2 verilirse buhar iki delikten çıkar.
 */
function aura(c: Ctx, mood: Mood, t: number, hx: number, hy: number, nx: number, ny: number, nx2?: number) {
  if (mood === 'dizzy') sweat(c, hx, hy, t, hx < 0 ? -1 : 1)
  else if (mood === 'warn') {
    vein(c, hx, hy, t)
    steam(c, nx, ny, t, 1)
    if (nx2 !== undefined) steam(c, nx2, ny, t, -1)
  } else if (mood === 'sleep') bubble(c, nx, ny, t, 1)
}

/** önden bakan yüz: ağız + iki yandan buhar + şakak işaretleri */
function face(c: Ctx, mx: number, my: number, w: number, mood: Mood, t: number, hx: number, hy: number) {
  mouth(c, mx, my, w, mood, t)
  aura(c, mood, t, hx, hy, mx + w + 2.4, my - w * 0.8, mx - w - 2.4)
}

/** yorgunken başın üstünde dönen yıldızlar */
function stars(c: Ctx, y: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i * Math.PI * 2) / 3
    const x = Math.cos(a) * 9
    const yy = y + Math.sin(a) * 2.4
    c.save()
    c.translate(x, yy)
    c.rotate(t * 3 + i)
    c.beginPath()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 1.1 : 2.6
      const an = (k * Math.PI) / 5
      c.lineTo(Math.cos(an) * r, Math.sin(an) * r)
    }
    c.closePath()
    c.fillStyle = '#ffd86a'
    c.strokeStyle = INK
    c.lineWidth = 0.6
    c.fill()
    c.stroke()
    c.restore()
  }
}

function feet(c: Ctx, dx: number, color: string, step = 0) {
  ell(c, -dx, -1.6 - Math.max(0, step), 3, 1.8, color)
  ell(c, dx, -1.6 - Math.max(0, -step), 3, 1.8, color)
}

/** susamlı simit */
function simit(c: Ctx, x: number, y: number, r: number) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.strokeStyle = INK
  c.lineWidth = 3.2
  c.stroke()
  c.strokeStyle = '#c47a2c'
  c.lineWidth = 1.9
  c.stroke()
  for (let i = 0; i < 6; i++) dab(c, x + Math.cos(i * 1.05 + 0.3) * r, y + Math.sin(i * 1.05 + 0.3) * r, 0.42, 0.42, '#fff0c8')
}

/** çıtlamış Antep fıstığı */
function nut(c: Ctx, x: number, y: number, r: number, rot = 0) {
  fine(() => ell(c, x, y, r, r * 0.72, '#ecd9a6', undefined, rot))
  dab(c, x + r * 0.2, y, r * 0.5, r * 0.3, '#86b84a')
}

/** alev dili: tabanı (x, y), ucu yukarı */
function flame(c: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const f = Math.sin(t * 17 + x) * w * 0.5
  fine(() =>
    blob(
      c,
      () => {
        c.moveTo(x - w, y)
        c.quadraticCurveTo(x - w * 1.2, y - h * 0.5, x + f, y - h)
        c.quadraticCurveTo(x + w * 1.2, y - h * 0.4, x + w, y)
      },
      '#ff8a2a',
    ),
  )
  c.fillStyle = '#ffd84a'
  c.beginPath()
  c.moveTo(x - w * 0.5, y)
  c.quadraticCurveTo(x - w * 0.5, y - h * 0.3, x + f * 0.5, y - h * 0.6)
  c.quadraticCurveTo(x + w * 0.6, y - h * 0.25, x + w * 0.5, y)
  c.fill()
}

type Painter = (c: Ctx, b: Boss, mood: Mood, t: number) => void

const PAINT: Record<CityKey, Painter> = {
  // Simit Hırsızı Martı: hırsız maskesi, gagasında susamlı simit; yorulunca simidi düşürür
  istanbul: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flap = air ? Math.sin(t * 16) * 6 : 0
    const out = beat(mood)
    poly(c, [-9, -9, -17, -13 - flap, -13, -7], '#8e98a8', '#5e6878')
    ell(c, 0, -9, 10.5, 7.5, '#f6f4ee', '#c8ccd4')
    poly(c, [-3, -11, -12, -17 - flap * 1.2, -1, -6], '#a8b2c0', '#6e7888')
    ell(c, 7, -14.6, 5.8, 5.4, '#f6f4ee', '#c8ccd4')
    // maske: kara bant, ensede uçuşan düğüm
    const fl = Math.sin(t * 9) * 0.9
    stroke(c, [1.8, -16.4, -2, -19 + fl], 1.2, INK, false)
    stroke(c, [1.8, -15.8, -2.4, -14.8 - fl], 1.2, INK, false)
    stroke(c, [3, -16.2, 11, -16.2], 4, INK, false)
    if (out) simit(c, 16, -3.4, 2.8)
    else simit(c, 15.8, -9.4, 3)
    // gaga: saldırırken ve yorulunca açılır
    const open = out || mood === 'angry' ? 1 : 0
    fine(() => {
      poly(c, [11.6, -13.8, 16.2, -13 + open * 2, 11.6, -11.6 + open], '#d8942a')
      if (mood === 'dizzy') stroke(c, [12.8, -12.2, 14.2, -9.2 + Math.sin(t * 11) * 0.5], 1.3, TONGUE)
    })
    poly(c, [11.4, -16.4, 18.2, -14.2, 11.4, -13], '#f2b23a', '#c07e1c')
    eye(c, 8.2, -16.2, 2.4, mood, t, CREAM)
    aura(c, mood, t, 3.4, -21, 18, -15)
    if (!air) feet(c, 3, '#f2b23a')
  },
  // Pişmaniye Yumağı: bulut gibi kabarık, tepesinde hediye kurdelesi ve fıstık serpintisi
  kocaeli: (c, b, mood, t) => {
    const roll = b.state === 'attack' ? (b.x / 11) * b.dir : 0
    c.save()
    c.translate(0, -11)
    c.rotate(roll)
    // tel tel uçuşan şeker: yorulunca sarkar
    const droop = beat(mood) ? 3 : 0
    for (const [x, k] of [[-9, -1], [9.6, 1]] as const) stroke(c, [x, -4, x + k * 3.4, -7 + droop, x + k * 3, -9.6 + droop * 1.8], 0.9, '#fbf6ea')
    blob(
      c,
      () => {
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2
          c.arc(Math.cos(a) * 8.2, Math.sin(a) * 8.2, 4.4, a - 1.2, a + 1.2)
        }
      },
      '#fbf6ea',
      shade('#dccfb8'),
    )
    c.strokeStyle = 'rgba(190,170,140,0.7)'
    c.lineWidth = 0.5
    for (let i = 0; i < 5; i++) {
      c.beginPath()
      c.arc(0, 0, 3 + i * 1.6, i * 1.3, i * 1.3 + 1.6)
      c.stroke()
    }
    // fıstık serpintisi
    for (const [x, y] of [[-6, -8], [-1.6, -10.4], [3.4, -9.6], [-8.6, -3.6], [7.4, -6.4]]) dab(c, x, y, 0.9, 0.6, '#7ab04a')
    // kurdele
    fine(() => {
      poly(c, [-3, -12.4, -8.4, -16.4, -8, -10.8], '#e23a4a', '#a8202e')
      poly(c, [-3, -12.4, 1.6, -17, 2.6, -11.4], '#e23a4a', '#a8202e')
      ell(c, -3, -12.4, 1.5, 1.5, '#f2586a')
    })
    c.restore()
    eye(c, 1, -13.4, 2.9, mood, t)
    eye(c, 8, -13.4, 2.6, mood, t)
    dab(c, -2.6, -9, 1.9, 1.2, BLUSH)
    dab(c, 10.6, -9.4, 1.5, 1.1, BLUSH)
    face(c, 4.6, -8, 2.3, mood, t, -6, -20)
    if (b.state !== 'attack') feet(c, 4, '#c9a05a')
  },
  // Truva Atı: tekerlekli tahta at; sırt kapağından miğferli bir asker gözetler, at dişlerini gösterir
  canakkale: (c, b, mood, t) => {
    const charge = b.state === 'attack' && b.move === 'charge'
    const spin = charge ? b.x / 4 : 0
    // sırt kapağı ve gözcü asker
    if (!charge) {
      const peek = beat(mood) ? 2.6 : mood === 'sleep' ? 3.4 : Math.sin(t * 2.4) * 0.5
      fine(() => {
        poly(c, [-1.4, -21, -0.6, -26.6, 0.4, -26.6, 0, -21], '#7e5228')
        poly(c, [-6.6, -24.6 + peek, -5.4, -28.6 + peek, -2.6, -27.4 + peek, -4.6, -24.8 + peek], '#d83c36')
        ell(c, -5, -22.6 + peek, 2.9, 2.7, '#d8ac4a', '#a87c2a')
      })
      c.fillStyle = INK
      c.fillRect(-6.4, -23.2 + peek, 3.6, 1.3)
      dab(c, -5.6, -22.6 + peek, 0.4, 0.4, '#ffffff')
      dab(c, -3.8, -22.6 + peek, 0.4, 0.4, '#ffffff')
    }
    // tekerlekli tabla
    poly(c, [-13, -4.6, 13, -4.6, 13, -2.6, -13, -2.6], '#7a5234', '#523420')
    for (const wx of [-9, 9]) {
      ell(c, wx, -2.6, 2.8, 2.8, '#a8763e', '#6e4622')
      stroke(c, [wx + Math.cos(spin) * 2, -2.6 + Math.sin(spin) * 2, wx - Math.cos(spin) * 2, -2.6 - Math.sin(spin) * 2], 0.6, '#523420', false)
    }
    // bacaklar
    for (const lx of [-8, -4, 4, 8]) poly(c, [lx - 1.3, -13, lx + 1.3, -13, lx + 1.1, -4.6, lx - 1.1, -4.6], lx < 0 ? '#9a6a3a' : '#b8804a', '#6e4622')
    // gövde: kalas kalas, çivili, yamalı
    poly(c, [-11, -21, 9, -21, 10, -12.4, -11, -12.4], '#b8804a', '#7e5228')
    for (const px of [-6, -1, 4]) stroke(c, [px, -20.6, px, -12.8], 0.6, '#6e4622', false)
    for (const px of [-8.6, -3.4, 1.6, 6.6]) {
      dab(c, px, -19.4, 0.45, 0.45, '#4a2e1a')
      dab(c, px, -14, 0.45, 0.45, '#4a2e1a')
    }
    fine(() => poly(c, [-9.6, -18, -6.4, -17.4, -6.8, -15.2, -10, -15.6], '#d8a468'))
    // karnındaki kapak: atarken açılır
    if (b.state === 'warn' && b.move === 'throw') poly(c, [-3, -17, 3, -17, 3, -12.6, -3, -12.6], '#3a2416')
    // kuyruk, boyun, baş
    stroke(c, [-11, -19, -14.6, -15, -13.6, -11], 1.6, '#6e4622')
    poly(c, [4, -21, 9.4, -21, 12.6, -29, 8, -30], '#b8804a', '#7e5228')
    poly(c, [7.6, -31.4, 12.4, -32.4, 18.4, -27.6, 17.2, -23.8, 11, -25.6], '#c08a52', '#7e5228')
    poly(c, [8, -31.4, 9.4, -35, 10.8, -31.6], '#b8804a')
    // yele
    for (let i = 0; i < 4; i++) poly(c, [5 + i * 1.3, -22.6 - i * 2.2, 3.2 + i * 1.3, -24.4 - i * 2.2, 5.6 + i * 1.3, -25 - i * 2.2], '#6e4622')
    // dizgin
    stroke(c, [15, -29.6, 14, -24.6], 0.8, '#d83c36', false)
    stroke(c, [14, -24.8, 9.6, -22.4], 0.6, '#d83c36', false)
    dab(c, 17.2, -27.4, 0.5, 0.5, INK)
    eye(c, 12, -29.2, 2, mood, t)
    if (mood === 'calm') {
      // at dişleri
      fine(() => poly(c, [14.4, -25.2, 17, -24.6, 16.8, -22.8, 14.6, -23.4], '#fffaf0'))
      stroke(c, [15.7, -24.9, 15.6, -23.1], 0.35, INK, false)
    } else mouth(c, 15.4, -24.6, 1.5, mood, t)
    aura(c, mood, t, 6, -33.4, 18.8, -27.8)
  },
  // Dev Karpuz: çizgili yeşil kabuk, karpuz dilimi gülüşü, festival birincilik rozeti; yorulunca çatlar
  diyarbakir: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 12) * b.dir : 0
    const air = b.y < b.floor - b.h - 2
    if (!air && !roll) feet(c, 4.4, '#245a26')
    c.save()
    c.translate(0, -12)
    c.rotate(roll)
    // sap, kıvrık sülük, yaprak
    stroke(c, [0, -11.2, 0.8, -14.6], 1.3, '#6a4a2e')
    stroke(c, [0.8, -14.4, -3, -16, -5.4, -14.4, -4, -12.8, -2.8, -13.8], 0.7, '#4e9a3a')
    fine(() => poly(c, [1, -14.2, 5.4, -17.6, 7.6, -14.4, 4.4, -12.8], '#5aa03e', '#3a7028'))
    ell(c, 0, 0, 12.4, 11.4, '#3a8a3c', '#246028')
    c.save()
    c.beginPath()
    c.ellipse(0, 0, 12.4, 11.4, 0, 0, Math.PI * 2)
    c.clip()
    c.strokeStyle = '#1e4e22'
    c.lineWidth = 1.5
    for (const sx of [-8, -3.4, 1.4, 6.4]) {
      c.beginPath()
      c.moveTo(sx, -12)
      c.bezierCurveTo(sx - 2.4, -5, sx + 2.4, 5, sx, 12)
      c.stroke()
    }
    c.restore()
    // birincilik rozeti
    fine(() => {
      poly(c, [-9, 4.6, -10, 9, -8.2, 7.8, -7, 9.4, -7, 4.6], '#3a7ac8')
      ell(c, -8, 3.6, 2.5, 2.5, '#f2c14e', '#b8862a')
    })
    dab(c, -8, 3.6, 1, 1, '#d83c36')
    if (beat(mood)) fine(() => poly(c, [-7.6, -7.4, -3.4, -10.4, -0.4, -7.8, 3.6, -10.6, 7.6, -7, 3.6, -5.4, 0, -6.6, -4, -4.8], '#e24a48', '#b8302e'))
    c.restore()
    if (roll) return
    eye(c, 0, -14, 2.9, mood, t)
    eye(c, 7.2, -14, 2.6, mood, t)
    if (mood === 'calm' || mood === 'angry') {
      // karpuz dilimi ağız: çekirdekler diş gibi
      const w = mood === 'angry' ? 4.6 : 3.8
      fine(() =>
        blob(
          c,
          () => {
            c.moveTo(3.6 - w, -9.6)
            c.lineTo(3.6 + w, -9.6)
            c.quadraticCurveTo(3.6, -9.6 + w * 1.7, 3.6 - w, -9.6)
          },
          '#f0504e',
        ),
      )
      stroke(c, [3.6 - w + 0.5, -9.4, 3.6 + w - 0.5, -9.4], 0.7, '#f8f4e0', false)
      for (const sx of [-1.6, 0, 1.6]) dab(c, 3.6 + sx, -7.8 + Math.abs(sx) * 0.1, 0.42, 0.62, INK)
      aura(c, mood, t, -6, -22, 9, -11, -2)
    } else face(c, 3.6, -8.4, 2.8, mood, t, -6, -22)
  },
  // Diyojen'in Fıçısı: çemberli fıçı, içinden bakan gözler, sarkan ak sakal, başında kapak, elinde fener
  sinop: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 11) * b.dir : 0
    const air = b.y < b.floor - b.h - 2
    if (!air && !roll) feet(c, 4.6, '#e0a880')
    c.save()
    c.translate(0, -12)
    c.rotate(roll)
    // musluk
    stroke(c, [-11, 3.4, -14, 3.4, -14, 5], 1.3, '#c8a24a')
    blob(
      c,
      () => {
        c.moveTo(-8.6, -10.6)
        c.lineTo(8.6, -10.6)
        c.quadraticCurveTo(13.4, 0, 8.6, 10.6)
        c.lineTo(-8.6, 10.6)
        c.quadraticCurveTo(-13.4, 0, -8.6, -10.6)
      },
      '#a8703a',
      shade('#74481e'),
    )
    for (const px of [-4.6, 0, 4.6]) stroke(c, [px, -10.2, px * 1.3, 0, px, 10.2], 0.6, '#74481e', false)
    for (const hy of [-6.6, 6.6]) stroke(c, [-10.6, hy, 10.6, hy], 1.6, '#8a8e98')
    // fıçının ağzı: karanlık, içinden gözler
    ell(c, 2.6, -0.6, 6.4, 5.2, '#2a1a12')
    c.restore()
    if (roll) return
    // musluktan damla
    const dk = (t * 0.9) % 1
    c.globalAlpha *= 1 - dk
    dab(c, -14, -5.8 + dk * 5, 0.7, 0.9, '#9adcf8')
    c.globalAlpha /= 1 - dk
    // başında kapak: bere gibi
    ell(c, -1.6, -23.4, 6.6, 1.9, '#c08a52', '#8a5a2e', -0.14)
    dab(c, -1.8, -24.2, 0.8, 0.5, '#74481e')
    // sakal
    const sway = Math.sin(t * 3) * 0.7
    blob(
      c,
      () => {
        c.moveTo(-2.4, -10)
        c.quadraticCurveTo(-1.6, -5, 2.6 + sway, -1.6)
        c.quadraticCurveTo(7, -5, 7.8, -10)
        c.quadraticCurveTo(2.6, -12.4, -2.4, -10)
      },
      '#f2eee4',
      shade('#c8c0b2'),
    )
    stroke(c, [1, -6.6, 2.4 + sway * 0.5, -4], 0.4, '#a8a092', false)
    stroke(c, [4.4, -6.8, 3.6 + sway * 0.5, -4.4], 0.4, '#a8a092', false)
    eye(c, 0.4, -13.6, 2.3, mood, t, CREAM)
    eye(c, 5.4, -13.6, 2.1, mood, t, CREAM)
    mouth(c, 2.8, -8.8, 1.7, mood, t)
    aura(c, mood, t, -7, -26, 9.4, -11.4)
    // fener: yorulunca söner ve sarkar
    const off = beat(mood) || mood === 'sleep'
    const fy = off ? 5 : 0
    stroke(c, [9.6, -9, 13.4, -12.6 + fy], 1.2, '#e0a880')
    fine(() => {
      poly(c, [12.2, -17.4 + fy, 15.8, -17.4 + fy, 15.8, -12.2 + fy, 12.2, -12.2 + fy], '#3a3440')
      ell(c, 14, -14.8 + fy, 1.3, 1.8, off ? '#5a5462' : Math.sin(t * 6) > 0 ? '#ffd36a' : '#f2b84a')
    })
    stroke(c, [13, -17.6 + fy, 14, -19.2 + fy, 15, -17.6 + fy], 0.5, INK, false)
  },
  // Kırkpınar Davulu: yağlı pehlivan; palabıyık, kara kispet, elinde tokmak. Toslarken teker gibi döner
  edirne: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 11.5) * b.dir : 0
    const air = b.y < b.floor - b.h - 2
    if (!air && !roll) {
      // kispet paçaları
      stroke(c, [-4.6, -4, -4.6, -1.6], 3.2, '#2a2228')
      stroke(c, [4.6, -4, 4.6, -1.6], 3.2, '#2a2228')
      feet(c, 4.6, '#e0a880')
    }
    c.save()
    c.translate(0, -12.4)
    c.rotate(roll)
    ell(c, 0, 0, 11.8, 11.8, '#c8302a', '#8e1c1a')
    ell(c, 0, 0, 9, 9, '#f2e2c0', '#d4c098')
    // gergi ipleri
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      stroke(c, [Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a + 0.39) * 11.4, Math.sin(a + 0.39) * 11.4], 0.6, '#f2c14e', false)
    }
    // zeytinyağı parıltısı
    stroke(c, [-6.4, -3.6, -4.4, -6.4], 1.1, '#ffffff', false)
    dab(c, -6.9, -1.4, 0.6, 0.6, '#ffffff')
    c.restore()
    if (roll) return
    eye(c, -1.8, -15.4, 2.6, mood, t)
    eye(c, 4.8, -15.4, 2.4, mood, t)
    dab(c, -5.6, -11.6, 1.5, 1, BLUSH)
    dab(c, 8, -11.6, 1.3, 1, BLUSH)
    mouth(c, 1.5, -8.4, 2, mood, t)
    // palabıyık: yorulunca sarkar
    const tip = beat(mood) ? 2.6 : -1.6 + (b.state === 'warn' ? Math.sin(t * 30) * 0.5 : 0)
    stroke(c, [1.5, -11.2, -2.4, -10, -5.4, -10.6, -6.6, -11 + tip], 2, INK, false)
    stroke(c, [1.5, -11.2, 5.4, -10, 8.4, -10.6, 9.6, -11 + tip], 2, INK, false)
    aura(c, mood, t, -7, -23, 5.6, -12.6, -2.6)
    // tokmak: yorulunca yere düşer
    if (beat(mood)) {
      stroke(c, [11, -1.4, 17, -1.8], 1.1, '#8a5a34')
      ell(c, 18, -1.9, 1.9, 1.9, '#6a3a24')
    } else {
      const sw = b.state === 'warn' ? Math.sin(t * 22) * 2.4 : 0
      stroke(c, [10, -11, 14.6, -18 + sw], 1.1, '#8a5a34')
      ell(c, 15.2, -19.4 + sw, 2.2, 2.2, '#6a3a24')
    }
  },
  // Karagöz'ün Gölgesi: perde ışığı halesi, oynatma çubukları, koca sakal, yuvarlak kavuk
  bursa: (c, b, mood, t) => {
    const sway = Math.sin(t * 5) * 0.8
    const air = b.y < b.floor - b.h - 2
    const dark = '#3a2a52'
    // perde ışığı: yorulunca kısılır
    dab(c, 0.6, -16, 15, 18, 'rgba(255,232,160,0.22)')
    if (!beat(mood) && mood !== 'sleep') dab(c, 0.6, -17, 10.4, 13, `rgba(255,244,200,${0.26 + Math.sin(t * 7) * 0.05})`)
    // oynatma çubukları
    stroke(c, [-1, -14, -13.6, -1], 0.7, '#c9a05a')
    stroke(c, [13.6, -17.6 + sway * 3, 16.6, -2], 0.7, '#c9a05a')
    // bacaklar: mafsallı deri parçaları
    stroke(c, [-3, -9, -4 - (air ? 2 : 0), -4.6, -3.4, -0.8], 2.4, dark)
    stroke(c, [3, -9, 4.4 + (air ? 2 : 0), -4.6, 4, -0.8], 2.4, dark)
    dab(c, -4 - (air ? 2 : 0), -4.6, 0.5, 0.5, '#f2c14e')
    dab(c, 4.4 + (air ? 2 : 0), -4.6, 0.5, 0.5, '#f2c14e')
    // gövde: çiçekli cepken, kuşak
    poly(c, [-6.4, -19, 6.4, -19, 7.4, -8, -7.4, -8], '#5a3a86', dark)
    for (const [x, y] of [[-3.6, -15.4], [-0.4, -12.6], [-4, -11.4]]) ell(c, x, y, 1.1, 1.1, '#f2c14e')
    stroke(c, [-7, -9, 7, -9], 1.6, '#c8302a')
    // kol: işaret ederken sallanır
    stroke(c, [5.4, -17, 10.6, -14 + sway * 2, 13.6, -17.6 + sway * 3], 1.9, dark)
    // baş, sakal, kavuk
    ell(c, 1.4, -23.6, 6.4, 5.8, '#7a5aaa', dark)
    blob(
      c,
      () => {
        c.moveTo(-2.6, -19.6)
        c.quadraticCurveTo(3, -10.6 + sway, 8.4, -20)
        c.quadraticCurveTo(3, -17, -2.6, -19.6)
      },
      INK,
    )
    blob(
      c,
      () => {
        c.moveTo(-4.6, -27.4)
        c.bezierCurveTo(-6, -36.4, 8, -36.4, 7.4, -27.4)
        c.closePath()
      },
      '#c8302a',
      shade('#8e1c1a'),
    )
    stroke(c, [-4.8, -27.4, 7.6, -27.4], 1.3, '#f2c14e')
    eye(c, 4.2, -24.6, 2.3, mood, t)
    mouth(c, 4.6, -20.8, 1.7, mood, t)
    aura(c, mood, t, -4, -30, 8.6, -22.6)
  },
  // Aspendos Maskesi: taş tiyatro maskesi; sakinken komedi güler, saldırırken trajedi somurtur, bağları uçuşur
  antalya: (c, b, mood, t) => {
    const bob = b.state === 'tired' || b.state === 'down' ? 0 : Math.sin(t * 4) * 1.2
    c.save()
    c.translate(0, bob)
    // maske bağları
    const fl = Math.sin(t * 6) * 1.4
    stroke(c, [-10.4, -17, -14, -12 + fl, -12.6, -6.6 - fl], 1.3, '#c8302a')
    stroke(c, [10.4, -17, 14, -12 - fl, 12.6, -6.6 + fl], 1.3, '#c8302a')
    blob(
      c,
      () => {
        c.moveTo(-10.6, -20)
        c.bezierCurveTo(-11.6, -27, 11.6, -27, 10.6, -20)
        c.bezierCurveTo(11.4, -9, 5.6, -1, 0, -1)
        c.bezierCurveTo(-5.6, -1, -11.4, -9, -10.6, -20)
      },
      '#eadcc0',
      shade('#c2b08c'),
    )
    // defne çelengi
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.1 + i * 0.133)
      ell(c, Math.cos(a) * 10.4, -19 + Math.sin(a) * 6.6, 2.4, 1.1, i % 2 ? '#4e8a3a' : '#6aa84a', undefined, a + 1.2)
    }
    eye(c, -4.4, -16, 2.8, mood, t)
    eye(c, 4.4, -16, 2.8, mood, t)
    // oyma burun, yanak çatlağı
    stroke(c, [0, -14, -0.8, -11.4, 0.8, -11.2], 0.6, '#8a7a5e', false)
    stroke(c, [7, -12, 8.4, -9.4, 7.4, -7], 0.6, '#8a7a5e', false)
    if (mood === 'calm') {
      // komedi: kulaktan kulağa gülüş
      fine(() =>
        blob(
          c,
          () => {
            c.moveTo(-5.6, -9.4)
            c.quadraticCurveTo(0, -7.6, 5.6, -9.4)
            c.quadraticCurveTo(0, -1.6, -5.6, -9.4)
          },
          '#3a2a22',
        ),
      )
      dab(c, 0, -5.2, 2, 0.9, TONGUE)
    } else if (mad(mood)) {
      // trajedi: sarkık ağız, bir damla gözyaşı
      fine(() =>
        blob(
          c,
          () => {
            c.moveTo(-5.4, -4.4)
            c.quadraticCurveTo(0, -6.6, 5.4, -4.4)
            c.quadraticCurveTo(0, -12.6, -5.4, -4.4)
          },
          '#3a2a22',
        ),
      )
      fine(() => poly(c, [-7.4, -12.6, -6.4, -10.2, -7.4, -9.2, -8.4, -10.2], '#9adcf8'))
    } else mouth(c, 0, -7, 3, mood, t)
    aura(c, mood, t, -8.4, -26.6, 2.6, -11.6, -2.6)
    c.restore()
  },
  // Dikilitaş Bekçisi: T biçimli kireçtaşı, kabartma kollar ve tilki; tepesinde bir kelaynak tüner
  sanliurfa: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const lean = b.state === 'warn' ? Math.sin(t * 28) * 0.03 : 0
    c.save()
    c.rotate(lean)
    if (!air) poly(c, [-6.6, -2.4, 6.6, -2.4, 7.6, 0, -7.6, 0], '#a88a5e', '#7e6440')
    poly(c, [-5, -21, 5, -21, 5.6, -2, -5.6, -2], '#d8b888', '#b09060')
    poly(c, [-10.6, -28, 10.6, -28, 10, -20.6, -10, -20.6], '#e4c898', '#b09060')
    // kabartma kollar: önde kavuşan eller
    stroke(c, [-4.4, -14.4, -4, -9, 0.6, -7.6], 0.8, '#8a6a44', false)
    stroke(c, [4.4, -14.4, 4, -9, -0.6, -7.6], 0.8, '#8a6a44', false)
    // tilki kabartması
    stroke(c, [-2, -4.2, 1.6, -5, 3, -3.4], 0.7, '#8a6a44', false)
    stroke(c, [1.6, -5, 2.6, -6.2], 0.7, '#8a6a44', false)
    // çatlak ve yosun
    stroke(c, [8.6, -27.6, 7.4, -25.4, 8.6, -23.6], 0.5, '#8a6a44', false)
    dab(c, -8.6, -21.4, 1.6, 0.8, '#7a9a4a')
    dab(c, 4.4, -2.8, 1.5, 0.7, '#7a9a4a')
    eye(c, -3.4, -24.2, 2.5, mood, t)
    eye(c, 4, -24.2, 2.5, mood, t)
    mouth(c, 0.4, -17.4, 2.3, mood, t)
    aura(c, mood, t, 9, -30.4, 3.6, -19.6, -2.8)
    // kelaynak: işarette ve havada pırr diye kalkar
    const up = b.state === 'warn' || air
    const by = up ? -5 - Math.abs(Math.sin(t * 9)) * 2.4 : beat(mood) ? 0.6 : 0
    const wing = up ? Math.sin(t * 30) * 2.6 : 0
    fine(() => {
      if (!up) {
        stroke(c, [-7.4, -30 + by, -7.4, -28], 0.5, '#d86a5a', false)
        stroke(c, [-5.6, -30 + by, -5.6, -28], 0.5, '#d86a5a', false)
      }
      ell(c, -6.6, -31.6 + by, 3.2, 2.3, '#2a2a36', '#14141c')
      if (up) poly(c, [-8.6, -32 + by, -7, -36.6 + by - wing, -4.6, -32 + by], '#3a3a4a')
      stroke(c, [-9.4, -34.4 + by, -11, -35.6 + by], 0.6, '#2a2a36', false)
      stroke(c, [-9.6, -33.4 + by, -11.6, -33.6 + by], 0.6, '#2a2a36', false)
      ell(c, -3.6, -34 + by, 1.6, 1.5, '#e0685a')
      stroke(c, [-2.4, -34 + by, 0.4, -33.4 + by, 1.4, -31.6 + by], 0.7, '#d84a3a')
    })
    dab(c, -3.3, -34.3 + by, 0.4, 0.4, INK)
    c.restore()
  },
  // Göl Canavarı: turkuaz yılan boyun; kafasında Van kahvaltısı tabağı, sırtında ince belli çay bardağı
  van: (c, _b, mood, t) => {
    const w = Math.sin(t * 5) * 1.2
    const out = beat(mood)
    // kuyruk ve kamburlar
    stroke(c, [-13, -2, -15.6, -7 + w, -12.6, -10.6], 2.6, '#2e8a9a')
    ell(c, -7, -6, 6.6, 6, '#3aa0b0', '#2a7a8a')
    ell(c, 2, -7.4, 8, 7.4, '#3aa0b0', '#2a7a8a')
    for (const fx of [-2.6, 2.4]) poly(c, [fx - 1.8, -13.6, fx + 0.4, -18 - Math.abs(w), fx + 2.4, -13.4], '#f08a5a', '#c8643a')
    ell(c, 2, -3.6, 6, 2.6, '#c8ecf0')
    // çay: tabağı, bardağı, buğusu
    fine(() => {
      ell(c, -8.4, -11.8, 3.2, 0.9, '#f8f6f0')
      blob(
        c,
        () => {
          c.moveTo(-10.2, -17.4)
          c.lineTo(-6.6, -17.4)
          c.quadraticCurveTo(-8.2, -15, -6.8, -12.4)
          c.lineTo(-10, -12.4)
          c.quadraticCurveTo(-8.6, -15, -10.2, -17.4)
        },
        '#b8402a',
      )
    })
    stroke(c, [-10, -17.4, -6.8, -17.4], 0.5, '#f8f6f0', false)
    if (!out) {
      c.strokeStyle = 'rgba(255,255,255,0.6)'
      c.lineWidth = 0.6
      c.beginPath()
      c.moveTo(-8.4, -18.6)
      c.quadraticCurveTo(-8.4 + Math.sin(t * 4) * 1.6, -20.6, -8.4, -22.6)
      c.stroke()
    }
    // boyun ve baş
    blob(
      c,
      () => {
        c.moveTo(4, -12)
        c.bezierCurveTo(5, -20, 7 + w, -22, 8.6 + w, -23)
        c.lineTo(12.6 + w, -19.6)
        c.bezierCurveTo(10, -17, 10, -12, 9.4, -8)
        c.closePath()
      },
      '#3aa0b0',
      shade('#2a7a8a'),
    )
    ell(c, 11.6 + w, -22.6, 5.6, 4.2, '#44b4c4', '#2a7a8a')
    dab(c, 15.6 + w, -23.6, 0.45, 0.45, INK)
    eye(c, 10.4 + w, -24, 2.4, mood, t)
    mouth(c, 13.8 + w, -20.4, 1.7, mood, t)
    if (mood === 'calm') fine(() => poly(c, [12.4 + w, -20.4, 13.2 + w, -18.4, 14 + w, -20], '#fffaf0'))
    aura(c, mood, t, 5 + w, -22, 17.4 + w, -23.4)
    // kahvaltı tabağı: sahanda yumurta, zeytin, peynir; yorulunca yana kayar
    c.save()
    c.translate(10.4 + w, -26.6)
    c.rotate(out ? -0.5 + Math.sin(t * 5) * 0.06 : Math.sin(t * 5) * 0.05)
    if (out) c.translate(-2.4, 0.4)
    fine(() => {
      ell(c, 0, 0, 5.4, 1.3, '#f8f6f0', '#c8ccd4')
      ell(c, -1.6, -1, 2.2, 1, '#ffffff')
      ell(c, -1.6, -1.2, 0.9, 0.7, '#f6b42a')
      ell(c, 1.6, -1.2, 0.8, 0.8, '#2a2a2a')
      poly(c, [2.8, -0.6, 3.4, -2.6, 4.8, -0.8], '#f6e8a8')
    })
    c.restore()
  },
  // Palandöken Çığı: koca kartopu; kayak gözlüğü, ponponlu bere, içine çam dalı, kaya ve kayak sopası karışmış
  erzurum: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 12.5) * b.dir : 0
    // dağılıp toparlanırken: çevresine dökülen kar
    if (beat(mood)) {
      ell(c, -14.4, -2, 3.2, 2, '#f4f9ff', '#c4d4e8')
      ell(c, 13.6, -1.6, 2.6, 1.6, '#f4f9ff', '#c4d4e8')
      ell(c, 16.6, -4.4, 1.3, 1.1, '#f4f9ff')
    }
    c.save()
    c.translate(0, -13)
    c.rotate(roll)
    // ponponlu bere
    blob(
      c,
      () => {
        c.moveTo(-6.6, -11)
        c.bezierCurveTo(-6.6, -18.4, 5.4, -18.4, 5.6, -11.4)
      },
      '#3a6ab8',
      shade('#284a8a'),
    )
    stroke(c, [-3.4, -15.6, -1.4, -12.6], 0.8, '#f2c14e', false)
    stroke(c, [0.6, -16, 2.6, -13], 0.8, '#f2c14e', false)
    ell(c, -0.6, -17.6, 2.1, 2.1, '#f8fcff', '#c4d4e8')
    blob(
      c,
      () => {
        c.moveTo(-12.6, 2)
        c.bezierCurveTo(-14.6, -8, -6, -14.4, 1, -13.2)
        c.bezierCurveTo(9, -14, 14.6, -6, 12.6, 3)
        c.bezierCurveTo(12, 10.6, 5, 13, -1, 12.8)
        c.bezierCurveTo(-8, 13.4, -12, 9, -12.6, 2)
      },
      '#f4f9ff',
      shade('#c4d4e8'),
    )
    stroke(c, [-7.4, -11.4, 6.4, -11.8], 1.8, '#f2c14e')
    // karışanlar
    poly(c, [-9, 4, -5, 2.6, -4.4, 7, -8.4, 8], '#6e7686', '#444c5c')
    poly(c, [5, 7, 9, 5.6, 9.4, 9.4], '#6e7686')
    stroke(c, [-9.6, -5, -15.6, -12.6], 1, '#e04a3a')
    ell(c, -14.6, -11.4, 1.3, 1.3, '#3a3440')
    for (const k of [0, 1, 2]) stroke(c, [9.4 + k * 1.3, -4.6 - k * 1.6, 13.4 + k * 1.3, -8.2 - k * 1.6], 1.3, '#2e5e48')
    c.restore()
    if (roll) return
    // kayak gözlüğü: kayışı ve turuncu camı
    stroke(c, [-11.6, -15.6, 12, -15], 1.8, '#3a3440')
    blob(c, () => c.roundRect(-5.6, -19, 15.2, 8, 3.4), '#ffab3a', shade('#e0782a'))
    stroke(c, [-3.4, -17.6, -1.6, -17.8], 0.7, '#fff0c8', false)
    eye(c, -1.4, -15, 2.6, mood, t)
    eye(c, 5.4, -15, 2.4, mood, t)
    dab(c, -6.6, -9.4, 1.6, 1, BLUSH)
    face(c, 2, -7.4, 2.6, mood, t, -9.6, -25)
  },
  // Körfez Ahtapotu: mor kubbe baş, kıvrılan vantuzlu kollar, başında tatilci hasır şapkası
  izmir: (c, _b, mood, t) => {
    const out = beat(mood)
    for (let i = 0; i < 4; i++) {
      const x = -9 + i * 6
      const w = Math.sin(t * 5 + i * 1.4) * 2.2
      stroke(c, [x, -6, x + w, -2.6, x - w * 0.6, 0], 3.4, i % 2 ? '#a8558e' : '#c46aa6')
      dab(c, x + w * 0.8, -2.6, 0.6, 0.6, '#ffd8ec')
    }
    // el sallayan kol
    const wv = out ? 6 : Math.sin(t * 7) * 1.6
    stroke(c, [-10, -9, -14.6, -12 + (out ? 8 : 0), -15.6 + wv * 0.4, -17 + (out ? 14 : 0) + wv * 0.3], 2.6, '#a8558e')
    blob(
      c,
      () => {
        c.moveTo(-11, -6)
        c.bezierCurveTo(-13, -24, 13, -24, 11, -6)
        c.quadraticCurveTo(0, -3, -11, -6)
      },
      '#c46aa6',
      shade('#94487c'),
    )
    for (const [x, y] of [[-7.4, -13.6], [-8, -9.6]]) dab(c, x, y, 1.1, 1.1, 'rgba(255,220,240,0.5)')
    eye(c, 1.2, -13, 3, mood, t)
    eye(c, 8, -13, 2.7, mood, t)
    dab(c, -2.6, -9, 1.6, 1, BLUSH)
    face(c, 4.8, -7.8, 2.1, mood, t, -8, -19)
    // hasır şapka: yorulunca yana kayar
    c.save()
    c.translate(0, -19)
    c.rotate(out ? -0.55 : -0.14)
    if (out) c.translate(-3.4, 1)
    ell(c, 0, 0, 8.6, 1.9, '#f0d890', '#c8a850')
    blob(
      c,
      () => {
        c.moveTo(-4.8, -0.4)
        c.lineTo(-4.2, -4.6)
        c.quadraticCurveTo(0, -5.8, 4.2, -4.6)
        c.lineTo(4.8, -0.4)
        c.quadraticCurveTo(0, 0.9, -4.8, -0.4)
      },
      '#f6e2a0',
      shade('#c8a850'),
    )
    stroke(c, [-4.5, -1.4, 0, -0.6, 4.5, -1.4], 1.3, '#d83c36', false)
    c.restore()
  },
  // Evrak Canavarı: dosya yığını; memur gözlüğü, kravat, mühür izleri, havada uçuşan kâğıtlar
  ankara: (c, b, mood, t) => {
    const out = beat(mood)
    const sheet = (x: number, y: number, rot: number) => {
      c.save()
      c.translate(x, y)
      c.rotate(rot)
      fine(() => poly(c, [-2.6, -1.8, 2.6, -1.8, 2.6, 1.8, -2.6, 1.8], '#fffaf0'))
      stroke(c, [-1.4, -0.6, 1.4, -0.6], 0.35, '#a8a092', false)
      stroke(c, [-1.4, 0.6, 0.6, 0.6], 0.35, '#a8a092', false)
      c.restore()
    }
    if (out) {
      // dağılan evrak yerde
      sheet(-14, -1.6, 0.2)
      sheet(13.6, -1.4, -0.3)
    } else if (mood !== 'sleep')
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.8 + i / 3) % 1
        c.globalAlpha *= 1 - k * k
        sheet(-9 - k * 9, -19 - i * 3.4 + Math.sin(k * 7 + i * 2) * 2.4 - k * 5, k * 5 + i)
        c.globalAlpha /= 1 - k * k
      }
    feet(c, 4.5, '#3a3440', b.state === 'move' ? Math.sin(t * 12) * 1.4 : 0)
    const tabs = ['#e8563e', '#3aa0c8', '#f6c84a', '#5aa03e', '#e8563e']
    for (let i = 0; i < 5; i++) {
      const y = -4 - i * 4
      const dx = Math.sin(i * 2.1 + t * (b.state === 'warn' ? 30 : 0)) * 0.9
      fine(() => poly(c, [8.6 + dx, y - 3.4, 11.4 + dx, y - 3.4, 11.4 + dx, y - 1.4, 8.6 + dx, y - 1.4], tabs[i]))
      poly(c, [-9 + dx, y, 9 + dx, y - 0.6, 9.6 + dx, y - 4.2, -8.4 + dx, y - 3.8], i % 2 ? '#f4ecd8' : '#e2d2a8', i % 2 ? '#d4c8ac' : '#c0ac7c')
    }
    // mühür izleri
    c.strokeStyle = '#d83c36'
    c.lineWidth = 0.7
    for (const [x, y, r] of [[-5, -6.4, 1.7], [-5.6, -13.8, 1.5], [6.4, -9.8, 1.4]]) {
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.moveTo(x - r * 0.5, y)
      c.lineTo(x + r * 0.5, y)
      c.stroke()
    }
    poly(c, [0.8, -12.4, 3.8, -12.4, 4.5, -6.8, 2.3, -4.4, 0.1, -6.8], '#d83c36', '#9e2430')
    eye(c, -1.2, -20.8, 2.4, mood, t)
    eye(c, 5.6, -20.8, 2.4, mood, t)
    // memur gözlüğü
    c.strokeStyle = INK
    c.lineWidth = 0.9
    c.beginPath()
    c.arc(-1.2, -20.8, 3.2, 0, Math.PI * 2)
    c.moveTo(8.8, -20.8)
    c.arc(5.6, -20.8, 3.2, 0, Math.PI * 2)
    c.moveTo(-4.4, -20.8)
    c.lineTo(-8, -21.6)
    c.stroke()
    face(c, 2.2, -15.2, 2.1, mood, t, -7.4, -26)
    // mühür: sapı ve lastiği; yorulunca yere düşer
    if (out) {
      poly(c, [12, -6.4, 16, -6.4, 15.6, -2.4, 12.4, -2.4], '#7a4a2e', '#4e2e1c')
      poly(c, [11, -2.4, 17, -2.4, 17, -0.4, 11, -0.4], '#d83c36')
    } else {
      const lift = b.state === 'warn' ? -5 : 0
      stroke(c, [9, -12, 13, -14 + lift], 2.4, '#e2d2a8')
      poly(c, [11.6, -19 + lift, 15.6, -19 + lift, 15.2, -15 + lift, 12, -15 + lift], '#7a4a2e', '#4e2e1c')
      poly(c, [10.6, -15 + lift, 16.6, -15 + lift, 16.6, -13 + lift, 10.6, -13 + lift], '#d83c36')
    }
  },
  // Dev Topaç: ağaç gövde, çini şerit, demir uç; başında sikke, kolları semazen gibi açık
  konya: (c, b, mood, t) => {
    const out = beat(mood)
    const wob = mood === 'dizzy' ? Math.sin(t * 5) * 0.22 : b.state === 'attack' ? Math.sin(t * 40) * 0.05 : 0
    const whirl = b.state === 'attack' || b.state === 'warn'
    // topaç ipi: dururken yerde kıvrılır
    if (!whirl) stroke(c, [-3, -0.8, -8, -1.6, -12, -0.6, -15, -1.8, -16.6, -0.6], 0.7, '#f4ead8')
    c.save()
    c.rotate(wob)
    // kollar: biri göğe, biri yere
    if (out) {
      stroke(c, [10.6, -15, 14, -11, 13.6, -7.6], 1.4, '#c98a4a')
      stroke(c, [-10.6, -15, -14, -11, -13.6, -7.6], 1.4, '#c98a4a')
    } else {
      stroke(c, [10.4, -17, 14.6, -20.6, 15.2, -24.6], 1.4, '#c98a4a')
      stroke(c, [-10.4, -15.6, -14.6, -13.6, -16, -10.4], 1.4, '#c98a4a')
    }
    poly(c, [-1.4, 0, 1.4, 0, 2.2, -5, -2.2, -5], '#9aa0aa', '#5e646e')
    blob(
      c,
      () => {
        c.moveTo(-2.4, -4.6)
        c.quadraticCurveTo(-13, -10, -12, -17)
        c.quadraticCurveTo(-11, -23, 0, -23.6)
        c.quadraticCurveTo(11, -23, 12, -17)
        c.quadraticCurveTo(13, -10, 2.4, -4.6)
      },
      '#c98a4a',
      shade('#8e5a2a'),
    )
    // dönen çini şerit
    const off = whirl ? (t * 30) % 6 : 0
    c.save()
    c.beginPath()
    c.rect(-12, -21.6, 24, 3)
    c.clip()
    c.fillStyle = '#2f9a94'
    c.fillRect(-13, -21.6, 26, 3)
    c.fillStyle = '#f4ead8'
    for (let x = -14 + off; x < 14; x += 6) c.fillRect(x, -20.8, 2.4, 1.4)
    c.restore()
    c.strokeStyle = INK
    c.lineWidth = 0.7
    c.strokeRect(-11.2, -21.6, 22.4, 3)
    // sikke ve destarı
    blob(
      c,
      () => {
        c.moveTo(-3.4, -23.2)
        c.lineTo(-2.8, -29.4)
        c.quadraticCurveTo(0, -32.4, 2.8, -29.4)
        c.lineTo(3.4, -23.2)
      },
      '#d8b888',
      shade('#a88a5e'),
    )
    stroke(c, [-3.6, -24, 3.6, -24], 1.7, '#2e6a4a')
    eye(c, -1.6, -14.4, 2.6, mood, t)
    eye(c, 5.2, -14.4, 2.6, mood, t)
    dab(c, -5.6, -10.6, 1.4, 0.9, BLUSH)
    face(c, 1.8, -9, 2, mood, t, -8, -25)
    c.restore()
    if (whirl) {
      // dönüş çizgileri
      c.strokeStyle = 'rgba(255,255,255,0.75)'
      c.lineWidth = 0.8
      c.lineCap = 'round'
      for (let i = 0; i < 3; i++) {
        const a = t * 14 + i * 2.1
        c.beginPath()
        c.ellipse(0, -8 - i * 5, 15 - i, 2.6, 0, a, a + 1.1)
        c.stroke()
      }
    }
  },
  // Kaçak Balon: çizgili yamalı kubbe, altında ateş; sepette fotoğraf çeken şaşkın bir turist, kopmuş halat
  nevsehir: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const out = beat(mood)
    // kopmuş halat ve kum torbaları
    stroke(c, [3, -1, 7.6, -2 + Math.sin(t * 6) * 0.8, 11, -0.6], 0.7, '#c9a05a')
    stroke(c, [-5, -11, -3.4, -6], 0.9, '#5a3c26', false)
    stroke(c, [5, -11, 3.4, -6], 0.9, '#5a3c26', false)
    // turist: yorulunca sepete siner
    if (!out && mood !== 'sleep') {
      fine(() => {
        ell(c, -1.2, -8.4, 2.1, 2, '#f0c8a0')
        poly(c, [-3.6, -9.6, 1.2, -9.6, 0.4, -11.4, -2.8, -11.4], '#f6c84a')
        poly(c, [0.6, -9, 3.4, -9, 3.4, -7, 0.6, -7], '#3a3440')
      })
      dab(c, -1.8, -8.4, 0.4, 0.4, INK)
      dab(c, 2, -8, 0.6, 0.6, b.state === 'warn' && Math.sin(t * 20) > 0 ? '#ffffff' : '#9adcf8')
    }
    poly(c, [-4.4, -6.4, 4.4, -6.4, 3.6, 0, -3.6, 0], '#b8793c', '#7e4e22')
    stroke(c, [-4, -4.2, 3.9, -4.2], 0.5, '#7e4e22', false)
    stroke(c, [-3.8, -2.2, 3.7, -2.2], 0.5, '#7e4e22', false)
    fine(() => {
      ell(c, -5.4, -2.6, 1.5, 2, '#c9b27a', '#9a8250')
      ell(c, 5.4, -2.6, 1.5, 2, '#c9b27a', '#9a8250')
    })
    // brülör ateşi
    if (!out && mood !== 'sleep') flame(c, 2.6, -9.6, 1.3, mad(mood) || air ? 4.6 : 2.6, t)
    const puff = 1 + (air ? Math.sin(t * 6) * 0.03 : 0)
    c.save()
    c.translate(0, -18 + (out ? 1.6 : 0))
    c.scale(puff * (out ? 1.06 : 1), puff * (out ? 0.9 : 1))
    blob(
      c,
      () => {
        c.moveTo(-5.4, 7.6)
        c.bezierCurveTo(-17, 0, -12, -9.6, 0, -9.6)
        c.bezierCurveTo(12, -9.6, 17, 0, 5.4, 7.6)
      },
      '#e8563e',
      shade('#b03a2a'),
    )
    // dilimler
    c.save()
    c.beginPath()
    c.moveTo(-5.4, 7.6)
    c.bezierCurveTo(-17, 0, -12, -9.6, 0, -9.6)
    c.bezierCurveTo(12, -9.6, 17, 0, 5.4, 7.6)
    c.clip()
    c.fillStyle = '#f6c84a'
    c.beginPath()
    c.ellipse(-8.6, -1, 2.2, 10, 0.3, 0, Math.PI * 2)
    c.ellipse(8.6, -1, 2.2, 10, -0.3, 0, Math.PI * 2)
    c.fill()
    c.restore()
    // yama
    fine(() => poly(c, [-9.6, -5.6, -6.4, -6.4, -5.8, -3.4, -9, -2.6], '#3aa0c8'))
    stroke(c, [-8.6, -5, -7, -3.6], 0.35, INK, false)
    stroke(c, [-7.2, -5.2, -8.4, -3.6], 0.35, INK, false)
    c.restore()
    const fy = out ? 1.6 : 0
    eye(c, -1.8, -19.6 + fy, 2.9, mood, t)
    eye(c, 5.4, -19.6 + fy, 2.9, mood, t)
    dab(c, -6, -15.4 + fy, 1.6, 1, 'rgba(255,220,200,0.5)')
    face(c, 1.8, -14 + fy, 2.2, mood, t, -8, -27)
  },
  // Acı Biber: kırmızı gövde, yeşil sap; işarette ağzından alev çıkar, dili yanınca şalgama sarılır
  adana: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    if (!air) feet(c, 3.4, '#7a2a1e')
    // arka kol: yumruk belde
    stroke(c, [-7.6, -11, -10.6, -8.6, -8.4, -6.4], 1.4, '#c82a20')
    blob(
      c,
      () => {
        c.moveTo(-6, -19)
        c.bezierCurveTo(-12, -14, -7, -1, 1, -2)
        c.bezierCurveTo(9, -3, 9, -15, 5, -19.6)
        c.quadraticCurveTo(0, -22, -6, -19)
      },
      '#e23a2a',
      shade('#a8201c'),
    )
    stroke(c, [-3.6, -17, -5.4, -10, -3.4, -5.6], 1, '#ff8a6a', false)
    blob(
      c,
      () => {
        c.moveTo(-5, -19.4)
        c.quadraticCurveTo(0, -24, 5, -19.6)
        c.quadraticCurveTo(0, -17.6, -5, -19.4)
      },
      '#4e9a3a',
      shade('#2e6a24'),
    )
    stroke(c, [0, -21.6, 1.4, -25.4, 4, -26], 1.6, '#4e9a3a')
    for (const [x, y] of [[-3, -4.6], [0.4, -3.8], [3.6, -4.8]]) dab(c, x, y, 0.45, 0.6, '#ffd89a')
    eye(c, -1.4, -14.2, 2.6, mood, t)
    eye(c, 4.8, -14.2, 2.6, mood, t)
    if (mad(mood)) {
      // alev püskürtür
      const len = mood === 'warn' ? 9 + Math.sin(t * 24) * 1.4 : 6
      const f = Math.sin(t * 19) * 1.2
      fine(() => {
        blob(
          c,
          () => {
            c.moveTo(4, -10.4)
            c.quadraticCurveTo(8 + len * 0.5, -13.6 + f, 7 + len, -9.6 + f)
            c.quadraticCurveTo(8 + len * 0.6, -8.6, 8 + len * 0.8, -6.4 - f)
            c.quadraticCurveTo(7, -5.6, 4, -7.4)
          },
          '#ff8a2a',
        )
        ell(c, 2.2, -8.8, 2.4, 2, GOB)
      })
      c.fillStyle = '#ffd84a'
      c.beginPath()
      c.moveTo(4.6, -9.8)
      c.quadraticCurveTo(6 + len * 0.4, -11.4 + f * 0.5, 5 + len * 0.7, -9 + f * 0.5)
      c.quadraticCurveTo(6, -7, 4.6, -8)
      c.fill()
      aura(c, mood, t, -6.4, -22, 30, 0)
    } else {
      face(c, 2, -8.8, 2.2, mood, t, -6.4, -22)
      if (mood === 'dizzy') {
        // dilinden duman
        c.strokeStyle = 'rgba(255,255,255,0.6)'
        c.lineWidth = 0.6
        c.beginPath()
        c.moveTo(4.4, -6)
        c.quadraticCurveTo(6 + Math.sin(t * 5), -8, 5.4, -10.4)
        c.stroke()
      }
    }
    if (beat(mood)) {
      // şalgam bardağı
      stroke(c, [7, -10.6, 10.6, -9], 1.4, '#c82a20')
      fine(() => poly(c, [10, -13.6, 14, -13.6, 13.4, -7.4, 10.6, -7.4], '#8a2a6a', '#5e1a48'))
      stroke(c, [10.2, -13.6, 13.8, -13.6], 0.6, '#f4d8ec', false)
    } else if (air) {
      c.fillStyle = '#ffb84a'
      for (let i = 0; i < 3; i++) {
        c.beginPath()
        c.arc(-3 + i * 3, 1 + ((t * 20 + i * 3) % 5), 1.4 - i * 0.2, 0, Math.PI * 2)
        c.fill()
      }
    } else if (!mad(mood)) stroke(c, [7.4, -11, 10.6, -8.6, 8.6, -6.4], 1.4, '#c82a20')
  },
  // Fıstık Hırsızı: maskeli fare; yamalı çuvalından fıstık dökülür, elinde çıtlamış bir fıstık
  gaziantep: (c, b, mood, t) => {
    const run = b.state === 'attack' && b.move === 'charge' ? Math.sin(t * 26) * 1.6 : 0
    const out = beat(mood)
    stroke(c, [-8, -4, -14, -3, -16, -8], 1.6, '#c89a9a')
    // çuval: yaması ve deliği
    ell(c, -6.5, -12, 6.4, 6.8, '#c9b27a', '#9a8250')
    stroke(c, [-9, -18, -6, -19.4, -3.6, -17.8], 1, '#7a6238', false)
    fine(() => poly(c, [-10.6, -14.6, -7.4, -15.2, -7, -12, -10.2, -11.6], '#b8793c'))
    dab(c, -11.6, -8, 0.9, 0.9, '#4a3a22')
    if (out) {
      // çuval devrilmiş: fıstıklar yerde
      nut(c, -15, -1.4, 1.6, 0.3)
      nut(c, -11.6, -1.2, 1.5, -0.4)
      nut(c, 14, -1.3, 1.6, 0.2)
    } else if (mood !== 'sleep')
      for (let i = 0; i < 2; i++) {
        const k = (t * 1.3 + i * 0.5) % 1
        nut(c, -12.4 - k * 3 - i, -7.4 + k * k * 6.4, 1.4, k * 4 + i)
      }
    feet(c, 4, '#c89a9a', run)
    ell(c, 0.5, -8, 8.6, 6.6, '#8e8a92', '#625e68')
    dab(c, 2.4, -5.4, 4, 2.6, '#c8c4cc')
    ell(c, 6.6, -12.6, 6, 5.4, '#9e9aa2', '#6e6a74')
    ell(c, 3.2, -18.6, 3, 3.2, '#9e9aa2', '#6e6a74')
    ell(c, 8.8, -18.4, 2.8, 3, '#9e9aa2', '#6e6a74')
    dab(c, 3.4, -18.4, 1.5, 1.7, '#e8a8a8')
    dab(c, 9, -18.2, 1.4, 1.5, '#e8a8a8')
    // maske
    c.fillStyle = INK
    c.beginPath()
    c.roundRect(2.6, -16.2, 9.8, 4.6, 2)
    c.fill()
    eye(c, 5.4, -13.9, 1.8, mood, t, CREAM)
    eye(c, 9.8, -13.9, 1.7, mood, t, CREAM)
    // bıyıklar, burun
    for (const dy of [-1, 0.2, 1.4]) stroke(c, [12, -10.6 + dy * 0.3, 16, -11 + dy * 1.3], 0.35, INK, false)
    ell(c, 12.4, -11, 1.3, 1.1, '#e8788a')
    if (mood === 'calm') {
      // kemirgen dişleri
      fine(() => poly(c, [9.6, -9, 11.8, -9, 11.6, -6.8, 9.8, -6.8], '#fffaf0'))
      stroke(c, [10.7, -8.8, 10.7, -7], 0.3, INK, false)
    } else mouth(c, 10.4, -8.6, 1.5, mood, t)
    aura(c, mood, t, 0.6, -21.6, 13.6, -11.6)
    // elindeki fıstık
    if (!out && mood !== 'sleep') {
      stroke(c, [6.6, -6.4, 10.6, -4.6], 1.5, '#9e9aa2')
      nut(c, 12.4, -4.4, 2.1, -0.3)
    }
  },
  // Şahmaran'ın Sınavı: taçlı, uzun saçlı, küpeli; kuyruğunun ucunda ikinci bir yılan başı, çatal dili
  mardin: (c, b, mood, t) => {
    const sway = Math.sin(t * 3) * 1.6
    const out = beat(mood)
    // kuyruk ucundaki küçük baş: o da aynı hâlde
    const ty = out ? 3.6 : Math.sin(t * 4 + 1) * 0.8
    stroke(c, [-6.4, -1.6, -11.6, -2, -14.4, -5 + ty], 2.4, '#2f9a8a')
    fine(() => {
      if (mad(mood)) stroke(c, [-16.6, -7.6 + ty, -19, -8.6 + ty + Math.sin(t * 30) * 0.5], 0.5, '#e23a4a', false)
      ell(c, -15, -7.2 + ty, 2.6, 2.1, '#3aaa9a', '#1c6a62')
    })
    if (out) {
      stroke(c, [-16.4, -8.2 + ty, -15, -6.8 + ty], 0.45, INK, false)
      stroke(c, [-15, -8.2 + ty, -16.4, -6.8 + ty], 0.45, INK, false)
    } else dab(c, -15.8, -7.6 + ty, 0.6, 0.6, INK)
    // saç
    blob(
      c,
      () => {
        c.moveTo(-5 + sway, -24)
        c.bezierCurveTo(-9 + sway, -16, -6.6 + sway * 0.6, -11, -8 + sway * 0.4, -8)
        c.lineTo(9 + sway * 0.4, -8.6)
        c.bezierCurveTo(8.6 + sway * 0.6, -14, 10 + sway, -20, 7 + sway, -24.6)
      },
      '#2a1a2e',
    )
    blob(
      c,
      () => {
        c.moveTo(-7, 0)
        c.bezierCurveTo(-11, -9, -1 + sway, -11, -3 + sway, -18)
        c.lineTo(5 + sway, -18)
        c.bezierCurveTo(8 + sway, -9, 3, -8, 7, 0)
      },
      '#2f9a8a',
      shade('#1c6a62'),
    )
    // pullar
    c.strokeStyle = 'rgba(244,220,140,0.75)'
    c.lineWidth = 0.6
    for (let i = 0; i < 4; i++) {
      c.beginPath()
      c.arc(-1 + sway * (i / 4), -3 - i * 3.6, 2.2, 0.2, Math.PI - 0.2)
      c.stroke()
    }
    ell(c, 1 + sway, -21, 6.2, 5.6, '#f0c8a0', '#c89a70')
    // telkâri gerdanlık, küpeler
    for (const dx of [-2.4, 0, 2.4]) dab(c, 1 + sway + dx, -14.6 + Math.abs(dx) * -0.3, 0.7, 0.7, '#f2c14e')
    fine(() => {
      ell(c, -5 + sway, -19, 1, 1.3, '#f2c14e')
      ell(c, 7.2 + sway, -19.4, 1, 1.3, '#f2c14e')
    })
    poly(c, [-4 + sway, -25, -2.6 + sway, -30, 0 + sway, -26.6, 1.6 + sway, -31, 3.4 + sway, -26.6, 5.6 + sway, -30, 6.4 + sway, -25], '#f2c14e', '#b8862a')
    ell(c, 1.4 + sway, -27.4, 0.9, 0.9, '#d83c36')
    eye(c, -0.8 + sway, -21.8, 2.2, mood, t)
    eye(c, 4.4 + sway, -21.8, 2.1, mood, t)
    dab(c, -2.8 + sway, -18.6, 1.1, 0.7, BLUSH)
    if (mad(mood)) {
      // çatal dil
      const fl = Math.sin(t * 30) * 0.6
      stroke(c, [2 + sway, -17.6, 6 + sway, -16.4 + fl, 8 + sway, -17.4 + fl], 0.6, '#e23a4a', false)
      stroke(c, [6 + sway, -16.4 + fl, 8 + sway, -15.2 + fl], 0.6, '#e23a4a', false)
    }
    mouth(c, 1.8 + sway, -17.8, 1.5, mood, t)
    aura(c, mood, t, -4.6 + sway, -29, 4.4 + sway, -19.4, -1 + sway)
    if (b.state === 'warn' && b.move === 'throw') ell(c, 10 + sway, -15, 2, 2, '#58d0e0', '#2a8a9a')
  },
  // Dev Kayısı: turuncu, çilli, tek dişli gülüş; çevresinde bir arı döner
  malatya: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 11) * b.dir : 0
    const air = b.y < b.floor - b.h - 2
    if (!air && !roll) feet(c, 4, '#b8601e')
    c.save()
    c.translate(0, -12)
    c.rotate(roll)
    stroke(c, [0, -10.6, 0.6, -14], 1.4, '#6a4a2e')
    poly(c, [0.6, -13.6, 7.6, -17.6, 6, -11.6], '#5aa03e', '#3a7028')
    stroke(c, [1.4, -13.6, 5.6, -15], 0.4, '#3a7028', false)
    ell(c, 0, 0, 11.6, 11, '#f6a23c', '#d0742a')
    stroke(c, [-1, -10.4, -3.4, -6, -3.6, -1], 0.9, '#d0742a', false)
    dab(c, -6.4, 3.4, 3.4, 2.4, 'rgba(240,90,60,0.45)')
    c.restore()
    if (!roll) {
      eye(c, 0.2, -14, 2.9, mood, t)
      eye(c, 7.2, -14, 2.6, mood, t)
      // çiller
      for (const [x, y] of [[-3.4, -10.4], [-2, -9.2], [-4.6, -9], [10, -10.2], [9, -9]]) dab(c, x, y, 0.4, 0.4, '#c8642a')
      if (mood === 'calm') {
        // tek dişli gülüş
        fine(() =>
          blob(
            c,
            () => {
              c.moveTo(0.4, -9)
              c.lineTo(7, -9)
              c.quadraticCurveTo(3.7, -3.4, 0.4, -9)
            },
            GOB,
          ),
        )
        c.fillStyle = '#fffaf0'
        c.fillRect(3, -8.8, 1.6, 1.5)
        aura(c, mood, t, -6, -22, 9, -11)
      } else face(c, 3.7, -8, 2.5, mood, t, -6, -22)
    }
    // arı: yorulunca tepesine konar
    if (mood !== 'sleep') {
      const sit = beat(mood)
      const bx = sit ? -6.6 : Math.cos(t * 3.4) * 15
      const by = sit ? -23.4 : -21 + Math.sin(t * 5.2) * 5
      fine(() => {
        ell(c, bx - 0.4, by - 1.5, 1.5, 1 + (sit ? 0 : Math.sin(t * 60) * 0.5), 'rgba(255,255,255,0.85)')
        ell(c, bx, by, 1.9, 1.4, '#f6c84a')
      })
      stroke(c, [bx - 0.5, by - 1.2, bx - 0.5, by + 1.2], 0.5, INK, false)
      stroke(c, [bx + 0.6, by - 1.2, bx + 0.6, by + 1.2], 0.5, INK, false)
    }
  },
  // Leblebi Tavası: bakır tava, hoplayan leblebiler, altında ocak ateşi, tahta kürek; soğuyunca rengi solar
  corum: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const cold = beat(mood) || mood === 'sleep'
    if (!air) feet(c, 6, '#5a3a24')
    // ocak ateşi: soğuyunca söner
    if (!cold) {
      const h = mad(mood) ? 9 : 6
      flame(c, -11.4, -3, 1.9, h, t)
      flame(c, 11.4, -3, 1.9, h * 0.9, t + 1)
      flame(c, 0, -0.4, 2.2, 3, t + 2)
    }
    // tahta kürek
    stroke(c, [7, -15, 11.6, -22.6], 1.2, '#c9a05a')
    fine(() => ell(c, 12.6, -24.4, 1.7, 2.4, '#d8b070', '#a8803e', 0.5))
    c.fillStyle = '#e8c878'
    c.strokeStyle = INK
    c.lineWidth = 0.6
    for (let i = 0; i < 6; i++) {
      const hop = b.state === 'tired' ? 0 : Math.abs(Math.sin(t * 7 + i * 1.3)) * (b.state === 'warn' ? 6 : 3)
      c.beginPath()
      c.arc(-8 + i * 3.2, -15.6 - hop, 1.5, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
    stroke(c, [-12, -12, -19, -15], 2.6, '#5a3a24')
    blob(
      c,
      () => {
        c.moveTo(-13, -15)
        c.lineTo(13, -15)
        c.quadraticCurveTo(12, -3, 6, -2.6)
        c.lineTo(-6, -2.6)
        c.quadraticCurveTo(-12, -3, -13, -15)
      },
      cold ? '#a8785a' : '#d8703a',
      shade(cold ? '#7a5238' : '#9a4a20'),
    )
    stroke(c, [-12.4, -14.6, 12.4, -14.6], 1.4, cold ? '#c8a888' : '#f0a868', false)
    eye(c, -1.8, -10.4, 2.6, mood, t)
    eye(c, 5.2, -10.4, 2.6, mood, t)
    if (!cold) {
      dab(c, -6.4, -7, 1.7, 1.1, 'rgba(255,90,60,0.55)')
      dab(c, 9.6, -7, 1.5, 1.1, 'rgba(255,90,60,0.55)')
    }
    face(c, 1.8, -5.8, 2, mood, t, -9, -19)
    if (!cold) {
      // kızgın tavadan buhar
      c.strokeStyle = 'rgba(255,255,255,0.5)'
      c.lineWidth = 0.8
      c.beginPath()
      for (let i = 0; i < 2; i++) {
        const x = -4 + i * 8
        c.moveTo(x, -19)
        c.quadraticCurveTo(x + Math.sin(t * 4 + i) * 2, -22, x, -25)
      }
      c.stroke()
    }
  },
  // Fındık Kurdu: boğumlu krem gövde, yeşil zuruflu fındık miğferi; elinde delip oyduğu fındık
  ordu: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const out = beat(mood)
    const inch = air ? 0 : Math.sin(t * 6) * 0.8
    // minik ayaklar
    if (!air) for (const x of [-8, -5, -2, 1, 4]) stroke(c, [x, -2.4, x + 0.4, -0.5], 1, '#c8b47e')
    ell(c, -6, -5, 5.2, 5, '#f2e2b4', '#c8b47e')
    ell(c, -1, -8 - inch, 5.6, 5.6, '#f6e8c0', '#c8b47e')
    ell(c, 4, -12.5, 6.8, 6.8, '#f6e8c0', '#c8b47e')
    stroke(c, [-7, -9.4, -5.4, -1], 0.5, '#c8b47e', false)
    stroke(c, [-3, -12.6 - inch, -0.6, -3], 0.5, '#c8b47e', false)
    // zuruf: miğferin altından taşan yeşil yapraklar
    fine(() => {
      for (const [x, y, k] of [[-3.4, -15.2, -1], [11.4, -15.2, 1]] as const) poly(c, [x, y - 1.6, x + k * 3.4, y + 0.6, x - k * 0.6, y + 1.6], '#7ab04a', '#4e8030')
    })
    blob(
      c,
      () => {
        c.moveTo(-3, -15)
        c.quadraticCurveTo(-2.4, -23.4, 4, -23.4)
        c.quadraticCurveTo(10.4, -23.4, 11, -15)
        c.quadraticCurveTo(4, -17.8, -3, -15)
      },
      '#a8693a',
      shade('#6e4220'),
    )
    stroke(c, [0.6, -21, -0.6, -18.4], 0.7, '#d09a62', false)
    stroke(c, [4, -23.4, 4.6, -26], 1.2, '#6e4220')
    eye(c, 2.6, -13, 2.3, mood, t)
    eye(c, 8, -13, 2.1, mood, t)
    dab(c, -0.2, -9.8, 1.2, 0.8, BLUSH)
    mouth(c, 6, -8.8, 1.7, mood, t)
    if (mood === 'calm') fine(() => poly(c, [5.4, -8.2, 6.8, -8.2, 6.6, -6.6, 5.6, -6.6], '#fffaf0'))
    aura(c, mood, t, -3.6, -24, 11.4, -11.4, 0.6)
    // fındık: ortasında kurt deliği; yorulunca elinden düşer
    const nx = out ? 15.4 : 15.6
    const ny = out ? -2.6 : -10.4 + inch * 0.5
    if (!out) stroke(c, [10, -10.4, 13.6, -10 + inch * 0.5], 1.8, '#f2e2b4')
    fine(() => {
      ell(c, nx, ny, 2.8, 2.6, '#b8743a', '#7e4a20')
      poly(c, [nx - 2, ny - 1.6, nx, ny - 3.4, nx + 2, ny - 1.6], '#e0c08a')
    })
    dab(c, nx + 0.2, ny + 0.5, 0.8, 0.8, INK)
  },
  // Hamsi Kralı: gümüş balık; taç, bordo mavi pelerin, kıvrık Karadeniz bıyığı
  trabzon: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flop = mood === 'dizzy' ? Math.sin(t * 9) * 0.12 : air ? Math.sin(t * 14) * 0.1 : 0
    const out = beat(mood)
    c.save()
    c.translate(0, -8)
    c.rotate(flop)
    poly(c, [-10, 0, -16, -6 + Math.sin(t * 12) * 1.6, -14, 0, -16, 6 - Math.sin(t * 12) * 1.6], '#6a9ab8', '#42728e')
    blob(
      c,
      () => {
        c.moveTo(-11, 0)
        c.bezierCurveTo(-6, -9, 8, -9, 13, -1)
        c.bezierCurveTo(8, 8, -6, 8, -11, 0)
      },
      '#c8dce8',
      shade('#8aa8be'),
    )
    blob(
      c,
      () => {
        c.moveTo(-9, -1.6)
        c.bezierCurveTo(-4, -8.6, 8, -8.6, 12.4, -2)
        c.quadraticCurveTo(2, -4.6, -9, -1.6)
      },
      '#4a7ea4',
    )
    // pullar
    c.strokeStyle = 'rgba(90,130,160,0.8)'
    c.lineWidth = 0.5
    for (const [x, y] of [[-5, 1], [-1.6, 2.4], [-4, 4], [1.6, 0.6]]) {
      c.beginPath()
      c.arc(x, y, 1.5, 0.3, Math.PI - 0.3)
      c.stroke()
    }
    // pelerin: yorulunca yere serilir
    const fl = out ? 3 : Math.sin(t * 8) * 1.2
    blob(
      c,
      () => {
        c.moveTo(2.6, -7.6)
        c.lineTo(-6, -8.6)
        c.quadraticCurveTo(-12, -10.6 + fl, -17.6, -7.6 + fl * 1.6)
        c.lineTo(-16.6, -3.2 + fl * 1.6)
        c.quadraticCurveTo(-10, -6 + fl, -4.6, -4.8)
        c.quadraticCurveTo(0.6, -4.8, 3, -5.6)
      },
      '#8e1c3a',
      shade('#5e1026'),
    )
    stroke(c, [-17.4, -7.2 + fl * 1.6, -16.6, -3.6 + fl * 1.6], 1.2, '#4aa0d8')
    stroke(c, [2.4, -7.6, 3.2, -4.6], 1.9, '#fffaf0')
    // taç
    poly(c, [3.4, -7.6, 4, -13, 6.2, -9.8, 7.8, -13.8, 9.4, -9.6, 11.4, -12.4, 11.6, -6.6], '#f2c14e', '#b8862a')
    dab(c, 7.8, -8.6, 0.8, 0.8, '#d83c36')
    eye(c, 7.4, -2.2, 2.9, mood, t)
    mouth(c, 11.4, 2.2, 1.4, mood, t)
    // bıyık
    stroke(c, [12.6, 0.2, 10.2, 1.4, 7.6, 0.8, 6.8, out ? 3.4 : -0.8], 1, INK, false)
    aura(c, mood, t, 0.6, -10.6, 13.6, -1.4)
    c.restore()
  },
  // Ayaz Dede: kardan gövde, buzdan sakal, saçaklı mavi külah, çizgili atkı, kırmızı eldiven, donmuş havuç burun
  sivas: (c, b, mood, t) => {
    const slide = b.state === 'attack' && b.move === 'charge'
    const out = beat(mood)
    // arka kol
    stroke(c, [-8, -10, -12.6, out ? -7 : -13.4, -14, out ? -3.6 : -16.6], 0.9, '#6a4a2e')
    fine(() => ell(c, -14.2, out ? -3 : -17.4, 1.8, 1.8, '#d83c36', '#9e2430'))
    ell(c, 0, -7.4, 10, 7.6, '#f4f9ff', '#c0d4ea')
    // atkı
    const fl = Math.sin(t * 7) * (slide ? 2 : 0.8)
    stroke(c, [-4.6, -12.4, -9, -10.6 + fl, -12.4, -11.6 - fl], 2.2, '#d83c36')
    stroke(c, [-9.4, -11.6 + fl, -9, -9.6 + fl], 0.6, '#f6c84a', false)
    ell(c, 1, -17, 7.2, 6.6, '#f8fcff', '#c8daee')
    stroke(c, [-5.6, -12.8, 1, -11.4, 7.6, -13], 2.4, '#d83c36')
    for (const x of [-2.6, 1, 4.6]) stroke(c, [x, -13.2 + Math.abs(x - 1) * 0.12, x, -10.8 - Math.abs(x - 1) * 0.12], 0.6, '#f6c84a', false)
    // sakal
    blob(
      c,
      () => {
        c.moveTo(-2.4, -14.4)
        c.quadraticCurveTo(2, -6, 1.6 + Math.sin(t * 3) * 0.6, -4)
        c.quadraticCurveTo(7, -8, 7.6, -14.8)
        c.quadraticCurveTo(2.6, -13, -2.4, -14.4)
      },
      '#d2e8f8',
      shade('#9ec0dc'),
    )
    // külah ve saçakları
    poly(c, [-6, -21, 0, -31 + (slide ? 1 : 0), 8, -21.4], '#4a7ec0', '#2e5a94')
    ell(c, 0, -31, 1.7, 1.7, '#f8fcff')
    stroke(c, [-6.4, -21, 8.4, -21.4], 2.2, '#f8fcff')
    fine(() => {
      poly(c, [-6.6, -20.2, -5.6, -16.6, -4.6, -20.2], '#bfe4f8')
      poly(c, [-9.4, -6, -8.6, -3, -7.6, -6.2], '#bfe4f8')
    })
    eye(c, -0.4, -18.2, 2.2, mood, t)
    eye(c, 4.8, -18.2, 2, mood, t)
    // havuç burun, ucunda buz
    fine(() => {
      poly(c, [6.8, -17.2, 12.6, -15.6, 6.8, -14.8], '#f08a3a', '#c8642a')
      poly(c, [11, -15.6, 11.8, -12.8, 12.6, -15.4], '#bfe4f8')
    })
    mouth(c, 3, -12.6, 1.6, mood, t)
    aura(c, mood, t, -5.4, -26, 13, -16.6)
    // ön kol ve eldiven
    if (b.state === 'warn' && b.move === 'throw') {
      stroke(c, [8.6, -9.6, 12, -13.6], 0.9, '#6a4a2e')
      ell(c, 12.6, -16.4, 2.8, 2.8, '#ffffff', '#c0d4ea')
      fine(() => ell(c, 12.2, -13.4, 1.8, 1.8, '#d83c36', '#9e2430'))
    } else {
      stroke(c, [8.6, -9.6, 12.6, out ? -5 : -9], 0.9, '#6a4a2e')
      fine(() => ell(c, 13.6, out ? -4 : -9, 1.8, 1.8, '#d83c36', '#9e2430'))
    }
  },
  // Dev Kaz: beyaz gövde, uzun boyun; ponponlu bere, uçuşan atkı, tıslarken dişli gaga
  ardahan: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flap = air ? Math.sin(t * 15) * 5 : 0
    const run = b.state === 'attack' && !air ? Math.sin(t * 24) * 1.6 : 0
    if (!air) feet(c, 3.6, '#f08a3a', run)
    const low = b.state === 'attack' && !air ? 5 : 0
    const hx = 10 + low
    const hy = -23 + low * 1.4
    // kuyruk tüyleri
    poly(c, [-11, -10, -16, -14.6, -13.6, -9, -16.4, -8.6, -11.6, -6], '#f8f6f0', '#c8ccd2')
    ell(c, -2, -9, 10.6, 7.4, '#f8f6f0', '#c8ccd2')
    poly(c, [-6, -11, -14, -15 - flap, -2, -5], '#e2e4e8', '#a8aeb8')
    stroke(c, [5, -12, 8 + low, -19 + low, 9 + low, -22 + low * 1.4], 4.6, '#f8f6f0')
    // atkı
    const fl = Math.sin(t * 9) * 1.2
    stroke(c, [4.6, -14.4, 2.4 + fl * 0.5, -10.4, 3 + fl, -7.4], 2, '#3a7ac8')
    stroke(c, [2.2 + fl, -8.6, 3.8 + fl, -8.2], 0.6, '#f4ead8', false)
    stroke(c, [3.4, -15.8, 8.8, -12.6], 2.8, '#3a7ac8')
    stroke(c, [5.4, -15.4, 6.2, -13.4], 0.6, '#f4ead8', false)
    ell(c, hx, hy, 4.2, 3.8, '#f8f6f0', '#c8ccd2')
    // gaga: saldırırken ve yorulunca açılır, dişleri görünür
    const open = mad(mood) || mood === 'dizzy' ? 1 : 0
    fine(() => {
      poly(c, [hx + 2.8, hy + 0.2, hx + 7.4, hy + 0.8 + open * 2.6, hx + 2.8, hy + 2.2 + open], '#d8742a')
      if (mood === 'dizzy') stroke(c, [hx + 4, hy + 1.4, hx + 5.4, hy + 5 + Math.sin(t * 11) * 0.5], 1.3, TONGUE)
      else if (open) stroke(c, [hx + 3.4, hy + 1.2, hx + 6.6, hy + 1.8], 1, TONGUE, false)
    })
    poly(c, [hx + 2.6, hy - 1.8, hx + 8.6, hy - 0.2, hx + 2.6, hy + 0.8], '#f08a3a', '#c05e1c')
    if (open) fine(() => poly(c, [hx + 3.4, hy + 0.5, hx + 4, hy + 1.5, hx + 4.6, hy + 0.3, hx + 5.2, hy + 1.2, hx + 5.8, hy + 0.1, hx + 6.4, hy + 0.9, hx + 7, hy - 0.2], '#fffaf0'))
    eye(c, hx + 0.8, hy - 0.6, 2, mood, t)
    // ponponlu bere
    blob(
      c,
      () => {
        c.moveTo(hx - 4.2, hy - 1.6)
        c.bezierCurveTo(hx - 4.6, hy - 8, hx + 3.6, hy - 8, hx + 3, hy - 2.6)
        c.quadraticCurveTo(hx - 0.6, hy - 3.6, hx - 4.2, hy - 1.6)
      },
      '#d83c36',
      shade('#9e2430'),
    )
    stroke(c, [hx - 4.2, hy - 1.8, hx - 0.6, hy - 3.4, hx + 3, hy - 2.8], 1.3, '#f4ead8')
    ell(c, hx - 0.8, hy - 7.6, 1.7, 1.7, '#f8fcff', '#c8ccd2')
    aura(c, mood, t, hx - 6, hy - 5, hx + 8.8, hy - 1)
  },
  // Tepegöz: tek gözlü dev; pars postu, altın küpe, dikenli topuz, tek kaş, alt dişleri dışarıda
  bayburt: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const out = beat(mood)
    const step = b.state === 'attack' && b.move === 'charge' ? Math.sin(t * 20) * 1.8 : 0
    if (!air) feet(c, 5.4, '#4e3a30', step)
    // dikenli topuz: yorulunca yere iner
    c.save()
    c.translate(-9, -13)
    c.rotate(out ? -2 : b.state === 'warn' ? -0.9 : 0.2)
    stroke(c, [0, 0, -3, -11], 2.4, '#6a4a2e')
    fine(() => {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + 0.3
        poly(c, [-3.6 + Math.cos(a - 0.35) * 3.6, -13.6 + Math.sin(a - 0.35) * 3.6, -3.6 + Math.cos(a) * 6.4, -13.6 + Math.sin(a) * 6.4, -3.6 + Math.cos(a + 0.35) * 3.6, -13.6 + Math.sin(a + 0.35) * 3.6], '#c8ccd4')
      }
    })
    ell(c, -3.6, -13.6, 4, 4, '#8a8e98', '#585c66')
    c.restore()
    blob(
      c,
      () => {
        c.moveTo(-10, -3)
        c.bezierCurveTo(-15, -14, -10, -25, 0, -25.4)
        c.bezierCurveTo(10, -25, 15, -14, 10, -3)
        c.quadraticCurveTo(0, -1, -10, -3)
      },
      '#8a9a6a',
      shade('#5e6e44'),
    )
    // pars postu
    poly(c, [-10.6, -7.6, 10.6, -7.6, 10.4, -4.4, 7.4, -1.6, 5, -4, 2.2, -1.2, -0.6, -4, -3.4, -1.2, -6, -4, -8.4, -1.8, -10.6, -4.4], '#e0a84a', '#b07a2a')
    for (const [x, y] of [[-7, -5.6], [-2, -5.2], [3.4, -5.6], [8, -5.4]]) dab(c, x, y, 0.8, 0.6, '#4a2e1a')
    poly(c, [-8, -22.6, -11, -29, -5, -24.6], '#f0e6c8', '#c4b890')
    poly(c, [8, -22.6, 11, -29, 5, -24.6], '#f0e6c8', '#c4b890')
    // tepede üç tel saç, kulakta altın küpe
    for (const k of [-1, 0, 1]) stroke(c, [k * 1.2, -25.2, k * 2.6, -28.4 - (k ? 0 : 0.8)], 0.6, INK, false)
    c.strokeStyle = INK
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(-12, -13.4, 1.5, 0, Math.PI * 2)
    c.stroke()
    c.strokeStyle = '#f2c14e'
    c.lineWidth = 0.8
    c.stroke()
    // koca tek göz, tek kaş
    eye(c, 1.6, -17.6, 5.2, mood, t)
    if (!mad(mood)) stroke(c, [-3.6, -23, 1.6, -24 + (out ? 1.4 : 0), 6.8, -23 + (out ? 1.6 : 0)], 1.5, '#3a2a22', false)
    mouth(c, 1.6, -10.2, 3, mood, t)
    if (mood === 'calm')
      fine(() => {
        poly(c, [-1.4, -9.6, -0.6, -12.2, 0.4, -9.3], '#fffaf0')
        poly(c, [3, -9.3, 4, -12.2, 4.8, -9.6], '#fffaf0')
      })
    aura(c, mood, t, 9.6, -24, 5.6, -12.4, -2.4)
  },
  // GEÇİCİ: çizim ajanı kendi çizimlerini yapacak
  kayseri: (...a) => PAINT.sivas(...a),
  hatay: (...a) => PAINT.adana(...a),
  eskisehir: (...a) => PAINT.bursa(...a),
}

/** Yerden çıkan boss'un işareti: kabaran toprak, sıçrayan çakıllar. */
function mound(c: Ctx, t: number, strong: boolean) {
  const sh = strong ? Math.sin(t * 40) * 0.8 : 0
  blob(
    c,
    () => {
      c.moveTo(-11, 0)
      c.quadraticCurveTo(-7 + sh, -6, 0, -6.6 - (strong ? 1.5 : 0))
      c.quadraticCurveTo(7 + sh, -6, 11, 0)
    },
    '#6a4a34',
    shade('#46301f'),
  )
  if (strong)
    for (let i = 0; i < 4; i++) {
      const a = (t * 9 + i * 1.7) % 1
      ell(c, -8 + i * 5.4, -7 - a * 9, 1.2, 1.2, '#8a6a4c')
    }
}

/** vurulunca tepeden saçılan "güm" çizgileri; p: 0 → 1 */
function thump(c: Ctx, y: number, p: number) {
  c.lineCap = 'round'
  c.globalAlpha = Math.max(0, 1 - p * p)
  for (const [col, lw] of [[INK, 2], ['#ffe9a0', 1.1]] as const) {
    c.strokeStyle = col
    c.lineWidth = lw
    c.beginPath()
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.52
      const r0 = 3 + p * 9
      const r1 = r0 + 4.5 - Math.abs(i) * 0.8
      c.moveTo(Math.cos(a) * r0 * 1.5, y + Math.sin(a) * r0)
      c.lineTo(Math.cos(a) * r1 * 1.5, y + Math.sin(a) * r1)
    }
    c.stroke()
  }
  c.globalAlpha = 1
}

/** yenilince sallanan beyaz bayrak */
function whiteFlag(c: Ctx, x: number, y: number, t: number, pop: number) {
  c.save()
  c.translate(x, y)
  c.rotate(Math.sin(t * 11) * 0.28)
  const top = -17 * pop
  const wv = Math.sin(t * 14) * 1.2
  stroke(c, [0, 0, 0, top], 0.9, '#8a5a34')
  if (pop > 0.5)
    fine(() =>
      blob(
        c,
        () => {
          c.moveTo(0.4, top)
          c.quadraticCurveTo(4, top - 1.6 + wv, 8.6, top + 0.4 - wv)
          c.lineTo(8.6, top + 5.4 - wv)
          c.quadraticCurveTo(4, top + 3.6 + wv, 0.4, top + 5.4)
        },
        '#fffdf6',
        shade('#d4d8e0', 0.9, -0.8),
      ),
    )
  c.restore()
}

/** uykuda yükselen Z'ler */
function zzz(c: Ctx, x: number, y: number, t: number) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.45 + i / 3) % 1
    const s = 1.2 + k * 2
    const px = x + k * 9 + Math.sin(k * 6 + i) * 1.2
    const py = y - k * 14
    c.globalAlpha = Math.min(1, k * 5) * (1 - k * k)
    for (const [col, lw] of [[INK, 1.7], [CREAM, 0.8]] as const) {
      c.strokeStyle = col
      c.lineWidth = lw
      c.beginPath()
      c.moveTo(px - s, py - s)
      c.lineTo(px + s, py - s)
      c.lineTo(px - s, py + s)
      c.lineTo(px + s, py + s)
      c.stroke()
    }
  }
  c.globalAlpha = 1
}

/**
 * Boss'u ekran pikselinde çizer. (x, y): gövde kutusunun taban ortası, sc: bir dünya pikseli kaç ekran pikseli.
 */
export function drawBoss(c: Ctx, city: CityKey, b: Boss, x: number, y: number, sc: number, t: number): void {
  c.save()
  c.translate(x, y)
  c.scale(sc, sc)
  c.lineJoin = 'round'
  setInkWidth(BODY_INK)
  try {
    paintBoss(c, city, b, t)
  } finally {
    setInkWidth(3.2)
    c.restore()
  }
}

const MOODS: Record<Boss['state'], Mood> = { sleep: 'sleep', intro: 'calm', move: 'calm', warn: 'warn', attack: 'angry', tired: 'dizzy', hurt: 'hurt', down: 'down' }

function paintBoss(c: Ctx, city: CityKey, b: Boss, t: number) {
  if (b.hidden) {
    if (b.state === 'warn') mound(c, t, true)
    return
  }
  const mood = MOODS[b.state]
  // dalış işareti: yere düşecek gölge
  if (b.move === 'dive' && (b.state === 'warn' || b.state === 'attack' || b.state === 'move')) {
    const hgt = b.floor - b.h - b.y
    c.fillStyle = `rgba(20,10,30,${b.state === 'warn' ? 0.45 + 0.2 * Math.sin(t * 30) : 0.25})`
    c.beginPath()
    c.ellipse(0, hgt, b.w * 0.55, 2.4, 0, 0, Math.PI * 2)
    c.fill()
  }
  if (b.move === 'burrow' && b.state !== 'sleep' && b.state !== 'intro') mound(c, t, false)
  c.save()
  let sxk = 1
  let syk = 1
  let hit = -1
  if (b.state === 'warn') c.translate(Math.sin(t * 46) * 0.7, 0)
  if (b.state === 'tired') {
    // soluk soluğa: çöker, yalpalar
    sxk = 1.08
    syk = 0.9 + Math.sin(t * 11) * 0.025
    c.rotate(Math.sin(t * 3.2) * 0.05)
  }
  if (b.state === 'hurt') {
    // ez, sonra yaylan: önce yassılır, geri gelirken boyu uzar
    hit = 1 - Math.min(1, Math.max(0, b.timer / 0.9))
    const k = hit < 0.25 ? Math.sin((hit / 0.25) * (Math.PI / 2)) : Math.cos(((hit - 0.25) / 0.75) * Math.PI * 2.5) * (1 - hit)
    sxk = 1 + 0.3 * k
    syk = 1 - 0.34 * k
    if (Math.floor(t * 20) % 2) c.globalAlpha = 0.6
  }
  if (b.state === 'intro') syk = 1 + Math.abs(Math.sin(t * 9)) * 0.08
  let bye = 0
  if (b.state === 'down') {
    // veda: sersemleyip küçülerek kaybolur
    bye = Math.min(1, b.timer / 1.4)
    c.globalAlpha = 1 - bye * bye
    c.rotate(bye * 1.2 * b.dir)
    sxk = syk = 1 - bye * 0.5
    c.translate(0, -bye * 14)
  }
  c.scale(sxk * b.dir, syk)
  // gövde kutusundan biraz büyük çizilir: heybetli dursun
  c.scale(1.12, 1.12)
  if (c.globalAlpha > 0.01) PAINT[city](c, b, mood, t)
  c.restore()
  const top = -b.h * 1.12
  if (b.state === 'tired') stars(c, top - 7, t)
  if (hit >= 0) thump(c, top * syk - 3, hit)
  if (b.state === 'down') {
    c.globalAlpha = Math.max(0, 1 - bye * bye * bye)
    whiteFlag(c, -b.dir * b.w * 0.3, top * 0.7 - bye * 8, t, Math.min(1, b.timer / 0.18))
    c.globalAlpha = 1
  }
  if (b.state === 'sleep') zzz(c, b.dir * 6, top - 3, t)
}
