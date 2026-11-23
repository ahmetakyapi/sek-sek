/**
 * Görünüm özelleştirmesi (Mağaza): iki yolcunun (Uktun, Memo) her biri için saç stili ve rengi, ten, kıyafet rengi ve deseni,
 * göz rengi, yüz ifadesi, bekleme duruşu ve koşu tarzı. Hepsi yolcu başına kayıtlıdır (`save.looks[yolcu]`, `LookPrefs`);
 * kayıtta yoksa (ya da 'ozgun' / 'duz' ise) yolcunun kendi görünümü çizilir: eski kayıt bozulmaz.
 * Burası saf veridir (çizim yok): seçenekler, fiyatlar, sahiplik ve renk türetme. Çizimi heroDraw.ts (oyun, duruş)
 * ve portraitDraw.ts (portre); saç parçaları hairDraw.ts.
 * Sahiplik `owned['uktun:hs:topuz']` (ücretli seçenek); ücretsiz seçenekler herkesin. Fiyatlar parçayla ödenir (accessories.ts walletOf).
 */
import type { Hero } from './accessories'

/** kayıttaki seçimler: ekseni anlatan kısa anahtar → seçenek kimliği. Boş anahtar = yolcunun kendi görünümü */
export interface LookPrefs {
  /** saç stili */
  hs?: string
  /** saç rengi */
  hc?: string
  /** ten tonu */
  sk?: string
  /** kıyafet rengi */
  oc?: string
  /** kıyafet deseni */
  op?: string
  /** göz rengi */
  ey?: string
  /** yüz ifadesi */
  ex?: string
  /** bekleme duruşu */
  st?: string
  /** koşu tarzı */
  rs?: string
}
export type Axis = keyof LookPrefs
export const AXES: readonly Axis[] = ['hs', 'hc', 'sk', 'oc', 'op', 'ey', 'ex', 'st', 'rs']

export interface LookOption {
  id: string
  name: string
  nameEn: string
  /** parça; 0 ücretsiz */
  price: number
  /** yalnız bu yolcunun dolabında */
  for?: Hero
  /** seçici kutucuktaki renk (varsa) */
  swatch?: string
}

export interface AxisDef {
  id: Axis
  name: string
  nameEn: string
  /** kayıtta boş bırakılan (yolcunun kendi) seçenek */
  base: string
  options: LookOption[]
}

/** ── saç ───────────────────────────────────────────────────────────────────────────── */
/** ön saç biçimleri: fringe (Uktun'un taranmış perçemi), quiff (Memo'nun kabarığı), short, curly, buzz, messy (dağınık kısa), side (yan tarama) */
export type Front = 'fringe' | 'quiff' | 'short' | 'curly' | 'buzz' | 'messy' | 'side'
/** arka saç: omuza dökülen (long), at kuyruğu (tail), tepe topuzu (bun), örgü (braid), kısa kare (bob), iki yandan örgü (pigtails) */
export type Back = 'none' | 'long' | 'tail' | 'bun' | 'braid' | 'bob' | 'pigtails'
export interface HairStyle {
  /** boşsa yolcunun kendi ön saçı */
  front?: Front
  back: Back
}
export const HAIR_STYLES: Record<string, HairStyle> = {
  ozgun: { back: 'none' },
  kisa: { front: 'short', back: 'none' },
  kazima: { front: 'buzz', back: 'none' },
  kivirci: { front: 'curly', back: 'none' },
  at: { back: 'tail' },
  topuz: { back: 'bun' },
  orgu: { back: 'braid' },
  bob: { back: 'bob' },
  uzun: { back: 'long' },
  ikiorgu: { back: 'pigtails' },
  daginik: { front: 'messy', back: 'none' },
  yantarama: { front: 'side', back: 'none' },
}
/** yolcunun kendi saçı: Uktun'da omuza dökülen perçemli saç, Memo'da kabarık kısa saç */
export const OWN_HAIR: Record<Hero, { front: Front; back: Back }> = { uktun: { front: 'fringe', back: 'long' }, memo: { front: 'quiff', back: 'none' } }

