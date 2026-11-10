import type { Prelude } from './types'

/**
 * Gece ile gündüz taşları: Tuşpa kayalığının içindeki baca. Bacayı önce gündüz taşı, yukarıda gece taşı keser;
 * plakalar yolun üstünde değil (girişteki rafta, bacanın yan kovuğunda, tepedeki rafta): hangi taş kalksın diye
 * karar verip plakaya dönülür. Tepede gündüz köprüsü çıkışa götürür.
 * Nazar boncuğu tepede, yalnız gece beliren dört basamağın en üstünde.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Tuşpa kayalığı. Bacayı gündüz taşı kapatıyor: raftaki plakaya bas, gece olsun. Yukarıda gece taşı çıkarsa yandaki kovuğa bak.',
    'Kalenin tepesi. Köprü gündüz taşıdır: gündüzken geç. Raftaki plaka geceyi getirir; o zaman köprü gider, başka taşlar belirir.',
  ],
  hintsEn: [
    'The rock of Tushpa. A day stone blocks the chimney: step on the plate on the shelf to bring the night. If a night stone stops you higher up, look in the hollow to the side.',
    'The top of the castle. The bridge is a day stone: cross it by day. The plate on the shelf brings the night; then the bridge goes and other stones appear.',
  ],
  npcs: [{ name: 'Balıkçı Berfin', look: 'genc', text: 'İnci kefali akıntıya karşı sıçrar, sen de kayalığa karşı sıçra. Urartular bu kayaya Tuşpa demiş. Tepeye varınca hemen köprüye koşma: gece olunca göğe doğru dört basamak belirir, yıldıza en yakın olana çık.' }],
  npcsEn: [{ name: 'Berfin the Fisher', text: 'The pearl mullet leaps against the current, so you leap against the rock. The Urartians called this rock Tushpa. When you reach the top, don’t run straight for the bridge: at night four steps appear leading to the sky. Climb the one nearest the stars.' }],
  chunks: [
    [
      '            ##                                                    ',
      '            ##                                                    ',
      '            ##                            !                       ',
      '            ##                           ]]                       ',
      '            ##                                                    ',
      '            ##                       ]]                           ',
      '            ##                                                    ',
      '            ##                   ]]                               ',
      '            ##           _                                        ',
      '            ##          ===  ]]                                   ',
      '            ##      F ?                                l          ',
      '            ##]]]]############################[[[[[[[[####        ',
      '            ##    ############################        ####        ',
      '            ##       #########################        ####        ',
      '            ##      _#########################^^^^^^^^######      ',
      '            ##    ##########################################      ',
      '            ##[[[[##########################################      ',
      '       _          ############################################    ',
      '      ===         ############################################    ',
      ' ?  n             ############################################  l ',
      '##################################################################',
      '##################################################################',
      '##################################################################',
      '##################################################################',
    ],
  ],
}
