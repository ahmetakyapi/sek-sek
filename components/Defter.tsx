'use client'

import { useState } from 'react'
import Album from '@/components/Album'
import MusicBox from '@/components/MusicBox'
import { BossFigure } from '@/components/Figures'
import { ItemIcon, ThingIcon } from '@/components/HudBits'
import { MedalBadge, Overlay, displayName, medalFor } from '@/components/ui'
import type { Sound } from '@/game/audio'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { SCARVES, emptyStats, liveStreak, travelerTitle } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { ACHIEVEMENTS, isEarned } from '@/lib/achievements'
import { formatTime, titleFacts, type Save } from '@/lib/storage'

/** Boss Rush’ın açılması için yenilmesi gereken boss sayısı */
export const RUSH_NEEDS = 3

/**
 * Yol Defteri: yolculukta toplanan her şey tek sayfada. Şehir başına üç hatıra, gizli pul, nazar boncuğu
 * ve meydanın bekçisi; üstte toplamlar, görev rozetleri ve Boss Rush.
 */
export default function Defter({ save, today, sound, onClose, onModes, onMusicOn }: { save: Save; today: string; sound: Sound | null; onClose: () => void; onModes: () => void; onMusicOn: () => void }) {
  const t = useT()
  const lang = useLang()
  const n = LEVELS.length
  const items = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
  const stamps = LEVELS.filter((l) => save.stamps[l.id]).length
  const charms = LEVELS.filter((l) => save.charms[l.id]).length
  const bosses = LEVELS.filter((l) => save.bosses[l.id]).length
  const scarves = SCARVES.filter((s) => charms >= s.need).length
  const stats = save.stats ?? emptyStats()
  const [tab, setTab] = useState<'sehir' | 'album' | 'basarim' | 'muzik'>('sehir')
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
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3 wide:max-w-[min(1100px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{t('YOLCULUĞUN ÖZETİ')}</p>
            <h2 className="mt-1 flex flex-wrap items-baseline gap-x-3 font-display text-3xl text-cream short:text-2xl">
              {t('Yol Defteri')}
              <span className="border-2 border-gold bg-gold/10 px-2 py-0.5 text-[13px] tracking-[0.06em] text-gold" title={t('Unvanın: yolculuğunun en parlak yanı')}>
                ★ {t(travelerTitle(titleFacts(save, today)))}
              </span>
            </h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onClose}>
            {t('← Geri')}
          </button>
        </div>

        <div className={`mt-4 grid grid-cols-3 gap-1.5 text-center sm:grid-cols-6 sm:gap-2 short:mt-2 short:grid-cols-6 ${tab === 'album' || tab === 'muzik' ? 'max-sm:hidden short:hidden' : ''}`}>
          {totals.map(([k, v, max]) => (
            <div key={k} className={`border-2 py-1.5 short:py-1 ${v === max ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
              <p className="font-display text-base leading-none tabular-nums text-cream sm:text-lg">
                {v}
                <span className="text-sm text-muted">/{max}</span>
              </p>
              <p className="mt-1 truncate px-0.5 text-[12px] text-muted">{k}</p>
            </div>
          ))}
        </div>

        {/* Albüm açıkken görev ve istatistik satırları sayfaya yer bırakır */}
        <div className={`mt-3 grid-cols-2 gap-2 sm:grid-cols-3 short:hidden ${tab === 'album' || tab === 'muzik' ? 'hidden' : 'grid'}`}>
          <div className="border-2 border-line bg-ink/40 px-3 py-2 max-sm:hidden">
            <p className="text-[12px] font-bold tracking-[0.18em] text-gold">{t('GÖREVLER')}</p>
            <p className="mt-0.5 text-[13px] text-cream">{t('{d} gün · {w} hafta tamamlandı', { d: save.daily.count, w: save.weekly.count })}</p>
          </div>
          <button className="pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left" onClick={onModes}>
            <span className="text-[12px] font-bold tracking-[0.18em] text-gold">{t('GÜNLÜK MEYDAN OKUMA')}</span>
            <span className="text-[13px]">{streak ? t('🔥 {n} günlük seri', { n: streak }) : t('▶ Bugün Oyna, Seriyi Başlat')}</span>
          </button>
          <button className="pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left" onClick={onModes}>
            <span className="text-[12px] font-bold tracking-[0.18em] text-gold">{t('BOSS RUSH')}</span>
            <span className="text-[13px]">
              {bosses < RUSH_NEEDS
                ? t('Önce {n} Boss Yen', { n: RUSH_NEEDS })
                : save.rush
                  ? t('Rekor: {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })
                  : t('▶ Yendiğin Boss’larla Arka Arkaya')}
            </span>
          </button>
        </div>

        {/* yol istatistikleri: küçük sayaçlar, bir bakışta */}
        <p className={`mt-2 flex-wrap gap-x-4 gap-y-0.5 text-[13px] tabular-nums text-muted max-sm:hidden short:hidden ${stats.runs && tab !== 'album' && tab !== 'muzik' ? 'flex' : 'hidden'}`}>
          {(
            [
              [t('Koşu'), stats.runs],
              [t('Zıplama'), stats.jumps],
              [t('Dash'), stats.dashes],
              [t('Düşüş'), stats.deaths],
              [t('Ezilen Düşman'), stats.stomps],
            ] as const
          ).map(([k, v]) => (
            <span key={k}>
              {k} <strong className="text-cream">{v.toLocaleString(lang)}</strong>
            </span>
          ))}
          <span>
            {t('Yolda Geçen Süre')} <strong className="text-cream">{hours}</strong>
          </span>
        </p>

        <div className="mt-3 -mx-1 flex shrink-0 items-center gap-2 overflow-x-auto p-1 short:mt-2" role="tablist">
          {(
            [
              ['sehir', t('Şehirler')],
              ['album', t('Albüm')],
              ['basarim', `${t('Başarımlar')} ${got}/${ACHIEVEMENTS.length}`],
              ['muzik', t('Müzik Kutusu')],
            ] as const
          ).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`pixel-btn shrink-0 whitespace-nowrap px-3 py-1.5 text-[13px] ${tab === k ? 'primary' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'album' ? (
          <Album save={save} />
        ) : tab === 'muzik' ? (
          <MusicBox save={save} sound={sound} onMusicOn={onMusicOn} />
        ) : tab === 'basarim' ? (
          <ul className="overlay-scroll mt-2 grid min-h-[120px] grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
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
                </li>
              )
            })}
          </ul>
        ) : (
        <ul className="overlay-scroll mt-2 grid min-h-[120px] grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 wide:grid-cols-4">
          {LEVELS.map((l, i) => {
            const locked = i > save.unlocked
            const best = save.best[l.id]
            const beaten = !!save.bosses[l.id]
            const boss = BOSSES[l.city]
            return (
              <li key={l.id} className={`flex items-center gap-2.5 border-2 px-2.5 py-1.5 ${locked ? 'border-line/50 opacity-50' : 'border-line bg-panel-2'}`}>
                <span className="plate shrink-0 text-[12px]">
                  <span>{String(l.plate).padStart(2, '0')}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-display text-[15px] leading-tight text-cream">
                    <span className="truncate">{displayName(l)}</span>
                    {best && !best.stale && <MedalBadge medal={medalFor(l, best.timeMs)} />}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5" title={localize(l, lang).item}>
                    {[0, 1, 2].map((k) => (
                      <ItemIcon key={k} city={l.city} taken={!!best?.items[k]} size={17} />
                    ))}
                    <span className="mx-0.5 h-4 w-px bg-line" />
                    <ThingIcon kind="stamp" taken={!!save.stamps[l.id]} size={17} />
                    <ThingIcon kind="charm" taken={!!save.charms[l.id]} size={17} />
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">{beaten ? (lang === 'en' ? boss.nameEn : boss.name) : t('Boss: ???')}</p>
                </div>
                <BossFigure city={l.city} className={`h-10 w-10 shrink-0 ${beaten ? '' : 'opacity-40 brightness-0'}`} />
              </li>
            )
          })}
        </ul>
        )}
      </div>
    </Overlay>
  )
}
