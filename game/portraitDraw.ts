/**
 * Portreler: oyundaki karakterin vesikalığı. heroDraw.ts ile aynı dil (mürekkep dış hat, düz renk,
 * tek kademe gölge, ışık sol üstten) ve aynı palet (LOOKS); yalnız yakından ve ayrıntılı.
 * Kadraj vesikalık gibidir: baş tam, yüz kadrajı doldurur, boyun ve omuzların yalnız üstü görünür, fon sade.
 * Birim: 100 x 119'luk çerçeve (64:76), yüz hafifçe sağa dönük; kılığa göre saç, sakal, başlık ve yaka değişir.
 */
import { INK, LOOKS, blob, setInkWidth, stroke, type Look } from './heroDraw'

type Skin = (typeof LOOKS)[Look]
type Ctx = CanvasRenderingContext2D

export const PORTRAIT_W = 100
export const PORTRAIT_H = 119

/** heroDraw'ın varsayılan dış hattı: çizim bitince geri yazılır */
const HERO_INKW = 3.2
const INKW = 2.5

export interface PortraitOpts {
  /** oyuncunun seçtiği atkı (lib/extras.ts SCARVES): renk ve gölgesi */
  scarf?: string
  scarfS?: string
  /** yalnız yüz: kare çerçeveye kaştan çeneye kırpılır (gösterge pulu) */
  face?: boolean
  /** hareketsiz: nefes, salınım ve göz kırpma yok */
  still?: boolean
}

/** Fon: vesikalık perdesi gibi sade; kılığın renklerine karşıt tek ton, ortası aydınlık */
const BACKDROP: Record<Look, [string, string]> = {
  uktun: ['#b9c6e6', '#7f90c2'],
  memo: ['#f6dcae', '#e2a878'],
  amca: ['#f2dcb6', '#d8a67e'],
  teyze: ['#cfe6d6', '#8fbfa8'],
  usta: ['#f8dcaa', '#e6a672'],
  genc: ['#f6d2c8', '#dc98a0'],
  coban: ['#d2e6ee', '#92bcd2'],
  ozan: ['#f4dc9e', '#d8a45c'],
}

function ell(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  c.beginPath()
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
}

/** mürekkepsiz ince eğri: tel, kırışık, kıvrım */
function curve(c: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string) {
  c.beginPath()
  c.moveTo(x0, y0)
  c.quadraticCurveTo(cx, cy, x1, y1)
  c.strokeStyle = color
  c.lineWidth = w
  c.lineCap = 'round'
  c.stroke()
}

function background(c: Ctx, look: Look) {
  const [mid, edge] = BACKDROP[look]
  const g = c.createRadialGradient(46, 46, 8, 50, 60, 92)
  g.addColorStop(0, mid)
  g.addColorStop(1, edge)
  c.fillStyle = g
  c.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H)
}

// ── gövde ────────────────────────────────────────────────────────────────

function shoulders(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(3, 124)
      c.bezierCurveTo(3, 102, 14, 94, 38, 89.5)
      c.quadraticCurveTo(52, 93, 64, 89.5)
      c.bezierCurveTo(88, 94, 97, 102, 98, 124)
    },
    s.coat,
    { color: s.coatS, dx: -4.5, dy: -1.5 },
  )
  // omuz ışığı ve kol dikişi
  curve(c, 9, 109, 12, 98.5, 28, 94.5, 2, s.coatL)
  curve(c, 20, 119, 19, 110, 22, 103, 1.1, s.coatS)
  curve(c, 82, 119, 83, 110, 80, 103, 1.1, s.coatS)
}

function collar(c: Ctx, s: Skin) {
  // gömlek: boyun dibinde V açıklık, iki yaka ucu
  blob(
    c,
    () => {
      c.moveTo(39.5, 89)
      c.lineTo(63, 89)
      c.lineTo(52.5, 110)
    },
    s.shirt,
    { color: 'rgba(60,40,70,0.16)', dx: -3, dy: -1 },
  )
  // ceket yakaları (klapa)
  blob(
    c,
    () => {
      c.moveTo(38.5, 88.5)
      c.quadraticCurveTo(41, 100, 52, 111)
      c.lineTo(52, 124)
      c.lineTo(33.5, 124)
      c.quadraticCurveTo(29, 101, 38.5, 88.5)
    },
    s.coatL,
    { color: s.coat, dx: -2.6, dy: -1 },
  )
  blob(
    c,
    () => {
      c.moveTo(64, 88.5)
      c.quadraticCurveTo(62, 100, 52.5, 111)
      c.lineTo(52.5, 124)
      c.lineTo(70, 124)
      c.quadraticCurveTo(73.5, 101, 64, 88.5)
    },
    s.coat,
    { color: s.coatS, dx: -3, dy: -1 },
  )
}

