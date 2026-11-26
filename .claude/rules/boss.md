---
paths:
  - "game/boss.ts"
  - "game/bossDraw.ts"
  - "scripts/bossbot.ts"
  - "tests/boss.test.ts"
---

# Boss’lar

Kural her şehirde aynıdır ve değişmez: **işaret → saldırı → yorgunluk → üstüne bas**. Saldırırken dokunmak yakar,
yorgunken yandan dokunmak zararsızdır; basış ya da dash can götürür. Hareketler saate ve oyuncunun durumuna (yeri, hızı)
bağlıdır, rastgelelik yoktur: aynı girdi aynı dövüşü verir.

- **Ad (kullanıcı kararı, 26 Kasım 2026):** boss adı yaygın Türkçe sözcüklerle kurulur ve kişi adı taşımaz ("Ferhat’ın Kazması" değil "Dağ Delen Kazma", "Kafkasör Boğası" değil "Yayla Boğası"). Şehir adı ya da herkesin bildiği yer adı olabilir ("Malatya Kayısısı"); halk masalı varlıkları (Tepegöz, Şahmaran, Ayaz Ata) kişi sayılmaz.
- Yeni boss: `BOSSES` (ad TR/EN, can ≥ 3, `moves` sırası, hız, `tier`, kutu, nasıl yenileceğini söyleyen `taunt` TR/EN) +
  `bossDraw.ts` içinde `PAINT[şehir]`. Şehrin bir ayrıntısından doğar; şehrin dost hayvanıyla aynı tür olmaz.
- Hareketler: `charge` (toslar, duvarda sersemler) · `dive` (gölgesi düşer, dalar) · `hop` (üç sıçrar, yorulur) ·
  `burrow` (toprak kabarır, çıkar, savurur) · `throw` (üç kavisli atış, soluklanır). Yeni hareket eklemek kural
  değişikliğidir: işaret süresi en az 0,6 sn, yorgunluk en az 2 sn olsun.
- Zorluk üç şeyle ayarlanır: `speed`, `hp` ve **kademe** (`tier`; şehrin etiketine uyar, test bekler). Can artırmak boss'u
  zorlaştırmaz, yalnız uzatır: zorluk kademeden gelir. Kademe 1 (Kolay) hareketleri yalın oynar ve her yaştan
  oyuncu içindir (izi `tests/boss.test.ts` içinde sabitlenmiştir). 16 Kasım 2026'dan beri kademe 1 yalnız Kolay şehirlerde;
  Orta şehirler kademe 2, Zor ve Çok Zor kademe 3 (kullanıcı kararı: boss'lar zorlaşsın). Kademe 2 ve 3 aynı hareketleri sertleştirir:

  | Hareket | Kademe 2 (Orta) | Kademe 3 (Zor, Çok Zor) |
  |---|---|---|
  | `throw` | Öngörülü nişan: oyuncunun durduğu yere değil, hızıyla (en çok koşu hızı; dash sayılmaz) varacağı yere atar; dört atış | Salvo başına iki mermi (durduğu yere + varacağı yere), dört salvo; sırayla yüksek (altından koşulur) ve alçak (üstünden atlanır) |
  | `hop` | İniş yeri oyuncunun gideceği yere göre seçilir; dört sıçrayış | Aynısı + her iniş iki yana şok dalgası yollar |
  | `charge` | Bekleme 0,65 sn (kademe 1: 0,9), hız 195 (150) | Hız 175; duvarda yorulmaz, 0,5 sn işaretle dönüp bir kez daha toslar, ikinci çarpışta yorulur |
  | `dive` | İşaret sürerken oyuncuya hafifçe kayar (26 px/sn), dalarken yeri sabittir; inişte iki yana şok dalgası | Aynısı + iki dalış (ikincisinden önce 0,5 sn işaret) |
  | `burrow` | Çıkınca iki yana savurur | Önce bir delikte sahte kabarır (0,6 sn), sonra oyuncuya en yakın başka delikte gerçek işaretle (0,75 sn) çıkar; iki yana savurur |
  | Son can | Öfke: hamleler arası bekleme 1,25 kat kısalır (`rush`) | Aynısı |

  Şok dalgası yeni bir mermi türü değildir: yerden giden, hafif yerçekimiyle yere gömülüp sönen alçak mermidir (ömrü ~0,6 sn,
  menzili ~80 px): üstünden atlanır ya da uzakta durulur, bir sonraki inişten önce söner.
- **Alt sınırlar (her kademede):** ilk işaret en az 0,6 sn (`BOSS.warnMin`); zincirin sonraki hamlesinden önce en az
  0,45 sn (`BOSS.chainMin`); kademe 2-3'te yorgunluk en az 1,6 sn (`BOSS.tiredMin`). Öfke son iki canda (dört canlıda). Öfke işareti ve yorgunluğu kısaltmaz.
  Kaçışsız örüntü olmaz: aynı anda hem atlanması hem altından geçilmesi gereken iki şey, köşeye sıkıştıran tek hamle yok;
  her saldırının güvenli bir cevabı bulunur. `taunt` kademe davranışını da söyler ("duvardan sekip bir daha gelir").
- Kanıt: `npx tsx scripts/bossbot.ts <şehir>` + `tests/boss.test.ts`. Dört bot da yenmeli: tam görüşlü bot ve zayıf oyuncu
  botu (güvenli cevap var), **insan paylı** bot ve zayıfı (`sight: 'telegraph'`: yalnız gösterilmiş işaretin sonucunu
  öngörür, yeni işarette ileri oynatma kesilir, kararı 0,15 sn geç uygular). Kademe 1'de insan paylı bot en çok iki kez
  düşer (test bekler); kademe 3'te birkaç düşüş beklenen şeydir.
- Her boss'un üç lafı vardır (`game/bossLines.ts`: uyanınca, yorulunca, basılınca; TR + EN, kısa, şehre özgü, komik).
  Yeni boss lafsız eklenmez. Nasıl yenileceğini üç yer söyler ve üçü de aynı kuralı anlatır: arenadaki tabela (`taunt`),
  boss uyanınca çıkan üç adım (İşareti Gör → Saldırıdan Kaç → Yorulunca Üstüne Bas) ve yorgunken üstündeki "Şimdi Bas!" oku.
- Komedi çizimdedir (yorulunca dil dışarı, ter; vurulunca ezilme; yenilince beyaz bayrak), kuralda değil: süreler ve temas değişmez.

## CLAUDE.md'den taşınanlar (26 Kasım 2026)

**Boss değiştirmek.** `game/boss.ts` (BOSSES: can, hareket sırası, hız; BOSS: süreler) → `npx tsx scripts/bossbot.ts <id>`
(bot ve zayıf oyuncu botu yenmeli). Çizimi `game/bossDraw.ts`. Kural her şehirde aynı kalsın: işaret → saldırı → yorgunluk → üstüne bas.
Zorluk kademeyle gelir (`BossDef.tier`; ayrıntı `.claude/rules/boss.md`): Kolay şehirlerin boss'u kademe 1, Orta 2, Zor ve
Çok Zor 3 (16 Kasım 2026: boss'lar zorlaştı, yorgunluk kısaldı); kademe 2-3 boss'lar öngörülü nişan alır, dört kez sıçrar/atar, inişte şok dalgası
yollar, Çok Zor'da duvardan sekip yeniden toslar, iki kez dalar, sahte kabarır. Can artırmak zorluk değildir.
