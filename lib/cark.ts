import type { LevelDef } from '@/game/types'
import { RAGE_RULES, RULES, ruleFits, type DailyRule } from './extras'
import { draftCity } from './quiz'

/**
 * Çarkıfelek: çark bitirilmiş bir şehir ve o şehirde kanıtlı bir kural seçer (Günlük kurallar + Sinir Bozucu, `ruleFits`:
 * NO_DASH_OK, SLIPPERY_OK… listeleri), koşu Kurallı Koşu altyapısında oynanır. Günde CARK_PAID ödüllü çevirme: biten
 * koşu kuralın zorluğuna göre Mağaza parçası verir; sonrası serbest. Seçim saf ve tohumludur (tests/carkQuiz.test.ts).
 */

export const CARK_RULES: DailyRule[] = [...RULES, ...RAGE_RULES]
/** günde kaç çevirme ödüllü */
export const CARK_PAID = 3
/** çarkın dilim sayısı */
export const CARK_SLICES = 12
/**
 * Kuralın zorluğu (components/RuleArt.tsx RULE_ART heat 1-5) → Mağaza parçası. Zorluk çağırandan gelir: bu dosya sunucuda da
 * (bulut kaydı, storage.ts) yüklenir, 'use client' bileşen dosyasını içe aktarmaz.
 */
export const CARK_REWARD: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 2, 2: 3, 3: 4, 4: 6, 5: 8 }
export const carkReward = (heat: number) => CARK_REWARD[Math.max(1, Math.min(5, Math.round(heat))) as 1 | 2 | 3 | 4 | 5]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** çarkın şehir havuzu: bitirilmiş ve metni yazılmış (TASLAK olmayan) şehirler */
export const carkCities = (levels: LevelDef[], done: (id: string) => boolean) => levels.filter((l) => done(l.id) && !draftCity(l))

export interface CarkSpin {
  levelId: string
  rule: DailyRule
  /** çarkın dilimleri (en çok CARK_SLICES kural; seçilen içinde) */
  wheel: DailyRule[]
  /** seçilen kuralın dilimi */
  slot: number
}

/** tohumdan çevirme: şehir havuzdan, kural o şehre uyanlardan; havuz boşsa null */
export function spinCark(seed: string, cities: LevelDef[]): CarkSpin | null {
  if (!cities.length) return null
  const city = cities[hash(`cark:${seed}:sehir`) % cities.length]
  const fits = CARK_RULES.filter((r) => ruleFits(r, city))
  const rule = fits[hash(`cark:${seed}:kural`) % fits.length]
  const rest = fits.filter((r) => r !== rule).sort((a, b) => hash(`cark:${seed}:${a}`) - hash(`cark:${seed}:${b}`) || a.localeCompare(b))
  const wheel = [rule, ...rest.slice(0, CARK_SLICES - 1)].sort((a, b) => hash(`cark:${seed}:dilim:${a}`) - hash(`cark:${seed}:dilim:${b}`) || a.localeCompare(b))
  return { levelId: city.id, rule, wheel, slot: wheel.indexOf(rule) }
}

/** çevrilmiş ama henüz bitirilmemiş koşu */
export interface CarkOpen {
  levelId: string
  rule: DailyRule
  /** ödüllü çevirme mi */
  paid: boolean
}

/** cihazdaki (ve buluttaki) iz */
export interface CarkMark {
  /** ödüllü çevirmelerin günü (İstanbul saati) ve o gün kullanılan ödüllü çevirme */
  day: string
  spins: number
  /** bütün çevirmeler (tohumun parçası: aynı gün yenilense de aynı sonuç gelmez, sayfa tazelemek çarkı yeniden çevirmez) */
  total: number
  /** art arda bitirilen çevirme; bitirilmeden yeniden çevrilince sıfırlanır */
  streak: number
  bestStreak: number
  /** bitirilen çevirme */
  wins: number
  /** gün → o gün kazanılan parça (cihazlar gün gün birleşir, hiçbiri kaybolmaz) */
  earn: Record<string, number>
  open: CarkOpen | null
}

export const emptyCark = (): CarkMark => ({ day: '', spins: 0, total: 0, streak: 0, bestStreak: 0, wins: 0, earn: {}, open: null })

