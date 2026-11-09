/**
 * Elle çizilmiş görünümlü oyuncu karakterleri: vektör eğrilerle, ekran çözünürlüğünde.
 * Mürekkep dış hat + düz renk + tek kademe gölge (ışık sol üstten). Kafa, yüz ve gövde aynı
 * yan profilden çizilir; kol ve bacaklar eklem açılarıyla (dikeyden derece, + ileri) döner.
 * Birim: karakter boyu ~100 birim, ayak tabanı orta noktası (0, 0), y yukarı eksi.
 */

export type Look = 'uktun' | 'memo'

export interface Pose {
  /** [uyluk açısı, diz bükümü] uzak ve yakın bacak */
  legs: [[number, number], [number, number]]
  /** [üst kol, ön kol] mutlak açılar, uzak ve yakın kol */
  arms: [[number, number], [number, number]]
  lean?: number
  /** yerdeyse taban zemine oturtulur */
  ground?: boolean
  bob?: number
  /** kafa ve saçın geriye savrulması (-1..1) */
  hair?: number
  blink?: boolean
}

const INK = '#22161f'

interface Skin {
  skin: string
  skinS: string
  blush: string
  hair: string
  hairS: string
  hairL: string
  iris: string
  coat: string
  coatS: string
  coatL: string
  shirt: string
  scarf: string
  scarfS: string
  pants: string
  pantsS: string
  boot: string
  bootS: string
  brow: string
  beard?: string
  beardS?: string
}

export const LOOKS: Record<Look, Skin> = {
  uktun: {
    skin: '#fbd3b4', skinS: '#e8a98a', blush: 'rgba(240,120,110,0.45)',
    hair: '#b4482a', hairS: '#7e2c20', hairL: '#e07a46', iris: '#7a4a26',
    coat: '#efb440', coatS: '#c98424', coatL: '#ffd878', shirt: '#fbf3e2',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#4f62a0', pantsS: '#35467c',
    boot: '#7a4630', bootS: '#4c2a1c', brow: '#7e2c20',
  },
  memo: {
    skin: '#e2ad84', skinS: '#c08460', blush: 'rgba(200,110,90,0.3)',
    hair: '#3a2a22', hairS: '#211612', hairL: '#5e4636', iris: '#4a2e1c',
    coat: '#2f8d9a', coatS: '#1f6472', coatL: '#58b8c0', shirt: '#f2eee6',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#3e3e4e', pantsS: '#2a2a36',
    boot: '#6a3e2a', bootS: '#3e2418', brow: '#241612',
    beard: '#3a2a22', beardS: '#241812',
  },
}

const rad = (d: number) => (d * Math.PI) / 180
const THIGH = 15
const SHIN = 13
const UPPER = 12
const FORE = 10.5
const HIP_Y = -29

function joint(x: number, y: number, a1: number, l1: number, a2: number, l2: number) {
  const kx = x + Math.sin(rad(a1)) * l1
  const ky = y + Math.cos(rad(a1)) * l1
  return { kx, ky, ex: kx + Math.sin(rad(a2)) * l2, ey: ky + Math.cos(rad(a2)) * l2 }
}

/** yerdeki pozda en alttaki tabanın zemine oturması için gereken dikey kayma */
export function groundBob(p: Pose) {
  let low = -Infinity
  for (const [t, k] of p.legs) low = Math.max(low, joint(0, HIP_Y, t, THIGH, t - k, SHIN).ey)
  return -4.5 - low
}

function stroke(c: CanvasRenderingContext2D, pts: number[], w: number, color: string, ink = true) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const path = () => {
    c.beginPath()
    c.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
  }
  if (ink) {
    path()
    c.strokeStyle = INK
    c.lineWidth = w + 3.2
    c.stroke()
  }
  path()
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke()
}

/** dolu kapalı yol: önce mürekkep dış hat, sonra renk; gölge isteğe bağlı kırpılarak eklenir */
function blob(c: CanvasRenderingContext2D, build: () => void, fill: string, shade?: { color: string; dx: number; dy: number }) {
  c.beginPath()
  build()
  c.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = INK
  c.lineWidth = 3.2
  c.stroke()
  c.fillStyle = fill
  c.fill()
  if (shade) {
    c.save()
    c.beginPath()
    build()
    c.closePath()
    c.clip()
    c.translate(shade.dx, shade.dy)
    c.beginPath()
    build()
    c.closePath()
    // gölge: şeklin kaydırılmış kopyasının dışında kalan kısmı koyulaşır
    c.rect(-200, -200, 400, 400)
    c.fillStyle = shade.color
    c.fill('evenodd')
    c.restore()
  }
}

