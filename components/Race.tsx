'use client'
import { ic } from '@/components/ui'

import { useEffect, useRef, useState } from 'react'
import { DNF } from '@/components/Modes'
import { PortraitFace } from '@/components/Portrait'
import { ItemIcon, Key } from '@/components/HudBits'
import type { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import type { HeroLook } from '@/game/accessories'
import { PIXEL_BUDGET, Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { emptyInput, type Input, type LevelDef } from '@/game/types'
import type { DuelRun } from '@/lib/extras'
import { useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

const STEP = 1 / 120

import { keyLabel, type DuoKeys } from '@/game/input'
import { DuoRemap } from '@/components/KeyRemap'
/** ekranda gösterilen tuşlar (oyuncunun atamasından): sol + sağ, zıpla, dash */
export function duoHints(k: DuoKeys, lang: 'tr' | 'en'): string[][][] {
  const l = (c: string) => keyLabel(c, lang)
  return k.map((b) => [[l(b.left[0]), l(b.right[0])], [l(b.jump[0])], [l(b.dash[0])]])
}

interface Side {
  world: World
  renderer: Renderer
  jumpLatch: boolean
  dashLatch: boolean
  padJump: boolean
  padDash: boolean
  /** bitirdiği an (ms); bitmediyse null */
  doneMs: number | null
}

interface Hud {
  time: number
  deaths: number
  items: boolean[]
  done: number | null
}

/**
 * Yan Yana Yarış: iki oyuncu aynı anda, aynı şehirde, ekranın iki yarısında koşar. Her yarının kendi dünyası,
 * kamerası ve çizicisi var; fizik tek oyunculudakiyle aynı sabit adımla yürür. Geri sayım bitince iki süre birlikte
 * başlar; çıkışa ilk varan turu alır. İlerlemeye ve rekorlara dokunmaz.
 */
export default function Race({
  level,
  names,
  heroes,
  looks,
  roundLabel,
  sound,
  keys,
  onKeys,
  onDone,
  onQuit,
}: {
  level: LevelDef
  names: [string, string]
  heroes: [CharacterId, CharacterId]
  /** her yolcunun Kılık Dükkânı'ndaki atkısı ve kombini: her oyuncu seçtiği karakterin kılığını giyer */ looks?: Partial<Record<CharacterId, HeroLook>>
  roundLabel: string
  sound: Sound | null
  /** iki oyuncunun tuşları (save.duoKeys); molada değişirse hemen uyar */
  keys: DuoKeys
  onKeys: (k: DuoKeys) => void
  onDone: (runs: [DuelRun, DuelRun]) => void
  onQuit: () => void
}) {
  const t = useT()
  const lang = useLang()
  const canvases = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)]
  const keysRef = useRef(keys)
  keysRef.current = keys
  const sides = useRef<Side[]>([])
  const phase = useRef<'count' | 'run' | 'pause' | 'over'>('count')
  const [count, setCount] = useState(3)
  const [paused, setPaused] = useState(false)
  const [huds, setHuds] = useState<Hud[]>([
    { time: 0, deaths: 0, items: [false, false, false], done: null },
    { time: 0, deaths: 0, items: [false, false, false], done: null },
  ])
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const finish = () => {
    if (phase.current === 'over') return
    phase.current = 'over'
    const runs = sides.current.map((s) => {
      const timeMs = s.doneMs ?? Math.round(s.world.time * 1000)
      return { timeMs, deaths: s.world.deaths, items: s.world.pickups.filter((p) => p.taken).length, score: s.doneMs ?? DNF }
    }) as [DuelRun, DuelRun]
    doneRef.current(runs)
  }

  useEffect(() => {
    sides.current = [0, 1].map((k) => {
      const canvas = canvases[k].current!
      const renderer = new Renderer(canvas)
      renderer.character = CHARACTERS[heroes[k]]
      const look = looks?.[heroes[k]]
      if (look) {
        renderer.accessory = look.kit
        renderer.scarf = look.scarf
      }
      renderer.lang = lang
      const world = new World(level)
      return { world, renderer, jumpLatch: false, dashLatch: false, padJump: false, padDash: false, doneMs: null }
    })
    const fit = () => {
      sides.current.forEach((s, k) => {
        const c = canvases[k].current!
        // iki tuval aynı anda boyanır: piksel bütçesi ikisine birlikte uygulanır (her yarı bütçenin yarısı)
        const half = Math.sqrt(PIXEL_BUDGET / 2 / Math.max(1, c.clientWidth * c.clientHeight))
        s.renderer.resize(c.clientWidth, c.clientHeight, Math.max(1, Math.min(window.devicePixelRatio || 1, half)))
        s.renderer.setLevel(s.world)
      })
    }
    fit()
    window.addEventListener('resize', fit)

    const keys = new Set<string>()
    const down = (e: KeyboardEvent) => {
      const k = e.code
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'NumpadEnter', 'Slash', 'Period'].includes(k)) e.preventDefault()
      keys.add(k)
      if (e.repeat) return
      if (k === 'Escape' || k === 'KeyP') {
        if (phase.current === 'run') {
          phase.current = 'pause'
          setPaused(true)
        } else if (phase.current === 'pause') {
          phase.current = 'run'
          setPaused(false)
        }
      }
      sides.current.forEach((s, i) => {
        if (keysRef.current[i].jump.includes(k)) s.jumpLatch = true
        if (keysRef.current[i].dash.includes(k)) s.dashLatch = true
      })
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      if (e.key === 'Meta') keys.clear()
    }
    const blur = () => keys.clear()
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __race: unknown }).__race = () => sides.current.map((x) => x.world)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    const sample = (i: number): Input => {
      const s = sides.current[i]
      const m = keysRef.current[i]
      const has = (list: readonly string[]) => list.some((c) => keys.has(c))
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
        if (p.buttons[9]?.pressed && phase.current === 'run') {
          phase.current = 'pause'
          setPaused(true)
        }
        if (pj) inp.jump = true
        if (pj && !s.padJump) s.jumpLatch = true
        if (pd && !s.padDash) s.dashLatch = true
        s.padJump = pj
        s.padDash = pd
      }
      inp.jumpPressed = s.jumpLatch
      inp.dashPressed = s.dashLatch
      s.jumpLatch = false
      s.dashLatch = false
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
          // iki süre aynı anda başlar: ilk tuşu bekleyen avantaj kazanmasın
          for (const s of sides.current) {
            s.world.started = true
            s.jumpLatch = s.dashLatch = false
          }
          sound?.sfx('checkpoint')
        }
      }
      if (ph === 'run') {
        acc += dt
        if (acc >= STEP) {
          const inputs = [sample(0), sample(1)]
          let first = true
          while (acc >= STEP) {
            sides.current.forEach((s, i) => {
              if (s.doneMs !== null) return
              s.renderer.capture(s.world)
              s.world.step(STEP, first ? inputs[i] : { ...inputs[i], jumpPressed: false, dashPressed: false })
            })
            first = false
            acc -= STEP
          }
        }
        for (const s of sides.current) {
          for (const e of s.world.events) {
            s.renderer.handle(e, s.world)
            sound?.sfx(e.type)
            if (e.type === 'complete' && s.doneMs === null) s.doneMs = Math.round(s.world.time * 1000)
          }
          s.world.events.length = 0
        }
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          setHuds(sides.current.map((s) => ({ time: s.world.time, deaths: s.world.deaths, items: s.world.pickups.map((p) => p.taken), done: s.doneMs })))
        }
        if (sides.current.every((s) => s.doneMs !== null)) finish()
      } else acc = 0
      for (const s of sides.current) s.renderer.render(s.world, dt, ph === 'run' && s.doneMs === null ? acc / STEP : 1)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
    // yarış bir kez kurulur; tur değişince bileşen yeniden bağlanır (key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const someoneDone = huds.some((h) => h.done !== null)
  const hints = duoHints(keys, lang === 'en' ? 'en' : 'tr')
  return (
    <div className="absolute inset-0 z-30 grid grid-cols-2 bg-ink portrait:grid-cols-1 portrait:grid-rows-2">
      {[0, 1].map((k) => (
        <div key={k} className={`relative min-h-0 min-w-0 overflow-hidden ${k === 0 ? 'border-r-2 border-[#0e0d22] portrait:border-b-2 portrait:border-r-0' : ''}`}>
          <canvas ref={canvases[k]} className="absolute inset-0 h-full w-full" aria-label={names[k]} />
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 bg-ink/85 py-1 pl-1 pr-2.5 [box-shadow:0_0_0_2px_#37337a]">
            <PortraitFace id={heroes[k]} />
            <div className="leading-tight">
              <p className="max-w-[120px] truncate font-display text-[14px] text-cream">{names[k]}</p>
              <p className="flex items-center gap-1 text-[12px] text-muted">
                {[0, 1, 2].map((i) => (
                  <ItemIcon key={i} city={level.city} taken={!!huds[k].items[i]} size={12} />
                ))}
                <span className="ml-1">✕{huds[k].deaths}</span>
              </p>
            </div>
          </div>
          <p className="pointer-events-none absolute right-2 top-2 bg-ink/85 px-2.5 py-1 font-display text-2xl tabular-nums text-cream [box-shadow:0_0_0_2px_#37337a]">{formatTime((huds[k].done ?? huds[k].time * 1000) | 0)}</p>
          {count > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center gap-3 text-[13px] text-cream">
              {[t('Yürü'), t('Zıpla'), t('Dash')].map((label, i) => (
                <span key={label} className="flex items-center gap-1 bg-ink/80 px-1.5 py-1">
                  {hints[k][i].map((c) => (
                    <Key key={c}>{c}</Key>
                  ))}
                  {label}
                </span>
              ))}
            </div>
          )}
          {huds[k].done !== null && (
            <div className="rise pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-ink/55">
              <p className="font-display text-xl text-gold [text-shadow:0_2px_0_#0e0d22]">{huds[1 - k].done === null || huds[k].done! <= huds[1 - k].done! ? t('İlk Varan') : t('Vardı')}</p>
              <p className="font-display text-6xl tabular-nums text-cream [text-shadow:0_4px_0_#0e0d22]">{formatTime(huds[k].done!)}</p>
            </div>
          )}
        </div>
      ))}

      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink/85 px-3 py-1 text-[12px] font-bold tracking-[0.14em] text-accent-2 [box-shadow:0_0_0_2px_#37337a] portrait:bottom-auto portrait:top-1/2 portrait:-translate-y-1/2">
        {level.name.toLocaleUpperCase(lang)} · {roundLabel}
      </p>

      {count > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p key={count} className="rise font-display text-[120px] leading-none text-cream [text-shadow:0_8px_0_#0e0d22]">
            {count}
          </p>
        </div>
      )}

      {/* mola her zaman ekranda: yalnız oyun koluyla ya da dokunarak da çıkılabilir */}
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

      {someoneDone && !paused && (
        <button className="pixel-btn absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 text-[13px]" onClick={finish}>
          {t('Turu Bitir (Öteki Bitiremedi)')}
        </button>
      )}

      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-4">
          <div className="pixel-panel overlay-scroll max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto p-5 text-center short:p-3">
            <h2 className="font-display text-3xl text-cream">{t('Yarış Durdu')}</h2>
            <p className="mt-1 text-[14px] text-muted short:hidden">{t('Süre durdu. Tuşları buradan değiştirebilirsiniz.')}</p>
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
                {t('Yarışı Bırak')}
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
