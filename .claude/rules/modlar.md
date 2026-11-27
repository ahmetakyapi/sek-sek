---
paths:
  - "components/Modes.tsx"
  - "components/FunModes.tsx"
  - "components/Cark.tsx"
  - "components/Quiz.tsx"
  - "lib/cark.ts"
  - "lib/quiz.ts"
  - "tests/carkQuiz.test.ts"
  - "components/Challenges.tsx"
  - "components/Tournament.tsx"
  - "components/Mirror.tsx"
  - "components/RuleArt.tsx"
  - "components/Ending.tsx"
  - "lib/modeHints.ts"
  - "lib/extras.ts"
  - "lib/ustalar.ts"
  - "game/challenges.ts"
  - "game/rageCourses.ts"
  - "game/puzzles/**"
  - "game/mirror.ts"
  - "scripts/verify-rage.ts"
  - "scripts/verify-rules.ts"
  - "scripts/verify-chase.ts"
  - "scripts/verify-rush.ts"
  - "scripts/verify-challenges.ts"
  - "scripts/verify-mirror.ts"
  - "tests/extras.test.ts"
  - "tests/courses.test.ts"
---

# Modlar, kurallar, mücadeleler

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

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

**Öfke Parkurları.** `game/rageCourses.ts` RAGE_COURSES: elle çizilmiş uzun, çok zor parkurlar (mücadele altyapısı: `Challenge.map`,
madalya `gold`dan (`fast-time`), skor `mucadele:<id>`, ALL_CHALLENGES ile aranır; turnuvaya girmez). Modlar → Sinir Bozucu → Parkurlar.
`level` görünüşü veren şehirdir, parkur o şehir bitince açılır. Kanıt `npx tsx scripts/verify-challenges.ts`.

**Mücadele haritaları.** `game/challenges.ts` CHALLENGES: şehir + bayrak aralığı (`from`, `to`) + `par` (çözücünün süresi).
Harita şehirden kesildiği için şehir haritası değişince kesit de değişir: Zor şehre dokununca `npx tsx scripts/verify-challenges.ts`
koş, süre çok oynadıysa `par`ı güncelle. **Madalya** (26 Kasım 2026, elden geçti): `par` çözücünün *ilk bulduğu* yolun süresidir, en hızlısı değil (parkurdan parkura
gerçek hızlı koşunun 1,2-2 katı); madalya ona dayanmaz. Altın = en hızlı makro süresi × 1,15, yukarı yuvarlanır:
`npx tsx scripts/fast-time.ts <id>` (çözücünün makrolarıyla süreye göre A* arama, `solve` `order: 'time'`; büyük parkurda
`BUDGET=40000`, bütçe dolarsa "bütçe" yazar; varamazsa `SPEED=120` dene: daha hızlı ama en iyi süreyi kaçırabilir; sandıklı ve
raylı büyük parkurda o da yetmeyebilir, o zaman `gold` yazılmaz) → `gold` alanı. Yol düşman ya da okla ölüyorsa (`yol N kez ölür`)
gerçek koşu beklemek zorundadır: × 1,3 kullan. Ölçülmüş bir insan koşusu (× 1,08) bundan sıkıysa o korunur, ama `par`ın
0,6'sından küçük elle değer şüphelidir. Altın hile önleme alt sınırının (`minTimeMs`) en az 1,3 katı (`tests/courses.test.ts`).
`gold` yoksa `goldOf` (kesit ve Usta Parkuru `par` × 0,85, Öfke Parkuru `par`); gümüş altın × 1,5, bronz × 2,2 (`challengeMedals`). **Efsane Parkurları** (26 Kasım 2026, yeni kademe): `game/puzzles/efsane.ts`, `tier: 'efsane'`, listenin sonunda kendi başlığıyla; görünüş şehri + `LEGEND_UNLOCK` (3) Usta Parkuru bitince açılır (`courseOpen`), altın `fast-time` × 1,15. Yeni parkur yolu `/yeni-parkur`. **Usta Parkurları** `game/puzzles/` (zamanlama.ts, bulmaca.ts, doga.ts → `MASTER_COURSES`):
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

**Speedrun.** %100 (üç hatıra + pul + nazar aynı koşuda; `save.full`, skor `yuzde:<şehir>`), Tam Tur ve Ayna Tam Tur
(ilk defterin şehirleri arka arkaya, `rushRef` kind `tur`/`aynaTur`; skor `tur`/`aynatur`, üst sınır 12 saat). Hile önleme
alt sınırı şehrin ya da otuz şehrin toplamının fiziksel en kısa süresi. Skor Tablosu → Speedrun sekmesi. Genel sıralamaya
ve toplu aktarıma girmez (`tests/scores.test.ts`).

**Şehir ustaları.** Her şehrin ilk şehir insanı ustadır; görev `lib/ustalar.ts` (`ustaTask(sıra)` beş türden döner, art arda
aynı olmaz): üç hatıra aynı koşuda, düşmeden, altın madalya, pul + nazar aynı koşuda, boss'u düşmeden. Görev koşu sonucundan
doğrulanır (Rahat Mod sayılmaz), mühür `save.ustalar`; Mağaza'da para sayılır. Şehir kartında görünür. Yeni şehrin
ilk kişisi esnaf olsun (usta o).

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

