/**
 * Düşmanların, dost hayvanların ve toplanan nesnelerin çizimi: karakter ve boss’larla aynı dil
 * (mürekkep dış hat, düz renk, tek kademe gölge, ışık sol üstten).
 * Birim dünya pikseli. Canlılarda (0, 0) gövde kutusunun taban ortası, y yukarı eksi, çizim sağa bakar;
 * nesnelerde (0, 0) kutunun merkezi. Düşmanlar mürekkep hattın dışında ince kırmızı haleyle parlar.
 * Ruh hâli boss’larla aynı okunur: titreme + ünlem (işaret), çatık kaş (saldırı), sarmal göz + yıldız (sersem).
 */
import { INK, blob, setInkWidth, stroke } from './heroDraw'
import type { Enemy, EnemyKind } from './sim'
import type { CityKey } from './types'

type Ctx = CanvasRenderingContext2D
type Mood = 'stern' | 'angry' | 'dizzy'

/** dış hat kalınlığı: 12 piksellik gövdede boss’lardan (1.15) biraz ince */
const INKW = 0.85
const HERO_INKW = 3.2
const HALO = 'rgba(226,58,58,0.85)'
const TAU = Math.PI * 2

/** Hale geçişi: aynı çizim önce yalnız kalın kırmızı hatla, sonra asıl renkleriyle yapılır. */
let halo = false
let haloW = 0.5

const shade = (color: string) => ({ color, dx: 0.9, dy: -0.7 })

/** dolu kapalı şekil (mürekkep hat + isteğe bağlı gölge); hale geçişinde yalnız kırmızı çerçeve */
function shape(c: Ctx, build: () => void, fill: string, sh?: string) {
  if (halo) {
    c.beginPath()
    build()
    c.closePath()
    c.strokeStyle = HALO
    c.lineWidth = INKW + haloW * 2
    c.stroke()
    return
  }
  blob(c, build, fill, sh ? shade(sh) : undefined)
}

function ell(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, sh?: string, rot = 0) {
  shape(c, () => c.ellipse(x, y, rx, ry, rot, 0, TAU), fill, sh)
}

function poly(c: Ctx, pts: number[], fill: string, sh?: string) {
  shape(
    c,
    () => {
      c.moveTo(pts[0], pts[1])
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    },
    fill,
    sh,
  )
}

/** uzuv, kuyruk, çizgi; ink=false ise dış hatsız ince ayrıntı (halede atlanır) */
function line(c: Ctx, pts: number[], w: number, color: string, ink = true) {
  if (halo) {
    if (!ink) return
    c.beginPath()
    c.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    c.strokeStyle = HALO
    c.lineWidth = w + INKW + haloW * 2
    c.stroke()
    return
  }
  stroke(c, pts, w, color, ink)
}

/** dış hatsız düz leke (benek, parlama, yanak) */
function dab(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, rot = 0) {
  if (halo) return
  c.beginPath()
  c.ellipse(x, y, rx, ry, rot, 0, TAU)
  c.fillStyle = color
  c.fill()
}

/** halka (simit, anahtar başı): mürekkep + renk, ortası boş */
function ring(c: Ctx, x: number, y: number, r: number, w: number, color: string) {
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.strokeStyle = INK
  c.lineWidth = w + INKW
  c.stroke()
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke()
}

/** kabarık kenarlı top (yün, pamuk, pişmaniye): n tane yay */
function puff(c: Ctx, x: number, y: number, rx: number, ry: number, n: number, bump: number, fill: string, sh?: string) {
  shape(
    c,
    () => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU
        c.arc(x + Math.cos(a) * rx, y + Math.sin(a) * ry, bump, a - 1.25, a + 1.25)
      }
    },
    fill,
    sh,
  )
}

/** Düşman gözü: beyazlı, ruh hâline göre kaş ya da sarmal. */
function eye(c: Ctx, x: number, y: number, r: number, mood: Mood, t: number) {
  if (halo) return
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.fillStyle = '#ffffff'
  c.fill()
  c.strokeStyle = INK
  c.lineWidth = 0.45
  c.stroke()
  c.lineCap = 'round'
  if (mood === 'dizzy') {
    c.beginPath()
    for (let a = 0; a < Math.PI * 4; a += 0.5) {
      const rr = (a / (Math.PI * 4)) * r * 0.85
      const px = x + Math.cos(a + t * 6) * rr
      const py = y + Math.sin(a + t * 6) * rr
      if (a === 0) c.moveTo(px, py)
      else c.lineTo(px, py)
    }
    c.lineWidth = 0.4
    c.stroke()
    return
  }
  c.beginPath()
  c.arc(x + r * 0.3, y + r * 0.1, r * 0.55, 0, TAU)
  c.fillStyle = INK
  c.fill()
  // kaş: devriyede hafif, saldırıda çatık
  c.strokeStyle = INK
  c.lineWidth = mood === 'angry' ? 0.75 : 0.55
  c.beginPath()
  if (mood === 'angry') {
    c.moveTo(x - r * 1.25, y - r * 1.55)
    c.lineTo(x + r * 1.15, y - r * 0.6)
  } else {
    c.moveTo(x - r * 1.05, y - r * 1.35)
    c.lineTo(x + r * 1.05, y - r * 0.95)
  }
  c.stroke()
}

/** Dost gözü: iri siyah boncuk, parıltılı; sevinince gülen yay. */
function softEye(c: Ctx, x: number, y: number, r: number, happy: boolean) {
  if (happy) {
    c.strokeStyle = INK
    c.lineWidth = 0.55
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x - r, y + r * 0.3)
    c.quadraticCurveTo(x, y - r * 1.1, x + r, y + r * 0.3)
    c.stroke()
    return
  }
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.fillStyle = INK
  c.fill()
  c.beginPath()
  c.arc(x - r * 0.3, y - r * 0.35, r * 0.38, 0, TAU)
  c.fillStyle = '#ffffff'
  c.fill()
}

/** sersemken başın üstünde dönen yıldızlar (boss’larla aynı) */
function stars(c: Ctx, y: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i * TAU) / 3
    c.save()
    c.translate(Math.cos(a) * 5.4, y + Math.sin(a) * 1.5)
    c.rotate(t * 3 + i)
    c.beginPath()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 0.75 : 1.8
      const an = (k * Math.PI) / 5
      c.lineTo(Math.cos(an) * r, Math.sin(an) * r)
    }
    c.closePath()
    c.fillStyle = '#ffd86a'
    c.strokeStyle = INK
    c.lineWidth = 0.45
    c.fill()
    c.stroke()
    c.restore()
  }
}

/** işaret: hücumdan önce kırmızı ünlem */
function bang(c: Ctx, y: number, t: number) {
  const k = 1 + Math.sin(t * 18) * 0.08
  c.save()
  c.translate(0, y)
  c.scale(k, k)
  c.lineJoin = 'round'
  c.strokeStyle = INK
  c.lineWidth = 0.9
  c.fillStyle = '#ff4a3a'
  c.beginPath()
  c.moveTo(-1.2, -6.4)
  c.lineTo(1.2, -6.4)
  c.lineTo(0.6, -2.3)
  c.lineTo(-0.6, -2.3)
  c.closePath()
  c.stroke()
  c.fill()
  c.beginPath()
  c.arc(0, -0.6, 0.95, 0, TAU)
  c.stroke()
  c.fill()
  c.restore()
}

function groundShadow(c: Ctx, rx: number) {
  c.fillStyle = 'rgba(20,10,30,0.26)'
  c.beginPath()
  c.ellipse(0, 0.2, rx, 1, 0, 0, TAU)
  c.fill()
}

/* ── Düşmanlar ────────────────────────────────────────────────── */

interface Anim {
  mood: Mood
  t: number
  /** yürüyüş salınımı -1..1 (dururken 0) */
  step: number
  /** kanat salınımı -1..1 (1: yukarı) */
  flap: number
  /** kanatlar kapalı (tüneyen saksağan) */
  fold: boolean
  /** havada (sıçrayan) */
  air: boolean
  /** durum (yüzen avcı kılık değiştirir) */
  st: Enemy['state']
  /** ağız açıklığı 0..1 (yüzen avcılar: işarette açılıp kapanır, hamlede ardına dek açık) */
  open: number
}

type EnemyPainter = (c: Ctx, a: Anim) => void

/** dört ayak: çapraz adım */
function legs(c: Ctx, xs: number[], top: number, color: string, step: number, w = 1.1) {
  for (let i = 0; i < xs.length; i++) {
    const s = (i % 2 ? -step : step) * 1.2
    line(c, [xs[i], top, xs[i] + s, -0.55], w, color)
  }
}

interface BirdLook {
  body: string
  bodySh: string
  wing: string
  wingSh: string
  beak: string
  beakLen: number
  tail: number[]
  tailCol: string
  rx: number
  ry: number
  belly?: string
  band?: string
}

/** kuş kanadı: omuzdan uca kavisli damla; f 1 yukarı, -1 aşağı */
function wing(c: Ctx, dx: number, f: number, fill: string, sh?: string) {
  shape(
    c,
    () => {
      c.moveTo(2.4 + dx, -5)
      c.quadraticCurveTo(0.6 + dx, -5.6 - f * 4.6, -4.2 + dx, -5 - f * 5.2)
      c.quadraticCurveTo(-3 + dx, -3.8 - f * 1.4, -2 + dx, -3.2)
    },
    fill,
    sh,
  )
}

function bird(c: Ctx, a: Anim, o: BirdLook) {
  const f = a.flap
  poly(c, o.tail, o.tailCol)
  if (a.fold) {
    line(c, [-0.6, -1.6, -0.6, -0.4], 0.6, '#3a3640')
    line(c, [1.4, -1.6, 1.4, -0.4], 0.6, '#3a3640')
  } else if (f > 0) wing(c, 1.3, f * 0.85, o.wingSh)
  ell(c, 0, -4.2, o.rx, o.ry, o.body, o.bodySh)
  if (o.belly) dab(c, 1, -3.1, o.rx * 0.62, o.ry * 0.5, o.belly)
  ell(c, 4.1, -6.4, 2.6, 2.4, o.body, o.bodySh)
  if (o.band) line(c, [2.6, -4.6, 4.6, -4.1], 0.8, o.band, false)
  poly(c, [6.2, -7.2, 6.2 + o.beakLen, -6.1, 6.2, -5.3], o.beak)
  if (a.fold) ell(c, -1.2, -4.4, 3.4, 1.9, o.wing, o.wingSh, 0.3)
  else wing(c, 0, f, o.wing, o.wingSh)
  eye(c, 4.7, -6.9, 1.15, a.mood, a.t)
}

/** balık kuyruğu: (x, y) sapın ucu, f -1..1 vuruş, s boy; sola açılan iki loblu yüzgeç */
function tailFin(c: Ctx, x: number, y: number, f: number, s: number, fill: string, sh?: string) {
  poly(c, [x + s * 0.4, y, x - s * 1.1, y - s * (1.15 - f * 0.35), x - s * 0.55, y + f * s * 0.15, x - s * 1.05, y + s * (1.05 + f * 0.35)], fill, sh)
}

/** iri dişli ağız: (x0, y) ağız köşesi, x1 burun ucu; open 0..1 */
function jaws(c: Ctx, x0: number, x1: number, y: number, open: number, gape: number) {
  if (halo) return
  const g = open * gape
  if (g > 0.15) {
    c.beginPath()
    c.moveTo(x0, y)
    c.lineTo(x1, y - g * 0.45)
    c.lineTo(x1 - 0.4, y + g * 0.55)
    c.closePath()
    c.fillStyle = '#5a1420'
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 0.45
    c.stroke()
  }
  // dişler: üst ve alt çene boyunca beyaz üçgenler
  c.fillStyle = '#fffaf0'
  c.strokeStyle = INK
  c.lineWidth = 0.25
  const n = Math.max(2, Math.round((x1 - x0) / 1.1))
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n
    const x = x0 + (x1 - x0) * k
    const yu = y - g * 0.45 * k
    const yd = y + g * 0.55 * k
    for (const [yy, d] of [[yu, 1], [yd, -1]] as const) {
      if (g <= 0.15 && d < 0) continue
      c.beginPath()
      c.moveTo(x - 0.45, yy)
      c.lineTo(x + 0.45, yy)
      c.lineTo(x, yy + d * 0.95)
      c.closePath()
      c.fill()
      c.stroke()
    }
  }
  if (g <= 0.15) {
    c.beginPath()
    c.moveTo(x0, y)
    c.lineTo(x1, y - 0.2)
    c.strokeStyle = INK
    c.lineWidth = 0.4
    c.stroke()
  }
}

