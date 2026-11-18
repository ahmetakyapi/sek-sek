'use client'
import { SectionTitle } from '@/components/ui'

import { useEffect, useState } from 'react'
import { CITY, CREATURE_NAMES, enemySpecies, rect, type Ctx } from '@/game/art'
import { drawEnemy, drawFriend, drawThing } from '@/game/enemyDraw'
import type { EnemyKind } from '@/game/sim'
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
  /** yetenek / nesne (mavi çerçeve): ne işe yaradığı anlatılır */
  help?: boolean
  draw: (c: Ctx) => void
}

/** Bölümdeki yetenek ve nesneler: çizimi ve tek satırda ne yaptığı (oyuncu ilk görüşte anlasın) */
function helpEntries(level: LevelDef): Entry[] {
  const has = (ch: string) => level.map.some((r) => r.includes(ch))
  const th = (kind: 'crystal' | 'spring' | 'nitro', y = 11) => (c: Ctx) => drawThing(c as unknown as CanvasRenderingContext2D, kind, 10, y, 1.15, 0.4, { active: true, ready: true, charge: 1 })
  const out: Entry[] = []
  const add = (id: string, name: string, note: string, draw: (c: Ctx) => void) => out.push({ id, key: id, name, note, friend: false, help: true, draw })
  if (has('T')) add('T', 'Nitro', '3 sn çok hızlı koşu; uzun atlarsın. Alınca yeniden dolar', th('nitro', 12))
  if (has('*')) add('*', 'Dash Halkası', 'Havada dash hakkını geri verir: bir dash daha', th('crystal', 10))
  if (has('S')) add('S', 'Yay', 'Üstüne in, yükseğe fırlat. İnerken zıplarsan daha yükseğe', th('spring', 13))
  if (has('{') || has('}'))
    add('{', 'Ritim Blokları', 'Turuncu ve turkuaz sırayla belirir; yanıp sönen kaybolur', (c) => {
      rect(c, 1, 6, 8, 8, '#ff9a7a')
      rect(c, 11, 6, 8, 8, 'rgba(90,214,198,0.35)')
      rect(c, 1, 6, 8, 2, '#ffd0bf')
    })
  if (has('L'))
    add('L', 'Halat', 'Havada değince tutun; ↑ ↓ tırman, zıplayınca bırak', (c) => {
      rect(c, 9, 0, 2, 20, '#c49a5a')
      for (let y = 2; y < 20; y += 4) rect(c, 9, y, 2, 1, '#8a6436')
    })
  if (has('R'))
    add('R', 'Teleferik', 'Altından zıpla, asıl; ← → ile git, ↓ ile bırak', (c) => {
      rect(c, 0, 5, 20, 1, '#8f96a3')
      rect(c, 6, 6, 8, 9, '#d6403a')
      rect(c, 7, 8, 6, 3, '#bfefff')
    })
  if (has('W'))
    add('W', 'Derin Su', 'Yüzülür: zıplama kulaçtır. Kabarcıklar nefesin, bitmeden çık', (c) => {
      rect(c, 0, 6, 20, 14, '#3fa9b8')
      rect(c, 0, 6, 20, 1, '#e8fbff')
      for (const [x, y] of [[5, 13], [12, 10], [15, 15]]) rect(c, x, y, 2, 2, '#e8fbff')
    })
  if (has('~'))
    add('~', 'Öldüren Su', 'Sivri köpüklü koyu su: girme, üstünden atla', (c) => {
      rect(c, 0, 8, 20, 12, '#1d3a6a')
      for (let x = 0; x < 20; x += 4) rect(c, x, 6, 1, 3, '#f4f8ff')
    })
  if (has('X'))
    add('X', 'Çatlak Taş', 'Basınca çöker: durma, koşarak geç', (c) => {
      rect(c, 2, 6, 16, 12, '#7a6a5a')
      rect(c, 9, 6, 1, 6, '#2a2026')
      rect(c, 7, 11, 3, 1, '#2a2026')
      rect(c, 10, 12, 1, 6, '#2a2026')
    })
  if (has('i'))
    add('i', 'Islak Taş', 'Kaygandır: erken dur', (c) => {
      rect(c, 2, 8, 16, 10, '#5a7488')
      rect(c, 2, 8, 16, 2, '#2896be')
      rect(c, 5, 12, 3, 1, '#bfefff')
    })
  return out
}

const BOX: Partial<Record<EnemyKind, [number, number]>> = { charger: [14, 12], fly: [12, 8], bat: [12, 8], spiky: [12, 9], magpie: [12, 9], shark: [28, 12], piranha: [10, 8] }

