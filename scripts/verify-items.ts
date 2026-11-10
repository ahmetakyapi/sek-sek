/**
 * Toplanabilir her şey (hatıralar C, gizli pul $, nazar boncuğu !, anahtar K) her yaştan oyuncu için adil mi:
 *  1. Zayıf oyuncu (zıplama %5, koşu %8 düşük) alabiliyor mu: kıl payı atlayış, 3 karodan geniş boşluk yakalanır.
 *  2. Aldığı yerden çıkışa varabiliyor mu: gizli köşe kapan olmasın (cebe düşen, oradan çıkamayan oyuncu).
 *     Alındığı anın durumu (o anki düğme ve anahtar hâliyle) çözücüden gelir.
 * Görünürlük çizimin işidir: sahte duvar (%) karanlık bir tünel ağzı, ardındaki cep mağara olarak çizilir (terrainDraw).
 *
 *   npx tsx scripts/verify-items.ts [şehir]
 */
import { LEVELS } from '../game/levels'
import { PHYS } from '../game/sim'
import { T } from '../game/types'
import { solve } from './solver'

const phys = PHYS as unknown as Record<string, number>
const base = { ...phys }
let failed = false
const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const t0 = Date.now()
  Object.assign(phys, { jumpV: base.jumpV * 0.95, wallJumpVY: base.wallJumpVY * 0.95, run: base.run * 0.92, dashSpeed: base.dashSpeed * 0.92 })
  const problems: string[] = []
  try {
    const r = solve(level, { budget: Number(process.env.BUDGET ?? 20000), grabs: true })
    const w = r.world
    const at = (b: { x: number; y: number }) => `@${Math.floor(b.x / T)},${Math.floor(b.y / T)}`
    const items: [string, { x: number; y: number }][] = [...w.pickups.map((p) => ['C' + p.index, p] as [string, { x: number; y: number }])]
    if (w.stampBox) items.push(['$', w.stampBox])
    if (w.charmBox) items.push(['!', w.charmBox])
    if (w.keyBox) items.push(['K', w.keyBox])
    for (const [id, box] of items) {
      const snaps = r.grabs.get(id)
      if (!snaps?.length) {
        problems.push(`${id} ${at(box)} zayıf oyuncu alamıyor`)
        continue
      }
      // anahtar kapısının ardı da çıkış yoludur: anahtarla birlikte aranır
      if (!snaps.some((s) => solve(level, { exitOnly: true, budget: 9000, start: s }).won)) problems.push(`${id} ${at(box)} alınca çıkışa varılamıyor (kapan)`)
    }
  } finally {
    Object.assign(phys, base)
  }
  if (problems.length) failed = true
  console.log(`${problems.length ? 'FAIL' : 'OK  '} ${level.name.padEnd(10)} ${problems.length ? problems.join(' · ') : 'hepsi alınır, hepsinden çıkılır'} · ${Date.now() - t0} ms`)
}
process.exit(failed ? 1 : 0)
