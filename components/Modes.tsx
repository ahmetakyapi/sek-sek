'use client'

import { useState } from 'react'
import Portrait from '@/components/Portrait'
import { BossFigure, DogFigure } from '@/components/Figures'
import { ItemIcon } from '@/components/HudBits'
import { Board } from '@/components/ScoreBoard'
import { Overlay, displayName, ic } from '@/components/ui'
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

const Eyebrow = ({ children, tone = 'text-gold' }: { children: React.ReactNode; tone?: string }) => (
  <p className={`flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] ${tone}`}>
    {children} <span className="kilim h-[6px] flex-1 opacity-50" />
  </p>
)

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
  rageCount,
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
  /** Sinir Bozucu modlarda yazılmış rekor sayısı */
  rageCount: number
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
  const lng = useLang()
  const lv = LEVELS.find((l) => l.id === daily.levelId)!
  const rule = DAILY_RULES[daily.rule]
  const streak = liveStreak(mark, today)
  const playedToday = mark?.day === today
  const rushOpen = bossesBeaten >= rushNeeds
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1240px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{t('YOLUN DIŞINDA')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Modlar')}</h2>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2">
          <div className="grid gap-3 sm:grid-cols-2 short:grid-cols-2 short:gap-2.5 wide:grid-cols-3">
            {/* Günlük Meydan Okuma */}
            <section className="mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-gold)]">
              <Eyebrow>{t('GÜNLÜK MEYDAN OKUMA')}</Eyebrow>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#d9a441] short:h-9 short:w-9">
                  <ItemIcon city={lv.city} taken size={32} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl leading-tight text-cream">{displayName(lv)}</p>
                  <p className="text-[13px] font-bold tracking-[0.12em] text-accent-2">{t(rule.name).toLocaleUpperCase(lng)}</p>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t(rule.text)}</p>
              <p className="mt-1 text-[13px] leading-snug text-muted short:hidden">{dailyUsed && !playedToday ? t('Bugünkü koşunu yarıda bıraktın. Yarın yeni bir şehir seni bekliyor.') : t('Herkes bugün aynı şehirde, aynı kuralla koşar. Günde tek hak: baştan başlasan da süre işler.')}</p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-3 text-center short:hidden">
                <div className="border-2 border-line bg-ink/40 py-1.5">
                  <p className="font-display text-lg leading-none tabular-nums text-cream">{playedToday ? formatTime(mark!.bestMs) : '—'}</p>
                  <p className="mt-1 text-[12px] text-muted">{t('Bugünkü Skorun')}</p>
                </div>
                <div className={`border-2 py-1.5 ${streak >= 3 ? 'border-accent bg-accent/10' : 'border-line bg-ink/40'}`}>
                  <p className="font-display text-lg leading-none tabular-nums text-cream">{streak ? `🔥 ${streak}` : '—'}</p>
                  <p className="mt-1 text-[12px] text-muted">{t('Gün Serisi')}</p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
                <button className="pixel-btn primary justify-center" onClick={onDaily} disabled={dailyUsed} autoFocus={!dailyUsed}>
                  {dailyUsed ? t('Yarın Yeni Şehir') : ic(t('▶ Oyna'))}
                </button>
                <button className="pixel-btn justify-center px-3" onClick={onDailyBoard}>
                  {t('Günün Sıralaması')}
                </button>
              </div>
            </section>

            {/* Sinir Bozucu: zor modlar; her biri bitirilen her şehirde ayrı rekor (hikâyeye ve ilerlemeye dokunmaz) */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-coral)] ${rulesOpen ? '' : 'locked'}`}>
              <Eyebrow tone="text-coral">{t('SİNİR BOZUCU')}</Eyebrow>
              <RuleBoard rules={RAGE_ORDER} tried={tried} className="mt-2.5 grid-cols-10 max-sm:grid-cols-7" />
              <div className="mt-2 flex items-center gap-2 text-[12px] tabular-nums text-muted">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/60">
                  <span className="block h-full rounded-full bg-coral" style={{ width: `${(RAGE_RULES.filter((r) => tried.includes(r)).length / RAGE_RULES.length) * 100}%` }} />
                </span>
                {t('{n}/{total} mod denendi', { n: RAGE_RULES.filter((r) => tried.includes(r)).length, total: RAGE_RULES.length })}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85">{t('Beş aile, on dokuz mod: buz zemin, ters ekran, karanlık, tek can, Kangal. Her şehirde ayrı rekor.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{!rulesOpen ? t('Bir şehri bitirince o şehirde açılır.') : rageCount ? t('{n} öfke rekoru. Sıradakine dayanabilir misin?', { n: rageCount }) : t('Henüz kimse sinirlenmedi. İlk sen dene.')}</p>
              <div className="mt-auto grid grid-cols-2 gap-2">
                <button className="pixel-btn tone shrink-0 justify-center px-2" disabled={!rulesOpen} onClick={onRage}>
                  {t('Öfkeni Seç')}
                </button>
                <button className="pixel-btn tone shrink-0 justify-center px-2" disabled={!rulesOpen || !RAGE_COURSES.length} onClick={onRageCourses}>
                  {t('Parkurlar')} {RAGE_COURSES.length ? <span className="text-[12px] tabular-nums opacity-80">{rageCoursesDone}/{RAGE_COURSES.length}</span> : null}
                </button>
              </div>
            </section>

            {/* Kovalamaca: Sinir Bozucu'nun bir modu ama kendi kartı var (en çok sorulan) */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-coral)] ${chaseCities ? '' : 'locked'}`}>
              <Eyebrow tone="text-coral">{t('KOVALAMACA')}</Eyebrow>
              <div className="mt-2.5 flex justify-center">
                <DogFigure className={`h-[64px] w-[96px] short:h-[44px] short:w-[66px] ${chaseCities ? '' : 'opacity-40 grayscale'}`} />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85">{t('Bir Kangal izini sürüyor. Koştukça aranı açarsın; durursan, geri dönersen yetişir.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{chaseCities ? t('{n} şehirde açık. Ekran kenarındaki işaret köpeğin ne kadar yakın olduğunu söyler.', { n: chaseCities }) : t('Bir şehri bitirince o şehirde açılır.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" disabled={!chaseCities} onClick={onChase}>
                {ic(chaseCities ? t('▶ Kaç!') : t('Kilitli'))}
              </button>
            </section>

            {/* Haftalık Turnuva */}
            <section className="mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-gold)]">
              <Eyebrow>{t('HAFTALIK TURNUVA')}</Eyebrow>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                {tIds.map((id, i) => {
                  const c = CHALLENGES.find((x) => x.id === id)!
                  const lvl = LEVELS.find((l) => l.id === c.level)!
                  const done = tournament?.week === week && tournament.best[id] !== undefined
                  return (
                    <span key={id} className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#221f4a] short:h-8 short:w-8 ${done ? 'shadow-[0_0_0_2px_#d9a441]' : 'shadow-[0_0_0_2px_#37337a]'} ${i === 1 ? '-translate-y-1.5' : ''}`}>
                      <ItemIcon city={lvl.city} taken={done} size={26} />
                    </span>
                  )
                })}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Bu hafta herkes aynı üç mücadelede. Toplam süreyle sıralanır, pazar gecesi kapanır.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">
                {tTotal ? t('Toplamın {time}', { time: formatTime(tTotal) }) : t('{n}/3 bitti', { n: tDone })}
                {winner ? ` · ${t('Geçen hafta: {name}', { name: winner.name })}` : ''}
              </p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" onClick={onTournament}>
                {t('Turnuvaya Gir')}
              </button>
            </section>

            {/* Co-op: aynı ekranda iki kişi; gridde kart (eskiden en altta ince bir satırdı, gözden kaçıyordu) */}
            <section className="mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-teal)]">
              <Eyebrow tone="text-teal">{t('CO-OP · 2 KİŞİ')}</Eyebrow>
              <div className="mt-2.5 flex items-end justify-center gap-1" aria-hidden>
                <Portrait id="uktun" className="w-[64px] rotate-[-4deg] short:w-[44px]" />
                <span className="mb-3 font-display text-2xl text-teal">+</span>
                <Portrait id="memo" className="w-[64px] rotate-[4deg] short:w-[44px]" />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85">{t('İki kişi aynı ekranda: şehir yolu, boss kapışması ya da parkur. Omuzdan sekin, canları paylaşın.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted short:hidden">{t('Solda WASD + Shift, sağda ok tuşları + Enter ya da iki oyun kolu. Tuşlar Ayarlar’dan değişir.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" onClick={onCoop}>
                {t('Birlikte Oyna')}
              </button>
            </section>

            {/* Düello */}
            <section className="mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-teal)]">
              <Eyebrow tone="text-teal">{t('DÜELLO · 2 KİŞİ')}</Eyebrow>
              <div className="mt-2.5 flex items-end justify-center gap-1">
                <Portrait id="uktun" className="w-[64px] rotate-[-5deg] short:w-[44px]" />
                <span className="mb-3 font-display text-2xl text-accent-2">vs</span>
                <Portrait id="memo" className="w-[64px] rotate-[5deg] short:w-[44px]" />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:mb-2 short:text-[13px]">{t('Yan yana aynı anda yarışın ya da cihazı elden ele verip rakibin hayaletiyle koşun.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted short:hidden">{t('Şehir ya da kısa parkur, 1, 3 ya da 5 tur. Düşüş cezası, Hatıra Avı ve avantajla kendi kuralını kur.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" onClick={onDuel}>
                {t('Düello Kur')}
              </button>
            </section>

            {/* Boss Rush */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-coral)] ${rushOpen ? '' : 'locked'}`}>
              <Eyebrow tone="text-coral">{t('BOSS RUSH')}</Eyebrow>
              <div className="mt-2.5 flex justify-center">
                <BossFigure city="istanbul" className={`h-[64px] w-[76px] short:h-[44px] short:w-[52px] ${rushOpen ? '' : 'opacity-40 grayscale'}`} />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Yendiğin bütün boss’lar arka arkaya. Kâbus’ta hepsi en sert hâlinde, Çifte’de ikişer ikişer.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">
                {rushOpen
                  ? rushBest
                    ? t('Rekor: {time} · {n} boss', { time: formatTime(rushBest.timeMs), n: rushBest.bosses })
                    : t('{n} boss hazır. İlk rekoru sen yaz.', { n: bossesBeaten })
                  : t('Açılması için {n} boss yen ({k}/{n}).', { n: rushNeeds, k: bossesBeaten })}
              </p>
              {/* çeşit: düz, Kâbus (en yüksek kademe, hızlı), Çifte (her arenada iki boss) */}
              <div className="mt-auto grid shrink-0 grid-cols-[1fr_auto_auto] gap-1.5">
                <button className="pixel-btn tone justify-center" disabled={!rushOpen} onClick={() => onRush()}>
                  {ic(rushOpen ? t('▶ Oyna') : t('Kilitli'))}
                </button>
                <button className="pixel-btn tone justify-center px-2 text-[13px]" disabled={!rushOpen} onClick={() => onRush('kabus')} title={rushPlus.kabus ? t('Rekor: {time} · {n} boss', { time: formatTime(rushPlus.kabus.timeMs), n: rushPlus.kabus.bosses }) : t('Her boss en yüksek kademede ve %30 hızlı.')}>
                  {t('Kâbus')}
                </button>
                <button className="pixel-btn tone justify-center px-2 text-[13px]" disabled={!rushOpen} onClick={() => onRush('cifte')} title={rushPlus.cifte ? t('Rekor: {time} · {n} boss', { time: formatTime(rushPlus.cifte.timeMs), n: rushPlus.cifte.bosses }) : t('Her arenada iki boss birden.')}>
                  {t('Çifte')}
                </button>
              </div>
            </section>

            {/* Maraton */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-coral)] ${marathonOpen ? '' : 'locked'}`}>
              <Eyebrow tone="text-coral">{t('MARATON')}</Eyebrow>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                {(['istanbul', 'konya', 'trabzon'] as const).map((c, i) => (
                  <span key={c} className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#221f4a] shadow-[0_0_0_2px_#37337a] short:h-8 short:w-8 ${marathonOpen ? '' : 'opacity-40 grayscale'} ${i === 1 ? '-translate-y-1.5' : ''}`}>
                    <ItemIcon city={c} taken size={26} />
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Açtığın şehirlerden rastgele üçü, baştan sona arka arkaya. Tek nefeste ne kadar hızlısın?')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{marathonOpen ? (marathonBest ? t('Maraton rekorun: {time}', { time: formatTime(marathonBest.timeMs) }) : t('Her koşuda başka üç şehir. İlk rekoru sen yaz.')) : t('Açılması için üç şehir aç.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" disabled={!marathonOpen} onClick={onMarathon}>
                {ic(marathonOpen ? t('▶ Oyna') : t('Kilitli'))}
              </button>
            </section>

            {/* Kurallı Koşu */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-accent)] ${rulesOpen ? '' : 'locked'}`}>
              <Eyebrow tone="text-accent">{t('KURALLI KOŞU')}</Eyebrow>
              <RuleBoard rules={RULES} tried={tried} className="mt-2.5 grid-cols-7" />
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Şehri ve kuralı sen seç: aynı şehir her kuralla başka bir oyun. Her şehir ve kural için ayrı rekor.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{!rulesOpen ? t('Bir şehri bitirince o şehirde açılır.') : ruleCount ? t('{n} rekor yazdın. Sıradaki kuralı dene.', { n: ruleCount }) : t('Yedi kural, bitirdiğin bütün şehirler.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" disabled={!rulesOpen} onClick={onRules}>
                {rulesOpen ? t('Kural Seç') : t('Kilitli')}
              </button>
            </section>

            {/* Mücadeleler */}
            <section className="mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-accent)]">
              <Eyebrow tone="text-accent">{t('MÜCADELELER')}</Eyebrow>
              <p className="mt-2.5 text-center font-display text-4xl leading-none text-cream short:text-3xl">
                ▲ {challengeDone}
                <span className="text-[16px] text-muted">/{CHALLENGES.length}</span>
              </p>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Zor şehirlerin en sıkı yerleri, kısa ve bayraksız. Her birinin kendi madalyası ve sıralaması var.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{rulesOpen ? t('Bir mücadele, kesildiği şehir bitince açılır.') : t('Zor bir şehri bitirince açılır.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" onClick={onChallenges}>
                {t('Mücadele Seç')}
              </button>
            </section>

            {/* Ayna Yolu */}
            <section className={`mode-card flex flex-col p-3.5 short:p-2.5 [--tone:var(--color-accent-2)] ${mirrorOpen ? '' : 'locked'}`}>
              <Eyebrow tone="text-accent-2">{t('AYNA YOLU · YENİ OYUN+')}</Eyebrow>
              <div className="mt-2.5 flex items-end justify-center gap-0.5" aria-hidden>
                <Portrait id="uktun" className={`w-[52px] short:w-[38px] ${mirrorOpen ? '' : 'opacity-40 grayscale'}`} />
                <Portrait id="uktun" className={`w-[52px] -scale-x-100 opacity-60 short:w-[38px] ${mirrorOpen ? '' : 'grayscale'}`} />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[13px]">{t('Otuz şehir aynada: sağdan sola, ters rüzgârla. Yalnız yol ve süre.')}</p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-muted">{mirrorOpen ? (mirrorDone ? t('{n} ayna rekoru', { n: mirrorDone }) : t('Kapı açık. İlk ayna rekorunu yaz.')) : t('Otuz şehrin hepsini bitirince açılır.')}</p>
              <button className="pixel-btn tone mt-auto shrink-0 justify-center" disabled={!mirrorOpen} onClick={onMirror}>
                {ic(mirrorOpen ? t('◐ Aynaya Geç') : t('Kilitli'))}
              </button>
            </section>
          </div>
          {/* speedrun tam turları: ilk defterin otuz şehri arka arkaya (düz ve aynalı) */}
          <div className="mt-3 grid shrink-0 gap-3 short:mt-2 short:gap-2 wide:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2 border-2 border-line bg-ink/40 px-3.5 py-2 text-[13px] short:py-1.5">
            <strong className="font-display text-gold">{t('Speedrun')}</strong>
            <span className="min-w-0 flex-1 truncate text-muted">{mirrorOpen ? t('Otuz şehir arka arkaya, tek süre') : t('İlk defterin otuz şehrini bitirince açılır.')}</span>
            <button className="pixel-btn px-2.5 py-1 text-[13px]" disabled={!mirrorOpen} onClick={() => onTour('tur')}>
              {t('Tam Tur')} {tourBest ? `· ${formatTime(tourBest.timeMs)}` : '▶'}
            </button>
            <button className="pixel-btn px-2.5 py-1 text-[13px]" disabled={!mirrorOpen} onClick={() => onTour('aynaTur')}>
              ◐ {t('Ayna Tam Tur')} {aynaTourBest ? `· ${formatTime(aynaTourBest.timeMs)}` : '▶'}
            </button>
          </div>
          {/* Bölüm Düzenleyici: kendi haritanı çiz (eskiden yalnız topluluk galerisinden açılıyordu) */}
          <a href="/duzenle" className="flex items-center justify-between gap-3 border-2 border-accent/60 bg-accent/5 px-3.5 py-2 text-[13px] text-cream hover:border-gold/60 short:py-1.5 wide:col-span-2">
            <span className="min-w-0 truncate">
              <strong className="font-display text-accent-2">{t('Bölüm Düzenleyici')}</strong> <span className="text-muted">· {t('Kendi bölümünü çiz, çözücüyle sına, arkadaşına gönder ya da topluluğa yayınla')}</span>
            </span>
            <span className="shrink-0 text-accent-2">✎</span>
          </a>
          {/* topluluk haritaları: yolcuların düzenleyicide çizip yayınladığı yollar (ayrı sayfa) */}
          <a href="/haritalar" className="flex items-center justify-between gap-3 border-2 border-line bg-ink/40 px-3.5 py-2 text-[13px] text-cream hover:border-gold/60 short:py-1.5">
            <span className="min-w-0 truncate">
              <strong className="font-display text-gold">{t('Topluluk Haritaları')}</strong> <span className="text-muted">· {t('Yolcuların çizdiği yolları oyna, kendininkini yayınla')}</span>
            </span>
            <span className="shrink-0 text-accent-2">→</span>
          </a>
          </div>
        </div>
      </div>
    </Overlay>
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
  const lv = localize(LEVELS.find((l) => l.id === result.run.levelId)!, lng)
  const lines: [string, string][] = [
    [t('Süre'), formatTime(result.timeMs)],
    ...(rule.perDeath && result.deaths ? ([[t('{n} düşüş × {s} sn', { n: result.deaths, s: rule.perDeath }), `+${result.deaths * rule.perDeath} sn`]] as [string, string][]) : []),
    ...(rule.perMissing && result.found < 3 ? ([[t('{n} eksik hatıra × {s} sn', { n: 3 - result.found, s: rule.perMissing }), `+${(3 - result.found) * rule.perMissing} sn`]] as [string, string][]) : []),
  ]
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 sm:p-6 short:grid short:max-w-[min(900px,100%)] short:grid-cols-2 short:gap-5 short:py-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{result.free ? (result.best ? t('YENİ REKOR') : t('KURALLI KOŞU')) : result.best ? t('BUGÜNÜN EN İYİSİ') : t('GÜNLÜK MEYDAN OKUMA')}</p>
          <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">
            {displayName(lv)} <span className="text-[16px] text-accent-2">· {t(rule.name)}</span>
          </h2>
          <div className="mt-3 border-2 border-line bg-ink/40 px-3 py-2 text-[14px] tabular-nums short:mt-1.5 short:py-1">
            {lines.map(([k, v]) => (
              <p key={k} className="flex justify-between gap-3 py-0.5 text-cream/85">
                <span>{k}</span>
                <span>{v}</span>
              </p>
            ))}
            <p className="mt-1 flex items-baseline justify-between gap-3 border-t-2 border-line pt-1.5">
              <span className="font-bold text-gold">{t('Skor')}</span>
              <span className="font-display text-4xl leading-none text-cream">{formatTime(result.scoreMs)}</span>
            </p>
          </div>
          <p className="mt-2 text-[13px] text-muted short:hidden">
            {result.free ? t('Bu şehir ve kuraldaki rekorun {time}', { time: formatTime(result.mark.bestMs) }) : `${t('Bugünkü en iyin {time}', { time: formatTime(result.mark.bestMs) })} · ${t('Gün serisi: {n}', { n: result.mark.streak })}`}
            {(result.tries ?? 1) > 1 ? ` · ${t('{n}. denemede', { n: result.tries! })}` : ''}
          </p>
          <p className="mt-1 text-[13px]">
            {result.free ? null : !player ? (
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
          <div className="mt-4 grid grid-cols-2 gap-2.5 short:mt-2">
            {onRetry ? (
              <button className="pixel-btn primary justify-center whitespace-nowrap short:py-2" onClick={onRetry} autoFocus>
                {ic(t('↺ Yeniden Dene'))}
              </button>
            ) : (
              <p className="flex items-center text-[13px] leading-snug text-muted">{t('Bugünkü hakkın bu. Yarın yeni bir şehir.')}</p>
            )}
            <button className={`pixel-btn justify-center ${onRetry ? '' : 'primary'}`} onClick={onModes} autoFocus={!onRetry}>
              {t('Modlar')}
            </button>
          </div>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col short:mt-0">
          {result.free ? (
            <>
              <Eyebrow>{t('KURAL')}</Eyebrow>
              <p className="mt-2 font-display text-xl text-cream">{t(rule.name)}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-cream/85">{t(rule.text)}</p>
              <p className="mt-3 text-[13px] leading-snug text-muted">{t('Aynı şehri başka bir kuralla dene: Modlar → Kurallı Koşu. Her kuralın rekoru ayrı tutulur.')}</p>
            </>
          ) : (
            <>
              <Eyebrow>{t('BUGÜNÜN SIRALAMASI')}</Eyebrow>
              <div className="overlay-scroll min-h-[120px] flex-1 overflow-y-auto pr-1">
                <Board kind="gunluk" day={result.run.day} me={player} refresh={status === 'sent' ? 1 : 0} compact />
              </div>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}

/** Kurallı Koşu kurulumu: şehir + kural; her kuralın o şehirdeki rekoru kartında yazar */
/** Sinir Bozucu modlarının aile sırası (seçim ekranındaki başlıklarla aynı) */
const RAGE_ORDER = (['zemin', 'gorus', 'fizik', 'tekcan', 'karisim'] as RuleFamily[]).flatMap((f) => RAGE_RULES.filter((r) => RULE_ART[r].family === f))

/** Modlar kartındaki simge panosu: denenen kural aile renginde parlar, denenmeyen soluk durur */
function RuleBoard({ rules, tried, className = '' }: { rules: DailyRule[]; tried: string[]; className?: string }) {
  const t = useT()
  return (
    <div className={`grid gap-1 ${className}`}>
      {rules.map((r) => {
        const c = FAMILIES[RULE_ART[r].family].color
        const on = tried.includes(r)
        return (
          <span key={r} title={t(DAILY_RULES[r].name)} className="flex aspect-square items-center justify-center rounded-sm" style={{ color: c, background: on ? `${c}30` : `${c}10`, boxShadow: on ? `inset 0 0 0 2px ${c}` : undefined, opacity: on ? 1 : 0.6 }}>
            <RuleIcon rule={r} size={20} />
            <span className="sr-only">{t(DAILY_RULES[r].name)}</span>
          </span>
        )
      })}
    </div>
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
  const tone = rage ? 'text-coral' : 'text-accent'
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(1080px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[12px] font-bold tracking-[0.18em] max-sm:hidden short:hidden ${tone}`}>{rage ? t('SABRINI SINA') : t('AYNI ŞEHİR, BAŞKA OYUN')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{rage ? t('Sinir Bozucu') : t('Kurallı Koşu')}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="border-2 border-line bg-ink/40 px-2 py-1.5 text-[13px] tabular-nums text-muted max-sm:hidden">
              {t('{city}: {n}/{total}', { city: lv.name, n: done, total: list.length })}
            </span>
            <button data-back className="pixel-btn back-btn whitespace-nowrap" onClick={onBack}>
              {ic(t('← Geri'))}
            </button>
          </div>
        </div>
        <div className="mt-3 grid min-h-0 flex-1 gap-3 max-sm:grid-rows-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] short:mt-2 short:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* sol: modlar ailelerine göre; her kutucukta simge, ad, zorluk ve bu şehirdeki rekor */}
          <div className="overlay-scroll -mx-1 min-h-0 overflow-y-auto px-1">
            {groups.map(({ f, rules }) => (
              <section key={f} className="mb-2.5 last:mb-0">
                {rage && (
                  <p className="mb-1 flex items-baseline gap-2 text-[12px] font-bold tracking-[0.14em]" style={{ color: FAMILIES[f].color }}>
                    {t(FAMILIES[f].name).toLocaleUpperCase(lng === 'tr' ? 'tr' : 'en')}
                    <span className="truncate text-[12px] font-normal tracking-normal text-muted">{t(FAMILIES[f].tagline)}</span>
                  </p>
                )}
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
                          {!rage && <span className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted max-sm:hidden short:hidden">{t(DAILY_RULES[r].text)}</span>}
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
  const chip = (on: boolean) => `border-2 px-1.5 py-1 text-[13px] ${on ? 'border-gold bg-gold/10 text-cream' : 'border-line bg-ink/40 text-cream/75'}`
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(1000px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent-2">{t('DÜELLO · 2 KİŞİ')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Düello Kur')}</h2>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1 short:grid short:grid-cols-2 short:gap-4 wide:grid wide:grid-cols-2 wide:gap-4">
          <div>
            <div className="grid grid-cols-2 gap-3">
              {([0, 1] as const).map((k) => (
                <div key={k} className={`border-2 p-2.5 ${k === 0 ? 'border-accent/70' : 'border-gold/70'}`}>
                  <p className="text-[12px] font-bold tracking-[0.14em] text-muted">{t('{n}. OYUNCU', { n: k + 1 })}</p>
                  <button type="button" className="mt-1.5 flex w-full items-center gap-2 text-left" onClick={() => swapHero(k)} aria-label={t('Kılığı Değiştir')}>
                    <Portrait id={v.heroes[k]} className="w-[52px] short:w-[40px]" />
                    <span className="text-[13px] leading-snug text-muted">
                      <span className="block font-display text-[16px] text-cream">{CHARACTERS[v.heroes[k]].short}</span>
                      {t('Dokun, kılığı değiştir')}
                    </span>
                  </button>
                  <label className="mt-2 block text-[12px] font-bold tracking-[0.15em] text-muted">
                    {t('AD')}
                    <input
                      value={v.names[k]}
                      maxLength={16}
                      onChange={(e) => setName(k, e.target.value)}
                      className="mt-1 block w-full border-2 border-line bg-ink px-2 py-1.5 text-[15px] font-normal tracking-normal text-cream outline-none focus:border-gold"
                    />
                  </label>
                  {/* avantaj: bu oyuncunun skorundan baştan düşülen saniye (farklı yaşlar, farklı eller) */}
                  <p className="mt-2 text-[12px] font-bold tracking-[0.14em] text-muted">{t('AVANTAJ')}</p>
                  <div className="mt-1 grid grid-cols-4 gap-1">
                    {DUEL_HANDICAPS.map((h) => (
                      <button key={h} aria-pressed={terms.handicap[k] === h} className={chip(terms.handicap[k] === h)} onClick={() => setTerms({ handicap: (k === 0 ? [h, terms.handicap[1]] : [terms.handicap[0], h]) as [number, number] })}>
                        {h ? `−${h}` : '0'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-bold tracking-[0.14em] text-muted">{t('OYNAYIŞ')}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(['sirayla', 'yanyana'] as const).map((k) => (
                <button key={k} aria-pressed={v.style === k} disabled={k === 'yanyana' && !canSide} className={`pixel-btn justify-center py-1.5 text-[13px] ${v.style === k ? 'primary' : ''}`} onClick={() => setV((p) => ({ ...p, style: k }))}>
                  {k === 'sirayla' ? t('Sırayla') : t('Yan Yana')}
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
          </div>
          <div className="mt-3 short:mt-0 wide:mt-0">
            {/* yol: şehrin bütünü ya da mücadele parkuru (kısa, sert) */}
            <div className="grid grid-cols-2 gap-2" role="tablist">
              <button role="tab" aria-selected={!v.course} className={chip(!v.course)} onClick={() => setV((p) => ({ ...p, course: null }))}>
                {t('Şehir')}
              </button>
              <button role="tab" aria-selected={!!v.course} disabled={!courses.length} className={chip(!!v.course)} onClick={() => courses[0] && pickCourse(course?.id ?? courses[0].id)}>
                {t('Parkur')}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {v.course ? (
                <select value={course?.id ?? ''} onChange={(e) => pickCourse(e.target.value)} className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-2 text-[15px] text-cream outline-none focus:border-gold" aria-label={t('Parkur')}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {RAGE_COURSES.includes(c) ? '🔥 ' : '▲ '}
                      {t(c.name)} · {LEVELS.find((l) => l.id === c.level)!.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select value={v.level} onChange={(e) => setV((p) => ({ ...p, level: Number(e.target.value) }))} className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-2 text-[15px] text-cream outline-none focus:border-gold" aria-label={t('Şehir')}>
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
            <p className="mt-1.5 text-[13px] leading-snug text-muted">
              {v.course ? t('Kısa ve sert: zor şehrin en sıkı yeri, bayraksız. Altın süre {s} sn.', { s: duelLevel(v).medals[0] }) : `${lv.subtitle} · ${t('Altın süre {s} sn', { s: lv.medals[0] })}`}
            </p>
            <p className="mt-3 text-[12px] font-bold tracking-[0.14em] text-muted">{t('TUR')}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {([1, 3, 5] as const).map((b) => (
                <button key={b} aria-pressed={v.bestOf === b} className={`pixel-btn justify-center py-1.5 text-[13px] ${v.bestOf === b ? 'primary' : ''}`} onClick={() => setV((p) => ({ ...p, bestOf: b }))}>
                  {b === 1 ? t('Tek Tur') : t('{n} Tur', { n: b })}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-bold tracking-[0.14em] text-muted">{t('ŞARTLAR')}</p>
            <div className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5 text-[13px]">
              <span className="text-cream/85">{t('Düşüş Cezası')}</span>
              <div className="grid grid-cols-3 gap-1">
                {DUEL_PENALTIES.map((n) => (
                  <button key={n} aria-pressed={terms.penalty === n} className={chip(terms.penalty === n)} onClick={() => setTerms({ penalty: n })}>
                    {n ? `+${n} ${t('sn')}` : t('Yok')}
                  </button>
                ))}
              </div>
              <span className="text-cream/85">{t('Hatıra Avı')}</span>
              <button aria-pressed={!!terms.itemBonus} disabled={!!v.course} className={chip(!!terms.itemBonus && !v.course) + ' text-left'} onClick={() => setTerms({ itemBonus: terms.itemBonus ? 0 : 5 })}>
                {v.course ? t('Parkurda hatıra yok') : terms.itemBonus ? t('Açık: her hatıra skordan 5 sn düşer') : t('Kapalı: yalnız süre')}
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-muted">{t('Skor: süre, artı düşüş cezası, eksi hatıra ve avantaj. Düşük skor turu alır.')}</p>
          </div>
        </div>
        <button className="pixel-btn primary mt-3 w-full shrink-0 justify-center py-2.5 text-base short:mt-2 short:py-2" disabled={!ready} onClick={() => onStart({ ...v, names: [v.names[0].trim(), v.names[1].trim()], terms: v.course ? { ...terms, itemBonus: 0 } : terms })}>
          {ic(t('▶ Düelloyu Başlat'))}
        </button>
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
  const lng = useLang()
  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-md p-5 text-center sm:p-6 short:py-3">
        <p className="text-[12px] font-bold tracking-[0.18em] text-accent-2">
          {t('DÜELLO')} · {(setup.course ? t(level.name) : level.name).toLocaleUpperCase(lng)} · {setup.bestOf === 1 ? t('TEK TUR') : t('{n}. TUR', { n: round + 1 })}
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
        <p className="mt-1 text-[13px] text-muted">{termsLine(setup, t)}</p>
        <p className="mt-1 text-[13px] text-muted short:hidden">{both ? t('Oyun kolu takılıysa birinci kol sola, ikinci kol sağa bağlanır. Üçten geri sayılır.') : t('Cihaz sıradaki oyuncuya geçsin. Hareket edince süre başlar.')}</p>
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
  const lng = useLang()
  const res = duelResult(rounds, setup.bestOf)
  const wins = duelWins(rounds)
  const level = duelLevel(setup)
  const done = rounds.filter((r) => roundWinner(r) !== null)
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 text-center sm:p-6 short:max-w-[min(860px,100%)] short:grid short:grid-cols-2 short:gap-5 short:py-3 short:text-left">
        <div>
          <p className="text-[12px] font-bold tracking-[0.18em] text-accent-2">
            {t('DÜELLO BİTTİ')} · {(setup.course ? t(level.name) : level.name).toLocaleUpperCase(lng)}
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
          <Eyebrow>{t('TUR TUR')}</Eyebrow>
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
