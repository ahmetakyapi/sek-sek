---
paths:
  - "components/Editor*.tsx"
  - "components/editorScene.ts"
  - "components/solve.worker.ts"
  - "lib/customLevel.ts"
  - "lib/editorKit.ts"
  - "app/duzenle/**"
  - "tests/customLevel.test.ts"
  - "tests/editorKit.test.ts"
---

# Bölüm Düzenleyici

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

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