const ENEMIES: Record<string, EnemyPainter> = {
  // Esoli (mahmuzlu camgöz): devriyede tombul, iri gözlü, gülümseyen pembe yanaklı bir maskot; işarette gözleri daralıp
  // kızarır, kaşları çatılır, ağzı sıra sıra dişle açılır; hamlede çenesi ardına dek açık, gövdesi gerilir, ardında hız çizgileri.
  // Sersemken yine sevimli ama gözleri sarmal. Birimler 10 = gövde boyu; burun sağda. Ezilmez: kalın hale.
  shark: (c, a) => {
    const f = a.flap
    const beast = a.st === 'windup' || a.st === 'charge'
    const charge = a.st === 'charge'
    const BACK = beast ? '#4c6276' : '#7a9cb8'
    const BACK_SH = beast ? '#2a3a4c' : '#4e6e8c'
    const BELLY = beast ? '#e4e2dc' : '#f6f6f0'
    // hız çizgileri: hamlede kuyruğun ardında
    if (charge && !halo)
      for (const [y, l, ph] of [[-7.4, 5, 0], [-5, 7, 0.4], [-2.8, 4.4, 0.7]] as const) {
        const k = (a.t * 6 + ph) % 1
        const x0 = -11.6 - k * 2.4
        line(c, [x0, y, x0 - l, y], 1.1, 'rgba(30,20,40,0.35)', false)
        line(c, [x0, y, x0 - l, y], 0.6, 'rgba(255,255,255,0.95)', false)
      }
    // kuyruk: sevimlide yuvarlak küçük yelpaze, canavarda keskin hilal
    if (beast) tailFin(c, -9.4, -5.2 + f * 0.5, f, 3.2, BACK, BACK_SH)
    else
      shape(
        c,
        () => {
          c.moveTo(-8.4, -5.2)
          c.quadraticCurveTo(-11.6, -9.4 + f, -12.4, -8 + f)
          c.quadraticCurveTo(-11.4, -5.2, -12.4, -2.4 + f * 0.6)
          c.quadraticCurveTo(-11.4, -1.4 + f * 0.6, -8.4, -4.4)
        },
        BACK,
        BACK_SH,
      )
    // gövde: sevimlide tombul fasulye, canavarda gerilmiş torpido
    shape(
      c,
      beast
        ? () => {
            c.moveTo(-9.6, -5.2 + f * 0.5)
            c.bezierCurveTo(-6, -9.6, 4, -9.8, 8.8, -7.6)
            c.quadraticCurveTo(12, -6.2, 11.8, -4.4)
            c.quadraticCurveTo(9, -1.2, 2, -1.2)
            c.bezierCurveTo(-3, -1.2, -7, -3, -9.6, -5.2 + f * 0.5)
          }
        : () => {
            c.moveTo(-9, -5)
            c.bezierCurveTo(-8, -9.6, 5, -10.4, 9, -7.2)
            c.bezierCurveTo(11.4, -5.2, 10.4, -1.4, 5, -1)
            c.bezierCurveTo(0, -0.6, -7.6, -1.8, -9, -5)
          },
      BACK,
      BACK_SH,
    )
    // karın
    if (!halo) {
      c.beginPath()
      if (beast) {
        c.moveTo(-7, -3.4)
        c.quadraticCurveTo(0, -1.4, 7, -2.2)
        c.quadraticCurveTo(10.4, -3, 11.4, -4.2)
        c.quadraticCurveTo(4, -3.8, -7, -3.4)
      } else {
        c.moveTo(-6.6, -2.6)
        c.quadraticCurveTo(0, -0.9, 6, -1.4)
        c.quadraticCurveTo(9.6, -2.2, 10.2, -3.8)
        c.quadraticCurveTo(3, -3.6, -6.6, -2.6)
      }
      c.fillStyle = BELLY
      c.fill()
    }
    // sırt yüzgeci: sevimlide yuvarlak tümsek, canavarda bıçak gibi
    if (beast) poly(c, [-3, -8.6, 0, -13.2, 2.2, -9], BACK, BACK_SH)
    else
      shape(
        c,
        () => {
          c.moveTo(-3.2, -8.6)
          c.quadraticCurveTo(-1.6, -12.2, 0.8, -11.6)
          c.quadraticCurveTo(0.4, -10, 1.6, -9)
        },
        BACK,
        BACK_SH,
      )
    // göğüs yüzgeci: sevimlide küçük el sallar
    if (beast) poly(c, [3, -2.8, 1.4, 0.6, 5.6, -2.4], BACK, BACK_SH)
    else ell(c, 2.4, -1.8, 1.9, 1, BACK, BACK_SH, 0.5 + f * 0.25)
    for (const [x, y] of [[-5, -6.6], [-2.6, -7.6], [-1, -6], [1.8, -8], [-6.6, -5.4]] as const) dab(c, x, y, 0.42, 0.42, beast ? '#c8d4dc' : '#eaf2f8')
    if (beast) {
      for (let i = 0; i < 4; i++) line(c, [4.4 + i * 0.75, -6.6, 4 + i * 0.75, -4.2], 0.35, BACK_SH, false)
      // çene: iki sıra sivri diş; işarette açılıp kapanır, hamlede ardına dek açık
      jaws(c, 6, 11.4, -3.8, a.open, 4.2)
      if (!halo && a.open > 0.3) {
        // ikinci diş sırası, ağzın içinde
        c.fillStyle = '#fffaf0'
        c.strokeStyle = INK
        c.lineWidth = 0.22
        for (let i = 0; i < 3; i++) {
          const x = 7.4 + i * 1.2
          const yu = -3.8 - a.open * 4.2 * 0.45 * ((x - 6) / 5.4) + 0.9
          c.beginPath()
          c.moveTo(x - 0.35, yu)
          c.lineTo(x + 0.35, yu)
          c.lineTo(x, yu + 0.7)
          c.closePath()
          c.fill()
          c.stroke()
        }
      }
      // daralmış kızıl göz, çatık kalın kaş
      if (!halo) {
        c.beginPath()
        c.ellipse(8, -6.6, 1.3, 0.75, -0.2, 0, TAU)
        c.fillStyle = '#ffe8a0'
        c.fill()
        c.strokeStyle = INK
        c.lineWidth = 0.45
        c.stroke()
        c.beginPath()
        c.arc(8.3, -6.6, 0.5, 0, TAU)
        c.fillStyle = '#e02a2a'
        c.fill()
        c.strokeStyle = INK
        c.lineWidth = 0.9
        c.beginPath()
        c.moveTo(6.2, -8.6)
        c.lineTo(9.6, -7.2)
        c.stroke()
      }
    } else {
      // sevimli yüz: iri parlak göz (sersemken sarmal), pembe yanak, kapalı gülümseme
      if (a.mood === 'dizzy') eye(c, 6, -6.4, 1.7, a.mood, a.t)
      else if (!halo) softEye(c, 6, -6.4, 1.75, false)
      dab(c, 7.4, -4, 1.1, 0.65, 'rgba(255,128,160,0.6)')
      if (!halo) {
        c.strokeStyle = INK
        c.lineWidth = 0.45
        c.lineCap = 'round'
        c.beginPath()
        if (a.mood === 'dizzy') {
          c.moveTo(8.2, -3.2)
          c.quadraticCurveTo(8.9, -2.6, 9.6, -3.2)
          c.quadraticCurveTo(10.1, -3.6, 10.4, -3.1)
        } else {
          c.moveTo(8.4, -3.6)
          c.quadraticCurveTo(9.4, -2.5, 10.4, -3.6)
        }
        c.stroke()
      }
    }
  },
  // Pirana: tombul gümüş gövde, kırmızı karın, öne fırlamış alt çene ve iri dişler; kuyruğu hızlı çırpar
  piranha: (c, a) => {
    const f = a.flap
    tailFin(c, -4.4, -4.8, f, 2.6, '#5e6c78', '#3a4652')
    ell(c, 0, -4.6, 5.4, 3.6, '#8a98a4', '#55626e')
    // kırmızı karın, üstünde ışık şeridi
    dab(c, 0.2, -2.5, 4.3, 1.45, '#d8402e')
    dab(c, -0.2, -3.3, 3.4, 0.4, '#ee7a5a')
    // sırt ve karın yüzgeci
    poly(c, [-1.6, -8.4, 0.4, -10.4 + f * 0.4, 1.6, -8.5], '#5e6c78')
    poly(c, [-1.4, -1.2, -0.4, 0.4 - f * 0.4, 0.8, -1.1], '#c8302a')
    for (const [x, y] of [[-2.4, -6.6], [-0.6, -7.4], [-1.8, -5.4]] as const) dab(c, x, y, 0.4, 0.4, '#c8d4dc')
    line(c, [2.4, -7, 2.6, -3.4], 0.35, '#55626e', false)
    // iri dişli ağız: sürekli çene oynatır
    jaws(c, 2.2, 5.8, -3.4, a.open, 2.8)
    eye(c, 2.4, -6, 1.2, a.mood, a.t)
  },
  // Yengeç: yassı kırmızı kabuk, havada iki kıskaç, saplı gözler
  crab: (c, a) => {
    for (let i = 0; i < 3; i++) {
      const s = (i % 2 ? a.step : -a.step) * 0.7
      line(c, [2 + i * 1.2, -2.6, 4 + i * 1.3, -2.2, 4.8 + i * 1.3 + s, -0.5], 0.8, '#a8302a')
      line(c, [-2 - i * 1.2, -2.6, -4 - i * 1.3, -2.2, -4.8 - i * 1.3 + s, -0.5], 0.8, '#a8302a')
    }
    const snap = a.step * 0.5
    for (const k of [-1, 1]) {
      line(c, [k * 4, -4.8, k * 6.2, -6.8], 1.2, '#c8402e')
      ell(c, k * 6.6, -8.8 + snap * k, 2.2, 2, '#e0503a', '#a8302a')
      line(c, [k * 6.6, -9, k * 6.9, -10.6 + snap * k], 0.45, INK, false)
    }
    ell(c, 0, -4, 5.4, 3.3, '#e0503a', '#a8302a')
    line(c, [-1.9, -6.6, -1.9, -8], 0.8, '#e0503a')
    line(c, [1.9, -6.6, 1.9, -8], 0.8, '#e0503a')
    eye(c, -1.9, -8.8, 1.25, a.mood, a.t)
    eye(c, 1.9, -8.8, 1.25, a.mood, a.t)
    line(c, [-1.4, -3, 0, -2.5, 1.4, -3], 0.45, INK, false)
  },
  // Gökçekuş (martı): zarif beyaz gövde, gümüş gri kanat, siyah beyaz benekli uç tüyleri, kırmızı benekli sarı gaga;
  // kanat dirsekten kırılarak çırpar: yukarıda açık V, aşağıda iniş vuruşu
  gull: (c, a) => {
    const f = a.flap
    const WHITE = '#fbfaf6'
    const WHITE_SH = '#c8d0dc'
    const GREY = '#b4bfcc'
    const GREY_SH = '#7a8698'
    const TIP = '#262430'
    // kanat: omuz → dirsek → uç; uç tüyleri koyu, üstünde beyaz benek
    const wingOf = (dx: number, k: number, fill: string, sh: string) => {
      const ex = -1.6 + dx
      const ey = -5.6 - k * 3.6
      const tx = -6.4 + dx + Math.abs(k) * 1.2
      const ty = -5.2 - k * 6.4
      shape(
        c,
        () => {
          c.moveTo(2.2 + dx, -5.4)
          c.quadraticCurveTo(0.4 + dx, -6 - k * 2.4, ex, ey)
          c.lineTo(tx, ty)
          c.quadraticCurveTo(ex - 1.4, ey + 2.6 - k * 0.6, -2.4 + dx, -4.4)
        },
        fill,
        sh,
      )
      // uç: koyu üçgen
      const mx = ex + (tx - ex) * 0.55
      const my = ey + (ty - ey) * 0.55
      poly(c, [mx, my - 0.4, tx, ty, mx - 0.6 + (tx - ex) * 0.1, my + 1.2], TIP)
      dab(c, tx + (ex - tx) * 0.22, ty + (ey - ty) * 0.22 + 0.25, 0.32, 0.32, '#ffffff')
    }
    // kuyruk: kısa, beyaz, koyu uçlu
    poly(c, [-3.4, -5.4, -7.6, -5.6, -6.7, -4.6, -7.6, -3.6, -3.4, -3.8], WHITE, WHITE_SH)
    line(c, [-7.2, -5.4, -6.6, -4.6, -7.2, -3.8], 0.45, TIP, false)
    // arka kanat (yukarıdayken görünür)
    if (f > -0.2) wingOf(1.4, f * 0.85, GREY_SH, '#566274')
    // gövde: ince uzun, göğüs öne dolgun
    shape(
      c,
      () => {
        c.moveTo(-4.6, -4.8)
        c.quadraticCurveTo(-1, -7.4, 3.2, -6.2)
        c.quadraticCurveTo(5.2, -5.2, 4.6, -3.6)
        c.quadraticCurveTo(1, -1.8, -4.6, -4)
      },
      WHITE,
      WHITE_SH,
    )
    // baş
    ell(c, 4.4, -6.8, 2.2, 2.05, WHITE, WHITE_SH)
    // gaga: sarı, alt çenede kırmızı benek
    poly(c, [6.3, -7.3, 9.4, -6.7, 9, -6, 6.3, -5.9], '#f4c232', '#c8901c')
    dab(c, 8.4, -6.05, 0.42, 0.32, '#e0302a')
    // ön kanat
    wingOf(0, f, GREY, GREY_SH)
    eye(c, 5, -7.3, 1.25, a.mood, a.t)
  },
  // Güvercin: tombul mavi-gri, boynunda yeşil hare, yelpaze kuyruk
  pigeon: (c, a) => bird(c, a, { body: '#8a90a6', bodySh: '#5c6278', wing: '#c8ccd8', wingSh: '#6a7088', beak: '#e0a040', beakLen: 1.9, tail: [-3.8, -5.4, -7.4, -7, -8, -4.6, -7, -2.6, -3.8, -2.8], tailCol: '#5c6278', rx: 4.9, ry: 3.5, band: '#7ad0a0' }),
  // Kuzgun: simsiyah, kalın gaga, tırtıklı kuyruk
  raven: (c, a) => bird(c, a, { body: '#2e2c3e', bodySh: '#15141c', wing: '#454260', wingSh: '#1b1a24', beak: '#c9a24a', beakLen: 3.6, tail: [-4, -5.4, -8, -6.6, -6.6, -5, -8.2, -4.4, -6.6, -3.4, -7.6, -2.4, -4, -2.8], tailCol: '#1b1a24', rx: 5, ry: 3.2 }),
  // Saksağan: siyah-beyaz, uzun mavi-yeşil kuyruk; tünekte kanat kapalı
  magpie: (c, a) => bird(c, a, { body: '#22202c', bodySh: '#0e0d14', wing: '#f4f2ea', wingSh: '#2e5a78', beak: '#3a3640', beakLen: 2.4, tail: [-3.6, -5, -8.6, -4.6, -8.8, -2.8, -3.6, -3], tailCol: '#2e8a8a', rx: 4.4, ry: 3, belly: '#f4f2ea' }),
  // Arı: tombul, iki siyah kuşak, küçük kanat
  bee: (c, a) => {
    const f = a.flap
    ell(c, -1.6, -8, 1.5, 2.5, 'rgba(232,246,255,0.9)', undefined, -0.5 + f * 0.5)
    ell(c, 0.8, -8.2, 1.5, 2.6, 'rgba(232,246,255,0.9)', undefined, 0.2 + f * 0.5)
    poly(c, [-4.2, -4.8, -6.4, -4.1, -4.2, -3.4], '#2a2220')
    ell(c, 0, -4.1, 4.7, 3.5, '#f2c230', '#c8901c')
    line(c, [-2.4, -6.7, -3, -4.1, -2.4, -1.5], 1.2, '#2a2220', false)
    line(c, [0.2, -7.2, -0.3, -4.1, 0.2, -1], 1.2, '#2a2220', false)
    line(c, [3, -7, 4.4, -9, 5.4, -8.8], 0.4, INK, false)
    eye(c, 2.9, -4.8, 1.3, a.mood, a.t)
  },
  // Eşek arısı: ince belli, sivri iğneli, geriye yatık kanat
  wasp: (c, a) => {
    const f = a.flap
    ell(c, -1.4, -8, 1.2, 3.2, 'rgba(232,246,255,0.9)', undefined, -1 + f * 0.4)
    ell(c, 0.2, -8.4, 1.2, 3.2, 'rgba(232,246,255,0.9)', undefined, -0.5 + f * 0.4)
    line(c, [0.6, -3.4, 0, -1.6, -0.8, -0.8], 0.35, INK, false)
    line(c, [2, -3.4, 2, -1.4, 1.4, -0.6], 0.35, INK, false)
    shape(
      c,
      () => {
        c.moveTo(0, -5.4)
        c.quadraticCurveTo(-3.4, -7.6, -6.2, -4.6)
        c.lineTo(-8.2, -3.2)
        c.lineTo(-6, -2.8)
        c.quadraticCurveTo(-3, -1.4, 0, -3.6)
      },
      '#f2a82e',
      '#c0741c',
    )
    line(c, [-2, -6, -2.4, -2.8], 0.9, '#1d1a22', false)
    line(c, [-4.2, -5.8, -4.6, -2.8], 0.9, '#1d1a22', false)
    ell(c, 1.4, -4.6, 2.1, 2, '#1d1a22')
    ell(c, 4.4, -5, 2.2, 2.1, '#f2c42e', '#c8901c')
    line(c, [4.6, -6.8, 6.2, -8.6], 0.4, INK, false)
    eye(c, 4.9, -5.3, 1.2, a.mood, a.t)
  },
  // Sivrisinek: incecik gövde, upuzun hortum, sarkan bacaklar
  mosquito: (c, a) => {
    const f = a.flap
    ell(c, -1.6, -8.2, 1.3, 3.4, 'rgba(226,238,255,0.85)', undefined, -0.9 + f * 0.45)
    ell(c, 0.4, -8.6, 1.3, 3.4, 'rgba(226,238,255,0.85)', undefined, -0.3 + f * 0.45)
    line(c, [0, -4, -1.6, -1.8, -3.2, -0.2], 0.4, '#2a2430')
    line(c, [1, -4, 0.6, -1.6, -0.4, 0], 0.4, '#2a2430')
    line(c, [2, -4.2, 2.8, -1.8, 2.4, -0.2], 0.4, '#2a2430')
    ell(c, -2.8, -3.9, 3.2, 1.5, '#b03a48', '#7e2430', -0.2)
    ell(c, 1, -4.8, 1.9, 1.7, '#4a4458')
    ell(c, 3.6, -5.6, 1.8, 1.7, '#5a5468')
    line(c, [5, -5.2, 8.4, -2.8], 0.5, '#c8302a')
    eye(c, 4, -5.9, 1.1, a.mood, a.t)
  },
  // Yılan: yerde kıvrılan gövde, kalkık baş, çatal dil
  snake: (c, a) => {
    const ph = a.t * 7
    const pts: number[] = []
    for (let i = 0; i <= 8; i++) pts.push(-7.4 + i * 1.3, -1.7 + Math.sin(i * 0.95 + ph) * (a.step ? 0.9 : 0.4))
    pts.push(3.8, -3.4, 4.4, -5.6, 5.2, -7.2)
    line(c, pts, 2.5, '#5a9a3a')
    for (let i = 1; i < 8; i += 2) dab(c, pts[i * 2], pts[i * 2 + 1], 0.75, 0.6, '#c8d85a')
    const flick = Math.sin(a.t * 11) > 0.2 ? 1 : 0
    if (flick) {
      line(c, [7.6, -7.2, 9.2, -7], 0.4, '#e0303a', false)
      line(c, [9.2, -7, 10, -7.8], 0.35, '#e0303a', false)
      line(c, [9.2, -7, 10, -6.4], 0.35, '#e0303a', false)
    }
    ell(c, 5.7, -7.6, 2.6, 2, '#5a9a3a', '#3a7226')
    eye(c, 6, -8.1, 1.1, a.mood, a.t)
  },
  // Kertenkele: yere yapışık uzun gövde, açık bacaklar, kıvrık kuyruk
  lizard: (c, a) => {
    const s = a.step
    line(c, [-3.6, -3, -6.4, -1.8 + s * 0.5, -8.2, -3.4 - s * 0.6], 1.2, '#c8803a')
    line(c, [2.6, -3, 4 + s, -1.8, 4.6 + s, -0.4], 0.9, '#a8642a')
    line(c, [-2.6, -3, -4 - s, -1.8, -4.8 - s, -0.4], 0.9, '#a8642a')
    ell(c, 0, -3.4, 4.8, 2.1, '#c8803a', '#96561e')
    for (const x of [-2.6, -0.6, 1.4]) dab(c, x, -4, 0.7, 0.5, '#f0b864')
    line(c, [1.4, -2.4, 2.2 - s, -1.2, 3.2 - s, -0.4], 0.9, '#c8803a')
    line(c, [-1.6, -2.4, -1.4 + s, -1.2, -0.4 + s, -0.4], 0.9, '#c8803a')
    ell(c, 5.2, -4.4, 2.7, 2.1, '#d08a40', '#96561e')
    eye(c, 5.6, -5, 1.15, a.mood, a.t)
  },
  // Fare: gri gövde, pembe yuvarlak kulak, sivri burun, ince kuyruk
  rat: (c, a) => {
    line(c, [-4.6, -2.6, -7, -1.6, -8.4, -3.6 + a.step * 0.6], 0.7, '#f0a0a8')
    legs(c, [-2.6, 2.6], -2, '#e87a8a', a.step, 0.9)
    ell(c, -0.6, -3.5, 4.9, 3.2, '#8a8490', '#5e5868')
    poly(c, [3, -5.8, 8.2, -3, 3.4, -1.6], '#9a94a0', '#5e5868')
    ell(c, 2.4, -6.8, 2, 2, '#f0a0a8', '#c8707e')
    dab(c, 8, -3.1, 0.7, 0.7, '#e84a6a')
    line(c, [6.4, -2.9, 7.2, -1.4], 0.3, INK, false)
    eye(c, 4.6, -4.4, 1.15, a.mood, a.t)
  },
  // Kurbağa: bodur yeşil gövde, tepede iki pörtlek göz; havada bacaklar uzar
  frog: (c, a) => {
    if (a.air) {
      line(c, [-3, -3, -6, -1.6, -8.4, 0.6], 1.3, '#3a7a24')
      line(c, [3.4, -3, 5.6, -1], 1.1, '#3a7a24')
    } else {
      ell(c, -3.8, -1.9, 2.9, 1.9, '#3a7a24')
      line(c, [3.2, -2.6, 4.4 + a.step * 0.8, -0.6], 1.2, '#3a7a24')
    }
    ell(c, 0, -3.9, 5.2, 3.7, '#5aa83a', '#3a7a24')
    dab(c, 1.2, -2.5, 3, 1.5, '#e8e070')
    ell(c, 0.2, -7.3, 2, 2, '#5aa83a')
    ell(c, 4, -7.1, 2, 2, '#5aa83a')
    eye(c, 0.5, -7.4, 1.3, a.mood, a.t)
    eye(c, 4.3, -7.2, 1.3, a.mood, a.t)
    line(c, [1.6, -4.3, 3.4, -3.9, 5, -4.4], 0.45, INK, false)
  },
  // Tavşan: bembeyaz, iki uzun kulak, ponpon kuyruk
  hare: (c, a) => {
    if (a.air) {
      line(c, [-3, -3, -6.4, -1], 1.5, '#e4e8f0')
      line(c, [2.6, -3.4, 5.4, -1.6], 1.1, '#e4e8f0')
    } else {
      ell(c, -2.2, -1.2, 3.1, 1.2, '#e4e8f0')
      line(c, [2.6, -3, 3, -0.6], 1.1, '#f4f6fa')
    }
    ell(c, -5.4, -4.8, 1.5, 1.5, '#ffffff')
    ell(c, -1, -4.1, 4.5, 3.5, '#f4f6fa', '#c8d0dc')
    const er = a.air ? -0.9 : 0
    ell(c, 1.9 - (a.air ? 1.4 : 0), -10.2 + (a.air ? 1.2 : 0), 1, 2.6, '#f4f6fa', undefined, -0.3 + er)
    ell(c, 3.7 - (a.air ? 1.4 : 0), -10.4 + (a.air ? 1.4 : 0), 1, 2.6, '#f4f6fa', undefined, 0.08 + er)
    if (!a.air) line(c, [3.7, -11.6, 3.8, -9.4], 0.45, '#e8a0b0', false)
    ell(c, 3.4, -7, 2.7, 2.4, '#f4f6fa', '#c8d0dc')
    dab(c, 5.9, -6.6, 0.6, 0.5, '#e8708a')
    eye(c, 3.9, -7.5, 1.15, a.mood, a.t)
  },
  // Koç: yünlü kabarık gövde, koyu yüz, kıvrık koca boynuz
  ram: (c, a) => {
    legs(c, [-3.6, -1.6, 1.6, 3.4], -3.4, '#3a2e28', a.step, 1.1)
    puff(c, -0.8, -5.9, 3.7, 1.9, 8, 2.1, '#efe8d6', '#b8ac90')
    ell(c, 4.9, -6, 2.4, 2.8, '#4e3e34', '#2e2420', 0.25)
    ell(c, 3.6, -8, 2.7, 2.7, '#a8824a', '#6a4c26')
    if (!halo) {
      c.beginPath()
      c.arc(3.6, -8, 1.3, 0.4, Math.PI * 1.7)
      c.strokeStyle = '#5a4022'
      c.lineWidth = 0.55
      c.stroke()
    }
    eye(c, 5.6, -6.3, 1.05, a.mood, a.t)
  },
  // Yarasa: mor, iki yana açılan oymalı kanat, sivri kulak, beyaz diş
  bat: (c, a) => {
    const f = a.flap
    for (const k of [-1, 1]) poly(c, [k * 1.6, -6, k * 7.4, -6.2 - f * 3.2, k * 7.2, -3.2 - f * 1.6, k * 5.4, -4.2 - f * 0.9, k * 4.2, -2 - f * 0.4, k * 2.8, -3.4, k * 1.6, -2.2], '#4a3a5a', '#2a1e34')
    poly(c, [-2.2, -6.4, -2.6, -9.2, -0.6, -7.2], '#3a2c48')
    poly(c, [2.2, -6.4, 2.6, -9.2, 0.6, -7.2], '#3a2c48')
    ell(c, 0, -4.4, 2.9, 3.1, '#5a4670', '#34264a')
    eye(c, -1.2, -5.1, 1, a.mood, a.t)
    eye(c, 1.3, -5.1, 1, a.mood, a.t)
    poly(c, [-0.9, -3.1, -0.5, -1.7, -0.1, -3.1], '#f8f4e8')
    poly(c, [0.3, -3.1, 0.7, -1.7, 1.1, -3.1], '#f8f4e8')
  },
  // Kirpi: sırtı baştan sona sivri diken (üstüne basılmaz), açık renk burun
  hedgehog: (c, a) => {
    legs(c, [-2.6, 2], -1.8, '#c8b48a', a.step, 1)
    const n = 6
    const tips: number[] = []
    shape(
      c,
      () => {
        c.moveTo(-5.6, -0.9)
        for (let i = 0; i < n; i++) {
          const a0 = Math.PI + (i / n) * Math.PI * 0.94
          const a1 = Math.PI + ((i + 0.5) / n) * Math.PI * 0.94
          const a2 = Math.PI + ((i + 1) / n) * Math.PI * 0.94
          if (i === 0) c.lineTo(-1 + Math.cos(a0) * 4.6, -2.6 + Math.sin(a0) * 3.6)
          const tx = -1 + Math.cos(a1) * 7.2
          const ty = -2.6 + Math.sin(a1) * 6.4
          tips.push(tx, ty)
          c.lineTo(tx, ty)
          c.lineTo(-1 + Math.cos(a2) * 4.6, -2.6 + Math.sin(a2) * 3.6)
        }
        c.lineTo(3.6, -0.9)
      },
      '#6a4a30',
      '#3a2618',
    )
    // diken uçları açık renk: sivrilik uzaktan okunsun
    for (let i = 0; i < tips.length; i += 2) line(c, [-1 + (tips[i] + 1) * 0.72, -2.6 + (tips[i + 1] + 2.6) * 0.72, -1 + (tips[i] + 1) * 0.93, -2.6 + (tips[i + 1] + 2.6) * 0.93], 0.55, '#f4e6c4', false)
    ell(c, 4.4, -2.6, 2.8, 2.2, '#e0cfa8', '#b8a47a')
    dab(c, 7, -2.5, 0.75, 0.7, '#1d1a22')
    eye(c, 4.4, -3.3, 1.05, a.mood, a.t)
  },
  // Yaban domuzu: iri koyu gövde, sırtında kıl, yukarı kıvrık beyaz diş
  boar: (c, a) => {
    legs(c, [-3.6, -1.6, 1.8, 3.6], -2.6, '#2e2018', a.step, 1.2)
    poly(c, [-4.6, -7, -3.4, -9.6, -2.2, -7.8, -1, -10, 0.2, -8, 1.4, -9.8, 2.4, -7.4], '#2e2018')
    ell(c, -0.8, -4.9, 5.5, 3.5, '#6a4c38', '#3e2c20')
    poly(c, [2.6, -7.6, 3, -9.8, 4.6, -8], '#3e2c20')
    ell(c, 4.6, -4.5, 3, 2.7, '#80604a', '#4e382a')
    ell(c, 7.2, -3.7, 1.4, 1.6, '#c89a86', '#96705c')
    poly(c, [5.2, -2.6, 5.9, -5.6, 6.6, -2.8], '#f8f4e8')
    eye(c, 4.6, -5.5, 1.1, a.mood, a.t)
  },
  // Keçi: beyaz, geriye kıvrık boynuz, sakal, dik kuyruk
  goat: (c, a) => {
    legs(c, [-3.6, -1.8, 1.8, 3.4], -3.6, '#c8bea8', a.step, 1)
    poly(c, [-5, -7, -6.6, -9.4, -4, -6.4], '#f0eae0')
    ell(c, -0.8, -5.6, 5, 3, '#f0eae0', '#c8bea8')
    line(c, [4, -10, 2.6, -11.9, 0.8, -12], 0.8, '#8a7a5a')
    line(c, [5, -9.9, 4, -12, 2.4, -12.4], 0.8, '#a8966e')
    poly(c, [5.6, -6, 5.4, -3.4, 6.8, -5.8], '#e0d8c8')
    ell(c, 4.9, -8, 2.5, 2.3, '#f0eae0', '#c8bea8')
    ell(c, 7, -7.2, 1.5, 1.3, '#f6f2ea')
    dab(c, 8, -7.4, 0.45, 0.4, '#3a2a20')
    eye(c, 5.1, -8.5, 1.05, a.mood, a.t)
  },
  // Akrep: yassı gövde, başın üstüne kıvrılan iğneli kuyruk, önde iki kıskaç
  scorpion: (c, a) => {
    for (let i = 0; i < 3; i++) {
      const s = (i % 2 ? a.step : -a.step) * 0.6
      line(c, [-2.6 + i * 2.2, -2.2, -3.2 + i * 2.2 + s, -0.5], 0.7, '#7a4a1e')
    }
    line(c, [-4, -3.2, -6.8, -5, -7, -8.6, -4.8, -10.6, -2.4, -10], 1.6, '#a8682c')
    poly(c, [-2.8, -11, 0.4, -8.2, -2, -8.8], '#5a3014')
    line(c, [3.2, -2.4, 6, -2], 1.1, '#96581f')
    ell(c, 7, -2.2, 1.7, 1.3, '#96581f')
    ell(c, -0.4, -2.9, 4.6, 2.2, '#a8682c', '#7a4a1e')
    line(c, [-2.2, -4.7, -2.2, -1.2], 0.35, '#7a4a1e', false)
    line(c, [-0.2, -5, -0.2, -0.9], 0.35, '#7a4a1e', false)
    line(c, [3.2, -3.6, 5.8, -5], 1.1, '#a8682c')
    ell(c, 6.9, -5.6, 2, 1.6, '#b8742e', '#7a4a1e')
    line(c, [6.6, -5.6, 8.6, -5.9], 0.4, INK, false)
    eye(c, 2.6, -3.5, 1.05, a.mood, a.t)
  },
  // Gökçekurt: gri-mavi post, dik sivri kulaklar, kabarık açık uçlu kuyruk, krem çene ve göğüs, keskin bakış;
  // dört ayak ritimle adımlar (çapraz eşler birlikte), saldırıda dişlerini gösterir
  wolf: (c, a) => {
    const FUR = '#7d8ca8'
    const FUR_SH = '#4e5a76'
    const DARK = '#3c4660'
    const CREAM = '#e6eaf2'
    const s = a.step
    // kuyruk: yukarı kıvrık, kabarık; ucu açık
    const wag = Math.sin(a.t * 6) * 0.5
    shape(
      c,
      () => {
        c.moveTo(-4.2, -6.4)
        c.quadraticCurveTo(-7.8, -7.4 + wag, -9.2, -9.6 + wag)
        c.quadraticCurveTo(-8.4, -6.2 + wag, -6.4, -4.6)
      },
      FUR,
      FUR_SH,
    )
    dab(c, -8.6, -9 + wag, 0.8, 0.6, CREAM)
    // bacak: kalça → diz → pati; çapraz eşler aynı yöne
    const leg = (x: number, ph: number, col: string) => {
      const sw = s * ph * 1.5
      const lift = Math.max(0, s * ph) * 0.8
      line(c, [x, -4.2, x + sw * 0.4, -2.2 - lift, x + sw, -0.6 - lift * 0.5], 1.15, col)
      ell(c, x + sw + 0.35, -0.55 - lift * 0.5, 0.75, 0.42, DARK)
    }
    leg(-3.4, -1, FUR_SH)
    leg(2.2, 1, FUR_SH)
    // gövde
    ell(c, -0.6, -5.4, 5.1, 2.8, FUR, FUR_SH)
    dab(c, -1.6, -7.2, 3, 0.6, '#9aa8c0')
    leg(-1.6, 1, FUR)
    leg(3.8, -1, FUR)
    // boyun ve yele, göğüs
    poly(c, [1.8, -7.4, 4.6, -9.6, 5.4, -5.6, 2.6, -3.8], FUR, FUR_SH)
    dab(c, 3.8, -4.8, 1.4, 1.2, CREAM)
    // kulaklar: dik, sivri, içi koyu
    poly(c, [3, -9.4, 3.4, -12.6, 5, -10], FUR_SH)
    poly(c, [4.4, -9.8, 5.6, -12.8, 6.6, -9.4], FUR, FUR_SH)
    poly(c, [5, -10.2, 5.6, -11.9, 6, -10], DARK)
    // baş ve uzun burun
    ell(c, 5, -8, 2.6, 2.3, FUR, FUR_SH)
    poly(c, [6, -8.8, 9.4, -7.2, 9.2, -6, 5.6, -5.8], CREAM, '#b8c0d0')
    dab(c, 6.6, -9.2, 1.3, 0.45, DARK)
    ell(c, 9.3, -7, 0.6, 0.55, '#1d1a22')
    line(c, [7.2, -6.2, 8.8, -6.3], 0.3, INK, false)
    if (a.mood === 'angry') {
      poly(c, [7.2, -6.2, 7.6, -5, 8, -6.2], '#ffffff')
      poly(c, [8.2, -6.25, 8.5, -5.3, 8.8, -6.3], '#ffffff')
    }
    eye(c, 5.6, -8.4, 1.1, a.mood, a.t)
  },
}

