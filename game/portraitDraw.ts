/**
 * Portreler: oyundaki karakterin vesikalığı. heroDraw.ts ile aynı dil (mürekkep dış hat, ışık sol üstten) ve aynı
 * palet (LOOKS); yalnız yakından ve ayrıntılı: gölgeye ek olarak sağ kenarda sıcak kenar ışığı, saçta parlak
 * şeritler, gözde iki tonlu iris, kumaşta doku. Dış siluet kalın, yüzün içi ince hatla çizilir.
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
/** dış siluet (omuzlar) kalın, saç ve yüzün dış hattı orta, yüzün içi ince */
const INKW = 2.2
const MID_INKW = 1.6
/** yüzün dış hattı siluetten ince */
const FACE_INKW = 1.45
/** sağ kenardan vuran sıcak ışık */
const RIM = 'rgba(255,220,170,0.8)'
/** yüz uzadıkça omuzlar, yaka ve atkı bu kadar aşağı iner */
const BODY_DY = 6

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
  c.lineWidth = w * boost
  c.lineCap = 'round'
  c.stroke()
}

/** küçük boyda (40 px) ince hatlar kaybolmasın diye çizgi kalınlığı çarpanı; drawPortrait kadraja göre kurar */
let boost = 1
let inkw = INKW
function ink(w: number) {
  inkw = w * boost
  setInkWidth(inkw)
}

/** renge saydamlık: '#rrggbb' + alfa (0..1) */
const fade = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, '0')

/** yumuşak kenarlı leke: iç içe üç elips */
function soft(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  c.globalAlpha = 0.3
  for (const k of [1.6, 1.15, 0.7]) ell(c, x, y, rx * k, ry * k, fill, rot)
  c.globalAlpha = 1
}

/** kenar ışığı: şeklin sağ kenarında ince bir şerit; dış hat üstüne yeniden çekilir */
function rim(c: Ctx, build: () => void, color = RIM, dx = -2.3, dy = 0.6) {
  c.save()
  c.beginPath()
  build()
  c.closePath()
  c.clip()
  c.translate(dx, dy)
  c.beginPath()
  build()
  c.closePath()
  c.rect(-200, -200, 400, 400)
  c.fillStyle = color
  c.fill('evenodd')
  c.restore()
  c.beginPath()
  build()
  c.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = INK
  c.lineWidth = inkw
  c.stroke()
}

/** fonda kahramanın şehrine çok silik bir gönderme: Uktun'a Boğaz silueti ve martılar, Memo'ya sur ve burç */
function motif(c: Ctx, look: Look) {
  if (look === 'uktun') {
    c.fillStyle = 'rgba(74,88,150,0.2)'
    c.beginPath()
    // solda kule
    c.moveTo(0, 120)
    c.lineTo(0, 84)
    c.lineTo(3.5, 84)
    c.lineTo(3.5, 66)
    c.lineTo(7, 57)
    c.lineTo(10.5, 66)
    c.lineTo(10.5, 84)
    c.lineTo(16, 84)
    c.lineTo(16, 120)
    // sağda kubbe ve minare
    c.moveTo(80, 120)
    c.lineTo(80, 82)
    c.quadraticCurveTo(87, 68, 94, 82)
    c.lineTo(95.6, 82)
    c.lineTo(95.6, 60)
    c.lineTo(96.6, 55)
    c.lineTo(97.6, 60)
    c.lineTo(97.6, 82)
    c.lineTo(100, 82)
    c.lineTo(100, 120)
    c.fill()
    // martılar
    c.strokeStyle = 'rgba(255,255,255,0.5)'
    c.lineWidth = 0.9
    c.lineCap = 'round'
    c.beginPath()
    for (const [x, y, k] of [[10, 17, 1], [88, 12, 0.8], [93, 22, 0.6]]) {
      c.moveTo(x - 3.4 * k, y - 0.6 * k)
      c.quadraticCurveTo(x - 1.6 * k, y - 2.4 * k, x, y)
      c.quadraticCurveTo(x + 1.6 * k, y - 2.4 * k, x + 3.4 * k, y - 0.6 * k)
    }
    c.stroke()
  }
  if (look === 'memo') {
    c.fillStyle = 'rgba(150,92,58,0.2)'
    c.beginPath()
    // sur: mazgallı duvar
    c.moveTo(0, 120)
    c.lineTo(0, 72)
    for (let x = 0; x < 22; x += 5) {
      c.lineTo(x, 68.5)
      c.lineTo(x + 2.6, 68.5)
      c.lineTo(x + 2.6, 72)
      c.lineTo(x + 5, 72)
    }
    c.lineTo(22, 120)
    // burç: duvardan yüksek, yuvarlak gövdeli
    c.moveTo(78, 120)
    c.lineTo(78, 72)
    c.lineTo(83, 72)
    c.lineTo(83, 58)
    for (let x = 83; x < 99; x += 4.4) {
      c.lineTo(x, 54.5)
      c.lineTo(x + 2.4, 54.5)
      c.lineTo(x + 2.4, 58)
      c.lineTo(x + 4.4, 58)
    }
    c.lineTo(100, 120)
    c.fill()
    // mazgal deliği ve taş sıraları
    c.fillStyle = 'rgba(150,92,58,0.22)'
    c.fillRect(90.6, 63.5, 1.6, 5)
    c.fillRect(83, 74, 17, 0.7)
    c.fillRect(0, 80, 20, 0.7)
  }
}

function background(c: Ctx, look: Look) {
  const [mid, edge] = BACKDROP[look]
  const g = c.createRadialGradient(44, 44, 6, 50, 60, 92)
  g.addColorStop(0, mid)
  g.addColorStop(1, edge)
  c.fillStyle = g
  c.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H)
  motif(c, look)
  // vinyet: köşeler hafifçe koyulaşır, bakış yüze toplanır
  const v = c.createRadialGradient(50, 56, 40, 50, 60, 96)
  v.addColorStop(0, 'rgba(40,24,48,0)')
  v.addColorStop(1, 'rgba(40,24,48,0.3)')
  c.fillStyle = v
  c.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H)
}

// ── gövde ────────────────────────────────────────────────────────────────

