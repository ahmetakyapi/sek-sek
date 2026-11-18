/**
 * Kullanıcı adı kuralı: sunucu (lib/players.ts) ve formlar (AuthForm, NameForm) aynı işlevi kullanır. DOM'suz, sunucusuz.
 *
 * Taklit önlemi: yalnız Latin alfabesinin harfleri (Türkçe harfler dahil), ASCII rakam, boşluk ve - _ . kabul edilir.
 * Kiril "А" ile Latin "A" gibi benzer harfler, tam genişlikli "Ａ" ve birleşik işaretli yazımlar ("s" + U+0327) reddedilir;
 * yoksa "Аyşe" skor tablosunda "Ayşe" gibi görünürdü. Görünmez karakterler (sıfır genişlikli boşluk) zaten harf değildir.
 */
const NAME_RE = /^[\p{Script=Latin}0-9 _.-]{2,16}$/u

/** Boşlukları toparlar ve bileşik biçime (NFC) getirir: "s" + U+0327 → "ş" */
export const cleanName = (n: unknown) => (typeof n === 'string' ? n.normalize('NFC').trim().replace(/\s+/g, ' ') : '')

/** Yeni ad (üye olurken ya da ad değiştirirken) kurala uyuyor mu; giriş eski adlarla da çalışır, bunu kullanmaz */
export const validName = (name: string) => NAME_RE.test(name) && name.normalize('NFKC') === name && /[\p{L}0-9]/u.test(name)

/**
 * Çakışma anahtarı: büyük/küçük harf ve Türkçe I/ı/İ/i farkı gözetmez. Kayıtlı anahtar (`name_key`, tr küçük harf)
 * "Irmak"ı "ırmak", "irmak"ı "irmak" yapar; ikisi ayrı hesap olabiliyordu. Yeni ad bu anahtarla da boşta olmalı.
 */
export const nameFold = (name: string) => name.toLocaleLowerCase('tr').replace(/ı/g, 'i')
