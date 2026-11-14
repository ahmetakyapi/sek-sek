import type { CityRoad } from './types'

/**
 * TASLAK: gerçek tasarım level-designer aşamasında. Bu harita yalnız oynanabilir bir iskelettir (çözücü geçer).
 * Amasya ana yolu, dört durak:
 *  1. Yalıboyu Evleri: ırmağa sarkan cumbalar basamak; evden eve atla. İlk elma en yüksek damda.
 *  2. Kral Kaya Mezarları: Harşena'nın kaya basamaklarından tepeye tırman (ikinci elma tepede). Gizli pul büyük
 *     kayanın sağ yüzündeki mezar odasında: karanlık ağızdan (%) girilir.
 *  3. Ferhat Su Kanalı: plaka kanalın kapağını çevirir. İlk plaka mavi köprüyü kurar, turuncuyu kaldırır;
 *     ikinci plaka turuncu köprüyü geri getirir. Üçüncü elma ikinci köprünün üstünde.
 *  4. Sultan II. Bayezid Külliyesi: iki kubbenin üstünden avluya; meydan kapısı avlunun sonunda.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                    C                                   ',
      '                                                        ',
      '                  #####          ####                   ',
      '            ####  #####   ####   ####                   ',
      ' P  ?  n  s ####  #####   ####   ####     e      l      ',
      '########################################################',
      '########################################################',
      '########################################################',
      '########################################################',
    ],
    [
      '                             C                      ',
      '                           ######                   ',
      '                           ######                   ',
      '                     ####  ######                   ',
      '                     ####  ######                   ',
      '               ####  ####  ###  %  ####             ',
      '  F ?  n       ####  ####  ###$ %  ####        l    ',
      '####################################################',
      '####################################################',
      '####################################################',
      '####################################################',
    ],
    [
      '                                   C                      ',
      '                                                          ',
      '  F ?  n    _                  _                     l    ',
      '###############]]]]]#############[[[[[####################',
      '###############~~~~~#############~~~~~####################',
      '###############~~~~~#############~~~~~####################',
      '###############~~~~~#############~~~~~####################',
    ],
    [
      '           ##          ##                           ',
      '          ####        ####                          ',
      ' F ?  l  ######      ######    e      l        E    ',
      '####################################################',
      '####################################################',
      '####################################################',
      '####################################################',
    ],
  ],
}
