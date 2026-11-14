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
  /** saçın geriye savrulması (0 sarkık .. 1,3 dümdüz geride) */
  hair?: number
  /** üst gövdenin kalçadan öne eğilmesi (radyan, + ileri); bacaklar eğilmez */
  tilt?: number
  /** atkı ucunun ve saç uçlarının dikey savrulması (-1 aşağı çekilir: yükseliş · 1 yukarı kalkar: düşüş) */
  lift?: number
  blink?: boolean
  /** neşeli yüz (amblem, paylaşım görseli): yüksek kavisli kaş, iri göz, açık gülümseme; oyunda kullanılmaz */
  mood?: 'happy'
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
  /** kısa, bakımlı sakal (Memo): çene hattını saran düz tonlu şerit ve ince bıyık; ağız açıkta kalır */
  trim?: string
  trimS?: string
  /** kıvırcık, alna düşen saç (genç) */
  curly?: boolean
  /** uzun saç (sırta dökülür) */
  long?: boolean
  mustache?: string
  hat?: 'kasket' | 'yazma' | 'toque' | 'kalpak'
  hatC?: string
  hatS?: string
  /** atkısız */
  bare?: boolean
  /** kapitone mont: gövdede dilim dikişleri (Uktun) */
  quilt?: boolean
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
    boot: '#7a4630', bootS: '#4c2a1c', brow: '#7e2c20', long: true, quilt: true,
  },
  memo: {
    skin: '#e2ad84', skinS: '#c08460', blush: 'rgba(200,110,90,0.3)',
    hair: '#3a2a22', hairS: '#211612', hairL: '#5e4636', iris: '#4a2e1c',
    coat: '#2f8d9a', coatS: '#1f6472', coatL: '#58b8c0', shirt: '#f2eee6',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#3e3e4e', pantsS: '#2a2a36',
    boot: '#6a3e2a', bootS: '#3e2418', brow: '#241612',
    trim: '#5c4234', trimS: '#412c22',
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
    skin: '#f8d0b0', skinS: '#dca884', blush: 'rgba(235,120,105,0.4)',
    hair: '#a8683a', hairS: '#7a4424', hairL: '#d89c5e', iris: '#4f6b46',
    coat: '#e2674a', coatS: '#b4452e', coatL: '#f49272', shirt: '#f4efe6',
    scarf: '#f2c14e', scarfS: '#c08a24', pants: '#454566', pantsS: '#2e2e48',
    boot: '#e8e2d6', bootS: '#b4ac9c', brow: '#8a5430',
    curly: true, bare: true,
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
const TAU = Math.PI * 2
/** ışığın düştüğü yerde ince vurgu, kumaş ve deri üstünde */
const GLINT = 'rgba(255,255,255,0.34)'
/** ayak altındaki temas gölgesi */
const CONTACT = 'rgba(24,14,30,0.2)'

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

/** iç ayrıntı çizgisi (kıvrım, tel, dikiş): dış hattan ince, uçları yuvarlak, tek eğri */
function fine(c: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string) {
  c.beginPath()
  c.moveTo(x0, y0)
  c.quadraticCurveTo(cx, cy, x1, y1)
  c.strokeStyle = color
  c.lineWidth = w
  c.lineCap = 'round'
  c.stroke()
}

function drawLeg(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number, t: number, k: number, near: boolean) {
  const j = joint(hx, hy, t, THIGH, t - k, SHIN)
  const pants = near ? s.pants : s.pantsS
  stroke(c, [hx, hy, j.kx, j.ky, j.ex, j.ey], 8.2, pants)
  if (near) {
    // ön kenarda tek kademe gölge, uylukta ince ışık
    stroke(c, [hx + 1.6, hy + 1, j.kx + 1.6, j.ky, j.ex + 1.4, j.ey - 1], 2.6, s.pantsS, false)
    stroke(c, [hx - 2.2, hy + 2.5, j.kx - 2.2, j.ky - 1.5], 1.3, GLINT, false)
  }
  // bot: baldır yönüne göre döner, burnu ileri bakar
  const shin = t - k
  const a = rad(-shin * 0.6)
  c.save()
  c.translate(j.ex, j.ey)
  c.rotate(-a)
  blob(
    c,
    () => {
      c.moveTo(-4.3, -4)
      c.lineTo(2.8, -4)
      c.quadraticCurveTo(3.6, -1.9, 6.6, -1.2)
      c.quadraticCurveTo(9.6, -0.2, 8.9, 3.4)
      c.lineTo(-4.7, 3.4)
      c.quadraticCurveTo(-5.3, -0.4, -4.3, -4)
    },
    near ? s.boot : s.bootS,
    near ? { color: s.bootS, dx: 0, dy: -1.9 } : undefined,
  )
  if (near) {
    // konç kıvrımı ve burunda ışık
    fine(c, -3.4, -1.7, -0.6, -1.1, 2.2, -1.9, 0.9, s.bootS)
    fine(c, 4.4, -0.2, 6, 0, 6.9, 0.8, 1.1, GLINT)
  }
  c.restore()
}

function drawArm(c: CanvasRenderingContext2D, s: Skin, sx: number, sy: number, a1: number, a2: number, near: boolean) {
  const j = joint(sx, sy, a1, UPPER, a2, FORE)
  const dx = Math.sin(rad(a2))
  const dy = Math.cos(rad(a2))
  stroke(c, [sx, sy, j.kx, j.ky, j.ex, j.ey], 7, near ? s.coat : s.coatS)
  if (near) {
    // kol ağzı (koyu bant) ve ışığa bakan kenarda vurgu
    stroke(c, [j.ex - dx * 1.6, j.ey - dy * 1.6, j.ex + dx * 0.4, j.ey + dy * 0.4], 7, s.coatS, false)
    stroke(c, [sx - 1.3, sy - 0.7, j.kx - 1.3, j.ky - 0.7, j.ex - 1.3 - dx * 2.6, j.ey - 0.7 - dy * 2.6], 1.9, s.coatL, false)
  }
  // el: bileğin ucunda yumuk avuç, öne bakan başparmak
  const px = j.ex + dx * 2.6
  const py = j.ey + dy * 2.6
  const tx = px + dy * 2.5 - dx * 0.5
  const ty = py - dx * 2.5 - dy * 0.5
  c.beginPath()
  c.ellipse(px, py, 3.6, 3.15, Math.atan2(dy, dx), 0, TAU)
  c.moveTo(tx + 1.7, ty)
  c.arc(tx, ty, 1.7, 0, TAU)
  c.strokeStyle = INK
  c.lineWidth = inkW
  c.stroke()
  c.fillStyle = near ? s.skin : s.skinS
  c.fill()
}

function drawTorso(c: CanvasRenderingContext2D, s: Skin, x: number, y: number) {
  // ceket: omuzdan bele hafif daralan yuvarlak gövde, göğüs biraz önde
  blob(
    c,
    () => {
      c.moveTo(x - 8.5, y - 25)
      c.quadraticCurveTo(x, y - 28.5, x + 8.5, y - 25)
      c.quadraticCurveTo(x + 12.2, y - 13, x + 9.8, y + 1.5)
      c.quadraticCurveTo(x, y + 3.4, x - 9.8, y + 1.5)
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
  c.lineWidth = inkW * 0.45
  c.lineJoin = 'round'
  c.stroke()
  // ön kapama: yakadan eteğe inen ince hat
  fine(c, x + 5.5, y - 12, x + 6.8, y - 5, x + 5.8, y + 1.8, inkW * 0.34, INK)
  // etek dikişi; kapitone montta (Uktun) iki dilim dikişi
  fine(c, x - 8.6, y - 1.6, x - 1, y + 0.6, x + 5.4, y - 0.8, 0.9, s.coatS)
  if (s.quilt) {
    fine(c, x - 9.8, y - 8.6, x - 2, y - 6.6, x + 5.8, y - 8, 0.9, s.coatS)
    fine(c, x - 10, y - 16, x - 2, y - 14.2, x + 5.4, y - 15.4, 0.9, s.coatS)
  }
  // ceket parlaması sol kenarda: omuzda dolgun, bele doğru incelir
  stroke(c, [x - 7.4, y - 22.4, x - 8.8, y - 13], 2.1, s.coatL, false)
  stroke(c, [x - 8.8, y - 11, x - 8.2, y - 4], 1.3, s.coatL, false)
}

/**
 * Atkı. Arka uç ensedeki düğümden çıkan bir kurdeledir: dururken sırta sarkar ve hafifçe salınır, koşarken geriye
 * uzanıp dalga dalga çırpınır (dalga düğümden uca doğru yürür), düşerken yukarı savrulur. lift: -1 aşağı .. 1 yukarı.
 */
function drawScarf(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, t: number, moving: boolean, lift: number) {
  const ox = x - 6
  const oy = y - 24.5
  // uzun saçlıda uç saçın arkasından çıkacak kadar uzar (yoksa yalnız ucu görünür, yumru gibi durur)
  const ex = moving ? (s.long ? -29 : -19) : -5.5 - Math.abs(lift) * 6
  const ey = moving ? 1 - lift * 10 : 11 - lift * 14
  const len = Math.hypot(ex, ey)
  const nx = -ey / len
  const ny = ex / len
  const sp = moving ? 13 : 2.6
  const amp = moving ? 2.8 : 0.8
  // kurdelenin iki kenarı: u düğümden uca 0..1, side +1 / -1
  const P = (u: number, side: number): [number, number] => {
    const wv = Math.sin(t * sp - u * 4.4) * amp * u
    const off = wv + side * (2.3 + u * 1.2)
    return [ox + ex * u + nx * off, oy + ey * u + ny * off - Math.sin(u * Math.PI) * (moving ? 0 : 1.6)]
  }
  const a1 = P(0.34, 1)
  const a2 = P(0.7, 1)
  const a3 = P(1, 1)
  const b1 = P(0.34, -1)
  const b2 = P(0.7, -1)
  const b3 = P(1.06, -1)
  const n = P(0.84, 0)
  c.beginPath()
  c.moveTo(ox + 1, oy - 2.2)
  c.bezierCurveTo(a1[0], a1[1], a2[0], a2[1], a3[0], a3[1])
  c.lineTo(n[0], n[1])
  c.lineTo(b3[0], b3[1])
  c.bezierCurveTo(b2[0], b2[1], b1[0], b1[1], ox + 1.5, oy + 2.6)
  c.closePath()
  c.strokeStyle = INK
  c.lineWidth = inkW * 0.94
  c.lineJoin = 'round'
  c.stroke()
  c.fillStyle = s.scarf
  c.fill()
  // kurdelenin alt yarısı gölgede
  const m1 = P(0.34, -0.5)
  const m2 = P(0.7, -0.5)
  const m3 = P(0.98, -0.52)
  c.beginPath()
  c.moveTo(ox, oy + 1.2)
  c.bezierCurveTo(m1[0], m1[1], m2[0], m2[1], m3[0], m3[1])
  c.strokeStyle = s.scarfS
  c.lineWidth = 2.1
  c.lineCap = 'butt'
  c.stroke()
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
  fine(c, x - 5.4, y - 27.4, x - 1, y - 28.6, x + 3, y - 28, 1.1, GLINT)
  // önden düşen uç: adımla hafifçe sallanır
  const sw = Math.sin(t * (moving ? 13 : 2.6) + 1.3) * (moving ? 1.1 : 0.3)
  c.beginPath()
  c.moveTo(x + 2.5, y - 24)
  c.lineTo(x + 6.5, y - 24)
  c.lineTo(x + 6.2 + sw, y - 12.6)
  c.lineTo(x + 4 + sw, y - 14.6)
  c.lineTo(x + 2 + sw, y - 12.4)
  c.closePath()
  c.strokeStyle = INK
  c.lineWidth = inkW
  c.stroke()
  c.fillStyle = s.scarf
  c.fill()
  stroke(c, [x + 5.6, y - 22.6, x + 5.3 + sw, y - 14.6], 1.3, s.scarfS, false)
}

function eye(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, w: number, blink: boolean, happy: boolean, lash: boolean) {
  c.lineCap = 'round'
  if (blink) {
    c.beginPath()
    c.moveTo(x - w, y + 0.5)
    c.quadraticCurveTo(x, y + 2.4, x + w, y + 0.5)
    if (lash) {
      c.moveTo(x - w, y + 0.5)
      c.lineTo(x - w - 1.3, y + 1.5)
    }
    c.strokeStyle = INK
    c.lineWidth = 1.6
    c.stroke()
    return
  }
  // neşeli göz daha iri ve yuvarlak, kirpik çizgisi ince ve yüksek kavisli
  const ry = happy ? 4.4 : 3.9
  c.beginPath()
  c.ellipse(x, y, w, ry, 0, 0, TAU)
  c.fillStyle = '#fffdf8'
  c.fill()
  c.beginPath()
  c.ellipse(x + w * 0.24, y + 0.35, w * 0.73, ry - 0.45, 0, 0, TAU)
  c.fillStyle = s.iris
  c.fill()
  // irisin altı ışık alır: bakış canlanır
  c.beginPath()
  c.ellipse(x + w * 0.24, y + ry * 0.46, w * 0.5, ry * 0.3, 0, 0, TAU)
  c.fillStyle = 'rgba(255,214,150,0.5)'
  c.fill()
  c.beginPath()
  c.ellipse(x + w * 0.28, y + 0.3, w * 0.38, happy ? 2.4 : 1.95, 0, 0, TAU)
  c.fillStyle = INK
  c.fill()
  // parıltı: büyüğü sol üstte, küçüğü sağ altta
  c.beginPath()
  c.arc(x - w * 0.14, y - 1.25, happy ? 1.3 : 1.12, 0, TAU)
  c.moveTo(x + w * 0.6, y + 1.6)
  c.arc(x + w * 0.6 - 0.58, y + 1.6, 0.58, 0, TAU)
  c.fillStyle = '#ffffff'
  c.fill()
  // göz kapağı kıvrımı: kirpik çizgisinin hemen üstünde ince bir yay (neşeli gözde kirpik zaten yüksek)
  if (!happy) {
    c.beginPath()
    c.moveTo(x - w * 0.75, y - ry - 1)
    c.quadraticCurveTo(x, y - ry - 2.7, x + w * 0.85, y - ry - 1.2)
    c.strokeStyle = s.skinS
    c.lineWidth = 0.85
    c.stroke()
  }
  // üst kirpik çizgisi; kadında dış uçta kalkık kirpik
  c.beginPath()
  if (happy) {
    c.moveTo(x - w - 0.4, y - 0.4)
    c.quadraticCurveTo(x, y - 8, x + w + 0.4, y - 0.4)
  } else {
    c.moveTo(x - w - 0.5, y - 1.5)
    c.quadraticCurveTo(x, y - ry - 2.2, x + w + 0.5, y - 1.9)
  }
  if (lash) {
    c.moveTo(x - w - 0.5, y - 1.5)
    c.lineTo(x - w - 1.7, y - 2.9)
  }
  c.strokeStyle = INK
  c.lineWidth = happy ? 1.4 : 1.5
  c.stroke()
}

/** kaş: buruna bakan ucu dolgun, dış ucu incelen fırça izi */
function brow(c: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, th: number, color: string) {
  c.beginPath()
  c.moveTo(x0, y0)
  c.quadraticCurveTo(cx, cy, x1, y1)
  c.lineTo(x1 + 0.1, y1 + th)
  c.quadraticCurveTo(cx, cy + th * 1.5, x0, y0)
  c.closePath()
  c.fillStyle = color
  c.fill()
  c.strokeStyle = color
  c.lineWidth = 0.7
  c.lineJoin = 'round'
  c.stroke()
}

function drawHead(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, blink: boolean, hair: number, lift: number, t: number, moving: boolean, happy = false) {
  // neşeli yüzde perçem uçları kaşı örtmesin diye biraz yukarıda biter
  const fr = happy ? 3.4 : 0
  const hx = x + 1.5
  const hy = y - 47
  const fem = !!s.long || s.hat === 'yazma'
  // arka saç (uzun): omuzların arkasından sırta dökülür, uçları tutam tutam ayrılır; savruldukça uçlar gecikerek izler
  if (s.long) {
    const fl = moving ? 1 : 0.3
    const sw = hair * 3.4 + Math.sin(t * (moving ? 11 : 1.7)) * 0.5 * fl
    // uçların gecikmeli salınımı ve düşerken yukarı kalkışı
    const tp = Math.sin(t * (moving ? 11 : 1.7) - 1.4) * 1.5 * fl
    const up = lift * 5.5
    blob(
      c,
      () => {
        c.moveTo(hx - 5, hy - 20)
        c.bezierCurveTo(hx - 21, hy - 19, hx - 24 - sw * 0.4, hy - 2, hx - 20 - sw, hy + 14 - up * 0.3)
        c.quadraticCurveTo(hx - 21 - sw * 1.6, hy + 23 - up * 0.7, hx - 24.5 - sw * 2.2 - tp, hy + 30 - up)
        c.quadraticCurveTo(hx - 19 - sw * 1.6, hy + 28 - up * 0.8, hx - 17.5 - sw * 1.5, hy + 23.5 - up * 0.6)
        c.quadraticCurveTo(hx - 16.5 - sw * 1.6, hy + 29 - up * 0.8, hx - 15.5 - sw * 1.8 - tp, hy + 33.5 - up)
        c.quadraticCurveTo(hx - 11.5 - sw * 1.2, hy + 29.5 - up * 0.7, hx - 11 - sw, hy + 24 - up * 0.5)
        c.quadraticCurveTo(hx - 9 - sw * 1.1, hy + 28 - up * 0.6, hx - 6.5 - sw * 1.2 - tp * 0.7, hy + 30.5 - up * 0.8)
        c.quadraticCurveTo(hx - 3.5 - sw * 0.5, hy + 22 - up * 0.3, hx - 4, hy + 12)
        c.lineTo(hx + 1, hy + 2)
      },
      s.hair,
      { color: s.hairS, dx: -3.2, dy: -1.2 },
    )
    // tutam ayrımları (ince mürekkep), akışı izleyen tel ve sırtta ışık şeridi
    fine(c, hx - 16.4, hy + 6, hx - 16.6 - sw * 0.9, hy + 15 - up * 0.3, hx - 17.5 - sw * 1.5, hy + 23.5 - up * 0.6, inkW * 0.3, INK)
    fine(c, hx - 10.4, hy + 10, hx - 10.2 - sw * 0.7, hy + 17 - up * 0.3, hx - 11 - sw, hy + 24 - up * 0.5, inkW * 0.3, INK)
    fine(c, hx - 13.4, hy - 4, hx - 14 - sw * 0.4, hy + 6, hx - 13.4 - sw * 0.9, hy + 14 - up * 0.2, 0.9, s.hairS)
    fine(c, hx - 20, hy - 7, hx - 22.4 - sw * 0.6, hy + 5, hx - 21.4 - sw * 1.3, hy + 16 - up * 0.4, 1.9, s.hairL)
    fine(c, hx - 20.6 - sw * 1.6, hy + 20 - up * 0.6, hx - 21 - sw * 1.8, hy + 23 - up * 0.7, hx - 22.4 - sw * 2 - tp * 0.8, hy + 26.4 - up * 0.9, 1.1, s.hairL)
  }
  // boyun: çenenin gölgesinde
  stroke(c, [hx - 1, hy + 14, hx - 1, hy + 19], 6.5, s.skinS)
  // kafa: hafif oval, çene öne doğru
  const skull = () => {
    c.moveTo(hx - 15, hy - 2)
    c.bezierCurveTo(hx - 16, hy - 19, hx + 14, hy - 22, hx + 17, hy - 4)
    c.bezierCurveTo(hx + 18.5, hy + 4, hx + 15, hy + 13, hx + 6, hy + 15.5)
    c.bezierCurveTo(hx - 3, hy + 17.5, hx - 14, hy + 12, hx - 15, hy - 2)
  }
  blob(c, skull, s.skin, { color: s.skinS, dx: -1.5, dy: -2.3 })
  // saçın (ya da başlığın) alna düşen gölgesi
  c.beginPath()
  if (s.long) {
    c.moveTo(hx + 1, hy - 14)
    c.lineTo(hx + 15.6, hy - 11)
    c.lineTo(hx + 15.8, hy - 7.6 - fr)
    c.quadraticCurveTo(hx + 9, hy - 9.4 - fr, hx + 1.6, hy - 11.6)
  } else if (s.hat !== 'yazma') {
    c.moveTo(hx - 2, hy - 12.5)
    c.lineTo(hx + 15.2, hy - 12)
    c.lineTo(hx + 15.5, hy - 8.8)
    c.quadraticCurveTo(hx + 7, hy - 10.8, hx - 1, hy - 8.6)
    c.quadraticCurveTo(hx - 4.6, hy - 4, hx - 5.6, hy + 1.6)
    c.lineTo(hx - 7.4, hy + 1)
  }
  c.closePath()
  c.fillStyle = s.skinS
  c.fill()
  // yanaklar
  c.fillStyle = s.blush
  c.beginPath()
  c.ellipse(hx + 2.6, hy + 7.6, 3.3, 1.9, 0, 0, TAU)
  c.ellipse(hx + 14.3, hy + 7.2, 1.9, 1.7, 0, 0, TAU)
  c.fill()
  c.beginPath()
  c.ellipse(hx + 1.6, hy + 6.7, 1.1, 0.6, -0.4, 0, TAU)
  c.fillStyle = GLINT
  c.fill()
  // gözler: yakın göz büyük, uzak göz yüz kenarında dar
  eye(c, s, hx + 5, hy + 1.3, 3, blink, happy, fem)
  eye(c, s, hx + 13.2, hy + 1, 2.1, blink, happy, false)
  // kaşlar: gözün epey üstünde ve yukarı kavisli (yüz yumuşak ve meraklı baksın); buruna bakan uç dolgun
  const th = fem ? 1.05 : s.beard ? 1.7 : 1.5
  if (happy) {
    brow(c, hx + 0.8, hy - 7.8, hx + 4.8, hy - 12.6, hx + 8.8, hy - 9.2, th, s.brow)
    brow(c, hx + 16.2, hy - 8, hx + 13.8, hy - 11.8, hx + 11.5, hy - 9.4, th * 0.9, s.brow)
  } else {
    brow(c, hx + 0.9, hy - 6.2, hx + 4.6, hy - 10.4, hx + 8.5, hy - 8.3, th, s.brow)
    brow(c, hx + 16, hy - 7, hx + 13.9, hy - 10, hx + 11.5, hy - 8.4, th * 0.9, s.brow)
  }
  // burun: profilde küçük bir kıvrım
  fine(c, hx + 10.5, hy + 3.8, hx + 12.3, hy + 6.9, hx + 10.2, hy + 7.5, 1.4, s.skinS)
  // sakal (ozan): çene hattını sarar, bıyıkla ağzı çerçeveler
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
      { color: s.beardS!, dx: -1.6, dy: -1.8 },
    )
    // sakal telleri
    fine(c, hx - 4.6, hy + 9, hx - 2.6, hy + 12.4, hx + 0.6, hy + 13.8, 0.9, s.beardS!)
    fine(c, hx + 3.4, hy + 11.4, hx + 5.4, hy + 14.4, hx + 8.4, hy + 15, 0.9, s.beardS!)
  }
  // kısa sakal (Memo): çene hattında koyu şerit, favoriye bağlı; ağzın üstünde ince bıyık
  if (s.trim) {
    c.save()
    c.beginPath()
    skull()
    c.clip()
    c.beginPath()
    c.moveTo(hx - 10, hy + 2)
    c.lineTo(hx - 6.2, hy + 1.5)
    c.quadraticCurveTo(hx - 5, hy + 8.6, hx + 1.6, hy + 11.4)
    c.quadraticCurveTo(hx + 4.4, hy + 9.6, hx + 6.6, hy + 9.4)
    c.quadraticCurveTo(hx + 6.4, hy + 12.6, hx + 9, hy + 13.2)
    c.quadraticCurveTo(hx + 12.6, hy + 13.6, hx + 19, hy + 11.6)
    c.lineTo(hx + 19, hy + 20)
    c.lineTo(hx - 12, hy + 20)
    c.closePath()
    c.fillStyle = s.trim
    c.fill()
    // çene altında tek kademe gölge
    c.beginPath()
    c.moveTo(hx - 4, hy + 20)
    c.quadraticCurveTo(hx + 4, hy + 13.4, hx + 19, hy + 14.2)
    c.lineTo(hx + 19, hy + 20)
    c.closePath()
    c.fillStyle = s.trimS!
    c.fill()
    c.restore()
    // bıyık
    fine(c, hx + 6.6, hy + 9.6, hx + 10.4, hy + 7.4, hx + 14.8, hy + 8.4, 1.7, s.trim)
    // sakalın örttüğü çene hattı yeniden çekilir
    c.beginPath()
    skull()
    c.closePath()
    c.strokeStyle = INK
    c.lineWidth = inkW
    c.stroke()
  }
  // ağız
  if (happy) {
    // açık gülümseme: üstü düz, altı yuvarlak ağız, içinde dil
    const mouth = () => {
      c.moveTo(hx + 7.4, hy + 9.2)
      c.quadraticCurveTo(hx + 11, hy + 10, hx + 14.6, hy + 8.6)
      c.quadraticCurveTo(hx + 13.6, hy + 14.2, hx + 10.4, hy + 14)
      c.quadraticCurveTo(hx + 7.8, hy + 13.6, hx + 7.4, hy + 9.2)
    }
    c.beginPath()
    mouth()
    c.closePath()
    c.fillStyle = '#7a2036'
    c.fill()
    c.save()
    c.clip()
    c.beginPath()
    c.ellipse(hx + 10.8, hy + 14, 2.6, 1.9, 0, 0, TAU)
    c.fillStyle = '#e8687a'
    c.fill()
    c.restore()
    c.beginPath()
    mouth()
    c.closePath()
    c.strokeStyle = INK
    c.lineWidth = 1.3
    c.lineJoin = 'round'
    c.stroke()
  } else {
    // gülümseme: geniş, uzak köşe yukarıda; altında dudak gölgesi
    c.beginPath()
    c.moveTo(hx + 7.6, hy + 10)
    c.quadraticCurveTo(hx + 10.8, hy + 12.9, hx + 14, hy + 9.5)
    c.strokeStyle = s.beard ? '#e8b8a0' : fem ? '#b8384e' : '#8e3a3c'
    c.lineWidth = 1.4
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.stroke()
    if (!s.beard) fine(c, hx + 9.8, hy + 13.2, hx + 11.2, hy + 13.9, hx + 12.5, hy + 12.9, 0.9, s.trim ? s.trimS! : s.skinS)
  }
  // bıyık (sakalsız): ağzın üstünde iki yana sarkan kalın fırça
  if (s.mustache && !s.beard) {
    c.strokeStyle = INK
    c.lineWidth = 2.4 + inkW * 0.62
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(hx + 6.4, hy + 9.2)
    c.quadraticCurveTo(hx + 10.6, hy + 6.6, hx + 15, hy + 9)
    c.stroke()
    c.strokeStyle = s.mustache
    c.lineWidth = 2.4
    c.stroke()
  }
  const hsh = { color: s.hairS, dx: -2.8, dy: -2.2 }
  // ön saç
  if (s.long) {
    // tepe: kabarık; yana taranmış iki uçlu perçem; şakaktan kulağın önüne inen ince bir tutam.
    // Kulak, boyun ve çene açıkta kalır: saç yüzü sarmaz, arkaya dökülür.
    blob(
      c,
      () => {
        c.moveTo(hx - 15.5, hy + 5)
        c.bezierCurveTo(hx - 21, hy - 14, hx - 8, hy - 28, hx + 5, hy - 25)
        c.bezierCurveTo(hx + 13, hy - 24, hx + 19, hy - 17, hx + 18.4, hy - 10.5)
        // perçem uçları
        c.quadraticCurveTo(hx + 18.8, hy - 9.6 - fr * 0.6, hx + 16.4, hy - 9.4 - fr)
        c.quadraticCurveTo(hx + 15, hy - 12.4 - fr * 0.7, hx + 11.4, hy - 13.8 - fr * 0.5)
        c.quadraticCurveTo(hx + 11, hy - 11.4 - fr, hx + 8, hy - 10.6 - fr)
        c.quadraticCurveTo(hx + 6.4, hy - 13.6 - fr * 0.5, hx + 1, hy - 14.6)
        // şakak: geriye taranır, kulağın önünde sivri bir tutamla biter
        c.quadraticCurveTo(hx - 3.6, hy - 9.6, hx - 4.4, hy - 2)
        c.quadraticCurveTo(hx - 3.8, hy + 5, hx - 5.6, hy + 10.5)
        c.quadraticCurveTo(hx - 8.4, hy + 5, hx - 8, hy - 2.4)
        c.quadraticCurveTo(hx - 11.6, hy - 1, hx - 13, hy + 5.6)
      },
      s.hair,
      hsh,
    )
    // ayrım ve tutam çizgileri (ince mürekkep), tel ve tepede ışık şeridi
    fine(c, hx + 1.2, hy - 14.6, hx - 1.6, hy - 20, hx - 8.6, hy - 22.8, inkW * 0.3, INK)
    fine(c, hx + 11.4, hy - 13.8, hx + 12.6, hy - 17.6, hx + 10, hy - 21, inkW * 0.3, INK)
    fine(c, hx - 9.6, hy - 9, hx - 12.4, hy - 6, hx - 13.4, hy - 1.6, 0.9, s.hairS)
    fine(c, hx - 15, hy - 9, hx - 12.6, hy - 19.4, hx - 2, hy - 22.6, 2.3, s.hairL)
    fine(c, hx + 5, hy - 22, hx + 11.4, hy - 21, hx + 15, hy - 16.4, 1.5, s.hairL)
    fine(c, hx + 3.6, hy - 17, hx + 5.6, hy - 16.6, hx + 7, hy - 15.2, 1.1, s.hairL)
  } else if (s.curly) {
    // kıvırcık: tepede ve ensede lüle lüle, alna düşen iki bukle; favori yok
    blob(
      c,
      () => {
        c.moveTo(hx - 15, hy + 2.5)
        c.quadraticCurveTo(hx - 20.5, hy - 3, hx - 17.4, hy - 9.6)
        c.quadraticCurveTo(hx - 20, hy - 17, hx - 12.4, hy - 20)
        c.quadraticCurveTo(hx - 10.4, hy - 26.6, hx - 3, hy - 24.4)
        c.quadraticCurveTo(hx + 2, hy - 29, hx + 8, hy - 24.8)
        c.quadraticCurveTo(hx + 14.4, hy - 26.4, hx + 16.6, hy - 20.4)
        c.quadraticCurveTo(hx + 21.4, hy - 16.4, hx + 18.2, hy - 12)
        c.quadraticCurveTo(hx + 16, hy - 9.8, hx + 12.6, hy - 12)
        c.quadraticCurveTo(hx + 10, hy - 9.8, hx + 6, hy - 12)
        c.quadraticCurveTo(hx + 2, hy - 10.4, hx - 2, hy - 12.4)
        c.quadraticCurveTo(hx - 6, hy - 8.4, hx - 7.4, hy - 3.4)
        c.quadraticCurveTo(hx - 10.4, hy - 0.6, hx - 11, hy + 3)
        c.quadraticCurveTo(hx - 13, hy + 4.8, hx - 15, hy + 2.5)
      },
      s.hair,
      hsh,
    )
    // bukle kıvrımları (tek yolda) ve lülelerin sırtında ışık
    c.beginPath()
    for (const [bx, by, r] of [[-11, -16, 3.4], [-1.6, -20.4, 3.6], [8.4, -20.6, 3.4], [-13.4, -5.4, 2.8], [14.4, -15.4, 2.6], [-5.4, -13.4, 2.6], [3.6, -15, 2.4]]) {
      c.moveTo(hx + bx + r, hy + by)
      c.arc(hx + bx, hy + by, r, 0, Math.PI * 0.9)
    }
    c.strokeStyle = s.hairS
    c.lineWidth = 0.9
    c.lineCap = 'round'
    c.stroke()
    fine(c, hx - 16, hy - 11.6, hx - 14.6, hy - 17, hx - 9.4, hy - 19.4, 1.9, s.hairL)
    fine(c, hx - 6, hy - 22, hx - 2, hy - 25, hx + 2.6, hy - 24.4, 1.7, s.hairL)
    fine(c, hx + 8.6, hy - 23.6, hx + 11.6, hy - 24, hx + 13.6, hy - 22.2, 1.5, s.hairL)
  } else if (s.hat !== 'yazma') {
    if (s.hat) {
      // başlığın altında kalan saç: yalnız yanlar ve ense
      blob(
        c,
        () => {
          c.moveTo(hx - 15.5, hy + 4)
          c.bezierCurveTo(hx - 19.6, hy - 8, hx - 13, hy - 19, hx + 1, hy - 18.5)
          c.lineTo(hx + 15, hy - 14.5)
          c.quadraticCurveTo(hx + 12, hy - 13.5, hx + 7, hy - 12)
          c.quadraticCurveTo(hx + 2, hy - 14.5, hx - 2, hy - 11)
          c.quadraticCurveTo(hx - 5.5, hy - 7, hx - 7, hy - 1)
          c.lineTo(hx - 7.2, hy + 5)
          c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
        },
        s.hair,
        hsh,
      )
    } else {
      // kısa saç (Memo): yanlar kısa, tepe hacimli; öne ve yukarı kabaran üç tutam
      blob(
        c,
        () => {
          c.moveTo(hx - 15.5, hy + 4)
          c.bezierCurveTo(hx - 20, hy - 12, hx - 13, hy - 25.5, hx - 1.4, hy - 23.6)
          c.quadraticCurveTo(hx + 2.4, hy - 28.8, hx + 7.6, hy - 24.2)
          c.quadraticCurveTo(hx + 12.4, hy - 27.6, hx + 14.8, hy - 21.8)
          c.quadraticCurveTo(hx + 20, hy - 20.4, hx + 18.4, hy - 14.4)
          c.quadraticCurveTo(hx + 19.6, hy - 11.8, hx + 16.5, hy - 10.8)
          c.quadraticCurveTo(hx + 12, hy - 13.8, hx + 7, hy - 12.2)
          c.quadraticCurveTo(hx + 2, hy - 14.6, hx - 2, hy - 11)
          c.quadraticCurveTo(hx - 5.5, hy - 7, hx - 7, hy - 1)
          // favori sakala bağlanır
          c.lineTo(hx - 7.2, hy + 5)
          c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
        },
        s.hair,
        hsh,
      )
      // tutam aralarında ince mürekkep, tepede ışık şeridi
      fine(c, hx + 7.6, hy - 24.2, hx + 6.6, hy - 20.4, hx + 2.6, hy - 18.4, inkW * 0.3, INK)
      fine(c, hx + 14.8, hy - 21.8, hx + 13.6, hy - 18.4, hx + 10, hy - 16.6, inkW * 0.3, INK)
      fine(c, hx + 7, hy - 12.2, hx + 6.4, hy - 14.6, hx + 4, hy - 15.8, 0.9, s.hairS)
      fine(c, hx - 0.6, hy - 22, hx + 2.6, hy - 25.6, hx + 5.4, hy - 23.8, 1.5, s.hairL)
      fine(c, hx + 9.4, hy - 23.4, hx + 12, hy - 24.6, hx + 13.4, hy - 22, 1.3, s.hairL)
    }
    fine(c, hx - 15.4, hy - 6, hx - 13.6, hy - 16.4, hx - 4, hy - 20.4, 2.1, s.hairL)
    // favoride kısa kesim telleri
    fine(c, hx - 11.4, hy - 4, hx - 12.4, hy - 0.6, hx - 12, hy + 3, 0.9, s.hairS)
  } else {
    // yazmanın altından görünen ortadan ayrık saç
    c.beginPath()
    c.moveTo(hx - 3.6, hy - 6.4)
    c.quadraticCurveTo(hx + 6, hy - 11.8, hx + 16.4, hy - 7.6)
    c.quadraticCurveTo(hx + 7, hy - 10.4, hx - 3.2, hy - 4)
    c.closePath()
    c.fillStyle = s.hair
    c.fill()
  }
  // kulak: saçın arasından görünür (yazma kapatır); içinde kıvrım çizgisi
  if (s.hat !== 'yazma') {
    c.beginPath()
    c.ellipse(hx - 9.6, hy + 1.6, 2.6, 3.6, 0.2, 0, TAU)
    c.strokeStyle = INK
    c.lineWidth = inkW
    c.stroke()
    c.fillStyle = s.skin
    c.fill()
    fine(c, hx - 10.4, hy - 0.2, hx - 8, hy + 1.2, hx - 9.6, hy + 3.4, 0.9, s.skinS)
  }
  if (s.hat) drawHat(c, s, hx, hy)
}

function drawHat(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number) {
  const col = s.hatC!
  const dark = s.hatS!
  const sh = { color: dark, dx: -3, dy: -2.2 }
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
      // dilim dikişleri, tepe düğmesi, siperin kökü ve ışık
      fine(c, hx - 2, hy - 23, hx - 8, hy - 19, hx - 9.6, hy - 11.6, 0.9, dark)
      fine(c, hx - 2, hy - 23, hx + 6, hy - 20, hx + 8.4, hy - 13.4, 0.9, dark)
      fine(c, hx + 17, hy - 13, hx + 13, hy - 12.6, hx + 9, hy - 12.9, inkW * 0.3, INK)
      c.beginPath()
      c.ellipse(hx - 2, hy - 23.2, 1.9, 1.1, -0.1, 0, TAU)
      c.fillStyle = INK
      c.fill()
      fine(c, hx - 13.6, hy - 13, hx - 11.6, hy - 18.6, hx - 6, hy - 21, 1.8, s.hairL)
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
      // bant ve kabarıkların arasındaki kıvrımlar
      fine(c, hx - 13.4, hy - 15.4, hx, hy - 19.6, hx + 15, hy - 16.4, 1.1, dark)
      fine(c, hx - 3, hy - 30, hx - 4.4, hy - 25.6, hx - 3.4, hy - 20.6, 1, dark)
      fine(c, hx + 13, hy - 28, hx + 9.6, hy - 25, hx + 8.6, hy - 20, 1, dark)
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
      // yün dokusu: kısa kıvrık teller (tek yolda); sol kenarda ışık
      c.beginPath()
      for (const [dx, dy] of [[-9, -24], [-2, -26.4], [5, -25], [-6, -18.4], [1.6, -20], [8.6, -19], [-10.4, -13.6], [-2.4, -15.4]]) {
        c.moveTo(hx + dx, hy + dy)
        c.quadraticCurveTo(hx + dx + 1.5, hy + dy + 1.4, hx + dx + 0.5, hy + dy + 3.2)
      }
      c.strokeStyle = dark
      c.lineWidth = 1
      c.lineCap = 'round'
      c.stroke()
      fine(c, hx - 12.4, hy - 13, hx - 12.6, hy - 19, hx - 11.8, hy - 24.4, 1.5, GLINT)
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
      // kumaş kıvrımları ve tepede ışık
      fine(c, hx - 8, hy - 3, hx - 12.6, hy + 6, hx - 10.4, hy + 16.4, 0.9, dark)
      fine(c, hx - 4, hy - 7, hx - 9, hy - 10.4, hx - 12.4, hy - 8, 0.9, dark)
      fine(c, hx - 15, hy - 6, hx - 14, hy - 17, hx - 5, hy - 21.6, 1.7, GLINT)
      // oya ve puantiye
      c.fillStyle = '#f6d98a'
      c.beginPath()
      for (const [dx, dy] of [[-12, -9], [-6, -16.4], [4, -18], [-14, 7], [11, -13.6], [-9.4, 13]]) {
        c.moveTo(hx + dx + 1.1, hy + dy)
        c.arc(hx + dx, hy + dy, 1.1, 0, TAU)
      }
      c.fill()
      break
  }
}

