/**
 * Amblem ve paylaşım sahnesi: oyunun çizim diliyle (heroDraw fırçaları, mürekkep hat, tek kademe gölge).
 * Tarayıcıda çalışır; scripts/art/icons.cjs esbuild ile paketleyip tuvale çizer ve dosyaya basar.
 * Birim: amblem 100x100'lük karede çizilir, `size` ile ölçeklenir.
 */
import { INK, LOOKS, POSES, blob, drawHero, gait, setInkWidth, stroke } from '../../game/heroDraw'

type Ctx = CanvasRenderingContext2D

const SKY = '#3b2a58'
const DUSK = '#6a3560'
const SUN = '#ffe29a'
const SUN_S = '#f2c14e'
const RING = '#e8794a'
const RING_S = '#c9503c'
const HILL = '#1c1426'
const FAR = '#4d3068'
const SCARF = '#e0423a'
const SCARF_S = '#a3262f'
const CREAM = '#f4ead8'
const SKIN = LOOKS.uktun.skin
/** heroDraw'ın kendi dış hat kalınlığı (çizim biriminde) */
const HERO_INK = 3.2

const circle = (c: Ctx, x: number, y: number, r: number) => () => c.arc(x, y, r, 0, Math.PI * 2)

/** Güneş: kiremit halka + altın disk; gölge sağ altta (ışık sol üstten). */
function sun(c: Ctx, x: number, y: number, r: number, ink: number) {
  setInkWidth(ink)
  blob(c, circle(c, x, y, r), RING, { color: RING_S, dx: -r * 0.07, dy: -r * 0.07 })
  blob(c, circle(c, x, y, r * 0.8), SUN, { color: SUN_S, dx: -r * 0.09, dy: -r * 0.09 })
  setInkWidth(HERO_INK)
}

/** Rüzgârdaki atkı ucu: karakter biriminde (ayak tabanı 0,0), enseden geriye doğru dalgalanır. */
function scarfTail(c: Ctx, x: number, y: number, size: number, ink: number, len = 1) {
  c.save()
  c.translate(x, y)
  c.scale(size / 100, size / 100)
  setInkWidth(ink)
  const L = (v: number) => -9 + (v + 9) * len
  blob(
    c,
    () => {
      c.moveTo(-9, -57)
      c.bezierCurveTo(L(-22), -68, L(-32), -52, L(-47), -63)
      c.lineTo(L(-58), -69)
      c.lineTo(L(-52), -59)
      c.lineTo(L(-60), -51)
      c.bezierCurveTo(L(-40), -41, L(-26), -56, -9, -47)
    },
    SCARF,
    { color: SCARF_S, dx: 0, dy: -3.4 },
  )
  setInkWidth(HERO_INK)
  c.restore()
}

/** Zıplayan Uktun: kalın hatla; atkının ucu saçın arkasından çıkıp rüzgârda uzar. */
function hopper(c: Ctx, x: number, y: number, size: number, ink: number) {
  scarfTail(c, x, y, size, ink, 1.22)
  setInkWidth(ink)
  drawHero(c, 'uktun', { ...POSES.jump, mood: 'happy' }, x, y, size, false, 0.3, { scarf: SCARF, scarfS: SCARF_S })
  setInkWidth(HERO_INK)
}

function backdrop(c: Ctx) {
  c.fillStyle = SKY
  c.fillRect(-10, -10, 120, 120)
  // ufka yakın alacakaranlık kuşağı
  c.fillStyle = DUSK
  c.beginPath()
  c.ellipse(50, 96, 92, 46, 0, 0, Math.PI * 2)
  c.fill()
}

function hill(c: Ctx, ink: number) {
  setInkWidth(ink)
  blob(
    c,
    () => {
      c.moveTo(-12, 112)
      c.lineTo(-12, 90)
      c.quadraticCurveTo(22, 80, 52, 87)
      c.quadraticCurveTo(84, 94, 112, 84)
      c.lineTo(112, 112)
    },
    HILL,
  )
  setInkWidth(HERO_INK)
}

export interface EmblemOpts {
  /** yuvarlak köşe + mürekkep çerçeve (saydam köşe); kapalıysa dolu kare (iOS, maskable) */
  round?: boolean
  /** içerik ölçeği (maskable güvenli alan için 0.8) */
  inset?: number
}

/** Ana amblem: gün batımı diskinin önünde seken kırmızı atkılı Uktun. */
export function drawEmblem(c: Ctx, size: number, o: EmblemOpts = {}) {
  const k = size / 100
  c.save()
  c.scale(k, k)
  if (o.round) {
    c.beginPath()
    c.roundRect(1.5, 1.5, 97, 97, 21)
    c.clip()
  }
  backdrop(c)
  const s = o.inset ?? 1
  c.save()
  c.translate(50, 50)
  c.scale(s, s)
  c.translate(-50, -50)
  sun(c, 55, 46, 37, 2.6)
  hill(c, 2.6)
  // sekme izi: ayağın altında iki kısa yay
  stroke(c, [38, 86, 44, 83.5, 50, 85], 2, CREAM, false)
  stroke(c, [55, 86.5, 60, 85, 65, 86.5], 2, CREAM, false)
  hopper(c, 57, 81, 68, 4.4)
  c.restore()
  c.restore()
  if (o.round) frame(c, size)
}

