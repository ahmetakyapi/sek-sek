import type { CityRoad } from './types'

/**
 * TASLAK: gerçek tasarım level-designer aşamasında. Bu harita yalnız oynanabilir bir iskelettir (çözücü geçer).
 * Muğla ana yolu, dört durak (rüzgâr batıdan, arkadan eser):
 *  1. Bodrum Kalesi: basamaktan burca çık, mazgalların üstünden yürü, aradaki tahtadan ikinci burca geç.
 *     İlk sünger iki burcun arasında, tahtanın üstünde.
 *  2. Yel Değirmenleri: denizin üstünde gidip gelen iki platform, arada değirmen adası. İkinci sünger ikinci
 *     platformun yolunda.
 *  3. Dalyan Kaya Mezarları ve İztuzu: kaya basamağından mezar kayasının tepesine çık. Gizli pul kayanın sol
 *     yüzündeki mezar odasında: karanlık ağızdan (%) girilir. Sonra dar bir su ve İztuzu'nun ıslak kumu.
 *  4. Ölüdeniz / Babadağ: yamaçtan tepeye çık, tahtadan tahtaya süzülerek in (üçüncü sünger ikinci tahtada);
 *     meydan kapısı kumsalın sonunda.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                                                          ',
      '                           C                              ',
      '              ##  ##  ##        ##  ##                    ',
      '              ##########        ######                    ',
      '         ###  ##########   ==   ######                    ',
      ' P  ?  n ###  ##########        ######    e         l     ',
      '##########################################################',
      '##########################################################',
      '##########################################################',
      '##########################################################',
    ],
    [
      '                               C                          ',
      '                                                          ',
      ' F ?  n  l|MMM       |  t    |MMM       |   l       e     ',
      '###########~~~~~~~~~~#########~~~~~~~~~~##################',
      '###########~~~~~~~~~~#########~~~~~~~~~~##################',
      '###########~~~~~~~~~~#########~~~~~~~~~~##################',
      '###########~~~~~~~~~~#########~~~~~~~~~~##################',
    ],
    [
      '                    ########                              ',
      '                    ########                              ',
      '              ####  ########                              ',
      '              ####  %  #####                              ',
      '  F ?  n      ####  % $#####                         l    ',
      '########################################~~~iiiiiiiiii#####',
      '########################################~~~###############',
      '########################################~~~###############',
      '########################################~~~###############',
    ],
    [
      '              ####                                            ',
      '              ####                                            ',
      '          ########    ===                                     ',
      '          ########            C                               ',
      '      ############          ===                               ',
      '      ############                  ===                       ',
      '  F ? ############                              l       E     ',
      '##############################################################',
      '##############################################################',
      '##############################################################',
      '##############################################################',
    ],
  ],
}
