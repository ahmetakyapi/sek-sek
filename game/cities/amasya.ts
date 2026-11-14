import type { CityRoad } from './types'

/**
 * Amasya ana yolu, dört durak (Çok Zor: her durak bir beceriyi ötekine ekler, sonuncusu hepsini ister):
 *  1. Yalıboyu Evleri: ilk ev karada, cumbası (=) basamak. Sonra Yeşilırmak: evden eve atla, beş karoluk açıklıkta
 *     dash at, çürük cumbalardan (X) durmadan sek, en yüksek dama cumbadan çık (ilk elma damın üstünde).
 *  2. Kral Kaya Mezarları (dikey): kaya basamakları sahanlığa çıkarır; oradan büyük kayanın yüzüyle asılı kaya arasında
 *     duvardan duvara sekilir (altı sahanlık: düşen yeniden dener). Tepede bayrak ve ikinci elma. Asılı kaya tepeden
 *     atlamayı keser: sağ yüzden süzülen mezar odasının eşiğine (=) iner. Gizli pul o odada, karanlık ağzın (%) ardında.
 *     Sonra aynı beceri dikenli yarığın üstünde: karşı kayanın yüzüne atla, tutun, bir kez daha sek; iniş çatlak
 *     taşlardan (X).
 *  3. Ferhat Su Kanalı (mantık): üç plaka, üç köprü. İlk plaka mavi köprüyü kurar, ikincisi turuncuyu geri getirir;
 *     üçüncü köprü yine mavi ama ikinci adada plaka yok. Üçüncü plaka geride ve yukarıda, su kemerinin ucunda:
 *     adadaki yarıktan sekerek kemere çık, geri yürü, bas, dön. Kemere ilk adadan çıkılmaz; köprüler dash’le aşılmaz
 *     (on karo). Kemerden ilk adaya düşen ikinci plakayla yolu yeniden kurar: kilitlenme yok. Üçüncü elma kemerin ucunda.
 *  4. Sultan II. Bayezid Külliyesi: şadırvan havuzunun üstünde iki sal, eşit aralık ve ters fazda (alttaki en solda,
 *     üstteki en sağda): ortada buluşunca alttakinden üsttekine atla. Orta kubbede bayrak; ikinci havuzda sal yolun
 *     yarısında döner, ucundan dash’le son kubbeye atlanır. Avluyu minare keser: asılı revakla minarenin arasında
 *     sekerek üstünden aş (üç beceri bir arada: zamanlama, dash, duvar sekmesi). Meydan kapısı avlunun sonunda.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                                                 C              ',
      '                                                                ',
      '                                                ###             ',
      '                                                ###             ',
      '                                              ==###             ',
      '                                       f        ###             ',
      '                                             ######             ',
      '                                             ######             ',
      '                                         XX  ######             ',
      '                                F            ######             ',
      '              #####   ####     ####  XX      ######    ###      ',
      '              #####   ####     ####          ######    ###      ',
      '            ==#####   ####     ####          ######    ###      ',
      ' P  ?  n  s   #####   ####     ####          ######    ###    l ',
      '###################~~~####~~~~~####~~~~~~~~~~######~~~~###~~####',
      '###################~~~####~~~~~####~~~~~~~~~~######~~~~###~~####',
      '###################~~~####~~~~~####~~~~~~~~~~######~~~~###~~####',
      '###################~~~####~~~~~####~~~~~~~~~~######~~~~###~~####',
    ],
    [
      '                 ##                  ##                         ',
      '                 ##          C       ##                         ',
      '                 ##                  ##                         ',
      '                 ##     F       e    ##                         ',
      '                 ##   ############   ##                         ',
      '                 ##   ############   ##                         ',
      '                 ##   ############   ##                         ',
      '                 ##   ############   ##                         ',
      '                 ##   ############           #####              ',
      '                      ############           #####              ',
      '                      #######   %%           #####              ',
      '                      #######$  %%           ##### XX           ',
      '                ##################== #####   #####              ',
      '                ##################   #####   #####              ',
      '              ####################   #####   #####    XX        ',
      '              ####################   #####   #####              ',
      '            ######################   #####   #####              ',
      '            ######################   #####   #####       XX     ',
      '          ########################   #####   #####              ',
      ' F ?  n   ########################   #####^^^#####^^^^^^^^^   l ',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
    ],
    [
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                                ##                  ',
      '                                     C          ##                  ',
      '                              f                 ##                  ',
      '                        _                       ##                  ',
      '                      #######################   ##                  ',
      '                                         ####   ##                  ',
      '                                         ####   ##                  ',
      '                                         ####   ##                  ',
      '                                                                    ',
      '                                                                    ',
      '                                             ##                     ',
      ' F ? n  _             _                      ##                  l  ',
      '##########]]]]]]]]]]########[[[[[[[[[[##############]]]]]]]]]]######',
      '##########~~~~~~~~~~########~~~~~~~~~~##############~~~~~~~~~~######',
      '##########~~~~~~~~~~########~~~~~~~~~~##############~~~~~~~~~~######',
      '##########~~~~~~~~~~########~~~~~~~~~~##############~~~~~~~~~~######',
    ],
    [
      '                                                                ##                    ',
      '                                                                ##                    ',
      '                                                                ##                    ',
      '                                                                ##                    ',
      '                                                                ##                    ',
      '                                                                ##                    ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                                                ##   ##               ',
      '                                    F                           ##   ##               ',
      '                      |        MMM#######MMM        |           ##   ##               ',
      '                                  #######                       ##   ##               ',
      '       ####MMM        |           #######                ######      ##               ',
      '       ####                       #######                ######      ##               ',
      '     ######                       #######                ######      ##               ',
      ' F ? ######                       #######                ######      ##      e    E   ',
      '###########~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~#############################',
      '###########~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~#############################',
      '###########~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~#############################',
      '###########~~~~~~~~~~~~~~~~~~~~~~~#######~~~~~~~~~~~~~~~~#############################',
    ],
  ],
}
