'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import Portrait, { PortraitFace } from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { BossFigure, HeroFigure } from '@/components/Figures'
import CityBanner, { Toggle } from '@/components/CityBanner'
import NameForm from '@/components/NameForm'
import AuthForm from '@/components/AuthForm'
import { ItemIcon, Key, KeyHints, ThingIcon, TutorialHint, type TutorialStep } from '@/components/HudBits'
import About from '@/components/About'
import Bestiary from '@/components/Bestiary'
import Defter, { RUSH_NEEDS } from '@/components/Defter'
import ScoreBoard, { Board } from '@/components/ScoreBoard'
import Race from '@/components/Race'
import { DailyEnd, DuelEnd, DuelSetup, DuelTurn, ModesHub, type DailyResult, type DuelSetupValue } from '@/components/Modes'
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
import { bindCookie, pullMerge, pushSave, restorePlayer, syncBests } from '@/lib/cloud'
import { CHALLENGE_TEXT, DAILY_RULES, SCARVES, completes, dailyChallenge, dailyRun, dailyScore, duelFirst, duelResult, duelScore, travelerTitle, emptyStats, addStats, istanbulDay, liveStreak, markDaily, scarfFor, weeklyChallenge, type Challenge, type DailyRun, type DuelRounds, type DuelRun } from '@/lib/extras'
import { FLAG_MOMENTS } from '@/game/flagMoments'
import { record, type GhostRun } from '@/game/ghost'
import { loadGhost, saveGhost } from '@/lib/ghost'
import { cityVersion } from '@/lib/mapVersion'
import { adoptable, clearProgress, defaultSave, formatTime, loadSave, mergeSaves, nextUnplayed, resumeFor, mapNews, ackMapNews, titleFacts, writeSave, type Player, type Save } from '@/lib/storage'

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

/** Henüz hiç oynamamış oyuncu: hikâye ve ad ekranı atlanır, doğrudan İstanbul'a girer. */
const isFresh = (s: Save) => !s.seenStory && s.unlocked === 0 && Object.keys(s.best).length === 0

/** HUD'daki tek kelimelik hedef: ilk üç şehirde görünür */
type Goal = 'square' | 'boss' | 'exit'
const GOAL_CITIES = 3
/** Maraton'da arka arkaya koşulan şehir sayısı */
const MARATHON_CITIES = 3

/** Rehberin bu bölümde öğrettikleri (yalnız ilk oynayış) */
interface Tutorial {
  startX: number
  walked: boolean
  jumped: boolean
  got: boolean
  flag: boolean
  dashed: boolean
}
const freshTutorial = (startX: number): Tutorial => ({ startX, walked: false, jumped: false, got: false, flag: false, dashed: false })

type Screen = 'title' | 'about' | 'character' | 'name' | 'story' | 'map' | 'intro' | 'play' | 'pause' | 'complete' | 'scores' | 'controls' | 'end' | 'notebook' | 'rushEnd' | 'modes' | 'dailyEnd' | 'duelSetup' | 'duelTurn' | 'duelEnd' | 'race'

/** Yolun dışındaki koşu: ilerlemeye ve şehir rekoruna dokunmaz */
type Mode = { kind: 'daily'; run: DailyRun } | { kind: 'duel' }

interface Duel {
  setup: DuelSetupValue
  rounds: DuelRounds
  round: number
  turn: 0 | 1
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
  /** boss: yalnız arenalar · maraton: üç şehir baştan sona */
  kind: 'boss' | 'maraton'
  order: number[]
  i: number
  timeMs: number
  deaths: number
}

const STEP = 1 / 120

interface HudState {
  time: number
  deaths: number
  items: boolean[]
  canDash: boolean
  idle: boolean
  goal: Goal
}
const EMPTY_HUD: HudState = { time: 0, deaths: 0, items: [false, false, false], canDash: true, idle: true, goal: 'square' }

/**
 * Rehberin şu anki adımı: sırayla yürü → zıpla → (ekranda hatıra varsa) topla → bayrak → dash.
 * Yapılan adım kendiliğinden geçer; hatıra adımı yalnız bir hatıra görünürken çıkar.
 */
