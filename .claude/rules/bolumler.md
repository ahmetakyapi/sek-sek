---
paths:
  - "game/levels.ts"
  - "game/cities/**"
  - "game/finales/**"
  - "game/extensions.ts"
  - "game/signatures.ts"
  - "game/assists.ts"
  - "scripts/art/*.py"
---

# Bölüm haritaları

Bağlayıcı çerçeve: `CLAUDE.md` → "Bölüm ölçütleri (kalıcı kural)". Burada yalnız işin el kitabı var.

## Harita lejantı (özet; tamamı `game/levels.ts` başında, davranışı `game/sim.ts` constructor'ında)

`#` zemin · `=` tek yönlü · `I` buz · `X` çatlak taş · `^ v` diken · `~` su · `> <` ok tuzağı · `S` yay ·
`M` yatay platform (`|` sınır) · `N` dikey (`:` sınır) · `O` sema halkası · `B` balon · `H J` horon / koçari · `Y` tokmak ·
`i` ıslak taş (katı, kaygan: hızlanma ve durma yavaş) · `p` itilen sandık (yürüyerek itilir, boşluğa düşer, üstüne çıkılır; suya düşerse yerine döner) ·
`[ ]` renkli blok, `_` plaka (Bursa'da gölge/ışık, Van'da gece/gündüz taşı olarak çizilir; kural aynı) · `K D` anahtar, kapı · `%` tünel ağzı (eski adıyla sahte duvar: karanlık bir aralık olarak çizilir, ardındaki cep mağara olur; en az 2 karo yüksek) · `*` dash halkası (toplanmaz, içinden geçilir; havada dash’i yeniler) ·
`P` başlangıç · `F` bayrak · `C` hatıra · `$` pul · `!` nazar boncuğu · `E` çıkış (ana yolda meydan kapısına döner) ·
`?` tabela · `n` kişi · `k` dost hayvan · `e f h c u x j` düşmanlar · süs: `l t s z q w a o b`.

Final karakterleri (`@ & Q G`) elle yazılmaz: `game/finales/index.ts` kurar.

## Katmanlar ve sıra

ana harita → `extend()` → `addSignature()` → `enrich()` (otomatik süs) → `applyAssists()` → `addFinale()`.
Yeni şehirlerin ana yolu `game/cities/<id>.ts`, meydan yolu `game/finales/<id>.ts`.

## Çalışma döngüsü

1. Haritayı yazdır, fikri yaz (dosya başına 2–4 satır yorum).
2. `npx tsx scripts/verify-prelude.ts <id> --goster` (meydan yolu, saniyeler).
3. `HIZLI=1 bash scripts/verify-all.sh <id>` (bölüm, yeniden doğuş, boss).
4. `npx tsx scripts/audit-difficulty.ts <id>` (zayıf oyuncu; Kolay şehirde `--teknik` ile yürü+zıpla da geçmeli).
5. `node scripts/preview.cjs <id> arrival` ile göz at (dev sunucusu 3100'de).

## Çözücünün kör noktaları

- "Aşağı" tuşuna basmaz: tek yönlü platformdan aşağı inişe dayanan yol doğrulanamaz.
- Düşman, ok ve boss yoktur: zamanlamayı sen kur, raporda "oynanarak denenmedi" de.
- Hareketli platform yakınındaki hedefler aramayı yavaşlatır; süre dakikayı geçiyorsa haritayı sadeleştir.
- Anahtar yol dışındaysa anahtarsız durumlar bütçeyi yer: anahtarı yolun üstüne koy.
