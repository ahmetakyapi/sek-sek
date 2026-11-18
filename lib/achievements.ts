import { medalFor } from '@/components/medal'
import { CHALLENGES, RAGE_COURSES } from '@/game/challenges'
import { LEVELS } from '@/game/levels'
import { RAGE_RULES, emptyStats, type RageRule } from './extras'
import type { Save } from './storage'

/**
 * Başarımlar: yolculuğun kilometre taşları. Çoğu kayıttan hesaplanır (şehir, hatıra, pul, nazar, boss, madalya, mod
 * rekorları, sayaçlar); birkaçı bir anda olan şeydir (hiç düşmeden Çok Zor bir şehir, vurulmadan boss) ve olduğu an
 * `save.feats`e yazılır. Kazanılanlar `save.ach`e geçer ki bildirim bir kez çıksın.
 * Adlar ve açıklamalar TR; İngilizcesi lib/ui.en.ts'te aynı anahtarla.
 */

/** Bir anda kazanılan başarımlar: Game.tsx yazar */
export type Feat = 'flawlessHard' | 'cleanBoss' | 'oneLifeFirst' | 'duel' | 'ghostBeaten' | 'streak7'

export interface Achievement {
  id: string
  name: string
  text: string
  icon: string
  /** [şu an, hedef]; tek seferlik olanlarda [0|1, 1] */
  progress: (s: Save) => [number, number]
}

const count = (rec: Record<string, boolean> | undefined) => LEVELS.filter((l) => rec?.[l.id]).length
const keeps = (s: Save) => LEVELS.reduce((a, l) => a + (s.best[l.id]?.items.filter(Boolean).length ?? 0), 0)
const cities = (s: Save) => LEVELS.filter((l) => s.best[l.id]).length
const golds = (s: Save, pick: (d: string) => boolean = () => true) =>
  LEVELS.filter((l) => pick(l.difficulty) && s.best[l.id] && !s.best[l.id].stale && medalFor(l, s.best[l.id].timeMs) === 'altin').length
const feat = (f: Feat) => (s: Save): [number, number] => [s.feats?.[f] ? 1 : 0, 1]
const stat = (k: keyof ReturnType<typeof emptyStats>, goal: number) => (s: Save): [number, number] => [Math.min(goal, (s.stats ?? emptyStats())[k]), goal]
const chals = (s: Save) => CHALLENGES.filter((c) => s.challenges?.[c.id]).length
const hard = (d: string) => d === 'Zor' || d === 'Çok Zor'
/** Sinir Bozucu rekorları (save.rules anahtarı `şehir:mod`) */
const rageKeys = (s: Save) => Object.keys(s.rules ?? {}).filter((k) => RAGE_RULES.includes(k.split(':')[1] as RageRule))
/** bir şehirde bitirilen en çok Sinir Bozucu mod */
const rageBestCity = (s: Save) => Math.max(0, ...Object.values(rageKeys(s).reduce<Record<string, number>>((m, k) => ({ ...m, [k.split(':')[0]]: (m[k.split(':')[0]] ?? 0) + 1 }), {})))
const courses = (s: Save) => RAGE_COURSES.filter((c) => s.challenges?.[c.id]).length
const N = LEVELS.length

