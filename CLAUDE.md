# Sek-Sek · Claude için çalışma rehberi

Türkiye şehirlerini iki defterde (ilk defter 30 şehir, gerisi ikinci defter) gezen platform oyunu (el boyaması görünüm: boyalı arka plan, sıcak sinematik ışık, yumuşak hacimli vektör karakter ve zemin; davulsuz sakin müzik ve doğa sesi). Next.js 16 + React 19.2 + Tailwind v4, kendi canvas motoru,
Neon/Drizzle skor tablosu, Vercel’de `main`den otomatik yayın: https://sek-sek.vercel.app

Bu dosya oyunu “vibe coding” ile geliştirirken hızlı ve güvenli kalmak içindir: önce burayı oku, sonra koda dokun.
Her oturumda yüklenen kısa haritadır; konuların ayrıntısı `.claude/rules/` altındadır ve ilgili dosyalar okununca kendiliğinden yüklenir
(aşağıda "Konu kuralları"). Ayrıntılı dosya haritası: `.claude/proje-haritasi.md`.

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

## Proje haritası (kısa; uzunu `.claude/proje-haritasi.md`)

```text
game/          DOM'suz oyun çekirdeği (testlenebilir)
  sim.ts       fizik + dünya: zıplama, duvar, dash, düşmanlar, bulmaca nesneleri ve şehir mekanikleri (TIDE, LIFT, FROST, AUNT, SINK…)
  levels.ts    bütün bölümler (ASCII, 24 satır; `FIRST_BOOK`'tan sonrası ikinci defter) + şehir metinleri; extend, addSignature, addFinale, bossLevel
  cities/      yeni şehirlerin ana yolu (şehir başına dosya) · finales/ meydan yolu + arena · extensions.ts, signatures.ts eski şehirlerin ek parçaları
  boss.ts      boss tanımı ve durum makinesi · bossLines.ts lafları · bossDraw.ts çizimi
  art.ts       şehir paletleri ve arka plan katmanları · atmosphere.ts ışık, bulut, süzülenler · render.ts çizici · camera.ts kamera
  terrainDraw.ts zemin · heroDraw.ts karakterler · enemyDraw.ts düşman, hatıra, nesne · portraitDraw.ts portreler
  audio.ts, music.ts, ambience.ts  ses (tek beste, şehir makamı, doğa sesi) · content.en.ts bölüm metinlerinin İngilizcesi
  challenges.ts, puzzles/, rageCourses.ts, mirror.ts  mücadeleler, Usta/Efsane/Öfke Parkurları, Ayna Yolu
  looks.ts, accessories.ts, stance.ts  Mağaza · stories/ Hikâye Gezisi diyalogları · medals.ts madalya süreleri
components/    React arayüzü (Game bütün ekranlar; Modes, ScoreBoard, Shop, Editor, Coop, Race, Defter, TitleMenu…)
lib/           kayıt (storage, cloud), skor (scoreKey, antiCheat, points, rateLimit), kurallar (extras, modeHints), düzenleyici kodu (customLevel, editorKit), i18n + ui.en
app/           / oyun · /duzenle · /hakkinda · /oyuncu/[ad] · /sehir/[id] · /haritalar · /skor · /api/*
scripts/       new-city (yeni şehir iskeleti) · city-check · check-text · verify-* ve audit-* doğrulama botları · preview.cjs · art/ görsel üreteçleri
tests/         vitest: sim, mechanics, boss, camera, perf, cloud, scores, story, extras, courses, antiCheat…
```

## Ajanla çalışma

Bu oyun ajanla geliştiriliyor; her iş için hazır bir yol var. Yeni bir araç ya da kural öğrendiğinde buraya ve ilgili dosyaya yaz.

| İş | Nereden |
|---|---|
| Yeni şehir | `/yeni-sehir <ad>` yeteneği · iskelet tek komut: `npx tsx scripts/new-city.ts <id> --zorluk Orta` (TASLAK değerlerle her kayıt) · denetim `npx tsx scripts/city-check.ts <id>` ve `npx tsx scripts/check-text.ts <id>` |
| Yeni mekanik / karo | `/yeni-mekanik` yeteneği (sim, çözücü, çizim, ses, düzenleyici, test, doğrulama botları); yeni şehirden **önce** |
| Yeni mod | `/yeni-mod` yeteneği (saf mantık + test, Modlar kutucuğu, oyun akışı, sıralama, menü denetimi) |
| Yeni Usta / Efsane Parkuru | `/yeni-parkur` yeteneği (harita, `verify-challenges`, `par`, kilit, `tests/courses.test.ts`) |
| Var olan şehre parça | `/yeni-parca` yeteneği (harita değişince madalya, mücadele, kural listeleri, ayna) |
| Bitince canlıya | `/yayinla` yeteneği (doğrula → tek commit → main → Vercel READY → canlı sayfa) |
| Harita, bulmaca, zorluk | `level-designer` ajanı · `.claude/rules/bolumler.md` |
| Karakter, boss, kaplama çizimi | `artist` ajanı · `.claude/rules/cizim.md` |
| Boss davranışı | `.claude/rules/boss.md` |
| Metin, menü, Title Case | `.claude/rules/metin.md` · `.claude/rules/arayuz.md` |
| "Bozuldu mu?" | `/dogrula [şehir]` ya da `verifier` ajanı → `bash scripts/verify-all.sh` |
| "Nasıl duruyor?" | `/onizle <şehir> [yer]` → `scripts/preview.cjs` (oyun içi) · `scripts/art/sheet.cjs` (çizim föyü) |
| Görselden/videodan yeni şehir, mod, kılık | `reference-to-game` skill (`.claude/skills/reference-to-game`, MIT; nereden geldiği ve oyunda nasıl kullanıldığı `KAYNAK.md`) |

