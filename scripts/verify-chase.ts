/**
 * Kovalamaca kanıtı: Kangal oyuncunun izini sürer; uzun bekleme (raylı platform, asansör) isteyen şehirde yakalanmadan
 * geçilemez. Bu betik çözücünün bulduğu yolu, köpek oyundakinden sert kovalarken (doğuşta beklemeden, en yüksek hızın
 * STRICT katıyla) yeniden oynatır: ısırılmadan çıkışa varılan şehirler CHASE_OK listesine yazılır (lib/extras.ts).
 * Kullanım: npx tsx scripts/verify-chase.ts [şehir ...] [--hepsi]   (listedeki biri FAIL ise çıkış kodu 1)
 */
import { LEVELS } from '../game/levels'
import { CHASE, World, restore, snapshot } from '../game/sim'
import { CHASE_OK } from '../lib/extras'
import { holdPlates, runMacro, solve } from './solver'

/** insan payı: kanıtta köpek oyundaki en yüksek hızından bu kat hızlı ve baştan o hızda */
const STRICT = Number(process.env.STRICT ?? 1.15)
const rest = process.argv.slice(2)
const all = rest.includes('--hepsi')
const want = rest.filter((a) => !a.startsWith('--'))
let failed = false
for (const level of LEVELS.filter((l) => (all || want.length ? true : CHASE_OK.includes(l.id)) && (!want.length || want.includes(l.id)))) {
  const r = solve(level, { exitOnly: true, trace: true, budget: Number(process.env.BUDGET ?? 60000) })
  if (!r.won) {
    console.log(`SKIP ${level.id.padEnd(10)} çözücü çıkışa varamadı`)
    if (CHASE_OK.includes(level.id)) failed = true
    continue
  }
  const keep = { ...CHASE }
  Object.assign(CHASE, { wait: 1, speed: CHASE.top * STRICT, top: CHASE.top * STRICT })
  const w = new World({ ...level, chaser: true })
  w.enemies.length = 0
  w.turrets.length = 0
  w.boss = null
  w.boss2 = null
  w.started = true
  let bite: { x: number; y: number } | null = null
  for (const m of r.path) {
    restore(w, snapshot(w))
    holdPlates(w)
    runMacro(w, m, () => {
      const e = w.events.find((x) => x.type === 'bite')
      if (e && e.type === 'bite' && !bite) bite = { x: e.x, y: e.y }
      w.events.length = 0
    })
    if (bite || w.complete) break
  }
  Object.assign(CHASE, keep)
  const ok = !bite && w.complete
  if (!ok && CHASE_OK.includes(level.id)) failed = true
  const where = bite as { x: number; y: number } | null
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${level.id.padEnd(10)} ${ok ? 'köpek yetişemedi' : where ? `ısırık: karo ${Math.round(where.x / 16)},${Math.round(where.y / 16)}` : 'çıkışa varılamadı'}`)
}
process.exit(failed ? 1 : 0)
