/**
 * Her bölümü gerçek fizik motoruyla BFS üzerinden "oynar":
 *  - çıkışa ulaşılabiliyor mu
 *  - her hatıra (C) ve bayrak (F) alınabiliyor mu
 * Düşmanlar ve ok tuzakları zamanlama engelidir, ulaşılabilirliği değiştirmez: çözücüde kapalı.
 */
import { LEVELS } from '../game/levels'
import { World, snapshot, restore, type Snapshot } from '../game/sim'
import { emptyInput, type Input, T } from '../game/types'

const DT = 1 / 120

interface Macro {
  dir: -1 | 0 | 1
  hold: number // yön tutma süresi
  jump: number // zıpla basılı süre (0: zıplama yok)
  jump2: number // ikinci zıplama anı (duvar sekmesi), 0: yok
  dashAt: number // 0: atılma yok
  dashDir: [number, number]
  wait: number
  repeat?: number
}

function macros(): Macro[] {
  const out: Macro[] = []
  for (const dir of [-1, 0, 1] as const) {
    for (const hold of dir === 0 ? [0] : [0.12, 0.35, 2.5]) out.push({ dir, hold, jump: 0, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 0 })
    for (const jump of [0.06, 0.14, 0.4]) {
      for (const jump2 of [0, 0.3, 0.45]) {
        out.push({ dir, hold: 2.5, jump, jump2, dashAt: 0, dashDir: [0, 0], wait: 0 })
        if (dir !== 0) out.push({ dir, hold: 0.2, jump, jump2, dashAt: 0, dashDir: [0, 0], wait: 0 })
      }
      for (const dashAt of [0.12, 0.28, 0.42]) {
        const dirs: [number, number][] = dir === 0 ? [[0, -1]] : [[dir, 0], [dir, -1], [0, -1]]
        for (const dd of dirs) out.push({ dir, hold: 2.5, jump, jump2: 0, dashAt, dashDir: dd, wait: 0 })
      }
    }
  }
  for (const dir of [-1, 0, 1] as const)
    for (const repeat of [0.2, 0.27, 0.34]) {
      out.push({ dir, hold: 2.5, jump: 0.12, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 0, repeat })
      out.push({ dir, hold: 0.25, jump: 0.12, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 0, repeat })
    }
  out.push({ dir: 0, hold: 0, jump: 0, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 0.5 })
  out.push({ dir: 0, hold: 0, jump: 0, jump2: 0, dashAt: 0, dashDir: [0, 0], wait: 1.2 })
  return out
}

function inputAt(m: Macro, t: number, prev: { jump: boolean; dash: boolean }): Input {
  const i = emptyInput()
  if (m.wait > 0) return i
  if (t < m.hold) {
    i.left = m.dir < 0
    i.right = m.dir > 0
  }
  const j1 = m.repeat ? t % m.repeat < m.repeat * 0.6 : m.jump > 0 && t < m.jump
  const j2 = m.jump2 > 0 && t >= m.jump2 && t < m.jump2 + 0.25
  i.jump = j1 || j2
  i.jumpPressed = i.jump && !prev.jump
  const dashNow = m.dashAt > 0 && t >= m.dashAt && t < m.dashAt + DT * 1.5
  if (dashNow) {
    i.left = m.dashDir[0] < 0
    i.right = m.dashDir[0] > 0
    i.up = m.dashDir[1] < 0
    i.down = m.dashDir[1] > 0
  }
  i.dashPressed = dashNow && !prev.dash
  prev.jump = i.jump
  prev.dash = dashNow
  return i
}

function key(s: Snapshot, w: World) {
  const p = s.player
  // sema halkaları ve tokmaklar ortak saate bağlı: konumları yerine saatin evresi yeter
  const near = s.platforms.map((q, i) => ({ q, a: w.platforms[i].axis })).filter(({ q }) => Math.abs(q.x - p.x) < 260 && Math.abs(q.y - p.y) < 200)
  const plats = near.filter(({ a }) => a === 'x' || a === 'y' || a === 'b').map(({ q, a }) => (a === 'b' ? `b${Math.round(q.y / 16)}` : `${Math.round((q.x + q.y) / 12)}${q.dir}`))
  const clocked = near.some(({ q, a }) => (a === 'o' || a === 'h') && Math.abs(q.x - p.x) < 120) || w.hammers.some((h) => Math.abs(h.x - p.x) < 40 && p.y > h.top - 8)
  const phase = clocked ? Math.floor(((s.clock * 1.35) / (Math.PI * 2)) * 8) % 8 + '/' + Math.floor((s.clock % 3.11) * 4) : ''
  return [Math.round(p.x / 6), Math.round(p.y / 4), Math.round(p.vx / 40), plats.join(','), phase, s.checkpointIndex, s.hasKey ? 1 : 0, s.switchOn ? 1 : 0].join('|')
}