/** saç rengi: tabanın gölgesi ve ışığı türetilir (`shade` / `light`) */
export const HAIR_COLORS: Record<string, string> = {
  siyah: '#2a2226',
  kestane: '#6a3a24',
  kumral: '#a07040',
  sari: '#dcb45c',
  kizil: '#c0501e',
  gumus: '#cfd0d8',
  pembe: '#e47aa8',
  mavi: '#4a78d8',
  nane: '#4fbf9a',
  bal: '#c8883a',
  bordo: '#7a2436',
  lila: '#a68ad8',
  platin: '#ece4cc',
}

export interface Tone {
  skin: string
  skinS: string
  blush: string
}
export const SKIN_TONES: Record<string, Tone> = {
  porselen: { skin: '#fde3cf', skinS: '#eab9a0', blush: 'rgba(240,120,120,0.4)' },
  acik: { skin: '#f6c9a4', skinS: '#dc9f7e', blush: 'rgba(235,115,105,0.42)' },
  bugday: { skin: '#e2ad84', skinS: '#c08460', blush: 'rgba(200,110,90,0.32)' },
  bal: { skin: '#c68a5e', skinS: '#a46a44', blush: 'rgba(190,90,70,0.32)' },
  esmer: { skin: '#9c6440', skinS: '#7c4a2c', blush: 'rgba(170,70,60,0.32)' },
  abanoz: { skin: '#6a4230', skinS: '#4a2c1e', blush: 'rgba(160,70,70,0.34)' },
}

export const OUTFIT_COLORS: Record<string, string> = {
  kirmizi: '#d8453c',
  turuncu: '#ec8a3a',
  hardal: '#e8b832',
  yesil: '#4fa862',
  turkuaz: '#2fb3c0',
  mavi: '#4a6ed0',
  mor: '#8a58c4',
  pembe: '#e87aa6',
  antrasit: '#4a4c5e',
  krem: '#e8dcc0',
  bordo: '#8e2c3e',
  lacivert: '#2e3c74',
  zeytin: '#7a8a3e',
  lila: '#b49ad8',
}

export const EYE_COLORS: Record<string, string> = {
  kahve: '#6a3a1e',
  ela: '#a8742c',
  yesil: '#4f9a5a',
  mavi: '#4a82c8',
  gri: '#7a8898',
  mor: '#8a5ac0',
  altin: '#d8a830',
  bal: '#b8782a',
  turkuaz: '#2aa8b4',
  kehribar: '#d4862a',
}

/** ifade: göz açıklığı (lid), bakış, ağız ve kaşın ruh hâli */
export type Expr = 'ozgun' | 'neseli' | 'uykulu' | 'saskin' | 'kurnaz' | 'sevecen' | 'kahkaha' | 'utangac'
export const EXPRESSIONS: readonly Expr[] = ['ozgun', 'neseli', 'uykulu', 'saskin', 'kurnaz', 'sevecen', 'kahkaha', 'utangac']

export type Pattern = 'duz' | 'cizgili' | 'ekose' | 'yildiz' | 'puantiyeli' | 'zigzag' | 'cini' | 'kareli' | 'dalga'

