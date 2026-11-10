import type { Prelude } from './types'

/**
 * Galata Köprüsü: açılır kapanır köprü. Plaka köprüyü (kırmızı) getirir ama aynı renk ilerideki
 * kepengi de kapatır; kepengi açmak için öbür plakaya basıp köprüyü geri göndermek gerekir.
 * Nazar boncuğu yalnız kırmızı bloklar varken çıkılan fener sahanlığında: plakaya bir kez daha bas.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: [
    'Galata Köprüsü açılır kapanır: plakaya bas, kırmızı köprü gelsin.',
    'Kırmızı kepenk yolu kapattı. Köprüyü getiren renk kepengi de indirir: plakaya bir daha bas!',
  ],
  hintsEn: [
    'Galata Bridge opens and closes: step on the plate to bring the red bridge.',
    'The red shutter blocks the way. The colour that brings the bridge also lowers the shutter: step on the plate again!',
  ],
  npcs: [{ name: 'Köprü Balıkçısı Rıza', look: 'amca', text: 'Kırk yıldır bu köprüden olta sallarım. Köprü kalkınca vapur geçer, inince tramvay. Her şeyin bir sırası var evladım; acele eden istavriti kaçırır.' }],
  npcsEn: [{ name: 'Rıza the Bridge Angler', text: 'I have cast my line from this bridge for forty years. When it lifts, the ferry passes; when it lowers, the tram does. Everything has its turn, my child; rush and the mackerel gets away.' }],
  chunks: [
    [
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                                    #   ',
      '                                          !         #   ',
      '                                        ]]]]        #   ',
      '                 f                                  #   ',
      '                                   ]]]              #   ',
      '                                                    ]   ',
      '                              ]]]                   ]   ',
      ' ?  _             n  l    _ ?                  l    ]   ',
      '########]]]]]]]]############################################',
      '########~~~~~~~~############################################',
      '########~~~~~~~~############################################',
      '########~~~~~~~~############################################',
    ],
  ],
}
