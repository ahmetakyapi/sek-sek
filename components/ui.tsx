'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useRef } from 'react'
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

export function haptic(ms: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
  } catch {
    /* desteklenmiyor */
  }
}