function shoulders(c: Ctx, look: Look, s: Skin) {
  const path = () => {
    c.moveTo(3, 124)
    c.bezierCurveTo(3, 102, 14, 94, 38, 89.5)
    c.quadraticCurveTo(52, 93, 64, 89.5)
    c.bezierCurveTo(88, 94, 97, 102, 98, 124)
  }
  blob(c, path, s.coat, { color: s.coatS, dx: -4.5, dy: -1.5 })
  rim(c, path, RIM, -1.7, 0.5)
  // omuz ışığı ve kol dikişi
  curve(c, 9, 109, 12, 98.5, 28, 94.5, 2, s.coatL)
  curve(c, 20, 119, 19, 110, 22, 103, 1.1, s.coatS)
  curve(c, 82, 119, 83, 110, 80, 103, 1.1, s.coatS)
  if (look === 'uktun') {
    // mont: kapitone dikişler, her dilimin üstünde ışık
    curve(c, 5.5, 112, 14, 107, 23, 107.6, 1, s.coatS)
    curve(c, 78.6, 107.4, 88, 106.6, 96, 112.6, 1, s.coatS)
    curve(c, 8, 114.6, 13.6, 111.4, 19.6, 111, 1.3, s.coatL)
    curve(c, 24.6, 100.6, 29, 98.6, 33, 98, 1.2, s.coatL)
    stitch(c, 6.4, 110.2, 14.4, 105.4, 22.6, 105.8, s.coatL)
    stitch(c, 79, 105.6, 88, 104.8, 95, 110.4, s.coat)
  }
  if (look === 'memo') {
    // ceket: omuz dikişinin yanında çift dikiş, omuzda apolet katı
    stitch(c, 21.8, 119, 20.8, 110.4, 23.6, 104, s.coatL)
    stitch(c, 80.2, 119, 81.2, 110.4, 78.4, 104, s.coat)
    curve(c, 12, 101.6, 19, 97.4, 27, 96.6, 1, s.coatS)
  }
}

/** dikiş: kesik kesik ince çizgi */
function stitch(c: Ctx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, color: string) {
  c.setLineDash([1.3, 1.5])
  curve(c, x0, y0, cx, cy, x1, y1, 0.65, color)
  c.setLineDash([])
}

function collar(c: Ctx, look: Look, s: Skin) {
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
  if (look === 'uktun' || look === 'memo') {
    // yaka kenarında dikiş
    stitch(c, 35.4, 96, 35.6, 108, 49.6, 121, s.coat)
    stitch(c, 68.4, 96, 68.2, 108, 55, 121, s.coatS)
  }
}

/** boyun: çenenin altından hafifçe daralır, omuza yumuşak bir yayla açılır; erkekte kalın, kadında ince */
function neck(c: Ctx, s: Skin, fem: boolean) {
  const x0 = fem ? 45.4 : 42
  const x1 = fem ? 60.4 : 63.6
  const path = () => {
    c.moveTo(x0 - 1, 70)
    c.bezierCurveTo(x0 + 1, 80, x0 + 0.6, 89, x0 - 4, 97)
    c.quadraticCurveTo(52, 103.5, x1 + 4, 97)
    c.bezierCurveTo(x1 - 0.6, 89, x1 - 1, 80, x1 + 1, 70)
  }
  blob(c, path, s.skin, { color: s.skinS, dx: -3, dy: 0 })
  // çenenin boyuna düşen gölgesi: aşağı doğru yumuşakça açılır
  c.save()
  c.beginPath()
  path()
  c.clip()
  const g = c.createLinearGradient(0, 82, 0, 95)
  g.addColorStop(0, fade(s.skinS, 0.95))
  g.addColorStop(1, fade(s.skinS, 0))
  c.fillStyle = g
  c.fillRect(30, 68, 46, 28)
  c.restore()
  if (!fem) curve(c, 50.8, 93, 52.6, 94.6, 54.4, 93, 0.8, s.skinS)
}

/** atkı: boynu saran örgü bir şerit; önde bir kat öbürünün üstüne biner, altından püsküllü kısa ucu sarkar */
function scarf(c: Ctx, s: Skin) {
  const wrap = () => {
    c.moveTo(35.5, 83.5)
    c.quadraticCurveTo(52, 93.5, 68.5, 83)
    c.quadraticCurveTo(72.5, 89, 70.5, 95.5)
    c.quadraticCurveTo(52, 108.5, 33.5, 96)
    c.quadraticCurveTo(31.5, 89.5, 35.5, 83.5)
  }
  const over = () => {
    c.moveTo(68.5, 83)
    c.quadraticCurveTo(72.5, 89, 70.5, 95.5)
    c.quadraticCurveTo(58, 104.5, 46.4, 104)
    c.quadraticCurveTo(44.4, 103.2, 46.4, 101.8)
    c.quadraticCurveTo(58, 97.5, 68.5, 83)
  }
  const tail = () => {
    c.moveTo(37.6, 97)
    c.lineTo(47.4, 100)
    c.quadraticCurveTo(48.4, 104.5, 47.2, 108.4)
    c.lineTo(36.8, 107.2)
    c.quadraticCurveTo(36.2, 102, 37.6, 97)
  }
  /** örgü dokusu: şeklin içine kırpılmış ince eğik çizgiler */
  const knit = (build: () => void, lean: number) => {
    c.save()
    c.beginPath()
    build()
    c.closePath()
    c.clip()
    c.beginPath()
    for (let x = 24; x < 84; x += 2.3) {
      c.moveTo(x, 80)
      c.lineTo(x + lean, 112)
    }
    c.globalAlpha = 0.5
    c.strokeStyle = s.scarfS
    c.lineWidth = 0.55
    c.stroke()
    c.restore()
  }
  // püskül ve sarkan uç
  for (let i = 0; i < 5; i++) stroke(c, [38.4 + i * 2, 107.6 + i * 0.25, 38 + i * 2.1, 111.2 + i * 0.2], 1, s.scarf)
  blob(c, tail, s.scarf, { color: s.scarfS, dx: -2, dy: -1.5 })
  knit(tail, 1.5)
  curve(c, 37.4, 105, 42, 105.8, 47.4, 106.4, 0.9, s.scarfS)
  blob(c, wrap, s.scarf, { color: s.scarfS, dx: -2.5, dy: -3.4 })
  knit(wrap, -7)
  // üstteki kat: sağ omuzdan sola iner
  blob(c, over, s.scarf, { color: s.scarfS, dx: -2, dy: -2.4 })
  knit(over, 9)
  rim(c, over, RIM, -1.4, 0.3)
  // kıvrımlar ve katın üstünde ışık
  curve(c, 37.5, 90.5, 43, 95.5, 50, 97.5, 1, s.scarfS)
  curve(c, 35.6, 94.4, 39, 97.6, 43.4, 99.4, 0.9, s.scarfS)
  curve(c, 62, 96, 65.5, 93, 67.5, 89, 1, s.scarfS)
  curve(c, 50.5, 100.6, 58.5, 98.2, 64.4, 92.6, 1.1, 'rgba(255,255,255,0.32)')
  curve(c, 38.4, 87.4, 42, 89.6, 46.4, 91, 1.1, 'rgba(255,255,255,0.3)')
}