function drawLeg(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number, t: number, k: number, near: boolean) {
  const j = joint(hx, hy, t, THIGH, t - k, SHIN)
  const pants = near ? s.pants : s.pantsS
  stroke(c, [hx, hy, j.kx, j.ky, j.ex, j.ey], 8.2, pants)
  if (near) stroke(c, [hx + 1.6, hy + 1, j.kx + 1.6, j.ky, j.ex + 1.4, j.ey - 1], 2.6, s.pantsS, false)
  // bot: baldır yönüne göre döner, burnu ileri bakar
  const shin = t - k
  const a = rad(-shin * 0.6)
  c.save()
  c.translate(j.ex, j.ey)
  c.rotate(-a)
  blob(
    c,
    () => {
      c.moveTo(-4.2, -3.5)
      c.lineTo(3, -3.5)
      c.quadraticCurveTo(8.4, -2.6, 8.4, 1.6)
      c.lineTo(8.4, 3.4)
      c.lineTo(-4.6, 3.4)
      c.closePath()
    },
    near ? s.boot : s.bootS,
    near ? { color: s.bootS, dx: 0, dy: -2.2 } : undefined,
  )
  c.restore()
}

function drawArm(c: CanvasRenderingContext2D, s: Skin, sx: number, sy: number, a1: number, a2: number, near: boolean) {
  const j = joint(sx, sy, a1, UPPER, a2, FORE)
  stroke(c, [sx, sy, j.kx, j.ky, j.ex, j.ey], 7, near ? s.coat : s.coatS)
  if (near) stroke(c, [sx - 1.2, sy, j.kx - 1.2, j.ky, j.ex - 1, j.ey], 2, s.coatL, false)
  // el
  c.beginPath()
  c.arc(j.ex + Math.sin(rad(a2)) * 2, j.ey + Math.cos(rad(a2)) * 2, 3.3, 0, Math.PI * 2)
  c.strokeStyle = INK
  c.lineWidth = 3.2
  c.stroke()
  c.fillStyle = near ? s.skin : s.skinS
  c.fill()
}

function drawTorso(c: CanvasRenderingContext2D, s: Skin, x: number, y: number) {
  // ceket: omuzdan bele hafif daralan yuvarlak gövde
  blob(
    c,
    () => {
      c.moveTo(x - 8.5, y - 25)
      c.quadraticCurveTo(x, y - 28.5, x + 8.5, y - 25)
      c.quadraticCurveTo(x + 11.5, y - 12, x + 9.5, y + 1.5)
      c.quadraticCurveTo(x, y + 3.2, x - 9.5, y + 1.5)
      c.quadraticCurveTo(x - 11.5, y - 12, x - 8.5, y - 25)
    },
    s.coat,
    { color: s.coatS, dx: -3.2, dy: -1 },
  )
  // gömlek açıklığı ve yaka
  c.beginPath()
  c.moveTo(x + 1.5, y - 25)
  c.lineTo(x + 7.5, y - 25)
  c.lineTo(x + 5.5, y - 12)
  c.closePath()
  c.fillStyle = s.shirt
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 1.6
  c.stroke()
  // ceket parlaması sol kenarda
  stroke(c, [x - 7.2, y - 22, x - 8.6, y - 10, x - 7.6, y - 2], 1.8, s.coatL, false)
}

function drawScarf(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, t: number, moving: boolean) {
  // arka uç: ensede düğümden çıkar, koşarken rüzgârda dalgalanır
  const len = moving ? 17 : 9
  const wv = Math.sin(t * (moving ? 13 : 3.5))
  c.beginPath()
  c.moveTo(x - 6, y - 26)
  c.bezierCurveTo(x - 6 - len * 0.4, y - 25 + wv * 2, x - 6 - len * 0.7, y - 20 - wv * 2.5, x - 6 - len, y - (moving ? 23 : 15) + wv * 3)
  c.lineTo(x - 6 - len + 1, y - (moving ? 19 : 11) + wv * 3)
  c.bezierCurveTo(x - 6 - len * 0.6, y - 16 - wv * 2, x - 6 - len * 0.3, y - 21 + wv, x - 5, y - 22)
  c.closePath()
  c.strokeStyle = INK
  c.lineWidth = 3
  c.lineJoin = 'round'
  c.stroke()
  c.fillStyle = s.scarfS
  c.fill()
  // boyun sargısı
  blob(
    c,
    () => {
      c.moveTo(x - 8, y - 28)
      c.quadraticCurveTo(x, y - 31, x + 8.5, y - 27.5)
      c.lineTo(x + 8, y - 22.5)
      c.quadraticCurveTo(x, y - 25, x - 8, y - 23)
    },
    s.scarf,
    { color: s.scarfS, dx: 0, dy: -2.2 },
  )
  // önden düşen uç
  blob(
    c,
    () => {
      c.moveTo(x + 2.5, y - 24)
      c.lineTo(x + 6.5, y - 24)
      c.lineTo(x + 6, y - 13)
      c.lineTo(x + 3.8, y - 14.5)
      c.lineTo(x + 2, y - 12.5)
    },
    s.scarf,
    { color: s.scarfS, dx: -1.6, dy: 0 },
  )
}

