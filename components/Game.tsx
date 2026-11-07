'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import TurkeyMap from '@/components/TurkeyMap'
import { Sound } from '@/game/audio'
import { InputManager } from '@/game/input'
import { LEVELS } from '@/game/levels'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { emptyInput, type Fact } from '@/game/types'
import { defaultSave, formatTime, loadSave, writeSave, type Save } from '@/lib/storage'

type Screen = 'title' | 'map' | 'intro' | 'play' | 'pause' | 'complete' | 'scores' | 'controls' | 'end'

interface ScoreRow {
  name: string
  timeMs: number
  deaths: number
  items: number
}

interface Result {
  timeMs: number
  deaths: number
  items: boolean[]
  newBest: boolean
}

const STEP = 1 / 120

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const inputRef = useRef<InputManager | null>(null)
  const soundRef = useRef<Sound | null>(null)
  const screenRef = useRef<Screen>('title')
  const levelRef = useRef(0)

  const [screen, setScreenState] = useState<Screen>('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [save, setSave] = useState<Save>(defaultSave)
  const [hud, setHud] = useState({ time: 0, deaths: 0, items: [false, false, false] })
  const [hint, setHint] = useState<string | null>(null)
  const [toast, setToast] = useState<(Fact & { item: string; key: number }) | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [coarse, setCoarse] = useState(false)
  const [ready, setReady] = useState(false)

  const setScreen = useCallback((s: Screen) => {
    screenRef.current = s
    setScreenState(s)
  }, [])

  const level = LEVELS[levelIdx]

  /* ── kurulum ─────────────────────────────────────────────── */
  useEffect(() => {
    const s = loadSave()
    setSave(s)
    setCoarse(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    const canvas = canvasRef.current!
    const renderer = new Renderer(canvas)
    const input = new InputManager()
    const sound = new Sound()
    sound.sfxOn = s.sfx
    sound.musicOn = s.music
    rendererRef.current = renderer
    inputRef.current = input
    soundRef.current = sound
    input.attach()

    const fit = () => {
      renderer.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 3))
      if (worldRef.current) renderer.setLevel(worldRef.current)
    }
    fit()
    const startIdx = Math.min(s.unlocked, LEVELS.length - 1)
    levelRef.current = startIdx
    setLevelIdx(startIdx)
    worldRef.current = new World(LEVELS[startIdx])
    renderer.setLevel(worldRef.current)
    // ?debug: testler için dünyaya erişim
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __mk: unknown }).__mk = { world: () => worldRef.current }
    setReady(true)
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)

    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      const w = worldRef.current
      if (!w) return
      const sc = screenRef.current
      if (sc === 'play') {
        acc += dt
        let first = true
        const inp = input.sample()
        while (acc >= STEP) {
          w.step(STEP, first ? inp : { ...inp, jumpPressed: false, dashPressed: false })
          first = false
          acc -= STEP
        }
        for (const e of w.events) {
          renderer.handle(e, w)
          soundRef.current?.sfx(e.type)
          if (e.type === 'collect') {
            const lv = w.level
            setToast({ ...lv.facts[e.index], item: lv.item, key: Date.now() })
          }
          if (e.type === 'complete') finish()
        }
        w.events.length = 0
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          setHud({ time: w.time, deaths: w.deaths, items: w.pickups.map((p) => p.taken) })
          setHint(w.nearSign >= 0 ? (w.level.hints[w.nearSign] ?? null) : null)
        }
      } else if (sc === 'title' || sc === 'map' || sc === 'scores' || sc === 'controls') {
        // vitrin: dünya akar ama oyuncu beklemede
        w.step(dt, emptyInput())
        w.events.length = 0
      } else {
        acc = 0
      }
      renderer.render(w, dt)
    }
    raf = requestAnimationFrame(frame)

    const onVis = () => {
      if (document.hidden && screenRef.current === 'play') {
        screenRef.current = 'pause'
        setScreenState('pause')
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      input.detach()
      sound.stopMusic()
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── klavye: duraklat / bayraktan dön ────────────────────── */
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.onPause = () => {
      if (screenRef.current === 'play') setScreen('pause')
      else if (screenRef.current === 'pause') setScreen('play')
    }
    input.onRetry = () => {
      if (screenRef.current === 'play') worldRef.current?.retryFromCheckpoint()
    }
  }, [setScreen, ready])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 6500)
    return () => clearTimeout(id)
  }, [toast])

  const persist = useCallback((next: Save) => {
    setSave(next)
    writeSave(next)
  }, [])

  const loadLevel = useCallback(
    (idx: number, toScreen: Screen = 'intro') => {
      levelRef.current = idx
      setLevelIdx(idx)
      const w = new World(LEVELS[idx])
      worldRef.current = w
      rendererRef.current?.setLevel(w)
      inputRef.current?.clear()
      setHud({ time: 0, deaths: 0, items: [false, false, false] })
      setToast(null)
      setHint(null)
      setResult(null)
      setScreen(toScreen)
    },
    [setScreen],
  )

  const beginPlay = useCallback(() => {
    const snd = soundRef.current
    snd?.unlock()
    snd?.setMusic(LEVELS[levelRef.current].city)
    inputRef.current?.clear()
    setScreen('play')
  }, [setScreen])

  function finish() {
    const w = worldRef.current
    if (!w) return
    const idx = levelRef.current
    const timeMs = Math.round(w.time * 1000)
    const items = w.pickups.map((p) => p.taken)
    setSave((prev) => {
      const best = prev.best[w.level.id]
      const newBest = !best || timeMs < best.timeMs
      const mergedItems = items.map((v, i) => v || !!best?.items[i])
      const next: Save = {
        ...prev,
        unlocked: Math.max(prev.unlocked, Math.min(idx + 1, LEVELS.length - 1)),
        best: {
          ...prev.best,
          [w.level.id]: newBest ? { timeMs, deaths: w.deaths, items: mergedItems } : { ...best, items: mergedItems },
        },
      }
      writeSave(next)
      setResult({ timeMs, deaths: w.deaths, items, newBest })
      return next
    })
    setScreen('complete')
  }

  const toggle = (k: 'sfx' | 'music') => {
    const next = { ...save, [k]: !save[k] }
    persist(next)
    const snd = soundRef.current
    if (!snd) return
    snd.unlock()
    if (k === 'sfx') snd.sfxOn = next.sfx
    else snd.musicOn = next.music
  }

  const showTouch = save.touch === 'on' || (save.touch === 'auto' && coarse)

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} aria-label="Oyun alanı" />

      {screen === 'play' && (
        <>
          <Hud level={level} hud={hud} onPause={() => setScreen('pause')} />
          {hint && (
            <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-10 flex justify-center px-4">
              <p className="rise max-w-md border-2 border-[#c79a62] bg-[#3a2a1e]/90 px-4 py-2.5 text-center text-[13px] leading-snug text-cream">{hint}</p>
            </div>
          )}
          {toast && (
            <div key={toast.key} className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+150px)] z-10 flex justify-center px-4 sm:bottom-8">
              <div className="rise pixel-panel max-w-md px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.2em] text-gold">HATIRA · {toast.item.toLocaleUpperCase('tr')}</p>
                <p className="mt-1 font-display text-lg text-cream">{toast.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted">{toast.text}</p>
              </div>
            </div>
          )}
          {showTouch && inputRef.current && <TouchControls input={inputRef.current} />}
        </>
      )}

      {screen === 'title' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6 sm:p-8">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">ŞEHİR ŞEHİR ANADOLU</p>
            <h1 className="mt-2 font-display text-5xl leading-none text-cream sm:text-6xl">Memleket</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              İstanbul’dan Bayburt’a altı şehir. Martılar, taş teraslar, kayısı kasaları, Hitit ok tuzakları, buzlu Kızılırmak ve kale rüzgârı. Her şehirde
              üç hatıra, her hatırada bir hikâye.
            </p>
            <div className="mt-6 grid gap-2.5">
              <button className="pixel-btn primary justify-center text-base" onClick={() => loadLevel(Math.min(save.unlocked, LEVELS.length - 1))} autoFocus>
                ▶ {save.unlocked > 0 ? `Devam et: ${LEVELS[Math.min(save.unlocked, LEVELS.length - 1)].name}` : 'Yolculuğa başla'}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button className="pixel-btn justify-center" onClick={() => setScreen('map')}>
                  Şehirler
                </button>
                <button className="pixel-btn justify-center" onClick={() => setScreen('scores')}>
                  Skorlar
                </button>
                <button className="pixel-btn justify-center" onClick={() => setScreen('controls')}>
                  Kontroller
                </button>
                <button className="pixel-btn justify-center" onClick={() => toggle('music')}>
                  Müzik {save.music ? 'açık' : 'kapalı'}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'map' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-cream">Şehirler</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                ← Geri
              </button>
            </div>
            <div className="mt-3">
              <TurkeyMap unlocked={save.unlocked} selected={levelIdx} onSelect={(i) => loadLevel(i)} />
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {LEVELS.map((l, i) => {
                const locked = i > save.unlocked
                const best = save.best[l.id]
                const found = best?.items.filter(Boolean).length ?? 0
                return (
                  <li key={l.id}>
                    <button className="pixel-btn w-full justify-between text-left" disabled={locked} onClick={() => loadLevel(i)}>
                      <span className="flex items-center gap-3">
                        <span className="plate text-sm">
                          <span>{l.plate}</span>
                        </span>
                        <span>
                          <span className="block font-display text-base">{l.name}</span>
                          <span className="block text-[11px] text-muted">
                            {l.subtitle} · {l.difficulty}
                          </span>
                        </span>
                      </span>
                      <span className="text-right text-[11px] text-muted">
                        {locked ? 'Kilitli' : best ? `${formatTime(best.timeMs)} · ${found}/3` : 'Yeni'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </Overlay>
      )}

      {screen === 'intro' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6">
            <div className="flex items-center gap-4">
              <span className="plate text-4xl">
                <span>{level.plate}</span>
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-accent">
                  {String(levelIdx + 1).padStart(2, '0')} / {String(LEVELS.length).padStart(2, '0')} · {level.difficulty.toLocaleUpperCase('tr')}
                </p>
                <h2 className="font-display text-4xl leading-none text-cream">{level.name}</h2>
                <p className="text-sm text-muted">{level.subtitle}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-cream/90">{level.intro}</p>
            <p className="mt-3 text-[12px] text-muted">
              Bu şehirde 3 <strong className="text-gold">{level.item.toLocaleLowerCase('tr')}</strong> saklı. Her biri şehre dair bir hikâye anlatır.
            </p>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
              <button className="pixel-btn primary justify-center text-base" onClick={beginPlay} autoFocus>
                ▶ Başla
              </button>
              <button className="pixel-btn" onClick={() => setScreen('map')}>
                Şehirler
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'pause' && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6">
            <p className="text-[11px] font-bold tracking-[0.25em] text-accent">
              {level.difficulty.toLocaleUpperCase('tr')} · {level.name.toLocaleUpperCase('tr')}
            </p>
            <h2 className="mt-1 font-display text-5xl text-cream">Mola</h2>
            <p className="mt-1 text-sm text-muted">
              {formatTime(hud.time * 1000)} · {hud.deaths} düşüş · {hud.items.filter(Boolean).length}/3 {level.item.toLocaleLowerCase('tr')}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary" onClick={() => setScreen('play')} autoFocus>
                ▶ Devam
              </button>
              <button
                className="pixel-btn"
                onClick={() => {
                  worldRef.current?.retryFromCheckpoint()
                  setScreen('play')
                }}
              >
                ⚑ Bayraktan dön
              </button>
              <button className="pixel-btn" onClick={() => loadLevel(levelIdx, 'play')}>
                ↺ Baştan başla
              </button>
              <button className="pixel-btn" onClick={() => setScreen('map')}>
                ⌖ Şehirler
              </button>
              <button className="pixel-btn" onClick={() => toggle('sfx')}>
                Efekt {save.sfx ? 'açık' : 'kapalı'}
              </button>
              <button className="pixel-btn" onClick={() => toggle('music')}>
                Müzik {save.music ? 'açık' : 'kapalı'}
              </button>
              <button
                className="pixel-btn col-span-2 justify-center"
                onClick={() => persist({ ...save, touch: showTouch ? 'off' : 'on' })}
              >
                Dokunmatik kontroller: {showTouch ? 'açık' : 'kapalı'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'complete' && result && (
        <Complete
          levelIdx={levelIdx}
          result={result}
          save={save}
          onName={(name) => persist({ ...save, name })}
          onNext={() => (levelIdx + 1 < LEVELS.length ? loadLevel(levelIdx + 1) : setScreen('end'))}
          onRetry={() => loadLevel(levelIdx, 'play')}
          onMap={() => setScreen('map')}
        />
      )}

      {screen === 'scores' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cream">Skor tablosu</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                ← Geri
              </button>
            </div>
            <ScoreBoard initial={levelIdx} />
          </div>
        </Overlay>
      )}

      {screen === 'controls' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cream">Kontroller</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                ← Geri
              </button>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-bold text-gold">Klavye</dt>
                <dd />
                <dt className="text-muted">Yürü</dt>
                <dd>← → / A D</dd>
                <dt className="text-muted">Zıpla</dt>
                <dd>Boşluk / Z / ↑</dd>
                <dt className="text-muted">Atıl</dt>
                <dd>X / Shift</dd>
                <dt className="text-muted">Yön + atıl</dt>
                <dd>8 yöne atılma</dd>
                <dt className="text-muted">İn</dt>
                <dd>↓ + Zıpla</dd>
                <dt className="text-muted">Mola</dt>
                <dd>Esc / P</dd>
                <dt className="text-muted">Bayrak</dt>
                <dd>R</dd>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-bold text-gold">Dokunmatik</dt>
                <dd />
                <dt className="text-muted">Sol yarı</dt>
                <dd>Joystick (nereye dokunursan orada)</dd>
                <dt className="text-muted">ZIPLA</dt>
                <dd>Uzun bas, yüksel</dd>
                <dt className="text-muted">ATIL</dt>
                <dd>Joystick yönünde</dd>
                <dt className="font-bold text-gold">Oyun kolu</dt>
                <dd />
                <dt className="text-muted">A / Y</dt>
                <dd>Zıpla</dd>
                <dt className="text-muted">X / B / RT</dt>
                <dd>Atıl</dd>
              </dl>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              İpucu: duvara doğru basılı tutup zıplarsan aynı duvarda tırmanırsın. Atılma yere değince ya da bir düşmana basınca yenilenir; atkın kırmızıysa atılmaya hazırsın.
            </p>
          </div>
        </Overlay>
      )}

      {screen === 'end' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">YOLCULUK TAMAM</p>
            <h2 className="mt-2 font-display text-4xl text-cream">İstanbul’dan Bayburt’a</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Altı şehir, {Object.values(save.best).reduce((a, b) => a + b.items.filter(Boolean).length, 0)} / {LEVELS.length * 3} hatıra. Toplam en iyi süre:{' '}
              {formatTime(Object.values(save.best).reduce((a, b) => a + b.timeMs, 0))}. Yeni şehirler yolda.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={() => setScreen('map')}>
                Şehirler
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('scores')}>
                Skorlar
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

/* ── Parçalar ───────────────────────────────────────────────── */

function Overlay({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-4 ${dim ? 'bg-ink/55' : 'bg-gradient-to-b from-ink/40 via-ink/20 to-ink/60'}`}
      style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}

function Hud({ level, hud, onPause }: { level: (typeof LEVELS)[number]; hud: { time: number; deaths: number; items: boolean[] }; onPause: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}
    >
      <div className="flex items-center gap-2.5 bg-ink/55 px-2.5 py-1.5">
        <span className="plate text-lg">
          <span>{level.plate}</span>
        </span>
        <div className="leading-tight">
          <p className="font-display text-base text-cream sm:text-lg">{level.name}</p>
          <p className="text-[10px] font-bold tracking-[0.18em] text-muted">{level.difficulty.toLocaleUpperCase('tr')}</p>
        </div>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-3 bg-ink/55 px-3 py-2 text-sm font-semibold tabular-nums text-cream">
          <span className="flex gap-1" aria-label={`${hud.items.filter(Boolean).length} / 3 hatıra`}>
            {hud.items.map((v, i) => (
              <span key={i} className={`inline-block h-2.5 w-2.5 rotate-45 border ${v ? 'border-gold bg-gold' : 'border-muted/60'}`} />
            ))}
          </span>
          <span aria-label="Düşüş">✕ {hud.deaths}</span>
          <span aria-label="Süre" className="hidden min-[360px]:inline">
            {formatTime(hud.time * 1000).slice(0, -2)}
          </span>
        </div>
        <button className="pixel-btn h-10 w-10 justify-center p-0" aria-label="Mola" onClick={onPause}>
          ❚❚
        </button>
      </div>
    </div>
  )
}

function Complete({
  levelIdx,
  result,
  save,
  onName,
  onNext,
  onRetry,
  onMap,
}: {
  levelIdx: number
  result: Result
  save: Save
  onName: (n: string) => void
  onNext: () => void
  onRetry: () => void
  onMap: () => void
}) {
  const level = LEVELS[levelIdx]
  const [name, setName] = useState(save.name)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr] = useState('')
  const [refresh, setRefresh] = useState(0)
  const found = result.items.filter(Boolean).length
  const best = save.best[level.id]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    onName(name.trim())
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: level.id, name: name.trim(), timeMs: result.timeMs, deaths: result.deaths, items: found }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Gönderilemedi')
      setStatus('sent')
      setRefresh((r) => r + 1)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gönderilemedi')
      setStatus('error')
    }
  }

  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="plate text-3xl">
            <span>{level.plate}</span>
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold tracking-[0.25em] text-accent">{level.name.toLocaleUpperCase('tr')} GEÇİLDİ</p>
            <p className="font-display text-3xl text-cream">
              {formatTime(result.timeMs)} <span className="text-lg text-muted">· {result.deaths} düşüş · {found}/3</span>
            </p>
            <p className="text-[12px] text-muted">{result.newBest ? 'Yeni kişisel rekor!' : best ? `Rekorun: ${formatTime(best.timeMs)}` : ''}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="grid content-start gap-2">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gold">HATIRALAR</p>
            {level.facts.map((f, i) => {
              const have = result.items[i] || best?.items[i]
              return (
                <div key={i} className={`border-2 px-3 py-2 ${have ? 'border-line bg-panel-2' : 'border-dashed border-line/70'}`}>
                  <p className="font-display text-sm text-cream">{have ? f.title : 'Bulunamadı'}</p>
                  <p className="text-[12px] leading-snug text-muted">{have ? f.text : `Bu ${level.item.toLocaleLowerCase('tr')} şehirde bir yerde saklı. Tekrar oyna ve bul.`}</p>
                </div>
              )
            })}
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-gold">SKOR TABLOSU</p>
            {status !== 'sent' && (
              <form onSubmit={submit} className="mt-2 flex gap-2">
                <label className="sr-only" htmlFor="nm">
                  Adın
                </label>
                <input
                  id="nm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  minLength={2}
                  required
                  placeholder="Adın"
                  className="min-w-0 flex-1 border-2 border-line bg-ink px-3 py-2 text-sm text-cream outline-none focus:border-gold"
                />
                <button className="pixel-btn primary" disabled={status === 'sending'}>
                  {status === 'sending' ? '…' : 'Gönder'}
                </button>
              </form>
            )}
            {status === 'error' && <p className="mt-1 text-[12px] text-accent-2">{err}</p>}
            {status === 'sent' && <p className="mt-2 text-[12px] text-gold">Skorun kaydedildi.</p>}
            <Top level={level.id} refresh={refresh} highlight={status === 'sent' ? name.trim() : ''} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button className="pixel-btn primary" onClick={onNext} autoFocus>
            {levelIdx + 1 < LEVELS.length ? `▶ Sıradaki: ${LEVELS[levelIdx + 1].name}` : '▶ Yolculuğu bitir'}
          </button>
          <button className="pixel-btn" onClick={onRetry}>
            ↺ Tekrar
          </button>
          <button className="pixel-btn" onClick={onMap}>
            Şehirler
          </button>
        </div>
      </div>
    </Overlay>
  )
}

function Top({ level, refresh, highlight }: { level: string; refresh: number; highlight: string }) {
  const [rows, setRows] = useState<ScoreRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    setFailed(false)
    fetch(`/api/scores?level=${level}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('x'))))
      .then((j: { scores: ScoreRow[] }) => live && setRows(j.scores))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [level, refresh])
  if (failed) return <p className="mt-2 text-[12px] text-muted">Skor tablosuna şu an ulaşılamıyor.</p>
  if (!rows) return <p className="mt-2 text-[12px] text-muted">Yükleniyor…</p>
  if (!rows.length) return <p className="mt-2 text-[12px] text-muted">Henüz skor yok. İlk sen ol!</p>
  return (
    <ol className="mt-2 grid gap-1 text-[13px] tabular-nums">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className={`grid grid-cols-[1.6rem_1fr_auto_auto] gap-2 px-2 py-1 ${r.name === highlight ? 'bg-accent/25' : i % 2 ? '' : 'bg-panel-2/60'}`}>
          <span className="text-muted">{i + 1}.</span>
          <span className="truncate text-cream">{r.name}</span>
          <span className="text-muted">
            ✕{r.deaths} · {r.items}/3
          </span>
          <span className="text-cream">{formatTime(r.timeMs)}</span>
        </li>
      ))}
    </ol>
  )
}

function ScoreBoard({ initial }: { initial: number }) {
  const [idx, setIdx] = useState(initial)
  return (
    <div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {LEVELS.map((l, i) => (
          <button key={l.id} className={`pixel-btn px-2.5 py-1.5 text-[12px] ${i === idx ? 'primary' : ''}`} onClick={() => setIdx(i)}>
            {l.plate} {l.name}
          </button>
        ))}
      </div>
      <Top level={LEVELS[idx].id} refresh={0} highlight="" />
    </div>
  )
}