**Ayna Yolu ve final.** Otuz şehir bitince final sahnesi (`Ending`) ve Ayna Yolu açılır. Ayna haritası şehirden üretilir;
sim'in sağ-sol simetrisi bozulursa (yeni nesne, x'e bağlı faz) `mirror` kipinde de düzelt, sonra `verify-mirror` ve
`AYNA=1 bossbot` koş. Çözücü Ayna Yolu'nda sola doğru arar (`mx`). Rekor `save.ayna`.

**Gezgin Turu ve Sakin Gezi (21 Kasım 2026).** `components/FunModes.tsx`. Gezgin Turu: `lib/extras.ts` `gezginFor(tohum, 3|4|5)` her tohumdan aynı
kesit dizisini çıkarır (Mücadeleler'den, aynı şehirden ikisi yok); kesitler `startChallenge` yoluyla koşulur (`gezginRef`), hepsi bitince toplam
`save.gezgin[gezginKey]` rekoru olur (bulutla birleşir, küçük olan kazanır). Sunucu sıralaması yok (kesitlerin kendi sıralaması var). Sakin Gezi:
`LevelDef.calm` + `customRef` yolu: düşüş sayılmaz (`kill()` 0,3 sn sonra son bayrakta doğurur), ilerlemeye, rekora ve deftere dokunmaz, çıkışta
Modlar'a dönülür. İkisi `lib/modeHints.ts` kataloğunda (`gezgin`, `calm`) ve `scripts/audit-menus.cjs` SCREENS'te.

**Yeni mod.** Modlar (`components/Modes.tsx`) ilerlemeye ve şehir rekoruna dokunmaz: `Game.tsx` `modeRef` (günlük, düello)
ya da `rushRef` (Boss Rush, Maraton) doluyken `finish()` kendi dalına gider. Kurallar ve skor saf işlev olarak
`lib/extras.ts`te, testi `tests/extras.test.ts`te.

**Çarkıfelek ve Defter Bilmecesi (27 Kasım 2026).** İkisi de saf mantık + test (`lib/cark.ts`, `lib/quiz.ts`, `tests/carkQuiz.test.ts`), sunucu sıralaması yok (rastgele içerik), ilerlemeye, şehir rekoruna ve deftere dokunmaz.
- **Çarkıfelek** (`cark`, Meydan Okuma, `components/Cark.tsx`): `spinCark(tohum, şehirler)` bitirilmiş ve TASLAK olmayan şehirden birini, kuralı `RULES` + `RAGE_RULES` içinden o şehirde `ruleFits` olanlardan seçer (NO_DASH_OK, SLIPPERY_OK… listeleri; kanıtsız fizik kuralı çıkmaz). Tohum `gün:toplamÇevirme`: sayfayı tazelemek yeniden çevirmez. Koşu serbest Kurallı Koşu altyapısında (`modeRef.cark`); Kurallı Koşu rekoru ve `kural:<şehir>:<kural>` tablosu normal işler (aynı şehir + kural, karşılaştırılabilir; çarkın kendi tablosu yok). İz `save.cark` (`CarkMark`: günün ödüllü çevirmesi, seri, açık koşu, gün gün kazanç `earn`; `mergeCark` gün başına en çoğu, `cleanCark`, `CLOUD_KEYS`). Günde `CARK_PAID` (3) ödüllü çevirme: biten koşu kuralın `RULE_ART` zorluğuna göre parça verir (`CARK_REWARD` 2/3/4/6/8), sonrası ödülsüz. Bitirmeden yeniden çevirmek seriyi sıfırlar ve hakkı yer (kolay kural avlanmasın); açık koşu çark ekranında "Koşuya Başla" ile sürer. Zorluk çağırandan gelir: `lib/cark.ts` sunucuda da yüklenir (`storage.ts`), `'use client'` bileşen dosyasını içe aktarmaz. Dönüş 2,6 sn, hareketi azalt açıksa yok.
- **Defter Bilmecesi** (`quiz`, Keşfet ve Dinlen, `components/Quiz.tsx`): `makeQuiz(tohum, havuz)` on soru (facts başlığı, hatıra, takma ad, boss adı, bölüm adı → şehir), her soruda başka şehir, dört benzersiz seçenek; ipucu şehrin adını (TR/EN) içeriyorsa ya da başka bir seçeneğin ipuçlarıyla aynıysa elenir. **Karar:** sorular ve seçenekler yalnız bitirilmiş şehirlerden (defter oyuncunun gezdiğini sorar, bilinmeyen şehri tahmin ettirmez); dörtten az şehirde kilitli, on şehirden azında sınav şehir sayısı kadar. TASLAK metinli şehir (`draftCity`) sorulmaz, çarka da girmez. Puan doğru başına 100 + hız bonusu (3 sn'ye dek 50, 15 sn'de 0). İz `save.quiz` (`QuizMark`, `mergeQuiz` en iyisi, tam puan bir kez); ilk on soruda on `QUIZ_PRIZE` (10) parça.
- **Para:** ikisinin parçası `earned(...) + carkCoins + quizCoins` olarak cüzdana eklenir (Game.tsx `modeCoins`), iki yolcuya da tamdır. Başarımlar `cark10`, `quizPerfect`. Menü denetimi `cark`, `cark-sonuc`, `cark-bitis`, `bilmece`, `bilmece-soru`, `bilmece-en`.
