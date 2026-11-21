'use client'
import { useEffect, useState } from 'react'
import { CityPicker } from '@/components/CityPicker'
import { medalFor } from '@/components/medal'
import { MedalBadge, Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { CHALLENGES, challengeLevel, type Challenge } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { GEZGIN_SIZES, gezginFor, gezginKey, gezginSeed, gezginTotal, istanbulDay } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

const SEED_KEY = 'seksek:gezgin-seed'
const SIZE_KEY = 'seksek:gezgin-size'
/** rastgele tohum: okunur, karışmayan harfler */
const randomSeed = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPRSTUVYZ'[Math.floor(Math.random() * 21)]).join('')

/**
 * Gezgin Turu: bir tohumdan her seferinde aynı kesit dizisi çıkar (Mücadeleler'den). Kesitleri istediğin sırayla koşarsın;
 * hepsi bitince toplam süre tohum başına cihazda (ve bulutta) saklanır. Tohumu bir arkadaşa söylemek yeter.
 */
export function GezginHub({ best, totals, onStart, onBack }: { best: Record<string, number> | undefined; totals: Record<string, number> | undefined; onStart: (c: Challenge, seed: string, size: number) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [seed, setSeed] = useState('YOL')
  const [size, setSize] = useState<number>(4)
  useEffect(() => {
    try {
      const s = localStorage.getItem(SEED_KEY)
      const n = Number(localStorage.getItem(SIZE_KEY))
      if (s) setSeed(gezginSeed(s) || 'YOL')
      if ((GEZGIN_SIZES as readonly number[]).includes(n)) setSize(n)
    } catch {
      /* depo yok */
    }
  }, [])
  const change = (s: string, n: number) => {
    setSeed(s)
    setSize(n)
    try {
      localStorage.setItem(SEED_KEY, gezginSeed(s) || 'YOL')
      localStorage.setItem(SIZE_KEY, String(n))
    } catch {
      /* depo yok */
    }
  }
  const clean = gezginSeed(seed) || 'YOL'
  const ids = gezginFor(clean, size)
  const total = gezginTotal(ids, best)
  const record = totals?.[gezginKey(clean, size)]
  const doneN = ids.filter((id) => best?.[id] !== undefined).length
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Gezgin Turu')}</h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Bir tohum, bir yol: aynı tohum herkese aynı kesitleri verir. Hepsini bitir, toplamını yaz.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[14px] font-semibold text-cream">
            {t('Tohum')}
            <input
              className="w-[9.5em] border-2 border-line bg-ink/60 px-2 py-1 font-display text-[16px] uppercase tracking-wider text-gold outline-none focus:border-accent"
              value={seed}
              maxLength={12}
              spellCheck={false}
              autoCapitalize="characters"
              onChange={(e) => change(e.target.value.toLocaleUpperCase('tr'), size)}
              aria-label={t('Tohum')}
            />
          </label>
          <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={() => change(randomSeed(), size)}>
            {ic(t('🎲 Rastgele'))}
          </button>
          <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={() => change(istanbulDay(new Date()).replaceAll('-', ''), size)}>
            {t('Bugünün Tohumu')}
          </button>
          <span className="flex items-center gap-1" role="group" aria-label={t('Kesit Sayısı')}>
            {GEZGIN_SIZES.map((n) => (
              <button key={n} className={`pixel-btn px-2.5 py-1 text-[13px] ${n === size ? 'primary' : ''}`} aria-pressed={n === size} onClick={() => change(seed, n)}>
                {n}
              </button>
            ))}
            <span className="ml-1 text-[13px] text-muted">{t('Kesit')}</span>
          </span>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <SectionTitle title={t('Bu Tohumun Yolu')} note={t('{n}/{m} bitti', { n: doneN, m: ids.length })} tone="var(--color-gold)" />
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {ids.map((id, i) => {
              const c = CHALLENGES.find((x) => x.id === id)!
              const lv = localize(LEVELS.find((l) => l.id === c.level)!, lng)
              const ms = best?.[id]
              const medal = ms ? medalFor(challengeLevel(c), ms) : null
              return (
                <button key={id} className={`mode-tile flex items-center gap-2.5 px-2.5 py-2 text-left ${ms ? '[--tone:var(--color-teal)]' : '[--tone:var(--color-gold)]'}`} onClick={() => onStart(c, clean, size)}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 font-display text-[15px] ${ms ? 'text-teal shadow-[0_0_0_2px_var(--color-teal)]' : 'text-gold shadow-[0_0_0_2px_var(--color-gold)]'}`}>{ms ? '✓' : i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[16px] leading-tight text-cream">{t(c.name)}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {displayName(lv)} · {ms ? <strong className="font-semibold tabular-nums text-cream">{formatTime(ms)}</strong> : t('henüz koşulmadı')}
                    </span>
                  </span>
                  {medal && <MedalBadge medal={medal} />}
                </button>
              )
            })}
          </div>
          <p className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-line/60 pt-2 text-[14px] text-muted">
            <span>
              {t('Toplam')}: <strong className="font-display text-[18px] tabular-nums text-cream">{total !== null ? formatTime(total) : '—'}</strong>
            </span>
            <span>
              {t('Bu tohumdaki rekorun')}: <strong className="font-display text-[18px] tabular-nums text-gold">{record !== undefined ? formatTime(record) : '—'}</strong>
            </span>
          </p>
          <p className="mt-1 text-[13px] text-muted">{t('Süreler, her kesitteki en iyi sürendir; kesiti istediğin kadar yeniden koşabilirsin.')}</p>
        </div>
      </div>
    </Overlay>
  )
}

/**
 * Sakin Gezi: bir şehri acele etmeden gez. Düşüş sayılmaz, skor ve rekor yazılmaz, hiçbir şeye dokunulmaz;
 * son bayrakta kısa bir soluktan sonra doğarsın. Fotoğraf Kipi molada hazırdır.
 */
export function CalmSetup({ startLevel, open, onStart, onBack }: { startLevel: number; open: number; onStart: (level: number) => void; onBack: () => void }) {
  const t = useT()
  const [level, setLevel] = useState(Math.min(startLevel, open))
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-xl flex-col p-4 sm:p-6 short:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Sakin Gezi')}</h2>
            <p className="mt-1.5 text-[14px] text-muted short:hidden">{t('Süre yok, düşüş sayılmaz, skor yazılmaz. Şehri gez, fotoğraf çek.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="mt-3 min-h-0 flex-1">
          <CityPicker value={level} onChange={setLevel} isOpen={(i) => i <= open} tone="var(--color-teal)" compact className="h-[clamp(176px,36vh,300px)] short:h-[120px]" />
        </div>
        <button className="pixel-btn primary mt-3 w-full justify-center py-2.5 text-base short:py-2" onClick={() => onStart(level)}>
          {ic(t('▶ Gezmeye Başla'))}
        </button>
      </div>
    </Overlay>
  )
}
