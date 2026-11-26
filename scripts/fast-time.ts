/**
 * Mücadelenin en hızlı makro süresi: çözücünün makrolarıyla süreye göre en iyi öncelikli arama (`solve` order 'time'),
 * bulunan yolu baştan oynatıp süresini (sn) doğrular. Altın madalya buna dayanır (game/challenges.ts `gold`: hızlı × 1,15).
 * Makrolar kabadır (yürüyüş durarak biter, bekleme 0,5 sn'lik): süre gerçek en hızlı koşunun biraz üstündedir.
 * Kullanım: npx tsx scripts/fast-time.ts [mücadele-id ...]   (BUDGET: açılacak durum sayısı, varsayılan 60000;
 * SPEED: A* tahmininin hızı, varsayılan 285 px/sn; REVISIT: anahtar başına varış, varsayılan 1, varılamazsa 4)
 * Çıktı: id par altın hızlı önerilen-altın durum ms (bütçe dolduysa "bütçe" yazar: süre en iyi olmayabilir)
 */
import { ALL_CHALLENGES, challengeLevel, goldOf } from '../game/challenges'
import { World } from '../game/sim'
import { holdPlates, runMacro, solve } from './solver'

const budget = Number(process.env.BUDGET ?? 60000)
// A* tahmininin hızı (px/sn): en yüksek yatay hız (dash 285) tahmini iyimser tutar (yalnız yay fırlatışı dikeyde daha hızlı),
// bütçe dolmadıysa süre en iyi makro yoludur; küçültmek hızlandırır
// ama en iyi süreyi kaçırabilir. 0: yalnız süre (Dijkstra, çok yavaş)
const speed = Number(process.env.SPEED ?? 285)
const revisit = Number(process.env.REVISIT ?? 1)
const ids = process.argv.slice(2)
let failed = false
for (const c of ALL_CHALLENGES.filter((c) => !ids.length || ids.includes(c.id))) {
  const level = challengeLevel(c)
  // anahtar başına tek varış yetmezse (saate bağlı ama anahtarda olmayan bir şey en erken varışı çıkmaza sokar) dörtle yeniden dene
  let r = solve(level, { exitOnly: true, trace: true, order: 'time', speed, budget, revisit })
  if (!r.won && revisit === 1) r = solve(level, { exitOnly: true, trace: true, order: 'time', speed, budget, revisit: 4 })
  if (!r.won) {
    failed = true
    console.log(`FAIL ${c.id} çıkışa varılamadı (durum:${r.expanded})`)
    continue
  }
  // yolu baştan oynat: aramanın bulduğu süre gerçekten oynanıyor mu
  const w = new World(level)
  w.enemies.length = 0
  w.turrets.length = 0
  w.boss = null
  w.boss2 = null
  for (const m of r.path) {
    holdPlates(w)
    runMacro(w, m, () => (w.events.length = 0))
  }
  const fast = w.complete ? w.time : r.best
  // aynı yol düşmanlar ve oklar açıkken: çözücü onları görmez, ölüyorsa gerçek koşu beklemek zorunda (altın daha sıkı kalır)
  const e = new World(level)
  e.boss = null
  e.boss2 = null
  const foes = e.enemies.length + e.turrets.length
  for (const m of r.path) {
    holdPlates(e)
    runMacro(e, m, () => (e.events.length = 0))
  }
  const foe = foes ? ` düşman:${foes}${e.deaths ? ` (yol ${e.deaths} kez ölür)` : ''}` : ''
  const full = r.expanded >= budget ? ' bütçe' : ''
  console.log(`${c.id} par:${c.par} altın:${goldOf(c)} hızlı:${fast.toFixed(2)} öneri:${Math.ceil(fast * 1.15)} durum:${r.expanded} ${r.ms}ms${w.complete ? '' : ' oynatma-tutmadı'}${foe}${full}`)
}
process.exit(failed ? 1 : 0)
