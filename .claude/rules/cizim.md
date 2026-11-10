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
- Birimler: karakterler 100 birim boyunda (ayak tabanı orta noktası 0,0); patronlar dünya pikselinde
  (gövde kutusunun taban ortası 0,0; `setInkWidth` dış hattı ona göre inceltir); zemin dünya pikselinde, parça parça önbellekte.
- Ruh hâli bütün patronlarda aynı okunur: öfkeli kaş (saldırı), titreme (işaret), sarmal göz + yıldız (yorgun), kapalı göz (uyku).
- Çizim sırası (`render.ts`): arka tampon (gök, parallax, süs) → HD zemin → ön tampon (su, nesne, canlı, parçacık) →
  patron → karakterler → yazılar. Piksel katmanlar tam piksele, HD katmanlar kesirli kameraya çizilir.
- Fizik sabit adımlıdır; çizim `capture()` / `blend()` ile adımlar arasında ara değerlenir. Yeni hareketli nesne
  eklersen ikisine de ekle, yoksa yüksek tazeleme hızında titrer.
- Yeni piksel sprite ekleme: karakter, insan, patron ve zemin vektör kalır. (Düşmanlar, eşyalar ve arka plan
  katmanları hâlâ piksel: dönüştürülecekse hepsi birlikte, tek karar olarak.)

## Bakmadan bitmez

- `node scripts/art/sheet.cjs out.png`: bütün kılıklar, hareketler ve patronlar tek föyde.
- `node scripts/preview.cjs <şehir> [start|arrival|boss|npc:0] out.png [--telefon|--dikey|--memo|--en]`: oyunun içinden.
- Şehir kartları: `node scripts/art/banners.cjs <şehir>` (görünüm değişince yeniden üret).
