/**
 * Hile önleme (sunucu): bir koşunun süresi ve hayaleti fiziğe sığıyor mu. Saf işlevler; skor ve hayalet uçları kullanır,
 * tests/antiCheat.test.ts kanıtlar (her şehrin çözücü süresi alt sınırın üstünde: gerçek oyuncu reddedilmez).
 *
 * Alt sınır: oyuncu yatayda hiçbir anda dash hızını (PHYS.dashSpeed) geçemez. Dash sırasında platform taşımaz,
 * yürürken en hızlı platform (sema halkası ~43 px/sn) ve rüzgâr eklense de dash hızının altında kalınır. Bölüm
 * başlangıçtan meydan kapısına (@) ve varıştan (&) çıkışa yatay mesafe ister; bu mesafeyi dash hızıyla kesintisiz
 * koşmak bile bu kadar sürer. Üstüne güvenlik payı (SAFETY): boss, bekleme ve tırmanış hiç sayılmaz.
 */
import { GHOST_HZ } from '@/game/ghost'
import { ALL_CHALLENGES, challengeLevel } from '@/game/challenges'
import { LEVELS, FIRST_BOOK } from '@/game/levels'
import { PHYS, World } from '@/game/sim'
import { T, type LevelDef } from '@/game/types'
import { dailyMini, dailyRun } from './extras'

/** oyuncunun yatayda erişebileceği en yüksek hız (px/sn) */
export const VMAX_X = PHYS.dashSpeed
/** dikeyde: yay fırlatışı en hızlısı (düşüş 300, dash 285) */
export const VMAX_Y = PHYS.springV
/** fiziksel en kısa sürenin bu kadarı alt sınırdır */
export const SAFETY = 0.6

interface Geo {
  start: { x: number; y: number }
  /** yeniden doğulabilecek ya da ışınlanılabilecek yerler: başlangıç, bayraklar, meydan kapısının varışı */
  spawns: { x: number; y: number }[]
  exit: { x: number; y: number; w: number; h: number }
  /** başlangıçtan çıkışa zorunlu yatay mesafe (px) */
  dist: number
  /** meydan kapısı var mı (bir ışınlanma da ondan) */
  warp: boolean
}

const geoCache = new Map<string, Geo>()

/** haritanın ışınlanma noktaları ve zorunlu yatay mesafesi (bölüm başına bir kez hesaplanır) */
function geo(level: LevelDef): Geo {
  const hit = geoCache.get(level.id)
  if (hit) return hit
  const w = new World(level)
  const p = w.player
  const start = { x: p.x, y: p.y }
  // kutuya değmek yeter: oyuncunun genişliği ve hedef karonun genişliği mesafeden düşer
  const leg = (a: number, b: number) => Math.max(0, Math.abs(b - a) - (T + p.w))
  const dist = w.warp && w.arrival ? leg(start.x, w.warp.x) + leg(w.arrival.x, w.exit.x) : leg(start.x, w.exit.x)
  const spawns = [start, ...w.checkpoints.map((c) => ({ x: c.x + (T - p.w) / 2, y: c.y + T * 2 - p.h })), ...(w.arrival ? [w.arrival] : [])]
  const g = { start, spawns, exit: { ...w.exit }, dist, warp: !!(w.warp && w.arrival) }
  geoCache.set(level.id, g)
  return g
}

/** bölümün kabul edilen en kısa süresi (ms) */
export const minTimeMs = (level: LevelDef) => Math.floor(((geo(level).dist / VMAX_X) * SAFETY) * 1000)

/** bir boss arenasının kabul edilen en kısa süresi: her boss işaret, saldırı ve yorgunluk evresini bekler */
export const BOSS_FLOOR_MS = 6000

const byId = new Map(LEVELS.map((l) => [l.id, l]))

/**
 * Skor tablosu anahtarının alt sınırı (ms). Şehir (`istanbul@s`): haritası. Mücadele (`mucadele:<id>`) ve turnuva
 * (`turnuva:<hafta>:<id>`): kesilen harita. Günlük (`gunluk:<gün>`): o günün şehri (skor süre + ceza, süreden kısa
 * olamaz; Hızlı Dünya yalnız duvar saatini hızlandırır, oyun süresini değil). Bilinmeyen anahtar: 0 (yalnız genel sınır).
 * Ayna Yolu sunucuya yazılmaz; aynalı harita da aynı mesafeyi ister (`minTimeMs` mutlak değerle ölçer).
 */
