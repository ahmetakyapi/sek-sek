'use client'

import { createContext, useContext } from 'react'
import { BOSSES } from '@/game/boss'
import { CHARACTERS_EN, ENDING_EN, LEVELS_EN, STORY_EN } from '@/game/content.en'
import { PRELUDES } from '@/game/finales'
import { SIGNATURES } from '@/game/signatures'
import type { LevelDef } from '@/game/types'
import { UI_EN } from './ui.en'

export type Lang = 'tr' | 'en'

const LangCtx = createContext<Lang>('tr')
export const LangProvider = LangCtx.Provider
export const useLang = () => useContext(LangCtx)

/** Türkçe metni anahtar olarak kullanır: sözlükte yoksa Türkçesi görünür. {ad} yer tutucularını doldurur. */
export function makeT(lang: Lang) {
  return (s: string, vars?: Record<string, string | number>) => {
    let out = lang === 'en' ? (UI_EN[s] ?? s) : s
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
    return out
  }
}

export const useT = () => makeT(useLang())

const cache = new Map<string, LevelDef>()

/** Bölümün metinlerini seçili dile çevirir; harita ve sayılar aynı kalır. */
export function localize(level: LevelDef, lang: Lang): LevelDef {
  if (lang === 'tr') return level
  const en = LEVELS_EN[level.id]
  if (!en) return level
  const hit = cache.get(level.id)
  if (hit) return hit
  // imza bölümünün ipucu ve kişisi, Türkçedekiyle aynı sıraya girer
  const sig = SIGNATURES[level.id]
  let hints = en.hints
  let npcs = en.npcs
  if (sig?.hintAt !== undefined) hints = [...hints.slice(0, sig.hintAt), ...sig.en.hints, ...hints.slice(sig.hintAt)]
  if (sig?.npcAt !== undefined) npcs = [...npcs.slice(0, sig.npcAt), ...sig.en.npcs, ...npcs.slice(sig.npcAt)]
  // final: meydan yolunun ipuçları ve boss’un nasıl yenileceği en sona eklenir
  const pre = PRELUDES[level.city]
  const at = level.finaleAt ?? { hint: hints.length, npc: npcs.length }
  hints = [...Array.from({ length: at.hint }, (_, i) => hints[i] ?? level.hints[i] ?? ''), ...pre.hintsEn, BOSSES[level.city].tauntEn]
  npcs = [...npcs.slice(0, at.npc), ...(pre.npcsEn ?? [])]
  const out: LevelDef = {
    ...level,
    subtitle: en.subtitle,
    item: en.item,
    intro: en.intro,
    note: en.note,
    facts: en.facts,
    secret: en.secret,
    hints: hints.length === level.hints.length ? hints : level.hints,
    npcs: level.npcs.map((n, i) => (npcs[i] ? { ...n, name: npcs[i].name, text: npcs[i].text } : n)),
    quips: en.quips,
  }
  cache.set(level.id, out)
  return out
}

export const storyFor = (lang: Lang) => (lang === 'en' ? STORY_EN : null)
export const endingFor = (lang: Lang) => (lang === 'en' ? ENDING_EN : null)
export const characterFor = (lang: Lang, id: 'uktun' | 'memo') => (lang === 'en' ? CHARACTERS_EN[id] : null)
