'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CITY } from '@/game/art'
import { LEVELS } from '@/game/levels'
import type { CityKey } from '@/game/types'
import type { CommunityMap, MapSort } from '@/lib/communityMaps'
import { decodeMap } from '@/lib/customLevel'
import MapThumb from '@/components/MapThumb'
import { LangProvider, useLang, useT, type Lang } from '@/lib/i18n'

/**
 * Topluluk Haritaları galerisi (/haritalar): yolcuların düzenleyicide çizip yayınladığı haritalar. Kartta haritanın
 * küçük önizlemesi, yazar, şehir teması, beğeni ve oynanma. "Oyna" sayacı artırıp oyuna `?ozel=<kod>` ile geçer.
 */

const TABS: Array<[MapSort, string]> = [
  ['yeni', 'Yeni'],
  ['begeni', 'En Beğenilen'],
  ['oynanan', 'En Çok Oynanan'],
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

function Card({ m, onLike, onPlay }: { m: CommunityMap; onLike: (m: CommunityMap) => void; onPlay: (m: CommunityMap) => void }) {
  const t = useT()
  const lang = useLang()
  const date = new Date(m.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short' })
  return (
    <li className="pixel-panel no-kilim flex min-w-0 flex-col gap-3 p-3">
      <div className="h-20 overflow-hidden border-2 border-line bg-ink">
        <Thumb code={m.code} city={m.city} />
      </div>
      <div className="min-w-0">
        <h2 className="truncate font-display text-xl leading-tight text-cream" title={m.title}>
          {m.title}
        </h2>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          <Link href={`/oyuncu/${encodeURIComponent(m.author)}`} className="text-accent-2 hover:text-cream">
            {m.author}
          </Link>
          {' · '}
          {cityName(m.city)} · {date} ·{' '}
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
        <Link href={`/duzenle?kod=${m.code}`} className="ml-auto whitespace-nowrap text-[13px] text-muted underline decoration-line underline-offset-4 hover:text-cream">
          {t('Düzenleyicide Aç')}
        </Link>
      </div>
    </li>
  )
}

function Body({ setLang }: { setLang: (l: Lang) => void }) {
  const t = useT()
  const [sort, setSort] = useState<MapSort>('yeni')
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

  const load = useCallback(async (s: MapSort, p: number) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/maps?sort=${s}&page=${p}`, { cache: 'no-store' })
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
    void load(sort, 0)
  }, [sort, load])

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
      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label={t('Sırala')}>
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={sort === k} onClick={() => setSort(k)} className={`pixel-btn justify-center px-1 py-2 text-[13px] sm:text-sm ${sort === k ? 'primary' : ''}`}>
            {t(label)}
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="text-[14px] text-accent-2">
          {notice}
        </p>
      )}
      {!loading && maps.length === 0 ? (
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
            <Card key={m.id} m={m} onLike={like} onPlay={play} />
          ))}
        </ul>
      )}
      {loading && <p className="text-[14px] text-muted">{t('Yükleniyor…')}</p>}
      {hasMore && !loading && (
        <button type="button" className="pixel-btn justify-self-center" onClick={() => void load(sort, page + 1)}>
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