let failed = false
const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const w = new World(level)
  w.enemies.length = 0
  w.turrets.length = 0
  const ms = macros()
  let far = { x: 0, y: 0 }
  const start = snapshot(w)
  const seen = new Set<string>([key(start, w)])
  const queue: Snapshot[] = [start]
  // hedefli tur: eksik kalan bir hedefe en yakın durumlar önce açılır
  let target: { x: number; y: number } | null = null
  const pool: Snapshot[] = []
  const pri = (q: Snapshot) => (target ? -Math.hypot(q.player.x - target.x, q.player.y - target.y) : q.player.x - q.player.y * 0.3 + ((q.player.x * 7 + q.player.y * 13) % 40))
  const push = (q: Snapshot, keep = true) => {
    if (keep) pool.push(q)
    ;(q as Snapshot & { pr: number }).pr = pri(q)
    queue.push(q)
    let i = queue.length - 1
    while (i > 0) {
      const par = (i - 1) >> 1
      if ((queue[par] as any).pr >= (queue[i] as any).pr) break
      ;[queue[par], queue[i]] = [queue[i], queue[par]]
      i = par
    }
  }
  const pop = (): Snapshot => {
    const top = queue[0]
    const last = queue.pop()!
    if (queue.length) {
      queue[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < queue.length && (queue[l] as any).pr > (queue[m] as any).pr) m = l
        if (r < queue.length && (queue[r] as any).pr > (queue[m] as any).pr) m = r
        if (m === i) break
        ;[queue[m], queue[i]] = [queue[i], queue[m]]
        i = m
      }
    }
    return top
  }
  const picks = new Set<number>()
  const cps = new Set<number>()
  let won = false
  let stamp = !w.stampBox
  let gotKey = !w.keyBox
  let expanded = 0
  const t0 = Date.now()
  const allDone = () => won && stamp && gotKey && picks.size === w.pickups.length && cps.size === w.checkpoints.length
  const loop = (budget: number, done: () => boolean) => {
    let n = 0
    while (queue.length && n < budget && !done()) {
      const s = pop()
      expanded++
      n++
      for (const m of ms) {
        restore(w, s)
        const prev = { jump: false, dash: false }
        const deaths = w.deaths
        let t = 0
        let air = false
        const limit = m.wait > 0 ? m.wait : 2.6
        while (t < limit) {
          w.step(DT, inputAt(m, t, prev))
          t += DT
          for (const e of w.events) {
            if (e.type === 'collect') picks.add(e.index)
            if (e.type === 'checkpoint') cps.add(e.index)
            if (e.type === 'stamp') stamp = true
            if (e.type === "key") gotKey = true
          }
          w.events.length = 0
          if (w.complete) break
          if (w.deaths > deaths) break
          if (!w.player.grounded) air = true
          const jumping = m.jump > 0 || m.dashAt > 0
          if (m.wait === 0 && w.player.grounded && t > 0.05) {
            if (jumping && air && !m.repeat && (m.jump2 === 0 || t > m.jump2 + 0.05)) break
            if (m.repeat && air && t > 0.6) break
            if (!jumping && (t >= m.hold || air) && (air || Math.abs(w.player.vx) < 1)) break
          }
        }
        if (w.complete) won = true
        if (w.deaths > deaths || w.complete || !w.player.grounded) continue
        if (w.player.x > far.x) far = { x: w.player.x, y: w.player.y }
        const ns = snapshot(w)
        const k = key(ns, w)
        if (!seen.has(k)) {
          seen.add(k)
          push(ns)
        }
      }
    }
  }
  loop(Number(process.env.BUDGET ?? 15000), allDone)
  const goals = () => [...w.pickups.filter((p) => !picks.has(p.index)), ...w.checkpoints.filter((c) => !cps.has(c.index)), ...(!stamp && w.stampBox ? [w.stampBox] : []), ...(!gotKey && w.keyBox ? [w.keyBox] : []), ...(!won ? [w.exit] : [])]
  for (const g of goals()) {
    target = { x: g.x, y: g.y }
    queue.length = 0
    for (const q of [...pool]) push(q, false)
    loop(6000, () => !goals().includes(g))
  }
  target = null

  const ok = won && stamp && gotKey && picks.size === w.pickups.length && cps.size === w.checkpoints.length
  if (!ok) failed = true
  const missing = w.pickups.filter((p) => !picks.has(p.index)).map((p) => `C@${Math.floor(p.x / T)},${Math.floor(p.y / T)}`)
  const missingCp = w.checkpoints.filter((p) => !cps.has(p.index)).map((p) => `F@${Math.floor(p.x / T)},${Math.floor(p.y / T) + 1}`)
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${level.name.padEnd(9)} ${w.cols}x${w.rows} çıkış:${won ? 'evet' : 'HAYIR'} hatıra:${picks.size}/${w.pickups.length} bayrak:${cps.size}/${w.checkpoints.length} pul:${stamp ? 'evet' : 'HAYIR'} anahtar:${gotKey ? 'evet' : 'HAYIR'} durum:${expanded} ${Date.now() - t0}ms ${[...missing, ...missingCp].join(' ')} en uzak:${Math.floor(far.x / T)},${Math.floor(far.y / T)}`)
}
process.exit(failed ? 1 : 0)
