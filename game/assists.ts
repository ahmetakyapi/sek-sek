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
  istanbul: [
    { x: 176, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 166, y: 20, from: ['~~', '~~', '~~', '~~'], to: ['##', '##', '##', '##'], why: 'Kolay bölümde 8 karolık su dash+kristal+dash at istiyordu: ortaya iskele kazığı, iki kısa atlayış' },
  ],
  kocaeli: [
    { x: 100, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 137, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  izmir: [
    { x: 163, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 174, y: 20, from: ['  ', '  ', '  ', '^^'], to: ['##', '##', '##', '##'], why: '8 karolık dikenli çukur dash+kristal zinciri istiyordu: ortaya basamak' },
    { x: 185, y: 17, from: ['  ===       ===       === ', '                          '], to: ['                          ', '   ===   ===   ===   ===  '], why: 'Diken tarlasındaki iskeleler zeminden 48 piksel yüksekti (zıplama sınırı): 32 piksele indi, aralar 3 karo' },
  ],
  ankara: [
    { x: 167, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  konya: [
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
  mardin: [
    { x: 160, y: 17, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  malatya: [
    { x: 100, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 160, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 194, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  corum: [
    { x: 134, y: 15, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 208, y: 15, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  ordu: [
    { x: 136, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 171, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  trabzon: [
    { x: 39, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 125, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  sivas: [
    { x: 108, y: 13, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 168, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
  ],
  ardahan: [
    { x: 124, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 174, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 148, y: 18, from: ['      III        '], to: ['  ##  III   ##   '], why: '27 karolık diken tarlasında adalar arası 6–8 karoydu (dash+kristal zinciri): iki taş, aralar en çok 3 karo' },
  ],
  bayburt: [
    { x: 30, y: 19, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 174, y: 7, from: [' '], to: ['F'], why: 'Uzun yol: araya bayrak (bayraklar arası en çok ~70 karo)' },
    { x: 152, y: 7, from: ['                X'], to: ['  ##       ##   X'], why: 'Rüzgâra karşı çöken adalar arası 7–8 karoydu (dash+kristal zinciri): iki sağlam taş, aralar en çok 3 karo' },
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