function neck(c: Ctx, s: Skin) {
  const path = () => {
    c.moveTo(42.5, 72)
    c.lineTo(42, 89)
    c.quadraticCurveTo(51.5, 96, 61.5, 89)
    c.lineTo(61.5, 72)
  }
  blob(c, path, s.skin, { color: s.skinS, dx: -4, dy: 0 })
  // çenenin boyuna düşen gölgesi
  c.save()
  c.beginPath()
  path()
  c.clip()
  ell(c, 54, 77.5, 15, 7.5, s.skinS)
  c.restore()
}

/** atkı: vesikalıkta yalnız boynu saran bir şerit olarak görünür; önde bir kat öbürünün üstüne biner */
function scarf(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(35.5, 83.5)
      c.quadraticCurveTo(52, 93.5, 68.5, 83)
      c.quadraticCurveTo(72.5, 89, 70.5, 95.5)
      c.quadraticCurveTo(52, 108.5, 33.5, 96)
      c.quadraticCurveTo(31.5, 89.5, 35.5, 83.5)
    },
    s.scarf,
    { color: s.scarfS, dx: -2.5, dy: -3.4 },
  )
  // üstteki kat: sağ omuzdan sola iner
  blob(
    c,
    () => {
      c.moveTo(68.5, 83)
      c.quadraticCurveTo(72.5, 89, 70.5, 95.5)
      c.quadraticCurveTo(58, 104.5, 44.5, 103)
      c.quadraticCurveTo(58, 97.5, 68.5, 83)
    },
    s.scarf,
    { color: s.scarfS, dx: -2, dy: -2.4 },
  )
  // kıvrımlar
  curve(c, 37.5, 90.5, 43, 95.5, 50, 97.5, 1, s.scarfS)
  curve(c, 62, 96, 65.5, 93, 67.5, 89, 1, s.scarfS)
}

// ── baş ──────────────────────────────────────────────────────────────────

function headPath(c: Ctx) {
  c.moveTo(27.5, 51)
  c.bezierCurveTo(25, 27, 77, 23, 76.5, 49)
  c.bezierCurveTo(77, 61, 72.5, 72.5, 61, 78)
  c.bezierCurveTo(52, 81.5, 30, 74, 27.5, 51)
}

function ear(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.ellipse(27.6, 57, 4.4, 6, -0.12, 0, Math.PI * 2)
    },
    s.skin,
    { color: s.skinS, dx: -1.4, dy: -1.2 },
  )
  curve(c, 25.4, 54.6, 26.4, 52.4, 28.6, 53.6, 1, s.skinS)
  curve(c, 26, 55.4, 29, 57, 27, 60.4, 1, s.skinS)
}

function eye(c: Ctx, s: Skin, x: number, y: number, rx: number, ry: number, shut: boolean, lash: boolean, gx: number) {
  if (shut) {
    curve(c, x - rx, y + 0.6, x, y + 3.6, x + rx, y + 0.4, 1.9, INK)
    if (lash) curve(c, x - rx, y + 0.6, x - rx - 1.4, y + 1.2, x - rx - 2, y + 2.4, 1.2, INK)
    return
  }
  const ir = ry * 0.86
  c.save()
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fillStyle = '#fffdf8'
  c.fill()
  c.clip()
  // iris: koyu halka, altta ışık alan yarım ay, göz bebeği
  ell(c, x + gx, y + 0.5, ir, ir * 1.04, s.iris)
  ell(c, x + gx, y + ir * 0.5, ir * 0.72, ir * 0.5, 'rgba(255,206,140,0.42)')
  c.beginPath()
  c.ellipse(x + gx, y + 0.5, ir - 0.3, ir * 1.04 - 0.3, 0, 0, Math.PI * 2)
  c.strokeStyle = 'rgba(34,22,31,0.55)'
  c.lineWidth = 0.7
  c.stroke()
  ell(c, x + gx, y + 0.3, ir * 0.5, ir * 0.56, INK)
  // üst kapak gölgesi
  ell(c, x, y - ry * 1.05, rx * 1.3, ry * 0.62, 'rgba(34,22,31,0.26)')
  c.restore()
  // ışıltı: büyük sol üstte, küçük sağ altta
  ell(c, x + gx - ir * 0.4, y - ir * 0.36, ir * 0.3, ir * 0.3, '#ffffff')
  ell(c, x + gx + ir * 0.42, y + ir * 0.5, ir * 0.14, ir * 0.14, '#ffffff')
  // üst kirpik çizgisi: kalın, dış uçta hafif kalkar
  c.beginPath()
  c.moveTo(x - rx - 0.9, y - 0.2)
  c.quadraticCurveTo(x - rx * 0.5, y - ry - 1.5, x + rx * 0.2, y - ry - 0.5)
  c.quadraticCurveTo(x + rx * 0.9, y - ry * 0.7, x + rx + 0.9, y - 0.6)
  c.strokeStyle = INK
  c.lineWidth = 1.9
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.stroke()
  if (lash) curve(c, x - rx - 0.7, y - 0.4, x - rx - 1.9, y - 1, x - rx - 2.5, y - 2.6, 1.3, INK)
  // kapak kıvrımı ve alt kapak
  curve(c, x - rx * 0.8, y - ry - 1.5, x - rx * 0.1, y - ry - 3.3, x + rx * 0.9, y - ry - 1.5, 0.8, s.skinS)
  curve(c, x - rx * 0.75, y + ry * 0.82, x, y + ry * 1.12, x + rx * 0.75, y + ry * 0.8, 0.8, s.skinS)
}

