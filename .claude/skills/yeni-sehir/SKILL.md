---
name: yeni-sehir
description: Sek-Sek'e yeni şehir ekle, baştan sona: araştırma, iskelet, harita, meydan yolu, boss, çizim, ses, metin (TR+EN), hikâye diyaloğu, kayıt geçişi, doğrulama ve yayın. "Yeni şehir ekle", "X şehrini yap", "iki şehir daha" dendiğinde kullan. Argüman: şehir adı(ları), isteğe bağlı zorluk.
argument-hint: "<şehir adı> [zorluk] [yeni mekanik fikri]"
---

# Yeni Şehir

Yeni şehir: $ARGUMENTS

Bu yol Balıkesir ve Elazığ (24 Kasım 2026) ve Adıyaman ile Kastamonu (26 Kasım 2026) eklenirken yürünüp sabitlendi. Şehir,
`CLAUDE.md` "Bölüm ölçütleri"ndeki sekiz maddenin hepsi sağlanınca ve `npx tsx scripts/city-check.ts <id>` OK verince eklenmiş sayılır.
Bir şehir ~30 dosyaya dokunur. İskeleti `scripts/new-city.ts` yazar. Neyin eksik kaldığını `city-check` söyler.

## 0. Karar (sormadan ver, raporda gerekçele)

- **Şehir:** oyunda olmayan bir il seç (`LEVELS` id listesi: `npx tsx -e "import {LEVELS} from './game/levels'; console.log(LEVELS.map(l=>l.id).join(' '))"`).
  Şehri kendine has kılan dört gerçek yer seç (ana yolun dört parçası) ve meydan yolu için bir yer daha.
- **Zorluk:** etiket ve boss kademesi birlikte seçilir: Kolay → kademe 1, Orta → 2, Zor ve Çok Zor → 3.
- **Mekanik:** şehir yeni bir şey getirsin. Var olanlar: halat, teleferik, derin su, gelgit, ritim, nitro, sandık, rüzgâr, yükselen hava,
  donan su, havuz teyzesi (görüş + havlu), yüzen ada, iç mekân (`LevelDef.indoor`). **Yeni mekanik varsa önce `yeni-mekanik`**:
  sim, çözücü, test ve tasarım kuralı bitmeden şehrin haritası çizilmez (yarım mekanikle çizilen harita mekanik değişince baştan kurulur).
- **Hatıra, boss, insanlar:** hatıra şehrin bir yiyeceği ya da el işidir. Boss şehrin bir ayrıntısından doğar, dost hayvanla aynı tür olmaz.
  Dört şehir insanından ilki esnaftır ve şehrin ustasıdır; yanına tezgâh `s` konur. Kişi adları oyun genelinde tekrar etmez:
  `grep -rn "<Ad>" game/levels.ts game/finales game/signatures.ts game/extensions.ts game/cities game/stories` boş dönmeli.
  Bir adı yalnız tam adıyla değil, ilk adıyla da ara.
- **Bilgiler:** tarih ve sayı doğrulanmış olsun. Emin değilsen yuvarla ("12. yüzyılda", "yüzlerce tür").

## 1. İskelet: `scripts/new-city.ts` (ana oturum, bir komut)

```bash
npx tsx scripts/new-city.ts samsun --zorluk Zor --kuru     # önce ne yapacağını gör
npx tsx scripts/new-city.ts samsun --zorluk Zor            # yaz (81 ilden biriyse ad, plaka, konum scripts/iller.ts'ten)
npx tsx scripts/new-city.ts kahramanmaras --ad "Maraş" --sonra samsun   # adı değiştir; son şehir samsun değilse dur
npx tsc --noEmit && npx tsx scripts/city-check.ts samsun
```

