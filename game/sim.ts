import { BOSSES, makeBoss, resetBoss, touchBoss, updateBoss, type Boss, type BossDef } from './boss'
import { T, type GameEvent, type Input, type LevelDef } from './types'

/* ── Tile kodları ───────────────────────────────────────────── */
export const EMPTY = 0
export const SOLID = 1
export const ONEWAY = 2
export const SPIKE_UP = 3
export const ICE = 4
export const CRUMBLE = 5
export const WATER = 6
export const SPIKE_DOWN = 7
export const TURRET = 8
export const DOOR = 9
export const FAKE = 10
export const BLOCK_A = 11
export const BLOCK_B = 12
/** meydan kapısı: boss yenilene dek kapalı */
export const BOSS_GATE = 13
/** ıslak taş: buz kadar değil ama kaygan (yağmurlu şehirler) */
export const WET = 14
/** halat (L): havadayken değince tutunulur; yukarı/aşağı tırmanılır, zıplayınca bırakılır */
export const ROPE = 15
/** teleferik halatı (R): altından asılınır, sağa sola elle ilerlenir; zıplayınca ya da aşağıya basınca bırakılır */
export const CABLE = 16
/** derin su (W): yüzülür; zıplama kulaç atar, yüzeyde atılan kulaç sudan çıkarır. Öldüren ~ suyundan ayrıdır */
export const SWIM = 17
/** ritim blokları: saate bağlı, iki takım sırayla belirip kaybolur (`{` önce, `}` sonra) */
export const RHYTHM_A = 18
export const RHYTHM_B = 19
/**
 * gelgit suyu (A, Mersin): saate bağlı yükselip alçalır. Su altında kalan karesi derin su (`SWIM`: yüzülür, nefes
 * kuralı geçerli), açıkta kalan karesi boş havadır. tile() bu karoyu o anki hâline çevirir; ham hâli isTide() söyler.
 */
export const TIDE = 20

/* ── Fizik sabitleri (dünya pikseli / saniye) ───────────────── */
/** dash halkası harcandıktan sonra yeniden dolma süresi (sn) */
export const CRYSTAL_RECHARGE = 2.5
/**
 * Nitro tüpü (T): alınınca kısa süre hızlı koşu. Hız yürüyüşün ~1,55 katı; atlayış da hızla uzar (zıplama gücü aynı).
 * İsteğe bağlı kestirmedir: hiçbir yol nitrosuz geçilemez hâle getirilmez. Tüp birkaç saniyede yeniden dolar.
 */
export const NITRO = { time: 3, speed: 1.55, recharge: 4 }
/**
 * Nefes (derin su `W`): başı su altındayken nefes azalır, başı sudan çıkınca hemen dolar; biterse boğulur.
 * 6 sn: haritalardaki en uzun havasız su tüneli (Rize) 1,7 sn'de geçilir, havuz dibine inip çıkmak da sığar.
 * Son `warn` saniyede kabarcık göstergesi kızarır.
 */
export const AIR = { max: 6, warn: 2.5 }
/** Ay Yerçekimi (zor mod): oyuncunun yerçekimi ve en büyük düşüş hızı bu oranlarla çarpılır */
export const MOON = { gravity: 0.55, fall: 0.6 }
/** Fırtına (zor mod): rüzgâr sin(süre × freq) ile yön değiştirir (~4,5 sn'de bir döner) */
export const STORM = { freq: 0.7 }
/**
 * Ritim blokları: her `half` saniyede bir takım değişir; kaybolmadan `warn` saniye önce yanıp söner (render).
 * Belirecek blok oyuncunun içindeyse oyuncu çıkana dek boş kalır: kimse taşın içinde sıkışmaz.
 */
export const RHYTHM = { half: 1.6, warn: 0.45 }
/**
 * Gelgit (A karoları): `period` saniyelik döngü, saatten (aynalı haritada da aynı). Yüksekte `hold` saniye durur,
 * `move` saniyede iner, alçakta `hold` saniye durur, `move` saniyede yükselir. Değişimden `warn` saniye önce suyun
 * varacağı çizgide köpük yanıp söner (render). Birbirine değen gelgit kareleri bir havuzdur: havuzun suyu düz durur,
 * yüksekte en üst karesine dek dolar, alçakta tamamen çekilir (kalıcı su isteniyorsa altına `W` konur).
 */
export const TIDE_CYCLE = { period: 8, hold: 2.6, move: 1.4, warn: 0.9 }

/** gelgitin doluluğu (0: alçak, 1: yüksek) verilen saatte; yumuşak (kosinüs) iniş çıkış */
export function tideFill(clock: number): number {
  const { period, hold, move } = TIDE_CYCLE
  const ph = ((clock % period) + period) % period
  if (ph < hold) return 1
  if (ph < hold + move) return 0.5 + 0.5 * Math.cos((Math.PI * (ph - hold)) / move)
  if (ph < hold * 2 + move) return 0
  return 0.5 - 0.5 * Math.cos((Math.PI * (ph - hold * 2 - move)) / move)
}

/** gelgitin evresi: yüksek, iniyor, alçak, yükseliyor; `next` o evrenin bitmesine kalan saniye */
export function tidePhase(clock: number): { phase: 'high' | 'ebb' | 'low' | 'flood'; next: number } {
  const { period, hold, move } = TIDE_CYCLE
  const ph = ((clock % period) + period) % period
  if (ph < hold) return { phase: 'high', next: hold - ph }
  if (ph < hold + move) return { phase: 'ebb', next: hold + move - ph }
  if (ph < hold * 2 + move) return { phase: 'low', next: hold * 2 + move - ph }
  return { phase: 'flood', next: period - ph }
}

/** tam zamanında yay: yaya inerken zıplama basılıysa (tampon içinde) sekiş bu kat güçlü */
export const PERFECT_SPRING = 1.22

/**
 * Kovalamaca: köpek doğuşta `wait` sn bekler, sonra izini `speed` px/sn ile koşar (oyuncunun koşusu 100); hızı saniyede
 * `ramp` artar, en çok `top`. En çok `maxLag` sn'lik yol (en yüksek hızla) geride kalır. İz halkası `trail` örnek, `sample`
 * pikselde bir (mesafeyle; yerinde durmak izi doldurmaz).
 */
export const CHASE = { wait: 1.6, speed: 78, ramp: 0.25, top: 94, maxLag: 4, trail: 600, sample: 2 }

export interface Chaser {
  /** ayak tabanı ortası (dünya px) */
  x: number
  y: number
  /** bir önceki adımdaki yer: çizim ara değerler */
  px: number
  py: number
  facing: number
  state: 'wait' | 'run' | 'bite'
  /** son doğuştan beri geçen süre (sn): hız bununla artar */
  since: number
  /** köpeğin iz boyunca aldığı yol (px) */
  arc: number
  /** köpeğin yetişmesine kalan süre (sn): göstergede ve havlamada */
  gap: number
  /** bu yaklaşmada hırladı mı */
  growled: boolean
  /** oyuncu hareketli bir şeyin başında bekliyor: köpek oturur */
  calm: boolean
  /** oyuncunun izi: [x, ayak y, yön, o ana dek alınan yol] dörtlüleri, halka tampon */
  trail: Float32Array
  head: number
  count: number
}

/** omuz sekmesinin gücü (zıplama hızına oran): tam zıplamadan yüksek, yaydan alçak */
export const SHOULDER_BOOST = 1.2

/** haritanın üstünde oyuncunun çıkabildiği gök payı (karo); üstü tavandır. Kamera da bu kadar yukarıyı gösterir. */
export const SKY_ROWS = 4

export const PHYS = {
  gravity: 980,
  fallMax: 300,
  wallSlideMax: 58,
  run: 100,
  accelGround: 950,
  decelGround: 1200,
  accelAir: 680,
  dragAir: 300,
  accelIce: 240,
  decelIce: 70,
  accelWet: 520,
  decelWet: 300,
  /** sandığı iterken en yüksek hız */
  push: 46,
  jumpV: 312,
  lowJumpMul: 1.9,
  coyote: 0.12,
  buffer: 0.16,
  /** kenar yardımı: kıl payı kaçırılan zemine yatayda bu kadar piksel çekilir */
  ledgeAssist: 4,
  /** taşın yan yüzüne üst kenarın bu kadar altından çarpan oyuncu taşın üstüne alınır (px): kenara "az kala" düşülmez */
  stepUp: 5,
  /** tavan köşesine kafa sürtünce bu kadar piksel yana kayar */
  cornerAssist: 4,
  wallJumpVX: 150,
  wallJumpVY: 292,
  wallLock: 0.14,
  /** rüzgârın hedef hıza katkısı (sn): havada ve yerde yürürken; Bayburt'un tam esintisi (-210) havada -21 px/sn */
  windAir: 0.1,
  windGround: 0.05,
  dashSpeed: 285,
  dashTime: 0.14,
  /** iki dash arası en az bu kadar (sn, dash başından): art arda spam olmaz; dash halkası bekletmez */
  dashCooldown: 0.3,
  /** bekleme bitmeden basılan dash yutulmaz, bu kadar önceden basılırsa süre dolunca atılır */
  dashBuffer: 0.12,
  springV: 470,
  stompV: 270,
  /** halatta tırmanma, teleferikte elle ilerleme hızı (px/sn) */
  ropeClimb: 72,
  cableMove: 70,
  /** halattan bırakınca aynı halatı yeniden tutmadan önce (sn) */
  regrab: 0.22,
  /** suda: yerçekimi, batma hızı, kulaç, yüzeyden çıkış, yüzme hızı */
  swimGravity: 320,
  swimSink: 70,
  swimStroke: 170,
  swimLeap: 300,
  swimRun: 76,
  strokeCool: 0.18,
} as const

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Player extends Box {
  vx: number
  vy: number
  facing: 1 | -1
  grounded: boolean
  coyote: number
  buffer: number
  dashTime: number
  dashDir: [number, number]
  canDash: boolean
  /** sonraki dash'e kalan bekleme (sn) */
  dashCool: number
  /** bekleme sırasında basılmış dash (sn) */
  dashQueued: number
  wallDir: -1 | 0 | 1
  wallLock: number
  dropTimer: number
  onPlatform: Platform | null
  onIce: boolean
  onWet: boolean
  dead: boolean
  deadTimer: number
  runTime: number
  landTimer: number
  /** 0: serbest · 1: halatta · 2: teleferikte */
  hang: 0 | 1 | 2
  /** halattan bırakıldıktan sonra yeniden tutma beklemesi */
  regrab: number
  /** suyun içinde (gövdenin ortası W karosunda) */
  swim: boolean
  strokeCool: number
  /** nitronun kalan süresi (sn); 0 ise normal koşu */
  nitro: number
  /** kalan nefes (sn): derin suda başı su altındayken azalır */
  air: number
}

export interface Platform extends Box {
  /** x/y: gidip gelir · o: çember çizer (sema) · b: binince yükselen balon · h: horon halkası (ritimle zıplar) */
  axis: 'x' | 'y' | 'o' | 'b' | 'h'
  /** çember için merkez, yarıçap, başlangıç açısı */
  cx?: number
  cy?: number
  r?: number
  a0?: number
  /** horon halkası mı, koçari mi (koçari daha ağır ve yavaş vurur) */
  dance?: 'horon' | 'kocari'
  min: number
  max: number
  dir: 1 | -1
  speed: number
  dx: number
  dy: number
}

export type EnemyKind = 'ground' | 'fly' | 'hopper' | 'charger' | 'bat' | 'spiky' | 'magpie' | 'shark' | 'piranha'

export interface Enemy extends Box {
  kind: EnemyKind
  ox: number
  oy: number
  dir: 1 | -1
  alive: boolean
  phase: number
  vx: number
  vy: number
  /** idle · windup (uyarı) · charge · stun · air */
  state: 'idle' | 'windup' | 'charge' | 'stun' | 'air'
  timer: number
  /** bu adımdan önceki tepe (basma kuralı: oyuncu üstten mi geldi) */
  py?: number
}

export interface Crystal extends Box {
  active: boolean
  timer: number
}

/** İtilebilen sandık: dinlenirken üstü zemin, yanı duvardır. */
export interface Crate extends Box {
  vy: number
  ox: number
  oy: number
  /** suya ya da boşluğa düştükten sonra yerine dönene dek geçen süre */
  sunk: number
}

export interface Plate extends Box {
  pressed: boolean
}

/** Bakırcı tokmağı: tavandan iner, yere vurur, yavaşça kalkar. Konumu saatin fonksiyonu. */
export interface Hammer {
  x: number
  top: number
  bottom: number
  offset: number
}

/** horon halkası: zıplama yüksekliği (px) ve ritim (rad/s); |sin| periyodu ≈ 0,87 sn */
export const HORON = { lift: 20, beat: 3.6 }
/** koçari: daha ağır, yavaş ve alçak; yere vuruş uzun sürer */
export const KOCARI = { lift: 26, beat: 2.2 }

export const HAMMER = { rest: 1.1, warn: 0.4, fall: 0.16, hold: 0.45, rise: 1.0 }
export const HAMMER_CYCLE = HAMMER.rest + HAMMER.warn + HAMMER.fall + HAMMER.hold + HAMMER.rise