// ── baş ──────────────────────────────────────────────────────────────────

/**
 * Baş: yetişkin oranı. Kafatası yuvarlak, yüz uzun; elmacıktan sonra çene hattı kırılır ve belirgin bir çeneye iner.
 * Erkekte çene geniş ve köşeli, kadında dar ve yumuşak; lean (genç) yanakları içeri alır.
 */
function headPath(c: Ctx, fem: boolean, lean = false) {
  c.moveTo(27.5, 50)
  c.bezierCurveTo(25, 26, 77, 22, 76.5, 48)
  if (fem) {
    c.bezierCurveTo(76.8, 58, 75, 66, 70, 73.5)
    c.bezierCurveTo(66.5, 78.6, 61.5, 84, 55.5, 84)
    c.bezierCurveTo(49.5, 84, 40, 79, 34.8, 72)
    c.bezierCurveTo(31, 66.6, 28, 57, 27.5, 50)
  } else {
    const k = lean ? 1.6 : 0
    c.bezierCurveTo(76.8, 58, 75 - k, 66.5, 70.6 - k, 74)
    c.bezierCurveTo(67.4 - k, 79.6, 62.5, 85.4, 56, 85.4)
    c.bezierCurveTo(49, 85.4, 40.5 + k, 81, 35 + k, 73)
    c.bezierCurveTo(31.4 + k, 67, 28, 57.5, 27.5, 50)
  }
}

/** kulak: göz ile burun ucu hizası arasında; dış kıvrım ve iç kıvrım çizgili */
function ear(c: Ctx, s: Skin, x = 27.4) {
  blob(
    c,
    () => {
      c.ellipse(x, 57.6, 3.5, 5, -0.14, 0, Math.PI * 2)
    },
    s.skin,
    { color: s.skinS, dx: -1.1, dy: -0.9 },
  )
  curve(c, x - 1.7, 55.6, x - 0.5, 53.6, x + 1.1, 55.2, 0.85, s.skinS)
  curve(c, x - 1.2, 56.6, x + 1.2, 57.8, x - 0.5, 60.6, 0.85, s.skinS)
  curve(c, x - 0.3, 58.6, x - 1.5, 59, x - 1.3, 60.2, 0.7, s.skinS)
}

/**
 * Göz: iki tonlu iris (koyu halka, altta ışık alan yarım ay), göz bebeği, iki ışık noktası, kalın üst kirpik çizgisi,
 * kapak kıvrımı ve alt kapak gölgesi. lashes: dış uçtaki kirpik sayısı; out: dış ucun yönü (-1 sol, 1 sağ).
 */
