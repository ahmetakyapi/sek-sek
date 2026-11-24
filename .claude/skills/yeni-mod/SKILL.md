---
name: yeni-mod
description: Sek-Sek'e yeni oyun modu ekle (Modlar ekranında kutucuk, kurulum ekranı, kurallar, bitiş, kayıt, isteğe bağlı sunucu sıralaması). "Yeni mod", "şöyle bir oyun kipi", "Boss Rush gibi bir şey" dendiğinde kullan.
argument-hint: "<modun adı ve fikri>"
---

# Yeni Mod

Mod: $ARGUMENTS

Kalıcı kural: mod ilerlemeye, şehir rekoruna ve deftere dokunmaz (`CLAUDE.md` "Yeni mod", "Modlar ekranı", "Her moda sıralama").
Önce benzer bir modu örnek al: tek şehirde kurallı koşu için Kurallı Koşu / Sinir Bozucu (`lib/extras.ts` `DAILY_RULES`),
şehirler zinciri için Boss Rush / Maraton (`rushRef`), kesit için Mücadeleler (`challengeRef`), sakin gezinti için Sakin Gezi (`customRef` + `LevelDef.calm`).

## 1. Saf mantık önce (testli)

- Kurallar, skor ve seçim saf işlev olarak `lib/extras.ts`'e ya da kendi `lib/<mod>.ts` dosyasına yazılır. Fizik değişiyorsa
  `LevelDef` bayrağıyla yazılır (`ruleLevel` kalıbı) ve yalnız kanıtlanmış şehirlerde açılır (`*_OK` listesi + `scripts/verify-rage.ts` kalıbı).
- Testi `tests/extras.test.ts` (ya da yeni test dosyası) yazılır: deterministik seçim, skor, birleşme (`merge*`), temizleme (`clean*`).
- Kayıt gerekiyorsa `lib/storage.ts`: `Save` alanı, `CLOUD_KEYS`, `mergeSaves` (hiçbir ilerleme kaybolmaz), `cleanIncoming`, `clearProgress`.
  Yazım her zaman `persist(s => …)` ya da `patch({…})` ile yapılır, render anındaki `save` kopyasıyla yazılmaz.

## 2. Modlar ekranı (hepsi birlikte)

- `lib/modeHints.ts`: `ModeId`, `TILE_ORDER` (sayı tuşları bu sıraya bağlı), `NAME`, `MODES` (zorluk, kişi, sıralamalı mı, `isNew: true`,
  `howto` adımları, `tags`), gerekiyorsa `recommend`.
- `components/Modes.tsx`: `ModesHub`'da doğru `TileGroup` içine `ModeTile` (Yol, Meydan Okuma, Birlikte, Üret, Keşfet ve Dinlen).
  Sıralaması varsa 🏆 (`onBoard`). Kilitliyse nasıl açılacağını söyler.
- İlk girişteki "Nasıl Oynanır" kartı `howto`dan gelir.

## 3. Oyun akışı

- `components/Game.tsx`: `Screen` türüne kurulum ve bitiş ekranları; mod başlatıcı (`start<Mod>`), ilgili ref'i doldurur ve öbürlerini boşaltır.
  `finish()` içinde kendi dalı. HUD ve Mola'da `modeLabel`. Mola eylemleri (Checkpoint, Baştan Başla, Çıkış) modun kuralına uysun:
  kuralda checkpoint yoksa düğme kapalı, tek haklıysa çıkış onayı bunu söyler.
- Menüye dönüşte ref'ler sıfırlanır (`useEffect` "menüye dönünce koşu ve mod biter" listesine yeni ekranı ekle).
- Geri düğmesi `pixel-btn back-btn` + `data-back`. Metin `t('…')` + `lib/ui.en.ts`, başlık ve düğmeler Title Case.
- Şehir seçecekse `components/CityPicker.tsx`, yolcu seçecekse `components/HeroPicker.tsx` (yeniden yazma).

## 4. Sıralama (yalnız karşılaştırılabilir skorsa)

`lib/scoreKey.ts` anahtar · `lib/antiCheat.ts` `minScoreMs` alt sınırı · `app/api/scores/route.ts` parseRun + GET ·
`tests/scores.test.ts` (güvenlik blokları dahil: CSRF, hız sınırı) · Skor Tablosu sekmesi. Rastgele içerikli modlar (Maraton gibi) sunucuya girmez.

## 5. Kanıt

- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, `npm test`.
- `scripts/audit-menus.cjs` `SCREENS`'e yeni ekranlar; sunucu açıkken `ONLY=<ekran> node scripts/audit-menus.cjs`: dört boyutta taşma yok.
- Oyun içinden ekran görüntüsü (Playwright betiği ya da `scripts/preview.cjs`) ve Mola'yı açıp Devam Et / Çıkış'ı dene.
- Sürüm notu: `components/Game.tsx` `RELEASE_NOTES` (yeni şehirle geliyorsa) ve `CLAUDE.md`'ye kısa bölüm.
- Yayın için `yayinla` yeteneği.
