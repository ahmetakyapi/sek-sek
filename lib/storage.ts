export interface Best {
  timeMs: number
  deaths: number
  items: boolean[]
}

export interface Save {
  unlocked: number
  best: Record<string, Best>
  name: string
  sfx: boolean
  music: boolean
  touch: 'auto' | 'on' | 'off'
  character: 'ayla' | 'kerem' | null
  seenStory: boolean
  controlSize: 'normal' | 'buyuk'
}

const KEY = 'memleket:v1'

export const defaultSave = (): Save => ({ unlocked: 0, best: {}, name: '', sfx: true, music: true, touch: 'auto', character: null, seenStory: false, controlSize: 'normal' })

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    return { ...defaultSave(), ...(JSON.parse(raw) as Partial<Save>) }
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
