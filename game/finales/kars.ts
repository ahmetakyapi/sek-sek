import type { Prelude } from './types'

/**
 * Ani surları: kemerin altından sarkan dört halat dikenli hendeğin üstünde, ötede sur yolu. İki plaka bütün taşları
 * çevirir (turuncu açılır, mavi kapanır; bir daha basınca geri döner). Önce öğretir sonra sınar:
 *  1. Kapının önündeki plaka turuncu kapıyı açar: halatlara giden yol budur. Aynı basış hendeğin ortasındaki turuncu
 *     perdeyi de açık tutar, sur yolundaki mavi kapıyı kapatır.
 *  2. Halattan halata sur yoluna çıkan mavi kapıyı kapalı bulur. Öbür plaka hendeğin dibinde, son halatın altında:
 *     in, bas (mavi kapı açılır, turuncu perde ve kapı arkandan kapanır), halata tutun, yeniden çık.
 * Kilitlenme yok: hendeğin iki yanından da halata ulaşılır, plakaya istendiği kadar basılır; bayrak salonda (açık
 * durumda alınır). Nazar boncuğu son halatın yanında, sur omzuna oyulmuş cepte, mavi taşın ardında: ikinci plakadan
 * sonra açılır; halata tırmanırken sağa bakan görür.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Ani surları. Plakaya bas: turuncu taşlar açılır, mavi taşlar kapanır. Bir daha basarsan geri döner.',
    'Halattan halata sur yoluna çık. Mavi kapı kapalıysa öbür plaka hendeğin dibinde; basınca turuncu perde arkandan kapanır.',
  ],
  hintsEn: [
    'The walls of Ani. Step on a plate: the orange stones open and the blue stones close. Step again and they swap back.',
    'Rope to rope up to the wall walk. If the blue gate is shut, the other plate is at the bottom of the moat; press it and the orange curtain closes behind you.',
  ],
  npcs: [{ name: 'Surcu Vahit Dayı', look: 'amca', text: 'Ani’nin surlarını bin yıl önce ören ustalar taşa aslan oymuş evlat; kapıyı kim açarsa aslan ona bakar. Halata asılınca aşağı bakmayı unutma: hendeğin dibinde de bir taş var. Mavi taşlar kalkınca son halatın yanındaki oyuk parlar.' }],
  npcsEn: [{ name: 'Uncle Vahit the Wall Mason', text: 'The masons who built the walls of Ani a thousand years ago carved a lion into the stone, my child; it watches whoever opens the gate. When you hang on the rope, do not forget to look down: there is a stone at the bottom of the moat too. When the blue stones lift, the hollow beside the last rope shines.' }],
  chunks: [
    [
      '            ###############################                   ',
      '            ###############################                   ',
      '            ###############################                   ',
      '            ###############################                   ',
      '            ###############################                   ',
      '            ###############################                   ',
      '            ##       L  L  L [ L         ]]                   ',
      '            ##       L  L  L [ L         ]]                   ',
      '            ##       L  L  L [ L         ]]                   ',
      '            ##       L  L  L [ L    ###########               ',
      '            ##       L  L  L [ L    ###########               ',
      '            ##       L  L  L [ L  #############               ',
      '            ##       L  L  L [ L  #############               ',
      '            ##       L  L  L [ L  #############               ',
      '            ##       L  L  L [ L  ] ###########               ',
      '            ##       L  L  L [ L  ]!###########               ',
      '            [[       L  L  L [ L  #############               ',
      '            [[       L  L  L [ L  #############               ',
      '            [[       L       [    #############               ',
      '  ?  n  _   [[ ? F  ^^^^^^^^^[   _#############               ',
      '##############################################################',
      '##############################################################',
      '##############################################################',
      '##############################################################',
    ],
  ],
}
