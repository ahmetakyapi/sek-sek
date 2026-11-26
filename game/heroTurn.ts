/**
 * Mağaza döner sahnesinin önden ve arkadan tam boy çizimi (HeroTurntable): oyundaki karakter yan görünüşte kalır, bu iki
 * görüş yalnız önizlemede kullanılır. Aynı fırçalar (`blob`, `stroke`, yumuşak boya kipi) ve aynı palet (`resolveSkin`:
 * saç, ten, kıyafet rengi ve deseni, göz, ifade, atkı); baş portrenin başıdır (`drawTurnHead`, portre biriminde ölçeklenir),
 * sırt eşyası oyundaki yan çizimin aynısı (`drawBackGear`): önden çoğu gövdenin ardında kalır, kenarından taşan kısmı ve
 * askısı görünür; arkadan sırtın ortasında tam görünür. Poz yan görünüşün pozudur (game/stance.ts): uyluk ve kol
 * açılarının dikey bileşeni önden de aynı yüksekliği verir (koşuda diz kalkar, zıplamada kollar açılır), adım kalçayı
 * hafifçe yana yatırır, dururken nefes alır. Birim: boy ~100, ayak tabanı ortası (0, 0), y yukarı eksi.
 */
import { NO_KIT, type AccessoryId, type Kit } from './accessories'
import { blob, drawBackGear, drawPattern, groundBob, resolveSkin, setSoft, stroke, type Look, type Pose } from './heroDraw'
import { drawTurnHead } from './portraitDraw'

export type TurnView = 'front' | 'back'

const TAU = Math.PI * 2
const rad = (d: number) => (d * Math.PI) / 180
const THIGH = 21
const SHIN = 18.5
const UPPER = 16
const FORE = 14
const HIP_Y = -44
/** portre başının tam boydaki ölçeği: yan görünüşteki başla aynı boy (göz-çene ~9,3 birim) */
const HEAD_S = 0.41
/** portre biriminde başın dönüm noktası (göz hattının ortası) */
const HEAD_X = 52
const HEAD_Y = 55.6
/** baş çizgileri küçük ölçekte gövdenin hattıyla aynı ağırlıkta kalsın */
const HEAD_LINE = 1.9
const GLINT = 'rgba(255,238,210,0.4)'
const CONTACT = 'rgba(30,16,44,0.13)'
const CAPE = '#4656b0'
const CAPE_S = '#2e3a80'
/** yan çizimde ince duran sırt eşyaları: arkadan bakınca genişler */
const WIDE_BACK: ReadonlySet<AccessoryId> = new Set(['sirtcanta', 'kamp', 'ayi', 'heybe', 'sepet', 'jet', 'okluk'])
/** önden ve arkadan iki yanda simetrik duran eşyalar: yan çizim aynalanarak ikilenir */
const PAIRED: ReadonlySet<AccessoryId> = new Set(['kanat'])

function fine(c: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string) {
  c.beginPath()
  c.moveTo(x0, y0)
  c.quadraticCurveTo(cx, cy, x1, y1)
  c.strokeStyle = color
  c.lineWidth = w
  c.lineCap = 'round'
  c.stroke()
}

type Skin = ReturnType<typeof resolveSkin>

