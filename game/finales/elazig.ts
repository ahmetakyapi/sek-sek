import type { Prelude } from './types'

/**
 * Hazar'ın batık şehri: göl donar ve erir (Z). Suyun altında eski şehrin suru göğe dek çıkar; altındaki batık kapı ([)
 * kapalıdır. Kapıyı açan plaka (_) gölün ortasındaki batık kulenin tepesinde: su donunca buzdan yürüyerek, eriyince
 * yüzüp sıçrayarak çıkılır. Plakaya bas, su eriyince surun altından dal, donmuşsa öbür yanda erimesini bekle.
 * Düğme bayrakla saklanır: düşen, plakayı yeniden açar.
 * Nazar boncuğu batık kulenin dibinde, buz tavanının altında: su eriyince dalınır.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: ['Hazar’ın batık şehri: su donunca üstünden yürü, erirken dal. Batık kulenin tepesindeki plaka surun altındaki kapıyı açar; buz tutmadan yüzeye çık.'],
  hintsEn: ['The sunken city of Hazar: walk over the water when it freezes, dive when it thaws. The plate on top of the sunken tower opens the gate under the wall; surface before the ice closes.'],
  npcs: [{ name: 'Dalgıç Simge', look: 'genc', text: 'Hazar’ın dibinde surlar, sokaklar, kapılar var; ben gördüm! Su donunca yukarıdan yürü, erirken in. Batık kulenin dibinde, buzun altında bir göz parlar: nefesin yeter, yeter ki saati kolla.' }],
  npcsEn: [{ name: 'Simge the Diver', text: 'At the bottom of Hazar there are walls, streets and gates; I have seen them! When the water freezes walk across the top, when it thaws go down. At the foot of the sunken tower, under the ice, an eye glints: your breath will last, as long as you watch the clock.' }],
  chunks: [
    [
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                          ##                      ',
      '                   _      ##                      ',
      '                  ###     ##                      ',
      '        ####ZZZZZZ###ZZZZZ##ZZZZZ#####            ',
      '        ####WWWWWW###WWWWW[[WWWWW#####            ',
      '      ###############WWWWW[[WWWWW#######          ',
      ' ? n  ###############!WWWW[[WWWWW#######          ',
      '##################################################',
      '##################################################',
      '##################################################',
      '##################################################',
    ],
  ],
}
