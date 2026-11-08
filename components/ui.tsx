'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useRef } from 'react'
import { sprite } from '@/game/art'
import { frameRows, type CharacterDef, type Pose } from '@/game/characters'
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

/** Karakteri büyük ölçekte çizen canlı önizleme (göz kırpma, saç ve atkı sallanır). */
export function CharacterPortrait({ c, scale = 6, pose = 'idle', className = '' }: { c: CharacterDef; scale?: number; pose?: Pose | 'run'; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
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
      const f = Math.floor(t * 10) % 4
      const p: Pose = running ? (['runA', 'runB', 'runC', 'runD'] as const)[f] : (pose as Pose)
      const bob = running ? f % 2 : Math.sin(t * 2.5) > 0.6 ? 1 : 0
      const blink = t % 3.4 < 0.12
      const ox = 4
      const oy = 2
      // gölge
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(ox + 3, oy + 20, 10, 1)
      const wave = Math.floor(t * (running ? 12 : 3)) % 3
      if (c.tail) sprite(ctx, c.tail.frames[running ? wave : wave % 2], c.pal, ox - 1, oy + c.tail.y + bob)
      ctx.fillStyle = c.pal.r
      ctx.fillRect(ox, oy + 10 + bob, 2, 1)
      ctx.fillStyle = c.pal.R
      ctx.fillRect(ox - 1, oy + 11 + bob + (wave === 1 ? 1 : 0), 2, 1)
      sprite(ctx, frameRows(c, p, bob, blink), c.pal, ox, oy)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [c, scale, pose])
  return <canvas ref={ref} width={24 * scale} height={23 * scale} className={className} style={{ imageRendering: 'pixelated' }} aria-label={`${c.name} karakteri`} />
}

export function haptic(ms: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
  } catch {
    /* desteklenmiyor */
  }
}