/** bacak önden/arkadan: kalçadan dize, dizden bileğe; yüksekliği yan pozun açılarından (diz kalkınca bacak kısalır) */
function leg(c: CanvasRenderingContext2D, s: Skin, view: TurnView, hx: number, hy: number, a: number, k: number, side: number, near: boolean) {
  const ky = hy + Math.cos(rad(a)) * THIGH
  const ey = ky + Math.cos(rad(a - k)) * SHIN
  // öne kalkan diz biraz dışa açılır
  const kx = hx + side * (0.6 + Math.max(0, Math.sin(rad(a))) * 1.2)
  const ex = hx + side * 0.4
  const pants = near ? s.pants : s.pantsS
  stroke(c, [hx, hy, kx, ky, ex, ey], 10, pants)
  // paça katı ve dizde kıvrım
  stroke(c, [ex, ey - 3.4, ex, ey - 1], 11, pants)
  stroke(c, [ex - 4.4, ey - 3.6, ex + 4.4, ey - 3.6], 0.7, GLINT, false)
  fine(c, kx - 2.4, ky - 0.6, kx, ky + 0.8, kx + 2.4, ky - 0.6, 0.8, s.pantsS)
  // dikiş: dış yanda kesik çizgi
  c.setLineDash([1.2, 1])
  stroke(c, [hx + side * 3.4, hy + 2, kx + side * 3.6, ky, ex + side * 3.6, ey - 4], 0.55, 'rgba(255,226,170,0.38)', false)
  c.setLineDash([])
  // bot: önden burun yuvarlak ve geniş, arkadan topuk
  c.save()
  c.translate(ex, ey)
  blob(
    c,
    () => {
      if (view === 'front') {
        c.moveTo(-4.2, -3.6)
        c.lineTo(4.2, -3.6)
        c.quadraticCurveTo(5.6, 0, 5.2, 3.6)
        c.lineTo(-5.2, 3.6)
        c.quadraticCurveTo(-5.6, 0, -4.2, -3.6)
      } else {
        c.moveTo(-4, -3.6)
        c.lineTo(4, -3.6)
        c.quadraticCurveTo(4.8, 0, 4.4, 3.6)
        c.lineTo(-4.4, 3.6)
        c.quadraticCurveTo(-4.8, 0, -4, -3.6)
      }
    },
    near ? s.boot : s.bootS,
    { color: s.bootS, dx: 0, dy: -1.6 },
  )
  stroke(c, [-5, 3, 5, 3], 1.4, 'rgba(28,16,18,0.5)', false)
  if (view === 'front') {
    // bağcık çaprazları ve burunda ışık
    stroke(c, [-1.4, -3, 1.4, -1.6, -1.4, -0.4, 1.4, 0.8], 0.6, 'rgba(255,236,206,0.6)', false)
    fine(c, -3.6, 1.2, -2.6, -0.4, -1.4, -0.8, 1, GLINT)
  } else stroke(c, [-3, 1.4, 3, 1.4], 1, s.bootS, false)
  c.restore()
}

/** kol: omuzdan sarkar; yükseklik yan pozun kol açılarından, öne ya da geriye uzanan kol önden kısalır */
function arm(c: CanvasRenderingContext2D, s: Skin, sx: number, sy: number, a1: number, a2: number, side: number, near: boolean) {
  const u1 = Math.sin(rad(a1))
  const u2 = Math.sin(rad(a2))
  const ky = sy + Math.cos(rad(a1)) * UPPER
  const kx = sx + side * (1.2 + Math.abs(u1) * 2.4)
  // ön kol yatayken el bele doğru içeri gelir (eller belde, kollar bağlı)
  const ey = ky + Math.cos(rad(a2)) * FORE
  const ex = kx + side * (0.4 - Math.abs(u2) * 3.6)
  const coat = near ? s.coat : s.coatS
  stroke(c, [sx, sy, kx, ky, ex, ey], 8.8, coat)
  const dx = ex - kx
  const dy = ey - ky
  const l = Math.hypot(dx, dy) || 1
  stroke(c, [ex - (dx / l) * 2.2, ey - (dy / l) * 2.2, ex, ey], 8, s.coatS)
  if (near) stroke(c, [sx - side * 1.6, sy + 0.6, kx - side * 1.6, ky], 1.4, s.coatL, false)
  // el
  const hx = ex + (dx / l) * 3
  const hy = ey + (dy / l) * 3
  blob(c, () => c.ellipse(hx, hy, 3.1, 3.4, 0, 0, TAU), near ? s.skin : s.skinS, near ? { color: s.skinS, dx: 0.8 * side, dy: -0.6 } : undefined)
}