function eye(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, w: number, blink: boolean) {
  if (blink) {
    c.beginPath()
    c.moveTo(x - w, y + 0.5)
    c.quadraticCurveTo(x, y + 2.2, x + w, y + 0.5)
    c.strokeStyle = INK
    c.lineWidth = 1.6
    c.lineCap = 'round'
    c.stroke()
    return
  }
  c.beginPath()
  c.ellipse(x, y, w, 3.6, 0, 0, Math.PI * 2)
  c.fillStyle = '#ffffff'
  c.fill()
  c.beginPath()
  c.ellipse(x + w * 0.25, y + 0.4, w * 0.72, 3.1, 0, 0, Math.PI * 2)
  c.fillStyle = s.iris
  c.fill()
  c.beginPath()
  c.ellipse(x + w * 0.3, y + 0.6, w * 0.38, 1.9, 0, 0, Math.PI * 2)
  c.fillStyle = INK
  c.fill()
  c.beginPath()
  c.arc(x - w * 0.15, y - 1.2, 1.05, 0, Math.PI * 2)
  c.fillStyle = '#ffffff'
  c.fill()
  // üst kirpik çizgisi
  c.beginPath()
  c.moveTo(x - w - 0.6, y - 1.2)
  c.quadraticCurveTo(x, y - 5.2, x + w + 0.6, y - 1.6)
  c.strokeStyle = INK
  c.lineWidth = 1.9
  c.lineCap = 'round'
  c.stroke()
}

