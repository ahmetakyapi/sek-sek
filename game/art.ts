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
/**
 * Arka planda gerilmiş tel (teleferik): her sütunda tam piksele oturur, basamak aralarını doldurur.
 * Kesirli y'li 1x1 noktalar yarı saydam kesik çizgiye dönüşüyor, kamera kayınca tel kaybolup geri geliyordu.
 */
function wire(c: Ctx, x0: number, x1: number, yAt: (x: number) => number, color: string, thick = 2) {
  let prev = Math.round(yAt(x0))
  for (let x = x0; x < x1; x++) {
    const y = Math.round(yAt(x))
    const top = Math.min(y, prev)
    rect(c, x, top, 1, Math.abs(y - prev) + thick, color)
    prev = y
  }
}

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
  rize: {
    // Rize: yağmurlu yeşil, çay terasları
    sky: ['#4a6470', '#8eaab0', '#d6e2dc'],
    sun: null,
    far: '#6a9278',
    mid: '#3f6a50',
    near: '#264634',
    tileTop: '#5fae4a',
    tile: '#5a4c3c',
    tileDark: '#3c3228',
    tileLight: '#7c6650',
    plank: '#6a4c34',
    accent: '#c8302a',
    water: ['#3a7a80', '#245a62', '#b4e0e2'],
    spike: ['#3a5a2a', '#1e3216'],
    weather: 'rain',
    enemyGround: 'snake',
    enemyFly: 'mosquito',
    animal: 'cow',
  },
  artvin: {
    // Artvin: dik yamaçlar, Kafkasör çayırı, Çoruh mavisi
    sky: ['#5a7a9a', '#a8c0d0', '#e6eef0'],
    sun: { x: 0.7, y: 0.3, r: 13, color: '#fff4d8', glow: 'rgba(255,244,216,0.2)' },
    far: '#7a9a8a',
    mid: '#4c6e5a',
    near: '#2e4a3a',
    tileTop: '#6aa850',
    tile: '#6a5e52',
    tileDark: '#463e36',
    tileLight: '#8a7e70',
    plank: '#6e5038',
    accent: '#d6403a',
    water: ['#3a8aa0', '#286a80', '#c8eef4'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'leaves',
    enemyGround: 'boar',
    enemyFly: 'raven',
    animal: 'horse',
  },
  kars: {
    // Kars: kar, Baltık taşı, Ani’nin kızıl tüfü
    sky: ['#4a5a7e', '#9cb0cc', '#e8eef6'],
    sun: { x: 0.3, y: 0.32, r: 12, color: '#fbfbf0', glow: 'rgba(240,245,255,0.3)' },
    far: '#b0bccc',
    mid: '#7a889e',
    near: '#4c586c',
    tileTop: '#f2f6fc',
    tile: '#6c6a72',
    tileDark: '#46444c',
    tileLight: '#8c8a92',
    plank: '#6a4c34',
    accent: '#c8302a',
    water: ['#4f8fb8', '#2f6890', '#d8f2ff'],
    spike: ['#dff3ff', '#8fc3e0'],
    weather: 'snow',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'cow',
  },
  bitlis: {
    // Bitlis: volkanik akşam, Ahlat taşı, krater gölü
    sky: ['#d08a5a', '#e8b88a', '#f6e2c4'],
    sun: { x: 0.75, y: 0.4, r: 15, color: '#fff0c8', glow: 'rgba(255,230,190,0.22)' },
    far: '#a88a7a',
    mid: '#7a5e52',
    near: '#4e3a34',
    tileTop: '#cbb8a0',
    tile: '#8a7462',
    tileDark: '#5c4a3e',
    tileLight: '#a89078',
    plank: '#6e4c34',
    accent: '#d6403a',
    water: ['#3a8a9a', '#246878', '#c8eef2'],
    spike: ['#c9ced8', '#6c7080'],
    weather: 'dust',
    enemyGround: 'lizard',
    enemyFly: 'raven',
    animal: 'cat',
  },
  agri: {
    // Ağrı: dağın karlı zirvesi, sarayın kumtaşı
    sky: ['#3e5a8a', '#a0b6d8', '#eef2f8'],
    sun: { x: 0.78, y: 0.28, r: 13, color: '#fffbe8', glow: 'rgba(255,250,232,0.25)' },
    far: '#c8d0e0',
    mid: '#8a96b0',
    near: '#56607a',
    tileTop: '#f4f8ff',
    tile: '#7a6e66',
    tileDark: '#504840',
    tileLight: '#9a8e84',
    plank: '#7a5a40',
    accent: '#c8302a',
    water: ['#4f8fb8', '#2f6890', '#d8f2ff'],
    spike: ['#dff3ff', '#8fc3e0'],
    weather: 'snow',
    enemyGround: 'wolf',
    enemyFly: 'raven',
    animal: 'horse',
  },
  giresun: {
    // Giresun: puslu Karadeniz göğü, yeşil yamaç, yosunlu kale taşı, kiraz kırmızısı
    sky: ['#5a7a8e', '#a8c4cc', '#e4eee8'],
    sun: { x: 0.2, y: 0.32, r: 12, color: '#fff6dc', glow: 'rgba(255,246,220,0.2)' },
    far: '#8eaaa4',
    mid: '#5e8a6a',
    near: '#3a6446',
    tileTop: '#6aa84a',
    tile: '#7a7a6e',
    tileDark: '#4e5048',
    tileLight: '#9a9a8c',
    plank: '#6e4e34',
    accent: '#c8243a',
    water: ['#3e7e96', '#245a70', '#cdeef0'],
    spike: ['#e8e4d8', '#a8a090'],
    weather: 'rain',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'cow',
  },
  tokat: {
    // Tokat: kızıl tuğla hanlar, kalenin gri kayası, yazmanın çivit ve kök boyası
    sky: ['#5a6aa0', '#c0b0c8', '#f4e2c8'],
    sun: { x: 0.74, y: 0.26, r: 13, color: '#fff0d0', glow: 'rgba(255,240,208,0.24)' },
    far: '#b8a4b0',
    mid: '#8a6a6e',
    near: '#5a4448',
    tileTop: '#c8b498',
    tile: '#a0584a',
    tileDark: '#6a3630',
    tileLight: '#c07a66',
    plank: '#6a4a32',
    accent: '#2e4a9a',
    water: ['#4a7aa0', '#2e5478', '#d0e8f4'],
    spike: ['#e8dcc8', '#a89880'],
    weather: 'leaves',
    enemyGround: 'rat',
    enemyFly: 'pigeon',
    animal: 'cat',
  },
  denizli: {
    // Pamukkale: bembeyaz traverten, turkuaz havuzlar, Ege'nin açık göğü
    sky: ['#3e86c8', '#8cc4ea', '#eef8fc'],
    sun: { x: 0.8, y: 0.22, r: 15, color: '#fffbe6', glow: 'rgba(255,251,230,0.3)' },
    far: '#c4d4dc',
    mid: '#9ab0a8',
    near: '#6a8478',
    tileTop: '#ffffff',
    tile: '#e4e0d4',
    tileDark: '#b0a898',
    tileLight: '#f6f4ec',
    plank: '#8a6a48',
    accent: '#d0402a',
    water: ['#5cc8d4', '#38a4b8', '#e8fcff'],
    spike: ['#f4f0e8', '#b8b0a0'],
    weather: 'dust',
    enemyGround: 'snake',
    enemyFly: 'wasp',
    animal: 'turtle',
  },
  zonguldak: {
    // Zonguldak: yağmurlu Karadeniz griliği, kömür karası, koyu yeşil yamaçlar, madenci lambasının turuncusu
    sky: ['#4a5664', '#8a96a0', '#c6cac4'],
    sun: { x: 0.26, y: 0.3, r: 11, color: '#e6e2d2', glow: 'rgba(230,226,210,0.14)' },
    far: '#6e7e84',
    mid: '#3e5446',
    near: '#26282c',
    tileTop: '#4f7c3e',
    tile: '#5c5852',
    tileDark: '#2e2c2a',
    tileLight: '#7c776e',
    plank: '#6a4a30',
    accent: '#f2a12e',
    water: ['#3e6878', '#22465a', '#c4d8dc'],
    spike: ['#d8d4cc', '#8a8680'],
    weather: 'rain',
    enemyGround: 'rat',
    enemyFly: 'gull',
    animal: 'cat',
  },
  mersin: {
    // Mersin: Akdeniz mavisi, Toros’un mor silueti, kumtaşı sarısı, portakal ve limon; deniz feneri kırmızısı
    sky: ['#2e6eb0', '#7cc0e4', '#f6e2bc'],
    sun: { x: 0.7, y: 0.26, r: 15, color: '#fff4c8', glow: 'rgba(255,236,180,0.22)' },
    far: '#8c9cc0',
    mid: '#4e8a6a',
    near: '#2e4a44',
    tileTop: '#e2c48a',
    tile: '#c49a62',
    tileDark: '#7a5a36',
    tileLight: '#e8cc98',
    plank: '#8a5a32',
    accent: '#e8582e',
    water: ['#2a9ab4', '#1a6a8a', '#d4f2f4'],
    spike: ['#3a2a3e', '#1e1626'],
    weather: 'gulls',
    enemyGround: 'crab',
    enemyFly: 'gull',
    animal: 'turtle',
  },
  karabuk: {
    // Karabük: Küre Dağları’nın ormanı, Safranbolu’nun kiremit çatılı ahşap konakları, haddehanenin bacaları; safran moru ve çelik grisi
    sky: ['#5a6c94', '#b4b8cc', '#f2dcc0'],
    sun: { x: 0.22, y: 0.3, r: 13, color: '#ffe9bc', glow: 'rgba(255,214,150,0.2)' },
    far: '#6e7e9c',
    mid: '#3e5c4a',
    near: '#33302e',
    tileTop: '#c8b088',
    tile: '#9a7a56',
    tileDark: '#5a4630',
    tileLight: '#d8c29a',
    plank: '#7a4e2c',
    accent: '#8a52a8',
    water: ['#4a9aa8', '#2a6a7e', '#cde8e8'],
    spike: ['#3a3040', '#1e1824'],
    weather: 'dust',
    enemyGround: 'rat',
    enemyFly: 'raven',
    animal: 'cat',
  },
  aydin: {
    // Aydın (Efes): mermer beyazı, Ege mavisi, zeytin yeşili ve incir moru
    sky: ['#3c82c4', '#8cc8ea', '#f8ecd2'],
    sun: { x: 0.74, y: 0.24, r: 14, color: '#fff6d2', glow: 'rgba(255,240,190,0.22)' },
    far: '#a0b4cc',
    mid: '#6e8c5a',
    near: '#3c5840',
    tileTop: '#f0ece2',
    tile: '#d2ccbe',
    tileDark: '#8a8476',
    tileLight: '#f8f6ee',
    plank: '#a8885a',
    accent: '#7a4a8c',
    water: ['#2a8ab4', '#1a5a8a', '#d4eef4'],
    spike: ['#4a3a4e', '#241a2a'],
    weather: 'leaves',
    enemyGround: 'lizard',
    enemyFly: 'pigeon',
    animal: 'cat',
  },
  balikesir: {
    // Balıkesir: Kaz Dağları’nın çam yeşili, Ayvalık zeytini, Ege’nin öğle göğü ve kekik moru
    sky: ['#4a8ccc', '#9cd0ee', '#fbeed0'],
    sun: { x: 0.7, y: 0.22, r: 15, color: '#fff4c8', glow: 'rgba(255,236,180,0.26)' },
    far: '#9ab4c8',
    mid: '#5e8a5a',
    near: '#36583c',
    tileTop: '#c8b48a',
    tile: '#a8946a',
    tileDark: '#6a5a40',
    tileLight: '#e4d4aa',
    plank: '#9a7448',
    accent: '#8a5aa8',
    water: ['#2e7aa8', '#1c4e78', '#cfe8f2'],
    spike: ['#4a3e34', '#241c18'],
    weather: 'leaves',
    enemyGround: 'boar',
    enemyFly: 'raven',
    animal: 'cat',
  },
  bingol: {
    // Bingöl: yayla yeşili, göllerin koyu mavisi, bal sarısı ve dağ çiçeği moru
    sky: ['#3e78b8', '#94c4e8', '#f4ecd4'],
    sun: { x: 0.3, y: 0.22, r: 14, color: '#fff4cc', glow: 'rgba(255,240,190,0.22)' },
    far: '#8aa4c0',
    mid: '#5a8a5e',
    near: '#345a3e',
    tileTop: '#9a8a6a',
    tile: '#7a6a4e',
    tileDark: '#4a3e2c',
    tileLight: '#bcae8a',
    plank: '#8a6a40',
    accent: '#e8a43a',
    water: ['#2a6a9a', '#18466e', '#cfe6f2'],
    spike: ['#3e3a34', '#1e1c18'],
    weather: 'petals',
    enemyGround: 'boar',
    enemyFly: 'bee',
    animal: 'horse',
  },
  adiyaman: {
    // Adıyaman: Nemrut'ta gün doğumu (morumsu gök, pembe orta, turuncu ufuk), kireçtaşı zemin, Fırat'ın yeşili, isot kızılı
    sky: ['#5e6aa8', '#d88e94', '#fbc896'],
    sun: { x: 0.24, y: 0.34, r: 16, color: '#fff0c4', glow: 'rgba(255,186,128,0.32)' },
    far: '#b48c9a',
    mid: '#8a8e58',
    near: '#4e6236',
    tileTop: '#ecd4a8',
    tile: '#d4b284',
    tileDark: '#8a6644',
    tileLight: '#f4e2c0',
    plank: '#8a5a36',
    accent: '#d8562e',
    water: ['#3a8a78', '#22605a', '#cfeee2'],
    spike: ['#4a3a34', '#241a18'],
    weather: 'dust',
    enemyGround: 'scorpion',
    enemyFly: 'wasp',
    animal: 'horse',
  },
  kastamonu: {
    // Kastamonu: serin sabah, Ilgaz karaçamı yeşili, kale taşının gri-bejı, kanyon suyunun yeşil-mavisi, hasır sarısı
    sky: ['#4a78a8', '#9cc0d8', '#f2dcb4'],
    sun: { x: 0.72, y: 0.24, r: 13, color: '#fff2d0', glow: 'rgba(255,232,190,0.22)' },
    far: '#8ea2b8',
    mid: '#4a7a5a',
    near: '#2a4e3a',
    tileTop: '#c4b8a0',
    tile: '#9a907c',
    tileDark: '#5a5244',
    tileLight: '#ddd2ba',
    plank: '#7e5a36',
    accent: '#d8a84a',
    water: ['#2e8a8e', '#1a5e66', '#d2eef0'],
    spike: ['#3a3a3e', '#1c1c20'],
    weather: 'leaves',
    enemyGround: 'boar',
    enemyFly: 'raven',
    animal: 'cow',
  },
  afyon: {
    // Afyon: kara volkanik kaya, kaplıca buharının beyazı, termal havuzun turkuazı ve kaymak sarısı
    sky: ['#4a6aa8', '#a8c4e4', '#f6ead8'],
    sun: { x: 0.66, y: 0.24, r: 14, color: '#fff2d4', glow: 'rgba(255,238,200,0.22)' },
    far: '#a4aec4',
    mid: '#6e7a8a',
    near: '#3e4452',
    tileTop: '#8a8478',
    tile: '#5e5a54',
    tileDark: '#34322e',
    tileLight: '#aaa496',
    plank: '#a07a50',
    accent: '#3ab8c4',
    water: ['#3aa8b4', '#1e6e7a', '#d4f2f4'],
    spike: ['#3a3640', '#1c1a20'],
    weather: 'dust',
    enemyGround: 'lizard',
    enemyFly: 'pigeon',
    animal: 'cat',
  },
  elazig: {
    // Elazığ: Harput’un bal rengi taşı, Buzluk’un buz mavisi, Hazar’ın lacivert suyu ve kayısı turuncusu
    sky: ['#3a4a7c', '#8ea4cc', '#eae2d6'],
    sun: { x: 0.28, y: 0.26, r: 13, color: '#fff0d8', glow: 'rgba(240,230,255,0.18)' },
    far: '#a8b0c8',
    mid: '#7a7a92',
    near: '#46465a',
    tileTop: '#d8c09a',
    tile: '#b49a74',
    tileDark: '#6e5a44',
    tileLight: '#ecdcbc',
    plank: '#8a6a48',
    accent: '#e08a3a',
    water: ['#2a5a94', '#1a3a6a', '#cfe2f4'],
    spike: ['#3e4458', '#1e2230'],
    weather: 'snow',
    enemyGround: 'rat',
    enemyFly: 'pigeon',
    animal: 'cat',
  },
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
    case 'giresun':
      return {
        far: layer((c) => {
          // puslu Karadeniz: ufukta kıyı dağları, denizde tek başına yeşil Giresun Adası
          const sea = B - 84
          hills(c, '#a4bcbc', B - 150, 22, 2, 2801)
          hills(c, s.far, B - 118, 26, 3, 2802)
          rect(c, 0, sea, LAYER_W, B - sea, '#5e8c9a')
          rect(c, 0, sea, LAYER_W, 1, '#d2e4e2')
          rect(c, 0, sea + 1, LAYER_W, 6, '#76a2ac')
          for (let i = 0; i < 40; i++) rect(c, (i * 71) % LAYER_W, sea + 4 + ((i * 17) % 60), 6 + (i % 4) * 5, 1, i % 3 ? 'rgba(214,234,232,0.45)' : 'rgba(255,255,255,0.6)')
          // ada: yuvarlak, ormanlı; tepesinde yıkık bir duvar
          const ix = 470
          for (let x = -40; x <= 40; x++) {
            const h = Math.round(20 * Math.sqrt(1 - (x * x) / 1600) + Math.sin(x * 0.5) * 1.2)
            rect(c, ix + x, sea - h, 1, h + 1, '#3e6a4a')
            if (x < 0) rect(c, ix + x, sea - h, 1, 2, '#5e8e5a')
          }
          for (const [dx, dy, r] of [[-22, -12, 5], [-10, -18, 6], [4, -19, 6], [18, -14, 5], [28, -8, 4], [-30, -6, 4]] as const) {
            disc(c, ix + dx, sea + dy, r, '#36603e')
            rect(c, ix + dx - 2, sea + dy - r + 1, 3, 1, '#6a9a5e')
          }
          rect(c, ix - 4, sea - 25, 8, 4, '#8a8a80')
          rect(c, ix - 4, sea - 27, 2, 2, '#8a8a80')
          rect(c, ix + 2, sea - 26, 2, 1, '#8a8a80')
          rect(c, ix - 40, sea, 81, 1, 'rgba(230,244,240,0.7)')
          // uzak bir yelken
          for (let i = 0; i < 6; i++) rect(c, 180 + 5 - i, sea - 6 + i, i + 1, 1, '#f4f2ea')
          rect(c, 178, sea, 10, 1, '#4a5a60')
          // pus şeritleri
          for (let i = 0; i < 18; i++) rect(c, (i * 89) % LAYER_W, B - 170 + ((i * 37) % 80), 40 + (i % 3) * 26, 2, 'rgba(232,240,236,0.35)')
        }),
        mid: layer((c) => {
          const r = rng(2803)
          const base = B - 60
          // Kale tepesi: soldaki yeşil sırt, üstünde Giresun Kalesi; yamaçta fındık bahçesi sıraları
          const top = (x: number) => base - Math.max(0, Math.min(80, 104 - Math.abs(x - 150) * 0.62)) - (Math.abs(x - 150) < 40 ? 0 : 4 * Math.sin(x / 23))
          for (let x = 0; x < LAYER_W; x++) {
            const y = Math.round(Math.min(base, top(x)))
            rect(c, x, y, 1, B - y, s.mid)
            rect(c, x, y, 1, 1, '#7aa47e')
          }
          for (let y = base - 66; y < base - 4; y += 7)
            for (let x = 26 + ((y / 7) % 2) * 6; x < 280; x += 12) if (y - 4 > top(x) && (x < 116 || x > 186 || y > base - 50)) {
              disc(c, x, y, 4, '#3e6a42')
              rect(c, x - 2, y - 3, 2, 1, '#6a9a56')
            }
          const STONE = '#8a8c80'
          const DARK = '#666a60'
          rect(c, 112, base - 92, 76, 14, STONE)
          rect(c, 112, base - 80, 76, 3, DARK)
          for (let x = 112; x < 188; x += 6) rect(c, x, base - 95, 3, 3, STONE)
          for (const [tx, h] of [[116, 22], [146, 30], [176, 20]] as const) {
            rect(c, tx, base - 78 - h, 12, h, STONE)
            rect(c, tx, base - 78 - h, 2, h, '#a6a89a')
            rect(c, tx + 10, base - 78 - h, 2, h, DARK)
            for (let x = tx; x < tx + 12; x += 4) rect(c, x, base - 81 - h, 2, 3, STONE)
            rect(c, tx + 5, base - 72 - h, 2, 4, '#3a3e3a')
          }
          rect(c, 151, base - 124, 1, 16, '#3a3e3a')
          rect(c, 152, base - 124, 9, 5, '#c8243a')
          rect(c, 154, base - 123, 2, 2, '#fff4e8')
          for (let i = 0; i < 9; i++) rect(c, 112 + i * 8, base - 79, 4, 1, 'rgba(110,160,90,0.8)')
          // Zeytinlik: yamaca dizilmiş ahşap çatkılı eski konaklar, kırma kiremit çatı, çıkma pencere
          for (let x = 300; x < 620; x += 30 + Math.floor(r() * 10)) {
            const w = 22 + Math.floor(r() * 6)
            const h = 22 + Math.floor(r() * 10)
            const y = base - Math.floor(r() * 6)
            rect(c, x, y - h, w, h, '#ece4d2')
            rect(c, x, y - h, w, 1, '#fff8ea')
            rect(c, x - 2, y - h + 9, w + 4, 1, '#7a5a42')
            rect(c, x - 2, y - h + 10, w + 4, h - 10, '#e2d8c4')
            for (let wx = x; wx < x + w; wx += 7) rect(c, wx, y - h, 1, h, '#8a6a4e')
            for (let wx = x + 2; wx < x + w - 3; wx += 7) {
              rect(c, wx + 1, y - h + 3, 3, 4, '#46586a')
              rect(c, wx + 1, y - h + 13, 3, 5, '#46586a')
            }
            for (let i = 0; i < 6; i++) rect(c, x - 3 + i, y - h - 1 - i, w + 6 - i * 2, 1, i % 2 ? '#a24a36' : '#8e3e2e')
            rect(c, x + w - 6, y - h - 9, 3, 4, '#6a4a3a')
            if (r() > 0.5) {
              disc(c, x + w + 5, y - 6, 6, '#3e6a42')
              rect(c, x + w + 4, y - 1, 2, 2, '#4a3a2a')
            }
          }
        }),
        near: layer((c) => {
          const r = rng(2804)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          rect(c, 0, base, LAYER_W, 2, '#b8ae96')
          for (let x = 0; x < LAYER_W; x += 22 + Math.floor(r() * 26)) {
            const k = Math.floor(r() * 4)
            if (k === 0) {
              // kıyıya çekilmiş kayık: boyalı tahta tekne, kalkık burun
              const hull = ['#2e6aa0', '#c8402e', '#e8b84a'][Math.floor(r() * 3)]
              rect(c, x, base - 13, 3, 4, hull)
              rect(c, x + 31, base - 12, 3, 3, hull)
              for (let i = 0; i < 8; i++) {
                const ins = Math.round(i * 0.5 + (i > 5 ? i - 5 : 0))
                rect(c, x + ins, base - 9 + i, 34 - ins * 2, 1, i === 0 ? '#f4efe2' : i === 7 ? '#2e2620' : i === 3 ? '#f4efe2' : hull)
              }
              rect(c, x + 4, base - 8, 26, 1, '#4a3a2e')
              rect(c, x + 17, base - 18, 1, 10, '#5a3a28')
              x += 14
            } else if (k === 1) {
              // kiraz ağacı: yuvarlak tepe, kırmızı benekler
              rect(c, x + 6, base - 12, 3, 12, '#4a3424')
              disc(c, x + 7, base - 18, 9, '#2e5a36')
              disc(c, x + 5, base - 21, 5, '#3e7044')
              for (let i = 0; i < 7; i++) rect(c, x + 1 + Math.floor(r() * 12), base - 24 + Math.floor(r() * 12), 2, 2, '#d0283a')
            } else {
              // fındık ocağı
              disc(c, x + 8, base - 7, 8, '#2a4e32')
              for (let i = 0; i < 3; i++) rect(c, x + 3 + Math.floor(r() * 10), base - 12 + Math.floor(r() * 6), 2, 2, '#9a6a34')
            }
          }
        }),
      }
    case 'tokat':
      return {
        far: layer((c) => {
          hills(c, '#c8b4bc', B - 150, 26, 2, 6001)
          hills(c, s.far, B - 116, 30, 3, 6002)
          for (let i = 0; i < 12; i++) rect(c, (i * 113) % LAYER_W, B - 176 + ((i * 41) % 50), 36 + (i % 3) * 20, 2, 'rgba(250,236,220,0.3)')
        }),
        mid: layer((c) => {
          const base = B - 58
          rect(c, 0, base - 6, LAYER_W, B - base + 6, s.mid)
          // kayalık tepede Tokat Kalesi: dik yamaç, katman katman kaya, sur ve burçlar
          const crag = (x: number) => base - 6 - Math.max(0, 96 - Math.abs(x - 470) * 1.1 - Math.max(0, x - 500) * 0.5) + (x % 7 < 2 ? 2 : 0)
          for (let x = 360; x < 620; x++) {
            const y = Math.round(crag(x))
            if (y >= base - 6) continue
            rect(c, x, y, 1, base - y, '#7a6468')
            rect(c, x, y, 1, 2, '#9a8486')
            for (let yy = y + 8; yy < base - 6; yy += 9) if ((x + yy) % 11 < 6) rect(c, x, yy, 1, 1, '#5e4a50')
          }
          const STONE = '#8e7e78'
          const DARK = '#6a5a56'
          rect(c, 430, base - 110, 74, 14, STONE)
          rect(c, 430, base - 98, 74, 2, DARK)
          for (let x = 430; x < 504; x += 6) rect(c, x, base - 113, 3, 3, STONE)
          for (const [tx, h] of [[424, 20], [458, 30], [496, 18]] as const) {
            rect(c, tx, base - 96 - h, 12, h, STONE)
            rect(c, tx, base - 96 - h, 2, h, '#a89a92')
            rect(c, tx + 10, base - 96 - h, 2, h, DARK)
            for (let x = tx; x < tx + 12; x += 4) rect(c, x, base - 99 - h, 2, 3, STONE)
            rect(c, tx + 5, base - 90 - h, 2, 4, '#3a2e30')
          }
          rect(c, 463, base - 146, 1, 16, '#3a2e30')
          rect(c, 464, base - 146, 10, 6, '#c8302a')
          rect(c, 466, base - 144, 2, 2, '#fff4e8')
          // Gök Medrese: taç kapı, içinde sivri kemerli niş, firuze çini kuşak; yanında kubbeler
          const mx = 120
          rect(c, mx - 20, base - 40, 40, 34, '#c8b49a')
          rect(c, mx - 20, base - 40, 40, 2, '#e0d0b8')
          rect(c, mx - 12, base - 34, 24, 28, '#a8927a')
          for (let i = 0; i < 8; i++) rect(c, mx - 12 + i, base - 34 - i, 24 - i * 2, 1, '#a8927a')
          rect(c, mx - 7, base - 26, 14, 20, '#4a3a3e')
          for (let i = 0; i < 5; i++) rect(c, mx - 7 + i, base - 26 - i, 14 - i * 2, 1, '#4a3a3e')
          rect(c, mx - 20, base - 36, 40, 2, '#3a9aa4')
          for (let x = mx - 18; x < mx + 18; x += 4) rect(c, x, base - 36, 2, 1, '#8ad4d4')
          for (let y = base - 32; y < base - 8; y += 4) {
            rect(c, mx - 17, y, 2, 2, '#3a9aa4')
            rect(c, mx + 15, y, 2, 2, '#3a9aa4')
          }
          dome(c, mx - 40, base - 6, 14, '#9a8a84')
          dome(c, mx + 44, base - 6, 12, '#9a8a84')
          minaret(c, mx + 62, base - 6, 46, '#b4a49a')
          dome(c, 250, base - 6, 18, '#8e7e7a')
          rect(c, 232, base - 8, 36, 2, '#7a6a66')
          minaret(c, 274, base - 6, 54, '#b4a49a')
          // Yeşilırmak: şehrin içinden geçen ırmak
          const river = base + 4
          rect(c, 0, river - 1, LAYER_W, 1, '#4a3a3e')
          rect(c, 0, river, LAYER_W, 9, '#5a8aa4')
          rect(c, 0, river, LAYER_W, 2, '#7aaec0')
          for (let i = 0; i < 38; i++) rect(c, (i * 43) % LAYER_W, river + 3 + ((i * 5) % 5), 4 + (i % 3) * 4, 1, 'rgba(232,246,250,0.6)')
          rect(c, 0, river + 9, LAYER_W, 1, '#4a3a3e')
        }),
        near: layer((c) => {
          const r = rng(6003)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Taşhan: iki katlı kesme taş ve tuğla han; altta ve üstte revak kemerleri
          const tx = 40
          rect(c, tx, base - 40, 150, 40, '#a05a48')
          rect(c, tx, base - 40, 150, 2, '#c47a62')
          rect(c, tx - 2, base - 42, 154, 2, '#d8c4a4')
          rect(c, tx, base - 21, 150, 2, '#d8c4a4')
          for (let x = tx + 3; x < tx + 146; x += 12) {
            for (const [y0, h] of [[base - 36, 12], [base - 16, 16]] as const) {
              rect(c, x + 2, y0 + 3, 8, h - 3, '#3e2a2a')
              for (let i = 0; i < 3; i++) rect(c, x + 2 + i, y0 + 2 - i, 8 - i * 2, 1, '#3e2a2a')
              rect(c, x + 1, y0 - 1, 1, h + 1, '#d8c4a4')
            }
          }
          rect(c, tx + 64, base - 18, 22, 18, '#2e2020')
          for (let i = 0; i < 6; i++) rect(c, tx + 64 + i, base - 18 - i, 22 - i * 2, 1, '#2e2020')
          // saat kulesi
          const cx = 232
          rect(c, cx, base - 64, 12, 64, '#c8b49a')
          rect(c, cx, base - 64, 2, 64, '#e0d0b8')
          rect(c, cx + 10, base - 64, 2, 64, '#9a8670')
          rect(c, cx - 1, base - 66, 14, 2, '#8a7660')
          for (let i = 0; i < 8; i++) rect(c, cx + i * 0.75, base - 67 - i, 12 - i * 1.5, 1, '#6a5a6a')
          disc(c, cx + 6, base - 54, 4, '#f4ead8')
          rect(c, cx + 6, base - 57, 1, 3, '#2a2420')
          rect(c, cx + 6, base - 54, 3, 1, '#2a2420')
          rect(c, cx + 4, base - 30, 4, 6, '#3e2a2a')
          // söğütler: Yeşilırmak kıyısında sarkık dallar
          for (let x = 270; x < LAYER_W - 10; x += 34 + Math.floor(r() * 22)) {
            rect(c, x + 7, base - 14, 3, 14, '#4a3828')
            disc(c, x + 8, base - 22, 10, '#5a7a3e')
            disc(c, x + 5, base - 25, 6, '#7a9a4e')
            for (let i = -10; i <= 10; i += 2) {
              const len = 10 + Math.floor(r() * 8) - Math.abs(i) / 2
              rect(c, x + 8 + i, base - 22 + Math.floor(Math.sqrt(Math.max(0, 100 - i * i)) * 0.6), 1, len, i % 4 ? '#6a8a44' : '#8aaa5a')
            }
          }
        }),
      }
    case 'zonguldak':
      return zonguldakLayers(s, B)
    case 'mersin':
      return mersinLayers(s, B)
    case 'karabuk':
      return karabukLayers(s, B)
    case 'aydin':
      return aydinLayers(s, B)
    case 'balikesir':
      return balikesirLayers(s, B)
    case 'bingol':
      return bingolLayers(s, B)
    case 'adiyaman':
      return adiyamanLayers(s, B)
    case 'kastamonu':
      return kastamonuLayers(s, B)
    case 'afyon':
      return afyonLayers(s, B)
    case 'elazig':
      return elazigLayers(s, B)
    case 'denizli':
      return {
        far: layer((c) => {
          // Honaz Dağı: karlı doruk, önünde yumuşak tepeler
          hills(c, '#b0c4d4', B - 160, 44, 2, 2001)
          snowCaps(c, '#f6fafc', B - 160, 44, 2, 2001)
          hills(c, s.far, B - 116, 22, 3, 2002)
        }),
        mid: layer((c) => {
          const r = rng(2003)
          const base = B - 56
          rect(c, 0, base - 4, LAYER_W, B - base + 4, s.mid)
          // Hierapolis tiyatrosu: yamaca oyulmuş yay biçimli oturma sıraları, önünde kemerli sahne binası
          const hx = 120
          for (let x = hx - 116; x <= hx + 116; x++) {
            const k = (x - hx) / 116
            const y = Math.round(base - 4 - 80 * (1 - k * k))
            rect(c, x, y, 1, base - y, '#a4b08c')
            rect(c, x, y, 1, 1, '#bcc6a0')
          }
          for (let i = 0; i < 10; i++) {
            const y = base - 22 - i * 4
            const w = 30 + i * 4
            for (let x = -w; x <= w; x++) {
              const dy = Math.round(((x * x) / (w * w)) * (6 + i * 0.6))
              rect(c, hx + x, y + dy, 1, 3, i % 2 ? '#e6d8ba' : '#d2c2a2')
              rect(c, hx + x, y + dy + 3, 1, 1, '#9a8a6e')
            }
          }
          rect(c, hx - 54, base - 22, 108, 18, '#d8c8a6')
          rect(c, hx - 54, base - 22, 108, 2, '#eee2c8')
          rect(c, hx - 54, base - 6, 108, 2, '#b4a484')
          for (let x = hx - 50; x < hx + 50; x += 10) {
            rect(c, x + 2, base - 15, 6, 9, '#6e6050')
            for (let i = 0; i < 3; i++) rect(c, x + 2 + i, base - 16 - i, 6 - i * 2, 1, '#6e6050')
            rect(c, x, base - 20, 2, 14, '#f0e6cc')
          }
          // Pamukkale: bembeyaz traverten yamacı; basamak basamak turkuaz havuzlar, kenarlarından sarkan kireç perdesi
          const pk = 470
          const slope = (x: number) => {
            const k = (x - pk) / (x < pk ? 190 : 165)
            return Math.abs(k) >= 1 ? base : Math.round(base - 4 - 92 * Math.cos((k * Math.PI) / 2) ** 1.6 - 3 * Math.sin(x * 0.11))
          }
          for (let x = 270; x < LAYER_W; x++) {
            const y = slope(x)
            if (y >= base) continue
            rect(c, x, y, 1, base - y, x > pk ? '#eceeec' : '#f8f8f4')
            rect(c, x, y, 1, 1, '#ffffff')
          }
          for (let k = 0; k < 10; k++) {
            const y = base - 10 - k * 9
            let x = 270
            while (x < LAYER_W) {
              if (slope(x) > y - 4 || slope(x + 8) > y - 4) {
                x++
                continue
              }
              const pw = 12 + Math.floor(r() * 20)
              let e = x
              while (e < x + pw && slope(e + 3) <= y - 4 && e < LAYER_W - 1) e++
              if (e - x > 5) {
                // havuz: turkuaz su, ışıklı kenar; altında beyaz set ve dikine damlalar
                rect(c, x + 1, y - 3, e - x - 2, 3, '#62cad8')
                rect(c, x, y - 2, e - x, 2, '#62cad8')
                rect(c, x + 1, y - 3, e - x - 2, 1, '#aaeef2')
                rect(c, x, y, e - x, 1, '#ffffff')
                for (let dx = x + 1; dx < e - 1; dx += 2) rect(c, dx, y + 1, 1, 2 + ((dx * 7 + k * 3) % 4), '#d6dcde')
              }
              x = e + 3 + Math.floor(r() * 3)
            }
          }
          // yamaçtaki ağaçlar
          for (const x of [262, 250, 636]) disc(c, x, base - 8, 6, '#6a8a6a')
        }),
        near: layer((c) => {
          const r = rng(2004)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Laodikeia: mermer sütun sırası; birinin üstünde arşitrav, kimi yarıda kırık
          const column = (x: number, h: number, cap: boolean) => {
            rect(c, x - 1, base - 3, 8, 3, '#d4ccb8')
            rect(c, x, base - 3 - h, 6, h, '#ece6d6')
            rect(c, x, base - 3 - h, 1, h, '#fffaf0')
            rect(c, x + 2, base - 3 - h, 1, h, '#cfc6b2')
            rect(c, x + 4, base - 3 - h, 1, h, '#cfc6b2')
            rect(c, x + 5, base - 3 - h, 1, h, '#b8ae98')
            if (cap) {
              rect(c, x - 1, base - 6 - h, 8, 3, '#e2dac6')
              rect(c, x - 2, base - 7 - h, 10, 1, '#f4eee0')
            } else {
              rect(c, x + 1, base - 4 - h, 3, 1, '#ece6d6')
            }
          }
          for (const g of [40, 330]) {
            rect(c, g - 6, base - 3, 120, 3, '#c4bca8')
            const hs = [46, 46, 46, 30, 46, 18]
            for (let i = 0; i < 6; i++) column(g + i * 18, hs[i], hs[i] === 46)
            rect(c, g - 3, base - 58, 48, 5, '#e2dac6')
            rect(c, g - 3, base - 58, 48, 1, '#fffaf0')
            rect(c, g - 3, base - 54, 48, 1, '#b8ae98')
            for (let x = g; x < g + 44; x += 4) rect(c, x, base - 56, 2, 1, '#c8bea8')
            rect(c, g + 68, base - 6, 12, 6, '#d8d0bc')
          }
          // zeytin ve beyaz traverten kayaları
          for (let x = 170; x < LAYER_W; x += 26 + Math.floor(r() * 18)) {
            if (x > 310 && x < 460) continue
            if (r() > 0.4) {
              rect(c, x + 6, base - 10, 2, 10, '#5a4a3a')
              disc(c, x + 7, base - 14, 7, '#6e8a5e')
              disc(c, x + 4, base - 16, 4, '#8aa46e')
            } else {
              disc(c, x + 6, base - 2, 5, '#eeeee8', true)
              rect(c, x + 3, base - 6, 4, 1, '#ffffff')
            }
          }
        }),
      }
    case 'rize':
      return {
        far: layer((c) => {
          // sisli, ormanlı Kaçkar eteği
          hills(c, s.far, B - 128, 44, 3, 1301)
          for (let i = 0; i < 30; i++) rect(c, (i * 67) % LAYER_W, B - 160 + ((i * 23) % 70), 34 + (i % 4) * 16, 3, 'rgba(226,236,232,0.4)')
        }),
        mid: layer((c) => {
          const base = B - 56
          // yamaç: üstünde sıra sıra çay terasları
          for (let x = 0; x < LAYER_W; x++) {
            const t = (x / LAYER_W) * Math.PI * 2
            const h = base - 46 - 22 * Math.sin(t * 2 + 0.6)
            rect(c, x, h, 1, B - h, s.mid)
            for (let y = h + 4; y < base + 10; y += 6) if ((x + Math.floor(y / 6) * 3) % 7 < 5) rect(c, x, y, 1, 3, '#4f8a5c')
          }
          // Zil Kale: ormandan yükselen kaya, üstünde yuvarlak burç ve mazgallar
          for (let x = 450; x < 550; x++) rect(c, x, base - 68 + ((x - 500) / 50) ** 2 * 70, 1, 120, '#355a44')
          for (const [tx, ty] of [[462, -40], [474, -56], [526, -56], [538, -40], [452, -22], [548, -22]] as const) disc(c, tx, base + ty, 6, '#2e5a3a')
          rect(c, 484, base - 104, 30, 36, '#5a5e58')
          rect(c, 494, base - 126, 14, 24, '#5a5e58')
          for (let x = 484; x < 514; x += 6) rect(c, x, base - 108, 3, 4, '#5a5e58')
          for (let x = 494; x < 508; x += 5) rect(c, x, base - 130, 3, 4, '#5a5e58')
          rect(c, 498, base - 116, 3, 5, '#2a2e2a')
          rect(c, 490, base - 92, 3, 5, '#2a2e2a')
          rect(c, 504, base - 92, 3, 5, '#2a2e2a')
          // sis şeritleri kalenin önünden geçer
          for (let i = 0; i < 12; i++) rect(c, (i * 97) % LAYER_W, base - 80 + ((i * 29) % 60), 50 + (i % 3) * 24, 2, 'rgba(226,236,232,0.35)')
        }),
        near: layer((c) => {
          const r = rng(1302)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // dere ve taş kemer köprü
          rect(c, 180, base, 140, 40, '#2e5a62')
          for (let i = 0; i < 10; i++) rect(c, 186 + ((i * 37) % 120), base + 4 + ((i * 7) % 14), 8, 1, 'rgba(200,236,236,0.5)')
          for (let x = 180; x < 320; x++) {
            const k = (x - 250) / 70
            const top = base - 30 + k * k * 8
            const under = base + 8 - Math.sqrt(Math.max(0, 1 - k * k * 1.6)) * 32
            rect(c, x, top, 1, Math.max(2, under - top), '#6e6a5e')
          }
          for (let x = 180; x < 320; x += 1) rect(c, x, base - 31 + ((x - 250) / 70) ** 2 * 8, 1, 1, '#8e8a7c')
          // çay çalıları
          for (let x = 0; x < LAYER_W; x += 9) {
            if (x > 170 && x < 330) continue
            disc(c, x + 4, base - 3 - Math.floor(r() * 2), 5, '#2e5a38')
            rect(c, x + 2, base - 7, 2, 1, '#6aa24e')
          }
        }),
      }
    case 'artvin':
      return {
        far: layer((c) => {
          // Kaçkarlar: dik, sivri sırtlar; tepede kar
          hills(c, '#9ab0b8', B - 150, 46, 5, 1311)
          snowCaps(c, '#f4f8fa', B - 150, 46, 5, 1311)
          hills(c, s.far, B - 112, 38, 4, 1312)
        }),
        mid: layer((c) => {
          const r = rng(1313)
          const base = B - 56
          // dik yamaç: soldan sağa düşen, yamaca yapışık evler
          const slope = (x: number) => base - 110 + x * 0.17 + Math.sin(x / 40) * 6
          for (let x = 0; x < LAYER_W; x++) {
            const h = Math.min(slope(x), base)
            rect(c, x, h, 1, B - h, s.mid)
          }
          // Çoruh: vadinin dibinde turkuaz, hızlı akan nehir; ön katmanın (kıyı ağaçları) üstünde görünür kalır.
          // Eskiden ön katmanın en altındaydı ve zeminin arkasında kalıyordu.
          const river = base + 8
          rect(c, 0, river - 1, LAYER_W, 1, '#2a4a40')
          rect(c, 0, river, LAYER_W, 11, '#3a9aa8')
          rect(c, 0, river, LAYER_W, 2, '#5cc0c8')
          rect(c, 0, river + 11, LAYER_W, 1, '#2a4a40')
          for (let i = 0; i < 46; i++) rect(c, (i * 37) % LAYER_W, river + 3 + ((i * 5) % 7), 5 + (i % 3) * 4, 1, 'rgba(230,252,252,0.7)')
          for (let x = 10; x < 560; x += 30 + Math.floor(r() * 20)) {
            const y = slope(x) + 8 + Math.floor(r() * 14)
            rect(c, x, y - 10, 14, 10, '#e6e0d2')
            for (let i = 0; i < 8; i++) rect(c, x - 1 + i, y - 10 - i / 2, 16 - i * 2, 1, '#8a3a2a')
            rect(c, x + 3, y - 7, 2, 3, '#3a3a40')
            rect(c, x + 9, y - 7, 2, 3, '#3a3a40')
            rect(c, x + 1, y, 12, 1, '#5a4030')
          }
          // köy teleferiği: vadinin üstünden gerilmiş iki kalın tel, sepetli vagon
          const cable = (x: number) => base - 104 + (x - 40) * 0.12 + ((x - 320) / 280) ** 2 * -14 + 14
          wire(c, 40, 600, cable, '#1e2622')
          wire(c, 40, 600, (x) => cable(x) + 4, '#3a4640', 1)
          for (const cx of [210, 430]) {
            const y = Math.round(cable(cx)) + 2
            rect(c, cx, y, 1, 4, '#1e2622')
            rect(c, cx - 5, y + 4, 11, 7, '#1e2622')
            rect(c, cx - 4, y + 5, 9, 5, '#d8a838')
            rect(c, cx - 3, y + 6, 7, 2, '#3a3a40')
          }
          rect(c, 36, base - 108, 4, 16, '#1e2622')
          rect(c, 598, base - 46, 4, 20, '#1e2622')
        }),
        near: layer((c) => {
          const r = rng(1314)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // kıyıda çam ve kayın
          for (let x = 4; x < LAYER_W; x += 18 + Math.floor(r() * 16)) {
            const h = 14 + Math.floor(r() * 12)
            rect(c, x + 3, base - 2, 2, 4, '#3a2a20')
            for (let i = 0; i < h; i += 3) rect(c, x + 4 - (h - i) / 4, base - 2 - i, (h - i) / 2, 2, '#24402e')
          }
        }),
      }
    case 'kars':
      return {
        far: layer((c) => {
          // karlı yayla; ufukta Ani katedrali (kızıl tüf)
          hills(c, s.far, B - 100, 16, 2, 1321)
          snowCaps(c, '#f6f9fd', B - 100, 16, 2, 1321)
          const ax = 120
          const ab = B - 98
          rect(c, ax, ab - 26, 44, 26, '#9a7a72')
          rect(c, ax + 14, ab - 38, 16, 12, '#9a7a72')
          for (let i = 0; i < 9; i++) rect(c, ax + 14 + i, ab - 38 - i, 16 - i * 2, 1, '#9a7a72')
          for (const wx of [ax + 6, ax + 20, ax + 34]) rect(c, wx, ab - 20, 3, 8, '#6e5450')
          rect(c, ax + 21, ab - 34, 2, 5, '#6e5450')
        }),
        mid: layer((c) => {
          const base = B - 60
          // Kars Kalesi: kayalık tepe, sur ve burçlar, üstleri karlı
          for (let x = 300; x < 560; x++) rect(c, x, base - 40 + Math.max(0, Math.abs(x - 430) - 60) * 0.5, 1, 100, s.mid)
          rect(c, 360, base - 66, 140, 26, '#5e6a7e')
          for (let x = 360; x < 500; x += 7) rect(c, x, base - 70, 4, 4, '#5e6a7e')
          for (const tx of [360, 420, 486]) {
            rect(c, tx, base - 84, 16, 20, '#5e6a7e')
            for (let x = tx; x < tx + 16; x += 5) rect(c, x, base - 88, 3, 4, '#5e6a7e')
            rect(c, tx, base - 88, 16, 1, '#f6f9fd')
            rect(c, tx + 6, base - 78, 3, 5, '#2e3446')
          }
          rect(c, 360, base - 70, 140, 1, '#f6f9fd')
          // Türk bayrağı
          rect(c, 427, base - 104, 1, 18, '#2e3446')
          rect(c, 428, base - 104, 10, 6, '#c8302a')
          rect(c, 0, base, LAYER_W, 60, s.mid)
        }),
        near: layer((c) => {
          const r = rng(1322)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, '#e6edf6')
          // Baltık taş binalar: iki katlı bazalt cephe, uzun kemerli pencere, saçakta kar
          for (let x = 0; x < LAYER_W; x += 70 + Math.floor(r() * 30)) {
            const w = 40 + Math.floor(r() * 10)
            rect(c, x, base - 34, w, 34, '#3e4656')
            rect(c, x - 2, base - 36, w + 4, 3, '#4e5668')
            rect(c, x - 2, base - 38, w + 4, 2, '#f6f9fd')
            rect(c, x, base - 18, w, 1, '#4e5668')
            for (let wx = x + 4; wx < x + w - 5; wx += 9)
              for (const wy of [base - 31, base - 15]) {
                rect(c, wx, wy, 4, 9, '#a8b8cc')
                rect(c, wx + 1, wy - 1, 2, 1, '#a8b8cc')
                rect(c, wx, wy + 9, 4, 1, '#f6f9fd')
              }
            // yanında karlı çam
            const px = x + w + 10
            const h = 20 + Math.floor(r() * 8)
            rect(c, px + 3, base - 4, 2, 4, '#3a2a20')
            for (let i = 0; i < h; i += 4) {
              rect(c, px + 4 - (h - i) / 4, base - 4 - i, (h - i) / 2, 3, '#2e4a46')
              rect(c, px + 4 - (h - i) / 4, base - 4 - i, (h - i) / 2, 1, '#f6f9fd')
            }
          }
        }),
      }
    case 'bitlis':
      return {
        far: layer((c) => {
          // Nemrut: geniş, tepesi çökük volkan; kraterde göl ışıltısı
          hills(c, s.far, B - 90, 12, 2, 1331)
          for (let x = 280; x < 600; x++) {
            const k = Math.abs(x - 440) / 160
            const dip = Math.abs(x - 440) < 46 ? Math.cos(((x - 440) / 46) * Math.PI * 0.5) * 8 : 0
            const h = B - 186 + k * k * 96 + dip
            rect(c, x, h, 1, B - h, s.far)
          }
          rect(c, 410, B - 182, 60, 2, '#7ab0b8')
        }),
        mid: layer((c) => {
          const r = rng(1332)
          const base = B - 56
          // dar vadi: iki dik yamaç, yamaçlarda taş evler
          for (let x = 0; x < LAYER_W; x++) {
            const d = Math.abs(((x + 160) % LAYER_W) - 320) / 320
            const h = base - 10 - d * d * 76
            rect(c, x, h, 1, B - h, s.mid)
          }
          for (let i = 0; i < 26; i++) {
            const x = Math.floor(r() * LAYER_W)
            const d = Math.abs(((x + 160) % LAYER_W) - 320) / 320
            const y = base - 4 - d * d * 70 + Math.floor(r() * 8)
            rect(c, x, y - 9, 12, 9, '#b09a84')
            rect(c, x - 1, y - 10, 14, 1, '#8a7462')
            rect(c, x + 3, y - 6, 2, 3, '#3a2e28')
            rect(c, x + 8, y - 6, 2, 3, '#3a2e28')
          }
          // vadinin ortasında kale kayası ve Bitlis Kalesi
          for (let x = 116; x < 204; x++) rect(c, x, base - 48 + Math.max(0, Math.abs(x - 160) - 24) * 2.2, 1, 80, '#5e463e')
          rect(c, 138, base - 70, 44, 22, '#8a7462')
          for (let x = 138; x < 182; x += 6) rect(c, x, base - 74, 3, 4, '#8a7462')
          rect(c, 166, base - 86, 12, 16, '#8a7462')
          rect(c, 170, base - 80, 3, 4, '#3a2e28')
        }),
        near: layer((c) => {
          const r = rng(1333)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, s.near)
          // Ahlat mezar taşları: ince uzun, sivri ya da yuvarlak tepeli, oyma süslü
          for (let x = 6; x < LAYER_W; x += 22 + Math.floor(r() * 18)) {
            const h = 18 + Math.floor(r() * 16)
            const w = 7 + Math.floor(r() * 3)
            rect(c, x, base - h, w, h, '#7e6050')
            if (r() > 0.5) for (let i = 0; i < 4; i++) rect(c, x + i, base - h - i, w - i * 2, 1, '#7e6050')
            else disc(c, x + w / 2, base - h, w / 2, '#7e6050', true)
            rect(c, x + 2, base - h + 4, w - 4, 1, '#5a4236')
            rect(c, x + 2, base - h + 6, w - 4, 1, '#5a4236')
            // yanında kavak
            if (r() > 0.65) {
              rect(c, x + w + 6, base - 4, 1, 4, '#3a2a20')
              for (let i = 0; i < 22; i++) rect(c, x + w + 5 - Math.round(Math.sin((i / 22) * Math.PI) * 2), base - 4 - i, 3 + Math.round(Math.sin((i / 22) * Math.PI) * 4), 1, '#5a6a3a')
            }
          }
        }),
      }
    case 'agri':
      return {
        far: layer((c) => {
          // Ağrı Dağı: geniş Büyük Ağrı, sağında sivri Küçük Ağrı; ikisinin de tepesi karlı
          const cone = (cx: number, top: number, half: number, snow: number) => {
            for (let x = cx - half; x < cx + half; x++) {
              const k = Math.abs(x - cx) / half
              const h = top + Math.pow(k, 1.4) * (B - 60 - top)
              rect(c, x, h, 1, B - h, '#a8b0c4')
              const sn = Math.max(0, snow * (1 - k * 1.6) + Math.sin(x * 0.9) * 3)
              rect(c, x, h, 1, sn, '#f6f9fe')
            }
          }
          cone(490, B - 150, 96, 18)
          cone(250, B - 196, 190, 46)
          hills(c, s.far, B - 74, 8, 2, 1341)
        }),
        mid: layer((c) => {
          const base = B - 56
          // tepe, üstünde İshak Paşa Sarayı: sur, kubbe, minare, taç kapı
          for (let x = 0; x < LAYER_W; x++) {
            const h = base - 6 - Math.max(0, 24 - Math.max(0, Math.abs(x - 130) - 66) * 0.3)
            rect(c, x, h, 1, B - h, s.mid)
          }
          const sx = 70
          const sb = base - 30
          const stone = '#b8987a'
          rect(c, sx, sb - 24, 120, 24, stone)
          for (let x = sx; x < sx + 120; x += 6) rect(c, x, sb - 28, 3, 4, stone)
          rect(c, sx + 4, sb - 40, 20, 16, stone)
          for (let x = sx + 4; x < sx + 24; x += 5) rect(c, x, sb - 43, 3, 3, stone)
          // taç kapı
          rect(c, sx + 36, sb - 34, 18, 34, stone)
          rect(c, sx + 41, sb - 22, 8, 22, '#5a4434')
          disc(c, sx + 45, sb - 22, 4, '#5a4434', true)
          // kubbe ve minare
          dome(c, sx + 80, sb - 24, 13, stone)
          minaret(c, sx + 104, sb - 24, 40, stone, 4)
          for (let x = sx + 60; x < sx + 120; x += 8) rect(c, x, sb - 16, 3, 5, '#5a4434')
        }),
        near: layer((c) => {
          const r = rng(1342)
          const base = B - 24
          rect(c, 0, base, LAYER_W, 40, '#e8eef6')
          // karlı bozkır: alçak toprak damlı evler, önlerinde tezek yığınları, çit
          for (let x = 0; x < LAYER_W; x += 60 + Math.floor(r() * 40)) {
            const w = 26 + Math.floor(r() * 10)
            rect(c, x, base - 12, w, 12, '#7a6656')
            rect(c, x - 2, base - 14, w + 4, 3, '#f6f9fe')
            rect(c, x + 5, base - 8, 4, 8, '#3a2e28')
            rect(c, x + w - 9, base - 9, 4, 3, 'rgba(255,200,110,0.75)')
            for (let i = 0; i < 4; i++) rect(c, x + w + 6 + i, base - 8 + i * 2, 10 - i * 2, 2, '#5a4234')
          }
          for (let x = 3; x < LAYER_W; x += 12) rect(c, x, base - 6, 2, 6, '#5a4a3c')
          for (let x = 0; x < LAYER_W; x += 1) rect(c, x, base - 4, 1, 1, '#5a4a3c')
        }),
      }
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
          wire(c, 120, 300, (x) => B - 70 - (x - 120) * 0.4, '#3a5046', 1)
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
          wire(c, 60, 470, (x) => B - 120 - (x - 60) * 0.08, '#22302a')
          rect(c, 57, B - 122, 3, 30, '#22302a')
          rect(c, 469, B - 154, 3, 16, '#22302a')
          for (const cx of [160, 300]) {
            const y = Math.round(B - 120 - (cx - 60) * 0.08)
            rect(c, cx, y, 1, 6, '#22302a')
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

/** piksel doğru (arka plan çizgisi): uçtan uca adım adım */
function seg(c: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, w = 1) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= n; i++) rect(c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w, w, color)
}