export const ACHIEVEMENTS: Achievement[] = [
  // yolculuk
  { id: 'firstCity', name: 'İlk Sayfa', text: 'Bir şehri bitir.', icon: '✎', progress: (s) => [Math.min(1, cities(s)), 1] },
  { id: 'tenCities', name: 'Yolun Ortası', text: 'On şehri bitir.', icon: '⌖', progress: (s) => [Math.min(10, cities(s)), 10] },
  { id: 'allCities', name: 'Baştan Sona', text: 'Bütün şehirleri bitir.', icon: '⚑', progress: (s) => [cities(s), N] },
  // toplananlar
  { id: 'keeps30', name: 'Cep Dolusu', text: 'Otuz hatıra topla.', icon: '✦', progress: (s) => [Math.min(30, keeps(s)), 30] },
  { id: 'keepsAll', name: 'Defter Dolu', text: 'Bütün hatıraları topla.', icon: '❖', progress: (s) => [keeps(s), N * 3] },
  { id: 'stamps10', name: 'Pul Meraklısı', text: 'On gizli pul bul.', icon: '✉', progress: (s) => [Math.min(10, count(s.stamps)), 10] },
  { id: 'stampsAll', name: 'Pul Koleksiyoncusu', text: 'Bütün gizli pulları bul.', icon: '✉', progress: (s) => [count(s.stamps), N] },
  { id: 'charms10', name: 'Göz Değmesin', text: 'On nazar boncuğu bul.', icon: '◉', progress: (s) => [Math.min(10, count(s.charms)), 10] },
  { id: 'charmsAll', name: 'Nazar Değmez', text: 'Bütün nazar boncuklarını bul.', icon: '◉', progress: (s) => [count(s.charms), N] },
  // boss
  { id: 'bosses10', name: 'Meydan Okuyan', text: 'On boss yen.', icon: '♛', progress: (s) => [Math.min(10, count(s.bosses)), 10] },
  { id: 'bossesAll', name: 'Meydanların Efendisi', text: 'Bütün boss’ları yen.', icon: '♛', progress: (s) => [count(s.bosses), N] },
  { id: 'usta10', name: 'Çırak', text: 'On şehrin ustasının görevini yap.', icon: '⚒', progress: (s) => [Math.min(10, count(s.ustalar ?? {})), 10] },
  { id: 'ustaAll', name: 'Usta Eli', text: 'Bütün ustaların görevini yap.', icon: '⚒', progress: (s) => [count(s.ustalar ?? {}), N] },
  { id: 'full1', name: 'Hepsi Bir Arada', text: 'Bir şehri her şeyini aynı koşuda alarak bitir (%100).', icon: '✦', progress: (s) => [Math.min(1, Object.keys(s.full ?? {}).length), 1] },
  { id: 'cleanBoss', name: 'Tek Hamlede', text: 'Bir boss’u hiç düşmeden yen.', icon: '⚔', progress: feat('cleanBoss') },
  // madalya
  { id: 'gold5', name: 'Altın Adım', text: 'Beş şehirde altın madalya al.', icon: '●', progress: (s) => [Math.min(5, golds(s)), 5] },
  { id: 'goldHard', name: 'Zirvede Altın', text: 'Zor ya da Çok Zor bir şehirde altın madalya al.', icon: '●', progress: (s) => [Math.min(1, golds(s, hard)), 1] },
  { id: 'goldAll', name: 'Altın Ayak', text: 'Bütün şehirlerde altın madalya al.', icon: '★', progress: (s) => [golds(s), N] },
  { id: 'flawlessHard', name: 'Kusursuz', text: 'Çok Zor bir şehri hiç düşmeden bitir.', icon: '✧', progress: feat('flawlessHard') },
  // modlar
  { id: 'daily', name: 'Günün Yolcusu', text: 'Bir Günlük Meydan Okuma bitir.', icon: '☀', progress: (s) => [s.meydan ? 1 : 0, 1] },
  { id: 'streak7', name: 'Her Gün Yolda', text: 'Günlük Meydan Okuma’yı yedi gün üst üste oyna.', icon: '☀', progress: feat('streak7') },
  { id: 'rules7', name: 'Kural Ustası', text: 'Yedi farklı kuralda rekor yaz.', icon: '§', progress: (s) => [Math.min(7, new Set(Object.keys(s.rules ?? {}).map((k) => k.split(':')[1])).size), 7] },
  { id: 'rules20', name: 'Kural Kitabı', text: 'Kurallı Koşu’da yirmi rekor yaz.', icon: '§', progress: (s) => [Math.min(20, Object.keys(s.rules ?? {}).length), 20] },
  { id: 'oneLife', name: 'Tek Nefes', text: 'Tek Can kuralını ilk denemede bitir.', icon: '♥', progress: feat('oneLifeFirst') },
  { id: 'rush', name: 'Boss Rush', text: 'Boss Rush’ı bitir.', icon: '⚡', progress: (s) => [s.rush ? 1 : 0, 1] },
  { id: 'marathon', name: 'Maratoncu', text: 'Bir Maraton koş.', icon: '⇶', progress: (s) => [s.maraton ? 1 : 0, 1] },
  { id: 'rushPlus', name: 'Kâbus Avcısı', text: 'Kâbus ya da Çifte Boss Rush’ı bitir.', icon: '⚡', progress: (s) => [Object.keys(s.rushPlus ?? {}).length ? 1 : 0, 1] },
  { id: 'coop', name: 'Yol Arkadaşı', text: 'Co-op’ta bir şehri, parkuru ya da boss’u birlikte bitir.', icon: '♥', progress: (s) => [Object.keys(s.coop ?? {}).length ? 1 : 0, 1] },
  { id: 'coop10', name: 'Can Yoldaşı', text: 'Co-op’ta on farklı rekor yaz.', icon: '♥', progress: (s) => [Math.min(10, Object.keys(s.coop ?? {}).length), 10] },
  { id: 'duel', name: 'Düellocu', text: 'Bir Düello bitir.', icon: '⚔', progress: feat('duel') },
  { id: 'ghost', name: 'Hayalet Avcısı', text: 'Skor tablosundan bir yolcunun hayaletini geç.', icon: '◌', progress: feat('ghostBeaten') },
  { id: 'challenge3', name: 'Mücadeleci', text: 'Üç mücadele haritasını bitir.', icon: '▲', progress: (s) => [Math.min(3, chals(s)), 3] },
  { id: 'challengeAll', name: 'Hepsi Bitti', text: 'Bütün mücadele haritalarını bitir.', icon: '▲', progress: (s) => [chals(s), CHALLENGES.length] },
  // Sinir Bozucu: modlar ve Öfke Parkurları
  { id: 'rage1', name: 'Sabrın Sınavı', text: 'Bir Sinir Bozucu modu bitir.', icon: '✸', progress: (s) => [Math.min(1, rageKeys(s).length), 1] },
  { id: 'rage25', name: 'Öfke Kontrolü', text: 'Yirmi beş Sinir Bozucu rekoru yaz.', icon: '✸', progress: (s) => [Math.min(25, rageKeys(s).length), 25] },
  { id: 'rageCity', name: 'Taş Gibi Sabır', text: 'Bir şehirde on sekiz Sinir Bozucu modun hepsini bitir.', icon: '✸', progress: (s) => [Math.min(RAGE_RULES.length, rageBestCity(s)), RAGE_RULES.length] },
  { id: 'course3', name: 'Parkur Avcısı', text: 'Üç Öfke Parkuru bitir.', icon: '⚑', progress: (s) => [Math.min(3, courses(s)), 3] },
  { id: 'courseAll', name: 'Öfkenin Efendisi', text: 'Bütün Öfke Parkurlarını bitir.', icon: '⚑', progress: (s) => [courses(s), RAGE_COURSES.length] },
  // sayaçlar
  { id: 'jumps', name: 'Sek Sek', text: 'Bin kez zıpla.', icon: '⤒', progress: stat('jumps', 1000) },
  { id: 'dashes', name: 'Rüzgâr Gibi', text: 'Beş yüz dash at.', icon: '➤', progress: stat('dashes', 500) },
  { id: 'stomps', name: 'Ayak Basan', text: 'Yüz düşmanın üstüne bas.', icon: '▼', progress: stat('stomps', 100) },
  { id: 'falls', name: 'Düşe Kalka', text: 'Yüz kez düş, yine kalk.', icon: '↻', progress: stat('deaths', 100) },
  { id: 'hour', name: 'Yolda Bir Saat', text: 'Oyunda bir saat geçir.', icon: '◷', progress: stat('playMs', 3_600_000) },
]

export const isEarned = (a: Achievement, s: Save) => {
  const [n, goal] = a.progress(s)
  return n >= goal
}

/** Kazanılmış ama henüz bildirilmemiş başarımlar (kayıttaki `ach`te olmayanlar) */
export const freshAchievements = (s: Save) => ACHIEVEMENTS.filter((a) => isEarned(a, s) && !s.ach?.[a.id])
