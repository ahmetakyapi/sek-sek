/**
 * Karaktere özgü Kılık Dükkânı parçalarının çizimi (game/accessories.ts: `for`). Baş ve yüz parçaları tek yerde çizilir,
 * hem oyundaki karakter (heroDraw) hem vesikalık (portraitDraw) çağırır: parça "baş çerçevesi"ne (`HeadFrame`) göre
 * yazılır; çerçeve her çizicide gözün, ağzın, çenenin ve alnın yerini söyler (oyundaki karakter profilden, portre
 * önden bakar). Koordinatlar karakter birimidir (karakter 100 birim boyunda, göz hattı sıfır); çerçeve onları kendi
 * ölçeğine çevirir. Sırt parçalarının oyun ve portre çizimi ayrıdır (gövdenin yeri farklı).
 * Fırça: mürekkep hat, düz renk, tek kademe gölge, ışık sol üstten (`blob`, `stroke`). Saate bağlıdır, rastgele yok.
 */
import type { AccessoryId } from './accessories'
import { INK, blob, stroke } from './heroDraw'

const TAU = Math.PI * 2

/** Başın nerede durduğu: (cx, cy) göz hattının orta çizgisi, (sx, sy) karakter biriminden çizici birimine ölçek */
export interface HeadFrame {
  cx: number
  cy: number
  sx: number
  sy: number
  /** yüz ekseni (iki gözün ortası), göz yarı aralığı ve uzak gözün dar kalma oranı (profilde ~0,5) */
  f: number
  e: number
  fw: number
  /** ağzın orta noktası ve yarı genişliği, çene hattı ve alın (şapka kenarı) hattı (b, göz hattından aşağı +) */
  mx: number
  mw: number
  mouth: number
  chin: number
  brim: number
  /** tepesi yüksek başlıkların (aşçı, kovboy) boy çarpanı: portre kadrajına sığsın diye kısalır */
  crown: number
}

/** oyundaki karakterin başı (heroDraw drawHead: hx, hy) */
export const heroHead = (hx: number, hy: number): HeadFrame => ({ cx: hx, cy: hy + 1.3, sx: 1, sy: 1, f: 9.3, e: 4.3, fw: 0.5, mx: 10.8, mw: 3.3, mouth: 8.7, chin: 12.7, brim: -13.3, crown: 1 })
/** vesikalık portrenin başı (portraitDraw koordinatı) */
export const PORTRAIT_HEAD: HeadFrame = { cx: 52.2, cy: 55.6, sx: 1.9, sy: 1.9, f: 1.15, e: 4.75, fw: 1, mx: 1, mw: 4.5, mouth: 7, chin: 13.4, brim: -12.6, crown: 0.62 }

export interface Anim {
  t: number
  moving: boolean
  /** başın arkaya ve yukarı savrulması (püskül, kurdele, ponpon izler) */
  hair: number
  lift: number
}

/** çerçeveyle çalışan küçük çizim takımı */
function kit(c: CanvasRenderingContext2D, H: HeadFrame) {
  const x = (a: number) => H.cx + a * H.sx
  const y = (b: number) => H.cy + b * H.sy
  const k = (H.sx + H.sy) / 2
  const flat = (p: number[]) => p.map((v, i) => (i % 2 ? y(v) : x(v)))
  return {
    x,
    y,
    k,
    m: (a: number, b: number) => c.moveTo(x(a), y(b)),
    l: (a: number, b: number) => c.lineTo(x(a), y(b)),
    q: (ca: number, cb: number, a: number, b: number) => c.quadraticCurveTo(x(ca), y(cb), x(a), y(b)),
    bz: (a1: number, b1: number, a2: number, b2: number, a: number, b: number) => c.bezierCurveTo(x(a1), y(b1), x(a2), y(b2), x(a), y(b)),
    ell: (a: number, b: number, ra: number, rb: number, rot = 0) => c.ellipse(x(a), y(b), ra * H.sx, rb * H.sy, rot, 0, TAU),
    st: (p: number[], w: number, color: string, ink = true) => stroke(c, flat(p), w * k, color, ink),
    fine: (a0: number, b0: number, ca: number, cb: number, a1: number, b1: number, w: number, color: string) => {
      c.beginPath()
      c.moveTo(x(a0), y(b0))
      c.quadraticCurveTo(x(ca), y(cb), x(a1), y(b1))
      c.strokeStyle = color
      c.lineWidth = w * k
      c.lineCap = 'round'
      c.stroke()
    },
    dot: (a: number, b: number, r: number, color: string) => {
      c.beginPath()
      c.arc(x(a), y(b), r * k, 0, TAU)
      c.fillStyle = color
      c.fill()
    },
  }
}

/** ışığın sol üstten geldiği düz parlama */
const GLOSS = 'rgba(255,255,255,0.75)'

function heartPath(g: ReturnType<typeof kit>, a: number, b: number, r: number) {
  g.m(a, b + r * 0.95)
  g.bz(a - r * 1.5, b + r * 0.1, a - r * 1.1, b - r * 1.0, a, b - r * 0.35)
  g.bz(a + r * 1.1, b - r * 1.0, a + r * 1.5, b + r * 0.1, a, b + r * 0.95)
}

function starPath(g: ReturnType<typeof kit>, a: number, b: number, r: number, rot: number) {
  for (let i = 0; i < 10; i++) {
    const ang = rot - Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    const px = a + Math.cos(ang) * rr
    const py = b + Math.sin(ang) * rr
    if (i === 0) g.m(px, py)
    else g.l(px, py)
  }
}