export function minScoreMs(key: string): number {
  const [head, ...rest] = key.split(':')
  if (head === 'gunluk') {
    const l = byId.get(dailyRun(rest[0], LEVELS).levelId)
    return l ? minTimeMs(l) : 0
  }
  // Günün Mücadelesi: o günün kesiti; Günün Boss'u arenada boss'un üç işareti için sabit alt sınır; Boss Rush boss başına aynı
  if (head === 'gunluk-m') {
    const c = ALL_CHALLENGES.find((x) => x.id === dailyMini(rest[0]))
    return c ? minTimeMs(challengeLevel(c)) : 0
  }
  if (head === 'gunluk-b') return BOSS_FLOOR_MS
  if (head === 'bossrush') return BOSS_FLOOR_MS * (Number(rest[1]) || 1)
  // Kurallı Koşu ve Sinir Bozucu: şehrin kendi yolu (skor süreden kısa olamaz)
  if (head === 'kural') {
    const l = byId.get(rest[0])
    return l ? minTimeMs(l) : 0
  }
  if (head === 'mucadele' || head === 'turnuva') {
    const c = ALL_CHALLENGES.find((x) => x.id === rest[rest.length - 1])
    return c ? minTimeMs(challengeLevel(c)) : 0
  }
  // %100 koşusu şehrin kendi yolundan kısa olamaz; tam turlar ilk defterin bütün şehirlerinin toplamından
  if (head === 'yuzde') {
    const l = byId.get(rest[0])
    return l ? minTimeMs(l) : 0
  }
  if (head === 'tur' || head === 'aynatur') return LEVELS.slice(0, FIRST_BOOK).reduce((a, l) => a + minTimeMs(l), 0)
  const l = byId.get(key.split('@')[0])
  return l ? minTimeMs(l) : 0
}

/* ── Hayalet ─────────────────────────────────────────────────────────────── */

/**
 * Örnekler kare başına eklenir (game/ghost.ts record): bir karede dünya en çok 0,05 sn (Game.tsx dt sınırı) ve
 * artakalan bir adım ilerler, Hızlı Dünya'da 1,2 katı; yani bir örnek kendi anından bu kadar geç yazılmış olabilir.
 * İki örnek arası en çok 1/GHOST_HZ + FRAME_LAG saniyelik yol taşır.
 */
const FRAME_LAG = 0.07
/** yuvarlama, köşe ve kenar yardımı (px) */
const SLACK = 6

/**
 * Hayalet fiziğe sığıyor mu: örnekler arası yol en yüksek hızı aşmıyor, sıçramalar (ölüm, meydan kapısı) yalnız
 * yeniden doğulabilen yere ve en çok düşüş sayısı (+ meydan kapısı) kadar, koşu başlangıçta başlayıp çıkışın yanında bitiyor.
 * Sorun yoksa null, varsa kısa neden döner.
 */
export function ghostProblem(level: LevelDef, data: number[], deaths: number): string | null {
  const n = Math.floor(data.length / 3)
  if (n < 2) return 'Hayalet çok kısa'
  const g = geo(level)
  const at = (i: number) => ({ x: data[i * 3], y: data[i * 3 + 1] })
  const near = (a: { x: number; y: number }, b: { x: number; y: number }, r: number) => Math.abs(a.x - b.x) <= r && Math.abs(a.y - b.y) <= r
  const step = 1 / GHOST_HZ + FRAME_LAG
  const maxDx = VMAX_X * step + SLACK
  const maxDy = VMAX_Y * step + SLACK
  // ilk örnek ilk hareketten en çok bir kare sonra yazılır
  if (!near(at(0), g.start, VMAX_X * FRAME_LAG + T)) return 'Hayalet başlangıçta başlamıyor'
  let jumps = 0
  for (let i = 1; i < n; i++) {
    const a = at(i - 1)
    const b = at(i)
    if (Math.abs(b.x - a.x) <= maxDx && Math.abs(b.y - a.y) <= maxDy) continue
    // ışınlanma: ölüp bayrakta doğmak ya da meydan kapısından geçmek (doğduğu kareden sonra biraz yürümüş olabilir)
    if (!g.spawns.some((s) => near(b, s, maxDx))) return 'Hayalet fizikten hızlı'
    jumps++
  }
  if (jumps > deaths + (g.warp ? 1 : 0)) return 'Hayalet düşüş sayısıyla uyuşmuyor'
  // son örnek çıkışa varmadan önceki son karededir
  const last = at(n - 1)
  const e = g.exit
  const pad = maxDx + T
  if (last.x < e.x - pad || last.x > e.x + e.w + pad || last.y < e.y - pad || last.y > e.y + e.h + pad) return 'Hayalet çıkışta bitmiyor'
  // ortalama hız: her saniyelik pencere en çok VMAX_X kadar yatay yol taşır
  const win = GHOST_HZ
  for (let i = win; i < n; i++) {
    let path = 0
    let teleported = false
    for (let k = i - win + 1; k <= i; k++) {
      const d = Math.abs(data[k * 3] - data[(k - 1) * 3])
      if (d > maxDx) teleported = true
      path += d
    }
    if (!teleported && path > VMAX_X * (1 + FRAME_LAG) + SLACK) return 'Hayalet fizikten hızlı'
  }
  return null
}
