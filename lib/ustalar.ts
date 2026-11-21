import { medalFor } from '@/components/medal'
import type { LevelDef } from '@/game/types'

/**
 * Şehir ustaları: her şehrin ilk şehir insanı (esnaf) küçük bir görev verir; görev koşunun sonucundan doğrulanır,
 * haritayı değiştirmez. Görev yapılınca Usta Mührü kazanılır (save.ustalar); mühürler Mağaza'da para sayılır.
 * Görev türü şehrin sırasından döner: her türden yedişer şehir, art arda iki şehirde aynı görev olmaz.
 */
export type UstaTask = 'items' | 'nodeath' | 'gold' | 'secrets' | 'cleanBoss'
const ORDER: UstaTask[] = ['items', 'nodeath', 'secrets', 'gold', 'cleanBoss']

export interface UstaRun {
  timeMs: number
  deaths: number
  items: boolean[]
  /** bu koşuda gizli pul ve nazar boncuğu alındı mı (şehirde yoksa alınmış sayılır) */
  stamp: boolean
  charm: boolean
  /** boss arenasında hiç düşülmedi */
  cleanBoss: boolean
  /** Rahat Mod: görev sayılmaz */
  relaxed: boolean
}

export const ustaTask = (index: number): UstaTask => ORDER[index % ORDER.length]

export function ustaDone(task: UstaTask, level: LevelDef, r: UstaRun): boolean {
  if (r.relaxed) return false
  switch (task) {
    case 'items':
      return r.items.length > 0 && r.items.every(Boolean)
    case 'nodeath':
      return r.deaths === 0
    case 'gold':
      return medalFor(level, r.timeMs) === 'altin'
    case 'secrets':
      return r.stamp && r.charm
    case 'cleanBoss':
      return r.cleanBoss
  }
}

/** Görevin metni (TR; İngilizcesi ui.en.ts). {item}: şehrin hatırası, {name}: ustanın adı */
export const USTA_TEXT: Record<UstaTask, string> = {
  items: 'Üç {item} aynı yolculukta getir.',
  nodeath: 'Bu şehri hiç düşmeden bitir.',
  gold: 'Altın madalya süresinde bitir.',
  secrets: 'Gizli pulu ve nazar boncuğunu aynı yolculukta bul.',
  cleanBoss: 'Meydanın boss’unu hiç düşmeden yen.',
}