/** 0: yukarıda bekler, 1: titrer (uyarı), 2: iner, 3: yerde, 4: kalkar — ve başın üst kenarı */
export function hammerState(h: Hammer, clock: number): { phase: 0 | 1 | 2 | 3 | 4; y: number } {
  let t = (clock + h.offset) % HAMMER_CYCLE
  const span = h.bottom - h.top
  if (t < HAMMER.rest) return { phase: 0, y: h.top }
  t -= HAMMER.rest
  if (t < HAMMER.warn) return { phase: 1, y: h.top }
  t -= HAMMER.warn
  if (t < HAMMER.fall) return { phase: 2, y: h.top + span * (t / HAMMER.fall) ** 2 }
  t -= HAMMER.fall
  if (t < HAMMER.hold) return { phase: 3, y: h.bottom }
  t -= HAMMER.hold
  return { phase: 4, y: h.bottom - span * (t / HAMMER.rise) }
}

export interface Turret {
  tx: number
  ty: number
  dir: 1 | -1
  timer: number
}

export interface Projectile extends Box {
  vx: number
  /** kavisli atış (boss): dikey hız ve yerçekimi */
  vy?: number
  g?: number
}

export interface Pickup extends Box {
  index: number
  taken: boolean
}

export interface Checkpoint extends Box {
  index: number
  active: boolean
}

export interface Spring extends Box {
  squash: number
}

export interface Sign extends Box {
  index: number
}

export interface Decor {
  tx: number
  ty: number
  ch: string
}

interface CrumbleState {
  t: number
  broken: boolean
  respawn: number
}

// sprite gövdesiyle aynı genişlik: ayak görünürde zemindeyse fizikte de zeminde
const PW = 12
const enemy = (kind: EnemyKind, x: number, y: number, w: number, h: number): Enemy => ({ kind, x, y, w, h, ox: x, oy: y, dir: -1, alive: true, phase: x * 0.05, vx: 0, vy: 0, state: 'idle', timer: 1 + ((x / 16) % 5) * 0.2 })
const PH = 14

export class World {
  readonly level: LevelDef
  readonly cols: number
  readonly rows: number
  readonly tiles: Uint8Array
  readonly player: Player
  readonly platforms: Platform[] = []
  readonly hammers: Hammer[] = []
  /** bölüm açıldığından beri geçen süre (oyuncu başlamasa da akar): saat tabanlı tuzaklar için */
  clock = 0
  readonly enemies: Enemy[] = []
  readonly turrets: Turret[] = []
  projectiles: Projectile[] = []
  readonly pickups: Pickup[] = []
  readonly checkpoints: Checkpoint[] = []
  readonly springs: Spring[] = []
  readonly signs: Sign[] = []
  readonly npcs: Sign[] = []
  readonly crystals: Crystal[] = []
  /** nitro tüpleri: dash halkası gibi alınır ve yeniden dolar */
  readonly nitros: Crystal[] = []
  readonly plates: Plate[] = []
  /** itilebilen sandıklar: yandan itilir, üstüne çıkılır, boşluğa düşer; ölünce yerine döner */
  readonly crates: Crate[] = []
  keyBox: Box | null = null
  stampBox: Box | null = null
  /** her bölümde bir tane saklı nazar boncuğu */
  charmBox: Box | null = null
  charmTaken = false
  hasKey = false
  stampTaken = false
  /** false: [ blokları katı · true: ] blokları katı */
  switchOn = false
  readonly decor: Decor[] = []
  /** şehrin dost hayvanları: dokununca sevinir, zarar vermez */
  readonly friends: Array<Box & { cool: number }> = []
  readonly exit: Box
  /** meydan kapısı: dokununca oyuncuyu bölümün finaline (varış noktasına) geçirir */
  warp: Box | null = null
  arrival: { x: number; y: number } | null = null
  /** şehrin boss’u (yoksa null; çözücü de null yapar: kapı açık sayılır) */
  boss: Boss | null = null
  /** Co-op Boss Kapışması'nda ikinci boss (LevelDef.bossOf2) */
  boss2: Boss | null = null
  /** Kovalamaca'nın Kangal'ı (LevelDef.chaser); yoksa null */
  chaser: Chaser | null = null
  /** Kovalamaca: köpeğin beklediği yerler (hareketli şeylerin yolu ve çevresi) */
  chaseCalm: Box[] = []
  /** bayrak alındığındaki düğme durumu: ölünce buna dönülür, bloklar yanlış tarafta kalmaz */
  private cpSwitch = false
  get checkpointSwitch() {
    return this.cpSwitch
  }
  set checkpointSwitch(v: boolean) {
    this.cpSwitch = v
  }
  readonly start: { x: number; y: number }
  readonly crumbles = new Map<number, CrumbleState>()
  /** haritada ritim bloğu var mı (yoksa her adımda aranmaz) */
  hasRhythm = false
  /** belirdiği an oyuncunun içinde kalan ritim blokları: oyuncu çıkana dek boş */
  readonly rhythmHold = new Set<number>()
  private rhythmLast = -1
  /** haritada gelgit suyu var mı */
  hasTide = false
  /** gelgit karosunun havuzu (y * cols + x → havuz sırası; -1: gelgit değil) */
  tideOf: Int16Array = new Int16Array(0)
  /** havuzlar: en üst karesinin üstü ve en alt karesinin altı (dünya pikseli), sütun aralığı */
  readonly tidePools: Array<{ top: number; bottom: number; x0: number; x1: number }> = []
  private tideClock = -1
  private tideNow = 1
  /** zehirli su karoları (y * cols + x): fizikte öldüren su, çizimde yeşil */
  readonly poison = new Set<number>()

  spawn: { x: number; y: number }
  checkpointIndex = -1
  time = 0
  deaths = 0
  complete = false
  /** süre ilk hareketle başlar (madalya adaletli olsun) */
  started = false
  /** oyuncunun bu adımdan önceki ayak hizası (basma kuralı) */
  prevFeet = 0
  private prevDown = false
  /**
   * Co-op: ikinci oyuncu (eş). Aynı dünyayı paylaşır (toplananlar, düğmeler, bayraklar, boss ortak); düşen eş
   * partnerinin yanında doğar, dünya sıfırlanmaz. Yalnız oyuncu (player) düşünce bölüm bayraktan yeniden kurulur.
   */
  partner: Player | null = null
  private partnerPrevDown = false
  windNow = 0
  nearSign = -1
  nearNpc = -1
  events: GameEvent[] = []

  constructor(level: LevelDef) {
    this.level = level
    const map = level.map
    this.rows = map.length
    this.cols = Math.max(...map.map((r) => r.length))
    this.tiles = new Uint8Array(this.cols * this.rows)
    let start = { x: 32, y: 32 }
    let exit: Box = { x: 0, y: 0, w: 0, h: 0 }
    let pickupIdx = 0
    let cpIdx = 0
    let signIdx = 0

    for (let ty = 0; ty < this.rows; ty++) {
      const row = map[ty]
      for (let tx = 0; tx < this.cols; tx++) {
        const ch = row[tx] ?? ' '
        const px = tx * T
        const py = ty * T
        // zamanlama fazları asıl haritadaki sütundan: aynalı harita aynı ritimde işler
        const ox = level.mirror ? this.cols - 1 - tx : tx
        switch (ch) {
          case '#':
            this.set(tx, ty, SOLID)
            break
          case '=':
            this.set(tx, ty, ONEWAY)
            break
          case '^':
            this.set(tx, ty, SPIKE_UP)
            break
          case 'v':
            this.set(tx, ty, SPIKE_DOWN)
            break
          case 'I':
            this.set(tx, ty, ICE)
            break
          case 'i':
            this.set(tx, ty, WET)
            break
          case '{':
            this.set(tx, ty, RHYTHM_A)
            this.hasRhythm = true
            break
          case '}':
            this.set(tx, ty, RHYTHM_B)
            this.hasRhythm = true
            break
          case 'p':
            this.crates.push({ x: px, y: py, w: T, h: T, vy: 0, ox: px, oy: py, sunk: 0 })
            break
          case 'X':
            this.set(tx, ty, CRUMBLE)
            break
          case '~':
            this.set(tx, ty, WATER)
            break
          case 'L':
            this.set(tx, ty, ROPE)
            break
          case 'R':
            this.set(tx, ty, CABLE)
            break
          case 'A':
            this.set(tx, ty, TIDE)
            this.hasTide = true
            break
          case 'W':
          case 'y':
          case 'U':
            // suda yüzen düşmanların karesi de derin sudur
            this.set(tx, ty, SWIM)
            break
          case '>':
          case '<':
            this.set(tx, ty, TURRET)
            this.turrets.push({ tx, ty, dir: ch === '>' ? 1 : -1, timer: 0.6 + ((ox * 7 + ty * 3) % 10) / 10 })
            break
          case 'P':
            start = { x: px + (T - PW) / 2, y: py + T - PH }
            break
          case 'E':
            exit = { x: px, y: py - T, w: T, h: T * 2 }
            break
          case 'C':
            this.pickups.push({ x: px + 3, y: py + 3, w: 10, h: 10, index: pickupIdx++, taken: false })
            break
          case 'F':
            this.checkpoints.push({ x: px, y: py - T, w: T, h: T * 2, index: cpIdx++, active: false })
            break
          case 'S':
            this.springs.push({ x: px + 1, y: py + 8, w: 14, h: 8, squash: 0 })
            break
          case 'e':
            this.enemies.push(enemy('ground', px + 2, py + 6, 12, 10))
            break
          case 'f':
            this.enemies.push({ ...enemy('fly', px + 2, py + 4, 12, 8), phase: ox * 0.7 })
            break
          case 'h':
            this.enemies.push(enemy('hopper', px + 2, py + 6, 12, 10))
            break
          case 'c':
            this.enemies.push(enemy('charger', px + 1, py + 4, 14, 12))
            break
          case 'u':
            this.enemies.push({ ...enemy('bat', px + 2, py + 4, 12, 8), phase: ox * 0.9 })
            break
          case 'x':
            this.enemies.push(enemy('spiky', px + 2, py + 7, 12, 9))
            break
          case 'y':
            // Esoli (köpekbalığı): suda devriye, yüzeni görünce titreyip uyarır, sonra hamle yapar; ezilmez, kaçılır
            this.enemies.push({ ...enemy('shark', px - 6, py + 2, 28, 12), timer: 1 })
            break
          case 'U':
            // pirana: kısa mesafede çevik gidip gelir; basılır ya da dash'le vurulur
            this.enemies.push({ ...enemy('piranha', px + 3, py + 4, 10, 8), phase: ox * 1.3 })
            break
          case 'j':
            // Ordu saksağanı: dalda bekler, altından geçene dalar
            this.enemies.push({ ...enemy('magpie', px + 2, py + 6, 12, 9), timer: 0.4 })
            break
          case '*':
            this.crystals.push({ x: px + 3, y: py + 3, w: 10, h: 10, active: true, timer: 0 })
            break
          case 'T':
            this.nitros.push({ x: px + 3, y: py + 2, w: 10, h: 14, active: true, timer: 0 })
            break
          case 'K':
            this.keyBox = { x: px + 3, y: py + 3, w: 10, h: 10 }
            break
          case '$':
            this.stampBox = { x: px + 2, y: py + 2, w: 12, h: 12 }
            break
          case '!':
            this.charmBox = { x: px + 3, y: py + 3, w: 10, h: 10 }
            break
          case 'D':
            this.set(tx, ty, DOOR)
            break
          case '%':
            this.set(tx, ty, FAKE)
            break
          case '[':
            this.set(tx, ty, BLOCK_A)
            break
          case ']':
            this.set(tx, ty, BLOCK_B)
            break
          case 'G':
            this.set(tx, ty, BOSS_GATE)
            break
          case '@':
            this.warp = { x: px, y: py - T, w: T, h: T * 2 }
            break
          case '&':
            this.arrival = { x: px + (T - PW) / 2, y: py + T - PH }
            break
          case 'Q': {
            // arena sınırları: boss’un satırında | ya da duvara kadar
            const boost = (d: BossDef): BossDef => (level.bossBoost ? { ...d, tier: Math.max(d.tier, level.bossBoost.tier) as 1 | 2 | 3, speed: d.speed * level.bossBoost.speed, hp: d.hp + (level.bossBoost.hp ?? 0), bonus: level.bossBoost.hp || undefined } : d)
            const def = boost(BOSSES[level.bossOf ?? level.city])
            const stop = (c: string | undefined) => c === undefined || c === '|' || c === '#' || c === 'G'
            let l = tx - 1
            while (l >= 0 && !stop(row[l])) l--
            let r = tx + 1
            while (r < this.cols && !stop(row[r])) r++
            this.boss = makeBoss(def, px, (ty + 1) * T, (l + 1) * T, r * T - def.w)
            if (level.bossOf2) {
              // ikinci boss arenanın öbür ucundan: birinin aynası
              const def2 = boost(BOSSES[level.bossOf2])
              this.boss2 = makeBoss(def2, (l + 1) * T + (r * T - def2.w) - px, (ty + 1) * T, (l + 1) * T, r * T - def2.w)
              this.boss2.dir = 1
            }
            break
          }
          case '_':
            this.plates.push({ x: px + 1, y: py + 12, w: 14, h: 4, pressed: false })
            break
          case '?':
            this.signs.push({ x: px, y: py, w: T, h: T, index: signIdx++ })
            break
          case 'n':
            this.npcs.push({ x: px, y: py, w: T, h: T, index: 0 })
            break
          case 'M':
          case 'N':
          case 'O':
          case 'B':
          case 'H':
          case 'J': {
            if (row[tx - 1] === ch) break // aynı platformun devamı
            let n = 1
            while (row[tx + n] === ch) n++
            const plat = this.makePlatform(map, tx, ty, n, ch === 'M' ? 'x' : ch === 'N' ? 'y' : ch === 'O' ? 'o' : ch === 'H' || ch === 'J' ? 'h' : 'b')
            if (ch === 'J') {
              plat.dance = 'kocari'
              plat.min = plat.max - KOCARI.lift
            } else if (ch === 'H') plat.dance = 'horon'
            this.platforms.push(plat)
            break
          }
          case 'Y': {
            let d = ty + 1
            while (d < map.length && !'#I=X'.includes(map[d][tx] ?? ' ')) d++
            this.hammers.push({ x: px, top: py, bottom: (d - 1) * T, offset: (ox * 0.37) % HAMMER_CYCLE })
            break
          }
          case 'a':
          case 'b':
          case 'd':
          case 'g':
          case 'h':
          case 'k':
          case 'l':
          case 'o':
          case 'r':
          case 's':
          case 'm':
          case 't':
          case 'w':
          case 'z':
          case 'q':
            this.decor.push({ tx, ty, ch })
            if (ch === 'k') this.friends.push({ x: px - 2, y: py + 4, w: 20, h: 12, cool: 0 })
            break
          default:
            break
        }
      }
    }
    // satır satır tarandı; soldan sağa sırala (ipucu ve bayrak sırası buna bağlı)
    const byX = <A extends { x: number; y: number; index: number }>(arr: A[]) => {
      arr.sort((a, b) => a.x - b.x || a.y - b.y)
      arr.forEach((a, i) => (a.index = i))
    }
    byX(this.pickups)
    byX(this.checkpoints)
    byX(this.signs)
    byX(this.npcs)
    this.start = start
    this.spawn = { ...start }
    this.exit = exit
    // derin suyun içine konan toplanabilir (hatıra, pul, nazar, anahtar) karosunu kuru boşluğa çevirmesin: çevresinin en az
    // ikisi yüzülen suysa o karo da sudur (hatıra derenin dibinde suyun içinde durur)
    for (const b of [...this.pickups, this.stampBox, this.charmBox, this.keyBox]) {
      if (!b) continue
      const tx = Math.floor((b.x + b.w / 2) / T)
      const ty = Math.floor((b.y + b.h / 2) / T)
      if (this.tile(tx, ty) !== EMPTY) continue
      const around = [this.raw(tx - 1, ty), this.raw(tx + 1, ty), this.raw(tx, ty - 1), this.raw(tx, ty + 1)]
      if (around.filter((t) => t === SWIM).length >= 2) this.set(tx, ty, SWIM)
      else if (around.filter((t) => t === TIDE).length >= 2) {
        this.set(tx, ty, TIDE)
        this.hasTide = true
      }
    }
    if (this.hasTide) this.buildTidePools()
    if (level.poison) this.poisonPits()
    if (level.crumbleAll) this.crumbleSurfaces()
    this.player = this.freshPlayer(start.x, start.y)
    if (level.chaser) {
      this.buildChaseCalm()
      this.chaser = { x: 0, y: 0, px: 0, py: 0, facing: 1, state: 'wait', since: 0, arc: 0, gap: 9, growled: false, calm: false, trail: new Float32Array(CHASE.trail * 4), head: 0, count: 0 }
      this.resetChaser()
    }
  }

