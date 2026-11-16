import { LEVELS } from './levels'
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
  /** çözücünün en hızlı süresi (sn, verify-challenges yazdırır): madalyalar buna göre */
  par: number
  /** elle çizilmiş harita (Öfke Parkurları, game/rageCourses.ts): varsa şehirden kesilmez, `level` yalnız görünüşü verir */
  map?: string[]
}

export const CHALLENGES: Challenge[] = [
  { id: 'corum-leblebi', level: 'corum', name: 'Kavurma Ocağı', from: 2, to: 3, par: 7 },
  { id: 'sinop-kale', level: 'sinop', name: 'Kale Burcu', from: 3, to: 4, par: 7.5 },
  { id: 'ordu-boztepe', level: 'ordu', name: 'Boztepe İnişi', from: 2, to: 3, par: 8 },
  { id: 'trabzon-sumela', level: 'trabzon', name: 'Sümela Yolu', from: 5, to: 6, par: 16.5 },
  { id: 'sivas-divrigi', level: 'sivas', name: 'Divriği Kapısı', from: 2, to: 3, par: 8.3 },
  { id: 'van-akdamar', level: 'van', name: 'Akdamar Kıyısı', from: 3, to: 4, par: 10.3 },
  { id: 'erzurum-palandoken', level: 'erzurum', name: 'Palandöken', from: 1, to: 2, par: 13.5 },
  { id: 'ardahan-cildir', level: 'ardahan', name: 'Çıldır Buzu', from: 1, to: 2, par: 8.3 },
  { id: 'amasya-kaya', level: 'amasya', name: 'Kral Kaya Mezarları', from: 5, to: 6, par: 6.8 },
  { id: 'mugla-koy', level: 'mugla', name: 'Koy Rüzgârı', from: 6, to: 7, par: 6.7 },
  { id: 'bayburt-coruh', level: 'bayburt', name: 'Çoruh Boğazı', from: 1, to: 2, par: 12.8 },
]

/** Kesitte yalnız yol kalır: toplananlar, konuşanlar, öteki bayraklar ve final işaretleri boşalır */
const STRIP = /[PEFC$!n?@&QGK]/g

/** Bütün mücadeleler: şehirden kesilenler ve Öfke Parkurları (kimlikle arama, skor ve hile önleme bunu kullanır) */
export const ALL_CHALLENGES: Challenge[] = [...CHALLENGES, ...RAGE_COURSES]
export { RAGE_COURSES }

export function challengeLevel(c: Challenge): LevelDef {
  const l = LEVELS.find((x) => x.id === c.level)!
  if (c.map) {
    const medals: [number, number, number] = [Math.ceil(c.par * 1.5 + 3), Math.ceil(c.par * 2.2 + 6), Math.ceil(c.par * 3.2 + 10)]
    return { ...l, id: `mucadele-${c.id}`, name: c.name, map: [...c.map], medals, hints: [], npcs: [], finaleAt: undefined, wind: undefined }
  }
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
  // çözücü kusursuz koşar; altın onun bir buçuk katı, bronz üç katı
  const medals: [number, number, number] = [Math.ceil(c.par * 1.5 + 2), Math.ceil(c.par * 2 + 4), Math.ceil(c.par * 3 + 6)]
  return { ...l, id: `mucadele-${c.id}`, name: c.name, map, medals, hints: [], npcs: [], finaleAt: undefined }
}
