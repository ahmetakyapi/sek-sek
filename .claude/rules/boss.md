---
paths:
  - "game/boss.ts"
  - "game/bossDraw.ts"
  - "scripts/bossbot.ts"
  - "tests/boss.test.ts"
---

# Boss’lar

Kural her şehirde aynıdır ve değişmez: **işaret → saldırı → yorgunluk → üstüne bas**. Saldırırken dokunmak yakar,
yorgunken yandan dokunmak zararsızdır; basış ya da dash can götürür. Hareketler saate bağlıdır, rastgelelik yoktur.

- Yeni boss: `BOSSES` (ad TR/EN, can ≥ 3, `moves` sırası, hız, kutu, nasıl yenileceğini söyleyen `taunt` TR/EN) +
  `bossDraw.ts` içinde `PAINT[şehir]`. Şehrin bir ayrıntısından doğar; şehrin dost hayvanıyla aynı tür olmaz.
- Hareketler: `charge` (toslar, duvarda sersemler) · `dive` (gölgesi düşer, dalar) · `hop` (üç sıçrar, yorulur) ·
  `burrow` (toprak kabarır, çıkar, savurur) · `throw` (üç kavisli atış, soluklanır). Yeni hareket eklemek kural
  değişikliğidir: işaret süresi en az 0,6 sn, yorgunluk en az 2 sn olsun.
- Zorluk yalnız `speed` ve `hp` ile ayarlanır; işaret ve yorgunluk süreleri (`BOSS`) herkese aynıdır.
- Kanıt: `npx tsx scripts/bossbot.ts <şehir>` (bot ve zayıf oyuncu botu yenmeli) + `tests/boss.test.ts`.
- Her boss'un üç lafı vardır (`game/bossLines.ts`: uyanınca, yorulunca, basılınca; TR + EN, kısa, şehre özgü, komik).
  Yeni boss lafsız eklenmez. Nasıl yenileceğini üç yer söyler ve üçü de aynı kuralı anlatır: arenadaki tabela (`taunt`),
  boss uyanınca çıkan üç adım (İşareti Gör → Saldırıdan Kaç → Yorulunca Üstüne Bas) ve yorgunken üstündeki "Şimdi Bas!" oku.
- Komedi çizimdedir (yorulunca dil dışarı, ter; vurulunca ezilme; yenilince beyaz bayrak), kuralda değil: süreler ve temas değişmez.
