import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export default function NotFound() {
  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 pt-14 text-center sm:pt-20">
        <p className="text-[14px] font-semibold text-accent-2">Yol Burada Bitiyor</p>
        <h1 className="mt-1 font-display text-4xl leading-tight text-cream [text-wrap:balance] sm:text-5xl">Bu Sayfa Defterde Yok</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted [text-wrap:pretty]">
          Bağlantı eksik ya da eskimiş olabilir. Bir yolcu adı aradıysan harfleri bir daha kontrol et.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className="pixel-btn primary px-6">
            ▶ Oyuna Dön
          </Link>
          <Link href="/siralama" className="pixel-btn px-6">
            Sıralama
          </Link>
        </div>
      </main>
    </div>
  )
}
