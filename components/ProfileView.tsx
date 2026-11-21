'use client'

import { useMemo } from 'react'
import Portrait from '@/components/Portrait'
import { MedalBadge } from '@/components/ui'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { SCARVES, scarfFor } from '@/lib/extras'
import { LEVELS } from '@/game/levels'
import { localize, useLang, useT } from '@/lib/i18n'
import type { ProfileCity, ProfileData } from '@/lib/profile'
import { formatTime } from '@/lib/storage'

/** kürsü renkleri: altın, gümüş, bronz (skor tablosuyla aynı) */
const PODIUM = ['#ffcc66', '#d7dde6', '#d08a52']

/** üç hatıra: dolu ya da boş nokta (renge ek olarak biçimle de ayrılır) */
function Pips({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`block h-2.5 w-2.5 rounded-full border-2 ${i < n ? 'border-gold bg-gold' : 'border-muted/70 bg-transparent'}`} />
      ))}
    </span>
  )
}

/** pul, nazar ve boss: kazanıldıysa dolu simge, değilse çizgili */
function Mark({ on, glyph, label }: { on: boolean; glyph: string; label: string }) {
  return (
    <span className={`inline-flex h-[18px] w-[18px] items-center justify-center text-[13px] leading-none ${on ? 'text-gold' : 'text-muted/80'}`} role="img" aria-label={`${label}: ${on ? '✓' : '–'}`} title={label}>
      <span className={on ? '' : 'opacity-60'}>{on ? glyph : '·'}</span>
    </span>
  )
}

function CityCell({ id, c }: { id: string; c?: ProfileCity }) {
  const t = useT()
  const lang = useLang()
  const l = LEVELS.find((x) => x.id === id)!
  const name = localize(l, lang).name
  return (
    <li className={`pf-city ${c ? 'pf-city-done' : ''}`} data-full={c?.full ? '1' : undefined}>
      <span className="plate shrink-0 text-[12px]">
        <span>{String(l.plate).padStart(2, '0')}</span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-display text-[15px] leading-tight text-cream">{name}</span>
          {c?.medal && <MedalBadge medal={c.medal} />}
          {c?.full && (
            <span className="shrink-0 border border-gold/80 bg-gold/10 px-1 text-[11px] font-bold leading-snug text-gold" title={t('Üç hatıra, pul ve nazar aynı koşuda')}>
              %100
            </span>
          )}
        </span>
        {c ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
            <Pips n={c.items} label={t('{n}/3 hatıra', { n: c.items })} />
            <Mark on={c.stamp} glyph="✉" label={t('Gizli Pul')} />
            <Mark on={c.charm} glyph="◉" label={t('Nazar Boncuğu')} />
            <Mark on={c.boss} glyph="♛" label={t('Boss')} />
            <span className="whitespace-nowrap">✕{c.deaths}</span>
            {c.rank ? <span className="whitespace-nowrap">{t('{n}. sırada', { n: c.rank })}</span> : null}
          </span>
        ) : (
          <span className="mt-1 block text-[12px] text-muted">{t('Henüz geçilmedi')}</span>
        )}
      </span>
      <span className={`font-display text-[17px] tabular-nums ${c ? 'text-cream' : 'text-muted'}`}>{c ? formatTime(c.timeMs) : '—'}</span>
    </li>
  )
}

/**
 * Yolcu profili: kimlik kartı (portre, kombin, unvan, atkı, katılım), özet sayılar, vitrin, Günün Üçlüsü, şehir ızgarası
 * ve son rekorlar. Oyun içinde (Defter → Profil) ve herkese açık /oyuncu/<ad> sayfasında aynı bileşen; `fit` verilince
 * ebeveynin yüksekliğine sığar ve yalnız şehir listesi kendi alanında kayar. `actions` kimlik kartının altına girer.
 */
