# Sek-Sek · Claude için çalışma rehberi

Türkiye’nin 30 şehrini gezen platform oyunu (piksel arka plan, elle çizilmiş görünümlü karakter ve zemin). Next.js 16 + React 19.2 + Tailwind v4, kendi canvas motoru,
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
  sim.ts         fizik + dünya: zıplama, duvar, dash, düşmanlar, bulmaca nesneleri, sema/balon/tokmak/horon
  levels.ts      30 bölüm (ASCII harita, 24 satır) + şehir metinleri; extend(), addSignature(), addFinale() ve bossLevel() (Boss Rush arenası) burada
  cities/        yeni şehirlerin ana yolu, şehir başına bir dosya (Çanakkale, Diyarbakır, Sinop, Edirne, Bursa, Antalya, Şanlıurfa, Van, Erzurum, Kayseri, Hatay, Eskişehir, Amasya, Muğla); yeni şehir buraya eklenir
  extensions.ts  bölümlere eklenen ikinci parçalar
  signatures.ts  eski 12 şehrin imza bölümleri (+ İngilizce ipucu ve kişi metinleri)
  finales/       bölüm finalleri: meydan kapısı (@) → varış (&) + bayrak → meydan yolu (şehir başına bir dosya: bulmaca + saklı nazar boncuğu `!`) → arena (Q boss, G kapı) → çıkış; arenayı index.ts kurar
  boss.ts        şehir boss’ları: tanım (ad, can, hareket sırası), saate bağlı durum makinesi (toslar, dalar, sıçrar, yerden çıkar, atar), temas kuralı
  bossLines.ts   boss'ların üç lafı (uyanınca, yorulunca, basılınca; TR/EN); konuşma balonunu render.ts çizer
                 (şehir insanının sözü ve tabela ipucu da konuşanın başının üstünde baloncuk: render.ts drawDialog)
  assists.ts     kolaylık yamaları: birleşmiş haritaya en son yazılır (araya bayrak, çukura basamak); kayarsa hata verir
  content.en.ts  bütün bölüm metinlerinin İngilizcesi
  art.ts         şehir paletleri, arka plan katmanları (piksel), düşman türü seçimi, canlı adları
  render.ts      iki düşük çözünürlüklü tampon (arka: gök, parallax, süs · ön: su, nesne, canlı, parçacık), arada HD zemin; adımlar arası ara değerleme, kesirli kamera
  camera.ts      kamera hesabı (DOM'suz): takip, boss kadrajı, saate bağlı yaklaşım ve sarsıntı; kare hızından bağımsız (tests/camera.test.ts)
  terrainDraw.ts elle çizilmiş zemin ve duvarlar: şehre göre taş örgüsü, mürekkep dış hat, üst örtü (taş, çimen, kar); küçük hücrelerde önbelleklenir, kamera varmadan kare bütçesiyle önceden çizilir
  bossDraw.ts    30 boss’un vektör çizimi (ruh hâli: öfkeli, titrek, sersem, uykuda)
  enemyDraw.ts   düşmanlar, dost hayvanlar, hatıralar ve ortak nesneler (anahtar, pul, dash halkası, nazar, yay): vektör; föyü scripts/art/creatures.cjs
  characters.ts  Uktun ve Memo kimliği (ad, rol, hikâye)
  heroDraw.ts    elle çizilmiş görünümlü karakterler ve şehir insanları (kasket, yazma, kalfa, kalpak, saz, değnek): vektör eğri, mürekkep hat + gölge, eklem açılı poz ve sürekli koşu döngüsü; ana tuvalde ekran çözünürlüğünde çizilir
  portraitDraw.ts vesikalık portreler (vektör, heroDraw fırçalarıyla; sekiz kılık, atkı rengi parametreli). Sunucu kartı için public/portreler/<kılık>.png: `node scripts/art/portraits.cjs` (çizim ya da LOOKS değişince yeniden üret)
  audio.ts       WebAudio efektleri ve çalgılar (ney, saz, bas, dem, darbuka; yankı), beste geçişi, molada kısma
  music.ts       besteler veri olarak: menülerde jenerik teması, oyunda şehrin makamı (SCALES) ve usulünde, şehrin adından tohumlanan sabit tema
  flagMoments.ts her bayrakta şehrin kısa sözü (TR/EN), bayrak bildiriminde görünür
  ghost.ts       hayalet koşu kaydı (saniyede 15 örnek); saklaması lib/ghost.ts
components/      React arayüzü: Game (bütün ekranlar; ilk oynayışta adım adım rehber, save.tutorial), Defter (toplananlar, rozetler, unvan, yol istatistikleri), Modes (Modlar: Günlük Meydan Okuma, Düello, Boss Rush, Maraton; bitiş ekranları), Race (Yan Yana Yarış: bölünmüş ekran, iki dünya ve iki çizici), ScoreBoard (Skor Tablosu: Genel, Şehirler, Günlük, Koleksiyon), About (artbook), Bestiary, HUD, dokunmatik
lib/             storage (kayıt, şehir sırası sürümü, güncelleme notu), mapVersion (şehir başına harita sürümü: haritanın özeti; yalnız "yenilendi" bilgisi için), extras (atkı renkleri, Günün Şehri, Haftanın Görevi, Günlük Meydan Okuma kuralları ve skoru, Düello sonucu, unvan, yol istatistikleri), scoreKey (skor satırının kalıcı anahtarı), players (hesap: scrypt şifre + cihaz oturumu; sunucunun koyduğu 400 günlük HttpOnly çerez `seksek_oturum`), cloud (bulut kaydı: giriş yapan oyuncunun ilerlemesi `seksek_saves` tablosunda; yerelle birleşir, hiçbir ilerleme kaybolmaz), i18n + ui.en (TR/EN), share, db
app/             / oyun · /hakkinda tanıtım · /oyuncu/[ad] kullanıcı sayfası · /skor paylaşım · /skor/kart kartpostal · /api/*
scripts/         verify-all.sh (tam zincir, paralel), preview.cjs (oyun içi ekran görüntüsü), verify-levels (çözücü, solver.ts), verify-prelude (tek meydan yolunu saniyeler içinde dener), verify-respawn (her bayraktan yeniden doğunca çıkışa varılıyor mu), bossbot (boss’u gerçek fizikle yenen bot), verify-enemies (düşmanlar ve oklar açıkken bölümü insan paylı zamanlamayla oynayan bot; tam ve zayıf oyuncu), verify-frames (tarayıcıda 3x çözünürlükte dash hızında kayarken zemin hücresi hazır mı; kasma kanıtı), verify-perf (üretim derlemesinde gerçek oynanışta kare kaçırma; performans kanıtı), verify-items (zayıf oyuncu her toplanabilir şeyi alır ve aldığı yerden çıkışa varır: kapan yok), audit-reach (her toplanabilir şey görünür bir dayanağın zıplama menzilinde), audit-difficulty (zayıf oyuncu testi + tehlike yoğunluğu), audit-menus (her menü dört ekran boyutunda tek bakışta sığıyor mu), audit-clearance (1 karo yüksekliğinde yürünen alçak koridor var mı), verify-rules (Dash’siz kuralının çıktığı şehirler dash atmadan bitiyor mu), migrate, art/ (portre üreteci ve föyü portraits.cjs, çizim föyü sheet.cjs, zemin föyü ve hücre çizim süresi terrain.cjs (`--olc`), şehir görselleri banners.cjs, README görselleri readme.cjs (docs/img; görünüm değişince yeniden üret), ikon, favicon ve paylaşım görseli icons.cjs (çizimi emblem.ts; `--og` paylaşım görseli, `--foy` föy; Uktun'un çizimi değişince yeniden üret), harita üreteçleri, sync)
tests/           scores.test.ts (skor API'si bellekte gerçek Postgres ile: göçler, ölçüt başına güncelleme, filtreler, günlük tablo), cloud.test.ts (bulut birleşmesi, şehir başına sürüm, güncelleme notu), sim.test.ts (fizik, mekanik, final), camera.test.ts (60-240 Hz'de aynı kamera, titremesiz dash), perf.test.ts (tuval piksel bütçesi), bubble.test.ts (baloncuk karakterin üstüne binmez), boss.test.ts (boss kuralları; her boss’u bot ve zayıf oyuncu botu yener), extras.test.ts (görevler, atkılar, Boss Rush arenaları), music.test.ts (besteler)
```

## Ajanla çalışma

Bu oyun ajanla geliştiriliyor; her iş için hazır bir yol var. Yeni bir araç ya da kural öğrendiğinde buraya ve ilgili dosyaya yaz.

| İş | Nereden |
|---|---|
| Yeni şehir | `/yeni-sehir <ad>` (sekiz ölçüt, baştan sona) |
| Harita, bulmaca, zorluk | `level-designer` ajanı · `.claude/rules/bolumler.md` |
| Karakter, boss, kaplama çizimi | `artist` ajanı · `.claude/rules/cizim.md` |
| Boss davranışı | `.claude/rules/boss.md` |
| Metin, menü, Title Case | `.claude/rules/metin.md` |
| "Bozuldu mu?" | `/dogrula [şehir]` ya da `verifier` ajanı → `bash scripts/verify-all.sh` |
| "Nasıl duruyor?" | `/onizle <şehir> [yer]` → `scripts/preview.cjs` (oyun içi) · `scripts/art/sheet.cjs` (çizim föyü) |

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
6. **Görsel dil.** Oynanan her şey (karakterler, şehir insanları, boss’lar, zemin ve duvar) vektör çizgiyle, mürekkep
   dış hatla, ekran çözünürlüğünde çizilir (`heroDraw`, `bossDraw`, `terrainDraw`). Düşmanlar, dost hayvanlar ve toplananlar da vektördür (`enemyDraw`). Yeni karakter, canlı ya da kaplama piksel
   sprite olarak eklenmez; piksel kalan yalnız arka plan katmanları ve süslerdir. Işık sol üstten, gölge tek kademe.
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
plaka listesi. "Bölüm ölçütleri"ndeki sekiz maddenin hepsi sağlanmadan şehir eklenmiş sayılmaz. Şehir sırası değişince (yeni şehir) `lib/storage.ts` MAP_VERSION artır ve eski sırayı ORDERS'a yaz; haritanın kendisi değişince hiçbir sayı artırılmaz (aşağıda "Harita sürümü").

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

**Kurallar.** Kurallı koşular (Günlük Meydan Okuma ve serbest Kurallı Koşu) `lib/extras.ts` DAILY_RULES'tan gelir: hız,
düşüş/eksik hatıra cezası, Tek Can (düşünce baştan), Bayraksız, Zamana Karşı (bronz süre), Dash’siz. Kural haritayı
değiştirmez; yeni kural eklerken her şehirde bitirilebildiğini kanıtla. Etikete güvenme: İstanbul "Kolay" ama dash'siz
bitmiyor, bu yüzden Dash’siz yalnız NO_DASH_OK listesinde çıkar (`npx tsx scripts/verify-rules.ts`; o şehirlerin haritası
değişince yeniden koş). Kurallı Koşu yalnız bitirilmiş şehirlerde açılır; rekoru şehir + kural başınadır.

**Yeni mod.** Modlar (`components/Modes.tsx`) ilerlemeye ve şehir rekoruna dokunmaz: `Game.tsx` `modeRef` (günlük, düello)
ya da `rushRef` (Boss Rush, Maraton) doluyken `finish()` kendi dalına gider. Kurallar ve skor saf işlev olarak
`lib/extras.ts`te, testi `tests/extras.test.ts`te.

**Veritabanı değişikliği.** Yeni tablo ya da sütun `drizzle/NNNN_*.sql` (idempotent: `IF NOT EXISTS`) + `lib/schema.ts`;
canlıya `npm run db:migrate` ile uygulanır (DATABASE_URL gerekir). Kod, tablo henüz yokken sessizce yerel kayda düşmeli.

**Metin eklemek.** Arayüzde Türkçe metni `t('…')` ile yaz, İngilizcesini `lib/ui.en.ts`’e ekle. Bölüm metni
`levels.ts`’e, İngilizcesi `content.en.ts`’e. Başlık ve düğmeler Title Case, paragraflar cümle düzeni; tek kelimelik
yetim satır bırakma.

**Meydan yolu değiştirmek.** `game/finales/<id>.ts` → `npx tsx scripts/verify-prelude.ts <id> --goster` (OK demeli) →
`npx tsx scripts/verify-levels.ts <id>`. Yasak karakterler: `C K $ D P E @ & Q G`; tam bir `!` olmalı.

**Boss değiştirmek.** `game/boss.ts` (BOSSES: can, hareket sırası, hız; BOSS: süreler) → `npx tsx scripts/bossbot.ts <id>`
(bot ve zayıf oyuncu botu yenmeli). Çizimi `game/bossDraw.ts`. Kural her şehirde aynı kalsın: işaret → saldırı → yorgunluk → üstüne bas.

## Tasarım tuzakları (öğrenilmiş)

- Platformun yerden yüksekliği **en çok 32 piksel** (2 karo) olsun; 48 piksel zıplama sınırıdır, oyuncu çoğu zaman tutturamaz.
- Oyuncu her duvara tırmanabilir: bir alanı kapatan duvar haritanın en üst satırına kadar çıkmalı.
- Alçak tavanlı koridorda zıplama kısalır; dikenli çukur 2 karoyu geçmesin.
- **Rüzgâr gerçek kuvvettir** (`LevelDef.wind`, `sim.ts` `PHYS.windAir` / `windGround`): havadaki hedef hızı kaydırır, yerde
  yalnız yürürken; dururken itmez. Bayburt'un karşı rüzgârında atlayış ~0,75 karo kısalır. Esinti ~5,7 sn'de güçlenip
  zayıflar: rüzgâra karşı atlayış en zayıf esintide de zayıf oyuncuya yetmeli. Rüzgârlı şehre dokununca
  `audit-difficulty` koş. (14 Kasım'a dek rüzgâr hıza eklenip hedefe kırpılıyor, neredeyse hiç hissedilmiyordu.)
- Yeni lejant: `i` ıslak taş (kaygan), `p` itilen sandık (çözücü sandık konumunu da durum sayar: az ve yerel kullan).
  Plaka ve renkli bloklar şehre göre başka görünebilir (`render.ts` SWITCH_SKIN: Bursa gölge, Van gece/gündüz); kural değişmez.
- Sandıklı bölümde gizli hedef (pul, nazar) ileri yolun üstünde dursun: geride kalan hedef çözücünün bütçesini yakar. Şehir başına en çok iki
  sandık, her biri birkaç karoluk kapalı alanda; plakaya yalnız oyuncu basar, sandık basmaz.
- Dost hayvan ile düşman aynı tür olmasın (kedi dostsa düşman kedi olmaz). Düşmanlar kırmızı hatla parlar.
  Şehre özgü düşman: Ordu saksağanı (`j`), dalda tüner, altından geçene uyarıp dalar.
- Konuşma ve tabela sözü ekranın altına kutu olarak değil, konuşanın başının üstüne baloncuk olarak çizilir (karakteri kapatmaz).
  Oynanış sırasında çıkan yazılar (bayrak sözü, ölüm lafı) üstte HUD'ın altında, küçük ve soluk durur; oynanış alanına girmez.
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
- **Menülerde sayfa kaymaz.** Her ekran masaüstünde (1280×720, 1512×860) ve telefonda (dikey 390×664, yatay 750×342) tek bakışta
  sığar. Uzun liste (şehirler, defter, skor, bölüm sonu) panelin içinde kendi alanında kayar; panel ekran boyunu geçmez.
  Kanıtı `node scripts/audit-menus.cjs` (sunucu açıkken, `PORT=`): her menü dört boyutta açılır, taşan hücre FAIL verir;
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

- **Zamana bağla, kareye değil.** Kameranın yaklaşımı `approach()` (üstel, `Math.pow(keep, dt)`), sarsıntı `shakeOffset(t)`
  (zamanla dalgalanır). Kare başına `Math.random()` ile titreme ya da `Math.random() < p` ile olasılık yazma: yüksek Hz'de
  daha çok titrer, daha çok parçacık yağar. Olasılık için `this.chance(p)` (60 Hz karşılığı, saniyede aynı sıklık).
- **Kare içinde ağır iş yok.** 120 Hz'de bütün kare 8 ms'dir. Pahalı çizim (zemin) önceden, küçük parçalar hâlinde ve
  süre bütçesiyle yapılır (`terrainDraw.ts` WARM_MS). Yeni önbellekli çizim eklersen aynı yolu izle.
- **Hareketli her şey ara değerlenir** (`capture()` / `blend()`), yoksa yüksek Hz'de titrer.
- **Kamera telefonda sakin.** Bakış payı ekrana orantılı (`CAM.leadMax`), dönüşte yumuşakça kayar (`leadKeep`); ölü bölge
  kameraya değil hedefe uygulanır (`anchor`): ufak adımlar ve eşikte titreyen joystick kadrajı oynatmaz. Joystick'in yön eşiği
  pay ile çalışır (basmak 0,28, bırakmak 0,18). Sarsıntı küçük ekranda orana göre küçülür.
- **Efekt sesleri yumuşak.** Kare ve testere dalga efektte kullanılmaz (bip, yapışkan tuş uyarısı gibi duyuluyordu); efektler
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

## Yayın

`main`e push → Vercel otomatik derler (proje `sek-sek`). Push’tan sonra dağıtımın READY olduğunu ve
https://sek-sek.vercel.app’in açıldığını kontrol et. PR yalnızca istenirse açılır.
