'use client'

import { useEffect, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { CourseScene } from '@/components/MapThumb'
import { medalFor } from '@/components/medal'
import { Board } from '@/components/ScoreBoard'
import { MedalBadge, Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { CHALLENGES, challengeLevel, type Challenge } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { istanbulDay, shiftDay, tournamentFor, tournamentTotal, tournamentWeek, type TournamentMark } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Pazar gecesine (İstanbul) kaç gün kaldı: 1 = bugün son gün */
export function daysLeft(today: string) {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return dow === 0 ? 1 : 8 - dow
}

/** Geçen haftanın birincisi: Modlar kartında ve turnuva ekranında görünür */
export function useLastWinner(today: string) {
  const [winner, setWinner] = useState<{ name: string; timeMs: number } | null>(null)
  useEffect(() => {
    let live = true
    fetch(`/api/scores?level=turnuva&week=${tournamentWeek(shiftDay(today, -7))}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { scores?: { name: string; timeMs: number }[] } | null) => live && setWinner(j?.scores?.[0] ?? null))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [today])
  return winner
}

/**
 * Haftalık Turnuva: herkes için aynı üç mücadele haritası, pazar gecesi kapanır. Üçünü de bitirenler toplam süreyle
 * sıralanır; kilitli şehrin kesiti de gelebilir (turnuva herkese açık).
 */
export function TournamentHub({ mark, player, friends, onStart, onBack }: { mark: TournamentMark | null | undefined; player: string; friends: string[]; onStart: (c: Challenge) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const today = istanbulDay(new Date())
  const week = tournamentWeek(today)
  const ids = tournamentFor(week)
  const best = mark?.week === week ? mark.best : {}
  const total = tournamentTotal(mark, week)
  const winner = useLastWinner(today)
  const [onlyFriends, setOnlyFriends] = useState(false)
  const left = daysLeft(today)
  /** sıradaki koşulmamış mücadele: ekranın tek dolu düğmesi */
  const next = ids.findIndex((x) => !best[x])
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-cream short:text-2xl">
              {t('Haftalık Turnuva')}
              <span className={`border-2 px-2 py-0.5 font-mono text-[13px] font-bold leading-snug ${left === 1 ? 'border-coral/80 bg-coral/10 text-coral' : 'border-gold/70 bg-gold/10 text-gold'}`}>
                {left === 1 ? t('Bugün Son Gün') : t('{n} Gün Kaldı', { n: left })}
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Herkes aynı üç mücadelede koşar; üçünü bitirenler toplam süreyle sıralanır.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="mt-4 grid min-h-0 flex-1 gap-4 max-sm:grid-rows-[auto_minmax(0,1fr)] max-sm:gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:mt-2 short:grid-cols-2 short:gap-3">
          {/* sol sütun sağdaki sıralama kadar uzar: her mücadele kartı eşit pay alır, altında kesitin kuşbakışı */}
          <div className="flex min-h-0 flex-col gap-1.5">
            {ids.map((id, i) => {
              const c = CHALLENGES.find((x) => x.id === id)!
              const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
              const ms = best[id]
              const medal = ms ? medalFor(challengeLevel(c), ms) : null
              return (
                <section key={id} className={`mode-tile flex min-h-0 flex-1 flex-col px-2.5 py-2 short:py-1 ${ms ? '[--tone:var(--color-teal)]' : '[--tone:var(--color-gold)]'}`}>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-panel-2 font-display text-[15px] ${ms ? 'text-teal shadow-[0_0_0_2px_var(--color-teal)]' : 'text-gold shadow-[0_0_0_2px_var(--color-gold)]'}`}>
                    {ms ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-display text-[16px] leading-tight text-cream">
                      <ItemIcon city={lv.city} taken size={18} />
                      {t(c.name)}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
                      <span className="truncate">
                        {displayName(lv)}
                        {ms ? (
                          <>
                            {' · '}
                            <strong className="font-semibold tabular-nums text-cream">{formatTime(ms)}</strong>
                          </>
                        ) : (
                          <span className="max-sm:hidden"> · {t('henüz koşulmadı')}</span>
                        )}
                      </span>
                      {medal && <MedalBadge medal={medal} />}
                    </span>
                  </span>
                  <button className={`pixel-btn justify-center px-3 py-1.5 text-[13px] ${i === next ? 'primary' : 'tone'}`} onClick={() => onStart(c)} autoFocus={i === next}>
                    {ic(ms ? t('↺ Yeniden') : t('▶ Oyna'))}
                  </button>
                  </div>
                  <CourseScene map={challengeLevel(c).map} city={lv.city} className="mt-1.5 h-[clamp(56px,14vh,140px)] max-sm:hidden short:hidden" />
                </section>
              )
            })}
            <div className="mt-0.5 flex shrink-0 items-end justify-between gap-3 border-t-2 border-line px-1 pt-2">
              <span className="min-w-0 text-[13px] leading-snug text-muted">
                <strong className="block font-bold text-gold">{t('Toplamın')}</strong>
                {winner ? t('Geçen haftanın birincisi: {name} ({time}).', { name: winner.name, time: formatTime(winner.timeMs) }) : null}
              </span>
              <span className="shrink-0 font-display text-2xl leading-none tabular-nums text-cream">{total ? formatTime(total) : `${Object.keys(best).filter((k) => ids.includes(k)).length}/3`}</span>
            </div>
          </div>
          {/* sıralama sağ sütunun boyunca (boşken de yerini tutar, iki sütun dengeli) */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle title={t('Bu Haftanın Sıralaması')} />
              {friends.length > 0 && (
                <div className="seg [--seg-on:var(--color-gold)]">
                  <button aria-pressed={onlyFriends} onClick={() => setOnlyFriends((v) => !v)}>
                    {onlyFriends ? '★' : '☆'} {t('Arkadaşlar')}
                  </button>
                </div>
              )}
            </div>
            <div className="overlay-scroll mt-1 min-h-[100px] flex-1 overflow-y-auto pr-1">
              <Board kind="turnuva" week={week} me={player} compact names={onlyFriends ? friends : undefined} />
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
