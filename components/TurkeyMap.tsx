'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LEVELS } from '@/game/levels'
import { useLang } from '@/lib/i18n'

type Pt = [number, number]
type Box = { x0: number; y0: number; x1: number; y1: number }

/* ── Yol defteri haritası: elle iyileştirilmiş kıyı ve sınır (boylam, enlem) ── */

/** Anadolu, Karadeniz kıyısı: Boğaz'dan Sarp'a */
const BLACK_SEA: Pt[] = [
  [29.17, 41.22], [29.6, 41.17], [30.2, 41.2], [30.35, 41.13], [30.75, 41.08], [31.15, 41.09], [31.4, 41.3], [31.8, 41.46],
  [32.1, 41.6], [32.4, 41.76], [32.8, 41.86], [33.3, 42.02], [33.8, 41.98], [34.3, 41.95], [34.8, 42.02], [34.95, 42.1],
  [35.1, 42.07], [35.22, 42.03], [35.1, 41.95], [35.25, 41.72], [35.6, 41.64], [35.97, 41.74], [36.12, 41.6], [36.33, 41.3],
  [36.6, 41.38], [36.85, 41.33], [37.0, 41.2], [37.3, 41.14], [37.5, 41.04], [37.68, 41.13], [37.9, 41.0], [38.4, 40.93],
  [38.8, 41.0], [39.1, 41.07], [39.42, 41.11], [39.75, 41.0], [40.2, 40.93], [40.5, 41.03], [40.9, 41.18], [41.3, 41.37],
  [41.55, 41.52],
]

/** Doğu ve güney kara sınırı: Sarp'tan Samandağ'a */
const EAST_BORDER: Pt[] = [
  [41.55, 41.52], [41.95, 41.51], [42.5, 41.44], [42.83, 41.58], [43.2, 41.3], [43.47, 41.13], [43.66, 40.95], [43.75, 40.7],
  [43.6, 40.45], [43.67, 40.12], [44.05, 40.02], [44.4, 39.9], [44.8, 39.7], [44.42, 39.42], [44.1, 39.35], [44.2, 38.95],
  [44.45, 38.4], [44.25, 38.0], [44.6, 37.75], [44.57, 37.4], [44.8, 37.2], [44.25, 37.0], [44.0, 37.3], [43.3, 37.35],
  [42.8, 37.3], [42.36, 37.1], [42.2, 37.28], [41.6, 37.1], [41.2, 37.07], [40.75, 37.1], [40.0, 36.82], [39.2, 36.68],
  [38.95, 36.7], [38.4, 36.9], [38.02, 36.83], [37.5, 36.65], [37.1, 36.65], [36.67, 36.83], [36.55, 36.5], [36.68, 36.25],
  [36.4, 36.2], [36.37, 36.0], [36.18, 35.83], [35.92, 35.93],
]

/** Akdeniz, Ege, Marmara kıyısı: Samandağ'dan Boğaz'a */
const SOUTH_WEST: Pt[] = [
  [35.92, 35.93], [35.97, 36.02], [35.8, 36.3], [36.15, 36.58], [36.2, 36.88], [35.95, 36.92], [35.6, 36.6], [35.35, 36.55],
  [34.9, 36.72], [34.63, 36.8], [34.3, 36.6], [34.05, 36.3], [33.7, 36.15], [33.3, 36.13], [32.8, 36.02], [32.55, 36.1],
  [32.0, 36.54], [31.4, 36.75], [30.9, 36.85], [30.62, 36.85], [30.57, 36.6], [30.42, 36.2], [30.15, 36.3], [29.65, 36.18],
  [29.3, 36.25], [29.1, 36.65], [28.75, 36.7], [28.3, 36.82], [28.0, 36.58], [27.95, 36.75], [27.4, 36.66], [27.7, 36.8],
  [28.33, 37.03], [27.6, 37.0], [27.25, 37.0], [27.4, 37.12], [27.6, 37.25], [27.25, 37.4], [27.2, 37.65], [27.0, 37.67],
  [27.27, 37.88], [26.8, 38.15], [26.3, 38.25], [26.38, 38.67], [26.5, 38.66], [26.65, 38.33], [27.1, 38.43], [26.92, 38.52],
  [26.75, 38.67], [26.9, 38.8], [27.05, 38.93], [26.88, 39.07], [26.68, 39.3], [26.95, 39.58], [26.6, 39.54], [26.07, 39.48],
  [26.15, 39.8], [26.2, 40.0], [26.42, 40.13], [26.7, 40.35], [27.05, 40.42], [27.3, 40.4], [27.65, 40.33], [27.75, 40.4],
  [27.75, 40.52], [27.95, 40.53], [28.05, 40.42], [28.0, 40.35], [28.5, 40.38], [28.88, 40.37], [29.15, 40.43], [28.8, 40.55],
  [29.27, 40.66], [29.93, 40.72], [29.5, 40.78], [29.25, 40.85], [29.05, 40.97], [29.1, 41.1], [29.17, 41.22],
]

