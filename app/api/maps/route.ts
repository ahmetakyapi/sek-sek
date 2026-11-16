import { sql, type SQL } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { DAILY_LIMIT, PAGE_SIZE, cleanTitle, parseSort, titleProblem, type CommunityMap, type MapSort } from '@/lib/communityMaps'
import { decodeMap, encodeMap } from '@/lib/customLevel'
import { db } from '@/lib/db'
import { hasSession, mapViewer } from './who'

export const dynamic = 'force-dynamic'

/** en uzun harita (600 sütun, hiç tekrarsız: ~19 200 karakter) bile bunun altında kalır */
const MAX_CODE = 24_000
const MAX_PAGE = 50
const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status })

const ORDER: Record<MapSort, SQL> = {
  yeni: sql`m.created_at desc, m.id desc`,
  begeni: sql`m.likes desc, m.created_at desc, m.id desc`,
  oynanan: sql`m.plays desc, m.created_at desc, m.id desc`,
}

/**
 * GET ?sort=yeni|begeni|oynanan&page=0 → { maps, page, hasMore }. Giriş yapan oyuncu için her kartta `liked`.
 * Tablo yoksa (göç henüz uygulanmamış) ya da veritabanı yanıt vermezse boş liste döner: galeri sessizce boş görünür.
 */
export async function GET(req: NextRequest) {
  const sort = parseSort(req.nextUrl.searchParams.get('sort'))
  const page = Math.max(0, Math.min(MAX_PAGE, Math.floor(Number(req.nextUrl.searchParams.get('page')) || 0)))
  const personal = hasSession(req)
  const headers = { 'Cache-Control': personal ? 'private, no-store' : 'public, max-age=0, s-maxage=20, stale-while-revalidate=120' }
  try {
    const me = personal ? await mapViewer(req) : null
    const liked = me ? sql`exists (select 1 from seksek_map_likes l where l.map_id = m.id and l.player_id = ${me.id})` : sql`false`
    const r = await db().execute(sql`
      select m.id, m.code, m.title, coalesce(p.name, m.author) as author, m.city, m.plays, m.likes,
             m.created_at as "createdAt", ${liked} as liked
      from seksek_maps m left join seksek_players p on p.id = m.player_id
      order by ${ORDER[sort]} limit ${PAGE_SIZE + 1} offset ${page * PAGE_SIZE}`)
    const rows = r.rows as unknown as CommunityMap[]
    const maps = rows.slice(0, PAGE_SIZE).map((m) => ({ ...m, createdAt: new Date(m.createdAt).toISOString() }))
    return NextResponse.json({ maps, page, hasMore: rows.length > PAGE_SIZE }, { headers })
  } catch {
    return NextResponse.json({ maps: [], page, hasMore: false }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

/**
 * POST { code, title, solved: true } → { id, code }. Yalnız giriş yapmış oyuncu yayınlar.
 * Düzenleyici haritayı çözücüyle bitirince `solved` yollar; sunucu kodu çözüp doğrular, yeniden kodlayarak tek biçime
 * getirir (aynı harita iki kez yayınlanmaz: 409). Başlık 3–40 karakter ve kaba söz süzgecinden geçer; oyuncu başına
 * son 24 saatte en çok DAILY_LIMIT harita. Tablo yoksa 503.
 */
export async function POST(req: NextRequest) {
  const text = await req.text()
  if (text.length > MAX_CODE + 1000) return bad('Harita çok büyük', 413)
  let b: Record<string, unknown>
  try {
    b = JSON.parse(text) as Record<string, unknown>
  } catch {
    return bad('Geçersiz istek')
  }
  const raw = typeof b.code === 'string' ? b.code.trim() : ''
  if (!raw || raw.length > MAX_CODE) return bad('Harita kodu bozuk.')
  const decoded = decodeMap(raw)
  if ('error' in decoded) return bad(decoded.error)
  if (b.solved !== true) return bad('Önce çözücüyle sına: yalnız bitirilebilir haritalar yayınlanır.')
  const problem = titleProblem(b.title)
  if (problem) return bad(problem)
  const title = cleanTitle(b.title)
  const code = encodeMap(decoded.map, decoded.city)
  try {
    const me = await mapViewer(req)
    if (!me) return bad('Yayınlamak için giriş yap.', 401)
    const d = db()
    const recent = (await d.execute(sql`select count(*)::int as n from seksek_maps where player_id = ${me.id} and created_at > now() - interval '1 day'`)).rows[0] as { n: number }
    if (recent.n >= DAILY_LIMIT) return bad('Bugünlük yayın sınırına geldin (günde 10 harita). Yarın yeniden dene.', 429)
    const ins = (await d.execute(sql`
      insert into seksek_maps (code, title, player_id, author, city) values (${code}, ${title}, ${me.id}, ${me.name}, ${decoded.city})
      on conflict (code) do nothing returning id`)).rows[0] as { id: number } | undefined
    if (!ins) {
      const old = (await d.execute(sql`select id from seksek_maps where code = ${code} limit 1`)).rows[0] as { id: number } | undefined
      return bad('Bu harita zaten yayında.', 409, { id: old?.id ?? null })
    }
    return NextResponse.json({ id: ins.id, code })
  } catch {
    return bad('Topluluk haritaları şu an kapalı.', 503)
  }
}