function frame(c: Ctx, size: number) {
  const k = size / 100
  c.save()
  c.scale(k, k)
  c.beginPath()
  c.roundRect(2.5, 2.5, 95, 95, 20)
  c.strokeStyle = INK
  c.lineWidth = 4
  c.stroke()
  c.restore()
}

// ── sekme işareti (favicon): cepheden yüz + kırmızı atkı, altın güneşin önünde ──

const MARK_HAIR = '#c4532a'
const BLUSH = '#f0a08c'
const LIP = '#b23a4a'

/** 16 px: elle kurulan piksel ızgarası (bu boyda eğri yok, her piksel bilerek konur). */
const MARK_16 = [
  '..PPPPPPPPPPPP..',
  '.PPGGGGGGGGGGPP.',
  'PPGGGKKKKKKGGGPP',
  'PGGGKHHHHHHKGGGP',
  'PGGKHHHHHHHHKGGP',
  'PGGKHHHHSSSHKGGP',
  'PGGKHSKSSKSHKGGP',
  'PGGKHSKSSKSHKGGP',
  'PGGKHBSSSSBHKGGP',
  'PGGKHSSLLSSHKGGP',
  'PGGKKSSSSSSKKGGP',
  'PPKRRRRRRRRRRKKP',
  'PPKRRRRRRRRRRRRK',
  'PPPKKKKKKKKKRRKP',
  '.PPPPPPPPPPPKKP.',
  '..PPPPPPPPPPPP..',
]
const MARK_PAL: Record<string, string> = { P: SKY, G: SUN_S, K: INK, H: MARK_HAIR, S: SKIN, B: BLUSH, L: LIP, R: SCARF }

/**
 * Sekme işareti. `n` hedef boy (16, 32, 48), `scale` tuvalin kaç kat büyük çizildiği.
 * 16'da piksel ızgarası; 32 ve 48'de aynı düzen 16 birimlik karede vektörle (hat 1 birim: tam 2 ve 3 piksel).
 */
export function drawMark(c: Ctx, n: number, scale: number) {
  c.save()
  c.scale(scale, scale)
  if (n <= 16) {
    MARK_16.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '.') continue
        c.fillStyle = MARK_PAL[row[x]]
        c.fillRect(x, y, 1, 1)
      }
    })
    c.restore()
    return
  }
  c.scale(n / 16, n / 16)
  c.beginPath()
  c.roundRect(0, 0, 16, 16, 3.5)
  c.clip()
  c.fillStyle = SKY
  c.fillRect(0, 0, 16, 16)
  c.fillStyle = SUN_S
  c.beginPath()
  c.arc(8, 7.5, 7, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = SUN
  c.beginPath()
  c.arc(7.4, 6.9, 5.6, 0, Math.PI * 2)
  c.fill()
  setInkWidth(1)
  // saç: tepeden omuza inen uzun kızıl saç
  blob(
    c,
    () => {
      c.moveTo(3.5, 12.5)
      c.lineTo(3.5, 7)
      c.bezierCurveTo(3.5, 1, 12.5, 1, 12.5, 7)
      c.lineTo(12.5, 12.5)
    },
    MARK_HAIR,
  )
  // yüz
  c.fillStyle = SKIN
  c.beginPath()
  c.roundRect(5, 5, 6, 7, 2.2)
  c.fill()
  // perçem: yana taranmış, alnın solunu örter
  c.fillStyle = MARK_HAIR
  c.beginPath()
  c.moveTo(4.6, 8.4)
  c.quadraticCurveTo(5.4, 6.2, 9, 5.5)
  c.lineTo(9.5, 4.8)
  c.quadraticCurveTo(10.4, 5.6, 11.4, 7.2)
  c.lineTo(11.4, 3.6)
  c.lineTo(4.6, 3.6)
  c.closePath()
  c.fill()
  // gözler, yanak, gülümseme
  c.fillStyle = INK
  c.beginPath()
  // yarım birim = 32'de tam bir piksel: göz ve ağız ızgaraya oturur
  c.roundRect(6, 6.5, 1, 2, 0.45)
  c.roundRect(9, 6.5, 1, 2, 0.45)
  c.fill()
  c.fillStyle = '#ffffff'
  c.fillRect(6.5, 6.5, 0.5, 0.5)
  c.fillRect(9.5, 6.5, 0.5, 0.5)
  c.fillStyle = BLUSH
  c.fillRect(5.5, 9, 1, 0.5)
  c.fillRect(9.5, 9, 1, 0.5)
  c.fillStyle = LIP
  c.beginPath()
  c.moveTo(7, 9.5)
  c.lineTo(9, 9.5)
  c.quadraticCurveTo(8, 11.3, 7, 9.5)
  c.fill()
  // atkı: boyun sargısı ve sağa uçan çatallı uç tek parça
  blob(
    c,
    () => {
      c.moveTo(3.5, 11.5)
      c.lineTo(12, 11.5)
      c.lineTo(15.2, 10.8)
      c.lineTo(14.2, 12.6)
      c.lineTo(15.4, 14.4)
      c.lineTo(12, 14)
      c.lineTo(3.5, 14)
    },
    SCARF,
    { color: SCARF_S, dx: 0, dy: -0.9 },
  )
  setInkWidth(HERO_INK)
  c.restore()
}

