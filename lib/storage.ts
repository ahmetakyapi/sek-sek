import { LEVELS } from '@/game/levels'
import { emptyStats, liveStreak, mergeDaily, mergeStats, type DailyMark, type TitleFacts, type TravelStats } from './extras'
import { cityVersion, legacyVersion } from './mapVersion'

/**
 * Şehir sırası değişince (araya yeni şehir girince) artar; eski sıra ORDERS'a yazılır ki açılan şehir kimliğiyle
 * taşınsın. Haritanın kendisi değişince artırılmaz: o iş şehir başına sürümün (lib/mapVersion.ts), yalnız değişen
 * şehrin rekoru yenilenir.
 */
export const MAP_VERSION = 8
/** bu sürümden önceki süreler geçersiz: bölümlere final eklendi */
const TIMES_SINCE = 4

/** Çanakkale, Diyarbakır ve Sinop eklenmeden önceki on altı şehir */
const SIXTEEN = ['istanbul', 'kocaeli', 'izmir', 'ankara', 'konya', 'nevsehir', 'adana', 'gaziantep', 'mardin', 'malatya', 'corum', 'ordu', 'trabzon', 'sivas', 'ardahan', 'bayburt']

/** Edirne, Bursa, Antalya, Şanlıurfa, Van ve Erzurum eklenmeden önceki on dokuz şehir */
/** Kayseri, Hatay ve Eskişehir’den önceki 25 şehir (harita sürümü 6 ve 7) */
const TWENTY_FIVE = ['istanbul', 'edirne', 'kocaeli', 'bursa', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir', 'adana', 'gaziantep', 'sanliurfa', 'diyarbakir', 'mardin', 'malatya', 'corum', 'sinop', 'ordu', 'trabzon', 'sivas', 'van', 'erzurum', 'ardahan', 'bayburt']
const NINETEEN = ['istanbul', 'kocaeli', 'canakkale', 'izmir', 'ankara', 'konya', 'nevsehir', 'adana', 'gaziantep', 'diyarbakir', 'mardin', 'malatya', 'corum', 'sinop', 'ordu', 'trabzon', 'sivas', 'ardahan', 'bayburt']

/** Eski sürümlerin şehir sırası: açılan şehir dizinini kimliğiyle yeni sıraya taşımak için */
const ORDERS: Record<number, string[]> = {
  1: ['istanbul', 'kocaeli', 'izmir', 'ankara', 'adana', 'mardin', 'malatya', 'corum', 'ordu', 'sivas', 'ardahan', 'bayburt'],
  2: ['istanbul', 'kocaeli', 'izmir', 'ankara', 'konya', 'nevsehir', 'adana', 'gaziantep', 'mardin', 'malatya', 'corum', 'ordu', 'sivas', 'ardahan', 'bayburt'],
  3: SIXTEEN,
  4: SIXTEEN,
  5: NINETEEN,
  6: TWENTY_FIVE,
  7: TWENTY_FIVE,
}

export interface Best {
  timeMs: number
  deaths: number
  items: boolean[]
  /** süre eski haritadan kaldı: gösterilmez, ilk yeni koşu yerine geçer (hatıralar kalır) */
  stale?: boolean
  /** rekorun koşulduğu şehir haritası (lib/mapVersion.ts cityVersion) */
  v?: string
  /** Rahat Mod'da koşuldu: skor tablosuna aktarılmaz */
  relaxed?: boolean
}

export interface Player {
  id: string
  name: string
  token: string
}

export interface Save {
  unlocked: number
  best: Record<string, Best>
  name: string
  sfx: boolean
  music: boolean
  touch: 'auto' | 'on' | 'off'
  character: 'uktun' | 'memo' | null
  /** hikâye kendiliğinden açılmasın: okundu, geçildi ya da yeni oyuncu doğrudan oyuna girdi */
  seenStory: boolean
  /** oyun içi adım adım rehber (yalnız ilk oynayış): ilk bölüm bitince ya da adımlar tamamlanınca kapanır */
  tutorial: boolean
  controlSize: 'normal' | 'buyuk'
  keyHints: boolean
  /** Rahat Mod: dünya %80 hızda; skorlar tabloya yazılmaz */
  relaxed: boolean
  /** en iyi koşunun hayaleti görünsün mü */
  ghost: boolean
  player: Player | null
  skippedName: boolean
  stamps: Record<string, boolean>
  /** bulunan nazar boncukları (şehir kimliği → bulundu) */
  charms: Record<string, boolean>
  /** yenilen boss’lar (şehir kimliği → yenildi) */
  bosses: Record<string, boolean>
  /** atkı rengi (lib/extras.ts SCARVES) */
  scarf: string
  /** Günün Şehri: son tamamlanan gün ve toplam */
  daily: { last: string; count: number }
  /** Haftanın Görevi: son tamamlanan hafta ve toplam */
  weekly: { last: string; count: number }
  /** Günlük Meydan Okuma: son oynanan gün, o günün en iyi skoru, üst üste oynanan gün sayısı */
  meydan?: DailyMark | null
  /** yolculuğun sayaçları: zıplama, dash, düşüş, oyunda geçen süre */
  stats?: TravelStats
  /** Boss Rush’ın en iyi süresi (ms) ve o koşudaki boss sayısı */
  rush: { timeMs: number; bosses: number } | null
  /** Maraton'un (rastgele üç şehir arka arkaya) en iyi toplam süresi */
  maraton?: { timeMs: number } | null
  /** eski haritalardan kalan süreler işaretlendi mi (bir kez) */
  timesReset?: boolean
  /** kaydın ait olduğu harita sürümü (şehir sırası) */
  mapVersion: number
  /** haritası yenilendiği için rekoru sıfırlanan, oyuncunun henüz görmediği şehirler */
  renewed?: string[]
  /** oyuncunun bildiği şehirler: sonradan eklenenler "yeni şehir" notunda görünür */
  seen?: string[]
  /** arayüz dili */
  lang: 'tr' | 'en'
  /** eski sıradan yeni sıraya taşındı mı (aynı sürümde iki kez taşınmasın) */
  migrated?: boolean
  /** hesap sürümü: 2 = kullanıcı adı + şifre; eski şifresiz kimlikler geçersiz */
  accountVersion?: number
  /**
   * Bu tarayıcıdaki ilerlemenin sahibi: hesabın kimliği, ya da null (misafir ilerlemesi). Asıl kayıt veritabanıdır;
   * başka bir hesaba ait ilerleme yeni girişe karışmaz, misafir ilerlemesi ilk girişte hesaba aktarılır.
   */
  owner?: string | null
}

const KEY = 'seksek:v1'
/** 8 Kasım'a dek anahtar `memleket:v1`di; ilk açılışta yeni anahtara taşınır, ilerleme kaybolmaz. */
const LEGACY_KEY = 'memleket:v1'

export const defaultSave = (): Save => ({ unlocked: 0, best: {}, name: '', sfx: true, music: true, touch: 'auto', character: null, seenStory: false, tutorial: true, controlSize: 'normal', keyHints: true, relaxed: false, ghost: true, player: null, skippedName: false, stamps: {}, charms: {}, bosses: {}, scarf: 'al', daily: { last: '', count: 0 }, weekly: { last: '', count: 0 }, rush: null, mapVersion: MAP_VERSION, lang: 'tr', accountVersion: 2, renewed: [], seen: LEVELS.map((l) => l.id) })

export function loadSave(): Save {
  try {
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY)
      if (raw) {
        localStorage.setItem(KEY, raw)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    if (!raw) return defaultSave()
    return normalizeSave(JSON.parse(raw) as Partial<Save>)
  } catch {
    return defaultSave()
  }
}

/** Ham kaydı (yerel depodan ya da buluttan) bugünkü biçime getirir: eski sürümlerin alanları ve şehir sırası taşınır. */
export function normalizeSave(parsed: Partial<Save>): Save {
  const s = { ...defaultSave(), ...parsed }
  if (parsed.mapVersion === undefined) s.mapVersion = 1
  // rehber alanından önceki kayıt: yalnız henüz hiç oynamamış oyuncu rehberi görür
  if (parsed.tutorial === undefined) s.tutorial = !parsed.seenStory && !parsed.unlocked && !Object.keys(parsed.best ?? {}).length
  // haritalar uzadı: eski süreler yeni yolla yarışamaz (hatıralar kalır), eski hayalet koşular silinir
  if (s.mapVersion < TIMES_SINCE && !parsed.timesReset) {
    for (const b of Object.values(s.best)) b.stale = true
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k?.startsWith('seksek:ghost:')) localStorage.removeItem(k)
      }
    } catch {
      /* depo yoksa silinecek hayalet de yok */
    }
    s.timesReset = true
  }
  // eski sıradaki açılan şehri kimliğiyle yeni sıraya taşı (bir kez)
  const order = ORDERS[s.mapVersion]
  if (order && !parsed.migrated) {
    const id = order[Math.min(s.unlocked, order.length - 1)]
    const idx = LEVELS.findIndex((l) => l.id === id)
    s.unlocked = idx >= 0 ? idx : 0
  }
  // bilinen şehirler: alan yoksa kaydın sürümündeki sıra (sonradan eklenenler "yeni" görünür)
  if (!parsed.seen) s.seen = order && (s.unlocked > 0 || Object.keys(s.best).length) ? [...order] : LEVELS.map((l) => l.id)
  // şehir başına sürüm: sürümsüz eski rekor, kaydın sürümündeki haritaya bağlanır; haritası değişen şehrin rekoru
  // eskir (hatıralar kalır) ve oyuncuya hangi şehirlerin yenilendiği söylenir. Öteki şehirlere dokunulmaz.
  const renewed = new Set(s.renewed ?? [])
  const best: Record<string, Best> = {}
  for (const [id, b0] of Object.entries(s.best)) {
    const b = { ...b0 }
    if (b.v === undefined && !b.stale) {
      const v = legacyVersion(id, s.mapVersion)
      if (v) b.v = v
      else b.stale = true
    }
    if (!b.stale && b.v !== cityVersion(id)) {
      b.stale = true
      renewed.add(id)
    }
    best[id] = b
  }
  s.best = best
  s.renewed = [...renewed]
  if (s.mapVersion !== MAP_VERSION) {
    s.mapVersion = MAP_VERSION
    s.migrated = false
  }
  // şifresiz eski yolcu kimlikleri silindi: oyuncu bir kez üye olur ya da giriş yapar
  if ((parsed.accountVersion ?? 1) < 2) {
    s.player = null
    s.skippedName = false
    s.accountVersion = 2
  }
  // eski sürümdeki "ayla" seçimi Uktun'a taşınır
  if ((s.character as string) === 'ayla') s.character = 'uktun'
  if ((s.character as string) === 'kerem') s.character = 'memo'
  return s
}

