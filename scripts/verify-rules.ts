/**
 * Kural kanıtı: "Dash’siz" kuralı ve "Hiç Dash Atmadan Bitir" görevi yalnız NO_DASH_OK şehirlerinde çıkar
 * (lib/extras.ts). Bu betik o şehirlerin
 * çıkışına yalnız yürüyüp zıplayarak (dash ve duvar sekmesi olmadan) varılabildiğini çözücüyle kanıtlar.
 * Kullanım: npx tsx scripts/verify-rules.ts [şehir ...]   (biri FAIL ise çıkış kodu 1)
 */
import { LEVELS } from '../game/levels'
import { ruleFits } from '../lib/extras'
import { solve } from './solver'

const want = process.argv.slice(2)
let failed = false
for (const level of LEVELS.filter((l) => ruleFits('dashsiz', l) && (!want.length || want.includes(l.id)))) {
  const r = solve(level, { moves: 'basic', exitOnly: true, budget: Number(process.env.BUDGET ?? 15000) })
  if (!r.won) failed = true
  console.log(`${r.won ? 'OK  ' : 'FAIL'} ${level.id.padEnd(10)} dash’siz çıkış:${r.won ? 'evet' : 'HAYIR'} durum:${r.expanded} ${r.ms}ms`)
}
process.exit(failed ? 1 : 0)