/** bilinmeyen tür: iki ayaklı kızıl yumru */
const unknownEnemy: EnemyPainter = (c, a) => {
  legs(c, [-2, 2], -1.6, '#7a2a2a', a.step, 1.3)
  ell(c, 0, -5, 5, 4.4, '#c8503e', '#8a2e28')
  poly(c, [-3, -8.6, -2.4, -11, -1, -9], '#8a2e28')
  poly(c, [1, -9, 2.4, -11, 3, -8.6], '#8a2e28')
  eye(c, -0.6, -5.6, 1.3, a.mood, a.t)
  eye(c, 3, -5.6, 1.3, a.mood, a.t)
}

/**
 * Düşman: (x, y) gövde kutusunun taban ortası (ekran pikseli), sc: bir dünya pikseli kaç ekran pikseli, dir: 1 sağa.
 * Tür adı `art.ts` içindeki `ENEMY_ART` anahtarlarıyla aynıdır (crab, gull, …).
 */
export function drawEnemy(
  c: CanvasRenderingContext2D,
  species: string,
  e: { kind: EnemyKind; state: Enemy['state']; w: number; h: number; phase: number; timer: number },
  x: number,
  y: number,
  sc: number,
  dir: 1 | -1,
  t: number,
): void {
  const paint = ENEMIES[species] ?? unknownEnemy
  const st = e.state
  const flying = e.kind === 'fly' || e.kind === 'bat' || e.kind === 'magpie'
  const perched = e.kind === 'magpie' && (st === 'idle' || st === 'stun')
  const walks = e.kind === 'ground' || e.kind === 'spiky' || e.kind === 'charger'
  const swims = e.kind === 'shark' || e.kind === 'piranha'
  const a: Anim = {
    mood: st === 'stun' ? 'dizzy' : st === 'windup' || st === 'charge' ? 'angry' : 'stern',
    t,
    step: !walks || st === 'windup' || st === 'stun' ? 0 : Math.sin(e.phase * (st === 'charge' ? 34 : 13)),
    flap: swims
      ? Math.sin(t * (e.kind === 'piranha' ? 26 : st === 'charge' ? 24 : st === 'stun' ? 3 : 8) + e.phase)
      : !flying || perched ? 0 : e.kind === 'magpie' ? (st === 'charge' ? 0.55 + Math.sin(t * 30) * 0.25 : Math.sin(t * 34)) : Math.sin(e.phase * (e.kind === 'bat' ? 15 : 19)),
    fold: perched,
    air: st === 'air',
    st,
    open: e.kind === 'piranha' ? 0.5 + 0.5 * Math.sin(t * 12 + e.phase) : st === 'charge' ? 1 : st === 'windup' ? 0.55 + 0.45 * Math.sin(t * 16) : st === 'stun' ? 0.35 : 0,
  }
  // işaret biterken ünlem söner: saldırının geldiği an okunur
  const top = -e.h * 1.25 - 1.5
  c.save()
  c.translate(x, y)
  c.scale(sc, sc)
  c.lineJoin = 'round'
  c.lineCap = 'round'
  setInkWidth(INKW)
  try {
    if (!flying && !swims && st !== 'air') groundShadow(c, e.w * 0.48)
    c.save()
    if (st === 'windup') c.translate(Math.sin(t * 46) * 0.5, 0)
    // köpekbalığı uzun ve yassı: boyuna göre ölçeklenir (10 birim = gövde boyu)
    let kx = e.kind === 'shark' ? e.h / 10 : e.w / 12
    let ky = kx
    if (st === 'windup' && e.kind === 'hopper') {
      kx *= 1.12
      ky *= 0.8
    } else if (st === 'stun') {
      kx *= 1.06
      ky *= 0.9 + Math.sin(t * 5) * 0.02
    } else if (st === 'air') {
      kx *= 0.94
      ky *= 1.08
    }
    if (st === 'charge' && swims) kx *= 1.1
    c.scale(kx * dir, ky)
    if (swims) {
      // yüzme dalgası: hafifçe süzülür; sersemken yan yatar
      c.translate(0, Math.sin(t * 3 + e.phase) * 0.4)
      if (st === 'stun') c.rotate(Math.sin(t * 4) * 0.12 + 0.12)
    } else if (st === 'charge') c.rotate(e.kind === 'magpie' ? 0.42 : 0.17)
    else if (st === 'windup' && e.kind === 'charger') c.rotate(-0.1)
    // dikenli tür daha kalın ve sabit parlar: üstüne basılmaz
    haloW = e.kind === 'spiky' || e.kind === 'shark' ? 0.75 : 0.45 + Math.sin(t * 5 + e.phase) * 0.12
    halo = true
    paint(c, a)
    halo = false
    paint(c, a)
    c.restore()
    if (st === 'windup') bang(c, top, t)
    if (st === 'stun') stars(c, top - 0.5, t)
  } finally {
    halo = false
    setInkWidth(HERO_INKW)
    c.restore()
  }
}

/* ── Kovalayan köpek ──────────────────────────────────────────── */

const DOG = { fur: '#ead6ae', furS: '#c4a676', far: '#bfa071', mask: '#2e2420', maskL: '#4a3a32', collar: '#7a3a24', stud: '#e8e2d4', mouth: '#7a1c2a', tongue: '#e8687a' }

