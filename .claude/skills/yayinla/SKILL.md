---
name: yayinla
description: Sek-Sek'te biten bir işi doğrulayıp tek commit olarak main'e al ve canlıyı denetle (her push canlıya çıkar). "Bitince maine al", "yayınla", "canlıya çıkar", "pushla" dendiğinde ya da bir iş bittiğinde kullan.
argument-hint: "[değişen şehirler]"
---

# Yayınla

Değişen: $ARGUMENTS

`main`'e her push Vercel'de canlıya çıkar. Yarım iş `main`'e gitmez, parça parça commit atılmaz (`CLAUDE.md` "Altın kurallar").

## 1. Doğrula (sırayla; biri FAIL ise dur, düzelt)

1. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
2. `npm test`
3. Değişen şehirler: `bash scripts/verify-all.sh <id ...>` ya da ayrı süreçlerde paralel (`xargs -P`).
   Yeni ya da değişen şehirde ayrıca `verify-chase`, `audit-difficulty`, `audit-clearance` ve `npx tsx scripts/city-check.ts <id>`.
   Fizik, çözücü ya da ortak harita kodu değiştiyse bütün şehirler (`bash scripts/verify-all.sh`; uzun sürer, arka planda).
4. `npm run build`. Sunucuda dosya okuyan yeni yer ya da ağır paket eklendiyse fonksiyon boyutunu ölç (`CLAUDE.md` "Yayın boyutu").
5. Görsel değişiklikte ekran görüntüsü (`scripts/preview.cjs`, `scripts/audit-menus.cjs`). Çizim ya da kamera değiştiyse üretim derlemesinde `verify-perf`.
6. API değiştiyse `tests/scores.test.ts` / `tests/maps.test.ts` ve `CLAUDE.md` "Güvenlik" sırası.

## 2. Tek commit

- Mesaj Türkçe: `feat|fix|refactor|docs(kapsam): açıklama`. Gövdede madde madde ne değişti. Model adı yazılmaz.
  Oturumun istediği imza satırları (Co-Authored-By, Claude-Session) en sonda.
- Çalışma dalında ara kayıtlar (`wip`) varsa `main`'e tek commit olarak gider:
  `git fetch origin main && git checkout -B yayin origin/main && git merge --squash <çalışma dalı> && git commit` (mesaj yukarıdaki gibi).
  Sonra `git push origin yayin:main`. Çalışma dalını `main`'e eşitle: `git checkout <dal> && git reset --hard origin/main`, push gerekiyorsa `--force-with-lease`
  (yalnız kendi dalında).
- `.env*`, sırlar, `tsconfig.tsbuildinfo` gibi üretilmiş dosyalar commit'e girmez (`git status` ile bak).
- Kullanıcı ayrıca istemedikçe PR açılmaz.

## Ara kayıt da derlenmeli

Çalışma dalına her push Vercel'de **önizleme dağıtımı** başlatır. Derlenmeyen ara kayıt (`wip`) dağıtım listesinde ERROR olarak
görünür (24 Kasım 2026: çizer ajanı boss çizimini eklemeden atılan ara kayıt). Push'tan önce, ara kayıt bile olsa,
`npx tsc --noEmit` temiz olmalı. Derlenmiyorsa yerelde commit'le, push etme.

## 3. Canlıyı denetle

- Dağıtım: son dağıtımlarda (çalışma dalının önizlemeleri dahil) ERROR var mı bak; varsa günlüğünü oku (`/v3/deployments/<uid>/events?builds=1`) ve düzelt.
  `VERCEL_TOKEN` ortamdaysa `curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v6/deployments?app=sek-sek&limit=1"`
  ile en son dağıtımın `state`'i `READY` olana dek bekle (birkaç dakika). `ERROR` ise derleme günlüğüne bak, göç satırlarını (`uygulandı:`) da oku.
- `https://sek-sek.vercel.app` açılıyor mu (`curl -sI`, 200). Yeni şehir ya da ekran varsa ilgili sayfa (`/sehir/<id>`) da açılsın.
- Kullanıcıya kısa rapor: ne çıktı, hangi doğrulamalar geçti, canlıda ne görülür, bilinen eksik varsa açıkça.
