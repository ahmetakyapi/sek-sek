'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CityPicker } from '@/components/CityPicker'
import Portrait from '@/components/Portrait'
import { Overlay, SectionTitle, displayName, ic } from '@/components/ui'
import { LEVELS } from '@/game/levels'
import type { LevelDef, Npc } from '@/game/types'
import { STORIES, STORY_KEYS, fill, talkOf, type Hero, type Talk } from '@/game/stories'
import { localize, useLang, useT } from '@/lib/i18n'
import { GIFT_BIT, MET_BIT, bondOf, hasAsked, storyStats, type StoryLog } from '@/lib/storyRules'

/** Şehir insanının kayıt anahtarı: Türkçe adı (levels.ts'teki özgün ad) */
export const npcKey = (levelId: string, i: number) => LEVELS.find((l) => l.id === levelId)?.npcs[i]?.name ?? ''

/** şehirdeki diyaloglu kişi sayısı ve tanışılanlar */
export const cityMeet = (levelId: string, story: StoryLog | undefined) => {
  const l = LEVELS.find((x) => x.id === levelId)
  const names = (l?.npcs ?? []).map((n) => n.name).filter((n) => talkOf(n))
  return { total: names.length, met: names.filter((n) => (story?.[n] ?? 0) & MET_BIT).length, full: names.filter((n) => bondOf(story?.[n]) === 3).length }
}

const Stars = ({ n, className = '' }: { n: number; className?: string }) => (
  <span className={`tracking-[0.1em] text-gold ${className}`} role="img" aria-label={`${n}/3`}>
    {'★'.repeat(n)}
    <span className="text-line">{'★'.repeat(3 - n)}</span>
  </span>
)

/**
 * Hikâye Gezisi kurulumu: şehri seç. Süre yok, düşüş sayılmaz, skor ve rekor yazılmaz; şehir insanlarıyla konuşursun,
 * tanıştıkça yıldız toplarsın (ilerlemen ayrı kaydedilir: Defter → Tanıştıklarım).
 */
export function StorySetup({ startLevel, open, story, onStart, onBack }: { startLevel: number; open: number; story: StoryLog | undefined; onStart: (level: number) => void; onBack: () => void }) {
  const t = useT()
  const [level, setLevel] = useState(Math.min(startLevel, open))
  const st = useMemo(() => storyStats(story, (k) => STORY_KEYS.includes(k)), [story])
  const c = cityMeet(LEVELS[level].id, story)
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-xl flex-col p-4 sm:p-6 short:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Hikâye Gezisi')}</h2>
            <p className="mt-1.5 text-[14px] text-muted short:hidden">{t('Süre yok, düşüş sayılmaz. Şehir insanlarıyla konuş, cevap ver, tanış.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <div className="mt-3 min-h-0 flex-1">
          <CityPicker value={level} onChange={setLevel} isOpen={(i) => i <= open} tone="var(--color-teal)" compact className="h-[clamp(160px,32vh,280px)] short:h-[110px]" />
        </div>
        <p className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px] text-muted short:hidden">
          <span>
            {t('Bu şehirde tanıştığın')}: <strong className="text-cream">{c.met}/{c.total}</strong> · <span className="text-gold">★ {c.full}</span>
          </span>
          <span>{t('Toplam {n} kişi, {m} yıldız', { n: st.met, m: st.stars })}</span>
        </p>
        <button className="pixel-btn primary mt-2 w-full justify-center py-2.5 text-base short:py-2" onClick={() => onStart(level)}>
          {ic(t('▶ Geziye Başla'))}
        </button>
      </div>
    </Overlay>
  )
}

/** "Konuş" göstergesi: yakındaki kişiye, tuş / dokunma ile */
export function TalkPrompt({ name, touch, onTalk }: { name: string; touch: boolean; onTalk: () => void }) {
  const t = useT()
  return (
    <button className="pixel-btn primary absolute bottom-[26%] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap px-4 py-2 text-[15px] short:bottom-[22%] short:py-1" onClick={onTalk} aria-label={`${t('Konuş')}: ${name}`}>
      {touch ? '' : <kbd className="mr-2 border-2 border-ink/50 bg-cream/20 px-1.5 text-[13px]">E</kbd>}
      {t('Konuş')} · {name}
    </button>
  )
}