/** gövde önden/arkadan: omuzdan bele hafif daralır, etek kalçada açılır */
function torso(c: CanvasRenderingContext2D, s: Skin, view: TurnView, x: number, y: number) {
  const body = () => {
    c.moveTo(x - 9.4, y - 25.6)
    c.quadraticCurveTo(x, y - 28.4, x + 9.4, y - 25.6)
    c.quadraticCurveTo(x + 12.6, y - 23.6, x + 12, y - 15)
    c.quadraticCurveTo(x + 10.6, y - 6, x + 11, y + 1.6)
    c.quadraticCurveTo(x, y + 3.8, x - 11, y + 1.6)
    c.quadraticCurveTo(x - 10.6, y - 6, x - 12, y - 15)
    c.quadraticCurveTo(x - 12.6, y - 23.6, x - 9.4, y - 25.6)
    c.closePath()
  }
  blob(c, body, s.coat, { color: s.coatS, dx: -3.2, dy: -1 })
  if (s.pat && s.patC) drawPattern(c, s.pat, s.patC, x - 13, y - 29, 26, 34, 1, body)
  // etek ucu ribanası
  c.save()
  c.beginPath()
  body()
  c.clip()
  c.fillStyle = 'rgba(40,20,50,0.16)'
  c.fillRect(x - 13, y - 2, 26, 7)
  c.beginPath()
  for (let i = -10; i <= 10; i += 2) {
    c.moveTo(x + i, y - 1.6)
    c.lineTo(x + i, y + 3)
  }
  c.strokeStyle = 'rgba(40,20,50,0.18)'
  c.lineWidth = 0.5
  c.stroke()
  c.restore()
  if (s.quilt) {
    // kapitone dilimler
    fine(c, x - 11, y - 8.4, x, y - 6.8, x + 11, y - 8.4, 0.9, s.coatS)
    fine(c, x - 11.8, y - 16, x, y - 14.4, x + 11.8, y - 16, 0.9, s.coatS)
    fine(c, x - 9.4, y - 12.4, x - 4, y - 11.4, x + 1, y - 11.8, 0.9, 'rgba(255,240,200,0.32)')
    fine(c, x - 9.4, y - 5, x - 4, y - 4, x + 1, y - 4.4, 0.9, 'rgba(255,240,200,0.28)')
  }
  if (view === 'front') {
    // gömlek açıklığı, fermuar, iki cep kapağı
    c.beginPath()
    c.moveTo(x - 3.4, y - 26.4)
    c.lineTo(x + 3.4, y - 26.4)
    c.lineTo(x, y - 17)
    c.closePath()
    c.fillStyle = s.shirt
    c.fill()
    fine(c, x, y - 17, x + 0.4, y - 7, x, y + 2.6, 0.9, 'rgba(58,26,34,0.7)')
    c.setLineDash([1.2, 1])
    fine(c, x - 0.9, y - 16, x - 0.6, y - 7, x - 0.9, y + 2, 0.5, s.coatS)
    c.setLineDash([])
    stroke(c, [x + 0.6, y - 16.4, x + 0.8, y - 13.8], 1, '#d8d2c4', false)
    for (const sd of [-1, 1]) {
      blob(
        c,
        () => {
          c.moveTo(x + sd * 3, y - 10.4)
          c.lineTo(x + sd * 9, y - 10.6)
          c.lineTo(x + sd * 8.8, y - 8.4)
          c.quadraticCurveTo(x + sd * 6, y - 7.4, x + sd * 3.2, y - 8.2)
        },
        s.coat,
        { color: s.coatS, dx: 0, dy: -1 },
      )
    }
  } else {
    // sırt: omuz arası dikişi (boyunduruk) ve orta dikiş
    fine(c, x - 10, y - 20.4, x, y - 18.6, x + 10, y - 20.4, 0.8, s.coatS)
    c.setLineDash([1.2, 1])
    fine(c, x, y - 18.6, x + 0.3, y - 9, x, y + 1, 0.6, s.coatS)
    c.setLineDash([])
  }
  // dik yaka
  blob(
    c,
    () => {
      c.moveTo(x - 7, y - 26.4)
      c.quadraticCurveTo(x, y - 30.4, x + 7, y - 26.4)
      c.lineTo(x + 7.4, y - 23.8)
      c.quadraticCurveTo(x, y - 26.8, x - 7.4, y - 23.8)
    },
    s.coat,
    { color: s.coatS, dx: 0, dy: -1.4 },
  )
  // ışık sol kenarda
  stroke(c, [x - 9.8, y - 22.6, x - 10.8, y - 14], 2, s.coatL, false)
  stroke(c, [x - 10.4, y - 11, x - 9.8, y - 4], 1.2, s.coatL, false)
}

