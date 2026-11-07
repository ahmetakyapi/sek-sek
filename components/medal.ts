import type { LevelDef } from '@/game/types'

export type Medal = 'altin' | 'gumus' | 'bronz'

export function medalFor(l: LevelDef, timeMs: number): Medal | null {
  const s = timeMs / 1000
  if (s <= l.medals[0]) return 'altin'
  if (s <= l.medals[1]) return 'gumus'
  if (s <= l.medals[2]) return 'bronz'
  return null
}
