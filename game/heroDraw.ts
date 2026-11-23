/**
 * Elle çizilmiş görünümlü oyuncu karakterleri: vektör eğrilerle, ekran çözünürlüğünde.
 * Mürekkep dış hat + düz renk + tek kademe gölge (ışık sol üstten). Kafa, yüz ve gövde aynı
 * yan profilden çizilir; kol ve bacaklar eklem açılarıyla (dikeyden derece, + ileri) döner.
 * Birim: karakter boyu ~100 birim, ayak tabanı orta noktası (0, 0), y yukarı eksi.
 */
import { COVERS_HEAD, NO_KIT, ON_HEAD, type AccessoryId, type Kit } from './accessories'
import { drawFaceItem, drawHeadItem, drawHeroBack, drawHeroBackFront, heroHead } from './accessoryDraw'
import { drawHairBack, drawHairTop } from './hairDraw'
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, OUTFIT_COLORS, OWN_HAIR, SKIN_TONES, light, lum, shade, type Back, type Expr, type Front, type LookPrefs, type Pattern } from './looks'

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
  /** kol uzunluğu çarpanı (uzak, yakın kol ya da ikisi): asılırken kollar çizgi film gibi esner, eller başın üstünde tutar */
  reach?: number | [number, number]
  /** neşeli yüz (amblem, paylaşım görseli): yüksek kavisli kaş, iri göz, açık gülümseme; oyunda kullanılmaz */
  mood?: 'happy'
  /** başın gövdeden bağımsız dönüşü (radyan, + öne): etrafa bakınma, esneme */
  head?: number
  /** bakış yönü -1 geri .. 1 ileri (göz bebekleri kayar) */
  gaze?: number
  /** ağız: 'yawn' esneme (açık ağız, kapalı göz) */
  mouth?: 'yawn'
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
  /** perçemli, taranmış saç (Uktun); `front` verilmişse onun yerine geçer */
  fringe?: boolean
  /** kadın yüzü: kirpikli göz, ince kaş (saç stilinden bağımsız) */
  fem?: boolean
  /** Mağaza saç stili: ön saç biçimi ve arka saç; boşsa kılığın kendi saçı */
  front?: Front
  back?: Back
  /** Mağaza ifadesi ve kıyafet deseni (desen rengi `patC`) */
  expr?: Expr
  pat?: Pattern
  patC?: string
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
    // sarı ceketin üstünde kırmızı yerine turkuaz atkı (logoyla aynı)
    scarf: '#2fb3c0', scarfS: '#1a7f8c', pants: '#4f62a0', pantsS: '#35467c',
    boot: '#7a4630', bootS: '#4c2a1c', brow: '#7e2c20', fringe: true, fem: true, back: 'long', quilt: true,
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

/** ön saç biçimi: Mağaza stili ya da kılığın kendi saçı */
export const frontOf = (s: Skin): Front => s.front ?? (s.fringe ? 'fringe' : s.curly ? 'curly' : 'quiff')

interface SkinSlot {
  look: Look
  prefs?: LookPrefs
  scarf?: string
  scarfS?: string
  skin: Skin
}
const skinSlots: SkinSlot[] = []

function buildSkin(look: Look, prefs: LookPrefs | undefined, scarf?: string, scarfS?: string): Skin {
  const b = LOOKS[look]
  const s: Skin = scarf ? { ...b, scarf, scarfS: scarfS ?? b.scarfS } : { ...b }
  if (!prefs || (look !== 'uktun' && look !== 'memo')) return s
  // saç stili: ön saç ve arka saç; 'ozgun' kılığın kendi saçıdır
  const own = OWN_HAIR[look]
  const hs = prefs.hs && prefs.hs !== 'ozgun' ? HAIR_STYLES[prefs.hs] : undefined
  const front = hs?.front ?? own.front
  s.front = front
  s.back = hs ? hs.back : own.back
  s.fringe = front === 'fringe'
  s.curly = front === 'curly'
  const hc = prefs.hc ? HAIR_COLORS[prefs.hc] : undefined
  if (hc) {
    s.hair = hc
    s.hairS = shade(hc, 0.66)
    s.hairL = light(hc, 0.3)
    s.brow = shade(hc, 0.55)
    if (s.trim) {
      s.trim = shade(hc, 0.8)
      s.trimS = shade(hc, 0.56)
    }
  }
  const tone = prefs.sk ? SKIN_TONES[prefs.sk] : undefined
  if (tone) {
    s.skin = tone.skin
    s.skinS = tone.skinS
    s.blush = tone.blush
  }
  const oc = prefs.oc ? OUTFIT_COLORS[prefs.oc] : undefined
  if (oc) {
    s.coat = oc
    s.coatS = shade(oc, 0.72)
    s.coatL = light(oc, 0.32)
  }
  const ey = prefs.ey ? EYE_COLORS[prefs.ey] : undefined
  if (ey) s.iris = ey
  if (prefs.op && prefs.op !== 'duz') {
    s.pat = prefs.op as Pattern
    s.patC = lum(s.coat) > 0.62 ? shade(s.coat, 0.6) : light(s.coat, 0.55)
  }
  if (prefs.ex && prefs.ex !== 'ozgun') s.expr = prefs.ex as Expr
  return s
}

/**
 * Kılığın bu çizimdeki dış görünüşü: Mağaza seçimleri (saç, ten, kıyafet, göz, ifade) ve atkı rengi üstüne işlenir.
 * Sonuç önbellekte (az sayıda yuva; seçimler `normalizeLook`ta tekilleştirilir, kimlik karşılaştırması yeter):
 * kare başına nesne ayrılmaz. Seçim ve atkı yoksa kılığın kendisi.
 */
export function resolveSkin(look: Look, prefs?: LookPrefs, scarf?: string, scarfS?: string): Skin {
  if (!prefs && !scarf) return LOOKS[look]
  for (const sl of skinSlots) if (sl.look === look && sl.prefs === prefs && sl.scarf === scarf && sl.scarfS === scarfS) return sl.skin
  const skin = buildSkin(look, prefs, scarf, scarfS)
  skinSlots.push({ look, prefs, scarf, scarfS, skin })
  if (skinSlots.length > 40) skinSlots.shift()
  return skin
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

/** Halat tırmanışında halatın gövdeye göre yeri (çizim biriminde, ileri +): karakter halatın biraz arkasında durur */
export const ROPE_X = 24

/**
 * Halat tırmanışı (yan profil): iki el de önde, halatın üstünde; biri başın üstünde kavrar, öbürü göğüs hizasında
 * çeker. `k` (-1..1) döngünün evresi: eller sırayla yer değiştirir. Eller ters kinematikle (iki kemik) tam halata
 * oturur, kol hedefe hafif bükük varacak kadar uzar (çizgi film esnemesi); dizler öne, halatı sarar.
 */
export function climbPose(k: number): Pose {
  const low = -72
  const high = -102
  const u = (k + 1) / 2
  const reachTo = (sx: number, ty: number, elbow: number): { a: [number, number]; r: number } => {
    const sy = -50
    const dx = ROPE_X - sx
    const dy = ty - sy
    const d = Math.hypot(dx, dy)
    const r = Math.max(1, (d / (UPPER + FORE)) * 1.08)
    const l1 = UPPER * r
    const l2 = FORE * r
    const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))
    // uzak kolun dirseği geriye, yakın kolunki öne bakar: yakın kol yüzün önünden geçmez
    const a1 = Math.atan2(dx, dy) + elbow * Math.acos(cosA)
    const ex = sx + Math.sin(a1) * l1
    const ey = sy + Math.cos(a1) * l1
    const a2 = Math.atan2(ROPE_X - ex, ty - ey)
    return { a: [(a1 * 180) / Math.PI, (a2 * 180) / Math.PI], r }
  }
  const fa = reachTo(-4, low + (high - low) * u, 1)
  const na = reachTo(4, high + (low - high) * u, -1)
  return { reach: [fa.r, na.r], arms: [fa.a, na.a], legs: [[38 + 14 * k, 78], [52 - 14 * k, 92]], hair: 0.2, lift: 0.1 }
}

/** kolun uzunluk çarpanı: pozda tek sayı ya da [uzak, yakın] */
const armReach = (pose: Pose, i: number) => (Array.isArray(pose.reach) ? pose.reach[i] : (pose.reach ?? 1))

/**
 * Pozdaki iki elin yeri (çizim biriminde, ayak tabanı 0,0; çevrilmemiş): asılan karakter ellerini tele / halata
 * oturtmak için. Gövde eğimi (tilt) hesaba katılmaz: asılma pozlarında eğim yoktur.
 */
