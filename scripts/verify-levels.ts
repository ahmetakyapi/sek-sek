/**
 * Her bölümü gerçek fizik motoruyla çözer (scripts/solver.ts):
 *  - çıkışa ulaşılabiliyor mu
 *  - her hatıra (C), bayrak (F), pul ve anahtar alınabiliyor mu
 */
import { LEVELS } from '../game/levels'
import { T } from '../game/types'
import { solve } from './solver'

let failed = false
const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const { world: w, won, stamp, charm, gotKey, picks, cps, expanded, ms, far } = solve(level, { budget: Number(process.env.BUDGET ?? 15000) })
  const ok = won && stamp && charm && gotKey && picks.size === w.pickups.length && cps.size === w.checkpoints.length
  if (!ok) failed = true
  const missing = w.pickups.filter((p) => !picks.has(p.index)).map((p) => `C@${Math.floor(p.x / T)},${Math.floor(p.y / T)}`)
  const missingCp = w.checkpoints.filter((p) => !cps.has(p.index)).map((p) => `F@${Math.floor(p.x / T)},${Math.floor(p.y / T) + 1}`)
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${level.name.padEnd(9)} ${w.cols}x${w.rows} çıkış:${won ? 'evet' : 'HAYIR'} hatıra:${picks.size}/${w.pickups.length} bayrak:${cps.size}/${w.checkpoints.length} pul:${stamp ? 'evet' : 'HAYIR'} nazar:${charm ? 'evet' : 'HAYIR'} anahtar:${gotKey ? 'evet' : 'HAYIR'} durum:${expanded} ${ms}ms ${[...missing, ...missingCp].join(' ')} en uzak:${Math.floor(far.x / T)},${Math.floor(far.y / T)}`)
}
process.exit(failed ? 1 : 0)
