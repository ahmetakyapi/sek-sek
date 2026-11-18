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
      style={{ paddingTop: 'max(16px, var(--safe-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="m-auto flex w-full justify-center">{children}</div>
    </div>
  )
}

/** düğme yazısının başındaki simgeyi ayrı tutar: simgeyle yazı arasında boşluk kalır (düğmede flex aralığı, başka yerde .ico payı) */
const ICON = /^([^\p{L}\p{N}\s"“'(%+~:?\[-]+)\s+(.+)$/su
export function ic(s: string): React.ReactNode {
  const m = ICON.exec(s)
  if (!m) return s
  return (
    <>
      <span aria-hidden="true" className="ico">
        {m[1]}
      </span>
      <span>{m[2]}</span>
    </>
  )
}

export const displayName = (l: LevelDef) => (l.nickname ? `${l.name} (${l.nickname})` : l.name)

export { medalFor, type Medal } from '@/components/medal'
import type { Medal } from '@/components/medal'

const MEDAL: Record<Medal, { label: string; color: string; ring: string }> = {
  altin: { label: 'Altın', color: '#ffcc66', ring: '#b8862a' },
  gumus: { label: 'Gümüş', color: '#d7dde6', ring: '#8f99a8' },
  bronz: { label: 'Bronz', color: '#d08a52', ring: '#8a5530' },
}

export function MedalBadge({ medal, size = 'sm' }: { medal: Medal | null; size?: 'sm' | 'lg' }) {
  const t = useT()
  if (!medal) return null
  const m = MEDAL[medal]
  const d = size === 'lg' ? 'h-9 w-9 text-[11px]' : 'h-4 w-4 text-[0px]'
  return (
    <span className="inline-flex items-center gap-1.5" title={t('{m} Madalya', { m: t(m.label) })}>
      <span className={`inline-flex items-center justify-center rounded-full border-2 font-bold text-ink ${d}`} style={{ background: m.color, borderColor: m.ring }}>
        {size === 'lg' ? '★' : ''}
      </span>
      {size === 'lg' && <span className="font-display text-base text-cream">{t('{m} Madalya', { m: t(m.label) })}</span>}
    </span>
  )
}

type Rumble = { playEffect?: (type: 'dual-rumble', p: { duration: number; strongMagnitude: number; weakMagnitude: number; startDelay?: number }) => Promise<unknown> }

/** Telefonda titreşim, bağlı oyun kolunda gürleme (aynı desen: titreş, dur, titreş…) */
export function haptic(ms: number | number[]) {
  try {
    if (typeof navigator === 'undefined') return
    if ('vibrate' in navigator) navigator.vibrate(ms)
    const pads = navigator.getGamepads ? navigator.getGamepads() : []
    const parts = Array.isArray(ms) ? ms : [ms]
    for (const p of pads) {
      const act = (p as (Gamepad & { vibrationActuator?: Rumble }) | null)?.vibrationActuator
      if (!act?.playEffect) continue
      // desendeki her titreşim parçası sırasıyla; kısa vuruşlar kolda hafif, uzunlar güçlü
      let at = 0
      parts.forEach((d, i) => {
        if (i % 2 === 0) void act.playEffect!('dual-rumble', { startDelay: at, duration: Math.max(20, d * 1.5), strongMagnitude: Math.min(1, d / 60), weakMagnitude: 0.5 }).catch(() => {})
        at += d
      })
    }
  } catch {
    /* desteklenmiyor */
  }
}

/** Ekran içindeki öbeğin başlığı: renkli eşkenar dörtgen, ad ve kısa not (Modlar, Ayarlar) */
export function SectionTitle({ title, note, tone = 'var(--color-gold)', className = '' }: { title: string; note?: string; tone?: string; className?: string }) {
  return (
    <h3 className={`flex items-baseline gap-2 ${className}`}>
      <span className="h-2.5 w-2.5 shrink-0 translate-y-[-1px] rotate-45" style={{ background: tone }} aria-hidden />
      <span className="font-display text-[17px] text-cream">{title}</span>
      {note && <span className="truncate text-[13px] text-muted">{note}</span>}
    </h3>
  )
}
