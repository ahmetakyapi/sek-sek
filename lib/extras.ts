import { LEVELS } from '@/game/levels'
import { CHALLENGES } from '@/game/challenges'
import type { LevelDef } from '@/game/types'

/**
 * Yolculuğun yan işleri: atkı renkleri, Günün Şehri ve Haftanın Görevi.
 * Hepsi saf işlevdir (tarih ve kayıt dışarıdan gelir); testleri tests/extras.test.ts.
 */

export interface Scarf {
  id: string
  name: string
  nameEn: string
  color: string
  shade: string
  /** açılması için gereken nazar boncuğu sayısı */
  need: number
}

/** Atkı renkleri: ilki herkese açık, ötekiler bulunan nazar boncuklarıyla açılır. */
export const SCARVES: Scarf[] = [
  // ilk atkı karakterin kendi atkısıdır (Uktun turkuaz, Memo kırmızı); renk örneği kılıktan gelir (ownScarf)
  { id: 'al', name: 'Kendi Atkısı', nameEn: 'Own Scarf', color: '#d83c36', shade: '#9e2430', need: 0 },
  { id: 'kizil', name: 'Al', nameEn: 'Crimson', color: '#d83c36', shade: '#9e2430', need: 0 },
  { id: 'safran', name: 'Safran', nameEn: 'Saffron', color: '#f2b632', shade: '#c08a24', need: 1 },
  { id: 'cini', name: 'Çini Mavisi', nameEn: 'Tile Blue', color: '#2e8fd0', shade: '#1e68a0', need: 3 },
  { id: 'zeytin', name: 'Zeytin Yeşili', nameEn: 'Olive Green', color: '#6a9a3e', shade: '#4a7228', need: 6 },
  { id: 'erguvan', name: 'Erguvan', nameEn: 'Judas Purple', color: '#b04a9a', shade: '#7e2e70', need: 10 },
  { id: 'firuze', name: 'Firuze', nameEn: 'Turquoise', color: '#2ab8a8', shade: '#1a8a7e', need: 15 },
  { id: 'gece', name: 'Gece Laciverti', nameEn: 'Midnight Blue', color: '#33407e', shade: '#222c5a', need: 20 },
  { id: 'nazar', name: 'Nazar', nameEn: 'Evil Eye', color: '#f4f8ff', shade: '#4ab0e8', need: LEVELS.length },
]

export const scarfFor = (id: string | undefined) => SCARVES.find((s) => s.id === id) ?? SCARVES[0]

export type ChallengeKind = 'noFall' | 'fewFalls' | 'noDash' | 'silver' | 'gold' | 'collector'

/** Görev metni (TR); İngilizcesi lib/ui.en.ts'te aynı anahtarla durur. */
export const CHALLENGE_TEXT: Record<ChallengeKind, string> = {
  noFall: 'Hiç Düşmeden Bitir',
  fewFalls: 'En Çok Üç Düşüşle Bitir',
  noDash: 'Hiç Dash Atmadan Bitir',
  silver: 'Gümüş Sürede Bitir',
  gold: 'Altın Sürede Bitir',
  collector: 'Üç Hatırayı da Topla',
}

export interface Challenge {
  /** gün (2026-11-10) ya da hafta (2026-H46) anahtarı */
  key: string
  levelId: string
  kinds: ChallengeKind[]
}

