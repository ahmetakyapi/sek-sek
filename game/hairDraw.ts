/**
 * Saç parçaları (Mağaza: saç stili): arka saç (at kuyruğu, örgü, küt kesim, iki yandan örgü) başın arkasında, topuz başın
 * üstünde durur. İki yandan örgü portrede (önden) omuzların önüne düşer: orada `drawHairTop` çizer.
 * Parçalar `HeadFrame` ile yazılır (accessoryDraw.ts): tek yazım hem oyundaki karakteri (profil) hem portreyi (önden) çizer.
 * Uzun saçın (`long`) ve ön saç biçimlerinin çizimi heroDraw.ts / portraitDraw.ts'te kalır (kendi başlarına eski kodlar).
 * Saate bağlıdır (savrulma `hair`, `lift`, `t`); kare başına rastgelelik ve filtre yok.
 */
import { kit, type Anim, type HeadFrame } from './accessoryDraw'
import { blob } from './heroDraw'
import type { Back } from './looks'

export interface HairTones {
  hair: string
  hairS: string
  hairL: string
}

const band = '#e0566a'

/** başın arkasında duran saç; çizildiyse true */
export function drawHairBack(c: CanvasRenderingContext2D, back: Back, H: HeadFrame, an: Anim, tone: HairTones): boolean {
  const P = H.f > 4
  if (back === 'pigtails') return P ? drawPigtails(c, H, an, tone) : false
  if (back === 'wavy') return P ? drawWavy(c, H, an, tone) : false
  if (back !== 'tail' && back !== 'braid' && back !== 'bob') return false
  const g = kit(c, H)
  const moving = an.moving
  // savrulma: koşarken geriye uzanır ve dalgalanır, dururken hafifçe salınır (saate bağlı)
  const sw = an.hair * 3.2 + Math.sin(an.t * (moving ? 11 : 1.7)) * (moving ? 0.9 : 0.45)
  const tp = Math.sin(an.t * (moving ? 11 : 1.7) - 1.4) * (moving ? 1.8 : 0.7)
  const up = an.lift * 5
  const sh = { color: tone.hairS, dx: -1.6, dy: -0.8 }
  if (back === 'tail') {
    if (P) {
      // yüksek at kuyruğu: tepenin arkasından çıkar, geriye ve aşağı akar, ucu sivrilir
      const rx = -10.5
      const ry = -17
      blob(c, () => {
        g.m(rx + 2, ry - 5)
        g.bz(rx - 8 - sw, ry - 8 - up, rx - 18 - sw * 1.6, ry + 2 - up, rx - 19 - sw * 2 - tp, ry + 15 - up)
        g.q(rx - 14 - sw * 1.5, ry + 11 - up * 0.8, rx - 11 - sw, ry + 13 - up * 0.8)
        g.bz(rx - 11 - sw, ry + 6, rx - 6, ry + 2, rx + 1.5, ry + 2.4)
      }, tone.hair, sh)
      g.fine(rx - 3, ry - 3, rx - 10 - sw, ry - 1 - up * 0.4, rx - 15 - sw * 1.4, ry + 8 - up * 0.6, 1.5, tone.hairL)
      g.fine(rx - 6, ry + 1, rx - 11 - sw * 1.2, ry + 5, rx - 14 - sw * 1.6 - tp * 0.5, ry + 11 - up * 0.6, 0.8, tone.hairS)
      // bağ
      blob(c, () => g.ell(rx + 1, ry - 1.2, 2.2, 3.8, -0.3), band)
    } else {
      // önden: omzun üstüne düşen yan at kuyruğu
      const rx = 15
      const ry = -8
      blob(c, () => {
        g.m(rx - 3, ry)
        g.bz(rx + 5, ry - 4, rx + 12 + sw * 0.4, ry + 4, rx + 11 + sw * 0.5, ry + 20)
        g.q(rx + 9 + sw * 0.5, ry + 28, rx + 4, ry + 31)
        g.q(rx + 3, ry + 20, rx - 4, ry + 12)
      }, tone.hair, sh)
      g.fine(rx + 2, ry + 1, rx + 8, ry + 8, rx + 8 + sw * 0.4, ry + 21, 1.4, tone.hairL)
      blob(c, () => g.ell(rx - 0.5, ry + 1, 3.2, 2.2, -0.5), band)
    }
    return true
  }
  if (back === 'braid') {
    // örgü: üç loblu halkalar, her halka bir önceki gibi hafif kayar; ucunda bağ
    const n = 5
    const rx = P ? -11 : 14.5
    const ry = P ? -7 : 2
    const dirx = P ? -0.36 : 0.18
    const diry = P ? 1 : 1
    const step = P ? 5.6 : 6
    const px = (i: number) => rx + (dirx * i * step) - (P ? sw * 0.5 * (i / n) * 3 + tp * 0.2 * i : sw * 0.3 * i * 0.3)
    const py = (i: number) => ry + diry * i * step - up * 0.3 * (i / n)
    for (let i = 0; i < n; i++) {
      const lx = px(i)
      const ly = py(i)
      blob(c, () => g.ell(lx, ly, 3.4 - i * 0.18, 3.5, (i % 2 ? 0.5 : -0.5)), i % 2 ? tone.hairS : tone.hair, i % 2 ? undefined : sh)
    }
    const ex = px(n)
    const ey = py(n)
    blob(c, () => g.ell(ex, ey - 1, 2.4, 2.4), band)
    g.fine(ex - 1, ey + 0.5, ex - 2 - sw * 0.5, ey + 4, ex - 1.5 - tp * 0.5, ey + 6.5, 1.8, tone.hair)
    g.fine(px(0) - 1.5, py(0) - 1, px(2) - 1.8, py(2), px(3) - 1.6, py(3), 0.8, tone.hairL)
    return true
  }
  // bob: yüzü çerçeveleyen, çene hizasında biten küt kesim
  if (P) {
    blob(c, () => {
      g.m(-2, -19)
      g.bz(-14, -19, -20 - sw * 0.4, -6, -19 - sw * 0.6, 9)
      g.q(-18 - sw * 0.8, 15 - up * 0.3, -11 - sw * 0.6, 14.4 - up * 0.3)
      g.q(-5, 12, -2, 6)
    }, tone.hair, sh)
    g.fine(-14, -8, -16.5 - sw * 0.4, 2, -15.4 - sw * 0.6, 10, 1.5, tone.hairL)
    g.fine(-9, 3, -9 - sw * 0.3, 8, -9.6 - sw * 0.5, 12.4, 0.8, tone.hairS)
  } else {
    // iki yan perde: kulakların yanından çeneye iner
    for (const side of [-1, 1]) {
      blob(c, () => {
        g.m(side * 12.5, -14)
        g.bz(side * 20, -10, side * 21 + side * sw * 0.2, 2, side * 20 + side * sw * 0.3, 11)
        g.q(side * 15, 15.5, side * 8.6, 13)
        g.q(side * 10.6, 3, side * 11, -6)
      }, tone.hair, side < 0 ? sh : undefined)
    }
    g.fine(-19, -6, -19.6, 2, -18.4, 9, 1.4, tone.hairL)
  }
  return true
}

