'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { drawKeepsake, drawThing } from '@/game/enemyDraw'
import type { CityKey } from '@/game/types'

const cache = new Map<string, string>()

/** Şehrin hatıra çizimi, küçük bir simge olarak (oyundaki vektör çizimin aynısı). */
export function ItemIcon({ city, taken, size = 18 }: { city: CityKey; taken: boolean; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url = cache.get(city)
    if (!url) {
      const cv = document.createElement('canvas')
      cv.width = cv.height = 72
      drawKeepsake(cv.getContext('2d')!, city, 36, 36, 5, 0)
      url = cv.toDataURL()
      cache.set(city, url)
    }
    setSrc(url)
  }, [city])
  if (!src) return <span style={{ width: size, height: size }} className="inline-block" />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      className={`inline-block transition-[filter,opacity] duration-300 ${taken ? 'drop-shadow-[0_0_4px_rgba(242,193,78,0.7)]' : 'opacity-35 brightness-0 invert-[0.35]'}`}
    />
  )
}

/** Gizli pul ya da nazar boncuğu simgesi (oyundaki çizimin aynısı); bulunmamışsa soluk siluet. */
export function ThingIcon({ kind, taken, size = 18 }: { kind: 'stamp' | 'charm'; taken: boolean; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url = cache.get(kind)
    if (!url) {
      const cv = document.createElement('canvas')
      cv.width = cv.height = 72
      drawThing(cv.getContext('2d')!, kind, 36, 36, kind === 'stamp' ? 4.2 : 4.6, 0)
      url = cv.toDataURL()
      cache.set(kind, url)
    }
    setSrc(url)
  }, [kind])
  if (!src) return <span style={{ width: size, height: size }} className="inline-block" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt="" className={`inline-block ${taken ? '' : 'opacity-35 brightness-0 invert-[0.35]'}`} />
}

export function Key({ children, wide = false, dim = false }: { children: React.ReactNode; wide?: boolean; dim?: boolean }) {
  return (
    <kbd
      className={`inline-flex h-7 items-center justify-center px-2 font-mono text-[12px] font-bold leading-none transition-opacity duration-200 ${wide ? 'min-w-[64px]' : 'min-w-7'} ${dim ? 'opacity-40' : ''}`}
      style={{
        background: 'linear-gradient(180deg,#3a3250,#2a2438)',
        color: '#f4ead8',
        boxShadow: '0 -2px 0 0 #4a4160, 0 2px 0 0 #120f1a, -2px 0 0 0 #3d3550, 2px 0 0 0 #3d3550, inset 0 -3px 0 rgba(0,0,0,0.35)',
      }}
    >
      {children}
    </kbd>
  )
}

/** Masaüstü tuş ipuçları: oyuncu hareketsiz kaldıkça belirginleşir; atılma tuşu hazır olunca parlar. */
export function KeyHints({ canDash, idle }: { canDash: boolean; idle: boolean }) {
  const t = useT()
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 transition-opacity duration-500 ${idle ? 'opacity-100' : 'opacity-30'}`}
      aria-hidden
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-ink/70 px-4 py-2.5 text-[12px] text-cream/90 [box-shadow:0_-2px_0_0_#3d3550,0_2px_0_0_#3d3550,-2px_0_0_0_#3d3550,2px_0_0_0_#3d3550]">
        <span className="flex items-center gap-1.5">
          <Key>←</Key>
          <Key>→</Key>
          {t('Yürü')}
        </span>
        <span className="flex items-center gap-1.5">
          <Key>↑</Key>
          {t('Zıpla')}
        </span>
        <span className={`flex items-center gap-1.5 ${canDash ? 'text-gold' : 'text-muted'}`}>
          <Key wide dim={!canDash}>
            Space
          </Key>
          {t('Atıl')}
          <span className={`inline-block h-2 w-2 ${canDash ? 'bg-[#d6403a] shadow-[0_0_6px_#d6403a]' : 'bg-[#7f8ca8]'}`} />
        </span>
        <span className="flex items-center gap-1.5">
          <Key>Esc</Key>
          {t('Mola')}
        </span>
      </div>
    </div>
  )
}
