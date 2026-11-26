---
paths:
  - "game/camera.ts"
  - "game/render.ts"
  - "game/terrainDraw.ts"
  - "game/heroDraw.ts"
  - "game/atmosphere.ts"
  - "components/Game.tsx"
  - "components/TouchControls.tsx"
  - "tests/camera.test.ts"
  - "tests/perf.test.ts"
  - "scripts/verify-perf.cjs"
  - "scripts/verify-frames.cjs"
---

# Akıcılık (kalıcı kural)

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

Oyun her tazeleme hızında (60, 90, 120, 144, 240 Hz) ve her çözünürlükte aynı akar; kasma bir kez düzeltildi, geri gelmesin:

- **Zamana bağla, kareye değil.** Kameranın yatay yaklaşımı `approach()` (üstel, `Math.pow(keep, dt)`), dikeyi kritik sönümlü
  yay `spring()` (kapalı biçim: inişte, basamakta kadraj hızı sıçramaz, hedefi aşmaz; 25 Kasım 2026), sarsıntı `shakeOffset(t)`
  (zamanla dalgalanır, üstel söner, olaylarda `CAM.shakeGain` ile kısık: düşük kortizol). Kare başına `Math.random()` ile titreme ya da `Math.random() < p` ile olasılık yazma: yüksek Hz'de
  daha çok titrer, daha çok parçacık yağar. Olasılık için `this.chance(p)` (60 Hz karşılığı, saniyede aynı sıklık).
- **Kare temposu ve göz yorgunluğu (26 Kasım 2026).** Yüksek Hz ekranda (≥90 Hz) kareler düzensizse çizim sabit yarı hıza iner
  (`Game.tsx` kare temposu kilidi; fizik etkilenmez). Tam ekran beyaz parıltı en çok %4, sarsıntı varsayılan kapalı, alt kenarda
  ön plan otu yok, koşu sekmesi boyun ~%6'sı (`heroDraw.ts` `RUN`), dash izi atkı renginde siluet.
  Kalite kademesi yazılımla boyayan tarayıcıyı WebGL'den tanır (`probeTier`), GPU'lu cihaz zengin kademede başlar.
- **Kare içinde ağır iş yok.** 120 Hz'de bütün kare 8 ms'dir. Pahalı çizim (zemin) önceden, küçük parçalar hâlinde ve
  süre bütçesiyle yapılır (`terrainDraw.ts` WARM_MS). Yeni önbellekli çizim eklersen aynı yolu izle.
- **Hareketli her şey ara değerlenir** (`capture()` / `blend()`), yoksa yüksek Hz'de titrer.
- **Düşüşte iniş görünür.** Havadayken `landingY` yolu (yatay hız, yerçekimi) izleyip ineceği yeri bulur; kadraj karakterle
  inişi birlikte tutar, düşerken dikey takip çevikleşir (`tests/camera.test.ts` "düşerken iniş yeri kadrajda").
- **Yüzerken ve halatta kamera inip çıkar** (çapa yalnız zeminde değil, suda ve halatta da güncellenir); uzaktan
  yeniden doğuşta kamera bölümü taramaz, yeni yere sıçrar (`render.ts` `respawn`).
- **Dokunmatik** (`components/TouchControls.tsx`): joystick parmağın indiği yerde açılır, bölgeye göre konumlanır, merkez
  parmağın peşinden gelir, dört yön gösterir; sağ yarının alt %62'si DASH dairesi dışında bütünüyle ZIPLA'dır.
- **Kamera telefonda sakin.** Bakış payı ekrana orantılı (`CAM.leadMax`), dönüşte yumuşakça kayar (`leadKeep`); ölü bölge
  kameraya değil hedefe uygulanır (`anchor`): ufak adımlar ve eşikte titreyen joystick kadrajı oynatmaz. Joystick'in yön eşiği
  pay ile çalışır (basmak 0,28, bırakmak 0,18). Sarsıntı küçük ekranda orana göre küçülür.
- **Efekt sesleri yumuşak.** Efekt dizileri setTimeout'la değil ses saatine (`at`) göre zamanlanır. Kare ve testere dalga efektte kullanılmaz (bip, yapışkan tuş uyarısı gibi duyuluyordu); efektler
  alçak geçiren süzgeçten geçer, aynı efekt 60 ms içinde ikinci kez çalmaz (`tests/music.test.ts` bekler).
- **Piksel bütçesi.** Tuval ekranın tam yoğunluğunda değil, `backingDpr()` ile kare başına en çok `PIXEL_BUDGET`
  (~2,6 Mpx, aşağı yukarı 1080p) çizilir. Kasmanın asıl nedeni JavaScript değil boyamaydı (profilin %85'i): Retina, 4K ve DPR 3
  telefonda 5-8 Mpx çizmek kare kaçırtıyordu. Tuvali büyütecek, kare başına yeni tam ekran katman ya da `filter` / büyük
  gölge ekleyecek değişiklikten önce ölç. Tuval `imageRendering: pixelated` olmaz (tam sayı olmayan ölçekte titrer).
- **Kanıt:** `tests/camera.test.ts` (döngüyü 60-240 Hz'de koşar: dash'te ekranda geri tepme yok, her Hz'de aynı yol),
  `tests/perf.test.ts` (bilinen ekranlarda piksel bütçesi), `node scripts/verify-frames.cjs` (geliştirme sunucusu açıkken;
  hazır olmayan zemin hücresi 0 olmalı) ve `node scripts/verify-perf.cjs` (üretim sunucusunda gerçek oynanış: karelerin
  en çok %2'si 25 ms'yi aşar, p95 ≤ 20 ms). Kamera, çizim, tuval ya da zemin önbelleğine dokunduysan hepsini koş;
  geliştirme modunda ölçme (React geliştirme modu yavaştır, yanıltır).
