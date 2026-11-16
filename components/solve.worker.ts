/**
 * Bölüm Düzenleyici'nin "Bitirilebilir mi?" sınaması: çözücü (scripts/solver.ts) ana iş parçacığını kilitlemesin diye burada koşar.
 * Çözücü düşmanları ve okları kapatır; önce yalnız çıkışa giden yolu arar, bulursa o yolu baştan oynatıp süresini ölçer.
 * Haritada hatıra, pul ya da nazar varsa ikinci bir arama hangilerine varılabildiğini söyler (bilgi; bitirmeyi etkilemez).
 */
import { World } from '../game/sim'
import type { LevelDef } from '../game/types'
import { runMacro, solve } from '../scripts/solver'

export interface SolveRequest {
  level: LevelDef
  budget: number
}

export type SolveReply =
  | { won: true; seconds: number; items: [number, number]; stamp: boolean | null; charm: boolean | null }
  | { won: false; unsure: boolean; far: { x: number; y: number } }

const ctx = self as unknown as { postMessage(m: SolveReply): void; addEventListener(t: 'message', f: (e: MessageEvent<SolveRequest>) => void): void }

ctx.addEventListener('message', (e) => {
  const { level, budget } = e.data
  const r = solve(level, { exitOnly: true, budget, trace: true })
  if (r.won) {
    const w = new World(level)
    w.enemies.length = 0
    w.turrets.length = 0
    for (const m of r.path) runMacro(w, m, () => (w.events.length = 0))
    const total = w.pickups.length
    const all = total || w.stampBox || w.charmBox ? solve(level, { budget }) : null
    ctx.postMessage({
      won: true,
      seconds: w.time,
      items: [all?.picks.size ?? 0, total],
      stamp: w.stampBox ? !!all?.stamp : null,
      charm: w.charmBox ? !!all?.charm : null,
    })
    return
  }
  // bütçe bittiyse arama yarım kaldı: "varamadı" değil "emin olunamadı"
  ctx.postMessage({ won: false, unsure: r.expanded >= budget, far: r.far })
})
