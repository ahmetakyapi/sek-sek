import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sek-Sek · Şehir Şehir Anadolu',
    short_name: 'Sek-Sek',
    description: 'İstanbul’dan Bayburt’a 25 şehirlik platform oyunu.',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#120f1a',
    theme_color: '#120f1a',
    lang: 'tr',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