  /**
   * Zehirli şehirlerde iki yanı ve altı katı duvarla kapalı, üstü boş diken sırası zehirli suya döner. Yalnız çukurun
   * dibindeki dikenler değişir: düz yoldaki ya da tavandaki diken aynı kalır, haritanın ölçüleri değişmez.
   */
  private poisonPits() {
    const wall = (tx: number, ty: number) => {
      const t = this.tile(tx, ty)
      return t === SOLID || t === ICE || t === WET
    }
    for (let ty = 1; ty < this.rows - 1; ty++) {
      for (let tx = 1; tx < this.cols; tx++) {
        if (this.tile(tx, ty) !== SPIKE_UP || this.tile(tx - 1, ty) === SPIKE_UP) continue
        let end = tx
        while (this.tile(end + 1, ty) === SPIKE_UP) end++
        let closed = wall(tx - 1, ty) && wall(end + 1, ty)
        for (let x = tx; x <= end && closed; x++) closed = wall(x, ty + 1) && this.tile(x, ty - 1) === EMPTY
        if (!closed) continue
        for (let x = tx; x <= end; x++) {
          this.set(x, ty, WATER)
          this.poison.add(ty * this.cols + x)
        }
      }
    }
  }

  /**
   * Çöken Dünya: üstü boş her katı yüzey karosu çatlak taşa döner. Başlangıcın, bayrakların, çıkışın, meydan kapısının
   * ve varış yerinin iki karo çevresi ile boss arenası sağlam kalır: oyuncu doğduğu yerde düşmez, boss'u bekleyerek yener.
   */
  private crumbleSurfaces() {
    const safe: Array<{ x: number; y: number }> = [this.start, this.exit, ...this.checkpoints]
    if (this.warp) safe.push(this.warp)
    if (this.arrival) safe.push(this.arrival)
    const near = (tx: number, ty: number) => safe.some((b) => Math.abs(Math.floor(b.x / T) - tx) <= 2 && Math.abs(Math.floor(b.y / T) - ty) <= 3)
    const arena = (tx: number) => this.boss !== null && tx * T >= this.boss.min - 2 * T && tx * T <= this.boss.max + this.boss.w + 2 * T
    for (let ty = 1; ty < this.rows; ty++)
      for (let tx = 0; tx < this.cols; tx++) {
        if (this.tile(tx, ty) !== SOLID || this.tile(tx, ty - 1) !== EMPTY) continue
        if (near(tx, ty) || arena(tx)) continue
        this.set(tx, ty, CRUMBLE)
      }
  }

  private makePlatform(map: string[], tx: number, ty: number, n: number, axis: Platform['axis']): Platform {
    const w = n * T
    const x = tx * T
    const y = ty * T
    let min: number
    let max: number
    if (axis === 'o') {
      // merkez yerleştirilen yerde; 2 karo yarıçapla döner, komşular ters yönde
      const cx = x + w / 2
      const cy = y + 4
      // aynalı haritada dönüş, asıl haritadaki halkanın tam ayna görüntüsü: aynı başlangıç, ters yön
      const otx = this.level.mirror ? this.cols - tx - n : tx
      const a0 = this.level.mirror ? Math.PI - (otx % 2) * Math.PI : (tx % 2) * Math.PI
      const dir: 1 | -1 = (otx % 4 < 2) !== !!this.level.mirror ? 1 : -1
      const r = 2 * T
      return { x: cx + Math.cos(a0) * r - w / 2, y: cy + Math.sin(a0) * r, w, h: 6, axis, min: 0, max: 0, dir, speed: 1.35, dx: 0, dy: 0, cx, cy, r, a0 }
    }
    if (axis === 'h') {
      // horon: kol kola oyuncuların elleri; hepsi aynı ritimde zıplar
      return { x, y, w, h: 6, axis, min: y - HORON.lift, max: y, dir: 1, speed: 0, dx: 0, dy: 0 }
    }
    if (axis === 'b') {
      let u = ty - 1
      while (u >= 0 && map[u][tx] !== ':' && !'#X'.includes(map[u][tx])) u--
      // tavanla arasında oyuncuya yer kalsın
      min = Math.min(y, (u + 1) * T + (map[u]?.[tx] === ':' ? 0 : 2 * T))
      return { x, y, w, h: 6, axis, min, max: y, dir: 1, speed: 34, dx: 0, dy: 0 }
    }
    if (axis === 'x') {
      let l = tx - 1
      while (l >= 0 && map[ty][l] !== '|' && map[ty][l] !== '#') l--
      let r = tx + n
      while (r < map[ty].length && map[ty][r] !== '|' && map[ty][r] !== '#') r++
      min = (l + 1) * T
      max = r * T - w
    } else {
      let u = ty - 1
      while (u >= 0 && map[u][tx] !== ':' && map[u][tx] !== '#') u--
      let d = ty + 1
      while (d < map.length && map[d][tx] !== ':' && map[d][tx] !== '#') d++
      min = (u + 1) * T
      max = (d - 1) * T
    }
    // aynalı haritada yatay platform ilk önce sola gider (asıl haritanın ayna görüntüsü)
    return { x, y, w, h: 6, axis, min, max, dir: axis === 'x' && this.level.mirror ? -1 : 1, speed: axis === 'x' ? 42 : 36, dx: 0, dy: 0 }
  }

  private freshPlayer(x: number, y: number): Player {
    return {
      x,
      y,
      w: PW,
      h: PH,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      buffer: 0,
      dashTime: 0,
      dashDir: [1, 0],
      canDash: true,
      dashCool: 0,
      dashQueued: 0,
      wallDir: 0,
      wallLock: 0,
      dropTimer: 0,
      onPlatform: null,
      onIce: false,
      onWet: false,
      dead: false,
      deadTimer: 0,
      runTime: 0,
      landTimer: 0,
      hang: 0,
      regrab: 0,
      swim: false,
      strokeCool: 0,
      nitro: 0,
      air: AIR.max,
    }
  }

  /* ── Tile erişimi ─────────────────────────────────────────── */
  set(tx: number, ty: number, v: number) {
    this.tiles[ty * this.cols + tx] = v
  }

