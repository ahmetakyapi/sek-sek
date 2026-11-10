import type { Prelude } from './types'

/**
 * Düden Şelalesi: ıslak taşta hız yönetimi. Önce düz ıslak taş ve ucunda zararsız, kuru bir oyuk (erken dur), sonra
 * ıslak basamaklar, sudaki kısa ıslak taşlar ve şelalenin ardındaki alçak tavanlı mağara (iki dar su çukuru).
 * Nazar boncuğu mağarada, ortadaki taşın üstündeki tavan oyuğunda: dash atarak geçen görmez, taşta durup zıplayan alır.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: [
    'Düden Şelalesi: parlayan taş kaydırır. Tuşu erken bırak, oyuğun önünde dur.',
    'Islak basamaklar: her basamakta önce dur, sonra zıpla.',
    'Sudaki taşlar kısa: kenara varmadan zıpla, inince tuşu bırak. Ardı mağara, tavanı alçak.',
  ],
  hintsEn: [
    'Düden Waterfall: shining stone is slippery. Let go early and stop before the hollow.',
    'Wet steps: stop on each step first, then jump.',
    'The stones in the water are short: jump before the edge, let go when you land. The cave beyond has a low roof.',
  ],
  npcs: [{ name: 'Şelale Bekçisi Tahir', look: 'amca', text: 'Düden kırk metreden denize dökülür, sesi uzaktan duyulur. Suyun ardı mağaradır; oradan koşarak geçen yalnız ayağına bakar. Ortadaki taşta bir dur, başını kaldır evlat.' }],
  npcsEn: [{ name: 'Tahir the Waterfall Keeper', text: 'The Düden drops forty metres into the sea; you hear it long before you see it. Behind the water is a cave, and whoever runs through looks only at their feet. Stop on the middle stone and lift your head, my child.' }],
  chunks: [
    [
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    ##                  ',
      '                                                    #############       ',
      '                                                    ######  #####       ',
      '                                  F ?               ###### !#####       ',
      '                              iii####                                   ',
      '                           iii#######  iii                              ',
      ' ?  n                ?  iii##########  ###  iii                      l  ',
      '#########iiiiiiii   #################~~###~~###~~iiiiii~~iii~~iii#######',
      '#################   #################~~###~~###~~######~~###~~##########',
      '#####################################~~###~~###~~######~~###~~##########',
      '#####################################~~###~~###~~######~~###~~##########',
    ],
  ],
}
