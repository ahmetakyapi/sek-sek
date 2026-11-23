'use client'
import { ic } from '@/components/ui'

import { ItemIcon } from '@/components/HudBits'
import { HeroFigure } from '@/components/Figures'
import Portrait from '@/components/Portrait'
import { useTilt } from '@/components/useTilt'
import type { Kit } from '@/game/accessories'
import type { CharacterId } from '@/game/characters'
import { LEVELS } from '@/game/levels'
import type { CityKey, LevelDef } from '@/game/types'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getSync, subscribeSync } from '@/lib/cloud'
import { useLang, useT } from '@/lib/i18n'
import { NAME, type ModeId } from '@/lib/modeHints'
import { seenIntros } from '@/lib/recentCities'

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
/** 1–999 arası sayıyı yazıyla, ilk harf büyük: 45 → "Kırk beş", 105 → "Yüz beş" */
const trCount = (n: number) => {
  const h = Math.floor(n / 100)
  const r = n % 100
  const t = [h ? (h > 1 ? `${ONES[h]} yüz` : 'yüz') : '', TENS[Math.floor(r / 10)], ONES[r % 10]].filter(Boolean).join(' ')
  return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1)
}

/** 12×12 piksel simgeler: tek renk (currentColor), çift-tek dolgu ile delikli */
const ICONS = {
  map: 'M4 1h4v1h1v1h1v3H9v1H8v1H7v2H5V8H4V7H3V6H2V3h1V2h1zM5 3v2h2V3zM2 11h8v1H2z',
  book: 'M1 2h4v1h2V2h4v8H7v1H5v-1H1zM2 3v6h3V3zM7 3v6h3V3z',
  modes: 'M1 1h10v10H1zM2 2v8h8V2zM3 3h2v2H3zM5 5h2v2H5zM7 7h2v2H7z',
  trophy: 'M2 1h8v1h1v3h-1v1H9v1H7v2h2v1h1v1H2v-1h1V9h2V7H3V6H2V5H1V2h1zM4 2v3h1V2z',
  hero: 'M4 0h4v1h1v4H8v1H4V5H3V1h1zM3 7h6v1h1v4H2V8h1z',
  story: 'M2 1h8v2h-1v6h1v2H2V9h1V3H2zM4 4v1h4V4zM4 6v1h3V6z',
  gear: 'M4 0h4v2h1V1h2v2h-1v1h2v4h-2v1h1v2H9v-1H8v2H4v-2H3v1H1V9h1V8H0V4h2V3H1V1h2v1h1zM5 4v1H4v2h1v1h2V7h1V5H7V4z',
  music: 'M6 1h5v2H8v6H7v1H6v1H3v-1H2V8h1V7h3z',
  pencil: 'M8 1h2v1h1v2h-1v1H9v1H8v1H7v1H6v1H5v1H4v1H1V8h1V7h1V6h1V5h1V4h1V3h1V2h1zM2 9v1h1V9z',
} as const
type IconName = keyof typeof ICONS

function PxIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} shapeRendering="crispEdges" aria-hidden>
      <path d={ICONS[name]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}

export interface TitleDaily {
  level: LevelDef
  rule: string
  doneMs: string | null
  /** bugünün hakkı kullanıldı (başlandı, bitmedi de olabilir) */
  used: boolean
  streak: number
}

/**
 * Ana menü: solda yolculuğun kartpostalı (sıradaki şehir, 30 duraklık yol çizgisi, Devam Et), sağda menü.
 * Geniş ekranda ve yatay telefonda iki sütun, dikey telefonda tek sütun; her boyutta kaydırmadan sığar (audit-menus).
 */
