/**
 * Bölüm Düzenleyici'nin DOM'suz yardımcıları: başlangıç şablonları, hazır parçalar, dolgu, dikdörtgen, ayna ve
 * kuşbakışı renkleri. Hepsi saf işlev; tests/editorKit.test.ts her şablonun ve her parçanın çözücüyle bitirildiğini sınar.
 */
import type { CityStyle } from '@/game/art'
import { MAX_W, MIN_W, ROWS, SAMPLE_MAP, SINGLES } from '@/lib/customLevel'

/** Parçada "olduğu gibi bırak" hücresi (simge değil: kodda hiçbir zaman bulunmaz) */
export const KEEP = '.'

export interface Pattern {
  rows: string[]
  /** imlecin altına gelen hücre (parçanın içinde) */
  ax: number
  ay: number
}

/** Hazır parça kategorileri (palet bu sırayla gösterir) */
export type StampCat = 'ziplama' | 'zamanlama' | 'bulmaca' | 'su' | 'tehlike' | 'sus' | 'boss'
export const STAMP_CATS: Array<{ id: StampCat; name: string }> = [
  { id: 'ziplama', name: 'Zıplama' },
  { id: 'zamanlama', name: 'Zamanlama' },
  { id: 'bulmaca', name: 'Bulmaca' },
  { id: 'su', name: 'Su' },
  { id: 'tehlike', name: 'Tehlike' },
  { id: 'sus', name: 'Süs ve Köy' },
  { id: 'boss', name: 'Boss Girişi' },
]

export interface Stamp extends Pattern {
  id: string
  cat?: StampCat
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
  {
    id: 'arena',
    name: 'Boss Arenası',
    desc: 'Sol ucu ray sonuyla (|) kapalı düz arena, ortada boss; sağdaki boss kapısı boss yenilince açılır. Boss’u Boss sekmesinde tasarla.',
    rows: ['                                 #', '                                 #', '                                 #', '                                 #', '                                 G', '|               Q                G', '##################################'],
    ax: 0,
    ay: 6,
  },
  {
    id: 'rhythm',
    name: 'Ritim Köprüsü',
    desc: 'Diken tarlasının üstünde sırayla belirip kaybolan iki takım taş: ritmi tut, taştan taşa geç.',
    rows: ['#                  #', '#  {{  }}  {{  }}  #', '#                  #', '#^^^^^^^^^^^^^^^^^^#', '####################'],
    ax: 0,
    ay: 4,
  },
  {
    id: 'hammerHall',
    name: 'Tokmak Koridoru',
    desc: 'Dört tokmaklı alçak koridor; tokmak kalkınca geç, inerken altında durma.',
    rows: ['######################', '#   Y    Y    Y    Y  ', '#                     ', '#                     ', '######################'],
    ax: 0,
    ay: 4,
  },
  {
    id: 'dive',
    name: 'Dalış Havuzu',
    desc: 'Derin suya dal, tepeye dek örülü duvarın altından yüz, karşıda yüzeye çık. Su altı kısa: nefes yeter.',
    rows: ['......#......', '.WWWWW#WWWWW.', '.WWWWWWWWWWW.', '.WWWWWWWWWWW.'],
    ax: 0,
    ay: 0,
    toTop: [6],
  },
  {
    id: 'ropeClimb',
    name: 'Halat Tırmanışı',
    desc: 'Yüksek çıkıntının önünde sarkan halat: zıpla, tutun, yukarı tırman, çıkıntıya atla.',
    rows: ['  L      ', '  L      ', '  L      ', '  L #####', '  L #####', '  L #####', '  L #####', '    #####', '    #####'],
    ax: 0,
    ay: 8,
  },
  {
    id: 'nitro',
    name: 'Nitro Pisti',
    desc: 'Nitro tüpünden sonra iki kısa çukur: nitroyla hızlı ve uzun atlarsın, nitrosuz da adım adım geçilir.',
    rows: [' T            ', '####  ###  ###', '####~~###~~###', '##############'],
    ax: 0,
    ay: 0,
  },
  {
    id: 'ringPit',
    name: 'Halka Kestirmesi',
    desc: 'Suyun ortasında basamak taşı; üstündeki dash halkasıyla taşa basmadan tek seferde de geçilir.',
    rows: ['....      ....', '....      ....', '....  **  ....', '..............', '#   ######   #', '#~~~######~~~#', '##############'],
    ax: 0,
    ay: 3,
  },
  {
    id: 'crate',
    name: 'Sandık Basamağı',
    desc: 'Sandığı duvarın dibine it, üstüne çık, yüksek çıkıntıya atla.',
    rows: ['         ...', '         ...', '      ######', '      ######', '      ######', '  p   ######'],
    ax: 0,
    ay: 5,
  },
  {
    id: 'balloon',
    name: 'Balon Kalkışı',
    desc: 'Balona bin: iki nokta üst üste (:) olan yere dek yükselir. Çıkıntıya geç; inince balon yavaşça alçalır.',
    rows: ['::      ', '        ', '  ######', '  #.....', '  #.....', '  #.....', '  #.....', 'BB#.....'],
    ax: 0,
    ay: 7,
  },
  {
    id: 'ice',
    name: 'Buz Göleti',
    desc: 'Kaygan buzun ortasında gömülü dikenli çukur: erken zıpla, inince kaymayı hesaba kat.',
    rows: ['..............', 'IIIIII  IIIIII', '######^^######', '##############'],
    ax: 0,
    ay: 0,
  },
  {
    id: 'wetSteps',
    name: 'Islak Basamaklar',
    desc: 'Islak taştan üç basamak: biraz kayar, acele etme.',
    rows: ['......   ', '......   ', '...   iii', '...   iii', '   iiiiii', '   iiiiii', 'iiiiiiiii', 'iiiiiiiii'],
    ax: 0,
    ay: 5,
  },
]

