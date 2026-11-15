import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MapGallery from '@/components/MapGallery'

export const metadata: Metadata = {
  title: 'Topluluk Haritaları · Sek-Sek',
  description: 'Sek-Sek yolcularının Bölüm Düzenleyici’de çizip yayınladığı haritalar: en yeniler, en beğenilenler, en çok oynananlar.',
  alternates: { canonical: '/haritalar' },
}

/** Topluluk Haritaları: düzenleyicide çözücüyle sınanıp yayınlanan haritaların galerisi */
export default function Haritalar() {
  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <header className="border-b-2 border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Oyuna dön">
            <Logo size={32} />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/duzenle" className="hover:text-cream">
              Harita Çiz
            </Link>
            <Link href="/" className="pixel-btn primary py-2 text-sm">
              ▶ Hemen Oyna
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[12px] font-bold tracking-[0.3em] text-accent">YOLCULARIN ÇİZDİĞİ</p>
        <h1 className="mt-2 font-display text-4xl text-cream sm:text-5xl">Topluluk Haritaları</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          Her biri Bölüm Düzenleyici’de çizildi ve çözücüyle bitirilebilir olduğu kanıtlandı. Birini seç, oyna, beğendiysen kalbini bırak.
        </p>
        <div className="mt-6">
          <MapGallery />
        </div>
      </main>
    </div>
  )
}
