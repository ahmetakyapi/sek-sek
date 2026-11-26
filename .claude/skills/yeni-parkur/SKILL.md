---
name: yeni-parkur
description: Sek-Sek'e yeni Usta ya da Efsane Parkuru (elle çizilmiş mücadele haritası) ekle; harita, kanıt, madalya, liste, metin ve test. "Yeni mücadele", "yeni parkur", "usta parkuru gibi", "daha zor challenge", "efsane parkur" dendiğinde kullan. Şehir kesiti (CHALLENGES) ve Öfke Parkuru bu yeteneğin işi değildir.
argument-hint: "<usta|efsane> <şehir> <fikir>"
---

# Yeni Parkur (Usta / Efsane)

İş: $ARGUMENTS

## 1. Kademe ve dosya

| Kademe | Dosya | Kimlik | Ölçü | Açılış |
|---|---|---|---|---|
| Usta | `game/puzzles/zamanlama.ts` (zamanlama), `bulmaca.ts` (anahtar, sandık, düğme), `doga.ts` (ikinci defterin doğa mekanikleri) ya da yeni tema dosyası | `usta-<fikir>-<yer>` | 120-200 sütun, 2-4 bayrak, çözücü ~18-32 sn | görünüş şehri (`level`) bitince |
| Efsane | `game/puzzles/efsane.ts`, `tier: 'efsane'` | `efsane-<yer>-<fikir>` | 200-300 sütun, 3-5 bayrak, çözücü ~30-50 sn; her parçada iki üç mekanik birden | şehir + `LEGEND_UNLOCK` (3) Usta Parkuru (`courseOpen`) |

Yeni tema dosyası açarsan dizisini `game/puzzles/index.ts` `MASTER_COURSES`e ekle (Efsane her zaman en sonda: listede başlığı ilk Efsane'den önce çıkar).
Parkurlar `CHALLENGES`e girmez: turnuva, Günün Mücadelesi ve Gezgin Turu seçimi kaymasın. Skor `mucadele:<id>`, en iyisi `save.challenges`.

## 2. Harita

- 24 satır ASCII, bütün satırlar aynı uzunlukta; `from: 0, to: 0`, `map: [...]`. Tam bir `P`, en az bir `E`, bayrak `F`.
- Parkurda toplanan, konuşan ve final işareti yok: `C $ ! n ? @ & Q G` yasak (`K` anahtar bulmacası serbest). `tests/courses.test.ts` bekler.
- Her parkur **tek fikir** işler: önce güvenli yerde öğret (dibi taş), sonra dikenin / derin suyun üstünde sına, sonda ikinci bir mekanikle birleştir. Efsane'de birleşim baştan gelir, dinlenme azdır.
- `.claude/rules/bolumler.md` "Tasarım tuzakları" aynen geçerli: platform ≤ 2 karo, boşluk ≤ 3, bayraklar arası ≤ 75 karo, baş payı 2 karo, kapalı alan duvarı tepeye dek,
  ok hattında bayrak yok, raylı platform çiftleri eşit aralık + ters faz, sandık en çok iki. Zor ama adil: kıl payı ya da kör atlayış, uzun cezalı tekrar yok.
- Çözücü düşman ve boss'u görmez, "aşağı" tuşuna basmaz; dönen platform ve tokmak durum sayısını katlar: yavaşsa sadeleştir.
- Haritayı `level-designer` ajanı çizebilir; her ajan yalnız kendi dosyasına dokunur (paralel çalışır), `index.ts` ve `challenges.ts`'e ana oturum dokunur.
  Aynı tema dosyasına (ör. `doga.ts`) iki ajan yazacaksa ikisi de `Write` değil `Edit` kullanır: biri öbürünün parkurunu silmesin.
  Görev tanımına kademe, kimlik, ölçü, kullanılacak mekaniklerin kesin kuralı (`.claude/rules/bolumler.md`) ve 3. adımdaki kanıtı yaz.

## 3. Kanıt ve madalya

1. `npx tsx scripts/verify-challenges.ts <id>` OK (büyük parkurda `BUDGET=40000`); yazdırdığı süre `par` olur (bir ondalık).
2. Madalya: `npx tsx scripts/fast-time.ts <id>` (en hızlı makro yolu; büyük parkurda `BUDGET=40000`, "bütçe" yazmamalı) → yazdırdığı `öneri` (hızlı süre × 1,15, yukarı) `gold` alanına. `par` altına dayanmaz (çözücünün ilk bulduğu yol, en hızlısı değil). Gümüş ×1,5, bronz ×2,2 altından türer. Yol düşman ya da okla ölüyorsa (`yol N kez ölür`) × 1,3 kullan; varamazsa `SPEED=120` dene. Ölçülmüş usta koşusu (× 1,08) daha sıkıysa o kalır. `tests/courses.test.ts` altının hile önleme alt sınırının 1,3 katından büyük olduğunu bekler.
3. Hile önleme alt sınırı haritadan hesaplanır (`minScoreMs`); ayrı iş yok. `npx vitest run tests/courses.test.ts tests/antiCheat.test.ts`.
4. Görsel: Modlar → Mücadeleler listesinde başlık, kart görseli (`CourseScene`), kilit metni; `ONLY=mucadeleler node scripts/audit-menus.cjs` (sunucu açıkken).

## 4. Metin

Parkur adı Title Case, şehrin gerçek bir yeri ("Kaz Dağı Termalleri"). İngilizcesi `lib/ui.en.ts`te (`t(c.name)` ile çevrilir). Yeni başlık ya da
kilit metni eklersen o da TR + EN.

## 5. Bitiş

`npx tsc --noEmit --noUnusedLocals --noUnusedParameters` → `npm test` → değişen parkurlar için `verify-challenges` → `npm run build` → `/yayinla`.
