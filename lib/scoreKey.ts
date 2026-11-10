import { MAP_VERSION } from './storage'

/**
 * Skor satırının bölüm anahtarı: şehir kimliği + harita sürümü ("istanbul@5").
 * Haritalar değişince (MAP_VERSION artınca) tablo temiz bir sayfadan başlar; eski sürümlerin süreleri
 * silinmez ama yeni yolla yarışmaz. Sütun eklemeden, göç gerektirmeden çalışır.
 */
export const scoreKey = (levelId: string) => `${levelId}@${MAP_VERSION}`
export const SCORE_SUFFIX = `@${MAP_VERSION}`
/** anahtardan şehir kimliği; sürümsüz eski satırlar olduğu gibi döner */
export const scoreCity = (key: string) => key.split('@')[0]
