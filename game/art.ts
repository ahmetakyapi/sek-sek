import type { CityKey } from './types'

/* ── Yardımcılar ──────────────────────────────────────────────── */
export type Ctx = CanvasRenderingContext2D

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

/** Piksel daire (kenar yumuşatmasız) */
export function disc(c: Ctx, cx: number, cy: number, r: number, color: string, top = false) {
  c.fillStyle = color
  for (let y = -r; y <= (top ? 0 : r); y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, r * r - y * y)))
    c.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1)
  }
}

/** Kubbe: yarım daire + alem */
export function dome(c: Ctx, cx: number, base: number, r: number, color: string, finial = true) {
  disc(c, cx, base, r, color, true)
  if (finial) {
    rect(c, cx, base - r - 4, 1, 4, color)
    rect(c, cx - 1, base - r - 5, 3, 1, color)
  }
}

export function minaret(c: Ctx, x: number, base: number, h: number, color: string, w = 3) {
  rect(c, x, base - h, w, h, color)
  rect(c, x - 1, base - h * 0.62, w + 2, 2, color) // şerefe
  rect(c, x - 1, base - h * 0.85, w + 2, 1, color)
  // külah
  for (let i = 0; i < 7; i++) rect(c, x + w / 2 - Math.max(0, (w + 1) / 2 - i / 3), base - h - i, Math.max(1, w + 1 - (i * 2) / 3), 1, color)
}

export function sprite(c: Ctx, rows: string[], pal: Record<string, string>, x: number, y: number, flip = false) {
  const w = rows[0].length
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]
    for (let i = 0; i < w; i++) {
      const ch = row[i]
      if (ch === '.' || ch === ' ') continue
      const col = pal[ch]
      if (!col) continue
      c.fillStyle = col
      c.fillRect(Math.round(x + (flip ? w - 1 - i : i)), Math.round(y + j), 1, 1)
    }
  }
}

/* ── Şehir stilleri ───────────────────────────────────────────── */
export interface CityStyle {
  sky: [string, string, string]
  sun: { x: number; y: number; r: number; color: string; glow: string } | null
  far: string
  mid: string
  near: string
  tileTop: string
  tile: string
  tileDark: string
  tileLight: string
  plank: string
  accent: string
  water: [string, string, string]
  spike: [string, string]
  weather: 'gulls' | 'dust' | 'petals' | 'leaves' | 'snow' | 'storm' | 'rain'
  enemyGround: string
  enemyFly: string
  animal: string
}

