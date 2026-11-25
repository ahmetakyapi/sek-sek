'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Portrait from '@/components/Portrait'
import { ProgressRing, TotalsGrid, tintOf, totalTime } from '@/components/ProfileView'
import { MedalBadge, ic } from '@/components/ui'
import { LEVELS } from '@/game/levels'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { SCARVES, scarfFor } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import type { ProfileCity, ProfileData } from '@/lib/profile'
import { formatTime } from '@/lib/storage'

type State = { status: 'load' } | { status: 'none' } | { status: 'err' } | { status: 'ok'; data: ProfileData }

/** kısa ömürlü önbellek: aynı yolcuya yeniden basınca ağ beklenmez (20 sn) */
const cache = new Map<string, { at: number; data: ProfileData }>()
const FRESH_MS = 20_000

/** Yolcunun herkese açık profili (`GET /api/players/profile`); ad değişince iptal edilir */
function useProfile(name: string, retry: number) {
  const key = name.toLocaleLowerCase('tr')
  const [state, setState] = useState<State>(() => {
    const hit = cache.get(key)
    return hit && Date.now() - hit.at < FRESH_MS ? { status: 'ok', data: hit.data } : { status: 'load' }
  })
  useEffect(() => {
    const hit = cache.get(key)
    if (!retry && hit && Date.now() - hit.at < FRESH_MS) return setState({ status: 'ok', data: hit.data })
    setState({ status: 'load' })
    const ac = new AbortController()
    fetch(`/api/players/profile?name=${encodeURIComponent(name)}`, { signal: ac.signal })
      .then(async (r) => {
        if (r.status === 404) return setState({ status: 'none' })
        if (!r.ok) throw new Error('x')
        const j = (await r.json()) as { profile?: ProfileData }
        if (!j.profile || typeof j.profile !== 'object' || !j.profile.cities) throw new Error('x')
        cache.set(key, { at: Date.now(), data: j.profile })
        setState({ status: 'ok', data: j.profile })
      })
      .catch(() => !ac.signal.aborted && setState({ status: 'err' }))
    return () => ac.abort()
  }, [key, name, retry])
  return state
}

/** En iyi şehirler: önce sıra, sonra madalya, sonra süre */
function topCities(d: ProfileData, k: number): ProfileCity[] {
  const rankOf = (m: ProfileCity['medal']) => (m === 'altin' ? 0 : m === 'gumus' ? 1 : m === 'bronz' ? 2 : 3)
  return Object.values(d.cities)
    .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || rankOf(a.medal) - rankOf(b.medal) || a.timeMs - b.timeMs)
    .slice(0, k)
}

export interface DrawerRow {
  name: string
  hero?: string | null
  rank: number
  total: number
  me: boolean
}

/**
 * Yolcu ayrıntısı: Skor Tablosu'nda bir satıra ya da kürsüdeki yolcuya basınca ekranı değiştirmeden yandan (telefonda
 * alttan) açılan çekmece. Portre, ad, unvan, atkı, katılım, yol halkası, özet sayılar, toplam süre, en iyi şehirler ve
 * vitrin; altta "Profili Aç", isteğe bağlı "◌ Hayaletiyle Yarış" ve ☆ arkadaş. Esc, Geri ya da arka plana basmak kapatır;
 * kapanınca odak açan satıra döner. Veri `/api/players/profile` (salt okunur); gelene dek satırdaki bilgi görünür.
 */