export function handPos(pose: Pose): { x: number; y: number }[] {
  const tx = (pose.lean ?? 0) * 1.3
  const sY = HIP_Y + (pose.bob ?? 0) + 1 - 22
  const twist = (a: number) => Math.max(-1.6, Math.min(1.6, a * 0.03))
  return pose.arms.map(([a1, a2], i) => {
    const r = armReach(pose, i)
    const j = joint(tx + (i ? 4 : -4) + twist(a1), sY, a1, UPPER * r, a2, FORE * r)
    return { x: j.ex + Math.sin(rad(a2)) * 2.6, y: j.ey + Math.cos(rad(a2)) * 2.6 }
  })
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

function drawArm(c: CanvasRenderingContext2D, s: Skin, sx: number, sy: number, a1: number, a2: number, near: boolean, reach = 1) {
  const j = joint(sx, sy, a1, UPPER * reach, a2, FORE * reach)
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

/**
 * Kıyafet deseni: verilen yolun içine kırpılır, `col` renginde. Birim 1 = karakter birimi; (x0, y0) sol üst,
 * (w, h) kutu. Hem oyundaki gövde hem portrenin omuzları çağırır (kare başına ayırma yok: yalnız yol çizimi).
 */
export function drawPattern(c: CanvasRenderingContext2D, pat: Pattern, col: string, x0: number, y0: number, w: number, h: number, u: number, clip: () => void) {
  c.save()
  c.beginPath()
  clip()
  c.clip()
  c.beginPath()
  const sp = 5.2 * u
  switch (pat) {
    case 'cizgili':
      for (let y = y0 + sp * 0.5; y < y0 + h; y += sp) {
        c.moveTo(x0 - 2, y)
        c.lineTo(x0 + w + 2, y)
      }
      c.strokeStyle = col
      c.lineWidth = 1.7 * u
      c.stroke()
      break
    case 'ekose':
      for (let y = y0 + sp * 0.4; y < y0 + h; y += sp * 1.3) {
        c.moveTo(x0 - 2, y)
        c.lineTo(x0 + w + 2, y)
      }
      for (let x = x0 + sp * 0.4; x < x0 + w; x += sp * 1.3) {
        c.moveTo(x, y0 - 2)
        c.lineTo(x, y0 + h + 2)
      }
      c.strokeStyle = col
      c.globalAlpha = 0.55
      c.lineWidth = 1.5 * u
      c.stroke()
      c.globalAlpha = 1
      c.beginPath()
      for (let y = y0 + sp * 0.4 + sp * 0.65; y < y0 + h; y += sp * 1.3) {
        c.moveTo(x0 - 2, y)
        c.lineTo(x0 + w + 2, y)
      }
      c.lineWidth = 0.7 * u
      c.stroke()
      break
    case 'puantiyeli':
      for (let y = y0 + sp * 0.5, r = 0; y < y0 + h + sp; y += sp * 0.9, r++)
        for (let x = x0 + (r % 2 ? sp * 0.5 : 0); x < x0 + w + sp; x += sp) {
          c.moveTo(x + 1.15 * u, y)
          c.arc(x, y, 1.15 * u, 0, TAU)
        }
      c.fillStyle = col
      c.fill()
      break
    case 'yildiz':
      for (let y = y0 + sp * 0.6, r = 0; y < y0 + h + sp; y += sp * 1.05, r++)
        for (let x = x0 + (r % 2 ? sp * 0.6 : 0); x < x0 + w + sp; x += sp * 1.2)
          for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + (i * Math.PI) / 5
            const rr = (i % 2 ? 0.55 : 1.45) * u
            if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
            else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
          }
      c.fillStyle = col
      c.fill()
      break
    case 'kareli': {
      // dama: yarı saydam kareler, satır satır kayar
      const q = sp * 0.8
      for (let y = y0, r = 0; y < y0 + h; y += q, r++) for (let x = x0 + (r % 2) * q; x < x0 + w; x += q * 2) c.rect(x, y, q, q)
      c.fillStyle = col
      c.globalAlpha = 0.6
      c.fill()
      c.globalAlpha = 1
      break
    }
    case 'dalga':
      // yumuşak dalga çizgileri: her satır bir öncekinin yarım dalga kayığı
      for (let y = y0 + sp * 0.5, r = 0; y < y0 + h + sp; y += sp, r++) {
        const ph = r % 2 ? sp * 0.6 : 0
        c.moveTo(x0 - 3 - ph, y)
        for (let x = x0 - 3 - ph, k = 0; x < x0 + w + 3; x += sp * 0.6, k++) c.quadraticCurveTo(x + sp * 0.3, y + (k % 2 ? 1.5 : -1.5) * u, x + sp * 0.6, y)
      }
      c.strokeStyle = col
      c.lineWidth = 1.2 * u
      c.lineCap = 'round'
      c.stroke()
      break
    case 'cini':
      // çini göbeği: dört yapraklı rozet, aralarında küçük noktalar (İznik işi gibi seyrek)
      for (let y = y0 + sp * 0.8, r = 0; y < y0 + h + sp; y += sp * 1.6, r++)
        for (let x = x0 + (r % 2 ? sp * 0.9 : 0); x < x0 + w + sp; x += sp * 1.8) {
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + Math.PI / 4
            c.moveTo(x, y)
            c.ellipse(x + Math.cos(a) * 1.6 * u, y + Math.sin(a) * 1.6 * u, 1.6 * u, 0.8 * u, a, Math.PI, Math.PI * 3)
          }
          c.moveTo(x + sp * 0.9 + 0.6 * u, y + sp * 0.8)
          c.arc(x + sp * 0.9, y + sp * 0.8, 0.6 * u, 0, TAU)
        }
      c.fillStyle = col
      c.fill()
      break
    case 'zigzag':
      for (let y = y0 + sp * 0.5; y < y0 + h + sp; y += sp) {
        c.moveTo(x0 - 2, y)
        for (let x = x0 - 2, k = 0; x < x0 + w + 3; x += 2.2 * u, k++) c.lineTo(x + 2.2 * u, y + (k % 2 ? 1.4 : -1.4) * u)
      }
      c.strokeStyle = col
      c.lineWidth = 1.2 * u
      c.lineJoin = 'round'
      c.stroke()
      break
  }
  c.restore()
}

