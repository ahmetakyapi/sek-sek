import { LEVELS } from '@/game/levels'

/**
 * Skor satırının bölüm anahtarı: şehir kimliği + kalıcı ek ("istanbul@s"). Sıralama hiçbir güncellemede silinmez:
 * harita yenilense de skorlar yerinde kalır (kullanıcı kararı, 14 Kasım 2026). Eski anahtarlar ("istanbul@8",
 * "istanbul@<özet>") göç 0006 ile buraya taşındı; satırları duruyor ama okunmuyor.
 */
export const scoreKey = (levelId: string) => `${levelId}@s`
/** bütün şehirlerin bugünkü anahtarları (genel sıralama yalnız bunları sayar) */
export const currentKeys = () => LEVELS.map((l) => scoreKey(l.id))
/** anahtardan şehir kimliği; sürümsüz eski satırlar olduğu gibi döner */
export const scoreCity = (key: string) => key.split('@')[0]

/** Speedrun kategorileri: %100 şehir koşusu ("yuzde:istanbul"), ilk defterin tam turu ("tur") ve aynalı tam tur ("aynatur") */
export const fullScoreKey = (levelId: string) => `yuzde:${levelId}`
export const TOUR_KEYS = ['tur', 'aynatur'] as const
export type TourKey = (typeof TOUR_KEYS)[number]

/** Günlük Meydan Okuma'nın tablo anahtarı: "gunluk:2026-11-14" */
export const dailyScoreKey = (day: string) => `gunluk:${day}`

/** Mücadele haritasının tablo anahtarı: "mucadele-corum-leblebi" → "mucadele:corum-leblebi" */
export const challengeScoreKey = (levelId: string) => `mucadele:${levelId.slice('mucadele-'.length)}`