function eye(c: Ctx, s: Skin, x: number, y: number, rx: number, ry: number, shut: boolean, lashes: number, gx: number, out: -1 | 1 = -1) {
  const ox = x + out * rx
  if (shut) {
    curve(c, x - rx, y + 0.4, x, y + 3, x + rx, y + 0.2, 1.4, INK)
    for (let i = 0; i < lashes; i++) curve(c, ox - out * i * 1.4, y + 0.5 + i * 0.5, ox + out * (1 - i * 0.9), y + 1.2 + i * 0.5, ox + out * (1.7 - i * 1.2), y + 2.2 + i * 0.4, 0.7, INK)
    return
  }
  const ir = ry * 0.9
  c.save()
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fillStyle = '#fffdf8'
  c.fill()
  c.clip()
  // iris: koyu halka, altta ışık alan yarım ay, göz bebeği
  ell(c, x + gx, y + 0.4, ir, ir * 1.04, s.iris)
  ell(c, x + gx, y + ir * 0.46, ir * 0.78, ir * 0.56, 'rgba(255,200,130,0.5)')
  ell(c, x + gx, y + ir * 0.66, ir * 0.5, ir * 0.3, 'rgba(255,232,180,0.45)')
  c.beginPath()
  c.ellipse(x + gx, y + 0.4, ir - 0.3, ir * 1.04 - 0.3, 0, 0, Math.PI * 2)
  c.strokeStyle = 'rgba(34,22,31,0.6)'
  c.lineWidth = 0.75
  c.stroke()
  ell(c, x + gx, y + 0.3, ir * 0.5, ir * 0.56, INK)
  // üst kapağın göz akına düşen gölgesi
  ell(c, x, y - ry * 1.05, rx * 1.3, ry * 0.66, 'rgba(34,22,31,0.28)')
  c.restore()
  // ışıltı: büyük sol üstte, küçük sağ altta
  ell(c, x + gx - ir * 0.4, y - ir * 0.36, ir * 0.33, ir * 0.33, '#ffffff')
  ell(c, x + gx + ir * 0.44, y + ir * 0.5, ir * 0.15, ir * 0.15, '#ffffff')
  // üst kirpik çizgisi: kalın, dış uçta hafif kalkar
  c.beginPath()
  c.moveTo(x - rx - 0.9, y - 0.1)
  c.quadraticCurveTo(x - rx * 0.5, y - ry - 1.3, x + rx * 0.2, y - ry - 0.4)
  c.quadraticCurveTo(x + rx * 0.9, y - ry * 0.7, x + rx + 0.9, y - 0.4)
  c.strokeStyle = INK
  c.lineWidth = (lashes > 1 ? 1.5 : 1.35) * boost
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.stroke()
  // kirpikler: üst kapağın dış yarısından dışa ve yukarı süzülen ince teller
  for (let i = 0; i < lashes; i++) {
    const bx = ox - out * rx * [-0.1, 0.34, 0.72][i]
    const by = y - [0.3, ry * 0.7, ry * 1.0][i]
    curve(c, bx, by, bx + out * 1, by - 0.2, bx + out * (2.1 - i * 0.35), by - 1.4 - i * 0.1, 0.6, INK)
  }
  // kapak kıvrımı, alt kapak ve altındaki hafif gölge
  curve(c, x - rx * 0.8, y - ry - 1.4, x - rx * 0.1, y - ry - 2.9, x + rx * 0.9, y - ry - 1.4, 0.8, s.skinS)
  curve(c, x - rx * 0.75, y + ry * 0.86, x, y + ry * 1.16, x + rx * 0.75, y + ry * 0.84, 0.8, s.skinS)
  c.globalAlpha = 0.16
  curve(c, x - rx * 0.6, y + ry * 1.3, x, y + ry * 1.62, x + rx * 0.7, y + ry * 1.3, 1.3, s.skinS)
  c.globalAlpha = 1
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

function face(c: Ctx, look: Look, s: Skin, shut: boolean, fem: boolean) {
  const old = look === 'amca' || look === 'ozan' || look === 'teyze'
  // yanaklar: kadında allık, erkekte elmacığın altında hafif bir sıcaklık
  if (fem) {
    soft(c, 38.4, 65, 4, 2.4, s.blush)
    soft(c, 68.6, 64.4, 3, 2.2, s.blush)
  } else {
    soft(c, 38, 65.6, 3.6, 2, s.blush)
    soft(c, 69.4, 64.8, 2.6, 1.8, s.blush)
  }
  if (look === 'genc') {
    // kirli sakal gölgesi: çene ve dudak üstü
    c.save()
    c.beginPath()
    headPath(c, false, true)
    c.clip()
    c.fillStyle = 'rgba(51,34,26,0.2)'
    c.beginPath()
    c.moveTo(28, 60)
    c.lineTo(33.6, 60)
    c.quadraticCurveTo(37, 74.5, 48, 79.4)
    c.quadraticCurveTo(56.6, 82, 65, 78.6)
    c.quadraticCurveTo(70.6, 73.5, 72.6, 61)
    c.lineTo(78, 61)
    c.lineTo(78, 90)
    c.lineTo(28, 90)
    c.closePath()
    c.fill()
    c.restore()
  }
  // gözler: yüzün ortasında, badem biçimli; yakın göz iri, uzak göz dönük yüzde biraz dar
  const ry = fem ? 4.9 : 4.3
  // iki göz aynı boyda, aralarında bir göz genişliği; irisler aynı noktaya (kameraya) bakar
  eye(c, s, 45.4, 54.6, 4.5, ry, shut, look === 'uktun' ? 3 : fem ? 1 : 0, 0.3)
  eye(c, s, 63.4, 54.4, 4.3, ry, shut, look === 'uktun' ? 2 : 0, 0.3, 1)
  // kaşlar: gözün üstünde, yukarı kavisli (dostça); iç uç (buruna yakın) dolgun
  const th = look === 'uktun' ? 1.2 : fem ? 1 : look === 'memo' ? 1.7 : look === 'genc' ? 1.8 : 2.1
  brow(c, 51.8, 45.6, 45.4, 41.2, 38, 46.4, th, s.brow)
  brow(c, 59.2, 45.3, 64.2, 41.1, 69.8, 45.6, th, s.brow)
  if (look === 'memo') {
    // kaş kılları: uca doğru yatan kısa teller
    c.beginPath()
    for (const [x, y, d] of [[49.6, 44.6, -1], [47, 43.6, -1], [44.2, 43.3, -1], [41.6, 43.9, -1], [61, 44.3, 1], [63.4, 43.3, 1], [65.8, 43.5, 1]]) {
      c.moveTo(x, y + 0.9)
      c.lineTo(x + d * 1.3, y)
    }
    c.strokeStyle = s.hairL
    c.lineWidth = 0.4
    c.lineCap = 'round'
    c.stroke()
  }
  // burun: gözlerin arasından inen köprü, yuvarlak uç, tek delik ve uçta ışık
  if (fem) curve(c, 59.6, 58, 62, 63.4, 60.4, 65.8, 1.1, s.skinS)
  else {
    curve(c, 59.6, 57.4, 61, 59.6, 61.2, 61.2, 1, s.skinS)
    curve(c, 61.2, 61.2, 62.8, 64.6, 60.6, 66.6, 1.2, s.skinS)
  }
  const ny = fem ? 0 : 0.8
  curve(c, 54, 65.8 + ny, 57, 68.6 + ny, 60.5, 65.8 + ny, 1.15, s.skinS)
  ell(c, 55.4, 65.8 + ny, 0.8, 0.55, s.skinS)
  // burun ucunda sıcak ton, uçta ve köprüde ince ışık; elmacığın üstünde parlama
  c.globalAlpha = 0.45
  ell(c, 57.6, 64.4 + ny, 3, 2.1, s.blush)
  c.globalAlpha = 1
  ell(c, 57, 63 + ny, 1.5, 1.1, 'rgba(255,255,255,0.5)')
  curve(c, 56.9, 51.6, 57.2, 55, 57.5, 58.6, 1, 'rgba(255,255,255,0.22)')
  if (!fem) {
    // elmacık: yakın yanakta kısa bir gölge çizgisi
    curve(c, 34.4, 62.6, 35.2, 67, 38.4, 70.6, 0.8, s.skinS)
  }
  if (old) {
    // gülüş çizgileri
    curve(c, 35, 51.5, 33.4, 53.5, 33.8, 56, 0.8, s.skinS)
    curve(c, 72.6, 51.2, 73.8, 53, 73.4, 55.4, 0.8, s.skinS)
    curve(c, 48.6, 64.4, 47, 67.4, 47.8, 70.4, 0.8, s.skinS)
    curve(c, 63.8, 64, 65.4, 67, 64.8, 69.8, 0.8, s.skinS)
  }
  if (look === 'uktun') {
    // çiller
    c.fillStyle = s.skinS
    for (const [x, y] of [[49.8, 61.6], [51.8, 63.4], [47.6, 63.6], [63, 61.8], [65, 63.2], [51, 59.8], [66.8, 61.4]]) {
      c.beginPath()
      c.arc(x, y, 0.5, 0, Math.PI * 2)
      c.fill()
    }
  }
}

function mouth(c: Ctx, look: Look, s: Skin) {
  if (look === 'uktun') {
    // içten gülüş: aralık dudakların arasında dişler; üst dudak ince, alt dudak dolgun ve ışıklı
    const open = () => {
      c.beginPath()
      c.moveTo(49, 71.6)
      c.quadraticCurveTo(56, 73.6, 63, 71)
      c.quadraticCurveTo(57.4, 79, 49, 71.6)
      c.closePath()
    }
    // alt dudak
    c.beginPath()
    c.moveTo(49.6, 72.6)
    c.quadraticCurveTo(57.8, 84, 62.8, 72)
    c.quadraticCurveTo(57.4, 78.4, 50, 73)
    c.closePath()
    c.fillStyle = '#e07a7e'
    c.fill()
    c.save()
    open()
    c.fillStyle = '#7a2230'
    c.fill()
    c.clip()
    c.fillStyle = '#fffdf8'
    c.fillRect(46, 69.4, 20, 3.9)
    ell(c, 56.8, 77.4, 3.4, 1.6, '#e8707a')
    c.restore()
    // üst dudak: ortada kalp kıvrımı
    c.beginPath()
    c.moveTo(48.6, 71.5)
    c.quadraticCurveTo(52.4, 69.5, 55.4, 70.5)
    c.quadraticCurveTo(56.4, 71, 57.2, 70.4)
    c.quadraticCurveTo(60.2, 69.2, 63.4, 70.9)
    c.quadraticCurveTo(56, 73.6, 48.6, 71.5)
    c.closePath()
    c.fillStyle = '#c8545e'
    c.fill()
    open()
    c.strokeStyle = INK
    c.lineWidth = 1.1
    c.lineJoin = 'round'
    c.stroke()
    // ağız kenarları, alt dudak ışığı ve altındaki gölge
    curve(c, 47.8, 70.6, 48.2, 71.6, 49.2, 72, 1.2, INK)
    curve(c, 64.2, 70, 64, 70.9, 62.9, 71.3, 1.2, INK)
    ell(c, 58.4, 77.9, 1.7, 0.6, 'rgba(255,255,255,0.6)', -0.35)
    curve(c, 53.6, 80.4, 56.6, 81.6, 59.8, 79.8, 0.9, s.skinS)
    return
  }
  if (look === 'memo') {
    // kendinden emin, hafif tek yana gülümseme: uzak köşe yukarıda
    c.beginPath()
    c.moveTo(51, 74.6)
    c.quadraticCurveTo(56.6, 76.4, 61.8, 73.6)
    c.quadraticCurveTo(57, 79.4, 51, 74.6)
    c.fillStyle = 'rgba(196,104,88,0.6)'
    c.fill()
    curve(c, 49.6, 73.7, 56.4, 77, 63.4, 72.2, 1.15, '#6a2c2a')
    curve(c, 48.8, 73, 48.9, 73.7, 49.8, 73.9, 0.9, '#6a2c2a')
    curve(c, 64.4, 70.9, 64.6, 71.9, 63.4, 72.3, 0.9, '#6a2c2a')
    ell(c, 56.4, 77.2, 1.8, 0.55, 'rgba(255,255,255,0.35)', -0.1)
    curve(c, 53.6, 80.6, 56.4, 81.6, 59.4, 80.2, 0.9, s.skinS)
    return
  }
  // kapalı gülümseme; sakallıda açık renk, bıyıklıda bıyığın altında
  const y = s.mustache && !s.beard ? 5.6 : s.beard ? 5 : 4
  const col = s.beard ? '#f0c4a8' : look === 'teyze' ? '#a8364a' : '#8e3a3c'
  if (!s.beard) {
    // alt dudak: gülüşün altında yumuşak bir dolgu
    c.beginPath()
    c.moveTo(51, 70.4 + y)
    c.quadraticCurveTo(56, 72.6 + y, 61, 70 + y)
    c.quadraticCurveTo(56.4, 75.4 + y, 51, 70.4 + y)
    c.fillStyle = look === 'teyze' ? '#e0707a' : s.blush
    c.fill()
  }
  curve(c, 49.4, 68.8 + y, 56, 73 + y, 62.8, 68.2 + y, 1.8, col)
  if (!s.beard) {
    curve(c, 48.2, 67.8 + y, 48.4, 68.8 + y, 49.6, 69.1 + y, 1.2, col)
    curve(c, 64, 67.2 + y, 63.8, 68.2 + y, 62.6, 68.5 + y, 1.2, col)
    // çene çukuru
    if (look !== 'teyze') curve(c, 53.6, 79.6 + y * 0.2, 56.4, 80.6 + y * 0.2, 59.2, 79.4 + y * 0.2, 0.9, s.skinS)
  }
}

function beard(c: Ctx, s: Skin, long: boolean) {
  const d = long ? 14 : 0
  blob(
    c,
    () => {
      // dış hat: favoriden çeneye, çeneden öteki yanağa
      c.moveTo(27.4, 53)
      c.bezierCurveTo(27.5, 72 + d * 0.3, 37, 89.5 + d, 57, 90 + d * 1.15)
      c.bezierCurveTo(70.5, 88.5 + d * 0.9, 77.5, 74 + d * 0.3, 76.6, 55)
      // iç hat: yanak, bıyık, ağız çevresi
      c.quadraticCurveTo(73.8, 64, 69.6, 73)
      c.quadraticCurveTo(67.2, 70, 64, 69.6)
      c.quadraticCurveTo(57, 67.4, 49.4, 70.2)
      c.quadraticCurveTo(45, 70.6, 41.2, 75.4)
      c.quadraticCurveTo(34.6, 67.6, 32.6, 54)
    },
    s.beard!,
    { color: s.beardS!, dx: -3, dy: -2.6 },
  )
  // bıyık ayrımı ve sakal telleri
  curve(c, 49.4, 70.6, 57, 74.4, 64, 70, 1, s.beardS!)
  curve(c, 38, 78 + d * 0.3, 40.5, 82.5 + d * 0.5, 44.5, 85.5 + d * 0.8, 1, s.beardS!)
  curve(c, 50, 82 + d * 0.4, 51, 85 + d * 0.8, 53, 87.4 + d, 1, s.beardS!)
  curve(c, 62, 82 + d * 0.4, 62.6, 85 + d * 0.7, 62, 87.4 + d * 0.95, 1, s.beardS!)
  if (long) curve(c, 44, 87, 47, 96, 54, 100, 1, s.beardS!)
}

function mustache(c: Ctx, s: Skin) {
  blob(
    c,
    () => {
      c.moveTo(56.6, 68.6)
      c.quadraticCurveTo(49, 66.8, 43.8, 73.8)
      c.quadraticCurveTo(43, 75.6, 45, 75.4)
      c.quadraticCurveTo(51, 74.8, 56.6, 72.4)
      c.quadraticCurveTo(62.2, 74.8, 67.4, 75)
      c.quadraticCurveTo(69.2, 75, 68.4, 73.4)
      c.quadraticCurveTo(64, 66.8, 56.6, 68.6)
    },
    s.mustache!,
    { color: s.hairS, dx: -1.6, dy: -1.6 },
  )
  curve(c, 56.6, 69, 56.4, 70.6, 56.6, 72.2, 0.9, s.hairS)
}

/** kirli sakalın kısa telleri (x, y, eğim): çene hattı, bıyık ve çene ucunda toplanır, dudak çevresi boştur */
const STUBBLE: number[] = (() => {
  const out: number[] = []
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const inside = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1
  for (let i = 0; i < 4200 && out.length < 3 * 420; i++) {
    const x = 28 + rnd() * 48
    const y = 57 + rnd() * 29
    const lean = (x - 56) * 0.014 + (rnd() - 0.5) * 0.24
    if (inside(x, y, 56.5, 75.4, 9, 2.9)) continue
    if (!inside(x, y, 55.5, 60, 17.6, 21.6) ? rnd() < 0.8 : inside(x, y, 56.8, 71, 8.6, 1.8) || inside(x, y, 56.6, 81.6, 8, 3.8)) out.push(x, y, lean)
  }
  return out
})()

/**
 * Memo'nun kirli sakalı: üç dört günlük tıraşsızlık. Önce yumuşak kenarlı gölge (favoriden çeneye ince hat, dudak üstü,
 * çene ucu), üstüne kılın çıkış yönüne yatan kısa teller. Çene hattı ve ağız açıkta kalır; ağız bunun üstüne çizilir.
 */
function stubble(c: Ctx) {
  const tone = (a: number) => `rgba(44,28,22,${a})`
  c.save()
  c.beginPath()
  headPath(c, false)
  c.clip()
  // çene hattı: iç içe üç şerit, kenarı yumuşak
  c.lineCap = 'butt'
  for (const [w, a] of [[15, 0.16], [10, 0.18], [5.5, 0.2]]) {
    c.beginPath()
    c.moveTo(30.4, 57)
    c.bezierCurveTo(32.6, 72.6, 44, 85, 56, 85)
    c.bezierCurveTo(65.4, 85, 72.6, 76, 76.4, 66)
    c.strokeStyle = tone(a)
    c.lineWidth = w
    c.stroke()
  }
  // favorinin sakala karıştığı yer, dudak üstü, çene ucu ve dudak altı
  soft(c, 31.6, 60, 2.2, 3.8, tone(0.38))
  soft(c, 56.8, 71, 6.2, 1.5, tone(0.46))
  soft(c, 56.6, 81.8, 7.4, 3.2, tone(0.36))
  soft(c, 56.6, 78.6, 2, 1, tone(0.32))
  c.beginPath()
  for (let i = 0; i < STUBBLE.length; i += 3) {
    c.moveTo(STUBBLE[i], STUBBLE[i + 1])
    c.lineTo(STUBBLE[i] + STUBBLE[i + 2], STUBBLE[i + 1] + 0.74)
  }
  c.strokeStyle = tone(0.58)
  c.lineWidth = 0.42
  c.lineCap = 'round'
  c.stroke()
  c.restore()
}

// ── saç ──────────────────────────────────────────────────────────────────

/**
 * Uktun'un arka saçı: omuzlardan ÖNCE çizilir, yani omuzların arkasına düşer. Ensedeki kütle gölgededir (koyu ton);
 * iki yanda ince, dalgalı birer tutam iner, uçları dışa kıvrılır. Yüzü ve boynu önden saran parça yoktur.
 */
function longHairBack(c: Ctx, s: Skin, sw: number) {
  // ense: başın ve boynun arkasında kalan gölgeli kütle
  blob(
    c,
    () => {
      c.moveTo(31, 40)
      c.bezierCurveTo(27, 56, 30, 74, 29 + sw * 0.3, 90)
      c.lineTo(28, 108)
      c.lineTo(77, 108)
      c.lineTo(76.5 + sw * 0.3, 90)
      c.bezierCurveTo(77, 74, 79, 56, 75, 40)
    },
    s.hairS,
  )
  // yakın yan: kulağın arkasından inen tutam, üç uç
  blob(
    c,
    () => {
      c.moveTo(30, 28)
      c.bezierCurveTo(18, 36, 17, 52, 21, 63)
      c.bezierCurveTo(23.5, 72, 19, 80, 12.5 + sw, 87.5)
      c.quadraticCurveTo(17 + sw, 89, 20.5 + sw * 0.6, 85.5)
      c.quadraticCurveTo(21 + sw, 96, 16.5 + sw, 106)
      c.quadraticCurveTo(24 + sw, 103, 27 + sw * 0.6, 95)
      c.quadraticCurveTo(29 + sw, 101, 33 + sw, 105)
      c.quadraticCurveTo(35.5 + sw * 0.4, 96, 33, 85)
      c.bezierCurveTo(31.5, 76, 29.5, 68, 30.5, 60)
      c.lineTo(33, 34)
    },
    s.hair,
    { color: s.hairS, dx: -3.2, dy: -1.6 },
  )
  // uzak yan: daha ince, iki uç
  blob(
    c,
    () => {
      c.moveTo(74, 30)
      c.bezierCurveTo(82.5, 40, 83, 56, 80.5, 66)
      c.bezierCurveTo(79, 75, 84, 83, 88.5 + sw, 89)
      c.quadraticCurveTo(84.5 + sw, 90.5, 82 + sw * 0.6, 87.5)
      c.quadraticCurveTo(82.5 + sw, 97, 79 + sw, 105)
      c.quadraticCurveTo(75.5 + sw * 0.4, 97, 75, 86)
      c.bezierCurveTo(75.5, 76, 77, 66, 76, 56)
      c.lineTo(72, 34)
    },
    s.hair,
    { color: s.hairS, dx: -3, dy: -1.6 },
  )
  // tutam ayrımları (mürekkep) ve ışık
  curve(c, 25.5, 66, 26, 77, 20.5 + sw * 0.6, 85.5, 1, INK)
  curve(c, 29, 80, 30, 88, 27 + sw * 0.6, 95, 1, INK)
  curve(c, 79, 72, 80, 81, 82 + sw * 0.6, 87.5, 1, INK)
  curve(c, 19.6, 46, 18.6, 55, 21.6, 63, 1.7, s.hairL)
  curve(c, 21, 76, 18.5, 81, 15.5 + sw * 0.8, 85, 1.4, s.hairL)
  curve(c, 24.4, 88, 24.6, 93, 22.6 + sw, 98, 1.2, s.hairL)
  // uzak yanda saçın dış hattını izleyen kenar ışığı ve tel
  hairRim(c, s, 80.6, 42, 82.4, 55, 79.6, 66)
  hairRim(c, s, 79.6, 68, 80.6, 79.6, 86.6 + sw, 87.4)
  curve(c, 78, 60, 77.6, 70, 78.4, 80, 0.8, INK)
  // ensede ayrı düşen ince teller
  curve(c, 35.5, 78, 36.4, 86, 35 + sw * 0.5, 93, 0.9, s.hair)
  curve(c, 71.6, 80, 71, 87, 72.4 + sw * 0.5, 93, 0.9, s.hair)
}

/**
 * Uktun'un ön saçı: tepede hacim, yandan ayrım, alnın üstünden yana taranmış perçem. Şakakta biter:
 * yakın yanda kulağın üstünden arkaya atılır (kulak tam görünür), uzak yanda şakağın arkasında kalır.
 */
function fringePath(c: Ctx) {
  c.moveTo(25.6, 52.5)
  c.bezierCurveTo(18.5, 37, 27, 17.5, 47, 16)
  c.quadraticCurveTo(55.5, 12, 63.5, 16.5)
  c.bezierCurveTo(75.5, 19, 82, 30, 79.6, 44)
  c.quadraticCurveTo(79.8, 48.5, 77.6, 52)
  // uzak şakak: saç çizgisi ayrıma doğru yükselir
  c.quadraticCurveTo(77.6, 44.5, 73.4, 39.4)
  c.quadraticCurveTo(69.6, 35, 64.4, 33)
  // perçem: ayrımdan yakın şakağa akan dört tutam; çentikler sığ, uçlar kaşların üstünde biter
  c.quadraticCurveTo(62.2, 38.4, 56.2, 39.4)
  c.quadraticCurveTo(57.7, 38, 57.7, 36.6)
  c.quadraticCurveTo(53.6, 40, 47.6, 40.2)
  c.quadraticCurveTo(49.2, 38.8, 49.1, 37.6)
  c.quadraticCurveTo(45, 40.4, 39.8, 40.6)
  c.quadraticCurveTo(41.2, 39.5, 41.1, 38.3)
  c.quadraticCurveTo(36.4, 39.6, 33.4, 43.6)
  // kulağın üstünden arkaya
  c.quadraticCurveTo(31.4, 47, 31.2, 51.4)
  c.quadraticCurveTo(28.4, 50.6, 25.6, 52.5)
}

/** saçın sağ dış hattını izleyen ince, sürekli sıcak vurgu (kenar ışığı): saçın parlak tonu, üstünde hafif sıcak ışık */
function hairRim(c: Ctx, s: Skin, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  curve(c, x0, y0, cx, cy, x1, y1, 0.85, s.hairL)
  curve(c, x0, y0, cx, cy, x1, y1, 0.85, 'rgba(255,214,160,0.22)')
}

function longHairFront(c: Ctx, s: Skin) {
  blob(c, () => fringePath(c), s.hair, { color: s.hairS, dx: -3, dy: -2.4 })
  // ayrım çizgisi ve tutam aralarında ince mürekkep telleri
  curve(c, 64.4, 33, 63.4, 23, 57, 15.4, 1, INK)
  curve(c, 57.7, 36.6, 55, 28.6, 47, 22.6, 0.75, INK)
  curve(c, 49.1, 37.6, 44.6, 30.6, 36.4, 27.6, 0.75, INK)
  curve(c, 41.1, 38.3, 37.4, 34.6, 31.4, 34.4, 0.75, INK)
  curve(c, 31.2, 51.4, 30.6, 44, 33.6, 38.6, 0.9, s.hairS)
  curve(c, 69, 24, 74, 29, 75.6, 37, 0.9, s.hairS)
  // parlak şeritler: tepede bir hale gibi dizilir, perçemde tutamları izler
  curve(c, 23.6, 40, 26.4, 26.5, 41, 20.4, 2.2, s.hairL)
  curve(c, 33.6, 30.6, 39, 26, 45.6, 25.2, 1.4, s.hairL)
  curve(c, 49.4, 26.4, 53.6, 28, 56.4, 31.4, 1.3, s.hairL)
  curve(c, 37.6, 37.6, 40.4, 35.6, 42.6, 35.4, 1, s.hairL)
  curve(c, 51.4, 37.4, 54, 35.6, 55.4, 34, 1, s.hairL)
  hairRim(c, s, 65.6, 18.6, 79.6, 21.6, 78.3, 43.6)
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
      c.lineTo(33, 61.5)
      c.quadraticCurveTo(29.6, 61.4, 25.6, 59)
    },
    s.hair,
    { color: s.hairS, dx: -3.2, dy: -2.8 },
  )
  curve(c, 57.4, 35.6, 55, 28, 47, 23.6, 1, s.hairS)
  curve(c, 71, 37.6, 71.6, 30, 66, 24, 1, s.hairS)
  curve(c, 25.4, 40, 28, 25.5, 42, 20.6, 2.4, s.hairL)
  curve(c, 52, 17.6, 58, 15.6, 62.6, 19.4, 1.6, s.hairL)
}

