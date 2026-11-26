---
paths:
  - "components/Coop.tsx"
  - "components/Race.tsx"
  - "lib/coopRules.ts"
  - "game/input.ts"
  - "tests/coop.test.ts"
  - "tests/input.test.ts"
---

# Co-op, Düello, Yan Yana Yarış

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

**Co-op.** `World.enableCoop()` eşi (`partner`) kurar; `stepPartner` eşi aynı adımda, oyuncu kaydını geçici olarak eşe
çevirerek yürütür: çarpışma, toplama, tehlike, bayrak, boss'a basma ve çıkış ortak koddan geçer. Kural iki oyuncuya aynı
(kullanıcı kararı, 17 Kasım 2026): biri düşerse bölüm son bayraktan kurulur ve ikisi birden orada doğar (eş düşerse
`stepPartner` `respawn` + `bringPartner`, oyuncu düşerse Coop.tsx `respawn` olayında `bringPartner`). Tuşlar oyuncunun ataması (`save.duoKeys`, `normalizeDuo` / `bindDuo`; Ayarlar → Kontroller "İki Kişilik" ve Co-op /
Yarış molasında `DuoRemap`), varsayılan `DEFAULT_DUO`: solda WASD + Sol Shift, sağda ok tuşları + Enter; her oyuncunun tek dash
tuşu (Sağ Shift kimsede yok: bazı klavyelerde iki Shift karışıyor, biri ötekini dash attırıyordu). Boşluk varsayılanda kimsede yok (tek kişilikte dash Boşluk, alışkanlıkla basılınca öbürünü atıyordu); bir
tuş tek oyuncunun tek eylemi, atanan tuş öbüründen alınır (takas) (`tests/input.test.ts`). Molada değişen tuş hemen uyar (`keysRef`).
**Co-op işbirliği (21 Kasım 2026).** Eş kuralları `sim.ts`te, iki oyuncuya aynı: **Kurtarma** (`World.rescue`, `RESCUE_TIME` 3 sn, `updateCoop`):
biri düşünce öbürü ayaktaysa bölüm bayraktan kurulmaz, düşen son sağlam yerinde (`lastSafe`) balonda bekler (`World.downed`), öbürü balona
değerse kurtarıcının yanında kalkar (`rescue` olayı), süre dolarsa eskisi gibi bayraktan kurulur; ikisi birden düşerse balon yok. Kurtarma
kolaylaştırdığı için rekoru ayrıdır (`coopKey` sonu `:kurtar`, kapalıyken eski anahtar). **Eşi Fırlat** (`shoulder`, `THROW_BOOST` 1,6): inen
omuz sekmesinde alttaki de zıplıyorsa (`buffer` ya da yukarı hız) sekiş yükselir, olay `thrown` taşır. **İşaretler** (`World.ping`, `PING_LIFE`):
1. oyuncu 1-4, 2. oyuncu 7-0 (Burada, Bekle, Dikkat, Aferin; `lib/coopRules.ts` `pingFromKey`, oyuncunun hareket tuşu olan rakam işaret
sayılmaz), oyun kolunda LB / RB. Saf kurallar (pay, `credit`, `coopAwards` kişisel ve ikili unvanlar, `legTimes`) `lib/coopRules.ts`te,
testi `tests/coop.test.ts` ve `tests/mechanics.test.ts` "co-op: Kurtarma, Fırlatma, işaret". `Coop.tsx`: önce **Hazır mısınız?** (ikisi de
zıpla/dash tuşuna ya da oyun kolunda A'ya basar, kural kartları ve işaret tuşları orada), sonra geri sayım; başın üstünde renkli ad etiketi,
ayakta halka, işaret balonu ve kurtarma balonu üstteki ikinci tuvalde (`drawTags`, kamera `camX/viewW` ile izdüşüm). Bitişte bayrak süreleri,
rekora fark, ikili unvanlar, "Tekrar" / "Başka Şehir". Sunucu sıralaması yok (iki yolcu tek cihazda, tek hesap kimliği yok; düello ve Co-op
"Her moda sıralama" dışında kalır). Sim'e eş kuralı eklersen `updateCoop`a yaz.

Boss Kapışması (`CoopSetup` kipi): seçilen boss'un arenası (`coopLevel`), isteğe bağlı ikinci boss `LevelDef.bossOf2`
(`World.boss2`: kapı ikisi de düşünce açılır) ve zorluk `bossBoost` (kademe + hız; Normal, Öfkeli, Kâbus). Kamera ikisinin ortasına
bakar; uzaklık görünür alanın %80'ini aşınca geride kalan öne ışınlanır. Düşmanlar ve boss'un nişanı yalnız oyuncuyu izler.
Co-op ilerlemeye ve şehir rekoruna dokunmaz; ikilinin kendi rekoru `save.coop` (`coopKey`: `yol:<şehir>`, `parkur:<mücadele>`,
`boss:<a>+<b>:<zorluk>`). Kipler `CoopPlan.mode`: Şehir Yolu, Boss Kapışması, Parkur (ALL_CHALLENGES, şehri bitirilmiş olanlar).
Kurallar: Ortak Can (`lives`, düşüşler biterse yolculuk biter), Kısa İp (ip ekranın %45'i), Zamana Karşı (`coopLimit`: gümüş
süre; boss'ta boss başına 75 sn). **Omuz sekmesi** (`sim.ts` `shoulder`, `SHOULDER_BOOST`): eşin başına inerken zıplama
basılıysa ~3,5 karo seker, basılı değilse yana kısa hop (başta takılı kalınmaz). Olaylar onları üreten adıma göre oyunculara
yazılır (`credit`: step 1. oyuncu, stepPartner 2. oyuncu); bitişte "Kim Ne Yaptı" ve unvanlar (`coopAwards`). Tek oyun kolu
takılıysa 2. oyuncunun olur. Sim'e oyuncuya özel yeni durum eklersen eşin de taşıdığından emin ol
(`tests/mechanics.test.ts` "co-op eşi", "omuz sekmesi").

**Düello.** `DuelSetupValue`: tur 1/3/5 (`duelResult` yarısından fazlasını alan), şehir ya da parkur (`course`, `duelLevel`),
şartlar `terms` (`DuelTerms`: düşüş cezası 0/5/10, Hatıra Avı −5 sn, oyuncu başına avantaj); skor `duelScoreWith`; **Tek Can** (`terms.oneLife`, yalnız Yan Yana Yarış: ilk düşüşte o oyuncunun turu biter, bitiremedi sayılır);
Yan Yana Yarış bayrak sürelerini tutar (`DuelRun.splits`), bitişte "Bayrak Bayrak" (`legDuel`). Eski
kurulumlar şartsız gelir (`duelTerms`: sırayla 5 sn ceza, yan yana cezasız).
