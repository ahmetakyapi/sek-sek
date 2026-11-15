'use client'

import { ItemIcon } from '@/components/HudBits'
import { Overlay, displayName } from '@/components/ui'
import { LEVELS } from '@/game/levels'
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
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YENİ OYUN+ · {n}/{m}', { n: done, m: LEVELS.length })}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Ayna Yolu')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {t('← Geri')}
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted short:hidden">
          {open ? t('Haritalar sağdan sola döndü, rüzgâr ters esiyor, oklar öbür yandan geliyor. Hatıra ve tabela yok; yalnız yol ve süre.') : t('Otuz şehrin hepsini bitirince açılır.')}
          {done ? ` ${t('Ayna toplamın {time}.', { time: formatTime(total) })}` : ''}
        </p>
        <ol className="overlay-scroll mt-3 grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 short:mt-2 short:grid-cols-3">
          {LEVELS.map((l, i) => {
            const lv = localize(l, lng)
            const ok = open
            return (
              <li key={l.id}>
                <button disabled={!ok} onClick={() => onStart(i)} className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-2 px-2 py-1.5 text-left ${ok ? 'border-line bg-ink/40 hover:border-accent-2' : 'border-dashed border-line/60 opacity-50'}`}>
                  <span className="flex h-8 w-8 -scale-x-100 items-center justify-center rounded-full bg-[#2a2438]">
                    <ItemIcon city={l.city} taken={!!best[l.id]} size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-cream">{displayName(lv)}</span>
                    <span className="block text-[11px] text-muted">{t(lv.difficulty)}</span>
                  </span>
                  <span className="font-display text-[15px] tabular-nums text-cream">{best[l.id] ? formatTime(best[l.id]) : ok ? '▶' : '🔒'}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </Overlay>
  )
}
