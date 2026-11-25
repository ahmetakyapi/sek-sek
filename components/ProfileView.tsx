'use client'

import { useMemo, useState } from 'react'
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
/** yolcunun kendi atkısının rengi: kartın tonu (Uktun turkuaz, Memo kırmızı) */
const OWN_TINT: Record<string, string> = { uktun: '#5ad6c6', memo: '#e0574f' }

/** Kartın tonu: seçili atkının rengi, kendi atkısıysa yolcunun rengi */
export function tintOf(d: Pick<ProfileData, 'scarf' | 'hero'>) {
  const s = scarfFor(d.scarf)
  return s.id === SCARVES[0].id ? (OWN_TINT[d.hero] ?? OWN_TINT.uktun) : s.color
}

/** Bütün şehirlerin toplam en iyi süresi */
export const totalTime = (d: ProfileData) => Object.values(d.cities).reduce((a, c) => a + c.timeMs, 0)

/** Yol halkası: bitirilen şehir oranı (ortada yüzde) */
export function ProgressRing({ value, max, size = 64, label }: { value: number; max: number; size?: number; label: string }) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const p = max ? Math.min(1, value / max) : 0
  return (
    <span className="pf-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value}/${max}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(14 13 34 / 0.7)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring, var(--color-gold))" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="pf-ring-in" aria-hidden>
        <b style={{ fontSize: size * (p >= 1 ? 0.22 : 0.27) }}>{Math.round(p * 100)}</b>
        <small>%</small>
      </span>
    </span>
  )
}

/** Altı özet sayı (şehir, hatıra, pul, nazar, boss, altın): değer, en çok ve ince doluluk çubuğu */
export function TotalsGrid({ data, className = '' }: { data: ProfileData; className?: string }) {
  const t = useT()
  const n = LEVELS.length
  const done = Object.keys(data.cities).length
  const totals: [string, string, number, number][] = [
    ['▣', t('Şehir'), done, n],
    ['✦', t('Hatıra'), data.totals.keeps, n * 3],
    ['✉', t('Gizli Pul'), data.totals.stamps, n],
    ['◉', t('Nazar Boncuğu'), data.totals.charms, n],
    ['♛', t('Boss'), data.totals.bosses, n],
    ['★', t('Altın Madalya'), data.totals.golds, n],
  ]
  return (
    <dl className={`pf-totals ${className}`}>
      {totals.map(([g, k, v, max]) => (
        <div key={k} className={`pf-tot ${v === max ? 'pf-tot-full' : ''}`}>
          <dt className="pf-tot-k" title={k}>
            <span aria-hidden>{g}</span> {k}
          </dt>
          <dd className="pf-tot-v">
            {v}
            <small>/{max}</small>
          </dd>
          <span className="pf-bar" aria-hidden>
            <span style={{ width: `${Math.round((v / max) * 100)}%` }} />
          </span>
        </div>
      ))}
    </dl>
  )
}

/** üç hatıra: dolu ya da boş nokta (renge ek olarak biçimle de ayrılır) */
function Pips({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={label} title={label}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`block h-2 w-2 rounded-full border-2 ${i < n ? 'border-gold bg-gold' : 'border-muted/60 bg-transparent'}`} />
      ))}
    </span>
  )
}

/** pul, nazar ve boss: kazanıldıysa dolu simge, değilse soluk nokta */
function Mark({ on, glyph, label }: { on: boolean; glyph: string; label: string }) {
  return (
    <span className={`inline-flex h-4 w-4 items-center justify-center text-[12px] leading-none ${on ? 'text-gold' : 'text-muted/70'}`} role="img" aria-label={`${label}: ${on ? '✓' : '–'}`} title={label}>
      {on ? glyph : '·'}
    </span>
  )
}

/** Toplananlar: üç hatıra + pul, nazar, boss */
export function Collected({ c }: { c: ProfileCity }) {
  const t = useT()
  return (
    <span className="pf-col">
      <Pips n={c.items} label={t('{n}/3 hatıra', { n: c.items })} />
      <Mark on={c.stamp} glyph="✉" label={t('Gizli Pul')} />
      <Mark on={c.charm} glyph="◉" label={t('Nazar Boncuğu')} />
      <Mark on={c.boss} glyph="♛" label={t('Boss')} />
    </span>
  )
}

