import { LEVELS } from '@/game/levels'
import type { CharacterId } from '@/game/characters'

export interface ShareData {
  level: string
  timeMs: number
  deaths: number
  items: number
  character: CharacterId
  name: string
}

export function shareQuery(d: ShareData) {
  const q = new URLSearchParams({ s: d.level, t: String(d.timeMs), d: String(d.deaths), i: String(d.items), c: d.character })
  if (d.name) q.set('n', d.name)
  return q.toString()
}

/** Bağlantıdan gelen veriyi doğrular; bozuksa null. */
export function parseShare(p: Record<string, string | string[] | undefined>): ShareData | null {
  const g = (k: string) => (Array.isArray(p[k]) ? p[k]![0] : p[k]) ?? ''
  const level = g('s')
  if (!LEVELS.some((l) => l.id === level)) return null
  const timeMs = Number(g('t'))
  const deaths = Number(g('d'))
  const items = Number(g('i'))
  if (!Number.isInteger(timeMs) || timeMs < 1000 || timeMs > 3_600_000) return null
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 9999) return null
  if (!Number.isInteger(items) || items < 0 || items > 3) return null
  const character: CharacterId = g('c') === 'memo' ? 'memo' : 'uktun'
  const name = g('n').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 16)
  return { level, timeMs, deaths, items, character, name }
}