/** başa takılan, karaktere özgü parça; çizildiyse true (heroDraw / portraitDraw bilinmeyen kimlikte eskisine döner) */
export function drawHeadItem(c: CanvasRenderingContext2D, id: AccessoryId, H: HeadFrame, an: Anim): boolean {
  const g = kit(c, H)
  const sway = Math.sin(an.t * (an.moving ? 11 : 1.8) - 0.8) * (an.moving ? 1.2 : 0.5)
  const top = H.brim
  // başın orta çizgisi (şapkaların oturduğu yer): profilde yüz ekseninin gerisinde
  const mid = H.f > 4 ? -1 : 0
  switch (id) {
    case 'kelebek': {
      // kulağın üstünde saça takılı kelebek: iki çift kanat, gövde ve ince tüyler; koşarken kanat çırpar
      const flap = 1 + Math.sin(an.t * (an.moving ? 15 : 3.2)) * (an.moving ? 0.18 : 0.07)
      const ax = H.f > 4 ? -5.5 : -8.5
      const ay = top + 4.4
      const ang = H.f > 4 ? -0.5 : -0.35
      const rot = (a: number, b: number): [number, number] => [ax + Math.cos(ang) * a - Math.sin(ang) * b, ay + Math.sin(ang) * a + Math.cos(ang) * b]
      for (const side of [-1, 1]) {
        // alt kanat (küçük), üst kanat (büyük)
        const lo = rot(side * 2.8 * flap, 2.4)
        const up = rot(side * 3.4 * flap, -2.4)
        blob(c, () => g.ell(lo[0], lo[1], 2.6 * flap, 2.3, side * 0.5), '#f08ac0', { color: '#c4559a', dx: -0.8, dy: -0.6 })
        blob(c, () => g.ell(up[0], up[1], 3.6 * flap, 3.0, side * -0.5), '#ff9ccf', { color: '#d85fa8', dx: -1, dy: -0.8 })
        g.dot(up[0] + side * 0.6, up[1] - 0.4, 0.8, '#fff6fa')
      }
      const b0 = rot(0, -4.4)
      const b1 = rot(0, 4)
      g.st([b0[0], b0[1], b1[0], b1[1]], 1.3, '#4a2a52')
      const t0 = rot(-0.6, -4.2)
      const t1 = rot(0.6, -4.2)
      g.fine(t0[0], t0[1], t0[0] - 1.2, t0[1] - 2.4, t0[0] - 2.2, t0[1] - 2.8, 0.6, INK)
      g.fine(t1[0], t1[1], t1[0] + 1.2, t1[1] - 2.4, t1[0] + 2.2, t1[1] - 2.8, 0.6, INK)
      return true
    }
    case 'fiyonk': {
      // başın tepesinde puantiyeli fiyonk: iki kulak, düğüm, iki kurdele ucu (savrulur)
      const bx = mid + (H.f > 4 ? 1 : 0)
      const by = top - 1.6
      const lift = -an.lift * 0.8
      const loop = (s: number) => {
        g.m(bx, by)
        g.bz(bx + s * 3, by - 7.4 + lift, bx + s * 11.6, by - 6.6 + lift, bx + s * 11, by + 0.4)
        g.bz(bx + s * 10.4, by + 6, bx + s * 3.6, by + 3.6, bx, by)
      }
      const tail = (s: number) => {
        g.m(bx, by)
        g.q(bx + s * 3 + sway * 0.3, by + 5, bx + s * (6.4 + an.hair), by + 9.4 - an.hair * 2)
        g.l(bx + s * (3.4 + an.hair), by + 10.4 - an.hair * 2)
        g.q(bx + s * 0.8, by + 6, bx, by)
      }
      blob(c, () => tail(-1), '#d83a5a', { color: '#a82444', dx: -1, dy: -0.6 })
      blob(c, () => tail(1), '#d83a5a', { color: '#a82444', dx: -1, dy: -0.6 })
      blob(c, () => loop(-1), '#ec4a68', { color: '#b82a4c', dx: -1.8, dy: -0.8 })
      blob(c, () => loop(1), '#ec4a68', { color: '#b82a4c', dx: -1.8, dy: -0.8 })
      for (const [dx, dy] of [[-7, -2.6], [-4.4, 0.4], [7, -3], [5, 1]]) g.dot(bx + dx, by + dy, 0.95, '#fff4f2')
      blob(c, () => g.ell(bx, by, 2.2, 2.4), '#d83a5a', { color: '#a82444', dx: -0.8, dy: -0.6 })
      g.fine(bx - 1.1, by - 1.4, bx - 0.4, by - 1.8, bx + 0.4, by - 1.6, 0.6, GLOSS)
      return true
    }
    case 'tac': {
      // altın taç: alnın üstünde kıvrık bant, üç sivri uç, ortada pembe taş, yanlarda mavi taş
      const cx = mid
      const base = top + 1.6
      const tip = (a: number, h: number) => base - h + Math.abs(a - cx) * 0.06
      const w = H.f > 4 ? 10.6 : 10.8
      blob(
        c,
        () => {
          g.m(cx - w, base + 2.6)
          g.l(cx - w, tip(cx - w, 5))
          g.l(cx - w * 0.62, base - 1.2)
          g.l(cx - w * 0.34, tip(cx - w * 0.34, 8.4))
          g.l(cx, base - 2.4)
          g.l(cx + w * 0.34, tip(cx + w * 0.34, 8.4))
          g.l(cx + w * 0.62, base - 1.2)
          g.l(cx + w, tip(cx + w, 5))
          g.l(cx + w, base + 2.6)
          g.q(cx, base + 4.6, cx - w, base + 2.6)
        },
        '#f4c64e',
        { color: '#c48a28', dx: -2, dy: -1 },
      )
      g.fine(cx - w + 1, base + 1.2, cx, base + 3.2, cx + w - 1, base + 1.2, 0.8, '#c48a28')
      g.fine(cx - w + 0.6, base + 0.2, cx - w + 0.8, tip(cx - w, 5) + 2, cx - w * 0.64, base - 1.8, 0.9, 'rgba(255,248,200,0.8)')
      blob(c, () => g.ell(cx, base + 0.2, 1.7, 1.9), '#ff6f9a', { color: '#c63c6a', dx: -0.6, dy: -0.5 })
      g.dot(cx - 0.5, base - 0.4, 0.45, GLOSS)
      for (const s of [-1, 1]) blob(c, () => g.ell(cx + s * w * 0.62, base + 1, 1.1, 1.2), '#5ab8ff', { color: '#2a7acb', dx: -0.4, dy: -0.4 })
      for (const s of [-1, 1]) g.dot(cx + s * w * 0.34, tip(cx + s * w * 0.34, 8.4) - 0.4, 0.8, '#fff4c2')
      return true
    }
    case 'bandana': {
      // kırmızı bandana: kafatasını sarar, alnı kesen kenar, enseden düğüm ve iki ucu savrulur; beyaz benekli
      const left = H.f > 4 ? -11.5 : -11.4
      const right = H.f > 4 ? 16.4 : 11.4
      const tailX = left - 1
      const wave = sway * 0.5 + an.hair * 2.5
      // düğüm uçları (arkada)
      blob(
        c,
        () => {
          g.m(tailX + 1, top + 5)
          g.q(tailX - 3 - wave, top + 8, tailX - 7 - wave * 1.4, top + 12 - an.lift * 2)
          g.l(tailX - 3.4 - wave * 1.4, top + 13.4 - an.lift * 2)
          g.q(tailX - 1, top + 9, tailX + 1, top + 5)
        },
        '#d63a3a',
        { color: '#9c2430', dx: -1, dy: -0.6 },
      )
      blob(
        c,
        () => {
          g.m(tailX + 1, top + 5)
          g.q(tailX - 2 - wave * 0.6, top + 5, tailX - 8 - wave, top + 5.4 - an.lift * 2)
          g.l(tailX - 7 - wave, top + 8 - an.lift * 2)
          g.q(tailX - 1, top + 7.6, tailX + 1, top + 5)
        },
        '#e04646',
        { color: '#9c2430', dx: -1, dy: -0.6 },
      )
      blob(
        c,
        () => {
          g.m(left, top + 6.4)
          g.bz(left - 0.6, top - 8, right - 8, top - 10.4, right, top + 1.2)
          g.q(right - 2, top + 3.2, right - 5, top + 3)
          g.q((left + right) / 2, top + 6.4, left, top + 6.4)
        },
        '#d63a3a',
        { color: '#9c2430', dx: -3, dy: -1.4 },
      )
      // alın bandı kenarı, kumaş kıvrımı, benekler, düğüm
      g.fine(left + 0.4, top + 4.8, (left + right) / 2, top + 4.6, right - 3, top + 1.6, 0.9, '#9c2430')
      g.fine(left + 2.4, top + 1, left + 4, top - 5.6, left + 9, top - 8, 1.6, 'rgba(255,190,170,0.6)')
      for (const [a, b] of [[left + 5, top + 0.4], [left + 9.4, top - 3], [(left + right) / 2 + 2, top - 1.4], [right - 5.4, top + 0.2], [left + 3.4, top + 3.4]]) g.dot(a, b, 0.7, '#fff2e0')
      blob(c, () => g.ell(tailX + 1, top + 5, 1.6, 1.8), '#e04646', { color: '#9c2430', dx: -0.6, dy: -0.4 })
      return true
    }
    case 'kovboy': {
      // kovboy şapkası: geniş, uçları yukarı kıvrık kenar; ortası çukur tepe; deri kordon ve tokası
      const col = '#b27a3e'
      const dark = '#7c4e24'
      const lite = '#d9a566'
      const cx = H.f > 4 ? 1.2 : 0
      const by = top + 1.4
      blob(
        c,
        () => {
          g.m(cx - 22, by - 2.6)
          g.bz(cx - 15, by + 4.4, cx + 12, by + 5.4, cx + 23, by - 3)
          g.bz(cx + 17, by - 0.4, cx + 8, by - 3.6, cx, by - 3.6)
          g.bz(cx - 8, by - 3.6, cx - 15, by - 0.6, cx - 22, by - 2.6)
        },
        col,
        { color: dark, dx: 0, dy: 1.8 },
      )
      blob(
        c,
        () => {
          g.m(cx - 10.6, by - 2.4)
          g.bz(cx - 11.6, by - 11, cx - 9, by - 17, cx - 5, by - 17.6)
          g.q(cx - 2, by - 14.2, cx + 1, by - 15.8)
          g.q(cx + 4, by - 17.6, cx + 6.4, by - 16.6)
          g.bz(cx + 10.2, by - 14, cx + 11.6, by - 8, cx + 11.4, by - 2.2)
          g.q(cx, by + 0.4, cx - 10.6, by - 2.4)
        },
        col,
        { color: dark, dx: -3, dy: -1 },
      )
      // kordon ve toka, çukur çizgisi, ışık
      blob(
        c,
        () => {
          g.m(cx - 10.8, by - 2.2)
          g.q(cx, by + 0.5, cx + 11.4, by - 2)
          g.l(cx + 11.2, by - 5.4)
          g.q(cx, by - 3.2, cx - 11, by - 5.6)
        },
        '#5a3a22',
        { color: '#3a2414', dx: 0, dy: 0.8 },
      )
      blob(c, () => g.ell(cx + 1.5, by - 3.2, 1.9, 1.7), '#f0c050', { color: '#b8862a', dx: -0.6, dy: -0.5 })
      g.fine(cx - 4.6, by - 17, cx - 2, by - 13.2, cx + 1, by - 15.6, 0.8, dark)
      g.fine(cx - 9, by - 5.6, cx - 9.4, by - 11, cx - 7, by - 15.2, 1.4, lite)
      g.fine(cx - 19, by - 1.6, cx - 12, by + 1.6, cx - 4, by + 2.2, 1, lite)
      return true
    }
    case 'asci': {
      // aşçı başlığı: sıkı bant, üstünde üç kabarık beyaz tepe, kıvrımlar
      const cx = 0
      const by = top + 1.8
      const u = (n: number) => by - n * H.crown
      const band = () => {
        g.m(cx - 11.6, by + 1.4)
        g.q(cx, by - 1.8, cx + 12.4, by - 0.2)
        g.l(cx + 12, by - 5.6)
        g.q(cx, by - 8, cx - 11.8, by - 5.4)
      }
      blob(
        c,
        () => {
          g.m(cx - 11, by - 5.6)
          g.bz(cx - 22, u(8), cx - 18, u(22), cx - 7, u(21))
          g.bz(cx - 6, u(30), cx + 8, u(30), cx + 9, u(21.4))
          g.bz(cx + 20, u(22), cx + 22, u(8), cx + 12, by - 5.2)
          g.q(cx, by - 8, cx - 11, by - 5.6)
        },
        '#fbf7ee',
        { color: '#d6cfbe', dx: -3, dy: -1.4 },
      )
      g.fine(cx - 7, u(21), cx - 8.6, u(13), cx - 7.4, by - 7.6, 0.9, '#d6cfbe')
      g.fine(cx + 9, u(21.4), cx + 9.4, u(14), cx + 8, by - 7.4, 0.9, '#d6cfbe')
      g.fine(cx - 14, u(11), cx - 13, u(17), cx - 9.4, u(19.6), 1.6, '#fff')
      blob(c, band, '#f2ece0', { color: '#cfc8ba', dx: 0, dy: 1.4 })
      return true
    }
  }
  return false
}

