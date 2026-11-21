'use client'

import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ScoreBoard'
import { MedalBadge, SectionTitle, displayName, ic, medalFor } from '@/components/ui'
import type { LevelDef } from '@/game/types'
import { CHARACTERS } from '@/game/characters'
import { TOP_N, cachedCityScores, gapToLeader, loadCityScores, visibleRows, type CityScoreRow, type CityScores } from '@/lib/cityScores'
import { useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

type State = { status: 'load' } | { status: 'err' } | { status: 'ok'; data: CityScores }

/** Şehrin skorları: önbellek, iptal ve Tekrar Dene burada; şehir ya da oyuncu değişince yeniden yüklenir */
export function useCityScores(level: string, me: string, enabled = true) {
  const [state, setState] = useState<State>(() => {
    const hit = cachedCityScores(level, me)
    return hit ? { status: 'ok', data: hit } : { status: 'load' }
  })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const hit = retry ? null : cachedCityScores(level, me)
    if (hit) return setState({ status: 'ok', data: hit })
    setState({ status: 'load' })
    const ac = new AbortController()
    loadCityScores(level, me, ac.signal, retry)
      .then((data) => setState({ status: 'ok', data }))
      .catch(() => !ac.signal.aborted && setState({ status: 'err' }))
    return () => ac.abort()
  }, [level, me, retry, enabled])
  return { state, retry: () => setRetry((x) => x + 1) }
}

