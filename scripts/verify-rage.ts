/**
 * Zor mod kanıtı: Kaygan Dünya (her zemin buz) ve Çöken Dünya (basılan yüzey çöker) fiziği değiştirir. Bu modlar ve
 * onları içeren birleşimler (Kâbus, Son Nefes) yalnız SLIPPERY_OK / CRUMBLE_OK şehirlerinde açılır (lib/extras.ts).
 * Bu betik o şehirlerin çıkışına o fizikle varılabildiğini çözücüyle kanıtlar.
 * Kullanım: npx tsx scripts/verify-rage.ts <kaygan|coken> [şehir ...]   (biri FAIL ise çıkış kodu 1)
 *           npx tsx scripts/verify-rage.ts <kaygan|coken> --hepsi     (listeye bakmadan bütün şehirleri dener)
 */
import { LEVELS } from '../game/levels'
import { CRUMBLE_OK, SLIPPERY_OK, ruleLevel } from '../lib/extras'
import { solve } from './solver'

const [kind, ...rest] = process.argv.slice(2)
if (kind !== 'kaygan' && kind !== 'coken') {
  console.log('kullanım: verify-rage.ts <kaygan|coken> [şehir ...] [--hepsi]')
  process.exit(2)
}
const all = rest.includes('--hepsi')
const want = rest.filter((a) => !a.startsWith('--'))
const list = kind === 'kaygan' ? SLIPPERY_OK : CRUMBLE_OK
let failed = false
for (const level of LEVELS.filter((l) => (all || list.includes(l.id)) && (!want.length || want.includes(l.id)))) {
  const r = solve(ruleLevel(kind, level), { exitOnly: true, budget: Number(process.env.BUDGET ?? 40000) })
  if (!r.won) failed = true
  console.log(`${r.won ? 'OK  ' : 'FAIL'} ${level.id.padEnd(10)} ${kind} çıkış:${r.won ? 'evet' : 'HAYIR'} durum:${r.expanded} ${r.ms}ms en uzak:${Math.round(r.far.x / 16)}`)
}
process.exit(failed ? 1 : 0)
