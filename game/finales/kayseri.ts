import type { Prelude } from './types'

/**
 * Erciyes teleferiği: kabinler (dikey platform) oyuncuyu istasyondan istasyona çıkarır. Önce güvenli yerde
 * yerden ilk istasyona bin; ikinci kabine aşağıdayken bin, tepede in. Son durakta iki kabin ters yönde gider:
 * inen kabinden çıkan kabine geç, onunla karşı istasyona var (altları dikenli kar, bayrak hemen gerisinde).
 * Nazar boncuğu ikinci kabinin tepesinde, istasyonun ters yanındaki, geriye bakan küçük kaya çıkıntısında.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: [
    'Erciyes teleferiği. Kabine bin, seni ilk istasyona çıkarsın; tepeye varınca sağa atla.',
    'İkinci kabin aşağıdayken bin. Tepede durduğunda karşı istasyona atla.',
    'Son hat: iki kabin ters yönde gider. İnen kabinden çıkan kabine geç, onunla karşı istasyona var.',
  ],
  hintsEn: [
    'The Erciyes cable car. Hop in and it lifts you to the first station; at the top, jump to the right.',
    'Board the second car while it is down. When it stops at the top, jump to the far station.',
    'The last line: the two cars run in opposite directions. Step from the one going down to the one going up and ride it across.',
  ],
  npcs: [{ name: 'Teleferikçi Oğuz', look: 'coban', text: 'Erciyes’in karı yazın bile eksik olmaz, kabinlerim kışın da yazın da çalışır. Acele etme, kabin geri gelir. İkinci kabin tepeye varınca herkes ileri bakar; ben geriye bakarım, dağ orada bir göz saklar.' }],
  npcsEn: [{ name: 'Oğuz the Cable Car Man', text: 'Snow never leaves Erciyes, not even in summer, and my cars run winter and summer alike. No rush, the car always comes back. When the second car reaches the top, everyone looks ahead; I look back, the mountain keeps an eye hidden there.' }],
  chunks: [
    [
      '                                                                        ',
      '                                                                        ',
      '                    !                                                   ',
      '                   ###  :      F ?        :    :       l                ',
      '                             ############ NNN       #######             ',
      '                             ############           #######             ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '        :      ?    l   NNN                                             ',
      '             ########## :                                               ',
      '             ##########                        NNN                      ',
      '                                          :    :                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      ' ?  n t NNN                              ^^^^^^^^^^^            t   l   ',
      '########################################################################',
      '########################################################################',
      '########################################################################',
      '########################################################################',
    ],
  ],
}