const PODIUM = ['#ffcc66', '#d7dde6', '#d08a52']
const sec = (ms: number, lng: string) => `${(ms / 1000).toLocaleString(lng === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

/** Kartta tek satırlık özet: lider ve oyuncunun sırası; tıklayınca panel açılır */
export function CityScoreChip({ level, me, onOpen }: { level: string; me: string; onOpen: () => void }) {
  const t = useT()
  const { state } = useCityScores(level, me)
  const rows = state.status === 'ok' ? state.data.rows : []
  const lead = rows.find((r) => r.rank === 1)
  const mine = rows.find((r) => r.me)
  return (
    <button type="button" onClick={onOpen} className="flex min-h-[28px] items-center gap-1.5 rounded-sm bg-ink/60 px-2 py-0.5 text-left text-[12px] font-bold tabular-nums text-cream hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-gold">
      <span aria-hidden>🏆</span>
      {state.status === 'load' ? (
        <span className="text-muted">{t('Skorlar')}</span>
      ) : lead ? (
        <>
          <span className="max-w-[9rem] truncate">{t('Lider {name}', { name: lead.name })}</span>
          <span className="text-gold">{formatTime(lead.timeMs)}</span>
          {mine && <span className="text-accent-2">· #{mine.rank}</span>}
        </>
      ) : (
        <span className="text-muted">{state.status === 'err' ? t('Skorlar') : t('İlk Rekoru Sen Koy')}</span>
      )}
    </button>
  )
}

function Detail({ row, rows, level, lng, canRace, onRace }: { row: CityScoreRow; rows: CityScoreRow[]; level: LevelDef; lng: string; canRace: boolean; onRace?: (name: string) => Promise<string | null> }) {
  const t = useT()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const gap = gapToLeader(rows, row)
  const medal = medalFor(level, row.timeMs)
  const hero = row.hero ? CHARACTERS[row.hero].name : null
  const facts: [string, React.ReactNode][] = [
    [t('Süre'), formatTime(row.timeMs)],
    [t('Düşüş'), row.deaths === row.minDeaths ? `✕${row.deaths}` : t('✕{a} (en az ✕{b})', { a: row.deaths, b: row.minDeaths })],
    [t('Hatıra'), row.items === row.maxItems ? `${row.items}/3` : t('{a}/3 (en çok {b}/3)', { a: row.items, b: row.maxItems })],
    [t('Koşu'), String(row.plays)],
    ...(hero ? ([[t('Yolcu'), hero]] as [string, React.ReactNode][]) : []),
    ...(gap !== null ? ([[t('Lidere Fark'), `+${gap >= 100000 ? formatTime(gap) : `${sec(gap, lng)} ${t('sn')}`}`]] as [string, React.ReactNode][]) : []),
  ]
  return (
    <div className="mx-0.5 border-2 border-t-0 border-line bg-ink/50 px-3 py-2.5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[12px] text-muted">{k}</dt>
            <dd className="flex items-center gap-1.5 truncate font-semibold text-cream">
              {v}
              {k === t('Süre') && medal && <MedalBadge medal={medal} />}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <a data-nav href={`/oyuncu/${encodeURIComponent(row.name)}`} className="pixel-btn min-h-[44px] justify-center px-3 text-[13px]">
          {t('Profili Aç')}
        </a>
        {onRace && canRace && !row.me && (
          <button
            className="pixel-btn min-h-[44px] justify-center px-3 text-[13px]"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const err = await onRace(row.name)
              setBusy(false)
              setMsg(err ?? '')
            }}
          >
            {busy ? '…' : ic(t('◌ Hayaletiyle Yarış'))}
          </button>
        )}
        {msg && <span className="text-[13px] text-muted" role="status">{msg}</span>}
      </div>
    </div>
  )
}

/**
 * Şehir kartının skor paneli: şehrin ilk on yolcusu (sıra, portre, ad, süre, düşüş, hatıra), oyuncunun kendi satırı vurgulu,
 * arkadaşlar yıldızlı. Satıra basınca o yolcunun ayrıntısı açılır (profil bağlantısı, hayalet yarışı). Giriş gerekmez.
 */
export default function CityScores({
  level,
  me,
  friends,
  onFriend,
  canRace,
  onRace,
  onAll,
}: {
  level: LevelDef
  me: string
  friends: string[]
  onFriend?: (name: string) => void
  canRace: boolean
  onRace?: (name: string) => Promise<string | null>
  onAll: () => void
}) {
  const t = useT()
  const lng = useLang()
  const { state, retry } = useCityScores(level.id, me)
  const [open, setOpen] = useState<string | null>(null)
  const list = useRef<HTMLOListElement>(null)
  useEffect(() => setOpen(null), [level.id])
  const data = state.status === 'ok' ? state.data : null
  const rows = data ? visibleRows(data.rows, TOP_N) : []
  const lead = data?.rows.find((r) => r.rank === 1)

  const nav = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLElement)
    if (at < 0) return
    e.preventDefault()
    items[Math.max(0, Math.min(items.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionTitle title={t('En İyi Süreler')} note={data ? t('{n} yolcu', { n: data.total }) : undefined} tone="var(--color-gold)" />
      <div className="overlay-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {state.status === 'err' ? (
          <div className="border-2 border-dashed border-line/70 px-3 py-5 text-center" role="alert">
            <p className="font-display text-[17px] text-cream">{t('Skorlar Alınamadı')}</p>
            <p className="mt-1 text-[13px] text-muted">{t('Bağlantı ya da sunucu yanıt vermedi. Biraz sonra tekrar dene.')}</p>
            <button className="pixel-btn primary mt-3 min-h-[44px] px-4" onClick={retry}>
              {ic(t('↻ Tekrar Dene'))}
            </button>
          </div>
        ) : state.status === 'load' ? (
          <ol className="grid gap-1.5" aria-busy="true" aria-label={t('Yükleniyor')}>
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="h-[48px] animate-pulse bg-panel-2/50" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </ol>
        ) : !rows.length ? (
          <div className="border-2 border-dashed border-line/70 px-3 py-6 text-center">
            <p className="font-display text-[18px] text-cream">{t('İlk Rekoru Sen Koy')}</p>
            <p className="mt-1 text-[13px] text-muted">{t('{city} için henüz skor yok. Bitir, listenin başına yaz.', { city: level.name })}</p>
          </div>
        ) : (
          <ol ref={list} onKeyDown={nav} className="grid gap-1 tabular-nums">
            {rows.map((r, i) => {
              const gap = i > 0 && r.rank > rows[i - 1].rank + 1
              const podium = r.rank <= 3 ? PODIUM[r.rank - 1] : null
              const on = open === r.name
              const fav = friends.some((f) => f.toLocaleLowerCase('tr') === r.name.toLocaleLowerCase('tr'))
              const medal = medalFor(level, r.timeMs)
              return (
                <li key={r.name} className={gap ? 'mt-2 border-t-2 border-dashed border-line/70 pt-2' : ''}>
                  <div className={`flex items-stretch border-l-4 ${r.me ? 'bg-accent/20 outline outline-2 outline-accent/60' : i % 2 ? 'bg-panel-2/30' : 'bg-panel-2/60'}`} style={{ borderLeftColor: podium ?? 'transparent' }}>
                    <button
                      type="button"
                      data-row
                      aria-expanded={on}
                      aria-label={t('{name}: {time}, ayrıntıyı aç', { name: r.name, time: formatTime(r.timeMs) })}
                      onClick={() => setOpen(on ? null : r.name)}
                      className="grid min-h-[52px] min-w-0 flex-1 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center sm:grid-cols-[1.75rem_2rem_minmax(0,1fr)_auto] short:!grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-2 px-2 py-1 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold short:min-h-[44px]"
                    >
                      <span className={`flex items-center justify-center font-display leading-none ${podium ? 'h-7 w-7 rounded-full text-[15px] text-ink' : 'text-[16px] text-muted'}`} style={podium ? { background: podium } : undefined}>
                        {r.rank}
                      </span>
                      <span className="max-sm:hidden short:hidden"><Avatar name={r.name} hero={r.hero} /></span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[15px] font-semibold leading-tight text-cream">{r.name}</span>
                          {r.me && <span className="shrink-0 border border-gold/70 bg-gold/10 px-1.5 text-[12px] font-bold leading-snug text-gold">{t('Sen')}</span>}
                        </span>
                        <span className="block truncate text-[12px] text-muted">✕{r.deaths} · {r.items}/3</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {medal && <MedalBadge medal={medal} />}
                        <span className="font-display text-[19px] leading-none text-cream">{formatTime(r.timeMs)}</span>
                        <span aria-hidden className={`text-[12px] text-muted transition-transform motion-reduce:transition-none ${on ? 'rotate-180' : ''}`}>▾</span>
                      </span>
                    </button>
                    {onFriend && !r.me && (
                      <button
                        type="button"
                        className={`flex w-10 shrink-0 items-center justify-center text-[18px] leading-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold ${fav ? 'text-gold' : 'text-muted hover:text-cream'}`}
                        aria-pressed={fav}
                        aria-label={fav ? t('{name} Arkadaşlarından Çıkar', { name: r.name }) : t('{name} Arkadaş Ekle', { name: r.name })}
                        onClick={() => onFriend(r.name)}
                      >
                        {fav ? '★' : '☆'}
                      </button>
                    )}
                  </div>
                  {on && data && <Detail row={r} rows={data.rows} level={level} lng={lng} canRace={canRace} onRace={onRace} />}
                </li>
              )
            })}
          </ol>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] text-muted">{lead ? t('{city}: lider {name}', { city: displayName(level), name: lead.name }) : displayName(level)}</p>
        <button className="pixel-btn min-h-[44px] px-4 text-[14px]" onClick={onAll}>
          {ic(t('Tüm Sıralama →'))}
        </button>
      </div>
    </div>
  )
}