  tile(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.cols) return SOLID
    // tepeye dayanan duvar göğe kadar sürer: üstünden tırmanıp aşılmaz. Haritanın SKY_ROWS karo üstü tavandır:
    // duvar dibinde sekerek sonsuza (ekranın dışına) tırmanılmaz, oyuncu görünür bir yükseklikte durur
    if (ty < 0) return ty < -SKY_ROWS || this.tiles[tx] === SOLID ? SOLID : EMPTY
    if (ty >= this.rows) return EMPTY
    const t = this.tiles[ty * this.cols + tx]
    // gelgit karosu o anki hâlidir: su altındaysa derin su, açıktaysa boşluk
    if (t === TIDE) return this.tideCovers(tx, ty) ? SWIM : EMPTY
    return t
  }

  /** haritadaki ham karo (gelgit karosu TIDE olarak kalır) */
  raw(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return EMPTY
    return this.tiles[ty * this.cols + tx]
  }

  isTide(tx: number, ty: number): boolean {
    return this.raw(tx, ty) === TIDE
  }

  /** gelgitin şu anki doluluğu (0..1); saat değişmedikçe yeniden hesaplanmaz */
  get tideFill(): number {
    if (this.tideClock !== this.clock) {
      this.tideClock = this.clock
      this.tideNow = tideFill(this.clock)
    }
    return this.tideNow
  }

  /**
   * Gelgit değişmeden `warn` saniye önce (yüksekte ya da alçakta beklerken) oyuncu bir havuzun yakınındaysa tideUp / tideDown:
   * ses uyarısı (görsel uyarı render'da). Saate bağlı, her Hz'de aynı anda.
   */
  private tideCue(clock0: number) {
    const a = tidePhase(clock0)
    const b = tidePhase(this.clock)
    if (a.phase !== b.phase || (b.phase !== 'high' && b.phase !== 'low') || a.next <= TIDE_CYCLE.warn || b.next > TIDE_CYCLE.warn) return
    const p = this.player
    const tx = (p.x + p.w / 2) / T
    if (!this.tidePools.some((q) => tx > q.x0 - 14 && tx < q.x1 + 15)) return
    this.events.push({ type: b.phase === 'low' ? 'tideUp' : 'tideDown' })
  }

  /** havuzun su yüzü (dünya pikseli y); fill verilmezse şu anki doluluk */
  tideSurface(pool: number, fill = this.tideFill): number {
    const q = this.tidePools[pool]
    return q.bottom - (q.bottom - q.top) * fill
  }

  /** gelgit karesi su altında mı: karenin ortası su yüzünün altındaysa */
  private tideCovers(tx: number, ty: number): boolean {
    const pool = this.tideOf[ty * this.cols + tx]
    if (pool === undefined || pool < 0) return false
    return ty * T + T / 2 > this.tideSurface(pool)
  }

  /** birbirine (dört yönden) değen gelgit kareleri bir havuzdur: suyu düz durur */
  private buildTidePools() {
    this.tideOf = new Int16Array(this.cols * this.rows).fill(-1)
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] !== TIDE || this.tideOf[i] >= 0) continue
      const id = this.tidePools.length
      const pool = { top: Infinity, bottom: -Infinity, x0: Infinity, x1: -Infinity }
      const stack = [i]
      this.tideOf[i] = id
      while (stack.length) {
        const k = stack.pop()!
        const tx = k % this.cols
        const ty = Math.floor(k / this.cols)
        pool.top = Math.min(pool.top, ty * T)
        pool.bottom = Math.max(pool.bottom, ty * T + T)
        pool.x0 = Math.min(pool.x0, tx)
        pool.x1 = Math.max(pool.x1, tx)
        for (const [nx, ny] of [[tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx, ty + 1]]) {
          if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue
          const n = ny * this.cols + nx
          if (this.tiles[n] === TIDE && this.tideOf[n] < 0) {
            this.tideOf[n] = id
            stack.push(n)
          }
        }
      }
      this.tidePools.push(pool)
    }
  }

  isSolid(tx: number, ty: number): boolean {
    const t = this.tile(tx, ty)
    if (t === SOLID || t === ICE || t === WET || t === TURRET) return true
    if (t === CRUMBLE) return !this.crumbles.get(ty * this.cols + tx)?.broken
    if (t === DOOR) return !this.hasKey
    if (t === BLOCK_A) return !this.switchOn
    if (t === BLOCK_B) return this.switchOn
    if (t === RHYTHM_A || t === RHYTHM_B) return this.rhythmOn(t) && !this.rhythmHold.has(ty * this.cols + tx)
    if (t === BOSS_GATE) return (this.boss !== null && this.boss.state !== 'down') || (this.boss2 !== null && this.boss2.state !== 'down')
    return false
  }

  private boxHitsSolid(x: number, y: number, w: number, h: number): boolean {
    const x0 = Math.floor(x / T)
    const x1 = Math.floor((x + w - 0.001) / T)
    const y0 = Math.floor(y / T)
    const y1 = Math.floor((y + h - 0.001) / T)
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.isSolid(tx, ty)) return true
    return false
  }

  /* ── Ana adım ─────────────────────────────────────────────── */
  step(dt: number, input: Input) {
    const p = this.player
    if (this.complete) return
    if (!this.started && (input.left || input.right || input.jump || input.jumpPressed || input.dashPressed || input.up || input.down)) this.started = true
    if (this.started) this.time += dt

    const clock0 = this.clock
    this.updatePlatforms(dt)
    if (this.hasTide) this.tideCue(clock0)
    this.updateCrumbles(dt)
    this.updateRhythm()
    if (this.crates.length) this.updateCrates(dt)

    if (p.dead) {
      p.deadTimer -= dt
      // co-op dahil: düşünce bölüm son bayraktan kurulur, eş de oraya gelir (kural ikisine aynı)
      if (p.deadTimer <= 0) this.respawn()
      this.updateEnemies(dt)
      if (this.boss) updateBoss(this.boss, this, dt)
      if (this.boss2) updateBoss(this.boss2, this, dt)
      this.updateTurrets(dt)
      if (this.chaser) this.updateChaser(dt)
      return
    }

    this.prevFeet = p.y + p.h
    this.updatePlayer(dt, input)
    this.updateObjects(dt)
    for (const e of this.enemies) e.py = e.y
    this.updateEnemies(dt)
    if (this.boss) updateBoss(this.boss, this, dt)
    if (this.boss2) updateBoss(this.boss2, this, dt)
    this.updateTurrets(dt)
    this.interactions()
    if (this.chaser) this.updateChaser(dt)
  }

  /**
   * Kovalamaca: Kangal oyuncunun izini sürer (aynı yoldan: tırmandığın duvarı tırmanır, yüzdüğün suyu yüzer). İz boyunca
   * sabit hızla koşar: sen koştukça ve dash attıkça arayı açarsın, durunca o pay erir; pay bitince yetişir ve ısırır.
   * Doğuşta biraz bekler; hızı ara uzadıkça artar; en çok `maxLag` saniyelik iz geride kalır (sınırsız pay biriktirilmez).
   * Boss uyanınca arenanın kapısında oturur: boss kavgası köpeksiz.
   */
  private updateChaser(dt: number) {
    const c = this.chaser!
    const p = this.player
    c.px = c.x
    c.py = c.y
    const bossAwake = (this.boss && this.boss.state !== 'sleep') || (this.boss2 && this.boss2.state !== 'sleep')
    if (p.dead || !this.started || bossAwake) {
      if (bossAwake) c.state = 'wait'
      return
    }
    // iz: oyuncunun ayak noktası ve o ana dek aldığı yolun boyu; mesafeyle örneklenir (yerinde durmak izi doldurmaz).
    // İz her zaman kaydedilir, beklemede de: köpek oyuncunun gerçekten geçtiği yoldan gelir, düz çizgiden değil
    const n = CHASE.trail
    const t = c.trail
    const fx = p.x + p.w / 2
    const fy = p.y + p.h
    const last = c.count ? (c.head - 1 + n) % n : -1
    const stepLen = last < 0 ? 0 : Math.hypot(fx - t[last * 4], fy - t[last * 4 + 1])
    const arc = last < 0 ? 0 : t[last * 4 + 3] + stepLen
    if (last < 0 || stepLen >= CHASE.sample) {
      const o = c.head * 4
      t[o] = fx
      t[o + 1] = fy
      t[o + 2] = p.facing
      t[o + 3] = arc
      c.head = (c.head + 1) % n
      c.count++
    }
    // hareketli şeylerin başında (raylı platform, asansör, tokmak, ritim, gelgit, plaka) beklemek zorunludur: köpek oturup
    // soluklanır; oyuncu oradan ayrılınca kaldığı yerden, izin üstünden sürer
    if (p.onPlatform || this.chaseCalm.some((z) => overlap(p, z))) {
      c.state = 'wait'
      c.calm = true
      return
    }
    c.calm = false
    c.since += dt
    if (c.since < CHASE.wait) {
      c.state = 'wait'
      return
    }
    // köpek iz üzerinde ilerler; oyuncudan en çok maxLag saniyelik yol (en yüksek hızıyla) geride kalabilir
    const speed = Math.min(CHASE.top, CHASE.speed + (c.since - CHASE.wait) * CHASE.ramp)
    const kept = Math.min(c.count, n)
    const head = (c.head - 1 + n) % n
    const oldest = t[((c.head - kept) % n + n) % n * 4 + 3]
    c.arc = Math.min(arc, Math.max(c.arc + speed * dt, arc - CHASE.maxLag * CHASE.top, oldest))
    if (c.arc >= t[head * 4 + 3]) {
      // son örnekle oyuncunun şimdiki yeri arasında
      const a0 = t[head * 4 + 3]
      const u = arc > a0 ? (c.arc - a0) / (arc - a0) : 1
      c.x = t[head * 4] + (fx - t[head * 4]) * u
      c.y = t[head * 4 + 1] + (fy - t[head * 4 + 1]) * u
      c.facing = p.facing < 0 ? -1 : 1
    } else {
      // köpeğin yayına denk gelen iz noktasını sondan geriye ara (köpek hep izin son birkaç yüz pikselinde)
      let k = head
      for (let i = 0; i < kept - 1; i++) {
        const q = (k - 1 + n) % n
        if (t[q * 4 + 3] <= c.arc) {
          const a0 = t[q * 4 + 3]
          const a1 = t[k * 4 + 3]
          const u = a1 > a0 ? (c.arc - a0) / (a1 - a0) : 1
          c.x = t[q * 4] + (t[k * 4] - t[q * 4]) * u
          c.y = t[q * 4 + 1] + (t[k * 4 + 1] - t[q * 4 + 1]) * u
          c.facing = t[k * 4 + 2] < 0 ? -1 : 1
          break
        }
        k = q
      }
    }
    const gap = (arc - c.arc) / speed
    // yetişmesine bir saniye kala bir kez hırlar (uzaklaşınca yeniden kurulur)
    if (gap < 1 && c.gap >= 1 && !c.growled) {
      c.growled = true
      this.events.push({ type: 'growl' })
    }
    if (gap > 1.8) c.growled = false
    c.gap = gap
    c.state = gap < 0.6 ? 'bite' : 'run'
    // ısırık: köpeğin ağzı (önünde) oyuncunun gövdesine değerse
    const mouth = { x: c.x + c.facing * 6 - 7, y: c.y - 12, w: 14, h: 10 }
    if (gap < 0.2 && overlap(shrink(p, 2), mouth)) {
      this.events.push({ type: 'bite', x: c.x, y: c.y - 8 })
      this.kill()
    }
  }

  /**
   * Köpeğin beklediği yerler: hareketli platformun bütün yolu (yatayda 3, yukarıda 4, aşağıda 2 karo payla), tokmakların
   * çevresi, plakalar (5 karo), ritim blokları ve gelgit havuzları (3 karo payla). Bunlar zamanlama ya da geri dönüş ister;
   * köpek orada bekleyeni cezalandırmaz.
   */
  private buildChaseCalm() {
    const z = this.chaseCalm
    const pad = (x0: number, y0: number, x1: number, y1: number, sx = 3 * T, up = 4 * T, down = 2 * T) => z.push({ x: x0 - sx, y: y0 - up, w: x1 - x0 + 2 * sx, h: y1 - y0 + up + down })
    for (const pl of this.platforms) {
      if (pl.axis === 'x') pad(pl.min, pl.y, pl.max + pl.w, pl.y + pl.h)
      else if (pl.axis === 'y') pad(pl.x, pl.min, pl.x + pl.w, pl.max + pl.h)
      else if (pl.axis === 'o' && pl.cx !== undefined && pl.cy !== undefined && pl.r !== undefined) pad(pl.cx - pl.r, pl.cy - pl.r, pl.cx + pl.r + pl.w, pl.cy + pl.r + pl.h)
      else pad(pl.x, pl.y - HORON.lift - 6 * T, pl.x + pl.w, pl.y + pl.h)
    }
    for (const h of this.hammers) pad(h.x - T, h.top, h.x + 2 * T, h.bottom, 2 * T, T, 2 * T)
    // plaka bulmacası: basıp geri dönmek gerekir
    for (const pl of this.plates) pad(pl.x, pl.y - T, pl.x + pl.w, pl.y + pl.h, 5 * T, 6 * T, T)
    for (let ty = 0; ty < this.rows; ty++)
      for (let tx = 0; tx < this.cols; tx++) {
        const t = this.tiles[ty * this.cols + tx]
        if (t === RHYTHM_A || t === RHYTHM_B) pad(tx * T, ty * T, tx * T + T, ty * T + T, 3 * T, 3 * T, 3 * T)
      }
    for (const q of this.tidePools) pad(q.x0 * T, q.top, q.x1 * T + T, q.bottom, 3 * T, 4 * T, T)
  }

  /** köpeği yeniden doğuş yerine koyar: iz silinir, bekler */
  private resetChaser() {
    const c = this.chaser
    if (!c) return
    c.head = 0
    c.count = 0
    c.since = 0
    c.arc = 0
    c.gap = 9
    c.growled = false
    c.x = c.px = this.spawn.x + PW / 2
    c.y = c.py = this.spawn.y + PH
    c.state = 'wait'
  }

  private updatePlatforms(dt: number) {
    const p = this.player
    this.clock += dt
    for (const pl of this.platforms) {
      if (pl.axis === 'o' || pl.axis === 'b' || pl.axis === 'h') {
        let nx = pl.x
        let ny = pl.y
        if (pl.axis === 'h') {
          const d = pl.dance === 'kocari' ? KOCARI : HORON
          ny = pl.max - Math.abs(Math.sin(this.clock * d.beat)) * d.lift
        } else if (pl.axis === 'o') {
          const a = pl.a0! + pl.dir * pl.speed * this.clock
          nx = pl.cx! + Math.cos(a) * pl.r! - pl.w / 2
          ny = pl.cy! + Math.sin(a) * pl.r!
        } else {
          const ridden = !p.dead && p.onPlatform === pl
          ny = ridden ? Math.max(pl.min, pl.y - pl.speed * dt) : Math.min(pl.max, pl.y + 22 * dt)
        }
        pl.dx = nx - pl.x
        pl.dy = ny - pl.y
        pl.x = nx
        pl.y = ny
        if (!p.dead && p.onPlatform === pl) {
          if (pl.dx !== 0 && !this.boxHitsSolid(p.x + pl.dx, p.y, p.w, p.h)) p.x += pl.dx
          p.y = pl.y - p.h
        }
        continue
      }
      const before = pl.axis === 'x' ? pl.x : pl.y
      let next = before + pl.dir * pl.speed * dt
      if (next >= pl.max) {
        next = pl.max
        pl.dir = -1
      } else if (next <= pl.min) {
        next = pl.min
        pl.dir = 1
      }
      if (pl.axis === 'x') {
        pl.dx = next - pl.x
        pl.dy = 0
        pl.x = next
      } else {
        pl.dy = next - pl.y
        pl.dx = 0
        pl.y = next
      }
      if (!p.dead && p.onPlatform === pl) {
        // taşı: yatayda duvara çarpmasın
        if (pl.dx !== 0 && !this.boxHitsSolid(p.x + pl.dx, p.y, p.w, p.h)) p.x += pl.dx
        p.y = pl.y - p.h
      }
    }
  }

  /** ritim takımı şu an katı mı (saatten; aynalı haritada da aynı ritim) */
  rhythmOn(t: number): boolean {
    const phase = Math.floor(this.clock / RHYTHM.half) % 2
    return t === RHYTHM_A ? phase === 0 : phase === 1
  }

  /** ritim değişiminde oyuncunun (ve eşin) içindeki bloklar beklemeye alınır; çıkılan bloklar beklemeden düşer */
  private updateRhythm() {
    if (!this.hasRhythm) return
    const phase = Math.floor(this.clock / RHYTHM.half) % 2
    const bodies = [this.player, ...(this.partner ? [this.partner] : [])].filter((b) => !b.dead)
    const covered = new Set<number>()
    for (const b of bodies)
      for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 0.001) / T); ty++)
        for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.001) / T); tx++) {
          const t = this.tile(tx, ty)
          if (t === RHYTHM_A || t === RHYTHM_B) covered.add(ty * this.cols + tx)
        }
    if (phase !== this.rhythmLast) {
      if (this.rhythmLast >= 0) this.events.push({ type: 'beat' })
      this.rhythmLast = phase
      for (const k of covered) this.rhythmHold.add(k)
    }
    for (const k of [...this.rhythmHold]) if (!covered.has(k)) this.rhythmHold.delete(k)
  }

  private updateCrumbles(dt: number) {
    const p = this.player
    for (const [idx, c] of this.crumbles) {
      if (!c.broken) {
        c.t += dt
        if (c.t >= 0.42) {
          c.broken = true
          c.respawn = 2.6
          this.events.push({ type: 'crumble' })
        }
      } else {
        c.respawn -= dt
        if (c.respawn <= 0) {
          const tx = idx % this.cols
          const ty = Math.floor(idx / this.cols)
          const overlap = !p.dead && p.x < (tx + 1) * T && p.x + p.w > tx * T && p.y < (ty + 1) * T && p.y + p.h > ty * T
          if (!overlap) this.crumbles.delete(idx)
        }
      }
    }
  }

  private updatePlayer(dt: number, input: Input) {
    const p = this.player
    const wasGrounded = p.grounded

    // zamanlayıcılar
    p.coyote = p.grounded ? PHYS.coyote : Math.max(0, p.coyote - dt)
    p.buffer = input.jumpPressed ? PHYS.buffer : Math.max(0, p.buffer - dt)
    p.wallLock = Math.max(0, p.wallLock - dt)
    p.dropTimer = Math.max(0, p.dropTimer - dt)
    p.landTimer = Math.max(0, p.landTimer - dt)
    // nefes: baş derin suyun içindeyse azalır, dışındaysa hemen dolar
    if (this.tile(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + 2) / T)) === SWIM) {
      const before = p.air
      p.air -= dt
      // son üç saniyede her saniye bir uyarı: ses, titreşim ve kabarcık (render, Game)
      for (const left of [3, 2, 1]) if (before >= left && p.air < left) this.events.push({ type: 'breath', left })
      if (p.air <= 0) {
        p.air = 0
        this.events.push({ type: 'drown' })
        return this.kill()
      }
    } else p.air = AIR.max

    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (ix !== 0 && p.dashTime <= 0) p.facing = ix > 0 ? 1 : -1

    // halat ve teleferik: tutunurken yerçekimi yok, kendi hareketi var
    p.regrab = Math.max(0, p.regrab - dt)
    p.strokeCool = Math.max(0, p.strokeCool - dt)
    if (p.hang === 0 && p.regrab <= 0 && !p.grounded && p.dashTime <= 0) this.tryGrab()
    if (p.hang !== 0) {
      if (this.updateHang(dt, input, ix, iy)) return
    }

    // aşağıya basınca tek yönlü platformdan in (eski "aşağı + zıpla" da çalışır)
    const downPressed = input.down && !this.prevDown
    this.prevDown = input.down
    if ((downPressed || (input.down && input.jumpPressed)) && p.grounded && this.standingOnOneway()) {
      p.dropTimer = 0.22
      p.buffer = 0
      p.grounded = false
      p.onPlatform = null
      p.y += 1
    }

    // dash: art arda basışta kısa bekleme; beklemenin sonuna doğru basılan dash sırada bekler
    p.dashCool = Math.max(0, p.dashCool - dt)
    // yalnız dash hakkı varken ya da bekleme sırasında basılan sıraya girer (hakkı yokken basılan yere inince patlamaz)
    p.dashQueued = input.dashPressed && (p.canDash || p.dashCool > 0) ? PHYS.dashBuffer : Math.max(0, p.dashQueued - dt)
    if (p.dashQueued > 0 && p.canDash && p.dashTime <= 0 && p.dashCool <= 0) {
      p.dashQueued = 0
      p.dashCool = PHYS.dashCooldown
      let dx = ix
      let dy = iy
      if (dx === 0 && dy === 0) dx = p.facing
      // yerdeyken aşağı dash anlamsız: yataya çevir
      if (p.grounded && dy > 0) dy = 0
      if (dx === 0 && dy === 0) dx = p.facing
      const len = Math.hypot(dx, dy)
      p.dashDir = [dx / len, dy / len]
      p.dashTime = PHYS.dashTime
      p.canDash = false
      p.grounded = false
      p.onPlatform = null
      this.events.push({ type: 'dash' })
    }

    const wind = !this.level.wind ? 0 : this.level.storm ? this.level.wind * Math.sin(this.time * STORM.freq) : this.level.wind * (0.55 + 0.45 * Math.sin(this.time * 1.1))
    this.windNow = wind

    if (p.dashTime > 0) {
      p.dashTime -= dt
      p.vx = p.dashDir[0] * PHYS.dashSpeed
      p.vy = p.dashDir[1] * PHYS.dashSpeed
      if (p.dashTime <= 0) {
        p.vx = Math.sign(p.vx) * Math.min(Math.abs(p.vx), PHYS.run * (p.nitro > 0 ? NITRO.speed : 1.15))
        if (p.vy < 0) p.vy *= 0.45
      }
    } else {
      // yatay kontrol. Rüzgâr hedef hızı kaydırır (hıza eklenen ivme, hedefe kırpılınca siliniyordu): havada her zaman,
      // yerde yalnız yürürken; dururken itmez ki dar taşta kaydırmasın. Esinti güçlüyken atlayış belirgin uzar ya da kısalır
      p.swim = this.tile(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h / 2) / T)) === SWIM
      if (p.nitro > 0) p.nitro = Math.max(0, p.nitro - dt)
      const run = p.nitro > 0 ? PHYS.run * NITRO.speed : PHYS.run
      const target = p.swim ? ix * PHYS.swimRun : ix * run + wind * (p.grounded ? (ix !== 0 ? PHYS.windGround : 0) : PHYS.windAir)
      let accel: number
      if (p.grounded) {
        if (p.onIce) accel = ix !== 0 ? PHYS.accelIce : PHYS.decelIce
        else if (p.onWet) accel = ix !== 0 ? PHYS.accelWet : PHYS.decelWet
        else accel = ix !== 0 ? PHYS.accelGround : PHYS.decelGround
      } else accel = ix !== 0 ? PHYS.accelAir : PHYS.dragAir
      if (p.swim) accel = 520
      if (p.wallLock > 0) accel *= 0.25
      if (p.vx < target) p.vx = Math.min(target, p.vx + accel * dt)
      else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * dt)

      // yerçekimi (suda yavaş batar; dash suda da yenilenir)
      let g = p.swim ? PHYS.swimGravity : PHYS.gravity
      if (p.vy < 0 && !input.jump && !p.swim) g *= PHYS.lowJumpMul
      const moon = this.level.lowGravity && !p.swim
      if (moon) g *= MOON.gravity
      p.vy = Math.min(p.swim ? PHYS.swimSink : PHYS.fallMax * (moon ? MOON.fall : 1), p.vy + g * dt)
      if (p.swim) {
        p.canDash = true
        // kulaç: her zıplama basışı; başı yüzeye yakınsa sudan sıçrayarak çıkar
        if (p.buffer > 0 && p.strokeCool <= 0) {
          const head = this.tile(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y - 3) / T))
          p.vy = head === SWIM ? -PHYS.swimStroke : -PHYS.swimLeap
          p.buffer = 0
          p.strokeCool = PHYS.strokeCool
          this.events.push({ type: 'swim' })
        }
      }

      // duvar
      p.wallDir = 0
      if (!p.grounded) {
        if (this.boxHitsSolid(p.x - 1, p.y + 2, 1, p.h - 4)) p.wallDir = -1
        else if (this.boxHitsSolid(p.x + p.w, p.y + 2, 1, p.h - 4)) p.wallDir = 1
        if (p.wallDir !== 0 && ix === p.wallDir && p.vy > PHYS.wallSlideMax) p.vy = PHYS.wallSlideMax
      }

      // zıplama
      if (p.buffer > 0 && !p.swim) {
        if (p.grounded || p.coyote > 0) {
          p.vy = -PHYS.jumpV
          p.buffer = 0
          p.coyote = 0
          p.grounded = false
          if (p.onPlatform && p.onPlatform.dy < 0) p.vy += p.onPlatform.dy / dt * 0.5
          p.onPlatform = null
          this.events.push({ type: 'jump' })
        } else if (p.wallDir !== 0) {
          // duvara doğru basılıyken "tırmanma sekmesi": daha dik, aynı duvara geri döner
          const climb = ix === p.wallDir
          p.vx = -p.wallDir * (climb ? PHYS.wallJumpVX * 0.62 : PHYS.wallJumpVX)
          p.vy = -PHYS.wallJumpVY * (climb ? 1.04 : 1)
          p.facing = p.wallDir > 0 ? -1 : 1
          p.wallLock = climb ? PHYS.wallLock * 0.7 : PHYS.wallLock
          p.buffer = 0
          this.events.push({ type: 'walljump' })
        }
      }
    }

    // ── X hareketi
    this.moveX(p.vx * dt)
    // ── Y hareketi
    p.grounded = false
    p.onIce = false
    p.onWet = false
    const prevBottom = p.y + p.h
    this.moveY(p.vy * dt, prevBottom)

    if (p.grounded) {
      if (p.dashTime <= 0) p.canDash = true
      if (!wasGrounded) {
        p.landTimer = 0.12
        this.events.push({ type: 'land' })
      }
      this.touchCrumbles()
    }

    if (p.grounded && Math.abs(p.vx) > 5) p.runTime += dt
    else p.runTime = 0

    // harita sınırları
    if (p.x < 0) {
      p.x = 0
      p.vx = 0
    }
    if (p.x + p.w > this.cols * T) {
      p.x = this.cols * T - p.w
      p.vx = 0
    }
    if (p.y > this.rows * T + 24) this.kill()
  }

  /** Havadayken gövdenin değdiği halat ya da teleferik: tutunulur. Halatta oyuncu halatın ortasına çekilir. */
  private tryGrab() {
    const p = this.player
    const cx = Math.floor((p.x + p.w / 2) / T)
    const y0 = Math.floor((p.y + 2) / T)
    const y1 = Math.floor((p.y + p.h - 2) / T)
    for (let ty = y0; ty <= y1; ty++) {
      if (this.tile(cx, ty) !== ROPE) continue
      const nx = cx * T + (T - p.w) / 2
      if (this.boxHitsSolid(nx, p.y, p.w, p.h)) return
      p.x = nx
      p.hang = 1
      break
    }
    // teleferik: halat başın hizasında (gövdenin üst yarısı halat karosunda)
    if (!p.hang && p.vy > -120) {
      const ty = Math.floor((p.y + 1) / T)
      if (this.tile(cx, ty) === CABLE) {
        const ny = ty * T + 7
        if (!this.boxHitsSolid(p.x, ny, p.w, p.h)) {
          p.y = ny
          p.hang = 2
        }
      }
    }
    if (p.hang) {
      p.vx = 0
      p.vy = 0
      p.canDash = true
      p.dashQueued = 0
      p.wallDir = 0
      this.events.push({ type: 'grab' })
    }
  }

  /** Tutunurken hareket; serbest kaldıysa false döner (normal fizik sürer). */
  private updateHang(dt: number, input: Input, ix: number, iy: number): boolean {
    const p = this.player
    const cx = Math.floor((p.x + p.w / 2) / T)
    const release = (vy: number, vx: number) => {
      p.hang = 0
      p.regrab = PHYS.regrab
      p.vy = vy
      p.vx = vx
      p.buffer = 0
    }
    if (input.dashPressed) {
      // dash atınca bırakır, dash normal yoldan atılır
      p.hang = 0
      p.regrab = PHYS.regrab
      return false
    }
    if (p.hang === 1) {
      if (p.buffer > 0) {
        release(-PHYS.jumpV * 0.92, ix * PHYS.run)
        this.events.push({ type: 'jump' })
        return false
      }
      // tırmanma: halatın bittiği yerde durur; aşağıda halat biterse bırakır
      if (iy !== 0) {
        const ny = p.y + iy * PHYS.ropeClimb * dt
        const probe = iy < 0 ? Math.floor((ny + 3) / T) : Math.floor((ny + p.h - 2) / T)
        if (this.tile(cx, probe) === ROPE && !this.boxHitsSolid(p.x, ny, p.w, p.h)) p.y = ny
        else if (iy > 0) {
          release(0, 0)
          return false
        }
      }
    } else {
      // teleferikten bırakınca düz aşağı inilir (yukarı sıçrayan, düşerken aynı teli yeniden yakalardı)
      if (p.buffer > 0 || (input.down && iy > 0)) {
        release(0, ix * PHYS.run * 0.6)
        p.regrab = 0.35
        return false
      }
      if (ix !== 0) {
        p.facing = ix > 0 ? 1 : -1
        const nx = p.x + ix * PHYS.cableMove * dt
        const ncx = Math.floor((nx + p.w / 2) / T)
        const ty = Math.floor((p.y - 7 + 1) / T)
        if (this.tile(ncx, ty) === CABLE && !this.boxHitsSolid(nx, p.y, p.w, p.h)) p.x = nx
      }
    }
    p.vx = 0
    p.vy = 0
    p.grounded = false
    p.coyote = 0
    p.runTime = 0
    return true
  }

  private standingOnOneway(): boolean {
    const p = this.player
    if (p.onPlatform) return true
    const ty = Math.floor((p.y + p.h + 1) / T)
    const x0 = Math.floor(p.x / T)
    const x1 = Math.floor((p.x + p.w - 0.001) / T)
    let any = false
    for (let tx = x0; tx <= x1; tx++) {
      if (this.isSolid(tx, ty)) return false
      if (this.tile(tx, ty) === ONEWAY) any = true
    }
    return any
  }

  private moveX(dx: number) {
    const p = this.player
    if (dx === 0) return
    let nx = p.x + dx
    // taşın yan yüzüne, üst kenarına az kala çarptıysan üstüne çık (yerde yürürken tetiklenmez: taş 16 px)
    if (this.boxHitsSolid(nx, p.y, p.w, p.h)) {
      for (let k = 1; k <= PHYS.stepUp; k++)
        if (!this.boxHitsSolid(nx, p.y - k, p.w, p.h) && !this.boxHitsSolid(p.x, p.y - k, p.w, p.h)) {
          p.y -= k
          if (p.vy > 0) p.vy = 0
          break
        }
    }
    if (this.boxHitsSolid(nx, p.y, p.w, p.h)) {
      if (dx > 0) nx = Math.floor((nx + p.w) / T) * T - p.w
      else nx = Math.floor(nx / T) * T + T
      // güvenlik: hâlâ çakışıyorsa eski konum
      if (this.boxHitsSolid(nx, p.y, p.w, p.h)) nx = p.x
      if (p.dashTime > 0 && p.dashDir[1] === 0) p.dashTime = 0
      p.vx = 0
    }
    // sandık: yandan çarpınca itilir; itilemiyorsa duvar gibi durdurur
    for (const c of this.crates) {
      if (c.vy !== 0 || c.sunk > 0) continue
      if (nx < c.x + c.w && nx + p.w > c.x && p.y < c.y + c.h && p.y + p.h > c.y + 0.5) {
        const dir = dx > 0 ? 1 : -1
        // oyuncu sandığın öbür yanından içine girmediyse (üstünden kayıp düşme hariç) it
        const want = dir > 0 ? nx + p.w - c.x : nx - (c.x + c.w)
        const step = Math.sign(want) * Math.min(Math.abs(want), PHYS.push * (1 / 120))
        const cx = c.x + step
        const free = !this.boxHitsSolid(cx, c.y, c.w, c.h) && !this.crates.some((o) => o !== c && o.sunk <= 0 && cx < o.x + o.w && cx + c.w > o.x && c.y < o.y + o.h && c.y + c.h > o.y) && cx >= 0 && cx + c.w <= this.cols * T
        if (free && p.dashTime <= 0) c.x = cx
        nx = dir > 0 ? c.x - p.w : c.x + c.w
        if (p.dashTime > 0 && p.dashDir[1] === 0) p.dashTime = 0
        p.vx = free ? dir * PHYS.push : 0
      }
    }
    p.x = nx
  }

  /** Sandıklar: altı boşsa düşer; katı zemine, tek yönlü platforma ya da başka sandığa oturur; suya ya da boşluğa düşen yerine döner. */
  private updateCrates(dt: number) {
    for (const c of this.crates) {
      if (c.sunk > 0) {
        c.sunk -= dt
        if (c.sunk <= 0) {
          c.x = c.ox
          c.y = c.oy
          c.vy = 0
        }
        continue
      }
      // ağırlık merkezinin altı boşsa düşer: bir karoluk boşluğa da tam oturur (sütuna hizalanır)
      const ctx = Math.floor((c.x + c.w / 2) / T)
      const below = Math.floor((c.y + c.h + 0.001) / T)
      const ground = (tx: number, ty: number) => this.isSolid(tx, ty) || this.tile(tx, ty) === ONEWAY
      const onCrate = (y: number) => this.crates.find((o) => o !== c && o.sunk <= 0 && o.vy === 0 && Math.abs(o.x - c.x) < c.w / 2 && Math.abs(o.y - y) < 0.5)
      if (c.vy === 0 && (ground(ctx, below) || onCrate(c.y + c.h))) continue
      if (c.vy === 0) c.x = ctx * T
      c.vy = Math.min(PHYS.fallMax, c.vy + PHYS.gravity * dt)
      let ny = c.y + c.vy * dt
      const row = Math.floor((ny + c.h) / T)
      let land: number | null = null
      if (ground(ctx, row) && c.y + c.h <= row * T + 0.5) land = row * T - c.h
      for (const o of this.crates) if (o !== c && o.sunk <= 0 && o.vy === 0 && Math.abs(o.x - c.x) < c.w / 2 && c.y + c.h <= o.y + 0.5 && ny + c.h >= o.y) land = o.y - c.h
      if (land !== null && ny >= land) {
        ny = land
        c.vy = 0
        this.events.push({ type: 'land' })
      }
      c.y = ny
      // su ya da harita dışı: kaybolur, biraz sonra yerinde belirir
      const mid = this.tile(Math.floor((c.x + c.w / 2) / T), Math.floor((c.y + c.h / 2) / T))
      if (mid === WATER || mid === SWIM || c.y > this.rows * T + 16) {
        c.sunk = 1.4
        c.vy = 0
      }
    }
  }

  /** Verilen x için iniş noktası (katı zemin, tek yönlü tile, hareketli platform) */
  private landingAt(x: number, ny: number, prevBottom: number): { y: number; plat: Platform | null } | null {
    const p = this.player
    const bottom = ny + p.h
    let landY: number | null = null
    let landPlat: Platform | null = null
    if (this.boxHitsSolid(x, ny, p.w, p.h)) {
      const cand = Math.floor(bottom / T) * T - p.h
      // yalnızca tepesine düşülen zemin sayılır (yandan çarpma iniş değildir)
      if (cand + p.h >= prevBottom - 0.5 && !this.boxHitsSolid(x, cand, p.w, p.h)) landY = cand
      else if (x === p.x) landY = this.boxHitsSolid(x, cand, p.w, p.h) ? p.y : cand
    }
    if (p.dropTimer <= 0) {
      const x0 = Math.floor(x / T)
      const x1 = Math.floor((x + p.w - 0.001) / T)
      const tyB = Math.floor((bottom - 0.001) / T)
      for (let tx = x0; tx <= x1; tx++) {
        if (this.tile(tx, tyB) === ONEWAY) {
          const top = tyB * T
          if (prevBottom <= top + 0.5 && bottom >= top) {
            const cand = top - p.h
            if (landY === null || cand < landY) landY = cand
          }
        }
      }
      for (const c of this.crates) {
        if (c.vy !== 0 || c.sunk > 0 || x + p.w <= c.x || x >= c.x + c.w) continue
        if (prevBottom <= c.y + 0.5 && bottom >= c.y) {
          const cand = c.y - p.h
          if (landY === null || cand < landY) {
            landY = cand
            landPlat = null
          }
        }
      }
      for (const pl of this.platforms) {
        if (x + p.w <= pl.x || x >= pl.x + pl.w) continue
        const top = pl.y
        if (prevBottom <= top + Math.max(1, Math.abs(pl.dy) + 1) && bottom >= top) {
          const cand = top - p.h
          if (landY === null || cand <= landY) {
            landY = cand
            landPlat = pl
          }
        }
      }
    }
    return landY === null ? null : { y: landY, plat: landPlat }
  }

  private moveY(dy: number, prevBottom: number) {
    const p = this.player
    let ny = p.y + dy
    if (dy < 0) {
      // sandığın altına kafa atılmaz
      for (const c of this.crates) {
        if (c.vy === 0 && c.sunk <= 0 && p.x < c.x + c.w && p.x + p.w > c.x && p.y >= c.y + c.h - 0.5 && ny < c.y + c.h) {
          ny = c.y + c.h
          p.vy = 0
          if (p.dashTime > 0) p.dashTime = 0
        }
      }
      if (this.boxHitsSolid(p.x, ny, p.w, p.h)) {
        // köşe düzeltmesi: kafa yalnızca tavanın köşesine değiyorsa yana kay, yükselmeye devam et
        let slid = false
        for (let n = 1; n <= PHYS.cornerAssist && !slid; n++) {
          for (const dir of [1, -1]) {
            if (!this.boxHitsSolid(p.x + dir * n, ny, p.w, p.h) && !this.boxHitsSolid(p.x + dir * n, p.y, p.w, p.h)) {
              p.x += dir * n
              slid = true
              break
            }
          }
        }
        if (!slid) {
          ny = Math.floor(ny / T) * T + T
          if (this.boxHitsSolid(p.x, ny, p.w, p.h)) ny = p.y
          p.vy = 0
          if (p.dashTime > 0) p.dashTime = 0
        }
      }
      p.y = ny
      p.onPlatform = null
      return
    }

    let hit = this.landingAt(p.x, ny, prevBottom)
    // kenar yardımı: düşerken zemini birkaç piksel ıskaladıysan üstüne al
    // yalnızca belirgin düşüşte ve gidilen yöne doğru: kenardan bilerek inen geri çekilmez
    if (!hit && p.vy > 60 && p.dashTime <= 0) {
      const dir = Math.abs(p.vx) > 5 ? Math.sign(p.vx) : p.facing
      for (let n = 1; n <= PHYS.ledgeAssist; n++) {
        const nx = p.x + dir * n
        if (this.boxHitsSolid(nx, p.y, p.w, p.h)) break
        const h = this.landingAt(nx, ny, prevBottom)
        if (h) {
          p.x = nx
          hit = h
          break
        }
      }
    }

    if (hit) {
      p.y = hit.y
      p.vy = 0
      p.grounded = true
      p.onPlatform = hit.plat
      if (p.dashTime > 0 && p.dashDir[1] > 0) p.dashTime = 0
      if (!hit.plat) {
        const ty = Math.floor((p.y + p.h + 1) / T)
        const cx = Math.floor((p.x + p.w / 2) / T)
        p.onIce = this.tile(cx, ty) === ICE || !!this.level.slippery
        p.onWet = this.tile(cx, ty) === WET
      }
    } else {
      p.y = ny
      p.onPlatform = null
    }
  }

  private touchCrumbles() {
    const p = this.player
    if (p.onPlatform) return
    const ty = Math.floor((p.y + p.h + 1) / T)
    const x0 = Math.floor(p.x / T)
    const x1 = Math.floor((p.x + p.w - 0.001) / T)
    for (let tx = x0; tx <= x1; tx++) {
      if (this.tile(tx, ty) === CRUMBLE) {
        const idx = ty * this.cols + tx
        if (!this.crumbles.has(idx)) this.crumbles.set(idx, { t: 0, broken: false, respawn: 0 })
      }
    }
  }

  private groundAhead(x: number, y: number, h: number) {
    const ty = Math.floor((y + h + 2) / T)
    const tx = Math.floor(x / T)
    return this.isSolid(tx, ty) || this.tile(tx, ty) === ONEWAY
  }

  private updateEnemies(dt: number) {
    const p = this.player
    for (const e of this.enemies) {
      if (!e.alive) continue
      e.phase += dt
      switch (e.kind) {
        case 'ground':
        case 'spiky': {
          const speed = e.kind === 'spiky' ? 20 : 30
          const nx = e.x + e.dir * speed * dt
          const frontX = e.dir > 0 ? nx + e.w : nx
          const midTy = Math.floor((e.y + e.h / 2) / T)
          const ftx = Math.floor(frontX / T)
          const wall = this.isSolid(ftx, midTy) || this.tile(ftx, midTy) === SPIKE_UP
          if (wall || !this.groundAhead(frontX, e.y, e.h)) e.dir = e.dir > 0 ? -1 : 1
          else e.x = nx
          break
        }
        case 'fly': {
          const nx = e.x + e.dir * 38 * dt
          const frontX = e.dir > 0 ? nx + e.w : nx
          const blocked = this.isSolid(Math.floor(frontX / T), Math.floor((e.y + e.h / 2) / T))
          if (blocked || Math.abs(nx - e.ox) > T * 4) e.dir = e.dir > 0 ? -1 : 1
          else e.x = nx
          e.y = e.oy + Math.sin(e.phase * 3) * 5
          break
        }
        case 'shark': {
          // Esoli: devriye (suyun içinde kalır) → yüzen oyuncu önünde ve aynı derinlikteyse uyarı (titreme) → hamle → soluklanma
          const inWater = (x: number) => this.tile(Math.floor(x / T), Math.floor((e.y + e.h / 2) / T)) === SWIM
          const dx = p.x + p.w / 2 - (e.x + e.w / 2)
          const dy = p.y + p.h / 2 - (e.y + e.h / 2)
          if (e.state === 'idle') {
            const nx = e.x + e.dir * 34 * dt
            if (!inWater(e.dir > 0 ? nx + e.w : nx)) e.dir = e.dir > 0 ? -1 : 1
            else e.x = nx
            e.y = e.oy + Math.sin(e.phase * 1.6) * 2
            e.timer -= dt
            if (!p.dead && p.swim && e.timer <= 0 && Math.abs(dx) < T * 6 && Math.abs(dy) < T * 1.5) {
              e.state = 'windup'
              e.timer = 0.7
              e.dir = dx > 0 ? 1 : -1
            }
          } else if (e.state === 'windup') {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'charge'
              e.timer = 1
            }
          } else if (e.state === 'charge') {
            const nx = e.x + e.dir * 120 * dt
            e.timer -= dt
            if (!inWater(e.dir > 0 ? nx + e.w : nx) || e.timer <= 0) {
              e.state = 'stun'
              e.timer = 1.2
            } else e.x = nx
          } else {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'idle'
              e.timer = 1.2
            }
          }
          break
        }
        case 'piranha': {
          // kısa mesafede çevik gidip gelir (2,5 karo), hafif dalgalanır; suyun dışına çıkmaz
          const nx = e.ox + Math.sin(e.phase * 2.4) * T * 2.5
          if (this.tile(Math.floor((nx + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T)) === SWIM) {
            e.dir = nx > e.x ? 1 : -1
            e.x = nx
          }
          e.y = e.oy + Math.sin(e.phase * 5) * 2
          break
        }
        case 'bat': {
          // dikey dalga + yavaş yatay sürüklenme
          e.y = e.oy + Math.sin(e.phase * 2.2) * T * 1.6
          const nx = e.ox + Math.sin(e.phase * 0.7) * T * 1.5
          e.dir = nx > e.x ? 1 : -1
          e.x = nx
          break
        }
        case 'magpie': {
          // tünek → kanat çırpıp uyarır → kavis çizerek dalar, 6 karo ötedeki yeni tüneğe konar → dinlenir
          const D = T * 6
          if (e.state === 'idle') {
            e.y = e.oy + Math.round(Math.sin(e.phase * 2) * 0.6)
            e.timer -= dt
            const dx = p.x + p.w / 2 - (e.x + e.w / 2)
            if (!p.dead && e.timer <= 0 && Math.abs(dx) < T * 5 && p.y > e.y + T) {
              e.state = 'windup'
              e.timer = 0.5
              e.dir = dx > 0 ? 1 : -1
              // dalış derinliği oyuncunun yüksekliğine göre, 2–6 karo
              e.vy = Math.max(T * 2, Math.min(T * 6, p.y + p.h / 2 - e.oy))
            }
          } else if (e.state === 'windup') {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'charge'
              e.timer = 0
            }
          } else if (e.state === 'charge') {
            e.timer += dt / 1.1
            const k = Math.min(1, e.timer)
            e.x = e.ox + e.dir * D * k
            e.y = e.oy + e.vy * 4 * k * (1 - k)
            if (k >= 1) {
              e.ox = e.x
              e.state = 'stun'
              e.timer = 1.4
            }
          } else {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'idle'
              e.timer = 0.6
            }
          }
          break
        }
        case 'hopper': {
          // çömel (uyarı) → oyuncuya doğru sıçra → kon
          if (e.state === 'air') {
            e.vy = Math.min(PHYS.fallMax, e.vy + PHYS.gravity * dt)
            const nx = e.x + e.vx * dt
            if (!this.boxHitsSolid(nx, e.y, e.w, e.h)) e.x = nx
            else e.vx = 0
            const ny = e.y + e.vy * dt
            if (e.vy > 0 && this.boxHitsSolid(e.x, ny, e.w, e.h)) {
              e.y = Math.floor((ny + e.h) / T) * T - e.h
              e.vy = 0
              e.state = 'idle'
              e.timer = 1.1
            } else if (e.vy < 0 && this.boxHitsSolid(e.x, ny, e.w, e.h)) e.vy = 0
            else e.y = ny
            if (e.y > this.rows * T + 32) {
              e.alive = false
            }
          } else if (e.state === 'windup') {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'air'
              e.vy = -290
              e.dir = p.x + p.w / 2 > e.x + e.w / 2 ? 1 : -1
              e.vx = e.dir * 55
            }
          } else {
            e.timer -= dt
            if (e.timer <= 0 && Math.abs(p.x - e.x) < T * 9) {
              e.state = 'windup'
              e.timer = 0.4
            }
          }
          break
        }
        case 'charger': {
          // devriye → oyuncuyu görünce ünlem → hücum → duvara çarpınca sersem
          const sameRow = Math.abs(p.y + p.h - (e.y + e.h)) < 20
          const ahead = (p.x - e.x) * e.dir > 0 && Math.abs(p.x - e.x) < T * 7
          if (e.state === 'idle') {
            const nx = e.x + e.dir * 22 * dt
            const frontX = e.dir > 0 ? nx + e.w : nx
            const ftx = Math.floor(frontX / T)
            const midTy = Math.floor((e.y + e.h / 2) / T)
            if (this.isSolid(ftx, midTy) || !this.groundAhead(frontX, e.y, e.h)) e.dir = e.dir > 0 ? -1 : 1
            else e.x = nx
            if (!p.dead && sameRow && ahead) {
              e.state = 'windup'
              e.timer = 0.5
            }
          } else if (e.state === 'windup') {
            e.timer -= dt
            if (e.timer <= 0) e.state = 'charge'
          } else if (e.state === 'charge') {
            const nx = e.x + e.dir * 165 * dt
            const frontX = e.dir > 0 ? nx + e.w : nx
            const ftx = Math.floor(frontX / T)
            const midTy = Math.floor((e.y + e.h / 2) / T)
            if (this.isSolid(ftx, midTy) || !this.groundAhead(frontX, e.y, e.h)) {
              e.state = 'stun'
              e.timer = 0.9
              this.events.push({ type: 'stomp', x: e.x + e.w / 2, y: e.y + e.h / 2 })
            } else e.x = nx
          } else if (e.state === 'stun') {
            e.timer -= dt
            if (e.timer <= 0) {
              e.state = 'idle'
              e.dir = e.dir > 0 ? -1 : 1
            }
          }
          break
        }
      }
    }
  }

  private updateObjects(dt: number) {
    const p = this.player
    for (const c of this.crystals) {
      if (!c.active) {
        c.timer -= dt
        if (c.timer <= 0) c.active = true
      } else if (!p.dead && !p.canDash && overlap(reach(p), c)) {
        c.active = false
        c.timer = CRYSTAL_RECHARGE
        p.canDash = true
        // halka dash zincirinin parçası: bekletmez
        p.dashCool = 0
        this.events.push({ type: 'crystal' })
      }
    }
    for (const n of this.nitros) {
      if (!n.active) {
        n.timer -= dt
        if (n.timer <= 0) n.active = true
      } else if (!p.dead && overlap(reach(p), n)) {
        n.active = false
        n.timer = NITRO.recharge
        p.nitro = NITRO.time
        this.events.push({ type: 'nitro' })
      }
    }
    if (this.keyBox && !this.hasKey && !p.dead && overlap(reach(p), this.keyBox)) {
      this.hasKey = true
      this.events.push({ type: 'key' })
    }
    if (this.stampBox && !this.stampTaken && !p.dead && overlap(reach(p), this.stampBox)) {
      this.stampTaken = true
      this.events.push({ type: 'stamp' })
    }
    if (this.charmBox && !this.charmTaken && !p.dead && overlap(reach(p), this.charmBox)) {
      this.charmTaken = true
      this.events.push({ type: 'charm' })
    }
    for (const pl of this.plates) {
      const on = !p.dead && p.grounded && overlap({ x: p.x, y: p.y + 2, w: p.w, h: p.h }, pl)
      if (on && !pl.pressed) {
        // blokları değiştir: oyuncunun içine katı blok gelmesin
        this.switchOn = !this.switchOn
        if (this.boxHitsSolid(p.x, p.y, p.w, p.h)) this.switchOn = !this.switchOn
        else this.events.push({ type: 'switch' })
      }
      pl.pressed = on
    }
  }

  private updateTurrets(dt: number) {
    for (const t of this.turrets) {
      t.timer -= dt
      if (t.timer <= 0) {
        t.timer = 2.1
        const x = t.dir > 0 ? (t.tx + 1) * T : t.tx * T - 6
        this.projectiles.push({ x, y: t.ty * T + 6, w: 6, h: 4, vx: t.dir * 92 })
        this.events.push({ type: 'shoot' })
      }
    }
    this.projectiles = this.projectiles.filter((pr) => {
      pr.x += pr.vx * dt
      if (pr.g !== undefined) {
        pr.vy = (pr.vy ?? 0) + pr.g * dt
        pr.y += pr.vy * dt
      }
      const cx = Math.floor((pr.x + pr.w / 2) / T)
      const cy = Math.floor((pr.y + pr.h / 2) / T)
      if (cx < 0 || cx >= this.cols) return false
      return !this.isSolid(cx, cy)
    })
  }

  private interactions() {
    const p = this.player
    if (p.dead) return

    // dikenler + su (küçültülmüş kutu)
    const hx = p.x + 2
    const hw = p.w - 4
    const x0 = Math.floor(hx / T)
    const x1 = Math.floor((hx + hw - 0.001) / T)
    const y0 = Math.floor((p.y + 2) / T)
    const y1 = Math.floor((p.y + p.h - 0.001) / T)
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.tile(tx, ty)
        if (t === SPIKE_UP) {
          if (p.y + p.h > ty * T + 9 && p.vy >= 0) return this.kill()
        } else if (t === SPIKE_DOWN) {
          if (p.y < ty * T + 7) return this.kill()
        } else if (t === WATER) {
          if (p.y + p.h > ty * T + 6) return this.kill()
        }
      }
    }

    // bakırcı tokmakları: inerken ya da yerdeyken başın altında kalan ezilir
    for (const h of this.hammers) {
      const st = hammerState(h, this.clock)
      if (st.phase < 2) continue
      const head = { x: h.x + 1, y: st.y + 2, w: T - 2, h: T - 2 }
      if (overlap(shrink(p, 2), head)) return this.kill()
    }

    // dost hayvanlar: dokununca sevinir
    for (const f of this.friends) {
      f.cool = Math.max(0, f.cool - 1 / 120)
      if (f.cool === 0 && overlap(p, f)) {
        f.cool = 2.5
        this.events.push({ type: 'pet', x: f.x + 10, y: f.y })
      }
    }

    // yaylar
    for (const s of this.springs) {
      s.squash = Math.max(0, s.squash - 1 / 60)
      if (p.vy >= 0 && overlap(p, s) && p.y + p.h - p.vy / 60 <= s.y + 4) {
        // tam zamanında: inerken zıplama basılıysa (tampon) daha güçlü seker
        const perfect = p.buffer > 0
        p.vy = -PHYS.springV * (perfect ? PERFECT_SPRING : 1)
        if (perfect) {
          p.buffer = 0
          this.events.push({ type: 'perfect' })
        }
        p.y = s.y - p.h
        p.canDash = true
        p.dashTime = 0
        p.grounded = false
        p.onPlatform = null
        s.squash = 0.2
        this.events.push({ type: 'spring' })
      }
    }

    // düşmanlar
    for (const e of this.enemies) {
      if (!e.alive || !overlap(shrink(p, 1), e)) continue
      // basma: oyuncu üstten geldiyse (önceki adımda ayaklar düşmanın tepesinin üstündeydi) sayılır. Uçan düşman
      // inip kalkarken ya da zıplamanın tepesinde (hız ~0) de geçerli; alttan zıplayıp çarpan ölür
      const fromAbove = this.prevFeet <= (e.py ?? e.y) + 4 && p.vy > -150
      const stomp = fromAbove || (p.vy > 0 && p.y + p.h - e.y < 10)
      // Esoli ezilmez (kaçılır); diken sırtlı da öyle
      if (e.kind !== 'spiky' && e.kind !== 'shark' && (stomp || p.dashTime > 0)) {
        e.alive = false
        p.vy = -PHYS.stompV
        p.canDash = true
        if (p.dashTime > 0) p.dashTime = 0
        this.events.push({ type: 'stomp', x: e.x + e.w / 2, y: e.y + e.h / 2 })
      } else return this.kill()
    }

    for (const pr of this.projectiles) if (overlap(shrink(p, 2), pr)) return this.kill()

    for (const b of [this.boss, this.boss2]) {
      if (!b) continue
      const r = touchBoss(b, this)
      if (r === 'kill') return this.kill()
      if (r === 'hit') {
        p.vy = -PHYS.stompV
        p.canDash = true
        p.dashTime = 0
        p.grounded = false
        // mermiler yalnız arenada ayakta boss kalmayınca silinir
        if ((!this.boss || this.boss.state === 'down') && (!this.boss2 || this.boss2.state === 'down')) this.projectiles = []
        break
      }
    }

    // meydan kapısı: finale geç (tek yön)
    if (this.warp && this.arrival && overlap(p, this.warp)) {
      Object.assign(p, this.freshPlayer(this.arrival.x, this.arrival.y))
      this.spawn = { ...this.arrival }
      this.resetChaser()
      // final kendi düğme düzeniyle başlar: önceki bölümden kalan durum bulmacayı bozmasın
      this.switchOn = false
      this.cpSwitch = false
      this.events.push({ type: 'warp' })
      return
    }

    for (const c of this.pickups) {
      if (!c.taken && overlap(reach(p), c)) {
        c.taken = true
        this.events.push({ type: 'collect', index: c.index })
      }
    }

    for (const cp of this.checkpoints) {
      if (!cp.active && overlap(reach(p), cp)) {
        cp.active = true
        for (const o of this.checkpoints) if (o.index < cp.index) o.active = true
        this.checkpointIndex = cp.index
        this.spawn = { x: cp.x + (T - PW) / 2, y: cp.y + T * 2 - PH }
        this.cpSwitch = this.switchOn
        this.events.push({ type: 'checkpoint', index: cp.index })
      }
    }

    this.nearSign = -1
    for (const s of this.signs) {
      if (Math.abs(p.x + p.w / 2 - (s.x + T / 2)) < 22 && Math.abs(p.y + p.h - (s.y + T)) < 24) this.nearSign = s.index
    }

    this.nearNpc = -1
    for (const n of this.npcs) {
      if (Math.abs(p.x + p.w / 2 - (n.x + T / 2)) < 28 && Math.abs(p.y + p.h - (n.y + T)) < 28) this.nearNpc = n.index
    }

    if (overlap(p, this.exit)) {
      this.complete = true
      this.events.push({ type: 'complete' })
    }
  }

  kill() {
    const p = this.player
    if (p.dead || this.complete) return
    p.dead = true
    p.deadTimer = 0.7
    this.deaths++
    this.events.push({ type: 'death', x: p.x + p.w / 2, y: p.y + p.h / 2 })
  }

  /** Co-op'u açar: eş başlangıçta, oyuncunun hemen yanında */
  enableCoop() {
    this.partner = this.freshPlayer(this.player.x + 10, this.player.y)
  }

  /** Eşi oyuncunun yanına taşır (geride kaldıysa, düştüyse ya da meydan kapısından geçildiyse) */
  bringPartner(to: Player = this.player) {
    const q = this.partner
    if (!q) return
    const keep = { dead: false, deadTimer: 0 }
    Object.assign(q, this.freshPlayer(to.x + (this.boxHitsSolid(to.x - 10, to.y, PW, PH) ? 0 : -10), to.y), keep)
  }

  /**
   * Eşin adımı: dünyanın ortak adımından (step) sonra çağrılır. Oyuncu kaydı geçici olarak eşe çevrilir; böylece
   * hareket, çarpışma, toplama, tehlike, bayrak, boss'a basma ve çıkış kodu iki oyuncu için de aynıdır.
   */
  stepPartner(dt: number, input: Input) {
    const q = this.partner
    if (!q || this.complete) return
    // hareketli platform eşi de taşır (updatePlatforms yalnız oyuncuyu taşır)
    const pl = q.onPlatform
    if (pl && !q.dead) {
      if (pl.dx !== 0 && !this.boxHitsSolid(q.x + pl.dx, q.y, q.w, q.h)) q.x += pl.dx
      q.y = pl.y - q.h
    }
    if (q.dead) {
      q.deadTimer -= dt
      // eş düşünce de ikisi birden son bayraktan doğar: bölüm kurulur, eş oyuncunun yanına gelir.
      // oyuncu da düşmüşse onun doğuşu ('respawn' olayı) eşi getirir
      if (q.deadTimer <= 0 && !this.player.dead) {
        this.respawn()
        this.bringPartner()
      }
      return
    }
    const self = this as unknown as { player: Player }
    const p1 = this.player
    const down = this.prevDown
    const feet = this.prevFeet
    self.player = q
    this.prevDown = this.partnerPrevDown
    this.prevFeet = q.y + q.h
    try {
      this.updatePlayer(dt, input)
      if (!q.dead) this.interactions()
    } finally {
      this.partnerPrevDown = this.prevDown
      self.player = p1
      this.prevDown = down
      this.prevFeet = feet
    }
    if (!this.player.dead && !q.dead) {
      this.shoulder(this.player, q, dt)
      this.shoulder(q, this.player, dt)
    }
  }

  /**
   * Omuz sekmesi (co-op): inerken eşin başına basan seker. Zıplama basılıysa (tampon) tek başına varılamayan yüksekliğe
   * çıkar (~3,5 karo), basılı değilse yana kısa bir hop: kimse ötekinin başında takılı kalmaz. Dash yenilenir.
   */
  private shoulder(top: Player, base: Player, dt: number) {
    if (top.vy <= 0 || top.hang || top.swim || base.swim) return
    const feet = top.y + top.h
    const prevFeet = feet - top.vy * dt
    if (Math.abs(top.x + top.w / 2 - (base.x + base.w / 2)) > (top.w + base.w) / 2 - 2) return
    if (prevFeet > base.y + 3 || feet < base.y) return
    const strong = top.buffer > 0
    top.y = base.y - top.h
    top.vy = -PHYS.jumpV * (strong ? SHOULDER_BOOST : 0.5)
    // zıplamadan inen yana kayar: başın üstünde durmadan sekip durmaz
    if (!strong) top.vx = (Math.sign(top.x - base.x) || top.facing) * 70
    top.buffer = 0
    top.grounded = false
    top.onPlatform = null
    top.coyote = 0
    top.canDash = true
    top.dashTime = 0
    this.events.push({ type: 'shoulder', x: top.x + top.w / 2, y: base.y, partner: top === this.partner })
  }

  respawn() {
    Object.assign(this.player, this.freshPlayer(this.spawn.x, this.spawn.y))
    this.resetChaser()
    // düğmeler bayrağı aldığın andaki haline döner: açtığın köprü kapanmaz, kapattığın açık kalmaz
    this.switchOn = this.cpSwitch
    for (const pl of this.plates) pl.pressed = false
    if (this.boss && this.boss.state !== 'down') resetBoss(this.boss)
    if (this.boss2 && this.boss2.state !== 'down') resetBoss(this.boss2)
    for (const e of this.enemies) {
      e.alive = true
      e.x = e.ox
      e.y = e.oy
      e.dir = -1
      e.vx = 0
      e.vy = 0
      e.state = 'idle'
      e.timer = 1
    }
    for (const c of [...this.crystals, ...this.nitros]) {
      c.active = true
      c.timer = 0
    }
    for (const pl of this.platforms) if (pl.axis === 'b') pl.y = pl.max
    for (const c of this.crates) Object.assign(c, { x: c.ox, y: c.oy, vy: 0, sunk: 0 })
    this.projectiles = []
    this.crumbles.clear()
    for (const t of this.turrets) t.timer = 0.9 + ((t.tx * 7 + t.ty * 3) % 10) / 10
    this.events.push({ type: 'respawn' })
  }

  /** Pause menüsündeki "Bayraktan dön" */
  retryFromCheckpoint() {
    const p = this.player
    if (this.complete) return
    if (!p.dead) {
      this.deaths++
      p.dead = true
    }
    p.deadTimer = 0
    this.respawn()
  }
}

