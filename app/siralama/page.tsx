import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import PublicBoard from './PublicBoard'

export const metadata: Metadata = {
  title: 'Sıralama · Sek-Sek',
  description: 'Sek-Sek skor tablosu: genel sıralama, şehir şehir en iyi süreler, Günlük Meydan Okuma ve koleksiyoncular.',
  alternates: { canonical: '/siralama' },
}

/** Herkese açık skor tablosu: oyuna girmeden bakılır, paylaşılır. Oyundaki tabloyla aynı bileşen. */
export default function Siralama() {
  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <header className="border-b-2 border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Oyuna dön">
            <Logo size={32} />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/hakkinda" className="hidden hover:text-cream sm:block">
              Oyun Hakkında
            </Link>
            <Link href="/" className="pixel-btn primary py-2 text-sm">
              ▶ Hemen Oyna
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-[12px] font-bold tracking-[0.3em] text-accent">YOLCULAR ARASINDA</p>
        <h1 className="mt-2 font-display text-5xl text-cream">Sıralama</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          28 şehirde en hızlılar, en az düşenler, en çok hatıra toplayanlar ve bugünün meydan okuması. Bir ada dokun, yolcunun defterini aç.
        </p>
        <div className="pixel-panel mt-6 flex h-[min(720px,calc(100dvh-140px))] min-h-[420px] flex-col p-4 sm:p-5">
          <PublicBoard />
        </div>
      </main>
    </div>
  )
}