export default function PlayerDrawer({
  row,
  board,
  value,
  onClose,
  friend,
  onFriend,
  onRace,
}: {
  row: DrawerRow
  /** tablonun adı ("Genel Sıralama", şehir adı…): bağlam şeridinde */
  board: string
  /** satırın sağındaki ana değer (bu tablodaki ölçüt) */
  value: React.ReactNode
  onClose: () => void
  friend?: boolean
  onFriend?: () => void
  /** yalnız süre sıralı şehir tablosunda: hayalet yarışı (hata metni döner) */
  onRace?: () => Promise<string | null>
}) {
  const t = useT()
  const lang = useLang()
  const [retry, setRetry] = useState(0)
  const state = useProfile(row.name, retry)
  const [raceMsg, setRaceMsg] = useState('')
  const [racing, setRacing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inGame, setInGame] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    setMounted(true)
    setInGame(!!document.querySelector('.game-root'))
    const opener = document.activeElement as HTMLElement | null
    // Esc önce çekmeceyi kapatır (yakalama evresinde: oyunun "Geri" kısayolu ekranı kapatmasın)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeRef.current()
      } else if (e.key === 'Tab' && sheet.current) {
        // odak çekmecede döner
        const els = [...sheet.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null)
        if (!els.length) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      opener?.focus?.({ preventScroll: true })
    }
  }, [])

  // portal ilk çizimden sonra kurulur: odak çekmece görününce ilk düğmeye
  useEffect(() => {
    if (mounted) sheet.current?.querySelector<HTMLElement>('[data-first]')?.focus({ preventScroll: true })
  }, [mounted])

  if (!mounted) return null
  const d = state.status === 'ok' ? state.data : null
  const hero = d?.hero ?? (row.hero === 'memo' ? 'memo' : 'uktun')
  const tint = d ? tintOf(d) : hero === 'memo' ? '#e0574f' : '#5ad6c6'
  const scarf = d ? scarfFor(d.scarf) : null
  const ownScarf = !scarf || scarf.id === SCARVES[0].id
  const since = d?.since ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'tr-TR', { month: 'long', year: 'numeric' }).format(new Date(d.since)) : null
  const done = d ? Object.keys(d.cities).length : 0
  const total = d ? totalTime(d) : 0
  const best = d ? topCities(d, 4) : []
  const pins = d ? d.pins.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a) : []
  const href = `/oyuncu/${encodeURIComponent(row.name)}`

  return createPortal(
    <div className="pd-root" style={{ ['--tint' as string]: tint }}>
      <div className="pd-scrim" onClick={onClose} aria-hidden />
      <div ref={sheet} className="pd-sheet" role="dialog" aria-modal="true" aria-label={t('{name} · Yolcu Ayrıntısı', { name: row.name })}>
        <div className="pd-scroll overlay-scroll">
          <header className="pd-head">
            <div className="pd-portrait" aria-hidden>
              {d ? (
                <Portrait id={hero} className="w-full" scarf={ownScarf || !scarf ? null : { color: scarf.color, shade: scarf.shade }} accessory={d.kit} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/portreler/${hero}.png`} alt="" width={96} height={96} className="h-full w-full object-cover object-top" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="pd-name">{row.name}</h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {d ? <span className="pf-title">★ {t(d.title)}</span> : <span className="pd-skel h-5 w-28" />}
                {row.me && <span className="pf-title !border-accent-2 !bg-accent/15 !text-accent-2">{t('Sen')}</span>}
                {d && !ownScarf && scarf && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-muted">
                    <span className="block h-3 w-3 rounded-full border border-ink" style={{ background: scarf.color }} aria-hidden />
                    {lang === 'en' ? scarf.nameEn : scarf.name}
                  </span>
                )}
              </p>
              {d && <p className="mt-1 text-[13px] text-muted">{since ? t('{d} tarihinden beri yolda.', { d: since }) : t('Yolculuk sürüyor.')}</p>}
            </div>
            <button data-back className="pixel-btn back-btn pd-close shrink-0" onClick={onClose} aria-label={t('Kapat')}>
              {ic(t('← Geri'))}
            </button>
          </header>

          <div className="pd-context">
            <span className="pd-rank">
              <small>{board}</small>
              <b>#{row.rank}</b>
              <span className="text-[12px] text-muted">/ {row.total}</span>
            </span>
            <span className="pd-value">{value}</span>
          </div>

          {state.status === 'load' && (
            <div className="mt-3 grid gap-2" aria-busy="true" aria-label={t('Yükleniyor')}>
              <span className="pd-skel h-[118px] w-full" />
              <span className="pd-skel h-[120px] w-full" />
            </div>
          )}
          {state.status === 'none' && <p className="pd-note">{t('Bu yolcunun herkese açık profili yok.')}</p>}
          {state.status === 'err' && (
            <div className="pd-note" role="alert">
              <p>{t('Profil şu an alınamadı.')}</p>
              <button className="pixel-btn mt-2 min-h-[44px] px-4 text-[13px]" onClick={() => setRetry((x) => x + 1)}>
                {ic(t('↻ Tekrar Dene'))}
              </button>
            </div>
          )}
          {d && (
            <>
              <section className="pd-sec" aria-label={t('Özet')}>
                <div className="pd-summary">
                  <ProgressRing value={done} max={LEVELS.length} size={60} label={t('Bitirilen Şehir')} />
                  <dl className="pd-facts">
                    <div>
                      <dt>{t('Toplam Süre')}</dt>
                      <dd>{done ? formatTime(total) : '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('Başarım')}</dt>
                      <dd>
                        {d.earned.length}
                        <small>/{ACHIEVEMENTS.length}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>{t('Günlük Seri')}</dt>
                      <dd>{d.streak}</dd>
                    </div>
                  </dl>
                </div>
                <TotalsGrid data={d} className="mt-2" />
              </section>

              <section className="pd-sec">
                <h3 className="pf-h">{t('En İyi Şehirler')}</h3>
                {best.length ? (
                  <ol className="pd-best">
                    {best.map((c) => {
                      const l = LEVELS.find((x) => x.id === c.id)!
                      return (
                        <li key={c.id}>
                          <span className="plate text-[11px]">
                            <span>{String(l.plate).padStart(2, '0')}</span>
                          </span>
                          <span className="min-w-0 truncate text-[14px] font-semibold text-cream">
                            {localize(l, lang).name}
                            {c.full && <span className="pf-tag ml-1.5 align-middle">%100</span>}
                          </span>
                          <span className="pf-time">
                            <span className="inline-flex w-4 justify-center">{c.medal && <MedalBadge medal={c.medal} />}</span>
                            {formatTime(c.timeMs)}
                          </span>
                          <span className="pf-rank">{c.rank ? `#${c.rank}` : ''}</span>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <p className="mt-1 text-[13px] text-muted">{t('Henüz bitirdiği bir şehir yok.')}</p>
                )}
              </section>

              {pins.length > 0 && (
                <section className="pd-sec">
                  <h3 className="pf-h">{t('Vitrin')}</h3>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {pins.map((a) => (
                      <li key={a.id} className="pd-pin" title={t(a.text)}>
                        <span className="pf-pin-ic !h-6 !w-6 !text-[13px]">{a.icon}</span>
                        <span className="truncate">{t(a.name)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="pd-foot">
          <a data-first href={href} target={inGame ? '_blank' : undefined} rel={inGame ? 'noreferrer' : undefined} className="pixel-btn primary pd-btn">
            {t('Profili Aç')}
            {inGame ? ' ↗' : ' →'}
          </a>
          {onRace && !row.me && (
            <button
              className="pixel-btn pd-btn"
              disabled={racing}
              onClick={async () => {
                setRacing(true)
                const err = await onRace()
                setRacing(false)
                setRaceMsg(err ?? '')
              }}
            >
              {racing ? '…' : ic(t('◌ Hayaletiyle Yarış'))}
            </button>
          )}
          {onFriend && !row.me && (
            <button className={`pixel-btn pd-btn ${friend ? 'tone [--tone:var(--color-gold)]' : ''}`} aria-pressed={!!friend} onClick={onFriend}>
              {friend ? '★' : '☆'} {friend ? t('Arkadaşın') : t('Arkadaş Ekle')}
            </button>
          )}
          {raceMsg && (
            <span className="w-full text-[13px] text-muted" role="status">
              {raceMsg}
            </span>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
