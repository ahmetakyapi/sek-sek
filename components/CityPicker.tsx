'use client'

import { useMemo, useRef, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { displayName } from '@/components/ui'
import { FIRST_BOOK, LEVELS } from '@/game/levels'
import { useT } from '@/lib/i18n'
import { recentCities } from '@/lib/recentCities'
import { formatTime } from '@/lib/storage'

type Diff = 'hepsi' | 'Kolay' | 'Orta' | 'Zor' | 'Çok Zor'
type Book = 'hepsi' | '1' | '2'
const DIFFS: Diff[] = ['hepsi', 'Kolay', 'Orta', 'Zor', 'Çok Zor']
const DIFF_COLOR: Record<string, string> = { Kolay: '#7ad88a', Orta: '#ffd166', Zor: '#ff9a5c', 'Çok Zor': '#ff6b6b' }

/** Türkçe harf farkını (İ ı) ve aksanı yok sayan arama anahtarı */
const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

/**
 * Ortak şehir seçici: arama, zorluk süzgeci, defter sekmeleri, son oynananlar, rekor süresi rozeti, kilitli şehirler soluk,
 * ok tuşlarıyla gezinme. Kurulum ekranları (Kurallı Koşu, Sinir Bozucu, Düello, Maraton, Kovalamaca...) hepsi bunu kullanır.
 * Liste kendi alanında kayar (`className` yüksekliği verir); üstteki arama ve süzgeçler kısa ekranda gizlenir ama klavye çalışır.
 */
export function CityPicker({
  value,
  onChange,
  isOpen,
  fits,
  record,
  badge,
  tone = 'var(--color-gold)',
  className = '',
  compact = false,
  label,
}: {
  /** seçili şehrin LEVELS dizini */
  value: number
  onChange: (idx: number) => void
  /** şehir seçilebilir mi (açılmış / bitirilmiş); kapalılar soluk ve kilitli */
  isOpen: (idx: number) => boolean
  /** açık ama bu seçim için uygun değil (kural bu şehirde yok): soluk, "Yok" rozeti */
  fits?: (idx: number) => boolean
  /** şehirdeki rekor (ms); yoksa rozet çıkmaz */
  record?: (levelId: string) => number | undefined
  /** rekorun anlamı için küçük açıklama (örn. "Bu kuralda") */
  badge?: string
  tone?: string
  /** listenin yüksekliği ve yerleşimi */
  className?: string
  /** arama ve süzgeç satırları tek satıra iner (kısa ekran, Düello gibi dolu kurulumlar) */
  compact?: boolean
  label?: string
}) {
  const t = useT()
  const [q, setQ] = useState('')
  const [diff, setDiff] = useState<Diff>('hepsi')
  const [book, setBook] = useState<Book>('hepsi')
  const listRef = useRef<HTMLDivElement>(null)
  const recent = useMemo(() => recentCities(), [])
  const hasBook2 = LEVELS.length > FIRST_BOOK

  const shown = useMemo(() => {
    const k = fold(q.trim())
    return LEVELS.map((l, i) => ({ l, i })).filter(({ l, i }) => {
      if (diff !== 'hepsi' && l.difficulty !== diff) return false
      if (book === '1' && i >= FIRST_BOOK) return false
      if (book === '2' && i < FIRST_BOOK) return false
      if (!k) return true
      return fold(l.name).includes(k) || fold(l.nickname ?? '').includes(k) || String(l.plate).padStart(2, '0') === k || String(l.plate) === k
    })
  }, [q, diff, book])

  const ok = (i: number) => isOpen(i) && (fits ? fits(i) : true)
  const enabled = shown.filter(({ i }) => ok(i))

  const move = (k: number) => {
    if (!enabled.length) return
    const at = enabled.findIndex(({ i }) => i === value)
    const next = enabled[(at < 0 ? (k > 0 ? 0 : enabled.length - 1) : at + k + enabled.length) % enabled.length]
    onChange(next.i)
    // seçili satır görünür kalsın
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-city="${next.i}"]`)?.scrollIntoView({ block: 'nearest' }))
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') (e.preventDefault(), move(1))
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      // arama kutusunda sol/sağ imleci taşısın
      if ((e.target as HTMLElement).tagName === 'INPUT' && e.key === 'ArrowLeft') return
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home') (e.preventDefault(), enabled[0] && onChange(enabled[0].i))
    else if (e.key === 'End') (e.preventDefault(), enabled.at(-1) && onChange(enabled.at(-1)!.i))
  }
  const chip = (on: boolean) => `shrink-0 whitespace-nowrap border-2 px-2 py-0.5 text-[12px] font-bold leading-tight ${on ? 'border-gold bg-gold/15 text-cream' : 'border-line bg-ink/40 text-cream/80 hover:border-accent-2'}`
  const recents = recent.map((id) => LEVELS.findIndex((l) => l.id === id)).filter((i) => i >= 0 && ok(i)).slice(0, 4)

  return (
    <div className={`flex min-h-0 min-w-0 flex-col gap-1.5 ${className}`} style={{ ['--tone' as string]: tone }} onKeyDown={onKey}>
      <div className="flex items-center gap-1.5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Şehir ara (ad ya da plaka)')}
          aria-label={label ?? t('Şehir Ara')}
          className="min-w-0 flex-1 border-2 border-line bg-ink px-2.5 py-1.5 text-[14px] text-cream outline-none focus:border-gold"
        />
        {hasBook2 && !compact && (
          <div className="seg shrink-0" role="group" aria-label={t('Defter')}>
            {([['hepsi', t('Hepsi')], ['1', t('1. Defter')], ['2', t('2. Defter')]] as [Book, string][]).map(([k, lbl]) => (
              <button key={k} aria-pressed={book === k} onClick={() => setBook(k)}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto short:hidden" role="group" aria-label={t('Zorluk')}>
        {DIFFS.map((d) => (
          <button key={d} aria-pressed={diff === d} className={chip(diff === d)} onClick={() => setDiff(d)}>
            {d === 'hepsi' ? t('Hepsi') : t(d)}
          </button>
        ))}
        {hasBook2 && compact && (
          <button className={chip(book !== 'hepsi')} aria-pressed={book !== 'hepsi'} onClick={() => setBook(book === 'hepsi' ? '1' : book === '1' ? '2' : 'hepsi')}>
            {book === 'hepsi' ? t('Defter') : book === '1' ? t('1. Defter') : t('2. Defter')}
          </button>
        )}
      </div>
      {recents.length > 0 && !q && (
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto short:hidden" role="group" aria-label={t('Son Oynananlar')}>
          <span className="shrink-0 text-[12px] font-semibold text-muted">{t('Son')}</span>
          {recents.map((i) => (
            <button key={i} className={chip(value === i)} aria-pressed={value === i} onClick={() => onChange(i)}>
              {LEVELS[i].name}
            </button>
          ))}
        </div>
      )}
      <div ref={listRef} role="listbox" aria-label={label ?? t('Şehir')} aria-activedescendant={`city-${value}`} tabIndex={0} className="overlay-scroll min-h-[96px] flex-1 overflow-y-auto border-2 border-line bg-ink/30 p-1 outline-none focus-visible:border-gold">
        {shown.length === 0 ? (
          <p className="px-2 py-3 text-center text-[13px] text-muted">{t('Bu aramaya uyan şehir yok.')}</p>
        ) : (
          <ul className="grid gap-1 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
            {shown.map(({ l, i }) => {
              const open = isOpen(i)
              const fit = fits ? fits(i) : true
              const sel = value === i
              const rec = open && fit ? record?.(l.id) : undefined
              return (
                <li key={l.id}>
                  <button
                    id={`city-${i}`}
                    data-city={i}
                    role="option"
                    aria-selected={sel}
                    disabled={!open || !fit}
                    onClick={() => onChange(i)}
                    className={`flex w-full min-w-0 items-center gap-2 border-2 px-1.5 py-1 text-left transition-colors disabled:cursor-not-allowed ${open && fit ? '' : 'opacity-40'} ${sel ? 'border-[var(--tone)] bg-[var(--tone)]/15' : 'border-line bg-ink/40 enabled:hover:bg-panel-2'}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#221f4a]">
                      <ItemIcon city={l.city} taken={open} size={18} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex items-center gap-1">
                        <span className="text-[11px] font-bold tabular-nums tracking-[0.1em] text-muted">{String(l.plate).padStart(2, '0')}</span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: DIFF_COLOR[l.difficulty] }} title={t(l.difficulty)} aria-label={t(l.difficulty)} />
                      </span>
                      <span className="block truncate text-[14px] font-semibold text-cream">{displayName(l)}</span>
                    </span>
                    {!open ? (
                      <span className="shrink-0 text-[12px] text-muted" title={t('Önce bu şehri bitir')}>
                        🔒
                      </span>
                    ) : !fit ? (
                      <span className="shrink-0 text-[11px] text-muted">{t('Yok')}</span>
                    ) : rec !== undefined ? (
                      <span className="shrink-0 text-[12px] font-bold tabular-nums text-gold" title={badge}>
                        ★ {formatTime(rec)}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
