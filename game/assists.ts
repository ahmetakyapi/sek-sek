/**
 * Kolaylık yamaları: her yaştan oyuncu için birleşmiş haritaya en son uygulanan küçük düzeltmeler
 * (araya bayrak, çukura basamak, kıl payı atlayışa pay). scripts/audit-difficulty.ts bulur.
 *
 * Her yama altındaki haritanın beklenen halini (`from`) taşır: kaynak parçalar değişip yama kayarsa
 * sessizce yanlış yere yazılmaz, hata verir (tests/sim.test.ts bütün yamaları dener).
 * Koordinatlar birleşmiş haritada: x sütun, y satır (0 = en üst).
 */
export interface Assist {
  x: number
  y: number
  /** yamanın değiştireceği bölgenin şimdiki hali */
  from: string[]
  /** yeni hali (aynı boyda) */
  to: string[]
  /** neden: denetim notu */
  why: string
}

export const ASSISTS: Record<string, Assist[]> = {
  van: [
    { x: 53, y: 8, from: ['   ', ' # ', '###'], to: ['   ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  sinop: [
    { x: 131, y: 16, from: ['   ', '   ', '###'], to: ['   ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  sanliurfa: [
    { x: 204, y: 13, from: ['  ', ' l', '##'], to: [' l', '##', '%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  canakkale: [
    { x: 170, y: 16, from: ['   ', ' t ', '###'], to: [' t ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  bursa: [
    { x: 195, y: 16, from: ['  ', ' l', '##'], to: [' l', '##', '%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  edirne: [
    { x: 176, y: 16, from: ['   ', ' t ', '###'], to: [' t ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  istanbul: [
    { x: 176, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 166, y: 20, from: ['~~', '~~', '~~', '~~'], to: ['##', '##', '##', '##'], why: 'Kolay bölümde 8 karolık su dash+halka+dash at istiyordu: ortaya iskele kazığı, iki kısa atlayış' },
  ],
  kocaeli: [
    { x: 100, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 137, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  izmir: [
    { x: 163, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 174, y: 20, from: ['  ', '  ', '  ', '^^'], to: ['##', '##', '##', '##'], why: '8 karolık dikenli çukur dash+halka zinciri istiyordu: ortaya basamak' },
    { x: 185, y: 17, from: ['  ===       ===       === ', '                          '], to: ['                          ', '   ===   ===   ===   ===  '], why: 'Diken tarlasındaki iskeleler zeminden 48 piksel yüksekti (zıplama sınırı): 32 piksele indi, aralar 3 karo' },
  ],
  ankara: [
    { x: 167, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 221, y: 10, from: ['   ', ' z ', '###'], to: [' z ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  konya: [
    { x: 105, y: 6, from: ['   '], to: ['==='], why: 'Medresenin damına giden köprü ile dam arasında 5 karo boşluk vardı (kural en çok 3): zayıf oyuncu gizli pula varamıyordu. Köprü üç karo uzadı' },
    { x: 123, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  nevsehir: [
    { x: 34, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 170, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  adana: [
    { x: 122, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 165, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  gaziantep: [
    { x: 36, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 128, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  diyarbakir: [
    { x: 6, y: 17, from: ['   '], to: ['==='], why: 'Başlangıçtaki burcun içinde karpuz 5 karo yukarıda asılıydı; yalnız iki asılı duvar arasında sekerek alınıyordu, oyunun başında kimse tahmin etmez. Burcun içine basamak tahtası: üstüne çıkan zıplayınca alır' },
    { x: 58, y: 12, from: ['   ', '   ', '###'], to: ['   ', '###', '%%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  mardin: [
    { x: 40, y: 11, from: ['C', ' '], to: [' ', 'C'], why: 'Hatıra çatlak taş köprünün bir karo üstünde asılıydı: köprü basınca dağıldığı için zıplamaya vakit kalmıyor, zayıf oyuncu alamıyordu. Koşarken alınacak yüksekliğe indi' },
    { x: 160, y: 17, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  malatya: [
    { x: 100, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 160, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 194, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 86, y: 19, from: ['^^'], to: ['  '], why: 'Direk üstündeki yaydan sonraki 7 karoluk diken tarlasını zayıf oyuncu (koşu %8 yavaş) aşamıyordu: son iki diken kalktı, iniş payı 2 karo' },
    { x: 210, y: 18, from: ['  ', '  ', '##'], to: ['  ', '##', '%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  corum: [
    { x: 10, y: 19, from: [' '], to: ['#'], why: 'İlk ok yerden başlangıç noktasına dek uçuyordu: tabelayı ya da Leblebici’yi okuyan vuruluyordu. Araya oku durduran taş; oyuncu taşı aşınca okla tanışır' },
    { x: 134, y: 15, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 208, y: 15, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 211, y: 15, from: [' '], to: ['#'], why: 'Meydan kapısının yanındaki ok bayrağa (208) ve Kale Bekçisi’ne (202) dek uçuyordu: bayrakta doğan ya da konuşan vuruluyordu. Bayrağın sağına oku durduran taş' },
  ],
  ordu: [
    { x: 136, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 171, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 221, y: 16, from: ['  ', '  ', '##'], to: ['  ', '##', '%%'], why: 'Tünel ağzı 1 karo yüksekti: gövde (26 px) sığmadığı halde yürüyerek giriliyordu. Tavan bir kademe yükseldi (içi 2 karo), üstteki süs yeni çatıya çıktı' },
  ],
  trabzon: [
    { x: 39, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 125, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  sivas: [
    { x: 127, y: 19, from: ['e'], to: [' '], why: 'Çatlak taşlardan (üstünde beklenemez) inilen buz zeminin tamamında kurt geziyordu: iniş kurda denk gelirse kaçış yoktu. Kurt inişin ötesine taşındı' },
    { x: 131, y: 19, from: [' '], to: ['#'], why: 'Kurdun önüne küçük taş: iniş alanına (126-130) girmesin' },
    { x: 136, y: 19, from: [' '], to: ['e'], why: 'Kurdun yeni yeri: inişten sonra, taşla buz kıyısı arasında gezer' },
    { x: 108, y: 13, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 168, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  ardahan: [
    { x: 174, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 148, y: 18, from: ['      III        '], to: ['  ##  III   ##   '], why: '27 karolık diken tarlasında adalar arası 6–8 karoydu (dash+halka zinciri): iki taş, aralar en çok 3 karo' },
  ],
  bayburt: [
    { x: 30, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 174, y: 7, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 152, y: 7, from: ['                X'], to: ['  ##       ##   X'], why: 'Rüzgâra karşı çöken adalar arası 7–8 karoydu (dash+halka zinciri): iki sağlam taş, aralar en çok 3 karo' },
  ],
}

export function applyAssists(id: string, map: string[]): string[] {
  const list = ASSISTS[id]
  if (!list) return map
  const out = [...map]
  for (const a of list) {
    a.from.forEach((want, j) => {
      const got = out[a.y + j].slice(a.x, a.x + want.length)
      if (got !== want) throw new Error(`Kolaylık yaması kaydı (${id} @${a.x},${a.y + j}): beklenen "${want}", bulunan "${got}" — ${a.why}`)
    })
    a.to.forEach((row, j) => {
      const r = out[a.y + j]
      out[a.y + j] = r.slice(0, a.x) + row + r.slice(a.x + row.length)
    })
  }
  return out
}