/** bekleme duruşu: taban poz ve ara sıra yapılan küçük hareketler (yalnız dururken; sıra `idleMove`te) */
export type IdleMove = 'bak' | 'tik' | 'esne' | 'sal' | 'sek'
export interface StanceDef {
  base: 'rahat' | 'bel' | 'bagli' | 'cep' | 'cene'
  /** hareketsiz kalınca sırayla yapılanlar */
  moves: readonly IdleMove[]
}
export const STANCES: Record<string, StanceDef> = {
  rahat: { base: 'rahat', moves: ['bak', 'tik', 'sal', 'esne'] },
  bel: { base: 'bel', moves: ['bak', 'tik'] },
  bagli: { base: 'bagli', moves: ['tik', 'bak'] },
  cep: { base: 'cep', moves: ['tik', 'esne'] },
  bakinir: { base: 'rahat', moves: ['bak', 'bak', 'tik'] },
  esner: { base: 'rahat', moves: ['esne', 'esne', 'tik'] },
  dusunur: { base: 'cene', moves: ['bak', 'tik'] },
  sekip: { base: 'rahat', moves: ['sek', 'sal', 'sek', 'bak'] },
}

/** koşu tarzı: adım, diz, kol ve gövde ayarları (heroDraw `gaitInto`) */
export const RUN_STYLES = ['normal', 'sportif', 'tirisa', 'omuz', 'ninja'] as const
export type RunStyle = (typeof RUN_STYLES)[number]

const opt = (id: string, name: string, nameEn: string, price = 0, extra: Partial<LookOption> = {}): LookOption => ({ id, name, nameEn, price, ...extra })

