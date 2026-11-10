---
description: Oyuna yeni şehir ekle: Bölüm ölçütlerinin sekiz maddesiyle, baştan sona
argument-hint: "<şehir adı> [sıradaki yeri] [zorluk]"
---

Yeni şehir: $ARGUMENTS

`CLAUDE.md` → "Bölüm ölçütleri (kalıcı kural)" ve "Yeni şehir" adımlarını izle. Örnek: Çanakkale, Diyarbakır ve
Sinop'un eklendiği commit (`git log --oneline --grep="Çanakkale"`).

1. **Araştır ve yaz** (ana oturum): şehrin gerçek yerleri (4 bölüm), hatırası, üç bilgisi + gizli bilgisi (tarihler
   doğrulanmış), üç şehir insanı (adlar oyunda yok), dört tabela, boss’u (şehrin bir ayrıntısı; hareket sırası),
   meydan yolunun fikri. Hepsi TR + EN.
2. **Altyapı** (ana oturum): `types.ts` CityKey ekle; `npx tsc --noEmit` eksik kalan her kaydı tek tek gösterir
   (`art.ts` stil + katman + hatıra, `render.ts` tezgâh / simge / NEXT_CITY, `audio.ts`, `flagMoments.ts`, `features.ts`,
   `TurkeyMap.tsx` konum + etiket yeri, `terrainDraw.ts`, `boss.ts`, `bossDraw.ts`, `finales/index.ts`). `levels.ts` kaydı,
   `content.en.ts`, `lib/storage.ts` ORDERS + MAP_VERSION, `tests/sim.test.ts` plaka. Ana yol ve meydan yolu için taslak dosya.
3. **Haritalar** (`level-designer` ajanı, arka planda): `game/cities/<id>.ts` + `game/finales/<id>.ts`; görev tanımına
   bölümleri, sabit tabela / kişi sayısını ve altı doğrulamayı yaz.
4. **Çizim** (ana oturum ya da `artist` ajanı): boss, tezgâh, simge nesne; `node scripts/art/sheet.cjs` ile bak.
5. **Kanıt** (`verifier` ajanı ya da `/dogrula <id>`), sonra `node scripts/art/banners.cjs <id>` ve
   `node scripts/preview.cjs <id> start` + `boss` + `--telefon`.
6. Tanıtım metinlerindeki şehir ve hatıra sayılarını güncelle; tek commit, push, canlıyı kontrol et.
