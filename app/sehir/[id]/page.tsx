import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Logo from '@/components/Logo'
import { BOSSES } from '@/game/boss'
import { FEATURES } from '@/game/features'
import { LEVELS } from '@/game/levels'

/** Şehir başına tanıtım sayfası: arama motoru ve paylaşım için; oyuna `?sehir=` ile girer (kilit kuralı oyunda kalır). */

const DIFF_COLOR: Record<string, string> = { Kolay: '#7fc97a', Orta: '#f2c14e', Zor: '#f08a4a', 'Çok Zor': '#e5484d' }

const plate = (n: number) => String(n).padStart(2, '0')

type Props = { params: Promise<{ id: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return LEVELS.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const l = LEVELS.find((x) => x.id === id)
  if (!l) return {}
  const title = `${l.name} · ${l.subtitle} · Sek-Sek`
  const image = { url: `/sehirler/${l.id}.webp`, width: 800, height: 420, alt: `${l.name} bölümünden görüntü` }
  return {
    title,
    description: l.intro,
    alternates: { canonical: `/sehir/${l.id}` },
    openGraph: { title, description: l.intro, type: 'website', locale: 'tr_TR', siteName: 'Sek-Sek', url: `/sehir/${l.id}`, images: [image] },
    twitter: { card: 'summary_large_image', title, description: l.intro, images: [image.url] },
  }
}

export default async function Sehir({ params }: Props) {
  const { id } = await params
  const i = LEVELS.findIndex((x) => x.id === id)
  if (i < 0) notFound()
  const l = LEVELS[i]
  const prev = LEVELS[i - 1]
  const next = LEVELS[i + 1]
  const boss = BOSSES[l.city]

  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <header className="border-b-2 border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Oyuna Dön">
            <Logo size={32} />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/hakkinda#sehirler" className="hidden hover:text-cream sm:block">
              Bütün Şehirler
            </Link>
            <Link href="/siralama" className="hidden hover:text-cream sm:block">
              Sıralama
            </Link>
            <Link href="/" className="pixel-btn primary py-2 text-sm">
              ▶ Hemen Oyna
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-start">
          <figure className="relative border-2 border-line bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sehirler/${l.id}.webp`} alt={`${l.name} bölümünden görüntü`} width={800} height={420} className="block aspect-[40/21] h-auto w-full" style={{ imageRendering: 'pixelated' }} />
            <span className="plate absolute left-3 top-3 text-2xl">
              <span>{plate(l.plate)}</span>
            </span>
            <span className="absolute right-3 top-3 bg-ink/85 px-2 py-1 text-[12px] font-bold" style={{ color: DIFF_COLOR[l.difficulty] }}>
              {plate(i + 1)}. Şehir · {l.difficulty}
            </span>
            <div className="kilim absolute inset-x-0 bottom-0" />
          </figure>

          <div>
            <p className="text-[12px] font-bold tracking-[0.3em] text-accent">{l.subtitle.toLocaleUpperCase('tr')}</p>
            <h1 className="mt-2 font-display text-5xl leading-[1] text-cream sm:text-6xl">
              {l.name}
              {l.nickname && <span className="block text-2xl text-accent-2 sm:text-3xl">({l.nickname})</span>}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-cream/85">{l.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/?sehir=${l.id}`} className="pixel-btn primary px-6 py-3 text-lg">
                ▶ Bu Şehirde Oyna
              </Link>
            </div>
            <p className="mt-2 text-[12px] text-muted">Şehir yolculukta açıldıysa doğrudan oradan başlarsın; açılmadıysa kaldığın yerden.</p>
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Şehirde Neler Var">
          <div className="pixel-panel p-5">
            <h2 className="font-display text-2xl text-cream">Yol Boyunca</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{FEATURES[l.id]?.tr}</p>
            <p className="mt-3 text-[14px] text-gold">◆ Hatıra: {l.item}</p>
          </div>
          <div className="pixel-panel p-5">
            <h2 className="font-display text-2xl text-cream">Meydanın Boss’u</h2>
            <p className="mt-2 font-display text-xl text-accent-2">{boss.name}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{boss.taunt}</p>
          </div>
          <div className="pixel-panel p-5">
            <h2 className="font-display text-2xl text-cream">Gezgin’in Notu</h2>
            <p className="mt-2 text-[14px] italic leading-relaxed text-muted">“{l.note}”</p>
          </div>
        </section>

        <section className="mt-6 border-2 border-line p-5" aria-label="Defterden Bir Sayfa">
          <p className="text-[12px] font-bold tracking-[0.3em] text-accent">DEFTERDEN BİR SAYFA</p>
          <h2 className="mt-1 font-display text-2xl text-gold">{l.facts[0].title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{l.facts[0].text}</p>
          <p className="mt-2 text-[12px] text-muted">Diğer iki sayfa ve gizli pulun sayfası oyunda, hatıraları toplayınca açılır.</p>
        </section>

        <nav className="mt-10 grid grid-cols-2 gap-4" aria-label="Önceki ve Sonraki Şehir">
          {prev ? (
            <Link href={`/sehir/${prev.id}`} className="pixel-btn justify-start py-3 text-sm sm:text-base">
              ← {plate(prev.plate)} {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/sehir/${next.id}`} className="pixel-btn justify-end py-3 text-right text-sm sm:text-base">
              {plate(next.plate)} {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-muted">
          <Logo size={24} />
          <Link href="/hakkinda" className="hover:text-cream">
            Oyun Hakkında
          </Link>
        </div>
      </footer>
    </div>
  )
}