/** eksenler ve seçenekler (sıra: seçicide görünen sıra) */
export const LOOK_AXES: AxisDef[] = [
  {
    id: 'hs',
    name: 'Saç Stili',
    nameEn: 'Hairstyle',
    base: 'ozgun',
    options: [
      opt('ozgun', 'Kendi Saçı', 'Signature'),
      opt('kisa', 'Kısa Kesim', 'Short Crop'),
      opt('at', 'At Kuyruğu', 'Ponytail', 3),
      opt('bob', 'Küt Kesim', 'Bob', 3, { for: 'uktun' }),
      opt('kivirci', 'Kıvırcık', 'Curly', 4),
      opt('topuz', 'Topuz', 'Bun', 4),
      opt('orgu', 'Örgü', 'Braid', 5, { for: 'uktun' }),
      opt('kazima', 'Kazıma', 'Buzz Cut', 2, { for: 'memo' }),
      opt('uzun', 'Omuz Saçı', 'Shoulder-Length', 5, { for: 'memo' }),
      opt('daginik', 'Dağınık Kısa', 'Messy Crop', 3),
      opt('ikiorgu', 'İki Yandan Örgü', 'Twin Braids', 5, { for: 'uktun' }),
      opt('yantarama', 'Yan Tarama', 'Side Part', 4, { for: 'memo' }),
    ],
  },
  {
    id: 'hc',
    name: 'Saç Rengi',
    nameEn: 'Hair Color',
    base: 'ozgun',
    options: [
      opt('ozgun', 'Kendi Rengi', 'Natural'),
      opt('siyah', 'Siyah', 'Black'),
      opt('kestane', 'Kestane', 'Chestnut'),
      opt('kumral', 'Kumral', 'Light Brown'),
      opt('sari', 'Sarı', 'Blonde'),
      opt('kizil', 'Kızıl', 'Copper'),
      opt('gumus', 'Gümüş', 'Silver', 2),
      opt('pembe', 'Pembe', 'Pink', 3),
      opt('mavi', 'Mavi', 'Blue', 3),
      opt('nane', 'Nane', 'Mint', 3),
      opt('bal', 'Bal', 'Honey'),
      opt('bordo', 'Bordo', 'Burgundy', 2),
      opt('lila', 'Lila', 'Lilac', 3),
      opt('platin', 'Platin', 'Platinum', 3),
    ].map((o) => (HAIR_COLORS[o.id] ? { ...o, swatch: HAIR_COLORS[o.id] } : o)),
  },
  {
    id: 'sk',
    name: 'Ten Tonu',
    nameEn: 'Skin Tone',
    base: 'ozgun',
    options: [opt('ozgun', 'Kendi Teni', 'Natural'), ...Object.keys(SKIN_TONES).map((k, i) => opt(k, ['Porselen', 'Açık', 'Buğday', 'Bal', 'Esmer', 'Abanoz'][i], ['Porcelain', 'Light', 'Wheat', 'Honey', 'Tan', 'Ebony'][i], 0, { swatch: SKIN_TONES[k].skin }))],
  },
  {
    id: 'oc',
    name: 'Kıyafet Rengi',
    nameEn: 'Outfit Color',
    base: 'ozgun',
    options: [
      opt('ozgun', 'Kendi Rengi', 'Original'),
      ...Object.keys(OUTFIT_COLORS).map((k, i) =>
        opt(k, ['Kırmızı', 'Turuncu', 'Hardal', 'Yeşil', 'Turkuaz', 'Mavi', 'Mor', 'Pembe', 'Antrasit', 'Krem', 'Bordo', 'Lacivert', 'Zeytin', 'Lila'][i], ['Red', 'Orange', 'Mustard', 'Green', 'Teal', 'Blue', 'Purple', 'Pink', 'Charcoal', 'Cream', 'Burgundy', 'Navy', 'Olive', 'Lilac'][i], 0, { swatch: OUTFIT_COLORS[k] }),
      ),
    ],
  },
  {
    id: 'op',
    name: 'Kıyafet Deseni',
    nameEn: 'Outfit Pattern',
    base: 'duz',
    options: [opt('duz', 'Düz', 'Plain'), opt('cizgili', 'Çizgili', 'Striped'), opt('puantiyeli', 'Puantiyeli', 'Polka Dot', 2), opt('ekose', 'Ekose', 'Plaid', 3), opt('yildiz', 'Yıldızlı', 'Starry', 4), opt('zigzag', 'Zigzag', 'Zigzag', 4), opt('kareli', 'Kareli', 'Checkered', 3), opt('dalga', 'Dalga', 'Waves', 3), opt('cini', 'Çini', 'Tile Motif', 5)],
  },
  {
    id: 'ey',
    name: 'Göz Rengi',
    nameEn: 'Eye Color',
    base: 'ozgun',
    options: [
      opt('ozgun', 'Kendi Gözü', 'Natural'),
      ...Object.keys(EYE_COLORS).map((k, i) => opt(k, ['Kahve', 'Ela', 'Yeşil', 'Mavi', 'Gri', 'Mor', 'Altın', 'Bal', 'Turkuaz', 'Kehribar'][i], ['Brown', 'Hazel', 'Green', 'Blue', 'Gray', 'Violet', 'Gold', 'Honey', 'Turquoise', 'Amber'][i], k === 'mor' || k === 'altin' || k === 'turkuaz' || k === 'kehribar' ? 2 : 0, { swatch: EYE_COLORS[k] })),
    ],
  },
  {
    id: 'ex',
    name: 'Yüz İfadesi',
    nameEn: 'Expression',
    base: 'ozgun',
    options: [opt('ozgun', 'Her Zamanki', 'Usual'), opt('neseli', 'Neşeli', 'Cheerful'), opt('uykulu', 'Uykulu', 'Sleepy'), opt('saskin', 'Şaşkın', 'Surprised', 2), opt('kurnaz', 'Kurnaz', 'Sly', 2), opt('sevecen', 'Sevecen', 'Gentle', 2), opt('kahkaha', 'Kahkaha', 'Laughing', 2), opt('utangac', 'Utangaç', 'Shy', 2)],
  },
  {
    id: 'st',
    name: 'Bekleme Duruşu',
    nameEn: 'Idle Stance',
    base: 'rahat',
    options: [opt('rahat', 'Rahat', 'Relaxed'), opt('bel', 'Eller Belde', 'Hands on Hips'), opt('bagli', 'Kollar Bağlı', 'Arms Crossed', 3), opt('cep', 'Eller Cepte', 'Hands in Pockets', 3), opt('bakinir', 'Etrafa Bakınır', 'Looks Around', 3), opt('esner', 'Esneyip Durur', 'Stretches', 4), opt('dusunur', 'Düşünceli', 'Thinker', 3), opt('sekip', 'Sek Sek', 'Hopscotch', 4)],
  },
  {
    id: 'rs',
    name: 'Koşu Tarzı',
    nameEn: 'Run Style',
    base: 'normal',
    options: [opt('normal', 'Normal', 'Normal'), opt('sportif', 'Sportif', 'Sporty', 3), opt('tirisa', 'Tırıs', 'Trot', 3), opt('omuz', 'Tek Omuz', 'One Shoulder', 4), opt('ninja', 'Ninja Koşusu', 'Ninja Run', 4)],
  },
]

