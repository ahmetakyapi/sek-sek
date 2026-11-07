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
}

const KEY = 'memleket:v1'

export const defaultSave = (): Save => ({ unlocked: 0, best: {}, name: '', sfx: true, music: true, touch: 'auto', character: null, seenStory: false, controlSize: 'normal', keyHints: true, player: null, skippedName: false })

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    const s = { ...defaultSave(), ...(JSON.parse(raw) as Partial<Save>) }
    // eski sürümdeki "ayla" seçimi Uktun'a taşınır
    if ((s.character as string) === 'ayla') s.character = 'uktun'
    if ((s.character as string) === 'kerem') s.character = 'memo'
    return s
  } catch {
    return defaultSave()
  }
}

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
