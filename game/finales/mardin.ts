import type { Prelude } from './types'

/**
 * Abbara: evlerin altından geçen dar sokak. İlk plaka mavi kapıları açar, kırmızı kapıyı kapatır;
 * kırmızının ötesine kuyudan seke seke çıkıp üst odadan inilir. Üst odadaki plaka tuzaktır: basılırsa
 * aşağıdaki mavi kapı kapanır, dönüp bir daha basmak gerekir. Nazar boncuğu o plakanın açtığı kırmızı köşede.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Abbara: evlerin altından geçen sokak. Plaka mavi kapıları açar, kırmızıları kapatır.',
    'Kırmızı kapı kapandı. Kuyudan çık: duvara doğru bas, değince zıpla, karşı duvara seke seke yüksel.',
    'Bu plaka kırmızı köşeyi açar ama aşağıdaki mavi kapıyı kapatır. Basmadan atla ya da dönüşte bir daha bas!',
    'Mavi kapı kapalıysa üst odadaki plakaya bir daha bas: kuyudan geri tırman.',
  ],
  hintsEn: [
    'Abbara: a lane running beneath the houses. The plate opens blue doors and closes red ones.',
    'The red door is shut. Climb the shaft: push toward a wall, jump on contact, and bounce up from wall to wall.',
    'This plate opens the red corner but shuts the blue door below. Jump over it, or press it again on your way back!',
    'If the blue door is closed, press the plate in the upper room once more: climb back up the shaft.',
  ],
  npcs: [{ name: 'Sabuncu Şemun', look: 'amca', text: 'Abbaralar yazın serin, kışın kuytudur; komşu komşunun evinin altından geçer, kimse gücenmez. Bıttım sabunum gibi sabırlı ol: her plakaya basılmaz, bazısının üstünden atlanır.' }],
  npcsEn: [{ name: 'Şemun the Soap Maker', text: 'The abbaras are cool in summer and sheltered in winter; neighbours pass beneath each other’s houses and nobody minds. Be patient like my pistachio soap: not every plate is for pressing, some are for jumping over.' }],
  chunks: [
    [
      '        #                                               ',
      '        #                                               ',
      '        #                                               ',
      '        #                                               ',
      '        ########################################        ',
      '        ########################################        ',
      '        ############              ]#############        ',
      '        ############              ]#############        ',
      '        ############              ]% ###########        ',
      '        ############    ?  _      ]%!###########        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '        ############  ##########  ##############        ',
      '               [            ]            [              ',
      '               [            ]            [              ',
      '  ?  n     _   [        ?   ]         ?  [         l k  ',
      '########################################################',
      '########################################################',
      '########################################################',
      '########################################################',
    ],
  ],
}
