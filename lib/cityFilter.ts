/**
 * Şehirler listesinin süzgeci (saf, testli: tests/cityFilter.test.ts): arama (ad ya da plaka; Türkçe harf farkı yok) ve
 * "tekrar oynamaya değer" süzgeçleri. Süzgeç seçiliyken kilitli şehir görünmez (orada yapılacak bir şey yok).
 */
import { medalFor } from '@/components/medal'
import type { LevelDef } from '@/game/types'
import type { ListRank } from '@/lib/listRanks'
import { foldText } from '@/lib/modeHints'
import type { Best } from '@/lib/storage'

export type CityFilter = 'all' | 'missing' | 'nogold' | 'notlead'

/** [süzgeç, Türkçe etiket] (etiket arayüzde t() ile çevrilir) */
export const CITY_FILTERS: Array<[CityFilter, string]> = [
  ['all', 'Hepsi'],
  ['missing', 'Eksik Hatıra'],
  ['nogold', 'Altın Yok'],
  ['notlead', 'Lider Değilim'],
]

export interface CityCtx {
  query: string
  filter: CityFilter
  unlocked: number
  best?: Best
  rank?: ListRank
  /** giriş yapılmış mı (değilse "Lider Değilim" her açık şehri gösterir) */
  player: boolean
}

export function cityMatches(l: LevelDef, i: number, c: CityCtx): boolean {
  const q = foldText(c.query.trim())
  if (q && !foldText(l.name).includes(q) && !String(l.plate).padStart(2, '0').startsWith(q) && String(l.plate) !== q) return false
  if (c.filter === 'all') return true
  if (i > c.unlocked) return false
  const b = c.best
  if (c.filter === 'missing') return !b || !b.items.every(Boolean)
  if (c.filter === 'nogold') return !b || !!b.stale || medalFor(l, b.timeMs) !== 'altin'
  return !c.player || c.rank?.myRank !== 1
}
