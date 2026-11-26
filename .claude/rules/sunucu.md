---
paths:
  - "app/api/**"
  - "lib/storage.ts"
  - "lib/cloud.ts"
  - "lib/scoreKey.ts"
  - "lib/antiCheat.ts"
  - "lib/rateLimit.ts"
  - "lib/players.ts"
  - "lib/playerName.ts"
  - "lib/sameOrigin.ts"
  - "lib/schema.ts"
  - "lib/db.ts"
  - "lib/points.ts"
  - "lib/listRanks.ts"
  - "lib/mapVersion.ts"
  - "lib/achievements.ts"
  - "lib/ghost.ts"
  - "lib/communityMaps.ts"
  - "lib/profileServer.ts"
  - "drizzle/**"
  - "scripts/migrate.ts"
  - "components/ScoreBoard.tsx"
  - "next.config.ts"
  - "tests/scores.test.ts"
  - "tests/maps.test.ts"
  - "tests/cloud.test.ts"
  - "tests/antiCheat.test.ts"
---

# Kayıt, skor, sunucu ve güvenlik

<!-- CLAUDE.md'den taşındı (26 Kasım 2026): bu dosya yalnız ilgili dosyalar okununca yüklenir. -->

**Kayıt asla kaybolmaz (17 Kasım 2026).** Kayıt her zaman en güncel hâlinden türetilir: `persist(s => …)` ya da `patch({…})`;
render anındaki `save` kopyasıyla `persist({ ...save, … })` yazılmaz (async giriş, bölüm sonu arasında yazılan rekoru ezer).
`writeSave` depo doluysa önce en büyük hayalet koşuyu siler (hayalet en çok ~8100 sayı, uzun koşu seyreltilir, `step`).
İki sekme `storage` olayıyla birleşir (sıfırlama `timesReset` ile kazanır). Bulut gönderimi başarısızsa yeniden dener
(`pushSave`), bulut sınırı 256 KB. Skor gönderimi 429 / 5xx / ağ hatasında bekleyip yeniden dener; skor hız sınırı oyuncu
başına (saatte 120) + geniş IP tabanı (600): aynı evdeki yolcular birbirinin hakkını yemez. Bütün şehirler bitince ana
menü "Serbest Gezi": yol çizgisinden seçilen şehirde oynanır. Kısayollar: R checkpoint, Shift + R baştan başla.

**Harita sürümü (kalıcı kural).** Güncelleme oyuncunun hiçbir şeyini silmez: harita yenilense de rekor, hatıralar, pul,
nazar, boss ve **sıralama** yerinde kalır (kullanıcı kararı, 14 Kasım 2026). Her şehrin sürümü haritasının özetidir
(`lib/mapVersion.ts` `cityVersion`); yalnız bilgi vermek için kullanılır: rekoru eski haritada koşulmuş şehir açılışta
"Yolda Neler Değişti" notunda ve şehir listesinde "Yenilendi" rozetiyle görünür (`isRenewed`, `mapNews` / `ackMapNews`),
oyuncu yeniden oynayınca rozet kalkar. Eski hayalet koşu yeni haritada gösterilmez. Skor anahtarı kalıcıdır
(`scoreKey`: `istanbul@s`); cihazdaki rekorlar girişte tabloya aktarılır (`syncBests`).

**Skor tablosu.** Oyuncu başına şehir başına tek satır: en iyi süre (ve o koşunun düşüş/hatırası), bütün koşulardaki en az
düşüş (`min_deaths`) ve en çok hatıra (`max_items`) ayrı tutulur, her bitiriş `plays`'i artırır. Sıralama filtresi sağ
sütunda gösterilen değeri de değiştirir. Günlük Meydan Okuma satırları `gunluk:<gün>` anahtarıyla aynı tabloda durur
(gün İstanbul saatiyle döner). API'ye dokununca `tests/scores.test.ts` koş.

**Puan (23 Kasım 2026).** `lib/points.ts` `runPoints(altın, süre, düşüş, hatıra)`: süre payı 1000 × altın / süre (200-1250), her hatıra 250,
düşüş −20 (en çok −300), düşmeden +150. Sunucu şehir koşusunda aynısını hesaplar ve `seksek_scores.max_points`te en yükseğini tutar (göç `0011`);
sütundan önceki satırlar için SQL karşılığı `pointsSql` (route.ts; formül değişirse ikisi birlikte). Skor Tablosu Şehirler ve Genel'de "Puan" süzgeci
(`sort=points`; genelde şehir puanlarının toplamı); şehir bitişinde puan dökümü. Günlük Meydan Okuma'da hatıra (`DAILY_ITEMS_FROM` 24 Kasım'dan):
kuralın kendi cezası yoksa eksik her hatıra +5 sn (`missingFor`, `extraMissing`; ceza süreye eklenir, alt sınırın altına inmez). Serbest Kurallı Koşu eski kuralla kalır.

