'use client'

import { useEffect, useState } from 'react'
import { ItemIcon } from '@/components/HudBits'
import { CourseScene } from '@/components/MapThumb'
import { medalFor } from '@/components/medal'
import { Board } from '@/components/ScoreBoard'
import { MedalBadge, Overlay, displayName, ic } from '@/components/ui'
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
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{left === 1 ? t('BUGÜN SON GÜN') : t('BİTİŞE {n} GÜN', { n: left })}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Haftalık Turnuva')}</h2>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted short:hidden">
          {t('Bu hafta herkes aynı üç mücadelede koşar. Üçünü de bitirenler toplam süreyle sıralanır; pazar gecesi tablo kapanır.')}
          {winner ? ` ${t('Geçen haftanın birincisi: {name} ({time}).', { name: winner.name, time: formatTime(winner.timeMs) })}` : ''}
        </p>
        <div className="mt-3 grid min-h-0 flex-1 gap-3 max-sm:grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:mt-2 short:grid-cols-2">
          {/* sol sütun sağdaki sıralama kadar uzar: her mücadele kartı eşit pay alır, altında kesitin kuşbakışı */}
          <div className="flex min-h-0 flex-col gap-1.5">
            {ids.map((id, i) => {
              const c = CHALLENGES.find((x) => x.id === id)!
              const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
              const ms = best[id]
              const medal = ms ? medalFor(challengeLevel(c), ms) : null
              return (
                <section key={id} className="flex min-h-0 flex-1 flex-col border-2 border-line bg-ink/40 px-2.5 py-2 short:py-1">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#221f4a] font-display text-[15px] text-gold shadow-[0_0_0_2px_#d9a441]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate font-semibold text-cream">
                      <ItemIcon city={lv.city} taken size={18} />
                      {t(c.name)}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
                      <span className="truncate">{displayName(lv)} · {ms ? formatTime(ms) : t('henüz koşulmadı')}</span>
                      {medal && <MedalBadge medal={medal} />}
                    </span>
                  </span>
                  <button className={`pixel-btn justify-center px-3 py-1.5 text-[13px] ${ms ? '' : 'primary'}`} onClick={() => onStart(c)} autoFocus={i === ids.findIndex((x) => !best[x])}>
                    {ic(ms ? t('↺ Yeniden') : t('▶ Oyna'))}
                  </button>
                  </div>
                  <CourseScene map={challengeLevel(c).map} city={lv.city} className="mt-1.5 h-[clamp(56px,14vh,140px)] max-sm:hidden short:hidden" />
                </section>
              )
            })}
            <p className="mt-0.5 flex shrink-0 items-baseline justify-between gap-3 border-t-2 border-line px-1 pt-2">
              <span className="text-[13px] font-bold text-gold">{t('Toplamın')}</span>
              <span className="font-display text-2xl leading-none tabular-nums text-cream">{total ? formatTime(total) : `${Object.keys(best).filter((k) => ids.includes(k)).length}/3`}</span>
            </p>
          </div>
          {/* sıralama çerçeveli kutuda, sağ sütunun boyunca (boşken de yerini tutar, iki sütun dengeli) */}
          <div className="flex min-h-0 flex-col border-2 border-line bg-ink/30 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex flex-1 items-center gap-2 text-[12px] font-bold tracking-[0.14em] text-gold">
                {t('BU HAFTANIN SIRALAMASI')} <span className="kilim h-[6px] flex-1 opacity-50" />
              </p>
              {friends.length > 0 && (
                <button aria-pressed={onlyFriends} className={`pixel-btn px-2 py-1 text-[13px] ${onlyFriends ? 'primary' : ''}`} onClick={() => setOnlyFriends((v) => !v)}>
                  ★ {t('Arkadaşlar')}
                </button>
              )}
            </div>
            <div className="overlay-scroll mt-1.5 min-h-[100px] flex-1 overflow-y-auto pr-1">
              <Board kind="turnuva" week={week} me={player} compact names={onlyFriends ? friends : undefined} />
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