/** yüze takılan, karaktere özgü parça */
export function drawFaceItem(c: CanvasRenderingContext2D, id: AccessoryId, H: HeadFrame, an: Anim): boolean {
  const g = kit(c, H)
  const near = H.f - H.e
  const far = H.f + H.e
  const farR = (r: number) => r * H.fw
  switch (id) {
    case 'kedi': {
      // kedi gözlüğü: dış üst köşeleri kanatlı, bordo çerçeve; camda ışık
      const col = '#a82a5e'
      // dir: dış köşenin yönü (yakın camda kulağa, uzak camda yüzün kenarına)
      const lens = (a: number, r: number, wing: number, dir: number) => {
        g.m(a - dir * r, -3.4)
        g.bz(a - dir * r * 0.2, -5.6, a + dir * r * 0.8, -5.4, a + dir * (r + wing), -7)
        g.bz(a + dir * (r + 0.6), -3.4, a + dir * r * 1.1, 3.6, a + dir * r * 0.2, 4.8)
        g.bz(a - dir * r * 0.6, 5.2, a - dir * r * 1.1, 2.4, a - dir * r, -3.4)
      }
      const r1 = 4.2
      const r2 = farR(4.2) + 0.5
      // köprü ve sap
      g.st([near + r1 * 0.8, -2.2, (near + far) / 2, -3.2, far - r2 * 0.8, -2.2], 0.9, col)
      g.st([near - r1 - 1.4, -5, near - r1 - 7.6, -3.4], 0.9, col)
      for (const [a, r, wing, dir] of [[near, r1, 1.8, -1], [far, r2, 1.2, 1]] as const) {
        c.beginPath()
        lens(a, r, wing, dir)
        c.closePath()
        c.fillStyle = 'rgba(210,230,255,0.22)'
        c.fill()
        c.strokeStyle = INK
        c.lineWidth = 2.5 * g.k
        c.lineJoin = 'round'
        c.stroke()
        c.strokeStyle = col
        c.lineWidth = 1.2 * g.k
        c.stroke()
      }
      g.fine(near - 2.6, 0.4, near - 2, -2.4, near, -3.2, 0.9, GLOSS)
      g.dot(near - r1 - 1.4, -6.4, 0.6, '#f4c64e')
      return true
    }
    case 'kalpli': {
      // kalp camlı güneş gözlüğü: pembe kalpler, ince çerçeve; camda tek parıltı
      const r1 = 4.4
      const r2 = farR(4.4) + 0.5
      g.st([near + r1 * 0.9, -1.4, (near + far) / 2, -2.6, far - r2 * 0.9, -1.6], 0.9, '#e0408a')
      g.st([near - r1 * 1.2, -1.6, near - r1 - 6.8, -2.4], 0.9, '#e0408a')
      blob(c, () => heartPath(g, near, 0.4, r1), '#ff5fa2', { color: '#c7357a', dx: -1.2, dy: -0.8 })
      blob(c, () => heartPath(g, far, 0.4, r2), '#ff5fa2', { color: '#c7357a', dx: -1.2, dy: -0.8 })
      g.fine(near - 2.4, -0.4, near - 1.6, -2.2, near - 0.2, -2.4, 1, GLOSS)
      return true
    }
    case 'pul': {
      // yanağa yapıştırılmış altın yıldız pulu ve iki küçük pembe nokta
      const a = H.fw < 1 ? near + 0.8 : near - 2.6
      const b = H.fw < 1 ? 7 : 6.4
      blob(c, () => starPath(g, a, b, 2.9, 0.2), '#ffd84a', { color: '#d9a020', dx: -0.8, dy: -0.6 })
      g.dot(a - 0.6, b - 0.8, 0.5, GLOSS)
      g.dot(a + 4.6, b + 1.2, 0.7, '#ff7aa8')
      g.dot(a - 4.2, b + 1.4, 0.55, '#ff7aa8')
      return true
    }
    case 'tek': {
      // tek gözlük: yakın gözde altın halka, camda ışık, çenenin yanına inen ince zincir
      const a = near
      const r = 4.9
      c.beginPath()
      g.ell(a, 0.9, r, r)
      c.fillStyle = 'rgba(210,230,255,0.24)'
      c.fill()
      c.beginPath()
      g.ell(a, 0.9, r, r)
      c.strokeStyle = INK
      c.lineWidth = 2.6 * g.k
      c.stroke()
      c.strokeStyle = '#e0b040'
      c.lineWidth = 1.2 * g.k
      c.stroke()
      g.fine(a - 2.6, 0.2, a - 2.2, -2.4, a - 0.4, -2.8, 1, GLOSS)
      // zincir: halkanın altından çeneye sarkar
      c.setLineDash([1.1 * g.k, 0.9 * g.k])
      g.fine(a - 0.4, 0.9 + r, a - 4.4 - an.hair, 9, a - 3.4 - an.hair, H.chin + 3, 0.8, '#e0b040')
      c.setLineDash([])
      return true
    }
    case 'pilot': {
      // pilot gözlüğü: damla camlar, ince altın çerçeve, üstte çift köprü; camda turuncudan yeşile geçiş
      const glass = (a: number, r: number) => {
        g.m(a - r, -3)
        g.bz(a - r * 0.4, -4.2, a + r * 0.8, -4.2, a + r, -3)
        g.bz(a + r * 1.05, 1.6, a + r * 0.4, 5.6, a - r * 0.1, 5.6)
        g.bz(a - r * 0.8, 5.6, a - r * 1.15, 1.6, a - r, -3)
      }
      const r1 = 4.5
      const r2 = farR(4.5) + 0.5
      g.st([near + r1, -2.6, (near + far) / 2, -3.6, far - r2, -2.8], 0.8, '#d0a038')
      g.st([near - r1 + 0.4, -3, near - r1 - 6.4, -2.6], 0.9, '#d0a038')
      for (const [a, r] of [[near, r1], [far, r2]] as const) {
        c.save()
        c.beginPath()
        glass(a, r)
        c.closePath()
        const gr = c.createLinearGradient(g.x(a), g.y(-4.2), g.x(a), g.y(5.6))
        gr.addColorStop(0, '#3a3a52')
        gr.addColorStop(1, '#8a9a6a')
        c.fillStyle = gr
        c.fill()
        c.strokeStyle = INK
        c.lineWidth = 2.6 * g.k
        c.lineJoin = 'round'
        c.stroke()
        c.strokeStyle = '#d0a038'
        c.lineWidth = 1.1 * g.k
        c.stroke()
        c.restore()
      }
      g.fine(near - 3.2, -2.6, near - 2.4, -0.2, near - 0.4, 0.8, 1.2, 'rgba(255,255,255,0.55)')
      return true
    }
    case 'bant': {
      // göz bandı: yakın gözü örten siyah yama, alından geçen ve ensede bağlanan ince kayış
      const a = near
      g.st([a - 0.2, -5.2, (a + far) / 2, -8.4, far + H.e * 0.6, -6.6], 0.7, '#2a2230', false)
      g.st([a - 4, -3.6, a - 9.4, -8.6, a - 13.6, -7.4], 0.8, '#2a2230', false)
      blob(
        c,
        () => {
          g.m(a - 4.6, -1.6)
          g.bz(a - 4.6, -5, a + 4.4, -6, a + 5, -2.4)
          g.bz(a + 5.4, 2.4, a + 2, 5.4, a - 1.4, 5.4)
          g.bz(a - 4.2, 5.4, a - 5, 2, a - 4.6, -1.6)
        },
        '#2a2530',
        { color: '#16121a', dx: -1.4, dy: -1 },
      )
      g.fine(a - 3.4, 0.6, a - 3.2, -3, a - 0.8, -4, 1, 'rgba(255,255,255,0.28)')
      return true
    }
  }
  return false
}

