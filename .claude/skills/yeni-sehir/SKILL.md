---
name: yeni-sehir
description: Sek-Sek'e yeni şehir ekle, baştan sona: araştırma, iskelet, harita, meydan yolu, boss, çizim, ses, metin (TR+EN), hikâye diyaloğu, kayıt geçişi, doğrulama ve yayın. "Yeni şehir ekle", "X şehrini yap", "iki şehir daha" dendiğinde kullan. Argüman: şehir adı(ları), isteğe bağlı zorluk.
argument-hint: "<şehir adı> [zorluk] [yeni mekanik fikri]"
---

# Yeni Şehir

Yeni şehir: $ARGUMENTS

Bu yol 24 Kasım 2026'da Balıkesir ve Elazığ eklenirken baştan sona yürünüp sabitlendi. Şehir, `CLAUDE.md` "Bölüm
ölçütleri"ndeki sekiz maddenin hepsi sağlanınca ve `npx tsx scripts/city-check.ts <id>` OK verince eklenmiş sayılır.
Bir şehir ~25 dosyaya dokunur. Tip denetimi bunların yarısını yakalar, `city-check` öbür yarısını.

## 0. Karar (sormadan ver, raporda gerekçele)

- **Şehir:** oyunda olmayan bir il seç (`LEVELS` id listesi: `npx tsx -e "import {LEVELS} from './game/levels'; console.log(LEVELS.map(l=>l.id).join(' '))"`).
  Şehri kendine has kılan dört gerçek yer seç (ana yolun dört parçası) ve meydan yolu için bir yer daha.
- **Zorluk:** etiket ve boss kademesi birlikte seçilir: Kolay → kademe 1, Orta → 2, Zor ve Çok Zor → 3.
- **Mekanik:** şehir yeni bir şey getirsin. Var olanlar: halat, teleferik, derin su, gelgit, ritim, nitro, sandık, rüzgâr, yükselen hava,
  donan su. Yeni mekanik eklenecekse önce **`yeni-mekanik`** yeteneğini izle; şehrin haritası mekanik bittikten sonra çizilir.
- **Hatıra, boss, insanlar:** hatıra şehrin bir yiyeceği ya da el işidir. Boss şehrin bir ayrıntısından doğar, dost hayvanla aynı tür olmaz.
  Dört şehir insanından ilki esnaftır ve şehrin ustasıdır; yanına tezgâh `s` konur. Kişi adları oyun genelinde tekrar etmez:
  `grep -rn "<Ad>" game/levels.ts game/finales game/signatures.ts game/extensions.ts game/cities game/stories` boş dönmeli.
  Bir adı yalnız tam adıyla değil, ilk adıyla da ara.
- **Bilgiler:** tarih ve sayı doğrulanmış olsun. Emin değilsen yuvarla ("12. yüzyılda", "yüzlerce tür").

## 1. İskelet (ana oturum; bitince `npx tsc --noEmit` temiz olur)

Sırayla yaz. Tip denetimi her eksik `Record<CityKey,…>` kaydını tek tek gösterir.

