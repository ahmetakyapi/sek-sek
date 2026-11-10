/**
 * Meydan yolunu (game/finales/<şehir>.ts) tek başına, saniyeler içinde dener:
 *   - tam hareket setiyle sona varılıyor, nazar boncuğu alınabiliyor mu
 *   - zayıf oyuncu (zıplama %5 alçak, koşu %8 yavaş) sona varabiliyor mu
 *   - yalnız yürü + zıpla yetiyor mu, yoksa atılma / duvar sekmesi nerede şart (bilgi)
 * Kullanım: npx tsx scripts/verify-prelude.ts <şehir> [--goster]
 */
import { PRELUDES, buildRoad } from '../game/finales'
import { LEVELS, chunk } from '../game/levels'
import { PHYS, World } from '../game/sim'
import { T, type LevelDef } from '../game/types'
import { solve } from './solver'

const id = process.argv[2]
const base = LEVELS.find((l) => l.id === id)
if (!base) throw new Error(`şehir yok: ${id}`)
const road = buildRoad(base.city, chunk, (r) => r)
const END = chunk(['      ', '   E  ', '######', '######', '######', '######'])
// varış işareti başlangıç olur; kapı ve patron bu denemede yok
const map = road.map((r, y) => '##' + r.replace('&', 'P') + END[y])
const level: LevelDef = { ...base, map }
if (process.argv.includes('--goster')) console.log(map.map((r, y) => String(y).padStart(2) + ' ' + r).join('\n'))

const pre = PRELUDES[base.city]
const count = (ch: string) => map.join('').split(ch).length - 1
const problems: string[] = []
for (const ch of 'CK$DPE@&QG') if (pre.chunks.flat().join('').includes(ch)) problems.push(`yasak karakter '${ch}'`)
if (count('?') !== pre.hints.length) problems.push(`tabela ${count('?')} ama ipucu ${pre.hints.length}`)
if (pre.hints.length !== pre.hintsEn.length) problems.push('hints ile hintsEn sayısı farklı')
if (count('n') !== (pre.npcs?.length ?? 0)) problems.push(`n ${count('n')} ama npcs ${pre.npcs?.length ?? 0}`)
if ((pre.npcs?.length ?? 0) !== (pre.npcsEn?.length ?? 0)) problems.push('npcs ile npcsEn sayısı farklı')
if (count('!') !== 1) problems.push(`nazar boncuğu (!) tam bir tane olmalı, ${count('!')} var`)
const cols = map[0].length - 8
if (cols < 46 || cols > 78) problems.push(`genişlik ${cols} karo (46–78 olmalı)`)
const w0 = new World(level)
const flags = [0, ...w0.checkpoints.map((c) => c.x / T), w0.exit.x / T]
for (let i = 1; i < flags.length; i++) if (flags[i] - flags[i - 1] > 75) problems.push('bayraklar arası 75 karodan uzun')

const where = (r: { won: boolean; far: { x: number; y: number } }) => (r.won ? 'geçer' : `takılır @${Math.floor(r.far.x / T)},${Math.floor(r.far.y / T)}`)
const full = solve(level, { budget: 12000 })
const phys = PHYS as unknown as Record<string, number>
const keep = { ...phys }
Object.assign(phys, { jumpV: keep.jumpV * 0.95, wallJumpVY: keep.wallJumpVY * 0.95, run: keep.run * 0.92, dashSpeed: keep.dashSpeed * 0.92 })
const weak = solve(level, { exitOnly: true, budget: 12000 })
Object.assign(phys, keep)
const basic = solve(level, { moves: 'basic', exitOnly: true, budget: 8000 })
if (!full.won) problems.push(`sona varılamıyor: ${where(full)}`)
if (!full.charm) problems.push('nazar boncuğuna ulaşılamıyor')
if (full.cps.size !== full.world.checkpoints.length) problems.push('bir bayrağa ulaşılamıyor')
if (!weak.won) problems.push(`zayıf oyuncu ${where(weak)}`)
console.log(`${problems.length ? 'FAIL' : 'OK  '} ${base.name} meydan yolu · ${cols} karo · tam: ${where(full)} · zayıf: ${where(weak)} · yürü+zıpla: ${where(basic)} · ${full.ms + weak.ms + basic.ms} ms`)
for (const p of problems) console.log('  - ' + p)
process.exit(problems.length ? 1 : 0)
