import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Pixelify_Sans } from 'next/font/google'
import './globals.css'

const pixel = Pixelify_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-pixel', weight: ['500', '700'] })
const plex = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-plex', weight: ['400', '600', '700'] })

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://memleket-ten.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Memleket · Şehir Şehir Anadolu',
  keywords: ['platform oyunu', 'piksel oyun', 'Türkiye şehirleri', 'mobil oyun', 'tarayıcı oyunu', 'İstanbul', 'Bayburt'],
  alternates: { canonical: '/' },
  twitter: {
    card: 'summary_large_image',
    title: 'Memleket · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 8 şehirlik piksel platform oyunu. Mobilde ve webde ücretsiz oyna.',
  },
  description: 'İstanbul’dan Bayburt’a 8 şehir: her şehri kendi dokusu, insanları ve hikâyeleriyle aşan bir piksel platform oyunu. Mobilde ve webde ücretsiz oynanır.',
  applicationName: 'Memleket',
  openGraph: {
    title: 'Memleket · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a 8 şehir, 24 hatıra. Martılar, cumbalar, kayısı kasaları, Hitit ok tuzakları. Mobilde ve webde ücretsiz oyna.',
    locale: 'tr_TR',
    type: 'website',
    siteName: 'Memleket',
    url: '/',
  },
  appleWebApp: { capable: true, title: 'Memleket', statusBarStyle: 'black-translucent' },
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
    <html lang="tr" className={`${pixel.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  )
}
