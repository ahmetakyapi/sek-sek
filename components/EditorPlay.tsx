'use client'

import { useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import { InputManager } from '@/game/input'
import { PIXEL_BUDGET, Renderer } from '@/game/render'
import { World } from '@/game/sim'
import type { LevelDef } from '@/game/types'
import { useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/** Deneme koşusunun ızgaraya dönen izi (dünya pikseli): yol, düşülen yerler ve sonuç */
export interface PlayTrace {
  path: Array<[number, number]>
  falls: Array<[number, number]>
  done: { ms: number; deaths: number; items: number; total: number } | null
}

const STEP = 1 / 120

/**
 * Bölüm Düzenleyici'nin Hızlı Deneme penceresi: ızgaranın yerinde oyunun kendisi (aynı fizik, aynı çizim) koşar.
 * Esc düzenlemeye döner, R baştan başlatır. Dönüşte koşunun izi ve düşülen yerler ızgaraya çizilir.
 * Kayda, rekora ve deftere dokunmaz; `?ozel=` ile tam oyunda açma ayrı düğmedir.
 */
export default function EditorPlay({ level, onExit }: { level: LevelDef; onExit: (trace: PlayTrace) => void }) {
  const t = useT()
  const lang = useLang()
  const canvas = useRef<HTMLCanvasElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<InputManager | null>(null)
  if (!input.current) input.current = new InputManager()
  const [hud, setHud] = useState({ ms: 0, deaths: 0, items: 0, total: 0 })
  const [done, setDone] = useState<PlayTrace['done']>(null)
  const [touch, setTouch] = useState(false)
  const [run, setRun] = useState(0)
  const trace = useRef<PlayTrace>({ path: [], falls: [], done: null })
  const exitRef = useRef(onExit)
  exitRef.current = onExit

  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])

  useEffect(() => {
    const cv = canvas.current
    const el = box.current
    const inp = input.current!
    if (!cv || !el) return
    const renderer = new Renderer(cv)
    renderer.lang = lang === 'en' ? 'en' : 'tr'
    renderer.bossCity = level.bossOf ?? level.city
    let world = new World(level)
    trace.current = { path: [], falls: [], done: null }
    setDone(null)
    const fit = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, Math.sqrt(PIXEL_BUDGET / (w * h))))
      renderer.resize(w, h, dpr)
      renderer.setLevel(world)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const leave = () => exitRef.current(trace.current)
    inp.onPause = leave
    inp.onRetry = () => setRun((n) => n + 1)
    inp.onRestart = inp.onRetry
    inp.attach()
    ;(document.activeElement as HTMLElement | null)?.blur?.()

    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudT = 0
    let sample = 0
    let finished = false
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      if (!finished) {
        acc += dt
        if (acc >= STEP) {
          const first = inp.sample()
          const rest = { ...first, jumpPressed: false, dashPressed: false }
          let once = true
          while (acc >= STEP) {
            renderer.capture(world)
            world.step(STEP, once ? first : rest)
            once = false
            acc -= STEP
            if (world.started && sample++ % 6 === 0) trace.current.path.push([Math.round(world.player.x + world.player.w / 2), Math.round(world.player.y + world.player.h / 2)])
          }
        }
        for (const e of world.events) {
          renderer.handle(e, world)
          if (e.type === 'death' || e.type === 'drown' || e.type === 'bite') trace.current.falls.push([Math.round(world.player.x + world.player.w / 2), Math.round(world.player.y + world.player.h / 2)])
          if (e.type === 'complete' && !finished) {
            finished = true
            const d = { ms: Math.round(world.time * 1000), deaths: world.deaths, items: world.pickups.filter((p) => p.taken).length, total: world.pickups.length }
            trace.current.done = d
            setDone(d)
          }
        }
        world.events.length = 0
      } else acc = 0
      hudT += dt
      if (hudT > 0.1) {
        hudT = 0
        setHud({ ms: Math.round(world.time * 1000), deaths: world.deaths, items: world.pickups.filter((p) => p.taken).length, total: world.pickups.length })
      }
      renderer.render(world, dt, finished ? 1 : acc / STEP)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      inp.detach()
      inp.clear()
      inp.onPause = inp.onRetry = inp.onRestart = null
      world = null as unknown as World
    }
    // her "Baştan" yeni bir koşu kurar (run)
  }, [level, lang, run])

  return (
    <div ref={box} className="absolute inset-0 z-20 overflow-hidden border-2 border-teal bg-ink" role="region" aria-label={t('Hızlı Deneme')}>
      <canvas ref={canvas} className="absolute inset-0 block h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <button type="button" className="pixel-btn back-btn px-2.5 py-1 text-[14px]" onClick={() => exitRef.current(trace.current)} data-back>
            ← {t('Düzenlemeye Dön')}
          </button>
          <button type="button" className="pixel-btn px-2.5 py-1 text-[14px]" onClick={() => setRun((n) => n + 1)}>
            ↻ {t('Baştan')}
            <kbd className="ml-1.5 hidden text-[12px] opacity-80 [@media(pointer:fine)]:inline">R</kbd>
          </button>
        </div>
        <p className="rounded-sm bg-ink/80 px-2.5 py-1 text-[14px] tabular-nums text-cream" aria-live="off">
          {formatTime(hud.ms)} · {t('Düşüş')} {hud.deaths}
          {hud.total > 0 && ` · ${t('Hatıra')} ${hud.items}/${hud.total}`}
        </p>
      </div>
      {done && (
        <div className="absolute inset-0 grid place-items-center bg-ink/55 p-3">
          <div role="status" className="grid max-w-sm gap-2 border-2 border-gold bg-panel px-5 py-4 text-center shadow-[0_6px_0_#0e0d22]">
            <h2 className="font-display text-[22px] text-gold">{t('Çıkışa Vardın')}</h2>
            <p className="text-[15px] tabular-nums text-cream">
              {formatTime(done.ms)} · {t('Düşüş')} {done.deaths}
              {done.total > 0 && ` · ${t('Hatıra')} ${done.items}/${done.total}`}
            </p>
            <p className="text-[14px] text-muted">{t('Koşunun izi ızgarada görünecek.')}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <button type="button" className="pixel-btn px-3 py-1.5 text-[14px]" onClick={() => setRun((n) => n + 1)}>
                ↻ {t('Yeniden Dene')}
              </button>
              <button type="button" className="pixel-btn primary px-3 py-1.5 text-[14px]" onClick={() => exitRef.current(trace.current)} autoFocus>
                {t('Düzenlemeye Dön')}
              </button>
            </div>
          </div>
        </div>
      )}
      {touch && !done && <TouchControls input={input.current} />}
    </div>
  )
}