/** kaş: iç ucu dolgun, dış ucu incelen dolu bir fırça izi; th kalınlık */
function brow(c: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, th: number, color: string) {
  c.beginPath()
  c.moveTo(x0, y0)
  c.quadraticCurveTo(cx, cy, x1, y1)
  c.quadraticCurveTo(cx, cy + th * 2, x0, y0 + th)
  c.closePath()
  c.fillStyle = color
  c.fill()
  c.strokeStyle = color
  c.lineWidth = 0.9
  c.lineJoin = 'round'
  c.stroke()
}

function face(c: Ctx, look: Look, s: Skin, shut: boolean) {
  const fem = !!s.long || s.hat === 'yazma'
  const old = look === 'amca' || look === 'ozan' || look === 'teyze'
  // yanaklar
  ell(c, 37.5, 64.5, 5.4, 3.3, s.blush)
  ell(c, 70, 63.5, 3.8, 3, s.blush)
  // gözler: yakın göz iri, uzak göz dönük yüzde biraz dar
  eye(c, s, 43.8, 55.4, 5, fem ? 6 : 5.3, shut, fem, 0.7)
  eye(c, s, 65, 54.9, 4.1, fem ? 5.7 : 5, shut, false, 0.5)
  // kaşlar: gözün epey üstünde, yukarı kavisli (meraklı, dostça); iç uç (buruna yakın) dolgun
  const th = fem ? 0.9 : look === 'genc' ? 1.3 : 1.8
  brow(c, 50.4, 44, 43.4, 40.4, 36.6, 46.2, th, s.brow)
  brow(c, 60.2, 43.6, 65.6, 40.2, 71, 45, th, s.brow)
  // burun: uzak yanda sırt çizgisi, yuvarlak uç, tek delik ve uçta ışık
  curve(c, 58.6, 57.4, 61.4, 62.4, 59.6, 64.6, 1.3, s.skinS)
  curve(c, 53.6, 64.6, 56.4, 67, 59.6, 64.6, 1.3, s.skinS)
  ell(c, 54.9, 64.4, 0.8, 0.55, s.skinS)
  ell(c, 56.2, 62, 1.5, 1.1, 'rgba(255,255,255,0.4)')
  if (old) {
    // gülüş çizgileri
    curve(c, 34.6, 51.5, 33, 53.5, 33.4, 56, 0.8, s.skinS)
    curve(c, 73.2, 51.5, 74.4, 53.2, 74, 55.6, 0.8, s.skinS)
    curve(c, 48, 62.4, 46.6, 65, 47.4, 67.6, 0.8, s.skinS)
    curve(c, 63.4, 62, 64.8, 64.6, 64.2, 67, 0.8, s.skinS)
  }
  if (look === 'uktun') {
    // çiller
    c.fillStyle = s.skinS
    for (const [x, y] of [[49.5, 61], [51.6, 62.8], [47.4, 63.2], [62.6, 61.4], [64.6, 62.8], [50.6, 59.4], [45.6, 61.4], [66.6, 61.2]]) {
      c.beginPath()
      c.arc(x, y, 0.55, 0, Math.PI * 2)
      c.fill()
    }
  }
}

