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
  /** omuzların kalçaya göre dönüşü (-1..1, + yakın omuz öne): koşuda göğüs adımın tersine döner, kollar omuzdan salınır */
  twist?: number
  /** ayak tabanının zemine göre açısı (derece, + burun aşağı): topuk-parmak basışı; yoksa `footOf` türetir */
  feet?: [number, number]
  /** sırt eşyasının (çanta, saz, kanat, jet) ikincil salınımı: yürürken gövdeyi geriden izler; yoksa yakın uyluktan türer */
  sway?: number
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
  /** rolünü anlatan eşya (sırt yuvası boşken): haritacıda harita tüpü, telefoncuda omuz çantası */
  role?: 'tube' | 'satchel'
}

export const LOOKS: Record<Look, Skin> = {
  uktun: {
    skin: '#fbd3b4', skinS: '#e8a98a', blush: 'rgba(240,120,110,0.45)',
    hair: '#b4482a', hairS: '#7e2c20', hairL: '#e07a46', iris: '#7a4a26',
    coat: '#efb440', coatS: '#c98424', coatL: '#ffd878', shirt: '#fbf3e2',
    // sarı ceketin üstünde kırmızı yerine turkuaz atkı (logoyla aynı)
    scarf: '#2fb3c0', scarfS: '#1a7f8c', pants: '#4f62a0', pantsS: '#35467c',
    boot: '#7a4630', bootS: '#4c2a1c', brow: '#7e2c20', fringe: true, fem: true, back: 'long', quilt: true, role: 'tube',
  },
  memo: {
    skin: '#e2ad84', skinS: '#c08460', blush: 'rgba(200,110,90,0.3)',
    hair: '#3a2a22', hairS: '#211612', hairL: '#5e4636', iris: '#4a2e1c',
    coat: '#2f8d9a', coatS: '#1f6472', coatL: '#58b8c0', shirt: '#f2eee6',
    scarf: '#d83c36', scarfS: '#9e2430', pants: '#3e3e4e', pantsS: '#2a2a36',
    boot: '#6a3e2a', bootS: '#3e2418', brow: '#241612',
    trim: '#5c4234', trimS: '#412c22', role: 'satchel',
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
const THIGH = 21
const SHIN = 18.5
const UPPER = 16
const FORE = 14
const HIP_Y = -44
const TAU = Math.PI * 2
/** kot dikişi (kesik çizgi) ve düz çizgi: sabit diziler, kare başına ayırma yok */
const SEAM_DASH = [1.2, 1]
const NO_DASH: number[] = []
/** başın çizim ölçeği: boyun dönüm noktasından; baş toplam boyun ~1/4,7'si (videodaki gibi gerçekçi oran) */
const HEAD_K = 0.73
/** ışığın düştüğü yerde ince vurgu, kumaş ve deri üstünde */
const GLINT = 'rgba(255,238,210,0.4)'
/** ayak altındaki temas gölgesi */
const CONTACT = 'rgba(30,16,44,0.13)'

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

/**
 * Ayağın zemine göre açısı (derece, + burun aşağı). Pozda yazılıysa o; yoksa yerde düz basar, havada burun hafifçe
 * aşağı sarkar (gevşek ayak bileği).
 */
export function footOf(p: Pose, i: number): number {
  return p.feet ? p.feet[i] : p.ground ? 0 : 18
}

/** botun tabanı bilekten bu kadar aşağıda; burun ve topuk bilekten bu kadar önde / geride (çizim biriminde) */
const SOLE = 3.4
const TOE = 8.6
const HEEL = 4.5

/**
 * Yerdeki pozda en alttaki tabanın zemine oturması için gereken dikey kayma. Ayağın açısı da sayılır: topuğu
 * kalkmış ayak burnunun ucunda, burnu kalkmış ayak topuğunda durur (gövde ona göre yükselir, ayak zemine gömülmez).
 */
export function groundBob(p: Pose) {
  let low = -Infinity
  for (let i = 0; i < 2; i++) {
    const [t, k] = p.legs[i]
    const a = rad(footOf(p, i))
    const sa = Math.sin(a)
    const ca = Math.cos(a)
    const drop = Math.max(TOE * sa, -HEEL * sa) + SOLE * ca - SOLE
    low = Math.max(low, joint(0, HIP_Y, t, THIGH, t - k, SHIN).ey + drop)
  }
  return -4.5 - low
}

/**
 * Yumuşak boya kipi: oyundaki karakter ve şehir insanı (drawHero) el boyaması / kil hacmiyle çizilir. Dış hat siyah
 * değil, dolgunun koyu-sıcak tonudur ve incedir; gölgeli şekiller sol üstten ılık ışık alır, gölge iki kademede
 * yumuşayarak serin-mora döner, ışığa bakan kenarda ince parlak hat (kenar ışığı) durur. Boss, düşman ve portre bu
 * kipe girmez (aynı fırçaları kullanırlar ama klasik mürekkep hatla kalırlar). Gradyan ve süzgeç yok: hacim birkaç
 * yarı saydam düz katmanla verilir, kare başına nesne ayrılmaz (koyu ton önbellekte).
 */
let soft = false
/**
 * Boyalı görünüme izin (oyun çizicisi kalite kademesine göre verir; Mağaza, portre, föy gibi önizlemeler hep boyalı).
 * Kapalıyken çizimler klasik kalın hatlı, düz renkli kalır: şekil başına kırpma yapmaz, zayıf cihazda kare kaçırmaz
 * (kullanıcı kararı, 25 Kasım 2026: zayıf cihazda karakter sadeleşir, güçlü cihazda boyalı kalır).
 */
let painted = true
/** boyalı görünüme izni aç/kapa (render.ts kalite kademesi) */
export function setPainted(on: boolean) {
  painted = on
}
/** yumuşak boya kipini aç/kapa; önceki değeri döndürür (çağıran sonunda geri yükler) */
export function setSoft(on: boolean): boolean {
  const was = soft
  soft = on && painted
  return was
}
/** yumuşak kipte iç çizgi ve parça hatlarının ortak koyu-sıcak tonu (siyah değil) */
const SOFT_EDGE = 'rgba(58,26,34,0.82)'
/** kenar ışığı (ılık) */
const RIM = 'rgba(255,236,204,0.32)'
/** koyu dolguda (mor cübbe, lacivert ceket) kenar ışığı güçlenir: koyu zeminde siluet ayrılsın */
const RIM_DARK = 'rgba(255,226,196,0.55)'
const darkCache = new Map<string, boolean>()
function isDark(fill: string): boolean {
  let d = darkCache.get(fill)
  if (d !== undefined) return d
  const m = /^#([0-9a-f]{6})$/i.exec(fill)
  d = false
  if (m) {
    const v = parseInt(m[1], 16)
    d = 0.3 * (v >> 16) + 0.55 * ((v >> 8) & 255) + 0.15 * (v & 255) < 95
  }
  darkCache.set(fill, d)
  return d
}
const edgeCache = new Map<string, string>()
/** dolgu renginin koyu-sıcak hattı: klasik kipte mürekkep */
function edgeOf(fill: string): string {
  if (!soft) return INK
  let e = edgeCache.get(fill)
  if (e) return e
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(fill)
  if (!m) e = SOFT_EDGE
  else {
    const h = m[1].length === 3 ? m[1].replace(/./g, (d) => d + d) : m[1]
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    e = `rgb(${Math.round(r * 0.32 + 22)},${Math.round(g * 0.26 + 10)},${Math.round(b * 0.3 + 18)})`
  }
  edgeCache.set(fill, e)
  return e
}
/** iç çizgi (saç teli, dikiş, kapama): yumuşak kipte siyah değil */
const line = () => (soft ? SOFT_EDGE : INK)
/** portre için: iç çizgi rengi (kip kapalıyken mürekkep) */
export const inkLine = line
/** dış hat kalınlığı: yumuşak kipte ince */
const edgeW = () => (soft ? inkW * 0.74 : inkW)

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
    c.strokeStyle = edgeOf(color)
    c.lineWidth = w + edgeW()
    c.stroke()
  }
  path()
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke()
  if (soft && ink && w >= inkW * 1.25) {
    // uzuv hacmi: alt-sağda serin gölge, üst-solda ılık kenar ışığı (ikisi de çizginin içinde kalır)
    c.save()
    c.translate(w * 0.17, w * 0.17)
    path()
    c.strokeStyle = 'rgba(52,30,96,0.24)'
    c.lineWidth = w * 0.5
    c.stroke()
    c.translate(-w * 0.45, -w * 0.45)
    path()
    c.strokeStyle = RIM
    c.lineWidth = w * 0.1
    c.stroke()
    c.restore()
  }
}

/**
 * Gölge bandının çerçevesi (x, y, g, y): varsayılan karakter birimine göredir (taban 0, baş yukarıda). Portre gibi kökeni
 * sol üstte olan çizimler kendi kutusunu verir; yoksa çerçevenin altında kalan parça tersine gölgelenir.
 */
let shadeBox: [number, number, number, number] | null = null
export function setShadeBox(b: [number, number, number, number] | null) {
  shadeBox = b
}

