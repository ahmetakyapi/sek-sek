'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import TouchControls from '@/components/TouchControls'
import Portrait, { PortraitFace } from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { BossFigure } from '@/components/Figures'
import CityBanner, { CardToggles, Choice, CompactToggles, Level, Toggle } from '@/components/CityBanner'
import NameForm from '@/components/NameForm'
import AuthForm from '@/components/AuthForm'
import TitleMenu from '@/components/TitleMenu'
import { ItemIcon, Key, KeyHints, ThingIcon, TutorialHint, type TutorialStep } from '@/components/HudBits'
import About from '@/components/About'
import Bestiary from '@/components/Bestiary'
import Defter, { RUSH_NEEDS } from '@/components/Defter'
import { recommend } from '@/lib/modeHints'
import ScoreBoard, { Board } from '@/components/ScoreBoard'
import Race from '@/components/Race'
import { DNF, DailyEnd, DuelEnd, DuelSetup, DuelTurn, ModesHub, RuleSetup, duelLevel, duelTerms, type DailyResult, type DuelSetupValue } from '@/components/Modes'
import { ChallengeEnd, ChallengeList, type ChallengeResult } from '@/components/Challenges'
import { TournamentHub } from '@/components/Tournament'
import { CalmSetup, GezginHub } from '@/components/FunModes'
import { StorySetup, StoryTalk, TalkPrompt, npcKey } from '@/components/StoryMode'
import { talkOf } from '@/game/stories'
import { ASK_BIT, GIFT_BIT, MET_BIT, mark as markStory } from '@/lib/storyRules'
import Ending from '@/components/Ending'
import MirrorList from '@/components/Mirror'
import Shop from '@/components/Shop'
import { ACCESSORIES, earned, kitKey, ownedKey, walletOf, type AccessoryId, type Hero, type HeroLook, type Kit } from '@/game/accessories'
import { mirrorLevel } from '@/game/mirror'
import { customLevel, decodeMap } from '@/lib/customLevel'
import type { LevelDef } from '@/game/types'
import { LangProvider, characterFor, localize, makeT, storyFor, useLang, useT } from '@/lib/i18n'
import { MedalBadge, SectionTitle, Overlay, displayName, haptic, ic, medalFor, setHapticScale } from '@/components/ui'
import { Sound } from '@/game/audio'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import { InputManager, normalizeDuo, normalizeKeys } from '@/game/input'
import PhotoMode from '@/components/PhotoMode'
import KeyRemap, { DuoRemap } from '@/components/KeyRemap'
import Coop, { CoopEnd, CoopSetup, coopKey, type CoopPlan, type CoopResult } from '@/components/Coop'
import { useInstallPrompt } from '@/lib/useInstallPrompt'
import { USTA_TEXT, ustaDone, ustaTask } from '@/lib/ustalar'
import { BOSSES } from '@/game/boss'
import { ALL_CHALLENGES, CHALLENGES, RAGE_COURSES, challengeLevel, type Challenge as MapChallenge } from '@/game/challenges'
import { LEVELS, rushArena, type RushVariant, FIRST_BOOK } from '@/game/levels'
import { Renderer } from '@/game/render'
import type { CbMode } from '@/game/colorBlind'
import CbPreview from '@/components/CbPreview'
import { World } from '@/game/sim'
import { STORY, fill } from '@/game/story'
import { emptyInput, type Fact } from '@/game/types'
import { shareQuery } from '@/lib/share'
import { bindCookie, pullMerge, pushSave, restorePlayer, syncBests, uploadGhost } from '@/lib/cloud'
import { gezginFor, gezginKey, gezginTotal, CHALLENGE_TEXT, DAILY_RULES, completes, dailyChallenge, dailyRun, dailyScore, duelFirst, duelResult, duelScoreWith, travelerTitle, emptyStats, addStats, istanbulDay, liveStreak, markDaily, scarfFor, weeklyChallenge, type Challenge, type DailyRun, type DailyRule, type DuelRounds, type DuelRun, type Scarf, ruleKey, ruleFits, ruleLevel, ruleLimit, rushPlan, markTournament, markTrio, settleTrio, trioCount, trioParts, dailyBoss, dailyMini, swapPhase, tournamentWeek, RAGE_RULES, type RageRule } from '@/lib/extras'
import { FLAG_MOMENTS } from '@/game/flagMoments'
import { record, type GhostRun } from '@/game/ghost'
import { loadGhost, saveGhost } from '@/lib/ghost'
import { cityVersion } from '@/lib/mapVersion'
import { freshAchievements, type Feat } from '@/lib/achievements'
import { adoptable, clearProgress, cloudPart, defaultSave, formatTime, loadSave, mergeSaves, nextUnplayed, resumeFor, mapNews, ackMapNews, isRenewed, kitOf, scarfIdOf, titleFacts, writeSave, betterRush, parseSaveText, SAVE_KEY, type Player, type Save } from '@/lib/storage'

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

type Screen = 'title' | 'photo' | 'coopSetup' | 'coop' | 'coopEnd' | 'about' | 'character' | 'name' | 'story' | 'map' | 'intro' | 'play' | 'pause' | 'complete' | 'scores' | 'controls' | 'end' | 'notebook' | 'rushEnd' | 'modes' | 'dailyEnd' | 'duelSetup' | 'duelTurn' | 'duelEnd' | 'race' | 'ruleSetup' | 'rageSetup' | 'rageCourses' | 'challenges' | 'challengeEnd' | 'tournament' | 'gezgin' | 'calmSetup' | 'storySetup' | 'invite' | 'shop' | 'mirror' | 'mirrorEnd' | 'custom' | 'customEnd'

/** Yolun dışındaki koşu: ilerlemeye ve şehir rekoruna dokunmaz */
/** daily: kurallı koşu (günün meydan okuması ya da free: oyuncunun seçtiği şehir ve kural) */
type Mode = { kind: 'daily'; run: DailyRun; free?: boolean } | { kind: 'duel' }

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
  /** yeni rekorun hayaleti: skor tabloya yazılınca sunucuya da gider (skor tablosundan "Hayaletiyle Yarış") */
  ghost?: GhostRun
  /** skor tablosundan seçilen bir yolcunun hayaletine karşı koşuldu */
  rival?: { name: string; timeMs: number; beaten: boolean }
  /** speedrun %100: bu koşuda şehrin her şeyi alındı (best: %100 rekoru tazelendi) */
  full?: { best: boolean; prev?: number }
}

/** Skor tablosundan seçilen yolcunun hayaleti: yalnız o şehirde, koşu boyunca yanında koşar */
interface Rival {
  level: string
  name: string
  timeMs: number
  run: GhostRun
}

/** Boss Rush: yenilmiş boss’lar arka arkaya; süre ve düşüş birikir */
interface Rush {
  /** boss: yalnız arenalar · maraton: üç şehir baştan sona · tur / aynaTur: ilk defterin bütün şehirleri (speedrun) */
  kind: 'boss' | 'maraton' | 'tur' | 'aynaTur'
  /** Günün Boss'u: koşunun günü (tek arena, skor `gunluk-b` tablosuna) */
  daily?: string
  /** Boss Rush'ın zor çeşidi: kâbus (en yüksek kademe, %30 hızlı) ya da çifte (her arenada iki boss) */
  variant?: RushVariant
  /** çiftede her arenanın ikinci boss'u (LEVELS dizini) */
  pairs?: number[]
  order: number[]
  i: number
  timeMs: number
  deaths: number
}

const STEP = 1 / 120

