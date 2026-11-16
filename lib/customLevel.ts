/**
 * Özel harita (Bölüm Düzenleyici): kısıtlı lejantla 24 satırlık harita, URL'de taşınan kısa kod ve oyunun okuyacağı LevelDef.
 * DOM'suz: tarayıcıda, Node'da ve Web Worker'da aynı çalışır (tests/customLevel.test.ts).
 *
 * Kod biçimi, base64url içinde baytlar:
 *   [sürüm][şehir sırası][genişlik yüksek][genişlik düşük][denetim] + satır satır birleşik haritanın RLE'si.
 *   Sürüm 1: her koşu üst 5 bit simge sırası, alt 3 bit (uzunluk - 1); 7 ise ardından (uzunluk - 8) varint olarak gelir.
 *            Yalnız ilk 25 simge ve en çok 320 sütun; böyle bir harita bugün de sürüm 1 ile kodlanır (eski bağlantılar ve
 *            yayındaki topluluk haritaları aynı kodu korur, yinelenen yayın yakalanır).
 *   Sürüm 2: her koşu üst 6 bit simge sırası (64 simgeye yer), alt 2 bit (uzunluk - 1); 3 ise ardından (uzunluk - 4) varint.
 *   Sürüm 3: sürüm 2 + haritanın ardından metin bölümü: tabela (?) ve şehir insanı (n) metinleri, UTF-8 JSON
 *            `{ s: string[], n: [ad, söz, kılık][] }` (soldan sağa haritadaki sırayla). Metinsiz harita sürüm 1/2 kalır.
 * Simge ve şehir sıraları kalıcıdır: yeni simge ya da şehir yalnız listenin SONUNA eklenir, yoksa eski kodlar bozulur.
 */
import { LEVELS } from '@/game/levels'
import type { CityKey, LevelDef, Npc } from '@/game/types'
import { isRude } from './communityMaps'

export const ROWS = 24
export const MIN_W = 40
export const MAX_W = 600
/** facts üç kart: daha fazla hatıranın bilgi kartı olmaz */
export const MAX_ITEMS = 3
/** sandık çözücünün durum sayısını katlar (CLAUDE.md: şehir başına en çok iki) */
export const MAX_CRATES = 2
/** yalnız bir tane olabilen simgeler: yenisi konunca düzenleyici eskisini kaldırır */
export const SINGLES = ['P', 'E', '$', '!', 'K'] as const

/**
 * İzinli simgeler; sıra kodun parçasıdır (boşluk 0). Süsler sim.ts'te yalnız çizilen, oyunu etkilemeyenlerdir.
 * İlk 25'i sürüm 1'in simgeleri; ardından gelenler (pul, nazar, anahtar ve kapı, sahte duvar, dash halkası, sandık, plaka ve
 * renkli bloklar, raylı platformlar ve ray sonları, balon, tokmak, düşmanlar) yalnız sürüm 2 kodda bulunur.
 */
export const SYMBOLS = [
  ' ', '#', '=', '^', 'v', 'I', 'i', 'X', '~', 'S', 'F', 'C', 'e', 'f', '>', '<', 'P', 'E', 't', 'l', 'w', 'b', 'L', 'R', 'W',
  '$', '!', 'K', 'D', '%', '*', 'p', '_', '[', ']', 'M', 'N', '|', ':', 'B', 'Y', 'h', 'c', 'u', 'x', 'j',
  'T', '?', 'n', 'O', '{', '}', 'Q', 'G',
] as const
export type Sym = (typeof SYMBOLS)[number]

/** Özel haritanın yazılı metinleri: tabelalar ve şehir insanları, haritadaki soldan sağa sırayla */
export interface CustomTexts {
  signs: string[]
  npcs: { name: string; text: string; look: Npc['look'] }[]
  /** haritadaki boss'un (Q) hangi şehrin boss'u olduğu; yoksa seçilen şehrinki */
  boss?: CityKey
}
export const MAX_SIGNS = 8
export const MAX_NPCS = 4
export const SIGN_MAX = 140
export const NPC_NAME_MAX = 24
export const NPC_TEXT_MAX = 160
export const NPC_LOOKS: Npc['look'][] = ['amca', 'teyze', 'usta', 'genc', 'coban', 'ozan']
export const emptyTexts = (): CustomTexts => ({ signs: [], npcs: [] })

