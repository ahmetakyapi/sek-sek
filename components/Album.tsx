'use client'

import { useEffect, useRef, useState } from 'react'
import { BossFigure } from '@/components/Figures'
import { ItemIcon, ThingIcon } from '@/components/HudBits'
import { MedalBadge, displayName, medalFor } from '@/components/ui'
import { BOSSES } from '@/game/boss'
import { FEATURES } from '@/game/features'
import { LEVELS } from '@/game/levels'
import type { LevelDef } from '@/game/types'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime, type Save } from '@/lib/storage'

const DIFF_TONE: Record<LevelDef['difficulty'], string> = {
  Kolay: 'border-[#6aa04a] text-[#a8d88a]',
  Orta: 'border-[#d9a441] text-[#f2c86a]',
  Zor: 'border-[#e8794a] text-[#f5a571]',
  'Çok Zor': 'border-[#d6403a] text-[#f08a80]',
}

const Eyebrow = ({ children, tone = 'text-gold' }: { children: React.ReactNode; tone?: string }) => (
  <p className={`flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] ${tone}`}>
    {children} <span className="kilim h-[6px] flex-1 opacity-50" />
  </p>
)

/** Albümde ilk açılan şehir: en son açılan yol (bitmemişse bir öncekinin sayfası daha doludur) */
function firstPage(save: Save) {
  const last = Math.min(save.unlocked, LEVELS.length - 1)
  for (let i = last; i >= 0; i--) if (save.best[LEVELS[i].id]) return i
  return 0
}

/**
 * Şehir Albümü: gezilen her şehrin eğitici sayfası. Bilgi kartları hatırayla, gizli sayfa pulla, boss sayfası
 * meydanın boss’unu yenince açılır. Geniş ekranda ızgara ile sayfa yan yana; dikey telefonda sayfa açılınca ızgara gizlenir.
 */
