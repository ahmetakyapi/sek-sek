'use client'

import { useEffect } from 'react'

/**
 * Menülerin "ışık" katmanı: imleç bir kartın (`.mode-tile`, `.mode-card`, `.menu-tile`) üstündeyken kartın içindeki konumunu
 * `--mx` / `--my` olarak yazar; globals.css kartın zemininde imleci izleyen yumuşak bir ışık çizer. Tek dinleyici, kare başına
 * en çok bir yazım (rAF); dokunmatikte ve "hareketi azalt"ta çalışmaz. Yalnız CSS değişkeni yazar: yerleşim ve boyama ucuzdur.
 */
export default function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let ev: PointerEvent | null = null
    const apply = () => {
      raf = 0
      const e = ev
      if (!e) return
      const el = (e.target as Element | null)?.closest?.('.mode-tile, .mode-card, .menu-tile') as HTMLElement | null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`)
      el.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`)
    }
    const move = (e: PointerEvent) => {
      ev = e
      if (!raf) raf = requestAnimationFrame(apply)
    }
    document.addEventListener('pointermove', move, { passive: true })
    return () => {
      document.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
