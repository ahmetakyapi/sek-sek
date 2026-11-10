/**
 * Toplanacak şeyler oyuncuya "buraya çıkılır" dedirtiyor mu: her hatıra, pul, nazar ve anahtar görünür bir
 * dayanağın zıplama menzilinde olmalı. Dayanak: üstünde durulan zemin ya da tahta, hareketli platformların
 * (iskele, kabin, halka, balon) geçtiği yol, yay (fırlattığı yükseklik), itilen sandık, tırmanılan duvar.
 * Menzil: dayanağın 3 karo yanı içinde ve en çok 4 karo yukarısı (zıplama + gövde boyu).
 * Gökyüzünde dayanaksız asılı duran şey, çözücü bir yol bulsa bile oyuncuya "ulaşılmaz" görünür: FAIL.
 *
 *   npx tsx scripts/audit-reach.ts [şehir]
 */
import { LEVELS } from '../game/levels'
import { CRUMBLE, DOOR, ICE, ONEWAY, PHYS, SOLID, TURRET, WET, World, BLOCK_A, BLOCK_B } from '../game/sim'
import { T, emptyInput } from '../game/types'

const UP = 4 * T
const SIDE = 3 * T
const SPRING_UP = (PHYS.springV * PHYS.springV) / (2 * PHYS.gravity) + 2 * T
let failed = false
const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const w = new World(level)
  const solid = (x: number, y: number) => {
    const t = w.tile(x, y)
    return t === SOLID || t === ICE || t === WET || t === TURRET || t === CRUMBLE || t === DOOR || t === BLOCK_A || t === BLOCK_B
  }
  const stand = (x: number, y: number) => (solid(x, y) || w.tile(x, y) === ONEWAY) && !solid(x, y - 1)
  // hareketli platformların taradığı üst yüzeyler (dünya pikseli): bir süre boş girdiyle akıt, konumları topla
  const tops: { x0: number; x1: number; y: number }[] = []
  w.enemies.length = 0
  w.turrets.length = 0
  w.boss = null
  const p = w.player
  for (let i = 0; i < 120 * 14; i++) {
    p.x = -999
    p.y = -999
    w.step(1 / 120, emptyInput())
    if (i % 6 === 0) for (const q of w.platforms) tops.push({ x0: q.x, x1: q.x + q.w, y: q.y })
  }
  // balon ve iniş-çıkış platformları binilince oynar: bütün yolları sayılır
  for (const q of w.platforms as unknown as { axis: string; x: number; w: number; min: number; max: number }[])
    if (q.axis === 'b' || q.axis === 'y') for (let y = q.min; y <= q.max; y += 8) tops.push({ x0: q.x, x1: q.x + q.w, y })
  const springs = w.springs.map((s) => ({ x: s.x + s.w / 2, y: s.y }))
  // sandık: itildiği sırada üstüne çıkılır (başladığı satırda birkaç karo öteye gidebilir)
  for (const k of w.crates) tops.push({ x0: k.x - 6 * T, x1: k.x + 7 * T, y: k.y })

  const items: [string, { x: number; y: number; w: number; h: number }][] = w.pickups.map((q) => ['C' + q.index, q])
  if (w.stampBox) items.push(['$', w.stampBox])
  if (w.charmBox) items.push(['!', w.charmBox])
  if (w.keyBox) items.push(['K', w.keyBox])
  const bad: string[] = []
  for (const [id, b] of items) {
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    const tx = Math.floor(cx / T)
    const ty = Math.floor(cy / T)
    let ok = false
    // zemin ve tahta
    for (let x = tx - 3; x <= tx + 3 && !ok; x++) for (let y = ty; y <= ty + 4 && !ok; y++) if (stand(x, y) && y * T - cy <= UP && y * T >= cy - 2) ok = true
    // hareketli platform yolları
    if (!ok) ok = tops.some((t) => cx > t.x0 - SIDE && cx < t.x1 + SIDE && t.y - cy <= UP && t.y >= cy - 4)
    // yay: üstündeki sütunda fırlattığı yükseklik
    if (!ok) ok = springs.some((s) => Math.abs(s.x - cx) <= SIDE && s.y - cy <= SPRING_UP && s.y >= cy)
    // tırmanılan duvar: şeyin yanında (1-2 karo) yere kadar inen duvar yüzü (havada asılı duvar dayanak sayılmaz:
    // aradan sekerek çıkmayı oyunun başında kimse tahmin etmez; Diyarbakır'ın başlangıç burcu bu yüzden basamak aldı)
    if (!ok)
      for (const dx of [-2, -1, 1, 2]) {
        if (!solid(tx + dx, ty) || solid(tx + dx - Math.sign(dx), ty)) continue
        let y = ty
        while (y < w.rows && solid(tx + dx, y) && !solid(tx + dx - Math.sign(dx), y)) y++
        if (y < w.rows && solid(tx + dx - Math.sign(dx), y)) ok = true
      }
    if (!ok) bad.push(`${id} @${tx},${ty}`)
  }
  if (bad.length) failed = true
  console.log(`${bad.length ? 'FAIL' : 'OK  '} ${level.name.padEnd(10)} ${bad.length ? 'dayanaksız: ' + bad.join(' · ') : 'hepsi bir dayanağın menzilinde'}`)
}
process.exit(failed ? 1 : 0)
