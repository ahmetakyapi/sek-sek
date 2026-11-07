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
  weather: 'gulls' | 'dust' | 'petals' | 'leaves' | 'snow' | 'storm'
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
    animal: 'donkey',
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

export function enemyArt(kind: 'ground' | 'fly', city: CityKey) {
  const s = CITY[city]
  return ENEMY_ART[kind === 'ground' ? s.enemyGround : s.enemyFly] ?? ENEMY_ART.scorpion
}

/* ── Hatıralar (toplanabilir) ─────────────────────────────────── */
export const ITEM_ART: Record<CityKey, { rows: string[]; pal: Record<string, string> }> = {
  istanbul: {
    pal: { b: '#b8692e', B: '#8a4a1e', s: '#f6e7c0' },
    rows: ['...bbbb...', '..bsbbsb..', '.bb....bb.', '.b......b.', '.bs....sb.', '.b......b.', '.bb....bB.', '..bsbbsB..', '...BBBB...', '..........'],
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
  sivas: {
    pal: { g: '#d9a441', G: '#a87a22', k: '#2a2220', w: '#e8d6a8' },
    rows: ['...gggg...', '..gGGGGg..', '.gGwwwwGg.', '.gGkwwkGg.', '.gGwkkwGg.', '.gGwwwwGg.', '..gGGGGg..', '...gggg...', '....gg....', '...g..g...'],
  },
  bayburt: {
    pal: { w: '#a8693a', W: '#7a4a24', s: '#f0e2c0', k: '#2a2220' },
    rows: ['........kk', '.......ks.', '......ws..', '.....ws...', '..wwwWs...', '.wwkkwW....', 'wwkkkkwW..', 'wwwkkwwW..', '.wwwwWW...', '..WWWW....'],
  },
}
