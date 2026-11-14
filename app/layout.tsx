import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Pixelify_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const pixel = Pixelify_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-pixel', weight: ['500', '700'] })
/**
 * Rakamlar: Pixelify Sans'ın 2, 5 ve 8'i küçük boyda birbirine (ve S'ye) karışıyordu. Başlık fontunun önüne yalnız
 * rakam aralığını (U+30-39) kapsayan Jersey 20 (OFL) konur: süreler, skorlar ve plakalar her yerde net okunur,
 * harfler Pixelify kalır. Dosya yalnız on rakamı içerir (4 KB).
 */
const digits = localFont({ src: './fonts/jersey20-digits.woff2', variable: '--font-digits', weight: '400 700', display: 'swap', declarations: [{ prop: 'unicode-range', value: 'U+30-39' }, { prop: 'size-adjust', value: '112%' }] })
const plex = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-plex', weight: ['400', '600', '700'] })

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sek-sek.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Sek-Sek · Şehir Şehir Anadolu',
  keywords: ['platform oyunu', 'piksel oyun', 'Türkiye şehirleri', 'mobil oyun', 'tarayıcı oyunu', 'İstanbul', 'Bayburt'],
  alternates: { canonical: '/' },
  twitter: {
    card: 'summary_large_image',
    title: 'Sek-Sek · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 28 şehirlik platform oyunu. Simitçiden kale burcuna tek defterde bir yolculuk.',
  },
  description: 'İstanbul’dan Bayburt’a 28 şehir: her şehri kendi dokusu, insanları ve hikâyeleriyle aşan bir platform oyunu.',
  applicationName: 'Sek-Sek',
  openGraph: {
    title: 'Sek-Sek · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 28 şehir ve 84 hatıra. Martılar, cumbalar, kayısı kasaları ve Hitit ok tuzakları seni bekliyor.',
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
    <html lang="tr" className={`${digits.variable} ${pixel.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  )
}
