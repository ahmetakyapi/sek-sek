import { sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { LIMITS, hit, ipKey } from '@/lib/rateLimit'
import { mapViewer } from '../who'

export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/**
 * POST { action: 'like' } → { liked, likes }: giriş yapan oyuncunun beğenisini açar ya da kapatır (tek ifadede: ekleme
 * olmadıysa silinir, sayaç farkla güncellenir).
 * POST { action: 'play' } → { plays }: galerideki "Oyna" düğmesi yönlendirmeden önce çağırır; giriş gerekmez.
 * Tablo yoksa 503, harita yoksa 404.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
