import type { CityRoad } from './types'

/**
 * Samsun ana yolu, dört parça (Zor: dash + duvar sekmesi + zamanlama; halat L, teleferik R, derin su W).
 *  1. Liman ve Bandırma Vapuru (Doğu Park): Pideci Recai Usta'nın tezgâhı rıhtımda. İskele tahtasından güverteye çıkılır.
 *     Ön direğin serenden sarkan halatı güvertenin üstündedir (güvenli): tırman, gözcü yerine atla, ilk pide orada.
 *     Ambar ağzı önce boş bir çukurla dash'i öğretir, sonra dikenli ambar. Kıçta vinç kolundan sarkan halat liman
 *     suyunun üstündedir: güverteden halata, halattan karşı iskeleye.
 *  2. Atakum sahili: kumdaki sığ havuz yüzmeyi öğretir (zıpla: kulaç). Denizde dalgakıran taşları; düşen yüzer.
 *     Mendirek başında sarkan fenerle duvar arasında duvardan duvara sekilir; tepeden basamaklarla inip dikenli midye
 *     kayalığının üstünden dash.
 *  3. Amisos Tepesi teleferiği: sığ hendeğin üstünde kısa tel (öğret), sonra dikenli vadide iki tel: ilki ara direğin
 *     üstünde biter, ikincisi tepenin üstünde. Tepedeki tümülüsün başında ikinci pide; tümülüsün doğu yüzünde karanlık
 *     ağız (%), içinde gizli pul (Duru: "üstünden geçince dönüp arkasına bak").
 *  4. Kızılırmak Deltası: lagünde balıkçı setinin altından kısa dalış (öğret), sonra sazlık kıyının altından uzun dalış
 *     (5 karo, nefesten çok kısa). Kuş gözetleme kulesi kat kat tahta; tepesinde üçüncü pide. Tepeden ovaya koşarak zıpla
 *     + dash (altta diken). Meydan kapısı ovanın ucunda.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                     ##                                                 ',
      '                      L                                                 ',
      '                      L   C                                             ',
      '                      L =====                                ###        ',
      '                      L                                       L         ',
      '                      L                                       L         ',
      '                      L                                       L         ',
      '                      L                                       L         ',
      '                      L                                       L         ',
      '                                                              L         ',
      '                                      e             F         L         ',
      '                ###############     ######^^^^^#############  L  #######',
      '                ############################################  L  #######',
      '           ==== ############################################     #######',
      ' P  ?  n s      ############################################     #######',
      '##############~~############################################~~~~~#######',
      '##############~~############################################~~~~~#######',
      '##############~~############################################~~~~~#######',
      '##############~~############################################~~~~~#######',
    ],
    [
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                                                        ',
      '                                       ##                               ',
      '                                       ##                               ',
      '                                       ##                               ',
      '                                       ##                               ',
      '                                       ##                               ',
      '                                       ##                               ',
      '                                       ##   ############                ',
      '                                       ##   ############                ',
      '                                       ##   ##############              ',
      '                                       ##   ##############              ',
      '                                       ##   ################     #######',
      '                                       ##   ################     #######',
      '                                            ################     #######',
      '                                            ################     #######',
      '                          ###   ###  ###    ################     #######',
      ' F  ?  n          e k     ###   ###  ###    ################     #######',
      '###########WWWW########WWW###WWW###WW###WWWW################^^^^^#######',
      '###########WWWW########WWW###WWW###WW###WWWW############################',
      '#######################WWW###WWW###WW###WWWW############################',
      '########################################################################',
    ],
    [
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                            ',
      '                                                                  C         ',
      '                                                                #####       ',
      '                                         RRRRRRRRRRRRRRRRRR     #####       ',
      '                         RRRRRRRRRRRRRRRRRR                   ####### %     ',
      '                                                          F   #######$%  e  ',
      '                                                        ####################',
      '                                        ###             ####################',
      '         RRRRRRRRRR     ####            ###             ####################',
      '                        ####            ###             ####################',
      '                    ########            ###             ####################',
      ' F  ?  n            ########            ###             ####################',
      '##########        ##########^^^^^^^^^^^^###^^^^^^^^^^^^^####################',
      '##########        ##########################################################',
      '############################################################################',
      '############################################################################',
    ],
    [
      '                                                                                ',
      '                                                                                ',
      '                                                                                ',
      '                                                                                ',
      '                                                                                ',
      '                                                                                ',
      '                                                                                ',
      '                                                   C                            ',
      '                                                 =====            k          E  ',
      '                                                           #####################',
      '                                                ===        #####################',
      '                                                           #####################',
      '                            #####                  ===     #####################',
      '                            #####                          #####################',
      '                            #####               ===        #####################',
      '              ##            #####                          #####################',
      '              ##            #####                  ===     #####################',
      '              ##            #####                          #####################',
      '              ##            #####               ===        #####################',
      ' F  ?  n      ##            #####       F e   ?            #####################',
      '##########WWWW##WWWW####WWWW#####WWWWW#################^^^^^####################',
      '##########WWWWWWWWWW####WWWWWWWWWWWWWW##########################################',
      '##########WWWWWWWWWW####WWWWWWWWWWWWWW##########################################',
      '################################################################################',
    ],
  ],
}
