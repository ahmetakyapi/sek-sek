import type { Prelude } from './types'

/**
 * Erciyes teleferiği: kabinler (dikey platform) oyuncuyu istasyondan istasyona taşır. Önce güvenli yerde yerden
 * ilk istasyona bin; ikinci kabine aşağıdayken bin, tepede karşıya atla. Son kabin dikenli karın üstünde iner:
 * yanından geçerken alçaktaki istasyona atla (kaçıran istasyondaki bayrağa döner, kabin hep geri gelir).
 * Nazar boncuğu ikinci kabinin tepesinde, istasyonun ters yanında, geriye bakan küçük kaya çıkıntısında.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: [
    'Erciyes teleferiği. Kabine bin, seni ilk istasyona çıkarsın; tepeye varınca sağa atla.',
    'İkinci kabin aşağıdayken bin. Tepede durduğunda karşı istasyona atla.',
    'Son kabin aşağı iner. Alçaktaki istasyonun yanından geçerken atla; kaçırırsan acele etme, kabin geri gelir.',
  ],
  hintsEn: [
    'The Erciyes cable car. Hop in and it lifts you to the first station; at the top, jump to the right.',
    'Board the second car while it is down. When it stops at the top, jump to the far station.',
    'The last car goes down. Jump as it passes the low station; if you miss it, no rush, the car always comes back.',
  ],
  npcs: [{ name: 'Teleferikçi Oğuz', look: 'coban', text: 'Erciyes’te rüzgâr sert eser ama kabinlerim kışın da yazın da çalışır. Acele etme, kabin geri gelir. İkinci kabin tepeye varınca herkes ileri bakar; ben geriye bakarım, dağ orada bir göz saklar.' }],
  npcsEn: [{ name: 'Oğuz the Cable Car Man', text: 'The wind blows hard on Erciyes, but my cars run winter and summer alike. No rush, the car always comes back. When the second car reaches the top, everyone looks ahead; I look back, the mountain keeps an eye hidden there.' }],
  chunks: [
    [
      '                                                                ',
      '                                                                ',
      '                                                                ',
      '                        !                                       ',
      '                       ###                                      ',
      '                            :      F ?    l    :                ',
      '                                 ############  NNN              ',
      '                                 ############                   ',
      '                                                                ',
      '                                                       l        ',
      '                                                    ######      ',
      '        :     F  ?     l                            ######      ',
      '             ############## NNN                                 ',
      '             ############## :                  :                ',
      '                  #########                                     ',
      '                  #########                                     ',
      '                  #########                                     ',
      '                  #########                                     ',
      '                  #########                                     ',
      ' ?  n t NNN       #########^^^^^^^^^^^^^^^^^^^^^^^^^        t   ',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
    ],
  ],
}
