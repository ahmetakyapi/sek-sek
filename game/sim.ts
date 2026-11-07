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
  jumpV: 312,
  lowJumpMul: 1.9,
  coyote: 0.1,
  buffer: 0.13,
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
  dead: boolean
  deadTimer: number
  runTime: number
  landTimer: number
}

export interface Platform extends Box {
  axis: 'x' | 'y'
  min: number
  max: number
  dir: 1 | -1
  speed: number
  dx: number
  dy: number
}

export interface Enemy extends Box {
  kind: 'ground' | 'fly'
  ox: number
  oy: number
  dir: 1 | -1
  alive: boolean
  phase: number
}

export interface Turret {
  tx: number
  ty: number
  dir: 1 | -1
  timer: number
}

export interface Projectile extends Box {
  vx: number
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

const PW = 10
const PH = 14

export class World {
  readonly level: LevelDef
  readonly cols: number
  readonly rows: number
  readonly tiles: Uint8Array
  readonly player: Player
  readonly platforms: Platform[] = []
  readonly enemies: Enemy[] = []
  readonly turrets: Turret[] = []
  projectiles: Projectile[] = []
  readonly pickups: Pickup[] = []
  readonly checkpoints: Checkpoint[] = []
  readonly springs: Spring[] = []
  readonly signs: Sign[] = []
  readonly decor: Decor[] = []
  readonly exit: Box
  readonly start: { x: number; y: number }
  readonly crumbles = new Map<number, CrumbleState>()

  spawn: { x: number; y: number }
  checkpointIndex = -1
  time = 0
  deaths = 0
  complete = false
  windNow = 0
  nearSign = -1
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
            this.enemies.push({ kind: 'ground', x: px + 2, y: py + 6, w: 12, h: 10, ox: px + 2, oy: py + 6, dir: -1, alive: true, phase: 0 })
            break
          case 'f':
            this.enemies.push({ kind: 'fly', x: px + 2, y: py + 4, w: 12, h: 8, ox: px + 2, oy: py + 4, dir: -1, alive: true, phase: tx * 0.7 })
            break
          case '?':
            this.signs.push({ x: px, y: py, w: T, h: T, index: signIdx++ })
            break
          case 'M':
          case 'N': {
            if (row[tx - 1] === ch) break // aynı platformun devamı
            let n = 1
            while (row[tx + n] === ch) n++
            this.platforms.push(this.makePlatform(map, tx, ty, n, ch === 'M' ? 'x' : 'y'))
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
          case 't':
          case 'w':
          case 'z':
            this.decor.push({ tx, ty, ch })
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
    this.start = start
    this.spawn = { ...start }
    this.exit = exit
    this.player = this.freshPlayer(start.x, start.y)
  }

  private makePlatform(map: string[], tx: number, ty: number, n: number, axis: 'x' | 'y'): Platform {
    const w = n * T
    const x = tx * T
    const y = ty * T
    let min: number
    let max: number
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
    if (ty < 0 || ty >= this.rows) return EMPTY
    return this.tiles[ty * this.cols + tx]
  }

  isSolid(tx: number, ty: number): boolean {
    const t = this.tile(tx, ty)
    if (t === SOLID || t === ICE || t === TURRET) return true
    if (t === CRUMBLE) return !this.crumbles.get(ty * this.cols + tx)?.broken
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
    this.time += dt

    this.updatePlatforms(dt)
    this.updateCrumbles(dt)

    if (p.dead) {
      p.deadTimer -= dt
      if (p.deadTimer <= 0) this.respawn()
      this.updateEnemies(dt)
      this.updateTurrets(dt)
      return
    }

    this.updatePlayer(dt, input)
    this.updateEnemies(dt)
    this.updateTurrets(dt)
    this.interactions()
  }

