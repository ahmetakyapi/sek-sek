'use client'

import { useEffect, useState } from 'react'
import type { CharacterId } from '@/game/characters'
import { PORTRAITS, blinkRows } from '@/game/portraits'

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

export default function Portrait({ id, className = '' }: { id: CharacterId; className?: string; mood?: 'smile' | 'calm' }) {
  const [src, setSrc] = useState<{ open: string; closed: string } | null>(null)
  useEffect(() => {
    let v = cache.get(id)
    if (!v) {
      const p = PORTRAITS[id]
      v = { open: toUrl(p.rows, p.pal), closed: toUrl(blinkRows(p.rows), p.pal) }
      cache.set(id, v)
    }
    setSrc(v)
  }, [id])
  const name = id === 'uktun' ? 'Uktun' : 'Memo Çelik'
  return (
    <span className={`relative block aspect-[48/56] ${className}`} role="img" aria-label={`${name} portresi`}>
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