/** bugün kalan ödüllü çevirme */
export const carkLeft = (m: CarkMark | null | undefined, day: string) => Math.max(0, CARK_PAID - (m?.day === day ? m.spins : 0))

/** sıradaki çevirmenin tohumu */
export const carkSeed = (m: CarkMark | null | undefined, day: string) => `${day}:${m?.total ?? 0}`

/** çark çevrildi: açık koşu yazılır; önceki bitmemişse seri biter, ödüllü hak kaldıysa bu çevirme ödüllüdür */
export function spinMark(m: CarkMark | null | undefined, day: string, spin: Pick<CarkSpin, 'levelId' | 'rule'>): CarkMark {
  const cur = m ?? emptyCark()
  const spins = cur.day === day ? cur.spins : 0
  const paid = spins < CARK_PAID
  return { ...cur, day, spins: paid ? spins + 1 : spins, total: cur.total + 1, streak: cur.open ? 0 : cur.streak, open: { levelId: spin.levelId, rule: spin.rule, paid } }
}

/** çarkın koşusu bitti: seri büyür, ödüllüyse parça yazılır. Açık koşu bu değilse iz değişmez (coins 0) */
export function winMark(m: CarkMark | null | undefined, day: string, levelId: string, rule: DailyRule, heat: number): { mark: CarkMark; coins: number } {
  if (!m?.open || m.open.levelId !== levelId || m.open.rule !== rule) return { mark: m ?? emptyCark(), coins: 0 }
  const coins = m.open.paid ? carkReward(heat) : 0
  const streak = m.streak + 1
  return { mark: { ...m, streak, bestStreak: Math.max(m.bestStreak, streak), wins: m.wins + 1, earn: coins ? { ...m.earn, [day]: (m.earn[day] ?? 0) + coins } : m.earn, open: null }, coins }
}

/** çarkla kazanılan bütün parça */
export const carkCoins = (m: CarkMark | null | undefined) => Object.values(m?.earn ?? {}).reduce((a, n) => a + n, 0)

/** iki cihazın izi: gün gün en çok kazanç, sayaçların büyüğü; açık koşu ve bugünkü hak daha çok çevrilmiş olandan */
export function mergeCark(a: CarkMark | null | undefined, b: CarkMark | null | undefined): CarkMark | null {
  if (!a || !b) return a ?? b ?? null
  const earn: Record<string, number> = { ...b.earn }
  for (const [k, v] of Object.entries(a.earn)) earn[k] = Math.max(v, earn[k] ?? 0)
  const day = a.day >= b.day ? a.day : b.day
  const spins = Math.max(a.day === day ? a.spins : 0, b.day === day ? b.spins : 0)
  const hi = a.total >= b.total ? a : b
  return { day, spins, total: Math.max(a.total, b.total), streak: hi.streak, bestStreak: Math.max(a.bestStreak, b.bestStreak), wins: Math.max(a.wins, b.wins), earn, open: hi.open }
}

const int = (x: unknown, max: number) => (Number.isInteger(x) && (x as number) >= 0 ? Math.min(max, x as number) : 0)
const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
/** bulut gövdesindeki iz: bilinmeyen kural, bozuk gün ve tip düşer; günlük kazanç bir günün en çoğuyla sınırlı */
export function cleanCark(x: unknown): CarkMark | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null
  const r = x as Record<string, unknown>
  const earn: Record<string, number> = {}
  if (typeof r.earn === 'object' && r.earn !== null && !Array.isArray(r.earn)) for (const [k, v] of Object.entries(r.earn).slice(-400)) if (isDay(k)) earn[k] = int(v, CARK_PAID * CARK_REWARD[5])
  const o = r.open as Record<string, unknown> | null | undefined
  const open = o && typeof o === 'object' && typeof o.levelId === 'string' && o.levelId.length < 40 && CARK_RULES.includes(o.rule as DailyRule) ? { levelId: o.levelId, rule: o.rule as DailyRule, paid: o.paid === true } : null
  return { day: isDay(r.day) ? r.day : '', spins: int(r.spins, CARK_PAID), total: int(r.total, 1e7), streak: int(r.streak, 1e6), bestStreak: int(r.bestStreak, 1e6), wins: int(r.wins, 1e7), earn, open }
}
