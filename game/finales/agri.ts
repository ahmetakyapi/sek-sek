import type { Prelude } from './types'

/**
 * İshak Paşa Sarayı (TASLAK): zemin katta selamlık koridoru, üstte harem galerileri; katlar arası halatla çıkılır.
 * Bir plaka bütün kapıları çevirir: turuncu (selamlık) açılır, mavi (harem) kapanır ya da tersi. İki kilit:
 *  1. Plaka turuncu kapıyı açar ama öndeki mavi kapıyı kapatır; geri çevirecek plaka yukarıda, harem galerisinde.
 *     Halattan çık, bas, yanındaki açık ağızdan aşağı düş, geç (halattan aşağı inilebilir ama şart değil).
 *  2. Turuncu kapının plakası üst galeride, mavi perdenin ardında. Basınca perde arkandan kapanır: halata dönülmez,
 *     iniş çatlak döşemeden. Aşağıda kapı açıktır; son odadaki plaka mavi çıkışı açar.
 * Kilitlenme yok: her odada ya bir plaka ya da geri dönüş var. Nazar boncuğu birinci galerinin sol ucunda, turuncu
 * perdenin ardında: perde yalnız selamlık kapısı açıkken aralanır. Yukarı çıkınca sağdaki plakaya basmadan önce sola
 * atla; basıldıysa plakaya bir daha basmak perdeyi yine açar (nazar kaçmaz, yalnız dikkat ister).
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'İshak Paşa Sarayı: turuncu kapılar selamlığın, mavi kapılar haremin. Plakaya bas: biri açılır, öbürü kapanır. Üst kata halattan çık.',
    'Bu turuncu kapının plakası yukarıda, mavi perdenin ardında. Basınca perde arkandan kapanır: aşağı inmenin yolu çatlak döşeme.',
  ],
  hintsEn: [
    'İshak Paşa Palace: the orange doors belong to the selamlık, the blue ones to the harem. Step on a plate: one opens, the other shuts. Climb the rope to the upper floor.',
    'This orange door’s plate is upstairs, past the blue curtain. Once you press it, the curtain shuts behind you: the way down is the cracked floor.',
  ],
  npcs: [{ name: 'Saray Kâhyası Ferzende', look: 'amca', text: 'Sarayın selamlığına konuk girer, haremine aile; iki kanadın kapısı bir arada açılmaz. Yukarıdaki galeriye çıkınca hemen plakaya koşma: sol uçta, turuncu perdenin ardında bir nazar boncuğu asılıdır.' }],
  npcsEn: [{ name: 'Ferzende the Palace Steward', text: 'Guests enter the selamlık, the family the harem; the doors of the two wings never stand open together. When you climb to the gallery, don’t rush to the plate: at its left end, behind the orange curtain, hangs an evil eye bead.' }],
  chunks: [
    [
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #################################################          ',
      '       #   [            #####    ]        ##############          ',
      '       #   [     L      ##### L  ]        ##############          ',
      '       #   [     L      ##### L  ]        ##############          ',
      '       #   [     L      ##### L  ]        ##############          ',
      '       # ! [     L _    ##### L  ]  _     ##############          ',
      '       ######### L###  #######L #######XX###############          ',
      '       ######### L###  #######L #######XX###############          ',
      '            [    L     ]      L           [            ]          ',
      '            [    L     ]      L           [            ]          ',
      '            [    L     ]      L           [            ]          ',
      '            [    L     ]      L           [            ]          ',
      '  ?  n   _  [          ] F ?              [       _    ]    l     ',
      '##################################################################',
      '##################################################################',
      '##################################################################',
      '##################################################################',
    ],
  ],
}