/** başın üstündeki topuz (ön saçtan sonra çizilir); `hat`: başlık takılıysa topuz altta kalır, çizilmez */
export function drawHairTop(c: CanvasRenderingContext2D, back: Back, H: HeadFrame, an: Anim, tone: HairTones, hat: boolean): boolean {
  const P = H.f > 4
  // iki yandan örgü önden: kulakların arkasından omuzların önüne iner (başlık takılı olsa da görünür)
  if (back === 'pigtails') return P ? false : drawPigtails(c, H, an, tone)
  // yan örgü: omzun önüne düşer, başlık takılı olsa da görünür
  if (back === 'sidebraid') return drawSideBraid(c, H, an, tone)
  if (back === 'buns') return hat ? false : drawBuns(c, H, an, tone)
  if (back !== 'bun' || hat) return false
  const g = kit(c, H)
  const bx = P ? -3.4 : 0.6
  const by = P ? -26 : -19.2
  const r = P ? 6.4 : 5.8
  const bob = Math.sin(an.t * (an.moving ? 11 : 1.8)) * (an.moving ? 0.5 : 0.15) - an.lift * 0.8
  blob(c, () => g.ell(bx, by + bob, r, r * 0.92), tone.hair, { color: tone.hairS, dx: -1.8, dy: -1.2 })
  // saç telleri: topuzu saran iki yay ve tepede ışık
  g.fine(bx - r * 0.7, by + bob + 1, bx, by + bob - r * 0.6, bx + r * 0.7, by + bob + 0.6, 0.9, tone.hairS)
  g.fine(bx - r * 0.5, by + bob + 3, bx + 0.4, by + bob + 1.2, bx + r * 0.6, by + bob + 3, 0.8, tone.hairS)
  g.fine(bx - r * 0.8, by + bob - 1.5, bx - r * 0.4, by + bob - 3.8, bx + 0.6, by + bob - 4.3, 1.5, tone.hairL)
  // bağ
  blob(c, () => g.ell(bx, by + bob + r * 0.82, r * 0.68, 1.4), band)
  return true
}

