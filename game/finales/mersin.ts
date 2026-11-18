import type { Prelude } from './types'

/**
 * Mamure (Anamur) Kalesi'nin hendeği: deniz gelgitle dolar ve boşalır. Hendeği göğe dek yükselen sur böler; altındaki
 * su kapısı ([) kapalıdır. Kapıyı açan plaka hendeğin ortasında yüksek bir taşın üstünde: yalnız yüksek suda yüzerek
 * çıkılır (alçak suda dipten erişilmez, yanında tırmanılacak duvar yok). Plakaya bas, sonra su çekilince kapıdan yürü
 * (ya da yüksek suda dal). Düğme bayrakla saklanır: düşen, plakayı yeniden açar.
 * Nazar boncuğu surun doğu yüzünde, kapının hemen üstündeki su altı oyuğunda: yüksek suda yüzerek girilir.
 */
export const prelude: Prelude = {
  medal: 45,
  hints: ['Mamure Kalesi’nin hendeğine deniz dolar. Su kapısını açan plaka ortadaki yüksek taşta: su yükselince yüz, sıçra, bas. Su çekilince kapıdan yürü.'],
  hintsEn: ['The sea fills the moat of Mamure Castle. The plate that opens the water gate sits on the tall stone in the middle: when the water rises, swim, leap and press it. When the water ebbs, walk through the gate.'],
  npcs: [{ name: 'Kayıkçı Sevgül', look: 'teyze', text: 'Kırk yıl bu hendekte kürek çektim. Su kapısı yalnız suyla yükselene açılır. Kapıdan geçince arkana dön: surun dibinde, suyun altında bir göz parlar.' }],
  npcsEn: [{ name: 'Sevgül the Boatwoman', text: 'I rowed this moat for forty years. The water gate opens only for those who rise with the water. Once through the gate, look back: at the foot of the wall, under the water, an eye glints.' }],
  chunks: [
    [
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                              ##                            ',
      '                     _        ##                            ',
      '                    ###       ##                            ',
      '                              ##                            ',
      '          ##AAAAAAAAAAAAAAAAAA##AAAAAAAAAAAAAAAA####        ',
      '          ##AAAAAAAAAAAAAAAAAA##AAAAAAAAAAAAAA######        ',
      '        ####AAAAAAAAAAAAAAAAAA#AAAAAAAAAAAAAAA########      ',
      '        ####AAAAAAAAAAAAAAAAAA#!AAAAAAAAAAAA##########      ',
      '      ######AAAAAAAAAAAAAAAAAA##AAAAAAAAAAAA############    ',
      ' ?  n ######AAAAAAAAAAAAAAAAAA[[AAAAAAAAAA##############    ',
      '############AAAAAAAAAAAAAAAAAA[[AAAAAAAAAA##################',
      '############################################################',
      '############################################################',
      '############################################################',
    ],
  ],
}
