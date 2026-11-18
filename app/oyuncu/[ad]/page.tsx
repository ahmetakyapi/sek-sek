import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { and, eq, inArray, sql } from 'drizzle-orm'
import SiteHeader from '@/components/SiteHeader'
import { medalFor } from '@/components/medal'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { findByName } from '@/lib/players'
import { currentKeys, scoreCity } from '@/lib/scoreKey'
import { scores } from '@/lib/schema'
import { formatTime } from '@/lib/storage'
import { istanbulDay, tournamentWeek } from '@/lib/extras'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ad: string }> }

const MEDAL = { altin: ['Altın', '#e3a92c'], gumus: ['Gümüş', '#c9d0da'], bronz: ['Bronz', '#c97a44'] } as const

/** Bozuk yüzde kodlaması ("%E0") sayfayı 500'e düşürmesin; ad en çok 32 karakter okunur */
const adOf = (ad: string) => {
  try {
    return decodeURIComponent(ad).slice(0, 32)
  } catch {
    return ad.slice(0, 32)
  }
}

async function load(ad: string) {
  const name = adOf(ad)
  const player = await findByName(name).catch(() => null)
  if (!player) return null
  const rows = await db()
    .select({
      level: scores.level,
      timeMs: scores.timeMs,
      deaths: sql<number>`coalesce(${scores.minDeaths}, ${scores.deaths})`,
      items: sql<number>`coalesce(${scores.maxItems}, ${scores.items})`,
      plays: scores.plays,
      createdAt: scores.createdAt,
      rank: sql<number>`(select count(*)::int + 1 from seksek_scores o where o.level = ${scores.level} and o.time_ms < ${scores.timeMs})`,
    })
    .from(scores)
    .where(and(eq(scores.playerId, player.id), inArray(scores.level, currentKeys())))
  // Haftalık Turnuva kürsüleri: kapanmış haftalarda üçü de bitirenler arasında ilk üç (kalıcı rozet)
  const week = tournamentWeek(istanbulDay(new Date()))
  const podium = await db()
    .execute(
      sql`with w as (select split_part(level, ':', 2) as week, player_id, sum(time_ms) as total, count(*) as n
                     from seksek_scores where level like 'turnuva:%' group by 1, 2),
          r as (select week, player_id, row_number() over (partition by week order by total asc)::int as rank from w where n = 3 and week < ${week})
          select rank, count(*)::int as n from r where player_id = ${player.id} and rank <= 3 group by rank`,
    )
    .then((r) => Object.fromEntries((r.rows as { rank: number; n: number }[]).map((x) => [x.rank, x.n])) as Record<number, number>)
    .catch(() => ({}) as Record<number, number>)
  // yalnız şehirlerin bugünkü haritalarının skorları sayılır
  return { player, podium, byLevel: new Map(rows.map((r) => [scoreCity(r.level), r])) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = adOf((await params).ad)
  return { title: `${name} · Sek-Sek Yolcusu`, description: `${name} adlı yolcunun Sek-Sek’te geçtiği şehirler, süreleri ve hatıraları.`, robots: { index: false } }
}

export default async function OyuncuPage({ params }: Props) {
  const data = await load((await params).ad)
  if (!data) notFound()
  const { player, podium, byLevel } = data
  const done = LEVELS.filter((l) => byLevel.has(l.id))
  const totalTime = done.reduce((a, l) => a + byLevel.get(l.id)!.timeMs, 0)
  const totalDeaths = done.reduce((a, l) => a + byLevel.get(l.id)!.deaths, 0)
  const totalItems = done.reduce((a, l) => a + byLevel.get(l.id)!.items, 0)
  const golds = done.filter((l) => medalFor(l, byLevel.get(l.id)!.timeMs) === 'altin').length
  const since = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(player.createdAt)
  const stats: [string, string][] = [
    ['Şehir', `${done.length}/${LEVELS.length}`],
    ['Toplam Süre', done.length ? formatTime(totalTime) : '—'],
    ['Düşüş', String(totalDeaths)],
    ['Hatıra', `${totalItems}/${LEVELS.length * 3}`],
    ['Altın Madalya', String(golds)],
  ]

  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:pt-10" style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}>
        <p className="text-[14px] font-semibold text-accent-2">Yolcu Defteri</p>
        <h1 className="mt-1 break-words font-display text-4xl leading-tight text-cream sm:text-5xl">{player.name}</h1>
        <p className="mt-1 text-[15px] text-muted">{since} tarihinden beri yolda.</p>
        {[1, 2, 3].some((r) => podium[r]) && (
          <p className="mt-3 flex flex-wrap gap-2" aria-label="Haftalık Turnuva kürsüleri">
            {([1, 2, 3] as const).map((r) =>
              podium[r] ? (
                <span key={r} className="border-2 px-2.5 py-1 text-[13px] font-bold" style={{ borderColor: ['#e3a92c', '#c9d0da', '#c97a44'][r - 1], color: ['#e3a92c', '#c9d0da', '#c97a44'][r - 1] }}>
                  {['🥇', '🥈', '🥉'][r - 1]} Turnuva {['Birincisi', 'İkincisi', 'Üçüncüsü'][r - 1]}{podium[r] > 1 ? ` × ${podium[r]}` : ''}
                </span>
              ) : null,
            )}
          </p>
        )}

        {/* özet: telefonda 3 + 2, geniş ekranda tek sıra; kutular sade, sayı önde */}
        <dl className="mt-5 grid grid-cols-6 gap-2 sm:mt-7 sm:grid-cols-5">
          {stats.map(([k, v], i) => (
            <div key={k} className={`flex flex-col-reverse border-2 border-line bg-panel-2/40 px-3 py-2.5 sm:col-span-1 ${i < 3 ? 'col-span-2' : 'col-span-3'}`}>
              <dt className="mt-1.5 text-[12px] leading-tight text-muted">{k}</dt>
              <dd className="font-display text-xl leading-none tabular-nums text-cream sm:text-2xl">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-8 font-display text-2xl text-cream sm:mt-10 sm:text-3xl">Şehir Şehir</h2>
        <p className="mt-1 text-[14px] text-muted">En iyi süre, en az düşüş ve en çok hatıra; sıra, şehrin bütün yolcuları arasında süreye göre.</p>
        <ol className="mt-3 grid gap-1.5 sm:mt-4 sm:gap-2">
          {LEVELS.map((l) => {
            const r = byLevel.get(l.id)
            const medal = r ? medalFor(l, r.timeMs) : null
            return (
              <li key={l.id} className={`grid grid-cols-[2.6rem_minmax(0,1fr)_auto] items-center gap-2.5 border-2 px-2.5 py-2 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-3 sm:py-2.5 ${r ? 'border-line bg-panel-2/50' : 'border-line/50 opacity-60'}`}>
                <span className="plate justify-self-start text-[13px] sm:text-[15px]">
                  <span>{String(l.plate).padStart(2, '0')}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[17px] leading-tight text-cream sm:text-lg">{l.name}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                    {r ? (
                      <>
                        ✕{r.deaths} düşüş · {r.items}/3 hatıra · {r.plays} kez ·{' '}
                        {/* sıra ve madalya birlikte kırılır: satır "·" ile başlamasın */}
                        <span className="whitespace-nowrap">
                          {r.rank}. sırada
                          {medal && (
                            <>
                              {' · '}
                              <span style={{ color: MEDAL[medal][1] }}>{MEDAL[medal][0]}</span>
                            </>
                          )}
                        </span>
                      </>
                    ) : (
                      'Henüz geçilmedi'
                    )}
                  </span>
                </span>
                <span className="font-display text-lg tabular-nums text-cream sm:text-xl">{r ? formatTime(r.timeMs) : '—'}</span>
              </li>
            )
          })}
        </ol>
      </main>
    </div>
  )
}