/** oyundaki karakterin sırt parçası: gövdeden önce çizilir (heroDraw: tx, ty gövde, sw sallanma) */
export function drawHeroBack(c: CanvasRenderingContext2D, id: AccessoryId, tx: number, ty: number, t: number, sw: number, flow: number, lift: number): boolean {
  switch (id) {
    case 'sirtcanta': {
      c.save()
      c.translate(tx - 9, ty - 25)
      c.rotate(sw * 0.025)
      const body = () => {
        c.moveTo(1.5, 1)
        c.lineTo(-9, 0.4)
        c.quadraticCurveTo(-15, 0.6, -15, 6)
        c.lineTo(-14.6, 20)
        c.quadraticCurveTo(-14.4, 24, -10, 24)
        c.lineTo(1.5, 23.6)
      }
      blob(c, body, '#e8802e', { color: '#a8501c', dx: -3, dy: -0.4 })
      // kapak, fermuarlı cep, tutma kulpu
      c.beginPath()
      c.moveTo(1.5, 8.2)
      c.quadraticCurveTo(-8, 10.4, -14.8, 7.4)
      c.strokeStyle = '#a8501c'
      c.lineWidth = 1
      c.stroke()
      blob(c, () => c.roundRect(-12.4, 13, 9.6, 8.4, 1.6), '#f09a50', { color: '#c0642a', dx: -1.4, dy: 0 })
      stroke(c, [-11.4, 15.4, -4.4, 15.4], 0.7, '#7a3a14', false)
      stroke(c, [-9.4, 0.4, -9.4, -2.4, -4.6, -2.4, -4.6, 0.6], 1.1, '#7a3a14')
      c.beginPath()
      c.moveTo(-14, 3)
      c.quadraticCurveTo(-14.4, 10, -13.8, 18)
      c.strokeStyle = 'rgba(255,215,170,0.55)'
      c.lineWidth = 1.2
      c.lineCap = 'round'
      c.stroke()
      c.restore()
      return true
    }
    case 'okluk': {
      c.save()
      c.translate(tx - 8, ty - 7)
      c.rotate(-0.42 + sw * 0.02)
      // oklar: tüyleri omuzun arkasından görünür
      const arrows: [number, string][] = [[-2.2, '#d8403a'], [0.2, '#f4ead2'], [2.6, '#d8403a']]
      for (const [x, col] of arrows) {
        stroke(c, [x, -3, x * 1.3, -32], 0.9, '#9a7448')
        blob(c, () => c.ellipse(x * 1.35, -32.4, 1.5, 3.4, 0, 0, TAU), col, { color: col === '#f4ead2' ? '#cdbd9a' : '#a42a2a', dx: -0.5, dy: 0 })
      }
      blob(
        c,
        () => {
          c.moveTo(-4.4, -20)
          c.lineTo(4.6, -20)
          c.lineTo(5.4, 14)
          c.quadraticCurveTo(0, 16.4, -5.4, 14)
        },
        '#8a5a2e',
        { color: '#5e3a1c', dx: -2, dy: 0 },
      )
      stroke(c, [-4.8, -17, 4.8, -17], 1.2, '#c8a060')
      stroke(c, [-5, 9, 5.2, 9], 1.2, '#c8a060')
      stroke(c, [-3, -14, -3.4, 8], 0.8, 'rgba(255,215,170,0.5)', false)
      c.restore()
      return true
    }
    case 'kalkan': {
      c.save()
      c.translate(tx - 11, ty - 14)
      c.rotate(sw * 0.02)
      const R = 12.4
      blob(c, () => c.arc(0, 0, R, 0, TAU), '#b9c2d0', { color: '#7f8aa0', dx: -3.4, dy: -1.6 })
      c.beginPath()
      c.arc(0, 0, R - 2.6, 0, TAU)
      c.strokeStyle = '#d8b04a'
      c.lineWidth = 1.2
      c.stroke()
      for (let i = 0; i < 4; i++) {
        const a = (i * TAU) / 4 + 0.4
        stroke(c, [Math.cos(a) * 3.4, Math.sin(a) * 3.4, Math.cos(a) * (R - 2.8), Math.sin(a) * (R - 2.8)], 0.8, '#7f8aa0', false)
      }
      blob(c, () => c.arc(0, 0, 3.6, 0, TAU), '#e0b84e', { color: '#b0832a', dx: -1.2, dy: -1 })
      c.beginPath()
      c.arc(-1.2, -1.2, 0.9, 0, TAU)
      c.fillStyle = GLOSS
      c.fill()
      c.restore()
      return true
    }
    case 'sepet': {
      c.save()
      c.translate(tx - 9, ty - 14)
      c.rotate(sw * 0.04)
      // çiçekler: sepetin ağzından taşar
      const fl: [number, number, string][] = [[-10.4, -3.4, '#ff7aa8'], [-6, -5.8, '#f4c64e'], [-1.6, -3.2, '#ffffff']]
      for (const [x, y, col] of fl) {
        stroke(c, [x, 1, x, y + 1.4], 0.9, '#4f8f3a', false)
        for (let i = 0; i < 5; i++) {
          const a = (i * TAU) / 5 + x
          c.beginPath()
          c.ellipse(x + Math.cos(a) * 1.7, y + Math.sin(a) * 1.7, 1.5, 1.3, a, 0, TAU)
          c.fillStyle = col
          c.fill()
        }
        c.beginPath()
        c.arc(x, y, 1, 0, TAU)
        c.fillStyle = col === '#f4c64e' ? '#d86a2a' : '#f2b33a'
        c.fill()
      }
      const basket = () => {
        c.moveTo(1.5, 0)
        c.lineTo(-13, 0.4)
        c.lineTo(-11.6, 15.4)
        c.quadraticCurveTo(-8, 18, 0.6, 16.4)
      }
      blob(c, basket, '#d8a652', { color: '#a87830', dx: -2.6, dy: 0 })
      c.save()
      c.beginPath()
      c.moveTo(1.5, 0)
      c.lineTo(-13, 0.4)
      c.lineTo(-11.6, 15.4)
      c.quadraticCurveTo(-8, 18, 0.6, 16.4)
      c.closePath()
      c.clip()
      c.beginPath()
      for (let i = 0; i < 5; i++) {
        c.moveTo(-13, 3 + i * 3.2)
        c.lineTo(2, 3 + i * 3.2)
      }
      for (let i = 0; i < 6; i++) {
        c.moveTo(-11 + i * 2.8, 0)
        c.lineTo(-11 + i * 2.8, 18)
      }
      c.strokeStyle = '#a87830'
      c.lineWidth = 0.7
      c.stroke()
      c.restore()
      c.restore()
      return true
    }
    case 'sal': {
      // kilim şal: omuzlardan beline inen geniş kumaş; koşarken hafif savrulur; ucu saçaklı
      const f = Math.max(0, Math.min(1.4, flow))
      const w = Math.sin(t * 11) * f * 1.4
      const sx = tx - 8
      const sy = ty - 25
      const lx = sx - 9 - f * 4 - lift * 2
      const ly = sy + 20 - f * 4
      blob(
        c,
        () => {
          c.moveTo(tx + 2, sy + 0.4)
          c.quadraticCurveTo(tx - 5, sy - 2, sx, sy - 0.6)
          c.quadraticCurveTo(sx - 4, sy + 6, lx + 1, ly - 4 + w)
          c.lineTo(lx, ly + w)
          c.quadraticCurveTo(sx + 1, ly + 3 + w * 0.5, tx + 3.4, ty - 5)
        },
        '#c8486e',
        { color: '#8c2c4e', dx: -2.6, dy: -0.6 },
      )
      // kilim bandı ve saçak
      stroke(c, [lx + 1.4, ly - 5.6 + w, sx + 3, ly - 2.4 + w * 0.5, tx + 3, ty - 9], 2, '#f2c45a', false)
      stroke(c, [lx + 1.6, ly - 4.6 + w, sx + 3, ly - 1.2 + w * 0.5, tx + 3, ty - 8], 0.7, '#2c4a7a', false)
      for (let i = 0; i < 4; i++) stroke(c, [lx + i * 3.2, ly + w, lx + i * 3.2 - 0.6, ly + 3.4 + w], 0.8, '#f4e6c8', false)
      return true
    }
    case 'ayi': {
      // ayıcık çanta: sırtta yuvarlak peluş, iki kulağı omzun arkasından görünür
      c.save()
      c.translate(tx - 9, ty - 24)
      c.rotate(sw * 0.03)
      const fur = '#b57a42'
      const shade = '#7e4c24'
      for (const ex of [-12.4, -3.8]) {
        blob(c, () => c.arc(ex, -0.4, 3.6, 0, TAU), fur, { color: shade, dx: -1.2, dy: -0.8 })
        c.beginPath()
        c.arc(ex + 0.3, 0.2, 1.7, 0, TAU)
        c.fillStyle = '#f0a8a0'
        c.fill()
      }
      blob(
        c,
        () => {
          c.moveTo(1.5, 2)
          c.quadraticCurveTo(-8, -2.4, -15, 3)
          c.quadraticCurveTo(-17.4, 13, -14, 21)
          c.quadraticCurveTo(-8, 25.6, 1.5, 22.6)
        },
        fur,
        { color: shade, dx: -3, dy: -0.6 },
      )
      blob(c, () => c.ellipse(-12.6, 15.4, 3.2, 4.8, 0, 0, TAU), '#ecc890', { color: '#c49a5e', dx: -0.8, dy: 0 })
      stroke(c, [-13.6, 5, -14.2, 10, -13.8, 14], 1, 'rgba(255,215,170,0.5)', false)
      c.restore()
      return true
    }
  }
  return false
}

