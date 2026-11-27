'use client'
import { useEffect, useRef, useState } from 'react'
import { Overlay, ic } from '@/components/ui'
import { FAMILIES, Heat, RULE_ART, RuleIcon } from '@/components/RuleArt'
import type { LevelDef } from '@/game/types'
import { CARK_PAID, CARK_RULES, CARK_SLICES, carkCoins, carkLeft, carkReward, carkSeed, spinCark, type CarkMark, type CarkSpin } from '@/lib/cark'
import { DAILY_RULES, ruleFits, ruleKey, type DailyRule } from '@/lib/extras'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** dönüşün süresi (ms); hareketi azalt açıksa çark dönmeden durur */
const SPIN_MS = 2600

/** açık (bitirilmemiş) koşunun çarkı: seçilen kural ve o şehre uyan diğerleri, sabit sırayla */
function openWheel(rule: DailyRule, city: LevelDef | undefined): DailyRule[] {
  const fits = CARK_RULES.filter((r) => r !== rule && (!city || ruleFits(r, city)))
  return [rule, ...fits.slice(0, CARK_SLICES - 1)]
}

/** Çarkın SVG çizimi: dilimler kuralın ailesinin renginde, içinde kuralın simgesi; üstte sabit ibre */
function Wheel({ wheel, angle, animate, winner }: { wheel: DailyRule[]; angle: number; animate: boolean; winner: number | null }) {
  const n = wheel.length
  const step = 360 / n
  const R = 100
  const pt = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`
  }
  return (
    <svg viewBox="-112 -118 224 232" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="cark-hub" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff4cf" />
          <stop offset="55%" stopColor="#ffcc66" />
          <stop offset="100%" stopColor="#a8701f" />
        </radialGradient>
        <radialGradient id="cark-shade" cx="30%" cy="25%" r="85%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      {/* dış halka: altın çerçeve ve çiviler */}
      <circle r={R + 8} fill="#3a2a12" />
      <circle r={R + 6} fill="none" stroke="#d9a441" strokeWidth={4} />
      <g style={{ transform: `rotate(${angle}deg)`, transition: animate ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.72, 0.18, 1)` : 'none' }}>
        {wheel.map((r, i) => {
          const c = FAMILIES[RULE_ART[r].family].color
          const a0 = i * step - step / 2
          const a1 = a0 + step
          const mid = i * step
          return (
            <g key={r}>
              <path d={`M0 0 L${pt(a0, R)} A${R} ${R} 0 0 1 ${pt(a1, R)} Z`} fill={i % 2 ? '#221f4a' : '#2c2860'} stroke="#0e0d22" strokeWidth={1.2} />
              <path d={`M${pt(a0, R)} A${R} ${R} 0 0 1 ${pt(a1, R)} L${pt(a1, R - 9)} A${R - 9} ${R - 9} 0 0 0 ${pt(a0, R - 9)} Z`} fill={c} opacity={winner === null || winner === i ? 0.95 : 0.4} />
              <g transform={`rotate(${mid}) translate(0 -66) rotate(${-mid}) translate(-11 -11)`} style={{ color: winner === null || winner === i ? c : '#6d6aa8' }}>
                <RuleIcon rule={r} size={22} />
              </g>
            </g>
          )
        })}
        {wheel.map((_, i) => (
          <circle key={i} cx={pt(i * step - step / 2, R + 3).split(' ')[0]} cy={pt(i * step - step / 2, R + 3).split(' ')[1]} r={1.8} fill="#ffe7a8" />
        ))}
        <circle r={R} fill="url(#cark-shade)" pointerEvents="none" />
      </g>
      {/* göbek */}
      <circle r={17} fill="url(#cark-hub)" stroke="#6b4614" strokeWidth={2} />
      <circle r={5} fill="#6b4614" />
      {/* ibre: tepede, aşağı bakar */}
      <path d="M-11 -116 L11 -116 L0 -92 Z" fill="#e30a17" stroke="#0e0d22" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={0} cy={-112} r={3} fill="#fff4cf" />
    </svg>
  )
}

