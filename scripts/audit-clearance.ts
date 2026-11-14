/**
 * Baş payı denetimi: gövde 26 px çizilir ama fizik kutusu 1 karoya sığar; 1 karo yüksekliğindeki bir aralıkta
 * yürünebiliyorsa karakter tavanın içinden geçiyormuş gibi görünür. Bu betik her bölümde üstü katı, altı zemin olan
 * 1 karoluk ayakta durma yerlerini (yan yana en az 2 karo: yürünen koridor) listeler.
 * Kullanım: npx tsx scripts/audit-clearance.ts [şehir ...]   (bulgu varsa çıkış kodu 1)
 */
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'

const want = process.argv.slice(2)
let total = 0
for (const l of LEVELS) {
  if (want.length && !want.includes(l.id)) continue
  const w = new World(l)
  const low = (tx: number, ty: number) => !w.isSolid(tx, ty) && w.isSolid(tx, ty + 1) && w.isSolid(tx, ty - 1)
  const runs: string[] = []
  for (let ty = 1; ty < w.rows - 1; ty++) {
    let start = -1
    for (let tx = 0; tx <= w.cols; tx++) {
      const hit = tx < w.cols && low(tx, ty)
      if (hit && start < 0) start = tx
      if (!hit && start >= 0) {
        // iki ucu da kapalı cep (ulaşılamaz oyuk) sayılmaz: en az bir ucu açık olmalı
        const open = (start > 0 && !w.isSolid(start - 1, ty)) || (tx < w.cols && !w.isSolid(tx, ty))
        if (tx - start >= 2 && open) runs.push(`${start}-${tx - 1},${ty}`)
        start = -1
      }
    }
  }
  total += runs.length
  console.log(`${runs.length ? 'FAIL' : 'OK  '} ${l.id.padEnd(11)} alçak koridor: ${runs.length} ${runs.slice(0, 12).join(' ')}`)
}
process.exit(total ? 1 : 0)
