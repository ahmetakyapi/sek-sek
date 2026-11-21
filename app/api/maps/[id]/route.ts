import { sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { LIMITS, hit, ipKey, playerKey, tooMany } from '@/lib/rateLimit'
import { crossSite, crossSiteError } from '@/lib/sameOrigin'
import { bad, readMapBody } from '../body'
import { mapViewer } from '../who'

export const dynamic = 'force-dynamic'

const mapId = async (ctx: { params: Promise<{ id: string }> }) => {
  const id = Number((await ctx.params).id)
  return Number.isInteger(id) && id > 0 && id <= 2 ** 31 - 1 ? id : null
}

/**
 * POST { action: 'like' } → { liked, likes }: giriş yapan oyuncunun beğenisini açar ya da kapatır (tek ifadede: ekleme
 * olmadıysa silinir, sayaç farkla güncellenir).
 * POST { action: 'play' } → { plays }: galerideki "Oyna" düğmesi yönlendirmeden önce çağırır; giriş gerekmez.
 * Tablo yoksa 503, harita yoksa 404.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (crossSite(req)) return crossSiteError()
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id <= 0 || id > 2 ** 31 - 1) return bad('Geçersiz harita')
  const b = ((await req.json().catch(() => null)) ?? {}) as { action?: unknown }
  try {
    if (b.action === 'play') {
      // aynı bağlantıdan aynı haritaya saatte bir kez sayılır: sayaç düğmeye basılarak şişirilmesin
      if (await hit(LIMITS.mapPlay, `${ipKey(req)}:${id}`)) return NextResponse.json({ plays: null })
      const row = (await db().execute(sql`update seksek_maps set plays = plays + 1 where id = ${id} returning plays`)).rows[0] as { plays: number } | undefined
      return row ? NextResponse.json(row) : bad('Harita bulunamadı', 404)
    }
    if (b.action !== 'like') return bad('Geçersiz istek')
    const me = await mapViewer(req)
    if (!me) return bad('Beğenmek için giriş yap.', 401)
    const wait = await hit(LIMITS.mapLike, playerKey(me.id))
    if (wait) return tooMany(wait, 'Çok sık beğeni gönderildi, biraz sonra tekrar dene')
    const row = (
      await db().execute(sql`
        with ins as (
          insert into seksek_map_likes (map_id, player_id)
          select ${id}, ${me.id} where exists (select 1 from seksek_maps where id = ${id})
          on conflict do nothing returning 1),
        del as (
          delete from seksek_map_likes where map_id = ${id} and player_id = ${me.id} and not exists (select 1 from ins) returning 1)
        update seksek_maps set likes = greatest(0, likes + (select count(*)::int from ins) - (select count(*)::int from del))
        where id = ${id}
        returning likes, (select count(*) from ins) > 0 as liked`)
    ).rows[0] as { likes: number; liked: boolean } | undefined
    return row ? NextResponse.json(row) : bad('Harita bulunamadı', 404)
  } catch {
    return bad('Topluluk haritaları şu an kapalı.', 503)
  }
}

/**
 * Sahibin kontrolü: harita yoksa 404, başkasınınsa 403. Oturum yoksa 401, hız sınırı aşıldıysa 429 yanıtı döner.
 * Başarıda null (devam).
 */
async function ownerGate(req: NextRequest, id: number, verb: string) {
  const me = await mapViewer(req)
  if (!me) return { res: bad(`${verb} için giriş yap.`, 401) }
  const wait = await hit(LIMITS.mapEdit, playerKey(me.id))
  if (wait) return { res: tooMany(wait, 'Çok sık değişiklik gönderildi, biraz sonra tekrar dene') }
  const row = (await db().execute(sql`select player_id from seksek_maps where id = ${id}`)).rows[0] as { player_id: string } | undefined
  if (!row) return { res: bad('Harita bulunamadı', 404) }
  if (row.player_id !== me.id) return { res: bad('Bu harita senin değil.', 403) }
  return { res: null, me }
}

/**
 * PUT { code, title, solved: true } → { id, code }: sahibi yayındaki haritayı aynı bağlantıyla günceller. Beğeni ve
 * oynanma sayıları, yayın tarihi korunur; `updated_at` dolar. Yayındakiyle aynı şartlar (çözücü bayrağı, başlık, kod
 * doğrulaması); kod başka bir yayındaki haritayla aynıysa 409.
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (crossSite(req)) return crossSiteError()
  const id = await mapId(ctx)
  if (!id) return bad('Geçersiz harita')
  const body = await readMapBody(req)
  if ('res' in body) return body.res
  try {
    const g = await ownerGate(req, id, 'Güncellemek')
    if (g.res) return g.res
    const dup = (await db().execute(sql`select id from seksek_maps where code = ${body.code} and id <> ${id} limit 1`)).rows[0] as { id: number } | undefined
    if (dup) return bad('Bu harita zaten yayında.', 409, { id: dup.id })
    const row = (
      await db().execute(sql`
        update seksek_maps set code = ${body.code}, title = ${body.title}, city = ${body.city}, author = ${g.me.name}, updated_at = now()
        where id = ${id} and player_id = ${g.me.id} returning id`)
    ).rows[0] as { id: number } | undefined
    return row ? NextResponse.json({ id: row.id, code: body.code }) : bad('Harita bulunamadı', 404)
  } catch {
    return bad('Topluluk haritaları şu an kapalı.', 503)
  }
}

/** DELETE → { ok: true }: sahibi haritasını galeriden kaldırır (beğeniler birlikte silinir). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (crossSite(req)) return crossSiteError()
  const id = await mapId(ctx)
  if (!id) return bad('Geçersiz harita')
  try {
    const g = await ownerGate(req, id, 'Silmek')
    if (g.res) return g.res
    await db().execute(sql`delete from seksek_maps where id = ${id} and player_id = ${g.me.id}`)
    return NextResponse.json({ ok: true })
  } catch {
    return bad('Topluluk haritaları şu an kapalı.', 503)
  }
}
