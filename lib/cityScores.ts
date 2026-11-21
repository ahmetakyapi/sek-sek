/**
 * Şehir kartının skor paneli: bir şehrin ilk sıraları (`GET /api/scores?level=<şehir>`), oyuncunun kendi satırı ve
 * liderle fark. Saf işlevler testli (`tests/cityScores.test.ts`); istemci önbelleği kısa ömürlüdür ve aynı anda gelen
 * iki isteği (panel ve kart rozeti) tek isteğe indirir.
 */

export interface CityScoreRow {
  name: string
  rank: number
  total: number
  me: boolean
  /** oynanan yolcu: uktun | memo */
  hero: 'uktun' | 'memo' | null
  timeMs: number
  /** en iyi süreli koşunun düşüşü ve hatırası */
  deaths: number
  items: number
  /** bütün koşulardaki en az düşüş ve en çok hatıra */
  minDeaths: number
  maxItems: number
  plays: number
}

export interface CityScores {
  rows: CityScoreRow[]
  total: number
}

/** Panelde gösterilen ilk sıra sayısı (sunucunun varsayılanı da 10) */
export const TOP_N = 10
/** Önbellek ömrü: kart her açılışta sunucuya gitmesin, ama yeni rekor çabuk görünsün */
export const CACHE_MS = 20_000

export const cityScoresUrl = (level: string, me: string, bust = 0) => {
  const q = new URLSearchParams({ level })
  if (me) q.set('me', me.slice(0, 32))
  if (bust) q.set('r', String(bust))
  return `/api/scores?${q}`
}

const int = (x: unknown, min = 0, max = 1e9) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, Math.round(x))) : min)

/** Sunucu yanıtını güvenli satırlara çevirir: bozuk satır düşer, sayılar sınırlanır, sıra korunur */
export function parseCityScores(json: unknown): CityScores {
  const raw = (json as { scores?: unknown })?.scores
  const rows: CityScoreRow[] = []
  if (Array.isArray(raw)) {
    for (const r of raw.slice(0, 100)) {
      if (!r || typeof r !== 'object') continue
      const o = r as Record<string, unknown>
      if (typeof o.name !== 'string' || !o.name || typeof o.timeMs !== 'number' || !Number.isFinite(o.timeMs)) continue
      rows.push({
        name: o.name.slice(0, 32),
        rank: int(o.rank, 1),
        total: int(o.total),
        me: o.me === true,
        hero: o.hero === 'uktun' || o.hero === 'memo' ? o.hero : null,
        timeMs: int(o.timeMs),
        deaths: int(o.deaths),
        items: int(o.items, 0, 3),
        minDeaths: int(o.minDeaths ?? o.deaths),
        maxItems: int(o.maxItems ?? o.items, 0, 3),
        plays: int(o.plays, 1),
      })
    }
  }
  rows.sort((a, b) => a.rank - b.rank)
  return { rows, total: Math.max(int((json as { total?: unknown })?.total), rows[0]?.total ?? 0, rows.length) }
}

/** Panelde görünen satırlar: ilk `n` sıra ve (ilkler dışındaysa) oyuncunun kendisi, sırasıyla */
export const visibleRows = (rows: CityScoreRow[], n = TOP_N) => rows.filter((r) => r.rank <= n || r.me)

/** Liderle fark (ms); lider ya da veri yoksa null */
export const gapToLeader = (rows: CityScoreRow[], row: CityScoreRow) => {
  const lead = rows.find((r) => r.rank === 1)
  return lead && row.rank > 1 ? Math.max(0, row.timeMs - lead.timeMs) : null
}

const cache = new Map<string, { at: number; data: CityScores }>()
const pending = new Map<string, Promise<CityScores>>()
const keyOf = (level: string, me: string) => `${level}|${me.toLocaleLowerCase('tr')}`

/** Taze önbellek varsa onu verir */
export const cachedCityScores = (level: string, me: string, now = Date.now()) => {
  const hit = cache.get(keyOf(level, me))
  return hit && now - hit.at < CACHE_MS ? hit.data : null
}

/**
 * Şehrin skorlarını getirir. Aynı şehir için uçuştaki istek paylaşılır; `signal` yalnız bu çağıranı bırakır
 * (paylaşılan istek bitince önbelleğe yine yazılır). `bust` verilirse önbellek atlanır (Tekrar Dene).
 */
export function loadCityScores(level: string, me: string, signal?: AbortSignal, bust = 0, doFetch: typeof fetch = fetch): Promise<CityScores> {
  const key = keyOf(level, me)
  if (!bust) {
    const hit = cachedCityScores(level, me)
    if (hit) return Promise.resolve(hit)
  }
  let p = bust ? undefined : pending.get(key)
  if (!p) {
    p = doFetch(cityScoresUrl(level, me, bust))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        const data = parseCityScores(j)
        cache.set(key, { at: Date.now(), data })
        return data
      })
      .finally(() => {
        if (pending.get(key) === p) pending.delete(key)
      })
    pending.set(key, p)
  }
  if (!signal) return p
  const shared = p
  return new Promise<CityScores>((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (signal.aborted) return abort()
    signal.addEventListener('abort', abort, { once: true })
    shared.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

/** Test ve çıkış için: önbelleği boşalt */
export const clearCityScores = () => {
  cache.clear()
  pending.clear()
}
