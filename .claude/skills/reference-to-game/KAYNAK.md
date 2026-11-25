# Kaynak

Bu skill [gokayfem/reference-to-game](https://github.com/gokayfem/reference-to-game) deposundan, `6a00e491` commit'inden
olduğu gibi alındı (yalnız `skills/reference-to-game/` klasörü; örnek oyunlar ve görseller alınmadı: onlar MIT kapsamında değil).
Lisans MIT (`LICENSE`), emek notu `CREDITS.md`. Güncellemek için yukarıdaki depodan klasörü yeniden kopyala; burada elle düzeltme yapma.

Sek-Sek'te ne zaman: bir görselden, kısa videodan ya da çizimden yeni bir şehir, mod, boss ya da kılık istendiğinde görsel kimliği
korumak için (renk ilişkileri, siluet, malzeme, hareket). Oyunun kendi kuralları önce gelir: `CLAUDE.md` "Görsel dil" (vektör, boyalı
görünüm) ve "Bölüm ölçütleri"; skill'in varsayılan Three.js yolu bu oyunda kullanılmaz.

İlk büyük kullanım (25 Kasım 2026): kullanıcının paylaştığı el boyaması oyun videosundan bütün oyunun görsel ve ses dili.
Yöntem, sonraki referanslar için de: videodan 3 sn arayla kare ve karakter yakın kesitleri (`ffmpeg -vf fps=1/3`, `crop`),
montajla bak; sesin spektrumunu çıkar (`showspectrumpic`: davul var mı, uzun tutulan notalar, kuş/rüzgâr) ve `ebur128` ile
yüksekliği ölç. Aynı kadrajda öncesi/sonrası ekran görüntüsüyle (`scripts/preview.cjs`, 4 şehir yan yana) en büyük farkı
düzelt, yeniden bak. Sonuç: `game/atmosphere.ts` (ışık, renk tonu, bulut, süzülenler, ön plan, `paintLayer`),
`game/ambience.ts` (doğa sesi), davulsuz beste; kurallar `.claude/rules/cizim.md` "Atmosfer" ve `.claude/rules/ses.md`. Görsel üretme (`fal`) yalnız
kullanıcı açıkça isterse ve `FAL_KEY` sunucu ortamındaysa; anahtar depoya girmez.