| Dosya | Ne |
|---|---|
| `game/types.ts` | `CityKey`'e id (sona) |
| `game/levels.ts` | `import { road as <id>Road } from './cities/<id>'`; `LEVELS` kaydı (son şehrin ardına): ad, takma ad, plaka, alt başlık, zorluk, Gezgin notu, 4 kişi, 4 laf (quips), hatıra, giriş, 3 bilgi + gizli bilgi, 5 tabela (ana yolun soldan sağa sırası). `DECOR_CYCLE` satırı |
| `game/content.en.ts` | `LEVELS_EN[<id>]`: aynı alanların İngilizcesi, aynı sayıda |
| `game/cities/<id>.ts` | taslak ana yol (tek parça: P, 5 `?`, 4 `n`, 3 C, $, F, E). Haritayı ajan doldurur |
| `game/finales/<id>.ts` + `finales/index.ts` | taslak meydan yolu (1 `?`, 1 `n`, 1 `!`, hints/hintsEn, npcs/npcsEn) ve `PRELUDES` kaydı |
| `game/art.ts` | `CITY[<id>]` paleti; `buildLayers` içinde geçici `case` (çizer ajanı kendi katmanını yazar) |
| `game/boss.ts` · `game/bossLines.ts` | `BOSSES` (ad TR/EN, can, hareket sırası, hız, kademe, kutu, taunt TR/EN) · üç laf |
| `game/flagMoments.ts` · `game/features.ts` · `game/music.ts` | dört bayrak sözü (TR/EN) · şehrin özellik satırı · makam (`SCALES`) |
| `game/terrainDraw.ts` | `LOOK` (zemin malzemesi + örtü) |
| `game/render.ts` | `NEXT_CITY`: bir önceki son şehrin değeri yeni şehrin adı olur, yeni son şehir `null` |
| `components/TurkeyMap.tsx` | `COORDS` [boylam, enlem] |
| `lib/storage.ts` | `MAP_VERSION` +1; eski sıra (`FORTY_TWO` gibi) ve `ORDERS[eski sürüm]` |
| `lib/customLevel.ts` | `CITY_CODES` sonuna (yalnız sona) |
| `tests/sim.test.ts` · `tests/cloud.test.ts` | plaka listesi · `mapNews` beklentileri (her listeye yeni id + yeni sürümden gelen oyuncu satırı) |
| `game/stories/<dosya>.ts` + `index.ts` | ilk iki kişiye Hikâye Gezisi diyaloğu (selam, üç soru, defter sayfası; TR/EN, aynı cümle iki kişide geçmez) |
| `.github/workflows/ci.yml` | matris + (çözücüsü uzunsa) 75 dk listesi |
| `components/Game.tsx` `RELEASE_NOTES` + `lib/ui.en.ts` | "Bu Sürümde" satırları (anahtar: sıradaki ilk yeni şehrin id'si) |
| `app/layout.tsx`, `app/hakkinda/page.tsx`, `scripts/art/icons.cjs`, `README.md` | şehir ve hatıra sayıları, README tablosuna satır |

Hızlı kanıt: `npx tsc --noEmit` ve `npx vitest run tests/story.test.ts tests/cloud.test.ts tests/customLevel.test.ts`.

## 2. Paralel iş (ajanlar arka planda; ana oturum bu sırada metinlere, testlere, kayıtlara bakar)

Her şehre bir **`level-designer`** ve iki şehre birlikte tek bir **`artist`** ajanı aç, hepsini aynı mesajda.
Görev tanımı ajanın tek bağlamıdır. İçine şunları yaz:
- dokunabileceği dosyalar (tasarımcı yalnız `game/cities/<id>.ts` ve `game/finales/<id>.ts`). Ortak dosyalara dokunmaz, metin değişikliği önerir.
- parça parça ne anlatılacağı: tabela ve kişi sırası, hatıranın, pulun ve nazarın tarifi (kişi metinleriyle aynı)
- yeni mekaniğin tam kuralı (sabitler, çözücünün davranışı, tasarım kuralı)
- bütün doğrulama listesi (aşağıda 3) ve "commit atma"
- **çizer ajanı:** `art.ts` katmanları, `enemyDraw.ts` `KEEPSAKES` (hatıra), `bossDraw.ts` `PAINT` (boss), `render.ts` tezgâh `s` ve simge `z`
  (`case '<son şehir>'` bloklarının yanına). Önizleme için **boş bir port** ver (3103 gibi). 3100'de başka oturumdan kalmış eski sunucu olabilir.

Ajan raporu kanıt değildir: ajan bitince değişen dosyaları ve doğrulamaları kendin koş.

## 3. Kanıt (hepsi OK olmadan şehir bitmedi)

Şehir başına, ayrı süreçlerde paralel (`xargs -P 6`):
`verify-prelude` · `verify-levels` · `verify-respawn` · `verify-items` · `verify-enemies` · `verify-chase` · `audit-difficulty` ·
`audit-reach` · `bossbot` · `audit-clearance`.
Sonra `npx tsx scripts/solver-time.ts <id>` → `game/medals.ts` `SOLVER_TIME`; bossbot'un "insan paylı" süresi → `BOSS_TIME`.
En son `npx tsx scripts/city-check.ts <id>`, `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, `npm test`, `npm run build`.

Yeni mekanik bir doğrulama botunu takarsa (bugün `verify-enemies` yükselen havada takıldı), haritayı değil botu düzelt:
bot da çözücüyle aynı durumlarda karar vermeli.

## 4. Görsel

- Dev sunucusu: önce eski sunucuyu kapat (`pkill -f "next dev"`; gerekirse `ps aux | grep next-server` ile bulunan süreç),
  sonra `npx next dev -p 3100`. Günlükte `EADDRINUSE` varsa sayfa **eski kodu** gösterir: şehir görseli Aydın gibi başka bir şehirden çıkar.
- `node scripts/preview.cjs <id> start|arrival|boss|x,y out.png` çıktısını Read ile aç. Saate bağlı mekaniği iki ayrı anda çek (`--bekle=900`, `--bekle=3300`).
- `node scripts/art/banners.cjs <id>` (şehir kartı ve kartpostal görseli). Çıkan `public/sehirler/<id>.webp`'yi aç, gerçekten o şehir mi bak.
- `node scripts/art/icons.cjs --og` (paylaşım görselindeki sayılar). Yanında değişen ikon PNG'leri gereksizse `git checkout` ile geri al.
- "Yolda Neler Değişti" notu: `mapVersion` bir eksik bir kayıtla, `?debug` olmadan aç. Yeni şehirler ve "Bu Sürümde" satırları görünmeli.

## 5. Yayın

`yayinla` yeteneğini izle: tek ve anlamlı commit (`feat(sehir): …`, gövde madde madde). Ara kayıtlar çalışma dalında kalır,
`main`'e squash edilerek tek commit gider. Push, Vercel READY ve canlı sayfa denetimi.

## Öğrenilenler

- Termal, donan su, gelgit gibi saate bağlı mekanik çözücüyü yavaşlatır. Bölgeleri dar tut: Elazığ'ın ilk meydan yolunda havuz geniş ve derindi, çözücü 5 dk sürdü ve zayıf oyuncu takıldı.
- Pul ve nazarın yeri çözücüyü çok etkiler: bir karo kaydırmak 220 sn'yi 1,6 sn'ye indirdi.
- Zor ve Çok Zor şehirde verify-levels birkaç dakika sürebilir; CI'da şehri 75 dk listesine yaz.
- Taslak harita `hints` sayısıyla uyuşmasa da derlenir (`addFinale` boşlukla doldurur). Sayıların birebir tuttuğunu `city-check` söyler.
