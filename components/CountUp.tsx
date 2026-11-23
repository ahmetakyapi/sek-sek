'use client'

import { useEffect, useState } from 'react'

/**
 * Sayarak beliren sayı (bölüm sonu: süre ve puan). `ms` boyunca yumuşak bitişle 0'dan `to`ya; ekran okuyucu ve
 * "hareketi azalt" son değeri hemen görür. `format` gösterimi verir (süre biçimi, binlik ayracı).
 */
export function CountUp({ to, ms = 900, delay = 0, format }: { to: number; ms?: number; delay?: number; format: (n: number) => string }) {
  const [v, setV] = useState(to)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(to)
    let raf = 0
    const t0 = performance.now() + delay
    setV(0)
    const step = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / ms))
      setV(to * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, delay])
  return (
    <>
      <span aria-hidden>{format(v)}</span>
      <span className="sr-only">{format(to)}</span>
    </>
  )
}
