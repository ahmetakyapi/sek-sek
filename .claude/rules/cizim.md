---
paths:
  - "game/heroDraw.ts"
  - "game/bossDraw.ts"
  - "game/terrainDraw.ts"
  - "game/render.ts"
  - "game/art.ts"
  - "components/Figures.tsx"
---

# Çizim dili

- Oynanan her şey vektördür: mürekkep dış hat (`INK`), düz renk, tek kademe gölge, ışık sol üstten.
  `blob()` (dolu şekil + dış hat + gölge) ve `stroke()` (uzuv, çizgi) ortak fırçalardır; yeni çizim bunlarla yapılır.
- Birimler: karakterler 100 birim boyunda (ayak tabanı orta noktası 0,0); boss’lar dünya pikselinde
  (gövde kutusunun taban ortası 0,0; `setInkWidth` dış hattı ona göre inceltir); zemin dünya pikselinde, parça parça önbellekte.
- Ruh hâli bütün boss’larda aynı okunur: öfkeli kaş (saldırı), titreme (işaret), sarmal göz + yıldız (yorgun), kapalı göz (uyku).
- Çizim sırası (`render.ts`): arka tampon (gök, parallax, süs) → HD zemin → ön tampon (su, nesne, canlı, parçacık) →
  boss → karakterler → yazılar. Piksel katmanlar tam piksele, HD katmanlar kesirli kameraya çizilir.
- Fizik sabit adımlıdır; çizim `capture()` / `blend()` ile adımlar arasında ara değerlenir. Yeni hareketli nesne
  eklersen ikisine de ekle, yoksa yüksek tazeleme hızında titrer.
- Çizimde her şey saate bağlıdır: kare başına `Math.random()` titremesi ya da `Math.random() < p` yok (`shakeOffset`,
  `this.chance(p)`); pahalı çizim kare içinde tek seferde yapılmaz, önbelleğe bütçeyle önceden çizilir (CLAUDE.md "Akıcılık").
- Yeni piksel sprite ekleme: karakter, insan, boss, zemin, düşman, dost hayvan ve toplananlar vektördür
  (`heroDraw`, `bossDraw`, `terrainDraw`, `enemyDraw`). Piksel kalan yalnız arka plan katmanları ve sokak süsleridir.
- Düşman kırmızı haleyle çizilir (iki geçiş: önce kalın kırmızı hat), dost hayvanda hale yoktur; ikisi karışmasın.

- Portreler vesikalık kadrajındadır: yakın yüz çekimi, baş tam, omuzların yalnız üstü, sade fon; oyundaki karakterle aynı kişi,
  aynı çizgi (vektör, mürekkep hat). Büst ya da tam boy portre çizilmez.

## Bakmadan bitmez

- `node scripts/art/sheet.cjs out.png`: bütün kılıklar, hareketler ve boss’lar tek föyde.
- `node scripts/art/portraits.cjs --foy out.png`: sekiz portre büyük ve küçük boyda (föysüz çağrı PNG'leri yeniden üretir).
- `node scripts/art/icons.cjs --foy out.png`: amblem, favicon ve uygulama ikonları bütün boylarda (16 px dahil); maskot neşeli görünmeli.
- `node scripts/art/creatures.cjs out.png`: düşmanlar (her durum), dost hayvanlar, hatıralar ve ortak nesneler.
- `node scripts/preview.cjs <şehir> [start|arrival|boss|npc:0] out.png [--telefon|--dikey|--memo|--en]`: oyunun içinden.
- Şehir kartları: `node scripts/art/banners.cjs <şehir>` (görünüm değişince yeniden üret).
