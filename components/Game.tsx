'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import Portrait, { PortraitFace } from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { BossFigure, HeroFigure } from '@/components/Figures'
import CityBanner, { Toggle } from '@/components/CityBanner'
import NameForm from '@/components/NameForm'
import AuthForm from '@/components/AuthForm'
import { NpcDialog, SignHint } from '@/components/NpcDialog'
import { ItemIcon, Key, KeyHints } from '@/components/HudBits'
import About from '@/components/About'
import Bestiary from '@/components/Bestiary'
import Defter, { RUSH_NEEDS } from '@/components/Defter'
import { LangProvider, characterFor, endingFor, localize, makeT, storyFor, useLang, useT } from '@/lib/i18n'
import { MedalBadge, Overlay, displayName, haptic, medalFor } from '@/components/ui'
import { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { InputManager } from '@/game/input'
import { BOSSES } from '@/game/boss'
import { LEVELS, bossLevel } from '@/game/levels'
import { Renderer } from '@/game/render'
import { World } from '@/game/sim'
import { ENDING, STORY, fill } from '@/game/story'
import { emptyInput, type Fact } from '@/game/types'
import { shareQuery } from '@/lib/share'
import { CHALLENGE_TEXT, SCARVES, completes, dailyChallenge, scarfFor, weeklyChallenge, type Challenge } from '@/lib/extras'
import { FLAG_MOMENTS } from '@/game/flagMoments'
import { record } from '@/game/ghost'
import { loadGhost, saveGhost } from '@/lib/ghost'
import { defaultSave, formatTime, loadSave, needsMapNotice, restartJourney, writeSave, MAP_VERSION, type Player, type Save } from '@/lib/storage'

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
/** 1–99 arası sayıyı yazıyla, ilk harf büyük: 45 → "Kırk beş" */
const trCount = (n: number) => {
  const t = [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ')
  return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1)
}

/** zorluk rozeti: yeşilden kırmızıya */
const DIFF_TONE: Record<string, string> = {
  Kolay: 'border-[#6aa04a] text-[#a8d88a]',
  Orta: 'border-[#d9a441] text-[#f2c86a]',
  Zor: 'border-[#e8794a] text-[#f5a571]',
  'Çok Zor': 'border-[#d6403a] text-[#f08a80]',
}

type Screen = 'title' | 'about' | 'character' | 'name' | 'story' | 'map' | 'intro' | 'play' | 'pause' | 'complete' | 'scores' | 'controls' | 'end' | 'notebook' | 'rushEnd'

interface ScoreRow {
  name: string
  timeMs: number
  deaths: number
  items: number
  cities?: number
}

interface Result {
  timeMs: number
  deaths: number
  items: boolean[]
  newBest: boolean
  /** Rahat Mod'da bitirildi: skor tabloya yazılmaz */
  relaxed: boolean
  /** bu koşuyla tamamlanan görevler (Günün Şehri, Haftanın Görevi) */
  earned: string[]
}

/** Boss Rush: yenilmiş bekçiler arka arkaya; süre ve düşüş birikir */
interface Rush {
  order: number[]
  i: number
  timeMs: number
  deaths: number
}

const STEP = 1 / 120

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const inputRef = useRef<InputManager | null>(null)
  const soundRef = useRef<Sound | null>(null)
  const screenRef = useRef<Screen>('title')
  const relaxedRef = useRef(false)
  const ghostOnRef = useRef(true)
  /** bu koşunun hayalet kaydı */
  const ghostRecRef = useRef<number[]>([])
  const levelRef = useRef(0)
  const freezeRef = useRef(0)
  /** bu koşuda kaç kez dash atıldı (görevler için) */
  const dashRef = useRef(0)
  const rushRef = useRef<Rush | null>(null)

  const [screen, setScreenState] = useState<Screen>('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [save, setSave] = useState<Save>(defaultSave)
  const [hud, setHud] = useState({ time: 0, deaths: 0, items: [false, false, false], canDash: true, idle: true })
  const [cpToast, setCpToast] = useState<{ at: number; text: string } | null>(null)
  const idleRef = useRef(0)
  const [hint, setHint] = useState<string | null>(null)
  const [npc, setNpc] = useState<number>(-1)
  const [toast, setToast] = useState<(Fact & { item: string; key: number }) | null>(null)
  const [quip, setQuip] = useState<{ text: string; key: number } | null>(null)
  /** boss uyandı, henüz vurulmadı: nasıl yenileceği üç adımda görünür */
  const [coach, setCoach] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [rushResult, setRushResult] = useState<{ timeMs: number; deaths: number; bosses: number; best: boolean; relaxed: boolean } | null>(null)
  const [coarse, setCoarse] = useState(false)
  const [ready, setReady] = useState(false)
  const [storyPage, setStoryPage] = useState(0)
  const [canFull, setCanFull] = useState(false)
  const [titleCard, setTitleCard] = useState(0)
  const [resumeIdx, setResumeIdx] = useState(0)
  const [mapNotice, setMapNotice] = useState(false)
  const langRef = useRef<'tr' | 'en'>('tr')

  const setScreen = useCallback((s: Screen) => {
    screenRef.current = s
    setScreenState(s)
  }, [])

  const lang = save.lang ?? 'tr'
  const t = makeT(lang)
  const level = localize(LEVELS[levelIdx], lang)
  const hero = CHARACTERS[save.character ?? 'uktun']
  const beaten = LEVELS.filter((l) => save.bosses[l.id]).length
  /** seçilen atkı (al ise karakterin kendi atkısı: null) */
  const heroScarf = scarfFor(save.scarf).id === 'al' ? null : scarfFor(save.scarf)
  const charmCount = LEVELS.filter((l) => save.charms[l.id]).length
  const today = new Date()
  const challenges: [string, Challenge, boolean][] = [
    [t('GÜNÜN ŞEHRİ'), dailyChallenge(today, LEVELS, save.unlocked), false],
    [t('HAFTANIN GÖREVİ'), weeklyChallenge(today, LEVELS, save.unlocked), false],
  ]
  challenges[0][2] = save.daily.last === challenges[0][1].key
  challenges[1][2] = save.weekly.last === challenges[1][1].key

  /* ── kurulum ─────────────────────────────────────────────── */
  useEffect(() => {
    relaxedRef.current = save.relaxed
    ghostOnRef.current = save.ghost
    if (!save.ghost && rendererRef.current) rendererRef.current.ghostRun = null
  }, [save.relaxed, save.ghost])

  useEffect(() => {
    const s = loadSave()
    const qs = new URLSearchParams(location.search)
    const qc = qs.get('karakter')
    if ((qc === 'uktun' || qc === 'memo') && !s.character) {
      s.character = qc
      writeSave(s)
    }
    setSave(s)
    setMapNotice(needsMapNotice(s))
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
      // tuval durum çubuğunun altından başlar (iOS orayı karartıp bulanıklaştırır); ölçü tuvalin kendisinden
      renderer.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, Math.min(window.devicePixelRatio || 1, 3))
      if (worldRef.current) renderer.setLevel(worldRef.current)
    }
    fit()
    const qCity = LEVELS.findIndex((l) => l.id === qs.get('sehir'))
    const startIdx = qCity >= 0 && qCity <= s.unlocked ? qCity : Math.min(s.unlocked, LEVELS.length - 1)
    levelRef.current = startIdx
    setLevelIdx(startIdx)
    setResumeIdx(startIdx)
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
        // Rahat Mod: dünya %80 hızda akar
        acc += relaxedRef.current ? dt * 0.8 : dt
        // girdi yalnızca en az bir adım koşacaksa okunur: 120/144 Hz ekranda adımsız karede basış tüketilip kaybolmasın
        if (acc >= STEP) {
          const inp = input.sample()
          const rest = { ...inp, jumpPressed: false, dashPressed: false }
          let first = true
          while (acc >= STEP) {
            renderer.capture(w)
            w.step(STEP, first ? inp : rest)
            first = false
            acc -= STEP
          }
        }
        if (w.started && !w.complete) record(ghostRecRef.current, w)
        for (const e of w.events) {
          renderer.handle(e, w)
          soundRef.current?.sfx(e.type)
          switch (e.type) {
            case 'collect': {
              const lv = localize(w.level, langRef.current)
              setToast({ ...lv.facts[e.index], item: lv.item, key: Date.now() })
              haptic([12, 40, 12])
              break
            }
            case 'stomp':
              freezeRef.current = 0.06
              haptic(15)
              break
            case 'death': {
              setCoach(false)
              haptic(40)
              const q = localize(w.level, langRef.current).quips
              if (Math.random() < 0.4) setQuip({ text: q[Math.floor(Math.random() * q.length)], key: Date.now() })
              break
            }
            case 'checkpoint': {
              haptic(10)
              const moments = FLAG_MOMENTS[w.level.city]
              const m = moments[e.index % moments.length]
              setCpToast({ at: Date.now(), text: langRef.current === 'en' ? m[1] : m[0] })
              break
            }
            case 'stamp': {
              haptic([30, 40, 30, 40, 60])
              const lv = localize(w.level, langRef.current)
              setToast({ ...lv.secret, item: makeT(langRef.current)('Gizli Pul'), key: Date.now() })
              setSave((prev) => {
                const next = { ...prev, stamps: { ...prev.stamps, [lv.id]: true } }
                writeSave(next)
                return next
              })
              break
            }
            case 'charm': {
              haptic([20, 30, 20, 30, 50])
              const tr = makeT(langRef.current)
              setToast({ title: tr('Nazar Boncuğu'), text: tr('Gezgin’in çantasından düşmüş. Her şehirde bir tane saklı; bulana nazar değmez.'), item: tr('Gizli Bulgu'), key: Date.now() })
              setSave((prev) => {
                const next = { ...prev, charms: { ...prev.charms, [w.level.id]: true } }
                writeSave(next)
                return next
              })
              break
            }
            case 'bossWake':
              setCoach(true)
              haptic([30, 60, 30])
              break
            case 'bossHit':
              setCoach(false)
              freezeRef.current = 0.09
              haptic([25, 30, 45])
              break
            case 'bossDown':
              freezeRef.current = 0.14
              haptic([40, 50, 40, 50, 90])
              setSave((prev) => {
                if (prev.bosses[w.level.id]) return prev
                const next = { ...prev, bosses: { ...prev.bosses, [w.level.id]: true } }
                writeSave(next)
                return next
              })
              break
            case 'warp':
              haptic(18)
              break
            case 'dash':
              dashRef.current++
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
          const moving = Math.abs(w.player.vx) > 5 || !w.player.grounded
          idleRef.current = moving ? 0 : idleRef.current + 0.1
          setHud({ time: w.time, deaths: w.deaths, items: w.pickups.map((p) => p.taken), canDash: w.player.canDash, idle: w.time < 6 || idleRef.current > 1.5 })
          setHint(w.nearSign >= 0 ? (localize(w.level, langRef.current).hints[w.nearSign] ?? null) : null)
          setNpc(w.nearNpc)
        }
      } else if (sc === 'title' || sc === 'map' || sc === 'scores' || sc === 'controls' || sc === 'character' || sc === 'story' || sc === 'name' || sc === 'notebook') {
        w.step(dt, emptyInput())
        w.events.length = 0
      } else {
        acc = 0
      }
      // adımlar arası ara değerleme yalnız oyun akarken: menüde dünya değişken adımla ilerler
      renderer.render(w, dt, sc === 'play' ? acc / STEP : 1)
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
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!quip) return
    const id = setTimeout(() => setQuip(null), 1400)
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
      const rush = rushRef.current
      const w = new World(rush ? bossLevel(LEVELS[idx]) : LEVELS[idx])
      worldRef.current = w
      ghostRecRef.current = []
      dashRef.current = 0
      if (rendererRef.current) {
        rendererRef.current.setLevel(w)
        rendererRef.current.ghostRun = !rush && ghostOnRef.current ? loadGhost(LEVELS[idx].id) : null
      }
      inputRef.current?.clear()
      setHud({ time: 0, deaths: 0, items: [false, false, false], canDash: true, idle: true })
      setToast(null)
      setHint(null)
      setNpc(-1)
      setCoach(false)
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
    setTitleCard(Date.now())
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setScreen('play')
  }, [setScreen])

  /** Boss Rush: yenilmiş bekçiler şehir sırasıyla, arka arkaya. */
  const startRush = () => {
    const order = LEVELS.map((l, i) => (save.bosses[l.id] ? i : -1)).filter((i) => i >= 0)
    if (order.length < RUSH_NEEDS) return
    soundRef.current?.unlock()
    ui()
    rushRef.current = { order, i: 0, timeMs: 0, deaths: 0 }
    loadLevel(order[0], 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t('Boss {i}/{n}', { i: 1, n: order.length }) })
  }

  // menüye dönünce koşu biter
  useEffect(() => {
    if (screen === 'map' || screen === 'title') rushRef.current = null
  }, [screen])

  // atkı rengi: karakterin kendi atkısı (al) dışındaki seçim çizime bildirilir
  useEffect(() => {
    if (!rendererRef.current) return
    const sc = scarfFor(save.scarf)
    rendererRef.current.scarf = sc.id === 'al' ? null : { color: sc.color, shade: sc.shade }
  }, [save.scarf, ready])

  const startJourney = () => {
    soundRef.current?.unlock()
    ui()
    if (!save.character) return setScreen('character')
    if (!save.player && !save.skippedName) return setScreen('name')
    if (!save.seenStory) {
      setStoryPage(0)
      return setScreen('story')
    }
    loadLevel(resumeIdx)
  }

  const pickCharacter = (id: CharacterId) => {
    ui()
    const next = { ...save, character: id }
    persist(next)
    if (rendererRef.current) rendererRef.current.character = CHARACTERS[id]
    if (!next.player && !next.skippedName) setScreen('name')
    else if (!next.seenStory) {
      setStoryPage(0)
      setScreen('story')
    } else setScreen('title')
  }

  const signOut = async () => {
    const p = save.player
    persist({ ...save, player: null, skippedName: true })
    setScreen('title')
    if (p) await fetch('/api/players', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, token: p.token }) }).catch(() => {})
  }

  const afterName = (next: Save) => {
    persist(next)
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
    const rush = rushRef.current
    if (rush) {
      rush.timeMs += timeMs
      rush.deaths += w.deaths
      rush.i++
      if (rush.i < rush.order.length) {
        loadLevel(rush.order[rush.i], 'play')
        beginPlay()
        setCpToast({ at: Date.now() + 1, text: makeT(langRef.current)('Boss {i}/{n}', { i: rush.i + 1, n: rush.order.length }) })
        return
      }
      rushRef.current = null
      const relaxed = relaxedRef.current
      const total = { timeMs: rush.timeMs, deaths: rush.deaths, bosses: rush.order.length }
      setSave((prev) => {
        const old = prev.rush
        const best = !relaxed && (!old || total.bosses > old.bosses || (total.bosses === old.bosses && total.timeMs < old.timeMs))
        setRushResult({ ...total, best, relaxed })
        if (!best) return prev
        const next = { ...prev, rush: { timeMs: total.timeMs, bosses: total.bosses } }
        writeSave(next)
        return next
      })
      setScreen('rushEnd')
      return
    }
    const items = w.pickups.map((p) => p.taken)
    const run = { timeMs, deaths: w.deaths, dashes: dashRef.current, items, relaxed: relaxedRef.current }
    const now = new Date()
    setSave((prev) => {
      const best = prev.best[w.level.id]
      const newBest = !best || !!best.stale || timeMs < best.timeMs
      if (newBest) saveGhost(w.level.id, { hero: prev.character ?? 'uktun', data: ghostRecRef.current })
      const mergedItems = items.map((v, i) => v || !!best?.items[i])
      const earned: string[] = []
      const day = dailyChallenge(now, LEVELS, prev.unlocked)
      const week = weeklyChallenge(now, LEVELS, prev.unlocked)
      const daily = prev.daily.last !== day.key && completes(day, w.level, run) ? { last: day.key, count: prev.daily.count + 1 } : prev.daily
      const weekly = prev.weekly.last !== week.key && completes(week, w.level, run) ? { last: week.key, count: prev.weekly.count + 1 } : prev.weekly
      if (daily !== prev.daily) earned.push('Günün Şehri Tamam')
      if (weekly !== prev.weekly) earned.push('Haftanın Görevi Tamam')
      const next: Save = {
        ...prev,
        daily,
        weekly,
        unlocked: Math.max(prev.unlocked, Math.min(idx + 1, LEVELS.length - 1)),
        best: {
          ...prev.best,
          [w.level.id]: newBest ? { timeMs, deaths: w.deaths, items: mergedItems } : { ...best, items: mergedItems },
        },
      }
      writeSave(next)
      setResumeIdx(next.unlocked)
      setResult({ timeMs, deaths: w.deaths, items, newBest, relaxed: relaxedRef.current, earned })
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

  langRef.current = save.lang ?? 'tr'
  useEffect(() => {
    document.documentElement.lang = save.lang ?? 'tr'
    if (rendererRef.current) rendererRef.current.lang = save.lang ?? 'tr'
  }, [save.lang, ready])

  const showTouch = save.touch === 'on' || (save.touch === 'auto' && coarse)
  const totalFound = Object.values(save.best).reduce((a, b) => a + b.items.filter(Boolean).length, 0)

  return (
    <LangProvider value={lang}>
    <div className="game-root">
      <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 w-full" style={{ imageRendering: 'pixelated', top: 'env(safe-area-inset-top)', height: 'calc(100% - env(safe-area-inset-top))' }} aria-label={t("Oyun Alanı")} />

      {screen === 'play' && (
        <>
          <Hud level={level} hud={hud} hero={hero.id} scarf={heroScarf} onPause={() => setScreen('pause')} />
          {titleCard > 0 && hud.time < 0.05 && (
            <div key={titleCard} className="title-card pointer-events-none absolute inset-x-0 top-[30%] z-10 flex flex-col items-center [@media(max-height:500px)]:top-[12%]">
              <div className="kilim w-[min(520px,80vw)]" />
              <p className="mt-3 text-[12px] font-bold tracking-[0.4em] text-accent-2 [text-shadow:0_2px_0_#120f1a]">
                {String(level.plate).padStart(2, '0')} · {level.subtitle.toLocaleUpperCase(lang)}
              </p>
              <p className="font-display text-6xl text-cream [text-shadow:0_4px_0_#120f1a] sm:text-7xl [@media(max-height:500px)]:text-5xl">{level.name}</p>
              <p className="mt-1 text-[13px] text-cream/80 [text-shadow:0_2px_0_#120f1a]">{t("Hareket Edince Süre Başlar")}</p>
              <div className="kilim mt-3 w-[min(520px,80vw)]" />
            </div>
          )}
          {npc >= 0 && level.npcs[npc] ? <NpcDialog key={`npc-${levelIdx}-${npc}`} npc={level.npcs[npc]} touch={showTouch} /> : hint ? <SignHint key={hint} text={hint} touch={showTouch} /> : null}
          {quip && (
            <div key={quip.key} className="pointer-events-none absolute inset-x-0 top-[38%] z-10 flex justify-center px-4">
              <p className="rise font-display text-base text-cream/90 [text-shadow:0_2px_0_#120f1a,0_0_12px_#120f1a] sm:text-xl">{quip.text}</p>
            </div>
          )}
          {toast && (
            <div key={toast.key} className="toast-strip pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+62px)] z-10 flex justify-center px-4">
              <p className="flex max-w-[92vw] items-center gap-2 bg-ink/85 py-1.5 pl-1.5 pr-3 text-[12px] text-cream [box-shadow:0_-2px_0_0_#d9a441,0_2px_0_0_#d9a441,-2px_0_0_0_#d9a441,2px_0_0_0_#d9a441] sm:text-[13px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a2438]">
                  <ItemIcon city={level.city} taken size={20} />
                </span>
                <span className="truncate">
                  <strong className="font-display text-gold">{toast.item === 'Gizli Pul' ? 'Gizli Pul Bulundu!' : `${toast.item} Bulundu`}</strong>
                  <span className="text-muted"> · {toast.title}</span>
                </span>
              </p>
            </div>
          )}
          {coach && (
            <div className="rise pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+112px)] z-10 flex justify-center px-3 [@media(max-height:500px)]:top-[calc(env(safe-area-inset-top)+76px)]">
              <ol className="flex max-w-[96vw] items-stretch gap-1.5 text-[12px] font-bold text-cream sm:gap-2 sm:text-[13px]">
                {[t('İşareti Gör'), t('Saldırıdan Kaç'), t('Yorulunca Üstüne Bas')].map((s, i) => (
                  <li key={s} className={`flex items-center gap-1.5 bg-ink/85 px-2 py-1.5 [box-shadow:0_-2px_0_0_#3d3550,0_2px_0_0_#3d3550,-2px_0_0_0_#3d3550,2px_0_0_0_#3d3550] ${i === 2 ? 'text-gold' : ''}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center text-[11px] ${i === 2 ? 'bg-gold text-ink' : 'bg-accent text-ink'}`}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {cpToast && Date.now() - cpToast.at < 3200 && (
            <div key={cpToast.at} className="rise pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-10 flex justify-center px-4">
              <div className="max-w-[min(92vw,420px)] bg-ink/85 px-3.5 py-2 text-center [box-shadow:0_-2px_0_0_#e30a17,0_2px_0_0_#e30a17,-2px_0_0_0_#e30a17,2px_0_0_0_#e30a17]">
                <p className="flex items-center justify-center gap-2 font-display text-sm text-cream">
                  <span className="text-[#e30a17]">⚑</span> {t("Checkpoint")}
                </p>
                <p className="mt-0.5 text-[12px] italic leading-snug text-gold [text-wrap:balance]">{cpToast.text}</p>
              </div>
            </div>
          )}
          {showTouch && inputRef.current && <TouchControls input={inputRef.current} big={save.controlSize === 'buyuk'} canDash={hud.canDash} />}
          {!showTouch && save.keyHints && <KeyHints canDash={hud.canDash} idle={hud.idle} />}
        </>
      )}

      {screen === 'title' && mapNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120f1a]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="harita-notu">
          <div className="rise pixel-panel w-full max-w-md p-5 sm:p-6">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("DEFTERE YENİ SAYFALAR")}</p>
            <h2 id="harita-notu" className="mt-1 font-display text-3xl text-cream">{t("Haritalar Yenilendi")}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/85">
              {t('Yola altı şehir daha katıldı: Edirne, Bursa, Antalya, Şanlıurfa, Van ve Erzurum. Şehirlerin sırası değişti; her şehrin sonunda bir bulmaca, saklı bir nazar boncuğu ve şehrin boss’u var. Skor tablosu yeni haritalarla baştan başladı.')}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {t('Yeni haritaları baştan yaşamak istersen yolculuğa İstanbul’dan başla. Rekorların ve pulların sıfırlanır; adın, karakterin ve ayarların kalır.')}
            </p>
            <div className="mt-5 grid gap-2.5">
              <button
                className="pixel-btn primary justify-center text-base"
                autoFocus
                onClick={() => {
                  ui()
                  const n = restartJourney(save)
                  persist(n)
                  setResumeIdx(0)
                  loadLevel(0, 'title')
                  setMapNotice(false)
                }}
              >
                {t("▶ Baştan Başla")}
              </button>
              <button
                className="pixel-btn justify-center"
                onClick={() => {
                  ui()
                  persist({ ...save, mapVersion: MAP_VERSION, migrated: false })
                  setMapNotice(false)
                }}
              >
                {t("Kaldığım Yerden Devam Et")}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <Overlay>
          <div className="rise flex w-full max-w-3xl flex-col items-center gap-0 md:flex-row md:items-center [@media(max-height:500px)_and_(min-width:560px)]:flex-row [@media(max-height:500px)_and_(min-width:560px)]:items-start">
            {/* yatay telefonda polaroid yana geçer: menü düğmeleri ekranın altına itilmesin */}
            <div className="relative h-[170px] w-full max-w-[320px] shrink-0 sm:h-[300px] md:mr-[-28px] md:h-[360px] md:w-[320px] [@media(max-height:500px)_and_(min-width:560px)]:mr-[-20px] [@media(max-height:500px)_and_(min-width:560px)]:h-[240px] [@media(max-height:500px)_and_(min-width:560px)]:w-[190px]">
              {save.character ? (
                <figure className="polaroid absolute left-1/2 top-3 w-[118px] -translate-x-1/2 rotate-[-4deg] sm:w-[200px] md:top-10 md:w-[220px] [@media(max-height:500px)_and_(min-width:560px)]:top-8 [@media(max-height:500px)_and_(min-width:560px)]:w-[150px]">
                  <span className="tape" />
                  <HeroFigure look={hero.id} scarf={heroScarf} className="block aspect-[64/76] w-full" />
                  <figcaption>{hero.name}</figcaption>
                </figure>
              ) : (
                <>
                  <figure className="polaroid absolute left-[8%] top-4 w-[118px] rotate-[-7deg] sm:w-[170px] md:left-0 md:top-12 md:w-[170px] [@media(max-height:500px)_and_(min-width:560px)]:left-0 [@media(max-height:500px)_and_(min-width:560px)]:top-6 [@media(max-height:500px)_and_(min-width:560px)]:w-[120px]">
                    <span className="tape" />
                    <Portrait id="uktun" className="w-full" />
                    <figcaption>Uktun</figcaption>
                  </figure>
                  <figure className="polaroid absolute right-[8%] top-0 w-[118px] rotate-[6deg] sm:w-[170px] md:right-6 md:top-2 md:w-[170px] [@media(max-height:500px)_and_(min-width:560px)]:right-0 [@media(max-height:500px)_and_(min-width:560px)]:top-24 [@media(max-height:500px)_and_(min-width:560px)]:w-[120px]">
                    <span className="tape" />
                    <Portrait id="memo" className="w-full" />
                    <figcaption>Memo</figcaption>
                  </figure>
                </>
              )}
            </div>
            <div className="pixel-panel relative z-10 w-full max-w-md overflow-hidden px-6 pb-6 sm:px-7">
              <div className="relative -mx-7 -mt-[calc(14px+1.25rem)] mb-4 h-[120px] overflow-hidden [@media(max-height:500px)]:h-[88px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sehirler/istanbul.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_75%]" style={{ imageRendering: 'pixelated' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e1a29]/20 to-[#1e1a29]" />
                <div className="kilim absolute inset-x-0 top-0" />
                <div className="absolute bottom-1 left-7 flex items-end gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-emblem.png" width={56} height={56} alt="" style={{ imageRendering: 'pixelated' }} className="mb-1 drop-shadow-[0_3px_0_#120f1a]" />
                  <h1 className="font-display text-5xl leading-none text-cream [text-shadow:0_4px_0_#120f1a] sm:text-6xl">Sek-Sek</h1>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-cream/85">{t("Gezgin’in yarım kalmış defterini tamamla.")}</p>
              <p className="text-[14px] leading-relaxed text-muted">{lang === 'en' ? `${LEVELS.length} cities. ${LEVELS.length * 3} keepsakes. One journey.` : `${trCount(LEVELS.length)} şehir. ${trCount(LEVELS.length * 3)} hatıra. Tek yolculuk.`}</p>
              <div className="mt-5 grid gap-2.5">
                <button className="pixel-btn primary justify-center text-base" onClick={startJourney} autoFocus>
                  ▶ {save.unlocked > 0 || resumeIdx > 0 ? t('Devam Et: {city}', { city: LEVELS[resumeIdx].name }) : t('Yolculuğa Başla')}
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('map'))}>
                    {t("Şehirler")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('notebook'))}>
                    {t("Defter")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('character'))}>
                    {t("Karakter")}
                  </button>
                  <button className="pixel-btn justify-center" disabled={beaten < RUSH_NEEDS} title={beaten < RUSH_NEEDS ? t('Önce {n} Boss Yen', { n: RUSH_NEEDS }) : undefined} onClick={startRush}>
                    {t("Boss Rush")}
                  </button>
                  <button
                    className="pixel-btn justify-center"
                    onClick={() => {
                      ui()
                      setStoryPage(0)
                      setScreen('story')
                    }}
                  >
                    {t("Hikâye")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('scores'))}>
                    {t("Skorlar")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('controls'))}>
                    {t("Kontroller")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => toggle('music')}>
                    {t('Müzik')} {save.music ? t('Açık') : t('Kapalı')}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 border-t-2 border-line pt-3 text-[12px] text-muted">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <button className="flex items-center gap-1.5 text-left underline-offset-4 hover:text-cream hover:underline" onClick={() => (ui(), setScreen('name'))}>
                    <span className="text-gold">◆</span>
                    {save.player ? (
                      <span>
                        {t("Hesap:")} <strong className="font-semibold text-cream">{save.player.name}</strong>
                      </span>
                    ) : (
                      t('Üye Ol ya da Giriş Yap')
                    )}
                  </button>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span>
                      {t("Hatıra")} <strong className="text-cream">{totalFound}</strong>/{LEVELS.length * 3}
                    </span>
                    <span>
                      {t("Gizli Pul")} <strong className="text-cream">{Object.values(save.stamps ?? {}).filter(Boolean).length}</strong>/{LEVELS.length}
                    </span>
                    <span>
                      {t("Nazar")} <strong className="text-cream">{Object.values(save.charms ?? {}).filter(Boolean).length}</strong>/{LEVELS.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button className="-my-1.5 justify-self-start py-1.5 text-left underline-offset-4 hover:text-cream hover:underline" onClick={() => (ui(), setScreen('about'))}>
                    {t('Oyun Hakkında →')}
                  </button>
                  <span className="flex items-center gap-1" role="group" aria-label={t('Dil')}>
                    {(['tr', 'en'] as const).map((l) => (
                      <button
                        key={l}
                        aria-pressed={lang === l}
                        className={`min-h-[32px] min-w-[40px] px-2.5 py-1.5 font-bold tracking-wider ${lang === l ? 'bg-gold text-ink' : 'text-muted hover:text-cream'}`}
                        onClick={() => (ui(), persist({ ...save, lang: l }))}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'character' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-2xl p-5 sm:p-6">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("YOL ARKADAŞIN")}</p>
            <h2 className="mt-1 font-display text-3xl text-cream sm:text-4xl">{t("Karakterini Seç")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(['uktun', 'memo'] as const).map((id) => {
                const c = CHARACTERS[id]
                const on = save.character === id
                return (
                  <button
                    key={id}
                    onClick={() => pickCharacter(id)}
                    className={`group flex flex-col items-center border-2 bg-panel-2 p-4 text-left transition-colors duration-150 hover:border-accent-2 focus-visible:outline-2 focus-visible:outline-gold ${on ? 'border-gold' : 'border-line'}`}
                  >
                    <div className="portrait-frame mx-auto w-[180px] sm:w-[220px]">
                      <Portrait id={id} scarf={heroScarf} className="block w-full" />
                    </div>
                    <div className="mt-2 w-full">
                      <p className="flex items-baseline justify-between font-display text-2xl text-cream">
                        {c.name}
                        <span className="text-[12px] font-bold tracking-[0.18em] text-accent">{(characterFor(lang, id)?.role ?? c.role).toLocaleUpperCase(lang)}</span>
                      </p>
                      <p className="mt-1 text-[13px] leading-snug text-muted">{characterFor(lang, id)?.bio ?? c.bio}</p>
                      <p className="pixel-btn primary mt-3 w-full justify-center py-2 text-sm">{on ? t('Seçili') : t('{name} ile Yola Çık', { name: c.name })}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
              {t("ATKI RENGİ")} <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SCARVES.map((sc) => {
                const open = charmCount >= sc.need
                const on = scarfFor(save.scarf).id === sc.id
                return (
                  <button
                    key={sc.id}
                    disabled={!open}
                    aria-pressed={on}
                    onClick={() => (ui(), persist({ ...save, scarf: sc.id }))}
                    title={open ? undefined : t('{n} nazar boncuğu bulunca açılır', { n: sc.need })}
                    className={`flex items-center gap-2 border-2 bg-panel-2 px-2.5 py-1.5 text-[12px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-gold ${on ? 'border-gold text-cream' : 'border-line text-muted hover:border-accent-2'} ${open ? '' : 'opacity-45'}`}
                  >
                    <span className="h-4 w-4 border-2 border-ink" style={{ background: `linear-gradient(135deg, ${sc.color} 55%, ${sc.shade} 55%)` }} />
                    {lang === 'en' ? sc.nameEn : sc.name}
                    {!open && <span className="tabular-nums">· {charmCount}/{sc.need}</span>}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[12px] text-muted">{t("Yeni renkler, şehirlerde saklı nazar boncuklarını buldukça açılır.")}</p>
            {save.character && (
              <button className="pixel-btn mt-3" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            )}
          </div>
        </Overlay>
      )}

      {screen === 'name' && (
        <Overlay>
          <div className="rise pixel-panel max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto px-6 pb-6">
            <div className="flex items-end gap-4">
              <figure className="polaroid relative w-[96px] shrink-0 rotate-[-5deg]">
                <span className="tape" />
                <Portrait id={hero.id} scarf={heroScarf} className="w-full" />
                <figcaption>{hero.short}</figcaption>
              </figure>
              <div className="min-w-0 pb-2">
                <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{save.player ? t('HESABIM') : t('DEFTERİN SAHİBİ')}</p>
                <h2 className="mt-1 font-display text-3xl leading-tight text-cream">{save.player ? save.player.name : t('Yolcu Hesabı')}</h2>
                <p className="mt-1 text-[13px] leading-snug text-muted">
                  {save.player ? t('Bu cihazda girişlisin; tekrar giriş yapman gerekmez.') : t('Üye ol ya da giriş yap: skorların tabloya yazılır, her cihazdan devam edersin.')}
                </p>
              </div>
            </div>
            <div className="mt-5">
              {save.player ? (
                <div className="grid gap-4">
                  <a href={`/oyuncu/${encodeURIComponent(save.player.name)}`} className="pixel-btn primary justify-center">
                    {t('Kullanıcı Sayfamı Aç')}
                  </a>
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold tracking-[0.2em] text-muted">{t('ADINI DEĞİŞTİR')}</p>
                    <NameForm
                      player={save.player}
                      onDone={(p: Player) => {
                        ui()
                        persist({ ...save, player: p })
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-line pt-3">
                    <button className="pixel-btn" onClick={() => setScreen('title')}>
                      {t('← Geri')}
                    </button>
                    <button className="text-[12px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={() => void signOut()}>
                      {t('Çıkış Yap')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <AuthForm
                    suggestion={hero.short}
                    onDone={(p: Player) => {
                      ui()
                      afterName({ ...save, player: p, skippedName: false })
                    }}
                  />
                  <button className="mt-3 text-[12px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={() => afterName({ ...save, skippedName: true })}>
                    {t('Şimdilik Geç')}
                  </button>
                  <p className="mt-1 text-[11px] text-muted">{t('Hesapsız da oynarsın; skorların yalnız bu cihazda kalır. Sonra menüden üye olabilirsin.')}</p>
                </>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'story' && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-lg p-6" key={storyPage}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("MEMLEKET DEFTERİ")}</p>
              <p className="text-[11px] tabular-nums text-muted">
                {storyPage + 1} / {STORY.length}
              </p>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <div className="portrait-frame w-[110px] shrink-0 sm:w-[130px]">
                <Portrait id={hero.id} scarf={heroScarf} className="block w-full" />
              </div>
              <Notebook page={storyPage} />
            </div>
            <h2 className="mt-3 font-display text-3xl text-cream">{(storyFor(lang) ?? STORY)[storyPage].title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-cream/90">{fill((storyFor(lang) ?? STORY)[storyPage].text, hero.short)}</p>
            <div className="mt-5 flex gap-2.5">
              <button
                className="pixel-btn primary flex-1 justify-center"
                autoFocus
                onClick={() => {
                  ui()
                  if (storyPage + 1 < STORY.length) setStoryPage(storyPage + 1)
                  else {
                    persist({ ...save, seenStory: true })
                    loadLevel(resumeIdx)
                  }
                }}
              >
                {storyPage + 1 < STORY.length ? t('Devam ▶') : t('Yola Çık ▶')}
              </button>
              <button
                className="pixel-btn"
                onClick={() => {
                  persist({ ...save, seenStory: true })
                  loadLevel(resumeIdx)
                }}
              >
                {t("Geç")}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'map' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-cream">{t("Şehirler")}</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {challenges.map(([title, ch, done]) => {
                const i = LEVELS.findIndex((l) => l.id === ch.levelId)
                return (
                  <button key={title} className={`pixel-btn flex-col items-start gap-0.5 px-3 py-2 text-left ${done ? 'opacity-70' : ''}`} onClick={() => loadLevel(i)}>
                    <span className="flex w-full items-center justify-between gap-2 text-[11px] font-bold tracking-[0.18em] text-gold">
                      {title}
                      {done && <span className="text-[#7ad88a]">✓ {t('Tamam')}</span>}
                    </span>
                    <span className="font-display text-base leading-tight">{displayName(LEVELS[i])}</span>
                    <span className="text-[12px] leading-snug text-muted">{ch.kinds.map((k) => t(CHALLENGE_TEXT[k])).join(' · ')}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3">
              <TurkeyMap unlocked={save.unlocked} selected={levelIdx} onSelect={(i) => loadLevel(i)} />
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {LEVELS.map((l, i) => {
                const locked = i > save.unlocked
                const best = save.best[l.id]
                const found = best?.items.filter(Boolean).length ?? 0
                return (
                  <li key={l.id}>
                    <button className="pixel-btn w-full items-stretch gap-0 overflow-hidden p-0 text-left" disabled={locked} onClick={() => loadLevel(i)}>
                      <span className="relative w-[92px] shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/sehirler/${l.id}.webp`} alt="" className={`h-full w-full object-cover ${locked ? 'opacity-30 grayscale' : ''}`} style={{ imageRendering: 'pixelated' }} />
                        <span className="plate absolute bottom-1 left-1 text-[11px]">
                          <span>{String(l.plate).padStart(2, '0')}</span>
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block font-display text-base leading-tight [overflow-wrap:anywhere]">{displayName(l)}</span>
                          <span className="block text-[11px] leading-snug text-muted">
                            {localize(l, lang).subtitle}
                            <span className={`ml-2 inline-block border px-1.5 py-px align-middle text-[11px] font-bold ${DIFF_TONE[l.difficulty]}`}>{t(l.difficulty)}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-muted">
                          {locked ? t('Kilitli') : best && !best.stale ? formatTime(best.timeMs) : best ? t('Yeni Yol') : t('Yeni')}
                          {best && (
                            <span className="flex items-center gap-1.5">
                              {!best.stale && <MedalBadge medal={medalFor(l, best.timeMs)} />}
                              {found}/3
                            </span>
                          )}
                        </span>
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
          <div className="rise pixel-panel w-full max-w-md overflow-clip px-6">
            <CityBanner level={level} index={levelIdx} total={LEVELS.length} height={150} />
            <p className="-mt-1 text-sm text-muted">{level.subtitle}</p>
            <figure className="notebook mt-4 rotate-[-0.6deg] px-4 py-3">
              <figcaption className="text-[11px] font-bold tracking-[0.22em] text-[#8a3a24]">{t("GEZGİN’İN DEFTERİNDEN")}</figcaption>
              <blockquote className="mt-1 text-[14px] italic leading-relaxed">“{level.note}”</blockquote>
            </figure>
            <p className="mt-4 text-[14px] leading-relaxed text-cream/85">{level.intro}</p>
            <Bestiary level={level} />
            <div className="mt-4 flex items-center gap-3 border-2 border-line bg-ink/40 px-3 py-2">
              <BossFigure city={level.city} className="h-[64px] w-[72px] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.2em] text-accent-2">{t('ŞEHRİN BOSS’U')}</p>
                <p className="font-display text-xl leading-tight text-cream">{lang === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">{t('İşaretini bekle, yorulunca üstüne bas.')}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="border-2 border-line bg-ink/40 px-1 py-2">
                <p className="font-display text-lg leading-none text-gold">3</p>
                <p className="mt-1 truncate text-[11px] text-muted">{level.item}</p>
              </div>
              {(['altin', 'gumus', 'bronz'] as const).map((m, k) => (
                <div key={m} className="border-2 border-line bg-ink/40 px-1 py-2">
                  <p className="flex items-center justify-center gap-1.5 font-display text-lg leading-none text-cream">
                    <MedalBadge medal={m} />
                    {level.medals[k]}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">{t("Saniye")}</p>
                </div>
              ))}
            </div>
            {!showTouch && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
                <span className="flex items-center gap-1.5"><Key>←</Key><Key>→</Key> {t("Yürü")}</span>
                <span className="flex items-center gap-1.5"><Key>↑</Key> {t("Zıpla")}</span>
                <span className="flex items-center gap-1.5 text-gold"><Key wide>Space</Key> {t("Dash")}</span>
              </div>
            )}
            <div className="sticky bottom-0 z-10 -mx-6 mt-5 grid grid-cols-[1fr_auto] gap-3 border-t-2 border-line bg-[#1e1a29]/95 px-6 py-3 [padding-bottom:max(12px,env(safe-area-inset-bottom))]">
              <button className="pixel-btn primary justify-center text-base" onClick={beginPlay} autoFocus>
                {t("▶ Başla")}
              </button>
              <button className="pixel-btn" onClick={() => setScreen('map')}>
                {t("Şehirler")}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'pause' && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md overflow-hidden px-6 pb-5">
            <CityBanner level={level} eyebrow={t("MOLA")} height={110} />
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                [formatTime(hud.time * 1000), t('Süre')],
                [String(hud.deaths), t('Düşüş')],
                [`${hud.items.filter(Boolean).length}/3`, level.item],
              ].map(([v, k]) => (
                <div key={k} className="border-2 border-line bg-ink/40 py-2">
                  <p className="font-display text-xl leading-none text-cream tabular-nums">{v}</p>
                  <p className="mt-1 text-[11px] text-muted">{k}</p>
                </div>
              ))}
            </div>
            <button className="pixel-btn primary mt-4 w-full justify-center py-3 text-lg" onClick={() => setScreen('play')} autoFocus>
              {t("▶ Devam Et")}
            </button>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <button
                className="pixel-btn flex-col justify-center gap-1 px-1 py-2.5 text-[12px]"
                onClick={() => {
                  worldRef.current?.retryFromCheckpoint()
                  setScreen('play')
                }}
              >
                <span className="text-lg leading-none">⚑</span>
                {t("Checkpoint’e Dön")}
              </button>
              <button className="pixel-btn flex-col justify-center gap-1 px-1 py-2.5 text-[12px]" onClick={() => loadLevel(levelIdx, 'play')}>
                <span className="text-lg leading-none">↺</span>
                {t("Baştan Başla")}
              </button>
              <button className="pixel-btn flex-col justify-center gap-1 px-1 py-2.5 text-[12px]" onClick={() => setScreen('map')}>
                <span className="text-lg leading-none">⌖</span>
                {t("Şehirler")}
              </button>
            </div>
            <div className="mt-5">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
                {t("AYARLAR")} <span className="kilim h-[6px] flex-1 opacity-50" />
              </p>
              <div className="mt-1 grid divide-y-2 divide-line/60">
                <Toggle label={t("Ses Efektleri")} on={save.sfx} onChange={() => toggle('sfx')} />
                <Toggle label={t("Müzik")} on={save.music} onChange={() => toggle('music')} />
                <Toggle label={t("Dokunmatik Kontroller")} on={showTouch} onChange={() => persist({ ...save, touch: showTouch ? 'off' : 'on' })} />
                {!showTouch && <Toggle label={t("Tuş İpuçları")} hint={t("Ekranın altında klavye rehberi")} on={save.keyHints} onChange={() => persist({ ...save, keyHints: !save.keyHints })} />}
                <Toggle label={t("Büyük Tuşlar")} hint={t("Telefonda daha geniş dokunma alanı")} on={save.controlSize === 'buyuk'} onChange={() => persist({ ...save, controlSize: save.controlSize === 'buyuk' ? 'normal' : 'buyuk' })} />
                <Toggle label={t("Hayalet Koşu")} hint={t("En iyi koşunun soluk hayaleti seninle birlikte koşar.")} on={save.ghost} onChange={() => persist({ ...save, ghost: !save.ghost })} />
                <Toggle label={t("Rahat Mod")} hint={t("Oyun %80 hızda akar, zıplamaya zaman kalır. Bu modda skorlar tabloya yazılmaz.")} on={save.relaxed} onChange={() => persist({ ...save, relaxed: !save.relaxed })} />
              </div>
              {canFull && (
                <button className="mt-2 text-[12px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={fullscreen}>
                  {t("⛶ Tam Ekrana Geç")}
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
          heroName={hero.short}
          heroId={hero.id}
          onPlayer={(p) => persist({ ...save, player: p, skippedName: !p })}
          onNext={() => (levelIdx + 1 < LEVELS.length ? loadLevel(levelIdx + 1) : setScreen('end'))}
          onRetry={() => loadLevel(levelIdx, 'play')}
          onMap={() => setScreen('map')}
        />
      )}

      {screen === 'about' && (
        <Overlay dim>
          <About heroName={hero.short} onClose={() => setScreen('title')} onPlay={() => (ui(), setScreen('title'))} />
        </Overlay>
      )}

      {screen === 'scores' && (
        <Overlay>
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cream">{t("Skor Tablosu")}</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            <ScoreBoard me={save.player?.name ?? ''} />
          </div>
        </Overlay>
      )}

      {screen === 'controls' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cream">{t("Kontroller")}</h2>
              <button className="pixel-btn" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-display text-gold">{t("Klavye")}</dt>
                <dd />
                <dt className="text-muted">{t("Yürü")}</dt>
                <dd>← → / A D</dd>
                <dt className="text-muted">{t("Zıpla")}</dt>
                <dd>↑ / W / Z</dd>
                <dt className="text-muted">{t("Dash")}</dt>
                <dd className="text-gold">{t("Space (Boşluk) / X / Shift")}</dd>
                <dt className="text-muted">{t("İn")}</dt>
                <dd>↓ (ince platformdan)</dd>
                <dt className="text-muted">{t("Mola")}</dt>
                <dd>Esc / P</dd>
                <dt className="text-muted">{t("Bayrak")}</dt>
                <dd>R</dd>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-display text-gold">{t("Dokunmatik")}</dt>
                <dd />
                <dt className="text-muted">{t("Sol Yarı")}</dt>
                <dd>{t("Joystick, nereye dokunursan orada")}</dd>
                <dt className="text-muted">{t("Zıpla")}</dt>
                <dd>{t("Uzun bas, daha yükseğe")}</dd>
                <dt className="text-muted">{t("Dash")}</dt>
                <dd>{t("Joystick yönünde")}</dd>
                <dt className="font-display text-gold">{t("Oyun Kolu")}</dt>
                <dd />
                <dt className="text-muted">A / Y</dt>
                <dd>{t("Zıpla")}</dd>
                <dt className="text-muted">X / B / RT</dt>
                <dd>{t("Dash")}</dd>
              </dl>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              {t("Duvara doğru basılı tutup zıplarsan aynı duvarda tırmanırsın. Dash yere değince ya da bir düşmana basınca yenilenir: atkın kırmızıysa hazırsın, griyse harcadın. Şehir insanlarının yanına gidersen seninle konuşurlar.")}
            </p>
          </div>
        </Overlay>
      )}

      {screen === 'notebook' && <Defter save={save} onClose={() => setScreen('title')} onRush={startRush} />}

      {screen === 'rushEnd' && rushResult && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{rushResult.best ? t('YENİ REKOR') : t('BOSS RUSH')}</p>
            <h2 className="mt-2 font-display text-5xl tabular-nums text-cream">{formatTime(rushResult.timeMs)}</h2>
            <p className="mt-2 text-[13px] text-muted">{t('{n} boss · {deaths} düşüş', { n: rushResult.bosses, deaths: rushResult.deaths })}</p>
            {rushResult.relaxed && <p className="mt-2 text-[12px] text-muted">{t("Rahat Mod’da koştun: rekor yazılmadı.")}</p>}
            {!rushResult.best && !rushResult.relaxed && save.rush && <p className="mt-2 text-[12px] text-muted">{t('Rekor: {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={startRush} autoFocus>
                {t("↺ Yeniden Koş")}
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('notebook')}>
                {t("Defter")}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'end' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <div className="flex justify-center">
              <div className="portrait-frame w-[180px]">
                <Portrait id={hero.id} scarf={heroScarf} className="block w-full" />
              </div>
            </div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("YOLCULUK TAMAM")}</p>
            <h2 className="mt-2 font-display text-4xl text-cream">{(endingFor(lang) ?? ENDING).title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/90">{fill((endingFor(lang) ?? ENDING).text, hero.short)}</p>
            <p className="mt-3 text-[12px] text-muted">
              {t('{n} / {total} hatıra · Toplam en iyi süre {time}', { n: totalFound, total: LEVELS.length * 3, time: formatTime(Object.values(save.best).reduce((a, b) => a + (b.stale ? 0 : b.timeMs), 0)) })}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={() => setScreen('map')}>
                {t("Şehirler")}
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('scores')}>
                {t("Skor Tablosu")}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
    </LangProvider>
  )
}

/* ── Parçalar ───────────────────────────────────────────────── */

function Notebook({ page }: { page: number }) {
  const t = useT()
  return (
    <div className="relative min-h-[96px] flex-1 border-2 border-[#5a3c26] bg-[#e9dcc0] p-2 text-[#3a2a1e] shadow-[inset_0_-3px_0_rgba(0,0,0,0.15)]">
      <p className="font-display text-[13px] leading-none">Memleket</p>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <span key={l.id} className={`truncate border border-[#5a3c26]/40 px-1 text-[10px] leading-4 ${page >= 1 ? 'opacity-100' : 'opacity-40'}`}>
            {String(l.plate).padStart(2, "0")} {l.name}
          </span>
        ))}
      </div>
      {page === 2 && <p className="mt-1 text-[11px] italic">{t("“Yolun sonu, başladığım yer.”")}</p>}
    </div>
  )
}

function Hud({ level, hud, hero, scarf, onPause }: { scarf: { color: string; shade: string } | null; level: (typeof LEVELS)[number]; hud: { time: number; deaths: number; items: boolean[]; canDash: boolean; idle: boolean }; hero: CharacterId; onPause: () => void }) {
  const t = useT()
  const lng = useLang()
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}
    >
      <div className="flex min-w-0 items-center gap-2.5 bg-ink/80 py-1.5 pl-1.5 pr-2.5 [box-shadow:0_0_0_2px_rgba(61,53,80,0.8)]">
        <span className="hidden min-[400px]:block">
          <PortraitFace id={hero} scarf={scarf} />
        </span>
        <span className="plate text-[15px] sm:text-lg">
          <span>{String(level.plate).padStart(2, "0")}</span>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[15px] text-cream sm:text-lg">{level.name}</p>
          <p className="truncate text-[11px] font-bold tracking-[0.06em] text-muted">{(level.nickname ?? t(level.difficulty)).toLocaleUpperCase(lng)}</p>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 bg-ink/80 px-2 py-2 text-sm font-semibold tabular-nums text-cream [box-shadow:0_0_0_2px_rgba(61,53,80,0.8)] sm:gap-3 sm:px-3">
          <span className="flex gap-1" aria-label={t('{n} / 3 hatıra', { n: hud.items.filter(Boolean).length })}>
            {hud.items.map((v, i) => (
              <ItemIcon key={i} city={level.city} taken={v} />
            ))}
          </span>
          <span aria-label={t("Düşüş")}>✕ {hud.deaths}</span>
          <span aria-label={t("Süre")} className="hidden min-[380px]:inline">
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
  heroId,
  onPlayer,
  onNext,
  onRetry,
  onMap,
}: {
  levelIdx: number
  result: Result
  save: Save
  heroName: string
  heroId: CharacterId
  onPlayer: (p: Player | null) => void
  onNext: () => void
  onRetry: () => void
  onMap: () => void
}) {
  const t = useT()
  const lng = useLang()
  const level = localize(LEVELS[levelIdx], lng)
  const player = save.player
  const name = player?.name ?? heroName
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr] = useState('')
  const [rank, setRank] = useState<number | null>(null)
  const [improved, setImproved] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const found = result.items.filter(Boolean).length
  const best = save.best[level.id]
  const medal = medalFor(level, result.timeMs)
  const [copied, setCopied] = useState(false)
  const shareUrl = () =>
    `${location.origin}/skor?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: save.scarf, lang: lng })}`
  const shareText = t('Sek-Sek’te {city} şehrini {time} sürede geçtim ({deaths} düşüş, {found}/3 hatıra). Sen de dene!', { city: level.name, time: formatTime(result.timeMs), deaths: result.deaths, found })
  const share = async () => {
    const url = shareUrl()
    if (navigator.share) {
      try {
        await navigator.share({ title: t('Sek-Sek skor kartım'), text: shareText, url })
        return
      } catch {
        /* vazgeçildi */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`, '_blank', 'noopener')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* izin yok */
    }
  }

  const submit = async (p: Player) => {
    setStatus('sending')
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: level.id, playerId: p.id, token: p.token, timeMs: result.timeMs, deaths: result.deaths, items: found }),
      })
      const j = (await res.json()) as { error?: string; rank?: number; improved?: boolean }
      if (res.status === 401) {
        // oturum artık geçerli değil (hesap silinmiş ya da çıkış yapılmış): yeniden giriş istenir
        setStatus('idle')
        onPlayer(null)
        return
      }
      if (!res.ok) throw new Error(j.error ?? t('Gönderilemedi'))
      setRank(j.rank ?? null)
      setImproved(j.improved ?? true)
      setStatus('sent')
      setRefresh((r) => r + 1)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('Gönderilemedi'))
      setStatus('error')
    }
  }

  // ad varsa skor kendiliğinden kaydedilir
  useEffect(() => {
    if (player && status === 'idle' && !result.relaxed) void submit(player)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  return (
    <Overlay dim>
      <div className="rise pixel-panel w-full max-w-2xl overflow-clip px-6 lg:max-w-5xl">
        <CityBanner level={level} eyebrow={t('GEÇİLDİ')} height={130} />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          {/* ── sol: sonuç, hatıralar, defter */}
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <figure className="polaroid relative w-[84px] shrink-0 rotate-[-4deg] sm:w-[100px]">
                <span className="tape" />
                <Portrait id={heroId} scarf={scarfFor(save.scarf).id === 'al' ? null : scarfFor(save.scarf)} className="w-full" />
                <figcaption className="!text-[12px]">{heroName}</figcaption>
              </figure>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-[0.22em] text-muted">{result.newBest ? t('YENİ REKOR') : best && !best.stale ? t('REKORUN {time}', { time: formatTime(best.timeMs) }) : t('SÜRE')}</p>
                <p className="font-display text-5xl leading-none tabular-nums text-cream sm:text-6xl">{formatTime(result.timeMs)}</p>
                <p className="mt-1.5 text-[13px] text-muted">{t('{deaths} düşüş · {found}/3 {item}', { deaths: result.deaths, found, item: level.item })}</p>
              </div>
              <Seal medal={medal} bronze={level.medals[2]} />
            </div>
            {result.earned.map((e) => (
              <p key={e} className="mt-3 border-2 border-gold bg-gold/10 px-3 py-1.5 text-center text-[13px] font-bold tracking-[0.08em] text-gold">
                ★ {t(e)}
              </p>
            ))}

            <p className="mt-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
              {t('HATIRALAR')} <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {level.facts.map((f, i) => {
                const now = result.items[i]
                const have = now || best?.items[i]
                return (
                  <div key={i} className={`relative flex flex-col items-center px-2 pb-2.5 pt-3 text-center ${have ? 'notebook' : 'border-2 border-dashed border-line/70'}`} style={have ? { transform: `rotate(${[-1.2, 0.8, -0.5][i]}deg)` } : undefined}>
                    <div className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full ${have ? 'bg-[#2a2438] shadow-[0_0_0_3px_#d9a441,0_4px_0_3px_rgba(0,0,0,0.25)]' : 'bg-ink/50'}`}>
                      <ItemIcon city={level.city} taken={!!have} size={48} />
                      {!have && <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-muted">?</span>}
                    </div>
                    <p className={`mt-1.5 font-display text-[15px] leading-tight ${have ? '' : 'text-muted'}`}>{level.item}</p>
                    <p className={`text-[11px] font-bold tracking-[0.12em] ${have ? 'text-[#8a3a24]' : 'text-muted'}`}>{have ? f.title.toLocaleUpperCase(lng) : t('SAKLI')}</p>
                    {now && <span className="absolute -right-2 -top-2 rotate-[12deg] border-2 border-[#c8302a] bg-[#f4ead8] px-1 text-[10px] font-bold tracking-[0.1em] text-[#c8302a]">{t('BULUNDU')}</span>}
                  </div>
                )
              })}
            </div>

            <p className="mt-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
              {t('DEFTERE YAZILANLAR')} <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            <div className="mt-2 grid gap-2.5">
              {level.facts.map((f, i) => {
                const have = result.items[i] || best?.items[i]
                if (!have) return null
                return (
                  <div key={i} className="notebook flex gap-3 px-3 py-2.5" style={{ transform: `rotate(${[-0.5, 0.4, -0.3][i]}deg)` }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2438] shadow-[0_0_0_2px_#d9a441]">
                      <ItemIcon city={level.city} taken size={26} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[15px] leading-tight">{f.title}</p>
                      <p className="mt-0.5 text-[12px] leading-snug opacity-80">{f.text}</p>
                    </div>
                  </div>
                )
              })}
              {save.stamps?.[level.id] ? (
                <div className="relative border-2 border-[#d9a441] bg-[#2a2438] px-3 py-2.5" style={{ transform: 'rotate(0.4deg)' }}>
                  <span className="absolute -right-2 -top-3 rotate-[8deg] bg-[#f4ead8] px-1.5 py-0.5 font-display text-[11px] text-[#c8302a] [box-shadow:0_0_0_2px_#c8302a]">{t('GİZLİ SAYFA')}</span>
                  <p className="font-display text-[15px] leading-tight text-gold">{level.secret.title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-cream/85">{level.secret.text}</p>
                </div>
              ) : (
                <p className="border-2 border-dashed border-line/70 px-3 py-2 text-[12px] text-muted">{t('Bu şehirde bir gizli pul var. Sahte duvarlara, çatlak zeminlere ve zor ulaşılan köşelere bak.')}</p>
              )}
              <p className={`border-2 px-3 py-2 text-[12px] ${save.charms?.[level.id] ? 'border-[#4ab0e8] bg-[#2a2438] text-cream/90' : 'border-dashed border-line/70 text-muted'}`}>
                {save.charms?.[level.id] ? t('Nazar boncuğu bulundu: meydan yolunda saklıydı.') : t('Meydan yolunda bir nazar boncuğu saklı. Kapıdan geçtikten sonra etrafına iyi bak.')}
              </p>
              {found === 0 && !best?.items.some(Boolean) && (
                <p className="border-2 border-dashed border-line/70 px-3 py-3 text-[12px] text-muted">{t('Bu şehirde üç {item} saklı. Bul, defterine yazılsın.', { item: level.item })}</p>
              )}
            </div>
          </div>

          {/* ── sağ: kartpostal, paylaşım, skor tablosu */}
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
              {t('KARTPOSTALIN')} <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/skor/kart?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: save.scarf, lang: lng })}`}
              alt={t('{city} skor kartı', { city: level.name })}
              width={1200}
              height={630}
              loading="lazy"
              className="mt-3 aspect-[40/21] h-auto w-full rotate-[-0.6deg] bg-ink/40 [box-shadow:0_0_0_3px_#3d3550,0_14px_30px_rgba(0,0,0,0.5)]"
            />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn justify-center py-2.5 text-sm" onClick={share}>
                {t('↗ Paylaş')}
              </button>
              <a className="pixel-btn justify-center py-2.5 text-sm" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} onClick={(e) => { e.preventDefault(); window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl()}`)}`, '_blank', 'noopener') }}>
                WhatsApp
              </a>
              <button className="pixel-btn justify-center py-2.5 text-sm" onClick={copy}>
                {copied ? t('Kopyalandı') : t('Bağlantıyı Kopyala')}
              </button>
              <a className="pixel-btn justify-center py-2.5 text-sm" href={`/skor/kart?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: save.scarf, lang: lng })}`} download={`sek-sek-${level.id}.png`}>
                {t('Kartı İndir')}
              </a>
            </div>

            <div className="mt-5 border-2 border-line bg-ink/40 p-3.5">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
                {t('SKOR TABLOSU')} <span className="kilim h-[6px] flex-1 opacity-50" />
              </p>
              {result.relaxed ? (
                <p className="mt-2 text-[12px] text-muted">{t('Rahat Mod’da oynadın: bu skor tabloya yazılmadı. Ayarlardan kapatıp yarışabilirsin.')}</p>
              ) : !player ? (
                <div className="mt-2.5">
                  <p className="mb-2 text-[12px] text-muted">{t('Skorunu tabloya yazmak için üye ol ya da giriş yap.')}</p>
                  <AuthForm suggestion={heroName} autoFocus={false} onDone={(p) => onPlayer(p)} />
                </div>
              ) : status === 'sending' ? (
                <p className="mt-2 text-[12px] text-muted">{t('Skorun kaydediliyor…')}</p>
              ) : status === 'error' ? (
                <p className="mt-2 text-[12px] text-accent-2">
                  {err}{' '}
                  <button className="underline" onClick={() => void submit(player)}>
                    {t('Tekrar Dene')}
                  </button>
                </p>
              ) : status === 'sent' ? (
                <p className="mt-2 text-[13px] text-gold">
                  {improved ? t('{name}, skorun kaydedildi.', { name }) : t('{name}, en iyi süren değişmedi.', { name })} {rank ? <strong>{t('Sıralaman: {rank}.', { rank })}</strong> : null}
                </p>
              ) : null}
              <Top level={level.id} refresh={refresh} highlight={player?.name ?? ''} />
            </div>
          </div>
        </div>

        {/* ── sabit eylem şeridi: telefonda da hep görünür */}
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 grid grid-cols-[1fr_auto_auto] gap-2.5 border-t-2 border-line bg-[#1e1a29]/95 px-6 py-3 [padding-bottom:max(12px,env(safe-area-inset-bottom))]">
          <button className="pixel-btn primary min-w-0 justify-center" onClick={onNext} autoFocus>
            <span className="truncate">{levelIdx + 1 < LEVELS.length ? t('▶ Sıradaki: {city}', { city: displayName(LEVELS[levelIdx + 1]) }) : t('▶ Defteri Kapat')}</span>
          </button>
          <button className="pixel-btn" onClick={onRetry} aria-label={t('↺ Tekrar')}>
            {t('↺ Tekrar')}
          </button>
          <button className="pixel-btn" onClick={onMap}>
            {t('Şehirler')}
          </button>
        </div>
      </div>
    </Overlay>
  )
}


function Seal({ medal, bronze }: { medal: 'altin' | 'gumus' | 'bronz' | null; bronze: number }) {
  const t = useT()
  const look = medal ? { altin: [t('ALTIN'), '#e3a92c', '#9a6a12', '#3a2408'], gumus: [t('GÜMÜŞ'), '#c9d0da', '#7c8696', '#232a36'], bronz: [t('BRONZ'), '#c97a44', '#7a4220', '#2a1408'] }[medal] : null
  if (!look)
    return (
      <div className="flex h-[76px] w-[76px] shrink-0 rotate-[-8deg] flex-col items-center justify-center rounded-full border-2 border-dashed border-line text-center text-[11px] leading-tight text-muted">
        {t("Bronz")}
        <br />
        {bronze} sn
      </div>
    )
  return (
    <div className="flex h-[84px] w-[84px] shrink-0 rotate-[-10deg] items-center justify-center rounded-full shadow-[0_5px_0_rgba(0,0,0,0.35)]" style={{ background: look[1], border: `5px solid ${look[2]}` }} title={`${look[0]} madalya`}>
      <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: look[2], color: look[3] }}>
        <span className="font-display text-[17px] leading-none">{look[0]}</span>
        <span className="mt-0.5 text-[8px] font-bold tracking-[0.12em]">{t("MADALYA")}</span>
      </div>
    </div>
  )
}

function Top({ level, refresh, highlight, sort = '' }: { level: string; refresh: number; highlight: string; sort?: string }) {
  const t = useT()
  const lng = useLang()
  const [rows, setRows] = useState<ScoreRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    setFailed(false)
    fetch(`/api/scores?level=${level}${sort ? `&sort=${sort}` : ''}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('x'))))
      .then((j: { scores: ScoreRow[] }) => live && setRows(j.scores))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [level, refresh, sort])
  if (failed) return <p className="mt-2 text-[12px] text-muted">{t("Skor tablosuna şu an ulaşılamıyor.")}</p>
  if (!rows) return <p className="mt-2 text-[12px] text-muted">{t("Yükleniyor…")}</p>
  if (!rows.length) return <p className="mt-2 text-[12px] text-muted">{t("Henüz skor yok. İlk sen ol!")}</p>
  const mine = rows.findIndex((r) => highlight && r.name.toLocaleLowerCase('tr') === highlight.toLocaleLowerCase('tr'))
  return (
    <ol className="mt-2 grid gap-1 text-[13px] tabular-nums">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className={`grid grid-cols-[1.6rem_minmax(0,1fr)_auto] items-baseline gap-x-2 px-2 py-1.5 ${i === mine ? 'bg-accent/25 outline outline-2 outline-accent/60' : i % 2 ? '' : 'bg-panel-2/60'}`}>
          <span className={i < 3 ? 'font-bold text-gold' : 'text-muted'}>{i + 1}.</span>
          <span className="min-w-0">
            <a href={`/oyuncu/${encodeURIComponent(r.name)}`} className="block truncate text-cream underline-offset-4 hover:underline">
              {r.name}
            </a>
            <span className="block text-[11px] text-muted">
              {r.cities !== undefined
                ? lng === 'en'
                  ? `${r.cities} ${r.cities === 1 ? 'city' : 'cities'} · ${r.items} ${r.items === 1 ? 'keepsake' : 'keepsakes'} · ✕${r.deaths}`
                  : t('{cities} şehir · {items} hatıra · ✕{deaths}', { cities: r.cities, items: r.items, deaths: r.deaths })
                : `✕${r.deaths} · ${r.items}/3`}
            </span>
          </span>
          <span className="text-cream">{formatTime(r.timeMs)}</span>
        </li>
      ))}
    </ol>
  )
}

function ScoreBoard({ me }: { me: string }) {
  const t = useT()
  const lng = useLang()
  const [idx, setIdx] = useState(-1)
  const [sort, setSort] = useState('')
  const strip = useRef<HTMLDivElement>(null)
  const sorts: [string, string][] =
    idx === -1
      ? [['', t('Şehir')], ['deaths', t('En Az Düşüş')], ['items', t('Hatıra')]]
      : [['', t('Süre')], ['deaths', t('En Az Düşüş')], ['items', t('Hatıra')]]
  // seçili sekme şeridin ortasına kayar; sayfa dikeyde kıpırdamaz
  useEffect(() => {
    const st = strip.current
    const el = st?.querySelector<HTMLElement>('[data-on="1"]')
    if (st && el) st.scrollTo({ left: el.offsetLeft - st.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [idx])
  const step = (d: number) => setIdx((i) => ((i + 1 + d + LEVELS.length + 1) % (LEVELS.length + 1)) - 1)
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2">
        <button aria-label={t("Önceki Şehir")} className="pixel-btn shrink-0 px-2.5 py-1.5" onClick={() => step(-1)}>
          ‹
        </button>
        <div ref={strip} className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto py-1">
          <button data-on={idx === -1 ? 1 : 0} className={`pixel-btn shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[12px] ${idx === -1 ? 'primary' : ''}`} onClick={() => setIdx(-1)}>
            {t("★ Genel")}
          </button>
          {LEVELS.map((l, i) => (
            <button key={l.id} data-on={i === idx ? 1 : 0} className={`pixel-btn shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[12px] ${i === idx ? 'primary' : ''}`} onClick={() => setIdx(i)}>
              {String(l.plate).padStart(2, '0')} {l.name}
            </button>
          ))}
        </div>
        <button aria-label={t("Sonraki Şehir")} className="pixel-btn shrink-0 px-2.5 py-1.5" onClick={() => step(1)}>
          ›
        </button>
      </div>
      <p className="mt-3 font-display text-xl text-gold">{idx === -1 ? t('Genel Sıralama') : displayName(LEVELS[idx])}</p>
      <p className="text-[12px] text-muted">
        {idx === -1
          ? sort === 'deaths'
            ? t('Bitirilen şehir sayısı, sonra en az düşüş.')
            : sort === 'items'
              ? t('En çok hatıra, sonra toplam süre.')
              : t('Bitirilen şehir sayısı, sonra toplam süre.')
          : sort === 'deaths'
            ? t('{subtitle} · en az düşüş', { subtitle: localize(LEVELS[idx], lng).subtitle })
            : sort === 'items'
              ? t('{subtitle} · en çok hatıra', { subtitle: localize(LEVELS[idx], lng).subtitle })
              : t('{subtitle} · en iyi on süre', { subtitle: localize(LEVELS[idx], lng).subtitle })}
      </p>
      <div className="mt-2 flex gap-1.5" role="group" aria-label={t('Sıralama')}>
        {sorts.map(([k, label]) => (
          <button key={k || 'default'} aria-pressed={sort === k} className={`pixel-btn px-2.5 py-1 text-[12px] ${sort === k ? 'primary' : ''}`} onClick={() => setSort(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-1 min-h-[160px] flex-1 overflow-y-auto overscroll-contain">
        <Top level={idx === -1 ? 'genel' : LEVELS[idx].id} refresh={0} highlight={me} sort={sort} />
      </div>
    </div>
  )
}
