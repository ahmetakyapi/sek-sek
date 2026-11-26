import type { Prelude } from './types'

/**
 * Nemrut kraterinin içi: soğuk göller ve sıcak gözeler. Krater duvarları tepeye dek çıkar, altlarından su
 * yolu geçer; su yollarını renkli kapaklar keser. Plakalar kıyıda ve göldeki kayanın üstündedir.
 *  1. Soğuk göl: turuncu kapak kapalı. Kıyıdaki plakaya bas (turuncu açılır, mavi belirir), dal, duvarın altından yüz.
 *  2. Sıcak gözeler: kaynar suyun üstünde iki halat; halattan halata.
 *  3. İkinci göl: bu kez kapak mavi (açık kalmış plakayla kapalı). Önündeki kıyı plakası açar ama karşı kıyının mavi
 *     basamaklarını da siler: duvarın öbür yanında, göldeki kayanın üstündeki plakaya bas, basamaklar geri gelir.
 * Kilitlenme yok: iki göl plakası da yüzülerek yeniden basılır; bayrak ikinci gölün başında.
 * Nazar boncuğu ikinci gölde, duvardan sarkan halatın tepesindeki taş rafta: sudan sıçrayıp halata tutunan, sonuna dek tırmanan alır.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Nemrut kraterinin içi. Duvarın altındaki su yolunu turuncu kapak kesiyor: plakaya bas, kapak kalkar. Sonra dal, duvarın altından yüz.',
    'Bu kapak mavi. Buradaki plaka onu açar ama karşı kıyının mavi basamaklarını da götürür. Duvarın öbür yanında, kayanın üstünde bir plaka daha var.',
  ],
  hintsEn: [
    'Inside Nemrut’s crater. An orange gate blocks the waterway under the wall: step on the plate and the gate lifts. Then dive and swim under the wall.',
    'This gate is blue. The plate here opens it, but it also takes away the blue steps on the far shore. Beyond the wall, on the rock in the lake, there is another plate.',
  ],
  npcs: [{ name: 'Kaplıcacı Medeni Dayı', look: 'amca', text: 'Kraterin bir gözü buz gibi, öbürü kaynar evlat; kaynara elini bile sokma, halattan geç. İkinci gölde duvardan bir halat sarkar, ucu suya değmez; sudan sıçrayıp tutunan, sonuna dek tırmanınca rafta parlayan şeyi görür.' }],
  npcsEn: [{ name: 'Uncle Medeni of the Hot Springs', text: 'One spring of the crater is ice cold and the other is boiling, my child; do not even dip a hand in the hot one, cross on the ropes. In the second lake a rope hangs from the wall, its end just above the water; leap out and grab it, climb to the very top, and you will see something shining on the ledge.' }],
  chunks: [
    [
      '           ####                              ###                      ',
      '           ####                              ###                      ',
      '           ####                              ###                      ',
      '           ####                              ###                      ',
      '           ####                              ###                      ',
      '           ####                              ###                      ',
      '           ####          ##########          ###                      ',
      '           ####          ##########          #######                  ',
      '           ####            L   L             #######                  ',
      '           ####            L   L             ###  L                   ',
      '           ####            L   L             ###! L                   ',
      '           ####            L   L             #### L                   ',
      '           ####            L   L             ###  L                   ',
      '           ####            L   L             ###  L                   ',
      '           ####            L   L             ###  L                   ',
      '           ####            L   L             ###  L                   ',
      '           ####            L   L             ###  L          ###      ',
      '           ####            L   L             ###  L        ]]###      ',
      '           ####            L   L             ###     _     ]]#####    ',
      ' ? n _     ####                     F ?_     ###    ###  ]]]]#####    ',
      '######WWWWWWW[WWWWWWW####~~~~~~~~~~#####WWWWWW]WWWWW###WWWWWW#########',
      '######WWWWWWW[WWWWWWW####~~~~~~~~~~#####WWWWWW]WWWWW###WWWWWW#########',
      '######WWWWWWW[WWWWWWW####~~~~~~~~~~#####WWWWWW]WWWWW###WWWWWW#########',
      '#########################~~~~~~~~~~###################################',
    ],
  ],
}