/**
 * İki yandan örgü: kulağın arkasında bağlanan kısa bir tutam, altında halka halka inen örgü ve ucunda püskül gibi açılan saç.
 * Profilde (oyun) iki örgü ensenin arkasından sarkar (uzak olan gölgede, biraz önde); önden (portre)
 * iki örgü kulakların dışından omuzların önüne düşer. Kulak ve boyun açık kalır.
 */
function drawPigtails(c: CanvasRenderingContext2D, H: HeadFrame, an: Anim, tone: HairTones): boolean {
  const g = kit(c, H)
  const P = H.f > 4
  const moving = an.moving
  const sw = an.hair * 2.6 + Math.sin(an.t * (moving ? 11 : 1.7)) * (moving ? 0.8 : 0.35)
  const up = an.lift * 4
  const sh = { color: tone.hairS, dx: -1.2, dy: -0.8 }
  const braid = (x0: number, y0: number, dx: number, n: number, step: number, r: number, swing: number, far: boolean) => {
    const px = (i: number) => x0 + dx * i * step - swing * (i / n) * 1.6
    const py = (i: number) => y0 + i * step - up * 0.35 * (i / n)
    // ucu: bağın altında fırça gibi açılan saç
    const ex = px(n)
    const ey = py(n)
    blob(c, () => {
      g.m(ex - 2.2, ey - 1)
      g.q(ex - 3.4 - swing * 0.3, ey + 3, ex - 2 - swing * 0.6, ey + 5.6)
      g.l(ex - 0.6 - swing * 0.6, ey + 3.8)
      g.l(ex + 0.6 - swing * 0.5, ey + 6.2)
      g.l(ex + 1.4 - swing * 0.4, ey + 3.8)
      g.q(ex + 3.2 - swing * 0.2, ey + 3.6, ex + 2.2, ey - 1)
    }, far ? tone.hairS : tone.hair, far ? undefined : sh)
    for (let i = n - 1; i >= 0; i--) {
      const lx = px(i)
      const ly = py(i)
      const rr = r - i * 0.12
      blob(c, () => g.ell(lx, ly, rr * 0.92, rr, i % 2 ? 0.45 : -0.45), far ? tone.hairS : i % 2 ? tone.hairS : tone.hair, far || i % 2 ? undefined : sh)
      if (!far) g.fine(lx - rr * 0.5, ly - rr * 0.3, lx - rr * 0.2, ly - rr * 0.8, lx + rr * 0.3, ly - rr * 0.7, 0.8, tone.hairL)
    }
    blob(c, () => g.ell(ex, ey - 1, 2, 1.5), band)
  }
  if (P) {
    // uzak örgü: yakının biraz önünde ve gölgede, ensenin arkasından sarkar
    braid(-14.4, 3.4, -0.1, 4, 4.2, 2.6, sw * 0.8, true)
    // yakın örgü: kulağın arkasındaki bağdan ensenin arkasına
    blob(c, () => g.ell(-16.4, -2.4, 3.8, 3.4, 0.3), tone.hair, sh)
    braid(-18, 2, -0.14, 4, 4.4, 2.9, sw, false)
    blob(c, () => g.ell(-17.2, -0.2, 2.2, 1.6, 0.4), band)
    return true
  }
  for (const side of [-1, 1]) {
    const x0 = side * 15.6
    blob(c, () => g.ell(x0, -2, 3.6, 3.2), tone.hair, side < 0 ? sh : undefined)
    braid(x0 + side * 0.6, 2.4, side * 0.06, 6, 4.6, 3, side * sw * 0.4, false)
    blob(c, () => g.ell(x0 + side * 0.2, 0.4, 2.4, 1.4), band)
  }
  return true
}