/** dolu kapalı yol: önce mürekkep dış hat, sonra renk; gölge isteğe bağlı kırpılarak eklenir */
export function blob(c: CanvasRenderingContext2D, build: () => void, fill: string, shade?: { color: string; dx: number; dy: number }) {
  c.beginPath()
  build()
  c.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = edgeOf(fill)
  c.lineWidth = edgeW()
  c.stroke()
  c.fillStyle = fill
  c.fill()
  if (shade) {
    c.save()
    c.beginPath()
    build()
    c.closePath()
    c.clip()
    // gölge: şeklin kaydırılmış kopyasının dışında kalan kısmı koyulaşır. Doldurulan çerçeve şeklin boyuna yakın
    // tutulur (kırpılan alan küçük: yazılımla boyayan tarayıcıda 400x400'lük çerçeve kareyi yavaşlatıyordu)
    const u = inkW / 3.2
    const R = Math.max(80, 150 * u)
    const box = shadeBox
    const band = (dx: number, dy: number, color: string) => {
      c.save()
      c.translate(dx, dy)
      c.beginPath()
      build()
      c.closePath()
      if (box) c.rect(box[0], box[1], box[2], box[3])
      else c.rect(-R, -R * 1.6, R * 2, R * 2.2)
      c.fillStyle = color
      c.fill('evenodd')
      c.restore()
    }
    if (soft) {
      // yumuşak geçiş: tek gölge bandı (biraz geniş, biraz soluk) ve ışık yanında kenar ışığı. Ayrı geniş soluk bant,
      // serin çekirdek ve parıltı kare maliyetini katlıyordu (verify-perf), görünür farkı azdı
      const prev = c.globalAlpha
      c.globalAlpha = prev * 0.8
      band(shade.dx * 1.3, shade.dy * 1.3, shade.color)
      c.globalAlpha = prev
      band(1.1 * u, 1.1 * u, isDark(fill) ? RIM_DARK : RIM)
    } else band(shade.dx, shade.dy, shade.color)
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

/** saçta geniş, yarı saydam ışık tutamı (altına `fine` ile ince parlak tel çekilir): saç kütle gibi değil tutam tutam durur */
function sheen(c: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string) {
  const a = c.globalAlpha
  c.globalAlpha = a * 0.42
  fine(c, x0, y0, cx, cy, x1, y1, w, color)
  c.globalAlpha = a
}

function drawLeg(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number, t: number, k: number, near: boolean, foot: number) {
  const j = joint(hx, hy, t, THIGH, t - k, SHIN)
  const pants = near ? s.pants : s.pantsS
  stroke(c, [hx, hy, j.kx, j.ky, j.ex, j.ey], 10.2, pants)
  // paça: bileğin üstünde bir kat kıvrılmış kenar (pantolondan biraz geniş)
  const lx = Math.sin(rad(t - k))
  const ly = Math.cos(rad(t - k))
  stroke(c, [j.ex - lx * 3.6, j.ey - ly * 3.6, j.ex - lx * 1.2, j.ey - ly * 1.2], 11, pants)
  if (near) {
    // ön kenarda tek kademe gölge, yan dikiş (kesik), dizde kıvrım, paça katında ışık
    stroke(c, [hx + 1.8, hy + 1, j.kx + 1.8, j.ky, j.ex + 1.6 - lx * 3.6, j.ey - 1 - ly * 3.6], 2.4, s.pantsS, false)
    c.setLineDash(SEAM_DASH)
    stroke(c, [hx - 1.2, hy + 2, j.kx - 1.4, j.ky, j.ex - 1.2 - lx * 4.2, j.ey - ly * 4.2], 0.55, 'rgba(255,226,170,0.38)', false)
    c.setLineDash(NO_DASH)
    const kxn = j.kx
    fine(c, kxn - 2.6, j.ky - 1.4, kxn - 0.4, j.ky + 0.4, kxn + 2.4, j.ky - 0.6, 0.8, s.pantsS)
    fine(c, kxn - 2, j.ky + 1.4, kxn, j.ky + 2.6, kxn + 2.2, j.ky + 1.8, 0.7, s.pantsS)
    stroke(c, [j.ex - lx * 3.4 - 2.6, j.ey - ly * 3.4, j.ex - lx * 3.4 + 2.6, j.ey - ly * 3.4], 0.7, GLINT, false)
  }
  // bot: tabanın zemine göre açısıyla döner (topuk-parmak), burnu ileri bakar
  c.save()
  c.translate(j.ex, j.ey)
  c.rotate(rad(foot))
  // bot biraz zarif: taban hizası yerinde kalarak küçülür
  c.translate(0, 3.4)
  c.scale(0.9, 0.9)
  c.translate(0, -3.4)
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
  // taban: koyu kalın şerit, topukta basamak
  stroke(c, [-4.5, 2.7, 8.6, 2.7], 1.5, 'rgba(28,16,18,0.5)', false)
  if (near) {
    // bağcık çaprazları, konç kıvrımı ve burunda ışık
    stroke(c, [0.6, -3.4, 2.6, -1.8, 1.4, -1.8, 3.4, -0.6], 0.6, 'rgba(255,236,206,0.6)', false)
    fine(c, -3.4, -1.7, -1.6, -1.1, -0.2, -1.9, 0.8, s.bootS)
    fine(c, 4.6, -0.2, 6.2, 0, 7.1, 0.8, 1, GLINT)
  }
  c.restore()
}

/**
 * İki boğumlu uzuv (kol, bacak): üst parça kalın, alt parça ince; önce iki parçanın dış hattı, sonra dolguları
 * (dirsekte ek yeri görünmez). Yumuşak kipte `stroke` gibi alt-sağda serin gölge, üst-solda kenar ışığı.
 */
function limb(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w1: number, w2: number, color: string) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const seg = (ax: number, ay: number, bx: number, by: number, w: number, col: string) => {
    c.beginPath()
    c.moveTo(ax, ay)
    c.lineTo(bx, by)
    c.strokeStyle = col
    c.lineWidth = w
    c.stroke()
  }
  const edge = edgeOf(color)
  const e = edgeW()
  seg(x0, y0, x1, y1, w1 + e, edge)
  seg(x1, y1, x2, y2, w2 + e, edge)
  seg(x0, y0, x1, y1, w1, color)
  seg(x1, y1, x2, y2, w2, color)
  if (soft) {
    const o = w2 * 0.17
    c.beginPath()
    c.moveTo(x0 + o, y0 + o)
    c.lineTo(x1 + o, y1 + o)
    c.lineTo(x2 + o, y2 + o)
    c.strokeStyle = 'rgba(52,30,96,0.22)'
    c.lineWidth = w2 * 0.5
    c.stroke()
    const r = w2 * 0.28
    c.beginPath()
    c.moveTo(x0 - r, y0 - r)
    c.lineTo(x1 - r, y1 - r)
    c.lineTo(x2 - r, y2 - r)
    c.strokeStyle = RIM
    c.lineWidth = w2 * 0.1
    c.stroke()
  }
}

function drawArm(c: CanvasRenderingContext2D, s: Skin, sx: number, sy: number, a1: number, a2: number, near: boolean, reach = 1) {
  const j = joint(sx, sy, a1, UPPER * reach, a2, FORE * reach)
  const dx = Math.sin(rad(a2))
  const dy = Math.cos(rad(a2))
  const ux = Math.sin(rad(a1))
  const uy = Math.cos(rad(a1))
  const coat = near ? s.coat : s.coatS
  // kol: omuzda dolgun (kabarık kol başı), bileğe doğru incelir; dirsek yumuşak bükülür
  limb(c, sx, sy, j.kx, j.ky, j.ex, j.ey, 9.4, 7.8, coat)
  // kol ağzı: bileği saran biraz geniş manşet (koyu bant)
  if (near) {
    stroke(c, [j.ex - dx * 2.2, j.ey - dy * 2.2, j.ex + dx * 0.2, j.ey + dy * 0.2], 8.4, s.coatS)
    // ışığa bakan kenarda vurgu, kol başında parlama
    stroke(c, [sx - 1.5, sy - 0.6, j.kx - 1.4, j.ky - 0.7, j.ex - 1.2 - dx * 3, j.ey - 0.8 - dy * 3], 1.5, s.coatL, false)
    // dirsek büzgüsü: içte üç kısa kıvrım (bükülünce derinleşir)
    const bend = Math.min(1, Math.abs(a2 - a1) / 70)
    const kx = j.kx
    const ky = j.ky
    fine(c, kx - dy * 2.8, ky + dx * 2.8 - 0.4, kx + 0.4, ky + 0.8, kx + dy * 2.6, ky - dx * 2.6 + 0.6, 0.8, s.coatS)
    fine(c, kx - dy * 2.2 + dx * 2.6, ky + dx * 2.2 + dy * 2.6, kx + dx * 3.4, ky + dy * 3.6, kx + dy * 2 + dx * 2.8, ky - dx * 2 + dy * 2.8, 0.7, s.coatS)
    if (bend > 0.25) fine(c, kx - ux * 2.6 - uy * 2.2, ky - uy * 2.6 + ux * 2.2, kx - ux * 1.4, ky - uy * 1.2, kx - ux * 2.4 + uy * 2.2, ky - uy * 2.4 - ux * 2.2, 0.65, s.coatS)
    // manşette dikiş
    fine(c, j.ex - dx * 0.9 - dy * 3.4, j.ey - dy * 0.9 + dx * 3.4, j.ex - dx * 0.6, j.ey - dy * 0.6, j.ex - dx * 0.9 + dy * 3.4, j.ey - dy * 0.9 - dx * 3.4, 0.55, 'rgba(255,240,214,0.35)')
  }
  // el: bileğin ucunda yumuk avuç (eldiven biçimi), öne bakan ayrık başparmak, parmak boğumu çizgisi
  const sk = near ? s.skin : s.skinS
  const px = j.ex + dx * 3
  const py = j.ey + dy * 3
  const tx = px + dy * 2.5 - dx * 0.9
  const ty = py - dx * 2.5 - dy * 0.9
  const ang = Math.atan2(dy, dx)
  c.beginPath()
  c.ellipse(px, py, 3.5, 2.9, ang, 0, TAU)
  c.moveTo(tx + 1.8, ty)
  c.ellipse(tx, ty, 1.8, 1.2, ang - 0.5, 0, TAU)
  c.strokeStyle = edgeOf(sk)
  c.lineWidth = edgeW()
  c.stroke()
  c.fillStyle = sk
  c.fill()
  if (near) {
    // parmak boğumu (avucun ucunda kısa kavis) ve elin sırtında ışık
    fine(c, px + dx * 1.3 + dy * 1.4, py + dy * 1.3 - dx * 1.4, px + dx * 2.4, py + dy * 2.4, px + dx * 1.2 - dy * 2, py + dy * 1.2 + dx * 2, 0.7, s.skinS)
    fine(c, px - dx * 1.6 - dy * 1.6, py - dy * 1.6 + dx * 1.6, px - dy * 2.2, py + dx * 2.2, px + dx * 1.4 - dy * 1.8, py + dy * 1.4 + dx * 1.8, 0.8, GLINT)
  }
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
    case 'cicekli': {
      // beş yapraklı küçük çiçekler, ortaları sıcak sarı; satır satır kayar
      const ctr: number[] = []
      for (let y = y0 + sp * 0.7, r = 0; y < y0 + h + sp; y += sp * 1.25, r++)
        for (let x = x0 + (r % 2 ? sp * 0.75 : 0); x < x0 + w + sp; x += sp * 1.5) {
          for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + (i * TAU) / 5 + r * 0.3
            const px = x + Math.cos(a) * 1.05 * u
            const py = y + Math.sin(a) * 1.05 * u
            c.moveTo(px + 0.75 * u, py)
            c.arc(px, py, 0.75 * u, 0, TAU)
          }
          ctr.push(x, y)
        }
      c.fillStyle = col
      c.fill()
      c.beginPath()
      for (let i = 0; i < ctr.length; i += 2) {
        c.moveTo(ctr[i] + 0.55 * u, ctr[i + 1])
        c.arc(ctr[i], ctr[i + 1], 0.55 * u, 0, TAU)
      }
      c.fillStyle = '#f6c84e'
      c.fill()
      break
    }
    case 'kalpli':
      // küçük kalpler: satır satır kayar
      for (let y = y0 + sp * 0.6, r = 0; y < y0 + h + sp; y += sp * 1.25, r++)
        for (let x = x0 + (r % 2 ? sp * 0.75 : 0); x < x0 + w + sp; x += sp * 1.5) {
          const k = 1.55 * u
          c.moveTo(x, y + k * 0.95)
          c.bezierCurveTo(x - k * 1.5, y + k * 0.1, x - k * 1.1, y - k, x, y - k * 0.35)
          c.bezierCurveTo(x + k * 1.1, y - k, x + k * 1.5, y + k * 0.1, x, y + k * 0.95)
        }
      c.fillStyle = col
      c.fill()
      break
  }
  c.restore()
}

