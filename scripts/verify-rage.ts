/**
 * Zor mod kanıtı: Kaygan Dünya (her zemin buz), Çöken Dünya (basılan yüzey çöker), Ay Yerçekimi ve Fırtına fiziği değiştirir. Bu modlar ve
 * onları içeren birleşimler (Kâbus, Son Nefes) yalnız SLIPPERY_OK / CRUMBLE_OK şehirlerinde açılır (lib/extras.ts).
 * Bu betik o şehirlerin çıkışına o fizikle varılabildiğini çözücüyle kanıtlar.
 * Kullanım: npx tsx scripts/verify-rage.ts <kaygan|coken|ay|firtina> [şehir ...]   (biri FAIL ise çıkış kodu 1)
 *           npx tsx scripts/verify-rage.ts <kaygan|coken|ay|firtina> --hepsi     (listeye bakmadan bütün şehirleri dener)
 */
import { LEVELS } from '../game/levels'
import { CRUMBLE_OK, MOON_OK, SLIPPERY_OK, STORM_OK, ruleLevel } from '../lib/extras'
import { solve } from './solver'

const LISTS = { kaygan: SLIPPERY_OK, coken: CRUMBLE_OK, ay: MOON_OK, firtina: STORM_OK } as const
const [kind, ...rest] = process.argv.slice(2) as [keyof typeof LISTS, ...string[]]
if (!(kind in LISTS)) {
  console.log('kullanım: verify-rage.ts <kaygan|coken|ay|firtina> [şehir ...] [--hepsi]')
  process.exit(2)
}
const all = rest.includes('--hepsi')
const want = rest.filter((a) => !a.startsWith('--'))
const list: readonly string[] = LISTS[kind]
let failed = false
for (const level of LEVELS.filter((l) => (all || list.includes(l.id)) && (!want.length || want.includes(l.id)))) {
  const r = solve(ruleLevel(kind, level), { exitOnly: true, budget: Number(process.env.BUDGET ?? 40000) })
  if (!r.won) failed = true
  console.log(`${r.won ? 'OK  ' : 'FAIL'} ${level.id.padEnd(10)} ${kind} çıkış:${r.won ? 'evet' : 'HAYIR'} durum:${r.expanded} ${r.ms}ms en uzak:${Math.round(r.far.x / 16)}`)
}
process.exit(failed ? 1 : 0)
