import type { Challenge } from '../challenges'
import { PUZZLE_COURSES_B } from './bulmaca'
import { TIMING_COURSES } from './zamanlama'

/**
 * Usta Parkurları (Modlar → Mücadeleler, şehir kesitlerinin altında): elle çizilmiş, kısa ama çok zor ve kafa yoran
 * bölümler. Kesitlerden farkı: şehrin yolundan alınmaz, bir fikri (ritim, gelgit, raylı platform, düğme sırası, sandık,
 * anahtar) baştan sona işler. Mücadele altyapısıyla oynanır (`map` dolu; skor `mucadele:<id>`, madalya `par`dan: altın
 * çözücünün süresinin %85'i, `goldOf`). Turnuvaya, Günün Mücadelesi'ne ve Gezgin Turu'na girmez (CHALLENGES'ta değil: haftanın seçimi kaymasın).
 * `level` görünüşü veren şehirdir, parkur o şehir bitince açılır. Kanıt: `npx tsx scripts/verify-challenges.ts <id>`.
 */
export const MASTER_COURSES: Challenge[] = [...TIMING_COURSES, ...PUZZLE_COURSES_B]
