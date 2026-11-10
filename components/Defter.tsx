'use client'

import { BossFigure } from '@/components/Figures'
import { ItemIcon, ThingIcon } from '@/components/HudBits'
import { MedalBadge, Overlay, displayName, medalFor } from '@/components/ui'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { SCARVES } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime, type Save } from '@/lib/storage'

/** Patron Koşusu'nun açılması için yenilmesi gereken patron sayısı */
export const RUSH_NEEDS = 3

/**
 * Dedenin Defteri: yolculukta toplanan her şey tek sayfada. Şehir başına üç hatıra, gizli pul, nazar boncuğu
 * ve meydanın bekçisi; üstte toplamlar, görev rozetleri ve Patron Koşusu.
 */
export default function Defter({ save, onClose, onRush }: { save: Save; onClose: () => void; onRush: () => void }) {
  const t = useT()
  const lang = useLang()
  const n = LEVELS.length
  const items = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
  const stamps = LEVELS.filter((l) => save.stamps[l.id]).length
  const charms = LEVELS.filter((l) => save.charms[l.id]).length
  const bosses = LEVELS.filter((l) => save.bosses[l.id]).length
  const scarves = SCARVES.filter((s) => charms >= s.need).length
  const totals: [string, number, number][] = [
    [t('Hatıra'), items, n * 3],
    [t('Gizli Pul'), stamps, n],
    [t('Nazar Boncuğu'), charms, n],
    [t('Bekçi'), bosses, n],
    [t('Atkı'), scarves, SCARVES.length],
  ]
  return (
    <Overlay>
      <div className="rise pixel-panel w-full max-w-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YOLCULUĞUN ÖZETİ')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream">{t('Dedenin Defteri')}</h2>
          </div>
          <button className="pixel-btn" onClick={onClose}>
            {t('← Geri')}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
          {totals.map(([k, v, max]) => (
            <div key={k} className={`border-2 py-2 ${v === max ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
              <p className="font-display text-xl leading-none tabular-nums text-cream">
                {v}
                <span className="text-sm text-muted">/{max}</span>
              </p>
              <p className="mt-1 text-[11px] text-muted">{k}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="border-2 border-line bg-ink/40 px-3 py-2">
            <p className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('GÜNÜN ŞEHRİ')}</p>
            <p className="mt-0.5 text-[13px] text-cream">{t('{n} gün tamamlandı', { n: save.daily.count })}</p>
          </div>
          <div className="border-2 border-line bg-ink/40 px-3 py-2">
            <p className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('HAFTANIN GÖREVİ')}</p>
            <p className="mt-0.5 text-[13px] text-cream">{t('{n} hafta tamamlandı', { n: save.weekly.count })}</p>
          </div>
          <button className="pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left" disabled={bosses < RUSH_NEEDS} onClick={onRush}>
            <span className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('PATRON KOŞUSU')}</span>
            <span className="text-[13px]">
              {bosses < RUSH_NEEDS
                ? t('Önce {n} bekçi yen', { n: RUSH_NEEDS })
                : save.rush
                  ? t('Rekor: {time} · {n} bekçi', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })
                  : t('▶ Yendiğin Bekçilerle Arka Arkaya')}
            </span>
          </button>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEVELS.map((l, i) => {
            const locked = i > save.unlocked
            const best = save.best[l.id]
            const beaten = !!save.bosses[l.id]
            const boss = BOSSES[l.city]
            return (
              <li key={l.id} className={`flex items-center gap-3 border-2 px-3 py-2 ${locked ? 'border-line/50 opacity-50' : 'border-line bg-panel-2'}`}>
                <span className="plate shrink-0 text-[11px]">
                  <span>{String(l.plate).padStart(2, '0')}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-display text-base leading-tight text-cream">
                    <span className="truncate">{displayName(l)}</span>
                    {best && !best.stale && <MedalBadge medal={medalFor(l, best.timeMs)} />}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5" title={localize(l, lang).item}>
                    {[0, 1, 2].map((k) => (
                      <ItemIcon key={k} city={l.city} taken={!!best?.items[k]} size={20} />
                    ))}
                    <span className="mx-0.5 h-4 w-px bg-line" />
                    <ThingIcon kind="stamp" taken={!!save.stamps[l.id]} size={20} />
                    <ThingIcon kind="charm" taken={!!save.charms[l.id]} size={20} />
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{beaten ? (lang === 'en' ? boss.nameEn : boss.name) : t('Bekçi: ???')}</p>
                </div>
                <BossFigure city={l.city} className={`h-12 w-12 shrink-0 ${beaten ? '' : 'opacity-40 brightness-0'}`} />
              </li>
            )
          })}
        </ul>
      </div>
    </Overlay>
  )
}