/**
 * Toplama kutusu: karakter ekranda çarpışma kutusunun iki katına yakın boyda çizilir (render.ts HERO_SIZE 29, kutu 14).
 * Toplanan şeyler (hatıra, pul, nazar, anahtar, dash halkası, bayrak) çizilen gövdeye değince alınır; fizik ve tehlikeler
 * dar kutuyla kalır. Böylece omuz hizasındaki hatıra yürüyerek alınır, ancak bir kademe yukarıdaki için zıplanır.
 */
const REACH_H = 26
function reach(p: Box): Box {
  return { x: p.x - 1, y: p.y + p.h - REACH_H, w: p.w + 2, h: REACH_H }
}

function overlap(a: Box, b: Box) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function shrink(b: Box, n: number): Box {
  return { x: b.x + n, y: b.y + n, w: b.w - n * 2, h: b.h - n * 2 }
}

/* ── Anlık görüntü (çözücü ve testler için) ─────────────────── */
export interface Snapshot {
  player: Omit<Player, 'onPlatform'> & { onPlatform: number }
  platforms: Array<Pick<Platform, 'x' | 'y' | 'dir' | 'dx' | 'dy'>>
  crumbles: Array<[number, CrumbleState]>
  time: number
  complete: boolean
  deaths: number
  spawn: { x: number; y: number }
  checkpointIndex: number
  cps: boolean[]
  picks: boolean[]
  hasKey: boolean
  switchOn: boolean
  stampTaken: boolean
  charmTaken: boolean
  crystals: Array<[boolean, number]>
  nitros: Array<[boolean, number]>
  clock: number
  cpSwitch: boolean
  crates: Array<[number, number, number, number]>
  boss: Boss | null
  boss2: Boss | null
  projectiles: Projectile[]
}

