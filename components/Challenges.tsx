'use client'

import { useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { medalFor } from '@/components/medal'
import { Board } from '@/components/ScoreBoard'
import { MedalBadge, Overlay, displayName } from '@/components/ui'
import { CHALLENGES, challengeLevel, type Challenge } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/**
 * Mücadele haritaları: zor şehirlerin en sıkı kesitleri. Liste solda, seçilenin sıralaması sağda (telefonda altta).
 * Bir mücadele, kesildiği şehir bir kez bitirilince açılır.
 */
export function ChallengeList({ best, finished, player, onStart, onBack }: { best: Record<string, number>; finished: Set<string>; player: string; onStart: (c: Challenge) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [pick, setPick] = useState(() => CHALLENGES.find((c) => finished.has(c.level)) ?? CHALLENGES[0])
  const done = CHALLENGES.filter((c) => best[c.id]).length
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('{n}/{m} BİTTİ', { n: done, m: CHALLENGES.length })}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Mücadeleler')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {t('← Geri')}
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted short:hidden">{t('Zor şehirlerin en sıkı yerleri, bayraksız ve hatırasız. Tek iş: baştan sona en hızlı var. Şehri bitirince açılır.')}</p>
        <div className="mt-3 grid min-h-0 flex-1 gap-3 max-sm:grid-rows-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:mt-2 short:grid-cols-2">
          <ol className="overlay-scroll min-h-[120px] overflow-y-auto overscroll-contain pr-1">
            {CHALLENGES.map((c) => {
              const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
              const open = finished.has(c.level)
              const ms = best[c.id]
              const medal = ms ? medalFor(challengeLevel(c), ms) : null
              return (
                <li key={c.id}>
                  <button
                    className={`mb-1 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border-2 px-2.5 py-1.5 text-left ${pick.id === c.id ? 'border-gold bg-gold/10' : 'border-line bg-ink/40 hover:bg-panel-2/60'} ${open ? '' : 'opacity-60'}`}
                    aria-pressed={pick.id === c.id}
                    onClick={() => setPick(c)}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2438] ${open ? '' : 'grayscale'}`}>
                      <ItemIcon city={lv.city} taken={open} size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-cream">{t(c.name)}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {displayName(lv)} · {t(lv.difficulty)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 font-display text-[16px] tabular-nums text-cream">
                      {medal && <MedalBadge medal={medal} />}
                      {open ? (ms ? formatTime(ms) : '—') : '🔒'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="flex min-h-0 flex-col">
            <ChallengeCard c={pick} open={finished.has(pick.level)} best={best[pick.id]} onStart={() => onStart(pick)} />
            <div className="overlay-scroll mt-1 min-h-[100px] flex-1 overflow-y-auto pr-1 max-sm:hidden short:hidden">
              <Board kind="city" level={challengeLevel(pick).id} me={player} compact />
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
  const m = challengeLevel(c).medals
  return (
    <section className="border-2 border-line bg-ink/40 p-3 short:p-2">
      <p className="font-display text-xl leading-tight text-cream">{t(c.name)}</p>
      <p className="text-[12px] text-muted">
        {displayName(lv)} · <span className="nowrap">{t('Altın {g} sn · Gümüş {s} sn · Bronz {b} sn', { g: m[0], s: m[1], b: m[2] })}</span>
      </p>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
        <button className="pixel-btn primary justify-center" disabled={!open} onClick={onStart} autoFocus>
          {open ? (best ? t('▶ Yeniden Koş') : t('▶ Koş')) : t('{city} bitince açılır', { city: lv.name })}
        </button>
        {best ? <span className="font-display text-lg tabular-nums text-cream">{formatTime(best)}</span> : null}
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
  const c = CHALLENGES.find((x) => x.id === result.id)!
  const level = challengeLevel(c)
  const medal = medalFor(level, result.timeMs)
  return (
    <Overlay dim>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 sm:p-6 short:grid short:max-w-[min(900px,100%)] short:grid-cols-2 short:gap-5 short:py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{result.best ? t('YENİ REKOR') : result.week ? t('HAFTALIK TURNUVA') : t('MÜCADELE')}</p>
          <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t(c.name)}</h2>
          <p className="mt-3 flex items-center gap-3 font-display text-5xl leading-none tabular-nums text-cream short:mt-1.5 short:text-4xl">
            {formatTime(result.timeMs)}
            {medal && <MedalBadge medal={medal} size="lg" />}
          </p>
          <p className="mt-2 text-[13px] text-muted">
            {t('{deaths} düşüş', { deaths: result.deaths })}
            {result.prev && !result.best ? ` · ${t('Rekorun {time}', { time: formatTime(result.prev) })}` : ''}
            {result.prev && result.best ? ` · ${t('{d} daha hızlı', { d: formatTime(result.prev - result.timeMs) })}` : ''}
          </p>
          {result.relaxed && <p className="mt-1 text-[12px] text-muted">{t('Rahat Mod’da koştun: rekor yazılmadı.')}</p>}
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
              <strong className="text-gold">{t('Bu mücadelede {rank}. sıradasın.', { rank })}</strong>
            ) : null}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 short:mt-2">
            <button className="pixel-btn primary justify-center whitespace-nowrap short:py-2" onClick={onRetry} autoFocus>
              {t('↺ Yeniden Dene')}
            </button>
            <button className="pixel-btn justify-center" onClick={onList}>
              {result.week ? t('Turnuva') : t('Mücadeleler')}
            </button>
          </div>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col short:mt-0">
          <div className="overlay-scroll min-h-[120px] flex-1 overflow-y-auto pr-1">
            {result.week ? <Board kind="turnuva" week={result.week} me={player} refresh={status === 'sent' ? 1 : 0} compact /> : <Board kind="city" level={level.id} me={player} refresh={status === 'sent' ? 1 : 0} compact />}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