/** Zonguldak: yağmurlu Karadeniz, yamaçta evler, maden kuyusu kuleleri, kömür yığınları; önde liman vinci ve vagonlar */
function zonguldakLayers(s: CityStyle, B: number): Layers {
  // maden kuyusu kulesi: iki ayaklı kafes çerçeve, tepede iki çark, arkada eğik payanda; altında kuyu binası
  const headframe = (c: Ctx, x: number, base: number, h: number, col: string, lit: string, t: number) => {
    const top = base - h
    const w = Math.round(h * 0.34)
    // eğik payanda (vinç dairesine doğru)
    seg(c, x + w / 2, top + 6, x + w / 2 + h * 0.55, base - 4, col, 2)
    seg(c, x + w / 2 - 3, top + 10, x + w / 2 + h * 0.45, base - 4, col, 1)
    // iki ayak: aşağı açılır
    for (const k of [0, 1]) seg(c, x + k * w, top + 4, x - 6 + k * (w + 12), base, col, 2)
    // kafes: yatay kirişler ve çaprazlar
    for (let y = top + 10, i = 0; y < base - 4; y += 12, i++) {
      const spread = ((y - top) / h) * 6
      const xl = x - spread
      const xr = x + w + spread
      rect(c, xl, y, xr - xl + 1, 1, col)
      const ny = Math.min(base - 4, y + 12)
      const nspread = ((ny - top) / h) * 6
      if (i % 2) seg(c, xl, y, x + w + nspread, ny, col)
      else seg(c, xr, y, x - nspread, ny, col)
    }
    // tepe platformu ve iki çark
    rect(c, x - 3, top + 3, w + 7, 2, col)
    for (const [cx, r] of [[x + 3, Math.round(h * 0.09)], [x + w - 3, Math.round(h * 0.09)]] as const) {
      for (let a = 0; a < 40; a++) {
        const an = (a / 40) * Math.PI * 2
        rect(c, cx + Math.cos(an) * r, top + Math.sin(an) * r, 1, 1, col)
      }
      for (let k = 0; k < 4; k++) {
        const an = (k / 4) * Math.PI + t
        seg(c, cx - Math.cos(an) * r, top - Math.sin(an) * r, cx + Math.cos(an) * r, top + Math.sin(an) * r, col)
      }
      rect(c, cx - 1, top - 1, 2, 2, col)
    }
    // halat: çarktan payandanın dibine
    seg(c, x + 3 + h * 0.09, top, x + w / 2 + h * 0.55 - 2, base - 12, 'rgba(30,30,34,0.7)')
    // kuyu binası, ışıklı pencereler
    rect(c, x - 10, base - 14, w + 20, 14, col)
    for (let wx = x - 6; wx < x + w + 8; wx += 6) rect(c, wx, base - 10, 3, 4, lit)
  }
  return {
    far: layer((c) => {
      // puslu Karadeniz: arkada yağmura gömülü sırtlar, önde gri-yeşil deniz; ufukta kömür gemisi
      const sea = B - 92
      hills(c, '#8e9ca2', B - 158, 22, 2, 3901)
      hills(c, s.far, B - 128, 28, 3, 3902)
      for (let i = 0; i < 26; i++) rect(c, (i * 97) % LAYER_W, B - 190 + ((i * 29) % 70), 1, 9 + (i % 3) * 4, 'rgba(220,228,232,0.22)')
      rect(c, 0, sea, LAYER_W, B - sea, '#4e6c78')
      rect(c, 0, sea, LAYER_W, 1, '#b6c6ca')
      rect(c, 0, sea + 1, LAYER_W, 5, '#5e7c86')
      for (let i = 0; i < 44; i++) rect(c, (i * 67) % LAYER_W, sea + 5 + ((i * 13) % 50), 5 + (i % 4) * 4, 1, i % 3 ? 'rgba(200,218,222,0.4)' : 'rgba(240,246,246,0.55)')
      // kömür gemisi: koyu gövde, kıç köşkü, iki vinç
      const gx = 400
      rect(c, gx, sea - 5, 60, 5, '#2e3438')
      rect(c, gx + 2, sea - 1, 56, 1, '#8a3a2a')
      rect(c, gx + 48, sea - 13, 9, 8, '#d8d6cc')
      rect(c, gx + 50, sea - 11, 5, 1, '#3e4a52')
      rect(c, gx + 52, sea - 17, 2, 4, '#2e3438')
      for (const dx of [14, 30]) {
        rect(c, gx + dx, sea - 16, 1, 11, '#2e3438')
        seg(c, gx + dx, sea - 16, gx + dx + 7, sea - 8, '#2e3438')
      }
      // pus şeritleri
      for (let i = 0; i < 16; i++) rect(c, (i * 83) % LAYER_W, B - 172 + ((i * 31) % 70), 42 + (i % 3) * 24, 2, 'rgba(214,222,222,0.3)')
    }),
    mid: layer((c) => {
      const r = rng(3903)
      const base = B - 58
      // koyu yeşil yamaç: soldan yükselen sırt, yamaca tutunmuş evler
      const top = (x: number) => base - Math.max(0, 74 - Math.abs(x - 110) * 0.42) - 6 * Math.sin(x / 31) - 8
      for (let x = 0; x < LAYER_W; x++) {
        const y = Math.round(Math.min(base - 4, top(x)))
        rect(c, x, y, 1, B - y, s.mid)
        rect(c, x, y, 1, 1, '#5e7a5c')
        if (x % 9 < 4) rect(c, x, y + 1, 1, 2, '#4a6650')
      }
      // yamaçta ağaç kümeleri
      for (let i = 0; i < 26; i++) {
        const x = 6 + ((i * 53) % 290)
        const y = Math.round(top(x)) + 6 + ((i * 7) % 10)
        disc(c, x, y, 4, '#2e4436')
        rect(c, x - 2, y - 3, 2, 1, '#557a54')
      }
      // yamaç evleri: basamak basamak, beyaz ve pastel cephe, kiremit çatı, sarı ışıklı pencere
      const FACE = ['#e8e4da', '#d8c8a8', '#c8d4d0', '#e0c8b8']
      for (let x = 16; x < 300; x += 18 + Math.floor(r() * 8)) {
        const w = 12 + Math.floor(r() * 6)
        const h = 10 + Math.floor(r() * 8)
        const y = Math.round(top(x + w / 2)) + 10 + Math.floor(r() * 10)
        rect(c, x, y - h, w, h + 6, FACE[Math.floor(r() * FACE.length)])
        rect(c, x + w - 2, y - h, 2, h + 6, 'rgba(40,40,50,0.25)')
        for (let i = 0; i < 4; i++) rect(c, x - 1 + i, y - h - 1 - i, w + 2 - i * 2, 1, i % 2 ? '#9a4232' : '#8a3a2c')
        for (let wx = x + 2; wx < x + w - 2; wx += 4) rect(c, wx, y - h + 3, 2, 3, r() > 0.45 ? '#f2c860' : '#3e4a58')
      }
      // Çatalağzı bacası: kırmızı-beyaz kuşaklı, tepesinden duman
      const cx = 620
      for (let y = base - 120; y < base; y++) {
        const hw = 3 + Math.round((y - (base - 120)) / 40)
        rect(c, cx - hw, y, hw * 2, 1, Math.floor((y - (base - 120)) / 10) % 2 ? '#e8e4dc' : '#b83a2e')
      }
      for (let i = 0; i < 7; i++) disc(c, cx - 8 - i * 9, base - 128 - i * 3, 5 + i, `rgba(196,200,204,${0.55 - i * 0.06})`)
      // kömür yığınları: kara tepeler, üstünde parlak kırıntı
      for (const [hx, hw, hh] of [[300, 46, 22], [452, 34, 16], [560, 52, 26]] as const) {
        for (let x = -hw; x <= hw; x++) {
          const yy = Math.round(hh * (1 - (x * x) / (hw * hw)) + Math.sin(x * 0.7) * 1.2)
          rect(c, hx + x, base - yy, 1, yy + 4, '#1c1c20')
          if (x < 0 && (x * 7) % 5 === 0) rect(c, hx + x, base - yy + 1, 1, 1, '#6a6a72')
        }
        for (let i = 0; i < 6; i++) rect(c, hx - hw / 2 + ((i * 11) % hw), base - hh * 0.5 + ((i * 5) % 8), 1, 1, '#9a9aa4')
      }
      // maden kuyusu kuleleri (Kozlu, Üzülmez): koyu demir kafes, pencerelerde lamba ışığı
      headframe(c, 370, base, 108, '#2a2e32', '#f2b04a', 0.4)
      headframe(c, 505, base, 76, '#363a3e', '#f2b04a', 1.1)
      // bant konveyör: kuleden yığına eğik
      seg(c, 352, base - 30, 300, base - 22, '#2a2e32', 2)
      for (let x = 304; x < 350; x += 8) rect(c, x, base - 24 - (x - 304) * 0.15, 1, 24 + (x - 304) * 0.15, '#2a2e32')
      rect(c, 0, base, LAYER_W, B - base, s.mid)
      rect(c, 0, base, LAYER_W, 1, '#5a6e5a')
    }),
    near: layer((c) => {
      const r = rng(3904)
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      rect(c, 0, base, LAYER_W, 1, '#4a4c52')
      // dekovil: iki ray, traversler
      for (let x = 0; x < LAYER_W; x += 6) rect(c, x, base - 2, 4, 2, '#4a3a2e')
      rect(c, 0, base - 3, LAYER_W, 1, '#8a8e96')
      // liman vinci: kafes kule, makine dairesi, öne uzanan bom, sarkan kanca
      const vx = 470
      const VC = '#3a3e44'
      for (const k of [0, 1]) seg(c, vx + k * 22, base - 3, vx + 6 + k * 10, base - 70, VC, 2)
      for (let y = base - 66; y < base - 6; y += 10) {
        const f = (base - y) / 70
        seg(c, vx + f * 6, y, vx + 22 - f * 12, y + 10, VC)
        rect(c, vx + f * 6, y, 22 - f * 18, 1, VC)
      }
      rect(c, vx + 2, base - 84, 24, 14, '#d89a2a')
      rect(c, vx + 2, base - 84, 24, 2, '#f2c050')
      rect(c, vx + 18, base - 80, 5, 4, '#3e4a58')
      seg(c, vx + 14, base - 84, vx + 14, base - 100, VC, 2)
      seg(c, vx + 4, base - 80, vx - 70, base - 104, VC, 2)
      seg(c, vx + 14, base - 100, vx - 70, base - 104, VC)
      seg(c, vx + 14, base - 100, vx + 34, base - 82, VC)
      rect(c, vx + 32, base - 84, 6, 6, VC)
      rect(c, vx - 70, base - 104, 1, 46, '#2a2c30')
      rect(c, vx - 72, base - 58, 5, 2, '#2a2c30')
      rect(c, vx - 72, base - 56, 1, 3, '#2a2c30')
      // vagonetler: kömürle dolu, ray üstünde
      for (const x of [40, 72, 104, 250, 282]) {
        rect(c, x + 2, base - 4, 3, 2, '#1a1a1e')
        rect(c, x + 17, base - 4, 3, 2, '#1a1a1e')
        rect(c, x, base - 14, 22, 10, '#5a3e2e')
        rect(c, x, base - 14, 22, 1, '#7a5a42')
        rect(c, x + 1, base - 11, 20, 1, '#3e2a1e')
        for (let i = 0; i < 6; i++) disc(c, x + 3 + i * 3.2, base - 15, 2, '#1c1c20')
        rect(c, x + 5, base - 17, 1, 1, '#8a8a94')
        rect(c, x + 22, base - 9, 4, 1, '#2a2a2e')
      }
      // maden lambalı direkler: turuncu ışık
      for (const x of [170, 360, 600]) {
        rect(c, x, base - 34, 2, 34, '#2a2c30')
        rect(c, x - 3, base - 36, 8, 2, '#2a2c30')
        rect(c, x - 2, base - 34, 6, 3, '#f2a12e')
        disc(c, x + 1, base - 31, 6, 'rgba(242,170,60,0.18)')
      }
      // kıyı kayaları ve yabani otlar
      for (let x = 130; x < LAYER_W; x += 30 + Math.floor(r() * 20)) {
        if (x > 230 && x < 320) continue
        if (x > 440 && x < 500) continue
        disc(c, x, base - 1, 4 + Math.floor(r() * 3), '#34363c', true)
        rect(c, x - 2, base - 5, 3, 1, '#565a60')
        for (let i = 0; i < 3; i++) rect(c, x + 5 + i * 2, base - 3 - (i % 2) * 2, 1, 3 + (i % 2) * 2, '#3e5a36')
      }
    }),
  }
}