function drawTorso(c: CanvasRenderingContext2D, s: Skin, x: number, y: number, turn = 0) {
  // ceket: omuzdan bele hafif daralan yuvarlak gövde, göğüs biraz önde; etek kalçada hafifçe açılır.
  // turn: göğsün dönüşü (yakın omuz öne +): ön kenar ve önteki ayrıntılar (fermuar, yaka, cep) kayar
  const f = turn * 1.3
  const body = () => {
    c.moveTo(x - 8.5, y - 25)
    c.quadraticCurveTo(x + f * 0.5, y - 28.5, x + 8.5 + f * 0.6, y - 25)
    c.quadraticCurveTo(x + 12.6 + f, y - 14, x + 10.4 + f * 0.6, y + 0.6)
    c.quadraticCurveTo(x + 10.9, y + 2.2, x + 10.2, y + 2.4)
    c.quadraticCurveTo(x, y + 4, x - 10.4, y + 2)
    c.quadraticCurveTo(x - 11, y + 1, x - 10.2, y - 0.2)
    c.quadraticCurveTo(x - 11.8 - f * 0.4, y - 12, x - 8.5, y - 25)
    c.closePath()
  }
  blob(c, body, s.coat, { color: s.coatS, dx: -3.2, dy: -1 })
  if (s.pat && s.patC) drawPattern(c, s.pat, s.patC, x - 12, y - 29, 25, 34, 1, body)
  const zx = x + f
  // gömlek açıklığı ve yaka
  c.beginPath()
  c.moveTo(zx + 1.5, y - 25)
  c.lineTo(zx + 7.5, y - 25)
  c.lineTo(zx + 5.5, y - 12)
  c.closePath()
  c.fillStyle = s.shirt
  c.fill()
  c.strokeStyle = line()
  c.lineWidth = inkW * 0.45
  c.lineJoin = 'round'
  c.stroke()
  // ön kapama: yakadan eteğe inen fermuar (ince hat + çekeceği)
  fine(c, zx + 5.5, y - 12, zx + 6.8, y - 5, zx + 5.8, y + 2.4, inkW * 0.3, line())
  c.setLineDash(SEAM_DASH)
  fine(c, zx + 4.7, y - 11.6, zx + 5.9, y - 5, zx + 5, y + 1.8, 0.5, s.coatS)
  c.setLineDash(NO_DASH)
  stroke(c, [zx + 6.4, y - 11.4, zx + 6.9, y - 9.2], 1, '#d8d2c4', false)
  // dik yaka: boynu saran kalkık kenar
  blob(
    c,
    () => {
      c.moveTo(x - 6.5, y - 26.6)
      c.quadraticCurveTo(x, y - 30.4, x + 7.4 + f * 0.5, y - 26.4)
      c.lineTo(x + 7.8 + f * 0.5, y - 23.6)
      c.quadraticCurveTo(x, y - 26.4, x - 6.8, y - 23.8)
    },
    s.coat,
    { color: s.coatS, dx: 0, dy: -1.4 },
  )
  // yan cep: kapaklı, dikişli
  const px = x + f * 0.6
  blob(
    c,
    () => {
      c.moveTo(px - 7.4, y - 10.4)
      c.lineTo(px - 0.6, y - 10.6)
      c.lineTo(px - 1, y - 8.4)
      c.quadraticCurveTo(px - 4, y - 7.4, px - 7.2, y - 8.2)
    },
    s.coat,
    { color: s.coatS, dx: 0, dy: -1 },
  )
  fine(c, px - 7.4, y - 6.6, px - 4, y - 3.8, px - 0.8, y - 6.6, 0.6, s.coatS)
  // etek ucu: ribanalı bant (kumaş dokusu)
  c.save()
  c.beginPath()
  body()
  c.clip()
  c.fillStyle = 'rgba(40,20,50,0.16)'
  c.fillRect(x - 13, y - 2, 27, 7)
  c.beginPath()
  for (let i = -8; i <= 8; i += 2) {
    c.moveTo(x + i, y - 1.6)
    c.lineTo(x + i + 0.2, y + 3)
  }
  c.strokeStyle = 'rgba(40,20,50,0.18)'
  c.lineWidth = 0.5
  c.stroke()
  c.restore()
  // etek dikişi; kapitone montta (Uktun) iki dilim dikişi
  fine(c, x - 9, y - 1.2, x - 1, y + 1, x + 5.8, y - 0.4, 0.9, s.coatS)
  if (s.quilt) {
    fine(c, x - 10.2, y - 8.6, x - 2, y - 6.4, x + 5.8 + f * 0.6, y - 8, 0.9, s.coatS)
    fine(c, x - 10.4, y - 16, x - 2, y - 14, x + 5.4 + f * 0.6, y - 15.4, 0.9, s.coatS)
    // dilimlerin kabarığında ışık
    fine(c, x - 8.6, y - 12.6, x - 4, y - 11.6, x + 0.6, y - 12, 0.9, 'rgba(255,240,200,0.32)')
    fine(c, x - 8.4, y - 5.2, x - 4, y - 4.2, x + 0.6, y - 4.6, 0.9, 'rgba(255,240,200,0.28)')
  }
  // kumaş kıvrımları: koltuk altından bele inen çekme kıvrımı, sırtta bel büzgüsü, etekte iki kısa kırışık
  fine(c, x + 2.6 + f * 0.4, y - 21.4, x + 1.4, y - 17, x + 3.2 + f * 0.3, y - 13.4, 0.75, s.coatS)
  fine(c, x - 9.6, y - 6.4, x - 7.8, y - 5.2, x - 6.6, y - 6.8, 0.75, s.coatS)
  fine(c, x - 10, y - 3.8, x - 8.4, y - 2.8, x - 7, y - 3.6, 0.7, s.coatS)
  fine(c, x + 8.2 + f * 0.5, y - 6, x + 9.2 + f * 0.6, y - 3.6, x + 8.6 + f * 0.5, y - 1.4, 0.7, s.coatS)
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
  c.strokeStyle = edgeOf(s.scarf)
  c.lineWidth = edgeW() * 0.94
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
  c.strokeStyle = edgeOf(s.scarf)
  c.lineWidth = edgeW()
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
    c.lineWidth = 1.3
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
    c.lineWidth = 1.2
    c.stroke()
    return
  }
  // küçük badem göz (videodaki gibi sade): koyu iris, minik parıltı, ince üst kapak. Şaşkında iri ve yuvarlak,
  // neşelide biraz dolgun; bakış irisi göz içinde kaydırır
  const rx = w * (ex === 'saskin' ? 0.66 : 0.56)
  const ry = happy ? 2.8 : ex === 'saskin' ? 3 : 2.6
  const gx = w * 0.12 + gaze * w * 0.22
  c.beginPath()
  c.ellipse(x + gx, y + 0.2, rx, ry, 0, 0, TAU)
  c.fillStyle = s.iris
  c.fill()
  c.beginPath()
  c.ellipse(x + gx + rx * 0.12, y + 0.35, rx * 0.66, ry * 0.7, 0, 0, TAU)
  c.fillStyle = INK
  c.fill()
  // iki parıltı: büyüğü sol üstte (ışık), küçüğü sağ altta; göz canlı ve sevimli durur
  c.beginPath()
  c.arc(x + gx - rx * 0.28, y - ry * 0.3, Math.max(0.5, rx * 0.42), 0, TAU)
  c.moveTo(x + gx + rx * 0.42 + Math.max(0.3, rx * 0.17), y + ry * 0.42)
  c.arc(x + gx + rx * 0.42, y + ry * 0.42, Math.max(0.3, rx * 0.17), 0, TAU)
  c.fillStyle = '#ffffff'
  c.fill()
  // uykulu ve kurnaz bakış: üst kapak gözün yarısına (kurnazda üçte birine) iner
  if (ex === 'uykulu' || ex === 'kurnaz') {
    const ly = y - ry + ry * (ex === 'uykulu' ? 1.1 : 0.7)
    c.save()
    c.beginPath()
    c.ellipse(x + gx, y + 0.2, rx + 0.5, ry + 0.5, 0, 0, TAU)
    c.clip()
    c.beginPath()
    c.rect(x - w - 2, y - ry - 4, w * 2 + 4, ly - (y - ry - 4))
    c.fillStyle = s.skin
    c.fill()
    c.restore()
    c.beginPath()
    c.moveTo(x + gx - rx - 0.8, ly + 0.3)
    c.quadraticCurveTo(x + gx, ly + 1, x + gx + rx + 0.8, ly)
    c.strokeStyle = INK
    c.lineWidth = 1.1
    c.stroke()
    return
  }
  // üst kapak: gözün üstünde ince yay; kadında dış uçta kısa kirpik
  c.beginPath()
  c.moveTo(x + gx - rx - 0.7, y - ry * 0.25)
  c.quadraticCurveTo(x + gx, y - ry - (happy ? 1.6 : 1.1), x + gx + rx + 0.7, y - ry * 0.35)
  if (lash) {
    c.moveTo(x + gx - rx - 0.7, y - ry * 0.25)
    c.lineTo(x + gx - rx - 1.9, y - ry * 0.75)
  }
  c.strokeStyle = INK
  c.lineWidth = 1.3
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
    fine(c, hx - 16.4, hy + 6, hx - 16.6 - sw * 0.9, hy + 15 - up * 0.3, hx - 17.5 - sw * 1.5, hy + 23.5 - up * 0.6, inkW * 0.3, line())
    fine(c, hx - 10.4, hy + 10, hx - 10.2 - sw * 0.7, hy + 17 - up * 0.3, hx - 11 - sw, hy + 24 - up * 0.5, inkW * 0.3, line())
    fine(c, hx - 13.4, hy - 4, hx - 14 - sw * 0.4, hy + 6, hx - 13.4 - sw * 0.9, hy + 14 - up * 0.2, 0.9, s.hairS)
    sheen(c, hx - 19, hy - 9, hx - 21.4 - sw * 0.6, hy + 4, hx - 20.2 - sw * 1.3, hy + 17 - up * 0.4, 4.4, s.hairL)
    sheen(c, hx - 9, hy + 2, hx - 8.6 - sw * 0.6, hy + 12, hx - 8.8 - sw, hy + 21 - up * 0.4, 3, s.hairL)
    fine(c, hx - 20, hy - 7, hx - 22.4 - sw * 0.6, hy + 5, hx - 21.4 - sw * 1.3, hy + 16 - up * 0.4, 1.9, s.hairL)
    fine(c, hx - 13.8 - sw * 0.5, hy + 12 - up * 0.2, hx - 14.2 - sw * 1.1, hy + 20 - up * 0.5, hx - 15.4 - sw * 1.6 - tp * 0.6, hy + 28 - up * 0.8, 0.9, s.hairL)
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
  // göz kırpan: yakın göz gülerek kapanır, uzak göz açık
  eye(c, s, hx + 5, hy + 1.4, 3.3, shut, happy, fem, ex === 'gozkirp' ? 'sevecen' : ex, gaze)
  eye(c, s, hx + 13.3, hy + 1.1, 2.3, shut, happy, false, ex, gaze)
  // kaşlar: gözün epey üstünde ve yukarı kavisli (yüz yumuşak ve meraklı baksın); buruna bakan uç dolgun
  const th = fem ? 0.8 : s.beard ? 1.25 : 1.05
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
  } else if (ex === 'kararli') {
    // kararlı: kaşlar düz ve biraz alçak, iç uç hafif iner ama gözün epey üstünde kalır (dostça)
    brow(c, hx + 0.9, hy - 6.6, hx + 4.6, hy - 8.6, hx + 8.5, hy - 7.2, th * 1.1, s.brow)
    brow(c, hx + 16, hy - 7.6, hx + 13.9, hy - 9, hx + 11.5, hy - 7.6, th, s.brow)
  } else if (ex === 'gozkirp') {
    // göz kırpan: kapanan gözün kaşı yumuşakça iner, öbürü kalkar
    brow(c, hx + 0.9, hy - 5.8, hx + 4.6, hy - 9.4, hx + 8.5, hy - 7.6, th, s.brow)
    brow(c, hx + 16.2, hy - 8.6, hx + 13.9, hy - 12.4, hx + 11.5, hy - 9.8, th * 0.9, s.brow)
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
    c.strokeStyle = edgeOf(s.skin)
    c.lineWidth = edgeW()
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
  } else if (ex === 'kararli') {
    // kararlı: kapalı, kendinden emin kısa gülüş; uzak köşe biraz kalkık
    c.beginPath()
    c.moveTo(hx + 8.4, hy + 10.6)
    c.quadraticCurveTo(hx + 11, hy + 12, hx + 13.8, hy + 9.8)
    c.strokeStyle = s.beard ? '#e8b8a0' : fem ? '#b8384e' : '#8e3a3c'
    c.lineWidth = 1.5
    c.lineCap = 'round'
    c.stroke()
    fine(c, hx + 13.8, hy + 9.8, hx + 14.6, hy + 10.4, hx + 14.4, hy + 11.4, 0.8, s.skinS)
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
    const wide = ex === 'sevecen' || ex === 'gozkirp' ? 1.7 : 0
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
    fine(c, hx + 1.2, hy - 14.6, hx - 1.6, hy - 20, hx - 8.6, hy - 22.8, inkW * 0.3, line())
    fine(c, hx + 11.4, hy - 13.8, hx + 12.6, hy - 17.6, hx + 10, hy - 21, inkW * 0.3, line())
    fine(c, hx - 9.6, hy - 9, hx - 12.4, hy - 6, hx - 13.4, hy - 1.6, 0.9, s.hairS)
    sheen(c, hx - 14.4, hy - 6, hx - 11.6, hy - 19, hx + 1, hy - 21.6, 5, s.hairL)
    sheen(c, hx + 4.6, hy - 21, hx + 11, hy - 20, hx + 14.6, hy - 15.4, 3.4, s.hairL)
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
    } else if (front === 'wave') {
      drawWave(c, s, hx, hy)
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
      fine(c, hx + 7.6, hy - 24.2, hx + 6.6, hy - 20.4, hx + 2.6, hy - 18.4, inkW * 0.3, line())
      fine(c, hx + 14.8, hy - 21.8, hx + 13.6, hy - 18.4, hx + 10, hy - 16.6, inkW * 0.3, line())
      fine(c, hx + 7, hy - 12.2, hx + 6.4, hy - 14.6, hx + 4, hy - 15.8, 0.9, s.hairS)
      sheen(c, hx - 2, hy - 21, hx + 2.6, hy - 24.6, hx + 6, hy - 22.6, 3.6, s.hairL)
      fine(c, hx - 0.6, hy - 22, hx + 2.6, hy - 25.6, hx + 5.4, hy - 23.8, 1.5, s.hairL)
      fine(c, hx + 9.4, hy - 23.4, hx + 12, hy - 24.6, hx + 13.4, hy - 22, 1.3, s.hairL)
      if (front === 'short') c.restore()
    }
    if (front !== 'buzz') {
      sheen(c, hx - 14.6, hy - 4, hx - 12.8, hy - 16, hx - 3, hy - 19.4, 4.6, s.hairL)
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
    c.strokeStyle = edgeOf(s.skin)
    c.lineWidth = edgeW()
    c.stroke()
    c.fillStyle = s.skin
    c.fill()
    fine(c, hx - 10.4, hy - 0.2, hx - 8, hy + 1.2, hx - 9.6, hy + 3.4, 0.9, s.skinS)
  }
  if (kit.face === 'gozluk') drawGlasses(c, hx, hy)
  if (kit.face === 'gunes') drawShades(c, hx, hy)
  if (kit.face !== 'yok') {
    const hf = heroHead(hx, hy)
    // sakallı yüzde yanak parçası sakalın üstüne çıkar
    if (s.trim || s.beard) hf.beard = true
    drawFaceItem(c, kit.face, hf, { t, moving, hair, lift })
  }
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
  fine(c, hx - 10.4, hy - 23, hx - 9.4, hy - 19.6, hx - 6.6, hy - 18, inkW * 0.3, line())
  fine(c, hx - 1.6, hy - 25.6, hx - 0.8, hy - 21.6, hx + 2, hy - 19.4, inkW * 0.3, line())
  fine(c, hx + 8, hy - 25, hx + 8.4, hy - 21, hx + 10.6, hy - 18.6, inkW * 0.3, line())
  fine(c, hx + 15.6, hy - 21, hx + 14.6, hy - 17.4, hx + 12, hy - 16, inkW * 0.3, line())
  fine(c, hx - 15, hy - 9, hx - 14.4, hy - 16, hx - 9.6, hy - 21, 2, s.hairL)
  fine(c, hx - 4.6, hy - 22.6, hx - 1, hy - 26, hx + 1.4, hy - 28.6, 1.4, s.hairL)
  fine(c, hx + 5.4, hy - 23.4, hx + 9, hy - 24.4, hx + 12.2, hy - 26.4, 1.2, s.hairL)
}

