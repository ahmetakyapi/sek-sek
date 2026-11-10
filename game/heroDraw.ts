/**
 * Elle çizilmiş görünümlü oyuncu karakterleri: vektör eğrilerle, ekran çözünürlüğünde.
 * Mürekkep dış hat + düz renk + tek kademe gölge (ışık sol üstten). Kafa, yüz ve gövde aynı
 * yan profilden çizilir; kol ve bacaklar eklem açılarıyla (dikeyden derece, + ileri) döner.
 * Birim: karakter boyu ~100 birim, ayak tabanı orta noktası (0, 0), y yukarı eksi.
 */

export type Look = 'uktun' | 'memo' | 'amca' | 'teyze' | 'usta' | 'genc' | 'coban' | 'ozan'

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

export const INK = '#22161f'
/** dış hat kalınlığı (çizim biriminde): boss’lar dünya pikseliyle çizildiği için inceltir */
let inkW = 3.2
export function setInkWidth(w: number) {
  inkW = w
}

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
  /** uzun saç (sırta dökülür) */
  long?: boolean
  mustache?: string
  hat?: 'kasket' | 'yazma' | 'toque' | 'kalpak'
  hatC?: string
  hatS?: string
  /** atkısız */
  bare?: boolean
  /** dize kadar inen giysi (etek, cübbe, kepenek) */
  robe?: boolean
  prop?: 'apron' | 'staff' | 'saz'
}

