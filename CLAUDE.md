# Sek-Sek · Claude için çalışma rehberi

Türkiye’nin 46 şehrini (iki defter: 30 + 16) gezen platform oyunu (el boyaması görünüm: boyalı arka plan, sıcak sinematik ışık, yumuşak hacimli vektör karakter ve zemin; davulsuz sakin müzik ve doğa sesi). Next.js 16 + React 19.2 + Tailwind v4, kendi canvas motoru,
Neon/Drizzle skor tablosu, Vercel’de `main`den otomatik yayın: https://sek-sek.vercel.app

Bu dosya oyunu “vibe coding” ile geliştirirken hızlı ve güvenli kalmak içindir: önce burayı oku, sonra koda dokun.

## Altın kurallar

1. **Parça parça commit atma.** Bir isteği baştan sona bitir, doğrula, sonra **tek ve anlamlı** bir commit at.
   Ara kayıt gerekiyorsa yerelde tut; `main`e yarım iş gitmez (her push canlıya çıkar).
2. **Doğrulamadan push yok.** Sırayla: `npm run typecheck` → `npm test` → `npm run verify:levels` (değişen bölüm için
   `npx tsx scripts/verify-levels.ts <id>`) → `npm run verify:respawn` → `npm run build`. Tam doğrulama uzun sürer:
   şehirleri ayrı süreçlerde paralel koş (`xargs -P`). Görsel değişiklikte ekran görüntüsüyle bak.