type Step = 'root' | 'a0' | 'a1' | 'a2' | 'gift' | 'plain'
interface Opt {
  key: string
  label: string
  tone?: string
  go: () => void
}

/** harf harf akan metin (hareketi azalt açıksa anında); tamamlanınca done */
function useTyped(text: string) {
  const [n, setN] = useState(0)
  const still = useRef(false)
  useEffect(() => {
    try {
      still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      still.current = false
    }
  }, [])
  useEffect(() => {
    if (still.current) return setN(text.length)
    setN(0)
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(text.length, Math.floor(((now - t0) / 1000) * 55))
      setN(k)
      if (k < text.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text])
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) }
}

/**
 * Konuşma paneli (alt panel, karakteri örtmez): portre, ad ve yıldızlar, harf harf akan söz, cevap seçenekleri.
 * Konuşurken oyun donar (Game.tsx). 1-3 / ↑↓ + Enter / dokunma ile seçilir, Enter yazıyı hızlandırır, Esc kapatır.
 * Üç soru da sorulunca üç yıldız ve bir defter sayfası.
 */
export function StoryTalk({ level, npc, hero, mask, onMeet, onAsk, onGift, onClose }: { level: LevelDef; npc: number; hero: Hero; mask: number; onMeet: () => void; onAsk: (i: number) => void; onGift: () => void; onClose: () => void }) {
  const t = useT()
  const lang = useLang()
  const key = npcKey(level.id, npc)
  const talk: Talk | undefined = talkOf(key)
  const person: Npc = localize(level, lang).npcs[npc] ?? level.npcs[npc]
  const [step, setStep] = useState<Step>(talk ? 'root' : 'plain')
  const [fresh, setFresh] = useState(false)
  const [sel, setSel] = useState(0)
  const bond = bondOf(mask)
  const L = lang === 'en' ? 'en' : 'tr'

  const text =
    step === 'plain' || !talk ? person.text : step === 'root' ? fill(talk.hi, L, hero) : step === 'gift' ? `${fill(talk.gift.title, L, hero)}\n${fill(talk.gift.text, L, hero)}` : fill(talk.asks[Number(step[1])].a, L, hero)
  const typed = useTyped(text)

  useEffect(onMeet, [onMeet])

  const bye: Opt = { key: 'bye', label: t('Hoşça Kal'), go: onClose }
  const opts: Opt[] = []
  if (!talk || step === 'plain') opts.push(bye)
  else if (step === 'root') {
    talk.asks.forEach((a, i) => {
      if (!hasAsked(mask, i)) opts.push({ key: `q${i}`, label: fill(a.q, L, hero), tone: ['Merak', 'Şaka', 'Saygı'][i], go: () => (onAsk(i), setFresh(true), setStep(`a${i}` as Step)) })
    })
    if (bond === 3) opts.push({ key: 'gift', label: t('Defter Sayfasını Oku'), tone: 'Sayfa', go: () => (onGift(), setStep('gift')) })
    opts.push(bye)
  } else if (step === 'gift') opts.push({ key: 'ok', label: t('Teşekkür Ederim'), go: onClose })
  else if (bond < 3) opts.push({ key: 'more', label: t('Başka Bir Şey Sor'), go: () => (setFresh(false), setStep('root')) }, bye)
  else opts.push({ key: 'gift', label: t('Defter Sayfasını Oku'), tone: 'Sayfa', go: () => (onGift(), setStep('gift')) }, { key: 'back', label: t('Başka Bir Şey Sor'), go: () => (setFresh(false), setStep('root')) }, bye)

  useEffect(() => setSel(0), [step])

  const optsRef = useRef(opts)
  optsRef.current = opts
  const selRef = useRef(sel)
  selRef.current = sel
  const typedRef = useRef(typed)
  typedRef.current = typed
  const act = useCallback((i: number) => optsRef.current[i]?.go(), [])

  // klavye: oyunun kendi tuşlarından önce yakalanır (Esc mola açmaz, Enter dash atmaz)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const used = ['Enter', 'NumpadEnter', 'Escape', 'ArrowUp', 'ArrowDown', 'KeyE', 'Space', 'Digit1', 'Digit2', 'Digit3', 'Digit4']
      if (!used.includes(e.code)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.repeat) return
      if (e.code === 'Escape') return onClose()
      if (/^Digit\d$/.test(e.code)) {
        const i = Number(e.code.slice(5)) - 1
        if (optsRef.current[i]) typedRef.current.done ? act(i) : typedRef.current.skip()
        return
      }
      if (e.code === 'ArrowUp') return setSel((s) => Math.max(0, s - 1))
      if (e.code === 'ArrowDown') return setSel((s) => Math.min(optsRef.current.length - 1, s + 1))
      if (!typedRef.current.done) return typedRef.current.skip()
      if (e.code !== 'Space') act(selRef.current)
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [act, onClose])

  // oyun kolu: yön tuşları gezer, A seçer, B kapatır
  useEffect(() => {
    let raf = 0
    let prev = [false, false, false, false]
    const poll = () => {
      raf = requestAnimationFrame(poll)
      const p = navigator.getGamepads?.().find((g) => g?.connected)
      if (!p) return
      const ay = p.axes[1] ?? 0
      const now = [!!p.buttons[0]?.pressed, !!p.buttons[1]?.pressed, !!p.buttons[12]?.pressed || ay < -0.6, !!p.buttons[13]?.pressed || ay > 0.6]
      if (now[0] && !prev[0]) typedRef.current.done ? act(selRef.current) : typedRef.current.skip()
      if (now[1] && !prev[1]) onClose()
      if (now[2] && !prev[2]) setSel((s) => Math.max(0, s - 1))
      if (now[3] && !prev[3]) setSel((s) => Math.min(optsRef.current.length - 1, s + 1))
      prev = now
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [act, onClose])

  const [title, ...rest] = step === 'gift' ? text.split('\n') : [null, text]
  const body = step === 'gift' ? rest.join('\n') : text
  const shownBody = step === 'gift' ? typed.shown.split('\n').slice(1).join('\n') : typed.shown
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-2 short:p-1.5" role="dialog" aria-label={person.name}>
      <div className="rise pixel-panel pointer-events-auto flex max-h-[44dvh] w-full max-w-[780px] gap-3 overflow-y-auto p-3 short:max-h-[68dvh] short:gap-2 short:p-2">
        <div className="shrink-0 max-sm:w-[54px] sm:w-[84px] short:w-[46px]">
          <Portrait id={person.look} className="w-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-display text-[18px] leading-tight text-cream short:text-[16px]">{person.name}</h3>
            {talk && <Stars n={bond} className="text-[16px]" />}
          </div>
          <button className="mt-1 min-h-[3.4em] text-left text-[15px] leading-snug text-cream short:min-h-0 short:text-[14px]" onClick={typed.skip} aria-live="polite" aria-label={body}>
            {step === 'gift' && title && <span className="mb-0.5 block font-display text-[15px] text-gold">✎ {title}</span>}
            {shownBody}
            <span className="invisible">{typed.done ? '' : body.slice(shownBody.length)}</span>
          </button>
          {fresh && step !== 'root' && step !== 'gift' && typed.done && <p className="mt-0.5 text-[13px] font-semibold text-gold">{bond === 3 ? t('★ Üçüncü yıldız! Yeni bir defter sayfası.') : t('★ Yeni yıldız')}</p>}
          {typed.done && (
            <div className="mt-2 flex flex-col gap-1 short:mt-1 short:flex-row short:flex-wrap" role="group" aria-label={t('Cevabın')}>
              {opts.map((o, i) => (
                <button key={o.key} className={`pixel-btn flex items-baseline gap-2 px-3 py-1.5 text-left text-[14px] short:py-1 short:text-[13px] ${i === sel ? 'primary' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => act(i)}>
                  <span className="shrink-0 tabular-nums text-muted">{i + 1}</span>
                  {o.tone && <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-gold">{t(o.tone)}</span>}
                  <span className="min-w-0">{o.label}</span>
                </button>
              ))}
            </div>
          )}
          {!typed.done && <p className="mt-auto pt-1 text-[11px] text-muted">{t('Enter: Hızlandır')}</p>}
        </div>
      </div>
    </div>
  )
}

/** Defter → Tanıştıklarım: şehir şehir kişiler, yıldızlar, açılan defter sayfaları */
export default function MetView({ story, hero }: { story: StoryLog | undefined; hero: Hero }) {
  const t = useT()
  const lang = useLang()
  const L = lang === 'en' ? 'en' : 'tr'
  const [open, setOpen] = useState<string | null>(null)
  const st = storyStats(story, (k) => STORY_KEYS.includes(k))
  const rows = useMemo(
    () =>
      LEVELS.map((l) => ({ l, loc: localize(l, lang), people: l.npcs.map((n, i) => ({ n, i })).filter((x) => STORIES[x.n.name]) })).filter((r) => r.people.length),
    [lang],
  )
  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col">
      <p className="flex flex-wrap items-baseline gap-x-4 text-[14px] text-muted">
        <span>
          {t('Tanıştığın')}: <strong className="text-cream">{st.met}/{STORY_KEYS.length}</strong>
        </span>
        <span className="text-gold">★ {st.stars}/{STORY_KEYS.length * 3}</span>
        <span>
          {t('Defter sayfası')}: <strong className="text-cream">{st.gifts}</strong>
        </span>
      </p>
      <div className="overlay-scroll mt-2 min-h-[120px] flex-1 overflow-y-auto pr-1">
        {st.met === 0 && <p className="border-2 border-dashed border-line px-3 py-4 text-[14px] text-muted">{t('Henüz kimseyle tanışmadın. Modlar → Hikâye Gezisi ile bir şehre çık ve şehir insanlarıyla konuş.')}</p>}
        {rows.map(({ l, loc, people }) => (
          <section key={l.id} className="mb-3">
            <SectionTitle title={displayName(loc)} note={`${people.filter((p) => ((story?.[p.n.name] ?? 0) & MET_BIT) !== 0).length}/${people.length}`} />
            <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {people.map(({ n, i }) => {
                const m = story?.[n.name] ?? 0
                const met = (m & MET_BIT) !== 0
                const b = bondOf(m)
                const gift = (m & GIFT_BIT) !== 0
                const p = loc.npcs[i] ?? n
                const talk = STORIES[n.name]
                const id = `${l.id}:${i}`
                return (
                  <li key={id} className={`mode-card flex flex-col gap-1 px-2.5 py-2 ${met ? '' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-[40px] shrink-0 ${met ? '' : 'brightness-0 opacity-50'}`}>
                        <Portrait id={n.look} className="w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[15px] leading-tight text-cream">{met ? p.name : '???'}</p>
                        <Stars n={b} className="text-[13px]" />
                      </div>
                      {gift && (
                        <button className="pixel-btn shrink-0 px-2 py-1 text-[12px]" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>
                          {ic(t('✎ Sayfa'))}
                        </button>
                      )}
                    </div>
                    {gift && open === id && (
                      <p className="border-t-2 border-line/60 pt-1.5 text-[13px] leading-snug text-cream">
                        <strong className="mb-0.5 block font-display text-gold">{fill(talk.gift.title, L, hero)}</strong>
                        {fill(talk.gift.text, L, hero)}
                      </p>
                    )}
                    {!met && <p className="text-[12px] text-muted">{t('Henüz tanışmadın')}</p>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