/** halka halka örgü: (x0, y0)'dan (x1, y1)'e kavisle (ortası (mx, my)) iner; uçta bağ ve fırça gibi açılan saç */
function braidAlong(c: CanvasRenderingContext2D, g: ReturnType<typeof kit>, tone: HairTones, x0: number, y0: number, mx: number, my: number, x1: number, y1: number, n: number, r0: number, swing: number) {
  const at = (u: number): [number, number] => {
    const v = 1 - u
    return [v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1]
  }
  const sh = { color: tone.hairS, dx: -1.2, dy: -0.8 }
  // uç: bağın altında açılan tutam
  const [ex, ey] = at(1)
  const [px, py] = at(0.94)
  const dx = ex - px
  const dy = ey - py
  const l = Math.hypot(dx, dy) || 1
  const ux = dx / l
  const uy = dy / l
  blob(c, () => {
    g.m(ex - uy * 2.2, ey + ux * 2.2)
    g.q(ex + ux * 3 - uy * 3.2 + swing * 0.3, ey + uy * 3 + ux * 3.2, ex + ux * 5.6 - uy * 1.6 + swing * 0.5, ey + uy * 5.6 + ux * 1.6)
    g.l(ex + ux * 3.6, ey + uy * 3.6)
    g.l(ex + ux * 6.2 + uy * 0.8 + swing * 0.5, ey + uy * 6.2 - ux * 0.8)
    g.l(ex + ux * 3.6 + uy * 1.6, ey + uy * 3.6 - ux * 1.6)
    g.q(ex + ux * 3.4 + uy * 3.4, ey + uy * 3.4 - ux * 3.4, ex + uy * 2.2, ey - ux * 2.2)
  }, tone.hair, sh)
  for (let i = n - 1; i >= 0; i--) {
    const [lx, ly] = at(i / n)
    const rr = r0 * (1 - (i / n) * 0.28)
    blob(c, () => g.ell(lx, ly, rr * 0.95, rr * 1.02, i % 2 ? 0.5 : -0.5), i % 2 ? tone.hairS : tone.hair, i % 2 ? undefined : sh)
    g.fine(lx - rr * 0.55, ly - rr * 0.2, lx - rr * 0.2, ly - rr * 0.75, lx + rr * 0.35, ly - rr * 0.65, 0.8, tone.hairL)
  }
  // bağ: kurdele fiyonk
  const bx = ex - ux * 0.6
  const by = ey - uy * 0.6
  for (const sd of [-1, 1]) blob(c, () => g.ell(bx - uy * sd * 2.4, by + ux * sd * 2.4, 2, 1.3, Math.atan2(ux, -uy)), band, { color: '#b03a4e', dx: -0.5, dy: -0.4 })
  blob(c, () => g.ell(bx, by, 1.4, 1.4), '#c8445a')
}