function mouth(c: Ctx, look: Look, s: Skin) {
  if (look === 'uktun' || look === 'genc') {
    // açık gülüş: üstte diş, altta dil; altında dudak gölgesi
    const lips = () => {
      c.beginPath()
      c.moveTo(48.4, 69.4)
      c.quadraticCurveTo(55.6, 71.4, 62.6, 68.8)
      c.quadraticCurveTo(57.5, 78, 48.4, 69.4)
      c.closePath()
    }
    c.save()
    lips()
    c.fillStyle = '#7a2230'
    c.fill()
    c.clip()
    c.fillStyle = '#fffdf8'
    c.fillRect(46, 67, 20, 3.9)
    ell(c, 56.4, 75.6, 3.6, 2, '#e8707a')
    c.restore()
    lips()
    c.strokeStyle = INK
    c.lineWidth = 1.3
    c.lineJoin = 'round'
    c.stroke()
    curve(c, 47.2, 68.2, 47.6, 69.2, 48.6, 69.6, 1.2, INK)
    curve(c, 63.6, 67.8, 63.4, 68.6, 62.4, 69, 1.2, INK)
    curve(c, 53.4, 77.6, 56, 78.6, 58.6, 77.2, 0.9, s.skinS)
    return
  }
  // kapalı gülümseme; sakallıda açık renk, bıyıklıda bıyığın altında
  const y = s.mustache && !s.beard ? 3.4 : s.beard ? 1.8 : 1
  const col = s.beard ? '#f0c4a8' : '#a8364a'
  if (!s.beard) {
    // alt dudak: gülüşün altında yumuşak bir dolgu
    c.beginPath()
    c.moveTo(51, 70.4 + y)
    c.quadraticCurveTo(56, 72.6 + y, 61, 70 + y)
    c.quadraticCurveTo(56.4, 76 + y, 51, 70.4 + y)
    c.fillStyle = look === 'teyze' ? '#e0707a' : s.blush
    c.fill()
  }
  curve(c, 49.4, 68.6 + y, 56, 73.2 + y, 62.6, 68 + y, 1.8, col)
  if (!s.beard) {
    curve(c, 48.2, 67.6 + y, 48.4, 68.6 + y, 49.6, 68.9 + y, 1.2, col)
    curve(c, 63.8, 67 + y, 63.6, 68 + y, 62.4, 68.3 + y, 1.2, col)
  }
}

function beard(c: Ctx, s: Skin, long: boolean) {
  const d = long ? 15 : 0
  blob(
    c,
    () => {
      // dış hat: favoriden çeneye, çeneden öteki yanağa
      c.moveTo(27.4, 52)
      c.bezierCurveTo(27.5, 70 + d * 0.3, 38, 84 + d, 57, 84.5 + d * 1.15)
      c.bezierCurveTo(70, 83 + d * 0.9, 77.5, 70 + d * 0.3, 76.6, 54)
      // iç hat: yanak, bıyık, ağız çevresi
      c.quadraticCurveTo(73.6, 62, 69.4, 69.6)
      c.quadraticCurveTo(67, 66, 63.6, 65.4)
      c.quadraticCurveTo(56.6, 63, 49, 66)
      c.quadraticCurveTo(44.6, 66.4, 41, 71)
      c.quadraticCurveTo(34.6, 64, 32.6, 52.5)
    },
    s.beard!,
    { color: s.beardS!, dx: -3, dy: -2.6 },
  )
  // bıyık ayrımı ve sakal telleri
  curve(c, 49, 66.4, 56.6, 70.4, 63.6, 65.8, 1, s.beardS!)
  curve(c, 38, 74 + d * 0.3, 40.5, 78 + d * 0.5, 44.5, 80.5 + d * 0.8, 1, s.beardS!)
  curve(c, 50, 77.5 + d * 0.4, 51, 80 + d * 0.8, 53, 82 + d, 1, s.beardS!)
  curve(c, 62, 77.5 + d * 0.4, 62.6, 80 + d * 0.7, 62, 82 + d * 0.95, 1, s.beardS!)
  if (long) curve(c, 44, 82, 47, 92, 54, 96, 1, s.beardS!)
}

function mustache(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(56, 65.4)
      c.quadraticCurveTo(48.5, 63.6, 43.4, 70.6)
      c.quadraticCurveTo(42.6, 72.4, 44.6, 72.2)
      c.quadraticCurveTo(50.5, 71.6, 56, 69.2)
      c.quadraticCurveTo(61.6, 71.6, 66.8, 71.8)
      c.quadraticCurveTo(68.6, 71.8, 67.8, 70.2)
      c.quadraticCurveTo(63.4, 63.6, 56, 65.4)
    },
    s.mustache!,
    { color: s.hairS, dx: -1.6, dy: -1.6 },
  )
  curve(c, 56, 65.8, 55.8, 67.4, 56, 69, 0.9, s.hairS)
}

// ── saç ──────────────────────────────────────────────────────────────────

