import { medalFor, type Medal } from '@/components/medal'
import { NO_KIT, type Hero, type Kit } from '@/game/accessories'
import { LEVELS } from '@/game/levels'
import { ACHIEVEMENTS, isEarned } from '@/lib/achievements'
import { emptyStats, liveStreak, travelerTitle } from '@/lib/extras'
import { kitOf, scarfIdOf, titleFacts, type Save } from '@/lib/storage'

/** Profilde bir şehrin satırı: en iyi süre, madalya ve toplananlar */
export interface ProfileCity {
  id: string
  timeMs: number
  deaths: number
  items: number
  plays?: number
  /** şehrin bütün yolcuları arasında süre sırası (yalnız herkese açık profilde) */
  rank?: number
  medal: Medal | null
  /** %100: üç hatıra, pul ve nazar aynı koşuda */
  full: boolean
  stamp: boolean
  charm: boolean
  boss: boolean
}

/** Profil kartının bütün verisi: oyun içi (kayıttan) ve herkese açık sayfa (sunucudan) aynı biçimi kullanır */
export interface ProfileData {
  name: string
  /** katılım günü (ISO); oyun içinde bilinmeyebilir */
  since: string | null
  hero: Hero
  kit: Kit
  scarf: string
  /** unvan (TR; arayüzde t() ile çevrilir) */
  title: string
  cities: Record<string, ProfileCity>
  /** kazanılan başarımların kimlikleri */
  earned: string[]
  /** vitrine sabitlenen en çok üç başarım (kazanılmış olanlar) */
  pins: string[]
  totals: { keeps: number; stamps: number; charms: number; bosses: number; golds: number; seals: number }
  trioDays: number
  streak: number
  /** Haftalık Turnuva kürsüleri: sıra (1-3) → kaç kez */
  podium: Record<number, number>
  /** son rekorlar (yeniden eskiye); yalnız herkese açık profilde */
  recent: { id: string; timeMs: number; at: string }[]
  runs: number
  playMs: number
}

const isHero = (h: unknown): h is Hero => h === 'uktun' || h === 'memo'

/** Vitrin: sabitlenenler (kazanılmış olanlar); hiç sabitlenmediyse en son kazanılan üç başarım */
export function showcase(earned: string[], pins: string[] | undefined): string[] {
  const own = (pins ?? []).filter((id, i, a) => earned.includes(id) && a.indexOf(id) === i).slice(0, 3)
  if (own.length || (pins && pins.length)) return own
  return ACHIEVEMENTS.filter((a) => earned.includes(a.id)).map((a) => a.id).slice(-3).reverse()
}

/** Kayıttan profil verisi (oyuncunun kendi defteri ya da bulut kaydı); süre sırası ve katılım günü dışarıdan gelir */
export function profileFromSave(s: Save, today: string, who: { name: string; since?: string | null }): ProfileData {
  const hero: Hero = isHero(s.character) ? s.character : 'uktun'
  const cities: Record<string, ProfileCity> = {}
  for (const l of LEVELS) {
    const b = s.best[l.id]
    if (!b) continue
    cities[l.id] = {
      id: l.id,
      timeMs: b.timeMs,
      deaths: b.deaths,
      items: b.items.filter(Boolean).length,
      medal: b.stale ? null : medalFor(l, b.timeMs),
      full: s.full?.[l.id] != null,
      stamp: !!s.stamps[l.id],
      charm: !!s.charms[l.id],
      boss: !!s.bosses[l.id],
    }
  }
  const earned = ACHIEVEMENTS.filter((a) => isEarned(a, s)).map((a) => a.id)
  const stats = s.stats ?? emptyStats()
  return {
    name: who.name,
    since: who.since ?? null,
    hero,
    kit: kitOf(s, hero) ?? NO_KIT,
    scarf: scarfIdOf(s, hero),
    title: travelerTitle(titleFacts(s, today)),
    cities,
    earned,
    pins: showcase(earned, s.pins),
    totals: {
      keeps: LEVELS.reduce((a, l) => a + (s.best[l.id]?.items.filter(Boolean).length ?? 0), 0),
      stamps: LEVELS.filter((l) => s.stamps[l.id]).length,
      charms: LEVELS.filter((l) => s.charms[l.id]).length,
      bosses: LEVELS.filter((l) => s.bosses[l.id]).length,
      golds: Object.values(cities).filter((c) => c.medal === 'altin').length,
      seals: LEVELS.filter((l) => s.ustalar?.[l.id]).length,
    },
    trioDays: s.trio?.days ?? 0,
    streak: liveStreak(s.meydan, today),
    podium: {},
    recent: [],
    runs: stats.runs,
    playMs: stats.playMs,
  }
}

/** Şehirde en iyi sırası olan (eşitlikte hızlı) şehir: "Beni Geç" bağlantısı ve skor kartı bunu seçer */
export function bestCity(d: ProfileData): ProfileCity | null {
  const list = Object.values(d.cities)
  if (!list.length) return null
  return [...list].sort((a, b) => (a.rank ?? 99999) - (b.rank ?? 99999) || (a.medal ? 0 : 1) - (b.medal ? 0 : 1) || a.timeMs - b.timeMs)[0]
}
