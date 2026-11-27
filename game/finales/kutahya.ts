import type { Prelude } from './types'

/**
 * Desen Atölyesi: çini fırınının damlı koridoru. Her plaka iki renk sırlı taşı yer değiştirir (`[` kobalt baştan katı,
 * `]` turkuaz baştan boş). İlk plaka kobalt kapıyı açar ve turkuaz köprüyü kurar; köprünün önündeki plakanın üstünden
 * atlanır (basan köprüyü söker). Fırının sıcak havası galeriye taşır; galerideki plaka turkuaz kapıyı açar.
 * Nazar boncuğu galerinin altında, turkuaz kapaklı nişte: alttaki plakaya basan nişi açar ama galerideki kapı da
 * açılmış olur; o zaman galeri plakasının üstünden atlamak gerekir (basan yine kapatır, ikinci basış yine açar).
 */
export const prelude: Prelude = {
  medal: 50,
  hints: ['Desen Atölyesi: her plaka iki renk sırlı taşı yer değiştirir. Önce ilerideki kapıya ya da köprüye bak; açıksa plakanın üstünden atla.'],
  hintsEn: ['The Pattern Workshop: every plate swaps the two colours of glazed tile. Look at the door or bridge ahead first; if it is open, hop over the plate.'],
  npcs: [{ name: 'Nakkaş Şükran', look: 'genc', text: 'Desen önce kâğıda çizilir, iğneyle delinir, kömür tozuyla çiniye geçer; sonra fırına! Fırının sıcağı seni galeriye çıkarır. Çıkmadan altına bak: turkuaz kapağın ardında bir göz parlıyor.' }],
  npcsEn: [{ name: 'Şükran the Pattern Painter', text: 'A pattern is drawn on paper first, pricked with a needle and dusted onto the tile with charcoal; then into the kiln! The kiln’s heat lifts you up to the gallery. Before you rise, look below: an eye glints behind the turquoise lid.' }],
  chunks: [
    [
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################     ################         ',
      '      ############################                ]             ',
      '      ############################ VVV            ]             ',
      '      ############################ VVV      _     ]             ',
      '      ############################ VVV ################         ',
      '      ############################ VVV ################         ',
      '      ############################ VVV       ]   ######         ',
      '      ############################ VVV       ]   ######         ',
      '            [                      VVV       ]   ######         ',
      '            [                      VVV       ]   ######         ',
      '            [                      VVV       ]   ######         ',
      '            [                      VVV       ]   ######         ',
      ' ?  n    _  [   _                  VVV    _  ] ! ######         ',
      '###################]]]]]]]######################################',
      '###################^^^^^^^######################################',
      '################################################################',
      '################################################################',
    ],
  ],
}