/** Uktun'un arka saçı: iki yandan omuzlara dökülür, dalgalıdır, uçları tutam tutam ayrılır */
function longHairBack(c: Ctx, s: Skin, sw: number) {
  blob(
    c,
    () => {
      c.moveTo(36, 20)
      c.bezierCurveTo(16, 22, 9, 44, 13.5, 62)
      c.bezierCurveTo(15.5, 72, 11, 84, 6.5 + sw, 98)
      // sol uçlar: üç tutam, ortadaki en uzun
      c.quadraticCurveTo(13 + sw, 97, 16.5 + sw * 0.6, 91.5)
      c.quadraticCurveTo(16.5 + sw, 102, 13 + sw * 1.2, 112)
      c.quadraticCurveTo(21.5 + sw, 108, 24.5 + sw * 0.6, 99)
      c.quadraticCurveTo(26.5 + sw, 105, 31 + sw, 108.5)
      c.quadraticCurveTo(35 + sw * 0.4, 99, 33.5, 87)
      c.lineTo(42, 92)
      c.lineTo(63, 92)
      // sağ uçlar (uzak yan: daha kısa, iki tutam)
      c.lineTo(70, 84)
      c.quadraticCurveTo(70.5 + sw * 0.4, 92, 74 + sw, 98.5)
      c.quadraticCurveTo(77.5 + sw, 95, 78.5 + sw * 0.6, 89.5)
      c.quadraticCurveTo(82 + sw, 96, 87.5 + sw, 98)
      c.bezierCurveTo(91, 86, 83.5, 74, 87, 60)
      c.bezierCurveTo(89, 40, 80, 22, 66, 19)
    },
    s.hair,
    { color: s.hairS, dx: -4, dy: -2 },
  )
  // tutam ayrımları (mürekkep), teller ve ışık
  curve(c, 21, 58, 19, 76, 16.5 + sw * 0.6, 91.5, 1, INK)
  curve(c, 28.5, 70, 27.5, 86, 24.5 + sw * 0.6, 99, 1, INK)
  curve(c, 81, 64, 80.5, 78, 78.5 + sw * 0.6, 89.5, 1, INK)
  curve(c, 24.5, 80, 22.5, 94, 20 + sw, 103, 0.9, s.hairS)
  curve(c, 14.6, 44, 13, 56, 16, 68, 1.9, s.hairL)
  curve(c, 12.6, 82, 11.5, 88, 10 + sw * 0.6, 93, 1.5, s.hairL)
}

/** Uktun'un ön saçı: kabarık tepe, yana taranmış perçem, kulağın önünde ince bir tutam; uzak yanda kısa bir tel */
function longHairFront(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(24.6, 60)
      c.bezierCurveTo(14.5, 40, 24, 13.5, 49, 12.5)
      c.quadraticCurveTo(56, 9.5, 63.5, 14)
      c.bezierCurveTo(75, 16.5, 82, 28, 80, 44)
      // uzak şakakta kısa tel
      c.quadraticCurveTo(80.6, 51, 78.4, 57)
      c.quadraticCurveTo(76.4, 51, 76.6, 46)
      c.quadraticCurveTo(75, 37, 68, 30)
      // perçem: ayrımdan sola taranır, uçlar kaşların üstünde biter
      c.quadraticCurveTo(67.6, 35.5, 63.4, 39.4)
      c.quadraticCurveTo(62.6, 35, 60, 32)
      c.quadraticCurveTo(57, 37.6, 51, 40.6)
      c.quadraticCurveTo(51.8, 36.4, 50, 33.2)
      c.quadraticCurveTo(46, 37.6, 40.4, 39.6)
      c.quadraticCurveTo(42, 36.6, 41.4, 34.2)
      c.quadraticCurveTo(36, 38.4, 33.6, 45)
      // şakak: kulağın önünde ince, ucu dışa kıvrık bir tutam; sonra kulağın arkasına döner
      c.quadraticCurveTo(32.2, 54, 35.8, 66.5)
      c.quadraticCurveTo(29.6, 60.5, 29.8, 49)
      c.quadraticCurveTo(26, 51, 24.6, 60)
    },
    s.hair,
    { color: s.hairS, dx: -3.4, dy: -2.8 },
  )
  // ayrım, teller ve parlama
  curve(c, 68, 30, 64, 21, 56, 15.5, 1, INK)
  curve(c, 60, 32, 54, 25.5, 44, 23, 1, s.hairS)
  curve(c, 50, 33.2, 43, 29.6, 35, 30.6, 1, s.hairS)
  curve(c, 41.4, 34.2, 36, 34, 31, 37.6, 1, s.hairS)
  curve(c, 72.5, 29, 76.6, 35, 77.8, 43, 1, s.hairS)
  curve(c, 22.6, 40, 25.5, 24.5, 41, 18, 2.6, s.hairL)
  curve(c, 66.5, 19.5, 72.5, 23, 75.5, 29, 1.7, s.hairL)
}

