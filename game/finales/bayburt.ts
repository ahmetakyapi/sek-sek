import type { Prelude } from './types'

/**
 * Bayburt Kalesi’nin burçları: rüzgâr yüzüne eserken burçtan burca atla, duvara sekerek iç kaleye tırman.
 * Avluya düşmek ceza değildir, basamaklar yine yukarı çıkarır; uzak burca kristalli çift atılma isteğe bağlı kestirmedir.
 * Nazar boncuğu asma burcun tepesinde: iç kaleye varınca geri dön, rüzgârı arkana alıp atla.
 */
export const prelude: Prelude = {
  medal: 85,
  hints: [
    'Burca çık: duvara doğru zıpla, duvara değince bir daha zıpla. Rüzgâr yüzüne eser; avluya düşersen basamaklar seni yine yukarı çıkarır.',
    'Karşı burç uzak. Atıl, kristale dokun, bir daha atıl; ya da avluya inip basamaklardan çık. İkisi de yoldur.',
    'İç kale yüksek: duvarına zıpla, değince yine zıpla. Tepeye varınca geri dön, rüzgârı arkana al; asma burçta bir şey parlıyor.',
  ],
  hintsEn: [
    'Climb the bastion: jump at the wall, and jump again when you touch it. The wind blows in your face; if you drop into the yard, the steps lead back up.',
    'The next bastion is far. Dash, touch the crystal and dash again; or go down to the yard and take the steps. Both are roads.',
    'The keep is tall: jump at its wall, and jump again when you touch it. At the top, turn back and put the wind behind you; something shines on the hanging bastion.',
  ],
  npcs: [{ name: 'Taş Ustası Hamza', look: 'usta', text: 'Bu burçları dedelerimiz rüzgâra karşı ördü, taş taş. Rüzgâr yüzüne eserse eğil, arkandan eserse kanat yap. Kaleyi aşan, meydanda kendini bulur evlat.' }],
  npcsEn: [{ name: 'Hamza the Stonemason', text: 'Our grandfathers raised these bastions against the wind, stone by stone. When the wind is in your face, lean in; when it is at your back, make it your wings. Whoever crosses the castle finds himself in the square, my child.' }],
  chunks: [
    [
      '                                     !                          ',
      '                                     ##                         ',
      '                                     ##      b  l               ',
      '                                          ########              ',
      '                         *                ########              ',
      '                                          ########              ',
      '                    ?               ?     ###########           ',
      '                   ###       ####   ###   ###########           ',
      '                   ###       ####   ###   ###########           ',
      '       ####   ###  ###    == ####  =###=  ##############        ',
      '       ####   ###  ###       ####   ###   ##############        ',
      '       #### = ###  ### ==    ####=  ###  =################      ',
      ' ?  n  ####   ###  ###       ####   ###   ################   l  ',
      '#################^^#############################################',
      '################################################################',
      '################################################################',
      '################################################################',
    ],
  ],
}
