---
paths:
  - "next.config.ts"
  - "public/sw.js"
  - "components/PwaRegister.tsx"
  - "components/Telemetry.tsx"
  - ".github/workflows/**"
  - "app/skor/kart/**"
  - "package.json"
  - "scripts/art/banners.cjs"
  - "lib/useInstallPrompt.ts"
---

# Yayın, çevrimdışı, izleme, fonksiyon boyutu

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

## Çevrimdışı ve izleme

- `public/sw.js` (kaydı `components/PwaRegister.tsx`, yalnız üretimde): `/_next/static`, şehir görselleri ve portreler önce
  önbellekten, sayfalar önce ağdan (çevrimdışında önbellekteki `/`), `/api/*` hiç önbelleğe girmez. Önbelleğe giren yolların
  davranışını değiştirirsen `VERSION`ı artır. "Ana Ekrana Ekle" `lib/useInstallPrompt.ts` → Ayarlar.
- Vercel Analytics + Speed Insights `components/Telemetry.tsx`: adresin sorgu kısmı silinerek gönderilir (`?yaris=` ad, `?ozel=` harita taşır).
- CI (`.github/workflows/ci.yml`): typecheck, test, build; 46 şehrin her biri için verify-levels → verify-respawn → bossbot.
  Yeni şehir eklenince matrise yaz.

## Yayın boyutu (kalıcı kural, 23 Kasım 2026)

Vercel fonksiyonları küçük kalır: `/skor/kart` 80 MB'tı (sharp'ın glibc + musl + wasm kitaplıkları ~47 MB, README görselleri, 10 MB şehir
sahnesi), şimdi ~9 MB; bütün fonksiyonların tekil dosyaları ~17 MB. `next.config.ts` `outputFileTracingExcludes`: sharp ve `@img`, `docs/`,
`scripts/`, `tests/`, `.claude/`, `tsconfig.tsbuildinfo` hiçbir fonksiyona girmez; kart kaynak kodu ve `public/sehirler`i almaz (dosya okuyan tek
yer `app/skor/kart/route.tsx`: `assets/` + `public/portreler`). `assets/cities/*.png` 256 renkli paletli PNG'dir (`banners.cjs` öyle yazar).
Sunucuda dosya okuyan yeni bir yer ya da ağır paket eklersen ölç: `npm run build` sonra `.next/server/**/*.nft.json` dosyalarının boyutu
(betik: her nft dosyasındaki `files` yollarının boyutunu topla); bir fonksiyon 15 MB'ı geçmesin.