function CityRow({ c }: { c: ProfileCity }) {
  const t = useT()
  const lang = useLang()
  const l = LEVELS.find((x) => x.id === c.id)!
  return (
    <li className="pf-row" data-full={c.full ? '1' : undefined}>
      <span className="plate shrink-0 justify-self-start text-[11px]">
        <span>{String(l.plate).padStart(2, '0')}</span>
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold leading-tight text-cream">{localize(l, lang).name}</span>
          {c.full && (
            <span className="pf-tag" title={t('Üç hatıra, pul ve nazar aynı koşuda')}>
              %100
            </span>
          )}
        </span>
        <span className="pf-col-sm">
          <Collected c={c} />
        </span>
      </span>
      <span className="pf-col-lg">
        <Collected c={c} />
      </span>
      <span className="pf-time">
        <span className="inline-flex w-4 justify-center">{c.medal && <MedalBadge medal={c.medal} />}</span>
        {formatTime(c.timeMs)}
      </span>
      <span className="pf-rank">{c.rank ? `#${c.rank}` : <span className="text-muted">✕{c.deaths}</span>}</span>
    </li>
  )
}

type Filter = 'hepsi' | 'altin' | 'tam' | 'eksik'
type Sort = 'plaka' | 'sure' | 'sira'
const lacking = (c: ProfileCity) => !(c.items === 3 && c.stamp && c.charm && c.boss)

