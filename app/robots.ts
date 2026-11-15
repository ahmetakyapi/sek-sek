import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sek-sek.vercel.app'

/** API, paylaşım kartları (/skor) ve oyuncu sayfaları dizinlenmez (sayfalarda zaten noindex var). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/skor', '/oyuncu/'] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
