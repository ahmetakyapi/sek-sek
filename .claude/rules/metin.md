---
paths:
  - "game/content.en.ts"
  - "lib/ui.en.ts"
  - "game/flagMoments.ts"
  - "game/story.ts"
  - "components/**"
---

# Metin ve arayüz

- Her metin TR + EN: arayüzde `t('…')` + `lib/ui.en.ts`; bölüm metni `levels.ts` + `content.en.ts`;
  finalde `hints` / `hintsEn`, `npcs` / `npcsEn` yan yana.
- Başlık, alt başlık, düğme, rozet ve erişilebilirlik etiketi **Title Case**; paragraf ve ipucu cümle düzeni.
  Tek kelimelik yetim satır bırakma; nokta ya da ayraçla başlayan satır olmasın.
- Tabela ne yapılacağını söyler (bir, en çok iki cümle). Şehir insanı şehri anlatır, gizli köşeyi üstü kapalı fısıldar.
  Kişi adları oyun genelinde tekrar etmez. Tarih ve sayı içeren bilgiler doğrulanmış olmalı; emin değilsen yuvarla ("15. yüzyılda").
- Okunaklılık: gövde metni en az 14 px, yardımcı metin en az 11 px; soluk metin `text-muted`, daha soluğu yok.
- Yeni düğme ya da kutu telefonda yatay ekranda kontrolleri ve karakteri kapatmasın (`node scripts/preview.cjs <şehir> start out.png --telefon`).
- **Oyun terimleri Türkçeleştirilmez.** Türkçede de yaygın bilinen oyun ve yazılım sözleri olduğu gibi kullanılır:
  Boss, Boss Rush, Dash, Checkpoint, Skor, Mod, Rekor, Combo, Speedrun, Easter egg. "Patron", "bekçi" (boss anlamında),
  "atıl / atılma", "kontrol noktası" yazılmaz. Türkçe ek kesmeyle gelir: boss’u, boss’lar, dash’i, checkpoint’e.
  Fiil gerekiyorsa "dash at". Dünyadaki nesne kendi adıyla kalır (bayrak, tabela, hatıra, nazar boncuğu); terim, işlevin adıdır.
  Zaten yerleşmiş Türkçe karşılıklar (Bölüm, Ayarlar, Mola, Süre, Düşüş, Hayalet Koşu, Rahat Mod) değiştirilmez.
- Çerçeve hikâye: defter, sahafta bulunan bir **Seyyah**'ın yol defteridir ("Yol Defteri"); "dede" anlatısı kullanılmaz.
