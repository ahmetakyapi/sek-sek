import type { CityRoad } from './types'

/**
 * Muğla ana yolu, dört durak. Meltem arkadan eser ama oyuncuyu taşımaz (atlayışı en çok bir parmak uzatır):
 * zorluk dar inişten, zamanlamadan ve dikenin, suyun üstündeki duvar sekmesinden gelir.
 *  1. Bodrum Kalesi: basamaktan birinci burca çık. Karşı burcun mazgalından ok gelir: mazgal dişlerinin arasında
 *     yürüyen siperdedir, dişe çıkan ve tahtaya atlayan okun hizasındadır (altı avlu, düşen ölmez). Sonra iç kalenin
 *     duvarına sekerek tırman (ilk sünger tepesinde), hendeğin üstünden alçak sura in (bayrak) ve aynı sekmeyi bu kez
 *     dikenli hendeğin üstünde kapı kulesine yap.
 *  2. Yel Değirmenleri: denizin üstünde ters fazda gidip gelen iki platform, aralarında yalnız iki karoluk değirmen
 *     adası (bayrak): fazla hızlı atlayan adayı aşar. İkinci platformdan yine iki karoluk bir adaya, oradan suyun
 *     içinden yükselen değirmenin duvarına atlanır ve sekerek tepesine çıkılır (ikinci sünger külahın üstünde).
 *  3. Dalyan Kaya Mezarları ve İztuzu: basamaktan mezar kayasının duvarına atla, sekerek tepesine çık. Gizli pul kayanın sol yüzündeki mezar odasında:
 *     karanlık ağızdan (%) girilir. Kanalı çatlak taşların üstünden durmadan geç; İztuzu'nun ıslak kumu kaydırır,
 *     kumun ortasında diken var.
 *  4. Ölüdeniz / Babadağ: basamaklardan ve yamacın duvarından tepeye tırman, lagünün üstünde tahtadan çatlak taşa,
 *     çatlak taştan tahtaya süzül (önce in, sonra yeniden yüksel: üçüncü sünger en yüksek tahtada); meydan kapısı kumsalda.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                                       C                      ',
      '                                                              ',
      '                                    ####          ####        ',
      '                                    ####          ####        ',
      '                                    ####          ####        ',
      '                                    ####    F     ####        ',
      '                                    ####   ####   ####        ',
      '                              ###   ####   ####   ####        ',
      '                              <##   ####   ####   ####        ',
      '                  ##  ##  ==  ###   ####   ####   ####        ',
      '              ##########      ###   ####   ####   ####        ',
      '              ##########      ###   ####   ####   ####        ',
      '          ### ##########      ###   ####   ####   ####        ',
      ' P  ?  n  ### ##########  e   ###   ####^^^####^^^####    l   ',
      '##############################################################',
      '##############################################################',
      '##############################################################',
      '##############################################################',
    ],
    [
      '                                       C                  ',
      '                                                          ',
      '                                      ####                ',
      '                                      ####                ',
      '                                      ####                ',
      '                                      ####                ',
      '                            f         ####                ',
      '                                      ####                ',
      '                                      ####                ',
      ' F ?  n   |MMM      |F |      MMM|    ####        e    l  ',
      '##########~~~~~~~~~~~##~~~~~~~~~~~##~~####~~~#############',
      '##########~~~~~~~~~~~##~~~~~~~~~~~##~~####~~~#############',
      '##########~~~~~~~~~~~##~~~~~~~~~~~##~~####~~~#############',
      '##########~~~~~~~~~~~##~~~~~~~~~~~##~~####~~~#############',
    ],
    [
      '                     ##########                             ',
      '                     ##########             f               ',
      '                     ##########                             ',
      '                     ##########                             ',
      '               ####  %   ######                             ',
      '  F ?  n       ####  %  $######   e                 ^^    l ',
      '######################################~~XXX~~XX~~iiiiiiii###',
      '######################################~~~~~~~~~~~###########',
      '######################################~~~~~~~~~~~###########',
      '######################################~~~~~~~~~~~###########',
    ],
    [
      '              ####                        C                     ',
      '              ####                                              ',
      '              ####   ==                  ==                     ',
      '              ####                                              ',
      '              ####        XX        XX                          ',
      '              ####                           ==                 ',
      '          ########             ==                               ',
      '          ########                                              ',
      '      ############                                              ',
      '  F ? ############                                    l     E   ',
      '##################~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~################',
      '##################~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~################',
      '##################~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~################',
      '##################~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~################',
    ],
  ],
}
