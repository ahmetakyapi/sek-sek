'use client'

import { useEffect, useState } from 'react'
import type { CharacterId } from '@/game/characters'
import { PORTRAITS } from '@/game/portraits'

/** Piksel portreyi tek seferde PNG'ye çevirip önbelleğe alır (açık + kırpık göz). */
const cache = new Map<string, { open: string; closed: string }>()

function toUrl(rows: string[], pal: Record<string, string>) {
  const cv = document.createElement('canvas')
  cv.width = rows[0].length
  cv.height = rows.length
  const c = cv.getContext('2d')!
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const col = pal[r[x]]
      if (!col) continue
      c.fillStyle = col
      c.fillRect(x, y, 1, 1)
    }
  })
  return cv.toDataURL('image/png')
}

export default function Portrait({ id, className = '' }: { id: CharacterId; className?: string }) {
  const [src, setSrc] = useState<{ open: string; closed: string } | null>(null)
  useEffect(() => {
    let v = cache.get(id)
    if (!v) {
      const p = PORTRAITS[id]
      v = { open: toUrl(p.rows, p.pal), closed: toUrl(p.closed, p.pal) }
      cache.set(id, v)
    }
    setSrc(v)
  }, [id])
  const name = id === 'uktun' ? 'Uktun' : 'Memo Çelik'
  return (
    <span className={`relative block aspect-[64/76] ${className}`} role="img" aria-label={`${name} portresi`}>
      {src && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src.open} alt="" className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src.closed} alt="" className="portrait-blink-img absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} draggable={false} />
        </>
      )}
    </span>
  )
}

/** Yüz bölgesi (alın, gözler, çene) */
const FACE = { x: 13, y: 16, w: 38, h: 38 }

/**
 * Göstergedeki küçük portre: yüz bölgesi 1:1 kırpılır, CSS pikseline tam oturur (retinada 2x/3x keskin kalır).
 * Altın çerçeveli bir posta pulu gibi durur, arada göz kırpar.
 */
export function PortraitFace({ id, scale = 1 }: { id: CharacterId; scale?: 1 | 2 }) {
  const [src, setSrc] = useState<{ open: string; closed: string } | null>(null)
  useEffect(() => {
    const p = PORTRAITS[id]
    const crop = (rows: string[]) => rows.slice(FACE.y, FACE.y + FACE.h).map((r) => r.slice(FACE.x, FACE.x + FACE.w))
    setSrc({ open: toUrl(crop(p.rows), p.pal), closed: toUrl(crop(p.closed), p.pal) })
  }, [id])
  const size = FACE.w * scale
  return (
    <span className="relative block shrink-0 bg-[#f4ead8] p-[2px] [box-shadow:0_0_0_2px_#d9a441,0_2px_0_2px_rgba(0,0,0,0.35)]" style={{ width: size + 4, height: size + 4 }} aria-hidden>
      {src && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src.open} alt="" width={size} height={size} className="absolute left-[2px] top-[2px]" style={{ imageRendering: 'pixelated', width: size, height: size }} draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src.closed} alt="" width={size} height={size} className="portrait-blink-img absolute left-[2px] top-[2px]" style={{ imageRendering: 'pixelated', width: size, height: size }} draggable={false} />
        </>
      )}
    </span>
  )
}
