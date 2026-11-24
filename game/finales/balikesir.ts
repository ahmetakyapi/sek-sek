import type { Prelude } from './types'

/**
 * Sarıkız Tepesi (Kaz Dağları zirvesi): iki termal, bir plaka takımı. Soldaki termalin ortasını kırmızı taş ([) keser:
 * içine giren yalnız taşın altına dek çıkar, yandaki sahanlığa konar. Sahanlıktaki plaka taşı kaldırır (] taşları belirir),
 * termal artık zirve kayasına taşır. Sağdaki yüksek termalin tepesini mavi taş (]) kapatıyor: kayadaki ikinci plaka
 * takımı geri çevirir, yol açılır (soldaki termal ardından yeniden kapanır). Düğme bayrakla saklanır; her durumda
 * aşağıdan yeniden başlanabilir. Nazar boncuğu yüksek termalin tepesinin hemen solunda, kayanın oyuğunda.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: ['Sarıkız Tepesi: renkli taş termalin yolunu kesiyor. Sahanlıktaki plakaya bas, taş kalkar; yukarıdaki plaka öbür termali açar.'],
  hintsEn: ['Sarıkız Hill: a coloured stone blocks the thermal. Step on the plate on the ledge and the stone lifts; the plate up top opens the other thermal.'],
  npcs: [{ name: 'Kekikçi Mahmure', look: 'teyze', text: 'Sarıkız’ın tepesinde kekik toplarım, rüzgârı da tanırım. Termaller taşların arasından yükselir; plakaya basınca yol değişir. En yüksek termalin tepesinden geriye bak: kayanın oyuğunda bir göz parlar.' }],
  npcsEn: [{ name: 'Mahmure the Thyme Picker', text: 'I pick thyme on Sarıkız’s summit and I know the wind. The thermals rise between the stones; step on the plate and the way changes. From the top of the highest thermal look back: an eye glints in the hollow of the rock.' }],
  chunks: [
    [
      '                   ###                            ',
      '                   #                              ',
      '                   #   VVV                        ',
      '                   #!  VVV                        ',
      '                   ### ]]] #####                  ',
      '          VVV          VVV #####                  ',
      '          VVV   _      VVV #####                  ',
      '          VVV ######## VVV #####                  ',
      '          VVV ######## VVV #####                  ',
      '          VVV    #     VVV #####                  ',
      '          VVV    #     VVV #####                  ',
      '          [[[    #     VVV #####                  ',
      '          VVV    #     VVV #####                  ',
      '          VVV  _ #     VVV #####                  ',
      '          VVV ####     VVV #####                  ',
      '          VVV ####     VVV #####                  ',
      '          VVV ####     VVV #####                  ',
      '          VVV ####     VVV #####                  ',
      '          VVV ####     VVV #####                  ',
      '  ?  n    VVV ####     VVV #####                  ',
      '##################^^^^^^^^^#######################',
      '##################################################',
      '##################################################',
      '##################################################',
    ],
  ],
}
