/**
 * Ayna Yolu: şehrin aynalanmış haritası çözücüyle baştan sona bitiyor mu (game/mirror.ts). Ağır: şehirleri ayrı
 * süreçlerde paralel koş. Kullanım: npx tsx scripts/verify-mirror.ts <şehir>   (BUDGET=40000 varsayılan)
 */
import { LEVELS } from '../game/levels'
import { mirrorLevel } from '../game/mirror'
import { T } from '../game/types'
import { solve } from './solver'

let failed = false
for (const l of LEVELS.filter((x) => !process.argv[2] || x.id === process.argv[2])) {
  const { world: w, won, expanded, ms, far } = solve(mirrorLevel(l), { exitOnly: true, budget: Number(process.env.BUDGET ?? 40000) })
  if (!won) failed = true
  console.log(`${won ? 'OK  ' : 'FAIL'} ${l.id.padEnd(11)} süre:${w.time.toFixed(1)} durum:${expanded} ${ms}ms en uzak:${Math.floor(far.x / T)},${Math.floor(far.y / T)}`)
}
process.exit(failed ? 1 : 0)
