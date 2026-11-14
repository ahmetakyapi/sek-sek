/**
 * Mücadele haritalarını çözücüyle dener: başlangıçtan çıkışa varılıyor mu (game/challenges.ts).
 * Kullanım: npx tsx scripts/verify-challenges.ts [mücadele-id]
 */
import { CHALLENGES, challengeLevel } from '../game/challenges'
import { T } from '../game/types'
import { solve } from './solver'

let failed = false
for (const c of CHALLENGES.filter((c) => !process.argv[2] || c.id === process.argv[2])) {
  const level = challengeLevel(c)
  const { world: w, won, expanded, ms, far } = solve(level, { exitOnly: true, budget: Number(process.env.BUDGET ?? 15000) })
  if (!won) failed = true
  console.log(`${won ? "OK  " : "FAIL"} ${c.id.padEnd(22)} ${w.cols}x${w.rows} süre:${w.time.toFixed(1)} madalya:${level.medals.join('/')} durum:${expanded} ${ms}ms en uzak:${Math.floor(far.x / T)},${Math.floor(far.y / T)}`)
}
process.exit(failed ? 1 : 0)
