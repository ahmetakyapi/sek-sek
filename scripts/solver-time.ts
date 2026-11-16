/**
 * Şehrin çözücü süresi: çıkışa giden yolu bulur, baştan oynatıp süresini (sn) yazar. tests/antiCheat.test.ts SOLVER tablosu
 * ve madalyalar (game/medals.ts) bu süreye dayanır. Kullanım: npx tsx scripts/solver-time.ts <şehir ...>
 */
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { runMacro, solve } from './solver'

for (const id of process.argv.slice(2)) {
  const level = LEVELS.find((l) => l.id === id)
  if (!level) {
    console.log(`bilinmeyen şehir: ${id}`)
    continue
  }
  const r = solve(level, { exitOnly: true, trace: true, budget: Number(process.env.BUDGET ?? 60000) })
  if (!r.won) {
    console.log(`FAIL ${id} çıkışa varılamadı`)
    continue
  }
  const w = new World(level)
  w.enemies.length = 0
  w.turrets.length = 0
  for (const m of r.path) runMacro(w, m, () => (w.events.length = 0))
  console.log(`${id} ${w.time.toFixed(1)}`)
}
