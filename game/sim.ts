import { BOSSES, makeBoss, resetBoss, touchBoss, updateBoss, type Boss } from './boss'
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

/* ── Fizik sabitleri (dünya pikseli / saniye) ───────────────── */
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
  /** tavan köşesine kafa sürtünce bu kadar piksel yana kayar */
  cornerAssist: 4,
  wallJumpVX: 150,
  wallJumpVY: 292,
  wallLock: 0.14,
  dashSpeed: 285,
  dashTime: 0.14,
  springV: 470,
  stompV: 270,
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

export type EnemyKind = 'ground' | 'fly' | 'hopper' | 'charger' | 'bat' | 'spiky' | 'magpie'

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

  spawn: { x: number; y: number }
  checkpointIndex = -1
  time = 0
  deaths = 0
  complete = false
  /** süre ilk hareketle başlar (madalya adaletli olsun) */
  started = false
  private prevDown = false
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
          case 'p':
            this.crates.push({ x: px, y: py, w: T, h: T, vy: 0, ox: px, oy: py, sunk: 0 })
            break
          case 'X':
            this.set(tx, ty, CRUMBLE)
            break
          case '~':
            this.set(tx, ty, WATER)
            break
          case '>':
          case '<':
            this.set(tx, ty, TURRET)
            this.turrets.push({ tx, ty, dir: ch === '>' ? 1 : -1, timer: 0.6 + ((tx * 7 + ty * 3) % 10) / 10 })
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
            this.enemies.push({ ...enemy('fly', px + 2, py + 4, 12, 8), phase: tx * 0.7 })
            break
          case 'h':
            this.enemies.push(enemy('hopper', px + 2, py + 6, 12, 10))
            break
          case 'c':
            this.enemies.push(enemy('charger', px + 1, py + 4, 14, 12))
            break
          case 'u':
            this.enemies.push({ ...enemy('bat', px + 2, py + 4, 12, 8), phase: tx * 0.9 })
            break
          case 'x':
            this.enemies.push(enemy('spiky', px + 2, py + 7, 12, 9))
            break
          case 'j':
            // Ordu saksağanı: dalda bekler, altından geçene dalar
            this.enemies.push({ ...enemy('magpie', px + 2, py + 6, 12, 9), timer: 0.4 })
            break
          case '*':
            this.crystals.push({ x: px + 3, y: py + 3, w: 10, h: 10, active: true, timer: 0 })
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
            const def = BOSSES[level.city]
            const stop = (c: string | undefined) => c === undefined || c === '|' || c === '#' || c === 'G'
            let l = tx - 1
            while (l >= 0 && !stop(row[l])) l--
            let r = tx + 1
            while (r < this.cols && !stop(row[r])) r++
            this.boss = makeBoss(def, px, (ty + 1) * T, (l + 1) * T, r * T - def.w)
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
            this.hammers.push({ x: px, top: py, bottom: (d - 1) * T, offset: (tx * 0.37) % HAMMER_CYCLE })
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
    this.player = this.freshPlayer(start.x, start.y)
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
      const a0 = (tx % 2) * Math.PI
      const dir = tx % 4 < 2 ? 1 : -1
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
    return { x, y, w, h: 6, axis, min, max, dir: 1, speed: axis === 'x' ? 42 : 36, dx: 0, dy: 0 }
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
    }
  }

  /* ── Tile erişimi ─────────────────────────────────────────── */
  set(tx: number, ty: number, v: number) {
    this.tiles[ty * this.cols + tx] = v
  }

  tile(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.cols) return SOLID
    // tepeye dayanan duvar göğe kadar sürer: üstünden tırmanıp aşılmaz
    if (ty < 0) return this.tiles[tx] === SOLID ? SOLID : EMPTY
    if (ty >= this.rows) return EMPTY
    return this.tiles[ty * this.cols + tx]
  }

  isSolid(tx: number, ty: number): boolean {
    const t = this.tile(tx, ty)
    if (t === SOLID || t === ICE || t === WET || t === TURRET) return true
    if (t === CRUMBLE) return !this.crumbles.get(ty * this.cols + tx)?.broken
    if (t === DOOR) return !this.hasKey
    if (t === BLOCK_A) return !this.switchOn
    if (t === BLOCK_B) return this.switchOn
    if (t === BOSS_GATE) return this.boss !== null && this.boss.state !== 'down'
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

    this.updatePlatforms(dt)
    this.updateCrumbles(dt)
    if (this.crates.length) this.updateCrates(dt)

    if (p.dead) {
      p.deadTimer -= dt
      if (p.deadTimer <= 0) this.respawn()
      this.updateEnemies(dt)
      if (this.boss) updateBoss(this.boss, this, dt)
      this.updateTurrets(dt)
      return
    }

    this.updatePlayer(dt, input)
    this.updateObjects(dt)
    this.updateEnemies(dt)
    if (this.boss) updateBoss(this.boss, this, dt)
    this.updateTurrets(dt)
    this.interactions()
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

    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (ix !== 0 && p.dashTime <= 0) p.facing = ix > 0 ? 1 : -1

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

    // dash
    if (input.dashPressed && p.canDash && p.dashTime <= 0) {
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

    const wind = this.level.wind ? this.level.wind * (0.55 + 0.45 * Math.sin(this.time * 1.1)) : 0
    this.windNow = wind

    if (p.dashTime > 0) {
      p.dashTime -= dt
      p.vx = p.dashDir[0] * PHYS.dashSpeed
      p.vy = p.dashDir[1] * PHYS.dashSpeed
      if (p.dashTime <= 0) {
        p.vx = Math.sign(p.vx) * Math.min(Math.abs(p.vx), PHYS.run * 1.15)
        if (p.vy < 0) p.vy *= 0.45
      }
    } else {
      // yatay kontrol
      const target = ix * PHYS.run
      let accel: number
      if (p.grounded) {
        if (p.onIce) accel = ix !== 0 ? PHYS.accelIce : PHYS.decelIce
        else if (p.onWet) accel = ix !== 0 ? PHYS.accelWet : PHYS.decelWet
        else accel = ix !== 0 ? PHYS.accelGround : PHYS.decelGround
      } else accel = ix !== 0 ? PHYS.accelAir : PHYS.dragAir
      if (p.wallLock > 0) accel *= 0.25
      if (p.vx < target) p.vx = Math.min(target, p.vx + accel * dt)
      else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * dt)
      p.vx += wind * (p.grounded ? 0.35 : 1) * dt

      // yerçekimi
      let g = PHYS.gravity
      if (p.vy < 0 && !input.jump) g *= PHYS.lowJumpMul
      p.vy = Math.min(PHYS.fallMax, p.vy + g * dt)

      // duvar
      p.wallDir = 0
      if (!p.grounded) {
        if (this.boxHitsSolid(p.x - 1, p.y + 2, 1, p.h - 4)) p.wallDir = -1
        else if (this.boxHitsSolid(p.x + p.w, p.y + 2, 1, p.h - 4)) p.wallDir = 1
        if (p.wallDir !== 0 && ix === p.wallDir && p.vy > PHYS.wallSlideMax) p.vy = PHYS.wallSlideMax
      }

      // zıplama
      if (p.buffer > 0) {
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
      if (mid === WATER || c.y > this.rows * T + 16) {
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
        p.onIce = this.tile(cx, ty) === ICE
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
        c.timer = 2.5
        p.canDash = true
        this.events.push({ type: 'crystal' })
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
        p.vy = -PHYS.springV
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
      const stomp = p.vy > 0 && p.y + p.h - e.y < 8
      if (e.kind !== 'spiky' && (stomp || p.dashTime > 0)) {
        e.alive = false
        p.vy = -PHYS.stompV
        p.canDash = true
        if (p.dashTime > 0) p.dashTime = 0
        this.events.push({ type: 'stomp', x: e.x + e.w / 2, y: e.y + e.h / 2 })
      } else return this.kill()
    }

    for (const pr of this.projectiles) if (overlap(shrink(p, 2), pr)) return this.kill()

    if (this.boss) {
      const r = touchBoss(this.boss, this)
      if (r === 'kill') return this.kill()
      if (r === 'hit') {
        p.vy = -PHYS.stompV
        p.canDash = true
        p.dashTime = 0
        p.grounded = false
        if (this.boss.state === 'down') this.projectiles = []
      }
    }

    // meydan kapısı: finale geç (tek yön)
    if (this.warp && this.arrival && overlap(p, this.warp)) {
      Object.assign(p, this.freshPlayer(this.arrival.x, this.arrival.y))
      this.spawn = { ...this.arrival }
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

  respawn() {
    Object.assign(this.player, this.freshPlayer(this.spawn.x, this.spawn.y))
    // düğmeler bayrağı aldığın andaki haline döner: açtığın köprü kapanmaz, kapattığın açık kalmaz
    this.switchOn = this.cpSwitch
    for (const pl of this.plates) pl.pressed = false
    if (this.boss && this.boss.state !== 'down') resetBoss(this.boss)
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
    for (const c of this.crystals) {
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
 * Toplanan şeyler (hatıra, pul, nazar, anahtar, kristal, bayrak) çizilen gövdeye değince alınır; fizik ve tehlikeler
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
  clock: number
  cpSwitch: boolean
  crates: Array<[number, number, number, number]>
  boss: Boss | null
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
    clock: w.clock,
    cpSwitch: w.checkpointSwitch,
    crates: w.crates.map((c) => [c.x, c.y, c.vy, c.sunk]),
    boss: w.boss ? { ...w.boss, home: { ...w.boss.home } } : null,
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
  w.clock = s.clock
  w.plates.forEach((pl) => (pl.pressed = false))
  w.checkpointSwitch = s.cpSwitch
  s.crates.forEach(([x, y, vy, sunk], i) => Object.assign(w.crates[i], { x, y, vy, sunk }))
  if (w.boss && s.boss) Object.assign(w.boss, s.boss, { home: { ...s.boss.home } })
  w.projectiles = s.projectiles.map((q) => ({ ...q }))
  w.events = []
}