/**
 * Çarkıfelek: çark bitirilmiş bir şehir ve o şehirde kanıtlı bir kural seçer; koşu Kurallı Koşu altyapısında oynanır.
 * Günün ilk üç çevirmesi bitince Mağaza parçası verir (kuralın zorluğuna göre), seri art arda bitirilen çevirmelerdir.
 */
export function CarkScreen({ mark, today, cities, rules, onSpin, onStart, onBack }: { mark: CarkMark | null | undefined; today: string; cities: LevelDef[]; /** Kurallı Koşu rekorları (şehir:kural) */ rules: Record<string, number> | undefined; onSpin: (spin: CarkSpin) => void; onStart: (levelId: string, rule: DailyRule) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const open = mark?.open ?? null
  const openCity = open ? cities.find((l) => l.id === open.levelId) : undefined
  const [spin, setSpin] = useState<CarkSpin | null>(null)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>(open ? 'done' : 'idle')
  const [angle, setAngle] = useState(0)
  const [animate, setAnimate] = useState(false)
  const timer = useRef<number | null>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), [])
  // açık koşu varsa çark onun kuralında durur
  const wheel = spin?.wheel ?? (open ? openWheel(open.rule, openCity) : CARK_RULES.slice(0, CARK_SLICES))
  const slot = spin ? spin.slot : open ? 0 : null
  useEffect(() => {
    if (phase === 'done') startRef.current?.focus()
  }, [phase])

  const left = carkLeft(mark, today)
  const streak = mark?.streak ?? 0
  const coins = carkCoins(mark)
  const doSpin = () => {
    if (phase === 'spinning' || !cities.length) return
    const s = spinCark(carkSeed(mark, today), cities)
    if (!s) return
    onSpin(s)
    setSpin(s)
    const step = 360 / s.wheel.length
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    // ibre tepede: seçilen dilim tepeye gelir; en az dört tam tur
    const base = angle - (angle % 360) + 360 * 5
    const target = base - s.slot * step
    setAnimate(!still)
    setAngle(still ? -s.slot * step : target)
    if (still) return setPhase('done')
    setPhase('spinning')
    timer.current = window.setTimeout(() => setPhase('done'), SPIN_MS + 120)
  }

  const res = phase === 'done' ? (spin ? { levelId: spin.levelId, rule: spin.rule, paid: open?.paid ?? false } : open) : null
  const resLv = res ? cities.find((l) => l.id === res.levelId) : undefined
  const lv = resLv ? localize(resLv, lng) : undefined
  const rule = res ? DAILY_RULES[res.rule] : null
  const heat = res ? RULE_ART[res.rule].heat : 0
  const fam = res ? FAMILIES[RULE_ART[res.rule].family] : null
  const record = res ? rules?.[ruleKey(res.levelId, res.rule)] : undefined
  const pending = !!open && phase !== 'spinning'
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:max-w-[min(860px,100%)] short:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Çarkıfelek')}</h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Çark bir şehir ve bir kural seçer. Bitir, parçayı kap.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2">
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] short:grid-cols-[auto_minmax(0,1fr)] short:gap-4">
            <div className="mx-auto aspect-square w-[min(300px,72vw)] short:w-[min(230px,calc(100dvh-120px))]">
              <Wheel wheel={wheel} angle={angle} animate={animate} winner={phase === 'done' ? slot : null} />
            </div>
            <div className="flex min-w-0 flex-col gap-3 short:gap-2">
              {/* bugünün durumu: ödüllü çevirme hakkı (üç nokta), seri, toplam parça */}
              <div className="opt-card flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-[13px]">
                <span className="flex items-center gap-1.5 text-cream" title={t('Günün ilk üç çevirmesi bitince parça verir.')}>
                  <span className="flex gap-1" aria-hidden>
                    {Array.from({ length: CARK_PAID }, (_, k) => (
                      <span key={k} className={`h-2.5 w-2.5 rounded-full ${k < left ? 'bg-gold' : 'bg-white/15'}`} />
                    ))}
                  </span>
                  <span className="font-semibold">{left ? t('{n} Ödüllü Çevirme', { n: left }) : t('Bugün Serbest Çevirme')}</span>
                </span>
                <span className="flex items-center gap-3 tabular-nums text-muted">
                  <span title={t('Art arda bitirilen çevirme')}>
                    🔥 <span className="text-cream">{streak}</span>
                  </span>
                  <span title={t('Çarktan kazanılan parça')}>
                    ✦ <span className="text-gold">{coins}</span>
                  </span>
                </span>
              </div>
              {res && lv && rule && fam ? (
                <div className="rise opt-card flex min-w-0 gap-3 p-3" style={{ ['--tone' as string]: fam.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/sehirler/${resLv!.id}.webp`} alt="" className="h-[84px] w-[84px] shrink-0 rounded-sm object-cover shadow-[0_0_0_2px_#37337a] short:h-[64px] short:w-[64px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[22px] leading-tight text-cream short:text-lg">{lv.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-bold" style={{ color: fam.color }}>
                      <RuleIcon rule={res.rule} size={16} />
                      <span className="truncate">{t(rule.name)}</span>
                      <Heat n={heat} label={t('Zorluk {n}/5', { n: heat })} className="ml-1" />
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-cream/85 short:line-clamp-2">{t(rule.text)}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {res.paid ? <span className="font-bold text-gold">{t('Bitirirsen +{n} parça', { n: carkReward(heat) })}</span> : t('Ödülsüz çevirme')}
                      {record !== undefined && <span> · {t('Rekorun {time}', { time: formatTime(record) })}</span>}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] leading-snug text-muted">{phase === 'spinning' ? t('Çark dönüyor…') : t('Bitirdiğin {n} şehirden biri ve o şehirde denenmiş bir kural çıkar.', { n: cities.length })}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {res && (
                  <button ref={startRef} className="pixel-btn primary cta flex-1 justify-center whitespace-nowrap px-3 max-sm:text-[14px]" onClick={() => onStart(res.levelId, res.rule)}>
                    {ic(t('▶ Koşuya Başla'))}
                  </button>
                )}
                <button className={`pixel-btn flex-1 justify-center whitespace-nowrap px-3 max-sm:text-[14px] ${res ? '' : 'primary cta'}`} onClick={doSpin} disabled={phase === 'spinning' || !cities.length} autoFocus={!res} title={pending ? t('Bitirmeden yeniden çevirirsen serin sıfırlanır.') : undefined}>
                  {ic(t(res ? '↻ Yeniden Çevir' : '↻ Çarkı Çevir'))}
                </button>
              </div>
              {pending && <p className="text-[12px] leading-snug text-muted short:hidden">{t('Bitirmeden yeniden çevirirsen serin sıfırlanır.')}</p>}
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

/** Modlar kutucuğunun madalyon çizimi: küçük çark */
export function CarkGlyph({ className = '' }: { className?: string }) {
  const cols = ['#a9b4ff', '#7fd3ff', '#b9a4ff', '#ffd166', '#ff7a7a', '#ff9a6b']
  return (
    <svg viewBox="-24 -26 48 50" className={className} aria-hidden="true">
      <circle r={22} fill="#3a2a12" />
      {cols.map((c, i) => {
        const a0 = ((i * 60 - 90) * Math.PI) / 180
        const a1 = (((i + 1) * 60 - 90) * Math.PI) / 180
        return <path key={i} d={`M0 0 L${Math.cos(a0) * 20} ${Math.sin(a0) * 20} A20 20 0 0 1 ${Math.cos(a1) * 20} ${Math.sin(a1) * 20} Z`} fill={c} opacity={0.85} stroke="#0e0d22" strokeWidth={0.8} />
      })}
      <circle r={5} fill="#ffcc66" stroke="#6b4614" strokeWidth={1.2} />
      <path d="M-4 -25 L4 -25 L0 -17 Z" fill="#e30a17" stroke="#0e0d22" strokeWidth={1} />
    </svg>
  )
}