/** Aydın: Efes. Uzakta Panayır Dağı'nın yamacına oyulmuş Büyük Tiyatro ve Selçuk'taki tek Artemis sütunu (tepesinde leylek yuvası),
 * ortada Celsus Kütüphanesi'nin iki katlı cephesi ve zeytinlik, önde devrik sütun kaideleri, incir ağaçları ve selvi */
function aydinLayers(s: CityStyle, B: number): Layers {
  const MARBLE = '#f0ece2'
  const MARBLE_SH = '#c4beb0'
  const MARBLE_DK = '#8c8678'
  // yivli sütun: gövde, sağda gölge, tepede başlık, altta kaide
  const column = (c: Ctx, x: number, base: number, h: number, w: number) => {
    rect(c, x - 1, base - 2, w + 2, 2, MARBLE_SH)
    rect(c, x, base - h, w, h - 2, MARBLE)
    rect(c, x + w - 1, base - h, 1, h - 2, MARBLE_SH)
    for (let fx = x + 1; fx < x + w - 1; fx += 2) rect(c, fx, base - h + 2, 1, h - 5, 'rgba(120,112,98,0.25)')
    rect(c, x - 1, base - h - 2, w + 2, 2, MARBLE)
    rect(c, x - 2, base - h - 3, w + 4, 1, MARBLE_SH)
  }
  return {
    far: layer((c) => {
      // Aydın Dağları: mavi-gri sırtlar, ardında daha açık
      hills(c, '#c4d2e0', B - 176, 36, 2, 9101)
      hills(c, s.far, B - 140, 26, 3, 9102)
      // Panayır Dağı yamacına oyulmuş Büyük Tiyatro: yarım daire basamaklar, ortada sahne yapısı
      const tx = 300
      const ty = B - 100
      for (let r = 10; r <= 40; r += 3) {
        for (let a = 0; a <= 180; a += 2) {
          const rad = (a * Math.PI) / 180
          rect(c, tx + Math.cos(rad) * r * 1.5, ty - Math.sin(rad) * r * 0.85, 2, 1, r % 6 === 1 ? MARBLE : MARBLE_SH)
        }
      }
      rect(c, tx - 20, ty, 40, 3, MARBLE_SH)
      rect(c, tx - 26, ty - 6, 8, 9, MARBLE)
      rect(c, tx + 18, ty - 6, 8, 9, MARBLE)
      for (let i = 0; i < 5; i++) rect(c, tx - 14 + i * 7, ty - 5, 2, 7, MARBLE_DK)
      // Selçuk'taki tek Artemis sütunu: yüksek, tepesinde dal yığınından leylek yuvası ve bir leylek
      const ax = 110
      const ab = B - 96
      column(c, ax, ab, 62, 7)
      rect(c, ax - 2, ab - 66, 11, 1, MARBLE)
      for (let i = 0; i < 9; i++) rect(c, ax - 3 + i * 1.3, ab - 69 - (i % 3), 3, 2, '#7a5a3a')
      rect(c, ax + 1, ab - 76, 2, 7, '#f4f0ea')
      rect(c, ax + 1, ab - 77, 4, 1, '#e8582e')
      rect(c, ax + 3, ab - 78, 1, 1, '#1c1a20')
      // kıyıda Efes ovası: düz, açık yeşil
      rect(c, 0, B - 78, LAYER_W, B - (B - 78), '#9ab07a')
    }),
    mid: layer((c) => {
      const r = rng(9103)
      const base = B - 58
      rect(c, 0, base - 3, LAYER_W, B - base + 3, s.mid)
      // zeytinlik: gümüş yeşili yuvarlak ağaçlar, gövdeleri çarpık
      for (let x = 6; x < LAYER_W; x += 17 + Math.floor(r() * 12)) {
        if (x > 392 && x < 520) continue
        const y = base + 4 + Math.floor(r() * 8)
        rect(c, x, y - 4, 2, 8, '#5e4c3a')
        disc(c, x + 1, y - 8, 7, '#7e9a6a')
        disc(c, x - 1, y - 10, 4, '#a0b88a')
        for (let i = 0; i < 3; i++) rect(c, x - 4 + ((i * 5) % 9), y - 9 + ((i * 3) % 5), 1, 1, '#4e6a3e')
      }
      // Celsus Kütüphanesi: iki katlı sütunlu cephe, ortada kapılar, üstte alınlıklar
      const lx = 400
      const lw = 112
      const lh = 50
      rect(c, lx - 6, base - 4, lw + 12, 4, MARBLE_SH)
      rect(c, lx, base - lh, lw, lh - 4, '#e4dccb')
      rect(c, lx, base - lh, lw, 1, MARBLE)
      rect(c, lx + lw - 3, base - lh, 3, lh - 4, MARBLE_SH)
      // alt kat: sütunlar, üç kapı
      for (let i = 0; i < 6; i++) column(c, lx + 6 + i * 18, base - 4, 22, 5)
      for (const dx of [26, 50, 74]) rect(c, lx + dx, base - 24, 8, 20, '#3a3226')
      rect(c, lx, base - 28, lw, 2, MARBLE)
      // üst kat: daha ince sütunlar, nişler
      for (let i = 0; i < 6; i++) column(c, lx + 9 + i * 18, base - 28, 16, 4)
      for (const dx of [26, 50, 74]) {
        rect(c, lx + dx, base - 42, 8, 11, '#4e4234')
        rect(c, lx + dx + 1, base - 43, 6, 1, '#4e4234')
      }
      // alınlıklar
      for (let i = 0; i < 3; i++) {
        const px = lx + 14 + i * 36
        for (let k = 0; k < 8; k++) rect(c, px + k, base - 47 - Math.min(k, 7 - k), 20 - k * 2, 1, MARBLE)
      }
      // yıkık sütun sırası: Mermer Cadde
      for (let i = 0; i < 4; i++) column(c, 40 + i * 28, base - 2, 26 - ((i * 7) % 11), 5)
      rect(c, 0, base + 14, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      // devrik sütun kütükleri ve kaideler
      for (const x of [30, 190, 340, 470, 590]) {
        rect(c, x, base - 8, 26, 8, MARBLE)
        rect(c, x, base - 8, 26, 1, '#fffcf4')
        rect(c, x + 22, base - 8, 4, 8, MARBLE_SH)
        for (let k = 0; k < 4; k++) rect(c, x + 3 + k * 6, base - 7, 1, 6, 'rgba(120,112,98,0.3)')
        rect(c, x + 28, base - 5, 7, 5, MARBLE)
        rect(c, x + 28, base - 5, 7, 1, '#fffcf4')
      }
      // incir ağaçları: geniş, parçalı yapraklı taç, morarmış meyveler
      for (const x of [110, 250, 410, 530]) {
        rect(c, x, base - 16, 3, 16, '#6a5438')
        rect(c, x - 3, base - 12, 3, 2, '#6a5438')
        disc(c, x + 1, base - 24, 10, '#4a7a3a')
        disc(c, x - 6, base - 20, 7, '#5a8a46')
        disc(c, x + 8, base - 20, 7, '#3e6a30')
        for (let i = 0; i < 5; i++) rect(c, x - 6 + i * 4, base - 22 + ((i * 3) % 7), 2, 2, i % 2 ? '#6a3a7a' : '#8a5a9a')
      }
      // selvi
      for (const x of [75, 300, 560]) {
        for (let y = 0; y < 38; y++) rect(c, x - Math.round(Math.sin((y / 38) * Math.PI) * 4), base - y, Math.round(Math.sin((y / 38) * Math.PI) * 8) + 1, 1, '#2e4a34')
        rect(c, x, base - 2, 2, 2, '#4a3a2a')
      }
    }),
  }
}

/** Mersin: Toroslar, denizde Kızkalesi, kıyıda Metropol kulesi ve apartmanlar, önde marina: yelkenli direkleri, palmiyeler */
function mersinLayers(s: CityStyle, B: number): Layers {
  return {
    far: layer((c) => {
      // Toroslar: mor-mavi sırtlar, tepelerinde ince kar
      hills(c, '#a8b2d2', B - 170, 40, 2, 3301)
      snowCaps(c, '#f2f4fa', B - 170, 40, 2, 3301)
      hills(c, s.far, B - 132, 26, 3, 3302)
      // Akdeniz: ufuk çizgisi, ışıltılar
      const sea = B - 96
      rect(c, 0, sea, LAYER_W, B - sea, '#3a8ab4')
      rect(c, 0, sea, LAYER_W, 1, '#d6f0f6')
      rect(c, 0, sea + 1, LAYER_W, 4, '#4c9cc4')
      for (let i = 0; i < 52; i++) rect(c, (i * 71) % LAYER_W, sea + 4 + ((i * 17) % 54), 4 + (i % 4) * 3, 1, i % 3 ? 'rgba(214,240,246,0.45)' : 'rgba(255,255,255,0.7)')
      // Kızkalesi: denizdeki adacıkta surlar ve burçlar
      const kx = 430
      const ky = sea + 14
      for (let x = -40; x <= 40; x++) rect(c, kx + x, ky - Math.round(5 * (1 - (x * x) / 1600)), 1, 6, '#8a7656')
      const WALL = '#d8c8a4'
      const SH = '#a8946e'
      rect(c, kx - 30, ky - 18, 60, 14, WALL)
      rect(c, kx + 22, ky - 18, 8, 14, SH)
      for (let x = kx - 30; x < kx + 30; x += 4) rect(c, x, ky - 21, 2, 3, WALL)
      for (const tx of [kx - 34, kx - 6, kx + 24]) {
        rect(c, tx, ky - 28, 10, 24, WALL)
        rect(c, tx + 8, ky - 28, 2, 24, SH)
        for (let x = tx; x < tx + 10; x += 4) rect(c, x, ky - 31, 2, 3, WALL)
        rect(c, tx + 4, ky - 20, 2, 4, '#4a3a2e')
      }
      rect(c, kx - 30, ky - 4, 60, 1, 'rgba(255,255,255,0.6)')
      // açıkta bir yelkenli
      rect(c, 150, sea + 9, 18, 3, '#f4f0e6')
      rect(c, 158, sea - 7, 1, 16, '#5a4a3a')
      for (let i = 0; i < 14; i++) rect(c, 159, sea - 6 + i, Math.round(i * 0.6), 1, '#fbf8f0')
    }),
    mid: layer((c) => {
      const r = rng(3303)
      const base = B - 58
      rect(c, 0, base - 4, LAYER_W, B - base + 4, s.mid)
      // kıyı şeridinin apartmanları: beyaz ve pastel, balkonlu
      const FACE = ['#f2ece0', '#e8d8b8', '#d8e4e4', '#f0d4bc', '#e4e0ec']
      for (let x = 0; x < LAYER_W; x += 16 + Math.floor(r() * 10)) {
        if (x > 236 && x < 300) continue
        const w = 14 + Math.floor(r() * 8)
        const h = 26 + Math.floor(r() * 34)
        rect(c, x, base - h, w, h, FACE[Math.floor(r() * FACE.length)])
        rect(c, x + w - 2, base - h, 2, h, 'rgba(40,40,60,0.2)')
        for (let wy = base - h + 4; wy < base - 4; wy += 6) {
          rect(c, x + 1, wy + 3, w - 3, 1, 'rgba(60,60,80,0.35)')
          for (let wx = x + 2; wx < x + w - 3; wx += 4) rect(c, wx, wy, 2, 3, r() > 0.3 ? '#4a6a8a' : '#f2d27a')
        }
      }
      // Mersin Metropol kulesi: ince, yüksek cam kule, tepesinde anten
      const mx = 268
      rect(c, mx - 8, base - 150, 16, 150, '#7aa4c4')
      rect(c, mx - 8, base - 150, 3, 150, '#b4d4ea')
      rect(c, mx + 5, base - 150, 3, 150, '#4a7494')
      for (let y = base - 146; y < base; y += 5) rect(c, mx - 8, y, 16, 1, 'rgba(30,60,90,0.35)')
      for (let i = 0; i < 6; i++) rect(c, mx - 8 + i, base - 151 - i, 16 - i * 2, 1, '#5a84a4')
      rect(c, mx, base - 172, 1, 16, '#3a4a5a')
      rect(c, mx - 1, base - 174, 3, 2, '#e8582e')
      // portakal bahçeleri: yuvarlak koyu yeşil ağaçlar, turuncu noktalar
      for (let x = 6; x < LAYER_W; x += 22 + Math.floor(r() * 14)) {
        const y = base + 8 + Math.floor(r() * 10)
        disc(c, x, y, 7, '#2e5a3a')
        disc(c, x - 2, y - 2, 4, '#3e7048')
        for (let i = 0; i < 4; i++) rect(c, x - 4 + ((i * 5) % 9), y - 3 + ((i * 3) % 6), 2, 2, '#f29a2a')
      }
      rect(c, 0, base + 20, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      // marina iskelesi: tahta kalaslar
      rect(c, 0, base - 4, LAYER_W, 4, '#8a5a32')
      for (let x = 0; x < LAYER_W; x += 8) rect(c, x, base - 4, 1, 4, '#5e3a1e')
      // yelkenliler: beyaz gövde, ince direk, sarılı yelken; mavi bant
      for (const x of [30, 96, 330, 410, 520]) {
        rect(c, x, base - 12, 34, 8, '#f6f4ee')
        rect(c, x + 2, base - 5, 30, 1, '#2a6aa0')
        for (let i = 0; i < 4; i++) rect(c, x + i, base - 12 + i * 2, 1, 8 - i * 2, s.near)
        rect(c, x + 16, base - 70, 1, 58, '#d8d6d0')
        rect(c, x + 10, base - 20, 18, 3, '#e8e2d4')
        rect(c, x + 14, base - 26, 8, 6, '#2a6aa0')
        seg(c, x + 16, base - 70, x + 33, base - 12, 'rgba(220,220,220,0.6)')
      }
      // palmiyeler
      for (const x of [200, 260, 470, 600]) palm(c, x, base - 2, '#2a3a2e')
      // deniz feneri: beyaz-kırmızı kuşaklı, kıyının ucunda
      const fx = 160
      for (let y = base - 64; y < base - 4; y++) {
        const hw = 4 + Math.round((y - (base - 64)) / 20)
        rect(c, fx - hw, y, hw * 2, 1, Math.floor((y - (base - 64)) / 10) % 2 ? '#f4f0ea' : '#d0402a')
      }
      rect(c, fx - 5, base - 72, 10, 8, '#3a3a44')
      rect(c, fx - 3, base - 70, 6, 4, '#ffe08a')
      disc(c, fx, base - 68, 8, 'rgba(255,230,140,0.2)')
      // kumsal şemsiyeleri
      for (let x = 290; x < 320; x += 24) {
        rect(c, x, base - 18, 1, 14, '#5a4a3a')
        for (let i = 0; i < 7; i++) rect(c, x - Math.round(i * 1.5), base - 24 + i, Math.round(i * 3) + 1, 1, i % 2 ? '#f4f0ea' : '#e8582e')
      }
    }),
  }
}

/** Balıkesir: Kaz Dağları’nın çamlı sırtı, gökte pelikanlar ve leylekler, Manyas’ın sazlığı; Ayvalık’ın taş evleri, zeytinlik ve Saat Kulesi */
function balikesirLayers(s: CityStyle, B: number): Layers {
  // gökte süzülen kuş: açık kanat, gövde, gaga; pelikanda turuncu gaga ve kara kanat ucu, leylekte kırmızı gaga
  const bird = (c: Ctx, x: number, y: number, k: number, pelican: boolean) => {
    const W = pelican ? '#f4f4f0' : '#f8f6f2'
    const TIP = '#24262c'
    for (let i = 0; i <= k; i++) {
      const dy = Math.round((i * i) / (k * 1.6))
      rect(c, x - i, y - dy, 1, 2, i > k - 3 ? TIP : W)
      rect(c, x + 4 + i, y - dy, 1, 2, i > k - 3 ? TIP : W)
    }
    rect(c, x - 1, y, 7, 2, W)
    if (pelican) {
      rect(c, x + 6, y, 5, 1, '#f29a3a')
      rect(c, x + 6, y + 1, 3, 1, '#e87a2a')
    } else {
      rect(c, x + 6, y, 3, 1, '#d8402a')
      rect(c, x - 5, y + 1, 4, 1, '#d8402a')
    }
  }
  return {
    far: layer((c) => {
      // Kaz Dağları: mavi-gri sırtlar, ardında daha açık; sırt boyunca çam ormanı
      hills(c, '#b8cadc', B - 178, 42, 2, 1001)
      hills(c, s.far, B - 138, 28, 3, 1002)
      const r = rng(1003)
      for (let x = 0; x < LAYER_W; x += 4 + Math.floor(r() * 4)) {
        const t = (x / LAYER_W) * Math.PI * 2
        if (Math.sin(t * 3 + 1.1) < -0.2) continue
        const y = B - 112 - Math.floor(r() * 10)
        for (let i = 0; i < 10; i++) rect(c, x - Math.floor(i / 2), y + i, 1 + i, 1, i % 3 === 2 ? '#3e6248' : '#4a7054')
      }
      // Manyas Gölü: ufukta parlak şerit, kıyısında sazlık
      const lake = B - 92
      rect(c, 0, lake, LAYER_W, B - lake, '#7aa8c4')
      rect(c, 0, lake, LAYER_W, 1, '#e4f2f8')
      for (let i = 0; i < 30; i++) rect(c, (i * 83) % LAYER_W, lake + 3 + ((i * 13) % 14), 4 + (i % 3) * 3, 1, 'rgba(230,244,250,0.55)')
      for (let x = 0; x < LAYER_W; x += 2) {
        const h = 3 + Math.floor(r() * 5)
        rect(c, x, lake + 18 - h, 1, h, x % 6 ? '#8a9a5a' : '#a8a86a')
      }
      // gökte süzülen pelikanlar ve leylekler
      bird(c, 120, B - 186, 9, true)
      bird(c, 150, B - 176, 8, true)
      bird(c, 96, B - 170, 7, true)
      bird(c, 420, B - 192, 8, false)
      bird(c, 448, B - 182, 6, false)
      bird(c, 560, B - 166, 7, true)
    }),
    mid: layer((c) => {
      const r = rng(1004)
      const base = B - 58
      rect(c, 0, base - 3, LAYER_W, B - base + 3, s.mid)
      // zeytinlik: gümüş yeşili yuvarlak tepeler, çarpık gövdeler
      for (let x = 4; x < LAYER_W; x += 15 + Math.floor(r() * 12)) {
        if (x > 200 && x < 420) continue
        const y = base + 6 + Math.floor(r() * 8)
        rect(c, x, y - 4, 2, 8, '#5e4c3a')
        disc(c, x + 1, y - 8, 7, '#7e9a6a')
        disc(c, x - 1, y - 10, 4, '#a0b88a')
        for (let i = 0; i < 3; i++) rect(c, x - 4 + ((i * 5) % 9), y - 9 + ((i * 3) % 5), 1, 1, '#2e3a2a')
      }
      // Ayvalık taş evleri: kesme taş, kiremit çatı, pencere söveleri ve renkli kepenkler
      const STONE = ['#d8c8a8', '#cbb894', '#e2d4b6']
      const SHUT = ['#3a7a8a', '#8a3a3a', '#4a6a3a', '#3a5a8a']
      for (let x = 200; x < 420; x += 24 + Math.floor(r() * 6)) {
        if (x > 286 && x < 330) continue
        const w = 20 + Math.floor(r() * 4)
        const h = 24 + Math.floor(r() * 12)
        rect(c, x, base - h, w, h, STONE[Math.floor(r() * 3)])
        rect(c, x + w - 2, base - h, 2, h, 'rgba(90,70,40,0.25)')
        for (let ky = base - h + 4; ky < base; ky += 5) rect(c, x, ky, w, 1, 'rgba(120,96,60,0.18)')
        const sc = SHUT[Math.floor(r() * SHUT.length)]
        for (const wy of [base - h + 5, base - h + 15]) {
          if (wy > base - 10) continue
          for (let wx = x + 3; wx < x + w - 5; wx += 7) {
            rect(c, wx - 1, wy - 1, 5, 7, '#f0e6d0')
            rect(c, wx, wy, 3, 5, sc)
          }
        }
        rect(c, x + Math.floor(w / 2) - 2, base - 8, 4, 8, '#5a3e2a')
        for (let i = 0; i < 6; i++) rect(c, x - 2 + i, base - h - 1 - i, w + 4 - i * 2, 1, i % 2 ? '#a8462e' : '#b85a3a')
      }
      // Saat Kulesi: Galata’yı andıran yuvarlak taş gövde, şerefe, sivri külah, saat yüzü
      const tx = 308
      rect(c, tx - 9, base - 4, 18, 4, '#9a8a70')
      rect(c, tx - 7, base - 62, 14, 58, '#d8c4a0')
      rect(c, tx - 7, base - 62, 3, 58, '#ecdcbc')
      rect(c, tx + 4, base - 62, 3, 58, '#a8946e')
      for (const dy of [-22, -40]) rect(c, tx - 7, base + dy, 14, 1, '#b09a78')
      for (const dy of [-16, -32, -50]) rect(c, tx - 1, base + dy, 2, 4, '#4a3a2e')
      rect(c, tx - 9, base - 64, 18, 2, '#8a7660')
      rect(c, tx - 9, base - 68, 18, 4, '#d8c4a0')
      for (let x = tx - 9; x < tx + 9; x += 3) rect(c, x, base - 70, 2, 2, '#d8c4a0')
      for (let i = 0; i < 16; i++) rect(c, tx - 8 + Math.round(i / 2), base - 71 - i, 16 - i, 1, i % 4 === 1 ? '#6e788c' : '#5a6478')
      rect(c, tx, base - 91, 1, 4, '#f2c14e')
      disc(c, tx, base - 56, 3, '#f4ead8')
      rect(c, tx, base - 58, 1, 2, '#2a2420')
      rect(c, tx, base - 56, 2, 1, '#2a2420')
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      // Manyas sazlığı: uzun kamışlar, kahverengi püsküllü saz başları
      const r = rng(1005)
      for (let x = 0; x < LAYER_W; x += 2) {
        if ((x > 120 && x < 200) || (x > 360 && x < 450)) continue
        const h = 10 + Math.floor(r() * 16)
        const bend = r() > 0.5 ? 1 : 0
        rect(c, x, base - h, 1, h, x % 4 ? '#6e8a4a' : '#8aa25a')
        if (bend) rect(c, x + 1, base - h - 1, 1, 2, '#6e8a4a')
        if (r() > 0.78) rect(c, x, base - h - 4, 2, 5, '#7a4e2a')
      }
      // zeytin ağaçları: geniş, gümüşî taç
      for (const x of [150, 400]) {
        rect(c, x, base - 18, 4, 18, '#5a4632')
        rect(c, x - 3, base - 14, 4, 2, '#5a4632')
        rect(c, x + 3, base - 16, 4, 2, '#5a4632')
        disc(c, x + 2, base - 26, 11, '#6e8a5e')
        disc(c, x - 6, base - 22, 7, '#86a074')
        disc(c, x + 10, base - 22, 7, '#5e7a50')
        for (let i = 0; i < 6; i++) rect(c, x - 6 + i * 3, base - 26 + ((i * 5) % 8), 2, 1, i % 2 ? '#2e3a2a' : '#a8bc94')
      }
      // sazlıkta bir leylek: uzun kırmızı bacaklar
      const sx = 446
      rect(c, sx, base - 10, 1, 10, '#d8402a')
      rect(c, sx + 2, base - 10, 1, 10, '#d8402a')
      rect(c, sx - 3, base - 17, 9, 7, '#f4f2ee')
      rect(c, sx - 4, base - 15, 5, 4, '#24262c')
      rect(c, sx + 4, base - 24, 2, 8, '#f4f2ee')
      rect(c, sx + 4, base - 25, 3, 2, '#f4f2ee')
      rect(c, sx + 7, base - 24, 4, 1, '#d8402a')
    }),
  }
}

/** Elazığ: karlı dağlar ve Hazar Gölü, kayalık tepede Harput Kalesi ve surları, eğri tuğla minare, Buzluk Mağarası’nın buzlu ağzı; önde bağlar */
function elazigLayers(s: CityStyle, B: number): Layers {
  return {
    far: layer((c) => {
      // Doğu Toroslar: karlı sıra
      hills(c, '#b4bcd4', B - 176, 44, 2, 2301)
      snowCaps(c, '#f4f6fc', B - 176, 44, 2, 2301)
      hills(c, s.far, B - 136, 26, 3, 2302)
      snowCaps(c, '#e8ecf6', B - 136, 26, 3, 2302)
      // Hazar Gölü: koyu lacivert, ışıltılı; kıyıda yeşil şerit
      const lake = B - 94
      rect(c, 0, lake, LAYER_W, B - lake, '#3a5a94')
      rect(c, 0, lake, LAYER_W, 1, '#cfe2f4')
      rect(c, 0, lake + 1, LAYER_W, 3, '#4a6aa4')
      for (let i = 0; i < 40; i++) rect(c, (i * 67) % LAYER_W, lake + 5 + ((i * 19) % 26), 3 + (i % 4) * 2, 1, i % 3 ? 'rgba(207,226,244,0.4)' : 'rgba(255,255,255,0.6)')
      rect(c, 0, lake + 30, LAYER_W, 4, '#6a7a5a')
    }),
    mid: layer((c) => {
      const r = rng(2303)
      const base = B - 58
      rect(c, 0, base - 4, LAYER_W, B - base + 4, s.mid)
      // Harput: kayalık tepe; bal rengi taş katmanları
      const hx = 150
      for (let x = -112; x <= 112; x++) {
        const ax = Math.abs(x)
        // düz tepeli kayalık: ortası yayla, yamaçlar kırık kırık iner
        const slope = ax < 54 ? 0 : (ax - 54) / 58
        const jag = ((x * 37) % 7) - 3 + (((x >> 3) * 13) % 5)
        const h = Math.max(0, Math.round(72 * (1 - slope * slope * 0.9) - slope * 6 + (ax < 54 ? 0 : jag * 0.8)))
        rect(c, hx + x, base - h, 1, h, x > 18 ? '#8e7858' : '#a08a6a')
        if (h > 4) rect(c, hx + x, base - h, 1, 2, x > 18 ? '#ae9876' : '#c8b08a')
        // kaya katmanları: yatay kırık çizgiler, gölgeli yüzler
        for (let ly = 14; ly < h - 4; ly += 13) {
          const o = ((Math.floor((x + ly * 3) / 9) * 7) % 5) - 2
          if ((x + ly) % 11 < 8) rect(c, hx + x, base - ly + o, 1, 2, '#6e5a42')
        }
      }
      // kale surları ve burçlar: tepenin üstünde
      const WALL = '#d8c09a'
      const WSH = '#9a8262'
      const top = base - 70
      rect(c, hx - 56, top - 2, 112, 4, '#8e7a5c')
      rect(c, hx - 48, top - 14, 96, 14, WALL)
      rect(c, hx - 48, top - 2, 96, 2, WSH)
      for (let x = hx - 48; x < hx + 48; x += 4) rect(c, x, top - 17, 2, 3, WALL)
      for (const tx of [hx - 54, hx - 18, hx + 14, hx + 44]) {
        rect(c, tx, top - 26, 12, 26, WALL)
        rect(c, tx + 10, top - 26, 2, 26, WSH)
        for (let x = tx; x < tx + 12; x += 4) rect(c, x, top - 29, 2, 3, WALL)
        rect(c, tx + 5, top - 18, 2, 4, '#4a3a2e')
      }
      rect(c, hx - 4, top - 10, 7, 10, '#4a3a2e')
      // Ulu Cami'nin eğri tuğla minaresi: tepenin yamacında, sağa yatık
      const mx = 260
      for (let i = 0; i < 46; i++) {
        const lean = Math.round(i * 0.14)
        rect(c, mx + lean, base - i, 7, 1, i % 5 === 0 ? '#8a4a2e' : '#b4643e')
        rect(c, mx + lean + 5, base - i, 2, 1, '#8a4a2e')
      }
      rect(c, mx + 5, base - 49, 11, 3, '#cc7c52')
      for (let i = 0; i < 7; i++) rect(c, mx + 7 + Math.round(i / 2), base - 50 - i, 7 - i, 1, '#6a6a74')
      rect(c, mx + 6, base - 18, 9, 18, '#c8a07a')
      rect(c, mx + 6, base - 18, 9, 1, '#9a7454')
      // eski Harput evleri: düz damlı, kerpiç ve taş
      for (let x = 300; x < LAYER_W - 10; x += 22 + Math.floor(r() * 10)) {
        if (x > 440 && x < 560) continue
        house(c, x, base, 16 + Math.floor(r() * 6), 14 + Math.floor(r() * 10), r() > 0.5 ? '#c8b090' : '#b49a7a', '#3a3040', r, 'flat')
      }
      // Buzluk Mağarası: kaya yüzünde karanlık ağız, kenarında buz sarkıtları ve kırağı
      const cx = 500
      for (let x = -56; x <= 56; x++) {
        const h = Math.round(48 * Math.pow(1 - (x / 56) ** 2, 0.6))
        rect(c, cx + x, base - h, 1, h, '#8a7e76')
        if (h > 4) rect(c, cx + x, base - h, 1, 2, '#e8f2fa')
      }
      for (let y = 0; y < 26; y++) {
        const hw = Math.round(14 * Math.sqrt(Math.max(0, 1 - ((y - 26) / 26) ** 2)))
        rect(c, cx - hw, base - y, hw * 2, 1, '#1e2a3a')
      }
      rect(c, cx - 15, base - 27, 30, 2, '#d8eefa')
      for (let i = 0; i < 9; i++) {
        const ix = cx - 13 + i * 3
        const len = 3 + ((i * 5) % 6)
        for (let k = 0; k < len; k++) rect(c, ix + (k > len / 2 ? 1 : 0), base - 26 + k, k > len - 2 ? 1 : 2, 1, k < 2 ? '#eaf8ff' : '#9cd4f0')
      }
      for (let i = 0; i < 6; i++) rect(c, cx - 10 + i * 4, base - 3, 3, 3, '#cfe8f6')
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      // öküzgözü bağları: kazıklara sarılı asmalar, koyu mor salkımlar
      for (let x = 0; x < LAYER_W; x += 12) {
        if ((x > 190 && x < 300) || (x > 470 && x < 540)) continue
        rect(c, x + 5, base - 14, 1, 14, '#5a4632')
        disc(c, x + 5, base - 13, 4, '#4e6a36')
        disc(c, x + 3, base - 11, 3, '#5e7a40')
        rect(c, x + 6, base - 10, 2, 3, '#4a2a5a')
        rect(c, x + 7, base - 7, 1, 1, '#4a2a5a')
      }
      rect(c, 0, base - 12, LAYER_W, 1, 'rgba(90,70,50,0.5)')
      // kavaklar
      for (const x of [210, 250, 290, 505]) {
        for (let y = 0; y < 50; y++) {
          const w = Math.round(Math.sin((y / 50) * Math.PI) * 4)
          rect(c, x - w, base - y, w * 2 + 1, 1, y % 5 === 0 ? '#5a7a3a' : '#4a6a30')
        }
        rect(c, x, base - 3, 1, 3, '#5a4632')
      }
      // kayısı ağacı: çiçekli değil meyveli, turuncu benekli
      const ax = 520
      rect(c, ax + 6, base - 16, 3, 16, '#5a4030')
      disc(c, ax + 7, base - 24, 10, '#4e7a3a')
      disc(c, ax + 1, base - 21, 6, '#5e8a44')
      for (let i = 0; i < 7; i++) rect(c, ax + i * 3, base - 28 + ((i * 7) % 11), 2, 2, '#f29a3a')
    }),
  }
}

/** Afyon: ufukta yayla ve Frig Vadisi'nin peri bacaları; ortada sarp kara volkanik kayanın tepesinde Afyon Kalesi,
 *  eteğinde kubbeli kaplıcalar ve termal oteller, yükselen buhar; yanda Aslantaş; önde mermer ocağı, çınar ve söğüt */
function afyonLayers(s: CityStyle, B: number): Layers {
  // buhar bulutu: üst üste binen soluk diskler (aşağıda yoğun, yukarı inceler)
  const steamCloud = (c: Ctx, x: number, y: number, h: number, seed: number) => {
    const r = rng(seed)
    for (let i = 0; i < h; i += 3) {
      const k = i / h
      const dx = Math.round(Math.sin(i * 0.18 + seed) * (2 + k * 5))
      const rad = Math.round(2 + k * 5 + r() * 2)
      disc(c, x + dx, y - i, rad, k < 0.5 ? 'rgba(250,250,252,0.5)' : 'rgba(250,250,252,0.32)')
    }
  }
  return {
    far: layer((c) => {
      // Emir Dağları: soluk mavi sırt, önünde yayla
      hills(c, '#c0c8dc', B - 168, 30, 2, 4501)
      hills(c, s.far, B - 128, 18, 3, 4502)
      // Frig Vadisi: tüf kayalar ve peri bacası gibi sivri kuleler (krem-pembe), tepelerinde koyu şapka
      const r = rng(4503)
      for (let x = 0; x < LAYER_W; x += 7 + Math.floor(r() * 12)) {
        const t = (x / LAYER_W) * Math.PI * 2
        if (Math.sin(t * 2 + 0.6) < 0.1) continue
        const h = 10 + Math.floor(r() * 20)
        const w = 3 + Math.floor(r() * 3)
        const lean = (r() - 0.5) * 0.12
        const base = B - 100
        for (let i = 0; i < h; i++) {
          // tabanı geniş, ucu yuvarlak sivri tüf kule; yer yer hafif eğik
          const hw = Math.max(1, Math.round(w * Math.sqrt(1 - (i / h) ** 1.6)))
          const cx = x + Math.round(i * lean * 4)
          rect(c, cx - hw, base - i, hw * 2, 1, '#d8c4ae')
          rect(c, cx + hw - 1, base - i, 1, 1, '#b8a08c')
        }
        // bazılarının tepesinde bazalt şapka
        if (r() > 0.55) rect(c, x + Math.round(h * lean * 4) - 2, base - h - 1, 4, 2, '#6a5e5a')
      }
      rect(c, 0, B - 100, LAYER_W, B, '#b6b4c0')
      rect(c, 0, B - 100, LAYER_W, 1, '#cfccd6')
    }),
    mid: layer((c) => {
      const r = rng(4504)
      const base = B - 58
      rect(c, 0, base - 4, LAYER_W, B - base + 4, s.mid)
      // Afyon Kalesi: ovadan birden yükselen sarp, kara volkanik kaya; dik yüzler ve kırık dişli sırt
      const kx = 300
      const ROCK = '#2c2a30'
      const ROCK_L = '#4a4650'
      const ROCK_D = '#1c1a20'
      for (let x = -48; x <= 48; x++) {
        const ax = Math.abs(x)
        // dik yamaç: tepede dar düzlük (surun oturduğu), etek hızla genişler; yamaçta kırık dişler
        const slope = ax < 15 ? 0 : (ax - 15) / 33
        const jag = ((x * 53) % 9) - 4 + (((x >> 2) * 17) % 5)
        const h = Math.max(0, Math.round(ax < 15 ? 92 + Math.abs(jag) * 0.3 : 92 * (1 - Math.pow(slope, 1.4) * 0.94) + jag * 0.9))
        rect(c, kx + x, base - h, 1, h, x > 6 ? ROCK_D : ROCK)
        // sol üstten ışık: sol yüzde açık kenar
        if (x < 0 && h > 3) rect(c, kx + x, base - h, 1, 2, ROCK_L)
        // kaya çatlakları: dikey sütunlar (bazalt), yer yer yatay kırık
        if (x % 7 === 0 && h > 12) rect(c, kx + x, base - h + 6, 1, h - 10, x > 6 ? '#121016' : '#3a3640')
        for (let ly = 18; ly < h - 6; ly += 17) if ((x + ly) % 9 < 5) rect(c, kx + x, base - ly + (((x + ly) * 3) % 4), 1, 1, '#4e4a56')
      }
      // tepedeki sur: dar sırta oturan burçlar ve mazgallı duvar, kayaya kaynaşmış kahverengi-gri taş
      const WALL = '#8a7e70'
      const WSH = '#5e544a'
      const peak = base - 91
      rect(c, kx - 18, peak - 9, 36, 10, WALL)
      rect(c, kx + 8, peak - 9, 10, 10, WSH)
      for (let x = kx - 18; x < kx + 18; x += 4) rect(c, x, peak - 12, 2, 3, WALL)
      for (const tx of [kx - 22, kx - 3, kx + 14]) {
        rect(c, tx, peak - 18, 8, 19, WALL)
        rect(c, tx + 6, peak - 18, 2, 19, WSH)
        for (let x = tx; x < tx + 8; x += 3) rect(c, x, peak - 20, 2, 2, WALL)
        rect(c, tx + 3, peak - 13, 2, 3, '#2a2420')
      }
      // tepede bayrak
      rect(c, kx + 1, peak - 30, 1, 12, '#3a3030')
      rect(c, kx + 2, peak - 30, 6, 4, '#d0302a')
      rect(c, kx + 4, peak - 29, 1, 1, '#ffffff')
      // Aslantaş: Frig kaya mezarı; üçgen alınlıklı kaya yüzü, kapının iki yanında şaha kalkmış aslan kabartması
      const ax = 108
      for (let x = -26; x <= 26; x++) {
        const h = Math.round(46 - Math.abs(x) * 0.5 - ((x * 29) % 5))
        rect(c, ax + x, base - h, 1, h, x > 8 ? '#a89480' : '#c4ae98')
        if (h > 3 && x < 8) rect(c, ax + x, base - h, 1, 1, '#dcc8b0')
      }
      rect(c, ax - 14, base - 30, 28, 30, '#b8a28c')
      for (let i = 0; i < 7; i++) rect(c, ax - 14 + i * 2, base - 31 - i, 28 - i * 4, 1, '#ccb69e')
      rect(c, ax - 3, base - 20, 6, 20, '#3a3028')
      rect(c, ax - 3, base - 20, 6, 1, '#7a6a58')
      for (const k of [-1, 1]) {
        const lx = ax + k * 9
        // aslan: gövde dik, ön ayaklar kapıya doğru, kabarık yele
        rect(c, lx - 2, base - 22, 4, 14, '#8e7a66')
        disc(c, lx - k, base - 23, 3, '#8e7a66')
        rect(c, lx - k * 4, base - 21, 3, 2, '#8e7a66')
        rect(c, lx - k * 4, base - 16, 3, 2, '#8e7a66')
        rect(c, lx - 2, base - 8, 4, 8, '#8e7a66')
        rect(c, lx + k * 2, base - 12, 2, 6, '#7a6656')
        rect(c, lx - k * 2, base - 25, 1, 1, '#4a3a2e')
      }
      // kaplıca ve termal oteller: kayanın eteğinde kubbeli hamamlar, birkaç katlı otel blokları
      const DOME = ['#e8e4dc', '#d8d2c6', '#f0ece4']
      for (let x = 190; x < 450; x += 22 + Math.floor(r() * 10)) {
        if (x > 262 && x < 340) continue
        if (r() > 0.45) {
          // hamam: alçak taş gövde, büyük kurşun kubbe, tepesinde yıldız penceresi
          const w = 18
          rect(c, x, base - 12, w, 12, '#d4c8b4')
          rect(c, x + w - 2, base - 12, 2, 12, '#a89c88')
          dome(c, x + w / 2, base - 12, 8, '#8a96a4')
          disc(c, x + w / 2 - 2, base - 17, 2, '#a8b4c2', true)
          for (let k = 0; k < 3; k++) rect(c, x + w / 2 - 4 + k * 4, base - 16, 1, 1, '#f6f2c8')
          rect(c, x + w / 2 - 2, base - 7, 4, 7, '#4a3a2e')
          steamCloud(c, x + w / 2, base - 26, 30 + Math.floor(r() * 16), x)
        } else {
          // termal otel: açık renk blok, sıra sıra balkon ve pencere
          const w = 16 + Math.floor(r() * 6)
          const h = 26 + Math.floor(r() * 16)
          const col = DOME[Math.floor(r() * 3)]
          rect(c, x, base - h, w, h, col)
          rect(c, x + w - 2, base - h, 2, h, 'rgba(80,80,100,0.25)')
          for (let wy = base - h + 3; wy < base - 5; wy += 5) {
            rect(c, x + 1, wy + 3, w - 2, 1, '#9ab0c0')
            for (let wx = x + 2; wx < x + w - 3; wx += 4) rect(c, wx, wy, 2, 3, '#3a7a8a')
          }
          rect(c, x - 1, base - h - 1, w + 2, 1, '#8a8a94')
          if (r() > 0.5) steamCloud(c, x + w - 4, base - h - 4, 18, x + 7)
        }
      }
      // Ulu Cami'nin minaresi: eski şehirde ince taş gövde
      minaret(c, 470, base, 52, '#d8ccb8', 4)
      for (let x = 482; x < LAYER_W - 6; x += 18 + Math.floor(r() * 8)) house(c, x, base, 14 + Math.floor(r() * 4), 12 + Math.floor(r() * 8), r() > 0.5 ? '#e4d8c4' : '#cdbca2', '#3a3040', r)
      for (let x = 8; x < 70; x += 18 + Math.floor(r() * 8)) house(c, x, base, 14 + Math.floor(r() * 4), 12 + Math.floor(r() * 8), r() > 0.5 ? '#e4d8c4' : '#cdbca2', '#3a3040', r)
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      const r = rng(4505)
      // mermer ocağı: kesilmiş beyaz ve kaymaktaşı bloklar, gri damarlı; üst üste ve yan yana
      const MARBLE = ['#f2f0ec', '#e6e2da', '#ece4d4']
      for (const [x0, n] of [[20, 3], [250, 4], [470, 3]] as const) {
        let x = x0
        for (let i = 0; i < n; i++) {
          const w = 14 + Math.floor(r() * 8)
          const h = 9 + Math.floor(r() * 6)
          const col = MARBLE[Math.floor(r() * 3)]
          rect(c, x, base - h, w, h, col)
          rect(c, x, base - h, w, 1, '#ffffff')
          rect(c, x + w - 2, base - h + 1, 2, h - 1, '#b8b4ac')
          for (let k = 0; k < 2; k++) {
            const vy = base - h + 2 + Math.floor(r() * (h - 3))
            for (let j = 0; j < w - 4; j += 2) rect(c, x + 1 + j, vy + ((j >> 1) % 2), 2, 1, '#a8a4a0')
          }
          // ikinci kat blok
          if (i === 1) {
            const w2 = w - 4
            rect(c, x + 2, base - h - 8, w2, 8, MARBLE[(i + 1) % 3])
            rect(c, x + 2, base - h - 8, w2, 1, '#ffffff')
            rect(c, x + w2, base - h - 7, 2, 7, '#b8b4ac')
          }
          x += w + 1
        }
      }
      // çınar: kalın, alacalı gövde, geniş yuvarlak taç
      for (const x of [140, 400]) {
        rect(c, x, base - 22, 5, 22, '#b4a48c')
        for (let k = 0; k < 4; k++) rect(c, x + (k % 2) * 2, base - 20 + k * 5, 2, 2, '#ddd0b8')
        rect(c, x - 4, base - 18, 5, 2, '#9a8a72')
        disc(c, x + 2, base - 32, 13, '#4e7a3a')
        disc(c, x - 8, base - 26, 8, '#5e8a44')
        disc(c, x + 12, base - 27, 8, '#46703a')
        disc(c, x - 2, base - 38, 7, '#6e9a50')
        for (let i = 0; i < 8; i++) rect(c, x - 9 + i * 3, base - 34 + ((i * 7) % 10), 2, 1, i % 2 ? '#2e4a26' : '#8aae64')
      }
      // söğüt: çay kıyısında sarkık dallar
      for (const x of [200, 340, 560]) {
        rect(c, x + 6, base - 14, 3, 14, '#5a4a36')
        disc(c, x + 7, base - 22, 9, '#6a8e4a')
        disc(c, x + 4, base - 25, 5, '#86a65a')
        for (let i = -9; i <= 9; i += 2) {
          const len = 9 + Math.floor(r() * 7) - Math.abs(i) / 2
          rect(c, x + 7 + i, base - 22 + Math.floor(Math.sqrt(Math.max(0, 81 - i * i)) * 0.6), 1, len, i % 4 ? '#7a9a52' : '#9ab866')
        }
      }
    }),
  }
}

/** Adıyaman: gün doğumunda Nemrut Dağı, tepesinde çakıl tümülüs, terasta taş heykeller ve dibine düşmüş başları; Fırat vadisi;
 * Cendere'nin tek kemerli Roma köprüsü ve sütunları, Perre'nin kaya mezarları, düz damlı evler; önde tütün dizileri ve fıstık ağaçları */
function adiyamanLayers(s: CityStyle, B: number): Layers {
  // Nemrut'un taş başı: sivri külahlı (tiara) yüz, sol yüz ılık, sağ yüz gölge; h: yüz boyu
  const head = (c: Ctx, x: number, base: number, h: number, lit: string, mid: string, dark: string) => {
    const w = Math.max(3, Math.round(h * 0.7))
    rect(c, x, base - h, w, h, mid)
    rect(c, x, base - h, Math.max(1, Math.round(w * 0.4)), h, lit)
    rect(c, x + w - 1, base - h, 1, h, dark)
    const cap = Math.round(h * 0.9)
    for (let i = 0; i < cap; i++) {
      const k = i / cap
      const iw = Math.max(1, Math.round(w * (1 - k * 0.8)))
      rect(c, x + Math.round((w - iw) * 0.35), base - h - 1 - i, iw, 1, i % 3 === 0 ? dark : k < 0.5 ? mid : lit)
    }
    if (h >= 5) {
      rect(c, x + 1, base - h + Math.round(h * 0.35), 1, 1, dark)
      rect(c, x + w - 2, base - h + Math.round(h * 0.35), 1, 1, dark)
      rect(c, x + Math.floor(w / 2), base - h + Math.round(h * 0.45), 1, Math.max(1, Math.round(h * 0.25)), dark)
    }
  }
  return {
    far: layer((c) => {
      // Toros sırtları: gün doğumunun pembesine bürünmüş, arkada daha soluk
      hills(c, '#d6aab0', B - 140, 22, 2, 5101)
      hills(c, '#c0949e', B - 122, 14, 3, 5102)
      // Nemrut Dağı: geniş omuzlu kütle, sol yamaç ışıkta, sağ yamaç gölgede
      const cx = 360
      const top = B - 146
      for (let x = -190; x <= 190; x++) {
        const ax = Math.abs(x)
        const y = Math.round(top + 18 + ax * 0.3 + Math.sin(x * 0.11) * 2 + Math.sin(x * 0.37) * 1.2)
        rect(c, cx + x, y, 1, B - y, x < -20 ? '#b08a92' : x < 30 ? '#a07e8a' : '#8c6c7c')
        if (x < -10 && (x * 7) % 11 === 0) rect(c, cx + x, y + 2, 1, 6 + (ax % 7), '#c49ca0')
      }
      // tümülüs: tepede yığma çakıl konisi, ışıklı sol yüz, ince çakıl benekleri
      for (let x = -42; x <= 42; x++) {
        const y = Math.round(top + Math.abs(x) * 0.42 + (Math.abs(x) > 34 ? (Math.abs(x) - 34) * 0.5 : 0))
        rect(c, cx + x, y, 1, top + 24 - y, x < -6 ? '#e4c8b0' : x < 10 ? '#d2b6a2' : '#b49a90')
        if ((x * 13) % 5 === 0) rect(c, cx + x, y + 3 + ((x * 7) % 9 + 9) % 9, 1, 1, x < 0 ? '#f4dcc4' : '#9a8078')
      }
      rect(c, cx - 3, top, 6, 1, '#f6e2cc')
      // doğu terası: sırt sırta oturan taş heykeller (başsız gövdeler), önlerinde yere düşmüş başlar
      const tx = cx - 92
      const ty = top + 40
      rect(c, tx - 6, ty, 74, 3, '#c8a49c')
      rect(c, tx - 6, ty, 74, 1, '#e8cec0')
      for (let i = 0; i < 5; i++) {
        const bx = tx + i * 13
        const bh = 10 + ((i * 5) % 4)
        rect(c, bx, ty - bh, 8, bh, '#d4b4a6')
        rect(c, bx, ty - bh, 3, bh, '#ecd2c0')
        rect(c, bx + 7, ty - bh, 1, bh, '#9a7c80')
        rect(c, bx - 1, ty - 3, 10, 3, '#b8968e')
      }
      for (let i = 0; i < 4; i++) head(c, tx + 3 + i * 16, ty + 9, 5, '#f0d6c4', '#d0b0a4', '#8e7078')
      // önde yumuşak vadi sırtları
      hills(c, s.far, B - 92, 8, 3, 5103)
      // Fırat: vadinin dibinden akan yeşil su; parlak üst kenar, ışıltılar
      const river = B - 80
      rect(c, 0, river, LAYER_W, B - river, '#4e8e7c')
      rect(c, 0, river, LAYER_W, 1, '#f4dcc0')
      rect(c, 0, river + 1, LAYER_W, 3, '#6aa490')
      for (let i = 0; i < 30; i++) rect(c, (i * 79) % LAYER_W, river + 4 + ((i * 11) % 9), 3 + (i % 4) * 2, 1, i % 3 ? 'rgba(250,220,190,0.5)' : 'rgba(220,244,236,0.55)')
      // kıyı bahçeleri: suyun kenarında koyu yeşil benekler
      const r = rng(5104)
      rect(c, 0, river + 15, LAYER_W, B - river, '#7a8a52')
      for (let x = 0; x < LAYER_W; x += 3) rect(c, x, river + 13 - Math.floor(r() * 3), 3, 3, r() > 0.5 ? '#5a7a4a' : '#6e8a52')
    }),
    mid: layer((c) => {
      const r = rng(5105)
      const base = B - 58
      rect(c, 0, base - 3, LAYER_W, B - base + 3, s.mid)
      // Cendere Çayı: köprünün altından akan yeşil su
      const bx = 180
      rect(c, bx - 70, base - 6, 140, 9, '#3e8676')
      rect(c, bx - 70, base - 6, 140, 1, '#d8f0e4')
      for (let i = 0; i < 10; i++) rect(c, bx - 62 + i * 13, base - 3 + (i % 3), 4, 1, 'rgba(230,248,240,0.6)')
      // kıyı kayaları: köprünün iki ayağı
      for (const k of [-1, 1]) {
        for (let i = 0; i < 18; i++) rect(c, bx + k * (40 + i) - (k < 0 ? 1 : 0), base - 18 + Math.round(i * 0.6), 1, 22 - Math.round(i * 0.6), k < 0 ? '#a89070' : '#8a7458')
      }
      // tek kemer: kireçtaşı bloklar, iç kenarı gölgede, kemer taşları belli; üstte hafif kamburlu köprü yolu
      const R = 40
      const Ri = 33
      for (let x = -48; x <= 48; x++) {
        const deck = Math.round(base - R - 6 + Math.abs(x) * 0.08)
        const outer = Math.abs(x) <= R ? Math.round(base - Math.sqrt(R * R - x * x)) : base
        const inner = Math.abs(x) < Ri ? Math.round(base - Math.sqrt(Ri * Ri - x * x)) : base
        const col = x < -16 ? '#e4d2ae' : x < 18 ? '#d4c09a' : '#b8a27e'
        rect(c, bx + x, deck, 1, inner - deck, col)
        if (Math.abs(x) < R + 1) rect(c, bx + x, outer, 1, Math.max(1, inner - outer), x < 0 ? '#c8b28c' : '#a89272')
        if (Math.abs(x) < Ri) rect(c, bx + x, inner, 1, 1, '#6e5a44')
        if (x % 6 === 0 && Math.abs(x) < R) rect(c, bx + x, outer, 1, inner - outer, '#9a8466')
      }
      for (let x = -48; x <= 48; x += 7) rect(c, bx + x, base - R - 5, 1, 6, 'rgba(120,96,70,0.35)')
      rect(c, bx - 48, base - R - 8, 97, 2, '#ece0c4')
      rect(c, bx - 48, base - R - 6, 97, 1, '#9a8466')
      // sütunlar: iki uçta ikişer olmalıydı, biri eksik; yivli gövde, kaide, başlık
      for (const px of [bx - 46, bx - 38, bx + 42]) {
        const ph = 26
        const y0 = base - R - 8 - ph
        rect(c, px - 1, base - R - 10, 6, 2, '#d8c8a8')
        rect(c, px, y0, 4, ph, '#ecdcbc')
        rect(c, px, y0, 1, ph, '#fff4dc')
        rect(c, px + 3, y0, 1, ph, '#b8a282')
        rect(c, px + 2, y0 + 2, 1, ph - 4, 'rgba(140,116,90,0.3)')
        rect(c, px - 1, y0 - 2, 6, 2, '#d8c8a8')
      }
      // Perre: katmanlı kireçtaşı yar, kayaya oyulmuş kapı biçimli mezarlar
      const px0 = 290
      const px1 = 440
      for (let x = px0; x < px1; x++) {
        const t = (x - px0) / (px1 - px0)
        const h = Math.round(40 + Math.sin(t * Math.PI) * 18 + Math.sin(x * 0.4) * 2)
        rect(c, x, base - h, 1, h, t < 0.35 ? '#d8bc94' : t < 0.7 ? '#c8aa82' : '#ac906c')
        for (let ly = base - h + 6; ly < base; ly += 7) rect(c, x, ly, 1, 1, 'rgba(110,80,50,0.28)')
        rect(c, x, base - h, 1, 1, '#f0dcb8')
      }
      for (const [tx, ty] of [[304, -30], [326, -42], [350, -28], [372, -46], [396, -32], [418, -24]] as const) {
        rect(c, tx - 1, base + ty - 1, 9, 11, '#e8d4ae')
        rect(c, tx, base + ty, 7, 10, '#4a3428')
        rect(c, tx + 1, base + ty + 1, 5, 9, '#36261e')
        for (let i = 0; i < 3; i++) rect(c, tx - 1 + i, base + ty - 2 - i, 9 - i * 2, 1, '#e8d4ae')
      }
      // düz damlı kerpiç-taş evler, ince minareli Ulu Cami
      const WALL = ['#d8c09a', '#c8ac86', '#e2cca6']
      for (let x = 456; x < LAYER_W - 6; x += 22 + Math.floor(r() * 8)) {
        if (x > 548 && x < 572) continue
        const w = 16 + Math.floor(r() * 6)
        const h = 12 + Math.floor(r() * 10)
        rect(c, x, base - h, w, h, WALL[Math.floor(r() * 3)])
        rect(c, x, base - h, 2, h, '#f0dcb8')
        rect(c, x + w - 2, base - h, 2, h, 'rgba(90,60,40,0.3)')
        rect(c, x - 1, base - h - 2, w + 2, 2, '#9a7a58')
        rect(c, x + 3, base - h + 4, 3, 4, '#4a3a30')
        if (w > 18) rect(c, x + w - 7, base - h + 4, 3, 4, '#4a3a30')
        rect(c, x + Math.floor(w / 2) - 1, base - 7, 3, 7, '#5a3e2a')
        // damda kuruyan isot: kızıl benekler
        if (r() > 0.5) for (let k = 0; k < 4; k++) rect(c, x + 2 + k * 3, base - h - 3, 2, 1, k % 2 ? '#c83a24' : '#e0502e')
      }
      const mx = 560
      rect(c, mx - 9, base - 18, 22, 18, '#dcc6a0')
      disc(c, mx + 2, base - 18, 9, '#8e98a2', true)
      rect(c, mx - 4, base - 25, 3, 2, '#b4bec8')
      rect(c, mx + 14, base - 52, 5, 52, '#e8d6b4')
      rect(c, mx + 14, base - 52, 2, 52, '#f6e8cc')
      rect(c, mx + 13, base - 38, 7, 2, '#c4ae8a')
      for (let i = 0; i < 9; i++) rect(c, mx + 14 + Math.round(i * 0.3), base - 53 - i, 5 - Math.round(i * 0.55), 1, '#7a8692')
      rect(c, mx + 16, base - 65, 1, 3, '#f2c14e')
      // köprü ile yar arasında servi ve kavaklar
      for (const x of [252, 268, 446]) {
        for (let y = 0; y < 30; y++) {
          const w = Math.round(Math.sin((y / 30) * Math.PI) * 3)
          rect(c, x - w, base - y, w * 2 + 1, 1, y % 4 === 0 ? '#7a8a4a' : '#5a6e3a')
        }
      }
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      const r = rng(5106)
      // kuru ot ve kekik tutamları
      for (let x = 0; x < LAYER_W; x += 2) {
        const h = 2 + Math.floor(r() * 5)
        rect(c, x, base - h, 1, h, x % 6 ? '#6e7a40' : '#a09450')
      }
      // tütün dizileri: iki direk, üstte sırık, iplere dizilmiş sararan yapraklar (taze yeşil, sarı, kahve)
      const LEAF = ['#b89a4a', '#9a7a38', '#7e8a3e', '#c4a656', '#8a6a30']
      for (const fx of [36, 268, 500]) {
        rect(c, fx, base - 34, 2, 34, '#5a3e26')
        rect(c, fx + 58, base - 34, 2, 34, '#5a3e26')
        rect(c, fx, base - 35, 60, 2, '#6e4c2e')
        rect(c, fx, base - 35, 60, 1, '#8e6a44')
        for (let k = 0; k < 7; k++) {
          const sx = fx + 6 + k * 8
          const len = 12 + ((k * 7) % 8)
          rect(c, sx, base - 33, 1, len, '#d8ccb0')
          for (let j = 1; j < len - 1; j += 3) {
            const col = LEAF[(k * 3 + j) % LEAF.length]
            rect(c, sx - 1, base - 32 + j, 3, 2, col)
            rect(c, sx - 1, base - 32 + j, 1, 1, 'rgba(255,240,200,0.3)')
          }
        }
      }
      // tütün tarlası: geniş yapraklı fideler, tepede pembe çiçek
      for (let x = 110; x < 250; x += 9) {
        const h = 10 + Math.floor(r() * 6)
        rect(c, x, base - h, 1, h, '#5e7a34')
        for (let j = 2; j < h; j += 4) {
          rect(c, x - 4, base - j - 1, 4, 2, '#6e9a3e')
          rect(c, x + 1, base - j - 3, 4, 2, '#5a8434')
        }
        rect(c, x - 1, base - h - 2, 3, 2, '#e88aa0')
      }
      // fıstık ve ceviz ağaçları: yuvarlak, iki tonlu taç
      for (const x of [16, 344, 430, 600]) {
        rect(c, x, base - 14, 3, 14, '#5a4030')
        disc(c, x + 1, base - 22, 10, '#5e7a3e')
        disc(c, x - 2, base - 25, 6, '#7e9a4e')
        disc(c, x + 5, base - 19, 5, '#4e6a34')
        for (let i = 0; i < 5; i++) rect(c, x - 5 + i * 3, base - 24 + ((i * 5) % 7), 1, 1, i % 2 ? '#c84a5a' : '#e8d8a8')
      }
    }),
  }
}

/** Kastamonu: Ilgaz'ın karlı doruklarının önünde karaçam ormanı, kayalık tepede burçlu Kastamonu Kalesi, Nasrullah'ın
 * çıkmalı konakları ve kurşun kubbeli camisi; önde Horma Kanyonu'nun yarları, kayaya çakılmış ahşap yol ve şelale */
function kastamonuLayers(s: CityStyle, B: number): Layers {
  // karaçam: kat kat üçgen dal kümeleri, sol yanı ışıkta; h: boy
  const pine = (c: Ctx, x: number, base: number, h: number, lit: string, dark: string, deep: string) => {
    rect(c, x, base - Math.round(h * 0.25), 2, Math.round(h * 0.25), '#4a3626')
    const tiers = Math.max(3, Math.round(h / 7))
    for (let t = 0; t < tiers; t++) {
      const y0 = base - Math.round(h * 0.18) - Math.round((t * h * 0.82) / tiers)
      const tw = Math.round((h * 0.34) * (1 - t / (tiers + 1)))
      const th = Math.round(h * 0.82 / tiers) + 3
      for (let i = 0; i < th; i++) {
        const w = Math.round((tw * (i + 1)) / th)
        const yy = y0 - th + i
        rect(c, x + 1 - w, yy, w, 1, lit)
        rect(c, x + 1, yy, w + 1, 1, i === th - 1 ? deep : dark)
      }
    }
    rect(c, x, base - h - 1, 2, 2, lit)
  }
  return {
    far: layer((c) => {
      // Ilgaz Dağları: arkada mavi-mor, önde gri-mavi; ikisinde de geniş kar örtüsü
      hills(c, '#b4c0d6', B - 146, 34, 2, 3701)
      snowCaps(c, '#f8f8fc', B - 146, 34, 2, 3701)
      snowCaps(c, '#dfe6f2', B - 146 + 3, 34, 2, 3701)
      hills(c, '#94a8c0', B - 122, 22, 3, 3702)
      snowCaps(c, '#eef2f8', B - 122, 22, 3, 3702)
      // ormanlı ön sırt: sık karaçam tepeleri
      hills(c, s.far, B - 100, 10, 4, 3703)
      const r = rng(3704)
      for (let x = 0; x < LAYER_W; x += 3 + Math.floor(r() * 3)) {
        const tt = (x / LAYER_W) * Math.PI * 2
        const y = Math.round(B - 100 - 10 * (0.6 * Math.sin(tt * 4) + 0.2)) + Math.floor(r() * 6)
        for (let i = 0; i < 9; i++) rect(c, x - Math.floor(i / 2), y + i, 1 + i, 1, i % 3 === 2 ? '#5e7a7a' : '#6e8a88')
      }
      rect(c, 0, B - 86, LAYER_W, B, '#6e8a88')
      for (let x = 0; x < LAYER_W; x += 2 + Math.floor(r() * 3)) {
        const y = B - 90 + Math.floor(r() * 8)
        for (let i = 0; i < 7; i++) rect(c, x - Math.floor(i / 2), y + i, 1 + i, 1, i % 2 ? '#587470' : '#64807c')
      }
    }),
    mid: layer((c) => {
      const r = rng(3705)
      const base = B - 58
      rect(c, 0, base - 3, LAYER_W, B - base + 3, s.mid)
      // karaçam ormanı: solda sık, sağda seyrek
      for (let x = 4; x < 220; x += 9 + Math.floor(r() * 7)) pine(c, x, base + 2, 26 + Math.floor(r() * 16), '#5e8a62', '#3e664a', '#2e5038')
      // kale tepesi: kayalık, katman katman; sol yamaç ışıkta
      const kx = 320
      for (let x = -100; x <= 100; x++) {
        const ax = Math.abs(x)
        const h = Math.round(Math.max(0, 48 - ax * 0.1 - (ax > 50 ? (ax - 50) * 1.15 : 0) + Math.sin(x * 0.5) * 2 + ((x * 17) % 5)))
        if (h <= 0) continue
        rect(c, kx + x, base - h, 1, h, x < -30 ? '#8e8c82' : x < 20 ? '#7e7c74' : '#66645e')
        for (let ly = base - h + 9; ly < base; ly += 10) if ((x + ly) % 9 < 6) rect(c, kx + x, ly, 1, 1, '#5e584e')
        if (x % 5 === 0 && h > 6) rect(c, kx + x, base - h, 1, 2, '#5e8a4a')
      }
      // yamaçta tutunmuş çalılar ve genç çamlar
      for (const [dx, dy] of [[-84, 8], [-62, 18], [-40, 30], [-18, 22], [30, 26], [56, 14], [78, 6], [-70, 4], [44, 34]] as const) {
        disc(c, kx + dx, base - dy, 3, '#3e6440')
        disc(c, kx + dx - 1, base - dy - 1, 2, '#4e744a')
      }
      // surlar ve burçlar: kesme taş, mazgal dişleri, en yüksek burçta bayrak
      const wy = base - 48
      rect(c, kx - 46, wy - 10, 92, 10, '#c4b8a0')
      rect(c, kx - 46, wy - 10, 92, 2, '#ddd2ba')
      for (let x = kx - 46; x < kx + 46; x += 4) rect(c, x, wy - 13, 2, 3, '#c4b8a0')
      for (let y = wy - 8; y < wy; y += 3) rect(c, kx - 46, y, 92, 1, 'rgba(90,80,64,0.22)')
      for (const [tx, th, tw] of [[kx - 50, 22, 12], [kx - 6, 32, 14], [kx + 38, 20, 12]] as const) {
        rect(c, tx, wy - th, tw, th, '#cbbfa6')
        rect(c, tx, wy - th, 3, th, '#e2d8c0')
        rect(c, tx + tw - 2, wy - th, 2, th, '#968a74')
        for (let x = tx; x < tx + tw; x += 4) rect(c, x, wy - th - 3, 2, 3, '#cbbfa6')
        rect(c, tx + Math.floor(tw / 2) - 1, wy - th + 7, 2, 4, '#3e362e')
      }
      rect(c, kx + 1, wy - 46, 1, 11, '#4a3e34')
      rect(c, kx + 2, wy - 46, 6, 4, '#d8302a')
      rect(c, kx + 4, wy - 45, 1, 2, '#f4f0e6')
      // Nasrullah konakları: beyaz sıva, koyu ahşap kirişler, çıkma üst kat, kiremit çatı
      for (let x = 430; x < 580; x += 26 + Math.floor(r() * 6)) {
        const w = 20 + Math.floor(r() * 4)
        rect(c, x + 2, base - 14, w - 4, 14, '#ece2cc')
        rect(c, x, base - 28, w, 14, '#f2e8d4')
        rect(c, x, base - 28, 3, 14, '#fffaf0')
        for (let k = 0; k <= w - 1; k += 5) rect(c, x + k, base - 28, 1, 14, '#5e4430')
        rect(c, x, base - 15, w, 1, '#5e4430')
        rect(c, x + 3, base - 25, 3, 5, '#3a4250')
        rect(c, x + w - 7, base - 25, 3, 5, '#3a4250')
        rect(c, x + Math.floor(w / 2) - 2, base - 8, 4, 8, '#5e4430')
        for (let i = 0; i < 6; i++) rect(c, x - 2 + i, base - 29 - i, w + 4 - i * 2, 1, i % 2 ? '#a8462e' : '#bc5a3a')
      }
      // Nasrullah Camii: kurşun kubbe, ince minare
      const mx = 596
      rect(c, mx - 12, base - 18, 24, 18, '#e2d8c2')
      disc(c, mx, base - 18, 10, '#8a96a6', true)
      rect(c, mx - 5, base - 26, 3, 2, '#b0bccc')
      rect(c, mx + 14, base - 54, 5, 54, '#ece4d0')
      rect(c, mx + 14, base - 54, 2, 54, '#fbf6ea')
      rect(c, mx + 13, base - 40, 7, 2, '#c8bea8')
      for (let i = 0; i < 9; i++) rect(c, mx + 14 + Math.round(i * 0.3), base - 55 - i, 5 - Math.round(i * 0.55), 1, '#7a8696')
      rect(c, mx + 16, base - 67, 1, 3, '#f2c14e')
      for (let x = 616; x < LAYER_W; x += 10) pine(c, x, base + 2, 30, '#5e8a62', '#3e664a', '#2e5038')
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      const r = rng(3706)
      // Horma Kanyonu: iki yanda dik yar, dikey çatlaklar, yosun; sağ yarda kayaya çakılmış ahşap yol
      const cliff = (x0: number, x1: number, peak: number) => {
        for (let x = x0; x < x1; x++) {
          const t = (x - x0) / (x1 - x0)
          const h = Math.round(peak * (0.75 + 0.25 * Math.sin(t * Math.PI)) + Math.sin(x * 0.7) * 2)
          rect(c, x, base - h, 1, h, t < 0.3 ? '#7e7464' : t < 0.75 ? '#6a6256' : '#544e46')
          if ((x * 7) % 9 === 0) rect(c, x, base - h + 4, 1, h - 6, '#4a443c')
          rect(c, x, base - h, 1, 2, '#5e8a4a')
          if ((x * 5) % 7 === 0) rect(c, x, base - h + 6 + (x % 13), 1, 3, '#4e7a40')
        }
      }
      cliff(0, 70, 64)
      cliff(560, LAYER_W, 58)
      // şelale: yarın kenarından dökülen beyaz su, dipte köpük ve yeşil göl
      const wx = 50
      for (let y = base - 60; y < base; y++) {
        rect(c, wx - 4, y, 9, 1, '#e4f2f4')
        rect(c, wx - 2 + ((y * 5) % 5) - 2, y, 1, 2, '#ffffff')
        rect(c, wx + 3, y, 2, 1, '#b4d8dc')
      }
      rect(c, wx - 18, base - 3, 50, 5, '#2e8a8e')
      rect(c, wx - 18, base - 3, 50, 1, '#d2eef0')
      for (let i = 0; i < 7; i++) disc(c, wx - 8 + i * 3, base - 3 - (i % 2), 2, '#f4fbfc')
      // ahşap yol: kayaya tutturulmuş tahtalar, ince dikmeler ve korkuluk
      const by = base - 30
      rect(c, 560, by, 80, 3, '#9a6e44')
      rect(c, 560, by, 80, 1, '#c49a6a')
      for (let x = 562; x < LAYER_W; x += 6) rect(c, x, by, 1, 3, '#6a4a2e')
      for (let x = 564; x < LAYER_W; x += 12) {
        rect(c, x, by - 8, 1, 8, '#7a5634')
        rect(c, x + 1, by + 3, 1, 6, '#5a3e26')
      }
      rect(c, 560, by - 8, 80, 1, '#8a6440')
      // karaçamlar ve eğrelti otları
      for (let x = 70; x < 560; x += 2) {
        const h = 2 + Math.floor(r() * 4)
        rect(c, x, base - h, 1, h, x % 6 ? '#3e6a44' : '#4e7a4e')
      }
      for (const x of [110, 150, 300, 340, 480, 520]) pine(c, x, base + 1, 46 + Math.floor(r() * 14), '#4e7a52', '#2e543c', '#1e3e2c')
      for (const x of [200, 410]) {
        for (let k = -3; k <= 3; k++) {
          for (let i = 0; i < 6; i++) rect(c, x + k * 2 + Math.round(k * i * 0.25), base - i - 1, 1, 1, k % 2 ? '#5e8a4e' : '#6e9a58')
        }
      }
    }),
  }
}

/** Bingöl: uzakta Şerafettin Dağları’nın yeşil-mor karlı sırtları ve aralarında parıldayan küçük göller (bin göl);
 *  ortada Solhan’ın sazlıklı gölü ve üstünde yüzen yeşil adalar, Çır Şelalesi, arı kovanlı yayla evleri; önde kavak, söğüt ve dağ çiçekleri */
function bingolLayers(s: CityStyle, B: number): Layers {
  // küçük dağ gölü: yassı elips, parlak üst kenar ve ışıltı
  const tarn = (c: Ctx, x: number, y: number, w: number) => {
    const h = Math.max(2, Math.round(w / 5))
    for (let i = 0; i < h; i++) {
      const hw = Math.round((w / 2) * Math.sqrt(1 - ((i - h / 2 + 0.5) / (h / 2)) ** 2))
      rect(c, x - hw, y + i, hw * 2, 1, i === 0 ? '#d8ecf8' : i < h / 2 ? '#6a9ccc' : '#4a7cb0')
    }
    rect(c, x - Math.round(w / 6), y + 1, 2, 1, '#ffffff')
  }
  // arı kovanı: renkli tahta kutu, çatı kapağı, uçuş deliği
  const hive = (c: Ctx, x: number, base: number, col: string) => {
    rect(c, x, base - 6, 6, 6, col)
    rect(c, x + 5, base - 6, 1, 6, 'rgba(40,30,20,0.35)')
    rect(c, x - 1, base - 7, 8, 1, '#f0e8d8')
    rect(c, x + 2, base - 2, 2, 1, '#2a2018')
    rect(c, x, base - 4, 6, 1, 'rgba(255,255,255,0.25)')
  }
  return {
    far: layer((c) => {
      // Şerafettin Dağları: arkada mor, önde yeşil sırt; yer yer kar
      hills(c, '#9c94c0', B - 180, 44, 2, 4601)
      snowCaps(c, '#f4f2fa', B - 180, 44, 2, 4601)
      hills(c, '#7a9aa4', B - 140, 30, 3, 4602)
      snowCaps(c, '#e8eef4', B - 140, 30, 3, 4602)
      hills(c, '#6a8e7a', B - 112, 16, 4, 4603)
      rect(c, 0, B - 100, LAYER_W, B, '#6a8e7a')
      // bin göl: yeşil yaylada parıldayan küçük göller
      const r = rng(4604)
      for (let i = 0; i < 16; i++) {
        const x = 20 + ((i * 167 + Math.floor(r() * 30)) % (LAYER_W - 40))
        const y = B - 98 + Math.floor(r() * 10)
        tarn(c, x, y, 8 + Math.floor(r() * 12))
      }
    }),
    mid: layer((c) => {
      const r = rng(4605)
      const base = B - 58
      rect(c, 0, base - 4, LAYER_W, B - base + 4, s.mid)
      // Solhan’ın gölü: koyu mavi su, kıyıda sazlık, üstünde yüzen yeşil adalar
      const lx0 = 20
      const lx1 = 230
      const ly = base - 10
      rect(c, lx0, ly, lx1 - lx0, 14, '#3a72a4')
      rect(c, lx0, ly, lx1 - lx0, 1, '#cfe6f4')
      for (let i = 0; i < 18; i++) rect(c, lx0 + 6 + ((i * 47) % (lx1 - lx0 - 12)), ly + 3 + ((i * 7) % 9), 3 + (i % 3) * 2, 1, 'rgba(220,240,250,0.5)')
      for (const [ix, iw] of [[50, 26], [104, 34], [170, 22]] as const) {
        // yüzen ada: yassı çim kümesi, altında suya yansıyan koyu kenar, üstünde saz demeti
        rect(c, ix - 1, ly + 4, iw + 2, 2, '#2a4a3a')
        for (let k = 0; k < 4; k++) rect(c, ix + k, ly + 3 - k, iw - k * 2, 1, k % 2 ? '#6a9a4a' : '#5a8a3e')
        rect(c, ix + 2, ly, iw - 4, 1, '#8ab85a')
        for (let x = ix + 3; x < ix + iw - 3; x += 2) {
          const h = 3 + Math.floor(r() * 5)
          rect(c, x, ly - h, 1, h, x % 4 ? '#7a9a4a' : '#9ab060')
          if (r() > 0.75) rect(c, x, ly - h - 2, 1, 2, '#7a4e2a')
        }
      }
      for (let x = lx0; x < lx1; x += 2) {
        if (x > lx0 + 14 && x < lx1 - 14) continue
        const h = 6 + Math.floor(r() * 8)
        rect(c, x, ly + 4 - h, 1, h, x % 4 ? '#6e8a4a' : '#8aa25a')
      }
      // Çır Şelalesi: kayalık yarın kenarından dökülen beyaz su, dipte köpük ve küçük göl
      const wx = 300
      for (let x = -34; x <= 34; x++) {
        const ax = Math.abs(x)
        const h = Math.max(0, Math.round(70 - ax * 0.5 - (ax > 22 ? (ax - 22) * 2.4 : 0) + (((x * 31) % 7) - 3)))
        rect(c, wx + x, base - h, 1, h, x > 10 ? '#6a5e56' : '#8a7c70')
        if (h > 3 && x < 10) rect(c, wx + x, base - h, 1, 2, '#5e8a4a')
        for (let ly2 = 12; ly2 < h - 4; ly2 += 11) if ((x + ly2) % 8 < 5) rect(c, wx + x, base - ly2, 1, 1, '#4e443e')
      }
      for (let y = base - 60; y < base - 4; y++) {
        const sway = Math.round(Math.sin(y * 0.3) * 0.6)
        rect(c, wx - 6 + sway, y, 12, 1, '#e8f4fa')
        rect(c, wx - 3 + ((y * 5) % 7) - 3, y, 1, 2, '#ffffff')
        rect(c, wx + 4 + sway, y, 2, 1, '#b8d8ea')
      }
      rect(c, wx - 8, base - 61, 16, 2, '#cfe6f2')
      rect(c, wx - 22, base - 4, 44, 6, '#4a82b0')
      for (let i = 0; i < 8; i++) disc(c, wx - 10 + i * 3, base - 4 - (i % 3), 2 + (i % 2), '#f4faff')
      // yayla evleri: alçak taş duvar, düz toprak dam; önlerinde renkli arı kovanları
      const HIVE = ['#4a8ac8', '#e8c24a', '#d85a3a', '#5aa86a', '#f0f0e8']
      for (let x = 360; x < LAYER_W - 20; x += 46 + Math.floor(r() * 14)) {
        const w = 22 + Math.floor(r() * 6)
        const h = 14 + Math.floor(r() * 6)
        rect(c, x, base - h, w, h, r() > 0.5 ? '#bca88a' : '#a8947a')
        rect(c, x + w - 2, base - h, 2, h, 'rgba(60,40,30,0.3)')
        rect(c, x - 2, base - h - 3, w + 4, 3, '#6a5a3e')
        rect(c, x - 2, base - h - 4, w + 4, 1, '#7a9a4a')
        rect(c, x + 4, base - 9, 4, 9, '#4a3424')
        rect(c, x + w - 9, base - h + 4, 4, 4, '#2e3a4a')
        if (r() > 0.4) {
          rect(c, x + 3, base - h - 10, 3, 6, '#6a5a4a')
          disc(c, x + 5, base - h - 13, 2, 'rgba(240,240,244,0.4)')
        }
        for (let k = 0; k < 3; k++) hive(c, x + w + 4 + k * 8, base + 2, HIVE[Math.floor(r() * HIVE.length)])
        // kovan başında arılar
        for (let k = 0; k < 4; k++) rect(c, x + w + 6 + ((k * 7) % 20), base - 10 - ((k * 5) % 6), 1, 1, k % 2 ? '#2a2018' : '#f2c040')
      }
      rect(c, 0, base + 18, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      const r = rng(4606)
      // dağ çiçekleri: mor, sarı, beyaz ve kırmızı benekler, çimen tutamları
      const FLOW = ['#a86ad8', '#f2c84a', '#f4f2ee', '#e0524a', '#7a8ae8']
      for (let x = 0; x < LAYER_W; x += 3) {
        const h = 2 + Math.floor(r() * 4)
        rect(c, x, base - h, 1, h, x % 6 ? '#4e7a44' : '#5e8a4e')
        if (r() > 0.55) rect(c, x + Math.floor(r() * 2), base - h - 1 - Math.floor(r() * 3), 2, 2, FLOW[Math.floor(r() * FLOW.length)])
      }
      // kavaklar: ince uzun, rüzgârda hafif eğik
      for (const x of [60, 84, 300, 324, 520]) {
        for (let y = 0; y < 54; y++) {
          const w = Math.round(Math.sin((y / 54) * Math.PI) * 4)
          const lean = Math.round((y * y) / 1400)
          rect(c, x - w + lean, base - y, w * 2 + 1, 1, y % 6 === 0 ? '#6a8e44' : y % 3 ? '#4e7034' : '#5a7e3c')
        }
        rect(c, x, base - 4, 1, 4, '#5a4632')
      }
      // söğütler: su kıyısında sarkık dallar
      for (const x of [170, 420, 590]) {
        rect(c, x + 6, base - 14, 3, 14, '#5a4a36')
        disc(c, x + 7, base - 22, 9, '#6a8e4a')
        disc(c, x + 4, base - 25, 5, '#86a65a')
        for (let i = -9; i <= 9; i += 2) {
          const len = 9 + Math.floor(r() * 7) - Math.abs(i) / 2
          rect(c, x + 7 + i, base - 22 + Math.floor(Math.sqrt(Math.max(0, 81 - i * i)) * 0.6), 1, len, i % 4 ? '#7a9a52' : '#9ab866')
        }
      }
    }),
  }
}

/** Karabük: Küre Dağları’nın ormanı, kiremit çatılı ahşap Safranbolu konakları, öndeki haddehanenin bacaları ve dumanı */
function karabukLayers(s: CityStyle, B: number): Layers {
  return {
    far: layer((c) => {
      // Küre Dağları: mavi-mor sırtlar, ardında daha sisli sıra
      hills(c, '#8c96b4', B - 150, 36, 2, 4401)
      hills(c, s.far, B - 118, 28, 3, 4402)
      // çam ormanı: sırt boyunca koyu üçgenler
      const r = rng(4403)
      for (let x = 0; x < LAYER_W; x += 5 + Math.floor(r() * 4)) {
        const y = B - 88 - Math.floor(r() * 8)
        for (let i = 0; i < 9; i++) rect(c, x - Math.floor(i / 2), y + i, 1 + i, 1, '#3a5646')
      }
    }),
    mid: layer((c) => {
      const r = rng(4404)
      const base = B - 56
      rect(c, 0, base, LAYER_W, B - base, s.mid)
      // Safranbolu: çıkmalı ahşap konaklar; beyaz sıva, koyu kirişli çerçeve, kiremit kırmızısı çatı, üst katta çıkma
      for (let x = 4; x < LAYER_W - 30; x += 34 + Math.floor(r() * 12)) {
        const w = 26 + Math.floor(r() * 8)
        const h = 22 + Math.floor(r() * 10)
        rect(c, x, base - h, w, h, '#ece0c8')
        rect(c, x - 3, base - h * 0.55 - 6, w + 6, h * 0.55 + 6, '#d8c4a0')
        for (let k = 0; k <= w; k += 6) rect(c, x + k, base - h, 1, h, '#5a3e28')
        rect(c, x, base - h * 0.55, w, 1, '#5a3e28')
        for (let wx = x + 2; wx < x + w - 3; wx += 6) {
          rect(c, wx, base - h + 5, 3, 4, '#3a3a4a')
          rect(c, wx, base - h * 0.55 + 4, 3, 4, '#3a3a4a')
        }
        // çatı: iki yana inen kiremit
        for (let i = 0; i < 9; i++) rect(c, x - 4 + i, base - h - 1 - i, w + 8 - i * 2, 1, i % 2 ? '#a8402a' : '#b94c32')
      }
      // safran tarlası: mor çizgili tarla şeridi
      for (let x = 0; x < LAYER_W; x += 7) rect(c, x, base + 14, 3, 5, '#7a4a9a')
      rect(c, 0, base + 20, LAYER_W, B - base, s.mid)
    }),
    near: layer((c) => {
      const base = B - 24
      rect(c, 0, base, LAYER_W, 40, s.near)
      // haddehane: tuğla bina, tırtıllı çatı, uzun bacalar ve duman
      for (const [x, w] of [[40, 70], [330, 90]] as const) {
        rect(c, x, base - 30, w, 30, '#6a4a3e')
        rect(c, x, base - 30, w, 2, '#8a6a5a')
        for (let k = 0; k < w; k += 10) {
          rect(c, x + k, base - 38, 6, 8, '#8a8f98')
          rect(c, x + k + 2, base - 22, 4, 10, '#e8a040')
        }
      }
      for (const x of [120, 420]) {
        rect(c, x, base - 80, 7, 80, '#7a5a4a')
        rect(c, x - 1, base - 82, 9, 3, '#3a3030')
        for (let k = 0; k < 14; k++) rect(c, x - 3 + k * 2, base - 92 - k * 5, 6 + k, 3, `rgba(190,190,200,${0.55 - k * 0.035})`)
      }
      // vagonlar ve ray
      rect(c, 0, base - 3, LAYER_W, 2, '#4a4a52')
      for (let x = 0; x < LAYER_W; x += 6) rect(c, x, base - 1, 2, 2, '#2a2a2e')
    }),
  }
}

/* ── Düşmanlar: tür adları (çizimleri enemyDraw.ts) ───────────── */
const SNOWY: CityKey[] = ['sivas', 'ardahan', 'bayburt', 'erzurum']

/** Haritadaki düşman türünün o şehirdeki hayvanı (enemyDraw ve rehber aynı adı kullanır). */
export function enemySpecies(kind: 'ground' | 'fly' | 'hopper' | 'charger' | 'bat' | 'spiky' | 'magpie' | 'shark' | 'piranha' | 'aunt', city: CityKey): string {
  if (kind === 'aunt') return 'aunt'
  if (kind === 'magpie') return 'magpie'
  if (kind === 'shark') return 'shark'
  if (kind === 'piranha') return 'piranha'
  if (kind === 'hopper') return SNOWY.includes(city) ? 'hare' : 'frog'
  if (kind === 'charger') return 'ram'
  if (kind === 'bat') return 'bat'
  if (kind === 'spiky') return 'hedgehog'
  return kind === 'ground' ? CITY[city].enemyGround : CITY[city].enemyFly
}

export const CREATURE_NAMES: Record<string, string> = {
  gull: 'Gökçekuş', bee: 'Arı', raven: 'Kuzgun', mosquito: 'Sivrisinek', frog: 'Kurbağa', hare: 'Tavşan', ram: 'Koç', bat: 'Yarasa',
  hedgehog: 'Kirpi', boar: 'Yaban Domuzu', crab: 'Yengeç', pigeon: 'Güvercin', goat: 'Keçi', scorpion: 'Akrep', wolf: 'Gökçekurt',
  snake: 'Yılan', lizard: 'Kertenkele', rat: 'Fare', wasp: 'Eşek Arısı', magpie: 'Saksağan', shark: 'Esoli', piranha: 'Pirana',
  cat: 'Sokak Kedisi', flamingo: 'Flamingo', angora: 'Ankara Keçisi', vanCat: 'Van Kedisi', lion: 'Hitit Aslanı', cow: 'İnek', kangal: 'Kangal', horse: 'At', partridge: 'Keklik', turtle: 'Caretta Caretta', aunt: 'Havuz Teyzesi',
}
