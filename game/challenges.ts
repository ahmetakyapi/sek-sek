import { LEVELS } from './levels'
import { MASTER_COURSES } from './puzzles'
import { RAGE_COURSES } from './rageCourses'
import type { LevelDef } from './types'

/**
 * Mücadele haritaları: Zor ve Çok Zor şehirlerin ana yolundan kesilmiş en sıkı bayrak aralıkları. Kısa, bayraksız,
 * hatırasız; tek iş baştan sona en hızlı varmak. Harita şehrin haritasından her açılışta yeniden kesilir, yani şehir
 * yenilenince mücadele de onunla yenilenir. Kesit: `from` sıradaki bayraktan (0: başlangıç) `to` sıradaki bayrağa.
 * Kanıt: `npx tsx scripts/verify-challenges.ts` (çözücü çıkışa varmalı) ve tests/extras.test.ts.
 */
export interface Challenge {
  id: string
  /** şehrin bölüm kimliği */
  level: string
  name: string
  from: number
  to: number
  /** çözücünün süresi (sn, verify-challenges yazdırır): ilk bulunan yolun süresi, en hızlısı değil; madalyaya dayanak olmaz */
  par: number
  /**
   * altın süre (sn, 26 Kasım 2026): en hızlı makro yolunun süresi × 1,15, yukarı yuvarlanır (`npx tsx scripts/fast-time.ts <id>`
   * `öneri` yazdırır). Ölçülmüş bir usta koşusu × 1,08 bundan sıkıysa o kalır (`par`ın 0,6'sından küçük elle değer şüphelidir).
   * Hile önleme alt sınırının en az 1,3 katı (tests/courses.test.ts). Yoksa `par`dan tahmin (`goldOf`); gümüş ve bronz altından türer.
   */
  gold?: number
  /** elle çizilmiş harita (Öfke Parkurları, game/rageCourses.ts): varsa şehirden kesilmez, `level` yalnız görünüşü verir */
  map?: string[]
  /** zorluk kademesi: yoksa kesit ya da Usta Parkuru; 'efsane' Efsane Parkurları (game/puzzles/efsane.ts) */
  tier?: 'efsane'
}

export const CHALLENGES: Challenge[] = [
  { id: 'corum-leblebi-2', level: 'corum', name: 'Kavurma Ocağı', from: 3, to: 4, par: 14.7, gold: 12 },
  { id: 'sinop-kale-2', level: 'sinop', name: 'Kale Burcu', from: 2, to: 4, par: 12.5, gold: 10 },
  { id: 'ordu-boztepe-2', level: 'ordu', name: 'Boztepe İnişi', from: 4, to: 5, par: 18.3, gold: 14 },
  { id: 'trabzon-sumela', level: 'trabzon', name: 'Sümela Yolu', from: 5, to: 6, par: 16.5, gold: 9 },
  { id: 'sivas-divrigi-2', level: 'sivas', name: 'Divriği Kapısı', from: 1, to: 3, par: 16.2, gold: 16 },
  { id: 'van-akdamar', level: 'van', name: 'Akdamar Kıyısı', from: 3, to: 4, par: 10.3, gold: 8 },
  { id: 'erzurum-palandoken', level: 'erzurum', name: 'Palandöken', from: 1, to: 2, par: 13.5, gold: 8 },
  { id: 'ardahan-cildir-2', level: 'ardahan', name: 'Çıldır Buzu', from: 2, to: 4, par: 25.5, gold: 26 },
  { id: 'amasya-kaya-2', level: 'amasya', name: 'Kral Kaya Mezarları', from: 4, to: 5, par: 24.1, gold: 17 },
  { id: 'mugla-koy-2', level: 'mugla', name: 'Koy Rüzgârı', from: 4, to: 5, par: 11.4, gold: 8 },
  { id: 'bayburt-coruh', level: 'bayburt', name: 'Çoruh Boğazı', from: 1, to: 2, par: 12.8, gold: 9 },
  { id: 'artvin-karagol', level: 'artvin', name: 'Karagöl Patikası', from: 3, to: 4, par: 13.1, gold: 9 },
  { id: 'kars-ani', level: 'kars', name: 'Ani Surları', from: 1, to: 2, par: 11.3, gold: 8 },
  { id: 'bitlis-nemrut', level: 'bitlis', name: 'Nemrut Krater Gölü', from: 3, to: 4, par: 10.3, gold: 8 },
  { id: 'agri-ishakpasa', level: 'agri', name: 'İshak Paşa Yamacı', from: 3, to: 4, par: 10.9, gold: 10 },
  { id: 'tokat-ballica', level: 'tokat', name: 'Ballıca Mağarası', from: 1, to: 2, par: 13.3, gold: 7 },
  { id: 'denizli-pamukkale', level: 'denizli', name: 'Pamukkale Havuzları', from: 1, to: 2, par: 13.3, gold: 9 },
  { id: 'zonguldak-galeri', level: 'zonguldak', name: 'Maden Galerisi', from: 2, to: 3, par: 16.3, gold: 10 },
]

