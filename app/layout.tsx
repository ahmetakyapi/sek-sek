import type { Metadata, Viewport } from 'next'
import { Figtree, Grandstander } from 'next/font/google'
import './globals.css'

/**
 * Yazı dili: başlıklar Grandstander (elle yazılmış gibi, sıcak; rakamları ve Türkçe harfleri net), gövde Figtree
 * (okunaklı, eş genişlikli rakam desteği var). Piksel font (Pixelify Sans) küçük boyda yoruyordu, 2/5/8 karışıyordu;
 * oyunun çizimi de piksel değil, mürekkep hatlı vektör: yazı artık onunla aynı elden çıkmış gibi durur.
 */
const title = Grandstander({ subsets: ['latin', 'latin-ext'], variable: '--font-title', weight: ['600', '700', '800'] })
const body = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-body', weight: ['400', '500', '600', '700'] })

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sek-sek.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Sek-Sek · Şehir Şehir Anadolu',
  keywords: ['platform oyunu', 'piksel oyun', 'Türkiye şehirleri', 'mobil oyun', 'tarayıcı oyunu', 'İstanbul', 'Bayburt'],
  alternates: { canonical: '/' },
  twitter: {
    card: 'summary_large_image',
    title: 'Sek-Sek · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 30 şehirlik platform oyunu. Simitçiden kale burcuna tek defterde bir yolculuk.',
  },
  description: 'İstanbul’dan Bayburt’a 30 şehir: her şehri kendi dokusu, insanları ve hikâyeleriyle aşan bir platform oyunu.',
  applicationName: 'Sek-Sek',
  openGraph: {
    title: 'Sek-Sek · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 30 şehir ve 90 hatıra. Martılar, cumbalar, kayısı kasaları ve Hitit ok tuzakları seni bekliyor.',
    locale: 'tr_TR',
    type: 'website',
    siteName: 'Sek-Sek',
    url: '/',
  },
  appleWebApp: { capable: true, title: 'Sek-Sek', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#120f1a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${title.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