/** kısa dalgalı: tepede yuvarlak dalgalar, öne doğru kıvrılıp alnın üstünde biten bir bukle; yanlar kısa */
function drawWave(c: CanvasRenderingContext2D, s: Skin, hx: number, hy: number) {
  blob(
    c,
    () => {
      c.moveTo(hx - 15.5, hy + 4)
      c.quadraticCurveTo(hx - 20.4, hy - 2, hx - 18.8, hy - 8)
      c.quadraticCurveTo(hx - 22.8, hy - 13, hx - 18.6, hy - 18.4)
      c.quadraticCurveTo(hx - 17.4, hy - 25.4, hx - 10, hy - 24.8)
      c.quadraticCurveTo(hx - 5, hy - 29.6, hx + 1, hy - 25.8)
      c.quadraticCurveTo(hx + 7, hy - 29.2, hx + 11.6, hy - 24.6)
      c.quadraticCurveTo(hx + 18.2, hy - 24.4, hx + 18.8, hy - 18)
      // öne kıvrılan bukle: ucu içe döner, kaşın üstünde kalır
      c.quadraticCurveTo(hx + 22, hy - 13.6, hx + 18.8, hy - 10.4)
      c.quadraticCurveTo(hx + 17.2, hy - 8.8, hx + 15.2, hy - 10.4)
      c.quadraticCurveTo(hx + 13.4, hy - 12.8, hx + 10.2, hy - 11.6)
      c.quadraticCurveTo(hx + 6, hy - 14.4, hx + 2, hy - 12.4)
      c.quadraticCurveTo(hx - 2, hy - 12.6, hx - 4, hy - 8)
      c.quadraticCurveTo(hx - 6, hy - 4, hx - 7, hy - 1)
      c.lineTo(hx - 7.2, hy + 5)
      c.quadraticCurveTo(hx - 11, hy + 7, hx - 15.5, hy + 4)
    },
    s.hair,
    { color: s.hairS, dx: -2.8, dy: -2.2 },
  )
  // dalga araları (S kıvrımlı koyu tel) ve dalga sırtlarında ışık
  fine(c, hx - 10, hy - 24.8, hx - 8.6, hy - 20, hx - 11.6, hy - 15.6, inkW * 0.3, line())
  fine(c, hx + 1, hy - 25.8, hx + 2.4, hy - 21, hx - 0.6, hy - 16.8, inkW * 0.3, line())
  fine(c, hx + 11.6, hy - 24.6, hx + 12.6, hy - 19.4, hx + 10, hy - 15.4, inkW * 0.3, line())
  fine(c, hx + 18.8, hy - 18, hx + 16, hy - 15.6, hx + 16.2, hy - 12.4, 0.9, s.hairS)
  fine(c, hx - 17.6, hy - 11, hx - 14.4, hy - 13.4, hx - 13.6, hy - 9, 0.9, s.hairS)
  fine(c, hx - 15.4, hy - 6, hx - 15.6, hy - 14.6, hx - 12.4, hy - 20.6, 2, s.hairL)
  fine(c, hx - 7.6, hy - 24.4, hx - 4.6, hy - 27, hx - 1.4, hy - 26, 1.6, s.hairL)
  fine(c, hx + 3.6, hy - 25.8, hx + 6.6, hy - 27.6, hx + 9.6, hy - 25.8, 1.4, s.hairL)
  fine(c, hx + 14.6, hy - 22.4, hx + 17.4, hy - 21, hx + 18.6, hy - 17.6, 1.2, s.hairL)
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
  fine(c, hx - 3, hy - 24.6, hx - 8.6, hy - 22, hx - 11.4, hy - 17.4, inkW * 0.34, line())
  fine(c, hx - 6.4, hy - 18, hx + 4, hy - 22.6, hx + 15.6, hy - 16.4, 0.9, s.hairS)
  fine(c, hx - 3.6, hy - 14.4, hx + 6, hy - 18.4, hx + 16.6, hy - 12.4, 0.9, s.hairS)
  fine(c, hx + 14.4, hy - 12.4, hx + 14.6, hy - 16, hx + 11.6, hy - 19, inkW * 0.3, line())
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
  c.strokeStyle = edgeOf(s.skin)
  c.lineWidth = edgeW()
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
      fine(c, hx + 17, hy - 13, hx + 13, hy - 12.6, hx + 9, hy - 12.9, inkW * 0.3, line())
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
  fine(c, -12.4, 5, -6, 5.8, 1.4, 5.2, inkW * 0.32, line())
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
/** Haritacının harita tüpü: sırtta çapraz, kapakları koyu deri; omuzun üstünden ucu görünür */
function drawTube(c: CanvasRenderingContext2D, tx: number, ty: number, sw: number) {
  c.save()
  c.translate(tx - 8, ty - 15)
  c.rotate(-0.55 + sw * 0.02)
  blob(c, () => c.roundRect(-2.8, -26, 5.6, 38, 2.4), '#d7a25e', { color: '#a8743c', dx: -1.6, dy: 0 })
  blob(c, () => c.roundRect(-3.3, -27.4, 6.6, 4.4, 1.6), '#7a4a2a', { color: '#52301a', dx: -1.2, dy: -0.8 })
  blob(c, () => c.roundRect(-3.3, 9, 6.6, 4, 1.6), '#7a4a2a', { color: '#52301a', dx: -1.2, dy: -0.8 })
  stroke(c, [-2.6, -8, 2.6, -8], 0.7, '#a8743c', false)
  stroke(c, [-1.2, -20, -1.2, 6], 0.7, GLINT, false)
  c.restore()
}

/** çantanın göğüsten geçen askısı */
function drawRoleStrap(c: CanvasRenderingContext2D, tx: number, ty: number, col: string) {
  stroke(c, [tx - 6.5, ty - 25, tx + 1, ty - 15, tx + 8.4, ty - 4.4], 1.5, col)
}

/** Telefoncunun omuz çantası: kalçada, kapaklı, tokalı; askı karşı omuzdan çapraz iner */
function drawSatchel(c: CanvasRenderingContext2D, tx: number, ty: number, sw: number) {
  stroke(c, [tx + 6.2, ty - 25, tx - 1, ty - 14, tx - 7, ty - 5], 1.5, '#5a3418')
  c.save()
  c.translate(tx - 7.4, ty - 4 + Math.abs(sw) * 0.4)
  c.rotate(sw * 0.05)
  blob(c, () => c.roundRect(-5.6, -3.6, 10.4, 8.4, 2.2), '#9a6234', { color: '#6c3e1e', dx: -1.6, dy: -1.6 })
  blob(
    c,
    () => {
      c.moveTo(-5.8, -3.8)
      c.lineTo(5, -3.8)
      c.lineTo(5, 0.6)
      c.quadraticCurveTo(-0.4, 2.6, -5.8, 0.6)
    },
    '#7e4c26',
    { color: '#5a3418', dx: 0, dy: -1 },
  )
  blob(c, () => c.roundRect(-1.2, 0.2, 2.4, 2.2, 0.6), '#e4c060', { color: '#a88830', dx: -0.6, dy: -0.6 })
  c.setLineDash(SEAM_DASH)
  stroke(c, [-4.8, 3.8, 4, 3.8], 0.45, 'rgba(255,226,180,0.5)', false)
  c.setLineDash(NO_DASH)
  c.restore()
}

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
  const wasSoft = soft
  soft = painted
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
  // göğüs dönüşü: yakın omuz öne gelince uzak omuz geride kalır (koşuda adımın tersine)
  const tw = pose.twist ?? 0
  // baş: gövde eğilince yüz ileriye bakmayı sürdürür (yürürken başın gecikmeli sallanışı pozun `head`inde)
  const nod = -tilt * 0.45 + (pose.head ?? 0)
  /** üst gövde kalçadan eğilir; bacaklar eğilmez */
  const upper = () => {
    c.translate(hipX, hipY)
    c.rotate(tilt)
    c.translate(-hipX, -hipY)
  }
  if (pose.ground) {
    // temas gölgesi: yerde, ayakların altında
    // temas gölgesi: üç iç içe elips, kenarı yumuşak
    c.fillStyle = CONTACT
    for (let i = 0; i < 3; i++) {
      c.beginPath()
      c.ellipse(lean * 0.5, -0.4, 16 - i * 3.4, 3 - i * 0.6, 0, 0, TAU)
      c.fill()
    }
  }
  // uzak kol ve bacak önce, gövde, yakın bacak, atkı, kafa, yakın kol (pelerin hepsinin arkasında)
  c.save()
  upper()
  if (kit.back === 'pelerin') drawCape(c, tx, ty + breath, t, opts.flow ?? (moving ? 1 : 0), lift)
  drawArm(c, s, tx - 4 + twist(fa[0]) - tw * 2.4, sY + Math.abs(tw) * 0.4, fa[0], fa[1], false, armReach(pose, 0))
  c.restore()
  drawLeg(c, s, hipX - 2.5, hipY, fl[0], fl[1], false, footOf(pose, 0))
  drawLeg(c, s, hipX + 2, hipY, nl[0], nl[1], true, footOf(pose, 1))
  c.save()
  upper()
  if (s.prop === 'staff') {
    // çoban değneği: arkada, yere basar
    stroke(c, [tx - 15, ty - 44, tx - 13.5, -1.5], 2.6, '#6a4a2e')
    stroke(c, [tx - 15, ty - 44, tx - 11, ty - 48, tx - 8.5, ty - 44.5], 2.6, '#6a4a2e')
    stroke(c, [tx - 15.6, ty - 40, tx - 14.5, ty - 12], 0.9, '#9a744a', false)
  }
  // çanta ve tüp: koşarken adımla birlikte sallanır (yakın uyluğun tersine), dururken ağır ağır, havada savrulmayla
  const bagSw = moving && pose.ground ? (pose.sway ?? -nl[0] * 0.028) : Math.sin(t * 2.2) * 0.3 + (pose.ground ? 0 : lift * 2)
  if (kit.back === 'heybe') drawBag(c, tx, ty, bagSw)
  if (kit.back === 'saz') drawBackSaz(c, tx, ty, bagSw)
  drawHeroBack(c, kit.back, tx, ty, t, bagSw, opts.flow ?? (moving ? 1 : 0), lift)
  const role = kit.back === 'yok' ? s.role : undefined
  if (role === 'tube') drawTube(c, tx, ty, bagSw)
  drawTorso(c, s, tx, ty, tw)
  if (role === 'tube') drawRoleStrap(c, tx, ty, '#6a3e24')
  if (role === 'satchel') drawSatchel(c, tx, ty, bagSw)
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
  c.scale(HEAD_K, HEAD_K)
  c.translate(-(tx + 1), -(ty - 28))
  drawHead(c, s, tx + 1, ty, !!pose.blink, pose.hair ?? 0, lift, t, moving, pose.mood === 'happy', kit, pose.gaze ?? 0, pose.mouth)
  c.restore()
  drawArm(c, s, tx + 4 + twist(na[0]) + tw * 2.8, sY, na[0], na[1], true, armReach(pose, 1))
  c.restore()
  c.restore()
  soft = wasSoft
}

