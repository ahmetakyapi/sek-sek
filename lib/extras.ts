import type { LevelDef } from '@/game/types'

/**
 * Yolculuğun yan işleri: atkı renkleri, Günün Şehri ve Haftanın Görevi.
 * Hepsi saf işlevdir (tarih ve kayıt dışarıdan gelir); testleri tests/extras.test.ts.
 */

export interface Scarf {
  id: string
  name: string
  nameEn: string
  color: string
  shade: string
  /** açılması için gereken nazar boncuğu sayısı */
  need: number
}

/** Atkı renkleri: ilki herkese açık, ötekiler bulunan nazar boncuklarıyla açılır. */
export const SCARVES: Scarf[] = [
  { id: 'al', name: 'Al', nameEn: 'Crimson', color: '#d83c36', shade: '#9e2430', need: 0 },
  { id: 'safran', name: 'Safran', nameEn: 'Saffron', color: '#f2b632', shade: '#c08a24', need: 1 },
  { id: 'cini', name: 'Çini Mavisi', nameEn: 'Tile Blue', color: '#2e8fd0', shade: '#1e68a0', need: 3 },
  { id: 'zeytin', name: 'Zeytin Yeşili', nameEn: 'Olive Green', color: '#6a9a3e', shade: '#4a7228', need: 6 },
  { id: 'erguvan', name: 'Erguvan', nameEn: 'Judas Purple', color: '#b04a9a', shade: '#7e2e70', need: 10 },
  { id: 'firuze', name: 'Firuze', nameEn: 'Turquoise', color: '#2ab8a8', shade: '#1a8a7e', need: 15 },
  { id: 'gece', name: 'Gece Laciverti', nameEn: 'Midnight Blue', color: '#33407e', shade: '#222c5a', need: 20 },
  { id: 'nazar', name: 'Nazar', nameEn: 'Evil Eye', color: '#f4f8ff', shade: '#4ab0e8', need: 25 },
]

export const scarfFor = (id: string | undefined) => SCARVES.find((s) => s.id === id) ?? SCARVES[0]

export type ChallengeKind = 'noFall' | 'fewFalls' | 'noDash' | 'silver' | 'gold' | 'collector'

/** Görev metni (TR); İngilizcesi lib/ui.en.ts'te aynı anahtarla durur. */
export const CHALLENGE_TEXT: Record<ChallengeKind, string> = {
  noFall: 'Hiç Düşmeden Bitir',
  fewFalls: 'En Çok Üç Düşüşle Bitir',
  noDash: 'Hiç Atılmadan Bitir',
  silver: 'Gümüş Sürede Bitir',
  gold: 'Altın Sürede Bitir',
  collector: 'Üç Hatırayı da Topla',
}

export interface Challenge {
  /** gün (2026-11-10) ya da hafta (2026-H46) anahtarı */
  key: string
  levelId: string
  kinds: ChallengeKind[]
}

export interface RunStats {
  timeMs: number
  deaths: number
  dashes: number
  items: boolean[]
  relaxed: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Pazartesi başlayan hafta: yıl + haftanın sırası */
export function weekKey(d: Date) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + 3)
  const first = new Date(day.getFullYear(), 0, 4)
  const week = 1 + Math.round(((day.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7)
  return `${day.getFullYear()}-H${pad(week)}`
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const easy = (l: LevelDef) => l.difficulty === 'Kolay'
const hard = (l: LevelDef) => l.difficulty === 'Zor' || l.difficulty === 'Çok Zor'
const falls = (l: LevelDef): ChallengeKind => (hard(l) ? 'fewFalls' : 'noFall')

/** Günün Şehri: açılmış şehirlerden biri ve tek bir görev. Aynı gün herkes için aynıdır (açılan şehir sayısı eşitse). */
export function dailyChallenge(d: Date, levels: LevelDef[], unlocked: number): Challenge {
  const key = dayKey(d)
  const h = hash(key)
  const l = levels[h % Math.min(levels.length, unlocked + 1)]
  const pool: ChallengeKind[] = [falls(l), 'silver', 'collector', ...(easy(l) ? (['noDash'] as const) : [])]
  return { key, levelId: l.id, kinds: [pool[(h >>> 8) % pool.length]] }
}

/** Haftanın Görevi: günlükten bir kademe zor, iki koşul birden. */
export function weeklyChallenge(d: Date, levels: LevelDef[], unlocked: number): Challenge {
  const key = weekKey(d)
  const h = hash(key)
  const l = levels[h % Math.min(levels.length, unlocked + 1)]
  return { key, levelId: l.id, kinds: [falls(l), (h >>> 8) % 2 ? 'gold' : 'collector'] }
}

/** medals: [altın, gümüş, bronz] saniye */
export function meets(kind: ChallengeKind, level: LevelDef, run: RunStats): boolean {
  switch (kind) {
    case 'noFall':
      return run.deaths === 0
    case 'fewFalls':
      return run.deaths <= 3
    case 'noDash':
      return run.dashes === 0
    case 'silver':
      return run.timeMs <= level.medals[1] * 1000
    case 'gold':
      return run.timeMs <= level.medals[0] * 1000
    case 'collector':
      return run.items.length > 0 && run.items.every(Boolean)
  }
}

/** Rahat Mod'daki koşu görev saymaz. */
export const completes = (ch: Challenge, level: LevelDef, run: RunStats) => !run.relaxed && level.id === ch.levelId && ch.kinds.every((k) => meets(k, level, run))
