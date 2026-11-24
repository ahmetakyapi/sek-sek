'use client'

import { useEffect, useState } from 'react'
import Portrait from '@/components/Portrait'
import AuthForm from '@/components/AuthForm'
import { ItemIcon } from '@/components/HudBits'
import { Board } from '@/components/ScoreBoard'
import { CountUp } from '@/components/CountUp'
import { MedalBadge, SectionTitle, Overlay, displayName, ic, medalFor, type Medal } from '@/components/ui'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import type { CharacterId } from '@/game/characters'
import type { GhostRun } from '@/game/ghost'
import type { LevelDef } from '@/game/types'
import { localize, useLang, useT } from '@/lib/i18n'
import { POINTS, runPoints } from '@/lib/points'
import { shareQuery } from '@/lib/share'
import { uploadGhost } from '@/lib/cloud'
import { scarfFor } from '@/lib/extras'
import { formatTime, kitOf, scarfIdOf, type Player, type Save } from '@/lib/storage'

/** Şehir koşusunun sonucu: bölüm sonu ekranı bunu gösterir, skoru bununla gönderir */
export interface RunResult {
  timeMs: number
  deaths: number
  items: boolean[]
  newBest: boolean
  /** Rahat Mod'da bitirildi: skor tabloya yazılmaz */
  relaxed: boolean
  /** bu koşuyla tamamlanan görevler (Günün Şehri, Haftanın Görevi) */
  earned: string[]
  /** yeni rekorun hayaleti: skor tabloya yazılınca sunucuya da gider (skor tablosundan "Hayaletiyle Yarış") */
  ghost?: GhostRun
  /** skor tablosundan seçilen bir yolcunun hayaletine karşı koşuldu */
  rival?: { name: string; timeMs: number; beaten: boolean }
  /** speedrun %100: bu koşuda şehrin her şeyi alındı (best: %100 rekoru tazelendi) */
  full?: { best: boolean; prev?: number }
}

type Tab = 'kosu' | 'skor' | 'paylas'

/**
 * Bölüm sonu. Üstte sonuç şeridi (şehir, süre, mühür, düşüş, hatıra, puan); altında "Bu Koşu" (puan dökümü, madalya
 * çizgisi, defter), "Sıralama" ve "Paylaş". Geniş ekranda Bu Koşu solda hep açık, sağda Sıralama / Paylaş sekmeli;
 * telefonda üçü sekme; yatay telefonda sekmeler ve eylemler solda, içerik sağda. Eylem çubuğu her boyutta görünür.
 */
