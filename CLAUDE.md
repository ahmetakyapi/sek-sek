# Sek-Sek · Claude için çalışma rehberi

Türkiye’nin 19 şehrini gezen platform oyunu (piksel arka plan, elle çizilmiş görünümlü karakter ve zemin). Next.js 16 + React 19.2 + Tailwind v4, kendi canvas motoru,
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
  sim.ts         fizik + dünya: zıplama, duvar, atılma, düşmanlar, bulmaca nesneleri, sema/balon/tokmak/horon
  levels.ts      19 bölüm (ASCII harita, 24 satır) + şehir metinleri; extend(), addSignature() ve addFinale() burada
  cities/        yeni şehirlerin ana yolu, şehir başına bir dosya (Çanakkale, Diyarbakır, Sinop); yeni şehir buraya eklenir
  extensions.ts  bölümlere eklenen ikinci parçalar
  signatures.ts  eski 12 şehrin imza bölümleri (+ İngilizce ipucu ve kişi metinleri)
  finales/       bölüm finalleri: meydan kapısı (@) → varış (&) + bayrak → meydan yolu (şehir başına bir dosya: bulmaca + saklı nazar boncuğu `!`) → arena (Q patron, G kapı) → çıkış; arenayı index.ts kurar
  boss.ts        şehir patronları: tanım (ad, can, hareket sırası), saate bağlı durum makinesi (toslar, dalar, sıçrar, yerden çıkar, atar), temas kuralı
  assists.ts     kolaylık yamaları: birleşmiş haritaya en son yazılır (araya bayrak, çukura basamak); kayarsa hata verir
  content.en.ts  bütün bölüm metinlerinin İngilizcesi
  art.ts         şehir paletleri, arka plan katmanları, eşya ve düşman sprite'ları, canlı adları
  render.ts      iki düşük çözünürlüklü tampon (arka: gök, parallax, süs · ön: su, nesne, canlı, parçacık), arada HD zemin; adımlar arası ara değerleme, kesirli kamera
  terrainDraw.ts elle çizilmiş zemin ve duvarlar: şehre göre taş örgüsü, mürekkep dış hat, üst örtü (taş, çimen, kar); parça parça önbelleklenir
  bossDraw.ts    16 patronun vektör çizimi (ruh hâli: öfkeli, titrek, sersem, uykuda)
  characters.ts  Uktun ve Memo kimliği (ad, rol, hikâye)
  heroDraw.ts    elle çizilmiş görünümlü karakterler ve şehir insanları (kasket, yazma, kalfa, kalpak, saz, değnek): vektör eğri, mürekkep hat + gölge, eklem açılı poz ve sürekli koşu döngüsü; ana tuvalde ekran çözünürlüğünde çizilir
  portraits.ts   64x76 portreler (scripts/art/painter.py üretir; Uktun'un yüzü elle çizilmiş scripts/art/uktun_classic.json'dan gelir)
  audio.ts       WebAudio efektleri + şehir makamında üretilen müzik (bayrak sesi de şehrin makamından)
  flagMoments.ts her bayrakta şehrin kısa sözü (TR/EN), bayrak bildiriminde görünür
  ghost.ts       hayalet koşu kaydı (saniyede 15 örnek); saklaması lib/ghost.ts
