import type { Prelude } from './types'

/**
 * Valla Kanyonu: kanyonun dibi boşluk, yol kayadan kayaya. Önce iki karoluk şelale koşarak atlanır, sonra boşluğun
 * ortasında sarkan halata tutunup karşı kayaya geçilir; ardından şelale + halat + şelale: şelaleyi aşıp halata
 * tutun, tırman, öbür şelalenin üstünden atla. Son şelale bir havuza dökülür (düşen yüzer, kıyıya çıkar).
 * Nazar boncuğu son şelalenin ardındaki ıslak kayanın dibinde, kayanın altındaki oyukta: oyuğun ağzı doğuya bakar,
 * kayanın üstünden geçip öbür yandan geri dolaşan alır.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: ['Valla Kanyonu: şelalenin içinde su seni aşağı çeker. Üstünden atla, halata tutunup tırman, sonra karşıya atla.'],
  hintsEn: ['Valla Canyon: inside the waterfall the water drags you down. Jump over it, grab the rope and climb, then leap across.'],
  npcs: [{ name: 'Kanyoncu Saffet', look: 'amca', text: 'Valla’nın duvarları gökyüzüne değer, şelaleler aralarından dökülür. Son şelalenin ardında, ıslak kayanın dibinde bir göz parlıyor: şelaleye girme, kayanın üstünden geç, öbür yandan dolaş.' }],
  npcsEn: [{ name: 'Saffet the Canyoneer', text: 'Valla’s walls touch the sky, waterfalls pour between them. Behind the last waterfall, at the foot of the wet rock, an eye glints: do not step into the falls, cross over the rock and come around from the other side.' }],
  chunks: [
    [
      '                                                            ',
      '                                                            ',
      '       ####                  ####                           ',
      '       ####                  ####                           ',
      '        ;;                    ;;                            ',
      '        ;;                    ;;                            ',
      '        ;;           #####    ;;                            ',
      '        ;;           #####    ;;                            ',
      '        ;;    ###    ;;L;;    ;;                            ',
      '        ;;    ###    ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;                            ',
      '        ;;     L     ;;L;;    ;;     iiiiiiiii              ',
      '        ;;     L     ;;L;;    ;;     #########              ',
      '        ;;     L     ;;L;;    ;;   #######                  ',
      ' ?  n   ;;     L     ;;L;;    ;;   #######!                 ',
      '########;;###  L  ###;;L;;####WWWW##########################',
      '########;;###  L  ###;;L;;####WWWW##########################',
      '########;;###  L  ###;;L;;##################################',
      '########;;###     ###;; ;;##################################',
    ],
  ],
}
