'use client'

import { useEffect, useRef } from 'react'
import type { AccessoryId } from '@/game/accessories'
import type { CharacterId } from '@/game/characters'
import type { Look } from '@/game/heroDraw'
import { drawPortrait } from '@/game/portraitDraw'

interface ScarfColor {
  color: string
  shade: string
}

/**
 * Portreyi tuvalde, cihaz çözünürlüğünde canlı tutar: nefes alır, saçı ve atkısı salınır, arada göz kırpar.
 * Saniyede ~24 kare yeter; hareket azaltma seçiliyse tek kare çizilir, yalnız boyut değişince yenilenir.
 */
function usePortraitCanvas(look: Look, face: boolean, scarf?: ScarfColor | null, acc: AccessoryId = 'yok') {
  const ref = useRef<HTMLCanvasElement>(null)
  const color = scarf?.color
  const shade = scarf?.shade
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c = cv.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const w = Math.round(cv.clientWidth * dpr)
      const h = Math.round(cv.clientHeight * dpr)
      if (!w || !h) return
      const resized = cv.width !== w || cv.height !== h
      if (!resized && (still ? last >= 0 : now - last < 40)) return
      if (resized) {
        cv.width = w
        cv.height = h
      }
      last = now
      drawPortrait(c, look, w, h, (now - t0) / 1000, { scarf: color, scarfS: shade, face, still, acc })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [look, face, color, shade, acc])
  return ref
}

/**
 * Büst portre (64:76). `id` oynanan karakter ya da şehir insanı kılığıdır; `scarf` verilirse oyuncunun seçtiği
 * atkı rengi, `accessory` verilirse Kılık Dükkânı aksesuarı giydirilir. Tuval çizilene dek (ve betiksiz)
 * public/portreler'deki hazır kare görünür (aksesuarlı ya da atkılı portrede görünmez: hazır kare aksesuarsızdır).
 */
export default function Portrait({ id, className = '', scarf, accessory }: { id: Look; className?: string; scarf?: ScarfColor | null; accessory?: AccessoryId }) {
  const ref = usePortraitCanvas(id, false, scarf, accessory)
  const name = id === 'uktun' ? 'Uktun' : id === 'memo' ? 'Memo' : null
  return (
    <span
      className={`relative block aspect-[64/76] bg-cover ${className}`}
      style={scarf || (accessory && accessory !== 'yok') ? undefined : { backgroundImage: `url(/portreler/${id}.png)` }}
      role={name ? 'img' : undefined}
      aria-label={name ? `${name} portresi` : undefined}
      aria-hidden={name ? undefined : true}
    >
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </span>
  )
}

/**
 * Göstergedeki küçük portre: yüz kare kırpılır, altın çerçeveli bir posta pulu gibi durur, arada göz kırpar.
 */
export function PortraitFace({ id, scale = 1, scarf, accessory }: { id: CharacterId; scale?: 1 | 2; scarf?: ScarfColor | null; accessory?: AccessoryId }) {
  const ref = usePortraitCanvas(id, true, scarf, accessory)
  const size = 38 * scale
  return (
    <span className="relative block shrink-0 bg-[#f3f1ff] p-[2px] [box-shadow:0_0_0_2px_#d9a441,0_2px_0_2px_rgba(0,0,0,0.35)]" style={{ width: size + 4, height: size + 4 }} aria-hidden>
      <canvas ref={ref} className="block" style={{ width: size, height: size }} />
    </span>
  )
}
