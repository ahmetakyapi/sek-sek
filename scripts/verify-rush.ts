/**
 * Boss Rush çeşitlerinin kanıtı: Kâbus (her boss kademe 3, %30 hızlı) ve Çifte (boss'lar ikişer aynı arenada) arenalarını
 * boss botu gerçek fizikle dövüşür. Bunlar bilerek seçilen en zor modlar: tam görüşlü bot ve insan paylı bot (işarete
 * tepki veren oyuncu) yenmeli; zayıf oyuncu botları --zayif ile bilgi için koşar (FAIL saymaz). 18 Kasım 2026: 60 arenanın
 * hepsinde tam ve insan paylı bot yener; zayıf bot 56'sında. Çifte'de eşleşme oyundaki gibidir (rushPlan). Kullanım:
 *   npx tsx scripts/verify-rush.ts <kabus|cifte> [şehir ...] [--zayif]   (biri FAIL ise çıkış kodu 1)
 */
import { LEVELS, rushArena, type RushVariant } from '../game/levels'
import { rushPlan } from '../lib/extras'
import { fightBoss, type BotResult } from './bossbot'

const [variant, ...rest] = process.argv.slice(2) as [RushVariant, ...string[]]
if (variant !== 'kabus' && variant !== 'cifte') {
  console.log('kullanım: verify-rush.ts <kabus|cifte> [şehir ...] [--zayif]')
  process.exit(2)
}
const weak = rest.includes('--zayif')
const want = rest.filter((a) => !a.startsWith('--'))
const all = LEVELS.map((_, i) => i)
const plan = rushPlan(all, variant)
const show = (r: BotResult) => (r.won ? `${String(Math.round(r.seconds)).padStart(3)} sn, ${r.deaths} düşüş` : `yenemedi (kalan can ${r.hpLeft}, ${r.deaths} düşüş)`)
let fail = false
plan.order.forEach((i, k) => {
  const second = plan.pairs?.[k]
  const ids = [LEVELS[i].id, ...(second !== undefined && second >= 0 ? [LEVELS[second].id] : [])]
  if (want.length && !ids.some((id) => want.includes(id))) return
  const level = rushArena(LEVELS[i], variant, second)
  const t0 = Date.now()
  const limit = variant === 'cifte' ? 300 : 200
  const runs = [fightBoss(level, { limit }), fightBoss(level, { sight: 'telegraph', limit: limit * 1.6 })]
  const ok = runs.every((r) => r.won)
  fail ||= !ok
  const info = weak ? [fightBoss(level, { weak: true, limit }), fightBoss(level, { weak: true, sight: 'telegraph', limit: limit * 1.6 })] : []
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${variant} ${ids.join('+').padEnd(20)} bot ${show(runs[0])} · insan paylı ${show(runs[1])}${weak ? ` · (bilgi) zayıf ${show(info[0])} · insan paylı zayıf ${show(info[1])}` : ''} · ${Date.now() - t0} ms`)
})
process.exit(fail ? 1 : 0)
