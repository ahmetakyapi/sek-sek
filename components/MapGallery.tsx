'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CITY } from '@/game/art'
import { LEVELS } from '@/game/levels'
import type { CityKey } from '@/game/types'
import { QUERY_MAX, type CommunityMap, type MapSort } from '@/lib/communityMaps'
import { decodeMap } from '@/lib/customLevel'
import MapThumb from '@/components/MapThumb'
import { LangProvider, useLang, useT, type Lang } from '@/lib/i18n'

/**
 * Topluluk Haritaları galerisi (/haritalar): yolcuların düzenleyicide çizip yayınladığı haritalar. Kartta haritanın
 * küçük önizlemesi, yazar, şehir teması, beğeni ve oynanma. "Oyna" sayacı artırıp oyuna `?ozel=<kod>` ile geçer.
 */

type Tab = MapSort | 'benim'

const TABS: Array<[Tab, string]> = [
  ['yeni', 'Yeni'],
  ['begeni', 'En Beğenilen'],
  ['oynanan', 'En Çok Oynanan'],
  ['benim', 'Haritalarım'],
]

/** önizlemenin en az genişliği (karo): kartın en/boy oranı ~4:1, 24 satır */
const THUMB_MIN_W = 100

const cityName = (c: string) => LEVELS.find((l) => l.city === c)?.name ?? c

/** Topluluk haritasının kuşbakışı (kodu çözülür, MapThumb çizer) */
function Thumb({ code, city }: { code: string; city: string }) {
  const r = decodeMap(code)
  if ('error' in r) return null
  return <MapThumb map={r.map} city={(CITY[city as CityKey] ? city : r.city) as CityKey} minW={THUMB_MIN_W} />
}