export const CITY: Record<CityKey, CityStyle> = {
  istanbul: {
    sky: ['#2b2350', '#b0577a', '#f2a65a'],
    sun: { x: 0.72, y: 0.58, r: 18, color: '#ffd38a', glow: 'rgba(255,190,120,0.25)' },
    far: '#6b4f7a',
    mid: '#4a3760',
    near: '#2f2444',
    tileTop: '#9aa3b5',
    tile: '#5d6478',
    tileDark: '#3c4052',
    tileLight: '#7f889c',
    plank: '#8a5a3a',
    accent: '#e8794a',
    water: ['#2e5d8a', '#1f3f66', '#9fd0e8'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'cat',
    enemyFly: 'gull',
    animal: 'cat',
  },
  kocaeli: {
    sky: ['#2a3f6e', '#c47a7a', '#f2c08a'],
    sun: { x: 0.3, y: 0.55, r: 16, color: '#ffe2a8', glow: 'rgba(255,200,150,0.25)' },
    far: '#8892b4',
    mid: '#5a5878',
    near: '#363450',
    tileTop: '#c9a08a',
    tile: '#9a5a48',
    tileDark: '#6a3a30',
    tileLight: '#b87460',
    plank: '#6a6a78',
    accent: '#e8794a',
    water: ['#2e6a98', '#1f4f78', '#b0dcf0'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cat',
  },
  izmir: {
    sky: ['#2c4f86', '#e98f6a', '#ffd6a0'],
    sun: { x: 0.18, y: 0.62, r: 18, color: '#ffe0a0', glow: 'rgba(255,190,130,0.28)' },
    far: '#7d87ad',
    mid: '#55618a',
    near: '#33405e',
    tileTop: '#e2dccd',
    tile: '#aaa292',
    tileDark: '#7a7466',
    tileLight: '#c6beac',
    plank: '#8a6a4a',
    accent: '#e86a4a',
    water: ['#2e78a8', '#1f5a86', '#b8e6f5'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'flamingo',
  },
  ankara: {
    sky: ['#3f6fae', '#9cc0e2', '#efe4cc'],
    sun: { x: 0.72, y: 0.3, r: 14, color: '#fff4cc', glow: 'rgba(255,240,200,0.28)' },
    far: '#c4ae84',
    mid: '#8c7a68',
    near: '#5a4c46',
    tileTop: '#c2b0a6',
    tile: '#8a6c66',
    tileDark: '#5c4844',
    tileLight: '#a6887e',
    plank: '#7a4a2a',
    accent: '#c8302a',
    water: ['#3c7aa0', '#2a5878', '#a8dcef'],
    spike: ['#9aa3b0', '#5a606c'],
    weather: 'leaves',
    enemyGround: 'goat',
    enemyFly: 'pigeon',
    animal: 'angora',
  },
  adana: {
    sky: ['#3f78b8', '#f0b070', '#ffe2a0'],
    sun: { x: 0.65, y: 0.3, r: 18, color: '#fff2b0', glow: 'rgba(255,220,140,0.32)' },
    far: '#c8a878',
    mid: '#9a7a5a',
    near: '#6a5040',
    tileTop: '#e8cfa0',
    tile: '#c4a070',
    tileDark: '#8a6a44',
    tileLight: '#dcbc8a',
    plank: '#8a5a34',
    accent: '#d9502a',
    water: ['#3a8a8a', '#256a6e', '#b8ecec'],
    spike: ['#e86a2a', '#8a3a1a'],
    weather: 'dust',
    enemyGround: 'scorpion',
    enemyFly: 'mosquito',
    animal: 'cat',
  },
  mardin: {
    sky: ['#3d6f9e', '#e9b07a', '#f7d9a4'],
    sun: { x: 0.2, y: 0.5, r: 16, color: '#fff0c2', glow: 'rgba(255,220,150,0.25)' },
    far: '#c9a27a',
    mid: '#b78655',
    near: '#8c613a',
    tileTop: '#f0cf95',
    tile: '#d4a868',
    tileDark: '#a87a45',
    tileLight: '#ecc684',
    plank: '#b07b45',
    accent: '#c8553d',
    water: ['#3c7aa0', '#2a5878', '#a8dcef'],
    spike: ['#5f6e3a', '#3b4625'],
    weather: 'dust',
    enemyGround: 'scorpion',
    enemyFly: 'gull',
    animal: 'cat',
  },
  malatya: {
    sky: ['#4f9bd6', '#9fd0ef', '#e7f3e0'],
    sun: { x: 0.8, y: 0.25, r: 14, color: '#fff6c8', glow: 'rgba(255,245,190,0.3)' },
    far: '#7aa7b8',
    mid: '#5f9a5a',
    near: '#3f7840',
    tileTop: '#6fbf4a',
    tile: '#8a5a3a',
    tileDark: '#66402a',
    tileLight: '#a8714a',
    plank: '#9b6b3e',
    accent: '#f28c28',
    water: ['#3a86b8', '#286490', '#b6e2f5'],
    spike: ['#3e5e2a', '#24381a'],
    weather: 'petals',
    enemyGround: 'scorpion',
    enemyFly: 'bee',
    animal: 'cat',
  },
  corum: {
    sky: ['#5a8fbf', '#d9b98a', '#efd9a8'],
    sun: { x: 0.55, y: 0.35, r: 15, color: '#fff3c4', glow: 'rgba(255,230,160,0.28)' },
    far: '#b39a72',
    mid: '#8f7552',
    near: '#6b5538',
    tileTop: '#c9b26a',
    tile: '#9a8a70',
    tileDark: '#6e6250',
    tileLight: '#b8a888',
    plank: '#8a6a44',
    accent: '#b5462f',
    water: ['#3c7aa0', '#2a5878', '#a8dcef'],
    spike: ['#6a5e4a', '#3e3628'],
    weather: 'leaves',
    enemyGround: 'scorpion',
    enemyFly: 'bee',
    animal: 'lion',
  },
  ordu: {
    sky: ['#46606e', '#86a2a6', '#cfdcd2'],
    sun: null,
    far: '#5c7e6c',
    mid: '#40624e',
    near: '#2a4436',
    tileTop: '#5aa04a',
    tile: '#5a4a3a',
    tileDark: '#3e3228',
    tileLight: '#7a6450',
    plank: '#6a5040',
    accent: '#d6403a',
    water: ['#2a5a6a', '#1c4250', '#a8d4dc'],
    spike: ['#3a5a2a', '#1e3216'],
    weather: 'rain',
    enemyGround: 'boar',
    enemyFly: 'gull',
    animal: 'cow',
  },
  sivas: {
    sky: ['#3a4a6e', '#8ea3c4', '#d8e2ee'],
    sun: null,
    far: '#a9b8d0',
    mid: '#6f7f9e',
    near: '#4b5874',
    tileTop: '#f4f8ff',
    tile: '#7b8091',
    tileDark: '#555a6a',
    tileLight: '#9a9fb0',
    plank: '#7a5a40',
    accent: '#3f8fc9',
    water: ['#4f8fb8', '#2f6890', '#d8f2ff'],
    spike: ['#dff3ff', '#8fc3e0'],
    weather: 'snow',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'kangal',
  },
  ardahan: {
    sky: ['#3a4a72', '#9aaccc', '#e4ecf6'],
    sun: { x: 0.25, y: 0.35, r: 12, color: '#fbfbf0', glow: 'rgba(240,245,255,0.3)' },
    far: '#b4c2da',
    mid: '#7a88a8',
    near: '#4c5670',
    tileTop: '#f6faff',
    tile: '#5a5868',
    tileDark: '#3c3a48',
    tileLight: '#77748a',
    plank: '#6a4a34',
    accent: '#4aa0d8',
    water: ['#6aa8cc', '#4a88b0', '#e4f6ff'],
    spike: ['#dff3ff', '#8fc3e0'],
    weather: 'snow',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'horse',
  },
  bayburt: {
    sky: ['#121628', '#2c3550', '#5a6782'],
    sun: { x: 0.78, y: 0.22, r: 11, color: '#f1ead2', glow: 'rgba(230,230,255,0.18)' },
    far: '#3a4560',
    mid: '#2a324a',
    near: '#1c2236',
    tileTop: '#e6edf7',
    tile: '#4e4a58',
    tileDark: '#34313d',
    tileLight: '#686373',
    plank: '#5e4634',
    accent: '#d9a441',
    water: ['#355f80', '#223f58', '#bfe6ff'],
    spike: ['#dff3ff', '#8fc3e0'],
    weather: 'storm',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'horse',
  },
}

/* ── Arka plan katmanları (bir kez çizilir, yatayda tekrarlanır) ── */
export const LAYER_W = 640
export const LAYER_H = 300

export interface Layers {
  far: HTMLCanvasElement
  mid: HTMLCanvasElement
  near: HTMLCanvasElement
}

function layer(draw: (c: Ctx) => void): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = LAYER_W
  cv.height = LAYER_H
  const c = cv.getContext('2d')!
  draw(c)
  return cv
}

function hills(c: Ctx, color: string, base: number, amp: number, freq: number, seed: number) {
  const r = rng(seed)
  const ph = r() * 10
  const ph2 = r() * 10
  for (let x = 0; x < LAYER_W; x++) {
    const t = (x / LAYER_W) * Math.PI * 2
    const h = base - amp * (0.6 * Math.sin(t * freq + ph) + 0.4 * Math.sin(t * freq * 2.3 + ph2))
    rect(c, x, h, 1, LAYER_H - h, color)
  }
}

function snowCaps(c: Ctx, color: string, base: number, amp: number, freq: number, seed: number) {
  const r = rng(seed)
  const ph = r() * 10
  const ph2 = r() * 10
  for (let x = 0; x < LAYER_W; x++) {
    const t = (x / LAYER_W) * Math.PI * 2
    const v = 0.6 * Math.sin(t * freq + ph) + 0.4 * Math.sin(t * freq * 2.3 + ph2)
    if (v > 0.45) {
      const h = base - amp * v
      rect(c, x, h, 1, Math.max(1, (v - 0.45) * 18), color)
    }
  }
}

function house(c: Ctx, x: number, base: number, w: number, h: number, color: string, win: string | null, r: () => number, roof: 'flat' | 'gable' = 'gable') {
  rect(c, x, base - h, w, h, color)
  if (roof === 'gable') {
    for (let i = 0; i < w / 2; i++) rect(c, x + i, base - h - i / 2, w - i * 2, 1, color)
  }
  if (win) {
    for (let wy = base - h + 3; wy < base - 4; wy += 6)
      for (let wx = x + 2; wx < x + w - 3; wx += 5) if (r() > 0.35) rect(c, wx, wy, 2, 3, win)
  }
}

function palm(c: Ctx, x: number, base: number, color: string) {
  for (let i = 0; i < 34; i++) rect(c, x + Math.round(Math.sin(i / 10) * 3), base - i, 3, 1, color)
  const tx = x + 3
  const ty = base - 34
  for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 0.6], [1, 0.6], [-0.4, -0.6], [0.4, -0.6]] as const)
    for (let k = 0; k < 14; k++) rect(c, tx + dx * k, ty + dy * k + (k * k) / 28, 2, 2, color)
}

