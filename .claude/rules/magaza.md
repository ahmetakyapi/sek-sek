---
paths:
  - "components/Shop.tsx"
  - "components/HeroTurntable.tsx"
  - "components/Portrait.tsx"
  - "game/accessories.ts"
  - "game/accessoryDraw.ts"
  - "game/looks.ts"
  - "game/hairDraw.ts"
  - "game/stance.ts"
  - "game/portraitDraw.ts"
  - "game/heroDraw.ts"
  - "scripts/art/accessories.cjs"
  - "scripts/art/looks.cjs"
---

# Mağaza, görünüm, duruş

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

**Mağaza.** Bütün kılık tek yerde (`components/Shop.tsx`), **iki yolcu ayrı ayrı** giydirilir (Uktun ve Memo sekmeleri, "Öbürüne Kopyala"):
baş, yüz ve sırtta birer parça (kombin, `Kit`; kayıtta `save.kits[yolcu]`) ve atkı rengi (`save.scarfs[yolcu]`, nazar boncuğuyla açılır).
Eski ortak `kit` / `accessory` / `scarf` ilk yüklemede (`normalizeSave`) iki yolcuya kopyalanır, okuma `kitOf(save, yolcu)` /
`scarfIdOf(save, yolcu)` ile (geriye düşer; bulut birleşmesi yolcu başına). Parçaların `for` alanı var: `for: 'uktun'|'memo'` yalnız o
yolcunun dolabında görünür (her yuvada en az üç özel parça), alanı olmayan ortaktır. **Sahiplik yolcuya özgü**: `owned['uktun:fiyonk']`
(`ownedKey`, `hasAccessory`); düz kimlik (`owned['fes']`) karakter ayrımından önce alınmıştır ve iki yolcuya da açıktır. Para birimi
**parça**: hatıra, pul, nazar 1 · yenilen boss 2 · Usta Mührü 3 (`earned`); kazanç iki yolcuya da tamdır, her yolcunun cüzdanı kazanç
eksi kendi dolabında alınanların fiyatıdır (`walletOf(kazanç, owned, yolcu)`). Fiyatlar, bütün oyunun parçasıyla her yolcunun dolabının
tamamı (aksesuarlar + ücretli görünüm seçenekleri, `closetPrice`) alınacak biçimde, oyunun parçasının %80-100'ü (`tests/extras.test.ts` bekler; 21 Kasım 2026: görünüm gelince eski aksesuar fiyatları ~%30 indirildi). Co-op / Düello / Yarış'ta her oyuncu seçtiği karakterin kılığını giyer
(`Coop` / `Race` `looks`). Yeni aksesuar: `ACCESSORIES` (yuva, fiyat, `for`) + çizim: baş ve yüz parçaları `game/accessoryDraw.ts`
(`drawHeadItem` / `drawFaceItem`: tek yazım, `HeadFrame` ile hem oyundaki karakter hem portre çizer), sırt parçaları aynı dosyada
oyun ve portre için ayrı (`drawHeroBack`, `drawPortraitBack`); eski ortak parçalar heroDraw / portraitDraw içinde. Föy:
`node scripts/art/accessories.cjs`. `seals` verilen aksesuar parayla alınmaz, o kadar Usta Mührüyle açılır (Altın Defne Tacı: 10).
Yolcu (Uktun / Memo) şehir kartında seçilir; molada değişirse onayla şehrin başına dönülür (yalnız düz şehir koşusunda, `plainRun`).