/** kısa saç: dalgalı tepe, alın çizgisi, favori; başlık altında yalnız yanlar görünür */
function shortHair(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(25.6, 58.5)
      c.bezierCurveTo(19.5, 38, 28, 15.5, 49, 16)
      // dalgalı tepe: öne doğru kabaran iki tutam
      c.quadraticCurveTo(57, 10.5, 64, 17.6)
      c.quadraticCurveTo(76.5, 19, 78.6, 33)
      c.quadraticCurveTo(81.6, 41, 77.4, 49.5)
      // alın çizgisi
      c.quadraticCurveTo(76.2, 41.5, 71, 37.6)
      c.quadraticCurveTo(64, 40.2, 57.4, 35.6)
      c.quadraticCurveTo(49, 40.6, 40.6, 37)
      c.quadraticCurveTo(34.2, 40.4, 33, 47.6)
      // favori
      c.lineTo(33, 60.5)
      c.quadraticCurveTo(29.6, 60.6, 25.6, 58.5)
    },
    s.hair,
    { color: s.hairS, dx: -3.2, dy: -2.8 },
  )
  curve(c, 57.4, 35.6, 55, 28, 47, 23.6, 1, s.hairS)
  curve(c, 71, 37.6, 71.6, 30, 66, 24, 1, s.hairS)
  curve(c, 25.4, 40, 28, 25.5, 42, 20.6, 2.4, s.hairL)
  curve(c, 52, 17.6, 58, 15.6, 62.6, 19.4, 1.6, s.hairL)
}

/** yazmanın altından görünen ortadan ayrık saç */
function partedHair(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(30, 52)
      c.quadraticCurveTo(30, 34, 54, 29)
      c.quadraticCurveTo(72, 30, 75.6, 48)
      c.quadraticCurveTo(70, 39.6, 59, 36.4)
      c.quadraticCurveTo(43, 38, 33.4, 50.4)
    },
    s.hair,
    { color: s.hairS, dx: -2.4, dy: -2 },
  )
  curve(c, 58.4, 36.2, 57, 33, 55.4, 30, 0.9, s.hairS)
  curve(c, 34, 44.6, 40, 37.4, 50, 34, 1.5, s.hairL)
}

// ── başlıklar ─────────────────────────────────────────────────────────────

function yazmaBack(c: Ctx, s: Skin) {
  // başı arkadan saran örtü: yanaklardan çene altına iner
  blob(
    c,
    () => {
      c.moveTo(52, 11.5)
      c.bezierCurveTo(22, 11, 18, 42, 21.5, 63)
      c.quadraticCurveTo(25, 80, 40, 88.5)
      c.lineTo(64, 88.5)
      c.quadraticCurveTo(78.5, 80, 81, 62)
      c.bezierCurveTo(85, 38, 78, 12, 52, 11.5)
    },
    s.hatS!,
  )
}

function yazmaFront(c: Ctx, s: Skin) {
  const col = s.hatC!
  // alnı ve tepeyi saran ön kısım: yanlarda yanağa kadar iner
  blob(
    c,
    () => {
      c.moveTo(22.4, 66)
      c.bezierCurveTo(15.5, 38, 26, 10.5, 52, 10.5)
      c.bezierCurveTo(77, 10.5, 86.5, 36, 80.6, 64.5)
      c.quadraticCurveTo(79.6, 49, 71.5, 39.5)
      c.quadraticCurveTo(57, 27.5, 41.4, 34.5)
      c.quadraticCurveTo(30.6, 41, 29.4, 55)
      c.quadraticCurveTo(27, 62, 22.4, 66)
    },
    col,
    { color: s.hatS!, dx: -4, dy: -3 },
  )
  // kıvrım ve ışık
  curve(c, 26.6, 55, 27.4, 38, 41, 24.5, 1, s.hatS!)
  curve(c, 23.4, 44, 25.6, 25.5, 43, 16.4, 2.2, '#f08a6a')
  // puantiye
  c.fillStyle = '#f6d98a'
  for (const [x, y] of [[34, 27], [46, 18.6], [59.5, 17.6], [71.5, 25], [77.5, 38.5], [25.6, 43.5], [53, 26]]) {
    c.beginPath()
    c.arc(x, y, 1.3, 0, Math.PI * 2)
    c.fill()
  }
  // oya: yüz kenarında minik boncuklar
  c.fillStyle = '#fff3d0'
  for (const [x, y] of [[30.4, 50.5], [33, 43.6], [38.4, 37.8], [45.6, 33.6], [53.6, 32], [61.6, 33.4], [68.4, 37.4], [74, 43.6], [77.6, 51]]) {
    c.beginPath()
    c.arc(x, y, 0.9, 0, Math.PI * 2)
    c.fill()
  }
}