// ── paylaşım görseli (1200x630): gün batımı, şehir silueti, iki yolcu ──

function skyline(c: Ctx, base: number, color: string, shapes: Array<(c: Ctx, b: number) => void>, ink: number) {
  setInkWidth(ink)
  for (const f of shapes) blob(c, () => f(c, base), color)
  setInkWidth(HERO_INK)
}

const dome = (x: number, w: number, h: number) => (c: Ctx, b: number) => {
  c.moveTo(x - w / 2, b + 40)
  c.lineTo(x - w / 2, b - h * 0.35)
  c.bezierCurveTo(x - w / 2, b - h * 1.05, x + w / 2, b - h * 1.05, x + w / 2, b - h * 0.35)
  c.lineTo(x + w / 2, b + 40)
}
const minaret = (x: number, h: number) => (c: Ctx, b: number) => {
  c.moveTo(x - 6, b + 40)
  c.lineTo(x - 6, b - h * 0.62)
  c.lineTo(x - 10, b - h * 0.62)
  c.lineTo(x - 10, b - h * 0.7)
  c.lineTo(x - 5, b - h * 0.7)
  c.lineTo(x - 5, b - h * 0.86)
  c.lineTo(x, b - h)
  c.lineTo(x + 5, b - h * 0.86)
  c.lineTo(x + 5, b - h * 0.7)
  c.lineTo(x + 10, b - h * 0.7)
  c.lineTo(x + 10, b - h * 0.62)
  c.lineTo(x + 6, b - h * 0.62)
  c.lineTo(x + 6, b + 40)
}
const ridge = (pts: number[]) => (c: Ctx, b: number) => {
  c.moveTo(pts[0], b + 400)
  c.lineTo(pts[0], b - pts[1])
  for (let i = 2; i < pts.length; i += 4) c.quadraticCurveTo(pts[i], b - pts[i + 1], pts[i + 2], b - pts[i + 3])
  c.lineTo(pts[pts.length - 2], b + 400)
}

/** Paylaşım sahnesi: yazı sol yarıya dizilir (icons.cjs), sahne sağda toplanır. */
export function drawShare(c: Ctx, w: number, h: number) {
  c.fillStyle = SKY
  c.fillRect(0, 0, w, h)
  c.fillStyle = DUSK
  c.beginPath()
  c.ellipse(860, 560, 760, 330, 0, 0, Math.PI * 2)
  c.fill()
  // yıldızlar: sol üstte birkaç krem nokta
  c.fillStyle = 'rgba(244,234,216,0.75)'
  for (const [x, y, r] of [[96, 60, 3], [330, 44, 2.2], [560, 96, 2.6], [700, 40, 2], [1130, 70, 2.6], [1010, 36, 2], [450, 150, 2]]) {
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
  }
  sun(c, 900, 314, 232, 7)
  // uzak sıra: tepeler, kubbe ve minareler
  skyline(c, 478, FAR, [ridge([-20, 30, 160, 96, 330, 46, 470, 10, 620, 52, 760, 96, 930, 40, 1080, 0, 1230, 70]), dome(1128, 110, 84), minaret(1054, 146)], 5)
  // yakın sıra: mürekkep moru zemin ve kale burcu
  skyline(c, 560, HILL, [ridge([-20, 44, 220, 96, 470, 40, 700, -6, 900, 24, 1080, 40, 1230, 16])], 5)
  // iki yolcu: Memo geride koşar, Uktun güneşin önünde seker
  drawHero(c, 'memo', { ...gait(0.02), mood: 'happy' }, 768, 576, 216, false, 0.36, { moving: true })
  stroke(c, [868, 576, 898, 566, 928, 572], 6, CREAM, false)
  stroke(c, [952, 576, 978, 568, 1004, 576], 6, CREAM, false)
  hopper(c, 962, 474, 320, HERO_INK)
}
