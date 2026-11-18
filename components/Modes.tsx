'use client'

import { useState } from 'react'
import Portrait from '@/components/Portrait'
import { BossFigure, DogFigure } from '@/components/Figures'
import { ItemIcon } from '@/components/HudBits'
import { Board } from '@/components/ScoreBoard'
import { Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { CourseScene } from '@/components/MapThumb'
import { FAMILIES, Heat, RULE_ART, RuleIcon, rulePerks, type RuleFamily } from '@/components/RuleArt'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { ALL_CHALLENGES, CHALLENGES, RAGE_COURSES, challengeLevel } from '@/game/challenges'
import { useLastWinner } from '@/components/Tournament'
import { LEVELS } from '@/game/levels'
import type { LevelDef } from '@/game/types'
import { DAILY_RULES, RAGE_RULES, RULES, tournamentFor, tournamentTotal, tournamentWeek, type TournamentMark, DUEL_HANDICAPS, DUEL_PENALTIES, duelResult, duelWins, liveStreak, type DuelTerms, roundWinner, ruleFits, ruleKey, ruleLimit, type DailyMark, type DailyRule, type DailyRun, type DuelRounds } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Yan yana yarışta bitiremeyen oyuncunun skoru: her gerçek süreden büyük */
export const DNF = 1e9

/** Kurulum ve sonuç ekranlarının başlığı: ad, altında ne işe yaradığını söyleyen tek cümle; sağda isteğe bağlı bilgi ve Geri */
export function SetupHead({ title, note, side, onBack }: { title: React.ReactNode; note?: React.ReactNode; side?: React.ReactNode; onBack?: () => void }) {
  const t = useT()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{title}</h2>
        {note && <p className="mt-1.5 text-[14px] leading-snug text-muted short:hidden">{note}</p>}
      </div>
      {(side || onBack) && (
        <div className="flex shrink-0 items-center gap-2">
          {side}
          {onBack && (
            <button data-back className="pixel-btn back-btn whitespace-nowrap" onClick={onBack}>
              {ic(t('← Geri'))}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Modlar: Günlük Meydan Okuma, Kurallı Koşu, Mücadeleler, Düello, Boss Rush, Maraton. Her kart ne olduğunu, kuralını ve oyuncunun durumunu söyler. */
export function ModesHub({
  daily,
  mark,
  today,
  bossesBeaten,
  rushNeeds,
  rushBest,
  rushPlus,
  onDaily,
  onDailyBoard,
  onDuel,
  onCoop,
  onRush,
  marathonOpen,
  marathonBest,
  onMarathon,
  onRules,
  ruleCount,
  onRage,
  onChase,
  chaseCities,
  dailyUsed,
  tried,
  onRageCourses,
  rageCoursesDone,
  rulesOpen,
  onChallenges,
  challengeDone,
  onTournament,
  tournament,
  onMirror,
  mirrorOpen,
  mirrorDone,
  onTour,
  tourBest,
  aynaTourBest,
  onBack,
}: {
  daily: DailyRun
  mark: DailyMark | null | undefined
  today: string
  bossesBeaten: number
  rushNeeds: number
  rushBest: { timeMs: number; bosses: number } | null
  /** Kâbus ve Çifte Boss Rush rekorları */
  rushPlus: Record<string, { timeMs: number; bosses: number }>
  onDaily: () => void
  onDailyBoard: () => void
  onDuel: () => void
  onCoop: () => void
  onRush: (variant?: 'kabus' | 'cifte') => void
  marathonOpen: boolean
  marathonBest: { timeMs: number } | null
  onMarathon: () => void
  onRules: () => void
  /** Kurallı Koşu'da yazılmış rekor sayısı */
  ruleCount: number
  onRage: () => void
  /** Kovalamaca: Sinir Bozucu seçim ekranı Kovalamaca seçili açılır */
  onChase: () => void
  /** Kovalamaca'nın açıldığı ve bitirilmiş şehir sayısı */
  chaseCities: number
  /** bugünün günlük hakkı kullanıldı (başlandı ya da bitti) */
  dailyUsed: boolean
  /** en az bir şehirde rekoru olan kurallar (simge panosunda parlar) */
  tried: string[]
  onRageCourses: () => void
  /** bitirilen Öfke Parkuru sayısı */
  rageCoursesDone: number
  /** en az bir şehir bitirildi mi (Kurallı Koşu bitirilen şehirlerde açılır) */
  rulesOpen: boolean
  onChallenges: () => void
  /** bitirilen mücadele sayısı */
  challengeDone: number
  onTournament: () => void
  tournament: TournamentMark | null
  onMirror: () => void
  /** otuz şehir bitti mi (Ayna Yolu açık) */
  mirrorOpen: boolean
  mirrorDone: number
  /** speedrun tam turları (ilk defter bitince açık; mirrorOpen ile aynı koşul) */
  onTour: (kind: 'tur' | 'aynaTur') => void
  tourBest: { timeMs: number } | null
  aynaTourBest: { timeMs: number } | null
  onBack: () => void
}) {
  const winner = useLastWinner(today)
  const week = tournamentWeek(today)
  const tIds = tournamentFor(week)
  const tDone = tournament?.week === week ? tIds.filter((id) => tournament.best[id] !== undefined).length : 0
  const tTotal = tournamentTotal(tournament, week)
  const t = useT()
  const lv = LEVELS.find((l) => l.id === daily.levelId)!
  const rule = DAILY_RULES[daily.rule]
  const streak = liveStreak(mark, today)
  const playedToday = mark?.day === today
  const rushOpen = bossesBeaten >= rushNeeds
  const rageTried = RAGE_RULES.filter((r) => tried.includes(r)).length
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-5 short:py-3 wide:max-w-[min(1240px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Modlar')}</h2>
            <p className="mt-1.5 text-[14px] text-muted short:hidden">{t('Yolun dışında: ilerlemene ve şehir rekorlarına dokunmaz.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2">
          {/* Bugün: tam genişlikte tek şerit. Günlük (ekranın tek dolu düğmesi) ve Haftalık Turnuva */}
          <section className="mode-card today grid gap-x-6 gap-y-3 p-4 short:p-3 sm:grid-cols-[1.35fr_1fr] [--tone:var(--color-gold)]">
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#d9a441,0_0_0_6px_rgba(217,164,65,0.15)] short:h-10 short:w-10">
                  <ItemIcon city={lv.city} taken size={36} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gold">{t('Günlük Meydan Okuma')}</p>
                  <p className="truncate font-display text-[26px] leading-tight text-cream short:text-xl">{displayName(lv)}</p>
                </div>
                <div className="hidden shrink-0 gap-4 text-center sm:flex">
                  <div>
                    <p className="font-display text-[20px] leading-none tabular-nums text-cream">{playedToday ? formatTime(mark!.bestMs) : '—'}</p>
                    <p className="mt-1 text-[12px] text-muted">{t('Bugünkü Skorun')}</p>
                  </div>
                  <div>
                    <p className="font-display text-[20px] leading-none tabular-nums text-cream">{streak ? `🔥 ${streak}` : '—'}</p>
                    <p className="mt-1 text-[12px] text-muted">{t('Gün Serisi')}</p>
                  </div>
                </div>
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[14px] leading-snug text-cream/85">
                <span className="mt-0.5 shrink-0 text-accent-2">
                  <RuleIcon rule={daily.rule} size={16} />
                </span>
                <span>
                  <strong className="text-accent-2">{t(rule.name)}:</strong> {t(rule.text)}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="pixel-btn primary justify-center px-6" onClick={onDaily} disabled={dailyUsed} autoFocus={!dailyUsed}>
                  {dailyUsed ? t('Yarın Yeni Şehir') : ic(t('▶ Oyna'))}
                </button>
                <button className="pixel-btn justify-center px-3" onClick={onDailyBoard}>
                  {t('Sıralama')}
                </button>
                <span className="text-[13px] text-muted short:hidden">{dailyUsed && !playedToday ? t('Bugünkü koşunu yarıda bıraktın. Yarın yeni bir şehir seni bekliyor.') : t('Herkes aynı şehirde, aynı kuralla. Günde tek hak.')}</span>
              </div>
            </div>
            {/* Haftalık Turnuva: şeridin sağ yarısı */}
            <button className="flex min-w-0 flex-col justify-between border-l-0 border-line/70 text-left sm:border-l-2 sm:pl-6" onClick={onTournament}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-gold">{t('Haftalık Turnuva')}</span>
                <span className="text-[13px] font-bold tabular-nums text-cream/80">{tTotal ? formatTime(tTotal) : t('{n}/3 bitti', { n: tDone })}</span>
              </span>
              <span className="mt-2 flex gap-2">
                {tIds.map((id) => {
                  const c = CHALLENGES.find((x) => x.id === id)
                  const lvl = LEVELS.find((l) => l.id === c?.level)
                  const done = tournament?.week === week && tournament.best[id] !== undefined
                  return lvl && c ? (
                    <span key={id} className={`flex min-w-0 flex-1 items-center gap-2 border-2 px-2 py-1.5 ${done ? 'border-gold/60 bg-gold/10' : 'border-line bg-ink/40'}`}>
                      <ItemIcon city={lvl.city} taken={done} size={18} />
                      <span className="truncate text-[13px] text-cream/85">{t(c.name)}</span>
                    </span>
                  ) : null
                })}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate text-muted">{winner ? t('Geçen hafta: {name}', { name: winner.name }) : t('Aynı üç parkur, toplam süre sıralanır.')}</span>
                <span className="shrink-0 font-bold text-gold">{t('Turnuvaya Gir')} ›</span>
              </span>
            </button>
          </section>

          {/* bütün modlar tek ızgarada; aile rengi kutucuğun sol şeridinde (turkuaz birlikte, kiremit meydan okuma, çivit yol) */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 wide:grid-cols-4 short:mt-3">
            <ModeTile
              tone="var(--color-teal)"
              title={t('Co-op')}
              desc={t('İki yolcu birlikte, tek klavyede.')}
              status={t('Şehir, boss ya da parkur')}
              onClick={onCoop}
              art={
                <span className="flex items-end">
                  <Portrait id="uktun" className="w-[30px] rotate-[-5deg]" />
                  <Portrait id="memo" className="-ml-2 w-[30px] rotate-[5deg]" />
                </span>
              }
            />
            <ModeTile
              tone="var(--color-teal)"
              title={t('Düello')}
              desc={t('Yan yana ya da sırayla yarış.')}
              status={t('1, 3 ya da 5 tur')}
              onClick={onDuel}
              art={
                <span className="relative flex items-end">
                  <Portrait id="uktun" className="w-[30px] rotate-[-6deg]" />
                  <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-display text-[12px] text-accent-2 [text-shadow:0_2px_0_#0e0d22]">vs</span>
                  <Portrait id="memo" className="-ml-1 w-[30px] rotate-[6deg]" />
                </span>
              }
            />
            <ModeTile
              tone="var(--color-coral)"
              title={t('Kovalamaca')}
              desc={t('Bir Kangal izini sürüyor.')}
              status={chaseCities ? t('{n} şehirde açık', { n: chaseCities }) : t('Bir şehri bitirince açılır')}
              locked={!chaseCities}
              onClick={onChase}
              art={<DogFigure className={`h-[38px] w-[54px] ${chaseCities ? '' : 'opacity-40 grayscale'}`} />}
            />
            <ModeTile
              tone="var(--color-coral)"
              title={t('Sinir Bozucu')}
              desc={t('On dokuz zorlu mod.')}
              status={!rulesOpen ? t('Bir şehri bitirince açılır') : t('{n}/{total} denendi', { n: rageTried, total: RAGE_RULES.length })}
              progress={rulesOpen ? rageTried / RAGE_RULES.length : undefined}
              locked={!rulesOpen}
              onClick={onRage}
              extra={
                RAGE_COURSES.length > 0 && (
                  <TileChip disabled={!rulesOpen} onClick={onRageCourses} title={t('Öfke Parkurları: {n}/{m}', { n: rageCoursesDone, m: RAGE_COURSES.length })}>
                    {t('Parkurlar')}
                  </TileChip>
                )
              }
              art={
                <span className="grid grid-cols-2 gap-0.5">
                  {(['kaygan', 'basasagi', 'karanlik', 'cehennem'] as DailyRule[]).map((r) => (
                    <span key={r} className="flex h-[19px] w-[19px] items-center justify-center rounded-sm" style={{ color: FAMILIES[RULE_ART[r].family].color, background: `${FAMILIES[RULE_ART[r].family].color}1f` }}>
                      <RuleIcon rule={r} size={14} />
                    </span>
                  ))}
                </span>
              }
            />
            <ModeTile
              tone="var(--color-coral)"
              title={t('Boss Rush')}
              desc={t('Yendiğin boss’lar arka arkaya.')}
              status={rushOpen ? (rushBest ? t('Rekor {time}', { time: formatTime(rushBest.timeMs) }) : t('{n} boss hazır', { n: bossesBeaten })) : t('{k}/{n} boss yen, açılsın', { n: rushNeeds, k: bossesBeaten })}
              locked={!rushOpen}
              onClick={() => onRush()}
              extra={
                <>
                  <TileChip disabled={!rushOpen} onClick={() => onRush('kabus')} title={rushPlus.kabus ? t('Rekor: {time} · {n} boss', { time: formatTime(rushPlus.kabus.timeMs), n: rushPlus.kabus.bosses }) : t('Her boss en yüksek kademede ve %30 hızlı.')}>
                    {t('Kâbus')}
                  </TileChip>
                  <TileChip disabled={!rushOpen} onClick={() => onRush('cifte')} title={rushPlus.cifte ? t('Rekor: {time} · {n} boss', { time: formatTime(rushPlus.cifte.timeMs), n: rushPlus.cifte.bosses }) : t('Her arenada iki boss birden.')}>
                    {t('Çifte')}
                  </TileChip>
                </>
              }
              art={<BossFigure city="istanbul" className={`h-[40px] w-[50px] ${rushOpen ? '' : 'opacity-40 grayscale'}`} />}
            />
            <ModeTile
              tone="var(--color-coral)"
              title={t('Maraton')}
              desc={t('Rastgele üç şehir, tek nefeste.')}
              status={marathonOpen ? (marathonBest ? t('Rekor {time}', { time: formatTime(marathonBest.timeMs) }) : t('Her koşuda başka üç şehir')) : t('Üç şehir açınca açılır')}
              locked={!marathonOpen}
              onClick={onMarathon}
              art={
                <span className="flex -space-x-1.5">
                  {(['istanbul', 'konya', 'trabzon'] as const).map((c) => (
                    <span key={c} className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#37337a]">
                      <ItemIcon city={c} taken={marathonOpen} size={15} />
                    </span>
                  ))}
                </span>
              }
            />
            <ModeTile
              tone="var(--color-accent)"
              title={t('Kurallı Koşu')}
              desc={t('Şehri ve kuralı sen seç.')}
              status={!rulesOpen ? t('Bir şehri bitirince açılır') : ruleCount ? t('{n} rekor', { n: ruleCount }) : t('Yedi kural')}
              locked={!rulesOpen}
              onClick={onRules}
              art={
                <span className="grid grid-cols-2 gap-0.5 text-accent-2">
                  {(['tekcan', 'zaman', 'dashsiz', 'hiz'] as DailyRule[]).map((r) => (
                    <span key={r} className="flex h-[19px] w-[19px] items-center justify-center rounded-sm bg-accent/10">
                      <RuleIcon rule={r} size={14} />
                    </span>
                  ))}
                </span>
              }
            />
            <ModeTile
              tone="var(--color-accent)"
              title={t('Mücadeleler')}
              desc={t('Zor şehirlerin en sıkı yerleri.')}
              status={t('{n}/{m} bitti', { n: challengeDone, m: CHALLENGES.length })}
              progress={challengeDone / CHALLENGES.length}
              onClick={onChallenges}
              art={<span className="font-display text-[24px] leading-none text-accent-2">▲</span>}
            />
            <ModeTile
              tone="var(--color-accent-2)"
              title={t('Ayna Yolu')}
              desc={t('Otuz şehir sağdan sola.')}
              status={mirrorOpen ? (mirrorDone ? t('{n} ayna rekoru', { n: mirrorDone }) : t('Kapı açık')) : t('Otuz şehri bitirince açılır')}
              locked={!mirrorOpen}
              onClick={onMirror}
              art={
                <span className={`flex items-end ${mirrorOpen ? '' : 'opacity-40 grayscale'}`}>
                  <Portrait id="uktun" className="w-[27px]" />
                  <Portrait id="uktun" className="w-[27px] -scale-x-100 opacity-55" />
                </span>
              }
            />
            <ModeTile
              tone="var(--color-gold)"
              title={t('Speedrun')}
              desc={t('Otuz şehir arka arkaya, tek süre.')}
              status={mirrorOpen ? (tourBest ? t('Tam Tur {time}', { time: formatTime(tourBest.timeMs) }) : t('Rekorunu yaz')) : t('Otuz şehri bitirince açılır')}
              locked={!mirrorOpen}
              onClick={() => onTour('tur')}
              extra={
                <TileChip disabled={!mirrorOpen} onClick={() => onTour('aynaTur')} title={aynaTourBest ? formatTime(aynaTourBest.timeMs) : undefined}>
                  {t('Aynalı')}
                </TileChip>
              }
              art={<RuleIcon rule="zaman" size={28} className="text-gold" />}
            />
            <ModeTile
              tone="var(--color-accent-2)"
              title={t('Bölüm Düzenleyici')}
              desc={t('Kendi bölümünü ve boss’unu çiz.')}
              status={t('Paylaş ya da yayınla')}
              href="/duzenle"
              art={<span className="font-display text-[26px] leading-none text-accent-2">✎</span>}
            />
            <ModeTile
              tone="var(--color-gold)"
              title={t('Topluluk Haritaları')}
              desc={t('Yolcuların çizdiği yollar.')}
              status={t('Oyna ve beğen')}
              href="/haritalar"
              art={<span className="font-display text-[26px] leading-none text-gold">⌂</span>}
            />
          </div>
        </div>
      </div>
    </Overlay>
  )
}

/**
 * Modun kutucuğu: soldaki çizim, ad, tek cümle ve durum. Kutucuğun tamamı modu açar (tek tıklama); `extra` aynı modun
 * ikinci yolları (Parkurlar, Kâbus, Çifte, Aynalı) küçük düğmeler olarak kutucuğun içinde durur.
 */
function ModeTile({ tone, title, desc, status, art, onClick, href, locked = false, progress, extra }: { tone: string; title: string; desc: string; status: string; art: React.ReactNode; onClick?: () => void; /** sayfa bağlantısı (düzenleyici, topluluk) */ href?: string; locked?: boolean; progress?: number; extra?: React.ReactNode }) {
  return (
    <div className={`mode-tile relative flex min-w-0 items-center gap-2.5 px-2.5 py-2.5 ${locked ? 'locked' : ''}`} style={{ ['--tone' as string]: tone }}>
      {/* bütün kutucuğu kaplayan asıl düğme; ek düğmeler onun üstünde */}
      {href ? <a className="absolute inset-0 z-0" href={href} aria-label={title} /> : <button className="absolute inset-0 z-0" onClick={onClick} disabled={locked} aria-label={`${title}: ${status}`} />}
      <span className="pointer-events-none flex h-11 w-12 shrink-0 items-center justify-center">{art}</span>
      <span className="pointer-events-none min-w-0 flex-1">
        <span className="flex items-center justify-between gap-1.5">
          <span className="truncate font-display text-[16px] leading-tight text-cream">{title}</span>
          {extra && <span className="pointer-events-auto relative z-10 flex shrink-0 gap-1">{extra}</span>}
        </span>
        <span className="mt-0.5 block truncate text-[13px] leading-snug text-cream/75">{desc}</span>
        <span className="mt-1 flex items-center gap-2">
          <span className={`truncate text-[12px] font-bold ${locked ? 'text-muted' : 'text-[var(--tone)]'}`}>{locked ? `🔒 ${status}` : status}</span>
          {progress !== undefined && (
            <span className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-ink/70" aria-hidden>
              <span className="block h-full rounded-full bg-[var(--tone)]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
          )}
        </span>
      </span>
    </div>
  )
}

/** kutucuğun içindeki ikincil yol (ör. Kâbus, Parkurlar) */
function TileChip({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button className="tile-chip whitespace-nowrap px-1.5 py-0.5 text-[11px] font-bold leading-tight" onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

export interface DailyResult {
  run: DailyRun
  timeMs: number
  deaths: number
  found: number
  scoreMs: number
  /** bugünkü en iyi skor (serbest koşuda: rekor) tazelendi */
  best: boolean
  mark: DailyMark
  /** serbest Kurallı Koşu: günlük sıralama yok, rekor cihazda */
  free?: boolean
  /** kaçıncı denemede bitti (Tek Can, Zamana Karşı) */
  tries?: number
}

/** Günlük bitiş: skorun nasıl hesaplandığı satır satır, günlük sıralama ve yeniden deneme */
export function DailyEnd({ result, player, status, rank, onRetry, onModes, onLogin }: { result: DailyResult; player: string; status: 'idle' | 'sending' | 'sent' | 'error'; rank: number | null; /** yalnız serbest Kurallı Koşu'da: günlükte tek hak */ onRetry?: () => void; onModes: () => void; onLogin: () => void }) {
  const t = useT()
  const lng = useLang()
  const rule = DAILY_RULES[result.run.rule]
  const fam = FAMILIES[RULE_ART[result.run.rule].family]
  const lv = localize(LEVELS.find((l) => l.id === result.run.levelId)!, lng)
  // skorun hesabı: cezalar yalnız varsa yazılır; ceza yoksa skor sürenin kendisidir, aynı sayı tekrar edilmez
  const penalties: [string, string][] = [
    ...(rule.perDeath && result.deaths ? ([[t('{n} düşüş × {s} sn', { n: result.deaths, s: rule.perDeath }), `+${result.deaths * rule.perDeath} sn`]] as [string, string][]) : []),
    ...(rule.perMissing && result.found < 3 ? ([[t('{n} eksik hatıra × {s} sn', { n: 3 - result.found, s: rule.perMissing }), `+${(3 - result.found) * rule.perMissing} sn`]] as [string, string][]) : []),
  ]
  const lines: [string, string][] = penalties.length ? [[t('Süre'), formatTime(result.timeMs)], ...penalties] : []
  const cleanNote = rule.perDeath || rule.perMissing ? t('Cezasız bitirdin: skorun süren kadar.') : t('Bu kuralda ceza yok: skorun süren.')
  // koşunun özeti: skorla aynı sayıyı yinelemez (rekor bu koşuysa en iyi yerine düşüş yazılır)
  const stats: [string, string][] = [
    ...(result.best ? [] : ([[result.free ? t('Rekorun') : t('En İyin'), formatTime(result.mark.bestMs)]] as [string, string][])),
    ...(result.free ? [] : ([[t('Gün Serisi'), String(result.mark.streak)]] as [string, string][])),
    [t('Düşüş'), String(result.deaths)],
    (result.tries ?? 1) > 1 ? [t('Deneme'), String(result.tries)] : [t('Hatıra'), `${result.found}/3`],
  ].slice(0, 3) as [string, string][]
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-xl flex-col p-5 sm:p-6 short:grid short:max-w-[min(900px,100%)] short:grid-cols-2 short:gap-5 short:py-3 wide:grid wide:max-w-[min(940px,100%)] wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] wide:gap-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{displayName(lv)}</h2>
            {result.best && <span className="border-2 border-gold/60 bg-gold/10 px-2 py-0.5 text-[13px] font-bold text-gold">{result.free ? t('★ Yeni Rekor') : t('★ Bugünün En İyisi')}</span>}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted">
            <span style={{ color: fam.color }}>
              <RuleIcon rule={result.run.rule} size={16} />
            </span>
            {result.free ? t('Kurallı Koşu') : t('Günlük Meydan Okuma')} · <span className="text-cream">{t(rule.name)}</span>
          </p>
          {/* skor: büyük; altında nasıl hesaplandığı satır satır */}
          <div className="mt-4 border-2 border-line bg-ink/40 px-4 py-3 tabular-nums short:mt-2 short:py-2">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-bold text-gold">{t('Skor')}</span>
              <span className="font-display text-5xl leading-none text-cream short:text-4xl">{formatTime(result.scoreMs)}</span>
            </p>
            <div className="mt-2 border-t-2 border-line pt-1.5 text-[13px]">
              {lines.length ? (
                lines.map(([k, v]) => (
                  <p key={k} className="flex justify-between gap-3 py-0.5 text-cream/85">
                    <span>{k}</span>
                    <span>{v}</span>
                  </p>
                ))
              ) : (
                <p className="py-0.5 text-cream/85">{cleanNote}</p>
              )}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 short:hidden">
            {stats.map(([k, v]) => (
              <div key={k} className="opt-card px-2 py-2 text-center">
                <p className="font-display text-lg leading-none tabular-nums text-cream">{v}</p>
                <p className="mt-1 text-[12px] leading-tight text-muted">{k}</p>
              </div>
            ))}
          </div>
          {!result.free && (
            <p className="mt-3 min-h-[20px] text-[13px] short:mt-1.5">
              {!player ? (
                <button className="text-gold underline underline-offset-4" onClick={onLogin}>
                  {t('Sıralamaya girmek için giriş yap')}
                </button>
              ) : status === 'sending' ? (
                <span className="text-muted">{t('Skorun kaydediliyor…')}</span>
              ) : status === 'error' ? (
                <span className="text-accent-2">{t('Skor kaydedilemedi. Bağlantını kontrol et ya da yeniden giriş yap.')}</span>
              ) : status === 'sent' && rank ? (
                <strong className="text-gold">{t('Bugünün sıralamasında {rank}. sıradasın.', { rank })}</strong>
              ) : null}
            </p>
          )}
          <div className={`mt-4 grid gap-2.5 short:mt-2 ${onRetry ? 'grid-cols-2' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
            {onRetry ? (
              <button className="pixel-btn primary justify-center whitespace-nowrap short:py-2" onClick={onRetry} autoFocus>
                {ic(t('↺ Yeniden Dene'))}
              </button>
            ) : (
              <p className="flex items-center text-[13px] leading-snug text-muted">{t('Bugünkü hakkın bu. Yarın yeni bir şehir.')}</p>
            )}
            <button className={`pixel-btn justify-center ${onRetry ? '' : 'primary px-10'}`} onClick={onModes} autoFocus={!onRetry}>
              {t('Modlar')}
            </button>
          </div>
        </div>
        {/* sağ: günlükte bugünün sıralaması (sol sütunun boyunda, kendi içinde kayar); serbest koşuda kural */}
        <div className="mt-5 flex min-h-0 flex-1 flex-col short:mt-0 wide:relative wide:mt-0">
          {result.free ? (
            <>
              <SectionTitle title={t('Kural')} note={t(FAMILIES[RULE_ART[result.run.rule].family].name)} tone={fam.color} />
              <div className="mt-2 flex items-start gap-3 opt-card p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center" style={{ color: fam.color, background: `${fam.color}1c` }}>
                  <RuleIcon rule={result.run.rule} size={28} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-xl leading-tight text-cream">{t(rule.name)}</span>
                  <span className="mt-1 block text-[14px] leading-snug text-cream/85">{t(rule.text)}</span>
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-snug text-muted">{t('Aynı şehri başka bir kuralla dene: Modlar → Kurallı Koşu. Her kuralın rekoru ayrı tutulur.')}</p>
            </>
          ) : (
            <>
              <SectionTitle title={t('Bugünün Sıralaması')} note={t('Aynı şehir, aynı kural')} />
              <div className="overlay-scroll mt-2 min-h-[120px] flex-1 overflow-y-auto pr-1 wide:absolute wide:inset-x-0 wide:bottom-0 wide:top-8 wide:mt-0">
                <Board kind="gunluk" day={result.run.day} me={player} refresh={status === 'sent' ? 1 : 0} compact />
              </div>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}

/** Seçili kuralın önizlemesi: şehrin sahnesi, üstünde kuralın görünüşü (karanlık, ters ekran, buz, rüzgâr…) */
function RulePreview({ rule, level, className = '' }: { rule: DailyRule; level: number; className?: string }) {
  const t = useT()
  const d = DAILY_RULES[rule]
  const v = d.view ?? {}
  const fam = FAMILIES[RULE_ART[rule].family]
  const tf = [v.zoom ? `scale(${v.zoom})` : '', v.flipY ? 'scaleY(-1)' : '', v.flipX ? 'scaleX(-1)' : ''].filter(Boolean).join(' ')
  return (
    <CourseScene
      map={LEVELS[level].map}
      city={LEVELS[level].city}
      className={className}
      look={{ hiddenSpikes: v.hiddenSpikes, ghost: v.ghostGround, noFlags: d.noFlags }}
      canvasStyle={tf ? { transform: tf, transformOrigin: v.zoom ? 'var(--px) var(--py)' : 'center' } : undefined}
    >
      {d.slippery && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(150,220,255,0.05)_30%,rgba(170,230,255,0.42))] mix-blend-screen" />}
      {d.crumbleAll && <div className="rage-cracks pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" />}
      {d.lowGravity && <div className="rage-stars pointer-events-none absolute inset-0" />}
      {d.speed > 1 && <div className="rage-streak pointer-events-none absolute inset-0" />}
      {d.storm && <div className="rage-wind pointer-events-none absolute inset-0" />}
      {v.dark && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--px)_var(--py),transparent_0_9%,rgba(6,5,18,0.95)_24%)]" />}
      {/* Kovalamaca: Kangal yolun başında, yolcunun ardında */}
      {d.chase && <DogFigure className="pointer-events-none absolute bottom-[12%] left-[2%] h-[26%] w-[20%]" />}
      {d.swapKeys && (
        <span className="rage-pulse pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-[#ffd166] shadow-[0_0_0_2px_#ffd166]">
          <RuleIcon rule="ters" size={26} />
        </span>
      )}
      <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-sm bg-ink/85" style={{ color: fam.color, boxShadow: `0 0 0 2px ${fam.color}` }}>
        <RuleIcon rule={rule} size={24} />
      </span>
      {d.oneLife && (
        <span className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-1 rounded-sm bg-ink/85 px-1.5 py-0.5 text-[12px] font-bold text-[#ff7a7a]">
          <RuleIcon rule="tekcan" size={14} /> ×1
        </span>
      )}
      <span className="sr-only">{t(d.name)}</span>
    </CourseScene>
  )
}

/** Kurallı Koşu kurulumu: şehir + kural; her kuralın o şehirdeki rekoru kartında yazar */
export function RuleSetup({ rage, startLevel, startRule, finished, records, onStart, onBack }: { /** Sinir Bozucu modlar (yalnız RAGE_RULES) */ rage?: boolean; startLevel: number; /** açılışta seçili kural (Kovalamaca kartından) */ startRule?: DailyRule; /** bitirilmiş şehirlerin dizinleri: kural yalnız bir kez geçilmiş şehirde açılır */ finished: number[]; records: Record<string, number>; onStart: (level: number, rule: DailyRule) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const list: DailyRule[] = rage ? RAGE_RULES : RULES
  // istenen kural varsa ona uyan bir şehirden açılır
  const fitting = startRule ? finished.filter((i) => ruleFits(startRule, LEVELS[i])) : finished
  const [level, setLevel] = useState(fitting.includes(startLevel) ? startLevel : (fitting[0] ?? finished[0] ?? 0))
  const [rule, setRule] = useState<DailyRule>(startRule && list.includes(startRule) ? startRule : (list.find((r) => ruleFits(r, LEVELS[level])) ?? list[0]))
  const lv = localize(LEVELS[level], lng)
  const fits = ruleFits(rule, LEVELS[level])
  const done = list.filter((r) => records[ruleKey(lv.id, r)] !== undefined).length
  const def = DAILY_RULES[rule]
  const art = RULE_ART[rule]
  const fam = FAMILIES[art.family]
  const best = records[ruleKey(lv.id, rule)]
  const lim = ruleLimit(rule, LEVELS[level])
  // aileler: Sinir Bozucu beş başlık altında; Kurallı Koşu tek öbek
  const groups = (rage ? (['zemin', 'gorus', 'fizik', 'tekcan', 'karisim'] as RuleFamily[]) : (['kural'] as RuleFamily[])).map((f) => ({ f, rules: list.filter((r) => RULE_ART[r].family === f) }))
  const step = (k: number) => {
    const i = finished.indexOf(level)
    setLevel(finished[(i + k + finished.length) % finished.length])
  }
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(1080px,100%)]">
        <SetupHead
          title={rage ? t('Sinir Bozucu') : t('Kurallı Koşu')}
          note={rage ? t('Sabrını sına: her mod oyunu başka bir yerinden zorlaştırır.') : t('Aynı şehir, başka oyun: kuralı ve şehri sen seç.')}
          side={
            <span className="border-2 border-line bg-ink/40 px-2 py-1.5 text-[13px] tabular-nums text-muted max-sm:hidden">
              {t('{city}: {n}/{total}', { city: lv.name, n: done, total: list.length })}
            </span>
          }
          onBack={onBack}
        />
        <div className="mt-4 grid min-h-0 flex-1 gap-4 max-sm:grid-rows-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] short:mt-2 short:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* sol: modlar ailelerine göre; her kutucukta simge, ad, zorluk ve bu şehirdeki rekor */}
          <div className="overlay-scroll -mx-1 min-h-0 overflow-y-auto px-1">
            {groups.map(({ f, rules }) => (
              <section key={f} className="mb-3 last:mb-0">
                {rage && <SectionTitle title={t(FAMILIES[f].name)} note={t(FAMILIES[f].tagline)} tone={FAMILIES[f].color} className="mb-1.5" />}
                <div className={`grid gap-1.5 ${rage ? 'grid-cols-4' : 'grid-cols-2 max-sm:grid-cols-3'}`}>
                  {rules.map((r) => {
                    const ok = ruleFits(r, LEVELS[level])
                    const b = records[ruleKey(lv.id, r)]
                    const sel = rule === r
                    const c = FAMILIES[RULE_ART[r].family].color
                    return (
                      <button
                        key={r}
                        aria-pressed={sel}
                        disabled={!ok}
                        onClick={() => setRule(r)}
                        className={`flex min-w-0 border-2 px-1.5 py-1.5 transition-colors disabled:opacity-40 ${rage ? 'items-center gap-1.5 text-left max-sm:flex-col max-sm:gap-1 max-sm:text-center short:flex-col short:gap-0.5 short:py-1 short:text-center' : 'items-center gap-2.5 px-2 py-2 text-left max-sm:flex-col max-sm:gap-1 max-sm:text-center short:py-1'} ${sel ? '' : 'border-line bg-ink/40 hover:bg-panel-2'}`}
                        style={sel ? { borderColor: c, background: `${c}22` } : undefined}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm" style={{ color: c, background: `${c}1c` }}>
                          <RuleIcon rule={r} size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          {/* bölünmeyen uzun tek kelime (Kovalamaca) kutuya sığsın diye bir boy küçük */}
                          <span className={`block font-display leading-tight text-cream max-sm:text-[12px] ${rage ? `line-clamp-2 ${!t(DAILY_RULES[r].name).includes(' ') && t(DAILY_RULES[r].name).length >= 10 ? 'text-[12px] tracking-[-0.01em]' : 'text-[13px]'} short:text-[11px]` : 'truncate text-[16px]'}`}>{t(DAILY_RULES[r].name)}</span>
                          <span className={`mt-0.5 flex items-center gap-1.5 max-sm:justify-center short:justify-center`}>
                            <Heat n={RULE_ART[r].heat} label={t('Zorluk {n}/5', { n: RULE_ART[r].heat })} />
                            {b !== undefined ? <span className="text-[11px] tabular-nums text-gold max-sm:hidden short:hidden">★ {formatTime(b)}</span> : !ok ? <span className="text-[11px] text-muted max-sm:hidden short:hidden">{t('Bu Şehirde Yok')}</span> : null}
                          </span>
                          {!rage && <span className="mt-1 block text-[13px] leading-snug text-muted max-sm:hidden short:hidden">{t(DAILY_RULES[r].text)}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
          {/* sağ: seçilen modun canlı önizlemesi, ne değiştirdiği, şehir ve başla */}
          <section className="flex min-h-0 flex-col border-2 bg-ink/30 p-2.5" style={{ borderColor: `${fam.color}88` }}>
            <RulePreview rule={rule} level={level} className="min-h-[84px] flex-1 max-sm:h-24 max-sm:flex-none short:min-h-[60px]" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate font-display text-xl leading-tight text-cream short:text-lg">{t(def.name)}</p>
              <Heat n={art.heat} label={t('Zorluk {n}/5', { n: art.heat })} className="shrink-0 scale-125 origin-right" />
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted max-sm:hidden short:hidden">
              {t(def.text)}
              {lim ? ` ${t('Sınır: {s} sn.', { s: lim })}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {rulePerks(rule).map((p) => (
                <span key={p.text} className="flex items-center gap-1 border-2 border-line bg-ink/50 px-1.5 py-0.5 text-[12px] font-semibold text-cream/90">
                  <span style={{ color: FAMILIES[RULE_ART[p.icon].family].color }}>
                    <RuleIcon rule={p.icon} size={14} />
                  </span>
                  {t(p.text, p.vars)}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-1.5">
                <button className="pixel-btn shrink-0 px-2.5 py-2" onClick={() => step(-1)} disabled={finished.length < 2} aria-label={t('Önceki Şehir')}>
                  ‹
                </button>
                <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-2 text-[14px] text-cream outline-none focus:border-gold" aria-label={t('Şehir')}>
                  {finished.map((i) => (
                    <option key={LEVELS[i].id} value={i}>
                      {String(LEVELS[i].plate).padStart(2, '0')} · {displayName(LEVELS[i])} · {t(LEVELS[i].difficulty)}
                    </option>
                  ))}
                </select>
                <button className="pixel-btn shrink-0 px-2.5 py-2" onClick={() => step(1)} disabled={finished.length < 2} aria-label={t('Sonraki Şehir')}>
                  ›
                </button>
              </div>
              <p className="mt-1.5 flex items-center justify-between text-[13px] text-muted short:hidden">
                <span>{t('Bu şehirde rekorun')}</span>
                <span className={`font-display text-[16px] tabular-nums ${best !== undefined ? 'text-gold' : 'text-muted'}`}>{best !== undefined ? formatTime(best) : '—'}</span>
              </p>
              <button className="pixel-btn primary mt-1.5 w-full justify-center py-2.5 text-base short:py-2" disabled={!fits} onClick={() => onStart(level, rule)}>
                {fits ? ic(t('▶ Oyna')) : t('Bu Şehirde Yok')}
              </button>
            </div>
          </section>
        </div>
      </div>
    </Overlay>
  )
}

export interface DuelSetupValue {
  /** şehir (LEVELS dizini); parkurda parkurun şehri (müzik ve görünüş) */
  level: number
  names: [string, string]
  heroes: [CharacterId, CharacterId]
  bestOf: 1 | 3 | 5
  /** sırayla (rakibin hayaletiyle) ya da yan yana (bölünmüş ekranda aynı anda) */
  style: 'sirayla' | 'yanyana'
  /** mücadele parkuru (ALL_CHALLENGES kimliği): kısa ve sert düellolar; yoksa şehrin bütün yolu */
  course?: string | null
  /** şartlar; eski kurulumlarda yok (duelTerms varsayılanı verir) */
  terms?: DuelTerms
}

/** Düellonun şartları: kurulumda seçilmediyse sırayla 5 sn düşüş cezası, yan yana cezasız (eski davranış) */
export const duelTerms = (v: DuelSetupValue): DuelTerms => v.terms ?? { penalty: v.style === 'sirayla' ? 5 : 0, itemBonus: 0, handicap: [0, 0] }

/** Düellonun bölümü: parkur seçildiyse mücadele kesiti, yoksa şehir */
export function duelLevel(v: DuelSetupValue): LevelDef {
  const c = v.course ? ALL_CHALLENGES.find((x) => x.id === v.course) : undefined
  return c ? challengeLevel(c) : LEVELS[v.level]
}

/** şartların tek satırlık özeti (tur ekranı ve bitiş) */
function termsLine(v: DuelSetupValue, t: (s: string, p?: Record<string, string | number>) => string): string {
  const k = duelTerms(v)
  const parts = [k.penalty ? t('Düşüş +{n} sn', { n: k.penalty }) : t('Düşüş cezasız')]
  if (k.itemBonus) parts.push(t('Hatıra −{n} sn', { n: k.itemBonus }))
  k.handicap.forEach((h, i) => h && parts.push(t('{name} −{n} sn avantaj', { name: v.names[i], n: h })))
  return parts.join(' · ')
}

/** Düello kurulumu: iki oyuncunun adı ve kılığı, şehir ya da parkur, oynayış, tur sayısı ve şartlar */
export function DuelSetup({ initial, unlocked, finished, canSide, onStart, onBack }: { initial: DuelSetupValue; unlocked: number; /** bitirilmiş şehirler: parkurlar onlarda açılır */ finished: Set<string>; /** yan yana yarış klavye ya da oyun kolu ister: dokunmatik cihazda kapalı */ canSide: boolean; onStart: (v: DuelSetupValue) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [v, setV] = useState<DuelSetupValue>(() => {
    const base = canSide ? initial : { ...initial, style: 'sirayla' as const }
    return { ...base, terms: duelTerms(base) }
  })
  const open = LEVELS.slice(0, Math.min(unlocked, LEVELS.length - 1) + 1)
  const courses = ALL_CHALLENGES.filter((c) => finished.has(c.level))
  const terms = duelTerms(v)
  const setTerms = (p: Partial<DuelTerms>) => setV((x) => ({ ...x, terms: { ...duelTerms(x), ...p } }))
  const lv = localize(LEVELS[v.level], lng)
  const course = v.course ? courses.find((c) => c.id === v.course) : undefined
  const level = duelLevel(v)
  const pickCourse = (id: string) => {
    const c = courses.find((x) => x.id === id)
    if (c) setV((p) => ({ ...p, course: c.id, level: LEVELS.findIndex((l) => l.id === c.level) }))
  }
  const setName = (k: 0 | 1, name: string) => setV((p) => ({ ...p, names: (k === 0 ? [name, p.names[1]] : [p.names[0], name]) as [string, string] }))
  const swapHero = (k: 0 | 1) =>
    setV((p) => {
      const h = [...p.heroes] as [CharacterId, CharacterId]
      h[k] = h[k] === 'uktun' ? 'memo' : 'uktun'
      return { ...p, heroes: h }
    })
  const ready = v.names.every((n) => n.trim().length > 0)
  // seçeneklerin rengi: Düello'nun ailesi turkuaz (Modlar'daki kutucuğu gibi)
  const tone = { '--tone': 'var(--color-teal)' } as React.CSSProperties
  const select = 'min-w-0 flex-1 border-2 border-line bg-ink px-2.5 py-2 text-[15px] text-cream outline-none focus:border-gold'
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(1000px,100%)]" style={tone}>
        <SetupHead title={t('Düello')} note={t('İki yolcu aynı yolda yarışır; düşük skor turu alır.')} onBack={onBack} />
        <div className="overlay-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2 short:grid short:grid-cols-2 short:gap-4 wide:grid wide:grid-cols-2 wide:gap-6">
          <div className="grid content-start gap-4">
            <section>
              <SectionTitle title={t('Yarışanlar')} note={t('Portreye dokun, kılığı değiştir')} tone="var(--color-teal)" />
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                {([0, 1] as const).map((k) => (
                  <div key={k} className={`border-2 bg-ink/30 p-2.5 ${k === 0 ? 'border-accent/70' : 'border-gold/70'}`}>
                    <div className="flex items-center gap-2.5">
                      <button type="button" className="shrink-0 transition-transform hover:-rotate-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" onClick={() => swapHero(k)} aria-label={t('Kılığı Değiştir')} title={CHARACTERS[v.heroes[k]].short}>
                        <Portrait id={v.heroes[k]} className="w-[48px] short:w-[36px]" />
                      </button>
                      <label className="min-w-0 flex-1">
                        <span className={`block text-[12px] font-semibold ${k === 0 ? 'text-accent-2' : 'text-gold'}`}>{t('{n}. Oyuncu', { n: k + 1 })}</span>
                        <input value={v.names[k]} maxLength={16} onChange={(e) => setName(k, e.target.value)} className="mt-0.5 block w-full border-2 border-line bg-ink px-2 py-1.5 font-display text-[16px] text-cream outline-none focus:border-gold" />
                      </label>
                    </div>
                    {/* avantaj: bu oyuncunun skorundan baştan düşülen saniye (farklı yaşlar, farklı eller) */}
                    <div className="mt-2 flex items-center gap-2 max-sm:flex-col max-sm:items-stretch max-sm:gap-1" role="group" aria-label={t('Avantaj')}>
                      <span className="shrink-0 text-[13px] text-muted" title={t('Skorundan baştan düşülen saniye')}>
                        {t('Avantaj')}
                      </span>
                      <div className="grid flex-1 grid-cols-4 gap-1">
                        {DUEL_HANDICAPS.map((h) => (
                          <button key={h} aria-pressed={terms.handicap[k] === h} className="seg-opt py-1 text-[13px] tabular-nums" onClick={() => setTerms({ handicap: (k === 0 ? [h, terms.handicap[1]] : [terms.handicap[0], h]) as [number, number] })}>
                            {h ? `−${h}` : '0'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <SectionTitle title={t('Oynayış')} note={canSide ? t('Aynı anda ya da elden ele') : t('Bu cihazda elden ele')} tone="var(--color-teal)" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['sirayla', 'yanyana'] as const).map((k) => (
                  <button key={k} aria-pressed={v.style === k} disabled={k === 'yanyana' && !canSide} className="seg-opt px-3 py-2 text-left" onClick={() => setV((p) => ({ ...p, style: k }))}>
                    <span className="block font-display text-[16px] leading-tight">{k === 'sirayla' ? t('Sırayla') : t('Yan Yana')}</span>
                    <span className="block text-[12px] leading-snug text-muted short:hidden">{k === 'sirayla' ? t('Tek cihaz, rakibin hayaletiyle') : t('Bölünmüş ekran, aynı anda')}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-muted">
                {!canSide
                  ? t('Tek cihaz elden ele: ikinci koşan rakibinin hayaletini görür. Yan yana yarış klavye ya da oyun kolu ister.')
                  : v.style === 'sirayla'
                    ? t('Tek cihaz elden ele: ikinci koşan rakibinin hayaletini görür. Telefonda da oynanır.')
                    : t('Ekran ikiye bölünür, aynı anda koşarsınız. Klavye (WASD + Shift, ok tuşları + Enter) ya da iki oyun kolu gerekir.')}
              </p>
            </section>
            <section>
              <SectionTitle title={t('Tur')} note={t('Turların yarısından fazlasını alan kazanır')} tone="var(--color-teal)" />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([1, 3, 5] as const).map((b) => (
                  <button key={b} aria-pressed={v.bestOf === b} className="seg-opt py-1.5 font-display text-[15px]" onClick={() => setV((p) => ({ ...p, bestOf: b }))}>
                    {b === 1 ? t('Tek Tur') : t('{n} Tur', { n: b })}
                  </button>
                ))}
              </div>
            </section>
          </div>
          <div className="mt-4 grid content-start gap-4 short:mt-0 wide:mt-0">
            {/* yol: şehrin bütünü ya da mücadele parkuru (kısa, sert) */}
            <section style={{ '--tone': 'var(--color-gold)' } as React.CSSProperties}>
              <SectionTitle title={t('Yol')} note={t('Şehrin bütünü ya da kısa bir parkur')} />
              <div className="mt-2 grid grid-cols-2 gap-2" role="tablist">
                <button role="tab" aria-selected={!v.course} className="seg-opt py-1.5 font-display text-[15px]" onClick={() => setV((p) => ({ ...p, course: null }))}>
                  {t('Şehir')}
                </button>
                <button role="tab" aria-selected={!!v.course} disabled={!courses.length} className="seg-opt py-1.5 font-display text-[15px]" onClick={() => courses[0] && pickCourse(course?.id ?? courses[0].id)}>
                  {courses.length ? t('Parkur') : t('Parkur · Kilitli')}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {v.course ? (
                  <select value={course?.id ?? ''} onChange={(e) => pickCourse(e.target.value)} className={select} aria-label={t('Parkur')}>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {RAGE_COURSES.includes(c) ? '🔥 ' : '▲ '}
                        {t(c.name)} · {LEVELS.find((l) => l.id === c.level)!.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select value={v.level} onChange={(e) => setV((p) => ({ ...p, level: Number(e.target.value) }))} className={select} aria-label={t('Şehir')}>
                    {open.map((l, i) => (
                      <option key={l.id} value={i}>
                        {String(l.plate).padStart(2, '0')} · {displayName(l)} · {t(l.difficulty)}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="pixel-btn shrink-0 px-3 py-2 text-[13px]"
                  onClick={() => (v.course ? pickCourse(courses[Math.floor(Math.random() * courses.length)].id) : setV((p) => ({ ...p, level: Math.floor(Math.random() * open.length) })))}
                >
                  {ic(t('🎲 Rastgele'))}
                </button>
              </div>
              <CourseScene map={level.map} city={level.city} className="mt-2 h-[clamp(80px,17vh,150px)] max-sm:hidden short:hidden" />
              <p className="mt-1.5 text-[13px] leading-snug text-muted">
                {v.course ? t('Kısa ve sert: zor şehrin en sıkı yeri, bayraksız.') : lv.subtitle} · <span className="whitespace-nowrap font-semibold text-gold">{t('Altın süre {s} sn', { s: level.medals[0] })}</span>
              </p>
            </section>
            <section>
              <SectionTitle title={t('Şartlar')} note={t('Skoru neyin değiştireceği')} tone="var(--color-teal)" />
              <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[14px]">
                <span className="text-cream">{t('Düşüş Cezası')}</span>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t('Düşüş Cezası')}>
                  {DUEL_PENALTIES.map((n) => (
                    <button key={n} aria-pressed={terms.penalty === n} className="seg-opt py-1.5 text-[13px]" onClick={() => setTerms({ penalty: n })}>
                      {n ? `+${n} ${t('sn')}` : t('Yok')}
                    </button>
                  ))}
                </div>
                <span className="text-cream">{t('Hatıra Avı')}</span>
                <button role="switch" aria-checked={!!terms.itemBonus && !v.course} disabled={!!v.course} className="seg-opt flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px]" onClick={() => setTerms({ itemBonus: terms.itemBonus ? 0 : 5 })}>
                  <span>{v.course ? t('Parkurda hatıra yok') : terms.itemBonus ? t('Açık: her hatıra skordan 5 sn düşer') : t('Kapalı: yalnız süre')}</span>
                  <span className="px-switch shrink-0" data-on={!!terms.itemBonus && !v.course} />
                </button>
              </div>
            </section>
          </div>
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-2 short:mt-2 wide:flex-row wide:items-center wide:gap-5">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted short:hidden">{t('Skor: süre, artı düşüş cezası, eksi hatıra ve avantaj. Düşük skor turu alır.')}</p>
          <button className="pixel-btn primary w-full justify-center py-2.5 text-base short:py-2 wide:w-[320px] wide:shrink-0" disabled={!ready} onClick={() => onStart({ ...v, names: [v.names[0].trim(), v.names[1].trim()], terms: v.course ? { ...terms, itemBonus: 0 } : terms })}>
            {ic(t('▶ Düelloyu Başlat'))}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Sıra el değiştiriyor: kim koşacak, rakip ne yaptı */
export function DuelTurn({ setup, rounds, round, turn, onGo, onQuit }: { setup: DuelSetupValue; rounds: DuelRounds; round: number; turn: 0 | 1; onGo: () => void; onQuit: () => void }) {
  const t = useT()
  const other = (1 - turn) as 0 | 1
  const rival = rounds[round]?.[other]
  const wins = duelWins(rounds)
  const level = duelLevel(setup)
  const terms = duelTerms(setup)
  const both = setup.style === 'yanyana'
  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-md p-5 text-center sm:p-6 short:py-3">
        <p className="text-[13px] text-muted">
          {t('Düello')} · <span className="text-cream">{setup.course ? t(level.name) : level.name}</span> · {setup.bestOf === 1 ? t('Tek Tur') : t('{n}. Tur', { n: round + 1 })}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 short:mt-1.5">
          {([0, 1] as const).map((k) => (
            <div key={k} className={`flex flex-col items-center ${both || k === turn ? '' : 'opacity-45'}`}>
              <Portrait id={setup.heroes[k]} className={`w-[72px] short:w-[40px] ${both ? (k === 0 ? 'rotate-[-3deg]' : 'rotate-[3deg]') : k === turn ? 'rotate-[-3deg]' : ''}`} />
              <p className="mt-1 max-w-[110px] truncate font-display text-[15px] text-cream">{setup.names[k]}</p>
              {setup.bestOf > 1 && <p className="font-display text-xl text-gold">{wins[k]}</p>}
            </div>
          ))}
        </div>
        <h2 className="mt-3 font-display text-3xl text-cream short:text-2xl">{both ? t('Yan Yana Yarış') : t('Sıra Sende, {name}', { name: setup.names[turn] })}</h2>
        <p className="mt-1.5 text-[14px] text-cream/85">
          {both
            ? t('Solda {a}, sağda {b}. İkiniz de varınca skorlar karşılaştırılır.', { a: setup.names[0], b: setup.names[1] })
            : rival
            ? t('Geçilecek skor: {score} ({time}, ✕{deaths}). Rakibinin hayaleti yanında koşacak.', { score: formatTime(rival.score), time: formatTime(rival.timeMs), deaths: rival.deaths })
            : terms.penalty
            ? t('İlk koşu senin. Hızlı ol ama düşme: her düşüş {n} saniye.', { n: terms.penalty })
            : t('İlk koşu senin. Düşmek ceza değil: yalnız süre sayılır.')}
        </p>
        {/* şartlar küçük rozetler: bir bakışta ne sayılıyor */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 short:mt-1.5">
          {termsLine(setup, t)
            .split(' · ')
            .map((p) => (
              <span key={p} className="border-2 border-line bg-ink/50 px-2 py-0.5 text-[12px] font-semibold text-cream/90">
                {p}
              </span>
            ))}
        </div>
        <p className="mt-2 text-[13px] text-muted short:hidden">{both ? t('Oyun kolu takılıysa birinci kol sola, ikinci kol sağa bağlanır. Üçten geri sayılır.') : t('Cihaz sıradaki oyuncuya geçsin. Hareket edince süre başlar.')}</p>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
          <button className="pixel-btn primary justify-center py-2.5 text-base" onClick={onGo} autoFocus>
            {ic(t('▶ Hazırım'))}
          </button>
          <button className="pixel-btn justify-center" onClick={onQuit}>
            {t('Bitir')}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** Düello sonu: kazanan, tur tur skorlar, rövanş */
export function DuelEnd({ setup, rounds, onRematch, onSetup, onMenu }: { setup: DuelSetupValue; rounds: DuelRounds; onRematch: () => void; onSetup: () => void; onMenu: () => void }) {
  const t = useT()
  const res = duelResult(rounds, setup.bestOf)
  const wins = duelWins(rounds)
  const level = duelLevel(setup)
  const done = rounds.filter((r) => roundWinner(r) !== null)
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 text-center sm:p-6 short:max-w-[min(860px,100%)] short:grid short:grid-cols-2 short:gap-5 short:py-3 short:text-left">
        <div>
          <p className="text-[13px] text-muted">
            {t('Düello Bitti')} · <span className="text-cream">{setup.course ? t(level.name) : level.name}</span>
          </p>
          <div className="mt-3 flex items-end justify-center gap-5">
            {([0, 1] as const).map((k) => (
              <div key={k} className="relative flex flex-col items-center">
                {res.winner === k && <span className="absolute -top-4 text-2xl">👑</span>}
                <Portrait id={setup.heroes[k]} className={`w-[84px] short:w-[56px] ${res.winner === k ? 'shadow-[0_0_0_3px_#d9a441]' : res.winner === -1 ? '' : 'opacity-50 grayscale'}`} />
                <p className="mt-1 max-w-[120px] truncate font-display text-[16px] text-cream">{setup.names[k]}</p>
                {setup.bestOf > 1 && <p className="font-display text-2xl leading-none text-gold">{wins[k]}</p>}
              </div>
            ))}
          </div>
          <h2 className="mt-3 font-display text-4xl text-cream short:text-3xl">{res.winner === -1 ? t('Berabere!') : t('{name} Kazandı!', { name: setup.names[res.winner ?? 0] })}</h2>
          <p className="mt-1 text-[13px] text-muted">{termsLine(setup, t)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 short:mt-3">
            <button className="pixel-btn primary justify-center" onClick={onRematch} autoFocus>
              {ic(t('↺ Rövanş'))}
            </button>
            <button className="pixel-btn justify-center" onClick={onSetup}>
              {t('Ayarlar')}
            </button>
            <button className="pixel-btn justify-center" onClick={onMenu}>
              {t('Menü')}
            </button>
          </div>
        </div>
        <div className="overlay-scroll mt-4 min-h-0 overflow-y-auto short:mt-0">
          <SectionTitle title={t('Tur Tur')} note={setup.bestOf > 1 ? `${wins[0]} – ${wins[1]}` : undefined} tone="var(--color-teal)" />
          <table className="mt-2 w-full text-[13px] tabular-nums">
            <thead>
              <tr className="text-[12px] text-muted">
                <th className="py-1 text-left font-bold">{t('Tur')}</th>
                <th className="truncate py-1 text-right font-bold">{setup.names[0]}</th>
                <th className="truncate py-1 text-right font-bold">{setup.names[1]}</th>
              </tr>
            </thead>
            <tbody>
              {done.map((r, i) => {
                const w = roundWinner(r)
                return (
                  <tr key={i} className={i % 2 ? '' : 'bg-panel-2/60'}>
                    <td className="px-1 py-1.5 text-left text-muted">{i + 1}</td>
                    {([0, 1] as const).map((k) => (
                      <td key={k} className={`px-1 py-1.5 text-right ${w === k ? 'font-bold text-gold' : 'text-cream/85'}`}>
                        {r[k]!.score >= DNF ? t('Bitiremedi') : formatTime(r[k]!.score)}
                        <span className="block text-[12px] font-normal text-muted">
                          {formatTime(r[k]!.timeMs)} · ✕{r[k]!.deaths}
                          {r[k]!.items ? ` · ${r[k]!.items}/3` : ''}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Overlay>
  )
}
