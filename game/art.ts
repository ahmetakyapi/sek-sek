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
  kayseri: {
    // Erciyes’in karlı silueti, bazalt taş, Selçuklu kırmızısı
    sky: ['#4a5a86', '#a4b0d0', '#f2e8da'],
    sun: { x: 0.72, y: 0.34, r: 14, color: '#fff2d0', glow: 'rgba(255,240,210,0.18)' },
    far: '#b8bccc',
    mid: '#80829a',
    near: '#4c4c60',
    tileTop: '#d6cec2',
    tile: '#5e5a66',
    tileDark: '#3a3642',
    tileLight: '#7e7886',
    plank: '#6a4a30',
    accent: '#c8302a',
    water: ['#4a8ab8', '#2e6a98', '#d0ecfa'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'snow',
    enemyGround: 'lizard',
    enemyFly: 'raven',
    animal: 'horse',
  },
  hatay: {
    // sıcak güney akşamı, kireçtaşı, defne yeşili
    sky: ['#e89a62', '#f4cc9c', '#fff2da'],
    sun: { x: 0.22, y: 0.5, r: 16, color: '#fff4cc', glow: 'rgba(255,230,180,0.2)' },
    far: '#d6b494',
    mid: '#ae8868',
    near: '#785844',
    tileTop: '#e8d8b6',
    tile: '#c6a67e',
    tileDark: '#8a6a4a',
    tileLight: '#dec29a',
    plank: '#7a5234',
    accent: '#d6403a',
    water: ['#3a9ab0', '#2a7a90', '#d0f0f4'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'petals',
    enemyGround: 'scorpion',
    enemyFly: 'wasp',
    animal: 'cat',
  },
  eskisehir: {
    // açık gök, Porsuk mavisi, Odunpazarı’nın renkli cepheleri, tuğla
    sky: ['#68a6d6', '#b6daf0', '#f2f8ea'],
    sun: { x: 0.8, y: 0.3, r: 13, color: '#fff8d6', glow: 'rgba(255,250,220,0.18)' },
    far: '#a6c2c8',
    mid: '#7898a2',
    near: '#4c6876',
    tileTop: '#78b65a',
    tile: '#b06a4a',
    tileDark: '#7a4434',
    tileLight: '#cc8a66',
    plank: '#6a4a30',
    accent: '#e8794a',
    water: ['#4aa8c8', '#2e88a8', '#d4f2fa'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'leaves',
    enemyGround: 'rat',
    enemyFly: 'pigeon',
    animal: 'cat',
  },
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
  amasya: {
    // Yeşilırmak yeşili, Harşena’nın gri kayası, yalıboyu evlerinin ahşabı
    sky: ['#5a8ea8', '#a8cfd0', '#eef2dc'],
    sun: { x: 0.24, y: 0.3, r: 13, color: '#fff6d2', glow: 'rgba(255,246,214,0.18)' },
    far: '#82928c',
    mid: '#6e7c78',
    near: '#46564c',
    tileTop: '#b8b4a4',
    tile: '#7a7a78',
    tileDark: '#4e4e52',
    tileLight: '#9a9a94',
    plank: '#7a5234',
    accent: '#c8402e',
    water: ['#4a9a7a', '#2e7a5e', '#d2f2e0'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'leaves',
    enemyGround: 'snake',
    enemyFly: 'raven',
    animal: 'cat',
  },
  mugla: {
    // Ege mavisi, beyaz badana, begonvil pembesi (far / mid / near: katmanların dibindeki deniz tonları)
    sky: ['#3e94d8', '#9cd4f0', '#f4fbff'],
    sun: { x: 0.78, y: 0.26, r: 15, color: '#fffbe0', glow: 'rgba(255,252,224,0.2)' },
    far: '#3d9cd6',
    mid: '#3aa6d4',
    near: '#2f8cc4',
    tileTop: '#f6f2e6',
    tile: '#d8cdb8',
    tileDark: '#9a8e7a',
    tileLight: '#ece4d2',
    plank: '#7a5a3a',
    accent: '#d8408a',
    water: ['#2e9ad0', '#1a78b0', '#d6f4ff'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'petals',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'turtle',
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
    case 'eskisehir':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 92, 16, 2, 901)
          // Sazova Masal Şatosu: sivri külahlı kuleler
          const sx = 440
          rect(c, sx - 30, B - 120, 60, 120, s.far)
          for (let x = sx - 30; x < sx + 30; x += 6) rect(c, x, B - 124, 3, 4, s.far)
          for (const [dx, w, h] of [[-34, 10, 52], [-12, 8, 62], [6, 12, 76], [28, 10, 54]] as const) {
            rect(c, sx + dx, B - 90 - h, w, h + 90, s.far)
            for (let i = 0; i < w * 1.6; i++) rect(c, sx + dx - 1 + i * 0.36, B - 90 - h - i, w + 2 - i * 0.72, 1, '#8aa6b6')
            rect(c, sx + dx + w / 2 - 1, B - 90 - h + 8, 2, 4, '#6a8aa0')
          }
        }),
        mid: layer((c) => {
          const r = rng(902)
          const base = B - 62
          // Odunpazarı: renkli, cumbalı, kiremit çatılı evler
          const colors = ['#e8a8a0', '#f0d48a', '#a8cce0', '#b8d8a0', '#e8b890', '#d8b8e0']
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 8)) {
            if (x > 300 && x < 380) continue
            const h = 18 + Math.floor(r() * 8)
            const col = colors[Math.floor(r() * colors.length)]
            rect(c, x + 2, base - h, 14, h, col)
            rect(c, x, base - h + 3, 18, 8, col)
            rect(c, x, base - h + 11, 18, 1, '#6a4a34')
            for (let i = 0; i < 10; i++) rect(c, x - 1 + i, base - h - i / 2, 20 - i * 2, 1, '#b0503a')
            rect(c, x + 3, base - h + 5, 3, 4, '#3a3440')
            rect(c, x + 12, base - h + 5, 3, 4, '#3a3440')
            rect(c, x + 7, base - 6, 4, 6, '#5a3a2a')
          }
          // Porsuk Çayı, kemerli yaya köprüsü ve gondol
          rect(c, 0, base, LAYER_W, 16, s.water[1])
          for (let x = 0; x < LAYER_W; x += 19) rect(c, x + ((x * 5) % 9), base + 5 + ((x * 3) % 8), 7, 1, s.water[2])
          const bx = 340
          for (let x = bx - 36; x < bx + 36; x++) {
            const d = (x - bx) / 36
            const top = base - 12 + Math.round(d * d * 8)
            rect(c, x, top, 1, 3, '#d8d0c0')
            if ((x - bx) % 6 === 0) rect(c, x, top - 5, 1, 5, '#d8d0c0')
          }
          rect(c, bx - 36, base - 10, 72, 1, '#d8d0c0')
          const gx = 200
          rect(c, gx - 12, base + 4, 24, 3, '#3a2a30')
          rect(c, gx - 14, base + 2, 3, 3, '#3a2a30')
          rect(c, gx + 11, base + 1, 3, 4, '#3a2a30')
          rect(c, gx - 4, base + 1, 8, 3, '#c83a34')
          rect(c, gx + 6, base - 10, 2, 12, '#3a2a30')
          disc(c, gx + 7, base - 12, 2, '#3a2a30')
          rect(c, gx + 5, base - 15, 5, 1, '#e8d8a0')
          rect(c, gx + 9, base - 8, 1, 14, '#6a4a34')
          rect(c, 0, base + 16, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(903)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kıyı korkuluğu ve sarkık dallı söğütler
          for (let x = 0; x < LAYER_W; x += 6) rect(c, x, base - 5, 1, 5, s.near)
          rect(c, 0, base - 6, LAYER_W, 1, s.near)
          for (let x = 14; x < LAYER_W; x += 44 + Math.floor(r() * 24)) {
            rect(c, x + 4, base - 16, 3, 16, '#3a3a34')
            disc(c, x + 5, base - 22, 9, '#4e7a4a')
            for (let k = -8; k <= 8; k += 2) rect(c, x + 5 + k, base - 20, 1, 8 + Math.abs(k % 4) * 2 - Math.abs(k) * 0.4, '#5e8a54')
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
    case 'hatay':
      return {
        far: layer((c) => {
          // Amanoslar uzakta; önde Habib-i Neccar Dağı, yamaçta zeytinlikler
          hills(c, s.far, B - 140, 20, 2, 1051)
          hills(c, '#c4a284', B - 104, 30, 1, 1052)
          const r = rng(1053)
          for (let i = 0; i < 90; i++) {
            const x = Math.floor(r() * LAYER_W)
            const t = (x / LAYER_W) * Math.PI * 2
            const y = B - 96 + Math.floor(r() * 40)
            if (y < B - 104 - 30 * Math.sin(t) + 6) continue
            disc(c, x, y, 2, '#a88a68')
          }
        }),
        mid: layer((c) => {
          const r = rng(1054)
          const base = B - 66
          const stone = s.mid
          // yamaca basamak basamak tırmanan taş evler: düz dam, kemerli pencere
          for (let row = 2; row >= 0; row--) {
            for (let x = row * 30; x < 400 - row * 40; x += 15 + Math.floor(r() * 8)) {
              const h = 9 + Math.floor(r() * 7)
              const y = base - row * 14
              rect(c, x, y - h, 13, h, stone)
              rect(c, x - 1, y - h - 1, 15, 1, '#c8a684')
              if (r() > 0.3) {
                rect(c, x + 4, y - h + 3, 3, 4, '#5a4434')
                rect(c, x + 5, y - h + 2, 1, 1, '#5a4434')
              }
            }
          }
          // çan kulesi ve minare yan yana
          rect(c, 150, base - 56, 10, 28, stone)
          for (let i = 0; i < 6; i++) rect(c, 150 + i * 0.8, base - 56 - i, 10 - i * 1.6, 1, stone)
          rect(c, 154, base - 50, 2, 4, '#5a4434')
          rect(c, 154, base - 66, 1, 4, stone)
          rect(c, 152, base - 64, 5, 1, stone)
          minaret(c, 250, base - 14, 50, stone)
          // Asi Nehri ve su dolabı
          rect(c, 0, base, LAYER_W, 14, s.water[1])
          for (let x = 0; x < LAYER_W; x += 23) rect(c, x + ((x * 7) % 11), base + 4 + ((x * 3) % 7), 8, 1, s.water[2])
          const nx = 500
          const ny = base - 10
          for (let a = 0; a < 120; a++) {
            const an = (a / 120) * Math.PI * 2
            rect(c, nx + Math.cos(an) * 20, ny + Math.sin(an) * 20, 2, 2, '#6a4a32')
            if (a % 10 === 0) for (let k = 3; k < 20; k += 2) rect(c, nx + Math.cos(an) * k, ny + Math.sin(an) * k, 1, 1, '#6a4a32')
            if (a % 10 === 5) rect(c, nx + Math.cos(an) * 21, ny + Math.sin(an) * 21, 3, 3, '#6a4a32')
          }
          rect(c, nx - 2, ny - 2, 5, 5, '#4a3424')
          // dolabın taş ayağı ve su kemeri
          rect(c, nx - 30, base - 8, 6, 22, stone)
          rect(c, nx + 24, base - 34, 50, 6, stone)
          for (let x = nx + 28; x < nx + 74; x += 12) rect(c, x, base - 28, 5, 42, stone)
          rect(c, 0, base + 14, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(1055)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // boğumlu gövdeli zeytinler ve sık defne çalıları
          for (let x = 0; x < LAYER_W; x += 30 + Math.floor(r() * 18)) {
            if (r() > 0.45) {
              rect(c, x + 5, base - 12, 3, 12, '#4a3626')
              rect(c, x + 3, base - 8, 2, 3, '#4a3626')
              rect(c, x + 8, base - 10, 2, 3, '#4a3626')
              disc(c, x + 2, base - 16, 6, '#6e7a52')
              disc(c, x + 11, base - 15, 6, '#6e7a52')
              disc(c, x + 6, base - 20, 6, '#7e8a60')
            } else {
              disc(c, x + 4, base - 5, 7, '#2e5a32')
              disc(c, x + 12, base - 7, 8, '#3a6a3a')
              for (let i = 0; i < 4; i++) rect(c, x + 2 + i * 4, base - 10 - (i % 2) * 3, 2, 1, '#5a8a4e')
            }
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
    case 'kayseri':
      return {
        far: layer((c) => {
          hills(c, s.far, B - 92, 14, 3, 581)
          // Erciyes: tek başına yükselen karlı volkan konisi, omzunda ikinci tepe
          const px = 330
          for (let x = 40; x < 620; x++) {
            const d = x - px
            const shoulder = d < 0 && d > -70 ? Math.max(0, 12 - Math.abs(d + 44) * 0.5) : 0
            const top = B - 196 + Math.abs(d) * (Math.abs(d) < 40 ? 0.9 : 0.55) + (Math.abs(d) >= 40 ? 14 : 0) - shoulder
            if (top > B - 92) continue
            rect(c, x, top, 1, B - top, s.far)
            // kar örtüsü: zirveden yamaca dil dil iner
            const snow = B - 152 + Math.round(5 * Math.sin(x * 0.19) + 3 * Math.sin(x * 0.53) + 9 * Math.max(0, Math.sin(x * 0.11)) ** 3)
            if (top < snow) rect(c, x, top, 1, snow - top, x < px ? '#f6f8ff' : '#dde4f2')
          }
        }),
        mid: layer((c) => {
          const r = rng(582)
          const base = B - 64
          const basalt = '#5c5c70'
          // Kayseri Kalesi: kara bazalt sur, yuvarlak burçlar, mazgallar
          rect(c, 40, base - 22, 220, 22, basalt)
          for (let x = 40; x < 260; x += 6) rect(c, x, base - 26, 4, 4, basalt)
          for (const tx of [40, 96, 152, 208, 252]) {
            rect(c, tx - 7, base - 34, 16, 34, basalt)
            rect(c, tx - 6, base - 34, 2, 34, '#74748a')
            for (let i = 0; i < 16; i += 5) rect(c, tx - 7 + i, base - 38, 3, 4, basalt)
          }
          rect(c, 140, base - 14, 10, 14, '#3a3a48')
          disc(c, 145, base - 14, 5, '#3a3a48', true)
          // Döner Kümbet: on iki köşeli gövde, kör kemerler, sivri külah
          const kx = 420
          rect(c, kx - 11, base - 30, 22, 30, s.mid)
          rect(c, kx - 13, base - 4, 26, 4, s.mid)
          for (let i = 0; i < 4; i++) {
            rect(c, kx - 9 + i * 5, base - 24, 3, 14, '#9a9cb2')
            rect(c, kx - 9 + i * 5 + 1, base - 26, 1, 2, '#9a9cb2')
          }
          rect(c, kx - 12, base - 32, 24, 2, s.mid)
          for (let i = 0; i < 22; i++) rect(c, kx - 12 + i * 0.55, base - 32 - i, 24 - i * 1.1, 1, s.mid)
          // küçük kümbet
          const k2 = 540
          rect(c, k2 - 7, base - 20, 14, 20, s.mid)
          for (let i = 0; i < 14; i++) rect(c, k2 - 8 + i * 0.57, base - 20 - i, 16 - i * 1.14, 1, s.mid)
          // düz damlı taş evler
          for (let x = 280; x < LAYER_W; x += 16 + Math.floor(r() * 10)) {
            if (x > 396 && x < 446) continue
            if (x > 526 && x < 556) continue
            house(c, x, base, 12 + Math.floor(r() * 6), 8 + Math.floor(r() * 8), s.mid, null, r, 'flat')
          }
          rect(c, 0, base, LAYER_W, 64, s.mid)
        }),
        near: layer((c) => {
          const r = rng(583)
          const base = B - 26
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kavaklar ve bazalt taş duvar
          for (let x = 0; x < LAYER_W; x += 4) rect(c, x, base - 5 + ((x / 4) % 2), 3, 5, s.near)
          for (let x = 8; x < LAYER_W; x += 26 + Math.floor(r() * 30)) {
            const h = 30 + Math.floor(r() * 16)
            rect(c, x + 2, base - 6, 2, 6, '#3a3040')
            for (let i = 0; i < h; i++) {
              const hw = Math.round(Math.sin((i / h) * Math.PI) * 4)
              rect(c, x + 3 - hw, base - 6 - i, hw * 2 + 1, 1, s.near)
            }
            for (let i = 6; i < h - 6; i += 5) rect(c, x + 1, base - 6 - i, 1, 2, '#6a6a80')
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
    case 'amasya':
      return {
        far: layer((c) => {
          // iki kat uzak sırt, önünde Harşena
          hills(c, '#b6c4bc', B - 122, 20, 2, 501)
          hills(c, '#a4b2aa', B - 96, 12, 3, 504)
          const r = rng(505)
          const px = 310
          const LIT = '#9fad9f'
          const DARK = '#6c7c77'
          const crest = (x: number) => B - 168 + Math.max(0, Math.abs(x - px) - 46) * 0.52 + Math.round(4 * Math.sin(x * 0.19) + 2.5 * Math.sin(x * 0.53))
          // Harşena Dağı: düz zirveli dik kaya; sol yüzü ışıkta, sağ yüzü gölgede, dikey yarıklı
          for (let x = 96; x < 524; x++) {
            const top = crest(x)
            if (top > B - 92) continue
            rect(c, x, top, 1, B - top, s.far)
            const face = Math.sin(x * 0.11) + Math.sin(x * 0.047 + 1.3)
            if (x < px + 30 && face > 0.2) rect(c, x, top, 1, 14 + Math.round(face * 16), LIT)
            if (x > px - 10 && face < 0.4) rect(c, x, top + 6, 1, 30 + Math.round((1 - face) * 14), DARK)
            if (r() > 0.86) rect(c, x, top + 3 + Math.floor(r() * 20), 1, 8 + Math.floor(r() * 26), DARK)
          }
          // etekte makilik
          for (let i = 0; i < 70; i++) {
            const x = 120 + Math.floor(r() * 380)
            const y = B - 110 + Math.floor(r() * 18)
            if (y < crest(x) + 26) continue
            disc(c, x, y, 1 + Math.floor(r() * 2), '#6f8a74')
          }
          // zirvede kale: sırtı izleyen sur, üç burç, sancak
          for (let x = 262; x < 362; x++) {
            const y = crest(x)
            rect(c, x, y - 5, 1, 5, '#b9c2b4')
            if (x % 4 < 2) rect(c, x, y - 7, 1, 2, '#b9c2b4')
          }
          for (const [tx, h] of [[266, 10], [304, 15], [350, 11]] as const) {
            const y = crest(tx + 3)
            rect(c, tx, y - h, 8, h, '#c3ccbc')
            rect(c, tx + 6, y - h, 2, h, '#9ba79f')
            for (let i = 0; i < 8; i += 3) rect(c, tx + i, y - h - 2, 2, 2, '#c3ccbc')
            rect(c, tx + 3, y - h + 4, 2, 3, '#6f7d79')
          }
          rect(c, 308, crest(307) - 27, 1, 10, '#6f7d79')
          rect(c, 309, crest(307) - 27, 5, 3, '#c8402e')
          // kral kaya mezarları: açık renkli yalçın kuşakta beş kemerli oyuk
          for (let x = 244; x < 404; x++) {
            const y0 = B - 142 + Math.round(3 * Math.sin(x * 0.31) + 2 * Math.sin(x * 0.83))
            const y1 = B - 108 + Math.round(3 * Math.sin(x * 0.23 + 2))
            rect(c, x, y0, 1, y1 - y0, x > 370 ? '#9aa69c' : '#b3bdae')
            if (x % 9 === 3) rect(c, x, y0 + 4, 1, y1 - y0 - 8, '#9aa69c')
          }
          for (const [tx, ty, w, h] of [[254, 126, 9, 12], [276, 132, 11, 15], [301, 129, 13, 18], [329, 133, 11, 15], [353, 127, 9, 12], [376, 130, 8, 11]] as const) {
            const cx = tx + (w - 1) / 2
            const hw = (w - 1) / 2
            rect(c, tx - 1, B - ty, w + 2, h, '#ced6c6')
            disc(c, cx, B - ty, hw + 1, '#ced6c6', true)
            rect(c, tx, B - ty, w, h, '#56625e')
            disc(c, cx, B - ty, hw, '#56625e', true)
            rect(c, tx + 2, B - ty + 3, w - 4, h - 3, '#3e4a48')
            rect(c, tx - 2, B - ty + h, w + 4, 1, '#ced6c6')
            rect(c, tx, B - ty + h + 1, w, 1, '#8b9993')
          }
          // mezarlara çıkan basamaklı yol
          for (let i = 0; i < 26; i++) rect(c, 236 - i * 3, B - 108 + i, 3, 1, '#b3bdae')
        }),
        mid: layer((c) => {
          const r = rng(502)
          const base = B - 62
          const TIMBER = '#6a4a34'
          const TILE = '#b45c3e'
          // evlerin ardında kavaklar, II. Bayezid Camii ve saat kulesi
          for (let x = 4; x < LAYER_W; x += 9 + Math.floor(r() * 14)) {
            const h = 34 + Math.floor(r() * 14)
            for (let i = 0; i < h; i++) rect(c, x - Math.min(2, Math.floor(i / 4)), base - h + i, 1 + Math.min(2, Math.floor(i / 4)) * 2, 1, i % 7 === 2 ? '#5c7c62' : '#4a6a54')
          }
          const mx = 452
          rect(c, mx - 18, base - 52, 36, 32, '#d9d2c0')
          rect(c, mx + 12, base - 52, 6, 32, '#b9b2a0')
          dome(c, mx, base - 52, 13, '#72868a')
          dome(c, mx - 22, base - 44, 5, '#72868a')
          dome(c, mx + 22, base - 44, 5, '#72868a')
          rect(c, mx - 7, base - 60, 4, 1, '#9fb2b4')
          minaret(c, mx - 31, base - 20, 62, '#e2dccc')
          minaret(c, mx + 30, base - 20, 62, '#e2dccc')
          const sx = 176
          rect(c, sx - 4, base - 52, 8, 32, '#cfc8b6')
          rect(c, sx + 2, base - 52, 2, 32, '#aaa494')
          rect(c, sx - 5, base - 54, 10, 2, TIMBER)
          disc(c, sx, base - 46, 2, '#f6f2e4')
          rect(c, sx, base - 47, 1, 2, '#3a3a40')
          for (let i = 0; i < 6; i++) rect(c, sx - 5 + i, base - 55 - i, 10 - i * 2, 1, TILE)
          // yalıboyu evleri: taş rıhtım, beyaz badana, ahşap hatıl, ırmağa taşan cumba, kiremit çatı
          for (let x = -4; x < LAYER_W; ) {
            const w = 20 + Math.floor(r() * 3) * 2
            const h = 24 + Math.floor(r() * 3) * 3
            const wall = ['#f4eee0', '#f4eee0', '#efe3c6', '#e9d6a8'][Math.floor(r() * 4)]
            const y = base - 6
            // alt kat
            rect(c, x + 2, y - 10, w - 4, 10, '#e2dccc')
            rect(c, x + 2, y - 10, w - 4, 1, TIMBER)
            rect(c, x + 5, y - 7, 3, 7, '#5a4034')
            rect(c, x + w - 9, y - 7, 3, 4, '#4e3c34')
            // payandalar (eli böğründe)
            for (let k = 0; k < 3; k++) {
              rect(c, x + k, y - 11 - k, 1, 1, TIMBER)
              rect(c, x + w - 1 - k, y - 11 - k, 1, 1, TIMBER)
            }
            // cumbalı üst kat
            const uy = y - h
            rect(c, x, uy, w, h - 13, wall)
            rect(c, x + w - 2, uy, 2, h - 13, '#d6cdb8')
            rect(c, x, y - 14, w, 1, TIMBER)
            rect(c, x, uy, 1, h - 13, TIMBER)
            rect(c, x + w - 1, uy, 1, h - 13, TIMBER)
            for (let wx = x + 3; wx < x + w - 4; wx += 5) {
              rect(c, wx, uy + 3, 3, h - 19, '#4e3c34')
              rect(c, wx, uy + 3, 3, 1, '#8a6a52')
              rect(c, wx - 1, uy + h - 16, 5, 1, TIMBER)
            }
            // saçaklı kiremit çatı ve baca
            rect(c, x - 2, uy - 1, w + 4, 1, '#8a4630')
            for (let i = 0; i < 5; i++) rect(c, x - 1 + i * 2, uy - 2 - i, w + 2 - i * 4, 1, i % 2 ? '#c46a48' : TILE)
            if (r() > 0.4) rect(c, x + 4 + Math.floor(r() * (w - 10)), uy - 8, 2, 4, '#8c8a80')
            x += w + 2 + Math.floor(r() * 3)
          }
          // taş rıhtım
          rect(c, 0, base - 6, LAYER_W, 6, '#8e8c80')
          rect(c, 0, base - 6, LAYER_W, 1, '#b4b2a2')
          for (let x = 0; x < LAYER_W; x += 7) rect(c, x + ((x * 3) % 5), base - 3, 3, 1, '#77756a')
          // Yeşilırmak: evlerin beyaz yansıması, akıntı çizgileri, bir kayık
          rect(c, 0, base, LAYER_W, 24, s.water[1])
          rect(c, 0, base, LAYER_W, 2, '#256a52')
          for (let x = 0; x < LAYER_W; x += 3) if ((x * 7) % 11 < 6) rect(c, x, base + 3 + ((x * 5) % 4), 1, 5 + ((x * 3) % 6), 'rgba(226,240,222,0.3)')
          for (let x = 0; x < LAYER_W; x += 13) rect(c, x + ((x * 5) % 9), base + 12 + ((x * 3) % 10), 7 + ((x * 7) % 5), 1, s.water[2])
          for (let x = 5; x < LAYER_W; x += 29) rect(c, x + ((x * 3) % 13), base + 7 + ((x * 11) % 14), 10, 1, s.water[0])
          rect(c, 232, base + 14, 16, 2, '#6a4a34')
          rect(c, 230, base + 13, 20, 1, '#8a6a4a')
          rect(c, 238, base + 10, 2, 3, '#c8402e')
          rect(c, 238, base + 9, 2, 1, '#e8c8a0')
          rect(c, 234, base + 16, 12, 1, 'rgba(20,50,40,0.35)')
          rect(c, 0, base + 24, LAYER_W, 60, s.mid)
          rect(c, 0, base + 24, LAYER_W, 1, '#8e9c90')
        }),
        near: layer((c) => {
          const r = rng(503)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kıyı korkuluğu
          for (let x = 0; x < LAYER_W; x += 6) rect(c, x, base - 5, 1, 5, s.near)
          for (let x = 0; x < LAYER_W; x += 36) rect(c, x - 1, base - 7, 3, 7, s.near)
          rect(c, 0, base - 6, LAYER_W, 1, s.near)
          // elma ağaçları: iki tonlu yaprak, al misketler; aralarında fenerler
          for (let x = 12; x < LAYER_W; x += 40 + Math.floor(r() * 26)) {
            rect(c, x + 5, base - 13, 2, 13, '#3a3a34')
            rect(c, x + 3, base - 15, 2, 3, '#3a3a34')
            rect(c, x + 8, base - 16, 2, 3, '#3a3a34')
            disc(c, x + 1, base - 19, 6, '#446e46')
            disc(c, x + 11, base - 19, 6, '#446e46')
            disc(c, x + 6, base - 23, 7, '#4e7a4a')
            disc(c, x + 4, base - 25, 3, '#64925a')
            for (const [dx, dy] of [[-3, -1], [3, -6], [10, 1], [-1, 4], [13, -3], [6, 0]] as const) rect(c, x + 2 + dx, base - 21 + dy, 2, 2, dx % 2 ? '#d8402e' : '#e8c44a')
            rect(c, x + 24, base - 18, 1, 18, '#2e3a34')
            rect(c, x + 23, base - 21, 3, 3, '#2e3a34')
            rect(c, x + 24, base - 20, 1, 1, '#f6dc8a')
          }
        }),
      }
    case 'mugla':
      return {
        far: layer((c) => {
          // Ege: solda Babadağ ve yamaç paraşütleri, ufukta adalar, yarımadada Bodrum Kalesi
          const sea = B - 92
          const mound = (cx: number, hw: number, hh: number, color: string) => {
            for (let x = -hw; x <= hw; x++) {
              const h = Math.round(hh * Math.sqrt(1 - (x * x) / (hw * hw)))
              rect(c, cx + x, sea - h, 1, h, color)
            }
          }
          for (let x = 0; x < 230; x++) {
            const top = sea - 86 + Math.round(Math.abs(x - 96) * 0.62 + 3 * Math.sin(x * 0.17) + 2 * Math.sin(x * 0.41))
            if (top >= sea) continue
            rect(c, x, top, 1, sea - top, '#a9c8e6')
            if (x < 96) rect(c, x, top, 1, Math.min(12, sea - top), '#bcd6ee')
          }
          mound(250, 60, 12, '#9cc2e2')
          mound(596, 70, 20, '#9cc2e2')
          mound(520, 34, 9, '#a9c8e6')
          const glider = (x: number, y: number, a: string, b2: string) => {
            rect(c, x - 4, y, 9, 1, a)
            rect(c, x - 6, y + 1, 13, 1, a)
            rect(c, x - 7, y + 2, 3, 1, b2)
            rect(c, x + 5, y + 2, 3, 1, b2)
            rect(c, x - 2, y + 1, 5, 1, b2)
            for (let k = 0; k < 5; k++) {
              rect(c, x - 6 + k, y + 3 + k, 1, 1, 'rgba(60,80,110,0.5)')
              rect(c, x + 6 - k, y + 3 + k, 1, 1, 'rgba(60,80,110,0.5)')
            }
            rect(c, x - 1, y + 8, 2, 3, '#3a4a6a')
          }
          glider(150, B - 196, '#f26a4a', '#ffd86a')
          glider(206, B - 168, '#ffd86a', '#f26a4a')
          glider(64, B - 160, '#e85aa0', '#fff4e0')
          glider(262, B - 206, '#4ac0a8', '#fff4e0')
          // kale: bal rengi taş, mazgallı sur, dört kule, sancak; eteğinde beyaz evler
          const kx = 404
          mound(kx, 104, 15, '#a8be9c')
          const STONE = '#e2d4b4'
          const LIT = '#f0e6cc'
          const DARK = '#bfae8c'
          rect(c, kx - 56, sea - 31, 112, 18, STONE)
          rect(c, kx - 56, sea - 31, 112, 1, LIT)
          rect(c, kx - 56, sea - 17, 112, 4, DARK)
          for (let x = kx - 56; x < kx + 56; x += 5) rect(c, x, sea - 34, 3, 3, STONE)
          for (const [dx, w, h] of [[-62, 13, 34], [-22, 15, 54], [10, 12, 44], [46, 14, 36]] as const) {
            const ty = sea - 14 - h
            rect(c, kx + dx, ty, w, h, STONE)
            rect(c, kx + dx, ty, 3, h, LIT)
            rect(c, kx + dx + w - 3, ty, 3, h, DARK)
            rect(c, kx + dx - 1, ty, w + 2, 2, STONE)
            for (let i = 0; i < w + 1; i += 4) rect(c, kx + dx - 1 + i, ty - 3, 2, 3, STONE)
            rect(c, kx + dx + Math.floor(w / 2) - 1, ty + 8, 2, 4, '#8a7a5e')
            if (h > 40) rect(c, kx + dx + Math.floor(w / 2) - 1, ty + 22, 2, 4, '#8a7a5e')
          }
          rect(c, kx - 15, sea - 84, 1, 14, '#8a7a5e')
          rect(c, kx - 14, sea - 84, 7, 4, '#d6403a')
          rect(c, kx - 12, sea - 83, 2, 2, '#fff4e0')
          for (let i = 0; i < 16; i++) {
            const x = kx - 96 + i * 12 + ((i * 7) % 5)
            if (Math.abs(x - kx) < 60) continue
            rect(c, x, sea - 8 - (i % 3) * 2, 6, 5, '#fbfaf4')
            rect(c, x + 4, sea - 8 - (i % 3) * 2, 2, 5, '#d8e2ea')
          }
          // deniz: ufukta açık, kıyıya doğru koyulaşan şeritler; pırıltı ve uzak yelkenler
          rect(c, 0, sea, LAYER_W, 92, '#3d9cd6')
          rect(c, 0, sea, LAYER_W, 1, '#d6f0fa')
          rect(c, 0, sea + 1, LAYER_W, 7, '#6cbce6')
          rect(c, 0, sea + 8, LAYER_W, 12, '#52aede')
          for (let x = 0; x < LAYER_W; x += 4) {
            if ((x * 7) % 13 < 6) rect(c, x, sea + 8, 4, 1, '#6cbce6')
            if ((x * 5) % 11 < 5) rect(c, x, sea + 20, 4, 1, '#52aede')
          }
          for (let i = 0; i < 34; i++) rect(c, (i * 67) % LAYER_W, sea + 3 + ((i * 19) % 46), 8 + (i % 4) * 5, 1, i % 3 ? '#a8dcf4' : '#e6f8ff')
          for (const [x, h] of [[300, 7], [318, 5], [560, 6], [36, 6]] as const) {
            for (let i = 0; i < h; i++) rect(c, x + h - i - 1, sea + 3 - h + i, i + 1, 1, '#ffffff')
            rect(c, x - 1, sea + 3, h + 2, 1, '#e8f0f4')
          }
        }),
        mid: layer((c) => {
          const r = rng(482)
          const base = B - 44
          const top = (x: number) => base - 40 - Math.round(9 * Math.sin((x / LAYER_W) * Math.PI * 4 + 0.6) + 3 * Math.sin((x / LAYER_W) * Math.PI * 10))
          // güneşte ağarmış makilik yamaç: zeytin ve çalı, taş sekiler
          for (let x = 0; x < LAYER_W; x++) {
            const y = top(x)
            rect(c, x, y, 1, B - y, '#a0b688')
            rect(c, x, y, 1, 2, '#c2d2a0')
          }
          for (let i = 0; i < 150; i++) {
            const x = Math.floor(r() * LAYER_W)
            const y = top(x) + 4 + Math.floor(r() * 34)
            const k = r()
            if (k > 0.6) {
              disc(c, x, y, 2, '#6f9864')
              rect(c, x - 1, y - 2, 2, 1, '#8cb47a')
            } else if (k > 0.25) rect(c, x, y, 2, 1, '#7ea470')
            else rect(c, x, y, 5 + Math.floor(r() * 5), 1, '#c2cc98')
          }
          // sırtta yel değirmenleri: yuvarlak beyaz kule, saz külah, sekiz kollu yelken çark
          for (const [wx, ph] of [[66, 0.2], [112, 0.6], [150, 0.1], [520, 0.5], [566, 0.3]] as const) {
            const y = top(wx) + 1
            rect(c, wx - 5, y - 15, 11, 15, '#f8f5ea')
            rect(c, wx - 5, y - 15, 3, 15, '#ffffff')
            rect(c, wx + 4, y - 15, 2, 15, '#d2dae0')
            rect(c, wx - 1, y - 6, 3, 6, '#3f7fd0')
            rect(c, wx - 3, y - 11, 2, 2, '#3f7fd0')
            for (let i = 0; i < 6; i++) rect(c, wx - 6 + i, y - 16 - i, 13 - i * 2, 1, i % 2 ? '#a07a4c' : '#8a6a4a')
            const hx = wx + 7
            const hy = y - 15
            // çark hafif yandan görünür (yatayda basık): dört kolda dolu üçgen yelken, aradaki kollar ince
            for (let k = 0; k < 8; k++) {
              const an = ph + (k * Math.PI) / 4
              if (k % 2) {
                for (let q = 2; q <= 10; q += 2) rect(c, hx + Math.round(Math.cos(an) * q * 0.6), hy + Math.round(Math.sin(an) * q), 1, 1, '#a08a6c')
                continue
              }
              for (let q = 3; q <= 11; q++)
                for (let da = 0.06; da < 0.1 + q * 0.06; da += 0.06) rect(c, hx + Math.round(Math.cos(an + da) * q * 0.6), hy + Math.round(Math.sin(an + da) * q), 1, 1, da > q * 0.06 - 0.02 ? '#b4c6d6' : '#ffffff')
              for (let q = 1; q <= 11; q++) rect(c, hx + Math.round(Math.cos(an) * q * 0.6), hy + Math.round(Math.sin(an) * q), 1, 1, '#6a5238')
            }
            rect(c, hx, hy, 1, 1, '#3a2e22')
          }
          // yamaca basamak basamak dizilen badanalı evler: düz dam, mavi kapı ve kepenk, duvardan taşan begonvil
          for (let row = 0; row < 3; row++) {
            for (let x = 176 + row * 9; x < 486; ) {
              const w = 12 + Math.floor(r() * 4) * 2
              const h = 9 + Math.floor(r() * 5)
              const y = base - 26 + row * 12 + Math.round(3 * Math.sin(x * 0.05 + row))
              rect(c, x, y - h, w, h, '#fbfaf4')
              rect(c, x - 1, y - h - 1, w + 2, 1, '#ffffff')
              rect(c, x + w - 3, y - h, 3, h, '#d5dfe8')
              rect(c, x, y - 1, w, 1, '#c3d0dc')
              if (r() > 0.35) {
                rect(c, x + 2, y - 5, 3, 5, '#3f7fd0')
                rect(c, x + 2, y - 5, 3, 1, '#2a5ea8')
              }
              rect(c, x + w - 8, y - h + 3, 3, 3, '#3f7fd0')
              if (r() > 0.5) {
                rect(c, x + 3, y - h - 4, 4, 3, '#fbfaf4')
                rect(c, x + 2, y - h - 5, 6, 1, '#ffffff')
              }
              if (r() > 0.45) {
                // duvarın köşesinden salkım salkım sarkan begonvil
                const side = r() > 0.5 ? x - 1 : x + w - 4
                for (let k = 0; k < 9; k++) {
                  const dy = Math.floor(r() * (h - 2))
                  rect(c, side + Math.floor(r() * (5 - dy / 3)), y - h - 1 + dy, 2, 2, k % 3 ? '#d8408a' : '#ee7ab4')
                }
                rect(c, side + 2, y - h - 2, 2, 1, '#5a9a4a')
              }
              if (r() > 0.7) {
                rect(c, x + w + 1, y - 9, 1, 9, '#4e7a52')
                disc(c, x + w + 1, y - 10, 2, '#4e7a52')
              }
              x += w + 2 + Math.floor(r() * 7)
            }
          }
          // rıhtım, kumsal ve sığ turkuaz su
          for (let x = 0; x < LAYER_W; x++) {
            const sh = base + 6 + Math.round(2 * Math.sin(x * 0.045) + Math.sin(x * 0.13))
            rect(c, x, sh - 3, 1, 3, '#f0e2bc')
            rect(c, x, sh, 1, B - sh, '#56c4dc')
            rect(c, x, sh, 1, 1, '#e6fafc')
            rect(c, x, sh + 6 + Math.round(Math.sin(x * 0.07) * 2), 1, B - sh, '#3aa6d4')
          }
          for (let x = 3; x < LAYER_W; x += 19) rect(c, x + ((x * 7) % 11), base + 16 + ((x * 3) % 12), 9, 1, '#9fe0f0')
          // kumsalda şemsiyeler
          for (let x = 20; x < LAYER_W; x += 46 + ((x * 7) % 23)) {
            if (x > 170 && x < 490) continue
            const y = base + 4 + Math.round(2 * Math.sin(x * 0.045))
            rect(c, x, y - 6, 1, 6, '#8a6a4a')
            rect(c, x - 3, y - 7, 7, 1, x % 2 ? '#e8504a' : '#3f7fd0')
            rect(c, x - 2, y - 8, 5, 1, '#fff8ea')
          }
        }),
        near: layer((c) => {
          const r = rng(484)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          rect(c, 0, base, LAYER_W, 1, '#7cc4e6')
          for (let x = 0; x < LAYER_W; x += 23) rect(c, x + ((x * 3) % 11), base + 4 + ((x * 7) % 12), 8, 1, '#69b4dc')
          // koyda demirli guletler: kıçı yüksek ahşap tekne, beyaz kamara, iki direk, sarılı yelken, flama
          for (let x = 24; x < LAYER_W - 40; x += 84 + Math.floor(r() * 40)) {
            rect(c, x + 2, base - 4, 28, 4, '#7a5234')
            rect(c, x, base - 6, 34, 2, '#9a6e44')
            rect(c, x - 2, base - 8, 5, 2, '#9a6e44')
            rect(c, x + 31, base - 7, 5, 1, '#9a6e44')
            rect(c, x, base - 4, 32, 1, '#f4f0e4')
            rect(c, x + 6, base - 10, 12, 4, '#f8f5ea')
            rect(c, x + 5, base - 11, 14, 1, '#d8c8a8')
            for (let k = 0; k < 3; k++) rect(c, x + 8 + k * 3, base - 9, 2, 2, '#3f7fd0')
            rect(c, x + 12, base - 32, 1, 22, '#4a3a2e')
            rect(c, x + 25, base - 25, 1, 19, '#4a3a2e')
            rect(c, x + 13, base - 13, 11, 2, '#f4ecd8')
            rect(c, x + 26, base - 9, 8, 1, '#f4ecd8')
            for (let k = 0; k < 9; k++) rect(c, x + 13 + k, base - 30 + k * 2, 1, 1, 'rgba(60,50,40,0.5)')
            rect(c, x + 13, base - 32, 4, 2, '#d6403a')
            rect(c, x + 4, base + 1, 26, 1, 'rgba(20,60,100,0.35)')
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
  gull: 'Gökçekuş', bee: 'Arı', raven: 'Kuzgun', mosquito: 'Sivrisinek', frog: 'Kurbağa', hare: 'Tavşan', ram: 'Koç', bat: 'Yarasa',
  hedgehog: 'Kirpi', boar: 'Yaban Domuzu', crab: 'Yengeç', pigeon: 'Güvercin', goat: 'Keçi', scorpion: 'Akrep', wolf: 'Kurt',
  snake: 'Yılan', lizard: 'Kertenkele', rat: 'Fare', wasp: 'Eşek Arısı', magpie: 'Saksağan',
  cat: 'Sokak Kedisi', flamingo: 'Flamingo', angora: 'Ankara Keçisi', vanCat: 'Van Kedisi', lion: 'Hitit Aslanı', cow: 'İnek', kangal: 'Kangal', horse: 'At', partridge: 'Keklik', turtle: 'Caretta Caretta',
}