**Görünüm ve duruş (21 Kasım 2026).** Mağaza iki sıra sekme: Kılık (Baş, Yüz, Sırt, Atkı) ve Görünüm (Saç, Ten ve Göz, Kıyafet, İfade, Duruş). Dokuz eksen
`game/looks.ts` LOOK_AXES (saf veri, çizimsiz): saç stili `hs` (ön saç `front` + arka saç `back`: kendi saçı, kısa, at kuyruğu, topuz, örgü, küt, kıvırcık, kazıma, omuz saçı;
`for` ile yolcuya özgü), saç rengi `hc`, ten `sk` (6), kıyafet rengi `oc` ve deseni `op` (çizgili, puantiyeli, ekose, yıldızlı, zigzag), göz rengi `ey`, ifade `ex`
(neşeli, uykulu, şaşkın, kurnaz, sevecen), bekleme duruşu `st`, koşu tarzı `rs`. Kayıt `save.looks[yolcu]` (`LookPrefs`, eksen → seçenek kimliği; yoksa ya da yolcunun
kendi değeriyse varsayılan görünüm, eski kayıt bozulmaz); bulutla (`CLOUD_KEYS`) yolcu ve eksen başına birleşir (`mergeLooks`), `cleanIncoming` / `normalizeLook`
bilinmeyeni düşürür, `clearProgress` siler. **Görünüm kombinle gezer**: `Kit.look` (kitOf birleştirir), bu yüzden `acc` / `accessory` geçen her yer (oyun, eş, portre,
profil) otomatik uyar; `kitKey` görünümü de içerir. `normalizeLook` aynı içeriği aynı nesneye tekilleştirir: `resolveSkin` (heroDraw) kimlik karşılaştırmasıyla önbellekler, kare başına nesne ayrılmaz.
Sahiplik `owned['uktun:hs:topuz']` (`lookKey`, `hasLook`; fiyatı 0 olan herkesin), cüzdan `walletOf` hepsini sayar, satın alma `Game.tsx` `buyLook`. Saç parçalarının
tek yazımı `game/hairDraw.ts` (arka saç ve topuz, `HeadFrame` ile oyun ve portre); ön saç biçimleri ve kazıma heroDraw / portraitDraw içinde; desen `drawPattern`; ifade
göz / kaş / ağız heroDraw ve portraitDraw'da. Yeni seçenek: `LOOK_AXES` + (saç / renk ise) ilgili tablo + çizim, sonra föy `node scripts/art/looks.cjs [çıktı.png] [sac|renk|ifade|durus|kosu|taban]`.
Yeni aksesuarlar: Uktun kedikulak, tavsan, yildizgoz, kanat; Memo melon, kask, vizor, jet.
**Duruşlar** `game/stance.ts` (saf poz kodu, tampona yazar): `idlePose` = taban duruş (rahat, eller belde, kollar bağlı, eller cepte; "bakınır" ve "esneyip durur" aynı tabana
farklı hareket sırası verir) + nefes, göz kırpma, saç ve atkı esintisi; kıpırdamadan 3 sn sonra duruşun hareket sırası (etrafa bakınma, ayak oynatma, esneme, el sallama;
`STANCES.moves`, her hareket 6,6 sn'lik dilimde). Koşu tarzları `heroDraw.gaitInto(out, evre, hız, tarz)` (normal, sportif, tırıs: adım sıklığı ×2, tek omuz). `Pose`ta `head`, `gaze`,
`mouth: 'yawn'` alanları var. Oyuncu, Co-op eşi (`heroAnim`) ve hayalet (`drawGhostRun`) aynı kodu çağırır; hayalet kendi duruşunu bilmez (kayıtta yok), varsayılanı gösterir.
Poz tamponları `HeroAnim.out/tmp`, `Renderer.ghostPose`: kare başına poz nesnesi ayrılmaz (dash izi kopya alır). İniş sönümlü yaydır (`HeroAnim.landT`: çökme sonra hafif uzama),
kalkışta daha çok uzama, tepede yuvarlaklaşma. Mağaza önizlemesi `demoPose` (Döngü, Dur, Koş, Zıpla) oyundaki pozla aynı kodu kullanır.

**360° önizleme (26 Kasım 2026).** `components/HeroTurntable.tsx`: sürükle, ←/→ (çeyrek tur), Döndür; dört görüş (yan sağ, ön, yan sol,
arka) arasında kısa yatay sıkıştırma + çapraz geçiş (en dar anda gövdenin ~%62'si dolu). Önden ve arkadan tam boy çizim yalnız Mağaza
içindir: `game/heroTurn.ts` `drawHeroTurn`; yüz portrenin parçalarından (`portraitDraw.ts` `drawTurnHead`), sırt eşyası oyundaki yan
çizimden (`heroDraw.ts` `drawBackGear`). Oyundaki karakter yan görünüşte kalır. Yeni aksesuar ya da görünüm eklerken dört görüşte de bak.
Portrelerin ilk karesi önbellekte (`components/Portrait.tsx`): sekme geçişinde boş kare yok.