/**
 * Sırt eşyası tek başına (Mağaza döner sahnesi, heroTurn.ts): oyundaki yan çizimin aynısı, gövdesiz. `back` sırta
 * takılan kısım (pelerin, heybe, bağlama, sırt aksesuarı ya da rol eşyası), `front` askı ve öne düşen kısım.
 */
export function drawBackGear(c: CanvasRenderingContext2D, look: Look, kit: Kit, part: 'back' | 'front', tx: number, ty: number, t: number, sw: number, flow: number, lift: number) {
  const wasSoft = soft
  soft = painted
  const role = kit.back === 'yok' ? LOOKS[look].role : undefined
  if (part === 'back') {
    if (kit.back === 'pelerin') drawCape(c, tx, ty, t, flow, lift)
    if (kit.back === 'heybe') drawBag(c, tx, ty, sw)
    if (kit.back === 'saz') drawBackSaz(c, tx, ty, sw)
    drawHeroBack(c, kit.back, tx, ty, t, sw, flow, lift)
    if (role === 'tube') drawTube(c, tx, ty, sw)
  } else {
    if (role === 'tube') drawRoleStrap(c, tx, ty, '#6a3e24')
    if (role === 'satchel') drawSatchel(c, tx, ty, sw)
    if (kit.back === 'heybe') drawStrap(c, tx, ty)
    if (kit.back === 'saz') drawSazStrap(c, tx, ty)
    drawHeroBackFront(c, kit.back, tx, ty)
  }
  soft = wasSoft
}

/** Yürüme / koşu döngüsünün pozu, yeni nesne döner (föy ve önizleme); kare içinde `gaitInto` (anahtar pozlar orada) */
export function gait(phase: number, speed = 1): Pose {
  return gaitInto(newPose(), phase, speed)
}

/** Boş poz: kare başına ayırmamak için çağıranın tuttuğu, her karede üstüne yazılan tampon */
export function newPose(): Pose {
  return { legs: [[0, 0], [0, 0]], arms: [[0, 0], [0, 0]], lean: 0, tilt: 0, bob: 0, hair: 0, lift: 0, ground: true, reach: 1, head: 0, gaze: 0, twist: 0, blink: false, mouth: undefined, mood: undefined, feet: [0, 0], sway: undefined }
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
  out.twist = src.twist ?? 0
  out.blink = !!src.blink
  out.mouth = src.mouth
  out.mood = src.mood
  out.sway = src.sway
  const f = out.feet ?? (out.feet = [0, 0])
  const f0 = footOf(src, 0)
  f[1] = footOf(src, 1)
  f[0] = f0
  return out
}