/** İlk yazılan parçaların kategorisi (sonradan gelenler kendi `cat`ini taşır) */
const OLD_CAT: Record<string, StampCat> = {
  pit: 'tehlike', stairs: 'ziplama', chimney: 'ziplama', mover: 'zamanlama', lift: 'zamanlama', cable: 'su', ropes: 'su',
  keyDoor: 'bulmaca', plateDoor: 'bulmaca', hammers: 'zamanlama', spring: 'ziplama', arena: 'boss', rhythm: 'zamanlama',
  hammerHall: 'zamanlama', dive: 'su', ropeClimb: 'ziplama', nitro: 'ziplama', ringPit: 'ziplama', crate: 'bulmaca',
  balloon: 'ziplama', ice: 'tehlike', wetSteps: 'ziplama',
}
export const stampCat = (s: Stamp): StampCat => s.cat ?? OLD_CAT[s.id] ?? 'ziplama'

/** Sarkıt Koridoru: tavan dikenlerinin sütunları */
const spikeCeiling = (w: number) => Array.from({ length: w }, (_, i) => (i % 3 === 1 ? 'v' : ' ')).join('')

STAMPS.push(
  // Zıplama
  {
    id: 'pyramid', cat: 'ziplama', name: 'Basamaklı Kule', desc: 'Üç basamakla çıkılan, aynı yoldan inilen kule: her basamak iki karo.',
    rows: ['........#####........', '........#####........', '.....###########.....', '.....###########.....', '..#################..', '..#################..', '#####################'],
    ax: 0, ay: 5,
  },
  {
    id: 'floatSteps', cat: 'ziplama', name: 'Havada Tahtalar', desc: 'İki karo arayla yükselip alçalan ince tahtalar; istersen altından yürüyüp geçersin.',
    rows: ['.....................', '.....................', '.........===.........', '.....................', '.....===.....===.....', '.....................', '.==.............==...', '.....................'],
    ax: 0, ay: 7,
  },
  {
    id: 'gapHop', cat: 'ziplama', name: 'Üç Karoluk Boşluk', desc: 'Üç karo genişliğinde su çukuru: koşarak tek zıplayışta geçilir.',
    rows: ['.......', '##~~~##', '##~~~##', '#######'], ax: 0, ay: 0,
  },
  {
    id: 'dashGap', cat: 'ziplama', name: 'Dash Boşluğu', desc: 'Beş karoluk su: zıpla, havada dash at. Orta ve Zor haritalar için.',
    rows: ['.........', '##~~~~~##', '##~~~~~##', '#########'], ax: 0, ay: 0,
  },
  {
    id: 'valley', cat: 'ziplama', name: 'Derin Vadi', desc: 'İki karo derinliğinde dört karo genişliğinde vadi: in, karşı kenara zıpla.',
    rows: ['........', '##    ##', '##    ##', '########'], ax: 0, ay: 0,
  },
  // Zamanlama
  {
    id: 'rhythmDoor', cat: 'zamanlama', name: 'Ritim Kapısı', desc: 'Alçak koridorda yolu kapatan ritim bloğu: kaybolunca geç, geri belirmeden çık.',
    rows: ['###########', '.....{.....', '.....{.....', '...........'], ax: 0, ay: 2,
  },
  {
    id: 'rhythmPair', cat: 'zamanlama', name: 'Çifte Ritim Kapısı', desc: 'İki kapı sırayla açılır: ilkinden geç, aradaki boşlukta dur, ikincisi açılınca çık.',
    rows: ['#############', '..{.......}..', '..{.......}..', '.............'], ax: 0, ay: 2,
  },
  // Su
  {
    id: 'plankBridge', cat: 'su', name: 'Tahta Köprü', desc: 'Suyun üstünde zemin hizasında ince tahtalar: yürüyerek geçilir.',
    rows: ['.........', '##=====##', '##~~~~~##', '#########'], ax: 0, ay: 0,
  },
  {
    id: 'stoneRow', cat: 'su', name: 'Taş Sırası', desc: 'İki karoluk taşlar, aralarında iki karo su: taştan taşa zıpla.',
    rows: ['..............', '##~~##~~##~~##', '##~~##~~##~~##', '##############'], ax: 0, ay: 0,
  },
  {
    id: 'tideBasin', cat: 'su', name: 'Gelgitli Havuz', desc: 'Sekiz saniyede bir dolup çekilen havuz: yüksekken yüz, alçakken dibinden yürü.',
    rows: ['.........', '##AAAAA##', '##AAAAA##', '#########'], ax: 0, ay: 0,
  },
  {
    id: 'ropeWell', cat: 'su', name: 'Halatlı Kuyu', desc: 'Üç karo derin kuyu: in ve halatla tırman. Düşmek zarar vermez.',
    rows: ['...L...', '...L...', '...L...', '...L...', '.. L ..', '.. L ..', '.. L ..', '.......'], ax: 0, ay: 3,
  },
  // Tehlike
  {
    id: 'thornField', cat: 'tehlike', name: 'Diken Tarlası', desc: 'Üç karo genişliğinde, dikenleri bir karo gömülü çukur: tek zıplayışla geç.',
    rows: ['.....', '#   #', '#^^^#', '#####'], ax: 0, ay: 0,
  },
  {
    id: 'ceilingSpikes', cat: 'tehlike', name: 'Sarkıt Koridoru', desc: 'Tavandan sarkan dikenler: altlarında zıplama, yürüyerek geç.',
    rows: ['###############', spikeCeiling(15), '...............', '...............', '...............'], ax: 0, ay: 4,
  },
  {
    id: 'crumbleBridge', cat: 'tehlike', name: 'Çatlak Taş Köprüsü', desc: 'Basınca çöken taşlar: durma, taştan taşa ilerle. Geri dönüş yok.',
    rows: ['..............', '##~~XX~~XX~~##', '##~~~~~~~~~~##', '##############'], ax: 0, ay: 0,
  },
  {
    id: 'iceSteps', cat: 'tehlike', name: 'Buz Basamakları', desc: 'Kaygan buzdan üç basamak: kayarak çıkarsın, ağır ağır.',
    rows: ['......   ', '......   ', '...   III', '...   III', '   IIIIII', '   IIIIII', 'IIIIIIIII', 'IIIIIIIII'], ax: 0, ay: 5,
  },
  // Bulmaca
  {
    id: 'secretTunnel', cat: 'bulmaca', name: 'Kaya Tüneli', desc: 'Kayanın içinden karanlık bir geçit; içinde bir hatıra saklı. Hatıra sayısı üçü geçmesin.',
    rows: ['#########', '#########', '%       %', '%     C %', '.........'], ax: 0, ay: 3,
  },
  {
    id: 'plateBridge', cat: 'bulmaca', name: 'Plaka Köprüsü', desc: 'Plakaya bas: sudaki boşluğa köprü belirir. Plaka, boşluğun öncesinde.',
    rows: ['_.......', '##]]]]##', '##~~~~##', '########'], ax: 0, ay: 0,
  },
  {
    id: 'keyShelf', cat: 'bulmaca', name: 'Anahtar Tahtası', desc: 'İki karo yüksekte tahta, üstünde anahtar. Kapıyı (Anahtar Kapısı parçası) ayrıca koy.',
    rows: ['.......', '...K...', '.=====.', '.......'], ax: 0, ay: 3,
  },
  // Süs ve köy
  {
    id: 'plaza', cat: 'sus', name: 'Meydan', desc: 'Fenerler ve ağaçlar arasında bir tabela ile bir şehir insanı. Sözleri Metinler sekmesinde yaz.',
    rows: ['t..l..?..n..l..t'], ax: 0, ay: 0,
  },
  {
    id: 'lampRow', cat: 'sus', name: 'Fener Sırası', desc: 'Dört karoda bir fener, aralarında pencereler: yalnız görünüş.',
    rows: ['l...w...l...w...l'], ax: 0, ay: 0,
  },
  {
    id: 'flagCorner', cat: 'sus', name: 'Bayrak Köşesi', desc: 'Bayrak süsleri, ağaç ve bir bayrak: dinlenme yeri.',
    rows: ['t.b.l..F..l.b.t'], ax: 0, ay: 0,
  },
  {
    id: 'treeLine', cat: 'sus', name: 'Ağaç Sırası', desc: 'Ağaç ve fenerlerden bir sıra: boş yolu canlandırır.',
    rows: ['t..t...l..t..t...l..t'], ax: 0, ay: 0,
  },
  {
    id: 'stoneHouse', cat: 'sus', name: 'Taş Kemer', desc: 'İçinden geçilen taş kemer; pencereli, çatısı yürünür.',
    rows: ['.#########.', '.  w   w  .', '.         .'], ax: 0, ay: 2,
  },
  // Boss girişi
  {
    id: 'bossAnte', cat: 'boss', name: 'Arena Önü', desc: 'Fener, tabela ve bayrak: boss’tan önceki son dinlenme yeri. Tabelaya nasıl yenileceğini yaz.',
    rows: ['l..?..F..l'], ax: 0, ay: 0,
  },
  {
    id: 'arenaPlanks', cat: 'boss', name: 'Tahtalı Arena', desc: 'İki yanında ince tahta olan Boss Arenası: boss’u izlemek için yüksek yer.',
    rows: ['                                 #', '                                 #', '                                 #', '                                 #', '                                 G', '|               Q                G', '##################################'].map((r, i) =>
      i === 4 ? '     ====          ====          G' : r,
    ),
    ax: 0, ay: 6,
  },
)

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

