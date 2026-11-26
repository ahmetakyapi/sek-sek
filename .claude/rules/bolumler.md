---
paths:
  - "game/levels.ts"
  - "game/cities/**"
  - "game/finales/**"
  - "game/extensions.ts"
  - "game/signatures.ts"
  - "game/assists.ts"
  - "scripts/art/*.py"
  - "game/sim.ts"
  - "game/medals.ts"
  - "scripts/solver.ts"
  - "scripts/verify-*.ts"
  - "scripts/audit-*.ts"
  - "scripts/new-city.ts"
  - "scripts/check-text.ts"
  - "scripts/city-check.ts"
  - "tests/sim.test.ts"
  - "tests/mechanics.test.ts"
---

# Bölüm haritaları

Bağlayıcı çerçeve: `CLAUDE.md` → "Bölüm ölçütleri (kalıcı kural)". Burada yalnız işin el kitabı var.

## Harita lejantı (özet; tamamı `game/levels.ts` başında, davranışı `game/sim.ts` constructor'ında)

`#` zemin · `=` tek yönlü · `I` buz · `X` çatlak taş · `^ v` diken · `~` su · `> <` ok tuzağı · `S` yay ·
`M` yatay platform (`|` sınır) · `N` dikey (`:` sınır) · `O` sema halkası · `B` balon · `H J` horon / koçari · `Y` tokmak ·
`i` ıslak taş (katı, kaygan: hızlanma ve durma yavaş) · `p` itilen sandık (yürüyerek itilir, boşluğa düşer, üstüne çıkılır; suya düşerse yerine döner) ·
`[ ]` renkli blok, `_` plaka (Bursa'da gölge/ışık, Van'da gece/gündüz taşı olarak çizilir; kural aynı) · `K D` anahtar, kapı · `%` tünel ağzı (eski adıyla sahte duvar: karanlık bir aralık olarak çizilir, ardındaki cep mağara olur; en az 2 karo yüksek) · `*` dash halkası (toplanmaz, içinden geçilir; havada dash’i yeniler) · `A` gelgit suyu (Mersin: saatle dolar ve çekilir; aşağıda "Tasarım tuzakları") ·
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

## CLAUDE.md'den taşınanlar (26 Kasım 2026)

**Bölüm haritası değiştirmek.** Yeni şehirler `scripts/art/newcities.py`, imza bölümleri `scripts/art/sig.py`.
Değiştir → `python3 scripts/art/newcities.py && python3 scripts/art/sig.py && python3 scripts/art/sync.py` →
`npx tsx scripts/verify-levels.ts <id>`. Eski şehirlerin ana haritası doğrudan `game/levels.ts` içinde.

**Yeni şehir.** İskeleti tek komutla `npx tsx scripts/new-city.ts <id>` yazar (aşağıdaki her kayıt, TASLAK değerlerle; `--kuru` önce gösterir). Elle sıra: `types.ts` CityKey → `game/cities/<id>.ts` (ana yol) → `art.ts` (CITY, buildLayers) → `enemyDraw.ts` (KEEPSAKES: hatıra çizimi; yeni tür varsa ENEMIES / FRIENDS) → `render.ts` (karo, tezgâh `s`,
simge nesne `z`, NEXT_CITY) → `music.ts` SCALES → `levels.ts` LEVELS + DECOR_CYCLE → `content.en.ts` →
`components/TurkeyMap.tsx` koordinat → `game/features.ts` → `game/finales/<id>.ts` (meydan yolu + nazar boncuğu) ve
`finales/index.ts` kaydı → `game/boss.ts` BOSSES (boss) + `game/bossDraw.ts` (çizimi) → `terrainDraw.ts` LOOK (zemin
malzemesi) → `public/sehirler/<id>.webp` ve `assets/cities/<id>.png` (`node scripts/art/banners.cjs <id>`) → `lib/storage.ts` ORDERS (eski sıra) → `tests/sim.test.ts`
plaka listesi. "Bölüm ölçütleri"ndeki sekiz maddenin hepsi sağlanmadan ve `npx tsx scripts/city-check.ts <id>` OK vermeden şehir eklenmiş sayılmaz (CI de koşar). Ayrıntılı yol: `.claude/skills/yeni-sehir`. Şehir sırası değişince (yeni şehir) `lib/storage.ts` MAP_VERSION artır ve eski sırayı ORDERS'a yaz; haritanın kendisi değişince hiçbir sayı artırılmaz (aşağıda "Harita sürümü").

