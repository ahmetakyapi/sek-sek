'use client'

import { useEffect, useRef, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { MedalBadge, displayName, medalFor } from '@/components/ui'
import { LEVELS } from '@/game/levels'
import { DAILY_RULES, dailyRun, istanbulDay, shiftDay } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Tablo türü: bir şehir, genel toplamlar, hesaba kayıtlı defter ya da günün meydan okuması */
export type BoardKind = 'city' | 'genel' | 'koleksiyon' | 'gunluk'

interface Row {
  name: string
  rank: number
  total: number
  me: boolean
  timeMs?: number
  deaths?: number
  items?: number
  minDeaths?: number
  maxItems?: number
  plays?: number
  cities?: number
  keeps?: number
  stamps?: number
  charms?: number
  bosses?: number
  found?: number
}

const n = (x: number | undefined) => x ?? 0

/**
 * Sıralama listesi: ilk satırlar + (ilk sıralarda değilse) oyuncunun kendi satırı. Sağ sütun seçili ölçütü büyük
 * yazar (süre, düşüş, hatıra, şehir); öteki ölçütler adın altında küçük durur. Böylece filtre değişince hem sıra
 * hem görünen değer değişir.
 */
export function Board({ kind, level = '', sort = '', day = '', me, refresh = 0, compact = false }: { kind: BoardKind; level?: string; sort?: string; day?: string; me: string; refresh?: number; compact?: boolean }) {
  const t = useT()
  const lng = useLang()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    setFailed(false)
    setRows(null)
    const q = new URLSearchParams({ level: kind === 'city' ? level : kind, ...(sort ? { sort } : {}), ...(day ? { day } : {}), ...(me ? { me } : {}) })
    fetch(`/api/scores?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('x'))))
      .then((j: { scores: Row[] }) => live && setRows(j.scores))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [kind, level, sort, day, me, refresh, retry])

  if (failed)
    return (
      <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-muted">
        {t('Skor tablosuna şu an ulaşılamıyor.')}
        <button className="pixel-btn px-3 py-1.5 text-[12px]" onClick={() => setRetry((x) => x + 1)}>
          {t('Tekrar Dene')}
        </button>
      </p>
    )
  if (!rows)
    return (
      <ol className="mt-2 grid gap-1" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="h-[46px] animate-pulse bg-panel-2/50" />
        ))}
      </ol>
    )
  if (!rows.length) return <p className="mt-3 border-2 border-dashed border-line/70 px-3 py-4 text-center text-[13px] text-muted">{kind === 'gunluk' ? t('Bugün henüz kimse koşmadı. İlk skor senin olsun!') : t('Henüz skor yok. İlk sen ol!')}</p>

  const lv = kind === 'city' ? LEVELS.find((l) => l.id === level) : undefined
  const plural = (k: number, one: string, many: string) => (lng === 'en' ? `${k} ${k === 1 ? one : many}` : `${k} ${one}`)

  /** sağdaki büyük değer ve adın altındaki ayrıntı */
  const cells = (r: Row): [React.ReactNode, string] => {
    if (kind === 'koleksiyon')
      return [
        <>
          {n(r.found)}
          <span className="ml-1 text-[11px] text-muted">{t('parça')}</span>
        </>,
        t('{k} hatıra · {s} pul · {c} nazar · {b} boss', { k: n(r.keeps), s: n(r.stamps), c: n(r.charms), b: n(r.bosses) }),
      ]
    if (kind === 'genel') {
      const sub = [plural(n(r.cities), t('şehir'), 'cities'), plural(n(r.items), t('hatıra'), 'keepsakes'), `✕${n(r.deaths)}`, formatTime(n(r.timeMs))]
      if (sort === 'items') return [<>{n(r.items)}<span className="ml-0.5 text-[12px] text-muted">/{LEVELS.length * 3}</span></>, sub.filter((_, i) => i !== 1).join(' · ')]
      if (sort === 'deaths') return [<>✕{n(r.deaths)}</>, sub.filter((_, i) => i !== 2).join(' · ')]
      return [<>{n(r.cities)}<span className="ml-0.5 text-[12px] text-muted">/{LEVELS.length}</span></>, sub.filter((_, i) => i !== 0).join(' · ')]
    }
    const plays = n(r.plays) > 1 ? ` · ${t('{n} koşu', { n: n(r.plays) })}` : ''
    if (kind === 'gunluk') return [formatTime(n(r.timeMs)), `✕${n(r.deaths)} · ${n(r.items)}/3${plays}`]
    if (sort === 'deaths') return [<>✕{n(r.minDeaths)}</>, `${formatTime(n(r.timeMs))} · ${n(r.maxItems)}/3${plays}`]
    if (sort === 'items') return [<>{n(r.maxItems)}<span className="ml-0.5 text-[12px] text-muted">/3</span><span className="ml-2 text-[15px] text-cream/80">{formatTime(n(r.timeMs))}</span></>, `✕${n(r.minDeaths)}${plays}`]
    return [formatTime(n(r.timeMs)), `✕${n(r.deaths)} · ${n(r.items)}/3${plays}`]
  }

  return (
    <>
      <ol className="mt-2 grid gap-1 text-[14px] tabular-nums">
        {rows.map((r, i) => {
          const gap = i > 0 && r.rank > rows[i - 1].rank + 1
          const [big, sub] = cells(r)
          const medal = lv && (kind === 'city' && (!sort || sort === 'time')) ? medalFor(lv, n(r.timeMs)) : null
          return (
            <li key={`${r.name}-${r.rank}`} className={gap ? 'mt-2 border-t-2 border-dashed border-line/70 pt-2' : ''}>
              <div className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2.5 px-2 ${compact ? 'py-1' : 'py-1.5'} ${r.me ? 'bg-accent/25 outline outline-2 outline-accent/60' : i % 2 ? '' : 'bg-panel-2/60'}`}>
                <span className={`text-center font-display text-[17px] leading-none ${r.rank === 1 ? 'text-[#f2c14e]' : r.rank === 2 ? 'text-[#d7dde6]' : r.rank === 3 ? 'text-[#d08a52]' : 'text-muted'}`}>{r.rank}</span>
                <span className="min-w-0">
                  <a href={`/oyuncu/${encodeURIComponent(r.name)}`} className="block truncate font-semibold text-cream underline-offset-4 hover:underline">
                    {r.name}
                    {r.me && <span className="ml-1.5 text-[11px] font-bold tracking-[0.12em] text-gold">{t('SEN')}</span>}
                  </a>
                  <span className={`block text-[12px] leading-snug text-muted ${kind === 'koleksiyon' ? '' : 'truncate'}`}>{sub}</span>
                </span>
                <span className="flex items-center gap-1.5 font-display text-[19px] leading-none text-cream">
                  {medal && <MedalBadge medal={medal} />}
                  {big}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-right text-[11px] text-muted">{t('{n} yolcu bu tabloda', { n: rows[0].total })}</p>
    </>
  )
}