/**
 * Yolcu profili: kimlik kartı (büyük portre, kombin, unvan, atkı, katılım, yol halkası), özet sayılar, vitrin ve
 * "Şehir Şehir" tablosu (süzgeç: Hepsi / Altın / %100 / Eksik; sıralama: plaka, süre, sıra; geçilmemiş şehirler tek
 * satırda plaka bulutu). Oyun içinde (Defter → Profil) ve herkese açık /oyuncu/<ad> sayfasında aynı bileşen; `fit`
 * verilince ebeveynin yüksekliğine sığar ve yalnız şehir tablosu kendi alanında kayar. `actions` kimlik kartının altına girer.
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
  const podiumChips = ([1, 2, 3] as const).filter((r) => data.podium[r])
  const [filter, setFilter] = useState<Filter>('hepsi')
  const ranked = Object.values(data.cities).some((c) => c.rank)
  const [sortBy, setSortBy] = useState<Sort>('plaka')
  const sort: Sort = sortBy === 'sira' && !ranked ? 'plaka' : sortBy

  const played = useMemo(() => LEVELS.flatMap((l) => (data.cities[l.id] ? [data.cities[l.id]] : [])), [data.cities])
  const plate = (id: string) => LEVELS.find((l) => l.id === id)?.plate ?? 99
  const counts: Record<Filter, number> = {
    hepsi: played.length,
    altin: played.filter((c) => c.medal === 'altin').length,
    tam: played.filter((c) => c.full).length,
    eksik: played.filter(lacking).length,
  }
  const rows = played
    .filter((c) => (filter === 'altin' ? c.medal === 'altin' : filter === 'tam' ? c.full : filter === 'eksik' ? lacking(c) : true))
    .sort((a, b) => (sort === 'sure' ? a.timeMs - b.timeMs : sort === 'sira' ? (a.rank ?? 1e9) - (b.rank ?? 1e9) || a.timeMs - b.timeMs : plate(a.id) - plate(b.id)))
  const unplayed = LEVELS.filter((l) => !data.cities[l.id]).sort((a, b) => a.plate - b.plate)
  const filters: [Filter, string][] = [
    ['hepsi', t('Hepsi')],
    ['altin', t('Altın')],
    ['tam', '%100'],
    ['eksik', t('Eksik')],
  ]
  const sorts: [Sort, string][] = [['plaka', t('Plaka')], ['sure', t('Süre')], ...(ranked ? ([['sira', t('Sıra')]] as [Sort, string][]) : [])]

  return (
    <div className={`pf ${fit ? 'pf-fit' : ''}`} style={{ ['--tint' as string]: tintOf(data) }}>
      <div className="pf-side">
        <section className="pf-ident" aria-label={t('Kimlik')}>
          <div className="pf-portrait" aria-hidden>
            <Portrait id={data.hero} className="w-full" scarf={own ? null : { color: scarf.color, shade: scarf.shade }} accessory={data.kit} />
          </div>
          <div className="min-w-0 flex-1">
            <Heading className="pf-name">{data.name}</Heading>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="pf-title">★ {t(data.title)}</span>
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
                  <span key={r} className="rounded-sm border px-1.5 text-[12px] font-bold leading-snug" style={{ borderColor: PODIUM[r - 1], color: PODIUM[r - 1] }}>
                    {['🥇', '🥈', '🥉'][r - 1]} {t(['Turnuva Birincisi', 'Turnuva İkincisi', 'Turnuva Üçüncüsü'][r - 1])}
                    {data.podium[r] > 1 ? ` × ${data.podium[r]}` : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="pf-ident-foot">
            <ProgressRing value={done} max={n} size={fit ? 44 : 52} label={t('Bitirilen Şehir')} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-cream">
                {t('{a}/{b} şehir bitti', { a: done, b: n })}
              </span>
              <span className="pf-bar mt-1.5" aria-hidden>
                <span style={{ width: `${Math.round((done / n) * 100)}%` }} />
              </span>
            </span>
            {done > 0 && (
              <span className="shrink-0 text-right">
                <span className="block text-[11px] text-muted">{t('Toplam Süre')}</span>
                <b className="font-display text-[16px] tabular-nums text-cream">{formatTime(totalTime(data))}</b>
              </span>
            )}
          </div>
        </section>
        {actions && <div className="pf-actions">{actions}</div>}

        <TotalsGrid data={data} />

        <section className="pf-card pf-showcase" aria-label={t('Vitrin')}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="pf-h">{t('Vitrin')}</h3>
            <span className="text-[12px] text-muted">
              {t('Başarım')} <b className="tabular-nums text-cream">{data.earned.length}/{ACHIEVEMENTS.length}</b>
            </span>
          </div>
          {pins.length ? (
            <ul className="mt-1.5 grid grid-cols-3 gap-1.5 short:grid-cols-1">
              {pins.map((a) => (
                <li key={a.id} className="pf-pin" title={t(a.text)}>
                  <span className="pf-pin-ic">{a.icon}</span>
                  <span className="line-clamp-2 min-w-0 text-[12px] font-semibold leading-tight text-cream max-sm:sr-only short:text-[13px]">{t(a.name)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[13px] leading-snug text-muted">{t('İlk başarım kazanılınca vitrin dolar.')}</p>
          )}
          <p className="pf-stats mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
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
        <div className="pf-head">
          <h3 className="pf-h">
            {t('Şehir Şehir')} <span className="text-[13px] font-normal tabular-nums text-muted">{done}/{n}</span>
          </h3>
          {!fresh && (
            <div className="pf-tools">
              <div className="seg pf-seg" role="group" aria-label={t('Süz')}>
                {filters.map(([k, label]) => (
                  <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                    {label} <span className="pf-count">{counts[k]}</span>
                  </button>
                ))}
              </div>
              <div className="seg pf-seg" role="group" aria-label={t('Sırala')}>
                {sorts.map(([k, label]) => (
                  <button key={k} aria-pressed={sort === k} onClick={() => setSortBy(k)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="pf-table">
          {fresh ? (
            <div className="pf-empty">
              <b className="block font-display text-[17px] text-cream">{t('Yolun Başındaki Yolcu')}</b>
              {t('İlk şehir bitince süre, madalya ve hatıralar burada sıralanır.')}
            </div>
          ) : (
            <>
              <div className="pf-row pf-row-h" aria-hidden>
                <span>{t('Plaka')}</span>
                <span>{t('Şehir')}</span>
                <span className="pf-col-lg">{t('Toplananlar')}</span>
                <span className="text-right">{t('Süre')}</span>
                <span className="text-right">{ranked ? t('Sıra') : t('Düşüş')}</span>
              </div>
              {rows.length ? (
                <ol className="pf-rows">
                  {rows.map((c) => (
                    <CityRow key={c.id} c={c} />
                  ))}
                </ol>
              ) : (
                <p className="px-3 py-4 text-center text-[13px] text-muted">{filter === 'eksik' ? t('Bitirilen her şehirde her şey toplandı.') : t('Bu süzgece uyan şehir yok.')}</p>
              )}
              {filter === 'hepsi' && unplayed.length > 0 && (
                <div className="pf-rest">
                  <p className="text-[12px] font-semibold text-muted">
                    {t('Henüz Geçilmedi')} · <span className="tabular-nums">{unplayed.length}</span>
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {unplayed.map((l) => (
                      <li key={l.id} className="pf-ghost-plate" title={localize(l, lang).name}>
                        <span className="sr-only">{localize(l, lang).name} </span>
                        {String(l.plate).padStart(2, '0')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        {data.recent.length > 0 && (
          <div className="pf-recent mt-3 max-sm:hidden short:hidden">
            <h3 className="pf-h">{t('Son Rekorlar')}</h3>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {data.recent.map((r) => {
                const l = LEVELS.find((x) => x.id === r.id)
                return l ? (
                  <li key={`${r.id}-${r.at}`} className="rounded-sm border border-line bg-ink/40 px-2 py-1 text-[13px] text-cream">
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
