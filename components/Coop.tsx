'use client'

import { useEffect, useRef, useState } from 'react'
import { ItemIcon, Key } from '@/components/HudBits'
import Portrait, { PortraitFace } from '@/components/Portrait'
import { duoHints } from '@/components/Race'
import type { DuoKeys } from '@/game/input'
import { DuoRemap } from '@/components/KeyRemap'
import { Overlay, displayName, ic } from '@/components/ui'
import type { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { LEVELS, bossLevel } from '@/game/levels'
import { BOSSES } from '@/game/boss'
import { BossFigure } from '@/components/Figures'
import { CourseScene } from '@/components/MapThumb'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { emptyInput, type Input, type LevelDef } from '@/game/types'
import { localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

const STEP = 1 / 120
/** geride kalan, kameranın tutabileceğinden uzağa düşünce öne ışınlanır (görünür alanın oranı) */
const TETHER = 0.8

export interface CoopResult {
  timeMs: number
  deaths: number
  items: number
}

/** Co-op Boss Kapışması: bir ya da iki boss aynı arenada; zorluk boss'un kademesini ve hızını artırır (kural aynı) */
export interface CoopBoss {
  /** birinci boss'un şehri (LEVELS dizini): arena da onun */
  a: number
  /** ikinci boss (yoksa null) */
  b: number | null
  diff: 0 | 1 | 2
}
export const COOP_DIFF = [
  { name: 'Normal', text: 'Boss’lar kendi hızında.', boost: undefined },
  { name: 'Öfkeli', text: 'En az orta kademe, %15 hızlı: öngörülü nişan, dört sıçrayış.', boost: { tier: 2 as const, speed: 1.15 } },
  { name: 'Kâbus', text: 'En yüksek kademe, %30 hızlı: şok dalgası, çift dalış, sahte kabarma.', boost: { tier: 3 as const, speed: 1.3 } },
] as const

/** Co-op'un bölümü: şehir yolu ya da seçilen boss'ların arenası */
export function coopLevel(level: number, boss: CoopBoss | null): LevelDef {
  if (!boss) return LEVELS[level]
  const A = LEVELS[boss.a]
  return { ...bossLevel(A), bossOf: A.city, bossOf2: boss.b !== null ? LEVELS[boss.b].city : undefined, bossBoost: COOP_DIFF[boss.diff].boost }
}

/** Co-op kurulumu: Şehir Yolu ya da Boss Kapışması, iki kılık. Tuşlar oyuncunun ataması (varsayılan: solda WASD + Shift, sağda ok tuşları + Enter); ya da iki oyun kolu. */
export function CoopSetup({ unlocked, hero, canPlay, keys, onStart, onBack }: { unlocked: number; hero: CharacterId; canPlay: boolean; keys: DuoKeys; onStart: (level: number, heroes: [CharacterId, CharacterId], boss: CoopBoss | null) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const open = LEVELS.slice(0, Math.min(unlocked, LEVELS.length - 1) + 1)
  const [lvl, setLvl] = useState(open.length - 1)
  const [heroes, setHeroes] = useState<[CharacterId, CharacterId]>([hero, hero === 'uktun' ? 'memo' : 'uktun'])
  const [mode, setMode] = useState<'yol' | 'boss'>('yol')
  const [boss, setBoss] = useState<CoopBoss>({ a: open.length - 1, b: null, diff: 0 })
  // boss seçiminde hangi yuvayı dolduruyoruz: birinci ya da ikinci boss
  const [slot, setSlot] = useState<'a' | 'b'>('a')
  const lv = localize(LEVELS[lvl], lng)
  const pick = (i: number) => {
    if (mode === 'yol') return setLvl(i)
    setBoss((x) => (slot === 'a' ? { ...x, a: i, b: x.b === i ? null : x.b } : { ...x, b: x.a === i ? x.b : i }))
  }
  const sel = (i: number) => (mode === 'yol' ? i === lvl : slot === 'a' ? i === boss.a : i === boss.b)
  const bossName = (i: number) => (lng === 'en' ? BOSSES[LEVELS[i].city].nameEn : BOSSES[LEVELS[i].city].name)
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:max-w-[min(900px,100%)] short:py-3 wide:max-w-[min(960px,100%)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-teal">{t('CO-OP · 2 KİŞİ')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{mode === 'yol' ? t('Birlikte Yolculuk') : t('Boss Kapışması')}</h2>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        {/* kip: şehir yolu ya da yalnız boss'lar */}
        <div className="mt-3 grid grid-cols-2 gap-2 short:mt-2" role="tablist">
          {(
            [
              ['yol', t('Şehir Yolu'), t('Bütün şehir: hatıralar, düğmeler ortak')],
              ['boss', t('Boss Kapışması'), t('Yalnız boss: bir ya da iki boss birden')],
            ] as const
          ).map(([k, name, sub]) => (
            <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`border-2 px-3 py-2 text-left ${mode === k ? 'border-teal bg-teal/10' : 'border-line bg-ink/40 hover:bg-panel-2'}`}>
              <span className="block font-display text-[16px] text-cream">{name}</span>
              <span className="block text-[12px] leading-snug text-muted short:hidden">{sub}</span>
            </button>
          ))}
        </div>
        <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1 short:mt-2 short:grid short:grid-cols-2 short:gap-4 wide:grid wide:grid-cols-2 wide:gap-4">
          <div>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`flex items-center gap-2 border-2 p-2 text-left ${k === 0 ? 'border-accent/70' : 'border-gold/70'}`}
                  onClick={() => setHeroes((h) => (k === 0 ? [h[0] === 'uktun' ? 'memo' : 'uktun', h[1]] : [h[0], h[1] === 'uktun' ? 'memo' : 'uktun']))}
                  aria-label={t('Kılığı Değiştir')}
                >
                  <Portrait id={heroes[k]} className="w-[44px] max-sm:hidden short:hidden" />
                  <span className="min-w-0 text-[13px] leading-snug text-muted">
                    <span className="block text-[12px] font-bold tracking-[0.15em]">{t('{n}. OYUNCU', { n: k + 1 })}</span>
                    <span className="block font-display text-[15px] text-cream">{CHARACTERS[heroes[k]].short}</span>
                    <span className="mt-1 flex flex-nowrap gap-0.5">
                      {duoHints(keys, lng === 'en' ? 'en' : 'tr')[k].flat().map((c) => (
                        <Key key={c}>{c}</Key>
                      ))}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {mode === 'yol' && (
              <div className="mt-3 max-sm:hidden short:hidden">
                <CourseScene map={LEVELS[lvl].map} city={LEVELS[lvl].city} className="h-[clamp(90px,26vh,260px)]" />
                <p className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="truncate font-display text-xl text-cream">{displayName(LEVELS[lvl])}</span>
                  <span className="shrink-0 text-[13px] text-muted">{t(lv.difficulty)}</span>
                </p>
              </div>
            )}
            {mode === 'boss' && (
              <div className="mt-3">
                {/* seçilen boss'lar: canlı çizim; tıklanan yuva aşağıdaki listeden doldurulur */}
                <div className="grid grid-cols-2 gap-2">
                  {(['a', 'b'] as const).map((k) => {
                    const i = boss[k]
                    return (
                      <button key={k} onClick={() => setSlot(k)} aria-pressed={slot === k} className={`relative flex flex-col items-center border-2 px-2 pb-1.5 pt-1 ${slot === k ? 'border-coral bg-coral/10' : 'border-line bg-ink/40'}`}>
                        <span className="self-start text-[11px] font-bold tracking-[0.14em] text-muted">{k === 'a' ? t('1. BOSS') : t('2. BOSS')}</span>
                        {i !== null ? <BossFigure city={LEVELS[i].city} className="h-14 w-20 short:h-10" /> : <span className="flex h-14 w-20 items-center justify-center text-2xl text-muted short:h-10">＋</span>}
                        <span className="max-w-full truncate text-[12px] text-cream">{i !== null ? bossName(i) : t('İsteğe Bağlı')}</span>
                        {k === 'b' && i !== null && (
                          <span role="button" tabIndex={0} aria-label={t('İkinci Boss’u Kaldır')} className="absolute right-1 top-1 px-1 text-[13px] text-muted hover:text-cream" onClick={(e) => (e.stopPropagation(), setBoss((x) => ({ ...x, b: null })), setSlot('a'))}>
                            ✕
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[12px] font-bold tracking-[0.14em] text-muted">{t('ZORLUK')}</p>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {COOP_DIFF.map((d, k) => (
                    <button key={d.name} aria-pressed={boss.diff === k} onClick={() => setBoss((x) => ({ ...x, diff: k as 0 | 1 | 2 }))} className={`flex flex-col items-center border-2 px-1 py-1.5 ${boss.diff === k ? 'border-coral bg-coral/10' : 'border-line bg-ink/40'}`}>
                      <span className="font-display text-[14px] text-cream">{t(d.name)}</span>
                      <span className="text-[11px] text-coral">{'🔥'.repeat(k + 1)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-muted short:hidden">{t(COOP_DIFF[boss.diff].text)}</p>
              </div>
            )}
          </div>
          <div className="mt-3 short:mt-0 wide:mt-0">
            <p className="text-[12px] font-bold tracking-[0.14em] text-muted">{mode === 'yol' ? t('ŞEHİR') : slot === 'a' ? t('1. BOSS’U SEÇ') : t('2. BOSS’U SEÇ')}</p>
            <div className="mt-1.5 grid max-h-[180px] grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 short:max-h-[150px] wide:max-h-[300px]">
              {open.map((l, i) => (
                <button key={l.id} aria-pressed={sel(i)} className={`flex items-center gap-1.5 border-2 px-2 py-1.5 text-left text-[13px] ${sel(i) ? (mode === 'yol' ? 'border-gold bg-gold/10' : 'border-coral bg-coral/10') + ' text-cream' : 'border-line bg-ink/40 text-cream/80'}`} onClick={() => pick(i)}>
                  <ItemIcon city={l.city} taken size={16} />
                  <span className="truncate">{l.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-muted">
              {mode === 'yol' ? `${displayName(LEVELS[lvl])} · ${t(lv.difficulty)}` : boss.b !== null ? t('İki boss aynı arenada: biri dinlenirken öbürü saldırır. İkisi de düşünce kapı açılır.') : t('Bir boss, iki kahraman. İkinci boss için 2. yuvaya dokun.')}
            </p>
          </div>
        </div>
        {!canPlay && <p className="mt-2 text-[13px] text-accent-2">{t('Co-op için klavye ya da iki oyun kolu gerekir.')}</p>}
        <button className="pixel-btn primary mt-3 justify-center py-2.5 text-base" disabled={!canPlay} onClick={() => onStart(lvl, heroes, mode === 'boss' ? boss : null)} autoFocus>
          {ic(mode === 'yol' ? t('▶ Birlikte Başla') : t('▶ Arenaya Gir'))}
        </button>
      </div>
    </Overlay>
  )
}

/**
 * Co-op oyun: tek dünya, tek kamera, iki oyuncu. Dünya oyuncuyu (1. oyuncu) bilir; eş (2. oyuncu) World.stepPartner
 * ile aynı adımda yürür. Kamera ikisinin ortasına bakar; aradaki uzaklık görünür alanı aşınca geride kalan öne ışınlanır.
 * İlerlemeye ve rekorlara dokunmaz.
 */
export default function Coop({ level, heroes, sound, keys, onKeys, onDone, onQuit }: { level: LevelDef; heroes: [CharacterId, CharacterId]; sound: Sound | null; /** iki oyuncunun tuşları (save.duoKeys); molada değişirse hemen uyar */ keys: DuoKeys; onKeys: (k: DuoKeys) => void; onDone: (r: CoopResult) => void; onQuit: () => void }) {
  const keysRef = useRef(keys)
  keysRef.current = keys
  const t = useT()
  const lang = useLang()
  const canvas = useRef<HTMLCanvasElement>(null)
  const phase = useRef<'count' | 'run' | 'pause' | 'over'>('count')
  const [count, setCount] = useState(3)
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState({ time: 0, deaths: 0, items: [false, false, false] })
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const c = canvas.current!
    const renderer = new Renderer(c)
    renderer.character = CHARACTERS[heroes[0]]
    renderer.partnerLook = heroes[1]
    renderer.lang = lang
    const world = new World(level)
    world.enableCoop()
    const fit = () => {
      renderer.resize(c.clientWidth || window.innerWidth, c.clientHeight || window.innerHeight, Math.min(window.devicePixelRatio || 1, 3))
      renderer.setLevel(world)
    }
    fit()
    window.addEventListener('resize', fit)

    const keys = new Set<string>()
    const latch = [
      { jump: false, dash: false, padJump: false, padDash: false },
      { jump: false, dash: false, padJump: false, padDash: false },
    ]
    const togglePause = () => {
      if (phase.current === 'run') {
        phase.current = 'pause'
        setPaused(true)
      } else if (phase.current === 'pause') {
        phase.current = 'run'
        setPaused(false)
      }
    }
    const down = (e: KeyboardEvent) => {
      const k = e.code
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'NumpadEnter', 'Slash', 'Period'].includes(k)) e.preventDefault()
      keys.add(k)
      if (e.repeat) return
      if (k === 'Escape' || k === 'KeyP') togglePause()
      latch.forEach((s, i) => {
        if (keysRef.current[i].jump.includes(k)) s.jump = true
        if (keysRef.current[i].dash.includes(k)) s.dash = true
      })
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      if (e.key === 'Meta') keys.clear()
    }
    const blur = () => keys.clear()
    // başlat düğmesinde kalan odak: Enter (dash) ya da Boşluk o düğmeye basmasın
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __coop: unknown }).__coop = world
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    const sample = (i: number): Input => {
      const s = latch[i]
      const m = keysRef.current[i]
      const has = (list: readonly string[]) => list.some((code) => keys.has(code))
      const inp = emptyInput()
      inp.left = has(m.left)
      inp.right = has(m.right)
      inp.up = has(m.jump)
      inp.down = has(m.down)
      inp.jump = has(m.jump)
      const p = (typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [])[i]
      if (p) {
        const ax = p.axes[0] ?? 0
        const ay = p.axes[1] ?? 0
        if (ax < -0.4 || p.buttons[14]?.pressed) inp.left = true
        if (ax > 0.4 || p.buttons[15]?.pressed) inp.right = true
        if (ay < -0.5 || p.buttons[12]?.pressed) inp.up = true
        if (ay > 0.5 || p.buttons[13]?.pressed) inp.down = true
        const pj = !!(p.buttons[0]?.pressed || p.buttons[3]?.pressed)
        const pd = !!(p.buttons[2]?.pressed || p.buttons[1]?.pressed || p.buttons[7]?.pressed)
        if (p.buttons[9]?.pressed && phase.current === 'run') togglePause()
        if (pj) inp.jump = true
        if (pj && !s.padJump) s.jump = true
        if (pd && !s.padDash) s.dash = true
        s.padJump = pj
        s.padDash = pd
      }
      inp.jumpPressed = s.jump
      inp.dashPressed = s.dash
      s.jump = false
      s.dash = false
      return inp
    }

    sound?.setMusic(level.city)
    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    let countLeft = 3.2
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      const ph = phase.current
      if (ph === 'count') {
        countLeft -= dt
        setCount(Math.max(0, Math.ceil(countLeft)))
        if (countLeft <= 0) {
          phase.current = 'run'
          world.started = true
          latch.forEach((s) => (s.jump = s.dash = false))
          sound?.sfx('checkpoint')
        }
      }
      if (ph === 'run') {
        acc += dt
        if (acc >= STEP) {
          const inputs = [sample(0), sample(1)]
          let first = true
          while (acc >= STEP) {
            renderer.capture(world)
            const strip = (i: Input) => (first ? i : { ...i, jumpPressed: false, dashPressed: false })
            world.step(STEP, strip(inputs[0]))
            world.stepPartner(STEP, strip(inputs[1]))
            first = false
            acc -= STEP
          }
        }
        const p = world.player
        const q = world.partner!
        for (const e of world.events) {
          renderer.handle(e, world)
          sound?.sfx(e.type)
          // bölüm bayraktan yeniden kuruldu ya da meydan kapısından geçildi: eş de oraya
          if (e.type === 'respawn') world.bringPartner()
          if (e.type === 'warp') {
            if (Math.abs(p.x - (world.arrival?.x ?? p.x)) < 32) world.bringPartner(p)
            else if (world.arrival) Object.assign(p, { x: q.x, y: q.y, vx: 0, vy: 0 })
          }
          if (e.type === 'complete' && phase.current === 'run') {
            phase.current = 'over'
            doneRef.current({ timeMs: Math.round(world.time * 1000), deaths: world.deaths, items: world.pickups.filter((x) => x.taken).length })
          }
        }
        world.events.length = 0
        // ip: geride kalan öne ışınlanır (görünür alanı aşan uzaklık); önde olan, sağa ya da yukarı daha ileride olandır
        if (!p.dead && !q.dead && !p.hang && !q.hang && (Math.abs(p.x - q.x) > renderer.viewW * TETHER || Math.abs(p.y - q.y) > renderer.viewH * TETHER)) {
          if (p.x >= q.x) world.bringPartner(p)
          else Object.assign(p, { x: q.x - 10, y: q.y, vx: 0, vy: 0 })
        }
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          setHud({ time: world.time, deaths: world.deaths, items: world.pickups.map((x) => x.taken) })
        }
      } else acc = 0
      renderer.render(world, dt, ph === 'run' ? acc / STEP : 1)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
    // co-op bir kez kurulur; yeniden başlatmak için bileşen yeniden bağlanır (key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 z-30 bg-ink">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label={t('Oyun Alanı')} />
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 bg-ink/85 py-1 pl-1 pr-2.5 [box-shadow:0_0_0_2px_#37337a]">
        <PortraitFace id={heroes[0]} />
        <PortraitFace id={heroes[1]} />
        <div className="leading-tight">
          <p className="font-display text-[14px] text-cream">{level.name}</p>
          <p className="flex items-center gap-1 text-[12px] text-muted">
            {[0, 1, 2].map((i) => (
              <ItemIcon key={i} city={level.city} taken={!!hud.items[i]} size={12} />
            ))}
            <span className="ml-1">✕{hud.deaths}</span>
          </p>
        </div>
      </div>
      <p className="pointer-events-none absolute right-2 top-2 bg-ink/85 px-2.5 py-1 font-display text-2xl tabular-nums text-cream [box-shadow:0_0_0_2px_#37337a]">{formatTime((hud.time * 1000) | 0)}</p>
      {count > 0 && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p key={count} className="rise font-display text-[120px] leading-none text-cream [text-shadow:0_8px_0_#0e0d22]">
              {count}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-6 text-[13px] text-cream">
            {duoHints(keys, lang === 'en' ? 'en' : 'tr').map((g) => g.flat()).map((ks, k) => (
              <span key={k} className="flex items-center gap-1 bg-ink/80 px-2 py-1">
                <span className="mr-1 font-bold text-muted">{k + 1}.</span>
                {ks.map((c) => (
                  <Key key={c}>{c}</Key>
                ))}
              </span>
            ))}
          </div>
        </>
      )}
      {!paused && count === 0 && (
        <button
          className="pixel-btn absolute left-1/2 top-2 h-9 w-9 -translate-x-1/2 justify-center p-0 text-[13px]"
          aria-label={t('Mola')}
          onClick={() => {
            if (phase.current !== 'run') return
            phase.current = 'pause'
            setPaused(true)
          }}
        >
          ❚❚
        </button>
      )}
      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-4">
          <div className="pixel-panel overlay-scroll max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto p-5 text-center short:p-3">
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{t('MOLA')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream">{t('Birlikte Mola')}</h2>
            <div className="mt-4 grid gap-2.5">
              <button
                className="pixel-btn primary justify-center"
                autoFocus
                onClick={() => {
                  phase.current = 'run'
                  setPaused(false)
                }}
              >
                {ic(t('▶ Devam Et'))}
              </button>
              <button className="pixel-btn justify-center" onClick={onQuit}>
                {t('Yolculuğu Bırak')}
              </button>
            </div>
            {/* oyunu bırakmadan tuşlar değişir: girdi hemen uyar */}
            <div className="mt-4 text-left short:mt-2">
              <DuoRemap keys={keys} onChange={onKeys} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Co-op bitişi: ortak süre, düşüş ve hatıra */
export function CoopEnd({ level, boss, heroes, result, onAgain, onMenu }: { level: LevelDef; boss: CoopBoss | null; heroes: [CharacterId, CharacterId]; result: CoopResult; onAgain: () => void; onMenu: () => void }) {
  const t = useT()
  const lng = useLang()
  const bn = (i: number) => (lng === 'en' ? BOSSES[LEVELS[i].city].nameEn : BOSSES[LEVELS[i].city].name)
  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-md p-6 text-center">
        <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{boss ? t('BOSS’LAR DÜŞTÜ') : t('BİRLİKTE BİTİRDİNİZ')}</p>
        <div className="mt-3 flex items-end justify-center gap-1" aria-hidden>
          <Portrait id={heroes[0]} className="w-[64px]" />
          <Portrait id={heroes[1]} className="w-[64px]" />
        </div>
        <h2 className="mt-2 font-display text-5xl tabular-nums text-cream">{formatTime(result.timeMs)}</h2>
        <p className="mt-2 text-[13px] text-muted">
          {boss
            ? `${[boss.a, boss.b].filter((x): x is number => x !== null).map(bn).join(' + ')} · ${t(COOP_DIFF[boss.diff].name)} · ${t('{deaths} düşüş', { deaths: result.deaths })}`
            : t('{city} · {deaths} düşüş · {items}/3 hatıra', { city: level.name, deaths: result.deaths, items: result.items })}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button className="pixel-btn primary justify-center" onClick={onAgain} autoFocus>
            {ic(t('↺ Yeniden'))}
          </button>
          <button className="pixel-btn justify-center" onClick={onMenu}>
            {t('Modlar')}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
