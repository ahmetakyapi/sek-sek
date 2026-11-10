/**
 * Şehir patronlarının çizimi: oyuncu karakterleriyle aynı dil (mürekkep dış hat, düz renk, tek kademe gölge).
 * Birim dünya pikseli; (0, 0) gövdenin taban ortası, y yukarı eksi. Her patron sağa bakar, sola dönünce aynalanır.
 * Ruh hâli bütün patronlarda aynı okunur: öfkeli (saldırı), titrek (işaret), sarmal göz + yıldız (yorgun), kapalı göz (uyku).
 */
import type { Boss } from './boss'
import { INK, blob, setInkWidth, stroke } from './heroDraw'
import type { CityKey } from './types'

type Ctx = CanvasRenderingContext2D
type Mood = 'calm' | 'angry' | 'dizzy' | 'sleep' | 'hurt'

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

/** Göz: ruh hâline göre bebek, kaş ve kapak. r: yarıçap. */
function eye(c: Ctx, x: number, y: number, r: number, mood: Mood, t: number) {
  if (mood === 'sleep' || mood === 'hurt') {
    c.strokeStyle = INK
    c.lineWidth = 0.9
    c.lineCap = 'round'
    c.beginPath()
    if (mood === 'sleep') {
      c.moveTo(x - r, y)
      c.quadraticCurveTo(x, y + r * 0.9, x + r, y)
    } else {
      c.moveTo(x - r, y - r * 0.7)
      c.lineTo(x + r * 0.6, y)
      c.lineTo(x - r, y + r * 0.7)
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
  c.beginPath()
  c.arc(x + r * 0.3, y + r * 0.1, r * 0.5, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.beginPath()
  c.arc(x + r * 0.05, y - r * 0.25, r * 0.2, 0, Math.PI * 2)
  c.fillStyle = '#ffffff'
  c.fill()
  if (mood === 'angry') {
    // çatık kaş
    c.strokeStyle = INK
    c.lineWidth = 1.1
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x - r * 1.2, y - r * 1.5)
    c.lineTo(x + r * 1.1, y - r * 0.7)
    c.stroke()
  }
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

type Painter = (c: Ctx, b: Boss, mood: Mood, t: number) => void

const PAINT: Record<CityKey, Painter> = {
  // Simit Hırsızı Martı: beyaz gövde, gri kanat, gagasında simit
  istanbul: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flap = air ? Math.sin(t * 16) * 6 : 0
    poly(c, [-9, -9, -17, -13 - flap, -13, -7], '#8e98a8', '#5e6878')
    ell(c, 0, -9, 10.5, 7.5, '#f6f4ee', '#c8ccd4')
    poly(c, [-3, -11, -12, -17 - flap * 1.2, -1, -6], '#a8b2c0', '#6e7888')
    ell(c, 7, -14, 5.2, 4.8, '#f6f4ee', '#c8ccd4')
    poly(c, [11, -15, 17, -13.2, 11, -11.6], '#f2b23a', '#c07e1c')
    // simit
    c.beginPath()
    c.arc(15.5, -9.6, 3, 0, Math.PI * 2)
    c.strokeStyle = INK
    c.lineWidth = 3.2
    c.stroke()
    c.strokeStyle = '#c47a2c'
    c.lineWidth = 1.8
    c.stroke()
    eye(c, 8.4, -15, 1.9, mood, t)
    if (!air) feet(c, 3, '#f2b23a')
  },
  // Pişmaniye Yumağı: bulut gibi kabarık, yuvarlanırken döner
  kocaeli: (c, b, mood, t) => {
    const roll = b.state === 'attack' ? (b.x / 11) * b.dir : 0
    c.save()
    c.translate(0, -11)
    c.rotate(roll)
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
    // tel tel şeker
    c.strokeStyle = 'rgba(190,170,140,0.7)'
    c.lineWidth = 0.5
    for (let i = 0; i < 5; i++) {
      c.beginPath()
      c.arc(0, 0, 3 + i * 1.6, i * 1.3, i * 1.3 + 1.6)
      c.stroke()
    }
    c.restore()
    eye(c, 1.5, -12.5, 2.3, mood, t)
    eye(c, 7.5, -12.5, 2.1, mood, t)
    c.fillStyle = 'rgba(240,130,120,0.5)'
    c.beginPath()
    c.ellipse(-1, -8.6, 1.8, 1.1, 0, 0, Math.PI * 2)
    c.fill()
    if (b.state !== 'attack') feet(c, 4, '#c9a05a')
  },
  // Körfez Ahtapotu: mor kubbe baş, kıvrılan kollar
  izmir: (c, _b, mood, t) => {
    for (let i = 0; i < 4; i++) {
      const x = -9 + i * 6
      const w = Math.sin(t * 5 + i * 1.4) * 2.2
      stroke(c, [x, -6, x + w, -2.6, x - w * 0.6, 0], 3.4, i % 2 ? '#a8558e' : '#c46aa6')
    }
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
    c.fillStyle = 'rgba(255,220,240,0.5)'
    for (const [x, y] of [[-6, -17], [-2, -19.4], [-7, -12]]) {
      c.beginPath()
      c.arc(x, y, 1.1, 0, Math.PI * 2)
      c.fill()
    }
    eye(c, 1.6, -12, 2.6, mood, t)
    eye(c, 7.6, -12, 2.3, mood, t)
  },
  // Evrak Canavarı: dosya yığını, kravat, elinde mühür
  ankara: (c, b, mood, t) => {
    feet(c, 4.5, '#3a3440', b.state === 'move' ? Math.sin(t * 12) * 1.4 : 0)
    for (let i = 0; i < 5; i++) {
      const y = -4 - i * 4
      const dx = Math.sin(i * 2.1 + t * (b.state === 'warn' ? 30 : 0)) * 0.9
      poly(c, [-9 + dx, y, 9 + dx, y - 0.6, 9.6 + dx, y - 4.2, -8.4 + dx, y - 3.8], i % 2 ? '#f4ecd8' : '#e2d2a8', i % 2 ? '#d4c8ac' : '#c0ac7c')
    }
    poly(c, [1.5, -15, 4.5, -15, 5.2, -8, 3, -5.4, 0.8, -8], '#d83c36', '#9e2430')
    eye(c, -1, -19.4, 2.2, mood, t)
    eye(c, 5.4, -19.4, 2.2, mood, t)
    // mühür: sapı ve lastiği
    const lift = b.state === 'warn' ? -5 : 0
    stroke(c, [9, -12, 13, -14 + lift], 2.4, '#e2d2a8')
    poly(c, [11.6, -19 + lift, 15.6, -19 + lift, 15.2, -15 + lift, 12, -15 + lift], '#7a4a2e', '#4e2e1c')
    poly(c, [10.6, -15 + lift, 16.6, -15 + lift, 16.6, -13 + lift, 10.6, -13 + lift], '#d83c36')
  },
  // Dev Topaç: ağaç gövde, çini şeritler, demir uç
  konya: (c, b, mood, t) => {
    const wob = mood === 'dizzy' ? Math.sin(t * 5) * 0.22 : b.state === 'attack' ? Math.sin(t * 40) * 0.05 : 0
    c.save()
    c.rotate(wob)
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
    const off = b.state === 'attack' || b.state === 'warn' ? (t * 30) % 6 : 0
    c.save()
    c.beginPath()
    c.rect(-12, -19.5, 24, 3.4)
    c.clip()
    c.fillStyle = '#2f9a94'
    c.fillRect(-13, -19.5, 26, 3.4)
    c.fillStyle = '#f4ead8'
    for (let x = -14 + off; x < 14; x += 6) c.fillRect(x, -18.6, 2.4, 1.6)
    c.restore()
    c.strokeStyle = INK
    c.lineWidth = 0.7
    c.strokeRect(-11.8, -19.5, 23.6, 3.4)
    poly(c, [-1.6, -23.4, 1.6, -23.4, 1, -27, -1, -27], '#8e5a2a')
    eye(c, -1.4, -12.4, 2.2, mood, t)
    eye(c, 5, -12.4, 2.2, mood, t)
    c.restore()
  },
  // Kaçak Balon: çizgili kubbe, altında sepet
  nevsehir: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    stroke(c, [-5, -11, -3.4, -6], 0.9, '#5a3c26', false)
    stroke(c, [5, -11, 3.4, -6], 0.9, '#5a3c26', false)
    poly(c, [-4.4, -6.4, 4.4, -6.4, 3.6, 0, -3.6, 0], '#b8793c', '#7e4e22')
    const puff = 1 + (air ? Math.sin(t * 6) * 0.03 : 0)
    c.save()
    c.translate(0, -18)
    c.scale(puff, puff)
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
    c.ellipse(-6.6, -1, 2.6, 10, 0.25, 0, Math.PI * 2)
    c.ellipse(6.6, -1, 2.6, 10, -0.25, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#3aa0c8'
    c.beginPath()
    c.ellipse(0, -1, 2.4, 10, 0, 0, Math.PI * 2)
    c.fill()
    c.restore()
    c.restore()
    eye(c, -1.6, -17, 2.3, mood, t)
    eye(c, 5, -17, 2.3, mood, t)
  },
  // Acı Biber: kırmızı gövde, yeşil sap, dili dışarıda
  adana: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    if (!air) feet(c, 3.4, '#7a2a1e')
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
    eye(c, -1.4, -13.6, 2.1, mood, t)
    eye(c, 4.4, -13.6, 2.1, mood, t)
    if (mood === 'dizzy') {
      // dili yanmış
      poly(c, [0, -8.6, 3.6, -8.6, 3, -5, 0.6, -5], '#ff9aa8')
    } else if (air) {
      c.fillStyle = '#ffb84a'
      for (let i = 0; i < 3; i++) {
        c.beginPath()
        c.arc(-3 + i * 3, 1 + ((t * 20 + i * 3) % 5), 1.4 - i * 0.2, 0, Math.PI * 2)
        c.fill()
      }
    }
  },
  // Fıstık Hırsızı: maskeli fare, sırtında çuval
  gaziantep: (c, b, mood, t) => {
    const run = b.state === 'attack' && b.move === 'charge' ? Math.sin(t * 26) * 1.6 : 0
    stroke(c, [-8, -4, -14, -3, -16, -8], 1.6, '#c89a9a')
    ell(c, -6.5, -12, 6, 6.4, '#c9b27a', '#9a8250')
    stroke(c, [-9, -17.6, -6, -19, -3.6, -17.4], 1, '#7a6238', false)
    feet(c, 4, '#c89a9a', run)
    ell(c, 0.5, -8, 8.6, 6.6, '#8e8a92', '#625e68')
    ell(c, 6.6, -12.6, 5.6, 5, '#9e9aa2', '#6e6a74')
    ell(c, 3.6, -18.2, 2.8, 3, '#9e9aa2', '#c89a9a')
    ell(c, 8.4, -18, 2.6, 2.8, '#9e9aa2', '#c89a9a')
    // maske
    c.fillStyle = INK
    c.beginPath()
    c.roundRect(3.2, -15.4, 8.6, 3.6, 1.6)
    c.fill()
    eye(c, 5.6, -13.6, 1.4, mood, t)
    eye(c, 9.4, -13.6, 1.3, mood, t)
    ell(c, 12.2, -11.2, 1.2, 1, '#3a2a2a')
  },
  // Şahmaran'ın Sınavı: taçlı yılan gövdesi, mücevherli
  mardin: (c, b, mood, t) => {
    const sway = Math.sin(t * 3) * 1.6
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
    ell(c, 1 + sway, -21, 6, 5.4, '#f0c8a0', '#c89a70')
    poly(c, [-4 + sway, -25, -2.6 + sway, -30, 0 + sway, -26.6, 1.6 + sway, -31, 3.4 + sway, -26.6, 5.6 + sway, -30, 6.4 + sway, -25], '#f2c14e', '#b8862a')
    ell(c, 1.4 + sway, -27.4, 0.9, 0.9, '#d83c36')
    eye(c, -0.6 + sway, -21.4, 1.8, mood, t)
    eye(c, 4 + sway, -21.4, 1.7, mood, t)
    if (b.state === 'warn' && b.move === 'throw') ell(c, 9 + sway, -16, 2, 2, '#58d0e0', '#2a8a9a')
  },
  // Dev Kayısı: turuncu, yanağı kızarmış, sapında yaprak
  malatya: (c, b, mood, t) => {
    const roll = b.state === 'attack' && b.move === 'charge' ? (b.x / 11) * b.dir : 0
    const air = b.y < b.floor - b.h - 2
    if (!air && !roll) feet(c, 4, '#b8601e')
    c.save()
    c.translate(0, -12)
    c.rotate(roll)
    ell(c, 0, 0, 11.6, 11, '#f6a23c', '#d0742a')
    stroke(c, [-1, -10.4, -2.6, 0, -0.6, 10], 0.9, '#d0742a', false)
    c.fillStyle = 'rgba(240,90,60,0.45)'
    c.beginPath()
    c.ellipse(-5.4, 3, 3.6, 2.6, 0, 0, Math.PI * 2)
    c.fill()
    stroke(c, [0, -11, 0.6, -14], 1.4, '#6a4a2e')
    poly(c, [0.6, -13.6, 7, -17, 5.4, -11.6], '#5aa03e', '#3a7028')
    c.restore()
    if (!roll) {
      eye(c, 0.6, -13.4, 2.4, mood, t)
      eye(c, 7, -13.4, 2.2, mood, t)
    }
  },
  // Leblebi Tavası: bakır tava, içinde hoplayan leblebiler
  corum: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    if (!air) feet(c, 6, '#5a3a24')
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
      '#c8743a',
      shade('#8e4a20'),
    )
    stroke(c, [-12.4, -14.6, 12.4, -14.6], 1.4, '#f0a868', false)
    eye(c, -1.6, -9.4, 2.2, mood, t)
    eye(c, 5, -9.4, 2.2, mood, t)
    if (mood !== 'dizzy' && b.state !== 'sleep') {
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
  // Fındık Kurdu: boğumlu krem gövde, fındık kabuğundan miğfer
  ordu: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const inch = air ? 0 : Math.sin(t * 6) * 0.8
    ell(c, -6, -5, 5.2, 5, '#f2e2b4', '#c8b47e')
    ell(c, -1, -8 - inch, 5.6, 5.6, '#f6e8c0', '#c8b47e')
    ell(c, 4, -12.5, 6.4, 6.4, '#f6e8c0', '#c8b47e')
    blob(
      c,
      () => {
        c.moveTo(-2.6, -15)
        c.quadraticCurveTo(-2, -22.6, 4, -22.6)
        c.quadraticCurveTo(10, -22.6, 10.6, -15)
        c.quadraticCurveTo(4, -17.6, -2.6, -15)
      },
      '#a8693a',
      shade('#6e4220'),
    )
    stroke(c, [4, -22.6, 4.6, -25], 1.2, '#6e4220')
    stroke(c, [9.6, -11.6, 14, -10.4], 1.8, '#c8b47e')
    eye(c, 3, -12.8, 1.9, mood, t)
    eye(c, 7.6, -12.8, 1.8, mood, t)
  },
  // Hamsi Kralı: gümüş balık, başında minik taç
  trabzon: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flop = mood === 'dizzy' ? Math.sin(t * 9) * 0.12 : air ? Math.sin(t * 14) * 0.1 : 0
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
    poly(c, [-2, -7, 1, -11, 3, -6.6], '#6a9ab8')
    poly(c, [4, -8, 4.6, -12.4, 6.4, -9.6, 8, -13, 9.4, -9.4, 11, -12, 11.4, -7], '#f2c14e', '#b8862a')
    eye(c, 7.6, -2.4, 2.4, mood, t)
    stroke(c, [10.6, 2, 12.6, 1.4], 0.8, INK, false)
    c.restore()
  },
  // Ayaz Dede: kardan gövde, buzdan sakal, mavi külah
  sivas: (c, b, mood, t) => {
    const slide = b.state === 'attack' && b.move === 'charge'
    ell(c, 0, -7.4, 10, 7.6, '#f4f9ff', '#c0d4ea')
    ell(c, 1, -17, 7, 6.4, '#f8fcff', '#c8daee')
    blob(
      c,
      () => {
        c.moveTo(-3, -14)
        c.quadraticCurveTo(2, -6, 1 + Math.sin(t * 3) * 0.6, -3.6)
        c.quadraticCurveTo(7, -8, 7.6, -14.4)
        c.quadraticCurveTo(2, -12.6, -3, -14)
      },
      '#d2e8f8',
      shade('#9ec0dc'),
    )
    poly(c, [-6, -21, 0, -31 + (slide ? 1 : 0), 8, -21.4], '#4a7ec0', '#2e5a94')
    ell(c, 0, -31, 1.6, 1.6, '#f8fcff')
    stroke(c, [-6.4, -21, 8.4, -21.4], 2.2, '#f8fcff')
    eye(c, -0.4, -18.6, 1.8, mood, t)
    eye(c, 4.6, -18.6, 1.7, mood, t)
    ell(c, 7.6, -16.4, 1.4, 1.1, '#f08a5a')
    if (b.state === 'warn' && b.move === 'throw') ell(c, 11, -13, 2.6, 2.6, '#ffffff', '#c0d4ea')
  },
  // Dev Kaz: beyaz gövde, uzun boyun, turuncu gaga
  ardahan: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const flap = air ? Math.sin(t * 15) * 5 : 0
    const run = b.state === 'attack' && !air ? Math.sin(t * 24) * 1.6 : 0
    if (!air) feet(c, 3.6, '#f08a3a', run)
    const low = b.state === 'attack' && !air ? 5 : 0
    ell(c, -2, -9, 10.6, 7.4, '#f8f6f0', '#c8ccd2')
    poly(c, [-6, -11, -14, -15 - flap, -2, -5], '#e2e4e8', '#a8aeb8')
    stroke(c, [5, -12, 8 + low, -19 + low, 9 + low, -22 + low * 1.4], 4.6, '#f8f6f0')
    ell(c, 10 + low, -23 + low * 1.4, 3.8, 3.4, '#f8f6f0', '#c8ccd2')
    poly(c, [12.6 + low, -24.4 + low * 1.4, 18 + low, -22.6 + low * 1.4, 12.6 + low, -21 + low * 1.4], '#f08a3a', '#c05e1c')
    eye(c, 11 + low, -23.8 + low * 1.4, 1.5, mood, t)
  },
  // Tepegöz: tek gözlü dev, boynuzlu, elinde topuz
  bayburt: (c, b, mood, t) => {
    const air = b.y < b.floor - b.h - 2
    const step = b.state === 'attack' && b.move === 'charge' ? Math.sin(t * 20) * 1.8 : 0
    if (!air) feet(c, 5.4, '#4e3a30', step)
    // topuz
    const lift = b.state === 'warn' ? -0.9 : 0.2
    c.save()
    c.translate(-9, -13)
    c.rotate(lift)
    stroke(c, [0, 0, -3, -11], 2.4, '#6a4a2e')
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
    poly(c, [-8, -22.6, -11, -29, -5, -24.6], '#f0e6c8', '#c4b890')
    poly(c, [8, -22.6, 11, -29, 5, -24.6], '#f0e6c8', '#c4b890')
    // koca tek göz
    eye(c, 1.6, -16.4, 5, mood, t)
    // diş
    c.strokeStyle = INK
    c.lineWidth = 0.9
    c.beginPath()
    c.moveTo(-4, -7)
    c.quadraticCurveTo(1.6, -5, 7, -7.4)
    c.stroke()
    poly(c, [-2, -7, -1, -4.6, 0, -6.6], '#f8f4e8')
    poly(c, [4, -7, 5, -4.8, 6, -7.2], '#f8f4e8')
  },
}