/**
 * Yan örgü: saç kulağın arkasında toplanır, tek kalın örgü omzun önüne düşer (kulak ve boyun açık).
 * Profilde (oyun) yakın omzun üstünden göğse iner; önden (portre) yakın yanda omzun önüne düşer.
 */
function drawSideBraid(c: CanvasRenderingContext2D, H: HeadFrame, an: Anim, tone: HairTones): boolean {
  const g = kit(c, H)
  const P = H.f > 4
  const moving = an.moving
  const sw = an.hair * 2.4 + Math.sin(an.t * (moving ? 11 : 1.7)) * (moving ? 0.8 : 0.3)
  const up = an.lift * 3
  const sh = { color: tone.hairS, dx: -1.2, dy: -0.8 }
  if (P) {
    // kulağın arkasında toplanan tutam, enseden omzun üstüne
    blob(c, () => {
      g.m(-16.8, -5)
      g.q(-19.8, 3, -15.6, 8.4)
      g.q(-12.4, 9.6, -12.2, 6.6)
      g.q(-13.6, 1, -13.4, -5)
    }, tone.hair, sh)
    g.fine(-17.4, -2, -17.8, 3, -15.4, 6.6, 1.2, tone.hairL)
    braidAlong(c, g, tone, -14, 8, -12.4 - sw * 0.6, 16.4 - up * 0.3, -6 - sw, 25.6 - up, 6, 3.3, -sw)
    return true
  }
  blob(c, () => {
    g.m(-15.6, 3)
    g.q(-19, 7, -17.4, 11.6)
    g.q(-14, 13, -13.4, 9.6)
    g.q(-13.2, 6, -13.8, 3.4)
  }, tone.hair, sh)
  braidAlong(c, g, tone, -15.6, 11.4, -17.4 + sw * 0.3, 19.6, -14 + sw * 0.5, 29, 5, 3.4, sw * 0.4)
  return true
}

/** çift topuz: başın iki yanında, tepeye yakın iki yuvarlak topuz; profilde uzak olan gölgede ve geride */
function drawBuns(c: CanvasRenderingContext2D, H: HeadFrame, an: Anim, tone: HairTones): boolean {
  const g = kit(c, H)
  const P = H.f > 4
  const bob = Math.sin(an.t * (an.moving ? 11 : 1.8)) * (an.moving ? 0.5 : 0.15) - an.lift * 0.8
  const bun = (bx: number, by: number, r: number, far: boolean) => {
    blob(c, () => g.ell(bx, by, r, r * 0.94), far ? tone.hairS : tone.hair, far ? undefined : { color: tone.hairS, dx: -1.6, dy: -1.1 })
    if (far) return
    g.fine(bx - r * 0.7, by + 0.8, bx, by - r * 0.6, bx + r * 0.7, by + 0.4, 0.85, tone.hairS)
    g.fine(bx - r * 0.45, by + 2.6, bx + 0.4, by + 1.1, bx + r * 0.6, by + 2.6, 0.75, tone.hairS)
    g.fine(bx - r * 0.75, by - 1.2, bx - r * 0.35, by - r * 0.62, bx + 0.6, by - r * 0.7, 1.4, tone.hairL)
    // altında ince kurdele
    blob(c, () => g.ell(bx, by + r * 0.84, r * 0.64, 1.2), band)
  }
  if (P) {
    bun(-12.2, -18.6 + bob * 0.8, 4.4, true)
    bun(-0.8, -25 + bob, 5, false)
    return true
  }
  for (const sd of [-1, 1]) bun(sd * 10.2, -18.8 + bob, 5.2, false)
  return true
}