function drawTorso(c: CanvasRenderingContext2D, s: Skin, x: number, y: number) {
  // ceket: omuzdan bele hafif daralan yuvarlak gövde, göğüs biraz önde
  const body = () => {
    c.moveTo(x - 8.5, y - 25)
    c.quadraticCurveTo(x, y - 28.5, x + 8.5, y - 25)
    c.quadraticCurveTo(x + 12.2, y - 13, x + 9.8, y + 1.5)
    c.quadraticCurveTo(x, y + 3.4, x - 9.8, y + 1.5)
    c.quadraticCurveTo(x - 11.5, y - 12, x - 8.5, y - 25)
    c.closePath()
  }
  blob(c, body, s.coat, { color: s.coatS, dx: -3.2, dy: -1 })
  if (s.pat && s.patC) drawPattern(c, s.pat, s.patC, x - 12, y - 29, 25, 33, 1, body)
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
function drawScarf(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, t: number, flow: number, lift: number) {
  const ox = x - 6
  const oy = y - 24.5
  // flow: 0 sarkık .. 1 koşu .. 1,4 dash; ara değerler sürekli (oyunda gecikmeli izler: render.ts heroAnim)
  const f = Math.max(0, Math.min(1, flow))
  const over = Math.max(0, Math.min(0.4, flow - 1))
  // uzun saçlıda uç saçın arkasından çıkacak kadar uzar (yoksa yalnız ucu görünür, yumru gibi durur)
  const ex = (-5.5 - Math.abs(lift) * 6) * (1 - f) + (s.back === 'long' || s.back === 'tail' || s.back === 'braid' || s.back === 'pigtails' ? -29 : -19) * f * (1 + over * 0.35)
  const ey = (11 - lift * 14) * (1 - f) + (1 - lift * 10) * f
  const len = Math.hypot(ex, ey)
  const nx = -ey / len
  const ny = ex / len
  // iki dalga karışır: dururken yavaş salınım, koşarken hızlı çırpınma (hız değişince evre sıçramaz)
  const fast = 2.8 * (f + over * 1.5)
  const slow = 0.8 * (1 - f)
  // kurdelenin iki kenarı: u düğümden uca 0..1, side +1 / -1
  const P = (u: number, side: number): [number, number] => {
    const wv = (Math.sin(t * 13 - u * 4.4) * fast + Math.sin(t * 2.6 - u * 4.4) * slow) * u
    const off = wv + side * (2.3 + u * 1.2)
    return [ox + ex * u + nx * off, oy + ey * u + ny * off - Math.sin(u * Math.PI) * 1.6 * (1 - f)]
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
  const sw = Math.sin(t * 13 + 1.3) * 1.1 * f + Math.sin(t * 2.6 + 1.3) * 0.3 * (1 - f)
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

function eye(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, w: number, blink: boolean, happy: boolean, lash: boolean, ex: Expr = 'ozgun', gaze = 0) {
  c.lineCap = 'round'
  if ((ex === 'sevecen' || ex === 'kahkaha') && !blink) {
    // kapalı, yukarı kavisli gülen göz (^ ^)
    c.beginPath()
    c.moveTo(x - w - 0.2, y + 1.6)
    c.quadraticCurveTo(x, y - 4, x + w + 0.2, y + 1.6)
    c.strokeStyle = INK
    c.lineWidth = 1.9
    c.stroke()
    if (lash) {
      c.beginPath()
      c.moveTo(x - w - 0.2, y + 1.6)
      c.lineTo(x - w - 1.6, y + 0.4)
      c.lineWidth = 1.3
      c.stroke()
    }
    return
  }
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
  const ry = happy ? 4.4 : ex === 'saskin' ? 4.9 : 3.9
  c.beginPath()
  c.ellipse(x, y, w, ry, 0, 0, TAU)
  c.fillStyle = '#fffdf8'
  c.fill()
  // iris göz akının içinde kalır (bakış kayınca taşmaz); şaşkın gözde bebek küçülür
  c.save()
  c.clip()
  const gx = w * 0.24 + gaze * w * 0.34
  const pup = ex === 'saskin' ? 0.8 : 1
  c.beginPath()
  c.ellipse(x + gx, y + 0.35, w * 0.73, ry - 0.45, 0, 0, TAU)
  c.fillStyle = s.iris
  c.fill()
  // irisin altı ışık alır: bakış canlanır
  c.beginPath()
  c.ellipse(x + gx, y + ry * 0.46, w * 0.5, ry * 0.3, 0, 0, TAU)
  c.fillStyle = 'rgba(255,214,150,0.5)'
  c.fill()
  c.beginPath()
  c.ellipse(x + gx + w * 0.04, y + 0.3, w * 0.38 * pup, (happy ? 2.4 : 1.95) * pup, 0, 0, TAU)
  c.fillStyle = INK
  c.fill()
  c.restore()
  // parıltı: büyüğü sol üstte, küçüğü sağ altta
  c.beginPath()
  c.arc(x - w * 0.14 + gaze * w * 0.2, y - 1.25, happy ? 1.3 : 1.12, 0, TAU)
  c.moveTo(x + w * 0.6, y + 1.6)
  c.arc(x + w * 0.6 - 0.58, y + 1.6, 0.58, 0, TAU)
  c.fillStyle = '#ffffff'
  c.fill()
  // uykulu ve kurnaz bakış: üst kapak gözün yarısına (kurnazda üçte birine) iner
  if (ex === 'uykulu' || ex === 'kurnaz') {
    const ly = y - ry + ry * (ex === 'uykulu' ? 1.05 : 0.62)
    c.save()
    c.beginPath()
    c.ellipse(x, y, w + 0.6, ry + 0.6, 0, 0, TAU)
    c.clip()
    c.beginPath()
    c.rect(x - w - 2, y - ry - 4, w * 2 + 4, ly - (y - ry - 4))
    c.fillStyle = s.skin
    c.fill()
    c.beginPath()
    c.moveTo(x - w - 1, ly + 0.6)
    c.quadraticCurveTo(x, ly + 1.6, x + w + 1, ly + 0.2)
    c.strokeStyle = INK
    c.lineWidth = 1.7
    c.stroke()
    c.restore()
    return
  }
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

function drawHead(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, blink: boolean, hair: number, lift: number, t: number, moving: boolean, happy = false, kit: Kit = NO_KIT, gaze = 0, mouth?: 'yawn') {
  const acc = kit.head
  const ex = s.expr ?? 'ozgun'
  // neşeli ifade: markanın neşeli yüzüyle aynı (iri göz, yüksek kaş, açık gülüş)
  if (ex === 'neseli' || ex === 'kahkaha') happy = true
  // utangaç: bakış yana kaçar
  if (ex === 'utangac') gaze -= 0.75
  // neşeli yüzde perçem uçları kaşı örtmesin diye biraz yukarıda biter
  const fr = happy ? 3.4 : 0
  const hx = x + 1.5
  const hy = y - 47
  const fem = !!s.fem || s.hat === 'yazma'
  const front = frontOf(s)
  // Mağaza arka saçı (at kuyruğu, örgü, küt kesim): omuzdan önce, başın arkasında
  drawHairBack(c, s.back ?? 'none', heroHead(hx, hy), { t, moving, hair, lift }, s)
  // arka saç (uzun): omuzların arkasından sırta dökülür, uçları tutam tutam ayrılır; savruldukça uçlar gecikerek izler
  if (s.back === 'long') {
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
  if (front === 'fringe') {
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
  if (ex === 'utangac') {
    // utangaç: yanaklar kızarır, yakın yanakta üç kısa kızarıklık çizgisi
    c.fillStyle = s.blush
    c.beginPath()
    c.ellipse(hx + 2.4, hy + 7.4, 4.2, 2.5, 0, 0, TAU)
    c.ellipse(hx + 14.3, hy + 7.2, 2.3, 2, 0, 0, TAU)
    c.fill()
    for (const d of [-1.8, 0, 1.8]) fine(c, hx + 1.6 + d, hy + 6.4, hx + 1.2 + d, hy + 7.6, hx + 0.8 + d, hy + 8.6, 0.7, 'rgba(200,70,80,0.55)')
  }
  c.beginPath()
  c.ellipse(hx + 1.6, hy + 6.7, 1.1, 0.6, -0.4, 0, TAU)
  c.fillStyle = GLINT
  c.fill()
  // gözler: yakın göz büyük, uzak göz yüz kenarında dar
  const shut = blink || mouth === 'yawn'
  eye(c, s, hx + 5, hy + 1.3, 3, shut, happy, fem, ex, gaze)
  eye(c, s, hx + 13.2, hy + 1, 2.1, shut, happy, false, ex, gaze)
  // kaşlar: gözün epey üstünde ve yukarı kavisli (yüz yumuşak ve meraklı baksın); buruna bakan uç dolgun
  const th = fem ? 1.05 : s.beard ? 1.7 : 1.5
  if (happy || ex === 'saskin') {
    const up = ex === 'saskin' ? -1.6 : 0
    brow(c, hx + 0.8, hy - 7.8 + up, hx + 4.8, hy - 12.6 + up, hx + 8.8, hy - 9.2 + up, th, s.brow)
    brow(c, hx + 16.2, hy - 8 + up, hx + 13.8, hy - 11.8 + up, hx + 11.5, hy - 9.4 + up, th * 0.9, s.brow)
  } else if (ex === 'uykulu') {
    brow(c, hx + 0.9, hy - 4.8, hx + 4.6, hy - 6.6, hx + 8.5, hy - 5.8, th, s.brow)
    brow(c, hx + 16, hy - 5.6, hx + 13.9, hy - 7.4, hx + 11.5, hy - 6.2, th * 0.9, s.brow)
  } else if (ex === 'kurnaz') {
    // yakın kaş çatık, uzak kaş havada
    brow(c, hx + 0.9, hy - 4.4, hx + 4.6, hy - 7.2, hx + 8.5, hy - 8.4, th, s.brow)
    brow(c, hx + 16.2, hy - 9.4, hx + 13.9, hy - 13.2, hx + 11.5, hy - 10.4, th * 0.9, s.brow)
  } else if (ex === 'sevecen' || ex === 'utangac') {
    brow(c, hx + 0.9, hy - 6.8, hx + 4.6, hy - 10.8, hx + 8.5, hy - 8.8, th, s.brow)
    brow(c, hx + 16, hy - 7.4, hx + 13.9, hy - 10.4, hx + 11.5, hy - 8.8, th * 0.9, s.brow)
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
  if (mouth === 'yawn') {
    // esneme: iri, yuvarlak açık ağız; içinde dil
    const yawn = () => {
      c.beginPath()
      c.ellipse(hx + 10.6, hy + 11.2, 2.6, 3.5, 0.1, 0, TAU)
    }
    yawn()
    c.fillStyle = '#7a2036'
    c.fill()
    c.save()
    yawn()
    c.clip()
    c.beginPath()
    c.ellipse(hx + 10.8, hy + 13.6, 2.3, 1.6, 0, 0, TAU)
    c.fillStyle = '#e8687a'
    c.fill()
    c.restore()
    yawn()
    c.strokeStyle = INK
    c.lineWidth = 1.15
    c.stroke()
  } else if (happy) {
    // açık gülümseme: burnun altında küçük, yuvarlak hatlı "D"; üst hat köşelerde hafif kalkık, içinde dil.
    // Uzak köşe yüz kenarına değmez (profilde kama gibi görünüyordu).
    // Kısa sakallıda (Memo) ağız sakalın ağız boşluğunu tam doldurur: yoksa yanında ten rengi bir şerit açık kalır.
    // kahkahada ağız daha geniş ve derin açılır
    const big = ex === 'kahkaha' ? 1.6 : 0
    const x0 = (s.trim ? 6.7 : 8.1) - big * 0.5
    const mouth = () => {
      c.moveTo(hx + x0, hy + 9.5 - big * 0.3)
      c.quadraticCurveTo(hx + 10.4, hy + 10.5 - big * 0.2, hx + 13.2 + big * 0.3, hy + 9.1 - big * 0.4)
      c.bezierCurveTo(hx + 13.3 + big * 0.3, hy + 12.4 + big, hx + 11.6, hy + 13.6 + big, hx + 10.2, hy + 13.5 + big)
      c.bezierCurveTo(hx + x0 + 1, hy + 13.4 + big, hx + x0 - 0.1, hy + 12, hx + x0, hy + 9.5 - big * 0.3)
    }
    c.beginPath()
    mouth()
    c.closePath()
    c.fillStyle = '#7a2036'
    c.fill()
    c.save()
    c.clip()
    c.beginPath()
    c.ellipse(hx + 10.7, hy + 13.4 + big, 2.1 + big * 0.3, 1.5 + big * 0.3, 0, 0, TAU)
    c.fillStyle = '#e8687a'
    c.fill()
    c.restore()
    c.beginPath()
    mouth()
    c.closePath()
    c.strokeStyle = INK
    c.lineWidth = 1.15
    c.lineJoin = 'round'
    c.stroke()
  } else if (ex === 'saskin') {
    // şaşkın: küçük, yuvarlak "o"
    c.beginPath()
    c.ellipse(hx + 10.8, hy + 11.8, 1.8, 2.4, 0, 0, TAU)
    c.fillStyle = '#7a2036'
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 1.1
    c.stroke()
  } else if (ex === 'uykulu') {
    c.beginPath()
    c.moveTo(hx + 8.6, hy + 10.9)
    c.quadraticCurveTo(hx + 10.8, hy + 11.9, hx + 13, hy + 10.5)
    c.strokeStyle = s.beard ? '#e8b8a0' : fem ? '#b8384e' : '#8e3a3c'
    c.lineWidth = 1.3
    c.lineCap = 'round'
    c.stroke()
  } else if (ex === 'utangac') {
    // utangaç: küçük, kısa, hafif dalgalı gülümseme
    c.beginPath()
    c.moveTo(hx + 9.2, hy + 10.8)
    c.quadraticCurveTo(hx + 10.4, hy + 11.9, hx + 11.4, hy + 11)
    c.quadraticCurveTo(hx + 12.3, hy + 11.7, hx + 13, hy + 10.5)
    c.strokeStyle = s.beard ? '#e8b8a0' : fem ? '#b8384e' : '#8e3a3c'
    c.lineWidth = 1.3
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.stroke()
  } else if (ex === 'kurnaz') {
    // tek yana kıvrılan sırıtış; uzak köşede gamze
    c.beginPath()
    c.moveTo(hx + 7.6, hy + 11)
    c.quadraticCurveTo(hx + 11.6, hy + 12.4, hx + 14.6, hy + 7.8)
    c.strokeStyle = s.beard ? '#e8b8a0' : fem ? '#b8384e' : '#8e3a3c'
    c.lineWidth = 1.6
    c.lineCap = 'round'
    c.stroke()
    fine(c, hx + 14.6, hy + 7.8, hx + 15.6, hy + 8.6, hx + 15.2, hy + 10, 0.9, s.skinS)
  } else {
    // gülümseme: geniş, uzak köşe yukarıda; altında dudak gölgesi
    const wide = ex === 'sevecen' ? 1.7 : 0
    c.beginPath()
    c.moveTo(hx + 7.6 - wide * 0.4, hy + 10)
    c.quadraticCurveTo(hx + 10.8, hy + 12.9 + wide, hx + 14 + wide * 0.3, hy + 9.5)
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
  if (front === 'fringe') {
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
  } else if (front === 'curly') {
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
    if (s.hat || COVERS_HEAD.has(acc)) {
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
    } else if (front === 'buzz') {
      drawBuzz(c, s, hx, hy, skull)
    } else if (front === 'messy') {
      drawMessy(c, s, hx, hy)
    } else if (front === 'side') {
      drawSidePart(c, s, hx, hy)
    } else {
      // kısa saç (Memo): yanlar kısa, tepe hacimli; öne ve yukarı kabaran üç tutam
      // kısa kesim (Mağaza): aynı saç, tepesi alçak ve düz
      if (front === 'short') {
        c.save()
        c.translate(hx, hy - 11)
        c.scale(1, 0.6)
        c.translate(-hx, -(hy - 11))
      }
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
      if (front === 'short') c.restore()
    }
    if (front !== 'buzz') {
      fine(c, hx - 15.4, hy - 6, hx - 13.6, hy - 16.4, hx - 4, hy - 20.4, 2.1, s.hairL)
      // favoride kısa kesim telleri
      fine(c, hx - 11.4, hy - 4, hx - 12.4, hy - 0.6, hx - 12, hy + 3, 0.9, s.hairS)
    }
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
  if (kit.face === 'gozluk') drawGlasses(c, hx, hy)
  if (kit.face === 'gunes') drawShades(c, hx, hy)
  drawFaceItem(c, kit.face, heroHead(hx, hy), { t, moving, hair, lift })
  // topuz: başlık takılıysa altta kalır
  drawHairTop(c, s.back ?? 'none', heroHead(hx, hy), { t, moving, hair, lift }, s, COVERS_HEAD.has(acc) || (!!s.hat && s.hat !== 'yazma' && !ON_HEAD.has(acc)))
  // başa takılan aksesuar kılığın şapkasının yerine geçer; yazma örtüdür, kalır ve başlık üstüne oturur
  if (s.hat && (s.hat === 'yazma' || !ON_HEAD.has(acc))) drawHat(c, s, hx, hy)
  // kayak bandı ve kulaklık yazmanın üstünden geçer; kulaklığın kabı kayak bandını örter
  if (kit.face === 'kayak') drawGoggles(c, hx, hy, s.fringe || s.hat === 'yazma' ? -18.6 : -16.4)
  if (acc === 'kulaklik') drawPhones(c, hx, hy, s.fringe ? -25 : s.hat === 'yazma' ? -25.5 : -27)
  if (ON_HEAD.has(acc)) drawHeadAcc(c, acc, hx, hy + (s.fringe ? -2.5 : s.hat === 'yazma' ? -1.5 : 0), t, moving, hair, lift)
}

/** dağınık kısa: tepede her yöne kalkan sivri tutamlar, alna düşen iki kısa uç; favori kısa */
function drawMessy(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number) {
  blob(
    c,
    () => {
      c.moveTo(hx - 15.5, hy + 4)
      c.quadraticCurveTo(hx - 19, hy - 3, hx - 18.6, hy - 8)
      // ense ve tepe: geriye, yukarıya ve öne kalkan tutamlar
      c.lineTo(hx - 23, hy - 11.6)
      c.quadraticCurveTo(hx - 18.4, hy - 13.6, hx - 17, hy - 17)
      c.lineTo(hx - 19.4, hy - 23.4)
      c.quadraticCurveTo(hx - 13, hy - 21.6, hx - 10.4, hy - 23)
      c.lineTo(hx - 10.6, hy - 30.4)
      c.quadraticCurveTo(hx - 5, hy - 25.6, hx - 1.6, hy - 25.6)
      c.lineTo(hx + 2.4, hy - 32.2)
      c.quadraticCurveTo(hx + 5, hy - 26, hx + 8, hy - 25)
      c.lineTo(hx + 14.4, hy - 29)
      c.quadraticCurveTo(hx + 13.6, hy - 23, hx + 15.6, hy - 21)
      c.lineTo(hx + 22.4, hy - 20.4)
      c.quadraticCurveTo(hx + 18, hy - 17, hx + 18.6, hy - 13.6)
      // alına düşen iki kısa uç (kaşın üstünde biter)
      c.lineTo(hx + 18.2, hy - 10.6)
      c.quadraticCurveTo(hx + 15.6, hy - 12.4, hx + 13.6, hy - 12.2)
      c.lineTo(hx + 11.4, hy - 10.4)
      c.quadraticCurveTo(hx + 9.6, hy - 13.4, hx + 6.4, hy - 12.8)
      c.quadraticCurveTo(hx + 2, hy - 14.6, hx - 2, hy - 11)
      c.quadraticCurveTo(hx - 5.5, hy - 7, hx - 7, hy - 1)
      c.lineTo(hx - 7.2, hy + 5)
      c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
    },
    s.hair,
    { color: s.hairS, dx: -2.8, dy: -2.2 },
  )
  // tutam dipleri (ince mürekkep) ve tutamların sırtında ışık
  fine(c, hx - 10.4, hy - 23, hx - 9.4, hy - 19.6, hx - 6.6, hy - 18, inkW * 0.3, INK)
  fine(c, hx - 1.6, hy - 25.6, hx - 0.8, hy - 21.6, hx + 2, hy - 19.4, inkW * 0.3, INK)
  fine(c, hx + 8, hy - 25, hx + 8.4, hy - 21, hx + 10.6, hy - 18.6, inkW * 0.3, INK)
  fine(c, hx + 15.6, hy - 21, hx + 14.6, hy - 17.4, hx + 12, hy - 16, inkW * 0.3, INK)
  fine(c, hx - 15, hy - 9, hx - 14.4, hy - 16, hx - 9.6, hy - 21, 2, s.hairL)
  fine(c, hx - 4.6, hy - 22.6, hx - 1, hy - 26, hx + 1.4, hy - 28.6, 1.4, s.hairL)
  fine(c, hx + 5.4, hy - 23.4, hx + 9, hy - 24.4, hx + 12.2, hy - 26.4, 1.2, s.hairL)
}

/** yan tarama: ayrım tepenin arkasında, saç öne doğru taranır ve alnın üstünde yuvarlak bir dalgayla biter */
function drawSidePart(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number) {
  blob(
    c,
    () => {
      c.moveTo(hx - 15.5, hy + 4)
      // ense: iki kısa uç
      c.lineTo(hx - 18.2, hy + 2.6)
      c.quadraticCurveTo(hx - 17.4, hy + 0.4, hx - 17.8, hy - 1.4)
      c.lineTo(hx - 20, hy - 2.6)
      c.bezierCurveTo(hx - 21, hy - 14, hx - 12, hy - 26, hx + 2, hy - 25.4)
      c.bezierCurveTo(hx + 12.6, hy - 25.4, hx + 20.6, hy - 19.6, hx + 19.6, hy - 12.6)
      // dalga iki tutamla alna doğru kıvrılır, kaşın üstünde kalır
      c.quadraticCurveTo(hx + 19.2, hy - 9.8, hx + 16.8, hy - 9.6)
      c.quadraticCurveTo(hx + 16.4, hy - 11.8, hx + 14.4, hy - 12.4)
      c.quadraticCurveTo(hx + 13.4, hy - 10.6, hx + 11.4, hy - 10.6)
      c.quadraticCurveTo(hx + 10.6, hy - 13.2, hx + 8.4, hy - 13.4)
      c.quadraticCurveTo(hx + 2, hy - 14.2, hx - 2, hy - 11)
      c.quadraticCurveTo(hx - 5.5, hy - 7, hx - 7, hy - 1)
      c.lineTo(hx - 7.2, hy + 5)
      c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
    },
    s.hair,
    { color: s.hairS, dx: -2.8, dy: -2.2 },
  )
  // ayrım çizgisi ve öne taranan teller
  fine(c, hx - 3, hy - 24.6, hx - 8.6, hy - 22, hx - 11.4, hy - 17.4, inkW * 0.34, INK)
  fine(c, hx - 6.4, hy - 18, hx + 4, hy - 22.6, hx + 15.6, hy - 16.4, 0.9, s.hairS)
  fine(c, hx - 3.6, hy - 14.4, hx + 6, hy - 18.4, hx + 16.6, hy - 12.4, 0.9, s.hairS)
  fine(c, hx + 14.4, hy - 12.4, hx + 14.6, hy - 16, hx + 11.6, hy - 19, inkW * 0.3, INK)
  fine(c, hx - 15.4, hy - 6, hx - 14.4, hy - 18, hx - 4, hy - 22.6, 2.1, s.hairL)
  fine(c, hx + 3.6, hy - 23.4, hx + 11.4, hy - 23.6, hx + 16.6, hy - 18.6, 1.5, s.hairL)
}

/** kazıma: kafatasına oturan ince saç; alın çizgisi, şakakta ve kulak arkasında inen kıl (iç ton, yumuşak) */
function drawBuzz(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number, skull: () => void) {
  c.save()
  c.beginPath()
  skull()
  c.clip()
  c.beginPath()
  c.moveTo(hx - 17, hy + 2)
  c.lineTo(hx - 17, hy - 30)
  c.lineTo(hx + 20, hy - 30)
  c.lineTo(hx + 19.4, hy - 11.4)
  c.quadraticCurveTo(hx + 9, hy - 13.6, hx + 0.6, hy - 10.4)
  c.quadraticCurveTo(hx - 5.6, hy - 7.6, hx - 7.6, hy - 1.4)
  c.lineTo(hx - 8.6, hy + 4.2)
  c.closePath()
  c.fillStyle = s.hairS
  c.fill()
  // tepede hafif ışık: kısa kıl üstte açık
  c.beginPath()
  c.ellipse(hx - 3, hy - 21, 11, 5, -0.12, 0, TAU)
  c.fillStyle = s.hair
  c.fill()
  c.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = 0.7 + i * 0.37
    const px = hx - 11 + ((i * 7) % 24)
    const py = hy - 22 + ((i * 5) % 11) + Math.sin(a) * 1.3
    c.moveTo(px, py)
    c.lineTo(px + 0.5, py + 1.1)
  }
  c.strokeStyle = s.hairL
  c.lineWidth = 0.55
  c.lineCap = 'round'
  c.stroke()
  c.restore()
  // hat: alın çizgisinde ince, kenar çizgisi kafatasında yeniden
  fine(c, hx + 19.4, hy - 11.4, hx + 9, hy - 13.6, hx + 0.6, hy - 10.4, 0.8, s.hairS)
  c.beginPath()
  skull()
  c.closePath()
  c.strokeStyle = INK
  c.lineWidth = inkW
  c.stroke()
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

// ── Mağaza aksesuarları (game/accessories.ts) ─────────────────────

/** papatya: sekiz beyaz yaprak, sarı göbek; yaprakların hepsi tek yolda (önce mürekkep, sonra beyaz) */
function daisy(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  c.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * TAU) / 8
    const px = x + Math.cos(a) * r * 0.62
    const py = y + Math.sin(a) * r * 0.62
    c.moveTo(px + Math.cos(a) * r * 0.42, py + Math.sin(a) * r * 0.42)
    c.ellipse(px, py, r * 0.42, r * 0.2, a, 0, TAU)
  }
  c.strokeStyle = INK
  c.lineWidth = inkW * 0.55
  c.lineJoin = 'round'
  c.stroke()
  c.fillStyle = '#fffaf0'
  c.fill()
  blob(c, () => c.arc(x, y, r * 0.34, 0, TAU), '#f2b33a', { color: '#c97f1c', dx: -0.6, dy: -0.6 })
}

/** yuvarlak gözlük: ince altın çerçeve, camda ışık; uzak cam yüz döndüğü için dar, sap kulağa uzanır */
function drawGlasses(c: CanvasRenderingContext2D, hx: number, hy: number) {
  const rimPath = () => {
    c.beginPath()
    c.ellipse(hx + 5, hy + 1.3, 4.7, 4.6, 0, 0, TAU)
    c.moveTo(hx + 15.9, hy + 1)
    c.ellipse(hx + 13.6, hy + 1, 2.3, 4.4, 0, 0, TAU)
    c.moveTo(hx + 9.7, hy + 0.6)
    c.quadraticCurveTo(hx + 10.5, hy - 0.6, hx + 11.3, hy + 0.4)
    c.moveTo(hx + 0.3, hy + 0.4)
    c.lineTo(hx - 8.2, hy - 0.6)
  }
  // cam: çok hafif mavi, sol üstte ışık
  c.beginPath()
  c.ellipse(hx + 5, hy + 1.3, 4.7, 4.6, 0, 0, TAU)
  c.ellipse(hx + 13.6, hy + 1, 2.3, 4.4, 0, 0, TAU)
  c.fillStyle = 'rgba(200,228,255,0.22)'
  c.fill()
  c.lineCap = 'round'
  c.lineJoin = 'round'
  rimPath()
  c.strokeStyle = INK
  c.lineWidth = 2.5
  c.stroke()
  rimPath()
  c.strokeStyle = '#d6a23a'
  c.lineWidth = 1.05
  c.stroke()
  fine(c, hx + 2.2, hy - 0.8, hx + 3, hy - 2.4, hx + 4.8, hy - 2.6, 1, 'rgba(255,255,255,0.75)')
}

/** güneş gözlüğü: koyu cam, dış üst köşesi hafif kanatlı kalın çerçeve; yakın camda tek beyaz parıltı */
function drawShades(c: CanvasRenderingContext2D, hx: number, hy: number) {
  const lenses = () => {
    // yakın cam: üstü düz, dış (sol) üst köşe kanat gibi kalkar, altı yuvarlak
    c.moveTo(hx - 0.6, hy - 3.4)
    c.lineTo(hx + 9.6, hy - 2.4)
    c.quadraticCurveTo(hx + 10, hy + 4.6, hx + 5.6, hy + 5.4)
    c.quadraticCurveTo(hx + 0.6, hy + 5.6, hx - 0.2, hy - 0.4)
    c.closePath()
    // uzak cam: yüz döndüğü için dar, kanadı yüzün kenarında
    c.moveTo(hx + 11.4, hy - 2.4)
    c.lineTo(hx + 16.6, hy - 3.2)
    c.quadraticCurveTo(hx + 16.4, hy + 4.8, hx + 13.4, hy + 5)
    c.quadraticCurveTo(hx + 11.2, hy + 4.6, hx + 11.4, hy - 2.4)
    c.closePath()
  }
  c.lineCap = 'round'
  c.lineJoin = 'round'
  // köprü ve kulağa uzanan sap
  stroke(c, [hx + 9.6, hy - 1.6, hx + 11.4, hy - 1.6], 1.1, '#3a2c3a')
  stroke(c, [hx - 0.4, hy - 2.4, hx - 8.4, hy - 1.4], 1.2, '#3a2c3a')
  c.beginPath()
  lenses()
  c.strokeStyle = INK
  c.lineWidth = 1.4 + inkW
  c.stroke()
  c.strokeStyle = '#3a2c3a'
  c.lineWidth = 1.4
  c.stroke()
  c.fillStyle = '#2a2236'
  c.fill()
  // camın altında hafif mor yansıma, yakın camda tek parıltı
  fine(c, hx + 1.8, hy + 3.4, hx + 5, hy + 4.6, hx + 8.2, hy + 2.8, 1, '#5a4a78')
  fine(c, hx + 1.6, hy + 1.2, hx + 2.6, hy - 0.6, hx + 4.4, hy - 1.4, 1.1, 'rgba(255,255,255,0.9)')
}

/**
 * kayak gözlüğü: iki gözü birden örten tek parça ayna cam (turuncudan mora), kalın çerçeve; lastik bant başın
 * çevresinden (kulağın üstünden) arkaya geçer. back: bandın arkada bittiği yer (saçın dış kenarı)
 */
function drawGoggles(c: CanvasRenderingContext2D, hx: number, hy: number, back: number) {
  // bant: çerçevenin dış kenarından ensenin arkasına
  stroke(c, [hx - 0.6, hy - 0.4, hx - 6, hy - 1.6, hx + back + 1.2, hy - 2.6], 4.4, '#4a3a7a')
  stroke(c, [hx - 2, hy - 1.6, hx - 6.6, hy - 2.6, hx + back + 2, hy - 3.6], 0.9, '#f08a3a', false)
  const rimPath = () => {
    c.moveTo(hx - 1.6, hy - 4.6)
    c.quadraticCurveTo(hx + 8, hy - 6.4, hx + 17.6, hy - 5)
    c.quadraticCurveTo(hx + 18.6, hy + 1, hx + 17, hy + 5.6)
    c.quadraticCurveTo(hx + 13.4, hy + 6.6, hx + 11.6, hy + 5.4)
    // burun çentiği
    c.quadraticCurveTo(hx + 10.4, hy + 3.4, hx + 9, hy + 5.4)
    c.quadraticCurveTo(hx + 3, hy + 7.6, hx - 1, hy + 5.6)
    c.quadraticCurveTo(hx - 2.8, hy + 0.6, hx - 1.6, hy - 4.6)
  }
  blob(c, rimPath, '#3a3446')
  // cam: çerçevenin içinde biraz küçük, turuncudan mora
  c.save()
  c.translate(hx + 8, hy + 0.4)
  c.scale(0.84, 0.72)
  c.translate(-(hx + 8), -(hy + 0.4))
  c.beginPath()
  rimPath()
  c.closePath()
  const g = c.createLinearGradient(hx, hy - 5, hx + 4, hy + 6)
  g.addColorStop(0, '#ffb347')
  g.addColorStop(0.5, '#e8603c')
  g.addColorStop(1, '#7a4ab0')
  c.fillStyle = g
  c.fill()
  c.restore()
  // ayna camda iki çapraz parıltı
  fine(c, hx + 1.4, hy + 1.6, hx + 2.6, hy - 1, hx + 4.8, hy - 2.6, 1.3, 'rgba(255,255,255,0.85)')
  fine(c, hx + 4.4, hy + 2.6, hx + 5.4, hy + 0.6, hx + 7, hy - 0.8, 0.8, 'rgba(255,255,255,0.6)')
}

/** kulaklık: tepeden geçen bant, kulağın üstünde yastıklı yuvarlak kap (uzak kap başın arkasında kalır). top: bandın tepesi */
function drawPhones(c: CanvasRenderingContext2D, hx: number, hy: number, top: number) {
  const col = '#2fb3a6'
  const dark = '#1d7f78'
  // bant: yakın kulaktan tepeye, oradan yüzün uzak kenarına (başın arkasına geçer)
  c.beginPath()
  c.moveTo(hx - 10.4, hy - 3)
  c.bezierCurveTo(hx - 12, hy + top + 4, hx + 8, hy + top - 2, hx + 15.6, hy - 10)
  c.strokeStyle = INK
  c.lineWidth = 3 + inkW
  c.lineCap = 'round'
  c.stroke()
  c.strokeStyle = dark
  c.lineWidth = 3
  c.stroke()
  // bandın içinde yastık şeridi ve ışık
  c.beginPath()
  c.moveTo(hx - 9.4, hy + top + 6)
  c.bezierCurveTo(hx - 7, hy + top + 1.4, hx - 1, hy + top, hx + 3, hy + top + 0.4)
  c.strokeStyle = '#7fd6cc'
  c.lineWidth = 1
  c.stroke()
  // yakın kap: dış kabuk (renkli) ve yastık
  blob(c, () => c.ellipse(hx - 10.4, hy + 1.2, 5.2, 6.4, 0.15, 0, TAU), col, { color: dark, dx: -1.6, dy: -1.4 })
  blob(c, () => c.ellipse(hx - 9.2, hy + 1.2, 2.6, 4, 0.15, 0, TAU), '#3a3446')
  fine(c, hx - 13.6, hy + 0.4, hx - 13.4, hy - 2.6, hx - 11, hy - 4, 1.2, 'rgba(255,255,255,0.6)')
}

/** başa takılan aksesuar (baş koordinatında). hair: geriye savrulma, lift: dikey savrulma (püskül ve ponpon izler) */
function drawHeadAcc(c: CanvasRenderingContext2D, acc: AccessoryId, hx: number, hy: number, t: number, moving: boolean, hair: number, lift: number) {
  if (drawHeadItem(c, acc, heroHead(hx, hy), { t, moving, hair, lift })) return
  const sway = Math.sin(t * (moving ? 11 : 1.8) - 0.8) * (moving ? 1.2 : 0.5)
  switch (acc) {
    case 'fes': {
      // kırmızı keçe fes: tepesi hafif geriye yatık kesik koni; tepeden geriye siyah püskül sarkar
      const col = '#c7302f'
      const dark = '#8c1c24'
      blob(
        c,
        () => {
          c.moveTo(hx - 13.6, hy - 10.6)
          c.quadraticCurveTo(hx, hy - 15.8, hx + 13.4, hy - 14.4)
          c.lineTo(hx + 8.4, hy - 33.4)
          c.quadraticCurveTo(hx - 1.6, hy - 35.6, hx - 10.6, hy - 31)
        },
        col,
        { color: dark, dx: -3, dy: -1.2 },
      )
      // tepe yüzü (koyu), ışık ve kenar dikişi
      fine(c, hx - 10, hy - 30.2, hx - 1, hy - 32, hx + 8, hy - 31.8, 1.2, dark)
      fine(c, hx - 9.2, hy - 13.4, hx - 10, hy - 21, hx - 8, hy - 28, 1.7, 'rgba(255,190,170,0.5)')
      fine(c, hx - 12.4, hy - 13.6, hx, hy - 18.4, hx + 12.4, hy - 17.4, 0.9, dark)
      // püskül: düğümden kordon, ucunda saçaklı demet
      const ax = hx - 1
      const ay = hy - 33.6
      const ex = ax - 9 - hair * 4 + sway * 0.6
      const ey = ay + 13 - hair * 7 - lift * 4 + sway * 0.4
      stroke(c, [ax, ay, (ax + ex) / 2 - 1.5, (ay + ey) / 2 - 2.5, ex, ey], 1.2, '#2e2430')
      const da = Math.atan2(ey - ay, ex - ax) - Math.PI / 2
      c.save()
      c.translate(ex, ey)
      c.rotate(da * 0.6)
      blob(
        c,
        () => {
          c.moveTo(-1.1, -0.6)
          c.lineTo(1.1, -0.6)
          c.quadraticCurveTo(2.8, 4, 2.6, 6.8)
          c.lineTo(-2.6, 6.8)
          c.quadraticCurveTo(-2.8, 4, -1.1, -0.6)
        },
        '#3a2c3a',
      )
      stroke(c, [-0.9, 2.2, -1.2, 6.2], 0.6, '#7a6478', false)
      stroke(c, [0.8, 2.2, 1, 6.2], 0.6, '#7a6478', false)
      c.restore()
      c.beginPath()
      c.arc(ax, ay, 1.4, 0, TAU)
      c.fillStyle = '#2e2430'
      c.fill()
      break
    }
    case 'hasir': {
      // hasır şapka: geniş kenar, yuvarlak tepe, kırmızı kurdele; örgü çizgileri
      const col = '#e9c46c'
      const dark = '#b98d3c'
      const lite = '#fae3a4'
      blob(
        c,
        () => {
          c.ellipse(hx + 1.5, hy - 12.6, 26, 4.6, -0.1, 0, TAU)
        },
        col,
        { color: dark, dx: 0, dy: -2.2 },
      )
      fine(c, hx - 20, hy - 12, hx - 12, hy - 15, hx - 4, hy - 15.6, 1.2, lite)
      blob(
        c,
        () => {
          c.moveTo(hx - 11.6, hy - 12.2)
          c.bezierCurveTo(hx - 13.4, hy - 29, hx + 12.6, hy - 31.6, hx + 13.6, hy - 14.6)
          c.quadraticCurveTo(hx + 1, hy - 15.4, hx - 11.6, hy - 12.2)
        },
        col,
        { color: dark, dx: -3, dy: -1.4 },
      )
      // kurdele
      blob(
        c,
        () => {
          c.moveTo(hx - 11.8, hy - 12.4)
          c.quadraticCurveTo(hx + 1, hy - 15.6, hx + 13.6, hy - 14.8)
          c.lineTo(hx + 13.2, hy - 19.2)
          c.quadraticCurveTo(hx + 1, hy - 20.2, hx - 12.2, hy - 16.6)
        },
        '#c8343a',
        { color: '#8e2028', dx: 0, dy: -1.2 },
      )
      // örgü: tepe ve kenarda kısa kıvrımlar, tepede ışık
      fine(c, hx - 6, hy - 21, hx - 2, hy - 26.6, hx + 5, hy - 27, 0.9, dark)
      fine(c, hx - 9, hy - 20.6, hx - 4, hy - 23.4, hx + 9, hy - 22.4, 0.9, dark)
      fine(c, hx + 16, hy - 13.6, hx + 21, hy - 13.4, hx + 25, hy - 14.6, 0.9, dark)
      fine(c, hx - 10, hy - 21, hx - 9.6, hy - 25.4, hx - 4.6, hy - 27.4, 1.6, lite)
      break
    }
    case 'bere': {
      // örgü bere: başı tepeden saran kubbe, kıvrık kenar, tepede ponpon
      const col = '#4c6ab4'
      const dark = '#33498a'
      const lite = '#7c98d8'
      const px = hx - 3.5 - hair * 3.2 + sway * 0.4
      const py = hy - 31.5 + lift * 1.5
      const pom = () => {
        for (let i = 0; i < 9; i++) {
          const a = (i * TAU) / 9
          const r = i % 2 ? 5 : 5.6
          if (i === 0) c.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r)
          else c.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r)
        }
      }
      blob(c, pom, '#f4ead2', { color: '#cdbd9a', dx: -1.6, dy: -1.6 })
      blob(
        c,
        () => {
          c.moveTo(hx - 16.6, hy - 7.4)
          c.bezierCurveTo(hx - 19.4, hy - 31, hx + 16, hy - 33, hx + 17.6, hy - 11.6)
          c.quadraticCurveTo(hx + 1, hy - 14, hx - 16.6, hy - 7.4)
        },
        col,
        { color: dark, dx: -3, dy: -1.6 },
      )
      // örgü dokusu: tepeye doğru toplanan ilmek sıraları
      fine(c, hx - 8, hy - 15.4, hx - 7.4, hy - 22, hx - 3.6, hy - 27.4, 0.9, dark)
      fine(c, hx + 1.6, hy - 17, hx + 2.4, hy - 22.6, hx + 1.6, hy - 28.4, 0.9, dark)
      fine(c, hx + 10, hy - 16, hx + 10.4, hy - 21, hx + 7.6, hy - 26, 0.9, dark)
      fine(c, hx - 14.6, hy - 14, hx - 13.6, hy - 22, hx - 7.6, hy - 27, 1.7, lite)
      // kıvrık kenar: ayrı bant, üstünde fitil çizgileri
      blob(
        c,
        () => {
          c.moveTo(hx - 17, hy - 6.6)
          c.quadraticCurveTo(hx + 1, hy - 13.6, hx + 18, hy - 11)
          c.lineTo(hx + 17.4, hy - 16.4)
          c.quadraticCurveTo(hx + 1, hy - 18.4, hx - 17.4, hy - 11.6)
        },
        col,
        { color: dark, dx: 0, dy: -1.8 },
      )
      c.beginPath()
      for (let i = 0; i < 8; i++) {
        const u = i / 7
        const x0 = hx - 14.6 + u * 29
        const y0 = hy - 8.6 - Math.sin(u * 2.3) * 3.6
        c.moveTo(x0, y0)
        c.lineTo(x0 + 0.3, y0 - 4.4)
      }
      c.strokeStyle = dark
      c.lineWidth = 0.8
      c.lineCap = 'round'
      c.stroke()
      break
    }
    case 'lale': {
      // lale tokası: kulağın üstünde saça takılı kırmızı lale; sap ve yaprak saçın içine iner, çiçek geriye yatık
      const lx = hx - 13.4 + sway * 0.15
      const ly = hy - 13.6
      stroke(c, [hx - 7.4, hy - 5.4, hx - 9.4, hy - 9, lx + 1.6, ly + 2.6], 1.2, '#4f8f3a')
      c.save()
      c.translate(hx - 8.6, hy - 7.4)
      c.rotate(-1.1)
      c.scale(0.85, 0.85)
      blob(
        c,
        () => {
          c.moveTo(0, 0)
          c.quadraticCurveTo(-1.6, -4, 0.4, -7.6)
          c.quadraticCurveTo(2.4, -3.6, 0, 0)
        },
        '#6eae48',
        { color: '#4f8f3a', dx: -0.8, dy: 0 },
      )
      c.restore()
      c.save()
      c.translate(lx, ly)
      c.rotate(-0.75)
      c.scale(1.3, 1.3)
      // çanak: üç sivri taçyaprak, ortadaki öne biner
      blob(
        c,
        () => {
          c.moveTo(-3.4, -1)
          c.lineTo(-3.8, -6.4)
          c.lineTo(-1.6, -4)
          c.lineTo(0, -7)
          c.lineTo(1.6, -4)
          c.lineTo(3.8, -6.4)
          c.lineTo(3.4, -1)
          c.quadraticCurveTo(3, 2.6, 0, 2.8)
          c.quadraticCurveTo(-3, 2.6, -3.4, -1)
        },
        '#d8343a',
        { color: '#9a1f2a', dx: -1.2, dy: -0.6 },
      )
      fine(c, 0, 2.4, -0.2, -1, 0, -4.4, 0.8, '#9a1f2a')
      fine(c, -2.4, 0.4, -2.6, -2, -2.4, -4, 0.9, 'rgba(255,220,210,0.7)')
      c.restore()
      break
    }
    case 'papatya':
    case 'defne': {
      // papatya tacı: başın üstünden geçen ince yeşil sap, arada yapraklar ve beş papatya.
      // defne tacı (usta mühürleriyle açılır): aynı sap altın, çiçek yerine sık altın yapraklar
      const laurel = acc === 'defne'
      const P = (u: number): [number, number] => {
        const a = (1 - u) * (1 - u)
        const b = 2 * u * (1 - u)
        const d = u * u
        return [a * (hx - 16) + b * (hx - 5) + d * (hx + 15.5), a * (hy - 7.5) + b * (hy - 28) + d * (hy - 16.6)]
      }
      c.beginPath()
      const s0 = P(0)
      c.moveTo(s0[0], s0[1])
      c.quadraticCurveTo(hx - 5, hy - 28, hx + 15.5, hy - 16.6)
      c.strokeStyle = INK
      c.lineWidth = 1.6 + inkW * 0.6
      c.lineCap = 'round'
      c.stroke()
      c.strokeStyle = laurel ? '#c9922a' : '#5c9a3e'
      c.lineWidth = 1.6
      c.stroke()
      // yapraklar: sapın iki yanına sivri damlalar (defnede iki kat sık)
      const leaves: number[][] = laurel
        ? [0.06, 0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9].flatMap((u) => [[u, 1], [u + 0.05, -1]])
        : [[0.18, 1], [0.4, -1], [0.62, 1], [0.84, -1]]
      for (const [u, side] of leaves) {
        const [lx, ly] = P(u)
        const a = u * 1.6 - 1.4 + side * 0.9
        c.save()
        c.translate(lx, ly)
        c.rotate(a)
        blob(
          c,
          () => {
            c.moveTo(0, 0)
            c.quadraticCurveTo(2.2, -2.2, 5, 0)
            c.quadraticCurveTo(2.2, 2.2, 0, 0)
          },
          laurel ? '#f0c050' : '#6eae48',
        )
        c.restore()
      }
      if (!laurel)
        for (const [u, r] of [[0.04, 3.6], [0.27, 4.2], [0.5, 4.6], [0.73, 4.3], [0.95, 3.8]]) {
          const [dx, dy] = P(u)
          daisy(c, dx, dy, r, u * 2)
        }
      break
    }
  }
}

/** kilim heybe: kalçada, gövdenin arkasında sallanır (gövdeden önce çizilir); uzun saçın altında kalmaz */
function drawBag(c: CanvasRenderingContext2D, tx: number, ty: number, sw: number) {
  c.save()
  c.translate(tx - 9, ty - 15)
  c.rotate(sw * 0.04)
  const bag = () => {
    c.moveTo(1.5, 0)
    c.lineTo(-8, 0.2)
    c.quadraticCurveTo(-12.6, 0.4, -12.6, 4.6)
    c.lineTo(-12.2, 15.4)
    c.quadraticCurveTo(-12, 19, -8, 19)
    c.lineTo(1.5, 18.6)
  }
  blob(c, bag, '#ad3430', { color: '#7a2024', dx: -2.6, dy: 0 })
  // kilim deseni: hardal bant ve içinde lacivert zikzak, kapak çizgisi, alt uçta püsküller
  c.save()
  c.beginPath()
  bag()
  c.closePath()
  c.clip()
  c.fillStyle = '#e8b04a'
  c.fillRect(-14, 8, 16, 5.4)
  c.beginPath()
  c.moveTo(-14, 10.7)
  for (let i = 0; i < 7; i++) c.lineTo(-12.4 + i * 2.3, i % 2 ? 9 : 12.4)
  c.strokeStyle = '#2c4a7a'
  c.lineWidth = 1.3
  c.lineJoin = 'miter'
  c.stroke()
  c.restore()
  fine(c, -12.4, 5, -6, 5.8, 1.4, 5.2, inkW * 0.32, INK)
  fine(c, -10.8, 2.4, -11.2, 7, -10.8, 16, 1.2, 'rgba(255,200,170,0.45)')
  stroke(c, [-9.6, 19, -10, 22.4], 1.1, '#e8b04a')
  stroke(c, [-6, 19, -6.2, 22.6], 1.1, '#e8b04a')
  stroke(c, [-2.4, 18.9, -2.4, 22.4], 1.1, '#e8b04a')
  c.restore()
}

/** heybenin askısı: heybeden sırta, omzun üstünden göğsü çaprazlama geçer (gövdeden sonra çizilir) */
function drawStrap(c: CanvasRenderingContext2D, tx: number, ty: number) {
  stroke(c, [tx - 9.6, ty - 14, tx - 8.4, ty - 21.6, tx - 4, ty - 26.4, tx + 1, ty - 22, tx + 9.2, ty - 6.4], 2.1, '#7a4a2a')
  stroke(c, [tx - 3.4, ty - 25.6, tx + 1.2, ty - 21.6], 0.8, 'rgba(255,220,180,0.5)', false)
}

/** sırtta bağlama: tekne belin arkasında, sap sırttan çaprazlama yukarı-geriye uzanır, burgular başın arkasından görünür (gövdeden önce) */
function drawBackSaz(c: CanvasRenderingContext2D, tx: number, ty: number, sw: number) {
  c.save()
  c.translate(tx - 9, ty - 5)
  c.rotate(-0.34 + sw * 0.03)
  // sap ve burguluk
  stroke(c, [0, -6, 0, -54], 2.8, '#7a4a24')
  stroke(c, [0, -53, -1.6, -62], 3.4, '#5e3a1c')
  for (const y of [-55, -58, -61]) stroke(c, [-1.4 + (y + 53) * 0.18, y, -4.4 + (y + 53) * 0.18, y - 0.6], 0.9, '#e0b878')
  // perdeler: sapta kısa enine çizgiler
  c.beginPath()
  for (const y of [-14, -20, -26, -31, -36, -41, -46]) {
    c.moveTo(-1.4, y)
    c.lineTo(1.4, y)
  }
  c.strokeStyle = '#e0b878'
  c.lineWidth = 0.6
  c.stroke()
  // tekne: armut biçimli, göğüs tahtası açık, ses deliği ve teller
  blob(
    c,
    () => {
      c.moveTo(-2.4, -9)
      c.bezierCurveTo(-8.6, -6, -9, 7, 0, 8.6)
      c.bezierCurveTo(9, 7, 8.6, -6, 2.4, -9)
    },
    '#b4733c',
    { color: '#7a4a24', dx: -2, dy: -1.2 },
  )
  c.beginPath()
  c.arc(0, -1, 1.3, 0, TAU)
  c.fillStyle = INK
  c.fill()
  stroke(c, [-2.2, 5.4, 2.2, 5.4], 1, '#5e3a1c', false)
  c.beginPath()
  c.moveTo(-0.5, 5.4)
  c.lineTo(-0.5, -53)
  c.moveTo(0.5, 5.4)
  c.lineTo(0.5, -53)
  c.strokeStyle = 'rgba(255,240,210,0.7)'
  c.lineWidth = 0.35
  c.stroke()
  fine(c, -5.6, 2, -5.6, -3, -2.6, -6.6, 1.2, GLINT)
  c.restore()
}

/** bağlamanın askısı: dokuma kayış, sırttan omzun üstünden göğsü çaprazlama geçer (gövdeden sonra) */
function drawSazStrap(c: CanvasRenderingContext2D, tx: number, ty: number) {
  stroke(c, [tx - 9.4, ty - 12, tx - 8, ty - 21.6, tx - 3.6, ty - 26.4, tx + 1.4, ty - 22, tx + 9.4, ty - 5], 2.2, '#b0302e')
  c.setLineDash([1.2, 1.6])
  stroke(c, [tx - 3.6, ty - 26.4, tx + 1.4, ty - 22, tx + 9.4, ty - 5], 0.8, '#f2c45a', false)
  c.setLineDash([])
}

/**
 * pelerin (çivit, etek ucu altın sırmalı): omuzlardan sarkar; koşarken ve dash'te geriye savrulup dalgalanır, düşerken kalkar (saate bağlı).
 * flow: 0 sarkık .. 1 koşu .. 1,4 dash; lift: -1 yükseliş .. 1 düşüş. Her şeyin arkasında çizilir.
 */
const CAPE = '#4656b0'
const CAPE_S = '#2e3a80'
const CAPE_L = 'rgba(190,205,255,0.55)'
function drawCape(c: CanvasRenderingContext2D, tx: number, ty: number, t: number, flow: number, lift: number) {
  const f = Math.max(0, Math.min(1.4, flow))
  const wave = Math.sin(t * (f > 0.1 ? 13 : 1.8)) * (0.025 + f * 0.05)
  const th = Math.max(0.05, Math.min(1.5, 0.14 + f * 0.95 + lift * 0.35 + wave))
  const bx = tx - 8
  const by = ty - 25
  const dx = -Math.sin(th)
  const dy = Math.cos(th)
  const nx = Math.cos(th)
  const ny = Math.sin(th)
  const L = 44 - f * 3
  const at = (u: number, v: number): [number, number] => [bx + dx * u + nx * v, by + dy * u + ny * v]
  // dalga dökümden uca doğru yürür (iki kenar farklı evrede)
  const w1 = Math.sin(t * 12 - 1) * f * 2.6
  const w2 = Math.sin(t * 12 - 2.4) * f * 2.6
  const w3 = Math.sin(t * 12 - 3.2) * (0.6 + f * 2.2)
  const [h1x, h1y] = at(L, -6.5)
  const [h2x, h2y] = at(L + 1.5, 12)
  const [c1x, c1y] = at(L * 0.5, -4.6 + w1)
  const [mx, my] = at(L + 2.5 + w3, 4)
  const [c2x, c2y] = at(L * 0.5, 11 + w2)
  const cape = () => {
    c.moveTo(tx + 2, ty - 27.6)
    c.quadraticCurveTo(tx - 4, ty - 29, bx, by)
    c.quadraticCurveTo(c1x, c1y, h1x, h1y)
    c.quadraticCurveTo((h1x + mx) / 2 + dx * 1.5, (h1y + my) / 2 + dy * 1.5, mx, my)
    c.quadraticCurveTo((mx + h2x) / 2 - dx * 1, (my + h2y) / 2 - dy * 1, h2x, h2y)
    c.quadraticCurveTo(c2x, c2y, tx + 2, ty - 27.6)
  }
  blob(c, cape, CAPE, { color: CAPE_S, dx: -3, dy: -1 })
  // etek ucunda altın sırma
  c.beginPath()
  c.moveTo(h1x, h1y)
  c.quadraticCurveTo((h1x + mx) / 2 + dx * 1.5, (h1y + my) / 2 + dy * 1.5, mx, my)
  c.quadraticCurveTo((mx + h2x) / 2 - dx * 1, (my + h2y) / 2 - dy * 1, h2x, h2y)
  c.strokeStyle = '#e8b04a'
  c.lineWidth = 1.3
  c.stroke()
  // kıvrımlar: omuzdan etek ucuna, ve sol kenarda ışık
  const [k1x, k1y] = at(L * 0.55, 3 + w1 * 0.5)
  const [e1x, e1y] = at(L, 1.5 + w3 * 0.5)
  fine(c, bx + 1.4, by + 2, k1x, k1y, e1x, e1y, 1, CAPE_S)
  const [k2x, k2y] = at(L * 0.5, 7.5 + w2 * 0.5)
  const [e2x, e2y] = at(L + 1, 8 + w3 * 0.3)
  fine(c, bx + 4, by, k2x, k2y, e2x, e2y, 0.9, CAPE_S)
  const [l1x, l1y] = at(6, -1.6)
  const [l2x, l2y] = at(L * 0.45, -1.4 + w1)
  const [l3x, l3y] = at(L * 0.8, -1.8 + w1 * 0.6)
  fine(c, l1x, l1y, l2x, l2y, l3x, l3y, 1.4, CAPE_L)
}

/**
 * Karakteri çizer. (x, y): ayak tabanı orta noktası ekran pikselinde, size: karakter boyu pikselde.
 * flip: sola bakar. t: saniye (atkı ve saç salınımı, nefes). opts.flow: atkının savrulması (0 sarkık .. 1,4 dash).
 */
export function drawHero(c: CanvasRenderingContext2D, look: Look, pose: Pose, x: number, y: number, size: number, flip: boolean, t: number, opts: { moving?: boolean; sx?: number; sy?: number; scarf?: string; scarfS?: string; acc?: Kit; flow?: number } = {}) {
  const kit = opts.acc ?? NO_KIT
  // Mağaza görünümü (saç, ten, kıyafet, göz, ifade) kombinle birlikte gelir; sonuç önbellekte
  const s = resolveSkin(look, kit.look, opts.scarf, opts.scarfS)
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
  const nod = (moving && pose.ground ? nl[0] * 0.0011 : 0) - tilt * 0.45 + (pose.head ?? 0)
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
  // uzak kol ve bacak önce, gövde, yakın bacak, atkı, kafa, yakın kol (pelerin hepsinin arkasında)
  c.save()
  upper()
  if (kit.back === 'pelerin') drawCape(c, tx, ty + breath, t, opts.flow ?? (moving ? 1 : 0), lift)
  drawArm(c, s, tx - 4 + twist(fa[0]), sY, fa[0], fa[1], false, armReach(pose, 0))
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
  const bagSw = Math.sin(t * (moving ? 13 : 2.2)) * (moving ? 1 : 0.3) + (pose.ground ? 0 : lift * 2)
  if (kit.back === 'heybe') drawBag(c, tx, ty, bagSw)
  if (kit.back === 'saz') drawBackSaz(c, tx, ty, bagSw)
  drawHeroBack(c, kit.back, tx, ty, t, bagSw, opts.flow ?? (moving ? 1 : 0), lift)
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
  if (kit.back === 'heybe') drawStrap(c, tx, ty)
  if (kit.back === 'saz') drawSazStrap(c, tx, ty)
  drawHeroBackFront(c, kit.back, tx, ty)
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
  if (!s.bare) drawScarf(c, s, tx, ty + breath, t, opts.flow ?? (moving ? 1 : 0), lift)
  // kafa boyuna göre biraz büyük: sevimli oran
  c.save()
  c.translate(tx + 1, ty - 28 + breath)
  c.rotate(nod)
  c.scale(1.14, 1.14)
  c.translate(-(tx + 1), -(ty - 28))
  drawHead(c, s, tx + 1, ty, !!pose.blink, pose.hair ?? 0, lift, t, moving, pose.mood === 'happy', kit, pose.gaze ?? 0, pose.mouth)
  c.restore()
  drawArm(c, s, tx + 4 + twist(na[0]), sY, na[0], na[1], true, armReach(pose, 1))
  c.restore()
  c.restore()
}

/**
 * Koşu döngüsü: 0 ve 0,5 temas, 0,25 ve 0,75 geçiş. Gövde öne eğilir ve geçişte hafifçe havalanır (adım yaylanır);
 * saç ve atkı her adımda bir kez yaylanır (ikincil hareket), kollar dirsekten bükük, bacaklara ters salınır.
 * speed: koşu hızının tam koşuya oranı (yavaşta adım kısalır, nitroda gövde daha çok eğilir).
 */
export function gait(phase: number, speed = 1): Pose {
  return gaitInto(newPose(), phase, speed)
}

/** Boş poz: kare başına ayırmamak için çağıranın tuttuğu, her karede üstüne yazılan tampon */
export function newPose(): Pose {
  return { legs: [[0, 0], [0, 0]], arms: [[0, 0], [0, 0]], lean: 0, tilt: 0, bob: 0, hair: 0, lift: 0, ground: true, reach: 1, head: 0, gaze: 0, blink: false, mouth: undefined, mood: undefined }
}

/** `src` pozunu `out` tamponuna kopyalar (yeni nesne ayırmaz); `out` döner */
export function copyPose(out: Pose, src: Pose): Pose {
  out.legs[0][0] = src.legs[0][0]
  out.legs[0][1] = src.legs[0][1]
  out.legs[1][0] = src.legs[1][0]
  out.legs[1][1] = src.legs[1][1]
  out.arms[0][0] = src.arms[0][0]
  out.arms[0][1] = src.arms[0][1]
  out.arms[1][0] = src.arms[1][0]
  out.arms[1][1] = src.arms[1][1]
  out.lean = src.lean ?? 0
  out.tilt = src.tilt ?? 0
  out.bob = src.bob ?? 0
  out.hair = src.hair ?? 0
  out.lift = src.lift ?? 0
  out.ground = src.ground
  out.reach = src.reach ?? 1
  out.head = src.head ?? 0
  out.gaze = src.gaze ?? 0
  out.blink = !!src.blink
  out.mouth = src.mouth
  out.mood = src.mood
  return out
}

/** koşu tarzı ayarları: adım boyu, adım sıklığı, diz, kol salınımı, dirsek, eğim, sekme, ön eğim, tek kol */
interface RunCfg {
  stride: number
  cad: number
  knee: number
  swing: number
  elbow: number
  tilt: number
  hop: number
  lean: number
  tuck?: boolean
  /** kollar gövdenin arkasında, düz (ninja koşusu) */
  trail?: boolean
}
const RUN_CFG: Record<string, RunCfg> = {
  normal: { stride: 1, cad: 1, knee: 1, swing: 1, elbow: 1, tilt: 0, hop: 1, lean: 0 },
  // sportif: uzun adım, yüksek diz, dirsekler 90 derece bükük ve güçlü kol salınımı, gövde öne eğik
  sportif: { stride: 1.2, cad: 1, knee: 1.3, swing: 1.22, elbow: 1.5, tilt: 0.05, hop: 1.5, lean: 0.8 },
  // tırıs: kısa, sık adımlar (adım sıklığı iki katı, adım boyu yarısı: ayak yerde kaymaz), dirsekler gövdeye yakın, yaylanan sekme
  tirisa: { stride: 0.5, cad: 2, knee: 0.7, swing: 0.5, elbow: 0.85, tilt: -0.02, hop: 1.8, lean: 0 },
  // tek omuz: gövde bir omzu öne verir, uzak kol göğse toplanır, yakın kol salınır
  omuz: { stride: 1, cad: 1, knee: 1, swing: 0.6, elbow: 1, tilt: 0.2, hop: 1, lean: 2.2, tuck: true },
  // ninja: gövde iyice öne eğik, iki kol da düz ve geride, uzun alçak adımlar
  ninja: { stride: 1.12, cad: 1, knee: 1.1, swing: 0, elbow: 1, tilt: 0.16, hop: 0.6, lean: 2.6, trail: true },
}

/**
 * Koşu döngüsü, `out` tamponuna yazılır (ayırma yok). style: koşu tarzı (game/looks.ts RUN_STYLES); bilinmeyen normal sayılır.
 */
export function gaitInto(out: Pose, phase: number, speed = 1, style?: string): Pose {
  const cfg = RUN_CFG[style ?? 'normal'] ?? RUN_CFG.normal
  const k = Math.max(0.3, Math.min(1.6, speed))
  const slow = Math.min(1, k)
  const fast = Math.max(0, k - 1)
  const ph = phase * Math.PI * 2 * cfg.cad + Math.PI / 2
  const sn = Math.sin(ph)
  const cs = Math.cos(ph)
  const stride = 34 * (0.55 + 0.45 * slow) * (1 + fast * 0.25) * cfg.stride
  const kneeK = cfg.knee
  for (let i = 0; i < 2; i++) {
    const sign = i ? 1 : -1
    const th = stride * sn * sign
    // v > 0: bacak öne savruluyor (havada, diz bükülür); v < 0: ayak yerde geriye itiyor (bacak düz). Eskiden işaret
    // tersti: diz yerdeyken bükülüp havada düzleşiyor, karakter geri geri yürüyor gibi görünüyordu
    const v = cs * sign
    out.legs[i][0] = th
    out.legs[i][1] = v > 0 ? 10 + (62 + 18 * slow) * Math.pow(v, 1.2) * kneeK : 6 + 12 * -v
  }
  const spring = Math.sin(ph * 2)
  // geçişte (iki ayak alt alta) gövde en yüksekte: koşunun yaylanması
  const hop = 0.5 + 0.5 * Math.cos(ph * 2)
  const swing = 38 * (0.6 + 0.4 * slow) * (1 + fast * 0.2) * cfg.swing
  const el = cfg.elbow
  out.arms[0][0] = swing * sn
  out.arms[0][1] = swing * sn + (58 + 30 * Math.max(0, sn)) * el
  out.arms[1][0] = -swing * sn
  out.arms[1][1] = -swing * sn + (58 + 30 * Math.max(0, -sn)) * el
  if (cfg.trail) {
    // kollar arkaya uzanır, adımla hafifçe titrer
    out.arms[0][0] = -62 + sn * 4
    out.arms[0][1] = -74 + sn * 4
    out.arms[1][0] = -56 - sn * 4
    out.arms[1][1] = -68 - sn * 4
  }
  if (cfg.tuck) {
    // uzak kol göğse toplanır (hafif nefesle oynar)
    out.arms[0][0] = 16 + sn * 3
    out.arms[0][1] = 118 + sn * 4
  }
  out.lean = 1.6 + cfg.lean
  out.tilt = 0.06 + 0.06 * slow + 0.07 * fast + 0.014 * spring + cfg.tilt
  out.ground = true
  out.bob = -1.7 * hop * slow * cfg.hop
  out.hair = 0.45 + 0.25 * slow + 0.22 * spring
  out.lift = 0.12 * spring
  out.reach = 1
  out.head = cfg.tuck ? 0.05 : 0
  out.gaze = 0
  out.blink = false
  out.mouth = undefined
  out.mood = undefined
  return out
}

/** iki poz arasında doğrusal geçiş (eklem açıları, eğim, savrulma); u = 0 a, 1 b. Yeni nesne döner: kare içinde `lerpPoseInto` */
export function lerpPose(a: Pose, b: Pose, u: number): Pose {
  return lerpPoseInto(newPose(), a, b, u)
}

/** `lerpPose`, `out` tamponuna (ayırma yok); `out` a ya da b ile aynı nesne olabilir */
export function lerpPoseInto(out: Pose, a: Pose, b: Pose, u: number): Pose {
  const m = (x: number, y: number) => x + (y - x) * u
  const ra = Array.isArray(a.reach) ? (u < 0.5 ? a.reach[0] : b.reach === undefined ? a.reach[0] : 1) : (a.reach ?? 1)
  const rb = Array.isArray(b.reach) ? (u < 0.5 ? 1 : b.reach[0]) : (b.reach ?? 1)
  const grd = u < 0.5 ? a.ground : b.ground
  const blink = !!a.blink
  const mouth = a.mouth
  const mood = a.mood
  const gz = m(a.gaze ?? 0, b.gaze ?? 0)
  for (let i = 0; i < 2; i++) {
    out.legs[i][0] = m(a.legs[i][0], b.legs[i][0])
    out.legs[i][1] = m(a.legs[i][1], b.legs[i][1])
    out.arms[i][0] = m(a.arms[i][0], b.arms[i][0])
    out.arms[i][1] = m(a.arms[i][1], b.arms[i][1])
  }
  out.lean = m(a.lean ?? 0, b.lean ?? 0)
  out.tilt = m(a.tilt ?? 0, b.tilt ?? 0)
  out.bob = m(a.bob ?? 0, b.bob ?? 0)
  out.hair = m(a.hair ?? 0, b.hair ?? 0)
  out.lift = m(a.lift ?? 0, b.lift ?? 0)
  out.head = m(a.head ?? 0, b.head ?? 0)
  out.gaze = gz
  out.ground = grd
  out.reach = m(ra, rb)
  out.blink = blink
  out.mouth = mouth
  out.mood = mood
  return out
}

const smooth = (u: number) => u * u * (3 - 2 * u)

/**
 * Havada poz, dikey hıza göre sürekli: yükselişte gövde uzar, bir diz toplanır, öndeki kol yukarı uzanır →
 * tepede iki diz toplanır, kollar yana açılır (asılı an) → düşüşte kollar yukarı açılır, bacaklar inişe uzanır.
 * vy: px/sn (+ aşağı). t: saniye (düşerken kollar hafifçe çırpınır).
 */
export function airPose(vy: number, t = 0): Pose {
  return airPoseInto(newPose(), vy, t)
}

/** `airPose`, `out` tamponuna (kare içinde: ayırma yok) */
export function airPoseInto(out: Pose, vy: number, t = 0): Pose {
  const u = Math.max(0, Math.min(1, 0.5 + vy / 560))
  if (u < 0.5) lerpPoseInto(out, POSES.rise, POSES.apex, smooth(u * 2))
  else lerpPoseInto(out, POSES.apex, POSES.fall, smooth((u - 0.5) * 2))
  const fl = Math.max(0, u - 0.6) / 0.4
  if (fl > 0) {
    const w = Math.sin(t * 11) * 9 * fl
    out.arms[0][0] -= w
    out.arms[0][1] -= w * 1.3
    out.arms[1][0] += w
    out.arms[1][1] += w * 1.3
    const k = Math.sin(t * 9 + 1) * 6 * fl
    out.legs[0][0] += k
    out.legs[1][0] -= k
  }
  return out
}

export const POSES: Record<string, Pose> = {
  idle: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [-8, 10]], ground: true },
  jump: { legs: [[-16, 14], [52, 96]], arms: [[-50, -30], [115, 140]], hair: 0.7, lift: -0.5, tilt: 0.04 },
  /** yükseliş: gövde uzun, yakın diz göğse, öndeki kol göğe uzanır, arka bacak itişten düz kalır */
  rise: { legs: [[-20, 10], [62, 104]], arms: [[-48, -24], [118, 142]], hair: 0.75, lift: -0.7, tilt: 0.02 },
  /** tepe: asılı an; dizler toplanır, kollar yana açılır */
  apex: { legs: [[26, 84], [50, 100]], arms: [[-98, -74], [98, 122]], hair: 0.55, lift: 0.2, bob: -2 },
  /** düşüş: kollar yukarı açılır, bacaklar aşağı uzanıp inişe hazırlanır */
  fall: { legs: [[-16, 22], [20, 30]], arms: [[-128, -108], [104, 126]], hair: 0.95, lift: 1, tilt: -0.04 },
  /** iniş: dizler bükük, kollar dengeye açılır (squash render.ts'te) */
  land: { legs: [[26, 78], [46, 96]], arms: [[-36, -8], [52, 86]], ground: true, hair: 0.5, lift: 0.55, tilt: 0.16 },
  /** duvar kayması: yüz duvara dönük, iki el duvarda, yakın diz kalkık, taban duvara dayalı */
  wall: { legs: [[-8, 22], [62, 50]], arms: [[128, 162], [62, 104]], lean: 1.5, lift: 0.6, hair: 0.2, tilt: 0.05, head: -0.1 },
  /** fren: eski yöne bakar, geriye yaslanır; yakın bacak önde dümdüz kayar, kollar savrulur */
  brake: { legs: [[-24, 52], [40, 4]], arms: [[150, 128], [96, 112]], lean: -2.2, tilt: -0.3, ground: true, hair: 0.05, lift: 0.5 },
  /** yatay dash: gövde öne yatar (render.ts ayrıca döndürür), kollar ve bacaklar geriye savrulur */
  dash: { legs: [[-80, 6], [-56, 34]], arms: [[-82, -92], [-96, -106]], lean: -2.5, tilt: 0.42, hair: 1.3 },
  /** yukarı / çapraz dash: roket; uzak kol başın üstünden yöne uzanır, yakın kol gövdeye yapışık, bacaklar bitişik (render.ts yöne döndürür) */
  rocket: { legs: [[-6, 4], [4, 10]], arms: [[166, 176], [-22, -12]], hair: 1.2, lift: -1 },
  /** aşağı dash: ayakla iner; uzak kol yukarı, yakın kol geriye savrulur, dizler hafif bükük */
  stomp: { legs: [[10, 12], [-6, 6]], arms: [[150, 170], [-118, -150]], hair: 0.1, lift: 1 },
  wave: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [105, 140]], ground: true },
}

/**
 * Kurbağalama döngüsünün pozu (f: 0..1). Anahtar pozlar arasında yumuşak geçiş (smoothstep):
 * 0 süzülme (kollar çenenin altından öne uzanır, yüzü örtmez; bacaklar düz) · 0,3 çekiş (kollar yanlara açılır) · 0,5 toplanma (eller göğüste,
 * dizler karına) · 0,7 tekme (kollar öne uzanırken bacaklar geriye vurur) · 1 süzülme.
 */
const STROKE: [number, Pose][] = [
  [0, { arms: [[126, 130], [132, 136]], legs: [[-4, 6], [4, 10]], hair: 1.2, lift: 0.1, reach: 1.28 }],
  [0.3, { arms: [[88, 66], [94, 72]], legs: [[-2, 8], [6, 12]], hair: 1.1, lift: 0.2, reach: 1.1 }],
  [0.5, { arms: [[54, 146], [60, 152]], legs: [[48, 112], [58, 122]], hair: 0.9, lift: 0.35, reach: 1 }],
  [0.7, { arms: [[112, 120], [118, 126]], legs: [[-14, 14], [-4, 20]], hair: 1.3, lift: 0, reach: 1.2 }],
  [1, { arms: [[126, 130], [132, 136]], legs: [[-4, 6], [4, 10]], hair: 1.2, lift: 0.1, reach: 1.28 }],
]

export function swimStroke(f: number): Pose {
  let i = 0
  while (i < STROKE.length - 2 && f >= STROKE[i + 1][0]) i++
  const [fa, a] = STROKE[i]
  const [fb, b] = STROKE[i + 1]
  const u = Math.min(1, Math.max(0, (f - fa) / (fb - fa)))
  const e = u * u * (3 - 2 * u)
  const m = (x: number, y: number) => x + (y - x) * e
  const pair = (x: [number, number], y: [number, number]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])]
  return {
    arms: [pair(a.arms[0], b.arms[0]), pair(a.arms[1], b.arms[1])],
    legs: [pair(a.legs[0], b.legs[0]), pair(a.legs[1], b.legs[1])],
    hair: m(a.hair ?? 0, b.hair ?? 0),
    lift: m(a.lift ?? 0, b.lift ?? 0),
    reach: m((a.reach as number) ?? 1, (b.reach as number) ?? 1),
  }
}