export default function TitleMenu(props: {
  fresh: boolean
  resume: number
  character: CharacterId | null
  hero: { id: CharacterId; name: string }
  scarf: { color: string; shade: string } | null
  /** yolcunun Mağaza kombini (aksesuar + görünüm): fotoğraf ve hesap satırı onu giyer */
  kit?: Kit
  best: Record<string, unknown>
  found: number
  stamps: number
  charms: number
  daily: TitleDaily | null
  dailyPending: boolean
  /** bugünkü Günün Üçlüsü'nden biten parça sayısı (0-3) */
  trio: number
  /** Mağaza'da harcanabilir parça */
  wallet: number
  /** Modlar'ın "Sana Önerilen" ilk modu (günlük dışında); yoksa boş */
  modeHint?: ModeId
  music: boolean
  player: { name: string; title: string } | null
  hasProgress: boolean
  onStart: () => void
  /** yol çizgisinden seçilen (açık) şehre git */
  onCity: (index: number) => void
  /** açılan en ileri şehrin sırası */
  unlocked: number
  onScreen: (s: 'map' | 'notebook' | 'character' | 'modes' | 'story' | 'scores' | 'controls' | 'name' | 'about') => void
  onMusic: () => void
  langSwitch: React.ReactNode
}) {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  useMenuNav(root)
  const sync = useSyncExternalStore(subscribeSync, getSync, () => 'idle' as const)
  // Modlar ekranı yenilendi: açılana dek menüde "Yeni" yazar (yalnız bu tarayıcıda)
  const [modesNew, setModesNew] = useState(false)
  useEffect(() => setModesNew(!seenIntros().includes('hub-v2')), [])
  const lang = useLang()
  const total = LEVELS.length
  // yol çizgisinden seçilen durak (null: sıradaki); kartpostal ve düğme onu gösterir
  const [pick, setPick] = useState<number | null>(null)
  // yol çizgisinde üstüne gelinen durak (başlıkta adı görünür)
  const [peek, setPeek] = useState<number | null>(null)
  const tilt = useTilt()
  const shown = pick ?? props.resume
  const level = LEVELS[shown]
  const done = LEVELS.filter((l) => props.best[l.id]).length
  const started = !props.fresh && (props.hasProgress || props.resume > 0)
  // bütün şehirler bitti: sıradaki yok, oyuncu istediği şehirden oynar (yol çizgisinden ya da Şehirler'den seçer)
  const allDone = LEVELS.every((l) => props.best[l.id])
  const up = (s: string) => s.toLocaleUpperCase(lang === 'en' ? 'en' : 'tr')
  const plate = String(level.plate).padStart(2, '0')

  return (
    <div ref={root} className="rise relative w-full max-w-md md:max-w-[880px] short:max-w-[min(820px,100%)]">
      {/* karakterin fotoğrafı: panelin sol kenarına iliştirilmiş; yalnız yanında yeri olan ekranda (1220 px+, yoksa ekranın dışına taşar) */}
      <div className="pointer-events-none absolute -left-[150px] top-[46%] z-20 hidden w-[180px] -translate-y-1/2 [@media(min-width:1220px)]:block [@media(max-height:640px)]:!hidden">
        {props.character ? (
          <figure className="polaroid relative rotate-[-5deg]">
            <span className="tape" />
            <HeroFigure look={props.hero.id} scarf={props.scarf} kit={props.kit} className="block aspect-[64/76] w-full" />
            <figcaption>{props.hero.name}</figcaption>
          </figure>
        ) : (
          <>
            <figure className="polaroid relative w-[150px] rotate-[-7deg]">
              <span className="tape" />
              <Portrait id="uktun" className="w-full" />
              <figcaption>Uktun</figcaption>
            </figure>
            <figure className="polaroid relative -mt-10 ml-8 w-[150px] rotate-[5deg]">
              <span className="tape" />
              <Portrait id="memo" className="w-full" />
              <figcaption>Memo</figcaption>
            </figure>
          </>
        )}
      </div>

      <div className="title-panel pixel-panel relative z-10 grid gap-x-7 px-5 pb-5 sm:px-7 sm:pb-6 md:grid-cols-[1.08fr_1fr] md:px-8 md:pb-7 short:grid-cols-[1fr_1.05fr] short:gap-x-5 short:px-5 short:pb-4">
        {/* ── Sol: kartpostal ── */}
        <section className="flex min-w-0 flex-col" aria-label={t('Sıradaki Durak')}>
          <header className="mb-3 flex items-center gap-3 md:hidden short:mb-2 tight:mb-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-emblem.png" width={44} height={44} alt="" className="drop-shadow-[0_3px_0_#0e0d22] short:h-9 short:w-9" />
            <div className="min-w-0">
              <h1 className="font-display text-[34px] leading-none text-cream [text-shadow:0_3px_0_#0e0d22] short:text-[28px]">
                <HopTitle />
              </h1>
              <p className="truncate text-[13px] text-muted short:hidden tight:hidden">{t('Gezgin’in yarım kalmış defterini tamamla.')}</p>
            </div>
          </header>

          <div {...tilt} className="postcard tilt relative h-[150px] overflow-hidden tight:h-[124px] sm:h-[180px] md:h-auto md:min-h-[230px] md:flex-1 short:h-[106px] short:flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sehirler/${level.id}.webp`} alt="" className="postcard-drift absolute inset-0 h-full w-full object-cover object-[50%_62%]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(14_13_34/0.55)_0%,transparent_32%,transparent_48%,rgb(14_13_34/0.92)_100%)]" />
            <p className="absolute left-3 top-3 flex items-center gap-1.5 bg-ink/75 px-2 py-1 text-[12px] font-bold tracking-[0.16em] text-gold backdrop-blur-[2px]">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
              {up(allDone ? t('Serbest Gezi') : pick !== null ? (props.best[level.id] ? t('Geçilen Durak') : t('Açık Durak')) : started ? t('Sıradaki Durak') : t('İlk Durak'))}
            </p>
            <div className="stamp absolute right-3 top-3 rotate-[4deg] text-center text-[#12112c] short:scale-[0.8] short:origin-top-right">
              <div className="border-2 border-dashed border-[#12112c]/40 px-2 py-0.5">
                <p className="font-display text-[26px] leading-none">{plate}</p>
                <p className="text-[11px] font-bold tracking-[0.08em]">{t(level.difficulty).toLocaleUpperCase(lang === 'en' ? 'en' : 'tr')}</p>
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-2.5">
              <h2 className="font-display text-[34px] leading-none text-cream [text-shadow:0_3px_0_#0e0d22] sm:text-[40px] short:text-[28px]">
                {level.name}
                {level.nickname && <span className="ml-2 whitespace-nowrap text-[18px] text-accent-2">({level.nickname})</span>}
              </h2>
            </div>
          </div>

          {/* yol çizgisi: bitenler altın, sıradaki turuncu; açık bir durağa dokununca kartpostal o şehri gösterir */}
          <div className="mt-3 short:mt-2">
            <div className="mb-1.5 flex items-baseline justify-between text-[12px] font-bold tracking-[0.14em] text-muted">
              {/* durağın üstüne gelince başlıkta o şehrin adı ve plakası */}
              <span className="min-w-0 truncate" aria-live="polite">
                {peek !== null ? (
                  <span className="text-cream">
                    {up(LEVELS[peek].name)} <span className="text-gold">{String(LEVELS[peek].plate).padStart(2, '0')}</span>
                    {props.best[LEVELS[peek].id] ? <span className="text-[#7ad88a]"> ✓</span> : null}
                  </span>
                ) : allDone ? (
                  up(t('Hepsi Bitti: Bir Şehir Seç'))
                ) : (
                  up(t('Yolculuk'))
                )}
              </span>
              <span className="flex items-baseline gap-2 tabular-nums tracking-normal text-cream">
                {pick !== null && !allDone && (
                  <button className="text-[12px] font-semibold text-accent-2 underline-offset-2 hover:underline" onClick={() => setPick(null)}>
                    {ic(t('↺ Sıradaki'))}
                  </button>
                )}
                <span>
                  {done}
                  <span className="text-muted">/{total}</span>
                </span>
              </span>
            </div>
            <div data-nonav className="flex gap-[3px]" role="group" aria-label={t('{n}/{m} Şehir Bitti', { n: done, m: total })}>
              {LEVELS.map((l, i) => {
                const open = !props.fresh && i <= props.unlocked
                const on = i === shown
                const color = i === props.resume && !allDone ? 'route-now bg-accent' : props.best[l.id] ? 'bg-gold' : 'bg-line'
                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={!open}
                    title={open ? l.name : `${l.name} · ${t('Kilitli')}`}
                    aria-label={open ? l.name : `${l.name} (${t('Kilitli')})`}
                    aria-pressed={on}
                    onClick={() => setPick(i === props.resume && !allDone ? null : i)}
                    onPointerEnter={() => setPeek(i)}
                    onPointerLeave={() => setPeek((p) => (p === i ? null : p))}
                    onFocus={() => setPeek(i)}
                    onBlur={() => setPeek((p) => (p === i ? null : p))}
                    className="group relative flex h-5 flex-1 items-center disabled:cursor-not-allowed"
                  >
                    <span className={`block w-full transition-[height] ${color} ${on ? 'h-3.5 shadow-[0_0_0_2px_#f3f1ff]' : 'h-2 group-hover:h-3 group-enabled:group-hover:brightness-125'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <button className="pixel-btn primary cta mt-3 w-full justify-center py-3.5 text-[17px] tight:mt-2.5 tight:py-3 short:mt-2 short:py-2.5 short:text-base" onClick={() => (pick !== null ? props.onCity(pick) : props.onStart())} autoFocus data-primary>
            <span aria-hidden>▶</span>
            {allDone ? t('{city} Şehrinde Oyna', { city: level.name }) : pick !== null ? t('{city} Şehrine Git', { city: level.name }) : started ? t('Devam Et: {city}', { city: level.name }) : t('Yolculuğa Başla')}
          </button>
        </section>

        {/* ── Sağ: menü ── */}
        <nav className="mt-4 max-sm:mt-2.5 tight:mt-3 flex min-w-0 flex-col md:mt-0 short:mt-0" aria-label={t('Ana Menü')}>
          <header className="mb-4 hidden items-center gap-3.5 md:flex short:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-emblem.png" width={60} height={60} alt="" className="drop-shadow-[0_3px_0_#0e0d22]" />
            <div className="min-w-0">
              <h1 className="font-display text-[52px] leading-[0.9] text-cream [text-shadow:0_4px_0_#0e0d22]">
                <HopTitle />
              </h1>
              <p className="mt-1.5 text-[14px] leading-snug text-cream/85">{t('Gezgin’in yarım kalmış defterini tamamla.')}</p>
              <p className="text-[13px] leading-snug text-muted">{lang === 'en' ? `${total} cities. ${total * 3} keepsakes. One journey.` : `${trCount(total)} şehir. ${trCount(total * 3)} hatıra. Tek yolculuk.`}</p>
            </div>
          </header>

          {props.daily && (
            <button className="daily-card mb-3 flex w-full items-center gap-3 px-3 py-2 text-left short:hidden tight:hidden" onClick={() => props.onScreen('modes')}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#d9a441]">
                <ItemIcon city={props.daily.level.city as CityKey} taken size={24} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block whitespace-nowrap text-[12px] font-bold tracking-[0.12em] text-gold">{up(t('Bugünün Meydan Okuması'))}</span>
                <span className="block truncate text-[13px] text-cream">
                  {props.daily.level.name} · {props.daily.rule}
                </span>
              </span>
              <span className="shrink-0 text-right text-[13px] tabular-nums">
                {props.daily.doneMs ? <span className="text-[#7ad88a]">✓ {props.daily.doneMs}</span> : props.daily.used ? <span className="text-muted">{t('Yarın Yeni Şehir')}</span> : <span className="font-semibold text-accent-2">{t('Bugün Oyna')} ▶</span>}
                {props.daily.streak > 1 && <span className="block text-muted">🔥 {props.daily.streak}</span>}
              </span>
            </button>
          )}

          {/* menü üç öbekte: OYNA (yola ve modlara çıkış), SENİN (defter, kılık), altta küçük ayarlar. Her kutucukta ne
              işe yaradığı tek satırda yazar: simgeyi bilmeyen de bulur */}
          {/* yatay telefonda iki öbeğin altı kutucuğu tek ızgarada 3×2 (başlıklar gizli): kaydırmadan sığar */}
          <div className="short:grid short:grid-cols-3 short:gap-1.5">
            <Group label={t('Oyna')} />
            <div className="stagger grid grid-cols-2 gap-2 max-sm:gap-1.5 short:contents">
              <Tile icon="map" label={t('Şehirler')} sub={t('{n}/{m} şehir bitti', { n: done, m: total })} onClick={() => props.onScreen('map')} />
              <Tile
                icon="modes"
                label={t('Modlar')}
                sub={props.dailyPending ? t('Günlük bekliyor') : props.trio < 3 && props.daily ? t('Günün Üçlüsü {n}/3', { n: props.trio }) : props.modeHint ? t('Sana Önerilen: {mode}', { mode: t(NAME[props.modeHint]) }) : t('Co-op, Turnuva, Öfke…')}
                tone="gold"
                badge={modesNew ? t('Yeni') : undefined}
                dot={props.dailyPending ? t('Bugünün meydan okuması seni bekliyor') : props.trio < 3 && props.daily ? t('Günün Üçlüsü seni bekliyor') : undefined}
                onClick={() => props.onScreen('modes')}
            />
              <Tile icon="trophy" label={t('Skorlar')} sub={t('Sıralaman ve rekorlar')} onClick={() => props.onScreen('scores')} />
              <Tile icon="pencil" label={t('Harita Yap')} sub={t('Kendi bölümünü çiz')} onClick={() => (window.location.href = '/duzenle')} />
            </div>
            <Group label={t('Senin')} />
            <div className="stagger grid grid-cols-2 gap-2 max-sm:gap-1.5 short:contents">
              <Tile icon="book" label={t('Defter')} sub={t('{n} hatıra', { n: props.found })} onClick={() => props.onScreen('notebook')} />
              <Tile icon="hero" label={t('Karakter')} sub={t('Kılık, atkı, dükkân')} badge={props.wallet > 0 ? t('{n} Parça', { n: props.wallet }) : undefined} onClick={() => props.onScreen('character')} />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5 max-sm:mt-1.5 short:mt-1.5">
            <Chip icon="story" label={t('Hikâye')} onClick={() => props.onScreen('story')} />
            <Chip icon="gear" label={t('Ayarlar')} onClick={() => props.onScreen('controls')} />
            <Chip icon="music" label={t('Müzik')} aria={props.music ? t('Müzik Açık') : t('Müzik Kapalı')} off={!props.music} onClick={props.onMusic} />
            <Chip icon="story" label={t('Hakkında')} aria={t('Oyun Hakkında')} onClick={() => props.onScreen('about')} plain />
          </div>

          <footer className="mt-auto pt-3 text-[13px] text-muted short:pt-2 tight:pt-2.5">
            {props.player ? (
              <button className="account-row flex w-full items-center gap-2.5 px-2.5 py-2 text-left" onClick={() => props.onScreen('name')}>
                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-panel-2 shadow-[0_0_0_2px_#d9a441]">
                  <Portrait id={props.hero.id} scarf={props.scarf} accessory={props.kit} className="h-full w-full" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold text-cream">{props.player.name}</span>
                  <span className="block truncate text-[12px] text-gold">{props.player.title}</span>
                </span>
                <span className={`flex shrink-0 items-center gap-1 text-[12px] ${sync === 'offline' ? 'text-accent-2' : sync === 'pending' ? 'text-gold' : 'text-[#7ad88a]'}`} role="status">
                  <span aria-hidden className={sync === 'pending' ? 'pulse-dot' : ''}>{sync === 'offline' ? '⚠' : '☁'}</span>
                  <span className="hidden sm:inline">{sync === 'pending' ? t('Eşitleniyor…') : sync === 'offline' ? t('Çevrimdışı: Sonra Eşitlenir') : t('Eşitlendi')}</span>
                  <span className="sr-only sm:hidden">{sync === 'pending' ? t('Eşitleniyor…') : sync === 'offline' ? t('Çevrimdışı: Sonra Eşitlenir') : t('Eşitlendi')}</span>
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-[#2a2236] px-3 py-2 [box-shadow:inset_0_0_0_2px_#d9a441]">
                <span className="min-w-0 text-[13px] font-semibold leading-snug text-cream sm:text-[13px]">
                  <span className="text-gold">☁</span> {props.hasProgress ? t('Giriş Yap, İlerlemen Güvende') : t('Hesabınla her cihazdan devam et')}
                  {props.hasProgress && <span className="block text-[12px] font-normal text-muted max-sm:hidden">{t('Şimdilik yalnız bu tarayıcıda duruyor.')}</span>}
                </span>
                <button className="pixel-btn primary shrink-0 whitespace-nowrap px-3 py-1.5 text-[13px]" onClick={() => props.onScreen('name')}>
                  {t('Giriş Yap')}
                </button>
              </div>
            )}
            {/* yer yetmezse (uzun dil, büyük sayılar) dil düğmesi alt satıra iner: hiçbir şey üst üste binmez */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] tabular-nums tight:hidden">
                <Count label={t('Hatıra')} n={props.found} m={total * 3} />
                <Count label={t('Pul')} n={props.stamps} m={total} />
                <Count label={t('Nazar')} n={props.charms} m={total} />
              </span>
              {props.langSwitch}
            </div>
          </footer>
        </nav>
      </div>
    </div>
  )
}

function Group({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-muted max-sm:hidden short:hidden">
      {label.toLocaleUpperCase('tr')} <span className="h-px flex-1 bg-line" />
    </p>
  )
}

function Tile({ icon, label, sub, onClick, tone, dot, badge }: { icon: IconName; label: string; sub: string; onClick: () => void; tone?: 'gold'; dot?: string; /** köşede küçük "Yeni" yazısı */ badge?: string }) {
  return (
    <button className={`menu-tile group relative flex min-h-[56px] items-center gap-2.5 py-2 px-2.5 text-left short:gap-1.5 short:px-1.5 max-sm:min-h-[40px] max-sm:py-1 tight:min-h-[42px] tight:py-1 short:min-h-[40px] short:py-1 ${tone === 'gold' ? 'modes-tile' : ''}`} onClick={onClick}>
      <span className="tile-icon flex h-9 w-9 shrink-0 items-center justify-center max-sm:h-7 max-sm:w-7 short:h-7 short:w-7">
        <PxIcon name={icon} className="h-5 w-5 max-sm:h-4 max-sm:w-4 short:h-4 short:w-4" />
      </span>
      {/* üstüne gelince sağdan ok kayar: yazı ona yer açar (yalnız o an) */}
      <span className="min-w-0 flex-1 leading-tight transition-[padding] duration-200 group-hover:pr-4 max-sm:group-hover:pr-0 short:group-hover:pr-0">
        <span className="flex items-center gap-1.5 font-display text-[16px] text-cream short:text-[14px]">
          {label}
          {/* rozet kutucuğun köşesinde etiket: adın yanına sığmadığında kutucuğu taşırmaz */}
          {badge && <span className="mode-badge new tile-badge whitespace-nowrap max-sm:hidden short:hidden">{badge}</span>}
        </span>
        <span className={`block truncate text-[12px] max-sm:hidden short:hidden ${dot ? 'font-semibold text-accent-2' : 'text-muted'}`}>{sub}</span>
      </span>
      <span aria-hidden className="tile-go max-sm:hidden short:hidden">
        →
      </span>
      {dot && <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_2px_#0e0d22]" aria-label={dot} />}
    </button>
  )
}

function Chip({ icon, label, aria, onClick, off, plain }: { icon: IconName; label: string; aria?: string; onClick: () => void; off?: boolean; plain?: boolean }) {
  return (
    <button className="menu-mini flex min-w-0 items-center justify-center gap-1.5 px-1.5 py-1.5 text-[12px] font-semibold text-cream" onClick={onClick} aria-label={aria} aria-pressed={off === undefined ? undefined : !off}>
      {!plain && (
        <span className="relative">
          <PxIcon name={icon} className={`h-3.5 w-3.5 ${off ? 'text-muted' : 'text-gold'}`} />
          {off && <span className="absolute left-[-2px] top-1/2 h-[2px] w-[18px] -rotate-45 bg-accent" />}
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  )
}

/** Sayaç: tamamlanınca altın (halka yok: panel her ekranda aynı genişlikte, büyük sayılarla sığmıyordu) */
function Count({ label, n, m }: { label: string; n: number; m: number }) {
  return (
    <span className="whitespace-nowrap">
      {label} <strong className={n >= m && m > 0 ? 'text-gold' : 'text-cream'}>{n}</strong>/{m}
    </span>
  )
}

/** "Sek-Sek": harfler açılışta sırayla seker, üstüne gelince yeniden sek sek zıplar (CSS .hop-title; hareketi azalt açıksa durur) */
function HopTitle() {
  return (
    <>
      <span className="sr-only">Sek-Sek</span>
      <span className="hop-title" aria-hidden>
        {'Sek-Sek'.split('').map((ch, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {ch}
          </span>
        ))}
      </span>
    </>
  )
}

/**
 * Menü gezintisi: ok tuşları ve oyun kolunun yön tuşu/çubuğu odağı geometriye göre en yakın düğmeye taşır; Enter/Boşluk
 * ve kolun A düğmesi odaktakini tıklar. Yol çizgisi (`data-nonav`) gezintiden çıkar: Sekme ile ulaşılır.
 */
function useMenuNav(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const items = () => [...el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')].filter((b) => !b.closest('[data-nonav]') && b.offsetParent !== null)
    const move = (dx: number, dy: number) => {
      const list = items()
      const cur = document.activeElement as HTMLElement | null
      if (!cur || !list.includes(cur)) return (list.find((b) => b.hasAttribute('data-primary')) ?? list[0])?.focus(), true
      const a = cur.getBoundingClientRect()
      const ax = a.left + a.width / 2
      const ay = a.top + a.height / 2
      let best: HTMLElement | null = null
      let bestScore = Infinity
      for (const b of list) {
        if (b === cur) continue
        const r = b.getBoundingClientRect()
        const vx = r.left + r.width / 2 - ax
        const vy = r.top + r.height / 2 - ay
        const along = vx * dx + vy * dy
        if (along <= 4) continue
        const across = Math.abs(dx ? vy : vx)
        const score = along + across * 2.2
        if (score < bestScore) {
          bestScore = score
          best = b
        }
      }
      best?.focus()
      return !!best
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[e.key]
      if (!d) return
      if (move(d[0], d[1])) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    // oyun kolu: yön tuşu ya da sol çubuk gezer, A tıklar; basılı tutunca yavaşça tekrarlar
    let raf = 0
    let held = 0
    let prevA = false
    const poll = (now: number) => {
      raf = requestAnimationFrame(poll)
      const pad = (navigator.getGamepads?.() ?? []).find((g) => g?.connected)
      if (!pad) return
      const b = (i: number) => !!pad.buttons[i]?.pressed
      const dx = b(15) || pad.axes[0] > 0.6 ? 1 : b(14) || pad.axes[0] < -0.6 ? -1 : 0
      const dy = b(13) || pad.axes[1] > 0.6 ? 1 : b(12) || pad.axes[1] < -0.6 ? -1 : 0
      if ((dx || dy) && now - held > 230) {
        held = now
        move(dx, dy)
      } else if (!dx && !dy) held = 0
      const a = b(0)
      if (a && !prevA) (document.activeElement as HTMLElement | null)?.click()
      prevA = a
    }
    raf = requestAnimationFrame(poll)
    return () => {
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
    }
  }, [root])
}