function drawHead(c: CanvasRenderingContext2D, look: Look, s: Skin, x: number, y: number, blink: boolean, hair: number) {
  const hx = x + 1.5
  const hy = y - 47
  // arka saç (Uktun): enseden sırta dalgalı iner, savrulmayla geriye açılır
  if (look === 'uktun') {
    const sw = hair * 3
    blob(
      c,
      () => {
        c.moveTo(hx - 4, hy - 18)
        c.bezierCurveTo(hx - 24 - sw, hy - 14, hx - 22 - sw, hy + 8, hx - 18 - sw * 1.6, hy + 22)
        c.quadraticCurveTo(hx - 13 - sw, hy + 25, hx - 8 - sw * 0.6, hy + 20)
        c.quadraticCurveTo(hx - 6, hy + 10, hx + 2, hy + 4)
      },
      s.hair,
      { color: s.hairS, dx: 3, dy: -2 },
    )
  }
  // kulak hizasında boyun
  stroke(c, [hx - 1, hy + 14, hx - 1, hy + 19], 6.5, s.skinS)
  // kafa: hafif oval, çene öne doğru
  blob(
    c,
    () => {
      c.moveTo(hx - 15, hy - 2)
      c.bezierCurveTo(hx - 16, hy - 19, hx + 14, hy - 22, hx + 17, hy - 4)
      c.bezierCurveTo(hx + 18.5, hy + 4, hx + 15, hy + 13, hx + 6, hy + 15.5)
      c.bezierCurveTo(hx - 3, hy + 17.5, hx - 14, hy + 12, hx - 15, hy - 2)
    },
    s.skin,
    { color: s.skinS, dx: 3, dy: -2.4 },
  )
  // yanaklar
  c.fillStyle = s.blush
  c.beginPath()
  c.ellipse(hx + 2.5, hy + 6.5, 3.2, 1.9, 0, 0, Math.PI * 2)
  c.ellipse(hx + 14.2, hy + 6.2, 2, 1.7, 0, 0, Math.PI * 2)
  c.fill()
  // gözler: yakın göz büyük, uzak göz yüz kenarında dar
  eye(c, s, hx + 5, hy + 0.5, 3, blink)
  eye(c, s, hx + 13.2, hy + 0.2, 2.1, blink)
  // kaşlar
  c.strokeStyle = s.brow
  c.lineCap = 'round'
  c.lineWidth = look === 'memo' ? 2.4 : 1.6
  c.beginPath()
  // kaşlar gözün epey üstünde ve yukarı kavisli: yüz yumuşak ve meraklı baksın
  c.moveTo(hx + 1.4, hy - 6.2)
  c.quadraticCurveTo(hx + 4.6, hy - 9.6, hx + 8, hy - 7.8)
  c.moveTo(hx + 11.6, hy - 7.9)
  c.quadraticCurveTo(hx + 13.8, hy - 9.4, hx + 15.6, hy - 7.4)
  c.stroke()
  // burun: profilde küçük bir kıvrım
  c.strokeStyle = s.skinS
  c.lineWidth = 1.4
  c.beginPath()
  c.moveTo(hx + 10.6, hy + 3)
  c.quadraticCurveTo(hx + 12, hy + 6, hx + 10.2, hy + 6.6)
  c.stroke()
  // sakal (Memo): çene hattını sarar, bıyıkla ağzı çerçeveler
  if (s.beard) {
    blob(
      c,
      () => {
        c.moveTo(hx - 9, hy + 2)
        c.quadraticCurveTo(hx - 8, hy + 12, hx - 1, hy + 15)
        c.quadraticCurveTo(hx + 7, hy + 19, hx + 13.5, hy + 13)
        c.quadraticCurveTo(hx + 16.5, hy + 9, hx + 16.6, hy + 6)
        c.quadraticCurveTo(hx + 12, hy + 7, hx + 9, hy + 7.2)
        c.quadraticCurveTo(hx + 3, hy + 7.5, hx - 2, hy + 9)
        c.quadraticCurveTo(hx - 5, hy + 6, hx - 6, hy + 1.5)
      },
      s.beard,
      { color: s.beardS!, dx: 2, dy: -1.6 },
    )
  }
  // ağız: hafif gülümseme
  c.strokeStyle = s.beard ? '#e8b8a0' : '#a8364a'
  c.lineWidth = 1.6
  c.beginPath()
  c.moveTo(hx + 8.5, hy + 10)
  c.quadraticCurveTo(hx + 11, hy + 11.8, hx + 13.2, hy + 9.6)
  c.stroke()
  // ön saç
  if (look === 'uktun') {
    blob(
      c,
      () => {
        c.moveTo(hx - 16, hy + 2)
        c.bezierCurveTo(hx - 19, hy - 20, hx + 6, hy - 27, hx + 17.5, hy - 9)
        c.quadraticCurveTo(hx + 18.6, hy - 11.5, hx + 16.8, hy - 12)
        // perçem alnın üstünde yukarı kıvrılır: kaş açık kalır, yüz güler
        c.quadraticCurveTo(hx + 11, hy - 11.2, hx + 6.5, hy - 14.5)
        c.quadraticCurveTo(hx + 3.5, hy - 10.5, hx - 1, hy - 11)
        c.quadraticCurveTo(hx - 5.5, hy - 8, hx - 6, hy + 4)
        // kulağın önünden düşen tutam
        c.quadraticCurveTo(hx - 7, hy + 12, hx - 4, hy + 19)
        c.quadraticCurveTo(hx - 10, hy + 17, hx - 12, hy + 10)
      },
      s.hair,
      { color: s.hairS, dx: 3.2, dy: -2.4 },
    )
    // saç parlaması
    stroke(c, [hx - 9, hy - 10, hx - 3, hy - 17, hx + 5, hy - 18.4], 2.2, s.hairL, false)
  } else {
    blob(
      c,
      () => {
        c.moveTo(hx - 15.5, hy + 4)
        c.bezierCurveTo(hx - 20, hy - 12, hx - 12, hy - 25, hx + 2, hy - 23)
        // dalgalı tepe
        c.quadraticCurveTo(hx + 6, hy - 27, hx + 10, hy - 22.5)
        c.quadraticCurveTo(hx + 16, hy - 23, hx + 17, hy - 15)
        c.quadraticCurveTo(hx + 19.5, hy - 12.5, hx + 16.5, hy - 10.5)
        c.quadraticCurveTo(hx + 12, hy - 13.5, hx + 7, hy - 12)
        c.quadraticCurveTo(hx + 2, hy - 14.5, hx - 2, hy - 11)
        c.quadraticCurveTo(hx - 5.5, hy - 7, hx - 7, hy - 1)
        // favori sakala bağlanır
        c.lineTo(hx - 7.2, hy + 5)
        c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
      },
      s.hair,
      { color: s.hairS, dx: 3, dy: -2.2 },
    )
    stroke(c, [hx - 10, hy - 13, hx - 5, hy - 19.5, hx + 3, hy - 20.6], 2, s.hairL, false)
    stroke(c, [hx + 7, hy - 19.5, hx + 12, hy - 18.5], 1.6, s.hairL, false)
  }
  // kulak (Memo'da görünür)
  if (look === 'memo') {
    blob(
      c,
      () => {
        c.ellipse(hx - 9.6, hy + 1.6, 2.6, 3.6, 0.2, 0, Math.PI * 2)
      },
      s.skin,
      { color: s.skinS, dx: 1, dy: -1 },
    )
  }
}

