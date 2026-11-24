---
name: yeni-parca
description: Var olan bir şehre yeni bölüm parçası, bulmaca, gizli köşe ya da meydan yolu değişikliği ekle ve haritası değişen şehrin bağlı her şeyini (madalya, mücadele kesitleri, kural listeleri, hile önleme) güncelle. "Şu şehre bir bölüm ekle", "bu şehir çok kolay", "meydan yolunu değiştir" dendiğinde kullan.
argument-hint: "<şehir> <ne eklenecek>"
---

# Yeni Parça (var olan şehir)

İş: $ARGUMENTS

## 1. Nerede çalışılır

- Yeni düzendeki şehir (`game/cities/<id>.ts` varsa): ana yol orada, parçalar soldan sağa.
- Eski şehir: ana harita `game/levels.ts`, imza bölümü `scripts/art/sig.py` → `game/signatures.ts`, ek parça `game/extensions.ts`
  (`python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py`).
- Meydan yolu: `game/finales/<id>.ts`. Yasak karakterler `C K $ D P E @ & Q G`, tam bir `!`.
- Haritayı **`level-designer`** ajanı çizebilir. Görev tanımına şunları yaz: şehir, parçanın fikri, tabela ve kişi sırası, zorluk, bütün doğrulama listesi.
  Birden çok şehir ayrı ajanlarla paralel çalışabilir. Ortak dosyalara (`levels.ts`, `render.ts`, `boss.ts`) yalnız ana oturum dokunur.

## 2. Kurallar

`CLAUDE.md` "Bölüm ölçütleri" ve "Tasarım tuzakları": platform ≤ 2 karo, boşluk ≤ 3, bayraklar arası 12-75 karo, baş payı 2 karo,
tünel ağzı 2 karo, ok hattında bayrak/tabela yok, gizli köşe görünür girişli, her şeyi zayıf oyuncu alır ve aldığı yerden çıkar.
Yeni `?` ya da `n` eklenince metin sırası kayar. Doğru sıraya TR (`levels.ts`) ve EN (`content.en.ts` ya da imza dosyası) metnini yaz.

## 3. Haritası değişen şehirde güncellenecekler

| Ne | Komut / yer |
|---|---|
| Bölüm zinciri | `verify-prelude`, `verify-levels`, `verify-respawn`, `verify-items`, `verify-enemies`, `verify-chase`, `audit-difficulty`, `audit-reach`, `audit-clearance` |
| Madalya ve hile önleme | `npx tsx scripts/solver-time.ts <id>` → `game/medals.ts` `SOLVER_TIME` (`tests/antiCheat.test.ts` de okur) |
| Mücadele kesitleri (Zor şehirler) | `npx tsx scripts/verify-challenges.ts`; süre çok oynadıysa `game/challenges.ts` `par` |
| Kural listeleri | Dash'siz `NO_DASH_OK` → `scripts/verify-rules.ts` · Kaygan/Çöken/Ağır/Kısa Dash/Af Yok → `npx tsx scripts/verify-rage.ts <kip> <id>` (listede olan şehir yeniden kanıtlanır) |
| Ayna Yolu (ilk defter) | `npx tsx scripts/verify-mirror.ts <id>` |
| Harita sürümü | elle sayı artırılmaz: `lib/mapVersion.ts` haritanın özetinden üretir, oyuncuya "Yenilendi" rozeti kendiliğinden çıkar |
| Kayıt denetimi | `npx tsx scripts/city-check.ts <id>` (metin sayıları, toplananlar) |

Boss değiştiyse: `npx tsx scripts/bossbot.ts <id>` (dört bot yenmeli) → `BOSS_TIME`, kural için `.claude/rules/boss.md`.

## 4. Görsel ve yayın

`node scripts/preview.cjs <id> x,y out.png` ile yeni parçaya bak (önce eski dev sunucusunu kapat). Sonra `yayinla`.