/** Trakya: Karadeniz kıyısı, Bulgaristan ve Yunanistan sınırı, Ege ve Marmara kıyısı */
const THRACE_NORTH: Pt[] = [[29.05, 41.23], [28.7, 41.35], [28.3, 41.5], [28.1, 41.63], [28.0, 41.88], [28.03, 41.98]]
const THRACE_BORDER: Pt[] = [
  [28.03, 41.98], [27.6, 42.0], [27.3, 42.1], [26.95, 42.0], [26.55, 41.85], [26.36, 41.71], [26.6, 41.6], [26.33, 41.25],
  [26.37, 40.95], [26.05, 40.73],
]
const THRACE_SOUTH: Pt[] = [
  [26.05, 40.73], [26.4, 40.62], [26.8, 40.63], [26.6, 40.45], [26.25, 40.3], [26.17, 40.05], [26.36, 40.19], [26.68, 40.41],
  [26.85, 40.5], [27.1, 40.61], [27.3, 40.7], [27.5, 40.97], [27.95, 40.97], [28.25, 41.07], [28.6, 40.97], [28.92, 40.98],
  [28.98, 41.03], [29.0, 41.12], [29.05, 41.23],
]

/** Komşu kara parçaları (yalnız zemin tonu) ve görünen kıyıları */
const LAND_EAST: Pt[] = [
  [41.55, 41.52], [41.6, 41.65], [41.72, 41.9], [41.67, 42.15], [41.5, 42.5], [41.2, 42.8], [40.9, 43.3], [46, 43.3],
  [46, 34.8], [35.9, 34.8], [35.85, 35.3], [35.78, 35.52], [35.92, 35.93], [38, 38],
]
const LAND_WEST: Pt[] = [
  [28.03, 41.98], [27.95, 42.3], [27.5, 42.48], [27.75, 42.7], [27.9, 43.3], [24, 43.3], [24, 40.9], [25.2, 40.95],
  [25.87, 40.84], [26.05, 40.73], [26.6, 41.4],
]
const FOREIGN_COASTS: Pt[][] = [
  LAND_EAST.slice(0, 7),
  LAND_EAST.slice(9, 13),
  LAND_WEST.slice(0, 5),
  LAND_WEST.slice(6, 10),
]
const FOREIGN_ISLES: Pt[][] = [
  [[25.85, 39.2], [26.2, 39.38], [26.6, 39.2], [26.55, 39.02], [26.1, 38.97]],
  [[25.87, 38.55], [26.15, 38.55], [26.15, 38.25], [25.95, 38.17]],
  [[26.57, 37.78], [27.05, 37.75], [26.85, 37.65], [26.6, 37.68]],
  [[26.95, 36.88], [27.33, 36.85], [27.0, 36.75]],
  [[27.7, 36.15], [28.22, 36.45], [28.1, 36.1], [27.85, 35.9]],
  [[32.3, 35.05], [32.9, 35.18], [33.0, 35.38], [33.65, 35.37], [34.58, 35.69], [34.05, 35.3], [33.9, 34.9]],
]
const HOME_ISLES: Pt[][] = [
  [[25.7, 40.15], [25.9, 40.23], [26.02, 40.14], [25.85, 40.1]],
  [[27.5, 40.63], [27.7, 40.66], [27.72, 40.6], [27.55, 40.58]],
]
const LAKES: Pt[][] = [
  [[42.28, 38.5], [42.45, 38.68], [42.75, 38.8], [43.0, 38.95], [43.4, 39.02], [43.25, 38.75], [43.3, 38.55], [43.12, 38.32], [42.75, 38.3], [42.5, 38.42]],
  [[33.2, 38.95], [33.55, 38.9], [33.65, 38.6], [33.4, 38.45], [33.3, 38.7]],
]

/** Denizlerdeki küçük dalga çizgileri */
const WAVES: Pt[] = [
  [29.0, 42.3], [28.75, 41.8], [30.2, 41.75], [30.6, 42.6], [34.0, 42.65], [36.4, 42.25], [37.5, 41.7], [36.9, 42.75],
  [40.2, 41.6], [40.3, 42.65], [25.5, 40.45], [25.6, 39.75], [25.4, 37.7], [26.2, 37.25], [25.8, 36.4], [26.8, 36.2],
  [25.2, 35.7], [28.9, 35.95], [29.8, 35.6], [31.4, 36.25], [32.1, 35.65], [34.7, 36.2], [35.2, 35.85], [28.3, 40.75],
]

