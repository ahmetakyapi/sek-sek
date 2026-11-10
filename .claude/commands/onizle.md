---
description: Oyunun içinden ekran görüntüsü al ve bak (şehir, yer, cihaz)
argument-hint: "<şehir> [start|arrival|boss|npc:0|x,y] [--telefon|--dikey|--memo|--en]"
---

1. Dev sunucusu 3100'de değilse arka planda başlat: `npm run dev -- -p 3100`.
2. `node scripts/preview.cjs $ARGUMENTS` çalıştır (çıktı yolunu komut yazar); dosyayı Read ile aç ve gördüğünü
   üç maddede söyle: iyi duran, bozuk duran, emin olmadığın.
3. Çizimin kendisine bakılacaksa `node scripts/art/sheet.cjs` (bütün kılıklar ve boss’lar tek föyde).
