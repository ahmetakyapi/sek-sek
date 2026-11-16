'use client'

import { useEffect, useRef } from 'react'
import { CITY } from '@/game/art'
import type { CityKey } from '@/game/types'
import { thumbColors } from '@/lib/editorKit'

/**
 * Haritanın kuşbakışı: karo başına bir piksel, şehrin paletiyle (lib/editorKit.ts thumbColors). Topluluk galerisi
 * ve mücadele/parkur ekranı kullanır. `minW`: kısa haritada gök ve zemin bu genişliğe dek sürer (kart oranı korunur).
 */
export default function MapThumb({ map, city, minW = 0, className = 'block h-full w-auto max-w-none' }: { map: string[]; city: CityKey; minW?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !map.length) return
    const p = CITY[city]
    const w = map[0].length
    cv.width = Math.max(w, minW)
    cv.height = map.length
    const sky = c.createLinearGradient(0, 0, 0, cv.height)
    p.sky.forEach((col, i) => sky.addColorStop(i / (p.sky.length - 1), col))
    c.fillStyle = sky
    c.fillRect(0, 0, cv.width, cv.height)
    const color = thumbColors(p)
    map.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        const ch = row[x]
        const col = color[ch]
        if (!col) continue
        c.fillStyle = ch === '#' && y > 0 && map[y - 1][x] !== '#' ? p.tileTop : col
        c.fillRect(x, ch === 'E' || ch === 'F' ? y - 1 : y, 1, ch === 'E' || ch === 'F' ? 2 : 1)
      }
      const last = row[w - 1]
      if (cv.width > w && (last === '#' || last === '~')) {
        c.fillStyle = last === '#' ? (y > 0 && map[y - 1][w - 1] !== '#' ? p.tileTop : p.tile) : p.water[0]
        c.fillRect(w, y, cv.width - w, 1)
      }
    })
  }, [map, city, minW])
  // oran korunur: kutu haritadan farklı oranlıysa harita ortalanır, kalan yer zeminin rengiyle kalır
  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} aria-hidden />
}
