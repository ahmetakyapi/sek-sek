'use client'

import { useEffect, useRef, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { MedalBadge, SectionTitle, displayName, medalFor, ic } from '@/components/ui'
import { CHALLENGES } from '@/game/challenges'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { DAILY_RULES, RAGE_RULES, RULES, dailyBoss, dailyMini, dailyRun, istanbulDay, ruleFits, shiftDay, type DailyRule } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Tablo türü: bir şehir, genel toplamlar, hesaba kayıtlı defter, günün meydan okuması ya da haftanın turnuvası */
export type BoardKind = 'city' | 'genel' | 'koleksiyon' | 'gunluk' | 'gunluk-m' | 'gunluk-b' | 'kural' | 'bossrush' | 'turnuva' | 'yuzde' | 'tur' | 'aynatur'

interface Row {
  name: string
  rank: number
  total: number
  me: boolean
  /** oynanan yolcu (portre küçük resmi): uktun | memo */
  hero?: string | null
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
/** kürsü renkleri: altın, gümüş, bronz */
const PODIUM = ['#ffcc66', '#d7dde6', '#d08a52']
const PODIUM_NAME = ['Birinci Sıra', 'İkinci Sıra', 'Üçüncü Sıra']
/** adın baş harfi için sabit, sıcak bir renk (adın özetinden) */
const AVATARS = ['#e07a5f', '#81b29a', '#f2cc8f', '#8ecae6', '#c8a2d6', '#f4a261', '#a8dadc', '#e9c46a']
const avatarColor = (name: string) => AVATARS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATARS.length]
/** her sayfada kaç satır daha açılır; sunucu en çok 100 satır verir */
const PAGE = 20
const MAX_LIST = 100

const stored = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* depo kapalı: tercih hatırlanmaz */
    }
  },
}

