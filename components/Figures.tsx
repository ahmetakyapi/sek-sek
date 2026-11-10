'use client'

import { useEffect, useRef } from 'react'
import { BOSSES, makeBoss } from '@/game/boss'
import { drawBoss } from '@/game/bossDraw'
import { POSES, drawHero, type Look, type Pose } from '@/game/heroDraw'
import type { CityKey } from '@/game/types'

/** Tuvali cihaz çözünürlüğünde kurar ve her karede çizim işlevini çağırır. */
function useCanvasLoop(draw: (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c = cv.getContext('2d')!
    let raf = 0
    const t0 = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const w = Math.round(cv.clientWidth * dpr)
      const h = Math.round(cv.clientHeight * dpr)
      if (!w || !h) return
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
      }
      c.clearRect(0, 0, w, h)
      draw(c, w, h, (now - t0) / 1000)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/**
 * Oyundaki çizgiyle canlı karakter: gün batımı fonunda nefes alır, göz kırpar, ara sıra el sallar.
 * Menülerde oynanan karakterin kendisi görünür (oyunla aynı çizim işlevi).
 */
export function HeroFigure({ look, className = '' }: { look: Look; className?: string }) {
  const ref = useCanvasLoop(
    (c, w, h, t) => {
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#2c2a52')
      g.addColorStop(0.55, '#c4685a')
      g.addColorStop(0.82, '#f2b872')
      g.addColorStop(1, '#f6d6a0')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
      // güneş ve uzak tepeler
      c.fillStyle = 'rgba(255,236,190,0.9)'
      c.beginPath()
      c.arc(w * 0.72, h * 0.62, w * 0.16, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#5a3e5e'
      c.beginPath()
      c.moveTo(0, h * 0.8)
      c.quadraticCurveTo(w * 0.3, h * 0.66, w * 0.55, h * 0.78)
      c.quadraticCurveTo(w * 0.8, h * 0.7, w, h * 0.8)
      c.lineTo(w, h)
      c.lineTo(0, h)
      c.fill()
      c.fillStyle = '#3a2a44'
      c.fillRect(0, h * 0.9, w, h * 0.1)
      const br = 2 + 5 * (0.5 + 0.5 * Math.sin(t * 2.4))
      const waving = t % 7 > 5.2
      const idle = POSES.idle
      const pose: Pose = waving
        ? { ...POSES.wave, arms: [POSES.wave.arms[0], [POSES.wave.arms[1][0], POSES.wave.arms[1][1] + Math.sin(t * 13) * 22]], blink: false }
        : { ...idle, legs: [[idle.legs[0][0], br], [idle.legs[1][0], br]], blink: t % 3.6 < 0.12 }
      drawHero(c, look, pose, w * 0.46, h * 0.91, h * 0.78, false, t, { moving: false })
    },
    [look],
  )
  return <canvas ref={ref} className={className} aria-hidden />
}

/** Şehrin bekçisi: bölüm kartında küçük, hareketli tanıtım. */
export function BossFigure({ city, className = '' }: { city: CityKey; className?: string }) {
  const ref = useCanvasLoop(
    (c, w, h, t) => {
      const def = BOSSES[city]
      const b = makeBoss(def, 0, 0, 0, 100)
      b.state = 'move'
      b.hidden = false
      b.dir = -1
      b.t = t
      const sc = Math.min((w * 0.8) / (def.w * 1.3), (h * 0.78) / (def.h * 1.3))
      c.fillStyle = 'rgba(18,12,26,0.35)'
      c.beginPath()
      c.ellipse(w / 2, h * 0.9, def.w * sc * 0.55, h * 0.04, 0, 0, Math.PI * 2)
      c.fill()
      drawBoss(c, city, b, w / 2, h * 0.9 - Math.abs(Math.sin(t * 2.2)) * h * 0.03, sc, t)
    },
    [city],
  )
  return <canvas ref={ref} className={className} aria-hidden />
}