export function snapshot(w: World): Snapshot {
  const { onPlatform, ...rest } = w.player
  return {
    player: { ...rest, dashDir: [...rest.dashDir] as [number, number], onPlatform: onPlatform ? w.platforms.indexOf(onPlatform) : -1 },
    platforms: w.platforms.map((p) => ({ x: p.x, y: p.y, dir: p.dir, dx: p.dx, dy: p.dy })),
    crumbles: [...w.crumbles].map(([k, v]) => [k, { ...v }]),
    time: w.time,
    complete: w.complete,
    deaths: w.deaths,
    spawn: { ...w.spawn },
    checkpointIndex: w.checkpointIndex,
    cps: w.checkpoints.map((c) => c.active),
    picks: w.pickups.map((c) => c.taken),
    hasKey: w.hasKey,
    switchOn: w.switchOn,
    stampTaken: w.stampTaken,
    charmTaken: w.charmTaken,
    crystals: w.crystals.map((c) => [c.active, c.timer]),
    nitros: w.nitros.map((c) => [c.active, c.timer]),
    clock: w.clock,
    cpSwitch: w.checkpointSwitch,
    crates: w.crates.map((c) => [c.x, c.y, c.vy, c.sunk]),
    boss: w.boss ? { ...w.boss, home: { ...w.boss.home } } : null,
    boss2: w.boss2 ? { ...w.boss2, home: { ...w.boss2.home } } : null,
    projectiles: w.projectiles.map((q) => ({ ...q })),
  }
}