/** Satırda yolcunun küçük resmi (portre); bilinmiyorsa adın baş harfi */
function Avatar({ name, hero }: { name: string; hero?: string | null }) {
  const known = hero === 'uktun' || hero === 'memo'
  return (
    <span aria-hidden className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-[15px] text-ink sm:h-10 sm:w-10 sm:text-[18px]" style={{ background: avatarColor(name), boxShadow: '0 0 0 2px rgba(0,0,0,0.35)' }}>
      {known ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/portreler/${hero}.png`} alt="" width={40} height={40} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
      ) : (
        name.slice(0, 1).toLocaleUpperCase('tr')
      )}
    </span>
  )
}

/**
 * Sıralama listesi: ilk satırlar + (ilk sıralarda değilse) oyuncunun kendi satırı. Sağ sütun seçili ölçütü büyük
 * yazar (süre, düşüş, hatıra, şehir); öteki ölçütler adın altında küçük durur. Böylece filtre değişince hem sıra
 * hem görünen değer değişir. Üstte yapışkan "Senin Sıran" şeridi (sıra, liderle fark, son bakıştan beri değişim, kendine git),
 * altta "Daha Fazla Göster" ve ok tuşlarıyla satırlar arasında gezinme.
 */
export function Board({
  kind,
  level = '',
  sort = '',
  day = '',
  week = '',
  extra,
  me,
  refresh = 0,
  compact = false,
  onRace,
  names,
  friends,
  onFriend,
  search = '',
}: {
  kind: BoardKind
  level?: string
  sort?: string
  day?: string
  week?: string
  /** tabloya özel sorgu parametreleri: kural tablosunda şehir ve kural, Boss Rush'ta çeşit ve boss sayısı */
  extra?: Record<string, string>
  me: string
  refresh?: number
  compact?: boolean
  onRace?: (name: string) => Promise<string | null>
  /** yalnız bu oyuncular (arkadaş süzgeci) */
  names?: string[]
  /** arkadaş listesi: satırda ☆/★ düğmesi */
  friends?: string[]
  onFriend?: (name: string) => void
  /** yolcu adı araması (adın bir parçası) */
  search?: string
}) {
  const t = useT()
  const [raceMsg, setRaceMsg] = useState<{ name: string; text: string } | null>(null)
  const [racing, setRacing] = useState('')
  const lng = useLang()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [limit, setLimit] = useState(0)
  const [more, setMore] = useState(false)
  const [prevRank, setPrevRank] = useState<number | null>(null)
  const meRow = useRef<HTMLLIElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const nameList = names?.join(',') ?? ''
  const extraKey = JSON.stringify(extra ?? {})
  /** tablonun kimliği (sıra, sayfa ve arama hariç): son bakıştaki sırayı bu anahtarla hatırlarız */
  const boardId = [kind, level, sort, day, week, extraKey, nameList].join('|')
  const lastBoard = useRef('')

  useEffect(() => {
    // yalnız sayfalama değiştiyse eski satırlar yerinde kalır (liste zıplamasın); başka her değişimde iskelet
    if (lastBoard.current !== boardId + '|' + search + '|' + me) {
      lastBoard.current = boardId + '|' + search + '|' + me
      setRows(null)
      setLimit(0)
    }
  }, [boardId, search, me])

  useEffect(() => {
    let live = true
    setFailed(false)
    setRaceMsg(null)
    const q = new URLSearchParams({ level: kind === 'city' ? level : kind, ...(kind === 'yuzde' ? { city: level } : {}), ...(sort ? { sort } : {}), ...(day ? { day } : {}), ...(week ? { week } : {}), ...(extra ?? {}), ...(nameList ? { names: nameList } : {}), ...(me ? { me } : {}), ...(search ? { q: search } : {}), ...(limit ? { lim: String(limit) } : {}), ...(refresh || retry ? { r: `${refresh}.${retry}` } : {}) })
    setMore(!!limit)
    fetch(`/api/scores?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('x'))))
      .then((j: { scores: Row[] }) => {
        if (!live) return
        setRows(j.scores)
        setMore(false)
      })
      .catch(() => live && (setFailed(true), setMore(false)))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, level, sort, day, week, extraKey, nameList, me, search, limit, refresh, retry])

  // son bakıştaki sıra: yalnız süzgeçsiz tabloda tutulur (arkadaş ya da arama sırası herkesinki değildir)
  const mine = rows?.find((r) => r.me)
  useEffect(() => {
    if (!mine || search || nameList) return setPrevRank(null)
    const key = `seksek:rank:${boardId}`
    const was = Number(stored.get(key))
    setPrevRank(Number.isInteger(was) && was > 0 ? was : null)
    stored.set(key, String(mine.rank))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.rank, boardId, search, nameList])

  if (failed && !rows)
    return (
      <div className="mt-3 border-2 border-dashed border-line/70 px-3 py-5 text-center" role="alert">
        <p className="font-display text-[17px] text-cream">{t('Skorlar Alınamadı')}</p>
        <p className="mt-1 text-[13px] text-muted">{t('Bağlantı ya da sunucu yanıt vermedi. Biraz sonra tekrar dene.')}</p>
        <button className="pixel-btn primary mt-3 min-h-[44px] px-4" onClick={() => setRetry((x) => x + 1)}>
          {ic(t('↻ Tekrar Dene'))}
        </button>
      </div>
    )
  if (!rows)
    return (
      <ol className="mt-2 grid gap-1.5" aria-busy="true" aria-label={t('Yükleniyor')}>
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-[52px] animate-pulse bg-panel-2/50" style={{ animationDelay: `${i * 90}ms`, opacity: 1 - i * 0.14 }} />
        ))}
      </ol>
    )
  if (!rows.length)
    return (
      <p className="mt-3 border-2 border-dashed border-line/70 px-3 py-4 text-center text-[13px] text-muted">
        {search ? t('“{q}” adında bir yolcu yok.', { q: search }) : names ? t('Arkadaşların bu tabloda henüz yok.') : kind === 'gunluk' || kind === 'gunluk-m' || kind === 'gunluk-b' ? t('Bugün henüz kimse koşmadı. İlk skor senin olsun!') : kind === 'turnuva' ? t('Bu hafta üç mücadeleyi de bitiren henüz yok. İlk sen ol!') : t('Henüz skor yok. İlk sen ol!')}
      </p>
    )

  const lv = kind === 'city' ? LEVELS.find((l) => l.id === level) : undefined
  const race = kind === 'city' && (!sort || sort === 'time') ? onRace : undefined
  const plural = (k: number, one: string, many: string) => (lng === 'en' ? `${k} ${k === 1 ? one : many}` : `${k} ${one}`)
  /** süreyle sıralanan tablolarda liderle fark gösterilir (genel, koleksiyon ve düşüş/hatıra sıralamasında yok) */
  const byTime = kind === 'city' ? !sort || sort === 'time' || level.startsWith('mucadele-') : kind !== 'genel' && kind !== 'koleksiyon'
  const lead = byTime ? rows.find((r) => r.rank === 1)?.timeMs : undefined
  const gapText = (r: Row) => {
    if (lead === undefined || r.rank <= 1 || r.timeMs === undefined) return null
    const d = r.timeMs - lead
    return t('lidere +{d}', { d: d >= 100000 ? formatTime(d) : `${(d / 1000).toLocaleString(lng === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${t('sn')}` })
  }

  /** sağdaki büyük değer ve adın altındaki ayrıntı */
  const cells = (r: Row): [React.ReactNode, string] => {
    if (kind === 'koleksiyon')
      return [
        <>
          {n(r.found)}
          <span className="ml-1 text-[12px] text-muted">{t('parça')}</span>
        </>,
        t('{k} hatıra · {s} pul · {c} nazar · {b} boss', { k: n(r.keeps), s: n(r.stamps), c: n(r.charms), b: n(r.bosses) }),
      ]
    if (kind === 'genel') {
      const sub = [plural(n(r.cities), t('şehir'), 'cities'), plural(n(r.items), t('hatıra'), 'keepsakes'), `✕${n(r.deaths)}`, formatTime(n(r.timeMs))]
      if (sort === 'items') return [<>{n(r.items)}<span className="ml-0.5 text-[13px] text-muted">/{LEVELS.length * 3}</span></>, sub.filter((_, i) => i !== 1).join(' · ')]
      if (sort === 'deaths') return [<>✕{n(r.deaths)}</>, sub.filter((_, i) => i !== 2).join(' · ')]
      return [<>{n(r.cities)}<span className="ml-0.5 text-[13px] text-muted">/{LEVELS.length}</span></>, sub.filter((_, i) => i !== 0).join(' · ')]
    }
    const plays = n(r.plays) > 1 ? ` · ${t('{n} koşu', { n: n(r.plays) })}` : ''
    if (kind === 'turnuva') return [formatTime(n(r.timeMs)), `${t('3 mücadele')} · ✕${n(r.deaths)}`]
    // speedrun: süre ve düşüş (%100'de her şey alındı, turda otuz şehir)
    if (kind === 'yuzde' || kind === 'tur' || kind === 'aynatur' || kind === 'gunluk-m' || kind === 'gunluk-b' || kind === 'kural' || kind === 'bossrush') return [formatTime(n(r.timeMs)), `✕${n(r.deaths)}${plays}`]
    if (kind === 'gunluk') return [formatTime(n(r.timeMs)), `✕${n(r.deaths)} · ${n(r.items)}/3${plays}`]
    // mücadele haritasında hatıra yok: süre ve düşüş
    if (level.startsWith('mucadele-')) return [formatTime(n(r.timeMs)), `✕${n(r.deaths)}${plays}`]
    if (sort === 'deaths') return [<>✕{n(r.minDeaths)}</>, `${formatTime(n(r.timeMs))} · ${n(r.maxItems)}/3${plays}`]
    if (sort === 'items') return [<>{n(r.maxItems)}<span className="ml-0.5 text-[13px] text-muted">/3</span><span className="ml-2 text-[15px] text-cream/80">{formatTime(n(r.timeMs))}</span></>, `✕${n(r.minDeaths)}${plays}`]
    return [formatTime(n(r.timeMs)), `✕${n(r.deaths)} · ${n(r.items)}/3${plays}`]
  }

  /** sağdaki değerin dolu oranı: bitirilen şehir, hatıra, koleksiyon (süre ve düşüşte çubuk yok) */
  const progress = (r: Row): number | null => {
    if (kind === 'genel') return sort === 'deaths' ? null : sort === 'items' ? n(r.items) / (LEVELS.length * 3) : n(r.cities) / LEVELS.length
    if (kind === 'koleksiyon') return n(r.found) / (LEVELS.length * 5)
    if (kind === 'city' && sort === 'items') return n(r.maxItems) / 3
    return null
  }

  /** ok tuşları satır adları arasında gezdirir (Home / End baş ve son) */
  const navigate = (e: React.KeyboardEvent<HTMLOListElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[data-nav]') ?? [])]
    if (!items.length) return
    const at = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))
    if (at < 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) return
    e.preventDefault()
    items[next].focus()
    items[next].scrollIntoView({ block: 'nearest' })
  }

  const jumpToMe = () => {
    const el = meRow.current
    if (!el) return
    const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' })
    el.querySelector<HTMLElement>('[data-nav]')?.focus({ preventScroll: true })
  }

  const asked = limit || 0
  const shown = rows.length
  const canMore = !search && shown < rows[0].total && Math.max(asked, shown) < MAX_LIST
  const strip = !compact && !search && (!!me || !!mine)
  const delta = mine && prevRank !== null ? prevRank - mine.rank : 0

  return (
    <>
      {strip && (
        <div className="sb-me sticky top-0 z-[5] -mx-1 mb-1.5 flex min-h-[48px] flex-wrap items-center gap-x-3 gap-y-1 border-2 border-gold/70 bg-panel px-3 py-1.5 short:min-h-[40px]" role="status">
          {mine ? (
            <>
              <span className="text-[13px] font-bold text-gold">{t('Senin Sıran')}</span>
              <span className="font-display text-[22px] leading-none tabular-nums text-cream">
                #{mine.rank}
                <span className="ml-1 text-[13px] text-muted">/ {mine.total}</span>
              </span>
              {mine.rank === 1 ? <span className="text-[13px] font-semibold text-gold">{t('Lider Sensin')}</span> : gapText(mine) && <span className="text-[13px] tabular-nums text-cream/85">{gapText(mine)}</span>}
              {delta !== 0 && (
                <span className="text-[13px] font-bold tabular-nums" style={{ color: delta > 0 ? '#8fe3a1' : '#ff9d8a' }} title={t('Son bakışından beri')}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                </span>
              )}
              <button className="pixel-btn ml-auto min-h-[36px] px-3 py-1 text-[13px]" onClick={jumpToMe}>
                {ic(t('↓ Kendine Git'))}
              </button>
            </>
          ) : (
            <span className="text-[13px] text-muted">{t('Bu tabloda henüz yoksun: bir koşu bitir, sıran burada görünsün.')}</span>
          )}
        </div>
      )}
      <ol ref={list} onKeyDown={navigate} className={`${strip ? 'mt-1' : 'mt-2'} grid tabular-nums ${compact ? 'gap-1 text-[14px]' : 'gap-1.5 text-[15px]'}`}>
        {rows.map((r, i) => {
          const gap = i > 0 && r.rank > rows[i - 1].rank + 1
          const [big, sub] = cells(r)
          const medal = lv && (kind === 'city' && (!sort || sort === 'time')) ? medalFor(lv, n(r.timeMs)) : null
          const fill = progress(r)
          const podium = r.rank <= 3 ? PODIUM[r.rank - 1] : null
          const behind = gapText(r)
          return (
            <li key={`${r.name}-${r.rank}`} ref={r.me ? meRow : undefined} className={`sb-row ${gap ? 'mt-2 border-t-2 border-dashed border-line/70 pt-2' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}>
              <div
                className={`grid items-center gap-x-2 border-l-4 px-2.5 ${compact ? 'grid-cols-[2.25rem_minmax(0,1fr)_auto]' : 'grid-cols-[2rem_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_auto] sm:gap-x-2.5 short:grid-cols-[2.25rem_minmax(0,1fr)_auto]'} ${compact ? 'py-1.5' : 'py-2 sm:py-2.5 short:py-1.5'} ${r.me ? 'bg-accent/20 outline outline-2 outline-accent/60' : podium ? 'bg-panel-2/80' : i % 2 ? 'bg-panel-2/25' : 'bg-panel-2/55'}`}
                style={{ borderLeftColor: podium ?? 'transparent' }}
              >
                <span
                  className={`flex items-center justify-center justify-self-center font-display leading-none ${podium ? 'h-8 w-8 rounded-full text-[16px] text-ink' : 'text-[17px] text-muted'}`}
                  style={podium ? { background: podium, boxShadow: '0 0 0 2px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.18)' } : undefined}
                  aria-label={podium ? t(PODIUM_NAME[r.rank - 1]) : t('{n}. sıra', { n: r.rank })}
                >
                  {r.rank}
                </span>
                {!compact && (
                  <span className="max-sm:hidden short:hidden">
                    <Avatar name={r.name} hero={r.hero} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <a data-nav href={`/oyuncu/${encodeURIComponent(r.name)}`} className={`sb-link min-w-0 font-semibold truncate leading-tight text-cream underline-offset-4 hover:underline ${compact ? '' : 'text-[16px]'}`}>
                      {r.name}
                    </a>
                    {r.me && <span className="shrink-0 border border-gold/70 bg-gold/10 px-1.5 text-[12px] font-bold leading-snug text-gold">{t('Sen')}</span>}
                    {onFriend && !r.me && (
                      <button
                        className={`sb-star -my-2 flex h-11 w-9 shrink-0 items-center justify-center text-[17px] leading-none ${friends?.includes(r.name) ? 'text-gold' : 'text-muted hover:text-cream'}`}
                        aria-label={friends?.includes(r.name) ? t('{name} Arkadaşlarından Çıkar', { name: r.name }) : t('{name} Arkadaş Ekle', { name: r.name })}
                        aria-pressed={friends?.includes(r.name)}
                        onClick={() => onFriend(r.name)}
                      >
                        {friends?.includes(r.name) ? '★' : '☆'}
                      </button>
                    )}
                  </span>
                  <span className={`mt-1 flex flex-wrap gap-1 ${compact ? 'max-h-[22px] overflow-hidden' : ''}`}>
                    {sub.split(' · ').map((part) => (
                      <span key={part} className="whitespace-nowrap border border-line/80 bg-ink/40 px-1.5 py-px text-[13px] leading-snug text-cream/75">
                        {part}
                      </span>
                    ))}
                    {behind && !compact && <span className="whitespace-nowrap border border-accent/50 bg-accent/10 px-1.5 py-px text-[13px] leading-snug text-accent-2">{behind}</span>}
                  </span>
                </span>
                {/* sağ blok sabit sütunlu: rozet, değer ve Yarış düğmesi her satırda aynı hizada */}
                <span className={`grid items-center gap-x-2 ${race ? 'grid-cols-[1.25rem_minmax(4.5rem,auto)_2.75rem] sm:grid-cols-[1.25rem_minmax(5.5rem,auto)_4.75rem]' : 'grid-cols-[1.25rem_minmax(4.5rem,auto)] sm:grid-cols-[1.25rem_minmax(5.5rem,auto)]'}`}>
                  <span className="flex justify-center">{medal && <MedalBadge medal={medal} />}</span>
                  <span className="flex flex-col items-end gap-1.5">
                    <span className={`whitespace-nowrap text-right font-display leading-none text-cream ${compact ? 'text-[19px]' : 'text-[22px]'}`}>{big}</span>
                    {fill !== null && (
                      <span className="block h-1.5 w-full min-w-[4.5rem] bg-ink/70 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" aria-hidden>
                        <span className="block h-full" style={{ width: `${Math.round(Math.min(1, fill) * 100)}%`, background: podium ?? 'var(--color-accent, #e07a3f)' }} />
                      </span>
                    )}
                  </span>
                  {race &&
                    (r.me ? (
                      <span />
                    ) : (
                      <button
                        className="pixel-btn min-h-[44px] w-full justify-center px-1.5 py-1 font-mono text-[13px]"
                        disabled={!!racing}
                        aria-label={t('{name} ile Yarış', { name: r.name })}
                        title={t('Hayaletiyle yan yana koş')}
                        onClick={async () => {
                          setRacing(r.name)
                          const err = await race(r.name)
                          setRacing('')
                          setRaceMsg(err ? { name: r.name, text: err } : null)
                        }}
                      >
                        {racing === r.name ? (
                          '…'
                        ) : (
                          <>
                            ◌<span className="max-sm:hidden">&nbsp;{t('Yarış')}</span>
                          </>
                        )}
                      </button>
                    ))}
                </span>
              </div>
              {raceMsg?.name === r.name && <p className="px-2 pt-1 text-right text-[13px] text-muted">{raceMsg.text}</p>}
            </li>
          )
        })}
      </ol>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted">{t('{n} yolcu bu tabloda', { n: rows[0].total })}</p>
        {canMore && (
          <button className="pixel-btn min-h-[44px] px-4 text-[13px]" disabled={more} onClick={() => setLimit(Math.max(asked, shown) + PAGE)}>
            {more ? '…' : ic(t('＋ Daha Fazla Göster'))}
          </button>
        )}
      </div>
    </>
  )
}

type Tab = 'genel' | 'city' | 'gunluk' | 'modlar' | 'koleksiyon' | 'speedrun' | 'arkadaslar'
const TABS: Tab[] = ['genel', 'city', 'gunluk', 'modlar', 'speedrun', 'koleksiyon', 'arkadaslar']
const TAB_KEY = 'seksek:board:tab'

/**
 * Skor Tablosu ekranı: yedi sekme (Genel, Şehirler, Günlük, Modlar, Speedrun, Koleksiyon, Arkadaşlar); seçili sekme
 * hatırlanır. Her sekmenin kendi sıralama seçenekleri ve kısa bir açıklaması var; yolcu adıyla arama her tabloda çalışır.
 */
export default function ScoreBoard({
  me,
  startCity = 0,
  startTab = 'genel',
  startSub = '',
  startRule,
  onDaily,
  onMini,
  onBoss,
  bossCount = 1,
  canRace,
  onRace,
  friends,
  onFriend,
}: {
  me: string
  startCity?: number
  startTab?: Tab
  /** açılışta seçili alt seçim (günlük: m / b · modlar: rush) ve kural tablosunun kuralı */
  startSub?: string
  startRule?: DailyRule
  /** bugünün hakkı kullanıldıysa verilmez (düğme görünmez) */
  onDaily?: () => void
  /** Günün Mücadelesi ve Günün Boss'u (bugünün sekmesinde Oyna düğmesi) */
  onMini?: () => void
  onBoss?: () => void
  /** oyuncunun yendiği boss sayısı: Boss Rush tablosu ilk bu boyutta açılır */
  bossCount?: number
  canRace?: (levelIdx: number) => boolean
  onRace?: (levelIdx: number, name: string) => Promise<string | null>
  /** arkadaş listesi (adlar); ☆ ile eklenir, süzgeçte yalnız onlar ve oyuncu görünür */
  friends?: string[]
  onFriend?: (name: string) => void
}) {
  const [onlyFriends, setOnlyFriends] = useState(false)
  const t = useT()
  const lng = useLang()
  const hasFriends = !!(friends && onFriend)
  const [tab, setTabState] = useState<Tab>(startTab === 'arkadaslar' && !hasFriends ? 'genel' : startTab)
  const [idx, setIdx] = useState(startCity)
  const [sort, setSort] = useState(startSub)
  const [rule, setRule] = useState<DailyRule>(startRule ?? 'tekcan')
  const [rv, setRv] = useState<'duz' | 'kabus' | 'cifte'>('duz')
  const [rn, setRn] = useState(Math.max(1, Math.min(bossCount, LEVELS.length)))
  const today = istanbulDay(new Date())
  const [day, setDay] = useState(today)
  const [find, setFind] = useState('')
  const [search, setSearch] = useState('')
  const strip = useRef<HTMLDivElement>(null)
  const tabBar = useRef<HTMLDivElement>(null)
  const setTab = (k: Tab) => {
    setTabState(k)
    setSort('')
    stored.set(TAB_KEY, k)
  }
  // seçili sekme hatırlanır: oyunun kendi açılışında (belirli bir sekme istenmediyse) en son bakılan sekme gelir
  // (sunucuda üretilen sayfada da uyumsuzluk çıkmasın diye açılıştan sonra okunur)
  useEffect(() => {
    if (startTab !== 'genel' || startSub) return
    const was = stored.get(TAB_KEY) as Tab | null
    if (was && TABS.includes(was) && was !== 'genel' && (was !== 'arkadaslar' || hasFriends)) setTabState(was)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const id = setTimeout(() => setSearch(find.trim()), 300)
    return () => clearTimeout(id)
  }, [find])
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
    ['modlar', t('Modlar')],
    ['speedrun', t('Speedrun')],
    ['koleksiyon', t('Koleksiyon')],
    ...(hasFriends ? ([['arkadaslar', t('Arkadaşlar')]] as [Tab, string][]) : []),
  ]
  /** sol/sağ ok tuşu sekmeler arasında gezdirir (Home / End baş ve son) */
  const tabKeys = (e: React.KeyboardEvent) => {
    const at = tabs.findIndex(([k]) => k === tab)
    const go = e.key === 'ArrowRight' ? at + 1 : e.key === 'ArrowLeft' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null
    if (go === null) return
    e.preventDefault()
    const to = (go + tabs.length) % tabs.length
    setTab(tabs[to][0])
    requestAnimationFrame(() => tabBar.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus())
  }
  const generalSorts: [string, string][] = [['', t('Bitirilen Şehir')], ['items', t('Hatıra')], ['deaths', t('En Az Düşüş')]]
  const sorts: [string, string][] =
    tab === 'genel' || tab === 'arkadaslar'
      ? generalSorts
      : tab === 'city'
        ? [['', t('Süre')], ['deaths', t('En Az Düşüş')], ['items', t('Hatıra')]]
        : tab === 'speedrun'
          ? [['', '%100'], ['tur', t('Tam Tur')], ['aynatur', t('Ayna Tam Tur')]]
          : tab === 'gunluk'
            ? [['', t('Meydan Okuma')], ['m', t('Mücadele')], ['b', t('Boss')]]
            : tab === 'modlar'
              ? [['', t('Kurallı Koşu')], ['rush', t('Boss Rush')]]
              : []
  const lv = localize(LEVELS[idx], lng)
  const daily = dailyRun(day, LEVELS)
  const dailyLevel = LEVELS.find((l) => l.id === daily.levelId)!
  const dRule = DAILY_RULES[daily.rule]
  const miniC = CHALLENGES.find((c) => c.id === dailyMini(day))!
  const miniLv = LEVELS.find((l) => l.id === miniC.level)!
  const bossLv = LEVELS[dailyBoss(day, LEVELS)]
  const bossDef = BOSSES[bossLv.city]
  const ruleList = [...RULES, ...RAGE_RULES].filter((r) => ruleFits(r, LEVELS[idx]))
  const ruleNow = ruleList.includes(rule) ? rule : ruleList[0]
  const noFriends = tab === 'arkadaslar' && !(friends?.length)
  const note =
    tab === 'genel' || tab === 'arkadaslar'
      ? (tab === 'arkadaslar' ? t('Yalnız arkadaşların ve sen. ') : '') +
        (sort === 'items'
          ? t('Bütün şehirlerde bulunan en çok hatıra. Eşitlikte çok şehir bitiren önde.')
          : sort === 'deaths'
            ? t('Önce bitirilen şehir sayısı, sonra şehirlerdeki en az düşüşlerin toplamı.')
            : t('Önce bitirilen şehir sayısı, sonra en iyi sürelerin toplamı.'))
      : tab === 'city'
        ? sort === 'deaths'
          ? t('Her yolcunun bu şehirdeki en az düşüşlü koşusu.')
          : sort === 'items'
            ? t('Her yolcunun bu şehirde bulduğu en çok hatıra; eşitlikte hızlı olan önde.')
            : t('Her yolcunun bu şehirdeki en iyi süresi.')
        : tab === 'speedrun'
          ? sort === 'tur'
            ? t('İlk defterin otuz şehri baştan sona, arka arkaya: toplam süre.')
            : sort === 'aynatur'
              ? t('Otuz şehir aynada, arka arkaya: toplam süre.')
              : t('Üç hatıra, gizli pul ve nazar boncuğu aynı koşuda alınarak bitirilen en hızlı koşu.')
          : tab === 'koleksiyon'
          ? t('Hesaba kayıtlı defterden: hatıra, gizli pul ve nazar boncuğu toplamı.')
          : tab === 'gunluk'
            ? sort === 'm'
              ? t('Herkes için aynı kesit, serbest tekrar: en iyi süren sayılır.')
              : sort === 'b'
                ? t('Herkes için aynı boss arenası, serbest tekrar: en iyi süren sayılır.')
                : t('Herkes için aynı şehir ve aynı kural; skor süreye cezalar eklenerek hesaplanır.')
            : tab === 'modlar'
              ? sort === 'rush'
                ? t('Aynı sayıda boss yenen koşular birbiriyle yarışır; en kısa süre önde.')
                : t('Şehir ve kural seç: her kuralın kendi tablosu var. Skor süreye cezalar eklenerek hesaplanır.')
              : ''
  const friendFilter = tab !== 'koleksiyon' && tab !== 'arkadaslar' && hasFriends
  const boardKind: BoardKind = tab === 'speedrun' ? (sort === 'tur' || sort === 'aynatur' ? sort : 'yuzde') : tab === 'gunluk' ? (sort === 'm' ? 'gunluk-m' : sort === 'b' ? 'gunluk-b' : 'gunluk') : tab === 'modlar' ? (sort === 'rush' ? 'bossrush' : 'kural') : tab === 'arkadaslar' ? 'genel' : tab
  const names = tab === 'arkadaslar' ? friends : onlyFriends && tab !== 'koleksiyon' ? friends : undefined

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col short:mt-1.5">
      <div ref={tabBar} className="seg seg-tabs sb-tabs shrink-0" role="tablist" aria-label={t('Skor Tablosu')} onKeyDown={tabKeys}>
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)}>
            {k === 'arkadaslar' ? `☆ ${label}` : label}
          </button>
        ))}
      </div>

      {(tab === 'city' || (tab === 'speedrun' && !sort) || (tab === 'modlar' && !sort)) && (
        <div className="mt-3 flex items-center gap-2 short:mt-1.5">
          <button aria-label={t('Önceki Şehir')} className="pixel-btn h-12 shrink-0 px-3 text-lg short:h-9" onClick={() => step(-1)}>
            ‹
          </button>
          <div ref={strip} className="strip-fade no-scrollbar flex flex-1 snap-x gap-2 overflow-x-auto scroll-px-6 px-6 py-1">
            {LEVELS.map((l, i) => (
              <button
                key={l.id}
                data-on={i === idx ? 1 : 0}
                aria-pressed={i === idx}
                className={`flex h-12 shrink-0 snap-center items-center gap-2 border-2 px-2.5 text-left transition-colors short:h-9 ${i === idx ? 'border-gold bg-gold/15 text-cream' : 'border-line bg-ink/40 text-cream/80 hover:border-accent-2'}`}
                onClick={() => setIdx(i)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#221f4a] short:h-7 short:w-7">
                  <ItemIcon city={l.city} taken size={20} />
                </span>
                <span className="leading-none">
                  <span className="block text-[11px] font-bold tracking-[0.12em] text-muted">{String(l.plate).padStart(2, '0')}</span>
                  <span className="block whitespace-nowrap text-[14px] font-semibold">{l.name}</span>
                </span>
              </button>
            ))}
          </div>
          <button aria-label={t('Sonraki Şehir')} className="pixel-btn h-12 shrink-0 px-3 text-lg short:h-9" onClick={() => step(1)}>
            ›
          </button>
        </div>
      )}

      {tab === 'modlar' && !sort && ruleList.length > 0 && (
        <div className="mt-2 flex items-center gap-2 short:mt-1.5">
          <span className="shrink-0 text-[13px] font-semibold text-muted">{t('Kural')}</span>
          <select value={ruleNow} onChange={(e) => setRule(e.target.value as DailyRule)} className="min-h-[44px] min-w-0 flex-1 border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream outline-none focus:border-gold short:min-h-[36px]" aria-label={t('Kural')}>
            <optgroup label={t('Kurallı Koşu')}>
              {ruleList.filter((r) => !RAGE_RULES.includes(r as never)).map((r) => (
                <option key={r} value={r}>
                  {t(DAILY_RULES[r].name)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('Sinir Bozucu')}>
              {ruleList.filter((r) => RAGE_RULES.includes(r as never)).map((r) => (
                <option key={r} value={r}>
                  {t(DAILY_RULES[r].name)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}
      {tab === 'modlar' && sort === 'rush' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 short:mt-1.5">
          <div className="seg" role="group" aria-label={t('Çeşit')}>
            {([['duz', t('Düz')], ['kabus', t('Kâbus')], ['cifte', t('Çifte')]] as const).map(([k, label]) => (
              <button key={k} aria-pressed={rv === k} onClick={() => setRv(k)}>
                {label}
              </button>
            ))}
          </div>
          <select value={rn} onChange={(e) => setRn(Number(e.target.value))} className="min-h-[44px] border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream outline-none focus:border-gold short:min-h-[36px]" aria-label={t('Boss Sayısı')}>
            {Array.from({ length: LEVELS.length }, (_, i) => i + 1).map((k) => (
              <option key={k} value={k}>
                {t('{n} boss', { n: k })}
              </option>
            ))}
          </select>
        </div>
      )}
      {tab === 'gunluk' ? (
        <div className="mt-2.5 flex items-center gap-3 border-2 border-gold/70 bg-gold/5 px-3 py-2 short:mt-1.5 short:py-1">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#d9a441]">
            <ItemIcon city={sort === 'm' ? miniLv.city : sort === 'b' ? bossLv.city : dailyLevel.city} taken size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gold">{day === today ? t('Bugün') : t('Dün')} · {sort === 'm' ? t('Günün Mücadelesi') : sort === 'b' ? t('Günün Boss’u') : t(dRule.name)}</p>
            <p className="truncate font-display text-lg leading-tight text-cream">{sort === 'm' ? `${t(miniC.name)} · ${miniLv.name}` : sort === 'b' ? `${lng === 'en' ? bossDef.nameEn : bossDef.name} · ${bossLv.name}` : displayName(dailyLevel)}</p>
            <p className="text-[13px] leading-snug text-muted short:hidden">{sort === 'm' ? t('Kısa ve sert kesit: en hızlı varan önde.') : sort === 'b' ? t('Boss’un üç işaretini oku, yorulunca üstüne bas.') : t(dRule.text)}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {day === today && (sort === 'm' ? onMini : sort === 'b' ? onBoss : onDaily) ? (
              <button className="pixel-btn tone justify-center px-3 py-1.5 text-[13px] [--tone:var(--color-gold)]" onClick={sort === 'm' ? onMini : sort === 'b' ? onBoss : onDaily}>
                {ic(t('▶ Oyna'))}
              </button>
            ) : null}
            <button className="pixel-btn min-h-[44px] justify-center px-2 py-1 text-[13px] short:min-h-[34px]" onClick={() => setDay(day === today ? shiftDay(today, -1) : today)}>
              {day === today ? t('Dünkü') : t('Bugünkü')}
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 short:mt-1.5">
        <div className="min-w-0 flex-1 basis-[260px] short:hidden">
          {tab !== 'gunluk' && (
            <SectionTitle
              title={tab === 'city' || (tab === 'speedrun' && !sort) ? displayName(LEVELS[idx]) : tab === 'genel' ? t('Genel Sıralama') : tab === 'arkadaslar' ? t('Arkadaşların') : tab === 'speedrun' ? (sort === 'tur' ? t('Tam Tur') : t('Ayna Tam Tur')) : t('Koleksiyoncular')}
              note={tab === 'city' ? lv.subtitle : undefined}
            />
          )}
          <p className={`text-[13px] leading-snug text-muted ${tab === 'gunluk' ? '' : 'mt-0.5 pl-[18px]'}`}>{note}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {sorts.length > 0 && (
            <div className="seg" role="group" aria-label={t('Sırala')}>
              {sorts.map(([k, label]) => (
                <button key={k || 'default'} aria-pressed={sort === k} onClick={() => setSort(k)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {friendFilter && (
            <div className="seg [--seg-on:var(--color-gold)]">
              <button aria-pressed={onlyFriends} aria-label={t('Yalnız Arkadaşlar')} onClick={() => setOnlyFriends((v) => !v)}>
                {onlyFriends ? '★' : '☆'} <span className="max-sm:hidden">{t('Arkadaşlar')}</span> {friends && friends.length ? `(${friends.length})` : ''}
              </button>
            </div>
          )}
          <label className="sb-search max-sm:flex-1">
            <span aria-hidden>⌕</span>
            <input value={find} onChange={(e) => setFind(e.target.value.slice(0, 16))} type="search" enterKeyHint="search" autoComplete="off" spellCheck={false} placeholder={t('Yolcu Ara')} aria-label={t('Yolcu Ara')} />
            {find && (
              <button type="button" aria-label={t('Aramayı Temizle')} onClick={() => setFind('')}>
                ✕
              </button>
            )}
          </label>
        </div>
      </div>
      {(tab === 'arkadaslar' || (onlyFriends && friendFilter)) && hasFriends && <AddFriend friends={friends!} me={me} onAdd={onFriend!} />}
      <div className="overlay-scroll mt-1 min-h-[160px] flex-1 overflow-y-auto overscroll-contain pr-1 short:min-h-[72px]">
        {noFriends ? (
          <div className="mt-3 border-2 border-dashed border-line/70 px-3 py-5 text-center">
            <p className="font-display text-[17px] text-cream">{t('Henüz Arkadaşın Yok')}</p>
            <p className="mt-1 text-[13px] leading-snug text-muted">{t('Yukarıya bir yolcu adı yaz ya da herhangi bir tabloda ☆ ile ekle; burada yalnız onların sıralaması görünür.')}</p>
          </div>
        ) : (
          <Board
            kind={boardKind}
            level={LEVELS[idx].id}
            sort={tab === 'speedrun' || tab === 'gunluk' || tab === 'modlar' ? '' : sort}
            day={tab === 'gunluk' ? day : ''}
            extra={tab === 'modlar' ? (sort === 'rush' ? { variant: rv, n: String(rn) } : { city: LEVELS[idx].id, rule: ruleNow }) : undefined}
            me={me}
            names={names}
            search={search}
            friends={friends}
            onFriend={onFriend}
            onRace={tab === 'city' && onRace && canRace?.(idx) ? (name) => onRace(idx, name) : undefined}
          />
        )}
      </div>
    </div>
  )
}

/** Adla arkadaş ekleme: ad gerçekten bir yolcuya ait mi diye sorulur */
function AddFriend({ friends, me, onAdd }: { friends: string[]; me: string; onAdd: (name: string) => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const add = async () => {
    const n = name.trim().replace(/\s+/g, ' ')
    if (!n) return
    const key = n.toLocaleLowerCase('tr')
    if (key === me.toLocaleLowerCase('tr')) return setMsg(t('Kendini ekleyemezsin.'))
    if (friends.some((f) => f.toLocaleLowerCase('tr') === key)) return setMsg(t('Zaten arkadaşın.'))
    try {
      const r = (await (await fetch(`/api/players?name=${encodeURIComponent(n)}`)).json()) as { available?: boolean; reason?: string }
      if (r.available !== false || r.reason) return setMsg(t('Bu adla bir yolcu yok.'))
    } catch {
      return setMsg(t('Şu an kontrol edilemiyor.'))
    }
    onAdd(n)
    setName('')
    setMsg(t('{name} eklendi.', { name: n }))
  }
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        void add()
      }}
    >
      <input
        className="min-w-0 flex-1 border-2 border-line bg-ink/60 px-2 py-1.5 text-[13px] text-cream placeholder:text-muted"
        value={name}
        maxLength={16}
        onChange={(e) => (setName(e.target.value), setMsg(''))}
        placeholder={t('Yolcu adı')}
        aria-label={t('Arkadaş Adı')}
      />
      <button className="pixel-btn px-2.5 py-1.5 text-[13px]" type="submit">
        {ic(t('＋ Ekle'))}
      </button>
      <span className="w-full text-[13px] text-muted">{msg || t('Satırlardaki ☆ ile de ekleyebilirsin.')}</span>
    </form>
  )
}
