/**
 * Topluluk Haritaları: düzenleyicide çizilip çözücüyle sınanan haritaların ortak galerisi (/haritalar).
 * DOM'suz ve sunucusuz kurallar: başlık denetimi, kaba söz süzgeci, sıralama adları. Hem API hem düzenleyici kullanır.
 */

export const TITLE_MIN = 3
export const TITLE_MAX = 40
/** oyuncu başına son 24 saatte en çok bu kadar harita */
export const DAILY_LIMIT = 10
/** galeride bir sayfada kart sayısı */
export const PAGE_SIZE = 12

export const SORTS = ['yeni', 'begeni', 'oynanan'] as const
export type MapSort = (typeof SORTS)[number]
export const parseSort = (s: string | null | undefined): MapSort => (SORTS as readonly string[]).includes(s ?? '') ? (s as MapSort) : 'yeni'

/** Galeri kartı (GET /api/maps yanıtındaki satır) */
export interface CommunityMap {
  id: number
  code: string
  title: string
  author: string
  city: string
  plays: number
  likes: number
  createdAt: string
  liked: boolean
}

export const cleanTitle = (t: unknown) => (typeof t === 'string' ? t.trim().replace(/\s+/g, ' ') : '')

const TITLE_RE = /^[\p{L}\p{N} .,!?'’":;()&+\-–]+$/u

/**
 * Kaba söz süzgeci: basit bir liste. Sözcük tam eşleşirse (kısa ve başka sözcüğün içinde geçebilecekler) ya da
 * sözcük köküyle başlarsa ("götür" masum olduğundan göt yalnız tam eşleşir); uzun ve belirgin olanlar boşluklar
 * atılmış metinde de aranır ("o r o s p u").
 */
const EXACT = ['aq', 'amk', 'amq', 'mk', 'oç', 'oc', 'göt', 'got', 'sik', 'sg', 'siktir', 'yarak', 'yarrak', 'piç', 'pic', 'am', 'amcık', 'gavat', 'kahpe', 'fuck', 'shit', 'cunt', 'dick', 'bitch']
const PREFIX = ['orospu', 'orspu', 'sikt', 'sikiş', 'sikis', 'sikerim', 'sikim', 'yarra', 'amcı', 'amına', 'amina', 'ananı', 'anani', 'ibne', 'pezevenk', 'kaltak', 'yavşak', 'yavsak', 'götveren', 'gotveren', 'fuck', 'bitch', 'nigg', 'fag']
const SQUASHED = ['orospu', 'yarrak', 'pezevenk', 'siktir', 'fuck', 'bitch']

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' }

export function isRude(text: string): boolean {
  const low = Array.from(text.toLocaleLowerCase('tr'), (ch) => LEET[ch] ?? ch).join('')
  const words = low.split(/[^\p{L}]+/u).filter(Boolean)
  if (words.some((w) => EXACT.includes(w) || PREFIX.some((p) => w.startsWith(p)))) return true
  // harfleri tekrarlayarak ya da boşlukla bölerek kaçmak: "oroosssspu", "s i k t i r"
  const squashed = words.join('').replace(/(\p{L})\1+/gu, '$1')
  return SQUASHED.some((s) => squashed.includes(s.replace(/(\p{L})\1+/gu, '$1')))
}

/** Başlıktaki ilk sorun (Türkçe; arayüz t() ile çevirir) ya da null */
export function titleProblem(raw: unknown): string | null {
  const t = cleanTitle(raw)
  if (t.length < TITLE_MIN || t.length > TITLE_MAX) return 'Başlık 3–40 karakter olmalı.'
  if (!TITLE_RE.test(t)) return 'Başlıkta yalnız harf, rakam ve noktalama olabilir.'
  if (isRude(t)) return 'Bu başlık yayınlanamaz; başka bir ad dene.'
  return null
}
