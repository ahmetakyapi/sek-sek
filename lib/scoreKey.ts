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

/** Günlük Meydan Okuma'nın tablo anahtarı: "gunluk:2026-11-14" */
export const dailyScoreKey = (day: string) => `gunluk:${day}`