/** Alt-üst ayna: diken ve tavan dikeni yer değiştirir. */
const FLIP_V: Record<string, string> = { '^': 'v', v: '^' }
export const flipRowsV = (rows: string[]): string[] => [...rows].reverse().map((row) => Array.from(row, (ch) => FLIP_V[ch] ?? ch).join(''))

/** Saat yönünde çeyrek dönüş: sütunlar satır olur (yön bilgisi taşıyan karolar olduğu gibi kalır). */
export const rotateRows = (rows: string[]): string[] => Array.from({ length: rows[0].length }, (_, x) => Array.from({ length: rows.length }, (_, y) => rows[rows.length - 1 - y][x]).join(''))

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
      r[19][50] = 'F'
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
      // ortadaki adada bayrak: düşen baştan başlamasın
      for (let fx = W / 2; fx < W; fx++) {
        const top = r.findIndex((row) => row[fx] === '#')
        if (top > 0 && r[top][fx + 1] === '#') {
          r[top - 1][fx] = 'F'
          break
        }
      }
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

/** Hazır parçayı şablonun içine basar (şablonlar da parçalar gibi oynanabilir kalır) */
const stampAt = (rows: string[][], id: string, x: number, y: number): string[][] => grid(placePattern(join(rows), STAMPS.find((s) => s.id === id)!, x, y))