/** sırt parçalarının askısı ve öne taşan kısmı: gövdeden sonra çizilir */
export function drawHeroBackFront(c: CanvasRenderingContext2D, id: AccessoryId, tx: number, ty: number): boolean {
  switch (id) {
    case 'sirtcanta':
      stroke(c, [tx - 9, ty - 23, tx - 7.4, ty - 21, tx - 3.4, ty - 24, tx - 2, ty - 15], 2.4, '#4a3a5a')
      stroke(c, [tx - 4.4, ty - 23.6, tx - 3, ty - 20], 0.7, 'rgba(255,255,255,0.4)', false)
      return true
    case 'okluk':
      stroke(c, [tx - 9, ty - 23, tx - 6, ty - 26, tx - 2, ty - 22, tx + 8.4, ty - 6], 2.1, '#6a4428')
      return true
    case 'kalkan':
      stroke(c, [tx - 9.4, ty - 14, tx - 8.4, ty - 21.6, tx - 3.6, ty - 26.4, tx + 1, ty - 22, tx + 8.6, ty - 8], 2.1, '#6a4428')
      return true
    case 'sepet':
      stroke(c, [tx - 9.6, ty - 13, tx - 8.4, ty - 21.6, tx - 4, ty - 26.4, tx + 1, ty - 22, tx + 8.8, ty - 7], 1.9, '#c89a4a')
      return true
    case 'sal':
      // omuzdan göğse düşen şal ucu: kilim bantlı, saçaklı
      stroke(c, [tx - 7.6, ty - 25.2, tx - 3, ty - 27.2, tx + 4, ty - 25.4], 3.2, '#c8486e')
      stroke(c, [tx - 6, ty - 25.8, tx - 2, ty - 27.4, tx + 3, ty - 26], 0.8, '#f2c45a', false)
      stroke(c, [tx - 4.6, ty - 24.6, tx - 5, ty - 15, tx - 4.4, ty - 7], 4.2, '#c8486e')
      stroke(c, [tx - 4.8, ty - 15, tx - 4.8, ty - 13], 1.3, '#f2c45a', false)
      stroke(c, [tx - 4.7, ty - 11.6, tx - 4.6, ty - 10], 1.3, '#2c4a7a', false)
      for (let i = 0; i < 3; i++) stroke(c, [tx - 6 + i * 1.5, ty - 6.2, tx - 6.1 + i * 1.5, ty - 3.4], 0.7, '#f4e6c8', false)
      return true
    case 'ayi':
      stroke(c, [tx - 9.6, ty - 20, tx - 8, ty - 21.8, tx - 3.6, ty - 26, tx + 1, ty - 22, tx + 9, ty - 7], 2, '#7e4c24')
      return true
  }
  return false
}