export function buildLayers(city: CityKey): Layers {
  const s = CITY[city]
  const B = LAYER_H
  switch (city) {
    case 'istanbul':
      return {
        far: layer((c) => {
          // Anadolu yakası tepeleri + köprü
          hills(c, s.far, B - 70, 10, 2, 11)
          const by = B - 92
          rect(c, 120, by, 260, 2, s.far)
          for (const tx of [170, 330]) {
            rect(c, tx, by - 30, 3, 50, s.far)
            for (let i = 0; i < 80; i += 4) {
              const k = i / 80
              rect(c, tx - 80 + i, by - 30 + Math.round(k * k * 30), 1, 1, s.far)
              rect(c, tx + 3 + i, by - Math.round((1 - k) * (1 - k) * 30), 1, 1, s.far)
            }
          }
        }),
        mid: layer((c) => {
          const r = rng(34)
          const base = B - 60
          // tarihi yarımada silueti
          for (let x = 0; x < LAYER_W; x += 6 + Math.floor(r() * 8)) house(c, x, base, 8 + Math.floor(r() * 8), 10 + Math.floor(r() * 14), s.mid, null, r)
          // camiler
          for (const cx of [90, 330, 520]) {
            rect(c, cx - 26, base - 22, 52, 22, s.mid)
            dome(c, cx, base - 22, 16, s.mid)
            dome(c, cx - 20, base - 22, 7, s.mid, false)
            dome(c, cx + 20, base - 22, 7, s.mid, false)
            minaret(c, cx - 34, base, 58, s.mid)
            minaret(c, cx + 32, base, 58, s.mid)
            if (cx === 330) {
              minaret(c, cx - 44, base, 46, s.mid)
              minaret(c, cx + 42, base, 46, s.mid)
            }
          }
          // Galata Kulesi
          const gx = 220
          rect(c, gx, base - 70, 14, 70, s.mid)
          rect(c, gx - 2, base - 74, 18, 4, s.mid)
          for (let i = 0; i < 14; i++) rect(c, gx + i / 2, base - 74 - i, 14 - i, 1, s.mid)
          rect(c, gx + 6, base - 92, 2, 5, s.mid)
          // Kız Kulesi
          rect(c, 430, base + 18, 26, 6, s.mid)
          rect(c, 438, base + 2, 10, 16, s.mid)
          dome(c, 443, base + 2, 5, s.mid)
        }),
        near: layer((c) => {
          const r = rng(341)
          const base = B - 30
          for (let x = 0; x < LAYER_W; x += 14 + Math.floor(r() * 10)) house(c, x, base, 14 + Math.floor(r() * 10), 16 + Math.floor(r() * 26), s.near, 'rgba(255,200,120,0.55)', r)
          rect(c, 0, base, LAYER_W, 40, s.near)
        }),
      }
    case 'kocaeli':
      return {
        far: layer((c) => {
          // Kartepe: karlı dağlar, önünde körfez
          hills(c, s.far, B - 110, 30, 2, 41)
          snowCaps(c, '#f4f8ff', B - 110, 30, 2, 41)
          rect(c, 0, B - 78, LAYER_W, 78, '#3e6a98')
          for (let i = 0; i < 30; i++) rect(c, (i * 47) % LAYER_W, B - 74 + ((i * 13) % 30), 10 + (i % 3) * 6, 1, 'rgba(255,220,180,0.35)')
        }),
        mid: layer((c) => {
          const base = B - 62
          const r = rng(411)
          for (let x = 0; x < LAYER_W; x += 12 + Math.floor(r() * 8)) house(c, x, base, 10 + Math.floor(r() * 8), 10 + Math.floor(r() * 10), s.mid, null, r, 'flat')
          // SEKA: testere dişi çatılı fabrika ve bacalar
          rect(c, 120, base - 30, 120, 30, s.mid)
          for (let i = 0; i < 6; i++) for (let k = 0; k < 10; k++) rect(c, 120 + i * 20 + k, base - 30 - k, 1, k, s.mid)
          for (const bx of [140, 190, 230]) rect(c, bx, base - 78, 8, 50, s.mid)
          for (const bx of [140, 190, 230]) rect(c, bx - 1, base - 80, 10, 3, s.mid)
          // İzmit Saat Kulesi
          const tx = 420
          rect(c, tx - 6, base - 46, 12, 46, s.mid)
          rect(c, tx - 8, base - 52, 16, 6, s.mid)
          disc(c, tx, base - 38, 3, s.near)
          for (let i = 0; i < 8; i++) rect(c, tx - 7 + i, base - 52 - i, 14 - i * 2, 1, s.mid)
          // liman vinci
          rect(c, 540, base - 70, 4, 70, s.mid)
          rect(c, 520, base - 72, 60, 3, s.mid)
          rect(c, 576, base - 70, 1, 22, s.mid)
        }),
        near: layer((c) => {
          const r = rng(412)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 0; x < LAYER_W; x += 4) rect(c, x, base - 6, 1, 6, s.near)
          rect(c, 0, base - 7, LAYER_W, 1, s.near)
          for (let x = 30; x < LAYER_W; x += 90 + Math.floor(r() * 40)) {
            rect(c, x + 6, base - 14, 3, 14, s.near)
            disc(c, x + 7, base - 20, 9, s.near)
          }
        }),
      }
    case 'izmir':
      return {
        far: layer((c) => {
          // körfezin karşı yakası + Kadifekale tepesi
          hills(c, s.far, B - 74, 12, 2, 35)
          const r = rng(351)
          for (let x = 380; x < 560; x += 6) rect(c, x, B - 120 + Math.floor(r() * 6), 4, 40, s.far)
          for (let x = 400; x < 540; x += 22) rect(c, x, B - 150 + Math.floor(r() * 20), 8, 60, s.far) // Bayraklı kuleleri
        }),
        mid: layer((c) => {
          const r = rng(352)
          const base = B - 62
          for (let x = 0; x < LAYER_W; x += 10 + Math.floor(r() * 8)) house(c, x, base, 10 + Math.floor(r() * 8), 12 + Math.floor(r() * 12), s.mid, null, r, 'flat')
          // Saat Kulesi: kademeli, saatli, kubbeli
          const gx = 160
          rect(c, gx - 10, base - 10, 20, 10, s.mid)
          rect(c, gx - 7, base - 40, 14, 30, s.mid)
          rect(c, gx - 5, base - 58, 10, 18, s.mid)
          rect(c, gx - 4, base - 70, 8, 12, s.mid)
          dome(c, gx, base - 70, 5, s.mid)
          disc(c, gx, base - 50, 3, s.near)
          for (const k of [-9, 9]) rect(c, gx + k - 1, base - 44, 2, 34, s.mid)
          // Tarihi Asansör: tuğla kule + köprü
          const ax = 420
          rect(c, ax, base - 80, 14, 80, s.mid)
          rect(c, ax - 4, base - 92, 22, 12, s.mid)
          rect(c, ax + 18, base - 90, 30, 4, s.mid)
          for (let y = base - 76; y < base; y += 8) rect(c, ax + 3, y, 8, 2, s.near)
          // Konak Yalı Camii
          rect(c, 250, base - 12, 18, 12, s.mid)
          dome(c, 259, base - 12, 8, s.mid)
          minaret(c, 272, base, 30, s.mid, 2)
        }),
        near: layer((c) => {
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Kordon korkuluğu ve palmiyeler
          for (let x = 0; x < LAYER_W; x += 4) rect(c, x, base - 6, 1, 6, s.near)
          rect(c, 0, base - 7, LAYER_W, 1, s.near)
          for (let x = 20; x < LAYER_W; x += 70) palm(c, x, base, s.near)
        }),
      }
    case 'ankara':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 96, 14, 2, 6)
          // Anıtkabir: uzun sütunlu yapı tepede
          const ax = 140
          const top = B - 118
          rect(c, ax - 50, top + 10, 100, 8, s.mid)
          rect(c, ax - 36, top - 6, 72, 16, s.mid)
          rect(c, ax - 38, top - 9, 76, 3, s.mid)
          for (let i = -34; i < 34; i += 4) rect(c, ax + i, top - 4, 2, 13, s.far)
        }),
        mid: layer((c) => {
          // Kale tepesi
          const r = rng(61)
          const top = B - 96
          for (let x = 240; x < 420; x++) {
            const h = top + Math.abs(x - 330) * 0.35
            rect(c, x, h, 1, B - h, s.mid)
          }
          rect(c, 280, top - 14, 100, 14, s.mid)
          for (let x = 280; x < 380; x += 6) rect(c, x, top - 18, 3, 4, s.mid)
          for (const tx of [276, 318, 362]) rect(c, tx, top - 26, 12, 26, s.mid)
          for (let x = 250; x < 410; x += 9) house(c, x, top + 30 + Math.abs(x - 330) * 0.3, 8, 10, s.mid, null, r)
          // Atakule
          const ak = 520
          rect(c, ak - 3, B - 170, 6, 110, s.mid)
          rect(c, ak - 11, B - 182, 22, 12, s.mid)
          disc(c, ak, B - 182, 9, s.mid, true)
          rect(c, ak, B - 200, 1, 10, s.mid)
          hills(c, s.mid, B - 56, 4, 3, 62)
        }),
        near: layer((c) => {
          const r = rng(63)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Hamamönü cumbalı evleri
          for (let x = 0; x < LAYER_W; x += 34 + Math.floor(r() * 10)) {
            rect(c, x, base - 20, 24, 20, '#d9c8b0')
            rect(c, x - 3, base - 34, 30, 14, '#e8dcc6')
            rect(c, x - 3, base - 34, 30, 1, '#7a4a2a')
            rect(c, x - 3, base - 21, 30, 2, '#7a4a2a')
            for (let k = 0; k < 3; k++) rect(c, x + 1 + k * 9, base - 31, 5, 7, '#7a4a2a')
            for (let i = 0; i < 15; i++) rect(c, x - 4 + i * 2, base - 36 - Math.floor(i < 8 ? i / 2 : (15 - i) / 2), 2, 2, '#9a3a2a')
          }
        }),
      }
    case 'adana':
      return {
        far: layer((c) => {
          // Toroslar uzakta, önde Çukurova düzlüğü
          hills(c, s.far, B - 120, 22, 3, 1)
          rect(c, 0, B - 96, LAYER_W, 96, '#b89a6a')
        }),
        mid: layer((c) => {
          const base = B - 66
          // Seyhan ve Taşköprü kemerleri
          rect(c, 0, base, LAYER_W, 66, '#3a7a80')
          rect(c, 0, base - 14, LAYER_W, 6, s.mid)
          for (let x = 8; x < LAYER_W; x += 40) {
            rect(c, x, base - 8, 30, 8, s.mid)
            disc(c, x + 35, base, 8, '#3a7a80', true)
          }
          // Sabancı Merkez Camii: büyük kubbe ve altı minare
          const cx = 360
          rect(c, cx - 40, base - 44, 80, 30, s.mid)
          dome(c, cx, base - 44, 22, s.mid)
          dome(c, cx - 26, base - 44, 9, s.mid, false)
          dome(c, cx + 26, base - 44, 9, s.mid, false)
          for (const mx of [-58, -48, 46, 56]) minaret(c, cx + mx, base - 14, 72, s.mid)
          for (const mx of [-70, 68]) minaret(c, cx + mx, base - 14, 56, s.mid)
        }),
        near: layer((c) => {
          const r = rng(12)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // portakal bahçeleri ve palmiyeler
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 12)) {
            rect(c, x + 5, base - 10, 3, 10, '#4a3020')
            disc(c, x + 6, base - 16, 8, '#3f6a34')
            for (let i = 0; i < 5; i++) rect(c, x + Math.floor(r() * 12), base - 22 + Math.floor(r() * 12), 2, 2, '#f2a030')
          }
          for (let x = 60; x < LAYER_W; x += 160) palm(c, x, base, s.near)
        }),
      }
    case 'mardin':
      return {
        far: layer((c) => {
          // Mezopotamya ovası: dümdüz ufuk
          rect(c, 0, B - 120, LAYER_W, 120, s.far)
          const r = rng(47)
          for (let i = 0; i < 40; i++) rect(c, r() * LAYER_W, B - 118 + r() * 60, 20 + r() * 40, 1, 'rgba(255,240,210,0.25)')
        }),
        mid: layer((c) => {
          // teras teras taş evler
          const r = rng(470)
          for (let row = 0; row < 6; row++) {
            const base = B - 70 - row * 16 + (row % 2) * 4
            for (let x = (row * 23) % 30; x < LAYER_W; x += 18 + Math.floor(r() * 10)) {
              const w = 14 + Math.floor(r() * 10)
              rect(c, x, base - 14, w, 14 + row * 3, s.mid)
              // kemerli pencere
              rect(c, x + 3, base - 10, 3, 5, s.near)
              rect(c, x + 4, base - 11, 1, 1, s.near)
              if (w > 18) {
                rect(c, x + 10, base - 10, 3, 5, s.near)
                rect(c, x + 11, base - 11, 1, 1, s.near)
              }
            }
          }
          // Zinciriye / Kasımiye kubbeleri + Ulu Cami minaresi
          const base = B - 166
          rect(c, 380, base - 12, 40, 12, s.mid)
          dome(c, 392, base - 12, 7, s.mid)
          dome(c, 408, base - 12, 7, s.mid)
          minaret(c, 300, B - 120, 70, s.mid, 5)
        }),
        near: layer((c) => {
          const r = rng(4701)
          const base = B - 26
          for (let x = 0; x < LAYER_W; x += 20 + Math.floor(r() * 10)) {
            const w = 18 + Math.floor(r() * 12)
            const h = 18 + Math.floor(r() * 20)
            rect(c, x, base - h, w, h, s.near)
            // abbara kemeri
            if (r() > 0.6) {
              disc(c, x + w / 2, base - 8, 5, '#6d4a2b', true)
              rect(c, x + w / 2 - 5, base - 8, 11, 8, '#6d4a2b')
            }
          }
          rect(c, 0, base, LAYER_W, 40, s.near)
        }),
      }
    case 'malatya':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 120, 28, 3, 44)
          snowCaps(c, '#e8f1f6', B - 120, 28, 3, 44)
        }),
        mid: layer((c) => {
          hills(c, s.mid, B - 70, 14, 2, 440)
          const r = rng(441)
          // bahçe sıraları: kayısı ağaçları
          for (let x = 4; x < LAYER_W; x += 12) {
            const t = (x / LAYER_W) * Math.PI * 2
            const y = B - 70 - 14 * (0.6 * Math.sin(t * 2 + 0) + 0.4 * Math.sin(t * 4.6)) + 8 + r() * 4
            disc(c, x, y, 4, '#4f8a45')
            if (r() > 0.3) rect(c, x - 2 + Math.floor(r() * 4), y - 1 + Math.floor(r() * 3), 1, 1, '#f39a2e')
            if (r() > 0.4) rect(c, x - 1 + Math.floor(r() * 3), y - 2 + Math.floor(r() * 3), 1, 1, '#f7b04a')
          }
        }),
        near: layer((c) => {
          const r = rng(4402)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 0; x < LAYER_W; x += 26 + Math.floor(r() * 12)) {
            rect(c, x + 6, base - 14, 3, 14, '#3b2a1e')
            disc(c, x + 7, base - 20, 10, s.near)
            for (let i = 0; i < 8; i++) rect(c, x + Math.floor(r() * 16) - 1, base - 28 + Math.floor(r() * 14), 2, 2, '#f28c28')
          }
        }),
      }
    case 'corum':
      return {
        far: layer((c) => hills(c, s.far, B - 100, 16, 2, 19)),
        mid: layer((c) => {
          hills(c, s.mid, B - 64, 10, 3, 190)
          // Hattuşa surları ve kuleler
          const base = B - 70
          rect(c, 0, base - 10, LAYER_W, 10, s.mid)
          for (let x = 0; x < LAYER_W; x += 40) {
            rect(c, x, base - 22, 14, 22, s.mid)
            for (let i = 0; i < 14; i += 4) rect(c, x + i, base - 25, 2, 3, s.mid)
          }
          // Aslanlı Kapı: parabolik kemer
          const gx = 300
          rect(c, gx - 22, base - 34, 44, 34, s.mid)
          for (let y = 0; y < 26; y++) {
            const hw = Math.round(8 * Math.sqrt(y / 26))
            rect(c, gx - hw, base - 26 + y, hw * 2, 1, s.far)
          }
        }),
        near: layer((c) => {
          const r = rng(1902)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // yıkık temel duvarları
          for (let x = 0; x < LAYER_W; x += 30 + Math.floor(r() * 30)) {
            const w = 20 + Math.floor(r() * 30)
            const h = 4 + Math.floor(r() * 10)
            rect(c, x, base - h, w, h, s.near)
            for (let i = 0; i < w; i += 7) rect(c, x + i, base - h - 1 - Math.floor(r() * 3), 5, 2, s.near)
          }
        }),
      }
    case 'ordu':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 120, 40, 3, 52)
          rect(c, 0, B - 74, LAYER_W, 74, '#2f5866')
          for (let i = 0; i < 26; i++) rect(c, (i * 53) % LAYER_W, B - 70 + ((i * 11) % 40), 14 + (i % 3) * 8, 1, 'rgba(220,240,240,0.35)')
        }),
        mid: layer((c) => {
          // Boztepe ve teleferik hattı
          const r = rng(521)
          for (let x = 0; x < LAYER_W; x++) {
            const h = B - 70 - Math.max(0, 70 - Math.abs(x - 470) * 0.5)
            rect(c, x, h, 1, B - h, s.mid)
          }
          for (let x = 60; x < 470; x += 2) rect(c, x, B - 120 - (x - 60) * 0.08, 2, 1, '#2a3a30')
          for (const cx of [160, 300]) {
            const y = B - 120 - (cx - 60) * 0.08
            rect(c, cx, y, 1, 6, '#2a3a30')
            rect(c, cx - 5, y + 6, 11, 8, '#d6403a')
            rect(c, cx - 4, y + 8, 9, 3, '#cfe8f0')
          }
          // fındık bahçesi sıraları
          for (let row = 0; row < 4; row++) for (let x = (row * 13) % 20; x < 360; x += 14) disc(c, x, B - 60 + row * 10 + Math.floor(r() * 3), 5, '#3a6a3a')
          // Yason Burnu kilisesi
          rect(c, 560, B - 92, 20, 18, s.mid)
          for (let i = 0; i < 8; i++) rect(c, 560 + i * 1.2, B - 92 - i, 20 - i * 2.4, 1, s.mid)
          rect(c, 569, B - 108, 2, 8, s.mid)
          rect(c, 566, B - 105, 8, 2, s.mid)
        }),
        near: layer((c) => {
          const r = rng(522)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 0; x < LAYER_W; x += 16 + Math.floor(r() * 10)) {
            disc(c, x + 8, base - 8, 9, s.near)
            for (let i = 0; i < 4; i++) rect(c, x + 2 + Math.floor(r() * 12), base - 14 + Math.floor(r() * 8), 2, 2, '#8a5a2a')
          }
        }),
      }
    case 'sivas':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 120, 34, 3, 58)
          snowCaps(c, '#f4f8ff', B - 120, 34, 3, 58)
        }),
        mid: layer((c) => {
          const base = B - 70
          hills(c, s.mid, base + 6, 6, 2, 580)
          // Çifte Minareli Medrese: taç kapı + iki minare
          const gx = 200
          rect(c, gx - 30, base - 30, 60, 30, s.mid)
          rect(c, gx - 10, base - 44, 20, 44, s.mid)
          rect(c, gx - 5, base - 26, 10, 26, s.near)
          disc(c, gx, base - 26, 5, s.near, true)
          for (const mx of [gx - 10, gx + 7]) {
            rect(c, mx, base - 82, 4, 40, s.mid)
            rect(c, mx - 1, base - 70, 6, 2, s.mid)
          }
          // Divriği kubbeli yapı
          rect(c, 460, base - 20, 50, 20, s.mid)
          for (let i = 0; i < 12; i++) rect(c, 466 + i, base - 20 - i, 38 - i * 2, 1, s.mid)
          // kümbet
          rect(c, 360, base - 26, 14, 26, s.mid)
          for (let i = 0; i < 9; i++) rect(c, 360 + i * 0.8, base - 26 - i, 14 - i * 1.6, 1, s.mid)
        }),
        near: layer((c) => {
          const r = rng(5802)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 0; x < LAYER_W; x += 18 + Math.floor(r() * 14)) {
            // karlı çam
            const h = 18 + Math.floor(r() * 14)
            for (let i = 0; i < h; i++) {
              const hw = Math.floor((i / h) * 7)
              rect(c, x - hw, base - h + i, hw * 2 + 1, 1, s.near)
              if (i % 5 === 1) rect(c, x - hw, base - h + i, hw * 2 + 1, 1, '#c9d6ea')
            }
          }
        }),
      }
    case 'ardahan':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 110, 26, 2, 75)
          snowCaps(c, '#f8fbff', B - 110, 26, 2, 75)
          // donmuş Çıldır Gölü
          rect(c, 0, B - 84, LAYER_W, 84, '#cfe2f2')
          for (let i = 0; i < 24; i++) rect(c, (i * 61) % LAYER_W, B - 80 + ((i * 17) % 40), 18 + (i % 4) * 8, 1, '#a8c8e2')
        }),
        mid: layer((c) => {
          const base = B - 70
          // kayalık üstünde Şeytan Kalesi
          for (let x = 380; x < 560; x++) {
            const h = base - 40 + Math.abs(x - 470) * 0.45
            rect(c, x, h, 1, B - h, s.mid)
          }
          rect(c, 430, base - 62, 80, 22, s.mid)
          for (let x = 430; x < 510; x += 6) rect(c, x, base - 66, 3, 4, s.mid)
          rect(c, 440, base - 80, 14, 18, s.mid)
          rect(c, 488, base - 74, 12, 12, s.mid)
          // atlı kızak gölge silueti
          rect(c, 120, base + 30, 30, 3, s.mid)
          rect(c, 116, base + 33, 38, 1, s.mid)
          rect(c, 156, base + 20, 14, 8, s.mid)
          rect(c, 166, base + 14, 4, 8, s.mid)
          rect(c, 158, base + 28, 2, 6, s.mid)
          rect(c, 166, base + 28, 2, 6, s.mid)
        }),
        near: layer((c) => {
          const r = rng(752)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // ahşap köy evleri, bacadan duman
          for (let x = 0; x < LAYER_W; x += 40 + Math.floor(r() * 20)) {
            rect(c, x, base - 14, 22, 14, '#5a4030')
            for (let i = 0; i < 12; i++) rect(c, x - 2 + i, base - 14 - Math.floor(i / 2), 26 - i * 2, 1, '#e6edf7')
            rect(c, x + 4, base - 10, 3, 4, 'rgba(255,200,110,0.75)')
            rect(c, x + 16, base - 24, 3, 6, '#3a2a20')
            for (let k = 0; k < 4; k++) rect(c, x + 16 + k, base - 28 - k * 3, 3, 2, 'rgba(230,236,245,0.5)')
          }
        }),
      }
    case 'bayburt':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 120, 40, 2, 69)
          snowCaps(c, '#9aa9c6', B - 120, 40, 2, 69)
        }),
        mid: layer((c) => {
          // kale sırtı + surlar
          hills(c, s.mid, B - 80, 26, 1, 690)
          const r = rng(691)
          for (let x = 0; x < LAYER_W; x += 2) {
            const t = (x / LAYER_W) * Math.PI * 2
            const v = 0.6 * Math.sin(t + r() * 0) + 0.4 * Math.sin(t * 2.3)
            if (x > 200 && x < 470) {
              const top = B - 80 - 26 * v
              rect(c, x, top - 8, 2, 8, s.mid)
              if ((x / 2) % 3 === 0) rect(c, x, top - 10, 2, 2, s.mid)
            }
          }
          for (const tx of [230, 300, 380, 450]) {
            const t = (tx / LAYER_W) * Math.PI * 2
            const top = B - 80 - 26 * (0.6 * Math.sin(t) + 0.4 * Math.sin(t * 2.3))
            rect(c, tx, top - 22, 12, 22, s.mid)
            for (let i = 0; i < 12; i += 4) rect(c, tx + i, top - 25, 2, 3, s.mid)
          }
        }),
        near: layer((c) => {
          const r = rng(6902)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 16)) {
            const w = 12 + Math.floor(r() * 8)
            const h = 10 + Math.floor(r() * 8)
            rect(c, x, base - h, w, h, s.near)
            rect(c, x - 1, base - h - 2, w + 2, 2, '#d8e2f0')
            if (r() > 0.5) rect(c, x + 3, base - h + 3, 2, 3, 'rgba(255,200,110,0.7)')
          }
        }),
      }
  }
}

