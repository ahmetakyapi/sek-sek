/**
 * Bölüm Düzenleyici'nin DOM'suz yardımcıları: başlangıç şablonları, hazır parçalar, dolgu, dikdörtgen, ayna ve
 * kuşbakışı renkleri. Hepsi saf işlev; tests/editorKit.test.ts her şablonun ve her parçanın çözücüyle bitirildiğini sınar.
 */
import type { CityStyle } from '@/game/art'
import { ROWS, SAMPLE_MAP, SINGLES } from '@/lib/customLevel'

/** Parçada "olduğu gibi bırak" hücresi (simge değil: kodda hiçbir zaman bulunmaz) */
export const KEEP = '.'

export interface Pattern {
  rows: string[]
  /** imlecin altına gelen hücre (parçanın içinde) */
  ax: number
  ay: number
}

export interface Stamp extends Pattern {
  id: string
  name: string
  desc: string
  /** bu sütunların üstü haritanın tepesine dek duvarla örülür (CLAUDE.md: kapatan duvar en üst satıra çıkar) */
  toTop?: number[]
}

const grid = (map: string[]) => map.map((r) => r.split(''))
const join = (rows: string[][]) => rows.map((r) => r.join(''))

/**
 * Hazır parçalar. Oyunun tasarım kurallarına uyar: platform zeminden en çok 2 karo yüksek, boşluk en çok 3 karo, yürünen
 * her geçit en az 2 karo yüksek, dikenli çukur 2 karo ve dikenler bir karo gömülü. Çoğunun imleci "üstünde durulan
 * zeminin bir üstü"dür: düz zeminde, oyuncunun ayağının bastığı satıra tıklanır.
 */
export const STAMPS: Stamp[] = [
  {
    id: 'pit',
    name: 'Dikenli Çukur',
    desc: 'İki karoluk çukur; dikenler bir karo gömülü, üstünden tek zıplayışla geçilir.',
    rows: ['....', '#  #', '#^^#', '####'],
    ax: 0,
    ay: 0,
  },
  {
    id: 'stairs',
    name: 'Basamaklar',
    desc: 'Üç basamak, her biri iki karo yüksek; üstlerinde baş payı açık.',
    rows: ['......   ', '......   ', '...   ###', '...   ###', '   ######', '   ######', '#########', '#########'],
    ax: 0,
    ay: 5,
  },
  {
    id: 'chimney',
    name: 'Duvar Bacası',
    desc: 'İki duvar arasında duvar sekmesiyle tırmanılan baca; üstte sağa açılan çıkıntı.',
    rows: ['#       ', '#       ', '#   ####', '#   #...', '#   #...', '#   #...', '#   #...', '    #...', '    #...'],
    ax: 0,
    ay: 8,
  },
  {
    id: 'mover',
    name: 'Raylı Geçit',
    desc: 'Suyun üstünde iki duvar arasında gidip gelen platform; kenarda bekle, binip karşıya geç.',
    rows: ['..        ..', '##MM      ##', '##~~~~~~~~##', '############'],
    ax: 0,
    ay: 0,
  },
  {
    id: 'lift',
    name: 'Asansör',
    desc: 'İki nokta üst üste (:) ile durdurulan dikey platform; yukarıdaki çıkıntıya taşır.',
    rows: ['::     ', '       ', '  #####', '  #....', '  #....', '  #....', '  #....', 'NN#....'],
    ax: 0,
    ay: 7,
  },
  {
    id: 'cable',
    name: 'Teleferik Geçidi',
    desc: 'Suyun üstünde teleferik halatı; altından zıpla, asıl, karşıya ilerle, güvenli zemine bırak.',
    rows: ['RRRRRRRRRRRR', '            ', '            ', '##        ##', '##~~~~~~~~##', '############'],
    ax: 0,
    ay: 2,
  },
  {
    id: 'ropes',
    name: 'Halat Geçidi',
    desc: 'Çukurun üstünde iki sarkan halat: atla, tutun, öbürüne sıçra.',
    rows: ['   L  L   ', '   L  L   ', '   L  L   ', '   L  L   ', '          ', '          ', '#        #', '#~~~~~~~~#', '##########'],
    ax: 0,
    ay: 5,
  },
  {
    id: 'keyDoor',
    name: 'Anahtar Kapısı',
    desc: 'Alçak tahtada anahtar, yolun sonunda kilitli kapı; duvar haritanın tepesine dek örülür.',
    rows: ['         #', '    K    #', '   ===   #', '         D', '         D'],
    ax: 0,
    ay: 4,
    toTop: [9],
  },
  {
    id: 'plateDoor',
    name: 'Plaka Kapısı',
    desc: 'Plakaya bas: kapıdaki bloklar açılır, köprü belirir. Duvar tepeye dek örülür.',
    rows: ['    #.....', '    [.....', '_   [.....', '#####]]]##', '#####~~~##', '##########'],
    ax: 0,
    ay: 2,
    toTop: [4],
  },
  {
    id: 'hammers',
    name: 'Tokmak Yolu',
    desc: 'Alçak tavandan inen iki tokmak; ritmi izle, aradan geç.',
    rows: ['##########', '  Y    Y  ', '          ', '          ', '          '],
    ax: 0,
    ay: 4,
  },
  {
    id: 'spring',
    name: 'Yay Basamağı',
    desc: 'Yay seni yüksek çıkıntıya fırlatır; tırmanmak isteyen duvara da sekebilir.',
    rows: ['   .####', '   .####', '   .#...', '   .#...', '   .#...', ' S  #...'],
    ax: 0,
    ay: 5,
  },
]

