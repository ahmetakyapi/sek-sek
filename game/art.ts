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
  trabzon: {
    sky: ['#3c5468', '#7e98a0', '#c8d6d0'],
    sun: null,
    far: '#7c9690',
    mid: '#4e6a62',
    near: '#2c4440',
    tileTop: '#6aa04a',
    tile: '#5c6670',
    tileDark: '#3a424c',
    tileLight: '#78828c',
    plank: '#6a4a32',
    accent: '#d6403a',
    water: ['#2e6a7a', '#1e4a58', '#a8d8e0'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'rain',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cow',
  },
  canakkale: {
    sky: ['#3a6ea8', '#8fc0e0', '#f4e6c0'],
    sun: { x: 0.78, y: 0.4, r: 15, color: '#fff2c8', glow: 'rgba(255,236,170,0.26)' },
    far: '#8fa6c0',
    mid: '#5e7896',
    near: '#3a5270',
    tileTop: '#ece2c8',
    tile: '#b8a888',
    tileDark: '#8a7a5e',
    tileLight: '#d4c6a4',
    plank: '#8a6240',
    accent: '#d6403a',
    water: ['#2e78a8', '#1f5a86', '#b8e6f5'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cat',
  },
  sinop: {
    sky: ['#34587a', '#7ea6c0', '#d8e4e0'],
    sun: null,
    far: '#6e8ea0',
    mid: '#44647a',
    near: '#2a4256',
    tileTop: '#6aa04a',
    tile: '#6a6e78',
    tileDark: '#444852',
    tileLight: '#8a8e98',
    plank: '#6a4a32',
    accent: '#e8a23a',
    water: ['#2a6a86', '#1c4c66', '#a8d8e8'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'rain',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cow',
  },
  diyarbakir: {
    sky: ['#5a4a7a', '#e09a6a', '#f6d6a0'],
    sun: { x: 0.24, y: 0.56, r: 17, color: '#ffe6b0', glow: 'rgba(255,200,130,0.28)' },
    far: '#b08a6a',
    mid: '#7a5a4a',
    near: '#4a3a36',
    tileTop: '#8e8a96',
    tile: '#56525e',
    tileDark: '#34303c',
    tileLight: '#76727e',
    plank: '#8a5a35',
    accent: '#e04a3a',
    water: ['#3c8a7a', '#2a6658', '#a8e0d0'],
    spike: ['#c9ced8', '#5c5868'],
    weather: 'dust',
    enemyGround: 'scorpion',
    enemyFly: 'pigeon',
    animal: 'partridge',
  },
  edirne: {
    sky: ['#4a6ea0', '#a8c4d8', '#f2e2c0'],
    sun: { x: 0.7, y: 0.42, r: 15, color: '#fff2c8', glow: 'rgba(255,236,170,0.26)' },
    far: '#9aaec0',
    mid: '#6a86a0',
    near: '#3e5a74',
    tileTop: '#7ab04e',
    tile: '#b4a48a',
    tileDark: '#86785e',
    tileLight: '#d0c2a6',
    plank: '#8a6240',
    accent: '#d6403a',
    water: ['#4a8a9a', '#2e6a7a', '#b8e6e8'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'leaves',
    enemyGround: 'frog',
    enemyFly: 'mosquito',
    animal: 'cat',
  },
  bursa: {
    sky: ['#3a7a6a', '#9ad0b0', '#eef2c8'],
    sun: { x: 0.22, y: 0.4, r: 14, color: '#fffbd8', glow: 'rgba(250,250,190,0.24)' },
    far: '#86b09a',
    mid: '#4e8a6e',
    near: '#2e5e48',
    tileTop: '#6aa84a',
    tile: '#a8a090',
    tileDark: '#787264',
    tileLight: '#c6beac',
    plank: '#7a5a3a',
    accent: '#e8794a',
    water: ['#3a8a8a', '#266a6a', '#b8e8e0'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'leaves',
    enemyGround: 'lizard',
    enemyFly: 'bee',
    animal: 'cat',
  },
  antalya: {
    sky: ['#2a70b8', '#7ac0e8', '#fde8b8'],
    sun: { x: 0.8, y: 0.36, r: 17, color: '#fff6c8', glow: 'rgba(255,240,170,0.3)' },
    far: '#8ab0d0',
    mid: '#5a86b0',
    near: '#346088',
    tileTop: '#e8d8b0',
    tile: '#d0a878',
    tileDark: '#a07a50',
    tileLight: '#e8c898',
    plank: '#9a6a3e',
    accent: '#f08a2a',
    water: ['#1e88c0', '#1668a0', '#b8ecf8'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cat',
  },
  sanliurfa: {
    sky: ['#6a5a86', '#e8a870', '#fadca8'],
    sun: { x: 0.2, y: 0.52, r: 17, color: '#ffe8b4', glow: 'rgba(255,206,136,0.28)' },
    far: '#caa47c',
    mid: '#b08456',
    near: '#7e5a36',
    tileTop: '#f2d49a',
    tile: '#d8b074',
    tileDark: '#a87c48',
    tileLight: '#f0cc8c',
    plank: '#9a6a3a',
    accent: '#c8302a',
    water: ['#3e8aa0', '#2a6680', '#a8e0ec'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'dust',
    enemyGround: 'scorpion',
    enemyFly: 'pigeon',
    animal: 'partridge',
  },
  van: {
    sky: ['#2e4a86', '#7aa0d8', '#e8eef8'],
    sun: { x: 0.74, y: 0.44, r: 15, color: '#fffbe8', glow: 'rgba(240,244,255,0.26)' },
    far: '#9ab0d0',
    mid: '#6682ac',
    near: '#3e5682',
    tileTop: '#e8eef4',
    tile: '#7a7480',
    tileDark: '#4e4a56',
    tileLight: '#9a94a0',
    plank: '#6a4a32',
    accent: '#3aa0c8',
    water: ['#2a8ac0', '#1c68a0', '#c8f0fc'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'gulls',
    enemyGround: 'snake',
    enemyFly: 'gull',
    animal: 'vanCat',
  },
  erzurum: {
    sky: ['#3a4a6e', '#8a9ec0', '#e4ecf6'],
    sun: null,
    far: '#a8b6cc',
    mid: '#7486a4',
    near: '#465674',
    tileTop: '#f4f9ff',
    tile: '#6e7686',
    tileDark: '#444c5c',
    tileLight: '#8e96a6',
    plank: '#5e4634',
    accent: '#e04a3a',
    water: ['#3a7ab0', '#285a90', '#c8e8fc'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'snow',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'horse',
  },
  konya: {
    sky: ['#34386a', '#d4866a', '#f6d49a'],
    sun: { x: 0.66, y: 0.6, r: 18, color: '#ffe2a6', glow: 'rgba(255,205,150,0.25)' },
    far: '#a08eaa',
    mid: '#6c6084',
    near: '#3e3656',
    tileTop: '#e0cca2',
    tile: '#ac8a5e',
    tileDark: '#6e5434',
    tileLight: '#ccaa7a',
    plank: '#2f9a94',
    accent: '#3fb8a8',
    water: ['#3a7a9a', '#24566e', '#a8d8e8'],
    spike: ['#e0d6c4', '#7a6e5e'],
    weather: 'petals',
    enemyGround: 'snake',
    enemyFly: 'raven',
    animal: 'cat',
  },
  nevsehir: {
    sky: ['#2c4c8c', '#e8a07a', '#ffe2b4'],
    sun: { x: 0.24, y: 0.7, r: 16, color: '#fff0c4', glow: 'rgba(255,220,170,0.3)' },
    far: '#dcae92',
    mid: '#b8826c',
    near: '#7a5048',
    tileTop: '#f4dcbc',
    tile: '#d8a87e',
    tileDark: '#9a6a4e',
    tileLight: '#f0c898',
    plank: '#8a5a3a',
    accent: '#e8604a',
    water: ['#3a6a8a', '#244a66', '#a8d0e8'],
    spike: ['#ecdcc4', '#8a6a50'],
    weather: 'dust',
    enemyGround: 'lizard',
    enemyFly: 'pigeon',
    animal: 'horse',
  },
  gaziantep: {
    sky: ['#38284a', '#c8604a', '#f2b060'],
    sun: { x: 0.8, y: 0.56, r: 18, color: '#ffd890', glow: 'rgba(255,180,110,0.28)' },
    far: '#a87a6a',
    mid: '#7a5050',
    near: '#4a3038',
    tileTop: '#e8d2aa',
    tile: '#c09870',
    tileDark: '#7a5a3a',
    tileLight: '#dcbc8c',
    plank: '#b8682e',
    accent: '#d8862e',
    water: ['#3a6a8a', '#244a66', '#a8d0e8'],
    spike: ['#ecc890', '#8a5a30'],
    weather: 'dust',
    enemyGround: 'rat',
    enemyFly: 'wasp',
    animal: 'partridge',
  },
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
    enemyGround: 'crab',
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
    enemyGround: 'lizard',
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
    case 'trabzon':
      return {
        far: layer((c) => {
          // sisli, sık ormanlı dağlar; zirvede bulut
          hills(c, s.far, B - 130, 46, 3, 61)
          for (let i = 0; i < 24; i++) rect(c, (i * 71) % LAYER_W, B - 150 + ((i * 17) % 40), 40 + (i % 3) * 20, 3, 'rgba(230,240,240,0.35)')
        }),
        mid: layer((c) => {
          const r = rng(611)
          const base = B - 56
          // çay terasları: yamaçta yatay şeritler
          for (let row = 0; row < 5; row++) for (let x = 0; x < LAYER_W; x += 6) rect(c, x, base - 40 - row * 10 + Math.round(Math.sin((x + row * 30) / 40) * 3), 4, 3, '#3e5e48')
          // Sümela: dik kayalığa oyulmuş manastır, pencere sıraları
          rect(c, 420, base - 120, 70, 120, '#3e4e4a')
          rect(c, 430, base - 92, 50, 34, '#c8b898')
          for (let i = 0; i < 6; i++) rect(c, 434 + i * 8, base - 86, 3, 5, '#3a2a24')
          for (let i = 0; i < 6; i++) rect(c, 434 + i * 8, base - 74, 3, 5, '#3a2a24')
          rect(c, 428, base - 96, 54, 4, '#8a6a4a')
          // Karadeniz evleri: beyaz duvar, kırmızı kiremit, ahşap balkon
          for (let x = 0; x < LAYER_W; x += 26 + Math.floor(r() * 16)) {
            if (x > 400 && x < 500) continue
            const h = 14 + Math.floor(r() * 12)
            rect(c, x, base - h, 18, h, '#d8d4c8')
            for (let i = 0; i < 9; i++) rect(c, x - 1 + i, base - h - i / 2, 20 - i * 2, 1, '#a8402a')
            rect(c, x + 2, base - h + 6, 14, 1, '#6a4a32')
            rect(c, x + 4, base - h + 3, 3, 3, '#3a3a40')
            rect(c, x + 11, base - h + 3, 3, 3, '#3a3a40')
          }
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(612)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // çay çalıları: yuvarlak, sıra sıra
          for (let x = 0; x < LAYER_W; x += 9) disc(c, x + 4, base - 3 - Math.floor(r() * 2), 5, '#2e5236')
          for (let x = 0; x < LAYER_W; x += 9) rect(c, x + 2, base - 7, 2, 1, '#5a8a4a')
        }),
      }
    case 'canakkale':
      return {
        far: layer((c) => {
          // Boğaz'ın karşı yakası: Gelibolu sırtları, tepede Şehitler Abidesi
          hills(c, s.far, B - 78, 10, 2, 171)
          const ax = 430
          for (const k of [0, 9, 18, 27]) rect(c, ax + k, B - 128, 4, 40, s.far)
          rect(c, ax - 3, B - 132, 37, 5, s.far)
        }),
        mid: layer((c) => {
          const r = rng(172)
          const base = B - 58
          for (let x = 0; x < LAYER_W; x += 11 + Math.floor(r() * 9)) house(c, x, base, 10 + Math.floor(r() * 8), 10 + Math.floor(r() * 10), s.mid, null, r)
          // Saat Kulesi: beş katlı, saatli
          const gx = 150
          rect(c, gx - 6, base - 46, 12, 46, s.mid)
          rect(c, gx - 4, base - 58, 8, 12, s.mid)
          for (let i = 0; i < 5; i++) rect(c, gx - 4 + i, base - 62 - i, 8 - i * 2, 1, s.mid)
          disc(c, gx, base - 38, 3, s.near)
          // Truva atı: iskelede duran tahta at
          const hx = 330
          rect(c, hx, base - 30, 30, 16, s.mid)
          rect(c, hx + 2, base - 14, 4, 14, s.mid)
          rect(c, hx + 24, base - 14, 4, 14, s.mid)
          rect(c, hx + 24, base - 46, 8, 18, s.mid)
          rect(c, hx + 28, base - 50, 12, 8, s.mid)
          for (let i = 0; i < 5; i++) rect(c, hx + 22, base - 46 + i * 3, 3, 2, s.near)
          rect(c, hx - 4, base - 28, 5, 2, s.mid)
          // Çimenlik Kalesi: alçak, mazgallı
          rect(c, 480, base - 20, 90, 20, s.mid)
          for (let x = 480; x < 570; x += 8) rect(c, x, base - 24, 5, 4, s.mid)
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kordon korkuluğu, feribot iskelesi babaları
          for (let x = 0; x < LAYER_W; x += 5) rect(c, x, base - 5, 1, 5, s.near)
          rect(c, 0, base - 6, LAYER_W, 1, s.near)
          for (let x = 30; x < LAYER_W; x += 90) {
            rect(c, x, base - 10, 5, 10, s.near)
            rect(c, x - 1, base - 11, 7, 2, s.near)
          }
        }),
      }
    case 'sinop':
      return {
        far: layer((c) => {
          // Boztepe yarımadası denize uzanır; ucunda İnceburun feneri
          hills(c, s.far, B - 84, 16, 2, 571)
          rect(c, 520, B - 126, 5, 34, s.far)
          rect(c, 518, B - 130, 9, 5, s.far)
          for (let i = 0; i < 18; i++) rect(c, (i * 83) % LAYER_W, B - 140 + ((i * 19) % 36), 36 + (i % 3) * 18, 3, 'rgba(228,238,240,0.3)')
        }),
        mid: layer((c) => {
          const r = rng(572)
          const base = B - 56
          // kırmızı kiremitli evler
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 14)) {
            const h = 12 + Math.floor(r() * 10)
            rect(c, x, base - h, 16, h, '#c8ccc4')
            for (let i = 0; i < 8; i++) rect(c, x - 1 + i, base - h - i / 2, 18 - i * 2, 1, '#a8442e')
            rect(c, x + 3, base - h + 4, 3, 3, '#34404a')
            rect(c, x + 10, base - h + 4, 3, 3, '#34404a')
          }
          // Sinop Kalesi: denize inen sur, kare burçlar
          rect(c, 180, base - 26, 220, 26, s.mid)
          for (let x = 180; x < 400; x += 7) rect(c, x, base - 30, 4, 4, s.mid)
          for (const tx of [180, 250, 330, 392]) {
            rect(c, tx - 4, base - 42, 16, 42, s.mid)
            for (let k = 0; k < 3; k++) rect(c, tx - 4 + k * 6, base - 46, 4, 4, s.mid)
          }
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(573)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // balıkçı tekneleri: direk ve gövde
          for (let x = 40; x < LAYER_W; x += 110 + Math.floor(r() * 30)) {
            rect(c, x, base - 6, 26, 5, s.near)
            rect(c, x + 3, base - 1, 20, 2, s.near)
            rect(c, x + 12, base - 24, 1, 18, s.near)
            rect(c, x + 13, base - 22, 7, 1, s.near)
            rect(c, x + 4, base - 9, 8, 3, s.near)
          }
        }),
      }
    case 'diyarbakir':
      return {
        far: layer((c) => {
          // Karacadağ: alçak, yayvan volkan
          hills(c, s.far, B - 70, 9, 1, 211)
          for (let i = 0; i < 90; i++) rect(c, 240 + i, B - 70 - 30 + Math.round(Math.abs(i - 45) * 0.6), 1, 34, s.far)
        }),
        mid: layer((c) => {
          const r = rng(212)
          const base = B - 56
          // bazalt surlar: yuvarlak burçlar, mazgallar
          rect(c, 0, base - 30, LAYER_W, 30, s.mid)
          for (let x = 0; x < LAYER_W; x += 7) rect(c, x, base - 34, 4, 4, s.mid)
          for (let x = 30; x < LAYER_W; x += 96) {
            rect(c, x - 9, base - 46, 22, 46, s.mid)
            disc(c, x + 2, base - 46, 11, s.mid, true)
            for (let k = 0; k < 3; k++) rect(c, x - 7 + k * 7, base - 60, 4, 4, s.mid)
            rect(c, x, base - 32, 3, 7, s.near)
          }
          // Ulu Cami'nin kare minaresi
          rect(c, 250, base - 84, 12, 40, s.mid)
          rect(c, 248, base - 88, 16, 4, s.mid)
          for (let i = 0; i < 6; i++) rect(c, 252 + i, base - 94 - i, 8 - i * 2 + 4, 1, s.mid)
          // Dört Ayaklı Minare
          rect(c, 440, base - 76, 10, 34, s.mid)
          for (const k of [0, 3, 6, 9]) rect(c, 440 + k, base - 44, 1, 8, s.mid)
          rect(c, 439, base - 80, 12, 4, s.mid)
          void r
        }),
        near: layer((c) => {
          const r = rng(213)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Hevsel Bahçeleri: kavaklar ve bostan
          for (let x = 0; x < LAYER_W; x += 14 + Math.floor(r() * 10)) {
            const h = 16 + Math.floor(r() * 14)
            rect(c, x + 2, base - h, 2, h, s.near)
            for (let i = 0; i < h - 4; i++) rect(c, x + 1 - (i % 3 === 0 ? 1 : 0), base - h + i, 4 + (i % 3 === 0 ? 2 : 0), 1, '#3a4a34')
          }
        }),
      }
    case 'edirne':
      return {
        far: layer((c) => {
          // Trakya ovası: alçak tepeler, ayçiçeği tarlaları
          hills(c, s.far, B - 66, 8, 2, 221)
          for (let i = 0; i < 60; i++) rect(c, (i * 37) % LAYER_W, B - 58 + ((i * 11) % 14), 2, 2, '#e8c84a')
        }),
        mid: layer((c) => {
          const r = rng(222)
          const base = B - 56
          for (let x = 0; x < LAYER_W; x += 12 + Math.floor(r() * 9)) house(c, x, base, 10 + Math.floor(r() * 8), 9 + Math.floor(r() * 9), s.mid, null, r)
          // Selimiye: koca kubbe, dört ince minare
          const sx = 300
          rect(c, sx - 34, base - 30, 68, 30, s.mid)
          dome(c, sx, base - 30, 26, s.mid)
          for (const k of [-22, 22]) dome(c, sx + k, base - 30, 9, s.mid, false)
          for (const k of [-44, -34, 34, 44]) minaret(c, sx + k, base, 92, s.mid, 3)
          // Meriç Köprüsü kemerleri
          rect(c, 470, base - 12, 150, 5, s.mid)
          for (let x = 474; x < 616; x += 24) {
            rect(c, x, base - 8, 6, 8, s.mid)
            disc(c, x + 15, base - 7, 8, s.near, true)
          }
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(223)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // ayçiçekleri
          for (let x = 4; x < LAYER_W; x += 11 + Math.floor(r() * 6)) {
            const h = 8 + Math.floor(r() * 8)
            rect(c, x, base - h, 1, h, '#2e4a34')
            disc(c, x, base - h, 2, '#e8c84a')
            rect(c, x, base - h, 1, 1, '#6a4a2a')
          }
        }),
      }
    case 'bursa':
      return {
        far: layer((c) => {
          // Uludağ: karlı zirve, yamaçta teleferik hattı
          hills(c, s.far, B - 96, 26, 1, 161)
          for (let i = 0; i < 180; i++) {
            const y = B - 156 + Math.round(Math.abs(i - 90) * 0.8)
            rect(c, 215 + i, y, 1, B - y, s.far)
            if (y < B - 128) rect(c, 215 + i, y, 1, Math.min(12, B - 126 - y + ((i * 7) % 5)), '#f4f8fa')
          }
          for (let x = 120; x < 300; x += 2) rect(c, x, B - 70 - Math.round((x - 120) * 0.4), 1, 1, 'rgba(40,60,50,0.6)')
          rect(c, 200, B - 100, 6, 5, '#d6403a')
        }),
        mid: layer((c) => {
          const r = rng(162)
          const base = B - 56
          // cumbalı Cumalıkızık evleri
          for (let x = 0; x < LAYER_W; x += 20 + Math.floor(r() * 12)) {
            const h = 14 + Math.floor(r() * 10)
            const col = ['#d8c8a0', '#c8a8b0', '#a8b8c8', '#e0d0a8'][Math.floor(r() * 4)]
            rect(c, x, base - h, 15, h, col)
            rect(c, x - 2, base - h + 4, 19, 6, col)
            for (let i = 0; i < 9; i++) rect(c, x - 2 + i, base - h - i / 2, 19 - i * 2, 1, '#8a4a34')
            rect(c, x + 2, base - h + 5, 3, 4, '#3a3440')
            rect(c, x + 10, base - h + 5, 3, 4, '#3a3440')
          }
          // Ulu Cami: çok kubbeli, iki minare
          rect(c, 250, base - 24, 80, 24, s.mid)
          for (let k = 0; k < 5; k++) dome(c, 258 + k * 16, base - 24, 7, s.mid, false)
          minaret(c, 244, base, 62, s.mid, 3)
          minaret(c, 334, base, 62, s.mid, 3)
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(163)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kestane ağaçları
          for (let x = 10; x < LAYER_W; x += 34 + Math.floor(r() * 16)) {
            rect(c, x + 5, base - 16, 3, 16, '#3a2a20')
            disc(c, x + 6, base - 20, 9, '#2e5e3a')
            disc(c, x + 2, base - 16, 6, '#3a7046')
          }
        }),
      }
    case 'antalya':
      return {
        far: layer((c) => {
          // Beydağları: denizin ardında sivri, mavi dağlar
          hills(c, s.far, B - 104, 30, 3, 71)
          rect(c, 0, B - 60, LAYER_W, 60, '#3a8ac8')
          for (let i = 0; i < 40; i++) rect(c, (i * 61) % LAYER_W, B - 56 + ((i * 7) % 30), 8 + (i % 3) * 4, 1, 'rgba(255,255,255,0.4)')
        }),
        mid: layer((c) => {
          const r = rng(72)
          const base = B - 56
          // falezler ve Kaleiçi: kırmızı kiremitli taş evler
          for (let x = 0; x < LAYER_W; x += 16 + Math.floor(r() * 10)) {
            const h = 12 + Math.floor(r() * 10)
            rect(c, x, base - h, 13, h, '#e8dcc4')
            for (let i = 0; i < 7; i++) rect(c, x - 1 + i, base - h - i / 2, 15 - i * 2, 1, '#b85a3a')
            rect(c, x + 4, base - h + 4, 4, 4, '#4a6a8a')
          }
          // Yivli Minare
          rect(c, 210, base - 70, 8, 70, '#b86a4a')
          for (let k = 0; k < 4; k++) rect(c, 210 + k * 2, base - 70, 1, 60, '#8a4a34')
          rect(c, 208, base - 74, 12, 4, '#8a4a34')
          rect(c, 212, base - 84, 4, 10, '#b86a4a')
          // Hadrian Kapısı: üç kemer
          rect(c, 400, base - 34, 66, 34, '#d8c8a8')
          for (const k of [6, 26, 46]) {
            rect(c, 400 + k, base - 20, 14, 20, s.near)
            disc(c, 407 + k, base - 20, 7, s.near, true)
          }
          rect(c, 398, base - 38, 70, 4, '#b8a888')
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 24; x < LAYER_W; x += 76) palm(c, x, base, s.near)
        }),
      }
    case 'sanliurfa':
      return {
        far: layer((c) => {
          // Harran ovası: düz ufuk, kümbet evler
          hills(c, s.far, B - 60, 6, 1, 631)
          for (let x = 60; x < 260; x += 16) {
            disc(c, x + 6, B - 62, 7, s.far, true)
            rect(c, x, B - 62, 13, 8, s.far)
            rect(c, x + 6, B - 72, 1, 3, s.far)
          }
        }),
        mid: layer((c) => {
          const r = rng(632)
          const base = B - 56
          for (let x = 0; x < LAYER_W; x += 12 + Math.floor(r() * 8)) house(c, x, base, 11 + Math.floor(r() * 8), 9 + Math.floor(r() * 10), s.mid, null, r, 'flat')
          // Balıklıgöl: revaklı cami, kubbe ve minare
          rect(c, 180, base - 18, 90, 18, s.mid)
          for (let x = 184; x < 266; x += 12) {
            rect(c, x, base - 12, 8, 12, s.near)
            disc(c, x + 4, base - 12, 4, s.near, true)
          }
          dome(c, 225, base - 18, 14, s.mid)
          minaret(c, 276, base, 56, s.mid, 3)
          // Urfa Kalesi'nin iki sütunu
          rect(c, 430, base - 30, 80, 30, s.mid)
          rect(c, 452, base - 62, 5, 32, s.mid)
          rect(c, 472, base - 62, 5, 32, s.mid)
          rect(c, 450, base - 65, 9, 3, s.mid)
          rect(c, 470, base - 65, 9, 3, s.mid)
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Göbeklitepe'nin T biçimli dikilitaşları
          for (let x = 30; x < LAYER_W; x += 84) {
            rect(c, x + 3, base - 22, 6, 22, s.near)
            rect(c, x, base - 26, 12, 5, s.near)
          }
        }),
      }
    case 'van':
      return {
        far: layer((c) => {
          // Süphan Dağı: karlı koni, önünde göl
          hills(c, s.far, B - 92, 18, 2, 651)
          for (let i = 0; i < 110; i++) rect(c, 360 + i, B - 160 + Math.round(Math.abs(i - 55) * 1.1), 1, 60, s.far)
          for (let i = 0; i < 50; i++) rect(c, 390 + i, B - 160 + Math.round(Math.abs(i - 25) * 1.1), 1, 8, '#f8fbff')
          rect(c, 0, B - 62, LAYER_W, 62, '#3a8ad0')
          for (let i = 0; i < 44; i++) rect(c, (i * 59) % LAYER_W, B - 58 + ((i * 7) % 32), 10 + (i % 3) * 5, 1, 'rgba(255,255,255,0.45)')
        }),
        mid: layer((c) => {
          const base = B - 56
          // Van Kalesi: uzun kayalığın üstünde surlar
          for (let x = 60; x < 330; x++) rect(c, x, base - 30 - Math.round(Math.sin(((x - 60) / 270) * Math.PI) * 26), 1, 60, s.mid)
          for (let x = 110; x < 290; x += 9) rect(c, x, base - 58 - Math.round(Math.sin(((x - 60) / 270) * Math.PI) * 4), 6, 8, s.mid)
          rect(c, 190, base - 76, 12, 18, s.mid)
          // Akdamar Adası ve kilisesi
          for (let x = 440; x < 560; x++) rect(c, x, base - 8 - Math.round(Math.sin(((x - 440) / 120) * Math.PI) * 14), 1, 30, s.mid)
          rect(c, 492, base - 36, 18, 14, '#d8b48a')
          for (let i = 0; i < 9; i++) rect(c, 496 + i / 2, base - 44 - i, 10 - i, 1, '#b8845a')
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // sazlıklar
          for (let x = 2; x < LAYER_W; x += 7) rect(c, x, base - 6 - ((x * 7) % 8), 1, 6 + ((x * 7) % 8), '#3a5a6a')
        }),
      }
    case 'erzurum':
      return {
        far: layer((c) => {
          // Palandöken: karlı sırtlar, kayak pistleri
          hills(c, '#e8eef6', B - 104, 26, 2, 251)
          hills(c, s.far, B - 74, 14, 3, 252)
          for (let i = 0; i < 60; i++) rect(c, 200 + i * 2, B - 150 + i, 2, 1, 'rgba(120,140,170,0.5)')
        }),
        mid: layer((c) => {
          const r = rng(253)
          const base = B - 56
          for (let x = 0; x < LAYER_W; x += 13 + Math.floor(r() * 9)) {
            const h = 10 + Math.floor(r() * 10)
            house(c, x, base, 11 + Math.floor(r() * 7), h, s.mid, null, r, 'flat')
            rect(c, x, base - h - 2, 12, 2, '#f4f9ff')
          }
          // Çifte Minareli Medrese: taç kapı, iki yivli minare
          rect(c, 260, base - 40, 70, 40, s.mid)
          rect(c, 284, base - 26, 22, 26, s.near)
          disc(c, 295, base - 26, 11, s.near, true)
          for (const k of [270, 316]) {
            rect(c, k, base - 92, 6, 52, '#8a5a4a')
            rect(c, k - 1, base - 96, 8, 4, '#3aa0b0')
            for (let i = 0; i < 6; i++) rect(c, k + i / 2, base - 102 - i, 6 - i, 1, s.mid)
          }
          rect(c, 258, base - 43, 74, 3, '#f4f9ff')
          // Üç Kümbetler
          for (const k of [470, 500, 530]) {
            rect(c, k, base - 22, 16, 22, s.mid)
            for (let i = 0; i < 12; i++) rect(c, k + i / 2 + 1, base - 22 - i, 14 - i, 1, s.mid)
          }
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(254)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, '#e8eef6')
          for (let x = 8; x < LAYER_W; x += 26 + Math.floor(r() * 14)) {
            const h = 16 + Math.floor(r() * 10)
            rect(c, x + 3, base - 4, 2, 4, '#3a2a20')
            for (let i = 0; i < h; i += 4) rect(c, x + 4 - (h - i) / 4, base - 4 - i, (h - i) / 2, 3, '#2e4a46')
            rect(c, x + 2, base - h - 2, 4, 2, '#f8fbff')
          }
        }),
      }
    case 'konya':
      return {
        far: layer((c) => {
          // bozkır: alçak, geniş tepeler; ufukta Takkeli Dağ
          hills(c, s.far, B - 66, 8, 1, 42)
          for (let i = 0; i < 40; i++) rect(c, 300 + i, B - 66 - 26 + Math.abs(i - 20), 1, 30, s.far)
        }),
        mid: layer((c) => {
          const r = rng(421)
          const base = B - 54
          for (let x = 0; x < LAYER_W; x += 10 + Math.floor(r() * 10)) house(c, x, base, 10 + Math.floor(r() * 10), 8 + Math.floor(r() * 10), s.mid, null, r, 'flat')
          // Mevlâna Türbesi: dilimli turkuaz külah
          const mx = 200
          rect(c, mx - 30, base - 18, 60, 18, s.mid)
          dome(c, mx - 18, base - 18, 8, s.mid, false)
          dome(c, mx + 18, base - 18, 8, s.mid, false)
          rect(c, mx - 7, base - 46, 14, 28, '#2f9a94')
          for (let i = 0; i < 14; i++) rect(c, mx - 7 + i / 2, base - 46 - i, 14 - i, 1, '#2f9a94')
          for (let k = 0; k < 4; k++) rect(c, mx - 6 + k * 4, base - 46, 1, 28, '#24807a')
          rect(c, mx - 1, base - 66, 2, 6, '#f2c14e')
          minaret(c, mx + 40, base, 50, s.mid)
          // Alaeddin Tepesi ve camisi
          for (let x = 380; x < 520; x++) rect(c, x, base - 10 - Math.round(Math.sin(((x - 380) / 140) * Math.PI) * 14), 1, 30, s.mid)
          rect(c, 420, base - 38, 50, 14, s.mid)
          dome(c, 445, base - 38, 7, s.mid)
          minaret(c, 476, base - 14, 34, s.mid)
        }),
        near: layer((c) => {
          const r = rng(422)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // buğday tarlası ve leylek yuvalı direkler
          for (let x = 0; x < LAYER_W; x += 2) rect(c, x, base - 3 - Math.floor(r() * 4), 1, 4, s.near)
          for (let x = 60; x < LAYER_W; x += 150 + Math.floor(r() * 50)) {
            rect(c, x, base - 46, 2, 46, s.near)
            rect(c, x - 5, base - 50, 12, 4, s.near)
            rect(c, x - 2, base - 56, 4, 6, s.near)
          }
        }),
      }
    case 'nevsehir':
      return {
        far: layer((c) => {
          // Erciyes ufukta, karlı
          hills(c, s.far, B - 80, 12, 2, 50)
          for (let i = 0; i < 70; i++) rect(c, 420 + i, B - 160 + Math.abs(i - 35) * 2, 1, 120, s.far)
          for (let i = 0; i < 20; i++) rect(c, 445 + i, B - 160 + Math.abs(i - 10) * 2, 1, 6, '#f6f2ec')
        }),
        mid: layer((c) => {
          const r = rng(501)
          const base = B - 50
          // peri bacaları: gövde + şapka taşı
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 26)) {
            const h = 30 + Math.floor(r() * 50)
            const w = 8 + Math.floor(r() * 6)
            for (let i = 0; i < h; i++) rect(c, x + Math.round((i / h) * 2), base - i, w - Math.round((i / h) * 4), 1, s.mid)
            rect(c, x - 2, base - h - 4, w + 2, 5, '#8a5a50')
            if (r() > 0.5) rect(c, x + 3, base - h / 2, 2, 3, '#4a2e2a')
          }
          // Uçhisar Kalesi
          for (let x = 560; x < 630; x++) rect(c, x, base - 70 + Math.abs(x - 595) * 1.2, 1, 90, s.mid)
          for (let i = 0; i < 6; i++) rect(c, 575 + i * 7, base - 50 + (i % 2) * 8, 3, 4, '#4a2e2a')
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(502)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          for (let x = 20; x < LAYER_W; x += 60 + Math.floor(r() * 40)) {
            // asma kütükleri ve kaya evlerin kapı-pencereleri
            rect(c, x, base - 8, 2, 8, s.near)
            rect(c, x - 3, base - 10, 8, 3, '#5a7a3a')
          }
        }),
      }
    case 'gaziantep':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 72, 10, 2, 27)
          // fıstık bahçeleri: yuvarlak ağaç sıraları
          for (let x = 0; x < LAYER_W; x += 16) disc(c, x + 6, B - 74 + ((x * 7) % 9), 6, '#8a7a5a')
        }),
        mid: layer((c) => {
          const r = rng(271)
          const base = B - 56
          for (let x = 0; x < LAYER_W; x += 10 + Math.floor(r() * 8)) house(c, x, base, 10 + Math.floor(r() * 8), 10 + Math.floor(r() * 16), s.mid, null, r, 'flat')
          // Gaziantep Kalesi: höyük üstünde yuvarlak burçlar
          for (let x = 60; x < 300; x++) rect(c, x, base - 14 - Math.round(Math.sin(((x - 60) / 240) * Math.PI) * 18), 1, 40, s.mid)
          rect(c, 100, base - 58, 160, 26, s.mid)
          for (const bx of [100, 150, 200, 250]) {
            rect(c, bx - 6, base - 70, 16, 40, s.mid)
            for (let k = 0; k < 16; k += 4) rect(c, bx - 6 + k, base - 74, 2, 4, s.mid)
          }
          // çarşı kubbeleri ve minare
          for (const cx of [380, 420, 460]) dome(c, cx, base - 16, 10, s.mid, false)
          rect(c, 360, base - 16, 120, 16, s.mid)
          minaret(c, 520, base, 54, s.mid)
        }),
        near: layer((c) => {
          const r = rng(272)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // bakırcı tezgâhları: asılı kazanlar
          for (let x = 30; x < LAYER_W; x += 80 + Math.floor(r() * 30)) {
            rect(c, x, base - 30, 40, 2, s.near)
            for (let k = 0; k < 4; k++) disc(c, x + 5 + k * 10, base - 22, 4, '#6a4a3a')
            rect(c, x, base - 30, 2, 30, s.near)
            rect(c, x + 38, base - 30, 2, 30, s.near)
          }
        }),
      }
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
          // Mardin Kalesi: şehrin tepesinde surlar ve beyaz radar kubbeleri
          const kb = B - 196
          for (let x = 120; x < 560; x++) rect(c, x, kb - Math.round(Math.sin(((x - 120) / 440) * Math.PI) * 10), 1, 30, s.mid)
          for (let x = 140; x < 540; x += 8) rect(c, x, kb - 14 - Math.round(Math.sin(((x - 120) / 440) * Math.PI) * 10), 4, 4, s.mid)
          dome(c, 330, kb - 18, 8, '#e8e4dc', false)
          dome(c, 352, kb - 16, 6, '#e8e4dc', false)
          rect(c, 322, kb - 18, 16, 4, '#e8e4dc')
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
        far: layer((c) => {
          hills(c, s.far, B - 100, 16, 2, 19)
          // Yazılıkaya: kaya açık hava tapınağının yuvarlak kaya kümeleri
          for (const [x, r] of [[80, 18], [104, 14], [122, 20], [380, 16], [402, 22]] as const) disc(c, x, B - 100, r, s.far)
        }),
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
          // aslanlar kapının iki yanında
          for (const lx of [gx - 20, gx + 12]) {
            rect(c, lx, base - 14, 8, 6, s.near)
            rect(c, lx + (lx < gx ? 6 : 0), base - 18, 3, 4, s.near)
          }
          // Çorum Saat Kulesi: kare gövde, kadranlı üst, kurşun külah
          const tx = 520
          rect(c, tx - 7, base - 78, 14, 78, s.mid)
          rect(c, tx - 9, base - 84, 18, 6, s.mid)
          disc(c, tx, base - 70, 4, '#e8dcc0')
          rect(c, tx, base - 72, 1, 2, '#3a2a24')
          rect(c, tx, base - 70, 2, 1, '#3a2a24')
          dome(c, tx, base - 84, 8, s.mid)
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

