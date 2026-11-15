'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_KEYS, KEY_ACTIONS, RESERVED_KEYS, bindKey, keyLabel, normalizeKeys, type KeyAction, type KeyBindings } from '@/game/input'
import { useLang, useT } from '@/lib/i18n'

const NAMES: Record<KeyAction, string> = { left: 'Sola Yürü', right: 'Sağa Yürü', jump: 'Zıpla', dash: 'Dash', down: 'Aşağı İn' }

/**
 * Klavye tuşlarını yeniden atama: bir eylemin "+" düğmesine basılır, sonraki tuş o eyleme bağlanır (başka eylemdeyse
 * oradan alınır). Mola (Esc / P) ve Checkpoint (R) sabittir. Değişiklik kayda yazılır, girdi hemen uyar.
 */
export default function KeyRemap({ keys, onChange }: { keys?: Partial<KeyBindings>; onChange: (k: KeyBindings) => void }) {
  const t = useT()
  const lang = useLang()
  const b = normalizeKeys(keys)
  const [wait, setWait] = useState<KeyAction | null>(null)

  useEffect(() => {
    if (!wait) return
    const on = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') return setWait(null)
      if (!RESERVED_KEYS.includes(e.code)) onChange(bindKey(b, wait, e.code))
      setWait(null)
    }
    // yakalama evresinde: oyunun kendi tuş dinleyicisine (mola, zıplama) ulaşmasın
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }, [wait, b, onChange])

  const changed = KEY_ACTIONS.some((a) => b[a].join() !== DEFAULT_KEYS[a].join())

  return (
    <div className="mt-3 short:mt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-gold">{t('Klavye')}</p>
        {changed && (
          <button className="text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={() => onChange(DEFAULT_KEYS)}>
            {t('Varsayılana Dön')}
          </button>
        )}
      </div>
      <ul className="mt-1.5 grid gap-1.5 short:grid-cols-2 short:gap-x-4">
        {KEY_ACTIONS.map((a) => (
          <li key={a} className="flex items-center gap-2 text-[13px]">
            <span className="w-28 shrink-0 text-muted short:w-24">{t(NAMES[a])}</span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
              {b[a].map((c) => (
                <span key={c} className="inline-flex min-w-[28px] items-center justify-center bg-ink/60 px-1.5 py-0.5 text-[13px] font-bold text-cream [box-shadow:inset_0_0_0_2px_#37337a,inset_0_-3px_0_#0e0d22]">
                  {keyLabel(c, lang === 'en' ? 'en' : 'tr')}
                </span>
              ))}
            </span>
            <button
              className={`shrink-0 px-2 py-0.5 text-[13px] font-bold ${wait === a ? 'bg-gold text-ink' : 'text-accent-2 hover:text-cream [box-shadow:inset_0_0_0_2px_#37337a]'}`}
              onClick={() => setWait(wait === a ? null : a)}
              aria-label={t('{action} İçin Tuş Ata', { action: t(NAMES[a]) })}
            >
              {wait === a ? t('Bir Tuşa Bas…') : '+'}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-muted">
        <span className="text-cream">Esc / P</span> {t('Mola')} · <span className="text-cream">R</span> {t('Checkpoint’e Dön')} · {t('Aşağı tuşu ince platformdan indirir.')}
      </p>
    </div>
  )
}