function yazmaKnot(c: Ctx, s: Skin) {
  const col = s.hatC!
  const sh = { color: s.hatS!, dx: -2, dy: -2 }
  // çene altında düğüm: iki kanat ve boğum
  blob(
    c,
    () => {
      c.moveTo(51, 87.5)
      c.quadraticCurveTo(40, 86, 35, 96.5)
      c.quadraticCurveTo(42, 97.5, 44, 102)
      c.quadraticCurveTo(49.5, 96, 51.5, 91.5)
    },
    col,
    sh,
  )
  blob(
    c,
    () => {
      c.moveTo(53, 87.5)
      c.quadraticCurveTo(64, 86.5, 68.5, 97.5)
      c.quadraticCurveTo(62, 97.5, 59.5, 103)
      c.quadraticCurveTo(54.5, 96, 52.5, 91.5)
    },
    col,
    sh,
  )
  blob(
    c,
    () => {
      c.ellipse(52, 88.6, 4.2, 3.6, 0, 0, Math.PI * 2)
    },
    col,
    sh,
  )
}

function hat(c: Ctx, s: Skin) {
  const col = s.hatC!
  const sh = { color: s.hatS!, dx: -4, dy: -3 }
  switch (s.hat) {
    case 'kasket':
      // sekiz köşe kasket: yayvan tepe, yüzün baktığı yana uzanan siper
      blob(
        c,
        () => {
          c.moveTo(22.5, 40.5)
          c.bezierCurveTo(15, 20, 36, 7.5, 57, 9.5)
          c.bezierCurveTo(73, 11, 82.5, 22, 81, 34)
          c.quadraticCurveTo(55, 30.5, 22.5, 40.5)
        },
        col,
        sh,
      )
      blob(
        c,
        () => {
          c.moveTo(38, 36.6)
          c.quadraticCurveTo(62, 30.6, 81, 34)
          c.quadraticCurveTo(90.5, 37.6, 91, 42.4)
          c.quadraticCurveTo(91, 45, 87.4, 44.4)
          c.quadraticCurveTo(62, 37.4, 38, 41.6)
          c.closePath()
        },
        s.hatS!,
      )
      // dilimler, düğme ve ışık
      curve(c, 53, 9.6, 46, 20, 44, 35, 1, s.hatS!)
      curve(c, 57, 9.6, 66, 19, 69, 32, 1, s.hatS!)
      ell(c, 55, 9.6, 2.2, 1.5, INK)
      curve(c, 23.6, 31, 27.4, 18.6, 43, 13, 2.2, s.hairL)
      break
    case 'toque':
      // usta kalfası: kabarık tepe, altında düz bant
      blob(
        c,
        () => {
          c.moveTo(27, 27)
          c.bezierCurveTo(12, 21, 17, -2, 34, 3.5)
          c.bezierCurveTo(40, -7, 62, -7, 67, 3)
          c.bezierCurveTo(85, -2, 91, 20, 77, 26)
          c.quadraticCurveTo(52, 21, 27, 27)
        },
        col,
        sh,
      )
      curve(c, 36, 6, 38, 14, 36.5, 22, 1, s.hatS!)
      curve(c, 65, 5.6, 64, 13, 66, 21, 1, s.hatS!)
      blob(
        c,
        () => {
          c.moveTo(25.4, 26)
          c.quadraticCurveTo(52, 19.4, 78.4, 25)
          c.lineTo(79, 37.4)
          c.quadraticCurveTo(52, 30.4, 25, 38.6)
        },
        col,
        { color: s.hatS!, dx: -3, dy: -2.4 },
      )
      break
    case 'kalpak':
      // yün kalpak: yüksek silindir, üstü bombeli, yün dokusu
      blob(
        c,
        () => {
          c.moveTo(22, 40.5)
          c.lineTo(24, 14)
          c.quadraticCurveTo(52, -1, 79.5, 12.5)
          c.lineTo(81.6, 38)
          c.quadraticCurveTo(52, 29, 22, 40.5)
        },
        col,
        sh,
      )
      for (const [x, y] of [[30, 20], [39, 13.5], [49, 20], [59, 12.6], [68, 20], [34, 29.5], [45, 28], [56, 26.5], [66, 28.5], [74, 16]]) {
        curve(c, x, y, x + 1.6, y + 2.6, x + 0.6, y + 5, 1.1, s.hatS!)
      }
      curve(c, 26.4, 33, 27.4, 22, 29, 15.6, 2, s.hairL)
      break
  }
}

// ── kılığa özgü eşya ─────────────────────────────────────────────────────

function propBack(c: Ctx, s: Skin) {
  if (s.prop === 'staff') {
    // çoban değneği: omzun arkasında, başı kıvrık
    stroke(c, [13, 124, 12, 44], 3.4, '#6a4a2e')
    stroke(c, [12, 44, 12.6, 35, 18.6, 32, 23, 36.6], 3.4, '#6a4a2e')
  }
  if (s.prop === 'saz') {
    // bağlama: sapı omzun arkasından yükselir, burguları görünür
    stroke(c, [84, 104, 93.5, 46], 3.6, '#7a4a24')
    stroke(c, [91.4, 52, 96.4, 53], 1.6, '#3a2418')
    stroke(c, [92.4, 46.6, 97.4, 47.6], 1.6, '#3a2418')
  }
}