/* ───────── portre: gövdenin arkasında görünen parçalar (portraitDraw koordinatı, 100 genişlik) ───────── */

/** portrede sırt parçası: omuzlardan önce çizilir, saç ve baş onun üstündedir */
export function drawPortraitBack(c: CanvasRenderingContext2D, id: AccessoryId): boolean {
  switch (id) {
    case 'sirtcanta': {
      const bag = () => {
        c.moveTo(-3, 124)
        c.lineTo(-2, 84)
        c.quadraticCurveTo(-1.6, 76, 8, 75.6)
        c.lineTo(22, 76)
        c.quadraticCurveTo(30, 76.6, 30, 86)
        c.lineTo(29, 124)
      }
      blob(c, bag, '#e8802e', { color: '#a8501c', dx: -3.6, dy: -1.4 })
      stroke(c, [10, 76, 10, 71.4, 21, 71.4, 21, 76.4], 2.2, '#7a3a14')
      stroke(c, [-1, 87, 14, 90, 29, 87.4], 1.2, '#a8501c', false)
      stroke(c, [0, 80, 0.6, 86, 0.2, 98], 1.4, 'rgba(255,215,170,0.55)', false)
      return true
    }
    case 'okluk': {
      c.save()
      c.translate(22, 118)
      c.rotate(-0.32)
      const arrows: [number, string][] = [[-4, '#d8403a'], [0.4, '#f4ead2'], [4.6, '#d8403a']]
      for (const [x, col] of arrows) {
        stroke(c, [x, -30, x * 1.2, -84], 1.4, '#9a7448')
        blob(c, () => c.ellipse(x * 1.25, -85, 2.6, 6.4, 0, 0, TAU), col, { color: col === '#f4ead2' ? '#cdbd9a' : '#a42a2a', dx: -1, dy: 0 })
      }
      blob(
        c,
        () => {
          c.moveTo(-8, -50)
          c.lineTo(9, -50)
          c.lineTo(10.4, 12)
          c.quadraticCurveTo(0, 16, -10.4, 12)
        },
        '#8a5a2e',
        { color: '#5e3a1c', dx: -3, dy: 0 },
      )
      stroke(c, [-8.6, -44, 9.6, -44], 1.8, '#c8a060')
      stroke(c, [-9.6, 2, 10.6, 2], 1.8, '#c8a060')
      c.restore()
      return true
    }
    case 'kalkan': {
      blob(c, () => c.arc(6, 106, 30, 0, TAU), '#b9c2d0', { color: '#7f8aa0', dx: -4, dy: -2 })
      c.beginPath()
      c.arc(6, 106, 24, 0, TAU)
      c.strokeStyle = '#d8b04a'
      c.lineWidth = 1.8
      c.stroke()
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 + 0.3
        stroke(c, [6 + Math.cos(a) * 9, 106 + Math.sin(a) * 9, 6 + Math.cos(a) * 23, 106 + Math.sin(a) * 23], 1, '#7f8aa0', false)
      }
      blob(c, () => c.arc(6, 106, 9, 0, TAU), '#e0b84e', { color: '#b0832a', dx: -2.4, dy: -1.8 })
      return true
    }
    case 'sepet': {
      const fl: [number, number, string][] = [[2, 80, '#ff7aa8'], [13, 74, '#f4c64e'], [24, 80, '#ffffff']]
      for (const [x, y, col] of fl) {
        stroke(c, [x, 96, x, y + 3], 1.2, '#4f8f3a', false)
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6 + x
          c.beginPath()
          c.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.4, 2.8, a, 0, TAU)
          c.fillStyle = col
          c.fill()
          c.strokeStyle = 'rgba(80,40,40,0.35)'
          c.lineWidth = 0.7
          c.stroke()
        }
        c.beginPath()
        c.arc(x, y, 2.4, 0, TAU)
        c.fillStyle = col === '#f4c64e' ? '#d86a2a' : '#f2b33a'
        c.fill()
      }
      const basket = () => {
        c.moveTo(-2, 124)
        c.lineTo(-1, 92)
        c.lineTo(29, 92)
        c.lineTo(28, 124)
      }
      blob(c, basket, '#d8a652', { color: '#a87830', dx: -3.4, dy: -1.4 })
      c.save()
      c.beginPath()
      basket()
      c.closePath()
      c.clip()
      c.beginPath()
      for (let y = 96; y < 126; y += 5) {
        c.moveTo(-3, y)
        c.lineTo(30, y)
      }
      for (let x = 1; x < 30; x += 5) {
        c.moveTo(x, 92)
        c.lineTo(x, 126)
      }
      c.strokeStyle = '#a87830'
      c.lineWidth = 1.1
      c.stroke()
      c.restore()
      return true
    }
    case 'sal': {
      blob(
        c,
        () => {
          c.moveTo(30, 82)
          c.quadraticCurveTo(52, 70, 74, 82)
          c.quadraticCurveTo(84, 100, 88, 124)
          c.lineTo(14, 124)
          c.quadraticCurveTo(18, 100, 30, 82)
        },
        '#c8486e',
        { color: '#8c2c4e', dx: -4, dy: -1.4 },
      )
      stroke(c, [18, 116, 52, 108, 84, 116], 3.4, '#f2c45a', false)
      stroke(c, [18, 116, 52, 108, 84, 116], 1.2, '#2c4a7a', false)
      return true
    }
    case 'ayi': {
      const fur = '#b57a42'
      const shade = '#7e4c24'
      for (const ex of [4, 25]) {
        blob(c, () => c.arc(ex, 76, 8, 0, TAU), fur, { color: shade, dx: -2.4, dy: -1.6 })
        c.beginPath()
        c.arc(ex + 0.6, 77, 4, 0, TAU)
        c.fillStyle = '#f0a8a0'
        c.fill()
      }
      blob(
        c,
        () => {
          c.moveTo(-3, 124)
          c.lineTo(-2, 90)
          c.quadraticCurveTo(-2, 74, 14, 74)
          c.quadraticCurveTo(30, 74, 30, 90)
          c.lineTo(29, 124)
        },
        fur,
        { color: shade, dx: -3.6, dy: -1.4 },
      )
      blob(c, () => c.ellipse(2, 108, 8, 12, 0, 0, TAU), '#ecc890', { color: '#c49a5e', dx: -2, dy: -1 })
      return true
    }
  }
  return false
}