/**
 * Dalgalı uzun saç (profil): başın arkasından sırta dökülür, dış hat dalga dalga, uçlar üç tutam; savruldukça uçlar
 * gecikerek izler. Önden (portre) çizimi portraitDraw `wavyHairBack`.
 */
function drawWavy(c: CanvasRenderingContext2D, H: HeadFrame, an: Anim, tone: HairTones): boolean {
  const g = kit(c, H)
  const moving = an.moving
  const fl = moving ? 1 : 0.3
  const sw = an.hair * 3.4 + Math.sin(an.t * (moving ? 11 : 1.7)) * 0.5 * fl
  const tp = Math.sin(an.t * (moving ? 11 : 1.7) - 1.4) * 1.5 * fl
  const up = an.lift * 5.5
  blob(c, () => {
    g.m(-5, -21.3)
    g.bz(-21, -21, -25 - sw * 0.3, -9, -21.6 - sw * 0.6, -1)
    // dış hat: üç dalga
    g.q(-26.4 - sw * 0.9, 5, -22.6 - sw * 1.1, 10.6 - up * 0.3)
    g.q(-19.6 - sw * 1.2, 15, -24.4 - sw * 1.6, 20 - up * 0.6)
    g.q(-28.2 - sw * 2 - tp, 25 - up * 0.8, -24.6 - sw * 2.2 - tp, 30.4 - up)
    // uçlar: üç tutam, aralarında çentik
    g.q(-21.4 - sw * 1.7, 27.6 - up * 0.8, -19 - sw * 1.6, 24.2 - up * 0.6)
    g.q(-19.4 - sw * 1.8, 30 - up * 0.8, -15.2 - sw * 1.8 - tp, 33.8 - up)
    g.q(-11.6 - sw * 1.3, 29.4 - up * 0.7, -11.6 - sw * 1.1, 24.4 - up * 0.5)
    g.q(-9.6 - sw * 1.2, 28.6 - up * 0.6, -6.4 - sw * 1.2 - tp * 0.7, 30 - up * 0.8)
    g.q(-3 - sw * 0.6, 24, -5.6, 17)
    g.q(-2.4, 13, -4, 10)
    g.l(1, 0.7)
  }, tone.hair, { color: tone.hairS, dx: -3.2, dy: -1.2 })
  // dalgayı izleyen S telleri (koyu) ve dalga sırtlarında ışık
  g.fine(-17.4, -2, -21 - sw * 0.7, 5, -18 - sw * 0.9, 11 - up * 0.3, 0.9, tone.hairS)
  g.fine(-18 - sw * 0.9, 11 - up * 0.3, -15.4 - sw * 1.1, 16, -19 - sw * 1.6, 24.2 - up * 0.6, 0.9, tone.hairS)
  g.fine(-11, 6, -14.4 - sw * 0.6, 12, -11.6 - sw * 0.9, 17 - up * 0.4, 0.8, tone.hairS)
  g.fine(-11.6 - sw * 0.9, 17 - up * 0.4, -9.4 - sw * 1, 21, -11.6 - sw * 1.1, 24.4 - up * 0.5, 0.8, tone.hairS)
  g.fine(-20.4, -12, -23.6 - sw * 0.4, -5, -22.4 - sw * 0.7, 1, 2.2, tone.hairL)
  g.fine(-23.6 - sw * 1, 6, -24.4 - sw * 1.1, 8.4, -22.8 - sw * 1.2, 11, 1.6, tone.hairL)
  g.fine(-25.4 - sw * 1.8, 21.4 - up * 0.6, -26.2 - sw * 2, 24 - up * 0.8, -25.2 - sw * 2.1 - tp, 27 - up * 0.9, 1.3, tone.hairL)
  g.fine(-15.6 - sw * 1.2, 22 - up * 0.6, -16.6 - sw * 1.6, 26.6 - up * 0.8, -15.6 - sw * 1.7 - tp * 0.6, 30.6 - up * 0.9, 1, tone.hairL)
  return true
}