function propFront(c: Ctx, s: Skin) {
  if (s.prop === 'apron') {
    // önlük: göğüslük ve boyun askısı
    stroke(c, [41, 91, 37, 104], 2, '#f6f2ea')
    stroke(c, [62.6, 91, 66.6, 104], 2, '#f6f2ea')
    blob(
      c,
      () => {
        c.moveTo(34, 103.5)
        c.quadraticCurveTo(52, 100.5, 70, 103.5)
        c.lineTo(72, 124)
        c.lineTo(32, 124)
      },
      '#f6f2ea',
      { color: '#cfc8ba', dx: -3, dy: 0 },
    )
  }
  if (s.prop === 'staff') {
    // kepenek: omuzları saran kalın keçe yaka
    curve(c, 30.5, 95, 40, 104.5, 51, 119, 1.2, s.coatS)
  }
}

/** Kadraj: [ölçek, başın orta x'i, en üst nokta]. Baş tam sığar, yüz kadrajı doldurur. */
function frame(s: Skin): [number, number, number] {
  if (s.long) return [1.15, 48.4, 10.5]
  if (s.hat === 'toque') return [1, 52, -5.5]
  if (s.hat === 'kalpak') return [1.08, 52, 5]
  if (s.hat === 'kasket') return [1.1, 55, 8.5]
  if (s.hat === 'yazma') return [1.2, 51.4, 10.5]
  return [1.18, 51, 9]
}

/**
 * Portreyi (w x h) kutusuna çizer: kutuyu doldurur, taban ortalanır. t: saniye (nefes, saç, göz kırpma).
 * Fon dahil bütün kutu boyanır; çerçeveyi çağıran çizer.
 */
export function drawPortrait(c: Ctx, look: Look, w: number, h: number, t: number, opts: PortraitOpts = {}) {
  const s0 = LOOKS[look]
  const s: Skin = opts.scarf ? { ...s0, scarf: opts.scarf, scarfS: opts.scarfS ?? s0.scarfS } : s0
  const live = !opts.still
  const breath = live ? Math.sin(t * 1.9) * 0.5 : 0
  const sway = live ? Math.sin(t * 1.3) * 0.9 : 0
  const tilt = live ? Math.sin(t * 0.7) * 0.012 : 0
  const shut = live && (t + 3.2) % 4.2 > 4.06

  c.save()
  c.beginPath()
  c.rect(0, 0, w, h)
  c.clip()
  const k = Math.max(w / PORTRAIT_W, h / PORTRAIT_H)
  c.translate(w / 2, h)
  c.scale(k, k)
  c.translate(-PORTRAIT_W / 2, -PORTRAIT_H)
  background(c, look)
  if (opts.face) {
    // yalnız yüz: kaştan çeneye kare kırpım (küçük gösterge pulu)
    const f = PORTRAIT_W / 60
    c.translate(PORTRAIT_W / 2, PORTRAIT_H / 2)
    c.scale(f, f)
    c.translate(-52.5, -(s.hat && s.hat !== 'yazma' ? 50 : 53))
  } else {
    const [f, cx, top] = frame(s)
    c.translate(PORTRAIT_W / 2, 3.5)
    c.scale(f, f)
    c.translate(-cx, -top)
  }
  setInkWidth(INKW)

  // omuzlar: nefesle hafifçe iner kalkar
  c.save()
  c.translate(0, breath)
  propBack(c, s)
  shoulders(c, s)
  collar(c, s)
  propFront(c, s)
  c.restore()

  // baş ve boyun: omuzların yarısı kadar oynar, çok hafif yana eğilir
  const head = () => {
    c.translate(52, 86 + breath * 0.5)
    c.rotate(tilt)
    c.translate(-52, -86)
  }
  c.save()
  head()
  if (s.long) longHairBack(c, s, sway)
  if (s.hat === 'yazma') yazmaBack(c, s)
  neck(c, s)
  c.restore()

  if (!s.bare) {
    c.save()
    c.translate(0, breath + 1.5)
    scarf(c, s)
    c.restore()
  }

  c.save()
  head()
  blob(c, () => headPath(c), s.skin, { color: s.skinS, dx: -3.4, dy: -3 })
  face(c, look, s, shut)
  if (s.beard) beard(c, s, look === 'ozan')
  mouth(c, look, s)
  if (s.mustache && !s.beard) mustache(c, s)
  if (s.long) longHairFront(c, s)
  else if (s.hat === 'yazma') partedHair(c, s)
  else shortHair(c, s)
  if (s.hat === 'yazma') {
    yazmaFront(c, s)
    yazmaKnot(c, s)
  } else {
    ear(c, s)
    hat(c, s)
  }
  c.restore()

  setInkWidth(HERO_INKW)
  c.restore()
}