/** atkı önden: boynu saran sargı ve göğse düşen uç; arkadan: sargı ve ensede iki kısa uç */
function scarf(c: CanvasRenderingContext2D, s: Skin, view: TurnView, x: number, y: number, t: number, flow: number) {
  const f = Math.max(0, Math.min(1, flow))
  const sw = Math.sin(t * 13 + 1.3) * 1.1 * f + Math.sin(t * 2.6 + 1.3) * 0.4 * (1 - f)
  if (view === 'back') {
    // ensedeki düğümden iki uç: koşarken yana savrulur
    for (const sd of [-1, 1]) {
      const ox = x + sd * 1.6
      blob(
        c,
        () => {
          c.moveTo(ox - 2, y - 25)
          c.lineTo(ox + 2, y - 25)
          c.lineTo(ox + sd * (1.6 + f * 5) + 2.4 + sw, y - 13 - f * 3)
          c.lineTo(ox + sd * (1.6 + f * 5) - 0.4 + sw, y - 14.4 - f * 3)
          c.lineTo(ox + sd * (1.6 + f * 5) - 2.4 + sw, y - 12.6 - f * 3)
        },
        s.scarf,
        { color: s.scarfS, dx: sd * 1.2, dy: 0 },
      )
    }
  }
  blob(
    c,
    () => {
      c.moveTo(x - 7.6, y - 29.4)
      c.quadraticCurveTo(x, y - 32, x + 7.6, y - 29.4)
      c.quadraticCurveTo(x + 9.2, y - 26.6, x + 7.8, y - 23.4)
      c.quadraticCurveTo(x, y - 20.6, x - 7.8, y - 23.4)
      c.quadraticCurveTo(x - 9.2, y - 26.6, x - 7.6, y - 29.4)
    },
    s.scarf,
    { color: s.scarfS, dx: 0, dy: -2.2 },
  )
  fine(c, x - 5.6, y - 29.6, x - 1, y - 30.8, x + 3, y - 30.2, 1.1, GLINT)
  fine(c, x - 6.4, y - 25.4, x, y - 23.4, x + 6.4, y - 25.4, 0.8, s.scarfS)
  if (view === 'front') {
    // göğse düşen uç: püsküllü, adımla sallanır
    blob(
      c,
      () => {
        c.moveTo(x - 5.4, y - 24.4)
        c.lineTo(x - 1.2, y - 23.6)
        c.lineTo(x - 1.6 + sw, y - 11.6)
        c.lineTo(x - 6 + sw, y - 12.2)
      },
      s.scarf,
      { color: s.scarfS, dx: 1, dy: 0 },
    )
    for (let i = 0; i < 4; i++) stroke(c, [x - 5.4 + i * 1.3 + sw, y - 12, x - 5.5 + i * 1.3 + sw, y - 10], 0.8, s.scarf, false)
    fine(c, x - 4.6, y - 22, x - 4 + sw * 0.5, y - 17, x - 4.4 + sw, y - 13, 1, s.scarfS)
  }
}

