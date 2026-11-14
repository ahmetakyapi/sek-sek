'use client'

import { BossFigure } from '@/components/Figures'
import { ItemIcon, ThingIcon } from '@/components/HudBits'
import { MedalBadge, Overlay, displayName, medalFor } from '@/components/ui'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { SCARVES, emptyStats, liveStreak, travelerTitle } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime, titleFacts, type Save } from '@/lib/storage'

/** Boss Rush’ın açılması için yenilmesi gereken boss sayısı */
export const RUSH_NEEDS = 3

/**
 * Yol Defteri: yolculukta toplanan her şey tek sayfada. Şehir başına üç hatıra, gizli pul, nazar boncuğu
 * ve meydanın bekçisi; üstte toplamlar, görev rozetleri ve Boss Rush.
 */
export default function Defter({ save, today, onClose, onModes }: { save: Save; today: string; onClose: () => void; onModes: () => void }) {
  const t = useT()
  const lang = useLang()
  const n = LEVELS.length
  const items = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
  const stamps = LEVELS.filter((l) => save.stamps[l.id]).length
  const charms = LEVELS.filter((l) => save.charms[l.id]).length
  const bosses = LEVELS.filter((l) => save.bosses[l.id]).length
  const scarves = SCARVES.filter((s) => charms >= s.need).length
  const stats = save.stats ?? emptyStats()
  const streak = liveStreak(save.meydan, today)
  const mins = Math.round(stats.playMs / 60000)
  const hours = mins >= 60 ? t('{h} sa {m} dk', { h: Math.floor(mins / 60), m: mins % 60 }) : t('{m} dk', { m: mins })
  const totals: [string, number, number][] = [
    [t('Hatıra'), items, n * 3],
    [t('Gizli Pul'), stamps, n],
    [t('Nazar Boncuğu'), charms, n],
    [t('Boss'), bosses, n],
    [t('Atkı'), scarves, SCARVES.length],
  ]
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1280px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YOLCULUĞUN ÖZETİ')}</p>
            <h2 className="mt-1 flex flex-wrap items-baseline gap-x-3 font-display text-3xl text-cream short:text-2xl">
              {t('Yol Defteri')}
              <span className="border-2 border-gold bg-gold/10 px-2 py-0.5 text-[13px] tracking-[0.06em] text-gold" title={t('Unvanın: yolculuğunun en parlak yanı')}>
                ★ {t(travelerTitle(titleFacts(save, today)))}
              </span>
            </h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onClose}>
            {t('← Geri')}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5 text-center sm:gap-2 short:mt-2">
          {totals.map(([k, v, max]) => (
            <div key={k} className={`border-2 py-2 short:py-1 ${v === max ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
              <p className="font-display text-base leading-none tabular-nums text-cream sm:text-xl">
                {v}
                <span className="text-sm text-muted">/{max}</span>
              </p>
              <p className="mt-1 truncate px-0.5 text-[11px] text-muted">{k}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 short:hidden">
          <div className="border-2 border-line bg-ink/40 px-3 py-2 max-sm:hidden">
            <p className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('GÖREVLER')}</p>
            <p className="mt-0.5 text-[13px] text-cream">{t('{d} gün · {w} hafta tamamlandı', { d: save.daily.count, w: save.weekly.count })}</p>
          </div>
          <button className="pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left" onClick={onModes}>
            <span className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('GÜNLÜK MEYDAN OKUMA')}</span>
            <span className="text-[13px]">{streak ? t('🔥 {n} günlük seri', { n: streak }) : t('▶ Bugün Oyna, Seriyi Başlat')}</span>
          </button>
          <button className="pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left" onClick={onModes}>
            <span className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('BOSS RUSH')}</span>
            <span className="text-[13px]">
              {bosses < RUSH_NEEDS
                ? t('Önce {n} Boss Yen', { n: RUSH_NEEDS })
                : save.rush
                  ? t('Rekor: {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })
                  : t('▶ Yendiğin Boss’larla Arka Arkaya')}
            </span>
          </button>
        </div>

        {/* yol istatistikleri: küçük sayaçlar, bir bakışta */}
        <p className={`mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] tabular-nums text-muted max-sm:hidden short:hidden ${stats.runs ? '' : 'hidden'}`}>
          {(
            [
              [t('Koşu'), stats.runs],
              [t('Zıplama'), stats.jumps],
              [t('Dash'), stats.dashes],
              [t('Düşüş'), stats.deaths],
              [t('Ezilen Düşman'), stats.stomps],
            ] as const
          ).map(([k, v]) => (
            <span key={k}>
              {k} <strong className="text-cream">{v.toLocaleString(lang)}</strong>
            </span>
          ))}
          <span>
            {t('Yolda Geçen Süre')} <strong className="text-cream">{hours}</strong>
          </span>
        </p>

        <ul className="overlay-scroll mt-4 grid min-h-[120px] grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 short:mt-2 wide:grid-cols-3 min-[1400px]:wide:grid-cols-4">
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
                  <p className="mt-0.5 truncate text-[11px] text-muted">{beaten ? (lang === 'en' ? boss.nameEn : boss.name) : t('Boss: ???')}</p>
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
