'use client'

import { useEffect, useRef, useState } from 'react'
import { ItemIcon, Key } from '@/components/HudBits'
import Portrait, { PortraitFace } from '@/components/Portrait'
import { duoHints } from '@/components/Race'
import type { DuoKeys } from '@/game/input'
import { DuoRemap } from '@/components/KeyRemap'
import { MedalBadge, Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { CardToggles, Toggle } from '@/components/CityBanner'
import { SetupHead } from '@/components/Modes'
import { medalFor } from '@/components/medal'
import type { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import type { HeroLook } from '@/game/accessories'
import { LEVELS, bossLevel } from '@/game/levels'
import { BOSSES } from '@/game/boss'
import { ALL_CHALLENGES, RAGE_COURSES, challengeLevel } from '@/game/challenges'
import { BossFigure } from '@/components/Figures'
import { CourseScene } from '@/components/MapThumb'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { emptyInput, type GameEvent, type Input, type LevelDef } from '@/game/types'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

const STEP = 1 / 120

/** Co-op Boss Kapışması: bir ya da iki boss aynı arenada; zorluk boss'un kademesini ve hızını artırır (kural aynı) */
export interface CoopBoss {
  /** birinci boss'un şehri (LEVELS dizini): arena da onun */
  a: number
  /** ikinci boss (yoksa null) */
  b: number | null
  diff: 0 | 1 | 2
}
export const COOP_DIFF = [
  { name: 'Normal', text: 'Boss’lar kendi hızında.', boost: undefined },
  { name: 'Öfkeli', text: 'En az orta kademe, %15 hızlı: öngörülü nişan, dört sıçrayış.', boost: { tier: 2 as const, speed: 1.15 } },
  { name: 'Kâbus', text: 'En yüksek kademe, %30 hızlı: şok dalgası, çift dalış, sahte kabarma.', boost: { tier: 3 as const, speed: 1.3 } },
] as const

/** ortak can seçenekleri: 0 sınırsız */
export const COOP_LIVES = [0, 10, 5, 3] as const
export type CoopLives = (typeof COOP_LIVES)[number]

/**
 * Co-op kurulumu: kip (şehir yolu, boss'lar, mücadele parkuru), iki kılık ve isteğe bağlı kurallar.
 * Kurallar oyunu zorlaştırır ama kimseyi dışarıda bırakmaz: Ortak Can (canlar bitince yolculuk biter), Kısa İp (ikiniz
 * birbirinizden uzaklaşamazsınız) ve Zamana Karşı (gümüş madalya süresi).
 */
export interface CoopPlan {
  mode: 'yol' | 'boss' | 'parkur'
  /** şehir yolu: LEVELS dizini */
  level: number
  /** parkur: mücadele kimliği (ALL_CHALLENGES) */
  course: string | null
  boss: CoopBoss
  heroes: [CharacterId, CharacterId]
  lives: CoopLives
  shortRope: boolean
  clock: boolean
}

/** Co-op'un bölümü: şehir yolu, mücadele parkuru ya da seçilen boss'ların arenası */
export function coopLevel(plan: CoopPlan): LevelDef {
  if (plan.mode === 'parkur') {
    const c = ALL_CHALLENGES.find((x) => x.id === plan.course)
    if (c) return challengeLevel(c)
  }
  if (plan.mode !== 'boss') return LEVELS[plan.level]
  const { boss } = plan
  const A = LEVELS[boss.a]
  return { ...bossLevel(A), bossOf: A.city, bossOf2: boss.b !== null ? LEVELS[boss.b].city : undefined, bossBoost: COOP_DIFF[boss.diff].boost }
}

/** Co-op rekorunun anahtarı (save.coop): kip + şehir ya da parkur ya da boss'lar ve zorluk */
export function coopKey(plan: CoopPlan): string {
  if (plan.mode === 'parkur') return `parkur:${plan.course}`
  if (plan.mode === 'boss') return `boss:${LEVELS[plan.boss.a].id}${plan.boss.b !== null ? `+${LEVELS[plan.boss.b].id}` : ''}:${plan.boss.diff}`
  return `yol:${LEVELS[plan.level].id}`
}

/** Zamana Karşı'nın sınırı (sn): şehir ve parkurda gümüş madalya, boss'ta boss başına 75 sn (zorluk kısaltır) */
export function coopLimit(plan: CoopPlan, level: LevelDef): number | null {
  if (!plan.clock) return null
  if (plan.mode === 'boss') return Math.round((plan.boss.b !== null ? 140 : 75) * [1, 0.9, 0.8][plan.boss.diff])
  return level.medals[1]
}

/** bir oyuncunun koşudaki payı: kim ne yaptı */
export interface CoopShare {
  deaths: number
  items: number
  stomps: number
  hits: number
  boosts: number
  dashes: number
}
const emptyShare = (): CoopShare => ({ deaths: 0, items: 0, stomps: 0, hits: 0, boosts: 0, dashes: 0 })

export interface CoopResult {
  timeMs: number
  deaths: number
  items: number
  share: [CoopShare, CoopShare]
  /** yolculuk yarıda bitti: canlar tükendi ya da süre doldu */
  failed?: 'lives' | 'time'
}

/** olayı paya yazar: olayı kimin adımı ürettiyse onun */
function credit(s: CoopShare, e: GameEvent) {
  if (e.type === 'death') s.deaths++
  else if (e.type === 'collect' || e.type === 'stamp' || e.type === 'charm') s.items++
  else if (e.type === 'stomp') s.stomps++
  else if (e.type === 'bossHit' || e.type === 'bossDown') s.hits++
  else if (e.type === 'shoulder') s.boosts++
  else if (e.type === 'dash') s.dashes++
}

/** Bitiş ekranının unvanları: her biri bir oyuncuya, eşitlikte verilmez */
export function coopAwards(share: [CoopShare, CoopShare]): { who: 0 | 1; name: string }[] {
  const out: { who: 0 | 1; name: string }[] = []
  const most = (f: (s: CoopShare) => number, name: string, low = false) => {
    const a = f(share[0])
    const b = f(share[1])
    if (a === b || (!low && Math.max(a, b) === 0)) return
    out.push({ who: (low ? a < b : a > b) ? 0 : 1, name })
  }
  most((s) => s.hits, 'Boss Ezici')
  most((s) => s.items, 'Hatıra Avcısı')
  most((s) => s.boosts, 'Omuz Ustası')
  most((s) => s.stomps, 'Düşman Kovucu')
  most((s) => s.deaths, 'Sağlam Ayak', true)
  most((s) => s.dashes, 'Dash Ustası')
  return out
}

/** Co-op kurulumu: Şehir Yolu, Boss Kapışması ya da Parkur; iki kılık ve kurallar. Tuşlar oyuncunun ataması ya da iki oyun kolu. */
export function CoopSetup({ unlocked, finished, initial, hero, canPlay, keys, best, onStart, onBack }: { unlocked: number; /** bitirilmiş şehirlerin kimlikleri: parkurlar onlarda açılır */ finished: Set<string>; initial: CoopPlan | null; hero: CharacterId; canPlay: boolean; keys: DuoKeys; best: Record<string, number>; onStart: (plan: CoopPlan) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const open = LEVELS.slice(0, Math.min(unlocked, LEVELS.length - 1) + 1)
  const courses = ALL_CHALLENGES.filter((c) => finished.has(c.level))
  const [plan, setPlan] = useState<CoopPlan>(
    () =>
      initial ?? {
        mode: 'yol',
        level: open.length - 1,
        course: courses[0]?.id ?? null,
        boss: { a: open.length - 1, b: null, diff: 0 },
        heroes: [hero, hero === 'uktun' ? 'memo' : 'uktun'],
        lives: 0,
        shortRope: false,
        clock: false,
      },
  )
  const set = (p: Partial<CoopPlan>) => setPlan((x) => ({ ...x, ...p }))
  // boss seçiminde hangi yuvayı dolduruyoruz: birinci ya da ikinci boss
  const [slot, setSlot] = useState<'a' | 'b'>('a')
  // liste açılınca (ve kip ya da yuva değişince) seçili öğe görünsün: uzun listede aşağıda kalmasın
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const on = list?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (list && on) list.scrollTop = Math.max(0, on.offsetTop - list.clientHeight / 2 + on.clientHeight / 2)
  }, [plan.mode, slot])
  const { mode, boss, heroes } = plan
  const lv = localize(LEVELS[plan.level], lng)
  const pick = (i: number) => {
    if (mode === 'yol') return set({ level: i })
    setPlan((x) => ({ ...x, boss: slot === 'a' ? { ...x.boss, a: i, b: x.boss.b === i ? null : x.boss.b } : { ...x.boss, b: x.boss.a === i ? x.boss.b : i } }))
  }
  const sel = (i: number) => (mode === 'yol' ? i === plan.level : slot === 'a' ? i === boss.a : i === boss.b)
  const bossName = (i: number) => (lng === 'en' ? BOSSES[LEVELS[i].city].nameEn : BOSSES[LEVELS[i].city].name)
  const course = courses.find((c) => c.id === plan.course) ?? courses[0]
  const ready = mode !== 'parkur' || !!course
  const startPlan: CoopPlan = mode === 'parkur' && course ? { ...plan, course: course.id } : plan
  const record = ready ? best[coopKey(startPlan)] : undefined
  const level = coopLevel(startPlan)
  // Zamana Karşı'nın sınırı kapalıyken de yazar: açmadan önce ne istediği bilinsin
  const limit = coopLimit({ ...startPlan, clock: true }, level)
  // seçimin rengi: şehir ve parkur altın, boss mercan; kip sekmeleri turkuaz (Co-op'un ailesi)
  const pickTone = { '--tone': mode === 'boss' ? 'var(--color-coral)' : 'var(--color-gold)' } as React.CSSProperties
  const recordLine = record !== undefined ? t('İkilinin rekoru: {time}', { time: formatTime(record) }) : null
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:h-[min(700px,calc(100dvh-32px))] wide:max-w-[min(1040px,100%)]">
        <SetupHead
          title={t('Co-op')}
          note={mode === 'yol' ? t('Bütün şehri birlikte gezin: hatıralar ve düğmeler ortak.') : mode === 'boss' ? t('Bir ya da iki boss birden, üç zorlukta.') : t('Zor şehirlerin en sıkı yerleri, madalyalı.')}
          onBack={onBack}
        />
        {/* kip: şehir yolu, yalnız boss'lar ya da mücadele parkuru */}
        <div className="mt-4 grid grid-cols-3 gap-2 short:mt-2" role="tablist" style={{ '--tone': 'var(--color-teal)' } as React.CSSProperties}>
          {(
            [
              ['yol', t('Şehir Yolu'), t('{n} şehir', { n: open.length })],
              ['boss', t('Boss Kapışması'), t('{n} boss', { n: open.length })],
              ['parkur', t('Parkur'), courses.length ? t('{n} parkur', { n: courses.length }) : t('Kilitli')],
            ] as const
          ).map(([k, name, sub]) => (
            <button key={k} role="tab" aria-selected={mode === k} onClick={() => set({ mode: k })} className="seg-opt flex items-baseline justify-between gap-2 px-3 py-2 text-left max-sm:justify-center max-sm:px-1.5">
              <span className="font-display text-[16px] leading-tight max-sm:text-[14px]">{name}</span>
              <span className="shrink-0 text-[12px] text-muted max-sm:hidden short:hidden">{sub}</span>
            </button>
          ))}
        </div>
        <div className="overlay-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2 wide:flex wide:flex-col">
          <div className="grid gap-4 short:gap-3 wide:min-h-0 wide:flex-1 wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] wide:gap-5">
            {/* sol: yolcular ve seçilenin önizlemesi (boss'ta yuvalar ve zorluk) */}
            <div className="flex min-h-0 flex-col">
              {/* alçak ekranda (yatay telefon) oyuncu kartları gizlenir: co-op klavye ister, yer seçime kalsın */}
              <div className="short:hidden">
                <SectionTitle title={t('Yolcular')} note={t('Karta dokun, kılığı değiştir')} tone="var(--color-teal)" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([0, 1] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`flex items-center gap-2.5 border-2 bg-ink/30 p-2 text-left transition-colors hover:bg-panel-2/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${k === 0 ? 'border-accent/70' : 'border-gold/70'}`}
                      onClick={() => set({ heroes: k === 0 ? [heroes[0] === 'uktun' ? 'memo' : 'uktun', heroes[1]] : [heroes[0], heroes[1] === 'uktun' ? 'memo' : 'uktun'] })}
                      aria-label={t('Kılığı Değiştir')}
                    >
                      <Portrait id={heroes[k]} className="w-[44px] shrink-0 max-sm:hidden" />
                      <span className="min-w-0">
                        <span className="flex items-baseline gap-2">
                          <span className="font-display text-[16px] leading-tight text-cream">{CHARACTERS[heroes[k]].short}</span>
                          <span className={`text-[12px] font-semibold ${k === 0 ? 'text-accent-2' : 'text-gold'}`}>{t('{n}. Oyuncu', { n: k + 1 })}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap gap-0.5">
                          {duoHints(keys, lng === 'en' ? 'en' : 'tr')[k].flat().map((c) => (
                            <Key key={c}>{c}</Key>
                          ))}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {mode !== 'boss' && (mode === 'yol' || course) && (
                <figure className="mt-4 flex min-h-0 flex-1 flex-col max-sm:hidden short:hidden">
                  <CourseScene map={level.map} city={level.city} className="h-[clamp(90px,20vh,200px)] wide:h-auto wide:min-h-[100px] wide:flex-1" />
                  <figcaption className="mt-2 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-display text-xl leading-tight text-cream">{mode === 'yol' ? displayName(LEVELS[plan.level]) : t(course!.name)}</span>
                    <span className="shrink-0 text-[13px] text-muted">{mode === 'yol' ? t(lv.difficulty) : t('Altın süre {s} sn', { s: level.medals[0] })}</span>
                  </figcaption>
                  {recordLine && <p className="mt-0.5 text-[13px] font-semibold text-gold">{recordLine}</p>}
                </figure>
              )}
              {mode === 'boss' && (
                <div className="mt-4 flex min-h-0 flex-1 flex-col short:mt-0">
                  <SectionTitle title={t('Arena')} note={t('Yuvaya dokun, listeden boss seç')} tone="var(--color-coral)" className="short:hidden" />
                  {/* seçilen boss'lar: canlı çizim; tıklanan yuva yandaki listeden doldurulur */}
                  <div className="mt-2 grid grid-cols-2 gap-2 short:mt-0" style={{ '--tone': 'var(--color-coral)' } as React.CSSProperties}>
                    {(['a', 'b'] as const).map((k) => {
                      const i = boss[k]
                      return (
                        <div key={k} className="relative flex min-h-0">
                          <button onClick={() => setSlot(k)} aria-pressed={slot === k} className="seg-opt flex min-h-[84px] w-full items-center gap-2 px-2 py-2 text-left max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:text-center short:min-h-[60px]">
                            {i !== null ? <BossFigure city={LEVELS[i].city} className="h-14 w-20 shrink-0 max-sm:h-11 max-sm:w-16 short:h-10 short:w-14" /> : <span className="flex h-14 w-20 shrink-0 items-center justify-center text-3xl text-muted max-sm:h-11 short:h-10 short:w-14">＋</span>}
                            <span className="min-w-0 pr-5 max-sm:pr-0">
                              <span className="block text-[12px] font-semibold text-muted">{k === 'a' ? t('1. Boss') : t('2. Boss')}</span>
                              <span className="block text-[14px] font-semibold leading-tight text-cream">{i !== null ? bossName(i) : t('İsteğe Bağlı')}</span>
                            </span>
                          </button>
                          {k === 'b' && i !== null && (
                            <button type="button" aria-label={t('İkinci Boss’u Kaldır')} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center text-[14px] text-muted hover:text-cream" onClick={() => (setPlan((x) => ({ ...x, boss: { ...x.boss, b: null } })), setSlot('a'))}>
                              ✕
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-3 short:mt-2" style={{ '--tone': 'var(--color-coral)' } as React.CSSProperties}>
                    <span className="shrink-0 text-[14px] font-semibold text-cream">{t('Zorluk')}</span>
                    <div className="grid flex-1 grid-cols-3 gap-1.5" role="group" aria-label={t('Zorluk')}>
                      {COOP_DIFF.map((d, k) => (
                        <button key={d.name} aria-pressed={boss.diff === k} onClick={() => setPlan((x) => ({ ...x, boss: { ...x.boss, diff: k as 0 | 1 | 2 } }))} className="seg-opt flex items-center justify-center gap-1.5 px-1 py-1.5 max-sm:flex-col max-sm:gap-0">
                          <span className="font-display text-[14px]">{t(d.name)}</span>
                          <span className="text-[11px] text-coral" aria-hidden>
                            {'🔥'.repeat(k + 1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-snug text-muted short:hidden">{t(COOP_DIFF[boss.diff].text)}</p>
                </div>
              )}
            </div>
            {/* sağ: seçim listesi; kalan boyu doldurur, kendi içinde kayar */}
            <div className="flex min-h-0 flex-col">
              <SectionTitle
                title={mode === 'yol' ? t('Şehir') : mode === 'parkur' ? t('Parkur') : slot === 'a' ? t('1. Boss’u Seç') : t('2. Boss’u Seç')}
                note={mode === 'parkur' ? (courses.length ? t('Bitirdiğin Zor şehirlerden') : undefined) : mode === 'yol' ? t('Açtığın şehirlerden biri') : t('Arena birinci boss’un şehri')}
                tone={mode === 'boss' ? 'var(--color-coral)' : 'var(--color-gold)'}
              />
              {mode === 'parkur' ? (
                courses.length ? (
                  <div ref={listRef} className="relative mt-2 grid max-h-[180px] auto-rows-min gap-1.5 overflow-y-auto pr-1 max-sm:grid-cols-1 short:max-h-[120px] short:grid-cols-2 wide:max-h-none wide:min-h-0 wide:flex-1" style={pickTone}>
                    {courses.map((c) => {
                      const lvl = LEVELS.find((l) => l.id === c.level)!
                      const on = c.id === course?.id
                      const rage = RAGE_COURSES.includes(c)
                      const won = best[`parkur:${c.id}`]
                      return (
                        <button key={c.id} aria-pressed={on} className="seg-opt flex items-center gap-2.5 px-3 py-2 text-left" onClick={() => set({ course: c.id })}>
                          <ItemIcon city={lvl.city} taken size={18} />
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block text-[14px] font-semibold">{t(c.name)}</span>
                            <span className="block text-[12px] text-muted short:hidden">
                              {lvl.name} · {rage ? t('Öfke Parkuru') : t('Mücadele')}
                            </span>
                          </span>
                          {won !== undefined ? <span className="shrink-0 text-[13px] tabular-nums text-gold">★ {formatTime(won)}</span> : rage ? <span className="shrink-0 text-[13px] text-coral">🔥</span> : null}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-2 border-2 border-dashed border-line bg-ink/30 p-3 text-[14px] leading-snug text-cream/85">{t('Parkurlar Zor şehirlerden kesilir. Bir Zor şehri bitirince burada açılır.')}</p>
                )
              ) : (
                <div ref={listRef} className="relative mt-2 grid max-h-[180px] auto-rows-min grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 short:max-h-[120px] wide:max-h-none wide:min-h-0 wide:flex-1" style={pickTone}>
                  {open.map((l, i) => (
                    <button key={l.id} aria-pressed={sel(i)} className="seg-opt flex items-center gap-2 px-2.5 py-2 text-left text-[14px]" onClick={() => pick(i)}>
                      <ItemIcon city={l.city} taken size={16} />
                      <span className="min-w-0 truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* kurallar: isteğe bağlı zorluk; ortak can, kısa ip, zamana karşı */}
          <section className="mt-4 shrink-0 short:mt-3">
            <SectionTitle title={t('Kurallar')} note={t('İsteğe bağlı, ikinize birden')} tone="var(--color-accent)" />
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="opt-card flex flex-col px-3 py-2.5" role="group" aria-label={t('Ortak Can')}>
                <span className="text-[14px] font-semibold leading-tight text-cream">{t('Ortak Can')}</span>
                <span className="mt-0.5 text-[13px] leading-snug text-muted">{plan.lives ? t('Düşüşler bitince yolculuk biter') : t('Sınırsız: istediğiniz kadar düşün')}</span>
                <div className="mt-auto grid grid-cols-4 gap-1 pt-2">
                  {COOP_LIVES.map((n) => (
                    <button key={n} aria-pressed={plan.lives === n} aria-label={n === 0 ? t('Sınırsız') : t('{n} Can', { n })} onClick={() => set({ lives: n })} className="seg-opt py-1 font-display text-[14px]">
                      {n === 0 ? '∞' : `♥ ${n}`}
                    </button>
                  ))}
                </div>
              </div>
              <CardToggles.Provider value>
                <Toggle label={t('Kısa İp')} on={plan.shortRope} onChange={() => set({ shortRope: !plan.shortRope })} hint={t('Yarım ekrandan fazla uzaklaşamazsınız; geride kalan öne ışınlanır.')} />
                <Toggle label={t('Zamana Karşı')} on={plan.clock} onChange={() => set({ clock: !plan.clock })} hint={limit ? t('{s} saniye içinde bitirin, yoksa yolculuk biter.', { s: limit }) : t('Süre sınırı yok.')} />
              </CardToggles.Provider>
            </div>
          </section>
        </div>
        {/* alt şerit: ipucu solda, tek dolu düğme sağda */}
        <div className="mt-4 flex shrink-0 flex-col gap-2 short:mt-2 wide:flex-row wide:items-center wide:gap-5">
          <p className={`min-w-0 flex-1 text-[13px] leading-snug ${canPlay ? 'text-muted' : 'text-accent-2'} short:hidden`}>
            {!canPlay
              ? t('Co-op için klavye ya da iki oyun kolu gerekir.')
              : mode === 'boss'
                ? `${recordLine ? `${recordLine} · ` : ''}${boss.b !== null ? t('İki boss aynı arenada: biri dinlenirken öbürü saldırır. İkisi de düşünce kapı açılır.') : t('Bir boss, iki kahraman. İkinci boss için 2. yuvaya dokun.')}`
                : t('Biri ötekinin başına inerken zıplarsa omuzdan sekip yükseğe çıkar.')}
          </p>
          {!canPlay && <p className="hidden text-[13px] text-accent-2 short:block">{t('Co-op için klavye ya da iki oyun kolu gerekir.')}</p>}
          <button className="pixel-btn primary justify-center py-2.5 text-base short:py-2 wide:w-[320px] wide:shrink-0" disabled={!canPlay || !ready} onClick={() => onStart(startPlan)} autoFocus>
            {ic(mode === 'yol' ? t('▶ Birlikte Başla') : mode === 'boss' ? t('▶ Arenaya Gir') : t('▶ Parkura Çık'))}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

interface CoopHud {
  time: number
  deaths: number
  items: boolean[]
  share: [number, number]
}

/**
 * Co-op oyun: tek dünya, tek kamera, iki oyuncu. Dünya oyuncuyu (1. oyuncu) bilir; eş (2. oyuncu) World.stepPartner
 * ile aynı adımda yürür. Kamera ikisinin ortasına bakar; aradaki uzaklık ipin boyunu aşınca geride kalan öne ışınlanır.
 * Olaylar onları üreten adıma göre oyunculara yazılır (kim düştü, kim hatıra aldı, kim boss'a bastı).
 * İlerlemeye ve şehir rekorlarına dokunmaz.
 */
export default function Coop({ plan, looks, sound, keys, onKeys, onDone, onQuit }: { plan: CoopPlan; /** her yolcunun Kılık Dükkânı'ndaki atkısı ve kombini: her oyuncu seçtiği karakterin kılığını giyer */ looks?: Partial<Record<CharacterId, HeroLook>>; sound: Sound | null; /** iki oyuncunun tuşları (save.duoKeys); molada değişirse hemen uyar */ keys: DuoKeys; onKeys: (k: DuoKeys) => void; onDone: (r: CoopResult) => void; onQuit: () => void }) {
  const keysRef = useRef(keys)
  keysRef.current = keys
  const t = useT()
  const lang = useLang()
  const [level] = useState(() => coopLevel(plan))
  const heroes = plan.heroes
  const limit = coopLimit(plan, level)
  const canvas = useRef<HTMLCanvasElement>(null)
  const phase = useRef<'count' | 'run' | 'pause' | 'over'>('count')
  const [count, setCount] = useState(3)
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState<CoopHud>({ time: 0, deaths: 0, items: [false, false, false], share: [0, 0] })
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const c = canvas.current!
    const renderer = new Renderer(c)
    renderer.character = CHARACTERS[heroes[0]]
    renderer.partnerLook = heroes[1]
    const l0 = looks?.[heroes[0]]
    const l1 = looks?.[heroes[1]]
    if (l0) {
      renderer.accessory = l0.kit
      renderer.scarf = l0.scarf
    }
    if (l1) {
      renderer.partnerAcc = l1.kit
      renderer.partnerScarf = l1.scarf
    }
    renderer.lang = lang
    const world = new World(level)
    world.enableCoop()
    const share: [CoopShare, CoopShare] = [emptyShare(), emptyShare()]
    /** geride kalan, ipin boyunu aşınca öne ışınlanır (görünür alanın oranı) */
    const tether = plan.shortRope ? 0.45 : 0.8
    const fit = () => {
      renderer.resize(c.clientWidth || window.innerWidth, c.clientHeight || window.innerHeight, Math.min(window.devicePixelRatio || 1, 3))
      renderer.setLevel(world)
    }
    fit()
    window.addEventListener('resize', fit)

    const keys = new Set<string>()
    const latch = [
      { jump: false, dash: false, padJump: false, padDash: false },
      { jump: false, dash: false, padJump: false, padDash: false },
    ]
    const togglePause = () => {
      if (phase.current === 'run') {
        phase.current = 'pause'
        setPaused(true)
      } else if (phase.current === 'pause') {
        phase.current = 'run'
        setPaused(false)
      }
    }
    const down = (e: KeyboardEvent) => {
      const k = e.code
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'NumpadEnter', 'Slash', 'Period', 'ShiftLeft', 'ShiftRight'].includes(k)) e.preventDefault()
      keys.add(k)
      if (e.repeat) return
      if (k === 'Escape' || k === 'KeyP') togglePause()
      latch.forEach((s, i) => {
        if (keysRef.current[i].jump.includes(k)) s.jump = true
        if (keysRef.current[i].dash.includes(k)) s.dash = true
      })
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      if (e.key === 'Meta') keys.clear()
    }
    const blur = () => keys.clear()
    // başlat düğmesinde kalan odak: Enter (dash) ya da Boşluk o düğmeye basmasın
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __coop: unknown }).__coop = world
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    /**
     * Oyun kolları: iki kol takılıysa birincisi 1., ikincisi 2. oyuncunun. Tek kol takılıysa 2. oyuncunun olur: 1. oyuncu
     * klavyenin solunda (WASD) kalır, kimse ok tuşlarına sıkışmaz.
     */
    const pads = () => (typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].filter((p): p is Gamepad => !!p) : [])
    const sample = (i: number, list: Gamepad[]): Input => {
      const s = latch[i]
      const m = keysRef.current[i]
      const has = (codes: readonly string[]) => codes.some((code) => keys.has(code))
      const inp = emptyInput()
      inp.left = has(m.left)
      inp.right = has(m.right)
      inp.up = has(m.jump)
      inp.down = has(m.down)
      inp.jump = has(m.jump)
      const p = list.length === 1 ? (i === 1 ? list[0] : undefined) : list[i]
      if (p) {
        const ax = p.axes[0] ?? 0
        const ay = p.axes[1] ?? 0
        if (ax < -0.4 || p.buttons[14]?.pressed) inp.left = true
        if (ax > 0.4 || p.buttons[15]?.pressed) inp.right = true
        if (ay < -0.5 || p.buttons[12]?.pressed) inp.up = true
        if (ay > 0.5 || p.buttons[13]?.pressed) inp.down = true
        const pj = !!(p.buttons[0]?.pressed || p.buttons[3]?.pressed)
        const pd = !!(p.buttons[2]?.pressed || p.buttons[1]?.pressed || p.buttons[7]?.pressed)
        if (p.buttons[9]?.pressed && phase.current === 'run') togglePause()
        if (pj) inp.jump = true
        if (pj && !s.padJump) s.jump = true
        if (pd && !s.padDash) s.dash = true
        s.padJump = pj
        s.padDash = pd
      }
      inp.jumpPressed = s.jump
      inp.dashPressed = s.dash
      s.jump = false
      s.dash = false
      return inp
    }

    const end = (failed?: 'lives' | 'time') => {
      if (phase.current === 'over') return
      phase.current = 'over'
      doneRef.current({ timeMs: Math.round(world.time * 1000), deaths: world.deaths, items: world.pickups.filter((x) => x.taken).length, share, failed })
    }

    sound?.setMusic(level.city)
    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    let countLeft = 3.2
    let shown = ''
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      const ph = phase.current
      if (ph === 'count') {
        countLeft -= dt
        setCount(Math.max(0, Math.ceil(countLeft)))
        if (countLeft <= 0) {
          phase.current = 'run'
          world.started = true
          latch.forEach((s) => (s.jump = s.dash = false))
          sound?.sfx('checkpoint')
        }
      }
      if (ph === 'run') {
        acc += dt
        if (acc >= STEP) {
          const list = pads()
          const inputs = [sample(0, list), sample(1, list)]
          let first = true
          while (acc >= STEP) {
            renderer.capture(world)
            const strip = (i: Input) => (first ? i : { ...i, jumpPressed: false, dashPressed: false })
            // olayları adımlarına göre oyunculara yaz: step 1. oyuncunun, stepPartner 2. oyuncunun
            const n0 = world.events.length
            world.step(STEP, strip(inputs[0]))
            const n1 = world.events.length
            world.stepPartner(STEP, strip(inputs[1]))
            for (let k = n0; k < world.events.length; k++) {
              const e = world.events[k]
              // omuz sekmesi ikisinin de adımından sonra denetlenir: olay sekenin kim olduğunu taşır
              credit(share[e.type === 'shoulder' ? (e.partner ? 1 : 0) : k < n1 ? 0 : 1], e)
            }
            first = false
            acc -= STEP
          }
        }
        const p = world.player
        const q = world.partner!
        for (const e of world.events) {
          renderer.handle(e, world)
          sound?.sfx(e.type)
          // bölüm bayraktan yeniden kuruldu ya da meydan kapısından geçildi: eş de oraya
          if (e.type === 'respawn') world.bringPartner()
          if (e.type === 'warp') {
            if (Math.abs(p.x - (world.arrival?.x ?? p.x)) < 32) world.bringPartner(p)
            else if (world.arrival) Object.assign(p, { x: q.x, y: q.y, vx: 0, vy: 0 })
          }
          if (e.type === 'complete' && phase.current === 'run') end()
        }
        world.events.length = 0
        // ortak can: düşüşler canları bitirince yolculuk biter (son düşüşün sahnesi görünsün diye ölüm anında değil, doğuşta)
        if (plan.lives && world.deaths >= plan.lives && !p.dead && !q.dead && phase.current === 'run') end('lives')
        if (limit && world.time >= limit && phase.current === 'run') end('time')
        // ip: geride kalan öne ışınlanır (ipin boyunu aşan uzaklık); önde olan, sağa ya da yukarı daha ileride olandır
        if (!p.dead && !q.dead && !p.hang && !q.hang && (Math.abs(p.x - q.x) > renderer.viewW * tether || Math.abs(p.y - q.y) > renderer.viewH * tether)) {
          if (p.x >= q.x) world.bringPartner(p)
          else Object.assign(p, { x: q.x - 10, y: q.y, vx: 0, vy: 0 })
          sound?.sfx('respawn')
        }
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          // HUD yalnız değişince yeniden çizilir: süre onda birlik, düşüş ve hatıra değişince
          const items = world.pickups.map((x) => x.taken)
          const sig = `${Math.floor(world.time * 10)}|${world.deaths}|${items.join()}|${share[0].items},${share[1].items}`
          if (sig !== shown) {
            shown = sig
            setHud({ time: world.time, deaths: world.deaths, items, share: [share[0].items, share[1].items] })
          }
        }
      } else acc = 0
      renderer.render(world, dt, ph === 'run' ? acc / STEP : 1)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
    // co-op bir kez kurulur; yeniden başlatmak için bileşen yeniden bağlanır (key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const left = limit ? Math.max(0, limit - hud.time) : null
  return (
    <div className="absolute inset-0 z-30 bg-ink">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label={t('Oyun Alanı')} />
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 bg-ink/85 py-1 pl-1 pr-2.5 [box-shadow:0_0_0_2px_#37337a]">
        <PortraitFace id={heroes[0]} />
        <PortraitFace id={heroes[1]} />
        <div className="leading-tight">
          <p className="max-w-[180px] truncate font-display text-[14px] text-cream">{level.name}</p>
          <p className="flex items-center gap-1 text-[12px] text-muted">
            {level.map.some((r) => r.includes('C')) &&
              [0, 1, 2].map((i) => <ItemIcon key={i} city={level.city} taken={!!hud.items[i]} size={12} />)}
            {plan.lives ? (
              <span className="ml-1 font-bold text-coral" aria-label={t('Kalan Can')}>
                ♥ {Math.max(0, plan.lives - hud.deaths)}
              </span>
            ) : (
              <span className="ml-1">✕{hud.deaths}</span>
            )}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
        <p className="bg-ink/85 px-2.5 py-1 font-display text-2xl tabular-nums text-cream [box-shadow:0_0_0_2px_#37337a]">{formatTime((hud.time * 1000) | 0)}</p>
        {left !== null && <p className={`bg-ink/85 px-2 py-0.5 text-[13px] font-bold tabular-nums [box-shadow:0_0_0_2px_#37337a] ${left < 10 ? 'text-coral' : 'text-muted'}`}>⏳ {formatTime((left * 1000) | 0).slice(0, -2)}</p>}
      </div>
      {count > 0 && (
        <>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p key={count} className="rise font-display text-[120px] leading-none text-cream [text-shadow:0_8px_0_#0e0d22]">
              {count}
            </p>
            <p className="mt-2 max-w-[90%] bg-ink/80 px-3 py-1 text-center text-[14px] text-cream">{t('İpucu: eşinin başına inerken zıpla, omzundan sekip yükseğe çık.')}</p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-6 text-[13px] text-cream">
            {duoHints(keys, lang === 'en' ? 'en' : 'tr')
              .map((g) => g.flat())
              .map((ks, k) => (
                <span key={k} className="flex items-center gap-1 bg-ink/80 px-2 py-1">
                  <span className="mr-1 font-bold text-muted">{k + 1}.</span>
                  {ks.map((c) => (
                    <Key key={c}>{c}</Key>
                  ))}
                </span>
              ))}
          </div>
        </>
      )}
      {!paused && count === 0 && (
        <button
          className="pixel-btn absolute left-1/2 top-2 h-9 w-9 -translate-x-1/2 justify-center p-0 text-[13px]"
          aria-label={t('Mola')}
          onClick={() => {
            if (phase.current !== 'run') return
            phase.current = 'pause'
            setPaused(true)
          }}
        >
          ❚❚
        </button>
      )}
      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-4">
          <div className="pixel-panel overlay-scroll max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto p-5 text-center short:p-3">
            <h2 className="font-display text-3xl text-cream">{t('Birlikte Mola')}</h2>
            <p className="mt-1 text-[14px] text-muted short:hidden">{t('Oyun bekliyor. Tuşları buradan değiştirebilirsiniz.')}</p>
            <div className="mt-4 grid gap-2.5">
              <button
                className="pixel-btn primary justify-center"
                autoFocus
                onClick={() => {
                  phase.current = 'run'
                  setPaused(false)
                }}
              >
                {ic(t('▶ Devam Et'))}
              </button>
              <button className="pixel-btn justify-center" onClick={onQuit}>
                {t('Yolculuğu Bırak')}
              </button>
            </div>
            {/* oyunu bırakmadan tuşlar değişir: girdi hemen uyar */}
            <div className="mt-4 text-left short:mt-2">
              <DuoRemap keys={keys} onChange={onKeys} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Co-op bitişi: ortak süre, madalya, rekor, kim ne yaptı ve unvanlar; yarıda bittiyse nedeni */
export function CoopEnd({ plan, result, best, newBest, onAgain, onSetup, onMenu }: { plan: CoopPlan; result: CoopResult; /** önceki rekor (ms) */ best: number | undefined; newBest: boolean; onAgain: () => void; onSetup: () => void; onMenu: () => void }) {
  const t = useT()
  const lng = useLang()
  const level = coopLevel(plan)
  const bn = (i: number) => (lng === 'en' ? BOSSES[LEVELS[i].city].nameEn : BOSSES[LEVELS[i].city].name)
  const { boss, heroes } = plan
  const failed = result.failed
  const medal = !failed && plan.mode !== 'boss' ? medalFor(level, result.timeMs) : null
  const awards = coopAwards(result.share)
  const rows: [string, (s: CoopShare) => number][] = [
    [t('Hatıra ve Hazine'), (s) => s.items],
    [t('Boss’a Basış'), (s) => s.hits],
    [t('Ezilen Düşman'), (s) => s.stomps],
    [t('Omuz Sekmesi'), (s) => s.boosts],
    [t('Düşüş'), (s) => s.deaths],
  ]
  const shownRows = rows.filter(([, f]) => f(result.share[0]) + f(result.share[1]) > 0)
  // oyuncunun adı: kılığın adı; ikisi aynı kılıktaysa numarası
  const hasStats = awards.length > 0 || shownRows.length > 0
  const who = (k: 0 | 1) => (heroes[0] === heroes[1] ? t('{n}. Oyuncu', { n: k + 1 }) : CHARACTERS[heroes[k]].short)
  return (
    <Overlay dim>
      <div className={`rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 text-center sm:p-6 short:py-3 ${hasStats ? 'short:grid short:max-w-[min(880px,100%)] short:grid-cols-2 short:gap-5 wide:grid wide:max-w-[min(880px,100%)] wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] wide:items-center wide:gap-7' : ''}`}>
        <div>
          <h2 className={`font-display text-3xl leading-tight short:text-2xl ${failed ? 'text-coral' : 'text-cream'}`}>
            {failed === 'lives' ? t('Canlar Bitti') : failed === 'time' ? t('Süre Doldu') : plan.mode === 'boss' ? t('Boss’lar Düştü') : t('Birlikte Bitirdiniz')}
          </h2>
          <div className="mt-3 flex items-end justify-center gap-1" aria-hidden>
            <Portrait id={heroes[0]} className={`w-[64px] short:w-[48px] ${failed ? 'grayscale' : ''}`} />
            <Portrait id={heroes[1]} className={`w-[64px] short:w-[48px] ${failed ? 'grayscale' : ''}`} />
          </div>
          <p className="mt-2 flex items-center justify-center gap-2 font-display text-5xl tabular-nums text-cream short:text-4xl">
            {formatTime(result.timeMs)}
            {medal && <MedalBadge medal={medal} size="lg" />}
          </p>
          <p className="mt-2 text-[14px] text-muted">
            {plan.mode === 'boss'
              ? `${[boss.a, boss.b].filter((x): x is number => x !== null).map(bn).join(' + ')} · ${t(COOP_DIFF[boss.diff].name)} · ${t('{deaths} düşüş', { deaths: result.deaths })}`
              : plan.mode === 'parkur'
              ? `${level.name} · ${t('{deaths} düşüş', { deaths: result.deaths })}`
              : t('{city} · {deaths} düşüş · {items}/3 hatıra', { city: level.name, deaths: result.deaths, items: result.items })}
          </p>
          {failed ? (
            <p className="mt-1.5 text-[14px] text-cream/85">{failed === 'lives' ? t('Ortak canlar tükendi. Yavaş ve birlikte: biri öndeyken öteki yolu izlesin.') : t('Süre bitti. Bir dahaki sefere omuz sekmesiyle kestirmeleri deneyin.')}</p>
          ) : newBest || best !== undefined ? (
            <p className={`mt-1.5 text-[14px] ${newBest ? 'font-bold text-gold' : 'text-muted'}`}>{newBest ? t('İkilinin yeni rekoru!') : t('İkilinin rekoru: {time}', { time: formatTime(best!) })}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-3 gap-2 short:mt-3">
            <button className="pixel-btn primary justify-center" onClick={onAgain} autoFocus>
              {ic(t('↺ Yeniden'))}
            </button>
            <button className="pixel-btn justify-center" onClick={onSetup}>
              {t('Ayarlar')}
            </button>
            <button className="pixel-btn justify-center" onClick={onMenu}>
              {t('Modlar')}
            </button>
          </div>
        </div>
        <div className={`overlay-scroll mt-4 min-h-0 overflow-y-auto text-left short:mt-0 wide:mt-0 ${hasStats ? '' : 'hidden'}`}>
          {awards.length > 0 && (
            <>
              <SectionTitle title={t('Unvanlar')} note={t('Yolun hatırası')} tone="var(--color-gold)" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {awards.map((a) => (
                  <span key={a.name} className={`border-2 bg-ink/30 px-2 py-1 text-[13px] text-cream ${a.who === 0 ? 'border-accent/70' : 'border-gold/70'}`}>
                    {who(a.who)} · <strong className="font-display">{t(a.name)}</strong>
                  </span>
                ))}
              </div>
            </>
          )}
          {shownRows.length > 0 && (
            <table className={`w-full text-[14px] tabular-nums ${awards.length ? 'mt-4' : ''}`}>
              <caption className="mb-2 text-left">
                <SectionTitle title={t('Kim Ne Yaptı')} tone="var(--color-teal)" />
              </caption>
              <thead>
                <tr className="text-[12px] text-muted">
                  <th className="py-1 text-left font-bold">
                    <span className="sr-only">{t('Kim Ne Yaptı')}</span>
                  </th>
                  <th className="py-1 text-right font-bold text-accent">{who(0)}</th>
                  <th className="py-1 text-right font-bold text-gold">{who(1)}</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map(([name, f], i) => (
                  <tr key={name} className={i % 2 ? '' : 'bg-panel-2/60'}>
                    <td className="px-1 py-1 text-cream/85">{name}</td>
                    <td className="px-1 py-1 text-right text-cream">{f(result.share[0])}</td>
                    <td className="px-1 py-1 text-right text-cream">{f(result.share[1])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Overlay>
  )
}
