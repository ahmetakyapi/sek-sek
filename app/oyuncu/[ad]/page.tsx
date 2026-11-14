import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq, inArray, sql } from 'drizzle-orm'
import Logo from '@/components/Logo'
import { medalFor } from '@/components/medal'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { findByName } from '@/lib/players'
import { currentKeys, scoreCity } from '@/lib/scoreKey'
import { scores } from '@/lib/schema'
import { formatTime } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ad: string }> }

const MEDAL = { altin: ['Altın', '#e3a92c'], gumus: ['Gümüş', '#c9d0da'], bronz: ['Bronz', '#c97a44'] } as const

async function load(ad: string) {
  const name = decodeURIComponent(ad)
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
  // yalnız şehirlerin bugünkü haritalarının skorları sayılır
  return { player, byLevel: new Map(rows.map((r) => [scoreCity(r.level), r])) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent((await params).ad)
  return { title: `${name} · Sek-Sek Yolcusu`, description: `${name} adlı yolcunun Sek-Sek’te geçtiği şehirler, süreleri ve hatıraları.`, robots: { index: false } }
}

export default async function OyuncuPage({ params }: Props) {
  const data = await load((await params).ad)
  if (!data) notFound()
  const { player, byLevel } = data
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
      <header className="border-b-2 border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Logo size={32} />
          </Link>
          <Link href="/" className="pixel-btn primary py-2 text-sm">
            ▶ Hemen Oyna
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-[12px] font-bold tracking-[0.3em] text-accent">YOLCU DEFTERİ</p>
        <h1 className="mt-2 break-words font-display text-5xl text-cream">{player.name}</h1>
        <p className="mt-2 text-muted">{since} tarihinden beri yolda.</p>

        <dl className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {stats.map(([k, v], i) => (
            <div key={k} className={`pixel-panel px-4 py-3 ${i === stats.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <dt className="text-[11px] font-bold tracking-[0.18em] text-muted">{k.toLocaleUpperCase('tr')}</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums text-cream">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 font-display text-3xl text-cream">Şehir Şehir</h2>
        <p className="mt-1 text-[13px] text-muted">Her şehirdeki en iyi süre, en az düşüş ve en çok hatıra. Sıra, şehrin bütün yolcuları arasında süreye göre.</p>
        <ol className="mt-4 grid gap-2">
          {LEVELS.map((l) => {
            const r = byLevel.get(l.id)
            const medal = r ? medalFor(l, r.timeMs) : null
            return (
              <li key={l.id} className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-2 px-3 py-2.5 ${r ? 'border-line bg-panel-2/50' : 'border-line/50 opacity-60'}`}>
                <span className="plate justify-self-start text-[15px]">
                  <span>{String(l.plate).padStart(2, '0')}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg text-cream">{l.name}</span>
                  <span className="block text-[12px] text-muted">
                    {r ? (
                      <>
                        ✕{r.deaths} düşüş · {r.items}/3 hatıra · {r.plays} kez · {r.rank}. sırada
                        {medal && (
                          <>
                            {' · '}
                            <span style={{ color: MEDAL[medal][1] }}>{MEDAL[medal][0]}</span>
                          </>
                        )}
                      </>
                    ) : (
                      'Henüz geçilmedi'
                    )}
                  </span>
                </span>
                <span className="font-display text-xl tabular-nums text-cream">{r ? formatTime(r.timeMs) : '—'}</span>
              </li>
            )
          })}
        </ol>
      </main>
    </div>
  )
}
