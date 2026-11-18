'use client'

import { useState } from 'react'
import { displayName } from '@/components/ui'
import type { Sound } from '@/game/audio'
import { LEVELS } from '@/game/levels'
import { useT } from '@/lib/i18n'
import type { Save } from '@/lib/storage'

/**
 * Müzik Kutusu (Defter sekmesi): jenerik ve bitirilen her şehrin bestesi dinlenir; boss'u yenilmiş şehirde
 * "Boss Teması" aynı bestenin sıklaşan ritmini çalar. Defterden çıkınca menü teması geri gelir (Game.tsx müzik etkisi).
 */
export default function MusicBox({ save, sound, onMusicOn }: { save: Save; sound: Sound | null; onMusicOn: () => void }) {
  const t = useT()
  const [now, setNow] = useState<{ id: string; boss: boolean }>({ id: 'title', boss: false })
  const heard = LEVELS.filter((l) => save.best[l.id]).length

  const play = (id: string, boss = false) => {
    if (!sound) return
    sound.unlock()
    if (id === 'title') sound.playTheme()
    else {
      const level = LEVELS.find((l) => l.id === id)!
      sound.setMusic(level.city)
      sound.setIntense(boss)
    }
    setNow({ id, boss })
  }

  const row = (id: string, title: string, sub: string, open: boolean, boss: boolean | null) => {
    const on = now.id === id
    return (
      <li key={id} className={`flex items-center gap-2.5 border-2 px-2.5 py-1.5 ${!open ? 'border-dashed border-line/80 bg-ink/30' : on ? 'border-gold bg-gold/10' : 'border-line bg-panel-2'}`}>
        <button
          className={`grid h-9 w-9 shrink-0 place-items-center text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${open ? (on && !now.boss ? 'bg-gold text-ink' : 'bg-accent-deep text-white') : 'bg-ink text-muted'}`}
          disabled={!open}
          aria-label={open ? t('{name} Bestesini Çal', { name: title }) : t('Kilitli')}
          onClick={() => play(id)}
        >
          {open ? (on && !now.boss ? '♪' : '▶') : '🔒'}
        </button>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-display text-[15px] leading-tight ${open ? 'text-cream' : 'text-cream/60'}`}>{title}</span>
          <span className="block truncate text-[12px] text-muted">{open ? sub : t('Şehri bitirince açılır')}</span>
        </span>
        {boss !== null && (
          <button
            className={`shrink-0 border-2 px-2 py-1 text-[12px] font-semibold ${on && now.boss ? 'border-gold bg-gold text-ink' : boss ? 'border-line text-cream hover:border-accent' : 'border-dashed border-line/80 text-muted'}`}
            disabled={!boss}
            title={boss ? undefined : t('Boss yenilince açılır')}
            onClick={() => play(id, true)}
          >
            {boss ? t('Boss Teması') : t('🔒 Boss')}
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="mt-2 flex min-h-[120px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-snug text-muted">
          <span className="h-2.5 w-2.5 shrink-0 translate-y-[-1px] rotate-45 bg-gold" aria-hidden />
          <span>
            <strong className="font-display text-[16px] font-normal tabular-nums text-cream">{t('{n}/{all} Beste', { n: heard + 1, all: LEVELS.length + 1 })}</strong> · {t('Boss’unu yendiğin şehirde boss teması da çalar.')}
          </span>
        </p>
        {!save.music && (
          <button className="tile-chip shrink-0 px-2 py-1 text-[12px] font-bold [--tone:var(--color-accent-2)]" onClick={onMusicOn}>
            {t('♪ Müziği Aç')}
          </button>
        )}
      </div>
      <ul className="overlay-scroll mt-2 grid grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {row('title', t('Jenerik'), t('Yol Defteri’nin teması'), true, null)}
        {LEVELS.map((l) => row(l.id, displayName(l), `${String(l.plate).padStart(2, '0')} · ${t(l.difficulty)}`, !!save.best[l.id], !!save.bosses[l.id]))}
      </ul>
    </div>
  )
}