/**
 * Karakteri çizer. (x, y): ayak tabanı orta noktası ekran pikselinde, size: karakter boyu pikselde.
 * flip: sola bakar. t: saniye (atkı ve saç salınımı).
 */
export function drawHero(c: CanvasRenderingContext2D, look: Look, pose: Pose, x: number, y: number, size: number, flip: boolean, t: number, opts: { moving?: boolean; sx?: number; sy?: number; scarf?: string; scarfS?: string } = {}) {
  const s0 = LOOKS[look]
  const s = opts.scarf ? { ...s0, scarf: opts.scarf, scarfS: opts.scarfS ?? s0.scarfS } : s0
  c.save()
  c.translate(x, y)
  const k = size / 100
  c.scale(k * (flip ? -1 : 1) * (opts.sx ?? 1), k * (opts.sy ?? 1))
  const lean = pose.lean ?? 0
  const bob = (pose.bob ?? 0) + (pose.ground ? groundBob(pose) : 0)
  const hipX = lean
  const hipY = HIP_Y + bob
  const tx = lean * 1.3
  const ty = hipY + 1
  const sY = ty - 22
  const [fa, na] = pose.arms
  const [fl, nl] = pose.legs
  // uzak kol ve bacak önce, gövde, yakın bacak, atkı, kafa, yakın kol
  drawArm(c, s, tx - 4, sY, fa[0], fa[1], false)
  drawLeg(c, s, hipX - 2.5, hipY, fl[0], fl[1], false)
  drawLeg(c, s, hipX + 2, hipY, nl[0], nl[1], true)
  drawTorso(c, s, tx, ty)
  drawScarf(c, s, tx, ty, t, !!opts.moving)
  // kafa boyuna göre biraz büyük: sevimli oran
  c.save()
  c.translate(tx + 1, ty - 28)
  c.scale(1.14, 1.14)
  c.translate(-(tx + 1), -(ty - 28))
  drawHead(c, look, s, tx + 1, ty, !!pose.blink, pose.hair ?? 0)
  c.restore()
  drawArm(c, s, tx + 4, sY, na[0], na[1], true)
  c.restore()
}

/** Koşu döngüsü (hero.py ile aynı mantık): 0 ve 4 temas, 2 ve 6 geçiş. */
export function gait(phase: number): Pose {
  const ph = phase * Math.PI * 2 + Math.PI / 2
  const sn = Math.sin(ph)
  const cs = Math.cos(ph)
  const leg = (sign: number): [number, number] => {
    const th = 32 * sn * sign
    const v = -cs * sign
    const bend = v > 0 ? 10 + 70 * Math.pow(v, 1.2) : 6 + 12 * -v
    return [th, bend]
  }
  return {
    legs: [leg(-1), leg(1)],
    arms: [
      [30 * sn, 30 * sn + 40 + 25 * Math.max(0, sn)],
      [-30 * sn, -30 * sn + 40 + 25 * Math.max(0, -sn)],
    ],
    lean: 2,
    ground: true,
    hair: -0.6,
  }
}

export const POSES: Record<string, Pose> = {
  idle: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [-8, 10]], ground: true },
  jump: { legs: [[-16, 14], [52, 96]], arms: [[-50, -30], [115, 140]], hair: 0.8 },
  apex: { legs: [[24, 80], [48, 96]], arms: [[-95, -70], [100, 125]], hair: 0.6, bob: -2 },
  fall: { legs: [[-20, 24], [18, 32]], arms: [[-120, -140], [105, 125]], hair: 1 },
  land: { legs: [[22, 70], [42, 90]], arms: [[-40, -15], [45, 75]], ground: true, hair: 0.5 },
  wall: { legs: [[8, 30], [42, 72]], arms: [[60, 80], [150, 172]] },
  dash: { legs: [[-80, 10], [-55, 40]], arms: [[-72, -82], [-82, -92]], lean: 4, hair: -1 },
  wave: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [150, 190]], ground: true },
}