**Madalyalar.** Elle yazılmaz: `game/medals.ts` (çözücü süresi × 1,4 + insan paylı boss botu × 1,1; gümüş × 1,3, bronz × 1,75;
eskisinden uzun olmaz). Haritası ya da boss'u değişen şehirde `npx tsx scripts/solver-time.ts <şehir>` ve `bossbot` ile ölç,
SOLVER_TIME / BOSS_TIME'a yaz (hile önleme testi de SOLVER_TIME'ı okur).

**İkinci defter.** Rize, Artvin, Kars, Bitlis, Ağrı ve dönüş yolu Giresun, Tokat, Denizli, Zonguldak, Mersin, Karabük, Aydın, Balıkesir, Elazığ, Afyon, Bingöl (`FIRST_BOOK` = Rize'nin sırası; defter Bingöl'ün yüzen adalarında biter). Bayburt ilk kez bitince final
sahnesi (`Ending`) açılır, sonundaki "İkinci Defteri Aç" Rize'yi yükler. Final, Ayna Yolu ve Tam Tur ilk defterin 30
şehriyle kalır (ikinci defterin aynası doğrulanmadı). Biten en ileri şehrin ardındaki her zaman açıktır (`normalizeSave`):
yol uzayınca son şehri bitirmiş oyuncu yeni şehre geçer. Yeni defter eklenirse aynı kalıp.

**Meydan yolu değiştirmek.** `game/finales/<id>.ts` → `npx tsx scripts/verify-prelude.ts <id> --goster` (OK demeli) →
`npx tsx scripts/verify-levels.ts <id>`. Yasak karakterler: `C K $ D P E @ & Q G`; tam bir `!` olmalı.

## Tasarım tuzakları (öğrenilmiş)

- Platformun yerden yüksekliği **en çok 32 piksel** (2 karo) olsun; 48 piksel zıplama sınırıdır, oyuncu çoğu zaman tutturamaz.
- Oyuncu her duvara tırmanabilir: bir alanı kapatan duvar haritanın en üst satırına kadar çıkmalı.
  Tepeye dayanan duvar göğe kadar katıdır; haritanın `SKY_ROWS` (4) karo üstü tavandır (`sim.ts` `tile`): duvar dibinde
  sekerek ekranın dışına tırmanılmaz. Kamera bu gök payını gösterir, zemin çizimi tepeye dayanan sütunu ekranın üstüne
  dek sürdürür (`terrainDraw.ts` `drawAbove`): duvar "üstünden aşılır" gibi kesik görünmez.
- Alçak tavanlı koridorda zıplama kısalır; dikenli çukur 2 karoyu geçmesin.
- **Rüzgâr gerçek kuvvettir** (`LevelDef.wind`, `sim.ts` `PHYS.windAir` / `windGround`): havadaki hedef hızı kaydırır, yerde
  yalnız yürürken; dururken itmez. Bayburt'un karşı rüzgârında atlayış ~0,75 karo kısalır. Esinti ~5,7 sn'de güçlenip
  zayıflar: rüzgâra karşı atlayış en zayıf esintide de zayıf oyuncuya yetmeli. Rüzgârlı şehre dokununca
  `audit-difficulty` koş. (14 Kasım'a dek rüzgâr hıza eklenip hedefe kırpılıyor, neredeyse hiç hissedilmiyordu.)
- İkinci defterin lejantı: `L` halat (havadayken değince tutunulur; ↑↓ tırmanılır, zıplayınca bırakılır, zıplayıp yeniden
  yakalayarak da tırmanılır), `R` teleferik halatı (altından zıplayınca asılınır, ←→ elle ilerlenir, zıplayınca ya da ↓ ile
  düz aşağı bırakılır), `W` derin su (yüzülür: zıplama kulaç, yüzeyde kulaç sudan çıkarır; boğulma yok). Öldüren `~` ile
  karışmasın diye `W` açık turkuaz çizilir. Çözücü asılı ve yüzen durumları da dal sayar (`tests/mechanics.test.ts`).
  Teleferiğin bittiği yer güvenli zeminin üstünde olsun: bırakınca düz aşağı inilir.
- `A` gelgit suyu (Mersin; `sim.ts` TIDE, TIDE_CYCLE): saate bağlı 8 sn'lik döngü (2,6 sn yüksek, 1,4 sn iner, 2,6 sn alçak,
  1,4 sn yükselir; aynalı haritada da aynı). Birbirine değen `A` kareleri bir havuzdur, suyu düz durur: yüksekte en üst karesine
  dek dolar (derin su `W` gibi yüzülür, nefes kuralı geçerli), alçakta tamamen çekilir (boş hava; kalıcı su gerekirse altına `W`).
  `tile()` karonun o anki hâlini verir (SWIM ya da EMPTY), ham hâli `isTide()`. Havuzun üstü kıyıyla aynı hizada olsun
  (yoksa su havada asılı durur). İki yönlü kullan: yüksek suda yüzeyden sıçrayarak yüksek taşa (yalnız suyla erişilen taş
  duvardan en az 8 karo uzak olsun: her duvar tırmanılır), alçak suda dipten ve mağara ağzından yürü (yüksekte dalınır).
  Dipte duran oyuncu boğulmaz: su altı süresi (~3,8 sn) nefesten kısa. Uyarı: değişimden 0,9 sn önce varılacak çizgide köpük
  yanıp söner (render `drawTide`, saat ara değerlenir) ve havuza 14 karo yakın oyuncuya ses (`tideUp` / `tideDown`). Düzenleyicide
  de karo (`A`). Mersin bütün Sinir Bozucu fiziklerinde kanıtlı (RAGE_PROVEN); Kovalamaca'da köpek gelgit havuzunun başında bekler. Çözücü yakındaki gelgitin evresini durum sayar; geniş havuz aramayı
  yavaşlatır, havuzu dar tut.
