'use client'

import { useRef } from 'react'
import Portrait from '@/components/Portrait'
import type { Kit } from '@/game/accessories'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { characterFor, useLang, useT } from '@/lib/i18n'

const HEROES = ['uktun', 'memo'] as const

interface ScarfColor {
  color: string
  shade: string
}

/** Boyut varyantları: lg şehir kartı, md kurulum ekranları (Düello, Co-op), sm mola ve dar çubuklar */
export type HeroPickerSize = 'lg' | 'md' | 'sm'

const SIZE: Record<HeroPickerSize, { card: string; portrait: string; name: string; role: boolean; fit: string }> = {
  lg: { card: 'min-h-[72px] gap-2.5 p-1.5 pr-2 short:min-h-[64px] short:gap-2', portrait: 'w-[44px] short:w-[38px]', name: 'text-xl max-sm:text-lg short:text-lg', role: true, fit: 'truncate' },
  md: { card: 'min-h-[64px] gap-2.5 p-1.5 pr-2.5 short:min-h-[56px]', portrait: 'w-[42px] short:w-[34px]', name: 'text-[17px]', role: true, fit: 'truncate' },
  sm: { card: 'min-h-[56px] gap-2 p-1 pr-2.5 short:min-h-[48px] short:gap-1.5 short:pr-2', portrait: 'w-[34px] short:w-[28px]', name: 'text-[15px]', role: false, fit: 'whitespace-nowrap' },
}

/**
 * Yolcu seçici (Uktun / Memo): iki büyük kart, seçili kart çerçeveli ve tikli. Şehir kartında, Düello ve Co-op
 * kurulumunda, molada ve Mağaza'da aynı görünüm; yalnız boyut değişir. Klavye: ←/→ (ve ↑/↓) komşuya geçer,
 * 1 ve 2 doğrudan seçer (odak seçicideyken); Tab yalnız seçili karta durur (radyo grubu). Odak halkası altın,
 * hedef en az 56 px (alçak ekranda 48 px). Hareketi azalt açıkken geçiş animasyonu yoktur.
 */
export default function HeroPicker({
  value,
  onChange,
  size = 'lg',
  label,
  tone = 'var(--color-gold)',
  scarfOf,
  kitOf,
  stack = false,
  className = '',
}: {
  value: CharacterId
  onChange: (id: CharacterId) => void
  size?: HeroPickerSize
  /** erişilebilirlik etiketi (varsayılan "Yolcu"); Düello'da "1. Oyuncunun Yolcusu" gibi */
  label?: string
  /** seçili kartın çerçeve rengi (iki oyunculu ekranlarda oyuncunun rengi) */
  tone?: string
  scarfOf?: (id: CharacterId) => ScarfColor | null
  kitOf?: (id: CharacterId) => Kit | undefined
  /** iki kart alt alta (dar kutularda: oyuncu başına seçici) */
  stack?: boolean
  className?: string
}) {
  const t = useT()
  const lng = useLang()
  const box = useRef<HTMLDivElement>(null)
  const s = SIZE[size]

  const pick = (id: CharacterId, focus = false) => {
    if (id !== value) onChange(id)
    if (focus) box.current?.querySelector<HTMLElement>(`[data-hero="${id}"]`)?.focus()
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const at = HEROES.indexOf(value)
    let next: CharacterId | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = HEROES[(at + HEROES.length - 1) % HEROES.length]
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = HEROES[(at + 1) % HEROES.length]
    else if (e.key === '1') next = HEROES[0]
    else if (e.key === '2') next = HEROES[1]
    if (!next) return
    e.preventDefault()
    e.stopPropagation()
    pick(next, true)
  }

  return (
    <div ref={box} role="radiogroup" aria-label={label ?? t('Yolcu')} onKeyDown={onKey} className={`grid gap-2 short:gap-1.5 ${stack ? 'grid-cols-1 gap-1.5' : 'grid-cols-2'} ${className}`}>
      {HEROES.map((id) => {
        const on = value === id
        const c = CHARACTERS[id]
        const role = characterFor(lng, id)?.role ?? c.role
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${c.name}, ${role}`}
            data-hero={id}
            tabIndex={on ? 0 : -1}
            onClick={() => pick(id)}
            className={`relative flex min-w-0 items-center border-2 bg-panel-2 text-left transition-colors duration-150 motion-reduce:transition-none hover:border-accent-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${s.card} ${on ? 'bg-ink/60' : 'border-line opacity-90 hover:opacity-100'}`}
            style={on ? { borderColor: tone, boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${tone} 35%, transparent)` } : undefined}
          >
            <span className="portrait-frame shrink-0">
              <Portrait id={id} scarf={scarfOf?.(id) ?? null} accessory={kitOf?.(id)} className={`block ${s.portrait}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block ${s.fit} font-display leading-tight text-cream ${s.name}`}>{c.name}</span>
              {s.role && <span className="mt-0.5 block truncate text-[13px] font-semibold text-accent-2">{role}</span>}
            </span>
            {on && (
              <span aria-hidden className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink text-[13px] font-bold leading-none text-ink" style={{ background: tone }}>
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
