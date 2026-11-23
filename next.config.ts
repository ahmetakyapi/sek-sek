import type { NextConfig } from 'next'

const dev = process.env.NODE_ENV !== 'production'

/**
 * İçerik Güvenliği Politikası: her şey kendi kökenimizden. Inline betik Next'in hidrasyon verisi için gerekir
 * (nonce her sayfayı dinamik yapardı); geliştirmede React eval ister. Vercel Analytics ve Speed Insights üretimde
 * `/_vercel/*` altından aynı kökenden gelir; va.vercel-scripts.com yalnız hata ayıklama betiği için. Görsel ve
 * dosyalar data:/blob: (tuval, Fotoğraf Kipi, kartpostal), worker kendi kökenimizden (çözücü, service worker).
 * Değiştirirsen `npx next start` ile oyunu, /duzenle ve /haritalar'ı açıp konsolda CSP ihlali olmadığına bak.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://vitals.vercel-insights.com${dev ? ' ws: wss:' : ''}`,
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // skor kartı görseli fontları, amblemi ve portreyi dosyadan okur
  outputFileTracingIncludes: { '/skor/kart': ['./assets/**', './public/portreler/**'] },
  // Vercel fonksiyonları küçük kalsın (23 Kasım 2026: /skor/kart 80 MB'tı). sharp Next'in isteğe bağlı görsel kütüphanesi:
  // görsel iyileştirmesi Vercel'de, skor kartı next/og (resvg) ile çizilir, hiçbir fonksiyon sharp'ı çağırmaz. README görselleri,
  // betikler ve testler sunucuda okunmaz; dinamik `readFile(join(process.cwd(), …))` izleyiciye bunları da katıyordu.
  outputFileTracingExcludes: {
    '*': ['node_modules/@img/**', 'node_modules/sharp/**', 'docs/**', 'scripts/**', 'tests/**', '.claude/**', 'README.md', 'AGENTS.md', 'CLAUDE.md', 'tsconfig.tsbuildinfo'],
    // kart yalnız assets/ ve public/portreler okur (tek dosya okuyan yer); kaynak kod derlenmiş hâliyle .next/server'dadır
    '/skor/kart': ['public/sehirler/**', 'app/**', 'components/**', 'game/**', 'lib/**', 'drizzle/**'],
  },
  async headers() {
    return [
      // şehir görselleri ve portreler: adı sabit, içeriği seyrek değişir; bir gün önbellek, arka planda tazeleme
      {
        source: '/(sehirler|portreler)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      // service worker: tarayıcı her açılışta yeni sürümü sorsun (eski worker eski önbellekte takılı kalmasın)
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig
