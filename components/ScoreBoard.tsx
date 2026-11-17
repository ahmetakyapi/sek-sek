'use client'

import { useEffect, useRef, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { MedalBadge, displayName, medalFor, ic } from '@/components/ui'
import { LEVELS } from '@/game/levels'
import { DAILY_RULES, dailyRun, istanbulDay, shiftDay } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Tablo türü: bir şehir, genel toplamlar, hesaba kayıtlı defter, günün meydan okuması ya da haftanın turnuvası */
export type BoardKind = 'city' | 'genel' | 'koleksiyon' | 'gunluk' | 'turnuva' | 'yuzde' | 'tur' | 'aynatur'

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
/** kürsü renkleri: altın, gümüş, bronz */
const PODIUM = ['#ffcc66', '#d7dde6', '#d08a52']
/** adın baş harfi için sabit, sıcak bir renk (adın özetinden) */
const AVATARS = ['#e07a5f', '#81b29a', '#f2cc8f', '#8ecae6', '#c8a2d6', '#f4a261', '#a8dadc', '#e9c46a']
const avatarColor = (name: string) => AVATARS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATARS.length]

/**
 * Sıralama listesi: ilk satırlar + (ilk sıralarda değilse) oyuncunun kendi satırı. Sağ sütun seçili ölçütü büyük
 * yazar (süre, düşüş, hatıra, şehir); öteki ölçütler adın altında küçük durur. Böylece filtre değişince hem sıra
 * hem görünen değer değişir.
 */