/** Metinlerdeki ilk sorun (uzunluk, kaba söz); yoksa null */
export function textProblem(t: CustomTexts): string | null {
  if (t.signs.length > MAX_SIGNS) return 'En çok sekiz tabela konabilir.'
  if (t.npcs.length > MAX_NPCS) return 'En çok dört şehir insanı konabilir.'
  if (t.signs.some((s) => s.length > SIGN_MAX)) return 'Tabela yazısı en çok 140 karakter olabilir.'
  if (t.npcs.some((n) => n.name.length > NPC_NAME_MAX || n.text.length > NPC_TEXT_MAX)) return 'Kişinin adı en çok 24, sözü en çok 160 karakter olabilir.'
  if ([...t.signs, ...t.npcs.flatMap((n) => [n.name, n.text])].some((s) => isRude(s))) return 'Metinlerden biri yayınlanamaz; başka bir söz dene.'
  return null
}

const hasTexts = (t?: CustomTexts) => !!t && (!!t.boss || t.signs.some((s) => s.trim()) || t.npcs.some((n) => n.name.trim() || n.text.trim()))

/** Kodda şehrin sırası; kalıcı (yeni şehir sona). */
export const CITY_CODES = [
  'istanbul', 'edirne', 'kocaeli', 'bursa', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir',
  'adana', 'gaziantep', 'sanliurfa', 'diyarbakir', 'mardin', 'malatya', 'corum', 'sinop', 'ordu', 'trabzon',
  'sivas', 'van', 'erzurum', 'kayseri', 'hatay', 'eskisehir', 'ardahan', 'amasya', 'mugla', 'bayburt',
  'rize', 'artvin', 'kars', 'bitlis', 'agri', 'giresun', 'tokat', 'denizli',
] as const satisfies readonly CityKey[]

const V1_SYMBOLS = 25
const V1_MAX_W = 320
const SYM_INDEX = new Map<string, number>(SYMBOLS.map((s, i) => [s, i]))

/** Haritadaki ilk sorunu Türkçe döndürür (arayüz t() ile çevirir); sorun yoksa null. */
export function validateMap(map: string[]): string | null {
  if (map.length !== ROWS) return 'Harita 24 satır olmalı.'
  const w = map[0].length
  if (map.some((r) => r.length !== w)) return 'Satırların uzunluğu eşit değil.'
  if (w < MIN_W || w > MAX_W) return 'Genişlik 40 ile 600 sütun arasında olmalı.'
  const n: Record<string, number> = {}
  for (const row of map)
    for (const ch of row) {
      if (!SYM_INDEX.has(ch)) return 'Haritada izin verilmeyen bir karo var.'
      n[ch] = (n[ch] ?? 0) + 1
    }
  const count = (ch: string) => n[ch] ?? 0
  if (count('P') !== 1) return count('P') ? 'Haritada yalnız bir başlangıç (P) olabilir.' : 'Başlangıç (P) eksik.'
  if (count('E') !== 1) return count('E') ? 'Haritada yalnız bir çıkış (E) olabilir.' : 'Çıkış (E) eksik.'
  if (count('C') > MAX_ITEMS) return 'En çok üç hatıra (C) konabilir.'
  if (count('$') > 1) return 'Haritada yalnız bir gizli pul olabilir.'
  if (count('!') > 1) return 'Haritada yalnız bir nazar boncuğu olabilir.'
  if (count('K') > 1) return 'Haritada yalnız bir anahtar olabilir.'
  if (count('D') && !count('K')) return 'Kilitli kapı var ama anahtar yok.'
  if (count('p') > MAX_CRATES) return 'En çok iki sandık konabilir.'
  if ((count('[') || count(']')) && !count('_')) return 'Renkli bloklar var ama onları değiştirecek plaka yok.'
  if (count('?') > MAX_SIGNS) return 'En çok sekiz tabela konabilir.'
  if (count('n') > MAX_NPCS) return 'En çok dört şehir insanı konabilir.'
  if (count('Q') > 1) return 'Haritada yalnız bir boss olabilir.'
  if (count('G') && !count('Q')) return 'Boss kapısı var ama boss yok.'
  return null
}