/** koşu tarzı ayarları: adım boyu, diz, kol salınımı, dirsek, eğim, sekme, ön eğim, tek kol */
interface RunCfg {
  stride: number
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
  normal: { stride: 1, knee: 1, swing: 1, elbow: 1, tilt: 0, hop: 1, lean: 0 },
  // sportif: uzun adım, yüksek diz, dirsekler 90 derece bükük ve güçlü kol salınımı, gövde öne eğik
  sportif: { stride: 1.2, knee: 1.3, swing: 1.22, elbow: 1.5, tilt: 0.05, hop: 1.5, lean: 0.8 },
  // tırıs: kısa, sık adımlar (adım boyu yarısı: aynı yolda iki kat adım, ayak yerde kaymaz), dirsekler gövdeye yakın, yaylanan sekme
  tirisa: { stride: 0.5, knee: 0.7, swing: 0.5, elbow: 0.85, tilt: -0.02, hop: 1.8, lean: 0 },
  // tek omuz: gövde bir omzu öne verir, uzak kol göğse toplanır, yakın kol salınır
  omuz: { stride: 1, knee: 1, swing: 0.6, elbow: 1, tilt: 0.2, hop: 1, lean: 2.2, tuck: true },
  // ninja: gövde iyice öne eğik, iki kol da düz ve geride, uzun alçak adımlar
  ninja: { stride: 1.12, knee: 1.1, swing: 0, elbow: 1, tilt: 0.16, hop: 0.6, lean: 2.6, trail: true },
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const deg = (r: number) => (r * 180) / Math.PI

/**
 * Koşu döngüsünün bir turunda (iki adım) katedilen yol, çizim biriminde (100 = boy). Çağıran evreyi yoldan ilerletir:
 * evre += yol / strideLength. Yavaşta kısa (yürüyüş), tam koşuda uzun, nitroda daha uzun. Yerdeki ayak tam bu yolla
 * geriye kayar (`gaitInto` ayağı zemine kilitler), bu yüzden ayak yerde kaymaz.
 */
export function strideLength(speed: number, style?: string): number {
  const cfg = RUN_CFG[style ?? 'normal'] ?? RUN_CFG.normal
  const k = Math.max(0.3, Math.min(1.6, speed))
  return (62 + 82 * smooth(clamp01((k - 0.3) / 0.7))) * (1 + 0.35 * Math.max(0, k - 1)) * cfg.stride
}

/*
 * Yürüme ve koşu: elle yazılmış anahtar pozlar (Richard Williams, "Animator's Survival Kit").
 *
 * Döngü iki adımdır; evre 0'da yakın bacağın topuğu yere değer, 0,5'te uzak bacağınki. Bir adımın (yarım tur) gövdesi
 * dört pozla anlatılır, öbür adım aynısıdır (sol ve sağ yer değiştirir):
 *   yürüme  Contact → Down (yükü alır, en alçak) → Passing (öbür bacak geçer) → Up (parmak ucunda, en yüksek)
 *   koşu    Contact → Down (yük, diz derin) → Push-off (arka bacak uzanır, parmak iter) → Flight (iki ayak havada, en yüksek)
 * Zamanlama eşit değil: Down kısa ve serttir, Passing / Flight uzun. Anahtarlar arası Catmull-Rom (eşit olmayan aralıklı
 * Hermite): poz poza yumuşak akar, doğrusal değil.
 *
 * Yerdeki bacak ayrıca çözülür: ayak temas anından itişe dek zemine kilitlidir (topuk değer, taban oturur, topuk kalkar,
 * parmak ucundan döner); kalça yolla ilerlerken ayak tam `strideLength` kadar geriye kayar, bacak iki kemikli ters
 * kinematikle ayağa uzanır (diz önde). Kalça yüksekliği anahtarlardan gelir ama yerdeki bacağın boyunu aşamaz: bacak
 * yetişmezse kalça yumuşakça iner (ayak kaymaz, zemine gömülmez). Havadaki bacak itişte bıraktığı açıdan başlar,
 * kendi anahtar pozlarından geçip temas açısına varır.
 *
 * Kollar bacağın tersine, bir tık geriden salınır (dirsek önde bükük, arkada açık); göğüs kollarla döner; baş, atkı,
 * saç ve sırt eşyası gövdenin iniş çıkışını biraz geriden izler. Hız yürüme ve koşu tablolarını karıştırır.
 */

/** bir adımın gövde anahtarı. t: adım içindeki an (0 temas .. 1 öbür ayağın teması), d: kalça yüksekliği (çizim birimi, + yukarı, 0 dik duruş), tilt: üst gövdenin öne eğimi (radyan) */
interface StepKey {
  name: string
  t: number
  d: number
  tilt: number
}
/** yerdeki ayağın açısı. v: yerde kalma süresinin oranı (0 temas .. 1 itiş), a: derece (+ burun aşağı) */
interface FootKey {
  name: string
  v: number
  a: number
}
/** havadaki bacağın anahtarı. u: bacağın kendi evresi (0 temas, s itiş .. 1 yeniden temas), uyluk / diz bükümü / ayak (derece) */
interface SwingKey {
  name: string
  u: number
  thigh: number
  knee: number
  foot: number
}
/** yakın kolun anahtarı (yakın bacağın evresinde; uzak kol yarım tur geriden). upper: üst kol, fore: ön kol (mutlak açı, + ileri) */
interface ArmKey {
  name: string
  u: number
  upper: number
  fore: number
}
interface Cycle {
  /** yerde kalma oranı (bacak başına) */
  stance: number
  /** temas anında ayağın kalçanın önünde kaldığı pay (yerdeki yolun oranı) */
  front: number
  step: StepKey[]
  foot: FootKey[]
  swing: SwingKey[]
  arms: ArmKey[]
}

const WALK: Cycle = {
  stance: 0.62,
  front: 0.46,
  step: [
    // topuk önde yere değer, iki ayak da yerde: bacaklar açık olduğu için kalça biraz alçak
    { name: 'contact', t: 0, d: -2, tilt: 0.03 },
    // yükü alır: diz yumuşar, gövde çöker (kısa ve sert gelir)
    { name: 'down', t: 0.16, d: -3, tilt: 0.05 },
    // yerdeki bacak dikey, öbürü dizden bükük geçer
    { name: 'passing', t: 0.44, d: -0.8, tilt: 0.03 },
    // arka ayak parmak ucunda iter, gövde en yüksekte
    { name: 'up', t: 0.72, d: -0.2, tilt: 0.022 },
  ],
  foot: [
    { name: 'strike', v: 0, a: -20 },
    { name: 'flat', v: 0.16, a: 0 },
    { name: 'heel-off', v: 0.5, a: 0 },
    { name: 'toe-off', v: 1, a: 38 },
  ],
  swing: [
    // parmak kalkar, diz bükülerek öne toplanır
    { name: 'lift', u: 0.7, thigh: -6, knee: 50, foot: 30 },
    // ayak gövdenin altından yerden yüksekte geçer
    { name: 'passing', u: 0.79, thigh: 14, knee: 60, foot: 12 },
    // baldır öne savrulur
    { name: 'reach', u: 0.88, thigh: 28, knee: 30, foot: -4 },
    // bacak uzanır, topuk öne, burun kalkık
    { name: 'extend', u: 0.95, thigh: 26, knee: 7, foot: -14 },
  ],
  arms: [
    // yakın bacak önde basarken yakın kol geride, dirsek açık (en geriye temastan bir tık sonra varır)
    { name: 'back', u: 0.03, upper: -30, fore: -20 },
    { name: 'fall', u: 0.28, upper: -4, fore: 10 },
    // öbür bacak basarken kol önde, dirsek bükük
    { name: 'forward', u: 0.53, upper: 28, fore: 56 },
    { name: 'return', u: 0.78, upper: 2, fore: 16 },
  ],
}

// kalça iniş çıkışı boyun ~%6'sı, yürümede ~%4'ü (26 Kasım 2026; ~%9 iken koşarken karakter zıplıyor, ekran sallanıyor
// gibi görünüyordu: oyunlarda koşu sekmesi küçüktür)
const RUN: Cycle = {
  stance: 0.34,
  front: 0.42,
  step: [
    // ayak gövdenin biraz önünde, tabana yakın basar
    { name: 'contact', t: 0, d: -4, tilt: 0.15 },
    // yük: diz derin bükülür, gövde en alçakta ve biraz daha eğik (kısa, ağır)
    { name: 'down', t: 0.14, d: -5.6, tilt: 0.18 },
    // arka bacak dümdüz uzanır, parmak ucu iter, gövde yükselir
    { name: 'push-off', t: 0.62, d: -2, tilt: 0.15 },
    // iki ayak havada, en yüksek an; ön diz yukarı sürülür
    { name: 'flight', t: 0.84, d: 0.3, tilt: 0.14 },
  ],
  foot: [
    { name: 'strike', v: 0, a: -7 },
    { name: 'flat', v: 0.12, a: 0 },
    { name: 'heel-off', v: 0.3, a: 2 },
    { name: 'toe-off', v: 1, a: 52 },
  ],
  swing: [
    // öbür ayak basarken arka topuk kalçaya doğru kıvrılır
    { name: 'kick', u: 0.47, thigh: -24, knee: 92, foot: 52 },
    // topuk kalçanın altında, diz öne geçer
    { name: 'passing', u: 0.64, thigh: 16, knee: 128, foot: 36 },
    // diz yukarı sürülür, baldır sarkar
    { name: 'drive', u: 0.8, thigh: 54, knee: 98, foot: 14 },
    // baldır öne açılır; temastan önce bacak geri çekilir (pençe)
    { name: 'reach', u: 0.92, thigh: 44, knee: 38, foot: -2 },
  ],
  arms: [
    { name: 'back', u: 0.05, upper: -46, fore: -6 },
    { name: 'pass', u: 0.3, upper: -6, fore: 62 },
    // önde dirsek ~90 derece, el çene hizasına kalkar
    { name: 'forward', u: 0.55, upper: 48, fore: 140 },
    { name: 'pass2', u: 0.8, upper: 6, fore: 74 },
  ],
}

/** bacağın en uzun hâli (diz kilitlenmez: dümdüz bacak çizimde çubuk gibi durur) */
const REACH = THIGH + SHIN - 0.5
/** dümdüz bacakta kalçadan bileğe dikey: bilek zeminin (groundBob'un -4,5'i) bu kadar altında */
const LEG_Y = THIGH + SHIN
/** itişten sonra ve temastan önce kalçanın bacağa göre yumuşakça bırakıldığı / toplandığı evre payı */
const EDGE = 0.06

// karışık tablo, kare başına ayırmamak için sabit tamponlarda (tek iş parçacığı: gaitInto her çağrıda baştan doldurur)
const BT = new Float64Array(4)
const BD = new Float64Array(4)
const BTL = new Float64Array(4)
const FV = new Float64Array(4)
const FA = new Float64Array(4)
const AT = new Float64Array(4)
const AU = new Float64Array(4)
const AF = new Float64Array(4)
const SW_U = new Float64Array(4)
const SW_T = new Float64Array(4)
const SW_K = new Float64Array(4)
const SW_F = new Float64Array(4)
/** havadaki bacağın tam yolu: itiş, dört anahtar, temas */
const ST = new Float64Array(6)
const STH = new Float64Array(6)
const SKN = new Float64Array(6)
const SFT = new Float64Array(6)
const LEG_TMP: [number, number] = [0, 0]
/** çağrının karışık değerleri: yerde kalma oranı, tur yolu, temas anında bileğin önde kaldığı yol */
let gS = 0.5
let gStride = 100
let gA0 = 20

/** eşit olmayan aralıklı, döngüsel Catmull-Rom (Hermite): ts artan, ts[0] = 0, dönem 1 */
function cyc(ts: Float64Array, vs: Float64Array, x: number): number {
  const n = ts.length
  x -= Math.floor(x)
  let i = n - 1
  for (let j = 0; j < n - 1; j++)
    if (x < ts[j + 1]) {
      i = j
      break
    }
  const ip = (i + n - 1) % n
  const i1 = (i + 1) % n
  const i2 = (i + 2) % n
  const t0 = ts[i]
  const t1 = i + 1 < n ? ts[i1] : 1
  const tp = i > 0 ? ts[ip] : ts[ip] - 1
  const tn = i + 2 < n ? ts[i2] : ts[i2] + 1
  return hermite(x, tp, t0, t1, tn, vs[ip], vs[i], vs[i1], vs[i2])
}

/** açık uçlu Catmull-Rom (Hermite): uçlarda tek yönlü eğim */
function open(ts: Float64Array, vs: Float64Array, x: number): number {
  const n = ts.length
  if (x <= ts[0]) return vs[0]
  if (x >= ts[n - 1]) return vs[n - 1]
  let i = 0
  while (i < n - 2 && x >= ts[i + 1]) i++
  const ip = Math.max(0, i - 1)
  const i2 = Math.min(n - 1, i + 2)
  return hermite(x, ts[ip], ts[i], ts[i + 1], ts[i2], vs[ip], vs[i], vs[i + 1], vs[i2])
}

function hermite(x: number, tp: number, t0: number, t1: number, tn: number, vp: number, v0: number, v1: number, vn: number): number {
  const h = t1 - t0
  const s = (x - t0) / h
  const m0 = tp < t0 ? ((v1 - vp) / (t1 - tp)) * h : v1 - v0
  const m1 = tn > t1 ? ((vn - v0) / (tn - t0)) * h : v1 - v0
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * m1
}

/** yerdeki ayağın açısı (v: yerde kalma oranı): anahtarlar arası yumuşak, aşmasız */
function footAt(v: number): number {
  if (v <= 0) return FA[0]
  if (v >= 1) return FA[3]
  let i = 0
  while (i < 2 && v >= FV[i + 1]) i++
  return FA[i] + (FA[i + 1] - FA[i]) * smooth((v - FV[i]) / (FV[i + 1] - FV[i]))
}

/** tabanın en alt noktasının bilekten aşağı ek düşüşü (groundBob ile aynı ölçü) */
function dropOf(a: number) {
  const r = rad(a)
  const sa = Math.sin(r)
  return Math.max(TOE * sa, -HEEL * sa) + SOLE * Math.cos(r) - SOLE
}

/** ayak topuğunda (burun kalkık) ya da parmak ucunda (topuk kalkık) dönerken bileğin düz basışa göre ileri kayması */
function rockX(a: number) {
  const r = rad(a)
  return a < 0 ? -HEEL + HEEL * Math.cos(r) + SOLE * Math.sin(r) : TOE - TOE * Math.cos(r) + SOLE * Math.sin(r)
}

/** yerdeki ayağın bileği, kalçaya göre yatay (u: bacağın evresi, 0..s): dünyada sabit, kalça ilerledikçe geriye kayar */
const stanceX = (u: number, a: number) => gA0 - gStride * u + rockX(a)

/** bacak bu bilek yatayında yere basıyorsa kalçanın çıkabileceği en yüksek yer (d) */
function capOf(ax: number, a: number) {
  const q = REACH * REACH - ax * ax
  return (q > 0 ? Math.sqrt(q) : 0) - LEG_Y + dropOf(a)
}

/** yumuşak en küçük: iki sınır birbirine yaklaşınca köşe yuvarlanır (kalça sekmez) */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

/** kalça yüksekliği (d, + yukarı) evrenin bir anında: anahtar pozlardan, yerdeki bacağın boyuyla sınırlı */
function hipLift(ph: number, hop: number, dm: number): number {
  let d = dm + (cyc(BT, BD, 2 * ph) - dm) * hop
  const s = gS
  for (let j = 0; j < 2; j++) {
    let u = ph + (j ? 0 : 0.5)
    u -= Math.floor(u)
    let cap: number
    if (u < s) {
      const a = footAt(u / s)
      cap = capOf(stanceX(u, a), a)
    } else if (u > 1 - EDGE) cap = capOf(stanceX(0, FA[0]), FA[0]) + ((1 - u) / EDGE) * 10
    else if (u < s + EDGE) cap = capOf(stanceX(s, FA[3]), FA[3]) + ((u - s) / EDGE) * 10
    else continue
    d = smin(d, cap, 1.2)
  }
  return d
}

/** iki kemikli ters kinematik: kalçaya göre bileğe (dx ileri, dy aşağı) uzanan uyluk açısı ve diz bükümü, diz önde */
function reachLeg(leg: [number, number], dx: number, dy: number) {
  const D = Math.max(6, Math.min(REACH, Math.hypot(dx, dy)))
  const ca = (THIGH * THIGH + D * D - SHIN * SHIN) / (2 * THIGH * D)
  const cb = (THIGH * THIGH + SHIN * SHIN - D * D) / (2 * THIGH * SHIN)
  leg[0] = deg(Math.atan2(dx, dy) + Math.acos(Math.max(-1, Math.min(1, ca))))
  leg[1] = 180 - deg(Math.acos(Math.max(-1, Math.min(1, cb))))
}

/**
 * Yürüme / koşu pozu, `out` tamponuna yazılır (ayırma yok). phase: döngü evresi (0..1, katedilen yoldan:
 * `strideLength`), speed: tam koşuya oran (0,3 yürüme .. 1 koşu .. 1,6 nitro), style: koşu tarzı (game/looks.ts RUN_STYLES).
 */
export function gaitInto(out: Pose, phase: number, speed = 1, style?: string): Pose {
  const cfg = RUN_CFG[style ?? 'normal'] ?? RUN_CFG.normal
  const k = Math.max(0.3, Math.min(1.6, speed))
  const fast = Math.max(0, k - 1)
  // 0 yürüme .. 1 koşu
  const w = smooth(clamp01((k - 0.35) / 0.5))
  const ph = phase - Math.floor(phase)
  const mix = (a: number, b: number) => a + (b - a) * w
  for (let i = 0; i < 4; i++) {
    BT[i] = mix(WALK.step[i].t, RUN.step[i].t)
    BD[i] = mix(WALK.step[i].d, RUN.step[i].d)
    BTL[i] = mix(WALK.step[i].tilt, RUN.step[i].tilt)
    FV[i] = mix(WALK.foot[i].v, RUN.foot[i].v)
    FA[i] = mix(WALK.foot[i].a, RUN.foot[i].a)
    AT[i] = mix(WALK.arms[i].u, RUN.arms[i].u)
    AU[i] = mix(WALK.arms[i].upper, RUN.arms[i].upper)
    AF[i] = mix(WALK.arms[i].fore, RUN.arms[i].fore)
    SW_U[i] = mix(WALK.swing[i].u, RUN.swing[i].u)
    SW_T[i] = mix(WALK.swing[i].thigh, RUN.swing[i].thigh)
    SW_K[i] = mix(WALK.swing[i].knee, RUN.swing[i].knee) * (1 + (cfg.knee - 1) * w)
    SW_F[i] = mix(WALK.swing[i].foot, RUN.swing[i].foot)
  }
  // nitro: uçuş yükselir, yerde kalma kısalır
  BD[3] += 1.2 * fast
  gS = mix(WALK.stance, RUN.stance) - 0.03 * fast
  gStride = strideLength(k, style)
  gA0 = gS * gStride * mix(WALK.front, RUN.front)
  // tarzın sekmesi kalçanın iniş çıkışını büyütür (yarı yarıya: kısa adımlı tırısta bile gövde zıplamaz)
  const hop = 1 + (cfg.hop - 1) * 0.5
  const dm = (BD[0] + BD[1] + BD[2] + BD[3]) / 4
  const s = gS
  const feet = out.feet ?? (out.feet = [0, 0])
  const d = hipLift(ph, hop, dm)
  for (let i = 0; i < 2; i++) {
    // uzak bacak (0) yarım tur geriden
    let u = ph + (i ? 0 : 0.5)
    u -= Math.floor(u)
    const leg = out.legs[i]
    if (u < s) {
      // yerde: ayak zemine kilitli, bacak ona uzanır
      const a = footAt(u / s)
      reachLeg(leg, stanceX(u, a), LEG_Y + d - dropOf(a))
      feet[i] = a
    } else {
      // havada: itişteki açıdan anahtar pozlardan geçerek temas açısına
      const pg = ph + (s - u)
      reachLeg(LEG_TMP, stanceX(s, FA[3]), LEG_Y + hipLift(pg, hop, dm) - dropOf(FA[3]))
      ST[0] = s
      STH[0] = LEG_TMP[0]
      SKN[0] = LEG_TMP[1]
      SFT[0] = FA[3]
      reachLeg(LEG_TMP, stanceX(0, FA[0]), LEG_Y + hipLift(ph + (1 - u), hop, dm) - dropOf(FA[0]))
      ST[5] = 1
      STH[5] = LEG_TMP[0]
      SKN[5] = LEG_TMP[1]
      SFT[5] = FA[0]
      for (let j = 0; j < 4; j++) {
        // anahtarın evresi itişten sonra kalsın (nitroda yerde kalma kısalır)
        ST[j + 1] = Math.max(s + 0.02 * (j + 1), SW_U[j])
        STH[j + 1] = SW_T[j]
        SKN[j + 1] = SW_K[j]
        SFT[j + 1] = SW_F[j]
      }
      leg[0] = open(ST, STH, u)
      leg[1] = Math.max(2, open(ST, SKN, u))
      feet[i] = open(ST, SFT, u)
    }
  }
  // kollar: bacağın tersine, tablo zaten bir tık geriden; tarz salınımı ve dirseği ölçekler
  const sa = cfg.swing * (1 + fast * 0.2)
  const umax = mix(30, 47) * sa + 1e-6
  for (let i = 0; i < 2; i++) {
    const u = ph + (i ? 0 : 0.5)
    const up = cyc(AT, AU, u)
    const fo = cyc(AT, AF, u)
    out.arms[i][0] = up * sa
    out.arms[i][1] = up * sa + (fo - up) * cfg.elbow
  }
  // göğüs kollarla döner: yakın kol öndeyken yakın omuz da önde
  out.twist = cfg.trail ? 0 : ((out.arms[1][0] - out.arms[0][0]) / (2 * umax)) * (0.55 + 0.35 * w) * (cfg.tuck ? 0.4 : 1) * Math.min(1, cfg.swing + 0.3)
  if (cfg.trail) {
    // kollar arkaya uzanır, adımla hafifçe titrer
    const sn = Math.sin(Math.PI * 4 * ph)
    out.arms[0][0] = -62 + sn * 4
    out.arms[0][1] = -74 + sn * 4
    out.arms[1][0] = -56 - sn * 4
    out.arms[1][1] = -68 - sn * 4
  }
  if (cfg.tuck) {
    // uzak kol göğse toplanır (hafif nefesle oynar)
    const sn = Math.sin(Math.PI * 2 * ph)
    out.arms[0][0] = 16 + sn * 3
    out.arms[0][1] = 118 + sn * 4
  }
  // ikincil hareket: omuz, baş, atkı, saç ve sırt eşyası gövdeyi geriden izler
  const lagD = hipLift(ph - 0.045, hop, dm)
  const vel = (hipLift(ph - 0.03, hop, dm) - hipLift(ph - 0.06, hop, dm)) / 0.03
  out.lean = 1.2 + 0.5 * w + cfg.lean
  // omuz bir tık geriden çöker
  out.tilt = cyc(BT, BTL, 2 * ph - 0.08) + 0.07 * fast + cfg.tilt
  out.ground = true
  // kalça yüksekliği mutlak: yere oturtma kaymasını (groundBob) geri al
  out.bob = -d - groundBob(out)
  // gövde inince baş biraz geriden öne düşer, kalkınca dikilir
  out.head = -0.005 * (lagD - dm) - 0.012 + (cfg.tuck ? 0.05 : 0)
  // atkı ve saç ucu: gövde inerken kalkar, yükselirken düşer (gecikmeli)
  const lf = Math.max(-0.45, Math.min(0.45, -vel * 0.006))
  out.lift = lf
  out.hair = 0.4 + 0.3 * w + 0.25 * lf
  // sırt eşyası kolların salınımını geriden izler
  out.sway = (cyc(AT, AU, ph - 0.12) / mix(30, 47)) * Math.min(1, sa + 0.3)
  out.reach = 1
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
  const sw = a.sway === undefined || b.sway === undefined ? (u < 0.5 ? a.sway : b.sway) : m(a.sway, b.sway)
  // ayak açıları önce okunur: out a ya da b ile aynı nesne olabilir
  const fa0 = m(footOf(a, 0), footOf(b, 0))
  const fa1 = m(footOf(a, 1), footOf(b, 1))
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
  out.twist = m(a.twist ?? 0, b.twist ?? 0)
  out.sway = sw
  out.ground = grd
  out.reach = m(ra, rb)
  const f = out.feet ?? (out.feet = [0, 0])
  f[0] = fa0
  f[1] = fa1
  out.blink = blink
  out.mouth = mouth
  out.mood = mood
  return out
}

const smooth = (u: number) => u * u * (3 - 2 * u)

/**
 * Havada poz, dikey hıza göre sürekli: yükselişte gövde uzar, yakın diz toplanır, öndeki kol yukarı uzanır →
 * tepede (asılı an) dizler hafifçe açılır, kollar yana açılır → düşüşte kollar dengeye açılır, bacaklar inişe uzanır.
 * vy: px/sn (+ aşağı). t: saniye (düşerken kollar ağır ağır dengelenir).
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
    // düşüşte kollar ağır ağır dengelenir, bacaklar sırayla inişi yoklar (telaşsız)
    const w = Math.sin(t * 4.6) * 6 * fl
    out.arms[0][0] -= w
    out.arms[0][1] -= w * 1.4
    out.arms[1][0] += w
    out.arms[1][1] += w * 1.4
    const k = Math.sin(t * 3.8 + 1) * 4 * fl
    out.legs[0][0] += k
    out.legs[1][0] -= k
  }
  return out
}

export const POSES: Record<string, Pose> = {
  idle: { legs: [[-5, 4], [10, 26]], arms: [[-14, -4], [12, 30]], ground: true, tilt: -0.05, head: 0.05 },
  jump: { legs: [[-16, 14], [52, 96]], arms: [[-50, -30], [115, 140]], hair: 0.7, lift: -0.5, tilt: 0.04 },
  /** kalkış (yerden kopan ilk an): arka bacak itişten dümdüz, parmak ucu sivri; ön diz kalkar, kollar yukarı savrulur */
  launch: { legs: [[-14, 4], [40, 58]], arms: [[128, 150], [112, 140]], hair: 0.55, lift: -0.9, tilt: 0.06, feet: [52, 30] },
  /** yükseliş: gövde uzun, yakın diz göğse, öndeki kol göğe uzanır, arka bacak itişten düz kalır */
  rise: { legs: [[-20, 12], [64, 102]], arms: [[-50, -24], [124, 148]], hair: 0.75, lift: -0.7, tilt: 0.03, feet: [40, 26] },
  /** tepe: asılı an; dizler hafifçe açılır, kollar yana açılır */
  apex: { legs: [[16, 58], [44, 80]], arms: [[-88, -112], [88, 116]], hair: 0.55, lift: 0.2, bob: -2, feet: [22, 16] },
  /** düşüş: kollar dengeye yukarı-yana açılır, bacaklar aşağı uzanıp inişe hazırlanır */
  fall: { legs: [[-12, 24], [20, 24]], arms: [[-104, -128], [100, 124]], hair: 0.95, lift: 1, tilt: -0.03, feet: [14, 4] },
  /** inişe az kala: yakın bacak öne uzanır (topuk hazır), kollar öne-yana dengeye açılır, gövde hafif geride */
  preland: { legs: [[-6, 20], [26, 12]], arms: [[-74, -104], [72, 104]], hair: 0.85, lift: 1, tilt: -0.06, feet: [10, -8] },
  /** iniş: dizler bükük, kollar dengeye açılır (squash render.ts'te) */
  land: { legs: [[26, 78], [46, 96]], arms: [[-36, -8], [52, 86]], ground: true, hair: 0.5, lift: 0.55, tilt: 0.16, feet: [0, 0] },
  /**
   * duvar kayması: yüz duvara dönük; uzak el başın üstünde duvarda, yakın el göğüs hizasında duvara yaslanır,
   * yakın dizin tabanı duvara basar (sürtünür), uzak bacak sarkar; gövde duvardan hafifçe geri yaslanır
   */
  wall: { legs: [[-4, 18], [58, 66]], arms: [[146, 166], [74, 96]], lean: 1.2, lift: 0.75, hair: 0.25, tilt: -0.05, head: -0.06, feet: [30, -62] },
  /** duvardan sekme (yeni yöne bakar): duvar taraftaki bacak itişten dümdüz, ön diz kalkar, yakın kol öne-yukarı atılır */
  kick: { legs: [[-44, 6], [56, 92]], arms: [[-62, -34], [138, 158]], lean: 0.6, tilt: 0.12, hair: 0.95, lift: -0.8, feet: [56, 22] },
  /** ardışık sekmenin öbür adımı: kollar yer değiştirir (uzak kol öne-yukarı, yakın kol geriye), diz biraz daha yüksek */
  kick2: { legs: [[-38, 10], [66, 104]], arms: [[150, 170], [-50, -18]], lean: 0.6, tilt: 0.1, hair: 0.95, lift: -0.8, feet: [52, 26] },
  /** fren: eski yöne bakar, geriye yaslanır; yakın bacak önde dümdüz kayar (topukta), kollar savrulur */
  brake: { legs: [[-24, 52], [40, 4]], arms: [[150, 128], [96, 112]], lean: -2.2, tilt: -0.3, ground: true, hair: 0.05, lift: 0.5, feet: [10, -24] },
  /** dash'in kalkışı (çok kısa): gövde top gibi toplanır, sonra yöne fırlar */
  gather: { legs: [[44, 96], [62, 110]], arms: [[40, 120], [56, 132]], tilt: 0.22, hair: 0.7, lift: 0.2, feet: [30, 26] },
  /** yatay dash: gövde öne yatar (render.ts ayrıca döndürür), kollar ve bacaklar geriye savrulur */
  dash: { legs: [[-80, 6], [-56, 34]], arms: [[-82, -92], [-96, -106]], lean: -2.5, tilt: 0.42, hair: 1.3, feet: [60, 52] },
  /** çapraz yukarı dash: yakın kol yöne uzanır, uzak kol ve bacaklar geride akar (render.ts yöne döndürür) */
  dashUp: { legs: [[-34, 10], [-10, 30]], arms: [[-40, -54], [168, 176]], lean: -1, tilt: 0.12, hair: 1.25, lift: -0.8, feet: [56, 44] },
  /** yukarı dash: roket; uzak kol başın üstünden yöne uzanır, yakın kol gövdeye yapışık, bacaklar bitişik (render.ts yöne döndürür) */
  rocket: { legs: [[-6, 4], [4, 10]], arms: [[166, 176], [-22, -12]], hair: 1.2, lift: -1, feet: [50, 44] },
  /** çapraz aşağı dash: kayan tekme; yakın bacak öne dümdüz, uzak diz bükük, kollar geride-yukarı */
  dashDown: { legs: [[8, 52], [40, 6]], arms: [[150, 130], [-130, -150]], tilt: -0.08, hair: 0.6, lift: 1, feet: [10, -10] },
  /** aşağı dash: ayakla iner; uzak kol yukarı, yakın kol geriye savrulur, dizler hafif bükük */
  stomp: { legs: [[10, 12], [-6, 6]], arms: [[150, 170], [-118, -150]], hair: 0.1, lift: 1, feet: [4, 0] },
  wave: { legs: [[-5, 4], [10, 26]], arms: [[-14, -4], [105, 140]], ground: true, tilt: -0.05, head: 0.05 },
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
