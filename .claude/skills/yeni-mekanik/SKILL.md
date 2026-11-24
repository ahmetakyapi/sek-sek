---
name: yeni-mekanik
description: Sek-Sek'e yeni bir oyun mekaniği ya da karo ekle (fizik, çözücü, çizim, ses, düzenleyici, test, doğrulama botları). "Yeni mekanik", "yeni karo", "uçma / yeraltı / buz gibi bir şey ekle" dendiğinde, ya da yeni şehir yeni bir şey getirecekse `yeni-sehir`den önce kullan.
argument-hint: "<mekaniğin adı ve fikri> [karo karakteri]"
---

# Yeni Mekanik

Mekanik: $ARGUMENTS

Bu yol gelgit (`A`, Mersin), yükselen hava (`V`, Balıkesir) ve donan su (`Z`, Elazığ) eklenirken sabitlendi; o üç örneği
`game/sim.ts`'te ara (`TIDE`, `LIFT`, `FROST`) ve aynı kalıbı izle.

## Tasarım kuralları (önce karar ver)

- **Saate ya da duruma bağlı, rastgele değil.** Fizik sabit adımlıdır (1/120 sn). Saate bağlı her şey `w.clock`tan türer:
  aynalı haritada ve co-op'ta aynı işler. Faz sütuna bağlıysa `level.mirror` ile asıl sütundan al (`ox`).
- **Uyar, sonra değiş.** Değişen her şey değişmeden önce görünür bir uyarı verir: yanıp sönme, çatlak, kırağı, köpük.
  Yakındaki oyuncuya ses de çalar (olay türü `game/types.ts` `GameEvent`).
- **Kimse sıkışmaz.** Katılaşan karo oyuncunun içindeyse oyuncu çıkana dek boş kalır (`rhythmHold`, `frostHold`).
- **Tuzak kurmaz.** Su altında beklenen süre nefesten (`AIR.max` 6 sn) kısa olur. Zorunlu yol nitro gibi isteğe bağlı şeye bağlanmaz.
- **Karo karakteri:** kullanılmayan bir harf seç (`game/sim.ts` kurucusundaki `case` listesine ve `lib/customLevel.ts` `SYMBOLS`'a bak).
  Tek tırnaklı dizgide sorun çıkaran `'` gibi karakterleri seçme.

## Dokunulacak yerler

| Dosya | Ne |
|---|---|
| `game/sim.ts` | karo kodu (`export const X = <sıradaki sayı>`), sabitler (belgeli), kurucuda `case`, `has<Mekanik>` bayrağı. `tile()` karonun **o anki** fizik hâlini verir (ICE/SWIM/EMPTY…), ham hâli için `isX()`. Oyuncu durumu gerekiyorsa `Player`e alan + `freshPlayer`. Snapshot oyuncuyu kopyalar. Dünya durumu eklersen `snapshot`/`restore`a da ekle. `updatePlayer` içinde etkisi. Köpek (Kovalamaca) bekleyecekse `buildChaseCalm` |
| `game/types.ts` | yeni olaylar (`GameEvent`) |
| `game/audio.ts` · `scripts/audio-render.cjs` | olayın sesi (`sfx` switch, kısık, makamdan) · efekt listesine ekle |
| `scripts/solver.ts` | saate bağlıysa yakındaki evre `key`e girer (`frostNear` / `rhythmNear` kalıbı). Oyuncu yeni bir "karar verilebilir" durumdaysa (suda, termalde) `runMacro` kısa keser, dal açma koşulu ve `held` anahtarı onu sayar |
| `scripts/verify-enemies.ts` | `rest()`: botun karar verdiği durumlar çözücüyle aynı olmalı |
| `game/terrainDraw.ts` | zemin önbelleği saate bağlı karoyu çizmez: `tileOf` yeni karoyu `EMPTY` sayar (dinamik karo render'da çizilir) |
| `game/render.ts` | `drawX(f, w, cx, cy)`, ön tamponda (`drawWater` yanında), yalnız `w.hasX` ise. Hepsi saatten: `Math.random()` yok. Görünür alanla sınırlı döngü, kare başına nesne ayırma yok |
| `lib/customLevel.ts` · `components/Editor.tsx` · `components/editorScene.ts` | `SYMBOLS` **sonuna** ekle (eski kodlar bozulmaz). Palete `TileDef` ekle (kısayol harfi boşsa `key`siz). `drawTile`'a önizleme çizimi |
| `tests/mechanics.test.ts` | davranış testi (küçük harita, `mk` + `step`): değişim, uyarı, sıkışmama, tasarım kuralı |
| `tests/customLevel.test.ts` | kod gidip gelir, eski simgelerin sırası değişmez |
| `CLAUDE.md` "Tasarım tuzakları" + harita (`sim.ts` satırı) | kural, sabitler, tasarım ölçüsü (ör. "termalin en üst V satırı, inilecek taşın yürüme satırından en az bir satır yukarıda") |

## Kanıt

1. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` ve `npx vitest run tests/mechanics.test.ts tests/customLevel.test.ts`
2. Mekaniğin kullanıldığı şehirde bütün zincir (`yeni-sehir` 3. adım). Mekaniği kullanmayan şehirlerin çözücü anahtarı değişmemeli
   (yeni anahtar parçası mekanik yokken boş dizgi).
3. `npm test` (camera, perf, sim testleri bütün şehirleri dolaşır).
4. Görsel: `node scripts/preview.cjs <şehir> x,y out.png`, saate bağlıysa iki ayrı anda (`--bekle=`). Çizimde ağır iş eklediysen
   üretim derlemesinde `node scripts/verify-perf.cjs`.
5. Renk körü güvenliği: tehlike rengi eklediysen `cbc()` ile sar (`game/colorBlind.ts`, `tests/colorBlind.test.ts`).
