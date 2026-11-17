/** Hayalet koşunun cihazda saklanması (bölüm başına en iyi koşu). */
import type { GhostRun } from '@/game/ghost'
import { cityVersion } from './mapVersion'

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
    return Array.isArray(g.data) && g.data.length >= 3 && (!g.v || g.v === cityVersion(level)) ? g : null
  } catch {
    return null
  }
}

/** hayalet en çok bu kadar sayı (≈ 3 dk tam çözünürlük); uzun koşu seyreltilir, depo dolmasın */
const MAX_GHOST = 8100

export function saveGhost(level: string, g: GhostRun) {
  let data = g.data
  // uzun koşu: örneklerin yarısını at (x, y, poz üçlüsü korunur), sığana dek
  while (data.length > MAX_GHOST) data = data.filter((_, i) => Math.floor(i / 3) % 2 === 0)
  try {
    localStorage.setItem(key(level), JSON.stringify({ ...g, data, v: cityVersion(level), step: g.data.length / data.length }))
  } catch {
    /* yer yok ya da gizli sekme: hayalet bu oturumla sınırlı (kayıt hayaletten önce gelir) */
  }
}