/** Yeni şehirle gelen yenilikler: "Yolda Neler Değişti" notunda o şehir yeni görünürken anlatılır (başlık, bir cümle) */
const RELEASE_NOTES: Record<string, [string, string][]> = {
  karabuk: [
    ['İki Yeni Şehir', 'Karabük (Safranbolu) ve Aydın (Efes): ikisi de Çok Zor, kendi bulmaca ve zamanlamalarıyla.'],
    ['Günün Üçlüsü', 'Günlük Meydan Okuma, Günün Mücadelesi ve Günün Boss’u; her biri ayrı sıralamada.'],
    ['Yolcuya Özel Kılık', 'Uktun ve Memo ayrı kombin giyer; alınan parça o yolcuya aittir.'],
    ['Daha Çok Mücadele', 'Yeni ve daha zor mücadeleler, iki yeni Öfke Parkuru.'],
    ['Düzenleyici ve Topluluk', 'Daha çok hazır parça, harita sihirbazı; yayındaki haritanı aynı bağlantıyla güncelle.'],
  ],
  mersin: [
    ['Kovalamaca', 'Bir Kangal izini sürüyor: dur, yetişsin. Modlar ekranında kendi kartı var.'],
    ['Co-op’ta Parkur ve Omuz Sekmesi', 'Eşinin başına inerken zıpla, yükseğe sek. Ortak can, kısa ip, zamana karşı.'],
    ['Düello Şartları', 'Beş tur, kısa parkurlar, düşüş cezası, Hatıra Avı ve avantaj.'],
    ['Kâbus ve Çifte Boss Rush', 'Boss’lar en sert hâlinde ya da ikişer ikişer.'],
    ['Boss Tasarımcısı', 'Bölüm Düzenleyici’de iki boss, kademe, hız ve can seç; gelgit suyu da karolarda.'],
  ],
}

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
  // "Ana Ekrana Ekle": tarayıcının yükleme olayı oyun açılır açılmaz yakalanır, Ayarlar'da düğme olur
  const installer = useInstallPrompt()
  /** Rahat Mod hızı (0.6-0.9) */
  const speedRef = useRef(0.8)
  /** ara süreler: bu koşunun bayrak süreleri ve kıyaslanan rekor koşununkiler (yalnız yolculukta) */
  const splitRef = useRef<{ rec: number[]; pb: number[] | null; on: boolean }>({ rec: [], pb: null, on: false })
  const ghostOnRef = useRef(true)
  /** bu koşunun hayalet kaydı */
  const ghostRecRef = useRef<number[]>([])
  const levelRef = useRef(0)
  const freezeRef = useRef(0)
  /** bu koşuda kaç kez dash atıldı (görevler için) */
  const dashRef = useRef(0)
  const rushRef = useRef<Rush | null>(null)
  const modeRef = useRef<Mode | null>(null)
  /** koşulan mücadele haritası: dünya şehrin kesitinden kurulur, bitiş kendi dalına gider */
  const challengeRef = useRef<MapChallenge | null>(null)
  /** mücadele turnuva için koşuluyorsa haftası */
  const tournamentRef = useRef<string | null>(null)
  /** Günün Mücadelesi koşusunun günü (mücadele koşusu bu günün tablosuna yazılır) */
  const dailyChRef = useRef<string | null>(null)
  /** Ayna Yolu'nda koşulan şehir */
  const aynaRef = useRef<string | null>(null)
  /** düzenleyiciden gelen özel harita (koşu sürerken) */
  const customRef = useRef<LevelDef | null>(null)
  /** Gezgin Turu'ndan koşulan kesit: tohum anahtarı ve o turun kesitleri (toplam rekoru için) */
  const gezginRef = useRef<{ key: string; ids: string[] } | null>(null)
  /** Ters Tuşlar: son gösterilen uyarı (aynı uyarı her karede yinelenmesin) */
  const swapCueRef = useRef<'flip' | 'fix' | null>(null)
  /** bu koşuda biriken sayaçlar: bölüm bitince ya da bırakılınca kayda eklenir */
  const statRef = useRef({ deaths: 0, jumps: 0, dashes: 0, stomps: 0, playMs: 0 })
  /** Düello: rakibin bu turdaki koşusu (hayalet olarak yanında koşar) */
  const duelGhostRef = useRef<GhostRun | null>(null)
  const duelRef = useRef<Duel | null>(null)
  /** Sinir Bozucu seçim ekranı hangi kuralla açılsın (Kovalamaca kartı) */
  const rageStartRef = useRef<DailyRule | undefined>(undefined)
  /** hesap ekranından sonra dönülecek ekran (günlük bitişinden girişe gidildiyse) */
  const returnRef = useRef<Screen | null>(null)
  /** kurallı koşuda kaçıncı deneme (Tek Can, Zamana Karşı) */
  const triesRef = useRef(0)
  /** molada tuş atama görünümü (moladan çıkınca kapanır) */
  const [pauseKeys, setPauseKeys] = useState(false)
  /** günlük koşuda süre sınırı aşıldı uyarısı bir kez */
  const limitHitRef = useRef(false)
  /** boss uyandığında düşüş sayısı: hiç düşmeden yenilirse başarım */
  const bossDeathsRef = useRef(-1)
  /** bu koşuda boss hiç düşmeden yenildi (usta görevi) */
  const bossCleanRef = useRef(false)
  const rivalRef = useRef<Rival | null>(null)
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
  const [cpToast, setCpToast] = useState<{ at: number; text: string; delta?: number | null } | null>(null)
  // hesap ekranı: üye ol / giriş sekmesi (başlık ona göre) ve çıkış onayı
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')
  const [confirmOut, setConfirmOut] = useState(false)
  const idleRef = useRef(0)
  const [hint, setHint] = useState<string | null>(null)
  const [npc, setNpc] = useState<number>(-1)
  /** Hikâye Gezisi: konuşulan şehir insanı (-1: konuşma yok); konuşurken dünya donar */
  const [talkNpc, setTalkNpc] = useState<number>(-1)
  const talkRef = useRef(-1)
  const [toast, setToast] = useState<(Fact & { item: string; key: number }) | null>(null)
  const [quip, setQuip] = useState<{ text: string; key: number } | null>(null)
  /** boss uyandı, henüz vurulmadı: nasıl yenileceği üç adımda görünür */
  const [coach, setCoach] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [duel, setDuelState] = useState<Duel | null>(null)
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null)
  /** paylaşılan özel harita: ?ozel=<kod> */
  const [custom, setCustom] = useState<{ code: string; level: LevelDef } | { error: string } | null>(null)
  const [customResult, setCustomResult] = useState<{ timeMs: number; deaths: number; found: number; stamp: boolean | null; charm: boolean | null } | null>(null)
  const [mirrorResult, setMirrorResult] = useState<{ idx: number; timeMs: number; deaths: number; best: boolean; prev?: number; relaxed: boolean } | null>(null)
  const [weekRank, setWeekRank] = useState<{ total: number; rank: number } | null>(null)
  /** paylaşılan bağlantıdan gelen yarış daveti: ?yaris=<şehir>~<ad> */
  const [invite, setInvite] = useState<{ idx: number; name: string; msg?: string } | null>(null)
  const [challengeResult, setChallengeResult] = useState<ChallengeResult | null>(null)
  const [challengeSend, setChallengeSend] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; rank: number | null }>({ status: 'idle', rank: null })
  const [dailySend, setDailySend] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; rank: number | null }>({ status: 'idle', rank: null })
  const [pauseSet, setPauseSet] = useState(false)
  /** Mola'dan dönerken 3-2-1 geri sayım (null: sayım yok); sayım sırasında ekran 'pause' kalır, fizik akmaz */
  const [resumeN, setResumeN] = useState<number | null>(null)
  /** Ana Menü / Şehirler'e çıkmadan önce onay (koşu kaybolur) */
  const [exitAsk, setExitAsk] = useState<null | 'title' | 'map'>(null)
  const resumeNRef = useRef<number | null>(null)
  const exitAskRef = useRef<null | 'title' | 'map'>(null)
  const resumeRef = useRef<() => void>(() => {})
  /** molada yolcu değiştirme onayı bekleyen karakter (yola çıkılmışsa şehrin başına dönülür) */
  const [pauseHero, setPauseHero] = useState<CharacterId | null>(null)
  const [quiet, setQuiet] = useState(false)
  const [achToast, setAchToast] = useState<{ at: number; name: string; icon: string; more: number } | null>(null)
  const [setTab, setSetTab] = useState<'ayar' | 'tus'>('ayar')
  const [boardTab, setBoardTab] = useState<'genel' | 'gunluk' | 'modlar' | 'speedrun'>('genel')
  /** Skor Tablosu'nun açılış alt seçimi ve (kural tablosu için) kuralı: Modlar kutucuklarındaki Sıralama kısayolları */
  const [boardSub, setBoardSub] = useState<{ sub: string; rule?: DailyRule }>({ sub: '' })
  const [rushResult, setRushResult] = useState<{ timeMs: number; deaths: number; bosses: number; best: boolean; relaxed: boolean; kind: Rush['kind']; variant?: RushVariant; daily?: string } | null>(null)
  /** tam tur sunucuya yazıldıysa sırası (speedrun tablosu) */
  const [tourSent, setTourSent] = useState<string | null>(null)
  const [coarse, setCoarse] = useState(false)
  /** co-op: şehir, iki kılık, bitiş sonucu; key her başlatışta artar (bileşen yeniden kurulur) */
  const [coop, setCoop] = useState<{ plan: CoopPlan; result: CoopResult | null; key: number; best?: number; newBest: boolean } | null>(null)
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
  const scarfOfHero = (id: CharacterId) => {
    const sc = scarfFor(scarfIdOf(save, id))
    return sc.id === 'al' ? null : sc
  }
  const heroScarf = scarfOfHero(hero.id)
  /** Co-op ve Düello: her oyuncu seçtiği karakterin kendi kılığını giyer */
  const looks = Object.fromEntries((['uktun', 'memo'] as const).map((id) => [id, { scarf: scarfOfHero(id), kit: kitOf(save, id) }])) as Record<CharacterId, HeroLook>
  const charmCount = LEVELS.filter((l) => save.charms[l.id]).length
  /** Kılık Dükkânı'nın parası (parça): hatıra + pul + nazar 1, yenilen boss 2, Usta Mührü 3 (game/accessories.ts) */
  const ustaCount = Object.values(save.ustalar ?? {}).filter(Boolean).length
  const foundTotal = LEVELS.reduce((a, l) => a + (save.best[l.id]?.items.filter(Boolean).length ?? 0) + (save.stamps[l.id] ? 1 : 0) + (save.charms[l.id] ? 1 : 0), 0)
  const bossCount = LEVELS.filter((l) => save.bosses[l.id]).length
  const wallet = walletOf(earned(foundTotal, bossCount, ustaCount), save.owned, hero.id)
  const heroAcc = kitOf(save, hero.id)
  // ?debug (ölçüm ve görsel betikleri): güncelleme notu ekranı kapatmasın
  const mapNotice = quiet ? { renewed: [], added: [] } : mapNews(save)
  const now = new Date()
  const challenges: [string, Challenge, boolean][] = [
    [t('Günün Şehri'), dailyChallenge(now, LEVELS, save.unlocked), false],
    [t('Haftanın Görevi'), weeklyChallenge(now, LEVELS, save.unlocked), false],
  ]
  challenges[0][2] = save.daily.last === challenges[0][1].key
  challenges[1][2] = save.weekly.last === challenges[1][1].key

  /* ── kurulum ─────────────────────────────────────────────── */
  const kitId = kitKey(heroAcc)
  useEffect(() => {
    if (rendererRef.current) rendererRef.current.accessory = kitOf(saveRef.current ?? save, hero.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitId])

  // final sahnesi görüldü: Ayna Yolu'nun kapısı açılmış sayılır
  useEffect(() => {
    if (screen !== 'end') return
    setSave((prev) => {
      if (prev.sawEnding) return prev
      const next = { ...prev, sawEnding: true }
      writeSave(next)
      return next
    })
  }, [screen])

  useEffect(() => {
    relaxedRef.current = save.relaxed
    speedRef.current = save.relaxedSpeed ?? 0.8
    ghostOnRef.current = save.ghost
    tutorialOnRef.current = save.tutorial
    if (!save.tutorial) setTutStep(null)
    if (!save.ghost && rendererRef.current) rendererRef.current.ghostRun = null
  }, [save.relaxed, save.relaxedSpeed, save.ghost, save.tutorial])

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
    setQuiet(qs.has('debug'))
    // /siralama sayfasından gelen: doğrudan Modlar ekranı (günün meydan okuması orada)
    if (qs.get('mod') === 'gunluk' && !isFresh(s)) {
      screenRef.current = 'modes'
      setScreenState('modes')
    }
    // düzenleyicide yapılmış özel harita
    const oz = qs.get('ozel')
    if (oz) {
      const d = decodeMap(oz)
      setCustom('error' in d ? { error: d.error } : { code: oz, level: customLevel(d.map, d.city, d.texts) })
      screenRef.current = 'custom'
      setScreenState('custom')
    }
    // arkadaşın gönderdiği yarış bağlantısı: o şehirde onun hayaletiyle koşmaya çağırır (şehir kilitli olsa da)
    const [inviteCity, inviteName] = (qs.get('yaris') ?? '').split('~')
    const inviteIdx = LEVELS.findIndex((l) => l.id === inviteCity)
    if (inviteIdx >= 0 && inviteName) {
      setInvite({ idx: inviteIdx, name: inviteName.slice(0, 16) })
      screenRef.current = 'invite'
      setScreenState('invite')
    }
    setCanFull(!!document.documentElement.requestFullscreen)
    const canvas = canvasRef.current!
    const renderer = new Renderer(canvas)
    renderer.character = CHARACTERS[s.character ?? 'uktun']
    renderer.accessory = kitOf(s, CHARACTERS[s.character ?? 'uktun'].id)
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
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __mk: unknown }).__mk = { world: () => worldRef.current, stats: () => renderer.stats, sound: () => soundRef.current, renderer: () => renderer }
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
    // fotoğraf kipi: ok tuşları / WASD kadrajı kaydırır (dünya pikseli/sn; kare hızından bağımsız)
    const photoTick = (dt: number) => {
      const p = renderer.photo
      if (!p) return
      const i = input.sample()
      const v = 240 * dt
      if (i.left) p.x -= v
      if (i.right) p.x += v
      if (i.up || i.jump) p.y -= v
      if (i.down) p.y += v
    }
    let last = performance.now()
    let acc = 0
    let hudTimer = 0
    let respawned = false
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      const w = worldRef.current
      if (!w) return
      const sc = screenRef.current
      if (sc === 'play' && talkRef.current >= 0) {
        // Hikâye Gezisi: konuşurken fizik akmaz, yalnız çizim (kişiler nefes alır)
        acc = 0
        renderer.render(w, dt, 1)
        return
      }
      if (sc === 'play') {
        // vuruş anı donması: ezmede kısa bir duraksama hissi
        if (freezeRef.current > 0) {
          freezeRef.current -= dt
          renderer.render(w, dt * 0.15)
          return
        }
        // Rahat Mod: dünya seçilen hızda (%60-90) akar. Modlarda hız kuralındır (Hızlı Dünya %120), Rahat Mod sayılmaz
        const mode = modeRef.current
        acc += dt * (mode ? (mode.kind === 'daily' ? DAILY_RULES[mode.run.rule].speed : 1) : relaxedRef.current ? speedRef.current : 1)
        // girdi yalnızca en az bir adım koşacaksa okunur: 120/144 Hz ekranda adımsız karede basış tüketilip kaybolmasın
        if (acc >= STEP) {
          const inp = input.sample()
          if (mode?.kind === 'daily' && DAILY_RULES[mode.run.rule].noDash) inp.dashPressed = false
          // Ters Tuşlar: turun ters kısmında sağ ile sol yer değiştirir (saat dünyanın süresi; uyarı aşağıda)
          if (mode?.kind === 'daily' && DAILY_RULES[mode.run.rule].swapKeys && swapPhase(w.time).flipped) [inp.left, inp.right] = [inp.right, inp.left]
          // Kolaylık "Basılı Tut Zıplama": tuş basılıyken yere her inişte yeniden zıplanır (yalnız girdi; fizik aynı)
          if (saveRef.current?.holdJump && inp.jump && w.player.grounded && !w.player.dead && !w.player.swim) inp.jumpPressed = true
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
        let drowned = false
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
            case 'breath':
              // nefes azalıyor: kısa, kalan saniye azaldıkça sıklaşan titreşim; ilk üç saniyede bir de söz
              haptic(e.left === 1 ? [18, 50, 18, 50, 18] : e.left === 2 ? [18, 60, 18] : [18])
              if (e.left === 3) setQuip({ text: t('Nefesin azalıyor: yüzeye çık!'), key: Date.now() })
              break
            case 'drown':
              drowned = true
              haptic([40, 60, 40])
              break
            case 'stomp':
              statRef.current.stomps++
              freezeRef.current = 0.06
              haptic(15)
              break
            case 'respawn':
              respawned = true
              break
            case 'death': {
              statRef.current.deaths++
              setCoach(false)
              haptic(40)
              const q = localize(w.level, langRef.current).quips
              // boğulma düşüşten ayrı anlaşılsın: neden olduğu ve ne yapılacağı yazar
              if (drowned) setQuip({ text: t('Nefesin bitti: başın suyun üstündeyken nefes dolar.'), key: Date.now() })
              else if (Math.random() < 0.4) setQuip({ text: q[Math.floor(Math.random() * q.length)], key: Date.now() })
              break
            }
            case 'checkpoint': {
              tutRef.current.flag = true
              haptic(10)
              const moments = FLAG_MOMENTS[w.level.city]
              const m = moments[e.index % moments.length]
              // ara süre: bu bayrağa ilk varış, rekor koşudaki aynı bayrakla kıyaslanır
              const sp = splitRef.current
              let delta: number | null = null
              if (sp.on && sp.rec[e.index] === undefined) {
                sp.rec[e.index] = Math.round(w.time * 1000)
                if (sp.pb?.[e.index] !== undefined) delta = sp.rec[e.index] - sp.pb[e.index]
              }
              setCpToast({ at: Date.now(), text: langRef.current === 'en' ? m[1] : m[0], delta })
              break
            }
            case 'stamp': {
              haptic([30, 40, 30, 40, 60])
              const lv = localize(w.level, langRef.current)
              setToast({ ...lv.secret, item: makeT(langRef.current)('Gizli Pul'), key: Date.now() })
              // modlarda ve özel haritada bulunan şey deftere yazılmaz (kart "ilerlemen değişmez" diyor; kilitli şehir de gelebilir)
              if (modeRef.current || customRef.current) break
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
              if (modeRef.current || customRef.current) break
              setSave((prev) => {
                const next = { ...prev, charms: { ...prev.charms, [w.level.id]: true } }
                writeSave(next)
                return next
              })
              break
            }
            case 'bossWake':
              bossDeathsRef.current = w.deaths
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
              if (bossDeathsRef.current === w.deaths) {
                addFeat('cleanBoss')
                bossCleanRef.current = true
              }
              bossDeathsRef.current = -1
              haptic([40, 50, 40, 50, 90])
              // modda, mücadelede ve özel haritada yenilen boss şehrin defterine yazılmaz
              if (modeRef.current || customRef.current || challengeRef.current) break
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
        // Tek Can / Bayraksız: düşüp yeniden doğunca koşu şehrin başına döner; Zamana Karşı: süre dolunca
        const rule = mode?.kind === 'daily' ? DAILY_RULES[mode.run.rule] : null
        // günlük (sıralamalı) koşuda tek hak: baştan dönülür ama süre ve düşüş sürer; süre sınırı bir kez uyarır
        const ranked = mode?.kind === 'daily' && !mode.free
        const lim = mode?.kind === 'daily' ? ruleLimit(mode.run.rule, w.level) : null
        const over = lim !== null && w.time > lim && !w.complete
        if (ranked && over && !limitHitRef.current) {
          limitHitRef.current = true
          setCpToast({ at: Date.now(), text: makeT(langRef.current)('Süre doldu: bronz süreyi geçtin, koşu sürüyor') })
        }
        const timeUp = over && !ranked
        if (rule && !w.complete && ((respawned && (rule.oneLife || rule.noFlags)) || timeUp)) {
          const w2 = new World(w.level)
          if ((rule.noFlags || ranked) && !timeUp) {
            w2.time = w.time
            w2.deaths = w.deaths
            w2.started = true
          } else ghostRecRef.current = []
          triesRef.current++
          worldRef.current = w2
          renderer.setLevel(w2)
          goalRef.current = 'square'
          setCoach(false)
          setCpToast({ at: Date.now(), text: makeT(langRef.current)(timeUp ? 'Süre doldu: baştan' : ranked ? 'Şehrin başından: süre sürüyor' : rule.oneLife ? 'Düştün: baştan · {n}. deneme' : 'Bayrak yok: şehrin başından', { n: triesRef.current + 1 }) })
        }
        respawned = false
        // Ters Tuşlar: dönmeden ve düzelmeden önce bir kez uyarı
        if (rule?.swapKeys && w.started && !w.complete) {
          const ph = swapPhase(w.time)
          const cue = ph.warn ? (ph.flipped ? 'fix' : 'flip') : null
          if (cue && cue !== swapCueRef.current) setCpToast({ at: Date.now(), text: makeT(langRef.current)(cue === 'flip' ? '⇄ Tuşlar Ters Dönüyor!' : '⇄ Tuşlar Düzeliyor') })
          swapCueRef.current = cue
        }
        hudTimer += dt
        if (hudTimer > 0.1) {
          hudTimer = 0
          // boss uyanıkken müzik yoğunlaşır (usule ek vuruşlar); yenilince ya da uyurken sakinleşir
          const bs = w.boss?.state
          soundRef.current?.setIntense(!!bs && bs !== 'sleep' && bs !== 'down')
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
      } else if (sc === 'title' || sc === 'map' || sc === 'scores' || sc === 'controls' || sc === 'character' || sc === 'story' || sc === 'name' || sc === 'notebook' || sc === 'modes' || sc === 'duelSetup' || sc === 'ruleSetup' || sc === 'rageSetup' || sc === 'rageCourses' || sc === 'challenges' || sc === 'tournament' || sc === 'gezgin' || sc === 'calmSetup' || sc === 'storySetup' || sc === 'invite' || sc === 'shop' || sc === 'mirror' || sc === 'coopSetup') {
        w.step(dt, emptyInput())
        w.events.length = 0
      } else if (sc === 'photo') {
        acc = 0
        photoTick(dt)
      } else {
        acc = 0
        // yan yana yarışın kendi iki tuvali ve döngüsü var: arkadaki dünya boşuna çizilmez
        if (sc === 'race' || sc === 'coop') return
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
      else if (screenRef.current === 'pause') resumeRef.current()
      else if (screenRef.current === 'photo') closePhoto()
    }
    input.onRetry = () => {
      if (screenRef.current === 'play') worldRef.current?.retryFromCheckpoint()
    }
    // Shift + R: baştan başla (oyunda ya da molada); günlükte tek hak: süre ve düşüş sürer
    input.onRestart = () => {
      if (screenRef.current !== 'play' && screenRef.current !== 'pause') return
      restartRef.current()
    }
  }, [setScreen, ready])

  // menülerde Esc geri götürür: ekrandaki Geri düğmesine (data-back) basar. Oyun, mola, fotoğraf, Co-op ve yarışta
  // Esc'in kendi işi var (mola); yazı alanındayken de dokunmaz
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (['play', 'pause', 'photo', 'coop', 'race', 'intro'].includes(screenRef.current)) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return
      const backs = [...document.querySelectorAll<HTMLButtonElement>('[data-back]')].filter((b) => b.offsetParent !== null && !b.disabled)
      const b = backs[backs.length - 1]
      if (b) {
        e.preventDefault()
        b.click()
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!quip) return
    // uzun söz (boğulmanın açıklaması gibi) okunacak kadar kalır
    const id = setTimeout(() => setQuip(null), quip.text.length > 34 ? 2600 : 1400)
    return () => clearTimeout(id)
  }, [quip])

  /** Bir anda kazanılan başarım: kayda yazılır (bildirimi aşağıdaki etki gösterir) */
  const addFeat = useCallback((f: Feat) => {
    setSave((prev) => {
      if (prev.feats?.[f]) return prev
      const next = { ...prev, feats: { ...(prev.feats ?? {}), [f]: true } }
      writeSave(next)
      return next
    })
  }, [])

  /**
   * Kaydı yazar. İşlev verilirse en güncel kayıttan türetilir: ekranın elindeki eski kopya (bölüm sonu, giriş, ayar)
   * yeni yazılmış bir rekoru ya da hatırayı ezemez. Kısmi değişiklikler için `patch`.
   */
  const persist = useCallback((next: Save | ((s: Save) => Save)) => {
    setSave((prev) => {
      const n = typeof next === 'function' ? next(prev) : next
      writeSave(n)
      return n
    })
  }, [])
  const patch = useCallback((part: Partial<Save>) => persist((s) => ({ ...s, ...part })), [persist])

  // Hikâye Gezisi: konuşma açılır (E / Enter, dokunma, oyun kolunda LB-RB), kapanır; kayıt her seferinde en güncel hâlinden türer
  const closeTalk = useCallback(() => {
    talkRef.current = -1
    setTalkNpc(-1)
  }, [])
  const storyBits = useCallback(
    (bits: number) => {
      const key = npcKey(LEVELS[levelRef.current].id, talkRef.current)
      if (key && talkOf(key)) persist((s) => ({ ...s, story: markStory(s.story, key, bits) }))
    },
    [persist],
  )
  const meetNpc = useCallback(() => storyBits(MET_BIT), [storyBits])
  const askNpc = useCallback((i: number) => storyBits(ASK_BIT[i]), [storyBits])
  const giftNpc = useCallback(() => storyBits(GIFT_BIT), [storyBits])
  useEffect(() => {
    const open = () => {
      const w = worldRef.current
      if (screenRef.current !== 'play' || !customRef.current?.story || !w || talkRef.current >= 0 || w.nearNpc < 0 || w.player.dead) return
      talkRef.current = w.nearNpc
      setTalkNpc(w.nearNpc)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat && !e.ctrlKey && !e.metaKey) open()
    }
    let down = false
    let raf = 0
    const poll = () => {
      raf = requestAnimationFrame(poll)
      if (screenRef.current !== 'play' || !customRef.current?.story) return
      const p = navigator.getGamepads?.().find((g) => g?.connected)
      const now = !!(p?.buttons[4]?.pressed || p?.buttons[5]?.pressed)
      if (now && !down) open()
      down = now
    }
    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(poll)
    return () => {
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
    }
  }, [])
  useEffect(() => {
    if (screen !== 'play' && screen !== 'pause') closeTalk()
  }, [screen, closeTalk])

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

  // Hesap tek doğru kaynak: sekme yeniden görününce ve açıkken dakikada bir buluttaki ilerleme çekilip birleştirilir.
  // Telefonda biten şehir, açık kalmış bilgisayar sekmesinde de (ve tersi) yeniden yüklemeden görünür.
  useEffect(() => {
    if (!playerId) return
    let busy = false
    const refresh = () => {
      if (busy || document.visibilityState !== 'visible' || pulledFor.current !== playerId) return
      busy = true
      setSave((prev) => {
        void pullMerge(prev)
          .then((merged) => {
            if (!merged) return
            setSave((cur) => {
              const next = { ...mergeSaves(adoptable(cur, playerId), merged), owner: playerId }
              if (JSON.stringify(cloudPart(next)) === JSON.stringify(cloudPart(cur))) return cur
              writeSave(next)
              setResumeIdx(resumeFor(next))
              return next
            })
          })
          .finally(() => {
            busy = false
          })
        return prev
      })
    }
    const id = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [playerId])

  // iki sekme açıksa: öbür sekmenin yazdığı kayıt buradakiyle birleşir (ilerleme en iyisi, ayarlar buradaki); yoksa bu
  // sekmenin bir sonraki yazışı öbüründe bitirilen şehri ezerdi. Öbür sekmede ilerleme sıfırlandıysa o kabul edilir.
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== SAVE_KEY) return
      const other = parseSaveText(e.newValue)
      if (!other) return
      setSave((cur) => {
        const reset = (other.timesReset ?? 0) > (cur.timesReset ?? 0)
        const next = reset ? { ...other } : { ...mergeSaves(cur, other), player: cur.player ?? other.player }
        writeSave(next)
        return next
      })
    }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

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

  const openPhoto = () => {
    rendererRef.current?.photoStart()
    inputRef.current?.clear()
    setScreen('photo')
  }
  const closePhoto = () => {
    if (rendererRef.current) rendererRef.current.photo = null
    setScreen('pause')
  }

  const loadLevel = useCallback(
    (idx: number, toScreen: Screen = 'intro') => {
      flushStats()
      levelRef.current = idx
      setLevelIdx(idx)
      const rush = rushRef.current
      const ch = challengeRef.current?.level === LEVELS[idx].id ? challengeRef.current : null
      const ay = aynaRef.current === LEVELS[idx].id || rush?.kind === 'aynaTur'
      const cu = customRef.current?.city === LEVELS[idx].city ? customRef.current : null
      const md = modeRef.current
      const duelSetup = md?.kind === 'duel' ? duelRef.current?.setup : undefined
      const base = md?.kind === 'daily' ? ruleLevel(md.run.rule, LEVELS[idx]) : duelSetup ? duelLevel(duelSetup) : LEVELS[idx]
      const w = new World(cu ?? (ch ? challengeLevel(ch) : ay ? mirrorLevel(LEVELS[idx]) : rush?.kind === 'boss' ? rushArena(LEVELS[idx], rush.variant, rush.pairs?.[rush.i]) : base))
      worldRef.current = w
      ghostRecRef.current = []
      dashRef.current = 0
      limitHitRef.current = false
      bossCleanRef.current = false
      const plain = !rush && !ch && !ay && !cu && !modeRef.current
      const pbSplit = saveRef.current?.splitTimes?.[LEVELS[idx].id]
      splitRef.current = { rec: [], pb: plain && pbSplit?.v === cityVersion(LEVELS[idx].id) ? pbSplit.t : null, on: plain && saveRef.current?.splits !== false }
      // zor modun görüntü değişikliği (karanlık, baş aşağı, ayna): her bölüm yüklenişinde yeniden kurulur, modsuz koşuda sıfırlanır
      const view = md?.kind === 'daily' ? DAILY_RULES[md.run.rule].view : undefined
      const r0 = rendererRef.current
      if (r0) {
        r0.dark = !!view?.dark
        r0.hiddenSpikes = !!view?.hiddenSpikes
        r0.ghostGround = !!view?.ghostGround
        r0.quake = !!view?.quake
        // kadraj değişince tuval yeniden ölçülür (Dar Kadraj)
        if (r0.zoom !== (view?.zoom ?? 1)) {
          r0.zoom = view?.zoom ?? 1
          window.dispatchEvent(new Event('resize'))
        }
      }
      if (canvasRef.current) canvasRef.current.style.transform = view?.flipX || view?.flipY ? `scale(${view.flipX ? -1 : 1}, ${view.flipY ? -1 : 1})` : ''
      if (rendererRef.current) {
        rendererRef.current.setLevel(w)
        const mode = modeRef.current
        const rival = rivalRef.current?.level === LEVELS[idx].id ? rivalRef.current.run : null
        rendererRef.current.ghostRun = mode ? (mode.kind === 'duel' ? duelGhostRef.current : null) : rival ?? (!rush && !ch && !ay && !cu && ghostOnRef.current && !saveRef.current?.best[LEVELS[idx].id]?.stale ? loadGhost(LEVELS[idx].id) : null)
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

  /** Speedrun tam turu: ilk defterin bütün şehirleri baştan sona (aynalıda haritalar sağdan sola). İlk defter bitince açılır. */
  const startTour = (kind: 'tur' | 'aynaTur') => {
    if (!LEVELS.slice(0, FIRST_BOOK).every((l) => save.best[l.id])) return
    const order = [...Array(FIRST_BOOK).keys()]
    soundRef.current?.unlock()
    ui()
    modeRef.current = null
    aynaRef.current = null
    rushRef.current = { kind, order, i: 0, timeMs: 0, deaths: 0 }
    loadLevel(order[0], 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t(kind === 'tur' ? 'Tam Tur: {n} şehir arka arkaya' : 'Ayna Tam Tur: {n} şehir arka arkaya', { n: order.length }) })
  }

  /**
   * Boss Rush: yenilmiş boss'lar şehir sırasıyla, arka arkaya. Kâbus'ta her biri en yüksek kademede ve %30 hızlı; Çifte'de
   * boss'lar ikişer ikişer aynı arenaya çıkar (her arenada iki boss, arena sayısı yarıya iner).
   */
  const startRush = (variant?: RushVariant) => {
    const all = LEVELS.map((l, i) => (save.bosses[l.id] ? i : -1)).filter((i) => i >= 0)
    if (all.length < RUSH_NEEDS) return
    const plan = rushPlan(all, variant)
    soundRef.current?.unlock()
    ui()
    modeRef.current = null
    rushRef.current = { kind: 'boss', variant, order: plan.order, pairs: plan.pairs, i: 0, timeMs: 0, deaths: 0 }
    loadLevel(plan.order[0], 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t('Boss {i}/{n}', { i: 1, n: plan.order.length }) })
  }

  const today = istanbulDay(now)
  const daily = dailyRun(today, LEVELS)
  const dailyLevel = LEVELS.find((l) => l.id === daily.levelId)!

  if (pauseKeys && screen !== 'pause') setPauseKeys(false)
  /** iki kişilik tuşlar: oyuncunun ataması ya da varsayılan (WASD + Shift, oklar + Enter) */
  const duoKeys = normalizeDuo(save.duoKeys)

  /** bugünün hakkı kullanıldı mı: başlandıysa (yarıda bırakılsa da) ya da bitirildiyse */
  const dailyUsed = save.dailyTry === today || save.meydan?.day === today

  /** Günlük Meydan Okuma: herkes için aynı şehir ve kural; günde tek hak, ilerlemeye dokunmaz */
  const startDaily = () => {
    if (dailyUsed) {
      setCpToast({ at: Date.now() + 1, text: t('Bugünkü hakkını kullandın. Yarın yeni bir şehir.') })
      return
    }
    patch({ dailyTry: today })
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    triesRef.current = 0
    modeRef.current = { kind: 'daily', run: daily }
    setDailySend({ status: 'idle', rank: null })
    loadLevel(LEVELS.findIndex((l) => l.id === daily.levelId), 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t(DAILY_RULES[daily.rule].name)}: ${t(DAILY_RULES[daily.rule].text)}` })
  }

  /** sıralamalı günlük koşu sürüyor mu (mola menüsü buna göre) */
  const rankedDaily = modeRef.current?.kind === 'daily' && !modeRef.current.free
  useEffect(() => {
    if (screen !== 'pause') setPauseHero(null)
  }, [screen])
  /** düz şehir koşusu (mod, parkur, Boss Rush, ayna, özel harita değil): molada yolcu burada değişebilir, baştan yükleme şehri yükler */
  const plainRun = !modeRef.current && !rushRef.current && !challengeRef.current && !aynaRef.current && !customRef.current
  resumeNRef.current = resumeN
  exitAskRef.current = exitAsk
  /** Mola'dan devam: Esc / Devam Et. Sayım sürerken ya da çıkış onayı açıkken Esc yalnız onları kapatır */
  const resume = () => {
    if (screenRef.current !== 'pause') return
    if (exitAskRef.current) return setExitAsk(null)
    if (resumeNRef.current !== null) return setResumeN(null)
    // yola çıkılmamışsa (süre işlemiyor) sayıya gerek yok
    if (saveRef.current?.countdown === false || (worldRef.current?.time ?? 0) < 0.05) return setScreen('play')
    setResumeN(3)
  }
  resumeRef.current = resume
  useEffect(() => {
    if (resumeN === null) return
    if (resumeN <= 0) {
      setResumeN(null)
      setScreen('play')
      return
    }
    const id = setTimeout(() => setResumeN((n) => (n === null ? null : n - 1)), 650)
    return () => clearTimeout(id)
  }, [resumeN, setScreen])
  useEffect(() => {
    if (screen !== 'pause') {
      setResumeN(null)
      setExitAsk(null)
    }
  }, [screen])
  /** günlükte "Baştan Başla": şehrin başına döner, süre ve düşüş sürer (tek hak) */
  const restartKeep = () => {
    const w = worldRef.current
    if (!w) return
    const w2 = new World(w.level)
    w2.time = w.time
    w2.deaths = w.deaths
    w2.started = true
    worldRef.current = w2
    rendererRef.current?.setLevel(w2)
    setScreen('play')
  }

  const restartRef = useRef<() => void>(() => {})
  restartRef.current = () => {
    if (rankedDaily) restartKeep()
    else {
      loadLevel(levelRef.current, 'play')
      setCpToast({ at: Date.now() + 1, text: t('Baştan başladın') })
    }
  }

  // Günlük skor tabloya: bitiş ekranı açıkken ve oyuncu girişliyken bir kez (misafir bitirip sonra giriş yaparsa da).
  // Serbest Kurallı Koşu ve Sinir Bozucu: şehir + kural tablosuna
  const dailyPlayer = save.player
  useEffect(() => {
    if (screen !== 'dailyEnd' || !dailyResult || !dailyPlayer || dailySend.status !== 'idle') return
    const r = dailyResult
    setDailySend({ status: 'sending', rank: null })
    const body = r.free ? { level: 'kural', city: r.run.levelId, rule: r.run.rule } : { level: 'gunluk', day: r.run.day }
    fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, playerId: dailyPlayer.id, token: dailyPlayer.token, timeMs: r.scoreMs, deaths: r.deaths, items: r.found }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((j: { rank?: number }) => setDailySend({ status: 'sent', rank: j.rank ?? null }))
      .catch(() => setDailySend({ status: 'error', rank: null }))
  }, [screen, dailyResult, dailyPlayer, dailySend.status])

  /** Mücadele haritası: şehrin en sıkı kesiti; ilerlemeye ve şehir rekoruna dokunmaz */
  const startChallenge = (c: MapChallenge, week: string | null = null, dailyDay: string | null = null) => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = null
    rivalRef.current = null
    challengeRef.current = c
    tournamentRef.current = week
    dailyChRef.current = dailyDay
    gezginRef.current = null
    setWeekRank(null)
    setChallengeSend({ status: 'idle', rank: null })
    loadLevel(LEVELS.findIndex((l) => l.id === c.level), 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${week ? `${t('Turnuva')} · ` : dailyDay ? `${t('Günün Mücadelesi')} · ` : '▲ '}${t(c.name)}` })
  }

  /** Gezgin Turu: tohumun kesitlerinden birini koşar; bitince toplam (hepsi bittiyse) tohum rekoru olarak yazılır */
  const startGezgin = (c: MapChallenge, seed: string, size: number) => {
    startChallenge(c)
    gezginRef.current = { key: gezginKey(seed, size), ids: gezginFor(seed, size) }
    setCpToast({ at: Date.now() + 1, text: `${t('Gezgin Turu')} · ${t(c.name)}` })
  }

  /** Sakin Gezi: şehri düşüşsüz, süresiz gez; özel harita yolunu kullanır (ilerlemeye, rekora, deftere dokunmaz) */
  const startCalm = (idx: number) => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = null
    rivalRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    aynaRef.current = null
    gezginRef.current = null
    customRef.current = { ...LEVELS[idx], calm: true }
    loadLevel(idx, 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t('Sakin Gezi')} · ${LEVELS[idx].name}` })
  }

  /** Hikâye Gezisi: Sakin Gezi yolu (düşüş sayılmaz, süre ve rekor yok) + şehir insanlarıyla konuşma */
  const startStory = (idx: number) => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = null
    rivalRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    aynaRef.current = null
    gezginRef.current = null
    talkRef.current = -1
    setTalkNpc(-1)
    customRef.current = { ...LEVELS[idx], calm: true, story: true }
    loadLevel(idx, 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t('Hikâye Gezisi')} · ${LEVELS[idx].name}` })
  }

  /** Günün Mücadelesi: bugünün kesiti, herkes için aynı; serbest tekrar, skor yalnız en iyisi */
  const startDailyMini = () => {
    const c = CHALLENGES.find((x) => x.id === dailyMini(today))
    if (c) startChallenge(c, null, today)
  }

  /** Günün Boss'u: bugünün şehrinin boss arenası; serbest tekrar, skor yalnız en iyisi */
  const startDailyBoss = () => {
    const idx = dailyBoss(today, LEVELS)
    soundRef.current?.unlock()
    ui()
    modeRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    dailyChRef.current = null
    rivalRef.current = null
    rushRef.current = { kind: 'boss', daily: today, order: [idx], i: 0, timeMs: 0, deaths: 0 }
    setTourSent(null)
    loadLevel(idx, 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t('Günün Boss’u')} · ${LEVELS[idx].name}` })
  }

  /** Ayna Yolu: şehrin aynalanmış haritası; ilerlemeye dokunmaz, rekoru ayrı */
  const startMirror = (idx: number) => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = null
    rivalRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    aynaRef.current = LEVELS[idx].id
    loadLevel(idx, 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `◐ ${t('Ayna Yolu')} · ${LEVELS[idx].name}` })
  }

  /** Özel harita: düzenleyiciden gelen kod; ilerlemeye ve rekorlara dokunmaz */
  const startCustom = () => {
    if (!custom || 'error' in custom) return
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    modeRef.current = null
    rivalRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    aynaRef.current = null
    customRef.current = custom.level
    loadLevel(LEVELS.findIndex((l) => l.city === custom.level.city), 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: t('Özel Harita') })
  }

  /** Kılık Dükkânı: parça karşılığı aksesuar alır ve o yolcuya takar (alınan parça yalnız o yolcunun olur) */
  const buyAccessory = (who: Hero, id: AccessoryId) => {
    const item = ACCESSORIES.find((a) => a.id === id)
    const cur = saveRef.current ?? save
    if (!item || item.seals !== undefined || (item.for && item.for !== who) || walletOf(earned(foundTotal, bossCount, ustaCount), cur.owned, who) < item.price) return
    ui()
    persist((s) => ({ ...s, owned: { ...(s.owned ?? {}), [ownedKey(who, id)]: true }, kits: { ...s.kits, [who]: { ...kitOf(s, who), [item.slot]: id } } }))
  }
  /** kombini yolcuya giydirir (yuva başına bir parça) */
  const wearKit = (who: Hero, k: Kit) => {
    ui()
    persist((s) => ({ ...s, kits: { ...s.kits, [who]: { ...k } } }))
  }

  /** Arkadaş listesine ekler ya da çıkarır (skor tablosundaki ☆) */
  const toggleFriend = (name: string) => {
    setSave((prev) => {
      const list = prev.friends ?? []
      const key = name.toLocaleLowerCase('tr')
      const has = list.some((f) => f.toLocaleLowerCase('tr') === key)
      const next = { ...prev, friends: has ? list.filter((f) => f.toLocaleLowerCase('tr') !== key) : [...list, name].slice(-50) }
      writeSave(next)
      return next
    })
  }

  // mücadele skoru tabloya: bitiş ekranı açıkken, oyuncu girişliyse ve rekor yeniyse bir kez
  useEffect(() => {
    if (screen !== 'challengeEnd' || !challengeResult || challengeResult.relaxed || !dailyPlayer || challengeSend.status !== 'idle') return
    const r = challengeResult
    setChallengeSend({ status: 'sending', rank: null })
    const body = r.week ? { level: 'turnuva', week: r.week, challenge: r.id } : r.daily ? { level: 'gunluk-m', day: r.daily } : { level: `mucadele-${r.id}` }
    fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, playerId: dailyPlayer.id, token: dailyPlayer.token, timeMs: r.timeMs, deaths: r.deaths, items: 0 }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((j: { rank?: number; week?: { total: number; rank: number } | null }) => {
        setWeekRank(j.week ?? null)
        setChallengeSend({ status: 'sent', rank: j.rank ?? null })
      })
      .catch(() => setChallengeSend({ status: 'error', rank: null }))
  }, [screen, challengeResult, dailyPlayer, challengeSend.status])

  /** Kurallı Koşu: oyuncunun seçtiği şehir ve kural; rekoru cihazda (ve hesapta) tutulur */
  const startRule = (levelIdx2: number, rule: DailyRule) => {
    soundRef.current?.unlock()
    ui()
    rushRef.current = null
    triesRef.current = 0
    modeRef.current = { kind: 'daily', free: true, run: { day: today, levelId: LEVELS[levelIdx2].id, rule } }
    setDailySend({ status: 'idle', rank: null })
    loadLevel(levelIdx2, 'play')
    beginPlay()
    setCpToast({ at: Date.now() + 1, text: `${t(DAILY_RULES[rule].name)}: ${t(DAILY_RULES[rule].text)}` })
  }

  // zor modun görüntüsü (karanlık, ters ekran) yalnız oyunda: menülere ve bitiş ekranına taşınmasın
  useEffect(() => {
    if (screen === 'play' || screen === 'pause' || screen === 'photo') return
    const r0 = rendererRef.current
    if (r0) {
      r0.dark = false
      r0.hiddenSpikes = false
      r0.ghostGround = false
      r0.quake = false
      if (r0.zoom !== 1) {
        r0.zoom = 1
        window.dispatchEvent(new Event('resize'))
      }
    }
    if (canvasRef.current) canvasRef.current.style.transform = ''
  }, [screen])

  // başarım bildirimi: kazanılıp henüz gösterilmemiş olanlar (ilk açılışta birikmiş olanlar tek bildirimde)
  useEffect(() => {
    if (!ready || quiet) return
    const fresh = freshAchievements(save)
    if (!fresh.length) return
    setAchToast({ at: Date.now(), name: t(fresh[0].name), icon: fresh[0].icon, more: fresh.length - 1 })
    setSave((prev) => {
      const next = { ...prev, ach: { ...(prev.ach ?? {}), ...Object.fromEntries(fresh.map((a) => [a.id, true])) } }
      writeSave(next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save, ready, quiet])
  useEffect(() => {
    if (!achToast) return
    const id = setTimeout(() => setAchToast(null), 3400)
    return () => clearTimeout(id)
  }, [achToast])

  /** Skor tablosundan: o yolcunun bu şehirdeki hayaletine karşı koş (bulunamazsa nedenini döndürür) */
  const startRace = async (idx: number, name: string): Promise<string | null> => {
    try {
      const r = await fetch(`/api/ghosts?level=${LEVELS[idx].id}&name=${encodeURIComponent(name)}`)
      if (!r.ok) return t('Bu yolcunun bu şehirde hayaleti yok.')
      const g = (await r.json()) as { name: string; hero: 'uktun' | 'memo'; timeMs: number; data: number[] }
      soundRef.current?.unlock()
      ui()
      modeRef.current = null
      rushRef.current = null
      rivalRef.current = { level: LEVELS[idx].id, name: g.name, timeMs: g.timeMs, run: { hero: g.hero, data: g.data } }
      loadLevel(idx, 'play')
      beginPlay()
      setCpToast({ at: Date.now() + 1, text: t('{name} hayaletiyle yarış: {time}', { name: g.name, time: formatTime(g.timeMs) }) })
      return null
    } catch {
      return t('Hayalet şu an alınamıyor.')
    }
  }

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
    const terms = duelTerms(d.setup)
    rounds[d.round] = runs.map((r, k) => ({ ...r, score: r.score >= DNF ? DNF : duelScoreWith(terms, k as 0 | 1, r.timeMs, r.deaths, r.items ?? 0) })) as [DuelRun, DuelRun]
    if (duelResult(rounds, d.setup.bestOf).over) {
      setDuel({ ...d, rounds })
      addFeat('duel')
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
    snd.duck(screen === 'pause' || screen === 'photo')
    if (screen === 'play') snd.setMusic(LEVELS[levelIdx].city)
    // yan yana yarış kendi şehrinin müziğini çalar (Race bileşeni); menü teması üstüne binmesin
    else if (screen === 'race') snd.setMusic(LEVELS[duelRef.current?.setup.level ?? levelIdx].city)
    else if (screen !== 'pause' && screen !== 'photo') snd.playTheme()
  }, [screen, levelIdx, ready])

  // speedrun tam turu, Boss Rush ve Günün Boss'u bitince (Rahat Mod değilse) skor tablosuna
  useEffect(() => {
    setTourSent(null)
    const r = rushResult
    const p = save.player
    if (!r || r.relaxed || !p) return
    const T = makeT(langRef.current)
    const body: Record<string, unknown> | null =
      r.kind === 'tur' || r.kind === 'aynaTur'
        ? { level: r.kind === 'tur' ? 'tur' : 'aynatur' }
        : r.kind === 'boss' && r.daily
          ? { level: 'gunluk-b', day: r.daily }
          : r.kind === 'boss'
            ? { level: 'bossrush', variant: r.variant ?? 'duz', bosses: r.bosses }
            : null
    if (!body) return
    let live = true
    fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, playerId: p.id, token: p.token, timeMs: r.timeMs, deaths: r.deaths, items: 0 }) })
      .then((res) => res.json())
      .then((j: { rank?: number; total?: number }) => {
        if (!live || !j.rank) return
        const total = j.total ?? j.rank
        setTourSent(r.daily ? T('Bugünün boss sıralamasında {rank}. sıradasın ({total} yolcu).', { rank: j.rank, total }) : r.kind === 'boss' ? T('Boss Rush tablosunda {rank}. sıradasın ({total} yolcu).', { rank: j.rank, total }) : T('Speedrun tablosunda {rank}. sıradasın ({total} yolcu).', { rank: j.rank, total }))
      })
      .catch(() => {})
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rushResult, save.player?.id])

  // menüye dönünce koşu ve mod biter; oyundaki karakter yine kayıttaki olur
  useEffect(() => {
    // menü ekranlarının hepsi: yarım kalan mod bir sonraki normal koşuya taşınmasın
    if (!['map', 'title', 'modes', 'name', 'story', 'intro', 'character', 'notebook', 'scores', 'controls', 'ruleSetup', 'rageSetup', 'rageCourses', 'challenges', 'tournament', 'gezgin', 'calmSetup', 'storySetup', 'invite', 'shop', 'mirror'].includes(screen)) return
    flushStats()
    rushRef.current = null
    rivalRef.current = null
    challengeRef.current = null
    tournamentRef.current = null
    dailyChRef.current = null
    aynaRef.current = null
    customRef.current = null
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
    const sc = scarfFor(scarfIdOf(save, hero.id))
    rendererRef.current.scarf = sc.id === 'al' ? null : { color: sc.color, shade: sc.shade }
  }, [save.scarf, save.scarfs, hero.id, ready])

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
    patch({ character: id })
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
    persist((s) => ({ ...clearProgress(s), player: null, skippedName: true }))
    setResumeIdx(0)
    setScreen('title')
    if (p) await fetch('/api/players', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, token: p.token }) }).catch(() => {})
  }

  /** hesap ekranında misafirin alt şeridi: solda Geri (menüden gelince), sağda Şimdilik Geç ve tek satır not */
  const guestFooter = (cls: string) => (
    <div className={`${cls} items-center justify-between gap-3 border-t-2 border-line pt-3`}>
      {save.seenStory ? (
        <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
          {ic(t('← Geri'))}
        </button>
      ) : (
        <span />
      )}
      <span className="text-right text-[13px] leading-snug text-muted">
        <button className="text-cream underline-offset-4 hover:underline" onClick={() => afterName({ skippedName: true })}>
          {t('Şimdilik Geç')}
        </button>
        <span className="block">{t('Misafir ilerlemesi bu tarayıcıda kalır.')}</span>
      </span>
    </div>
  )

  const afterName = (part: Partial<Save>) => {
    // giriş async biter: eski kopyayı değil yalnız değişen alanı yaz (arada yazılan rekor korunur)
    patch(part)
    const next = { ...save, ...part }
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
    if (customRef.current?.calm) {
      // Sakin Gezi ve Hikâye Gezisi bitti: ilerlemeye, rekora ve deftere hiçbir şey yazılmaz (hikâye kaydı konuşurken yazılmıştır)
      const story = !!customRef.current.story
      customRef.current = null
      setCpToast({ at: Date.now() + 1, text: story ? t('Şehri gezdin. Hikâye Gezisi bitti.') : t('Şehri gezdin. Sakin Gezi bitti.') })
      setScreen('modes')
      return
    }
    if (customRef.current) {
      setCustomResult({ timeMs, deaths: w.deaths, found: w.pickups.filter((p) => p.taken).length, stamp: w.stampBox ? w.stampTaken : null, charm: w.charmBox ? w.charmTaken : null })
      setScreen('customEnd')
      return
    }
    const ay = aynaRef.current
    if (ay) {
      const relaxed = relaxedRef.current
      const deaths = w.deaths
      setSave((prev) => {
        const old = prev.ayna?.[ay]
        const best = !relaxed && (old === undefined || timeMs < old)
        setMirrorResult({ idx, timeMs, deaths, best, prev: old, relaxed })
        if (!best) return prev
        const next = { ...prev, ayna: { ...(prev.ayna ?? {}), [ay]: timeMs } }
        writeSave(next)
        return next
      })
      setScreen('mirrorEnd')
      return
    }
    const ch = challengeRef.current
    const week = tournamentRef.current
    const dayMini = dailyChRef.current
    if (ch && dayMini && !week) {
      const relaxed = relaxedRef.current
      const deaths = w.deaths
      setSave((prev) => {
        const old = prev.trio?.day === dayMini ? prev.trio.mini : undefined
        const { mark, best } = markTrio(prev.trio, dayMini, 'mini', timeMs)
        setChallengeResult({ id: ch.id, timeMs, deaths, best: best && !relaxed, prev: old, relaxed, daily: dayMini })
        // günün kesiti mücadelenin kendi rekorunu da tazeler
        const chBest = !relaxed && (prev.challenges?.[ch.id] === undefined || timeMs < prev.challenges[ch.id])
        if (relaxed || (!best && !chBest)) return prev
        const trio = best ? settleTrio(mark, dayMini, prev.meydan) : prev.trio
        if (trio && trio.days > (prev.trio?.days ?? 0)) queueMicrotask(() => setCpToast({ at: Date.now() + 1, text: makeT(langRef.current)('Günün Üçlüsü tamamlandı!') }))
        const next = { ...prev, trio, ...(chBest ? { challenges: { ...(prev.challenges ?? {}), [ch.id]: timeMs } } : {}) }
        writeSave(next)
        return next
      })
      setChallengeSend({ status: 'idle', rank: null })
      setScreen('challengeEnd')
      return
    }
    if (ch && week) {
      const relaxed = relaxedRef.current
      const deaths = w.deaths
      setSave((prev) => {
        const old = prev.turnuva?.week === week ? prev.turnuva.best[ch.id] : undefined
        const { mark, best } = markTournament(prev.turnuva, week, ch.id, timeMs)
        setChallengeResult({ id: ch.id, timeMs, deaths, best: best && !relaxed, prev: old, relaxed, week })
        // turnuva koşusu mücadelenin kendi rekorunu da tazeler
        const chBest = !relaxed && (prev.challenges?.[ch.id] === undefined || timeMs < prev.challenges[ch.id])
        if (relaxed || (!best && !chBest)) return prev
        const next = { ...prev, turnuva: mark, ...(chBest ? { challenges: { ...(prev.challenges ?? {}), [ch.id]: timeMs } } : {}) }
        writeSave(next)
        return next
      })
      setChallengeSend({ status: 'idle', rank: null })
      setScreen('challengeEnd')
      return
    }
    if (ch) {
      const relaxed = relaxedRef.current
      const deaths = w.deaths
      setSave((prev) => {
        const old = prev.challenges?.[ch.id]
        const best = !relaxed && (old === undefined || timeMs < old)
        setChallengeResult({ id: ch.id, timeMs, deaths, best, prev: old, relaxed })
        if (!best) return prev
        let next = { ...prev, challenges: { ...(prev.challenges ?? {}), [ch.id]: timeMs } }
        // Gezgin Turu: turun bütün kesitleri bittiyse toplam, tohumun rekorudur
        const gz = gezginRef.current
        if (gz?.ids.includes(ch.id)) {
          const sum = gezginTotal(gz.ids, next.challenges)
          if (sum !== null && (prev.gezgin?.[gz.key] === undefined || sum < prev.gezgin[gz.key])) next = { ...next, gezgin: { ...(prev.gezgin ?? {}), [gz.key]: sum } }
        }
        writeSave(next)
        return next
      })
      setChallengeSend({ status: 'idle', rank: null })
      setScreen('challengeEnd')
      return
    }
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
      const total = { timeMs: rush.timeMs, deaths: rush.deaths, bosses: rush.order.length + (rush.pairs?.filter((x) => x >= 0).length ?? 0) }
      if (rush.daily) {
        const day = rush.daily
        setSave((prev) => {
          const { mark, best } = markTrio(prev.trio, day, 'boss', total.timeMs)
          setRushResult({ ...total, best: best && !relaxed, relaxed, kind: 'boss', daily: day })
          if (relaxed || !best) return prev
          const trio = settleTrio(mark, day, prev.meydan)
          if (trio && trio.days > (prev.trio?.days ?? 0)) queueMicrotask(() => setCpToast({ at: Date.now() + 1, text: makeT(langRef.current)('Günün Üçlüsü tamamlandı!') }))
          const next = { ...prev, trio }
          writeSave(next)
          return next
        })
        setScreen('rushEnd')
        return
      }
      const kind = rush.kind
      const variant = rush.variant
      setSave((prev) => {
        if (kind === 'boss' && variant) {
          const old = prev.rushPlus?.[variant]
          const best = !relaxed && betterRush(total, old) === total && (!old || old.timeMs !== total.timeMs || old.bosses !== total.bosses)
          setRushResult({ ...total, best, relaxed, kind, variant })
          if (!best) return prev
          const next = { ...prev, rushPlus: { ...(prev.rushPlus ?? {}), [variant]: { timeMs: total.timeMs, bosses: total.bosses } } }
          writeSave(next)
          return next
        }
        if (kind === 'tur' || kind === 'aynaTur') {
          const old = prev[kind]
          const best = !relaxed && (!old || total.timeMs < old.timeMs)
          setRushResult({ ...total, best, relaxed, kind })
          if (!best) return prev
          const next = { ...prev, [kind]: { timeMs: total.timeMs, deaths: total.deaths } }
          writeSave(next)
          return next
        }
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
      if (mode.run.rule === 'tekcan' && triesRef.current === 0) addFeat('oneLifeFirst')
      const found = w.pickups.filter((p) => p.taken).length
      const scoreMs = dailyScore(mode.run.rule, timeMs, w.deaths, found)
      const deaths = w.deaths
      if (mode.free) {
        const key = ruleKey(mode.run.levelId, mode.run.rule)
        setSave((prev) => {
          const old = prev.rules?.[key]
          const best = old === undefined || scoreMs < old
          const next = best ? { ...prev, rules: { ...(prev.rules ?? {}), [key]: scoreMs } } : prev
          if (best) writeSave(next)
          setDailyResult({ run: mode.run, timeMs, deaths, found, scoreMs, best, mark: { day: mode.run.day, bestMs: best ? scoreMs : old!, streak: 0 }, free: true, tries: triesRef.current + 1 })
          return next
        })
        setDailySend({ status: 'idle', rank: null })
        setScreen('dailyEnd')
        return
      }
      setSave((prev) => {
        const mark = markDaily(prev.meydan, mode.run.day, scoreMs)
        if (mark.streak >= 7) queueMicrotask(() => addFeat('streak7'))
        const trio = settleTrio(prev.trio, mode.run.day, mark)
        if (trio && trio.days > (prev.trio?.days ?? 0)) queueMicrotask(() => setCpToast({ at: Date.now() + 1, text: makeT(langRef.current)('Günün Üçlüsü tamamlandı!') }))
        const next = { ...prev, meydan: mark, trio }
        writeSave(next)
        setDailyResult({ run: mode.run, timeMs, deaths, found, scoreMs, best: mark.bestMs === scoreMs, mark, tries: triesRef.current + 1 })
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
      const items = w.pickups.filter((p) => p.taken).length
      rounds[d.round][d.turn] = { timeMs, deaths: w.deaths, items, score: duelScoreWith(duelTerms(d.setup), d.turn, timeMs, w.deaths, items) }
      const other = (1 - d.turn) as 0 | 1
      if (!rounds[d.round][other]) {
        // rakip aynı turda bu koşunun hayaletiyle yarışır
        duelGhostRef.current = { hero: d.setup.heroes[d.turn], data: ghostRecRef.current }
        setDuel({ ...d, rounds, turn: other })
        setScreen('duelTurn')
      } else if (duelResult(rounds, d.setup.bestOf).over) {
        duelGhostRef.current = null
        setDuel({ ...d, rounds })
        addFeat('duel')
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
      if (w.level.difficulty === 'Çok Zor' && w.deaths === 0 && !relaxedRef.current) queueMicrotask(() => addFeat('flawlessHard'))
      if (newBest) saveGhost(w.level.id, { hero: prev.character ?? 'uktun', data: ghostRecRef.current })
      const mergedItems = items.map((v, i) => v || !!best?.items[i])
      // speedrun %100: üç hatıra, gizli pul ve nazar boncuğu aynı koşuda (boss zaten yenildi: kapıdan geçildi)
      const full = items.every(Boolean) && (!w.stampBox || w.stampTaken) && (!w.charmBox || w.charmTaken)
      const oldFull = prev.full?.[w.level.id]
      const fullBest = full && !run.relaxed && (oldFull === undefined || timeMs < oldFull)
      const earned: string[] = []
      const day = dailyChallenge(now, LEVELS, prev.unlocked)
      const week = weeklyChallenge(now, LEVELS, prev.unlocked)
      const daily = prev.daily.last !== day.key && completes(day, w.level, run) ? { last: day.key, count: prev.daily.count + 1 } : prev.daily
      const weekly = prev.weekly.last !== week.key && completes(week, w.level, run) ? { last: week.key, count: prev.weekly.count + 1 } : prev.weekly
      if (daily !== prev.daily) earned.push('Günün Şehri Tamam')
      // usta görevi: şehrin ilk şehir insanının görevi bu koşuda yapıldıysa mühür
      const ustaNew = !prev.ustalar?.[w.level.id] && ustaDone(ustaTask(idx), w.level, { timeMs, deaths: w.deaths, items, stamp: !w.stampBox || w.stampTaken, charm: !w.charmBox || w.charmTaken, cleanBoss: bossCleanRef.current, relaxed: run.relaxed })
      if (ustaNew) earned.push('Usta Mührü Kazandın')
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
          [w.level.id]: newBest ? { timeMs, deaths: w.deaths, items: mergedItems, v: cityVersion(w.level.id), ...(run.relaxed ? { relaxed: true } : {}) } : { ...best, items: mergedItems, v: cityVersion(w.level.id), renew: undefined },
        },
        ...(fullBest ? { full: { ...prev.full, [w.level.id]: timeMs } } : {}),
        ...(ustaNew ? { ustalar: { ...prev.ustalar, [w.level.id]: true } } : {}),
        // rekor koşunun bayrak süreleri: bir sonraki koşunun ara süreleri bunlarla kıyaslanır
        ...(newBest && splitRef.current.rec.length ? { splitTimes: { ...prev.splitTimes, [w.level.id]: { v: cityVersion(w.level.id), t: [...splitRef.current.rec] } } } : {}),
      }
      writeSave(next)
      setResumeIdx(resumeFor(next))
      const rival = rivalRef.current?.level === w.level.id ? rivalRef.current : null
      const beaten = !!rival && timeMs < rival.timeMs
      // Rahat Mod'da geçmek başarım saymaz
      if (beaten && !relaxedRef.current) queueMicrotask(() => addFeat('ghostBeaten'))
      setResult({ timeMs, deaths: w.deaths, items, newBest, relaxed: relaxedRef.current, earned, ...(newBest ? { ghost: { hero: prev.character ?? 'uktun', data: [...ghostRecRef.current] } } : {}), ...(rival ? { rival: { name: rival.name, timeMs: rival.timeMs, beaten } } : {}), ...(full && !run.relaxed ? { full: { best: fullBest, prev: oldFull } } : {}) })
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
    // Hikâye Gezisi'nde kişinin sözü baloncukta değil konuşma panelinde; konuşurken tabela da susar
    const story = !!customRef.current?.story
    r.dialog = talkNpc >= 0 ? null : who && !story ? { kind: 'npc', name: who.name, text: who.text } : hint ? { kind: 'sign', text: hint } : null
  }, [npc, hint, level, talkNpc])

  // ses ayarı tek kaynaktan: kayıt hangi yoldan değişirse değişsin (düğme, bulut, giriş, sıfırlama) ses onu izler
  useEffect(() => {
    const snd = soundRef.current
    if (!snd) return
    snd.sfxOn = save.sfx
    snd.musicOn = save.music
    snd.setVolumes(save.sfxVol ?? 1, save.musicVol ?? 1)
  }, [save.sfx, save.music, save.sfxVol, save.musicVol, ready])

  // tuş ataması ve ekran sarsıntısı: kayıttan girdiye ve çizime
  useEffect(() => {
    inputRef.current?.setBindings(normalizeKeys(save.keys))
  }, [save.keys, ready])
  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    r.shakeScale = (save.shake ?? !reduce) ? (save.shakePower ?? 1) : 0
  }, [save.shake, save.shakePower, ready])
  // Kolaylıklar (cihaz ayarı): hayalet görünürlüğü, dash halkası, kamera yakınlığı, titreşim, büyük yazı
  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    r.ghostAlpha = save.ghostAlpha ?? 0.46
    r.dashMeter = !!save.dashMeter
    r.colorBlind = save.colorBlind ?? 'yok'
    const z = save.camZoom ?? 1
    if (r.userZoom !== z) {
      r.userZoom = z
      window.dispatchEvent(new Event('resize'))
    }
  }, [save.ghostAlpha, save.dashMeter, save.camZoom, save.colorBlind, ready])
  // renk körü paleti: arayüz renkleri CSS değişkenleriyle (globals.css `data-cb`), tuval renderer.colorBlind ile
  useEffect(() => {
    document.documentElement.dataset.cb = save.colorBlind ?? 'yok'
  }, [save.colorBlind])
  useEffect(() => {
    setHapticScale(save.hapticPower ?? 1)
  }, [save.hapticPower])
  useEffect(() => {
    document.documentElement.dataset.bigText = save.bigText ? 'on' : 'off'
  }, [save.bigText])

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
        <figcaption className="text-[14px] font-semibold text-[#8a3a24]">{t("GEZGİN’İN DEFTERİNDEN")}</figcaption>
        <blockquote className="mt-1 text-[14px] italic leading-relaxed">“{level.note}”</blockquote>
      </figure>
      {/* geniş ekranda yer yetenek listesinin: yolun özeti deftere yazılı notta zaten var */}
      <p className="mt-3 text-[14px] leading-snug text-cream/85 wide:hidden">{level.intro}</p>
      <Bestiary level={level} only="help" />
    </>
  )
  /** şehrin madalya süreleri ve (klavyede) tuşlar: geniş ekranda sol sütunun altı, dar ekranda Şehir Hakkında'nın sonu */
  const introGoals = (
    <>
      {!showTouch && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
          <span className="flex items-center gap-1.5"><Key>←</Key><Key>→</Key> {t("Yürü")}</span>
          <span className="flex items-center gap-1.5"><Key>↑</Key> {t("Zıpla")}</span>
          <span className="flex items-center gap-1.5 text-gold"><Key wide>Space</Key> {t("Dash")}</span>
        </div>
      )}
    </>
  )
  const introFacts = (
    <>
      <Bestiary level={level} only="creatures" />
      <div className="mt-4 flex items-center gap-3 border-2 border-line bg-ink/40 px-3 py-2">
        <BossFigure city={level.city} className="h-[64px] w-[72px] shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-accent-2">{t('Şehrin Boss’u')}</p>
          <p className="font-display text-xl leading-tight text-cream">{lang === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{t('İşaretini bekle, yorulunca üstüne bas.')}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(['altin', 'gumus', 'bronz'] as const).map((m, k) => (
          <div key={m} className="border-2 border-line bg-ink/40 px-1 py-2">
            <p className="flex items-center justify-center gap-1.5 font-display text-lg leading-none text-cream">
              <MedalBadge medal={m} />
              {level.medals[k]}
            </p>
            <p className="mt-1 text-[12px] text-muted">{t("Saniye")}</p>
          </div>
        ))}
      </div>
    </>
  )

  // ayarlar tek yerde: Mola ve Ayarlar ekranı aynı listeyi gösterir; her seçeneğin altında ne işe yaradığı yazar
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // ayarlar üç grupta: molada sekmeli (sağ sütun kısa kalır), Ayarlar ekranında hepsi bir arada
  const soundSet = (
    <>
      <div>
        <Toggle label={t('Ses Efektleri')} hint={t('Zıplama, toplama ve vuruş sesleri')} on={save.sfx} onChange={() => toggle('sfx')} />
        {save.sfx && <Level label={t('Düzey')} value={save.sfxVol ?? 1} onChange={(v) => patch({ sfxVol: v })} />}
      </div>
      <div>
        <Toggle label={t('Müzik')} hint={t('Her şehrin kendi makamında ezgisi')} on={save.music} onChange={() => toggle('music')} />
        {save.music && <Level label={t('Düzey')} value={save.musicVol ?? 1} onChange={(v) => patch({ musicVol: v })} />}
      </div>
    </>
  )
  const controlSet = (
    <>
      <Toggle label={t('Dokunmatik Kontroller')} hint={t('Ekranda joystick ve tuşlar.')} on={showTouch} onChange={() => patch({ touch: showTouch ? 'off' : 'on' })} />
      {/* ikisi de hep listede: dokunmatik açılıp kapanınca liste zıplamasın */}
      <Toggle label={t('Tuş İpuçları')} hint={t('Klavyeyle oynarken ekranın altında tuş rehberi')} on={save.keyHints} onChange={() => patch({ keyHints: !save.keyHints })} />
      <Toggle label={t('Büyük Tuşlar')} hint={t('Dokunmatik kontrollerde daha geniş dokunma alanı')} on={save.controlSize === 'buyuk'} onChange={() => patch({ controlSize: save.controlSize === 'buyuk' ? 'normal' : 'buyuk' })} />
    </>
  )
  const gameSet = (
    <>
      <Toggle label={t('Hayalet Koşu')} hint={t('Bitirdiğin şehirde en iyi koşunun hayaleti yanında koşar.')} on={save.ghost} onChange={() => patch({ ghost: !save.ghost })} />
      <Toggle label={t('Devam Ederken Geri Sayım')} hint={t('Moladan dönerken 3-2-1 sayılır; sayım sırasında oyun akmaz.')} on={save.countdown !== false} onChange={() => patch({ countdown: save.countdown === false })} />
      <Toggle label={t('Ara Süreler')} hint={t('Her bayrakta rekor koşuna göre kaç saniye önde ya da geride olduğun')} on={save.splits !== false} onChange={() => patch({ splits: save.splits === false })} />
      <Toggle label={t('Ekran Sarsıntısı')} hint={t('Vuruşta ve boss inişinde ekran sarsılır.')} on={save.shake ?? !reduceMotion} onChange={() => patch({ shake: !(save.shake ?? !reduceMotion) })} />
      <div>
        <Toggle label={t('Rahat Mod')} tag={save.relaxed ? t('Skor Yazılmaz') : undefined} hint={t('Oyun yavaş akar; bu modda skor yazılmaz.')} on={save.relaxed} onChange={() => patch({ relaxed: !save.relaxed })} />
        {save.relaxed && <Choice label={t('Oyun Hızı')} value={save.relaxedSpeed ?? 0.8} options={[0.6, 0.7, 0.8, 0.9].map((v) => ({ v, label: `%${Math.round(v * 100)}` }))} onChange={(v) => patch({ relaxedSpeed: v })} />}
      </div>
    </>
  )
  // Kolaylıklar: cihaz ayarı, fizik değişmez (yalnız yardım ve çizim)
  const assistSet = (
    <>
      <div className="border-2 border-line bg-ink/30 px-2 py-2 [&>div]:flex-wrap [&>div]:pb-0">
        <Choice label={t('Hayalet Görünürlüğü')} value={save.ghostAlpha ?? 0.46} options={[{ v: 0.25, label: t('Soluk') }, { v: 0.46, label: t('Normal') }, { v: 0.8, label: t('Belirgin') }]} onChange={(v) => patch({ ghostAlpha: v })} />
      </div>
      <div className="border-2 border-line bg-ink/30 px-2 py-2 [&>div]:flex-wrap [&>div]:pb-0">
        <Choice label={t('Kamera Yakınlığı')} value={save.camZoom ?? 1} options={[{ v: 0.85, label: t('Uzak') }, { v: 1, label: t('Normal') }, { v: 1.15, label: t('Yakın') }]} onChange={(v) => patch({ camZoom: v })} />
      </div>
      <div className="border-2 border-line bg-ink/30 px-2 py-2 [&>div]:flex-wrap [&>div]:pb-0">
        <Choice label={t('Sarsıntı Şiddeti')} value={save.shakePower ?? 1} options={[{ v: 0.5, label: t('Hafif') }, { v: 1, label: t('Normal') }]} onChange={(v) => patch({ shakePower: v })} />
      </div>
      <div className="border-2 border-line bg-ink/30 px-2 py-2 [&>div]:flex-wrap [&>div]:pb-0">
        <Choice label={t('Titreşim Yoğunluğu')} value={save.hapticPower ?? 1} options={[{ v: 0, label: t('Kapalı') }, { v: 0.5, label: t('Hafif') }, { v: 1, label: t('Normal') }]} onChange={(v) => patch({ hapticPower: v })} />
      </div>
      <div className="border-2 border-line bg-ink/30 px-2 py-2 [&>div]:flex-wrap [&>div]:pb-0">
        <Choice<CbMode> label={t('Renk Körü Paleti')} value={save.colorBlind ?? 'yok'} options={[{ v: 'yok', label: t('Kapalı') }, { v: 'kirmizi-yesil', label: t('Kırmızı-Yeşil') }, { v: 'mavi-sari', label: t('Mavi-Sarı') }]} onChange={(v) => patch({ colorBlind: v })} />
        <CbPreview mode={save.colorBlind ?? 'yok'} />
      </div>
      <Toggle label={t('Dash Göstergesi')} hint={t('Karakterin üstünde dash hakkı: dolu halka hazır, boş halka bekliyor.')} on={!!save.dashMeter} onChange={() => patch({ dashMeter: !save.dashMeter })} />
      <Toggle label={t('Basılı Tut Zıplama')} hint={t('Zıplama tuşunu basılı tutunca yere her inişte yeniden zıplarsın.')} on={!!save.holdJump} onChange={() => patch({ holdJump: !save.holdJump })} />
      <Toggle label={t('Büyük Yazı')} hint={t('Arayüzdeki yazılar büyür.')} on={!!save.bigText} onChange={() => patch({ bigText: !save.bigText })} />
    </>
  )
  const settingsList = (
    <div className="mt-1 grid divide-y-2 divide-line/60 short:grid-cols-2 short:gap-x-4 short:divide-y-0">
      {soundSet}
      {controlSet}
      {gameSet}
      {assistSet}
    </div>
  )
  /**
   * Ayarlar ekranı (geniş): dört öbek. Ses düzey çubuklarıyla; Oynanış ile Ekran ve Kontroller iki sütunlu kartlar (adı,
   * anahtarı ve ne işe yaradığı); Dil ve Yardım kendi satırında. Molada sıkı kutucuklar (settingsPause) kalır.
   */
  const settingsWide = (
    <div className="grid gap-4">
      <section>
        <SectionTitle title={t('Ses')} note={t('Efekt ve müzik ayrı ayrı')} tone="var(--color-teal)" />
        {/* iki ses yan yana: her biri adı, anahtarı ve düzey çubuğuyla kendi kutusunda */}
        <div className="sound-pair mt-2 grid grid-cols-2 gap-2">{soundSet}</div>
      </section>
      <CardToggles.Provider value>
        <section>
          <SectionTitle title={t('Oynanış')} note={t('Koşunun akışı ve kolaylıklar')} tone="var(--color-gold)" />
          <div className="mt-2 grid grid-cols-2 gap-2">{gameSet}</div>
        </section>
        <section>
          <SectionTitle title={t('Kolaylıklar')} note={t('Yardım ve çizim; fizik aynı kalır')} tone="var(--color-teal)" />
          <div className="mt-2 grid grid-cols-2 gap-2">{assistSet}</div>
        </section>
        <section>
          <SectionTitle title={t('Ekran ve Kontroller')} note={t('Dokunmatik ve görünüm')} tone="var(--color-accent)" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {controlSet}
            {canFull && (
              <button type="button" className="flex h-full w-full flex-col border-2 border-line bg-ink/30 px-3 py-2.5 text-left hover:bg-panel-2/60" onClick={fullscreen}>
                <span className="flex w-full items-center justify-between gap-2 text-[14px] font-semibold text-cream">
                  {t('Tam Ekran')}
                  <span aria-hidden className="text-accent-2">⛶</span>
                </span>
                <span className="mt-1 text-[13px] leading-snug text-muted">{t('Tarayıcı çubukları gizlenir; Esc ile çıkılır.')}</span>
              </button>
            )}
          </div>
        </section>
      </CardToggles.Provider>
      {/* yardım: rehber ve uygulama gibi kur (dil başlıkta) */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={() => (ui(), patch({ tutorial: true }))} disabled={save.tutorial}>
          {save.tutorial ? t('Rehber Açık') : t('Rehberi Yeniden Göster')}
        </button>
        {installer.canInstall && (
          <button className="pixel-btn primary px-3 py-1.5 text-[13px]" onClick={() => void installer.install()}>
            {ic(t('⤓ Ana Ekrana Ekle'))}
          </button>
        )}
        {save.tutorial && <span className="text-[13px] text-muted">{t('Sıradaki oyunda adım adım gösterilecek.')}</span>}
        {installer.iosHint && <span className="text-[13px] text-muted">{t('Uygulama gibi açmak için Safari’de Paylaş → Ana Ekrana Ekle.')}</span>}
      </div>
    </div>
  )
  // molada: üstte ses (düzey çubuklarıyla), altında öbür ayarlar iki sütunlu sıkı kutucuklar (iki sütun dengeli, kaydırma yok)
  const settingsPause = pauseKeys ? (
    <>
      {/* molada tuş atama: oyuna dönmeden tuşları değiştir */}
      <button className="pixel-btn back-btn mt-2 w-full justify-center py-2 text-[13px]" onClick={() => setPauseKeys(false)}>
        {ic(t('← Ayarlar'))}
      </button>
      <KeyRemap keys={save.keys} onChange={(k) => patch({ keys: k })} stack />
    </>
  ) : (
    <>
      <div className="mt-1 grid divide-y-2 divide-line/60">{soundSet}</div>
      <CompactToggles.Provider value>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {controlSet}
          {gameSet}
          {screen === 'pause' && (
            <button type="button" className="flex w-full items-center justify-between gap-2 border-2 border-line bg-ink/30 px-2.5 py-2 text-left text-[13px] font-semibold text-cream hover:bg-panel-2/60 short:py-1.5" onClick={() => setPauseKeys(true)}>
              {t('Tuşları Değiştir')}
              <span aria-hidden>⌨</span>
            </button>
          )}
          {canFull && (
            <button type="button" className="flex w-full items-center justify-between gap-2 border-2 border-line bg-ink/30 px-2.5 py-2 text-left text-[13px] font-semibold text-cream hover:bg-panel-2/60 short:py-1.5" onClick={fullscreen}>
              {t('Tam Ekran')}
              <span aria-hidden>⛶</span>
            </button>
          )}
        </div>
      </CompactToggles.Provider>
    </>
  )



  /** HUD ve Mola'daki mod başlığı */
  const modeLabel = modeRef.current?.kind === 'daily' ? `${RAGE_RULES.includes(modeRef.current.run.rule as RageRule) ? t('Sinir Bozucu') : modeRef.current.free ? t('Kurallı') : t('Günlük')} · ${t(DAILY_RULES[modeRef.current.run.rule].name)}${DAILY_RULES[modeRef.current.run.rule].swapKeys && worldRef.current && swapPhase(worldRef.current.time).flipped ? ` · ⇄ ${t('Ters')}` : ''}${ruleLimit(modeRef.current.run.rule, level) ? ` · ${formatTime(ruleLimit(modeRef.current.run.rule, level)! * 1000).slice(0, -2)}` : ''}` : modeRef.current?.kind === 'duel' && duel ? `${t('Düello')} · ${duel.setup.names[duel.turn]}` : customRef.current ? (customRef.current.story ? t('Hikâye Gezisi') : customRef.current.calm ? t('Sakin Gezi') : t('Özel Harita')) : aynaRef.current ? `◐ ${t('Ayna Yolu')}` : challengeRef.current ? `${tournamentRef.current ? `${t('Turnuva')} · ` : '▲ '}${t(challengeRef.current.name)}` : rivalRef.current?.level === level.id ? `◌ ${rivalRef.current.name} · ${formatTime(rivalRef.current.timeMs).slice(0, -2)}` : rushRef.current ? (rushRef.current.kind === 'boss' ? t('Boss Rush') : `${t(rushRef.current.kind === 'tur' ? 'Tam Tur' : rushRef.current.kind === 'aynaTur' ? 'Ayna Tam Tur' : 'Maraton')} ${rushRef.current.i + 1}/${rushRef.current.order.length}`) : undefined

  /** Mola eylemleri */
  const pauseRetry = () => {
    worldRef.current?.retryFromCheckpoint()
    setScreen('play')
  }
  const pauseRestart = () => (rankedDaily ? restartKeep() : loadLevel(levelIdx, 'play'))
  /** koşu sürüyorsa (süre işlemiş) çıkmadan önce onay ister */
  const leaveRun = (to: 'title' | 'map') => (hud.time > 0.05 ? setExitAsk(to) : setScreen(to))
  const toggleGhost = () => {
    const on = !save.ghost
    patch({ ghost: on })
    // açılınca hayalet hemen yüklenir (tanımlı ve haritası eskimemişse)
    if (on && plainRun && rendererRef.current && !saveRef.current?.best[level.id]?.stale) rendererRef.current.ghostRun = loadGhost(level.id)
  }
  // Mola kısayolları (R, S, M, F, G; Esc ve Shift + R oyun girdisinde): yazı alanındayken ve tuş atarken dokunmaz
  const pauseActs = useRef({ retry: pauseRetry, leave: leaveRun, photo: openPhoto, ghost: toggleGhost, plain: plainRun })
  pauseActs.current = { retry: pauseRetry, leave: leaveRun, photo: openPhoto, ghost: toggleGhost, plain: plainRun }
  useEffect(() => {
    if (screen !== 'pause' || pauseKeys || resumeN !== null) return
    const on = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      const a = pauseActs.current
      if (e.code === 'KeyR') a.retry()
      else if (e.code === 'KeyM') a.leave('title')
      else if (e.code === 'KeyS') a.leave('map')
      else if (e.code === 'KeyF') a.photo()
      else if (e.code === 'KeyG' && a.plain) a.ghost()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [screen, pauseKeys, resumeN])
  // Mola'daki mod bilgisi: kural, kalan süre, deneme
  const modeRule = modeRef.current?.kind === 'daily' ? DAILY_RULES[modeRef.current.run.rule] : null
  const modeLimit = modeRef.current?.kind === 'daily' ? ruleLimit(modeRef.current.run.rule, level) : null
  const modeCard = modeLabel ? (
    <div className="mt-3 border-2 border-accent/60 bg-accent/10 px-3 py-2 short:mt-2 short:py-1.5">
      <p className="text-[12px] font-bold tracking-[0.12em] text-accent-2">{t('Mod').toLocaleUpperCase(lang)}</p>
      <p className="text-[14px] font-semibold leading-snug text-cream">{modeLabel}</p>
      {modeRule && <p className="mt-0.5 text-[13px] leading-snug text-cream/85">{t(modeRule.text)}</p>}
      {rankedDaily && <p className="mt-0.5 text-[13px] leading-snug text-gold">{t('Tek hak: baştan başlasan da süre ve düşüş sürer, çıkarsan koşun biter.')}</p>}
      {modeRef.current?.kind === 'duel' && <p className="mt-0.5 text-[13px] leading-snug text-cream/85">{t('Düello: skor süre artı düşüş başına 5 saniye.')}</p>}
      <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] tabular-nums text-muted">
        {modeLimit ? <span>{t('Kalan')} <strong className="text-cream">{formatTime(Math.max(0, modeLimit - hud.time) * 1000).slice(0, -2)}</strong></span> : null}
        {modeRule?.oneLife ? <span>{t('Tek Can')} · {t('{n}. deneme', { n: triesRef.current + 1 })}</span> : <span>{t('Düşüş')} <strong className="text-cream">{hud.deaths}</strong></span>}
      </p>
    </div>
  ) : null

  // Mola'daki şehir özeti: bu şehirde neler bulundu, rekor ve sıradaki madalya hedefi
  const cityBest = save.best[level.id]
  const cityMedal = cityBest && !cityBest.stale ? medalFor(level, cityBest.timeMs) : null
  const nextMedal = cityMedal === 'altin' ? null : cityMedal === 'gumus' ? 0 : cityMedal === 'bronz' ? 1 : 2
  const cityCard = (
    <div className="mt-3 border-2 border-line bg-ink/40 px-3 py-2.5 short:hidden">
      <SectionTitle title={t('Bu Şehirde')} />
      <div className="mt-2 flex items-center gap-1.5">
        {[0, 1, 2].map((k) => (
          <ItemIcon key={k} city={level.city} taken={hud.items[k] || !!cityBest?.items[k]} size={24} />
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        <ThingIcon kind="stamp" taken={!!save.stamps[level.id]} size={24} />
        <ThingIcon kind="charm" taken={!!save.charms[level.id]} size={24} />
        <span className="ml-auto flex items-center gap-1.5 text-[13px] text-muted">
          {save.bosses[level.id] ? t('Boss Yenildi') : t('Boss Bekliyor')}
          <BossFigure city={level.city} className={`h-8 w-9 ${save.bosses[level.id] ? '' : 'opacity-40 brightness-0'}`} />
        </span>
      </div>
      <p className={`mt-2 flex flex-wrap items-center gap-x-2 text-[13px] text-muted ${modeLabel ? 'hidden' : ''}`}>
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
    </div>
  )

  return (
    <LangProvider value={lang}>
    <div className="game-root">
      <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 w-full" style={{ top: 'env(safe-area-inset-top)', height: 'calc(100% - env(safe-area-inset-top))' }} aria-label={t("Oyun Alanı")} />

      {screen === 'play' && (
        <>
          <Hud level={level} hud={hud} hero={hero.id} scarf={heroScarf} showGoal={levelIdx < GOAL_CITIES && !rushRef.current && !modeRef.current}
            label={modeLabel}
            penaltyFor={modeRef.current?.kind === 'daily' ? ((r) => (d: number, f: number) => dailyScore(r, 0, d, f))(modeRef.current.run.rule) : modeRef.current?.kind === 'duel' && duel ? (d: number, f: number) => d * duelTerms(duel.setup).penalty * 1000 - f * duelTerms(duel.setup).itemBonus * 1000 : undefined}
            onPause={() => setScreen('pause')} />
          {titleCard > 0 && hud.time < 0.05 && (
            <div key={titleCard} className={`title-card ${save.tutorial ? 'slow' : ''} pointer-events-none absolute inset-x-0 top-[30%] z-10 flex flex-col items-center ${save.tutorial ? '[@media(max-height:500px)]:top-[20%]' : '[@media(max-height:500px)]:top-[12%]'}`}>
              <div className="kilim w-[min(520px,80vw)]" />
              <p className="mt-3 max-w-[min(560px,92vw)] px-4 text-center text-[12px] font-bold tracking-[0.16em] text-accent-2 [text-shadow:0_2px_0_#0e0d22] [text-wrap:balance] sm:text-[13px] sm:tracking-[0.4em]">
                {String(level.plate).padStart(2, '0')} · {level.subtitle.toLocaleUpperCase(lang)}
              </p>
              <p className="px-4 text-center font-display text-5xl text-cream [text-shadow:0_4px_0_#0e0d22] min-[420px]:text-6xl sm:text-7xl [@media(max-height:500px)]:text-5xl">{level.name}</p>
              {save.tutorial && !rushRef.current && !modeRef.current ? (
                <p className="mt-2 max-w-[min(520px,88vw)] px-2 text-center text-[15px] leading-snug text-gold [text-shadow:0_2px_0_#0e0d22,0_0_10px_#0e0d22] [text-wrap:balance] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-[13px]">{t('Gezgin’in defterini tamamla: her şehirde 3 hatıra topla, meydandaki boss’u yen.')}</p>
              ) : (
                <p className="mt-2 bg-ink/70 px-2.5 py-0.5 text-[13px] font-semibold text-cream">{t("Hareket Edince Süre Başlar")}</p>
              )}
              <div className="kilim mt-3 w-[min(520px,80vw)]" />
            </div>
          )}
          {/* konuşma ve tabela, kişinin başının üstünde baloncuk olarak çizilir (render.ts); burada yalnız ekran okuyucu için */}
          <p className="sr-only" role="status" aria-live="polite">
            {npc >= 0 && level.npcs[npc] ? `${level.npcs[npc].name}: ${level.npcs[npc].text}` : (hint ?? '')}
          </p>
          {npc < 0 && !hint && tutStep && !coach ? (
            <TutorialHint key={tutStep} step={tutStep} touch={showTouch} keys={normalizeKeys(save.keys)} />
          ) : null}
          {quip && (
            // ölünce şehrin lafı: oynanış alanında değil, üstte HUD'ın altında; küçük ve soluk (yeniden doğuşu kapatmaz)
            <div key={quip.key} className="pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+62px)] z-10 flex justify-center px-4">
              <p className="rise font-display text-[13px] text-cream/75 [text-shadow:0_1px_0_#0e0d22,0_0_8px_#0e0d22] sm:text-sm">{quip.text}</p>
            </div>
          )}
          {toast && (
            <div key={toast.key} className="toast-strip pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+58px)] z-10 flex justify-center px-4">
              <p className="flex max-w-[92vw] items-center gap-2 bg-ink/85 py-1.5 pl-1.5 pr-3 text-[13px] text-cream [box-shadow:0_-2px_0_0_#d9a441,0_2px_0_0_#d9a441,-2px_0_0_0_#d9a441,2px_0_0_0_#d9a441] sm:text-[13px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#221f4a]">
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
            <div className="rise pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+108px)] z-10 flex justify-center px-3 [@media(max-height:500px)]:top-[calc(var(--safe-top)+72px)]">
              <ol className="flex max-w-[96vw] items-stretch gap-1.5 text-[13px] font-bold text-cream sm:gap-2 sm:text-[13px]">
                {[t('İşareti Gör'), t('Saldırıdan Kaç'), t('Yorulunca Üstüne Bas')].map((s, i) => (
                  <li key={s} className={`flex items-center gap-1.5 bg-ink/85 px-2 py-1.5 [box-shadow:0_-2px_0_0_#37337a,0_2px_0_0_#37337a,-2px_0_0_0_#37337a,2px_0_0_0_#37337a] ${i === 2 ? 'text-gold' : ''}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center text-[12px] ${i === 2 ? 'bg-gold text-ink' : 'bg-accent-deep text-white'}`}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {cpToast && Date.now() - cpToast.at < 3200 && (
            <div key={cpToast.at} className={`rise pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4 ${toast ? 'top-[calc(var(--safe-top)+100px)]' : 'top-[calc(var(--safe-top)+60px)]'}`}>
              {/* sakin şerit: yarı saydam, solda ince kırmızı çizgi; göze batmaz, oynanışı kapatmaz */}
              <div className="max-w-[min(88vw,380px)] border-l-2 border-[#e30a17] bg-ink/60 px-3 py-1.5 text-left backdrop-blur-[2px]">
                <p className="flex items-center gap-1.5 font-display text-[13px] text-cream/90">
                  <span className="text-[#e30a17]">⚑</span> {t("Checkpoint")}
                  {cpToast.delta != null && (
                    <span className={`ml-auto pl-3 font-mono text-[13px] font-bold tabular-nums ${cpToast.delta <= 0 ? 'text-[#7ad88a]' : 'text-[#f08a80]'}`} title={t('Rekor Koşuya Göre')}>
                      {cpToast.delta <= 0 ? '−' : '+'}
                      {(Math.abs(cpToast.delta) / 1000).toFixed(2)}
                    </span>
                  )}
                </p>
                <p className="text-[13px] italic leading-snug text-gold/85 [text-wrap:balance]">{cpToast.text}</p>
              </div>
            </div>
          )}
          {customRef.current?.story && talkNpc < 0 && npc >= 0 && level.npcs[npc] && (
            <TalkPrompt
              name={level.npcs[npc].name}
              touch={showTouch}
              onTalk={() => {
                talkRef.current = npc
                setTalkNpc(npc)
              }}
            />
          )}
          {customRef.current?.story && talkNpc >= 0 && <StoryTalk key={`${levelIdx}:${talkNpc}`} level={LEVELS[levelIdx]} npc={talkNpc} hero={save.character ?? 'uktun'} mask={save.story?.[npcKey(LEVELS[levelIdx].id, talkNpc)] ?? 0} onMeet={meetNpc} onAsk={askNpc} onGift={giftNpc} onClose={closeTalk} />}
          {showTouch && inputRef.current && <TouchControls input={inputRef.current} big={save.controlSize === 'buyuk'} canDash={hud.canDash} focus={tutStep === 'walk' ? 'stick' : tutStep === 'jump' ? 'jump' : tutStep === 'dash' ? 'dash' : null} />}
          {!showTouch && save.keyHints && !save.tutorial && <KeyHints canDash={hud.canDash} idle={hud.idle} keys={normalizeKeys(save.keys)} />}
        </>
      )}

      {achToast && (
        // başarım: her ekranda üstte, küçük bir şerit; oynanışı ve menüyü kapatmaz
        <div key={achToast.at} className="rise pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+6px)] z-[60] flex justify-center px-4">
          <div className="flex items-center gap-2.5 bg-ink/90 py-1.5 pl-1.5 pr-3.5 [box-shadow:0_0_0_2px_#d9a441]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-lg text-ink">{achToast.icon}</span>
            <span className="leading-tight">
              <span className="block text-[14px] font-semibold text-gold">{t('Başarım')}</span>
              <span className="block font-display text-[16px] text-cream">
                {achToast.name}
                {achToast.more > 0 && <span className="ml-1.5 text-[13px] text-muted">{t('+{n} daha', { n: achToast.more })}</span>}
              </span>
            </span>
          </div>
        </div>
      )}

      {screen === 'title' && (mapNotice.renewed.length > 0 || mapNotice.added.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0d22]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="harita-notu">
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 sm:p-6 short:py-3">
            <p className="text-[14px] font-semibold text-accent-2">{t('Deftere Yeni Sayfalar')}</p>
            <h2 id="harita-notu" className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Yolda Neler Değişti')}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/85">{t('İlerlemen yerinde: açtığın şehirler, hatıraların, pulların ve nazar boncukların duruyor. Bir şehre dokun, hemen oyna.')}</p>
            <div className="overlay-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1">
              {(
                [
                  ['added', t('Yeni Şehirler'), t('Yola katıldı'), 'border-[#7ad88a] text-[#a8e8b2]'],
                  ['renewed', t('Yenilenen Haritalar'), t('Rekorun ve sıralaman duruyor; yeni yolu görmek için yeniden oyna'), 'border-gold text-gold'],
                ] as const
              ).map(([k, title, note, tone]) =>
                mapNotice[k].length ? (
                  <div key={k} className="mb-3">
                    <SectionTitle title={title} tone="var(--color-gold)" />
                    <p className="mt-1 text-[13px] text-muted">{note}</p>
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
                              persist(ackMapNews)
                              loadLevel(i)
                            }}
                          >
                            <span className="text-[13px] font-bold tabular-nums opacity-80">{String(LEVELS[i].plate).padStart(2, '0')}</span>
                            <span className="min-w-0 flex-1 font-display text-[16px] leading-tight text-cream">{displayName(LEVELS[i])}</span>
                            <span className="text-[13px]">{locked ? '🔒' : '▶'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null,
              )}
              {/* yeni şehirle gelen yenilikler: eski oyuncu yeni modları da görsün */}
              {mapNotice.added.flatMap((id) => RELEASE_NOTES[id] ?? []).length > 0 && (
                <div className="mb-3">
                  <SectionTitle title={t('Bu Sürümde')} tone="var(--color-gold)" />
                  <ul className="mt-2 grid gap-1.5">
                    {mapNotice.added.flatMap((id) => RELEASE_NOTES[id] ?? []).map(([head, body]) => (
                      <li key={head} className="border-l-2 border-accent pl-2.5 text-[14px] leading-snug text-cream/85">
                        <strong className="font-display text-cream">{t(head)}</strong> · {t(body)}
                      </li>
                    ))}
                  </ul>
                  <button className="pixel-btn mt-2 w-full justify-center text-[14px]" onClick={() => (ui(), persist(ackMapNews), setScreen('modes'))}>
                    {t('Modlara Bak')}
                  </button>
                </div>
              )}
            </div>
            <button className="pixel-btn primary mt-3 justify-center text-base" autoFocus onClick={() => (ui(), persist(ackMapNews))}>
              {t('Tamam, Menüye Dön')}
            </button>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <Overlay>
          <div className="title-vignette pointer-events-none fixed inset-0 -z-10" />
          <TitleMenu
            fresh={isFresh(save)}
            resume={resumeIdx}
            character={save.character ?? null}
            hero={hero}
            scarf={heroScarf}
            best={save.best}
            found={totalFound}
            stamps={Object.values(save.stamps ?? {}).filter(Boolean).length}
            charms={Object.values(save.charms ?? {}).filter(Boolean).length}
            daily={isFresh(save) ? null : { level: dailyLevel, rule: t(DAILY_RULES[daily.rule].name), doneMs: save.meydan?.day === today ? formatTime(save.meydan.bestMs) : null, used: dailyUsed, streak: liveStreak(save.meydan, today) }}
            dailyPending={!isFresh(save) && !dailyUsed}
            trio={trioCount(trioParts(save.trio, today, save.meydan))}
            wallet={wallet}
            modeHint={
              isFresh(save)
                ? undefined
                : recommend({
                    cities: Object.keys(save.best).length,
                    ruleRecords: Object.keys(save.rules ?? {}).filter((k) => !RAGE_RULES.includes(k.split(':')[1] as RageRule)).length,
                    bossesBeaten: beaten,
                    rushNeeds: RUSH_NEEDS,
                    rushPlayed: !!save.rush,
                    dailyUsed,
                    trioDone: trioCount(trioParts(save.trio, today, save.meydan)),
                    mirrorOpen: LEVELS.slice(0, FIRST_BOOK).every((l) => save.best[l.id]),
                    mirrorDone: Object.keys(save.ayna ?? {}).length,
                    challengeDone: CHALLENGES.filter((c) => save.challenges?.[c.id]).length,
                  }).find((r) => r.id !== 'daily')?.id
            }
            music={save.music}
            player={save.player ? { name: save.player.name, title: t(travelerTitle(titleFacts(save, today))) } : null}
            hasProgress={save.unlocked > 0 || Object.keys(save.best).length > 0}
            onStart={startJourney}
            onCity={(i) => {
              soundRef.current?.unlock()
              ui()
              loadLevel(i)
            }}
            unlocked={save.unlocked}
            onScreen={(s) => {
              ui()
              if (s === 'character') pickThenPlayRef.current = false
              if (s === 'story') setStoryPage(0)
              if (s === 'scores') (setBoardTab('genel'), setBoardSub({ sub: '' }))
              setScreen(s)
            }}
            onMusic={() => toggle('music')}
            langSwitch={
              <span className="flex items-center gap-1" role="group" aria-label={t('Dil')}>
                {(['tr', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    aria-pressed={lang === l}
                    className={`min-h-[30px] min-w-[38px] px-2 py-1 text-[13px] font-bold tracking-wider ${lang === l ? 'bg-gold text-ink' : 'text-muted hover:text-cream'}`}
                    onClick={() => (ui(), patch({ lang: l }))}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </span>
            }
          />
        </Overlay>
      )}

      {screen === 'character' && (
        <Overlay>
          <div className="rise pixel-panel w-full max-w-2xl p-4 sm:p-6 short:py-3 wide:max-w-[min(1120px,100%)] wide:px-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-2xl text-cream sm:text-4xl short:text-2xl">{t("Karakterini Seç")}</h2>
                <p className="mt-1.5 text-[14px] text-muted short:hidden">{t('Yolculukta kimin kılığında koşacağını seç; sonra da değiştirebilirsin.')}</p>
              </div>
              {save.character && (
                <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                  {ic(t("← Geri"))}
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
                      <Portrait id={id} scarf={scarfOfHero(id)} accessory={kitOf(save, id)} className="block w-full" />
                    </div>
                    <div className="mt-2 flex w-full min-w-0 flex-col short:mt-0 wide:mt-0">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-2 font-display text-lg text-cream sm:text-2xl short:text-lg">
                        {c.name}
                        <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-mono text-[13px] font-semibold text-accent-2">{characterFor(lang, id)?.role ?? c.role}</span>
                      </p>
                      <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted sm:line-clamp-none sm:text-[13px] short:line-clamp-3 short:text-[13px]">{characterFor(lang, id)?.bio ?? c.bio}</p>
                      <p className="pixel-btn primary mt-2 w-full justify-center py-1.5 text-[13px] sm:mt-3 sm:py-2 sm:text-sm short:mt-auto short:py-1.5 short:text-[13px] wide:mt-auto">{on ? t('Seçili') : t('{name} ile Yola Çık', { name: c.name })}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {/* kılık: takılı kombin ve atkı tek satırda; seçimi Kılık Dükkânı'nda (baş, yüz, sırt, atkı) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-2 border-line bg-ink/40 px-3 py-2.5 short:mt-2 short:py-2">
              <div className="min-w-0">
                <SectionTitle title={t('Kılık')} tone="var(--color-gold)" />
                <p className="mt-0.5 text-[13px] leading-snug text-muted">
                  {[
                    ...(['head', 'face', 'back'] as const).map((k) => ACCESSORIES.find((a) => a.id === heroAcc[k])).filter((a) => !!a).map((a) => (lang === 'en' ? a!.nameEn : a!.name)),
                    lang === 'en' ? scarfFor(scarfIdOf(save, hero.id)).nameEn : scarfFor(scarfIdOf(save, hero.id)).name,
                  ].join(' · ')}
                </p>
              </div>
              <button className="pixel-btn primary shrink-0 px-4" onClick={() => (ui(), setScreen('shop'))}>
                {t('Kılık Dükkânı · {n} Parça', { n: wallet })}
              </button>
            </div>
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
                    <Portrait id={hero.id} scarf={heroScarf} accessory={heroAcc} className="w-full" />
                    <figcaption>{hero.short}</figcaption>
                  </figure>
                  <div className="min-w-0 pb-1">
                    <p className="text-[14px] font-semibold text-accent-2">{save.player ? t('Hesabım') : t('Defterin Sahibi')}</p>
                    <h2 className="mt-1 font-display text-[26px] leading-tight text-cream [overflow-wrap:anywhere]">
                      {save.player ? save.player.name : authMode === 'login' ? t('Tekrar Hoş Geldin') : t('Defterini Kaydet')}
                    </h2>
                    {save.player && <p className="mt-1 text-[13px] text-[#7ad88a]">☁ {t('İlerlemen hesabında kayıtlı')}</p>}
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
                      <div key={label} className="bg-ink/50 px-1 py-2 [box-shadow:inset_0_0_0_2px_#37337a]">
                        <p className="font-display text-lg leading-none text-cream tabular-nums">{n}</p>
                        <p className="mt-1 text-[12px] leading-tight text-muted">{label}</p>
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
                      <p className="mb-1.5 text-[14px] font-semibold text-muted">{t('Adını Değiştir')}</p>
                      <NameForm
                        player={save.player}
                        onDone={(p: Player) => {
                          ui()
                          patch({ player: p })
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t-2 border-line pt-3">
                      <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => (setConfirmOut(false), setScreen('title'))}>
                        {ic(t('← Geri'))}
                      </button>
                      {confirmOut ? (
                        // çıkışta onay: yanlışlıkla basılmasın
                        <span className="flex items-center gap-2 text-[13px] text-muted">
                          {t('İlerlemen hesabında kalır.')}
                          <button className="pixel-btn px-3 py-1.5 text-[13px] text-accent-2" onClick={() => (setConfirmOut(false), void signOut())}>
                            {t('Çıkış Yap')}
                          </button>
                        </span>
                      ) : (
                        <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={() => setConfirmOut(true)}>
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
                        afterName({ player: p, skippedName: false })
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
              <p className="text-[14px] font-semibold text-accent-2">{t("Yol Defteri")}</p>
              <p className="text-[12px] tabular-nums text-muted">
                {storyPage + 1} / {STORY.length}
              </p>
            </div>
            <div className="mt-2 flex items-end gap-4 sm:mt-3 short:row-span-3 short:mt-2 short:self-start">
              <div className="portrait-frame w-[90px] shrink-0 sm:w-[130px] short:hidden">
                <Portrait id={hero.id} scarf={heroScarf} accessory={heroAcc} className="block w-full" />
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
                    patch({ seenStory: true })
                    loadLevel(resumeIdx)
                  }
                }}
              >
                {ic(storyPage + 1 < STORY.length ? t('▶ Devam') : t('▶ Yola Çık'))}
              </button>
              <button
                className="pixel-btn"
                onClick={() => {
                  patch({ seenStory: true })
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
              <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                {ic(t("← Geri"))}
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
                        <span className="flex w-full items-center justify-between gap-2 text-[14px] font-semibold text-gold">
                          {title}
                          {done && <span className="text-[#7ad88a]">✓ {t('Tamam')}</span>}
                        </span>
                        <span className="font-display text-base leading-tight">{displayName(LEVELS[i])}</span>
                        <span className="text-[13px] leading-snug text-muted">{ch.kinds.map((k) => t(CHALLENGE_TEXT[k])).join(' · ')}</span>
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
                  <span className="text-[14px] font-semibold text-gold">{t('Bütün Şehirler')}</span>
                  <span className="text-[13px] text-muted tabular-nums">{t('{n}/{total} Geçildi', { n: LEVELS.filter((l) => save.best[l.id]).length, total: LEVELS.length })}</span>
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
                            <span className="plate absolute bottom-1 left-1 text-[12px]">
                              <span>{String(l.plate).padStart(2, '0')}</span>
                            </span>
                            {/* geçildi: yeşil onay; sıradaki: altın şerit (hangi şehrin bittiği bir bakışta) */}
                            {best && !locked && (
                              <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2f7a3a] text-[12px] font-bold text-white shadow-[0_0_0_2px_#0e0d22]" aria-label={t('Geçildi')}>
                                ✓
                              </span>
                            )}
                            {!best && i === save.unlocked && (
                              <span className="absolute inset-x-0 top-0 bg-gold px-1 py-px text-center text-[11px] font-bold tracking-[0.06em] text-ink">{t('SIRADAKİ')}</span>
                            )}
                            {/* haritası yenilenen şehir: rekor sıfırlandı, yeniden oynanınca rozet kalkar */}
                            {!locked && isRenewed(best, l.id) && (
                              <span className="absolute left-0 top-1 bg-gold px-1.5 py-px text-[12px] font-bold tracking-[0.06em] text-ink shadow-[0_2px_0_rgba(0,0,0,0.35)]">{t('YENİLENDİ')}</span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5 short:px-2.5">
                            <span className="min-w-0">
                              <span className="block font-display text-base leading-tight break-words">{displayName(l)}</span>
                              <span className="block text-[12px] leading-snug text-muted">
                                {localize(l, lang).subtitle}
                                <span className={`ml-2 inline-block border px-1.5 py-px align-middle text-[12px] font-bold ${DIFF_TONE[l.difficulty]}`}>{t(l.difficulty)}</span>
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1 text-[12px] text-muted">
                              {locked ? <span className="flex items-center gap-1">🔒 {t('Kilitli')}</span> : best && !best.stale ? <span className="font-semibold text-cream">{formatTime(best.timeMs)}</span> : best ? t('Yeni Yol') : <span className="font-bold text-accent-2">{t('Oynanmadı')}</span>}
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
                <p className="-mt-1 text-[15px] font-semibold text-cream/80 [@media(max-height:500px)]:hidden">{level.subtitle}</p>
                {/* bu şehrin durumu bir bakışta: geçildi mi, rekor, madalya, hatıra, pul, nazar, boss */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] font-bold tabular-nums [@media(max-height:500px)]:mt-0">
                  {introBest ? (
                    <span className="rounded-sm bg-[#2f7a3a] px-2 py-0.5 text-white">{t('✓ Geçildi')}</span>
                  ) : (
                    <span className="rounded-sm border border-dashed border-line px-2 py-0.5 text-muted">{t('Henüz Geçilmedi')}</span>
                  )}
                  {introBest && (
                    <span className="flex items-center gap-1 rounded-sm bg-ink/60 px-2 py-0.5 text-cream">
                      <MedalBadge medal={medalFor(level, introBest.timeMs)} />
                      {formatTime(introBest.timeMs)}
                    </span>
                  )}
                  {(
                    [
                      [t('Hatıra'), `${introBest ? introBest.items.filter(Boolean).length : 0}/3`, !!introBest && introBest.items.every(Boolean)],
                      [t('Pul'), save.stamps?.[level.id] ? '✓' : '—', !!save.stamps?.[level.id]],
                      [t('Nazar'), save.charms?.[level.id] ? '✓' : '—', !!save.charms?.[level.id]],
                      [t('Boss'), save.bosses[level.id] ? '✓' : '—', !!save.bosses[level.id]],
                    ] as const
                  ).map(([k, v, on]) => (
                    <span key={k} className={`rounded-sm px-2 py-0.5 [@media(max-height:500px)]:hidden ${on ? 'bg-gold/15 text-gold' : 'bg-ink/60 text-muted'}`}>
                      {k} {v}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex [@media(max-height:500px)]:mt-0 items-center gap-2.5 text-[15px] leading-snug text-cream">
                  <ItemIcon city={level.city} taken size={28} />
                  <span>{t('Üç {item} topla, meydandaki boss’u yen.', { item: level.item })}</span>
                </p>
                {(() => {
                  const usta = level.npcs[0]
                  if (!usta) return null
                  const done = !!save.ustalar?.[level.id]
                  return (
                    <p className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-muted [@media(max-height:500px)]:hidden">
                      <span className={`mt-px shrink-0 font-bold ${done ? 'text-[#7ad88a]' : 'text-gold'}`} aria-hidden>
                        {done ? '✓' : '✦'}
                      </span>
                      <span>
                        <strong className="font-semibold text-cream">{usta.name}:</strong> {t(USTA_TEXT[ustaTask(levelIdx)], { item: level.item })}
                        {done && <span className="ml-1 whitespace-nowrap text-[#7ad88a]">{t('Mühür Alındı')}</span>}
                      </span>
                    </p>
                  )
                })()}
                <div className="mt-4 hidden wide:block">
                  {introAbout}
                  {introGoals}
                </div>
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
                {introGoals}
              </div>
            </details>
            {/* yola çıkmadan yolcuyu seç: bölüm başlamadığı için hemen değişir */}
            <div className="mt-3 flex items-center justify-between gap-3 [@media(max-height:500px)]:hidden">
              <span className="text-[14px] font-semibold text-cream/80">{t('Yolcu')}</span>
              <HeroSwitch value={hero.id} onChange={(id) => (ui(), patch({ character: id }))} scarf={heroScarf} kit={heroAcc} />
            </div>
            <div className="sticky bottom-0 z-10 -mx-6 mt-3 grid grid-cols-[1fr_auto] [@media(max-height:500px)]:grid-cols-[auto_1fr_auto] wide:-mx-8 wide:mt-6 wide:flex wide:justify-end wide:px-8 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-2 gap-3 border-t-2 border-line bg-[#171538]/95 px-6 py-3 [padding-bottom:max(12px,env(safe-area-inset-bottom))]">
              {/* alçak ekranda (yatay telefon) yolcu seçici çubukta */}
              <span className="hidden [@media(max-height:500px)]:block">
                <HeroSwitch value={hero.id} onChange={(id) => (ui(), patch({ character: id }))} scarf={heroScarf} kit={heroAcc} />
              </span>
              <button className="pixel-btn primary justify-center py-3 text-lg wide:min-w-[360px]" onClick={beginPlay} autoFocus>
                {ic(t("▶ Başla"))}
              </button>
              <button className="pixel-btn" onClick={() => setScreen('map')}>
                {t("Şehirler")}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'photo' && <PhotoMode canvas={canvasRef.current} renderer={rendererRef.current} level={level} onClose={closePhoto} />}

      {screen === 'pause' && resumeN !== null && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/30 backdrop-blur-[2px]" role="status" aria-live="assertive">
          <div className="text-center">
            <p key={resumeN} className="count-pop font-display text-[min(32vw,200px)] leading-none text-cream [text-shadow:0_6px_0_#0e0d22]">{Math.max(resumeN, 1)}</p>
            <p className="mt-2 bg-ink/70 px-3 py-1 text-[14px] font-semibold text-cream">{t('Hazır Ol · Esc: Molaya Dön')}</p>
          </div>
        </div>
      )}

      {screen === 'pause' && resumeN === null && (
        <Overlay dim blur>
          <div className="rise pixel-panel overlay-scroll max-h-[calc(100dvh-32px)] w-full max-w-md overflow-x-clip overflow-y-auto px-6 pb-5 short:max-w-[min(820px,100%)] short:pb-3 wide:max-w-[min(900px,100%)] wide:px-8 wide:pb-7">
            <CityBanner level={level} eyebrow={t('Mola')} height={110} short={64} />
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
                      <p className="mt-1 text-[12px] text-muted">{k}</p>
                    </div>
                  ))}
                </div>
                <button className="pixel-btn primary mt-4 w-full justify-center py-3 text-lg short:mt-2.5 short:py-2" onClick={resume} autoFocus>
                  {ic(t("▶ Devam Et"))}
                  <span className="ml-2 text-[12px] font-normal opacity-80 [@media(pointer:coarse)]:hidden">Esc</span>
                </button>
                {exitAsk ? (
                  <div className="mt-3 border-2 border-accent bg-ink/50 px-3 py-3 short:mt-2 short:py-2" role="alertdialog" aria-label={t('Çıkış Onayı')}>
                    <p className="text-[14px] leading-snug text-cream">{exitAsk === 'title' ? t('Ana Menü’ye dönersen bu koşu kaybolur.') : t('Şehirler’e dönersen bu koşu kaybolur.')}</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button className="pixel-btn primary min-h-[44px] justify-center text-[14px]" onClick={() => setScreen(exitAsk)} autoFocus>
                        {exitAsk === 'title' ? t('Evet, Ana Menü') : t('Evet, Şehirler')}
                      </button>
                      <button className="pixel-btn min-h-[44px] justify-center text-[14px]" onClick={() => setExitAsk(null)}>
                        {t('Vazgeç')} <span className="ml-1 text-[12px] font-normal text-muted [@media(pointer:coarse)]:hidden">Esc</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 short:mt-2.5 short:grid-cols-4 short:gap-2">
                    {(
                      [
                        ['⚑', t('Checkpoint’e Dön'), 'R', pauseRetry],
                        ['↺', t('Baştan Başla'), 'Shift + R', pauseRestart],
                        ['⌖', t('Şehirler'), 'S', () => leaveRun('map')],
                        ['⌂', t('Ana Menü'), 'M', () => leaveRun('title')],
                      ] as const
                    ).map(([icon, label, key, act]) => (
                      <button key={label} className="pixel-btn min-h-[56px] flex-col justify-center gap-0.5 px-1 py-2 text-[13px] short:min-h-[48px]" onClick={act}>
                        <span className="text-lg leading-none" aria-hidden>{icon}</span>
                        {label}
                        <span className="text-[11px] font-normal text-muted [@media(pointer:coarse)]:hidden">{key}</span>
                      </button>
                    ))}
                  </div>
                )}
                {modeCard}
                {cityCard}
                {plainRun && (
                  <div className="mt-3 border-2 border-line bg-ink/40 px-3 py-2.5 short:mt-2 short:py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold text-cream/80">{t('Yolcu')}</span>
                      <HeroSwitch
                        value={hero.id}
                        scarf={heroScarf}
                        kit={heroAcc}
                        onChange={(id) => {
                          ui()
                          // yola çıkılmadıysa hemen değişir; çıkıldıysa onay: şehrin başına dönülür
                          if (hud.time < 0.05) patch({ character: id })
                          else setPauseHero(id)
                        }}
                      />
                    </div>
                    {pauseHero && (
                      <div className="mt-2.5 border-t-2 border-line pt-2.5">
                        <p className="text-[13px] leading-snug text-cream/85">{t('{name} ile devam etmek için şehrin başına dönülür; süre ve düşüş sıfırlanır.', { name: CHARACTERS[pauseHero].name })}</p>
                        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                          <button
                            className="pixel-btn primary justify-center py-2 text-[14px]"
                            onClick={() => {
                              const id = pauseHero
                              setPauseHero(null)
                              patch({ character: id })
                              loadLevel(levelIdx, 'play')
                            }}
                          >
                            {t('Değiştir ve Baştan Başla')}
                          </button>
                          <button className="pixel-btn px-3 py-2 text-[14px]" onClick={() => setPauseHero(null)}>
                            {t('Vazgeç')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 flex gap-2 short:mt-2">
                  <button className="pixel-btn min-h-[44px] flex-1 justify-center py-2 text-[13px]" onClick={openPhoto}>
                    {ic(t('◉ Fotoğraf Kipi'))} <span className="ml-1 text-[11px] font-normal text-muted [@media(pointer:coarse)]:hidden">F</span>
                  </button>
                  {plainRun && (
                    <button className="pixel-btn min-h-[44px] flex-1 justify-center py-2 text-[13px]" aria-pressed={save.ghost} onClick={toggleGhost}>
                      {save.ghost ? t('◌ Hayalet: Açık') : t('◌ Hayalet: Kapalı')} <span className="ml-1 text-[11px] font-normal text-muted [@media(pointer:coarse)]:hidden">G</span>
                    </button>
                  )}
                  <button className="pixel-btn min-h-[44px] flex-1 justify-center py-2 text-[13px] side:hidden" onClick={() => setPauseSet(true)}>
                    {ic(t('⚙ Ayarlar'))}
                  </button>
                </div>
              </div>
              <div className={`min-w-0 side:mt-0 side:block ${pauseSet ? '' : 'hidden'}`}>
                {/* dar ekranda tek geri düğmesi: tuş atamadayken Ayarlar'a, değilken Mola'ya döner */}
                {!pauseKeys && (
                  <button className="pixel-btn back-btn mb-3 w-full justify-center py-2 text-[13px] side:hidden" onClick={() => setPauseSet(false)}>
                    {ic(t('← Mola'))}
                  </button>
                )}
                <SectionTitle title={t('Ayarlar')} note={t('Değişiklik hemen uyar')} tone="var(--color-accent-2)" />
                {settingsPause}
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
          onPlayer={(p) => patch({ player: p, skippedName: !p })}
          // ilk defterin son şehri ilk kez bitince sıradaki şehir yerine final sahnesi ("Defteri Kapat")
          nextIdx={levelIdx === FIRST_BOOK - 1 && !save.sawEnding ? null : levelIdx + 1 < LEVELS.length ? levelIdx + 1 : nextUnplayed(save, levelIdx)}
          onNext={() => {
            // sondaki şehirden sonra: oynanmamış bir şehir varsa ona, yoksa defterin sonuna
            const n = levelIdx + 1 < LEVELS.length ? levelIdx + 1 : nextUnplayed(save, levelIdx)
            // ilk defterin son şehri (Bayburt) ilk kez bitince final sahnesi; ikinci defter onun ardından açılır
            if (n === null || (levelIdx === FIRST_BOOK - 1 && !save.sawEnding)) setScreen('end')
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
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 sm:p-7 short:max-w-[min(760px,100%)] short:py-3 wide:max-w-[min(900px,100%)]">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Skor Tablosu')}</h2>
                <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Bütün yolcular, şehir şehir: süre, düşüş ve hatıra.')}</p>
              </div>
              <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                {ic(t("← Geri"))}
              </button>
            </div>
            <ScoreBoard me={save.player?.name ?? ''} startCity={levelIdx} startTab={boardTab} startSub={boardSub.sub} startRule={boardSub.rule} bossCount={beaten} onMini={startDailyMini} onBoss={startDailyBoss} onDaily={dailyUsed ? undefined : startDaily} canRace={(i) => i <= save.unlocked} onRace={startRace} friends={save.friends ?? []} onFriend={toggleFriend} />
          </div>
        </Overlay>
      )}

      {screen === 'controls' && (
        <Overlay>
          <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-lg flex-col p-5 sm:p-6 short:max-w-[min(860px,100%)] short:py-3 wide:max-w-[min(1040px,100%)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Ayarlar')}</h2>
                <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Değişiklikler hemen uygulanır ve kaydedilir.')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {/* dil: başlıkta kendi seçicisi (geniş ekranda; dar ekranda listenin altında) */}
                <span className="hidden overflow-hidden border-2 border-line wide:flex" role="group" aria-label={t('Dil')}>
                  {(
                    [
                      ['tr', 'Türkçe'],
                      ['en', 'English'],
                    ] as const
                  ).map(([l, name]) => (
                    <button key={l} lang={l} aria-pressed={lang === l} className={`min-h-[40px] px-3.5 text-[14px] font-semibold ${lang === l ? 'bg-gold text-ink' : 'bg-ink/30 text-cream/75 hover:text-cream'}`} onClick={() => (ui(), patch({ lang: l }))}>
                      {name}
                    </button>
                  ))}
                </span>
                <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={() => setScreen('title')}>
                  {ic(t("← Geri"))}
                </button>
              </div>
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
              {/* geniş ekranda dört öbek (settingsWide); dar ekranda tek liste ve altında dil */}
              <div className="hidden wide:block">{settingsWide}</div>
              <div className="wide:hidden">
              <div>{settingsList}</div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-line/60 pt-2.5">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-cream">
                  {t('Dil')}
                  <span className="flex items-center gap-1" role="group" aria-label={t('Dil')}>
                    {(['tr', 'en'] as const).map((l) => (
                      <button key={l} aria-pressed={lang === l} className={`min-h-[32px] min-w-[40px] px-2.5 py-1.5 text-[13px] font-bold tracking-wider ${lang === l ? 'bg-gold text-ink' : 'text-muted hover:text-cream'}`} onClick={() => (ui(), patch({ lang: l }))}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {installer.canInstall && (
                    <button className="pixel-btn primary px-3 py-1.5 text-[13px]" onClick={() => void installer.install()}>
                      {ic(t('⤓ Ana Ekrana Ekle'))}
                    </button>
                  )}
                  {canFull && (
                    <button className="pixel-btn px-3 py-1.5 text-[13px] wide:hidden" onClick={fullscreen}>
                      {ic(t('⛶ Tam Ekrana Geç'))}
                    </button>
                  )}
                </span>
              </div>
              {installer.iosHint && <p className="mt-2 text-[13px] text-muted">{t('Uygulama gibi açmak için Safari’de Paylaş → Ana Ekrana Ekle.')}</p>}
              <button className="mt-2 text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline" onClick={() => (ui(), patch({ tutorial: true }))} disabled={save.tutorial}>
                {save.tutorial ? t('Rehber açık: sıradaki oyunda adım adım gösterilecek.') : t('Oyun içi rehberi yeniden göster')}
              </button>
              </div>
            </div>
            <div className={`${setTab === 'tus' ? '' : 'hidden'} wide:block`}>
              <SectionTitle title={t('Kontroller')} note={t('Bir eyleme dokun, yeni tuşa bas')} tone="var(--color-accent-2)" className="hidden wide:flex" />
            <KeyRemap keys={save.keys} onChange={(k) => patch({ keys: k })} />
            <DuoRemap keys={save.duoKeys} onChange={(k) => patch({ duoKeys: k })} />
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 short:mt-2 short:gap-5 short:text-[13px]">
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
              <dl className="grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-1.5">
                <dt className="font-display text-gold">{t("Oyun Kolu")}</dt>
                <dd />
                <dt className="text-muted">A / Y</dt>
                <dd>{t("Zıpla")}</dd>
                <dt className="text-muted">X / B / RT</dt>
                <dd>{t("Dash")}</dd>
                <dt className="text-muted">Start</dt>
                <dd>{t("Mola")}</dd>
                <dt className="text-muted">{t('Titreşim')}</dt>
                <dd>{t('Destekleyen kollarda açık')}</dd>
              </dl>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted short:mt-2 short:leading-snug">
              {t("Duvara doğru basılı tutup zıplarsan tırmanırsın. Dash yere değince ya da düşmana basınca yenilenir: atkın renkliyse hazır, griyse harcandı.")}
            </p>
            </div>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'notebook' && <Defter save={save} today={today} hero={save.character ?? 'uktun'} sound={soundRef.current} onClose={() => setScreen('title')} onModes={() => setScreen('modes')} onMusicOn={() => patch({ music: true })} onPins={(pins) => patch({ pins })} />}

      {screen === 'modes' && (
        <ModesHub
          daily={daily}
          mark={save.meydan}
          today={today}
          bossesBeaten={beaten}
          rushNeeds={RUSH_NEEDS}
          rushBest={save.rush}
          onDaily={startDaily}
          onDailyBoard={() => (ui(), setBoardTab('gunluk'), setBoardSub({ sub: '' }), setScreen('scores'))}
          trio={save.trio ?? null}
          onMini={startDailyMini}
          onBoss={startDailyBoss}
          onBoard={(tab, sub = '', rule) => (ui(), setBoardTab(tab), setBoardSub({ sub, rule }), setScreen('scores'))}
          onDuel={() => (ui(), setScreen('duelSetup'))}
          onCoop={() => (ui(), setScreen('coopSetup'))}
          onRush={startRush}
          rushPlus={save.rushPlus ?? {}}
          marathonOpen={save.unlocked + 1 >= MARATHON_CITIES}
          marathonBest={save.maraton ?? null}
          onMarathon={startMarathon}
          onRules={() => (ui(), setScreen('ruleSetup'))}
          onRage={() => (ui(), (rageStartRef.current = undefined), setScreen('rageSetup'))}
          onChase={() => (ui(), (rageStartRef.current = 'kovala'), setScreen('rageSetup'))}
          chaseCities={LEVELS.filter((l) => save.best[l.id] && ruleFits('kovala', l)).length}
          touch={coarse}
          onRageCourses={() => (ui(), setScreen('rageCourses'))}
          rageCoursesDone={RAGE_COURSES.filter((c) => save.challenges?.[c.id]).length}
          ruleCount={Object.keys(save.rules ?? {}).filter((k) => !RAGE_RULES.includes(k.split(':')[1] as RageRule)).length}
          dailyUsed={dailyUsed}
          tried={Object.keys(save.rules ?? {}).map((k) => k.split(':')[1])}
          rulesOpen={Object.keys(save.best).length > 0}
          onChallenges={() => (ui(), setScreen('challenges'))}
          onTournament={() => (ui(), setScreen('tournament'))}
          onGezgin={() => (ui(), setScreen('gezgin'))}
          onCalm={() => (ui(), setScreen('calmSetup'))}
          onStory={() => (ui(), setScreen('storySetup'))}
          storyMet={Object.values(save.story ?? {}).filter((m) => (m & MET_BIT) !== 0).length}
          onMirror={() => (ui(), setScreen('mirror'))}
          mirrorOpen={LEVELS.slice(0, FIRST_BOOK).every((l) => save.best[l.id])}
          mirrorDone={Object.keys(save.ayna ?? {}).length}
          onTour={startTour}
          tourBest={save.tur ?? null}
          aynaTourBest={save.aynaTur ?? null}
          citiesDone={Object.keys(save.best).length}
          tournament={save.turnuva ?? null}
          challengeDone={CHALLENGES.filter((c) => save.challenges?.[c.id]).length}
          onBack={() => setScreen('title')}
        />
      )}
      {screen === 'challenges' && <ChallengeList best={save.challenges ?? {}} finished={new Set(Object.keys(save.best))} player={save.player?.name ?? ''} onStart={startChallenge} onBack={() => setScreen('modes')} />}
      {screen === 'rageCourses' && <ChallengeList rage best={save.challenges ?? {}} finished={new Set(Object.keys(save.best))} player={save.player?.name ?? ''} onStart={startChallenge} onBack={() => setScreen('modes')} />}
      {screen === 'gezgin' && <GezginHub best={save.challenges} totals={save.gezgin} onStart={startGezgin} onBack={() => setScreen('modes')} />}
      {screen === 'calmSetup' && <CalmSetup startLevel={levelIdx} open={save.unlocked} onStart={startCalm} onBack={() => setScreen('modes')} />}
      {screen === 'storySetup' && <StorySetup startLevel={levelIdx} open={save.unlocked} story={save.story} onStart={startStory} onBack={() => setScreen('modes')} />}
      {screen === 'tournament' && <TournamentHub mark={save.turnuva} player={save.player?.name ?? ''} friends={save.friends ?? []} onStart={(c) => startChallenge(c, tournamentWeek(today))} onBack={() => setScreen('modes')} />}
      {screen === 'invite' && invite && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[14px] font-semibold text-accent-2">{t('Yarış Daveti')}</p>
            <h2 className="mt-2 font-display text-3xl text-cream">{t('{name} Seni Yarışa Çağırıyor', { name: invite.name })}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/85">{t('{city} şehrinde onun en iyi koşusunun hayaletiyle yan yana koşacaksın. Geçebilir misin?', { city: displayName(LEVELS[invite.idx]) })}</p>
            {invite.msg && <p className="mt-2 text-[13px] text-accent-2">{invite.msg}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                className="pixel-btn primary justify-center"
                autoFocus
                onClick={async () => {
                  const err = await startRace(invite.idx, invite.name)
                  if (err) setInvite({ ...invite, msg: err })
                  else history.replaceState(null, '', location.pathname)
                }}
              >
                {ic(t('◌ Yarış'))}
              </button>
              <button className="pixel-btn justify-center" onClick={() => (history.replaceState(null, '', location.pathname), setScreen('title'))}>
                {t('Ana Menü')}
              </button>
            </div>
          </div>
        </Overlay>
      )}
      {screen === 'challengeEnd' && challengeResult && (
        <ChallengeEnd
          result={challengeResult}
          player={save.player?.name ?? ''}
          status={challengeSend.status}
          rank={challengeSend.rank}
          weekRank={weekRank}
          onRetry={() => {
            const gz = gezginRef.current?.ids.includes(challengeResult.id) ? gezginRef.current : null
            startChallenge(ALL_CHALLENGES.find((c) => c.id === challengeResult.id)!, challengeResult.week ?? null, challengeResult.daily ?? null)
            gezginRef.current = gz
          }}
          onList={() => setScreen(gezginRef.current?.ids.includes(challengeResult.id) ? 'gezgin' : challengeResult.daily ? 'modes' : challengeResult.week ? 'tournament' : RAGE_COURSES.some((c) => c.id === challengeResult.id) ? 'rageCourses' : 'challenges')}
          onLogin={() => ((returnRef.current = 'challengeEnd'), setScreen('name'))}
        />
      )}

      {screen === 'ruleSetup' && <RuleSetup startLevel={levelIdx} finished={LEVELS.map((l, i) => (save.best[l.id] ? i : -1)).filter((i) => i >= 0)} records={save.rules ?? {}} onStart={startRule} onBack={() => setScreen('modes')} />}
      {screen === 'rageSetup' && <RuleSetup rage startLevel={levelIdx} startRule={rageStartRef.current} finished={LEVELS.map((l, i) => (save.best[l.id] ? i : -1)).filter((i) => i >= 0)} records={save.rules ?? {}} onStart={startRule} onBack={() => setScreen('modes')} />}

      {screen === 'dailyEnd' && dailyResult && (
        <DailyEnd result={dailyResult} player={save.player?.name ?? ''} status={dailySend.status} rank={dailySend.rank} onRetry={dailyResult.free ? () => startRule(LEVELS.findIndex((l) => l.id === dailyResult.run.levelId), dailyResult.run.rule) : undefined} onModes={() => setScreen('modes')} onLogin={() => ((returnRef.current = 'dailyEnd'), setScreen('name'))} />
      )}

      {screen === 'duelSetup' && (
        <DuelSetup
          initial={duel?.setup ?? { level: Math.min(levelIdx, save.unlocked), names: [save.player?.name ?? hero.short, lang === 'en' ? 'Guest' : 'Misafir'], heroes: [hero.id, hero.id === 'uktun' ? 'memo' : 'uktun'], bestOf: 1, style: coarse ? 'sirayla' : 'yanyana' }}
          unlocked={save.unlocked}
          finished={new Set(Object.keys(save.best))}
          canSide={!coarse}
          onStart={duelStart}
          onBack={() => setScreen('modes')}
        />
      )}

      {screen === 'duelTurn' && duel && <DuelTurn setup={duel.setup} rounds={duel.rounds} round={duel.round} turn={duel.turn} onGo={duelGo} onQuit={() => setScreen('modes')} />}

      {screen === 'race' && duel && (
        <Race
          key={duel.round}
          level={duelLevel(duel.setup)}
          names={duel.setup.names}
          heroes={duel.setup.heroes}
          looks={looks}
          roundLabel={duel.setup.bestOf === 1 ? t('Tek Tur') : t('{n}. TUR', { n: duel.round + 1 })}
          oneLife={!!duelTerms(duel.setup).oneLife}
          sound={soundRef.current}
          keys={duoKeys}
          onKeys={(k) => patch({ duoKeys: k })}
          onDone={raceDone}
          onQuit={() => setScreen('modes')}
        />
      )}

      {screen === 'coopSetup' && (
        <CoopSetup
          keys={duoKeys}
          unlocked={save.unlocked}
          finished={new Set(Object.keys(save.best))}
          initial={coop?.plan ?? null}
          best={save.coop ?? {}}
          hero={hero.id}
          canPlay={!coarse || (typeof navigator !== 'undefined' && !!navigator.getGamepads && [...navigator.getGamepads()].filter(Boolean).length >= 2)}
          onStart={(plan) => {
            soundRef.current?.unlock()
            ui()
            setCoop((c) => ({ plan, result: null, key: (c?.key ?? 0) + 1, newBest: false }))
            setScreen('coop')
          }}
          onBack={() => setScreen('modes')}
        />
      )}
      {screen === 'coop' && coop && (
        <Coop
          key={coop.key}
          plan={coop.plan}
          looks={looks}
          keys={duoKeys}
          onKeys={(k) => patch({ duoKeys: k })}
          sound={soundRef.current}
          onDone={(r) => {
            // ikilinin rekoru: yalnız bitirilen koşu yazılır (canlar ya da süre biterse yazılmaz); şehir rekoruna karışmaz
            const key = coopKey(coop.plan)
            const old = saveRef.current?.coop?.[key]
            const better = !r.failed && (old === undefined || r.timeMs < old)
            if (better) persist((s) => ({ ...s, coop: { ...(s.coop ?? {}), [key]: r.timeMs } }))
            setCoop((c) => (c ? { ...c, result: r, best: old, newBest: better && old !== undefined } : c))
            setScreen('coopEnd')
          }}
          onQuit={() => setScreen('modes')}
        />
      )}
      {screen === 'coopEnd' && coop?.result && (
        <CoopEnd
          plan={coop.plan}
          result={coop.result}
          best={coop.best}
          newBest={coop.newBest}
          onAgain={() => {
            setCoop((c) => (c ? { ...c, result: null, key: c.key + 1, newBest: false } : c))
            setScreen('coop')
          }}
          onSetup={() => setScreen('coopSetup')}
          onMenu={() => setScreen('modes')}
        />
      )}

      {screen === 'duelEnd' && duel && <DuelEnd setup={duel.setup} rounds={duel.rounds} onRematch={() => duelStart(duel.setup)} onSetup={() => setScreen('duelSetup')} onMenu={() => setScreen('modes')} />}

      {screen === 'rushEnd' && rushResult && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[14px] font-semibold text-accent-2">{rushResult.daily ? (rushResult.best ? t('★ Bugünün En İyisi') : t('Günün Boss’u')) : rushResult.best ? t('Yeni Rekor') : rushResult.variant === 'kabus' ? t('Kâbus Boss Rush') : rushResult.variant === 'cifte' ? t('Çifte Boss Rush') : rushResult.kind === 'boss' ? t('Boss Rush') : rushResult.kind === 'tur' ? t('Tam Tur') : rushResult.kind === 'aynaTur' ? t('Ayna Tam Tur') : t('Maraton')}</p>
            <h2 className="mt-2 font-display text-6xl tabular-nums text-cream">{formatTime(rushResult.timeMs)}</h2>
            <p className="mt-2 text-[13px] text-muted">{rushResult.kind === 'boss' ? t('{n} boss · {deaths} düşüş', { n: rushResult.bosses, deaths: rushResult.deaths }) : t('{n} şehir · {deaths} düşüş', { n: rushResult.bosses, deaths: rushResult.deaths })}</p>
            {rushResult.relaxed && <p className="mt-2 text-[13px] text-muted">{t("Rahat Mod’da koştun: rekor yazılmadı.")}</p>}
            {!rushResult.best && !rushResult.relaxed && rushResult.variant && save.rushPlus?.[rushResult.variant] && <p className="mt-2 text-[13px] text-muted">{t('Rekor: {time} · {n} boss', { time: formatTime(save.rushPlus[rushResult.variant].timeMs), n: save.rushPlus[rushResult.variant].bosses })}</p>}
            {!rushResult.best && !rushResult.relaxed && rushResult.kind === 'boss' && !rushResult.variant && save.rush && <p className="mt-2 text-[13px] text-muted">{t('Rekor: {time} · {n} boss', { time: formatTime(save.rush.timeMs), n: save.rush.bosses })}</p>}
            {!rushResult.best && !rushResult.relaxed && (rushResult.kind === 'tur' || rushResult.kind === 'aynaTur') && save[rushResult.kind] && <p className="mt-2 text-[13px] text-muted">{t('Rekorun: {time}', { time: formatTime(save[rushResult.kind]!.timeMs) })}</p>}
            {rushResult.kind !== 'maraton' && tourSent && <p className="mt-2 text-[13px] text-[#7ad88a]">{tourSent}</p>}
            {!rushResult.relaxed && rushResult.kind !== 'maraton' && !save.player && (
              <p className="mt-2 text-[13px]">
                <button className="text-gold underline underline-offset-4" onClick={() => ((returnRef.current = 'rushEnd'), setScreen('name'))}>
                  {t('Sıralamaya girmek için giriş yap')}
                </button>
              </p>
            )}
            {!rushResult.relaxed && rushResult.kind !== 'maraton' && (
              <div className="overlay-scroll mt-3 max-h-[min(200px,26dvh)] overflow-y-auto pr-1 text-left short:hidden">
                <Board
                  kind={rushResult.kind === 'tur' ? 'tur' : rushResult.kind === 'aynaTur' ? 'aynatur' : rushResult.daily ? 'gunluk-b' : 'bossrush'}
                  day={rushResult.daily ?? ''}
                  extra={rushResult.kind === 'boss' && !rushResult.daily ? { variant: rushResult.variant ?? 'duz', n: String(rushResult.bosses) } : undefined}
                  me={save.player?.name ?? ''}
                  refresh={tourSent ? 1 : 0}
                  compact
                />
              </div>
            )}
            {!rushResult.best && !rushResult.relaxed && rushResult.kind === 'maraton' && save.maraton && <p className="mt-2 text-[13px] text-muted">{t('Maraton rekorun: {time}', { time: formatTime(save.maraton.timeMs) })}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={rushResult.daily ? startDailyBoss : rushResult.kind === 'boss' ? () => startRush(rushResult.variant) : rushResult.kind === 'tur' || rushResult.kind === 'aynaTur' ? () => startTour(rushResult.kind as 'tur' | 'aynaTur') : startMarathon} autoFocus>
                {ic(t("↺ Yeniden Oyna"))}
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('modes')}>
                {t('Modlar')}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'end' && (
        <Ending
          hero={hero.id}
          heroShort={hero.short}
          scarf={heroScarf}
          accessory={heroAcc}
          totalFound={totalFound}
          totalMs={Object.values(save.best).reduce((a, b) => a + (b.stale ? 0 : b.timeMs), 0)}
          notebookLeft={notebookLeft}
          onCities={() => setScreen('map')}
          onScores={() => setScreen('scores')}
          onMirror={() => setScreen('mirror')}
          onSecondBook={() => loadLevel(FIRST_BOOK)}
        />
      )}
      {screen === 'shop' && (
        <Shop
          hero={hero.id}
          onHero={(id) => (ui(), patch({ character: id }))}
          scarfIds={{ uktun: scarfIdOf(save, 'uktun'), memo: scarfIdOf(save, 'memo') }}
          charms={charmCount}
          onScarf={(who, id) => (ui(), persist((s) => ({ ...s, scarfs: { ...s.scarfs, [who]: id } })))}
          owned={save.owned ?? {}}
          seals={ustaCount}
          kits={{ uktun: kitOf(save, 'uktun'), memo: kitOf(save, 'memo') }}
          earnedTotal={earned(foundTotal, bossCount, ustaCount)}
          parts={{ found: foundTotal, bosses: bossCount, seals: ustaCount }}
          onBuy={buyAccessory}
          onWear={wearKit}
          onBack={() => setScreen('character')}
        />
      )}
      {screen === 'mirror' && <MirrorList best={save.ayna ?? {}} open={LEVELS.slice(0, FIRST_BOOK).every((l) => save.best[l.id])} onStart={startMirror} onBack={() => setScreen('modes')} />}
      {screen === 'custom' && custom && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[14px] font-semibold text-accent-2">{t('Bölüm Düzenleyici')}</p>
            <h2 className="mt-2 font-display text-3xl text-cream">{'error' in custom ? t('Bu Harita Açılamadı') : t('Özel Harita')}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-cream/85">
              {'error' in custom ? t(custom.error) : t('Biri senin için bir yol çizmiş: {city} temasında, {w} sütun. Rekorlarına ve ilerlemene dokunmaz.', { city: displayName(LEVELS.find((l) => l.city === custom.level.city)!), w: custom.level.map[0].length })}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {'error' in custom ? null : (
                <button className="pixel-btn primary justify-center" onClick={startCustom} autoFocus>
                  {ic(t('▶ Oyna'))}
                </button>
              )}
              <a className="pixel-btn justify-center" href={'error' in custom ? '/duzenle' : `/duzenle?kod=${custom.code}`}>
                {t('Düzenleyicide Aç')}
              </a>
              <button className="pixel-btn col-span-2 justify-center" onClick={() => (history.replaceState(null, '', location.pathname), setCustom(null), setScreen('title'))}>
                {t('Ana Menü')}
              </button>
            </div>
          </div>
        </Overlay>
      )}
      {screen === 'customEnd' && customResult && custom && !('error' in custom) && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[14px] font-semibold text-accent-2">{t('Özel Harita')}</p>
            <p className="mt-2 flex items-center justify-center gap-3 font-display text-6xl tabular-nums text-cream">
              {formatTime(customResult.timeMs)}
              {medalFor(custom.level, customResult.timeMs) && <MedalBadge medal={medalFor(custom.level, customResult.timeMs)} size="lg" />}
            </p>
            <p className="mt-2 text-[13px] text-muted">
              {t('{deaths} düşüş', { deaths: customResult.deaths })}
              {custom.level.map.join('').includes('C') ? ` · ${t('{n} hatıra', { n: customResult.found })}` : ''}
              {customResult.stamp !== null ? ` · ${t(customResult.stamp ? 'Pul ✓' : 'Pul ✗')}` : ''}
              {customResult.charm !== null ? ` · ${t(customResult.charm ? 'Nazar ✓' : 'Nazar ✗')}` : ''}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={startCustom} autoFocus>
                {ic(t('↺ Yeniden Oyna'))}
              </button>
              <a className="pixel-btn justify-center" href={`/duzenle?kod=${custom.code}`}>
                {t('Düzenleyicide Aç')}
              </a>
              <button className="pixel-btn col-span-2 justify-center" onClick={() => (history.replaceState(null, '', location.pathname), setCustom(null), setScreen('title'))}>
                {t('Ana Menü')}
              </button>
            </div>
          </div>
        </Overlay>
      )}
      {screen === 'mirrorEnd' && mirrorResult && (
        <Overlay dim>
          <div className="rise pixel-panel w-full max-w-md p-6 text-center">
            <p className="text-[14px] font-semibold text-accent-2">{mirrorResult.best ? t('Yeni Ayna Rekoru') : t('Ayna Yolu')}</p>
            <h2 className="mt-1 font-display text-3xl text-cream">{displayName(LEVELS[mirrorResult.idx])}</h2>
            <p className="mt-2 font-display text-6xl tabular-nums text-cream">{formatTime(mirrorResult.timeMs)}</p>
            <p className="mt-2 text-[13px] text-muted">
              {t('{deaths} düşüş', { deaths: mirrorResult.deaths })}
              {mirrorResult.prev !== undefined && !mirrorResult.best ? ` · ${t('Rekorun {time}', { time: formatTime(mirrorResult.prev) })}` : ''}
              {save.best[LEVELS[mirrorResult.idx].id] ? ` · ${t('Asıl yoldaki rekorun {time}', { time: formatTime(save.best[LEVELS[mirrorResult.idx].id].timeMs) })}` : ''}
            </p>
            {mirrorResult.relaxed && <p className="mt-2 text-[13px] text-muted">{t('Rahat Mod’da koştun: rekor yazılmadı.')}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn primary justify-center" onClick={() => startMirror(mirrorResult.idx)} autoFocus>
                {ic(t('↺ Yeniden Oyna'))}
              </button>
              <button className="pixel-btn justify-center" onClick={() => setScreen('mirror')}>
                {t('Ayna Yolu')}
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
          <span key={l.id} className={`truncate border border-[#5a3c26]/40 px-1 text-[11px] leading-4 ${page >= 1 ? 'opacity-100' : 'opacity-40'}`}>
            {String(l.plate).padStart(2, "0")} {l.name}
          </span>
        ))}
      </div>
      {page === 2 && <p className="mt-1 text-[12px] italic">{t("“Yolun sonu, başladığım yer.”")}</p>}
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
  const pace = penaltyFor || label ? null : shown <= level.medals[0] * 1000 ? '#ffcc66' : shown <= level.medals[1] * 1000 ? '#d7dde6' : shown <= level.medals[2] * 1000 ? '#d08a52' : null
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3"
      style={{ paddingTop: 'var(--safe-top)', paddingLeft: 'max(12px, env(safe-area-inset-left))', paddingRight: 'max(12px, env(safe-area-inset-right))' }}
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
          <p className={`truncate text-[12px] font-bold tracking-[0.06em] ${label ? 'text-accent-2' : 'text-muted'}`}>{(label ?? level.nickname ?? t(level.difficulty)).toLocaleUpperCase(lng)}</p>
        </div>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 bg-ink/80 px-2 py-2 text-sm font-semibold tabular-nums text-cream [box-shadow:0_0_0_2px_rgba(61,53,80,0.8)] sm:gap-3 sm:px-3">
          {showGoal && (
            <span key={hud.goal} className="rise whitespace-nowrap border-r-2 border-line pr-2 text-[13px] font-bold text-gold sm:pr-3 sm:text-[13px]" role="status">
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
            {pace && <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_1.5px_rgba(14,13,34,0.9)]" style={{ background: pace }} title={t('Madalya Temposu')} />}
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
  const [authOpen, setAuthOpen] = useState(false)
  // telefonda üç bölüm sekmeyle açılır; geniş ekranda üçü yan yana durur
  const [tab, setTab] = useState<'defter' | 'kart' | 'skor'>('defter')
  const shareUrl = () =>
    `${location.origin}/skor?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: scarfIdOf(save, heroId), lang: lng })}`
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

  // hayaletimle yarışa çağıran bağlantı: açan, bu şehirde bu koşunun hayaletiyle yan yana koşar
  const [dared, setDared] = useState(false)
  const copyDare = async () => {
    if (!player) return
    try {
      await navigator.clipboard.writeText(`${location.origin}/?yaris=${level.id}~${encodeURIComponent(player.name)}`)
      setDared(true)
      setTimeout(() => setDared(false), 2200)
    } catch {
      /* izin yok */
    }
  }

  const submit = async (p: Player) => {
    setStatus('sending')
    try {
      // ağ hatası, sunucu (5xx) ya da hız sınırı (429): bekleyip yeniden dener; skor kaybolmasın
      const send = () =>
        fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: level.id, playerId: p.id, token: p.token, timeMs: result.timeMs, deaths: result.deaths, items: found }),
        })
      let res: Response | null = null
      for (let k = 0; k < 4; k++) {
        res = await send().catch(() => null)
        if (res && res.status !== 429 && res.status < 500) break
        const after = Number(res?.headers.get('Retry-After') ?? 0)
        await new Promise((r) => setTimeout(r, Math.min(30, Math.max(after, [2, 5, 12, 25][k])) * 1000))
      }
      if (!res) throw new Error(t('Bağlantı yok: skor gönderilemedi. Tekrar Dene’ye bas.'))
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
      // yeni rekor tablodaysa hayaleti de sunucuya: öteki yolcular onunla yarışabilsin
      if (result.ghost && (j.first || j.better?.time)) void uploadGhost(p, level.id, result.timeMs, result.ghost)
      // %100 koşusu kendi tablosuna da (speedrun); hata sessiz: asıl skor yazıldı
      if (result.full) void fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 'yuzde', city: level.id, playerId: p.id, token: p.token, timeMs: result.timeMs, deaths: result.deaths, items: 3 }) }).catch(() => {})
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
          <CityBanner level={level} eyebrow={pieces === 5 ? t('Eksiksiz Tamamlandı') : t('Geçildi')} height={130} short={56} wide={104} />
        </div>
        {/* geniş ekranda üç sütun şeridin hemen altından başlar: sonuç sol sütunun başında durur, kartpostal ve skor
            tablosu bütün yüksekliği kullanır. Dar ekranda sonuç üstte, altında sekmeler. Yatay telefonda panelin ızgarası. */}
        <div className="flex min-h-0 flex-1 flex-col short:contents wide:grid wide:grid-cols-[1.15fr_1fr_0.9fr] wide:grid-rows-[auto_minmax(0,1fr)] wide:gap-x-6">
        {/* ── sonuç (hep görünür) */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 short:col-start-1 short:row-start-2 wide:col-start-1 wide:row-start-1">
          <div className="flex min-w-0 flex-1 basis-full items-center gap-4 short:gap-3">
              <figure className="polaroid relative w-[72px] shrink-0 rotate-[-4deg] max-sm:hidden sm:w-[88px] short:hidden">
                <span className="tape" />
                <Portrait id={heroId} scarf={scarfFor(scarfIdOf(save, heroId)).id === 'al' ? null : scarfFor(scarfIdOf(save, heroId))} accessory={kitOf(save, heroId)} className="w-full" />
                <figcaption className="!text-[13px]">{heroName}</figcaption>
              </figure>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-semibold ${result.newBest ? 'text-gold' : 'text-muted'}`}>{result.newBest ? t('Yeni Rekor') : best && !best.stale ? t('Rekorun {time}', { time: formatTime(best.timeMs) }) : t('Süre')}</p>
                <p className="font-display text-5xl leading-none tabular-nums text-cream sm:text-6xl max-sm:text-4xl short:text-3xl wide:text-5xl">{formatTime(result.timeMs)}</p>
                <p className="mt-1.5 text-[13px] text-muted">{t('{deaths} düşüş · {found}/3 {item}', { deaths: result.deaths, found, item: level.item })}</p>
                {result.rival && (
                  <p className={`mt-1 text-[13px] font-semibold ${result.rival.beaten ? 'text-gold' : 'text-muted'}`}>
                    ◌ {result.rival.beaten ? t('{name} hayaletini {d} farkla geçtin', { name: result.rival.name, d: formatTime(result.rival.timeMs - result.timeMs) }) : t('{name} hayaleti {d} önde bitirdi', { name: result.rival.name, d: formatTime(result.timeMs - result.rival.timeMs) })}
                  </p>
                )}
                {result.full && (
                  <p className="mt-1 text-[13px] font-semibold text-gold">
                    ✦ {result.full.best ? (result.full.prev === undefined ? t('%100 koşu: her şey tek seferde!') : t('Yeni %100 rekoru ({d} daha hızlı)', { d: formatTime(result.full.prev - result.timeMs) })) : t('%100 koşu · rekorun {time}', { time: formatTime(result.full.prev ?? result.timeMs) })}
                  </p>
                )}
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
            <div className="flex items-baseline justify-between gap-2">
              <SectionTitle title={t('Defter')} note={t('Bu şehrin sayfaları')} tone="var(--color-gold)" />
              <span className="font-display text-[15px] text-cream">{pieces}/5</span>
            </div>
            {/* hatıralar tek listede: simge, yer, okunur durum rozeti ve deftere yazılan bilgi (eskiden kart + ayrı liste,
                damgalar taşıyıp kesiliyordu) */}
            <div className="mt-2 grid gap-2">
              {level.facts.map((f, i) => {
                const now = result.items[i]
                const have = now || best?.items[i]
                return (
                  <div key={i} className={`flex items-center gap-3 px-3 ${have ? 'notebook py-2.5' : 'border-2 border-dashed border-line/70 bg-ink/30 py-1.5'}`}>
                    <span className={`relative flex shrink-0 items-center justify-center rounded-full ${have ? 'h-11 w-11 bg-[#221f4a] shadow-[0_0_0_2px_#d9a441]' : 'h-8 w-8 bg-ink/60 shadow-[0_0_0_2px_#37337a]'}`}>
                      <ItemIcon city={level.city} taken={!!have} size={have ? 30 : 20} />
                      {!have && <span className="absolute inset-0 flex items-center justify-center font-display text-xl text-muted">?</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-display text-[15px] leading-tight ${have ? '' : 'text-muted'}`}>{have ? f.title : t('Saklı {item}', { item: level.item })}</span>
                        <span className={`rounded-sm px-1.5 py-px text-[12px] font-bold ${now ? 'bg-[#2f7a3a] text-white' : have ? 'bg-[#221f4a] text-gold' : 'bg-ink/60 text-muted'}`}>
                          {now ? t('Bu Koşuda') : have ? t('Defterde') : t('Saklı')}
                        </span>
                      </p>
                      {have && <p className="mt-0.5 text-[13px] leading-snug opacity-80">{f.text}</p>}
                    </div>
                  </div>
                )
              })}
              {/* gizli pul ve nazar: aynı satır dili, okunur rozet */}
              <div className={`flex gap-3 px-3 py-2.5 ${save.stamps?.[level.id] ? 'border-2 border-[#d9a441] bg-[#221f4a]' : 'border-2 border-dashed border-line/70 bg-ink/30'}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-xl ${save.stamps?.[level.id] ? 'bg-gold/20 text-gold shadow-[0_0_0_2px_#d9a441]' : 'bg-ink/60 text-muted shadow-[0_0_0_2px_#37337a]'}`}>✦</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`font-display text-[15px] leading-tight ${save.stamps?.[level.id] ? 'text-gold' : 'text-muted'}`}>{save.stamps?.[level.id] ? level.secret.title : t('Gizli Pul')}</span>
                    <span className={`rounded-sm px-1.5 py-px text-[12px] font-bold ${save.stamps?.[level.id] ? 'bg-gold text-ink' : 'bg-ink/60 text-muted'}`}>{save.stamps?.[level.id] ? t('Gizli Sayfa') : t('Saklı')}</span>
                  </p>
                  <p className={`mt-0.5 text-[13px] leading-snug ${save.stamps?.[level.id] ? 'text-cream/85' : 'text-muted'}`}>{save.stamps?.[level.id] ? level.secret.text : t('Kayadaki karanlık ağızlara, çatlak zeminlere ve zor ulaşılan köşelere bak.')}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 px-3 py-2 ${save.charms?.[level.id] ? 'border-2 border-[#4ab0e8] bg-[#221f4a]' : 'border-2 border-dashed border-line/70 bg-ink/30'}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${save.charms?.[level.id] ? 'bg-[#1d3f73] shadow-[0_0_0_2px_#4ab0e8]' : 'bg-ink/60 shadow-[0_0_0_2px_#37337a]'}`} aria-hidden>
                  <span className={`block h-6 w-6 rounded-full ${save.charms?.[level.id] ? 'bg-[radial-gradient(circle,#0b1a3a_0_18%,#f3f1ff_19%_38%,#4ab0e8_39%_70%,#1d5fae_71%)]' : 'bg-line'}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`font-display text-[15px] leading-tight ${save.charms?.[level.id] ? 'text-cream' : 'text-muted'}`}>{t('Nazar Boncuğu')}</span>
                    <span className={`rounded-sm px-1.5 py-px text-[12px] font-bold ${save.charms?.[level.id] ? 'bg-[#4ab0e8] text-ink' : 'bg-ink/60 text-muted'}`}>{save.charms?.[level.id] ? t('Bulundu') : t('Saklı')}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{save.charms?.[level.id] ? t('Meydan yolunda saklıydı.') : t('Meydan yolunda saklı: kapıdan geçince etrafına iyi bak.')}</p>
                </div>
              </div>
              {[0, 1, 2].some((i) => !(result.items[i] || best?.items[i])) && <p className="px-1 text-[13px] leading-snug text-muted">{t('Saklı hatıraların yerini tabelalar ve şehir insanları anlatır.')}</p>}
            </div>
          </div>

          <div className={`overlay-scroll -mx-2 h-full min-w-0 overflow-y-auto px-2 pt-2 ${tab === 'kart' ? '' : 'hidden'} wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:block wide:h-auto wide:min-h-0 wide:pt-0`}>
            <SectionTitle title={t('Kartpostalın')} note={t('Paylaş, arkadaşını yarışa çağır')} tone="var(--color-accent-2)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/skor/kart?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: scarfIdOf(save, heroId), lang: lng })}`}
              alt={t('{city} skor kartı', { city: level.name })}
              width={1200}
              height={630}
              loading="lazy"
              className="mt-3 aspect-[40/21] h-auto w-full rotate-[-0.6deg] bg-ink/40 [box-shadow:0_0_0_3px_#37337a,0_14px_30px_rgba(0,0,0,0.5)]"
            />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button className="pixel-btn justify-center py-2.5 text-sm" onClick={share}>
                {ic(t('↗ Paylaş'))}
              </button>
              <a className="pixel-btn justify-center py-2.5 text-sm" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} onClick={(e) => { e.preventDefault(); window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl()}`)}`, '_blank', 'noopener') }}>
                WhatsApp
              </a>
              <button className="pixel-btn justify-center py-2.5 text-sm" onClick={copy}>
                {copied ? t('Kopyalandı') : t('Bağlantıyı Kopyala')}
              </button>
              <a className="pixel-btn justify-center py-2.5 text-sm" href={`/skor/kart?${shareQuery({ level: level.id, timeMs: result.timeMs, deaths: result.deaths, items: found, character: heroId, name: player?.name ?? '', scarf: scarfIdOf(save, heroId), lang: lng })}`} download={`sek-sek-${level.id}.png`}>
                {t('Kartı İndir')}
              </a>
              {player && (
                <button className="pixel-btn col-span-2 justify-center py-2.5 text-sm" onClick={copyDare}>
                  {ic(dared ? t('Kopyalandı: arkadaşına gönder') : t('⚔ Beni Geç Bağlantısı'))}
                </button>
              )}
            </div>
            {/* madalya süreleri: hangisi alındı, sıradaki hedefe ne kadar kaldı */}
            <SectionTitle title={t('Madalya Süreleri')} tone="var(--color-gold)" className="mt-5" />
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {(['altin', 'gumus', 'bronz'] as const).map((m, k) => {
                const got = result.timeMs <= level.medals[k] * 1000
                return (
                  <div key={m} className={`border-2 px-1 py-2 ${got ? 'border-gold bg-gold/10' : 'border-line bg-ink/40'}`}>
                    <p className="flex items-center justify-center gap-1.5 font-display text-lg leading-none text-cream">
                      <MedalBadge medal={m} />
                      {level.medals[k]}
                      <span className="text-[12px] text-muted">{t('sn')}</span>
                    </p>
                    <p className={`mt-1 text-[12px] ${got ? 'text-gold' : 'text-muted'}`}>{ic(got ? t('✓ Alındı') : t('{s} sn kaldı', { s: Math.ceil((result.timeMs - level.medals[k] * 1000) / 1000) }))}</p>
                  </div>
                )
              })}
            </div>
            {save.bosses[level.id] && <p className="mt-2 text-[13px] leading-snug text-muted">{t('Boss yenildi: {boss}.', { boss: lng === 'en' ? BOSSES[level.city].nameEn : BOSSES[level.city].name })}</p>}
          </div>

          <div className={`overlay-scroll -mx-2 h-full min-w-0 overflow-y-auto px-2 pt-2 ${tab === 'skor' ? '' : 'hidden'} wide:col-start-3 wide:row-span-2 wide:row-start-1 wide:block wide:h-auto wide:min-h-0 wide:pt-0`}>
            <div className="border-2 border-line bg-ink/40 p-3.5">
              <SectionTitle title={t('Sıralama')} note={level.name} tone="var(--color-teal)" />
              {result.relaxed ? (
                <p className="mt-2 text-[13px] text-muted">{t('Rahat Mod’da oynadın: bu skor tabloya yazılmadı. Ayarlardan kapatıp yarışabilirsin.')}</p>
              ) : !player ? (
                <div className="mt-2.5">
                  {/* hesap formu istenince açılır: bölüm sonu sonuçla dolsun, form kalabalığıyla değil */}
                  {authOpen ? (
                    <AuthForm suggestion={heroName} autoFocus onDone={(p) => onPlayer(p)} />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-dashed border-line px-3 py-2.5">
                      <span className="text-[14px] leading-snug text-cream/85">{t('Süren tabloya yazılsın mı?')}</span>
                      <button className="pixel-btn px-3 py-1.5 text-[13px]" onClick={() => setAuthOpen(true)}>
                        {t('Giriş Yap ya da Üye Ol')}
                      </button>
                    </div>
                  )}
                </div>
              ) : status === 'sending' ? (
                <p className="mt-2 text-[13px] text-muted">{t('Skorun kaydediliyor…')}</p>
              ) : status === 'error' ? (
                <p className="mt-2 text-[13px] text-accent-2">
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
                    <p className="mt-0.5 text-[13px] text-[#7ad88a]">
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
        <div className="z-10 -mx-6 mt-3 grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-[1fr_auto_auto] border-t-2 border-line bg-[#171538]/95 px-6 py-3 wide:mt-4 [padding-bottom:max(12px,env(safe-area-inset-bottom))] short:col-start-1 short:row-start-3 short:mx-0 short:mt-2 short:grid-cols-2 short:gap-2 short:self-start short:border-0 short:bg-transparent short:p-0">
          <button className="pixel-btn primary col-span-2 min-w-0 justify-center sm:col-span-1 short:col-span-2" onClick={onNext} autoFocus>
            <span className="truncate">{ic(nextIdx !== null ? t('▶ Sıradaki: {city}', { city: displayName(LEVELS[nextIdx]) }) : t('▶ Defteri Kapat'))}</span>
          </button>
          <button className="pixel-btn" onClick={onRetry} aria-label={t('↺ Tekrar')}>
            {ic(t('↺ Tekrar'))}
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
      <div className="flex h-[76px] w-[76px] shrink-0 rotate-[-8deg] flex-col items-center justify-center rounded-full border-2 border-dashed border-line text-center text-[12px] leading-tight text-muted">
        {t("Bronz")}
        <br />
        {bronze} sn
      </div>
    )
  return (
    <div className="flex h-[84px] w-[84px] shrink-0 rotate-[-10deg] items-center justify-center rounded-full shadow-[0_5px_0_rgba(0,0,0,0.35)]" style={{ background: look[1], border: `5px solid ${look[2]}` }} title={`${look[0]} madalya`}>
      <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: look[2], color: look[3] }}>
        <span className="font-display text-[17px] leading-none">{look[0]}</span>
        <span className="mt-0.5 text-[12px] font-bold leading-none tracking-[0.02em]">{t("MADALYA")}</span>
      </div>
    </div>
  )
}

/** Yolcu seçici (şehir kartı ve mola): Uktun ya da Memo; küçük portreli bölmeli düğme */
function HeroSwitch({ value, onChange, scarf, kit }: { value: CharacterId; onChange: (id: CharacterId) => void; scarf: Scarf | null; kit: Kit }) {
  const t = useT()
  return (
    <div className="seg" role="group" aria-label={t('Yolcu')}>
      {(['uktun', 'memo'] as const).map((id) => (
        <button key={id} aria-pressed={value === id} onClick={() => value !== id && onChange(id)} className="flex items-center gap-1.5 !px-2.5">
          <Portrait id={id} scarf={scarf} accessory={kit} className="w-[22px]" />
          {CHARACTERS[id].name}
        </button>
      ))}
    </div>
  )
}