/** portrede omuzların üstüne binen kısım (askı ve öne düşen uçlar) */
export function drawPortraitBackFront(c: CanvasRenderingContext2D, id: AccessoryId): boolean {
  switch (id) {
    case 'sirtcanta':
      stroke(c, [21, 92, 27, 89.6, 32, 95, 37, 124], 3.6, '#4a3a5a')
      stroke(c, [81, 92, 75, 89.6, 70, 95, 65, 124], 3.6, '#4a3a5a')
      return true
    case 'okluk':
      stroke(c, [22, 90, 40, 102, 66, 124], 3.4, '#6a4428')
      return true
    case 'kalkan':
      stroke(c, [21, 92.4, 27, 90.2, 32, 95, 37, 124], 3.6, '#6a4428')
      return true
    case 'sepet':
      stroke(c, [21, 92.4, 27, 90.2, 32, 95, 37, 124], 3.2, '#c89a4a')
      return true
    case 'ayi':
      stroke(c, [21, 92.4, 27, 90.2, 32, 95, 37, 124], 3.6, '#7e4c24')
      stroke(c, [81, 92.4, 75, 90.2, 70, 95, 65, 124], 3.6, '#7e4c24')
      return true
    case 'sal':
      stroke(c, [32, 90, 35, 104, 36, 124], 6, '#c8486e')
      stroke(c, [72, 90, 69, 104, 68, 124], 6, '#c8486e')
      stroke(c, [34, 100, 35.4, 112, 35.6, 124], 1.4, '#f2c45a', false)
      stroke(c, [70, 100, 68.6, 112, 68.4, 124], 1.4, '#f2c45a', false)
      return true
  }
  return false
}
