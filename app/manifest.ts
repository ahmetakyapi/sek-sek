import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Seksek · Şehir Şehir Anadolu',
    short_name: 'Seksek',
    description: 'İstanbul’dan Bayburt’a 8 şehirlik piksel platform oyunu.',
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
