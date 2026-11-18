'use client'

import { ItemIcon } from '@/components/HudBits'
import { Overlay, displayName, ic } from '@/components/ui'
import { FIRST_BOOK, LEVELS as ALL } from '@/game/levels'

/** Ayna Yolu ilk defterin şehirleriyle: ikinci defterin aynası henüz doğrulanmadı */
const LEVELS = ALL.slice(0, FIRST_BOOK)
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Ayna Yolu (Yeni Oyun+): otuz şehri bitirince açılır; her şehrin aynalanmış haritası ve ayrı rekoru */
export default function MirrorList({ best, open, onStart, onBack }: { best: Record<string, number>; open: boolean; onStart: (idx: number) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const done = LEVELS.filter((l) => best[l.id]).length
  const total = LEVELS.reduce((a, l) => a + (best[l.id] ?? 0), 0)
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1040px,100%)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-cream short:text-2xl">
              {t('Ayna Yolu')}
              <span className="flex items-center gap-2 font-mono text-[13px] font-bold text-accent-2">
                {t('{n}/{m} bitti', { n: done, m: LEVELS.length })}
                <span className="h-1 w-16 overflow-hidden rounded-full bg-ink/70" aria-hidden>
                  <span className="block h-full rounded-full bg-accent-2" style={{ width: `${Math.round((done / LEVELS.length) * 100)}%` }} />
                </span>
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">
              {open ? t('Haritalar sağdan sola döndü, rüzgâr ters esiyor. Hatıra yok; yalnız yol ve süre.') : t('Otuz şehrin hepsini bitirince açılır.')}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-4">
            {done > 0 && (
              <div className="text-right max-sm:hidden">
                <p className="font-display text-[22px] leading-none tabular-nums text-cream">{formatTime(total)}</p>
                <p className="mt-1 text-[12px] text-muted">{t('Ayna Toplamın')}</p>
              </div>
            )}
            <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
              {ic(t('← Geri'))}
            </button>
          </div>
        </div>
        <ol className="overlay-scroll mt-4 grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto pr-1 short:mt-2 short:grid-cols-3 wide:grid-cols-3">
          {LEVELS.map((l, i) => {
            const lv = localize(l, lng)
            const ms = best[l.id]
            return (
              <li key={l.id}>
                <button
                  disabled={!open}
                  onClick={() => onStart(i)}
                  aria-label={open ? `${displayName(lv)}: ${ms ? formatTime(ms) : t('Oyna')}` : t('{city}: Kilitli', { city: displayName(lv) })}
                  className={`mode-tile grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-1.5 max-sm:gap-1.5 max-sm:px-2 text-left [--tone:var(--color-accent-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${open ? '' : 'locked'}`}
                >
                  <span className={`flex h-8 w-8 -scale-x-100 items-center justify-center rounded-full bg-panel-2 max-sm:h-7 max-sm:w-7 ${open ? '' : 'opacity-50'}`}>
                    <ItemIcon city={l.city} taken={!!ms} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate font-display text-[15px] leading-tight ${open ? 'text-cream' : 'text-cream/60'}`}>{lv.name}</span>
                    <span className="block text-[12px] text-muted">{t(lv.difficulty)}</span>
                  </span>
                  <span className={`font-display text-[15px] tabular-nums ${ms ? 'text-cream' : 'text-[var(--tone)]'}`}>{ms ? formatTime(ms) : open ? '▶' : '🔒'}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </Overlay>
  )
}
