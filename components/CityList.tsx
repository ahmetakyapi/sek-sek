'use client'

import { MedalBadge } from '@/components/ui'
import { medalFor } from '@/components/medal'
import { LEVELS } from '@/game/levels'
import { useT } from '@/lib/i18n'
import type { ListRank } from '@/lib/listRanks'
import type { Best } from '@/lib/storage'

export { CITY_FILTERS, cityMatches, type CityFilter } from '@/lib/cityFilter'

/**
 * Şehirler ekranının başlık şeridi: geçilen şehir (ilerleme çubuğuyla), altın madalya, hatıra ve lider olunan şehir sayısı.
 * Dar ve alçak ekranda gizlenir (başlık ve Geri yalnız kalır).
 */
export function CityStats({ save, ranks }: { save: { best: Record<string, Best> }; ranks: Record<string, ListRank> }) {
  const t = useT()
  const done = LEVELS.filter((l) => save.best[l.id]).length
  const gold = LEVELS.filter((l) => {
    const b = save.best[l.id]
    return b && !b.stale && medalFor(l, b.timeMs) === 'altin'
  }).length
  const keeps = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
  const lead = Object.values(ranks).filter((r) => r.myRank === 1).length
  const cell = 'flex min-w-0 flex-col items-center px-3 leading-none'
  return (
    <div className="city-stats mx-auto flex items-stretch divide-x divide-line max-md:hidden short:hidden" role="group" aria-label={t('Yolun Özeti')}>
      <div className={cell}>
        <span className="font-display text-[18px] tabular-nums text-cream">
          {done}
          <span className="text-[13px] text-muted">/{LEVELS.length}</span>
        </span>
        <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/70" aria-hidden>
          <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.round((done / LEVELS.length) * 100)}%` }} />
        </span>
        <span className="mt-1 text-[11px] text-muted">{t('Geçildi')}</span>
      </div>
      <div className={cell}>
        <span className="flex items-center gap-1 font-display text-[18px] tabular-nums text-cream">
          <MedalBadge medal="altin" /> {gold}
        </span>
        <span className="mt-2 text-[11px] text-muted">{t('Altın')}</span>
      </div>
      <div className={cell}>
        <span className="font-display text-[18px] tabular-nums text-cream">
          {keeps}
          <span className="text-[13px] text-muted">/{LEVELS.length * 3}</span>
        </span>
        <span className="mt-2 text-[11px] text-muted">{t('Hatıra')}</span>
      </div>
      <div className={cell}>
        <span className="font-display text-[18px] tabular-nums text-gold">★ {lead}</span>
        <span className="mt-2 text-[11px] text-muted">{t('Lider')}</span>
      </div>
    </div>
  )
}
