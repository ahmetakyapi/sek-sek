---
paths:
  - "game/heroDraw.ts"
  - "game/bossDraw.ts"
  - "game/terrainDraw.ts"
  - "game/render.ts"
  - "game/art.ts"
  - "game/atmosphere.ts"
  - "components/Figures.tsx"
  - "game/enemyDraw.ts"
---

# Çizim dili

- Oynanan her şey vektördür ve **boyalı** görünür (25 Kasım 2026, kullanıcı kararı): siyah kalın mürekkep yerine dolgunun
  kendi koyu-sıcak tonundan ince dış hat, yumuşak hacim (sol üstten ılık ışık, gölgede serin-mor, iki kademe), ince kenar
  ışığı, ayak altında yumuşak temas gölgesi. `blob()` ve `stroke()` ortak fırçalardır; `heroDraw.ts` içindeki `soft` bayrağı
  boyalı görünümü açar (karakter, şehir insanı ve ona geçen çizimler). Yüzde göz, kaş, ağız koyu kalır (okunurluk). Siyah
  `INK` yalnız tehlikede kalır: diken, ok tuzağı (oynanışta keskin okunsun). Gradyan, `filter`, `shadowBlur` yerine düz
  yarı saydam katmanlarla hacim ver (ucuz ve boyalı durur).
- Zemin (`terrainDraw.ts`): sıra başına ılık-serin hacim, sıcak koyu harç ve ince hat, derinlikte koyulaşan ve sadeleşen
  doku, sol yüz ılık / sağ yüz serin; yürünen kenarın altında açık ışık bandı her ekranda okunur. Hücre çizim süresi
  `node scripts/art/terrain.cjs --olc` ile ölçülür (25 Kasım: ~1,35 ms/hücre); taş taş yol çizmek bütçeyi aşar.
- Birimler: karakterler 100 birim boyunda (ayak tabanı orta noktası 0,0); boss’lar dünya pikselinde
  (gövde kutusunun taban ortası 0,0; `setInkWidth` dış hattı ona göre inceltir); zemin dünya pikselinde, parça parça önbellekte.
- Ruh hâli bütün boss’larda aynı okunur: öfkeli kaş (saldırı), titreme (işaret), sarmal göz + yıldız (yorgun), kapalı göz (uyku).
- Çizim sırası (`render.ts`): arka tampon (gök, bulut, parallax, süs; yumuşak büyütülür) → HD zemin → ön tampon (su, nesne,
  canlı, parçacık; keskin büyütülür) → boss → karakterler → atmosfer (ışık, renk tonu, süzülenler, vinyet) →
  yazılar. Düşük çözünürlüklü katmanlar tam piksele, HD katmanlar kesirli kameraya çizilir.
- Fizik sabit adımlıdır; çizim `capture()` / `blend()` ile adımlar arasında ara değerlenir. Yeni hareketli nesne
  eklersen ikisine de ekle, yoksa yüksek tazeleme hızında titrer.
- Çizimde her şey saate bağlıdır: kare başına `Math.random()` titremesi ya da `Math.random() < p` yok (`shakeOffset`,
  `this.chance(p)`); pahalı çizim kare içinde tek seferde yapılmaz, önbelleğe bütçeyle önceden çizilir (`.claude/rules/akicilik.md`).
- Tuval piksel bütçesiyle çizilir (`backingDpr`, `PIXEL_BUDGET`); yeni tam ekran katman, `filter` ya da büyük gölge eklemeden
  önce `node scripts/verify-perf.cjs` ile ölç (üretim derlemesinde).
- Yeni piksel sprite ekleme: karakter, insan, boss, zemin, düşman, dost hayvan ve toplananlar vektördür
  (`heroDraw`, `bossDraw`, `terrainDraw`, `enemyDraw`). Piksel kalan yalnız arka plan katmanları ve sokak süsleridir.
- Kısa ömürlü his efektleri `render.ts` `Fx` listesindedir (27 Kasım 2026): sert inişte yana açılan toz bulutu, bayrak
  göndere çekilince ılık ışık halkası, suya dalışta yüzeyde halka (sim'in `dip` olayı, yalnız çizim + ses), karlı şehirde ayak
  izi, hatıra / pul / nazar alınınca HUD'a (hatıra simgesi `data-hud-items`) ya da "bulundu" kartına uçan pırıltı. Hepsi
  renderer saatine bağlı (`at` + `life`), ana tuvalde vektör, en çok `FX_MAX`; "hareketi azalt" açıkken pırıltı uçmaz.
  Yeni kısa efekt eklerken `particles` yerine buraya ekle.
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

## Atmosfer: el boyaması, sıcak, sinematik (25 Kasım 2026, kullanıcı kararı)

Referans kullanıcının paylaştığı el boyaması oyun videosu (KAYNAK: `.claude/skills/reference-to-game/KAYNAK.md`). Hedef:
altın saat ışığı, puslu uzak plan, doygun ama yumuşak renk, havada süzülen yaprak ve ışık zerresi. Alt kenara koyu ön plan
otu konmaz (26 Kasım 2026, kullanıcı: taşın üstünde gereksiz leke).

- `game/atmosphere.ts`: `moodOf(CITY)` şehrin ışığını paletinden türetir (ışık rengi, gölge rengi, güneş yeri, güç;
  karda ve yağmurda serin ve kısık). `paintLayer` arka plan katmanını şehir yüklenirken bir kez boyar (kenar ışığı, tepede
  ılık dipte gölge, doygunluk, fırça dokusu). `Clouds` boyalı bulutlar. `Atmosphere.draw` her kare: düşük çözünürlüklü ışık
  haritası (`screen`), `soft-light` + `multiply` renk tonu, üç derinlikte süzülenler (önceden çizilmiş imgeler), vinyet. Kare başına tam ekran karışım sayısı sabit (dört): yenisini eklemeden önce `verify-perf` ile ölç.
- Oynanış okunur kalır: ışık ve ton zeminin üst kenarını, dikenleri, düşmanın kırmızı halesini bastırmaz. Kameradan hızlı
  kayan katman eklenmez (göz ucunda baş döndürür).
- `ctx.filter` yalnız kurulumda (önceden çizilen imgeye bulanıklık) kullanılır, kare içinde asla.
- Yeni şehir paleti: gök soluk beyaza değil ılık ufka insin; katmanlar iki üç tonla çizilsin (tek düz renk blok boyalı durmaz).

## CLAUDE.md'den taşınanlar (26 Kasım 2026)

## Öğrenilmiş kurallar

- Konuşma ve tabela sözü ekranın altına kutu olarak değil, konuşanın başının üstüne baloncuk olarak çizilir (karakteri kapatmaz).
  Tabela balonu ahşap tabela görünümünde, "Tabela" başlıklı; uzun söz cümle cümle numaralı adımlara bölünür, yapılacak eylem
  (iki noktadan sonrası, ünlemle biten cümle) kalın ve altın renkli (`render.ts` `drawDialog`, 25 Kasım 2026). Şehir insanının adı renkli etikette.
  Oynanış sırasında çıkan yazılar (bayrak sözü, ölüm lafı) üstte HUD'ın altında, küçük ve soluk durur; oynanış alanına girmez.