  private updatePlatforms(dt: number) {
    const p = this.player
    for (const pl of this.platforms) {
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

    // aşağı + zıpla: tek yönlü platformdan in
    if (input.down && input.jumpPressed && p.grounded && this.standingOnOneway()) {
      p.dropTimer = 0.22
      p.buffer = 0
      p.grounded = false
      p.onPlatform = null
      p.y += 1
    }

    // atılma
    if (input.dashPressed && p.canDash && p.dashTime <= 0) {
      let dx = ix
      let dy = iy
      if (dx === 0 && dy === 0) dx = p.facing
      // yerdeyken aşağı atılma anlamsız: yataya çevir
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
    p.x = nx
  }

  private moveY(dy: number, prevBottom: number) {
    const p = this.player
    let ny = p.y + dy
    if (dy < 0) {
      if (this.boxHitsSolid(p.x, ny, p.w, p.h)) {
        ny = Math.floor(ny / T) * T + T
        if (this.boxHitsSolid(p.x, ny, p.w, p.h)) ny = p.y
        p.vy = 0
        if (p.dashTime > 0) p.dashTime = 0
      }
      p.y = ny
      p.onPlatform = null
      return
    }

    // aşağı / sabit
    const bottom = ny + p.h
    let landY: number | null = null
    let landPlat: Platform | null = null

    if (this.boxHitsSolid(p.x, ny, p.w, p.h)) {
      landY = Math.floor(bottom / T) * T - p.h
      if (this.boxHitsSolid(p.x, landY, p.w, p.h)) landY = p.y
    }

    // tek yönlü tile'lar
    if (p.dropTimer <= 0) {
      const x0 = Math.floor(p.x / T)
      const x1 = Math.floor((p.x + p.w - 0.001) / T)
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
      // hareketli platformlar
      for (const pl of this.platforms) {
        if (p.x + p.w <= pl.x || p.x >= pl.x + pl.w) continue
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

    if (landY !== null) {
      p.y = landY
      p.vy = 0
      p.grounded = true
      p.onPlatform = landPlat
      if (p.dashTime > 0 && p.dashDir[1] > 0) p.dashTime = 0
      // buz kontrolü
      if (!landPlat) {
        const ty = Math.floor((p.y + p.h + 1) / T)
        const cx = Math.floor((p.x + p.w / 2) / T)
        p.onIce = this.tile(cx, ty) === ICE
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

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (!e.alive) continue
      e.phase += dt
      if (e.kind === 'ground') {
        const speed = 30
        const nx = e.x + e.dir * speed * dt
        const frontX = e.dir > 0 ? nx + e.w : nx
        const ftx = Math.floor(frontX / T)
        const midTy = Math.floor((e.y + e.h / 2) / T)
        const footTy = Math.floor((e.y + e.h + 2) / T)
        const wall = this.isSolid(ftx, midTy) || this.tile(ftx, midTy) === SPIKE_UP
        const groundAhead = this.isSolid(ftx, footTy) || this.tile(ftx, footTy) === ONEWAY
        if (wall || !groundAhead) e.dir = e.dir > 0 ? -1 : 1
        else e.x = nx
      } else {
        const speed = 38
        const nx = e.x + e.dir * speed * dt
        const frontX = e.dir > 0 ? nx + e.w : nx
        const blocked = this.isSolid(Math.floor(frontX / T), Math.floor((e.y + e.h / 2) / T))
        if (blocked || Math.abs(nx - e.ox) > T * 4) e.dir = e.dir > 0 ? -1 : 1
        else e.x = nx
        e.y = e.oy + Math.sin(e.phase * 3) * 5
      }
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
      if (stomp || p.dashTime > 0) {
        e.alive = false
        p.vy = -PHYS.stompV
        p.canDash = true
        if (p.dashTime > 0) p.dashTime = 0
        this.events.push({ type: 'stomp', x: e.x + e.w / 2, y: e.y + e.h / 2 })
      } else return this.kill()
    }

    for (const pr of this.projectiles) if (overlap(shrink(p, 2), pr)) return this.kill()

    for (const c of this.pickups) {
      if (!c.taken && overlap(p, c)) {
        c.taken = true
        this.events.push({ type: 'collect', index: c.index })
      }
    }

    for (const cp of this.checkpoints) {
      if (!cp.active && overlap(p, cp)) {
        cp.active = true
        for (const o of this.checkpoints) if (o.index < cp.index) o.active = true
        this.checkpointIndex = cp.index
        this.spawn = { x: cp.x + (T - PW) / 2, y: cp.y + T * 2 - PH }
        this.events.push({ type: 'checkpoint', index: cp.index })
      }
    }

    this.nearSign = -1
    for (const s of this.signs) {
      if (Math.abs(p.x + p.w / 2 - (s.x + T / 2)) < 22 && Math.abs(p.y + p.h - (s.y + T)) < 24) this.nearSign = s.index
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
    for (const e of this.enemies) {
      e.alive = true
      e.x = e.ox
      e.y = e.oy
      e.dir = -1
    }
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
  w.projectiles = []
  w.events = []
}
