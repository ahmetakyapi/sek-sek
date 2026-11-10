/**
 * Patron botu: arenada gerçek fizik motoruyla dövüşür, her patronun yenilebildiğini kanıtlar.
 *
 * Yöntem: kısa ufuklu deneme-yanılma (her 0,15 sn'de bir avuç tuş dizisini 1,6 sn ileri oynatır,
 * en iyisinin ilk adımını uygular). Tohumlu sözde-rastgele: aynı girdiyle hep aynı dövüş.
 * tests/boss.test.ts bütün şehirlerde koşar; `npx tsx scripts/bossbot.ts [şehir]` elle dener.
 */
import type { LevelDef } from '../game/types'
import { PHYS, World, restore, snapshot } from '../game/sim'
import { emptyInput, type Input } from '../game/types'

const DT = 1 / 120
const SEG = 0.15
const HORIZON = 11
const TRIES = 16

interface Act {
  dir: -1 | 0 | 1
  jump: boolean
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function stepFor(w: World, a: Act, secs: number, prevJump: { v: boolean }) {
  const n = Math.round(secs / DT)
  for (let i = 0; i < n; i++) {
    const inp: Input = emptyInput()
    inp.left = a.dir < 0
    inp.right = a.dir > 0
    inp.jump = a.jump
    inp.jumpPressed = a.jump && !prevJump.v
    prevJump.v = a.jump
    w.step(DT, inp)
    if (w.player.dead || w.boss?.state === 'down') return
  }
}

function score(w: World, hp0: number, deaths0: number): number {
  const b = w.boss!
  const p = w.player
  if (w.deaths > deaths0 || p.dead) return -1000
  let s = (hp0 - b.hp) * 600
  if (b.state === 'down') return s + 600
  const dx = Math.abs(p.x + p.w / 2 - (b.x + b.w / 2))
  // yorgunken yanaş ve tepesine çık; değilken bir zıplama uzağında dur (yorulunca yetişebilmek için)
  if (b.state === 'tired' && !b.hidden) s -= dx * 2 + Math.max(0, p.y + p.h - b.y) * 0.5
  else if (b.state !== 'hurt') s -= Math.abs(dx - 64) * 0.4
  for (const q of w.projectiles) if (Math.abs(q.x - p.x) < 20 && Math.abs(q.y - p.y) < 28) s -= 30
  return s
}

export interface BotResult {
  won: boolean
  deaths: number
  seconds: number
  hpLeft: number
}

/** Oyuncuyu arena bayrağına koyar, patron yenilene ya da süre dolana dek dövüşür. weak: zıplaması ve koşusu zayıf oyuncu. */
export function fightBoss(level: LevelDef, opts: { seed?: number; limit?: number; weak?: boolean } = {}): BotResult {
  const phys = PHYS as unknown as Record<string, number>
  const base = { ...phys }
  if (opts.weak) Object.assign(phys, { jumpV: base.jumpV * 0.95, run: base.run * 0.92, dashSpeed: base.dashSpeed * 0.92 })
  try {
    const w = new World(level)
    w.enemies.length = 0
    w.turrets.length = 0
    const b = w.boss
    if (!b) return { won: false, deaths: 0, seconds: 0, hpLeft: -1 }
    const flag = [...w.checkpoints].sort((x, y) => y.x - x.x)[0]
    const p = w.player
    p.x = flag.x + 2
    p.y = flag.y + flag.h - p.h
    w.spawn = { x: p.x, y: p.y }
    const rand = rng(opts.seed ?? 7)
    const prevJump = { v: false }
    let last: Act = { dir: 1, jump: false }
    const limit = opts.limit ?? 150
    let t = 0
    const down = () => (b.state as string) === 'down'
    while (t < limit && !down()) {
      if (p.dead) {
        w.step(DT, emptyInput())
        t += DT
        continue
      }
      const s0 = snapshot(w)
      const hp0 = b.hp
      const deaths0 = w.deaths
      let best = -Infinity
      let bestAct = last
      for (let k = 0; k < TRIES; k++) {
        const seq: Act[] = []
        let a: Act = k < 6 ? { dir: ([-1, 0, 1] as const)[k % 3], jump: k >= 3 } : last
        for (let i = 0; i < HORIZON; i++) {
          if (k >= 6 && rand() < 0.45) a = { dir: ([-1, 0, 1] as const)[Math.floor(rand() * 3)], jump: rand() < 0.4 }
          seq.push(a)
        }
        restore(w, s0)
        const pj = { v: prevJump.v }
        let sc = 0
        for (const act of seq) {
          stepFor(w, act, SEG, pj)
          if (w.player.dead || down()) break
        }
        sc = score(w, hp0, deaths0)
        if (sc > best) {
          best = sc
          bestAct = seq[0]
        }
      }
      restore(w, s0)
      w.deaths = deaths0
      stepFor(w, bestAct, SEG, prevJump)
      w.events.length = 0
      last = bestAct
      t += SEG
    }
    return { won: down(), deaths: w.deaths, seconds: t, hpLeft: b.hp }
  } finally {
    Object.assign(phys, base)
  }
}

if (process.argv[1]?.endsWith('bossbot.ts')) {
  void import('../game/levels').then(({ LEVELS }) => {
    const only = process.argv[2]
    for (const l of LEVELS.filter((x) => !only || x.id === only)) {
      const t0 = Date.now()
      const r = fightBoss(l)
      const wk = fightBoss(l, { weak: true })
      console.log(`${r.won && wk.won ? 'OK  ' : 'FAIL'} ${l.name.padEnd(10)} ${String(Math.round(r.seconds)).padStart(3)} sn, ${r.deaths} düşüş · zayıf oyuncu: ${wk.won ? `${Math.round(wk.seconds)} sn, ${wk.deaths} düşüş` : `yenemedi (kalan can ${wk.hpLeft})`} · ${Date.now() - t0} ms`)
    }
  })
}
