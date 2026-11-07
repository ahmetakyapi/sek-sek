import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { LEVELS } from '@/game/levels'
import { parseShare, shareQuery } from '@/lib/share'
import { formatTime } from '@/lib/storage'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const d = parseShare(await searchParams)
  if (!d) return { title: 'Skor Kartı · Sek-Sek' }
  const l = LEVELS.find((x) => x.id === d.level)!
  const title = `${d.name || 'Bir yolcu'} ${l.name}’u ${formatTime(d.timeMs)} sürede geçti · Sek-Sek`
  const description = `${d.deaths} düşüş, ${d.items}/3 hatıra. İstanbul’dan Bayburt’a 8 şehirlik piksel platform oyunu: sen de dene!`
  const image = `/skor/kart?${shareQuery(d)}`
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: `${l.name} skor kartı` }], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: { index: false },
  }
}

export default async function SkorPage({ searchParams }: Props) {
  const d = parseShare(await searchParams)
  const l = d ? LEVELS.find((x) => x.id === d.level)! : null
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
        {d && l ? (
          <>
            <p className="text-[12px] font-bold tracking-[0.3em] text-accent">SKOR KARTI</p>
            <h1 className="mt-2 font-display text-4xl text-cream">
              {d.name || 'Bir yolcu'} {l.name} şehrini geçti
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/skor/kart?${shareQuery(d)}`} alt={`${l.name}: ${formatTime(d.timeMs)}, ${d.deaths} düşüş, ${d.items}/3 hatıra`} width={1200} height={630} className="pixel-panel mt-6 h-auto w-full p-0" />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/?sehir=${l.id}`} className="pixel-btn primary px-6 py-3">
                ▶ {l.name} Rekorunu Kır
              </Link>
              <Link href="/hakkinda" className="pixel-btn px-6 py-3">
                Oyunu Tanı
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl">Bu skor kartı açılamadı</h1>
            <p className="mt-3 text-muted">Bağlantı eksik ya da bozuk olabilir. Oyuna buradan başlayabilirsin.</p>
            <Link href="/" className="pixel-btn primary mt-6 px-6 py-3">
              ▶ Hemen Oyna
            </Link>
          </>
        )}
      </main>
    </div>
  )
}