function Card({ m, onLike, onPlay, onDelete }: { m: CommunityMap; onLike: (m: CommunityMap) => void; onPlay: (m: CommunityMap) => void; onDelete: (m: CommunityMap) => void }) {
  const t = useT()
  const lang = useLang()
  const date = new Date(m.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short' })
  const size = decodeMap(m.code)
  const cols = 'error' in size ? 0 : size.map[0].length
  const [armed, setArmed] = useState(false)
  return (
    <li className="pixel-panel no-kilim flex min-w-0 flex-col gap-3 p-3">
      <div className="h-20 overflow-hidden border-2 border-line bg-ink">
        <Thumb code={m.code} city={m.city} />
      </div>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-xl leading-tight text-cream">
          <span className="truncate" title={m.title}>
            {m.title}
          </span>
          {m.updatedAt && (
            <span className="shrink-0 border-2 border-line px-1.5 py-0.5 font-body text-[11px] font-semibold leading-none text-gold" title={new Date(m.updatedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR')}>
              {t('Güncellendi')}
            </span>
          )}
        </h2>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          <Link href={`/oyuncu/${encodeURIComponent(m.author)}`} className="text-accent-2 hover:text-cream">
            {m.author}
          </Link>
          {' · '}
          {cityName(m.city)} · {date}
          {cols > 0 && ` · ${t('{n} sütun', { n: cols })}`} ·{' '}
          <span className="nowrap tabular-nums" title={t('Oynanma')}>
            ▶ {m.plays}
          </span>
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a href={`/?ozel=${m.code}`} onClick={(e) => (e.preventDefault(), onPlay(m))} className="pixel-btn primary px-3 py-1.5 text-sm">
          ▶ {t('Oyna')}
        </a>
        <button
          type="button"
          onClick={() => onLike(m)}
          aria-pressed={m.liked}
          aria-label={m.liked ? t('Beğeniyi Geri Al') : t('Beğen')}
          className="pixel-btn px-2.5 py-1.5 text-sm tabular-nums"
        >
          <span className={m.liked ? 'text-flag' : ''}>{m.liked ? '♥' : '♡'}</span> {m.likes}
        </button>
        <Link href={m.mine ? `/duzenle?kod=${m.code}&yayin=${m.id}` : `/duzenle?kod=${m.code}`} className="ml-auto whitespace-nowrap text-[13px] text-muted underline decoration-line underline-offset-4 hover:text-cream">
          {t('Düzenleyicide Aç')}
        </Link>
        {m.mine && (
          <button
            type="button"
            className={`pixel-btn px-2.5 py-1.5 text-[13px] ${armed ? 'primary' : ''}`}
            onClick={() => (armed ? onDelete(m) : setArmed(true))}
            onBlur={() => setArmed(false)}
          >
            {armed ? t('Emin misin? Sil') : t('Sil')}
          </button>
        )}
      </div>
    </li>
  )
}

function Body({ setLang }: { setLang: (l: Lang) => void }) {
  const t = useT()
  const [sort, setSort] = useState<Tab>('yeni')
  const [query, setQuery] = useState('')
  const [q, setQ] = useState('')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [maps, setMaps] = useState<CommunityMap[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    try {
      const save = JSON.parse(localStorage.getItem('seksek:v1') ?? 'null') as { lang?: Lang } | null
      if (save?.lang === 'en') setLang('en')
    } catch {
      /* depo kapalı: Türkçe kalır */
    }
  }, [setLang])

  // "Haritalarım" için oturum var mı (çerez; çerezden önceki girişler yerel kayıttaki anahtarla)
  useEffect(() => {
    let live = true
    fetch('/api/players/me', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ player?: unknown }>) : null))
      .then((j) => live && setSignedIn(!!j?.player))
      .catch(() => live && setSignedIn(false))
    return () => {
      live = false
    }
  }, [])

  // arama kutusu: yazmayı bırakınca sorgula
  useEffect(() => {
    const id = window.setTimeout(() => setQ(query.trim()), 300)
    return () => window.clearTimeout(id)
  }, [query])

  const load = useCallback(async (s: Tab, p: number, text: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort: s === 'benim' ? 'yeni' : s, page: String(p) })
      if (s === 'benim') params.set('mine', '1')
      if (text) params.set('q', text)
      const r = await fetch(`/api/maps?${params}`, { cache: 'no-store' })
      const j = (await r.json()) as { maps?: CommunityMap[]; hasMore?: boolean }
      setMaps((old) => (p === 0 ? (j.maps ?? []) : [...old, ...(j.maps ?? []).filter((m) => !old.some((o) => o.id === m.id))]))
      setHasMore(!!j.hasMore)
      setPage(p)
    } catch {
      if (p === 0) setMaps([])
      setHasMore(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load(sort, 0, q)
  }, [sort, q, load])

  const remove = async (m: CommunityMap) => {
    setNotice(null)
    try {
      const r = await fetch(`/api/maps/${m.id}`, { method: 'DELETE' })
      if (!r.ok) return setNotice(t('Harita şu an silinemedi.'))
      setMaps((all) => all.filter((x) => x.id !== m.id))
    } catch {
      setNotice(t('Harita şu an silinemedi.'))
    }
  }

  const like = async (m: CommunityMap) => {
    setNotice(null)
    try {
      const r = await fetch(`/api/maps/${m.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'like' }) })
      if (r.status === 401) return setNotice(t('Beğenmek için oyunda giriş yap.'))
      if (!r.ok) return setNotice(t('Beğeni şu an kaydedilemedi.'))
      const j = (await r.json()) as { liked: boolean; likes: number }
      setMaps((all) => all.map((x) => (x.id === m.id ? { ...x, ...j } : x)))
    } catch {
      setNotice(t('Beğeni şu an kaydedilemedi.'))
    }
  }

  // sayaç önce: yönlendirme isteği kesmesin (keepalive), yanıt beklenmez
  const play = (m: CommunityMap) => {
    try {
      void fetch(`/api/maps/${m.id}`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'play' }) }).catch(() => {})
    } catch {
      /* sayaç tutmasa da oyun açılır */
    }
    window.location.href = `/?ozel=${m.code}`
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="tablist" aria-label={t('Sırala')}>
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={sort === k} onClick={() => setSort(k)} className={`pixel-btn justify-center px-1 py-2 text-[13px] sm:text-sm ${sort === k ? 'primary' : ''}`}>
            {t(label)}
          </button>
        ))}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={QUERY_MAX}
        placeholder={t('Haritada ara (başlık ya da yazar)')}
        aria-label={t('Haritada Ara')}
        className="w-full border-2 border-line bg-ink px-3 py-2 text-[15px] text-cream placeholder:text-muted"
      />
      {notice && (
        <p role="status" className="text-[14px] text-accent-2">
          {notice}
        </p>
      )}
      {!loading && maps.length === 0 && sort === 'benim' && signedIn === false ? (
        <div className="pixel-panel grid justify-items-start gap-3 p-5">
          <p className="font-display text-2xl text-cream">{t('Giriş Yapman Gerek')}</p>
          <p className="text-[15px] text-muted">{t('Kendi haritalarını görmek için oyunda hesabınla gir.')}</p>
          <Link href="/" className="pixel-btn primary py-2 text-sm">
            {t('Oyuna Git')}
          </Link>
        </div>
      ) : !loading && maps.length === 0 && (q || sort === 'benim') ? (
        <div className="pixel-panel grid justify-items-start gap-3 p-5">
          <p className="font-display text-2xl text-cream">{q ? t('Eşleşen Harita Yok') : t('Henüz Haritan Yok')}</p>
          <p className="text-[15px] text-muted">{q ? t('Başka bir söz dene ya da aramayı temizle.') : t('Düzenleyicide bir yol çiz, çözücüyle sına ve yayınla.')}</p>
          <Link href="/duzenle" className="pixel-btn primary py-2 text-sm">
            {t('Harita Çiz')}
          </Link>
        </div>
      ) : !loading && maps.length === 0 ? (
        <div className="pixel-panel grid justify-items-start gap-3 p-5">
          <p className="font-display text-2xl text-cream">{t('Henüz Harita Yok')}</p>
          <p className="text-[15px] text-muted">{t('Düzenleyicide bir yol çiz, çözücüyle sına ve ilk haritayı sen yayınla.')}</p>
          <Link href="/duzenle" className="pixel-btn primary py-2 text-sm">
            {t('Harita Çiz')}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
          {maps.map((m) => (
            <Card key={m.id} m={m} onLike={like} onPlay={play} onDelete={remove} />
          ))}
        </ul>
      )}
      {loading && <p className="text-[14px] text-muted">{t('Yükleniyor…')}</p>}
      {hasMore && !loading && (
        <button type="button" className="pixel-btn justify-self-center" onClick={() => void load(sort, page + 1, q)}>
          {t('Daha Fazla')}
        </button>
      )}
    </div>
  )
}

export default function MapGallery() {
  const [lang, setLang] = useState<Lang>('tr')
  return (
    <LangProvider value={lang}>
      <Body setLang={setLang} />
    </LangProvider>
  )
}
