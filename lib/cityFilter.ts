/**
 * Şehirler listesinin süzgeci (saf, testli: tests/cityFilter.test.ts): arama (ad ya da plaka; Türkçe harf farkı yok) ve
 * "oynamaya değer" süzgeçleri (Oynanmadı, Eksik Hatıra, Altın Yok; 24 Kasım 2026'da girişsiz oyuncuda anlamsız kalan
 * "Lider Değilim" kaldırıldı: liderlik listede her şehrin yanında görünür). Süzgeç seçiliyken kilitli şehir görünmez (orada yapılacak bir şey yok).
 */
import { medalFor } from '@/components/medal'
import type { LevelDef } from '@/game/types'
import type { ListRank } from '@/lib/listRanks'
import { foldText } from '@/lib/modeHints'
import type { Best } from '@/lib/storage'

export type CityFilter = 'all' | 'new' | 'missing' | 'nogold'

/** [süzgeç, Türkçe etiket] (etiket arayüzde t() ile çevrilir) */
export const CITY_FILTERS: Array<[CityFilter, string]> = [
  ['all', 'Hepsi'],
  ['new', 'Oynanmadı'],
  ['missing', 'Eksik Hatıra'],
  ['nogold', 'Altın Yok'],
]

export interface CityCtx {
  query: string
  filter: CityFilter
  unlocked: number
  best?: Best
  rank?: ListRank
  /** giriş yapılmış mı */
  player: boolean
}

export function cityMatches(l: LevelDef, i: number, c: CityCtx): boolean {
  const q = foldText(c.query.trim())
  if (q && !foldText(l.name).includes(q) && !String(l.plate).padStart(2, '0').startsWith(q) && String(l.plate) !== q) return false
  if (c.filter === 'all') return true
  if (i > c.unlocked) return false
  const b = c.best
  // açık ama henüz bitirilmemiş şehir (yeni eklenenler, sırada bekleyen)
  if (c.filter === 'new') return !b
  if (c.filter === 'missing') return !b || !b.items.every(Boolean)
  return !b || !!b.stale || medalFor(l, b.timeMs) !== 'altin'
}
