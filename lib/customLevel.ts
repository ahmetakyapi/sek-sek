/**
 * Özel harita (Bölüm Düzenleyici): kısıtlı lejantla 24 satırlık harita, URL'de taşınan kısa kod ve oyunun okuyacağı LevelDef.
 * DOM'suz: tarayıcıda, Node'da ve Web Worker'da aynı çalışır (tests/customLevel.test.ts).
 *
 * Kod biçimi (sürüm 1), base64url içinde baytlar:
 *   [sürüm][şehir sırası][genişlik yüksek][genişlik düşük][denetim] + satır satır birleşik haritanın RLE'si.
 *   Her koşu: üst 5 bit simge sırası, alt 3 bit (uzunluk - 1); 7 ise ardından (uzunluk - 8) varint olarak gelir.
 * Simge ve şehir sıraları kalıcıdır: yeni simge ya da şehir yalnız listenin SONUNA eklenir, yoksa eski kodlar bozulur.
 */
import { LEVELS } from '@/game/levels'
import type { CityKey, LevelDef } from '@/game/types'

export const ROWS = 24
export const MIN_W = 40
export const MAX_W = 320
/** facts üç kart: daha fazla hatıranın bilgi kartı olmaz */
export const MAX_ITEMS = 3

/** İzinli simgeler; sıra kodun parçasıdır (boşluk 0). Süsler sim.ts'te yalnız çizilen, oyunu etkilemeyenlerdir. */
export const SYMBOLS = [' ', '#', '=', '^', 'v', 'I', 'i', 'X', '~', 'S', 'F', 'C', 'e', 'f', '>', '<', 'P', 'E', 't', 'l', 'w', 'b'] as const
export type Sym = (typeof SYMBOLS)[number]

/** Kodda şehrin sırası; kalıcı (yeni şehir sona). */
export const CITY_CODES = [
  'istanbul', 'edirne', 'kocaeli', 'bursa', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir',
  'adana', 'gaziantep', 'sanliurfa', 'diyarbakir', 'mardin', 'malatya', 'corum', 'sinop', 'ordu', 'trabzon',
  'sivas', 'van', 'erzurum', 'kayseri', 'hatay', 'eskisehir', 'ardahan', 'amasya', 'mugla', 'bayburt',
] as const satisfies readonly CityKey[]

const VERSION = 1
const SYM_INDEX = new Map<string, number>(SYMBOLS.map((s, i) => [s, i]))

/** Haritadaki ilk sorunu Türkçe döndürür (arayüz t() ile çevirir); sorun yoksa null. */
export function validateMap(map: string[]): string | null {
  if (map.length !== ROWS) return 'Harita 24 satır olmalı.'
  const w = map[0].length
  if (map.some((r) => r.length !== w)) return 'Satırların uzunluğu eşit değil.'
  if (w < MIN_W || w > MAX_W) return 'Genişlik 40 ile 320 sütun arasında olmalı.'
  let p = 0
  let e = 0
  let c = 0
  for (const row of map)
    for (const ch of row) {
      if (!SYM_INDEX.has(ch)) return 'Haritada izin verilmeyen bir karo var.'
      if (ch === 'P') p++
      else if (ch === 'E') e++
      else if (ch === 'C') c++
    }
  if (p !== 1) return p ? 'Haritada yalnız bir başlangıç (P) olabilir.' : 'Başlangıç (P) eksik.'
  if (e !== 1) return e ? 'Haritada yalnız bir çıkış (E) olabilir.' : 'Çıkış (E) eksik.'
  if (c > MAX_ITEMS) return 'En çok üç hatıra (C) konabilir.'
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
export function encodeMap(map: string[], city: CityKey): string {
  const problem = validateMap(map)
  if (problem) throw new Error(problem)
  const ci = CITY_CODES.indexOf(city as (typeof CITY_CODES)[number])
  if (ci < 0) throw new Error(`bilinmeyen şehir: ${city}`)
  const flat = map.join('')
  const body: number[] = []
  for (let i = 0; i < flat.length; ) {
    let j = i + 1
    while (j < flat.length && flat[j] === flat[i]) j++
    const sym = SYM_INDEX.get(flat[i])!
    const run = j - i
    if (run <= 7) body.push((sym << 3) | (run - 1))
    else {
      body.push((sym << 3) | 7)
      let rest = run - 8
      while (rest >= 0x80) {
        body.push((rest & 0x7f) | 0x80)
        rest >>= 7
      }
      body.push(rest)
    }
    i = j
  }
  const w = map[0].length
  return toB64url([VERSION, ci, w >> 8, w & 0xff, checksum(body), ...body])
}

/** Kodu haritaya çevirir; bozuk kod, boyut, yasak karakter ve P/E sayısı denetlenir. */
export function decodeMap(code: string): { map: string[]; city: CityKey } | { error: string } {
  const bytes = fromB64url(code.trim())
  if (!bytes || bytes.length < 6) return { error: 'Harita kodu bozuk.' }
  const [ver, ci, wh, wl, sum] = bytes
  if (ver !== VERSION) return { error: 'Harita kodu bu sürümde açılamıyor.' }
  const city = CITY_CODES[ci]
  if (!city) return { error: 'Harita kodu bozuk.' }
  const w = (wh << 8) | wl
  if (w < MIN_W || w > MAX_W) return { error: 'Genişlik 40 ile 320 sütun arasında olmalı.' }
  const body = bytes.slice(5)
  if (checksum(body) !== sum) return { error: 'Harita kodu bozuk.' }
  const total = w * ROWS
  let flat = ''
  for (let i = 0; i < body.length; ) {
    const b = body[i++]
    const sym = SYMBOLS[b >> 3]
    if (sym === undefined) return { error: 'Haritada izin verilmeyen bir karo var.' }
    let run = (b & 7) + 1
    if (run === 8) {
      let rest = 0
      let shift = 0
      for (;;) {
        if (i >= body.length || shift > 21) return { error: 'Harita kodu bozuk.' }
        const v = body[i++]
        rest |= (v & 0x7f) << shift
        shift += 7
        if (!(v & 0x80)) break
      }
      run = 8 + rest
    }
    if (flat.length + run > total) return { error: 'Harita kodu bozuk.' }
    flat += sym.repeat(run)
  }
  if (flat.length !== total) return { error: 'Harita kodu bozuk.' }
  const map = Array.from({ length: ROWS }, (_, r) => flat.slice(r * w, (r + 1) * w))
  const problem = validateMap(map)
  return problem ? { error: problem } : { map, city }
}

/** Madalya süreleri genişlikten: altın 0,12 · gümüş 0,18 · bronz 0,26 sn/sütun. */
export const customMedals = (w: number): [number, number, number] => [Math.round(w * 0.12), Math.round(w * 0.18), Math.round(w * 0.26)]

/** Özel haritayı oyunun okuyacağı bölüme çevirir: görünüm ve şehir metinleri seçilen şehirden, harita ve ad özel. */
export function customLevel(map: string[], city: CityKey): LevelDef {
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
    hints: [],
    nickname: base.nickname,
    note: base.note,
    npcs: [],
    medals: customMedals(map[0]?.length ?? MIN_W),
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