/** köpek bacağı: (x, y) omuz ya da kalça, a1 üst, a2 alt kemiğin dikeyden açısı (radyan, + ileri); ucunda pati */
function dogLeg(c: Ctx, x: number, y: number, a1: number, a2: number, color: string, l1 = 3.7, l2 = 3.5) {
  const kx = x + Math.sin(a1) * l1
  const ky = y + Math.cos(a1) * l1
  const fx = kx + Math.sin(a2) * l2
  const fy = ky + Math.cos(a2) * l2
  line(c, [x, y, kx, ky, fx, fy], 2, color)
  ell(c, fx + 0.5, fy - 0.2, 1.25, 0.8, color)
}

/** köpeğin başı: (0, 0) kafatasının ortası, burun +x; open 0..1 ağız, ear -1..1 kulak savrulması */
function dogHead(c: Ctx, t: number, open: number, ear: number, mood: Mood) {
  const g = open
  // uzak kulak: kafanın ardında, ucu görünür
  poly(c, [-0.6, -3.4, -3.2 - ear * 0.6, -2.6, -3.4 - ear * 0.8, 0.6, -1.4, -0.6], DOG.mask)
  // açık ağızda alt çene aşağı döner; içi kırmızı, dişler beyaz
  if (g > 0.08) {
    c.save()
    c.translate(2.6, 1.6)
    c.rotate(0.85 * g)
    poly(c, [-0.4, -0.6, 5.4, -0.4, 5.2, 1, 0, 1.4], DOG.mask, '#18100c')
    if (!halo) {
      c.fillStyle = '#fffaf0'
      for (const x of [2.6, 4.2]) {
        c.beginPath()
        c.moveTo(x, -0.5)
        c.lineTo(x + 0.4, -1.6)
        c.lineTo(x + 0.8, -0.5)
        c.fill()
      }
    }
    c.restore()
    if (!halo) {
      c.beginPath()
      c.moveTo(2.4, 1.2)
      c.lineTo(7.6 - g * 0.6, 0.9)
      c.lineTo(6.8 - g * 1.8, 1.4 + g * 4.4)
      c.closePath()
      c.fillStyle = DOG.mouth
      c.fill()
      ell(c, 4.6, 1.8 + g * 1.2, 1.4, 0.7, DOG.tongue)
    }
  }
  ell(c, 0, 0, 4.2, 3.7, DOG.fur, DOG.furS)
  // namlu: kara maske burna doğru uzar; ağız açılınca üst çene biraz kalkar
  c.save()
  c.translate(2.4, 0.6)
  c.rotate(-0.3 * g)
  shape(
    c,
    () => {
      c.moveTo(-0.6, -2.2)
      c.quadraticCurveTo(3, -2.6, 5.4, -1.4)
      c.quadraticCurveTo(6.4, -0.2, 5.6, 1)
      c.quadraticCurveTo(2.6, 1.8, -0.4, 1.4)
      c.quadraticCurveTo(-1.4, -0.4, -0.6, -2.2)
    },
    DOG.mask,
    '#18100c',
  )
  dab(c, 5.3, -1.2, 0.95, 0.75, '#0e0806')
  dab(c, 5.1, -1.5, 0.35, 0.22, 'rgba(255,255,255,0.55)')
  if (!halo) line(c, [2, 0.6, 3.6, 1, 5, 0.6], 0.35, '#5a4a42', false)
  c.restore()
  // gözün çevresinde kara maske lekesi (Kangal), göz yine okunur
  dab(c, 1.6, -1.1, 1.7, 1.45, DOG.maskL)
  eye(c, 1.6, -1.2, 0.95, mood, t)
  // kapalı ağız: dil yandan sarkar (koşarken soluk soluğa)
  if (g <= 0.08 && !halo) {
    c.beginPath()
    c.ellipse(4.4, 2.8, 0.85, 1.3 + Math.sin(t * 14) * 0.2, 0.2, 0, TAU)
    c.fillStyle = DOG.tongue
    c.fill()
    c.strokeStyle = INK
    c.lineWidth = 0.35
    c.stroke()
  }
  // yakın kulak: kafanın arkasında sarkar, koşuda savrulur
  poly(c, [-0.4, -3.6, -2.8 - ear * 1.1, -2.8 - ear * 0.6, -3.4 - ear * 1.2, 1.4 - ear * 0.6, -1.4, 0.8, -0.6, -1.2], DOG.mask, '#18100c')
}

/** kıvrık kuyruk: (x, y) kökü, wag -1..1 */
function dogTail(c: Ctx, x: number, y: number, wag: number, up: number) {
  line(c, [x, y, x - 2.2, y - 2.4 * up, x - 1.6 + wag * 1.4, y - 4.6 * up, x + 0.4 + wag * 1.8, y - 5 * up], 1.9, DOG.fur)
  if (!halo) line(c, [x - 0.8, y - 1.6 * up, x - 1.4 + wag * 0.6, y - 3.4 * up], 0.6, DOG.furS, false)
}

/** çivili tasma: (x, y) boyun, açı a */
function dogCollar(c: Ctx, x: number, y: number, a: number) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  ell(c, 0, 0, 1.1, 2.8, DOG.collar)
  if (!halo) for (const yy of [-1.6, 0, 1.6]) dab(c, 0.3, yy, 0.42, 0.42, DOG.stud)
  c.restore()
}

/**
 * Kovalayan köpek (Kangal cinsi iri çoban köpeği): açık bej post, kara maske ve kulak, çivili tasma, kıvrık kuyruk.
 * (x, y) ayak tabanı orta noktası (ekran pikseli), scale: bir dünya pikseli kaç ekran pikseli; gövde ~22 px uzun,
 * ~14 px yüksek. flip: sola bakar. state: 'run' dörtnala (t ile döner), 'wait' oturup havlamaya hazır (kuyruk sallar),
 * 'bite' ağzı açık hamle. Düşmandır: kırmızı haleyle (iki geçiş) çizilir; dost Kangal'dan büyük, kaşı çatık, tasmalı.
 */
export function drawChaseDog(c: CanvasRenderingContext2D, x: number, y: number, scale: number, t: number, flip: boolean, state: 'run' | 'wait' | 'bite'): void {
  begin(c, x, y, scale)
  if (flip) c.scale(-1, 1)
  const paint = () => {
    if (state === 'wait') {
      // oturuş: arka kalça yerde, ön bacaklar dik, gövde yukarı kalkık; arada bir havlar (ağız açılır, baş kalkar)
      const bark = Math.max(0, Math.sin(t * 4.2)) ** 6
      const wag = Math.sin(t * 11)
      dogTail(c, -7.6, -1.6, wag, 0.8)
      dogLeg(c, 3.2, -8, 0.04, 0.02, DOG.far, 4, 3.8)
      ell(c, -1.4, -7.2, 5.6, 5, DOG.fur, DOG.furS, -0.9)
      ell(c, -4.4, -3, 4, 3, DOG.fur, DOG.furS)
      // arka pati önde, kalçanın altında
      ell(c, -1.6, -0.8, 2.2, 0.9, DOG.furS)
      dab(c, -0.6, -6.6, 2.4, 3.2, '#f6ead0', -0.9)
      // boyun ve göğüs: başı gövdeye bağlar
      ell(c, 3.4, -10.4, 3, 4.4, DOG.fur, DOG.furS, 0.25)
      dab(c, 4.2, -8.8, 1.6, 2.6, '#f6ead0', 0.25)
      dogCollar(c, 3.8, -12.4, -0.3)
      dogLeg(c, 4.6, -8.2, -0.02, 0.04, DOG.fur, 4, 4)
      c.save()
      c.translate(6.2, -14.4 - bark * 0.8)
      c.rotate(-0.12 - bark * 0.25)
      dogHead(c, t, bark * 0.8, Math.sin(t * 3) * 0.2, bark > 0.3 ? 'angry' : 'stern')
      c.restore()
      return
    }
    const bite = state === 'bite'
    // dörtnal: saniyede ~2,6 adım; ön ve arka çiftler karşıt, yakın-uzak arasında küçük gecikme
    const g = t * TAU * 2.6
    const bob = bite ? -1.6 : -1.1 * (0.5 + 0.5 * Math.cos(g * 2))
    const pitch = bite ? -0.12 : Math.sin(g) * 0.07
    c.save()
    c.translate(0, bob)
    c.rotate(pitch)
    const front = (k: number) => {
      const s = bite ? 1 : Math.sin(g + k)
      const a1 = bite ? 0.95 : 0.15 + 0.7 * s
      return [a1, a1 + (bite ? 0.5 : 0.55 * Math.max(0, Math.cos(g + k)))] as const
    }
    const hind = (k: number) => {
      const s = bite ? -1 : Math.sin(g + Math.PI + k)
      const a1 = 0.3 + 0.7 * s
      return [a1, a1 - 0.8 + (bite ? 0.4 : 0)] as const
    }
    const wag = Math.sin(t * (bite ? 6 : 9))
    dogTail(c, -8.6, -9.6, wag * 0.8, bite ? 0.6 : 1)
    const ff = front(0.45)
    const hf = hind(0.45)
    dogLeg(c, 4.6, -7.2, ff[0], ff[1], DOG.far)
    dogLeg(c, -6.2, -7.6, hf[0], hf[1], DOG.far)
    // gövde: göğüs dolgun, bel ince, sırt hafif kavisli
    shape(
      c,
      () => {
        c.moveTo(-9.4, -10.4)
        c.quadraticCurveTo(-2, -12.8, 5, -11.4)
        c.quadraticCurveTo(8.6, -10.6, 8.2, -7)
        c.quadraticCurveTo(7.4, -4.6, 4.4, -4.8)
        c.quadraticCurveTo(-0.6, -6, -4.6, -5.6)
        c.quadraticCurveTo(-9, -5.2, -10.2, -7.4)
        c.quadraticCurveTo(-10.8, -9.4, -9.4, -10.4)
      },
      DOG.fur,
      DOG.furS,
    )
    dab(c, 4.6, -7.4, 2.4, 1.8, '#f6ead0')
    if (!halo) line(c, [-6.4, -11.2, -1.6, -12.2, 3, -11.6], 0.7, 'rgba(255,255,255,0.4)', false)
    const fn = front(0)
    const hn = hind(0)
    dogLeg(c, -6.6, -7.2, hn[0], hn[1], DOG.fur)
    dogLeg(c, 5.2, -6.8, fn[0], fn[1], DOG.fur)
    dogCollar(c, 6.8, -10.6, 0.35)
    c.save()
    c.translate(10, -12.2 + (bite ? 1.4 : Math.sin(g * 2) * 0.3))
    c.rotate(bite ? 0.16 : -0.04)
    dogHead(c, t, bite ? 1 : 0, bite ? -0.8 : Math.sin(g + 1.2) * 0.9, 'angry')
    c.restore()
    c.restore()
  }
  try {
    groundShadow(c, state === 'wait' ? 7 : 9)
    haloW = 0.55 + Math.sin(t * 5) * 0.12
    halo = true
    paint()
    halo = false
    paint()
  } finally {
    halo = false
    end(c)
  }
}

/* ── Dost hayvanlar ───────────────────────────────────────────── */

interface Pal {
  t: number
  happy: boolean
  /** kuyruk salınımı -1..1 */
  wag: number
}

type FriendPainter = (c: Ctx, p: Pal) => void

function blush(c: Ctx, x: number, y: number) {
  dab(c, x, y, 0.9, 0.6, 'rgba(240,120,130,0.55)')
}

/** oturan kedi: renk ve göz rengi kılığa göre */
function cat(c: Ctx, p: Pal, fur: string, sh: string, stripe: string | null, eyes: [string, string] | null) {
  line(c, [-3.6, -1.6, -6.4, -2, -7 + p.wag * 1.2, -5.6, -6 + p.wag * 1.6, -7.6], 1.3, fur)
  ell(c, -0.8, -3.6, 4.3, 3.6, fur, sh)
  if (stripe) for (const x of [-3, -1.2]) line(c, [x, -6.6, x - 0.4, -4.8], 0.6, stripe, false)
  line(c, [1.2, -2.6, 1.2, -0.6], 1.3, fur)
  line(c, [3, -2.6, 3, -0.6], 1.3, fur)
  poly(c, [0.6, -8.6, 0.8, -11.6, 2.9, -9.6], fur)
  poly(c, [3.6, -9.7, 5.6, -11.6, 5.8, -8.6], fur)
  ell(c, 3.2, -7.2, 3.2, 2.8, fur, sh)
  if (eyes && !p.happy) {
    dab(c, 2.2, -7.4, 0.95, 0.95, eyes[0])
    dab(c, 4.8, -7.4, 0.95, 0.95, eyes[1])
    dab(c, 2.3, -7.4, 0.4, 0.7, INK)
    dab(c, 4.9, -7.4, 0.4, 0.7, INK)
  } else {
    softEye(c, 2.2, -7.4, 0.75, p.happy)
    softEye(c, 4.8, -7.4, 0.75, p.happy)
  }
  dab(c, 3.6, -6.3, 0.45, 0.35, '#e8708a')
  line(c, [5.4, -6.3, 7.4, -6.8], 0.25, INK, false)
  line(c, [5.4, -5.9, 7.4, -5.6], 0.25, INK, false)
  if (p.happy) blush(c, 1.6, -6.2)
}

