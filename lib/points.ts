/**
 * Puan: bir şehir koşusunun tek sayıyla değeri (büyük olan önde). Süre tek başına yetmez: hatıra toplamak ve düşmemek de
 * puandır. Sunucu (app/api/scores) aynı hesabı yapar; eski satırlar için SQL karşılığı `pointsSql`. Saf ve testli
 * (tests/points.test.ts). Formül değişirse ikisini birlikte değiştir.
 *
 *   süre puanı  = 1000 × altın süre / koşu süresi   (en az 200, en çok 1250: altının altına inmek az da olsa ödüllenir)
 *   hatıra      = her biri 250 (üçü 750)
 *   düşüş       = her biri −20 (en çok −300)
 *   temiz koşu  = hiç düşmeden +150
 */
export const POINTS = { time: 1000, minTime: 0.2, maxTime: 1.25, item: 250, death: 20, maxDeathLoss: 300, clean: 150 } as const

export interface Points {
  time: number
  items: number
  deaths: number
  clean: number
  total: number
}

/** `gold`: şehrin altın süresi (sn) */
export function runPoints(gold: number, timeMs: number, deaths: number, items: number): Points {
  const ratio = Math.min(POINTS.maxTime, Math.max(POINTS.minTime, (gold * 1000) / Math.max(1, timeMs)))
  const time = Math.round(POINTS.time * ratio)
  const it = Math.max(0, Math.min(3, items)) * POINTS.item
  const d = -Math.min(POINTS.maxDeathLoss, Math.max(0, deaths) * POINTS.death)
  const clean = deaths === 0 ? POINTS.clean : 0
  return { time, items: it, deaths: d, clean, total: Math.max(0, time + it + d + clean) }
}