- `{` `}` ritim blokları (`sim.ts` RHYTHM): saate bağlı iki takım, 1,6 sn'de bir yer değiştirir, kaybolmadan 0,45 sn önce yanıp söner;
  belirecek blok oyuncunun içindeyse oyuncu çıkana dek boş kalır (`rhythmHold`). Çözücü yakındaki ritim evresini durum sayar.
  Tam zamanında yay: yaya inerken zıplama basılıysa (tampon) sekiş ×1,22 (`PERFECT_SPRING`); yalnız isteğe bağlı kestirme.
- `;` şelale (Kastamonu; `sim.ts` WATERFALL, FALLS): termalin tersi, saate bağlı değil. Fizikte boşluk; gövdesinin ortası içinde
  olan oyuncunun yerçekimi ×1,8, yukarı giderken ×2 (zıplama ~yarıya iner: ~50 → ~25 px), düşüş sınırı ×1,6 (480 px/sn). Islak kaya:
  içindeyken duvarda kayılmaz, duvardan sekilmez. Yatay hareket ve dash serbest (yatay dash şelalede itilmez). Girişte `splash`
  olayı (su şırıltısı + iki çan damlası, damla parçacıkları). Ölçü (`tests/mechanics.test.ts` "şelale"): zorunlu yolda şelale en çok
  3 karo geniş; altı öldüren boşluksa koşarak atlanan en çok 2 karo (zayıf oyuncu da geçer), 3 karo zıpla + yatay dash ister
  (Orta/Zor; dash'e pencere geniş). Dibine genellikle havuz (`W`): içine düşen yüzer, havuzun içinde şelale itmez ama yüzeyde
  sıçrayan şelaleye girip geri düşer; havuz şelalenin en az bir yanında 2+ karo taşsın, kıyıya şelalenin dışından çıkılsın.
  Hatıra, pul, nazarı şelalenin içine koyma (girince geri itilir). Çözücü dinlenme durumundan dallanır (şelale dinlenme değil,
  anahtar değişmez); köpek şelalenin çevresinde oturur. Çizimi `render.ts` `drawFalls` (ara değerli saatle aşağı akan şeritler,
  sol kenar parıltısı, tepede dudak, dipte köpük ve sis).
- `V` yükselen hava (Balıkesir; `sim.ts` LIFT, THERMAL): fizikte boşluk; gövdesinin ortası içinde olan oyuncu yerçekimi yerine
  yukarı itilir (en çok 170 px/sn), sütunun tepesinde asılı kalır, oradan yana atlar; aşağı basan iner (çözücü aşağı basmaz:
  yana çıkar). Termalin en üst `V` satırı, inilecek taşın üstündeki yürüme satırından en az bir satır yukarıda olsun
  (`tests/mechanics.test.ts` "yükselen hava"). Termalde dash yenilenmez. Çözücü termalin içinde de dallanır (`p.lift`);
  köpek termalin çevresinde oturur. Çizimi `render.ts` `drawLift` (yukarı akan çizgiler, tüy ve yaprak, dalgalı tepe).
- `Z` donan su (Elazığ; `sim.ts` FROST, FROST_CYCLE): saate bağlı, saat 0'da buz; 2,4 sn buz (ICE: katı, kaygan), 2,4 sn derin su
  (yüzülür, nefes kuralı). Bütün `Z` aynı anda döner; değişmeden 0,7 sn önce buz çatlar, su kırağılanır (`drawFrost`), yakındaki
  oyuncuya ses (`freeze` / `thaw`). Donma anında oyuncunun içindeki karo çıkana dek su kalır (`frostHold`). Buz altında en çok
  2,4 sn beklenir (nefesten kısa). `tile()` karonun o anki hâlini verir, ham hâli `isFrost()`; zemin önbelleğine girmez
  (`terrainDraw.ts` `tileOf`). Hatıra, pul, nazarı `Z`nin içine koyma (W ya da hava). Çözücü yakındaki evreyi durum sayar.
- Derin suda nefes (`sim.ts` AIR, 6 sn): başı `W` içindeyken azalır, sudan çıkınca dolar, biterse boğulur (`drown` olayı).
  Son üç saniyede her saniye `breath` olayı (ses, titreşim, kabarcık, ilkinde "yüzeye çık" sözü); başın üstünde kabarcık
  simgeli çubuk (son 2,5 sn kırmızı, içinde kalan saniye, ekran kenarı mavi nabız: `render.ts` `drawBreath`); boğulunca
  düşüş sözü yerine nedeni yazar. Yüzme pozu kurbağalama döngüsü (`heroDraw.ts` `swimStroke`, föyde "kulaç"). Havasız su tüneli zayıf oyuncu için ~2,5 sn'yi geçmesin; suya dokunan haritada
  verify-levels / respawn / items koş.
- `"` havuz teyzesi (Afyon'un termal oteli; `sim.ts` AUNT, `auntFacing`, `auntSees`): karesi derin sudur. Saate bağlı 2,8 sn'de bir
  döner, dönmeden 0,7 sn önce "Hı?" balonu (render `auntBubble`). Baktığı yönde 9 karo içinde, ±3 karo yükseklikte, arada katı
  karo yoksa ve oyuncunun başı su üstündeyse görür: "Aaaa!" (`shriek` olayı) diye bağırıp oyuncunun durduğu yere kavisli havlu fırlatır
  (`AUNT.towel`, 185 px/sn, öngörüsüz: koşan, zıplayan ya da dalan kaçar; havlu suya değince söner), 0,9 sn soluklanır
  (24 Kasım 2026: kullanıcı isteğiyle zorlaştı; görüş 6 → 9 karo). Havlu değen bayraktan
  doğar; teyzeye değen de yakalanır, ezilmez.
  Güvenli cevaplar: sırtı dönükken geç, araya katı bir şey al, dal, havluyu görünce kaç. Her teyzenin yanından geçmek için ~1,5 sn'lik pencere ya da dalış yolu bırak.
- `+` yüzen ada (Bingöl; `sim.ts` SINK, Platform axis `f`): bir satırdaki bitişik `+` tek adadır, gölün yüzünde yüzer (altındaki satır
  `W` ise adanın karoları da sudur: göl adayla aynı satırdadır). Üstünde durana 11 px/sn batar, 11 px batınca (~1 sn) gömülür:
  1,5 sn üstüne basılmaz (oyuncu suya düşer), sonra çıkar; kısa basıp geçen batırmaz. Altına mutlaka `W` (öldüren `~` değil),
  zincirde arada nefes taşı. Çözücü batma hâlini durum sayar; çizimi `render.ts` `drawIsland` (su örtüsü adanın karesine çizilmez).
- Suda yüzen düşmanlar (karesi derin su sayılır): `y` Esoli (köpekbalığı: devriye → yüzeni görünce titreyip uyarır → hamle →
  soluklanır; ezilmez, kaçılır), `U` pirana (±2,5 karo gidip gelir; basılır, dash'le vurulur).
- Van'ın öldüren sularında gölün canavarı yüzer (`render.ts` drawLakeMonster): süs, zararsız; su katmanı alt yarısını örter.
- `T` nitro tüpü (`sim.ts` NITRO): alınınca 3 sn hızlı koşu (×1,55; atlayış hızla uzar), 4 sn'de yeniden dolar. Yalnız isteğe bağlı
  kestirme olarak kullan: zorunlu yolu nitroya bağlama (zayıf oyuncu kaçırabilir). Çözücü nitroyu durum sayar.
- Yeni lejant: `i` ıslak taş (kaygan), `p` itilen sandık (çözücü sandık konumunu da durum sayar: az ve yerel kullan).
  Plaka ve renkli bloklar şehre göre başka görünebilir (`render.ts` SWITCH_SKIN: Bursa gölge, Van gece/gündüz); kural değişmez.
- Sandıklı bölümde gizli hedef (pul, nazar) ileri yolun üstünde dursun: geride kalan hedef çözücünün bütçesini yakar. Şehir başına en çok iki
  sandık, her biri birkaç karoluk kapalı alanda; plakaya yalnız oyuncu basar, sandık basmaz.
- Dost hayvan ile düşman aynı tür olmasın (kedi dostsa düşman kedi olmaz). Düşmanlar kırmızı hatla parlar.
  Şehre özgü düşman: Ordu saksağanı (`j`), dalda tüner, altından geçene uyarıp dalar.
- Baş payı: yürünen her aralık en az 2 karo yüksek olur (gövde 26 px çizilir). Diken tarlasının üstündeki basamak da
  sayılır: tarlayı bir karo göm. `npx tsx scripts/audit-clearance.ts` ve `tests/sim.test.ts` "alçak koridorlar" bekler.
- Düğme durumu bayrakla birlikte saklanır, ölünce o hale dönülür; meydan kapısından geçince sıfırlanır. Bulmacayı buna göre kur.
- Çözücü "aşağı" tuşuna basmaz: tek yönlü platformdan aşağı inişe dayanan yol doğrulanamaz, çatlak taş (X) kullan.
- Tünel ağzı (`%`) ve yürünen her geçit en az **2 karo** yüksek olur: gövde 26 px çizilir, 1 karoluk aralığa yürüyerek girmek
  duvarın içinden geçmek gibi görünür (`tests/sim.test.ts` "tünel ağızları" bekler). Kaya 2 karoysa tavanı bir kademe yükselt.
- Gizli köşe görünmez olmaz: hatıra, pul, nazar ve anahtar ya açıkta ya da görünür bir girişin ardındadır (tünel ağzı `%`
  karanlık aralık olarak çizilir; çatlak taş `X`; plakayla açılan kapı). Tabela ve şehir insanı girişi doğru tarif eder
  ("üstüne atla" deniyorsa üstüne atlayan alır). Her şeyi zayıf oyuncu alabilmeli ve aldığı yerden çıkışa varabilmeli
  (kapan yok): `npx tsx scripts/verify-items.ts <id>`.
- Toplanan şeyler çizilen gövdeye değince alınır (`sim.ts` reach: 26 px boy); fizik ve tehlikeler 14 px kutuyla kalır.
  Omuz hizası yürüyerek alınır, bir kademe (2 karo) ve yukarısı zıplayarak. Gökyüzünde dayanaksız şey olmaz: her şey
  bir zeminin, tahtanın, hareketli platform yolunun, yayın, sandığın ya da duvarın zıplama menzilinde (3 karo yan,
  4 karo yukarı): `npx tsx scripts/audit-reach.ts <id>`.
- Art arda iki raylı platform (`M`) arasında atlanacaksa gidip gelme aralıkları **eşit**, başlangıçları **ters fazda** olsun
  (alttaki en solda, üstteki en sağda): buluşma her turda düzenli gelir. Aralıklar farklıysa platformlar zamanla kayar,
  oyuncu 30 saniye bekler (test bekler: en çok 9 sn).
- Ok, katı bir karoya çarpana dek uçar: ok tuzağının hattında bayrak, tabela, şehir insanı ya da başlangıç olmasın
  (test bekler); gerekiyorsa araya oku durduran bir taş koy.
- `audit-difficulty` zayıf oyuncu takılırsa çıkış kodu 1 verir; Malatya'da bu yüzden bir diken tarlası gözden kaçmıştı.
- Boss ve düşmanlar çözücüde yoktur (zamanlama engeli); boss’un yenilebilirliğini `tests/boss.test.ts` kanıtlar.
- Çözücü (`verify-levels`) yavaşsa önce haritayı sadeleştir: dönen platformlar ve tokmaklar durum sayısını katlar.
- Her yaştan oyuncu düşün: bayraklar arası **en çok 75 karo** (test bekler), boşluklar 3 karoyu geçmesin; "dash + dash halkası + dash"
  zinciri isteğe bağlı kestirme olsun, zorunlu yol olmasın. Değişiklikten sonra `npx tsx scripts/audit-difficulty.ts <id>`:
  zayıf oyuncu (zıplama ~%10 alçak, koşu %8 yavaş) geçebilmeli.
