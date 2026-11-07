import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Pixelify_Sans } from 'next/font/google'
import './globals.css'

const pixel = Pixelify_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-pixel', weight: ['500', '700'] })
const plex = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-plex', weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: 'Memleket · Şehir Şehir Anadolu',
  description: 'İstanbul’dan Bayburt’a, her şehri kendi dokusu ve hikâyeleriyle aşan bir piksel platform oyunu. Mobilde ve webde oynanır.',
  applicationName: 'Memleket',
  openGraph: {
    title: 'Memleket · Şehir Şehir Anadolu',
    description: 'İstanbul’dan Bayburt’a piksel platform oyunu: martılar, kayısı kasaları, Hitit ok tuzakları, buzlu Kızılırmak.',
    locale: 'tr_TR',
    type: 'website',
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