function tutorialStep(tut: Tutorial, w: World, r: Renderer): TutorialStep | null {
  if (!tut.walked) return 'walk'
  if (!tut.jumped) return 'jump'
  const seen = w.pickups.some((p) => !p.taken && p.x + p.w > r.camX && p.x < r.camX + r.viewW && p.y + p.h > r.camY && p.y < r.camY + r.viewH)
  if (!tut.got && seen) return 'collect'
  if (!tut.flag) return 'flag'
  if (!tut.dashed) return 'dash'
  return null
}

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
  const modeRef = useRef<Mode | null>(null)
  /** bu koşuda biriken sayaçlar: bölüm bitince ya da bırakılınca kayda eklenir */
  const statRef = useRef({ deaths: 0, jumps: 0, dashes: 0, stomps: 0, playMs: 0 })
  /** Düello: rakibin bu turdaki koşusu (hayalet olarak yanında koşar) */
  const duelGhostRef = useRef<GhostRun | null>(null)
  const duelRef = useRef<Duel | null>(null)
  /** hesap ekranından sonra dönülecek ekran (günlük bitişinden girişe gidildiyse) */
  const returnRef = useRef<Screen | null>(null)
  const saveRef = useRef<Save | null>(null)
  /** rehber açık mı (save.tutorial) ve bu bölümde hangi adımlar yapıldı */
  const tutorialOnRef = useRef(false)
  const tutRef = useRef<Tutorial>(freshTutorial(0))
  /** meydan kapısından geçildi / boss yenildi: HUD hedefi buna göre değişir */
  const goalRef = useRef<Goal>('square')
  /** karakter seçimi bitince oyuna mı (yeni oyuncu) menüye mi dönülür */
  const pickThenPlayRef = useRef(false)

  const [screen, setScreenState] = useState<Screen>('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [save, setSave] = useState<Save>(defaultSave)
  const [hud, setHud] = useState<HudState>(EMPTY_HUD)
  const [tutStep, setTutStep] = useState<TutorialStep | null>(null)
  const [cpToast, setCpToast] = useState<{ at: number; text: string } | null>(null)
  // hesap ekranı: üye ol / giriş sekmesi (başlık ona göre) ve çıkış onayı
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [confirmOut, setConfirmOut] = useState(false)
  const idleRef = useRef(0)
  const [hint, setHint] = useState<string | null>(null)
  const [npc, setNpc] = useState<number>(-1)
  const [toast, setToast] = useState<(Fact & { item: string; key: number }) | null>(null)
  const [quip, setQuip] = useState<{ text: string; key: number } | null>(null)
  /** boss uyandı, henüz vurulmadı: nasıl yenileceği üç adımda görünür */
  const [coach, setCoach] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [duel, setDuelState] = useState<Duel | null>(null)
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null)
  const [dailySend, setDailySend] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; rank: number | null }>({ status: 'idle', rank: null })
  const [pauseSet, setPauseSet] = useState(false)
  const [setTab, setSetTab] = useState<'ayar' | 'tus'>('ayar')
  const [boardTab, setBoardTab] = useState<'genel' | 'gunluk'>('genel')
  const [rushResult, setRushResult] = useState<{ timeMs: number; deaths: number; bosses: number; best: boolean; relaxed: boolean; kind: 'boss' | 'maraton' } | null>(null)
  const [coarse, setCoarse] = useState(false)
  const [ready, setReady] = useState(false)
  const [storyPage, setStoryPage] = useState(0)
  const [canFull, setCanFull] = useState(false)
  const [titleCard, setTitleCard] = useState(0)
  const [resumeIdx, setResumeIdx] = useState(0)
  const langRef = useRef<'tr' | 'en'>('tr')

  const setScreen = useCallback((s: Screen) => {
    screenRef.current = s
    setScreenState(s)
  }, [])

  saveRef.current = save
  const lang = save.lang ?? 'tr'
  const t = makeT(lang)
  const level = localize(LEVELS[levelIdx], lang)
  const hero = CHARACTERS[save.character ?? 'uktun']
  const beaten = LEVELS.filter((l) => save.bosses[l.id]).length
  /** seçilen atkı (al ise karakterin kendi atkısı: null) */
  const heroScarf = scarfFor(save.scarf).id === 'al' ? null : scarfFor(save.scarf)
  const charmCount = LEVELS.filter((l) => save.charms[l.id]).length
  const mapNotice = mapNews(save)
  const now = new Date()
  const challenges: [string, Challenge, boolean][] = [
    [t('GÜNÜN ŞEHRİ'), dailyChallenge(now, LEVELS, save.unlocked), false],
    [t('HAFTANIN GÖREVİ'), weeklyChallenge(now, LEVELS, save.unlocked), false],
  ]
  challenges[0][2] = save.daily.last === challenges[0][1].key
  challenges[1][2] = save.weekly.last === challenges[1][1].key

  /* ── kurulum ─────────────────────────────────────────────── */
  useEffect(() => {
    relaxedRef.current = save.relaxed
    ghostOnRef.current = save.ghost
    tutorialOnRef.current = save.tutorial
    if (!save.tutorial) setTutStep(null)
    if (!save.ghost && rendererRef.current) rendererRef.current.ghostRun = null
  }, [save.relaxed, save.ghost, save.tutorial])

  useEffect(() => {
    const s = loadSave()
    const qs = new URLSearchParams(location.search)
    const qc = qs.get('karakter')
    if ((qc === 'uktun' || qc === 'memo') && !s.character) {
      s.character = qc
      writeSave(s)
    }
    setSave(s)
    setCoarse(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    // /siralama sayfasından gelen: doğrudan Modlar ekranı (günün meydan okuması orada)
    if (qs.get('mod') === 'gunluk' && !isFresh(s)) {
      screenRef.current = 'modes'
      setScreenState('modes')
    }
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
    const startIdx = qCity >= 0 && qCity <= s.unlocked ? qCity : resumeFor(s)
    levelRef.current = startIdx
    setLevelIdx(startIdx)
    setResumeIdx(startIdx)
    worldRef.current = new World(LEVELS[startIdx])
    renderer.setLevel(worldRef.current)
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __mk: unknown }).__mk = { world: () => worldRef.current, stats: () => renderer.stats, sound: () => soundRef.current }
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
        // Rahat Mod: dünya %80 hızda akar. Modlarda hız kuralındır (Hızlı Dünya %120), Rahat Mod sayılmaz
        const mode = modeRef.current
        acc += dt * (mode ? (mode.kind === 'daily' ? DAILY_RULES[mode.run.rule].speed : 1) : relaxedRef.current ? 0.8 : 1)
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
        if (w.started && !w.complete) {
          record(ghostRecRef.current, w)
          // yolda geçen süre yalnız oyun akarken birikir (menüde bekleyen dünya sayılmaz)
          statRef.current.playMs += dt * 1000
        }
        for (const e of w.events) {
          renderer.handle(e, w)
          soundRef.current?.sfx(e.type)
          switch (e.type) {
            case 'collect': {
              tutRef.current.got = true
              const lv = localize(w.level, langRef.current)
              setToast({ ...lv.facts[e.index], item: lv.item, key: Date.now() })
              haptic([12, 40, 12])
              break
            }
            case 'stomp':
              statRef.current.stomps++
              freezeRef.current = 0.06
              haptic(15)
              break
            case 'death': {
              statRef.current.deaths++
              setCoach(false)
              haptic(40)
              const q = localize(w.level, langRef.current).quips
              if (Math.random() < 0.4) setQuip({ text: q[Math.floor(Math.random() * q.length)], key: Date.now() })
              break
            }
            case 'checkpoint': {
              tutRef.current.flag = true
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
              // modlarda bulunan şey deftere yazılmaz (kart "ilerlemen değişmez" diyor; kilitli şehir de gelebilir)
              if (modeRef.current) break
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
              if (modeRef.current) break
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
              goalRef.current = 'exit'
              freezeRef.current = 0.14
              haptic([40, 50, 40, 50, 90])
              if (modeRef.current) break
              setSave((prev) => {
                if (prev.bosses[w.level.id]) return prev
                const next = { ...prev, bosses: { ...prev.bosses, [w.level.id]: true } }
                writeSave(next)
                return next
              })
              break
            case 'warp':
              goalRef.current = 'boss'
              haptic(18)
              break
            case 'dash':
              tutRef.current.dashed = true
              statRef.current.dashes++
              dashRef.current++
              haptic(6)
              break
            case 'jump':
            case 'walljump':
              statRef.current.jumps++
              tutRef.current.jumped = true
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
          setHud({ time: w.time, deaths: w.deaths, items: w.pickups.map((p) => p.taken), canDash: w.player.canDash && w.player.dashCool <= 0, idle: w.time < 6 || idleRef.current > 1.5, goal: goalRef.current })
          if (tutorialOnRef.current && !rushRef.current && !modeRef.current) {
            const tut = tutRef.current
            if (Math.abs(w.player.x - tut.startX) >= 32) tut.walked = true
            const step = tutorialStep(tut, w, renderer)
            setTutStep(step)
            if (!step && tut.walked && tut.jumped && tut.got && tut.flag && tut.dashed) endTutorial()
          }
          setHint(w.nearSign >= 0 ? (localize(w.level, langRef.current).hints[w.nearSign] ?? null) : null)
          setNpc(w.nearNpc)
        }
      } else if (sc === 'title' || sc === 'map' || sc === 'scores' || sc === 'controls' || sc === 'character' || sc === 'story' || sc === 'name' || sc === 'notebook' || sc === 'modes' || sc === 'duelSetup') {
        w.step(dt, emptyInput())
        w.events.length = 0
      } else {
        acc = 0
        // yan yana yarışın kendi iki tuvali ve döngüsü var: arkadaki dünya boşuna çizilmez
        if (sc === 'race') return
      }
      // adımlar arası ara değerleme yalnız oyun akarken: menüde dünya değişken adımla ilerler
      renderer.render(w, dt, sc === 'play' ? acc / STEP : 1)
    }
    raf = requestAnimationFrame(frame)

    const onVis = () => {
      sound.setHidden(document.hidden)
      if (document.hidden && screenRef.current === 'play') {
        screenRef.current = 'pause'
        setScreenState('pause')
      }
    }
    document.addEventListener('visibilitychange', onVis)
    // tarayıcı sesi ilk dokunuşa dek kilitli tutar: ilk tık ya da tuşta açılır, bekleyen jenerik başlar
    const firstTouch = () => sound.unlock()
    window.addEventListener('pointerdown', firstTouch, { once: true })
    window.addEventListener('keydown', firstTouch, { once: true })

    return () => {
      cancelAnimationFrame(raf)
      input.detach()
      sound.stopMusic()
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointerdown', firstTouch)
      window.removeEventListener('keydown', firstTouch)
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

  // Hesap: yerel depo silinmişse (Safari 7 gün kullanılmayan sitenin deposunu siler) giriş oturum çerezinden geri gelir
  useEffect(() => {
    if (!ready) return
    // girişli oyuncu: çerez yoksa kurulur (çerezden önceki girişler); oturum sunucuda kapanmışsa yerelden de düşer
    if (save.player) {
      const p = save.player
      void bindCookie(p).then((ok) => {
        if (!ok) setSave((prev) => (prev.player?.id === p.id ? (writeSave({ ...prev, player: null }), { ...prev, player: null }) : prev))
      })
      return
    }
    let live = true
    void restorePlayer().then((p) => {
      if (!live || !p) return
      setSave((prev) => {
        if (prev.player) return prev
        const next = { ...prev, player: p, skippedName: false }
        writeSave(next)
        return next
      })
    })
    return () => {
      live = false
    }
    // yalnız açılışta bir kez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Bulut kaydı: giriş yapan oyuncunun ilerlemesi buluttakiyle birleşir; birleşmeden önce hiçbir şey buluta yazılmaz
  const pulledFor = useRef<string | null>(null)
  const playerId = save.player?.id ?? null
  // bulut okunamazsa (ağ, sunucu) 5, 15, 45 sn sonra yeniden denenir; okunmadan buluta yazılmaz (eski ilerleme ezilmesin)
  const [pullTry, setPullTry] = useState(0)
  useEffect(() => {
    if (!playerId || pulledFor.current === playerId) return
    let live = true
    let retry: ReturnType<typeof setTimeout> | undefined
    setSave((prev) => {
      void pullMerge(prev).then((merged) => {
        if (!live) return
        if (!merged) {
          if (pullTry < 3) retry = setTimeout(() => setPullTry((n) => n + 1), [5000, 15000, 45000][pullTry])
          return
        }
        pulledFor.current = playerId
        setSave((cur) => {
          // çekme sürerken yerelde ilerleme olduysa o da korunur; cihaz ayarları yerelde kalır. Bundan sonra
          // bu tarayıcıdaki ilerleme bu hesabındır
          const next = { ...mergeSaves(adoptable(cur, playerId), merged), owner: playerId }
          writeSave(next)
          setResumeIdx(resumeFor(next))
          void pushSave(next)
          void syncBests(next)
          return next
        })
      })
      return prev
    })
    return () => {
      live = false
      if (retry) clearTimeout(retry)
    }
  }, [playerId, pullTry])

  // her ilerlemede hesaba yaz: yeni şehir, süre, pul, nazar ya da rozet hemen; ayar gibi küçük değişiklikler toplanıp
  // 1,5 sn sonra. Sekme kapanırken ya da arka plana geçerken bekleyen kayıt gönderilir (bölüm biter bitmez kapatan kaybetmez)
  const lastPushed = useRef('')
  const pending = useRef<Save | null>(null)
  useEffect(() => {
    if (!save.player || pulledFor.current !== save.player.id) return
    const progress = JSON.stringify([save.unlocked, save.best, save.stamps, save.charms, save.bosses, save.rush])
    pending.current = save
    const flush = () => {
      if (!pending.current) return
      lastPushed.current = JSON.stringify([pending.current.unlocked, pending.current.best, pending.current.stamps, pending.current.charms, pending.current.bosses, pending.current.rush])
      void pushSave(pending.current)
      pending.current = null
    }
    if (progress !== lastPushed.current) return flush()
    const id = setTimeout(flush, 1500)
    return () => clearTimeout(id)
  }, [save])
  useEffect(() => {
    const out = () => {
      if (pending.current) void pushSave(pending.current)
      pending.current = null
    }
    const onHide = () => document.visibilityState === 'hidden' && out()
    window.addEventListener('pagehide', out)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', out)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const ui = () => soundRef.current?.sfx('ui')

  /** Biriken sayaçları kayda ekler (bölüm bitince, yeniden başlayınca, menüye dönünce) */
  const flushStats = useCallback((runs = 0) => {
    const st = statRef.current
    const playMs = Math.round(st.playMs)
    if (!runs && !st.deaths && !st.jumps && !st.dashes && !st.stomps && playMs < 1000) return
    const add = { runs, deaths: st.deaths, jumps: st.jumps, dashes: st.dashes, stomps: st.stomps, playMs }
    statRef.current = { deaths: 0, jumps: 0, dashes: 0, stomps: 0, playMs: 0 }
    setSave((prev) => {
      const next = { ...prev, stats: addStats(prev.stats ?? emptyStats(), add) }
      writeSave(next)
      return next
    })
  }, [])

  const loadLevel = useCallback(
    (idx: number, toScreen: Screen = 'intro') => {
      flushStats()
      levelRef.current = idx
      setLevelIdx(idx)
      const rush = rushRef.current
      const w = new World(rush?.kind === 'boss' ? bossLevel(LEVELS[idx]) : LEVELS[idx])
      worldRef.current = w
      ghostRecRef.current = []
      dashRef.current = 0
      if (rendererRef.current) {
        rendererRef.current.setLevel(w)
        const mode = modeRef.current
        rendererRef.current.ghostRun = mode ? (mode.kind === 'duel' ? duelGhostRef.current : null) : !rush && ghostOnRef.current && !saveRef.current?.best[LEVELS[idx].id]?.stale ? loadGhost(LEVELS[idx].id) : null
      }
      inputRef.current?.clear()
      setHud(EMPTY_HUD)
      goalRef.current = 'square'
      tutRef.current = freshTutorial(w.player.x)
      setTutStep(null)
      setToast(null)
      setHint(null)
      setNpc(-1)
      setCoach(false)
      setResult(null)
      setScreen(toScreen)
    },
    [setScreen, flushStats],
  )

  const beginPlay = useCallback(() => {
    const snd = soundRef.current
    snd?.unlock()
    inputRef.current?.clear()
    setTitleCard(Date.now())
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    // yeni oyuncu oyuna girdi: hikâye ve ad ekranı bir daha kendiliğinden açılmaz (ad, bölüm sonunda sorulur)
    setSave((prev) => {
      if (!isFresh(prev)) return prev
      const next = { ...prev, seenStory: true, skippedName: prev.player ? prev.skippedName : true }
      writeSave(next)
      return next
    })
    setScreen('play')
  }, [setScreen])

  /** Rehber bitti: bir daha gösterilmez. */
  function endTutorial() {
    tutorialOnRef.current = false
    setTutStep(null)
    setSave((prev) => {
      if (!prev.tutorial) return prev
      const next = { ...prev, tutorial: false }
      writeSave(next)
      return next
    })
  }

  /** İlk açılış: İstanbul giriş kartı atlanır, oyun hemen başlar. */
  const firstPlay = () => {
    loadLevel(0, 'play')
    beginPlay()
  }

  /** Maraton: açılmış şehirlerden rastgele üçü, baştan sona arka arkaya; süre ve düşüş birikir. */
  const startMarathon = () => {
    const open = [...Array(Math.min(save.unlocked, LEVELS.length - 1) + 1).keys()]
    if (open.length < MARATHON_CITIES) return
    const order: number[] = []
    while (order.length < MARATHON_CITIES) order.push(open.splice(Math.floor(Math.random() * open.length), 1)[0])
    soundRef.current?.unlock()
    ui()
    modeRef.current = null
    rushRef.current = { kind: 'maraton', order, i: 0, timeMs: 0, deaths: 0 }
    loadLevel(order[0], 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t('Maraton: {cities}', { cities: order.map((i) => LEVELS[i].name).join(' → ') }) })
  }

  /** Boss Rush: yenilmiş bekçiler şehir sırasıyla, arka arkaya. */
  const startRush = () => {
    const order = LEVELS.map((l, i) => (save.bosses[l.id] ? i : -1)).filter((i) => i >= 0)
    if (order.length < RUSH_NEEDS) return
    soundRef.current?.unlock()
    ui()
    rushRef.current = { kind: 'boss', order, i: 0, timeMs: 0, deaths: 0 }
    loadLevel(order[0], 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t('Boss {i}/{n}', { i: 1, n: order.length }) })
  }

  const today = istanbulDay(now)
  const daily = dailyRun(today, LEVELS)
  const dailyLevel = LEVELS.find((l) => l.id === daily.levelId)!

  /** Günlük Meydan Okuma: herkes için aynı şehir ve kural; ilerlemeye dokunmaz */
  const startDaily = () => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = { kind: 'daily', run: daily }
    setDailySend({ status: 'idle', rank: null })
    loadLevel(LEVELS.findIndex((l) => l.id === daily.levelId), 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t(DAILY_RULES[daily.rule].name)}: ${t(DAILY_RULES[daily.rule].text)}` })
  }

  // Günlük skor tabloya: bitiş ekranı açıkken ve oyuncu girişliyken bir kez (misafir bitirip sonra giriş yaparsa da)
  const dailyPlayer = save.player
  useEffect(() => {
    if (screen !== 'dailyEnd' || !dailyResult || !dailyPlayer || dailySend.status !== 'idle') return
    const r = dailyResult
    setDailySend({ status: 'sending', rank: null })
    fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 'gunluk', day: r.run.day, playerId: dailyPlayer.id, token: dailyPlayer.token, timeMs: r.scoreMs, deaths: r.deaths, items: r.found }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((j: { rank?: number }) => setDailySend({ status: 'sent', rank: j.rank ?? null }))
      .catch(() => setDailySend({ status: 'error', rank: null }))
  }, [screen, dailyResult, dailyPlayer, dailySend.status])

  const setDuel = (d: Duel | null) => {
    duelRef.current = d
    setDuelState(d)
  }

  /** Düello'da sıradaki koşu: oyuncunun kılığı ve (varsa) rakibin hayaletiyle */
  const duelGo = () => {
    const d = duelRef.current
    if (!d) return
    soundRef.current?.unlock()
    ui()
    if (d.setup.style === 'yanyana') return setScreen('race')
    rushRef.current = null
    modeRef.current = { kind: 'duel' }
    loadLevel(d.setup.level, 'play')
    if (rendererRef.current) rendererRef.current.character = CHARACTERS[d.setup.heroes[d.turn]]
    beginPlay()
  }

  /** Yan yana yarışın turu bitti: ikisinin koşusu birlikte yazılır */
  const raceDone = (runs: [DuelRun, DuelRun]) => {
    const d = duelRef.current
    if (!d) return
    const rounds = d.rounds.map((r) => [...r]) as DuelRounds
    rounds[d.round] = runs
    if (duelResult(rounds, d.setup.bestOf).over) {
      setDuel({ ...d, rounds })
      setScreen('duelEnd')
    } else {
      rounds.push([null, null])
      setDuel({ ...d, rounds, round: d.round + 1 })
      setScreen('duelTurn')
    }
  }

  const duelStart = (setup: DuelSetupValue) => {
    duelGhostRef.current = null
    setDuel({ setup, rounds: [[null, null]], round: 0, turn: 0 })
    setScreen('duelTurn')
  }

  // müzik: oyunda şehrin teması (aynı şehirde yeniden başlayınca kesilmez), molada kısılır, menülerde jenerik
  useEffect(() => {
    const snd = soundRef.current
    if (!snd) return
    snd.duck(screen === 'pause')
    if (screen === 'play') snd.setMusic(LEVELS[levelIdx].city)
    // yan yana yarış kendi şehrinin müziğini çalar (Race bileşeni); menü teması üstüne binmesin
    else if (screen === 'race') snd.setMusic(LEVELS[duelRef.current?.setup.level ?? levelIdx].city)
    else if (screen !== 'pause') snd.playTheme()
  }, [screen, levelIdx, ready])

  // menüye dönünce koşu ve mod biter; oyundaki karakter yine kayıttaki olur
  useEffect(() => {
    // menü ekranlarının hepsi: yarım kalan mod bir sonraki normal koşuya taşınmasın
    if (!['map', 'title', 'modes', 'name', 'story', 'intro', 'character', 'notebook', 'scores', 'controls'].includes(screen)) return
    flushStats()
    rushRef.current = null
    if (modeRef.current) {
      modeRef.current = null
      duelGhostRef.current = null
      if (rendererRef.current) rendererRef.current.character = CHARACTERS[save.character ?? 'uktun']
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // oyundaki karakter her an kayıttakini izler: kayıt hangi yoldan değişirse değişsin (seçim, bulut birleşmesi, giriş)
  // oyunda çizilen ile bölüm sonu, portre ve kartpostalda görünen hep aynı kişidir
  useEffect(() => {
    if (rendererRef.current) rendererRef.current.character = CHARACTERS[save.character ?? 'uktun']
  }, [save.character, ready])

  // atkı rengi: karakterin kendi atkısı (al) dışındaki seçim çizime bildirilir
  useEffect(() => {
    if (!rendererRef.current) return
    const sc = scarfFor(save.scarf)
    rendererRef.current.scarf = sc.id === 'al' ? null : { color: sc.color, shade: sc.shade }
  }, [save.scarf, ready])

  const startJourney = () => {
    soundRef.current?.unlock()
    ui()
    if (isFresh(save)) {
      // yeni oyuncu: karakter seçimi → doğrudan oyun (en çok iki tık)
      if (!save.character) {
        pickThenPlayRef.current = true
        return setScreen('character')
      }
      return firstPlay()
    }
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
    if (pickThenPlayRef.current && isFresh(next)) {
      pickThenPlayRef.current = false
      return firstPlay()
    }
    if (!next.player && !next.skippedName) setScreen('name')
    else if (!next.seenStory) {
      setStoryPage(0)
      setScreen('story')
    } else setScreen('title')
  }

  const signOut = async () => {
    const p = save.player
    // ilerleme hesapta (veritabanında) kalır; tarayıcıdan silinir ki bu cihazı kullanan bir sonraki kişiye geçmesin
    persist({ ...clearProgress(save), player: null, skippedName: true })
    setResumeIdx(0)
    setScreen('title')
    if (p) await fetch('/api/players', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, token: p.token }) }).catch(() => {})
  }

  /** hesap ekranında misafirin alt şeridi: solda Geri (menüden gelince), sağda Şimdilik Geç ve tek satır not */
  const guestFooter = (cls: string) => (
    <div className={`${cls} items-center justify-between gap-3 border-t-2 border-line pt-3`}>
      {save.seenStory ? (
        <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
          {t('← Geri')}
        </button>
      ) : (
        <span />
      )}
      <span className="text-right text-[12px] leading-snug text-muted">
        <button className="text-cream underline-offset-4 hover:underline" onClick={() => afterName({ ...save, skippedName: true })}>
          {t('Şimdilik Geç')}
        </button>
        <span className="block">{t('İlerlemen yalnız bu tarayıcıda kalır.')}</span>
      </span>
    </div>
  )

  const afterName = (next: Save) => {
    persist(next)
    // günlük bitiş ekranından giriş yapmaya gelen oraya döner: skoru şimdi tabloya yazılır
    if (returnRef.current) {
      const to = returnRef.current
      returnRef.current = null
      return setScreen(to)
    }
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
    flushStats(1)
    const rush = rushRef.current
    if (rush) {
      rush.timeMs += timeMs
      rush.deaths += w.deaths
      rush.i++
      if (rush.i < rush.order.length) {
        loadLevel(rush.order[rush.i], 'play')
        beginPlay()
        setCpToast({ at: Date.now() + 1, text: makeT(langRef.current)(rush.kind === 'boss' ? 'Boss {i}/{n}' : 'Şehir {i}/{n}', { i: rush.i + 1, n: rush.order.length }) })
        return
      }
      rushRef.current = null
      const relaxed = relaxedRef.current
      const total = { timeMs: rush.timeMs, deaths: rush.deaths, bosses: rush.order.length }
      const kind = rush.kind
      setSave((prev) => {
        if (kind === 'maraton') {
          const best = !relaxed && (!prev.maraton || total.timeMs < prev.maraton.timeMs)
          setRushResult({ ...total, best, relaxed, kind })
          if (!best) return prev
          const next = { ...prev, maraton: { timeMs: total.timeMs } }
          writeSave(next)
          return next
        }
        const old = prev.rush
        const best = !relaxed && (!old || total.bosses > old.bosses || (total.bosses === old.bosses && total.timeMs < old.timeMs))
        setRushResult({ ...total, best, relaxed, kind })
        if (!best) return prev
        const next = { ...prev, rush: { timeMs: total.timeMs, bosses: total.bosses } }
        writeSave(next)
        return next
      })
      setScreen('rushEnd')
      return
    }
    const mode = modeRef.current
    if (mode?.kind === 'daily') {
      const found = w.pickups.filter((p) => p.taken).length
      const scoreMs = dailyScore(mode.run.rule, timeMs, w.deaths, found)
      const deaths = w.deaths
      setSave((prev) => {
        const mark = markDaily(prev.meydan, mode.run.day, scoreMs)
        const next = { ...prev, meydan: mark }
        writeSave(next)
        setDailyResult({ run: mode.run, timeMs, deaths, found, scoreMs, best: mark.bestMs === scoreMs, mark })
        setDailySend({ status: 'idle', rank: null })
        return next
      })
      setScreen('dailyEnd')
      return
    }
    if (mode?.kind === 'duel') {
      const d = duelRef.current
      if (!d) return
      const rounds = d.rounds.map((r) => [...r]) as DuelRounds
      rounds[d.round][d.turn] = { timeMs, deaths: w.deaths, score: duelScore(timeMs, w.deaths) }
      const other = (1 - d.turn) as 0 | 1
      if (!rounds[d.round][other]) {
        // rakip aynı turda bu koşunun hayaletiyle yarışır
        duelGhostRef.current = { hero: d.setup.heroes[d.turn], data: ghostRecRef.current }
        setDuel({ ...d, rounds, turn: other })
        setScreen('duelTurn')
      } else if (duelResult(rounds, d.setup.bestOf).over) {
        duelGhostRef.current = null
        setDuel({ ...d, rounds })
        setScreen('duelEnd')
      } else {
        duelGhostRef.current = null
        rounds.push([null, null])
        setDuel({ ...d, rounds, round: d.round + 1, turn: duelFirst(d.round + 1) })
        setScreen('duelTurn')
      }
      return
    }
    tutorialOnRef.current = false
    setTutStep(null)
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
        // ilk bölüm bitti: rehber işini yaptı
        tutorial: false,
        daily,
        weekly,
        unlocked: Math.max(prev.unlocked, Math.min(idx + 1, LEVELS.length - 1)),
        best: {
          ...prev.best,
          [w.level.id]: newBest ? { timeMs, deaths: w.deaths, items: mergedItems, v: cityVersion(w.level.id), ...(run.relaxed ? { relaxed: true } : {}) } : { ...best, items: mergedItems },
        },
      }
      writeSave(next)
      setResumeIdx(resumeFor(next))
      setResult({ timeMs, deaths: w.deaths, items, newBest, relaxed: relaxedRef.current, earned })
      return next
    })
    setScreen('complete')
  }

  const toggle = (k: 'sfx' | 'music') => {
    soundRef.current?.unlock()
    setSave((prev) => {
      const next = { ...prev, [k]: !prev[k] }
      writeSave(next)
      return next
    })
  }

  // konuşma baloncuğu: yakındaki kişinin ya da tabelanın sözü çizime bildirilir
  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    const who = npc >= 0 ? level.npcs[npc] : null
    r.dialog = who ? { kind: 'npc', name: who.name, text: who.text } : hint ? { kind: 'sign', text: hint } : null
  }, [npc, hint, level])

  // ses ayarı tek kaynaktan: kayıt hangi yoldan değişirse değişsin (düğme, bulut, giriş, sıfırlama) ses onu izler
  useEffect(() => {
    const snd = soundRef.current
    if (!snd) return
    snd.sfxOn = save.sfx
    snd.musicOn = save.music
  }, [save.sfx, save.music, ready])

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
  const introBest = save.best[level.id]?.stale ? undefined : save.best[level.id]
  /** defterde boş kalan sayfalar: hatıra + gizli pul + nazar boncuğu (şehir başına beş) */
  const notebookLeft = LEVELS.length * 5 - LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0) + (save.stamps[l.id] ? 1 : 0) + (save.charms[l.id] ? 1 : 0), 0)
  const totalFound = Object.values(save.best).reduce((a, b) => a + b.items.filter(Boolean).length, 0)

  // giriş kartının şehir bilgisi: geniş ekranda iki sütunda açık durur, dar ekranda katlanır
  const introAbout = (
    <>
      <figure className="notebook mt-1 rotate-[-0.6deg] px-4 py-3">
        <figcaption className="text-[11px] font-bold tracking-[0.22em] text-[#8a3a24]">{t("GEZGİN’İN DEFTERİNDEN")}</figcaption>
        <blockquote className="mt-1 text-[14px] italic leading-relaxed">“{level.note}”</blockquote>
      </figure>
      <p className="mt-4 text-[14px] leading-relaxed text-cream/85">{level.intro}</p>
    </>
  )
  const introFacts = (
    <>
      <Bestiary level={level} />
      <div className="mt-4 flex items-center gap-3 border-2 border-line bg-ink/40 px-3 py-2">
        <BossFigure city={level.city} className="h-[64px] w-[72px] shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-2">{t('ŞEHRİN BOSS’U')}</p>
          <p className="font-display text-xl leading-tight text-cream">{lang === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">{t('İşaretini bekle, yorulunca üstüne bas.')}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
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
    </>
  )

  // ayarlar tek yerde: Mola ve Ayarlar ekranı aynı listeyi gösterir; her seçeneğin altında ne işe yaradığı yazar
  const settingsList = (
    <div className="mt-1 grid divide-y-2 divide-line/60 short:grid-cols-2 short:gap-x-4 short:divide-y-0">
      <Toggle label={t('Ses Efektleri')} hint={t('Zıplama, toplama ve vuruş sesleri')} on={save.sfx} onChange={() => toggle('sfx')} />
      <Toggle label={t('Müzik')} hint={t('Her şehrin kendi makamında ezgisi')} on={save.music} onChange={() => toggle('music')} />
      <Toggle label={t('Dokunmatik Kontroller')} hint={t('Ekranda joystick ve tuşlar. Kapatırsan klavye ya da oyun koluyla oynarsın.')} on={showTouch} onChange={() => persist({ ...save, touch: showTouch ? 'off' : 'on' })} />
      {/* ikisi de hep listede: dokunmatik açılıp kapanınca liste zıplamasın */}
      <Toggle label={t('Tuş İpuçları')} hint={t('Klavyeyle oynarken ekranın altında tuş rehberi')} on={save.keyHints} onChange={() => persist({ ...save, keyHints: !save.keyHints })} />
      <Toggle label={t('Büyük Tuşlar')} hint={t('Dokunmatik kontrollerde daha geniş dokunma alanı')} on={save.controlSize === 'buyuk'} onChange={() => persist({ ...save, controlSize: save.controlSize === 'buyuk' ? 'normal' : 'buyuk' })} />
      <Toggle label={t('Hayalet Koşu')} hint={t('Bir şehri bitirdikten sonra, oradaki en iyi koşunun soluk hayaleti yanında koşar.')} on={save.ghost} onChange={() => persist({ ...save, ghost: !save.ghost })} />
      <Toggle label={t('Rahat Mod')} tag={save.relaxed ? t('Skor Yazılmaz') : undefined} hint={t('Oyun %80 hızda akar, zıplamaya zaman kalır. Bu modda skorlar tabloya yazılmaz.')} on={save.relaxed} onChange={() => persist({ ...save, relaxed: !save.relaxed })} />
    </div>
  )

  // Mola'daki şehir özeti: bu şehirde neler bulundu, rekor ve sıradaki madalya hedefi
  const cityBest = save.best[level.id]
  const cityMedal = cityBest && !cityBest.stale ? medalFor(level, cityBest.timeMs) : null
  const nextMedal = cityMedal === 'altin' ? null : cityMedal === 'gumus' ? 0 : cityMedal === 'bronz' ? 1 : 2
  const cityCard = (
    <div className="mt-3 border-2 border-line bg-ink/40 px-3 py-2.5 short:hidden">
      <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
        {t('BU ŞEHİRDE')} <span className="kilim h-[6px] flex-1 opacity-50" />
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {[0, 1, 2].map((k) => (
          <ItemIcon key={k} city={level.city} taken={hud.items[k] || !!cityBest?.items[k]} size={24} />
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        <ThingIcon kind="stamp" taken={!!save.stamps[level.id]} size={24} />
        <ThingIcon kind="charm" taken={!!save.charms[level.id]} size={24} />
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted">
          {save.bosses[level.id] ? t('Boss Yenildi') : t('Boss Bekliyor')}
          <BossFigure city={level.city} className={`h-8 w-9 ${save.bosses[level.id] ? '' : 'opacity-40 brightness-0'}`} />
        </span>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
        {cityBest && !cityBest.stale ? (
          <>
            <span className="flex items-center gap-1.5">
              {t('Rekorun')} <strong className="tabular-nums text-cream">{formatTime(cityBest.timeMs)}</strong>
              <MedalBadge medal={cityMedal} />
            </span>
            {nextMedal !== null && (
              <span>
                · {t('Sıradaki hedef: {m} {s} sn', { m: t(['Altın', 'Gümüş', 'Bronz'][nextMedal]), s: level.medals[nextMedal] })}
              </span>
            )}
          </>
        ) : (
          <span>{t('Henüz rekorun yok. Bronz {b} sn, gümüş {g} sn, altın {a} sn.', { b: level.medals[2], g: level.medals[1], a: level.medals[0] })}</span>
        )}
      </p>
      {modeRef.current && (
        <p className="mt-1.5 text-[12px] leading-snug text-accent-2">
          {modeRef.current.kind === 'daily' ? `${t('Günlük Meydan Okuma')} · ${t(DAILY_RULES[modeRef.current.run.rule].name)}: ${t(DAILY_RULES[modeRef.current.run.rule].text)}` : t('Düello: skor süre artı düşüş başına 5 saniye.')}
        </p>
      )}
    </div>
  )

  return (
    <LangProvider value={lang}>
    <div className="game-root">
      <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 w-full" style={{ top: 'env(safe-area-inset-top)', height: 'calc(100% - env(safe-area-inset-top))' }} aria-label={t("Oyun Alanı")} />

      {screen === 'play' && (
        <>
          <Hud level={level} hud={hud} hero={hero.id} scarf={heroScarf} showGoal={levelIdx < GOAL_CITIES && !rushRef.current && !modeRef.current}
            label={modeRef.current?.kind === 'daily' ? `${t('Günlük')} · ${t(DAILY_RULES[modeRef.current.run.rule].name)}` : modeRef.current?.kind === 'duel' && duel ? `${t('DÜELLO')} · ${duel.setup.names[duel.turn]}` : rushRef.current ? (rushRef.current.kind === 'boss' ? t('Boss Rush') : `${t('Maraton')} ${rushRef.current.i + 1}/${rushRef.current.order.length}`) : undefined}
            penaltyFor={modeRef.current?.kind === 'daily' ? ((r) => (d: number, f: number) => dailyScore(r, 0, d, f))(modeRef.current.run.rule) : modeRef.current?.kind === 'duel' ? (d: number) => duelScore(0, d) : undefined}
            onPause={() => setScreen('pause')} />
          {titleCard > 0 && hud.time < 0.05 && (
            <div key={titleCard} className={`title-card ${save.tutorial ? 'slow' : ''} pointer-events-none absolute inset-x-0 top-[30%] z-10 flex flex-col items-center ${save.tutorial ? '[@media(max-height:500px)]:top-[20%]' : '[@media(max-height:500px)]:top-[12%]'}`}>
              <div className="kilim w-[min(520px,80vw)]" />
              <p className="mt-3 text-[12px] font-bold tracking-[0.4em] text-accent-2 [text-shadow:0_2px_0_#120f1a]">
                {String(level.plate).padStart(2, '0')} · {level.subtitle.toLocaleUpperCase(lang)}
              </p>
              <p className="font-display text-6xl text-cream [text-shadow:0_4px_0_#120f1a] sm:text-7xl [@media(max-height:500px)]:text-5xl">{level.name}</p>
              {save.tutorial && !rushRef.current && !modeRef.current ? (
                <p className="mt-2 max-w-[min(520px,88vw)] px-2 text-center text-[15px] leading-snug text-gold [text-shadow:0_2px_0_#120f1a,0_0_10px_#120f1a] [text-wrap:balance] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-[13px]">{t('Gezgin’in defterini tamamla: her şehirde 3 hatıra topla, meydandaki boss’u yen.')}</p>
              ) : (
                <p className="mt-1 text-[13px] text-cream/80 [text-shadow:0_2px_0_#120f1a]">{t("Hareket Edince Süre Başlar")}</p>
              )}
              <div className="kilim mt-3 w-[min(520px,80vw)]" />
            </div>
          )}
          {/* konuşma ve tabela, kişinin başının üstünde baloncuk olarak çizilir (render.ts); burada yalnız ekran okuyucu için */}
          <p className="sr-only" role="status" aria-live="polite">
            {npc >= 0 && level.npcs[npc] ? `${level.npcs[npc].name}: ${level.npcs[npc].text}` : (hint ?? '')}
          </p>
          {npc < 0 && !hint && tutStep && !coach ? (
            <TutorialHint key={tutStep} step={tutStep} touch={showTouch} />
          ) : null}
          {quip && (
            // ölünce şehrin lafı: oynanış alanında değil, üstte HUD'ın altında; küçük ve soluk (yeniden doğuşu kapatmaz)
            <div key={quip.key} className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+66px)] z-10 flex justify-center px-4">
              <p className="rise font-display text-[13px] text-cream/75 [text-shadow:0_1px_0_#120f1a,0_0_8px_#120f1a] sm:text-sm">{quip.text}</p>
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
            <div key={cpToast.at} className={`rise pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4 ${toast ? 'top-[calc(env(safe-area-inset-top)+104px)]' : 'top-[calc(env(safe-area-inset-top)+64px)]'}`}>
              {/* sakin şerit: yarı saydam, solda ince kırmızı çizgi; göze batmaz, oynanışı kapatmaz */}
              <div className="max-w-[min(88vw,380px)] border-l-2 border-[#e30a17] bg-ink/60 px-3 py-1.5 text-left backdrop-blur-[2px]">
                <p className="flex items-center gap-1.5 font-display text-[13px] text-cream/90">
                  <span className="text-[#e30a17]">⚑</span> {t("Checkpoint")}
                </p>
                <p className="text-[12px] italic leading-snug text-gold/85 [text-wrap:balance]">{cpToast.text}</p>
              </div>
            </div>
          )}
          {showTouch && inputRef.current && <TouchControls input={inputRef.current} big={save.controlSize === 'buyuk'} canDash={hud.canDash} focus={tutStep === 'walk' ? 'stick' : tutStep === 'jump' ? 'jump' : tutStep === 'dash' ? 'dash' : null} />}
          {!showTouch && save.keyHints && !save.tutorial && <KeyHints canDash={hud.canDash} idle={hud.idle} />}
        </>
      )}

      {screen === 'title' && (mapNotice.renewed.length > 0 || mapNotice.added.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120f1a]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="harita-notu">
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 sm:p-6 short:py-3">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('DEFTERE YENİ SAYFALAR')}</p>
            <h2 id="harita-notu" className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Yolda Neler Değişti')}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/85">{t('İlerlemen yerinde: açtığın şehirler, hatıraların, pulların ve nazar boncukların duruyor. Bir şehre dokun, hemen oyna.')}</p>
            <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1">
              {(
                [
                  ['added', t('YENİ ŞEHİRLER'), t('Yola katıldı'), 'border-[#7ad88a] text-[#a8e8b2]'],
                  ['renewed', t('YENİLENEN HARİTALAR'), t('Rekorun sıfırlandı, hatıraların duruyor'), 'border-gold text-gold'],
                ] as const
              ).map(([k, title, note, tone]) =>
                mapNotice[k].length ? (
                  <div key={k} className="mb-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
                      {title} <span className="kilim h-[6px] flex-1 opacity-50" />
                    </p>
                    <p className="mt-1 text-[12px] text-muted">{note}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {mapNotice[k].map((id) => {
                        const i = LEVELS.findIndex((l) => l.id === id)
                        const locked = i > save.unlocked
                        return (
                          <button
                            key={id}
                            disabled={locked}
                            className={`group relative flex items-center gap-2 border-2 bg-ink/50 px-2.5 py-2 text-left disabled:opacity-50 ${tone} hover:bg-panel-2`}
                            onClick={() => {
                              ui()
                              persist(ackMapNews(save))
                              loadLevel(i)
                            }}
                          >
                            <span className="text-[12px] font-bold tabular-nums opacity-80">{String(LEVELS[i].plate).padStart(2, '0')}</span>
                            <span className="min-w-0 flex-1 truncate font-display text-[16px] text-cream">{displayName(LEVELS[i])}</span>
                            <span className="text-[12px]">{locked ? '🔒' : '▶'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
            <button className="pixel-btn primary mt-3 justify-center text-base" autoFocus onClick={() => (ui(), persist(ackMapNews(save)))}>
              {t('Tamam, Menüye Dön')}
            </button>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <Overlay>
          <div className="rise flex w-full max-w-3xl flex-col items-center gap-0 md:flex-row md:items-center [@media(max-height:500px)_and_(min-width:560px)]:flex-row [@media(max-height:500px)_and_(min-width:560px)]:items-start">
            {/* polaroid yalnız yer olan ekranda: alçak ve dar ekranda menü kaydırmadan sığsın diye gizlenir */}
            <div className="relative h-[170px] w-full max-w-[320px] shrink-0 sm:h-[300px] short:hidden [@media(max-width:639px)_and_(max-height:820px)]:hidden md:mr-[-28px] md:h-[360px] md:w-[320px] [@media(max-height:500px)_and_(min-width:560px)]:mr-[-20px] [@media(max-height:500px)_and_(min-width:560px)]:h-[240px] [@media(max-height:500px)_and_(min-width:560px)]:w-[190px]">
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
            <div className="pixel-panel relative z-10 w-full max-w-md overflow-hidden px-6 pb-4 sm:px-7 sm:pb-6 short:grid short:max-w-[min(780px,100%)] short:grid-cols-2 short:gap-x-6 short:pb-4">
              {/* alçak ekranda (yatay telefon) iki sütun: solda tanıtım, Devam ve hesap; sağda menü */}
              <div className="relative -mx-7 -mt-[calc(14px+1.25rem)] mb-4 h-[120px] overflow-hidden short:col-span-2 short:mb-2 short:h-[58px] [@media(min-height:501px)_and_(max-height:780px)]:h-[100px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sehirler/istanbul.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_75%]" style={{ imageRendering: 'pixelated' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e1a29]/20 to-[#1e1a29]" />
                <div className="kilim absolute inset-x-0 top-0" />
                <div className="absolute bottom-1 left-7 flex items-end gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-emblem.png" width={56} height={56} alt="" className="mb-1 drop-shadow-[0_3px_0_#120f1a] short:h-10 short:w-10" />
                  <h1 className="font-display text-5xl leading-none text-cream [text-shadow:0_4px_0_#120f1a] sm:text-6xl short:text-4xl">Sek-Sek</h1>
                </div>
              </div>
              <div className={`short:col-start-1 short:row-start-2 ${isFresh(save) ? 'short:hidden' : 'short:hidden [@media(min-height:501px)_and_(max-height:780px)]:hidden'}`}>
                <p className="text-[15px] leading-relaxed text-cream/85 short:text-[14px] short:leading-snug">{t("Gezgin’in yarım kalmış defterini tamamla.")}</p>
                <p className="hidden text-[14px] leading-relaxed text-muted sm:block short:hidden">{lang === 'en' ? `${LEVELS.length} cities. ${LEVELS.length * 3} keepsakes. One journey.` : `${trCount(LEVELS.length)} şehir. ${trCount(LEVELS.length * 3)} hatıra. Tek yolculuk.`}</p>
              </div>
              <button className={`pixel-btn primary w-full justify-center text-base short:col-start-1 short:row-start-3 short:mt-3 ${isFresh(save) ? 'mt-4 sm:mt-5' : 'mt-4 sm:mt-5 [@media(min-height:501px)_and_(max-height:780px)]:mt-0'}`} onClick={startJourney} autoFocus>
                ▶ {save.unlocked > 0 || resumeIdx > 0 ? t('Devam Et: {city}', { city: LEVELS[resumeIdx].name }) : t('Yolculuğa Başla')}
              </button>
              <div className="mt-2 sm:mt-2.5 short:col-start-2 short:row-span-3 short:row-start-2 short:mt-0 short:self-start">
                {/* bugünün meydan okuması: tek satırlık çağrı (yalnız yolculuğa başlamış oyuncuya) */}
                {!isFresh(save) && (
                  <button className="mb-2 flex w-full items-center gap-2.5 border-2 border-gold/70 bg-gold/5 px-2.5 py-1.5 text-left hover:bg-gold/10 sm:mb-2.5 short:hidden" onClick={() => (ui(), setScreen('modes'))}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a2438] shadow-[0_0_0_2px_#d9a441]">
                      <ItemIcon city={dailyLevel.city} taken size={22} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block whitespace-nowrap text-[11px] font-bold tracking-[0.1em] text-gold">{t('BUGÜNÜN MEYDAN OKUMASI')}</span>
                      <span className="block truncate text-[13px] text-cream">
                        {dailyLevel.name} · {t(DAILY_RULES[daily.rule].name)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] tabular-nums text-muted">
                      {save.meydan?.day === today ? <span className="text-[#7ad88a]">✓ {formatTime(save.meydan.bestMs)}</span> : <span className="text-accent-2">{t('Bugün Oyna')} ▶</span>}
                      {liveStreak(save.meydan, today) > 1 && <span className="block">🔥 {liveStreak(save.meydan, today)}</span>}
                    </span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 short:gap-2">
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('map'))}>
                    {t("Şehirler")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('notebook'))}>
                    {t("Defter")}
                  </button>
                  <button
                    className="pixel-btn justify-center"
                    onClick={() => {
                      ui()
                      pickThenPlayRef.current = false
                      setScreen('character')
                    }}
                  >
                    {t("Karakter")}
                  </button>
                  <button className="pixel-btn relative justify-center" onClick={() => (ui(), setScreen('modes'))}>
                    {t('Modlar')}
                    {!isFresh(save) && save.meydan?.day !== today && <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_2px_#120f1a]" aria-label={t('Bugünün meydan okuması seni bekliyor')} />}
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
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setBoardTab('genel'), setScreen('scores'))}>
                    {t("Skorlar")}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => (ui(), setScreen('controls'))}>
                    {t('Ayarlar')}
                  </button>
                  <button className="pixel-btn justify-center" onClick={() => toggle('music')}>
                    {t('Müzik')} {save.music ? t('Açık') : t('Kapalı')}
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 border-t-2 border-line pt-2.5 text-[12px] text-muted sm:mt-4 sm:pt-3 short:col-start-1 short:row-start-4 short:mt-3 short:self-end">
                {!save.player && (
                  // misafir: hesap çağrısı belirgin bir kart (küçük bir bağlantı değil); ilerlemesi varsa kaybolabileceği söylenir
                  <div className="flex items-center justify-between gap-3 bg-[#2a2236] px-3 py-2 [box-shadow:inset_0_0_0_2px_#d9a441]">
                    <span className="min-w-0 leading-snug">
                      <span className="block text-[12px] font-semibold text-cream sm:text-[13px]">
                        <span className="text-gold">☁</span> {save.unlocked > 0 || Object.keys(save.best).length > 0 ? t('İlerlemen yalnız bu tarayıcıda') : t('Hesabınla her cihazdan devam et')}
                      </span>
                      <span className="hidden text-[12px] text-muted sm:block short:hidden">{t('Hesap aç, defterin hiç kaybolmasın.')}</span>
                    </span>
                    <button className="pixel-btn primary shrink-0 whitespace-nowrap px-3 py-1.5 text-[13px]" onClick={() => (ui(), setScreen('name'))}>
                      <span className="sm:hidden">{t('Giriş Yap')}</span>
                      <span className="hidden sm:inline">{t('Giriş Yap / Üye Ol')}</span>
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  {save.player ? (
                    <button className="flex items-center gap-1.5 text-left underline-offset-4 hover:text-cream hover:underline" onClick={() => (ui(), setScreen('name'))}>
                      <span className="text-gold">◆</span>
                      <span>
                        {t("Hesap:")} <strong className="font-semibold text-cream">{save.player.name}</strong> <span className="text-gold">· {t(travelerTitle(titleFacts(save, today)))}</span> <span className="text-[#7ad88a]">· {t('İlerleme Hesabında')}</span>
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="flex items-center gap-3 tabular-nums short:hidden">
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
          <div className="rise pixel-panel w-full max-w-2xl p-4 sm:p-6 short:py-3 wide:max-w-[min(1120px,100%)] wide:px-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("YOL ARKADAŞIN")}</p>
                <h2 className="mt-1 font-display text-2xl text-cream sm:text-4xl short:text-2xl">{t("Karakterini Seç")}</h2>
              </div>
              {save.character && (
                <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                  {t("← Geri")}
                </button>
              )}
            </div>
            {/* iki kart her ekranda yan yana: telefonda küçülür, alçak ekranda yatay dizilir; sayfa kaymaz */}
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3 short:mt-2">
              {(['uktun', 'memo'] as const).map((id) => {
                const c = CHARACTERS[id]
                const on = save.character === id
                return (
                  <button
                    key={id}
                    onClick={() => pickCharacter(id)}
                    className={`group flex min-w-0 flex-col items-center border-2 bg-panel-2 p-2.5 text-left transition-colors duration-150 sm:p-4 short:flex-row short:items-stretch short:gap-3 short:p-2.5 wide:flex-row wide:items-stretch wide:gap-4 hover:border-accent-2 focus-visible:outline-2 focus-visible:outline-gold ${on ? 'border-gold' : 'border-line'}`}
                  >
                    <div className="portrait-frame mx-auto w-full max-w-[150px] shrink-0 sm:w-[220px] sm:max-w-none short:mx-0 short:w-[96px] short:self-center wide:mx-0 wide:w-[190px] wide:self-center">
                      <Portrait id={id} scarf={heroScarf} className="block w-full" />
                    </div>
                    <div className="mt-2 flex w-full min-w-0 flex-col short:mt-0 wide:mt-0">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-2 font-display text-lg text-cream sm:text-2xl short:text-lg">
                        {c.name}
                        <span className="text-[11px] font-bold tracking-[0.18em] text-accent sm:text-[12px]">{(characterFor(lang, id)?.role ?? c.role).toLocaleUpperCase(lang)}</span>
                      </p>
                      <p className="mt-1 line-clamp-4 text-[12px] leading-snug text-muted sm:line-clamp-none sm:text-[13px] short:line-clamp-3 short:text-[12px]">{characterFor(lang, id)?.bio ?? c.bio}</p>
                      <p className="pixel-btn primary mt-2 w-full justify-center py-1.5 text-[12px] sm:mt-3 sm:py-2 sm:text-sm short:mt-auto short:py-1.5 short:text-[12px] wide:mt-auto">{on ? t('Seçili') : t('{name} ile Yola Çık', { name: c.name })}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold sm:mt-4 short:mt-2">
              {t("ATKI RENGİ")}
              <span className="font-normal tracking-normal text-cream sm:hidden short:inline">· {lang === 'en' ? scarfFor(save.scarf).nameEn : scarfFor(save.scarf).name}</span>
              <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2 short:mt-1.5">
              {SCARVES.map((sc) => {
                const open = charmCount >= sc.need
                const on = scarfFor(save.scarf).id === sc.id
                return (
                  <button
                    key={sc.id}
                    disabled={!open}
                    aria-pressed={on}
                    onClick={() => (ui(), persist({ ...save, scarf: sc.id }))}
                    title={open ? (lang === 'en' ? sc.nameEn : sc.name) : t('{n} nazar boncuğu bulunca açılır', { n: sc.need })}
                    aria-label={lang === 'en' ? sc.nameEn : sc.name}
                    className={`flex items-center gap-2 border-2 bg-panel-2 px-1.5 py-1.5 text-[11px] sm:px-2.5 sm:text-[12px] short:px-1.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-gold ${on ? 'border-gold text-cream' : 'border-line text-muted hover:border-accent-2'} ${open ? '' : 'opacity-45'}`}
                  >
                    <span className="h-5 w-5 border-2 border-ink sm:h-4 sm:w-4" style={{ background: `linear-gradient(135deg, ${sc.color} 55%, ${sc.shade} 55%)` }} />
                    <span className="max-sm:hidden short:hidden">{lang === 'en' ? sc.nameEn : sc.name}</span>
                    {!open && <span className="tabular-nums max-sm:hidden short:hidden">· {charmCount}/{sc.need}</span>}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[12px] text-muted short:hidden">{t("Yeni renkler, şehirlerde saklı nazar boncuklarını buldukça açılır.")}</p>
          </div>
        </Overlay>
      )}

      {screen === 'name' && (
        <Overlay>
          <div className="rise pixel-panel max-h-[calc(100dvh-32px)] w-full max-w-md overflow-y-auto px-6 pb-5 short:max-w-[min(760px,100%)] short:px-5">
            <div className="short:grid short:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] short:gap-6">
              <div>
                <div className="flex items-end gap-4">
                  <figure className="polaroid relative w-[60px] shrink-0 rotate-[-5deg] sm:w-[88px] short:hidden">
                    <span className="tape" />
                    <Portrait id={hero.id} scarf={heroScarf} className="w-full" />
                    <figcaption>{hero.short}</figcaption>
                  </figure>
                  <div className="min-w-0 pb-1">
                    <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{save.player ? t('HESABIM') : t('DEFTERİN SAHİBİ')}</p>
                    <h2 className="mt-1 font-display text-[26px] leading-tight text-cream [overflow-wrap:anywhere]">
                      {save.player ? save.player.name : authMode === 'login' ? t('Tekrar Hoş Geldin') : t('Defterini Kaydet')}
                    </h2>
                    {save.player && <p className="mt-1 text-[12px] text-[#7ad88a]">☁ {t('İlerlemen hesabında kayıtlı')}</p>}
                  </div>
                </div>
                {save.player ? (
                  // hesabın özeti: neyi taşıdığı bir bakışta
                  <div className="mt-4 grid grid-cols-4 gap-1.5 text-center">
                    {([
                      [Math.min(save.unlocked + 1, LEVELS.length), t('Açık Şehir')],
                      [totalFound, t('Hatıra')],
                      [Object.values(save.stamps ?? {}).filter(Boolean).length, t('Gizli Pul')],
                      [Object.values(save.charms ?? {}).filter(Boolean).length, t('Nazar')],
                    ] as const).map(([n, label]) => (
                      <div key={label} className="bg-ink/50 px-1 py-2 [box-shadow:inset_0_0_0_2px_#3d3550]">
                        <p className="font-display text-lg leading-none text-cream tabular-nums">{n}</p>
                        <p className="mt-1 text-[11px] leading-tight text-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // hesap ne kazandırır: üç kısa madde
                  <ul className="mt-3 grid gap-1 text-[13px] text-cream/90 sm:mt-4 sm:gap-1.5">
                    <li className="flex items-center gap-2"><span className="w-5 text-center text-gold">☁</span>{t('İlerleme hesabında kalır')}</li>
                    <li className="flex items-center gap-2"><span className="w-5 text-center text-gold">★</span>{t('Süren skor tablosuna girer')}</li>
                    <li className="flex items-center gap-2"><span className="w-5 text-center text-gold">⇄</span>{t('Her cihazdan kaldığın yerden')}</li>
                  </ul>
                )}
                {/* yatay telefonda alt şerit sol sütunda: sağdaki form ekrana sığsın */}
                {!save.player && guestFooter('mt-4 hidden short:flex')}
              </div>
              <div className="mt-4 sm:mt-5 short:mt-0">
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
                    <div className="flex items-center justify-between gap-3 border-t-2 border-line pt-3">
                      <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => (setConfirmOut(false), setScreen('title'))}>
                        {t('← Geri')}
                      </button>
                      {confirmOut ? (
                        // çıkışta onay: yanlışlıkla basılmasın
                        <span className="flex items-center gap-2 text-[12px] text-muted">
                          {t('İlerlemen hesabında kalır.')}
                          <button className="pixel-btn px-3 py-1.5 text-[12px] text-accent-2" onClick={() => (setConfirmOut(false), void signOut())}>
                            {t('Çıkış Yap')}
                          </button>
                        </span>
                      ) : (
                        <button className="pixel-btn px-3 py-1.5 text-[12px]" onClick={() => setConfirmOut(true)}>
                          {t('Çıkış Yap')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <AuthForm
                      suggestion={hero.short}
                      onMode={setAuthMode}
                      onDone={(p: Player) => {
                        ui()
                        afterName({ ...save, player: p, skippedName: false })
                      }}
                    />
                    {guestFooter('mt-4 flex short:hidden')}
                  </>
                )}
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'story' && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-lg p-4 sm:p-6 short:grid short:max-w-[min(820px,100%)] short:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] short:gap-x-6 short:py-3" key={storyPage}>
            {/* alçak ekranda (yatay telefon) iki sütun: solda defter, sağda metin ve düğmeler */}
            <div className="flex items-center justify-between short:col-span-2">
              <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t("YOL DEFTERİ")}</p>
              <p className="text-[11px] tabular-nums text-muted">
                {storyPage + 1} / {STORY.length}
              </p>
            </div>
            <div className="mt-2 flex items-end gap-4 sm:mt-3 short:row-span-3 short:mt-2 short:self-start">
              <div className="portrait-frame w-[90px] shrink-0 sm:w-[130px] short:hidden">
                <Portrait id={hero.id} scarf={heroScarf} className="block w-full" />
              </div>
              <Notebook page={storyPage} />
            </div>
            <h2 className="mt-3 font-display text-2xl text-cream sm:text-3xl short:col-start-2 short:row-start-2 short:mt-2 short:text-2xl">{(storyFor(lang) ?? STORY)[storyPage].title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/90 sm:text-[15px] short:col-start-2 short:row-start-3 short:text-[14px] short:leading-snug">{fill((storyFor(lang) ?? STORY)[storyPage].text, hero.short)}</p>
            <div className="mt-4 flex gap-2.5 sm:mt-5 short:col-start-2 short:row-start-4 short:mt-3 short:self-end">
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
                {storyPage + 1 < STORY.length ? t('▶ Devam') : t('▶ Yola Çık')}
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
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-4 sm:p-6 short:py-3 side:max-w-[min(1440px,100%)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-cream short:text-2xl">{t("Şehirler")}</h2>
              <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            {/* geniş ekranda: solda görevler ve ekran boyunun izin verdiği en büyük harita; sağdaki liste haritanın boyunda, kendi içinde kayar */}
            {/* dar ekranda görevler, harita ve liste tek bir alanda birlikte kayar (başlık yerinde kalır); kenarlar yumuşakça solar */}
            <div className="overlay-scroll fade-edges -mx-2 mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 side:mx-0 side:mt-3 side:grid side:grid-cols-[auto_minmax(240px,1fr)] side:gap-5 side:overflow-visible side:px-0 side:pb-0 side:[mask-image:none] short:mt-2 short:gap-3">
              <div className="min-w-0 wide:w-[min(calc((100dvh-260px)*2.08),calc(100vw-480px),1040px)] short:w-[min(calc((100dvh-120px)*2.08),calc(100vw-320px))]">
                <div className="mt-3 grid gap-2 sm:grid-cols-2 side:mt-0 short:hidden">
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
                <div className="mt-3 short:mt-0">
                  <TurkeyMap unlocked={save.unlocked} selected={levelIdx} onSelect={(i) => loadLevel(i)} />
                </div>
              </div>
              <div className="relative mt-4 side:mt-0 side:flex side:min-h-[160px] side:flex-1 side:flex-col">
                <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5 short:hidden">
                  <span className="text-[11px] font-bold tracking-[0.18em] text-gold">{t('Bütün Şehirler')}</span>
                  <span className="text-[12px] text-muted tabular-nums">{t('{n}/{total} Geçildi', { n: LEVELS.filter((l) => save.best[l.id]).length, total: LEVELS.length })}</span>
                </div>
                <div className="side:relative side:min-h-[120px] side:flex-1">
                <ul className="overlay-scroll grid grid-cols-1 content-start gap-2.5 sm:grid-cols-2 side:absolute side:inset-0 side:grid-cols-1 side:overflow-y-auto side:pr-1">
                  {LEVELS.map((l, i) => {
                    const locked = i > save.unlocked
                    const best = save.best[l.id]
                    const found = best?.items.filter(Boolean).length ?? 0
                    return (
                      <li key={l.id}>
                        <button className="pixel-btn w-full items-stretch gap-0 overflow-hidden p-0 text-left" disabled={locked} onClick={() => loadLevel(i)}>
                          <span className="relative w-[92px] short:w-[60px] shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/sehirler/${l.id}.webp`} alt="" className={`h-full w-full object-cover ${locked ? 'opacity-30 grayscale' : ''}`} style={{ imageRendering: 'pixelated' }} />
                            <span className="plate absolute bottom-1 left-1 text-[11px]">
                              <span>{String(l.plate).padStart(2, '0')}</span>
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5 short:px-2.5">
                            <span className="min-w-0">
                              <span className="block font-display text-base leading-tight break-words">{displayName(l)}</span>
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
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'intro' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md overflow-clip px-6 wide:max-w-[min(1040px,100%)] wide:px-8">
            <CityBanner level={level} index={levelIdx} total={LEVELS.length} height={120} short={84} wide={150} />
            <div className="wide:grid wide:grid-cols-[1.1fr_1fr] wide:gap-8">
              <div className="min-w-0">
                <p className="-mt-1 text-sm text-muted [@media(max-height:500px)]:hidden">{level.subtitle}</p>
                <p className="mt-3 flex [@media(max-height:500px)]:mt-0 items-center gap-2.5 text-[15px] leading-snug text-cream">
                  <ItemIcon city={level.city} taken size={28} />
                  <span>{t('Üç {item} topla, meydandaki boss’u yen.', { item: level.item })}</span>
                </p>
                {introBest && (
                  <p className="mt-2 flex items-center gap-2 text-[13px] text-muted tabular-nums">
                    {t('En İyi Süre')} <strong className="text-cream">{formatTime(introBest.timeMs)}</strong>
                    <MedalBadge medal={medalFor(level, introBest.timeMs)} />
                    <span>· {introBest.items.filter(Boolean).length}/3</span>
                  </p>
                )}
                <div className="mt-5 hidden wide:block">{introAbout}</div>
              </div>
              <div className="hidden min-w-0 wide:block [&>*:first-child]:mt-0">{introFacts}</div>
            </div>
            <details className="intro-more mt-3 border-2 [@media(max-height:500px)]:mt-2 border-line bg-ink/40 wide:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13px] font-bold text-cream">
                {t('Şehir Hakkında')}
                <span aria-hidden className="intro-more-arrow text-muted">▾</span>
              </summary>
              <div className="px-3 pb-3">
                {introAbout}
                {introFacts}
              </div>
            </details>
            <div className="sticky bottom-0 z-10 -mx-6 mt-4 grid grid-cols-[1fr_auto] wide:-mx-8 wide:mt-6 wide:flex wide:justify-end wide:px-8 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-2 gap-3 border-t-2 border-line bg-[#1e1a29]/95 px-6 py-3 [padding-bottom:max(12px,env(safe-area-inset-bottom))]">
              <button className="pixel-btn primary justify-center py-3 text-lg wide:min-w-[360px]" onClick={beginPlay} autoFocus>
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
          <div className="rise pixel-panel overlay-scroll max-h-[calc(100dvh-32px)] w-full max-w-md overflow-x-clip overflow-y-auto px-6 pb-5 short:max-w-[min(820px,100%)] short:pb-3 wide:max-w-[min(900px,100%)] wide:px-8 wide:pb-7">
            <CityBanner level={level} eyebrow={t("MOLA")} height={110} short={64} />
            {/* geniş ekranda ve yatay telefonda: solda süre ve eylemler, sağda ayarlar (kaydırmadan) */}
            <div className="side:grid side:grid-cols-2 side:gap-8 short:gap-5">
              {/* dar ekranda (dikey telefon) ayarlar ayrı görünümdür: Mola tek bakışta sığar */}
              <div className={`min-w-0 ${pauseSet ? 'hidden side:block' : ''}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    [formatTime(hud.time * 1000), t('Süre')],
                    [String(hud.deaths), t('Düşüş')],
                    [`${hud.items.filter(Boolean).length}/3`, t('Hatıra')],
                  ].map(([v, k]) => (
                    <div key={k} className="border-2 border-line bg-ink/40 py-2">
                      <p className="font-display text-xl leading-none text-cream tabular-nums">{v}</p>
                      <p className="mt-1 text-[11px] text-muted">{k}</p>
                    </div>
                  ))}
                </div>
                <button className="pixel-btn primary mt-4 w-full justify-center py-3 text-lg short:mt-2.5 short:py-2" onClick={() => setScreen('play')} autoFocus>
                  {t("▶ Devam Et")}
                </button>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 short:mt-2.5 short:grid-cols-4 short:gap-2">
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
                  <button className="pixel-btn flex-col justify-center gap-1 px-1 py-2.5 text-[12px]" onClick={() => setScreen('title')}>
                    <span className="text-lg leading-none">⌂</span>
                    {t('Ana Menü')}
                  </button>
                </div>
                {cityCard}
                <button className="pixel-btn mt-3 w-full justify-center py-2 text-[13px] side:hidden" onClick={() => setPauseSet(true)}>
                  {t('⚙ Ayarlar')}
                </button>
              </div>
              <div className={`min-w-0 side:mt-0 side:block ${pauseSet ? '' : 'hidden'}`}>
                <button className="pixel-btn mb-3 w-full justify-center py-2 text-[13px] side:hidden" onClick={() => setPauseSet(false)}>
                  {t('← Mola')}
                </button>
                <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
                  {t("AYARLAR")} <span className="kilim h-[6px] flex-1 opacity-50" />
                </p>
                {settingsList}
                {canFull && (
                  <button className="mt-2 text-[12px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={fullscreen}>
                    {t("⛶ Tam Ekrana Geç")}
                  </button>
                )}
              </div>
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
          nextIdx={levelIdx + 1 < LEVELS.length ? levelIdx + 1 : nextUnplayed(save, levelIdx)}
          onNext={() => {
            // sondaki şehirden sonra: oynanmamış bir şehir varsa ona, yoksa defterin sonuna
            const n = levelIdx + 1 < LEVELS.length ? levelIdx + 1 : nextUnplayed(save, levelIdx)
            if (n === null) setScreen('end')
            else loadLevel(n)
          }}
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
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 sm:p-6 short:max-w-[min(720px,100%)] short:py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-cream short:text-2xl">{t("Skor Tablosu")}</h2>
              <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            <ScoreBoard me={save.player?.name ?? ''} startCity={levelIdx} startTab={boardTab} onDaily={startDaily} />
          </div>
        </Overlay>
      )}

      {screen === 'controls' && (
        <Overlay>
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 sm:p-6 short:max-w-[min(860px,100%)] short:py-3 wide:max-w-[min(1040px,100%)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.3em] text-accent max-sm:hidden short:hidden">{t('OYUNU KENDİNE GÖRE KUR')}</p>
                <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Ayarlar')}</h2>
              </div>
              <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                {t("← Geri")}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 wide:hidden" role="tablist">
              {([['ayar', t('Oyun')], ['tus', t('Kontroller')]] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={setTab === k} className={`pixel-btn justify-center py-1.5 text-[13px] ${setTab === k ? 'primary' : ''}`} onClick={() => setSetTab(k)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="overlay-scroll -mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1 wide:grid wide:grid-cols-2 wide:gap-8">
            <div className={`${setTab === 'ayar' ? '' : 'hidden'} wide:block`}>
              <p className="hidden items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold wide:flex">
                {t('OYUN')} <span className="kilim h-[6px] flex-1 opacity-50" />
              </p>
              {settingsList}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-line/60 pt-2.5">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-cream">
                  {t('Dil')}
                  <span className="flex items-center gap-1" role="group" aria-label={t('Dil')}>
                    {(['tr', 'en'] as const).map((l) => (
                      <button key={l} aria-pressed={lang === l} className={`min-h-[32px] min-w-[40px] px-2.5 py-1.5 text-[12px] font-bold tracking-wider ${lang === l ? 'bg-gold text-ink' : 'text-muted hover:text-cream'}`} onClick={() => (ui(), persist({ ...save, lang: l }))}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </span>
                </span>
                {canFull && (
                  <button className="pixel-btn px-3 py-1.5 text-[12px]" onClick={fullscreen}>
                    {t('⛶ Tam Ekrana Geç')}
                  </button>
                )}
              </div>
              <button className="mt-2 text-[12px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={() => (ui(), persist({ ...save, tutorial: true }))} disabled={save.tutorial}>
                {save.tutorial ? t('Rehber açık: sıradaki oyunda adım adım gösterilecek.') : t('Oyun içi rehberi yeniden göster')}
              </button>
            </div>
            <div className={`${setTab === 'tus' ? '' : 'hidden'} wide:block`}>
              <p className="hidden items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold wide:flex">
                {t('KONTROLLER')} <span className="kilim h-[6px] flex-1 opacity-50" />
              </p>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 short:mt-2 short:grid-cols-3 short:gap-5 short:text-[13px]">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 short:gap-y-1">
                <dt className="font-display text-gold">{t("Klavye")}</dt>
                <dd />
                <dt className="text-muted">{t("Yürü")}</dt>
                <dd>← → / A D</dd>
                <dt className="text-muted">{t("Zıpla")}</dt>
                <dd>↑ / W / Z</dd>
                <dt className="text-muted">{t("Dash")}</dt>
                <dd className="text-gold">{t('Boşluk / X')}</dd>
                <dt className="text-muted">{t('İnce Platformdan İn')}</dt>
                <dd>↓</dd>
                <dt className="text-muted">{t("Mola")}</dt>
                <dd>Esc / P</dd>
                <dt className="text-muted">{t('Checkpoint’e Dön')}</dt>
                <dd>R</dd>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 short:gap-y-1">
                <dt className="font-display text-gold">{t("Dokunmatik")}</dt>
                <dd />
                <dt className="text-muted">{t("Sol Yarı")}</dt>
                <dd>{t("Joystick, nereye dokunursan orada")}</dd>
                <dt className="text-muted">{t("Zıpla")}</dt>
                <dd>{t("Uzun bas, daha yükseğe")}</dd>
                <dt className="text-muted">{t("Dash")}</dt>
                <dd>{t("Joystick yönünde")}</dd>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-1.5 [@media(min-width:640px)_and_(min-height:501px)]:col-start-2">
                <dt className="font-display text-gold">{t("Oyun Kolu")}</dt>
                <dd />
                <dt className="text-muted">A / Y</dt>
                <dd>{t("Zıpla")}</dd>
                <dt className="text-muted">X / B / RT</dt>
                <dd>{t("Dash")}</dd>
              </dl>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted short:mt-2 short:leading-snug">
              {t("Duvara doğru basılı tutup zıplarsan tırmanırsın. Dash yere değince ya da düşmana basınca yenilenir: atkın kırmızıysa hazır, griyse harcandı.")}
            </p>
            </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'notebook' && <Defter save={save} today={today} onClose={() => setScreen('title')} onModes={() => setScreen('modes')} />}

      {screen === 'modes' && (
        <ModesHub
          daily={daily}
          mark={save.meydan}
          today={today}
          bossesBeaten={beaten}
          rushNeeds={RUSH_NEEDS}
          rushBest={save.rush}
          onDaily={startDaily}
          onDailyBoard={() => (ui(), setBoardTab('gunluk'), setScreen('scores'))}
          onDuel={() => (ui(), setScreen('duelSetup'))}
          onRush={startRush}
          marathonOpen={save.unlocked + 1 >= MARATHON_CITIES}
          marathonBest={save.maraton ?? null}
          onMarathon={startMarathon}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'dailyEnd' && dailyResult && (
        <DailyEnd result={dailyResult} player={save.player?.name ?? ''} status={dailySend.status} rank={dailySend.rank} onRetry={startDaily} onModes={() => setScreen('modes')} onLogin={() => ((returnRef.current = 'dailyEnd'), setScreen('name'))} />
      )}

      {screen === 'duelSetup' && (
        <DuelSetup
          initial={duel?.setup ?? { level: Math.min(levelIdx, save.unlocked), names: [save.player?.name ?? hero.short, lang === 'en' ? 'Guest' : 'Misafir'], heroes: [hero.id, hero.id === 'uktun' ? 'memo' : 'uktun'], bestOf: 1, style: coarse ? 'sirayla' : 'yanyana' }}
          unlocked={save.unlocked}
          canSide={!coarse}
          onStart={duelStart}
          onBack={() => setScreen('modes')}
        />
      )}

      {screen === 'duelTurn' && duel && <DuelTurn setup={duel.setup} rounds={duel.rounds} round={duel.round} turn={duel.turn} onGo={duelGo} onQuit={() => setScreen('modes')} />}

      {screen === 'race' && duel && (
        <Race
          key={duel.round}
          level={LEVELS[duel.setup.level]}
          names={duel.setup.names}
          heroes={duel.setup.heroes}
          roundLabel={duel.setup.bestOf === 1 ? t('TEK TUR') : t('{n}. TUR', { n: duel.round + 1 })}
          sound={soundRef.current}
          onDone={raceDone}
          onQuit={() => setScreen('modes')}
        />
      )}

      {screen === 'duelEnd' && duel && <DuelEnd setup={duel.setup} rounds={duel.rounds} onRematch={() => duelStart(duel.setup)} onSetup={() => setScreen('duelSetup')} onMenu={() => setScreen('modes')} />}

      {screen === 'rushEnd' && rushResult && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{rushResult.best ? t('YENİ REKOR') : rushResult.kind === 'boss' ? t('BOSS RUSH') : t('MARATON')}</p>
            <h2 className="mt-2 font-display text-6xl tabular-nums text-cream">{formatTime(rushResult.timeMs)}</h2>
            <p className="mt-2 text-[13px] text-muted">{rushResult.kind === 'boss' ? t('{n} boss · {deaths} düşüş', { n: rushResult.bosses, deaths: rushResult.deaths }) : t('{n} şehir · {deaths} düşüş', { n: rushResult.bosses, deaths: rushResult.deaths })}</p>
            {rushResult.relaxed && <p className="mt-2 text-[12px] text-muted">{t("Rahat Mod’da koştun: rekor yazılmadı.")}</p>}
            {!rushResult.best && !rushResult.relaxed && rushResult.kind === 'boss' && save.rush && <p className="mt-2 text-[12px] text-muted">{t('Rekor: {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })}</p>}
            {!rushResult.best && !rushResult.relaxed && rushResult.kind === 'maraton' && save.maraton && <p className="mt-2 text-[12px] text-muted">{t('Maraton rekorun: {time}', { time: formatTime(save.maraton.timeMs) })}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={rushResult.kind === 'boss' ? startRush : startMarathon} autoFocus>
                {t("↺ Yeniden Koş")}
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('modes')}>
                {t('Modlar')}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'end' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <div className="flex justify-center">
              <div className="portrait-frame w-[180px] max-sm:w-[120px] short:hidden">
                <Portrait id={hero.id} scarf={heroScarf} className="block w-full" />
              </div>
            </div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{notebookLeft === 0 ? t('DEFTER EKSİKSİZ TAMAM') : t('YOLUN SONU')}</p>
            <h2 className="mt-2 font-display text-4xl text-cream">{(endingFor(lang) ?? ENDING).title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/90">{fill((endingFor(lang) ?? ENDING).text, hero.short)}</p>
            <p className="mt-3 text-[12px] text-muted">
              {t('{n} / {total} hatıra · Toplam en iyi süre {time}', { n: totalFound, total: LEVELS.length * 3, time: formatTime(Object.values(save.best).reduce((a, b) => a + (b.stale ? 0 : b.timeMs), 0)) })}
            </p>
            {notebookLeft > 0 && (
              <p className="mt-2 border-2 border-dashed border-gold/60 px-3 py-2 text-[13px] leading-snug text-gold">
                {t('Yol bitti ama defter henüz dolmadı: {n} sayfa boş (hatıra, gizli pul, nazar boncuğu). Defteri Yol Defteri’nden izle, eksik şehirlere dön.', { n: notebookLeft })}
              </p>
            )}
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

const GOAL_TEXT: Record<Goal, string> = { square: 'Meydana Git', boss: 'Boss’u Yen', exit: 'Çıkışa Git' }

function Hud({ level, hud, hero, scarf, showGoal, penaltyFor, label, onPause }: { scarf: { color: string; shade: string } | null; level: (typeof LEVELS)[number]; hud: HudState; hero: CharacterId; showGoal: boolean; /** modlarda süreye eklenen ceza (ms) */ penaltyFor?: (deaths: number, found: number) => number; /** şehir adının altındaki satır (mod adı); yoksa zorluk */ label?: string; onPause: () => void }) {
  const t = useT()
  const lng = useLang()
  const shown = hud.time * 1000
  const penalty = penaltyFor ? penaltyFor(hud.deaths, hud.items.filter(Boolean).length) : 0
  // madalya temposu yalnız şehir koşusunda: altın, gümüş, bronz; süre geçince söner
  const pace = penaltyFor || label ? null : shown <= level.medals[0] * 1000 ? '#f2c14e' : shown <= level.medals[1] * 1000 ? '#d7dde6' : shown <= level.medals[2] * 1000 ? '#d08a52' : null
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
          <p className={`truncate text-[11px] font-bold tracking-[0.06em] ${label ? 'text-accent-2' : 'text-muted'}`}>{(label ?? level.nickname ?? t(level.difficulty)).toLocaleUpperCase(lng)}</p>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 bg-ink/80 px-2 py-2 text-sm font-semibold tabular-nums text-cream [box-shadow:0_0_0_2px_rgba(61,53,80,0.8)] sm:gap-3 sm:px-3">
          {showGoal && (
            <span key={hud.goal} className="rise whitespace-nowrap border-r-2 border-line pr-2 text-[12px] font-bold text-gold sm:pr-3 sm:text-[13px]" role="status">
              {t(GOAL_TEXT[hud.goal])}
            </span>
          )}
          <span className="flex gap-1" aria-label={t('{n} / 3 hatıra', { n: hud.items.filter(Boolean).length })}>
            {hud.items.map((v, i) => (
              <ItemIcon key={i} city={level.city} taken={v} />
            ))}
          </span>
          <span aria-label={t("Düşüş")}>✕ {hud.deaths}</span>
          {/* süre başlık fontunda (net rakamlar); yanındaki nokta şu an hangi madalya süresinin içinde olduğunu gösterir */}
          <span aria-label={t("Süre")} className="hidden items-center gap-1.5 font-display text-[19px] leading-none min-[380px]:flex sm:text-[21px]">
            {pace && <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_1.5px_rgba(18,15,26,0.9)]" style={{ background: pace }} title={t('Madalya Temposu')} />}
            {formatTime(shown).slice(0, -2)}
          </span>
          {penalty > 0 && <span className="hidden font-display text-[14px] leading-none text-accent-2 min-[380px]:inline">+{Math.round(penalty / 1000)}</span>}
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
  nextIdx,
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
  /** Sıradaki düğmesinin şehri (null: defterin sonu) */
  nextIdx: number | null
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
  const [sent, setSent] = useState<{ first: boolean; better: { time: boolean; deaths: boolean; items: boolean }; bestMs: number; total: number } | null>(null)
  const [refresh, setRefresh] = useState(0)
  const found = result.items.filter(Boolean).length
  const best = save.best[level.id]
  const medal = medalFor(level, result.timeMs)
  // şehrin defteri: üç hatıra + gizli pul + nazar boncuğu. Bölümü geçmek ile defteri tamamlamak ayrı şeylerdir
  const pieces = [0, 1, 2].filter((i) => result.items[i] || best?.items[i]).length + (save.stamps[level.id] ? 1 : 0) + (save.charms[level.id] ? 1 : 0)
  const [copied, setCopied] = useState(false)
  // telefonda üç bölüm sekmeyle açılır; geniş ekranda üçü yan yana durur
  const [tab, setTab] = useState<'defter' | 'kart' | 'skor'>('defter')
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
      const j = (await res.json()) as { error?: string; rank?: number; total?: number; first?: boolean; bestMs?: number; better?: { time: boolean; deaths: boolean; items: boolean } }
      if (res.status === 401) {
        // oturum artık geçerli değil (hesap silinmiş ya da çıkış yapılmış): yeniden giriş istenir
        setStatus('idle')
        onPlayer(null)
        return
      }
      if (!res.ok) throw new Error(j.error ?? t('Gönderilemedi'))
      setRank(j.rank ?? null)
      setSent({ first: !!j.first, better: j.better ?? { time: true, deaths: false, items: false }, bestMs: j.bestMs ?? result.timeMs, total: j.total ?? 0 })
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
      {/* yatay telefonda ızgara: solda sonuç ve eylemler, sağda sekmeler ve içerik */}
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col overflow-clip px-6 side:max-w-[min(1400px,100%)] short:grid short:h-[calc(100dvh-32px)] short:grid-cols-[minmax(0,250px)_minmax(0,1fr)] short:grid-rows-[auto_auto_auto_minmax(0,1fr)] short:gap-x-5 short:pb-3">
        <div className="short:col-span-2">
          <CityBanner level={level} eyebrow={pieces === 5 ? t('EKSİKSİZ TAMAMLANDI') : t('GEÇİLDİ · DEFTER {n}/5', { n: pieces })} height={130} short={56} wide={104} />
        </div>
        {/* geniş ekranda üç sütun şeridin hemen altından başlar: sonuç sol sütunun başında durur, kartpostal ve skor
            tablosu bütün yüksekliği kullanır. Dar ekranda sonuç üstte, altında sekmeler. Yatay telefonda panelin ızgarası. */}
        <div className="flex min-h-0 flex-1 flex-col short:contents wide:grid wide:grid-cols-[1.15fr_1fr_0.9fr] wide:grid-rows-[auto_minmax(0,1fr)] wide:gap-x-6">
        {/* ── sonuç (hep görünür) */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 short:col-start-1 short:row-start-2 wide:col-start-1 wide:row-start-1">
          <div className="flex min-w-0 flex-1 items-center gap-4 short:gap-3">
              <figure className="polaroid relative w-[72px] shrink-0 rotate-[-4deg] max-sm:hidden sm:w-[88px] short:hidden">
                <span className="tape" />
                <Portrait id={heroId} scarf={scarfFor(save.scarf).id === 'al' ? null : scarfFor(save.scarf)} className="w-full" />
                <figcaption className="!text-[12px]">{heroName}</figcaption>
              </figure>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-[0.22em] text-muted">{result.newBest ? t('YENİ REKOR') : best && !best.stale ? t('REKORUN {time}', { time: formatTime(best.timeMs) }) : t('SÜRE')}</p>
                <p className="font-display text-5xl leading-none tabular-nums text-cream sm:text-6xl max-sm:text-4xl short:text-3xl wide:text-5xl">{formatTime(result.timeMs)}</p>
                <p className="mt-1.5 text-[13px] text-muted">{t('{deaths} düşüş · {found}/3 {item}', { deaths: result.deaths, found, item: level.item })}</p>
              </div>
              <div className="short:origin-right short:scale-[0.7]">
                <Seal medal={medal} bronze={level.medals[2]} />
              </div>
          </div>
          {result.earned.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.earned.map((e) => (
                <p key={e} className="border-2 border-gold bg-gold/10 px-3 py-1.5 text-center text-[13px] font-bold tracking-[0.08em] text-gold">
                  ★ {t(e)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* telefonda sekmeler */}
        <div className="mt-3 grid shrink-0 grid-cols-3 gap-2 short:col-start-2 short:row-start-2 short:mt-0 short:self-start wide:hidden" role="tablist">
          {([['defter', t('Defter')], ['kart', t('Kartpostal')], ['skor', t('Skor')]] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`pixel-btn justify-center px-2 py-1.5 text-[13px] ${tab === k ? 'primary' : ''}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── orta: üç bölüm. Geniş ekranda yan yana, her biri kendi içinde kayar; telefonda seçili sekme */}
        <div className="mt-3 min-h-0 flex-1 short:col-start-2 short:row-span-3 short:row-start-3 short:mt-2 wide:contents">
          <div className={`overlay-scroll -mx-2 h-full min-w-0 overflow-y-auto px-2 pt-2 ${tab === 'defter' ? '' : 'hidden'} wide:col-start-1 wide:row-start-2 wide:mt-2 wide:block wide:h-auto wide:min-h-0`}>
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
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
                    {now && <span className="absolute -right-2 -top-2 rotate-[12deg] border-2 border-[#c8302a] bg-[#f4ead8] px-1 text-[11px] font-bold tracking-[0.08em] text-[#c8302a]">{t('BULUNDU')}</span>}
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
                <p className="border-2 border-dashed border-line/70 px-3 py-2 text-[12px] text-muted">{t('Bu şehirde bir gizli pul var. Kayadaki karanlık ağızlara, çatlak zeminlere ve zor ulaşılan köşelere bak.')}</p>
              )}
              <p className={`border-2 px-3 py-2 text-[12px] ${save.charms?.[level.id] ? 'border-[#4ab0e8] bg-[#2a2438] text-cream/90' : 'border-dashed border-line/70 text-muted'}`}>
                {save.charms?.[level.id] ? t('Nazar boncuğu bulundu: meydan yolunda saklıydı.') : t('Meydan yolunda bir nazar boncuğu saklı. Kapıdan geçtikten sonra etrafına iyi bak.')}
              </p>
              {found === 0 && !best?.items.some(Boolean) && (
                <p className="border-2 border-dashed border-line/70 px-3 py-3 text-[12px] text-muted">{t('Bu şehirde üç {item} saklı. Bul, defterine yazılsın.', { item: level.item })}</p>
              )}
            </div>
          </div>

          <div className={`overlay-scroll -mx-2 h-full min-w-0 overflow-y-auto px-2 pt-2 ${tab === 'kart' ? '' : 'hidden'} wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:block wide:h-auto wide:min-h-0 wide:pt-0`}>
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
            {/* madalya süreleri: hangisi alındı, sıradaki hedefe ne kadar kaldı */}
            <p className="mt-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-gold">
              {t('MADALYA SÜRELERİ')} <span className="kilim h-[6px] flex-1 opacity-50" />
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {(['altin', 'gumus', 'bronz'] as const).map((m, k) => {
                const got = result.timeMs <= level.medals[k] * 1000
                return (
                  <div key={m} className={`border-2 px-1 py-2 ${got ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
                    <p className="flex items-center justify-center gap-1.5 font-display text-lg leading-none text-cream">
                      <MedalBadge medal={m} />
                      {level.medals[k]}
                      <span className="text-[11px] text-muted">{t('sn')}</span>
                    </p>
                    <p className={`mt-1 text-[11px] ${got ? 'text-gold' : 'text-muted'}`}>{got ? t('✓ Alındı') : t('{s} sn kaldı', { s: Math.ceil((result.timeMs - level.medals[k] * 1000) / 1000) })}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted">
              {save.bosses[level.id] ? t('Boss yenildi: {boss}.', { boss: lng === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name }) : ''} {found < 3 ? t('{n} hatıra hâlâ saklı; tabelalara ve şehir insanlarına kulak ver.', { n: 3 - found }) : t('Üç hatıra da defterde.')}
            </p>
          </div>

          <div className={`overlay-scroll -mx-2 h-full min-w-0 overflow-y-auto px-2 pt-2 ${tab === 'skor' ? '' : 'hidden'} wide:col-start-3 wide:row-span-2 wide:row-start-1 wide:block wide:h-auto wide:min-h-0 wide:pt-0`}>
            <div className="border-2 border-line bg-ink/40 p-3.5">
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
                <div className="mt-2 text-[13px] leading-snug">
                  <p className="text-gold">
                    {sent?.first
                      ? t('{name}, ilk skorun tabloya yazıldı.', { name })
                      : sent?.better.time
                        ? t('{name}, yeni en iyi süren tabloda.', { name })
                        : t('{name}, tablodaki en iyi süren {time} olarak kaldı.', { name, time: formatTime(sent?.bestMs ?? result.timeMs) })}{' '}
                    {rank ? <strong>{sent?.total ? t('Sıralaman: {rank} / {total}', { rank, total: sent.total }) : t('Sıralaman: {rank}.', { rank })}</strong> : null}
                  </p>
                  {sent && !sent.first && (sent.better.deaths || sent.better.items) && (
                    <p className="mt-0.5 text-[12px] text-[#7ad88a]">
                      {sent.better.deaths && sent.better.items ? t('En az düşüş ve en çok hatıra rekorların da tazelendi.') : sent.better.deaths ? t('En az düşüş rekorun tazelendi.') : t('En çok hatıra rekorun tazelendi.')}
                    </p>
                  )}
                </div>
              ) : null}
              <Board kind="city" level={level.id} refresh={refresh} me={player?.name ?? ''} compact />
            </div>
          </div>
        </div>

        </div>
        {/* ── sabit eylem şeridi: telefonda da hep görünür */}
        <div className="z-10 -mx-6 mt-3 grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-[1fr_auto_auto] border-t-2 border-line bg-[#1e1a29]/95 px-6 py-3 wide:mt-4 [padding-bottom:max(12px,env(safe-area-inset-bottom))] short:col-start-1 short:row-start-3 short:mx-0 short:mt-2 short:grid-cols-2 short:gap-2 short:self-start short:border-0 short:bg-transparent short:p-0">
          <button className="pixel-btn primary col-span-2 min-w-0 justify-center sm:col-span-1 short:col-span-2" onClick={onNext} autoFocus>
            <span className="truncate">{nextIdx !== null ? t('▶ Sıradaki: {city}', { city: displayName(LEVELS[nextIdx]) }) : t('▶ Defteri Kapat')}</span>
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
        <span className="mt-0.5 text-[11px] font-bold leading-none tracking-[0.02em]">{t("MADALYA")}</span>
      </div>
    </div>
  )
}