/* ── Düşmanlar ────────────────────────────────────────────────── */
export const ENEMY_ART: Record<string, { frames: string[][]; pal: Record<string, string> }> = {
  gull: {
    pal: { w: '#f4f4f0', g: '#9aa3b0', o: '#f0a030', e: '#1d1a22' },
    frames: [
      ['g..........g', 'gg........gg', '.gg.wwww.gg.', '..gwwwwwwg..', '...wwwwwwoo.', '....we......', '............', '............'],
      ['............', '............', '....wwww....', '.ggwwwwwwgg.', 'gg.wwwwwwoog', 'g...we.....g', '............', '............'],
    ],
  },
  bee: {
    pal: { y: '#f2c230', k: '#2a2220', w: 'rgba(230,245,255,0.8)', e: '#1d1a22' },
    frames: [
      ['...ww.ww....', '...ww.ww....', '..yykyykyy..', '.yykyykyyye.', '.yykyykyyy..', '..yykyykk...', '............', '............'],
      ['............', '..ww...ww...', '..yykyykyy..', '.yykyykyyye.', '.yykyykyyy..', '..yykyykk...', '............', '............'],
    ],
  },
  raven: {
    pal: { k: '#1b1a24', g: '#3a3850', o: '#c9a24a', e: '#e8e2d0' },
    frames: [
      ['k..........k', 'kk........kk', '.kk.kkkk.kk.', '..kkkkkkek..', '...kkkkkkoo.', '....kk......', '............', '............'],
      ['............', '............', '....kkkk....', '.kkkkkkkekk.', 'kk.kkkkkkook', 'k...kk.....k', '............', '............'],
    ],
  },
  mosquito: {
    pal: { k: '#2a2430', g: '#5a5468', w: 'rgba(220,235,255,0.75)', r: '#c8302a' },
    frames: [
      ['..ww..ww....', '...ww.ww....', '....kkk.....', 'r..kgkkk....', '.rrkkkkkk...', '...k.k.k....', '..k..k..k...', '............'],
      ['............', '.ww....ww...', '..wwkkkww...', 'r..kgkkk....', '.rrkkkkkk...', '..k..k..k...', '.k...k...k..', '............'],
    ],
  },
  frog: {
    pal: { g: '#5aa83a', G: '#3a7a24', y: '#e8e070', e: '#1d1a22', w: '#f4efe6', r: '#c8302a' },
    frames: [
      ['............', '..ww....ww..', '.gweg..gweg.', '.gggggggggg.', 'gGgggyyggggG', 'gGggyyyyggGg', '.GG.gggg.GG.', 'GG..GGGG..GG', '............', '............'],
      ['..ww....ww..', '.gweg..gweg.', '.gggggggggg.', 'gGgggyyggggG', 'gGggyyyyggGg', '.GGgggggggG.', '..GG....GG..', '.GG......GG.', '............', '............'],
    ],
  },
  hare: {
    pal: { w: '#f4f6fa', W: '#c8d0dc', p: '#e8a0b0', e: '#1d1a22' },
    frames: [
      ['..w.w.......', '..wpwp......', '..wwww......', '.wwewww.....', '.wwwwwwwww..', '..wwwwwwwwW.', '..WwwwwwwW..', '..W.W..W.W..', '............', '............'],
      ['..w.w.......', '..wpwp......', '..wwww......', '.wwewww.....', '.wwwwwwwww..', '..wwwwwwwwW.', '.W.WwwwwW.W.', 'W...W..W...W', '............', '............'],
    ],
  },
  ram: {
    pal: { w: '#e8e0cc', W: '#b8ac90', h: '#8a6a3a', H: '#5a4022', e: '#c8302a', k: '#2a2420' },
    frames: [
      ['.hhh..........', 'hHHhh.........', 'hHkHwwwwwwww..', '.hkewwwwwwwwww', '..kwwwwwwwwwwW', '...wwwwwwwwwW.', '...W.W...W.W..', '...k.k...k.k..', '..............', '..............', '..............', '..............'],
      ['.hhh..........', 'hHHhh.........', 'hHkHwwwwwwww..', '.hkewwwwwwwwww', '..kwwwwwwwwwwW', '...wwwwwwwwwW.', '..W..W.W...W..', '..k...k.k..k..', '..............', '..............', '..............', '..............'],
    ],
  },
  bat: {
    pal: { k: '#2a1e34', K: '#4a3a5a', r: '#e84a4a', w: '#f4efe6' },
    frames: [
      ['k..........k', 'kk...kk...kk', 'kKk.kkkk.kKk', '.kKkkrkrkKk.', '..kkkkkkkk..', '....kwwk....', '............', '............'],
      ['............', '.....kk.....', '....kkkk....', 'kKkkkrkrkkKk', 'kk.kkkkkk.kk', 'k...kwwk...k', '............', '............'],
    ],
  },
  hedgehog: {
    pal: { b: '#6a4a30', B: '#3a2618', s: '#d8c8a8', e: '#1d1a22', n: '#2a2020', w: '#f4efe6' },
    frames: [
      ['..B.B.B.B...', '.BbBbBbBbB..', 'BbBbBbBbBbB.', 'BbbbbbbbbBss', 'BbbbbbbbbsesB', '.BbbbbbbbsssN', '..s.s..s.s..', '............', '............'],
      ['...B.B.B.B..', '.BbBbBbBbB..', 'BbBbBbBbBbB.', 'BbbbbbbbbBss', 'BbbbbbbbbsesB', '.BbbbbbbbsssN', '.s..s.s...s.', '............', '............'],
    ],
  },
  boar: {
    pal: { b: '#5a4030', B: '#3a2a20', w: '#f4efe6', e: '#e8c84a', k: '#1d1a22' },
    frames: [
      ['.B..........', 'BBbbbbbbbB..', 'kebbbbbbbbB.', 'wbbbbbbbbbbB', '.wbbbbbbbbB.', '..B.B..B.B..', '..k.k..k.k..', '............', '............', '............'],
      ['.B..........', 'BBbbbbbbbB..', 'kebbbbbbbbB.', 'wbbbbbbbbbbB', '.wbbbbbbbbB.', '.B..B.B...B.', '.k...k.k..k.', '............', '............', '............'],
    ],
  },
  crab: {
    pal: { r: '#e0503a', R: '#a8302a', e: '#1d1a22', w: '#f4efe6' },
    frames: [
      ['r........r', 'rr......rr', '.rr.ee.rr.', '..rrwwrr..', '.rrrrrrrr.', 'rRrrrrrrRr', '.R.R..R.R.', '..........'],
      ['.r......r.', 'rr......rr', 'r.r.ee.r.r', '..rrwwrr..', '.rrrrrrrr.', 'rRrrrrrrRr', 'R.R....R.R', '..........'],
    ],
  },
  pigeon: {
    pal: { g: '#8a90a6', G: '#5c6278', w: '#c8ccd8', p: '#7ab08a', o: '#e0a040', e: '#1d1a22' },
    frames: [
      ['G..........G', 'GG........GG', '.GG.gggg.GG.', '..gggppgeg..', '...ggggggoo.', '....gw......', '............', '............'],
      ['............', '............', '....gggg....', '.GGgggppgeG.', 'GG.ggggggooG', 'G...gw.....G', '............', '............'],
    ],
  },
  goat: {
    pal: { w: '#f0eae0', W: '#c8bea8', h: '#8a7a5a', e: '#1d1a22', k: '#3a2a20' },
    frames: [
      ['h.h.........', '.hh.........', 'wewwwwwww...', 'wwwwwwwwww..', '.kWwwwwwwW..', '..W.W..W.W..', '..k.k..k.k..', '............', '............', '............'],
      ['h.h.........', '.hh.........', 'wewwwwwww...', 'wwwwwwwwww..', '.kWwwwwwwW..', '.W..W.W...W.', '.k...k.k..k.', '............', '............', '............'],
    ],
  },
  scorpion: {
    pal: { a: '#7a4a1e', A: '#a8682c', e: '#f4e2b0' },
    frames: [
      ['.........aa.', '........a..a', '........a...', '.......aa...', 'a..AAAAAa...', 'aaAAAAAAAA..', '.aAeAAAAAa..', 'a.a.a.a.a...', '............', '............'],
      ['.........aa.', '........a..a', '.......aa...', '.......a....', '.a.AAAAAa...', 'aaAAAAAAAA..', 'a.AeAAAAAa..', '.a.a.a.a.a..', '............', '............'],
    ],
  },
  wolf: {
    pal: { g: '#8a8f9e', G: '#5d6170', w: '#e6e8ee', e: '#f2d34a', k: '#1d1a22' },
    frames: [
      ['g.g.........', 'gggg........', 'gegggggggg..', 'kgwgggggggg.', '..GgggggggGg', '..G.G..G.G..', '..G.G..G.G..', '............', '............', '............'],
      ['g.g.........', 'gggg........', 'gegggggggg..', 'kgwgggggggg.', '..GgggggggGg', '.G..G.G...G.', '.G...G.G..G.', '............', '............', '............'],
    ],
  },
}

