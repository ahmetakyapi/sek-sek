'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useRef } from 'react'
import { sprite } from '@/game/art'
import type { CharacterDef } from '@/game/characters'
import { HERO, HERO_H, HERO_W, type HeroFrame } from '@/game/heroFrames'
import type { LevelDef } from '@/game/types'

export function Overlay({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // her ekran en üstten açılır
  useEffect(() => {
    ref.current?.scrollTo(0, 0)
  }, [])
  return (
    <div
      ref={ref}
      className={`overlay-scroll absolute inset-0 z-20 flex overflow-y-auto p-4 ${dim ? 'bg-ink/60' : 'bg-ink/35'}`}
      style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="m-auto flex w-full justify-center">{children}</div>
    </div>
  )
}

export const displayName = (l: LevelDef) => (l.nickname ? `${l.name} (${l.nickname})` : l.name)

export { medalFor, type Medal } from '@/components/medal'
import type { Medal } from '@/components/medal'

const MEDAL: Record<Medal, { label: string; color: string; ring: string }> = {
  altin: { label: 'Altın', color: '#f2c14e', ring: '#b8862a' },
  gumus: { label: 'Gümüş', color: '#d7dde6', ring: '#8f99a8' },
  bronz: { label: 'Bronz', color: '#d08a52', ring: '#8a5530' },
}

export function MedalBadge({ medal, size = 'sm' }: { medal: Medal | null; size?: 'sm' | 'lg' }) {
  const t = useT()
  if (!medal) return null
  const m = MEDAL[medal]
  const d = size === 'lg' ? 'h-9 w-9 text-[10px]' : 'h-4 w-4 text-[0px]'
  return (
    <span className="inline-flex items-center gap-1.5" title={t('{m} Madalya', { m: t(m.label) })}>
      <span className={`inline-flex items-center justify-center rounded-full border-2 font-bold text-ink ${d}`} style={{ background: m.color, borderColor: m.ring }}>
        {size === 'lg' ? '★' : ''}
      </span>
      {size === 'lg' && <span className="font-display text-base text-cream">{t('{m} Madalya', { m: t(m.label) })}</span>}
    </span>
  )
}

/** Karakteri büyük ölçekte çizen canlı önizleme: nefes alır, göz kırpar, koşarken 8 kare döner, atkı dalgalanır. */
export function CharacterPortrait({ c, scale = 6, pose = 'idle', className = '' }: { c: CharacterDef; scale?: number; pose?: 'idle' | 'run'; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const hero = HERO[c.id]
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const t = Math.max(0, now - t0) / 1000
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.imageSmoothingEnabled = false
      const running = pose === 'run'
      const frame: HeroFrame = running ? (`run${Math.floor(t * 12) % 8}` as HeroFrame) : t % 3.4 < 0.12 ? 'blink' : Math.floor(t / 0.7) % 2 ? 'idle1' : 'idle0'
      const ox = 2
      const oy = 1
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(ox + 5, oy + HERO_H - 1, 10, 1)
      const wave = Math.floor(t * (running ? 12 : 3)) % 3
      const lean = running ? 1 : 0
      ctx.fillStyle = hero.pal.r
      ctx.fillRect(ox + 5 + lean, oy + 9, 2, 1)
      ctx.fillStyle = hero.pal.R
      ctx.fillRect(ox + 4 + lean, oy + 10 + (wave === 1 ? 1 : 0), 2, 1)
      sprite(ctx, hero.frames[frame], hero.pal, ox, oy)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [c, scale, pose])
  return <canvas ref={ref} width={(HERO_W + 4) * scale} height={(HERO_H + 2) * scale} className={className} style={{ imageRendering: 'pixelated' }} aria-label={`${c.name} karakteri`} />
}

export function haptic(ms: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
  } catch {
    /* desteklenmiyor */
  }
}
