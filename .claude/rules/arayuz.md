---
paths:
  - "components/**"
  - "app/**/*.tsx"
  - "app/globals.css"
  - "lib/cityScores.ts"
  - "lib/cityFilter.ts"
  - "lib/profile.ts"
  - "lib/recentCities.ts"
  - "game/colorBlind.ts"
  - "scripts/audit-menus.cjs"
---

# Arayüz: ekranlar, menüler, ayarlar

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

**Şehir kartında skor paneli (21 Kasım 2026).** Şehir kartı (`screen === 'intro'`) kartın durum şeridinde "Lider X · süre · #sıran" çipi ve alt çubukta "🏆 Skorlar" düğmesi taşır; ikisi de `components/CityScores.tsx`
çekmecesini açar (`introScores`): şehrin ilk 10 yolcusu + oyuncunun kendi satırı (sıra, portre, ad, madalya, süre, düşüş, hatıra; "Sen" vurgulu, ☆ arkadaş), satıra basınca ayrıntı (süre, en az düşüş, en çok hatıra, koşu sayısı,
yolcu, lidere fark, "Profili Aç" `/oyuncu/<ad>`, "◌ Hayaletiyle Yarış" mevcut `startRace` akışı), "Tüm Sıralama →" Skor Tablosu'nun Şehirler sekmesine o şehirle atlar (`boardTab: 'city'`, `startCity`). Giriş gerekmez.
Veri mevcut `GET /api/scores?level=<şehir>` (sunucu değişmedi); saf mantık, kısa ömürlü önbellek (20 sn), uçuştaki isteğin paylaşımı ve iptal `lib/cityScores.ts` (`tests/cityScores.test.ts`); `useCityScores` şehir değişince yeniden
yükler, hata + Tekrar Dene, boş durum "İlk Rekoru Sen Koy". Bayrak başına süre API'de yok (hayalet dosyasında var, listede değil), bu yüzden ayrıntıda gösterilmez. Şehirler listesinde lider ve sıra toplu uçtan gelir ("Listede sıran"). Şehirler ekranı: başlıkta özet şeridi (`CityStats`), listede arama ve "oynamaya değer" süzgeçleri (`lib/cityFilter.ts`: Oynanmadı, Eksik Hatıra, Altın Yok; düzenli 2×2 ızgara, tek çip alta kaymaz; testi `tests/cityFilter.test.ts`), listede üstüne gelinen şehir haritada öne çıkar (`TurkeyMap peek`; kart yalnız fare ve klavye odağıyla açılır). Skor Tablosu: geniş tabloda ilk üç podyumda (ikinci, birinci, üçüncü; taç, ◌ Yarış), liste dördüncüden sürer; dar ve alçak ekranda podyum gizli, ilk üç listede. Mücadele kartı: madalya çizgisi (`MedalTrack`: işaretler + rekorun + sıradaki madalyaya kalan) ve eğilen parkur görseli (`components/useTilt.ts`, ana menü kartpostalıyla ortak). **Sütunlar eşit biter (kullanıcı kararı, 23 Kasım 2026):** yan yana sütunlu her ekranda (bölüm sonu, şehir kartı, Defter, düzenleyici) sütunların alt kenarı aynı hizada olur; kısa kalan sütunun son öbeği `mt-auto` ile dibe yaslanır (sütun `flex flex-col`). Bölüm sonu: süre sayarak gelir (`components/CountUp.tsx`), mühür basılır (`.seal-slam`), puan sayarak dolar. Düzenleyici: `.ed-shell` / `.ed-top` / `.ed-panel` / `.ed-canvas` (globals.css), Oyna düğmesi `cta`.

