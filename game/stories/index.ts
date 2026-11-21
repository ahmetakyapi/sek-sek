import { BATI } from './bati'
import { DEFTER2A } from './defter2a'
import { DEFTER2B } from './defter2b'
import { GUNEYDOGU } from './guneydogu'
import { IC } from './ic'
import { KARADENIZ } from './karadeniz'
import type { Talk } from './types'

export * from './types'

/** Bütün konuşmalar, şehir insanının (Türkçe) adıyla. Dosyalar bölgeye göre bölünür; yenisi buraya eklenir. */
export const STORIES: Record<string, Talk> = { ...BATI, ...IC, ...GUNEYDOGU, ...KARADENIZ, ...DEFTER2A, ...DEFTER2B }

export const STORY_KEYS = Object.keys(STORIES)
export const talkOf = (name: string): Talk | undefined => (Object.hasOwn(STORIES, name) ? STORIES[name] : undefined)
