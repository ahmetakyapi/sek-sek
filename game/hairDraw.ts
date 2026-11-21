/**
 * Saç parçaları (Mağaza: saç stili): arka saç (at kuyruğu, örgü, küt kesim) başın arkasında, topuz başın üstünde durur.
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
  if (back !== 'tail' && back !== 'braid' && back !== 'bob') return false
  const g = kit(c, H)
  const P = H.f > 4
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
  if (back !== 'bun' || hat) return false
  const g = kit(c, H)
  const P = H.f > 4
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