const COORDS: Record<string, [number, number]> = {
  istanbul: [28.98, 41.01],
  kocaeli: [29.92, 40.77],
  canakkale: [26.41, 40.15],
  edirne: [26.56, 41.68],
  bursa: [29.06, 40.19],
  antalya: [30.71, 36.9],
  sanliurfa: [38.79, 37.16],
  van: [43.38, 38.5],
  erzurum: [41.27, 39.9],
  kayseri: [35.49, 38.73],
  hatay: [36.16, 36.2],
  eskisehir: [30.52, 39.78],
  izmir: [27.14, 38.42],
  sinop: [35.15, 42.03],
  diyarbakir: [40.22, 37.91],
  ankara: [32.86, 39.93],
  konya: [32.48, 37.87],
  nevsehir: [34.71, 38.62],
  gaziantep: [37.38, 37.07],
  adana: [35.32, 37.0],
  mardin: [40.73, 37.31],
  malatya: [38.31, 38.35],
  corum: [34.95, 40.55],
  ordu: [37.88, 40.98],
  trabzon: [39.72, 41.0],
  sivas: [37.02, 39.75],
  ardahan: [42.7, 41.11],
  bayburt: [40.23, 40.26],
}

const W = 640

/**
 * Ölçüye göre harita geometrisi: `lon0` sol kenarın boylamı, `kx` derece başına birim.
 * Enlem ölçeği boylamın 1,28 katıdır (39. paralelde gerçek oran); dar ekranda `stretch` ile uzar ki 25 şehrin adı sığsın.
 */