export const LOOKS: Record<Look, Skin> = {
  uktun: {
    skin: '#fbd3b4', skinS: '#e8a98a', blush: 'rgba(240,120,110,0.45)',
    hair: '#b4482a', hairS: '#7e2c20', hairL: '#e07a46', iris: '#7a4a26',
    coat: '#efb440', coatS: '#c98424', coatL: '#ffd878', shirt: '#fbf3e2',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#4f62a0', pantsS: '#35467c',
    boot: '#7a4630', bootS: '#4c2a1c', brow: '#7e2c20', long: true,
  },
  memo: {
    skin: '#e2ad84', skinS: '#c08460', blush: 'rgba(200,110,90,0.3)',
    hair: '#3a2a22', hairS: '#211612', hairL: '#5e4636', iris: '#4a2e1c',
    coat: '#2f8d9a', coatS: '#1f6472', coatL: '#58b8c0', shirt: '#f2eee6',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#3e3e4e', pantsS: '#2a2a36',
    boot: '#6a3e2a', bootS: '#3e2418', brow: '#241612',
    beard: '#3a2a22', beardS: '#241812',
  },
  // ── şehir insanları: aynı çizgi, başka kılık
  amca: {
    skin: '#eab892', skinS: '#c88e6a', blush: 'rgba(210,110,90,0.3)',
    hair: '#8a8690', hairS: '#5e5a66', hairL: '#b4b0b8', iris: '#4a3424',
    coat: '#5a4a72', coatS: '#3e3252', coatL: '#7c6a96', shirt: '#f2ece0',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#4a4452', pantsS: '#322e3a',
    boot: '#3a2a26', bootS: '#241a18', brow: '#6e6a74',
    mustache: '#8a8690', hat: 'kasket', hatC: '#6a6672', hatS: '#484450', bare: true,
  },
  teyze: {
    skin: '#f0c09c', skinS: '#d09874', blush: 'rgba(230,110,100,0.4)',
    hair: '#5a3a2a', hairS: '#3a241a', hairL: '#7a543c', iris: '#5a3a24',
    coat: '#7a5a9e', coatS: '#583e78', coatL: '#9c7cc0', shirt: '#f4e6c8',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#583e78', pantsS: '#3e2a58',
    boot: '#3a2a26', bootS: '#241a18', brow: '#5a3a2a',
    hat: 'yazma', hatC: '#d0563e', hatS: '#a03a2c', bare: true, robe: true,
  },
  usta: {
    skin: '#e6b088', skinS: '#c48860', blush: 'rgba(210,110,90,0.3)',
    hair: '#3a2a22', hairS: '#241812', hairL: '#5e4636', iris: '#3a2618',
    coat: '#40557e', coatS: '#2c3c5c', coatL: '#6078a4', shirt: '#f6f2ea',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#3e3a48', pantsS: '#2a2632',
    boot: '#3a2a26', bootS: '#241a18', brow: '#2a1c16',
    mustache: '#3a2a22', hat: 'toque', hatC: '#f6f2ea', hatS: '#cfc8ba', bare: true, prop: 'apron',
  },
  genc: {
    skin: '#f4c6a0', skinS: '#d49c78', blush: 'rgba(235,120,105,0.4)',
    hair: '#33221a', hairS: '#1e130e', hairL: '#55392a', iris: '#4a3020',
    coat: '#46a078', coatS: '#2e7456', coatL: '#74c49c', shirt: '#f4efe6',
    scarf: '#f2c14e', scarfS: '#c08a24', pants: '#454566', pantsS: '#2e2e48',
    boot: '#e8e2d6', bootS: '#b4ac9c', brow: '#33221a',
  },
  coban: {
    skin: '#e0a880', skinS: '#be8258', blush: 'rgba(200,100,80,0.3)',
    hair: '#3a2a20', hairS: '#241812', hairL: '#5a4232', iris: '#3a2618',
    coat: '#9a7a50', coatS: '#725638', coatL: '#be9c6c', shirt: '#e8dcc0',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#725638', pantsS: '#523c26',
    boot: '#3a2a26', bootS: '#241a18', brow: '#2a1c16',
    mustache: '#3a2a20', hat: 'kalpak', hatC: '#6a5238', hatS: '#463422', bare: true, robe: true, prop: 'staff',
  },
  ozan: {
    skin: '#e4ac84', skinS: '#c2865e', blush: 'rgba(200,100,80,0.3)',
    hair: '#e6e2da', hairS: '#b4aea2', hairL: '#ffffff', iris: '#3a2618',
    coat: '#7a2e30', coatS: '#561e22', coatL: '#a04a48', shirt: '#f0e6d0',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#561e22', pantsS: '#3c1418',
    boot: '#3a2a26', bootS: '#241a18', brow: '#b4aea2',
    beard: '#f0ece4', beardS: '#c4beb2', hat: 'kalpak', hatC: '#2e2824', hatS: '#1a1614', bare: true, robe: true, prop: 'saz',
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

export function stroke(c: CanvasRenderingContext2D, pts: number[], w: number, color: string, ink = true) {
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
    c.lineWidth = w + inkW
    c.stroke()
  }
  path()
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke()
}

/** dolu kapalı yol: önce mürekkep dış hat, sonra renk; gölge isteğe bağlı kırpılarak eklenir */
export function blob(c: CanvasRenderingContext2D, build: () => void, fill: string, shade?: { color: string; dx: number; dy: number }) {
  c.beginPath()
  build()
  c.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = INK
  c.lineWidth = inkW
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

function drawHead(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, blink: boolean, hair: number) {
  const hx = x + 1.5
  const hy = y - 47
  // arka saç (uzun): omuzların arkasından sırta dökülür, uçları tutam tutam ayrılır; koşarken geriye savrulur
  if (s.long) {
    const sw = hair * 3.4
    blob(
      c,
      () => {
        c.moveTo(hx - 5, hy - 20)
        c.bezierCurveTo(hx - 21, hy - 19, hx - 24 - sw * 0.4, hy - 2, hx - 20 - sw, hy + 14)
        c.quadraticCurveTo(hx - 21 - sw * 1.6, hy + 23, hx - 24.5 - sw * 2.2, hy + 30)
        c.quadraticCurveTo(hx - 19 - sw * 1.6, hy + 28, hx - 17.5 - sw * 1.5, hy + 23.5)
        c.quadraticCurveTo(hx - 16.5 - sw * 1.6, hy + 29, hx - 15.5 - sw * 1.8, hy + 33.5)
        c.quadraticCurveTo(hx - 11.5 - sw * 1.2, hy + 29.5, hx - 11 - sw, hy + 24)
        c.quadraticCurveTo(hx - 9 - sw * 1.1, hy + 28, hx - 6.5 - sw * 1.2, hy + 30.5)
        c.quadraticCurveTo(hx - 3.5 - sw * 0.5, hy + 22, hx - 4, hy + 12)
        c.lineTo(hx + 1, hy + 2)
      },
      s.hair,
      { color: s.hairS, dx: 3.4, dy: -1.5 },
    )
    // saç telleri: akışı izleyen ince koyu çizgiler ve bir ışık tutamı
    stroke(c, [hx - 17, hy - 2, hx - 17.5 - sw * 0.8, hy + 12, hx - 19.5 - sw * 1.8, hy + 24], 0.9, s.hairS, false)
    stroke(c, [hx - 11, hy + 8, hx - 12 - sw, hy + 18, hx - 13.5 - sw * 1.5, hy + 27], 0.9, s.hairS, false)
    stroke(c, [hx - 20, hy - 6, hx - 21.4 - sw * 0.6, hy + 6, hx - 21.6 - sw * 1.2, hy + 15], 1.5, s.hairL, false)
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
  c.lineWidth = s.long || s.hat === 'yazma' ? 1.6 : 2
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
  // bıyık (sakalsız): ağzın üstünde iki yana sarkan kalın fırça
  if (s.mustache && !s.beard) {
    c.strokeStyle = INK
    c.lineWidth = 4.4
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(hx + 6.4, hy + 9.2)
    c.quadraticCurveTo(hx + 10.6, hy + 6.6, hx + 15, hy + 9)
    c.stroke()
    c.strokeStyle = s.mustache
    c.lineWidth = 2.4
    c.stroke()
  }
  // ön saç
  if (s.long) {
    // tepe: kabarık; yana taranmış iki uçlu perçem; şakaktan kulağın önüne inen ince bir tutam.
    // Kulak, boyun ve çene açıkta kalır: saç yüzü sarmaz, arkaya dökülür.
    blob(
      c,
      () => {
        c.moveTo(hx - 15.5, hy + 5)
        c.bezierCurveTo(hx - 21, hy - 14, hx - 8, hy - 28, hx + 5, hy - 25)
        c.bezierCurveTo(hx + 13, hy - 24, hx + 19, hy - 17, hx + 18.4, hy - 9.5)
        // perçem uçları
        c.quadraticCurveTo(hx + 18.8, hy - 8.6, hx + 16.4, hy - 8.4)
        c.quadraticCurveTo(hx + 15, hy - 11.6, hx + 11.4, hy - 13)
        c.quadraticCurveTo(hx + 11, hy - 10.4, hx + 8, hy - 9.6)
        c.quadraticCurveTo(hx + 6.4, hy - 13, hx + 1, hy - 14.4)
        // şakak: geriye taranır, kulağın önünde sivri bir tutamla biter
        c.quadraticCurveTo(hx - 3.6, hy - 9.6, hx - 4.4, hy - 2)
        c.quadraticCurveTo(hx - 3.8, hy + 5, hx - 5.6, hy + 10.5)
        c.quadraticCurveTo(hx - 8.4, hy + 5, hx - 8, hy - 2.4)
        c.quadraticCurveTo(hx - 11.6, hy - 1, hx - 13, hy + 5.6)
      },
      s.hair,
      { color: s.hairS, dx: 3.2, dy: -2.4 },
    )
    // ayrım çizgisi, teller ve parlama
    stroke(c, [hx + 1.4, hy - 14.6, hx - 2.6, hy - 20.4, hx - 9, hy - 22.6], 0.9, s.hairS, false)
    stroke(c, [hx - 9.6, hy - 9, hx - 13.4, hy - 2], 0.9, s.hairS, false)
    stroke(c, [hx + 8.4, hy - 13, hx + 12.6, hy - 17.6], 0.9, s.hairS, false)
    stroke(c, [hx - 13, hy - 12, hx - 8, hy - 19.4, hx - 1, hy - 22.2], 2.2, s.hairL, false)
    stroke(c, [hx + 6, hy - 21.6, hx + 12.4, hy - 19.4, hx + 15.4, hy - 15.4], 1.5, s.hairL, false)
  } else if (s.hat !== 'yazma') {
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
  // kulak: saçın arasından görünür (yazma kapatır)
  if (s.hat !== 'yazma') {
    blob(
      c,
      () => {
        c.ellipse(hx - 9.6, hy + 1.6, 2.6, 3.6, 0.2, 0, Math.PI * 2)
      },
      s.skin,
      { color: s.skinS, dx: 1, dy: -1 },
    )
  }
  if (s.hat) drawHat(c, s, hx, hy)
}

function drawHat(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number) {
  const col = s.hatC!
  const sh = { color: s.hatS!, dx: 3, dy: -2.2 }
  switch (s.hat) {
    case 'kasket':
      // sekiz köşe kasket: yayvan tepe, öne uzanan siper
      blob(
        c,
        () => {
          c.moveTo(hx - 17, hy - 9)
          c.bezierCurveTo(hx - 18, hy - 24, hx + 12, hy - 27, hx + 17, hy - 13)
          c.lineTo(hx + 24, hy - 10.5)
          c.quadraticCurveTo(hx + 24.5, hy - 8, hx + 22, hy - 7.6)
          c.quadraticCurveTo(hx + 4, hy - 12.5, hx - 17, hy - 9)
        },
        col,
        sh,
      )
      stroke(c, [hx - 12, hy - 15, hx - 4, hy - 20.5, hx + 6, hy - 20.5], 1.8, s.hairL, false)
      break
    case 'toque':
      // usta kalfası: beyaz bant, üstünde kabarık tepe
      blob(
        c,
        () => {
          c.moveTo(hx - 14, hy - 12)
          c.bezierCurveTo(hx - 24, hy - 22, hx - 14, hy - 36, hx - 3, hy - 30)
          c.bezierCurveTo(hx + 2, hy - 38, hx + 14, hy - 36, hx + 13, hy - 28)
          c.bezierCurveTo(hx + 22, hy - 26, hx + 20, hy - 15, hx + 15.5, hy - 13)
          c.quadraticCurveTo(hx, hy - 16.5, hx - 14, hy - 12)
        },
        col,
        sh,
      )
      stroke(c, [hx - 13.4, hy - 13.6, hx, hy - 17.6, hx + 15, hy - 14.6], 1.2, s.hatS!, false)
      break
    case 'kalpak':
      // yün kalpak: silindir, üstü hafif bombeli
      blob(
        c,
        () => {
          c.moveTo(hx - 16, hy - 9)
          c.lineTo(hx - 15, hy - 26)
          c.quadraticCurveTo(hx, hy - 32, hx + 15.5, hy - 26)
          c.lineTo(hx + 17.5, hy - 10)
          c.quadraticCurveTo(hx, hy - 15, hx - 16, hy - 9)
        },
        col,
        sh,
      )
      stroke(c, [hx - 10, hy - 14, hx - 9, hy - 24], 1.4, s.hairL, false)
      stroke(c, [hx - 3, hy - 16, hx - 2.4, hy - 26], 1.2, s.hairL, false)
      break
    case 'yazma':
      // yazma: başı sarar, enseden omuza düşer, çenenin altında düğümlenir
      blob(
        c,
        () => {
          c.moveTo(hx + 17, hy - 8)
          c.bezierCurveTo(hx + 14, hy - 26, hx - 18, hy - 27, hx - 18, hy - 2)
          c.quadraticCurveTo(hx - 19, hy + 14, hx - 12, hy + 21)
          c.quadraticCurveTo(hx - 5, hy + 19, hx - 4, hy + 13)
          c.quadraticCurveTo(hx - 9, hy + 2, hx - 4, hy - 7)
          c.quadraticCurveTo(hx + 6, hy - 12, hx + 17, hy - 8)
        },
        col,
        sh,
      )
      // oya ve puantiye
      c.fillStyle = '#f6d98a'
      for (const [dx, dy] of [[-12, -8], [-6, -17], [4, -18], [-13, 6], [11, -13]]) {
        c.beginPath()
        c.arc(hx + dx, hy + dy, 1.1, 0, Math.PI * 2)
        c.fill()
      }
      break
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
  if (s.prop === 'staff') {
    // çoban değneği: arkada, yere basar
    stroke(c, [tx - 15, ty - 44, tx - 13.5, -1.5], 2.6, '#6a4a2e')
    stroke(c, [tx - 15, ty - 44, tx - 11, ty - 48, tx - 8.5, ty - 44.5], 2.6, '#6a4a2e')
  }
  drawTorso(c, s, tx, ty)
  if (s.robe) {
    // etek / cübbe: belden bileğe, hafif açılarak iner
    blob(
      c,
      () => {
        c.moveTo(tx - 9.5, ty - 6)
        c.lineTo(tx + 9.5, ty - 6)
        c.quadraticCurveTo(tx + 12.5, ty + 10, tx + 11.5, -bob - 6)
        c.quadraticCurveTo(tx, -bob - 4, tx - 11.5, -bob - 6)
        c.quadraticCurveTo(tx - 12.5, ty + 10, tx - 9.5, ty - 6)
      },
      s.pants,
      { color: s.pantsS, dx: -3, dy: -0.5 },
    )
    stroke(c, [tx - 4, ty + 2, tx - 5, -bob - 8], 1, s.pantsS, false)
    stroke(c, [tx + 4, ty + 4, tx + 5, -bob - 8], 1, s.pantsS, false)
  }
  if (s.prop === 'apron') {
    // önlük: göğüsten dize
    blob(
      c,
      () => {
        c.moveTo(tx - 3, ty - 20)
        c.lineTo(tx + 8.5, ty - 20)
        c.lineTo(tx + 10, ty + 9)
        c.quadraticCurveTo(tx + 3, ty + 11, tx - 4.5, ty + 9)
        c.closePath()
      },
      '#f6f2ea',
      { color: '#cfc8ba', dx: -2, dy: 0 },
    )
  }
  if (s.prop === 'saz') {
    // bağlama: gövde belde, sap omuza doğru
    stroke(c, [tx + 2, ty - 8, tx + 22, ty - 30], 2.4, '#7a4a24')
    blob(
      c,
      () => {
        c.ellipse(tx + 1, ty - 6, 8.5, 6.2, -0.75, 0, Math.PI * 2)
      },
      '#b4733c',
      { color: '#7a4a24', dx: 2, dy: -2 },
    )
    c.fillStyle = INK
    c.beginPath()
    c.arc(tx + 2, ty - 7, 1.3, 0, Math.PI * 2)
    c.fill()
  }
  if (!s.bare) drawScarf(c, s, tx, ty, t, !!opts.moving)
  // kafa boyuna göre biraz büyük: sevimli oran
  c.save()
  c.translate(tx + 1, ty - 28)
  c.scale(1.14, 1.14)
  c.translate(-(tx + 1), -(ty - 28))
  drawHead(c, s, tx + 1, ty, !!pose.blink, pose.hair ?? 0)
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