Betik bütün kayıtları **TASLAK** işaretli, derlenen ve testleri geçen değerlerle yazar ve sonunda doldurulacakların listesini basar:
`types.ts` CityKey · `levels.ts` import + `LEVELS` kaydı + `DECOR_CYCLE` · `content.en.ts` · `cities/<id>.ts` ve `finales/<id>.ts`
taslak haritası + `finales/index.ts` · `art.ts` CITY + `buildLayers` case · `boss.ts` · `bossLines.ts` · `bossDraw.ts` PAINT ve `enemyDraw.ts`
KEEPSAKES (son şehrin çizimini ödünç alır) · `flagMoments.ts` · `features.ts` · `music.ts` SCALES · `terrainDraw.ts` LOOK · `render.ts` NEXT_CITY ·
`stories/<id>.ts` (ilk iki kişinin diyaloğu) + `index.ts` · `TurkeyMap` COORDS · `customLevel.ts` CITY_CODES (sona) · `medals.ts` taslak süre ·
`ci.yml` matris (Zor/Çok Zor'da 75 dk listesi) · `sim.test.ts` plaka · `storage.ts` MAP_VERSION + ORDERS · `cloud.test.ts` mapNews ·
`Game.tsx` RELEASE_NOTES + `ui.en.ts` · `layout.tsx`, `hakkinda`, `icons.cjs` sayıları · README satırı.

- **İki şehir tek sürümde:** ikinci şehirde betik MAP_VERSION'ı yeniden artırmaz (dalda `origin/main`'den büyükse "aynı sürüm"; `--surum yeni|ayni` ile zorla).
  "Bu Sürümde" notunu ilk şehrin satırında iki şehre göre yaz. İkinci çalıştırmada dosyalar kirli olduğu için `--zorla` gerekir.
- **İdempotent:** şehir varsa dokunmaz. Bir çapa bulunamazsa hiçbir dosya yazılmaz, hangi çapanın kaydığı söylenir: betiği düzelt, elle yazma.
- **Geri almak:** betik sonunda tam `git checkout -- … && rm …` komutunu basar (temiz ağaçta çalıştırılmalı; kirliyse `--zorla` ister).
- Doldurulacakları bul: `grep -rn TASLAK game components lib README.md app .github`. `city-check` TASLAK kalan her tabloyu ve dosyayı FAIL sayar.

## 2. Paralel iş (ajanlar arka planda; ana oturum bu sırada metinlere, testlere, kayıtlara bakar)

Her şehre bir **`level-designer`** ve iki şehre birlikte tek bir **`artist`** ajanı aç, hepsini aynı mesajda.
Görev tanımı ajanın tek bağlamıdır. İçine şunları yaz:
- dokunabileceği dosyalar (tasarımcı yalnız `game/cities/<id>.ts` ve `game/finales/<id>.ts`). Ortak dosyalara dokunmaz, metin değişikliği önerir.
- **paylaşılan dosyada `Write` değil `Edit`** (art.ts, render.ts, bossDraw.ts, enemyDraw.ts): iki ajan aynı dosyayı `Write` ile baştan yazarsa birinin işi kaybolur.
- parça parça ne anlatılacağı: tabela ve kişi sırası, hatıranın, pulun ve nazarın tarifi (kişi metinleriyle aynı)
- yeni mekaniğin **kesin tasarım kuralı**: sabitler (süre, hız, mesafe), çözücünün onu nasıl gördüğü, `CLAUDE.md` / `.claude/rules/bolumler.md`'deki
  ölçü (ör. "termalin en üst V satırı inilecek taşın yürüme satırından en az bir satır yukarıda", "havuzun üstü kıyıyla aynı hizada"). Ajan bunu tahmin etmez.
- bütün doğrulama listesi (aşağıda 3) ve "commit atma"
- **çizer ajanı:** `art.ts` katmanları ve palet, `enemyDraw.ts` `KEEPSAKES` (hatıra), `bossDraw.ts` `PAINT` (boss), `render.ts` tezgâh `s` ve simge `z`
  (`case '<son şehir>'` bloklarının yanına), `terrainDraw.ts` LOOK. TASLAK satırlarını kaldırmak onun işi. Önizleme için **boş bir port** ver (3103 gibi).
  3100'de başka oturumdan kalmış eski sunucu olabilir.

Ajan raporu kanıt değildir: ajan bitince değişen dosyaları ve doğrulamaları kendin koş. Ara kayıt (wip commit) alırken ajan hâlâ
çalışıyorsa onun yarım dosyası da kayda girer: ara kaydı ajanlar bitince al ya da yalnız kendi dosyalarını `git add` et.

## 3. Kanıt (hepsi OK olmadan şehir bitmedi)

