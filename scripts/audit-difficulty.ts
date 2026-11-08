/**
 * Zorluk denetimi: her yaştan oyuncu gözüyle bölümler ne kadar hassas oyun istiyor?
 *
 *  1. Teknik: çıkışa yalnız yürü + zıpla ile varılıyor mu; atılma ya da duvar sekmesi nerede şart?
 *  2. Tolerans: zıplaması %10 alçak, koşusu %8 yavaş bir oyuncu da geçebiliyor mu?
 *     Takıldığı yer kusursuz zamanlama ya da kıl payı mesafe isteyen yerdir.
 *  3. Tehlike yoğunluğu: bayraklar arası en uzun yol ve o yoldaki diken, çukur, düşman, ok, tokmak.
 *
 * Kullanım: npx tsx scripts/audit-difficulty.ts [şehir]
 */
import { LEVELS } from '../game/levels'
import { CRUMBLE, PHYS, SPIKE_DOWN, SPIKE_UP, World } from '../game/sim'
import { T } from '../game/types'
import { solve } from './solver'

const phys = PHYS as unknown as Record<string, number>
const base = { ...phys }
const nerf = () => Object.assign(phys, { jumpV: base.jumpV * 0.95, wallJumpVY: base.wallJumpVY * 0.95, run: base.run * 0.92, dashSpeed: base.dashSpeed * 0.92 })
const reset = () => Object.assign(phys, base)

const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const w = new World(level)
  const exitX = Math.floor(w.exit.x / T)
  const marks = [0, ...w.checkpoints.map((c) => Math.floor(c.x / T)).sort((a, b) => a - b), exitX]
  const segOf = (tx: number) => marks.findIndex((m, i) => i > 0 && tx < m) - 1

  // bölüm bölüm tehlikeler
  const seg = marks.slice(1).map(() => ({ spikes: 0, pits: 0, crumble: 0, enemies: 0, turrets: 0, hammers: 0, clocked: 0 }))
  for (let tx = 0; tx < w.cols; tx++) {
    const s = seg[Math.max(0, segOf(tx))]
    if (!s) continue
    let spike = false
    for (let ty = 0; ty < w.rows; ty++) {
      const t = w.tile(tx, ty)
      if (t === SPIKE_UP || t === SPIKE_DOWN) spike = true
      if (t === CRUMBLE) s.crumble++
    }
    if (spike) s.spikes++
    // dipte zemin yoksa çukur (düşen ölür)
    let floor = false
    for (let ty = w.rows - 3; ty < w.rows; ty++) if (w.tile(tx, ty) !== 0 && w.tile(tx, ty) !== SPIKE_UP) floor = true
    if (!floor) s.pits++
  }
  for (const e of w.enemies) if (seg[segOf(Math.floor(e.x / T))]) seg[segOf(Math.floor(e.x / T))].enemies++
  for (const tr of w.turrets) if (seg[segOf(tr.tx)]) seg[segOf(tr.tx)].turrets++
  for (const h of w.hammers) if (seg[segOf(Math.floor(h.x / T))]) seg[segOf(Math.floor(h.x / T))].hammers++
  for (const p of w.platforms) if ((p.axis === 'o' || p.axis === 'h') && seg[segOf(Math.floor(p.x / T))]) seg[segOf(Math.floor(p.x / T))].clocked++

  const basic = solve(level, { moves: 'basic', exitOnly: true, budget: 8000 })
  nerf()
  const weak = solve(level, { exitOnly: true, budget: 12000 })
  reset()

  const longest = Math.max(...marks.slice(1).map((m, i) => m - marks[i]))
  const where = (r: { won: boolean; far: { x: number; y: number } }) => (r.won ? 'geçer' : `takılır @${Math.floor(r.far.x / T)},${Math.floor(r.far.y / T)} (bölüm ${segOf(Math.floor(r.far.x / T)) + 1})`)
  console.log(`\n${level.name} · ${w.cols} karo · bayrak ${w.checkpoints.length} · en uzak bayrak arası ${longest} karo`)
  console.log(`  yürü+zıpla: ${where(basic)}   zayıf oyuncu: ${where(weak)}`)
  seg.forEach((s, i) => {
    const len = marks[i + 1] - marks[i]
    const load = s.spikes + s.pits * 1.5 + s.crumble * 0.3 + s.enemies * 2 + s.turrets * 3 + s.hammers * 3 + s.clocked * 1.5
    console.log(`  bölüm ${i + 1} [${marks[i]}–${marks[i + 1]}] ${len} karo · diken ${s.spikes} çukur ${s.pits} çöken ${s.crumble} düşman ${s.enemies} ok ${s.turrets} tokmak ${s.hammers} dönen ${s.clocked} · yük ${load.toFixed(0)}${load > 40 || len > 90 ? '  ⚠' : ''}`)
  })
}
