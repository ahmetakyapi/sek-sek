import type { CityRoad } from './types'

/**
 * Muğla ana yolu, dört durak. Meltem arkadan eser (levels.ts wind +160) ve gerçek kuvvettir: havada sağa giden atlayış
 * uzar, sola giden kısalır; esinti ~5,7 sn'de güçlenip neredeyse diner. Ölçü (tam oyuncu, düz zemin, kutu yolu):
 * rüzgârsız 3,3 karo; sağa güçlü esintide 3,9; sola güçlü esintide 2,7, dinmişken 3,2. Zorluk rüzgârla düşünülen
 * atlayıştan, raylı platformdan, okun ve martının zamanlamasından, duvar sekmesi + dash zincirinden gelir.
 *  1. Bodrum Kalesi: basamaktan burca çık, mazgaldan gelen oka dikkat; iç kalenin duvarına sekerek tırman (ilk sünger),
 *     hendeğin üstünden sura in (bayrak), aynı sekmeyi dikenli hendeğin üstünde kapı kulesine yap; dibinde yengeç.
 *  2. Yel Değirmenleri: ters fazda gidip gelen iki raylı platform (aralıklar eşit); aradaki adanın sağ yarısı dikenli
 *     (arka rüzgâr atlayışı oraya taşır), ikinci platformun üstünde martı. Değirmen adasında bayrak; sonra suyun içinden
 *     tek karoluk üç değirmen taşı (3 karo ara: arka rüzgâr yardım eder, zayıf oyuncu esintiyle atlar), arada martı,
 *     değirmenin dibindeki mazgaldan taş hizasında ok gelir (adanın ucundaki taş oku durdurur, bayrağa varmaz).
 *     Son taştan değirmen duvarına atla, sekerek külaha çık (ikinci sünger), kanattan kıyıya süzül.
 *  3. Dalyan Kaya Mezarları ve İztuzu: kaya mezarının tepesine çık; gizli pul sol yüzdeki karanlık ağızda (%).
 *     Kanalı çatlak taşlardan durmadan geç (iki karo, sonra tek karo); İztuzu'nun ıslak kumunda yengeç ve diken.
 *  4. Babadağ / Ölüdeniz: yamacın zikzak tahtaları (tek yönlü; sağa arka rüzgâr, sola karşı rüzgâr: güçlü esintide kısa
 *     kalır), aralarında martı; zirvede bayrak, üçüncü sünger dikenin üstünde. Lagünün üstünde süzül (çatlak taş, tahta,
 *     tek çatlak taş: rüzgâr aşırtır), kaya iğnesinin duvarına seker, tepesinden karşı kayaya zıplayıp dash at
 *     (5 karo; karşı kayadaki mazgal iğneye ok atar, iki ok arasında geç). Meydan kapısı kumsalda.
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
      ' P  ?  n  ### ##########  e   ###   ####^^^####^^^####   el   ',
      '##############################################################',
      '##############################################################',
      '##############################################################',
      '##############################################################',
    ],
    [
      '                                                                      ',
      '                                                                      ',
      '                                                                      ',
      '                                                     C                ',
      '                                                                      ',
      '                                                       ^              ',
      '                                                    ####              ',
      '                                                    ####              ',
      '                                                    ####              ',
      '                                                    ####              ',
      '                            f                f      ####   ==         ',
      '                                                    ####              ',
      '                                                    ####              ',
      ' F ?  n   |MMM      | ^|      MMM| F #              <###         e  l ',
      '##########~~~~~~~~~~~##~~~~~~~~~~~####~~~#~~~#~~~#~~####~~~~~~########',
      '##########~~~~~~~~~~~##~~~~~~~~~~~####~~~#~~~#~~~#~~####~~~~~~########',
      '##########~~~~~~~~~~~##~~~~~~~~~~~####~~~#~~~#~~~#~~####~~~~~~########',
      '##########~~~~~~~~~~~##~~~~~~~~~~~####~~~#~~~#~~~#~~####~~~~~~########',
    ],
    [
      '                     ##########                             ',
      '                     ##########             f               ',
      '                     ##########                             ',
      '                     ##########                             ',
      '               ####  %   ######                             ',
      '  F ?  n       ####  %  $######   e              e  ^^    l ',
      '######################################~~XX~~~X~~~iiiiiiii###',
      '######################################~~~~~~~~~~~###########',
      '######################################~~~~~~~~~~~###########',
      '######################################~~~~~~~~~~~###########',
    ],
    [
      '                  C                                             ',
      '              F ^^                                              ',
      '            ########                                            ',
      '            ########          f                                 ',
      '        ==                                                      ',
      '                       XX            ##        <                ',
      '            ==                       ##     ####                ',
      '                            ==       ##     ####                ',
      '        ==                           ##     ####                ',
      '          f                      X   ##     ####                ',
      '            ==                       ##     ####                ',
      '                                     ##     ####                ',
      '        ==                           ##     ####                ',
      '  F ?                                ##     ####      l e   E   ',
      '######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~##~~~~~####~~~~~###########',
      '######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~##~~~~~####~~~~~###########',
      '######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~##~~~~~####~~~~~###########',
      '######~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~##~~~~~####~~~~~###########',
    ],
  ],
}
