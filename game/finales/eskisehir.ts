import type { Prelude } from './types'

/**
 * Palandöken kayak pisti: yaylar teleskinin yerine pistin başına çıkarır, sonra iniş yönünde rampalar.
 * Rampa, basamağın bir karo altındaki yaydır: buzda kayarak gelen kendiliğinden uçar. Karar her rampada "nasıl
 * uçacağım": 1) sağa basılı tut, karşıya kon (bırakan vadiye iner, kar basamağından çıkar) · 2) kar seti yüksek:
 * zıplamayı basılı tut (kaçıran çukura düşer, geri çıkar) · 3) saçakta sarkıt var: zıplamaya basma, alçak uç ·
 * 4) son rampa: ikisini de basılı tut, kayalığı aş. Nazar boncuğu ilk rampanın dibindeki kar oyuğunda.
 */
export const prelude: Prelude = {
  medal: 45,
  hints: [
    'Palandöken kayak pisti. Teleski kapalı: yayın üstüne zıpla, seni pistin başına fırlatır.',
    'Buzda kendiliğinden kayarsın, uçtaki rampa seni uçurur. Sağa basılı tut, karşı düzlüğe kon. Vadiye düşersen kar basamağından çık.',
    'Kar seti yüksek. Rampaya girerken zıplamayı basılı tut: yüksek uçarsın. Kaçırırsan geri çık, bir daha dene.',
    'Saçakta buz sarkıtları var. Bu rampada zıplamaya basma: alçak uç, altından geç.',
    'Son rampa: zıplamayı da sağı da basılı tut. En uzun uçuş kayalığı aşar.',
  ],
  hintsEn: [
    'The Palandöken ski run. The lift is closed: jump onto the spring and it will fling you to the top of the run.',
    'On ice you slide by yourself, and the ramp at the end sends you flying. Hold right and land on the far ledge. If you drop into the gully, climb out by the snow step.',
    'The snow bank is high. Hold jump as you hit the ramp and you fly high. If you miss, climb back and try again.',
    'Icicles hang from the overhang. Keep off the jump button on this ramp: fly low and pass beneath.',
    'The last ramp: hold both jump and right. The longest flight clears the rocks.',
  ],
  npcs: [{ name: 'Kayak Hocası Kâzım', look: 'usta', text: 'Palandöken’in karı un gibidir, pisti uzundur. Rampaya nasıl girersen öyle uçarsın evlat: yükseğe mi, alçağa mı, yukarıda karar ver; havada geç kalırsın. İlk rampadan uçmayıp vadiye inen, rampanın dibindeki kar oyuğunu görür.' }],
  npcsEn: [{ name: 'Kâzım the Ski Instructor', text: 'Palandöken snow is fine as flour and the run is long. You fly the way you hit the ramp, my child: high or low, decide up top; in the air it is too late. Whoever skips the first ramp and drops into the gully will spot the snow hollow at its foot.' }],
  chunks: [
    [
      '                                                                        ',
      '                                                ######                  ',
      '                                                ######                  ',
      '                                                vvvvvv                  ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                       F ?                              ',
      '             ? l                      ######IIIS                        ',
      '            #####IIIIIIS              ##########                        ',
      '            ############              ##########       ?                ',
      '            ############    ?         ##########IIIIIIIIIS              ',
      '          S ############   ###IIIIIS  ####################              ',
      '        ###########       ################################              ',
      '        ###########!      ################################              ',
      '        ##################################################              ',
      '        ##################################################              ',
      '        ##################################################              ',
      ' ? n  S ##################################################^^^^^^   l k  ',
      '########################################################################',
      '########################################################################',
      '########################################################################',
      '########################################################################',
    ],
  ],
}