function toB64url(bytes: number[]): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(code: string): number[] | null {
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null
  try {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
    return Array.from(bin, (ch) => ch.charCodeAt(0))
  } catch {
    return null
  }
}

const checksum = (bytes: number[]) => bytes.reduce((a, b) => (a * 31 + b) % 251, 7)

/** Haritayı kısa, URL'de güvenli koda çevirir. Geçersiz haritada hata atar (önce validateMap). */
export function encodeMap(map: string[], city: CityKey, texts?: CustomTexts): string {
  const problem = validateMap(map) ?? (texts ? textProblem(texts) : null)
  if (problem) throw new Error(problem)
  const withText = hasTexts(texts)
  const ci = CITY_CODES.indexOf(city as (typeof CITY_CODES)[number])
  if (ci < 0) throw new Error(`bilinmeyen şehir: ${city}`)
  const flat = map.join('')
  const w = map[0].length
  // sürüm 1'e sığan harita sürüm 1 kalır: aynı harita her zaman aynı kod (yayında yinelenen harita yakalanır)
  const v1 = !withText && w <= V1_MAX_W && Array.from(flat).every((ch) => SYM_INDEX.get(ch)! < V1_SYMBOLS)
  const lenBits = v1 ? 3 : 2
  const short = (1 << lenBits) - 1
  const body: number[] = []
  for (let i = 0; i < flat.length; ) {
    let j = i + 1
    while (j < flat.length && flat[j] === flat[i]) j++
    const sym = SYM_INDEX.get(flat[i])!
    const run = j - i
    if (run <= short) body.push((sym << lenBits) | (run - 1))
    else {
      body.push((sym << lenBits) | short)
      let rest = run - short - 1
      while (rest >= 0x80) {
        body.push((rest & 0x7f) | 0x80)
        rest >>= 7
      }
      body.push(rest)
    }
    i = j
  }
  if (withText) {
    const json = JSON.stringify({ s: texts!.signs.map((s) => s.trim()), n: texts!.npcs.map((n) => [n.name.trim(), n.text.trim(), n.look]), ...(texts!.boss ? { b: texts!.boss } : {}) })
    body.push(...new TextEncoder().encode(json))
  }
  return toB64url([v1 ? 1 : withText ? 3 : 2, ci, w >> 8, w & 0xff, checksum(body), ...body])
}

/** Kodu haritaya çevirir; bozuk kod, boyut, yasak karakter ve P/E sayısı denetlenir. */
export function decodeMap(code: string): { map: string[]; city: CityKey; texts: CustomTexts } | { error: string } {
  const bytes = fromB64url(code.trim())
  if (!bytes || bytes.length < 6) return { error: 'Harita kodu bozuk.' }
  const [ver, ci, wh, wl, sum] = bytes
  if (ver !== 1 && ver !== 2 && ver !== 3) return { error: 'Harita kodu bu sürümde açılamıyor.' }
  const city = CITY_CODES[ci]
  if (!city) return { error: 'Harita kodu bozuk.' }
  const w = (wh << 8) | wl
  if (w < MIN_W || w > (ver === 1 ? V1_MAX_W : MAX_W)) return { error: 'Genişlik 40 ile 600 sütun arasında olmalı.' }
  const lenBits = ver === 1 ? 3 : 2
  const short = (1 << lenBits) - 1
  const symCount = ver === 1 ? V1_SYMBOLS : SYMBOLS.length
  const body = bytes.slice(5)
  if (checksum(body) !== sum) return { error: 'Harita kodu bozuk.' }
  const total = w * ROWS
  let flat = ''
  let i = 0
  while (i < body.length && flat.length < total) {
    const b = body[i++]
    const si = b >> lenBits
    if (si >= symCount) return { error: 'Haritada izin verilmeyen bir karo var.' }
    const sym = SYMBOLS[si]
    let run = (b & short) + 1
    if (run === short + 1) {
      let rest = 0
      let shift = 0
      for (;;) {
        if (i >= body.length || shift > 21) return { error: 'Harita kodu bozuk.' }
        const v = body[i++]
        rest |= (v & 0x7f) << shift
        shift += 7
        if (!(v & 0x80)) break
      }
      run = short + 1 + rest
    }
    if (flat.length + run > total) return { error: 'Harita kodu bozuk.' }
    flat += sym.repeat(run)
  }
  if (flat.length !== total) return { error: 'Harita kodu bozuk.' }
  // sürüm 1 ve 2'de haritadan sonra bayt kalmaz; sürüm 3'te kalan baytlar metin bölümüdür
  let texts = emptyTexts()
  if (ver === 3) {
    try {
      const j = JSON.parse(new TextDecoder().decode(new Uint8Array(body.slice(i)))) as { s?: unknown; n?: unknown; b?: unknown }
      const str = (v: unknown) => (typeof v === 'string' ? v : '')
      texts = {
        signs: Array.isArray(j.s) ? j.s.map(str) : [],
        npcs: Array.isArray(j.n) ? j.n.map((x) => (Array.isArray(x) ? { name: str(x[0]), text: str(x[1]), look: NPC_LOOKS.includes(x[2]) ? x[2] : 'amca' } : { name: '', text: '', look: 'amca' as const })) : [],
        ...((CITY_CODES as readonly string[]).includes(str(j.b)) ? { boss: str(j.b) as CityKey } : {}),
      }
    } catch {
      return { error: 'Harita kodu bozuk.' }
    }
  } else if (i !== body.length) return { error: 'Harita kodu bozuk.' }
  const map = Array.from({ length: ROWS }, (_, r) => flat.slice(r * w, (r + 1) * w))
  const problem = validateMap(map) ?? textProblem(texts)
  return problem ? { error: problem } : { map, city, texts }
}

