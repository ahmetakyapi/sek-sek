import { LEVELS } from '@/game/levels'

/** Haritalar değişince artar: oyuncuya "yenilendi" notu gösterilir, baştan başlama önerilir. */
export const MAP_VERSION = 2

/** v1'deki şehir sırası: açılan şehir dizinini yeni sıraya taşımak için */
const ORDER_V1 = ['istanbul', 'kocaeli', 'izmir', 'ankara', 'adana', 'mardin', 'malatya', 'corum', 'ordu', 'sivas', 'ardahan', 'bayburt']

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
  player: Player | null
  skippedName: boolean
  stamps: Record<string, boolean>
  /** kaydın ait olduğu harita sürümü */
  mapVersion: number
  /** arayüz dili */
  lang: 'tr' | 'en'
}

const KEY = 'memleket:v1'

export const defaultSave = (): Save => ({ unlocked: 0, best: {}, name: '', sfx: true, music: true, touch: 'auto', character: null, seenStory: false, controlSize: 'normal', keyHints: true, player: null, skippedName: false, stamps: {}, mapVersion: MAP_VERSION, lang: 'tr' })

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as Partial<Save>
    const s = { ...defaultSave(), ...parsed }
    if (parsed.mapVersion === undefined) {
      // v1 kaydı: açılan şehri kimliğiyle yeni sıraya taşı
      s.mapVersion = 1
      const id = ORDER_V1[Math.min(s.unlocked, ORDER_V1.length - 1)]
      const idx = LEVELS.findIndex((l) => l.id === id)
      s.unlocked = idx >= 0 ? idx : 0
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
export const restartJourney = (s: Save): Save => ({ ...s, unlocked: 0, best: {}, stamps: {}, mapVersion: MAP_VERSION })

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