/** Buluta giden kısım: ilerleme ve kimlik seçimleri. Cihaza ait ayarlar (ses, tuşlar, dil, oturum) yerelde kalır. */
const CLOUD_KEYS = ['unlocked', 'best', 'stamps', 'charms', 'bosses', 'scarf', 'daily', 'weekly', 'rush', 'character', 'seenStory', 'tutorial', 'mapVersion', 'migrated', 'timesReset', 'accountVersion', 'renewed', 'seen', 'meydan', 'stats', 'maraton'] as const
export const cloudPart = (s: Save) => Object.fromEntries(CLOUD_KEYS.map((k) => [k, s[k]])) as Partial<Save>

/**
 * Yerel kayıt ile bulut kaydını birleştirir; hiçbir ilerleme kaybolmaz: açılan şehir en ilerisi, şehir başına en iyi
 * süre ve bütün hatıralar, pul / nazar / boss birleşimi, görev sayaçlarının büyüğü, Boss Rush'ın iyisi.
 */
export function mergeSaves(local: Save, cloud: Save): Save {
  const best: Record<string, Best> = { ...cloud.best }
  for (const [id, b] of Object.entries(local.best)) {
    const c = best[id]
    if (!c) {
      best[id] = b
      continue
    }
    const fresh = (x: Best) => !x.stale
    const win = fresh(b) && (!fresh(c) || b.timeMs <= c.timeMs) ? b : fresh(c) ? c : b.timeMs <= c.timeMs ? b : c
    best[id] = { ...win, items: win.items.map((v, i) => v || !!b.items[i] || !!c.items[i]) }
  }
  const more = (a: { last: string; count: number }, b: { last: string; count: number }) => (b.count > a.count ? b : a)
  const rush = !local.rush ? cloud.rush : !cloud.rush ? local.rush : local.rush.bosses > cloud.rush.bosses || (local.rush.bosses === cloud.rush.bosses && local.rush.timeMs <= cloud.rush.timeMs) ? local.rush : cloud.rush
  return {
    ...local,
    unlocked: Math.max(local.unlocked, cloud.unlocked),
    best,
    stamps: { ...cloud.stamps, ...local.stamps },
    charms: { ...cloud.charms, ...local.charms },
    bosses: { ...cloud.bosses, ...local.bosses },
    daily: more(local.daily, cloud.daily),
    weekly: more(local.weekly, cloud.weekly),
    rush,
    meydan: mergeDaily(local.meydan, cloud.meydan),
    stats: mergeStats(local.stats, cloud.stats),
    maraton: !local.maraton ? cloud.maraton : !cloud.maraton ? local.maraton : local.maraton.timeMs <= cloud.maraton.timeMs ? local.maraton : cloud.maraton,
    character: local.character ?? cloud.character,
    scarf: local.scarf !== 'al' ? local.scarf : cloud.scarf,
    seenStory: local.seenStory || cloud.seenStory,
    tutorial: local.tutorial && cloud.tutorial,
    renewed: [...new Set([...(local.renewed ?? []), ...(cloud.renewed ?? [])])].filter((id) => best[id]?.stale),
    seen: [...new Set([...(local.seen ?? []), ...(cloud.seen ?? [])])],
  }
}

