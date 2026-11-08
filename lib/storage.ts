import { LEVELS } from '@/game/levels'

/** Haritalar değişince artar: oyuncuya "yenilendi" notu gösterilir, baştan başlama önerilir. */
export const MAP_VERSION = 3

/** Eski sürümlerin şehir sırası: açılan şehir dizinini kimliğiyle yeni sıraya taşımak için */
const ORDERS: Record<number, string[]> = {
  1: ['istanbul', 'kocaeli', 'izmir', 'ankara', 'adana', 'mardin', 'malatya', 'corum', 'ordu', 'sivas', 'ardahan', 'bayburt'],
  2: ['istanbul', 'kocaeli', 'izmir', 'ankara', 'konya', 'nevsehir', 'adana', 'gaziantep', 'mardin', 'malatya', 'corum', 'ordu', 'sivas', 'ardahan', 'bayburt'],
}

export interface Best {
  timeMs: number
  deaths: number
  items: boolean[]
}

export interface Player {
  id: string
  name: string
  token: string
}

export interface Save {
  unlocked: number
  best: Record<string, Best>
  name: string
  sfx: boolean
  music: boolean
  touch: 'auto' | 'on' | 'off'
  character: 'uktun' | 'memo' | null
  seenStory: boolean
  controlSize: 'normal' | 'buyuk'
  keyHints: boolean
  /** Rahat Mod: dünya %80 hızda; skorlar tabloya yazılmaz */
  relaxed: boolean
  /** en iyi koşunun hayaleti görünsün mü */
  ghost: boolean
  player: Player | null
  skippedName: boolean
  stamps: Record<string, boolean>
  /** kaydın ait olduğu harita sürümü */
  mapVersion: number
  /** arayüz dili */
  lang: 'tr' | 'en'
  /** eski sıradan yeni sıraya taşındı mı (aynı sürümde iki kez taşınmasın) */
  migrated?: boolean
  /** hesap sürümü: 2 = kullanıcı adı + şifre; eski şifresiz kimlikler geçersiz */
  accountVersion?: number
}

const KEY = 'seksek:v1'
/** 8 Kasım'a dek anahtar `memleket:v1`di; ilk açılışta yeni anahtara taşınır, ilerleme kaybolmaz. */
const LEGACY_KEY = 'memleket:v1'

export const defaultSave = (): Save => ({ unlocked: 0, best: {}, name: '', sfx: true, music: true, touch: 'auto', character: null, seenStory: false, controlSize: 'normal', keyHints: true, relaxed: false, ghost: true, player: null, skippedName: false, stamps: {}, mapVersion: MAP_VERSION, lang: 'tr', accountVersion: 2 })

export function loadSave(): Save {
  try {
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY)
      if (raw) {
        localStorage.setItem(KEY, raw)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as Partial<Save>
    const s = { ...defaultSave(), ...parsed }
    if (parsed.mapVersion === undefined) s.mapVersion = 1
    // eski sıradaki açılan şehri kimliğiyle yeni sıraya taşı (bir kez; not kapanınca sürüm güncellenir)
    const order = ORDERS[s.mapVersion]
    if (order && !parsed.migrated) {
      const id = order[Math.min(s.unlocked, order.length - 1)]
      const idx = LEVELS.findIndex((l) => l.id === id)
      s.unlocked = idx >= 0 ? idx : 0
      s.migrated = true
    }
    // şifresiz eski yolcu kimlikleri silindi: oyuncu bir kez üye olur ya da giriş yapar
    if ((parsed.accountVersion ?? 1) < 2) {
      s.player = null
      s.skippedName = false
      s.accountVersion = 2
    }
    // eski sürümdeki "ayla" seçimi Uktun'a taşınır
    if ((s.character as string) === 'ayla') s.character = 'uktun'
    if ((s.character as string) === 'kerem') s.character = 'memo'
    return s
  } catch {
    return defaultSave()
  }
}

/** Eski haritalarda ilerlemesi olan oyuncu: "haritalar yenilendi" notunu görmeli */
export const needsMapNotice = (s: Save) => s.mapVersion < MAP_VERSION && (s.unlocked > 0 || Object.keys(s.best).length > 0)

/** Baştan başla: ilerleme sıfırlanır; ad, karakter ve ayarlar kalır */
export const restartJourney = (s: Save): Save => ({ ...s, unlocked: 0, best: {}, stamps: {}, mapVersion: MAP_VERSION, migrated: false })

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* gizli sekme vb. — ilerleme bu oturumla sınırlı kalır */
  }
}

export function formatTime(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${d}`
}