export default function Album({ save }: { save: Save }) {
  const t = useT()
  const lang = useLang()
  const [sel, setSel] = useState(() => firstPage(save))
  /** yalnız dar ekranda anlamlı: sayfa açık mı (yan yana düzende ikisi de görünür) */
  const [open, setOpen] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const n = LEVELS.length

  const go = (i: number) => {
    setSel(((i % n) + n) % n)
    setOpen(true)
    pageRef.current?.scrollTo(0, 0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight') setSel((s) => (s + 1) % n)
      else if (e.key === 'ArrowLeft') setSel((s) => (s - 1 + n) % n)
      else return
      e.preventDefault()
      pageRef.current?.scrollTo(0, 0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n])

  // ok tuşuyla gezerken seçili kart ızgarada görünür kalsın
  useEffect(() => {
    gridRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const base = LEVELS[sel]
  const l = localize(base, lang)
  const best = save.best[l.id]
  const visited = !!best
  const locked = sel > save.unlocked
  const beaten = !!save.bosses[l.id]
  const boss = BOSSES[l.city]
  const stamp = !!save.stamps[l.id]
  const features = FEATURES[l.id]?.[lang]
  const npcs = l.npcs.filter((p, i, all) => p.name && all.findIndex((q) => q.name === p.name) === i)
  const prev = LEVELS[(sel - 1 + n) % n]
  const next = LEVELS[(sel + 1) % n]

  return (
    <div className="mt-2 flex h-[72dvh] min-h-[150px] shrink gap-3 overflow-hidden">
      {/* şehir ızgarası */}
      <ul
        ref={gridRef}
        aria-label={t('Albümdeki Şehirler')}
        className={`overlay-scroll shrink-0 grid-cols-3 content-start gap-1.5 overflow-y-auto pr-1 side:w-[230px] side:grid-cols-2 wide:w-[300px] wide:grid-cols-3 ${open ? 'hidden side:grid' : 'grid w-full'}`}
      >
        {LEVELS.map((c, i) => {
          const off = i > save.unlocked
          const seen = !!save.best[c.id]
          const name = displayName(c)
          return (
            <li key={c.id}>
              <button
                aria-label={off ? t('{city}: Kilitli', { city: name }) : seen ? name : t('{city}: Henüz Gezilmedi', { city: name })}
                aria-current={i === sel ? 'page' : undefined}
                onClick={() => go(i)}
                className={`relative block w-full overflow-hidden border-2 text-left transition-colors ${i === sel ? 'border-gold' : 'border-line hover:border-muted'} ${seen ? 'bg-panel-2' : 'bg-ink/40'}`}
              >
                <span className="relative block aspect-[16/7] overflow-hidden">
                  <img src={`/sehirler/${c.id}.webp`} alt="" className={`h-full w-full object-cover ${seen ? '' : off ? 'opacity-20 brightness-0' : 'opacity-35 grayscale'}`} style={{ imageRendering: 'pixelated', objectPosition: '50% 70%' }} />
                  <span className="plate absolute left-1 top-1 text-[12px]">
                    <span>{String(c.plate).padStart(2, '0')}</span>
                  </span>
                  {off && <span className="absolute right-1 top-0.5 text-[13px] text-muted" aria-hidden>🔒</span>}{/* slop-ok: şehir listesi ve mücadelelerdeki kilit işaretiyle aynı (Game.tsx, Challenges.tsx) */}
                </span>
                <span className={`block truncate px-1.5 py-1 font-display text-[13px] leading-tight ${seen ? 'text-cream' : 'text-muted'}`}>{c.name}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* şehir sayfası */}
      <article aria-label={displayName(l)} className={`min-w-0 flex-1 flex-col border-2 border-line bg-ink/40 ${open ? 'flex' : 'hidden side:flex'}`}>
        <div className="flex items-center gap-1.5 border-b-2 border-line p-1.5">
          <button className={`pixel-btn px-2 py-1 text-[13px] ${open ? '' : 'hidden'} side:hidden`} onClick={() => setOpen(false)} aria-label={t('Albüme Dön')}>
            {t('← Albüm')}
          </button>
          <p className="hidden min-w-0 truncate pl-1.5 text-[12px] font-bold tracking-[0.14em] text-gold side:block">{t('ŞEHİR ALBÜMÜ')}</p>
          <button className="pixel-btn ml-auto px-2 py-1 text-[13px]" onClick={() => go(sel - 1)} aria-label={t('Önceki Şehir: {city}', { city: prev.name })} title={t('Önceki Şehir: {city}', { city: prev.name })}>
            ←
          </button>
          <span className="min-w-[48px] text-center text-[13px] tabular-nums text-muted">
            {sel + 1}/{n}
          </span>
          <button className="pixel-btn px-2 py-1 text-[13px]" onClick={() => go(sel + 1)} aria-label={t('Sonraki Şehir: {city}', { city: next.name })} title={t('Sonraki Şehir: {city}', { city: next.name })}>
            →
          </button>
        </div>

        <div ref={pageRef} className="overlay-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="relative aspect-[16/6] max-h-[200px] w-full overflow-hidden short:max-h-[96px]">
            <img src={`/sehirler/${l.id}.webp`} alt="" className={`absolute inset-0 h-full w-full object-cover ${visited ? '' : locked ? 'opacity-25 brightness-0' : 'opacity-40 grayscale'}`} style={{ imageRendering: 'pixelated', objectPosition: '50% 70%' }} />
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-2">
              <span className="plate shrink-0 text-[13px]">
                <span>{String(l.plate).padStart(2, '0')}</span>
              </span>
              <h3 className="min-w-0 font-display text-2xl leading-tight text-cream short:text-xl">{displayName(l)}</h3>
            </div>
          </div>

          <div className="space-y-4 p-3 sm:p-4 short:space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-[14px] text-cream/90">{l.subtitle}</p>
              <span className={`border px-1.5 py-px text-[12px] font-bold ${DIFF_TONE[l.difficulty]}`}>{t(l.difficulty)}</span>
            </div>

            {!visited ? (
              <div className="border-2 border-dashed border-line px-3 py-4 text-center">
                <p className="font-display text-lg text-cream">{locked ? t('Bu Yol Henüz Kapalı') : t('Henüz Gezilmedi')}</p>
                <p className="mt-1 text-[14px] text-muted">
                  {locked ? t('Önceki şehirleri bitir; yol açılınca bu sayfa da dolmaya başlar.') : t('Bu şehri bir kez bitir, albümdeki sayfası açılsın.')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-2 border-line bg-panel-2 px-3 py-2">
                  <div>
                    <p className="text-[12px] font-bold tracking-[0.18em] text-gold">{t('EN İYİ SÜRE')}</p>
                    <p className="font-display text-xl tabular-nums text-cream">{best.stale ? '—' : formatTime(best.timeMs)}</p>
                  </div>
                  {!best.stale && <MedalBadge medal={medalFor(base, best.timeMs)} size="lg" />}
                  <span className="flex-1" />
                  <span className="flex items-center gap-1.5" title={l.item}>
                    {[0, 1, 2].map((k) => (
                      <ItemIcon key={k} city={l.city} taken={!!best.items[k]} size={22} />
                    ))}
                    <span className="mx-0.5 h-4 w-px bg-line" />
                    <ThingIcon kind="stamp" taken={stamp} size={22} />
                    <ThingIcon kind="charm" taken={!!save.charms[l.id]} size={22} />
                  </span>
                </div>

                {features && (
                  <section>
                    <Eyebrow>{t('GEZİLEN YERLER')}</Eyebrow>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-cream">{features}</p>
                  </section>
                )}

                <p className="text-[14px] leading-relaxed text-cream/90">{l.intro}</p>

                <section className="border-2 border-line bg-panel-2 px-3 py-2">
                  <Eyebrow tone="text-accent">{t('GEZGİN’İN NOTU')}</Eyebrow>
                  <p className="mt-1.5 text-[14px] italic leading-relaxed text-cream/90">{l.note}</p>
                </section>

                <section>
                  <Eyebrow>{t('ŞEHİR BİLGİLERİ')}</Eyebrow>
                  <ul className="mt-2 grid gap-2 wide:grid-cols-3">
                    {l.facts.map((f, k) => {
                      const got = !!best.items[k]
                      return (
                        <li key={k} className={`flex gap-2 border-2 px-3 py-2 ${got ? 'border-gold/70 bg-gold/5' : 'border-dashed border-line'}`}>
                          <ItemIcon city={l.city} taken={got} size={22} />
                          <div className="min-w-0">
                            <p className={`font-display text-[15px] leading-tight ${got ? 'text-cream' : 'text-muted'}`}>{got ? f.title : t('Kilitli Sayfa')}</p>
                            <p className="mt-0.5 text-[14px] leading-snug text-muted">{got ? f.text : t('Bu sayfayı açmak için {n}. hatırayı bul: {item}.', { n: k + 1, item: l.item })}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                <section className={`border-2 px-3 py-2 ${stamp ? 'border-gold bg-gold/10' : 'border-dashed border-line'}`}>
                  <div className="flex items-center gap-2">
                    <ThingIcon kind="stamp" taken={stamp} size={22} />
                    <p className="font-display text-[15px] text-cream">{stamp ? l.secret.title : t('Gizli Sayfa')}</p>
                  </div>
                  <p className="mt-1 text-[14px] leading-snug text-muted">{stamp ? l.secret.text : t('Şehrin gizli pulunu bulan bu sayfayı okur.')}</p>
                </section>

                <section className="flex items-center gap-3 border-2 border-line bg-panel-2 px-3 py-2">
                  <BossFigure city={l.city} className={`h-16 w-16 shrink-0 ${beaten ? '' : 'opacity-40 brightness-0'}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold tracking-[0.18em] text-gold">{t('MEYDANIN BOSS’U')}</p>
                    <p className="font-display text-[15px] leading-tight text-cream">{beaten ? (lang === 'en' ? boss.nameEn : boss.name) : '???'}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-muted">{beaten ? (lang === 'en' ? boss.tauntEn : boss.taunt) : t('Meydanın boss’unu yen, sayfası açılsın.')}</p>
                  </div>
                </section>

                {npcs.length > 0 && (
                  <section>
                    <Eyebrow>{t('TANIŞTIĞIN İNSANLAR')}</Eyebrow>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {npcs.map((p) => (
                        <li key={p.name} className="flex gap-2.5 border-2 border-line bg-panel-2 px-2.5 py-2">
                          <img src={`/portreler/${p.look}.png`} alt="" className="h-12 w-10 shrink-0 object-cover" />
                          <div className="min-w-0">
                            <p className="font-display text-[14px] leading-tight text-cream">{p.name}</p>
                            <p className="mt-0.5 text-[13px] leading-snug text-muted">“{p.text}”</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
