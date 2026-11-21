/**
 * Son oynanan şehirler: yalnız bu tarayıcının kolaylığı (şehir seçicinin "Son" şeridi, Modlar'daki "Devam Et").
 * Depo kapalı ya da dolu olabilir; her okuma ve yazma korunur, çalışmazsa boş döner.
 */
const KEY = 'seksek:recent'
const MAX = 6

export function recentCities(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX) : []
  } catch {
    return []
  }
}

export function rememberCity(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([id, ...recentCities().filter((x) => x !== id)].slice(0, MAX)))
  } catch {
    /* depo yok */
  }
}

/** Son oynanan mod (Modlar ekranındaki "Devam Et" şeridi): kimlik + insan okur ad + serbest ek */
const MODE_KEY = 'seksek:lastMode'
export interface LastMode {
  id: 'rules' | 'rage' | 'chase' | 'rush' | 'marathon' | 'challenges' | 'tournament' | 'duel' | 'coop' | 'mirror' | 'tour' | 'daily-mini' | 'daily-boss'
  /** kurulumdan dönülen şehir ya da kural gibi küçük bilgi */
  note?: string
}

export function lastMode(): LastMode | null {
  try {
    const v = JSON.parse(localStorage.getItem(MODE_KEY) ?? 'null')
    return v && typeof v.id === 'string' ? (v as LastMode) : null
  } catch {
    return null
  }
}

export function rememberMode(m: LastMode) {
  try {
    localStorage.setItem(MODE_KEY, JSON.stringify(m))
  } catch {
    /* depo yok */
  }
}
