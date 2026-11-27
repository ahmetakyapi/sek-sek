import { BOSSES } from '@/game/boss'
import { LEVELS_EN } from '@/game/content.en'
import type { LevelDef } from '@/game/types'

/**
 * Defter Bilmecesi: oyunun kendi verisinden (LEVELS, BOSSES, content.en) üretilen şehir bilgi yarışması. Saf ve testli
 * (tests/carkQuiz.test.ts): aynı tohum aynı sınavı verir, bir şehir aynı sınavda iki kez doğru yanıt olmaz, seçenekler benzersizdir.
 * Sorular yalnız oyuncunun bitirdiği şehirlerden gelir (defterine yazdığı şehirleri sorar); seçenekler de onlardan.
 */

export type QuizKind = 'fact' | 'item' | 'nickname' | 'boss' | 'subtitle'

export interface QuizQ {
  kind: QuizKind
  /** doğru yanıtın şehir kimliği */
  city: string
  /** kind 'fact': facts dizisindeki sıra */
  fact?: number
  /** dört şehir kimliği, biri doğru */
  options: string[]
}

/** sınavın en çok soru sayısı; şehir azsa bitirilen şehir kadar */
export const QUIZ_SIZE = 10
/** bilmece en az bu kadar bitirilmiş şehirle açılır (dört seçenek) */
export const QUIZ_MIN = 4
/** ilk tam puanın (on soruda on) ödülü: Mağaza parçası */
export const QUIZ_PRIZE = 10
/** soru başına süre bonusu: bu süreye dek tam, sonra azalır, QUIZ_SLOW_MS'te biter */
export const QUIZ_FAST_MS = 3000
export const QUIZ_SLOW_MS = 15000

/** metninde TASLAK geçen şehir (iskeleti yeni açılmış, metni yazılmamış): bilmeceye ve çarka girmez */
export const draftCity = (l: LevelDef) => JSON.stringify([l.subtitle, l.item, l.intro, l.facts, l.nickname ?? '', l.note]).includes('TASLAK')

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** sorunun metni (soruda görünen ipucu): TR ya da EN */
export function quizPrompt(q: Pick<QuizQ, 'kind' | 'fact'>, l: LevelDef, lang: 'tr' | 'en'): string {
  const en = lang === 'en' ? LEVELS_EN[l.id] : undefined
  switch (q.kind) {
    case 'fact':
      return (en?.facts ?? l.facts)[q.fact ?? 0].title
    case 'item':
      return en?.item ?? l.item
    case 'nickname':
      return l.nickname ?? ''
    case 'boss':
      return lang === 'en' ? BOSSES[l.city].nameEn : BOSSES[l.city].name
    case 'subtitle':
      return en?.subtitle ?? l.subtitle
  }
}

/** yanıttan sonra gösterilen bilgi metni */
export function quizInfo(q: Pick<QuizQ, 'kind' | 'fact'>, l: LevelDef, lang: 'tr' | 'en'): string {
  const facts = (lang === 'en' ? LEVELS_EN[l.id]?.facts : undefined) ?? l.facts
  if (q.kind === 'fact') return facts[q.fact ?? 0].text
  if (q.kind === 'item') {
    const item = fold(quizPrompt(q, l, lang))
    const f = facts.find((x) => fold(x.title) === item)
    if (f) return f.text
  }
  if (q.kind === 'boss') return lang === 'en' ? BOSSES[l.city].tauntEn : BOSSES[l.city].taunt
  return facts[0].text
}

/** bir şehrin soru adayları: ipucu şehrin adını (TR ya da EN) ele vermez ve boş değildir */
function candidates(l: LevelDef): Pick<QuizQ, 'kind' | 'fact'>[] {
  const all: Pick<QuizQ, 'kind' | 'fact'>[] = [{ kind: 'fact', fact: 0 }, { kind: 'fact', fact: 1 }, { kind: 'fact', fact: 2 }, { kind: 'item' }, { kind: 'boss' }, { kind: 'subtitle' }, ...(l.nickname ? [{ kind: 'nickname' as const }] : [])]
  const name = fold(l.name)
  return all.filter((q) => (['tr', 'en'] as const).every((lang) => {
    const p = fold(quizPrompt(q, l, lang))
    return p.length > 0 && !p.includes(name)
  }))
}

