import type { Prelude } from './types'

/** Kütahya meydan yolu: TASLAK (level-designer dolduracak: şehre özgü tek bulmaca + saklı nazar boncuğu !). */
export const prelude: Prelude = {
  medal: 50,
  hints: ['TASLAK: meydan yolunun tabelası (Kütahya): bulmacanın kuralını tek cümlede söyle.'],
  hintsEn: ['TASLAK: the square road sign (Kütahya): state the puzzle\'s rule in one sentence.'],
  npcs: [{ name: 'Kütahya Meydancısı (TASLAK)', look: 'amca', text: 'TASLAK: Kütahya meydanını anlatır, nazar boncuğunun yerini üstü kapalı söyler.' }],
  npcsEn: [{ name: 'The Square Keeper of Kütahya (TASLAK)', text: 'TASLAK: describes the square of Kütahya and hints where the evil eye bead hides.' }],
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