type Tab = 'genel' | 'city' | 'gunluk' | 'koleksiyon'

/** Skor Tablosu ekranı: dört sekme; her sekmenin kendi sıralama seçenekleri ve kısa bir açıklaması var. */
export default function ScoreBoard({ me, startCity = 0, startTab = 'genel', onDaily }: { me: string; startCity?: number; startTab?: Tab; onDaily: () => void }) {
  const t = useT()
  const lng = useLang()
  const [tab, setTab] = useState<Tab>(startTab)
  const [idx, setIdx] = useState(startCity)
  const [sort, setSort] = useState('')
  const today = istanbulDay(new Date())
  const [day, setDay] = useState(today)
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const st = strip.current
    const el = st?.querySelector<HTMLElement>('[data-on="1"]')
    if (st && el) st.scrollTo({ left: el.offsetLeft - st.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [idx, tab])
  const step = (d: number) => setIdx((i) => (i + d + LEVELS.length) % LEVELS.length)

  const tabs: [Tab, string][] = [
    ['genel', t('Genel')],
    ['city', t('Şehirler')],
    ['gunluk', t('Günlük')],
    ['koleksiyon', t('Koleksiyon')],
  ]
  const sorts: [string, string][] =
    tab === 'genel'
      ? [['', t('Bitirilen Şehir')], ['items', t('Hatıra')], ['deaths', t('En Az Düşüş')]]
      : tab === 'city'
        ? [['', t('Süre')], ['deaths', t('En Az Düşüş')], ['items', t('Hatıra')]]
        : []
  const lv = localize(LEVELS[idx], lng)
  const daily = dailyRun(day, LEVELS)
  const dailyLevel = LEVELS.find((l) => l.id === daily.levelId)!
  const rule = DAILY_RULES[daily.rule]
  const note =
    tab === 'genel'
      ? sort === 'items'
        ? t('Bütün şehirlerde bulunan en çok hatıra. Eşitlikte çok şehir bitiren önde.')
        : sort === 'deaths'
          ? t('Önce bitirilen şehir sayısı, sonra şehirlerdeki en az düşüşlerin toplamı.')
          : t('Önce bitirilen şehir sayısı, sonra en iyi sürelerin toplamı.')
      : tab === 'city'
        ? sort === 'deaths'
          ? t('Her yolcunun bu şehirdeki en az düşüşlü koşusu.')
          : sort === 'items'
            ? t('Her yolcunun bu şehirde bulduğu en çok hatıra; eşitlikte hızlı olan önde.')
            : t('Her yolcunun bu şehirdeki en iyi süresi.')
        : tab === 'koleksiyon'
          ? t('Hesaba kayıtlı defterden: hatıra, gizli pul ve nazar boncuğu toplamı.')
          : t('Herkes için aynı şehir ve aynı kural; skor süreye cezalar eklenerek hesaplanır.')

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col short:mt-1.5">
      <div className="grid grid-cols-4 gap-1.5" role="tablist">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={`pixel-btn justify-center px-1 py-1.5 text-[12px] sm:text-[13px] ${tab === k ? 'primary' : ''}`}
            onClick={() => {
              setTab(k)
              setSort('')
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'city' && (
        <div className="mt-2.5 flex items-center gap-2">
          <button aria-label={t('Önceki Şehir')} className="pixel-btn shrink-0 px-2.5 py-1.5" onClick={() => step(-1)}>
            ‹
          </button>
          <div ref={strip} className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto py-1">
            {LEVELS.map((l, i) => (
              <button key={l.id} data-on={i === idx ? 1 : 0} className={`pixel-btn shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[12px] ${i === idx ? 'primary' : ''}`} onClick={() => setIdx(i)}>
                {String(l.plate).padStart(2, '0')} {l.name}
              </button>
            ))}
          </div>
          <button aria-label={t('Sonraki Şehir')} className="pixel-btn shrink-0 px-2.5 py-1.5" onClick={() => step(1)}>
            ›
          </button>
        </div>
      )}

      {tab === 'gunluk' ? (
        <div className="mt-2.5 flex items-center gap-3 border-2 border-gold/70 bg-gold/5 px-3 py-2 short:mt-1.5 short:py-1">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2a2438] shadow-[0_0_0_2px_#d9a441]">
            <ItemIcon city={dailyLevel.city} taken size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gold">{day === today ? t('BUGÜN') : t('DÜN')} · {t(rule.name).toLocaleUpperCase(lng)}</p>
            <p className="truncate font-display text-lg leading-tight text-cream">{displayName(dailyLevel)}</p>
            <p className="text-[12px] leading-snug text-muted short:hidden">{t(rule.text)}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {day === today ? (
              <button className="pixel-btn primary px-3 py-1.5 text-[13px]" onClick={onDaily}>
                {t('▶ Oyna')}
              </button>
            ) : null}
            <button className="pixel-btn px-2 py-1 text-[12px]" onClick={() => setDay(day === today ? shiftDay(today, -1) : today)}>
              {day === today ? t('Dünkü') : t('Bugünkü')}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 font-display text-xl text-gold short:hidden">{tab === 'city' ? displayName(LEVELS[idx]) : tab === 'genel' ? t('Genel Sıralama') : t('Koleksiyoncular')}</p>
      )}
      <p className="mt-0.5 text-[12px] leading-snug text-muted short:hidden">{tab === 'city' ? `${lv.subtitle} · ${note}` : note}</p>
      {sorts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t('Sıralama')}>
          {sorts.map(([k, label]) => (
            <button key={k || 'default'} aria-pressed={sort === k} className={`pixel-btn px-2.5 py-1.5 text-[13px] ${sort === k ? 'primary' : ''}`} onClick={() => setSort(k)}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="overlay-scroll mt-1 min-h-[160px] flex-1 overflow-y-auto overscroll-contain pr-1 short:min-h-[72px]">
        <Board kind={tab} level={LEVELS[idx].id} sort={sort} day={tab === 'gunluk' ? day : ''} me={me} />
      </div>
    </div>
  )
}
