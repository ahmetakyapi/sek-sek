'use client'

import { useState } from 'react'
import Portrait from '@/components/Portrait'
import { BossFigure } from '@/components/Figures'
import { ItemIcon } from '@/components/HudBits'
import { Board } from '@/components/ScoreBoard'
import { Overlay, displayName } from '@/components/ui'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { LEVELS } from '@/game/levels'
import { DAILY_RULES, RULES, duelResult, duelWins, liveStreak, roundWinner, ruleFits, ruleKey, ruleLimit, type DailyMark, type DailyRule, type DailyRun, type DuelRounds } from '@/lib/extras'
import { cityVersion } from '@/lib/mapVersion'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Yan yana yarışta bitiremeyen oyuncunun skoru: her gerçek süreden büyük */
export const DNF = 1e9

const Eyebrow = ({ children, tone = 'text-gold' }: { children: React.ReactNode; tone?: string }) => (
  <p className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] ${tone}`}>
    {children} <span className="kilim h-[6px] flex-1 opacity-50" />
  </p>
)

/** Modlar: Günlük Meydan Okuma, Düello, Boss Rush. Her kart ne olduğunu, kuralını ve oyuncunun durumunu söyler. */
export function ModesHub({
  daily,
  mark,
  today,
  bossesBeaten,
  rushNeeds,
  rushBest,
  onDaily,
  onDailyBoard,
  onDuel,
  onRush,
  marathonOpen,
  marathonBest,
  onMarathon,
  onRules,
  ruleCount,
  rulesOpen,
  onBack,
}: {
  daily: DailyRun
  mark: DailyMark | null | undefined
  today: string
  bossesBeaten: number
  rushNeeds: number
  rushBest: { timeMs: number; bosses: number } | null
  onDaily: () => void
  onDailyBoard: () => void
  onDuel: () => void
  onRush: () => void
  marathonOpen: boolean
  marathonBest: { timeMs: number } | null
  onMarathon: () => void
  onRules: () => void
  /** Kurallı Koşu'da yazılmış rekor sayısı */
  ruleCount: number
  /** en az bir şehir bitirildi mi (Kurallı Koşu bitirilen şehirlerde açılır) */
  rulesOpen: boolean
  onBack: () => void
}) {
  const t = useT()
  const lng = useLang()
  const lv = LEVELS.find((l) => l.id === daily.levelId)!
  const rule = DAILY_RULES[daily.rule]
  const streak = liveStreak(mark, today)
  const playedToday = mark?.day === today
  const rushOpen = bossesBeaten >= rushNeeds
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YOLUN DIŞINDA')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Modlar')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {t('← Geri')}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2">
          <div className="grid gap-3 sm:grid-cols-2 short:grid-cols-2 short:gap-2.5">
            {/* Günlük Meydan Okuma */}
            <section className="flex flex-col border-2 border-gold bg-gold/5 p-3.5 short:p-2.5">
              <Eyebrow>{t('GÜNLÜK MEYDAN OKUMA')}</Eyebrow>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2a2438] shadow-[0_0_0_2px_#d9a441] short:h-9 short:w-9">
                  <ItemIcon city={lv.city} taken size={32} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl leading-tight text-cream">{displayName(lv)}</p>
                  <p className="text-[12px] font-bold tracking-[0.12em] text-accent-2">{t(rule.name).toLocaleUpperCase(lng)}</p>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[12px]">{t(rule.text)}</p>
              <p className="mt-1 text-[12px] leading-snug text-muted short:hidden">{t('Herkes bugün aynı şehirde, aynı kuralla koşar. Kilitli şehir de gelebilir; ilerlemen ve rekorların değişmez.')}</p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-3 text-center short:hidden">
                <div className="border-2 border-line bg-ink/40 py-1.5">
                  <p className="font-display text-lg leading-none tabular-nums text-cream">{playedToday ? formatTime(mark!.bestMs) : '—'}</p>
                  <p className="mt-1 text-[11px] text-muted">{t('Bugünkü En İyin')}</p>
                </div>
                <div className={`border-2 py-1.5 ${streak >= 3 ? 'border-accent bg-accent/10' : 'border-line bg-ink/40'}`}>
                  <p className="font-display text-lg leading-none tabular-nums text-cream">{streak ? `🔥 ${streak}` : '—'}</p>
                  <p className="mt-1 text-[11px] text-muted">{t('Gün Serisi')}</p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2">
                <button className="pixel-btn primary justify-center" onClick={onDaily} autoFocus>
                  {playedToday ? t('▶ Yeniden Dene') : t('▶ Oyna')}
                </button>
                <button className="pixel-btn justify-center px-3" onClick={onDailyBoard}>
                  {t('Günün Sıralaması')}
                </button>
              </div>
            </section>

            {/* Kurallı Koşu */}
            <section className="flex flex-col border-2 border-accent/70 bg-accent/5 p-3.5 short:p-2.5">
              <Eyebrow tone="text-accent">{t('KURALLI KOŞU')}</Eyebrow>
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                {RULES.map((r) => (
                  <span key={r} className="border-2 border-line bg-ink/50 px-1.5 py-0.5 text-[11px] font-bold text-cream/90">
                    {t(DAILY_RULES[r].name)}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[12px]">{t('Şehri ve kuralı sen seç: aynı şehir her kuralla başka bir oyun. Her şehir ve kural için ayrı rekor.')}</p>
              <p className="mb-3 mt-1 text-[12px] leading-snug text-muted">{!rulesOpen ? t('Bir şehri bitirince o şehirde açılır.') : ruleCount ? t('{n} rekor yazdın. Sıradaki kuralı dene.', { n: ruleCount }) : t('Yedi kural, bitirdiğin bütün şehirler.')}</p>
              <button className="pixel-btn primary mt-auto shrink-0 justify-center" disabled={!rulesOpen} onClick={onRules}>
                {rulesOpen ? t('Kural Seç') : t('Kilitli')}
              </button>
            </section>

            {/* Düello */}
            <section className="flex flex-col border-2 border-line bg-ink/40 p-3.5 short:p-2.5">
              <Eyebrow tone="text-accent-2">{t('DÜELLO · 2 KİŞİ')}</Eyebrow>
              <div className="mt-2.5 flex items-end justify-center gap-1">
                <Portrait id="uktun" className="w-[64px] rotate-[-5deg] short:w-[44px]" />
                <span className="mb-3 font-display text-2xl text-accent-2">vs</span>
                <Portrait id="memo" className="w-[64px] rotate-[5deg] short:w-[44px]" />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:mb-2 short:text-[12px]">{t('Yan yana aynı anda yarışın ya da cihazı elden ele verip rakibin hayaletiyle koşun.')}</p>
              <p className="mb-3 mt-1 text-[12px] leading-snug text-muted short:hidden">{t('Yan yana: bölünmüş ekran, klavye ya da iki oyun kolu. Sırayla: telefonda da olur. Tek tur ya da üç turda iki alan kazanır.')}</p>
              <button className="pixel-btn primary mt-auto shrink-0 justify-center" onClick={onDuel}>
                {t('Düello Kur')}
              </button>
            </section>

            {/* Boss Rush */}
            <section className={`flex flex-col border-2 p-3.5 short:p-2.5 ${rushOpen ? 'border-line bg-ink/40' : 'border-dashed border-line/70'}`}>
              <Eyebrow tone="text-accent">{t('BOSS RUSH')}</Eyebrow>
              <div className="mt-2.5 flex justify-center">
                <BossFigure city="istanbul" className={`h-[64px] w-[76px] short:h-[44px] short:w-[52px] ${rushOpen ? '' : 'opacity-40 grayscale'}`} />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[12px]">{t('Yendiğin bütün boss’lar arka arkaya. Süre ve düşüş birikir.')}</p>
              <p className="mb-3 mt-1 text-[12px] leading-snug text-muted">
                {rushOpen
                  ? rushBest
                    ? t('Rekor: {time} · {n} boss', { time: formatTime(rushBest.timeMs), n: rushBest.bosses })
                    : t('{n} boss hazır. İlk rekoru sen yaz.', { n: bossesBeaten })
                  : t('Açılması için {n} boss yen ({k}/{n}).', { n: rushNeeds, k: bossesBeaten })}
              </p>
              <button className="pixel-btn mt-auto shrink-0 justify-center" disabled={!rushOpen} onClick={onRush}>
                {rushOpen ? t('▶ Koş') : t('Kilitli')}
              </button>
            </section>

            {/* Maraton */}
            <section className={`flex flex-col border-2 p-3.5 short:p-2.5 ${marathonOpen ? 'border-line bg-ink/40' : 'border-dashed border-line/70'}`}>
              <Eyebrow tone="text-[#7ad88a]">{t('MARATON')}</Eyebrow>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                {(['istanbul', 'konya', 'trabzon'] as const).map((c, i) => (
                  <span key={c} className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2438] shadow-[0_0_0_2px_#3d3550] short:h-8 short:w-8 ${marathonOpen ? '' : 'opacity-40 grayscale'} ${i === 1 ? '-translate-y-1.5' : ''}`}>
                    <ItemIcon city={c} taken size={26} />
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-cream/85 short:text-[12px]">{t('Açtığın şehirlerden rastgele üçü, baştan sona arka arkaya. Tek nefeste ne kadar hızlısın?')}</p>
              <p className="mb-3 mt-1 text-[12px] leading-snug text-muted">{marathonOpen ? (marathonBest ? t('Maraton rekorun: {time}', { time: formatTime(marathonBest.timeMs) }) : t('Her koşuda başka üç şehir. İlk rekoru sen yaz.')) : t('Açılması için üç şehir aç.')}</p>
              <button className="pixel-btn mt-auto shrink-0 justify-center" disabled={!marathonOpen} onClick={onMarathon}>
                {marathonOpen ? t('▶ Koş') : t('Kilitli')}
              </button>
            </section>
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
export function DailyEnd({ result, player, status, rank, onRetry, onModes, onLogin }: { result: DailyResult; player: string; status: 'idle' | 'sending' | 'sent' | 'error'; rank: number | null; onRetry: () => void; onModes: () => void; onLogin: () => void }) {
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
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{result.free ? (result.best ? t('YENİ REKOR') : t('KURALLI KOŞU')) : result.best ? t('BUGÜNÜN EN İYİSİ') : t('GÜNLÜK MEYDAN OKUMA')}</p>
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
            <button className="pixel-btn primary justify-center whitespace-nowrap short:py-2" onClick={onRetry} autoFocus>
              {t('↺ Yeniden Dene')}
            </button>
            <button className="pixel-btn justify-center" onClick={onModes}>
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
export function RuleSetup({ startLevel, finished, records, onStart, onBack }: { startLevel: number; /** bitirilmiş şehirlerin dizinleri: kural yalnız bir kez geçilmiş şehirde açılır */ finished: number[]; records: Record<string, number>; onStart: (level: number, rule: DailyRule) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [level, setLevel] = useState(finished.includes(startLevel) ? startLevel : (finished[0] ?? 0))
  const [rule, setRule] = useState<DailyRule>('ceza')
  const lv = localize(LEVELS[level], lng)
  const fits = ruleFits(rule, LEVELS[level])
  const done = RULES.filter((r) => records[ruleKey(lv.id, cityVersion(lv.id), r)] !== undefined).length
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent max-sm:hidden short:hidden">{t('AYNI ŞEHİR, BAŞKA OYUN')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Kurallı Koşu')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {t('← Geri')}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 short:mt-2">
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-2 text-[15px] text-cream outline-none focus:border-gold" aria-label={t('Şehir')}>
            {finished.map((i) => (
              <option key={LEVELS[i].id} value={i}>
                {String(LEVELS[i].plate).padStart(2, '0')} · {displayName(LEVELS[i])} · {t(LEVELS[i].difficulty)}
              </option>
            ))}
          </select>
          <span className="shrink-0 border-2 border-line bg-ink/40 px-2 py-2 text-[12px] tabular-nums text-muted">{t('{n}/{total} kural', { n: done, total: RULES.length })}</span>
        </div>
        <div className="overlay-scroll -mx-1 mt-3 grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto px-1 sm:grid-cols-2 short:mt-2 short:grid-cols-2 wide:grid-cols-3">
          {RULES.map((r) => {
            const def = DAILY_RULES[r]
            const ok = ruleFits(r, LEVELS[level])
            const best = records[ruleKey(lv.id, cityVersion(lv.id), r)]
            const lim = ruleLimit(r, LEVELS[level])
            return (
              <button
                key={r}
                aria-pressed={rule === r}
                disabled={!ok}
                className={`flex flex-col border-2 px-3 py-2 text-left disabled:opacity-45 ${rule === r ? 'border-gold bg-gold/10' : 'border-line bg-ink/40 hover:bg-panel-2'}`}
                onClick={() => setRule(r)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-[17px] text-cream">{t(def.name)}</span>
                  <span className={`shrink-0 text-[12px] tabular-nums ${best !== undefined ? 'text-gold' : 'text-muted'}`}>{best !== undefined ? `★ ${formatTime(best)}` : ok ? t('Rekor Yok') : t('Bu Şehirde Yok')}</span>
                </span>
                <span className="mt-0.5 text-[12px] leading-snug text-muted">
                  {t(def.text)}
                  {lim ? ` ${t('Sınır: {s} sn.', { s: lim })}` : ''}
                </span>
              </button>
            )
          })}
        </div>
        <button className="pixel-btn primary mt-3 w-full shrink-0 justify-center py-2.5 text-base short:mt-2 short:py-2" disabled={!fits} onClick={() => onStart(level, rule)}>
          {t('▶ {city}: {rule}', { city: lv.name, rule: t(DAILY_RULES[rule].name) })}
        </button>
      </div>
    </Overlay>
  )
}

export interface DuelSetupValue {
  level: number
  names: [string, string]
  heroes: [CharacterId, CharacterId]
  bestOf: 1 | 3
  /** sırayla (rakibin hayaletiyle) ya da yan yana (bölünmüş ekranda aynı anda) */
  style: 'sirayla' | 'yanyana'
}

/** Düello kurulumu: iki oyuncunun adı ve kılığı, şehir (açılmış şehirlerden), tur sayısı */
export function DuelSetup({ initial, unlocked, canSide, onStart, onBack }: { initial: DuelSetupValue; unlocked: number; /** yan yana yarış klavye ya da oyun kolu ister: dokunmatik cihazda kapalı */ canSide: boolean; onStart: (v: DuelSetupValue) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [v, setV] = useState<DuelSetupValue>(canSide ? initial : { ...initial, style: 'sirayla' })
  const open = LEVELS.slice(0, Math.min(unlocked, LEVELS.length - 1) + 1)
  const lv = localize(LEVELS[v.level], lng)
  const setName = (k: 0 | 1, name: string) => setV((p) => ({ ...p, names: (k === 0 ? [name, p.names[1]] : [p.names[0], name]) as [string, string] }))
  const swapHero = (k: 0 | 1) => setV((p) => {
    const h = [...p.heroes] as [CharacterId, CharacterId]
    h[k] = h[k] === 'uktun' ? 'memo' : 'uktun'
    return { ...p, heroes: h }
  })
  const ready = v.names.every((n) => n.trim().length > 0)
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent-2">{t('DÜELLO · 2 KİŞİ')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Düello Kur')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {t('← Geri')}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1 short:grid short:grid-cols-2 short:gap-4">
          <div className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((k) => (
              <div key={k} className={`border-2 p-2.5 ${k === 0 ? 'border-accent/70' : 'border-gold/70'}`}>
                <p className="text-[11px] font-bold tracking-[0.2em] text-muted">{t('{n}. OYUNCU', { n: k + 1 })}</p>
                <button type="button" className="mt-1.5 flex w-full items-center gap-2 text-left" onClick={() => swapHero(k)} aria-label={t('Kılığı Değiştir')}>
                  <Portrait id={v.heroes[k]} className="w-[52px] short:w-[40px]" />
                  <span className="text-[12px] leading-snug text-muted">
                    <span className="block font-display text-[16px] text-cream">{CHARACTERS[v.heroes[k]].short}</span>
                    {t('Dokun, kılığı değiştir')}
                  </span>
                </button>
                <label className="mt-2 block text-[11px] font-bold tracking-[0.15em] text-muted">
                  {t('AD')}
                  <input
                    value={v.names[k]}
                    maxLength={16}
                    onChange={(e) => setName(k, e.target.value)}
                    className="mt-1 block w-full border-2 border-line bg-ink px-2 py-1.5 text-[15px] font-normal tracking-normal text-cream outline-none focus:border-gold"
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-3 short:mt-0">
            <p className="text-[11px] font-bold tracking-[0.2em] text-muted">{t('ŞEHİR')}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <select
                value={v.level}
                onChange={(e) => setV((p) => ({ ...p, level: Number(e.target.value) }))}
                className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-2 text-[15px] text-cream outline-none focus:border-gold"
                aria-label={t('Şehir')}
              >
                {open.map((l, i) => (
                  <option key={l.id} value={i}>
                    {String(l.plate).padStart(2, '0')} · {displayName(l)} · {t(l.difficulty)}
                  </option>
                ))}
              </select>
              <button className="pixel-btn shrink-0 px-3 py-2 text-[13px]" onClick={() => setV((p) => ({ ...p, level: Math.floor(Math.random() * open.length) }))}>
                {t('🎲 Rastgele')}
              </button>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-muted">{lv.subtitle} · {t('Altın süre {s} sn', { s: lv.medals[0] })}</p>
            <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-muted">{t('OYNAYIŞ')}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(['sirayla', 'yanyana'] as const).map((k) => (
                <button key={k} aria-pressed={v.style === k} disabled={k === 'yanyana' && !canSide} className={`pixel-btn justify-center py-1.5 text-[13px] ${v.style === k ? 'primary' : ''}`} onClick={() => setV((p) => ({ ...p, style: k }))}>
                  {k === 'sirayla' ? t('Sırayla') : t('Yan Yana')}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-muted">
              {!canSide
                ? t('Tek cihaz elden ele: ikinci koşan rakibinin hayaletini görür. Yan yana yarış klavye ya da oyun kolu ister.')
                : v.style === 'sirayla'
                ? t('Tek cihaz elden ele: ikinci koşan rakibinin hayaletini görür. Telefonda da oynanır.')
                : t('Ekran ikiye bölünür, aynı anda koşarsınız. Klavye (WASD + F, ok tuşları + L) ya da iki oyun kolu gerekir.')}
            </p>
            <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-muted">{t('TUR')}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([1, 3] as const).map((b) => (
                <button key={b} aria-pressed={v.bestOf === b} className={`pixel-btn justify-center py-1.5 text-[13px] ${v.bestOf === b ? 'primary' : ''}`} onClick={() => setV((p) => ({ ...p, bestOf: b }))}>
                  {b === 1 ? t('Tek Tur') : t('3 Tur (2 Alan Kazanır)')}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted">{v.style === 'sirayla' ? t('Skor süre artı düşüş başına 5 saniye; düşük skor turu alır. Turları sırayla açarsınız.') : t('Geri sayım bitince süre ikiniz için birlikte başlar; çıkışa ilk varan turu alır.')}</p>
          </div>
        </div>
        <button className="pixel-btn primary mt-3 w-full shrink-0 justify-center py-2.5 text-base short:mt-2 short:py-2" disabled={!ready} onClick={() => onStart({ ...v, names: [v.names[0].trim(), v.names[1].trim()] })}>
          {t('▶ Düelloyu Başlat')}
        </button>
      </div>
    </Overlay>
  )
}

/** Sıra el değiştiriyor: kim koşacak, rakip ne yaptı */
export function DuelTurn({ setup, rounds, round, turn, onGo, onQuit }: { setup: DuelSetupValue; rounds: DuelRounds; round: number; turn: 0 | 1; onGo: () => void; onQuit: () => void }) {
  const t = useT()
  const lng = useLang()
  const other = (1 - turn) as 0 | 1
  const rival = rounds[round]?.[other]
  const wins = duelWins(rounds)
  const lv = localize(LEVELS[setup.level], lng)
  const both = setup.style === 'yanyana'
  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-md p-5 text-center sm:p-6 short:py-3">
        <p className="text-[11px] font-bold tracking-[0.3em] text-accent-2">
          {t('DÜELLO')} · {lv.name.toLocaleUpperCase(lng)} · {setup.bestOf === 1 ? t('TEK TUR') : t('{n}. TUR', { n: round + 1 })}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 short:mt-1.5">
          {([0, 1] as const).map((k) => (
            <div key={k} className={`flex flex-col items-center ${both || k === turn ? '' : 'opacity-45'}`}>
              <Portrait id={setup.heroes[k]} className={`w-[72px] short:w-[40px] ${both ? (k === 0 ? 'rotate-[-3deg]' : 'rotate-[3deg]') : k === turn ? 'rotate-[-3deg]' : ''}`} />
              <p className="mt-1 max-w-[110px] truncate font-display text-[15px] text-cream">{setup.names[k]}</p>
              {setup.bestOf === 3 && <p className="font-display text-xl text-gold">{wins[k]}</p>}
            </div>
          ))}
        </div>
        <h2 className="mt-3 font-display text-3xl text-cream short:text-2xl">{both ? t('Yan Yana Yarış') : t('Sıra Sende, {name}', { name: setup.names[turn] })}</h2>
        <p className="mt-1.5 text-[14px] text-cream/85">
          {both
            ? t('Solda {a}: WASD ve F. Sağda {b}: ok tuşları ve L. Çıkışa ilk varan turu alır.', { a: setup.names[0], b: setup.names[1] })
            : rival
            ? t('Geçilecek skor: {score} ({time}, ✕{deaths}). Rakibinin hayaleti yanında koşacak.', { score: formatTime(rival.score), time: formatTime(rival.timeMs), deaths: rival.deaths })
            : t('İlk koşu senin. Hızlı ol ama düşme: her düşüş 5 saniye.')}
        </p>
        <p className="mt-1 text-[12px] text-muted short:hidden">{both ? t('Oyun kolu takılıysa birinci kol sola, ikinci kol sağa bağlanır. Üçten geri sayılır.') : t('Cihaz sıradaki oyuncuya geçsin. Hareket edince süre başlar.')}</p>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
          <button className="pixel-btn primary justify-center py-2.5 text-base" onClick={onGo} autoFocus>
            {t('▶ Hazırım')}
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
  const lv = localize(LEVELS[setup.level], lng)
  const done = rounds.filter((r) => roundWinner(r) !== null)
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 text-center sm:p-6 short:max-w-[min(860px,100%)] short:grid short:grid-cols-2 short:gap-5 short:py-3 short:text-left">
        <div>
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent-2">
            {t('DÜELLO BİTTİ')} · {lv.name.toLocaleUpperCase(lng)}
          </p>
          <div className="mt-3 flex items-end justify-center gap-5">
            {([0, 1] as const).map((k) => (
              <div key={k} className="relative flex flex-col items-center">
                {res.winner === k && <span className="absolute -top-4 text-2xl">👑</span>}
                <Portrait id={setup.heroes[k]} className={`w-[84px] short:w-[56px] ${res.winner === k ? 'shadow-[0_0_0_3px_#d9a441]' : res.winner === -1 ? '' : 'opacity-50 grayscale'}`} />
                <p className="mt-1 max-w-[120px] truncate font-display text-[16px] text-cream">{setup.names[k]}</p>
                {setup.bestOf === 3 && <p className="font-display text-2xl leading-none text-gold">{wins[k]}</p>}
              </div>
            ))}
          </div>
          <h2 className="mt-3 font-display text-4xl text-cream short:text-3xl">{res.winner === -1 ? t('Berabere!') : t('{name} Kazandı!', { name: setup.names[res.winner ?? 0] })}</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 short:mt-3">
            <button className="pixel-btn primary justify-center" onClick={onRematch} autoFocus>
              {t('↺ Rövanş')}
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
              <tr className="text-[11px] text-muted">
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
                        <span className="block text-[11px] font-normal text-muted">
                          {formatTime(r[k]!.timeMs)} · ✕{r[k]!.deaths}
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
