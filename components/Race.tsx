'use client'

import { useEffect, useRef, useState } from 'react'
import { DNF } from '@/components/Modes'
import { PortraitFace } from '@/components/Portrait'
import { ItemIcon, Key } from '@/components/HudBits'
import type { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { emptyInput, type Input, type LevelDef } from '@/game/types'
import type { DuelRun } from '@/lib/extras'
import { useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

const STEP = 1 / 120

/** Yan yana yarışta tuşlar: solda WASD, sağda ok tuşları; oyun kolu varsa 1. kol sola, 2. kol sağa */
const KEYS = [
  { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['KeyW', 'KeyG'], dash: ['KeyF', 'Space'] },
  { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['ArrowUp', 'KeyK'], dash: ['KeyL', 'Enter', 'Slash'] },
] as const

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
  roundLabel,
  sound,
  onDone,
  onQuit,
}: {
  level: LevelDef
  names: [string, string]
  heroes: [CharacterId, CharacterId]
  roundLabel: string
  sound: Sound | null
  onDone: (runs: [DuelRun, DuelRun]) => void
  onQuit: () => void
}) {
  const t = useT()
  const lang = useLang()
  const canvases = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)]
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
      return { timeMs, deaths: s.world.deaths, score: s.doneMs ?? DNF }
    }) as [DuelRun, DuelRun]
    doneRef.current(runs)
  }

  useEffect(() => {
    sides.current = [0, 1].map((k) => {
      const canvas = canvases[k].current!
      const renderer = new Renderer(canvas)
      renderer.character = CHARACTERS[heroes[k]]
      renderer.lang = lang
      const world = new World(level)
      return { world, renderer, jumpLatch: false, dashLatch: false, padJump: false, padDash: false, doneMs: null }
    })
    const fit = () => {
      sides.current.forEach((s, k) => {
        const c = canvases[k].current!
        s.renderer.resize(c.clientWidth, c.clientHeight, Math.min(window.devicePixelRatio || 1, 2))
        s.renderer.setLevel(s.world)
      })
    }
    fit()
    window.addEventListener('resize', fit)

    const keys = new Set<string>()
    const down = (e: KeyboardEvent) => {
      const k = e.code
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Slash'].includes(k)) e.preventDefault()
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
        if ((KEYS[i].jump as readonly string[]).includes(k)) s.jumpLatch = true
        if ((KEYS[i].dash as readonly string[]).includes(k)) s.dashLatch = true
      })
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      if (e.key === 'Meta') keys.clear()
    }
    const blur = () => keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    const sample = (i: number): Input => {
      const s = sides.current[i]
      const m = KEYS[i]
      const has = (list: readonly string[]) => list.some((c) => keys.has(c))
      const inp = emptyInput()
      inp.left = has(m.left)
      inp.right = has(m.right)
      inp.up = has(m.up)
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
  const hints = [
    [['A', 'D'], ['W'], ['F']],
    [['←', '→'], ['↑'], ['L']],
  ]
  return (
    <div className="absolute inset-0 z-30 grid grid-cols-2 bg-ink portrait:grid-cols-1 portrait:grid-rows-2">
      {[0, 1].map((k) => (
        <div key={k} className={`relative min-h-0 min-w-0 overflow-hidden ${k === 0 ? 'border-r-2 border-[#120f1a] portrait:border-b-2 portrait:border-r-0' : ''}`}>
          <canvas ref={canvases[k]} className="absolute inset-0 h-full w-full" aria-label={names[k]} />
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 bg-ink/85 py-1 pl-1 pr-2.5 [box-shadow:0_0_0_2px_#3d3550]">
            <PortraitFace id={heroes[k]} />
            <div className="leading-tight">
              <p className="max-w-[120px] truncate font-display text-[14px] text-cream">{names[k]}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted">
                {[0, 1, 2].map((i) => (
                  <ItemIcon key={i} city={level.city} taken={!!huds[k].items[i]} size={12} />
                ))}
                <span className="ml-1">✕{huds[k].deaths}</span>
              </p>
            </div>
          </div>
          <p className="pointer-events-none absolute right-2 top-2 bg-ink/85 px-2.5 py-1 font-display text-2xl tabular-nums text-cream [box-shadow:0_0_0_2px_#3d3550]">{formatTime((huds[k].done ?? huds[k].time * 1000) | 0)}</p>
          {count > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center gap-3 text-[12px] text-cream">
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
              <p className="text-[12px] font-bold tracking-[0.3em] text-gold">{huds[1 - k].done === null || huds[k].done! <= huds[1 - k].done! ? t('İLK VARAN') : t('VARDI')}</p>
              <p className="font-display text-6xl tabular-nums text-cream [text-shadow:0_4px_0_#120f1a]">{formatTime(huds[k].done!)}</p>
            </div>
          )}
        </div>
      ))}

      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink/85 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-accent-2 [box-shadow:0_0_0_2px_#3d3550] portrait:bottom-auto portrait:top-1/2 portrait:-translate-y-1/2">
        {level.name.toLocaleUpperCase(lang)} · {roundLabel}
      </p>

      {count > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p key={count} className="rise font-display text-[120px] leading-none text-cream [text-shadow:0_8px_0_#120f1a]">
            {count}
          </p>
        </div>
      )}

      {someoneDone && !paused && (
        <button className="pixel-btn absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 text-[13px]" onClick={finish}>
          {t('Turu Bitir (Öteki Bitiremedi)')}
        </button>
      )}

      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-4">
          <div className="pixel-panel w-full max-w-xs p-5 text-center">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('MOLA')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream">{t('Yarış Durdu')}</h2>
            <div className="mt-4 grid gap-2.5">
              <button
                className="pixel-btn primary justify-center"
                autoFocus
                onClick={() => {
                  phase.current = 'run'
                  setPaused(false)
                }}
              >
                {t('▶ Devam Et')}
              </button>
              <button className="pixel-btn justify-center" onClick={onQuit}>
                {t('Yarışı Bırak')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
