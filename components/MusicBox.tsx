'use client'

import { useState } from 'react'
import type { Sound } from '@/game/audio'
import { useT } from '@/lib/i18n'
import type { Save } from '@/lib/storage'

/**
 * Müzik Kutusu (Defter sekmesi): oyunun tek bestesi, jenerik, burada çalınır ya da durdurulur; bir boss yenildiyse
 * "Boss Teması" aynı bestenin dövüşteki yoğun hâlini (sıklaşan ritim, pedal bas) çalar. Defterden çıkınca menü
 * müziği yine jeneriktir (Game.tsx müzik etkisi boss katmanını söndürür, durdurulduysa yeniden başlatır).
 */
export default function MusicBox({ save, sound, onMusicOn }: { save: Save; sound: Sound | null; onMusicOn: () => void }) {
  const t = useT()
  const [now, setNow] = useState<'title' | 'boss' | null>(() => (sound?.playing ? 'title' : null))
  const bossOpen = Object.values(save.bosses).some(Boolean)

  const play = (id: 'title' | 'boss') => {
    if (!sound) return
    sound.unlock()
    if (now === id) {
      sound.stopMusic()
      setNow(null)
      return
    }
    sound.playTheme()
    sound.setIntense(id === 'boss')
    setNow(id)
  }

  const row = (id: 'title' | 'boss', title: string, sub: string, open: boolean) => {
    const on = now === id
    return (
      <li className={`flex items-center gap-3 border-2 px-3 py-2 ${!open ? 'border-dashed border-line/80 bg-ink/30' : on ? 'border-gold bg-gold/10' : 'border-line bg-panel-2'}`}>
        <button
          className={`hit grid h-11 w-11 shrink-0 place-items-center text-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${open ? (on ? 'bg-gold text-ink' : 'bg-accent-deep text-white') : 'bg-ink text-muted'}`}
          disabled={!open}
          aria-pressed={on}
          aria-label={!open ? t('Kilitli') : on ? t('{name} Durdur', { name: title }) : t('{name} Çal', { name: title })}
          onClick={() => play(id)}
        >
          {!open ? '🔒' : on ? '■' : '▶'}
        </button>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-display text-[16px] leading-tight ${open ? 'text-cream' : 'text-cream/60'}`}>{title}</span>
          <span className="block text-[12px] leading-snug text-muted">{open ? sub : t('İlk boss’u yenince açılır')}</span>
        </span>
        {on && <span className="shrink-0 text-[12px] font-semibold text-gold">{t('Çalıyor')}</span>}
      </li>
    )
  }

  return (
    <div className="mt-2 flex min-h-[120px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-snug text-muted">
          <span className="h-2.5 w-2.5 shrink-0 translate-y-[-1px] rotate-45 bg-gold" aria-hidden />
          <span>{t('Yolun bütün müziği tek beste: menüde, şehirde ve boss’ta aynı jenerik çalar, her turda ezgi başka çalgıya geçer.')}</span>
        </p>
        {!save.music && (
          <button className="tile-chip shrink-0 px-2 py-1 text-[12px] font-bold [--tone:var(--color-accent-2)]" onClick={onMusicOn}>
            {t('♪ Müziği Aç')}
          </button>
        )}
      </div>
      <ul className="mt-2 grid grid-cols-1 content-start gap-2 sm:grid-cols-2">
        {row('title', t('Jenerik'), t('Piyano, ney ve kanun; Hicaz renkli sakin bir yol havası'), true)}
        {row('boss', t('Boss Teması'), t('Aynı beste, dövüşteki hâliyle: ritim sıklaşır, bas pedalda bekler'), bossOpen)}
      </ul>
    </div>
  )
}
