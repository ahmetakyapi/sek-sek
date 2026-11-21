'use client'

import { useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { CourseScene } from '@/components/MapThumb'
import { medalFor } from '@/components/medal'
import { Board } from '@/components/ScoreBoard'
import { MedalBadge, Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { ALL_CHALLENGES, CHALLENGES, RAGE_COURSES, challengeLevel, type Challenge } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/**
 * Mücadele haritaları: zor şehirlerin en sıkı kesitleri. Liste solda, seçilenin sıralaması sağda (telefonda altta).
 * Bir mücadele, kesildiği şehir bir kez bitirilince açılır.
 */
export function ChallengeList({ rage, best, finished, player, onStart, onBack }: { /** Öfke Parkurları (RAGE_COURSES) */ rage?: boolean; best: Record<string, number>; finished: Set<string>; player: string; onStart: (c: Challenge) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const list = rage ? RAGE_COURSES : CHALLENGES
  const [pick, setPick] = useState(() => list.find((c) => finished.has(c.level)) ?? list[0])
  const done = list.filter((c) => best[c.id]).length
  const tone = rage ? 'var(--color-coral)' : 'var(--color-accent-2)'
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1040px,100%)]" style={{ ['--tone' as string]: tone }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-cream short:text-2xl">
              {rage ? t('Öfke Parkurları') : t('Mücadeleler')}
              <span className="flex items-center gap-2 font-mono text-[13px] font-bold text-[var(--tone)]">
                {t('{n}/{m} bitti', { n: done, m: list.length })}
                <span className="h-1 w-16 overflow-hidden rounded-full bg-ink/70" aria-hidden>
                  <span className="block h-full rounded-full bg-[var(--tone)]" style={{ width: `${Math.round((done / list.length) * 100)}%` }} />
                </span>
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{rage ? t('Elle çizilmiş uzun ve acımasız parkurlar. Görünüşünü veren şehri bitirince açılır.') : t('Zor şehirlerin en sıkı yerleri: bayrak yok, hatıra yok, tek iş en hızlı varmak.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="mt-4 grid min-h-0 flex-1 gap-4 max-sm:grid-rows-[minmax(120px,1fr)_auto] max-sm:gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] short:mt-2 short:grid-cols-2 short:gap-3">
          <ol className="overlay-scroll grid min-h-[120px] content-start gap-1.5 overflow-y-auto overscroll-contain pr-1">
            {list.map((c) => {
              const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
              const open = finished.has(c.level)
              const ms = best[c.id]
              const medal = ms ? medalFor(challengeLevel(c), ms) : null
              const on = pick.id === c.id
              return (
                <li key={c.id}>
                  <button
                    className={`mode-tile grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${open ? '' : 'locked'} ${on ? 'border-gold! bg-gold/10!' : ''}`}
                    aria-pressed={on}
                    onClick={() => setPick(c)}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-panel-2 ${open ? '' : 'opacity-50 grayscale'}`}>
                      <ItemIcon city={lv.city} taken={open} size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-display text-[15px] leading-tight ${open ? 'text-cream' : 'text-cream/70'}`}>{t(c.name)}</span>
                      <span className="block truncate text-[12px] text-muted">{open ? `${lv.name} · ${rage ? t('Öfke Parkuru') : t(lv.difficulty)}` : t('🔒 {city} bitince açılır', { city: lv.name })}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-display text-[16px] tabular-nums text-cream">
                      {medal && <MedalBadge medal={medal} />}
                      {open ? (ms ? formatTime(ms) : <span className="text-muted">—</span>) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="flex min-h-0 flex-col">
            <ChallengeCard c={pick} open={finished.has(pick.level)} best={best[pick.id]} onStart={() => onStart(pick)} />
            {/* sıralama sağ sütunun kalanını doldurur (boşken de yerini tutar, iki sütun dengeli) */}
            <div className="mt-3 flex min-h-[100px] flex-1 flex-col max-sm:hidden short:hidden">
              <SectionTitle title={t('Sıralama')} note={t(pick.name)} tone={tone} />
              <div className="overlay-scroll mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
                <Board kind="city" level={challengeLevel(pick).id} me={player} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

function ChallengeCard({ c, open, best, onStart }: { c: Challenge; open: boolean; best?: number; onStart: () => void }) {
  const t = useT()
  const lng = useLang()
  const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
  const level = challengeLevel(c)
  const m = level.medals
  // haritadan kısa bilgiler: uzunluk, bayrak, tehlike ve zamanlamalı engeller (sağ sütun liste kadar dolu, dengeli)
  const all = level.map.join('')
  const n = (re: RegExp) => (all.match(re) ?? []).length
  const facts: Array<[string, number]> = [
    [t('Karo'), level.map[0].length],
    [t('Bayrak'), n(/F/g)],
    [t('Diken'), n(/[\^v]/g)],
    [t('Düşman'), n(/[efhcuxj]/g)],
    [t('Ok Tuzağı'), n(/[<>]/g)],
    [t('Zamanlı'), n(/[{}YMN]/g)],
  ]
  return (
    <section className="mode-card p-3 short:p-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 font-display text-xl leading-tight text-cream">{t(c.name)}</p>
        <p className="shrink-0 text-[13px] text-muted">{displayName(lv)}</p>
      </div>
      <CourseScene map={level.map} city={lv.city} className="mt-2 h-[clamp(72px,20vh,170px)] max-sm:h-20 short:h-14" />
      <dl className="mt-2 grid grid-cols-6 gap-[2px] border-2 border-line bg-line/70 text-center max-sm:hidden short:hidden">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0 bg-panel px-1 py-1">
            <dd className="font-display text-[15px] leading-none tabular-nums text-cream">{v}</dd>
            <dt className="mt-0.5 truncate text-[12px] text-muted">{k}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tabular-nums text-cream/85">
        {(
          [
            ['altin', m[0], t('Altın')],
            ['gumus', m[1], t('Gümüş')],
            ['bronz', m[2], t('Bronz')],
          ] as const
        ).map(([k, v, name]) => (
          <span key={k} className="flex items-center gap-1.5">
            <MedalBadge medal={k} /> <span className="max-sm:hidden">{name}</span> {v} sn
          </span>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-3">
        <button className="pixel-btn primary justify-center" disabled={!open} onClick={onStart} autoFocus>
          {ic(open ? (best ? t('▶ Yeniden Oyna') : t('▶ Oyna')) : t('{city} bitince açılır', { city: lv.name }))}
        </button>
        {best ? (
          <span className="text-right leading-none">
            <span className="block font-display text-lg tabular-nums text-cream">{formatTime(best)}</span>
            <span className="mt-1 block text-[12px] text-muted">{t('Rekorun')}</span>
          </span>
        ) : null}
      </div>
    </section>
  )
}

export interface ChallengeResult {
  id: string
  timeMs: number
  deaths: number
  best: boolean
  /** önceki en iyi (yoksa ilk koşu) */
  prev?: number
  relaxed: boolean
  /** turnuva koşusuysa haftası */
  week?: string
  /** Günün Mücadelesi koşusuysa günü */
  daily?: string
}

export function ChallengeEnd({
  result,
  player,
  status,
  rank,
  weekRank,
  onRetry,
  onList,
  onLogin,
}: {
  result: ChallengeResult
  player: string
  status: 'idle' | 'sending' | 'sent' | 'error'
  rank: number | null
  /** turnuvada toplam ve sıra (üçü bitmediyse null) */
  weekRank?: { total: number; rank: number } | null
  onRetry: () => void
  onList: () => void
  onLogin: () => void
}) {
  const t = useT()
  const c = ALL_CHALLENGES.find((x) => x.id === result.id)!
  const level = challengeLevel(c)
  const medal = medalFor(level, result.timeMs)
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 sm:grid sm:max-w-[min(920px,100%)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-6 sm:p-6 short:gap-5 short:py-3">
        <div className="flex min-w-0 flex-col">
          <p className={`text-[13px] font-bold ${result.best ? 'text-gold' : 'text-accent-2'}`}>{result.best ? t('★ Yeni Rekor') : result.week ? t('Haftalık Turnuva') : result.daily ? t('Günün Mücadelesi') : t('Mücadele')}</p>
          <h2 className="mt-1 font-display text-3xl leading-tight text-cream short:text-2xl">{t(c.name)}</h2>
          <p className="mt-3 flex items-center gap-3 font-display text-5xl leading-none tabular-nums text-cream short:mt-1.5 short:text-4xl">
            {formatTime(result.timeMs)}
            {medal && <MedalBadge medal={medal} size="lg" />}
          </p>
          <p className="mt-2 text-[13px] text-muted">
            {t('{deaths} düşüş', { deaths: result.deaths })}
            {result.prev && !result.best ? ` · ${t('Rekorun {time}', { time: formatTime(result.prev) })}` : ''}
            {result.prev && result.best ? ` · ${t('{d} daha hızlı', { d: formatTime(result.prev - result.timeMs) })}` : ''}
          </p>
          {result.relaxed && <p className="mt-1 text-[13px] text-muted">{t('Rahat Mod’da koştun: rekor yazılmadı.')}</p>}
          <p className="mt-1 text-[13px]">
            {result.relaxed ? null : !player ? (
              <button className="text-gold underline underline-offset-4" onClick={onLogin}>
                {t('Sıralamaya girmek için giriş yap')}
              </button>
            ) : status === 'sending' ? (
              <span className="text-muted">{t('Skorun kaydediliyor…')}</span>
            ) : status === 'error' ? (
              <span className="text-accent-2">{t('Skor kaydedilemedi. Bağlantını kontrol et ya da yeniden giriş yap.')}</span>
            ) : status === 'sent' && result.week ? (
              weekRank ? (
                <strong className="text-gold">{t('Turnuvada toplam {time} ile {rank}. sıradasın.', { time: formatTime(weekRank.total), rank: weekRank.rank })}</strong>
              ) : (
                <span className="text-muted">{t('Üç mücadeleyi de bitirince turnuva sıralamasına girersin.')}</span>
              )
            ) : status === 'sent' && rank ? (
              <strong className="text-gold">{result.daily ? t('Bugünün sıralamasında {rank}. sıradasın.', { rank }) : t('Bu mücadelede {rank}. sıradasın.', { rank })}</strong>
            ) : null}
          </p>
          {/* parkurun kuşbakışı ve madalya hedefleri: hangisine yetiştin, sıradaki ne kadar uzakta */}
          <CourseScene map={level.map} city={LEVELS.find((l) => l.id === c.level)!.city} className="mt-4 h-[clamp(64px,20vh,170px)] max-sm:hidden short:hidden" />
          <dl className="mt-2 grid grid-cols-3 gap-[2px] border-2 border-line bg-line/70 text-center short:hidden">
            {(
              [
                ['altin', level.medals[0], t('Altın')],
                ['gumus', level.medals[1], t('Gümüş')],
                ['bronz', level.medals[2], t('Bronz')],
              ] as const
            ).map(([k, v, name]) => {
              const got = result.timeMs <= v * 1000
              return (
                <div key={k} className={`min-w-0 px-1 py-1.5 ${got ? 'bg-panel-2' : 'bg-panel'}`}>
                  <dd className={`flex items-center justify-center gap-1.5 font-display text-[15px] leading-none tabular-nums ${got ? 'text-cream' : 'text-cream/60'}`}>
                    <MedalBadge medal={k} /> {v} sn
                  </dd>
                  <dt className="mt-1 text-[12px] text-muted">{got ? t('{m} Yetişti', { m: name }) : name}</dt>
                </div>
              )
            })}
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-auto sm:pt-4 short:mt-2 short:pt-2">
            <button className="pixel-btn primary justify-center whitespace-nowrap px-3 short:py-2" onClick={onRetry} autoFocus>
              {ic(t('↺ Yeniden Dene'))}
            </button>
            <button className="pixel-btn justify-center" onClick={onList}>
              {result.week ? t('Turnuva') : result.daily ? t('Modlar') : t('Mücadeleler')}
            </button>
          </div>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-0">
          <SectionTitle title={result.week ? t('Bu Haftanın Sıralaması') : result.daily ? t('Bugünün Sıralaması') : t('Sıralama')} />
          <div className="overlay-scroll mt-1 min-h-[120px] flex-1 overflow-y-auto pr-1 sm:max-h-[min(440px,calc(100dvh-140px))]">
            {result.week ? <Board kind="turnuva" week={result.week} me={player} refresh={status === 'sent' ? 1 : 0} compact /> : result.daily ? <Board kind="gunluk-m" day={result.daily} me={player} refresh={status === 'sent' ? 1 : 0} compact /> : <Board kind="city" level={level.id} me={player} refresh={status === 'sent' ? 1 : 0} compact />}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
