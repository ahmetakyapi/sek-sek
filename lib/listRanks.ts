'use client'

import { useEffect, useState } from 'react'

/**
 * Listelerin sıralama özeti (`GET /api/scores?level=ozet&kind=sehir|mucadele&me=<ad>`): her şehir ya da mücadele için
 * lider, süresi, yolcu sayısı ve oyuncunun sırası. Şehirler ve Mücadeleler listesi bunu satırda gösterir: oyuncu
 * bölüme tıklamadan nerede durduğunu görür. Tek istek, kısa ömürlü önbellek (30 sn); hata sessizdir (satır bilgisiz kalır).
 * Saf ayrıştırma testli (`tests/listRanks.test.ts`).
 */
export type RankKind = 'sehir' | 'mucadele'

export interface ListRank {
  /** şehir ya da mücadele kimliği (mücadelede `c.id`) */
  id: string
  total: number
  leader: string | null
  leaderMs: number | null
  myRank: number | null
  myMs: number | null
}

export const RANKS_CACHE_MS = 30_000

const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.round(x) : null)

export function parseRanks(json: unknown): Record<string, ListRank> {
  const out: Record<string, ListRank> = {}
  const rows = (json as { rows?: unknown })?.rows
  if (!Array.isArray(rows)) return out
  for (const r of rows.slice(0, 500)) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id || o.id.length > 64 || o.id === '__proto__') continue
    out[o.id] = {
      id: o.id,
      total: num(o.total) ?? 0,
      leader: typeof o.leader === 'string' ? o.leader.slice(0, 32) : null,
      leaderMs: num(o.leaderMs),
      myRank: num(o.myRank),
      myMs: num(o.myMs),
    }
  }
  return out
}

/** Satırdaki kısa metin için: lider sensen, sıran, yoksa lider */
export const rankLabel = (r: ListRank | undefined): { kind: 'lead' | 'rank' | 'leader'; rank?: number; total: number; name?: string; ms?: number } | null => {
  if (!r || !r.total) return null
  if (r.myRank === 1) return { kind: 'lead', total: r.total }
  if (r.myRank) return { kind: 'rank', rank: r.myRank, total: r.total, name: r.leader ?? undefined, ms: r.leaderMs ?? undefined }
  return r.leader ? { kind: 'leader', total: r.total, name: r.leader, ms: r.leaderMs ?? undefined } : null
}

const cache = new Map<string, { at: number; data: Record<string, ListRank> }>()

/** `enabled` yanlışken istek atılmaz (liste ekranı kapalıyken) */
export function useListRanks(kind: RankKind, me: string, enabled = true): Record<string, ListRank> {
  const key = `${kind}|${me.toLocaleLowerCase('tr')}`
  const [data, setData] = useState<Record<string, ListRank>>(() => cache.get(key)?.data ?? {})
  useEffect(() => {
    if (!enabled) return
    const hit = cache.get(key)
    if (hit) setData(hit.data)
    if (hit && Date.now() - hit.at < RANKS_CACHE_MS) return
    const ac = new AbortController()
    const q = new URLSearchParams({ level: 'ozet', kind })
    if (me) q.set('me', me.slice(0, 32))
    fetch(`/api/scores?${q}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        const d = parseRanks(j)
        cache.set(key, { at: Date.now(), data: d })
        setData(d)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [key, kind, me, enabled])
  return data
}