/** pelerin önden (gövdenin ardında, iki yandan ve eteğin altından görünür) ve arkadan (sırtı örter) */
function cape(c: CanvasRenderingContext2D, view: TurnView, x: number, y: number, t: number, flow: number) {
  const f = Math.max(0, Math.min(1.4, flow))
  const w = 13.5 + f * 2.4
  const wave = Math.sin(t * (f > 0.3 ? 9 : 1.8)) * (0.6 + f * 1.4)
  const hem = y + 26 - f * 4
  const path = () => {
    c.moveTo(x - 9, y - 26)
    c.quadraticCurveTo(x, y - 28.6, x + 9, y - 26)
    c.quadraticCurveTo(x + w, y, x + w + 1 + wave, hem)
    c.quadraticCurveTo(x + w * 0.5, hem + 2 - wave, x, hem)
    c.quadraticCurveTo(x - w * 0.5, hem + 2 + wave, x - w - 1 - wave, hem)
    c.quadraticCurveTo(x - w, y, x - 9, y - 26)
  }
  blob(c, path, view === 'front' ? CAPE_S : CAPE, { color: CAPE_S, dx: -3, dy: -1 })
  // etek ucunda altın sırma ve kıvrımlar
  stroke(c, [x - w - wave, hem - 1.4, x, hem - 1, x + w + wave, hem - 1.4], 1.2, '#e8c050', false)
  if (view === 'back') {
    fine(c, x - 4, y - 18, x - 5.6 + wave * 0.5, y + 4, x - 6 + wave, hem - 2, 1, CAPE_S)
    fine(c, x + 4, y - 18, x + 5.6 + wave * 0.5, y + 4, x + 6 + wave, hem - 2, 1, CAPE_S)
    stroke(c, [x - 7.4, y - 22, x - 9.4, y - 4], 1.6, 'rgba(190,205,255,0.55)', false)
  }
}

export interface TurnOpts {
  moving?: boolean
  sx?: number
  sy?: number
  scarf?: string
  scarfS?: string
  acc?: Kit
  flow?: number
}

/**
 * Karakteri önden ya da arkadan çizer (x, y ayak tabanı ortası; size boy). Yan görünüşün pozuyla canlıdır.
 */
