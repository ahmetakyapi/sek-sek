import type { CityRoad } from './types'

/**
 * Artvin ana yolu, dört durak (Zor: dash, duvar sekmesi ve iki yeni mekanik; her biri önce güvenli yerde):
 *  1. Yamaca tutunmuş evler: damdan dama yokuş yukarı. Beşinci evin önündeki beş karoluk aralık dash ister; sonra
 *     asılı cumbayla kule evin arasında duvardan duvara sekilir. Kule evin damında ilk petek.
 *  2. Köy teleferiği: önce sığ, güvenli bir hendeğin üstünde kısa, alçak tel. Sonra derin vadide iki tel: ilki ara
 *     direğin üstünde biter (in, yeniden zıpla), ikincisi daha yüksektir. İkinci telin ta ucunda, varış istasyonunun
 *     üstünde ikinci petek (İsmet Amca: "telin ta öbür ucuna kaçmış").
 *  3. Çoruh vadisi: sarkan kayadan inen halatlar. İlk halatın altı yer; sonra Çoruh’un üstünde halattan halata,
 *     altı karoluk aralıkta zıpla + dash. Yarıklı kayanın üstündeki kısa halatın ucu yarığın ağzındadır: yarığın
 *     dibinde gizli pul (Doğan: "halatın en ucunda dur, aşağı bak"); yarıktan zıplayan halatı yeniden yakalar.
 *  4. Kafkasör Yaylası: alçak tel ara direğe, direkten yüksek telden sarkan halata; halatın tepesinden zıplayıp
 *     yüksek teli yakala, yaylaya in. Yüksek telin altındaki kaya iğnesinde üçüncü petek: tele değmez, iğneye inip
 *     yeniden tele zıplayan alır. Meydan kapısı güreş meydanının önünde.
 */
export const road: CityRoad = {
  chunks: [
    [
      '                                            ##    C                 ',
      '                                            ##  #####               ',
      '                                            ##  #####               ',
      '                                            ##  #####               ',
      '                                                #####               ',
      '                                                #####  ####         ',
      '                                                #####  ####         ',
      '                                ####     ############  ####         ',
      '                                ####     ############  ####         ',
      '                   #####   #########     ############  ####  ###    ',
      '                   #####   #########     ############  ####  ###    ',
      '            #####  #####   #########     ############  ####  ###    ',
      ' P  ?   n e #####  #####   #########     ############  ####  ###  t ',
      '#################^^#####^^^#########^^^^^############^^####^^#######',
      '####################################################################',
      '####################################################################',
      '####################################################################',
    ],
    [
      '                                         RRRRRRRRRRRRRRRRRRR        ',
      '                                                           C        ',
      '                            RRRRRRRRRRRRRR                          ',
      '                                                        n           ',
      '                                        ###            ######       ',
      '                             l          ###            ######       ',
      '          RRRRRRRR         #####        ###            ######       ',
      '                           #####        ###            #########    ',
      '                         #######        ###            #########    ',
      '  F  ?                   #######        ###            #########    ',
      '###########      ###############        ###            #############',
      '###########      ###############        ###            #############',
      '################################^^^^^^^^###^^^^^^^^^^^^#############',
      '####################################################################',
    ],
    [
      '          ############################################          ',
      '          ############################################          ',
      '          ############################################          ',
      '          ############################################          ',
      '          ############################################          ',
      '          ############################################          ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L      L     L   L              ',
      '            L        L    L     L     #  #   L   L              ',
      '            L  ####  L    L     L     #$ #   L   L   ######     ',
      '            L  ####  L    L     L     ####   L   L   ######     ',
      '            L  ####  L    L     L     ####   L   L   ######     ',
      '            L  ####  L    L     L     ####   L   L   ########   ',
      '               ####             L     ####           ########   ',
      '  F ?  n       ####                   ####           ########   ',
      '###################                   ####           ###########',
      '###################~~~~~~~~~~~~~~~~~~~####~~~~~~~~~~~###########',
      '###################~~~~~~~~~~~~~~~~~~~####~~~~~~~~~~~###########',
      '###################~~~~~~~~~~~~~~~~~~~####~~~~~~~~~~~###########',
    ],
    [
      '                            RRRRRRRRRRRRRRRRRRRRRRRRR                 ',
      '                            L                                         ',
      '                            L          C                              ',
      '                            L          ##              k    e  l  E   ',
      '                            L          ##       ######################',
      '                            L          ##       ######################',
      '         RRRRRRRRRRRRRRRR   L          ##       ######################',
      '                            L          ##       ######################',
      '                            L          ##       ######################',
      '                            L          ##       ######################',
      '        ###            ###  L          ##       ######################',
      '        ###            ###  L          ##       ######################',
      '      #####            ###  L          ##       ######################',
      '  F  ?#####            ###  L          ##       ######################',
      '###########            ###             ##       ######################',
      '###########            ###             ##       ######################',
      '###########^^^^^^^^^^^^###^^^^^^^^^^^^^##^^^^^^^######################',
      '######################################################################',
    ],
  ],
}