export default function ProfileView({ data, fit = false, actions, headingLevel = 2 }: { data: ProfileData; fit?: boolean; actions?: React.ReactNode; headingLevel?: 1 | 2 }) {
  const t = useT()
  const lang = useLang()
  const n = LEVELS.length
  const done = Object.keys(data.cities).length
  const scarf = scarfFor(data.scarf)
  const own = scarf.id === SCARVES[0].id
  const since = data.since ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'tr-TR', { month: 'long', year: 'numeric' }).format(new Date(data.since)) : null
  const pins = useMemo(() => data.pins.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a), [data.pins])
  const mins = Math.round(data.playMs / 60000)
  const Heading = `h${headingLevel}` as 'h1' | 'h2'
  const fresh = done === 0
  const totals: [string, number, number][] = [
    [t('Şehir'), done, n],
    [t('Hatıra'), data.totals.keeps, n * 3],
    [t('Gizli Pul'), data.totals.stamps, n],
    [t('Nazar Boncuğu'), data.totals.charms, n],
    [t('Boss'), data.totals.bosses, n],
    [t('Altın Madalya'), data.totals.golds, n],
  ]
  const podiumChips = ([1, 2, 3] as const).filter((r) => data.podium[r])

  return (
    <div className={`pf ${fit ? 'pf-fit' : ''}`}>
      <div className="pf-side">
        <section className="pf-card pf-ident" aria-label={t('Kimlik')}>
          <div className="pf-portrait" aria-hidden>
            <Portrait id={data.hero} className="w-full" scarf={own ? null : { color: scarf.color, shade: scarf.shade }} accessory={data.kit} />
          </div>
          <div className="min-w-0 flex-1">
            <Heading className="break-words font-display text-[26px] leading-none text-cream short:text-[22px]">{data.name}</Heading>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="border-2 border-gold/80 bg-gold/10 px-1.5 text-[13px] font-bold leading-snug text-gold">★ {t(data.title)}</span>
              {!own && (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted" title={lang === 'en' ? scarf.nameEn : scarf.name}>
                  <span className="block h-3 w-3 rounded-full border border-ink" style={{ background: scarf.color }} aria-hidden />
                  {lang === 'en' ? scarf.nameEn : scarf.name}
                </span>
              )}
            </p>
            <p className="mt-1 text-[13px] text-muted">{since ? t('{d} tarihinden beri yolda.', { d: since }) : t('Yolculuk sürüyor.')}</p>
            {podiumChips.length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-1.5" aria-label={t('Haftalık Turnuva kürsüleri')}>
                {podiumChips.map((r) => (
                  <span key={r} className="border-2 px-1.5 text-[12px] font-bold leading-snug" style={{ borderColor: PODIUM[r - 1], color: PODIUM[r - 1] }}>
                    {['🥇', '🥈', '🥉'][r - 1]} {t(['Turnuva Birincisi', 'Turnuva İkincisi', 'Turnuva Üçüncüsü'][r - 1])}
                    {data.podium[r] > 1 ? ` × ${data.podium[r]}` : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
        </section>
        {actions && <div className="pf-actions">{actions}</div>}

        <dl className="pf-totals">
          {totals.map(([k, v, max]) => (
            <div key={k} className="min-w-0 bg-panel px-1.5 py-2 text-center short:py-1">
              <dd className={`font-display text-[18px] leading-none tabular-nums ${v === max ? 'text-gold' : 'text-cream'}`}>
                {v}
                <span className="text-[12px] text-muted">/{max}</span>
              </dd>
              <dt className="mt-1 truncate text-[12px] text-muted max-sm:text-[11px]" title={k}>{k}</dt>
            </div>
          ))}
        </dl>

        <section className="pf-card pf-showcase" aria-label={t('Vitrin')}>
          <h3 className="pf-h">{t('Vitrin')}</h3>
          {pins.length ? (
            <ul className="mt-1.5 grid grid-cols-3 gap-1.5 short:grid-cols-1">
              {pins.map((a) => (
                <li key={a.id} className="flex min-w-0 flex-col items-center gap-1 border border-gold/70 bg-gold/10 px-1.5 py-1.5 text-center short:flex-row short:text-left" title={t(a.text)}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-display text-[17px] text-ink">{a.icon}</span>
                  <span className="line-clamp-2 min-w-0 text-[12px] font-semibold leading-tight text-cream max-sm:sr-only short:text-[13px]">{t(a.name)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[13px] leading-snug text-muted">{t('İlk başarım kazanılınca vitrin dolar.')}</p>
          )}
          <p className="pf-stats mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            <span>
              {t('Başarım')} <b className="tabular-nums text-cream">{data.earned.length}/{ACHIEVEMENTS.length}</b>
            </span>
            <span>
              {t('Günün Üçlüsü')} <b className="tabular-nums text-cream">{data.trioDays}</b>
            </span>
            <span>
              {t('Günlük Seri')} <b className="tabular-nums text-cream">{data.streak}</b>
            </span>
            {data.runs > 0 && (
              <span className="max-sm:hidden">
                {t('Koşu')} <b className="tabular-nums text-cream">{data.runs}</b> · {mins >= 60 ? t('{h} sa {m} dk', { h: Math.floor(mins / 60), m: mins % 60 }) : t('{m} dk', { m: mins })}
              </span>
            )}
          </p>
        </section>
      </div>

      <section className="pf-main" aria-label={t('Şehir Şehir')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="pf-h">{t('Şehir Şehir')}</h3>
          <span className="text-[12px] text-muted">{t('En iyi süre, madalya, hatıra ve düşüş')}</span>
        </div>
        <ol className="pf-grid">
          {fresh && (
            <li className="pf-empty" style={{ gridColumn: '1 / -1' }}>
              <b className="block font-display text-[17px] text-cream">{t('Yolun Başındaki Yolcu')}</b>
              {t('İlk şehir bitince süre, madalya ve hatıralar burada sıralanır.')}
            </li>
          )}
          {LEVELS.map((l) => (
            <CityCell key={l.id} id={l.id} c={data.cities[l.id]} />
          ))}
        </ol>
        {data.recent.length > 0 && (
          <div className="mt-3 max-sm:hidden short:hidden">
            <h3 className="pf-h">{t('Son Rekorlar')}</h3>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {data.recent.map((r) => {
                const l = LEVELS.find((x) => x.id === r.id)
                return l ? (
                  <li key={`${r.id}-${r.at}`} className="border border-line bg-ink/40 px-2 py-1 text-[13px] text-cream">
                    {localize(l, lang).name} <b className="tabular-nums">{formatTime(r.timeMs)}</b>
                  </li>
                ) : null
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
