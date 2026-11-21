/**
 * Hikâye Gezisi diyalog verisi (DOM'suz, testli). Her şehir insanının kısa bir konuşması var: selam, oyuncunun
 * üç tonda sorusu (meraklı, şakacı, saygılı) ve karakterin tepkisi, üç soru da sorulunca verilen bir "defter sayfası".
 * Metinler [Türkçe, İngilizce] çiftidir. Metinde:
 *  - `{rol}`: oyuncunun mesleği (Uktun: Haritacı, Memo: Telefoncu)
 *  - `«Uktun’a söz||Memo’ya söz»`: yolcuya göre küçük fark
 */
export type Bi = readonly [string, string]
export type Hero = 'uktun' | 'memo'

export interface Ask {
  /** oyuncunun söylediği (seçenek) */
  q: Bi
  /** karakterin tepkisi */
  a: Bi
}

export interface Talk {
  hi: Bi
  /** meraklı, şakacı, saygılı */
  asks: readonly [Ask, Ask, Ask]
  gift: { title: Bi; text: Bi }
}

/** Yazım kısaltması: talk(selam, [[soru, tepki], ...üç], [başlık, metin]); her Bi [tr, en] */
export function talk(hi: Bi, asks: readonly [readonly [Bi, Bi], readonly [Bi, Bi], readonly [Bi, Bi]], gift: readonly [Bi, Bi]): Talk {
  const ask = (x: readonly [Bi, Bi]): Ask => ({ q: x[0], a: x[1] })
  return { hi, asks: [ask(asks[0]), ask(asks[1]), ask(asks[2])], gift: { title: gift[0], text: gift[1] } }
}

export const TONE_NAMES = ['Merak', 'Şaka', 'Saygı'] as const

const ROLE: Record<Hero, Bi> = { uktun: ['Haritacı', 'Mapper'], memo: ['Telefoncu', 'Phone Fixer'] }

/** Metni dile ve yolcuya göre doldurur */
export function fill(b: Bi, lang: 'tr' | 'en', hero: Hero): string {
  const i = lang === 'en' ? 1 : 0
  return b[i].replace(/\{rol\}/g, ROLE[hero][i]).replace(/«(.*?)\|\|(.*?)»/g, (_, u: string, m: string) => (hero === 'memo' ? m : u))
}

export interface Choice {
  /** seçenek metni; null: arayüzün genel düğmesi (başka soru, hoşça kal) */
  label: Bi | null
  /** hedef düğüm; null: konuşma biter */
  to: string | null
  /** seçilince işaretlenen soru sırası (0-2) */
  ask?: number
}

export interface DNode {
  id: string
  text: Bi
  choices: Choice[]
}

/** Konuşmanın düğüm grafı: kök → üç tepki → kök ya da defter sayfası (üç soru da bitince) */
export function nodesOf(t: Talk): DNode[] {
  const rootChoices: Choice[] = t.asks.map((a, i) => ({ label: a.q, to: `a${i}`, ask: i }))
  rootChoices.push({ label: null, to: null })
  const out: DNode[] = [{ id: 'root', text: t.hi, choices: rootChoices }]
  t.asks.forEach((a, i) => out.push({ id: `a${i}`, text: a.a, choices: [{ label: null, to: 'root' }, { label: null, to: 'gift' }, { label: null, to: null }] }))
  out.push({ id: 'gift', text: t.gift.text, choices: [{ label: null, to: null }] })
  return out
}

/** Yıldız sayısı: sorulmuş soru sayısı (0-3) */
export const BOND_MAX = 3