const FRIENDS: Record<string, FriendPainter> = {
  cat: (c, p) => cat(c, p, '#e8983e', '#b86e24', '#b06a24', null),
  // Van kedisi: bembeyaz, bir gözü mavi bir gözü kehribar
  vanCat: (c, p) => cat(c, p, '#f8f6f0', '#d4cfc6', null, ['#4a8ad8', '#e0b040']),
  // Ankara keçisi: lüle lüle tiftik, küçük boynuz, sarkık kulak
  angora: (c, p) => {
    line(c, [-3.4, -2.6, -3.4, -0.6], 1.2, '#d8d0c4')
    line(c, [-1.4, -2.6, -1.4, -0.6], 1.2, '#e8e2d8')
    line(c, [1.6, -2.6, 1.6, -0.6], 1.2, '#d8d0c4')
    line(c, [3.4, -2.6, 3.4, -0.6], 1.2, '#e8e2d8')
    ell(c, -6, -6 + p.wag * 0.5, 1.3, 1.1, '#f8f4ec')
    puff(c, -0.6, -5.4, 4, 2.4, 9, 2, '#f8f4ec', '#d4cabc')
    for (const [x, y] of [[-2.6, -5.6], [0, -4.4], [1.6, -6.2], [-1, -6.8]] as const) {
      if (halo) break
      c.beginPath()
      c.arc(x, y, 0.8, 0.5, Math.PI * 1.6)
      c.strokeStyle = '#c8bcac'
      c.lineWidth = 0.35
      c.stroke()
    }
    line(c, [4.4, -10, 3.4, -11.8, 2, -11.9], 0.8, '#b8a888')
    ell(c, 4.8, -8.2, 2.6, 2.4, '#f8f4ec', '#d4cabc')
    ell(c, 2.9, -8, 0.9, 1.6, '#e8dccc', undefined, 0.5)
    ell(c, 6.8, -7.2, 1.5, 1.3, '#fbf8f2')
    dab(c, 7.7, -7.4, 0.4, 0.35, '#c88a8a')
    poly(c, [5.6, -6, 5.6, -4, 6.8, -5.8], '#efe8dc')
    softEye(c, 5.2, -8.7, 0.75, p.happy)
    if (p.happy) blush(c, 4.4, -7.4)
  },
  // Flamingo: pembe, tek ayak üstünde, S boyun, ucu siyah gaga
  flamingo: (c, p) => {
    line(c, [0.4, -6, 0.4, -0.5], 0.6, '#d8707a')
    line(c, [-0.8, -6, -1.6, -3.6, 0.2, -3], 0.6, '#d8707a')
    poly(c, [-2.4, -8.6, -5.6, -7.4 + p.wag * 0.4, -2.4, -6.2], '#e88898')
    ell(c, -0.2, -7.8, 3.6, 2.6, '#f6a4b2', '#d8707a')
    line(c, [2.4, -8.4, 4.2, -9.8, 3, -11.8, 3.8, -13.4], 1.2, '#f6a4b2')
    ell(c, 4.2, -14, 1.7, 1.5, '#f6a4b2', '#d8707a')
    poly(c, [5.4, -14.6, 7.4, -13.6, 6.6, -12, 5.4, -13.2], '#f8ece0')
    poly(c, [6.9, -13.4, 7.4, -13.6, 6.6, -12], '#2a2220')
    softEye(c, 4.5, -14.3, 0.55, p.happy)
  },
  // İnek: beyaz üstüne siyah benek, pembe burun, küçük boynuz
  cow: (c, p) => {
    line(c, [-6.4, -7.6, -7.8 + p.wag * 0.8, -4.6], 0.6, '#f4efe6')
    ell(c, -7.8 + p.wag * 0.9, -4, 0.8, 1, '#2a2420')
    for (const x of [-4.6, -2.6, 2, 3.8]) line(c, [x, -3.4, x, -1], 1.4, x === -2.6 || x === 3.8 ? '#f4efe6' : '#d8d0c2')
    for (const x of [-4.6, -2.6, 2, 3.8]) dab(c, x, -0.7, 0.8, 0.6, '#2a2420')
    ell(c, -0.2, -2.9, 1.6, 1.1, '#f0a8b0')
    ell(c, -1, -6.2, 6.2, 3.7, '#f8f4ec', '#cfc8ba')
    dab(c, -3.4, -7, 2, 1.5, '#2a2420', 0.3)
    dab(c, 0.6, -5, 1.6, 1.2, '#2a2420', -0.2)
    line(c, [4.6, -10.6, 4.2, -12], 0.7, '#e8dcb8')
    line(c, [7, -10.6, 7.6, -12], 0.7, '#e8dcb8')
    ell(c, 3.6, -9.8, 1.4, 0.9, '#2a2420', undefined, -0.4)
    ell(c, 6, -8.6, 2.8, 2.6, '#f8f4ec', '#cfc8ba')
    ell(c, 7.2, -7, 2.1, 1.5, '#f4b4b8', '#d88c94')
    dab(c, 6.6, -7, 0.3, 0.4, '#8a4a52')
    dab(c, 7.9, -7, 0.3, 0.4, '#8a4a52')
    softEye(c, 5.4, -9.2, 0.7, p.happy)
    softEye(c, 7.4, -9.2, 0.7, p.happy)
  },
  // Kangal: boz gövde, kara maske ve kulak, sırta kıvrık kuyruk
  kangal: (c, p) => {
    line(c, [-5.6, -7, -7.4 + p.wag, -9.6, -5.4 + p.wag * 1.4, -11], 1.5, '#d9c49a')
    for (const x of [-4.2, -2.4, 2, 3.8]) line(c, [x, -3.6, x, -0.7], 1.4, x === -2.4 || x === 3.8 ? '#d9c49a' : '#b8a070')
    ell(c, -0.8, -5.8, 5.6, 3.3, '#d9c49a', '#b8a070')
    ell(c, 5, -9, 3, 2.8, '#d9c49a', '#b8a070')
    ell(c, 7.2, -8, 1.9, 1.6, '#3a2e28')
    poly(c, [2.6, -10.6, 2, -7.4, 4, -9.6], '#3a2e28')
    softEye(c, 5.2, -9.6, 0.75, p.happy)
    if (p.happy) ell(c, 7, -6.4, 0.8, 1.1, '#f07a8a')
  },
  // At: doru, koyu yele ve kuyruk, uzun bacak
  horse: (c, p) => {
    line(c, [-6.2, -9, -8 + p.wag * 0.8, -6.4, -7.6 + p.wag, -3.4], 1.5, '#3a261a')
    for (const x of [-4.4, -2.6, 2.2, 4]) line(c, [x, -5.6, x, -0.8], 1.2, x === -2.6 || x === 4 ? '#8a5a36' : '#6a4226')
    for (const x of [-4.4, -2.6, 2.2, 4]) dab(c, x, -0.6, 0.75, 0.55, '#2a1a12')
    ell(c, -0.8, -7.6, 5.8, 3.2, '#8a5a36', '#5e3a20')
    poly(c, [2.4, -9.4, 5, -13.6, 7.4, -12.4, 5.2, -6.6], '#8a5a36', '#5e3a20')
    poly(c, [2.4, -9.6, 4.4, -14.2, 5.6, -13.6, 3.6, -9], '#3a261a')
    ell(c, 7, -12.6, 2.9, 1.9, '#8a5a36', '#5e3a20', 0.45)
    poly(c, [4.8, -14, 5.2, -16, 6.4, -14.2], '#8a5a36')
    dab(c, 8.9, -11.5, 0.35, 0.3, '#2a1a12')
    softEye(c, 6.6, -13.2, 0.7, p.happy)
  },
  // Keklik: tombul boz gövde, kırmızı gaga ve ayak, boyunda kara gerdanlık, yanı çizgili
  partridge: (c, p) => {
    const peck = !p.happy && Math.sin(p.t * 2) > 0.8 ? 1 : 0
    line(c, [-0.8, -1.6, -0.8, -0.4], 0.6, '#e0303a')
    line(c, [1.2, -1.6, 1.2, -0.4], 0.6, '#e0303a')
    poly(c, [-3.4, -4.6, -6.4, -3.6 + p.wag * 0.4, -3.4, -2.4], '#8a8070')
    ell(c, 0, -4, 4.4, 3.4, '#b8ac98', '#8a8070')
    for (const x of [-1.8, -0.4, 1]) line(c, [x, -3.6, x - 0.5, -1.6], 0.5, '#5a3a2a', false)
    ell(c, 3.2, -6.8 + peck, 2.4, 2.2, '#c4b8a4', '#8a8070')
    dab(c, 3.8, -6 + peck, 1.3, 1, '#f4ead8')
    line(c, [1.6, -6.6 + peck, 3, -4.8 + peck, 5, -5.6 + peck], 0.5, '#2a2220', false)
    poly(c, [5.2, -7.4 + peck, 7.2, -6.6 + peck, 5.2, -5.9 + peck], '#e0303a')
    softEye(c, 3.9, -7.4 + peck, 0.6, p.happy)
  },
  // Hitit aslanı: kaide üstünde taş heykel
  lion: (c, p) => {
    poly(c, [-7.4, 0, -7.4, -3.4, 7.4, -3.4, 7.4, 0], '#8a7a5e', '#5e5038')
    line(c, [-6.4, -1.7, 6.4, -1.7], 0.35, '#5e5038', false)
    line(c, [-4.4, -5.6, -7, -6.4, -6.6 + p.wag * 0.5, -9.6], 1.1, '#a8956e')
    ell(c, -1.2, -6.6, 4.6, 3.2, '#b8a47c', '#8a7654')
    line(c, [1.4, -6, 1.4, -4], 1.5, '#b8a47c')
    line(c, [3.2, -6, 3.2, -4], 1.5, '#b8a47c')
    puff(c, 3.4, -10, 2.4, 2.4, 8, 1.4, '#8a7654', '#6a583c')
    ell(c, 4, -9.8, 2.5, 2.4, '#c4b088', '#8a7654')
    dab(c, 5.8, -9.2, 0.5, 0.4, '#5e5038')
    softEye(c, 3.4, -10.2, 0.6, p.happy)
    softEye(c, 5.2, -10.2, 0.6, p.happy)
  },
  // Caretta caretta: kızıl kahve kabuk, sarı karın ve yüzgeç, iri baş; kumda ağır ağır
  turtle: (c, p) => {
    const SKIN = '#ecd08a'
    const SKIN_SH = '#c4a05a'
    const fin = (x: number, y: number, len: number, rot: number, fill: string) =>
      shape(
        c,
        () => {
          const cs = Math.cos(rot)
          const sn = Math.sin(rot)
          const at = (u: number, v: number): [number, number] => [x + u * cs - v * sn, y + u * sn + v * cs]
          c.moveTo(...at(0, -0.9))
          c.quadraticCurveTo(...at(len * 0.6, -1.5), ...at(len, 0))
          c.quadraticCurveTo(...at(len * 0.5, 1.3), ...at(0, 0.9))
        },
        fill,
        SKIN_SH,
      )
    fin(-4.6, -2.4, 3.6, 2.7 + p.wag * 0.12, SKIN)
    fin(-0.6, -2, 2.6, 2.2, SKIN_SH)
    line(c, [4, -3.4, 6.2, -4.6], 1.9, SKIN)
    shape(
      c,
      () => {
        c.moveTo(-6.2, -2.4)
        c.bezierCurveTo(-6.6, -8.8, 4.8, -9.2, 5.2, -2.6)
        c.quadraticCurveTo(-0.5, -1.4, -6.2, -2.4)
      },
      '#c9783c',
      '#96521f',
    )
    // kabuk pulları
    line(c, [-4.2, -4.6, -2.6, -6.6, 0.6, -7, 3, -5.2], 0.3, '#7e4218', false)
    line(c, [-2.6, -6.6, -2, -3.4], 0.3, '#7e4218', false)
    line(c, [0.6, -7, 0.8, -3.4], 0.3, '#7e4218', false)
    line(c, [-4.2, -4.6, 3.4, -4.4], 0.3, '#7e4218', false)
    dab(c, -3.2, -6.4, 1.3, 0.5, '#e8a468', -0.6)
    line(c, [-6, -2.5, -0.5, -1.7, 5, -2.7], 0.9, '#f0d890')
    ell(c, 7.3, -5.2, 2.4, 2.1, SKIN, SKIN_SH)
    dab(c, 6.2, -6.4, 0.7, 0.45, '#c9783c', -0.3)
    dab(c, 7.6, -6.9, 0.55, 0.35, '#c9783c')
    line(c, [8.3, -4.2, 9.4, -4.5], 0.25, INK, false)
    softEye(c, 8, -5.6, 0.72, p.happy)
    if (p.happy) blush(c, 6.8, -4.3)
    // ön kürek yüzgeç
    fin(1.8, -2.4, 4.4, 0.62 + p.wag * 0.1, SKIN)
    dab(c, 3.2, -1.5, 0.32, 0.26, '#c9783c')
    dab(c, 4.3, -0.8, 0.28, 0.22, '#c9783c')
  },
}

/** bilinmeyen dost: sarı civciv */
const unknownFriend: FriendPainter = (c, p) => {
  line(c, [-1, -1.4, -1, -0.4], 0.6, '#e08a2e')
  line(c, [1, -1.4, 1, -0.4], 0.6, '#e08a2e')
  ell(c, 0, -4.4, 4, 3.8, '#f6d45a', '#d0a432')
  poly(c, [3.6, -5.4, 5.6, -4.6, 3.6, -3.9], '#e08a2e')
  softEye(c, 2, -5.4, 0.7, p.happy)
}

/** dostların boyu (kalbin çıkacağı yer) */
const FRIEND_TOP: Record<string, number> = { flamingo: 16, horse: 16, cow: 12.5, lion: 13, turtle: 10 }

function heart(c: Ctx, x: number, y: number, s: number) {
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  c.beginPath()
  c.moveTo(0, 1.6)
  c.bezierCurveTo(-3.4, -0.8, -1.6, -3, 0, -1.2)
  c.bezierCurveTo(1.6, -3, 3.4, -0.8, 0, 1.6)
  c.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = INK
  c.lineWidth = 0.8
  c.stroke()
  c.fillStyle = '#ff6a8a'
  c.fill()
  c.restore()
}

/**
 * Dost hayvan (şehrin hayvanı): (x, y) taban ortası (ekran pikseli). Sevilince (happy) zıplar, gözleri güler, kalp çıkar.
 * Sola bakar (eski sprite'larla aynı yön).
 */
export function drawFriend(c: CanvasRenderingContext2D, animal: string, x: number, y: number, sc: number, t: number, happy: boolean): void {
  const paint = FRIENDS[animal] ?? unknownFriend
  const statue = animal === 'lion'
  c.save()
  c.translate(x, y)
  // dost hayvan dekordur: düşmandan küçük, ince hatlı ve hafif saydam; göz yormaz, "tehlike" ya da "toplanacak" okunmaz
  const soft = 0.82
  c.scale(sc * soft, sc * soft)
  c.globalAlpha = happy ? 1 : 0.85
  c.lineJoin = 'round'
  c.lineCap = 'round'
  setInkWidth(INKW * 0.7)
  halo = false
  try {
    groundShadow(c, 6)
    c.save()
    const hop = happy && !statue ? Math.abs(Math.sin(t * 9)) : 0
    c.translate(0, -hop * 1.6)
    c.scale(-(1 + hop * 0.04), 1 - hop * 0.04 + (happy ? 0 : Math.sin(t * 2.2) * 0.012))
    paint(c, { t, happy, wag: Math.sin(t * (happy ? 16 : 3)) })
    c.restore()
    if (happy) {
      const k = (t * 1.1) % 1
      c.globalAlpha = 1 - k * k
      heart(c, -4 + Math.sin(t * 5) * 0.8, -(FRIEND_TOP[animal] ?? 12.5) - 2 - k * 5, 0.75 + k * 0.25)
      c.globalAlpha = 1
    }
  } finally {
    setInkWidth(HERO_INKW)
    c.restore()
  }
}

/* ── Hatıralar ────────────────────────────────────────────────── */

type ItemPainter = (c: Ctx) => void