Paralel iş: şehirler ayrı dosyalarda durur (`game/cities/`, `game/finales/`), bu yüzden birden çok `level-designer`
aynı anda çalışabilir; ortak dosyalara (`levels.ts`, `render.ts`, `boss.ts`) yalnız ana oturum dokunur. Ajanlar paylaşılan dosyada
`Write` değil `Edit` kullanır. Ajan raporu kanıt değildir: push'tan önce değişen dosyaların son hâlini kendin doğrula (ajan sen
doğrularken dosyayı değiştirmiş olabilir; ara kayıt ajanın yarım dosyasını da alabilir).

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
   Metin harita bittikten sonra haritaya göre gözden geçirilir: metinde geçen mekanik haritada olmalı (`check-text`).

## Harita için en kritik kurallar (tamamı ve mekanik lejantı: `.claude/rules/bolumler.md` "Tasarım tuzakları")

- Platformun yerden yüksekliği **en çok 2 karo** (32 px), boşluk en çok **3 karo**, bayraklar arası en çok **75 karo**; alçak tavanda dikenli çukur ≤ 2 karo.
- Baş payı: yürünen her aralık ve tünel ağzı (`%`) en az **2 karo** yüksek. Alanı kapatan duvar haritanın en üst satırına dek çıkar (her duvar tırmanılır).
- Çözücü "aşağı" basmaz (tek yönlü platformdan iniş yerine çatlak taş `X`); düşman, ok ve boss'u görmez. Yavaşsa haritayı sadeleştir.
- Ok tuzağının hattında bayrak, tabela, kişi, başlangıç olmaz. Raylı platform çiftleri eşit aralık + ters faz.
- Gizli köşe görünür girişli; her şeyi zayıf oyuncu alır ve aldığı yerden çıkışa varır (`verify-items`, `audit-reach`).
- Saate bağlı mekanikler (gelgit, ritim, termal, donan su, yüzen ada, havuz teyzesi) uyarır, kimseyi sıkıştırmaz; su altı süresi nefesten kısa.
- "Dash + dash halkası + dash" zinciri ve nitro yalnız isteğe bağlı kestirme; zorunlu yol olmaz. Dost hayvan ile düşman aynı tür olmaz.

## Akıcılık (kalıcı kural; tamamı `.claude/rules/akicilik.md`)

Oyun her tazeleme hızında (60-240 Hz) ve her çözünürlükte aynı akar. Zamana bağla, kareye değil (`approach`, `spring`, `this.chance(p)`;
kare başına `Math.random()` yok); kare içinde ağır iş yok (zemin önceden, bütçeyle); hareketli her şey ara değerlenir; tuval
`PIXEL_BUDGET`i aşmaz. Kamera, çizim, tuval ya da zemin önbelleğine dokunduysan `tests/camera.test.ts`, `tests/perf.test.ts`,
`verify-frames` ve üretimde `verify-perf` koş.

## Konu kuralları (`.claude/rules/`, ilgili dosya okununca yüklenir)

| Konu | Dosya | İçinde |
|---|---|---|
| Bölüm haritası | `bolumler.md` | lejant, çalışma döngüsü, harita değiştirmek, meydan yolu, madalyalar, ikinci defter, yeni şehir sırası, bütün tasarım tuzakları ve mekanik kuralları |
| Çizim | `cizim.md` | görsel dil, atmosfer, konuşma balonu |
| Boss | `boss.md` | kural, kademe, boss değiştirmek |
| Ses | `ses.md` | düşük kortizol, tek beste, doğa sesi |
| Metin | `metin.md` | TR + EN, Title Case, metin eklemek |
| Arayüz | `arayuz.md` | şehir kartı skor paneli, HeroPicker, sıralama ve profil, Ayarlar ve erişilebilirlik, şehir seçici, sürüm notu, renk ve yazı, Geri düğmesi, menülerde taşma yok |
| Modlar | `modlar.md` | Modlar ekranı, Günlük ve kurallar, Sinir Bozucu ve fizik kuralları, Kovalamaca, mücadeleler, Turnuva, Üçlü, Speedrun, Boss Rush, Ayna Yolu, Gezgin/Sakin Gezi, ustalar, yeni mod |
| Co-op | `coop.md` | Co-op ve işbirliği, Boss Kapışması, Düello |
| Hikâye | `hikaye.md` | Hikâye Gezisi diyalog verisi ve kaydı |
| Mağaza | `magaza.md` | kılık, para, görünüm, duruş |
| Düzenleyici | `duzenleyici.md` | /duzenle, harita kodu, Hızlı Deneme |
| Sunucu | `sunucu.md` | kayıt asla kaybolmaz, harita sürümü, skor tablosu, puan, sıralamalar, arkadaşlar, topluluk haritaları, hile önleme, güvenlik, veritabanı, hayalet, başarımlar |
| Akıcılık | `akicilik.md` | kare hızından bağımsızlık, piksel bütçesi, kamera, dokunmatik, kanıt |
| Yayın | `yayin.md` | çevrimdışı (sw.js), izleme, CI, fonksiyon boyutu |

## Yayın

`main`e push → Vercel otomatik derler (proje `sek-sek`). Push’tan sonra dağıtımın READY olduğunu ve
https://sek-sek.vercel.app’in açıldığını kontrol et. PR yalnızca istenirse açılır.
