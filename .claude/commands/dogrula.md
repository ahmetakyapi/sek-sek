---
description: Tam doğrulama zinciri (tip, test, bölüm, yeniden doğuş, patron, derleme); değişen şehirler ya da hepsi
argument-hint: "[şehir ...]"
---

`bash scripts/verify-all.sh $ARGUMENTS` komutunu çalıştır (argüman yoksa bütün şehirler; uzun sürer, arka planda koş ve
bitince sonucu özetle). Ardından değişen her şehir için `npx tsx scripts/audit-difficulty.ts <id>` çalıştır.

Sonucu şehir başına tek satırlık tabloyla ver. Bir adım ✗ ise ilgili `…/seksek-verify/<şehir>.log` dosyasının son
satırlarını göster ve nedenini bul; düzeltmeden "geçti" deme. Push etme: yalnız rapor.
