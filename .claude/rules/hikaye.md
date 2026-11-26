---
paths:
  - "components/StoryMode.tsx"
  - "game/stories/**"
  - "lib/storyRules.ts"
  - "tests/story.test.ts"
---

# Hikâye Gezisi

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

**Hikâye Gezisi (21 Kasım 2026).** Modlar → Hikâye Gezisi (`components/StoryMode.tsx`: `StorySetup`, `StoryTalk`, `TalkPrompt`, Defter'deki `MetView`). Sakin Gezi yolu (`LevelDef.calm` + `story`, `customRef`): süre, düşüş sayısı, rekor, skor ve defter yok;
şehir seçilir (CityPicker, açık şehirler), şehir insanına yaklaşınca "Konuş" (E / Enter, dokunma, oyun kolunda LB-RB) konuşmayı açar. Konuşurken fizik akmaz (`talkRef`, oyun döngüsü yalnız çizer), alt panel karakteri örtmez: portre,
ad + yıldızlar, harf harf akan söz (hareketi azalt açıksa anında; Enter hızlandırır), cevap seçenekleri (1-3, ↑↓ + Enter, dokunma, oyun kolu; Esc kapatır, mola açmaz). **Diyalog verisi** `game/stories/<bölge>.ts` (bati, ic, guneydogu, karadeniz,
defter2a, defter2b; `index.ts` birleştirir, anahtar şehir insanının Türkçe adı): selam → üç soru (merak, şaka, saygı) → karakterin tepkisi; her yeni soru bir yıldız (`bond` 0-3), üç yıldızda "defter sayfası" (hediye: şehir bilgisi, kişisel söz).
Metin `[TR, EN]` çiftidir; `{rol}` (Haritacı / Telefoncu) ve `«Uktun’a||Memo’ya»` yolcuya göre küçük fark verir (`fill`). Diyaloğu olmayan kişi kendi kısa sözünü (`text`) söyler. Kayıt `save.story` (ad → bit alanı: 1/2/4 sorulan soru, 8 sayfa okundu,
16 tanışıldı; `lib/storyRules.ts`): buluta gider (`CLOUD_KEYS`), `mergeSaves` bitleri birleştirir (hiçbir tanışma kaybolmaz), `cleanIncoming` temizler (en çok 400 anahtar), `clearProgress` siler; `persist(s => ...)` ile yazılır. Başarımlar
`storyFirst/story10/storyStar/storyAll` kayıttan hesaplanır. **Yeni şehir ya da yeni şehir insanı eklerken** ilk iki kişiye `game/stories/` içinde konuşma yaz (her şehirde en az iki diyaloglu kişi: `tests/story.test.ts` bekler; adlar `levels.ts`'tekiyle aynı).
Metin kuralı: her karakterin sesi kendi mesleği ve şehri; aynı cümle iki karakterde geçmez (test bekler); kişi adı uydurma. Kanıt: `npx vitest run tests/story.test.ts tests/cloud.test.ts`, `ONLY=hikaye node scripts/audit-menus.cjs`.
