import type { Prelude } from './types'

/** Samsun meydan yolu: TASLAK (level-designer dolduracak: şehre özgü tek bulmaca + saklı nazar boncuğu !). */
export const prelude: Prelude = {
  medal: 50,
  hints: ['TASLAK: meydan yolunun tabelası (Samsun): bulmacanın kuralını tek cümlede söyle.'],
  hintsEn: ['TASLAK: the square road sign (Samsun): state the puzzle\'s rule in one sentence.'],
  npcs: [{ name: 'Samsun Meydancısı (TASLAK)', look: 'amca', text: 'TASLAK: Samsun meydanını anlatır, nazar boncuğunun yerini üstü kapalı söyler.' }],
  npcsEn: [{ name: 'The Square Keeper of Samsun (TASLAK)', text: 'TASLAK: describes the square of Samsun and hints where the evil eye bead hides.' }],
  chunks: [
    [
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      ' ?  n                         !                             ',
      '############################################################',
      '############################################################',
      '############################################################',
      '############################################################',
    ],
  ],
}
