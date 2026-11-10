---
paths:
  - "game/boss.ts"
  - "game/bossDraw.ts"
  - "scripts/bossbot.ts"
  - "tests/boss.test.ts"
---

# Patronlar

Kural her şehirde aynıdır ve değişmez: **işaret → saldırı → yorgunluk → üstüne bas**. Saldırırken dokunmak yakar,
yorgunken yandan dokunmak zararsızdır; basış ya da atılma can götürür. Hareketler saate bağlıdır, rastgelelik yoktur.

- Yeni patron: `BOSSES` (ad TR/EN, can ≥ 3, `moves` sırası, hız, kutu, nasıl yenileceğini söyleyen `taunt` TR/EN) +
  `bossDraw.ts` içinde `PAINT[şehir]`. Şehrin bir ayrıntısından doğar; şehrin dost hayvanıyla aynı tür olmaz.
- Hareketler: `charge` (toslar, duvarda sersemler) · `dive` (gölgesi düşer, dalar) · `hop` (üç sıçrar, yorulur) ·
  `burrow` (toprak kabarır, çıkar, savurur) · `throw` (üç kavisli atış, soluklanır). Yeni hareket eklemek kural
  değişikliğidir: işaret süresi en az 0,6 sn, yorgunluk en az 2 sn olsun.
- Zorluk yalnız `speed` ve `hp` ile ayarlanır; işaret ve yorgunluk süreleri (`BOSS`) herkese aynıdır.
- Kanıt: `npx tsx scripts/bossbot.ts <şehir>` (bot ve zayıf oyuncu botu yenmeli) + `tests/boss.test.ts`.
