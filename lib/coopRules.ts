import type { DuoKeys } from '@/game/input'
import type { PingKind } from '@/game/sim'
import type { GameEvent } from '@/game/types'

/** Bir oyuncunun koşudaki payı: kim ne yaptı */
export interface CoopShare {
  deaths: number
  items: number
  stomps: number
  hits: number
  boosts: number
  dashes: number
  /** düşen eşi kaldırdı */
  rescues: number
  /** alttayken eşini fırlattı */
  throws: number
  /** verdiği işaret */
  pings: number
}
export const emptyShare = (): CoopShare => ({ deaths: 0, items: 0, stomps: 0, hits: 0, boosts: 0, dashes: 0, rescues: 0, throws: 0, pings: 0 })

/**
 * Olayı paya yazar. `step` olayı üreten adımın sahibi (0: dünyanın adımı, 1: eşin adımı). Omuz sekmesi, kurtarma ve işaret
 * ikisinin de adımından sonra üretilir: olay kimi söylediğini taşır (seken, kurtarılan, işareti veren).
 */
export function credit(share: [CoopShare, CoopShare], step: 0 | 1, e: GameEvent) {
  const s = share[step]
  if (e.type === 'death') s.deaths++
  else if (e.type === 'collect' || e.type === 'stamp' || e.type === 'charm') s.items++
  else if (e.type === 'stomp') s.stomps++
  else if (e.type === 'bossHit' || e.type === 'bossDown') s.hits++
  else if (e.type === 'dash') s.dashes++
  else if (e.type === 'shoulder') {
    const top = e.partner ? 1 : 0
    share[top].boosts++
    if (e.thrown) share[1 - top].throws++
  } else if (e.type === 'rescue') share[e.partner ? 0 : 1].rescues++
  else if (e.type === 'ping') share[e.who].pings++
}

/** Bitiş ekranının unvanları: `who` 0 ya da 1 bir oyuncuya, 2 ikiliye; eşitlikte kişisel unvan verilmez */
export function coopAwards(share: [CoopShare, CoopShare], failed?: 'lives' | 'time'): { who: 0 | 1 | 2; name: string }[] {
  const out: { who: 0 | 1 | 2; name: string }[] = []
  const most = (f: (s: CoopShare) => number, name: string, low = false) => {
    const a = f(share[0])
    const b = f(share[1])
    if (a === b || (!low && Math.max(a, b) === 0)) return
    out.push({ who: (low ? a < b : a > b) ? 0 : 1, name })
  }
  most((s) => s.hits, 'Boss Ezici')
  most((s) => s.items, 'Hatıra Avcısı')
  most((s) => s.boosts, 'Omuz Ustası')
  most((s) => s.stomps, 'Düşman Kovucu')
  most((s) => s.deaths, 'Sağlam Ayak', true)
  most((s) => s.dashes, 'Dash Ustası')
  most((s) => s.rescues, 'Kurtarıcı')
  most((s) => s.throws, 'Fırlatıcı')
  most((s) => s.pings, 'Yol Gösterici')
  const sum = (f: (s: CoopShare) => number) => f(share[0]) + f(share[1])
  if (!failed) {
    if (sum((s) => s.deaths) === 0) out.push({ who: 2, name: 'Kusursuz İkili' })
    if (sum((s) => s.rescues) >= 2) out.push({ who: 2, name: 'Kurtarma Ekibi' })
    if (sum((s) => s.boosts) >= 5) out.push({ who: 2, name: 'Omuz Omuza' })
    if (sum((s) => s.throws) >= 3) out.push({ who: 2, name: 'Sirk Ekibi' })
    if (share[0].items > 0 && share[0].items === share[1].items) out.push({ who: 2, name: 'Adil Paylaşım' })
  }
  if (sum((s) => s.pings) >= 8) out.push({ who: 2, name: 'Sohbet Kuşları' })
  return out
}

/** İşaret tuşları: 1. oyuncu 1-4, 2. oyuncu 7-0 (sırayla Burada, Bekle, Dikkat, Aferin); oyun kolunda LB Burada, RB Dikkat */
export const PING_KEYS: readonly (readonly string[])[] = [
  ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
  ['Digit7', 'Digit8', 'Digit9', 'Digit0'],
]
export const PING_ORDER: readonly PingKind[] = ['here', 'wait', 'danger', 'nice']
export const PING_TEXT: Record<PingKind, string> = { here: 'Burada!', wait: 'Bekle!', danger: 'Dikkat!', nice: 'Aferin!' }

/** Basılan tuş bir işaret mi (oyuncunun atadığı tuşlardan biriyse hareket tuşu sayılır, işaret değil) */
export function pingFromKey(code: string, keys: DuoKeys): { who: 0 | 1; kind: PingKind } | null {
  const bound = keys.some((b) => [...b.left, ...b.right, ...b.jump, ...b.dash, ...b.down].includes(code))
  if (bound) return null
  for (const who of [0, 1] as const) {
    const i = PING_KEYS[who].indexOf(code)
    if (i >= 0) return { who, kind: PING_ORDER[i] }
  }
  return null
}

/** Bayrak aralıkları: birikimli bayrak sürelerinden her aralığın süresi (ms) */
export function legTimes(splits: number[], total: number): number[] {
  return [...splits, total].map((t, i, a) => Math.max(0, t - (i ? a[i - 1] : 0)))
}