const KEEPSAKES: Record<CityKey, ItemPainter> = {
  // Kiraz: sapları tepede birleşmiş iki parlak Giresun kirazı, yanında bir yaprak
  giresun: (c) => {
    line(c, [-2.6, 1, -1.2, -3.2, 0.6, -5.4], 0.6, '#5a7a2a')
    line(c, [2.8, 1.8, 2, -2.4, 0.6, -5.4], 0.6, '#5a7a2a')
    shape(
      c,
      () => {
        c.moveTo(0.6, -5.4)
        c.quadraticCurveTo(3.4, -7.6, 5.8, -5.2)
        c.quadraticCurveTo(3, -3.6, 0.6, -5.4)
      },
      '#6cb044',
      '#3e7a2a',
    )
    line(c, [1.4, -5.4, 4.6, -5.4], 0.25, '#3e7a2a', false)
    ell(c, -2.6, 2.6, 3, 2.8, '#d0243a', '#8a1426')
    ell(c, 2.8, 3.2, 3, 2.8, '#c01e34', '#7e1222')
    for (const [x, y] of [[-2.6, 0.1], [2.8, 0.7]] as const) dab(c, x, y + 0.2, 0.5, 0.3, '#6a1020')
    dab(c, -3.7, 1.7, 0.9, 0.6, '#ff9aa4', -0.5)
    dab(c, 1.7, 2.3, 0.9, 0.6, '#ff9aa4', -0.5)
    dab(c, -4, 2.9, 0.3, 0.3, '#ffe4e8')
  },
  // Yazma: tahta kalıpla basılmış kare yemeni; çivit kenar, kök boya kırmızısı çiçekler, iki kenarı saçaklı
  tokat: (c) => {
    for (let i = 1; i < 7; i++) {
      const k = i / 7
      line(c, [-6 + k * 6, k * 6, -7.1 + k * 6, k * 6 + 1.1], 0.55, '#2e4a9a', false)
      line(c, [k * 6, 6 - k * 6, k * 6 + 1.1, 7.1 - k * 6], 0.55, '#2e4a9a', false)
    }
    poly(c, [0, -6, 6, 0, 0, 6, -6, 0], '#f4ead8', '#d8c8a8')
    if (!halo) {
      c.save()
      c.beginPath()
      c.moveTo(0, -6)
      c.lineTo(6, 0)
      c.lineTo(0, 6)
      c.lineTo(-6, 0)
      c.closePath()
      c.clip()
      // çivit kenar şeridi
      c.strokeStyle = '#2e4a9a'
      c.lineWidth = 1.1
      c.beginPath()
      c.moveTo(0, -4.9)
      c.lineTo(4.9, 0)
      c.lineTo(0, 4.9)
      c.lineTo(-4.9, 0)
      c.closePath()
      c.stroke()
      // kalıp baskısı: ortada iri çiçek, köşelerde küçükleri
      for (let a = 0; a < 5; a++) {
        const an = (a / 5) * TAU - Math.PI / 2
        dab(c, Math.cos(an) * 1.3, Math.sin(an) * 1.3, 0.95, 0.95, '#b8302a')
      }
      dab(c, 0, 0, 0.7, 0.7, '#e8b84a')
      for (const [x, y] of [[0, -3.3], [3.3, 0], [0, 3.3], [-3.3, 0]] as const) {
        dab(c, x, y, 0.65, 0.65, '#b8302a')
        dab(c, x, y, 0.25, 0.25, '#2e4a9a')
      }
      for (const [x, y] of [[-1.7, -1.7], [1.7, -1.7], [1.7, 1.7], [-1.7, 1.7]] as const) dab(c, x, y, 0.55, 0.3, '#3e7a3a', Math.atan2(y, x))
      c.restore()
    }
  },
  // Havlu: Denizli pamuğundan üst üste katlı iki havlu; çizgili kenar, ucundan sarkan saçak
  denizli: (c) => {
    const towel = (y: number, h: number, fill: string, sh: string, band: string) => {
      for (let i = 0; i < 6; i++) line(c, [4.6, y - h / 2 + 0.6 + i * (h - 1.2) / 5, 6.2, y - h / 2 + 0.9 + i * (h - 1.2) / 5], 0.35, '#e8e0d0', false)
      shape(c, () => c.roundRect(-5.4, y - h / 2, 10, h, [h / 2, 0.6, 0.6, h / 2]), fill, sh)
      if (!halo) {
        c.fillStyle = band
        c.fillRect(1.4, y - h / 2 + 0.4, 0.8, h - 0.8)
        c.fillRect(2.9, y - h / 2 + 0.4, 0.5, h - 0.8)
        c.fillRect(-3.4, y - h / 2 + 0.4, 0.5, h - 0.8)
        c.strokeStyle = sh
        c.lineWidth = 0.3
        c.beginPath()
        c.moveTo(-3, y)
        c.lineTo(4.2, y)
        c.stroke()
      }
    }
    towel(3, 5, '#9ad0e8', '#5e9ec0', '#2e6aa0')
    towel(-2.2, 5, '#fbfaf4', '#d4d0c4', '#d0402a')
    dab(c, -3.6, -3.6, 1.2, 0.5, '#ffffff', -0.2)
  },
  // Madenci lambası: pirinç kapak ve gövde, kafesli cam, içinde sarı alev; tepesinde asma halkası
  zonguldak: (c) => {
    const BRASS = '#dcaa4a'
    const BRASS_SH = '#94661e'
    dab(c, 0, -0.4, 5, 5.2, 'rgba(255,196,90,0.3)')
    ring(c, 0, -6.7, 1.15, 0.55, '#c8963a')
    // cam: soluk turkuaz, içi alevle aydınlık
    shape(c, () => c.roundRect(-2.5, -3.8, 5, 6.4, 0.7), '#f4e6b8')
    if (!halo) {
      c.fillStyle = 'rgba(255,214,120,0.55)'
      c.beginPath()
      c.ellipse(0, -0.4, 2.1, 2.8, 0, 0, TAU)
      c.fill()
    }
    // alev: damla biçimi, ortası beyaz-sarı
    shape(
      c,
      () => {
        c.moveTo(0, -2.9)
        c.quadraticCurveTo(1.4, -0.6, 1, 0.6)
        c.quadraticCurveTo(0, 1.6, -1, 0.6)
        c.quadraticCurveTo(-1.4, -0.6, 0, -2.9)
      },
      '#ffa52a',
    )
    dab(c, 0, 0, 0.5, 0.9, '#fff6c0')
    // kafes telleri
    for (const x of [-1.7, 1.7]) line(c, [x, -3.8, x, 2.6], 0.45, BRASS_SH)
    // üst kapak ve taban
    poly(c, [-3, -3.6, 3, -3.6, 2, -5.6, -2, -5.6], BRASS, BRASS_SH)
    shape(c, () => c.roundRect(-3.2, 2.4, 6.4, 3.6, 0.9), BRASS, BRASS_SH)
    line(c, [-3, 3.8, 3, 3.8], 0.35, BRASS_SH, false)
    dab(c, -2.1, 3.4, 0.5, 1.2, '#fff0c0')
    dab(c, -1.2, -4.6, 0.8, 0.35, '#fff0c0')
  },
  // İncir: yaprağın üstünde morarmış damla biçimli bir meyve ve ikiye bölünmüş dilimi (kırmızımsı iç, çekirdek taneleri)
  aydin: (c) => {
    poly(c, [-6.6, 5.4, -5.6, 2.2, -3.8, 3.8, -3, 0.8, -1.4, 3.4, 0.2, 2.4, 0.6, 5.8], '#5a9a3e', '#34642a')
    line(c, [-6, 5, -2.6, 3.6], 0.5, '#9ad070', false)
    // bütün meyve: sapı yukarıda, altı geniş
    shape(
      c,
      () => {
        c.moveTo(1.8, -5.2)
        c.quadraticCurveTo(-1.2, -2.4, -0.6, 1.8)
        c.quadraticCurveTo(0.6, 5.6, 3.4, 5.6)
        c.quadraticCurveTo(6.4, 5.4, 6.2, 1.8)
        c.quadraticCurveTo(6.2, -2.2, 3.2, -5.2)
      },
      '#7a4a8c',
      '#4e2a60',
    )
    line(c, [2.6, -5.2, 2.4, -7], 1, '#5a7a30')
    dab(c, 1.4, -1.4, 0.8, 1.6, 'rgba(230,200,240,0.7)', 0.3)
    dab(c, 4.4, 3.6, 1.2, 0.6, 'rgba(60,20,80,0.35)')
    // ikiye bölünmüş dilim: ön yüzde pembe iç, taneler
    shape(
      c,
      () => {
        c.moveTo(-5.2, 0.6)
        c.quadraticCurveTo(-3.4, -3.2, -1.2, 0.4)
        c.quadraticCurveTo(-1.6, 3.8, -3.2, 4)
        c.quadraticCurveTo(-5.2, 3.6, -5.2, 0.6)
      },
      '#a8426a',
      '#6e2444',
    )
    ell(c, -3.2, 1.8, 1.5, 1.8, '#f0a0b8')
    for (const [x, y] of [[-3.8, 1.4], [-2.6, 1.2], [-3.2, 2.4], [-2.4, 2.6], [-4, 2.6]] as const) dab(c, x, y, 0.28, 0.28, '#f8e0a0')
  },
  // Cezerye: havuçtan pişen amber renkli iki dilim, üstleri hindistan cevizi tozlu; altında yağlı kâğıt
  mersin: (c) => {
    poly(c, [-6, 4.6, 5.6, 3.2, 6.2, 5.4, -5.4, 6.4], '#f4ead2', '#cdbf9e')
    const piece = (x: number, y: number, w: number, h: number) => {
      shape(c, () => c.roundRect(x, y, w, h, 1.1), '#de7f22', '#9c4a12')
      if (halo) return
      // kesik yüzde havuç lifleri ve ceviz içi
      for (let i = 0; i < 3; i++) dab(c, x + 1.2 + i * (w / 3.2), y + h * 0.6, 0.5, 0.3, '#f4a650')
      dab(c, x + w * 0.6, y + h * 0.45, 0.65, 0.45, '#8a5226')
      // üstü: hindistan cevizi tozu
      dab(c, x + w / 2, y + 0.5, w / 2 - 0.3, 0.75, '#fffaf0')
      for (let i = 0; i < 4; i++) dab(c, x + 0.8 + i * (w / 4.2), y + 1.4 + (i % 2) * 0.4, 0.35, 0.3, '#fffaf0')
    }
    piece(-5, -2.2, 6.2, 6.4)
    piece(0.6, -5, 5, 8.6)
    dab(c, -3.6, -1.2, 0.9, 0.4, 'rgba(255,255,255,0.7)', -0.2)
  },
  // Safran: mor çiğdem çiçeği, ortasından sarkan kızıl-turuncu üç tel; altında kesekâğıdı gibi küçük bir keten kese
  karabuk: (c) => {
    poly(c, [-5.4, 6, 5.4, 6, 4.2, 0.8, -4.2, 0.8], '#e8d8b4', '#b49a6c')
    poly(c, [-4.6, 1.4, -2, 3, 0, 1.4, 2, 3, 4.6, 1.4, 4.2, 0.8, -4.2, 0.8], '#d4bf92')
    line(c, [-3.4, 2.4, 3.4, 2.4], 0.6, '#8a6a3e', false)
    // çiğdem: üç taç yaprağı
    ell(c, -2.8, -3.6, 1.7, 3.6, '#a064c0', '#6a3a86', -0.5)
    ell(c, 2.8, -3.6, 1.7, 3.6, '#a064c0', '#6a3a86', 0.5)
    ell(c, 0, -4.4, 1.8, 3.9, '#b87ad2', '#7c4a9c')
    dab(c, -0.5, -6.4, 0.6, 1.4, '#e0b8f0')
    // safran telleri
    for (const [x, y] of [[-1.6, -2], [0, -1.4], [1.6, -2]] as const) line(c, [x * 0.5, 0.2, x, y - 1.6], 0.9, '#e8451c')
    dab(c, -0.8, -3.6, 0.4, 0.4, '#ffb03a')
    dab(c, 0.9, -3.4, 0.4, 0.4, '#ffb03a')
  },
  // Çay: ince belli bardakta tavşan kanı çay, beyaz tabak, kenarda şeker
  rize: (c) => {
    ell(c, 0, 4.4, 5.4, 1.3, '#f8f6f0', '#c8ccd4')
    dab(c, 0, 4.2, 3, 0.55, '#d8dce4')
    // bardak: ağzı ve dibi geniş, beli ince
    const glass = () => {
      c.moveTo(-2.9, -4.6)
      c.lineTo(2.9, -4.6)
      c.quadraticCurveTo(1.1, -0.6, 2.5, 3.9)
      c.lineTo(-2.5, 3.9)
      c.quadraticCurveTo(-1.1, -0.6, -2.9, -4.6)
    }
    shape(c, glass, '#eef6f8')
    if (!halo) {
      // çay: ağızdan bir parmak aşağıda
      c.save()
      c.beginPath()
      glass()
      c.clip()
      c.fillStyle = '#c0301e'
      c.fillRect(-4, -3.4, 8, 7.4)
      c.fillStyle = '#e2552e'
      c.fillRect(-4, -3.4, 8, 0.7)
      c.restore()
      c.strokeStyle = INK
      c.lineWidth = INKW
      c.beginPath()
      glass()
      c.closePath()
      c.stroke()
    }
    line(c, [-2.6, -4.6, 2.6, -4.6], 0.35, '#ffffff', false)
    dab(c, -1.6, -1.6, 0.35, 1.5, 'rgba(255,255,255,0.65)', 0.2)
    // şeker küpü ve kaşık
    poly(c, [3.4, 3.6, 4.8, 3.6, 4.8, 2.3, 3.4, 2.3], '#ffffff', '#d8dce4')
    line(c, [-3.2, 3.8, -5.4, 2.2], 0.45, '#c8ccd4')
  },
  // Bal peteği: altıgen gözler, köşesinden süzülen bal
  artvin: (c) => {
    const hex = (x: number, y: number, r: number) => {
      const p: number[] = []
      for (let i = 0; i < 6; i++) p.push(x + Math.cos((i * Math.PI) / 3) * r, y + Math.sin((i * Math.PI) / 3) * r)
      return p
    }
    poly(c, [-5, -3.2, 5, -4.4, 5.4, 3.4, -4.6, 4.4], '#e8a826', '#b8761a')
    for (const [x, y] of [[-2.6, -1.6], [0.4, -2.6], [3.2, -1.2], [-2.2, 1.8], [0.8, 0.8], [3.4, 2.2]] as const) {
      if (!halo) {
        c.beginPath()
        const p = hex(x, y, 1.45)
        c.moveTo(p[0], p[1])
        for (let i = 2; i < 12; i += 2) c.lineTo(p[i], p[i + 1])
        c.closePath()
        c.fillStyle = '#f6c84a'
        c.fill()
        c.strokeStyle = '#a8681a'
        c.lineWidth = 0.4
        c.stroke()
      }
      dab(c, x - 0.4, y - 0.4, 0.45, 0.35, '#fff0b0')
    }
    // damla
    shape(
      c,
      () => {
        c.moveTo(-3.4, 4)
        c.quadraticCurveTo(-3.2, 5.4, -2.5, 6.4)
        c.quadraticCurveTo(-1.4, 5.4, -1.8, 4.1)
      },
      '#f2b232',
    )
  },
  // Gravyer: delikli sarı peynir dilimi, kabuğu koyu
  kars: (c) => {
    poly(c, [-5.6, 3.6, 5.2, 3.6, 5.2, -0.6, -5.6, -3.6], '#f6d468', '#c8a03a')
    poly(c, [-5.6, -3.6, 5.2, -0.6, 5.2, 0.4, -5.6, -2.6], '#fbe492')
    line(c, [5.2, -0.6, 5.2, 3.6], 0.9, '#c88a2a')
    for (const [x, y, r] of [[-3, 1.4, 1], [0.6, 2, 0.75], [2.8, 0.6, 1.05], [-0.8, -0.2, 0.55], [4, 2.7, 0.45]] as const) {
      ell(c, x, y, r, r * 0.85, '#d8ac3e')
      dab(c, x + r * 0.2, y + r * 0.25, r * 0.55, r * 0.4, '#c09030')
    }
    // kenarda yarım delik
    if (!halo) {
      c.beginPath()
      c.arc(-2, 3.6, 0.8, Math.PI, 0)
      c.fillStyle = '#c09030'
      c.fill()
    }
  },
  // Büryan: tabakta kızarmış kuzu, altında pide, yanında soğan ve biber
  bitlis: (c) => {
    ell(c, 0, 3.6, 5.8, 1.6, '#f4f0e6', '#c8c2b0')
    // pide
    shape(
      c,
      () => {
        c.moveTo(-4.8, 2.8)
        c.quadraticCurveTo(-5, 0.6, -2.6, 0.4)
        c.lineTo(3, 0.4)
        c.quadraticCurveTo(5.2, 0.6, 4.8, 2.8)
        c.closePath()
      },
      '#e8b86a',
      '#b8843a',
    )
    // et: kızarmış iri parça, üstü yanık izli
    shape(
      c,
      () => {
        c.moveTo(-3.6, 1.2)
        c.bezierCurveTo(-4.2, -3.4, 2.6, -4.6, 3.8, -0.6)
        c.quadraticCurveTo(4, 1.4, 2.4, 1.6)
        c.closePath()
      },
      '#a8542a',
      '#6e3216',
    )
    line(c, [-1.8, -1.6, -0.6, 0.4], 0.35, '#5a2410', false)
    line(c, [0.6, -2.6, 1.8, -0.6], 0.35, '#5a2410', false)
    dab(c, -1.6, -2.2, 0.9, 0.45, '#d88a54', -0.4)
    // kemik ucu
    line(c, [3.2, -1.2, 4.8, -2.6], 0.9, '#f4ead0')
    ell(c, 5, -2.8, 0.7, 0.7, '#f4ead0')
    // soğan halkası ve biber
    ell(c, -4.4, 1.6, 1.1, 0.7, '#f0d8f0', '#c0a0c4')
    line(c, [2.6, 2.4, 4.6, 1.8], 0.8, '#4e9a3a')
  },
  // Kilim: kırmızı zeminde göz motifi, saçaklı iki uç
  agri: (c) => {
    for (const x of [-3.6, -2.2, -0.8, 0.6, 2, 3.4]) {
      line(c, [x, -4.8, x, -6], 0.35, '#e8d8b0', false)
      line(c, [x, 4.8, x, 6], 0.35, '#e8d8b0', false)
    }
    poly(c, [-4.4, -4.8, 4.4, -4.8, 4.4, 4.8, -4.4, 4.8], '#b8302a', '#7e1e1c')
    if (!halo) {
      c.strokeStyle = '#f2c14e'
      c.lineWidth = 0.5
      c.strokeRect(-3.5, -3.9, 7, 7.8)
    }
    // ortada elibelinde / göz motifi
    poly(c, [0, -3, 2.4, 0, 0, 3, -2.4, 0], '#2e5a8a')
    poly(c, [0, -1.6, 1.2, 0, 0, 1.6, -1.2, 0], '#f4ead8')
    dab(c, 0, 0, 0.5, 0.5, '#b8302a')
    for (const [x, y] of [[-2.6, -2.9], [2.6, -2.9], [-2.6, 2.9], [2.6, 2.9]] as const) poly(c, [x, y - 0.7, x + 0.7, y, x, y + 0.7, x - 0.7, y], '#f4ead8')
  },
  // Simit: susamlı halka
  istanbul: (c) => {
    ring(c, 0, 0, 3.5, 2.4, '#c47a2c')
    c.beginPath()
    c.arc(0, 0, 3.5, 2.2, 5)
    c.strokeStyle = '#e09a44'
    c.lineWidth = 0.9
    c.stroke()
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + 0.2
      dab(c, Math.cos(a) * (3.5 + (i % 2 ? 0.5 : -0.4)), Math.sin(a) * (3.5 + (i % 2 ? 0.5 : -0.4)), 0.4, 0.28, '#f6e7c0', a)
    }
  },
  // Pişmaniye: pembe kutunun üstünde tel tel beyaz yumak
  kocaeli: (c) => {
    poly(c, [-4.6, 0.8, 4.6, 0.8, 4, 4.8, -4, 4.8], '#e88aa0', '#b85a70')
    puff(c, 0, -1.2, 3, 1.9, 8, 1.9, '#fbf6ec', '#e0d2b8')
    c.strokeStyle = 'rgba(176,152,112,0.8)'
    c.lineWidth = 0.35
    for (let i = 0; i < 4; i++) {
      c.beginPath()
      c.arc(-0.4 + i * 0.3, -1.2, 1 + i * 0.9, 3.4 + i * 0.5, 5 + i * 0.5)
      c.stroke()
    }
    line(c, [-3.2, 2.8, 3.2, 2.8], 0.5, '#fbe0e6', false)
  },
  // At başlı testi: yeşil sırlı Çanakkale seramiği
  canakkale: (c) => {
    line(c, [-2.2, -0.8, -5, -1.4, -4.4, 2.2, -3.2, 2.6], 0.9, '#a86a34')
    line(c, [-1.6, 5, 1.6, 5], 1.2, '#70421c')
    line(c, [0, -2, 0.6, -4.2], 1.7, '#5a8a4a')
    ell(c, 1.8, -4.7, 2, 1.2, '#6a9a56', '#3a6232', 0.35)
    poly(c, [0, -5.2, 0.3, -6.6, 1.3, -5.5], '#5a8a4a')
    ell(c, 0, 1.6, 3.9, 3.5, '#5a8a4a', '#3a6232')
    for (const x of [-1.8, 0, 1.8]) dab(c, x, 0.8 + Math.abs(x) * 0.25, 0.55, 0.55, '#e8c86a')
    dab(c, 2.4, -4.9, 0.3, 0.3, INK)
  },
  // Gemi maketi: kırmızı tekne, iki beyaz yelken
  sinop: (c) => {
    line(c, [0, 2, 0, -5.6], 0.6, '#5a3c26')
    poly(c, [0.7, -5.2, 0.7, 1, 4.8, 1], '#f8f4ea', '#c8c4b8')
    poly(c, [-0.7, -3.8, -0.7, 1, -4.2, 1], '#f8f4ea', '#c8c4b8')
    poly(c, [-5.6, 1.9, 5.6, 1.9, 3.8, 4.8, -3.8, 4.8], '#b8442c', '#7a2c1e')
    line(c, [-4.4, 3, 4.4, 3], 0.4, '#f0d8a8', false)
  },
  // Karpuz dilimi: yeşil kabuk, kırmızı iç, kara çekirdek
  diyarbakir: (c) => {
    shape(
      c,
      () => {
        c.moveTo(-5.5, -2.4)
        c.lineTo(5.5, -2.4)
        c.arc(0, -2.4, 5.5, 0, Math.PI)
      },
      '#3a8a3c',
      '#246028',
    )
    c.beginPath()
    c.arc(0, -2.4, 4.5, 0, Math.PI)
    c.fillStyle = '#e8f0d0'
    c.fill()
    c.beginPath()
    c.arc(0, -2.4, 3.9, 0, Math.PI)
    c.fillStyle = '#e24a48'
    c.fill()
    for (const [x, y] of [[-2.2, -1.2], [0, -0.4], [2.2, -1.2], [-1, 0.5], [1.1, 0.5]] as const) dab(c, x, y, 0.35, 0.5, '#1d1a22')
    line(c, [-5.5, -2.4, 5.5, -2.4], 0.4, INK, false)
  },
  // Sikke: Mevlevi külahı, keçeden, dibinde koyu sarık
  konya: (c) => {
    shape(
      c,
      () => {
        c.moveTo(-3.4, 3.4)
        c.lineTo(-2.7, -3)
        c.quadraticCurveTo(0, -6.6, 2.7, -3)
        c.lineTo(3.4, 3.4)
      },
      '#d0a878',
      '#96704a',
    )
    line(c, [-1.2, -3.6, -1.6, 2], 0.5, '#ecd0a2', false)
    line(c, [-3.9, 3.9, 3.9, 3.9], 1.7, '#5a4028')
  },
  // Testi: kırmızı Avanos çömleği, tek kulplu
  nevsehir: (c) => {
    line(c, [1.6, -3.6, 4.8, -2.8, 4.4, 0.6, 3.4, 1], 0.9, '#8a3a20')
    poly(c, [-1.5, -1.6, -1.9, -4.6, 1.9, -4.6, 1.5, -1.6], '#c8603a', '#8a3a20')
    ell(c, 0, 1.6, 4, 3.6, '#c8603a', '#8a3a20')
    line(c, [-2.3, -4.9, 2.3, -4.9], 0.9, '#5a2a18')
    line(c, [-3.2, 0.6, -1.6, 1.8, 0, 0.6, 1.6, 1.8, 3.2, 0.6], 0.45, '#f0c890', false)
    line(c, [-1.4, 5.1, 1.4, 5.1], 1, '#8a3a20')
  },
  // Baklava: kat kat baklava dilimi, üstünde fıstık
  gaziantep: (c) => {
    poly(c, [-5.4, -0.6, 0, 2.4, 5.4, -0.6, 5.4, 2.2, 0, 5.2, -5.4, 2.2], '#b07424', '#84501a')
    line(c, [-5, 0.9, 0, 3.8, 5, 0.9], 0.3, '#eab24a', false)
    poly(c, [-5.4, -0.6, 0, -3.6, 5.4, -0.6, 0, 2.4], '#eeb850', '#c88a2c')
    ell(c, 0, -0.8, 2.1, 1.2, '#86c040', '#4a7a20')
  },
  // Pamuk: açmış koza, kahverengi sap, yeşil çanak
  adana: (c) => {
    line(c, [0, 2, 0, 5.4], 1, '#7a5030')
    poly(c, [-3.6, 1.4, -5, 3.6, -1.6, 2.6], '#6a8a3a')
    poly(c, [3.6, 1.4, 5, 3.6, 1.6, 2.6], '#6a8a3a')
    puff(c, 0, -1.4, 2.9, 2.3, 7, 2.2, '#ffffff', '#d4d8e2')
    line(c, [0, -1.6, 0, 1], 0.35, '#c4c8d4', false)
    line(c, [0, -1.6, -2, -2.8], 0.35, '#c4c8d4', false)
    line(c, [0, -1.6, 2, -2.8], 0.35, '#c4c8d4', false)
  },
  // Kızak çanı: pirinç çan, kırmızı kurdele
  ardahan: (c) => {
    ell(c, 0, 4.5, 1.1, 1.1, '#2a2220')
    ell(c, 0, -5, 1.4, 1, '#c8302a')
    shape(
      c,
      () => {
        c.moveTo(-4.6, 3)
        c.quadraticCurveTo(-3.2, 2, -3.2, -1)
        c.quadraticCurveTo(-3, -4.6, 0, -4.6)
        c.quadraticCurveTo(3, -4.6, 3.2, -1)
        c.quadraticCurveTo(3.2, 2, 4.6, 3)
      },
      '#e8b83e',
      '#a8781e',
    )
    line(c, [-1.4, -3, -1.9, 0.6], 0.6, '#fbe49a', false)
    line(c, [-4.8, 3.3, 4.8, 3.3], 1, '#c8922a')
  },
  // Boyoz: kat kat açılmış yuvarlak hamur
  izmir: (c) => {
    ell(c, 0, 0.2, 5.1, 4.3, '#e4a646', '#a86a20')
    c.beginPath()
    for (let a = 0; a < Math.PI * 4.6; a += 0.35) {
      const r = 0.4 + a * 0.24
      c.lineTo(Math.cos(a) * r * 1.15 - 0.2, Math.sin(a) * r + 0.1)
    }
    c.strokeStyle = '#8a5218'
    c.lineWidth = 0.45
    c.stroke()
    dab(c, -2, -1.8, 1.3, 0.6, '#ffd88a', -0.5)
  },
  // Tiftik: sarılmış yün yumağı, ucu sarkık
  ankara: (c) => {
    line(c, [3, 3.2, 5.4, 4.2, 4.2, 5.4], 0.6, '#f8f4ec')
    ell(c, 0, 0, 4.8, 4.6, '#f8f4ec', '#d0c6b8')
    c.strokeStyle = '#b0a492'
    c.lineWidth = 0.4
    for (let i = 0; i < 3; i++) {
      c.beginPath()
      c.ellipse(0, 0, 4.4, 1.4 + i * 1.1, -0.6, 3.5, 6)
      c.stroke()
      c.beginPath()
      c.ellipse(0, 0, 4.2, 1.2 + i * 1.1, 0.8, 0.4, 2.8)
      c.stroke()
    }
  },
  // Telkari: gümüş tel işi, ortasında firuze
  mardin: (c) => {
    line(c, [0, -5.2, 5, 0, 0, 5.2, -5, 0, 0, -5.2], 1, '#e6ebf2')
    for (const k of [-1, 1]) {
      c.beginPath()
      c.arc(k * 2.3, 0, 1.2, 0, TAU)
      c.moveTo(1.2, k * 2.5)
      c.arc(0, k * 2.5, 1.2, 0, TAU)
      c.strokeStyle = INK
      c.lineWidth = 1
      c.stroke()
      c.strokeStyle = '#c4ccd8'
      c.lineWidth = 0.45
      c.stroke()
    }
    ell(c, 0, 0, 1.3, 1.3, '#7fd0e0', '#4a9ab0')
  },
  // Kayısı: turuncu, yanağı kızarmış, yapraklı
  malatya: (c) => {
    line(c, [0, -3.4, 0.6, -5.4], 0.7, '#5a3a1e')
    poly(c, [0.6, -4.6, 3.2, -6, 4.2, -4, 1.8, -3.6], '#4f9a3a', '#34702a')
    ell(c, 0, 0.8, 4.7, 4.4, '#f6a034', '#d9741a')
    dab(c, 2, 1.8, 1.7, 1.5, 'rgba(232,90,50,0.5)')
    line(c, [0.2, -3.2, -0.8, 0.6, 0, 4.6], 0.4, '#b85a14', false)
    dab(c, -2.2, -1, 1, 0.6, '#ffd27a', -0.6)
  },
  // Leblebi: bir avuç sarı nohut
  corum: (c) => {
    for (const [x, y] of [[-3, 2.6], [0.2, 3], [3.2, 2.4], [-1.6, -0.2], [1.8, -0.4], [0, -3]] as const) {
      ell(c, x, y, 1.9, 1.75, '#f2e2b4', '#cdb37a')
      dab(c, x + 0.5, y + 0.3, 0.35, 0.3, '#a88a52')
    }
  },
  // Fındık: sivri dipli kabuk, açık renk tabla, yeşil çanak
  ordu: (c) => {
    shape(
      c,
      () => {
        c.moveTo(-4.2, -1)
        c.quadraticCurveTo(-4.6, 3.8, 0, 5.4)
        c.quadraticCurveTo(4.6, 3.8, 4.2, -1)
        c.quadraticCurveTo(0, -2.6, -4.2, -1)
      },
      '#b06e2e',
      '#7a4418',
    )
    dab(c, -1.8, 1, 0.8, 1.6, '#d89a5a', 0.3)
    poly(c, [-4.8, -0.4, -4, -3.6, -2.2, -2.2, -1, -5, 0.6, -2.6, 2.4, -4.6, 3, -2.2, 4.8, -3, 4.6, -0.4, 0, -1.4], '#5a9a3a', '#3a6a24')
  },
  // Kangal rozeti: altın madalya, ortasında kara maskeli köpek
  sivas: (c) => {
    poly(c, [-2.4, 2.6, -3.4, 5.8, -1.6, 5, -0.4, 5.8, 0, 3], '#c8302a')
    poly(c, [2.4, 2.6, 3.4, 5.8, 1.6, 5, 0.4, 5.8, 0, 3], '#a82420')
    ell(c, 0, -0.8, 4.7, 4.7, '#e0aa44', '#a87a22')
    ell(c, 0, -0.8, 3.2, 3.2, '#f0dcae')
    dab(c, -2, -2.6, 0.9, 1.3, '#3a2e28', 0.4)
    dab(c, 2, -2.6, 0.9, 1.3, '#3a2e28', -0.4)
    dab(c, 0, 0.3, 1.5, 1.1, '#3a2e28')
    dab(c, -1.1, -1.5, 0.4, 0.4, INK)
    dab(c, 1.1, -1.5, 0.4, 0.4, INK)
  },
  // Sütlaç: toprak kâsede, üstü fırında kızarmış, fındıklı
  trabzon: (c) => {
    shape(
      c,
      () => {
        c.moveTo(-5.2, -0.6)
        c.lineTo(5.2, -0.6)
        c.quadraticCurveTo(4.8, 4.8, 0, 4.8)
        c.quadraticCurveTo(-4.8, 4.8, -5.2, -0.6)
      },
      '#a8602e',
      '#7a4220',
    )
    ell(c, 0, -0.8, 5.1, 2, '#f6ecd8')
    dab(c, 0.4, -0.9, 3.2, 1.1, '#c88a4a')
    dab(c, -1, -1.2, 0.7, 0.55, '#7a4a22')
    dab(c, 1.4, -0.7, 0.7, 0.55, '#7a4a22')
  },
  // Meyve sabunu: hasır sepette elma, armut ve yeşil sabun
  edirne: (c) => {
    line(c, [-2.4, -3.4, -2, -4.8], 0.5, '#3e7a30')
    line(c, [2.6, -3.8, 3, -5.2], 0.5, '#3e7a30')
    ell(c, -2.4, -0.8, 2.7, 2.6, '#e24a48', '#b02e30')
    ell(c, 2.6, -1, 2.4, 2.8, '#f2c14e', '#c8922a')
    ell(c, 0.2, 0.4, 2.1, 2, '#6aa84a', '#3e7a30')
    dab(c, -3.2, -1.8, 0.7, 0.5, '#fff0d0', -0.6)
    poly(c, [-5.4, 1.2, 5.4, 1.2, 4.2, 5, -4.2, 5], '#b07a40', '#74481e')
    line(c, [-4.8, 2.6, 4.8, 2.6], 0.35, '#74481e', false)
    for (const x of [-2.6, 0, 2.6]) line(c, [x, 1.4, x * 0.85, 4.8], 0.35, '#74481e', false)
  },
  // Kestane şekeri: parlak şuruplu kestane, kıvrımlı kâğıt kapta
  bursa: (c) => {
    shape(
      c,
      () => {
        c.moveTo(0, -5.2)
        c.quadraticCurveTo(4.8, -3.4, 4.2, 0.8)
        c.quadraticCurveTo(3.6, 3.2, 0, 3.2)
        c.quadraticCurveTo(-3.6, 3.2, -4.2, 0.8)
        c.quadraticCurveTo(-4.8, -3.4, 0, -5.2)
      },
      '#9a5428',
      '#5a2e14',
    )
    dab(c, -1.8, -2, 1.5, 0.8, '#e0a868', -0.7)
    poly(c, [-5.4, 1.4, -3.6, 2.2, -1.8, 1.4, 0, 2.2, 1.8, 1.4, 3.6, 2.2, 5.4, 1.4, 4, 5, -4, 5], '#f6ecd8', '#d0c4a8')
    for (const x of [-2.4, 0, 2.4]) line(c, [x, 2.6, x * 0.8, 4.8], 0.3, '#b8aa8a', false)
  },
  // Finike portakalı: dalında, iki yaprakla
  antalya: (c) => {
    line(c, [0, -3.2, 0.4, -5.4], 0.7, '#6a4a2e')
    poly(c, [0.2, -4.4, -2.6, -6, -4.6, -4.2, -1.8, -3.4], '#4e9a3a', '#2e6a24')
    poly(c, [0.6, -4.4, 3, -5.8, 4.4, -4, 2.2, -3.4], '#5aa844', '#2e6a24')
    ell(c, 0, 1, 4.7, 4.4, '#f6922e', '#c8641a')
    dab(c, -2, -1, 1.3, 0.8, '#ffc878', -0.6)
    for (const [x, y] of [[1.4, 0.2], [-0.6, 2.4], [2.4, 2.6], [0.6, 3.8]] as const) dab(c, x, y, 0.25, 0.25, '#c8641a')
  },
  // İsot: ipe dizili koyu kırmızı biberler
  sanliurfa: (c) => {
    line(c, [-5.4, -4.8, 5.4, -4.8], 0.6, '#c8b48a')
    for (const x of [-3.5, 0, 3.5]) {
      line(c, [x, -4.6, x, -3.2], 0.6, '#4e7a2e')
      shape(
        c,
        () => {
          c.moveTo(x - 1.5, -3)
          c.lineTo(x + 1.5, -3)
          c.quadraticCurveTo(x + 1.9, 1.6, x + 0.5, 5.2)
          c.quadraticCurveTo(x - 1.7, 2, x - 1.5, -3)
        },
        '#b8261e',
        '#6e1414',
      )
      line(c, [x - 0.6, -2, x - 0.5, 0.8], 0.4, '#f06a50', false)
    }
  },
  // Otlu peynir: yeşil otlu beyaz kalıp, tahta tabakta
  van: (c) => {
    poly(c, [-5.6, 3, 5.6, 3, 4.6, 5.2, -4.6, 5.2], '#a8703a', '#74481e')
    poly(c, [-4.4, 3, -4.4, -1.6, -2.6, -4, 4.6, -4, 4.6, 0.8, 3, 3], '#f8f4e8', '#d8d0bc')
    line(c, [-4.4, -1.6, 3, -1.6, 4.6, -4], 0.3, '#b8b09c', false)
    line(c, [3, -1.6, 3, 3], 0.3, '#b8b09c', false)
    for (const [x, y, r] of [[-2.8, 0, 0.4], [-0.8, 1.6, -0.5], [1.2, -0.2, 0.9], [-1.6, -2.8, 0.2], [1.6, -3, -0.6], [0.4, 0.6, 1.4]] as const) dab(c, x, y, 0.75, 0.3, '#4e8a3a', r)
  },
  // Oltu taşı tespih: siyah parlak taneler, gümüş püskül
  erzurum: (c) => {
    line(c, [0, 2.6, 0, 3.8], 0.5, '#c8ccd8')
    poly(c, [-1.1, 3.6, 1.1, 3.6, 1.7, 6, -1.7, 6], '#d4d8e2', '#8a8e9a')
    for (let i = 0; i < 11; i++) {
      const an = (i / 11) * TAU + Math.PI / 2
      const bx = Math.cos(an) * 4.2
      const by = -1.2 + Math.sin(an) * 3.7
      ell(c, bx, by, 1.15, 1.15, '#3e3a4e')
      dab(c, bx - 0.35, by - 0.4, 0.35, 0.3, '#a8a4c0')
    }
  },
  // Misket elması: küçük, sarı kabuğunun güneş gören yanı çizgi çizgi al; kısa sap, tek yaprak
  amasya: (c) => {
    const body = () => {
      c.moveTo(0, -2.7)
      c.bezierCurveTo(3, -4.7, 5.7, -1.8, 4.8, 1.5)
      c.bezierCurveTo(4, 4.5, 1.3, 5.2, 0, 4.3)
      c.bezierCurveTo(-1.3, 5.2, -4, 4.5, -4.8, 1.5)
      c.bezierCurveTo(-5.7, -1.8, -3, -4.7, 0, -2.7)
    }
    line(c, [0.1, -2.4, 0.4, -4.3, 1.3, -5.6], 0.7, '#6a4a2a')
    shape(
      c,
      () => {
        c.moveTo(0.8, -4.3)
        c.quadraticCurveTo(2.7, -6.9, 5.3, -5.3)
        c.quadraticCurveTo(3.5, -3.1, 0.8, -4.3)
      },
      '#6cb044',
      '#3e7a2a',
    )
    line(c, [1.5, -4.5, 4.2, -5.1], 0.25, '#3e7a2a', false)
    shape(c, body, '#f2d460', '#d0a030')
    if (!halo) {
      // al yanak kabuğun içinde kalır
      c.save()
      c.beginPath()
      body()
      c.clip()
      dab(c, 3.9, 1.2, 3.2, 5, '#e6553c', 0.18)
      dab(c, 5, 2.8, 2.2, 3, '#c8342c', 0.25)
      // misketin alı çizgi çizgi yayılır
      for (const [x, y, h] of [[0.5, -0.4, 1.5], [-0.3, 1.9, 1.1], [0.9, 2.9, 1], [-1.1, -0.2, 0.8]] as const) dab(c, x, y, 0.22, h, '#e6553c', 0.1)
      for (const [x, y] of [[-2.6, 1.6], [-1.6, 3], [-3.2, -0.2], [-0.9, 0.2]] as const) dab(c, x, y, 0.2, 0.2, '#fff4c0')
      c.restore()
    }
    line(c, [-1.3, -2.5, 0, -2, 1.3, -2.6], 0.35, '#a87a1e', false)
    dab(c, -2.6, -1.3, 0.7, 1.4, '#fff8d8', 0.5)
    dab(c, -3.1, 0.9, 0.3, 0.45, '#fff8d8', 0.3)
  },
  // Bodrum süngeri: yumru yumru, gözenekli altın sarısı deniz süngeri; dibinde bir denizyıldızı
  mugla: (c) => {
    puff(c, -1.6, -2.4, 1.9, 1.3, 6, 1.2, '#f0cc6c', '#c89c3e')
    puff(c, 0.5, 0.5, 3.5, 2.8, 9, 1.75, '#f0cc6c', '#c89c3e')
    // gözenekler: koyu oyuk, altında ışık alan dudak
    for (const [x, y, r] of [[-1.8, -0.4, 1.05], [1.6, -1.6, 0.9], [2.9, 1.3, 0.95], [0.3, 2, 0.8], [-2.1, -2.8, 0.6]] as const) {
      dab(c, x + 0.15, y + 0.25, r, r * 0.85, '#fff0b4')
      dab(c, x, y, r, r * 0.8, '#a8782a')
      dab(c, x - 0.15, y - 0.12, r * 0.55, r * 0.42, '#6e4a18')
    }
    for (const [x, y] of [[-0.2, -1.9], [3.6, -0.6], [-3, 1.6], [1.4, 0.3], [-0.9, 3.4]] as const) dab(c, x, y, 0.28, 0.24, '#a8782a')
    dab(c, -3.1, -1.2, 0.9, 0.45, '#fff6cc', -0.6)
    // denizyıldızı
    shape(
      c,
      () => {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU - 1.2
          const r = i % 2 ? 0.95 : 2.3
          c.lineTo(-3.5 + Math.cos(a) * r, 3.5 + Math.sin(a) * r)
        }
      },
      '#f2764c',
      '#c4502e',
    )
    dab(c, -3.5, 3.5, 0.35, 0.35, '#ffd0a8')
  },
  // Kopuz: armut gövdeli, uzun saplı ozan sazı
  bayburt: (c) => {
    line(c, [-0.6, 0.6, 4.4, -4.4], 1.1, '#7a4a24')
    line(c, [3.6, -4.8, 5.2, -3.4], 1, '#3a2a20')
    ell(c, -1.8, 1.9, 3.7, 3, '#b0703e', '#7a4a24', -0.78)
    dab(c, -1.4, 1.5, 0.9, 0.9, '#2a2220')
    line(c, [-3.2, 3.4, 4, -3.8], 0.25, '#f0e2c0', false)
  },
  // Mantı: mavi çini tabakta minik bohçalar, üstünde yoğurt ve pul biberli tereyağı
  kayseri: (c) => {
    ell(c, 0, 2.4, 5.8, 2.6, '#f4f6fa', '#b8c4d8')
    line(c, [-4.4, 2.6, -2, 4, 2, 4, 4.4, 2.6], 0.45, '#3a6ab8', false)
    for (const [x, y] of [[-3, 0.4], [3, 0.4], [-1.4, -0.6], [1.6, -0.6], [0, 1]] as const) {
      shape(
        c,
        () => {
          c.moveTo(x - 1.5, y + 1)
          c.quadraticCurveTo(x - 1.7, y - 1, x, y - 1.8)
          c.quadraticCurveTo(x + 1.7, y - 1, x + 1.5, y + 1)
          c.closePath()
        },
        '#f6e2b8',
        '#d6b47e',
      )
    }
    shape(
      c,
      () => {
        c.moveTo(-3.6, -0.4)
        c.quadraticCurveTo(0, -3.8, 3.6, -0.4)
        c.quadraticCurveTo(2.4, 0.6, 1.4, 0)
        c.quadraticCurveTo(0, 1.2, -1.2, 0.2)
        c.quadraticCurveTo(-2.6, 0.8, -3.6, -0.4)
      },
      '#fbfaf2',
      '#d4d8d0',
    )
    line(c, [-2.6, -1, -0.8, -2, 0.8, -1.2, 2.6, -1.8], 0.5, '#d63a1e', false)
    for (const [x, y] of [[-1.6, -1.6], [1.6, -1], [0, -2.4]] as const) dab(c, x, y, 0.3, 0.25, '#a8201a')
  },
  // Künefe: tel kadayıf dilimi, üstü fıstıklı, şerbeti parıldar
  hatay: (c) => {
    shape(
      c,
      () => {
        c.moveTo(-5, 0.2)
        c.lineTo(5.2, -2.2)
        c.lineTo(5.2, 1.2)
        c.lineTo(-5, 4.2)
        c.closePath()
      },
      '#e8862a',
      '#b45a18',
    )
    line(c, [-4.6, 2.2, 5, -0.6], 0.5, '#fff0c0', false)
    shape(
      c,
      () => {
        c.moveTo(-5, 0.2)
        c.lineTo(5.2, -2.2)
        c.quadraticCurveTo(4.6, -5.6, 1.6, -5.4)
        c.closePath()
      },
      '#f2a43a',
      '#c8761e',
    )
    for (const [x, y] of [[0.4, -2.2], [2.6, -3.4], [3.2, -1.8], [-1.6, -1]] as const) dab(c, x, y, 0.6, 0.4, '#6aa840')
    dab(c, 1.8, -4.2, 1.2, 0.45, '#fff6d0', -0.3)
    for (const [x, y] of [[-3, 2.6], [0, 1.8], [3, 1]] as const) line(c, [x, y, x + 0.8, y - 0.6, x + 1.6, y - 0.2], 0.3, '#b45a18', false)
  },
  // Lületaşı: beyaz, oymalı lüle; kehribar ağızlık
  eskisehir: (c) => {
    line(c, [-1, 1.4, 4.8, -2.4], 1.4, '#c8862a')
    line(c, [3.6, -1.6, 5.2, -2.6], 1.4, '#7a4a20')
    shape(
      c,
      () => {
        c.moveTo(-5, -3.6)
        c.lineTo(-0.6, -3.6)
        c.quadraticCurveTo(-0.2, 2.6, -2.4, 3.8)
        c.quadraticCurveTo(-5.6, 3.6, -5, -3.6)
      },
      '#f6f0e2',
      '#cfc4ac',
    )
    ell(c, -2.8, -3.6, 2.2, 0.8, '#5a3a24')
    line(c, [-4.4, -1.6, -3.4, -0.6, -2.4, -1.6, -1.4, -0.6], 0.35, '#b8a888', false)
    line(c, [-4, 1, -3, 1.8, -2, 1], 0.35, '#b8a888', false)
    dab(c, -4, -2.4, 0.4, 1.2, '#ffffff')
  },
}

