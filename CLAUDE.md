# Sek-Sek · Claude için çalışma rehberi

Türkiye’nin 16 şehrini gezen piksel platform oyunu. Next.js 16 + React 19.2 + Tailwind v4, kendi canvas motoru,
Neon/Drizzle skor tablosu, Vercel’de `main`den otomatik yayın: https://sek-sek.vercel.app

Bu dosya oyunu “vibe coding” ile geliştirirken hızlı ve güvenli kalmak içindir: önce burayı oku, sonra koda dokun.

## Altın kurallar

1. **Parça parça commit atma.** Bir isteği baştan sona bitir, doğrula, sonra **tek ve anlamlı** bir commit at.
   Ara kayıt gerekiyorsa yerelde tut; `main`e yarım iş gitmez (her push canlıya çıkar).
2. **Doğrulamadan push yok.** Sırayla: `npm run typecheck` → `npm test` → `npm run verify:levels` (değişen bölüm için
   `npx tsx scripts/verify-levels.ts <id>`) → `npm run build`. Görsel değişiklikte ekran görüntüsüyle bak.
3. **Sırlar depoya girmez.** `DATABASE_URL`, `VERCEL_TOKEN` yalnızca ortam değişkeninde; `.env*` gitignore’da.
   Veritabanı başka projelerle ortak: yalnızca `memleket_*` tablolarına dokun.
4. **Commit mesajı:** `feat|fix|refactor|docs(kapsam): açıklama`, Türkçe, gövdede madde madde ne değişti.
   Model adı yazma.
5. **Ölü kod bırakma.** Kullanılmayan export, prop, dosya ve yorum satırına alınmış kodu sil;
   `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` temiz kalsın.

## Proje haritası

```text
game/            DOM'suz oyun çekirdeği (testlenebilir)
  sim.ts         fizik + dünya: zıplama, duvar, atılma, düşmanlar, bulmaca nesneleri, sema/balon/tokmak/horon
  levels.ts      16 bölüm (ASCII harita, 24 satır) + şehir metinleri; extend() ve addSignature() burada
  extensions.ts  bölümlere eklenen ikinci parçalar
  signatures.ts  eski 12 şehrin imza bölümleri (+ İngilizce ipucu ve kişi metinleri)
  content.en.ts  bütün bölüm metinlerinin İngilizcesi
  art.ts         şehir paletleri, arka plan katmanları, eşya ve düşman sprite'ları, canlı adları
  render.ts      düşük çözünürlüklü tampon, parallax, parçacık, karakter, NPC
  characters.ts  Uktun ve Memo sprite'ları (baş + saç + gövde + bacak katmanları)
  portraits.ts   64x76 portreler (scripts/art/painter.py üretir; Uktun'un yüzü elle çizilmiş scripts/art/uktun_classic.json'dan gelir)
  audio.ts       WebAudio efektleri + şehir makamında üretilen müzik
components/      React arayüzü: Game (bütün ekranlar), About (artbook), Bestiary, NpcDialog, HUD, dokunmatik
lib/             storage (kayıt + harita sürümü), i18n + ui.en (TR/EN), share, db
app/             / oyun · /hakkinda tanıtım · /skor paylaşım · /skor/kart kartpostal · /api/*
scripts/         verify-levels (çözücü), migrate, art/ (portre ressamı, harita üreteçleri, sync)
tests/           sim.test.ts (fizik ve mekanik testleri)
```

## Sık işler

**Bölüm haritası değiştirmek.** Yeni şehirler `scripts/art/newcities.py`, imza bölümleri `scripts/art/sig.py`.
Değiştir → `python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py` →
`npx tsx scripts/verify-levels.ts <id>`. Eski şehirlerin ana haritası doğrudan `game/levels.ts` içinde.

**Yeni şehir.** `types.ts` CityKey → `art.ts` (CITY, buildLayers, ITEM_ART) → `render.ts` (karo, tezgâh `s`,
simge nesne `z`, NEXT_CITY) → `audio.ts` SCALES → `levels.ts` LEVELS + DECOR_CYCLE → `content.en.ts` →
`components/TurkeyMap.tsx` koordinat → `game/features.ts` → `public/sehirler/<id>.webp` ve `assets/cities/<id>.png`
(oyundan ekran görüntüsü) → `tests/sim.test.ts` plaka listesi. Haritalar değişince `lib/storage.ts` MAP_VERSION artır.

**Metin eklemek.** Arayüzde Türkçe metni `t('…')` ile yaz, İngilizcesini `lib/ui.en.ts`’e ekle. Bölüm metni
`levels.ts`’e, İngilizcesi `content.en.ts`’e. Başlık ve düğmeler Title Case, paragraflar cümle düzeni; tek kelimelik
yetim satır bırakma.

## Tasarım tuzakları (öğrenilmiş)

- Platformun yerden yüksekliği **en çok 32 piksel** (2 karo) olsun; 48 piksel zıplama sınırıdır, oyuncu çoğu zaman tutturamaz.
- Oyuncu her duvara tırmanabilir: bir alanı kapatan duvar haritanın en üst satırına kadar çıkmalı.
- Alçak tavanlı koridorda zıplama kısalır; dikenli çukur 2 karoyu geçmesin.
- Dost hayvan ile düşman aynı tür olmasın (kedi dostsa düşman kedi olmaz). Düşmanlar kırmızı hatla parlar.
- Telefonda yatay ekranda diyalog ve ipucu kutusu iki kontrolün arasına oturur; yeni kutu eklersen karakteri ve tuşları kapatmasın.
- Çözücü (`verify-levels`) yavaşsa önce haritayı sadeleştir: dönen platformlar ve tokmaklar durum sayısını katlar.

## Yayın

`main`e push → Vercel otomatik derler (proje `sek-sek`). Push’tan sonra dağıtımın READY olduğunu ve
https://sek-sek.vercel.app’in açıldığını kontrol et. PR yalnızca istenirse açılır.
