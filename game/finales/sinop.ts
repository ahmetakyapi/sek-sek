import type { Prelude } from './types'

/**
 * Tarihî Sinop Cezaevi koğuşları: tek koridor, altı plaka. Her plaka mavi kapı ve köprüleri kırmızılarla değiştirir;
 * hangisine basıp hangisinin üstünden atlayacağını ilerideki rengi okuyarak bulursun (bas, atla, bas, bas, atla, atla).
 * Mavi köprü geçilip kapı açılınca arkadan çekilir: nazar boncuğu o köprünün altında, dikenlerin bittiği köşede.
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'Tarihî Sinop Cezaevi. Plakaya basınca mavi kapılar açılır; bir daha basılınca kapanır. İlk kapı için bas.',
    'Her plakaya basılmaz. Öndeki kapı zaten açıksa plakanın üstünden atla; yanlış bastıysan inip yeniden bas.',
    'Mavi köprü, mavi kapılar kapalıyken durur. Plakaya bas, köprüden geç; karşıdaki plaka kapıyı açar, köprüyü çeker.',
    'Kırmızı köprü şimdi sağlam. Yerdeki plakayı da, köprünün ortasındakini de atla: basarsan köprü altından kayar.',
  ],
  hintsEn: [
    'The historic Sinop Prison. Step on a plate and the blue doors open; step again and they shut. Press for the first door.',
    'Not every plate wants pressing. If the door ahead is already open, hop over the plate; if you pressed by mistake, step off and press again.',
    'The blue bridge holds while the blue doors are shut. Press the plate and cross; the plate on the far side opens the door and pulls the bridge away.',
    'The red bridge is solid now. Hop over the plate on the floor and the one in the middle of the bridge: press either and the bridge slips from under you.',
  ],
  npcs: [{ name: 'Müze Rehberi Nurettin', look: 'amca', text: 'Burası 1887’den 1997’ye dek cezaevi idi, şimdi müze. Sabahattin Ali “Aldırma Gönül”ü bu duvarların ardında yazdı. Koğuşların kapıları sırayla açılır, acele etme. Mavi köprü çekilince dibine de bir bak evlat.' }],
  npcsEn: [{ name: 'Nurettin the Museum Guide', text: 'This was a prison from 1887 to 1997; now it is a museum. Sabahattin Ali wrote “Aldırma Gönül” behind these walls. The ward doors open in turn, so take your time. And when the blue bridge pulls away, have a look underneath, my child.' }],
  chunks: [
    [
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         #                                                ',
      '         ##########################################       ',
      '         ##########################################       ',
      '         ##########################################       ',
      '         ##########################################       ',
      '         ##########################################       ',
      '         [        [                [                      ',
      '         [        [                [                      ',
      '         [        [                [                      ',
      ' ?  n  _ [ ?  _   [ ? _           _[F ? _     _        l  ',
      '########################[[[[[[[[[#########]]]]]]]]]#######',
      '########################^^^^^^^ !#########^^^^^^^^^#######',
      '##########################################################',
      '##########################################################',
    ],
  ],
}