/** bilinmeyen şehir: altın yıldız */
const unknownKeepsake: ItemPainter = (c) => {
  const pts: number[] = []
  for (let k = 0; k < 10; k++) pts.push(Math.sin((k * Math.PI) / 5) * (k % 2 ? 2.2 : 5), -Math.cos((k * Math.PI) / 5) * (k % 2 ? 2.2 : 5))
  poly(c, pts, '#ffd86a', '#d0a030')
}

function glow(c: Ctx, r: number, color: string) {
  c.beginPath()
  c.arc(0, 0, r, 0, TAU)
  c.fillStyle = color
  c.fill()
}

/** dört köşeli parıltı */
function twinkle(c: Ctx, x: number, y: number, r: number) {
  c.beginPath()
  c.moveTo(x, y - r)
  c.quadraticCurveTo(x, y, x + r, y)
  c.quadraticCurveTo(x, y, x, y + r)
  c.quadraticCurveTo(x, y, x - r, y)
  c.quadraticCurveTo(x, y, x, y - r)
  c.fillStyle = '#ffffff'
  c.fill()
}

function begin(c: Ctx, x: number, y: number, sc: number) {
  c.save()
  c.translate(x, y)
  c.scale(sc, sc)
  c.lineJoin = 'round'
  c.lineCap = 'round'
  setInkWidth(INKW)
  halo = false
}