components/      React arayüzü: Game (bütün ekranlar), About (artbook), Bestiary, NpcDialog, HUD, dokunmatik
lib/             storage (kayıt + harita sürümü), players (hesap: scrypt şifre + cihaz oturumu), i18n + ui.en (TR/EN), share, db
app/             / oyun · /hakkinda tanıtım · /oyuncu/[ad] kullanıcı sayfası · /skor paylaşım · /skor/kart kartpostal · /api/*
scripts/         verify-all.sh (tam zincir, paralel), preview.cjs (oyun içi ekran görüntüsü), verify-levels (çözücü, solver.ts), verify-prelude (tek meydan yolunu saniyeler içinde dener), verify-respawn (her bayraktan yeniden doğunca çıkışa varılıyor mu), bossbot (patronu gerçek fizikle yenen bot), audit-difficulty (zayıf oyuncu testi + tehlike yoğunluğu), migrate, art/ (portre ressamı, çizim föyü sheet.cjs, şehir görselleri banners.cjs, ikon ve favicon icons.py, harita üreteçleri, sync)
tests/           sim.test.ts (fizik, mekanik, final), boss.test.ts (patron kuralları; her patronu bot ve zayıf oyuncu botu yener)
```

## Ajanla çalışma

Bu oyun ajanla geliştiriliyor; her iş için hazır bir yol var. Yeni bir araç ya da kural öğrendiğinde buraya ve ilgili dosyaya yaz.

| İş | Nereden |
|---|---|
| Yeni şehir | `/yeni-sehir <ad>` (sekiz ölçüt, baştan sona) |
| Harita, bulmaca, zorluk | `level-designer` ajanı · `.claude/rules/bolumler.md` |
| Karakter, patron, kaplama çizimi | `artist` ajanı · `.claude/rules/cizim.md` |
| Patron davranışı | `.claude/rules/patron.md` |
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
4. **Patron arenası.** Şehrin bir ayrıntısından doğan bekçi (`game/boss.ts`). Kural bütün şehirlerde aynıdır:
   işaret → saldırı → yorgunluk → üstüne bas. Şehirden şehre yalnız saldırının biçimi ve hızı değişir.
   Arenadan hemen önce bayrak, tabelada nasıl yenileceği yazar (TR + EN).
5. **Aynı mantık herkese.** Zorluk etikete uyar (Kolay: yürü + zıpla yeter; Orta: bir atılma ya da duvar sekmesi;
   Zor: ikisi + zamanlama) ama hiçbir yerde kıl payı atlayış, kör atlayış ya da uzun cezalı tekrar olmaz.
   Fizik sabit adımlıdır (1/120 sn): her ekranda, her tazeleme hızında oyun aynı işler; hız ayarı fiziğe değil çizime yapılır.
6. **Görsel dil.** Oynanan her şey (karakterler, şehir insanları, patronlar, zemin ve duvar) vektör çizgiyle, mürekkep
   dış hatla, ekran çözünürlüğünde çizilir (`heroDraw`, `bossDraw`, `terrainDraw`). Yeni karakter ya da kaplama piksel
   sprite olarak eklenmez. Işık sol üstten, gölge tek kademe.
7. **Kanıt.** `verify-prelude` (meydan yolu) → `verify-levels` (bütün bölüm; hatıra, bayrak, pul, nazar, çıkış) →
   `verify-respawn` (hangi bayrakta, hangi düğme durumuyla ölünürse ölünsün çıkışa varılır) → `bossbot` (patron; zayıf
   oyuncu botu dahil) → `audit-difficulty` (zayıf oyuncu geçer). Biri FAIL ise bölüm bitmemiştir.
8. **Söz ve insan.** Her tabelanın ve her şehir insanının metni TR + EN yazılır, şehre özgüdür, kısadır ve sıcaktır;
   kişi adları oyun genelinde tekrar etmez. Tabela ne yapılacağını, insan şehri ve (üstü kapalı) gizli köşeyi anlatır.

## Sık işler

**Bölüm haritası değiştirmek.** Yeni şehirler `scripts/art/newcities.py`, imza bölümleri `scripts/art/sig.py`.
Değiştir → `python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py` →
`npx tsx scripts/verify-levels.ts <id>`. Eski şehirlerin ana haritası doğrudan `game/levels.ts` içinde.

**Yeni şehir.** `types.ts` CityKey → `game/cities/<id>.ts` (ana yol) → `art.ts` (CITY, buildLayers, ITEM_ART) → `render.ts` (karo, tezgâh `s`,
simge nesne `z`, NEXT_CITY) → `audio.ts` SCALES → `levels.ts` LEVELS + DECOR_CYCLE → `content.en.ts` →
`components/TurkeyMap.tsx` koordinat → `game/features.ts` → `game/finales/<id>.ts` (meydan yolu + nazar boncuğu) ve
`finales/index.ts` kaydı → `game/boss.ts` BOSSES (patron) + `game/bossDraw.ts` (çizimi) → `terrainDraw.ts` LOOK (zemin
malzemesi) → `public/sehirler/<id>.webp` ve `assets/cities/<id>.png` (`node scripts/art/banners.cjs <id>`) → `lib/storage.ts` ORDERS (eski sıra) → `tests/sim.test.ts`
plaka listesi. "Bölüm ölçütleri"ndeki sekiz maddenin hepsi sağlanmadan şehir eklenmiş sayılmaz. Haritalar değişince `lib/storage.ts` MAP_VERSION artır.

**Metin eklemek.** Arayüzde Türkçe metni `t('…')` ile yaz, İngilizcesini `lib/ui.en.ts`’e ekle. Bölüm metni
`levels.ts`’e, İngilizcesi `content.en.ts`’e. Başlık ve düğmeler Title Case, paragraflar cümle düzeni; tek kelimelik
yetim satır bırakma.

**Meydan yolu değiştirmek.** `game/finales/<id>.ts` → `npx tsx scripts/verify-prelude.ts <id> --goster` (OK demeli) →
`npx tsx scripts/verify-levels.ts <id>`. Yasak karakterler: `C K $ D P E @ & Q G`; tam bir `!` olmalı.

**Patron değiştirmek.** `game/boss.ts` (BOSSES: can, hareket sırası, hız; BOSS: süreler) → `npx tsx scripts/bossbot.ts <id>`
(bot ve zayıf oyuncu botu yenmeli). Çizimi `game/bossDraw.ts`. Kural her şehirde aynı kalsın: işaret → saldırı → yorgunluk → üstüne bas.

## Tasarım tuzakları (öğrenilmiş)

- Platformun yerden yüksekliği **en çok 32 piksel** (2 karo) olsun; 48 piksel zıplama sınırıdır, oyuncu çoğu zaman tutturamaz.
- Oyuncu her duvara tırmanabilir: bir alanı kapatan duvar haritanın en üst satırına kadar çıkmalı.
- Alçak tavanlı koridorda zıplama kısalır; dikenli çukur 2 karoyu geçmesin.
- Dost hayvan ile düşman aynı tür olmasın (kedi dostsa düşman kedi olmaz). Düşmanlar kırmızı hatla parlar.
  Şehre özgü düşman: Ordu saksağanı (`j`), dalda tüner, altından geçene uyarıp dalar.
- Telefonda yatay ekranda diyalog ve ipucu kutusu iki kontrolün arasına oturur; yeni kutu eklersen karakteri ve tuşları kapatmasın.
- Düğme durumu bayrakla birlikte saklanır, ölünce o hale dönülür; meydan kapısından geçince sıfırlanır. Bulmacayı buna göre kur.
- Çözücü "aşağı" tuşuna basmaz: tek yönlü platformdan aşağı inişe dayanan yol doğrulanamaz, çatlak taş (X) kullan.
- Patron ve düşmanlar çözücüde yoktur (zamanlama engeli); patronun yenilebilirliğini `tests/boss.test.ts` kanıtlar.
- Çözücü (`verify-levels`) yavaşsa önce haritayı sadeleştir: dönen platformlar ve tokmaklar durum sayısını katlar.
- Her yaştan oyuncu düşün: bayraklar arası **en çok 75 karo** (test bekler), boşluklar 3 karoyu geçmesin; "atıl + kristal + atıl"
  zinciri isteğe bağlı kestirme olsun, zorunlu yol olmasın. Değişiklikten sonra `npx tsx scripts/audit-difficulty.ts <id>`:
  zayıf oyuncu (zıplama ~%10 alçak, koşu %8 yavaş) geçebilmeli.

## Yayın

`main`e push → Vercel otomatik derler (proje `sek-sek`). Push’tan sonra dağıtımın READY olduğunu ve
https://sek-sek.vercel.app’in açıldığını kontrol et. PR yalnızca istenirse açılır.