/** Madalya süreleri genişlikten: altın 0,12 · gümüş 0,18 · bronz 0,26 sn/sütun. */
export const customMedals = (w: number): [number, number, number] => [Math.round(w * 0.12), Math.round(w * 0.18), Math.round(w * 0.26)]

/** Özel haritayı oyunun okuyacağı bölüme çevirir: görünüm ve şehir metinleri seçilen şehirden, harita ve ad özel. */
export function customLevel(map: string[], city: CityKey, texts: CustomTexts = emptyTexts()): LevelDef {
  const base = LEVELS.find((l) => l.city === city) ?? LEVELS[0]
  return {
    id: 'ozel',
    city: base.city,
    name: 'Özel Harita',
    plate: base.plate,
    subtitle: base.name,
    difficulty: 'Orta',
    item: base.item,
    intro: base.intro,
    facts: base.facts,
    secret: base.secret,
    // yazar metin girmediyse tabela boş kalmasın: kısa bir yönerge
    hints: Array.from({ length: map.join('').split('?').length - 1 }, (_, k) => texts.signs[k]?.trim() || '…'),
    nickname: base.nickname,
    note: base.note,
    npcs: Array.from({ length: map.join('').split('n').length - 1 }, (_, k) => {
      const n = texts.npcs[k]
      return { name: n?.name.trim() || 'Yolcu', look: n?.look ?? 'amca', text: n?.text.trim() || '…' }
    }),
    medals: customMedals(map[0]?.length ?? MIN_W),
    bossOf: map.some((r) => r.includes('Q')) ? texts.boss : undefined,
    quips: base.quips,
    wind: undefined,
    finaleAt: undefined,
    map: [...map],
  }
}

/** Düzenleyici ilk açıldığında: 60 sütun, zemin, bir su çukuru, ince platformda hatıra, bayrak, diken ve çıkış. */
export const SAMPLE_MAP: string[] = (() => {
  const W = 60
  const rows = Array.from({ length: ROWS }, () => Array<string>(W).fill(' '))
  const put = (x: number, y: number, ch: string) => (rows[y][x] = ch)
  for (let y = 20; y < ROWS; y++) for (let x = 0; x < W; x++) put(x, y, '#')
  for (let y = 20; y < ROWS; y++) for (const x of [18, 19]) put(x, y, '~')
  for (let x = 28; x <= 32; x++) put(x, 18, '=')
  put(30, 16, 'C')
  put(24, 19, 'F')
  for (const x of [40, 41]) put(x, 19, '^')
  put(2, 19, 'P')
  put(7, 19, 't')
  put(36, 19, 'l')
  put(50, 19, 't')
  put(57, 19, 'E')
  return rows.map((r) => r.join(''))
})()