/**
 * Güncelleme notu: haritası yenilendiği için rekoru sıfırlanan şehirler ve sonradan eklenen şehirler. Yalnız
 * ilerlemesi olan oyuncuya gösterilir; hiçbir şey toplu sıfırlanmaz, oyuncu istediği şehre tıklayıp oynar.
 */
export function mapNews(s: Save): { renewed: string[]; added: string[] } {
  if (s.unlocked === 0 && !Object.keys(s.best).length) return { renewed: [], added: [] }
  const seen = new Set(s.seen ?? LEVELS.map((l) => l.id))
  return { renewed: (s.renewed ?? []).filter((id) => LEVELS.some((l) => l.id === id)), added: LEVELS.filter((l) => !seen.has(l.id)).map((l) => l.id) }
}

/** Not okundu: listeler boşalır, rekorlar ve hatıralar olduğu gibi kalır */
export const ackMapNews = (s: Save): Save => ({ ...s, renewed: [], seen: LEVELS.map((l) => l.id) })

/** İlerleme sıfırlanır; ad, karakter ve ayarlar kalır */
const restartJourney = (s: Save): Save => ({ ...s, unlocked: 0, best: {}, stamps: {}, charms: {}, bosses: {}, rush: null, mapVersion: MAP_VERSION, migrated: false, renewed: [] })