/* ── Düşmanlar: tür adları (çizimleri enemyDraw.ts) ───────────── */
const SNOWY: CityKey[] = ['sivas', 'ardahan', 'bayburt', 'erzurum']

/** Haritadaki düşman türünün o şehirdeki hayvanı (enemyDraw ve rehber aynı adı kullanır). */
export function enemySpecies(kind: 'ground' | 'fly' | 'hopper' | 'charger' | 'bat' | 'spiky' | 'magpie', city: CityKey): string {
  if (kind === 'magpie') return 'magpie'
  if (kind === 'hopper') return SNOWY.includes(city) ? 'hare' : 'frog'
  if (kind === 'charger') return 'ram'
  if (kind === 'bat') return 'bat'
  if (kind === 'spiky') return 'hedgehog'
  return kind === 'ground' ? CITY[city].enemyGround : CITY[city].enemyFly
}

export const CREATURE_NAMES: Record<string, string> = {
  gull: 'Martı', bee: 'Arı', raven: 'Kuzgun', mosquito: 'Sivrisinek', frog: 'Kurbağa', hare: 'Tavşan', ram: 'Koç', bat: 'Yarasa',
  hedgehog: 'Kirpi', boar: 'Yaban Domuzu', crab: 'Yengeç', pigeon: 'Güvercin', goat: 'Keçi', scorpion: 'Akrep', wolf: 'Kurt',
  snake: 'Yılan', lizard: 'Kertenkele', rat: 'Fare', wasp: 'Eşek Arısı', magpie: 'Saksağan',
  cat: 'Sokak Kedisi', flamingo: 'Flamingo', angora: 'Ankara Keçisi', vanCat: 'Van Kedisi', lion: 'Hitit Aslanı', cow: 'İnek', kangal: 'Kangal', horse: 'At', partridge: 'Keklik',
}
