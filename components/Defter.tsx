'use client'

import { useMemo, useState } from 'react'
import Album from '@/components/Album'
import MusicBox from '@/components/MusicBox'
import ProfileView from '@/components/ProfileView'
import { BossFigure } from '@/components/Figures'
import { ItemIcon, ThingIcon } from '@/components/HudBits'
import { MedalBadge, Overlay, SectionTitle, displayName, medalFor, ic } from '@/components/ui'
import type { Sound } from '@/game/audio'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { SCARVES, emptyStats, liveStreak, travelerTitle } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { ACHIEVEMENTS, isEarned } from '@/lib/achievements'
import { profileFromSave } from '@/lib/profile'
import { formatTime, titleFacts, type Save } from '@/lib/storage'

/** Boss Rush’ın açılması için yenilmesi gereken boss sayısı */
export const RUSH_NEEDS = 3

/**
 * Yol Defteri: yolculukta toplanan her şey tek sayfada. Üstte toplamlar tek şeritte; sekmeler şehirler (üç hatıra,
 * gizli pul, nazar boncuğu, meydanın boss’u), albüm, başarımlar (üstünde yol sayaçları, görevler, Günlük ve Boss Rush) ve müzik.
 */
export default function Defter({ save, today, sound, onClose, onModes, onMusicOn, onPins }: { save: Save; today: string; sound: Sound | null; onClose: () => void; onModes: () => void; onMusicOn: () => void; onPins?: (pins: string[]) => void }) {
  const t = useT()
  const lang = useLang()
  const n = LEVELS.length
  const items = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
  const stamps = LEVELS.filter((l) => save.stamps[l.id]).length
  const charms = LEVELS.filter((l) => save.charms[l.id]).length
  const bosses = LEVELS.filter((l) => save.bosses[l.id]).length
  const scarves = SCARVES.filter((s) => charms >= s.need).length
  const stats = save.stats ?? emptyStats()
  const [tab, setTab] = useState<'profil' | 'sehir' | 'album' | 'basarim' | 'muzik'>('profil')
  const who = save.player?.name || save.name || t('Gezgin')
  const profile = useMemo(() => profileFromSave(save, today, { name: who }), [save, today, who])
  const got = ACHIEVEMENTS.filter((a) => isEarned(a, save)).length
  const streak = liveStreak(save.meydan, today)
  const mins = Math.round(stats.playMs / 60000)
  const hours = mins >= 60 ? t('{h} sa {m} dk', { h: Math.floor(mins / 60), m: mins % 60 }) : t('{m} dk', { m: mins })
  const totals: [string, number, number][] = [
    [t('Hatıra'), items, n * 3],
    [t('Gizli Pul'), stamps, n],
    [t('Nazar Boncuğu'), charms, n],
    [t('Boss'), bosses, n],
    [t('Usta Mührü'), LEVELS.filter((l) => save.ustalar?.[l.id]).length, n],
    [t('Atkı'), scarves, SCARVES.length],
  ]
  const journey: [string, string][] = [
    [t('Koşu'), stats.runs.toLocaleString(lang)],
    [t('Zıplama'), stats.jumps.toLocaleString(lang)],
    [t('Dash'), stats.dashes.toLocaleString(lang)],
    [t('Düşüş'), stats.deaths.toLocaleString(lang)],
    [t('Ezilen Düşman'), stats.stomps.toLocaleString(lang)],
    [t('Yolda Geçen Süre'), hours],
  ]
  const compact = tab === 'album' || tab === 'muzik' || tab === 'profil'
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1100px,100%)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-display text-3xl leading-none text-cream short:text-2xl">
              {t('Yol Defteri')}
              <span className="border-2 border-gold/80 bg-gold/10 px-2 py-0.5 font-mono text-[13px] font-bold leading-snug text-gold" title={t('Unvanın: yolculuğunun en parlak yanı')}>
                ★ {t(travelerTitle(titleFacts(save, today)))}
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Yolculukta topladığın her şey: şehirler, albüm, başarımlar ve besteler.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onClose}>
            {ic(t('← Geri'))}
          </button>
        </div>

        {/* toplamlar tek şeritte; albüm ve müzik açıkken telefonda sayfaya yer bırakır */}
        <dl className={`mt-4 grid grid-cols-3 gap-[2px] border-2 border-line bg-line/70 sm:grid-cols-6 short:mt-2 short:grid-cols-6 ${tab === 'profil' ? 'hidden' : compact ? 'max-sm:hidden short:hidden' : ''}`}>
          {totals.map(([k, v, max]) => (
            <div key={k} className="min-w-0 bg-panel px-2 py-2 text-center short:py-1">
              <dd className={`font-display text-lg leading-none tabular-nums short:text-base ${v === max ? 'text-gold' : 'text-cream'}`}>
                {v}
                <span className="text-[13px] text-muted">/{max}</span>
              </dd>
              <dt className="mt-1 truncate text-[12px] text-muted">{k}</dt>
              <span className="mx-auto mt-1.5 block h-1 w-full max-w-[96px] overflow-hidden rounded-full bg-ink/80 max-sm:hidden short:hidden" aria-hidden>
                <span className={`block h-full rounded-full ${v === max ? 'bg-gold' : 'bg-accent'}`} style={{ width: `${Math.round((v / max) * 100)}%` }} />
              </span>
            </div>
          ))}
        </dl>

        <div className="seg seg-tabs mt-3 shrink-0 short:mt-2" role="tablist">
          {(
            [
              ['profil', t('Profil')],
              ['sehir', t('Şehirler')],
              ['album', t('Albüm')],
              [
                'basarim',
                <>
                  {t('Başarımlar')}
                  <span className="ml-1.5 tabular-nums text-muted max-sm:hidden">{got}/{ACHIEVEMENTS.length}</span>
                </>,
              ],
              [
                'muzik',
                <>
                  <span className="max-sm:hidden">{t('Müzik Kutusu')}</span>
                  <span className="sm:hidden">{t('Müzik')}</span>
                </>,
              ],
            ] as const
          ).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'profil' ? (
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <ProfileView
              fit
              data={profile}
              actions={
                save.player ? (
                  <a href={`/oyuncu/${encodeURIComponent(save.player.name)}`} target="_blank" rel="noreferrer" className="pixel-btn inline-flex items-center px-3 text-[14px]">
                    {t('Herkese Açık Profilim')} ↗
                  </a>
                ) : (
                  <p className="text-[13px] leading-snug text-muted max-sm:hidden">{t('Hesap açınca profilin herkese açılır ve sıralamada görünür.')}</p>
                )
              }
            />
          </div>
        ) : tab === 'album' ? (
          <Album save={save} />
        ) : tab === 'muzik' ? (
          <MusicBox save={save} sound={sound} onMusicOn={onMusicOn} />
        ) : tab === 'basarim' ? (
          <div className="overlay-scroll mt-2 min-h-[120px] overflow-y-auto pr-1">
            {/* yolculuğun sayaçları ve iki kısayol: başarımların hemen üstünde, onlarla birlikte kayar */}
            <section className="mode-card grid gap-3 p-3 [--tone:var(--color-gold)] wide:grid-cols-[minmax(0,1fr)_auto] wide:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <SectionTitle title={t('Yolculuğun')} />
                  <span className="text-[13px] text-muted">{t('{d} günlük ve {w} haftalık görev tamamlandı', { d: save.daily.count, w: save.weekly.count })}</span>
                </div>
                <dl className="mt-2.5 grid grid-cols-3 gap-x-4 gap-y-2 tabular-nums sm:grid-cols-[repeat(6,auto)] sm:justify-between">
                  {journey.map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dd className="font-display text-[17px] leading-none text-cream">{v}</dd>
                      <dt className="mt-0.5 text-[12px] leading-tight text-muted sm:whitespace-nowrap">{k}</dt>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 wide:w-[372px]">
                <button className="pixel-btn tone flex-col items-start gap-0.5 px-3 py-2 text-left [--tone:var(--color-gold)] max-sm:flex-row max-sm:items-center max-sm:justify-between max-sm:gap-3" onClick={onModes}>
                  <span className="text-[12px] font-bold">{t('Günlük Meydan Okuma')}</span>
                  <span className="text-[13px] text-cream">{ic(streak ? t('🔥 {n} günlük seri', { n: streak }) : t('▶ Bugün Oyna'))}</span>
                </button>
                <button className="pixel-btn tone flex-col items-start gap-0.5 px-3 py-2 text-left [--tone:var(--color-coral)] max-sm:flex-row max-sm:items-center max-sm:justify-between max-sm:gap-3" onClick={onModes}>
                  <span className="text-[12px] font-bold">{t('Boss Rush')}</span>
                  <span className="text-[13px] text-cream">
                    {ic(bosses < RUSH_NEEDS ? t('🔒 Önce {n} Boss Yen', { n: RUSH_NEEDS }) : save.rush ? t('Rekor {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses }) : t('▶ Arka Arkaya Yen'))}
                  </span>
                </button>
              </div>
            </section>
            <SectionTitle className="mt-4" title={t('Başarımlar')} note={t('{n}/{m} açıldı', { n: got, m: ACHIEVEMENTS.length })} />
          <ul className="mt-2 grid grid-cols-1 content-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const [now, goal] = a.progress(save)
              const done = now >= goal
              return (
                <li key={a.id} className={`flex items-center gap-3 border-2 px-3 py-2 ${done ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-xl ${done ? 'bg-gold text-ink shadow-[0_3px_0_rgba(0,0,0,0.3)]' : 'bg-panel-2 text-muted'}`}>{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-display text-[15px] leading-tight ${done ? 'text-cream' : 'text-cream/80'}`}>{t(a.name)}</span>
                    <span className="block text-[13px] leading-snug text-muted">{t(a.text)}</span>
                    {!done && goal > 1 && (
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden bg-ink">
                          <span className="block h-full bg-accent" style={{ width: `${Math.round((now / goal) * 100)}%` }} />
                        </span>
                        <span className="shrink-0 text-[12px] tabular-nums text-muted">
                          {a.id === 'hour' ? `${Math.floor(now / 60000)}/${goal / 60000} ${t('dk')}` : `${now}/${goal}`}
                        </span>
                      </span>
                    )}
                  </span>
                  {done && onPins && (
                    <button
                      className={`flex h-11 w-11 shrink-0 items-center justify-center text-[20px] leading-none ${profile.pins.includes(a.id) ? 'text-gold' : 'text-muted hover:text-cream'}`}
                      aria-pressed={profile.pins.includes(a.id)}
                      aria-label={profile.pins.includes(a.id) ? t('{name} Vitrinden Kaldır', { name: t(a.name) }) : t('{name} Vitrine Sabitle', { name: t(a.name) })}
                      title={profile.pins.includes(a.id) ? t('Vitrinden Kaldır') : profile.pins.length >= 3 ? t('Vitrin dolu: önce birini kaldır') : t('Profil vitrinine sabitle')}
                      disabled={!profile.pins.includes(a.id) && profile.pins.length >= 3}
                      onClick={() => onPins(profile.pins.includes(a.id) ? profile.pins.filter((x) => x !== a.id) : [...profile.pins, a.id])}
                    >
                      {profile.pins.includes(a.id) ? '★' : '☆'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          </div>
        ) : (
        <ul className="overlay-scroll mt-2 grid min-h-[120px] grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 wide:grid-cols-4">
          {LEVELS.map((l, i) => {
            const locked = i > save.unlocked
            const best = save.best[l.id]
            const beaten = !!save.bosses[l.id]
            const boss = BOSSES[l.city]
            return (
              <li key={l.id} className={`flex items-center gap-2.5 border-2 px-2.5 py-1.5 ${locked ? 'border-dashed border-line/80 bg-ink/30' : 'border-line bg-panel-2'}`}>
                <span className={`plate shrink-0 text-[12px] ${locked ? 'opacity-50' : ''}`}>
                  <span>{String(l.plate).padStart(2, '0')}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`flex items-center gap-1.5 font-display text-[15px] leading-tight ${locked ? 'text-cream/60' : 'text-cream'}`}>
                    <span className="truncate" title={displayName(l)}>{l.name}</span>
                    {best && !best.stale && <MedalBadge medal={medalFor(l, best.timeMs)} />}
                  </p>
                  <p className={`mt-1 flex items-center gap-1.5 ${locked ? 'opacity-50' : ''}`} title={localize(l, lang).item}>
                    {[0, 1, 2].map((k) => (
                      <ItemIcon key={k} city={l.city} taken={!!best?.items[k]} size={17} />
                    ))}
                    <span className="mx-0.5 h-4 w-px bg-line" />
                    <ThingIcon kind="stamp" taken={!!save.stamps[l.id]} size={17} />
                    <ThingIcon kind="charm" taken={!!save.charms[l.id]} size={17} />
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">{locked ? t('🔒 Önceki şehri bitirince açılır') : beaten ? (lang === 'en' ? boss.nameEn : boss.name) : t('Boss: ???')}</p>
                </div>
                <BossFigure city={l.city} className={`h-10 w-10 shrink-0 ${beaten ? '' : locked ? 'opacity-20 brightness-0' : 'opacity-40 brightness-0'}`} />
              </li>
            )
          })}
        </ul>
        )}
      </div>
    </Overlay>
  )
}