TEMPLATES.push(
  {
    id: 'underwater',
    name: 'Su Altı Mağarası',
    desc: 'Tavanı sarkıtlı mağarada iki dalış havuzu ve halatlı bir çukur; bir hatıra su altında saklı.',
    make: () => {
      const W = 100
      let r = flat(W, 20)
      for (let y = 0; y < 4; y++) r[y].fill('#')
      for (const x of [12, 37, 64, 92]) r[4][x] = 'v'
      // ilk havuz: tavandan inen iki duvarın altından yüzülür, aradaki yüzeyde nefes alınır
      for (let x = 14; x <= 40; x++) for (let y = 20; y <= 22; y++) r[y][x] = 'W'
      for (const wx of [22, 32]) for (let y = 4; y <= 20; y++) r[y][wx] = '#'
      r[22][27] = 'C'
      r[19][46] = 'F'
      r = stampAt(r, 'ropes', 52, 19)
      for (let x = 67; x <= 71; x++) r[18][x] = '='
      r[16][69] = 'C'
      r = stampAt(r, 'dive', 76, 19)
      r[19][2] = 'P'
      r[19][8] = 'l'
      r[19][96] = 'E'
      return join(r)
    },
  },
  {
    id: 'rhythmTower',
    name: 'Ritim Kulesi',
    desc: 'Kulenin katları sırayla belirip kaybolan ritim bloklarından; düşen bir alt kattaki tahtaya iner.',
    make: () => {
      const W = 60
      const r = flat(W, 20)
      for (let y = 5; y < 20; y++) {
        if (y < 18) r[y][20] = '#'
        r[y][39] = '#'
      }
      for (let x = 31; x < 39; x++) r[18][x] = r[19][x] = '#'
      // katlar: tahta, önce, sonra, tahta, önce, sonra; tahtalar dinlenme yeri
      const floors = ['=', '{', '}', '=', '{', '}']
      floors.forEach((ch, i) => {
        const k = i + 1
        const y = 18 - k * 2
        for (let dx = 0; dx < 8; dx++) r[y][k % 2 ? 21 + dx : 31 + dx] = ch
      })
      for (let x = 21; x < 39; x++) r[4][x] = '='
      for (let y = 4; y < ROWS; y++) for (let x = 39; x < W; x++) r[y][x] = '#'
      r[19][3] = 'P'
      r[19][14] = 'F'
      r[3][30] = 'C'
      r[3][W - 3] = 'E'
      return join(r)
    },
  },
  {
    id: 'bossCastle',
    name: 'Boss Kalesi',
    desc: 'Kısa bir yol, arenadan hemen önce bayrak ve tabela, kalenin içinde boss; kapı boss yenilince açılır. Boss’u Boss sekmesinde tasarla.',
    make: () => {
      const W = 120
      let r = flat(W, 20)
      r = stampAt(r, 'pit', 12, 19)
      r = stampAt(r, 'stairs', 22, 19)
      r[19][2] = 'P'
      r[19][8] = 't'
      r[15][30] = 'C'
      r[19][45] = '?'
      r[19][47] = 'F'
      // kale: arena, iki yanında tepeye dek duvar; sağdaki duvarın tek geçidi boss kapısı
      r = stampAt(r, 'arena', 50, 20)
      for (let y = 0; y < 14; y++) r[y][83] = '#'
      for (let y = 8; y < 18; y++) r[y][49] = '#'
      r[19][58] = 'l'
      r[19][76] = 'l'
      r[19][100] = 't'
      r[19][115] = 'E'
      return join(r)
    },
  },
)