/**
 * Karakteri çizer. (x, y): ayak tabanı orta noktası ekran pikselinde, size: karakter boyu pikselde.
 * flip: sola bakar. t: saniye (atkı ve saç salınımı, nefes).
 */
export function drawHero(c: CanvasRenderingContext2D, look: Look, pose: Pose, x: number, y: number, size: number, flip: boolean, t: number, opts: { moving?: boolean; sx?: number; sy?: number; scarf?: string; scarfS?: string } = {}) {
  const s0 = LOOKS[look]
  const s = opts.scarf ? { ...s0, scarf: opts.scarf, scarfS: opts.scarfS ?? s0.scarfS } : s0
  const moving = !!opts.moving
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
  const [fa, na] = pose.arms
  const [fl, nl] = pose.legs
  const tilt = pose.tilt ?? 0
  const lift = pose.lift ?? 0
  // nefes: dururken omuzlar ve baş çok hafif iner kalkar (saate bağlı)
  const breath = pose.ground && !moving ? Math.sin(t * 2.6 + 0.9) * 0.45 : 0
  const sY = ty - 22 + breath
  // omuz dönüşü: öne savrulan kolun omzu da biraz öne gelir
  const twist = (a: number) => Math.max(-1.6, Math.min(1.6, a * 0.03))
  // baş: koşarken adımla hafifçe sallanır, gövde eğilince yüz ileriye bakmayı sürdürür
  const nod = (moving && pose.ground ? nl[0] * 0.0011 : 0) - tilt * 0.45
  /** üst gövde kalçadan eğilir; bacaklar eğilmez */
  const upper = () => {
    c.translate(hipX, hipY)
    c.rotate(tilt)
    c.translate(-hipX, -hipY)
  }
  if (pose.ground) {
    // temas gölgesi: yerde, ayakların altında
    c.beginPath()
    c.ellipse(lean * 0.5, -0.4, 13.5, 2.3, 0, 0, TAU)
    c.fillStyle = CONTACT
    c.fill()
  }
  // uzak kol ve bacak önce, gövde, yakın bacak, atkı, kafa, yakın kol
  c.save()
  upper()
  drawArm(c, s, tx - 4 + twist(fa[0]), sY, fa[0], fa[1], false)
  c.restore()
  drawLeg(c, s, hipX - 2.5, hipY, fl[0], fl[1], false)
  drawLeg(c, s, hipX + 2, hipY, nl[0], nl[1], true)
  c.save()
  upper()
  if (s.prop === 'staff') {
    // çoban değneği: arkada, yere basar
    stroke(c, [tx - 15, ty - 44, tx - 13.5, -1.5], 2.6, '#6a4a2e')
    stroke(c, [tx - 15, ty - 44, tx - 11, ty - 48, tx - 8.5, ty - 44.5], 2.6, '#6a4a2e')
    stroke(c, [tx - 15.6, ty - 40, tx - 14.5, ty - 12], 0.9, '#9a744a', false)
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
    // pililer, kuşak ve etek ucunda ışık
    fine(c, tx - 4, ty - 1, tx - 5.4, ty + 12, tx - 5, -bob - 7.5, 1, s.pantsS)
    fine(c, tx + 3, ty + 1, tx + 4.6, ty + 12, tx + 4.4, -bob - 7.5, 1, s.pantsS)
    fine(c, tx - 9, ty - 4.6, tx, ty - 3.2, tx + 6, ty - 4.4, 1.5, s.coatS)
    fine(c, tx - 9.4, ty + 2, tx - 10.6, ty + 12, tx - 9.8, -bob - 9, 1.2, GLINT)
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
    // bel bağı ve cep
    fine(c, tx - 4, ty - 5, tx + 2, ty - 4, tx + 7.6, ty - 5.2, 0.9, '#cfc8ba')
    fine(c, tx - 1.6, ty + 1, tx + 1.6, ty + 3.4, tx + 5, ty + 1, 0.9, '#cfc8ba')
  }
  if (s.prop === 'saz') {
    // bağlama: gövde belde, sap omuza doğru
    stroke(c, [tx + 2, ty - 8, tx + 22, ty - 30], 2.4, '#7a4a24')
    stroke(c, [tx + 20.4, ty - 30.6, tx + 23.4, ty - 28.4], 1.5, INK, false)
    blob(
      c,
      () => {
        c.ellipse(tx + 1, ty - 6, 8.5, 6.2, -0.75, 0, TAU)
      },
      '#b4733c',
      { color: '#7a4a24', dx: -2, dy: -2 },
    )
    c.fillStyle = INK
    c.beginPath()
    c.arc(tx + 2, ty - 7, 1.3, 0, TAU)
    c.fill()
    fine(c, tx - 4.6, ty - 5.4, tx - 3.4, ty - 9.4, tx + 0.4, ty - 11, 1.2, GLINT)
  }
  if (!s.bare) drawScarf(c, s, tx, ty + breath, t, moving, lift)
  // kafa boyuna göre biraz büyük: sevimli oran
  c.save()
  c.translate(tx + 1, ty - 28 + breath)
  c.rotate(nod)
  c.scale(1.14, 1.14)
  c.translate(-(tx + 1), -(ty - 28))
  drawHead(c, s, tx + 1, ty, !!pose.blink, pose.hair ?? 0, lift, t, moving, pose.mood === 'happy')
  c.restore()
  drawArm(c, s, tx + 4 + twist(na[0]), sY, na[0], na[1], true)
  c.restore()
  c.restore()
}

