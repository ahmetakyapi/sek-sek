/**
 * Hayalet koşu: bölümdeki en iyi koşunun saniyede GHOST_HZ örneklik kaydı.
 * Örnek başına üç sayı: x, y, poz (0 bekle, 1 koş, 2 zıpla, 3 düş, 4 dash; sola bakıyorsa +8).
 * Saklama tarayıcıda: lib/ghost.ts.
 */
import type { CharacterId } from './characters'
import type { World } from './sim'

export const GHOST_HZ = 15

export interface GhostRun {
  hero: CharacterId
  data: number[]
}

export function poseOf(w: World) {
  const p = w.player
  const pose = p.dashTime > 0 ? 4 : !p.grounded ? (p.vy < -40 ? 2 : 3) : Math.abs(p.vx) > 8 ? 1 : 0
  return pose + (p.facing < 0 ? 8 : 0)
}

/** Koşu sürerken zamanlayıcıya göre eksik örnekleri ekler. */
export function record(rec: number[], w: World) {
  const want = Math.floor(w.time * GHOST_HZ) + 1
  while (rec.length / 3 < want) rec.push(Math.round(w.player.x), Math.round(w.player.y), poseOf(w))
}