export function LevelComplete({
  levelIdx,
  result,
  save,
  heroName,
  heroId,
  onPlayer,
  onNext,
  nextIdx,
  onRetry,
  onMap,
}: {
  levelIdx: number
  result: RunResult
  save: Save
  heroName: string
  heroId: CharacterId
  onPlayer: (p: Player | null) => void
  onNext: () => void
  /** Sıradaki düğmesinin şehri (null: defterin sonu) */
  nextIdx: number | null
  onRetry: () => void
  onMap: () => void
}) {
  const t = useT()
  const lng = useLang()
  const level = localize(LEVELS[levelIdx], lng)
  const player = save.player
  const name = player?.name ?? heroName
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr] = useState('')
  const [rank, setRank] = useState<number | null>(null)
  const [sent, setSent] = useState<{ first: boolean; better: { time: boolean; deaths: boolean; items: boolean }; bestMs: number; total: number } | null>(null)
  const [refresh, setRefresh] = useState(0)
  const found = result.items.filter(Boolean).length
  const best = save.best[level.id]
  const medal = medalFor(level, result.timeMs)
  const points = runPoints(level.medals[0], result.timeMs, result.deaths, found)
  // şehrin defteri: üç hatıra + gizli pul + nazar boncuğu. Bölümü geçmek ile defteri tamamlamak ayrı şeylerdir
  const pieces = [0, 1, 2].filter((i) => result.items[i] || best?.items[i]).length + (save.stamps[level.id] ? 1 : 0) + (save.charms[level.id] ? 1 : 0)
  const [authOpen, setAuthOpen] = useState(false)
  // telefonda üç bölüm sekme; geniş ekranda Bu Koşu hep açık, sağ sütun Sıralama ya da Paylaş
  const [tab, setTab] = useState<Tab>('kosu')
  const fmt = (n: number) => Math.round(n).toLocaleString(lng === 'en' ? 'en-US' : 'tr-TR')

  const query = shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: scarfIdOf(save, heroId), lang: lng })
  const shareUrl = () => `${location.origin}/skor?${query}`
  const shareText = t('Sek-Sek’te {city} şehrini {time} sürede geçtim ({deaths} düşüş, {found}/3 hatıra). Sen de dene!', { city: level.name, time: formatTime(result.timeMs), deaths: result.deaths, found })
  const share = async () => {
    const url = shareUrl()
    if (navigator.share) {
      try {
        await navigator.share({ title: t('Sek-Sek skor kartım'), text: shareText, url })
        return
      } catch {
        /* vazgeçildi */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`, '_blank', 'noopener')
  }

  const submit = async (p: Player) => {
    setStatus('sending')
    try {
      // ağ hatası, sunucu (5xx) ya da hız sınırı (429): bekleyip yeniden dener; skor kaybolmasın
      const send = () =>
        fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: level.id, playerId: p.id, token: p.token, timeMs: result.timeMs, deaths: result.deaths, items: found }),
        })
      let res: Response | null = null
      for (let k = 0; k < 4; k++) {
        res = await send().catch(() => null)
        if (res && res.status !== 429 && res.status < 500) break
        const after = Number(res?.headers.get('Retry-After') ?? 0)
        await new Promise((r) => setTimeout(r, Math.min(30, Math.max(after, [2, 5, 12, 25][k])) * 1000))
      }
      if (!res) throw new Error(t('Bağlantı yok: skor gönderilemedi. Tekrar Dene’ye bas.'))
      const j = (await res.json()) as { error?: string; rank?: number; total?: number; first?: boolean; bestMs?: number; better?: { time: boolean; deaths: boolean; items: boolean } }
      if (res.status === 401) {
        // oturum artık geçerli değil (hesap silinmiş ya da çıkış yapılmış): yeniden giriş istenir
        setStatus('idle')
        onPlayer(null)
        return
      }
      if (!res.ok) throw new Error(j.error ?? t('Gönderilemedi'))
      setRank(j.rank ?? null)
      setSent({ first: !!j.first, better: j.better ?? { time: true, deaths: false, items: false }, bestMs: j.bestMs ?? result.timeMs, total: j.total ?? 0 })
      // yeni rekor tablodaysa hayaleti de sunucuya: öteki yolcular onunla yarışabilsin
      if (result.ghost && (j.first || j.better?.time)) void uploadGhost(p, level.id, result.timeMs, result.ghost)
      // %100 koşusu kendi tablosuna da (speedrun); hata sessiz: asıl skor yazıldı
      if (result.full) void fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 'yuzde', city: level.id, playerId: p.id, token: p.token, timeMs: result.timeMs, deaths: result.deaths, items: 3 }) }).catch(() => {})
      setStatus('sent')
      setRefresh((r) => r + 1)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('Gönderilemedi'))
      setStatus('error')
    }
  }

  // ad varsa skor kendiliğinden kaydedilir
  useEffect(() => {
    if (player && status === 'idle' && !result.relaxed) void submit(player)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  // görevler, hayalet yarışı ve %100: sonuç şeridinin altında kısa çipler (yatay telefonda Bu Koşu'nun başında)
  const extras =
    result.earned.length > 0 || result.rival || result.full ? (
      <>
        {result.earned.map((e) => (
          <span key={e} className="border-2 border-gold/80 bg-gold/10 px-2.5 py-1 text-[13px] font-bold text-gold">
            ★ {t(e)}
          </span>
        ))}
        {result.rival && (
          <span className={`border-2 px-2.5 py-1 text-[13px] font-semibold ${result.rival.beaten ? 'border-gold/80 bg-gold/10 text-gold' : 'border-line bg-ink/40 text-muted'}`}>
            ◌ {result.rival.beaten ? t('{name} hayaletini {d} farkla geçtin', { name: result.rival.name, d: formatTime(result.rival.timeMs - result.timeMs) }) : t('{name} hayaleti {d} önde bitirdi', { name: result.rival.name, d: formatTime(result.timeMs - result.rival.timeMs) })}
          </span>
        )}
        {result.full && (
          <span className="border-2 border-gold/80 bg-gold/10 px-2.5 py-1 text-[13px] font-semibold text-gold">
            ✦ {result.full.best ? (result.full.prev === undefined ? t('%100 koşu: her şey tek seferde!') : t('Yeni %100 rekoru ({d} daha hızlı)', { d: formatTime(result.full.prev - result.timeMs) })) : t('%100 koşu · rekorun {time}', { time: formatTime(result.full.prev ?? result.timeMs) })}
          </span>
        )}
      </>
    ) : null

  const tabs: [Tab, string][] = [
    ['kosu', t('Bu Koşu')],
    ['skor', t('Sıralama')],
    ['paylas', t('Paylaş')],
  ]
  /** sekmeler arasında ←/→ (tablist): odak ve seçim birlikte geçer */
  const tabKeys = (list: Tab[]) => (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const cur = Math.max(0, list.indexOf(tab))
    const next = list[(cur + d + list.length) % list.length]
    setTab(next)
    ;(e.currentTarget.querySelector(`[data-tab="${next}"]`) as HTMLElement | null)?.focus()
  }
  const tabBtn = (k: Tab, label: string, on: boolean) => (
    <button key={k} role="tab" data-tab={k} aria-selected={on} tabIndex={on ? 0 : -1} className={`lc-tab ${on ? 'on' : ''}`} onClick={() => setTab(k)}>
      {label}
    </button>
  )
  // geniş ekranda sağ sütun: Bu Koşu solda açıkken seçili sağ sekme Sıralama sayılır
  const right: Tab = tab === 'kosu' ? 'skor' : tab

  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col overflow-clip px-6 wide:max-w-[1160px] short:grid short:h-[calc(100dvh-32px)] short:max-w-[min(1100px,100%)] short:grid-cols-[minmax(0,250px)_minmax(0,1fr)] short:grid-rows-[auto_minmax(0,1fr)_auto] short:gap-x-4 short:px-4 short:pb-3">
        {/* ── sonuç şeridi: şehrin görseli soluk zeminde; ilk bakışta "ne yaptım" */}
        <header className="lc-hero relative -mx-6 -mt-[calc(14px+1.25rem)] shrink-0 overflow-hidden px-6 pb-4 pt-[calc(10px+1.1rem)] max-sm:pb-3 short:col-span-2 short:-mx-4 short:px-4 short:pb-2 short:pt-[calc(10px+0.5rem)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/sehirler/${level.id}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" style={{ imageRendering: 'pixelated', objectPosition: '50% 70%' }} />
          <div className="lc-hero-fade absolute inset-0" />
          <div className="kilim absolute inset-x-0 top-0" />
          <div className="relative flex items-center gap-4 short:gap-3">
            <figure className="polaroid relative w-[78px] shrink-0 rotate-[-4deg] max-sm:hidden short:hidden wide:[@media(max-height:760px)]:hidden">
              <span className="tape" />
              <Portrait id={heroId} scarf={scarfFor(scarfIdOf(save, heroId)).id === 'al' ? null : scarfFor(scarfIdOf(save, heroId))} accessory={kitOf(save, heroId)} className="w-full" />
              <figcaption className="!text-[13px]">{heroName}</figcaption>
            </figure>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2.5 [text-shadow:0_1px_0_#0e0d22]">
                <span className="font-display text-[26px] leading-none text-cream short:text-[20px]">{level.name}</span>
                <span className="text-[14px] font-semibold text-accent-2">{pieces === 5 ? t('Eksiksiz Tamamlandı') : t('Geçildi')}</span>
                {result.newBest ? (
                  <span className="lc-record self-center px-2 py-0.5 text-[13px] font-bold [text-shadow:none]">
                    <span className="shine-text">★ {t('Yeni Rekor')}</span>
                  </span>
                ) : best && !best.stale ? (
                  <span className="text-[13px] text-muted">{t('Rekorun {time}', { time: formatTime(best.timeMs) })}</span>
                ) : null}
              </p>
              {/* süre sayarak yerine oturur, mühür sayım biterken basılır */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2.5 short:mt-1">
                <p className="font-display text-6xl leading-none tabular-nums text-cream [text-shadow:0_3px_0_#0e0d22] max-sm:text-5xl short:!text-[34px]">
                  <CountUp to={result.timeMs} ms={850} delay={250} format={(v) => formatTime(Math.round(v))} />
                </p>
                {extras && <div className="flex min-w-0 flex-wrap gap-2 short:hidden">{extras}</div>}
              </div>
            </div>
            {/* düşüş, hatıra, puan: geniş ekranda sürenin sağında, telefonda altında */}
            <dl className="lc-stats hidden sm:grid short:grid">
              <div>
                <dd className={result.deaths ? 'text-cream' : 'text-teal'}>{result.deaths}</dd>
                <dt>{t('Düşüş')}</dt>
              </div>
              <div>
                <dd>
                  {found}
                  <small>/3</small>
                </dd>
                <dt className="truncate">{level.item}</dt>
              </div>
              <div>
                <dd className="text-gold">
                  <CountUp to={points.total} ms={1000} delay={700} format={fmt} />
                </dd>
                <dt>{t('Puan')}</dt>
              </div>
            </dl>
            <div className="seal-slam shrink-0 max-sm:-my-2 max-sm:origin-right max-sm:scale-[0.8] short:-my-3 short:scale-[0.62]">
              <Seal medal={medal} bronze={level.medals[2]} />
            </div>
          </div>
          <dl className="lc-stats relative mt-2.5 grid sm:hidden short:hidden">
            <div>
              <dd className={result.deaths ? 'text-cream' : 'text-teal'}>{result.deaths}</dd>
              <dt>{t('Düşüş')}</dt>
            </div>
            <div>
              <dd>
                {found}
                <small>/3</small>
              </dd>
              <dt className="truncate">{level.item}</dt>
            </div>
            <div>
              <dd className="text-gold">
                <CountUp to={points.total} ms={1000} delay={700} format={fmt} />
              </dd>
              <dt>{t('Puan')}</dt>
            </div>
          </dl>
        </header>

        {/* telefonda üç sekme; yatay telefonda solda alt alta */}
        <div className="lc-tabs mt-3 shrink-0 wide:hidden short:col-start-1 short:row-start-2 short:mt-2 short:self-start" role="tablist" aria-label={t('Bölüm Sonu')} onKeyDown={tabKeys(['kosu', 'skor', 'paylas'])}>
          {tabs.map(([k, label]) => tabBtn(k, label, tab === k))}
        </div>

        {/* ── içerik: geniş ekranda iki eşit sütun (aynı yerde biter), telefonda seçili sekme */}
        <div className="mt-3 min-h-0 flex-1 short:col-start-2 short:row-span-2 short:row-start-2 short:mt-2 wide:mt-4 wide:grid wide:grid-cols-2 wide:gap-5">
          <section className={`lc-card overlay-scroll h-full min-h-0 overflow-y-auto ${tab === 'kosu' ? 'flex' : 'hidden'} flex-col wide:flex`} aria-label={t('Bu Koşu')}>
            {extras && <div className="mb-3 hidden flex-wrap gap-2 short:flex">{extras}</div>}
            <RunPoints points={points} found={found} fmt={fmt} />
            <MedalLine level={level} timeMs={result.timeMs} medal={medal} />
            {save.bosses[level.id] && <p className="mt-2 text-[13px] leading-snug text-muted">{t('Boss yenildi: {boss}.', { boss: lng === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name })}</p>}
            <NotebookStrip level={level} result={result} save={save} pieces={pieces} />
          </section>

          <section className="lc-card contents wide:flex wide:h-full wide:min-h-0 wide:flex-col">
            <div className="lc-tabs mb-3 hidden shrink-0 wide:grid wide:grid-cols-2" role="tablist" aria-label={t('Sıralama ve Paylaşım')} onKeyDown={tabKeys(['skor', 'paylas'])}>
              {tabs.slice(1).map(([k, label]) => tabBtn(k, label, right === k))}
            </div>
            <div className={`overlay-scroll lc-pane h-full min-h-0 overflow-y-auto ${tab === 'skor' ? 'block' : 'hidden'} ${right === 'skor' ? 'wide:block' : 'wide:hidden'}`}>
              <Ranking
                level={level}
                relaxed={result.relaxed}
                player={player}
                heroName={heroName}
                name={name}
                authOpen={authOpen}
                onAuth={() => setAuthOpen(true)}
                onPlayer={onPlayer}
                status={status}
                err={err}
                onRetry={() => player && void submit(player)}
                sent={sent}
                rank={rank}
                fallbackMs={result.timeMs}
                refresh={refresh}
              />
            </div>
            <div className={`overlay-scroll lc-pane h-full min-h-0 overflow-y-auto ${tab === 'paylas' ? 'block' : 'hidden'} ${right === 'paylas' ? 'wide:block' : 'wide:hidden'}`}>
              <SharePane level={level} query={query} shareText={shareText} shareUrl={shareUrl} onShare={share} player={player} />
            </div>
          </section>
        </div>

        {/* ── sabit eylem çubuğu: her boyutta görünür */}
        <div className="z-10 -mx-6 mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] gap-2.5 border-t-2 border-line bg-panel/95 px-6 py-3 [padding-bottom:max(12px,env(safe-area-inset-bottom))] wide:mt-4 short:col-start-1 short:row-start-3 short:mx-0 short:mt-2 short:grid-cols-2 short:gap-2 short:self-end short:border-0 short:bg-transparent short:p-0">
          <button className="pixel-btn primary cta min-w-0 justify-center py-3 text-[17px] max-sm:px-3 max-sm:text-[15px] short:col-span-2 short:py-2 short:text-[15px]" onClick={onNext} autoFocus>
            <span className="truncate">{ic(nextIdx !== null ? t('▶ Sıradaki: {city}', { city: displayName(LEVELS[nextIdx]) }) : t('▶ Defteri Kapat'))}</span>
          </button>
          {/* telefonda yalnız simge (ad erişilebilirlik etiketinde) */}
          <button className="pixel-btn justify-center max-sm:px-3.5 short:py-2" onClick={onRetry} aria-label={t('↺ Tekrar')}>
            <span className="max-sm:hidden short:inline">{ic(t('↺ Tekrar'))}</span>
            <span className="text-[18px] leading-none sm:hidden short:hidden" aria-hidden>
              ↺
            </span>
          </button>
          <button className="pixel-btn justify-center max-sm:px-3 short:py-2" onClick={onMap}>
            {t('Şehirler')}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Puan dökümü: süre, hatıra, düşüş ve temiz koşu (lib/points.ts; sunucu aynısını hesaplar) */
function RunPoints({ points, found, fmt }: { points: ReturnType<typeof runPoints>; found: number; fmt: (n: number) => string }) {
  const t = useT()
  const parts: [string, number][] = [
    [t('Süre'), points.time],
    [t('Hatıra'), points.items],
    [t('Düşüş'), points.deaths],
    [t('Temiz Koşu'), points.clean],
  ]
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle title={t('Puan')} note={t('Sıralamada “Puan” süzgeci')} tone="var(--color-accent-2)" />
        <span className="shrink-0 font-display text-[17px] tabular-nums text-gold">{fmt(points.total)}</span>
      </div>
      <dl className="stagger mt-2 grid grid-cols-4 gap-[2px] overflow-hidden rounded-[3px] border-2 border-line bg-line/70 text-center">
        {parts.map(([k, v]) => (
          <div key={k} className="min-w-0 bg-panel px-1 py-2">
            <dd className={`font-display text-[17px] leading-none tabular-nums ${v < 0 ? 'text-coral' : v > 0 ? 'text-cream' : 'text-cream/50'}`}>{v > 0 ? `+${v}` : v}</dd>
            <dt className="mt-1 truncate text-[12px] text-muted">{k}</dt>
          </div>
        ))}
      </dl>
      {found < 3 && <p className="mt-1.5 text-[13px] leading-snug text-muted">{t('Kalan {n} hatıra {p} puan daha getirir.', { n: 3 - found, p: (3 - found) * POINTS.item })}</p>}
    </div>
  )
}

/** Madalya çizgisi: 0'dan bronzun biraz ötesine; üç madalyanın işareti ve bu koşunun süresi, altında süreler */
function MedalLine({ level, timeMs, medal }: { level: LevelDef; timeMs: number; medal: Medal | null }) {
  const t = useT()
  const lng = useLang()
  const s = timeMs / 1000
  const max = Math.max(level.medals[2] * 1.15, s * 1.04)
  const at = (sec: number) => `${Math.min(100, (sec / max) * 100).toFixed(1)}%`
  // sıradaki hedef: alınan madalyanın bir üstü
  const got = ([0, 1, 2] as const).find((k) => s <= level.medals[k]) ?? 3
  const goal = got === 0 ? null : level.medals[got - 1]
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle title={t('Madalya')} tone="var(--color-gold)" />
        <span className={`shrink-0 text-[13px] tabular-nums ${medal === 'altin' ? 'font-semibold text-gold' : 'text-muted'}`}>
          {medal === 'altin' ? t('Altın senin: şimdi sıralamaya oyna.') : goal !== null ? t('Sıradaki madalyaya {s} sn', { s: lng === 'en' ? (s - goal).toFixed(1) : (s - goal).toFixed(1).replace('.', ',') }) : null}
        </span>
      </div>
      <div className="relative mx-2 mt-4" aria-label={t('Madalya Çizgisi')}>
        <div className="medal-track relative h-2 rounded-full">
          {(['altin', 'gumus', 'bronz'] as const).map((k, i) => (
            <span key={k} className={`medal-tick ${k}`} style={{ left: at(level.medals[i]) }} aria-hidden />
          ))}
          <span className="medal-me" style={{ left: at(s) }} aria-hidden />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(['altin', 'gumus', 'bronz'] as const).map((m, k) => {
          const ok = timeMs <= level.medals[k] * 1000
          return (
            <div key={m} className={`rounded-[3px] border-2 px-1 py-1.5 ${ok ? 'border-gold/70 bg-gold/10' : 'border-line bg-ink/40'}`}>
              <p className="flex items-center justify-center gap-1.5 font-display text-[16px] leading-none tabular-nums text-cream">
                <MedalBadge medal={m} />
                {level.medals[k]}
                <span className="text-[12px] text-muted">{t('sn')}</span>
              </p>
              <p className={`mt-1 text-[12px] ${ok ? 'text-gold' : 'text-muted'}`}>{ic(ok ? t('✓ Alındı') : t('{s} sn kaldı', { s: Math.ceil((timeMs - level.medals[k] * 1000) / 1000) }))}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Piece = { key: string; title: string; text: string; state: 'now' | 'have' | 'none'; kind: 'item' | 'stamp' | 'charm' }

/**
 * Defter ilerlemesi tek satırda: üç hatıra + gizli pul + nazar boncuğu simgeleri; seçilen parçanın bilgisi altta kısa
 * bir kutuda (uzun metinler ekranı doldurmasın). Varsayılan seçim bu koşuda bulunan ilk hatıra.
 */
function NotebookStrip({ level, result, save, pieces }: { level: LevelDef; result: RunResult; save: Save; pieces: number }) {
  const t = useT()
  const best = save.best[level.id]
  const stamp = !!save.stamps?.[level.id]
  const charm = !!save.charms?.[level.id]
  const list: Piece[] = [
    ...level.facts.map((f, i): Piece => {
      const now = result.items[i]
      const have = now || best?.items[i]
      return { key: `i${i}`, kind: 'item', state: now ? 'now' : have ? 'have' : 'none', title: have ? f.title : t('Saklı {item}', { item: level.item }), text: have ? f.text : t('Saklı hatıraların yerini tabelalar ve şehir insanları anlatır.') }
    }),
    { key: 'pul', kind: 'stamp', state: stamp ? 'have' : 'none', title: stamp ? level.secret.title : t('Gizli Pul'), text: stamp ? level.secret.text : t('Kayadaki karanlık ağızlara, çatlak zeminlere ve zor ulaşılan köşelere bak.') },
    { key: 'nazar', kind: 'charm', state: charm ? 'have' : 'none', title: t('Nazar Boncuğu'), text: charm ? t('Meydan yolunda saklıydı.') : t('Meydan yolunda saklı: kapıdan geçince etrafına iyi bak.') },
  ]
  const first = list.find((p) => p.state === 'now') ?? list.find((p) => p.state === 'have') ?? list[0]
  const [pick, setPick] = useState(first.key)
  const sel = list.find((p) => p.key === pick) ?? first
  const badge = (p: Piece) => (p.state === 'now' ? t('Bu Koşuda') : p.state === 'none' ? t('Saklı') : p.kind === 'stamp' ? t('Gizli Sayfa') : p.kind === 'charm' ? t('Bulundu') : t('Defterde'))
  return (
    <div className="mt-5 wide:mt-auto wide:pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <SectionTitle title={t('Defter')} note={t('Bu şehrin sayfaları')} tone="var(--color-gold)" />
        <span className="shrink-0 font-display text-[17px] tabular-nums text-cream">{pieces}/5</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2" role="tablist" aria-label={t('Defter')}>
        {list.map((p) => (
          <button key={p.key} role="tab" aria-selected={p.key === sel.key} title={p.title} className={`lc-piece ${p.state} ${p.key === sel.key ? 'on' : ''}`} onClick={() => setPick(p.key)}>
            {p.kind === 'item' ? (
              <>
                <ItemIcon city={level.city} taken={p.state !== 'none'} size={p.state === 'none' ? 22 : 28} />
                {p.state === 'none' && <span className="absolute inset-0 flex items-center justify-center font-display text-lg text-muted">?</span>}
              </>
            ) : p.kind === 'stamp' ? (
              <span className={`font-display text-xl ${p.state === 'none' ? 'text-muted' : 'text-gold'}`}>✦</span>
            ) : (
              <span aria-hidden className={`block h-6 w-6 rounded-full ${p.state === 'none' ? 'bg-line' : 'bg-[radial-gradient(circle,#0b1a3a_0_18%,#f3f1ff_19%_38%,#4ab0e8_39%_70%,#1d5fae_71%)]'}`} />
            )}
            {p.state === 'now' && <span className="lc-new" aria-hidden />}
          </button>
        ))}
      </div>
      <div className={`lc-fact mt-2.5 ${sel.state}`} role="tabpanel">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={`font-display text-[15px] leading-tight ${sel.state === 'none' ? 'text-muted' : 'text-cream'}`}>{sel.title}</span>
          <span className={`rounded-sm px-1.5 py-px text-[12px] font-bold ${sel.state === 'now' ? 'bg-[#2f7a3a] text-white' : sel.state === 'have' ? 'bg-gold/15 text-gold' : 'bg-ink/60 text-muted'}`}>{badge(sel)}</span>
        </p>
        <p className={`mt-1 line-clamp-3 text-[14px] leading-snug ${sel.state === 'none' ? 'text-muted' : 'text-cream/85'}`} title={sel.text}>
          {sel.text}
        </p>
      </div>
    </div>
  )
}

/** Sıralama: skorun gönderim durumu ve şehrin tablosu (giriş yoksa istenince açılan hesap formu) */
function Ranking({
  level,
  relaxed,
  player,
  heroName,
  name,
  authOpen,
  onAuth,
  onPlayer,
  status,
  err,
  onRetry,
  sent,
  rank,
  fallbackMs,
  refresh,
}: {
  level: LevelDef
  relaxed: boolean
  player: Player | null | undefined
  heroName: string
  name: string
  authOpen: boolean
  onAuth: () => void
  onPlayer: (p: Player | null) => void
  status: 'idle' | 'sending' | 'sent' | 'error'
  err: string
  onRetry: () => void
  sent: { first: boolean; better: { time: boolean; deaths: boolean; items: boolean }; bestMs: number; total: number } | null
  rank: number | null
  fallbackMs: number
  refresh: number
}) {
  const t = useT()
  return (
    <div>
      {relaxed ? (
        <p className="text-[14px] leading-snug text-muted">{t('Rahat Mod’da oynadın: bu skor tabloya yazılmadı. Ayarlardan kapatıp yarışabilirsin.')}</p>
      ) : !player ? (
        <div>
          {/* hesap formu istenince açılır: bölüm sonu sonuçla dolsun, form kalabalığıyla değil */}
          {authOpen ? (
            <AuthForm suggestion={heroName} autoFocus onDone={(p) => onPlayer(p)} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-dashed border-line px-3 py-2.5">
              <span className="text-[14px] leading-snug text-cream/85">{t('Süren tabloya yazılsın mı?')}</span>
              <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={onAuth}>
                {t('Giriş Yap ya da Üye Ol')}
              </button>
            </div>
          )}
        </div>
      ) : status === 'sending' ? (
        <p className="text-[14px] text-muted">{t('Skorun kaydediliyor…')}</p>
      ) : status === 'error' ? (
        <p className="text-[14px] text-accent-2">
          {err}{' '}
          <button className="underline" onClick={onRetry}>
            {t('Tekrar Dene')}
          </button>
        </p>
      ) : status === 'sent' ? (
        <div className="text-[14px] leading-snug">
          <p className="text-gold">
            {sent?.first
              ? t('{name}, ilk skorun tabloya yazıldı.', { name })
              : sent?.better.time
                ? t('{name}, yeni en iyi süren tabloda.', { name })
                : t('{name}, tablodaki en iyi süren {time} olarak kaldı.', { name, time: formatTime(sent?.bestMs ?? fallbackMs) })}{' '}
            {rank ? <strong>{sent?.total ? t('Sıralaman: {rank} / {total}', { rank, total: sent.total }) : t('Sıralaman: {rank}.', { rank })}</strong> : null}
          </p>
          {sent && !sent.first && (sent.better.deaths || sent.better.items) && (
            <p className="mt-0.5 text-[13px] text-[#7ad88a]">
              {sent.better.deaths && sent.better.items ? t('En az düşüş ve en çok hatıra rekorların da tazelendi.') : sent.better.deaths ? t('En az düşüş rekorun tazelendi.') : t('En çok hatıra rekorun tazelendi.')}
            </p>
          )}
        </div>
      ) : null}
      <Board kind="city" level={level.id} refresh={refresh} me={player?.name ?? ''} compact />
    </div>
  )
}

/** Paylaş: kartpostal görseli, tek büyük "Paylaş" ve küçük ikincil yollar */
function SharePane({ level, query, shareText, shareUrl, onShare, player }: { level: LevelDef; query: string; shareText: string; shareUrl: () => string; onShare: () => void; player: Player | null | undefined }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  // hayaletimle yarışa çağıran bağlantı: açan, bu şehirde bu koşunun hayaletiyle yan yana koşar
  const [dared, setDared] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* izin yok */
    }
  }
  const copyDare = async () => {
    if (!player) return
    try {
      await navigator.clipboard.writeText(`${location.origin}/?yaris=${level.id}~${encodeURIComponent(player.name)}`)
      setDared(true)
      setTimeout(() => setDared(false), 2200)
    } catch {
      /* izin yok */
    }
  }
  return (
    <div className="flex flex-col">
      <SectionTitle title={t('Kartpostalın')} note={t('Paylaş, arkadaşını yarışa çağır')} tone="var(--color-accent-2)" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/skor/kart?${query}`}
        alt={t('{city} skor kartı', { city: level.name })}
        width={1200}
        height={630}
        loading="lazy"
        className="mx-auto mt-3 aspect-[40/21] h-auto w-full max-w-[520px] short:max-w-[340px] rotate-[-0.6deg] bg-ink/40 [box-shadow:0_0_0_3px_#37337a,0_10px_22px_rgba(0,0,0,0.45)]"
      />
      <button className="pixel-btn primary mx-auto mt-4 w-full max-w-[520px] short:max-w-[340px] justify-center py-2.5 text-[15px]" onClick={onShare}>
        {ic(t('↗ Paylaş'))}
      </button>
      <div className="mx-auto mt-2.5 grid w-full max-w-[520px] short:max-w-[340px] grid-cols-2 gap-2">
        <a className="lc-mini" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} onClick={(e) => { e.preventDefault(); window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl()}`)}`, '_blank', 'noopener') }}>
          WhatsApp
        </a>
        <button className="lc-mini" onClick={copy}>
          {copied ? t('Kopyalandı') : t('Bağlantıyı Kopyala')}
        </button>
        <a className="lc-mini" href={`/skor/kart?${query}`} download={`sek-sek-${level.id}.png`}>
          {t('Kartı İndir')}
        </a>
        {player ? (
          <button className="lc-mini" onClick={copyDare}>
            {ic(dared ? t('Kopyalandı: arkadaşına gönder') : t('⚔ Beni Geç Bağlantısı'))}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Seal({ medal, bronze }: { medal: Medal | null; bronze: number }) {
  const t = useT()
  const look = medal ? { altin: [t('ALTIN'), '#e3a92c', '#9a6a12', '#3a2408'], gumus: [t('GÜMÜŞ'), '#c9d0da', '#7c8696', '#232a36'], bronz: [t('BRONZ'), '#c97a44', '#7a4220', '#2a1408'] }[medal] : null
  if (!look)
    return (
      <div className="flex h-[76px] w-[76px] shrink-0 rotate-[-8deg] flex-col items-center justify-center rounded-full border-2 border-dashed border-line text-center text-[12px] leading-tight text-muted">
        {t('Bronz')}
        <br />
        {bronze} sn
      </div>
    )
  return (
    <div className="flex h-[84px] w-[84px] shrink-0 rotate-[-10deg] items-center justify-center rounded-full shadow-[0_5px_0_rgba(0,0,0,0.35)]" style={{ background: look[1], border: `5px solid ${look[2]}` }} title={`${look[0]} madalya`}>
      <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: look[2], color: look[3] }}>
        <span className="font-display text-[17px] leading-none">{look[0]}</span>
        <span className="mt-0.5 text-[12px] font-bold leading-none tracking-[0.02em]">{t('MADALYA')}</span>
      </div>
    </div>
  )
}
