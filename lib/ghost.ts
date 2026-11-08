/** Hayalet koşunun cihazda saklanması (bölüm başına en iyi koşu). */
import type { GhostRun } from '@/game/ghost'

const key = (level: string) => `seksek:ghost:${level}`
/** 8 Kasım'a dek önek `memleket:` idi; okurken eski anahtar yeniye taşınır. */
const legacyKey = (level: string) => `memleket:ghost:${level}`

export function loadGhost(level: string): GhostRun | null {
  try {
    let raw = localStorage.getItem(key(level))
    if (!raw) {
      raw = localStorage.getItem(legacyKey(level))
      if (raw) {
        localStorage.setItem(key(level), raw)
        localStorage.removeItem(legacyKey(level))
      }
    }
    if (!raw) return null
    const g = JSON.parse(raw) as GhostRun
    return Array.isArray(g.data) && g.data.length >= 3 ? g : null
  } catch {
    return null
  }
}

export function saveGhost(level: string, g: GhostRun) {
  try {
    localStorage.setItem(key(level), JSON.stringify(g))
  } catch {
    /* yer yok ya da gizli sekme: hayalet bu oturumla sınırlı */
  }
}