**Listede sıran (23 Kasım 2026).** `GET /api/scores?level=ozet&kind=sehir|mucadele&me=<ad>`: her tablonun lideri, süresi, yolcu sayısı ve oyuncunun
sırası tek sorguda. `lib/listRanks.ts` `useListRanks` (30 sn önbellek, liste açıkken), satırda `components/RankTag.tsx` ("★ Lider", "#3/12", lider adı):
Şehirler listesi ve Mücadeleler. Ana menünün fotoğrafı ve hesap satırı yolcunun Mağaza kombinini giyer (`HeroFigure kit`, `Portrait accessory`).

**Her moda sıralama.** Sunucuya giren yeni tablolar: `kural:<şehir>:<kural>` (Kurallı Koşu, Sinir Bozucu, Kovalamaca: serbest koşu bitince gönderilir;
alt sınır şehrin kendi yolu, kural `ruleOk`: bilinen, `hasOwnProperty`, `ruleFits`) ve `bossrush:<duz|kabus|cifte>:<boss sayısı>` (aynı sayıda boss'luk
koşular yarışır; alt sınır `BOSS_FLOOR_MS` × boss). Skor Tablosu → Modlar sekmesi (Kurallı Koşu: şehir + kural; Boss Rush: çeşit + boss sayısı). Modlar
kutucuklarındaki 🏆 çipi ilgili sekmeyi açar (`onBoard`). Sunucuya girmeyenler: Maraton (rastgele şehirler, süreler karşılaştırılamaz), Ayna Yolu (kasıtlı yerel),
Düello ve Co-op (aynı cihazda iki kişi; rekoru cihazda). Yeni tablo eklerken: `lib/scoreKey.ts` anahtar, `antiCheat.minScoreMs`, `route.ts` parseRun + GET,
`tests/scores.test.ts`.

**Arkadaşlar.** `save.friends` (yolcu adları, buluta da gider). Skor tablosunda ☆ ile ya da adla eklenir; her tabloya
`names=a,b` süzgeci verilir (adlar zaten herkese açık, yanıt önbelleklenebilir). "⚔ Beni Geç Bağlantısı" `/?yaris=<şehir>~<ad>`.

**Topluluk haritaları.** Düzenleyicide çözücüyle bitirilen harita "Topluluğa Yayınla" ile `seksek_maps` tablosuna gider
(giriş gerekir, günde 10, başlık süzgeci `lib/communityMaps.ts`); galeri `/haritalar` (Yeni, En Beğenilen, En Çok Oynanan),
beğeni `seksek_map_likes`, oynanma sayacı bağlantı + harita başına saatte bir. Modlar ekranının altından bağlantı verilir. API'ye dokununca `tests/maps.test.ts`.

**Hile önleme ve hız sınırı.** Skor API'si süreyi haritanın fiziksel en kısa yoluyla karşılaştırır (`lib/antiCheat.ts`
`minScoreMs`: yatay mesafe / dash hızı × 0,6); hayalet koşu yüklenirse hız ve ışınlanma denetlenir. Haritası çok kısalan
şehirde `tests/antiCheat.test.ts` SOLVER tablosunu yeniden ölç. Giriş, kayıt ve skor gönderimi `lib/rateLimit.ts` ile
sınırlıdır (429 + Retry-After); göç `0008_seksek_rate`. Yeni sunucu ucu kötüye kullanılabiliyorsa `LIMITS`e ekle.

**Güvenlik (kalıcı kural, 18 Kasım 2026).** Yeni ya da değişen API ucunda şu sırayı koru:
- **CSRF:** veri değiştiren her uç (POST, PUT, PATCH, DELETE) ilk satırda `if (crossSite(req)) return crossSiteError()`
  (`lib/sameOrigin.ts`: `Sec-Fetch-Site: cross-site` ya da başka/`null` `Origin` → 403). Çerez SameSite=Lax tek başına
  login CSRF'ini (saldırganın oturumunu kurbana kurmak) kesmiyordu.