/** Yerden çıkan patronun işareti: kabaran toprak, sıçrayan çakıllar. */
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

/**
 * Patronu ekran pikselinde çizer. (x, y): gövde kutusunun taban ortası, sc: bir dünya pikseli kaç ekran pikseli.
 */
export function drawBoss(c: Ctx, city: CityKey, b: Boss, x: number, y: number, sc: number, t: number): void {
  c.save()
  c.translate(x, y)
  c.scale(sc, sc)
  c.lineJoin = 'round'
  setInkWidth(1.15)
  try {
    paintBoss(c, city, b, t)
  } finally {
    setInkWidth(3.2)
    c.restore()
  }
}

function paintBoss(c: Ctx, city: CityKey, b: Boss, t: number) {
  if (b.hidden) {
    if (b.state === 'warn') mound(c, t, true)
    return
  }
  const mood: Mood = b.state === 'sleep' ? 'sleep' : b.state === 'tired' ? 'dizzy' : b.state === 'hurt' || b.state === 'down' ? 'hurt' : b.state === 'attack' || b.state === 'warn' ? 'angry' : 'calm'
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
  if (b.state === 'warn') c.translate(Math.sin(t * 46) * 0.7, 0)
  if (b.state === 'tired') {
    sxk = 1.08
    syk = 0.9 + Math.sin(t * 5) * 0.02
  }
  if (b.state === 'hurt') {
    const k = Math.sin(Math.min(1, b.timer / 0.9) * Math.PI)
    sxk = 1 + 0.2 * k
    syk = 1 - 0.2 * k
    if (Math.floor(t * 20) % 2) c.globalAlpha = 0.55
  }
  if (b.state === 'intro') syk = 1 + Math.abs(Math.sin(t * 9)) * 0.08
  if (b.state === 'down') {
    // veda: sersemleyip küçülerek kaybolur
    const k = Math.min(1, b.timer / 1.4)
    c.globalAlpha = 1 - k
    c.rotate(k * 1.2 * b.dir)
    sxk = syk = 1 - k * 0.5
    c.translate(0, -k * 14)
  }
  c.scale(sxk * b.dir, syk)
  // gövde kutusundan biraz büyük çizilir: heybetli dursun
  c.scale(1.12, 1.12)
  if (c.globalAlpha > 0.01) PAINT[city](c, b, mood, t)
  c.restore()
  if (b.state === 'tired') stars(c, -b.h * 1.12 - 7, t)
  if (b.state === 'sleep') {
    c.fillStyle = '#f4ead8'
    c.strokeStyle = INK
    c.lineWidth = 0.7
    c.font = '700 6px ui-monospace, monospace'
    const k = (t * 0.6) % 1
    c.globalAlpha = 1 - k
    c.strokeText('z', 8 + k * 5, -b.h - 4 - k * 9)
    c.fillText('z', 8 + k * 5, -b.h - 4 - k * 9)
    c.globalAlpha = 1
  }
}