/** Haritayı boyutlandırır: daralırken sağdan keser, genişlerken sağ kenar boş uzar (zemin devam eder) */
export function resizeMap(map: string[], w: number): string[] {
  const cols = map[0].length
  const to = Math.max(MIN_W, Math.min(MAX_W, w))
  if (to === cols) return map
  return map.map((r) => (to < cols ? r.slice(0, to) : r + (/[#=~I iX^vW%]/.test(r[cols - 1]) ? r[cols - 1] : ' ').repeat(to - cols)))
}

/** Sağ kenardaki zeminin üst satırı (alttan yukarı kesintisiz '#'); makul değilse 20 */
function floorTop(map: string[]): number {
  const x = map[0].length - 1
  let y = ROWS
  while (y > 0 && map[y - 1][x] === '#') y--
  return y >= 14 && y < ROWS ? y : 20
}

/** `extra` sütun, sağ kenarın zemin hizasında düz zeminle uzar; çıkış (E) ve eski şablonun bayrakları yerinde kalır */
function growFlat(map: string[], extra: number): { rows: string[][]; top: number; oldW: number } {
  const top = floorTop(map)
  const oldW = map[0].length
  const rows = grid(map).map((r, y) => [...r, ...Array.from({ length: extra }, () => (y >= top ? '#' : ' '))])
  return { rows, top, oldW }
}

/** Çıkışı (E) taşır, aralara bayrak koyar: sağdaki yeni yol da 75 karoyu geçmez */
function placeExit(rows: string[][], top: number, from: number, exitX: number) {
  for (const row of rows) for (let i = 0; i < row.length; i++) if (row[i] === 'E') row[i] = ' '
  rows[top - 1][exitX] = 'E'
  let last = from
  for (let x = from + 55; x < exitX - 12; x += 55) {
    rows[top - 1][x] = 'F'
    last = x
  }
  return last
}

/** Haritayı sağa uzatır (düz zeminle); çıkış yeni sona taşınır, aralara bayrak konur */
export function extendMap(map: string[], w: number): string[] {
  const to = Math.min(MAX_W, w)
  const oldW = map[0].length
  if (to <= oldW) return map
  const { rows, top } = growFlat(map, to - oldW)
  // son durak: eski haritanın en sağdaki bayrağı ya da başlangıcı
  let from = 0
  rows.forEach((row) => row.forEach((ch, x) => ch === 'F' || ch === 'P' ? (from = Math.max(from, x)) : 0))
  placeExit(rows, top, from, to - 3)
  return join(rows)
}

/** Sağa boss arenası ekler: tabela, bayrak, kale duvarları, boss, kapı ve yeni çıkış */
export function appendBossArena(map: string[]): string[] {
  const arena = STAMPS.find((s) => s.id === 'arena')!
  const arenaW = arena.rows[0].length
  const room = 12 + arenaW + 8
  if (map[0].length + room > MAX_W) return map
  const { rows, top, oldW } = growFlat(map, room)
  const x0 = oldW + 12
  placeExit(rows, top, oldW, rows[0].length - 4)
  let out = join(rows)
  out = placePattern(out, { ...arena, toTop: [arenaW - 1] }, x0, top)
  const g = grid(out)
  for (let y = Math.max(0, top - 12); y <= top - 3; y++) g[y][x0 - 1] = '#'
  g[top - 1][x0 - 5] = 'F'
  g[top - 1][x0 - 8] = '?'
  g[top - 1][x0 - 11] = 'l'
  g[top - 1][x0 + 10] = 'l'
  return join(g)
}

/** Yeni Harita Sihirbazı'nın seçimleri */
export interface WizardPlan {
  template: string
  width: number
  boss: boolean
}

export function wizardMap(plan: WizardPlan): string[] {
  let m = (TEMPLATES.find((x) => x.id === plan.template) ?? TEMPLATES[0]).make()
  if (plan.boss) m = appendBossArena(m)
  return extendMap(m, plan.width)
}

/** Seçilen alanda her sütunu, ilk zeminden alana kadar doldurur: havada kalan oyuk ve kenar boşlukları kapanır */
export function autoGround(map: string[], r: Rect): string[] {
  const n = norm(r)
  const rows = grid(map)
  for (let x = n.x0; x <= n.x1; x++) {
    let first = -1
    for (let y = n.y0; y <= n.y1; y++) if (rows[y][x] === '#') { first = y; break }
    if (first < 0) continue
    for (let y = first; y <= n.y1; y++) if (rows[y][x] === ' ') rows[y][x] = '#'
  }
  return join(rows)
}

/** Seçimi sağa art arda çoğaltır: her kopya bir öncekinin hemen yanına (araya `gap` boş sütun) basılır */
export function repeatRect(map: string[], r: Rect, times: number, gap = 0): string[] {
  const n = norm(r)
  const piece = cut(map, n)
  const w = n.x1 - n.x0 + 1
  let out = map
  for (let k = 1; k <= times; k++) out = placePattern(out, { rows: piece, ax: 0, ay: 0 }, n.x0 + k * (w + gap), n.y0)
  return out
}

/** Haritanın sayıları: düzenleyicinin istatistik kutusu */
export interface MapStats {
  width: number
  items: number
  flags: number
  spikes: number
  pits: number
  enemies: number
  traps: number
  movers: number
  signs: number
  npcs: number
  boss: boolean
  /** tehlike toplamı: diken, su çukuru kümesi, düşman, tuzak */
  hazards: number
}

export function mapStats(map: string[]): MapStats {
  const w = map[0]?.length ?? 0
  const count = (set: string) => {
    let n = 0
    for (const row of map) for (const ch of row) if (set.includes(ch)) n++
    return n
  }
  // su çukurları: bitişik '~' karelerin kümeleri
  const seen = new Set<number>()
  let pits = 0
  for (let y = 0; y < map.length; y++)
    for (let x = 0; x < w; x++) {
      if (map[y][x] !== '~' || seen.has(y * w + x)) continue
      pits++
      const stack = [x, y]
      while (stack.length) {
        const yy = stack.pop()!
        const xx = stack.pop()!
        if (xx < 0 || yy < 0 || xx >= w || yy >= map.length || map[yy][xx] !== '~' || seen.has(yy * w + xx)) continue
        seen.add(yy * w + xx)
        stack.push(xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1)
      }
    }
  const spikes = count('^v')
  const enemies = count('efhcuxj')
  const traps = count('><Y')
  return { width: w, items: count('C'), flags: count('F'), spikes, pits, enemies, traps, movers: count('MNBO{}'), signs: count('?'), npcs: count('n'), boss: count('Q') > 0, hazards: spikes + pits + enemies + traps }
}

/** Çözücü takılınca civardaki sorunun sebebini tahmin eder: ne yapılacağını söyler (metin TR, arayüz t() ile çevirir) */
export function stuckHint(map: string[], x: number, y: number): { text: string; vars?: Record<string, number> } {
  const w = map[0].length
  const solid = (cx: number, cy: number) => cy >= 0 && cy < ROWS && cx >= 0 && cx < w && STAND.has(map[cy][cx])
  const near = (set: string, r = 6) => {
    for (let cy = 0; cy < ROWS; cy++) for (let cx = Math.max(0, x - r); cx <= Math.min(w - 1, x + r); cx++) if (set.includes(map[cy][cx])) return true
    return false
  }
  // durulan zemin: takılınan karenin altındaki ilk katı
  let ground = Math.min(ROWS - 1, Math.max(0, y))
  while (ground < ROWS - 1 && !solid(x, ground)) ground++
  // sağdaki boşluk: üzerinde durulacak yer olmayan ardışık sütunlar
  let gap = 0
  for (let cx = x + 1; cx < Math.min(w, x + 14); cx++) {
    let ok = false
    for (let cy = Math.max(0, ground - 3); cy <= Math.min(ROWS - 1, ground + 3); cy++) if (solid(cx, cy)) ok = true
    if (ok) break
    gap++
  }
  if (gap > 3) return { text: 'Önünde {n} karoluk boşluk var: zıplama en çok 3 karo yana yeter. Araya taş, tahta ya da yay koy.', vars: { n: gap } }
  // sağdaki duvar yüksekliği
  let wall = 0
  for (let cy = ground - 1; cy >= 0 && solid(x + 1, cy); cy--) wall++
  if (wall > 4) return { text: 'Önündeki duvar {n} karo yüksek: zıplama en çok 4 karo çıkar. Basamak ya da tahta ekle.', vars: { n: wall } }
  if (near('D_[]')) return { text: 'Yakında kapı, plaka ya da renkli blok var: anahtarı ya da plakayı yolun üstüne koy, kapıyı en az iki karo geniş bırak.' }
  if (near('{}MNBO')) return { text: 'Yakında hareketli ya da ritimli bir parça var: aralıklar sığmıyor olabilir. Boşluğu daralt ya da bir dinlenme tahtası ekle.' }
  if (near('^~v', 4)) return { text: 'Yakında diken ya da su çukuru var ve geçecek yer görünmüyor: çukuru daralt (en çok 2-3 karo) ya da üstüne tahta koy.' }
  return { text: 'Çevredeki platformların aralığını ve yüksekliğini kontrol et: en çok 3 karo yana, 2 karo yukarı zıplanır.' }
}

/** Tabela için hazır öneriler (Metinler sekmesi; her biri 140 karakterden kısa) */
export const SIGN_TIPS = [
  'Duvara tutun, yukarı sek.',
  'Çukurun üstünden tek zıplayışla geç.',
  'Havada Dash at: boşluğu aşarsın.',
  'Tokmak kalkınca geç, inerken altında durma.',
  'Plakaya bas, köprü belirsin.',
  'Anahtar yukarıda: tahtalara çık.',
  'Bayrak burada: düşersen buradan başlarsın.',
  'Önde boss var. Işaretini bekle, yorulunca üstüne bas.',
  'Sağa bak: bir köşe seni bekliyor.',
  'Su soğuk, ama yüzülür.',
] as const

/** Şehir insanı için hazır sözler: [ad, söz, kılık] */
export const NPC_TIPS: ReadonlyArray<readonly [string, string, 'amca' | 'teyze' | 'usta' | 'genc' | 'coban' | 'ozan']> = [
  ['Simitçi Hasan', 'Çay da var, simit de! Şşş… duvarın ardına bak.', 'usta'],
  ['Fenerci Ayşe', 'Fenerler her akşam yanar. Yolun sonunda biri seni bekliyor.', 'teyze'],
  ['Çoban Yusuf', 'Yukarı çık, rüzgâra karşı sıçra. Sürüm oradan geçer.', 'coban'],
  ['Ozan Selim', 'Yol uzun, türkü kısa. Bayrağa varınca bir ses duyarsın.', 'ozan'],
  ['Gezgin Kemal', 'Bu köyde eskiden bir kuyu varmış; ipine tutun.', 'amca'],
  ['Genç Elif', 'Ben o boss’u gördüm! Yorulana dek kaç, sonra üstüne bas.', 'genc'],
]

/** Düz zemin üstüne parçaları dizer: [parça, sütun] çiftleri; P, bayraklar ve çıkış `extra` ile */
function composed(w: number, parts: Array<[string, number]>, extra: (r: string[][]) => void, top = 20): string[] {
  let r = flat(w, top)
  for (const [id, x] of parts) r = stampAt(r, id, x, top - 1)
  extra(r)
  return join(r)
}

TEMPLATES.push(
  {
    id: 'mountain',
    name: 'Dağ Yolu',
    desc: 'Üç basamaklı kule, havada tahtalar ve vadi: tırmanıp inen bir dağ yolu; zirvelerde hatıra.',
    make: () =>
      composed(
        140,
        [['pyramid', 18], ['valley', 48], ['floatSteps', 62], ['pyramid', 92], ['gapHop', 120]],
        (r) => {
          r[19][2] = 'P'
          r[19][8] = 't'
          r[13][28] = 'C'
          r[19][44] = 'F'
          r[19][86] = 'F'
          r[13][102] = 'C'
          r[19][130] = 'l'
          r[19][136] = 'E'
        },
      ),
  },
  {
    id: 'harbor',
    name: 'Liman',
    desc: 'Tahta köprüler, taş sıraları ve rıhtım fenerleri: suyun üstünden bir liman yolu.',
    make: () =>
      composed(
        120,
        [['plankBridge', 22], ['stoneRow', 44], ['plankBridge', 74], ['lampRow', 4]],
        (r) => {
          r[19][2] = 'P'
          r[19][40] = 'F'
          r[17][50] = 'C'
          r[19][70] = 'F'
          r[19][100] = 'b'
          r[19][116] = 'E'
        },
      ),
  },
  {
    id: 'fortress',
    name: 'Kale Surları',
    desc: 'Surlara çıkan basamaklı kuleler, kilitli kapı ve anahtar; kapının ardında çıkış.',
    make: () =>
      composed(
        130,
        [['pyramid', 16], ['keyDoor', 62], ['pyramid', 84], ['stoneHouse', 108]],
        (r) => {
          r[19][2] = 'P'
          r[19][8] = 'l'
          r[13][26] = 'C'
          r[19][40] = 'F'
          r[19][80] = 'F'
          r[13][94] = 'C'
          r[19][126] = 'E'
        },
      ),
  },
  {
    id: 'bazaar',
    name: 'Çarşı',
    desc: 'Meydanda tabela ve şehir insanları, taş kemer ve kaya tüneli: sakin bir çarşı yolu.',
    make: () =>
      composed(
        110,
        [['plaza', 6], ['lampRow', 26], ['stoneHouse', 44], ['secretTunnel', 60], ['plaza', 80]],
        (r) => {
          r[19][2] = 'P'
          r[19][40] = 'F'
          r[19][76] = 'F'
          r[19][106] = 'E'
        },
      ),
  },
  {
    id: 'snow',
    name: 'Kar Yolu',
    desc: 'Kayan buz zemin, diken tarlası ve buz basamakları: yavaş ve dikkatli yürü.',
    make: () => {
      const r = flat(120, 20).map((row, y) => (y === 20 ? row.map((_, x) => (x < 100 ? 'I' : '#')) : row))
      let g = r
      g = stampAt(g, 'thornField', 24, 19)
      g = stampAt(g, 'iceSteps', 46, 19)
      g = stampAt(g, 'thornField', 72, 19)
      for (const x of [10, 34, 66, 96]) g[19][x] = 't'
      g[19][2] = 'P'
      g[19][40] = 'F'
      g[15][52] = 'C'
      g[19][82] = 'F'
      g[19][116] = 'E'
      return join(g)
    },
  },
  {
    id: 'canyon',
    name: 'Kanyon',
    desc: 'Vadiler, boşluklar ve çatlak taş köprüsü: zıplamayı sınayan sert bir kanyon.',
    make: () =>
      composed(
        130,
        [['valley', 16], ['gapHop', 34], ['crumbleBridge', 54], ['valley', 80], ['dashGap', 100]],
        (r) => {
          r[19][2] = 'P'
          r[19][30] = 'F'
          r[19][76] = 'F'
          r[19][124] = 'E'
        },
      ),
  },
  {
    id: 'training',
    name: 'Antrenman Pisti',
    desc: 'Her hamleyi öğreten kısa istasyonlar: basamak, boşluk, ritim, tokmak. Yeni başlayanlar için.',
    make: () =>
      composed(
        150,
        [['stairs', 14], ['gapHop', 34], ['rhythmDoor', 52], ['pit', 70], ['hammers', 84], ['pyramid', 104], ['plateBridge', 132]],
        (r) => {
          r[19][2] = 'P'
          r[19][10] = '?'
          r[19][46] = 'F'
          r[19][80] = 'F'
          r[19][120] = 'F'
          r[13][114] = 'C'
          r[19][146] = 'E'
        },
      ),
  },
)

/** Kuşbakışı renkleri (galeri küçük resmi ve düzenleyicinin harita şeridi): karo başına tek renk, şehrin paletinden. */
export function thumbColors(p: CityStyle): Record<string, string> {
  const gold = '#ffcc66'
  const red = '#e30a17'
  const enemy = '#ff6b6b'
  return {
    '#': p.tile, X: p.tileDark, '>': p.tileDark, '<': p.tileDark, i: p.tileLight, '=': p.plank, '~': p.water[0], I: p.water[2],
    '^': p.spike[0], v: p.spike[0], S: p.accent, C: gold, F: red, E: gold, P: '#f3f1ff', e: enemy, f: enemy, h: enemy, c: enemy,
    u: enemy, x: enemy, j: enemy, W: '#3fa9b8', L: '#c49a5a', R: '#8f96a3', $: gold, '!': '#4aa8ff', K: gold, D: p.plank,
    '%': p.tileLight, '*': '#9fd8ff', T: '#ff9a3c', '{': '#ff9a7a', '}': '#5ad6c6', p: p.plank, _: p.accent, '[': '#4a7bd8', ']': '#e0b030', M: p.plank, N: p.plank, B: red,
    Y: p.tileDark,
  }
}

/**
 * Haritayı bozmayan ama oyuncuyu üzebilecek durumlar (uyarı; kodlamayı engellemez). Metin Türkçe şablon, arayüz t() ile
 * çevirir; `x` uyarının sütunu (düzenleyici oraya kaydırır).
 */
export interface MapNote {
  text: string
  vars?: Record<string, string | number>
  x: number
  /** sorunun satırı (biliniyorsa): düzenleyici ızgarada oraya işaret koyar */
  y?: number
}

/** üstünde durulan karolar (çözücünün katı saydıkları ve platformlar) */
const STAND = new Set('#=IiX[]DG><{}pMNWS_'.split(''))
const DEADLY = new Set(['~', '^'])

/** (x, y) noktasından aşağı düşen oyuncu güvenli bir yere mi iner? */
function landsSafely(map: string[], x: number, y: number): boolean {
  for (let yy = y + 1; yy < ROWS; yy++) {
    const ch = map[yy][x]
    if (DEADLY.has(ch)) return false
    if (STAND.has(ch)) return true
  }
  return false
}

export function mapNotes(map: string[]): MapNote[] {
  const notes: MapNote[] = []
  const w = map[0]?.length ?? 0
  const find = (ch: string) => {
    const out: Array<{ x: number; y: number }> = []
    map.forEach((row, y) => {
      for (let x = row.indexOf(ch); x >= 0; x = row.indexOf(ch, x + 1)) out.push({ x, y })
    })
    return out
  }
  const [p] = find('P')
  const [e] = find('E')
  if (p && !landsSafely(map, p.x, p.y)) notes.push({ text: 'Başlangıcın altında güvenli zemin yok: oyuncu doğar doğmaz düşer.', x: p.x, y: p.y })
  if (e && !landsSafely(map, e.x, e.y)) notes.push({ text: 'Çıkışın altında zemin yok: kapıya havada varılabilir mi, bir bak.', x: e.x, y: e.y })
  // bayraklar arası en çok 75 karo (CLAUDE.md: her yaştan oyuncu)
  const stops = [...(p ? [p.x] : []), ...find('F').map((f) => f.x), ...(e ? [e.x] : [])].sort((a, b) => a - b)
  for (let i = 1; i < stops.length; i++) {
    const gap = stops[i] - stops[i - 1]
    if (gap > 75) notes.push({ text: 'Bayraklar arası {n} karo: 75’ten uzun yolda düşen oyuncu çok geriden başlar. Araya bayrak koy.', vars: { n: gap }, x: stops[i - 1] + 75 })
  }
  const [q] = find('Q')
  if (q && !find('G').length) notes.push({ text: 'Boss var ama boss kapısı (G) yok: çıkışa boss’u yenmeden de gidilebilir.', x: q.x, y: q.y })
  const [plate] = find('_')
  if (plate && !find('[').length && !find(']').length) notes.push({ text: 'Plaka var ama değiştireceği blok ([ ya da ]) yok.', x: plate.x, y: plate.y })
  // teleferik halatının iki ucunda bırakınca düz aşağı inilir: altı güvenli zemin olsun
  map.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      if (row[x] !== 'R' || row[x - 1] === 'R') continue
      let end = x
      while (row[end + 1] === 'R') end++
      for (const ex of new Set([x, end])) if (!landsSafely(map, ex, y)) notes.push({ text: 'Teleferik halatının ucunun altı boş ya da tehlikeli: bırakan oyuncu düşer.', x: ex, y })
      x = end
    }
  })
  return notes.sort((a, b) => a.x - b.x)
}