/**
 * Koşu döngüsü: 0 ve 0,5 temas, 0,25 ve 0,75 geçiş. Gövde hafifçe öne eğilir; saç ve atkı her adımda bir kez
 * yaylanır (ikincil hareket), kollar bacaklara ters salınır ve öndeki kol dirsekten daha çok bükülür.
 */
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
  const spring = Math.sin(ph * 2)
  return {
    legs: [leg(-1), leg(1)],
    arms: [
      [32 * sn, 32 * sn + 42 + 26 * Math.max(0, sn)],
      [-32 * sn, -32 * sn + 42 + 26 * Math.max(0, -sn)],
    ],
    lean: 1.2,
    tilt: 0.075 + 0.012 * spring,
    ground: true,
    hair: 0.5 + 0.22 * spring,
    lift: 0.12 * spring,
  }
}

export const POSES: Record<string, Pose> = {
  idle: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [-8, 10]], ground: true },
  jump: { legs: [[-16, 14], [52, 96]], arms: [[-50, -30], [115, 140]], hair: 0.7, lift: -0.5, tilt: 0.04 },
  apex: { legs: [[24, 80], [48, 96]], arms: [[-95, -70], [100, 125]], hair: 0.6, lift: 0.25, bob: -2 },
  fall: { legs: [[-20, 24], [18, 32]], arms: [[-120, -140], [105, 125]], hair: 0.9, lift: 1, tilt: -0.03 },
  land: { legs: [[22, 70], [42, 90]], arms: [[-40, -15], [45, 75]], ground: true, hair: 0.5, lift: 0.5, tilt: 0.1 },
  wall: { legs: [[8, 30], [42, 72]], arms: [[60, 80], [112, 126]], lift: 0.4 },
  dash: { legs: [[-78, 8], [-52, 38]], arms: [[-78, -88], [-92, -102]], lean: -2.5, tilt: 0.36, hair: 1.3 },
  wave: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [105, 140]], ground: true },
}