export interface RunStats {
  timeMs: number
  deaths: number
  dashes: number
  items: boolean[]
  relaxed: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Pazartesi başlayan hafta: yıl + haftanın sırası */
export function weekKey(d: Date) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + 3)
  const first = new Date(day.getFullYear(), 0, 4)
  const week = 1 + Math.round(((day.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7)
  return `${day.getFullYear()}-H${pad(week)}`
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const hard = (l: LevelDef) => l.difficulty === 'Zor' || l.difficulty === 'Çok Zor'
const falls = (l: LevelDef): ChallengeKind => (hard(l) ? 'fewFalls' : 'noFall')

/** Günün Şehri: açılmış şehirlerden biri ve tek bir görev. Aynı gün herkes için aynıdır (açılan şehir sayısı eşitse). */
export function dailyChallenge(d: Date, levels: LevelDef[], unlocked: number): Challenge {
  const key = dayKey(d)
  const h = hash(key)
  const l = levels[h % Math.min(levels.length, unlocked + 1)]
  const pool: ChallengeKind[] = [falls(l), 'silver', 'collector', ...(NO_DASH_OK.includes(l.id) ? (['noDash'] as const) : [])]
  return { key, levelId: l.id, kinds: [pool[(h >>> 8) % pool.length]] }
}

/** Haftanın Görevi: günlükten bir kademe zor, iki koşul birden. */
export function weeklyChallenge(d: Date, levels: LevelDef[], unlocked: number): Challenge {
  const key = weekKey(d)
  const h = hash(key)
  const l = levels[h % Math.min(levels.length, unlocked + 1)]
  return { key, levelId: l.id, kinds: [falls(l), (h >>> 8) % 2 ? 'gold' : 'collector'] }
}

/** medals: [altın, gümüş, bronz] saniye */
export function meets(kind: ChallengeKind, level: LevelDef, run: RunStats): boolean {
  switch (kind) {
    case 'noFall':
      return run.deaths === 0
    case 'fewFalls':
      return run.deaths <= 3
    case 'noDash':
      return run.dashes === 0
    case 'silver':
      return run.timeMs <= level.medals[1] * 1000
    case 'gold':
      return run.timeMs <= level.medals[0] * 1000
    case 'collector':
      return run.items.length > 0 && run.items.every(Boolean)
  }
}

/** Rahat Mod'daki koşu görev saymaz. */
export const completes = (ch: Challenge, level: LevelDef, run: RunStats) => !run.relaxed && level.id === ch.levelId && ch.kinds.every((k) => meets(k, level, run))

/* ── Günlük Meydan Okuma ─────────────────────────────────────────────────────
 * Herkes için aynı gün, aynı şehir, aynı kural; kilitli şehir de olabilir (yolun ilerisinden bir tadımlık).
 * Gün İstanbul saatine göre döner ki skor tablosu herkes için aynı anda yenilensin.
 * Skor = süre + düşüş cezası + eksik hatıra cezası; düşük skor önde. Şehrin rekoruna ve ilerlemeye dokunmaz.
 */
export type DailyRule = 'ceza' | 'hiz' | 'hatira' | 'tekcan' | 'bayraksiz' | 'zaman' | 'dashsiz' | RageRule
/** Sinir bozucu (zor) modlar: Kurallı Koşu altyapısında, günlüğe çıkmaz */
export type RageRule = 'cehennem' | 'kaygan' | 'ters' | 'coken' | 'kabus' | 'sonnefes' | 'karanlik' | 'basasagi' | 'aynaekran' | 'turbo' | 'geceyarisi' | 'kaos' | 'ay' | 'firtina' | 'gorunmez' | 'hayalet' | 'dar' | 'korkabus' | 'kovala'

export interface DailyRuleDef {
  name: string
  text: string
  /** dünyanın akış hızı */
  speed: number
  /** düşüş başına eklenen saniye */
  perDeath: number
  /** eksik hatıra başına eklenen saniye */
  perMissing: number
  /** düşünce koşu baştan başlar, süre sıfırlanır (skor: düşmeden bitirilen koşunun süresi) */
  oneLife?: boolean
  /** bayraklar çalışmaz: düşünce şehrin başına dönülür, süre akmaya devam eder */
  noFlags?: boolean
  /** dash kapalı (yalnız NO_DASH_OK şehirlerinde: orada dash'siz yol kanıtlı) */
  noDash?: boolean
  /** süre sınırı: bronz sürenin katı; dolunca koşu baştan başlar */
  limit?: number
  /** Kaygan Dünya: bütün zeminler buz (LevelDef.slippery) */
  slippery?: boolean
  /** Çöken Dünya: basılan yüzey çöker (LevelDef.crumbleAll) */
  crumbleAll?: boolean
  /** Ters Tuşlar: sağ ve sol belli aralıklarla yer değiştirir (swapPhase), değişmeden önce uyarılır */
  swapKeys?: boolean
  /** Ay Yerçekimi: oyuncu süzülür (LevelDef.lowGravity) */
  lowGravity?: boolean
  /** Fırtına: güçlü rüzgâr yön değiştirir (LevelDef.storm + wind) */
  storm?: boolean
  /** Kovalamaca: oyuncunun izini süren bir Kangal (LevelDef.chaser; CHASE_NO şehirlerinde kapalı) */
  chase?: boolean
  /** yalnız görüntüyü değiştirir (fizik aynı, her şehirde bitirilebilir): karanlık, baş aşağı, ayna */
  view?: { dark?: boolean; flipX?: boolean; flipY?: boolean; hiddenSpikes?: boolean; ghostGround?: boolean; zoom?: number }
}

/**
 * Kovalamaca'nın açılmadığı şehirler. Köpek hareketli şeylerin ve plakaların başında beklediği için (sim.ts chaseCalm) bütün
 * şehirlerde çözücünün yolu, köpek %15 hızlıyken ısırılmadan biter (`npx tsx scripts/verify-chase.ts --hepsi`; CI her şehirde
 * koşar). Sivas'ta Kangal dost hayvan: dost ile düşman aynı tür olmaz.
 */
export const CHASE_NO: string[] = ['sivas']
export const chaseFits = (id: string) => !CHASE_NO.includes(id)

/** Kural metni (TR); İngilizcesi lib/ui.en.ts'te aynı anahtarla durur. */
export const DAILY_RULES: Record<DailyRule, DailyRuleDef> = {
  ceza: { name: 'Ceza Saati', text: 'Her düşüş skoruna 8 saniye ekler. Acele et ama düşme.', speed: 1, perDeath: 8, perMissing: 0 },
  hiz: { name: 'Hızlı Dünya', text: 'Dünya %20 hızlı akar. Her düşüş 3 saniye ekler.', speed: 1.2, perDeath: 3, perMissing: 0 },
  hatira: { name: 'Hatıra Avı', text: 'Eksik her hatıra skoruna 20 saniye ekler. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 20 },
  tekcan: { name: 'Tek Can', text: 'Düşersen koşu baştan başlar. Skor, hiç düşmeden bitirdiğin koşunun süresi.', speed: 1, perDeath: 0, perMissing: 0, oneLife: true },
  bayraksiz: { name: 'Bayraksız', text: 'Bayraklar çalışmaz: düşersen şehrin başına dönersin, süre akmaya devam eder.', speed: 1, perDeath: 0, perMissing: 0, noFlags: true },
  zaman: { name: 'Zamana Karşı', text: 'Bronz süre dolmadan çıkışa var. Süre dolarsa koşu baştan başlar.', speed: 1, perDeath: 0, perMissing: 0, limit: 1 },
  dashsiz: { name: 'Dash’siz', text: 'Dash kapalı: yalnız yürü ve zıpla. Her düşüş 3 saniye ekler.', speed: 1, perDeath: 3, perMissing: 0, noDash: true },
  cehennem: { name: 'Cehennem Yolu', text: 'Tek can, dünya %15 hızlı. Düşersen şehrin en başından, süre sıfırdan.', speed: 1.15, perDeath: 0, perMissing: 0, oneLife: true },
  kaygan: { name: 'Kaygan Dünya', text: 'Her yer buz: dur demek kolay değil. Her düşüş 5 saniye ekler.', speed: 1, perDeath: 5, perMissing: 0, slippery: true },
  ters: { name: 'Ters Tuşlar', text: 'Sağ ile sol ara ara yer değiştirir; değişmeden önce ekranda uyarı çıkar. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, swapKeys: true },
  coken: { name: 'Çöken Dünya', text: 'Bastığın her taş çöker ve sonra geri gelir: durma, koş. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, crumbleAll: true },
  kabus: { name: 'Kâbus', text: 'Kaygan zemin, ters tuşlar ve bayrak yok: düşersen şehrin başına dönersin.', speed: 1, perDeath: 0, perMissing: 0, slippery: true, swapKeys: true, noFlags: true },
  sonnefes: { name: 'Son Nefes', text: 'Çöken dünyada tek can: bir düşüş, baştan.', speed: 1, perDeath: 0, perMissing: 0, crumbleAll: true, oneLife: true },
  karanlik: { name: 'Karanlık Yol', text: 'Etrafını yalnız küçük bir ışık aydınlatır; ötesi zifiri karanlık. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { dark: true } },
  basasagi: { name: 'Baş Aşağı', text: 'Ekran ters döner: gök aşağıda, yol yukarıda. Tuşlar aynı. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { flipY: true } },
  aynaekran: { name: 'Ayna Ekran', text: 'Görüntü aynada: sağa basınca ekranda sola gidersin. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { flipX: true } },
  turbo: { name: 'Turbo', text: 'Dünya %40 hızlı akar: düşmanlar, platformlar, sen. Her düşüş 3 saniye.', speed: 1.4, perDeath: 3, perMissing: 0 },
  geceyarisi: { name: 'Gece Yarısı', text: 'Karanlıkta tek can: düşersen şehrin en başından.', speed: 1, perDeath: 0, perMissing: 0, oneLife: true, view: { dark: true } },
  ay: { name: 'Ay Yerçekimi', text: 'Yerçekimi yarı yarıya: yüksek zıplar, yavaş düşersin, inişi tutturmak zor. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, lowGravity: true },
  firtina: { name: 'Fırtına', text: 'Sert rüzgâr birkaç saniyede bir yön değiştirir: bir arkandan iter, bir karşıdan tutar. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, storm: true },
  gorunmez: { name: 'Görünmez Dikenler', text: 'Dikenler görünmez: nerede olduklarını ilk düşüşte öğrenirsin. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { hiddenSpikes: true } },
  hayalet: { name: 'Hayalet Zemin', text: 'Zemin yalnız yakınındayken görünür; uzaktaki taşlar sise karışır. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { ghostGround: true } },
  dar: { name: 'Dar Kadraj', text: 'Kamera iyice yaklaşır: önünü az görürsün, atlayışı tahminle yaparsın. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, view: { zoom: 1.7 } },
  korkabus: { name: 'Kör Kâbus', text: 'Görünmez dikenler, karanlık ve tek can. Dayanabilen yok gibi.', speed: 1, perDeath: 0, perMissing: 0, oneLife: true, view: { hiddenSpikes: true, dark: true } },
  kovala: { name: 'Kovalamaca', text: 'Bir Kangal izini sürüyor: koştukça aranı açarsın, durursan yetişir. Yakalanırsan bayraktan. Her düşüş 3 saniye.', speed: 1, perDeath: 3, perMissing: 0, chase: true },
  kaos: { name: 'Kaos', text: 'Baş aşağı ekran, ters tuşlar ve kaygan zemin bir arada. Her düşüş 5 saniye.', speed: 1, perDeath: 5, perMissing: 0, slippery: true, swapKeys: true, view: { flipY: true } },
}

/** Sinir bozucu modların sırası (Modlar → Sinir Bozucu). Günlük Meydan Okuma bunları seçmez (RULES'ta yoklar). */
export const RAGE_RULES: RageRule[] = ['cehennem', 'kaygan', 'ters', 'coken', 'kabus', 'sonnefes', 'karanlik', 'basasagi', 'aynaekran', 'turbo', 'geceyarisi', 'kaos', 'ay', 'firtina', 'gorunmez', 'hayalet', 'dar', 'korkabus', 'kovala']

/** Ters Tuşlar: her 9 sn'lik turun son 4 sn'si ters; dönmeden 1,5 sn önce uyarılır. Saat dünyanın süresidir (her Hz'de aynı). */
export const SWAP = { cycle: 9, flipped: 4, warn: 1.5 }
export function swapPhase(time: number): { flipped: boolean; warn: boolean } {
  const u = ((time % SWAP.cycle) + SWAP.cycle) % SWAP.cycle
  const start = SWAP.cycle - SWAP.flipped
  return { flipped: u >= start, warn: (u >= start - SWAP.warn && u < start) || u >= SWAP.cycle - SWAP.warn }
}

/** Zor modun bölüme yazdığı fizik değişiklikleri (harita aynı; zemin kayar ya da çöker) */
export function ruleLevel(rule: DailyRule, level: LevelDef): LevelDef {
  const r = DAILY_RULES[rule]
  if (!r.slippery && !r.crumbleAll && !r.lowGravity && !r.storm && !r.chase) return level
  return { ...level, chaser: r.chase || undefined, slippery: r.slippery || undefined, crumbleAll: r.crumbleAll || undefined, lowGravity: r.lowGravity || undefined, storm: r.storm || undefined, wind: r.storm ? STORM_WIND : level.wind }
}

/**
 * Dash atmadan (yalnız yürüyüp zıplayarak) çıkışına varılabildiği çözücüyle kanıtlanmış şehirler
 * (`npx tsx scripts/verify-rules.ts`). "Kolay" etiketi yetmez: İstanbul Kolay ama dash'siz bitmiyor.
 * Bu şehirlerden birinin haritası değişirse betiği yeniden koş; listeye şehir eklemeden önce de.
 */
export const NO_DASH_OK = ['edirne', 'kocaeli', 'bursa', 'eskisehir', 'canakkale', 'izmir']

/**
 * Kaygan Dünya ve Çöken Dünya fiziğiyle çıkışına varılabildiği çözücüyle kanıtlanmış şehirler
 * (`npx tsx scripts/verify-rage.ts <kaygan|coken> --hepsi`). Kâbus kaygan, Son Nefes çöken listesine bağlıdır.
 * Bu şehirlerden birinin haritası değişirse betiği yeniden koş.
 */
/** kaygan, çöken, ay ve fırtına fiziğiyle kanıtlanmış şehirler (16 Kasım 2026); yeni şehri betikle kanıtlayıp buraya yaz */
export const RAGE_PROVEN = [
  'istanbul', 'edirne', 'kocaeli', 'bursa', 'eskisehir', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir', 'kayseri', 'adana', 'hatay', 'gaziantep', 'sanliurfa', 'diyarbakir', 'mardin', 'malatya', 'corum', 'sinop', 'ordu', 'trabzon', 'sivas', 'van', 'erzurum', 'ardahan', 'amasya', 'mugla', 'bayburt', 'rize', 'artvin', 'kars', 'bitlis', 'agri',
  'giresun', 'tokat', 'denizli', 'zonguldak', 'mersin',
]
/** Fırtına'nın rüzgâr ivmesi (px/s²): Bayburt'un karşı rüzgârından güçlü, yön değiştirir */
export const STORM_WIND = 230
export const SLIPPERY_OK: string[] = RAGE_PROVEN
export const CRUMBLE_OK: string[] = RAGE_PROVEN
/** Ay Yerçekimi ve Fırtına'yla çıkışa varılabildiği kanıtlanmış şehirler (`verify-rage.ts <ay|firtina> --hepsi`) */
/** Ordu'da Ay Yerçekimi'yle çıkışa varılamıyor (çözücü, 16 Kasım 2026): orada açılmaz */
export const MOON_OK: string[] = RAGE_PROVEN.filter((id) => id !== 'ordu')
export const STORM_OK: string[] = RAGE_PROVEN

/** Kural bu şehirde oynanabilir mi: Dash’siz, kaygan ve çöken fizik yalnız kanıtlanmış şehirlerde */
export const ruleFits = (rule: DailyRule, level: LevelDef) => {
  const r = DAILY_RULES[rule]
  if (r.noDash && !NO_DASH_OK.includes(level.id)) return false
  if (r.slippery && !SLIPPERY_OK.includes(level.id)) return false
  if (r.crumbleAll && !CRUMBLE_OK.includes(level.id)) return false
  if (r.lowGravity && !MOON_OK.includes(level.id)) return false
  if (r.storm && !STORM_OK.includes(level.id)) return false
  if (r.chase && !chaseFits(level.id)) return false
  return true
}

/** Kuralın bu şehirdeki süre sınırı (sn); sınır yoksa null */
export const ruleLimit = (rule: DailyRule, level: LevelDef) => (DAILY_RULES[rule].limit ? Math.round(level.medals[2] * DAILY_RULES[rule].limit!) : null)

/** Serbest kurallı koşuda rekorun anahtarı: şehir + kural (harita yenilense de rekor durur) */
export const ruleKey = (levelId: string, rule: DailyRule) => `${levelId}:${rule}`

/** İstanbul saatiyle bugünün anahtarı (2026-11-14) */
export const istanbulDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

/** anahtarı gün kadar kaydırır: shiftDay('2026-11-14', -1) → '2026-11-13' */
export function shiftDay(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export interface DailyRun {
  day: string
  levelId: string
  rule: DailyRule
}

export const RULES: DailyRule[] = ['ceza', 'hiz', 'hatira', 'tekcan', 'bayraksiz', 'zaman', 'dashsiz']

/** Günün meydan okuması: art arda iki gün aynı şehir gelmez */
export function dailyRun(day: string, levels: LevelDef[]): DailyRun {
  const pick = (k: string) => hash(`gunluk:${k}`) % levels.length
  // dünün gerçek seçimi de aynı kuralla bulunur (birkaç gün geriye bakmak yeter)
  const at = (k: string, depth: number): number => {
    const raw = pick(k)
    return depth > 0 && raw === at(shiftDay(k, -1), depth - 1) ? (raw + 1) % levels.length : raw
  }
  const i = at(day, 6)
  // günün kuralı şehre uyanlardan seçilir (Dash’siz yalnız Kolay şehirde çıkar)
  const pool = RULES.filter((r) => ruleFits(r, levels[i]))
  return { day, levelId: levels[i].id, rule: pool[(hash(`kural:${day}`) >>> 4) % pool.length] }
}

/** Günlük skor (ms): süre + cezalar */
export function dailyScore(rule: DailyRule, timeMs: number, deaths: number, found: number) {
  const r = DAILY_RULES[rule]
  return timeMs + deaths * r.perDeath * 1000 + Math.max(0, 3 - found) * r.perMissing * 1000
}


/** Günlük Meydan Okuma'nın cihazdaki izi: bugünkü en iyi skor ve kaç gün üst üste oynandığı */
export interface DailyMark {
  day: string
  bestMs: number
  streak: number
}

/** Bir bitirişten sonra iz: aynı gün en iyi skor kalır; dün de oynandıysa seri bir artar, yoksa 1'den başlar */
export function markDaily(prev: DailyMark | null | undefined, day: string, scoreMs: number): DailyMark {
  if (prev && prev.day === day) return { ...prev, bestMs: Math.min(prev.bestMs, scoreMs) }
  return { day, bestMs: scoreMs, streak: prev && prev.day === shiftDay(day, -1) ? prev.streak + 1 : 1 }
}

/** İki cihazın izi birleşir: yeni gün kazanır, aynı günde iyi skor ve uzun seri */
export function mergeDaily(a: DailyMark | null | undefined, b: DailyMark | null | undefined): DailyMark | null {
  if (!a || !b) return a ?? b ?? null
  if (a.day !== b.day) {
    const [neu, old] = a.day > b.day ? [a, b] : [b, a]
    // yeni iz eskisinin ertesi günüyse seri eskisinden sürer (buluttan çekmeden oynanan gün seriyi sıfırlamasın)
    return neu.day === shiftDay(old.day, 1) ? { ...neu, streak: Math.max(neu.streak, old.streak + 1) } : neu
  }
  return { day: a.day, bestMs: Math.min(a.bestMs, b.bestMs), streak: Math.max(a.streak, b.streak) }
}

/** Seri bugün ya da dün oynandıysa sürer; daha eskiyse kopmuştur (0) */
export const liveStreak = (m: DailyMark | null | undefined, today: string) => (m && (m.day === today || m.day === shiftDay(today, -1)) ? m.streak : 0)

/* ── Günün Üçlüsü: Meydan Okuma + Günün Mücadelesi + Günün Boss'u ───────────── */
/**
 * Her gün üç ayrı iş: günlük meydan okuma (tek hak), günün mücadele kesiti ve günün boss'u (ikisi serbest tekrar, skor
 * yalnız en iyisi). Üçü de bitince gün "Üçlü" sayılır (`TrioMark.days`, başarım). Skorlar `gunluk-m:<gün>` ve `gunluk-b:<gün>`
 * anahtarlarıyla skor tablosunda durur; genel sıralamaya girmez. Seçim yalnız tarihe bağlıdır: herkes için aynı.
 */
export const dailyMiniKey = (day: string) => `gunluk-m:${day}`
export const dailyBossKey = (day: string) => `gunluk-b:${day}`

/** Günlük seçimin zinciri: ilk günden bugüne her gün bir öncekinden farklı olsun diye (derinliksiz, tutarlı) ilerler */
const TRIO_ANCHOR = '2026-11-01'
const chainCache = new Map<string, number>()
function chainPick(kind: string, day: string, size: number, avoid: (d: string) => number): number {
  const key = `${kind}:${size}:${day}`
  const hit = chainCache.get(key)
  if (hit !== undefined) return hit
  let prev = -1
  let out = hash(`${kind}:${day}`) % size
  // başlangıç gününden öncesi için de çalışır: zincir o günden başlar
  const start = day < TRIO_ANCHOR ? day : TRIO_ANCHOR
  for (let d = start; ; d = shiftDay(d, 1)) {
    const ck = `${kind}:${size}:${d}`
    const cached = chainCache.get(ck)
    if (cached !== undefined) out = cached
    else {
      out = hash(`${kind}:${d}`) % size
      const bad = avoid(d)
      for (let k = 0; k < size && (out === prev || out === bad); k++) out = (out + 1) % size
      chainCache.set(ck, out)
    }
    prev = out
    if (d === day) return out
  }
}

/** Günün mücadelesi (CHALLENGES kimliği): art arda iki gün aynı kesit gelmez */
export function dailyMini(day: string): string {
  const pool = CHALLENGES.map((c) => c.id)
  return pool[chainPick('gunluk-m', day, pool.length, () => -1)]
}

/** Günün boss'u (şehir dizini): ne dünkü boss ne de günün meydan okuma şehri olur */
export function dailyBoss(day: string, levels: LevelDef[]): number {
  return chainPick('gunluk-b', day, levels.length, (d) => levels.findIndex((l) => l.id === dailyRun(d, levels).levelId))
}

/** Cihazdaki iz: bugünün iki serbest işi (en iyi süre, ms), tamamlanan Üçlü sayısı ve sonuncusunun günü */
export interface TrioMark {
  day: string
  mini?: number
  boss?: number
  days: number
  last: string
}

export const emptyTrio = (): TrioMark => ({ day: '', days: 0, last: '' })

/** Bir parça bitti: aynı gün en iyi süre kalır, yeni günde parçalar sıfırlanır; sayaç sürer */
export function markTrio(m: TrioMark | null | undefined, day: string, part: 'mini' | 'boss', timeMs: number): { mark: TrioMark; best: boolean } {
  const cur = m ?? emptyTrio()
  const base: TrioMark = cur.day === day ? cur : { day, days: cur.days, last: cur.last }
  const old = base[part]
  const best = old === undefined || timeMs < old
  return { mark: best ? { ...base, [part]: timeMs } : base, best }
}

/** Buluttan ya da dışarıdan gelen iz biçime zorlanır (bozuk tip, sayı dışı değer, uydurma gün düşer) */
export function cleanTrio(x: unknown): TrioMark | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
  const ms = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 && v < 3 * 3_600_000 ? v : undefined)
  const days = typeof r.days === 'number' && Number.isInteger(r.days) ? Math.max(0, Math.min(5000, r.days)) : 0
  return { day: day(r.day), mini: ms(r.mini), boss: ms(r.boss), days, last: day(r.last) }
}

/** Üçü de bugün bitti mi (meydan okuma için bugünkü iz) */
export const trioParts = (m: TrioMark | null | undefined, day: string, meydan: DailyMark | null | undefined) => ({
  meydan: meydan?.day === day,
  mini: m?.day === day && m.mini !== undefined,
  boss: m?.day === day && m.boss !== undefined,
})
export const trioCount = (p: ReturnType<typeof trioParts>) => Number(p.meydan) + Number(p.mini) + Number(p.boss)

/** Üçü de bittiyse bugün bir kez sayılır (aynı gün ikinci kez artmaz) */
export function settleTrio(m: TrioMark | null | undefined, day: string, meydan: DailyMark | null | undefined): TrioMark | null | undefined {
  if (!m || trioCount(trioParts(m, day, meydan)) < 3 || m.last === day) return m
  return { ...m, days: m.days + 1, last: day }
}

/** İki cihazın izi: yeni gün kazanır, aynı günde her parçanın en iyisi; sayaç büyük olanı, son gün yeni olanı */
export function mergeTrio(a: TrioMark | null | undefined, b: TrioMark | null | undefined): TrioMark | null {
  if (!a || !b) return a ?? b ?? null
  const neu = a.day >= b.day ? a : b
  const min = (x?: number, y?: number) => (x === undefined ? y : y === undefined ? x : Math.min(x, y))
  const same = a.day === b.day
  return {
    day: neu.day,
    ...(same ? { mini: min(a.mini, b.mini), boss: min(a.boss, b.boss) } : { mini: neu.mini, boss: neu.boss }),
    days: Math.max(a.days, b.days),
    last: a.last > b.last ? a.last : b.last,
  }
}

/* ── Düello: iki kişi aynı cihazda, aynı şehirde sırayla koşar ─────────────── */
export interface DuelRun {
  timeMs: number
  deaths: number
  score: number
  /** toplanan hatıra (Hatıra Avı şartında skordan düşer) */
  items?: number
}

/**
 * Düello şartları: düşüş cezası, hatıra ödülü (her hatıra skordan düşer) ve avantaj (oyuncuya baştan düşülen saniye;
 * aileyle, farklı yaşlarla oynarken dengeyi kurar). Eski kurulumlar şartsız gelir: sırayla 5 sn ceza, yan yana cezasız.
 */
export interface DuelTerms {
  penalty: 0 | 5 | 10
  itemBonus: 0 | 5
  handicap: [number, number]
}
export const DUEL_PENALTIES = [0, 5, 10] as const
export const DUEL_HANDICAPS = [0, 3, 5, 10] as const

/** Düello'da bir koşunun skoru (ms): süre + düşüş cezası − hatıra ödülü − avantaj; bitiremeyen DNF'de kalır */
export function duelScoreWith(t: DuelTerms, k: 0 | 1, timeMs: number, deaths: number, items: number, dnf = Infinity): number {
  if (!Number.isFinite(timeMs) || timeMs >= dnf) return dnf
  return Math.max(0, timeMs + deaths * t.penalty * 1000 - items * t.itemBonus * 1000 - t.handicap[k] * 1000)
}

/** her tur [birinci oyuncu, ikinci oyuncu]; henüz koşulmamış null */
export type DuelRounds = [DuelRun | null, DuelRun | null][]

/** Turu kim aldı: 0, 1, berabere -1, henüz bitmediyse null */
export function roundWinner(r: [DuelRun | null, DuelRun | null]): 0 | 1 | -1 | null {
  if (!r[0] || !r[1]) return null
  return r[0].score === r[1].score ? -1 : r[0].score < r[1].score ? 0 : 1
}

export function duelWins(rounds: DuelRounds): [number, number] {
  const w: [number, number] = [0, 0]
  for (const r of rounds) {
    const k = roundWinner(r)
    if (k === 0 || k === 1) w[k]++
  }
  return w
}

/**
 * Düello bitti mi, kim kazandı. Tek turda tek koşu yeter; üç turluda iki tur alan kazanır. Beraberlikler fazladan tur
 * açar ama en çok iki tane: sonunda hâlâ eşitse toplam skoru düşük olan kazanır, o da eşitse berabere (-1).
 */
export function duelResult(rounds: DuelRounds, bestOf: 1 | 3 | 5): { over: boolean; winner: 0 | 1 | -1 | null } {
  const done = rounds.filter((r) => roundWinner(r) !== null)
  const w = duelWins(rounds)
  const need = Math.ceil(bestOf / 2)
  if (w[0] >= need) return { over: true, winner: 0 }
  if (w[1] >= need) return { over: true, winner: 1 }
  if (done.length < bestOf + 2) return { over: false, winner: null }
  const sum = (k: 0 | 1) => done.reduce((a, r) => a + r[k]!.score, 0)
  return { over: true, winner: w[0] !== w[1] ? (w[0] > w[1] ? 0 : 1) : sum(0) === sum(1) ? -1 : sum(0) < sum(1) ? 0 : 1 }
}

/** turu kim açar: sırayla (ilk turu birinci oyuncu) */
export const duelFirst = (round: number): 0 | 1 => (round % 2 === 0 ? 0 : 1)

/* ── Yol istatistikleri ve unvan ────────────────────────────────────────────── */
export interface TravelStats {
  /** bitirilen koşu (şehir, günlük, düello, Boss Rush boss'u) */
  runs: number
  deaths: number
  jumps: number
  dashes: number
  /** üstüne basılan düşman */
  stomps: number
  /** oyunda geçen süre (ms) */
  playMs: number
}

export const emptyStats = (): TravelStats => ({ runs: 0, deaths: 0, jumps: 0, dashes: 0, stomps: 0, playMs: 0 })

export const addStats = (a: TravelStats, b: Partial<TravelStats>): TravelStats => ({
  runs: a.runs + (b.runs ?? 0),
  deaths: a.deaths + (b.deaths ?? 0),
  jumps: a.jumps + (b.jumps ?? 0),
  dashes: a.dashes + (b.dashes ?? 0),
  stomps: a.stomps + (b.stomps ?? 0),
  playMs: a.playMs + (b.playMs ?? 0),
})

/** İki cihazın sayaçları: her birinin büyüğü (aynı oyun iki kez sayılmasın) */
export const mergeStats = (a: TravelStats | undefined, b: TravelStats | undefined): TravelStats => {
  const x = a ?? emptyStats()
  const y = b ?? emptyStats()
  return { runs: Math.max(x.runs, y.runs), deaths: Math.max(x.deaths, y.deaths), jumps: Math.max(x.jumps, y.jumps), dashes: Math.max(x.dashes, y.dashes), stomps: Math.max(x.stomps, y.stomps), playMs: Math.max(x.playMs, y.playMs) }
}

/** Unvanın dayandığı sayılar (kayıttan çıkarılır) */
export interface TitleFacts {
  cities: number
  totalCities: number
  golds: number
  keeps: number
  charms: number
  bosses: number
  streak: number
  stats: TravelStats
}

/**
 * Yolcunun unvanı: yolculuğun en parlak yanı. İlk tutan kazanır (yukarıdan aşağı, zordan kolaya).
 * Metinler TR; İngilizcesi lib/ui.en.ts'te aynı anahtarla.
 */
export function travelerTitle(f: TitleFacts): string {
  const all = f.totalCities
  if (f.cities >= all && f.keeps >= all * 3 && f.charms >= all) return 'Defterin Ustası'
  if (f.golds >= all) return 'Altın Ayak'
  if (f.cities >= all) return 'Gezgin'
  if (f.streak >= 7) return 'Her Gün Yolda'
  if (f.golds >= 10) return 'Rüzgâr Gibi'
  if (f.charms >= 15) return 'Nazar Değmez'
  if (f.bosses >= 15) return 'Meydan Kahramanı'
  if (f.keeps >= 40) return 'Hatıra Avcısı'
  if (f.stats.deaths >= 300) return 'Düşe Kalka'
  if (f.cities >= 14) return 'Yarı Yolun Yolcusu'
  if (f.cities >= 5) return 'Yola Alışan'
  if (f.cities >= 1) return 'Çiçeği Burnunda Yolcu'
  return 'Yeni Yolcu'
}

/**
 * Haftalık Turnuva: her hafta (pazartesi-pazar, İstanbul saatiyle) herkes için aynı üç mücadele haritası. Sıralama üçünü de
 * bitirenlerin toplam süresiyle; skor satırları `turnuva:<hafta>:<mücadele>` anahtarıyla skor tablosunda durur.
 */
export const TOURNAMENT_SIZE = 3
export const tournamentWeek = (day: string) => weekKey(new Date(`${day}T12:00:00`))
export function tournamentFor(week: string): Challenge3 {
  const pool = CHALLENGES.map((c) => c.id)
  const out: string[] = []
  for (let i = 0; out.length < TOURNAMENT_SIZE; i++) {
    const id = pool[hash(`turnuva:${week}:${i}`) % pool.length]
    // aynı şehirden iki kesit aynı haftaya düşmesin
    if (!out.some((o) => CHALLENGES.find((c) => c.id === o)!.level === CHALLENGES.find((c) => c.id === id)!.level)) out.push(id)
  }
  return out as Challenge3
}
type Challenge3 = [string, string, string]
/** turnuva skorunun tablo anahtarı */
export const tournamentKey = (week: string, id: string) => `turnuva:${week}:${id}`
/** cihazdaki turnuva kaydı: yalnız bu haftanınki tutulur */
export interface TournamentMark {
  week: string
  best: Record<string, number>
}
export function markTournament(m: TournamentMark | null | undefined, week: string, id: string, timeMs: number): { mark: TournamentMark; best: boolean } {
  const cur = m?.week === week ? m.best : {}
  const best = cur[id] === undefined || timeMs < cur[id]
  return { mark: { week, best: best ? { ...cur, [id]: timeMs } : cur }, best }
}
/** üçü de bitince toplam süre */
export const tournamentTotal = (m: TournamentMark | null | undefined, week: string) => {
  if (m?.week !== week) return null
  const ids = tournamentFor(week)
  return ids.every((id) => m.best[id] !== undefined) ? ids.reduce((a, id) => a + m.best[id], 0) : null
}
/** iki cihazın turnuva kaydı: daha yeni hafta kazanır, aynı haftada her mücadelenin en iyisi */
export function mergeTournament(a: TournamentMark | null | undefined, b: TournamentMark | null | undefined): TournamentMark | null {
  if (!a || !b) return a ?? b ?? null
  if (a.week !== b.week) return a.week > b.week ? a : b
  const best = { ...b.best }
  for (const [k, v] of Object.entries(a.best)) best[k] = Math.min(v, best[k] ?? v)
  return { week: a.week, best }
}

/* ── Boss Rush çeşitleri ───────────────────────────────────────────────────── */
/**
 * Boss Rush'ın sırası: düz ve Kâbus'ta yenilen boss'lar şehir sırasıyla; Çifte'de ikişer ikişer (birincinin arenası,
 * ikincisi yanında). Tek sayıda boss varsa sonuncusu tek çıkar (pairs'te -1).
 */
export function rushPlan(beaten: number[], variant?: 'kabus' | 'cifte'): { order: number[]; pairs?: number[] } {
  if (variant !== 'cifte') return { order: [...beaten] }
  const order: number[] = []
  const pairs: number[] = []
  for (let i = 0; i < beaten.length; i += 2) {
    order.push(beaten[i])
    pairs.push(beaten[i + 1] ?? -1)
  }
  return { order, pairs }
}