export const axisDef = (id: Axis) => LOOK_AXES.find((a) => a.id === id)!

/** yolcunun görebildiği seçenekler (yolcuya özgü olanlar yalnız onun listesinde) */
export const optionsFor = (hero: Hero, axis: Axis) => axisDef(axis).options.filter((o) => !o.for || o.for === hero)

/** sahiplik anahtarı: ücretli seçenek yolcuya özgü alınır ("uktun:hs:topuz") */
export const lookKey = (hero: Hero, axis: Axis, id: string) => `${hero}:${axis}:${id}`
export const hasLook = (owned: Record<string, boolean> | undefined, hero: Hero, axis: Axis, o: LookOption) => o.price === 0 || !!owned?.[lookKey(hero, axis, o.id)]

/** yolcunun dolabındaki ücretli seçeneklerin toplamı (cüzdan hesabı ve fiyat dengesi) */
export const lookPrice = (hero: Hero, owned?: Record<string, boolean>) => {
  let sum = 0
  for (const a of LOOK_AXES) for (const o of optionsFor(hero, a.id)) if (o.price > 0 && (!owned || owned[lookKey(hero, a.id, o.id)])) sum += o.price
  return sum
}

/** kayıttan gelen seçimleri doğrular: bilinmeyen ya da yolcuya uymayan seçim düşer (yolcunun kendi değeri açıkça yazılabilir: bulut birleşmesinde eski seçimi ezer) */
export function normalizeLook(hero: Hero, raw: unknown): LookPrefs | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: LookPrefs = {}
  for (const a of AXES) {
    const v = (raw as Record<string, unknown>)[a]
    if (typeof v !== 'string') continue
    if (optionsFor(hero, a).some((o) => o.id === v)) out[a] = v
  }
  if (!Object.keys(out).length) return undefined
  // aynı içerik aynı nesne: çizim önbelleği kimlikle eşleşir
  const key = hero + '|' + AXES.map((a) => out[a] ?? '').join('.')
  let got = pool.get(key)
  if (!got) pool.set(key, (got = Object.freeze(out)))
  return got
}
const pool = new Map<string, LookPrefs>()

/** seçimin kısa imzası (eşitlik anahtarı): yolcunun kendi değeri ile boş seçim aynı sayılır; hiçbiri yoksa '' */
export const lookKeyOf = (p?: LookPrefs) => {
  if (!p) return ''
  const k = AXES.map((a) => (p[a] && p[a] !== axisDef(a).base ? p[a] : '')).join('.')
  return /^\.*$/.test(k) ? '' : k
}

/** ── renk türetme ──────────────────────────────────────────────────────────────────── */
const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
/** koyulaştır: k 0..1 (1 = aynı) */
export const shade = (c: string, k = 0.68) => {
  const [r, g, b] = hex(c)
  return toHex(r * k * 0.98, g * k * 0.94, b * k * 1.04)
}
/** açıklaştır: k 0..1 (beyaza doğru) */
export const light = (c: string, k = 0.3) => {
  const [r, g, b] = hex(c)
  return toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k * 0.9)
}
/** algısal parlaklık 0..1 */
export const lum = (c: string) => {
  const [r, g, b] = hex(c)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