const SNOWY: CityKey[] = ['sivas', 'ardahan', 'bayburt']

export function enemyArt(kind: 'ground' | 'fly' | 'hopper' | 'charger' | 'bat' | 'spiky', city: CityKey) {
  const s = CITY[city]
  if (kind === 'hopper') return SNOWY.includes(city) ? ENEMY_ART.hare : ENEMY_ART.frog
  if (kind === 'charger') return ENEMY_ART.ram
  if (kind === 'bat') return ENEMY_ART.bat
  if (kind === 'spiky') return ENEMY_ART.hedgehog
  return ENEMY_ART[kind === 'ground' ? s.enemyGround : s.enemyFly] ?? ENEMY_ART.scorpion
}

/* ── Hatıralar (toplanabilir) ─────────────────────────────────── */
export const ITEM_ART: Record<CityKey, { rows: string[]; pal: Record<string, string> }> = {
  istanbul: {
    pal: { b: '#b8692e', B: '#8a4a1e', s: '#f6e7c0' },
    rows: ['...bbbb...', '..bsbbsb..', '.bb....bb.', '.b......b.', '.bs....sb.', '.b......b.', '.bb....bB.', '..bsbbsB..', '...BBBB...', '..........'],
  },
  kocaeli: {
    pal: { w: '#fbf6ec', W: '#e6d8bc', p: '#e88aa0', P: '#b85a70' },
    rows: ['..........', '.PPPPPPPP.', '.PppppppP.', '.PwWwWwWP.', '.PWwWwWwP.', '.PwWwWwWP.', '.PWwWwWwP.', '.PppppppP.', '.PPPPPPPP.', '..........'],
  },
  adana: {
    pal: { w: '#ffffff', W: '#d8dce4', g: '#6a8a3a', b: '#7a5030' },
    rows: ['...w.ww...', '..wwwwww..', '.wwWwwwww.', 'wwwwwWwwww', 'wWwwwwwWww', '.wwwWwwww.', '..gwwwwg..', '.gg.bb.gg.', '....bb....', '....bb....'],
  },
  ardahan: {
    pal: { g: '#e3b03a', G: '#a8781e', k: '#2a2220', r: '#c8302a' },
    rows: ['....rr....', '....GG....', '...gggg...', '..gggggg..', '..gGgggg..', '.gGgggggg.', '.gGggggggG', 'GGGGGGGGGG', '....kk....', '..........'],
  },
  izmir: {
    pal: { b: '#e0a040', B: '#a86a20', y: '#ffd27a', d: '#7a4a18' },
    rows: ['..........', '...bbbb...', '..byyyBb..', '.byBBBybB.', '.bBydyBbB.', '.bByddBbB.', '.bbByyBBb.', '..bBBBBb..', '...bbbb...', '..........'],
  },
  ankara: {
    pal: { w: '#f8f4ec', W: '#d8d0c4', g: '#b8ae9e', b: '#7a6a5a' },
    rows: ['...w.ww...', '..wwwwww..', '.wwWwwWww.', 'wwWwwwwWww', 'wWwwgwwwWw', 'wwwWwwgwww', '.wWwwwWww.', '..wwgWww..', '...wwww...', '....bb....'],
  },
  mardin: {
    pal: { s: '#e6ebf2', S: '#9aa6b8', g: '#7fd0e0' },
    rows: ['....ss....', '...s..s...', '..s.SS.s..', '.s.S..S.s.', 's.S.gg.S.s', '.s.S..S.s.', '..s.SS.s..', '...s..s...', '....ss....', '..........'],
  },
  malatya: {
    pal: { o: '#f39a2e', O: '#d9741a', y: '#ffc65a', g: '#4f9a3a', b: '#5a3a1e' },
    rows: ['.....b.g..', '.....bgg..', '...oooo...', '..oyyooo..', '.oyyoooOo.', '.ooooooOo.', '.oooooOOo.', '..ooOOOo..', '...oooo...', '..........'],
  },
  corum: {
    pal: { c: '#f2e2b4', C: '#cdb37a', d: '#a88a52' },
    rows: ['..........', '..cc..cc..', '.ccCccccC.', '.cCdcCCdc.', '..cc.ccc..', '.cc.cc.cc.', 'ccCcCCcCCc', '.cdc.cdc..', '..........', '..........'],
  },
  ordu: {
    pal: { b: '#a8682c', B: '#7a4418', l: '#d89a5a', g: '#5a9a3a', G: '#3a6a24' },
    rows: ['...gGg....', '..gGGgg...', '...Gg.....', '...bbbb...', '..blllbb..', '.bllbbbbB.', '.blbbbbbB.', '.bbbbbbBB.', '..BbbbBB..', '...BBBB...'],
  },
  sivas: {
    pal: { g: '#d9a441', G: '#a87a22', k: '#2a2220', w: '#e8d6a8' },
    rows: ['...gggg...', '..gGGGGg..', '.gGwwwwGg.', '.gGkwwkGg.', '.gGwkkwGg.', '.gGwwwwGg.', '..gGGGGg..', '...gggg...', '....gg....', '...g..g...'],
  },
  bayburt: {
    pal: { w: '#a8693a', W: '#7a4a24', s: '#f0e2c0', k: '#2a2220' },
    rows: ['........kk', '.......ks.', '......ws..', '.....ws...', '..wwwWs...', '.wwkkwW....', 'wwkkkkwW..', 'wwwkkwwW..', '.wwwwWW...', '..WWWW....'],
  },
}
