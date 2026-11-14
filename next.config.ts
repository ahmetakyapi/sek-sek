import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // skor kartı görseli fontları, amblemi ve portreyi dosyadan okur
  outputFileTracingIncludes: { '/skor/kart': ['./assets/**', './public/portreler/**'] },
  async headers() {
    return [
      // şehir görselleri ve portreler: adı sabit, içeriği seyrek değişir; bir gün önbellek, arka planda tazeleme
      {
        source: '/(sehirler|portreler)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
