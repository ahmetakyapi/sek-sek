import type { MetadataRoute } from 'next'
import { LEVELS } from '@/game/levels'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sek-sek.vercel.app'

/** Dizinlenen sayfalar: oyun, tanıtım, sıralama, haritalar, düzenleyici ve 30 şehrin tanıtım sayfası. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/hakkinda`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/siralama`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE}/haritalar`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE}/duzenle`, changeFrequency: 'monthly', priority: 0.4 },
  ]
  return [...pages, ...LEVELS.map((l) => ({ url: `${SITE}/sehir/${l.id}`, changeFrequency: 'monthly' as const, priority: 0.7 }))]
}