function makeGeo(stretch: number, lon0: number, kx: number) {
  const X = (lon: number) => (lon - lon0) * kx
  const ky = 39.2 * stretch
  const Y = (lat: number) => (42.95 - lat) * ky
  const H = Math.round(7.65 * ky)
  const d = (pts: Pt[], close = false) => pts.map(([lo, la], i) => `${i ? 'L' : 'M'}${X(lo).toFixed(1)} ${Y(la).toFixed(1)}`).join('') + (close ? 'Z' : '')
  const isles = HOME_ISLES.map((p) => d(p, true)).join('')
  const nodes = LEVELS.map((l) => {
    const [lo, la] = COORDS[l.id]
    return { x: X(lo), y: Y(la) }
  })
  /** Rota parçası: hafif yay (elle çizilmiş his), yön oku ortada */
  const legs = nodes.slice(1).map((b, i) => {
    const a = nodes[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const bend = (i % 2 ? -1 : 1) * 0.09
    const cx = (a.x + b.x) / 2 - dy * bend
    const cy = (a.y + b.y) / 2 + dx * bend
    return {
      path: `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
      mx: 0.25 * a.x + 0.5 * cx + 0.25 * b.x,
      my: 0.25 * a.y + 0.5 * cy + 0.25 * b.y,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      length: Math.hypot(dx, dy),
      samples: [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t): Pt => [
        (1 - t) * (1 - t) * a.x + 2 * t * (1 - t) * cx + t * t * b.x,
        (1 - t) * (1 - t) * a.y + 2 * t * (1 - t) * cy + t * t * b.y,
      ]),
    }
  })
  return {
    H,
    X,
    Y,
    nodes,
    legs,
    home: `${d([...BLACK_SEA, ...EAST_BORDER.slice(1), ...SOUTH_WEST.slice(1, -1)], true)}${d([...THRACE_NORTH, ...THRACE_BORDER.slice(1), ...THRACE_SOUTH.slice(1, -1)], true)}${isles}`,
    coast: [BLACK_SEA, SOUTH_WEST, THRACE_NORTH, THRACE_SOUTH].map((p) => d(p)).join('') + isles,
    border: d(EAST_BORDER) + d(THRACE_BORDER),
    far: `${d(LAND_EAST, true)}${d(LAND_WEST, true)}${FOREIGN_ISLES.map((p) => d(p, true)).join('')}`,
    farCoasts: FOREIGN_COASTS.map((p) => d(p)).join('') + FOREIGN_ISLES.map((p) => d(p, true)).join(''),
    lakes: LAKES.map((p) => d(p, true)).join(''),
    waves: WAVES.map(([lo, la]) => `M${(X(lo) - 6).toFixed(1)} ${Y(la).toFixed(1)}q3 -3 6 0t6 0`).join(''),
  }
}
type Geo = ReturnType<typeof makeGeo>

const SEAS = {
  tr: { black: 'Karadeniz', aegean: 'Ege', med: 'Akdeniz', marmara: 'Marmara', locked: 'Kilitli', done: 'Tamamlandı', route: 'Yolculuk Rotası' },
  en: { black: 'Black Sea', aegean: 'Aegean', med: 'Mediterranean', marmara: 'Marmara', locked: 'Locked', done: 'Completed', route: 'Journey Route' },
}

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))

/** Pixelify Sans'ta ortalama harf genişliği (em) */
const CHAR = 0.55

/**
 * Geniş ekranda etiket yerleşimi: her şehir için sekiz yön (sağ, sol, üst, alt, çaprazlar) üç uzaklıkta denenir.
 * Öbür etiketlere, düğümlere, deniz adlarına, rotaya ve kenara binmeyi en aza indiren yer seçilir;
 * uzağa düşen etiket düğüme ince bir çizgiyle bağlanır. Ölçüye göre yeniden hesaplanır.
 */
function placeLabels(geo: Geo, fs: number, r: number, fixed: Box[]): Box[] {
  const { nodes, legs, H } = geo
  const h = fs * 0.84
  const boxes = (i: number): Box[] => {
    const { x, y } = nodes[i]
    const w = LEVELS[i].name.length * CHAR * fs
    return [1, 2.3, 3.6].flatMap((far, ring) => {
      const gap = (r + fs * 0.3) * far
      const k = gap * 0.72
      const v = r + fs * 0.3 + h * 1.15 * ring
      return [
        { x0: x + gap, y0: y - h / 2, x1: x + gap + w, y1: y + h / 2 },
        { x0: x - gap - w, y0: y - h / 2, x1: x - gap, y1: y + h / 2 },
        { x0: x - w / 2, y0: y - v - h, x1: x + w / 2, y1: y - v },
        { x0: x - w / 2, y0: y + v, x1: x + w / 2, y1: y + v + h },
        { x0: x + k, y0: y - k - h, x1: x + k + w, y1: y - k },
        { x0: x + k, y0: y + k, x1: x + k + w, y1: y + k + h },
        { x0: x - k - w, y0: y - k - h, x1: x - k, y1: y - k },
        { x0: x - k - w, y0: y + k, x1: x - k, y1: y + k + h },
      ]
    })
  }
  const bias = [0, 0.05, 0.02, 0.02, 0.08, 0.08, 0.1, 0.1]
  const pad = fs * 0.12
  const grow = (b: Box): Box => ({ x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad })
  const nr = r + fs * 0.3
  /* yanlara geniş pay: etiket komşu düğüme yaslanıp onun adı gibi okunmasın */
  const nodeBox = (j: number): Box => ({ x0: nodes[j].x - nr - fs * 0.7, y0: nodes[j].y - nr, x1: nodes[j].x + nr + fs * 0.7, y1: nodes[j].y + nr })
  const frame: Box = { x0: 5, y0: 5, x1: W - 5, y1: H - 5 }
  const chosen = nodes.map((_, i) => boxes(i)[0])
  const unit = fs * fs
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      let best = Infinity
      for (const [k, b] of boxes(i).entries()) {
        const g = grow(b)
        let cost = bias[k % 8] + Math.floor(k / 8) * 1.1
        cost += (((b.x1 - b.x0) * (b.y1 - b.y0) - overlap(b, frame)) / unit) * 40
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue
          cost += (overlap(g, chosen[j]) / unit) * 12 + (overlap(g, nodeBox(j)) / unit) * 12
        }
        for (const f of fixed) cost += (overlap(g, f) / unit) * 6
        for (const leg of legs) for (const [sx, sy] of leg.samples) if (sx > b.x0 && sx < b.x1 && sy > b.y0 && sy < b.y1) cost += 0.1
        if (cost < best) {
          best = cost
          chosen[i] = b
        }
      }
    }
  }
  return chosen
}

/** Pixelify Sans'ta adın genişliği (em): harf sınıfına göre, kalın yazının ölçüsüyle (gerçeğinden bir iki piksel bol) */
const textEm = (s: string) => [...s].reduce((w, c) => w + ('ıil'.includes(c) ? 0.25 : 'Iİ'.includes(c) ? 0.43 : 'mwMW'.includes(c) ? 0.78 : 'at'.includes(c) ? 0.69 : 0.6), 0)

/** Dar ekranda etiket ölçüsü (ekran pikseli): yazı 11, satır kutusu 13 (taban çizgisinin 10 üstü, 3 altı) */
const NARROW = { fs: 11, line: 13, rise: 10, r: 6 }
/** Çözülmüş dar yerleşimler: harita yeniden açılınca aynı ölçü için tavlama yinelenmez */
const NARROW_DONE = new Map<string, Box[]>()

/**
 * Dar ekranda etiket yerleşimi. Yer azdır, bu yüzden kural serttir: hiçbir etiket kutusu öbür etikete,
 * başka bir rozete, deniz adına ya da kenara değmez. Her şehir için yüz aday yer (sağ, sol, üst, alt; kaydırılmış;
 * beş uzaklıkta) üretilir, tohumu sabit bir tavlama çakışmasız ve düğümüne en yakın dizilimi arar.
 * Hesap ekran pikseliyle yapılır (`u`: piksel başına harita birimi), sonuç harita birimidir.
 */
function placeNarrow(geo: Geo, u: number, fixed: Box[]): Box[] {
  const key = `${u}|${geo.H}|${fixed.map((f) => Math.round(f.x0 + f.y1)).join()}`
  const known = NARROW_DONE.get(key)
  if (known) return known
  const { line } = NARROW
  const nodes = geo.nodes.map((n) => ({ x: n.x / u, y: n.y / u }))
  const count = nodes.length
  const frame: Box = { x0: 4, y0: 4, x1: W / u - 4, y1: geo.H / u - 4 }
  const still = [...nodes.map((n): Box => ({ x0: n.x - 8.6, y0: n.y - 8.6, x1: n.x + 8.6, y1: n.y + 8.6 })), ...fixed.map((f): Box => ({ x0: f.x0 / u - 2, y0: f.y0 / u - 2, x1: f.x1 / u + 2, y1: f.y1 / u + 2 }))]
  const samples = geo.legs.flatMap((leg) => leg.samples.map(([x, y]): Pt => [x / u, y / u]))
  const reach = (b: Box, n: { x: number; y: number }) => {
    const dx = n.x < b.x0 ? b.x0 - n.x : n.x > b.x1 ? n.x - b.x1 : 0
    const dy = n.y < b.y0 ? b.y0 - n.y : n.y > b.y1 ? n.y - b.y1 : 0
    return Math.sqrt(dx * dx + dy * dy)
  }
  /* çakışma cezası: alan + sabit pay, kıl payı değme de sayılsın */
  const fine = (area: number) => (area > 1e-6 ? (area + 4) * 10 : 0)

  /* adaylar: kutu her yandan 1 piksel payla tutulur, iki etiket arasında en az 2 piksel kalır */
  const spots: Box[] = []
  const cost: number[] = []
  const first: number[] = []
  nodes.forEach((n, i) => {
    const w = textEm(LEVELS[i].name) * NARROW.fs
    const add = (x0: number, y0: number, rank: number) => {
      const b: Box = { x0: x0 - 1, y0: y0 - 1, x1: x0 + w + 1, y1: y0 + line + 1 }
      let clash = ((b.x1 - b.x0) * (b.y1 - b.y0) - overlap(b, frame)) * 3
      still.forEach((o, j) => {
        if (j !== i) clash += overlap(b, o)
      })
      let sum = rank + fine(clash)
      /* başka bir düğüme kendi düğümünden yakın duran etiket onun adı gibi okunur */
      const own = reach(b, n)
      nodes.forEach((m, j) => {
        const d = j === i ? Infinity : reach(b, m)
        if (d < own + 3) sum += d < own ? 3 : 0.8
      })
      for (const [sx, sy] of samples) if (sx > b.x0 && sx < b.x1 && sy > b.y0 && sy < b.y1) sum += 0.08
      spots.push(b)
      cost.push(sum)
    }
    first.push(spots.length)
    for (const [ring, far] of [0, 6, 12, 19, 27].entries()) {
      const base = ring * 1.2
      for (const [dy, pull, rank] of [[0, 0, 0], [-5, 0.5, 0.25], [5, 0.5, 0.25], [-10, 0.9, 0.35], [10, 0.9, 0.35]]) {
        add(n.x + 10.5 - pull + far, n.y - line / 2 + dy, base + rank)
        add(n.x - 10.5 + pull - far - w, n.y - line / 2 + dy, base + rank + 0.05)
      }
      for (const [slide, rank] of [[0.5, 0.1], [0.25, 0.2], [0.75, 0.2], [0, 0.3], [1, 0.3]]) {
        add(n.x - w * slide, n.y - 9.6 - far - line, base + rank)
        add(n.x - w * slide, n.y + 9.6 + far, base + rank + 0.02)
      }
    }
  })
  const per = spots.length / count

  /** `i` şehri `k` adayında dururken ödediği bedel: kendi yeri + seçili öbür etiketlerle çakışması */
  let pick = first.slice()
  const price = (i: number, k: number) => {
    const a = spots[k]
    let sum = cost[k]
    for (let j = 0; j < count; j++) {
      if (j === i) continue
      const b = spots[pick[j]]
      const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
      if (w <= 0) continue
      const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
      if (h > 0) sum += fine(w * h)
    }
    return sum
  }
  const total = () => pick.reduce((sum, k, i) => sum + (cost[k] + price(i, k)) / 2, 0)

  let best = pick
  let bestTotal = Infinity
  const STEPS = 60000
  /* çakışma kalırsa (ceza en az 40) başka tohumla yeniden denenir */
  for (let attempt = 0; attempt < 3 && bestTotal >= 40; attempt++) {
    let seed = 7 + attempt * 101
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
    pick = first.slice()
    let now = total()
    let low = now
    let lowPick = pick.slice()
    /* şehrin şimdiki bedeli, son yer değişikliğinden beri hesaplandıysa yeniden hesaplanmaz */
    const held = new Float64Array(count)
    const stamp = new Int32Array(count).fill(-1)
    let moves = 0
    for (let step = 0; step < STEPS; step++) {
      const i = Math.floor(rnd() * count)
      const k = first[i] + Math.floor(rnd() * per)
      if (k === pick[i]) continue
      if (stamp[i] !== moves) {
        held[i] = price(i, pick[i])
        stamp[i] = moves
      }
      const d = price(i, k) - held[i]
      if (d <= 0 || rnd() < Math.exp(-d / (40 * Math.pow(0.0005, step / STEPS)))) {
        pick[i] = k
        moves++
        now += d
        if (now < low - 1e-9) {
          low = now
          lowPick = pick.slice()
        }
      }
    }
    pick = lowPick
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < count; i++) {
        let cheapest = price(i, pick[i])
        for (let k = first[i]; k < first[i] + per; k++) {
          const c = price(i, k)
          if (c < cheapest - 1e-9) {
            cheapest = c
            pick[i] = k
          }
        }
      }
    }
    const sum = total()
    if (sum < bestTotal) {
      bestTotal = sum
      best = pick
    }
  }
  const placed = best.map((k) => ({ x0: (spots[k].x0 + 1) * u, y0: (spots[k].y0 + 1) * u, x1: (spots[k].x1 - 1) * u, y1: (spots[k].y1 - 1) * u }))
  NARROW_DONE.set(key, placed)
  return placed
}

const WIDE = makeGeo(1, 24.6, 30.6)

export default function TurkeyMap({ unlocked, selected, onSelect }: { unlocked: number; selected: number; onSelect?: (i: number) => void }) {
  const lang = useLang()
  const words = SEAS[lang]
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(W)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /** Bir ekran pikseli kaç harita birimi: yazı ve dokunma hedefi ekranda sabit boyda kalır */
  const u = W / width
  const compact = width < 480
  /* dar ekranda boş deniz kırpılır (kıyı kenara yaklaşır) ve harita daraldıkça boyuna uzar: 25 ada yer açılır. 363 pikselden genişte uzama 1,16'da kalır */
  const stretch = compact ? Math.max(1.16, Math.round((4.5 - 0.0092 * width) * 50) / 50) : 1
  const geo = useMemo(() => (stretch === 1 ? WIDE : makeGeo(stretch, 25.3, 32.2)), [stretch])
  const { H, X, Y, nodes } = geo
  const fs = (compact ? NARROW.fs : 12.5) * u
  const seaFs = (compact ? 11 : 13) * u
  const r = (compact ? NARROW.r : 10.5) * u
  const hit = 18 * u
  const ink = Math.min(1.9, 1.15 * u)

  const { seas, rose, labels } = useMemo(() => {
    const seas = [
      { key: 'black', text: words.black, x: X(compact ? 31.4 : 32.2), y: Y(42.5), rot: 0, size: seaFs },
      { key: 'med', text: words.med, x: X(compact ? 30.4 : 31.6), y: Y(35.62), rot: 0, size: seaFs },
      { key: 'aegean', text: words.aegean, x: compact ? 12 * u : X(25.15), y: Y(compact ? 37.3 : 38.7), rot: -90, size: seaFs },
      ...(compact ? [] : [{ key: 'marmara', text: words.marmara, x: X(28.12), y: Y(40.64), rot: 0, size: 11 * u }]),
    ].map((s) => {
      const w = s.text.length * 0.72 * s.size
      const box: Box = s.rot ? { x0: s.x - s.size * 0.7, y0: s.y - w / 2, x1: s.x + s.size * 0.3, y1: s.y + w / 2 } : { x0: s.x - w / 2, y0: s.y - s.size * 0.8, x1: s.x + w / 2, y1: s.y + s.size * 0.25 }
      return { ...s, box }
    })
    const rose = compact ? { x: X(26.2), y: Y(36.05), r: 17 } : { x: X(39.9), y: Y(42.33), r: 15 }
    const roseBox: Box = { x0: rose.x - rose.r - 3, y0: rose.y - rose.r - 3, x1: rose.x + rose.r + 3, y1: rose.y + rose.r + 3 }
    const fixed = [...seas.map((s) => s.box), roseBox]
    const rise = compact ? NARROW.rise * u : fs * 0.756
    const labels = (compact ? placeNarrow(geo, u, fixed) : placeLabels(geo, fs, r, fixed)).map((b, i) => {
      /* bağ çizgisi: etiket düğümden uzağa düştüyse kutunun en yakın noktasına */
      const tx = Math.max(b.x0, Math.min(b.x1, geo.nodes[i].x))
      const ty = Math.max(b.y0, Math.min(b.y1, geo.nodes[i].y))
      const far = Math.hypot(tx - geo.nodes[i].x, ty - geo.nodes[i].y) > (compact ? 12.5 * u : r + fs * 0.75)
      return { x: (b.x0 + b.x1) / 2, y: b.y0 + rise, leader: far ? `M${geo.nodes[i].x.toFixed(1)} ${geo.nodes[i].y.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}` : null }
    })
    return { seas, rose, labels }
  }, [words, compact, geo, X, Y, seaFs, fs, r, u])

  /** Dokunma hedefleri sık şehirlerde üst üste biner: tıklanan yere en yakın şehir seçilir */
  const pick = (e: React.MouseEvent, own: number) => {
    const m = svg.current?.getScreenCTM()?.inverse()
    let i = own
    if (m) {
      const px = e.clientX * m.a + e.clientY * m.c + m.e
      const py = e.clientX * m.b + e.clientY * m.d + m.f
      let best = Infinity
      nodes.forEach((n, j) => {
        const dist = Math.hypot(n.x - px, n.y - py)
        if (dist < best) {
          best = dist
          i = j
        }
      })
    }
    if (i <= unlocked) onSelect?.(i)
  }

  const star = (R: number, k: number) => `M0 ${-R}L${R * k} ${-R * k}L${R} 0L${R * k} ${R * k}L0 ${R}L${-R * k} ${R * k}L${-R} 0L${-R * k} ${-R * k}Z`

  return (
    <div ref={wrap} className="tmap">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={`${words.route}: ${LEVELS.map((l) => l.name).join(', ')}`}>
        <defs>
          <filter id={`${uid}-wobble`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.23  0 0 0 0 0.12  0 0 0 0.5 -0.2" />
          </filter>
          <radialGradient id={`${uid}-vignette`} cx="50%" cy="45%" r="75%">
            <stop offset="55%" stopColor="var(--tm-ink)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--tm-ink)" stopOpacity="0.22" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="var(--tm-sea)" />

        <g aria-hidden="true">
          <g filter={`url(#${uid}-wobble)`} strokeLinecap="round" strokeLinejoin="round">
            {/* kıyı boyunca açık su şeridi; kara sınırında komşu toprağın altında kalır */}
            <path d={geo.home} fill="none" stroke="var(--tm-shore)" strokeWidth="9" />
            <path d={geo.far} fill="var(--tm-land-far)" />
            <path d={geo.home} fill="var(--tm-paper)" />
            <path d={geo.lakes} fill="var(--tm-sea)" stroke="var(--tm-ink)" strokeWidth={ink * 0.6} />
            <path d={geo.farCoasts} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 0.65} opacity="0.5" />
            <path d={geo.border} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 0.8} strokeDasharray={`${5 * ink} ${2.5 * ink} ${0.5 * ink} ${2.5 * ink}`} opacity="0.75" />
            <path d={geo.coast} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 1.25} />
            <path d={geo.waves} fill="none" stroke="var(--tm-sea-ink)" strokeWidth={ink * 0.7} opacity="0.55" />
          </g>

          {/* ince enlem ve boylam çizgileri */}
          <g stroke="var(--tm-ink)" strokeWidth="0.5" opacity="0.13">
            {[36, 38, 40, 42].map((la) => (
              <line key={la} x1="0" x2={W} y1={Y(la)} y2={Y(la)} />
            ))}
            {[26, 30, 34, 38, 42].map((lo) => (
              <line key={lo} y1="0" y2={H} x1={X(lo)} x2={X(lo)} />
            ))}
          </g>

          {seas.map((s) => (
            <text
              key={s.key}
              x={s.x}
              y={s.y}
              transform={s.rot ? `rotate(${s.rot} ${s.x} ${s.y})` : undefined}
              textAnchor="middle"
              fontSize={s.size}
              fontStyle="italic"
              letterSpacing={s.key === 'marmara' ? 0 : s.size * 0.12}
              fill="var(--tm-sea-ink)"
              stroke="var(--tm-sea)"
              strokeWidth={s.size * 0.22}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {s.text}
            </text>
          ))}

          {/* pusula gülü */}
          <g transform={`translate(${rose.x} ${rose.y})`} stroke="var(--tm-ink)" strokeLinejoin="round">
            <circle r={rose.r * 0.72} fill="none" strokeWidth={ink * 0.45} strokeDasharray="1 2.4" opacity="0.7" />
            <path d={star(rose.r * 0.55, 0.2)} transform="rotate(45)" fill="var(--tm-paper)" strokeWidth={ink * 0.5} />
            <path d={star(rose.r, 0.17)} fill="var(--tm-paper)" strokeWidth={ink * 0.7} />
            <path d={`M0 ${-rose.r}L${rose.r * 0.17} ${-rose.r * 0.17}L0 0ZM0 ${rose.r}L${-rose.r * 0.17} ${rose.r * 0.17}L0 0ZM${rose.r} 0L${rose.r * 0.17} ${rose.r * 0.17}L0 0ZM${-rose.r} 0L${-rose.r * 0.17} ${-rose.r * 0.17}L0 0Z`} fill="var(--tm-route)" stroke="none" />
          </g>

          {/* rota: gidilen kısım dolu ve sıcak, kalan kısım soluk noktalı; ok yönü gösterir */}
          {geo.legs.map((leg, i) => {
            const walked = i + 1 <= unlocked
            const a = Math.max(2.4, 2.6 * u)
            const color = walked ? 'var(--tm-route)' : 'var(--tm-ink)'
            return (
              <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={walked ? 1 : 0.42}>
                {walked && <path d={leg.path} stroke="var(--tm-paper)" strokeWidth={ink * 3.4} opacity="0.7" />}
                <path d={leg.path} stroke={color} strokeWidth={walked ? ink * 1.7 : ink * 1.2} strokeDasharray={walked ? undefined : `0.1 ${3.6 * ink}`} />
                {leg.length > r * 4.2 && (
                  <path d={`M${-a} ${-a}L${a * 0.6} 0L${-a} ${a}`} transform={`translate(${leg.mx.toFixed(1)} ${leg.my.toFixed(1)}) rotate(${leg.angle.toFixed(0)})`} stroke={color} strokeWidth={ink * 1.5} />
                )}
              </g>
            )
          })}

          <rect width={W} height={H} filter={`url(#${uid}-grain)`} opacity="0.5" />
          <rect width={W} height={H} fill={`url(#${uid}-vignette)`} />
          <rect x={3 * u} y={3 * u} width={W - 6 * u} height={H - 6 * u} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 0.6} opacity="0.55" />
        </g>

        {/* etiketler düğümlerin altında kalır: rozet her zaman okunur */}
        <g aria-hidden="true" style={{ fontFamily: 'var(--font-pixel)' }}>
          {labels.map((p, i) => p.leader && <path key={i} d={p.leader} fill="none" stroke="var(--tm-ink)" strokeWidth={ink} opacity={i > unlocked ? 0.7 : 0.9} />)}
          {LEVELS.map((l, i) => (
            <text
              key={l.id}
              x={labels[i].x}
              y={labels[i].y}
              textAnchor="middle"
              fontSize={fs}
              fontWeight={i === selected ? 700 : 500}
              fill="var(--tm-ink)"
              opacity={i > unlocked ? 0.66 : 1}
              stroke="var(--tm-paper)"
              strokeWidth={fs * 0.28}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {l.name}
            </text>
          ))}
        </g>

        {LEVELS.map((l, i) => {
          const { x, y } = nodes[i]
          const locked = i > unlocked
          const on = i === selected
          const done = !!onSelect && i < unlocked
          const rr = on ? r * 1.14 : r
          const label = `${l.name}${locked ? ` (${words.locked})` : done ? ` (${words.done})` : ''}`
          const badge = (
            <>
              {on && (
                <>
                  <circle className="tm-pulse" cx={x} cy={y} r={rr + 3 * u} fill="none" stroke="var(--tm-route)" strokeWidth={ink * 1.6} />
                  <circle cx={x} cy={y} r={rr + 3.4 * u} fill="var(--tm-gold)" opacity="0.55" />
                  <circle cx={x} cy={y} r={rr + 3.4 * u} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 0.8} strokeDasharray={`${2.2 * ink} ${2.2 * ink}`} />
                </>
              )}
              {!locked && <circle cx={x + 0.9 * u} cy={y + 1.5 * u} r={rr} fill="var(--tm-ink)" opacity="0.4" />}
              <circle
                cx={x}
                cy={y}
                r={rr}
                fill={locked ? 'var(--tm-land-far)' : done ? 'var(--tm-route)' : 'var(--tm-gold)'}
                stroke="var(--tm-ink)"
                strokeWidth={ink * 1.2}
                strokeDasharray={locked ? `${1.6 * ink} ${1.6 * ink}` : undefined}
              />
              {locked ? (
                <g transform={`translate(${x} ${y}) scale(${rr / 10})`} opacity="0.7">
                  <path d="M-2.8 -1v-2.2a2.8 2.8 0 0 1 5.6 0V-1" fill="none" stroke="var(--tm-ink)" strokeWidth="1.5" />
                  <rect x="-4.2" y="-1" width="8.4" height="6.2" rx="1" fill="var(--tm-ink)" />
                </g>
              ) : compact ? (
                done ? (
                  <path d={`M${x - rr * 0.48} ${y + rr * 0.02}l${rr * 0.34} ${rr * 0.36}l${rr * 0.62} ${-rr * 0.74}`} fill="none" stroke="var(--tm-paper)" strokeWidth={ink * 1.5} strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <circle cx={x} cy={y} r={rr * 0.34} fill="var(--tm-ink)" />
                )
              ) : (
                <text x={x} y={y + rr * 0.37} textAnchor="middle" fontSize={rr * 1.05} fontWeight="700" fill={done ? 'var(--tm-paper)' : 'var(--tm-ink)'} style={{ fontFamily: 'var(--font-mono)' }}>
                  {l.plate}
                </text>
              )}
              {done && !compact && (
                <g transform={`translate(${x + rr * 0.78} ${y - rr * 0.78})`}>
                  <circle r={rr * 0.42} fill="var(--tm-gold)" stroke="var(--tm-ink)" strokeWidth={ink * 0.7} />
                  <path d={`M${-rr * 0.2} 0l${rr * 0.14} ${rr * 0.15}l${rr * 0.26} ${-rr * 0.3}`} fill="none" stroke="var(--tm-ink)" strokeWidth={ink * 0.9} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </>
          )
          if (!onSelect) {
            return (
              <g key={l.id} role="img" aria-label={label}>
                {badge}
              </g>
            )
          }
          return (
            <g
              key={l.id}
              className="tm-node"
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-label={label}
              aria-disabled={locked}
              aria-pressed={on}
              onClick={(e) => pick(e, i)}
              onKeyDown={(e) => {
                if (locked || (e.key !== 'Enter' && e.key !== ' ')) return
                e.preventDefault()
                onSelect(i)
              }}
            >
              <circle cx={x} cy={y} r={hit} fill="transparent" />
              <circle className="tm-focus" cx={x} cy={y} r={rr + 5.5 * u} fill="none" stroke="var(--tm-ink)" strokeWidth={2.5 * u} />
              {badge}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