function end(c: Ctx) {
  setInkWidth(HERO_INKW)
  c.restore()
}

/**
 * Hatıra: şehrin toplanan nesnesi; (x, y) kutunun merkezi (ekran pikseli). Süzülme (bob) çağıranındır.
 * opt.taken: alınmış hatıra soluk siluet olarak kalır (rehber ve sayaç için).
 */
export function drawKeepsake(c: CanvasRenderingContext2D, city: CityKey, x: number, y: number, sc: number, t: number, opt?: { taken?: boolean }): void {
  begin(c, x, y, sc)
  try {
    if (opt?.taken) c.globalAlpha = 0.28
    else glow(c, 8 + Math.sin(t * 3) * 0.6, 'rgba(255,220,120,0.16)')
    ;(KEEPSAKES[city] ?? unknownKeepsake)(c)
    if (!opt?.taken) {
      const k = (t * 0.9 + x * 0.013) % 1
      if (k < 0.3) twinkle(c, 4.4, -4.4, Math.sin((k / 0.3) * Math.PI) * 1.6)
    }
  } finally {
    end(c)
  }
}

/* ── Ortak nesneler ───────────────────────────────────────────── */

/**
 * Ortak nesneler: anahtar, gizli pul, dash halkası (active; ready: oyuncunun dash'i harcanmış, charge: dolum 0..1),
 * nazar boncuğu, yay (squash 0..1).
 * (x, y) kutunun merkezi (ekran pikseli). accent: şehrin vurgu rengi (pulun resmi, yayın tablası).
 * crate: yay yerine kayısı kasası (Malatya).
 */
export function drawThing(
  c: CanvasRenderingContext2D,
  kind: 'key' | 'stamp' | 'crystal' | 'charm' | 'spring' | 'nitro',
  x: number,
  y: number,
  sc: number,
  t: number,
  opt?: { active?: boolean; ready?: boolean; charge?: number; squash?: number; accent?: string; crate?: boolean },
): void {
  begin(c, x, y, sc)
  try {
    const accent = opt?.accent ?? '#e8794a'
    switch (kind) {
      case 'key': {
        glow(c, 9, 'rgba(255,210,100,0.2)')
        c.rotate(-0.5 + Math.sin(t * 3) * 0.12)
        line(c, [-0.6, 0, 5.4, 0], 1.3, '#f2c14e')
        line(c, [3, 0.4, 3, 2.4], 1, '#f2c14e')
        line(c, [5.2, 0.4, 5.2, 2.8], 1, '#f2c14e')
        ring(c, -3, 0, 2.3, 1.5, '#f2c14e')
        line(c, [-4.6, -1.4, -3.4, -2.2], 0.45, '#fff0b8', false)
        break
      }
      case 'stamp': {
        glow(c, 10.5, 'rgba(255,240,200,0.18)')
        c.rotate(Math.sin(t * 2) * 0.08)
        // tırtıklı kenar
        shape(
          c,
          () => {
            const h = 4.4
            const r = 1.1
            for (let i = 0; i < 4; i++) c.arc(-3.3 + i * 2.2, -h, r, Math.PI, 0)
            for (let i = 0; i < 4; i++) c.arc(h, -3.3 + i * 2.2, r, -Math.PI / 2, Math.PI / 2)
            for (let i = 0; i < 4; i++) c.arc(3.3 - i * 2.2, h, r, 0, Math.PI)
            for (let i = 0; i < 4; i++) c.arc(-h, 3.3 - i * 2.2, r, Math.PI / 2, Math.PI * 1.5)
          },
          '#f8f0dc',
          '#d8c8a8',
        )
        c.fillStyle = accent
        c.fillRect(-3.4, -3.6, 6.8, 5)
        dab(c, 1.6, -2, 1, 1, '#fff4c8')
        c.beginPath()
        c.moveTo(-3.4, 1.4)
        c.lineTo(-1, -1.2)
        c.lineTo(0.6, 0.4)
        c.lineTo(1.6, -0.4)
        c.lineTo(3.4, 1.4)
        c.fillStyle = 'rgba(34,22,31,0.45)'
        c.fill()
        line(c, [-2.6, 3, 2.6, 3], 0.6, '#3a2a1e', false)
        break
      }
      case 'crystal': {
        // Dash halkası: toplanmaz, içinden geçilir. Dokunmatik DASH tuşunun aynısı (koyu disk, kırmızı halka, » okları),
        // oyuncu "bu bir dash" diye okusun, hatıra ya da mücevher sanmasın.
        const RED = '#e5484d'
        if (opt?.active === false) {
          // harcandı: soluk kesik halka, saat gibi dolan yay; dolunca geri gelir
          const k = Math.max(0, Math.min(1, opt?.charge ?? 0))
          c.globalAlpha = 0.45
          c.setLineDash([1.4, 1.2])
          c.beginPath()
          c.arc(0, 0, 4.3, 0, TAU)
          c.strokeStyle = RED
          c.lineWidth = 0.6
          c.stroke()
          c.setLineDash([])
          c.globalAlpha = 0.85
          c.beginPath()
          c.arc(0, 0, 4.3, -Math.PI / 2, -Math.PI / 2 + k * TAU)
          c.lineWidth = 1.1
          c.stroke()
          break
        }
        // dash hakkın varken soluk durur (o an işe yaramaz); dash'i harcayınca parlar ve dalga yayar
        const ready = opt?.ready !== false
        if (ready) {
          for (let i = 0; i < 2; i++) {
            const ph = (t * 1.1 + i * 0.5) % 1
            c.globalAlpha = (1 - ph) * 0.55
            c.beginPath()
            c.arc(0, 0, 5.6 + ph * 4.5, 0, TAU)
            c.strokeStyle = '#ff8a70'
            c.lineWidth = 0.6
            c.stroke()
          }
          c.globalAlpha = 1
          glow(c, 8 + Math.sin(t * 4) * 0.6, 'rgba(255,110,90,0.22)')
        } else c.globalAlpha = 0.6
        ell(c, 0, 0, 5.2, 5.2, '#2a2038', '#1a1426')
        ring(c, 0, 0, 4.1, 1.05, RED)
        // » : ileri doğru hafifçe kayan iki ok
        const dx = ready ? Math.sin(t * 6) * 0.35 : 0
        const ch = ready ? '#ffffff' : '#cfc6dc'
        line(c, [-2.5 + dx, -2, -0.9 + dx, 0, -2.5 + dx, 2], 0.95, ch, false)
        line(c, [-0.1 + dx, -2, 1.5 + dx, 0, -0.1 + dx, 2], 0.95, ch, false)
        dab(c, -2.6, -3.2, 1.1, 0.5, 'rgba(255,255,255,0.35)', -0.6)
        break
      }
      case 'nitro': {
        // Nitro tüpü: kırmızı gövdeli çelik tüp, ağzında turuncu alev; oyunun dash kırmızısından ayrı (sıcak turuncu)
        if (opt?.active === false) {
          // harcandı: soluk dış hat ve saat gibi dolan yay
          const k = Math.max(0, Math.min(1, opt?.charge ?? 0))
          c.globalAlpha = 0.4
          c.setLineDash([1.2, 1])
          c.strokeStyle = '#ff9a3c'
          c.lineWidth = 0.6
          c.strokeRect(-3, -5, 6, 10)
          c.setLineDash([])
          c.globalAlpha = 0.85
          c.beginPath()
          c.arc(0, 0, 6.2, -Math.PI / 2, -Math.PI / 2 + k * TAU)
          c.lineWidth = 0.9
          c.stroke()
          c.globalAlpha = 1
          break
        }
        c.translate(0, Math.sin(t * 3) * 0.6)
        glow(c, 8.5 + Math.sin(t * 5) * 0.5, 'rgba(255,150,60,0.2)')
        // alev: üç dilli, saatle titrer
        const f = Math.sin(t * 18) * 0.6
        poly(c, [-2.2, -5.6, -1.2, -9.4 - f, 0, -7.2, 1.2, -10 + f, 2.2, -5.6], '#ff9a3c', '#d8641e')
        dab(c, 0, -6.6, 0.9, 1.5, '#ffe27a')
        // arkasında hız okları: "hızlandırır" diye okunsun (saatle kayar)
        {
          const sh = (t * 6) % 2
          c.globalAlpha = 0.75
          for (const [dx, a] of [[-7.5, 0.5], [-5.6, 0.9]] as const) {
            c.globalAlpha = a * 0.8
            line(c, [dx - sh, -2.4, dx + 1.6 - sh, 0, dx - sh, 2.4], 0.7, '#ffcf5a', false)
          }
          c.globalAlpha = 1
        }
        // gövde, beyaz bant üstünde şimşek amblemi, kapak
        poly(c, [-3.2, -4.6, 3.2, -4.6, 3.2, 5, -3.2, 5], '#d6403a', '#9a2a26')
        poly(c, [-3.2, -2.2, 3.2, -2.2, 3.2, 3, -3.2, 3], '#f2f0f4')
        poly(c, [0.6, -1.9, -1.4, 0.7, -0.1, 0.7, -0.7, 2.7, 1.5, -0.1, 0.2, -0.1, 0.9, -1.9], '#ffb52e', '#c87610')
        poly(c, [-2, -6, 2, -6, 2, -4.6, -2, -4.6], '#8f96a3', '#5a5f6a')
        dab(c, -2.3, -3.4, 0.5, 0.9, 'rgba(255,255,255,0.55)')
        break
      }
      case 'charm': {
        // nazar boncuğu: ipte hafifçe sallanır
        c.translate(0, -8)
        c.rotate(Math.sin(t * 2.4) * 0.14)
        c.translate(0, 8)
        line(c, [0, -8, 0, -4.6], 0.5, '#c9a24a')
        glow(c, 9, 'rgba(120,190,255,0.16)')
        ell(c, 0, 0, 5, 5, '#1d3f9a', '#142c70')
        dab(c, 0, 0, 3.2, 3.2, '#f4f8ff')
        dab(c, 0, 0, 2.1, 2.1, '#4ab0e8')
        dab(c, 0, 0, 1, 1, '#120f1a')
        dab(c, -2.6, -2.8, 0.9, 0.55, 'rgba(255,255,255,0.8)', -0.7)
        break
      }
      case 'spring': {
        // kutu 14x8: tabla üstte (y = -4), taban altta (y = 4); basılınca tabla 3 piksel iner
        const sq = Math.max(0, Math.min(1, opt?.squash ?? 0)) * 3
        if (opt?.crate) {
          for (let i = 0; i < 5; i++) ell(c, -4.8 + i * 2.4, -3.6 + sq, 1.6, 1.5, i % 2 ? '#f39a2e' : '#ffb84a')
          poly(c, [-7, -2.6 + sq, 7, -2.6 + sq, 6.4, 4, -6.4, 4], '#b8763e', '#7a4a24')
          line(c, [-6.4, 0.8 + sq / 2, 6.4, 0.8 + sq / 2], 0.45, '#7a4a24', false)
          for (const px of [-3, 3]) line(c, [px, -2 + sq, px, 3.6], 0.45, '#7a4a24', false)
          break
        }
        poly(c, [-5, 2.2, 5, 2.2, 5.6, 4, -5.6, 4], '#4a4458')
        const top = -2.6 + sq
        const pts: number[] = []
        for (let i = 0; i <= 4; i++) pts.push(i % 2 ? 3.4 : -3.4, top + ((2.2 - top) * i) / 4)
        line(c, pts, 0.8, '#b4bccb')
        poly(c, [-7, -4 + sq, 7, -4 + sq, 6.4, -2 + sq, -6.4, -2 + sq], accent)
        line(c, [-5.6, -3.4 + sq, 5.6, -3.4 + sq], 0.4, 'rgba(255,255,255,0.55)', false)
        break
      }
    }
  } finally {
    end(c)
  }
}
