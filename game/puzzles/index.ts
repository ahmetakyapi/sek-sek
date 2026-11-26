import type { Challenge } from '../challenges'
import { PUZZLE_COURSES_B } from './bulmaca'
import { NATURE_COURSES } from './doga'
import { LEGEND_COURSES } from './efsane'
import { TIMING_COURSES } from './zamanlama'

/**
 * Usta Parkurları (Modlar → Mücadeleler, şehir kesitlerinin altında): elle çizilmiş, kısa ama çok zor ve kafa yoran
 * bölümler. Kesitlerden farkı: şehrin yolundan alınmaz, bir fikri (ritim, gelgit, raylı platform, düğme sırası, sandık,
 * anahtar) baştan sona işler. Mücadele altyapısıyla oynanır (`map` dolu; skor `mucadele:<id>`, altın `gold`:
 * en hızlı makro yolu × 1,15, `scripts/fast-time.ts`). Turnuvaya, Günün Mücadelesi'ne ve Gezgin Turu'na girmez (CHALLENGES'ta değil: haftanın seçimi kaymasın).
 * `level` görünüşü veren şehirdir, parkur o şehir bitince açılır. Kanıt: `npx tsx scripts/verify-challenges.ts <id>`.
 * Efsane Parkurları (`tier: 'efsane'`, efsane.ts) listenin sonunda kendi başlığıyla durur; bir Efsane parkuru, görünüş
 * şehri bitmiş ve en az üç Usta Parkuru tamamlanmışsa açılır (`legendOpen`). Yeni parkur yolu: `.claude/skills/yeni-parkur`.
 */
export const MASTER_COURSES: Challenge[] = [...TIMING_COURSES, ...PUZZLE_COURSES_B, ...NATURE_COURSES, ...LEGEND_COURSES]