/** şehrin bu türdeki bütün ipuçları (karışıklık denetimi: aynı ipucu başka şehirde de varsa o şehir seçenek olmaz) */
const clues = (l: LevelDef, lang: 'tr' | 'en') => [0, 1, 2].map((i) => fold(quizPrompt({ kind: 'fact', fact: i }, l, lang))).concat([fold(quizPrompt({ kind: 'item' }, l, lang)), fold(quizPrompt({ kind: 'subtitle' }, l, lang))])

/**
 * Tohumdan sınav: en çok QUIZ_SIZE soru, her soruda başka bir şehir; seçenekler havuzdan, ipucu başka bir seçenek şehrine de
 * uyuyorsa (aynı adlı hatıra gibi) o şehir seçenek olmaz. Havuz QUIZ_MIN'den küçükse boş dizi.
 */
export function makeQuiz(seed: string, pool: LevelDef[], size = QUIZ_SIZE): QuizQ[] {
  const cities = pool.filter((l) => !draftCity(l) && candidates(l).length > 0)
  if (cities.length < QUIZ_MIN) return []
  const order = [...cities].sort((a, b) => hash(`${seed}:o:${a.id}`) - hash(`${seed}:o:${b.id}`) || a.id.localeCompare(b.id))
  const out: QuizQ[] = []
  for (const l of order) {
    if (out.length >= Math.min(size, cities.length)) break
    const cand = candidates(l)
    const pick = cand[hash(`${seed}:k:${l.id}`) % cand.length]
    const prompts = (['tr', 'en'] as const).map((lang) => fold(quizPrompt(pick, l, lang)))
    const others = cities
      .filter((o) => o.id !== l.id && (['tr', 'en'] as const).every((lang, i) => !clues(o, lang).includes(prompts[i])))
      .sort((a, b) => hash(`${seed}:d:${l.id}:${a.id}`) - hash(`${seed}:d:${l.id}:${b.id}`) || a.id.localeCompare(b.id))
      .slice(0, 3)
    if (others.length < 3) continue
    const options = [l, ...others].map((x) => x.id).sort((a, b) => hash(`${seed}:p:${a}`) - hash(`${seed}:p:${b}`) || a.localeCompare(b))
    out.push({ ...pick, city: l.id, options })
  }
  return out
}

/** sorunun puanı: doğruysa 100 + hız bonusu (en çok 50) */
export function quizPoints(correct: boolean, ms: number): number {
  if (!correct) return 0
  const k = Math.max(0, Math.min(1, (QUIZ_SLOW_MS - ms) / (QUIZ_SLOW_MS - QUIZ_FAST_MS)))
  return 100 + Math.round(50 * k)
}

/** cihazdaki (ve buluttaki) iz: en iyi skor, o skorun soru sayısı, oynanan sınav, ilk tam puan (ödül alındı) */
export interface QuizMark {
  best: number
  size: number
  plays: number
  perfect: boolean
}

/** sınav bitti: yeni iz ve bu sınavın ödülü (ilk tam puanda QUIZ_PRIZE) */
export function markQuiz(m: QuizMark | null | undefined, points: number, correct: number, size: number): { mark: QuizMark; best: boolean; prize: number } {
  const best = !m || points > m.best
  const perfect = size >= QUIZ_SIZE && correct === size
  const prize = perfect && !m?.perfect ? QUIZ_PRIZE : 0
  return { mark: { best: best ? points : m!.best, size: best ? size : m!.size, plays: (m?.plays ?? 0) + 1, perfect: !!m?.perfect || perfect }, best, prize }
}

/** iki cihazın izi: en iyi skor, en çok oynama, tam puan bir kez alındıysa alınmış */
export function mergeQuiz(a: QuizMark | null | undefined, b: QuizMark | null | undefined): QuizMark | null {
  if (!a || !b) return a ?? b ?? null
  const hi = a.best >= b.best ? a : b
  return { best: hi.best, size: hi.size, plays: Math.max(a.plays, b.plays), perfect: a.perfect || b.perfect }
}

const int = (x: unknown, max: number) => (Number.isInteger(x) && (x as number) >= 0 ? Math.min(max, x as number) : 0)
/** bulut gövdesindeki iz: bozuk tip düşer, sayılar sınırlanır */
export function cleanQuiz(x: unknown): QuizMark | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null
  const r = x as Record<string, unknown>
  return { best: int(r.best, QUIZ_SIZE * 150), size: int(r.size, QUIZ_SIZE), plays: int(r.plays, 1e6), perfect: r.perfect === true }
}

/** bilmecenin Mağaza parçası (ilk tam puan) */
export const quizCoins = (m: QuizMark | null | undefined) => (m?.perfect ? QUIZ_PRIZE : 0)
