'use client'

import { useEffect, useState } from 'react'
import { CITY, CREATURE_NAMES, ENEMY_ART, enemyArt, rect, sprite, type Ctx } from '@/game/art'
import { Renderer } from '@/game/render'
import type { LevelDef } from '@/game/types'
import { CREATURE_NAMES_EN } from '@/game/content.en'
import { useLang, useT } from '@/lib/i18n'

interface Entry {
  id: string
  /** CREATURE_NAMES anahtarı */
  key: string
  name: string
  note: string
  friend: boolean
  draw: (c: Ctx) => void
}

const OUTLINE = (pal: Record<string, string>, col: string) => Object.fromEntries(Object.keys(pal).map((k) => [k, col]))

function enemyEntry(id: string, key: string, note: string, art: { frames: string[][]; pal: Record<string, string> }): Entry {
  const rows = art.frames[0]
  return {
    id,
    key,
    name: CREATURE_NAMES[key] ?? key,
    note,
    friend: false,
    draw: (c) => {
      const ox = Math.floor((20 - rows[0].length) / 2)
      const oy = Math.floor((20 - rows.length) / 2) + 1
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) sprite(c, rows, OUTLINE(art.pal, '#e8283a'), ox + dx, oy + dy)
      sprite(c, rows, art.pal, ox, oy)
    },
  }
}

/** Bölümün haritasından kim var, kim yok: dost hayvan ve tehlikeler */
export function bestiary(level: LevelDef): Entry[] {
  const s = CITY[level.city]
  const has = (ch: string) => level.map.some((r) => r.includes(ch))
  const out: Entry[] = []
  if (has('k'))
    out.push({
      id: 'friend',
      key: s.animal,
      name: CREATURE_NAMES[s.animal] ?? 'Dost',
      note: 'Dost: yanına git, sev',
      friend: true,
      draw: (c) => {
        // oyundaki çizimle aynı: Renderer'ın hayvan çizicisini küçük tuvalde kullan
        const fake = { t: 0, city: level.city }
        ;(Renderer.prototype as unknown as { drawAnimal: (this: unknown, b: Ctx, x: number, bot: number) => void }).drawAnimal.call(fake, c, 2, 18)
      },
    })
  if (has('e')) out.push(enemyEntry('e', s.enemyGround, 'Isırır: üstüne bas', enemyArt('ground', level.city)))
  if (has('f')) out.push(enemyEntry('f', s.enemyFly, 'Uçar: üstüne bas', enemyArt('fly', level.city)))
  if (has('h')) out.push(enemyEntry('h', enemyArt('hopper', level.city) === ENEMY_ART.hare ? 'hare' : 'frog', 'Sana doğru sıçrar', enemyArt('hopper', level.city)))
  if (has('c')) out.push(enemyEntry('c', 'ram', 'Görünce hücum eder', ENEMY_ART.ram))
  if (has('u')) out.push(enemyEntry('u', 'bat', 'Dalgalanarak uçar', ENEMY_ART.bat))
  if (has('x')) out.push(enemyEntry('x', 'hedgehog', 'Dikenli: üstüne basma!', ENEMY_ART.hedgehog))
  if (has('j')) out.push(enemyEntry('j', 'magpie', 'Daldan sana dalar: kanat çırpınca kaç', ENEMY_ART.magpie))
  if (has('Y'))
    out.push({
      id: 'Y',
      key: 'hammer',
      name: 'Bakır Tokmak',
      note: 'Titreyince bekle',
      friend: false,
      draw: (c) => {
        rect(c, 9, 0, 2, 8, '#5a3c26')
        rect(c, 2, 8, 16, 10, '#b8682e')
        rect(c, 2, 8, 16, 2, '#e8904a')
        rect(c, 2, 16, 16, 2, '#7a3a14')
        rect(c, 4, 11, 3, 4, '#f0b070')
      },
    })
  if (has('>') || has('<'))
    out.push({
      id: 'arrow',
      key: 'arrow',
      name: 'Ok Tuzağı',
      note: 'Aralıkla ok atar',
      friend: false,
      draw: (c) => {
        rect(c, 2, 4, 8, 12, '#5d6478')
        rect(c, 10, 9, 8, 2, '#e8dcc0')
        rect(c, 16, 8, 2, 4, '#e8dcc0')
      },
    })
  return out
}

function Icon({ entry }: { entry: Entry }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const cv = document.createElement('canvas')
    cv.width = 20
    cv.height = 20
    const c = cv.getContext('2d')!
    entry.draw(c)
    setSrc(cv.toDataURL())
  }, [entry])
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center bg-ink/60 [box-shadow:inset_0_0_0_2px_#3d3550]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" width={40} height={40} className="h-10 w-10" style={{ imageRendering: 'pixelated' }} />}
    </span>
  )
}

/** Giriş ekranı rehberi: dost yeşil, tehlike kırmızı çerçeveli */
export default function Bestiary({ level }: { level: LevelDef }) {
  const t = useT()
  const lang = useLang()
  const [list, setList] = useState<Entry[]>([])
  useEffect(() => setList(bestiary(level)), [level])
  if (!list.length) return null
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold tracking-[0.22em] text-muted">{t('BU ŞEHİRDE')}</p>
      <ul className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {list.map((e) => (
          <li key={e.id} className={`flex min-w-0 items-center gap-2 border-2 py-1 pl-1 pr-2.5 ${e.friend ? 'border-[#4f9a5a] bg-[#4f9a5a]/10' : 'border-[#c8283a]/80 bg-[#c8283a]/10'}`}>
            <Icon entry={e} />
            <span className="leading-tight">
              <span className="block truncate font-display text-[13px] text-cream">{lang === 'en' ? (CREATURE_NAMES_EN[e.key] ?? t(e.name)) : e.name}</span>
              <span className={`block text-[11px] leading-snug ${e.friend ? 'text-[#8fd09a]' : 'text-[#ff8a8a]'}`}>{t(e.note)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