3. **Sırlar depoya girmez.** `DATABASE_URL`, `VERCEL_TOKEN` yalnızca ortam değişkeninde; `.env*` gitignore’da.
   Oyunun kendi Neon veritabanı var (8 Kasım'a dek Açılış Zili ile ortaktı); tablolar `seksek_*` önekli.
4. **Commit mesajı:** `feat|fix|refactor|docs(kapsam): açıklama`, Türkçe, gövdede madde madde ne değişti.
   Model adı yazma.
5. **Ölü kod bırakma.** Kullanılmayan export, prop, dosya ve yorum satırına alınmış kodu sil;
   `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` temiz kalsın.

## Proje haritası

```text
game/            DOM'suz oyun çekirdeği (testlenebilir)
  sim.ts         fizik + dünya: zıplama, duvar, dash, düşmanlar, bulmaca nesneleri, sema/balon/tokmak/horon, gelgit (TIDE), yükselen hava (LIFT), donan su (FROST), havuz teyzesi (AUNT), yüzen ada (SINK)
  levels.ts      46 bölüm (ASCII harita, 24 satır; ilk defter 30, `FIRST_BOOK`'tan sonrası ikinci defter) + şehir metinleri; extend(), addSignature(), addFinale() ve bossLevel() (Boss Rush arenası) burada
  cities/        yeni şehirlerin ana yolu, şehir başına bir dosya (Çanakkale, Diyarbakır, Sinop, Edirne, Bursa, Antalya, Şanlıurfa, Van, Erzurum, Kayseri, Hatay, Eskişehir, Amasya, Muğla, Rize, Artvin, Kars, Bitlis, Ağrı, Giresun, Tokat, Denizli, Zonguldak, Mersin, Karabük, Aydın, Balıkesir, Elazığ, Afyon, Bingöl); yeni şehir buraya eklenir
  extensions.ts  bölümlere eklenen ikinci parçalar
  signatures.ts  eski 12 şehrin imza bölümleri (+ İngilizce ipucu ve kişi metinleri)
  finales/       bölüm finalleri: meydan kapısı (@) → varış (&) + bayrak → meydan yolu (şehir başına bir dosya: bulmaca + saklı nazar boncuğu `!`) → arena (Q boss, G kapı) → çıkış; arenayı index.ts kurar
  boss.ts        şehir boss’ları: tanım (ad, can, hareket sırası), saate bağlı durum makinesi (toslar, dalar, sıçrar, yerden çıkar, atar), temas kuralı
  bossLines.ts   boss'ların üç lafı (uyanınca, yorulunca, basılınca; TR/EN); konuşma balonunu render.ts çizer
                 (şehir insanının sözü ve tabela ipucu da konuşanın başının üstünde baloncuk: render.ts drawDialog)
  assists.ts     kolaylık yamaları: birleşmiş haritaya en son yazılır (araya bayrak, çukura basamak); kayarsa hata verir
  content.en.ts  bütün bölüm metinlerinin İngilizcesi
  art.ts         şehir paletleri, arka plan katmanları (piksel), düşman türü seçimi, canlı adları
  render.ts      iki düşük çözünürlüklü tampon (arka: gök, bulut, parallax, süs; yumuşak büyütülür · ön: su, nesne, canlı, parçacık), arada HD zemin, en üstte atmosfer; adımlar arası ara değerleme, kesirli kamera
  atmosphere.ts  el boyaması atmosfer (25 Kasım 2026, kullanıcı kararı; kuralı `.claude/rules/cizim.md` "Atmosfer"): şehrin ışığı `moodOf`, katmanlara boya hacmi `paintLayer`, boyalı bulutlar `Clouds`, her kare ışık haritası (güneş, huzme, fener halesi), renk tonu, üç derinlikte süzülenler (yaprak, kar, taç yaprağı, ışık zerresi), vinyet
  camera.ts      kamera hesabı (DOM'suz): takip, boss kadrajı, saate bağlı yaklaşım ve sarsıntı; kare hızından bağımsız (tests/camera.test.ts)
  terrainDraw.ts elle çizilmiş zemin ve duvarlar: şehre göre taş örgüsü, mürekkep dış hat, üst örtü (taş, çimen, kar); küçük hücrelerde önbelleklenir, kamera varmadan kare bütçesiyle önceden çizilir
  bossDraw.ts    30 boss’un vektör çizimi (ruh hâli: öfkeli, titrek, sersem, uykuda)
  enemyDraw.ts   düşmanlar, dost hayvanlar, hatıralar ve ortak nesneler (anahtar, pul, dash halkası, nazar, yay): vektör; föyü scripts/art/creatures.cjs
  characters.ts  Uktun ve Memo kimliği (ad, rol, hikâye)
  heroDraw.ts    elle çizilmiş görünümlü karakterler ve şehir insanları (kasket, yazma, kalfa, kalpak, saz, değnek): vektör eğri, mürekkep hat + gölge, eklem açılı poz ve sürekli koşu döngüsü; ana tuvalde ekran çözünürlüğünde çizilir
  portraitDraw.ts vesikalık portreler (vektör, heroDraw fırçalarıyla; sekiz kılık, atkı rengi parametreli). Sunucu kartı için public/portreler/<kılık>.png: `node scripts/art/portraits.cjs` (çizim ya da LOOKS değişince yeniden üret)
  audio.ts       WebAudio, "düşük kortizol" (25 Kasım 2026, kullanıcı kararı; kuralı `.claude/rules/ses.md`): keçeli piyano gibi yumuşak Rhodes (`keys`), alt bas `sub`, uzun soluklu dem `pad` (yaylı yatak), müzik kutusu çanı `bell`, ney, kanun Karplus-Strong; bestede davul yok (`kick`/`rim`/`hat`/`tom` yalnız boss katmanında), geniş yankı (3,6 sn); **her yerde tek beste, jenerik** (24 Kasım 2026, kullanıcı kararı: şehre özgü şarkı yok): `setMusic(city)` efektlerin makamını ve doğa sesi yatağını seçer, jenerik çalıyorsa baştan başlatmaz (menü ↔ oyun kesintisiz); boss'ta bestenin ölçü köklerine (`Song.roots`) basan sakin dövüş katmanı (`setIntense`), molada boğuklaşma, efekt/müzik düzeyi (`setVolumes`); efektler piyanoyla aynı tınıda (`chime`) ve şehrin makamında (`SCALES`), kısık; müzik yolu: çalgı dengesi `TRIM`, çamur kesimi + varlık rafı, hafif bant doygunluğu, yapıştırıcı sıkıştırma, `MUSIC_MAKEUP`, kendi tepe sınırlayıcısı ve efekt çalınca ~3 dB eğilen yan zincir (müzik ~−17 LUFS). Ses değişince `node scripts/audio-render.cjs` + `python3 scripts/audio-render-analiz.py`
  ambience.ts    doğa sesi yatağı: şehrin `weather`ından `bedOf` (rüzgâr, dalga, yağmur, kuş, cırcır), menüde `MENU_BED`; süzülmüş gürültü döngüleri ve sentez cıvıltı, müzik düzeyine bağlı, kısık
  music.ts       tek beste veri olarak: jenerik (Re minör, Hicaz renkli La7♭9, ~64 BPM sekizlik, davulsuz; her ölçüde dem, seyrek müzik kutusu çanı; giriş (bir kez) → A piyano → A′ ney → B → A″ ney/kanun soru-cevap → nefes → C köprü → A4 (motif başka ritimle, doruk) → B′ (karara inen son) → nefes, 64 ölçülük döngü; ikinci turda ezgiyi kanun alır (`NoteEvent.pass`); ses yürütmeli akorlar `voiceLead`, kararda dörtlü geciktirme, ney süslemeleri, kanun tremolosu) ve efektlerin şehir makamları `SCALES`
  flagMoments.ts her bayrakta şehrin kısa sözü (TR/EN), bayrak bildiriminde görünür
  ghost.ts       hayalet koşu kaydı (saniyede 15 örnek); saklaması lib/ghost.ts, sunucusu app/api/ghosts (skor tablosundan "◌ Yarış")
  challenges.ts  mücadele haritaları: Zor şehirlerin bayrak aralığından her açılışta kesilen kısa parkurlar (madalya `gold` / `par`dan)
  puzzles/       Usta Parkurları: elle çizilmiş zamanlama (zamanlama.ts) ve bulmaca (bulmaca.ts) mücadeleleri, `MASTER_COURSES`
  mirror.ts      Ayna Yolu (Yeni Oyun+): şehir haritası sağdan sola; `LevelDef.mirror` ile platformlar ve zamanlama fazları da aynalanır
  looks.ts       Mağaza görünüm seçenekleri (saç, ten, kıyafet, göz, ifade, duruş, koşu tarzı; saf veri), fiyat ve sahiplik; hairDraw.ts arka saç ve topuz; stance.ts bekleme duruşu ve önizleme pozu
  accessories.ts Mağaza aksesuarları (ad, fiyat, `for`: yolcuya özgü), yolcu başına kombin (`Kit.look` görünümü taşır) ve cüzdan; çizimi heroDraw/portraitDraw, karaktere özgü parçalar accessoryDraw.ts, oyunda `renderer.accessory`
components/      React arayüzü: Coop (iki kişi aynı ekranda: CoopSetup (Şehir Yolu / Boss Kapışması), Coop, CoopEnd; tuşlar DUO_KEYS), TitleMenu (ana menü: sıradaki şehrin kartpostalı, yol çizgisi, OYNA / SENİN öbekleri ve ne işe yaradığını yazan kutucuklar; piksel simgeler dosyanın içinde), PhotoMode (Fotoğraf Kipi: moladan; kadraj ok tuşu ya da sürükleyerek, kartpostal çerçeveli PNG), KeyRemap (klavye tuş atama; `game/input.ts` KeyBindings, `save.keys`), MapGallery (/haritalar topluluk galerisi), Tournament (Haftalık Turnuva), Challenges (mücadele listesi, bitiş), Ending (final: harita, son söz, jenerik, Ayna Yolu), Mirror (Ayna Yolu listesi), Shop (Mağaza), Album (Defter'de şehir albümü), Editor (Bölüm Düzenleyici, /duzenle; çözücü solve.worker.ts'te), Game (bütün ekranlar; ilk oynayışta adım adım rehber, save.tutorial), Defter (toplananlar, rozetler, unvan, yol istatistikleri; Müzik Kutusu sekmesi MusicBox: jenerik çal/durdur, bir boss yenilmişse Boss Teması (aynı bestenin dövüş hâli)), Modes (Modlar: Günlük Meydan Okuma, Düello, Boss Rush, Maraton; bitiş ekranları), Race (Yan Yana Yarış: bölünmüş ekran, iki dünya ve iki çizici), ScoreBoard (Skor Tablosu: Genel, Şehirler, Günlük, Koleksiyon), About (artbook), Bestiary, HUD, dokunmatik
lib/             customLevel (düzenleyicinin harita kodu: doğrulama, RLE + base64url, sürüm 1/2, `customLevel()`), editorKit (düzenleyicinin şablonları, hazır parçaları, dolgu, dikdörtgen, ayna), achievements (başarımlar: çoğu kayıttan hesaplanır, anlık olanlar `save.feats`), storage (kayıt, şehir sırası sürümü, güncelleme notu), mapVersion (şehir başına harita sürümü: haritanın özeti; yalnız "yenilendi" bilgisi için), extras (atkı renkleri, Günün Şehri, Haftanın Görevi, Günlük Meydan Okuma kuralları ve skoru, Düello sonucu, unvan, yol istatistikleri), scoreKey (skor satırının kalıcı anahtarı), players (hesap: scrypt şifre + cihaz oturumu; sunucunun koyduğu 400 günlük HttpOnly çerez `seksek_oturum`), cloud (bulut kaydı: giriş yapan oyuncunun ilerlemesi `seksek_saves` tablosunda; yerelle birleşir, hiçbir ilerleme kaybolmaz), i18n + ui.en (TR/EN), share, db, antiCheat (skorun fiziksel alt süresi `minScoreMs` ve hayalet makullüğü `ghostProblem`), modeHints (Modlar ekranı: katalog, arama, süzgeç, öneri, gezinti), rateLimit (`seksek_rate` tablosunda sabit pencere; tablo yoksa geçer), points (şehir koşusunun puanı: süre, hatıra, düşüş), listRanks (listelerde lider ve sıran, toplu uç), communityMaps (topluluk haritası kuralları: başlık, süzgeç, günlük sınır)
app/             / oyun (`?yaris=<şehir>~<ad>` yarış daveti, `?ozel=<kod>` özel harita) · /duzenle bölüm düzenleyici · /hakkinda tanıtım · /oyuncu/[ad] kullanıcı sayfası · /sehir/[id] şehir tanıtımı (şehir başına bir sayfa, statik; app/sitemap.ts, app/robots.ts) · /haritalar topluluk galerisi · /skor paylaşım · /skor/kart kartpostal · /api/*
scripts/         verify-all.sh (tam zincir, paralel), city-check (şehir oyunun her köşesine kayıtlı mı: tipin göremediklerini denetler), preview.cjs (oyun içi ekran görüntüsü), verify-levels (çözücü, solver.ts), verify-chase (Kovalamaca: köpek ısırmadan biter mi), verify-rush (Kâbus ve Çifte Boss Rush arenaları), verify-prelude (tek meydan yolunu saniyeler içinde dener), verify-respawn (her bayraktan yeniden doğunca çıkışa varılıyor mu), bossbot (boss’u gerçek fizikle yenen bot), verify-enemies (düşmanlar ve oklar açıkken bölümü insan paylı zamanlamayla oynayan bot; tam ve zayıf oyuncu), verify-frames (tarayıcıda 3x çözünürlükte dash hızında kayarken zemin hücresi hazır mı; kasma kanıtı), verify-perf (üretim derlemesinde gerçek oynanışta kare kaçırma; performans kanıtı), verify-items (zayıf oyuncu her toplanabilir şeyi alır ve aldığı yerden çıkışa varır: kapan yok), audit-reach (her toplanabilir şey görünür bir dayanağın zıplama menzilinde), audit-difficulty (zayıf oyuncu testi + tehlike yoğunluğu), audit-menus (her menü dört ekran boyutunda tek bakışta sığıyor mu), audit-clearance (1 karo yüksekliğinde yürünen alçak koridor var mı), verify-rules (Dash’siz kuralının çıktığı şehirler dash atmadan bitiyor mu), verify-challenges (mücadele haritaları çözücüyle bitiyor mu; madalya için en hızlı süreyi yazdırır), audio-render (sesi dinlemeden kanıtla: jenerik, şehirler, boss, mola ve efektler WAV; sessiz, NaN ya da patlayan parça FAIL), verify-mirror (Ayna Yolu: aynalı harita çözücüyle bitiyor mu; `AYNA=1 npx tsx scripts/bossbot.ts` aynalı arenada boss), migrate, art/ (portre üreteci ve föyü portraits.cjs, çizim föyü sheet.cjs, zemin föyü ve hücre çizim süresi terrain.cjs (`--olc`), şehir görselleri banners.cjs, README görselleri readme.cjs (docs/img; görünüm değişince yeniden üret), ikon, favicon ve paylaşım görseli icons.cjs (çizimi emblem.ts; `--og` paylaşım görseli, `--foy` föy; Uktun'un çizimi değişince yeniden üret), harita üreteçleri, sync)
tests/           scores.test.ts (skor API'si bellekte gerçek Postgres ile: göçler, ölçüt başına güncelleme, filtreler, günlük tablo), cloud.test.ts (bulut birleşmesi, şehir başına sürüm, güncelleme notu), sim.test.ts (fizik, mekanik, final), camera.test.ts (60-240 Hz'de aynı kamera, titremesiz dash), perf.test.ts (tuval piksel bütçesi), bubble.test.ts (baloncuk karakterin üstüne binmez), boss.test.ts (boss kuralları; her boss’u bot ve zayıf oyuncu botu yener), extras.test.ts (görevler, atkılar, Boss Rush arenaları), music.test.ts (besteler), input.test.ts (tuş atama), antiCheat.test.ts (her şehrin çözücü süresi alt sınırın en az 2 katı; sahte hayaletler reddedilir), maps.test.ts (topluluk haritaları API'si), customLevel.test.ts + editorKit.test.ts (harita kodu, şablonlar, hazır parçalar)
```

## Ajanla çalışma

Bu oyun ajanla geliştiriliyor; her iş için hazır bir yol var. Yeni bir araç ya da kural öğrendiğinde buraya ve ilgili dosyaya yaz.

| İş | Nereden |
|---|---|
| Yeni şehir | `/yeni-sehir <ad>` yeteneği (`.claude/skills/yeni-sehir`: iskelet tablosu, paralel ajanlar, kanıt, görsel, yayın) · denetim `npx tsx scripts/city-check.ts <id>` |
| Yeni mekanik / karo | `/yeni-mekanik` yeteneği (sim, çözücü, çizim, ses, düzenleyici, test, doğrulama botları) |
| Yeni mod | `/yeni-mod` yeteneği (saf mantık + test, Modlar kutucuğu, oyun akışı, sıralama, menü denetimi) |
| Var olan şehre parça | `/yeni-parca` yeteneği (harita değişince madalya, mücadele, kural listeleri, ayna) |
| Bitince canlıya | `/yayinla` yeteneği (doğrula → tek commit → main → Vercel READY → canlı sayfa) |
| Harita, bulmaca, zorluk | `level-designer` ajanı · `.claude/rules/bolumler.md` |
| Karakter, boss, kaplama çizimi | `artist` ajanı · `.claude/rules/cizim.md` |
| Boss davranışı | `.claude/rules/boss.md` |
| Metin, menü, Title Case | `.claude/rules/metin.md` |
| "Bozuldu mu?" | `/dogrula [şehir]` ya da `verifier` ajanı → `bash scripts/verify-all.sh` |
| "Nasıl duruyor?" | `/onizle <şehir> [yer]` → `scripts/preview.cjs` (oyun içi) · `scripts/art/sheet.cjs` (çizim föyü) |
| Görselden/videodan yeni şehir, mod, kılık | `reference-to-game` skill (`.claude/skills/reference-to-game`, MIT; nereden geldiği ve oyunda nasıl kullanıldığı `KAYNAK.md`) |

Kurallar (`.claude/rules/`) yalnız ilgili dosyalar okununca yüklenir; bu dosya her oturumda yüklenen haritadır.
Paralel iş: şehirler ayrı dosyalarda durur (`game/cities/`, `game/finales/`), bu yüzden birden çok `level-designer`
aynı anda çalışabilir; ortak dosyalara (`levels.ts`, `render.ts`, `boss.ts`) yalnız ana oturum dokunur.
Ajan raporu kanıt değildir: push'tan önce değişen dosyaların son hâlini kendin doğrula (ajan sen doğrularken dosyayı değiştirmiş olabilir).

## Bölüm ölçütleri (kalıcı kural)

Her bölüm, eskisi de yenisi de, şu iskeletle kurulur. Yeni şehir ya da yeni parça eklerken hiçbiri atlanmaz:

1. **Ana yol.** Şehrin gerçek yerlerinden geçen parçalar; her parça bir fikri önce güvenli yerde öğretir, sonra sınar.
   Üç hatıra (C), bir gizli pul ($), konuşan şehir insanları (n) ve tabelalar (?).
2. **Meydan kapısı (@).** Ana yolun sonu çıkış değil kapıdır; ardında final başlar (`game/finales/`).
3. **Meydan yolu.** Şehre özgü tek bir bulmaca ya da meydan okuma: oyuncu kafasını kullanır, oynanış ana yoldan farklı
   hisseder (düğme sırası, ritim, asansör, yeraltı, rüzgâr…). Bütün yol bulmaca olmaz. İçinde tam bir saklı
   **nazar boncuğu (!)**: adil ama dikkat isteyen bir yerde.
4. **Boss arenası.** Şehrin bir ayrıntısından doğan bekçi (`game/boss.ts`). Kural bütün şehirlerde aynıdır:
   işaret → saldırı → yorgunluk → üstüne bas. Şehirden şehre yalnız saldırının biçimi ve hızı değişir.
   Arenadan hemen önce bayrak, tabelada nasıl yenileceği yazar (TR + EN).
5. **Aynı mantık herkese.** Zorluk etikete uyar (Kolay: yürü + zıpla yeter; Orta: bir dash ya da duvar sekmesi;
   Zor: ikisi + zamanlama) ama hiçbir yerde kıl payı atlayış, kör atlayış ya da uzun cezalı tekrar olmaz.
   Fizik sabit adımlıdır (1/120 sn): her ekranda, her tazeleme hızında oyun aynı işler; hız ayarı fiziğe değil çizime yapılır.
6. **Görsel dil.** El boyaması, sıcak, sinematik (25 Kasım 2026, kullanıcı kararı; referans video, kuralı `.claude/rules/cizim.md`).
   Oynanan her şey (karakterler, şehir insanları, boss’lar, zemin ve duvar, düşmanlar, dost hayvanlar, toplananlar) vektördür,
   ekran çözünürlüğünde çizilir (`heroDraw`, `bossDraw`, `terrainDraw`, `enemyDraw`): kendi renginin koyusundan ince hat, yumuşak
   hacim, kenar ışığı. Siyah mürekkep yalnız tehlikede (diken, ok tuzağı). Yeni karakter, canlı ya da kaplama piksel sprite
   olarak eklenmez; arka plan katmanları düşük çözünürlükte çizilir ama `paintLayer` ile boyanır ve yumuşak büyütülür; üstüne
   atmosfer biner (`game/atmosphere.ts`: ışık, renk tonu, bulut, süzülenler). Işık sol üstten.
7. **Kanıt.** `verify-prelude` (meydan yolu) → `verify-levels` (bütün bölüm; hatıra, bayrak, pul, nazar, çıkış) →
   `verify-respawn` (hangi bayrakta, hangi düğme durumuyla ölünürse ölünsün çıkışa varılır) → `bossbot` (boss; zayıf
   oyuncu botu dahil) → `audit-difficulty` (zayıf oyuncu geçer) → `verify-items` (zayıf oyuncu her şeyi alır, aldığı yerden çıkar)
   → `verify-enemies` (düşmanlar ve oklar açıkken
   bir parçada en çok 3 ölüm, aynı yerde en çok 3). Biri FAIL ise bölüm bitmemiştir.
8. **Söz ve insan.** Her tabelanın ve her şehir insanının metni TR + EN yazılır, şehre özgüdür, kısadır ve sıcaktır;
   kişi adları oyun genelinde tekrar etmez. Tabela ne yapılacağını, insan şehri ve (üstü kapalı) gizli köşeyi anlatır.

## Sık işler

**Bölüm haritası değiştirmek.** Yeni şehirler `scripts/art/newcities.py`, imza bölümleri `scripts/art/sig.py`.
Değiştir → `python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py` →
`npx tsx scripts/verify-levels.ts <id>`. Eski şehirlerin ana haritası doğrudan `game/levels.ts` içinde.

**Yeni şehir.** `types.ts` CityKey → `game/cities/<id>.ts` (ana yol) → `art.ts` (CITY, buildLayers) → `enemyDraw.ts` (KEEPSAKES: hatıra çizimi; yeni tür varsa ENEMIES / FRIENDS) → `render.ts` (karo, tezgâh `s`,
simge nesne `z`, NEXT_CITY) → `music.ts` SCALES → `levels.ts` LEVELS + DECOR_CYCLE → `content.en.ts` →
`components/TurkeyMap.tsx` koordinat → `game/features.ts` → `game/finales/<id>.ts` (meydan yolu + nazar boncuğu) ve
`finales/index.ts` kaydı → `game/boss.ts` BOSSES (boss) + `game/bossDraw.ts` (çizimi) → `terrainDraw.ts` LOOK (zemin
malzemesi) → `public/sehirler/<id>.webp` ve `assets/cities/<id>.png` (`node scripts/art/banners.cjs <id>`) → `lib/storage.ts` ORDERS (eski sıra) → `tests/sim.test.ts`
plaka listesi. "Bölüm ölçütleri"ndeki sekiz maddenin hepsi sağlanmadan ve `npx tsx scripts/city-check.ts <id>` OK vermeden şehir eklenmiş sayılmaz (CI de koşar). Ayrıntılı yol: `.claude/skills/yeni-sehir`. Şehir sırası değişince (yeni şehir) `lib/storage.ts` MAP_VERSION artır ve eski sırayı ORDERS'a yaz; haritanın kendisi değişince hiçbir sayı artırılmaz (aşağıda "Harita sürümü").

**Kayıt asla kaybolmaz (17 Kasım 2026).** Kayıt her zaman en güncel hâlinden türetilir: `persist(s => …)` ya da `patch({…})`;
render anındaki `save` kopyasıyla `persist({ ...save, … })` yazılmaz (async giriş, bölüm sonu arasında yazılan rekoru ezer).
`writeSave` depo doluysa önce en büyük hayalet koşuyu siler (hayalet en çok ~8100 sayı, uzun koşu seyreltilir, `step`).
İki sekme `storage` olayıyla birleşir (sıfırlama `timesReset` ile kazanır). Bulut gönderimi başarısızsa yeniden dener
(`pushSave`), bulut sınırı 256 KB. Skor gönderimi 429 / 5xx / ağ hatasında bekleyip yeniden dener; skor hız sınırı oyuncu
başına (saatte 120) + geniş IP tabanı (600): aynı evdeki yolcular birbirinin hakkını yemez. Bütün şehirler bitince ana
menü "Serbest Gezi": yol çizgisinden seçilen şehirde oynanır. Kısayollar: R checkpoint, Shift + R baştan başla.

**Harita sürümü (kalıcı kural).** Güncelleme oyuncunun hiçbir şeyini silmez: harita yenilense de rekor, hatıralar, pul,
nazar, boss ve **sıralama** yerinde kalır (kullanıcı kararı, 14 Kasım 2026). Her şehrin sürümü haritasının özetidir
(`lib/mapVersion.ts` `cityVersion`); yalnız bilgi vermek için kullanılır: rekoru eski haritada koşulmuş şehir açılışta
"Yolda Neler Değişti" notunda ve şehir listesinde "Yenilendi" rozetiyle görünür (`isRenewed`, `mapNews` / `ackMapNews`),
oyuncu yeniden oynayınca rozet kalkar. Eski hayalet koşu yeni haritada gösterilmez. Skor anahtarı kalıcıdır
(`scoreKey`: `istanbul@s`); cihazdaki rekorlar girişte tabloya aktarılır (`syncBests`).

**Skor tablosu.** Oyuncu başına şehir başına tek satır: en iyi süre (ve o koşunun düşüş/hatırası), bütün koşulardaki en az
düşüş (`min_deaths`) ve en çok hatıra (`max_items`) ayrı tutulur, her bitiriş `plays`'i artırır. Sıralama filtresi sağ
sütunda gösterilen değeri de değiştirir. Günlük Meydan Okuma satırları `gunluk:<gün>` anahtarıyla aynı tabloda durur
(gün İstanbul saatiyle döner). API'ye dokununca `tests/scores.test.ts` koş.

**Şehir kartında skor paneli (21 Kasım 2026).** Şehir kartı (`screen === 'intro'`) kartın durum şeridinde "Lider X · süre · #sıran" çipi ve alt çubukta "🏆 Skorlar" düğmesi taşır; ikisi de `components/CityScores.tsx`
çekmecesini açar (`introScores`): şehrin ilk 10 yolcusu + oyuncunun kendi satırı (sıra, portre, ad, madalya, süre, düşüş, hatıra; "Sen" vurgulu, ☆ arkadaş), satıra basınca ayrıntı (süre, en az düşüş, en çok hatıra, koşu sayısı,
yolcu, lidere fark, "Profili Aç" `/oyuncu/<ad>`, "◌ Hayaletiyle Yarış" mevcut `startRace` akışı), "Tüm Sıralama →" Skor Tablosu'nun Şehirler sekmesine o şehirle atlar (`boardTab: 'city'`, `startCity`). Giriş gerekmez.
Veri mevcut `GET /api/scores?level=<şehir>` (sunucu değişmedi); saf mantık, kısa ömürlü önbellek (20 sn), uçuştaki isteğin paylaşımı ve iptal `lib/cityScores.ts` (`tests/cityScores.test.ts`); `useCityScores` şehir değişince yeniden
yükler, hata + Tekrar Dene, boş durum "İlk Rekoru Sen Koy". Bayrak başına süre API'de yok (hayalet dosyasında var, listede değil), bu yüzden ayrıntıda gösterilmez. Şehirler listesinde lider ve sıra toplu uçtan gelir ("Listede sıran"). Şehirler ekranı: başlıkta özet şeridi (`CityStats`), listede arama ve "oynamaya değer" süzgeçleri (`lib/cityFilter.ts`: Oynanmadı, Eksik Hatıra, Altın Yok; düzenli 2×2 ızgara, tek çip alta kaymaz; testi `tests/cityFilter.test.ts`), listede üstüne gelinen şehir haritada öne çıkar (`TurkeyMap peek`; kart yalnız fare ve klavye odağıyla açılır). Skor Tablosu: geniş tabloda ilk üç podyumda (ikinci, birinci, üçüncü; taç, ◌ Yarış), liste dördüncüden sürer; dar ve alçak ekranda podyum gizli, ilk üç listede. Mücadele kartı: madalya çizgisi (`MedalTrack`: işaretler + rekorun + sıradaki madalyaya kalan) ve eğilen parkur görseli (`components/useTilt.ts`, ana menü kartpostalıyla ortak). **Sütunlar eşit biter (kullanıcı kararı, 23 Kasım 2026):** yan yana sütunlu her ekranda (bölüm sonu, şehir kartı, Defter, düzenleyici) sütunların alt kenarı aynı hizada olur; kısa kalan sütunun son öbeği `mt-auto` ile dibe yaslanır (sütun `flex flex-col`). Bölüm sonu: süre sayarak gelir (`components/CountUp.tsx`), mühür basılır (`.seal-slam`), puan sayarak dolar. Düzenleyici: `.ed-shell` / `.ed-top` / `.ed-panel` / `.ed-canvas` (globals.css), Oyna düğmesi `cta`.

**Yolcu seçici `HeroPicker` (21 Kasım 2026).** Uktun / Memo seçimi her yerde `components/HeroPicker.tsx`: iki kart (portre, ad, rol), seçili kart tonlu çerçeve + tik, `role="radiogroup"` (←/→/↑/↓ geçer, 1 ve 2 seçer, Tab seçili karta
durur), altın odak halkası, hedef en az 56 px (alçak ekranda 48), hareketi azalt desteği. Boyutlar: `lg` şehir kartı (geniş ekranda sağ sütunun altı, dar ekranda alt çubuğun üstü; yatay telefonda alt çubukta `sm`),
`sm` mola (`plainRun` onayı aynen: `setPauseHero`), Mağaza, Düello ve Co-op kurulumunda oyuncu başına (`stack`, `tone` oyuncunun rengi). Yeni yolcu seçeneği gerekirse yalnız buraya yaz. İlk açılıştaki "Karakterini Seç"
ekranı biyografili kendi büyük kartlarıyla kalır.

**Sıralama ve profil arayüzü (25 Kasım 2026).** `components/ScoreBoard.tsx`: yedi sekme (Genel, Şehirler, Günlük, Modlar, Speedrun, Koleksiyon, Arkadaşlar; seçili sekme `seksek:board:tab`te hatırlanır), yolcu araması (`q`, adın parçası) ve sayfalama (`lim`, en çok 100) API'de;
satır (`.sb-item`): sıra (ilk üç renkli madalyon), portre (`hero`, `public/portreler`; telefonda gizli), ad + sakin çipler (ikincil değerler, "lidere +3,2 sn"), sağda büyük ana değer + doluluk çubuğu, sağ kenarda `›`. Podyum alçak, yumuşak basamaklar (büyük portre, taç, sıra rozeti, "Ayrıntı ›").
Satırın ve kürsünün tamamı **yolcu ayrıntısını** açar (ad bir `button`dır: `data-nav`, ok tuşları + Enter; dar listede, `compact`, ad hâlâ `/oyuncu/<ad>` bağlantısı): `components/PlayerDrawer.tsx`, ekranı değiştirmeden yandan (telefonda alttan) çekmece (portal, `role="dialog"`, odak içinde döner, Esc/Geri/arka plan kapatır, odak satıra döner):
portre + kombin, ad, unvan, atkı, katılım, bağlam şeridi (tablonun adı `Board title`, sıra, ana değer), yol halkası, toplam süre, başarım, seri, altı özet sayı, en iyi dört şehir, vitrin; altta "Profili Aç" (oyunda yeni sekmede), "◌ Hayaletiyle Yarış" (süre sıralı şehir tablosunda) ve ☆ arkadaş.
Veri salt okunur `GET /api/players/profile?name=` (`lib/profileServer.ts` `loadProfile`: `/oyuncu/[ad]` sayfasıyla aynı işlev; IP başına saatte 600, `LIMITS.profile`; 20 sn istemci önbelleği; testi `tests/scores.test.ts` "yolcu profili"). Yapışkan "Senin Sıran" şeridi sade (son bakışa göre ▲▼ `seksek:rank:*`, "Kendine Git").
`components/ProfileView.tsx` oyun içi (Defter → Profil, `lib/profile.ts` `profileFromSave`) ve herkese açık `/oyuncu/<ad>` sayfasında aynı: kimlik kartı atkı tonunda (`--tint`, `tintOf`; büyük portre, unvan, atkı, katılım, turnuva kürsüleri, yol halkası + çubuk + toplam süre), özet sayılar (`TotalsGrid`, çubuklu), vitrin (`save.pins`, en çok üç başarım; Defter → Başarımlar'da ☆ ile sabitlenir, bulutla gider) ve "Şehir Şehir" tablosu: süzgeç Hepsi / Altın / %100 / Eksik (sayılarıyla), sıralama Plaka / Süre / Sıra, satır plaka · şehir (%100 rozeti) · toplananlar · madalya + süre · sıra; geçilmemiş şehirler tek satırda plaka bulutu. Tablo dar kapta (`@container`, 520 px) iki satırlı düzene geçer; herkese açık sayfada geniş ekranda kendi alanında kayar (kimlik yapışkan). Sunucu sayfası şehir satırlarını skor tablosundan, toplananları bulut kaydından alır.

**Günlük Meydan Okuma: tek hak.** Başlayınca `save.dailyTry` bugünün günü olur (bulutla birleşir); o gün bir daha
başlanmaz, yarıda bırakmak da hakkı bitirir. Koşu içinde "Baştan Başla", Tek Can düşüşü ve süre sınırı şehrin başına
döndürür ama süre ve düşüş sürer (`restartKeep`, oyun döngüsünde `ranked`). Serbest Kurallı Koşu ve Sinir Bozucu bundan muaf.

**Kurallar.** Kurallı koşular (Günlük Meydan Okuma ve serbest Kurallı Koşu) `lib/extras.ts` DAILY_RULES'tan gelir: hız,
düşüş/eksik hatıra cezası, Tek Can (düşünce baştan), Bayraksız, Zamana Karşı (bronz süre), Dash’siz. Kural haritayı
değiştirmez; yeni kural eklerken her şehirde bitirilebildiğini kanıtla. Etikete güvenme: İstanbul "Kolay" ama dash'siz
bitmiyor, bu yüzden Dash’siz yalnız NO_DASH_OK listesinde çıkar (`npx tsx scripts/verify-rules.ts`; o şehirlerin haritası
değişince yeniden koş). Kurallı Koşu yalnız bitirilmiş şehirlerde açılır; rekoru şehir + kural başınadır.

**Kural simgeleri.** `components/RuleArt.tsx`: her kuralın SVG piktogramı, ailesi (Zemin, Görüş, Fizik, Baskı, Karışım)
ve zorluğu (1-5 alev); "ne değişir" rozetleri kural tanımından türer (`rulePerks`). Seçim ekranında canlı önizleme
(`CourseScene` + kuralın görünüşü). Yeni kural eklersen RULE_ART'a ve `glyph`'e yaz.

**Sinir Bozucu modlar.** `lib/extras.ts` RAGE_RULES (yirmi üç: Cehennem Yolu, Kaygan Dünya, Ters Tuşlar, Çöken Dünya, Kâbus, Son Nefes, Karanlık Yol, Baş Aşağı, Ayna Ekran, Turbo, Gece Yarısı, Kaos, Ay Yerçekimi, Fırtına, Görünmez Dikenler, Hayalet Zemin, Dar Kadraj, Kör Kâbus, Kovalamaca ve yeniler: Ağır Yerçekimi, Kısa Dash, Af Yok, Deprem; görüntü modları `view`: karanlık `renderer.dark`, ters ekran tuvalin CSS dönüşümü, menüde sıfırlanır):
Kurallı Koşu altyapısında (`save.rules`, rekor şehir + mod başına), günlüğe çıkmaz (RULES'ta yoklar). Fizik `ruleLevel()` ile
bölüme yazılır: `LevelDef.slippery` (her zemin buz), `crumbleAll` (üstü boş her katı yüzey çatlak taş; başlangıç, bayrak, çıkış
ve boss arenası sağlam); Ters Tuşlar girdide (`swapPhase`, 9 sn'lik turun son 4 sn'si, öncesinde uyarı). Kaygan ve çöken
fizik yalnız SLIPPERY_OK / CRUMBLE_OK şehirlerinde açılır: yeni şehir ya da harita değişikliğinde
`npx tsx scripts/verify-rage.ts <kaygan|coken> <şehir>` koş ve listeye yaz. Renk ailesi kiremit (`--color-coral`).

**Yeni fizik kuralları (21 Kasım 2026).** `LevelDef.heavy` (Ağır Yerçekimi: yerçekimi ×1,25, `HEAVY`), `shortDash` (Kısa Dash: dash süresi ×0,7, `SHORT_DASH`),
`noMercy` (Af Yok: coyote 0, zıplama tamponu 0,02 sn, `NO_MERCY`); üçü `ruleLevel` ile bölüme yazılır ve yalnız `HEAVY_OK` / `SHORT_DASH_OK` /
`NO_MERCY_OK` şehirlerinde açılır: listeye şehir yazmadan önce `npx tsx scripts/verify-rage.ts <agir|kisadash|afyok> <şehir>` (çözücü çıkışa varmalı;
`--hepsi` bütün şehirleri dener, yavaştır: şehirleri ayrı süreçlerde koş). Haritası değişen şehirde yeniden koş. Kanıt (21 Kasım 2026, `BUDGET=5000`): Ağır Yerçekimi 27/40 şehir, Kısa Dash 39/40 (Malatya yok), Af Yok 40/40; kanıtlanamayanlar kapalı kalır, bütçeyi artırıp yeniden denenebilir. Deprem yalnız görüntüdür
(`view.quake` → `renderer.quake`, sarsıntı ayarı kapalıysa etkisiz) ve her şehirde açıktır. Önizleme: `rage-quake` (globals.css).

**Modlar ekranı (21 Kasım 2026 premium yenileme, 25 Kasım 2026 sadeleşti).** Hiyerarşi: başlık > Bugün > aileler. Üst bölge: başlık + arama + Geri; altında tek satır: solda beş süzgeç çipi,
sağda tek, sakin şerit (`.mode-strip`: "▶ Devam Et: …" ve "Sana Önerilen ★ ad" metin düğmeleri, `.mode-strip-btn`; neden metni ipucunda). Altında "Bugün" başlıklı üç sade kart, her biri tek satır özet + Oyna:
Günlük Meydan Okuma (şehir, kural adı · skor ya da "Günde tek hak", seri 🔥; Oyna + 🏆; kuralın tam metni ipucunda), Günün Üçlüsü (üç nokta + n/3; Mücadele ve Boss birer satır: ad, ✓ ve süre, Oyna + 🏆) ve
Haftalık Turnuva (üç parkur alt alta ✓/○, "Turnuvaya Gir ›"; kartın tamamı açar). Geniş ve yüksek ekranda (`wide`) bu üst bölge sabittir, yalnız mod ızgarası kendi alanında kayar (alt kenarda hafif solma, `.mode-grid`);
küçük ekranda hepsi tek kaydırma alanındadır (ızgara orada `shrink-0`: `min-h-0` verme, taşan içerik tıklanamaz olur). Izgara ailelere göre gruplu, her aile ince başlıklı (`TileGroup`: şekil + ad + çizgi, şekil renk körü için ikinci işaret):
Yol (Kurallı Koşu, Mücadeleler, Ayna Yolu, Speedrun; çivit) · Meydan Okuma (Boss Rush, Maraton, Kovalamaca, Sinir Bozucu; kiremit `--color-coral`) · Birlikte (Düello, Co-op; turkuaz) · Üret (Bölüm Düzenleyici, Topluluk Haritaları; altın) ·
Keşfet ve Dinlen (Gezgin Turu, Sakin Gezi, Hikâye Gezisi; açık çivit `accent-2`). Gruplar DOM'da bu sırada durur; sayı tuşları `TILE_ORDER` sırasına bağlıdır (DOM sırasına değil). `ModeTile` sade: aile renginde madalyonlu çizim
(`.mode-art`; "Yeni" altında küçük etiket; sayı tuşu rozeti sol üstte yalnız üstüne gelince ya da klavye ızgaradayken görünür), başlık satırı (ad; sağda ikinci yollar `chips`: Kâbus, Çifte, Parkurlar, Aynalı ve 🏆 `extra`),
en çok iki satır açıklama ve tek durum satırı: **tek rozet** (iki kişilik modda "2 Kişi", öbürlerinde zorluk Kolay/Orta/Zor) + durum + ince ilerleme çubuğu. Kutucuğun tamamı modu açar (`href` ile sayfa);
üstüne gelince bir adım yükselir (yalnız transform, hareketi azalt açıksa yerinde). Kilitli kutucuk kesik çizgili, çizimi soluk ve nasıl açılacağını söyler. Derinlik gradyan + iç parıltıyla gelir: `filter`, `backdrop-filter` ve büyük gölge yok.
Düğme boyu fareyle 36 px, dokunmatikte (`pointer: coarse`) 44 px (`.hit`, `.mode-filter`, `.mode-strip`). Sol sütun gibi ekranı daraltan dikey bölüm kurma: yer kaplayan her şey dolu ve işlevli olsun. Yeni bilgi eklerken önce ipucuna
(`title`) ya da Nasıl Oynanır kartına koy; kutucuğa ikinci rozet ya da ikinci durum satırı ekleme.
Bulma araçları (`lib/modeHints.ts`, saf ve testli: `tests/extras.test.ts` "Modlar ekranı"): üstte arama (ad, açıklama, `tags` ve kutucuğun rozeti: "zor", "yeni", "2 kişi" yazan da bulur; Türkçe harf farkı yok, `/` odaklar,
Esc önce temizler sonra bırakır) ve süzgeç çipleri (Hepsi, Solo, Birlikte, Sıralamalı, Açık Olanlar); eşleşmeyen kutucuk gizlenir, hiçbiri kalmazsa "Eşleşen Mod Yok". `MODES` kataloğu her mod için zorluk (`heat`), kişi sayısı,
sıralama, `isNew` ("Yeni" etiketi: yeni mod gelince `true`, sonraki sürümde kapat) ve `howto` adımlarını tutar; **yeni mod eklerken** `ModeId`, `TILE_ORDER`, `NAME`, `MODES` ve `ModesHub` kutucuğunu (doğru `TileGroup` içine) birlikte yaz.
Kutucuk sırası sabit: ilk dokuzu 1-9 tuşlarıyla odaklanır, oklar kutucuklar arasında gezer (`neighbor`), Enter açar; kilitli kutucuk odaklanır ama açılmaz (`aria-disabled`). "Sana Önerilen" (`recommend`: en çok iki mod;
hiç oynamamışa günlük + Co-op, yeni bitirene Kurallı Koşu, boss yenene Boss Rush, Üçlü yarımsa Üçlü…) Devam Et ile aynı şeritte durur, süzgeç açıkken gizlenir, Devam Et'teki modu önermez; ana menüde Modlar kutucuğu aynı öneriyi
alt yazıda söyler ve ekran açılana dek "Yeni" yazar. Bir moda ilk girişte kısa "Nasıl Oynanır" kartı (`HowToCard`) bir kez çıkar (`seksek:modeIntro`, yalnız bu tarayıcıda; Geri sayılmaz, "Anladım, Başla" sayılır);
`audit-menus` o anahtarı önceden doldurur (yalnız `modlar-nasil` ekranı boş açar).

**Ayarlar ekranı (25 Kasım 2026).** `screen === 'controls'`, sayfa kaymaz. 1280 px ve üstü geniş ekranda üç sütun (`settingsWide` iki sütun + tuş atama bloğu): 1. Ses, Oynanış, Ekran ve Kontroller (son öbek `mt-auto`);
2. Kolaylıklar (seçimler tek kartta satır satır, altında üç anahtar) ve dibinde dokunmatik / oyun kolu tuşları (`.set-pad`); 3. Klavye, İki Kişilik, ipucu. Rehberi Yeniden Göster ve Ana Ekrana Ekle başlıkta, dilin yanında.
900-1279 px'te iki sekme (Oyun: iki sütun; Kontroller: Klavye | İki Kişilik, altında dokunmatik ve oyun kolu). Kart açıklamaları en çok iki satır ve kısa; 760 px'ten alçak geniş ekranda kart açıklaması ve renk körü önizlemesi,
700 px'ten alçakta ses açıklaması gizlenir (`.set-wide` kuralları globals.css). Yeni ayar eklerken üç boyutta (1280×720, 1512×860, 1024×640) panelin içi de kaymamalı: `ONLY=ayarlar node scripts/audit-menus.cjs` + ekran görüntüsü.

**Öfke Parkurları.** `game/rageCourses.ts` RAGE_COURSES: elle çizilmiş uzun, çok zor parkurlar (mücadele altyapısı: `Challenge.map`,
madalya `par`dan, skor `mucadele:<id>`, ALL_CHALLENGES ile aranır; turnuvaya girmez). Modlar → Sinir Bozucu → Parkurlar.
`level` görünüşü veren şehirdir, parkur o şehir bitince açılır. Kanıt `npx tsx scripts/verify-challenges.ts`.

**Madalyalar.** Elle yazılmaz: `game/medals.ts` (çözücü süresi × 1,4 + insan paylı boss botu × 1,1; gümüş × 1,3, bronz × 1,75;
eskisinden uzun olmaz). Haritası ya da boss'u değişen şehirde `npx tsx scripts/solver-time.ts <şehir>` ve `bossbot` ile ölç,
SOLVER_TIME / BOSS_TIME'a yaz (hile önleme testi de SOLVER_TIME'ı okur).

**Mücadele haritaları.** `game/challenges.ts` CHALLENGES: şehir + bayrak aralığı (`from`, `to`) + `par` (çözücünün süresi).
Harita şehirden kesildiği için şehir haritası değişince kesit de değişir: Zor şehre dokununca `npx tsx scripts/verify-challenges.ts`
koş, süre çok oynadıysa `par`ı güncelle. **Madalya** (23 Kasım 2026, sıkılaştı): çözücü kaba adımlarla koşar, usta oyuncu `par`ın ~%70'inde biter;
altın `gold` alanı (ölçülmüş usta koşusu × 1,08, yukarı yuvarlanır), yoksa `goldOf` (kesit ve Usta Parkuru `par` × 0,85, Öfke Parkuru `par`); gümüş altın × 1,5,
bronz × 2,2 (`challengeMedals`). Yeni bir usta koşusu ölçülünce `gold`a yaz. **Usta Parkurları** `game/puzzles/` (zamanlama.ts, bulmaca.ts → `MASTER_COURSES`):
elle çizilmiş zamanlama/bulmaca bölümleri, Mücadeleler listesinde kesitlerin altında kendi başlığıyla; ALL_CHALLENGES'tadır ama CHALLENGES'ta değil
(turnuva, Günün Mücadelesi ve Gezgin Turu haftalık seçimi kaymasın). Liste ekranı geniş ekranda iki sütun (sol ve sağ dengeli, sıralama kendi alanında kayar). Skoru `mucadele:<id>` anahtarıyla aynı tabloda (genel sıralamaya girmez), en iyisi `save.challenges`.

**Haftalık Turnuva.** `lib/extras.ts` `tournamentFor(hafta)`: CHALLENGES'tan her hafta üç farklı şehrin kesiti (İstanbul
saatiyle pazartesi-pazar). Skor `turnuva:<hafta>:<mücadele>`; GET `level=turnuva&week=` üçünü de bitirenleri toplam süreyle
sıralar. Kapanmış haftaların ilk üçü oyuncu sayfasında kalıcı rozet. Cihazda `save.turnuva` (yalnız bu hafta).

**Günün Üçlüsü (21 Kasım 2026).** Bugün şeridinde üç iş: Günlük Meydan Okuma (tek hak), Günün Mücadelesi (`dailyMini(gün)`: CHALLENGES'tan kesit) ve
Günün Boss'u (`dailyBoss(gün, LEVELS)`: boss arenası, `rushArena`); ikisi serbest tekrar, skor yalnız en iyi süre. Seçim tarihe bağlı ve zincirlidir
(art arda iki gün aynı gelmez; boss meydan okuma şehriyle çakışmaz; sunucu ve istemci aynı sonucu bulur). İz `save.trio` (`TrioMark`: bugünün süreleri,
`days` tamamlanan Üçlü sayısı, `last`; `markTrio` / `settleTrio` / `mergeTrio` / `cleanTrio`, bulutla birleşir); üçü de bitince `trio` / `trio7` başarımı.
Skorlar aynı tabloda `gunluk-m:<gün>` / `gunluk-b:<gün>` (Skor Tablosu → Günlük → Meydan Okuma / Mücadele / Boss; genel sıralamaya ve toplu aktarıma girmez).

**Puan (23 Kasım 2026).** `lib/points.ts` `runPoints(altın, süre, düşüş, hatıra)`: süre payı 1000 × altın / süre (200-1250), her hatıra 250,
düşüş −20 (en çok −300), düşmeden +150. Sunucu şehir koşusunda aynısını hesaplar ve `seksek_scores.max_points`te en yükseğini tutar (göç `0011`);
sütundan önceki satırlar için SQL karşılığı `pointsSql` (route.ts; formül değişirse ikisi birlikte). Skor Tablosu Şehirler ve Genel'de "Puan" süzgeci
(`sort=points`; genelde şehir puanlarının toplamı); şehir bitişinde puan dökümü. Günlük Meydan Okuma'da hatıra (`DAILY_ITEMS_FROM` 24 Kasım'dan):
kuralın kendi cezası yoksa eksik her hatıra +5 sn (`missingFor`, `extraMissing`; ceza süreye eklenir, alt sınırın altına inmez). Serbest Kurallı Koşu eski kuralla kalır.

**Listede sıran (23 Kasım 2026).** `GET /api/scores?level=ozet&kind=sehir|mucadele&me=<ad>`: her tablonun lideri, süresi, yolcu sayısı ve oyuncunun
sırası tek sorguda. `lib/listRanks.ts` `useListRanks` (30 sn önbellek, liste açıkken), satırda `components/RankTag.tsx` ("★ Lider", "#3/12", lider adı):
Şehirler listesi ve Mücadeleler. Ana menünün fotoğrafı ve hesap satırı yolcunun Mağaza kombinini giyer (`HeroFigure kit`, `Portrait accessory`).

**Her moda sıralama.** Sunucuya giren yeni tablolar: `kural:<şehir>:<kural>` (Kurallı Koşu, Sinir Bozucu, Kovalamaca: serbest koşu bitince gönderilir;
alt sınır şehrin kendi yolu, kural `ruleOk`: bilinen, `hasOwnProperty`, `ruleFits`) ve `bossrush:<duz|kabus|cifte>:<boss sayısı>` (aynı sayıda boss'luk
koşular yarışır; alt sınır `BOSS_FLOOR_MS` × boss). Skor Tablosu → Modlar sekmesi (Kurallı Koşu: şehir + kural; Boss Rush: çeşit + boss sayısı). Modlar
kutucuklarındaki 🏆 çipi ilgili sekmeyi açar (`onBoard`). Sunucuya girmeyenler: Maraton (rastgele şehirler, süreler karşılaştırılamaz), Ayna Yolu (kasıtlı yerel),
Düello ve Co-op (aynı cihazda iki kişi; rekoru cihazda). Yeni tablo eklerken: `lib/scoreKey.ts` anahtar, `antiCheat.minScoreMs`, `route.ts` parseRun + GET,
`tests/scores.test.ts`.

**Şehir seçici.** `components/CityPicker.tsx` ortak: arama (ad / plaka, Türkçe harf farkı yok sayılır), zorluk süzgeci, defter sekmesi, son oynananlar
(`lib/recentCities.ts`, yalnız bu tarayıcıda), rekor rozeti, kilitli ve uymayan şehir soluk, ok tuşlarıyla gezinme. Kurallı Koşu / Sinir Bozucu /
Kovalamaca (`RuleSetup`) ve Düello kullanır; yeni kurulum ekranı şehir seçecekse `<select>` değil bunu kullan. Modlar'da "Devam Et" şeridi son açılan modu
hatırlar (`rememberMode`).

**Arkadaşlar.** `save.friends` (yolcu adları, buluta da gider). Skor tablosunda ☆ ile ya da adla eklenir; her tabloya
`names=a,b` süzgeci verilir (adlar zaten herkese açık, yanıt önbelleklenebilir). "⚔ Beni Geç Bağlantısı" `/?yaris=<şehir>~<ad>`.

**İkinci defter.** Rize, Artvin, Kars, Bitlis, Ağrı ve dönüş yolu Giresun, Tokat, Denizli, Zonguldak, Mersin, Karabük, Aydın, Balıkesir, Elazığ, Afyon, Bingöl (`FIRST_BOOK` = Rize'nin sırası; defter Bingöl'ün yüzen adalarında biter). Bayburt ilk kez bitince final
sahnesi (`Ending`) açılır, sonundaki "İkinci Defteri Aç" Rize'yi yükler. Final, Ayna Yolu ve Tam Tur ilk defterin 30
şehriyle kalır (ikinci defterin aynası doğrulanmadı). Biten en ileri şehrin ardındaki her zaman açıktır (`normalizeSave`):
yol uzayınca son şehri bitirmiş oyuncu yeni şehre geçer. Yeni defter eklenirse aynı kalıp.

**Speedrun.** %100 (üç hatıra + pul + nazar aynı koşuda; `save.full`, skor `yuzde:<şehir>`), Tam Tur ve Ayna Tam Tur
(ilk defterin şehirleri arka arkaya, `rushRef` kind `tur`/`aynaTur`; skor `tur`/`aynatur`, üst sınır 12 saat). Hile önleme
alt sınırı şehrin ya da otuz şehrin toplamının fiziksel en kısa süresi. Skor Tablosu → Speedrun sekmesi. Genel sıralamaya
ve toplu aktarıma girmez (`tests/scores.test.ts`).

**Şehir ustaları.** Her şehrin ilk şehir insanı ustadır; görev `lib/ustalar.ts` (`ustaTask(sıra)` beş türden döner, art arda
aynı olmaz): üç hatıra aynı koşuda, düşmeden, altın madalya, pul + nazar aynı koşuda, boss'u düşmeden. Görev koşu sonucundan
doğrulanır (Rahat Mod sayılmaz), mühür `save.ustalar`; Mağaza'da para sayılır. Şehir kartında görünür. Yeni şehrin
ilk kişisi esnaf olsun (usta o).

**Co-op.** `World.enableCoop()` eşi (`partner`) kurar; `stepPartner` eşi aynı adımda, oyuncu kaydını geçici olarak eşe
çevirerek yürütür: çarpışma, toplama, tehlike, bayrak, boss'a basma ve çıkış ortak koddan geçer. Kural iki oyuncuya aynı
(kullanıcı kararı, 17 Kasım 2026): biri düşerse bölüm son bayraktan kurulur ve ikisi birden orada doğar (eş düşerse
`stepPartner` `respawn` + `bringPartner`, oyuncu düşerse Coop.tsx `respawn` olayında `bringPartner`). Tuşlar oyuncunun ataması (`save.duoKeys`, `normalizeDuo` / `bindDuo`; Ayarlar → Kontroller "İki Kişilik" ve Co-op /
Yarış molasında `DuoRemap`), varsayılan `DEFAULT_DUO`: solda WASD + Sol Shift, sağda ok tuşları + Enter; her oyuncunun tek dash
tuşu (Sağ Shift kimsede yok: bazı klavyelerde iki Shift karışıyor, biri ötekini dash attırıyordu). Boşluk varsayılanda kimsede yok (tek kişilikte dash Boşluk, alışkanlıkla basılınca öbürünü atıyordu); bir
tuş tek oyuncunun tek eylemi, atanan tuş öbüründen alınır (takas) (`tests/input.test.ts`). Molada değişen tuş hemen uyar (`keysRef`).
**Co-op işbirliği (21 Kasım 2026).** Eş kuralları `sim.ts`te, iki oyuncuya aynı: **Kurtarma** (`World.rescue`, `RESCUE_TIME` 3 sn, `updateCoop`):
biri düşünce öbürü ayaktaysa bölüm bayraktan kurulmaz, düşen son sağlam yerinde (`lastSafe`) balonda bekler (`World.downed`), öbürü balona
değerse kurtarıcının yanında kalkar (`rescue` olayı), süre dolarsa eskisi gibi bayraktan kurulur; ikisi birden düşerse balon yok. Kurtarma
kolaylaştırdığı için rekoru ayrıdır (`coopKey` sonu `:kurtar`, kapalıyken eski anahtar). **Eşi Fırlat** (`shoulder`, `THROW_BOOST` 1,6): inen
omuz sekmesinde alttaki de zıplıyorsa (`buffer` ya da yukarı hız) sekiş yükselir, olay `thrown` taşır. **İşaretler** (`World.ping`, `PING_LIFE`):
1. oyuncu 1-4, 2. oyuncu 7-0 (Burada, Bekle, Dikkat, Aferin; `lib/coopRules.ts` `pingFromKey`, oyuncunun hareket tuşu olan rakam işaret
sayılmaz), oyun kolunda LB / RB. Saf kurallar (pay, `credit`, `coopAwards` kişisel ve ikili unvanlar, `legTimes`) `lib/coopRules.ts`te,
testi `tests/coop.test.ts` ve `tests/mechanics.test.ts` "co-op: Kurtarma, Fırlatma, işaret". `Coop.tsx`: önce **Hazır mısınız?** (ikisi de
zıpla/dash tuşuna ya da oyun kolunda A'ya basar, kural kartları ve işaret tuşları orada), sonra geri sayım; başın üstünde renkli ad etiketi,
ayakta halka, işaret balonu ve kurtarma balonu üstteki ikinci tuvalde (`drawTags`, kamera `camX/viewW` ile izdüşüm). Bitişte bayrak süreleri,
rekora fark, ikili unvanlar, "Tekrar" / "Başka Şehir". Sunucu sıralaması yok (iki yolcu tek cihazda, tek hesap kimliği yok; düello ve Co-op
"Her moda sıralama" dışında kalır). Sim'e eş kuralı eklersen `updateCoop`a yaz.

Boss Kapışması (`CoopSetup` kipi): seçilen boss'un arenası (`coopLevel`), isteğe bağlı ikinci boss `LevelDef.bossOf2`
(`World.boss2`: kapı ikisi de düşünce açılır) ve zorluk `bossBoost` (kademe + hız; Normal, Öfkeli, Kâbus). Kamera ikisinin ortasına
bakar; uzaklık görünür alanın %80'ini aşınca geride kalan öne ışınlanır. Düşmanlar ve boss'un nişanı yalnız oyuncuyu izler.
Co-op ilerlemeye ve şehir rekoruna dokunmaz; ikilinin kendi rekoru `save.coop` (`coopKey`: `yol:<şehir>`, `parkur:<mücadele>`,
`boss:<a>+<b>:<zorluk>`). Kipler `CoopPlan.mode`: Şehir Yolu, Boss Kapışması, Parkur (ALL_CHALLENGES, şehri bitirilmiş olanlar).
Kurallar: Ortak Can (`lives`, düşüşler biterse yolculuk biter), Kısa İp (ip ekranın %45'i), Zamana Karşı (`coopLimit`: gümüş
süre; boss'ta boss başına 75 sn). **Omuz sekmesi** (`sim.ts` `shoulder`, `SHOULDER_BOOST`): eşin başına inerken zıplama
basılıysa ~3,5 karo seker, basılı değilse yana kısa hop (başta takılı kalınmaz). Olaylar onları üreten adıma göre oyunculara
yazılır (`credit`: step 1. oyuncu, stepPartner 2. oyuncu); bitişte "Kim Ne Yaptı" ve unvanlar (`coopAwards`). Tek oyun kolu
takılıysa 2. oyuncunun olur. Sim'e oyuncuya özel yeni durum eklersen eşin de taşıdığından emin ol
(`tests/mechanics.test.ts` "co-op eşi", "omuz sekmesi").

**Düello.** `DuelSetupValue`: tur 1/3/5 (`duelResult` yarısından fazlasını alan), şehir ya da parkur (`course`, `duelLevel`),
şartlar `terms` (`DuelTerms`: düşüş cezası 0/5/10, Hatıra Avı −5 sn, oyuncu başına avantaj); skor `duelScoreWith`; **Tek Can** (`terms.oneLife`, yalnız Yan Yana Yarış: ilk düşüşte o oyuncunun turu biter, bitiremedi sayılır);
Yan Yana Yarış bayrak sürelerini tutar (`DuelRun.splits`), bitişte "Bayrak Bayrak" (`legDuel`). Eski
kurulumlar şartsız gelir (`duelTerms`: sırayla 5 sn ceza, yan yana cezasız).

**Boss Rush çeşitleri.** `rushArena` (levels.ts) + `rushPlan` (extras): Kâbus (kademe 3, %30 hızlı), Çifte (boss'lar ikişer
aynı arenada, `bossOf2`). Rekorları `save.rushPlus[variant]`. Kanıt `npx tsx scripts/verify-rush.ts <kabus|cifte> [şehir]`: tam ve
insan paylı bot yenmeli (en zor modlar; zayıf bot `--zayif` ile bilgi için). Boss botu iki boss'la da dövüşür (hedef: yorgun olan).

**Kovalamaca (Sinir Bozucu `kovala`).** `LevelDef.chaser` → `World.chaser` (`sim.ts` `updateChaser`, `CHASE`): Kangal oyuncunun
izini (yol boyu) sabit hızla koşar, hızı artar, en çok `maxLag` sn geride kalır; yetişince ısırır (`bite` olayı, `kill`).
Doğuşta ve meydan kapısında bekler, boss uyanınca durur; hareketli platform, asansör, tokmak, ritim, gelgit ve plakanın
başında (`chaseCalm`) oturur, iz de birikmez: zorunlu bekleme ve bulmacada geri dönüş cezalanmaz. Ekran dışındayken kenarda yakınlık işareti (`render.ts`
`drawChaserHD`, çizim `enemyDraw.ts` `drawChaseDog`). Bu sayede Sivas (Kangal orada dost) dışında her şehirde açık (`CHASE_NO`);
kanıt `npx tsx scripts/verify-chase.ts [şehir] [--hepsi]` (çözücünün yolu, köpek %15 hızlıyken ısırılmadan biter; makronun duvarı iterek geçen süresi sayılmaz).
Haritası değişen şehirde yeniden koş (CI her şehirde koşar). Köpek yetişmesine bir saniye kala bir kez hırlar (`growl`).

**Sürüm notu.** Yeni şehirle gelen yenilikler `Game.tsx` RELEASE_NOTES[şehir]: o şehir "Yolda Neler Değişti" notunda yeni
görünürken "Bu Sürümde" listesi ve "Modlara Bak" düğmesi çıkar. Yeni şehirle birlikte yeni mod geliyorsa buraya yaz.

**Ayna Yolu ve final.** Otuz şehir bitince final sahnesi (`Ending`) ve Ayna Yolu açılır. Ayna haritası şehirden üretilir;
sim'in sağ-sol simetrisi bozulursa (yeni nesne, x'e bağlı faz) `mirror` kipinde de düzelt, sonra `verify-mirror` ve
`AYNA=1 bossbot` koş. Çözücü Ayna Yolu'nda sola doğru arar (`mx`). Rekor `save.ayna`.

**Mağaza.** Bütün kılık tek yerde (`components/Shop.tsx`), **iki yolcu ayrı ayrı** giydirilir (Uktun ve Memo sekmeleri, "Öbürüne Kopyala"):
baş, yüz ve sırtta birer parça (kombin, `Kit`; kayıtta `save.kits[yolcu]`) ve atkı rengi (`save.scarfs[yolcu]`, nazar boncuğuyla açılır).
Eski ortak `kit` / `accessory` / `scarf` ilk yüklemede (`normalizeSave`) iki yolcuya kopyalanır, okuma `kitOf(save, yolcu)` /
`scarfIdOf(save, yolcu)` ile (geriye düşer; bulut birleşmesi yolcu başına). Parçaların `for` alanı var: `for: 'uktun'|'memo'` yalnız o
yolcunun dolabında görünür (her yuvada en az üç özel parça), alanı olmayan ortaktır. **Sahiplik yolcuya özgü**: `owned['uktun:fiyonk']`
(`ownedKey`, `hasAccessory`); düz kimlik (`owned['fes']`) karakter ayrımından önce alınmıştır ve iki yolcuya da açıktır. Para birimi
**parça**: hatıra, pul, nazar 1 · yenilen boss 2 · Usta Mührü 3 (`earned`); kazanç iki yolcuya da tamdır, her yolcunun cüzdanı kazanç
eksi kendi dolabında alınanların fiyatıdır (`walletOf(kazanç, owned, yolcu)`). Fiyatlar, bütün oyunun parçasıyla her yolcunun dolabının
tamamı (aksesuarlar + ücretli görünüm seçenekleri, `closetPrice`) alınacak biçimde, oyunun parçasının %80-100'ü (`tests/extras.test.ts` bekler; 21 Kasım 2026: görünüm gelince eski aksesuar fiyatları ~%30 indirildi). Co-op / Düello / Yarış'ta her oyuncu seçtiği karakterin kılığını giyer
(`Coop` / `Race` `looks`). Yeni aksesuar: `ACCESSORIES` (yuva, fiyat, `for`) + çizim: baş ve yüz parçaları `game/accessoryDraw.ts`
(`drawHeadItem` / `drawFaceItem`: tek yazım, `HeadFrame` ile hem oyundaki karakter hem portre çizer), sırt parçaları aynı dosyada
oyun ve portre için ayrı (`drawHeroBack`, `drawPortraitBack`); eski ortak parçalar heroDraw / portraitDraw içinde. Föy:
`node scripts/art/accessories.cjs`. `seals` verilen aksesuar parayla alınmaz, o kadar Usta Mührüyle açılır (Altın Defne Tacı: 10).
Yolcu (Uktun / Memo) şehir kartında seçilir; molada değişirse onayla şehrin başına dönülür (yalnız düz şehir koşusunda, `plainRun`).

**Görünüm ve duruş (21 Kasım 2026).** Mağaza iki sıra sekme: Kılık (Baş, Yüz, Sırt, Atkı) ve Görünüm (Saç, Ten ve Göz, Kıyafet, İfade, Duruş). Dokuz eksen
`game/looks.ts` LOOK_AXES (saf veri, çizimsiz): saç stili `hs` (ön saç `front` + arka saç `back`: kendi saçı, kısa, at kuyruğu, topuz, örgü, küt, kıvırcık, kazıma, omuz saçı;
`for` ile yolcuya özgü), saç rengi `hc`, ten `sk` (6), kıyafet rengi `oc` ve deseni `op` (çizgili, puantiyeli, ekose, yıldızlı, zigzag), göz rengi `ey`, ifade `ex`
(neşeli, uykulu, şaşkın, kurnaz, sevecen), bekleme duruşu `st`, koşu tarzı `rs`. Kayıt `save.looks[yolcu]` (`LookPrefs`, eksen → seçenek kimliği; yoksa ya da yolcunun
kendi değeriyse varsayılan görünüm, eski kayıt bozulmaz); bulutla (`CLOUD_KEYS`) yolcu ve eksen başına birleşir (`mergeLooks`), `cleanIncoming` / `normalizeLook`
bilinmeyeni düşürür, `clearProgress` siler. **Görünüm kombinle gezer**: `Kit.look` (kitOf birleştirir), bu yüzden `acc` / `accessory` geçen her yer (oyun, eş, portre,
profil) otomatik uyar; `kitKey` görünümü de içerir. `normalizeLook` aynı içeriği aynı nesneye tekilleştirir: `resolveSkin` (heroDraw) kimlik karşılaştırmasıyla önbellekler, kare başına nesne ayrılmaz.
Sahiplik `owned['uktun:hs:topuz']` (`lookKey`, `hasLook`; fiyatı 0 olan herkesin), cüzdan `walletOf` hepsini sayar, satın alma `Game.tsx` `buyLook`. Saç parçalarının
tek yazımı `game/hairDraw.ts` (arka saç ve topuz, `HeadFrame` ile oyun ve portre); ön saç biçimleri ve kazıma heroDraw / portraitDraw içinde; desen `drawPattern`; ifade
göz / kaş / ağız heroDraw ve portraitDraw'da. Yeni seçenek: `LOOK_AXES` + (saç / renk ise) ilgili tablo + çizim, sonra föy `node scripts/art/looks.cjs [çıktı.png] [sac|renk|ifade|durus|kosu|taban]`.
Yeni aksesuarlar: Uktun kedikulak, tavsan, yildizgoz, kanat; Memo melon, kask, vizor, jet.
**Duruşlar** `game/stance.ts` (saf poz kodu, tampona yazar): `idlePose` = taban duruş (rahat, eller belde, kollar bağlı, eller cepte; "bakınır" ve "esneyip durur" aynı tabana
farklı hareket sırası verir) + nefes, göz kırpma, saç ve atkı esintisi; kıpırdamadan 3 sn sonra duruşun hareket sırası (etrafa bakınma, ayak oynatma, esneme, el sallama;
`STANCES.moves`, her hareket 6,6 sn'lik dilimde). Koşu tarzları `heroDraw.gaitInto(out, evre, hız, tarz)` (normal, sportif, tırıs: adım sıklığı ×2, tek omuz). `Pose`ta `head`, `gaze`,
`mouth: 'yawn'` alanları var. Oyuncu, Co-op eşi (`heroAnim`) ve hayalet (`drawGhostRun`) aynı kodu çağırır; hayalet kendi duruşunu bilmez (kayıtta yok), varsayılanı gösterir.
Poz tamponları `HeroAnim.out/tmp`, `Renderer.ghostPose`: kare başına poz nesnesi ayrılmaz (dash izi kopya alır). İniş sönümlü yaydır (`HeroAnim.landT`: çökme sonra hafif uzama),
kalkışta daha çok uzama, tepede yuvarlaklaşma. Mağaza önizlemesi `demoPose` (Döngü, Dur, Koş, Zıpla) oyundaki pozla aynı kodu kullanır.

**Topluluk haritaları.** Düzenleyicide çözücüyle bitirilen harita "Topluluğa Yayınla" ile `seksek_maps` tablosuna gider
(giriş gerekir, günde 10, başlık süzgeci `lib/communityMaps.ts`); galeri `/haritalar` (Yeni, En Beğenilen, En Çok Oynanan),
beğeni `seksek_map_likes`, oynanma sayacı bağlantı + harita başına saatte bir. Modlar ekranının altından bağlantı verilir. API'ye dokununca `tests/maps.test.ts`.

**Hile önleme ve hız sınırı.** Skor API'si süreyi haritanın fiziksel en kısa yoluyla karşılaştırır (`lib/antiCheat.ts`
`minScoreMs`: yatay mesafe / dash hızı × 0,6); hayalet koşu yüklenirse hız ve ışınlanma denetlenir. Haritası çok kısalan
şehirde `tests/antiCheat.test.ts` SOLVER tablosunu yeniden ölç. Giriş, kayıt ve skor gönderimi `lib/rateLimit.ts` ile
sınırlıdır (429 + Retry-After); göç `0008_seksek_rate`. Yeni sunucu ucu kötüye kullanılabiliyorsa `LIMITS`e ekle.

**Güvenlik (kalıcı kural, 18 Kasım 2026).** Yeni ya da değişen API ucunda şu sırayı koru:
- **CSRF:** veri değiştiren her uç (POST, PUT, PATCH, DELETE) ilk satırda `if (crossSite(req)) return crossSiteError()`
  (`lib/sameOrigin.ts`: `Sec-Fetch-Site: cross-site` ya da başka/`null` `Origin` → 403). Çerez SameSite=Lax tek başına
  login CSRF'ini (saldırganın oturumunu kurbana kurmak) kesmiyordu.
- **Kimlik:** oturum `verifyPlayer` ile doğrulanır; istemcinin yazdığı `playerId` hiçbir şeye anahtar olmaz (hız sınırı da
  doğrulanmış kimliğe: `playerKey(me.id)`, oturumsuz istek `ipKey`). Satır her zaman `me.id` ile yazılır/silinir.
- **Hız sınırı:** kötüye kullanılabilen her uç `lib/rateLimit.ts` LIMITS'te (giriş, kayıt, ad değiştirme, skor, hayalet,
  bulut kaydı, yayın, beğeni, oynanma, salt okunur profil). Yeni uç → LIMITS'e ekle, testte sınırı sına.
- **Girdi:** gövdeyi okumadan `content-length`, sonra metin uzunluğu; sayılar `Number.isInteger` + alt/üst sınır; dizgiler
  uzunlukla; bulut kaydında `__proto__`/`constructor` anahtarları JSON.parse'ta düşer. Ham `sql```te değer hep parametre
  (`${…}`); tablo/sütun adı kullanıcıdan gelmez. Hata yanıtı genel Türkçe cümle, ayrıntı (yığın, SQL) dönmez.
- **Kullanıcı adı:** kuralı `lib/playerName.ts` (sunucu ve formlar aynı): yalnız Latin alfabesi (Türkçe harfler dahil),
  ASCII rakam, boşluk, `- _ .`; NFC'ye çevrilir, NFKC'de değişen (tam genişlik) ve başka alfabeden benzer harf reddedilir;
  yeni ad I/ı/İ/i farkıyla da boşta olmalı (`nameTaken`). Giriş eski adlarla çalışmaya devam eder.
- **Şifre ve oturum:** scrypt + `timingSafeEqual`; olmayan adda da sahte scrypt (`checkPasswordOrDummy`), yanıt aynı.
  Oturum anahtarının veritabanında yalnız sha256'sı durur; çerez HttpOnly, üretimde Secure, SameSite=Lax.
- **Kullanıcı içeriği** React metni olarak basılır (dangerouslySetInnerHTML yok); tuvale çizilen metinler (`?ozel=` tabela,
  kişi) `textProblem` süzgecinden geçer; skor kartı adı (`parseShare`) süzülür ve kaba söz atılır.
- **Başlıklar** `next.config.ts`: CSP (yalnız kendi kökenimiz; inline betik Next için, `unsafe-eval` yalnız geliştirmede),
  `frame-ancestors 'self'`, Permissions-Policy, COOP, HSTS, nosniff. Dış kaynak (font, betik, API) eklersen CSP'ye yaz ve
  `npx next start` ile oyunu, /duzenle ve /haritalar'ı açıp konsolda CSP ihlali olmadığına bak.
- Kanıt: `tests/scores.test.ts` ve `tests/maps.test.ts` "güvenlik" blokları (403, ad taklidi, hız sınırları, __proto__).

**Gezgin Turu ve Sakin Gezi (21 Kasım 2026).** `components/FunModes.tsx`. Gezgin Turu: `lib/extras.ts` `gezginFor(tohum, 3|4|5)` her tohumdan aynı
kesit dizisini çıkarır (Mücadeleler'den, aynı şehirden ikisi yok); kesitler `startChallenge` yoluyla koşulur (`gezginRef`), hepsi bitince toplam
`save.gezgin[gezginKey]` rekoru olur (bulutla birleşir, küçük olan kazanır). Sunucu sıralaması yok (kesitlerin kendi sıralaması var). Sakin Gezi:
`LevelDef.calm` + `customRef` yolu: düşüş sayılmaz (`kill()` 0,3 sn sonra son bayrakta doğurur), ilerlemeye, rekora ve deftere dokunmaz, çıkışta
Modlar'a dönülür. İkisi `lib/modeHints.ts` kataloğunda (`gezgin`, `calm`) ve `scripts/audit-menus.cjs` SCREENS'te.

**Hikâye Gezisi (21 Kasım 2026).** Modlar → Hikâye Gezisi (`components/StoryMode.tsx`: `StorySetup`, `StoryTalk`, `TalkPrompt`, Defter'deki `MetView`). Sakin Gezi yolu (`LevelDef.calm` + `story`, `customRef`): süre, düşüş sayısı, rekor, skor ve defter yok;
şehir seçilir (CityPicker, açık şehirler), şehir insanına yaklaşınca "Konuş" (E / Enter, dokunma, oyun kolunda LB-RB) konuşmayı açar. Konuşurken fizik akmaz (`talkRef`, oyun döngüsü yalnız çizer), alt panel karakteri örtmez: portre,
ad + yıldızlar, harf harf akan söz (hareketi azalt açıksa anında; Enter hızlandırır), cevap seçenekleri (1-3, ↑↓ + Enter, dokunma, oyun kolu; Esc kapatır, mola açmaz). **Diyalog verisi** `game/stories/<bölge>.ts` (bati, ic, guneydogu, karadeniz,
defter2a, defter2b; `index.ts` birleştirir, anahtar şehir insanının Türkçe adı): selam → üç soru (merak, şaka, saygı) → karakterin tepkisi; her yeni soru bir yıldız (`bond` 0-3), üç yıldızda "defter sayfası" (hediye: şehir bilgisi, kişisel söz).
Metin `[TR, EN]` çiftidir; `{rol}` (Haritacı / Telefoncu) ve `«Uktun’a||Memo’ya»` yolcuya göre küçük fark verir (`fill`). Diyaloğu olmayan kişi kendi kısa sözünü (`text`) söyler. Kayıt `save.story` (ad → bit alanı: 1/2/4 sorulan soru, 8 sayfa okundu,
16 tanışıldı; `lib/storyRules.ts`): buluta gider (`CLOUD_KEYS`), `mergeSaves` bitleri birleştirir (hiçbir tanışma kaybolmaz), `cleanIncoming` temizler (en çok 400 anahtar), `clearProgress` siler; `persist(s => ...)` ile yazılır. Başarımlar
`storyFirst/story10/storyStar/storyAll` kayıttan hesaplanır. **Yeni şehir ya da yeni şehir insanı eklerken** ilk iki kişiye `game/stories/` içinde konuşma yaz (her şehirde en az iki diyaloglu kişi: `tests/story.test.ts` bekler; adlar `levels.ts`'tekiyle aynı).
Metin kuralı: her karakterin sesi kendi mesleği ve şehri; aynı cümle iki karakterde geçmez (test bekler); kişi adı uydurma. Kanıt: `npx vitest run tests/story.test.ts tests/cloud.test.ts`, `ONLY=hikaye node scripts/audit-menus.cjs`.

**Ayarlar ve erişilebilirlik.** Efekt ve müzik ses düzeyi (`sfxVol`, `musicVol`), Ekran Sarsıntısı (`shake`; tanımsızsa
kapalı: 25 Kasım 2026 kullanıcı kararı, göz yormasın; çizimde `renderer.shakeScale`), Ara Süreler (`splits`; rekor koşunun bayrak
süreleri `splitTimes`, harita sürümüyle), Rahat Mod hızı (`relaxedSpeed` %60-90), tuş atama (`keys`; Esc, P, R sabit).
Oyun kolu titreşimi `haptic()` içinde (`vibrationActuator`). **Kolaylıklar** (Ayarlar → Kolaylıklar, cihaz ayarı: buluta gitmez, fizik değişmez): hayalet görünürlüğü (`ghostAlpha`), kamera yakınlığı (`camZoom` → `renderer.userZoom`), sarsıntı şiddeti (`shakePower`), titreşim yoğunluğu (`hapticPower` → `setHapticScale`), Dash Göstergesi (`dashMeter`), Basılı Tut Zıplama (`holdJump`: yalnız girdi, yere inişte `jumpPressed`), Büyük Yazı (`bigText`, panel `zoom`). **Renk körü paleti** (Ayarlar → Kolaylıklar, `save.colorBlind`: yok / kırmızı-yeşil / mavi-sarı; cihaz ayarı, yalnız çizim): `game/colorBlind.ts` `cbc(hex)` kritik renkleri (diken, tehlike, düşman halesi, A/B blok ve plaka, nefes ve boss süre uyarıları, ok tuzağı) Okabe-Ito tabanlı güvenli renge çevirir, mod kapalıyken tek karşılaştırma; süzgeç ya da katman yok. Renge ikinci işaret: blokta daire (A) / üçgen (B), öldüren suda çizgili yüzey, diken ucunda açık nokta, kalın düşman halesi, madalya rozetinde 1-2-3 (`.cb-mark`); arayüz `:root[data-cb]` CSS değişkenleri. Önizleme `components/CbPreview.tsx`. Yeni kritik renk eklersen `cbc` ile sar, tabloya yaz ve `tests/colorBlind.test.ts` çiftine ekle (Machado simülasyonunda ΔE ≥ 30). `CB=kirmizi-yesil node scripts/verify-perf.cjs` ile ölç. Tuş ipuçları ve rehber atanan tuşu gösterir.

**Bölüm Düzenleyici.** `/duzenle`: harita kodu `lib/customLevel.ts` (simge ve şehir sırası kodun parçası: yalnız sona ekle).
Sürüm 3 kod metin bölümü taşır: tabela (`?`) ve şehir insanı (`n`) sözleri ve boss seçimi (`Q`, hangi şehrin boss'u: `LevelDef.bossOf`);
metinler kaba söz süzgecinden geçer. Hazır parçalar ve şablonlar `lib/editorKit.ts` (her biri düz zeminde çözücüyle biter, test bekler).
Sürüm 1 (5 bit simge, ilk 25 simge, 320 sütun) eski bağlantılar için kalır ve ona sığan harita bugün de sürüm 1 kodlanır
(yayındaki yinelenen harita yakalanır); yeni simgeli ya da 600 sütuna dek geniş harita sürüm 2 (6 bit simge). Şablon ve
hazır parça `lib/editorKit.ts`; her biri `tests/editorKit.test.ts`te çözücüyle bitmeli. Oyunda `?ozel=<kod>` ilerlemeye,
rekorlara ve deftere (pul, nazar) dokunmaz. Boss Tasarımcısı (Boss sekmesi) aynı JSON'a isteğe bağlı `b2` (ikinci boss,
`bossOf2`), `bt` (en az kademe), `bs` (hız yüzdesi, `BOSS_SPEEDS`), `bh` (fazladan can, `bossBoost.hp`) yazar; anahtarı olmayan
eski kod aynen açılır ve aynı kodu verir (`tests/customLevel.test.ts`). Çözücü iki boss'u da yok sayar (`w.boss2 = null`).
Uyarılar (`mapNotes`: havadaki başlangıç, 75 karoyu aşan bayrak aralığı, kapısız boss…) kodlamayı engellemez. Ekran tek bakışta
sığar: geniş ekranda palet | ızgara | sekmeli panel, dar ekranda Karolar panelin ilk sekmesi; ızgara kutuya sığacak yakınlıkta açılır.
Izgara iki katman: alt katman `components/editorScene.ts` (Oyun görünüşü: şehrin gökyüzü ve parallax katmanları, oyunun zemini
`TerrainHD`, nesne ve canlılar `enemyDraw`/`heroDraw`/`bossDraw` çizimleri, ölçek başına önbellekte; hareketli karolar sade. Şema
görünüşü sade karolar), üst katman imleç, fırça/kova/dikdörtgen hayaleti, seçim, uyarı üçgenleri, çözücünün yolu (turkuaz,
`solve.worker.ts` `trail`) ve son denemenin izi (altın, düşülen yer çarpı). Düzenlemede zemin baştan çizilmez: `TerrainHD.adopt`
değişen karolara uzak hücreleri devralır; sürükleyerek boyarken zemin bırakınca yenilenir. Hızlı Deneme `components/EditorPlay.tsx`:
ızgaranın yerinde oyunun kendisi (Renderer + World, Esc döner, R baştan; Enter baştan, Shift+Enter ya da "Buradan Oyna" seçilen
karodan). Kısayollar kartı `?` (Tabela'nın tuşu yok), karo arama `/`, son kullanılanlar şeridi, Ctrl+tekerlek yakınlık, boşluk +
sürükle kaydırma, Shift+H/V/R seçimi çevir ve döndür (`flipRowsV`, `rotateRows`). İlk açılışta "İlk Adımlar" kartı.

**Hayalete karşı yarış.** Rekor koşunun hayaleti sunucuya da yüklenir (`seksek_ghosts`, oyuncu + şehir başına tek satır; yalnız
skor tablosundaki süreyle eşleşen ve haritanın bugünkü sürümünde koşulmuş olan). Skor tablosunun Şehirler sekmesinde açılmış şehirde
"◌ Yarış" o yolcunun hayaletini indirir; geçmek `ghostBeaten` başarımı.

**Başarımlar.** `lib/achievements.ts`: yeni başarım kayıttan hesaplanabiliyorsa `progress` yaz; bir anda olan şeyse `Feat`e ekle ve
`Game.tsx` `addFeat` ile yaz. Ad ve açıklamanın İngilizcesi `lib/ui.en.ts`te. Bildirim kayıttaki `ach`te olmayanlar için bir kez çıkar.

**Yeni mod.** Modlar (`components/Modes.tsx`) ilerlemeye ve şehir rekoruna dokunmaz: `Game.tsx` `modeRef` (günlük, düello)
ya da `rushRef` (Boss Rush, Maraton) doluyken `finish()` kendi dalına gider. Kurallar ve skor saf işlev olarak
`lib/extras.ts`te, testi `tests/extras.test.ts`te.

**Veritabanı değişikliği.** Yeni tablo ya da sütun `drizzle/NNNN_*.sql` (idempotent: `IF NOT EXISTS`) + `lib/schema.ts`;
canlıya her dağıtımda kendiliğinden uygulanır (`vercel-build`: `scripts/migrate.ts --derleme`; DATABASE_URL Vercel'de
"sensitive", dışarıdan okunamaz, derleme ortamında vardır). Göç için kullanıcıya sorma (kullanıcı kararı, 15 Kasım 2026);
derleme günlüğünde `uygulandı:` satırlarına bak. Elle: `npm run db:migrate` (DATABASE_URL gerekir). Kod, tablo henüz yokken sessizce yerel kayda düşmeli.

**Metin eklemek.** Arayüzde Türkçe metni `t('…')` ile yaz, İngilizcesini `lib/ui.en.ts`’e ekle. Bölüm metni
`levels.ts`’e, İngilizcesi `content.en.ts`’e. Başlık ve düğmeler Title Case, paragraflar cümle düzeni; tek kelimelik
yetim satır bırakma.

**Meydan yolu değiştirmek.** `game/finales/<id>.ts` → `npx tsx scripts/verify-prelude.ts <id> --goster` (OK demeli) →
`npx tsx scripts/verify-levels.ts <id>`. Yasak karakterler: `C K $ D P E @ & Q G`; tam bir `!` olmalı.

**Boss değiştirmek.** `game/boss.ts` (BOSSES: can, hareket sırası, hız; BOSS: süreler) → `npx tsx scripts/bossbot.ts <id>`
(bot ve zayıf oyuncu botu yenmeli). Çizimi `game/bossDraw.ts`. Kural her şehirde aynı kalsın: işaret → saldırı → yorgunluk → üstüne bas.
Zorluk kademeyle gelir (`BossDef.tier`; ayrıntı `.claude/rules/boss.md`): Kolay şehirlerin boss'u kademe 1, Orta 2, Zor ve
Çok Zor 3 (16 Kasım 2026: boss'lar zorlaştı, yorgunluk kısaldı); kademe 2-3 boss'lar öngörülü nişan alır, dört kez sıçrar/atar, inişte şok dalgası
yollar, Çok Zor'da duvardan sekip yeniden toslar, iki kez dalar, sahte kabarır. Can artırmak zorluk değildir.

## Tasarım tuzakları (öğrenilmiş)

- Platformun yerden yüksekliği **en çok 32 piksel** (2 karo) olsun; 48 piksel zıplama sınırıdır, oyuncu çoğu zaman tutturamaz.
- Oyuncu her duvara tırmanabilir: bir alanı kapatan duvar haritanın en üst satırına kadar çıkmalı.
  Tepeye dayanan duvar göğe kadar katıdır; haritanın `SKY_ROWS` (4) karo üstü tavandır (`sim.ts` `tile`): duvar dibinde
  sekerek ekranın dışına tırmanılmaz. Kamera bu gök payını gösterir, zemin çizimi tepeye dayanan sütunu ekranın üstüne
  dek sürdürür (`terrainDraw.ts` `drawAbove`): duvar "üstünden aşılır" gibi kesik görünmez.
- Alçak tavanlı koridorda zıplama kısalır; dikenli çukur 2 karoyu geçmesin.
- **Rüzgâr gerçek kuvvettir** (`LevelDef.wind`, `sim.ts` `PHYS.windAir` / `windGround`): havadaki hedef hızı kaydırır, yerde
  yalnız yürürken; dururken itmez. Bayburt'un karşı rüzgârında atlayış ~0,75 karo kısalır. Esinti ~5,7 sn'de güçlenip
  zayıflar: rüzgâra karşı atlayış en zayıf esintide de zayıf oyuncuya yetmeli. Rüzgârlı şehre dokununca
  `audit-difficulty` koş. (14 Kasım'a dek rüzgâr hıza eklenip hedefe kırpılıyor, neredeyse hiç hissedilmiyordu.)
- İkinci defterin lejantı: `L` halat (havadayken değince tutunulur; ↑↓ tırmanılır, zıplayınca bırakılır, zıplayıp yeniden
  yakalayarak da tırmanılır), `R` teleferik halatı (altından zıplayınca asılınır, ←→ elle ilerlenir, zıplayınca ya da ↓ ile
  düz aşağı bırakılır), `W` derin su (yüzülür: zıplama kulaç, yüzeyde kulaç sudan çıkarır; boğulma yok). Öldüren `~` ile
  karışmasın diye `W` açık turkuaz çizilir. Çözücü asılı ve yüzen durumları da dal sayar (`tests/mechanics.test.ts`).
  Teleferiğin bittiği yer güvenli zeminin üstünde olsun: bırakınca düz aşağı inilir.
- `A` gelgit suyu (Mersin; `sim.ts` TIDE, TIDE_CYCLE): saate bağlı 8 sn'lik döngü (2,6 sn yüksek, 1,4 sn iner, 2,6 sn alçak,
  1,4 sn yükselir; aynalı haritada da aynı). Birbirine değen `A` kareleri bir havuzdur, suyu düz durur: yüksekte en üst karesine
  dek dolar (derin su `W` gibi yüzülür, nefes kuralı geçerli), alçakta tamamen çekilir (boş hava; kalıcı su gerekirse altına `W`).
  `tile()` karonun o anki hâlini verir (SWIM ya da EMPTY), ham hâli `isTide()`. Havuzun üstü kıyıyla aynı hizada olsun
  (yoksa su havada asılı durur). İki yönlü kullan: yüksek suda yüzeyden sıçrayarak yüksek taşa (yalnız suyla erişilen taş
  duvardan en az 8 karo uzak olsun: her duvar tırmanılır), alçak suda dipten ve mağara ağzından yürü (yüksekte dalınır).
  Dipte duran oyuncu boğulmaz: su altı süresi (~3,8 sn) nefesten kısa. Uyarı: değişimden 0,9 sn önce varılacak çizgide köpük
  yanıp söner (render `drawTide`, saat ara değerlenir) ve havuza 14 karo yakın oyuncuya ses (`tideUp` / `tideDown`). Düzenleyicide
  de karo (`A`). Mersin bütün Sinir Bozucu fiziklerinde kanıtlı (RAGE_PROVEN); Kovalamaca'da köpek gelgit havuzunun başında bekler. Çözücü yakındaki gelgitin evresini durum sayar; geniş havuz aramayı
  yavaşlatır, havuzu dar tut.
- `{` `}` ritim blokları (`sim.ts` RHYTHM): saate bağlı iki takım, 1,6 sn'de bir yer değiştirir, kaybolmadan 0,45 sn önce yanıp söner;
  belirecek blok oyuncunun içindeyse oyuncu çıkana dek boş kalır (`rhythmHold`). Çözücü yakındaki ritim evresini durum sayar.
  Tam zamanında yay: yaya inerken zıplama basılıysa (tampon) sekiş ×1,22 (`PERFECT_SPRING`); yalnız isteğe bağlı kestirme.
- `V` yükselen hava (Balıkesir; `sim.ts` LIFT, THERMAL): fizikte boşluk; gövdesinin ortası içinde olan oyuncu yerçekimi yerine
  yukarı itilir (en çok 170 px/sn), sütunun tepesinde asılı kalır, oradan yana atlar; aşağı basan iner (çözücü aşağı basmaz:
  yana çıkar). Termalin en üst `V` satırı, inilecek taşın üstündeki yürüme satırından en az bir satır yukarıda olsun
  (`tests/mechanics.test.ts` "yükselen hava"). Termalde dash yenilenmez. Çözücü termalin içinde de dallanır (`p.lift`);
  köpek termalin çevresinde oturur. Çizimi `render.ts` `drawLift` (yukarı akan çizgiler, tüy ve yaprak, dalgalı tepe).
- `Z` donan su (Elazığ; `sim.ts` FROST, FROST_CYCLE): saate bağlı, saat 0'da buz; 2,4 sn buz (ICE: katı, kaygan), 2,4 sn derin su
  (yüzülür, nefes kuralı). Bütün `Z` aynı anda döner; değişmeden 0,7 sn önce buz çatlar, su kırağılanır (`drawFrost`), yakındaki
  oyuncuya ses (`freeze` / `thaw`). Donma anında oyuncunun içindeki karo çıkana dek su kalır (`frostHold`). Buz altında en çok
  2,4 sn beklenir (nefesten kısa). `tile()` karonun o anki hâlini verir, ham hâli `isFrost()`; zemin önbelleğine girmez
  (`terrainDraw.ts` `tileOf`). Hatıra, pul, nazarı `Z`nin içine koyma (W ya da hava). Çözücü yakındaki evreyi durum sayar.
- Derin suda nefes (`sim.ts` AIR, 6 sn): başı `W` içindeyken azalır, sudan çıkınca dolar, biterse boğulur (`drown` olayı).
  Son üç saniyede her saniye `breath` olayı (ses, titreşim, kabarcık, ilkinde "yüzeye çık" sözü); başın üstünde kabarcık
  simgeli çubuk (son 2,5 sn kırmızı, içinde kalan saniye, ekran kenarı mavi nabız: `render.ts` `drawBreath`); boğulunca
  düşüş sözü yerine nedeni yazar. Yüzme pozu kurbağalama döngüsü (`heroDraw.ts` `swimStroke`, föyde "kulaç"). Havasız su tüneli zayıf oyuncu için ~2,5 sn'yi geçmesin; suya dokunan haritada
  verify-levels / respawn / items koş.
- `"` havuz teyzesi (Afyon'un termal oteli; `sim.ts` AUNT, `auntFacing`, `auntSees`): karesi derin sudur. Saate bağlı 2,8 sn'de bir
  döner, dönmeden 0,7 sn önce "Hı?" balonu (render `auntBubble`). Baktığı yönde 9 karo içinde, ±3 karo yükseklikte, arada katı
  karo yoksa ve oyuncunun başı su üstündeyse görür: "Aaaa!" (`shriek` olayı) diye bağırıp oyuncunun durduğu yere kavisli havlu fırlatır
  (`AUNT.towel`, 185 px/sn, öngörüsüz: koşan, zıplayan ya da dalan kaçar; havlu suya değince söner), 0,9 sn soluklanır
  (24 Kasım 2026: kullanıcı isteğiyle zorlaştı; görüş 6 → 9 karo). Havlu değen bayraktan
  doğar; teyzeye değen de yakalanır, ezilmez.
  Güvenli cevaplar: sırtı dönükken geç, araya katı bir şey al, dal, havluyu görünce kaç. Her teyzenin yanından geçmek için ~1,5 sn'lik pencere ya da dalış yolu bırak.
- `+` yüzen ada (Bingöl; `sim.ts` SINK, Platform axis `f`): bir satırdaki bitişik `+` tek adadır, gölün yüzünde yüzer (altındaki satır
  `W` ise adanın karoları da sudur: göl adayla aynı satırdadır). Üstünde durana 11 px/sn batar, 11 px batınca (~1 sn) gömülür:
  1,5 sn üstüne basılmaz (oyuncu suya düşer), sonra çıkar; kısa basıp geçen batırmaz. Altına mutlaka `W` (öldüren `~` değil),
  zincirde arada nefes taşı. Çözücü batma hâlini durum sayar; çizimi `render.ts` `drawIsland` (su örtüsü adanın karesine çizilmez).
- Suda yüzen düşmanlar (karesi derin su sayılır): `y` Esoli (köpekbalığı: devriye → yüzeni görünce titreyip uyarır → hamle →
  soluklanır; ezilmez, kaçılır), `U` pirana (±2,5 karo gidip gelir; basılır, dash'le vurulur).
- Van'ın öldüren sularında gölün canavarı yüzer (`render.ts` drawLakeMonster): süs, zararsız; su katmanı alt yarısını örter.
- `T` nitro tüpü (`sim.ts` NITRO): alınınca 3 sn hızlı koşu (×1,55; atlayış hızla uzar), 4 sn'de yeniden dolar. Yalnız isteğe bağlı
  kestirme olarak kullan: zorunlu yolu nitroya bağlama (zayıf oyuncu kaçırabilir). Çözücü nitroyu durum sayar.
- Yeni lejant: `i` ıslak taş (kaygan), `p` itilen sandık (çözücü sandık konumunu da durum sayar: az ve yerel kullan).
  Plaka ve renkli bloklar şehre göre başka görünebilir (`render.ts` SWITCH_SKIN: Bursa gölge, Van gece/gündüz); kural değişmez.
- Sandıklı bölümde gizli hedef (pul, nazar) ileri yolun üstünde dursun: geride kalan hedef çözücünün bütçesini yakar. Şehir başına en çok iki
  sandık, her biri birkaç karoluk kapalı alanda; plakaya yalnız oyuncu basar, sandık basmaz.
- Dost hayvan ile düşman aynı tür olmasın (kedi dostsa düşman kedi olmaz). Düşmanlar kırmızı hatla parlar.
  Şehre özgü düşman: Ordu saksağanı (`j`), dalda tüner, altından geçene uyarıp dalar.
- Konuşma ve tabela sözü ekranın altına kutu olarak değil, konuşanın başının üstüne baloncuk olarak çizilir (karakteri kapatmaz).
  Tabela balonu ahşap tabela görünümünde, "Tabela" başlıklı; uzun söz cümle cümle numaralı adımlara bölünür, yapılacak eylem
  (iki noktadan sonrası, ünlemle biten cümle) kalın ve altın renkli (`render.ts` `drawDialog`, 25 Kasım 2026). Şehir insanının adı renkli etikette.
  Oynanış sırasında çıkan yazılar (bayrak sözü, ölüm lafı) üstte HUD'ın altında, küçük ve soluk durur; oynanış alanına girmez.
- **Renk (Alacakaranlık teması).** Tokenlar `app/globals.css` `@theme`: koyu zeminde yazı ve çizgi için `accent` / `accent-2`
  (açık çivit, en az 4.5:1), dolu düğme zemini için `accent-deep` ve üstünde beyaz yazı. Mavi üstüne koyu yazı yazılmaz.
  Amblem renkleri `scripts/art/emblem.ts`; değişince `node scripts/art/icons.cjs --og`.
- **Yazı dili.** Başlıklar Grandstander, gövde Figtree (`app/layout.tsx` `--font-title` / `--font-body`; tuvalde
  `render.ts` popFont / textFont; kartpostalda `assets/fonts/*.ttf`). Piksel font kullanılmaz: küçük boyda yoruyor,
  2/5/8 karışıyordu. Yeni bir yazı ailesi denersen Türkçe harflere (İ ı Ğ Ş) ve rakamlara (süre, plaka, skor) bak.
  Tailwind'de `font-display` başlık, `font-mono` gövdedir (adı tarihsel; eş aralıklı değil).
- Kullanıcı adı çekim eki almaz ("Ahmet’te" / "Uktun’da" ünlü uyumu tutmaz): "Sıra Sende, {name}" gibi kur.
- Baş payı: yürünen her aralık en az 2 karo yüksek olur (gövde 26 px çizilir). Diken tarlasının üstündeki basamak da
  sayılır: tarlayı bir karo göm. `npx tsx scripts/audit-clearance.ts` ve `tests/sim.test.ts` "alçak koridorlar" bekler.
- Ölçüm ve görsel betikleri `?debug` ile açar: güncelleme notu o zaman çıkmaz (ekranı kapatıp tıklamaları yutmasın).
- Satır kırma: başlık ve düğmeler `text-wrap: balance`, paragraflar `pretty` (globals.css); bölünmemesi gereken kısa
  parçaya `.nowrap`.
- **Geri düğmesi** `pixel-btn back-btn` + `data-back`: turkuaz, en az 44 px, klavyeli cihazda "Esc" ipucu; menülerde Esc
  ekrandaki son görünen `data-back` düğmesine basar (Game.tsx; oyun, mola, fotoğraf, Co-op, yarışta Esc moladır).
  Yeni ekranın Geri düğmesine ikisini de ver. Alt gezinme (← Ayarlar, ← Mola) yalnız `back-btn`.
- **Menülerde sayfa kaymaz, panelden taşma olmaz.** Her ekran masaüstünde (1280×720, 1512×860), ara boyda (1024×640: 900-1023 piksel
  genişlik "wide" sayılır ama `lg` değildir; Modlar orada iki sütun) ve telefonda (dikey 390×664, yatay 750×342) tek bakışta sığar;
  hiçbir düğme, rozet ya da yazı panelin yan kenarından taşmaz (denetim bunu da ölçer, kayan kabın içi sayılmaz). Rozet ada sığmıyorsa
  köşede etiket olur (`.tile-badge`); panel ve ana menünün fotoğrafı ekranın yan kenarından taşmaz (fotoğraf yalnız 1220 px+); 700 pikselden alçak geniş ekranda ikincil bilgi gizlenir (`wide:[@media(max-height:700px)]:hidden`). Uzun liste (şehirler, defter, skor, bölüm sonu) panelin içinde kendi alanında kayar; panel ekran boyunu geçmez.
  Kanıtı `node scripts/audit-menus.cjs` (sunucu açıkken, `PORT=`; `ONLY=` ekran, `SIZE=orta,dikey` boyut süzer): her menü beş boyutta açılır, taşan hücre FAIL verir;
  yeni ekran eklersen betikteki SCREENS listesine yaz.
  Düzen değişkenleri `app/globals.css`te: `wide` (geniş ve yüksek), `short` (alçak, yatay telefon), `side` (ikisinde de yan yana).
- Düğme durumu bayrakla birlikte saklanır, ölünce o hale dönülür; meydan kapısından geçince sıfırlanır. Bulmacayı buna göre kur.
- Çözücü "aşağı" tuşuna basmaz: tek yönlü platformdan aşağı inişe dayanan yol doğrulanamaz, çatlak taş (X) kullan.
- Tünel ağzı (`%`) ve yürünen her geçit en az **2 karo** yüksek olur: gövde 26 px çizilir, 1 karoluk aralığa yürüyerek girmek
  duvarın içinden geçmek gibi görünür (`tests/sim.test.ts` "tünel ağızları" bekler). Kaya 2 karoysa tavanı bir kademe yükselt.
- Gizli köşe görünmez olmaz: hatıra, pul, nazar ve anahtar ya açıkta ya da görünür bir girişin ardındadır (tünel ağzı `%`
  karanlık aralık olarak çizilir; çatlak taş `X`; plakayla açılan kapı). Tabela ve şehir insanı girişi doğru tarif eder
  ("üstüne atla" deniyorsa üstüne atlayan alır). Her şeyi zayıf oyuncu alabilmeli ve aldığı yerden çıkışa varabilmeli
  (kapan yok): `npx tsx scripts/verify-items.ts <id>`.
- Toplanan şeyler çizilen gövdeye değince alınır (`sim.ts` reach: 26 px boy); fizik ve tehlikeler 14 px kutuyla kalır.
  Omuz hizası yürüyerek alınır, bir kademe (2 karo) ve yukarısı zıplayarak. Gökyüzünde dayanaksız şey olmaz: her şey
  bir zeminin, tahtanın, hareketli platform yolunun, yayın, sandığın ya da duvarın zıplama menzilinde (3 karo yan,
  4 karo yukarı): `npx tsx scripts/audit-reach.ts <id>`.
- Art arda iki raylı platform (`M`) arasında atlanacaksa gidip gelme aralıkları **eşit**, başlangıçları **ters fazda** olsun
  (alttaki en solda, üstteki en sağda): buluşma her turda düzenli gelir. Aralıklar farklıysa platformlar zamanla kayar,
  oyuncu 30 saniye bekler (test bekler: en çok 9 sn).
- Ok, katı bir karoya çarpana dek uçar: ok tuzağının hattında bayrak, tabela, şehir insanı ya da başlangıç olmasın
  (test bekler); gerekiyorsa araya oku durduran bir taş koy.
- `audit-difficulty` zayıf oyuncu takılırsa çıkış kodu 1 verir; Malatya'da bu yüzden bir diken tarlası gözden kaçmıştı.
- Boss ve düşmanlar çözücüde yoktur (zamanlama engeli); boss’un yenilebilirliğini `tests/boss.test.ts` kanıtlar.
- Çözücü (`verify-levels`) yavaşsa önce haritayı sadeleştir: dönen platformlar ve tokmaklar durum sayısını katlar.
- Her yaştan oyuncu düşün: bayraklar arası **en çok 75 karo** (test bekler), boşluklar 3 karoyu geçmesin; "dash + dash halkası + dash"
  zinciri isteğe bağlı kestirme olsun, zorunlu yol olmasın. Değişiklikten sonra `npx tsx scripts/audit-difficulty.ts <id>`:
  zayıf oyuncu (zıplama ~%10 alçak, koşu %8 yavaş) geçebilmeli.

## Akıcılık (kalıcı kural)

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

## Yayın

`main`e push → Vercel otomatik derler (proje `sek-sek`). Push’tan sonra dağıtımın READY olduğunu ve
https://sek-sek.vercel.app’in açıldığını kontrol et. PR yalnızca istenirse açılır.
