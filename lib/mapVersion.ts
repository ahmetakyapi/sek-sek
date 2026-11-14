import { LEVELS } from '@/game/levels'

/**
 * Şehir başına harita sürümü: bölümün birleşmiş haritasının (ana yol + final + kolaylık yamaları) kısa özeti.
 * Bir şehrin haritası değişince yalnız o şehrin rekorları ve skor tablosu yeni sayfadan başlar; ötekiler olduğu
 * gibi kalır. Elle artırılan bir sayı yok: harita değişirse özet kendiliğinden değişir.
 */
function digest(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}

const cache = new Map<string, string>()

/** şehrin bugünkü harita sürümü (bilinmeyen kimlikte boş metin) */
export function cityVersion(id: string): string {
  let v = cache.get(id)
  if (v === undefined) {
    const l = LEVELS.find((x) => x.id === id)
    v = l ? digest(l.map.join('\n')) : ''
    cache.set(id, v)
  }
  return v
}

/**
 * Şehir başına sürümden önceki kayıtlar (yalnız genel MAP_VERSION taşıyan rekorlar): o sürümde şehrin haritası
 * neydi. 14 Kasım 2026'da eski çalışma ağaçlarından hesaplandı. Sürüm 7 → 8 geçişinde var olan 25 haritanın hiçbiri
 * değişmemişti (yalnız Kayseri, Hatay, Eskişehir eklendi); 6 → 7'de beş şehrin haritası değişti.
 */
const AT_V7: Record<string, string> = {
  istanbul: '1sv4xzt', edirne: '1dneooe', kocaeli: '1ggkzs5', bursa: '1p7g6uy', canakkale: '1iyvdqy', izmir: '1aaqgd6', antalya: 'nh2jzg',
  ankara: '81ar1c', konya: 'h1hq6z', nevsehir: 'mpsqhu', adana: '1pchp4f', gaziantep: 'f6045h', sanliurfa: '1h7p66s', diyarbakir: '22452d',
  mardin: 'rjpmbo', malatya: '1cjo61s', corum: '1df0pfz', sinop: 'upmmd4', ordu: '5gw88x', trabzon: '1hq2xv8', sivas: 'ugob7c', van: '1j5ieyt',
  erzurum: '1ij234b', ardahan: '782qd9', bayburt: '17desu6',
}
const CHANGED_AT_V7 = ['istanbul', 'adana', 'ordu', 'trabzon', 'bayburt']
const AT_V8: Record<string, string> = { ...AT_V7, eskisehir: 'iebt82', kayseri: 'rqq9ei', hatay: 'we4qxd' }

/** Sürümsüz eski rekorun hangi haritada koşulduğu (bilinmiyorsa null: o rekor eski sayılır) */
export function legacyVersion(id: string, mapVersion: number): string | null {
  if (mapVersion >= 8) return AT_V8[id] ?? null
  if (mapVersion === 7) return AT_V7[id] ?? null
  if (mapVersion === 6) return CHANGED_AT_V7.includes(id) ? null : (AT_V7[id] ?? null)
  return null
}