/** Kesitte yalnız yol kalır: toplananlar, konuşanlar, öteki bayraklar ve final işaretleri boşalır */
const STRIP = /[PEFC$!n?@&QGK]/g

/** Bütün mücadeleler: şehirden kesilenler ve Öfke Parkurları (kimlikle arama, skor ve hile önleme bunu kullanır) */
export const ALL_CHALLENGES: Challenge[] = [...CHALLENGES, ...MASTER_COURSES, ...RAGE_COURSES]
export { MASTER_COURSES, RAGE_COURSES }

/** altın süre: `gold` (fast-time) varsa o, yoksa çözücünün süresinden (kesit ve Usta Parkuru ×0,85; uzun Öfke Parkuru kendi süresi) */
export const goldOf = (c: Challenge) => c.gold ?? Math.ceil(c.par * (c.map && !c.id.startsWith('usta-') && !c.tier ? 1 : 0.85))

/** Efsane Parkurunu açmak için bitirilmesi gereken Usta Parkuru sayısı */
export const LEGEND_UNLOCK = 3

/** parkur açık mı: görünüş şehri bitmiş olmalı; Efsane Parkuru ayrıca en az LEGEND_UNLOCK Usta Parkuru ister (saf) */
export function courseOpen(c: Challenge, finished: Set<string>, best: Record<string, number | undefined>): boolean {
  if (!finished.has(c.level)) return false
  if (c.tier !== 'efsane') return true
  return MASTER_COURSES.filter((m) => !m.tier && best[m.id]).length >= LEGEND_UNLOCK
}

/** madalyalar (altın, gümüş, bronz; sn): gümüş altının 1,5 katı, bronz 2,2 katı */
export function challengeMedals(c: Challenge): [number, number, number] {
  const g = goldOf(c)
  return [g, Math.ceil(g * 1.5), Math.ceil(g * 2.2)]
}

export function challengeLevel(c: Challenge): LevelDef {
  const l = LEVELS.find((x) => x.id === c.level)!
  const medals = challengeMedals(c)
  if (c.map) return { ...l, id: `mucadele-${c.id}`, name: c.name, map: [...c.map], medals, hints: [], npcs: [], finaleAt: undefined, wind: undefined }
  const door = Math.min(...l.map.map((r) => (r.includes('@') ? r.indexOf('@') : Infinity)))
  const flags: [number, number][] = []
  for (let x = 0; x < door; x++)
    for (let y = 0; y < l.map.length; y++) if (l.map[y][x] === 'F' || (flags.length === 0 && l.map[y][x] === 'P')) flags.push([x, y])
  // ilk eleman başlangıç (P) olmalı; P bayraklardan sağdaysa sırayı düzelt
  flags.sort((a, b) => a[0] - b[0])
  const start = flags[c.from]
  const end = flags[c.to] ?? [door, l.map.findIndex((r) => r[door] === '@')]
  const x0 = Math.max(0, start[0] - 2)
  const x1 = end[0] + 3
  const map = l.map.map((r, y) => {
    const row = r.slice(x0, x1).padEnd(x1 - x0, ' ').replace(STRIP, ' ').split('')
    if (y === start[1]) row[start[0] - x0] = 'P'
    if (y === end[1]) row[end[0] - x0] = 'E'
    return row.join('')
  })
  return { ...l, id: `mucadele-${c.id}`, name: c.name, map, medals, hints: [], npcs: [], finaleAt: undefined }
}