Şehir başına, ayrı süreçlerde paralel (`xargs -P 6`):
`verify-prelude` · `verify-levels` · `verify-respawn` · `verify-items` · `verify-enemies` · `verify-chase` · `audit-difficulty` ·
`audit-reach` · `bossbot` · `audit-clearance`.
Sonra `npx tsx scripts/solver-time.ts <id>` → `game/medals.ts` `SOLVER_TIME` (TASLAK yorumunu sil); bossbot'un "insan paylı" süresi → `BOSS_TIME`.
Metinler: `npx tsx scripts/check-text.ts <id>` (tabela/kişi sayısı, metinde geçen mekanik haritada var mı) ve `--hepsi` ile kişi sözlerine de göz at.
En son `npx tsx scripts/city-check.ts <id>`, `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, `npm test`, `npm run build`.
Kural listeleri (Sinir Bozucu fizikleri, Dash'siz) için `yeni-parca` 3. adımındaki tablo yeni şehirde de geçerli.

Yeni mekanik bir doğrulama botunu takarsa (bugün `verify-enemies` yükselen havada takıldı), haritayı değil botu düzelt:
bot da çözücüyle aynı durumlarda karar vermeli.

## 4. Görsel

- Dev sunucusu: önce eski sunucuyu kapat (`pkill -f "next dev"`; gerekirse `ps aux | grep next-server` ile bulunan süreç),
  sonra `npx next dev -p 3100`. Günlükte `EADDRINUSE` varsa sayfa **eski kodu** gösterir: şehir görseli Aydın gibi başka bir şehirden çıkar.
- `node scripts/preview.cjs <id> start|arrival|boss|x,y out.png` çıktısını Read ile aç. Saate bağlı mekaniği iki ayrı anda çek (`--bekle=900`, `--bekle=3300`).
- **Boyalı görünüm** (`.claude/rules/cizim.md` "Atmosfer"): gök çok soluk ya da her şey gri kaldıysa `sky` paletini doygunlaştır (ufuk beyaza
  değil ılık renge insin); arka plan katmanını düz tek renk bloklarla değil, açık-koyu iki üç tonla çiz.
- `node scripts/art/banners.cjs <id>` (şehir kartı ve kartpostal görseli). Çıkan `public/sehirler/<id>.webp`'yi aç, gerçekten o şehir mi bak.
- `node scripts/art/icons.cjs --og` (paylaşım görselindeki sayılar). Yanında değişen ikon PNG'leri gereksizse `git checkout` ile geri al.
- "Yolda Neler Değişti" notu: `mapVersion` bir eksik bir kayıtla, `?debug` olmadan aç. Yeni şehirler ve "Bu Sürümde" satırları görünmeli.

## 5. Yayın

`yayinla` yeteneğini izle: tek ve anlamlı commit (`feat(sehir): …`, gövde madde madde). Ara kayıtlar çalışma dalında kalır,
`main`'e squash edilerek tek commit gider. Push, Vercel READY ve canlı sayfa denetimi.

## Öğrenilenler

- **Metin haritadan sonra.** Tabela, kişi, laf (quips), giriş, not ve `features.ts` metnini harita bittikten sonra haritaya göre gözden geçir.
  Metinde geçen mekanik haritada yoksa metin yalan söyler: Adıyaman'ın ilk metni "rüzgâr karşından eser" diyordu, haritada rüzgâr yoktu.
  `check-text` bunu yakalar; kişi sözlerini `--hepsi` ile gözden geçir.
- **Yeni mekanik önce, şehir sonra.** Mekanik yarımken çizilen harita kural değişince bozulur (Kastamonu'nun şelalesi).
- **Ajanlar paylaşılan dosyada `Edit` kullanır.** Ara kayıtlar ajanların yarım dosyalarını da alabilir: kaydı ajanlar bitince al.
- Termal, donan su, gelgit gibi saate bağlı mekanik çözücüyü yavaşlatır. Bölgeleri dar tut: Elazığ'ın ilk meydan yolunda havuz geniş ve derindi, çözücü 5 dk sürdü ve zayıf oyuncu takıldı.
- Pul ve nazarın yeri çözücüyü çok etkiler: bir karo kaydırmak 220 sn'yi 1,6 sn'ye indirdi.
- Zor ve Çok Zor şehirde verify-levels birkaç dakika sürebilir; betik onu CI'da 75 dk listesine yazar, Orta şehir uzun sürerse elle ekle.
- Taslak harita `hints` sayısıyla uyuşmasa da derlenir (`addFinale` boşlukla doldurur). Sayıların birebir tuttuğunu `city-check` ve `check-text` söyler.