function enemyEntry(id: string, kind: EnemyKind, city: LevelDef['city'], note: string): Entry {
  const key = enemySpecies(kind, city)
  const [w, h] = BOX[kind] ?? [12, 10]
  const air = kind === 'fly' || kind === 'bat'
  return {
    id,
    key,
    name: CREATURE_NAMES[key] ?? key,
    note,
    friend: false,
    draw: (c) => drawEnemy(c, key, { kind, state: 'idle', w, h, phase: 0.08, timer: 0.3 }, 10, air ? 14 : 17, 1.15, 1, 0.3),
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
      draw: (c) => drawFriend(c, s.animal, 10, 18, 1.05, 0.3, false),
    })
  if (has('e')) out.push(enemyEntry('e', 'ground', level.city, 'Isırır: üstüne bas'))
  if (has('f')) out.push(enemyEntry('f', 'fly', level.city, 'Uçar: üstüne bas'))
  if (has('h')) out.push(enemyEntry('h', 'hopper', level.city, 'Sana doğru sıçrar'))
  if (has('c')) out.push(enemyEntry('c', 'charger', level.city, 'Görünce hücum eder'))
  if (has('u')) out.push(enemyEntry('u', 'bat', level.city, 'Dalgalanarak uçar'))
  if (has('x')) out.push(enemyEntry('x', 'spiky', level.city, 'Dikenli: üstüne basma!'))
  if (has('j')) out.push(enemyEntry('j', 'magpie', level.city, 'Daldan sana dalar: kanat çırpınca kaç'))
  if (has('y')) out.push(enemyEntry('y', 'shark', level.city, 'Esoli suda devriye gezer; titreyince hamle yapar, ezilmez: yolundan çekil'))
  if (has('U')) out.push(enemyEntry('U', 'piranha', level.city, 'Kısa mesafede gidip gelir: arayı kolla ya da üstüne bas'))
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

function Icon({ entry, small = false }: { entry: Entry; small?: boolean }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const cv = document.createElement('canvas')
    cv.width = 80
    cv.height = 80
    const c = cv.getContext('2d')!
    c.scale(4, 4)
    entry.draw(c)
    setSrc(cv.toDataURL())
  }, [entry])
  return (
    <span className={`grid shrink-0 place-items-center bg-ink/60 [box-shadow:inset_0_0_0_2px_#37337a] ${small ? 'h-7 w-7' : 'h-10 w-10'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" width={40} height={40} className={small ? 'h-7 w-7' : 'h-10 w-10'} />}
    </span>
  )
}

/** Giriş ekranı rehberi: dost yeşil, tehlike kırmızı çerçeveli */
export default function Bestiary({ level, only }: { level: LevelDef; /** canlılar (dost, tehlike) ya da yetenekler; yoksa ikisi */ only?: 'creatures' | 'help' }) {
  const t = useT()
  const lang = useLang()
  const [list, setList] = useState<Entry[]>([])
  useEffect(() => setList([...(only === 'help' ? [] : bestiary(level)), ...(only === 'creatures' ? [] : helpEntries(level))]), [level, only])
  if (!list.length) return null
  return (
    <div className={only === 'help' ? 'mt-3' : 'mt-4'}>
      <SectionTitle title={only === 'help' ? t('Yolda Ne Var') : t('Bu Şehirde')} note={only === 'help' ? t('Ne işe yarar') : t('Dostlar ve düşmanlar')} tone={only === 'help' ? 'var(--color-accent-2)' : 'var(--color-coral)'} />
      <ul className={`mt-1.5 grid ${only === 'help' ? 'gap-1' : 'gap-2 sm:grid-cols-2'}`}>
        {list.map((e) =>
          only === 'help' ? (
            // yetenek: tek satır (simge, ad, ne yaptığı); sol sütuna sığar
            <li key={e.id} className="flex min-w-0 items-center gap-2 border-2 border-[#4a8ad8]/70 bg-[#4a8ad8]/10 py-0.5 pl-0.5 pr-2">
              <Icon entry={e} small />
              <span className="min-w-0 truncate text-[12px] leading-tight">
                <strong className="font-display text-[13px] font-normal text-cream">{t(e.name)}</strong> <span className="text-[#9cc8ff]">{t(e.note)}</span>
              </span>
            </li>
          ) : (
            <li key={e.id} className={`flex min-w-0 items-center gap-2 border-2 py-1 pl-1 pr-2.5 ${e.friend ? 'border-[#4f9a5a] bg-[#4f9a5a]/10' : 'border-[#c8283a]/80 bg-[#c8283a]/10'}`}>
              <Icon entry={e} />
              <span className="leading-tight">
                <span className="block truncate font-display text-[13px] text-cream">{lang === 'en' ? (CREATURE_NAMES_EN[e.key] ?? t(e.name)) : e.name}</span>
                <span className={`block text-[12px] leading-snug ${e.friend ? 'text-[#8fd09a]' : 'text-[#ff8a8a]'}`}>{t(e.note)}</span>
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