export function restore(w: World, s: Snapshot) {
  const { onPlatform, ...rest } = s.player
  Object.assign(w.player, rest, { dashDir: [...rest.dashDir], onPlatform: onPlatform >= 0 ? w.platforms[onPlatform] : null })
  s.platforms.forEach((p, i) => Object.assign(w.platforms[i], p))
  w.crumbles.clear()
  for (const [k, v] of s.crumbles) w.crumbles.set(k, { ...v })
  w.time = s.time
  w.complete = s.complete
  w.deaths = s.deaths
  w.spawn = { ...s.spawn }
  w.checkpointIndex = s.checkpointIndex
  s.cps.forEach((a, i) => (w.checkpoints[i].active = a))
  s.picks.forEach((a, i) => (w.pickups[i].taken = a))
  w.hasKey = s.hasKey
  w.switchOn = s.switchOn
  w.stampTaken = s.stampTaken
  w.charmTaken = s.charmTaken
  s.crystals.forEach(([a, t], i) => Object.assign(w.crystals[i], { active: a, timer: t }))
  s.nitros.forEach(([a, t], i) => Object.assign(w.nitros[i], { active: a, timer: t }))
  w.clock = s.clock
  w.plates.forEach((pl) => (pl.pressed = false))
  w.checkpointSwitch = s.cpSwitch
  s.crates.forEach(([x, y, vy, sunk], i) => Object.assign(w.crates[i], { x, y, vy, sunk }))
  if (w.boss && s.boss) Object.assign(w.boss, s.boss, { home: { ...s.boss.home } })
  if (w.boss2 && s.boss2) Object.assign(w.boss2, s.boss2, { home: { ...s.boss2.home } })
  w.projectiles = s.projectiles.map((q) => ({ ...q }))
  w.events = []
}
