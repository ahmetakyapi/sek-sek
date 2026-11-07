# Memleket · Şehir Şehir Anadolu

İstanbul’dan Bayburt’a, her şehri kendi dokusuyla aşan bir piksel platform oyunu. Mobilde ve webde oynanır;
harici görsel ya da ses dosyası yoktur: bütün çizimler ve müzik kodla üretilir.

| # | Şehir | Plaka | Zorluk | Yeni mekanik | Hatıra |
|---|-------|-------|--------|--------------|--------|
| 1 | İstanbul · Boğaz Kıyısı | 34 | Kolay | Zıplama, tek yönlü platform, iskele, atılma | Simit |
| 2 | Mardin · Taş Teraslar | 47 | Orta | Akrepler, çatlak taş, duvar tırmanışı | Telkari |
| 3 | Malatya (Erik Diyarı) · Kayısı Bahçeleri | 44 | Orta | Kayısı kasası (yay), dikey platform, arılar | Kayısı |
| 4 | Çorum (Çorumçe) · Hattuşa Surları | 19 | Zor | Hitit ok tuzakları, Yerkapı tüneli | Leblebi |
| 5 | Sivas · Buzlu Kızılırmak | 58 | Zor | Buz, minareler arası tırmanış, kuzgunlar | Kangal rozeti |
| 6 | Bayburt (Uktun) · Kale ve Fırtına | 69 | Çok Zor | Karşı rüzgâr, hepsi bir arada | Kopuz |

Her şehirde üç hatıra saklı; her biri o şehre dair doğrulanmış bir bilgi kartı açar.

**Hikâye:** Uktun ya da Kerem, dedesi Yusuf’un tavan arasında kalmış “Memleket” defterini bulur. Her sayfa bir şehre
ayrılmış, her şehirde üç boş kutu var. Son sayfada tek cümle: “Yolun sonu, başladığım yer.” Yol Bayburt’ta biter.

**Şehir dokusu:** simitçi arabası ve İstanbul kedileri, Mardin’de mırra ve telkari ustası, Malatya’da damda kuruyan
kayısılar, Çorum’da leblebi kazanı ve arkeolog, Sivas’ta çoban ve Kangal’ı Karabaş, Bayburt’ta ozan Korkut Dede.
Her şehirde yanına gidince konuşan iki kişi, altın/gümüş/bronz süre madalyaları.

## Kontroller

- **Klavye:** ← → / A D yürü · Boşluk / Z / ↑ zıpla · X / Shift atıl (yönle 8 yöne) · ↓ + zıpla in · Esc mola · R bayraktan dön
- **Dokunmatik:** sol yarıda yüzen joystick, sağda ZIPLA ve ATIL
- **Oyun kolu:** A/Y zıpla, X/B/RT atıl

## Geliştirme

```bash
npm install
cp .env.example .env.local   # DATABASE_URL (Neon)
npm run db:migrate           # yalnızca memleket_* tablolarını oluşturur
npm run dev
```

| Komut | Ne yapar |
|-------|----------|
| `npm run typecheck` | TypeScript |
| `npm test` | Fizik ve bölüm verisi testleri (vitest) |
| `npm run verify:levels` | Her bölümü gerçek fizik motoruyla oynayan çözücü: çıkış, her hatıra, her bayrak ulaşılabilir mi |
| `npm run build` | Üretim derlemesi |

## Yapı

```text
game/
  types.ts    → tipler, sabitler
  sim.ts      → fizik ve dünya (DOM'suz, testlenebilir): coyote time, zıplama tamponu, duvar sekmesi, atılma
  levels.ts   → bölüm haritaları (ASCII, lejant dosyanın başında) + şehir bilgileri
  art.ts      → şehir paletleri, arka plan siluetleri, piksel sprite'lar
  render.ts   → düşük çözünürlüklü tampon + parallax + parçacık + kamera
  input.ts    → klavye, oyun kolu, dokunmatik
  audio.ts    → WebAudio efektleri + makam esintili prosedürel müzik
components/   → React arayüzü (menüler, HUD, dokunmatik kontroller, Türkiye rota haritası)
app/api/scores → skor tablosu (Neon + Drizzle)
scripts/      → verify-levels (çözücü), migrate
```

## Yeni şehir eklemek

1. `game/levels.ts` → yeni `chunk([...])` parçaları ve `LEVELS` dizisine kayıt (plaka, zorluk, 3 bilgi, ipuçları)
2. `game/art.ts` → `CITY` paleti, `buildLayers` silueti, `ITEM_ART` hatıra çizimi
3. `game/audio.ts` → `SCALES` makamı
4. `npm run verify:levels` geçmeden birleştirme
