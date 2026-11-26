import type { Prelude } from './types'

/**
 * Arsameia: Herakles ile kralın tokalaştığı kabartmanın kayası göğe dek yükselir, yol altındaki tünelden geçer.
 * Plakalar iki renk taşı yer değiştirir. Tepedeki plaka tünelin kapağını açar (kapağın üstünden geçip plakaya basılır,
 * geri dönüp inilir); üst tünelde basılan plaka kapıyı açar, ikinci plakanın üstünden atlanır (kapı zaten açık), üçüncü
 * plaka zemindeki taşları çekip alt tünele indirir. Nazar boncuğu tünelin dibinde, inilen yerin gerisinde (solda):
 * oradaki plakaya basınca cebin kapısı açılır, ileri kapı kapanır; dönüşte aynı plakaya basılınca yol yine açılır.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: ['Arsameia’nın tüneli: her plaka iki renk taşı yer değiştirir. Önce ilerideki kapıya bak; açıksa plakanın üstünden atla.'],
  hintsEn: ['The tunnel of Arsameia: every plate swaps the two colours of stone. Look at the door ahead first; if it is open, hop over the plate.'],
  npcs: [{ name: 'Çoban Yasin', look: 'coban', text: 'Arsameia’da Herakles kralla tokalaşır, taşa öyle kazınmış! Kabartmanın altından tünel iner. Dibine inince hemen koşma, arkana dön: karanlıkta bir göz parlıyor.' }],
  npcsEn: [{ name: 'Yasin the Shepherd', text: 'At Arsameia Heracles shakes hands with the king, carved that way in the stone! A tunnel runs down beneath the relief. When you reach the bottom, don’t rush off; turn around: an eye glints in the dark.' }],
  chunks: [
    [
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                     ##                               ',
      '                   _ ##                               ',
      '           ####[[#######################              ',
      '           ##       ]      ]      ######              ',
      '         ####     _ ]   _  ]  _   ######              ',
      ' ?  n    ######################[[#######              ',
      '########################    ]       [     ############',
      '######################## !  ] _     [     ############',
      '######################################################',
      '######################################################',
    ],
  ],
}