/** Desen haritaya basılır: KEEP hücreleri dokunulmaz, harita dışı kesilir. Tekil simge (P, E, pul…) önce eskisini kaldırır. */
export function placePattern(map: string[], p: Pattern & { toTop?: number[] }, cx: number, cy: number): string[] {
  const rows = grid(map)
  const w = rows[0].length
  const x0 = cx - p.ax
  const y0 = cy - p.ay
  const singles = new Set(p.rows.join('').split('').filter((ch) => (SINGLES as readonly string[]).includes(ch)))
  if (singles.size) for (const row of rows) for (let i = 0; i < row.length; i++) if (singles.has(row[i])) row[i] = ' '
  p.rows.forEach((line, dy) => {
    const y = y0 + dy
    if (y < 0 || y >= ROWS) return
    for (let dx = 0; dx < line.length; dx++) {
      const x = x0 + dx
      if (x < 0 || x >= w || line[dx] === KEEP) continue
      rows[y][x] = line[dx]
    }
  })
  for (const dx of p.toTop ?? []) {
    const x = x0 + dx
    if (x < 0 || x >= w) continue
    for (let y = 0; y < Math.min(y0, ROWS); y++) rows[y][x] = '#'
  }
  return join(rows)
}

/** Aynı karodan oluşan dört komşulu bölgeyi doldurur. */
export function floodFill(map: string[], x: number, y: number, ch: string): string[] {
  const from = map[y]?.[x]
  if (from === undefined || from === ch) return map
  const rows = grid(map)
  const w = rows[0].length
  const stack = [x, y]
  while (stack.length) {
    const py = stack.pop()!
    const px = stack.pop()!
    if (px < 0 || py < 0 || px >= w || py >= ROWS || rows[py][px] !== from) continue
    rows[py][px] = ch
    stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1)
  }
  return join(rows)
}

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** İki köşeden sıralı dikdörtgen */
export const norm = (r: Rect): Rect => ({ x0: Math.min(r.x0, r.x1), y0: Math.min(r.y0, r.y1), x1: Math.max(r.x0, r.x1), y1: Math.max(r.y0, r.y1) })

export function fillRect(map: string[], r: Rect, ch: string): string[] {
  const n = norm(r)
  return map.map((row, y) => (y < n.y0 || y > n.y1 ? row : row.slice(0, n.x0) + ch.repeat(n.x1 - n.x0 + 1) + row.slice(n.x1 + 1)))
}

/** Seçimin içeriği (kopyala) */
export function cut(map: string[], r: Rect): string[] {
  const n = norm(r)
  return map.slice(n.y0, n.y1 + 1).map((row) => row.slice(n.x0, n.x1 + 1))
}

/** Sağ-sol ayna: yönü olan karolar da döner (ok tuzağı). */
const FLIP: Record<string, string> = { '>': '<', '<': '>' }
export const mirrorRows = (rows: string[]): string[] => rows.map((row) => Array.from(row, (ch) => FLIP[ch] ?? ch).reverse().join(''))

export function mirrorRect(map: string[], r: Rect): string[] {
  const n = norm(r)
  const flipped = mirrorRows(cut(map, n))
  return map.map((row, y) => (y < n.y0 || y > n.y1 ? row : row.slice(0, n.x0) + flipped[y - n.y0] + row.slice(n.x1 + 1)))
}

/** Başlangıç şablonları: hepsi geçerli ve bitirilebilir. */
export interface Template {
  id: string
  name: string
  desc: string
  make: () => string[]
}

function blankRows(w: number) {
  return Array.from({ length: ROWS }, () => Array<string>(w).fill(' '))
}