- **Kimlik:** oturum `verifyPlayer` ile doğrulanır; istemcinin yazdığı `playerId` hiçbir şeye anahtar olmaz (hız sınırı da
  doğrulanmış kimliğe: `playerKey(me.id)`, oturumsuz istek `ipKey`). Satır her zaman `me.id` ile yazılır/silinir.
- **Hız sınırı:** kötüye kullanılabilen her uç `lib/rateLimit.ts` LIMITS'te (giriş, kayıt, ad değiştirme, skor, hayalet,
  bulut kaydı, yayın, beğeni, oynanma, salt okunur profil). Yeni uç → LIMITS'e ekle, testte sınırı sına.
- **Girdi:** gövdeyi okumadan `content-length`, sonra metin uzunluğu; sayılar `Number.isInteger` + alt/üst sınır; dizgiler
  uzunlukla; bulut kaydında `__proto__`/`constructor` anahtarları JSON.parse'ta düşer. Ham `sql```te değer hep parametre
  (`${…}`); tablo/sütun adı kullanıcıdan gelmez. Hata yanıtı genel Türkçe cümle, ayrıntı (yığın, SQL) dönmez.
- **Kullanıcı adı:** kuralı `lib/playerName.ts` (sunucu ve formlar aynı): yalnız Latin alfabesi (Türkçe harfler dahil),
  ASCII rakam, boşluk, `- _ .`; NFC'ye çevrilir, NFKC'de değişen (tam genişlik) ve başka alfabeden benzer harf reddedilir;
  yeni ad I/ı/İ/i farkıyla da boşta olmalı (`nameTaken`). Giriş eski adlarla çalışmaya devam eder.
- **Şifre ve oturum:** scrypt + `timingSafeEqual`; olmayan adda da sahte scrypt (`checkPasswordOrDummy`), yanıt aynı.
  Oturum anahtarının veritabanında yalnız sha256'sı durur; çerez HttpOnly, üretimde Secure, SameSite=Lax.
- **Kullanıcı içeriği** React metni olarak basılır (dangerouslySetInnerHTML yok); tuvale çizilen metinler (`?ozel=` tabela,
  kişi) `textProblem` süzgecinden geçer; skor kartı adı (`parseShare`) süzülür ve kaba söz atılır.
- **Başlıklar** `next.config.ts`: CSP (yalnız kendi kökenimiz; inline betik Next için, `unsafe-eval` yalnız geliştirmede),
  `frame-ancestors 'self'`, Permissions-Policy, COOP, HSTS, nosniff. Dış kaynak (font, betik, API) eklersen CSP'ye yaz ve
  `npx next start` ile oyunu, /duzenle ve /haritalar'ı açıp konsolda CSP ihlali olmadığına bak.
- Kanıt: `tests/scores.test.ts` ve `tests/maps.test.ts` "güvenlik" blokları (403, ad taklidi, hız sınırları, __proto__).

**Hayalete karşı yarış.** Rekor koşunun hayaleti sunucuya da yüklenir (`seksek_ghosts`, oyuncu + şehir başına tek satır; yalnız
skor tablosundaki süreyle eşleşen ve haritanın bugünkü sürümünde koşulmuş olan). Skor tablosunun Şehirler sekmesinde açılmış şehirde
"◌ Yarış" o yolcunun hayaletini indirir; geçmek `ghostBeaten` başarımı.

**Başarımlar.** `lib/achievements.ts`: yeni başarım kayıttan hesaplanabiliyorsa `progress` yaz; bir anda olan şeyse `Feat`e ekle ve
`Game.tsx` `addFeat` ile yaz. Ad ve açıklamanın İngilizcesi `lib/ui.en.ts`te. Bildirim kayıttaki `ach`te olmayanlar için bir kez çıkar.

**Veritabanı değişikliği.** Yeni tablo ya da sütun `drizzle/NNNN_*.sql` (idempotent: `IF NOT EXISTS`) + `lib/schema.ts`;
canlıya her dağıtımda kendiliğinden uygulanır (`vercel-build`: `scripts/migrate.ts --derleme`; DATABASE_URL Vercel'de
"sensitive", dışarıdan okunamaz, derleme ortamında vardır). Göç için kullanıcıya sorma (kullanıcı kararı, 15 Kasım 2026);
derleme günlüğünde `uygulandı:` satırlarına bak. Elle: `npm run db:migrate` (DATABASE_URL gerekir). Kod, tablo henüz yokken sessizce yerel kayda düşmeli.
