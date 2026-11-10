import type { CityRoad } from './types'

/**
 * Bursa ana yolu, dört durak (Kolay: yürü + zıpla):
 *  1. Cumalıkızık sokağı: cumbalar tek yönlü platform; önce düz sokağın, sonra kertenkelenin, en sonda derenin üstünde.
 *  2. Koza Han: ipek balyaları basamak, yay balya revaka fırlatır; avlunun ortasındaki mescidin damından karşı revaka,
 *     sonra iki havuz.
 *  3. Uludağ teleferiği: ilk kabin sığ ve güvenli bir hendeğin, ikincisi boş vadinin üstünde; hatıra yolun ortasında.
 *  4. Ulu Cami önü: iki babanın arasında tek kertenkele, şadırvanın kenarından kenarına bir adım, meydan kapısı.
 *     Gizli pul şadırvanın kaidesinde: kenara zıplamayıp yerden yürü, taşın yüzü sahte.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                          C                               ',
      '                         ===                              ',
      '                                                          ',
      '              ====   ====        ====  ===  ====          ',
      ' P  ?  n  l       k         t  #  e   #                l  ',
      '#########################################~~~~~~~~~########',
      '#########################################~~~~~~~~~########',
      '#########################################~~~~~~~~~########',
      '#########################################~~~~~~~~~########',
    ],
    [
      '                     C                                    ',
      '                                                          ',
      '                                                 f        ',
      '             ============  #######  ======                ',
      '                           #######                        ',
      '          ##               #######                        ',
      ' F ?  n  ###    k    S     #######    l                l  ',
      '#############################################~~###~~~#####',
      '#############################################~~###~~~#####',
      '#############################################~~###~~~#####',
      '#############################################~~###~~~#####',
    ],
    [
      '                                                      ',
      '                                              f       ',
      '                                                      ',
      '                                  C                   ',
      '                                                      ',
      ' F ?  n  l            t                         t  l  ',
      '############MMM   |########MMM           |############',
      '############       ########               ############',
      '###########################               ############',
      '###########################               ############',
    ],
    [
      '                                              ',
      '                         ###~~#               ',
      ' F ?  l    #  e   #   t  %$####   k   l   E   ',
      '##############################################',
      '##############################################',
      '##############################################',
      '##############################################',
    ],
  ],
}