function flat(w: number, top: number) {
  const r = blankRows(w)
  for (let y = top; y < ROWS; y++) r[y].fill('#')
  return r
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Boş Sayfa',
    desc: 'Yalnız en alt satırda zemin, bir başlangıç ve bir çıkış.',
    make: () => {
      const r = blankRows(60)
      r[23].fill('#')
      r[22][2] = 'P'
      r[22][57] = 'E'
      return join(r)
    },
  },
  {
    id: 'flat',
    name: 'Düz Zemin',
    desc: 'Yüz sütun düz zemin: üstüne istediğini kur.',
    make: () => {
      const r = flat(100, 20)
      r[19][2] = 'P'
      r[19][97] = 'E'
      return join(r)
    },
  },
  {
    id: 'sample',
    name: 'Örnek Yol',
    desc: 'Su çukuru, tahta, bayrak ve dikenle kısa bir örnek.',
    make: () => [...SAMPLE_MAP],
  },
  {
    id: 'cave',
    name: 'Mağara',
    desc: 'Alçalıp yükselen tavan, sarkıtlar ve basamaklı taban.',
    make: () => {
      const W = 120
      const r = blankRows(W)
      for (let x = 0; x < W; x++) {
        const roof = 4 + Math.round(2 + 2 * Math.sin(x / 7))
        const floor = 19 - (Math.floor(x / 12) % 3 === 1 ? 1 : 0)
        for (let y = 0; y < roof; y++) r[y][x] = '#'
        for (let y = floor + 1; y < ROWS; y++) r[y][x] = '#'
        if (x % 17 === 9) r[roof][x] = 'v'
      }
      r[19][2] = 'P'
      r[19][60] = 'F'
      r[19][117] = 'E'
      r[18][14] = 't'
      return join(r)
    },
  },
  {
    id: 'islands',
    name: 'Adalar',
    desc: 'Suyun üstünde iki üç karo arayla adalar.',
    make: () => {
      const W = 100
      const r = blankRows(W)
      for (let y = 21; y < ROWS; y++) r[y].fill('~')
      let x = 0
      let i = 0
      while (x < W) {
        const len = i === 0 ? 10 : 5 + (i % 3)
        const top = 20 - (i % 2)
        for (let dx = 0; dx < len && x + dx < W; dx++) for (let y = top; y < ROWS; y++) r[y][x + dx] = '#'
        x += len + 2 + (i % 2)
        i++
      }
      for (let y = 19; y < ROWS; y++) for (let dx = W - 8; dx < W; dx++) r[y][dx] = y === 19 ? ' ' : '#'
      r[19][2] = 'P'
      r[19][W - 3] = 'E'
      return join(r)
    },
  },
  {
    id: 'tower',
    name: 'Kule',
    desc: 'Yukarı doğru tahtalarla çıkılan bir kule; çıkış tepede.',
    make: () => {
      const W = 60
      const r = flat(W, 20)
      // sol duvarın dibinde iki karoluk giriş; basamaklar iki karo arayla sağdan sola
      for (let y = 5; y < 20; y++) {
        if (y < 18) r[y][20] = '#'
        r[y][39] = '#'
      }
      for (let x = 31; x < 39; x++) r[18][x] = r[19][x] = '#'
      for (let k = 1; k <= 6; k++) {
        const y = 18 - k * 2
        for (let dx = 0; dx < 8; dx++) r[y][k % 2 ? 21 + dx : 31 + dx] = '='
      }
      for (let x = 21; x < 39; x++) r[4][x] = '='
      for (let y = 4; y < ROWS; y++) for (let x = 39; x < W; x++) r[y][x] = '#'
      r[19][3] = 'P'
      r[3][W - 3] = 'E'
      return join(r)
    },
  },
]

/** Kuşbakışı renkleri (galeri küçük resmi ve düzenleyicinin harita şeridi): karo başına tek renk, şehrin paletinden. */
export function thumbColors(p: CityStyle): Record<string, string> {
  const gold = '#ffcc66'
  const red = '#e30a17'
  const enemy = '#ff6b6b'
  return {
    '#': p.tile, X: p.tileDark, '>': p.tileDark, '<': p.tileDark, i: p.tileLight, '=': p.plank, '~': p.water[0], I: p.water[2],
    '^': p.spike[0], v: p.spike[0], S: p.accent, C: gold, F: red, E: gold, P: '#f3f1ff', e: enemy, f: enemy, h: enemy, c: enemy,
    u: enemy, x: enemy, j: enemy, W: '#3fa9b8', L: '#c49a5a', R: '#8f96a3', $: gold, '!': '#4aa8ff', K: gold, D: p.plank,
    '%': p.tileLight, '*': '#9fd8ff', p: p.plank, _: p.accent, '[': '#4a7bd8', ']': '#e0b030', M: p.plank, N: p.plank, B: red,
    Y: p.tileDark,
  }
}