function memoTopPath(c: Ctx) {
  c.moveTo(28.6, 44.5)
  c.bezierCurveTo(21.5, 31, 29, 16.5, 45, 15.5)
  c.quadraticCurveTo(49.5, 11, 56, 14)
  c.quadraticCurveTo(61, 9.8, 66.5, 14.6)
  c.quadraticCurveTo(72.5, 13.6, 75.4, 18.6)
  c.bezierCurveTo(81.5, 23, 82.6, 33, 78.6, 41.5)
  // alın çizgisi: tutam tutam
  c.quadraticCurveTo(76.8, 37, 71.6, 35.4)
  c.quadraticCurveTo(66, 39, 59.6, 35.8)
  c.quadraticCurveTo(52, 39.8, 44, 36.6)
  c.quadraticCurveTo(37.6, 37, 34, 42)
  c.quadraticCurveTo(31, 42.6, 28.6, 44.5)
}

/** Memo'nun saçı: yanlar kısa ve koyu, üstü hacimli; öne ve yana kabaran ayrı tutamlar, aralarında mürekkep çizgileri */
function memoHair(c: Ctx, s: Skin) {
  // yanlar: şakaktan favoriye kısa kesim; üstle aynı ton, dış hatsız, alt ucu sakala karışır
  c.beginPath()
  c.moveTo(28.6, 44.5)
  c.lineTo(34.2, 41.5)
  c.lineTo(33.7, 52)
  c.quadraticCurveTo(33.6, 56.4, 32.6, 60)
  c.quadraticCurveTo(30.6, 58.4, 29.9, 53.6)
  c.quadraticCurveTo(27.4, 50.8, 26, 46.6)
  c.quadraticCurveTo(25.7, 43.8, 26.4, 42)
  c.closePath()
  c.moveTo(78.4, 40)
  c.quadraticCurveTo(79.6, 46.6, 77.5, 52.6)
  c.quadraticCurveTo(76.4, 47.6, 76, 41.6)
  c.closePath()
  c.fillStyle = s.hair
  c.fill()
  curve(c, 33.9, 43.6, 34, 48, 33.6, 53, 0.8, s.hairS)
  curve(c, 26.2, 43, 25.6, 45.6, 26.4, 47.6, 1.1, INK)
  // kısa kesimin dokusu
  c.beginPath()
  for (const [x, y] of [[28, 46.6], [30, 45.4], [32, 44.4], [28.6, 50], [30.4, 48.8], [32.2, 48], [31, 52.6], [32.4, 51.6], [31.6, 56]]) {
    c.moveTo(x, y)
    c.lineTo(x - 0.3, y + 1.5)
  }
  c.strokeStyle = s.hairL
  c.lineWidth = 0.5
  c.lineCap = 'round'
  c.stroke()
  const top = () => memoTopPath(c)
  blob(c, top, s.hair, { color: s.hairS, dx: -3.2, dy: -2.8 })
  hairRim(c, s, 75.8, 19.8, 84.4, 27, 78.3, 40.6)
  // tutam aralarında mürekkep çizgileri
  curve(c, 59.6, 35.8, 58.4, 29, 52, 24.4, 0.9, INK)
  curve(c, 71.6, 35.4, 71.6, 29, 67, 23.6, 0.9, INK)
  curve(c, 44, 36.6, 43, 31, 37.6, 27.6, 0.9, INK)
  curve(c, 56, 14, 55.2, 19, 51, 22, 0.9, INK)
  curve(c, 66.5, 14.6, 66, 19.6, 62.4, 23, 0.9, INK)
  // parlak şeritler: tepede ve tutamların sırtında
  curve(c, 24.8, 37, 27, 25, 40, 20, 2.3, s.hairL)
  curve(c, 46.6, 18.4, 50.6, 14.8, 54, 16.6, 1.6, s.hairL)
  curve(c, 58.6, 16.8, 62, 13.4, 65, 16.8, 1.6, s.hairL)
  curve(c, 36, 31, 41, 26.6, 47.4, 27, 1.2, s.hairL)
  curve(c, 55, 29, 60, 26.4, 65.4, 28.4, 1.2, s.hairL)
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
      c.bezierCurveTo(22, 11, 18, 42, 21.5, 65)
      c.quadraticCurveTo(25, 84, 40, 94.5)
      c.lineTo(64, 94.5)
      c.quadraticCurveTo(78.5, 84, 81, 64)
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
      c.moveTo(22.4, 70)
      c.bezierCurveTo(15.5, 40, 26, 10.5, 52, 10.5)
      c.bezierCurveTo(77, 10.5, 86.5, 38, 80.6, 68.5)
      c.quadraticCurveTo(79.6, 49, 71.5, 39.5)
      c.quadraticCurveTo(57, 27.5, 41.4, 34.5)
      c.quadraticCurveTo(30.6, 41, 29.4, 55)
      c.quadraticCurveTo(27, 64, 22.4, 70)
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
  if (s.long) return [1.07, 50.5, 11.5]
  if (s.hat === 'toque') return [0.98, 52, -5.5]
  if (s.hat === 'kalpak') return [1.04, 52, 5]
  if (s.hat === 'kasket') return [1.06, 55, 8.5]
  if (s.hat === 'yazma') return [1.14, 51.4, 10.5]
  return [1.07, 52, 8]
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
    c.translate(-53, -(s.hat && s.hat !== 'yazma' ? 53 : 56))
    boost = Math.max(1, 0.62 / (k * f))
  } else {
    const [f, cx, top] = frame(s)
    c.translate(PORTRAIT_W / 2, 3.5)
    c.scale(f, f)
    c.translate(-cx, -top)
    boost = Math.max(1, 0.62 / (k * f))
  }
  ink(MID_INKW)

  const fem = !!s.long || s.hat === 'yazma'
  // baş ve boyun: omuzların yarısı kadar oynar, çok hafif yana eğilir
  const head = () => {
    c.translate(52, 92 + breath * 0.5)
    c.rotate(tilt)
    c.translate(-52, -92)
  }
  // uzun saç omuzların arkasına düşer: en önce çizilir
  if (s.long) {
    c.save()
    head()
    longHairBack(c, s, sway)
    c.restore()
  }

  // omuzlar: nefesle hafifçe iner kalkar
  c.save()
  c.translate(0, breath + BODY_DY)
  propBack(c, s)
  ink(INKW)
  shoulders(c, look, s)
  ink(MID_INKW)
  collar(c, look, s)
  propFront(c, s)
  c.restore()

  c.save()
  head()
  if (s.hat === 'yazma') yazmaBack(c, s)
  neck(c, s, fem)
  c.restore()

  if (!s.bare) {
    c.save()
    c.translate(0, breath + 1.5 + BODY_DY)
    scarf(c, s)
    c.restore()
  }

  c.save()
  head()
  const skull = () => headPath(c, fem, look === 'genc')
  ink(FACE_INKW)
  blob(c, skull, s.skin, { color: s.skinS, dx: -2.6, dy: -2.2 })
  ink(MID_INKW)
  // hacim: ışık sol üstte, sağ alt kenara doğru yumuşak ikinci ton; saçın alna düşen gölgesi iki kademede erir
  c.save()
  c.beginPath()
  skull()
  c.clip()
  const vol = c.createRadialGradient(44, 48, 16, 49, 55, 40)
  vol.addColorStop(0, fade(s.skinS, 0))
  vol.addColorStop(1, fade(s.skinS, 0.45))
  c.fillStyle = vol
  c.fillRect(24, 22, 56, 66)
  if (s.long || look === 'memo') {
    c.fillStyle = fade(s.skinS, 0.42)
    for (const d of [1.7, 3.4]) {
      c.save()
      c.translate(d * 0.3, d)
      c.beginPath()
      if (s.long) fringePath(c)
      else memoTopPath(c)
      c.fill()
      c.restore()
    }
  }
  c.restore()
  face(c, look, s, shut, fem)
  if (s.beard) beard(c, s, look === 'ozan')
  if (s.stubble) stubble(c)
  mouth(c, look, s)
  if (s.mustache && !s.beard) mustache(c, s)
  if (s.long) longHairFront(c, s)
  else if (s.hat === 'yazma') partedHair(c, s)
  else if (look === 'memo') {
    // kulak favorinin arkasında kalır
    ear(c, s, 26.6)
    memoHair(c, s)
  }
  else shortHair(c, s)
  if (s.hat === 'yazma') {
    yazmaFront(c, s)
    c.translate(0, BODY_DY)
    yazmaKnot(c, s)
  } else {
    if (look !== 'memo') ear(c, s)
    hat(c, s)
  }
  c.restore()

  boost = 1
  setInkWidth(HERO_INKW)
  c.restore()
}
