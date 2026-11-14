import type { Prelude } from './types'

/**
 * TASLAK: gerçek tasarım level-designer aşamasında. Bu harita yalnız oynanabilir bir iskelettir (çözücü geçer).
 * Ferhat'ın su kanalı: üç kapak (göğe kadar turuncu, mavi, turuncu taş) kanalı keser, her kapağın önünde bir plaka var.
 * Plaka iki rengi birden çevirir: öndeki kapak açılırken arkadaki kapanır; sırayla basan geçer, bir plakayı atlayan
 * sıradaki kapağa takılır, geri dönüp basar. Nazar boncuğu üçüncü plakanın gerisinde: plakaya basınca beliren
 * mavi basamağın üstünde (bas, geri dön, basamağa çık).
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Ferhat’ın kanalı. Plakaya bas: turuncu kapak açılır, mavi kapak kapanır. Bir daha basarsan geri döner.',
    'Kapaklar sırayla açılır: her kapağın önündeki plakaya bir kez bas. Yol kapandıysa geri dön, son bastığın plakaya yeniden bas.',
  ],
  hintsEn: [
    'Ferhat’s channel. Step on the plate: the orange gate opens and the blue gate closes. Step again and they swap back.',
    'The gates open in order: press the plate in front of each gate once. If the way closes, go back and press the last plate again.',
  ],
  npcs: [{ name: 'Savakçı İlyas Dayı', look: 'amca', text: 'Ferhat bu kanalı Şirin’e kavuşmak için kayaya oymuş derler evlat; suyu şehre o getirecekmiş. Kapakları sırayla açarsan su da yol da akar. Son plakaya basınca arkana bir bak: su çekilince ortaya çıkan basamak boşuna durmaz.' }],
  npcsEn: [{ name: 'Uncle İlyas the Sluice Keeper', text: 'They say Ferhat carved this channel through the rock to win Şirin, my child; he was to bring water to the city. Open the gates in order and both the water and the road will flow. After the last plate, look behind you: the step that rises there is not for nothing.' }],
  chunks: [
    [
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]  !         [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]]            [[                ',
      '            [[            ]] ]]         [[                ',
      ' ?  n   _   [[ ?     _    ]] ]]   _     [[   l      k     ',
      '#################~~##################~~###################',
      '#################~~##################~~###################',
      '#################~~##################~~###################',
      '#################~~##################~~###################',
    ],
  ],
}
