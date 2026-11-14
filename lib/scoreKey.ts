import { LEVELS } from '@/game/levels'
import { cityVersion } from './mapVersion'

/**
 * Skor satırının bölüm anahtarı: şehir kimliği + şehrin harita sürümü ("istanbul@1sv4xzt").
 * Bir şehrin haritası değişince yalnız o şehrin tablosu temiz sayfadan başlar; eski satırlar silinmez ama yeni yolla
 * yarışmaz. Öteki şehirlerin tabloları olduğu gibi kalır. Sütun eklemeden, göç gerektirmeden çalışır.
 */
export const scoreKey = (levelId: string) => `${levelId}@${cityVersion(levelId)}`
/** bütün şehirlerin bugünkü anahtarları (genel sıralama yalnız bunları sayar) */
export const currentKeys = () => LEVELS.map((l) => scoreKey(l.id))
/** anahtardan şehir kimliği; sürümsüz eski satırlar olduğu gibi döner */
export const scoreCity = (key: string) => key.split('@')[0]

/** Günlük Meydan Okuma'nın tablo anahtarı: "gunluk:2026-11-14" */
export const dailyScoreKey = (day: string) => `gunluk:${day}`
