/**
 * Hikâye Gezisi kaydı (`save.story`): şehir insanının adı → bit alanı. 1, 2, 4: sorulan üç soru, 8: defter sayfası
 * okundu, 16: tanışıldı. Yıldız (bond) sorulan soru sayısıdır. Saf ve testli; kayıt birleşirken bitler birleşir
 * (hiçbir tanışma kaybolmaz).
 */
export type StoryLog = Record<string, number>

export const ASK_BIT = [1, 2, 4] as const
export const GIFT_BIT = 8
export const MET_BIT = 16
const ALL_BITS = 31
const MAX_KEYS = 400
const MAX_KEY_LEN = 60

export const bondOf = (m = 0) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1)
export const hasMet = (m = 0) => (m & MET_BIT) !== 0
export const hasAsked = (m: number, i: number) => (m & ASK_BIT[i]) !== 0

/** bit ekler; yeni kayıt döner (özgün nesne değişmez) */
export function mark(log: StoryLog | undefined, key: string, bits: number): StoryLog {
  const cur = log?.[key] ?? 0
  if ((cur | bits) === cur) return log ?? {}
  return { ...log, [key]: (cur | bits) & ALL_BITS }
}

export function mergeStory(a: StoryLog | undefined, b: StoryLog | undefined): StoryLog | undefined {
  if (!a && !b) return undefined
  const out: StoryLog = { ...b }
  for (const [k, v] of Object.entries(a ?? {})) out[k] = (out[k] ?? 0) | v
  return out
}

/** Dışarıdan gelen kaydı beklenen biçime zorlar (bulut gövdesi) */
export function cleanStory(raw: unknown): StoryLog | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const out: StoryLog = {}
  let n = 0
  for (const [k, v] of Object.entries(raw)) {
    if (n >= MAX_KEYS) break
    if (k.length === 0 || k.length > MAX_KEY_LEN || k === '__proto__' || k === 'constructor' || k === 'prototype') continue
    if (!Number.isInteger(v) || (v as number) < 0) continue
    out[k] = (v as number) & ALL_BITS
    n++
  }
  return out
}

export interface StoryStats {
  /** tanışılan kişi */
  met: number
  /** üç yıldızlı kişi */
  full: number
  /** toplam yıldız */
  stars: number
  /** okunan defter sayfası */
  gifts: number
}

export function storyStats(log: StoryLog | undefined, known?: (key: string) => boolean): StoryStats {
  let met = 0
  let full = 0
  let stars = 0
  let gifts = 0
  for (const [k, m] of Object.entries(log ?? {})) {
    if (known && !known(k)) continue
    if (hasMet(m)) met++
    stars += bondOf(m)
    if (bondOf(m) === 3) full++
    if (m & GIFT_BIT) gifts++
  }
  return { met, full, stars, gifts }
}