export function Board({
  kind,
  level = '',
  sort = '',
  day = '',
  week = '',
  me,
  refresh = 0,
  compact = false,
  onRace,
  names,
  friends,
  onFriend,
}: {
  kind: BoardKind
  level?: string
  sort?: string
  day?: string
  week?: string
  me: string
  refresh?: number
  compact?: boolean
  onRace?: (name: string) => Promise<string | null>
  /** yalnız bu oyuncular (arkadaş süzgeci) */
  names?: string[]
  /** arkadaş listesi: satırda ☆/★ düğmesi */
  friends?: string[]
  onFriend?: (name: string) => void
}) {
  const t = useT()
  const [raceMsg, setRaceMsg] = useState<{ name: string; text: string } | null>(null)
  const [racing, setRacing] = useState('')
  const lng = useLang()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    setFailed(false)
    setRows(null)
    setRaceMsg(null)
    const nameList = names?.join(',') ?? ''
    const q = new URLSearchParams({ level: kind === 'city' ? level : kind, ...(kind === 'yuzde' ? { city: level } : {}), ...(sort ? { sort } : {}), ...(day ? { day } : {}), ...(week ? { week } : {}), ...(nameList ? { names: nameList } : {}), ...(me ? { me } : {}), ...(refresh || retry ? { r: `${refresh}.${retry}` } : {}) })
    fetch(`/api/scores?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('x'))))
      .then((j: { scores: Row[] }) => live && setRows(j.scores))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, level, sort, day, week, names?.join(','), me, refresh, retry])

  if (failed)
    return (
      // bağlantı ya da sunucu sorunu oyuncuya hata gibi değil, boş tablo gibi görünür; yenilemek bir dokunuş
      <p className="mt-3 border-2 border-dashed border-line/70 px-3 py-4 text-center text-[13px] text-muted">
        {t('Şu an gösterilecek skor yok.')}{' '}
        <button className="text-accent underline underline-offset-4 hover:text-cream" onClick={() => setRetry((x) => x + 1)}>
          {t('Yenile')}
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
  if (!rows.length)
    return (
      <p className="mt-3 border-2 border-dashed border-line/70 px-3 py-4 text-center text-[13px] text-muted">
        {names ? t('Arkadaşların bu tabloda henüz yok.') : kind === 'gunluk' ? t('Bugün henüz kimse koşmadı. İlk skor senin olsun!') : kind === 'turnuva' ? t('Bu hafta üç mücadeleyi de bitiren henüz yok. İlk sen ol!') : t('Henüz skor yok. İlk sen ol!')}
      </p>
    )

  const lv = kind === 'city' ? LEVELS.find((l) => l.id === level) : undefined
  const race = kind === 'city' && (!sort || sort === 'time') ? onRace : undefined
  const plural = (k: number, one: string, many: string) => (lng === 'en' ? `${k} ${k === 1 ? one : many}` : `${k} ${one}`)

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
    if (kind === 'yuzde' || kind === 'tur' || kind === 'aynatur') return [formatTime(n(r.timeMs)), `✕${n(r.deaths)}${plays}`]
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

  return (
    <>
      <ol className={`mt-2 grid tabular-nums ${compact ? 'gap-1 text-[14px]' : 'gap-1.5 text-[15px]'}`}>
        {rows.map((r, i) => {
          const gap = i > 0 && r.rank > rows[i - 1].rank + 1
          const [big, sub] = cells(r)
          const medal = lv && (kind === 'city' && (!sort || sort === 'time')) ? medalFor(lv, n(r.timeMs)) : null
          const fill = progress(r)
          const podium = r.rank <= 3 ? PODIUM[r.rank - 1] : null
          return (
            <li key={`${r.name}-${r.rank}`} className={gap ? 'mt-2 border-t-2 border-dashed border-line/70 pt-2' : ''}>
              <div
                className={`grid items-center gap-x-2 border-l-4 px-2.5 ${compact ? 'grid-cols-[2.25rem_minmax(0,1fr)_auto]' : 'grid-cols-[2rem_minmax(0,1fr)_auto] sm:grid-cols-[2.25rem_auto_minmax(0,1fr)_auto] sm:gap-x-2.5 short:grid-cols-[2.25rem_minmax(0,1fr)_auto]'} ${compact ? 'py-1.5' : 'py-2.5 short:py-1.5'} ${r.me ? 'bg-accent/20 outline outline-2 outline-accent/60' : podium ? 'bg-panel-2/80' : i % 2 ? 'bg-panel-2/25' : 'bg-panel-2/55'}`}
                style={{ borderLeftColor: podium ?? 'transparent' }}
              >
                <span
                  className={`flex items-center justify-center justify-self-center font-display leading-none ${podium ? 'h-8 w-8 rounded-full text-[16px] text-ink' : 'text-[17px] text-muted'}`}
                  style={podium ? { background: podium, boxShadow: '0 0 0 2px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.18)' } : undefined}
                >
                  {r.rank}
                </span>
                <span
                  aria-hidden
                  className={`flex items-center justify-center rounded-full font-display text-ink max-sm:hidden short:hidden ${compact ? 'hidden' : 'h-10 w-10 text-[18px]'}`}
                  style={{ background: avatarColor(r.name), boxShadow: '0 0 0 2px rgba(0,0,0,0.35)' }}
                >
                  {r.name.slice(0, 1).toLocaleUpperCase('tr')}
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <a href={`/oyuncu/${encodeURIComponent(r.name)}`} className={`truncate font-semibold text-cream underline-offset-4 hover:underline ${compact ? '' : 'text-[16px]'}`}>
                      {r.name}
                    </a>
                    {r.me && <span className="shrink-0 text-[12px] font-bold tracking-[0.12em] text-gold">{t('SEN')}</span>}
                    {onFriend && !r.me && (
                      <button
                        className={`shrink-0 px-0.5 text-[15px] leading-none ${friends?.includes(r.name) ? 'text-gold' : 'text-muted hover:text-cream'}`}
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
                  </span>
                </span>
                {/* sağ blok sabit sütunlu: rozet, değer ve Yarış düğmesi her satırda aynı hizada */}
                <span className={`grid items-center gap-x-2 ${race ? 'grid-cols-[1.25rem_minmax(4.5rem,auto)_2.25rem] sm:grid-cols-[1.25rem_minmax(5.5rem,auto)_4.75rem]' : 'grid-cols-[1.25rem_minmax(4.5rem,auto)] sm:grid-cols-[1.25rem_minmax(5.5rem,auto)]'}`}>
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
                        className="pixel-btn w-full justify-center px-1.5 py-1 font-mono text-[13px]"
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
      <p className="mt-2 text-right text-[12px] text-muted">{t('{n} yolcu bu tabloda', { n: rows[0].total })}</p>
    </>
  )
}

type Tab = 'genel' | 'city' | 'gunluk' | 'koleksiyon' | 'speedrun'

/** Skor Tablosu ekranı: dört sekme; her sekmenin kendi sıralama seçenekleri ve kısa bir açıklaması var. */
export default function ScoreBoard({
  me,
  startCity = 0,
  startTab = 'genel',
  onDaily,
  canRace,
  onRace,
  friends,
  onFriend,
}: {
  me: string
  startCity?: number
  startTab?: Tab
  /** bugünün hakkı kullanıldıysa verilmez (düğme görünmez) */
  onDaily?: () => void
  canRace?: (levelIdx: number) => boolean
  onRace?: (levelIdx: number, name: string) => Promise<string | null>
  /** arkadaş listesi (adlar); ☆ ile eklenir, süzgeçte yalnız onlar ve oyuncu görünür */
  friends?: string[]
  onFriend?: (name: string) => void
}) {
  const [onlyFriends, setOnlyFriends] = useState(false)
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
    ['speedrun', t('Speedrun')],
  ]
  const sorts: [string, string][] =
    tab === 'genel'
      ? [['', t('Bitirilen Şehir')], ['items', t('Hatıra')], ['deaths', t('En Az Düşüş')]]
      : tab === 'city'
        ? [['', t('Süre')], ['deaths', t('En Az Düşüş')], ['items', t('Hatıra')]]
        : tab === 'speedrun'
          ? [['', '%100'], ['tur', t('Tam Tur')], ['aynatur', t('Ayna Tam Tur')]]
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
        : tab === 'speedrun'
          ? sort === 'tur'
            ? t('İlk defterin otuz şehri baştan sona, arka arkaya: toplam süre.')
            : sort === 'aynatur'
              ? t('Otuz şehir aynada, arka arkaya: toplam süre.')
              : t('Üç hatıra, gizli pul ve nazar boncuğu aynı koşuda alınarak bitirilen en hızlı koşu.')
          : tab === 'koleksiyon'
          ? t('Hesaba kayıtlı defterden: hatıra, gizli pul ve nazar boncuğu toplamı.')
          : t('Herkes için aynı şehir ve aynı kural; skor süreye cezalar eklenerek hesaplanır.')

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col short:mt-1.5">
      <div className="grid grid-cols-5 gap-1.5" role="tablist">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={`pixel-btn justify-center px-1 py-1.5 text-[13px] sm:text-[13px] short:py-1 ${tab === k ? 'primary' : ''}`}
            onClick={() => {
              setTab(k)
              setSort('')
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === 'city' || (tab === 'speedrun' && !sort)) && (
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

      {tab === 'gunluk' ? (
        <div className="mt-2.5 flex items-center gap-3 border-2 border-gold/70 bg-gold/5 px-3 py-2 short:mt-1.5 short:py-1">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#d9a441]">
            <ItemIcon city={dailyLevel.city} taken size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold tracking-[0.14em] text-gold">{day === today ? t('BUGÜN') : t('DÜN')} · {t(rule.name).toLocaleUpperCase(lng)}</p>
            <p className="truncate font-display text-lg leading-tight text-cream">{displayName(dailyLevel)}</p>
            <p className="text-[13px] leading-snug text-muted short:hidden">{t(rule.text)}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {day === today && onDaily ? (
              <button className="pixel-btn primary px-3 py-1.5 text-[13px]" onClick={onDaily}>
                {ic(t('▶ Oyna'))}
              </button>
            ) : null}
            <button className="pixel-btn px-2 py-1 text-[13px]" onClick={() => setDay(day === today ? shiftDay(today, -1) : today)}>
              {day === today ? t('Dünkü') : t('Bugünkü')}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 font-display text-xl text-gold short:hidden">{tab === 'city' || (tab === 'speedrun' && !sort) ? displayName(LEVELS[idx]) : tab === 'genel' ? t('Genel Sıralama') : tab === 'speedrun' ? (sort === 'tur' ? t('Tam Tur') : t('Ayna Tam Tur')) : t('Koleksiyoncular')}</p>
      )}
      <p className="mt-0.5 text-[13px] leading-snug text-muted short:hidden">{tab === 'city' ? `${lv.subtitle} · ${note}` : note}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 short:mt-1">
        {sorts.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Sıralama')}>
            {sorts.map(([k, label]) => (
              <button key={k || 'default'} aria-pressed={sort === k} className={`pixel-btn px-2.5 py-1.5 text-[13px] ${sort === k ? 'primary' : ''}`} onClick={() => setSort(k)}>
                {label}
              </button>
            ))}
          </div>
        )}
        {tab !== 'koleksiyon' && friends && onFriend && (
          <button aria-pressed={onlyFriends} className={`pixel-btn ml-auto px-2.5 py-1.5 text-[13px] ${onlyFriends ? 'primary' : ''}`} onClick={() => setOnlyFriends((v) => !v)}>
            ★ {t('Arkadaşlar')} {friends.length ? `(${friends.length})` : ''}
          </button>
        )}
      </div>
      {onlyFriends && tab !== 'koleksiyon' && friends && onFriend && <AddFriend friends={friends} me={me} onAdd={onFriend} />}
      <div className="overlay-scroll mt-1 min-h-[160px] flex-1 overflow-y-auto overscroll-contain pr-1 short:min-h-[72px]">
        <Board
          kind={tab === 'speedrun' ? (sort === 'tur' || sort === 'aynatur' ? sort : 'yuzde') : tab}
          level={LEVELS[idx].id}
          sort={tab === 'speedrun' ? '' : sort}
          day={tab === 'gunluk' ? day : ''}
          me={me}
          names={onlyFriends && tab !== 'koleksiyon' && friends ? friends : undefined}
          friends={friends}
          onFriend={onFriend}
          onRace={tab === 'city' && onRace && canRace?.(idx) ? (name) => onRace(idx, name) : undefined}
        />
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
