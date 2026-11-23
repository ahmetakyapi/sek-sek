'use client'

import { useLang, useT } from '@/lib/i18n'
import { rankLabel, type ListRank } from '@/lib/listRanks'
import { formatTime } from '@/lib/storage'

/**
 * Liste satırındaki sıralama izi (lib/listRanks.ts): lidersen altın "★ Lider", sıradaysan "#3/12", koşmadıysan
 * liderin adı. Ayrıntı (lider ve süresi) üstüne gelince `title`da; ekran okuyucu tam cümleyi okur.
 */
export function RankTag({ rank, className = '' }: { rank?: ListRank; className?: string }) {
  const t = useT()
  const lng = useLang()
  const r = rankLabel(rank)
  if (!r) return null
  const lead = r.name && r.ms ? t('Lider {name} · {time}', { name: r.name, time: formatTime(r.ms) }) : ''
  const full = r.kind === 'lead' ? t('Bu tabloda birincisin ({n} yolcu)', { n: r.total }) : r.kind === 'rank' ? `${t('{rank}. sıradasın ({n} yolcu)', { rank: r.rank!, n: r.total })} · ${lead}` : lead
  return (
    <span className={`inline-flex max-w-[150px] items-center gap-1 whitespace-nowrap text-[12px] leading-none tabular-nums ${className}`} title={full} aria-label={full}>
      {r.kind === 'lead' ? (
        <span className="rounded-sm bg-gold px-1.5 py-0.5 font-bold text-ink">★ {t('Lider')}</span>
      ) : r.kind === 'rank' ? (
        <span className="rounded-sm border border-accent-2/60 px-1.5 py-0.5 font-bold text-accent-2">
          #{r.rank}
          <span className="font-normal text-muted">/{r.total.toLocaleString(lng === 'en' ? 'en-US' : 'tr-TR')}</span>
        </span>
      ) : (
        <span className="truncate text-muted">
          ♛ <span className="text-cream/85">{r.name}</span>
        </span>
      )}
    </span>
  )
}
