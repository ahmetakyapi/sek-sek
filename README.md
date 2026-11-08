<div align="center">

# Sek-Sek · Şehir Şehir Anadolu

**Dedenin yarım kalmış defterini tamamla. On beş şehir, kırk beş hatıra, tek yolculuk.**

İstanbul’dan Bayburt’a, her şehri kendi sesi, tadı ve insanıyla aşan bir piksel platform oyunu.<br>
Telefonda ve tarayıcıda oynanır; Türkçe ve İngilizce.

[**▶ Hemen Oyna · sek-sek.vercel.app**](https://sek-sek.vercel.app)

<img src="docs/img/title.png" alt="Sek-Sek başlık ekranı: Uktun'un portresi ve oyunun menüsü" width="860">

</div>

---

## Bir Bakışta

<img src="docs/img/hammers.gif" alt="Gaziantep Bakırcılar Çarşısı'nda inip kalkan bakırcı tokmakları" width="420" align="right">

- **15 Şehir, Her Biri Kendine Has.** Konya’da dönen sema halkaları, Kapadokya’da binince yükselen balonlar,
  Gaziantep’te ritimle inen bakırcı tokmakları, Ardahan’da buz delikleri, Bayburt’ta karşı rüzgâr.
- **Gerçek Bilgiler.** Her hatıra o şehre dair doğrulanmış bir bilgi kartı açar; her şehirde saklı bir
  **gizli pul** deftere gizli bir sayfa ekler.
- **Konuşan Şehir.** Simitçiden vapur kaptanına, mırracıdan kangal sahibine 30’u aşkın şehir insanı.
  Dost hayvanları sevebilirsin; kırmızı hatla parlayan canlılar tehlikelidir.
- **Bulmacalar.** Anahtar ve kapı, basınç plakasıyla yer değiştiren bloklar, sahte duvarlar, kristallerle havada ikinci atılma.
- **Artbook Havası.** Işıkla boyanmış portreler, kilim çerçeveler, defter kâğıdı kartlar, paylaşılabilir kartpostallar.
- **Skor Tablosu.** Şehir başına ve genel sıralama; altın, gümüş ve bronz süre madalyaları.

<br clear="right">

<img src="docs/img/mechanics.png" alt="Konya'da Sema Halkası, Nevşehir'de Balon, Gaziantep'te Bakırcı Tokmağı" width="100%">

## Rota

<img src="docs/img/cities.png" alt="On beş şehrin oyun içinden görüntüleri" width="100%">

| # | Şehir | Plaka | Zorluk | Kendine Has | Hatıra |
|---|-------|:-----:|--------|-------------|--------|
| 1 | İstanbul · Boğaz Kıyısı | 34 | Kolay | İskele, kristal, Vapur Seferi | Simit |
| 2 | Kocaeli · Körfez ve SEKA | 41 | Kolay | Anahtarlı depo, çürük kâğıt bobinleri | Pişmaniye |
| 3 | İzmir · Kordon Boyu | 35 | Kolay | Körfez vapuru, Tarihi Asansör, Kemeraltı tenteleri | Boyoz |
| 4 | Ankara · Kale ve Cumbalar | 06 | Orta | Kale burcunda tırmanış, koç | Tiftik |
| 5 | Konya · Mevlâna’nın Şehri | 42 | Orta | Dönen sema halkaları, Karatay’ın anahtarı | Sikke |
| 6 | Nevşehir · Kapadokya | 50 | Orta | Binince yükselen balonlar, Derinkuyu tünelleri | Testi |
| 7 | Adana · Seyhan ve Taşköprü | 01 | Orta | Seyhan bentleri, sivrisinekler | Pamuk |
| 8 | Gaziantep · Bakırcılar Çarşısı | 27 | Orta | Bakırcı tokmakları, fıstık bahçesi, Zeugma bilmecesi | Baklava |
| 9 | Mardin · Taş Teraslar | 47 | Orta | Dağılan Kasımiye taşları, gizli mahzen | Telkari |
| 10 | Malatya (Erik Diyarı) · Kayısı Bahçeleri | 44 | Orta | Kayısı kasaları, arılar | Kayısı |
| 11 | Çorum (Çorumçe) · Hattuşa Surları | 19 | Zor | Hitit ok tuzakları, Yerkapı tüneli | Leblebi |
| 12 | Ordu · Fındık ve Boztepe | 52 | Zor | Boztepe teleferiği, yaban domuzları | Fındık |
| 13 | Sivas · Buzlu Kızılırmak | 58 | Zor | Buz, kurtlar, Gök Medrese bilmecesi | Kangal rozeti |
| 14 | Ardahan · Donmuş Çıldır | 75 | Zor | Buz delikleri, kırılan göl buzu, rüzgâr | Kızak Çanı |
| 15 | Bayburt (Uktun) · Kale ve Fırtına | 69 | Çok Zor | Karşı rüzgâr, Çoruh salları | Kopuz |

## Yolcular ve Şehir İnsanları

<img src="docs/img/portraits.png" alt="Uktun, Memo Çelik ve şehir insanlarının piksel portreleri" width="100%">

**Uktun**, İstanbullu bir haritacı; **Memo Çelik**, Diyarbakırlı bir telefoncu. İkisinden biri, dedesi Yusuf’un tavan
arasında kalmış “Memleket” defterini bulur. Her sayfa bir şehre ayrılmış, son sayfada tek bir cümle var:
“Yolun sonu, başladığım yer.”

Portreler `scripts/art/painter.py` ile boyanır: sol üstten vuran gün batımı ışığı, sıcak ışık ve soğuk gölge,
seçici dış hat, kenar ışığı ve her yolcunun kendi şehri arka planda.

## Ekranlar

<table>
<tr>
<td width="50%"><img src="docs/img/intro.png" alt="Gaziantep giriş ekranı: dedenin notu ve şehirdeki dost ile tehlikeler"><br><sub>Her şehrin girişinde dedenin notu ve <b>Bu Şehirde</b> rehberi: kim dost, kim tehlikeli.</sub></td>
<td width="50%"><img src="docs/img/complete.png" alt="Bölüm sonu: süre, madalya, hatıralar, kartpostal ve skor tablosu"><br><sub>Bölüm sonu: süre ve madalya, bulunan hatıralar, kartpostal, skor tablosu.</sub></td>
</tr>
<tr>
<td><img src="docs/img/mobile-dialog.png" alt="Telefonda yatay ekranda Mardin'de bir şehir insanıyla konuşma"><br><sub>Telefonda yatay: diyalog iki kontrolün arasına oturur, karakteri kapatmaz.</sub></td>
<td><img src="docs/img/about.png" alt="Oyun içi Hakkında ekranı, artbook düzeninde"><br><sub>“Oyun Hakkında” menüden açılan bir artbook: Hikâye, Yolcular, Rota, Küçük Bir Sözlük.</sub></td>
</tr>
</table>

<p align="center"><img src="docs/img/title-en.png" alt="İngilizce başlık ekranı" width="640"><br><sub>Başlık ekranındaki TR / EN düğmesiyle bütün oyun İngilizceye geçer.</sub></p>

## Kontroller

| | Hareket | Zıpla | Atıl | Diğer |
|---|---|---|---|---|
| **Klavye** | ← → · A D | ↑ · W · Z (basılı tut, daha yükseğe) | Space · X · Shift (8 yöne) | ↓ ince platformdan in · Esc mola · R bayraktan dön |
| **Dokunmatik** | Sol yarıda yüzen joystick | ZIPLA | ATIL (joystick yönünde) | Büyük tuş seçeneği |
| **Oyun kolu** | Sol çubuk | A · Y | X · B · RT | |

Duvara doğru basılı tutup zıplarsan tırmanırsın. Atılma yere değince ya da bir düşmana basınca yenilenir:
atkın kırmızıysa hazırsın, griyse harcadın.

## Geliştirme

```bash
npm install
cp .env.example .env.local   # DATABASE_URL (Neon)
npm run db:migrate           # yalnızca memleket_* tablolarını oluşturur
npm run dev
```

| Komut | Ne Yapar |
|-------|----------|
| `npm run typecheck` | TypeScript |
| `npm test` | Fizik, mekanik ve bölüm verisi testleri (vitest) |
| `npm run verify:levels` | Her bölümü gerçek fizik motoruyla oynayan çözücü: çıkış, her hatıra, bayrak, anahtar ve gizli pul ulaşılabilir mi |
| `npm run build` | Üretim derlemesi |

Claude ya da başka bir ajanla çalışıyorsan önce **[CLAUDE.md](CLAUDE.md)**: kurallar, proje haritası, yeni şehir
ekleme adımları ve öğrenilmiş tasarım tuzakları orada. Bölüm tasarımı için `.claude/agents/level-designer.md`.

```text
game/          DOM'suz oyun çekirdeği: fizik (sim), bölümler, çizim, ses, karakterler, portreler, İngilizce metinler
components/    React arayüzü: bütün ekranlar, artbook, şehir rehberi, diyalog, HUD, dokunmatik kontroller
lib/           kayıt ve harita sürümü, TR/EN, paylaşım, veritabanı
app/           / oyun · /hakkinda · /skor paylaşım sayfası · /skor/kart kartpostal · /api skor ve oyuncu
scripts/       verify-levels çözücü, migrate, art/ (portre ressamı, harita üreteçleri)
tests/         fizik ve mekanik testleri
```

Her şey kodla üretilir: harici sprite ya da ses dosyası yoktur. Müzik her şehrin makamında, oynarken WebAudio ile çalınır.

**Teknoloji:** Next.js 16 · React 19.2 · TypeScript · Tailwind CSS v4 · kendi canvas motoru (120 Hz sabit adım) ·
Neon + Drizzle · Vercel.

---

<div align="center"><sub>Tasarım ve geliştirme: Ahmet Akyapı</sub></div>
