/**
 * Yeniden doğuş denetimi: oyuncu hangi bayrakta, hangi düğme / anahtar durumuyla ölürse ölsün
 * oradan çıkışa varabiliyor mu? (verify-levels bölümü hiç ölmeden çözer; bu, ölümden sonrasını kanıtlar.)
 *
 * Çözücü bölümü gezerken her bayrağa ve meydan kapısının varışına ulaştığı durumları toplar; her biri için
 * dünyayı o ana alır, oyuncuyu öldürüp yeniden doğurur ve çıkışı oradan arar.
 * Kullanım: npx tsx scripts/verify-respawn.ts [şehir]
 */
import { LEVELS } from '../game/levels'
import { World, restore, snapshot } from '../game/sim'
import { T } from '../game/types'
import { solve } from './solver'

let failed = false
const only = process.argv[2]
for (const level of LEVELS.filter((l) => !only || l.id === only)) {
  const t0 = Date.now()
  const base = solve(level, { budget: Number(process.env.BUDGET ?? 9000) })
  const bad: string[] = []
  for (const a of base.arrivals) {
    const w = new World(level)
    w.boss = null
    restore(w, a.snap)
    w.respawn()
    const r = solve(level, { exitOnly: true, budget: 9000, start: snapshot(w) })
    if (!r.won) bad.push(`${a.index < 0 ? 'meydan varışı' : `bayrak ${a.index + 1}`} (düğme ${a.switchOn ? 'açık' : 'kapalı'}, anahtar ${a.hasKey ? 'var' : 'yok'}) → takılır @${Math.floor(r.far.x / T)},${Math.floor(r.far.y / T)}`)
  }
  const cpCount = new World(level).checkpoints.length
  const seen = new Set(base.arrivals.map((a) => a.index)).size
  if (bad.length || seen < cpCount + 1) failed = true
  console.log(`${bad.length || seen < cpCount + 1 ? 'FAIL' : 'OK  '} ${level.name.padEnd(9)} doğuş noktası ${seen}/${cpCount + 1} · denenen durum ${base.arrivals.length} · ${Date.now() - t0} ms`)
  for (const b of bad) console.log('  - ' + b)
}
process.exit(failed ? 1 : 0)