export function drawHeroTurn(c: CanvasRenderingContext2D, look: Look, view: TurnView, pose: Pose, x: number, y: number, size: number, t: number, opts: TurnOpts = {}) {
  const kit = opts.acc ?? NO_KIT
  const s = resolveSkin(look, kit.look, opts.scarf, opts.scarfS)
  const moving = !!opts.moving
  const flow = opts.flow ?? (moving ? 1 : 0)
  const wasSoft = setSoft(true)
  c.save()
  c.translate(x, y)
  const k = size / 100
  c.scale(k * (opts.sx ?? 1), k * (opts.sy ?? 1))
  const bob = (pose.bob ?? 0) + (pose.ground ? groundBob(pose) : 0)
  const [fa, na] = pose.arms
  const [fl, nl] = pose.legs
  // adım: kalça basan bacağa doğru kayar, omuzlar hafifçe ters yatar
  const step = moving ? Math.max(-1, Math.min(1, (nl[0] - fl[0]) / 70)) : Math.sin(t * 1.3) * 0.12
  const hipX = step * 0.9
  const hipY = HIP_Y + bob
  const ty = hipY + 1
  const breath = pose.ground && !moving ? Math.sin(t * 2.6 + 0.9) * 0.45 : 0
  const sY = ty - 22 + breath
  // önden yakın bacak/kol izleyenin sağında; arkadan solunda
  const m = view === 'front' ? 1 : -1
  if (pose.ground) {
    c.fillStyle = CONTACT
    for (let i = 0; i < 3; i++) {
      c.beginPath()
      c.ellipse(0, -0.4, 15 - i * 3.2, 3 - i * 0.6, 0, 0, TAU)
      c.fill()
    }
  }
  const sw = moving && pose.ground ? (pose.sway ?? -nl[0] * 0.028) : Math.sin(t * 2.2) * 0.3 + (pose.ground ? 0 : (pose.lift ?? 0) * 2)
  const lift = pose.lift ?? 0
  const back = kit.back
  /** sırt eşyası: yan çizimin sırt noktası (tx - 9; geniş çantada ortası tx - 13) gövdenin ortasına gelir */
  const gear = (part: 'back' | 'front', mirror: boolean, wide: number) => {
    c.save()
    c.translate(hipX, 0)
    if (mirror) c.scale(-1, 1)
    c.scale(wide, 1)
    // genişleyen çanta yan çizimde sırtın gerisine taşar: ortası sırtın ortasına gelsin
    c.translate(wide > 1 ? 13 : 9, 0)
    drawBackGear(c, look, kit, part, 0, ty, t, sw, flow, lift)
    c.restore()
  }
  const head = (part: 'behind' | 'neck' | 'head' | 'nape' | 'back') => {
    c.save()
    c.translate(hipX * 1.2, ty - 41.6 + breath)
    c.rotate(-step * 0.03)
    c.scale(HEAD_S, HEAD_S)
    c.translate(-HEAD_X, -HEAD_Y)
    drawTurnHead(c, look, t, part, { scarf: opts.scarf, scarfS: opts.scarfS, acc: kit, sway: step * 1.5 + Math.sin(t * 1.3) * 0.6, blink: !!pose.blink, line: HEAD_LINE })
    c.restore()
  }
  /** üst gövde: adımla çok hafif yana yatar */
  const upper = () => {
    c.translate(hipX, hipY)
    c.rotate(-step * 0.025)
    c.translate(-hipX, -hipY)
  }

  if (view === 'front') {
    // gövdenin ardında: pelerin, sırt eşyasının taşan kısmı, uzun saç
    if (back === 'pelerin') cape(c, 'front', hipX, ty + breath, t, flow)
    else if (back !== 'yok' || s.role === 'tube') {
      gear('back', false, 1)
      if (PAIRED.has(back)) gear('back', true, 1)
    }
    head('behind')
  }
  // bacaklar: öne kalkan bacak önde çizilir
  const legs: Array<[number[], number, boolean]> = [
    [fl, -m, false],
    [nl, m, true],
  ]
  if (Math.sin(rad(legs[0][0][0])) * m > Math.sin(rad(legs[1][0][0])) * m) legs.reverse()
  for (const [l, side, near] of legs) leg(c, s, view, hipX + side * 4.6, hipY, l[0], l[1], side, near)
  c.save()
  upper()
  torso(c, s, view, hipX, ty + breath * 0.3)
  if (view === 'front') {
    gear('front', false, 1)
  } else {
    // arkadan: askı sırtı çaprazlar (aynalı), eşya sırtın ortasında; pelerin sırtı örter
    if (back !== 'pelerin' && back !== 'yok') gear('front', true, 1)
  }
  arm(c, s, hipX - 10.6, sY + 1, (view === 'front' ? fa : na)[0], (view === 'front' ? fa : na)[1], -1, view === 'front' ? false : true)
  arm(c, s, hipX + 10.6, sY + 1, (view === 'front' ? na : fa)[0], (view === 'front' ? na : fa)[1], 1, view === 'front')
  if (view === 'front') {
    head('neck')
    if (!s.bare) scarf(c, s, view, hipX, ty + breath, t, flow)
    head('head')
  } else {
    head('nape')
    if (!s.bare) scarf(c, s, view, hipX, ty + breath, t, flow)
    if (back === 'pelerin') cape(c, 'back', hipX, ty + breath, t, flow)
    else if (back !== 'yok' || s.role) {
      gear('back', false, WIDE_BACK.has(back) ? 1.6 : 1)
      if (PAIRED.has(back)) gear('back', true, 1)
      if (back === 'yok' && s.role === 'satchel') gear('front', true, 1)
    }
    head('back')
  }
  c.restore()
  c.restore()
  setSoft(wasSoft)
}
