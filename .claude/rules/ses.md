---
paths:
  - "game/audio.ts"
  - "game/music.ts"
  - "game/ambience.ts"
  - "scripts/audio-render.cjs"
---

# Ses dili: düşük kortizol (25 Kasım 2026, kullanıcı kararı)

Referans: kullanıcının paylaştığı el boyaması oyun videosu ("Getting There"). Çözümlemesi: davul yok; uzun soluklu,
yavaş kabarıp sönen akor ikilileri (dem), tepede uzun çınlayan çan / müzik kutusu notaları, derin ve seyrek bas,
altında doğa sesi (kuş, rüzgâr, su). Ses ~−18 LUFS, dinamik aralığı dar (LRA ~2,5): hiçbir şey birden patlamaz.

- **Tek beste** (`music.ts` jenerik) kalır; şehre özgü şarkı yok (24 Kasım kararı). Tempo ~64 BPM, sallantı en çok 0,08.
- **Bestede davul yok.** Davul (kick, rim, hat, tom) yalnız boss katmanında (`battle`) ve orada da kısık. Yeni bölüm ya da
  çalgı eklerken davul ekleme; ritmi bas ve piyanonun kırık akoru taşır (`tests/music.test.ts` "düşük kortizol").
- **Dem her ölçüde**, yavaş girer (≥1,5 sn) ve bir sonrakinin içine karışarak söner. **Çan** (`bell`) akorun tonlarından,
  yüksekte (MIDI ≥ 74), seyrek: ezgili ölçüde en çok bir, nefeste iki nota.
- **Piyano keçeli**: süzgeç tepesi düşük (≤ 3,6 kHz), titreme az. Yankı geniş (3,6 sn), çan ve ney yankıda uzun kalır.
- **Doğa sesi** (`ambience.ts`): şehrin `CITY[şehir].weather`ından `bedOf` (rüzgâr, dalga, yağmur, kuş, cırcır); menüde
  `MENU_BED`. Müzik ses düzeyine bağlıdır, molada yarıya iner. Müzik değil, yerin sesidir: kısık kalır (müziğin ~15 dB altı).
  Yeni hava türü eklenirse `bedOf`'a yaz (switch tam olmalı; tip denetler) ve testi genişlet.
- **Efektler** müzikle aynı havada: piyano tınısında çan (`chime`), şehrin makamında, kare / testere dalga yok, efekt yolu
  ~3 kHz alçak geçiren + kısa oda. Yeni efekt sert ve kuru olmasın; sık çalanı (zıplama, iniş) çok kısık.
- **Kanıt:** `PORT=3100 node scripts/audio-render.cjs <klasör>` (ortam-* parçaları doğa sesini de çalar) →
  `python3 scripts/audio-render-analiz.py <klasör>`; spektrumda kuş cıvıltısı 2-4 kHz'de seyrek çizgiler, rüzgâr alt-ortada
  yumuşak bant olarak görünmeli: `ffmpeg -i x.wav -lavfi showspectrumpic=s=1600x400:scale=log:fscale=log:stop=6000 x.png`.