**Yolcu seçici `HeroPicker` (21 Kasım 2026).** Uktun / Memo seçimi her yerde `components/HeroPicker.tsx`: iki kart (portre, ad, rol), seçili kart tonlu çerçeve + tik, `role="radiogroup"` (←/→/↑/↓ geçer, 1 ve 2 seçer, Tab seçili karta
durur), altın odak halkası, hedef en az 56 px (alçak ekranda 48), hareketi azalt desteği. Boyutlar: `lg` şehir kartı (geniş ekranda sağ sütunun altı, dar ekranda alt çubuğun üstü; yatay telefonda alt çubukta `sm`),
`sm` mola (`plainRun` onayı aynen: `setPauseHero`), Mağaza, Düello ve Co-op kurulumunda oyuncu başına (`stack`, `tone` oyuncunun rengi). Yeni yolcu seçeneği gerekirse yalnız buraya yaz. İlk açılıştaki "Karakterini Seç"
ekranı biyografili kendi büyük kartlarıyla kalır.

**Sıralama ve profil arayüzü (25 Kasım 2026).** `components/ScoreBoard.tsx`: yedi sekme (Genel, Şehirler, Günlük, Modlar, Speedrun, Koleksiyon, Arkadaşlar; seçili sekme `seksek:board:tab`te hatırlanır), yolcu araması (`q`, adın parçası) ve sayfalama (`lim`, en çok 100) API'de;
satır (`.sb-item`): sıra (ilk üç renkli madalyon), portre (`hero`, `public/portreler`; telefonda gizli), ad + sakin çipler (ikincil değerler, "lidere +3,2 sn"), sağda büyük ana değer + doluluk çubuğu, sağ kenarda `›`. Podyum alçak, yumuşak basamaklar (büyük portre, taç, sıra rozeti, "Ayrıntı ›").
Satırın ve kürsünün tamamı **yolcu ayrıntısını** açar (ad bir `button`dır: `data-nav`, ok tuşları + Enter; dar listede, `compact`, ad hâlâ `/oyuncu/<ad>` bağlantısı): `components/PlayerDrawer.tsx`, ekranı değiştirmeden yandan (telefonda alttan) çekmece (portal, `role="dialog"`, odak içinde döner, Esc/Geri/arka plan kapatır, odak satıra döner):
portre + kombin, ad, unvan, atkı, katılım, bağlam şeridi (tablonun adı `Board title`, sıra, ana değer), yol halkası, toplam süre, başarım, seri, altı özet sayı, en iyi dört şehir, vitrin; altta "Profili Aç" (oyunda yeni sekmede), "◌ Hayaletiyle Yarış" (süre sıralı şehir tablosunda) ve ☆ arkadaş.
Veri salt okunur `GET /api/players/profile?name=` (`lib/profileServer.ts` `loadProfile`: `/oyuncu/[ad]` sayfasıyla aynı işlev; IP başına saatte 600, `LIMITS.profile`; 20 sn istemci önbelleği; testi `tests/scores.test.ts` "yolcu profili"). Yapışkan "Senin Sıran" şeridi sade (son bakışa göre ▲▼ `seksek:rank:*`, "Kendine Git").
`components/ProfileView.tsx` oyun içi (Defter → Profil, `lib/profile.ts` `profileFromSave`) ve herkese açık `/oyuncu/<ad>` sayfasında aynı: kimlik kartı atkı tonunda (`--tint`, `tintOf`; büyük portre, unvan, atkı, katılım, turnuva kürsüleri, yol halkası + çubuk + toplam süre), özet sayılar (`TotalsGrid`, çubuklu), vitrin (`save.pins`, en çok üç başarım; Defter → Başarımlar'da ☆ ile sabitlenir, bulutla gider) ve "Şehir Şehir" tablosu: süzgeç Hepsi / Altın / %100 / Eksik (sayılarıyla), sıralama Plaka / Süre / Sıra, satır plaka · şehir (%100 rozeti) · toplananlar · madalya + süre · sıra; geçilmemiş şehirler tek satırda plaka bulutu. Tablo dar kapta (`@container`, 520 px) iki satırlı düzene geçer; herkese açık sayfada geniş ekranda kendi alanında kayar (kimlik yapışkan). Sunucu sayfası şehir satırlarını skor tablosundan, toplananları bulut kaydından alır.

**Ayarlar ekranı (25 Kasım 2026).** `screen === 'controls'`, sayfa kaymaz. 1280 px ve üstü geniş ekranda üç sütun (`settingsWide` iki sütun + tuş atama bloğu): 1. Ses, Oynanış, Ekran ve Kontroller (son öbek `mt-auto`);
2. Kolaylıklar (seçimler tek kartta satır satır, altında üç anahtar) ve dibinde dokunmatik / oyun kolu tuşları (`.set-pad`); 3. Klavye, İki Kişilik, ipucu. Rehberi Yeniden Göster ve Ana Ekrana Ekle başlıkta, dilin yanında.
900-1279 px'te iki sekme (Oyun: iki sütun; Kontroller: Klavye | İki Kişilik, altında dokunmatik ve oyun kolu). Kart açıklamaları en çok iki satır ve kısa; 760 px'ten alçak geniş ekranda kart açıklaması ve renk körü önizlemesi,
700 px'ten alçakta ses açıklaması gizlenir (`.set-wide` kuralları globals.css). Yeni ayar eklerken üç boyutta (1280×720, 1512×860, 1024×640) panelin içi de kaymamalı: `ONLY=ayarlar node scripts/audit-menus.cjs` + ekran görüntüsü.

**Şehir seçici.** `components/CityPicker.tsx` ortak: arama (ad / plaka, Türkçe harf farkı yok sayılır), zorluk süzgeci, defter sekmesi, son oynananlar
(`lib/recentCities.ts`, yalnız bu tarayıcıda), rekor rozeti, kilitli ve uymayan şehir soluk, ok tuşlarıyla gezinme. Kurallı Koşu / Sinir Bozucu /
Kovalamaca (`RuleSetup`) ve Düello kullanır; yeni kurulum ekranı şehir seçecekse `<select>` değil bunu kullan. Modlar'da "Devam Et" şeridi son açılan modu
hatırlar (`rememberMode`).

**Sürüm notu.** Yeni şehirle gelen yenilikler `Game.tsx` RELEASE_NOTES[şehir]: o şehir "Yolda Neler Değişti" notunda yeni
görünürken "Bu Sürümde" listesi ve "Modlara Bak" düğmesi çıkar. Yeni şehirle birlikte yeni mod geliyorsa buraya yaz.

**Ayarlar ve erişilebilirlik.** Efekt ve müzik ses düzeyi (`sfxVol`, `musicVol`), Ekran Sarsıntısı (`shake`; tanımsızsa
kapalı: 25 Kasım 2026 kullanıcı kararı, göz yormasın; çizimde `renderer.shakeScale`), Ara Süreler (`splits`; rekor koşunun bayrak
süreleri `splitTimes`, harita sürümüyle), Rahat Mod hızı (`relaxedSpeed` %60-90), tuş atama (`keys`; Esc, P, R sabit).
Oyun kolu titreşimi `haptic()` içinde (`vibrationActuator`). **Kolaylıklar** (Ayarlar → Kolaylıklar, cihaz ayarı: buluta gitmez, fizik değişmez): hayalet görünürlüğü (`ghostAlpha`), kamera yakınlığı (`camZoom` → `renderer.userZoom`), sarsıntı şiddeti (`shakePower`), titreşim yoğunluğu (`hapticPower` → `setHapticScale`), Dash Göstergesi (`dashMeter`), Basılı Tut Zıplama (`holdJump`: yalnız girdi, yere inişte `jumpPressed`), Büyük Yazı (`bigText`, panel `zoom`). **Renk körü paleti** (Ayarlar → Kolaylıklar, `save.colorBlind`: yok / kırmızı-yeşil / mavi-sarı; cihaz ayarı, yalnız çizim): `game/colorBlind.ts` `cbc(hex)` kritik renkleri (diken, tehlike, düşman halesi, A/B blok ve plaka, nefes ve boss süre uyarıları, ok tuzağı) Okabe-Ito tabanlı güvenli renge çevirir, mod kapalıyken tek karşılaştırma; süzgeç ya da katman yok. Renge ikinci işaret: blokta daire (A) / üçgen (B), öldüren suda çizgili yüzey, diken ucunda açık nokta, kalın düşman halesi, madalya rozetinde 1-2-3 (`.cb-mark`); arayüz `:root[data-cb]` CSS değişkenleri. Önizleme `components/CbPreview.tsx`. Yeni kritik renk eklersen `cbc` ile sar, tabloya yaz ve `tests/colorBlind.test.ts` çiftine ekle (Machado simülasyonunda ΔE ≥ 30). `CB=kirmizi-yesil node scripts/verify-perf.cjs` ile ölç. Tuş ipuçları ve rehber atanan tuşu gösterir.

## Öğrenilmiş kurallar

- **Renk (Alacakaranlık teması).** Tokenlar `app/globals.css` `@theme`: koyu zeminde yazı ve çizgi için `accent` / `accent-2`
  (açık çivit, en az 4.5:1), dolu düğme zemini için `accent-deep` ve üstünde beyaz yazı. Mavi üstüne koyu yazı yazılmaz.
  Amblem renkleri `scripts/art/emblem.ts`; değişince `node scripts/art/icons.cjs --og`.
- **Yazı dili.** Başlıklar Grandstander, gövde Figtree (`app/layout.tsx` `--font-title` / `--font-body`; tuvalde
  `render.ts` popFont / textFont; kartpostalda `assets/fonts/*.ttf`). Piksel font kullanılmaz: küçük boyda yoruyor,
  2/5/8 karışıyordu. Yeni bir yazı ailesi denersen Türkçe harflere (İ ı Ğ Ş) ve rakamlara (süre, plaka, skor) bak.
  Tailwind'de `font-display` başlık, `font-mono` gövdedir (adı tarihsel; eş aralıklı değil).
- Kullanıcı adı çekim eki almaz ("Ahmet’te" / "Uktun’da" ünlü uyumu tutmaz): "Sıra Sende, {name}" gibi kur.
- Ölçüm ve görsel betikleri `?debug` ile açar: güncelleme notu o zaman çıkmaz (ekranı kapatıp tıklamaları yutmasın).
- Satır kırma: başlık ve düğmeler `text-wrap: balance`, paragraflar `pretty` (globals.css); bölünmemesi gereken kısa
  parçaya `.nowrap`.
- **Geri düğmesi** `pixel-btn back-btn` + `data-back`: turkuaz, en az 44 px, klavyeli cihazda "Esc" ipucu; menülerde Esc
  ekrandaki son görünen `data-back` düğmesine basar (Game.tsx; oyun, mola, fotoğraf, Co-op, yarışta Esc moladır).
  Yeni ekranın Geri düğmesine ikisini de ver. Alt gezinme (← Ayarlar, ← Mola) yalnız `back-btn`.
- **Menülerde sayfa kaymaz, panelden taşma olmaz.** Her ekran masaüstünde (1280×720, 1512×860), ara boyda (1024×640: 900-1023 piksel
  genişlik "wide" sayılır ama `lg` değildir; Modlar orada iki sütun) ve telefonda (dikey 390×664, yatay 750×342) tek bakışta sığar;
  hiçbir düğme, rozet ya da yazı panelin yan kenarından taşmaz (denetim bunu da ölçer, kayan kabın içi sayılmaz). Rozet ada sığmıyorsa
  köşede etiket olur (`.tile-badge`); panel ve ana menünün fotoğrafı ekranın yan kenarından taşmaz (fotoğraf yalnız 1220 px+); 700 pikselden alçak geniş ekranda ikincil bilgi gizlenir (`wide:[@media(max-height:700px)]:hidden`). Uzun liste (şehirler, defter, skor, bölüm sonu) panelin içinde kendi alanında kayar; panel ekran boyunu geçmez.
  Kanıtı `node scripts/audit-menus.cjs` (sunucu açıkken, `PORT=`; `ONLY=` ekran, `SIZE=orta,dikey` boyut süzer): her menü beş boyutta açılır, taşan hücre FAIL verir;
  yeni ekran eklersen betikteki SCREENS listesine yaz.
  Düzen değişkenleri `app/globals.css`te: `wide` (geniş ve yüksek), `short` (alçak, yatay telefon), `side` (ikisinde de yan yana).
