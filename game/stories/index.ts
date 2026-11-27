import { BATI } from './bati'
import { DEFTER2A } from './defter2a'
import { DEFTER2B } from './defter2b'
import { DEFTER2C } from './defter2c'
import { DEFTER2D } from './defter2d'
import { GUNEYDOGU } from './guneydogu'
import { IC } from './ic'
import { KARADENIZ } from './karadeniz'
import { STORY_KUTAHYA } from './kutahya'
import { STORY_SAMSUN } from './samsun'
import type { Talk } from './types'

export * from './types'

/** Bütün konuşmalar, şehir insanının (Türkçe) adıyla. Dosyalar bölgeye göre bölünür; yenisi buraya eklenir. */
export const STORIES: Record<string, Talk> = { ...BATI, ...IC, ...GUNEYDOGU, ...KARADENIZ, ...DEFTER2A, ...DEFTER2B, ...DEFTER2C, ...DEFTER2D, ...STORY_KUTAHYA, ...STORY_SAMSUN }

export const STORY_KEYS = Object.keys(STORIES)
export const talkOf = (name: string): Talk | undefined => (Object.hasOwn(STORIES, name) ? STORIES[name] : undefined)
