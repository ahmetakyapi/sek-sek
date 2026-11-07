'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import Portrait from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { CharacterPortrait, MedalBadge, Overlay, displayName, haptic, medalFor } from '@/components/ui'
import { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { InputManager } from '@/game/input'
import { LEVELS } from '@/game/levels'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { ENDING, STORY, fill } from '@/game/story'
import { emptyInput, type Fact } from '@/game/types'
import { defaultSave, formatTime, loadSave, writeSave, type Save } from '@/lib/storage'

type Screen = 'title' | 'character' | 'story' | 'map' | 'intro' | 'play' | 'pause' | 'complete' | 'scores' | 'controls' | 'end'

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
  const freezeRef = useRef(0)

  const [screen, setScreenState] = useState<Screen>('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [save, setSave] = useState<Save>(defaultSave)
  const [hud, setHud] = useState({ time: 0, deaths: 0, items: [false, false, false] })
  const [hint, setHint] = useState<string | null>(null)
  const [npc, setNpc] = useState<number>(-1)
  const [toast, setToast] = useState<(Fact & { item: string; key: number }) | null>(null)
  const [quip, setQuip] = useState<{ text: string; key: number } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [coarse, setCoarse] = useState(false)
  const [ready, setReady] = useState(false)
  const [storyPage, setStoryPage] = useState(0)
  const [canFull, setCanFull] = useState(false)

  const setScreen = useCallback((s: Screen) => {
    screenRef.current = s
    setScreenState(s)
  }, [])

  const level = LEVELS[levelIdx]
  const hero = CHARACTERS[save.character ?? 'uktun']

  /* ── kurulum ─────────────────────────────────────────────── */
  useEffect(() => {
    const s = loadSave()
    setSave(s)
    setCoarse(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    setCanFull(!!document.documentElement.requestFullscreen)
    const canvas = canvasRef.current!
    const renderer = new Renderer(canvas)
    renderer.character = CHARACTERS[s.character ?? 'uktun']
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
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __mk: unknown }).__mk = { world: () => worldRef.current }
    setReady(true)
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)

    // uzun basışta kopyala/kaydet menüsü açılmasın
    const noMenu = (e: Event) => {
      if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
    }
    document.addEventListener('contextmenu', noMenu)
    document.addEventListener('selectstart', noMenu)
    // iOS çift dokunuş yakınlaştırması
    let lastTouch = 0
    const noDoubleTap = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouch < 320 && !(e.target instanceof HTMLInputElement)) e.preventDefault()
      lastTouch = now
    }
    document.addEventListener('touchend', noDoubleTap, { passive: false })

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
        // vuruş anı donması: ezmede kısa bir duraksama hissi
        if (freezeRef.current > 0) {
          freezeRef.current -= dt
          renderer.render(w, dt * 0.15)
          return
        }
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
          switch (e.type) {
            case 'collect': {
              const lv = w.level
              setToast({ ...lv.facts[e.index], item: lv.item, key: Date.now() })
              haptic([12, 40, 12])
              break
            }
            case 'stomp':
              freezeRef.current = 0.06
              haptic(15)
              break
            case 'death': {
              haptic(40)
              const q = w.level.quips
              if (Math.random() < 0.4) setQuip({ text: q[Math.floor(Math.random() * q.length)], key: Date.now() })
              break
            }
            case 'checkpoint':
              haptic(10)
              break
            case 'dash':
              haptic(6)
              break
            case 'complete':
              haptic([20, 60, 20, 60, 40])
              finish()
              break
          }
        }
        w.events.length = 0
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          setHud({ time: w.time, deaths: w.deaths, items: w.pickups.map((p) => p.taken) })
          setHint(w.nearSign >= 0 ? (w.level.hints[w.nearSign] ?? null) : null)
          setNpc(w.nearNpc)
        }
      } else if (sc === 'title' || sc === 'map' || sc === 'scores' || sc === 'controls' || sc === 'character' || sc === 'story') {
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
      document.removeEventListener('contextmenu', noMenu)
      document.removeEventListener('selectstart', noMenu)
      document.removeEventListener('touchend', noDoubleTap)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    if (!quip) return
    const id = setTimeout(() => setQuip(null), 1800)
    return () => clearTimeout(id)
  }, [quip])

  const persist = useCallback((next: Save) => {
    setSave(next)
    writeSave(next)
  }, [])

  const ui = () => soundRef.current?.sfx('ui')

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
      setNpc(-1)
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

  const startJourney = () => {
    soundRef.current?.unlock()
    ui()
    if (!save.character) return setScreen('character')
    if (!save.seenStory) {
      setStoryPage(0)
      return setScreen('story')
    }
    loadLevel(Math.min(save.unlocked, LEVELS.length - 1))
  }

  const pickCharacter = (id: CharacterId) => {
    ui()
    const next = { ...save, character: id }
    persist(next)
    if (rendererRef.current) rendererRef.current.character = CHARACTERS[id]
    if (!next.seenStory) {
      setStoryPage(0)
      setScreen('story')
    } else setScreen('title')
  }

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

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {})
  }

  const showTouch = save.touch === 'on' || (save.touch === 'auto' && coarse)
  const totalFound = Object.values(save.best).reduce((a, b) => a + b.items.filter(Boolean).length, 0)

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} aria-label="Oyun alanı" />

      {screen === 'play' && (
        <>
          <Hud level={level} hud={hud} hero={hero.id} onPause={() => setScreen('pause')} />
          {(hint || npc >= 0) && (
            <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-10 flex justify-center px-4">
              {npc >= 0 && level.npcs[npc] ? (
                <div key={`n${npc}`} className="rise max-w-md border-2 border-gold/70 bg-ink/90 px-4 py-2.5">
                  <p className="font-display text-sm text-gold">{level.npcs[npc].name}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-cream">{level.npcs[npc].text}</p>
                </div>
              ) : (
                <p className="rise max-w-md border-2 border-[#c79a62] bg-[#3a2a1e]/90 px-4 py-2.5 text-center text-[13px] leading-snug text-cream">{hint}</p>
              )}
            </div>
          )}
          {quip && (
            <div key={quip.key} className="pointer-events-none absolute inset-x-0 top-[38%] z-10 flex justify-center px-4">
              <p className="rise font-display text-xl text-cream [text-shadow:0_2px_0_#120f1a,0_0_12px_#120f1a]">{quip.text}</p>
            </div>
          )}
          {toast && (
            <div key={toast.key} className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+160px)] z-10 flex justify-center px-4 sm:bottom-8">
              <div className="rise pixel-panel max-w-md px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.2em] text-gold">HATIRA · {toast.item.toLocaleUpperCase('tr')}</p>
                <p className="mt-1 font-display text-lg text-cream">{toast.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted">{toast.text}</p>
              </div>
            </div>
          )}
          {showTouch && inputRef.current && <TouchControls input={inputRef.current} big={save.controlSize === 'buyuk'} />}
        </>
      )}

      {screen === 'title' && (
        <Overlay>
          <div className="rise flex w-full max-w-3xl flex-col items-center gap-2 md:flex-row md:items-end md:gap-0">
            <div className="relative flex shrink-0 items-end justify-center md:mr-[-12px] md:w-[320px]">
              {save.character ? (
                <div className="portrait-frame w-[170px] sm:w-[260px]">
                  <Portrait id={hero.id} className="block w-full" />
                  <p className="portrait-tag">{hero.name}</p>
                </div>
              ) : (
                <div className="flex items-end">
                  <div className="portrait-frame w-[130px] rotate-[-3deg] sm:w-[190px]">
                    <Portrait id="uktun" className="block w-full" />
                    <p className="portrait-tag">Uktun</p>
                  </div>
                  <div className="portrait-frame -ml-6 w-[130px] rotate-[3deg] sm:w-[190px]">
                    <Portrait id="kerem" className="block w-full" />
                    <p className="portrait-tag">Kerem</p>
                  </div>
                </div>
              )}
            </div>
            <div className="pixel-panel w-full max-w-md p-6 sm:p-7">
              <p className="text-[11px] font-bold tracking-[0.3em] text-accent">ŞEHİR ŞEHİR ANADOLU</p>
              <h1 className="mt-2 font-display text-5xl leading-none text-cream sm:text-6xl">Memleket</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Dedenin yarım kalmış defterini tamamla. İstanbul’dan Bayburt’a altı şehir, her şehirde üç hatıra, her hatırada bir hikâye.
              </p>
              <div className="mt-5 grid gap-2.5">
                <button className="pixel-btn primary justify-center text-base" onClick={startJourney} autoFocus>
                  ▶ {save.unlocked > 0 ? `Devam Et: ${LEVELS[Math.min(save.unlocked, LEVELS.length - 1)].name}` : 'Yolculuğa Başla'}
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('map'))}>
                    Şehirler
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('character'))}>
                    Karakter
                  </button>
                  <button
                    className="pixel-btn justify-center"
                    onClick={() => {
                      ui()
                      setStoryPage(0)
                      setScreen('story')
                    }}
                  >
                    Hikâye
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('scores'))}>
                    Skorlar
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('controls'))}>
                    Kontroller
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => toggle('music')}>
                    Müzik {save.music ? 'Açık' : 'Kapalı'}
                  </button>
                </div>
              </div>
              {totalFound > 0 && (
                <p className="mt-4 text-[12px] text-muted">
                  Defterde {totalFound} / {LEVELS.length * 3} hatıra
                </p>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'character' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-2xl p-5 sm:p-6">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">YOL ARKADAŞIN</p>
            <h2 className="mt-1 font-display text-3xl text-cream sm:text-4xl">Karakterini Seç</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['uktun', 'kerem'] as const).map((id) => {
                const c = CHARACTERS[id]
                const on = save.character === id
                return (
                  <button
                    key={id}
                    onClick={() => pickCharacter(id)}
                    className={`group flex flex-col items-center border-2 bg-panel-2 p-4 text-left transition-colors duration-150 hover:border-accent-2 focus-visible:outline-2 focus-visible:outline-gold ${on ? 'border-gold' : 'border-line'}`}
                  >
                    <div className="relative w-full">
                      <div className="portrait-frame mx-auto w-[180px] sm:w-[220px]">
                        <Portrait id={id} className="block w-full" />
                      </div>
                      <div className="absolute -bottom-2 right-0 sm:right-2">
                        <CharacterPortrait c={c} scale={coarse ? 3 : 4} pose="run" />
                      </div>
                    </div>
                    <div className="mt-2 w-full">
                      <p className="flex items-baseline justify-between font-display text-2xl text-cream">
                        {c.name}
                        <span className="text-[12px] font-bold tracking-[0.18em] text-accent">{c.role.toLocaleUpperCase('tr')}</span>
                      </p>
                      <p className="mt-1 text-[13px] leading-snug text-muted">{c.bio}</p>
                      <p className="pixel-btn primary mt-3 w-full justify-center py-2 text-sm">{on ? 'Seçili' : `${c.name} ile Yola Çık`}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {save.character && (
              <button className="pixel-btn mt-3" onClick={() => setScreen('title')}>
                ← Geri
              </button>
            )}
          </div>
        </Overlay>
      )}

      {screen === 'story' && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-lg p-6" key={storyPage}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.3em] text-accent">MEMLEKET DEFTERİ</p>
              <p className="text-[11px] tabular-nums text-muted">
                {storyPage + 1} / {STORY.length}
              </p>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <div className="portrait-frame w-[110px] shrink-0 sm:w-[130px]">
                <Portrait id={hero.id} mood={storyPage === 0 ? 'calm' : 'smile'} className="block w-full" />
              </div>
              <Notebook page={storyPage} />
            </div>
            <h2 className="mt-3 font-display text-3xl text-cream">{STORY[storyPage].title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-cream/90">{fill(STORY[storyPage].text, hero.name)}</p>
            <div className="mt-5 flex gap-2.5">
              <button
                className="pixel-btn primary flex-1 justify-center"
                autoFocus
                onClick={() => {
                  ui()
                  if (storyPage + 1 < STORY.length) setStoryPage(storyPage + 1)
                  else {
                    persist({ ...save, seenStory: true })
                    loadLevel(Math.min(save.unlocked, LEVELS.length - 1))
                  }
                }}
              >
                {storyPage + 1 < STORY.length ? 'Devam ▶' : 'Yola Çık ▶'}
              </button>
              <button
                className="pixel-btn"
                onClick={() => {
                  persist({ ...save, seenStory: true })
                  loadLevel(Math.min(save.unlocked, LEVELS.length - 1))
                }}
              >
                Geç
              </button>
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
                          <span className="block font-display text-base leading-tight">{displayName(l)}</span>
                          <span className="block text-[11px] text-muted">
                            {l.subtitle} · {l.difficulty}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1 text-[11px] text-muted">
                        {locked ? 'Kilitli' : best ? formatTime(best.timeMs) : 'Yeni'}
                        {best && (
                          <span className="flex items-center gap-1.5">
                            <MedalBadge medal={medalFor(l, best.timeMs)} />
                            {found}/3
                          </span>
                        )}
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
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.25em] text-accent">
                  {String(levelIdx + 1).padStart(2, '0')} / {String(LEVELS.length).padStart(2, '0')} · {level.difficulty.toLocaleUpperCase('tr')}
                </p>
                <h2 className="font-display text-4xl leading-none text-cream">{level.name}</h2>
                <p className="text-sm text-muted">
                  {level.nickname ? <span className="text-accent-2">({level.nickname}) </span> : null}
                  {level.subtitle}
                </p>
              </div>
            </div>
            <blockquote className="mt-4 border-l-2 border-gold/70 bg-panel-2/60 px-3 py-2 text-[14px] italic leading-relaxed text-cream/90">
              <span className="mb-1 block text-[10px] font-bold not-italic tracking-[0.2em] text-gold">DEDENİN DEFTERİNDEN</span>“{level.note}”
            </blockquote>
            <p className="mt-3 text-sm leading-relaxed text-muted">{level.intro}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              <span>
                3 <strong className="text-gold">{level.item.toLocaleLowerCase('tr')}</strong> saklı
              </span>
              <span className="flex items-center gap-1">
                <MedalBadge medal="altin" /> {level.medals[0]} sn
              </span>
              <span className="flex items-center gap-1">
                <MedalBadge medal="gumus" /> {level.medals[1]} sn
              </span>
              <span className="flex items-center gap-1">
                <MedalBadge medal="bronz" /> {level.medals[2]} sn
              </span>
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
                ⚑ Bayraktan Dön
              </button>
              <button className="pixel-btn" onClick={() => loadLevel(levelIdx, 'play')}>
                ↺ Baştan Başla
              </button>
              <button className="pixel-btn" onClick={() => setScreen('map')}>
                ⌖ Şehirler
              </button>
              <button className="pixel-btn" onClick={() => toggle('sfx')}>
                Efekt {save.sfx ? 'Açık' : 'Kapalı'}
              </button>
              <button className="pixel-btn" onClick={() => toggle('music')}>
                Müzik {save.music ? 'Açık' : 'Kapalı'}
              </button>
              <button className="pixel-btn" onClick={() => persist({ ...save, touch: showTouch ? 'off' : 'on' })}>
                Dokunmatik {showTouch ? 'Açık' : 'Kapalı'}
              </button>
              <button className="pixel-btn" onClick={() => persist({ ...save, controlSize: save.controlSize === 'buyuk' ? 'normal' : 'buyuk' })}>
                Tuşlar {save.controlSize === 'buyuk' ? 'Büyük' : 'Normal'}
              </button>
              {canFull && (
                <button className="pixel-btn col-span-2 justify-center" onClick={fullscreen}>
                  ⛶ Tam Ekran
                </button>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'complete' && result && (
        <Complete
          levelIdx={levelIdx}
          result={result}
          save={save}
          heroName={hero.name}
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
              <h2 className="font-display text-3xl text-cream">Skor Tablosu</h2>
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
                <dt className="font-display text-gold">Klavye</dt>
                <dd />
                <dt className="text-muted">Yürü</dt>
                <dd>← → / A D</dd>
                <dt className="text-muted">Zıpla</dt>
                <dd>Boşluk / Z / ↑</dd>
                <dt className="text-muted">Atıl</dt>
                <dd>X / Shift (8 yön)</dd>
                <dt className="text-muted">İn</dt>
                <dd>↓ + Zıpla</dd>
                <dt className="text-muted">Mola</dt>
                <dd>Esc / P</dd>
                <dt className="text-muted">Bayrak</dt>
                <dd>R</dd>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-display text-gold">Dokunmatik</dt>
                <dd />
                <dt className="text-muted">Sol Yarı</dt>
                <dd>Joystick, nereye dokunursan orada</dd>
                <dt className="text-muted">Zıpla</dt>
                <dd>Uzun bas, daha yükseğe</dd>
                <dt className="text-muted">Atıl</dt>
                <dd>Joystick yönünde</dd>
                <dt className="font-display text-gold">Oyun Kolu</dt>
                <dd />
                <dt className="text-muted">A / Y</dt>
                <dd>Zıpla</dd>
                <dt className="text-muted">X / B / RT</dt>
                <dd>Atıl</dd>
              </dl>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              Duvara doğru basılı tutup zıplarsan aynı duvarda tırmanırsın. Atılma yere değince ya da bir düşmana basınca yenilenir: atkın kırmızıysa hazırsın, griyse
              harcadın. Şehir insanlarının yanına gidersen seninle konuşurlar.
            </p>
          </div>
        </Overlay>
      )}

      {screen === 'end' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <div className="flex justify-center">
              <div className="portrait-frame w-[180px]">
                <Portrait id={hero.id} className="block w-full" />
              </div>
            </div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">YOLCULUK TAMAM</p>
            <h2 className="mt-2 font-display text-4xl text-cream">{ENDING.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/90">{fill(ENDING.text, hero.name)}</p>
            <p className="mt-3 text-[12px] text-muted">
              {totalFound} / {LEVELS.length * 3} hatıra · Toplam en iyi süre {formatTime(Object.values(save.best).reduce((a, b) => a + b.timeMs, 0))}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={() => setScreen('map')}>
                Şehirler
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('scores')}>
                Skor Tablosu
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

/* ── Parçalar ───────────────────────────────────────────────── */

function Notebook({ page }: { page: number }) {
  return (
    <div className="relative min-h-[96px] flex-1 border-2 border-[#5a3c26] bg-[#e9dcc0] p-2 text-[#3a2a1e] shadow-[inset_0_-3px_0_rgba(0,0,0,0.15)]">
      <p className="font-display text-[13px] leading-none">Memleket</p>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <span key={l.id} className={`truncate border border-[#5a3c26]/40 px-1 text-[9px] leading-4 ${page >= 1 ? 'opacity-100' : 'opacity-40'}`}>
            {l.plate} {l.name}
          </span>
        ))}
      </div>
      {page === 2 && <p className="mt-1 text-[10px] italic">“Yolun sonu, başladığım yer.”</p>}
    </div>
  )
}

function Hud({ level, hud, hero, onPause }: { level: (typeof LEVELS)[number]; hud: { time: number; deaths: number; items: boolean[] }; hero: CharacterId; onPause: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}
    >
      <div className="flex min-w-0 items-center gap-2.5 bg-ink/55 py-1.5 pl-1.5 pr-2.5">
        <span className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-gold/70 bg-panel-2 min-[400px]:block">
          <Portrait id={hero} className="-mt-1 block w-[56px] -translate-x-[8px]" />
        </span>
        <span className="plate text-lg">
          <span>{level.plate}</span>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-base text-cream sm:text-lg">{level.name}</p>
          <p className="truncate text-[10px] font-bold tracking-[0.06em] text-muted">{(level.nickname ?? level.difficulty).toLocaleUpperCase('tr')}</p>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-3 bg-ink/55 px-3 py-2 text-sm font-semibold tabular-nums text-cream">
          <span className="flex gap-1" aria-label={`${hud.items.filter(Boolean).length} / 3 hatıra`}>
            {hud.items.map((v, i) => (
              <span key={i} className={`inline-block h-2.5 w-2.5 rotate-45 border ${v ? 'border-gold bg-gold' : 'border-muted/60'}`} />
            ))}
          </span>
          <span aria-label="Düşüş">✕ {hud.deaths}</span>
          <span aria-label="Süre" className="hidden min-[380px]:inline">
            {formatTime(hud.time * 1000).slice(0, -2)}
          </span>
        </div>
        <button className="pixel-btn h-11 w-11 justify-center p-0" aria-label="Mola" onClick={onPause}>
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
  heroName,
  onName,
  onNext,
  onRetry,
  onMap,
}: {
  levelIdx: number
  result: Result
  save: Save
  heroName: string
  onName: (n: string) => void
  onNext: () => void
  onRetry: () => void
  onMap: () => void
}) {
  const level = LEVELS[levelIdx]
  const [name, setName] = useState(save.name || heroName)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr] = useState('')
  const [refresh, setRefresh] = useState(0)
  const found = result.items.filter(Boolean).length
  const best = save.best[level.id]
  const medal = medalFor(level, result.timeMs)

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
          {medal ? <MedalBadge medal={medal} size="lg" /> : <span className="text-[12px] text-muted">Bronz için {level.medals[2]} sn</span>}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="grid content-start gap-2">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gold">DEFTERE EKLENEN HATIRALAR</p>
            {level.facts.map((f, i) => {
              const have = result.items[i] || best?.items[i]
              return (
                <div key={i} className={`border-2 px-3 py-2 ${have ? 'border-line bg-panel-2' : 'border-dashed border-line/70'}`}>
                  <p className="font-display text-sm text-cream">{have ? f.title : 'Boş Sayfa'}</p>
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
                  className="min-w-0 flex-1 border-2 border-line bg-ink px-3 py-2 text-base text-cream outline-none focus:border-gold"
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
            {levelIdx + 1 < LEVELS.length ? `▶ Sıradaki: ${displayName(LEVELS[levelIdx + 1])}` : '▶ Defteri Kapat'}
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