/**
 * Açık ama hiç bitirilmemiş ilk şehir: `from`dan sonra aranır, yoksa baştan. Araya yeni şehir girince (Kayseri, Hatay,
 * Eskişehir) sona varmış oyuncu oynamadığı şehre yönlendirilir. Hepsi bitmişse null.
 */
export function nextUnplayed(s: Save, from: number): number | null {
  const last = Math.min(s.unlocked, LEVELS.length - 1)
  const order = [...Array(last + 1).keys()]
  for (const i of [...order.filter((i) => i > from), ...order.filter((i) => i <= from)]) if (!s.best[LEVELS[i].id]) return i
  return null
}

/** "Devam Et"in şehri: kaldığı şehir; o bitmişse ilk oynanmamış açık şehir */
export function resumeFor(s: Save): number {
  const at = Math.min(s.unlocked, LEVELS.length - 1)
  return s.best[LEVELS[at].id] ? (nextUnplayed(s, at) ?? at) : at
}

/** Bu tarayıcıdaki ilerlemeyi siler (ayarlar kalır): çıkışta ve başka bir hesaba ait ilerleme yerine */
export const clearProgress = (s: Save): Save => ({ ...restartJourney(s), daily: { last: '', count: 0 }, weekly: { last: '', count: 0 }, scarf: 'al', migrated: true, owner: null, meydan: null, stats: undefined, maraton: null })

/** Giriş yapan hesaba katılabilecek yerel ilerleme: misafirinki ya da zaten o hesabınki; başka hesabınki boşaltılır */
export function adoptable(local: Save, playerId: string): Save {
  // sahip bilgisinden önceki kayıt: girişliyse o hesabın, değilse misafirin sayılır
  const owner = local.owner === undefined ? (local.player?.id ?? null) : local.owner
  return owner === null || owner === playerId ? local : clearProgress(local)
}

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* gizli sekme vb. — ilerleme bu oturumla sınırlı kalır */
  }
}

export function formatTime(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}:${String(s).padStart(2, '0')}.${d}`
}

/** Unvanın dayandığı sayılar: bitirilen şehir, altın madalya, hatıra, nazar, boss, günlük seri */
export function titleFacts(s: Save, today: string): TitleFacts {
  const fresh = LEVELS.filter((l) => s.best[l.id] && !s.best[l.id].stale)
  return {
    cities: LEVELS.filter((l) => s.best[l.id]).length,
    totalCities: LEVELS.length,
    golds: fresh.filter((l) => s.best[l.id].timeMs <= l.medals[0] * 1000).length,
    keeps: LEVELS.reduce((a, l) => a + (s.best[l.id]?.items.filter(Boolean).length ?? 0), 0),
    charms: LEVELS.filter((l) => s.charms[l.id]).length,
    bosses: LEVELS.filter((l) => s.bosses[l.id]).length,
    streak: liveStreak(s.meydan, today),
    stats: s.stats ?? emptyStats(),
  }
}
